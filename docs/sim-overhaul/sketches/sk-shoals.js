/* ---------- Fig. 5: Shoals, the Brief ---------- */
function Brief() {
  const tape = $('#cv-tape'), vol = $('#cv-vol');
  const cap = captioner($('#cap-brief'));
  const items = [
    { kick: 'The Fed', head: 'A hold that says nothing', body: 'FOMC holds rates steady; Hartley says policy is “well-positioned” and cites improving labor data. Sharma’s MarketWire column: “A hold that says nothing says everything.”', jump: 0.004, dv: -0.004 },
    { kick: 'Housing', head: 'Housing broke first', body: 'Mortgage applications plunge 30% as rates bite; Fed signals pause to “assess cumulative tightening.” The Meridian Brief: “Housing broke first. The rest follows.”', jump: -0.058, dv: 0.05 },
    { kick: 'The floor', head: 'Priorities', body: 'The Meridian Brief: “Heard the risk desk is reviewing someone’s gamma exposure. Also, the coffee machine on 4 is broken again. Priorities.” A normal morning on the floor.', jump: 0.002, dv: -0.006 },
    { kick: 'The labs', head: 'Certified, and now collateral', body: 'Certification lands, and the gap the keynote would not slide gets a number. The rung claim the cadence implied is now collateral — auditable, disputable, tradeable. The Brief runs it under “as expected.” It was not expected. It was purchasable.', jump: 0.043, dv: 0.012 },
  ];
  const kappa = 2.2, theta = 0.04, xi = 0.6, rho = -0.7, mu = 0.05, rate = 0.04;
  let Sx = 100, v = 0.04, day = 300, hist = [], notes = [], idx = -1, since = 0, acc = 0;
  let prevChain = null, chainRows = [];
  const rnd = mulberry32(21);
  const gauss = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * rnd()); };
  const el = { lead: $('#br-lead'), kick: $('#br-kick'), head: $('#br-head'), body: $('#br-body'), ed: $('#br-ed'), day: $('#br-day'), hcn: $('#br-hcn'), vx: $('#br-vx'), chain: $('#br-chain') };
  function session() {
    let hi = Sx, lo = Sx;
    const dt = 1 / 252 / 8;
    for (let k = 0; k < 8; k++) {
      const z1 = gauss(), z2 = rho * z1 + Math.sqrt(1 - rho * rho) * gauss(), sv = Math.sqrt(Math.max(v, 1e-5));
      Sx *= Math.exp((mu - 0.5 * v) * dt + sv * Math.sqrt(dt) * z1);
      v = Math.max(4e-4, v + kappa * (theta - v) * dt + xi * sv * Math.sqrt(dt) * z2);
      hi = Math.max(hi, Sx); lo = Math.min(lo, Sx);
    }
    day++;
    hist.push({ hi, lo, close: Sx, day });
    if (hist.length > 120) hist.shift();
    if (++since >= 22) nextItem(true);
  }
  function nextItem(live) {
    idx = (idx + 1) % items.length;
    const it = items[idx];
    Sx *= 1 + it.jump; v = Math.max(4e-4, v + it.dv);
    const h = hist[hist.length - 1];
    if (h) { h.close = Sx; h.hi = Math.max(h.hi, Sx); h.lo = Math.min(h.lo, Sx); }
    notes.push({ day, head: it.head });
    if (notes.length > 4) notes.shift();
    since = 0;
    const apply = () => { el.kick.textContent = it.kick; el.head.textContent = it.head; el.body.textContent = it.body; el.lead.style.opacity = 1; };
    if (live && !reduceMotion) { el.lead.style.opacity = 0; setTimeout(apply, 260); } else apply();
  }
  function iv(m, T) {
    const e = (1 - Math.exp(-kappa * T)) / (kappa * T);
    const varT = theta + (v - theta) * e, atm = Math.sqrt(Math.max(varT, 1e-4));
    return Math.max(0.03, atm + rho * xi / (4 * atm) * e * m + 0.25 * xi * xi * e / atm * m * m);
  }
  function ncdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
  function bs(K, T, sig) { const d1 = (Math.log(Sx / K) + (rate + sig * sig / 2) * T) / (sig * Math.sqrt(T)), d2 = d1 - sig * Math.sqrt(T); const call = Sx * ncdf(d1) - K * Math.exp(-rate * T) * ncdf(d2); return [call, call - Sx + K * Math.exp(-rate * T)]; }
  function chain() {
    const T = 30 / 365, atmK = Math.round(Sx / 5) * 5, rows = [];
    for (let k = -3; k <= 3; k++) { const K = atmK + k * 5, sig = iv(Math.log(K / Sx), T), [cP, pP] = bs(K, T, sig); rows.push({ K, c: cP, p: pP, atm: k === 0 }); }
    if (chainRows.length !== rows.length) {
      el.chain.textContent = '';
      chainRows = rows.map(() => { const tr = document.createElement('tr'); const tds = [0, 1, 2, 3, 4].map(() => tr.appendChild(document.createElement('td'))); tds[2].className = 'k'; el.chain.appendChild(tr); return { tr, tds }; });
    }
    const pm = prevChain ? new Map(prevChain.map(r => [r.K, r])) : new Map();
    const sgn = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);
    rows.forEach((r, i) => {
      const { tr, tds } = chainRows[i], pr = pm.get(r.K);
      tr.className = r.atm ? 'atm' : '';
      const dc = pr ? r.c - pr.c : 0, dp = pr ? r.p - pr.p : 0;
      tds[0].textContent = r.c.toFixed(2); tds[1].textContent = sgn(dc); tds[1].className = dc < 0 ? 'dn' : 'ch';
      tds[2].textContent = r.K;
      tds[3].textContent = r.p.toFixed(2); tds[4].textContent = sgn(dp); tds[4].className = dp < 0 ? 'dn' : 'ch';
    });
    prevChain = rows;
  }
  function masthead() {
    const last = hist[hist.length - 1], prev = hist[hist.length - 2];
    const ch = prev ? (last.close / prev.close - 1) * 100 : 0;
    el.ed.textContent = `Edition ${day}`;
    el.day.textContent = `Day ${day}`;
    el.hcn.innerHTML = '';
    el.hcn.append(`HCN ${last.close.toFixed(2)} `);
    const sp = document.createElement('span'); sp.className = ch < 0 ? 'dn' : ''; sp.textContent = `${ch < 0 ? '−' : '+'}${Math.abs(ch).toFixed(1)}%`; el.hcn.append(sp);
    el.vx.textContent = `VXHCN ${(Math.sqrt(v) * 100).toFixed(1)}`;
  }
  const sTape = makeSketch(tape, { layout: () => {}, step: stepAll, draw: drawTape });
  const sVol = makeSketch(vol, { layout: () => {}, step: () => {}, draw: drawVol });
  sVol.running = sTape.running;
  let volSpin = 0;
  function stepAll(dt) {
    acc += dt; volSpin += dt;
    if (acc >= 0.55) { acc = 0; session(); masthead(); chain(); }
    if (!sVol.visible) return;
  }
  nextItem(false);
  for (let i = 0; i < 118; i++) session();
  masthead(); chain();

  function drawTape() {
    const c = sTape.ctx, W = sTape.w, H = sTape.h;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    if (hist.length < 2) return;
    const l = 6, rgt = 58, t = 46, b = 24, n = hist.length;
    let lo = Infinity, hi = -Infinity; for (const h of hist) { lo = Math.min(lo, h.lo); hi = Math.max(hi, h.hi); }
    const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    const X = i => l + (W - l - rgt) * i / (n - 1), Y = p => t + (H - t - b) * (1 - (p - lo) / (hi - lo));
    // ticks
    const stepP = Math.pow(10, Math.floor(Math.log10((hi - lo) / 3))), nice = [1, 2, 5].map(m => m * stepP).find(sz => (hi - lo) / sz <= 5) || stepP * 10;
    c.font = `12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.strokeStyle = rgba(tok.text, 0.07); c.lineWidth = 1; c.beginPath();
    for (let p = Math.ceil(lo / nice) * nice; p <= hi; p += nice) { const y = Math.round(Y(p)) + 0.5; c.moveTo(l, y); c.lineTo(W - rgt + 4, y); c.fillText(p.toFixed(nice < 1 ? 1 : 0), W - rgt + 10, y); }
    c.stroke();
    // range band
    c.beginPath();
    hist.forEach((h, i) => { const x = X(i), y = Y(h.hi); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    for (let i = n - 1; i >= 0; i--) c.lineTo(X(i), Y(hist[i].lo));
    c.closePath(); c.fillStyle = rgba(tok.text, tok.dark ? 0.12 : 0.09); c.fill();
    // news days
    c.font = `italic 12.5px ${FONT}`; c.textBaseline = 'alphabetic';
    const taken = [];
    for (const nt of notes.slice().reverse()) {
      const i = hist.findIndex(h => h.day === nt.day); if (i < 0) continue;
      const x = Math.round(X(i)) + 0.5, w = c.measureText(nt.head).width, right = x > W * 0.55;
      const x0 = right ? x - 4 - w : x + 4;
      let row = 0;
      while (taken.some(p => p.row === row && x0 < p.x1 + 8 && x0 + w > p.x0 - 8)) row++;
      if (row > 1) continue;
      taken.push({ row, x0, x1: x0 + w });
      const ty = 14 + row * 16;
      c.strokeStyle = rgba(tok.text, 0.3); c.beginPath(); c.moveTo(x, ty + 4); c.lineTo(x, Y(hist[i].close) - 6); c.stroke();
      c.fillStyle = tok.muted; c.textAlign = 'left';
      c.fillText(nt.head, x0, ty);
    }
    // close line
    c.strokeStyle = tok.text; c.lineWidth = 1.3; c.lineJoin = 'round'; c.beginPath();
    hist.forEach((h, i) => { const x = X(i), y = Y(h.close); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
    const last = hist[n - 1], prev = hist[n - 2], down = last.close < prev.close;
    c.beginPath(); c.arc(X(n - 1), Y(last.close), 3, 0, TAU); c.fillStyle = down ? tok.accent : tok.text; c.fill();
    c.font = `600 13px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = tok.canvas;
    const lbl = last.close.toFixed(2), lw = c.measureText(lbl).width;
    c.fillRect(W - rgt + 6, Y(last.close) - 9, lw + 8, 18);
    c.fillStyle = down ? tok.accent : tok.text; c.fillText(lbl, W - rgt + 10, Y(last.close));
    c.font = `12.5px ${FONT}`; c.fillStyle = tok.muted; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.fillText(`day ${hist[0].day}`, l, H - 6); c.textAlign = 'right'; c.fillText(`day ${last.day}`, W - rgt, H - 6);
    sVol.draw();
    cap(`Edition ${day}. HCN closes at ${last.close.toFixed(2)}; at-the-money 30-day vol ${(iv(0, 30 / 365) * 100).toFixed(1)}%. After a drop the surface lifts and its skew steepens.`);
  }
  function drawVol() {
    const c = sVol.ctx, W = sVol.w, H = sVol.h;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    const ms = [], Ts = [];
    for (let i = 0; i <= 12; i++) ms.push(-0.3 + 0.6 * i / 12);
    for (let j = 0; j <= 9; j++) Ts.push(Math.exp(Math.log(0.04) + (Math.log(1) - Math.log(0.04)) * j / 9));
    const az = -0.62 + 0.22 * Math.sin(volSpin * 0.25), el2 = 0.5;
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el2), se = Math.sin(el2);
    const sc = Math.min(W / 3.3, (H - 60) / 2.5), cx = W / 2 + 4, cy = 34 + 1.78 * sc;
    const Z = s2 => clamp((s2 - 0.1) / 0.32 * 1.1, 0, 1.25);
    const P = (x, y, z) => { const X1 = x * ca - y * sa, D = x * sa + y * ca; return [cx + sc * X1, cy - sc * (z * ce + D * se), D]; };
    const grid = [];
    for (let j = 0; j < Ts.length; j++) { grid.push([]); for (let i = 0; i < ms.length; i++) { const val = iv(ms[i], Ts[j]); grid[j].push([...P(ms[i] / 0.3, j / (Ts.length - 1) * 2 - 1, Z(val)), val]); } }
    // base frame and axes
    const B = [P(-1, -1, 0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0)];
    c.strokeStyle = rgba(tok.text, 0.28); c.lineWidth = 1; c.beginPath(); B.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke();
    // vertical axis at the back corner
    let back = B[0]; for (const q of B) if (q[2] > back[2]) back = q;
    const bi = B.indexOf(back), bx = [-1, 1, 1, -1][bi], by = [-1, -1, 1, 1][bi];
    c.font = `12px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.beginPath();
    for (const lvl of [0.1, 0.2, 0.3, 0.4]) { const q = P(bx, by, Z(lvl)); c.moveTo(q[0] - 3, q[1]); c.lineTo(q[0] + 3, q[1]); c.fillText(`${Math.round(lvl * 100)}%`, q[0] - 6, q[1]); }
    const q0 = P(bx, by, 0), q1 = P(bx, by, Z(0.42)); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
    // quads, far to near
    const quads = [];
    for (let j = 0; j < Ts.length - 1; j++) for (let i = 0; i < ms.length - 1; i++) {
      const a = grid[j][i], b = grid[j][i + 1], d = grid[j + 1][i], e = grid[j + 1][i + 1];
      quads.push({ pts: [a, b, e, d], depth: a[2] + b[2] + d[2] + e[2], val: (a[3] + b[3] + d[3] + e[3]) / 4 });
    }
    quads.sort((p, q) => q.depth - p.depth);
    for (const qd of quads) {
      const tnorm = clamp((qd.val - 0.12) / 0.3, 0, 1);
      c.fillStyle = mix(tok.canvas, tok['ink-prussian'], 0.12 + 0.6 * tnorm);
      c.beginPath(); qd.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      c.fill(); c.strokeStyle = rgba(tok.text, 0.32); c.lineWidth = 0.7; c.stroke();
    }
    // axis labels
    c.font = `italic 13px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const sl = P(0, -1.32, 0), el3 = P(1.3, 0, 0);
    c.fillText('strike', sl[0], sl[1] + 14);
    c.fillText('expiry', el3[0] + 18, el3[1] + 12);
    const qt = P(bx, by, Z(0.45)); c.fillText('implied vol', qt[0], qt[1] - 6);
  }
  wirePause(sTape, $('#pp-brief'));
  $('#pp-brief').addEventListener('click', () => { sVol.running = sTape.running; });
}


