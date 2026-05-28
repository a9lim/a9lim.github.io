# tests/wgsl-transpile/

Tests and next-steps doc for `/shared-wgsl-transpile.js` — the WGSL → JS
transpiler that lets WebGPU sims ship a CPU fallback without
hand-maintaining a parallel implementation.

If you're a fresh instance opening this dir for the first time, read this
file before touching anything. The architecture is settled, the test
harness is fast, and the next-steps roadmap below has the work pre-scoped.

## What the transpiler does

Single source of truth: each sim's `.wgsl` shader files. The transpiler
ingests WGSL source and produces a JS module whose entry functions, when
called with `{ workgroups, bindings }`, execute the same compute kernel
serially on CPU. Public API at the module level: `compileWGSL(source) →
{ entry, bind, bindings, jsSource, metrics }`. `entry.main({ ... })`
keeps the object-shaped compatibility API; `bind(bindings).main(workgroups,
domain, origin)` is the prebound fast path for repeated dispatches.

The motivating problem is `geon`, which currently maintains a hand-written
CPU backend alongside its WebGPU one. Every new physics feature gets
implemented twice and the two halves drift apart; recent commits literally
include "Fix geon physics accounting and GPU passes". `plasma` (the
in-progress MHD sim) was originally planned WebGPU-only specifically to
avoid this maintenance cost. The transpiler is the third option: keep
WGSL as the canonical implementation, generate the CPU version from it.

## How to run

```sh
# Walks every .wgsl in the repo, runs each through tokenize+parse+resolve+compile.
# Resolve concatenates sibling helpers per dir (matching how plasma/geon
# assemble shaders before createShaderModule), so cross-shader struct refs
# type correctly.
node tests/wgsl-transpile/run.js          # full corpus
node tests/wgsl-transpile/run.js plasma   # filter by path substring
node tests/wgsl-transpile/run.js --quiet  # only print failures

# End-to-end smoke tests with self-contained WGSL strings, verifies
# the emitted JS actually executes correctly against canned input.
node tests/wgsl-transpile/smoke.js

# Runtime helper smoke test. Generates a temporary artifact, dispatches
# through shared-wgsl-runner.js, and checks origin, SharedArrayBuffer
# row-sharding, batched pass sequences, reset/reduce/finalize
# coalescing, and typed-array buffer-pool semantics.
node tests/wgsl-transpile/runner-smoke.js

# Validates the build-time .transpiled.js artifacts under transpiled/.
# Checks headers are well-formed, source-hashes match live .wgsl, and
# each artifact body is byte-identical to a fresh transpileWGSL() call
# with the same opts. Doesn't re-run the build (would skew the skip-on-
# unchanged invariant). Run after `node _build.mjs`.
node tests/wgsl-transpile/build-smoke.js

# Microbench for the emit pipeline. Four kernels (FMA, Verlet, n-body
# var accumulator, helper-heavy spring) each run baseline (polymorphic
# rt.*) and optimized (full stack: resolveModule + inline + SROA) and
# report wall-time + Mvops-per-sec or Mparticle-steps-per-sec. See the
# bench detail table below for what each kernel measures.
node tests/wgsl-transpile/bench.js                    # defaults
BENCH_N=100000 BENCH_ITERS=20 node tests/wgsl-transpile/bench.js

# Real-shader plasma CPU bench over current transpiled kernels.
node tests/wgsl-transpile/plasma-bench.js
PLASMA_BENCH_SIZES=64,128 PLASMA_BENCH_ITERS=10 node tests/wgsl-transpile/plasma-bench.js
PLASMA_BENCH_SPECIALIZED=1 node tests/wgsl-transpile/plasma-bench.js
```

run.js and smoke.js exit non-zero on any expected-phase failure. bench.js
always exits 0 — it's a measurement tool, not a pass/fail check.
`run.js`'s `EXPECTED` set at the top of the file controls which phases
are enforced — adjust when bringing a new phase online. The corpus walk
skips nested Git worktrees so scratch checkouts such as `plasma-<hash>/`
do not change the authoritative shader counts.

## Current status (last touched 2026-05-26)

| Phase         | Coverage                                            | Notes |
|---------------|-----------------------------------------------------|-------|
| tokenize      | 75/75 shaders, 16.0k lines, 113.5k tokens           | Full WGSL token grammar |
| parse         | 75/75 shaders → AST                                 | Recursive descent + Pratt for exprs |
| resolve       | 100% decl sites (16836/16836), 90.9% Expr nodes (119035/130886) | Symbol table + expr resolver pass with scoped local IDs for safer SROA |
| inline        | per-fn budget K=8 stmts / M=4 sites, profile-guided hot overrides | Lifts inlinable calls into pre-stmts; scalarized result vars compose with SROA so helper-shaped kernels approach monolithic perf. Handles nested helpers, optional `inlineOnly`/`inlineNever`, `inlineProfile`/`inlineHotFns`, fixed-array-return helpers, nested struct-return helpers, and simple function/private struct-pointer helpers |
| emit          | 75/75 shaders → JS that parses cleanly              | Type-driven inline scalar/vec emit, scoped SROA for vec let/const/var locals, fixed `array<vecN,N>` return/local SROA, mutable nested struct SROA, entry-specific binding hoists, uniform specialization with const-alias branch pruning, opt-in helper-param specialization, static `select()` folding, write-through stores, flat `array<vecN>` and `array<struct>` TypedArray storage mode, flat fixed-size workgroup scalar/struct arrays, phase-local replay across barriers, 1D/2D loop specialization, typed atomics, strict/stability numeric options; rt.* fallback when types unresolved |
| eval          | 75/75 shaders construct as live JS module           | `transpileWGSL()` returns source/metadata without runtime eval for build-time flows |
| dispatch      | 118/118 smoke checks pass                           | Includes barrier-split atomic reduction plus init-phase optimization, synthetic reset/reduce/finalize sequence execution, resolver coverage, inline output parity, full-opt vs polymorphic output parity, nested-inline parity, flat vec/struct parity, SoA struct storage, selective flat storage, flat scalar/struct workgroup memory, fixed-array-return SROA, nested struct-return SROA, scalar-return clones, strict ints/f32/shifts, typed atomics, safe divisions, finite writes, stable reductions, uniform specialization, helper-param specialization, fixed-workgroup specialization, entry-bound guard clipping, actual inliner call-site counting, tiny scalar helper inlining, branchy-helper inlining policy, multi-component swizzle stores, post-barrier static branch pruning, invocation-label elision for no-return entries, row-major 2D dispatch, prebound dispatch, 1D/2D/domain/origin loop specialization, entryInfo metadata, pointer inlining, build-time API, generated-code fast-path budgets, and corpus-derived shader execution |
| artifacts     | 84/84 plasma CPU artifacts validate                 | 18 generic compute artifacts plus x/y `SweepDir`, `view-field` mode, RK3 stage variants, `n256/n512/n1024` grid/ghost variants, LIC `noise_n=1024` variants, `eta_anom_alpha=0` variants, BC mode/grid variants, and combined view-mode/grid variants; headers pin source hash, transpiler hash, opts, metrics, variant, and fused sequence entries |
| **bench**     | **~32-115× cumulative speedup vs polymorphic baseline** across the four kernel shapes | Four synthetic kernels plus real plasma shader bench (`plasma-bench.js`) |

Bench detail (N=10k elements × 10 iters, post optimization/stability pass; single local run):

| Kernel                          | Baseline | Inlined | Flat (TypedArray) | Cumulative speedup | Per-particle |
|---------------------------------|----------|---------|-------------------|--------------------|--------------|
| A: vec3 FMA loop                | ~7.09 ms/iter | ~0.08 ms/iter | ~0.06 ms/iter | **~115×** | — |
| B: Verlet step (monolithic)     | ~1.82 ms/iter | ~0.07 ms/iter | ~0.05 ms/iter | **~38×** | ~5 ns |
| C: N-body var accumulator       | ~9.87 ms/iter | ~0.24 ms/iter | ~0.25 ms/iter | **~39×** | ~25 ns |
| D: helper-heavy spring step     | ~2.00 ms/iter | ~0.08 ms/iter | ~0.06 ms/iter | **~32×** | ~6 ns |

