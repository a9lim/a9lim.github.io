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

import { compileWGSL } from '../../shared-wgsl-transpile.js';

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

testScalarFma();
testVec4Arith();
testHelpersAndControl();
testBarrierReduction();

console.log();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