INITS.push(Brief);

/* ---------- Fig. 6: Shoals, every market is a curve ---------- */
// One toy state drives six curves, the sandbox, and the race page (Fig. 7).
const SH_DAY = 412, SH_HZN = 63, SH_END = 1008;
const SH_RUNG = { 1: 'Reliable agent', 2: 'Autonomous engineer', 3: 'Autonomous researcher', 4: 'Recursion', 5: 'Takeoff threshold' };
function sh_base() {
  return {
    S: 104.2, r0: 0.0365, rTheta: 0.044, rKappa: 0.35, rSigma: 0.012,
    v0: 0.034, vTheta: 0.046, vKappa: 2.2, xi: 0.6, rho: -0.7,
    I0: 100, scramble: 0.04, strait: 0.05, trend: 0.06,
    m: { 3: 612, 4: 820, 5: 1140 }, w: { 3: 70, 4: 105, 5: 170 },
    cert: { 2: 371 }, path: null,
  };
}
const sh_clone = s => JSON.parse(JSON.stringify(s));
const sh_sig = x => 1 / (1 + Math.exp(-x));
const sh_ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function sh_yield(s, T) {
  const k = s.rKappa, B = (1 - Math.exp(-k * T)) / k;
  const lnP = -B * s.r0 + (s.rTheta - s.rSigma * s.rSigma / (2 * k * k)) * (B - T) - s.rSigma * s.rSigma * B * B / (4 * k);
  return -lnP / T;
}
const sh_vxFut = (s, mo) => 100 * Math.sqrt(s.vTheta + (s.v0 - s.vTheta) * Math.exp(-s.vKappa * mo / 12));
function sh_iv(s, m, T) {
  const e = (1 - Math.exp(-s.vKappa * T)) / (s.vKappa * T);
  const varT = s.vTheta + (s.v0 - s.vTheta) * e, atm = Math.sqrt(Math.max(varT, 1e-4));
  return Math.max(0.03, atm + s.rho * s.xi / (4 * atm) * e * m + 0.25 * s.xi * s.xi * e / atm * m * m);
}
const sh_fwd = (s, q) => s.I0 * (1 + (s.trend - 0.9 * s.scramble) * q + s.strait * q * q / 16);
const sh_prob = (s, R, d) => (s.cert[R] !== undefined && s.cert[R] <= d) ? 1 : sh_sig((d - s.m[R]) / s.w[R]);
function sh_ncdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
function sh_bs(S, K, T, sig, r, call) {
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T)), d2 = d1 - sig * Math.sqrt(T);
  const c = S * sh_ncdf(d1) - K * Math.exp(-r * T) * sh_ncdf(d2);
  return call ? c : c - S + K * Math.exp(-r * T);
}
function sh_makePath(s) {
  const rnd = mulberry32(44), out = [];
  let x = 0;
  for (let i = 0; i < 119; i++) { x += (rnd() - 0.49) * 0.022 + (rnd() < 0.03 ? (rnd() - 0.6) * 0.07 : 0); out.push(x); }
  const last = out[out.length - 1];
  return out.map(v => s.S * Math.exp(v - last)).slice(1).concat([s.S * Math.exp(out[out.length - 1] - last) * 1.004, s.S]);
}

