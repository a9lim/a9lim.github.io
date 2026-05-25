#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/run.js — End-to-end test runner.

   Walks every .wgsl shader in the repo and feeds it through the
   transpiler phases that exist today. As phases come online (parser
   → emitter → runtime), this runner picks them up automatically.

   Usage:
     node tests/wgsl-transpile/run.js          # run all shaders
     node tests/wgsl-transpile/run.js plasma   # only plasma shaders
     node tests/wgsl-transpile/run.js --quiet  # only failures

   Exit code 0 if all expected stages pass; 1 if any regression.
   ─────────────────────────────────────────────────────────────────── */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname }    from 'node:path';
import { fileURLToPath } from 'node:url';

import { tokenize, parse, emit, compileWGSL, resolveModule, WGSLError }
    from '../../shared-wgsl-transpile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// ── Phases the transpiler exposes. As implementation progresses, ──
// add 'parse', 'emit', 'compile' to EXPECTED to enforce them.
const EXPECTED = new Set(['tokenize', 'parse', 'resolve', 'compile']);

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const FILTER = args.find(a => !a.startsWith('--')) || null;

// ── ANSI colors (skip if stdout is not a TTY) ─────────────────────
const tty = process.stdout.isTTY;
const C = {
    reset: tty ? '\x1b[0m'  : '',
    bold:  tty ? '\x1b[1m'  : '',
    dim:   tty ? '\x1b[2m'  : '',
    red:   tty ? '\x1b[31m' : '',
    green: tty ? '\x1b[32m' : '',
    yellow:tty ? '\x1b[33m' : '',
    blue:  tty ? '\x1b[34m' : '',
    gray:  tty ? '\x1b[90m' : '',
};

/** Recursively find .wgsl files under `root`, skipping node_modules etc. */
async function findShaders(root) {
    /** @type {string[]} */
    const out = [];
    async function walk(dir) {
        let entries;
        try { entries = await readdir(dir, { withFileTypes: true }); }
        catch { return; }
        for (const ent of entries) {
            if (ent.name.startsWith('.') || ent.name === 'node_modules' ||
                ent.name === '_dev-assets') continue;
            const p = join(dir, ent.name);
            if (ent.isDirectory()) await walk(p);
            else if (ent.name.endsWith('.wgsl')) out.push(p);
        }
    }
    await walk(root);
    out.sort();
    return out;
}

/** Quick check: does a parsed shader define any entry point?
 *  Files with no @compute/@vertex/@fragment fn are treated as helpers and
 *  get prepended to every other shader in the same directory during the
 *  resolve phase — matching how plasma/geon assemble shaders before
 *  `createShaderModule({ code: helpers + perPassShader })`. */
function hasEntryPoint(ast) {
    for (const item of ast.items) {
        if (item.kind !== 'fn') continue;
        for (const a of item.attrs) {
            if (a.name === 'compute' || a.name === 'vertex' || a.name === 'fragment') return true;
        }
    }
    return false;
}

/** Pre-pass over a dir: read all sibling .wgsl, classify into helpers
 *  vs entries based on entry-point presence. Returns the helper sources
 *  in path-sorted order (deterministic) so the resolve unit for any file
 *  is reproducible. Sources are kept on the dir record so we don't re-read
 *  per-file. */
async function buildDirIndex(dirAbs, fileList) {
    const records = [];
    for (const abs of fileList) {
        const src = await readFile(abs, 'utf8');
        let ast = null, hasEntry = false;
        try {
            ast = parse(tokenize(src));
            hasEntry = hasEntryPoint(ast);
        } catch { /* parse failure surfaces in its own phase */ }
        records.push({ abs, src, ast, hasEntry });
    }
    records.sort((a, b) => a.abs.localeCompare(b.abs));
    const helperSources = records.filter(r => !r.hasEntry).map(r => r.src);
    return { records, helperSources };
}

/** Run one shader through every available phase; return per-phase result.
 *  `dirIndex` is the result of buildDirIndex for the file's parent dir —
 *  used by the resolve phase to prepend sibling helpers. */
