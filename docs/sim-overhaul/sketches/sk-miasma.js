/* ---------- Fig. 4: Miasma, the atlas with glued edges ---------- */
// Gluing of the three opposite-edge pairs (T1, T2, T3), as in projects/miasma/src/topology.js.
const mi_TOPO = {
  plane:    [null, null, null],
  cylinder: ['translate', null, null],
  torus:    ['translate', 'translate', 'translate'],
  mobius:   ['twist', null, null],
  klein:    ['twist', 'translate', null],
  rp2:      ['antipode', 'antipode', 'antipode'],
};
const mi_NAMES = { plane: 'plane', cylinder: 'cylinder', torus: 'torus', mobius: 'Möbius band', klein: 'Klein surface', rp2: 'projective plane' };
const mi_CAPS = {
  plane: 'Plane. All six edges are shores, so the wave stops where the world ends.',
  cylinder: 'Cylinder. The single-chevron edges are glued straight; the other four are shores.',
  torus: 'Torus. All three pairs are glued straight, so a wave that leaves one edge comes back from its partner.',
  mobius: 'Möbius band. The single-chevron edges are glued with a twist, so the copy beyond them is mirrored.',
  klein: 'Klein, as Miasma builds it. Single chevrons twist, double chevrons glue straight, and the third pair stays a shore.',
  rp2: 'RP². Every edge is glued to its opposite through the center, so each copy beyond an edge is turned a half turn.',
};
const mi_DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
const mi_cube = (q, r) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
// Edges of the world hexagon by outward normal angle (degrees, canvas y down) → [pair, side].
const mi_EDGES = [[-30, 0, 1], [30, 1, 1], [90, 2, 1], [150, 0, -1], [-150, 1, -1], [-90, 2, -1]];
const mi_TWIST = [0.5, -Math.sqrt(3) / 2, -Math.sqrt(3) / 2, -0.5]; // reflection across the pair-1 axis (cube r↔s swap)

