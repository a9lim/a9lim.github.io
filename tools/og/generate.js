import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const CARDS = [
  { html: 'a9lim.html', output: path.join(ROOT, 'static', 'og-image.webp') },
  { html: 'geon.html', output: path.join(ROOT, 'projects', 'geon', 'og-image.webp') },
  { html: 'shoals.html', output: path.join(ROOT, 'projects', 'shoals', 'og-image.webp') },
];

const browser = await puppeteer.launch({ headless: true });

for (const card of CARDS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  const url = 'file://' + path.join(__dirname, card.html);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });

  await page.screenshot({ path: card.output, type: 'webp', quality: 90, omitBackground: false });
  console.log(`✓ ${card.html} → ${path.relative(ROOT, card.output)}`);
  await page.close();
}

if (process.argv.includes('--icons')) {
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
