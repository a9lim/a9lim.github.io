// Build-time fallback-font subsets.
//
// Newsreader carries Latin text and nothing else. Two pinned fallback families
// fill the gaps, each cut down to what the site prints:
//
//   fonts/shippori-mincho-400.woff2, -500.woff2
//       Japanese: kana, CJK punctuation, fullwidth forms, and every kanji found
//       in the site's tracked text
//   fonts/stix-two-text.woff2, stix-two-text-italic.woff2
//       Greek, Cyrillic, super/subscripts, letterlike symbols, transliteration
//       letters, and combining marks (so σ̄ sets as one cluster)
//   fonts/stix-two-math.woff2
//       math operators, brackets, geometric shapes, musical accidentals
//   fonts/stix-two-math-arrows.woff2
//       arrows alone, so an English page with "→" never pulls the operators
//
// Each slice always carries a fixed core (kana; the Greek alphabet; digit
// super/subscripts; common operators; basic arrows) so new labels render in the
// right face before they appear in the scanned text. static/fonts/fonts.css
// declares the matching unicode-range faces; the ranges below must match it.
// Sources are pinned to google/fonts commits and checksum-verified into
// .build/fonts/, the same pattern as tools/pandoc.sh. Output is a pure function
// of the source fonts and the scanned text, so `build.mjs --check` can compare
// it byte for byte.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import subsetFont from 'subset-font';

const SOURCES = {
  shippori400: {
    commit: 'd0b2d1307ad5d6b579d627a6e5abd25952484b96', path: 'ofl/shipporimincho/ShipporiMincho-Regular.ttf',
    file: 'ShipporiMincho-Regular.ttf', sha256: '769b5269f0f9bc6534b352c0e6bd856a566e03ff788f107191c2d835863570b2',
  },
  shippori500: {
    commit: 'd0b2d1307ad5d6b579d627a6e5abd25952484b96', path: 'ofl/shipporimincho/ShipporiMincho-Medium.ttf',
    file: 'ShipporiMincho-Medium.ttf', sha256: '700e505afc4cded2338eba29478a041e04c1c2ea5114fbb3e0b04e76c302c5d8',
  },
  stixText: {
    commit: '718c7ee0e83f5e301cc96bbc081c9bb5ade9ed92', path: 'ofl/stixtwotext/STIXTwoText[wght].ttf',
    file: 'STIXTwoText-Roman.ttf', sha256: '7962b8b7811e6a896c9a91a0bccbb5241047770eb24d4997c5cb5fe21d5c0df2',
  },
  stixTextItalic: {
    commit: '718c7ee0e83f5e301cc96bbc081c9bb5ade9ed92', path: 'ofl/stixtwotext/STIXTwoText-Italic[wght].ttf',
    file: 'STIXTwoText-Italic.ttf', sha256: '88c0e2e316eaff56eddc9e51e4850317e2a1e490bbf758b2dec4793aedba9c74',
  },
  stixMath: {
    commit: '823468bd7825152bce2b8fd2cf740432ad2fce8d', path: 'ofl/stixtwomath/STIXTwoMath-Regular.ttf',
    file: 'STIXTwoMath-Regular.ttf', sha256: '562551b15b836e6e01d1b7350909baf3c8c8d83260c1190fbf4544333e6936de',
  },
};

// Must match the unicode-range of the matching faces in static/fonts/fonts.css.
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
const TEXT_RANGES = [
  [0x0300, 0x036F], // combining diacritical marks
  [0x0370, 0x03FF], // Greek
  [0x0400, 0x04FF], // Cyrillic
  [0x1D00, 0x1DBF], // phonetic extensions (modifier letters)
  [0x1E00, 0x1EFF], // Latin extended additional (transliteration)
  [0x2016, 0x2016], // double vertical line
  [0x2070, 0x209F], // superscripts and subscripts
  [0x20D0, 0x20FF], // combining marks for symbols (vector arrow)
  [0x2100, 0x214F], // letterlike symbols
];
const MATH_RANGES = [
  [0x2200, 0x22FF], // mathematical operators
  [0x2300, 0x23FF], // miscellaneous technical (ceilings, floors)
  [0x25A0, 0x25FF], // geometric shapes (□)
  [0x266D, 0x266F], // ♭ ♮ ♯
  [0x27C0, 0x27EF], // miscellaneous math symbols A (⟨ ⟩)
  [0x2980, 0x29FF], // miscellaneous math symbols B
  [0x2A00, 0x2AFF], // supplemental operators
];
const ARROW_RANGES = [[0x2190, 0x21FF]];

const span = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const codepoints = s => [...s].map(c => c.codePointAt(0));

