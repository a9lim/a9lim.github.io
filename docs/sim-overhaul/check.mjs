// Headless check of the sims: screenshot, console errors, failed requests, overflow, frame rate.
// usage: node docs/sim-overhaul/check.mjs BASE OUTDIR path1,path2 [scheme=light] [width=1280] [waitMs=3000] [evalJS]
//   BASE   e.g. http://localhost:8790 (docs/sim-overhaul/serve.mjs) or http://localhost:8787 (wrangler dev)
//   width  < 600 emulates a phone (touch, DPR 2)
//   evalJS evaluated in the page after the wait; its value is printed as "ev"
// Prints JSON per path: { overflow, fps, errs, ev }. Uses Exploratory's playwright-core and Chrome for Testing,
// with WebGPU enabled.
import { createRequire } from 'node:module';
const require = createRequire('/Users/a9lim/Work/Exploratory/package.json');
const { chromium } = require('playwright-core');
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [base, out, paths, scheme = 'light', width = '1280', wait = '3000', evalJS = ''] = process.argv.slice(2);
const reduced = process.env.REDUCED_MOTION === '1';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
const w = +width, h = w < 600 ? 844 : 860;
const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: reduced ? 'reduce' : 'no-preference', deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600, hasTouch: w < 600 });
const res = {};
for (const p of paths.split(',')) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('requestfailed', r => errs.push('reqfail: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ': ' + r.url()); });
  const url = base.replace(/\/$/, '') + '/' + p + (p.includes('?') || p.endsWith('/') || p === '' ? '' : '/');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(+wait);
  const fps = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else r(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); }));
  let ev = null;
  if (evalJS) { try { ev = await page.evaluate(evalJS); } catch (e) { ev = 'EVAL ERR ' + e.message; } }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  const name = p.replace(/[^a-z0-9]+/gi, '_') || 'root';
  await page.screenshot({ path: `${out}/${scheme[0]}${width}${reduced ? 'r' : ''}-${name}.png` });
  res[p] = { overflow, fps, errs: errs.slice(0, 14), ev };
  await page.close();
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
