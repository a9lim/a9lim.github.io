#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/smoke.js — End-to-end execute smoke tests.

   Self-contained: doesn't depend on plasma's shipping shaders (which
   are mid-development in a parallel conversation). Each test embeds
   a tiny WGSL kernel, compiles it through the transpiler, runs it
   on canned input, and verifies the result.

   This is the gating check that the entire pipeline works:
   tokenize → parse → emit → eval → dispatch → produces correct math.
   ─────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import { compileWGSL, transpileWGSL, tokenize, parse, resolveModule, emit, runtime }
    from '../../shared-wgsl-transpile.js';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else      { fail++; console.log(`  ✗ ${name}${detail ? '  — ' + detail : ''}`); }
}

// ── Test 1: scalar fused-multiply-add over a 1D buffer ────────────
function testScalarFma() {
    console.log('test: scalar FMA over 1D buffer');

    const wgsl = `
        struct Uniforms { n: u32, scale: f32, offset: f32, _pad: f32, };
        @group(0) @binding(0) var<uniform> U: Uniforms;
        @group(0) @binding(1) var<storage, read>       input:  array<f32>;
        @group(0) @binding(2) var<storage, read_write> output: array<f32>;

        @compute @workgroup_size(8, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= U.n) { return; }
            output[i] = U.scale * input[i] + U.offset;
        }
    `;

    const mod = compileWGSL(wgsl);
    check('compile produces entry.main', !!mod.entry.main);
    check('bindings exposed', JSON.stringify(mod.bindings) === '["U","input","output"]');
    check('entryInfo exposes workgroup and global-loop metadata',
          JSON.stringify(mod.entryInfo?.main?.workgroupSize) === '[8,1,1]' &&
          mod.entryInfo.main.globalLoop === true &&
          mod.entryInfo.main.phases === 1);

    const N = 17;   // odd to exercise the early-out guard
    const input = new Array(N);
    const output = new Array(N);
    for (let i = 0; i < N; i++) { input[i] = i + 0.5; output[i] = NaN; }

    mod.entry.main({
        workgroups: [Math.ceil(N / 8), 1, 1],
        bindings: {
            U: { n: N, scale: 2.0, offset: 1.0, _pad: 0 },
            input, output,
        },
    });

    let allCorrect = true;
    for (let i = 0; i < N; i++) {
        const want = 2.0 * (i + 0.5) + 1.0;
        if (Math.abs(output[i] - want) > 1e-6) {
            allCorrect = false;
            console.log(`    [${i}] expected ${want}, got ${output[i]}`);
        }
    }
    check('output matches y = 2x + 1', allCorrect);
}

// ── Test 2: vec4 arithmetic with member access ────────────────────
function testVec4Arith() {
    console.log('test: vec4 arithmetic + member access');

    const wgsl = `
        struct U { n: u32, k: f32, _a: f32, _b: f32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read>       a: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read>       b: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> out: array<vec4<f32>>;

        @compute @workgroup_size(4, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= U_buf.n) { return; }
            let av = a[i];
            let bv = b[i];
            out[i] = av + U_buf.k * bv;
        }
    `;

    const mod = compileWGSL(wgsl);
    const N = 5;
    const a = [], b = [], out = [];
    for (let i = 0; i < N; i++) {
        a.push({ x: i,     y: i + 1, z: i + 2, w: i + 3 });
        b.push({ x: i * 2, y: i * 3, z: i * 4, w: i * 5 });
        out.push({ x: NaN, y: NaN, z: NaN, w: NaN });
    }

    mod.entry.main({
        workgroups: [Math.ceil(N / 4), 1, 1],
        bindings: { U_buf: { n: N, k: 0.5, _a: 0, _b: 0 }, a, b, out },
    });

    const k = 0.5;
    let ok = true;
    for (let i = 0; i < N; i++) {
        const want = {
            x: a[i].x + k * b[i].x, y: a[i].y + k * b[i].y,
            z: a[i].z + k * b[i].z, w: a[i].w + k * b[i].w,
        };
        for (const c of ['x', 'y', 'z', 'w']) {
            if (Math.abs(out[i][c] - want[c]) > 1e-6) {
                ok = false;
                console.log(`    [${i}].${c}: expected ${want[c]}, got ${out[i][c]}`);
            }
        }
    }
    check('out = a + k*b elementwise', ok);
}

// ── Test 3: helper functions, constants, conditionals ────────────
function testHelpersAndControl() {
    console.log('test: helper fns + consts + if/else');

    const wgsl = `
        const ZERO_FLOOR: f32 = 1.0e-6;

        fn safe_recip(x: f32) -> f32 {
            if (abs(x) < ZERO_FLOOR) { return 0.0; }
            return 1.0 / x;
        }

        struct U { n: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read>       x:   array<f32>;
        @group(0) @binding(2) var<storage, read_write> y:   array<f32>;

        @compute @workgroup_size(8, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= U_buf.n) { return; }
            y[i] = safe_recip(x[i]);
        }
    `;

    const mod = compileWGSL(wgsl);
    const N = 6;
    // Include 0 to exercise the floor branch.
    const x = [0.0, 1.0, 2.0, -3.0, 0.5, 1e-12];
    const y = new Array(N).fill(NaN);

    mod.entry.main({
        workgroups: [Math.ceil(N / 8), 1, 1],
        bindings: { U_buf: { n: N, _a: 0, _b: 0, _c: 0 }, x, y },
    });

    const expected = x.map(v => Math.abs(v) < 1e-6 ? 0 : 1 / v);
    let ok = true;
    for (let i = 0; i < N; i++) {
        if (Math.abs(y[i] - expected[i]) > 1e-6) {
            ok = false;
            console.log(`    [${i}]: x=${x[i]}, expected ${expected[i]}, got ${y[i]}`);
        }
    }
    check('safe_recip handles zero + branches', ok);
}

// ── Test 4: workgroup-level atomic reduction ──────────────────────
// Each workgroup atomically accumulates a partial sum of its tile
// into a workgroup-local atomic, then the lid=0 invocation pushes
// that into a global atomic. Verifies phase splitting at barriers.
function testBarrierReduction() {
    console.log('test: barrier-split workgroup reduction');

    const wgsl = `
        struct U { n: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read>       input: array<f32>;
        @group(0) @binding(2) var<storage, read_write> total: atomic<u32>;

        var<workgroup> tile: atomic<u32>;

        @compute @workgroup_size(8, 1, 1)
        fn main(
            @builtin(global_invocation_id) gid: vec3<u32>,
            @builtin(local_invocation_index) lid: u32,
        ) {
            // Phase 0: reset workgroup-local accumulator
            if (lid == 0u) { atomicStore(&tile, 0u); }
            workgroupBarrier();

            // Phase 1: accumulate. We use u32 sums to dodge fp atomic
            // semantics — multiply by 1000 to keep precision.
            if (gid.x < U_buf.n) {
                let v = u32(input[gid.x] * 1000.0);
                atomicAdd(&tile, v);
            }
            workgroupBarrier();

            // Phase 2: one invocation per workgroup commits the tile
            // sum into the global total.
            if (lid == 0u) {
                let m = atomicLoad(&tile);
                atomicAdd(&total, m);
            }
        }
    `;

    const mod = compileWGSL(wgsl);
    const N = 23; // not a workgroup-size multiple, to exercise the early-out
    const input = new Array(N);
    let expected = 0;
    for (let i = 0; i < N; i++) {
        input[i] = (i + 1) * 0.1;
        expected += Math.floor(input[i] * 1000);
    }
    // Total is a single-element u32 atomic — caller passes an
    // indexable container so addressOf works.
    const total = [0];
    mod.entry.main({
        workgroups: [Math.ceil(N / 8), 1, 1],
        bindings: {
            U_buf: { n: N, _a: 0, _b: 0, _c: 0 },
            input,
            total,
        },
    });

    check(`total matches expected sum`, total[0] === expected,
          `got ${total[0]}, expected ${expected}`);
    check('workgroup reduction init phase optimized',
          mod.metrics.workgroupReductionInits === 1 &&
          mod.jsSource.includes('Optimized workgroup reduction init phase'));
}

function testSyntheticReductionSequenceEntry() {
    console.log('test: synthetic reset/reduce/finalize sequence entry');

    const wgsl = `
        struct U { n: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read>       input: array<f32>;
        @group(0) @binding(2) var<storage, read_write> total: atomic<u32>;
        @group(0) @binding(3) var<storage, read_write> out:   array<f32>;

        var<workgroup> tile: atomic<u32>;

        @compute @workgroup_size(1)
        fn reset() {
            atomicStore(&total, 0u);
        }

        @compute @workgroup_size(4, 1, 1)
        fn reduce(
            @builtin(global_invocation_id) gid: vec3<u32>,
            @builtin(local_invocation_index) lid: u32,
        ) {
            if (lid == 0u) { atomicStore(&tile, 0u); }
            workgroupBarrier();
            if (gid.x < U_buf.n) {
                atomicAdd(&tile, u32(input[gid.x] * 100.0));
            }
            workgroupBarrier();
            if (lid == 0u) {
                atomicAdd(&total, atomicLoad(&tile));
            }
        }

        @compute @workgroup_size(1)
        fn finalize() {
            out[0] = f32(atomicLoad(&total)) * 0.01;
        }
    `;

    const mod = compileWGSL(wgsl);
    const input = [1.25, 2.5, 3.75, 4.0, 5.5, 6.25, 7.0];
    const runExplicit = { total: [123], out: [NaN] };
    const runFused = { total: [123], out: [NaN] };
    const bindingsExplicit = { U_buf: { n: input.length, _a: 0, _b: 0, _c: 0 }, input, ...runExplicit };
    const bindingsFused = { U_buf: { n: input.length, _a: 0, _b: 0, _c: 0 }, input, ...runFused };
    const reduceWorkgroups = [Math.ceil(input.length / 4), 1, 1];

    mod.entry.reset({ workgroups: [1, 1, 1], bindings: bindingsExplicit });
    mod.entry.reduce({ workgroups: reduceWorkgroups, bindings: bindingsExplicit });
    mod.entry.finalize({ workgroups: [1, 1, 1], bindings: bindingsExplicit });

    mod.entry.reset_reduce_finalize({ workgroups: reduceWorkgroups, bindings: bindingsFused });

    const expected = input.reduce((a, b) => a + Math.floor(b * 100), 0) * 0.01;
    check('synthetic sequence entry is exposed with metadata',
          typeof mod.entry.reset_reduce_finalize === 'function' &&
          mod.entryInfo.reset_reduce_finalize?.sequence === true &&
          mod.entryInfo.reset_reduce_finalize.workgroupEntry === 'reduce');
    check('synthetic sequence matches explicit reset/reduce/finalize',
          Math.abs(runFused.out[0] - runExplicit.out[0]) < 1e-6 &&
          Math.abs(runFused.out[0] - expected) < 1e-6,
          `got ${runFused.out[0]}, expected ${expected}`);
}

