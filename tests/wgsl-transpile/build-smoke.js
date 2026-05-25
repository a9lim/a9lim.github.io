#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/build-smoke.js — Build-time artifact validation.

   _build.mjs writes pre-transpiled .js artifacts for every entry-point
   shader in a configured shader directory. This script validates the
   artifacts the writer produced, without re-running the build (running
   the build would touch artifact mtimes and skew the skip-on-unchanged
   invariant test).

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
    const out = { source: null, helpersSha: null, unitSha: null, opts: null, generated: null };
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const l = lines[i];
        const m1 = l.match(/^\/\/ source: (.+)$/);
        if (m1) { out.source = m1[1]; continue; }
        const m2 = l.match(/^\/\/ helpers-sha256: ([0-9a-f]+)$/);
        if (m2) { out.helpersSha = m2[1]; continue; }
        const m3 = l.match(/^\/\/ wgsl-transpile sha256: ([0-9a-f]+)$/);
        if (m3) { out.unitSha = m3[1]; continue; }
        const m4 = l.match(/^\/\/ wgsl-opts: (.+)$/);
        if (m4) { try { out.opts = JSON.parse(m4[1]); } catch { /* invalid header — caller checks */ } continue; }
        const m5 = l.match(/^\/\/ generated: (.+)$/);
        if (m5) { out.generated = m5[1]; continue; }
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
        if (!h.source || !h.unitSha || !h.opts) {
            console.log(`    [${rel}] missing header field(s):`,
                        { source: !!h.source, unitSha: !!h.unitSha, opts: !!h.opts });
            allValid = false;
        }
    }
    check(`all ${artifacts.length} artifact headers have source/unitSha/opts`, allValid);
}

// ── Test 3: each artifact's source-hash matches the live .wgsl ────
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
// `entry` keys must match what transpileWGSL reports for the same opts.
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
        const wantEntries = expected.entryPoints.slice().sort();
        if (gotEntries.join(',') !== wantEntries.join(',')) {
            console.log(`    [${h.source}] entry-point mismatch:`);
            console.log(`      artifact: ${gotEntries.join(',')}`);
            console.log(`      fresh:    ${wantEntries.join(',')}`);
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
testSourceHashes(artifacts);
testByteIdenticalBodies(artifacts);
testNodeCheck(artifacts);
await testRuntimeInstantiation(artifacts);

console.log('');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
