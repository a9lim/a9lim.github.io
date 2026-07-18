#!/usr/bin/env node
/* Real-shader CPU benchmark for the plasma WGSL corpus.

   This intentionally runs a small, host-owned slice of the actual plasma
   compute shaders through the JS transpiler. It is not a full simulator
   stepper and Plasma does not ship a CPU fallback; it is a performance
   tripwire for kernels representative of a possible future fallback:

     - colormap: flat vec4 read/write and scalar normalization
     - lic-normalize: bitcast + scalar postprocess
     - compute-dt: fused reset/reduce/finalize sequence entry

   Usage:
     node tests/wgsl-transpile/plasma-bench.js
     PLASMA_BENCH_SIZES=64,128 PLASMA_BENCH_ITERS=10 node ...
*/

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { compileWGSL } from '../../shared-wgsl-transpile.js';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const SHADER_DIR = path.join(ROOT, 'plasma/src/gpu/shaders');
const TRANSPILER_PATH = path.join(ROOT, 'shared-wgsl-transpile.js');
const ITERS = +(process.env.PLASMA_BENCH_ITERS || 5);
const WARMUP = +(process.env.PLASMA_BENCH_WARMUP || 2);
const SIZES = (process.env.PLASMA_BENCH_SIZES || '64,128,256')
    .split(',')
    .map(s => +s.trim())
    .filter(Number.isFinite);
const AUTOTUNE = process.env.PLASMA_BENCH_AUTOTUNE === '1';
const SPECIALIZED = process.env.PLASMA_BENCH_SPECIALIZED === '1';
const CACHE_PATH = process.env.PLASMA_BENCH_CACHE || path.join(ROOT, 'tests/wgsl-transpile/.plasma-bench-cache.json');
const WORKGROUP = 8;
const GHOST = 2;

function readShader(name) {
    return fs.readFileSync(path.join(SHADER_DIR, name), 'utf8');
}

function sha256Hex(text) {
    return createHash('sha256').update(text).digest('hex');
}

function shaderUnit(name) {
    return `${readShader('shared-helpers.wgsl')}\n${readShader(name)}`;
}

function compilePlasma(name, opts = {}) {
    return compileWGSL(shaderUnit(name), {
        flatStorage: true,
        collectErrors: true,
        ...opts,
    });
}

function gridOpts(n, extraUniforms = {}, width = n, height = width) {
    return {
        specializeUniforms: {
            U_uniforms: {
                grid_n: n,
                grid_n_total: n + 2 * GHOST,
                ghost_w: GHOST,
                ...extraUniforms,
            },
        },
        fixedWorkgroups: [
            Math.ceil(width / WORKGROUP),
            Math.ceil(height / WORKGROUP),
            1,
        ],
    };
}

function f32Bits(x) {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = x;
    return new Uint32Array(buf)[0];
}

function makeUniforms(n) {
    const ghost = 2;
    return {
        dx: 1 / n,
        gamma: 5 / 3,
        view_min: -1,
        view_max: 1,
        eta: 1e-3,
        eta_anom_alpha: 0,
        _pad_lic_1: 0,
        _pad_lic_2: 0,
        grid_n: n,
        grid_n_total: n + 2 * ghost,
        ghost_w: ghost,
        pressure_floor: 1e-6,
        cfl: 0.4,
        view_mode: 0,
        eta_anom_jcrit: 1,
        noise_n: 1024,
    };
}

function time(label, fn, { quiet = false } = {}) {
    for (let i = 0; i < WARMUP; i++) fn();
    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) fn();
    const t1 = performance.now();
    const ms = t1 - t0;
    if (!quiet) {
        console.log(`  ${label.padEnd(28)} ${ms.toFixed(2).padStart(8)} ms  ${(ms / ITERS).toFixed(3).padStart(8)} ms/iter`);
    }
    return ms;
}

function loadAutotuneCache() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    } catch {
        return {};
    }
}

