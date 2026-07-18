#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/build-smoke.js — Build-time artifact validation.

   Dormant integration harness: this validates pre-transpiled .js artifacts
   if an artifact writer is restored. The current _build.mjs intentionally
   writes none, so this script is not part of the active test gate and exits
   non-zero after reporting the absent transpiled/ tree.

   The strongest invariant is byte-identical jsSource between artifact
   and fresh transpileWGSL() with the same opts: if those match, the
   runtime behavior of the artifact matches what compileWGSL() would
   produce from the same source — no need for shader-specific synthetic
   inputs to validate per-kernel semantics. Per-kernel correctness is
   already covered by tests/wgsl-transpile/smoke.js and the corpus
   walker in run.js.

   Data-driven: walks transpiled/ recursively to find every artifact,
   then parses each artifact's header (source path, hashes, opts) to
   reconstruct and validate. No duplicated WGSL_SHADER_DIRS config.

   Exits 0 on full pass, 1 on any failure.
   ─────────────────────────────────────────────────────────────────── */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { transpileWGSL, runtime } from '../../shared-wgsl-transpile.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const TRANSPILED_ROOT = join(REPO_ROOT, 'transpiled');
const TRANSPILER_SHA = sha256Hex(readFileSync(join(REPO_ROOT, 'shared-wgsl-transpile.js'), 'utf8'));

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
    if (cond) { pass++; console.log(`  ✓ ${name}`); }
    else      { fail++; console.log(`  ✗ ${name}${detail ? '  — ' + detail : ''}`); }
}

function sha256Hex(s) {
    return createHash('sha256').update(s).digest('hex');
}

// Walk a directory tree and collect every file matching `predicate`.
function walk(dirAbs, predicate, out = []) {
    if (!existsSync(dirAbs)) return out;
    for (const name of readdirSync(dirAbs)) {
        const abs = join(dirAbs, name);
        const st = statSync(abs);
        if (st.isDirectory()) walk(abs, predicate, out);
        else if (predicate(abs)) out.push(abs);
    }
    return out;
}

// Pull the build-time header fields off an artifact's leading lines.
function parseHeader(text) {
    const out = { source: null, variant: null, helpersSha: null, unitSha: null, transpilerSha: null, opts: null, metrics: null, generated: null };
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 14); i++) {
        const l = lines[i];
        const m1 = l.match(/^\/\/ source: (.+)$/);
        if (m1) { out.source = m1[1]; continue; }
        const mv = l.match(/^\/\/ wgsl-variant: (.+)$/);
        if (mv) { out.variant = mv[1]; continue; }
        const m2 = l.match(/^\/\/ helpers-sha256: ([0-9a-f]+)$/);
        if (m2) { out.helpersSha = m2[1]; continue; }
        const m3 = l.match(/^\/\/ wgsl-transpile sha256: ([0-9a-f]+)$/);
        if (m3) { out.unitSha = m3[1]; continue; }
        const mt = l.match(/^\/\/ wgsl-transpiler-sha256: ([0-9a-f]+)$/);
        if (mt) { out.transpilerSha = mt[1]; continue; }
        const m4 = l.match(/^\/\/ wgsl-opts: (.+)$/);
        if (m4) { try { out.opts = JSON.parse(m4[1]); } catch { /* invalid header — caller checks */ } continue; }
        const m5 = l.match(/^\/\/ wgsl-metrics: (.+)$/);
        if (m5) { try { out.metrics = JSON.parse(m5[1]); } catch { /* invalid header — caller checks */ } continue; }
        const m6 = l.match(/^\/\/ generated: (.+)$/);
        if (m6) { out.generated = m6[1]; continue; }
    }
    return out;
}

// Strip the build-time header lines (6 leading // lines, no trailing
// blank — the transpiler's banner-strip already consumed that) so
// the artifact body can be compared byte-identically against
// transpilerJsSourceBody() output.
function bodyOnly(artifactText) {
    return artifactText.replace(
        /^(?:\/\/[^\n]*\n)+/,
        ''
    );
}

