/* ═══════════════════════════════════════════════════════════════════
   shared-wgsl-transpile.js — WGSL → JavaScript transpiler.

   Walking skeleton (Phase 0). Tokenizer is complete. Parser, emitter,
   runtime, and dispatch wrapper are scaffolded with API contracts but
   not yet implemented.

   ── Why it exists ───────────────────────────────────────────────────
   WebGPU sims on a9l.im each face the same choice: ship GPU-only and
   strand the ~30% of visitors without WebGPU on a "your browser
   needs..." splash, or hand-maintain a parallel CPU backend that
   silently drifts out of sync with the GPU one (the geon experience).
   This module is the third option: lex/parse the .wgsl source at
   build-time or runtime and emit JS that executes the same compute
   kernels serially. Single source of truth = the .wgsl file.

   ── API contract ────────────────────────────────────────────────────
     import { compileWGSL } from '/shared-wgsl-transpile.js';
     const mod = compileWGSL(wgslSource);
     mod.entry.main({
       workgroups: [Wx, Wy, Wz],
       bindings: { U_in: f32arr, U_out: f32arr, U_uniforms: {...} },
     });

   Bindings are passed by their WGSL identifier name (not group/binding
   index) — friendlier than tracking bind group layouts. Storage and
   uniform buffers come in as the caller's choice of representation
   (flat TypedArray or per-element object); the emitted code uses the
   runtime's read/write helpers, which dispatch on the binding's
   declared WGSL type.

   ── Architectural sketch ────────────────────────────────────────────
     tokenize(src)            → Token[]
     parse(tokens)            → Module AST
     resolveModule(ast)       → annotates .resolvedType on every Expr
     emit(ast)                → { jsSource, decls }
     compileWGSL(src) plumbs all four plus runtime binding.

   ── Emit pipeline (the perf-relevant bit) ──────────────────────────
   The emitter aggressively eliminates intermediate vec object
   allocations using the resolver's type info:

     1. Component lowering — `acc = av * k + bv` lowers to a single
        `{x: av.x*k+bv.x, ...}` object literal, not three rt.add calls.
     2. Write-through — `arr[i] = vec-expr` lowers to three scalar
        stores via `_wlv` cached lvalue + scalar temps. Mutable-local
        accumulator stores (`acc = acc + ...`) also write-through.
     3. SROA — vec lets in a fn body whose only uses are member access,
        component-lowerable arithmetic, or write-through stores get
        scalarized: `let p = q - r` lowers to `const p_x = q.x - r.x;
        const p_y = ...; const p_z = ...;`. Whole-vec uses (passed to
        a fn, polymorphic fallback) rematerialize via `rt.vecN(p_x,
        p_y, p_z)` — safety net that allocates only at that one site.
     4. Builtin scalarization — `@builtin(global_invocation_id) gid`
        and friends are pre-scalarized: `gid_x = wgx*Lx + lx;` etc.
        No `rt.vec3()` alloc for builtins that are only member-accessed
        (the common case).

   Result: ~21-26× speedup over the polymorphic baseline on the bench
   harness, for both arithmetic-heavy and storage-I/O-dominant kernels.
   Each transformation has a `opts.polymorphic: true` opt-out for A/B
   measurement and falls back gracefully when types can't be resolved.

   ── Runtime semantics ──────────────────────────────────────────────
   CPU is single-threaded, so:
   - atomicAdd / atomicMax / atomicStore / atomicLoad degrade to plain
     reads + writes (no contention possible). Workgroup-local atomics
     still work correctly because phases between workgroupBarrier()
     calls run all invocations sequentially within one workgroup
     before advancing.
   - workgroupBarrier() splits the entry function into phases. Each
     phase runs across all workgroup invocations before the next phase
     begins. Workgroup-shared memory is therefore consistent at each
     barrier as it would be on a GPU.
   - bitcast<u32>(f32) and friends use shared Float32Array / Uint32Array
     views for IEEE-754 round-tripping.

   ── Not yet supported (will land as plasma needs them) ──────────────
   - Matrix types (mat2x2 etc.)
   - Texture / sampler bindings
   - Pointer types beyond ptr<storage, array<T>, read|read_write>
     (function-private pointers, ptr-of-ptr, etc.)
   - Vertex / fragment entry points (compute only — render goes
     through canvas-2d or stays GPU-only)
   - WGSL `loop` construct with explicit continuing block
   - `switch` statements
   - User-defined operator overloads (none in WGSL spec, but worth
     stating)

   ─────────────────────────────────────────────────────────────────── */


//#region 0. Shared error type

export class WGSLError extends Error {
    constructor(message, line, col) {
        super(`WGSL:${line}:${col}: ${message}`);
        this.line = line;
        this.col  = col;
    }
}

//#endregion


//#region 1. TOKENIZER  ───────────────────────────────────────────────

/** @typedef {'kw'|'ident'|'num'|'punct'|'attr'} TokenKind */
/** @typedef {{kind: TokenKind, value: string, line: number, col: number,
 *            isFloat?: boolean, suffix?: string, intBase?: number}} Token */

/** WGSL reserved keywords (subset used by plasma + geon shaders). */
const KEYWORDS = new Set([
    'fn', 'struct', 'const', 'var', 'let', 'alias', 'type',
    'if', 'else', 'for', 'while', 'loop', 'continuing', 'switch',
    'case', 'default', 'break', 'continue', 'return', 'discard',
    'true', 'false',
    // address spaces & access modes — context-sensitive but always
    // appear in known positions, fine to keep as plain idents in the
    // token stream. Listed here for reference only; not in the set.
]);

/** Longest-match operator table. Ordered: 3-char, 2-char, 1-char. */
const OPS_3 = ['<<=', '>>='];
const OPS_2 = [
    '==', '!=', '<=', '>=', '&&', '||', '<<', '>>',
    '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
    '->', '::', '++', '--',
];
const OPS_1 = '+-*/%<>=!&|^~()[]{},;:.?@';

/**
 * Tokenize a WGSL source string into a flat Token[].
 * Strips whitespace and comments (line + nestable block).
 * Throws WGSLError on lex errors. Line/col are 1-based.
 *
 * @param {string} src
 * @returns {Token[]}
 */
export function tokenize(src) {
    /** @type {Token[]} */
    const out = [];
    let i = 0;
    let line = 1;
    let col = 1;
    const n = src.length;

    const advance = (k) => {
        for (let j = 0; j < k; j++) {
            if (src.charCodeAt(i + j) === 10) { line++; col = 1; }
            else col++;
        }
        i += k;
    };

    const isIdStart = (c) => (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_';
    const isIdCont  = (c) => isIdStart(c) || (c >= '0' && c <= '9');
    const isDigit   = (c) => c >= '0' && c <= '9';
    const isHex     = (c) => isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');

    while (i < n) {
        const startLine = line;
        const startCol  = col;
        const c = src[i];

        // ── Whitespace ─────────────────────────────────────────────
        if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
            advance(1);
            continue;
        }

        // ── Line comment ───────────────────────────────────────────
        if (c === '/' && src[i + 1] === '/') {
            while (i < n && src[i] !== '\n') advance(1);
            continue;
        }

        // ── Block comment (nestable per WGSL spec) ─────────────────
        if (c === '/' && src[i + 1] === '*') {
            let depth = 1;
            advance(2);
            while (i < n && depth > 0) {
                if (src[i] === '/' && src[i + 1] === '*') { depth++; advance(2); }
                else if (src[i] === '*' && src[i + 1] === '/') { depth--; advance(2); }
                else advance(1);
            }
            if (depth !== 0) throw new WGSLError('unterminated block comment', startLine, startCol);
            continue;
        }

        // ── Identifier / keyword ───────────────────────────────────
        if (isIdStart(c)) {
            let j = i + 1;
            while (j < n && isIdCont(src[j])) j++;
            const value = src.slice(i, j);
            advance(j - i);
            out.push({
                kind: KEYWORDS.has(value) ? 'kw' : 'ident',
                value, line: startLine, col: startCol,
            });
            continue;
        }

        // ── Numeric literal ────────────────────────────────────────
        // Hex: 0x[0-9a-fA-F]+ (with optional u/i/f/h suffix)
        // Int: [0-9]+ (with optional u/i/f/h suffix)
        // Float: [0-9]+ '.' [0-9]* ([eE][+-]?[0-9]+)? (with f/h suffix)
        //        '.'[0-9]+ ([eE][+-]?[0-9]+)? (rare; not in plasma)
        //        [0-9]+ [eE][+-]?[0-9]+ (also valid)
        if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
            let j = i;
            let isFloat = false;
            let intBase = 10;

            if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
                intBase = 16;
                j += 2;
                while (j < n && isHex(src[j])) j++;
            } else {
                while (j < n && isDigit(src[j])) j++;
                if (src[j] === '.' && isDigit(src[j + 1])) {
                    isFloat = true;
                    j++;
                    while (j < n && isDigit(src[j])) j++;
                } else if (src[j] === '.') {
                    // Trailing dot — `1.` style. WGSL spec accepts.
                    isFloat = true;
                    j++;
                }
                if (src[j] === 'e' || src[j] === 'E') {
                    isFloat = true;
                    j++;
                    if (src[j] === '+' || src[j] === '-') j++;
                    while (j < n && isDigit(src[j])) j++;
                }
            }

            const numText = src.slice(i, j);

            // Optional type suffix
            let suffix = null;
            const sc = src[j];
            if (sc === 'u' || sc === 'i' || sc === 'f' || sc === 'h') {
                suffix = sc;
                if (sc === 'f' || sc === 'h') isFloat = true;
                j++;
            }

            advance(j - i);
            out.push({
                kind: 'num', value: numText, line: startLine, col: startCol,
                isFloat, suffix, intBase,
            });
            continue;
        }

        // ── Attribute marker `@` is just punctuation; parser groups ─
        // it with the following ident at the AST level.

        // ── Multi-char operators ───────────────────────────────────
        const tri = src.slice(i, i + 3);
        if (OPS_3.includes(tri)) {
            advance(3);
            out.push({ kind: 'punct', value: tri, line: startLine, col: startCol });
            continue;
        }
        const di = src.slice(i, i + 2);
        if (OPS_2.includes(di)) {
            advance(2);
            out.push({ kind: 'punct', value: di, line: startLine, col: startCol });
            continue;
        }
        if (OPS_1.indexOf(c) >= 0) {
            advance(1);
            out.push({ kind: 'punct', value: c, line: startLine, col: startCol });
            continue;
        }

        throw new WGSLError(`unexpected character ${JSON.stringify(c)}`, startLine, startCol);
    }

    return out;
}

//#endregion


//#region 2. PARSER  ──────────────────────────────────────────────────

/* ── AST shapes (informal) ────────────────────────────────────────
   Module     = { kind:'module', items: Item[] }
   Item       = Struct | Fn | GlobalVar | Const | Alias
   Struct     = { kind:'struct', name, fields: StructField[] }
   StructField= { name, type, attrs }
   Fn         = { kind:'fn', name, attrs, params, returnType?, returnAttrs, body }
   Param      = { name, type, attrs }
   Attr       = { kind:'attr', name, args: Expr[] }
   GlobalVar  = { kind:'global_var', name, attrs, addressSpace, access,
                  type, init?, group?, binding? }
   Const      = { kind:'const', name, type?, value }
   Alias      = { kind:'alias', name, type }

   Type       = { kind:'type_scalar', name }
              | { kind:'type_vec',    n: 2|3|4, of: Type }
              | { kind:'type_mat',    cols, rows, of: Type }
              | { kind:'type_array',  of: Type, count: Expr|null }
              | { kind:'type_atomic', of: Type }
              | { kind:'type_ptr',    addressSpace, of: Type, access? }
              | { kind:'type_named',  name }

   Stmt       = Block | Let | Var | Const | Assign | Compound | If | For
              | While | Loop | Return | Break | Continue | Discard | ExprStmt
   Block      = { kind:'block', stmts: Stmt[] }
   Let        = { kind:'let',   name, type?, value }
   Var        = { kind:'var',   name, type?, value? }
   Assign     = { kind:'assign',     op:'=',  target, value }
   Compound   = { kind:'compound',   op:'+='|'-='|..., target, value }
   If         = { kind:'if',    cond, then: Block, else: Block|If|null }
   For        = { kind:'for',   init: Stmt|null, cond: Expr|null,
                                 update: Stmt|null, body: Block }
   While      = { kind:'while', cond, body: Block }
   Return     = { kind:'return', value: Expr|null }
   ExprStmt   = { kind:'expr_stmt', expr }

   Expr       = Lit | Ident | Bin | Una | Call | Member | Index | Paren
   Lit        = { kind:'lit',    raw, isFloat, suffix?, intBase? }
   Ident      = { kind:'ident',  name }
   Bin        = { kind:'bin',    op, lhs, rhs }
   Una        = { kind:'una',    op, value }
   Call       = { kind:'call',   callee: string, typeArgs?: Type[], args: Expr[] }
   Member     = { kind:'member', value, name }    // .x, .field
   Index      = { kind:'index',  value, index }   // a[i]
   Paren      = { kind:'paren',  value }

   Every AST node carries `loc: {line, col}` for diagnostics.
   ──────────────────────────────────────────────────────────────── */

/** Idents that aren't keywords but introduce parameterized types. */
const TYPE_GENERIC_IDENTS = new Set([
    'vec2', 'vec3', 'vec4',
    'mat2x2', 'mat2x3', 'mat2x4',
    'mat3x2', 'mat3x3', 'mat3x4',
    'mat4x2', 'mat4x3', 'mat4x4',
    'array', 'atomic', 'ptr',
]);

/** Scalar type names (also valid as type constructors at expression level). */
const SCALAR_TYPE_IDENTS = new Set(['f32', 'i32', 'u32', 'f16', 'bool']);

/** Short-form vec aliases — `vec3f` ≡ `vec3<f32>`, `vec4u` ≡ `vec4<u32>`, etc. */
const VEC_ALIAS = (() => {
    const out = {};
    for (const n of [2, 3, 4]) {
        for (const [suf, sc] of [['f', 'f32'], ['u', 'u32'], ['i', 'i32'], ['h', 'f16']]) {
            out[`vec${n}${suf}`] = { n, of: { kind: 'type_scalar', name: sc } };
        }
    }
    return out;
})();

/** Compound assignment operators. */
const COMPOUND_OPS = new Set([
    '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
]);

/** Pratt-style binary operator precedence (higher binds tighter). */
const BIN_PREC = {
    '||': 1,
    '&&': 2,
    '|':  3,
    '^':  4,
    '&':  5,
    '==': 6, '!=': 6,
    '<':  7, '>':  7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8,
    '+':  9, '-':  9,
    '*': 10, '/': 10, '%': 10,
};

/**
 * Parse a token stream into a Module AST.
 * @param {Token[]} tokens
 * @returns {object}
 */