// ── Test 5: resolver Expr coverage on a canonical kernel ──────────
//
// Catches regressions in the expression resolver: every Expr node in a
// kernel that exercises scalar + vec ops, swizzles, struct member
// access, control flow, intrinsics, and constructors should get a
// non-null .resolvedType. If this drops, phase-4 inline emit silently
// reverts to the slower polymorphic path for the affected nodes —
// correctness stays, perf erodes.
function testResolverCoverage() {
    console.log('test: resolver Expr coverage on canonical kernel');

    const wgsl = `
        struct Particle { pos: vec3<f32>, vel: vec3<f32>, mass: f32, };
        struct U { n: u32, dt: f32, g: f32, _p: f32, };
        @group(0) @binding(0) var<uniform>             uni: U;
        @group(0) @binding(1) var<storage, read_write> ps:  array<Particle>;

        const MAX_SPEED: f32 = 100.0;

        fn clampSpeed(v: vec3<f32>) -> vec3<f32> {
            let s = sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            if (s > MAX_SPEED) { return v * (MAX_SPEED / s); }
            return v;
        }

        @compute @workgroup_size(8, 1, 1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= uni.n) { return; }
            let p = ps[i];
            let gravity = vec3<f32>(0.0, -uni.g, 0.0);
            var v = p.vel + gravity * uni.dt;
            v = clampSpeed(v);
            let pos = p.pos + v * uni.dt;
            ps[i].pos = pos;
            ps[i].vel = v;
        }
    `;

    const ast = parse(tokenize(wgsl));
    resolveModule(ast);

    // Walk every Expr node, tally coverage.
    const EXPR_KINDS = new Set(['lit','paren','ident','bin','una','call','index','member']);
    let total = 0, typed = 0;
    const unresolvedSamples = [];
    const visitExpr = (e) => {
        if (!e || !e.kind) return;
        if (EXPR_KINDS.has(e.kind)) {
            total++;
            if (e.resolvedType != null) typed++;
            else if (unresolvedSamples.length < 4) {
                unresolvedSamples.push(`${e.kind}${e.name ? ':' + e.name : (e.callee ? '(' + e.callee + ')' : '')}`);
            }
        }
        switch (e.kind) {
            case 'paren':  visitExpr(e.value); break;
            case 'bin':    visitExpr(e.lhs); visitExpr(e.rhs); break;
            case 'una':    visitExpr(e.value); break;
            case 'call':   for (const a of e.args) visitExpr(a); break;
            case 'index':  visitExpr(e.value); visitExpr(e.index); break;
            case 'member': visitExpr(e.value); break;
        }
    };
    const visitStmt = (s) => {
        if (!s) return;
        switch (s.kind) {
            case 'let': case 'var': case 'const': if (s.value) visitExpr(s.value); break;
            case 'expr_stmt': visitExpr(s.expr); break;
            case 'assign': case 'compound': visitExpr(s.target); visitExpr(s.value); break;
            case 'postfix': visitExpr(s.target); break;
            case 'return': if (s.value) visitExpr(s.value); break;
            case 'if':
                visitExpr(s.cond);
                for (const x of s.then.stmts) visitStmt(x);
                if (s.else) {
                    if (s.else.kind === 'block') for (const x of s.else.stmts) visitStmt(x);
                    else visitStmt(s.else);
                }
                break;
            case 'for':
                if (s.init) visitStmt(s.init);
                if (s.cond) visitExpr(s.cond);
                if (s.update) visitStmt(s.update);
                for (const x of s.body.stmts) visitStmt(x);
                break;
            case 'while':
                if (s.cond) visitExpr(s.cond);
                for (const x of (s.body?.stmts ?? [])) visitStmt(x);
                break;
            case 'block': for (const x of s.stmts) visitStmt(x); break;
        }
    };
    for (const item of ast.items) {
        if (item.kind === 'fn') for (const s of item.body.stmts) visitStmt(s);
    }

    // Canonical kernel — chosen so every construct should resolve. Tight
    // threshold (100%) is intentional: any drop means a new gap to chase.
    check(`every Expr node typed (${typed}/${total})`,
          typed === total,
          unresolvedSamples.length ? `unresolved samples: ${unresolvedSamples.join(', ')}` : '');
}

// ── Test 6: inlining preserves correctness across a chain of vec helpers
// Guards step 1 of the optimization arc. Compiles the same shader twice
// — once with inlining enabled (the default), once with `opts.noInline`
// — and checks both produce identical output on the same input. Also
// checks the conditional-return path in clamp_speed-style helpers (one
// branch returns a fresh vec, the other returns the param directly):
// both must route through the scalarized result var without drift.
function testInlinePreservesOutput() {
    console.log('test: small-fn inlining preserves output');

    const wgsl = `
        struct Uniforms { n: u32, dt: f32, damping: f32, k: f32,
                          rest: f32, v_max: f32, _p0: f32, _p1: f32, };
        @group(0) @binding(0) var<uniform>             U:       Uniforms;
        @group(0) @binding(1) var<storage, read>       pos_in:  array<vec3<f32>>;
        @group(0) @binding(2) var<storage, read>       vel_in:  array<vec3<f32>>;
        @group(0) @binding(3) var<storage, read_write> pos_out: array<vec3<f32>>;
        @group(0) @binding(4) var<storage, read_write> vel_out: array<vec3<f32>>;

        fn safe_normalize(d: vec3<f32>) -> vec3<f32> {
            let len = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
            return d * (1.0 / max(len, 1e-6));
        }
        fn spring_force(p: vec3<f32>, q: vec3<f32>, k: f32, rest: f32) -> vec3<f32> {
            let d = q - p;
            let len = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
            let dir = d * (1.0 / max(len, 1e-6));
            return dir * (k * (len - rest));
        }
        fn clamp_speed(v: vec3<f32>, mx: f32) -> vec3<f32> {
            let s = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
            if (s > mx) { return v * (mx / s); }
            return v;
        }

        @compute @workgroup_size(8, 1, 1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= U.n) { return; }
            let p = pos_in[i];
            let v = vel_in[i];
            let j = min(i + 1u, U.n - 1u);
            let q = pos_in[j];
            let f = spring_force(p, q, U.k, U.rest);
            let drag = safe_normalize(v) * U.damping;
            let v_new = clamp_speed(v - drag + f * U.dt, U.v_max);
            let p_new = p + v_new * U.dt;
            pos_out[i] = p_new;
            vel_out[i] = v_new;
        }
    `;

    const N = 13;   // odd to exercise both >v_max and ≤v_max branches
    function makeInputs() {
        const pos_in  = new Array(N);
        const vel_in  = new Array(N);
        const pos_out = new Array(N);
        const vel_out = new Array(N);
        // Mix slow + fast particles so clamp_speed's branch hits both
        // arms across the buffer.
        for (let i = 0; i < N; i++) {
            pos_in[i]  = { x: i * 0.3, y: i * 0.1, z: -i * 0.2 };
            vel_in[i]  = { x: (i % 2 ? 30.0 : 0.3), y: 0.2, z: -0.1 };
            pos_out[i] = { x: 0, y: 0, z: 0 };
            vel_out[i] = { x: 0, y: 0, z: 0 };
        }
        return { pos_in, vel_in, pos_out, vel_out };
    }
    function run(opts) {
        const mod = compileWGSL(wgsl, opts);
        const inputs = makeInputs();
        mod.entry.step({
            workgroups: [Math.ceil(N / 8), 1, 1],
            bindings: {
                U: { n: N, dt: 0.05, damping: 0.1, k: 3.0,
                     rest: 0.5, v_max: 2.0, _p0: 0, _p1: 0 },
                pos_in: inputs.pos_in, vel_in: inputs.vel_in,
                pos_out: inputs.pos_out, vel_out: inputs.vel_out,
            },
        });
        return { pos: inputs.pos_out, vel: inputs.vel_out };
    }
    const inlined  = run({});                 // default: inlining on
    const noInline = run({ noInline: true }); // bypass path

    const EPS = 1e-6;
    let matched = true;
    for (let i = 0; i < N; i++) {
        for (const c of ['x', 'y', 'z']) {
            if (Math.abs(inlined.pos[i][c] - noInline.pos[i][c]) > EPS) matched = false;
            if (Math.abs(inlined.vel[i][c] - noInline.vel[i][c]) > EPS) matched = false;
        }
    }
    check('inlined output matches non-inlined on the same shader', matched,
          matched ? '' : `divergence at first mismatch: pos[0]=${JSON.stringify(inlined.pos[0])} vs ${JSON.stringify(noInline.pos[0])}`);

    // Bonus: output is nonzero (sanity — both paths actually executed).
    const nonzero = inlined.pos.some(p => p.x !== 0 || p.y !== 0 || p.z !== 0);
    check('output is nonzero', nonzero);
}

// ── Test 7: var SROA preserves correctness across compound assigns,
//          conditional reassignment, and whole-vec reads.
// Compares default (full optimization stack: resolveModule + inline +
// SROA) against polymorphic mode (no resolveModule, no inline, no SROA,
// just rt.* dispatch). The polymorphic path is the simplest correct
// pipeline; matching it means the full optimization stack — including
// the new `var` SROA work — preserves semantics end-to-end.
function testVarSroaPreservesOutput() {
    console.log('test: var SROA preserves output');

    const wgsl = `
        struct Uniforms {
            n: u32, k_attract: f32, k_repel: f32, dt: f32,
            drag: f32, _p0: f32, _p1: f32, _p2: f32,
        };
        @group(0) @binding(0) var<uniform>             U:   Uniforms;
        @group(0) @binding(1) var<storage, read>       pos: array<vec3<f32>>;
        @group(0) @binding(2) var<storage, read>       vel: array<vec3<f32>>;
        @group(0) @binding(3) var<storage, read_write> out: array<vec3<f32>>;

        @compute @workgroup_size(8, 1, 1)
        fn nbody(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= U.n) { return; }
            let p = pos[i];
            let v = vel[i];
            var force = vec3<f32>(0.0, 0.0, 0.0);
            for (var k = 1u; k <= 4u; k = k + 1u) {
                let j = (i + k) % U.n;
                let q = pos[j];
                let d = q - p;
                let r2 = d.x*d.x + d.y*d.y + d.z*d.z + 1e-6;
                let inv_r = 1.0 / sqrt(r2);
                let dir = d * inv_r;
                force += dir * (U.k_attract / r2);
                force -= dir * (U.k_repel * inv_r * inv_r * inv_r);
            }
            var damped = v;
            if (force.x*force.x + force.y*force.y + force.z*force.z > 1.0) {
                damped = v * 0.5;
            }
            let a = force - damped * U.drag;
            out[i] = p + (damped + a * U.dt) * U.dt;
        }
    `;

    const N = 11;   // small odd N — both branches of the if hit across the buffer
    function makeInputs() {
        const pos = new Array(N);
        const vel = new Array(N);
        const out = new Array(N);
        // Spread on a 3D pseudo-lattice; alternate high/low velocity so
        // the `force > 1` branch fires for some and not others.
        for (let i = 0; i < N; i++) {
            pos[i] = { x: (i % 3) - 1, y: ((i >> 1) % 3) - 1, z: ((i >> 2) % 3) - 1 };
            vel[i] = { x: i % 2 ? 2.0 : 0.1, y: 0.3, z: -0.2 };
            out[i] = { x: 0, y: 0, z: 0 };
        }
        return { pos, vel, out };
    }
    function run(opts) {
        const mod = compileWGSL(wgsl, opts);
        const inputs = makeInputs();
        mod.entry.nbody({
            workgroups: [Math.ceil(N / 8), 1, 1],
            bindings: {
                U: { n: N, k_attract: 0.05, k_repel: 0.01, dt: 0.01,
                     drag: 0.1, _p0: 0, _p1: 0, _p2: 0 },
                pos: inputs.pos, vel: inputs.vel, out: inputs.out,
            },
        });
        return inputs.out;
    }
    const optimized = run({});                       // full stack on
    const baseline  = run({ polymorphic: true });    // rt.* dispatch only

    const EPS = 1e-5;
    let matched = true;
    let firstMismatch = -1;
    for (let i = 0; i < N; i++) {
        for (const c of ['x', 'y', 'z']) {
            if (Math.abs(optimized[i][c] - baseline[i][c]) > EPS) {
                matched = false;
                if (firstMismatch < 0) firstMismatch = i;
            }
        }
    }
    check('full-opt output matches polymorphic baseline', matched,
          matched ? '' :
            `divergence at i=${firstMismatch}: opt=${JSON.stringify(optimized[firstMismatch])} vs base=${JSON.stringify(baseline[firstMismatch])}`);

    // Bonus: branch-coverage sanity. The fast-velocity particles should
    // produce different output than the slow ones (force-damping branch
    // would have fired). Without this check we'd silently pass a kernel
    // that no-ops everything.
    let differ = false;
    for (let i = 1; i < N; i++) {
        if (optimized[i].x !== optimized[0].x) { differ = true; break; }
    }
    check('outputs vary across particles (branch coverage sanity)', differ);
}

