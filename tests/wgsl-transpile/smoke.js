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

import { compileWGSL, tokenize, parse, resolveModule }
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

testScalarFma();
testVec4Arith();
testHelpersAndControl();
testBarrierReduction();
testResolverCoverage();
testInlinePreservesOutput();
testVarSroaPreservesOutput();

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
