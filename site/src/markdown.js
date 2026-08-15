// ─── Lightweight Markdown → HTML Parser ───
// Regex-based, single-pass. Supports: headings (with optional explicit
// `{#id}` anchors), fenced code blocks (with language class), iframe
// directive (fenced block with `iframe` lang — emits a same-origin iframe
// figure), switcher directive (fenced block with `switcher` lang — CSS-only
// radio-tabbed image gallery), `:::` theorem containers (recursive, with
// LaTeX-style per-section numbering), `[[label]]` cross-references,
// blockquotes (recursive), ordered/unordered lists, GFM-style pipe
// tables (no column alignment; escaped pipes are allowed in cells),
// horizontal rules, images (single or
// theme-paired via `light.png|dark.png`), links, inline code, bold,
// italic, bold-italic.
// Limitations: no nested lists, no reference-style links, no HTML
// passthrough, no setext headings.
//
// Single source of truth for all three render surfaces: the blog client
// (src/blog.js), edge SSR (worker/index.js, bundled by wrangler), and the
// build (tools/build.mjs for feeds/llms-full). Keep it isomorphic — no DOM,
// no Node APIs.

let _switcherCounter = 0;

// Depth of the current parseMarkdown() call. Blockquotes and theorem bodies
// re-enter the parser, and the math stash, switcher counter, and label table
// are module-level: resetting them on a nested entry would discard the outer
// document's state. Only depth 0 owns that state.
let _depth = 0;

/** Stash $$ and $ math delimiters before escaping, restore after. */
var _mathStash = [];
function stashMath(s) {
    _mathStash = [];
    return s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, function (m) {
        _mathStash.push(m);
        return '\x00MATH' + (_mathStash.length - 1) + '\x00';
    });
}
function unstashMath(s) {
    // Escape on the way back in. Math routinely contains `<` (`j<k`,
    // `0\le i<m`) and `&` (alignment in `aligned`); reinserted raw, the HTML
    // parser reads those as markup and eats the rest of the formula. KaTeX
    // renders from textContent, which decodes the entities again, so the
    // formula it sees is unchanged.
    return s.replace(/\x00MATH(\d+)\x00/g, function (_, i) { return mdEsc(_mathStash[i]); });
}

// ─── Theorem environments ───
// Mirrors LaTeX's `\newtheorem{theorem}{Theorem}[section]`: one counter
// shared by every numbered environment, reset at each `##` section, printed
// as `{section}.{n}`. `proof` is unnumbered.
const THEOREM_ENVS = {
    theorem: 'Theorem',
    proposition: 'Proposition',
    lemma: 'Lemma',
    corollary: 'Corollary',
    definition: 'Definition',
    remark: 'Remark',
    proof: 'Proof',
};

/** `thm:matching` → `thm-matching`; colons are legal in ids but awkward in selectors. */
function labelToId(label) {
    return label.replace(/[^\w-]+/g, '-');
}

/**
 * Parse a trailing pandoc-style attribute block: `{#id}`, `{.class}`, or
 * both. `.unnumbered` marks a heading that carries no section number, so
 * front matter can sit above the paper without renumbering it — the same
 * meaning LaTeX gives `\section*`.
 */
function splitHeadingAttrs(text) {
    const m = text.match(/\s*\{([^}]*)\}\s*$/);
    if (!m) return { text: text, id: '', unnumbered: false };
    const tokens = m[1].trim().split(/\s+/);
    let id = '';
    let unnumbered = false;
    for (const tok of tokens) {
        if (tok.charAt(0) === '#') id = tok.slice(1);
        else if (tok === '.unnumbered') unnumbered = true;
    }
    // Only treat it as an attribute block if it actually held attributes.
    if (!id && !unnumbered) return { text: text, id: '', unnumbered: false };
    return { text: text.slice(0, m.index).trim(), id: id, unnumbered: unnumbered };
}

// Populated by scanLabels() at depth 0, read by cross-references anywhere.
let _labels = {};
// Numbers assigned to numbered environments in document order. The renderer
// consumes this by index rather than recounting, so the two passes cannot
// disagree about numbering.
let _envNumbers = [];
let _envIndex = 0;