async function testShader(absPath, dirIndex) {
    const rec = dirIndex.records.find(r => r.abs === absPath);
    const src = rec.src;
    const phases = {};

    // ── tokenize ────────────────────────────────────────────────────
    try {
        const tokens = tokenize(src);
        phases.tokenize = {
            status: 'ok',
            metrics: {
                tokens: tokens.length,
                lines: src.split('\n').length,
                kw: tokens.filter(t => t.kind === 'kw').length,
                ident: tokens.filter(t => t.kind === 'ident').length,
                num: tokens.filter(t => t.kind === 'num').length,
                punct: tokens.filter(t => t.kind === 'punct').length,
            },
        };
    } catch (e) {
        phases.tokenize = { status: 'fail', error: e.message };
    }

    // ── parse (gated; will become 'fail' once EXPECTED includes it) ─
    try {
        if (phases.tokenize.status === 'ok') {
            const tokens = tokenize(src); // re-tokenize for cleanliness
            parse(tokens);
            phases.parse = { status: 'ok' };
        }
    } catch (e) {
        phases.parse = { status: EXPECTED.has('parse') ? 'fail' : 'pending', error: e.message };
    }

    // ── resolve (module-level symbol table) ─────────────────────────
    // Builds the resolve unit as (sibling helpers ++ self), matching the
    // shader assembly that plasma/geon do before createShaderModule. For
    // helper files, "siblings" excludes self so we don't duplicate decls.
    try {
        if (phases.parse.status === 'ok') {
            const helpers = rec.hasEntry
                ? dirIndex.helperSources
                : dirIndex.helperSources.filter(s => s !== src);
            const unitSrc = helpers.length ? helpers.join('\n') + '\n' + src : src;
            const ast = parse(tokenize(unitSrc));
            const sym = resolveModule(ast);
            let total = 0, nulls = 0;
            const tally = (t) => { total++; if (t == null) nulls++; };
            for (const t of sym.bindingTypes.values())      tally(t);
            for (const t of sym.workgroupVarTypes.values()) tally(t);
            for (const t of sym.privateVarTypes.values())   tally(t);
            for (const t of sym.constTypes.values())        tally(t);
            for (const sig of sym.fnSignatures.values()) {
                tally(sig.returnType);
                for (const p of sig.params) tally(p.type);
            }
            for (const st of sym.structTypes.values()) {
                for (const ft of st.fields.values()) tally(ft);
            }
            phases.resolve = { status: 'ok', metrics: { total, nulls } };
        }
    } catch (e) {
        phases.resolve = { status: EXPECTED.has('resolve') ? 'fail' : 'pending', error: e.message };
    }

    // ── emit ────────────────────────────────────────────────────────
    try {
        emit(null);
        phases.emit = { status: 'ok' };
    } catch (e) {
        phases.emit = { status: EXPECTED.has('emit') ? 'fail' : 'pending', error: e.message };
    }

    // ── full compile pipeline ───────────────────────────────────────
    try {
        compileWGSL(src);
        phases.compile = { status: 'ok' };
    } catch (e) {
        phases.compile = { status: EXPECTED.has('compile') ? 'fail' : 'pending', error: e.message };
    }

    return phases;
}

/** Compact one-line summary for a phase result. */
function fmtPhase(name, r) {
    if (!r) return '';
    if (r.status === 'ok') {
        if (name === 'tokenize') {
            const m = r.metrics;
            return `${C.green}✓${C.reset} ${name} ${C.dim}(${m.tokens}t)${C.reset}`;
        }
        return `${C.green}✓${C.reset} ${name}`;
    }
    if (r.status === 'pending') return `${C.gray}·${C.reset} ${name}`;
    return `${C.red}✗${C.reset} ${name}`;
}

