#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/gpu-diff.mjs — GPU-golden differential harness.

   Validates that a transpiled compute kernel (run on CPU via
   shared-wgsl-transpile.js) produces the SAME outputs as the real WGSL
   shader run on a GPU. This is the ground-truth oracle the synthetic
   smoke tests can't be: the GPU is the reference implementation.

   How it works:
     1. Launch the *installed* Google Chrome, headed, pointed at a
        localhost origin (WebGPU needs a secure context + a real GPU;
        puppeteer's bundled Chrome-for-Testing and headless Metal both
        fail to expose navigator.gpu on macOS — see the spike notes).
     2. For each kernel spec, in the browser: assemble the WGSL, build a
        compute pipeline, upload synthetic deterministic inputs to
        storage buffers, dispatch, and read back the read_write buffers.
        Those bytes are the golden output.
     3. In Node: transpile the same WGSL, run it on the same inputs, and
        diff against the golden within a float epsilon.

   Inputs are synthetic-but-deterministic (seeded), so this is
   reproducible and needs no live-sim capture. Layout note: only
   storage `array<f32>` / `array<vecN<f32>>` bindings are handled here
   (the GPU buffer bytes and the transpiler's flat-storage Float32Array
   are the same layout). Uniform structs and `array<struct>` bindings
   need a byte-layout bridge — layered on next.

   Usage:
     node tests/wgsl-transpile/gpu-diff.mjs            # all specs
     node tests/wgsl-transpile/gpu-diff.mjs --quiet    # failures only
   Exits 0 on full pass, 1 on any failure or if Chrome/WebGPU is absent.
   ─────────────────────────────────────────────────────────────────── */

import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { compileWGSL, runtime } from '../../lib/wgsl/transpile.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const QUIET = process.argv.includes('--quiet');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PUPPETEER = resolve(REPO, 'tools/og/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js');
const EPS = 1e-4;

// ── Kernel specs ──────────────────────────────────────────────────
// data: a plain number[] (serializable to the browser); arity: floats
// per element for vec arrays (1 = scalar array). access read_write
// bindings are read back and diffed.
function seeded(n, seed = 1) {
    // mulberry32 — deterministic synthetic input
    let s = seed >>> 0;
    const out = [];
    for (let i = 0; i < n; i++) {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1);
    }
    return out;
}

const SPECS = [
    {
        name: 'scalar-map',
        wgsl: `
@group(0) @binding(0) var<storage, read> inp: array<f32>;
@group(0) @binding(1) var<storage, read_write> outp: array<f32>;
@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  outp[g.x] = inp[g.x] * inp[g.x] + 1.0;
}`,
        entry: 'main',
        workgroups: [1, 1, 1],
        bindings: {
            inp:  { binding: 0, access: 'read',       arity: 1, data: seeded(8, 7) },
            outp: { binding: 1, access: 'read_write', arity: 1, data: new Array(8).fill(0) },
        },
    },
    {
        name: 'vec4-saxpy',
        wgsl: `
@group(0) @binding(0) var<storage, read> a: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> b: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> c: array<vec4<f32>>;
@compute @workgroup_size(8)
fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  c[g.x] = a[g.x] * 2.0 + b[g.x];
}`,
        entry: 'main',
        workgroups: [1, 1, 1],
        bindings: {
            a: { binding: 0, access: 'read',       arity: 4, data: seeded(32, 11) },
            b: { binding: 1, access: 'read',       arity: 4, data: seeded(32, 13) },
            c: { binding: 2, access: 'read_write', arity: 4, data: new Array(32).fill(0) },
        },
    },
];

