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
{ entry, bindings, jsSource }`.

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

# Microbench for the emit pipeline. Compiles a vec3-heavy synthetic
# kernel and reports wall-time / Mvops-per-sec. Baseline for measuring
# the inline-emit perf win in phase 4 of the resolver arc.
node tests/wgsl-transpile/bench.js                    # defaults
BENCH_N=50000 BENCH_ITERS=20 node tests/wgsl-transpile/bench.js
```

run.js and smoke.js exit non-zero on any expected-phase failure. bench.js
always exits 0 — it's a measurement tool, not a pass/fail check.
`run.js`'s `EXPECTED` set at the top of the file controls which phases
are enforced — adjust when bringing a new phase online.

## Current status (last touched 2026-05-25)

| Phase         | Coverage                                            | Notes |
|---------------|-----------------------------------------------------|-------|
| tokenize      | 68/68 shaders, 13.5k lines, 100k tokens             | Full WGSL token grammar |
| parse         | 68/68 shaders → AST                                 | Recursive descent + Pratt for exprs |
| resolve       | 100% decl sites (15389/15389), 90.1% Expr nodes     | Symbol table + expr resolver pass |
| emit          | 68/68 shaders → JS that parses cleanly              | Type-driven inline scalar/vec emit, SROA for vec lets, builtin scalarization, write-through stores; rt.* fallback when types unresolved |
| eval          | 68/68 shaders construct as live JS module           | Build-time mode would sidestep this |
| dispatch      | 7/7 smoke tests pass                                | Includes barrier-split atomic reduction + resolver coverage |
| **bench**     | **~21-26× speedup vs polymorphic baseline** (M5 Max) | Two kernels: FMA (arithmetic-heavy), Verlet (storage-I/O-dominant — real shader shape) |

Bench detail (N=100k particles × 30 iters, post Tier 1):

| Kernel              | Baseline    | Inlined emit | Speedup | Per-particle |
|---------------------|-------------|--------------|---------|--------------|
| A: vec3 FMA loop    | ~2.2 ms/iter (allocation-bound) | ~2.0 ms/iter | ~22-29× | — |
| B: Verlet step      | ~21 ms/iter | ~0.9 ms/iter | ~21-31× | ~9 ns |

Variance 20-30% across runs from V8 warmup + GC. Kernel B at 0.85ms/iter
is approaching native-compiled JS throughput — within ~1.4× of what
hand-written allocation-free JS would do on the same kernel.

The compounding optimizations that got us here (each measured individually
on top of the previous):

1. Phase-4 inline emit (pre-session baseline) — kernel A 7.3×, kernel B 7.2×
2. Step 1: write-through for fresh-vec assigns — kernel A → 19×, kernel B unchanged
3. Step 1.5a: SROA for let-bound vec locals — kernel A → 21×, kernel B → 11.5×
4. Step 1.5b: emitMember SROA fast-path — kernel A unchanged, kernel B → 16.5×
5. Step 1.5c: builtin (gid/lid/wgid/nwg) scalarization — kernel A → 31×, kernel B → 19×

The resolve phase's 9.9% Expr gap is structural, not bugs: ~5% is
JS-injected consts (geon's `buildWGSLConstants()` prepends `EPSILON`,
`HISTORY_LEN`, etc. as template strings at runtime — they don't exist in
any `.wgsl` file the harness can see), ~5% is cascading from those plus
a handful of rarely-used intrinsics. At actual compile time these all
resolve fine; the corpus walker is just blind to them.

The 6 smoke tests cover:
1. Scalar FMA over a 1D buffer (`y = scale * x + offset`)
2. Bindings catalog correctness
3. vec4 arithmetic with struct member access
4. Helper fns + module-level constants + if/else branching
5. (implicit in 1-4) the basic dispatch loop semantics
6. Workgroup-level atomic reduction across a barrier — proves phase
   splitting correctly serializes invocations at `workgroupBarrier()`

## Architecture (read before editing)

`/shared-wgsl-transpile.js` is one ~1200-LOC ESM file with these sections:

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

3. **Emitter** (`emit`, `class Emitter`) — walks the AST in two passes:
   catalog top-level items into Maps, then emit each. Convention details:
   - Vec types are `{x, y, z, w}` JS objects; arithmetic dispatches
     through `rt.add/sub/mul/div/mod` for scalar↔vec broadcasting.
   - JS-reserved words (`in`, `of`, `class`, ...) at declaration sites
     get prefixed with `_` via `_safe()`; references resolve consistently.
     Member access (`bindings.in`) is fine in JS and isn't escaped.
   - WGSL swizzles (`.rgb`, `.xyz`, `.rgba`) detect by character set and
     length; single-char `r/g/b/a` map to `x/y/z/w`; multi-char emit
     `rt.vecN(...)` constructor calls.
   - `discard` outside an entry block → plain `return` (fragment-only
     construct; not modeled CPU-side).
   - `&local` for struct/object locals emits the identifier directly —
     JS object references mutate in place, giving by-reference semantics
     for the common accumulator pattern. Scalar locals are a known
     limitation (rare in plasma/geon).

4. **Runtime** (`runtime`, the `rt` namespace) — small set of helpers
   the emitted code calls: type constructors, scalar casts, polymorphic
   arithmetic, math intrinsics, bitcasts, atomic operations
   (single-threaded, so atomicAdd is just a swap-and-add). Tests can
   override by passing `opts.runtime`.

5. **`compileWGSL`** — plumbs all four together. Constructs a live JS
   module from the emitted body with `rt` as the only captured variable,
   returns the live `{ entry, bindings }`. The function's JSDoc has a
   security note: the runtime construction is intentional (it IS the
   transpiler) and is only safe because the WGSL input is under your
   own control. Build-time mode (next-steps item below) sidesteps this
   concern entirely by emitting committed `.js` artifacts.