function transpilerJsSourceBody(jsSource) {
    // transpileWGSL's jsSource starts with its own 2-line banner.
    return jsSource.replace(
        /^\/\/ Auto-generated from WGSL[^\n]*\n\/\/ DO NOT EDIT[^\n]*\n\n/,
        ''
    );
}

// Collect sibling helpers in the same dir as an entry shader.
// Mirrors _build.mjs's classification: helpers = no @compute/@vertex/@fragment.
function collectHelpersForEntry(entryAbs) {
    const dir = dirname(entryAbs);
    const siblings = readdirSync(dir)
        .filter(f => f.endsWith('.wgsl'))
        .map(f => join(dir, f))
        .sort();
    const helpers = [];
    for (const abs of siblings) {
        if (abs === entryAbs) continue;
        const src = readFileSync(abs, 'utf8');
        if (!/@(compute|vertex|fragment)\b/.test(src)) {
            helpers.push(src);
        }
    }
    return helpers;
}

// ── Test 1: transpiled/ tree contains artifacts ───────────────────
function testTranspiledTreeExists() {
    console.log('test: transpiled/ tree has artifacts');
    check('transpiled/ directory exists', existsSync(TRANSPILED_ROOT));
    const artifacts = walk(TRANSPILED_ROOT, p => p.endsWith('.transpiled.js'));
    check('transpiled/ contains at least one .transpiled.js artifact',
          artifacts.length > 0,
          `found ${artifacts.length}`);
    return artifacts;
}

// ── Test 2: every artifact has a valid build-time header ──────────
function testArtifactHeaders(artifacts) {
    console.log('test: artifact headers are well-formed');
    let allValid = true;
    for (const abs of artifacts) {
        const text = readFileSync(abs, 'utf8');
        const h = parseHeader(text);
        const rel = relative(REPO_ROOT, abs);
        if (!h.source || !h.unitSha || !h.transpilerSha || !h.opts || !h.metrics) {
            console.log(`    [${rel}] missing header field(s):`,
                        { source: !!h.source, unitSha: !!h.unitSha, transpilerSha: !!h.transpilerSha, opts: !!h.opts, metrics: !!h.metrics });
            allValid = false;
        } else if (h.transpilerSha !== TRANSPILER_SHA) {
            console.log(`    [${rel}] transpiler hash mismatch (artifact stale — re-run node _build.mjs)`);
            allValid = false;
        }
    }
    check(`all ${artifacts.length} artifact headers have source/unitSha/transpilerSha/opts/metrics`, allValid);
}

// ── Test 3: configured sweep-specialized artifacts exist ──────────
function testSweepVariants(artifacts) {
    console.log('test: sweep-specialized artifacts are present');
    const headersByRel = new Map(artifacts.map(abs => [
        relative(REPO_ROOT, abs),
        parseHeader(readFileSync(abs, 'utf8')),
    ]));
    const expected = [
        ['transpiled/plasma/src/gpu/shaders/reconstruct-ppm.x.transpiled.js', 'x', 0],
        ['transpiled/plasma/src/gpu/shaders/reconstruct-ppm.y.transpiled.js', 'y', 1],
        ['transpiled/plasma/src/gpu/shaders/riemann-hlld.x.transpiled.js', 'x', 0],
        ['transpiled/plasma/src/gpu/shaders/riemann-hlld.y.transpiled.js', 'y', 1],
    ];
    let allOk = true;
    for (const [rel, variant, sweepDir] of expected) {
        const h = headersByRel.get(rel);
        if (!h) {
            console.log(`    [${rel}] missing specialized artifact`);
            allOk = false;
            continue;
        }
        const text = readFileSync(join(REPO_ROOT, rel), 'utf8');
        const got = h.opts?.specializeUniforms?.sweep?.sweep_dir;
        const helperAxis = h.opts?.specializeFunctionParams?.pack_flux?.axis;
        if (h.variant !== variant || got !== sweepDir) {
            console.log(`    [${rel}] bad variant header: variant=${h.variant}, sweep_dir=${got}`);
            allOk = false;
        } else if (helperAxis !== sweepDir) {
            console.log(`    [${rel}] missing helper axis specialization: pack_flux.axis=${helperAxis}`);
            allOk = false;
        } else if (/\baxis == 0\b/.test(text) || /\baxis == 1\b/.test(text)) {
            console.log(`    [${rel}] dynamic axis branch survived in specialized artifact`);
            allOk = false;
        }
    }
    check('x/y sweep artifacts carry specialized SweepDir opts and no dynamic axis branches', allOk);
}