// ── Test 8: nested-inline preserves correctness.
// Helper-of-helper (`spring_force` calls `safe_normalize`). The inline
// pass mutates AST in place, so by the time `step` inlines
// `spring_force`, `spring_force` already contains a `labeled` block
// (the safe_normalize expansion) plus its `break_label` and
// `inline_return_set` synthetic stmts. The clone+rename helper has to
// recurse into those — pre-fix, it didn't, and the emitted JS
// referenced un-renamed names (`_inl_0_result.x` after step's outer
// rename) that threw ReferenceError at runtime.
//
// Three-way parity: full-opt vs noInline vs polymorphic. All three
// must produce bit-identical (within float epsilon) output. Polymorphic
// is the strictest reference (no resolveModule, no inline, no SROA);
// noInline isolates that the bug is specifically in the inline pass.
function testNestedInlinePreservesOutput() {
    console.log('test: nested-inline preserves output');

    const wgsl = `
        struct Params { n: u32, dt: f32, k: f32, damping: f32, };
        @group(0) @binding(0) var<uniform>             P:   Params;
        @group(0) @binding(1) var<storage, read>       pos: array<vec3<f32>>;
        @group(0) @binding(2) var<storage, read>       vel: array<vec3<f32>>;
        @group(0) @binding(3) var<storage, read_write> out: array<vec3<f32>>;

        fn safe_normalize(d: vec3<f32>) -> vec3<f32> {
            let l2 = d.x*d.x + d.y*d.y + d.z*d.z;
            let inv = 1.0 / sqrt(max(l2, 1e-12));
            return d * inv;
        }
        // Calls safe_normalize -- this is the nesting that triggered
        // the bug. Inline pass expands safe_normalize into spring_force
        // first; later, step's call to spring_force has to clone-rename
        // the already-expanded body correctly.
        fn spring_force(d: vec3<f32>, k: f32, rest: f32) -> vec3<f32> {
            let l = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
            let n = safe_normalize(d);
            return n * (k * (l - rest));
        }
        // A second nested helper -- early-return path (the if branch
        // returns a fresh vec, the fall-through returns the input).
        // Guards both legs of inline_return_set's clone+rename.
        fn clamp_speed(v: vec3<f32>, vmax: f32) -> vec3<f32> {
            let s2 = v.x*v.x + v.y*v.y + v.z*v.z;
            if (s2 > vmax * vmax) {
                let inv = vmax / sqrt(s2);
                return v * inv;
            }
            return v;
        }

        @compute @workgroup_size(8, 1, 1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= P.n) { return; }
            let pi = pos[i];
            let vi = vel[i];
            let pn = pos[(i + 1u) % P.n];
            let d = pn - pi;
            let f = spring_force(d, P.k, 1.0);
            let vnew = clamp_speed(vi * P.damping + f * P.dt, 10.0);
            out[i] = pi + vnew * P.dt;
        }
    `;

    const N = 13;
    function makeInputs() {
        const pos = new Array(N), vel = new Array(N), out = new Array(N);
        for (let i = 0; i < N; i++) {
            pos[i] = { x: i * 0.5, y: (i % 3) * 0.1, z: (i % 5) * 0.2 };
            vel[i] = { x: i % 2 ? 8.0 : 0.5, y: 0.3, z: -0.1 };
            out[i] = { x: 0, y: 0, z: 0 };
        }
        return { pos, vel, out };
    }
    function run(opts) {
        const mod = compileWGSL(wgsl, opts);
        const inputs = makeInputs();
        mod.entry.step({
            workgroups: [Math.ceil(N / 8), 1, 1],
            bindings: {
                P: { n: N, dt: 0.016, k: 4.0, damping: 0.98 },
                pos: inputs.pos, vel: inputs.vel, out: inputs.out,
            },
        });
        return inputs.out;
    }
    const fullOpt    = run({});
    const noInline   = run({ noInline: true });
    const polyBase   = run({ polymorphic: true });

    const EPS = 1e-5;
    function compare(a, b) {
        for (let i = 0; i < N; i++) {
            for (const c of ['x', 'y', 'z']) {
                if (Math.abs(a[i][c] - b[i][c]) > EPS) {
                    return { ok: false, i, c, a: a[i], b: b[i] };
                }
            }
        }
        return { ok: true };
    }
    const ab = compare(fullOpt, polyBase);
    check('full-opt matches polymorphic on nested helpers', ab.ok,
          ab.ok ? '' : `i=${ab.i}.${ab.c}: opt=${JSON.stringify(ab.a)} base=${JSON.stringify(ab.b)}`);
    const ac = compare(fullOpt, noInline);
    check('full-opt matches noInline on nested helpers', ac.ok,
          ac.ok ? '' : `i=${ac.i}.${ac.c}: opt=${JSON.stringify(ac.a)} noInl=${JSON.stringify(ac.b)}`);

    // Branch-coverage sanity: the fast-vel particles should differ from
    // the slow ones (clamp_speed's early-return branch fires for one
    // group, the fall-through for the other).
    let differ = false;
    for (let i = 1; i < N; i++) {
        if (fullOpt[i].x !== fullOpt[0].x) { differ = true; break; }
    }
    check('outputs vary across particles (branch coverage sanity)', differ);
}

// ── Test 9: flat TypedArray storage mode preserves correctness.
// Same kernel, two runs:
//   (a) default mode -- bindings.X is an array of {x,y,z} objects
//   (b) flatStorage: true -- bindings.X is a packed Float32Array of
//       length N*3
// The two must produce bit-identical outputs (within float epsilon).
// This is the parity gate for Tier 3. Exercises: storage reads
// (both whole-vec and per-component), write-through stores, an
// accumulator pattern, and a helper call -- all the emit paths that
// gain new branches under flat-mode.
function testFlatStorageMode() {
    console.log('test: flat TypedArray storage mode preserves output');

    const wgsl = `
        struct Params { n: u32, k: f32, damping: f32, dt: f32, };
        @group(0) @binding(0) var<uniform>             P:   Params;
        @group(0) @binding(1) var<storage, read>       pos: array<vec3<f32>>;
        @group(0) @binding(2) var<storage, read>       vel: array<vec3<f32>>;
        @group(0) @binding(3) var<storage, read_write> out: array<vec3<f32>>;

        fn safe_normalize(d: vec3<f32>) -> vec3<f32> {
            let l2 = d.x*d.x + d.y*d.y + d.z*d.z;
            let inv = 1.0 / sqrt(max(l2, 1e-12));
            return d * inv;
        }

        @compute @workgroup_size(8, 1, 1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= P.n) { return; }
            let pi = pos[i];                 // whole-vec storage read
            let vi = vel[i];
            let pn = pos[(i + 1u) % P.n];
            let d  = pn - pi;
            let dir = safe_normalize(d);     // helper crossing fn boundary
            let l   = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
            let f   = dir * (P.k * (l - 1.0));
            let vnew = vi * P.damping + f * P.dt;
            out[i] = pi + vnew * P.dt;       // write-through store
        }
    `;

    const N = 13;
    function makeObjInputs() {
        const pos = new Array(N), vel = new Array(N), out = new Array(N);
        for (let i = 0; i < N; i++) {
            pos[i] = { x: i * 0.5, y: (i % 3) * 0.1, z: (i % 5) * 0.2 };
            vel[i] = { x: i % 2 ? 0.8 : 0.05, y: 0.3, z: -0.1 };
            out[i] = { x: 0, y: 0, z: 0 };
        }
        return { pos, vel, out };
    }
    function makeFlatInputs() {
        const pos = new Float32Array(N * 3);
        const vel = new Float32Array(N * 3);
        const out = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i*3+0] = i * 0.5; pos[i*3+1] = (i % 3) * 0.1; pos[i*3+2] = (i % 5) * 0.2;
            vel[i*3+0] = i % 2 ? 0.8 : 0.05; vel[i*3+1] = 0.3; vel[i*3+2] = -0.1;
        }
        return { pos, vel, out };
    }
    function runObj() {
        const mod = compileWGSL(wgsl);
        const inputs = makeObjInputs();
        mod.entry.step({
            workgroups: [Math.ceil(N / 8), 1, 1],
            bindings: { P: { n: N, k: 4.0, damping: 0.98, dt: 0.016 },
                        pos: inputs.pos, vel: inputs.vel, out: inputs.out },
        });
        return inputs.out.map(v => [v.x, v.y, v.z]);
    }
    function runFlat() {
        const mod = compileWGSL(wgsl, { flatStorage: true });
        const inputs = makeFlatInputs();
        mod.entry.step({
            workgroups: [Math.ceil(N / 8), 1, 1],
            bindings: { P: { n: N, k: 4.0, damping: 0.98, dt: 0.016 },
                        pos: inputs.pos, vel: inputs.vel, out: inputs.out },
        });
        const out = [];
        for (let i = 0; i < N; i++) {
            out.push([inputs.out[i*3+0], inputs.out[i*3+1], inputs.out[i*3+2]]);
        }
        return out;
    }
    const objOut  = runObj();
    const flatOut = runFlat();

    const EPS = 1e-5;
    let ok = true, firstFail = -1;
    for (let i = 0; i < N; i++) {
        for (let c = 0; c < 3; c++) {
            if (Math.abs(objOut[i][c] - flatOut[i][c]) > EPS) {
                ok = false;
                if (firstFail < 0) firstFail = i;
            }
        }
    }
    check('flat-storage output matches object-mode output', ok,
          ok ? '' : `i=${firstFail}: obj=${JSON.stringify(objOut[firstFail])} flat=${JSON.stringify(flatOut[firstFail])}`);

    // Branch-coverage sanity: outputs should differ across particles.
    let differ = false;
    for (let i = 1; i < N; i++) {
        if (flatOut[i][0] !== flatOut[0][0]) { differ = true; break; }
    }
    check('flat outputs vary across particles', differ);

    // Confirm flat-mode actually writes into the TypedArray (not a no-op).
    let nonzero = false;
    for (let i = 0; i < N; i++) {
        if (flatOut[i][0] !== 0 || flatOut[i][1] !== 0 || flatOut[i][2] !== 0) { nonzero = true; break; }
    }
    check('flat outputs nonzero (TypedArray actually written)', nonzero);

    const selective = compileWGSL(wgsl, { flatStorage: true, flatStorageBindings: ['out'] });
    const selectiveObj = makeObjInputs();
    const selectiveOut = new Float32Array(N * 3);
    selective.entry.step({
        workgroups: [Math.ceil(N / 8), 1, 1],
        bindings: { P: { n: N, k: 4.0, damping: 0.98, dt: 0.016 },
                    pos: selectiveObj.pos, vel: selectiveObj.vel, out: selectiveOut },
    });
    let selectiveOK = true;
    for (let i = 0; i < N; i++) {
        for (let c = 0; c < 3; c++) {
            if (Math.abs(objOut[i][c] - selectiveOut[i*3+c]) > EPS) selectiveOK = false;
        }
    }
    check('selective flat-storage flattens only allow-listed bindings',
          selectiveOK &&
          selective.jsSource.includes('_b_out[_wbase + 0]') &&
          !selective.jsSource.includes('_b_pos[_b +') &&
          !selective.jsSource.includes('_b_vel[_b +'));
}