Real plasma shader bench (defaults: 5 iters + 2 warmup):

| Kernel | N=64 | N=128 | N=256 |
|--------|------|-------|-------|
| colormap | ~0.134 ms/iter | ~0.220 ms/iter | ~0.309 ms/iter |
| lic-normalize | ~0.091 ms/iter | ~0.039 ms/iter | ~0.146 ms/iter |
| compute-dt fused reset/reduce/finalize | ~0.554 ms/iter | ~1.211 ms/iter | ~3.065 ms/iter |

Flat-storage delta over object-mode inlined (the just-landed lever):

| Kernel | Flat vs object-mode | Notes |
|--------|---------------------|-------|
| A      | 1.10× | small win — A's output write is one of the few storage ops |
| B      | **1.24×** | solid win — Verlet is storage-I/O dominant (3 reads + 2 writes per particle) |
| C      | 0.92× | n-body is ALU-bound in its inner 8-step loop; storage is a small fraction and TypedArray indexing can lose |
| D      | **1.26×** | helper-heavy plus storage-heavy, so flat writes/reads still matter |

Variance 20-30% across runs from V8 warmup + GC. Kernel A's variance is
biggest because the polymorphic baseline allocates heavily and is GC-
dominated; the optimized path is so allocation-free that V8 inlines
near-perfectly and the ratio swings on warmup state.

Kernel B's flat path is back in allocation-free handwritten-JS territory
for the storage-heavy shape. Kernel D remains close to B's monolithic perf
despite factoring through helper fns. Kernel C — the `var`-heavy compound-
assign shape — is still the main case where flat storage is not obviously
better than object-mode inlined emit, because its hot inner loop is mostly
ALU after mutable vec/struct SROA removes the allocation pressure.

The compounding optimizations that got us here (each measured individually
on top of the previous):

1. Phase-4 inline emit (pre-session baseline) — kernel A 7.3×, kernel B 7.2×
2. Tier 1a: write-through for fresh-vec assigns — kernel A → 19×, kernel B unchanged
3. Tier 1b: SROA for let-bound vec locals — kernel A → 21×, kernel B → 11.5×
4. Tier 1c: emitMember SROA fast-path — kernel A unchanged, kernel B → 16.5×
5. Tier 1d: builtin (gid/lid/wgid/nwg) scalarization — kernel A → 31×, kernel B → 19×
6. Tier 2a: small-fn inlining w/ scalarized result vars — kernel D 2.9× → 26.8×, others unchanged within variance
7. Tier 2b: POLY_FN intrinsic component lowering in isComponentSafe — kernel D refined further, no regression elsewhere
8. Tier 2c: SROA for `var` (mutable) vec locals — kernel C 3.5× → ~48×, kernel A 22.7× → ~75× (the var `acc = vec3(0)` was the other unscalarized var hiding in the bench), B/D unchanged
9. Tier 3: flat TypedArray storage mode — kernel B 25× → 45× cumulative (1.76× over object-mode inlined), kernel D 27× → 35× cumulative (1.30×), kernels A/C unchanged within variance (storage-light)
10. Fast-path pass: default scalar cast inlining, vector-constructor flattening, mixed vec/scalar intrinsic lowering, `reflect`/`faceForward` expansion, workgroup-memory reuse, and 2D/local-dimension loop specialization — plasma compute artifacts now carry zero `rtVec`, `rtPoly`, `rtAtomic`, and `rtNumeric` calls under the build-smoke budget.
11. Fixed-array-return SROA: helpers returning `array<vecN, N>` can inline past the default budget and store result elements as scalar slots. Plasma's `apply-bcs` no longer emits `driven_cons()` or materializes its returned two-vec array.
12. Nested struct SROA: struct-of-struct locals, member stores, nested member reads, and inlined struct-return helpers split down to scalar/vector leaves instead of carrying placeholder child objects.
13. Build-time variant artifacts: `_build.mjs` can fan one WGSL entry into multiple `.transpiled.js` outputs with merged opts; plasma now gets static x/y sweep variants for `reconstruct-ppm` and `riemann-hlld`, static `view-field` mode variants, and static RK3 stage variants for the weighted update shaders.
14. Reduction sequence fusion: artifacts with `reset/reduce/finalize` or `reset/main` expose synthetic sequence entries, and `shared-wgsl-runner.dispatchSequence()` coalesces matching job groups to the fused entry automatically.
15. Flat workgroup memory: fixed-size numeric scalar/vec/struct workgroup arrays with full-index-chain use lower to one TypedArray per var. Plasma `reconstruct-ppm`'s 12x12 `MhdPrim` tile emits `Float32Array(1152)`, and conservation scratch arrays emit `Float32Array(448)`.
16. Static branch pruning: const aliases derived from literals, module constants, and specialized uniform fields are tracked through scopes. If an `if` condition resolves at emit time, only the live arm is emitted and `staticBranchPrunes` records the removal. The plasma x/y sweep variants use this to drop dead `axis == 0` arms in hot entry code.
17. Phase-local replay: pure top-level `let`/`const` declarations before a barrier are replayed into later phases when they depend only on builtins, uniform fields, module constants, or earlier replayable locals. This preserves WGSL lexical locals across the JS phase-split loops and lets specialized uniform aliases keep pruning post-barrier code.
18. Helper-param specialization and static `select()` folding: build variants can declare `specializeFunctionParams: { fn: { param: literal } }`. The helper body keeps its normal ABI but emit treats that param as a const alias, so helper-local axis branches and `select(a, b, axis == k)` lower to straight-line code. The x/y plasma sweep artifacts use this to remove dynamic axis branches from non-inlined helpers without tripling artifact size.
19. Invocation-label elision: entry phases are still block-scoped, but the named `__invocation` label only emits when that phase can hit an entry-level `return`/`discard`. Straight-line no-return kernels avoid the extra labeled statement in their hot loop.
20. Actual call-site counting: the inline picker now counts every expression-position helper call, not just one "callee appeared in this body" hit. A helper called twice in one expression consumes two call-limit slots, so `inlineCallLimit` models actual duplicated code size.
21. Row-major 2D origin-zero dispatch: the hot `Gz === 1 && Ox/Oy === 0` path uses nested y/x loops and a hoisted per-row base counter instead of linearizing then decoding each invocation with `Math.floor(__g / Gx)`.
22. Prebound dispatch API: generated modules keep `entry.name({ ... })`
    but also expose `bind(bindings).name(workgroups, domain, origin)`.
    The runner and worker cache those bound maps per bindings object,
    skipping repeated wrapper-object allocation and binding-map plumbing
    across CPU fallback frames.
23. Selective flat storage: `flatStorageBindings` and `flatStorageExcept`
    let profile/build configs flatten only the storage bindings where
    TypedArray layout actually wins.
24. Per-shader profile opts: `_build.mjs` accepts `shaderOpts` layered
    between directory defaults and named variants, so hot helpers like
    `jz_mag_at` can be inlined for one shader without changing global
    compile policy.
25. Tiny scalar helper inlining: under the default policy, one-statement
    scalar-return helpers get a higher call-site cap because duplicating
    `return x + c` is cheaper than paying repeated helper-call overhead.
    Explicit `inlineCallLimit` still takes precedence.
26. Multi-component swizzle stores: assignments like `v.xy = v.yx` and
    `out[i].rgb = out[j].bgr` lower to captured scalar component writes,
    preserving rotate/self-alias semantics and avoiding invalid JS
    swizzle lvalues.
27. Branchy-helper policy: larger helpers containing control flow use a
    smaller default inline budget unless `inlineProfile`/`inlineHotFns`
    marks them hot, keeping unmeasured branchy code out of hot entries.
28. Scalar-return clones: direct component reads of non-inlined vec
    helpers (`helper(...).x`) route to generated scalar clones that
    return the requested component, avoiding the helper's vec return
    object on that path while preserving the normal helper ABI.
