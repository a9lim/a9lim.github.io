// Social cards. Each card is a painting made as a program (paint/{name}.py, on the
// brush engine in paint/brush.py) with its type set over it by an HTML template.
//
//   node generate.js [name…] [--repaint] [--preview DIR] [--scale N] [--icons]
//
// A card's painting is painted once into art/ (ignored) and reused; --repaint paints
// it again, and --scale sets the painting's working scale (2 by default: painted at
// 2400 × 1260 and reduced). --preview writes PNGs into DIR instead of the cards the
// site serves. Painting needs Python with numpy, scipy and Pillow (PYTHON, or python3).
import puppeteer from 'puppeteer';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const ART = path.join(__dirname, 'art');

const CARDS = [
  { name: 'root', html: 'a9lim.html', output: path.join(ROOT, 'static', 'og-image.webp') },
  ...['worldline', 'lumen', 'miasma', 'shoals'].map(name => ({
    name, html: `${name}.html`, output: path.join(ROOT, 'projects', name, 'og-image.webp'),
  })),
];

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const preview = option('--preview');
const scale = option('--scale') ?? '2';
const names = args.filter((a, i) => !a.startsWith('--') && !['--preview', '--scale'].includes(args[i - 1]));
const unknown = names.filter(n => !CARDS.some(c => c.name === n));
if (unknown.length) throw new Error(`unknown card: ${unknown.join(', ')} (have ${CARDS.map(c => c.name).join(', ')})`);
const cards = names.length ? CARDS.filter(c => names.includes(c.name)) : CARDS;

// The seal, inline, so a card can set it in its own accent (`.seal { color }`).
const seal = readFileSync(path.join(ROOT, 'static', 'logo.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg/, '<svg')
  .replace(/<sodipodi:namedview[\s\S]*?\/>/, '')
  .replace(/fill:#983432/g, 'fill:currentColor')
  .replace(/\swidth="360"\s+height="360"/, ' viewBox="0 0 360 360"');

mkdirSync(ART, { recursive: true });
if (preview) mkdirSync(preview, { recursive: true });

const browser = await puppeteer.launch({ headless: true });

for (const card of cards) {
  const art = path.join(ART, `${card.name}.png`);
  if (flag('--repaint') || !existsSync(art)) {
    execFileSync(process.env.PYTHON ?? 'python3', [path.join(__dirname, 'paint', `${card.name}.py`), scale, art],
      { stdio: 'inherit' });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, card.html), { waitUntil: 'networkidle0' });
  await page.evaluate(async svg => {
    for (const el of document.querySelectorAll('.seal')) el.innerHTML = svg;
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  }, seal);

  const output = preview ? path.join(preview, `${card.name}.png`) : card.output;
  await page.screenshot(preview
    ? { path: output, type: 'png' }
    : { path: output, type: 'webp', quality: 92 });
  console.log(`✓ ${card.html} → ${path.relative(process.cwd(), output)}`);
  await page.close();
}

if (flag('--icons')) {
  const icons = [
    { size: 512, output: path.join(ROOT, 'static', 'icon-512.png') },
    { size: 192, output: path.join(ROOT, 'static', 'icon-192.png') },
  ];

  for (const icon of icons) {
    const page = await browser.newPage();
    await page.setViewport({ width: icon.size, height: icon.size, deviceScaleFactor: 1 });

    const url = 'file://' + path.join(__dirname, 'icon.html');
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: icon.output, type: 'png', omitBackground: true });
    console.log(`✓ icon.html → ${path.relative(ROOT, icon.output)} (${icon.size}x${icon.size})`);
    await page.close();
  }
}

await browser.close();