export function parse(tokens) {
    const p = new Parser(tokens);
    return p.parseModule();
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.i = 0;
        // When > 0, the expression parser treats `<`, `>`, `<=`, `>=`,
        // `<<`, `>>` as type-bracket terminators rather than binary
        // operators. Used while parsing inside `array<T, N>` and
        // similar contexts where `N` is an expression.
        this.noRelDepth = 0;
    }

    // ── Cursor primitives ──────────────────────────────────────────
    peek(k = 0) { return this.tokens[this.i + k]; }
    eat()       { return this.tokens[this.i++]; }
    eof()       { return this.i >= this.tokens.length; }
    loc()       {
        const t = this.peek();
        return t ? { line: t.line, col: t.col } : { line: 0, col: 0 };
    }

    /** True if the next token matches kind and (optional) value. */
    check(kind, value) {
        const t = this.peek();
        if (!t || t.kind !== kind) return false;
        if (value != null && t.value !== value) return false;
        return true;
    }

    /** Eat and return the next token if it matches; else null. */
    accept(kind, value) {
        if (!this.check(kind, value)) return null;
        return this.eat();
    }

    /** Eat and return the next token; throw if it doesn't match.
     *  Special-cased for the closing '>' of a type/generic: the
     *  tokenizer eagerly grabs '>>', '>=', and '>>=' as single tokens
     *  (right-shift, greater-equal, right-shift-assign), but the
     *  parser sometimes needs to peel one '>' off the front. */
    expect(kind, value) {
        if (kind === 'punct' && value === '>') {
            const t = this.peek();
            if (t && t.kind === 'punct' && t.value !== '>') {
                const splits = { '>>': '>', '>=': '=', '>>=': '>=' };
                if (splits[t.value]) {
                    this.tokens[this.i] = {
                        kind: 'punct', value: splits[t.value],
                        line: t.line, col: t.col + 1,
                    };
                    return { kind: 'punct', value: '>', line: t.line, col: t.col };
                }
            }
        }
        if (!this.check(kind, value)) {
            const t = this.peek();
            const got = t ? `${t.kind} '${t.value}'` : 'EOF';
            const want = value != null ? `'${value}'` : kind;
            const loc = t ? { line: t.line, col: t.col } : { line: 0, col: 0 };
            throw new WGSLError(`expected ${want}, got ${got}`, loc.line, loc.col);
        }
        return this.eat();
    }

    /** Eat any number of attributes (@name(args...)) and return them. */
    parseAttrs() {
        const out = [];
        while (this.accept('punct', '@')) {
            const loc = this.loc();
            const name = this.expect('ident').value;
            const args = [];
            if (this.accept('punct', '(')) {
                if (!this.check('punct', ')')) {
                    args.push(this.parseExpr());
                    while (this.accept('punct', ',')) args.push(this.parseExpr());
                }
                this.expect('punct', ')');
            }
            out.push({ kind: 'attr', name, args, loc });
        }
        return out;
    }

    // ── Module ─────────────────────────────────────────────────────
    parseModule() {
        const items = [];
        while (!this.eof()) {
            const item = this.parseTopLevel();
            if (item) items.push(item);
        }
        return { kind: 'module', items };
    }

    parseTopLevel() {
        const attrs = this.parseAttrs();
        const t = this.peek();
        if (!t) return null;

        if (t.kind === 'kw') {
            switch (t.value) {
                case 'struct': return this.parseStruct(attrs);
                case 'fn':     return this.parseFn(attrs);
                case 'var':    return this.parseGlobalVar(attrs);
                case 'const':  return this.parseConst(attrs);
                case 'alias':
                case 'type':   return this.parseAlias(attrs);
            }
        }
        // Stray semicolons are tolerated.
        if (this.accept('punct', ';')) return null;
        throw new WGSLError(`unexpected ${t.kind} '${t.value}' at top level`, t.line, t.col);
    }

    parseStruct(attrs) {
        const loc = this.loc();
        this.expect('kw', 'struct');
        const name = this.expect('ident').value;
        this.expect('punct', '{');
        const fields = [];
        while (!this.check('punct', '}')) {
            const fAttrs = this.parseAttrs();
            const fName = this.expect('ident').value;
            this.expect('punct', ':');
            const fType = this.parseType();
            fields.push({ name: fName, type: fType, attrs: fAttrs });
            // WGSL allows comma or semicolon separators between fields.
            if (!this.accept('punct', ',')) this.accept('punct', ';');
        }
        this.expect('punct', '}');
        // Optional trailing semicolon after struct decl
        this.accept('punct', ';');
        return { kind: 'struct', name, fields, attrs, loc };
    }

    parseFn(attrs) {
        const loc = this.loc();
        this.expect('kw', 'fn');
        const name = this.expect('ident').value;
        this.expect('punct', '(');
        const params = [];
        if (!this.check('punct', ')')) {
            params.push(this.parseParam());
            while (this.accept('punct', ',')) {
                if (this.check('punct', ')')) break; // trailing comma
                params.push(this.parseParam());
            }
        }
        this.expect('punct', ')');

        let returnType = null;
        let returnAttrs = [];
        if (this.accept('punct', '->')) {
            returnAttrs = this.parseAttrs();
            returnType = this.parseType();
        }
        const body = this.parseBlock();
        return {
            kind: 'fn', name, attrs, params, returnType, returnAttrs, body, loc,
        };
    }

    parseParam() {
        const loc = this.loc();
        const pAttrs = this.parseAttrs();
        const pName = this.expect('ident').value;
        this.expect('punct', ':');
        const pType = this.parseType();
        return { name: pName, type: pType, attrs: pAttrs, loc };
    }

    parseGlobalVar(attrs) {
        const loc = this.loc();
        this.expect('kw', 'var');
        let addressSpace = null;
        let access = null;
        if (this.accept('punct', '<')) {
            addressSpace = this.expect('ident').value;
            if (this.accept('punct', ',')) {
                access = this.expect('ident').value;
            }
            this.expect('punct', '>');
        }
        const name = this.expect('ident').value;
        let type = null;
        if (this.accept('punct', ':')) type = this.parseType();
        let init = null;
        if (this.accept('punct', '=')) init = this.parseExpr();
        this.expect('punct', ';');

        // Pull `group` and `binding` from attrs for convenience.
        let group, binding;
        for (const a of attrs) {
            if (a.name === 'group'   && a.args[0]?.kind === 'lit') group   = +a.args[0].raw;
            if (a.name === 'binding' && a.args[0]?.kind === 'lit') binding = +a.args[0].raw;
        }
        return {
            kind: 'global_var', name, attrs, addressSpace, access,
            type, init, group, binding, loc,
        };
    }

    parseConst(attrs) {
        const loc = this.loc();
        this.expect('kw', 'const');
        const name = this.expect('ident').value;
        let type = null;
        if (this.accept('punct', ':')) type = this.parseType();
        this.expect('punct', '=');
        const value = this.parseExpr();
        this.expect('punct', ';');
        return { kind: 'const', name, type, value, attrs, loc };
    }

    parseAlias(attrs) {
        const loc = this.loc();
        this.eat(); // 'alias' or 'type'
        const name = this.expect('ident').value;
        this.expect('punct', '=');
        const type = this.parseType();
        this.expect('punct', ';');
        return { kind: 'alias', name, type, attrs, loc };
    }

    // ── Types ──────────────────────────────────────────────────────
    parseType() {
        const t = this.peek();
        if (!t) throw new WGSLError('expected type', 0, 0);
        const loc = { line: t.line, col: t.col };

        // Scalars / named types are plain idents.
        if (t.kind === 'ident' || t.kind === 'kw') {
            if (SCALAR_TYPE_IDENTS.has(t.value)) {
                this.eat();
                return { kind: 'type_scalar', name: t.value, loc };
            }
            if (VEC_ALIAS[t.value]) {
                this.eat();
                const a = VEC_ALIAS[t.value];
                return { kind: 'type_vec', n: a.n, of: a.of, loc };
            }
            if (TYPE_GENERIC_IDENTS.has(t.value)) {
                return this.parseGenericType();
            }
            // Otherwise it's a named struct/alias type.
            this.eat();
            return { kind: 'type_named', name: t.value, loc };
        }
        throw new WGSLError(`expected type, got '${t.value}'`, t.line, t.col);
    }

    parseGenericType() {
        const t = this.eat();
        const loc = { line: t.line, col: t.col };
        const name = t.value;

        if (name === 'vec2' || name === 'vec3' || name === 'vec4') {
            this.expect('punct', '<');
            const of = this.parseType();
            this.expect('punct', '>');
            return { kind: 'type_vec', n: +name.slice(3), of, loc };
        }
        if (name.startsWith('mat')) {
            this.expect('punct', '<');
            const of = this.parseType();
            this.expect('punct', '>');
            const cols = +name[3];
            const rows = +name[5];
            return { kind: 'type_mat', cols, rows, of, loc };
        }
        if (name === 'array') {
            this.expect('punct', '<');
            const of = this.parseType();
            let count = null;
            if (this.accept('punct', ',')) count = this.parseTypeArgExpr();
            this.expect('punct', '>');
            return { kind: 'type_array', of, count, loc };
        }
        if (name === 'atomic') {
            this.expect('punct', '<');
            const of = this.parseType();
            this.expect('punct', '>');
            return { kind: 'type_atomic', of, loc };
        }
        if (name === 'ptr') {
            this.expect('punct', '<');
            const addressSpace = this.expect('ident').value;
            this.expect('punct', ',');
            const of = this.parseType();
            let access = null;
            if (this.accept('punct', ',')) access = this.expect('ident').value;
            this.expect('punct', '>');
            return { kind: 'type_ptr', addressSpace, of, access, loc };
        }
        throw new WGSLError(`unknown generic type '${name}'`, t.line, t.col);
    }

    // ── Statements & blocks ────────────────────────────────────────
    parseBlock() {
        const loc = this.loc();
        this.expect('punct', '{');
        const stmts = [];
        while (!this.check('punct', '}')) {
            const s = this.parseStmt();
            if (s) stmts.push(s);
        }
        this.expect('punct', '}');
        return { kind: 'block', stmts, loc };
    }

    parseStmt() {
        const t = this.peek();
        if (!t) throw new WGSLError('expected statement', 0, 0);

        // Block
        if (t.kind === 'punct' && t.value === '{') return this.parseBlock();
        // Stray semicolon
        if (t.kind === 'punct' && t.value === ';') { this.eat(); return null; }

        if (t.kind === 'kw') {
            switch (t.value) {
                case 'let':      return this.parseLet();
                case 'var':      return this.parseLocalVar();
                case 'const':    return this.parseConst([]);
                case 'if':       return this.parseIf();
                case 'for':      return this.parseFor();
                case 'while':    return this.parseWhile();
                case 'loop':     return this.parseLoop();
                case 'switch':   return this.parseSwitch();
                case 'return':   return this.parseReturn();
                case 'break':    this.eat(); this.expect('punct', ';');
                                 return { kind: 'break',    loc: this.loc() };
                case 'continue': this.eat(); this.expect('punct', ';');
                                 return { kind: 'continue', loc: this.loc() };
                case 'discard':  this.eat(); this.expect('punct', ';');
                                 return { kind: 'discard',  loc: this.loc() };
            }
        }

        // Either expression-statement, assignment, or compound assignment.
        // Parse the LHS as an expression, then peek for an assignment operator.
        const loc = this.loc();
        const lhs = this.parseExpr();

        const op = this.peek();
        if (op && op.kind === 'punct') {
            if (op.value === '=') {
                this.eat();
                const value = this.parseExpr();
                this.expect('punct', ';');
                return { kind: 'assign', op: '=', target: lhs, value, loc };
            }
            if (COMPOUND_OPS.has(op.value)) {
                this.eat();
                const value = this.parseExpr();
                this.expect('punct', ';');
                return { kind: 'compound', op: op.value, target: lhs, value, loc };
            }
            if (op.value === '++' || op.value === '--') {
                this.eat();
                this.expect('punct', ';');
                return { kind: 'postfix', op: op.value, target: lhs, loc };
            }
        }

        this.expect('punct', ';');
        return { kind: 'expr_stmt', expr: lhs, loc };
    }

    parseLet() {
        const loc = this.loc();
        this.expect('kw', 'let');
        const name = this.expect('ident').value;
        let type = null;
        if (this.accept('punct', ':')) type = this.parseType();
        this.expect('punct', '=');
        const value = this.parseExpr();
        this.expect('punct', ';');
        return { kind: 'let', name, type, value, loc };
    }

    parseLocalVar() {
        const loc = this.loc();
        this.expect('kw', 'var');
        // Local `var` doesn't normally have an address-space qualifier
        // (function private is implicit), but we accept `<...>` for symmetry.
        let addressSpace = null;
        if (this.accept('punct', '<')) {
            addressSpace = this.expect('ident').value;
            this.expect('punct', '>');
        }
        const name = this.expect('ident').value;
        let type = null;
        if (this.accept('punct', ':')) type = this.parseType();
        let value = null;
        if (this.accept('punct', '=')) value = this.parseExpr();
        this.expect('punct', ';');
        return { kind: 'var', name, type, value, addressSpace, loc };
    }

    parseIf() {
        const loc = this.loc();
        this.expect('kw', 'if');
        // WGSL allows both `if (cond)` and `if cond` since 1.0; we
        // tolerate either by treating the leading `(` as optional.
        const cond = this.parseParenOrExpr();
        const then = this.parseBlock();
        let elseBranch = null;
        if (this.accept('kw', 'else')) {
            if (this.check('kw', 'if')) elseBranch = this.parseIf();
            else                         elseBranch = this.parseBlock();
        }
        return { kind: 'if', cond, then, else: elseBranch, loc };
    }

    parseFor() {
        const loc = this.loc();
        this.expect('kw', 'for');
        this.expect('punct', '(');
        let init = null;
        if (!this.check('punct', ';')) init = this.parseForInit();
        else                            this.eat();
        let cond = null;
        if (!this.check('punct', ';')) cond = this.parseExpr();
        this.expect('punct', ';');
        let update = null;
        if (!this.check('punct', ')')) update = this.parseForUpdate();
        this.expect('punct', ')');
        const body = this.parseBlock();
        return { kind: 'for', init, cond, update, body, loc };
    }

    parseForInit() {
        // `let i = 0` / `var i = 0` / `i = 0` / `f()`
        if (this.check('kw', 'let')) {
            // Eat ';' is inside parseLet — but for-init has no trailing ';'.
            // Inline a minimal version that doesn't consume ';'.
            const loc = this.loc();
            this.eat();
            const name = this.expect('ident').value;
            let type = null;
            if (this.accept('punct', ':')) type = this.parseType();
            this.expect('punct', '=');
            const value = this.parseExpr();
            this.expect('punct', ';');
            return { kind: 'let', name, type, value, loc };
        }
        if (this.check('kw', 'var')) {
            const loc = this.loc();
            this.eat();
            const name = this.expect('ident').value;
            let type = null;
            if (this.accept('punct', ':')) type = this.parseType();
            let value = null;
            if (this.accept('punct', '=')) value = this.parseExpr();
            this.expect('punct', ';');
            return { kind: 'var', name, type, value, addressSpace: null, loc };
        }
        // Bare expr/assignment
        const loc = this.loc();
        const lhs = this.parseExpr();
        const op = this.peek();
        if (op && op.kind === 'punct' && op.value === '=') {
            this.eat();
            const value = this.parseExpr();
            this.expect('punct', ';');
            return { kind: 'assign', op: '=', target: lhs, value, loc };
        }
        if (op && op.kind === 'punct' && COMPOUND_OPS.has(op.value)) {
            this.eat();
            const value = this.parseExpr();
            this.expect('punct', ';');
            return { kind: 'compound', op: op.value, target: lhs, value, loc };
        }
        this.expect('punct', ';');
        return { kind: 'expr_stmt', expr: lhs, loc };
    }

    parseForUpdate() {
        // Similar to init but no trailing ';' allowed.
        const loc = this.loc();
        const lhs = this.parseExpr();
        const op = this.peek();
        if (op && op.kind === 'punct') {
            if (op.value === '=') {
                this.eat();
                const value = this.parseExpr();
                return { kind: 'assign', op: '=', target: lhs, value, loc };
            }
            if (COMPOUND_OPS.has(op.value)) {
                this.eat();
                const value = this.parseExpr();
                return { kind: 'compound', op: op.value, target: lhs, value, loc };
            }
            if (op.value === '++' || op.value === '--') {
                this.eat();
                return { kind: 'postfix', op: op.value, target: lhs, loc };
            }
        }
        return { kind: 'expr_stmt', expr: lhs, loc };
    }

    parseWhile() {
        const loc = this.loc();
        this.expect('kw', 'while');
        const cond = this.parseParenOrExpr();
        const body = this.parseBlock();
        return { kind: 'while', cond, body, loc };
    }

    parseLoop() {
        // `loop { ... continuing { ... } }`
        // Walking-skeleton coverage: body parses; `continuing` block is
        // captured but its semantics aren't lowered yet.
        const loc = this.loc();
        this.expect('kw', 'loop');
        this.expect('punct', '{');
        const stmts = [];
        let continuing = null;
        while (!this.check('punct', '}')) {
            if (this.check('kw', 'continuing')) {
                this.eat();
                continuing = this.parseBlock();
                continue;
            }
            const s = this.parseStmt();
            if (s) stmts.push(s);
        }
        this.expect('punct', '}');
        const body = { kind: 'block', stmts, loc };
        return { kind: 'loop', body, continuing, loc };
    }

    parseSwitch() {
        const loc = this.loc();
        this.expect('kw', 'switch');
        const selector = this.parseParenOrExpr();
        this.expect('punct', '{');
        const cases = [];
        while (!this.check('punct', '}')) {
            // Cases may be prefixed with attrs (rare but legal).
            this.parseAttrs();
            if (this.accept('kw', 'case')) {
                const values = [this.parseExpr()];
                while (this.accept('punct', ',')) {
                    if (this.check('kw', 'default')) {
                        // `case 0, default:` form — eat 'default' as a sentinel.
                        this.eat();
                        values.push({ kind: 'default', loc: this.loc() });
                    } else if (this.check('punct', ':') || this.check('punct', '{')) {
                        break; // trailing comma
                    } else {
                        values.push(this.parseExpr());
                    }
                }
                this.accept('punct', ':'); // colon is optional in WGSL
                const body = this.parseBlock();
                cases.push({ kind: 'case', values, body, loc });
            } else if (this.accept('kw', 'default')) {
                this.accept('punct', ':');
                const body = this.parseBlock();
                cases.push({ kind: 'case', values: 'default', body, loc });
            } else {
                const t = this.peek();
                throw new WGSLError(
                    `expected 'case' or 'default' in switch, got '${t?.value}'`,
                    t?.line ?? 0, t?.col ?? 0,
                );
            }
        }
        this.expect('punct', '}');
        return { kind: 'switch', selector, cases, loc };
    }

    parseReturn() {
        const loc = this.loc();
        this.expect('kw', 'return');
        let value = null;
        if (!this.check('punct', ';')) value = this.parseExpr();
        this.expect('punct', ';');
        return { kind: 'return', value, loc };
    }

    /** `(cond)` or bare `cond` — used for if/while conditions. */
    parseParenOrExpr() {
        if (this.accept('punct', '(')) {
            const e = this.parseExpr();
            this.expect('punct', ')');
            return e;
        }
        return this.parseExpr();
    }

    // ── Expressions (Pratt precedence-climbing) ────────────────────
    parseExpr()        { return this.parseExprAt(0); }

    parseExprAt(minPrec) {
        let lhs = this.parseUnary();
        for (;;) {
            const t = this.peek();
            if (!t || t.kind !== 'punct') break;
            // Inside type-arg context, don't consume relational/shift
            // operators — they're closing brackets.
            if (this.noRelDepth > 0 && (
                    t.value === '<' || t.value === '>' ||
                    t.value === '<=' || t.value === '>=' ||
                    t.value === '<<' || t.value === '>>')) break;
            const prec = BIN_PREC[t.value];
            if (prec == null || prec < minPrec) break;
            const op = this.eat().value;
            const rhs = this.parseExprAt(prec + 1);
            lhs = { kind: 'bin', op, lhs, rhs, loc: lhs.loc };
        }
        return lhs;
    }

    /** Parse an expression that lives inside `<...>` brackets. */
    parseTypeArgExpr() {
        this.noRelDepth++;
        try { return this.parseExpr(); }
        finally { this.noRelDepth--; }
    }

    parseUnary() {
        const t = this.peek();
        if (t && t.kind === 'punct' && ('-!~*&'.indexOf(t.value) >= 0)
                && t.value.length === 1) {
            const op = this.eat().value;
            const value = this.parseUnary();
            return { kind: 'una', op, value, loc: { line: t.line, col: t.col } };
        }
        return this.parsePostfix(this.parsePrimary());
    }

    parsePostfix(expr) {
        for (;;) {
            const t = this.peek();
            if (!t || t.kind !== 'punct') break;
            if (t.value === '.') {
                this.eat();
                const name = this.expect('ident').value;
                expr = { kind: 'member', value: expr, name, loc: expr.loc };
            } else if (t.value === '[') {
                this.eat();
                const idx = this.parseExpr();
                this.expect('punct', ']');
                expr = { kind: 'index', value: expr, index: idx, loc: expr.loc };
            } else {
                break;
            }
        }
        return expr;
    }

    parsePrimary() {
        const t = this.peek();
        if (!t) throw new WGSLError('unexpected EOF in expression', 0, 0);
        const loc = { line: t.line, col: t.col };

        // ── Literals ───────────────────────────────────────────────
        if (t.kind === 'num') {
            this.eat();
            return {
                kind: 'lit', raw: t.value, isFloat: !!t.isFloat,
                suffix: t.suffix, intBase: t.intBase, loc,
            };
        }
        if (t.kind === 'kw' && (t.value === 'true' || t.value === 'false')) {
            this.eat();
            return { kind: 'lit', raw: t.value, isFloat: false, loc };
        }

        // ── Parenthesized ──────────────────────────────────────────
        if (t.kind === 'punct' && t.value === '(') {
            this.eat();
            const e = this.parseExpr();
            this.expect('punct', ')');
            return { kind: 'paren', value: e, loc };
        }

        // ── Bitcast<T>(x), or generic type constructor like vec4<f32>(x,y,z,w),
        //    or array<T,N>(...), or a plain function call f(...) on an ident.
        if (t.kind === 'ident') {
            const name = this.eat().value;

            // type-parameterized callee: vec4<f32>(...), bitcast<u32>(x),
            // array<vec4<f32>, 2>(p0, p1), etc.
            let typeArgs = null;
            // Only consume `<` if this ident is a known generic. Otherwise
            // `a<b` could be a comparison — defer to the parser's normal flow.
            if ((TYPE_GENERIC_IDENTS.has(name) || name === 'bitcast')
                    && this.check('punct', '<')) {
                this.eat();
                if (name === 'array') {
                    // array<T> or array<T, N> where N is an expression.
                    typeArgs = [this.parseType()];
                    if (this.accept('punct', ',')) typeArgs.push(this.parseTypeArgExpr());
                } else {
                    typeArgs = [this.parseType()];
                    while (this.accept('punct', ',')) typeArgs.push(this.parseType());
                }
                this.expect('punct', '>');
            }

            // Constructor / call args
            if (this.accept('punct', '(')) {
                const args = [];
                if (!this.check('punct', ')')) {
                    args.push(this.parseExpr());
                    while (this.accept('punct', ',')) {
                        if (this.check('punct', ')')) break; // trailing comma
                        args.push(this.parseExpr());
                    }
                }
                this.expect('punct', ')');
                return { kind: 'call', callee: name, typeArgs, args, loc };
            }

            return { kind: 'ident', name, loc };
        }

        // Some scalar idents (`f32(x)`) live in keyword-set in other langs,
        // but in our tokenizer they're plain idents — handled above.

        throw new WGSLError(`unexpected '${t.value}' in expression`, t.line, t.col);
    }
}

//#endregion


//#region 3. RESOLVER  ──────────────────────────────────────────────
//
// Phase between parse and emit. Produces:
//   - a shared module catalog (the same Maps the emitter walks)
//   - a SymbolTable: typed views of every declaration site, plus a
//     `typeFromAst` that turns parser type-nodes into Type ADT values.
//
// The expression resolver (phase 2 of the type-resolver arc) will
// build on this to annotate Expr nodes with .resolvedType so emit
// can choose inline scalar/vec paths instead of polymorphic rt.*
// dispatch. For now this region delivers the spine: types + catalog
// + declaration-site typing.

/** Type ADT — runtime representation of WGSL types.
 *
 *  Shapes (all plain objects, .kind discriminated):
 *    scalar : { kind:'scalar', name:'f32'|'i32'|'u32'|'f16'|'bool', abstract?:true }
 *    vec    : { kind:'vec', n:2|3|4, of:Scalar }
 *    mat    : { kind:'mat', cols, rows, of:Scalar }
 *    array  : { kind:'array', of:Type, count:number|null }   // null = runtime-sized
 *    atomic : { kind:'atomic', of:Scalar }
 *    ptr    : { kind:'ptr', addressSpace, of:Type, access }
 *    struct : { kind:'struct', name, fields:Map<name,Type>, fieldOrder:string[] }
 *    void   : { kind:'void' }
 *
 *  Scalar singletons live on `T` so equality checks can be reference-fast
 *  for the common case. Composite types are fresh objects per call site;
 *  typeEqual() handles structural comparison when reference equality fails. */
export const T = Object.freeze({
    f32:  Object.freeze({ kind: 'scalar', name: 'f32' }),
    i32:  Object.freeze({ kind: 'scalar', name: 'i32' }),
    u32:  Object.freeze({ kind: 'scalar', name: 'u32' }),
    f16:  Object.freeze({ kind: 'scalar', name: 'f16' }),
    bool: Object.freeze({ kind: 'scalar', name: 'bool' }),
    void: Object.freeze({ kind: 'void' }),
    // Abstract numeric types — WGSL spec'd as context-coerced. We resolve
    // greedily to the concrete sibling at use sites; flag preserved for
    // any future widening logic that needs to know "this was abstract".
    absInt:   Object.freeze({ kind: 'scalar', name: 'i32', abstract: true }),
    absFloat: Object.freeze({ kind: 'scalar', name: 'f32', abstract: true }),
});