const SH_NEWS = {
  cert: { label: 'Halcyon certifies R3', head: 'Halcyon certifies R3', apply: s => {
    if (s.cert[3] !== undefined) return false;
    s.cert[3] = SH_DAY; s.m[4] -= 120; s.m[5] -= 150; s.w[4] *= 0.85;
    s.S *= 1.072; s.v0 += 0.03; s.I0 *= 1.12; s.scramble = 0.12; s.r0 += 0.0006; s.rTheta += 0.0012;
  } },
  blockade: { label: 'Blockade scare', head: 'A blockade scare in the strait', apply: s => {
    s.strait = Math.min(0.6, s.strait + 0.4); s.S *= 0.91; s.v0 += 0.05; s.r0 -= 0.0012; s.rTheta -= 0.0022;
    if (s.cert[3] === undefined) s.m[3] += 50; s.m[4] += 90; s.m[5] += 120; s.I0 *= 1.06;
  } },
  hike: { label: 'Fed hikes', head: 'The Fed hikes 25 basis points', apply: s => {
    s.r0 += 0.0025; s.rTheta += 0.0008; s.S *= 0.982; s.v0 += 0.004; s.I0 *= 0.99;
  } },
};
const sh_mk = { cur: null, prev: null, ghost: null, t0: -1e9, dur: 1300, news: [], listeners: [] };
function sh_progress() { return sh_ease(clamp((performance.now() - sh_mk.t0) / sh_mk.dur, 0, 1)); }
function sh_fire(key) {
  const next = sh_clone(sh_mk.cur);
  if (SH_NEWS[key].apply(next) === false) return false;
  next.path = sh_mk.cur.path.slice(1).concat([next.S]);
  sh_mk.prev = sh_mk.cur; sh_mk.ghost = sh_mk.cur; sh_mk.cur = next; sh_mk.t0 = reduceMotion ? -1e9 : performance.now();
  sh_mk.news.push(SH_NEWS[key].head);
  for (const f of sh_mk.listeners) f();
  return true;
}
function sh_reset() {
  const b = sh_base(); b.path = sh_makePath(b);
  sh_mk.cur = b; sh_mk.prev = null; sh_mk.ghost = null; sh_mk.news = [];
  for (const f of sh_mk.listeners) f();
}

