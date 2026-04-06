// ─── Lightweight Markdown → HTML Parser ───
// Regex-based, single-pass. Supports: headings, fenced code blocks (with
// language class), blockquotes (recursive), ordered/unordered lists,
// horizontal rules, images, links, inline code, bold, italic, bold-italic.
// Limitations: no nested lists, no tables, no reference-style links,
// no HTML passthrough, no setext headings.

function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Process inline formatting (images, links, code, bold, italic). */
function inline(src) {
    // Order matters: images before links (share bracket syntax), bold-italic
    // before bold before italic to avoid partial matches
    return src
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let i = 0;
    const len = lines.length;

    while (i < len) {
        const line = lines[i];

        if (/^(`{3,}|~{3,})(.*)$/.test(line)) {
            const fence = RegExp.$1;
            const lang = RegExp.$2.trim();
            const code = [];
            i++;
            while (i < len && lines[i].indexOf(fence) !== 0) {
                code.push(esc(lines[i]));
                i++;
            }
            i++;
            const langAttr = lang ? ' class="language-' + esc(lang) + '"' : '';
            html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
            continue;
        }

        if (/^\s*$/.test(line)) { i++; continue; }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const slug = headingMatch[2].toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
            html.push('<h' + level + ' id="' + slug + '">' + inline(esc(headingMatch[2])) + '</h' + level + '>');
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
            html.push('<ul>' + items.map(it => '<li>' + inline(esc(it)) + '</li>').join('') + '</ul>');
            continue;
        }

        if (/^\d+[.)]\s+/.test(line)) {
            const olItems = [];
            while (i < len && /^\d+[.)]\s+/.test(lines[i])) {
                olItems.push(lines[i].replace(/^\d+[.)]\s+/, ''));
                i++;
            }
            html.push('<ol>' + olItems.map(it => '<li>' + inline(esc(it)) + '</li>').join('') + '</ol>');
            continue;
        }

        // Paragraph: collect consecutive non-blank, non-block-syntax lines
        const pLines = [];
        while (i < len && !/^\s*$/.test(lines[i])
            && !/^(#{1,6}\s|>\s?|[\-*+]\s|`{3,}|~{3,}|\d+[.)]\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])) {
            pLines.push(lines[i]);
            i++;
        }
        if (pLines.length) {
            html.push('<p>' + inline(esc(pLines.join('\n'))) + '</p>');
        }
    }

    return html.join('\n');
}
