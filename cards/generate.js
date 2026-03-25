import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CARDS = [
  { html: 'geon.html',   output: path.join(ROOT, 'img', 'geon.png') },
  { html: 'shoals.html', output: path.join(ROOT, 'img', 'shoals.png') },
  { html: 'cyano.html',  output: path.join(ROOT, 'img', 'cyano.png') },
  { html: 'gerry.html',  output: path.join(ROOT, 'img', 'gerry.png') },
];

const browser = await puppeteer.launch({ headless: true });

for (const card of CARDS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 600, deviceScaleFactor: 2 });

  const url = 'file://' + path.join(__dirname, card.html);
  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.screenshot({ path: card.output, type: 'png', omitBackground: false });
  console.log(`✓ ${card.html} → ${path.relative(ROOT, card.output)}`);
  await page.close();
}

await browser.close();