// Six panels, one drawing routine. Each spec samples its curve from a state.
const SH_SQ = T => Math.sqrt(T);
const SH_PANELS = [
  { key: 'hcn', yfmt: v => v.toFixed(0),
    xr: [0, 119], xticks: [[0, '120 sessions ago', 'left'], [119, 'today', 'right']],
    series: s => [{ name: 'HCN', pts: s.path.map((v, i) => [i, v]) }],
    points: s => [{ x: 119, y: s.S, id: 'hcn', kind: 'stock', desc: 'HCN shares, 100', price: s.S.toFixed(2) }] },
  { key: 'rates', yfmt: v => v.toFixed(2) + '%',
    xr: [SH_SQ(0.25), SH_SQ(10)], xticks: [[SH_SQ(0.25), '3m', 'left'], [SH_SQ(2), '2y'], [SH_SQ(5), '5y'], [SH_SQ(10), '10y', 'right']],
    series: s => [{ name: 'yield', pts: Array.from({ length: 30 }, (_, i) => { const T = Math.pow(SH_SQ(0.25) + (SH_SQ(10) - SH_SQ(0.25)) * i / 29, 2); return [SH_SQ(T), sh_yield(s, T) * 100]; }) }],
    points: s => [2, 5, 10].map(T => ({ x: SH_SQ(T), y: sh_yield(s, T) * 100, id: 'bond' + T, kind: 'bond', T, desc: `${T}-year note, $50k`, price: (sh_yield(s, T) * 100).toFixed(2) + '%' })) },
  { key: 'vx', yfmt: v => v.toFixed(1),
    xr: [1, 8], xticks: [[1, '1 month', 'left'], [4, '4'], [8, '8 months', 'right']],
    series: s => [{ name: 'VXHCN', pts: Array.from({ length: 29 }, (_, i) => { const mo = 1 + 7 * i / 28; return [mo, sh_vxFut(s, mo)]; }) }],
    points: s => [1, 2, 3, 6].map(mo => ({ x: mo, y: sh_vxFut(s, mo), id: 'vx' + mo, kind: 'vx', mo, desc: `VXHCN ${mo}-month future`, price: sh_vxFut(s, mo).toFixed(1) })) },
  { key: 'smile', yfmt: v => v.toFixed(0) + '%',
    xr: [72, 136], xticks: [[80, '80'], [100, '100'], [120, '120'], [136, 'strike', 'right']],
    series: s => [{ name: 'iv', pts: Array.from({ length: 33 }, (_, i) => { const K = 72 + 64 * i / 32; return [K, sh_iv(s, Math.log(K / s.S), SH_HZN / 252) * 100]; }) }],
    spot: s => s.S,
    points: s => [[85, false], [95, false], [110, true], [120, true]].map(([K, call]) => {
      const iv = sh_iv(s, Math.log(K / s.S), SH_HZN / 252);
      return { x: K, y: iv * 100, id: 'opt' + K, kind: 'opt', K, call, desc: `HCN ${K} ${call ? 'call' : 'put'}, 63 days`, price: sh_bs(s.S, K, SH_HZN / 252, iv, s.r0, call).toFixed(2) };
    }) },
  { key: 'cmp', yfmt: v => v.toFixed(0),
    xr: [0, 4], xticks: [[0, 'index', 'left'], [1, 'day 475'], [2, '538'], [3, '601'], [4, '664', 'right']],
    series: s => [{ name: 'Cambria', pts: Array.from({ length: 25 }, (_, i) => [4 * i / 24, sh_fwd(s, 4 * i / 24)]) }],
    points: s => [1, 2, 3, 4].map(q => ({ x: q, y: sh_fwd(s, q), id: 'cmp' + q, kind: 'cmp', q, desc: `Cambria day-${SH_DAY + 63 * q} future`, price: sh_fwd(s, q).toFixed(1) })) },
  { key: 'cons', yfmt: v => Math.round(v * 100) + '%', fixed: [0, 1],
    xr: [SH_DAY, SH_END], xticks: [[SH_DAY, 'today', 'left'], [664, 'day 664'], [916, '916'], [SH_END, '1008', 'right']],
    series: s => [2, 3, 4, 5].map(R => ({ name: 'R' + R, R, pts: Array.from({ length: 41 }, (_, i) => { const d = SH_DAY + (SH_END - SH_DAY) * i / 40; return [d, R === 2 ? 1 : sh_prob(s, R, d)]; }) })),
    points: s => {
      const out = [];
      for (const R of [3, 4, 5]) { if (s.cert[R] !== undefined) continue; for (const d of [475, 538, 664, 916]) out.push({ x: d, y: sh_prob(s, R, d), id: `bin${R}-${d}`, kind: 'bin', R, d, desc: `R${R} certified by day ${d}`, price: Math.round(sh_prob(s, R, d) * 100) + '¢' }); }
      return out;
    } },
];