function testFlatStructStorageMode() {
    console.log('test: flat array<struct> storage mode preserves output');

    const wgsl = `
        struct Params { n: u32, dt: f32, _a: f32, _b: f32, };
        struct Particle { pos: vec3<f32>, mass: f32, vel: vec3<f32>, charge: f32, };
        @group(0) @binding(0) var<uniform> P: Params;
        @group(0) @binding(1) var<storage, read>       input: array<Particle>;
        @group(0) @binding(2) var<storage, read_write> output: array<Particle>;

        @compute @workgroup_size(4, 1, 1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= P.n) { return; }
            let p = input[i];
            output[i].pos = p.pos + p.vel * P.dt;
            output[i].mass = p.mass + 1.0;
            output[i].vel += vec3<f32>(1.0, 2.0, 3.0);
            output[i].charge = p.charge;
        }
    `;

    const N = 7;
    function makeObj() {
        const input = new Array(N), output = new Array(N);
        for (let i = 0; i < N; i++) {
            input[i] = {
                pos: { x: i + 0.1, y: i + 0.2, z: i + 0.3 },
                mass: i + 10,
                vel: { x: i + 1, y: i + 2, z: i + 3 },
                charge: -i,
            };
            output[i] = {
                pos: { x: 0, y: 0, z: 0 },
                mass: 0,
                vel: { x: 0, y: 0, z: 0 },
                charge: 0,
            };
        }
        return { input, output };
    }
    function makeFlat() {
        const input = new Float32Array(N * 8);
        const output = new Float32Array(N * 8);
        for (let i = 0; i < N; i++) {
            const b = i * 8;
            input[b + 0] = i + 0.1; input[b + 1] = i + 0.2; input[b + 2] = i + 0.3;
            input[b + 3] = i + 10;
            input[b + 4] = i + 1; input[b + 5] = i + 2; input[b + 6] = i + 3;
            input[b + 7] = -i;
        }
        return { input, output };
    }
    const objMod = compileWGSL(wgsl);
    const obj = makeObj();
    objMod.entry.step({
        workgroups: [Math.ceil(N / 4), 1, 1],
        bindings: { P: { n: N, dt: 0.5, _a: 0, _b: 0 }, input: obj.input, output: obj.output },
    });

    const flatMod = compileWGSL(wgsl, { flatStorage: true });
    const flat = makeFlat();
    flatMod.entry.step({
        workgroups: [Math.ceil(N / 4), 1, 1],
        bindings: { P: { n: N, dt: 0.5, _a: 0, _b: 0 }, input: flat.input, output: flat.output },
    });

    let ok = true, first = -1;
    for (let i = 0; i < N; i++) {
        const b = i * 8;
        const want = [
            obj.output[i].pos.x, obj.output[i].pos.y, obj.output[i].pos.z,
            obj.output[i].mass,
            obj.output[i].vel.x, obj.output[i].vel.y, obj.output[i].vel.z,
            obj.output[i].charge,
        ];
        for (let k = 0; k < 8; k++) {
            if (Math.abs(want[k] - flat.output[b + k]) > 1e-5) {
                ok = false; if (first < 0) first = i;
            }
        }
    }
    check('flat struct output matches object-mode output', ok,
          ok ? '' : `first differing particle ${first}`);
    check('flat struct stride follows WGSL layout', flatMod.jsSource.includes('* 8'));

    function makeSoA() {
        const input = {
            pos: new Float32Array(N * 3),
            mass: new Float32Array(N),
            vel: new Float32Array(N * 3),
            charge: new Float32Array(N),
        };
        const output = {
            pos: new Float32Array(N * 3),
            mass: new Float32Array(N),
            vel: new Float32Array(N * 3),
            charge: new Float32Array(N),
        };
        for (let i = 0; i < N; i++) {
            input.pos[i * 3 + 0] = i + 0.1;
            input.pos[i * 3 + 1] = i + 0.2;
            input.pos[i * 3 + 2] = i + 0.3;
            input.mass[i] = i + 10;
            input.vel[i * 3 + 0] = i + 1;
            input.vel[i * 3 + 1] = i + 2;
            input.vel[i * 3 + 2] = i + 3;
            input.charge[i] = -i;
        }
        return { input, output };
    }
    const soaMod = compileWGSL(wgsl, {
        flatStorage: true,
        storageLayout: {
            input: { mode: 'soa' },
            output: { mode: 'soa' },
        },
    });
    const soa = makeSoA();
    soaMod.entry.step({
        workgroups: [Math.ceil(N / 4), 1, 1],
        bindings: { P: { n: N, dt: 0.5, _a: 0, _b: 0 }, input: soa.input, output: soa.output },
    });
    let soaOK = true;
    for (let i = 0; i < N; i++) {
        const want = obj.output[i];
        const pos = [soa.output.pos[i * 3], soa.output.pos[i * 3 + 1], soa.output.pos[i * 3 + 2]];
        const vel = [soa.output.vel[i * 3], soa.output.vel[i * 3 + 1], soa.output.vel[i * 3 + 2]];
        if (Math.abs(want.pos.x - pos[0]) > 1e-5 ||
            Math.abs(want.pos.y - pos[1]) > 1e-5 ||
            Math.abs(want.pos.z - pos[2]) > 1e-5 ||
            Math.abs(want.mass - soa.output.mass[i]) > 1e-5 ||
            Math.abs(want.vel.x - vel[0]) > 1e-5 ||
            Math.abs(want.vel.y - vel[1]) > 1e-5 ||
            Math.abs(want.vel.z - vel[2]) > 1e-5 ||
            Math.abs(want.charge - soa.output.charge[i]) > 1e-5) {
            soaOK = false;
        }
    }
    check('SoA flat struct output matches object-mode output', soaOK);
    check('SoA flat struct mode addresses field arrays directly',
          soaMod.jsSource.includes('_b_input.pos[') &&
          soaMod.jsSource.includes('_b_output.vel[') &&
          !soaMod.jsSource.includes('_b_output[_wbase +'));
}

function testStrictNumericAndIntrinsics() {
    console.log('test: strict numeric modes and intrinsic fallbacks');

    const wgsl = `
        struct Params { n: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> P: Params;
        @group(0) @binding(1) var<storage, read>       f_in: array<f32>;
        @group(0) @binding(2) var<storage, read_write> f_out: array<f32>;
        @group(0) @binding(3) var<storage, read_write> u_out: array<u32>;
        @group(0) @binding(4) var<storage, read_write> v_out: array<vec3<f32>>;

        @compute @workgroup_size(4, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i >= P.n) { return; }
            let y = (f_in[i] * 0.1 + 0.2) * 0.3;
            f_out[i] = y;
            let wrapped = 0xffffffffu + 2u;
            let picked = select(1u, 2u, true);
            let bits = bitcast<u32>(1.0);
            u_out[i] = wrapped + picked + arrayLength(&f_in) + bits;
            v_out[i] = normalize(vec3<f32>(0.0, 0.0, 0.0));
        }
    `;

    const mod = compileWGSL(wgsl, { strictInts: true, strictF32: true, safeNormalize: true });
    const f_in = [7.25, -3.5, 0.125];
    const f_out = [0, 0, 0];
    const u_out = [0, 0, 0];
    const v_out = [{x: 1, y: 1, z: 1}, {x: 1, y: 1, z: 1}, {x: 1, y: 1, z: 1}];
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: {
            P: { n: f_in.length, _a: 0, _b: 0, _c: 0 },
            f_in, f_out, u_out, v_out,
        },
    });
    const wantF = f_in.map(x => Math.fround(Math.fround(Math.fround(x * 0.1) + 0.2) * 0.3));
    check('strictF32 rounds scalar arithmetic per op',
          f_out.every((v, i) => Object.is(v, wantF[i]) || Math.abs(v - wantF[i]) < 1e-12));
    const wantU = (1 + 2 + f_in.length + 1065353216) >>> 0;
    check('strictInts + select + bitcast + arrayLength execute', u_out.every(v => v === wantU));
    check('safeNormalize keeps zero vector finite',
          v_out.every(v => v.x === 0 && v.y === 0 && v.z === 0));
}

function testBuildTimeTranspileAPI() {
    console.log('test: build-time transpile API emits source without eval');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            out[gid.x] = 42.0;
        }
    `;
    const built = transpileWGSL(wgsl);
    check('transpileWGSL returns entry metadata', JSON.stringify(built.entryPoints) === '["main"]');
    check('transpileWGSL returns entryInfo metadata',
          JSON.stringify(built.entryInfo?.main?.workgroupSize) === '[1,1,1]' &&
          built.entryInfo.main.globalLoop === true);
    check('transpileWGSL returns generated module source', built.jsSource.includes('export default function _wgsl_module'));
    const mod = compileWGSL(wgsl);
    const out = [0];
    const bound = mod.bind({ out });
    bound.main([1, 1, 1]);
    check('compileWGSL exposes prebound positional entry dispatch',
          out[0] === 42 && built.jsSource.includes('const bind = function'));
}

function testNumericAndRuntimeOptimizations() {
    console.log('test: numeric semantics, typed atomics, and runtime metrics');
    const wgsl = `
        struct P { n: u32, nanv: f32, _a: f32, _b: f32, };
        @group(0) @binding(0) var<uniform> P_buf: P;
        @group(0) @binding(1) var<storage, read_write> u_out: array<u32>;
        @group(0) @binding(2) var<storage, read_write> i_out: array<i32>;
        @group(0) @binding(3) var<storage, read_write> f_out: array<f32>;
        @group(0) @binding(4) var<storage, read_write> counts: array<atomic<u32>>;

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            if (gid.x >= P_buf.n) { return; }
            var x: u32 = 0xffffffffu;
            x += 2u;
            let shr = 0x80000000u >> 31u;
            let shl = (1u << 31u) >> 31u;
            let sar = -4 >> 1;
            u_out[gid.x] = x + shr + shl;
            i_out[gid.x] = sar;
            f_out[gid.x] = round(2.5) + round(3.5) + min(1.0, P_buf.nanv) + max(1.0, P_buf.nanv);
            f_out[gid.x + 1u] = clamp(P_buf.nanv, 0.0, 1.0);
            let old = atomicAdd(&counts[0], 2u);
            u_out[gid.x + 1u] = old;
        }
    `;
    const mod = compileWGSL(wgsl, { strictInts: true, strictF32: true });
    const u_out = [0, 0], i_out = [0], f_out = [0, 0], counts = [0xffffffff];
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { n: 1, nanv: NaN, _a: 0, _b: 0 }, u_out, i_out, f_out, counts },
    });
    check('u32 shifts and compound wrap correctly', u_out[0] === 3);
    check('i32 arithmetic right shift is signed', i_out[0] === -2);
    check('round/min/max follow WGSL-oriented scalar helpers', f_out[0] === 8);
    check('clamp preserves NaN semantics', Number.isNaN(f_out[1]));
    check('typed u32 atomic wraps on overflow and returns old value',
          counts[0] === 1 && u_out[1] === 0xffffffff);
    check('scalar compound lowering avoids polymorphic add dispatch',
          !mod.jsSource.includes('rt.add('));
    check('compileWGSL exposes generated-code metrics',
          mod.metrics && mod.metrics.bytes > 0 && Number.isInteger(mod.metrics.rtAtomic));
}

function testStabilityOptionHooks() {
    console.log('test: safe division and stable reduction options');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let a = vec3<f32>(3.0, 4.0, 12.0);
            let b = vec3<f32>(1.0, 2.0, 3.0);
            out[0] = 1.0 / 0.0;
            out[1] = dot(a, b);
            out[2] = length(a);
            out[3] = distance(a, b);
        }
    `;
    const mod = compileWGSL(wgsl, {
        safeDivisions: true,
        reductionMode: 'stable',
    });
    const out = [0, 0, 0, 0];
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    check('safeDivisions clamps scalar f32 division by zero',
          Number.isFinite(out[0]) && out[0] > 1e20);
    check('stable dot/length/distance execute with correct values',
          out[1] === 47 && out[2] === 13 && Math.abs(out[3] - Math.sqrt(89)) < 1e-12);
    check('stable reduction mode emits stable dot helper',
          mod.jsSource.includes('rt.dotStable('));
    check('stable reduction mode emits stable length helper',
          mod.jsSource.includes('rt.lengthStable('));
    check('safe division option emits typed scalar helper',
          mod.jsSource.includes('rt.safeDivScalar('));
}