// ── Test 4: view/stage/profile-specialized artifacts exist ────────
function testSpecializedVariants(artifacts) {
    console.log('test: view/stage/profile-specialized artifacts are present');
    const headersByRel = new Map(artifacts.map(abs => [
        relative(REPO_ROOT, abs),
        parseHeader(readFileSync(abs, 'utf8')),
    ]));
    let allOk = true;

    const computeDt = headersByRel.get('transpiled/plasma/src/gpu/shaders/compute-dt.transpiled.js');
    const hotFns = computeDt?.opts?.inlineHotFns || [];
    if (!Array.isArray(hotFns) || !hotFns.includes('jz_mag_at')) {
        console.log(`    [compute-dt] missing per-shader inlineHotFns: ${JSON.stringify(hotFns)}`);
        allOk = false;
    }

    const viewModes = [
        ['rho', 0],
        ['pressure', 1],
        ['speed', 2],
        ['bmag', 3],
        ['jz', 4],
    ];
    for (const [variant, mode] of viewModes) {
        const rel = `transpiled/plasma/src/gpu/shaders/view-field.${variant}.transpiled.js`;
        const h = headersByRel.get(rel);
        if (!h) {
            console.log(`    [${rel}] missing view-field variant`);
            allOk = false;
            continue;
        }
        const body = bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8'));
        const got = h.opts?.specializeUniforms?.U_uniforms?.view_mode;
        if (h.variant !== variant || got !== mode) {
            console.log(`    [${rel}] bad variant header: variant=${h.variant}, view_mode=${got}`);
            allOk = false;
        } else if (/_u_U_uniforms_view_mode\b/.test(body) || /\bview_mode\b/.test(body)) {
            console.log(`    [${rel}] dynamic view_mode read survived in specialized artifact`);
            allOk = false;
        }
    }

    const stageVariants = [
        ['s1', 1.0,     0.0,     1.0],
        ['s2', 3.0/4.0, 1.0/4.0, 1.0/4.0],
        ['s3', 1.0/3.0, 2.0/3.0, 2.0/3.0],
    ];
    const stageShaders = ['update-conserved-weighted', 'update-b-weighted'];
    const close = (a, b) => Math.abs(a - b) < 1e-12;
    for (const shader of stageShaders) {
        for (const [variant, a0, a1, dt_w] of stageVariants) {
            const rel = `transpiled/plasma/src/gpu/shaders/${shader}.${variant}.transpiled.js`;
            const h = headersByRel.get(rel);
            if (!h) {
                console.log(`    [${rel}] missing RK3 stage variant`);
                allOk = false;
                continue;
            }
            const spec = h.opts?.specializeUniforms?.stage_params || {};
            const body = bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8'));
            if (h.variant !== variant ||
                    !close(spec.a0, a0) ||
                    !close(spec.a1, a1) ||
                    !close(spec.dt_w, dt_w)) {
                console.log(`    [${rel}] bad stage header: variant=${h.variant}, opts=${JSON.stringify(spec)}`);
                allOk = false;
            } else if (/_u_stage_params_(a0|a1|dt_w)\b/.test(body)) {
                console.log(`    [${rel}] dynamic stage_params read survived in specialized artifact`);
                allOk = false;
            }
        }
    }

    const gridNs = [256, 512, 1024];
    const gridShaders = [
        ['colormap', n => [Math.ceil(n / 8), Math.ceil(n / 8), 1]],
        ['compute-emf', n => [Math.ceil((n + 1) / 8), Math.ceil((n + 1) / 8), 1]],
        ['energy-floor', n => [Math.ceil(n / 8), Math.ceil(n / 8), 1]],
        ['lic-normalize', n => [Math.ceil(n / 8), Math.ceil(n / 8), 1]],
    ];
    for (const [shader, workgroupsFor] of gridShaders) {
        for (const n of gridNs) {
            const rel = `transpiled/plasma/src/gpu/shaders/${shader}.n${n}.transpiled.js`;
            const h = headersByRel.get(rel);
            if (!h) {
                console.log(`    [${rel}] missing grid-specialized variant`);
                allOk = false;
                continue;
            }
            const spec = h.opts?.specializeUniforms?.U_uniforms || {};
            const body = bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8'));
            const fixed = h.opts?.fixedWorkgroups || [];
            const wantFixed = workgroupsFor(n);
            if (h.variant !== `n${n}` ||
                    spec.grid_n !== n ||
                    spec.grid_n_total !== n + 4 ||
                    spec.ghost_w !== 2 ||
                    JSON.stringify(fixed) !== JSON.stringify(wantFixed)) {
                console.log(`    [${rel}] bad grid header: variant=${h.variant}, opts=${JSON.stringify(spec)}, fixed=${JSON.stringify(fixed)}`);
                allOk = false;
            } else if (/_u_U_uniforms_(grid_n|grid_n_total|ghost_w)\b/.test(body)) {
                console.log(`    [${rel}] dynamic grid/ghost uniform read survived in specialized artifact`);
                allOk = false;
            }
        }
    }

    for (const n of gridNs) {
        const rel = `transpiled/plasma/src/gpu/shaders/lic-advect.n${n}.transpiled.js`;
        const h = headersByRel.get(rel);
        const body = h ? bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')) : '';
        const spec = h?.opts?.specializeUniforms?.U_uniforms || {};
        if (!h ||
                h.variant !== `n${n}` ||
                spec.grid_n !== n ||
                spec.noise_n !== 1024 ||
                /_u_U_uniforms_(grid_n|grid_n_total|ghost_w|noise_n)\b/.test(body)) {
            console.log(`    [${rel}] bad LIC grid/noise specialization`);
            allOk = false;
        }
    }

    for (const shader of ['compute-dt', 'apply-resistivity-init', 'apply-resistivity-prev']) {
        for (const n of gridNs) {
            const rel = `transpiled/plasma/src/gpu/shaders/${shader}.n${n}.eta0.transpiled.js`;
            const h = headersByRel.get(rel);
            const body = h ? bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')) : '';
            const spec = h?.opts?.specializeUniforms?.U_uniforms || {};
            if (!h ||
                    h.variant !== `n${n}.eta0` ||
                    spec.grid_n !== n ||
                    spec.eta_anom_alpha !== 0 ||
                    /_u_U_uniforms_(grid_n|grid_n_total|ghost_w|eta_anom_alpha)\b/.test(body)) {
                console.log(`    [${rel}] bad grid/eta0 specialization`);
                allOk = false;
            }
        }
    }

    const bcModes = [
        ['periodic', 0],
        ['outflow', 1],
        ['reflecting', 2],
        ['driven', 3],
    ];
    for (const n of gridNs) {
        for (const [name, mode] of bcModes) {
            const rel = `transpiled/plasma/src/gpu/shaders/apply-bcs.n${n}.bc-${name}.transpiled.js`;
            const h = headersByRel.get(rel);
            const body = h ? bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')) : '';
            const uSpec = h?.opts?.specializeUniforms?.U_uniforms || {};
            const bcSpec = h?.opts?.specializeUniforms?.bc || {};
            const fixed = h?.opts?.fixedWorkgroups || [];
            const wantFixed = [Math.ceil((n + 5) / 8), Math.ceil((n + 5) / 8), 1];
            const modesOk = ['mode_n', 'mode_s', 'mode_e', 'mode_w'].every(k => bcSpec[k] === mode);
            if (!h ||
                    h.variant !== `n${n}.bc-${name}` ||
                    uSpec.grid_n !== n ||
                    !modesOk ||
                    JSON.stringify(fixed) !== JSON.stringify(wantFixed) ||
                    /bindings\.bc\.mode_[nsew]\b/.test(body)) {
                console.log(`    [${rel}] bad BC mode/grid specialization`);
                allOk = false;
            }
        }
    }

    for (const [variant, mode] of viewModes) {
        for (const n of gridNs) {
            const rel = `transpiled/plasma/src/gpu/shaders/view-field.${variant}.n${n}.transpiled.js`;
            const h = headersByRel.get(rel);
            const body = h ? bodyOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')) : '';
            const spec = h?.opts?.specializeUniforms?.U_uniforms || {};
            if (!h ||
                    h.variant !== `${variant}.n${n}` ||
                    spec.view_mode !== mode ||
                    spec.grid_n !== n ||
                    /_u_U_uniforms_(view_mode|grid_n|grid_n_total|ghost_w)\b/.test(body)) {
                console.log(`    [${rel}] bad combined view/grid specialization`);
                allOk = false;
            }
        }
    }

    check('view modes, RK3 stages, grid/ghost/noise/eta variants, and per-shader profile opts are encoded and folded', allOk);
}