// Shipped regardless of the scan.
const ALWAYS_JA = [[0x3000, 0x303F], [0x3040, 0x309F], [0x30A0, 0x30FF], [0xFF01, 0xFF5E]].flatMap(([a, b]) => span(a, b));
const ALWAYS_TEXT = [
  ...span(0x0300, 0x0308), 0x030A, 0x030C, 0x20D7,     // grave … diaeresis, ring, caron, vector arrow
  ...span(0x0391, 0x03A1), ...span(0x03A3, 0x03A9),    // Greek capitals
  ...span(0x03B1, 0x03C9), 0x03D1, 0x03D5, 0x03D6, 0x03F1, 0x03F5, // lowercase and variants
  0x2070, 0x2071, ...span(0x2074, 0x208E), ...span(0x2090, 0x209C), // super/subscripts
  0x210F, 0x2113,                                      // ℏ ℓ
];
const ALWAYS_MATH = codepoints('∂∅∇∈∉∏∑∓∘√∝∞∠∥∧∨∩∪∫∮∼≃≅≈≠≡≤≥≪≫⊂⊃⊆⊇⊕⊗⊥⋅∎⟨⟩⌈⌉⌊⌋□♭♮♯');
const ALWAYS_ARROWS = [...span(0x2190, 0x2199), 0x21A6, 0x21CC, ...span(0x21D0, 0x21D5)];

const TEXT_EXTENSIONS = new Set(['.md', '.js', '.mjs', '.html']);
const PROJECTS = ['cyano', 'geon', 'gerry', 'miasma', 'pile', 'plasma', 'scripture', 'shoals'];

const inRanges = (cp, ranges) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
const sha256 = buf => createHash('sha256').update(buf).digest('hex');

async function sourceFont(root, key) {
  const { commit, path: fontPath, file, sha256: expected } = SOURCES[key];
  const dir = join(root, '.build', 'fonts');
  const path = join(dir, file);
  if (existsSync(path)) {
    const buf = readFileSync(path);
    if (sha256(buf) === expected) return buf;
  }
  const url = `https://raw.githubusercontent.com/google/fonts/${commit}/${fontPath.split('/').map(encodeURIComponent).join('/')}`;
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

/** One pass over the scanned text, bucketing code points by slice. */
function scannedText(root, drafts) {
  const sets = { ja: new Set(ALWAYS_JA), text: new Set(ALWAYS_TEXT), math: new Set(ALWAYS_MATH), arrows: new Set(ALWAYS_ARROWS) };
  for (const path of scannedFiles(root, drafts)) {
    for (const ch of readFileSync(path, 'utf8')) {
      const cp = ch.codePointAt(0);
      if (cp < 0x0300) continue;
      if (inRanges(cp, JA_RANGES)) sets.ja.add(cp);
      else if (inRanges(cp, TEXT_RANGES)) sets.text.add(cp);
      else if (inRanges(cp, MATH_RANGES)) sets.math.add(cp);
      else if (inRanges(cp, ARROW_RANGES)) sets.arrows.add(cp);
    }
  }
  const str = set => String.fromCodePoint(...[...set].sort((a, b) => a - b));
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, str(v)]));
}

/** @returns {Promise<{rel: string, bytes: Buffer}[]>} files to place under dist/ */
export async function buildFontSubsets({ root, drafts = false }) {
  const src = Object.fromEntries(await Promise.all(Object.keys(SOURCES).map(async k => [k, await sourceFont(root, k)])));
  const text = scannedText(root, drafts);
  // MATH is the math-layout table; as a text fallback the face never uses it.
  const woff2 = (buf, chars) => subsetFont(buf, chars, { targetFormat: 'woff2', dropTables: ['MATH', 'DSIG'] });
  const out = [
    ['fonts/shippori-mincho-400.woff2', src.shippori400, text.ja],
    ['fonts/shippori-mincho-500.woff2', src.shippori500, text.ja],
    ['fonts/stix-two-text.woff2', src.stixText, text.text],
    ['fonts/stix-two-text-italic.woff2', src.stixTextItalic, text.text],
    ['fonts/stix-two-math.woff2', src.stixMath, text.math],
    ['fonts/stix-two-math-arrows.woff2', src.stixMath, text.arrows],
  ];
  const files = await Promise.all(out.map(async ([rel, buf, chars]) => ({ rel, bytes: await woff2(buf, chars) })));
  const kb = rel => (files.find(f => f.rel === rel).bytes.length / 1024).toFixed(0);
  console.log(`fonts: Shippori Mincho ${[...text.ja].length} code points (${kb('fonts/shippori-mincho-400.woff2')} + ${kb('fonts/shippori-mincho-500.woff2')} KB); `
    + `STIX Two text ${[...text.text].length}, math ${[...text.math].length}, arrows ${[...text.arrows].length} `
    + `(${kb('fonts/stix-two-text.woff2')} + ${kb('fonts/stix-two-text-italic.woff2')} + ${kb('fonts/stix-two-math.woff2')} + ${kb('fonts/stix-two-math-arrows.woff2')} KB)`);
  return files;
}