29. Autotune cache: `plasma-bench.js` can run opt-in variant timing with
    `PLASMA_BENCH_AUTOTUNE=1`, storing winners in a source/transpiler/
    option-keyed warm cache so profile-shaped shader opts are chosen
    from measurements instead of guesswork.
30. Fixed-workgroup specialization: `fixedWorkgroups: [Wx, Wy, Wz]`
    bakes the dispatch grid into generated entry code and skips the
    per-dispatch `workgroups` destructuring path for size-specialized
    CPU artifacts.
31. SoA struct storage: flat `array<struct>` bindings can opt into
    `mode: 'soa'` in `storageLayout`, reading and writing field arrays
    like `particles.pos` / `particles.mass` instead of one AoS buffer.
32. Entry-bound guard clipping: canonical leading guards such as
    `if (gid.x >= n || gid.y >= n) { return; }` lower into clipped loop
    limits for global-loop kernels. Padded workgroups skip the per-cell
    branch and guard-only kernels also avoid the invocation label.
33. Plasma constant variants: `_build.mjs` fans hot plasma kernels into
    fixed-workgroup `n256/n512/n1024` artifacts that specialize
    `grid_n`, `grid_n_total`, `ghost_w`, LIC `noise_n=1024`,
    default `eta_anom_alpha=0`, BC mode/grid choices, and combined
    view-mode/grid choices.

The resolve phase's 9.9% Expr gap is structural, not bugs: ~5% is
JS-injected consts (geon's `buildWGSLConstants()` prepends `EPSILON`,
`HISTORY_LEN`, etc. as template strings at runtime — they don't exist in
any `.wgsl` file the harness can see), ~5% is cascading from those plus
a handful of rarely-used intrinsics. At actual compile time these all
resolve fine; the corpus walker is just blind to them.

The smoke suite covers:
1. Scalar FMA over a 1D buffer (`y = scale * x + offset`)
2. Bindings catalog correctness
3. vec4 arithmetic with struct member access
4. Helper fns + module-level constants + if/else branching
5. (implicit in 1-4) the basic dispatch loop semantics
6. Workgroup-level atomic reduction across a barrier — proves phase
   splitting correctly serializes invocations at `workgroupBarrier()`
   and recognizes the local-zero atomic reset phase as a once-per-
   workgroup initialization.
7. Resolver Expr coverage on a canonical kernel (100% expected)
8. Inlined-vs-non-inlined output parity on a 3-helper kernel —
   guards small-fn inlining's correctness contract: `compileWGSL(src)`
   and `compileWGSL(src, { noInline: true })` must produce identical
   outputs on the same input, including across clamp_speed-style
   conditional-return paths
9. Full-opt vs polymorphic baseline parity on a `var`-heavy n-body
   kernel — the strongest correctness gate. The polymorphic path is
   the simplest correct pipeline (rt.* dispatch only, no resolveModule,
   no inline, no SROA); matching it means the full optimization stack
   end-to-end preserves semantics. Exercises compound `+=`/`-=` on
   scalarized vars and conditional reassignment in `if (cond) { v = ...; }`
10. Nested-inline parity (helper-of-helper). Three-way: full-opt vs
    `{ noInline: true }` vs polymorphic. Guards the clone+rename pass's
    handling of synthetic `labeled` / `inline_return_set` / `break_label`
    stmts left in a fn's AST by a prior inline pass. Without this fix,
    plasma's `fill_cell_ghost` and `sample_b_unit` would have thrown
    `ReferenceError` at runtime.
11. Flat-storage vs object-mode parity. Same kernel compiled twice
    with `{}` and `{ flatStorage: true }`, equivalent inputs (array of
    objects vs `Float32Array(n*3)`), outputs match within float epsilon.
    Exercises whole-vec storage read, helper crossing fn boundary
    under flat mode, write-through store on flat target.
12. Flat `array<struct>` parity. Uses WGSL storage-layout offsets for
    `vec3 + scalar + vec3 + scalar`, reads an immutable struct local via
    struct SROA, and writes scalar fields, vec fields, and vec compound
    assigns into a flat `Float32Array`.
13. Strict numeric/intrinsic execution. Covers `strictInts`, `strictF32`,
    `safeNormalize`, `select`, `bitcast`, and `arrayLength`.
14. Build-time/corpus execution. `transpileWGSL()` returns source without
    eval, and the real `geon/src/gpu/shaders/dispatch-args.wgsl` executes
    with synthetic bindings.
15. WGSL-oriented scalar numeric semantics: u32/i32 shifts, native scalar
    compound lowering, round ties-to-even, comparison-defined min/max with
    NaN, typed u32 atomics, and generated-code metrics.
16. Explicit flat storage layout modes. `flatStorageLayout: 'compact'`
    keeps vec arrays packed by arity; `'wgsl-storage'` pads vec3 arrays
    to stride 4 unless overridden by `storageLayout`.
17. Finite write sanitizers for selected storage bindings, including
    object-mode vector component writes.
18. Uniform specialization and entry-specific binding hoists: specialized
    fields emit literals, unused bindings skip entry aliases, and 1D
    no-barrier kernels emit the fast `Gy === 1 && Gz === 1` path.
19. Static branch pruning for uniform-derived const aliases, including
    branches whose condition is a local alias (`let axis = mode.axis`).
20. Phase-local replay across top-level barriers: pre-barrier pure locals
    survive into later phase loops, and replayed specialized locals can
    prune post-barrier branches.
21. Helper-param specialization plus static `select()` folding for
    non-inlined helper bodies.
22. Invocation-label elision for no-return entry phases, while preserving
    labels for kernels with early returns.
23. Mutable struct SROA plus whole flat-struct stores from scalarized
    locals.
24. Nested struct SROA plus inlined struct-return scalarization: nested
    member writes and child-struct copies split into leaf slots.
25. Simple `ptr<function, Struct>` helper inlining: pointer args remain
    aliases instead of being scalarized copies.
26. Synthetic reduction sequence entries: `reset/reduce/finalize`
    executes through the generated fused entry and matches explicit
    dispatches.
27. Flat workgroup arrays. The 12x12 scalar halo tile and a compact
    `array<array<struct,2>,2>` fixture both allocate one `Float32Array`,
    reset it in-place, and preserve post-barrier reads.
28. Actual call-site counting for inlining caps: repeated helper calls in
    one expression stay out of line when the cap is too low, and inline
    when the cap exactly covers the repeated sites.
29. Row-major 2D origin-zero dispatch: emitted code has the y/x loop
    shape and no per-cell `Math.floor(__g / Gx)` decode.
30. Prebound positional entry dispatch: `compileWGSL().bind(bindings)`
    closes over the binding object and executes the generated internal
    entry function directly.
31. Selective flat storage: a mixed object/TypedArray kernel reads
    object-mode `pos`/`vel` buffers while write-through lowering flattens
    only the allow-listed `out` binding.
32. Tiny scalar helper call-count bypass: a six-call scalar helper inlines
    under defaults, while explicit low call-count caps remain enforced.
33. Multi-component swizzle store propagation: local rotate stores and
    flat storage partial writes execute correctly and emit component
    writes rather than `.xy =`/`.rgb =` JS lvalues.
34. Branchy-helper inlining policy: default compile keeps a larger
    branchy helper out of line, while an explicit hot hint still inlines
    the same helper.
35. Scalar-return clone generation: non-inlined vec-return helpers read
    through `.x/.y/.z/.w` emit scalar clone calls and return scalarized
    leaves instead of materializing the whole return object.
36. Fixed-workgroup dispatch specialization: generated code with
    `fixedWorkgroups` uses baked `Wx/Wy/Wz` constants and still executes
    the expected global invocation range when the runtime call passes a
    dummy workgroup tuple.
37. SoA flat `array<struct>` storage: the Particle fixture runs against
    field-array bindings and matches object-mode output while generated
    code addresses `_b_input.pos[...]` and `_b_output.vel[...]`
    directly.