function testFlatLayoutFiniteWritesAndSpecialization() {
    console.log('test: flat layout modes, finite writes, and specialization hooks');

    const layoutWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<vec3<f32>>;
        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            out[1] = vec3<f32>(1.0, 2.0, 3.0);
        }
    `;
    const layoutMod = compileWGSL(layoutWGSL, {
        flatStorage: true,
        flatStorageLayout: 'wgsl-storage',
    });
    const padded = new Float32Array(8);
    layoutMod.entry.main({ workgroups: [1, 1, 1], bindings: { out: padded } });
    check('wgsl-storage flat vec3 layout uses padded stride',
          padded[4] === 1 && padded[5] === 2 && padded[6] === 3 && padded[3] === 0);

    const finiteWGSL = `
        struct P { zero: f32, _a: f32, _b: f32, _c: f32, };
        @group(0) @binding(0) var<uniform> P_buf: P;
        @group(0) @binding(1) var<storage, read_write> out: array<f32>;
        @group(0) @binding(2) var<storage, read_write> vout: array<vec3<f32>>;
        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let bad = 1.0 / P_buf.zero;
            out[0] = bad;
            vout[0] = vec3<f32>(bad, 2.0, -bad);
        }
    `;
    const finiteMod = compileWGSL(finiteWGSL, {
        finiteWrites: true,
        finiteWriteBindings: ['out', 'vout'],
        finiteWriteFallback: -7,
    });
    const out = [0], vout = [{ x: 0, y: 0, z: 0 }];
    finiteMod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { zero: 0, _a: 0, _b: 0, _c: 0 }, out, vout },
    });
    check('finiteWrites sanitizes scalar storage writes', out[0] === -7);
    check('finiteWrites sanitizes object-mode vector component writes',
          vout[0].x === -7 && vout[0].y === 2 && vout[0].z === -7);

    const specWGSL = `
        struct U { k: f32, unusedField: f32, _a: f32, _b: f32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read_write> out: array<f32>;
        @group(0) @binding(2) var<storage, read_write> unused: array<f32>;
        @compute @workgroup_size(4, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            out[gid.x] = U_buf.k * 2.0;
        }
    `;
    const spec = transpileWGSL(specWGSL, {
        specializeUniforms: { U_buf: { k: 3 } },
    });
    check('uniform specialization emits literal field values',
          spec.jsSource.includes('3 * 2') || spec.jsSource.includes('(3) * 2'));
    check('entry-specific hoists skip unused storage bindings',
          !spec.jsSource.includes('_b_unused'));
    check('specialized uniform fields skip per-field aliases',
          !spec.jsSource.includes('_u_U_buf_k'));
    check('1D global dispatch specialization is emitted',
          spec.jsSource.includes('if (Gy === 1 && Gz === 1)'));

    const branchWGSL = `
        struct Mode { axis: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> mode: Mode;
        @group(0) @binding(1) var<storage, read_write> out: array<u32>;
        @compute @workgroup_size(1)
        fn main() {
            let axis = mode.axis;
            if (axis == 0u) {
                out[0] = 11u;
            } else {
                out[0] = 22u;
            }
        }
    `;
    const branchMod = compileWGSL(branchWGSL, {
        specializeUniforms: { mode: { axis: 0 } },
    });
    const branchOut = [0];
    branchMod.entry.main({ workgroups: [1, 1, 1], bindings: { out: branchOut } });
    check('uniform specialization prunes const-alias branch bodies',
          branchMod.metrics.staticBranchPrunes > 0 &&
          !branchMod.jsSource.includes('= 22') &&
          branchOut[0] === 11);
}

function testPhaseLocalReplayAcrossBarrier() {
    console.log('test: phase-local let replay across barrier');

    const wgsl = `
        struct Params { mode: u32, _a: u32, _b: u32, _c: u32, scale: f32, bias: f32, _d: f32, _e: f32, };
        @group(0) @binding(0) var<uniform> P: Params;
        @group(0) @binding(1) var<storage, read_write> out: array<f32>;

        var<workgroup> tile: array<f32, 4>;

        @compute @workgroup_size(4, 1, 1)
        fn main(
            @builtin(global_invocation_id) gid: vec3<u32>,
            @builtin(local_invocation_index) lid: u32,
        ) {
            let mode = P.mode;
            let idx = gid.x;
            let base = f32(mode) + P.scale;

            tile[lid] = base + f32(lid);
            workgroupBarrier();

            if (mode == 1u) {
                out[idx] = tile[lid] * base + P.bias;
            } else {
                out[idx] = -999.0;
            }
        }
    `;

    const mod = compileWGSL(wgsl, {
        specializeUniforms: { P: { mode: 1 } },
    });
    const out = new Array(4).fill(NaN);
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P: { scale: 2, bias: 0.25, _a: 0, _b: 0, _c: 0, _d: 0, _e: 0 }, out },
    });

    const want = [9.25, 12.25, 15.25, 18.25];
    check('pre-barrier locals replay into post-barrier phase',
          JSON.stringify(out) === JSON.stringify(want),
          `got ${JSON.stringify(out)}, expected ${JSON.stringify(want)}`);
    check('replayed specialized local prunes post-barrier branch',
          mod.metrics.staticBranchPrunes > 0 &&
          !mod.jsSource.includes('-999'));
}

function testFunctionParamSpecialization() {
    console.log('test: function-param specialization and static select');

    const wgsl = `
        struct U { axis: u32, _a: u32, _b: u32, _c: u32, };
        @group(0) @binding(0) var<uniform> U_buf: U;
        @group(0) @binding(1) var<storage, read_write> out: array<f32>;

        fn pick(a: f32, b: f32, axis: u32) -> f32 {
            let chosen = select(a, b, axis == 1u);
            if (axis == 1u) {
                return chosen + 10.0;
            }
            return chosen + 20.0;
        }

        @compute @workgroup_size(1)
        fn main() {
            out[0] = pick(2.0, 5.0, U_buf.axis);
        }
    `;

    const mod = compileWGSL(wgsl, {
        inlineNever: ['pick'],
        specializeUniforms: { U_buf: { axis: 1 } },
        specializeFunctionParams: { pick: { axis: 1 } },
    });
    const out = [NaN];
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    const helperSrc = mod.jsSource.slice(0, mod.jsSource.indexOf('const entry'));

    check('specialized helper param preserves output',
          out[0] === 15,
          `got ${out[0]}, expected 15`);
    check('specialized helper param prunes branch and select',
          mod.metrics.staticBranchPrunes > 0 &&
          helperSrc.includes('const chosen = b;') &&
          !helperSrc.includes('if ((axis == 1))') &&
          !helperSrc.includes('?'));
}

function testGeneratedCodeFastPaths() {
    console.log('test: generated-code fast paths for casts, 2D loops, vec ctors, and mixed intrinsics');
    const wgsl = `
        struct P { w: u32, h: u32, _a: u32, _b: u32, };
        @group(0) @binding(0) var<uniform> P_buf: P;
        @group(0) @binding(1) var<storage, read_write> color: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> ints: array<u32>;

        @compute @workgroup_size(4, 4, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            if (gid.x >= P_buf.w || gid.y >= P_buf.h) { return; }
            let idx = gid.y * P_buf.w + gid.x;
            let base = vec3<f32>(f32(gid.x) * 0.25, f32(gid.y) * 0.5, 0.25);
            let rgba = vec4<f32>(base.rgb, 1.0);
            let blend = mix(rgba, vec4<f32>(1.0), 0.25);
            color[idx] = clamp(blend, 0.0, 1.0);
            ints[0] = u32(i32(-1));
        }
    `;
    const mod = compileWGSL(wgsl);
    const color = Array.from({ length: 4 }, () => ({ x: 0, y: 0, z: 0, w: 0 }));
    const ints = [0];
    mod.entry.main({
        workgroups: [4, 4, 1],
        domain: [2, 2, 1],
        bindings: { P_buf: { w: 2, h: 2, _a: 0, _b: 0 }, color, ints },
    });

    check('2D global dispatch specialization is emitted',
          mod.jsSource.includes('else if (Gz === 1)'));
    check('2D origin-zero dispatch is row-major without divide/mod decode',
          mod.jsSource.includes('for (let __gy = 0, __rowBase = 0; __gy <') &&
          !mod.jsSource.includes('Math.floor(__g / Gx)'));
    check('canonical gid-bound guard clips loop limits instead of branching per cell',
          mod.jsSource.includes('const __clipXBound =') &&
          mod.jsSource.includes('const __clipYBound =') &&
          mod.jsSource.includes('Math.min(Gx, __clipXBound)') &&
          !mod.jsSource.includes('if (((gid_x >='));
    check('domain-sized CPU dispatch hook is emitted',
          mod.jsSource.includes('domain && domain[0]'));
    check('default scalar casts inline instead of calling rt.f32/u32/i32',
          !/\brt\.(?:f32|u32|i32)\(/.test(mod.jsSource));
    check('mixed vec/scalar mix and clamp inline without polymorphic dispatch',
          !/\brt\.(?:mix|clamp|clampScalar)\(/.test(mod.jsSource));
    check('vec constructor with vec argument flattens without rt.vec4',
          !/\brt\.vec4\(/.test(mod.jsSource));
    check('fast-path shader executes expected values',
          Math.abs(color[3].x - 0.4375) < 1e-6 &&
          Math.abs(color[3].y - 0.625) < 1e-6 &&
          Math.abs(color[3].z - 0.4375) < 1e-6 &&
          color[3].w === 1 &&
          ints[0] === 0xffffffff);
    const shardedColor = Array.from({ length: 16 }, () => ({ x: 0, y: 0, z: 0, w: 0 }));
    mod.entry.main({
        workgroups: [4, 4, 1],
        domain: [2, 2, 1],
        origin: [1, 1, 0],
        bindings: { P_buf: { w: 4, h: 4, _a: 0, _b: 0 }, color: shardedColor, ints: [0] },
    });
    check('origin offset preserves global_invocation_id for row-sharded CPU dispatch',
          shardedColor[0].w === 0 &&
          Math.abs(shardedColor[10].x - 0.625) < 1e-6 &&
          shardedColor[10].y === 1 &&
          Math.abs(shardedColor[10].z - 0.4375) < 1e-6 &&
          shardedColor[10].w === 1);
    check('origin-aware dispatch path is emitted',
          mod.jsSource.includes('origin && origin[0]') &&
          mod.jsSource.includes('if (Ox === 0 && Oy === 0)'));
    const paddedColor = Array.from({ length: 16 }, () => ({ x: -1, y: -1, z: -1, w: -1 }));
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { w: 2, h: 2, _a: 0, _b: 0 }, color: paddedColor, ints: [0] },
    });
    check('clipped loop preserves padded-dispatch guard semantics',
          paddedColor.slice(0, 4).every(px => px.w === 1) &&
          paddedColor.slice(4).every(px => px.w === -1));

    const dynamicReturnWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        @compute @workgroup_size(4, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            if (gid.x == 0u) { return; }
            out[gid.x] = 1.0;
        }
    `;
    const dynamicReturn = compileWGSL(dynamicReturnWGSL);
    check('non-clippable early-return entries keep invocation label',
          dynamicReturn.jsSource.includes('__invocation: {'));

    const noReturnWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        @compute @workgroup_size(4, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            out[gid.x] = f32(gid.x) * 2.0;
        }
    `;
    const noReturn = compileWGSL(noReturnWGSL);
    const noReturnOut = new Array(4).fill(NaN);
    noReturn.entry.main({ workgroups: [1, 1, 1], bindings: { out: noReturnOut } });
    check('no-return entries omit invocation label',
          !noReturn.jsSource.includes('__invocation: {') &&
          JSON.stringify(noReturnOut) === JSON.stringify([0, 2, 4, 6]));

    const profileWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        fn hot_helper(x: f32) -> f32 {
            var y = x;
            y += 1.0; y += 2.0; y += 3.0; y += 4.0;
            y += 5.0; y += 6.0; y += 7.0; y += 8.0;
            return y;
        }
        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            out[0] = hot_helper(1.0);
        }
    `;
    const cold = transpileWGSL(profileWGSL);
    const hot = transpileWGSL(profileWGSL, { inlineProfile: { hot_helper: { hotness: 1 } } });
    check('profile-guided inlining can lift the default statement budget',
          /function hot_helper/.test(cold.body) && !/function hot_helper/.test(hot.body));
}

function testFixedWorkgroupSpecialization() {
    console.log('test: fixed-workgroup dispatch specialization');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        @compute @workgroup_size(2, 2, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.y * 4u + gid.x;
            out[i] = f32(gid.x) + 10.0 * f32(gid.y);
        }
    `;
    const mod = compileWGSL(wgsl, { fixedWorkgroups: [2, 2, 1] });
    const out = new Float32Array(16);
    mod.entry.main({ workgroups: [99, 99, 1], bindings: { out } });
    let ok = true;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (out[y * 4 + x] !== x + 10 * y) ok = false;
        }
    }
    check('fixedWorkgroups bakes the dispatch size into execution',
          ok && out.length === 16);
    check('fixedWorkgroups skips runtime workgroup destructuring',
          mod.jsSource.includes('const Wx = 2, Wy = 2, Wz = 1;') &&
          !mod.jsSource.includes('const [Wx, Wy, Wz] = workgroups;'));
}

function testInlineActualCallCounts() {
    console.log('test: actual call-site counting for inlining caps');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        fn tiny(x: f32) -> f32 {
            return x + 1.0;
        }

        @compute @workgroup_size(1)
        fn main() {
            out[0] = tiny(1.0) + tiny(2.0);
        }
    `;

    const capped = compileWGSL(wgsl, { inlineCallLimit: 1 });
    const cappedOut = [NaN];
    capped.entry.main({ workgroups: [1, 1, 1], bindings: { out: cappedOut } });
    check('repeated calls in one expression count as separate inline sites',
          /function tiny/.test(capped.jsSource) && cappedOut[0] === 5);

    const allowed = compileWGSL(wgsl, { inlineCallLimit: 2 });
    const allowedOut = [NaN];
    allowed.entry.main({ workgroups: [1, 1, 1], bindings: { out: allowedOut } });
    check('call-site cap still allows exactly-budgeted repeated helper calls',
          !/function tiny/.test(allowed.jsSource) && allowedOut[0] === 5);

    const manyWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        fn bump(x: f32) -> f32 { return x + 1.0; }
        @compute @workgroup_size(1)
        fn main() {
            out[0] = bump(1.0) + bump(2.0) + bump(3.0) + bump(4.0) + bump(5.0) + bump(6.0);
        }
    `;
    const many = compileWGSL(manyWGSL);
    const manyOut = [NaN];
    many.entry.main({ workgroups: [1, 1, 1], bindings: { out: manyOut } });
    check('default inliner keeps tiny scalar helpers inline past call-count cap',
          !/function bump/.test(many.jsSource) && manyOut[0] === 27);

    const branchyWGSL = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;
        fn branchy(x: f32) -> f32 {
            var y = x;
            if (x > 0.0) {
                y += 1.0;
            } else {
                y -= 1.0;
            }
            y += 2.0;
            y += 3.0;
            return y;
        }
        @compute @workgroup_size(1)
        fn main() {
            out[0] = branchy(1.0);
        }
    `;
    const branchCold = compileWGSL(branchyWGSL);
    const branchHot = compileWGSL(branchyWGSL, { inlineHotFns: ['branchy'] });
    const branchOut = [NaN];
    branchCold.entry.main({ workgroups: [1, 1, 1], bindings: { out: branchOut } });
    check('default inliner avoids larger branchy helpers',
          /function branchy/.test(branchCold.jsSource) && branchOut[0] === 7);
    check('hot hint can still inline larger branchy helpers',
          !/function branchy/.test(branchHot.jsSource));
}

function testSwizzleStorePropagation() {
    console.log('test: multi-component swizzle store propagation');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<vec4<f32>>;

        @compute @workgroup_size(1)
        fn main() {
            var v = vec4<f32>(1.0, 2.0, 3.0, 4.0);
            v.xy = v.yx;
            v.zw = vec2<f32>(9.0, 8.0);
            out[0] = v;
            out[1] = vec4<f32>(10.0, 20.0, 30.0, 40.0);
            out[1].rgb = out[0].bgr;
            out[1].a = 99.0;
        }
    `;
    const mod = compileWGSL(wgsl, { flatStorage: true });
    const out = new Float32Array(8);
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    check('local swizzle stores preserve rotate and partial writes',
          out[0] === 2 && out[1] === 1 && out[2] === 9 && out[3] === 8);
    check('flat storage swizzle store writes selected components only',
          out[4] === 9 && out[5] === 1 && out[6] === 2 && out[7] === 99);
    check('swizzle stores lower to component writes instead of JS swizzle lvalues',
          !mod.jsSource.includes('.xy =') &&
          !mod.jsSource.includes('.rgb =') &&
          mod.jsSource.includes('_b_out[_wbase + 0]') &&
          mod.jsSource.includes('_b_out[_wbase + 2]'));
}

function testScalarReturnClone() {
    console.log('test: scalar-return clones for non-inlined vec helpers');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        fn pick(p: vec3<f32>) -> vec3<f32> {
            let q = p + vec3<f32>(1.0, 2.0, 3.0);
            return q;
        }

        @compute @workgroup_size(1)
        fn main() {
            out[0] = pick(vec3<f32>(3.0, 4.0, 5.0)).x +
                     pick(vec3<f32>(3.0, 4.0, 5.0)).z;
        }
    `;
    const mod = compileWGSL(wgsl, { noInline: true });
    const out = new Float32Array(1);
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    const xBody = mod.jsSource.match(/function __wgsl_ret_pick_x\([^)]*\) \{([\s\S]*?)\n    \}/)?.[1] || '';
    const zBody = mod.jsSource.match(/function __wgsl_ret_pick_z\([^)]*\) \{([\s\S]*?)\n    \}/)?.[1] || '';
    check('scalar-return clone preserves direct component-read output',
          Math.abs(out[0] - 12) < 1e-6);
    check('scalar-return clones are emitted for both used components',
          mod.jsSource.includes('function __wgsl_ret_pick_x') &&
          mod.jsSource.includes('function __wgsl_ret_pick_z'));
    check('component reads call scalar clones instead of helper(...).component',
          mod.jsSource.includes('__wgsl_ret_pick_x({') &&
          mod.jsSource.includes('__wgsl_ret_pick_z({') &&
          !mod.jsSource.includes('pick({x:3, y:4, z:5}).x'));
    check('scalar clone return path avoids vec object materialization',
          xBody.includes('return q_x;') &&
          zBody.includes('return q_z;') &&
          !xBody.includes('return {') &&
          !zBody.includes('return {'));
}