### Phase splitting (the subtle bit)

When an entry function contains top-level `workgroupBarrier()` calls,
`emitEntry` splits the body into phases. Each phase gets its own
invocation triple-loop, so all invocations finish phase N before any
start phase N+1. Workgroup-shared atomics (`var<workgroup> tile: atomic<u32>;`)
live on a per-workgroup `wg` object that persists across phases. This is
how `compute-dt`-style reductions execute correctly.

**Limitation**: barriers nested inside `if`/`for`/`while` aren't lifted
out into phases. Doing so would require duplicating the surrounding
control flow across phase boundaries. plasma+geon currently use only
top-level barriers so this hasn't bitten yet, but if a future shader
needs it, the work is contained to `splitPhases` + a control-flow
analyzer pass.

## Next steps (priority order)

### 1. Build-time mode + `_build.js` integration

Write a shader-walker that finds every `.wgsl` in the repo (or just per
sim), compiles each through the transpiler, and emits a sibling
`.transpiled.js` file. Hook into the existing optional `_build.js`. After
this lands, CPU backends can `import` the transpiled artifact directly
instead of running the transpiler at runtime, which:

- Eliminates the runtime code-construction caveat in production
- Removes the parser/emitter from the browser bundle entirely
- Makes transpile errors surface at build time, not on first load
- Adds a build step authors need to remember (mitigated: it's optional
  in the current `_build.js` flow, and dev mode can keep runtime
  transpile as the fast-iteration path)

Estimate: ~150 LOC of new code in a new `tools/wgsl-build.js` (or fold
into `_build.js`), plus a few lines in the per-sim `pipelines.js` to
prefer the transpiled artifact when present. Mostly grunt work.

### 2. Type resolver + inline-scalar emit + SROA  *(landed)*

The performance milestone. All phases complete; see the bench table at
the top of this file for measured numbers.

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
- ✅ **Phase 3: Benchmark harness** — `tests/wgsl-transpile/bench.js`
  runs *two* kernels: vec3 FMA loop (allocation-bound, the maximum
  win available from arithmetic fusion) and Verlet spring step
  (storage-I/O dominant, realistic shader shape). Each runs baseline
  (polymorphic rt.*) vs inlined (current emit) back-to-back.
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

### 3. Flat TypedArray binding mode  *(deferred to plasma integration)*

Scoped during the Tier 1 work but deferred — Tier 1's other wins (SROA +
builtin scalarization) consumed most of the perf headroom, so the
remaining value of flat TypedArray is **GPU-parity** rather than raw
speed. Plasma's WebGPU buffers are `Float32Array`s; without flat-storage
support, the CPU fallback has to marshal each one into `{x, y, z}`
objects per step (expensive and pointless).

Design (pre-decided):
- `compileWGSL(src, { flatStorage: true })` enables it.
- `array<vecN<f32|u32|i32>>` storage bindings expect packed-stride
  TypedArrays (stride=N, no padding). `array<vec3<f32>>` expects
  `Float32Array(n*3)`.
- Per-binding stride override available via `opts.storageLayout` for
  std430-padded buffers if needed.
- Emit lowers `a[i].c` to `bindings.a[i*stride + componentIndex]`
  directly — no intermediate vec object materialization. Write-through
  composes: `a[i] = vec3-expr` lowers to three TypedArray stores.
- Object-mode storage stays the default for backward compat with the
  existing smoke tests.
- `array<struct>` not yet supported — needs struct-field-offset
  computation per WGSL alignment rules. Follow-up.

Best done as part of (or just before) the plasma integration so we can
validate against the actual binding format plasma produces.

### 4. Plasma integration

The transpiler exists *for* plasma. Once build-time mode + flat-storage
land, the integration is small:
- `plasma/src/gpu/pipelines.js` (or a new `plasma/src/cpu/` module)
  imports the transpiled JS modules
- `plasma/main.js` feature-detects WebGPU; on failure, instantiates the
  CPU backend and runs the same `step()` orchestration against it
- The bindings object the GPU code already constructs (uniforms, storage
  buffers as Float32Arrays) flows directly to the CPU backend when
  `flatStorage: true` is set at compile time

The original plasma plan locked `No CPU fallback` as a design decision.
The transpiler changes that calculus: the cost of the fallback is no
longer "maintain a parallel implementation forever" — it's "write the
adapter shim once." Worth revisiting that decision when picking this up.

### 5. Geon integration (much later)

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

- `bitcast` source-type inference (currently routes only by typeArgs)
- SROA for `var` (mutable) vec locals — currently only `let`/`const`
  vec locals scalarize. Vars are rarer in plasma/geon kernels, but
  kernel A's `var acc = vec3(0)` would benefit by another small amount.
  Needs care around compound-assign (`+=`) and conditional reassignment.
- Matrix types (`mat3x3<f32>` etc.) — geon doesn't use, plasma doesn't
  use, but adding for completeness is straightforward
- Type aliases (`alias Vec3F = vec3<f32>;`) — parser accepts, resolver
  needs to substitute
- Small-fn inlining — inline ≤K-stmt helpers called from ≤M sites so
  vec lowering can see through the call boundary. Helps any shader with
  `clampSpeed`-shape helpers.
- Dead-component elimination for scalarized builtins — if a kernel only
  uses `gid.x`, skip emitting `gid_y`/`gid_z`. Tiny win, easy.
- Better error reporting from the emit phase (currently throws at the
  first unhandled construct; would be nice to collect and report
  several)

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