// The book and its scenario grid
const SH_COLS = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
const SH_ROWS = [2, 3, 4];
let sh_book = [];
function sh_scen(st, m, rho) {
  const c3 = st.cert[3] !== undefined;
  return {
    S: st.S * (1 + m), dy: { 2: -0.001, 3: 0, 4: 0.002 }[rho],
    VX: 100 * Math.sqrt(st.v0) + 30 * Math.abs(m) + (m < 0 ? 18 * -m : 0) + { 2: -2, 3: 0, 4: 4 }[rho],
    I: st.I0 * { 2: 0.93, 3: c3 ? 1.0 : 1.10, 4: c3 ? 1.18 : 1.32 }[rho] * (1 + 0.15 * m), strait: st.strait, rho,
  };
}
function sh_leg(pt, side, st) {
  const L = { id: pt.id, side, desc: pt.desc, entry: pt.price };
  if (pt.kind === 'stock') { const e = st.S; L.pnl = sc => 100 * (sc.S - e); }
  else if (pt.kind === 'bond') { const y = sh_yield(st, pt.T), dur = pt.T / (1 + y); L.pnl = sc => -50000 * dur * sc.dy; }
  else if (pt.kind === 'vx') { const F = sh_vxFut(st, pt.mo), th = 100 * Math.sqrt(st.vTheta), k = st.vKappa;
    L.pnl = sc => 200 * ((pt.mo <= 3 ? sc.VX : th + (sc.VX - th) * Math.exp(-k * (pt.mo - 3) / 12)) - F); }
  else if (pt.kind === 'opt') { const prem = sh_bs(st.S, pt.K, SH_HZN / 252, sh_iv(st, Math.log(pt.K / st.S), SH_HZN / 252), st.r0, pt.call);
    L.pnl = sc => 100 * ((pt.call ? Math.max(sc.S - pt.K, 0) : Math.max(pt.K - sc.S, 0)) - prem); }
  else if (pt.kind === 'cmp') { const F = sh_fwd(st, pt.q);
    L.pnl = sc => { const k = pt.q - 1, slope = { 2: 0.01, 3: 0, 4: -0.025 }[sc.rho]; return 50 * ((pt.q === 1 ? sc.I : sc.I * (1 + slope * k + sc.strait * k * k / 16)) - F); }; }
  else if (pt.kind === 'bin') { const p = sh_prob(st, pt.R, pt.d), m = st.m[pt.R], w = st.w[pt.R];
    L.pnl = sc => { const v = sc.rho >= pt.R ? 1 : pt.d <= SH_DAY + SH_HZN ? 0 : sh_sig((pt.d - (m + 60)) / w); return 5000 * (v - p); }; }
  return L;
}
let sh_touched = false;
function sh_toggle(pt) {
  sh_touched = true;
  const i = sh_book.findIndex(l => l.id === pt.id);
  if (i < 0) sh_book.push(sh_leg(pt, 1, sh_mk.cur));
  else if (sh_book[i].side === 1) sh_book[i] = sh_leg(pt, -1, sh_mk.cur);
  else sh_book.splice(i, 1);
  sh_renderBook();
}
const sh_money = v => (v >= 0 ? '+' : '−') + (Math.abs(v) / 1000).toFixed(1);
function sh_renderBook() {
  const body = $('#sh-book'), empty = $('#sh-book-empty'), grid = $('#sh-scen'), read = $('#sh-read');
  if (!body) return;
  body.textContent = '';
  for (const L of sh_book) {
    const tr = document.createElement('tr');
    const td = t => { const d = document.createElement('td'); d.textContent = t; tr.appendChild(d); return d; };
    td(L.desc).className = 'sh-l';
    td(L.side > 0 ? 'long' : 'short');
    td(L.entry);
    const x = document.createElement('td'), b = document.createElement('button');
    b.type = 'button'; b.className = 'sh-x'; b.textContent = '×'; b.setAttribute('aria-label', 'Remove ' + L.desc);
    b.addEventListener('click', () => { sh_book = sh_book.filter(l => l !== L); sh_renderBook(); for (const s of sh_panels) s.draw(); });
    x.appendChild(b); tr.appendChild(x);
    body.appendChild(tr);
  }
  empty.hidden = sh_book.length > 0;
  const sub = $('#sh-book-sub'); if (sub && sh_touched) sub.textContent = '· yours';
  // scenario grid
  const st = sh_mk.cur, c3 = st.cert[3] !== undefined;
  const cells = SH_ROWS.map(rho => SH_COLS.map(m => (c3 && rho === 2) ? null : sh_book.reduce((a, L) => a + L.side * L.pnl(sh_scen(st, m, rho)), 0)));
  const flat = cells.flat().filter(v => v !== null), maxAbs = Math.max(500, ...flat.map(Math.abs));
  const gain = tok['ink-viridian'];
  let html = '<thead><tr><th scope="col"><span class="sh-vh">Highest rung certified by day 475</span></th>' + SH_COLS.map(m => `<th scope="col">${m === 0 ? '0' : (m > 0 ? '+' : '−') + Math.abs(m * 100) + '%'}</th>`).join('') + '</tr></thead><tbody>';
  SH_ROWS.forEach((rho, ri) => {
    html += `<tr><th scope="row">${rho === 2 ? 'R3 not yet' : 'R' + rho + ' certified'}</th>`;
    cells[ri].forEach(v => {
      if (v === null) { html += '<td class="sh-na" aria-label="already past">·</td>'; return; }
      const t = Math.min(1, Math.abs(v) / maxAbs) * 0.78, bg = mix(tok.canvas, v < 0 ? tok.accent : gain, t);
      html += `<td style="background:${bg};color:${!tok.dark && t > 0.46 ? tok.canvas : tok.text}">${sh_book.length ? sh_money(v) : '0.0'}</td>`;
    });
    html += '</tr>';
  });
  grid.innerHTML = html + '</tbody>';
  read.textContent = sh_reading(cells, maxAbs);
}
function sh_reading(cells, maxAbs) {
  if (!sh_book.length) return 'Click a point on any curve to add a leg; click again to go short, a third time to remove it.';
  const mean = a => { const v = a.filter(x => x !== null); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : 0; };
  const rows = cells.map(mean).map((v, i) => [v, i]).filter((_, i) => cells[i][0] !== null);
  const col = j => mean(cells.map(r => r[j]));
  const thr = 0.15 * maxAbs;
  const race = rows[rows.length - 1][0] - rows[0][0], hcn = col(6) - col(0), lowEdge = col(0) - col(3), highEdge = col(6) - col(3);
  const parts = [];
  if (Math.abs(race) > thr) parts.push(race > 0 ? 'the race runs faster than priced' : 'the race stalls');
  if (Math.abs(hcn) > thr) parts.push(hcn > 0 ? 'HCN rises' : 'HCN falls');
  let first = parts.length ? `This book makes money if ${parts.join(' and ')}.` : 'This book is close to flat in direction.';
  if (lowEdge > thr && highEdge > thr) first += ' It also gains from a big move either way.';
  else if (lowEdge < -thr && highEdge < -thr) first += ' It wants a quiet quarter.';
  let worst = Infinity, wi = 0, wj = 0;
  cells.forEach((r, i) => r.forEach((v, j) => { if (v !== null && v < worst) { worst = v; wi = i; wj = j; } }));
  const rl = SH_ROWS[wi] === 2 ? 'R3 still uncertified' : `R${SH_ROWS[wi]} certified`;
  const cl = SH_COLS[wj] === 0 ? 'flat' : `${SH_COLS[wj] > 0 ? 'up' : 'down'} ${Math.abs(SH_COLS[wj] * 100)}%`;
  return worst < 0 ? `${first} The worst case is ${rl} with HCN ${cl}, a loss of $${(Math.abs(worst) / 1000).toFixed(1)}k.` : `${first} No scenario here loses money.`;
}