function testFixedArrayReturnSroa() {
    console.log('test: fixed-size array return SROA');
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> out: array<vec4<f32>>;

        fn pack_pair(a: vec4<f32>, b: vec4<f32>) -> array<vec4<f32>, 2> {
            let bias = vec4<f32>(0.5, 0.25, 0.125, 0.0);
            return array<vec4<f32>, 2>(a + bias, b * 2.0);
        }

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let pair = pack_pair(
                vec4<f32>(1.0, 2.0, 3.0, 4.0),
                vec4<f32>(5.0, 6.0, 7.0, 8.0),
            );
            out[0] = pair[0];
            out[1] = pair[1];
            out[2] = pair[0] + pair[1];
        }
    `;
    const mod = compileWGSL(wgsl, { flatStorage: true });
    const out = new Float32Array(12);
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    check('fixed array return executes through flat storage',
          out[0] === 1.5 && out[1] === 2.25 && out[2] === 3.125 && out[3] === 4 &&
          out[4] === 10 && out[5] === 12 && out[6] === 14 && out[7] === 16 &&
          out[8] === 11.5 && out[9] === 14.25 && out[10] === 17.125 && out[11] === 20);
    check('fixed array return helper is inlined',
          !/function pack_pair/.test(mod.jsSource));
    check('fixed array return avoids materializing the returned JS array',
          !/_inl_\d+_result\s*=\s*\[/.test(mod.jsSource) &&
          !/const pair\s*=\s*\[/.test(mod.jsSource));
}

function testNestedStructSroa() {
    console.log('test: nested struct SROA and struct-return scalarization');
    const wgsl = `
        struct Inner { v: vec3<f32>, q: f32, };
        struct Outer { a: Inner, b: Inner, };
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        fn make_inner(x: f32) -> Inner {
            return Inner(vec3<f32>(x, x + 1.0, x + 2.0), x + 3.0);
        }

        fn make_outer(x: f32) -> Outer {
            return Outer(make_inner(x), make_inner(x + 10.0));
        }

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            var o: Outer;
            o.a = make_inner(1.0);
            o.b = make_inner(10.0);
            let c = o.a.v + o.b.v;
            let d = make_outer(2.0);
            out[0] = c.x;
            out[1] = c.y;
            out[2] = c.z;
            out[3] = o.a.q + o.b.q;
            out[4] = d.a.v.y + d.b.q;
            o.a.v.x = o.a.v.y + 4.0;
            out[5] = o.a.v.x;
            let copied = o.a;
            out[6] = copied.v.z + copied.q;
        }
    `;
    const mod = compileWGSL(wgsl);
    const out = new Array(7).fill(NaN);
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });
    const want = [11, 13, 15, 17, 18, 6, 7];
    check('nested struct SROA executes with nested member writes',
          out.every((v, i) => Math.abs(v - want[i]) < 1e-6),
          `got ${JSON.stringify(out)}, expected ${JSON.stringify(want)}`);
    check('nested struct-return helpers are inlined',
          !/function make_inner/.test(mod.jsSource) && !/function make_outer/.test(mod.jsSource));
    check('nested struct returns avoid whole-object result materialization',
          !/_inl_\d+_result\s*=\s*\{/.test(mod.jsSource));
    check('nested struct locals avoid placeholder object fields',
          !/let\s+o_a\s*=\s*null/.test(mod.jsSource) &&
          !/let\s+copied_v\s*=\s*null/.test(mod.jsSource));
}

function testStructSroaAndPointerInlining() {
    console.log('test: mutable struct SROA and simple pointer inlining');
    const wgsl = `
        struct P { n: u32, _a: u32, _b: u32, _c: u32, };
        struct Particle { pos: vec3<f32>, mass: f32, vel: vec3<f32>, charge: f32, };
        @group(0) @binding(0) var<uniform> P_buf: P;
        @group(0) @binding(1) var<storage, read> input: array<Particle>;
        @group(0) @binding(2) var<storage, read_write> output: array<Particle>;

        fn tweak(p: ptr<function, Particle>) {
            (*p).charge += 5.0;
            (*p).mass += 1.0;
        }

        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            if (gid.x >= P_buf.n) { return; }
            var acc: Particle = input[gid.x];
            acc.pos += acc.vel;
            output[gid.x] = acc;
        }

        @compute @workgroup_size(1)
        fn ptr_main(@builtin(global_invocation_id) gid: vec3<u32>) {
            var acc: Particle = input[0];
            tweak(&acc);
            output[0] = acc;
        }
    `;
    const mod = compileWGSL(wgsl, { flatStorage: true, inlineOnly: ['tweak'] });
    const input = new Float32Array(8);
    const output = new Float32Array(8);
    input.set([1, 2, 3, 4, 10, 20, 30, 40]);
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { n: 1, _a: 0, _b: 0, _c: 0 }, input, output },
    });
    check('mutable struct SROA stores whole flat structs field-by-field',
          output[0] === 11 && output[1] === 22 && output[2] === 33 &&
          output[3] === 4 && output[4] === 10 && output[7] === 40);

    output.fill(0);
    mod.entry.ptr_main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { n: 1, _a: 0, _b: 0, _c: 0 }, input, output },
    });
    check('simple function pointer helper mutates local struct when inlined',
          output[3] === 5 && output[7] === 45);
    check('pointer helper was inlined rather than emitted as a call',
          !mod.jsSource.includes('function tweak'));
}

function testCorpusDerivedDispatchShader() {
    console.log('test: corpus-derived geon dispatch shader executes');
    const path = new URL('../../geon/src/gpu/shaders/dispatch-args.wgsl', import.meta.url);
    const src = `
        const MAX_PHOTONS: u32 = 1024u;
        const PION_POOL_CAP: u32 = 512u;
    ` + fs.readFileSync(path, 'utf8');
    const mod = compileWGSL(src, { strictInts: true });
    const dispatchArgs = new Array(12).fill(0);
    mod.entry.buildBosonDispatchArgs({
        workgroups: [1, 1, 1],
        bindings: {
            phCount: [130],
            piCount: [65],
            dispatchArgs,
        },
    });
    const wg64 = n => Math.max(1, Math.trunc((n + 63) / 64));
    const total = 130 + 65;
    const want = [
        wg64(130), 1, 1,
        wg64(65), 1, 1,
        wg64(total), 1, 1,
        wg64(total * 6), 1, 1,
    ];
    check('real dispatch-args shader writes expected records',
          JSON.stringify(dispatchArgs) === JSON.stringify(want),
          `got=${JSON.stringify(dispatchArgs)} want=${JSON.stringify(want)}`);
}

// ── Test: 2D workgroup-shared tile with conditional halo loads and a
// single top-level workgroupBarrier(). Unblocks plasma's PPM primitive
// cache and LIC contrast normalization passes, both of which use a
// halo-loaded shared tile larger than the workgroup with one barrier
// between load+halo and stencil-read phases.
//
// Kernel shape: 8x8 workgroup, 12x12 shared tile (2-cell halo on each
// side), 16x16 grid (exactly 2x2 workgroups so workgroup-boundary halo
// behavior is exercised). Each thread:
//   Phase A: load center cell into tile[lid.y+2][lid.x+2], plus
//            conditional halo loads (W when lid.x<2, E when lid.x>=6,
//            S when lid.y<2, N when lid.y>=6, four corners covered by
//            combined conditions). Halo source indices clamp at array
//            boundaries.
//   workgroupBarrier()
//   Phase B: read 5-point stencil from the tile (center + N + S + E + W),
//            write Laplacian = -4*center + N + S + E + W to output.
//
// A bug in halo loading or in barrier phase-splitting would surface as
// mismatches along the 8-cell-wide workgroup-internal boundaries (i.e.,
// at i=7,8 and j=7,8 in the 16x16 grid).
function testTwoDSharedTileHaloBarrier() {
    console.log('test: 2D shared tile + halo loads + top-level barrier');

    const wgsl = `
        struct Params { w: u32, h: u32, _a: u32, _b: u32, };
        @group(0) @binding(0) var<uniform>             P:      Params;
        @group(0) @binding(1) var<storage, read>       input:  array<f32>;
        @group(0) @binding(2) var<storage, read_write> output: array<f32>;

        var<workgroup> tile : array<array<f32, 12>, 12>;

        @compute @workgroup_size(8, 8, 1)
        fn lap(
            @builtin(global_invocation_id) gid: vec3<u32>,
            @builtin(local_invocation_id)  lid: vec3<u32>,
        ) {
            // Phase A: cooperative load. The 8x8 workgroup fills the
            // interior of the 12x12 tile; threads in the outer rings
            // additionally load halo cells.
            let gx = i32(gid.x);
            let gy = i32(gid.y);
            let lx = i32(lid.x);
            let ly = i32(lid.y);
            let wmax = i32(P.w) - 1;
            let hmax = i32(P.h) - 1;

            // Center cell (always).
            let cx = clamp(gx, 0, wmax);
            let cy = clamp(gy, 0, hmax);
            tile[ly + 2][lx + 2] = input[u32(cy) * P.w + u32(cx)];

            // W halo: lid.x < 2 loads the two cells to the west.
            if (lid.x < 2u) {
                let sx = clamp(gx - 2, 0, wmax);
                let sy = clamp(gy, 0, hmax);
                tile[ly + 2][lx] = input[u32(sy) * P.w + u32(sx)];
            }
            // E halo: lid.x >= 6 loads the two cells to the east.
            if (lid.x >= 6u) {
                let sx = clamp(gx + 2, 0, wmax);
                let sy = clamp(gy, 0, hmax);
                tile[ly + 2][lx + 4] = input[u32(sy) * P.w + u32(sx)];
            }
            // S halo.
            if (lid.y < 2u) {
                let sx = clamp(gx, 0, wmax);
                let sy = clamp(gy - 2, 0, hmax);
                tile[ly][lx + 2] = input[u32(sy) * P.w + u32(sx)];
            }
            // N halo.
            if (lid.y >= 6u) {
                let sx = clamp(gx, 0, wmax);
                let sy = clamp(gy + 2, 0, hmax);
                tile[ly + 4][lx + 2] = input[u32(sy) * P.w + u32(sx)];
            }
            // SW corner.
            if (lid.x < 2u && lid.y < 2u) {
                let sx = clamp(gx - 2, 0, wmax);
                let sy = clamp(gy - 2, 0, hmax);
                tile[ly][lx] = input[u32(sy) * P.w + u32(sx)];
            }
            // SE corner.
            if (lid.x >= 6u && lid.y < 2u) {
                let sx = clamp(gx + 2, 0, wmax);
                let sy = clamp(gy - 2, 0, hmax);
                tile[ly][lx + 4] = input[u32(sy) * P.w + u32(sx)];
            }
            // NW corner.
            if (lid.x < 2u && lid.y >= 6u) {
                let sx = clamp(gx - 2, 0, wmax);
                let sy = clamp(gy + 2, 0, hmax);
                tile[ly + 4][lx] = input[u32(sy) * P.w + u32(sx)];
            }
            // NE corner.
            if (lid.x >= 6u && lid.y >= 6u) {
                let sx = clamp(gx + 2, 0, wmax);
                let sy = clamp(gy + 2, 0, hmax);
                tile[ly + 4][lx + 4] = input[u32(sy) * P.w + u32(sx)];
            }

            workgroupBarrier();

            // Phase B: 5-point Laplacian stencil from the shared tile.
            if (gid.x < P.w && gid.y < P.h) {
                let c  = tile[ly + 2][lx + 2];
                let n_ = tile[ly + 3][lx + 2];
                let s_ = tile[ly + 1][lx + 2];
                let e_ = tile[ly + 2][lx + 3];
                let w_ = tile[ly + 2][lx + 1];
                output[gid.y * P.w + gid.x] = -4.0 * c + n_ + s_ + e_ + w_;
            }
        }
    `;

    const mod = compileWGSL(wgsl);
    check('2D scalar workgroup tile flattens to one reusable TypedArray',
          mod.metrics.flatWorkgroupArrays === 1 &&
          mod.metrics.flatWorkgroupSlots === 144 &&
          mod.jsSource.includes('new Float32Array(144)') &&
          !mod.jsSource.includes('Array.from({ length: 12 }'));

    const W = 16, H = 16;
    const input = new Array(W * H);
    const output = new Array(W * H).fill(NaN);
    for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
            const idx = j * W + i;
            input[idx] = Math.sin(0.1 * idx) + Math.cos(0.07 * idx);
        }
    }

    mod.entry.lap({
        workgroups: [W / 8, H / 8, 1],   // 2x2 = 4 workgroups
        bindings: { P: { w: W, h: H, _a: 0, _b: 0 }, input, output },
    });

    // Reference: same Laplacian on CPU, boundaries clamped (same as
    // the kernel's clamp(...)).
    const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
    const ref = new Array(W * H);
    for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
            const c  = input[j * W + i];
            const n_ = input[clamp(j + 1, 0, H - 1) * W + i];
            const s_ = input[clamp(j - 1, 0, H - 1) * W + i];
            const e_ = input[j * W + clamp(i + 1, 0, W - 1)];
            const w_ = input[j * W + clamp(i - 1, 0, W - 1)];
            ref[j * W + i] = -4 * c + n_ + s_ + e_ + w_;
        }
    }

    // Match every cell, with extra attention paid to the
    // workgroup-internal boundary (i=7,8 / j=7,8) where halo correctness
    // matters most.
    const EPS = 1e-6;
    let allOk = true;
    let boundaryOk = true;
    let firstFail = -1;
    for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
            const idx = j * W + i;
            const diff = Math.abs(output[idx] - ref[idx]);
            if (diff > EPS) {
                allOk = false;
                if (firstFail < 0) firstFail = idx;
                const onBoundary = (i === 7 || i === 8 || j === 7 || j === 8);
                if (onBoundary) boundaryOk = false;
            }
        }
    }

    check('Laplacian matches CPU reference across the full grid', allOk,
          allOk ? '' :
            `first mismatch at idx=${firstFail} (i=${firstFail % W}, j=${(firstFail/W)|0}): ` +
            `got ${output[firstFail]}, want ${ref[firstFail]}`);
    check('workgroup-boundary cells correct (halo + barrier work)', boundaryOk,
          boundaryOk ? '' : 'boundary mismatches indicate halo or phase-split bug');

    // Sanity: output should vary (a bug that zeroed the tile would still
    // produce a constant 0).
    let varies = false;
    for (let k = 1; k < output.length; k++) {
        if (output[k] !== output[0]) { varies = true; break; }
    }
    check('output varies across the grid (sanity)', varies);
}

// ── Test: fixed-size workgroup arrays of structs flatten to a packed
// TypedArray, while preserving barrier-visible struct stores and SROA
// reads. This is the CPU-side shape used by plasma's MhdPrim tile.
function testFlatWorkgroupStructArray() {
    console.log('test: flat workgroup array<struct> memory');

    const wgsl = `
        struct Cell { rho: f32, temp: f32, pres: f32, };
        @group(0) @binding(0) var<storage, read_write> out: array<f32>;

        var<workgroup> cells : array<array<Cell, 2>, 2>;

        @compute @workgroup_size(2, 2, 1)
        fn main(
            @builtin(global_invocation_id) gid: vec3<u32>,
            @builtin(local_invocation_id)  lid: vec3<u32>,
        ) {
            cells[lid.y][lid.x] = Cell(f32(gid.x), f32(gid.y), f32(gid.x + gid.y));
            workgroupBarrier();

            let c = cells[lid.y][lid.x];
            let d = cells[1u - lid.y][1u - lid.x];
            out[gid.y * 2u + gid.x] = c.rho + 10.0 * c.temp + 100.0 * c.pres + d.pres;
        }
    `;

    const mod = compileWGSL(wgsl);
    const out = [0, 0, 0, 0];
    mod.entry.main({ workgroups: [1, 1, 1], bindings: { out } });

    check('workgroup struct tile computes expected cross-tile values',
          JSON.stringify(out) === JSON.stringify([2, 102, 111, 211]),
          `got ${JSON.stringify(out)}`);
    check('workgroup struct tile flattens to compact Float32Array',
          mod.metrics.flatWorkgroupArrays === 1 &&
          mod.metrics.flatWorkgroupSlots === 12 &&
          mod.jsSource.includes('new Float32Array(12)'));
    check('workgroup struct tile avoids nested object-array allocation',
          !mod.jsSource.includes('Array.from({ length: 2 }'));
}

// ── Test: collectErrors mode records unsupported constructs ───────
// instead of throwing on first failure. Plants an unknown stmt kind
// into a parsed AST (the parser doesn't normally produce these, so
// we mutate post-parse) and verifies:
//   1. default mode still throws
//   2. collectErrors:true returns a non-empty errors array
//   3. emitted jsSource contains the rt.__unsupported placeholder
//   4. rt.__unsupported() throws with the original message
//   5. clean compiles surface an empty errors[] in both APIs
function testCollectErrorsMode() {
    console.log('test: collectErrors mode records unsupported constructs');

    // Tiny kernel — its only stmt inside the entry's `if` body is
    // `output[i] = 1.0;`. We mutate that stmt's kind to something
    // the emitter doesn't recognize.
    const wgsl = `
        @group(0) @binding(0) var<storage, read_write> output: array<f32>;

        @compute @workgroup_size(1, 1, 1)
        fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            if (i < 1u) {
                output[i] = 1.0;
            }
        }
    `;

    const ast = parse(tokenize(wgsl));
    resolveModule(ast);

    // Locate the assign stmt inside the `if` body and rebrand its kind.
    const mainFn = ast.items.find(it => it.kind === 'fn' && it.name === 'main');
    const ifStmt = mainFn.body.stmts.find(s => s.kind === 'if');
    const target = ifStmt.then.stmts[0];
    target.kind = '__planted_unknown__';

    // 1. Default mode: throws.
    let threw = false;
    try { emit(ast); } catch (err) { threw = err instanceof Error; }
    check('default-mode emit still throws on unknown stmt kind', threw);

    // 2. collectErrors:true: returns with errors recorded.
    const result = emit(ast, { collectErrors: true });
    check('collectErrors mode returns a result object',
          !!result && typeof result.jsSource === 'string');
    check('collectErrors records at least one error',
          Array.isArray(result.errors) && result.errors.length >= 1);
    const e0 = result.errors[0] || {};
    check('error record has expected fields',
          e0.phase === 'emit' && e0.kind === 'stmt' &&
          /__planted_unknown__/.test(e0.message || ''));

    // 3. Placeholder appears in the emitted JS.
    check('emitted body contains rt.__unsupported placeholder',
          /rt\.__unsupported\(/.test(result.body));

    // 4. The runtime sentinel actually throws.
    let trapMsg = '';
    try { runtime.__unsupported('planted message'); }
    catch (err) { trapMsg = String(err && err.message || ''); }
    check('rt.__unsupported throws with the original message',
          /unsupported construct reached at runtime: planted message/.test(trapMsg));

    // 5. Clean compiles surface an empty errors[] in both APIs.
    const tr = transpileWGSL(wgsl, { collectErrors: true });
    check('transpileWGSL returns errors array (empty on clean compile)',
          Array.isArray(tr.errors) && tr.errors.length === 0);
    const cr = compileWGSL(wgsl, { collectErrors: true });
    check('compileWGSL returns errors array (empty on clean compile)',
          Array.isArray(cr.errors) && cr.errors.length === 0);
}

// ── Test: A3 — argument-binding elision in the inline pass ────────
// When a helper arg is a plain ident and the helper body never writes
// through the param, the inline pass aliases the param to the caller's
// ident directly instead of emitting `const _inl_N_p = p;`. This test
// verifies:
//   1. Elision fires on a plain-ident, never-written param — and the
//      elided refs route through the caller's SROA scalarization
//   2. Elision is SKIPPED when the helper assigns to a member of the
//      param (WGSL spec disallows this but the parser accepts it;
//      hardening keeps elision safe regardless)
//   3. Elision is SKIPPED when the arg is a non-ident expression
//   4. Output parity is preserved vs the noInline baseline
function testArgBindingElision() {
    console.log('test: arg-binding elision in inline pass');

    const wgsl = `
        @group(0) @binding(0) var<storage, read>       pos_in: array<vec3<f32>>;
        @group(0) @binding(1) var<storage, read_write> out:    array<vec3<f32>>;

        // Helper 1: plain-ident args, params never written, elision fires.
        fn pure(p: vec3<f32>, q: vec3<f32>) -> vec3<f32> {
            return q - p;
        }
        // Helper 2: non-ident first arg disqualifies elision; second
        // arg is a literal which also disqualifies (only plain idents
        // can elide).
        fn scaled(p: vec3<f32>, k: f32) -> vec3<f32> {
            return p * k;
        }

        @compute @workgroup_size(1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            let p = pos_in[i];
            let q = pos_in[i + 1u];
            let a = pure(p, q);            // both args elidable
            let c = scaled(p + q, 2.0);    // neither arg elidable
            out[i] = a + c;
        }
    `;

    const tr = transpileWGSL(wgsl);
    const body = tr.body;

    // 1. pure(p, q): elision fired — no `_inl_0_p` / `_inl_0_q` lets;
    //    inlined refs use the caller's scalarized `p_x`/`q_x`.
    check('pure(p,q): no _inl_0_p binding emitted',
          !/(const|let)\s+_inl_0_p\b/.test(body));
    check('pure(p,q): no _inl_0_q binding emitted',
          !/(const|let)\s+_inl_0_q\b/.test(body));
    check('pure(p,q): inlined body uses caller-scalarized refs (q_x - p_x)',
          /q_x - p_x/.test(body));

    // 2. scaled(p+q, 2.0): non-ident args force the let bindings to
    //    materialize. SROA further splits the vec param into per-
    //    component scalars, so the binding name is `_inl_1_p_x` etc.
    //    The literal arg becomes `_inl_1_k`.
    check('scaled(p+q,2.0): non-ident vec arg gets a SROA-split binding',
          /(const|let)\s+_inl_1_p_x\b/.test(body));
    check('scaled(p+q,2.0): literal arg gets a binding',
          /(const|let)\s+_inl_1_k\b/.test(body));

    // 3. Member-write to param disqualifies elision. WGSL spec actually
    //    forbids this but the parser accepts it, so we test the
    //    hardening by going through the AST directly. (No compileWGSL
    //    here because the resolver might reject p.x = ... later.)
    const wgslMemberWrite = `
        @group(0) @binding(0) var<storage, read>       pos_in: array<vec3<f32>>;
        @group(0) @binding(1) var<storage, read_write> out:    array<vec3<f32>>;
        fn touches(p: vec3<f32>) -> vec3<f32> {
            p.x = 1.0;
            return p;
        }
        @compute @workgroup_size(1)
        fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
            let i = gid.x;
            let p = pos_in[i];
            out[i] = touches(p);
        }
    `;
    const tr2 = transpileWGSL(wgslMemberWrite);
    check('member-write to param disqualifies elision (binding preserved)',
          /(const|let)\s+_inl_0_p\b/.test(tr2.body) ||
          /(const|let)\s+_inl_0_p_x\b/.test(tr2.body));

    // 4. Output parity vs noInline baseline on the main kernel.
    const N = 5;
    function makeInputs() {
        const pos_in = new Array(N + 1);
        const out    = new Array(N);
        for (let i = 0; i <= N; i++) pos_in[i] = { x: i * 0.5, y: i * 0.2, z: -i * 0.1 };
        for (let i = 0; i < N; i++)  out[i]    = { x: 0, y: 0, z: 0 };
        return { pos_in, out };
    }
    function runWith(opts) {
        const mod = compileWGSL(wgsl, opts);
        const inputs = makeInputs();
        mod.entry.step({
            workgroups: [N, 1, 1],
            bindings: inputs,
        });
        return inputs.out;
    }
    const inlined  = runWith({});
    const noInline = runWith({ noInline: true });
    const EPS = 1e-6;
    let parityOK = true;
    for (let i = 0; i < N; i++) {
        for (const c of ['x', 'y', 'z']) {
            if (Math.abs(inlined[i][c] - noInline[i][c]) > EPS) parityOK = false;
        }
    }
    check('elision preserves output parity vs noInline', parityOK);
}

testScalarFma();
testVec4Arith();
testHelpersAndControl();
testBarrierReduction();
testSyntheticReductionSequenceEntry();
testResolverCoverage();
testInlinePreservesOutput();
testVarSroaPreservesOutput();
testNestedInlinePreservesOutput();
testFlatStorageMode();
testFlatStructStorageMode();
testStrictNumericAndIntrinsics();
testBuildTimeTranspileAPI();
testNumericAndRuntimeOptimizations();
testStabilityOptionHooks();
testFlatLayoutFiniteWritesAndSpecialization();
testPhaseLocalReplayAcrossBarrier();
testFunctionParamSpecialization();
testGeneratedCodeFastPaths();
testFixedWorkgroupSpecialization();
testInlineActualCallCounts();
testSwizzleStorePropagation();
testScalarReturnClone();
testFixedArrayReturnSroa();
testNestedStructSroa();
testStructSroaAndPointerInlining();
testCorpusDerivedDispatchShader();
testTwoDSharedTileHaloBarrier();
testFlatWorkgroupStructArray();
testCollectErrorsMode();
testArgBindingElision();

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
