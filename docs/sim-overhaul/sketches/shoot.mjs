// usage: node shoot.mjs PAGE.html OUTDIR id1,id2 [scheme] [width] [waitMs]
// Screenshots the <figure> containing each element id, after it has run for waitMs. Prints console errors.
import { createRequire } from 'module';
const require = createRequire('/Users/a9lim/Work/Exploratory/package.json');
const { chromium } = require('playwright-core');
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [file, out, ids, scheme = 'light', width = '1280', wait = '2600'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: +width, height: 900 }, colorScheme: scheme, deviceScaleFactor: +width < 600 ? 2 : 1 });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto('file://' + file, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
for (const id of ids.split(',')) {
  const el = await page.$('#' + id);
  if (!el) { errs.push('missing #' + id); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(+wait);
  const fig = await el.evaluateHandle(e => e.closest('figure') || e);
  await fig.asElement().screenshot({ path: `${out}/${scheme[0]}${width}-${id}.png` });
}
console.log(JSON.stringify({ overflow, errs: errs.slice(0, 12) }));
await browser.close();