export function tVec(n, of)              { return { kind: 'vec', n, of }; }
export function tMat(cols, rows, of)     { return { kind: 'mat', cols, rows, of }; }
export function tArray(of, count = null) { return { kind: 'array', of, count }; }
export function tAtomic(of)              { return { kind: 'atomic', of }; }
export function tPtr(addressSpace, of, access = null) {
    return { kind: 'ptr', addressSpace, of, access };
}
export function tStruct(name, fields = new Map(), fieldOrder = []) {
    return { kind: 'struct', name, fields, fieldOrder };
}

/** Structural equality on Type values. */
export function typeEqual(a, b) {
    if (a === b)                          return true;
    if (!a || !b || a.kind !== b.kind)    return false;
    switch (a.kind) {
        case 'scalar': return a.name === b.name;
        case 'vec':    return a.n === b.n && typeEqual(a.of, b.of);
        case 'mat':    return a.cols === b.cols && a.rows === b.rows && typeEqual(a.of, b.of);
        case 'array':  return a.count === b.count && typeEqual(a.of, b.of);
        case 'atomic': return typeEqual(a.of, b.of);
        case 'ptr':    return a.addressSpace === b.addressSpace && typeEqual(a.of, b.of);
        case 'struct': return a.name === b.name;
        case 'void':   return true;
        default:       return false;
    }
}

/** Human-readable type string, used by error messages and diagnostics. */
export function typeToString(t) {
    if (!t) return '<unresolved>';
    switch (t.kind) {
        case 'scalar': return t.name;
        case 'vec':    return `vec${t.n}<${typeToString(t.of)}>`;
        case 'mat':    return `mat${t.cols}x${t.rows}<${typeToString(t.of)}>`;
        case 'array':  return t.count != null
                              ? `array<${typeToString(t.of)}, ${t.count}>`
                              : `array<${typeToString(t.of)}>`;
        case 'atomic': return `atomic<${typeToString(t.of)}>`;
        case 'ptr':    return `ptr<${t.addressSpace}, ${typeToString(t.of)}>`;
        case 'struct': return t.name;
        case 'void':   return 'void';
        default:       return '<unknown>';
    }
}

/** Tiny constant-folder for `array<T, N>` count expressions. Kept
 *  narrow on purpose — handles integer literals + simple negation.
 *  Anything more elaborate falls back to null (runtime-sized array). */
function constFoldInt(expr) {
    if (!expr) return null;
    if (expr.kind === 'lit' && !expr.isFloat) {
        const n = parseInt(expr.raw, 10);
        return Number.isFinite(n) ? n : null;
    }
    if (expr.kind === 'paren') return constFoldInt(expr.value);
    if (expr.kind === 'una' && expr.op === '-') {
        const v = constFoldInt(expr.value);
        return v == null ? null : -v;
    }
    return null;
}

/** Single pass over ast.items that buckets top-level declarations.
 *  Consumed by both the resolver and the emitter so the walk happens
 *  exactly once. Aliases are preserved distinctly from structs so the
 *  resolver can substitute them when typing expressions. */
export function catalogModule(ast) {
    const c = {
        structs:       new Map(),  // name → Struct AST
        constants:     new Map(),  // name → Const AST
        bindings:      new Map(),  // name → GlobalVar AST (uniform/storage)
        workgroupVars: new Map(),  // name → GlobalVar AST (var<workgroup>)
        privateVars:   new Map(),  // name → GlobalVar AST (var<private>)
        fns:           new Map(),  // name → Fn AST
        aliases:       new Map(),  // name → Alias AST
        entryPoints:   [],         // Fn[] with @compute attr
    };
    for (const item of ast.items) {
        switch (item.kind) {
            case 'struct': c.structs.set(item.name, item);   break;
            case 'const':  c.constants.set(item.name, item); break;
            case 'alias':  c.aliases.set(item.name, item);   break;
            case 'global_var':
                if (item.addressSpace === 'workgroup')      c.workgroupVars.set(item.name, item);
                else if (item.addressSpace === 'private')   c.privateVars.set(item.name, item);
                else                                         c.bindings.set(item.name, item);
                break;
            case 'fn':
                c.fns.set(item.name, item);
                if (item.attrs.some(a => a.name === 'compute')) c.entryPoints.push(item);
                break;
        }
    }
    return c;
}

/** Module-level symbol table. Built once per AST and queried throughout
 *  resolution and emission. Holds the catalog plus type-resolved views
 *  of every declaration site:
 *    - structTypes:        struct name → Type ('struct' kind)
 *    - constTypes:         const name → Type (only when declared; inferred
 *                          consts are filled in by the expression resolver)
 *    - bindingTypes:       binding name → Type
 *    - workgroupVarTypes:  wg var name → Type
 *    - privateVarTypes:    priv var name → Type
 *    - fnSignatures:       fn name → { params:[{name,type}], returnType }
 *
 *  Aliases are resolved on-demand via resolveNamed(); cycles are guarded.
 *  Struct shells and fn signatures are built in dependency-friendly order
 *  (shells first, then bodies) so cross-references resolve regardless of
 *  declaration order in the source. */
export class SymbolTable {
    constructor(catalog) {
        this.catalog           = catalog;
        this.structTypes       = new Map();
        this.constTypes        = new Map();
        this.bindingTypes      = new Map();
        this.workgroupVarTypes = new Map();
        this.privateVarTypes   = new Map();
        this.fnSignatures      = new Map();
        this._build();
    }

    _build() {
        // Pass 1: struct shells, so fields in pass 2 can reference any
        // other struct regardless of declaration order.
        for (const [name] of this.catalog.structs) {
            this.structTypes.set(name, tStruct(name));
        }
        // Pass 2: struct fields. Mutates the shell objects in place.
        for (const [name, st] of this.catalog.structs) {
            const stype = this.structTypes.get(name);
            for (const f of st.fields) {
                stype.fields.set(f.name, this.typeFromAst(f.type));
                stype.fieldOrder.push(f.name);
            }
        }
        // Pass 3: bindings + wg + priv vars.
        for (const [name, g] of this.catalog.bindings)
            this.bindingTypes.set(name, this.typeFromAst(g.type));
        for (const [name, g] of this.catalog.workgroupVars)
            this.workgroupVarTypes.set(name, this.typeFromAst(g.type));
        for (const [name, g] of this.catalog.privateVars)
            this.privateVarTypes.set(name, this.typeFromAst(g.type));
        // Pass 4: declared consts. Inferred (no type annotation) consts
        // are typed by the expression resolver when it walks `c.value`.
        for (const [name, c] of this.catalog.constants) {
            if (c.type) this.constTypes.set(name, this.typeFromAst(c.type));
        }
        // Pass 5: fn signatures.
        for (const [name, fn] of this.catalog.fns) {
            const params = fn.params.map(p => ({
                name: p.name,
                type: this.typeFromAst(p.type),
            }));
            const returnType = fn.returnType ? this.typeFromAst(fn.returnType) : T.void;
            this.fnSignatures.set(name, { params, returnType });
        }
    }

    /** Convert a parser type-node into a Type ADT value. Returns null for
     *  any unresolvable named reference — callers tolerate partial info
     *  and the emitter falls back to its polymorphic codepath. */
    typeFromAst(node, seen = null) {
        if (!node) return null;
        switch (node.kind) {
            case 'type_scalar': return T[node.name] ?? null;
            case 'type_vec':    return tVec(node.n, this.typeFromAst(node.of, seen));
            case 'type_mat':    return tMat(node.cols, node.rows, this.typeFromAst(node.of, seen));
            case 'type_array': {
                const count = node.count != null ? constFoldInt(node.count) : null;
                return tArray(this.typeFromAst(node.of, seen), count);
            }
            case 'type_atomic': return tAtomic(this.typeFromAst(node.of, seen));
            case 'type_ptr':    return tPtr(node.addressSpace, this.typeFromAst(node.of, seen), node.access);
            case 'type_named':  return this.resolveNamed(node.name, seen);
            default: return null;
        }
    }

    /** Resolve a named type — built-in scalar, predeclared vec/mat shortform,
     *  struct, or alias chain. Cycle guard runs through `seen`; only
     *  allocated when an alias actually chains, so the common path stays
     *  allocation-free. */
    resolveNamed(name, seen = null) {
        if (T[name])                       return T[name];
        if (PREDECLARED_TYPES[name])       return PREDECLARED_TYPES[name];
        if (this.structTypes.has(name))    return this.structTypes.get(name);
        if (this.catalog.aliases.has(name)) {
            const guard = seen ?? new Set();
            if (guard.has(name)) return null;   // cycle
            guard.add(name);
            const aliasAst = this.catalog.aliases.get(name);
            return this.typeFromAst(aliasAst.type, guard);
        }
        return null;
    }
}

/** Predeclared WGSL type aliases — `vec3f` ≡ `vec3<f32>`, `mat4x4h` ≡
 *  `mat4x4<f16>`, etc. The parser pre-bakes the vec shortforms into
 *  type_vec nodes directly (see VEC_ALIAS), but the mat shortforms fall
 *  through to type_named and the resolver expands them here. Listed
 *  together so future shortforms have an obvious home. */
const PREDECLARED_TYPES = (() => {
    const out = {};
    const suf = { f: T.f32, u: T.u32, i: T.i32, h: T.f16 };
    for (const n of [2, 3, 4])
        for (const [s, sc] of Object.entries(suf))
            out[`vec${n}${s}`] = tVec(n, sc);
    for (const c of [2, 3, 4])
        for (const r of [2, 3, 4])
            for (const [s, sc] of Object.entries(suf))
                out[`mat${c}x${r}${s}`] = tMat(c, r, sc);
    return Object.freeze(out);
})();

/** Element-wise math intrinsics: result type follows the first arg
 *  (matches the WGSL spec — `min(vec3<f32>, vec3<f32>)` is `vec3<f32>`,
 *  `clamp(f32, f32, f32)` is `f32`, etc.). The same set drives the
 *  emitter's `rt.*` dispatch today; sharing it keeps the two in lockstep. */
const RESOLVER_POLY_FN = new Set([
    'max', 'min', 'abs', 'sqrt', 'sign', 'floor', 'ceil', 'round',
    'fract', 'trunc', 'exp', 'log', 'exp2', 'log2', 'pow', 'sin', 'cos',
    'tan', 'atan', 'atan2', 'clamp', 'mix', 'step', 'smoothstep',
    'inverseSqrt', 'asin', 'acos', 'sinh', 'cosh', 'tanh',
    'degrees', 'radians', 'saturate',
]);

/** Comparison/logical operators that always produce bool (scalar inputs)
 *  or vec<bool> (vec inputs of matching shape). */
const BOOL_RESULT_BIN = new Set(['<', '>', '<=', '>=', '==', '!=', '&&', '||']);

/** Concretize an abstract scalar to its plain sibling. Identity for
 *  already-concrete types. Used at use sites where context demands a
 *  definite type (assignment, function arg, return). */
function concretize(t) {
    if (t?.kind === 'scalar' && t.abstract) return T[t.name];
    return t;
}

/** Expression / statement resolver. Walks every Expr node in every Fn
 *  body and annotates `expr.resolvedType` with the result Type. Also
 *  fills in inferred-type module-level consts.
 *
 *  Design notes:
 *    - Failure is silent. If the resolver can't type a subexpression
 *      (uncommon construct, missing intrinsic, unresolvable named type),
 *      `.resolvedType` is set to `null` and the emitter falls back to its
 *      polymorphic `rt.*` codepath. This keeps the 100% corpus-pass
 *      property of the compile phase as a hard invariant.
 *    - Scopes are a stack of `Map<name, Type>`. Locals live in the
 *      topmost frame; lookup walks down through enclosing scopes, then
 *      module-level bindings/wg/priv/consts. Function refs are NOT
 *      lookupable as values — they're handled inline in `exprCall`.
 *    - Builder functions for vec/mat constructors handle both the
 *      typed form `vec3<f32>(...)` (via `e.typeArgs`) and the inferred
 *      form `vec3(...)` (element type from first arg). */
class ExprResolver {
    constructor(sym) {
        this.sym    = sym;
        this.scopes = [];
    }

    enter() { this.scopes.push(new Map()); }
    exit()  { this.scopes.pop(); }
    declare(name, type) {
        if (this.scopes.length) this.scopes[this.scopes.length - 1].set(name, type);
    }
    lookup(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const f = this.scopes[i];
            if (f.has(name)) return f.get(name);
        }
        if (this.sym.bindingTypes.has(name))      return this.sym.bindingTypes.get(name);
        if (this.sym.workgroupVarTypes.has(name)) return this.sym.workgroupVarTypes.get(name);
        if (this.sym.privateVarTypes.has(name))   return this.sym.privateVarTypes.get(name);
        if (this.sym.constTypes.has(name))        return this.sym.constTypes.get(name);
        return null;
    }

    /** Resolve an expression, annotate `e.resolvedType`, return the Type. */
    expr(e) {
        if (!e) return null;
        let t = null;
        switch (e.kind) {
            case 'lit':    t = e.isFloat ? T.absFloat : T.absInt; break;
            case 'paren':  t = this.expr(e.value); break;
            case 'ident':  t = this.lookup(e.name); break;
            case 'bin':    t = this.exprBin(e);    break;
            case 'una':    t = this.exprUna(e);    break;
            case 'call':   t = this.exprCall(e);   break;
            case 'index':  t = this.exprIndex(e);  break;
            case 'member': t = this.exprMember(e); break;
        }
        e.resolvedType = t;
        return t;
    }

    exprBin(e) {
        const lt = this.expr(e.lhs);
        const rt = this.expr(e.rhs);
        if (BOOL_RESULT_BIN.has(e.op)) {
            // Vec relational ops return vec<bool> of the matching shape.
            const vec = lt?.kind === 'vec' ? lt : (rt?.kind === 'vec' ? rt : null);
            return vec ? tVec(vec.n, T.bool) : T.bool;
        }
        // Bitwise/shift: same shape as operand (typically u32/i32 or vec thereof).
        // Arithmetic: scalar↔scalar (concrete wins over abstract), scalar↔vec
        // broadcasts to vec, vec↔vec of matching shape stays vec.
        if (lt?.kind === 'vec' && rt?.kind === 'vec' && lt.n === rt.n) return lt;
        if (lt?.kind === 'vec' && rt?.kind === 'scalar') return lt;
        if (lt?.kind === 'scalar' && rt?.kind === 'vec') return rt;
        if (lt?.kind === 'scalar' && rt?.kind === 'scalar') {
            // Prefer the concrete side; if both are concrete and differ,
            // pick the LHS (WGSL would have errored at parse, so this is
            // the "best effort" path for a malformed tree).
            const lc = concretize(lt), rc = concretize(rt);
            if (lt.abstract && !rt.abstract) return rc;
            if (rt.abstract && !lt.abstract) return lc;
            return lc;
        }
        // Mat ops or mixed mat/vec — common cases handled by emitter's
        // current polymorphic path; leave unresolved for now.
        return lt ?? rt;
    }

    exprUna(e) {
        if (e.op === '&' || e.op === '*') {
            // Pointer take/deref — model both as pass-through; the value
            // we return represents the underlying storage's type.
            return this.expr(e.value);
        }
        const t = this.expr(e.value);
        if (e.op === '!') return t?.kind === 'vec' ? tVec(t.n, T.bool) : T.bool;
        return t;   // unary +/- preserve type
    }

    exprMember(e) {
        const ct = this.expr(e.value);
        if (!ct) return null;
        if (ct.kind === 'vec') {
            // Swizzle: one or more chars from {xyzw, rgba}.
            const s = e.name;
            if (s.length >= 1 && s.length <= 4 && /^[xyzwrgba]+$/.test(s)) {
                return s.length === 1 ? ct.of : tVec(s.length, ct.of);
            }
            return null;
        }
        if (ct.kind === 'struct') return ct.fields.get(e.name) ?? null;
        return null;
    }

    exprIndex(e) {
        const ct = this.expr(e.value);
        this.expr(e.index);
        if (!ct) return null;
        if (ct.kind === 'array') return ct.of;
        if (ct.kind === 'vec')   return ct.of;
        if (ct.kind === 'mat')   return tVec(ct.rows, ct.of);
        return null;
    }

    exprCall(e) {
        // Always resolve args first so they get annotated even if we
        // can't type the call itself.
        for (const a of e.args) this.expr(a);
        const name = e.callee;

        // Scalar constructor/cast: `f32(x)`, `i32(x)`, etc.
        if (T[name]) return T[name];

        // Predeclared vec/mat shortform constructor: `vec3f(...)`, `mat4x4h(...)`.
        if (PREDECLARED_TYPES[name]) return PREDECLARED_TYPES[name];

        // Bare vec constructor: `vec3<f32>(...)` or inferred `vec3(...)`.
        if (name === 'vec2' || name === 'vec3' || name === 'vec4') {
            const n = +name.slice(3);
            const elem = this._constructorElemType(e);
            return elem?.kind === 'scalar' ? tVec(n, elem) : null;
        }
        // Bare mat constructor: `mat3x3<f32>(...)`.
        if (/^mat[234]x[234]$/.test(name)) {
            const cols = +name[3], rows = +name[5];
            const elem = e.typeArgs?.[0] ? this.sym.typeFromAst(e.typeArgs[0]) : null;
            return elem?.kind === 'scalar' ? tMat(cols, rows, elem) : null;
        }
        // Array constructor: `array<f32, 4>(...)` or `array(...)`.
        if (name === 'array') {
            const of = e.typeArgs?.[0]
                ? this.sym.typeFromAst(e.typeArgs[0])
                : (e.args[0]?.resolvedType ?? null);
            return tArray(of, e.args.length || null);
        }

        // Element-wise math: result follows first arg.
        if (RESOLVER_POLY_FN.has(name)) return concretize(e.args[0]?.resolvedType) ?? null;

        // Specific intrinsics with non-trivial result types.
        switch (name) {
            case 'dot':
            case 'length':
            case 'distance':   return (e.args[0]?.resolvedType?.of) ?? null;
            case 'cross':
            case 'normalize':
            case 'reflect':
            case 'refract':
            case 'faceForward': return e.args[0]?.resolvedType ?? null;
            case 'all':
            case 'any':         return T.bool;
            case 'select':      return e.args[1]?.resolvedType ?? e.args[0]?.resolvedType ?? null;
            case 'dpdx': case 'dpdy': case 'fwidth':
            case 'dpdxFine': case 'dpdyFine': case 'fwidthFine':
            case 'dpdxCoarse': case 'dpdyCoarse': case 'fwidthCoarse':
                return e.args[0]?.resolvedType ?? null;
            case 'transpose': {
                const m = e.args[0]?.resolvedType;
                return m?.kind === 'mat' ? tMat(m.rows, m.cols, m.of) : null;
            }
            case 'determinant': {
                const m = e.args[0]?.resolvedType;
                return m?.kind === 'mat' ? m.of : null;
            }
            case 'countOneBits': case 'reverseBits':
            case 'countLeadingZeros': case 'countTrailingZeros':
            case 'firstLeadingBit': case 'firstTrailingBit':
                return e.args[0]?.resolvedType ?? null;
            case 'extractBits': case 'insertBits':
                return e.args[0]?.resolvedType ?? null;
            case 'bitcast':
                return e.typeArgs?.[0] ? this.sym.typeFromAst(e.typeArgs[0]) : null;
            case 'atomicLoad': case 'atomicAdd': case 'atomicSub':
            case 'atomicMax': case 'atomicMin': case 'atomicAnd':
            case 'atomicOr':  case 'atomicXor': case 'atomicExchange':
            case 'atomicCompareExchangeWeak': {
                // arg0 is a `&` to an atomic<T>; in our model `&x` returns x's
                // type, so we unwrap one atomic<> layer to get T.
                const at = e.args[0]?.resolvedType;
                if (at?.kind === 'atomic') return at.of;
                return null;
            }
            case 'workgroupBarrier': case 'storageBarrier': case 'textureBarrier':
                return T.void;
            case 'arrayLength':
                return T.u32;
            case 'unpack2x16float': return tVec(2, T.f32);
            case 'unpack4x8snorm':
            case 'unpack4x8unorm':  return tVec(4, T.f32);
            case 'pack2x16float':
            case 'pack4x8snorm':
            case 'pack4x8unorm':    return T.u32;
        }

        // User fn.
        const sig = this.sym.fnSignatures.get(name);
        if (sig) return sig.returnType;
        return null;
    }

    /** Pick the element scalar type for a `vecN(...)` constructor call.
     *  Explicit `<T>` wins; otherwise infer from the first arg (which may
     *  itself be a vec — in that case use its element type, matching the
     *  WGSL "splat or copy" rules). */
    _constructorElemType(e) {
        if (e.typeArgs?.[0]) return this.sym.typeFromAst(e.typeArgs[0]);
        const a = e.args[0]?.resolvedType;
        if (a?.kind === 'vec') return a.of;
        if (a?.kind === 'scalar') return concretize(a);
        return null;
    }

    /** Statement walker — extends scope on `let`/`var`/`const`, recurses
     *  into nested blocks. Drives `expr()` over every expression in the
     *  tree so all Expr nodes get `.resolvedType` set (or left null). */
    stmt(s) {
        if (!s) return;
        switch (s.kind) {
            case 'let':
            case 'var':
            case 'const': {
                let t = s.type ? this.sym.typeFromAst(s.type) : null;
                if (s.value != null) {
                    const vt = this.expr(s.value);
                    if (!t) t = concretize(vt);
                }
                this.declare(s.name, t);
                break;
            }
            case 'expr_stmt': this.expr(s.expr); break;
            case 'assign':    this.expr(s.target); this.expr(s.value); break;
            case 'compound':  this.expr(s.target); this.expr(s.value); break;
            case 'postfix':   this.expr(s.target); break;
            case 'return':    if (s.value) this.expr(s.value); break;
            case 'if':
                this.expr(s.cond);
                this.enter();
                for (const sub of s.then.stmts) this.stmt(sub);
                this.exit();
                if (s.else) {
                    this.enter();
                    if (s.else.kind === 'block') {
                        for (const sub of s.else.stmts) this.stmt(sub);
                    } else {
                        this.stmt(s.else);   // chained else-if
                    }
                    this.exit();
                }
                break;
            case 'for':
                this.enter();
                if (s.init)   this.stmt(s.init);
                if (s.cond)   this.expr(s.cond);
                if (s.update) this.stmt(s.update);
                for (const sub of s.body.stmts) this.stmt(sub);
                this.exit();
                break;
            case 'while':
                this.enter();
                if (s.cond) this.expr(s.cond);
                for (const sub of (s.body?.stmts ?? [])) this.stmt(sub);
                this.exit();
                break;
            case 'loop':
                this.enter();
                for (const sub of (s.body?.stmts ?? [])) this.stmt(sub);
                if (s.continuing) {
                    for (const sub of (s.continuing.stmts ?? [])) this.stmt(sub);
                }
                this.exit();
                break;
            case 'block':
                this.enter();
                for (const sub of s.stmts) this.stmt(sub);
                this.exit();
                break;
            case 'switch':
                this.expr(s.selector);
                for (const c of s.cases) {
                    this.enter();
                    for (const sub of c.body.stmts) this.stmt(sub);
                    this.exit();
                }
                break;
            // break/continue/discard have no exprs to resolve.
        }
    }

    fn(fnAst) {
        this.enter();
        for (const p of fnAst.params) {
            this.declare(p.name, this.sym.typeFromAst(p.type));
        }
        for (const s of fnAst.body.stmts) this.stmt(s);
        this.exit();
    }

    module() {
        // Walk every function (helpers + entry points).
        for (const fnAst of this.sym.catalog.fns.values()) this.fn(fnAst);
        // Type inferred (no-annotation) consts from their init exprs.
        for (const c of this.sym.catalog.constants.values()) {
            if (c.value != null && !this.sym.constTypes.has(c.name)) {
                const t = concretize(this.expr(c.value));
                if (t) this.sym.constTypes.set(c.name, t);
            }
        }
    }
}