38. Entry-bound guard clipping: a padded 2D dispatch executes only the
    logical domain after the leading `gid >= bound` guard is hoisted into
    loop limits, while non-clippable early returns still keep the
    invocation label.

## Architecture (read before editing)

`/shared-wgsl-transpile.js` is one ~7.7k-LOC ESM file with these sections
(in source order):

1. **Tokenizer** (`tokenize`) — flat Token[] of `{kind, value, line, col}`.
   Handles nestable block comments, all numeric suffix forms (`u`/`i`/`f`/`h`),
   3/2/1-char operator longest-match.

2. **Parser** (`parse`, `class Parser`) — produces a `Module` AST with
   `items: Item[]`. Items are struct/fn/const/global_var/alias. Parser is
   recursive descent except expressions, which use Pratt precedence
   climbing. Hidden gotcha: the tokenizer eagerly merges `>>` and `>=`
   for shift/relational ops, but the parser sometimes needs them split
   back into single `>` tokens (nested generic close, `array<vec4<f32>>`).
   `Parser.expect('punct', '>')` handles this transparently. Also: a
   `noRelDepth` instance counter disables `<`/`>` consumption inside
   `array<T, N>` count expressions so the count doesn't eat the closing
   bracket.

3. **Resolver** (`resolveModule`, `class SymbolTable`, `class ExprResolver`)
   — builds the module's type catalog, then walks every fn body to
   annotate `.resolvedType` on every Expr node. The emitter reads these
   types to decide between scalar-inline, vec-component, and polymorphic
   rt.* dispatch. Failure is silent (`.resolvedType = null`) so the
   emitter's fallback keeps the corpus green even on rare/unmodeled
   constructs.

4. **Inline pass** (`inlineModulePass`, helpers `_pickInlinable`,
   `_liftCallsInExpr`, `_expandInlineCall`, `_cloneStmtRenamed`,
   `_cloneExprRenamed`) — AST-level rewrite that runs between resolve
   and emit. For each call site of an inlinable helper, it lifts the
   call into pre-stmts (arg bindings + alpha-renamed body wrapped in a
   labeled block) and replaces the call expression with an ident
   pointing to the synthetic result var. Vec-returning helpers get a
   *scalarized* result var (per-component lets registered in the
   emitter's scalarized map). The pass mutates `ast.items[*].body` in
   place; emit sees the post-inlined shape and runs unchanged.

5. **Emitter** (`emit`, `class Emitter`) — walks the AST in two passes:
   catalog top-level items into Maps, then emit each. Key responsibilities:
   - **`collectScalarizable`** pre-pass per fn body identifies vec
     let/const/var locals that can be split into N per-component scalar
     bindings. Disqualifies on `&` use, name shadowing, and for-init/
     for-update decl slots (since `forStmtInline` emits a single JS
     expression).
   - **Inline scalar/vec emit** via `emitBin`/`exprComp`: scalar↔scalar
     binops emit as `(a op b)`; vec ops lower component-wise into object
     literals when not scalarized, or into per-component reads when
     either operand is scalarized.
   - **Write-through** (`tryEmitVecWriteThrough`) for vec lvalue stores
     where the RHS would have allocated a fresh `{x,y,z}` object — emits
     three property writes instead, with component values captured into
     `_wt0..` temps first so accumulator + swizzle-rotate patterns stay
     safe.
   - **Scalarized var store** (`emitScalarizedVarStore`) for assign and
     compound assign whose target ident is in `this.scalarized`. Routes
     `force += rhs` to native per-component compound ops (`force_x +=
     rhs.x; force_y += rhs.y; ...`) — bypasses rt.* dispatch entirely.
   - **Builtin scalarization** in `emitEntry`: `@builtin(gid)`/etc. are
     pre-scalarized into integer expressions, no vec3 allocation per
     invocation.
   - **Phase splitting** at top-level `workgroupBarrier()` — see the
     subsection below.
   - Vec types are `{x, y, z, w}` JS objects on the wire; emit aggressively
     scalarizes intermediates so vec objects only materialize at module
     boundaries (storage I/O, polymorphic rt.* fallback).
   - JS-reserved words (`in`, `of`, `class`, ...) at declaration sites
     get prefixed with `_` via `_safe()`; references resolve consistently.
     Member access (`bindings.in`) is fine in JS and isn't escaped.
   - WGSL swizzles (`.rgb`, `.xyz`, `.rgba`) detect by character set and
     length; single-char `r/g/b/a` map to `x/y/z/w`; multi-char reads
     compose with `exprComp`, while multi-char assignment targets emit
     direct component stores.
   - `discard` outside an entry block → plain `return` (fragment-only
     construct; not modeled CPU-side).
   - `&local` for struct/object locals emits the identifier directly —
     JS object references mutate in place, giving by-reference semantics
     for the common accumulator pattern. Scalar locals are a known
     limitation (rare in plasma/geon).

6. **Runtime** (`runtime`, the `rt` namespace) — small set of helpers
   the emitted code calls: type constructors, scalar casts, polymorphic
   arithmetic, math intrinsics, bitcasts, atomic operations
   (single-threaded, so atomicAdd is just a swap-and-add). Tests can
   override by passing `opts.runtime`. The optimization stack is
   designed to *avoid* hitting runtime helpers in the hot path — most
   real-shader kernels post-Tier-2 reach the runtime only at storage
   boundaries.

7. **`transpileWGSL` / `compileWGSL`** — plumbs all six together: tokenize → parse →
   resolveModule (skipped under `opts.polymorphic`) → inlineModulePass
   (skipped under `opts.polymorphic` or `opts.noInline`) → emit.
   `transpileWGSL()` stops there and returns `{ jsSource, body,
   entryPoints, bindings, metrics }` for build-time artifact generation.
   `compileWGSL()` additionally evaluates the generated module and returns
   the live `{ entry, bind, bindings, jsSource, metrics }`. The eval path's
   JSDoc has a security note: it is intentional and only safe because the
   WGSL input is under your own control.

### Phase splitting (the subtle bit)

When an entry function contains top-level `workgroupBarrier()` calls,
`emitEntry` splits the body into phases. Each phase gets its own
invocation triple-loop, so all invocations finish phase N before any
start phase N+1. Workgroup-shared atomics (`var<workgroup> tile: atomic<u32>;`)
live on a per-workgroup `wg` object that persists across phases. This is
how `compute-dt`-style reductions execute correctly.

WGSL locals declared before a barrier are lexically visible after the
barrier, but the generated JS phases are separate loop bodies. The
emitter therefore replays conservative pure top-level `let`/`const`
decls into later phases: builtin/member reads, uniform fields, module
constants, scalar casts, unary/binary expressions, and non-user intrinsic
calls are allowed; indexing and user helper calls are not. Besides fixing
post-barrier local visibility, this carries specialized uniform aliases
forward so post-barrier `if (axis == 0u)` branches can be pruned in
`reconstruct-ppm` variants.

**Limitation**: barriers nested inside `if`/`for`/`while` aren't lifted
out into phases. Doing so would require duplicating the surrounding
control flow across phase boundaries. plasma+geon currently use only
top-level barriers so this hasn't bitten yet, but if a future shader
needs it, the work is contained to `splitPhases` + a control-flow
analyzer pass.

## Next steps

Genuinely-not-yet-done work, in approximate priority order. (Landed
work and its history is in the next section.)

### Plasma integration

The transpiler exists *for* plasma. With flat-storage and the
build-time writer landed, the remaining work is an adapter shim:
- `plasma/src/cpu/` module imports the pre-transpiled `.transpiled.js`
  modules generated by `_build.mjs` (no runtime eval, no parser/emitter
  in the browser bundle)
- `plasma/main.js` feature-detects WebGPU; on failure, instantiates the
  CPU backend and runs the same `step()` orchestration against it
- The bindings object the GPU code already constructs (uniforms, storage
  buffers as Float32Arrays) flows directly to the CPU backend — the
  transpiled artifacts were generated with `{ flatStorage: true }` so
  array<vecN> bindings expect packed TypedArrays already
- Add `/plasma/*` to `_routes.json` exclude list so static assets serve
  directly (matches geon/cyano/etc.)

The original plasma plan locked `No CPU fallback` as a design decision.
The transpiler changes that calculus: the cost of the fallback is no
longer "maintain a parallel implementation forever" — it's "write the
adapter shim once." Worth revisiting that decision when picking this up.

Plasma's shaders use nested helpers (`fill_cell_ghost` calls 4 sub-fns;
`sample_b_unit` calls `bx_at_cell`/`by_at_cell`; `ppm_limit_vec4` calls
`ppm_limit_scalar`). The nested-inline rename fix landed alongside flat-
storage (`testNestedInlinePreservesOutput` guards it), so plasma's call
shapes lower cleanly.

