#!/usr/bin/env node
/* Smoke tests for the browser-side pre-transpiled WGSL runner. */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WGSLBufferPool, createWGSLRunner } from '../../lib/wgsl/runner.js';
import { transpileWGSL } from '../../lib/wgsl/transpile.js';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else      { fail++; console.log(`  ✗ ${name}${detail ? '  — ' + detail : ''}`); }
}

const wgsl = `
    @group(0) @binding(0) var<storage, read_write> out: array<u32>;

    @compute @workgroup_size(4, 4, 1)
    fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
        let idx = gid.y * 8u + gid.x;
        out[idx] = gid.x + gid.y * 100u;
    }
`;

const reductionWGSL = `
    struct U { n: u32, _a: u32, _b: u32, _c: u32, };
    @group(0) @binding(0) var<uniform> U_buf: U;
    @group(0) @binding(1) var<storage, read>       input: array<u32>;
    @group(0) @binding(2) var<storage, read_write> total: atomic<u32>;
    @group(0) @binding(3) var<storage, read_write> out:   array<u32>;

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
            atomicAdd(&tile, input[gid.x]);
        }
        workgroupBarrier();
        if (lid == 0u) {
            atomicAdd(&total, atomicLoad(&tile));
        }
    }

    @compute @workgroup_size(1)
    fn finalize() {
        out[0] = atomicLoad(&total);
    }
`;

const dir = mkdtempSync(join(tmpdir(), 'wgsl-runner-'));
try {
    const artifact = join(dir, 'runner-artifact.mjs');
    writeFileSync(artifact, transpileWGSL(wgsl, { collectErrors: true }).jsSource);
    const moduleUrl = pathToFileURL(artifact).href;
    const reductionArtifact = join(dir, 'runner-reduction-artifact.mjs');
    writeFileSync(reductionArtifact, transpileWGSL(reductionWGSL, { collectErrors: true }).jsSource);
    const reductionModuleUrl = pathToFileURL(reductionArtifact).href;

    console.log('test: main-thread runner dispatch');
    const runner = createWGSLRunner({ workers: 0 });
    const out = new Uint32Array(64);
    await runner.dispatch({
        moduleUrl,
        entry: 'main',
        domain: [2, 2, 1],
        origin: [1, 1, 0],
        bindings: { out },
    });
    check('runner preserves origin offsets on main-thread dispatch',
          out[1 + 1 * 8] === 101 &&
          out[2 + 2 * 8] === 202 &&
          out[0] === 0);

    console.log('test: sharded runner dispatch');
    const sharedOut = new Uint32Array(new SharedArrayBuffer(8 * 4 * Uint32Array.BYTES_PER_ELEMENT));
    await runner.dispatch({
        moduleUrl,
        entry: 'main',
        domain: [8, 4, 1],
        bindings: { out: sharedOut },
        shards: 2,
    });
    check('runner splits global-loop kernels into SharedArrayBuffer-backed row shards',
          sharedOut[0] === 0 &&
          sharedOut[7] === 7 &&
          sharedOut[8] === 100 &&
          sharedOut[31] === 307);

    console.log('test: batched runner dispatch sequence');
    const seqOut = new Uint32Array(64);
    const seq = await runner.dispatchSequence([
        { moduleUrl, entry: 'main', domain: [2, 1, 1], origin: [0, 0, 0] },
        { moduleUrl, entry: 'main', domain: [2, 1, 1], origin: [0, 1, 0] },
    ], { bindings: { out: seqOut } });
    check('runner batches multiple CPU passes into one dispatch sequence',
          seq.jobs === 2 &&
          seq.dispatchedJobs === 2 &&
          seqOut[0] === 0 &&
          seqOut[1] === 1 &&
          seqOut[8] === 100 &&
          seqOut[9] === 101);

    console.log('test: reduction sequence coalescing');
    const redBindings = {
        U_buf: { n: 6, _a: 0, _b: 0, _c: 0 },
        input: new Uint32Array([3, 5, 7, 11, 13, 17]),
        total: [999],
        out: new Uint32Array(1),
    };
    const red = await runner.dispatchSequence([
        { moduleUrl: reductionModuleUrl, entry: 'reset', workgroups: [1, 1, 1] },
        { moduleUrl: reductionModuleUrl, entry: 'reduce', workgroups: [2, 1, 1] },
        { moduleUrl: reductionModuleUrl, entry: 'finalize', workgroups: [1, 1, 1] },
    ], { bindings: redBindings });
    check('runner coalesces reset/reduce/finalize into the synthetic sequence entry',
          red.jobs === 3 &&
          red.dispatchedJobs === 1 &&
          red.coalescedJobs === 2 &&
          redBindings.out[0] === 56);

    console.log('test: fallback buffer pool');
    const pool = new WGSLBufferPool({ shared: true });
    const a = pool.get('field:8x4', Float32Array, 32, { fill: 1 });
    const b = pool.get('field:8x4', Float32Array, 32);
    const c = pool.get('field:16x4', Float32Array, 64);
    check('buffer pool reuses same typed array for matching resolution key',
          a === b && b[0] === 1);
    check('buffer pool allocates SharedArrayBuffer-backed resized buffers',
          c !== a && c.buffer instanceof SharedArrayBuffer);
} finally {
    rmSync(dir, { recursive: true, force: true });
}

console.log('');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