/** Build a SymbolTable and annotate every Expr in the AST with its
 *  resolved type. Inferred-type consts get backfilled into the table
 *  by the expression resolver. */
export function resolveModule(ast) {
    const sym = new SymbolTable(catalogModule(ast));
    new ExprResolver(sym).module();
    return sym;
}

//#endregion


//#region 3.5. INLINE PASS  ──────────────────────────────────────────

/* AST-level pass that inlines small user-defined helper fns at every
   call site that is reachable from the surrounding statement context.
   Runs after resolveModule and before emit, so:

     - existing nodes keep their .resolvedType (we clone via shallow
       spread, never re-typing)
     - every newly-introduced binding (`let _inl_N_p = ...`, helper
       internals like `let _inl_N_d = q - p`) becomes a candidate for
       SROA that collectScalarizable picks up at emit time
     - the helper-call frame and its return-value allocation both
       disappear; the body's vec arithmetic fuses into the entry fn's
       component-wise stream

   Inlining policy (defaults, all opts-overridable):
     - K_BUDGET = 8     max top-level stmts in the helper body
     - M_SITES  = 4     max static call sites for the helper across the
                        module (counted across entry-points + other fns)
     - skip if the fn has any ptr param (would need address-tracking)
     - skip if the fn participates in any call cycle (recursion)
     - skip entry points (@compute) — they're the inlining target, not
       the inlinee

   The pass introduces two synthetic stmt kinds the emitter handles:
     - 'labeled'      → `${label}: { ${body} }` plus, when the helper
                        returns a value, a hoisted `let ${resultName};`
                        immediately before the labeled block
     - 'break_label'  → `break ${label};` — pairs with 'labeled'

   Result vars are plain JS `let` (mutable) bindings. They alias the
   helper's return into the surrounding scope; subsequent `let x =
   resultIdent` then becomes a SROA candidate just like any other vec
   binding, and emit's component-wise fast path handles it.  */

const INLINE_DEFAULT_BUDGET    = 8;
const INLINE_DEFAULT_CALLSITES = 4;

/** Walk a statement list and gather every fn-callee name referenced
 *  in expression position. Used for both call-count and recursion-
 *  graph construction. Out-parameter `out` is the result set. */
function _findCalleesInStmts(stmts, fnsCatalog, out) {
    for (const s of stmts) _findCalleesInStmt(s, fnsCatalog, out);
}
function _findCalleesInStmt(s, fnsCatalog, out) {
    if (!s) return;
    switch (s.kind) {
        case 'let': case 'const':
            if (s.value) _findCalleesInExpr(s.value, fnsCatalog, out); break;
        case 'var':
            if (s.value) _findCalleesInExpr(s.value, fnsCatalog, out); break;
        case 'assign': case 'compound':
            _findCalleesInExpr(s.target, fnsCatalog, out);
            if (s.value) _findCalleesInExpr(s.value, fnsCatalog, out); break;
        case 'postfix':
            _findCalleesInExpr(s.target, fnsCatalog, out); break;
        case 'expr_stmt':
            _findCalleesInExpr(s.expr, fnsCatalog, out); break;
        case 'return':
            if (s.value) _findCalleesInExpr(s.value, fnsCatalog, out); break;
        case 'block':
            _findCalleesInStmts(s.stmts, fnsCatalog, out); break;
        case 'if':
            _findCalleesInExpr(s.cond, fnsCatalog, out);
            _findCalleesInStmts(s.then.stmts, fnsCatalog, out);
            if (s.else) {
                if (s.else.kind === 'if') _findCalleesInStmt(s.else, fnsCatalog, out);
                else _findCalleesInStmts(s.else.stmts, fnsCatalog, out);
            }
            break;
        case 'for':
            if (s.init)   _findCalleesInStmt(s.init,   fnsCatalog, out);
            if (s.cond)   _findCalleesInExpr(s.cond,   fnsCatalog, out);
            if (s.update) _findCalleesInStmt(s.update, fnsCatalog, out);
            _findCalleesInStmts(s.body.stmts, fnsCatalog, out);
            break;
        case 'while':
            _findCalleesInExpr(s.cond, fnsCatalog, out);
            _findCalleesInStmts(s.body?.stmts ?? [], fnsCatalog, out);
            break;
        case 'loop':
            _findCalleesInStmts(s.body.stmts, fnsCatalog, out); break;
        case 'switch':
            _findCalleesInExpr(s.selector, fnsCatalog, out);
            for (const c of s.cases) _findCalleesInStmts(c.body.stmts, fnsCatalog, out);
            break;
    }
}
function _findCalleesInExpr(e, fnsCatalog, out) {
    if (!e) return;
    switch (e.kind) {
        case 'call':
            // Only user fns participate in inlining bookkeeping. Built-ins,
            // vecN/struct constructors etc. are dispatched specially by
            // emitCall and never become inline targets.
            if (typeof e.callee === 'string' && fnsCatalog.has(e.callee)) {
                out.add(e.callee);
            }
            for (const a of e.args) _findCalleesInExpr(a, fnsCatalog, out);
            break;
        case 'bin':    _findCalleesInExpr(e.lhs, fnsCatalog, out); _findCalleesInExpr(e.rhs, fnsCatalog, out); break;
        case 'una':    _findCalleesInExpr(e.value, fnsCatalog, out); break;
        case 'paren':  _findCalleesInExpr(e.value, fnsCatalog, out); break;
        case 'member': _findCalleesInExpr(e.value, fnsCatalog, out); break;
        case 'index':  _findCalleesInExpr(e.value, fnsCatalog, out); _findCalleesInExpr(e.index, fnsCatalog, out); break;
    }
}

/** Count the number of "weighty" statements in a body. Nested control
 *  flow blocks contribute their inner count too — a body of `if (...)
 *  { a; b; c; }` counts as 4 (the if itself + 3 inner stmts). Used as
 *  the inlining budget cutoff. */
function _countBodyStmts(stmts) {
    let n = 0;
    for (const s of stmts) n += _countStmt(s);
    return n;
}
function _countStmt(s) {
    if (!s) return 0;
    switch (s.kind) {
        case 'block':  return 1 + _countBodyStmts(s.stmts);
        case 'if': {
            let n = 1 + _countBodyStmts(s.then.stmts);
            if (s.else) {
                if (s.else.kind === 'if') n += _countStmt(s.else);
                else n += _countBodyStmts(s.else.stmts);
            }
            return n;
        }
        case 'for':    return 1 + _countBodyStmts(s.body.stmts);
        case 'while':  return 1 + _countBodyStmts(s.body?.stmts ?? []);
        case 'loop':   return 1 + _countBodyStmts(s.body.stmts);
        case 'switch': {
            let n = 1;
            for (const c of s.cases) n += _countBodyStmts(c.body.stmts);
            return n;
        }
        default: return 1;
    }
}

/** Walk a fn's params; return true if any has a ptr type or carries
 *  an `&` use inside the body. The first-pass inliner avoids these
 *  because address-tracking through alpha-rename adds real complexity
 *  with little win — pointer params are rare in plasma/geon helpers. */
function _hasPtrLikeShape(fn) {
    for (const p of fn.params) {
        if (p.type?.kind === 'type_ptr') return true;
    }
    // Quick scan for unary `&` (address-of) in the body. Conservative:
    // any `&` short-circuits the candidate. The transform would need to
    // either pass-by-reference (object aliasing) or rewrite addressOf
    // calls — both nontrivial.
    let found = false;
    const visitE = (e) => {
        if (!e || found) return;
        if (e.kind === 'una' && e.op === '&') { found = true; return; }
        switch (e.kind) {
            case 'bin':    visitE(e.lhs); visitE(e.rhs); break;
            case 'una':    visitE(e.value); break;
            case 'paren':  visitE(e.value); break;
            case 'member': visitE(e.value); break;
            case 'index':  visitE(e.value); visitE(e.index); break;
            case 'call':   for (const a of e.args) visitE(a); break;
        }
    };
    const visitS = (s) => {
        if (!s || found) return;
        switch (s.kind) {
            case 'let': case 'const': case 'var':
                if (s.value) visitE(s.value); break;
            case 'assign': case 'compound':
                visitE(s.target); if (s.value) visitE(s.value); break;
            case 'postfix':   visitE(s.target); break;
            case 'expr_stmt': visitE(s.expr); break;
            case 'return':    if (s.value) visitE(s.value); break;
            case 'block':     for (const x of s.stmts) visitS(x); break;
            case 'if':
                visitE(s.cond);
                for (const x of s.then.stmts) visitS(x);
                if (s.else) {
                    if (s.else.kind === 'if') visitS(s.else);
                    else for (const x of s.else.stmts) visitS(x);
                }
                break;
            case 'for':
                if (s.init)   visitS(s.init);
                if (s.cond)   visitE(s.cond);
                if (s.update) visitS(s.update);
                for (const x of s.body.stmts) visitS(x);
                break;
            case 'while':
                visitE(s.cond);
                for (const x of (s.body?.stmts ?? [])) visitS(x);
                break;
            case 'loop':
                for (const x of s.body.stmts) visitS(x); break;
            case 'switch':
                visitE(s.selector);
                for (const c of s.cases) for (const x of c.body.stmts) visitS(x);
                break;
        }
    };
    for (const s of fn.body.stmts) visitS(s);
    return found;
}

/** Compute the set of fn names that participate in any call cycle
 *  (self-recursive OR mutually recursive). Excluded from inlining
 *  regardless of size; the call-stack guard inside `_expandInlineCall`
 *  is belt-and-suspenders for any case this misses. */
function _findRecursiveFns(calleesOf) {
    const recursive = new Set();
    for (const name of calleesOf.keys()) {
        // BFS from `name`; if we hit `name` again, it's in a cycle.
        const stack = [...(calleesOf.get(name) ?? new Set())];
        const seen  = new Set();
        while (stack.length) {
            const cur = stack.pop();
            if (cur === name) { recursive.add(name); break; }
            if (seen.has(cur)) continue;
            seen.add(cur);
            const callees = calleesOf.get(cur);
            if (callees) for (const c of callees) stack.push(c);
        }
    }
    return recursive;
}

/** Decide which fns are inlinable. Returns a Map<fnName, fnAst>. */
function _pickInlinable(cat, opts) {
    const budget    = opts.inlineBudget    ?? INLINE_DEFAULT_BUDGET;
    const callLimit = opts.inlineCallLimit ?? INLINE_DEFAULT_CALLSITES;

    // Static call counts: how many times each user fn appears as a callee
    // anywhere in the module (entry-point bodies + helper bodies).
    const callCounts = new Map();
    const calleesOf  = new Map();   // fnName → Set<calleeName>
    const collectInto = (body, ownerKey) => {
        const callees = new Set();
        _findCalleesInStmts(body.stmts, cat.fns, callees);
        if (ownerKey != null) calleesOf.set(ownerKey, callees);
        for (const c of callees) {
            // Each *expression-position call* counts as one site. Currently
            // we conservatively count "appears anywhere in this body" once
            // per body, which under-counts repeated calls within one body
            // but matches the common "helper called from N different
            // call sites" intuition. Sufficient for the cap; tighten if it
            // ever fires falsely.
            callCounts.set(c, (callCounts.get(c) || 0) + 1);
        }
    };
    for (const [name, fn] of cat.fns) collectInto(fn.body, name);

    const recursive = _findRecursiveFns(calleesOf);

    const inlinable = new Map();
    for (const [name, fn] of cat.fns) {
        if (fn.attrs.some(a => a.name === 'compute')) continue;
        if (recursive.has(name))                       continue;
        if (_hasPtrLikeShape(fn))                      continue;
        const stmtCount = _countBodyStmts(fn.body.stmts);
        if (stmtCount > budget)                        continue;
        const sites = callCounts.get(name) || 0;
        if (sites === 0)                               continue;
        if (sites > callLimit)                         continue;
        inlinable.set(name, fn);
    }
    return inlinable;
}

/** Clone an expression with idents renamed via `nameMap`. The returned
 *  node tree is structurally a shallow copy at every level — original
 *  nodes are not mutated, but unmodified sub-nodes are shared by
 *  reference (resolvedType included). */
function _cloneExprRenamed(e, nameMap) {
    if (!e) return e;
    switch (e.kind) {
        case 'lit':   return e;
        case 'ident': {
            const repl = nameMap.get(e.name);
            return repl ? { ...e, name: repl } : e;
        }
        case 'bin':   return { ...e,
            lhs: _cloneExprRenamed(e.lhs, nameMap),
            rhs: _cloneExprRenamed(e.rhs, nameMap) };
        case 'una':   return { ...e, value: _cloneExprRenamed(e.value, nameMap) };
        case 'paren': return { ...e, value: _cloneExprRenamed(e.value, nameMap) };
        case 'call':  return { ...e, args: e.args.map(a => _cloneExprRenamed(a, nameMap)) };
        case 'member':return { ...e, value: _cloneExprRenamed(e.value, nameMap) };
        case 'index': return { ...e,
            value: _cloneExprRenamed(e.value, nameMap),
            index: _cloneExprRenamed(e.index, nameMap) };
    }
    return e;
}

/** Clone a statement with locals renamed (prefix added) and `return`
 *  rewritten into `resultName = expr; break label;`. `nameMap` is
 *  mutated as we walk: each let/var/const decl registers its prefixed
 *  name. WGSL forbids true shadowing of a binding within the same fn
 *  scope, so a flat per-expansion namespace is sound. */
function _cloneStmtRenamed(s, nameMap, ctx) {
    if (!s) return s;
    switch (s.kind) {
        case 'let': case 'const': {
            const renamed = ctx.prefix + s.name;
            nameMap.set(s.name, renamed);
            return { ...s, name: renamed,
                value: s.value ? _cloneExprRenamed(s.value, nameMap) : s.value };
        }
        case 'var': {
            const renamed = ctx.prefix + s.name;
            nameMap.set(s.name, renamed);
            return { ...s, name: renamed,
                value: s.value ? _cloneExprRenamed(s.value, nameMap) : null };
        }
        case 'assign':
            return { ...s,
                target: _cloneExprRenamed(s.target, nameMap),
                value:  _cloneExprRenamed(s.value,  nameMap) };
        case 'compound':
            return { ...s,
                target: _cloneExprRenamed(s.target, nameMap),
                value:  _cloneExprRenamed(s.value,  nameMap) };
        case 'postfix':
            return { ...s, target: _cloneExprRenamed(s.target, nameMap) };
        case 'expr_stmt':
            return { ...s, expr: _cloneExprRenamed(s.expr, nameMap) };
        case 'return': {
            // Rewrite into a single 'inline_return_set' stmt: stores the
            // return value into the synthetic result let and breaks out
            // of the labeled block. We can't reuse plain 'assign' here
            // because that route triggers write-through (`.x = ...`),
            // which corrupts an uninitialized JS let. The direct whole-
            // object assign synthesized here matches what a non-inlined
            // helper does: one fresh vec object materializes, the result
            // let aliases it. SROA on the result let happens at the call
            // site's binding (`let v_new = _inl_N_result`) so the single
            // alloc is read through scalar component access downstream.
            if (s.value && ctx.resultName) {
                const v = _cloneExprRenamed(s.value, nameMap);
                return {
                    kind: 'inline_return_set',
                    resultName: ctx.resultName,
                    label:      ctx.labelName,
                    value:      v,
                    scalarized: !!ctx.scalarized,
                    arity:      ctx.arity || 0,
                    loc:        s.loc,
                };
            }
            return { kind: 'break_label', label: ctx.labelName, loc: s.loc };
        }
        case 'block':
            return { ...s, stmts: s.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) };
        case 'if':
            return { ...s,
                cond: _cloneExprRenamed(s.cond, nameMap),
                then: { ...s.then, stmts: s.then.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) },
                else: s.else
                    ? (s.else.kind === 'if'
                        ? _cloneStmtRenamed(s.else, nameMap, ctx)
                        : { ...s.else, stmts: s.else.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) })
                    : null };
        case 'for':
            return { ...s,
                init:   s.init   ? _cloneStmtRenamed(s.init,   nameMap, ctx) : null,
                cond:   s.cond   ? _cloneExprRenamed(s.cond,   nameMap)      : null,
                update: s.update ? _cloneStmtRenamed(s.update, nameMap, ctx) : null,
                body:   { ...s.body, stmts: s.body.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) } };
        case 'while':
            return { ...s,
                cond: _cloneExprRenamed(s.cond, nameMap),
                body: { ...s.body, stmts: (s.body?.stmts ?? []).map(x => _cloneStmtRenamed(x, nameMap, ctx)) } };
        case 'loop':
            return { ...s, body: { ...s.body, stmts: s.body.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) } };
        case 'switch':
            return { ...s,
                selector: _cloneExprRenamed(s.selector, nameMap),
                cases: s.cases.map(c => ({ ...c,
                    body: { ...c.body, stmts: c.body.stmts.map(x => _cloneStmtRenamed(x, nameMap, ctx)) } })) };
        case 'break': case 'continue': case 'discard':
        case 'break_label':
            return s;
    }
    return s;
}