### Geon integration (much later)

Geon is 54 shaders vs plasma's 13. The transpiler handles them all
syntactically, but real integration is bigger:
- Geon has more bindings, more entry points, denser control flow, more
  feature toggles
- Some shaders use patterns that aren't yet exercised by smoke tests
  (CAS atomics in tree builds, multi-entry-point modules with shared
  aggregator state, GPU↔CPU snapshot via `physics-contract.js`)
- The existing hand-written CPU code is the reference implementation;
  cutting over would benefit from a comparison harness (run both, diff
  outputs, catch divergences)

Don't tackle this until plasma integration has shaken out the rough
edges of the runtime API and bindings format.

### Smaller items worth a session each

- `bitcast` source-type inference (currently routes only by typeArgs).
  Low priority — both plasma and geon use bitcast only with explicit
  typeArgs (`bitcast<u32>(L)`), which the current code already handles.
- Matrix types (`mat3x3<f32>` etc.) — geon doesn't use, plasma doesn't
  use, but adding for completeness is straightforward.
- Type aliases (`alias Vec3F = vec3<f32>;`) — parser accepts, resolver
  needs to substitute. No corpus shader uses `alias` today.

## Landed work (history)

Detailed notes on the optimization passes already in the tree. Useful
if you're touching one of these and need the rationale + tradeoffs.

### Tier 1: Type resolver + inline-scalar emit + SROA

The first performance milestone. All phases complete; see the bench
table at the top of this file for measured numbers.