function mi_Atlas() {
  const canvas = $('#cv-atlas');
  const cap = captioner($('#mi-cap'));
  const S = 0, E = 1, I = 2, REC = 3, D = 4, V = 5, X = 9;
  const SQ3 = Math.sqrt(3);
  let R, rc, apo, Rb, cx0, cy0, N, qs, rs, idxOf, side, lx, ly, beta, stip, lake, nb, mask;
  let st, arr, tick = 0, acc = 0, quiet = 0, mode = 'seed', painting = false, topo = 'torus';
  let tile = null, ghostL = null, tw = 0, th = 0;
  const SP = 4;
  let rxn, ryn, rcell, contours = [], lastContour = -99;
  const rnd = mulberry32(3);
  const s = makeSketch(canvas, { layout, step, draw });

  const cellAt = (q, r) => (Math.abs(q) > R || Math.abs(r) > R) ? -1 : idxOf[(r + R) * side + (q + R)];
  const inside = (q, r) => mi_cube(q, r) <= R;
  const T = () => [[2 * R + 1, -R], [R, R + 1], [-R - 1, 2 * R + 1]];
  const lpix = ([q, r]) => [SQ3 * rc * (q + r / 2), 1.5 * rc * r];

  function toHex(q, r) {
    if (inside(q, r)) return [q, r];
    const [t1, t2] = T();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      if (!a && !b) continue;
      const qp = q - a * t1[0] - b * t2[0], rp = r - a * t1[1] - b * t2[1];
      if (inside(qp, rp)) return [qp, rp];
    }
    return null;
  }
  function viaT(q, r, k) {
    const t = T()[k];
    for (const dir of [1, -1]) { const qp = q - dir * t[0], rp = r - dir * t[1]; if (inside(qp, rp)) return [qp, rp]; }
    return null;
  }
  function mobius(q, r) {
    const t1 = T()[0];
    for (const dir of [1, -1]) {
      const qp = q - dir * t1[0], rp = r - dir * t1[1];
      const tq = qp, tr = -rp - qp; // the twist keeps q and swaps r with s
      if (inside(tq, tr)) return [tq, tr];
    }
    return null;
  }
  function wrap(q, r) {
    if (inside(q, r)) return [q, r];
    switch (topo) {
      case 'torus': return toHex(q, r);
      case 'cylinder': return viaT(q, r, 0);
      case 'mobius': return mobius(q, r);
      case 'klein': return mobius(q, r) || viaT(q, r, 1);
      case 'rp2': return inside(-q, -r) ? [-q, -r] : toHex(-q, -r);
      default: return null;
    }
  }
  function buildNbr() {
    nb = new Int32Array(N * 6).fill(-1);
    for (let k = 0; k < N; k++) mi_DIRS.forEach(([dq, dr], e) => {
      const w = wrap(qs[k] + dq, rs[k] + dr);
      if (w) nb[k * 6 + e] = cellAt(w[0], w[1]);
    });
  }
  // Screen-space affine map for the copy beyond each glued edge: p = M·w + L.
  function ghosts() {
    const out = [], Ts = T(), kinds = mi_TOPO[topo];
    for (const [ang, pair, sgn] of mi_EDGES) {
      const kind = kinds[pair];
      if (!kind) continue;
      const L = lpix([sgn * Ts[pair][0], sgn * Ts[pair][1]]);
      const M = kind === 'translate' ? [1, 0, 0, 1] : kind === 'twist' ? mi_TWIST : [-1, 0, 0, -1];
      out.push({ ang, pair, sgn, kind, L, M });
    }
    return out;
  }
  function pickLocal(x, y) {
    const q = (SQ3 / 3 * x - y / 3) / rc, r = (2 / 3 * y) / rc;
    let xq = Math.round(q), zq = Math.round(r), yq = Math.round(-q - r);
    const dx = Math.abs(xq - q), dy = Math.abs(yq - (-q - r)), dz = Math.abs(zq - r);
    if (dx > dy && dx > dz) xq = -yq - zq; else if (dy <= dz) zq = -xq - yq;
    return inside(xq, zq) ? cellAt(xq, zq) : -1;
  }
  function pickScreen(x, y) {
    const k = pickLocal(x - cx0, y - cy0);
    if (k >= 0) return k;
    for (const g of ghosts()) {
      const px = x - cx0 - g.L[0], py = y - cy0 - g.L[1], [a, b, c, d] = g.M;
      const k2 = pickLocal(a * px + b * py, c * px + d * py); // M is its own inverse
      if (k2 >= 0) return k2;
    }
    return -1;
  }

  function layout() {
    const W = s.w, H = s.h, narrow = W < 600;
    R = narrow ? 14 : 22;
    apo = Math.min(H * 0.37, (W * 0.94 / 2) * Math.sqrt(3) / 2);
    rc = apo / (1.5 * (R + 0.5));
    Rb = apo * 2 / SQ3;
    cx0 = W / 2; cy0 = H / 2 + (narrow ? 4 : 6);
    side = 2 * R + 1;
    idxOf = new Int32Array(side * side).fill(-1);
    qs = []; rs = [];
    for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) if (inside(q, r)) { idxOf[(r + R) * side + (q + R)] = qs.length; qs.push(q); rs.push(r); }
    N = qs.length;
    lx = new Float32Array(N); ly = new Float32Array(N); beta = new Float32Array(N); stip = new Float32Array(N * 6); lake = new Uint8Array(N);
    const noise = makeNoise(17), noise2 = makeNoise(29), sc = 22 / R;
    for (let k = 0; k < N; k++) {
      lx[k] = SQ3 * rc * (qs[k] + rs[k] / 2); ly[k] = 1.5 * rc * rs[k];
      const u = (qs[k] + rs[k] / 2) * sc, v = rs[k] * 0.866 * sc;
      const n = 0.65 * noise(u * 0.09 + 3, v * 0.09 + 5) + 0.35 * noise(u * 0.2 + 7, v * 0.2 + 3);
      lake[k] = n > 0.71 && mi_cube(qs[k], rs[k]) < R - 1 ? 1 : 0;
      beta[k] = 0.15 * (0.5 + 0.9 * noise2(u * 0.12, v * 0.12));
      for (let q = 0; q < 6; q++) stip[k * 6 + q] = (rnd() - 0.5) * rc * 1.1;
    }
    mask = new Path2D();
    const h = rc * 1.04;
    for (let k = 0; k < N; k++) mi_hex(mask, lx[k], ly[k], h);
    tw = Math.ceil(2 * Rb + 6); th = Math.ceil(2 * apo + 6);
    if (!tile) { const c = document.createElement('canvas'); tile = { c, x: c.getContext('2d') }; }
    tile.c.width = Math.ceil(tw * s.dpr); tile.c.height = Math.ceil(th * s.dpr);
    rxn = Math.ceil(tw / SP); ryn = Math.ceil(th / SP);
    rcell = new Int32Array(rxn * ryn);
    for (let j = 0; j < ryn; j++) for (let i = 0; i < rxn; i++) rcell[j * rxn + i] = pickLocal(i * SP + SP / 2 - tw / 2, j * SP + SP / 2 - th / 2);
    buildNbr();
    reset(true);
  }
  function seedAt(k) {
    if (k < 0 || st[k] === X) return;
    for (const m of [k, nb[k * 6], nb[k * 6 + 1], nb[k * 6 + 3]]) if (m >= 0 && (st[m] === S || st[m] === REC)) { st[m] = I; if (!isFinite(arr[m])) arr[m] = tick; }
  }
  function seedNear(ang, frac) {
    const a = ang * Math.PI / 180, x = Math.cos(a) * apo * frac, y = Math.sin(a) * apo * frac;
    let best = -1, bd = 1e9;
    for (let k = 0; k < N; k++) { if (st[k] !== S) continue; const d = Math.hypot(lx[k] - x, ly[k] - y); if (d < bd) { bd = d; best = k; } }
    seedAt(best);
  }
  function reset(warm) {
    st = new Uint8Array(N); arr = new Float32Array(N).fill(Infinity);
    for (let k = 0; k < N; k++) if (lake[k]) st[k] = X;
    tick = 0; quiet = 0; contours = []; lastContour = -99;
    const kinds = mi_TOPO[topo];
    // one seed close to a glued edge (pair 1 if glued), one in the interior
    const near = kinds[0] ? -30 : kinds[1] ? 30 : kinds[2] ? 90 : -150;
    seedNear(near, 0.82);
    seedNear(200 + rnd() * 40, 0.3 + rnd() * 0.25);
    if (warm) { for (let i = 0; i < 58; i++) tickOnce(); computeContours(); }
  }
  function tickOnce() {
    tick++;
    const nx = st.slice();
    let active = 0;
    for (let k = 0; k < N; k++) {
      const sk = st[k];
      if (sk === I) {
        active++;
        for (let e = 0; e < 6; e++) { const m = nb[k * 6 + e]; if (m >= 0 && st[m] === S && nx[m] === S && rnd() < beta[m]) { nx[m] = E; arr[m] = tick; } }
        const x = rnd(); if (x < 0.011) nx[k] = D; else if (x < 0.011 + 0.085) nx[k] = REC;
      } else if (sk === E) { active++; if (rnd() < 0.22) nx[k] = I; }
    }
    st = nx;
    quiet = active ? 0 : quiet + 1;
    if (tick - lastContour >= 6) computeContours();
  }
  function computeContours() {
    lastContour = tick;
    const n = rxn * ryn, g = new Float32Array(n), known = new Uint8Array(n), fill = tick + 10, queue = new Int32Array(n);
    let qh = 0, qt = 0;
    for (let q = 0; q < n; q++) { const k = rcell[q]; if (k >= 0 && st[k] !== X) { g[q] = Math.min(arr[k], fill); known[q] = 1; queue[qt++] = q; } }
    while (qh < qt) {
      const q = queue[qh++], i = q % rxn, j = (q / rxn) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const i2 = i + di, j2 = j + dj; if (i2 < 0 || i2 >= rxn || j2 < 0 || j2 >= ryn) continue;
        const q2 = j2 * rxn + i2; if (known[q2]) continue;
        known[q2] = 1; g[q2] = g[q]; queue[qt++] = q2;
      }
    }
    mi_blur(g, rxn, ryn); mi_blur(g, rxn, ryn); mi_blur(g, rxn, ryn);
    contours = [];
    for (let L = 8; L < tick - 1; L += 8) contours.push({ L, segs: mi_march(g, rxn, ryn, L, SP, -tw / 2, -th / 2) });
  }
  function paint(k) {
    if (k < 0) return;
    for (let m = 0; m < N; m++) if (mi_cube(qs[m] - qs[k], rs[m] - rs[k]) <= 2 && (st[m] === S || st[m] === E || st[m] === REC)) st[m] = V;
  }
  const local = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  canvas.addEventListener('pointerdown', e => {
    const [x, y] = local(e), k = pickScreen(x, y);
    if (mode === 'seed') { seedAt(k); quiet = 0; }
    else { painting = true; canvas.setPointerCapture(e.pointerId); paint(k); }
    if (!s.running) s.draw();
  });
  canvas.addEventListener('pointermove', e => { if (!painting) return; const [x, y] = local(e); paint(pickScreen(x, y)); if (!s.running) s.draw(); });
  const stop = () => { painting = false; };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  const bSeed = $('#mi-seed'), bVax = $('#mi-vax');
  const setMode = m => { mode = m; bSeed.setAttribute('aria-pressed', String(m === 'seed')); bVax.setAttribute('aria-pressed', String(m === 'vax')); canvas.style.touchAction = m === 'vax' ? 'none' : ''; };
  bSeed.addEventListener('click', () => setMode('seed'));
  bVax.addEventListener('click', () => setMode('vax'));
  $('#mi-reset').addEventListener('click', () => { reset(true); s.draw(); });
  const topoBtns = [...document.querySelectorAll('[data-mi-topo]')];
  function setTopo(t) {
    topo = t;
    topoBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.miTopo === t)));
    buildNbr(); reset(true); s.draw();
  }
  topoBtns.forEach(b => b.addEventListener('click', () => setTopo(b.dataset.miTopo)));
  const qp = new URLSearchParams(location.search).get('mi');
  if (qp && mi_TOPO[qp]) topo = qp, topoBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.miTopo === qp)));

  function step(dt) {
    acc += dt;
    while (acc >= 1 / 14) { acc -= 1 / 14; tickOnce(); }
    if (quiet > 42) reset(false);
  }

  // The world tile, drawn once per frame and reused for the copies beyond glued edges.
  function renderTile(cnt) {
    const c = tile.x;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, tile.c.width, tile.c.height);
    c.setTransform(s.dpr, 0, 0, s.dpr, s.dpr * tw / 2, s.dpr * th / 2);
    c.save(); c.clip(mask);
    c.fillStyle = tok.canvas; c.fill(mask);
    const batch = (test, fill, rr) => { c.fillStyle = fill; c.beginPath(); for (let k = 0; k < N; k++) if (test(st[k])) mi_hex(c, lx[k], ly[k], rr); c.fill(); };
    batch(v => v === X, tok.panel, rc * 1.04);
    c.fillStyle = rgba(tok.muted, tok.dark ? 0.45 : 0.4); c.beginPath();
    for (let k = 0; k < N; k++) if (st[k] === S) c.rect(lx[k] - 0.65, ly[k] - 0.65, 1.3, 1.3);
    c.fill();
    batch(v => v === E, rgba(tok.accent, tok.dark ? 0.32 : 0.26), rc * 0.98);
    batch(v => v === I, rgba(tok.accent, 0.9), rc * 0.98);
    c.fillStyle = rgba(tok.text, tok.dark ? 0.55 : 0.5); c.beginPath();
    for (let k = 0; k < N; k++) if (st[k] === REC) for (let q = 0; q < 3; q++) c.rect(lx[k] + stip[k * 6 + q * 2] - 0.6, ly[k] + stip[k * 6 + q * 2 + 1] - 0.6, 1.2, 1.2);
    c.fill();
    c.strokeStyle = tok['ink-prussian']; c.lineWidth = 1; c.beginPath();
    for (let k = 0; k < N; k++) if (st[k] === V) {
      const x = lx[k], y = ly[k], a = rc * 0.55;
      c.moveTo(x - a, y + a * 0.35); c.lineTo(x + a * 0.35, y - a); c.moveTo(x - a * 0.35, y + a); c.lineTo(x + a, y - a * 0.35);
    }
    c.stroke();
    c.strokeStyle = rgba(tok.text, 0.85); c.lineWidth = 1.1; c.beginPath();
    for (let k = 0; k < N; k++) if (st[k] === D) { const a = rc * 0.34; c.moveTo(lx[k] - a, ly[k] - a); c.lineTo(lx[k] + a, ly[k] + a); c.moveTo(lx[k] + a, ly[k] - a); c.lineTo(lx[k] - a, ly[k] + a); }
    c.stroke();
    for (const { L, segs } of contours) {
      const major = L % 24 === 0;
      c.strokeStyle = rgba(tok.text, major ? 0.7 : 0.4); c.lineWidth = major ? 1.1 : 0.8;
      c.beginPath();
      for (let q = 0; q < segs.length; q += 4) { c.moveTo(segs[q], segs[q + 1]); c.lineTo(segs[q + 2], segs[q + 3]); }
      c.stroke();
    }
    c.restore();
    for (let k = 0; k < N; k++) if (st[k] !== X) cnt[st[k]]++;
  }
  function chevrons(c, mx, my, tx, ty, n) {
    const gap = 6.5;
    c.save(); c.translate(mx, my); c.transform(tx, ty, -ty, tx, 0, 0);
    c.strokeStyle = tok.text; c.lineWidth = 1.7; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * gap;
      c.beginPath(); c.moveTo(o - 3.5, -5.5); c.lineTo(o + 3, 0); c.lineTo(o - 3.5, 5.5); c.stroke();
    }
    c.restore();
  }
  function draw() {
    const c = s.ctx, W = s.w, H = s.h, narrow = W < 600;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    const cnt = [0, 0, 0, 0, 0, 0];
    renderTile(cnt);
    const gs = ghosts();
    if (gs.length) {
      // copies beyond glued edges, fading with distance from the world so they read as "continues"
      if (!ghostL || ghostL.c.width !== canvas.width || ghostL.c.height !== canvas.height) {
        const gc = document.createElement('canvas'); gc.width = canvas.width; gc.height = canvas.height; ghostL = { c: gc, x: gc.getContext('2d') };
      }
      const g2 = ghostL.x;
      g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, ghostL.c.width, ghostL.c.height);
      for (const g of gs) {
        g2.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        g2.translate(cx0 + g.L[0], cy0 + g.L[1]); g2.transform(g.M[0], g.M[2], g.M[1], g.M[3], 0, 0);
        g2.drawImage(tile.c, -tw / 2, -th / 2, tw, th);
      }
      g2.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      g2.globalCompositeOperation = 'destination-in';
      const peak = tok.dark ? 0.4 : 0.36;
      const grad = g2.createRadialGradient(cx0, cy0, apo * 0.9, cx0, cy0, Rb * 1.85);
      grad.addColorStop(0, `rgba(0,0,0,${peak})`); grad.addColorStop(0.45, `rgba(0,0,0,${peak * 0.55})`); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g2.fillStyle = grad; g2.fillRect(0, 0, W, H);
      g2.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(ghostL.c, 0, 0); c.restore();
    }
    c.drawImage(tile.c, cx0 - tw / 2, cy0 - th / 2, tw, th);

    // the world's edges: chevrons where glued, hachured shore where open
    const kinds = mi_TOPO[topo];
    for (const [ang, pair, sgn] of mi_EDGES) {
      const a0 = (ang - 30) * Math.PI / 180, a1 = (ang + 30) * Math.PI / 180, an = ang * Math.PI / 180;
      const x0 = cx0 + Rb * Math.cos(a0), y0 = cy0 + Rb * Math.sin(a0), x1 = cx0 + Rb * Math.cos(a1), y1 = cy0 + Rb * Math.sin(a1);
      const nx = Math.cos(an), ny = Math.sin(an);
      if (kinds[pair]) {
        c.strokeStyle = rgba(tok.text, 0.45); c.lineWidth = 1;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        // tangent of the + edge of this pair; the partner agrees for a straight gluing, disagrees otherwise
        const pa = mi_EDGES.find(e => e[1] === pair && e[2] === 1)[0] * Math.PI / 180;
        let tx = -Math.sin(pa), ty = Math.cos(pa);
        if (sgn < 0 && kinds[pair] !== 'translate') { tx = -tx; ty = -ty; }
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        c.fillStyle = tok.canvas; c.beginPath(); c.arc(mx, my, 8 + pair * 3.6, 0, TAU); c.fill();
        chevrons(c, mx, my, tx, ty, pair + 1);
      } else {
        c.strokeStyle = rgba(tok.text, 0.85); c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = rgba(tok.text, 0.45); c.lineWidth = 1; c.beginPath();
        const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 7);
        for (let i = 1; i < n; i++) { const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t; c.moveTo(px + nx * 1.5, py + ny * 1.5); c.lineTo(px + nx * 6, py + ny * 6); }
        c.stroke();
      }
    }

    // isochrone labels, upright, inside the world only
    const placed = [];
    c.font = `italic 13px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (const { L, segs } of contours) {
      if (L % 24) continue;
      let bx = -1e9, by = 0;
      for (let q = 0; q < segs.length; q += 4) {
        const x = segs[q], y = segs[q + 1];
        if (x > bx && mi_cube(...mi_axial(x, y, rc)) < R - 3) { bx = x; by = y; }
      }
      if (bx < -1e8) continue;
      const t = `day ${L}`, w = c.measureText(t).width, x = cx0 + bx, y = cy0 + by;
      if (placed.some(p => x + 3 < p[2] + 4 && x + w + 9 > p[0] - 4 && Math.abs(y - p[1]) < 18)) continue;
      placed.push([x + 3, y, x + w + 9]);
      c.fillStyle = tok.canvas; c.fillRect(x + 3, y - 8, w + 6, 16);
      c.fillStyle = tok.text; c.fillText(t, x + 6, y);
    }

    // plate title
    c.font = `italic 14px ${FONT}`; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    const title = narrow ? 'Plate II' : `Plate II. The outbreak on a ${mi_NAMES[topo]}, by day of first exposure`;
    const ttw = c.measureText(title).width;
    c.fillStyle = tok.canvas; c.fillRect(W - 20 - ttw, 10, ttw + 12, 24);
    c.fillStyle = tok.muted; c.fillText(title, W - 14, 27);

    // reference cartouche
    if (W >= 640) {
      const rows = [['Infectious', 'I'], ['Exposed', 'E'], ['Recovered', 'R'], ['Vaccinated', 'V'], ['Deaths', 'D'], ['Arrival, every 8 days', 'L'], ['Glued edge', 'G'], ['Shore', 'S']];
      const lx0 = 14, rowH = 20, lw = 182, lh = rowH * rows.length + 38, ly0 = H - lh - 14;
      c.fillStyle = rgba(tok.canvas, 0.95); c.fillRect(lx0, ly0, lw, lh);
      c.strokeStyle = rgba(tok.text, 0.5); c.lineWidth = 1; c.strokeRect(lx0 + 0.5, ly0 + 0.5, lw - 1, lh - 1);
      c.strokeStyle = rgba(tok.text, 0.2); c.strokeRect(lx0 + 3.5, ly0 + 3.5, lw - 7, lh - 7);
      c.font = `italic 14px ${FONT}`; c.fillStyle = tok.text; c.textAlign = 'center'; c.fillText('Reference', lx0 + lw / 2, ly0 + 22);
      c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = `13.5px ${FONT}`;
      rows.forEach(([name, kind], i) => {
        const yy = ly0 + 40 + i * rowH, sx = lx0 + 22;
        c.beginPath();
        if (kind === 'I' || kind === 'E') { mi_hex(c, sx, yy, 6.5); c.fillStyle = rgba(tok.accent, kind === 'I' ? 0.9 : 0.28); c.fill(); }
        else if (kind === 'R') { c.fillStyle = rgba(tok.text, 0.6); for (const [a, b] of [[-3, -2], [2, -3], [0, 2], [-4, 3], [4, 2]]) c.fillRect(sx + a - 0.6, yy + b - 0.6, 1.2, 1.2); }
        else if (kind === 'V') { c.strokeStyle = tok['ink-prussian']; c.lineWidth = 1; for (const o of [-3, 0, 3]) { c.moveTo(sx - 5 + o, yy + 5); c.lineTo(sx + 5 + o, yy - 5); } c.stroke(); }
        else if (kind === 'D') { c.strokeStyle = rgba(tok.text, 0.85); c.lineWidth = 1.1; c.moveTo(sx - 3.5, yy - 3.5); c.lineTo(sx + 3.5, yy + 3.5); c.moveTo(sx + 3.5, yy - 3.5); c.lineTo(sx - 3.5, yy + 3.5); c.stroke(); }
        else if (kind === 'L') { c.strokeStyle = rgba(tok.text, 0.6); c.lineWidth = 1; c.moveTo(sx - 8, yy + 2); c.bezierCurveTo(sx - 3, yy - 5, sx + 2, yy + 6, sx + 8, yy - 2); c.stroke(); }
        else if (kind === 'G') { c.strokeStyle = rgba(tok.text, 0.45); c.lineWidth = 1; c.moveTo(sx - 9, yy); c.lineTo(sx + 9, yy); c.stroke(); c.fillStyle = tok.canvas; c.fillRect(sx - 5, yy - 5, 10, 10); chevrons(c, sx, yy, 1, 0, 2); }
        else { c.strokeStyle = rgba(tok.text, 0.85); c.lineWidth = 1.6; c.moveTo(sx - 9, yy - 2); c.lineTo(sx + 9, yy - 2); c.stroke(); c.beginPath(); c.strokeStyle = rgba(tok.text, 0.45); c.lineWidth = 1; for (const o of [-6, -1, 4]) { c.moveTo(sx + o, yy); c.lineTo(sx + o, yy + 4.5); } c.stroke(); }
        c.fillStyle = tok.text2; c.fillText(name, sx + 16, yy + 1);
      });
      c.textBaseline = 'alphabetic';
    }
    // scale bar
    const cell = rc * SQ3, segW = cell * 5, segs = narrow ? 2 : 4, bx = W - 14 - segW * segs, by = H - (narrow ? 12 : 22);
    c.fillStyle = tok.canvas; c.fillRect(bx - 8, by - 24, segW * segs + 16, 36);
    for (let i = 0; i < segs; i++) { c.fillStyle = i % 2 ? tok.canvas : tok.text; c.fillRect(bx + i * segW, by, segW, 4); }
    c.strokeStyle = tok.text; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, segW * segs - 1, 4);
    c.font = `12.5px ${FONT}`; c.fillStyle = tok.text2; c.textAlign = 'center';
    c.fillText('0', bx, by - 6);
    if (narrow) { c.textAlign = 'right'; c.fillText('10 cells', bx + segW * 2 + 4, by - 6); }
    else { c.fillText('10', bx + segW * 2, by - 6); c.textAlign = 'right'; c.fillText('20 cells', bx + segW * 4 + 4, by - 6); }

    cap(`Day ${tick}. ${fmt(cnt[I])} infectious, ${fmt(cnt[E])} exposed, ${fmt(cnt[REC])} recovered, ${fmt(cnt[D])} deaths, ${fmt(cnt[V])} vaccinated. ${mi_CAPS[topo]} Click to seed, including on the faded copies, or choose Vaccinate and drag.`);
  }
  wirePause(s, $('#mi-pp'));
}

function mi_hex(c, x, y, rr) {
  const h = rr * 0.8660254;
  c.moveTo(x, y - rr); c.lineTo(x + h, y - rr / 2); c.lineTo(x + h, y + rr / 2); c.lineTo(x, y + rr); c.lineTo(x - h, y + rr / 2); c.lineTo(x - h, y - rr / 2); c.closePath();
}
function mi_axial(x, y, rc) {
  const q = (Math.sqrt(3) / 3 * x - y / 3) / rc, r = (2 / 3 * y) / rc;
  return [Math.round(q), Math.round(r)];
}
function mi_blur(g, rx, ry) {
  const t = new Float32Array(g.length);
  for (let j = 0; j < ry; j++) for (let i = 0; i < rx; i++) { let s2 = 0, c2 = 0; for (let d = -2; d <= 2; d++) { const i2 = i + d; if (i2 >= 0 && i2 < rx) { s2 += g[j * rx + i2]; c2++; } } t[j * rx + i] = s2 / c2; }
  for (let j = 0; j < ry; j++) for (let i = 0; i < rx; i++) { let s2 = 0, c2 = 0; for (let d = -2; d <= 2; d++) { const j2 = j + d; if (j2 >= 0 && j2 < ry) { s2 += t[j2 * rx + i]; c2++; } } g[j * rx + i] = s2 / c2; }
}
function mi_march(g, rx, ry, L, sp, ox, oy) {
  const out = [], o = sp / 2;
  const P = (i, j) => [ox + i * sp + o, oy + j * sp + o];
  for (let j = 0; j < ry - 1; j++) for (let i = 0; i < rx - 1; i++) {
    const a = g[j * rx + i], b = g[j * rx + i + 1], c2 = g[(j + 1) * rx + i + 1], d = g[(j + 1) * rx + i];
    const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c2 > L ? 2 : 0) | (d > L ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const f = (v1, v2) => (L - v1) / (v2 - v1);
    const top = () => P(i + f(a, b), j), right = () => P(i + 1, j + f(b, c2)), bot = () => P(i + f(d, c2), j + 1), left = () => P(i, j + f(a, d));
    const seg = (p, q) => out.push(p[0], p[1], q[0], q[1]);
    switch (idx) {
      case 1: case 14: seg(left(), bot()); break;
      case 2: case 13: seg(bot(), right()); break;
      case 3: case 12: seg(left(), right()); break;
      case 4: case 11: seg(top(), right()); break;
      case 5: seg(left(), top()); seg(bot(), right()); break;
      case 6: case 9: seg(top(), bot()); break;
      case 7: case 8: seg(left(), top()); break;
      case 10: seg(top(), right()); seg(left(), bot()); break;
    }
  }
  return out;
}
INITS.push(mi_Atlas);