async function main() {
    let shaders = await findShaders(REPO_ROOT);
    if (FILTER) shaders = shaders.filter(p => p.includes(FILTER));

    if (shaders.length === 0) {
        console.error(`${C.yellow}no .wgsl files found${C.reset}${FILTER ? ` matching "${FILTER}"` : ''}`);
        process.exit(1);
    }

    console.log(`${C.bold}wgsl-transpile test run${C.reset}  ${C.dim}(${shaders.length} shader${shaders.length === 1 ? '' : 's'})${C.reset}`);
    console.log(`${C.dim}expected phases:${C.reset} ${[...EXPECTED].join(', ')}`);
    console.log();

    let failures = 0;
    let totalTokens = 0;
    let totalLines = 0;
    let resolveTotal = 0;
    let resolveNulls = 0;
    const byDir = {};

    // Group shaders by parent dir so each dir is indexed once (helpers
    // classified, sources read) before iterating its files.
    const byDirAbs = new Map();   // dirAbs → [absPath, ...]
    for (const abs of shaders) {
        const d = dirname(abs);
        if (!byDirAbs.has(d)) byDirAbs.set(d, []);
        byDirAbs.get(d).push(abs);
    }
    const dirIndexes = new Map(); // dirAbs → dirIndex
    for (const [dirAbs, fileList] of byDirAbs) {
        dirIndexes.set(dirAbs, await buildDirIndex(dirAbs, fileList));
    }

    for (const abs of shaders) {
        const rel = relative(REPO_ROOT, abs);
        const dir = rel.split('/').slice(0, -1).join('/');
        byDir[dir] = (byDir[dir] || 0) + 1;

        const dirIndex = dirIndexes.get(dirname(abs));
        const phases = await testShader(abs, dirIndex);
        const anyFail = Object.entries(phases).some(([k, v]) =>
            v.status === 'fail' && EXPECTED.has(k));

        if (anyFail) failures++;
        if (phases.tokenize?.status === 'ok') {
            totalTokens += phases.tokenize.metrics.tokens;
            totalLines  += phases.tokenize.metrics.lines;
        }
        if (phases.resolve?.status === 'ok') {
            resolveTotal += phases.resolve.metrics.total;
            resolveNulls += phases.resolve.metrics.nulls;
        }

        if (QUIET && !anyFail) continue;

        const line = [
            fmtPhase('tokenize', phases.tokenize),
            fmtPhase('parse',    phases.parse),
            fmtPhase('resolve',  phases.resolve),
            fmtPhase('emit',     phases.emit),
            fmtPhase('compile',  phases.compile),
        ].filter(Boolean).join('  ');

        console.log(`  ${line}  ${C.blue}${rel}${C.reset}`);

        // Show details for any failure in an EXPECTED phase.
        for (const [name, r] of Object.entries(phases)) {
            if (r.status === 'fail' && EXPECTED.has(name)) {
                console.log(`    ${C.red}${name}:${C.reset} ${r.error}`);
            }
        }
    }

    console.log();
    console.log(`${C.bold}summary${C.reset}`);
    console.log(`  ${C.dim}shaders:${C.reset}   ${shaders.length}`);
    console.log(`  ${C.dim}lines:${C.reset}     ${totalLines}`);
    console.log(`  ${C.dim}tokens:${C.reset}    ${totalTokens}`);
    const dirs = Object.entries(byDir).sort();
    console.log(`  ${C.dim}by sim:${C.reset}    ${dirs.map(([d, c]) => `${d.split('/')[0]}=${c}`).join(', ')}`);
    if (resolveTotal > 0) {
        const typed = resolveTotal - resolveNulls;
        const pct = (100 * typed / resolveTotal).toFixed(1);
        const tag = resolveNulls === 0 ? `${C.green}100%${C.reset}` : `${C.yellow}${pct}%${C.reset}`;
        console.log(`  ${C.dim}resolved:${C.reset}  ${typed}/${resolveTotal} decl sites typed  (${tag})`);
    }

    if (failures > 0) {
        console.log(`  ${C.red}failures:${C.reset}  ${failures}`);
        process.exit(1);
    } else {
        console.log(`  ${C.green}all expected phases passing${C.reset}`);
    }
}

main().catch(e => {
    if (e instanceof WGSLError) console.error(`${C.red}WGSLError:${C.reset} ${e.message}`);
    else console.error(e);
    process.exit(2);
});