// ── Test 5: reduction sequence artifacts expose fused entries ─────
async function testReductionSequenceEntries() {
    console.log('test: reduction sequence artifacts expose fused entries');
    const expected = [
        ['transpiled/plasma/src/gpu/shaders/compute-dt.transpiled.js', 'reset_reduce_finalize', ['reset', 'reduce', 'finalize']],
        ['transpiled/plasma/src/gpu/shaders/lic-reduce.transpiled.js', 'reset_main', ['reset', 'main']],
    ];
    let allOk = true;
    for (const [rel, entryName, entries] of expected) {
        const abs = join(REPO_ROOT, rel);
        if (!existsSync(abs)) {
            console.log(`    [${rel}] missing artifact`);
            allOk = false;
            continue;
        }
        let mod;
        try {
            const m = await import(new URL('file://' + abs).href);
            mod = m.default(runtime);
        } catch (err) {
            console.log(`    [${rel}] import failed: ${err.message}`);
            allOk = false;
            continue;
        }
        const info = mod.entryInfo?.[entryName];
        if (typeof mod.entry?.[entryName] !== 'function' ||
                info?.sequence !== true ||
                info?.fusedDispatch !== true ||
                JSON.stringify(info.entries) !== JSON.stringify(entries)) {
            console.log(`    [${rel}] bad fused entry metadata for ${entryName}: ${JSON.stringify(info)}`);
            allOk = false;
        }
    }
    check('plasma reduction artifacts expose expected fused sequence entries', allOk);
}

