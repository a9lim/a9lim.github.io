/* ---------- Fig. 3: Lumen, the cross-section and the map ---------- */
function lu_Lumen() {
  const canvas = $('#cv-lumen');
  const cap = captioner($('#cap-lumen'));
  const MAXP = 90;
  // A toy flux model per condition. Signs give direction; the key renames reversed lines.
  const CONDS = {
    light: { name: 'Light', pump: 1, photons: true, o2: 'out', pools: [0.72, 0.3, 0.82, 0.25],
      f: { glyc: 0.12, ppp: 0.08, calvin: 1, krebs: 0.1, kin: 0.1, pdh: 0.1, ferm: 0, acet: 0, box: 0, spur: 0 },
      say: 'Light drives the Calvin cycle; carbon enters at RuBisCO and leaves as sugar phosphate' },
    aerobic: { name: 'Dark, aerobic', pump: 0.8, o2: 'in', pools: [0.78, 0.42, 0.45, 0.45],
      f: { glyc: 0.85, ppp: 0.35, calvin: 0, krebs: 0.9, kin: 0.9, pdh: 0.85, ferm: 0, acet: 0, box: 0.12, spur: 0.12 },
      say: 'Carbon runs down glycolysis, through PDH and around the Krebs cycle; the Calvin cycle is idle' },
    anaerobic: { name: 'Anaerobic', pump: 0.05, pools: [0.32, 0.62, 0.35, 0.2],
      f: { glyc: 1, ppp: 0.2, calvin: 0, krebs: 0.04, kin: 0.04, pdh: 0.05, ferm: 1, acet: 0.08, box: 0, spur: 0 },
      say: 'Without oxygen, pyruvate goes to ethanol to recycle NADH, and the Krebs cycle stalls' },
    fasting: { name: 'Fasting', pump: 0.75, o2: 'in', pools: [0.62, 0.55, 0.28, 0.72],
      f: { glyc: -0.55, ppp: 0.12, calvin: 0, krebs: 0.85, kin: 0.85, pdh: 0, ferm: 0, acet: 0, box: 1, spur: 1 },
      say: 'β-oxidation feeds acetyl-CoA to the Krebs cycle while glycolysis runs backward as gluconeogenesis' },
  };
  const LINES = [
    { id: 'glyc', ink: 'sienna', name: 'Glycolysis', rev: 'Gluconeogenesis' },
    { id: 'ppp', ink: 'madder', name: 'Pentose phosphate' },
    { id: 'calvin', ink: 'viridian', name: 'Calvin cycle' },
    { id: 'pdh', ink: 'indigo', name: 'Pyruvate dehydrogenase' },
    { id: 'krebs', ink: 'prussian', name: 'Krebs cycle' },
    { id: 'ferm', ink: 'umber', name: 'Fermentation' },
    { id: 'box', ink: 'ochre', name: 'β-oxidation', rev: 'Fatty-acid synthesis' },
  ];
  const INK = Object.fromEntries(LINES.map(l => [l.id, l.ink]));
  // Grid coordinates for the map (x right, y down), laid out by hand on an octilinear grid.
  const KC = [16.46, 7.54], KR = 2.6;
  const kp = a => [KC[0] + KR * Math.cos(a * Math.PI / 180), KC[1] + KR * Math.sin(a * Math.PI / 180)];
  const ST = {
    glucose: [1, 3, 'Glucose', 'b'], g6p: [3, 3, 'G6P', 'b', 'hub'], f6p: [5, 3, 'F6P', 'b', 'corr'],
    f16bp: [7, 3, 'F1,6BP', 'b', 'corr'], g3p: [9, 3, 'G3P', 'b', 'corr'], bpg: [11, 3, '1,3-BPG', 'b', 'corr'],
    pga3: [13, 3, '3-PGA', 'b', 'corr'], pga2: [15, 3, '2-PGA', 'b'], pep: [17, 3, 'PEP', 'b'], pyr: [19, 3, 'Pyruvate', 't', 'hub'],
    pgl6: [3, 1.5, '6-PGL', 'l'], pga6: [4.5, 0, '6-PGA', 't'], r5p: [7, 1, 'R5P', 'tr', 'hub'], rubp: [13, 1, 'RuBP', 't'],
    acald: [21, 3, 'Acetaldehyde', 't', 'hub'], etoh: [23, 3, 'Ethanol', 't'], acet: [20, 4, 'Acetic acid', 'r'],
    acoa: [19, 5, 'Acetyl-CoA', 'l', 'hub'],
    fa: [21, 7, 'Fatty acid', 'l', 'hub'], enoyl: [23, 7, 'Enoyl-CoA', 't'], ohcoa: [23, 9, 'OH-CoA', 'r'], keto: [21, 9, 'Keto-CoA', 'b'],
    cit: [...kp(-45), 'Citrate', 'in', 'hub'], icit: [...kp(0), 'Isocitrate', 'in'], akg: [...kp(45), 'α-KG', 'in'],
    scoa: [...kp(90), 'Suc-CoA', 'in'], succ: [...kp(135), 'Succinate', 'in'], fum: [...kp(180), 'Fumarate', 'in'],
    mal: [...kp(225), 'Malate', 'in'], oaa: [...kp(270), 'OAA', 'in'],
  };
  const PATHS = {
    glyc: { line: 'glyc', pts: ['glucose', 'g6p', 'f6p', 'f16bp', 'g3p', 'bpg', 'pga3', 'pga2', 'pep', 'pyr'], off: 1 },
    ppp: { line: 'ppp', pts: ['g6p', [3, 0], [6, 0], 'r5p', 'f6p'], off: 1 },
    calvin: { line: 'calvin', pts: ['r5p', 'rubp', 'pga3', 'f6p'], closed: true, off: 1 },
    pdh: { line: 'pdh', pts: ['pyr', 'acoa'] },
    ferm: { line: 'ferm', pts: ['pyr', 'acald', 'etoh'] },
    acet: { line: 'ferm', pts: ['acald', 'acoa'] },
    kin: { line: 'krebs', pts: ['acoa', 'cit'] },
    krebs: { line: 'krebs', circle: true },
    box: { line: 'box', pts: ['fa', 'enoyl', 'ohcoa', 'keto'], closed: true },
    spur: { line: 'box', pts: ['fa', 'acoa'] },
  };
  const STPATH = { glucose: 'glyc', pga2: 'glyc', pep: 'glyc', pgl6: 'ppp', pga6: 'ppp', rubp: 'calvin', etoh: 'ferm', acet: 'acet',
    enoyl: 'box', ohcoa: 'box', keto: 'box', icit: 'krebs', akg: 'krebs', scoa: 'krebs', succ: 'krebs', fum: 'krebs', mal: 'krebs', oaa: 'krebs' };
  const GB = { x0: 0, x1: 24.6, y0: -0.75, y1: 10.4 };
  // On phones the map turns upright; a few labels change side or shorten to fit.
  const NLABEL = { icit: 'Isocit.', succ: 'Succ.', fum: 'Fum.', mal: 'Mal.', acald: 'Acetaldeh.', acet: 'Acetate', enoyl: 'Enoyl', ohcoa: 'OH-acyl', keto: 'Keto' };
  const NSIDE = { acoa: 'tl', acet: 'br', fa: 'bl', keto: 'b', pga6: 'b' };

  let cond = 'light', C = CONDS.light;
  const flux = Object.fromEntries(Object.keys(PATHS).map(k => [k, C.f[k]]));
  const phase = Object.fromEntries(Object.keys(PATHS).map(k => [k, 0]));
  const st = { e: 1, g: 0.75, pools: C.pools.slice(), phase: 0, made: 0, omega: 0 };
  let protons = [], photons = [], mols = [], time = 0, pumpAcc = 0, exitAcc = 0, photonAcc = 0, o2Acc = 0, nextAtp = TAU / 3;
  let G = {}, geo = {};
  const rnd = mulberry32(11);
  const s = makeSketch(canvas, { layout, step, draw });

  const btns = ['light', 'aerobic', 'anaerobic', 'fasting'].map(k => [k, $('#lu-c-' + k)]);
  for (const [k, b] of btns) b.addEventListener('click', () => {
    cond = k; C = CONDS[k];
    for (const [k2, b2] of btns) b2.setAttribute('aria-pressed', String(k2 === k));
    if (!s.running) { for (const p in flux) flux[p] = C.f[p]; st.e = C.pump; s.draw(); }
  });

  /* ---- geometry ---- */
  function layout() {
    const W = s.w, H = s.h, narrow = W < 640;
    const u = narrow ? clamp(W / 700, 0.42, 1) : clamp(W / 1100, 0.42, 1.25);
    const memTop = narrow ? 92 : Math.max(118, H * 0.185), memH = 40 * u;
    G = { W, H, u, narrow, rot: narrow, memTop, memH, memBot: memTop + memH, memMid: memTop + memH / 2 };
    const fx = narrow
      ? { lhc: 0.05, psii: 0.15, ndh: 0.29, b6f: 0.43, cytox: 0.56, psi: 0.69, fnr: 0.79, atp: 0.9 }
      : { lhc: 0.045, psii: 0.12, ndh: 0.235, b6f: 0.37, cytox: 0.505, psi: 0.62, fnr: 0.705, atp: 0.855 };
    for (const k in fx) G[k] = W * fx[k];
    const mapTop = G.memBot + (narrow ? 80 : 86) * u, pad = narrow ? 12 : 14;
    const aw = W - 2 * pad, ah = H - mapTop - pad;
    const gw = GB.x1 - GB.x0, gh = GB.y1 - GB.y0;
    if (!narrow) {
      G.U = Math.min(aw / gw, ah / gh);
      G.ox = pad + (aw - G.U * gw) / 2; G.oy = mapTop;
    } else {
      G.U = Math.min(aw / gh, ah / gw);
      G.ox = pad + (aw - G.U * gh) / 2; G.oy = mapTop;
    }
    G.us = clamp(G.U / 46, 0.5, 1.2);
    G.gap = clamp(G.U * 0.16, 4, 8);
    buildGeo();
    protons = [];
    for (let i = 0; i < Math.round(st.g * MAXP); i++) protons.push(newProton(rnd() * W, 8 + rnd() * (memTop - 16)));
    photons = []; mols = [];
    for (let i = 0; i < 200; i++) step(1 / 60);
  }
  const T = (x, y) => G.rot ? [G.ox + (y - GB.y0) * G.U, G.oy + (x - GB.x0) * G.U] : [G.ox + (x - GB.x0) * G.U, G.oy + (y - GB.y0) * G.U];
  const Tdir = (dx, dy) => G.rot ? [dy, dx] : [dx, dy];
  const gpt = p => typeof p === 'string' ? ST[p] : p;
  function offsetPts(pts, d, closed) {
    const n = pts.length, out = [];
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
    for (let i = 0; i < n; i++) {
      const prev = closed ? pts[(i - 1 + n) % n] : pts[i - 1], next = closed ? pts[(i + 1) % n] : pts[i + 1];
      if (prev && next) {
        const n1 = nrm(prev, pts[i]), n2 = nrm(pts[i], next);
        let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
        const k = d / Math.max(0.5, mx * n1[0] + my * n1[1]);
        out.push([pts[i][0] + mx * k, pts[i][1] + my * k]);
      } else { const q = prev ? nrm(prev, pts[i]) : nrm(pts[i], next); out.push([pts[i][0] + q[0] * d, pts[i][1] + q[1] * d]); }
    }
    return out;
  }
  function rounded(pts, r, closed) {
    const n = pts.length, out = [], get = i => pts[(i + n) % n];
    const corner = i => {
      const A = get(i - 1), B = get(i), C2 = get(i + 1);
      const l1 = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, l2 = Math.hypot(C2[0] - B[0], C2[1] - B[1]) || 1, rr = Math.min(r, l1 / 2, l2 / 2);
      return [[B[0] + (A[0] - B[0]) * rr / l1, B[1] + (A[1] - B[1]) * rr / l1], B, [B[0] + (C2[0] - B[0]) * rr / l2, B[1] + (C2[1] - B[1]) * rr / l2]];
    };
    const line = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(L / 3)); for (let j = 1; j <= k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); };
    const quad = (p1, B, p2) => { for (let j = 1; j <= 10; j++) { const t = j / 10, v = 1 - t; out.push([v * v * p1[0] + 2 * v * t * B[0] + t * t * p2[0], v * v * p1[1] + 2 * v * t * B[1] + t * t * p2[1]]); } };
    if (!closed) {
      out.push(pts[0]); let cur = pts[0];
      for (let i = 1; i < n - 1; i++) { const [p1, B, p2] = corner(i); line(cur, p1); quad(p1, B, p2); cur = p2; }
      line(cur, pts[n - 1]);
    } else {
      const c0 = corner(0); out.push(c0[2]); let cur = c0[2];
      for (let i = 1; i <= n; i++) { const [p1, B, p2] = corner(i % n); line(cur, p1); quad(p1, B, p2); cur = p2; }
    }
    return out;
  }
  function withLengths(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, L, len: L[L.length - 1] }; }
  function at(path, sv) {
    const { pts, L, len } = path; sv = clamp(sv, 0, len);
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= sv) lo = m; else hi = m; }
    const a = pts[lo], b = pts[hi], t = (sv - L[lo]) / ((L[hi] - L[lo]) || 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  function buildGeo() {
    geo = { paths: {}, st: {} };
    for (const [k, p] of Object.entries(PATHS)) {
      let pts;
      if (p.circle) {
        pts = [];
        for (let a = -45; a <= 315.01; a += 2) pts.push(T(...kp(a)));
        geo.paths[k] = withLengths(pts); geo.paths[k].closed = true; continue;
      }
      pts = p.pts.map(q => T(...gpt(q)));
      if (p.off) pts = offsetPts(pts, G.gap / 2, p.closed);
      const sm = rounded(pts, G.U * 0.42, p.closed);
      if (p.closed) sm.push(sm[0]);
      geo.paths[k] = withLengths(sm); geo.paths[k].closed = !!p.closed;
    }
    for (const [id, v] of Object.entries(ST)) {
      const [x, y, label, side, kind] = v;
      const pos = T(x, y);
      const rec = { id, label: (G.narrow && NLABEL[id]) || label, side: (G.narrow && NSIDE[id]) || side, kind: kind || 'tick', pos };
      const pk = STPATH[id];
      if (pk) {
        const path = geo.paths[pk]; let best = 0, bd = 1e9;
        path.pts.forEach((q, i) => { const d = Math.hypot(q[0] - pos[0], q[1] - pos[1]); if (d < bd) { bd = d; best = i; } });
        const a = path.pts[Math.max(0, best - 1)], b = path.pts[Math.min(path.pts.length - 1, best + 1)];
        rec.anchor = path.pts[best]; rec.ang = Math.atan2(b[1] - a[1], b[0] - a[0]); rec.path = pk;
      } else rec.anchor = pos;
      geo.st[id] = rec;
    }
    const corrDir = Tdir(1, 0);
    geo.corrAng = Math.atan2(corrDir[1], corrDir[0]);
    const r1 = [T(1, 5.15), T(6.7, 10.35)], r2 = G.narrow ? [T(1, 5.9), T(8.6, 10.6)] : [T(7.2, 5.15), T(13, 10.35)];
    const box = ([a, b]) => ({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) });
    geo.key = box(r1); geo.pools = box(r2);
  }

  /* ---- the toy model ---- */
  function newProton(x, y) { return { x, y, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 30, mode: 'lumen', a: 1 }; }
  const wob = x => 2 * G.u * Math.sin(x / (70 * G.u) + time * 0.5);
  function step(dt) {
    time += dt;
    const { u, W, memTop, memBot } = G;
    const k = Math.min(1, dt * 1.4);
    for (const p in flux) flux[p] += (C.f[p] - flux[p]) * k;
    for (let i = 0; i < 4; i++) st.pools[i] += (C.pools[i] + 0.02 * Math.sin(time * 0.7 + i * 1.9) - st.pools[i]) * Math.min(1, dt * 0.6);
    st.e += (C.pump - st.e) * Math.min(1, dt * 1.5);
    const pump = 0.25 * st.e;
    st.omega = 3.2 * st.g * (1 - 0.45 * st.pools[0]);
    st.g = clamp(st.g + (pump - st.omega * 12 / MAXP - 0.03 * st.g) * dt, 0, 1);
    st.phase += st.omega * TAU * dt;
    while (st.phase >= nextAtp) {
      nextAtp += TAU / 3; st.made++;
      mols.push({ type: 'atp', x: G.atp + (rnd() - 0.5) * 24 * u, y: memBot + 66 * u, vx: (rnd() - 0.3) * 60 * u, vy: (10 + rnd() * 14) * u, rot: rnd() * TAU, age: 0, life: 1.8 });
    }
    // trains
    const sp = 55 * G.us;
    for (const p in phase) phase[p] += flux[p] * sp * dt;
    // protons in, out through the synthase, and the drawn count kept honest to the gradient
    pumpAcc += pump * MAXP * dt;
    const src = cond === 'light' ? [[G.psii, 0.4], [G.b6f, 1]] : [[G.ndh, 0.45], [G.b6f, 0.8], [G.cytox, 1]];
    while (pumpAcc >= 1) {
      pumpAcc -= 1;
      const r = rnd(), x0 = src.find(q => r <= q[1])[0] + (rnd() - 0.5) * 240 * u;
      const p = newProton(clamp(x0, 6, W - 6), memTop - 4 * u); p.vy = -(120 + rnd() * 260) * u; p.vx = (rnd() - 0.5) * 900 * u; protons.push(p);
    }
    exitAcc += st.omega * 12 * dt;
    while (exitAcc >= 1) {
      exitAcc -= 1;
      let best = -1, bd = 1e9;
      for (let i = 0; i < protons.length; i++) { const p = protons[i]; if (p.mode !== 'lumen') continue; const d = Math.abs(p.x - G.atp) + Math.abs(p.y - memTop) * 0.5; if (d < bd) { bd = d; best = i; } }
      if (best >= 0) { protons[best].mode = 'exit'; protons[best].tx = G.atp + (rnd() - 0.5) * 14 * u; }
    }
    for (const p of protons) {
      if (p.mode === 'lumen') {
        p.vx += (rnd() - 0.5) * 2200 * u * dt; p.vy += (rnd() - 0.5) * 1600 * u * dt; p.vx *= 0.96; p.vy *= 0.95;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 5) { p.x = 5; p.vx = Math.abs(p.vx); }
        if (p.x > W - 5) { p.x = W - 5; p.vx = -Math.abs(p.vx); }
        if (p.y < 6) { p.y = 6; p.vy = Math.abs(p.vy); }
        const floor = memTop - 5 * u + wob(p.x);
        if (p.y > floor) { p.y = floor; p.vy = -Math.abs(p.vy); }
      } else if (p.mode === 'exit') {
        if (p.y < memTop - 2 * u) { p.x += (p.tx - p.x) * Math.min(1, dt * 4); p.y += Math.max(40 * u, Math.abs(memTop - p.y) * 3) * dt; }
        else { p.x = p.tx; p.y += 70 * u * dt; if (p.y > memBot + 16 * u) p.a -= dt * 2.5; }
      } else { p.y += 60 * u * dt; if (p.y > memBot + 6 * u) p.a -= dt * 3; }
    }
    protons = protons.filter(p => p.a > 0);
    const target = Math.round(st.g * MAXP), inL = protons.filter(p => p.mode === 'lumen');
    if (inL.length > target + 5) inL[Math.floor(rnd() * inL.length)].mode = 'leak';
    else if (inL.length < target - 5) protons.push(newProton(rnd() * W, 8 + rnd() * (memTop - 18)));
    // photons
    photonAcc += (C.photons ? 6 : 0) * dt;
    while (photonAcc >= 1) {
      photonAcc -= 1;
      const r = rnd(), tx = r < 0.45 ? G.psii : r < 0.62 ? G.lhc : G.psi;
      const ty = memTop + 3 * u, sx = tx - (90 + rnd() * 70) * u, sy = -12;
      const d = Math.hypot(tx - sx, ty - sy);
      photons.push({ x: sx, y: sy, dx: (tx - sx) / d, dy: (ty - sy) / d, left: d, ph: rnd() * TAU });
    }
    for (const p of photons) { const m = 320 * u * dt; p.x += p.dx * m; p.y += p.dy * m; p.left -= m; p.ph += dt * 30; }
    photons = photons.filter(p => p.left > 0);
    // oxygen: out of PSII in the light, into cytochrome oxidase in the dark
    o2Acc += (C.o2 ? st.e * 0.8 : 0) * dt;
    while (o2Acc >= 1) {
      o2Acc -= 1;
      if (C.o2 === 'out') mols.push({ type: 'o2', x: G.psii + (rnd() - 0.3) * 20 * u, y: memTop - 14 * u, vx: (rnd() - 0.5) * 12 * u, vy: -(16 + rnd() * 10) * u, rot: rnd() * TAU, age: 0, life: 3.2 });
      else mols.push({ type: 'o2', x: G.cytox + (rnd() - 0.5) * 50 * u, y: memBot + 46 * u, tx: G.cytox, vx: 0, vy: -(20 + rnd() * 6) * u, rot: rnd() * TAU, age: 0, life: 1.9, sink: true });
    }
    for (const m of mols) {
      m.age += dt;
      if (m.sink) m.x += (m.tx - m.x) * Math.min(1, dt * 1.2);
      m.x += m.vx * dt; m.y += m.vy * dt; m.rot += dt * 0.4;
    }
    mols = mols.filter(m => m.age < m.life);
  }

  /* ---- drawing: the membrane, in Goodsell's register ---- */
  const ink = n => tok['ink-' + n];
  function shades(base) {
    const fill = mix(base, tok.canvas, tok.dark ? 0.12 : 0.28);
    return tok.dark
      ? { fill, line: mix(base, '#000000', 0.55), hi: mix(fill, '#ffffff', 0.16) }
      : { fill, line: mix(base, '#1a1410', 0.42), hi: mix(fill, '#ffffff', 0.45) };
  }
  function smoothClosed(c, pts) {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m = mid(p, q); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    c.closePath();
  }
  function blob(c, cx, cy, rx, ry, seed, base) {
    const pts = [], n = 28;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, r = 1 + 0.07 * Math.sin(2 * a + seed * 1.7) + 0.05 * Math.sin(3 * a + seed * 2.3) + 0.035 * Math.sin(5 * a + seed * 3.1);
      pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]);
    }
    const sh = shades(base);
    c.beginPath(); smoothClosed(c, pts); c.fillStyle = sh.fill; c.fill();
    c.lineWidth = Math.max(0.8, 1.1 * G.u); c.strokeStyle = sh.line; c.stroke();
    c.save(); c.globalAlpha *= 0.55;
    c.beginPath(); smoothClosed(c, pts.map(([x, y]) => [cx - rx * 0.12 + (x - cx) * 0.6, cy - ry * 0.16 + (y - cy) * 0.56])); c.fillStyle = sh.hi; c.fill();
    c.restore();
  }
  function smallLabel(c, text, x, y, align) {
    c.font = `italic ${Math.max(10.5, 12.5 * G.u)}px ${FONT}`; c.textAlign = align || 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = tok.muted; c.fillText(text, x, y);
  }
  function drawMembrane(c) {
    const { W, u, memTop, memBot, memMid, narrow } = G;
    c.fillStyle = rgba(tok.accent, 0.01 + 0.035 * st.g); c.fillRect(0, 0, W, memTop + 3 * u);
    // lipids
    const sp = 7 * u, rH = 3.2 * u, lipid = ink('ochre');
    c.strokeStyle = mix(tok.canvas, lipid, 0.5); c.lineWidth = Math.max(0.7, 0.9 * u);
    c.beginPath();
    for (let x = sp / 2; x < W; x += sp) {
      const w = wob(x), yt = memTop + 4 * u + w, yb = memBot - 4 * u + w, ym = (yt + yb) / 2;
      for (const dx of [-1.2 * u, 1.2 * u]) {
        c.moveTo(x + dx, yt + rH); c.quadraticCurveTo(x + dx + 1.5 * u * Math.sin(x * 0.3 + dx), (yt + ym) / 2, x + dx, ym - u);
        c.moveTo(x + dx, yb - rH); c.quadraticCurveTo(x + dx - 1.5 * u * Math.sin(x * 0.2 + dx), (yb + ym) / 2, x + dx, ym + u);
      }
    }
    c.stroke();
    c.beginPath();
    for (let x = sp / 2; x < W; x += sp) {
      const w = wob(x), yt = memTop + 4 * u + w, yb = memBot - 4 * u + w;
      c.moveTo(x + rH, yt); c.arc(x, yt, rH, 0, TAU); c.moveTo(x + rH, yb); c.arc(x, yb, rH, 0, TAU);
    }
    c.fillStyle = mix(lipid, tok.canvas, tok.dark ? 0.1 : 0.35); c.fill();
    c.lineWidth = 0.6 * u; c.strokeStyle = mix(lipid, tok.dark ? '#000000' : '#4a3a1a', 0.35); c.stroke();
    // complexes
    const my = x => memMid + wob(x);
    blob(c, G.lhc, my(G.lhc), 12 * u, 24 * u, 1.3, ink('sap'));
    blob(c, G.psii - 17 * u, my(G.psii), 23 * u, 33 * u, 3.3, ink('sap'));
    blob(c, G.psii + 17 * u, my(G.psii), 23 * u, 33 * u, 4.1, ink('sap'));
    blob(c, G.psii, memTop - 8 * u + wob(G.psii), 15 * u, 8 * u, 5.2, ink('violet'));
    blob(c, G.ndh + 12 * u, memBot + 18 * u + wob(G.ndh), 12 * u, 17 * u, 6.1, ink('indigo'));
    blob(c, G.ndh - 4 * u, my(G.ndh), 24 * u, 28 * u, 5.7, ink('indigo'));
    blob(c, G.b6f - 12 * u, my(G.b6f), 16 * u, 32 * u, 6.7, ink('prussian'));
    blob(c, G.b6f + 12 * u, my(G.b6f), 16 * u, 32 * u, 7.3, ink('prussian'));
    blob(c, G.b6f, memTop - 7 * u + wob(G.b6f), 11 * u, 7 * u, 8.1, mix(ink('prussian'), tok.canvas, 0.3));
    blob(c, G.cytox, my(G.cytox), 19 * u, 31 * u, 8.8, ink('verdigris'));
    blob(c, G.psi, my(G.psi), 33 * u, 32 * u, 9.4, ink('viridian'));
    blob(c, G.psi + 6 * u, memBot + 7 * u + wob(G.psi), 15 * u, 8 * u, 10.2, ink('viridian'));
    blob(c, G.fnr, memBot + 14 * u + wob(G.fnr), 11 * u, 9 * u, 11.6, ink('umber'));
    // ATP synthase: the c-ring and stalk turn; the head and stator hold still
    const ax = G.atp, aw = wob(ax), plum = ink('mulberry'), pl = shades(plum);
    blob(c, ax + 32 * u, my(ax), 9 * u, 23 * u, 12.4, plum);
    c.fillStyle = pl.line; c.fillRect(ax + 36 * u, memBot - 6 * u + aw, 4 * u, 58 * u);
    const ring = [];
    for (let k = 0; k < 10; k++) { const th = st.phase + k * TAU / 10; ring.push({ x: ax + 21 * u * Math.sin(th), w: Math.abs(Math.cos(th)), z: Math.cos(th) }); }
    ring.sort((a, b) => a.z - b.z);
    for (const r of ring) {
      const wd = (3 + 6 * r.w) * u, sh = shades(plum);
      c.fillStyle = r.z < 0 ? mix(sh.fill, tok.canvas, 0.3) : sh.fill; c.strokeStyle = pl.line; c.lineWidth = 0.9 * u;
      c.beginPath(); c.roundRect(r.x - wd / 2, memTop + u + aw, wd, memBot - memTop - 2 * u, 3 * u); c.fill(); c.stroke();
    }
    const sway = 3 * u * Math.sin(st.phase);
    c.strokeStyle = pl.line; c.lineWidth = 4.5 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax, memBot + aw); c.quadraticCurveTo(ax + sway, memBot + 20 * u + aw, ax, memBot + 36 * u + aw); c.stroke();
    c.lineCap = 'butt';
    const hy = memBot + 57 * u + aw;
    blob(c, ax - 19 * u, hy, 13 * u, 23 * u, 13.1, plum);
    blob(c, ax + 19 * u, hy, 13 * u, 23 * u, 13.9, plum);
    blob(c, ax, hy + 2 * u, 14 * u, 25 * u, 14.6, mix(plum, '#ffffff', tok.dark ? 0.1 : 0.2));
    // mobile carriers, moving with electron flux
    const ease = ph => 0.5 - 0.5 * Math.cos(ph * TAU);
    const flow = time * 0.5 * st.e;
    const pqFrom = cond === 'light' ? G.psii + 36 * u : G.ndh + 26 * u;
    for (let k = 0; k < 3; k++) {
      const f = ease((flow + k / 3) % 1), x = pqFrom + (G.b6f - 30 * u - pqFrom) * f;
      blob(c, x, my(x) + (k - 1) * 6 * u, 6.5 * u, 3.4 * u, 16 + k, ink('ochre'));
    }
    const pcTo = cond === 'light' ? G.psi - 34 * u : G.cytox - 18 * u;
    for (let k = 0; k < 2; k++) {
      const f = ease((flow * 0.8 + k / 2) % 1), x = G.b6f + 16 * u + (pcTo - G.b6f - 16 * u) * f;
      blob(c, x, memTop - 8 * u + wob(x), 6.5 * u, 5.5 * u, 19 + k, mix(ink('prussian'), tok.canvas, 0.2));
    }
    if (cond === 'light') { const f = ease((flow * 1.2) % 1), x = G.psi + 28 * u + (G.fnr - 20 * u - G.psi - 28 * u) * f; blob(c, x, memBot + 15 * u + wob(x), 5 * u, 4.6 * u, 22, ink('umber')); }
    // protons, Lumen's red
    c.fillStyle = tok.accent;
    for (const p of protons) {
      c.globalAlpha = clamp(p.a, 0, 1) * (p.mode === 'lumen' ? 0.9 : 0.7);
      c.beginPath(); c.arc(p.x, p.y, Math.max(1.4, 2.2 * u), 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    // photons as Feynman wiggles
    c.strokeStyle = ink('ochre'); c.lineWidth = Math.max(1, 1.3 * u);
    for (const p of photons) {
      c.beginPath();
      const L = 28 * u, n = 16, nx = -p.dy, ny = p.dx;
      for (let k = 0; k <= n; k++) {
        const t = k / n, along = -L * (1 - t), off = 3 * u * Math.sin(p.ph + t * 9) * Math.sin(Math.PI * t);
        const x = p.x + p.dx * along + nx * off, y = p.y + p.dy * along + ny * off;
        k ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    // small molecules
    for (const m of mols) {
      c.globalAlpha = clamp(Math.min(1, m.age * 3, (m.life - m.age) * 1.5), 0, 1);
      c.save(); c.translate(m.x, m.y); c.rotate(m.rot);
      if (m.type === 'atp') {
        blob(c, 0, 0, 4 * u, 3.5 * u, 23, ink('umber'));
        for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(4 * u + k * 3.9 * u, 0, 2 * u, 0, TAU); c.fillStyle = mix(ink('ochre'), tok.canvas, 0.2); c.fill(); c.lineWidth = 0.7 * u; c.strokeStyle = shades(ink('ochre')).line; c.stroke(); }
      } else {
        for (const dx of [-2.1 * u, 2.1 * u]) { c.beginPath(); c.arc(dx, 0, 2.8 * u, 0, TAU); c.fillStyle = mix(ink('prussian'), tok.canvas, 0.45); c.fill(); c.lineWidth = 0.7 * u; c.strokeStyle = shades(ink('prussian')).line; c.stroke(); }
      }
      c.restore();
    }
    c.globalAlpha = 1;
    // labels in the lumen band
    const ly = memTop - 22 * u;
    if (!narrow) smallLabel(c, 'LHCII', G.lhc, ly);
    smallLabel(c, 'PSII', G.psii, ly);
    smallLabel(c, 'NDH-1', G.ndh, ly);
    smallLabel(c, 'cyt b₆f', G.b6f, ly);
    smallLabel(c, narrow ? 'ox' : 'cyt oxidase', G.cytox, ly);
    smallLabel(c, 'PSI', G.psi, ly);
    if (!narrow) smallLabel(c, 'FNR', G.fnr, memBot + 34 * u);
    smallLabel(c, narrow ? 'ATP syn.' : 'ATP synthase', G.atp - 40 * u, memBot + 72 * u, 'right');
    if (!narrow) { smallLabel(c, 'thylakoid lumen', W - 14, memTop - 8 * u, 'right'); }
  }

  /* ---- drawing: the transit map ---- */
  const SHORT = { glyc: ['Glycolysis', 'Gluconeogen.'], ppp: ['Pentose P'], calvin: ['Calvin'], pdh: ['PDH'], krebs: ['Krebs'], ferm: ['Fermentation'], box: ['β-oxidation', 'FA synthesis'] };
  const width = f => Math.max(1, (1 + 5 * Math.min(1, Math.abs(f))) * G.us);
  function lineColor(lineId, f) {
    const base = ink(INK[lineId]);
    return mix(mix(base, tok.canvas, tok.dark ? 0.5 : 0.55), base, clamp(Math.abs(f) * 3, 0, 1));
  }
  function sideDir(S) {
    let v;
    if (S.side === 'in') { const c0 = T(...KC); v = [c0[0] - S.pos[0], c0[1] - S.pos[1]]; }
    else v = Tdir(...({ t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0], tr: [0.55, -0.85], tl: [-0.7, -0.7], br: [0.7, 0.7], bl: [-0.7, 0.7] })[S.side]);
    const L = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / L, v[1] / L];
  }
  function trace(c, path) { const p = path.pts; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); }
  function spur(c, from, to, text, f) {
    if (Math.abs(f) < 0.1) return;
    const a = T(...from), b = T(...to), us = G.us;
    c.globalAlpha = clamp(Math.abs(f) * 2, 0, 1);
    c.strokeStyle = rgba(tok.text, 0.45); c.lineWidth = 1; c.setLineDash([2.5, 2.5]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.setLineDash([]);
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    c.font = `italic ${Math.max(10.5, 12.5 * us)}px ${FONT}`; c.fillStyle = tok.muted;
    c.textAlign = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : 'center';
    c.textBaseline = Math.abs(dx) > Math.abs(dy) ? 'middle' : (dy > 0 ? 'top' : 'alphabetic');
    c.fillText(text, b[0] + dx / L * 4, b[1] + dy / L * 4);
    c.globalAlpha = 1;
  }
  function drawMap(c) {
    const us = G.us;
    // CO2 in at RuBisCO, out at PDC, PDH and in the Krebs cycle
    spur(c, [13, 2], [13.75, 2], 'CO₂', flux.calvin);
    spur(c, [20, 3], [20, 2.3], 'CO₂', flux.ferm);
    if (!G.narrow) spur(c, [19, 4], [18.3, 4], 'CO₂', flux.pdh);
    const kq = a => kp(a), ko = a => [KC[0] + (KR + 0.7) * Math.cos(a * Math.PI / 180), KC[1] + (KR + 0.7) * Math.sin(a * Math.PI / 180)];
    if (!G.narrow) spur(c, kq(22.5), ko(22.5), 'CO₂', flux.krebs);
    // the lines, quiet ones underneath
    c.lineCap = 'round'; c.lineJoin = 'round';
    const order = Object.keys(PATHS).sort((a, b) => Math.abs(flux[a]) - Math.abs(flux[b]));
    for (const k of order) { c.strokeStyle = lineColor(PATHS[k].line, flux[k]); c.lineWidth = width(flux[k]); trace(c, geo.paths[k]); c.stroke(); }
    // tokens: short gaps that run along each line at a speed set by its flux
    for (const k of Object.keys(PATHS)) {
      const f = flux[k]; if (Math.abs(f) < 0.07) continue;
      const path = geo.paths[k], n = Math.max(1, Math.floor(path.len / (54 * us))), w = width(f);
      for (let i = 0; i < n; i++) {
        const sv = ((phase[k] + i * path.len / n) % path.len + path.len) % path.len;
        const [x, y, ang] = at(path, sv);
        c.globalAlpha = clamp(Math.abs(f) * 4, 0, 1) * (path.closed ? 1 : clamp(Math.min(sv, path.len - sv) / (10 * us), 0, 1));
        c.save(); c.translate(x, y); c.rotate(ang);
        const h = Math.max(1.2, w - 1.6);
        c.fillStyle = tok.canvas; c.beginPath(); c.roundRect(-4.5 * us, -h / 2, 9 * us, h, h / 2); c.fill();
        c.restore();
      }
    }
    c.globalAlpha = 1;
    // names inside the loops
    c.font = `italic ${Math.max(11, 14 * us)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const loopName = (gx, gy, line, text) => { const p = T(gx, gy); c.fillStyle = lineColor(line, Math.max(0.2, Math.abs(flux[line]))); c.fillText(text, p[0], p[1]); };
    loopName(10, 2, 'calvin', G.narrow ? 'Calvin' : 'Calvin cycle');
    if (!G.narrow) loopName(KC[0], KC[1], 'krebs', 'Krebs cycle');
    loopName(22, 8, 'box', G.narrow ? 'β-ox.' : 'β-oxidation');
    // stations
    const sw = Math.max(1.3, 1.7 * us), rr = Math.max(3.4, 5 * us);
    for (const S of Object.values(geo.st)) {
      if (S.kind === 'corr') {
        c.save(); c.translate(S.pos[0], S.pos[1]); c.rotate(geo.corrAng + Math.PI / 2);
        const len = G.gap + 2 * rr;
        c.beginPath(); c.roundRect(-len / 2, -rr, len, 2 * rr, rr); c.fillStyle = tok.canvas; c.fill(); c.lineWidth = sw; c.strokeStyle = tok.text; c.stroke();
        c.restore();
      } else if (S.kind === 'hub') {
        c.beginPath(); c.arc(S.pos[0], S.pos[1], rr, 0, TAU); c.fillStyle = tok.canvas; c.fill(); c.lineWidth = sw; c.strokeStyle = tok.text; c.stroke();
      } else {
        const [dx, dy] = sideDir(S), nx = -Math.sin(S.ang), ny = Math.cos(S.ang), sg = nx * dx + ny * dy >= 0 ? 1 : -1;
        const f = flux[S.path], w = width(f), a0 = w / 2 - 0.5, a1 = w / 2 + 5 * us;
        c.strokeStyle = lineColor(PATHS[S.path].line, f); c.lineWidth = Math.max(1.5, 2.4 * us); c.lineCap = 'butt';
        c.beginPath(); c.moveTo(S.anchor[0] + nx * sg * a0, S.anchor[1] + ny * sg * a0); c.lineTo(S.anchor[0] + nx * sg * a1, S.anchor[1] + ny * sg * a1); c.stroke();
        S.tickEnd = [S.anchor[0] + nx * sg * a1, S.anchor[1] + ny * sg * a1];
      }
    }
    // station names
    const fs = Math.max(10.5, 13.5 * us);
    c.font = `${fs}px ${FONT}`; c.fillStyle = tok.text;
    for (const S of Object.values(geo.st)) {
      const [dx, dy] = sideDir(S);
      let bx, by, d;
      if (S.kind === 'tick') { [bx, by] = S.tickEnd || S.anchor; d = 3; }
      else { [bx, by] = S.pos; d = rr + (S.kind === 'corr' ? G.gap / 2 : 0) + 3; }
      const x = bx + dx * d, y = by + dy * d;
      if (Math.abs(dx) > 0.6) { c.textAlign = dx > 0 ? 'left' : 'right'; c.textBaseline = 'middle'; }
      else if (S.side.length === 2) { c.textAlign = dx >= 0 ? 'left' : 'right'; c.textBaseline = dy < 0 ? 'alphabetic' : 'top'; }
      else { c.textAlign = 'center'; c.textBaseline = dy > 0 ? 'top' : 'alphabetic'; }
      c.fillText(S.label, x, y + (c.textBaseline === 'top' ? 1 : 0));
    }
  }
  function drawKey(c) {
    const r = geo.key, us = G.us, fs = Math.max(10.5, 13 * us);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `italic ${fs}px ${FONT}`; c.fillStyle = tok.muted; c.fillText('Flux', r.x, r.y + fs);
    const rowH = Math.min((r.h - fs - 6) / LINES.length, 26 * us);
    LINES.forEach((L, i) => {
      const f = flux[L.id], y = r.y + fs + 6 + rowH * (i + 0.5);
      c.strokeStyle = lineColor(L.id, f); c.lineWidth = width(f); c.lineCap = 'round';
      c.beginPath(); c.moveTo(r.x + 3, y); c.lineTo(r.x + 20 * us, y); c.stroke();
      const name = G.narrow ? (f < -0.06 && SHORT[L.id][1] ? SHORT[L.id][1] : SHORT[L.id][0]) : (f < -0.06 && L.rev ? L.rev : L.name);
      c.font = `${fs}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
      c.fillStyle = Math.abs(f) > 0.06 ? tok.text : tok.muted; c.fillText(name, r.x + 28 * us, y);
      c.textAlign = 'right'; c.fillStyle = tok.text2; c.fillText(Math.round(Math.abs(f) * 100) + '%', r.x + r.w, y);
    });
  }
  function drawPools(c) {
    const r = geo.pools, us = G.us, fs = Math.max(10.5, 13 * us);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `italic ${fs}px ${FONT}`; c.fillStyle = tok.muted; c.fillText('Pools', r.x, r.y + fs);
    const rows = [['ATP of ATP + ADP', st.pools[0], ink('ochre')], ['NADH of NAD⁺ + NADH', st.pools[1], ink('indigo')], ['NADPH of NADP⁺ + NADPH', st.pools[2], ink('madder')],
      ['FADH₂ of FAD + FADH₂', st.pools[3], ink('sap')], ['proton gradient', st.g, tok.accent]];
    const rowH = (r.h - fs - 4) / rows.length, bh = Math.max(3, 4.5 * us);
    rows.forEach(([name, v, col], i) => {
      const y = r.y + fs + 4 + rowH * i + rowH * 0.48;
      c.font = `italic ${fs}px ${FONT}`; c.fillStyle = tok.text2; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillText(G.narrow ? (i === 4 ? 'H⁺ gradient' : name.split(' ')[0]) : name, r.x, y);
      c.font = `${fs}px ${FONT}`; c.fillStyle = tok.text; c.textAlign = 'right'; c.fillText(v.toFixed(2), r.x + r.w, y);
      c.fillStyle = col; c.fillRect(r.x, y + 4, r.w * v, bh);
      c.strokeStyle = rgba(tok.text, 0.3); c.lineWidth = 1; c.strokeRect(r.x + 0.5, y + 4.5, r.w - 1, bh - 1);
    });
  }
  function draw() {
    const c = s.ctx;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, G.W, G.H);
    drawMap(c); if (!G.narrow) drawKey(c); drawPools(c);
    drawMembrane(c);
    cap(`${C.name}. ${C.say}. Proton gradient ${st.g.toFixed(2)} · ATP synthase ${st.omega.toFixed(1)} turns a second · ${fmt(st.made)} ATP made.`);
  }
  wirePause(s, $('#pp-lumen'));
}
INITS.push(lu_Lumen);