function writeAutotuneCache(cache) {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

function benchColormap(mod, n) {
    const U = makeUniforms(n);
    const total = U.grid_n_total * U.grid_n_total;
    const field = new Float32Array(total);
    const lut = new Float32Array(256 * 4);
    const colored = new Float32Array(total * 4);
    for (let i = 0; i < total; i++) field[i] = Math.sin(i * 0.013);
    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        lut[i * 4 + 0] = t;
        lut[i * 4 + 1] = 1 - t;
        lut[i * 4 + 2] = 0.25 + 0.5 * t;
        lut[i * 4 + 3] = 1;
    }
    const workgroups = [Math.ceil(n / 8), Math.ceil(n / 8), 1];
    time(`colormap N=${n}`, () => mod.entry.main({
        workgroups,
        bindings: { U_uniforms: U, field, lut, colored },
    }));
}

function benchLicNormalize(mod, n) {
    const U = makeUniforms(n);
    const total = U.grid_n_total * U.grid_n_total;
    const lic_out = new Float32Array(total);
    for (let i = 0; i < total; i++) lic_out[i] = 0.2 + 0.6 * ((i * 17) % 1024) / 1023;
    const lic_minmax = new Uint32Array([f32Bits(0.2), f32Bits(0.8)]);
    const workgroups = [Math.ceil(n / 8), Math.ceil(n / 8), 1];
    time(`lic-normalize N=${n}`, () => mod.entry.main({
        workgroups,
        bindings: { U_uniforms: U, lic_minmax, lic_out },
    }));
}

function benchComputeDt(mod, n) {
    const U = makeUniforms(n);
    const total = U.grid_n_total * U.grid_n_total;
    const faceX = (U.grid_n_total + 1) * U.grid_n_total;
    const faceY = U.grid_n_total * (U.grid_n_total + 1);
    const U0_in = new Float32Array(total * 4);
    const U1_in = new Float32Array(total * 4);
    const Bx_face = new Float32Array(faceX);
    const By_face = new Float32Array(faceY);
    for (let i = 0; i < total; i++) {
        U0_in[i * 4 + 0] = 1 + 0.01 * Math.sin(i * 0.01);
        U0_in[i * 4 + 1] = 0.02;
        U0_in[i * 4 + 2] = -0.01;
        U0_in[i * 4 + 3] = 0;
        U1_in[i * 4 + 0] = 2.5;
        U1_in[i * 4 + 1] = 0;
    }
    const wavespeed = [0];
    const eta_max_buf = [0];
    const hall_speed_buf = [0];
    const cond_speed_buf = [0];
    const dt_buf = new Float32Array(8);
    const bindings = {
        U_uniforms: U,
        U0_in,
        U1_in,
        Bx_face,
        By_face,
        wavespeed,
        dt_buf,
        eta_max_buf,
        hall_speed_buf,
        cond_speed_buf,
    };
    const reduceGroups = [Math.ceil(n / 8), Math.ceil(n / 8), 1];
    const run = mod.entry.reset_reduce_finalize
        ? () => mod.entry.reset_reduce_finalize({ workgroups: reduceGroups, bindings })
        : () => {
            mod.entry.reset({ workgroups: [1, 1, 1], bindings });
            mod.entry.reduce({ workgroups: reduceGroups, bindings });
            mod.entry.finalize({ workgroups: [1, 1, 1], bindings });
        };
    time(`compute-dt fused N=${n}`, run);
}

function makeComputeDtRun(mod, n) {
    const U = makeUniforms(n);
    const total = U.grid_n_total * U.grid_n_total;
    const faceX = (U.grid_n_total + 1) * U.grid_n_total;
    const faceY = U.grid_n_total * (U.grid_n_total + 1);
    const U0_in = new Float32Array(total * 4);
    const U1_in = new Float32Array(total * 4);
    const Bx_face = new Float32Array(faceX);
    const By_face = new Float32Array(faceY);
    for (let i = 0; i < total; i++) {
        U0_in[i * 4 + 0] = 1 + 0.01 * Math.sin(i * 0.01);
        U0_in[i * 4 + 1] = 0.02;
        U0_in[i * 4 + 2] = -0.01;
        U0_in[i * 4 + 3] = 0;
        U1_in[i * 4 + 0] = 2.5;
        U1_in[i * 4 + 1] = 0;
    }
    const bindings = {
        U_uniforms: U,
        U0_in,
        U1_in,
        Bx_face,
        By_face,
        wavespeed: [0],
        dt_buf: new Float32Array(8),
        eta_max_buf: [0],
        hall_speed_buf: [0],
        cond_speed_buf: [0],
    };
    const reduceGroups = [Math.ceil(n / 8), Math.ceil(n / 8), 1];
    return mod.entry.reset_reduce_finalize
        ? () => mod.entry.reset_reduce_finalize({ workgroups: reduceGroups, bindings })
        : () => {
            mod.entry.reset({ workgroups: [1, 1, 1], bindings });
            mod.entry.reduce({ workgroups: reduceGroups, bindings });
            mod.entry.finalize({ workgroups: [1, 1, 1], bindings });
        };
}

