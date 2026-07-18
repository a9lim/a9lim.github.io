/* Dormant runtime helper for pre-transpiled WGSL compute artifacts.

   No deployed simulation imports this module and the current root build does
   not emit /transpiled/ artifacts. This contract remains tested by
   tests/wgsl-transpile/runner-smoke.js for a future explicit integration.

   Usage:

     import { createWGSLRunner } from '/shared-wgsl-runner.js';

     const runner = createWGSLRunner({ workers: 4 });
     await runner.dispatch({
       moduleUrl: '/transpiled/plasma/src/gpu/shaders/colormap.transpiled.js',
       entry: 'main',
       domain: [128, 128, 1],
       bindings,
       shards: 4,
     });

   The runner never calls compileWGSL(). It imports build-time artifacts,
   reads their entryInfo metadata, and only shards entries marked
   `globalLoop: true`. Parallel sharding requires SharedArrayBuffer-backed
   TypedArrays so every worker mutates the same storage buffers.
*/

import { runtime } from './shared-wgsl-transpile.js';

const DEFAULT_WORKER_URL = '/shared-wgsl-worker.js';

function hasWorker() {
    return typeof Worker !== 'undefined';
}

function hardwareConcurrency() {
    const n = globalThis.navigator && navigator.hardwareConcurrency;
    return Number.isFinite(n) && n > 0 ? n : 1;
}

function defaultWorkerCount() {
    return Math.max(1, Math.min(4, hardwareConcurrency()));
}

function ceilDiv(n, d) {
    return Math.ceil(n / d);
}

function defaultWorkgroups(domain, info) {
    const wg = info && info.workgroupSize || [1, 1, 1];
    return [
        ceilDiv(domain?.[0] || 1, wg[0] || 1),
        ceilDiv(domain?.[1] || 1, wg[1] || 1),
        ceilDiv(domain?.[2] || 1, wg[2] || 1),
    ];
}

function visitBuffers(value, seen, fn) {
    if (value == null) return true;
    if (typeof value !== 'object') return true;
    if (seen.has(value)) return true;
    seen.add(value);

    if (ArrayBuffer.isView(value)) return fn(value.buffer);
    if (value instanceof ArrayBuffer) return fn(value);
    if (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) return fn(value);

    if (Array.isArray(value)) {
        for (const item of value) {
            if (!visitBuffers(item, seen, fn)) return false;
        }
        return true;
    }

    for (const item of Object.values(value)) {
        if (!visitBuffers(item, seen, fn)) return false;
    }
    return true;
}

function sharedBufferState(bindings) {
    let sawBuffer = false;
    const ok = typeof SharedArrayBuffer !== 'undefined' &&
        visitBuffers(bindings, new Set(), (buffer) => {
            sawBuffer = true;
            return buffer instanceof SharedArrayBuffer;
        });
    return { sawBuffer, ok: sawBuffer && ok };
}

function splitRows(domain, origin, shards) {
    const width = domain[0] || 1;
    const height = domain[1] || 1;
    const depth = domain[2] || 1;
    const ox = origin?.[0] || 0;
    const oy = origin?.[1] || 0;
    const oz = origin?.[2] || 0;
    const count = Math.max(1, Math.min(shards, height));
    const rowsPerShard = Math.ceil(height / count);
    const jobs = [];
    for (let y = 0; y < height; y += rowsPerShard) {
        const rows = Math.min(rowsPerShard, height - y);
        jobs.push({
            domain: [width, rows, depth],
            origin: [ox, oy + y, oz],
        });
    }
    return jobs;
}

export class WGSLBufferPool {
    constructor(opts = {}) {
        this.shared = !!opts.shared;
        this.buffers = new Map();
    }

    alloc(Type, length, shared) {
        if (shared) {
            if (typeof SharedArrayBuffer === 'undefined') {
                throw new Error('SharedArrayBuffer is not available in this context');
            }
            return new Type(new SharedArrayBuffer(length * Type.BYTES_PER_ELEMENT));
        }
        return new Type(length);
    }