/** Expand one call into a sequence of stmts that, when emitted, run
 *  the helper inline. Returns `{ lifted, replacement }` where `lifted`
 *  is an array of stmts to splice BEFORE the call's enclosing stmt and
 *  `replacement` is the expr to use in place of the call expression. */
function _expandInlineCall(callExpr, fn, counter, inlinable, callStack) {
    const id           = counter.n++;
    const prefix       = `_inl_${id}_`;
    const labelName    = `_inl_${id}`;
    const hasResult    = !!fn.returnType;
    const resultName   = hasResult ? `${labelName}_result` : null;
    // Vec-returning helpers get a *scalarized* result var: instead of
    // one mutable JS let holding a {x,y,z} object, we emit per-component
    // lets (`_inl_N_result_x`, `_inl_N_result_y`, `_inl_N_result_z`).
    // The return-rewrite then stores components directly, and the
    // labeled-stmt emit registers the name in `this.scalarized` so
    // downstream reads route through the existing SROA fast paths.
    // Net: zero vec allocations per call, even on the return path.
    const isVecResult = hasResult && fn.returnType.kind === 'type_vec';
    const resultArity = isVecResult ? fn.returnType.n : 0;
    const lifted       = [];

    // Bind args to fresh locals. Each binding is a 'let' stmt so SROA
    // can scalarize vec args at emit time. Args themselves may contain
    // further inlinable calls — those were already lifted by the
    // caller's pass before we got here.
    for (let i = 0; i < fn.params.length; i++) {
        const p   = fn.params[i];
        const arg = callExpr.args[i];
        const renamedName = prefix + p.name;
        lifted.push({
            kind:  'let',
            name:  renamedName,
            type:  p.type ?? null,
            value: arg,
            loc:   callExpr.loc,
        });
    }

    // Clone-rename the body (registers each local in nameMap as we go).
    const nameMap = new Map();
    for (const p of fn.params) nameMap.set(p.name, prefix + p.name);
    const renamedBody = fn.body.stmts.map(s =>
        _cloneStmtRenamed(s, nameMap, {
            prefix, resultName, labelName,
            scalarized: isVecResult, arity: resultArity,
        }));

    // Recursively inline calls inside the renamed body. The call-stack
    // guard adds `fn.name` so a transitively-recursive cycle that
    // somehow escaped the recursive-fn check still terminates.
    const nextStack = new Set(callStack);
    nextStack.add(fn.name);
    const innerInlined = _inlineStmtList(renamedBody, inlinable, counter, nextStack);

    // Wrap in the labeled block. resultName, when set, is emitted as
    // hoisted JS bindings immediately before the labeled block — either
    // a single `let ${resultName};` for scalar/void/mat returns, or N
    // per-component lets for vec returns (then registered as scalarized
    // so subsequent reads route through the SROA fast paths).
    lifted.push({
        kind: 'labeled',
        label: labelName,
        resultName,
        resultType: hasResult ? fn.returnType : null,
        scalarized: isVecResult,
        arity:      resultArity,
        body: { kind: 'block', stmts: innerInlined, loc: callExpr.loc },
        loc: callExpr.loc,
    });

    const replacement = hasResult
        ? { kind: 'ident', name: resultName, resolvedType: callExpr.resolvedType ?? null, loc: callExpr.loc }
        : null;

    return { lifted, replacement };
}

/** Walk an expression. For every inlinable call encountered (depth-
 *  first — innermost first), append its expansion stmts to `lifted`
 *  and replace the call node with an ident pointing to the result var.
 *  Returns the (possibly rewritten) expr. Callers can rely on the
 *  return value preserving .resolvedType on the substituted node. */
function _liftCallsInExpr(e, inlinable, counter, callStack, lifted) {
    if (!e) return e;
    switch (e.kind) {
        case 'lit':   return e;
        case 'ident': return e;
        case 'paren': return { ...e, value: _liftCallsInExpr(e.value, inlinable, counter, callStack, lifted) };
        case 'bin':   return { ...e,
            lhs: _liftCallsInExpr(e.lhs, inlinable, counter, callStack, lifted),
            rhs: _liftCallsInExpr(e.rhs, inlinable, counter, callStack, lifted) };
        case 'una': {
            // Don't lift inside `&expr` — addressOf needs the call to remain
            // an l-value-rooted expression. (We already excluded ptr helpers
            // so this is a defensive guard, not a real case in the corpus.)
            if (e.op === '&') return e;
            return { ...e, value: _liftCallsInExpr(e.value, inlinable, counter, callStack, lifted) };
        }
        case 'member':return { ...e, value: _liftCallsInExpr(e.value, inlinable, counter, callStack, lifted) };
        case 'index': return { ...e,
            value: _liftCallsInExpr(e.value, inlinable, counter, callStack, lifted),
            index: _liftCallsInExpr(e.index, inlinable, counter, callStack, lifted) };
        case 'call': {
            // Recurse into args FIRST so inner calls expand before the outer.
            const liftedArgs = e.args.map(a =>
                _liftCallsInExpr(a, inlinable, counter, callStack, lifted));
            const withArgs = { ...e, args: liftedArgs };
            const target = inlinable.get(e.callee);
            if (!target || callStack.has(e.callee)) return withArgs;
            const { lifted: stmts, replacement } =
                _expandInlineCall(withArgs, target, counter, inlinable, callStack);
            for (const s of stmts) lifted.push(s);
            // Void helpers can only be called from expr_stmt context;
            // the caller maps `null` to a no-op replacement.
            return replacement ?? { kind: 'lit', raw: 'undefined', resolvedType: null, loc: e.loc };
        }
    }
    return e;
}

/** Lift inlinable calls out of any expressions in stmt `s`. Returns
 *  an array of stmts (pre-lifted + the rewritten s). Recurses into
 *  sub-stmts so calls inside nested blocks are also inlined. */
function _inlineStmt(s, inlinable, counter, callStack) {
    if (!s) return [];
    // Allow recursion into nested control-flow without lifting calls
    // into a parent scope — calls inside an if/for/etc are lifted at
    // their own block-local level, immediately preceding the enclosing
    // stmt within the same block. This is achieved by recursing into
    // the body stmt list and processing each one's lifts independently.
    const lift = (expr) => {
        const lifted = [];
        const out = expr ? _liftCallsInExpr(expr, inlinable, counter, callStack, lifted) : expr;
        return { lifted, out };
    };
    switch (s.kind) {
        case 'let': case 'const': {
            const { lifted, out } = lift(s.value);
            return [...lifted, { ...s, value: out }];
        }
        case 'var': {
            const { lifted, out } = lift(s.value);
            return [...lifted, { ...s, value: out ?? null }];
        }
        case 'assign': {
            // Target side of an assign is an lvalue; we don't lift calls
            // out of it (would change l-value identity). Lift the rhs only.
            const { lifted, out } = lift(s.value);
            return [...lifted, { ...s, value: out }];
        }
        case 'compound': {
            const { lifted, out } = lift(s.value);
            return [...lifted, { ...s, value: out }];
        }
        case 'postfix':
            return [s];
        case 'expr_stmt': {
            const { lifted, out } = lift(s.expr);
            // If the whole expr was a void inlinable call, the replacement
            // is a dummy `undefined`. Skip the expr_stmt in that case —
            // the side-effects already executed inside the labeled block.
            if (out && out.kind === 'lit' && out.raw === 'undefined') {
                return lifted;
            }
            return [...lifted, { ...s, expr: out }];
        }
        case 'return': {
            const { lifted, out } = lift(s.value);
            return [...lifted, { ...s, value: out ?? null }];
        }
        case 'block':
            return [{ ...s, stmts: _inlineStmtList(s.stmts, inlinable, counter, callStack) }];
        case 'if': {
            const { lifted, out } = lift(s.cond);
            const newIf = {
                ...s,
                cond: out,
                then: { ...s.then, stmts: _inlineStmtList(s.then.stmts, inlinable, counter, callStack) },
                else: s.else
                    ? (s.else.kind === 'if'
                        ? _inlineStmt(s.else, inlinable, counter, callStack)[0]
                        : { ...s.else, stmts: _inlineStmtList(s.else.stmts, inlinable, counter, callStack) })
                    : null,
            };
            return [...lifted, newIf];
        }
        case 'for': {
            // for-init/update can contain calls but inlining into their
            // single-stmt slots would force us to spill before the loop.
            // Keep the loop's structure: lift the cond's calls before
            // the loop header; lift body calls into body block.
            const init   = s.init   ? _inlineStmt(s.init,   inlinable, counter, callStack)[0] : null;
            const condR  = s.cond   ? lift(s.cond)   : { lifted: [], out: null };
            const update = s.update ? _inlineStmt(s.update, inlinable, counter, callStack)[0] : null;
            const body   = { ...s.body, stmts: _inlineStmtList(s.body.stmts, inlinable, counter, callStack) };
            return [
                ...condR.lifted,
                { ...s, init, cond: condR.out, update, body },
            ];
        }
        case 'while': {
            const condR = lift(s.cond);
            const body  = { ...s.body, stmts: _inlineStmtList(s.body?.stmts ?? [], inlinable, counter, callStack) };
            return [...condR.lifted, { ...s, cond: condR.out, body }];
        }
        case 'loop':
            return [{ ...s, body: { ...s.body, stmts: _inlineStmtList(s.body.stmts, inlinable, counter, callStack) } }];
        case 'switch': {
            const selR = lift(s.selector);
            const cases = s.cases.map(c => ({ ...c,
                body: { ...c.body, stmts: _inlineStmtList(c.body.stmts, inlinable, counter, callStack) } }));
            return [...selR.lifted, { ...s, selector: selR.out, cases }];
        }
        default:
            return [s];
    }
}

function _inlineStmtList(stmts, inlinable, counter, callStack) {
    const out = [];
    for (const s of stmts) {
        const expanded = _inlineStmt(s, inlinable, counter, callStack);
        for (const x of expanded) out.push(x);
    }
    return out;
}

/** Run the inline pass over a module AST. Mutates `ast.items` in
 *  place — every fn body has its calls to inlinable helpers expanded. */
export function inlineModulePass(ast, opts = {}) {
    const cat = catalogModule(ast);
    const inlinable = _pickInlinable(cat, opts);
    if (inlinable.size === 0) return { inlinable };

    const counter = { n: 0 };
    for (const item of ast.items) {
        if (item.kind !== 'fn') continue;
        // Allow inlining inside helpers themselves so chains cascade
        // (helper-of-helper). The call-stack guard prevents loops.
        const baseStack = new Set([item.name]);
        item.body.stmts = _inlineStmtList(item.body.stmts, inlinable, counter, baseStack);
    }
    return { inlinable };
}

//#endregion


//#region 4. EMITTER  ────────────────────────────────────────────────

/* ── Emit shape ───────────────────────────────────────────────────
   The emitted module is a single JS function that takes the runtime
   namespace and returns `{ entry, bindings }`:

      function transpiled(rt) {
        // user-defined constants and helper fns hoist into closure
        const SOME_CONST = 1.0;
        function helper(x) { ... }
        const entry = Object.create(null);
        entry.main = function ({ workgroups, bindings }) {
          const [Wx, Wy, Wz] = workgroups;
          const wg = { tile_max: 0u };   // workgroup-local vars
          for (let wgz=0; wgz<Wz; wgz++) for (let wgy=0; wgy<Wy; wgy++) for (let wgx=0; wgx<Wx; wgx++) {
            // reset wg
            wg.tile_max = 0;
            // Phase 0 — statements before first barrier
            for (let lz=0; lz<Lz; lz++) for (let ly=0; ly<Ly; ly++) for (let lx=0; lx<Lx; lx++) {
              const __gid = { x: wgx*Lx+lx, y: wgy*Ly+ly, z: wgz*Lz+lz };
              const __lid = { x: lx, y: ly, z: lz };
              const __lidx = lz*Ly*Lx + ly*Lx + lx;
              // ... emitted body of phase 0 ...
            }
            // Phase 1 ... etc.
          }
        };
        return { entry, bindings: ['U_in', 'U_out', ...] };
      }

   ── Conventions ──────────────────────────────────────────────────
   - vec/mat types are `{x, y, z, w}` (or `{x, y}` etc.) objects. Vec
     binary ops dispatch through `rt.add/sub/mul/div/mod` which handle
     scalar↔vec, vec↔scalar, vec↔vec polymorphism. Slower than inline
     scalar code; correctness first, optimize later.
   - struct values are plain objects keyed by field name.
   - storage buffers come from `bindings.<name>`. Reads and writes go
     through `rt.loadElem/storeElem` so the caller can pass either a
     flat TypedArray (4 entries per vec4) or an array of objects.
   - workgroup vars live in the per-workgroup `wg` object, reset at
     the start of each workgroup iteration.
   - workgroupBarrier() inside an entry function splits the body into
     phases; each phase loops over all workgroup invocations before
     the next phase begins.
   - atomics: `&buf[i]` lowers to `rt.addressOf(buf, i)`, `atomicAdd`
     etc. take the resulting handle.
   - `return` inside an invocation must be modeled as `continue` of
     the innermost invocation loop (since the wrapping fn isn't the
     entry itself). We compile entry-body returns into `__ret;
     continue __invoc;`.
   ──────────────────────────────────────────────────────────────── */

/** JS reserved words that may collide with WGSL identifiers. Renamed
 *  by prepending an underscore at every declaration site, and reads
 *  of those declarations consistently use the renamed form. Member
 *  access (`obj.in`) is fine in JS and isn't escaped. */
const JS_RESERVED = new Set([
    'in', 'of', 'class', 'do', 'try', 'catch', 'finally', 'new',
    'this', 'super', 'extends', 'import', 'export', 'from', 'as',
    'async', 'await', 'yield', 'typeof', 'instanceof', 'delete',
    'void', 'null', 'undefined', 'enum', 'implements', 'interface',
    'package', 'protected', 'public', 'static', 'with',
    'debugger', 'arguments', 'eval',
]);
function _safe(name) { return JS_RESERVED.has(name) ? '_' + name : name; }

/** WGSL swizzle character → vec object property. Both x/y/z/w and
 *  r/g/b/a refer to the same components per the WGSL spec. We store
 *  vecs as {x,y,z,w} JS objects, so rgba aliases get remapped. */
const SWIZZLE_MAP = { x: 'x', y: 'y', z: 'z', w: 'w',
                      r: 'x', g: 'y', b: 'z', a: 'w' };

/** Set of binary ops that need polymorphic scalar/vec dispatch. */
const POLY_BIN = new Set(['+', '-', '*', '/', '%']);

/** Predicate: would this RHS allocate a fresh vec object under the
 *  current inlined emit? Used by write-through to decide whether
 *  component-wise stores save anything.
 *
 *  - bin/una over vec types lower to a single object literal → allocate
 *  - vecN constructor calls → allocate
 *  - POLY_FN intrinsics with vec result → allocate
 *  - paren around any of the above → allocate (recurse)
 *  - ident, member, index, lit → reference an existing object/value;
 *    write-through would change `arr[i] = v` (ref assign) into three
 *    property writes, which is *slower* for object-mode storage. Skip
 *    these — they'll be handled by flat-TypedArray mode (Step 2) where
 *    per-component writes are mandatory regardless.
 */
function isFreshVecExpr(e) {
    if (!e || e.resolvedType?.kind !== 'vec') return false;
    switch (e.kind) {
        case 'bin':
        case 'una':
            return true;
        case 'call': {
            const n = e.callee;
            if (/^vec[234][fuih]?$/.test(n)) return true;
            // POLY_FN intrinsics emit obj literal when args are vec.
            // SCALAR_INTRINSIC_JS gating mirrors emitCall's logic.
            if (POLY_FN.has(n) && SCALAR_INTRINSIC_JS[n]) return true;
            return false;
        }
        case 'paren':
            return isFreshVecExpr(e.value);
        default:
            return false;
    }
}

/** Predicate: is this expression safe to evaluate component-by-component
 *  without changing semantics? The component-wise vec emit recurses into
 *  the same expression once per component, so any subexpression with side
 *  effects (function calls, generally) would fire N times instead of once.
 *  Ident, member, paren, lit, bin/una over safe operands, and index over
 *  safe operands are all safe. User function calls are not — neither are
 *  intrinsics in general (some are pure but we don't have a whitelist).
 *  vecN constructors are safe iff their args are. */
function isComponentSafe(e) {
    if (!e) return false;
    switch (e.kind) {
        case 'lit':
        case 'ident':    return true;
        case 'paren':    return isComponentSafe(e.value);
        case 'member':   return isComponentSafe(e.value);
        case 'bin':      return isComponentSafe(e.lhs) && isComponentSafe(e.rhs);
        case 'una':      return isComponentSafe(e.value);
        case 'index':    return isComponentSafe(e.value) && isComponentSafe(e.index);
        case 'call': {
            const n = e.callee;
            if (/^vec[234]$/.test(n) || /^vec[234][fuih]$/.test(n)) {
                return e.args.every(isComponentSafe);
            }
            // POLY_FN intrinsics are pure (no side effects) and lower to
            // either Math.* or short scalar templates. Permitting them
            // here means component-wise lowering can see through
            // `vec * (1.0/max(len,e))`-shape exprs that otherwise force
            // a materialize+read fallback. The triplicate-Math.max cost
            // is a few ns; the avoided vec alloc is ~20ns + GC pressure.
            // Scalar casts (f32/i32/u32/bool) and bitcast are likewise
            // pure scalar-shaped helpers.
            if (POLY_FN.has(n) && SCALAR_INTRINSIC_JS[n]) {
                return e.args.every(isComponentSafe);
            }
            return false;
        }
        default:         return false;
    }
}
/** Helper-name lookup for those ops. */
const POLY_BIN_NAME = {
    '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'mod',
};
/** Element-wise math intrinsics that may receive vec args. */
const POLY_FN = new Set([
    'max', 'min', 'abs', 'sqrt', 'sign', 'floor', 'ceil', 'round',
    'fract', 'trunc', 'exp', 'log', 'exp2', 'log2', 'pow', 'sin', 'cos',
    'tan', 'atan', 'atan2', 'clamp', 'mix', 'step', 'smoothstep',
]);

/** Scalar-JS emission templates for POLY_FN intrinsics. When all args
 *  to an intrinsic call resolve to scalars (or to a uniform vec shape
 *  that we lower component-wise), the emitter substitutes the rt.*
 *  dispatch with these direct JS expressions — same allocation win as
 *  the binop inlining. Intrinsics not listed here keep using rt.*. */
const SCALAR_INTRINSIC_JS = {
    max:    (a) => `Math.max(${a[0]}, ${a[1]})`,
    min:    (a) => `Math.min(${a[0]}, ${a[1]})`,
    abs:    (a) => `Math.abs(${a[0]})`,
    sqrt:   (a) => `Math.sqrt(${a[0]})`,
    sign:   (a) => `Math.sign(${a[0]})`,
    floor:  (a) => `Math.floor(${a[0]})`,
    ceil:   (a) => `Math.ceil(${a[0]})`,
    round:  (a) => `Math.round(${a[0]})`,
    trunc:  (a) => `Math.trunc(${a[0]})`,
    exp:    (a) => `Math.exp(${a[0]})`,
    log:    (a) => `Math.log(${a[0]})`,
    exp2:   (a) => `Math.pow(2, ${a[0]})`,
    log2:   (a) => `Math.log2(${a[0]})`,
    pow:    (a) => `Math.pow(${a[0]}, ${a[1]})`,
    sin:    (a) => `Math.sin(${a[0]})`,
    cos:    (a) => `Math.cos(${a[0]})`,
    tan:    (a) => `Math.tan(${a[0]})`,
    atan:   (a) => `Math.atan(${a[0]})`,
    atan2:  (a) => `Math.atan2(${a[0]}, ${a[1]})`,
    fract:  (a) => `(${a[0]} - Math.floor(${a[0]}))`,
    clamp:  (a) => `Math.min(Math.max(${a[0]}, ${a[1]}), ${a[2]})`,
    mix:    (a) => `(${a[0]} + (${a[1]} - ${a[0]}) * ${a[2]})`,
    step:   (a) => `(${a[1]} < ${a[0]} ? 0 : 1)`,
};