let sh_panels = [];
function sh_panelSketch(spec) {
  const canvas = $('#cv-sh-' + spec.key);
  let hover = null, pts = [];
  const s = makeSketch(canvas, { step() {}, draw, theme: spec.key === 'hcn' ? sh_renderBook : undefined });
  const G = () => ({ l: 6, r: s.w - 50, t: 14, b: s.h - 22 });
  const local = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  const hit = e => { const [x, y] = local(e); let best = null, bd = 14; for (const p of pts) { const d = Math.hypot(p.sx - x, p.sy - y); if (d < bd) { bd = d; best = p; } } return best; };
  canvas.addEventListener('pointermove', e => { const h = hit(e); if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : ''; draw(); } });
  canvas.addEventListener('pointerleave', () => { hover = null; draw(); });
  canvas.addEventListener('click', e => { const h = hit(e); if (h) { sh_toggle(h); for (const p of sh_panels) p.draw(); } });

  function draw() {
    if (!s.ready || !sh_mk.cur) return;
    const c = s.ctx, W = s.w, H = s.h, g = G();
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    const p = sh_mk.prev ? sh_progress() : 1;
    const cur = spec.series(sh_mk.cur), prev = sh_mk.prev ? spec.series(sh_mk.prev) : null;
    const series = cur.map((sr, k) => ({ ...sr, pts: sr.pts.map((q, i) => prev ? [q[0], prev[k].pts[i][1] + (q[1] - prev[k].pts[i][1]) * p] : q) }));
    const ghost = sh_mk.ghost ? spec.series(sh_mk.ghost) : null;
    let lo, hi;
    if (spec.fixed) [lo, hi] = spec.fixed;
    else {
      lo = Infinity; hi = -Infinity;
      for (const set of [cur, prev, ghost]) if (set) for (const sr of set) for (const q of sr.pts) { lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); }
      const pad = Math.max((hi - lo) * 0.14, Math.abs(hi) * 0.004); lo -= pad; hi += pad;
    }
    const X = x => g.l + (g.r - g.l) * (x - spec.xr[0]) / (spec.xr[1] - spec.xr[0]);
    const Y = y => g.t + (g.b - g.t) * (1 - (y - lo) / (hi - lo));
    // grid and labels
    c.font = `12px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
    const ticks = spec.fixed ? [0, 0.5, 1] : (() => { const st = Math.pow(10, Math.floor(Math.log10((hi - lo) / 2.5))); const n = [1, 2, 5, 10].map(k => k * st).find(z => (hi - lo) / z <= 4); const a = []; for (let v = Math.ceil(lo / n) * n; v <= hi; v += n) a.push(v); return a; })();
    c.strokeStyle = rgba(tok.text, 0.07); c.lineWidth = 1; c.beginPath();
    for (const v of ticks) { const y = Math.round(Y(v)) + 0.5; c.moveTo(g.l, y); c.lineTo(g.r + 4, y); }
    c.stroke();
    c.fillStyle = tok.muted;
    for (const v of ticks) c.fillText(spec.yfmt(v), g.r + 8, Y(v));
    c.textBaseline = 'alphabetic';
    for (const [x, t, al] of spec.xticks) { c.textAlign = al || 'center'; c.fillText(t, X(x), H - 6); }
    if (spec.spot) { const x = Math.round(X(spec.spot(sh_mk.cur))) + 0.5; c.strokeStyle = rgba(tok.text, 0.25); c.setLineDash([2, 3]); c.beginPath(); c.moveTo(x, g.t); c.lineTo(x, g.b); c.stroke(); c.setLineDash([]); }
    // ghost of the prior state
    if (ghost) {
      c.strokeStyle = rgba(tok.text, 0.32); c.lineWidth = 1; c.setLineDash([3, 3]);
      for (const sr of ghost) { if (sr.R === 2) continue; c.beginPath(); sr.pts.forEach((q, i) => i ? c.lineTo(X(q[0]), Y(q[1])) : c.moveTo(X(q[0]), Y(q[1]))); c.stroke(); }
      c.setLineDash([]);
    }
    // the curves
    const cons = spec.key === 'cons', ind = tok['ink-indigo'];
    for (const sr of series) {
      const settled = cons && (sr.R === 2 || sh_mk.cur.cert[sr.R] !== undefined);
      c.strokeStyle = cons ? rgba(ind, settled ? 0.4 : { 3: 1, 4: 0.78, 5: 0.56 }[sr.R]) : tok.text;
      c.lineWidth = cons ? 1.4 : 1.4; c.lineJoin = 'round';
      if (settled) c.setLineDash([2, 3]);
      c.beginPath(); sr.pts.forEach((q, i) => i ? c.lineTo(X(q[0]), Y(q[1])) : c.moveTo(X(q[0]), Y(q[1]))); c.stroke();
      c.setLineDash([]);
      if (cons) {
        c.font = `italic 12px ${FONT}`; c.fillStyle = settled ? tok.muted : ind; c.textAlign = 'left'; c.textBaseline = 'middle';
        let lx, ly;
        if (settled) { lx = X(SH_DAY) + 4; ly = Y(1) + 9; c.fillText(`${sr.name} certified`, lx, ly); }
        else { const q = sr.pts.find(z => z[1] >= 0.5) || sr.pts[sr.pts.length - 1]; lx = Math.min(X(q[0]) + 5, g.r - 24); ly = Y(Math.min(0.92, Math.max(0.12, q[1]))) - 7; c.fillText(sr.name, lx, ly); }
        c.textBaseline = 'alphabetic';
      }
    }
    // tradable points and held legs
    pts = spec.points(sh_mk.cur).map(q => ({ ...q, sx: X(q.x), sy: Y(q.y) }));
    for (const q of pts) {
      const leg = sh_book.find(l => l.id === q.id), on = hover && hover.id === q.id;
      if (leg) {
        c.fillStyle = tok.text; c.beginPath();
        const d = leg.side > 0 ? -1 : 1, r = 5.5;
        c.moveTo(q.sx, q.sy + d * r); c.lineTo(q.sx - r, q.sy - d * r * 0.7); c.lineTo(q.sx + r, q.sy - d * r * 0.7); c.closePath(); c.fill();
        c.strokeStyle = tok.canvas; c.lineWidth = 1.5; c.stroke();
      } else {
        c.beginPath(); c.arc(q.sx, q.sy, on ? 5 : 3.4, 0, TAU);
        c.fillStyle = tok.canvas; c.fill(); c.lineWidth = on ? 1.6 : 1.1; c.strokeStyle = rgba(tok.text, on ? 0.95 : 0.6); c.stroke();
      }
    }
    if (hover) {
      const t = `${hover.desc} · ${hover.price}`;
      c.font = `italic 12.5px ${FONT}`; const tw = c.measureText(t).width;
      let tx = hover.sx - tw / 2; tx = clamp(tx, 4, W - tw - 4);
      const ty = hover.sy - 14 < 14 ? hover.sy + 22 : hover.sy - 12;
      c.fillStyle = tok.canvas; c.fillRect(tx - 4, ty - 13, tw + 8, 18);
      c.strokeStyle = rgba(tok.text, 0.3); c.lineWidth = 1; c.strokeRect(tx - 3.5, ty - 12.5, tw + 7, 17);
      c.fillStyle = tok.text; c.textAlign = 'left'; c.fillText(t, tx, ty);
    }
  }
  s.running = true;
  return s;
}

function sh_Markets() {
  if (!$('#cv-sh-hcn')) return;
  sh_reset();
  sh_panels = SH_PANELS.map(sh_panelSketch);
  const cap = captioner($('#cap-sh-mk'));
  const news = [...document.querySelectorAll('[data-sh-news]')];
  const say = () => {
    const st = sh_mk.cur;
    const last = sh_mk.news[sh_mk.news.length - 1];
    cap(last
      ? `${last}. The ghost lines are the curves before it. HCN ${st.S.toFixed(2)} · VXHCN ${(100 * Math.sqrt(st.v0)).toFixed(1)} · 10-year ${(sh_yield(st, 10) * 100).toFixed(2)}% · R4 by day 1008 at ${Math.round(sh_prob(st, 4, SH_END) * 100)}%.`
      : `Day ${SH_DAY}. Six markets, one state. Fire a news item to see what moves together and what does not.`, true);
  };
  news.forEach(b => b.addEventListener('click', () => {
    if (!sh_fire(b.dataset.shNews)) { b.disabled = true; return; }
    if (b.dataset.shNews === 'cert') b.disabled = true;
    sh_renderBook(); say();
  }));
  $('#sh-news-reset').addEventListener('click', () => { sh_reset(); news.forEach(b => { b.disabled = false; }); sh_renderBook(); say(); for (const s of sh_panels) s.draw(); });
  $('#sh-clear').addEventListener('click', () => { sh_touched = true; sh_book = []; sh_renderBook(); for (const s of sh_panels) s.draw(); });
  // an example book, so the grid opens with something in it
  const pick = (key, id) => SH_PANELS.find(p => p.key === key).points(sh_mk.cur).find(q => q.id === id);
  sh_book = [sh_leg(pick('cmp', 'cmp2'), 1, sh_mk.cur), sh_leg(pick('cons', 'bin3-664'), 1, sh_mk.cur), sh_leg(pick('smile', 'opt95'), -1, sh_mk.cur)];
  sh_renderBook(); say();
}
INITS.push(sh_Markets);

/* ---------- Fig. 7: Shoals, the race page ---------- */
const SH_LABS = [
  { id: 'halcyon', name: 'Halcyon', ink: 'ink-prussian', rel: [[40, 1.58], [118, 1.66], [205, 1.79], [296, 1.92], [371, 2.08], [402, 2.31]],
    c: t => 1.75 + 0.0022 * t + 0.9 * sh_sig((t - 500) / 60) + 1.2 * sh_sig((t - 800) / 70) },
  { id: 'tianxia', name: 'Tianxia', ink: 'ink-mulberry', rel: [[25, 1.18], [92, 1.31], [170, 1.47], [251, 1.62], [330, 1.81], [389, 1.97]],
    c: t => 1.28 + 0.0021 * t + 0.6 * sh_sig((t - 600) / 80) + 0.5 * sh_sig((t - 860) / 60) },
  { id: 'polaris', name: 'Polaris', ink: 'ink-viridian', rel: [[409, 1.74]], from: 400,
    c: t => 1.95 + 0.0024 * (t - 400) + 0.8 * sh_sig((t - 650) / 70) },
];
const SH_CLAIMS = [{ lab: 0, R: 3, day: 402 }, { lab: 2, R: 2, day: 409 }];
const SH_FIXED = [[0, 100], [63, 104], [126, 109], [189, 115], [252, 122], [315, 126], [378, 142]];
function sh_internal(lab, t) {
  const n = makeNoise(lab.name.length * 7);
  return clamp(lab.c(t) + 0.05 * (n(t / 40, 1) - 0.5), 0.3, 5.5);
}
function sh_Race() {
  const canvas = $('#cv-sh-race');
  if (!canvas) return;
  const cap = captioner($('#cap-sh-race')), bEpi = $('#sh-epi');
  let epi = false;
  bEpi.addEventListener('click', () => { epi = !epi; bEpi.setAttribute('aria-pressed', String(epi)); s.draw(); });
  const s = makeSketch(canvas, { step() {}, draw });
  s.running = true;
  const crossing = (lab, R) => { for (let t = lab.from || 0; t <= SH_END; t++) if (sh_internal(lab, t) >= R) return t; return null; };
  function draw() {
    if (!s.ready || !sh_mk.cur) return;
    const c = s.ctx, W = s.w, H = s.h, st = sh_mk.cur, narrow = W < 640;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    const L0 = narrow ? 10 : 16, R0 = W - (narrow ? 44 : 118), T0 = 58, B0 = H * (narrow ? 0.74 : 0.77);
    const fT = B0 + 32, fB = H - 30;
    const X = d => L0 + (R0 - L0) * d / SH_END, Y = v => B0 - (B0 - T0) * (v - 0.6) / 5.0;
    const ind = tok['ink-indigo'], now = X(SH_DAY);
    // the priced future
    c.fillStyle = rgba(tok.text, tok.dark ? 0.035 : 0.025); c.fillRect(now, T0 - 18, R0 - now, B0 - T0 + 18);
    c.font = `italic 12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText(narrow ? 'priced' : 'priced by Consensus', now + 6, T0 - 6);
    // years
    c.strokeStyle = rgba(tok.text, 0.07); c.lineWidth = 1; c.beginPath();
    for (let y = 0; y <= 4; y++) { const x = Math.round(X(y * 252)) + 0.5; c.moveTo(x, T0 - 18); c.lineTo(x, fB); }
    c.stroke();
    c.font = `12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'center';
    for (let y = 0; y < 4; y++) c.fillText(`year ${y + 1}`, X(y * 252 + 126), H - 10);
    // rung lines
    for (let R = 1; R <= 5; R++) {
      const y = Math.round(Y(R)) + 0.5;
      c.strokeStyle = rgba(tok.text, R === 5 ? 0.45 : 0.24); c.lineWidth = 1; c.beginPath(); c.moveTo(L0, y); c.lineTo(R0, y); c.stroke();
      c.font = `italic 12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'left';
      c.fillText(narrow ? `R${R}` : `R${R} · ${SH_RUNG[R]}`, L0 + 2, y - 5);
    }
    // open weights: a band trailing Tianxia's releases
    const tx = SH_LABS[1].rel;
    c.beginPath();
    const openAt = d => { let v = tx[0][1]; for (const [dd, cc] of tx) if (dd <= d) v = cc; return v - 0.15; };
    for (let d = tx[0][0]; d <= SH_DAY; d += 4) c.lineTo(X(d), Y(openAt(d) + 0.05));
    for (let d = SH_DAY; d >= tx[0][0]; d -= 4) c.lineTo(X(d), Y(openAt(d) - 0.05));
    c.closePath(); c.fillStyle = rgba(tok['ink-umber'], 0.28); c.fill();
    c.font = `italic 12px ${FONT}`; c.fillStyle = tok['ink-umber']; c.textAlign = 'right';
    if (!narrow) c.fillText('open weights', X(SH_DAY) - 6, Y(openAt(SH_DAY)) + 16);
    // the hidden internal tracks, for the epilogue
    if (epi) {
      for (const lab of SH_LABS) {
        c.strokeStyle = rgba(tok[lab.ink], 0.55); c.lineWidth = 1.1; c.setLineDash([1, 0]); c.beginPath();
        for (let d = lab.from || 0; d <= SH_END; d += 3) { const v = sh_internal(lab, d); d === (lab.from || 0) ? c.moveTo(X(d), Y(v)) : c.lineTo(X(d), Y(v)); }
        c.stroke();
      }
      const h = SH_LABS[0];
      for (const R of [3, 4, 5]) {
        const d = crossing(h, R); if (d === null) continue;
        const x = X(d), y = Y(R);
        c.strokeStyle = tok[h.ink]; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x, y + 7); c.stroke();
      }
    }
    // Consensus: the implied crossing date as a density along each uncertified rung
    for (const R of [3, 4, 5]) {
      if (st.cert[R] !== undefined) continue;
      const m = st.m[R], w = st.w[R], y = Y(R), fmax = 1 / (4 * w), amp = narrow ? 9 : 13;
      const dens = d => { const z = Math.exp(-(d - m) / w); return z / (w * (1 + z) * (1 + z)) / fmax; };
      c.beginPath();
      for (let d = SH_DAY; d <= SH_END; d += 3) c.lineTo(X(d), y - amp * dens(d));
      for (let d = SH_END; d >= SH_DAY; d -= 3) c.lineTo(X(d), y + amp * dens(d));
      c.closePath(); c.fillStyle = rgba(ind, tok.dark ? 0.3 : 0.2); c.fill(); c.strokeStyle = rgba(ind, 0.55); c.lineWidth = 0.8; c.stroke();
      c.font = `italic 12px ${FONT}`; c.fillStyle = ind;
      if (m <= SH_END) { const mx = X(m); c.beginPath(); c.moveTo(mx, y - amp - 3); c.lineTo(mx, y + amp + 3); c.strokeStyle = ind; c.lineWidth = 1.2; c.stroke(); if (!narrow) { c.textAlign = 'center'; c.fillText(`median day ${Math.round(m)}`, mx, y + amp + 15); } }
      const pe = sh_prob(st, R, SH_END);
      c.textAlign = 'left'; c.fillText(narrow ? (pe > 0.99 ? '>99%' : `${Math.round(pe * 100)}%`) : (pe > 0.99 ? 'over 99% by 1008' : `${Math.round(pe * 100)}% by day 1008`), R0 + 6, y + 4);
    }
    // frontier envelope
    const rel = SH_LABS.flatMap((lab, li) => lab.rel.map(([d, v]) => [d, v, li])).sort((a, b) => a[0] - b[0]);
    c.strokeStyle = rgba(tok.text, 0.6); c.lineWidth = 1.2; c.beginPath();
    let best = -Infinity, first = true;
    for (const [d, v] of rel) { if (v > best) { if (!first) c.lineTo(X(d), Y(best)); best = v; first ? c.moveTo(X(d), Y(v)) : c.lineTo(X(d), Y(v)); first = false; } }
    c.lineTo(X(SH_DAY), Y(best)); c.stroke();
    // claims, hollow; certifications, filled
    const diamond = (x, y, r, fill, col) => { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); if (fill) { c.fillStyle = col; c.fill(); c.strokeStyle = tok.canvas; c.lineWidth = 1.5; c.stroke(); } else { c.fillStyle = tok.canvas; c.fill(); c.strokeStyle = col; c.lineWidth = 1.4; c.stroke(); } };
    c.font = `italic 12px ${FONT}`; c.textAlign = 'right';
    for (const cl of SH_CLAIMS) { if (st.cert[cl.R] !== undefined && cl.R === 3) continue; const x = X(cl.day), y = Y(cl.R); diamond(x, y, 5.5, false, tok[SH_LABS[cl.lab].ink]); }
    for (const [R, d] of Object.entries(st.cert)) { const x = X(d), y = Y(+R); diamond(x, y, 6, true, tok[SH_LABS[0].ink]); if (!narrow) { c.fillStyle = tok.text2; c.fillText(`certified day ${d}`, x - 9, y - 7); } }
    // releases
    for (const lab of SH_LABS) for (const [d, v] of lab.rel) { c.beginPath(); c.arc(X(d), Y(v), 4.3, 0, TAU); c.fillStyle = tok[lab.ink]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = tok.canvas; c.stroke(); }
    // lab labels
    c.font = `13px ${FONT}`; c.textAlign = 'left';
    const lastY = SH_LABS.map(lab => Y(lab.rel[lab.rel.length - 1][1]));
    const order = lastY.map((y, i) => [y, i]).sort((a, b) => a[0] - b[0]);
    for (let k = 1; k < order.length; k++) if (order[k][0] - order[k - 1][0] < 15) order[k][0] = order[k - 1][0] + 15;
    for (const [y, i] of order) lastY[i] = y;
    SH_LABS.forEach((lab, i) => { c.fillStyle = tok[lab.ink]; c.fillText(lab.name, now + 7, lastY[i] + 4); });
    // today
    c.strokeStyle = rgba(tok.text, 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(now) + 0.5, T0 - 18); c.lineTo(Math.round(now) + 0.5, B0 + 4); c.stroke();
    c.font = `italic 12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'right'; c.fillText(`today, day ${SH_DAY}`, now - 6, T0 - 6);
    // the Fixedpoint Index, self-graded and unlisted
    const FY = v => fB - (fB - fT) * (v - 95) / 55;
    c.strokeStyle = rgba(tok.text, 0.18); c.lineWidth = 1; c.beginPath(); c.moveTo(L0, Math.round(fB) + 0.5); c.lineTo(R0, Math.round(fB) + 0.5); c.stroke();
    c.strokeStyle = tok['ink-prussian']; c.lineWidth = 1.2; c.setLineDash([4, 3]); c.beginPath();
    SH_FIXED.forEach(([d, v], i) => i ? c.lineTo(X(d), FY(v)) : c.moveTo(X(d), FY(v))); c.stroke(); c.setLineDash([]);
    for (const [d, v] of SH_FIXED) { c.beginPath(); c.arc(X(d), FY(v), 3.2, 0, TAU); c.fillStyle = tok.canvas; c.fill(); c.strokeStyle = tok['ink-prussian']; c.lineWidth = 1.2; c.stroke(); }
    c.font = `italic 12.5px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'left';
    c.fillText(narrow ? 'Fixedpoint Index, self-graded' : 'Fixedpoint Index · Halcyon’s tasks, graded by Halcyon · Consensus will not list it', L0 + 2, fT - 8);
    c.fillStyle = tok['ink-prussian']; c.fillText(`${SH_FIXED[SH_FIXED.length - 1][1]}`, X(378) + 8, FY(142) + 4);
    // caption
    const fr = best.toFixed(2), m3 = st.cert[3] !== undefined ? null : Math.round(st.m[3]), m4 = Math.round(st.m[4]);
    const timeline = m3 ? `Consensus prices R3 by day ${m3} and R4 by day ${m4}, at the medians` : `R3 is certified; Consensus now prices R4 by day ${m4} at the median`;
    if (epi) {
      const c3 = crossing(SH_LABS[0], 3), c4 = crossing(SH_LABS[0], 4);
      cap(`Epilogue. The faint lines are what each lab had in house. Halcyon crossed R3 internally on day ${c3} and R4 on day ${c4}; ${m3 ? `the market's medians were day ${m3} and ${m4}` : `the market's R4 median was day ${m4}`}.`);
    } else cap(`Day ${SH_DAY}. The released frontier stands at ${fr} rungs. ${timeline}. Hollow marks are claims nobody has adjudicated.`);
  }
}
INITS.push(sh_Race);