// ── Test 5: each artifact's source-hash matches the live .wgsl ────
function testSourceHashes(artifacts) {
    console.log('test: artifact source-hashes match live .wgsl content');
    let allMatch = true;
    for (const abs of artifacts) {
        const text = readFileSync(abs, 'utf8');
        const h = parseHeader(text);
        const sourceAbs = join(REPO_ROOT, h.source);
        if (!existsSync(sourceAbs)) {
            console.log(`    [${h.source}] source missing — artifact orphaned`);
            allMatch = false;
            continue;
        }
        const entrySrc = readFileSync(sourceAbs, 'utf8');
        const helpers  = collectHelpersForEntry(sourceAbs);
        const helperSrc = helpers.join('\n');
        const unitSrc  = helpers.length ? helperSrc + '\n' + entrySrc : entrySrc;
        const freshHash = sha256Hex(unitSrc);
        if (freshHash !== h.unitSha) {
            console.log(`    [${h.source}] hash mismatch (artifact stale — re-run node _build.mjs)`);
            console.log(`      header: ${h.unitSha}`);
            console.log(`      fresh:  ${freshHash}`);
            allMatch = false;
        }
    }
    check(`all ${artifacts.length} artifacts match live source hashes`, allMatch);
}

// ── Test 4: artifact body == fresh transpileWGSL(unitSrc, opts) ───
// The strongest invariant: byte-identical jsSource means runtime
// semantics match by construction. Per-kernel correctness is covered
// elsewhere (smoke.js, run.js); this guards the writer + reader path.
function testByteIdenticalBodies(artifacts) {
    console.log('test: artifact bodies are byte-identical to fresh transpileWGSL()');
    let allMatch = true;
    for (const abs of artifacts) {
        const text = readFileSync(abs, 'utf8');
        const h = parseHeader(text);
        if (!h.source || !h.opts) continue;  // header test will have flagged this
        const sourceAbs = join(REPO_ROOT, h.source);
        const entrySrc = readFileSync(sourceAbs, 'utf8');
        const helpers  = collectHelpersForEntry(sourceAbs);
        const unitSrc  = helpers.length ? helpers.join('\n') + '\n' + entrySrc : entrySrc;

        let fresh;
        try { fresh = transpileWGSL(unitSrc, h.opts); }
        catch (err) {
            console.log(`    [${h.source}] fresh transpile threw: ${err.message}`);
            allMatch = false;
            continue;
        }
        const expected = transpilerJsSourceBody(fresh.jsSource);
        const actual   = bodyOnly(text);
        if (expected !== actual) {
            console.log(`    [${h.source}] body mismatch (artifact stale — re-run node _build.mjs)`);
            allMatch = false;
        }
    }
    check(`all ${artifacts.length} artifact bodies match fresh transpile`, allMatch);
}

