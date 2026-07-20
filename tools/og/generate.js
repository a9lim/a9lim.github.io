import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const CARDS = [
  { html: 'a9lim.html', output: path.join(ROOT, 'static', 'og-image.webp'), waitReady: true },
  { html: 'shoals.html',     output: path.join(ROOT, 'shoals', 'og-image.webp'),   waitReady: false },
  { html: 'geon.html',       output: path.join(ROOT, 'geon', 'og-image.webp'),     waitReady: false },
  { html: 'metabolism.html',  output: path.join(ROOT, 'cyano', 'og-image.webp'),    waitReady: false },
  { html: 'redistricting.html', output: path.join(ROOT, 'gerry', 'og-image.webp'), waitReady: false },
  { html: 'scripture.html',    output: path.join(ROOT, 'scripture', 'og-image.webp'), waitReady: false },
  { html: 'miasma.html',       output: path.join(ROOT, 'miasma', 'og-image.webp'),    waitReady: false },
  { html: 'pile.html',         output: path.join(ROOT, 'pile', 'og-image.webp'),      waitReady: false },
  { html: 'plasma.html',       output: path.join(ROOT, 'plasma', 'og-image.webp'),    waitReady: false },
];

const browser = await puppeteer.launch({ headless: true });

for (const card of CARDS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  const url = 'file://' + path.join(__dirname, card.html);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for fonts
  await page.waitForFunction(() => document.fonts.ready);

  // Wait for SVG load (a9l.im)
  if (card.waitReady) {
    await page.waitForFunction(() => window._ready === true, { timeout: 10000 });
  }

  await page.screenshot({ path: card.output, type: 'webp', quality: 90, omitBackground: false });
  console.log(`✓ ${card.html} → ${path.relative(ROOT, card.output)}`);
  await page.close();
}

// Generate PWA icons (192x192 and 512x512 PNG)
const ICONS = [
  { size: 512, output: path.join(ROOT, 'static', 'icon-512.png') },
  { size: 192, output: path.join(ROOT, 'static', 'icon-192.png') },
];

for (const icon of ICONS) {
  const page = await browser.newPage();
  await page.setViewport({ width: icon.size, height: icon.size, deviceScaleFactor: 1 });

  const url = 'file://' + path.join(__dirname, 'icon.html');
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.fonts.ready);

  await page.screenshot({ path: icon.output, type: 'png', omitBackground: true });
  console.log(`✓ icon.html → ${path.relative(ROOT, icon.output)} (${icon.size}x${icon.size})`);
  await page.close();
}

await browser.close();