/**
 * Emit JS source from a parsed Module AST.
 * @param {object} ast
 * @returns {{ jsSource: string, entryPoints: string[], bindings: string[] }}
 */
export function emit(ast) {
    const e = new Emitter(ast);
    return e.emitModule();
}

class Emitter {
    constructor(ast) {
        this.ast    = ast;
        this.out    = [];
        this.indent = 0;

        // Shared module catalog — same Maps the resolver consumes, so
        // the walk over ast.items happens exactly once per compile.
        const cat = catalogModule(ast);
        this.structs       = cat.structs;
        this.constants     = cat.constants;
        this.bindings      = cat.bindings;
        this.workgroupVars = cat.workgroupVars;
        this.privateVars   = cat.privateVars;
        this.fns           = cat.fns;
        this.entryPoints   = cat.entryPoints;
        // Aliases are still transparent at emit time — fall through to
        // the standard ident path. The resolver substitutes them when
        // typing expressions.

        // Scope stack of Sets — names of locals introduced so far in
        // the current function body. Used to disambiguate "is this
        // ident a local or a global?".
        this.localScopes = [];

        // SROA state — populated per-fn by collectScalarizable() before
        // walking the body. Maps let-name → vec arity (2|3|4). A let in
        // this map is scalarized: its emit produces N scalar locals
        // named `${name}_x`, `${name}_y`, ... instead of one vec object.
        // Reset between fn bodies.
        this.scalarized = new Map();
        this.sroaCounter = 0;
    }

    // ── Output ─────────────────────────────────────────────────────
    line(s) { this.out.push('    '.repeat(this.indent) + s); }
    blank() { this.out.push(''); }
    open()  { this.indent++; }
    close() { this.indent--; }

    // ── Emit module text ──────────────────────────────────────────
    emitModule() {
        this.open(); // body lives inside the (implicit) module fn

        // Constants and helper fns hoist into the closure.
        for (const c of this.constants.values()) this.emitConst(c);
        if (this.constants.size > 0) this.blank();

        for (const f of this.fns.values()) {
            if (f.attrs.some(a => a.name === 'compute')) continue;
            this.emitFn(f);
            this.blank();
        }

        this.line('const entry = Object.create(null);');
        for (const f of this.entryPoints) {
            this.emitEntry(f);
        }

        this.blank();
        this.line(`return { entry, bindings: ${JSON.stringify([...this.bindings.keys()])} };`);
        this.close();

        const body = this.out.join('\n') + '\n';
        const jsSource =
            '// Auto-generated from WGSL by shared-wgsl-transpile.js\n' +
            '// DO NOT EDIT — regenerate from the .wgsl source.\n' +
            '\n' +
            'export default function _wgsl_module(rt) {\n' +
            body +
            '}\n';

        return {
            jsSource,
            body,
            entryPoints: this.entryPoints.map(f => f.name),
            bindings: [...this.bindings.keys()],
        };
    }

    emitConst(c) {
        // Push a temporary empty scope so `expr` treats names as globals.
        this.localScopes = [];
        this.line(`const ${_safe(c.name)} = ${this.expr(c.value)};`);
    }

    emitFn(f) {
        const params = f.params.map(p => _safe(p.name)).join(', ');
        this.line(`function ${_safe(f.name)}(${params}) {`);
        this.open();
        // Each fn opens a fresh local scope. Params count as locals.
        this.localScopes = [new Set(f.params.map(p => p.name))];
        // SROA pre-pass — identifies vec lets we can scalarize.
        this.collectScalarizable(f.body.stmts);
        for (const s of f.body.stmts) this.stmt(s);
        this.close();
        this.line('}');
    }

    emitEntry(f) {
        // Pull workgroup size from @workgroup_size(X, Y?, Z?).
        const wsAttr = f.attrs.find(a => a.name === 'workgroup_size');
        const sx = wsAttr ? this.constExprInt(wsAttr.args[0]) : 1;
        const sy = wsAttr && wsAttr.args[1] ? this.constExprInt(wsAttr.args[1]) : 1;
        const sz = wsAttr && wsAttr.args[2] ? this.constExprInt(wsAttr.args[2]) : 1;

        // Map builtin params to component-wise integer expressions.
        // Builtins are pre-scalarized: a kernel that does `gid.x` then
        // resolves to a scalar local read with no vec3 object allocated.
        // (Whole-vec uses route through emitIdent's rematerialization
        // safety net — same cost as the original rt.vec3 alloc.)
        // Supported builtins (subset that plasma+geon use):
        //   global_invocation_id, local_invocation_id, local_invocation_index,
        //   workgroup_id, num_workgroups
        //
        // Scope: gid/lid/lidx live inside the invocation triple-loop;
        // wgid/nwg live at workgroup scope.
        const BUILTIN_SPEC = {
            global_invocation_id:   { arity: 3, scope: 'inv', xyz: ['wgx*Lx + lx', 'wgy*Ly + ly', 'wgz*Lz + lz'] },
            local_invocation_id:    { arity: 3, scope: 'inv', xyz: ['lx', 'ly', 'lz'] },
            local_invocation_index: { arity: 1, scope: 'inv', expr: 'lz*Ly*Lx + ly*Lx + lx' },
            workgroup_id:           { arity: 3, scope: 'wg',  xyz: ['wgx', 'wgy', 'wgz'] },
            num_workgroups:         { arity: 3, scope: 'wg',  xyz: ['Wx', 'Wy', 'Wz'] },
        };
        const builtinBindings = [];   // [{name, arity, scope, xyz | expr}]
        for (const p of f.params) {
            const a = p.attrs.find(x => x.name === 'builtin');
            if (!a) continue;
            const which = a.args[0]?.name;
            const spec = BUILTIN_SPEC[which];
            if (spec) builtinBindings.push({ name: p.name, ...spec });
        }

        // Workgroup-local vars: reset at the start of each workgroup.
        const wgEntries = [...this.workgroupVars.values()].map(v => {
            return { name: v.name, init: this.defaultInit(v.type) };
        });

        // ── Phase splitting ──────────────────────────────────────────
        // Top-level workgroupBarrier()/storageBarrier() calls split the
        // entry body into phases. Each phase runs across all workgroup
        // invocations before the next phase begins; workgroup-shared
        // memory is therefore consistent at each barrier as on a GPU.
        // Limitation: barriers nested inside if/for/while aren't lifted
        // out (would require duplicating control flow). plasma+geon use
        // only top-level barriers so this covers the real cases.
        const phases = this.splitPhases(f.body.stmts);

        this.blank();
        this.line(`entry[${JSON.stringify(f.name)}] = function ({ workgroups, bindings }) {`);
        this.open();
        this.line(`const [Wx, Wy, Wz] = workgroups;`);
        this.line(`const Lx = ${sx}, Ly = ${sy}, Lz = ${sz};`);
        if (wgEntries.length) {
            this.line(`const wg = Object.create(null);`);
        }

        this.line(`for (let wgz = 0; wgz < Wz; wgz++)`);
        this.line(`for (let wgy = 0; wgy < Wy; wgy++)`);
        this.line(`for (let wgx = 0; wgx < Wx; wgx++) {`);
        this.open();
        if (wgEntries.length) {
            for (const w of wgEntries) this.line(`wg.${w.name} = ${w.init};`);
        }
        // Workgroup-scope builtins (wgid, nwg) — scalarize so member
        // access turns into direct scalar reads.
        for (const b of builtinBindings) {
            if (b.scope !== 'wg') continue;
            if (b.arity === 3) {
                this.line(`const ${_safe(b.name)}_x = ${b.xyz[0]};`);
                this.line(`const ${_safe(b.name)}_y = ${b.xyz[1]};`);
                this.line(`const ${_safe(b.name)}_z = ${b.xyz[2]};`);
            } else {
                this.line(`const ${_safe(b.name)} = ${b.expr};`);
            }
        }

        // Emit one invocation triple-loop per phase. Each iteration
        // sets up the per-invocation builtins (gid/lid/lidx) and runs
        // the phase body inside the __invocation labeled block so that
        // an early WGSL `return` can `break __invocation` out cleanly.
        for (let p = 0; p < phases.length; p++) {
            if (phases.length > 1) this.line(`// Phase ${p}`);
            this.line(`for (let lz = 0; lz < Lz; lz++)`);
            this.line(`for (let ly = 0; ly < Ly; ly++)`);
            this.line(`for (let lx = 0; lx < Lx; lx++) {`);
            this.open();
            // Invocation-scope builtins (gid, lid, lidx) — scalarized.
            for (const b of builtinBindings) {
                if (b.scope !== 'inv') continue;
                if (b.arity === 3) {
                    this.line(`const ${_safe(b.name)}_x = ${b.xyz[0]};`);
                    this.line(`const ${_safe(b.name)}_y = ${b.xyz[1]};`);
                    this.line(`const ${_safe(b.name)}_z = ${b.xyz[2]};`);
                } else {
                    this.line(`const ${_safe(b.name)} = ${b.expr};`);
                }
            }
            this.line(`__invocation: {`);
            this.open();
            this.localScopes = [new Set(f.params.map(p => p.name))];
            // SROA pre-pass — per-phase, since phase boundaries split
            // the body and locals can't live across them anyway.
            this.collectScalarizable(phases[p]);
            // Builtins are scalarized too — must be added AFTER
            // collectScalarizable since that clears the map.
            for (const b of builtinBindings) {
                if (b.arity === 3) this.scalarized.set(b.name, 3);
            }
            for (const s of phases[p]) this.stmt(s, /*inEntry=*/true);
            this.close();
            this.line(`}`);
            this.close();
            this.line(`}`); // close invocation triple loop
        }

        this.close();
        this.line(`}`); // close workgroup triple loop
        this.close();
        this.line(`};`);
    }

    /** Split a list of statements at top-level barrier calls. Returns
     *  Array<Stmt[]> with len = (barriers + 1). The barrier calls
     *  themselves are dropped from the output. */
    splitPhases(stmts) {
        const phases = [[]];
        for (const s of stmts) {
            if (this.isBarrier(s)) phases.push([]);
            else phases[phases.length - 1].push(s);
        }
        return phases;
    }

    isBarrier(s) {
        return s.kind === 'expr_stmt' &&
               s.expr.kind === 'call' &&
               (s.expr.callee === 'workgroupBarrier' ||
                s.expr.callee === 'storageBarrier');
    }

    /** Best-effort default init for a workgroup-local var. */
    defaultInit(type) {
        if (type.kind === 'type_atomic') return '0';
        if (type.kind === 'type_scalar') return type.name === 'bool' ? 'false' : '0';
        if (type.kind === 'type_vec') {
            const z = type.of.name === 'bool' ? 'false' : '0';
            return `rt.vec${type.n}(${Array(type.n).fill(z).join(', ')})`;
        }
        return 'null';
    }

    /** Resolve a literal/named const expr to a JS-side integer constant. */
    constExprInt(expr) {
        if (expr.kind === 'lit') return parseInt(expr.raw, expr.intBase || 10);
        if (expr.kind === 'ident') {
            const c = this.constants.get(expr.name);
            if (c) return this.constExprInt(c.value);
        }
        if (expr.kind === 'paren') return this.constExprInt(expr.value);
        throw new WGSLError(`expected constant int expression`,
            expr.loc?.line ?? 0, expr.loc?.col ?? 0);
    }

    /** Pre-pass: walk a fn body's statement list, identify which vec-
     *  typed `let`/`const` bindings can be safely scalarized (SROA).
     *
     *  Scalarization eliminates the {x,y,z} object allocation for an
     *  intermediate vec local — replacing it with N scalar locals
     *  named `${name}_x`, `${name}_y`, .... Member access `x.c` lowers
     *  to `x_c` directly, and vec arithmetic that flows through
     *  `exprComp` reads scalars directly. Whole-vec uses (passing to
     *  fn calls, ref-assigning to storage) fall back to rematerializing
     *  `{x: x_x, y: x_y, z: x_z}` — correct but allocates.
     *
     *  Disqualifications:
     *  - `&name` (address-of) — the scalarized name doesn't exist as a
     *    JS binding, so the address-of lowering would break. Atomics
     *    are scalar-only in WGSL, so this rarely affects vec lets in
     *    practice, but the check is mandatory for correctness.
     *  - Name shadowing — if a name appears in multiple let/const decls
     *    (different scopes), we conservatively skip all of them rather
     *    than track per-scope scalarization.
     *
     *  Fills `this.scalarized` with name → arity entries for the body. */
    collectScalarizable(stmts) {
        this.scalarized.clear();
        const candidate = new Map();   // name → arity
        const seen      = new Set();   // names seen at least once
        const banned    = new Set();   // names disqualified

        const visitExpr = (e) => {
            if (!e) return;
            if (e.kind === 'una' && e.op === '&') {
                // Address-of root must not be a scalarized local.
                let root = e.value;
                while (root && (root.kind === 'paren')) root = root.value;
                if (root && root.kind === 'ident') banned.add(root.name);
                visitExpr(e.value);
                return;
            }
            switch (e.kind) {
                case 'bin':    visitExpr(e.lhs); visitExpr(e.rhs); break;
                case 'una':    visitExpr(e.value); break;
                case 'paren':  visitExpr(e.value); break;
                case 'call':   for (const a of e.args) visitExpr(a); break;
                case 'index':  visitExpr(e.value); visitExpr(e.index); break;
                case 'member': visitExpr(e.value); break;
            }
        };

        const visitStmt = (s) => {
            if (!s) return;
            switch (s.kind) {
                case 'let':
                case 'const': {
                    if (seen.has(s.name)) {
                        banned.add(s.name);
                    } else {
                        seen.add(s.name);
                        const t = s.value?.resolvedType;
                        if (t?.kind === 'vec') candidate.set(s.name, t.n);
                    }
                    if (s.value) visitExpr(s.value);
                    break;
                }
                case 'var':
                    // `var` not yet scalarized — would need mutable
                    // scalar lets and write-through on every assign.
                    // Falls through to normal emit.
                    if (s.value) visitExpr(s.value);
                    if (seen.has(s.name)) banned.add(s.name);
                    else seen.add(s.name);
                    break;
                case 'block':
                    for (const x of s.stmts) visitStmt(x);
                    break;
                case 'labeled':
                    // Synthesized by inline pass. Body is a block; lets
                    // inside are SROA candidates just like any other.
                    // (resultName itself is a JS let, not SROA-tracked —
                    // var SROA will pick that up in step 2.)
                    for (const x of s.body.stmts) visitStmt(x);
                    break;
                case 'inline_return_set':
                    // Synthesized return-rewrite. Visit the value expr so
                    // any `&local` use inside the return path correctly
                    // disqualifies the referenced local from SROA. (Real
                    // case unlikely — we exclude `&`-using helpers from
                    // inlining — but the contract should stay symmetric.)
                    if (s.value) visitExpr(s.value);
                    break;
                case 'if':
                    visitExpr(s.cond);
                    for (const x of s.then.stmts) visitStmt(x);
                    if (s.else) {
                        if (s.else.kind === 'if') visitStmt(s.else);
                        else for (const x of s.else.stmts) visitStmt(x);
                    }
                    break;
                case 'for':
                    if (s.init)   visitStmt(s.init);
                    if (s.cond)   visitExpr(s.cond);
                    if (s.update) visitStmt(s.update);
                    for (const x of s.body.stmts) visitStmt(x);
                    break;
                case 'while':
                    visitExpr(s.cond);
                    for (const x of (s.body?.stmts ?? [])) visitStmt(x);
                    break;
                case 'loop':
                    for (const x of s.body.stmts) visitStmt(x);
                    break;
                case 'switch':
                    visitExpr(s.selector);
                    for (const c of s.cases) {
                        for (const x of c.body.stmts) visitStmt(x);
                    }
                    break;
                case 'assign':
                case 'compound':
                    visitExpr(s.target);
                    if (s.value) visitExpr(s.value);
                    break;
                case 'postfix':
                    visitExpr(s.target);
                    break;
                case 'expr_stmt':
                    visitExpr(s.expr);
                    break;
                case 'return':
                    if (s.value) visitExpr(s.value);
                    break;
            }
        };

        for (const s of stmts) visitStmt(s);

        for (const name of banned) candidate.delete(name);
        for (const [n, ar] of candidate) this.scalarized.set(n, ar);
    }

    /** Emit a scalarized let/const declaration. `decl` is the JS
     *  declaration keyword ('const' / 'let'). The init expression is
     *  lowered component-wise via exprComp when safe; otherwise the
     *  init is materialized into a tmp object and components are read
     *  off it (saving repeated subexpr evaluation).
     *
     *  Called only when `name ∈ this.scalarized`. */
    emitScalarizedLet(name, valueExpr, arity, decl) {
        const comps = ['x', 'y', 'z', 'w'].slice(0, arity);
        const compExprs = isComponentSafe(valueExpr)
            ? comps.map(c => this.exprComp(valueExpr, c))
            : null;

        if (compExprs && compExprs.every(s => s != null)
                && !this.exprNeedsMaterialize(valueExpr)) {
            // Direct lowering — fastest path. No object ever materialized.
            for (let i = 0; i < arity; i++) {
                this.line(`${decl} ${_safe(name)}_${comps[i]} = ${compExprs[i]};`);
            }
            return;
        }

        // Indirect: materialize init once, then read components.
        // Used when init is an index/member access (`pos_in[i]`),
        // a non-component-lowerable expression, or has side effects.
        const tmp = `_sroa_${this.sroaCounter++}`;
        this.line(`const ${tmp} = ${this.expr(valueExpr)};`);
        for (let i = 0; i < arity; i++) {
            this.line(`${decl} ${_safe(name)}_${comps[i]} = ${tmp}.${comps[i]};`);
        }
    }

    /** Heuristic: would lowering this expression component-wise duplicate
     *  expensive work? If so, prefer materializing into a tmp once and
     *  reading the components from there. */
    exprNeedsMaterialize(e) {
        if (!e) return false;
        switch (e.kind) {
            case 'lit':    return false;
            case 'ident':  return false;
            case 'paren':  return this.exprNeedsMaterialize(e.value);
            // Storage / member chains: V8 may CSE but we can't rely on it.
            case 'index':  return true;
            case 'member': return true;
            // Calls: side-effecting in general, materialize.
            case 'call': {
                const n = e.callee;
                // vecN(...) constructors with safe args lower cheaply.
                if (/^vec[234][fuih]?$/.test(n)) {
                    return e.args.some(a => this.exprNeedsMaterialize(a));
                }
                return true;
            }
            case 'bin':
            case 'una':
                // Component lowering recurses without duplicating
                // safe subexprs — see exprComp. Cheap to repeat.
                return false;
        }
        return false;
    }

    /** Try to emit `lvalue = rhs` as per-component stores when:
     *   - LHS is vec-typed
     *   - RHS would allocate a fresh vec object under inlined emit
     *     (binop, unop, vecN constructor, POLY_FN intrinsic with vec result)
     *   - Every component lowers safely
     *
     *  Saves one object allocation per assignment in the hot path. The
     *  lvalue target is captured once into a local before any component
     *  store, and component values are captured into N scalar temps
     *  before any write fires — together these make the transform safe
     *  for accumulator (`acc = acc + ...`) AND swizzle-rotate
     *  (`v = vec3(v.y, v.z, v.x)`) patterns alike.
     *
     *  Returns true if the write-through was emitted; false if the caller
     *  should fall back to the normal `target = expr(value)` form.
     */
    tryEmitVecWriteThrough(target, value) {
        const t = target.resolvedType;
        if (t?.kind !== 'vec') return false;
        // Eligible RHS shapes:
        //   - fresh vec exprs (binop / unop / vecN ctor / POLY_FN with vec result):
        //     write-through saves the object-literal allocation
        //   - scalarized-ident: write-through is the *only* way to lower
        //     (the ident has no whole-vec JS binding to ref-assign)
        const rhsIsScalarized = value.kind === 'ident' && this.scalarized.has(value.name);
        if (!rhsIsScalarized && !isFreshVecExpr(value)) return false;
        if (!isComponentSafe(value)) return false;
        const n = t.n;
        const comps = ['x', 'y', 'z', 'w'].slice(0, n);
        const compExprs = comps.map(c => this.exprComp(value, c));
        if (compExprs.some(x => x == null)) return false;

        const lhsStr = this.lvalue(target);
        // Block scope so temps are local and V8 can elide them. Capture
        // the lvalue object reference once so we only hit the IC chain
        // for `bindings.foo[i]` resolution a single time, not N times.
        this.line(`{`);
        this.open();
        if (target.kind !== 'ident') {
            this.line(`const _wlv = ${lhsStr};`);
            for (let i = 0; i < n; i++) {
                this.line(`const _wt${i} = ${compExprs[i]};`);
            }
            for (let i = 0; i < n; i++) {
                this.line(`_wlv.${comps[i]} = _wt${i};`);
            }
        } else {
            // Plain local ident — no lookup chain, skip the _wlv cache.
            for (let i = 0; i < n; i++) {
                this.line(`const _wt${i} = ${compExprs[i]};`);
            }
            for (let i = 0; i < n; i++) {
                this.line(`${lhsStr}.${comps[i]} = _wt${i};`);
            }
        }
        this.close();
        this.line(`}`);
        return true;
    }

