// Build-time Shippori Mincho subsets.
//
// Newsreader has no Japanese and no arrows, so the site's text stack falls
// through to Shippori Mincho for both. The full family is ~8.6 MB per weight;
// these subsets carry only what the site prints:
//
//   fonts/shippori-mincho-400.woff2, -500.woff2
//       kana, CJK punctuation, fullwidth forms, and every kanji found in the
//       site's tracked text (root content, site shell, Worker, and projects)
//   fonts/shippori-mincho-symbols.woff2
//       the arrows U+2190–2193, which English pages use without pulling the
//       Japanese files
//
// static/fonts/fonts.css declares the matching unicode-range faces. Sources are
// pinned to a google/fonts commit and checksum-verified into .build/fonts/, the
// same pattern as tools/pandoc.sh. Output is a pure function of the source
// fonts and the scanned text, so `build.mjs --check` can compare it byte for byte.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import subsetFont from 'subset-font';

const GOOGLE_FONTS_COMMIT = 'd0b2d1307ad5d6b579d627a6e5abd25952484b96';
const SOURCES = {
  400: { file: 'ShipporiMincho-Regular.ttf', sha256: '769b5269f0f9bc6534b352c0e6bd856a566e03ff788f107191c2d835863570b2' },
  500: { file: 'ShipporiMincho-Medium.ttf', sha256: '700e505afc4cded2338eba29478a041e04c1c2ea5114fbb3e0b04e76c302c5d8' },
};

// Must match the unicode-range of the Japanese faces in static/fonts/fonts.css.
const JA_RANGES = [
  [0x3000, 0x303F], // CJK symbols and punctuation
  [0x3040, 0x309F], // hiragana
  [0x30A0, 0x30FF], // katakana
  [0x31F0, 0x31FF], // katakana phonetic extensions
  [0x3400, 0x4DBF], // CJK extension A
  [0x4E00, 0x9FFF], // CJK unified ideographs
  [0xF900, 0xFAFF], // CJK compatibility ideographs
  [0xFF00, 0xFFEF], // halfwidth and fullwidth forms
];
// Always shipped, so arbitrary kana and punctuation render in Mincho even
// before a new word appears in the scanned text.
const ALWAYS_JA = [[0x3000, 0x303F], [0x3040, 0x309F], [0x30A0, 0x30FF], [0xFF01, 0xFF5E]];
const SYMBOLS = [[0x2190, 0x2193]];

const TEXT_EXTENSIONS = new Set(['.md', '.js', '.mjs', '.html']);
const PROJECTS = ['cyano', 'geon', 'gerry', 'miasma', 'pile', 'plasma', 'scripture', 'shoals'];

const inRanges = (cp, ranges) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
const sha256 = buf => createHash('sha256').update(buf).digest('hex');

async function sourceFont(root, weight) {
  const { file, sha256: expected } = SOURCES[weight];
  const dir = join(root, '.build', 'fonts');
  const path = join(dir, file);
  if (existsSync(path)) {
    const buf = readFileSync(path);
    if (sha256(buf) === expected) return buf;
  }
  const url = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/ofl/shipporimincho/${file}`;
  console.log(`fonts: downloading ${file}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fonts: ${url} returned ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha256(buf) !== expected) throw new Error(`fonts: ${file} checksum mismatch`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, buf);
  return buf;
}

function trackedTextFiles(cwd, pathspecs) {
  if (!existsSync(cwd)) return [];
  return execFileSync('git', ['ls-files', '-z', '--', ...pathspecs], { cwd, encoding: 'utf8' })
    .split('\0')
    .filter(rel => rel && TEXT_EXTENSIONS.has(extname(rel)))
    .map(rel => join(cwd, rel));
}

function scannedFiles(root, drafts) {
  const files = trackedTextFiles(root, ['content', 'site', 'worker']);
  for (const project of PROJECTS) files.push(...trackedTextFiles(join(root, 'projects', project), ['.']));
  if (drafts) {
    const walk = dir => {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (TEXT_EXTENSIONS.has(extname(name))) files.push(path);
      }
    };
    walk(join(root, 'draft'));
  }
  return files;
}

function japaneseText(root, drafts) {
  const cps = new Set();
  for (const [lo, hi] of ALWAYS_JA) for (let cp = lo; cp <= hi; cp++) cps.add(cp);
  for (const path of scannedFiles(root, drafts)) {
    for (const ch of readFileSync(path, 'utf8')) {
      const cp = ch.codePointAt(0);
      if (inRanges(cp, JA_RANGES)) cps.add(cp);
    }
  }
  return String.fromCodePoint(...[...cps].sort((a, b) => a - b));
}

const rangeText = ranges => String.fromCodePoint(...ranges.flatMap(([lo, hi]) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)));

/** @returns {Promise<{rel: string, bytes: Buffer}[]>} files to place under dist/ */
export async function buildFontSubsets({ root, drafts = false }) {
  const regular = await sourceFont(root, 400);
  const medium = await sourceFont(root, 500);
  const text = japaneseText(root, drafts);
  const woff2 = (buf, chars) => subsetFont(buf, chars, { targetFormat: 'woff2' });
  const [ja400, ja500, symbols] = await Promise.all([
    woff2(regular, text),
    woff2(medium, text),
    woff2(regular, rangeText(SYMBOLS)),
  ]);
  console.log(`fonts: Shippori Mincho subset, ${[...text].length} code points`
    + ` (${(ja400.length / 1024).toFixed(0)} KB + ${(ja500.length / 1024).toFixed(0)} KB)`);
  return [
    { rel: 'fonts/shippori-mincho-400.woff2', bytes: ja400 },
    { rel: 'fonts/shippori-mincho-500.woff2', bytes: ja500 },
    { rel: 'fonts/shippori-mincho-symbols.woff2', bytes: symbols },
  ];
}