function autotuneComputeDt(n, cache) {
    const variants = [
        { name: 'base', opts: {} },
        { name: 'hot-jz', opts: { inlineHotFns: ['jz_mag_at'] } },
        { name: 'grid-eta0-fixed', opts: { inlineHotFns: ['jz_mag_at'], ...gridOpts(n, { eta_anom_alpha: 0 }) } },
        { name: 'no-scalar-return-clones', opts: { scalarReturnClones: false } },
    ];
    const key = sha256Hex(JSON.stringify({
        shader: 'compute-dt.wgsl',
        n,
        iters: ITERS,
        warmup: WARMUP,
        unit: sha256Hex(shaderUnit('compute-dt.wgsl')),
        transpiler: sha256Hex(fs.readFileSync(TRANSPILER_PATH, 'utf8')),
        variants: variants.map(v => [v.name, v.opts]),
    }));
    const cached = cache[key];
    if (cached) {
        console.log(`  autotune compute-dt N=${n}: cache hit, winner=${cached.winner} (${cached.msPerIter.toFixed(3)} ms/iter)`);
        return cached;
    }
    const results = [];
    for (const variant of variants) {
        const mod = compilePlasma('compute-dt.wgsl', variant.opts);
        const ms = time(`autotune ${variant.name} N=${n}`, makeComputeDtRun(mod, n), { quiet: true });
        results.push({ name: variant.name, opts: variant.opts, ms, msPerIter: ms / ITERS });
    }
    results.sort((a, b) => a.ms - b.ms);
    const best = results[0];
    cache[key] = {
        winner: best.name,
        opts: best.opts,
        ms: best.ms,
        msPerIter: best.msPerIter,
        results,
        generated: new Date().toISOString(),
    };
    writeAutotuneCache(cache);
    console.log(`  autotune compute-dt N=${n}: winner=${best.name} (${best.msPerIter.toFixed(3)} ms/iter), cache=${path.relative(ROOT, CACHE_PATH)}`);
    return cache[key];
}

console.log(`plasma WGSL CPU bench (${ITERS} iters, +${WARMUP} warmup${SPECIALIZED ? ', specialized variants' : ''})`);
if (!fs.existsSync(SHADER_DIR)) {
    console.log(`  skipped: ${path.relative(ROOT, SHADER_DIR)} not present`);
    process.exit(0);
}

const colormap = compilePlasma('colormap.wgsl');
const licNormalize = compilePlasma('lic-normalize.wgsl');
const computeDt = compilePlasma('compute-dt.wgsl', { inlineHotFns: ['jz_mag_at'] });
const autotuneCache = AUTOTUNE ? loadAutotuneCache() : null;

for (const n of SIZES) {
    console.log(`\nN=${n}`);
    if (AUTOTUNE) autotuneComputeDt(n, autotuneCache);
    const colormapMod = SPECIALIZED ? compilePlasma('colormap.wgsl', gridOpts(n)) : colormap;
    const licNormalizeMod = SPECIALIZED ? compilePlasma('lic-normalize.wgsl', gridOpts(n)) : licNormalize;
    const computeDtMod = SPECIALIZED
        ? compilePlasma('compute-dt.wgsl', { inlineHotFns: ['jz_mag_at'], ...gridOpts(n, { eta_anom_alpha: 0 }) })
        : computeDt;
    benchColormap(colormapMod, n);
    benchLicNormalize(licNormalizeMod, n);
    benchComputeDt(computeDtMod, n);
}