    // ── Statements ─────────────────────────────────────────────────
    stmt(s, inEntry = false) {
        switch (s.kind) {
            case 'block':
                this.line('{');
                this.open();
                this.localScopes.push(new Set());
                for (const x of s.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                this.line('}');
                break;

            case 'let': {
                this.declareLocal(s.name);
                const arity = this.scalarized.get(s.name);
                if (arity != null) this.emitScalarizedLet(s.name, s.value, arity, 'const');
                else this.line(`const ${_safe(s.name)} = ${this.expr(s.value)};`);
                break;
            }

            case 'var':
                this.declareLocal(s.name);
                if (s.value != null)
                    this.line(`let ${_safe(s.name)} = ${this.expr(s.value)};`);
                else
                    this.line(`let ${_safe(s.name)} = ${this.defaultInit(s.type || { kind: 'type_scalar', name: 'f32' })};`);
                break;

            case 'const': {
                this.declareLocal(s.name);
                const arity = this.scalarized.get(s.name);
                if (arity != null) this.emitScalarizedLet(s.name, s.value, arity, 'const');
                else this.line(`const ${_safe(s.name)} = ${this.expr(s.value)};`);
                break;
            }

            case 'assign': {
                if (this.tryEmitVecWriteThrough(s.target, s.value)) break;
                const target = this.lvalue(s.target);
                this.line(`${target} = ${this.expr(s.value)};`);
                break;
            }

            case 'compound': {
                const target = this.lvalue(s.target);
                const op = s.op.slice(0, -1); // strip trailing '='
                if (POLY_BIN.has(op)) {
                    const helper = POLY_BIN_NAME[op];
                    this.line(`${target} = rt.${helper}(${target}, ${this.expr(s.value)});`);
                } else {
                    this.line(`${target} ${s.op} ${this.expr(s.value)};`);
                }
                break;
            }

            case 'postfix': {
                const target = this.lvalue(s.target);
                this.line(`${target}${s.op};`);
                break;
            }

            case 'if': {
                this.line(`if (${this.expr(s.cond)}) {`);
                this.open();
                this.localScopes.push(new Set());
                for (const x of s.then.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                if (s.else) {
                    if (s.else.kind === 'if') {
                        // else-if chain — re-enter recursively but
                        // tag the leading `else `.
                        this.lineRaw('} else ');
                        // Append the next "if" inline by mutating last line.
                        this.appendIf(s.else, inEntry);
                    } else {
                        this.line('} else {');
                        this.open();
                        this.localScopes.push(new Set());
                        for (const x of s.else.stmts) this.stmt(x, inEntry);
                        this.localScopes.pop();
                        this.close();
                        this.line('}');
                    }
                } else {
                    this.line('}');
                }
                break;
            }

            case 'for': {
                this.localScopes.push(new Set());
                const initStr = s.init ? this.forStmtInline(s.init) : '';
                const condStr = s.cond ? this.expr(s.cond) : '';
                const updStr  = s.update ? this.forUpdateInline(s.update) : '';
                this.line(`for (${initStr}; ${condStr}; ${updStr}) {`);
                this.open();
                for (const x of s.body.stmts) this.stmt(x, inEntry);
                this.close();
                this.line('}');
                this.localScopes.pop();
                break;
            }

            case 'while':
                this.line(`while (${this.expr(s.cond)}) {`);
                this.open();
                this.localScopes.push(new Set());
                for (const x of s.body.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                this.line('}');
                break;

            case 'loop':
                // Walking-skeleton coverage: `loop { ... }` only,
                // continuing block ignored for now.
                this.line('while (true) {');
                this.open();
                this.localScopes.push(new Set());
                for (const x of s.body.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                this.line('}');
                break;

            case 'switch': {
                this.line(`switch (${this.expr(s.selector)}) {`);
                this.open();
                for (const c of s.cases) {
                    if (c.values === 'default') {
                        this.line('default: {');
                    } else {
                        for (const v of c.values) {
                            if (v.kind === 'default') this.line('default: ');
                            else this.line(`case ${this.expr(v)}: `);
                        }
                        this.line('{');
                    }
                    this.open();
                    this.localScopes.push(new Set());
                    for (const x of c.body.stmts) this.stmt(x, inEntry);
                    this.localScopes.pop();
                    this.line('break;');
                    this.close();
                    this.line('}');
                }
                this.close();
                this.line('}');
                break;
            }

            case 'return':
                if (inEntry) {
                    // Inside an entry point, `return` means "stop this
                    // invocation" — break to the labeled invocation
                    // block (continuing the for-loop on the next line).
                    this.line(`break __invocation;`);
                } else {
                    this.line(`return${s.value ? ' ' + this.expr(s.value) : ''};`);
                }
                break;

            case 'break':    this.line('break;');    break;
            case 'continue': this.line('continue;'); break;

            case 'labeled': {
                // Synthesized by inline pass. Hoist the result binding(s)
                // immediately before the labeled block:
                //   - vec return: per-component lets + register as scalarized
                //     so downstream reads route through exprComp's SROA path
                //   - scalar / mat / void return: single mutable JS let
                if (s.scalarized && s.arity > 0) {
                    const comps = ['x', 'y', 'z', 'w'].slice(0, s.arity);
                    const decls = comps.map(c => `${s.resultName}_${c}`).join(', ');
                    this.line(`let ${decls};`);
                    // Register so emitMember / exprComp / emitIdent take the
                    // scalarized fast paths for any read of the result name.
                    this.scalarized.set(s.resultName, s.arity);
                    for (const c of comps) this.declareLocal(`${s.resultName}_${c}`);
                } else if (s.resultName) {
                    this.line(`let ${s.resultName};`);
                    this.declareLocal(s.resultName);
                }
                this.line(`${s.label}: {`);
                this.open();
                this.localScopes.push(new Set());
                for (const x of s.body.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                this.line(`}`);
                break;
            }

            case 'break_label':
                this.line(`break ${s.label};`);
                break;

            case 'inline_return_set': {
                // Synthesized by inline pass for non-void helper returns.
                // Two paths:
                //   - scalarized vec result: per-component stores via
                //     exprComp, capturing each component into a tmp first
                //     so swizzle-rotate-style returns (`return vec3(v.y,
                //     v.z, v.x)`) are safe under self-reference. Zero vec
                //     allocations on the return path.
                //   - scalar / mat / unscalarizable result: direct whole-
                //     object assign; never write-through, since the JS
                //     let was hoisted uninitialized.
                if (s.scalarized && s.arity > 0) {
                    const comps = ['x', 'y', 'z', 'w'].slice(0, s.arity);
                    const compExprs = isComponentSafe(s.value)
                        ? comps.map(c => this.exprComp(s.value, c))
                        : null;
                    if (compExprs && compExprs.every(x => x != null)) {
                        for (let i = 0; i < s.arity; i++) {
                            this.line(`const _ir${i} = ${compExprs[i]};`);
                        }
                        for (let i = 0; i < s.arity; i++) {
                            this.line(`${s.resultName}_${comps[i]} = _ir${i};`);
                        }
                    } else {
                        // Couldn't lower component-wise (intrinsic call etc.);
                        // materialize once, then split into the scalarized
                        // result lets. Still saves the per-call frame and
                        // allocates one vec object instead of N (the helper
                        // intermediates were already SROA'd above).
                        this.line(`const _ir_obj = ${this.expr(s.value)};`);
                        for (let i = 0; i < s.arity; i++) {
                            this.line(`${s.resultName}_${comps[i]} = _ir_obj.${comps[i]};`);
                        }
                    }
                } else {
                    this.line(`${s.resultName} = ${this.expr(s.value)};`);
                }
                this.line(`break ${s.label};`);
                break;
            }

            case 'discard':
                // `discard` is fragment-only. We don't really execute
                // fragment shaders CPU-side; emit a plain return so the
                // surrounding fn unwinds correctly inside or outside an
                // entry block. (For compute, `discard` is invalid WGSL
                // and won't appear in real input.)
                this.line(inEntry ? 'break __invocation;' : 'return;');
                break;

            case 'expr_stmt':
                this.line(`${this.expr(s.expr)};`);
                break;

            default:
                throw new WGSLError(`emit: unknown stmt kind '${s.kind}'`,
                    s.loc?.line ?? 0, s.loc?.col ?? 0);
        }
    }

    /** Append raw text without indent (used for `else` join). */
    lineRaw(s) { this.out.push('    '.repeat(this.indent) + s.replace(/\n$/, '')); }

    /** Render an `if` chain continuing from a prior `}` else. */
    appendIf(node, inEntry) {
        // We just placed `} else ` — append `if (cond) {` on same line.
        const i = this.out.length - 1;
        this.out[i] = this.out[i] + `if (${this.expr(node.cond)}) {`;
        this.open();
        this.localScopes.push(new Set());
        for (const x of node.then.stmts) this.stmt(x, inEntry);
        this.localScopes.pop();
        this.close();
        if (node.else) {
            if (node.else.kind === 'if') {
                this.lineRaw('} else ');
                this.appendIf(node.else, inEntry);
            } else {
                this.line('} else {');
                this.open();
                this.localScopes.push(new Set());
                for (const x of node.else.stmts) this.stmt(x, inEntry);
                this.localScopes.pop();
                this.close();
                this.line('}');
            }
        } else {
            this.line('}');
        }
    }

    /** Render a for-init statement inline (no leading indent / trailing ;). */
    forStmtInline(s) {
        switch (s.kind) {
            case 'let':
                this.declareLocal(s.name);
                return `let ${_safe(s.name)} = ${this.expr(s.value)}`;
            case 'var':
                this.declareLocal(s.name);
                return `let ${_safe(s.name)} = ${s.value != null ? this.expr(s.value) : '0'}`;
            case 'assign':
                return `${this.lvalue(s.target)} = ${this.expr(s.value)}`;
            case 'compound': {
                const op = s.op.slice(0, -1);
                if (POLY_BIN.has(op)) {
                    const helper = POLY_BIN_NAME[op];
                    return `${this.lvalue(s.target)} = rt.${helper}(${this.lvalue(s.target)}, ${this.expr(s.value)})`;
                }
                return `${this.lvalue(s.target)} ${s.op} ${this.expr(s.value)}`;
            }
            case 'postfix':
                return `${this.lvalue(s.target)}${s.op}`;
            case 'expr_stmt':
                return this.expr(s.expr);
        }
        throw new WGSLError(`emit: bad for-init kind '${s.kind}'`,
            s.loc?.line ?? 0, s.loc?.col ?? 0);
    }
    forUpdateInline(s) { return this.forStmtInline(s); }

    declareLocal(name) {
        const top = this.localScopes[this.localScopes.length - 1];
        if (top) top.add(name);
    }

    isLocal(name) {
        for (let i = this.localScopes.length - 1; i >= 0; i--) {
            if (this.localScopes[i].has(name)) return true;
        }
        return false;
    }

    // ── Expressions → JS strings ──────────────────────────────────
    expr(e) {
        switch (e.kind) {
            case 'lit':   return this.emitLit(e);
            case 'ident': return this.emitIdent(e);
            case 'bin':   return this.emitBin(e);
            case 'una':   return this.emitUna(e);
            case 'call':  return this.emitCall(e);
            case 'member':return this.emitMember(e);
            case 'index': return this.emitIndex(e);
            case 'paren': return `(${this.expr(e.value)})`;
        }
        throw new WGSLError(`emit: unknown expr kind '${e.kind}'`,
            e.loc?.line ?? 0, e.loc?.col ?? 0);
    }

    emitLit(e) {
        if (e.raw === 'true' || e.raw === 'false') return e.raw;
        // Numeric — strip suffix, return as JS number literal.
        let txt = e.raw;
        // Hex stays as-is, with leading 0x.
        return txt;
    }

    emitIdent(e) {
        const name = e.name;
        // SROA: scalarized locals don't exist as a single JS binding.
        // Whole-vec uses (passed to fn, polymorphic rt.* fallback, etc.)
        // rematerialize via rt.vecN — this is the safety net for uses
        // that the pre-pass didn't filter to the scalar fast path.
        // Real win comes from exprComp / write-through skipping this
        // path entirely.
        if (this.scalarized.has(name)) {
            const n = this.scalarized.get(name);
            const parts = ['x', 'y', 'z', 'w'].slice(0, n)
                .map(c => `${_safe(name)}_${c}`);
            return `rt.vec${n}(${parts.join(', ')})`;
        }
        // Locals, constants, and user fns are emitted as bare idents
        // (possibly escaped). Globals living on `bindings`/`wg`/`priv`
        // use member access on those container objects — no escape
        // needed since `.in` etc. are valid JS member accessors.
        if (this.isLocal(name)) return _safe(name);
        if (this.bindings.has(name))    return `bindings.${name}`;
        if (this.workgroupVars.has(name)) return `wg.${name}`;
        if (this.privateVars.has(name))   return `priv.${name}`;
        if (this.constants.has(name))   return _safe(name);
        if (this.fns.has(name))         return _safe(name);
        // Unknown — likely a built-in constant or runtime intrinsic.
        return name;
    }

    emitBin(e) {
        const op = e.op;
        if (POLY_BIN.has(op)) {
            const lt = e.lhs?.resolvedType;
            const rt = e.rhs?.resolvedType;

            // Scalar ↔ scalar → pure inline. Zero allocation, no fn call.
            if (lt?.kind === 'scalar' && rt?.kind === 'scalar') {
                return `(${this.expr(e.lhs)} ${op} ${this.expr(e.rhs)})`;
            }

            // Vec involvement → component-wise object literal. Saves the
            // allocation chain that polymorphic rt.add/sub/mul/div builds
            // up across nested vec expressions (one allocation per binop
            // baseline, one allocation per containing assignment with
            // component lowering). Only safe to recurse if both operands
            // are side-effect-free — otherwise a fn call could fire N
            // times instead of once. `isComponentSafe` gates that.
            const lvec = lt?.kind === 'vec' ? lt : null;
            const rvec = rt?.kind === 'vec' ? rt : null;
            const vec  = lvec ?? rvec;
            if (vec
                && (!lvec || isComponentSafe(e.lhs))
                && (!rvec || isComponentSafe(e.rhs))) {
                const comps = ['x', 'y', 'z', 'w'].slice(0, vec.n);
                const parts = comps.map(c => {
                    const ls = lvec ? this.exprComp(e.lhs, c) : this.expr(e.lhs);
                    const rs = rvec ? this.exprComp(e.rhs, c) : this.expr(e.rhs);
                    if (ls == null || rs == null) return null;
                    return `${c}:(${ls} ${op} ${rs})`;
                });
                if (parts.every(p => p != null)) return `{${parts.join(', ')}}`;
            }

            // Mat ops, unresolved types, unsafe vec subexprs → polymorphic.
            return `rt.${POLY_BIN_NAME[op]}(${this.expr(e.lhs)}, ${this.expr(e.rhs)})`;
        }
        // Logical/relational/bitwise — plain JS operators are fine
        // for scalars. (Vec relational ops not yet handled.)
        return `(${this.expr(e.lhs)} ${op} ${this.expr(e.rhs)})`;
    }

    /** Emit the JS source for the c-th component of a vec-typed expression.
     *  Returns null when the node can't be lowered safely (caller falls
     *  back to materializing the whole vec and indexing).
     *
     *  This is the trick that makes vec arithmetic actually fast: when an
     *  assignment like `acc = (av * U.k + bv) * U.k - av;` is emitted as
     *  a single `{x: ..., y: ..., z: ...}` object literal, every component
     *  is a pure scalar expression with no intermediate vec allocations.
     *  Baseline polymorphic emit allocates one object per binary op (4 for
     *  the example above); inlined emit allocates one per assignment. */
    exprComp(e, c) {
        if (!e) return null;
        switch (e.kind) {
            case 'paren':
                return this.exprComp(e.value, c);
            case 'ident':
                // SROA: scalarized locals expose components as separate
                // scalar bindings, so component access never goes through
                // a vec object.
                if (this.scalarized.has(e.name)) {
                    return `${_safe(e.name)}_${c}`;
                }
                return `${this.identSource(e.name)}.${c}`;
            case 'member': {
                const vt = e.value?.resolvedType;
                if (vt?.kind === 'vec') {
                    // Multi-char swizzle: pick the source component at index c.
                    const swiz = e.name;
                    if (swiz.length === 1) return null;  // shouldn't reach
                    const idx = { x: 0, y: 1, z: 2, w: 3 }[c];
                    if (idx >= swiz.length) return null;
                    const srcChar = SWIZZLE_MAP[swiz[idx]];
                    return this.exprComp(e.value, srcChar);
                }
                // Struct member typed as vec, or unknown — materialize.
                return `(${this.expr(e)}).${c}`;
            }
            case 'bin': {
                if (!POLY_BIN.has(e.op)) return null;
                const lt = e.lhs?.resolvedType;
                const rt = e.rhs?.resolvedType;
                const lvec = lt?.kind === 'vec';
                const rvec = rt?.kind === 'vec';
                const ls = lvec ? this.exprComp(e.lhs, c) : this.expr(e.lhs);
                const rs = rvec ? this.exprComp(e.rhs, c) : this.expr(e.rhs);
                if (ls == null || rs == null) return null;
                return `(${ls} ${e.op} ${rs})`;
            }
            case 'una': {
                if (e.op !== '+' && e.op !== '-') return null;
                const vt = e.value?.resolvedType;
                const sub = vt?.kind === 'vec'
                    ? this.exprComp(e.value, c)
                    : this.expr(e.value);
                return sub != null ? `(${e.op}${sub})` : null;
            }
            case 'call': {
                const name = e.callee;
                // vecN constructor: c-th arg, or splat from a single arg.
                if (/^vec[234]$/.test(name) || /^vec[234][fuih]$/.test(name)) {
                    const idx = { x: 0, y: 1, z: 2, w: 3 }[c];
                    if (e.args.length === 1) {
                        const a0 = e.args[0];
                        if (a0.resolvedType?.kind === 'vec') return this.exprComp(a0, c);
                        return this.expr(a0);
                    }
                    if (idx < e.args.length) return this.expr(e.args[idx]);
                    return null;
                }
                // Anything else: materialize (safe — call evaluated once
                // per the outer materialization, then indexed N times,
                // which is fine since the result is a plain object).
                return `(${this.expr(e)}).${c}`;
            }
            case 'index':
            case 'lit':
                // Indexed access and literals: materialize.
                return `(${this.expr(e)}).${c}`;
        }
        return null;
    }

    /** Identifier → JS source. Same dispatch as the `ident` arm of
     *  `expr()` but without recursing, so `exprComp` can reuse it for
     *  member-style component lookup. */
    identSource(name) {
        // SROA: scalarized locals don't exist as a single JS binding.
        // Safety net for paths that reach identSource without going
        // through exprComp's scalarized fast path — rematerialize.
        if (this.scalarized.has(name)) {
            const n = this.scalarized.get(name);
            const parts = ['x', 'y', 'z', 'w'].slice(0, n)
                .map(c => `${_safe(name)}_${c}`);
            return `rt.vec${n}(${parts.join(', ')})`;
        }
        if (this.isLocal(name))            return _safe(name);
        if (this.bindings.has(name))       return `bindings.${name}`;
        if (this.workgroupVars.has(name))  return `wg.${name}`;
        if (this.privateVars.has(name))    return `priv.${name}`;
        if (this.constants.has(name))      return _safe(name);
        if (this.fns.has(name))            return _safe(name);
        return name;
    }

    emitUna(e) {
        const v = this.expr(e.value);
        if (e.op === '&') {
            // Address-of: only meaningful for atomic ops; emit a handle.
            // The argument is expected to be an Index or Member; lower
            // it to rt.addressOf(container, key).
            return this.addressOfExpr(e.value);
        }
        if (e.op === '*') {
            // Pointer dereference — pointers are just the underlying
            // value in our model. So `(*p)[i]` is `p[i]`.
            return v;
        }
        return `(${e.op}${v})`;
    }

    /** Lower `&expr` into `rt.addressOf(container, key)`.
     *  Routes a few cases:
     *  - `&buf[i]` → addressOf(bindings.buf, i)  for arrays
     *  - `&singleAtomic` (storage binding declared as `atomic<T>`) →
     *      addressOf(bindings.name, 0): the caller passes a tiny
     *      indexable container `[v]` to give the address a place to
     *      live, since JS can't return a writable reference to a
     *      plain property otherwise.
     *  - `&wgAtomic` (workgroup-local atomic) → addressOf(wg, 'name')
     *  - `&struct.field` → addressOf(structExpr, 'field') */
    addressOfExpr(e) {
        if (e.kind === 'index') {
            return `rt.addressOf(${this.expr(e.value)}, ${this.expr(e.index)})`;
        }
        if (e.kind === 'member') {
            return `rt.addressOf(${this.expr(e.value)}, ${JSON.stringify(e.name)})`;
        }
        if (e.kind === 'ident') {
            const name = e.name;
            if (this.bindings.has(name)) {
                const b = this.bindings.get(name);
                if (b.type.kind === 'type_atomic') {
                    // Scalar storage atomic — caller passes [v]; we
                    // address into that single-element container.
                    return `rt.addressOf(bindings.${name}, 0)`;
                }
                return `rt.addressOf(bindings, ${JSON.stringify(name)})`;
            }
            if (this.workgroupVars.has(name)) {
                return `rt.addressOf(wg, ${JSON.stringify(name)})`;
            }
            if (this.privateVars.has(name)) {
                return `rt.addressOf(priv, ${JSON.stringify(name)})`;
            }
            if (this.isLocal(name)) {
                // `&local` for a struct/object local: pass the object
                // reference directly. JS objects are mutable, so
                // `(*ptr).field = x` (emitted as `ptr.field = x`) will
                // propagate back to the original. For *scalar* locals
                // this is a known limitation (mutations through the
                // pointer won't write back) but the common usage in
                // plasma+geon is struct accumulators, which work.
                return _safe(name);
            }
            throw new WGSLError(`addressOf: unknown ident '${name}'`,
                e.loc?.line ?? 0, e.loc?.col ?? 0);
        }
        throw new WGSLError(`addressOf: unsupported operand`,
            e.loc?.line ?? 0, e.loc?.col ?? 0);
    }

    emitCall(e) {
        const callee = e.callee;
        const args = e.args.map(a => this.expr(a)).join(', ');

        // Vec constructor: vec4<f32>(...), vec3f(...), vec2(...).
        // Match shape from typeArgs or shorthand suffix.
        if (e.typeArgs && (callee === 'vec2' || callee === 'vec3' || callee === 'vec4')) {
            return `rt.${callee}(${args})`;
        }
        if (callee.startsWith('vec') && /^vec[234][fuih]?$/.test(callee)) {
            return `rt.${callee.slice(0, 4)}(${args})`;
        }

        // Scalar type casts: f32(x), i32(x), u32(x), bool(x).
        if (SCALAR_TYPE_IDENTS.has(callee)) {
            return `rt.${callee}(${args})`;
        }

        // bitcast<T>(x) → rt.bitcast_<T>_<from>(x). We don't track
        // source type here, so use the runtime to pick: for now,
        // hard-route to f32→u32 (the form plasma uses); generalize
        // once a type-resolver pass exists.
        if (callee === 'bitcast') {
            const t = e.typeArgs?.[0];
            if (t?.kind === 'type_scalar' && t.name === 'u32')
                return `rt.bitcast_u32_f32(${args})`;
            if (t?.kind === 'type_scalar' && t.name === 'f32')
                return `rt.bitcast_f32_u32(${args})`;
            if (t?.kind === 'type_scalar' && t.name === 'i32')
                return `rt.bitcast_i32_f32(${args})`;
        }

        // Array constructor: array<T, N>(...) builds a typed array.
        // For element type vec4<f32>, an "array" is also a flat backing
        // buffer per our storage convention — but as a return value
        // we'll surface it as a JS array of vecs/structs for now.
        if (callee === 'array') {
            return `[${args}]`;
        }

        // workgroupBarrier / storageBarrier — call runtime stub.
        if (callee === 'workgroupBarrier' || callee === 'storageBarrier') {
            return `rt.${callee}()`;
        }

        // Atomic intrinsics: atomicLoad/Store/Add/...
        if (callee.startsWith('atomic')) {
            return `rt.${callee}(${args})`;
        }

        // Element-wise math intrinsics. Inline as direct Math.* / scalar
        // JS when all args are scalar; component-wise object literal when
        // all args are vec of matching shape; fall back to polymorphic
        // rt.* dispatch for mixed-shape, unresolved, or unsafe (i.e.
        // anything with side-effecting subexprs that would fire N times
        // under component lowering) cases.
        if (POLY_FN.has(callee) && SCALAR_INTRINSIC_JS[callee]) {
            const types = e.args.map(a => a?.resolvedType);
            const allScalar  = types.length > 0 && types.every(t => t?.kind === 'scalar');
            const firstVecN  = types[0]?.kind === 'vec' ? types[0].n : null;
            const allVecSame = firstVecN != null
                && types.every(t => t?.kind === 'vec' && t.n === firstVecN);
            if (allScalar) {
                const argStrs = e.args.map(a => this.expr(a));
                return SCALAR_INTRINSIC_JS[callee](argStrs);
            }
            if (allVecSame && e.args.every(isComponentSafe)) {
                const comps = ['x', 'y', 'z', 'w'].slice(0, firstVecN);
                const parts = comps.map(c => {
                    const cArgs = e.args.map(a => this.exprComp(a, c));
                    if (cArgs.some(x => x == null)) return null;
                    return `${c}:${SCALAR_INTRINSIC_JS[callee](cArgs)}`;
                });
                if (parts.every(p => p != null)) return `{${parts.join(', ')}}`;
            }
            // Fall through to polymorphic.
        }
        if (POLY_FN.has(callee)) {
            return `rt.${callee}(${args})`;
        }

        // select(a, b, cond) → rt.select (note WGSL argument order).
        if (callee === 'select') {
            return `rt.select(${args})`;
        }

        // Struct constructor (struct name with args).
        if (this.structs.has(callee)) {
            const s = this.structs.get(callee);
            const argList = e.args.map(a => this.expr(a));
            const parts = s.fields.map((f, i) =>
                `${f.name}: ${argList[i] ?? this.defaultInit(f.type)}`);
            return `{ ${parts.join(', ')} }`;
        }

        // User-defined function call.
        return `${callee}(${args})`;
    }

    emitMember(e) {
        const name = e.name;
        // ── Swizzles ─────────────────────────────────────────────
        // WGSL allows `.x/.y/.z/.w` and `.r/.g/.b/.a` for single
        // components, and multi-char combinations like `.xyz`,
        // `.rgba`, `.wzyx` as vec constructors.
        // Heuristic: if name is 1-4 chars of [xyzwrgba] (without
        // mixing the two halves), treat as a swizzle.
        if (name.length >= 1 && name.length <= 4 &&
                /^[xyzw]+$|^[rgba]+$/.test(name)) {
            // SROA fast path: scalarized vec ident → direct scalar read,
            // or rt.vecN over scalar locals for multi-char swizzles.
            // Without this, scalar uses of `v.x` would rematerialize
            // `rt.vec3(v_x, v_y, v_z).x` once per access — defeating
            // the whole point of scalarization.
            if (e.value.kind === 'ident' && this.scalarized.has(e.value.name)) {
                const sname = e.value.name;
                const comps = [...name].map(c => SWIZZLE_MAP[c]);
                if (comps.length === 1) {
                    return `${_safe(sname)}_${comps[0]}`;
                }
                const parts = comps.map(c => `${_safe(sname)}_${c}`);
                return `rt.vec${comps.length}(${parts.join(', ')})`;
            }
            const target = this.expr(e.value);
            const comps = [...name].map(c => SWIZZLE_MAP[c]);
            if (comps.length === 1) return `${target}.${comps[0]}`;
            // Multi-component swizzle. Evaluate target into a temp to
            // avoid re-evaluation; for simple ident expressions this is
            // a no-op since the value is already a variable read.
            if (e.value.kind === 'ident' || e.value.kind === 'member' ||
                    e.value.kind === 'index') {
                const args = comps.map(c => `${target}.${c}`).join(', ');
                return `rt.vec${comps.length}(${args})`;
            }
            // Fall through: wrap in IIFE to capture once.
            const args = comps.map(c => `_v.${c}`).join(', ');
            return `((_v) => rt.vec${comps.length}(${args}))(${target})`;
        }
        // Ordinary struct field / vec component named `.x` etc.
        return `${this.expr(e.value)}.${name}`;
    }

    emitIndex(e) {
        // Index access: arr[i]. For storage buffers of vec types the
        // caller must pass an array of vecs, OR use rt.loadElem. For
        // walking skeleton, use direct index access for both.
        return `${this.expr(e.value)}[${this.expr(e.index)}]`;
    }

    /** L-value form for assignment targets. */
    lvalue(e) { return this.expr(e); }
}

//#endregion


//#region 4. RUNTIME  ─────────────────────────────────────────────────

/** Float ↔ uint bitcast scratch space. Shared across all callers. */
const _bitBuf = new ArrayBuffer(8);
const _f32 = new Float32Array(_bitBuf);
const _u32 = new Uint32Array(_bitBuf);
const _i32 = new Int32Array(_bitBuf);

/** True if `x` is one of the {x,y,[z],[w]} vec shapes we emit. */
const _isVec = (x) => x !== null && typeof x === 'object' && 'x' in x && 'y' in x;
/** Apply a scalar-binary op `f` element-wise, broadcasting scalars. */
const _binOp = (a, b, f) => {
    if (!_isVec(a) && !_isVec(b)) return f(a, b);
    if (_isVec(a) && _isVec(b)) {
        const o = { x: f(a.x, b.x), y: f(a.y, b.y) };
        if ('z' in a) o.z = f(a.z, b.z);
        if ('w' in a) o.w = f(a.w, b.w);
        return o;
    }
    if (_isVec(a)) {
        const o = { x: f(a.x, b), y: f(a.y, b) };
        if ('z' in a) o.z = f(a.z, b);
        if ('w' in a) o.w = f(a.w, b);
        return o;
    }
    const o = { x: f(a, b.x), y: f(a, b.y) };
    if ('z' in b) o.z = f(a, b.z);
    if ('w' in b) o.w = f(a, b.w);
    return o;
};
/** Apply a scalar fn elementwise (single vec arg, or pass-through scalar). */
const _mapOp = (a, f) => {
    if (!_isVec(a)) return f(a);
    const o = { x: f(a.x), y: f(a.y) };
    if ('z' in a) o.z = f(a.z);
    if ('w' in a) o.w = f(a.w);
    return o;
};

/**
 * Runtime helpers exposed to emitted code. Kept tiny — most WGSL
 * intrinsics map directly to JS Math functions. Vec types are
 * `{x, y, [z], [w]}` objects; matrix types reserved for later.
 *
 * Polymorphic ops (`add/sub/mul/div/mod`, and most math intrinsics)
 * accept any combination of scalar / vec inputs and broadcast where
 * needed. Slower than inline scalar code; correctness first,
 * performance after a type-resolver pass lands.
 */
export const runtime = {
    // ── Type constructors ──────────────────────────────────────────
    vec2: (x = 0, y) => (y === undefined ? { x, y: x } : { x, y }),
    vec3: (x = 0, y, z) => (y === undefined ? { x, y: x, z: x }
                                            : { x, y, z: z ?? 0 }),
    vec4: (x = 0, y, z, w) => (y === undefined ? { x, y: x, z: x, w: x }
                                               : { x, y, z: z ?? 0, w: w ?? 0 }),

    // ── Scalar casts ───────────────────────────────────────────────
    // Note: WGSL `f32(x)` rounds-to-nearest-even at the f32 type.
    // Math.fround is the standard JS f32 rounding step.
    f32: (x) => Math.fround(+x),
    i32: (x) => (+x) | 0,
    u32: (x) => (+x) >>> 0,
    bool: (x) => !!x,

    // ── Polymorphic arithmetic (scalar ↔ vec broadcast) ────────────
    add: (a, b) => _binOp(a, b, (x, y) => x + y),
    sub: (a, b) => _binOp(a, b, (x, y) => x - y),
    mul: (a, b) => _binOp(a, b, (x, y) => x * y),
    div: (a, b) => _binOp(a, b, (x, y) => x / y),
    mod: (a, b) => _binOp(a, b, (x, y) => x - y * Math.trunc(x / y)),  // WGSL: trunc-toward-zero

    // ── Math intrinsics (polymorphic) ──────────────────────────────
    max: (a, b) => _binOp(a, b, Math.max),
    min: (a, b) => _binOp(a, b, Math.min),
    abs: (a)    => _mapOp(a, Math.abs),
    sqrt:(a)    => _mapOp(a, Math.sqrt),
    sign:(a)    => _mapOp(a, Math.sign),
    floor:(a)   => _mapOp(a, Math.floor),
    ceil: (a)   => _mapOp(a, Math.ceil),
    round:(a)   => _mapOp(a, Math.round),
    fract:(a)   => _mapOp(a, (x) => x - Math.floor(x)),
    trunc:(a)   => _mapOp(a, Math.trunc),
    exp:  (a)   => _mapOp(a, Math.exp),
    log:  (a)   => _mapOp(a, Math.log),
    exp2: (a)   => _mapOp(a, (x) => Math.pow(2, x)),
    log2: (a)   => _mapOp(a, Math.log2),
    pow:  (a, b) => _binOp(a, b, Math.pow),
    sin:  (a)   => _mapOp(a, Math.sin),
    cos:  (a)   => _mapOp(a, Math.cos),
    tan:  (a)   => _mapOp(a, Math.tan),
    atan: (a)   => _mapOp(a, Math.atan),
    atan2:(a, b) => _binOp(a, b, Math.atan2),
    clamp:(x, lo, hi) => _binOp(_binOp(x, lo, Math.max), hi, Math.min),
    mix:  (a, b, t)  => _binOp(a, _binOp(_binOp(b, a, (q, w) => q - w), t, (q, w) => q * w), (q, w) => q + w),
    step: (edge, x)  => _binOp(edge, x, (e, v) => v < e ? 0 : 1),
    smoothstep: (e0, e1, x) => {
        const t = _binOp(_binOp(x, e0, (a, b) => a - b),
                         _binOp(e1, e0, (a, b) => a - b),
                         (a, b) => Math.max(0, Math.min(1, a / b)));
        return _binOp(_binOp(t, t, (a, b) => a * b),
                      _binOp(_mapOp(t, (a) => 3 - 2 * a), 1, (a) => a),
                      (a, b) => a * b);
    },

    // ── WGSL `select(a, b, cond)` returns b if cond else a. ───────
    // NB: WGSL's `select` puts the condition last, opposite of `?:`.
    select: (falseVal, trueVal, cond) => cond ? trueVal : falseVal,

    // ── Bitcast (round-trip via shared buffer) ─────────────────────
    bitcast_u32_f32: (f) => { _f32[0] = f; return _u32[0]; },
    bitcast_f32_u32: (u) => { _u32[0] = u >>> 0; return _f32[0]; },
    bitcast_i32_f32: (f) => { _f32[0] = f; return _i32[0]; },
    bitcast_f32_i32: (i) => { _i32[0] = i | 0; return _f32[0]; },

    // ── Atomics (single-threaded — degrade to plain ops) ──────────
    // `target` is a {ref, key} handle so we can mutate by reference.
    atomicLoad:  (t)          => t.ref[t.key],
    atomicStore: (t, v)       => { t.ref[t.key] = v; },
    atomicAdd:   (t, v)       => { const o = t.ref[t.key]; t.ref[t.key] = o + v; return o; },
    atomicSub:   (t, v)       => { const o = t.ref[t.key]; t.ref[t.key] = o - v; return o; },
    atomicMax:   (t, v)       => { const o = t.ref[t.key]; if (v > o) t.ref[t.key] = v; return o; },
    atomicMin:   (t, v)       => { const o = t.ref[t.key]; if (v < o) t.ref[t.key] = v; return o; },
    atomicAnd:   (t, v)       => { const o = t.ref[t.key]; t.ref[t.key] = o & v; return o; },
    atomicOr:    (t, v)       => { const o = t.ref[t.key]; t.ref[t.key] = o | v; return o; },
    atomicXor:   (t, v)       => { const o = t.ref[t.key]; t.ref[t.key] = o ^ v; return o; },
    atomicExchange: (t, v)    => { const o = t.ref[t.key]; t.ref[t.key] = v; return o; },
    atomicCompareExchangeWeak: (t, expected, v) => {
        const o = t.ref[t.key];
        if (o === expected) { t.ref[t.key] = v; return { old_value: o, exchanged: true }; }
        return { old_value: o, exchanged: false };
    },

    // Construct an atomic handle from an object+key pair. Emitted
    // code calls this for both global storage atomics (`&buf[i]`) and
    // workgroup-local atomics (`&wg.tile_max`).
    addressOf: (ref, key) => ({ ref, key }),

    // ── Workgroup barrier ─────────────────────────────────────────
    // Becomes a no-op marker at runtime; the emitter handles phase
    // splitting structurally, so by the time we reach this fn the
    // synchronization has already been arranged. Kept callable so
    // hand-written test harnesses don't crash.
    workgroupBarrier: () => {},
    storageBarrier:   () => {},
};

//#endregion


//#region 5. DISPATCH WRAPPER (stub)  ─────────────────────────────────

/**
 * Wrap a per-thread function body into a workgroup-grid dispatcher.
 * Future work: hook in phase splitting for workgroupBarrier(), and
 * workgroup-local memory reset between workgroups.
 *
 * @param {Function} _threadFn  Emitted per-invocation function.
 * @param {[number,number,number]} _workgroupSize  From @workgroup_size.
 * @returns {Function}
 */
export function wrapEntry(_threadFn, _workgroupSize) {
    throw new WGSLError('wrapEntry: not yet implemented', 0, 0);
}

//#endregion


//#region 6. TOP-LEVEL API  ───────────────────────────────────────────

/**
 * Compile WGSL source into an executable JS module object.
 *
 * Security note: this function constructs a JS Function from the
 * emitted source string. That dynamic compilation is intentional —
 * it IS the transpiler — and is only safe because the input is a
 * `.wgsl` file under your own control (build-time author, or runtime
 * fetched from your own origin under the existing CSP). Do not call
 * this on WGSL strings that came from network input you don't trust.
 * Build-time use (regenerate sibling `.js` once, ship the artifact)
 * sidesteps the runtime-eval concern entirely.
 *
 * @param {string} source
 * @param {{ debug?: boolean, runtime?: object }} [opts]
 * @returns {{ entry: Object<string, Function>, bindings: string[], jsSource: string }}
 */
export function compileWGSL(source, opts = {}) {
    const rt     = opts.runtime || runtime;
    const tokens = tokenize(source);
    const ast    = parse(tokens);
    // Run the resolver so the emitter sees `.resolvedType` on every
    // Expr node and can emit inline scalar/vec ops where possible.
    // `opts.polymorphic` opts out and forces the legacy rt.* dispatch
    // path — used by the bench harness to measure the speedup.
    if (!opts.polymorphic) resolveModule(ast);
    // Inline small user fns so SROA + write-through see through call
    // boundaries. Polymorphic mode skips inlining for an apples-to-
    // apples A/B with the legacy rt.* path; `opts.noInline` lets a
    // caller opt out for debugging.
    if (!opts.polymorphic && !opts.noInline) inlineModulePass(ast, opts);
    const result = emit(ast);

    // Eval target is our own deterministic emit() output — see security note above.
    // eslint-disable-next-line no-new-func -- transpiler output, see fn doc
    const factory = new Function('rt', result.body);
    const mod = factory(rt);

    if (opts.debug) {
        console.log('[wgsl-transpile] tokens:', tokens.length);
        console.log('[wgsl-transpile] entry points:', result.entryPoints);
        console.log('[wgsl-transpile] bindings:', result.bindings);
    }
    return {
        entry: mod.entry,
        bindings: mod.bindings,
        jsSource: result.jsSource,
    };
}

//#endregion
