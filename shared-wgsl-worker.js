/* Dormant worker runner for pre-transpiled WGSL compute artifacts.

   No deployed simulation imports this worker and the current root build does
   not emit the example /transpiled/ modules. It is retained with the runner
   smoke tests as a future integration seam.

   Main-thread shape:

     const worker = new Worker('/shared-wgsl-worker.js', { type: 'module' });
     worker.postMessage({
       id: 1,
       moduleUrl: '/transpiled/plasma/src/gpu/shaders/colormap.transpiled.js',
       entry: 'main',
       workgroups: [16, 16, 1],
       domain: [128, 128, 1],
       origin: [0, 0, 0],
       bindings: { ...structuredCloneableBuffers },
       transferBack: ['colored.buffer'],
     }, transferList);

   The worker imports build-time artifacts only; it never calls compileWGSL()
   and therefore avoids parser/emit cost and runtime eval on page load.
   Send `{ jobs: [...] }` instead of a single `{ moduleUrl, entry }` to
   batch multiple CPU passes into one worker roundtrip.
*/

import { runtime } from './shared-wgsl-transpile.js';

const moduleCache = new Map();
const boundCache = new WeakMap();

async function loadModule(moduleUrl) {
    let mod = moduleCache.get(moduleUrl);
    if (!mod) {
        const imported = await import(moduleUrl);
        mod = imported.default(runtime);
        moduleCache.set(moduleUrl, mod);
    }
    return mod;
}

function boundEntries(mod, bindings) {
    if (!mod || typeof mod.bind !== 'function') return null;
    if (!bindings || typeof bindings !== 'object') return null;
    let byBindings = boundCache.get(mod);
    if (!byBindings) {
        byBindings = new WeakMap();
        boundCache.set(mod, byBindings);
    }
    let bound = byBindings.get(bindings);
    if (!bound) {
        bound = mod.bind(bindings);
        byBindings.set(bindings, bound);
    }
    return bound;
}

function pathValue(root, path) {
    let cur = root;
    for (const part of path.split('.')) {
        if (cur == null) return null;
        cur = cur[part];
    }
    return cur;
}

function collectTransfers(bindings, transferBack = []) {
    const out = [];
    for (const p of transferBack) {
        const v = pathValue(bindings, p);
        if (v instanceof ArrayBuffer) out.push(v);
    }
    return out;
}

self.onmessage = async (event) => {
    const msg = event.data || {};
    const { id, moduleUrl, entry, workgroups, domain, origin, bindings, transferBack, jobs } = msg;
    try {
        const run = async (job) => {
            const jobBindings = job.bindings || bindings;
            if (!job.moduleUrl || !job.entry) throw new Error('moduleUrl and entry are required');
            const mod = await loadModule(job.moduleUrl);
            const bound = boundEntries(mod, jobBindings);
            const fn = bound?.[job.entry] || mod.entry?.[job.entry];
            if (typeof fn !== 'function') throw new Error(`entry not found: ${job.entry}`);
            if (bound?.[job.entry]) fn(job.workgroups, job.domain, job.origin);
            else {
                fn({
                    workgroups: job.workgroups,
                    domain: job.domain,
                    origin: job.origin,
                    bindings: jobBindings,
                });
            }
        };
        if (Array.isArray(jobs)) {
            for (const job of jobs) await run(job);
        } else {
            await run({ moduleUrl, entry, workgroups, domain, origin, bindings });
        }
        self.postMessage(
            { id, ok: true, bindings },
            collectTransfers(bindings, transferBack),
        );
    } catch (err) {
        self.postMessage({
            id,
            ok: false,
            error: err && err.message || String(err),
        });
    }
};