    get(name, Type, length, opts = {}) {
        const shared = opts.shared == null ? this.shared : !!opts.shared;
        const key = String(name);
        const prev = this.buffers.get(key);
        if (prev &&
            prev.Type === Type &&
            prev.length === length &&
            prev.shared === shared) {
            if (opts.fill != null) prev.value.fill(opts.fill);
            return prev.value;
        }
        const value = this.alloc(Type, length, shared);
        if (opts.fill != null) value.fill(opts.fill);
        this.buffers.set(key, { Type, length, shared, value });
        return value;
    }

    delete(name) {
        return this.buffers.delete(String(name));
    }

    clear() {
        this.buffers.clear();
    }
}

export class WGSLRunner {
    constructor(opts = {}) {
        this.workerUrl = opts.workerUrl || DEFAULT_WORKER_URL;
        this.workerCount = opts.workers === 0 ? 0 : (opts.workers || defaultWorkerCount());
        this.useWorkers = opts.useWorkers !== false && this.workerCount > 0 && hasWorker();
        this.moduleCache = new Map();
        this.boundCache = new WeakMap();
        this.workers = [];
        this.nextJobId = 1;
        this.nextWorker = 0;
        this.pending = new Map();
    }

    async loadModule(moduleUrl) {
        let mod = this.moduleCache.get(moduleUrl);
        if (!mod) {
            const imported = await import(moduleUrl);
            mod = imported.default(runtime);
            this.moduleCache.set(moduleUrl, mod);
        }
        return mod;
    }

    boundEntries(mod, bindings) {
        if (!mod || typeof mod.bind !== 'function') return null;
        if (!bindings || typeof bindings !== 'object') return null;
        let byBindings = this.boundCache.get(mod);
        if (!byBindings) {
            byBindings = new WeakMap();
            this.boundCache.set(mod, byBindings);
        }
        let bound = byBindings.get(bindings);
        if (!bound) {
            bound = mod.bind(bindings);
            byBindings.set(bindings, bound);
        }
        return bound;
    }

    ensureWorkers() {
        if (!this.useWorkers) return;
        while (this.workers.length < this.workerCount) {
            const worker = new Worker(this.workerUrl, { type: 'module' });
            worker.onmessage = (event) => this.handleWorkerMessage(event);
            worker.onerror = (event) => {
                const err = new Error(event.message || 'WGSL worker error');
                for (const { reject } of this.pending.values()) reject(err);
                this.pending.clear();
            };
            this.workers.push(worker);
        }
    }

