// Markdown blocks and pipe tables, for the content pipeline: tools/build.mjs
// and tools/horizon-fit.mjs (which docs/horizons/ also reads the figure's
// table through).
import { splitMarkdownTableRow } from '../site/src/markdown.js';

export function mdBlocksOf(body) {
  return body.split(/\n{2,}/).map(b => b.replace(/^\n+|\n+$/g, '')).filter(b => b.trim());
}

export function parseTableBlock(block, rel) {
  const lines = block.split('\n').filter(l => l.trim());
  if (!/^\|.*\|\s*$/.test(lines[0]) || !/^\|[\s:|-]+\|\s*$/.test(lines[1] || '')) {
    throw new Error(rel + ': expected a pipe table, got: ' + lines[0]);
  }
  const header = splitMarkdownTableRow(lines[0]);
  const rows = lines.slice(2).map((line, index) => {
    const row = splitMarkdownTableRow(line);
    if (row.length !== header.length) {
      throw new Error(`${rel}:${index + 3}: expected ${header.length} table cells, got ${row.length}`);
    }
    return row;
  });
  return { header, rows };
}