// ── Test 5: generated-code metric headers match fresh transpile ─────
function testArtifactMetrics(artifacts) {
    console.log('test: artifact metric headers match fresh transpile and perf budgets');
    let allMatch = true;
    // Plasma compute artifacts must reach rt.* = 0. A few geon shaders carry
    // known, correct rt.* fallbacks that have no inline form today; allow those
    // exact counts so the zero-budget gate flags *new* fallbacks without
    // flagging correct code. Exact metrics are still pinned by the header-vs-
    // fresh comparison below, so these can't silently drift upward either.
    const RT_BUDGET = new Map([
        // CAS on array<atomic<u32>> storage → rt.atomicCompareExchangeWeakAt.
        // Single-threaded CAS is correct via the runtime helper; no inline yet.
        ['geon/src/gpu/shaders/boson-tree.wgsl', { rtAtomic: 9 }],
        ['geon/src/gpu/shaders/tree-build.wgsl', { rtAtomic: 1 }],
        // WGSL round() → rt.roundEven (ties-to-even). Math.round would be wrong.
        ['geon/src/gpu/shaders/disintegration.wgsl', { rtNumeric: 4 }],
    ]);
    const expectedFlatWorkgroupSlots = new Map([
        ['plasma/src/gpu/shaders/reconstruct-ppm.wgsl', 1152],
        ['plasma/src/gpu/shaders/conservation-reduce.wgsl', 1536],
        ['plasma/src/gpu/shaders/conservation-finalize.wgsl', 1536],
    ]);
    for (const abs of artifacts) {
        const text = readFileSync(abs, 'utf8');
        const h = parseHeader(text);
        if (!h.source || !h.opts || !h.metrics) continue;
        const sourceAbs = join(REPO_ROOT, h.source);
        const entrySrc = readFileSync(sourceAbs, 'utf8');
        const helpers  = collectHelpersForEntry(sourceAbs);
        const unitSrc  = helpers.length ? helpers.join('\n') + '\n' + entrySrc : entrySrc;
        const fresh = transpileWGSL(unitSrc, h.opts);
        const wanted = JSON.stringify(fresh.metrics);
        const got = JSON.stringify(h.metrics);
        if (wanted !== got) {
            console.log(`    [${h.source}] metrics mismatch`);
            console.log(`      header: ${got}`);
            console.log(`      fresh:  ${wanted}`);
            allMatch = false;
            continue;
        }
        const budget = RT_BUDGET.get(h.source) || {};
        const over = (cat) => h.metrics[cat] > (budget[cat] || 0);
        if (over('rtVec') || over('rtPoly') || over('rtAtomic') || over('rtNumeric')) {
            console.log(
                `    [${h.source}] perf budget exceeded: ` +
                `rtVec=${h.metrics.rtVec}, rtPoly=${h.metrics.rtPoly}, ` +
                `rtAtomic=${h.metrics.rtAtomic}, rtNumeric=${h.metrics.rtNumeric}` +
                (Object.keys(budget).length ? `  (allowed: ${JSON.stringify(budget)})` : '')
            );
            allMatch = false;
        }
        const expectedSlots = expectedFlatWorkgroupSlots.get(h.source);
        if (expectedSlots != null && h.metrics.flatWorkgroupSlots !== expectedSlots) {
            console.log(
                `    [${h.source}] flat workgroup slot budget changed: ` +
                `got ${h.metrics.flatWorkgroupSlots}, want ${expectedSlots}`
            );
            allMatch = false;
        }
    }
    check(`all ${artifacts.length} metric headers match and stay within rt.* budgets`, allMatch);
}

