/* ===================================================================
   markdown.js — Lightweight markdown → HTML parser
   Exposes global parseMarkdown(src) returning an HTML string.
   Two-pass: block parsing then inline parsing. HTML-escapes content.
   =================================================================== */

var parseMarkdown = (function () {
  'use strict';

  // ─── HTML Escape ───
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Inline Parsing ───
  function inline(src) {
    return src
      // Images: ![alt](url)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold + italic: ***text*** or ___text___
      .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
      .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
      // Bold: **text** or __text__
      .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
      .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/(^|[\s(])_(.+?)_([\s).,!?]|$)/g, '$1<em>$2</em>$3');
  }

  // ─── Block Parsing ───
  function parse(src) {
    var lines = src.replace(/\r\n?/g, '\n').split('\n');
    var html = [];
    var i = 0;
    var len = lines.length;

    while (i < len) {
      var line = lines[i];

      // Fenced code block: ``` or ~~~
      if (/^(`{3,}|~{3,})(.*)$/.test(line)) {
        var fence = RegExp.$1;
        var lang = RegExp.$2.trim();
        var code = [];
        i++;
        while (i < len && lines[i].indexOf(fence) !== 0) {
          code.push(esc(lines[i]));
          i++;
        }
        i++; // skip closing fence
        var langAttr = lang ? ' class="language-' + esc(lang) + '"' : '';
        html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
        continue;
      }

      // Blank line
      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      // Heading: # to ######
      var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        var level = headingMatch[1].length;
        html.push('<h' + level + '>' + inline(esc(headingMatch[2])) + '</h' + level + '>');
        i++;
        continue;
      }

      // Horizontal rule: ---, ***, ___
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        html.push('<hr>');
        i++;
        continue;
      }

      // Blockquote: > text
      if (/^>\s?/.test(line)) {
        var bqLines = [];
        while (i < len && /^>\s?/.test(lines[i])) {
          bqLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html.push('<blockquote>' + parse(bqLines.join('\n')) + '</blockquote>');
        continue;
      }

      // Unordered list: - or * or +
      if (/^[\-*+]\s+/.test(line)) {
        var items = [];
        while (i < len && /^[\-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[\-*+]\s+/, ''));
          i++;
        }
        html.push('<ul>' + items.map(function (it) {
          return '<li>' + inline(esc(it)) + '</li>';
        }).join('') + '</ul>');
        continue;
      }

      // Ordered list: 1. or 1)
      if (/^\d+[.)]\s+/.test(line)) {
        var olItems = [];
        while (i < len && /^\d+[.)]\s+/.test(lines[i])) {
          olItems.push(lines[i].replace(/^\d+[.)]\s+/, ''));
          i++;
        }
        html.push('<ol>' + olItems.map(function (it) {
          return '<li>' + inline(esc(it)) + '</li>';
        }).join('') + '</ol>');
        continue;
      }

      // Paragraph — collect consecutive non-blank, non-special lines
      var pLines = [];
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

  return parse;
})();
