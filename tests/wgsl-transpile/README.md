# WGSL transpiler tests

This directory tests the standalone WGSL-to-JavaScript compute-shader
transpiler in `lib/wgsl/transpile.js`.

The transpiler is **not part of the deployed simulation path**. The root build
does not generate `transpiled/` artifacts, no simulation imports the
transpiler or runner, and `lib/wgsl/runner.js` plus
`lib/wgsl/worker.js` are retained as dormant integration code. Geon keeps
its own CPU backend; Plasma currently requires WebGPU. Re-enabling a browser
CPU fallback would require an explicit build-artifact configuration and a
simulation-side importer.

## Public API

```js
import { compileWGSL, transpileWGSL } from '../../lib/wgsl/transpile.js';

const compiled = compileWGSL(source, options);
compiled.entry.main({
  workgroups: [wx, wy, wz],
  domain: [nx, ny, nz],       // optional exact CPU iteration domain
  origin: [ox, oy, oz],       // optional global-id offset
  bindings: { U_in, U_out, U_uniforms },
});

const bound = compiled.bind({ U_in, U_out, U_uniforms });
bound.main([wx, wy, wz], [nx, ny, nz], [ox, oy, oz]);

const artifact = transpileWGSL(source, options);
```

`compileWGSL()` returns executable `entry` functions, a prebinding helper,
binding names, entry metadata, generated source, metrics, and any collected
errors. `transpileWGSL()` returns the corresponding build-time source and
metadata without evaluating it. Bindings use WGSL identifier names rather
than group/binding numbers.

Only trusted, repository-owned WGSL should be passed to `compileWGSL()`:
executable modules are constructed from the generated JavaScript with
`Function`. The production CSP does not allow `unsafe-eval`, so
`transpileWGSL()` is the required API for any future deployed artifact
pipeline; runtime browser compilation is not compatible with the site policy.

The supported surface is the compute-shader subset covered by the Geon and
Plasma corpora and the synthetic smoke suite. This is not a general WGSL
implementation: render entry points, textures and samplers, and matrix
execution are outside the current contract. Barriers are supported when they
occur at the top level of a compute entry; barriers nested in control flow are
reported as unsupported. A `loop` continuing block parses but is not emitted.
Use `collectErrors: true` when auditing a new corpus so unsupported constructs
are returned in `errors` instead of stopping at the first emitter failure.

## Required checks

Run these after changing the transpiler or its runtime helpers:

```sh
# Tokenize, parse, resolve, and compile every .wgsl file in initialized repos.
node tests/wgsl-transpile/run.js

# Execute the focused correctness suite against synthetic and corpus-derived
# kernels.
node tests/wgsl-transpile/smoke.js

# Exercise the retained main-thread and worker-sharding runner contract.
node tests/wgsl-transpile/runner-smoke.js
```

The corpus runner accepts a path substring and a quiet flag:

```sh
node tests/wgsl-transpile/run.js plasma
node tests/wgsl-transpile/run.js --quiet
```

The exact shader and assertion counts are intentionally reported by the
runners rather than duplicated here; initialized submodules and test coverage
can change them.

## Optional performance tools

`bench.js` compares the optimized emitter with the polymorphic baseline on
four synthetic kernel shapes. Results are measurements, not pass/fail gates,
and vary with V8 warmup and garbage collection.

```sh
node tests/wgsl-transpile/bench.js
BENCH_N=100000 BENCH_ITERS=20 node tests/wgsl-transpile/bench.js
```

`plasma-bench.js` compiles selected live Plasma shaders directly and times
them on the CPU. It does not imply that Plasma ships a CPU fallback.

```sh
node tests/wgsl-transpile/plasma-bench.js
PLASMA_BENCH_SIZES=64,128 PLASMA_BENCH_ITERS=10 \
  node tests/wgsl-transpile/plasma-bench.js
```

## Dormant artifact harness

`build-smoke.js` validates a pre-generated `transpiled/` artifact tree. That
tree and its writer were deliberately removed from `tools/build.mjs`, so the
command is not part of the current test gate and is expected to report that
no artifacts exist. Keep the harness only as a validation starting point if
the artifact pipeline is restored.

If the integration is re-enabled, the minimum contract is:

1. `tools/build.mjs` emits deterministic modules from repository-owned WGSL and
   records enough source, option, and transpiler hashes to detect staleness.
2. A simulation imports those artifacts through the runner; no runtime path
   compiles untrusted shader text.
3. `build-smoke.js` passes in addition to the three required checks above.
4. The production simulation is tested in both its WebGPU and CPU-fallback
   paths before the docs describe the fallback as supported.

## Architecture notes

The implementation is a lex/parse/resolve/emit pipeline with an executable
wrapper:

```text
tokenize -> parse -> resolveModule -> inline/SROA -> emit
                                              |-> transpileWGSL
                                              `-> compileWGSL
```

The emitter specializes typed scalar and vector operations, lowers eligible
storage to typed arrays, scalarizes vector and struct locals, supports
prebound dispatch, and splits top-level workgroup barriers into sequential
phases. Workgroup atomics remain meaningful across those phases even though
the CPU executor is serial. The smoke suite is the contract for these
optimizations: optimized, non-inlined, polymorphic, object-storage, and flat
storage variants must agree where the tests compare them.

For implementation options and return fields, prefer the JSDoc on
`transpileWGSL()` and `compileWGSL()` plus the executable smoke tests over a
separate option catalog here.