// ── GPU capture (serialized into the browser) ─────────────────────
// Receives a spec with bindings.data as plain arrays; returns
// { bindingName: number[] } for every read_write binding.
const CAPTURE_FN = async (spec) => {
    const adapter = await navigator.gpu.requestAdapter();
    const dev = await adapter.requestDevice();
    const mod = dev.createShaderModule({ code: spec.wgsl });
    const pipe = dev.createComputePipeline({ layout: 'auto', compute: { module: mod, entryPoint: spec.entry } });
    const buffers = {};
    const entries = [];
    for (const [name, b] of Object.entries(spec.bindings)) {
        const arr = new Float32Array(b.data);
        const buf = dev.createBuffer({
            size: Math.max(16, arr.byteLength),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        dev.queue.writeBuffer(buf, 0, arr);
        buffers[name] = { buf, bytes: arr.byteLength, access: b.access };
        entries.push({ binding: b.binding, resource: { buffer: buf } });
    }
    const bg = dev.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries });
    const enc = dev.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(pipe); pass.setBindGroup(0, bg);
    pass.dispatchWorkgroups(spec.workgroups[0], spec.workgroups[1], spec.workgroups[2]);
    pass.end();
    const reads = {};
    for (const [name, b] of Object.entries(buffers)) {
        if (b.access !== 'read_write') continue;
        const rb = dev.createBuffer({ size: Math.max(16, b.bytes), usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
        enc.copyBufferToBuffer(b.buf, 0, rb, 0, b.bytes);
        reads[name] = rb;
    }
    dev.queue.submit([enc.finish()]);
    const out = {};
    for (const [name, rb] of Object.entries(reads)) {
        await rb.mapAsync(GPUMapMode.READ);
        out[name] = [...new Float32Array(rb.getMappedRange()).slice(0, spec.bindings[name].data.length)];
    }
    return out;
};

// ── CPU side: transpile + run on the same inputs ──────────────────
function runCPU(spec) {
    const mod = compileWGSL(spec.wgsl, { flatStorage: true, runtime });
    const bindings = {};
    for (const [name, b] of Object.entries(spec.bindings)) bindings[name] = new Float32Array(b.data);
    mod.entry[spec.entry]({ workgroups: spec.workgroups, bindings });
    const out = {};
    for (const [name, b] of Object.entries(spec.bindings)) {
        if (b.access === 'read_write') out[name] = [...bindings[name]];
    }
    return out;
}

function diff(gpu, cpu) {
    const mism = [];
    for (const name of Object.keys(gpu)) {
        const g = gpu[name], c = cpu[name] || [];
        if (g.length !== c.length) { mism.push(`${name}: length ${g.length} vs ${c.length}`); continue; }
        for (let i = 0; i < g.length; i++) {
            if (Math.abs(g[i] - c[i]) > EPS) { mism.push(`${name}[${i}]: gpu=${g[i].toFixed(6)} cpu=${c[i].toFixed(6)}`); if (mism.length > 4) break; }
        }
    }
    return mism;
}

async function main() {
    if (!existsSync(CHROME)) { console.error(`✗ Google Chrome not found at ${CHROME} — GPU diff needs real Chrome (WebGPU).`); process.exit(1); }
    if (!existsSync(resolve(REPO, 'tools/og/node_modules/puppeteer'))) { console.error('✗ puppeteer not installed (expected in tools/og/).'); process.exit(1); }
    const puppeteer = (await import(PUPPETEER)).default;
    const server = createServer((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body>gpu-diff</body></html>'); }).listen(0);
    const port = server.address().port;
    const browser = await puppeteer.launch({ headless: false, executablePath: CHROME });
    let pass = 0, fail = 0;
    try {
        const page = await browser.newPage();
        await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
        const hasGPU = await page.evaluate(() => !!navigator.gpu && navigator.gpu.requestAdapter().then(a => !!a));
        if (!hasGPU) { console.error('✗ WebGPU unavailable in this Chrome.'); process.exit(1); }
        for (const spec of SPECS) {
            const gpu = await page.evaluate(CAPTURE_FN, spec);
            const cpu = runCPU(spec);
            const mism = diff(gpu, cpu);
            if (mism.length === 0) { pass++; if (!QUIET) console.log(`  ✓ ${spec.name}`); }
            else { fail++; console.log(`  ✗ ${spec.name}`); for (const m of mism) console.log(`      ${m}`); }
        }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('gpu-diff error:', e); process.exit(1); });