    handleWorkerMessage(event) {
        const msg = event.data || {};
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.ok) pending.resolve(msg);
        else pending.reject(new Error(msg.error || 'WGSL worker dispatch failed'));
    }

    runWorkerJob(job, transfer = []) {
        this.ensureWorkers();
        const worker = this.workers[this.nextWorker++ % this.workers.length];
        const id = this.nextJobId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            worker.postMessage({ id, ...job }, transfer);
        });
    }

    async runMainThread(job) {
        const mod = await this.loadModule(job.moduleUrl);
        const bound = this.boundEntries(mod, job.bindings);
        const fn = bound?.[job.entry] || mod.entry?.[job.entry];
        if (typeof fn !== 'function') throw new Error(`entry not found: ${job.entry}`);
        if (bound?.[job.entry]) fn(job.workgroups, job.domain, job.origin);
        else {
            fn({
                workgroups: job.workgroups,
                domain: job.domain,
                origin: job.origin,
                bindings: job.bindings,
            });
        }
        return { ok: true, bindings: job.bindings };
    }

    async normalizeJob(job, defaultBindings = null) {
        if (!job || !job.moduleUrl || !job.entry) {
            throw new Error('moduleUrl and entry are required');
        }
        const mod = await this.loadModule(job.moduleUrl);
        const info = mod.entryInfo?.[job.entry] || null;
        const domain = job.domain || null;
        return {
            ...job,
            bindings: job.bindings || defaultBindings,
            domain,
            origin: job.origin || [0, 0, 0],
            workgroups: job.workgroups || defaultWorkgroups(domain, info),
        };
    }

    async coalesceSequenceJobs(jobs) {
        const out = [];
        const tryPattern = async (i, entries, fusedEntry, workgroupIndex) => {
            if (i + entries.length > jobs.length) return null;
            const slice = jobs.slice(i, i + entries.length);
            const first = slice[0];
            if (!slice.every((job, idx) =>
                job.entry === entries[idx] &&
                job.moduleUrl === first.moduleUrl &&
                job.bindings === first.bindings)) return null;
            const mod = await this.loadModule(first.moduleUrl);
            if (typeof mod.entry?.[fusedEntry] !== 'function') return null;
            const driver = slice[workgroupIndex];
            return {
                ...driver,
                entry: fusedEntry,
                sequenceEntries: entries,
                coalescedJobs: entries.length,
            };
        };
        for (let i = 0; i < jobs.length;) {
            const triplet = await tryPattern(i, ['reset', 'reduce', 'finalize'], 'reset_reduce_finalize', 1);
            if (triplet) {
                out.push(triplet);
                i += 3;
                continue;
            }
            const pair = await tryPattern(i, ['reset', 'main'], 'reset_main', 1);
            if (pair) {
                out.push(pair);
                i += 2;
                continue;
            }
            out.push(jobs[i]);
            i++;
        }
        return out;
    }

    async dispatch(job) {
        const baseJob = await this.normalizeJob(job);
        const mod = await this.loadModule(baseJob.moduleUrl);
        const info = mod.entryInfo?.[baseJob.entry] || null;
        const domain = baseJob.domain;
        const origin = baseJob.origin;

        const shardCount = Math.max(1, Math.floor(job.shards || 1));
        if (shardCount > 1 && domain && info?.globalLoop) {
            const shared = sharedBufferState(baseJob.bindings);
            if (shared.ok) {
                const shardJobs = splitRows(domain, origin, shardCount).map(part => ({
                    moduleUrl: baseJob.moduleUrl,
                    entry: baseJob.entry,
                    workgroups: defaultWorkgroups(part.domain, info),
                    domain: part.domain,
                    origin: part.origin,
                    bindings: baseJob.bindings,
                }));
                if (this.useWorkers) {
                    await Promise.all(shardJobs.map(shard => this.runWorkerJob(shard)));
                } else {
                    for (const shard of shardJobs) await this.runMainThread(shard);
                }
                return { ok: true, bindings: baseJob.bindings, shards: shardJobs.length, sharded: true };
            }
        }

        if (this.useWorkers) {
            return this.runWorkerJob(baseJob, job.transfer || []);
        }
        return this.runMainThread(baseJob);
    }

    async dispatchSequence(jobs, opts = {}) {
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return { ok: true, bindings: opts.bindings || null, jobs: 0 };
        }
        const normalized = [];
        for (const job of jobs) normalized.push(await this.normalizeJob(job, opts.bindings || null));
        const scheduled = opts.coalesce === false ? normalized : await this.coalesceSequenceJobs(normalized);
        const bindings = opts.bindings || normalized[normalized.length - 1].bindings;
        if (this.useWorkers) {
            await this.runWorkerJob({
                jobs: scheduled.map(job => ({
                    moduleUrl: job.moduleUrl,
                    entry: job.entry,
                    workgroups: job.workgroups,
                    domain: job.domain,
                    origin: job.origin,
                    bindings: job.bindings === bindings ? undefined : job.bindings,
                })),
                bindings,
                transferBack: opts.transferBack,
            }, opts.transfer || []);
        } else {
            for (const job of scheduled) await this.runMainThread(job);
        }
        return {
            ok: true,
            bindings,
            jobs: normalized.length,
            dispatchedJobs: scheduled.length,
            coalescedJobs: normalized.length - scheduled.length,
        };
    }

    terminate() {
        for (const worker of this.workers) worker.terminate();
        this.workers = [];
        for (const { reject } of this.pending.values()) {
            reject(new Error('WGSL runner terminated'));
        }
        this.pending.clear();
    }
}

export function createWGSLRunner(opts = {}) {
    return new WGSLRunner(opts);
}
