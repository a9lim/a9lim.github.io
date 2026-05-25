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
import { compileWGSL, transpileWGSL, tokenize, parse, resolveModule }
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
    check('transpileWGSL returns generated module source', built.jsSource.includes('export default function _wgsl_module'));
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
            let old = atomicAdd(&counts[0], 2u);
            u_out[gid.x + 1u] = old;
        }
    `;
    const mod = compileWGSL(wgsl, { strictInts: true, strictF32: true });
    const u_out = [0, 0], i_out = [0], f_out = [0], counts = [0xffffffff];
    mod.entry.main({
        workgroups: [1, 1, 1],
        bindings: { P_buf: { n: 1, nanv: NaN, _a: 0, _b: 0 }, u_out, i_out, f_out, counts },
    });
    check('u32 shifts and compound wrap correctly', u_out[0] === 3);
    check('i32 arithmetic right shift is signed', i_out[0] === -2);
    check('round/min/max follow WGSL-oriented scalar helpers', f_out[0] === 8);
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

testScalarFma();
testVec4Arith();
testHelpersAndControl();
testBarrierReduction();
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
testStructSroaAndPointerInlining();
testCorpusDerivedDispatchShader();
testTwoDSharedTileHaloBarrier();

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