- ✅ **Phase 1: Type ADT + module-level symbol table** — `T` scalar
  singletons, `tVec`/`tMat`/`tArray`/`tAtomic`/`tPtr`/`tStruct` factories,
  `typeEqual`/`typeToString`, `catalogModule(ast)` (shared with emitter,
  one walk over `ast.items`), `SymbolTable` class typing every decl site,
  `PREDECLARED_TYPES` for mat-shortform aliases (`mat4x4f` etc. that the
  parser doesn't pre-bake).
- ✅ **Phase 2: Expression resolver** — `ExprResolver` walks every Expr
  node in every Fn body and annotates `.resolvedType`. Handles literals
  (abstract→concrete), idents (scope walk → bindings/wg/priv/consts),
  member access (struct fields + vec swizzles, single + multi-char),
  index, binary (scalar↔scalar, scalar↔vec broadcast, vec↔vec,
  bool-result ops), unary, calls (scalar casts, vec/mat constructors
  typed + inferred, `array(...)`, POLY_FN intrinsics, plus a curated
  table of specific intrinsics: `dot`/`length`/`cross`/`transpose`/
  `determinant`/`atomic*`/`bitcast`/`pack*`/`unpack*`/etc.). Statement
  walker handles all WGSL block kinds with proper scope push/pop.
  Failure is silent (`.resolvedType = null`), so the emitter's
  polymorphic fallback keeps the corpus green. Coverage: **100% decl
  sites, 90.1% Expr nodes** across the 68-shader corpus.
- ✅ **Phase 3: Benchmark harness** — `tests/wgsl-transpile/bench.js`.
  Originally two kernels (FMA + Verlet); kernels C (var-heavy) and D
  (helper-heavy) were added later to give the Tier 2 work principled
  before/after measurements. Each kernel runs baseline (polymorphic
  rt.*) vs optimized (current emit) back-to-back.
- ✅ **Phase 4: Inline component lowering** — `compileWGSL` runs
  `resolveModule` before `emit` (opt out via `opts.polymorphic: true`
  for A/B). `emitBin` inlines scalar↔scalar as `(a op b)` and lowers
  vec ops component-wise via `exprComp(e, c)`. POLY_FN intrinsics
  inline as `Math.*` or scalar templates when all args are scalar /
  matching-vec. `isComponentSafe` gates recursion.
- ✅ **Phase 5: Write-through vec lvalue stores** — when LHS is vec-typed
  and RHS would have allocated a fresh `{x,y,z}` object (binop, unop,
  vecN constructor, POLY_FN intrinsic), emit per-component stores via
  three scalar temps. Saves the assignment allocation. Triggers for
  both storage lvalues (`arr[i] = expr`) and mutable-local accumulators
  (`acc = acc + ...`). Three temps capture old-component reads before
  any store fires, so the transform is safe for accumulators AND
  swizzle-rotate patterns.
- ✅ **Phase 6: SROA for vec let/const locals** — `collectScalarizable`
  pre-pass per fn body identifies vec-typed lets without `&local` uses;
  the emitter then splits `let p = q - r` into `const p_x = q.x - r.x;`
  etc. via `emitScalarizedLet`. References lower through SROA fast paths
  in `exprComp`, `emitMember`, `emitIdent`, `identSource`. Whole-vec
  uses (passing to fn, polymorphic fallback) rematerialize via
  `rt.vecN(p_x, p_y, p_z)` — safety net that preserves correctness at
  the cost of allocating only at that one site. Single `emitMember`
  fast-path for scalarized-ident is critical: without it, every `v.x`
  on a scalarized var would rematerialize.
- ✅ **Phase 7: Builtin scalarization** — `@builtin(global_invocation_id) gid`
  (and lid, wgid, nwg) are now pre-scalarized: `gid_x`, `gid_y`, `gid_z`
  emitted as direct integer expressions, no `rt.vec3` allocation. Saves
  4 allocs per invocation in typical kernels that only read `gid.x`.
  Local scope: gid/lid live inside the invocation triple-loop; wgid/nwg
  at workgroup scope. Whole-vec uses still rematerialize.
- ✅ **Phase 8: Resolver-coverage smoke test** — `testResolverCoverage`
  asserts every Expr node in a canonical kernel gets a `.resolvedType`.
  Currently 70/70 (100%). Drop = a new resolver gap to chase.

The 9.9% corpus-wide Expr gap is structural (~5% JS-injected consts geon
prepends at runtime, ~5% cascade + rarely-used intrinsics); see "Current
status" above. None of it blocks the inline emit — graceful degradation
to rt.* dispatch preserves correctness on every shader.

### Tier 2a-b: Small-fn inlining

AST-level pass between `resolveModule` and `emit` that splices small
helper bodies into their call sites. Defaults: `inlineBudget` = 8
top-level stmts per fn, `inlineCallLimit` = 4 expression-position call
sites across the module. Repeated calls inside the same expression count
separately, so the cap models actual code duplication rather than just
"helper appears in this body". Recursive fns (self- or mutual-) excluded; fns with ptr
params or `&` uses excluded; entry points (`@compute`) are inlining
targets, not inlinees.

Mechanism:
- For each call site of an inlinable helper, the lifter walks the
  enclosing stmt's expressions depth-first (inner calls expanded first)
  and replaces the call node with an ident pointing to a per-call-site
  result var (`_inl_N_result`).
- Helper params bind to fresh `_inl_N_paramName` lets (themselves SROA
  candidates at emit time — vec args lower to per-component lets when
  the arg expression is scalarized).
- Helper body is alpha-renamed with the same `_inl_N_` prefix and
  wrapped in `_inl_N: { ... }`. `return v;` rewrites into a synthetic
  `inline_return_set` stmt (per-component stores for vec results,
  per-leaf stores for fixed arrays and structs, plain whole-object assign
  for scalar/mat) followed by `break _inl_N`.
- Vec-returning helpers get a **scalarized result var**: instead of one
  mutable JS let holding a `{x,y,z}` object, the labeled-stmt emit
  declares per-component lets (`_inl_N_result_x`, `_inl_N_result_y`,
  ...) and registers the name in `this.scalarized`, so every downstream
  read of `_inl_N_result` routes through the existing SROA fast paths.
  Net effect: **zero vec allocations** on the inlining return path,
  even across conditional-return helpers like `clamp_speed`.
- Fixed `array<vecN, N>` and named struct return values get the same
  treatment: the labeled-stmt emit declares scalar slots for every
  result element/leaf, and `inline_return_set` writes into those slots
  directly. Nested struct fields recursively split into leaves.
- `isComponentSafe` was relaxed to permit POLY_FN intrinsics
  (`max`/`sqrt`/`sin`/etc.) — these are pure and lower to `Math.*`
  templates, so triplicating them across vec component lowerings is
  cheaper than the vec3 alloc the fallback would otherwise emit.

Result: kernel D (real-shader shape factored through 3 helpers) goes
from 2.91× to ~26× speedup vs polymorphic, sitting within ~1.2× of
the equivalent monolithic kernel B. Other kernels unchanged within
variance.

`testInlinePreservesOutput` is the correctness gate:
inlined and `{ noInline: true }` modes must produce bit-identical
output on a multi-helper kernel that exercises both clamp_speed's
return paths.

### Tier 2c: `var` SROA

`collectScalarizable` now picks up `var v = vec...` candidates (vec
arity from `.value.resolvedType` or from the declared type annotation).
Same disqualifications as let/const SROA: `&v` use, name shadowing.
Additional defensive ban: any decl declared in a for-init / for-update
slot is skipped, since `forStmtInline` emits a single JS expression and
can't introduce N per-component bindings.

Two new emitter helpers:
- `emitScalarizedVarDecl(name, value, type, arity)` — declares per-
  component mutable JS `let`s. Init paths mirror `emitScalarizedLet`:
  direct (component-safe value), indirect (materialize once into a
  tmp + split — matches non-SROA cost), and default-zero when no init.
- `emitScalarizedVarStore(name, value, compoundOp)` — handles both
  plain assign (`compoundOp = null`) and compound assign (`+=`/`-=`/
  etc.). RHS shape variants: vec component-safe (per-component stores
  via exprComp), scalar broadcast (single tmp + apply), and vec
  non-component-safe (materialize once + split).

Result-capture into `_wt0..` temps protects `force += f(force)` and
similar self-referential patterns from cross-component writes
landing before the corresponding reads. Same safety contract as the
existing vec write-through helper.

`case 'assign'` and `case 'compound'` in the emitter both check for a
scalarized-ident target before falling through to the legacy path.
This ordering matters: `tryEmitVecWriteThrough` does `${lhs}.x = ...`
on the target's `expr()` form, and a scalarized ident's `expr()`
rematerializes via `rt.vec3(name_x, ...)` — writing `.x` to that fresh
object would silently drop the update. Scalarized target path catches
this before write-through can run.

Result: kernel C goes from 3.5× to ~48× speedup vs polymorphic (~14×
faster wall-time). Kernel A also picked up a bonus 3× because its
`var acc = vec3(0); ... acc = acc + ...` accumulator was the other
unscalarized var hiding in the bench. `testVarSroaPreservesOutput` gates correctness
end-to-end against the polymorphic baseline.

### Tier 3: Flat TypedArray storage mode

Opt-in mode (`compileWGSL(src, { flatStorage: true })`) where
`array<vecN<f32|u32|i32>>` and supported `array<struct>` storage bindings
arrive as TypedArrays instead of arrays of objects. Layout is explicit:
`flatStorageLayout: 'compact'` (default) stores vec arrays at stride =
vec arity, while `flatStorageLayout: 'wgsl-storage'` uses storage-buffer
padding (`vec3` stride 4). Struct arrays use computed WGSL
storage-layout offsets. Override per binding via
`opts.storageLayout[name].stride` and field slots via
`opts.storageLayout[name].fields`. Struct arrays may opt into a
field-array layout with `opts.storageLayout[name].mode = 'soa'` (or
global `flatStructLayout: 'soa'`): the binding value is then an object
whose top-level scalar/vec fields are TypedArrays, e.g.
`particles.pos`, `particles.mass`, `particles.vel`. Profile/build
configs can also set
`flatStorageBindings: ['out']` as an allow-list or
`flatStorageExcept: ['scratch']` as a deny-list, so mixed object/TypedArray
dispatches can keep only the proven-win buffers flat. Object-mode stays
the default — backward-compatible with the existing smoke and bench
harness.

Emit lowers every storage touch directly to TypedArray index ops:
- Read components: `bindings.X[i].c` → `bindings.X[(i)*stride + compIdx]`
  via `emitMember` and `exprComp` fast paths.
- Per-component reads in SROA: `let v = bindings.X[i];` with vec
  scalarization splits into N direct TypedArray reads, no intermediate
  object materialization. `exprNeedsMaterialize` returns false for
  flat-storage index so the direct path always fires.
- Write-through: `bindings.X[i] = vec-expr` captures the base offset
  once (`const _wbase = (i)*stride;`) and emits N TypedArray stores.
- Whole-vec rematerialization (rare — passing a storage element to a
  non-inlined helper, or to polymorphic rt.* fallback): `emitIndex`
  emits `rt.vecN(bindings.X[(i)*s+0], ..., (i)*s+N-1)` — one alloc at
  exactly that one site, same cost as object mode would have had.
- Flat `array<struct>`: `particles[i].pos.x` lowers to one TypedArray
  read at `i * stride + fieldOffset + compIdx`; whole struct reads
  rematerialize only at the exact whole-value use. Immutable local struct
  bindings and mutable `var` structs get field/component SROA, so
  `let p = particles[i]; p.pos.x` and `var p = particles[i]; p.pos += v`
  stay scalar.
- SoA `array<struct>`: `particles[i].pos.x` lowers to
  `particles.pos[i * posStride + 0]`, while scalar fields lower to
  `particles.mass[i]`. This keeps the existing object-shaped binding
  name but lets CPU fallback choose SoA for field-hot kernels.

Defensive paths cover the cases where write-through can't fire:
- Assign with non-component-safe RHS (e.g., non-inlined fn call
  returning vec): materialize RHS into `_ftmp`, then split into N
  TypedArray stores.
- Compound assign on a flat-storage vec element (`+=`/`-=`): emits a
  per-component read-modify-write. This covers both `array<vecN>` and
  vector fields inside flat `array<struct>`.
- Whole flat-struct stores from scalarized struct locals split field by
  field, so `output[i] = acc` does not need to rebuild a JS object first.

Constraints:
- `array<struct>` support covers scalar and vec fields, plus nested
  struct fields when rematerializing whole values. Matrices, arrays inside
  structs, and custom alignment attributes are still object-mode territory
  unless you provide explicit `storageLayout` overrides and only touch
  scalar/vec fields.
- Scalar arrays (`array<f32>`, `array<u32>`, `array<i32>`) need no
  transformation — `bindings.X[i]` is already a single scalar in both
  modes — so they're omitted from `Emitter.flatBindings`.

Result: kernel B (Verlet, storage-I/O dominant) is ~1.31× faster than
object-mode inlined on the current bench run; kernel D picks up the same
~1.31×. Kernel C is ALU-bound and remains a wash.
Kernels A and C are storage-light enough to register as wash (within
variance). `testFlatStorageMode` is the parity gate: identical kernel compiled
twice (object mode, flat mode), fed equivalent inputs, outputs match
within float epsilon; it also covers a selective-flat mixed layout.

The polymorphic-baseline path skips `flatStorage` automatically
(`opts.polymorphic` forces object-mode), so the bench's `polymorphic:
true` comparison stays apples-to-apples against object-mode inputs.

### Strict numeric and intrinsic modes

Default mode stays fast and JS-number-native. Opt-in correctness knobs:
- `strictInts: true` wraps scalar `i32`/`u32` arithmetic after `+ - * / %`
  and bitwise/shift ops using `|0`, `>>>0`, `>>`, and `Math.imul` where
  appropriate. Literal suffixes (`u`/`i`/`f`/`h`) now feed the resolver,
  so unsigned shifts lower as logical shifts.
- `strictF32: true` wraps scalar f32 arithmetic and scalarized f32
  intrinsic results in `Math.fround`, useful when debugging CPU/GPU
  drift from double-vs-f32 accumulation.
- Scalar `round`, `min`, `max`, `clamp`, `smoothstep`, and `saturate`
  route through WGSL-oriented helpers instead of raw `Math.round`,
  `Math.min`, and `Math.max`.
- `safeDivisions: true` routes scalar f32/f16 division through
  `safeDivScalar(lhs, rhs, safeDivisionEpsilon ?? 1e-30)`.
- `safeNormalize: true` lowers `normalize(v)` through a `Math.hypot`
  denominator clamped by `safeNormalizeEpsilon` (default `1e-30`), so
  zero vectors stay finite in physics fallback code.
- `finiteWrites: true` sanitizes selected f32 storage writes through
  `finiteOr` / `finiteVec`; restrict it with `finiteWriteBindings`.
- `reductionMode: 'stable'` routes `dot`, `length`, and `distance`
  through compensated-sum runtime helpers. Default remains GPU-parity /
  JS-fast mode.

Runtime fallbacks now cover the vector intrinsics the sims actually use
(`dot`, `length`, `distance`, `cross`, `normalize`, `reflect`,
`faceForward`, `all`, `any`) instead of accidentally falling through to
undefined global calls when type info is missing.

Generated metadata includes a `metrics` object (`bytes`, `lines`, rt.*
call counts, `Math.fround` count, IIFE count, optimized workgroup
reduction init count, flat workgroup array count/slots, static branch
prune count). Build artifacts
copy this into a `wgsl-metrics` header, and `build-smoke.js` checks both
freshness and perf budgets
(`rtVec === 0`, `rtPoly === 0`, `rtAtomic === 0`, `rtNumeric === 0` for
current plasma compute artifacts, plus fixed flat-workgroup slot budgets
for `reconstruct-ppm` and conservation reductions).
That keeps helper-call regressions visible before anyone opens a browser
profiler.

### DCE and hoisting

The emitter now prunes helper functions unreachable from compute entry
points after inlining. Entry bodies hoist only the bindings used by that
entry and only the uniform struct fields actually read; specialized
uniform fields emit literals and skip field aliases. Builtin component
declarations are similarly dead-component-eliminated: `gid.x` doesn't
force `gid_y`/`gid_z`. No-barrier kernels emit a global-loop path with
1D and 2D fast branches before falling back to the full 3D loop. These
entries accept optional `domain: [x, y, z]` dispatch metadata so a CPU
fallback can iterate the true problem size instead of padded
`workgroups * workgroup_size`. Barrier-split kernels drop dead local-loop
dimensions (`Lz === 1`, etc.) at emit time. The same no-barrier path
also accepts `origin: [x, y, z]`, which offsets
`global_invocation_id` while iterating only the local shard. That gives
row-sharded Worker dispatches a way to preserve full-domain indexing
without adding offset math to the default zero-origin hot path.
When a build or bench config knows the dispatch grid in advance,
`fixedWorkgroups: [Wx, Wy, Wz]` bakes those constants into the entry and
omits `const [Wx, Wy, Wz] = workgroups;`, which is useful for named
resolution/grid variants without changing the compatibility wrapper.
Non-inlined helpers keep the same object ABI externally but
scalar-hoist vec params at function entry so the body can use `p_x`
style fast paths. Inlined helpers returning fixed `array<vecN, N>`
use the same idea for array elements (`result_0_x`, `result_1_x`, ...)
so callers like `pair[0]` can feed flat stores without materializing a
JS array.

Static branch pruning runs off a parallel const-alias scope. Aliases are
recorded for `let`/`const` values that can be evaluated from literals,
module constants, builtin-derived scalars, or specialized uniform fields.
When an `if` condition is statically true/false, emit keeps only the live
block, preserves normal scoping around it, and increments
`staticBranchPrunes`. Sweep-specialized plasma artifacts now use this for
`reconstruct-ppm.x/y` and `riemann-hlld.x/y`.

`specializeFunctionParams` extends the same const-alias machinery into
non-inlined helper bodies. It is deliberately opt-in: a build variant can
declare that `pack_flux.axis` or `fast_mag_speed.axis` is fixed for that
artifact, while the helper signature and call sites remain unchanged.
Static `select(a, b, cond)` folding uses `staticEvalScalar(cond)` when
all args are component-safe, so helper code such as
`select(P.by, P.bx, axis == 0u)` becomes a direct field read.

Entry phases keep an inner block for local scoping, but the named
`__invocation` label now emits only when that phase may need to lower an
entry-level `return` or `discard` into `break __invocation;`. Kernels
without early exits avoid the labeled-statement overhead entirely, while
early-return kernels still get the same control-flow semantics.

### Build-time artifact writer (B2)

`_build.mjs` now runs the transpiler over every configured shader
directory (currently just `plasma/src/gpu/shaders/`) and writes a
`.transpiled.js` artifact for each compute-entry shader at
`transpiled/<source-relative-path>.transpiled.js`. Vertex/fragment
render shaders are skipped instead of shipped as CPU artifacts. Helpers
in the same dir (no `@compute`/`@vertex`/`@fragment` annotation) are
prepended to the unit before transpile, matching the assembly pattern
`pipelines.js` uses before `createShaderModule`.

Output goes under `transpiled/` (parent-tracked) rather than next to
the source: plasma is a submodule that isn't yet initialized in the
parent's tree (`.gitmodules` declares it but submodule wiring is
pending), so artifacts written inside `plasma/` couldn't be tracked
by the parent repo. The mirrored layout keeps a clean source-to-
artifact mapping and scales to other sims without needing each to
    configure its own .gitmodules state; hot shaders may add named variant
    suffixes such as `.x.transpiled.js`, `.rho.transpiled.js`, or
    `.s1.transpiled.js`.

Each artifact carries a sha256 source-hash header; re-runs skip
unchanged shaders by source, transpiler, and option-hash comparison
so `specializeUniforms`, `specializeFunctionParams`, and storage-layout
changes cannot leave stale artifacts behind. Pass `--force-wgsl` to
override.
Errors aggregate at end of build and set `process.exitCode = 1`. With
A1's `collectErrors` mode set, all 33 plasma CPU artifacts' emit-phase
issues surface in one run (currently zero).

Artifacts are committed (Cloudflare Workers serves them as static
assets from `/transpiled/...`), so plasma's CPU fallback can
`import()` the artifact directly with no runtime eval, no parser/
emitter in the browser bundle. The trade-off is generated files in the
repo that churn with shader edits; moving to a CI deploy-time gen step
is an easy future change if the churn becomes a problem.

The x/y sweep artifacts also specialize the helper params whose `axis`
argument is the same sweep direction (`fast_mag_speed`, `permute_prim`,
`pack_flux`, etc.). `build-smoke.js` verifies those headers and rejects
specialized sweep artifacts that still contain dynamic `axis == ...`
branches.

The `view-field` artifacts specialize `U_uniforms.view_mode`, while the
weighted update artifacts specialize the immutable RK3 stage uniform
(`stage_params.a0/a1/dt_w`). `build-smoke.js` verifies that the generated
variant bodies no longer contain dynamic reads of those fields. Generic
artifacts can also carry per-shader `shaderOpts` such as `inlineHotFns`;
those headers are checked so profile-shaped build policy cannot silently
fall off.

For main-thread isolation, `/shared-wgsl-worker.js` is a generic ESM
worker runner for these artifacts. Send `{ moduleUrl, entry, workgroups,
domain, origin, bindings }`; it imports/caches the generated module, dispatches
the entry through cached prebound functions when available, and posts mutated bindings back. Use `transferBack` paths
like `['colored.buffer']` when a CPU fallback transfers TypedArrays into
the worker and wants their buffers returned without a copy.

`/shared-wgsl-runner.js` is the main-thread helper on top of that Worker.
It lazy-loads artifacts, reads `entryInfo`, falls back to main-thread
dispatch when Workers are unavailable, shards only entries marked
`globalLoop: true`, and includes `WGSLBufferPool` for reusing
per-resolution TypedArray/SAB buffers across CPU fallback frames. On both
main-thread and worker paths it caches `mod.bind(bindings)` by module and
bindings object so repeated frames use positional entry dispatch.
Use `dispatchSequence([...])` for CPU-only pass groups that should
share one Worker roundtrip while still using separate generated
artifacts. Matching `reset/reduce/finalize` and `reset/main` groups
automatically coalesce to synthetic fused entries when the artifact
exposes them.

Adding a new sim: append to `WGSL_SHADER_DIRS` at the top of the
transpile section in `_build.mjs`. Geon is deferred until plasma
integration (B3) shakes out the runtime adapter shape.

### Multi-error reporting (A1)

`emit(ast, { collectErrors: true })` — and the same flag on
`transpileWGSL`/`compileWGSL` — switches the five emit-phase throw
sites (unknown stmt kind, unknown expr kind, bad for-init kind, two
addressOf variants) to collect-then-report. Each failure pushes a
`{phase, kind, message, line, col}` record into the returned
`errors` array and emits a `rt.__unsupported(...)` placeholder, so
the rest of the body still parses and evals; reaching the placeholder
at runtime throws with the original emit-time message. Default mode
unchanged — first failure still throws. Used by the build-time corpus
walker (B2) so a single run surfaces every shader-level issue at once.

### Argument-binding elision in the inline pass (A3)

When a helper arg is a plain ident and the helper body never writes
through the param (no `name = ...`, no `name.x = ...`, no `&name`,
no `var name` shadow), the inline pass aliases the param to the
caller's ident directly instead of emitting `const _inl_N_p = p;`.
Cuts 3-6 lines of emitted JS per call site and removes one binding
from the inner scope. The cloned ident carries over the caller arg's
`resolvedLocalId`, so SROA's id-keyed `scalarizedArityForIdent`
lookup matches the caller's scalarized local — without that
carryover, `q.x` in the inlined body would emit literally and miss
the SROA fast path. `_paramIsMutatedInBody` walks lvalue roots
(`p.x`, `p[i]`, `(p).field`) defensively even though WGSL spec
forbids writing through value params — the parser accepts those
forms, so elision stays safe under any input. `testArgBindingElision` guards
the four cases: plain-ident-elides, non-ident-arg-doesn't,
member-write-disqualifies, output parity vs noInline baseline.

### Nested-inline rename fix

Latent correctness gap surfaced during the Tier 3 profile pass: when
fn A had fn B inlined into it at module-level, and then A was inlined
into fn C, the clone+rename helper didn't recurse into A's pre-existing
synthetic `labeled` / `inline_return_set` / `break_label` stmts. Result:
the cloned body referenced un-renamed names (e.g., `_inl_0_result.x`
after C's `_inl_1_` outer rename) that threw `ReferenceError` at
runtime. Smoke tests missed it because nothing in the original 9-test
set had helper-of-helper shapes; the corpus walker missed it because
it compiles but doesn't execute. Plasma's `fill_cell_ghost` and
`sample_b_unit` would have hit it the moment the CPU path ran.

The fix adds three cases to `_cloneStmtRenamed`: `labeled` recurses
into its body and registers the renamed `resultName` (plus per-component
names when scalarized) in the nameMap so downstream reads see the
right binding; `inline_return_set` renames its `resultName`, `label`,
and value; `break_label` renames its `label`. `testNestedInlinePreservesOutput` is the
regression gate: full-opt vs polymorphic vs `noInline` three-way parity
on a kernel where `spring_force` calls `safe_normalize` and
`clamp_speed` is also nested, exercising both legs of `inline_return_set`
(scalarized vec write, early-return path).

### Profiling generated artifacts

Use the static metric headers first. For current plasma compute artifacts,
`node tests/wgsl-transpile/build-smoke.js` is the budget gate: `rtVec`,
`rtPoly`, `rtAtomic`, and `rtNumeric` must stay at zero, and large jumps
in `bytes`, `lines`, or `iife` should be explained before shipping. If a shader gets
slower while those counters stay flat, run `plasma-bench.js` with the
smallest reproducing `PLASMA_BENCH_SIZES` value, then profile the emitted
artifact in Chrome DevTools or Node's CPU profiler.

For compile-option sweeps, set `PLASMA_BENCH_AUTOTUNE=1`. The harness
benchmarks known `compute-dt` variants, writes
`tests/wgsl-transpile/.plasma-bench-cache.json` keyed by shader source,
transpiler hash, problem size, warmup/iteration count, and variant opts,
then reuses cache hits on later runs. Override the cache location with
`PLASMA_BENCH_CACHE=/tmp/wgsl-cache.json` when you want throwaway tuning
data.

What to look for in profiles:

- Hot `Array.from` frames mean a workgroup var failed the flat-memory
  safety check or regressed to nested allocation; expected hot workgroup
  arrays emit one `Float32Array` per var and reset it in-place.
- Hot `rt.*` frames mean a type-resolution or component-lowering fast path
  regressed. Check the artifact header's `rtVec`, `rtPoly`, `rtAtomic`,
  and `rtNumeric` counts before reading the whole generated file.
- Hot anonymous arrow/IIFE frames are usually base-expression CSE or
  normalize/reflect helpers. If they dominate, prefer hoisting a base index
  or scalar denominator once in the emitter over adding another runtime
  helper call.
- For browser fallback work, load artifacts with dynamic `import()` from
  `/transpiled/...` in `/shared-wgsl-worker.js`. Avoid calling
  `compileWGSL()` on page load: parser/resolve/emit cost and `new Function`
  are intentionally build-time concerns now.
- For row-sharded dispatch, split the 2D domain into `{ domain, origin }`
  jobs so each Worker shard sees the same `global_invocation_id` values
  it would have seen in the full dispatch.

## Coordination notes for fresh instances

- `plasma/` is being built in parallel by other agent sessions. **Don't
  edit plasma files directly** unless a9 explicitly OKs it. Read-only
  access to plasma shaders is fine (the test runner walks them anyway).
  The transpiler should evolve independently of plasma's source layout.
- The transpiler lives at the repo root (`/shared-wgsl-transpile.js`),
  not under any sim. It's shared infrastructure.
- Tests live under `tests/wgsl-transpile/`. There's a `package.json`
  here with `{"type": "module"}` so Node treats `.js` in this dir as
  ESM — important for the imports in `run.js` and `smoke.js`.
- The user's per-session `MEMORY.md` (auto-written) and the
  `~/.claude/plans/` directory may have additional context. The plasma
  plan is at `~/.claude/plans/geon-currently-uses-cpu-abstract-cat.md`
  (the slug is from an earlier conversation; the file is the plasma
  build plan).

## When something breaks

The test runner is the canonical regression check. If a corpus shader
fails compile, the error message includes line + col into the WGSL
source. The first thing to do is dump the emitted JS:

```sh
node --input-type=module -e "
import { tokenize, parse, emit } from './shared-wgsl-transpile.js';
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('PATH_TO_SHADER.wgsl', 'utf8');
const r = emit(parse(tokenize(src)));
writeFileSync('/tmp/wgsl-out.mjs', r.jsSource);
"
node --check /tmp/wgsl-out.mjs  # syntactic check
```

For execute-time failures, run the smoke harness and see whether the
inputs match what the emitted code expects. The runtime helpers in
`shared-wgsl-transpile.js` (look for `export const runtime`) are the
contract — if a kernel needs something the runtime doesn't provide,
add it there with a clear comment about the WGSL spec semantics.