// ── Test 5: each artifact passes `node --check` ───────────────────
function testNodeCheck(artifacts) {
    console.log('test: artifacts pass node --check syntax validation');
    let allClean = true;
    for (const abs of artifacts) {
        const r = spawnSync('node', ['--check', abs], { encoding: 'utf8' });
        if (r.status !== 0) {
            console.log(`    [${relative(REPO_ROOT, abs)}] node --check failed:`);
            console.log(`      ${r.stderr.trim().split('\n').slice(0, 3).join(' / ')}`);
            allClean = false;
        }
    }
    check(`all ${artifacts.length} artifacts pass node --check`, allClean);
}

// ── Test 6: artifacts instantiate; bindings/entries match metadata ─
// Per-artifact import + factory invocation. The exposed `bindings` and
// `entry`/`entryInfo` keys must match what transpileWGSL reports for the same opts.
async function testRuntimeInstantiation(artifacts) {
    console.log('test: artifacts instantiate with the expected entry/binding catalog');
    let allOk = true;
    for (const abs of artifacts) {
        const text = readFileSync(abs, 'utf8');
        const h = parseHeader(text);
        if (!h.source || !h.opts) continue;
        const sourceAbs = join(REPO_ROOT, h.source);
        const entrySrc = readFileSync(sourceAbs, 'utf8');
        const helpers  = collectHelpersForEntry(sourceAbs);
        const unitSrc  = helpers.length ? helpers.join('\n') + '\n' + entrySrc : entrySrc;
        const expected = transpileWGSL(unitSrc, h.opts);

        let mod;
        try {
            const importUrl = new URL('file://' + abs);
            const m = await import(importUrl.href);
            mod = m.default(runtime);
        } catch (err) {
            console.log(`    [${h.source}] import/instantiate failed: ${err.message}`);
            allOk = false;
            continue;
        }
        const gotBindings = JSON.stringify(mod.bindings);
        const wantBindings = JSON.stringify(expected.bindings);
        if (gotBindings !== wantBindings) {
            console.log(`    [${h.source}] bindings mismatch:`);
            console.log(`      artifact: ${gotBindings}`);
            console.log(`      fresh:    ${wantBindings}`);
            allOk = false;
            continue;
        }
        const gotEntries = Object.keys(mod.entry).sort();
        const wantEntries = Object.keys(expected.entryInfo).sort();
        if (gotEntries.join(',') !== wantEntries.join(',')) {
            console.log(`    [${h.source}] entry-point mismatch:`);
            console.log(`      artifact: ${gotEntries.join(',')}`);
            console.log(`      fresh:    ${wantEntries.join(',')}`);
            allOk = false;
            continue;
        }
        const gotInfo = JSON.stringify(mod.entryInfo);
        const wantInfo = JSON.stringify(expected.entryInfo);
        if (gotInfo !== wantInfo) {
            console.log(`    [${h.source}] entryInfo mismatch:`);
            console.log(`      artifact: ${gotInfo}`);
            console.log(`      fresh:    ${wantInfo}`);
            allOk = false;
        }
    }
    check(`all ${artifacts.length} artifacts instantiate with matching catalog`, allOk);
}

// ── main ──────────────────────────────────────────────────────────
const artifacts = testTranspiledTreeExists();
if (artifacts.length === 0) {
    console.log('');
    console.log('no artifacts to validate — run `node _build.mjs` first');
    process.exit(fail === 0 ? 0 : 1);
}
testArtifactHeaders(artifacts);
testSweepVariants(artifacts);
testSpecializedVariants(artifacts);
await testReductionSequenceEntries();
testSourceHashes(artifacts);
testByteIdenticalBodies(artifacts);
testArtifactMetrics(artifacts);
testNodeCheck(artifacts);
await testRuntimeInstantiation(artifacts);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