/**
 * First pass: assign section and environment numbers and record every
 * declared label. Needed because the document forward-references sections
 * from its introduction, which a single-pass renderer cannot resolve.
 * Runs on already-stashed source, so math bodies cannot be mistaken for
 * directives; only code fences need skipping.
 */
function scanLabels(lines) {
    _labels = {};
    _envNumbers = [];
    _envIndex = 0;
    let sectionNum = 0;
    let subNum = 0;
    let envNum = 0;
    let i = 0;
    const len = lines.length;

    while (i < len) {
        const fenceMatch = lines[i].match(/^(`{3,}|~{3,})/);
        if (fenceMatch) {
            const fence = fenceMatch[1];
            i++;
            while (i < len && lines[i].indexOf(fence) !== 0) i++;
            i++;
            continue;
        }

        const headingMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const attrs = splitHeadingAttrs(headingMatch[2]);
            if (!attrs.unnumbered) {
                if (level === 2) { sectionNum++; subNum = 0; envNum = 0; }
                else if (level === 3) { subNum++; }
            }
            if (attrs.id && !attrs.unnumbered) {
                _labels[attrs.id] = {
                    kind: 'Section',
                    num: level >= 3 ? sectionNum + '.' + subNum : String(sectionNum),
                };
            }
            i++;
            continue;
        }

        const dirMatch = lines[i].match(/^:::\s*([a-z]+)\s*(.*)$/);
        if (dirMatch && THEOREM_ENVS[dirMatch[1]]) {
            const env = dirMatch[1];
            if (env === 'proof') {
                _envNumbers.push('');
            } else {
                const rawExplicit = (dirMatch[2].match(/number="([^"]*)"/) || [])[1] || '';
                const explicit = rawExplicit ? mdEsc(rawExplicit) : '';
                if (!explicit) envNum++;
                const num = explicit || sectionNum + '.' + envNum;
                _envNumbers.push(num);
                const idMatch = dirMatch[2].match(/id="([^"]*)"/);
                if (idMatch && idMatch[1]) {
                    _labels[idMatch[1]] = { kind: THEOREM_ENVS[env], num: num };
                }
            }
        }
        i++;
    }
}

/**
 * Resolve a cross-reference. `[[label]]` yields the qualified form
 * (`Theorem 4.1`); `[[#label]]` yields the bare number, for prose that
 * supplies its own noun ("Sections 3–5"). Unknown labels stay visible
 * rather than failing silently.
 */
function resolveXref(ref) {
    const bare = ref.charAt(0) === '#';
    const label = bare ? ref.slice(1) : ref;
    const entry = _labels[label];
    if (!entry) return '<span class="xref-missing">[[' + mdEsc(ref) + ']]</span>';
    return '<a href="#' + labelToId(label) + '" class="xref">'
        + (bare ? entry.num : entry.kind + '&nbsp;' + entry.num) + '</a>';
}

export function mdEsc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Split a pipe-table row while treating \| as a literal pipe inside a cell.
 * An even-length run of backslashes leaves the following pipe as a delimiter;
 * an odd-length run consumes one escaping backslash and preserves the pipe.
 */
export function splitMarkdownTableRow(row) {
    let body = row.trim();
    const isEscapedPipe = (text, index) => {
        let precedingBackslashes = 0;
        for (let j = index - 1; j >= 0 && text[j] === '\\'; j--) precedingBackslashes++;
        return precedingBackslashes % 2 === 1;
    };
    if (body.startsWith('|')) body = body.slice(1);
    if (body.endsWith('|') && !isEscapedPipe(body, body.length - 1)) body = body.slice(0, -1);

    const cells = [];
    let cell = '';
    for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        if (ch !== '|') {
            cell += ch;
            continue;
        }

        if (isEscapedPipe(body, i)) {
            cell = cell.slice(0, -1) + '|';
        } else {
            cells.push(cell.trim());
            cell = '';
        }
    }
    cells.push(cell.trim());
    return cells;
}

/** Remove the minimal YAML frontmatter used by canonical content/*.md files. */
export function stripFrontmatter(src) {
    if (!src.startsWith('---\n')) return src;
    const end = src.indexOf('\n---\n', 4);
    return end === -1 ? src : src.slice(end + 5);
}

/**
 * Render one list item, honouring a leading `{#id}` anchor. Bibliography
 * entries need to be link targets, and this parser has no HTML passthrough
 * to write an anchor by hand.
 */
function renderListItem(item) {
    const anchor = item.match(/^\{#([^}]+)\}\s*/);
    const text = anchor ? item.slice(anchor[0].length) : item;
    return '<li' + (anchor ? ' id="' + labelToId(anchor[1]) + '"' : '') + '>'
        + mdInline(mdEsc(text)) + '</li>';
}

/** Reject script-scheme URLs; returns '' when unsafe. */
function mdSafeUrl(u) {
    const l = u.trim().toLowerCase();
    if (l.startsWith('javascript:') || l.startsWith('vbscript:') || l.startsWith('data:text/html')) return '';
    return u;
}

/** Process inline formatting (images, links, code, bold, italic). */
export function mdInline(src) {
    // Order matters: cross-references before images/links (all bracket-based),
    // images before links (share bracket syntax), bold-italic before bold
    // before italic to avoid partial matches
    return src
        .replace(/\[\[([^\]\n]+)\]\]/g, (_, label) => resolveXref(label.trim()))
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
            const pi = url.indexOf('|');
            if (pi !== -1) {
                const l = mdSafeUrl(url.slice(0, pi).trim());
                const d = mdSafeUrl(url.slice(pi + 1).trim());
                return '<img src="' + l + '" alt="' + alt + '" loading="lazy" class="theme-light"><img src="' + d + '" alt="' + alt + '" loading="lazy" class="theme-dark">';
            }
            return '<img src="' + mdSafeUrl(url) + '" alt="' + alt + '" loading="lazy">';
        })
        // Same-page anchors (citations, footnotes) stay in the tab; only
        // outbound links open a new one.
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
            const s = mdSafeUrl(url);
            if (!s) return text;
            if (s.charAt(0) === '#') return '<a href="' + s + '">' + text + '</a>';
            return '<a href="' + s + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
        })
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
        .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
        .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
        .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Underscore italic requires word-boundary context to avoid matching snake_case
        .replace(/(^|[\s(])_(.+?)_([\s).,!?]|$)/g, '$1<em>$2</em>$3');
}

/**
 * Convert a markdown string to HTML.
 * @param {string} src  Raw markdown text
 * @returns {string}    HTML string
 */
export function parseMarkdown(src) {
    // Blockquotes and theorem bodies re-enter this function. Only the
    // outermost call owns the module-level state: a nested call must not
    // reset the math stash (it would orphan the outer document's formulas),
    // the switcher counter (it would collide ids), or the label table.
    const isRoot = _depth === 0;
    _depth++;
    try {
        if (isRoot) {
            // Reset switcher counter so SSR + client-side renders produce
            // identical IDs for the same input (CSS-only switcher tabs use
            // these IDs to scope the radio button groups).
            _switcherCounter = 0;
            // Stash math expressions before any escaping
            src = stashMath(src);
        }
        const body = parseBlocks(src);
        return isRoot ? unstashMath(body) : body;
    } finally {
        _depth--;
    }
}

function parseBlocks(src) {
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    if (_depth === 1) scanLabels(lines);
    const html = [];
    let i = 0;
    const len = lines.length;

    while (i < len) {
        const line = lines[i];

        if (/^(`{3,}|~{3,})(.*)$/.test(line)) {
            const fence = RegExp.$1;
            const lang = RegExp.$2.trim();
            const isIframe = /^iframe(\s|$)/.test(lang);
            const code = [];
            i++;
            while (i < len && lines[i].indexOf(fence) !== 0) {
                code.push(isIframe ? lines[i] : mdEsc(lines[i]));
                i++;
            }
            i++;
            if (isIframe) {
                // Same-origin paths only. URL-safe chars; reject anything else silently.
                // Multiple non-empty body lines render as a side-by-side pair.
                const PATH_RE = /^\/[A-Za-z0-9_./?&=%#-]*$/;
                const paths = code.map(l => l.trim()).filter(Boolean).filter(l => PATH_RE.test(l));
                if (paths.length) {
                    const h = (lang.match(/height=(\d+)/) || [])[1] || '720';
                    const t = (lang.match(/title="([^"]*)"/) || [])[1] || '';
                    const c = (lang.match(/caption="([^"]*)"/) || [])[1] || t;
                    if (paths.length === 1) {
                        html.push('<figure class="iframe-figure">'
                            + '<iframe src="' + mdEsc(paths[0]) + '" title="' + mdEsc(t) + '" height="' + h + '" loading="lazy"></iframe>'
                            + (c ? '<figcaption>' + mdInline(mdEsc(c)) + '</figcaption>' : '')
                            + '</figure>');
                    } else {
                        let inner = '';
                        for (const p of paths) {
                            inner += '<div class="iframe-pair-item"><iframe src="' + mdEsc(p) + '" title="' + mdEsc(t) + '" height="' + h + '" loading="lazy"></iframe></div>';
                        }
                        html.push('<figure class="iframe-figure iframe-figure-pair">'
                            + inner
                            + (c ? '<figcaption>' + mdInline(mdEsc(c)) + '</figcaption>' : '')
                            + '</figure>');
                    }
                }
                continue;
            }
            if (/^switcher(\s|$)/.test(lang)) {
                const labelsMatch = lang.match(/labels="([^"]*)"/);
                const captionMatch = lang.match(/caption="([^"]*)"/);
                const labels = (labelsMatch ? labelsMatch[1] : '').split('|').map(l => l.trim()).filter(Boolean);
                const caption = captionMatch ? captionMatch[1] : '';
                const tabs = code.map(l => l.trim()).filter(Boolean);
                if (tabs.length) {
                    _switcherCounter++;
                    let out = '<figure class="switcher-figure"><div class="mode-toggles">';
                    for (let n = 0; n < tabs.length; n++) {
                        const label = labels[n] || ('panel ' + (n + 1));
                        out += '<button class="mode-btn' + (n === 0 ? ' active' : '') + '" data-panel="' + n + '">' + mdEsc(label) + '</button>';
                    }
                    out += '</div><div class="switcher-panels">';
                    for (let n = 0; n < tabs.length; n++) {
                        const urls = tabs[n].split('|').map(u => u.trim()).map(mdSafeUrl);
                        const lt = urls[0];
                        const dk = urls[1] || urls[0];
                        const altText = (labels[n] || '') + (caption ? ' — ' + caption : '');
                        const cls = 'switcher-panel' + (n === 0 ? ' active' : '');
                        if (lt === dk) {
                            out += '<div class="' + cls + '"><img src="' + lt + '" alt="' + mdEsc(altText) + '" loading="lazy"></div>';
                        } else {
                            out += '<div class="' + cls + '">'
                                + '<img src="' + lt + '" alt="' + mdEsc(altText) + '" loading="lazy" class="theme-light">'
                                + '<img src="' + dk + '" alt="' + mdEsc(altText) + '" loading="lazy" class="theme-dark">'
                                + '</div>';
                        }
                    }
                    out += '</div>';
                    if (caption) out += '<figcaption>' + mdInline(mdEsc(caption)) + '</figcaption>';
                    out += '</figure>';
                    html.push(out);
                }
                continue;
            }
            const langAttr = lang ? ' class="language-' + mdEsc(lang) + '"' : '';
            html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
            continue;
        }

        if (/^\s*$/.test(line)) { i++; continue; }

        // Display math block: $$ on its own line
        if (/^\$\$/.test(line) && !/^\$\$.*\$\$/.test(line)) {
            const mathLines = [line];
            i++;
            while (i < len && !/\$\$\s*$/.test(lines[i])) {
                mathLines.push(lines[i]);
                i++;
            }
            if (i < len) { mathLines.push(lines[i]); i++; }
            html.push('<p>' + unstashMath(mathLines.join('\n')) + '</p>');
            continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            // An explicit `{#label}` suffix sets the anchor and makes the
            // heading addressable by `[[label]]`; otherwise slugify the text.
            const attrs = splitHeadingAttrs(headingMatch[2]);
            const text = attrs.text;
            const slug = attrs.id
                ? labelToId(attrs.id)
                : text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
            html.push('<h' + level + ' id="' + slug + '">' + mdInline(mdEsc(text)) + '</h' + level + '>');
            i++;
            continue;
        }

        // Theorem container: `::: theorem id="thm:x" name="Optional title"`,
        // body parsed recursively, closed by a bare `:::`.
        const dirMatch = line.match(/^:::\s*([a-z]+)\s*(.*)$/);
        if (dirMatch && THEOREM_ENVS[dirMatch[1]]) {
            const env = dirMatch[1];
            const attrs = dirMatch[2];
            const id = (attrs.match(/id="([^"]*)"/) || [])[1] || '';
            const name = (attrs.match(/name="([^"]*)"/) || [])[1] || '';
            const num = _envNumbers[_envIndex++] || '';

            const bodyLines = [];
            let nesting = 0;
            i++;
            while (i < len) {
                if (/^:::\s*[a-z]/.test(lines[i])) nesting++;
                else if (/^:::\s*$/.test(lines[i])) {
                    if (nesting === 0) break;
                    nesting--;
                }
                bodyLines.push(lines[i]);
                i++;
            }
            i++;

            let head = '<span class="theorem-kind">' + THEOREM_ENVS[env]
                + (num ? '&nbsp;' + num : '') + '</span>';
            if (name) head += ' <span class="theorem-name">(' + mdInline(mdEsc(name)) + ')</span>';
            html.push('<div class="theorem theorem-' + env + '"'
                + (id ? ' id="' + labelToId(id) + '"' : '') + '>'
                + '<p class="theorem-head">' + head + '</p>'
                + parseMarkdown(bodyLines.join('\n'))
                + '</div>');
            continue;
        }

        // Unknown directive syntax must remain visible, but it must also make
        // progress. Excluding `:::` from paragraphs without consuming it used
        // to spin forever on a converter-emitted custom theorem environment.
        if (/^:::\s*/.test(line)) {
            html.push('<p>' + mdInline(mdEsc(line)) + '</p>');
            i++;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            html.push('<hr>');
            i++;
            continue;
        }

        // Recursive: blockquote content may contain any block element
        if (/^>\s?/.test(line)) {
            const bqLines = [];
            while (i < len && /^>\s?/.test(lines[i])) {
                bqLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            html.push('<blockquote>' + parseMarkdown(bqLines.join('\n')) + '</blockquote>');
            continue;
        }

        if (/^[\-*+]\s+/.test(line)) {
            const items = [];
            while (i < len && /^[\-*+]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^[\-*+]\s+/, ''));
                i++;
            }
            html.push('<ul>' + items.map(renderListItem).join('') + '</ul>');
            continue;
        }

        // GFM-style pipe table: header row, separator row of dashes, body rows.
        if (/^\|.+\|\s*$/.test(line) && i + 1 < len && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
            const headers = splitMarkdownTableRow(line);
            i += 2;
            const bodyRows = [];
            while (i < len && /^\|.+\|\s*$/.test(lines[i])) {
                bodyRows.push(splitMarkdownTableRow(lines[i]));
                i++;
            }
            html.push('<table><thead><tr>'
                + headers.map(h => '<th>' + mdInline(mdEsc(h)) + '</th>').join('')
                + '</tr></thead><tbody>'
                + bodyRows.map(row => '<tr>' + row.map(c => '<td>' + mdInline(mdEsc(c)) + '</td>').join('') + '</tr>').join('')
                + '</tbody></table>');
            continue;
        }

        if (/^\d+[.)]\s+/.test(line)) {
            const olItems = [];
            while (i < len && /^\d+[.)]\s+/.test(lines[i])) {
                olItems.push(lines[i].replace(/^\d+[.)]\s+/, ''));
                i++;
            }
            html.push('<ol>' + olItems.map(renderListItem).join('') + '</ol>');
            continue;
        }

        // Paragraph: collect consecutive non-blank, non-block-syntax lines
        const pLines = [];
        while (i < len && !/^\s*$/.test(lines[i])
            && !/^(#{1,6}\s|>\s?|[\-*+]\s|`{3,}|~{3,}|:{3}|\d+[.)]\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])) {
            pLines.push(lines[i]);
            i++;
        }
        if (pLines.length) {
            html.push('<p>' + mdInline(mdEsc(pLines.join('\n'))) + '</p>');
        }
    }

    return unstashMath(html.join('\n'));
}
