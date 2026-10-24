/* ---------- Fig. 2: Worldline, the canvas tilts into spacetime ---------- */
function wl_Worldline() {
  const canvas = $('#cv-wl');
  const cap = captioner($('#cap-wl'));
  const slider = $('#wl-v'), out = $('#wl-out');
  const bPlane = $('#wl-plane'), bST = $('#wl-st'), bLab = $('#wl-lab'), bObs = $('#wl-obs');
  // Units: c = 1, the lab box is [-1, 1]^2, and RATE sim units pass per real second.
  const RATE = 0.36, DEPTH = 3.4, KEEP = 9, SAMPLE = 0.015, BEAD = 0.25, LM = 1.0;
  const rnd = mulberry32(13);
  let tNow = 0, v = 0, cam = { el: Math.PI / 2, az: 0 }, camTo = null, s = 0, sTo = 0;
  let touched = false, autoAt = null, drag = null;

  // Bodies are analytic so their world lines are exact; each returns [x, y, vx, vy] at lab time t.
  const OM = 1.46, RB = 0.26, BX = -0.32, BY = 0.2;
  const tri = t => { const p = 4.5, u = ((t % p) + p) % p; return u < p / 2 ? u / (p / 2) : 2 - u / (p / 2); };
  const bodies = [
    { name: 'a', sel: true, m: 1, spin: 2.2, f: t => [BX + RB * Math.cos(OM * t), BY + RB * Math.sin(OM * t), -RB * OM * Math.sin(OM * t), RB * OM * Math.cos(OM * t)] },
    { name: 'b', m: 1, spin: -1.6, f: t => [BX - RB * Math.cos(OM * t), BY - RB * Math.sin(OM * t), RB * OM * Math.sin(OM * t), -RB * OM * Math.cos(OM * t)] },
    // the traveller covers 1.68 in 2.25 each way: 0.7467c out and back, turning at home
    { name: 'traveller', m: 0.7, spin: 3, f: t => { const u = tri(t); const dir = (((t % 4.5) + 4.5) % 4.5) < 2.25 ? 1 : -1; return [-0.84 + 1.68 * u, -0.6, 0.7467 * dir, 0]; } },
    { name: 'home', m: 0.7, spin: 1.2, f: () => [-0.84, -0.6, 0, 0] },
    { name: 'emitter', m: 1.5, spin: 0.6, f: () => [0.58, 0.5, 0, 0] },
  ];
  for (const b of bodies) { b.hist = []; b.tau = 0; }
  let photons = [], pions = [], nextPhoton = -3.4, nextPion = -3.2;

  function sampleBodies(t) {
    for (const b of bodies) {
      const last = b.hist[b.hist.length - 1];
      let tt = last ? last.t + SAMPLE : t - KEEP;
      for (; tt <= t + 1e-9; tt += SAMPLE) {
        const [x, y, vx, vy] = b.f(tt);
        if (b.hist.length) b.tau += (tt - b.hist[b.hist.length - 1].t) * Math.sqrt(Math.max(0, 1 - vx * vx - vy * vy));
        b.hist.push({ x, y, t: tt, tau: b.tau, vx, vy });
      }
      while (b.hist.length && b.hist[0].t < t - KEEP) b.hist.shift();
    }
  }
  // Light from body a, isotropic in its rest frame, aberrated and Doppler-shifted into the lab
  function emitPhoton(t) {
    const [x, y, vx, vy] = bodies[0].f(t);
    const th = rnd() * TAU, nx = Math.cos(th), ny = Math.sin(th);
    lightFrom(x, y, t, vx, vy, nx, ny);
  }
  function lightFrom(x, y, t, vx, vy, nx, ny) {
    const b2 = vx * vx + vy * vy, g = 1 / Math.sqrt(1 - b2), bn = vx * nx + vy * ny;
    let lx, ly;
    if (b2 > 1e-9) {
      const k = (g - 1) * bn / b2 + g;
      lx = (nx + k * vx) / (g * (1 + bn)); ly = (ny + k * vy) / (g * (1 + bn));
    } else { lx = nx; ly = ny; }
    const n = Math.hypot(lx, ly); lx /= n; ly /= n;
    const D = g * (1 + bn);
    // exit time from the box
    let tx = Infinity;
    for (const [p, d] of [[x, lx], [y, ly]]) { if (d > 1e-6) tx = Math.min(tx, (1.08 - p) / d); else if (d < -1e-6) tx = Math.min(tx, (-1.08 - p) / d); }
    photons.push({ x, y, t, dx: lx, dy: ly, tEnd: t + tx, D });
  }
  function emitPion(t) {
    const th = rnd() * TAU, sp = 0.6, vx = sp * Math.cos(th), vy = sp * Math.sin(th);
    const g = 1 / Math.sqrt(1 - sp * sp), life = 0.75 * g;
    const e = bodies[4].f(t);
    pions.push({ x: e[0], y: e[1], t, vx, vy, g, tEnd: t + life, decayed: false });
  }
  function step(dt) {
    tNow += dt * RATE;
    sampleBodies(tNow);
    while (nextPhoton <= tNow) { emitPhoton(nextPhoton); nextPhoton += 0.22 + rnd() * 0.12; }
    while (nextPion <= tNow) { emitPion(nextPion); nextPion += 1.3 + rnd() * 0.6; }
    for (const p of pions) if (!p.decayed && p.tEnd <= tNow) {
      p.decayed = true;
      const th = rnd() * TAU, x = p.x + p.vx * (p.tEnd - p.t), y = p.y + p.vy * (p.tEnd - p.t);
      lightFrom(x, y, p.tEnd, p.vx, p.vy, Math.cos(th), Math.sin(th));
      lightFrom(x, y, p.tEnd, p.vx, p.vy, -Math.cos(th), -Math.sin(th));
    }
    photons = photons.filter(p => tNow - p.tEnd < KEEP);
    pions = pions.filter(p => tNow - p.tEnd < KEEP);
    // camera and coordinate easing
    if (camTo) {
      const k = Math.min(1, dt * 1.6);
      cam.el += (camTo.el - cam.el) * k; cam.az += (camTo.az - cam.az) * k;
      if (Math.abs(camTo.el - cam.el) < 0.002 && Math.abs(camTo.az - cam.az) < 0.002) camTo = null;
    } else if (!drag && cam.el < 1.45) cam.az += dt * 0.035;
    s += (sTo - s) * Math.min(1, dt * 1.8);
    if (autoAt !== null && !touched && performance.now() > autoAt) { autoAt = null; camTo = { el: 0.52, az: -0.55 }; setCamButtons('st'); }
  }

  // Frames: phi is the observer's rapidity, psi the displayed one (lab at s = 0, observer at s = 1).
  function frame() {
    const g = 1 / Math.sqrt(1 - v * v), phi = Math.atanh(v), psi = s * phi;
    const Tobs = g * (tNow - Math.abs(v) * LM - 0.02);
    const ch = Math.cosh(psi), sh = Math.sinh(psi);
    const tr = Tobs / g;
    const xc = -sh * tr, tc = ch * tr;
    const D = (x, y, t) => [ch * x - sh * t - xc, y, ch * t - sh * x - tc];
    const gfun = (x, t) => g * (t - v * x) - Tobs;
    return { g, Tobs, D, gfun, tr };
  }
  function sliceOf(b, F) {
    const H = b.hist;
    for (let i = H.length - 1; i > 0; i--) {
      const A = H[i - 1], B = H[i], ga = F.gfun(A.x, A.t), gb = F.gfun(B.x, B.t);
      if (ga <= 0 && gb > 0 || (i === H.length - 1 && gb <= 0)) {
        if (gb <= 0) return { ...B };
        const k = -ga / (gb - ga);
        return { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, t: A.t + (B.t - A.t) * k, tau: A.tau + (B.tau - A.tau) * k, vx: B.vx, vy: B.vy };
      }
    }
    return null;
  }

  const s0 = makeSketch(canvas, { layout() {}, step, draw });
  sampleBodies(0);
  for (let i = 0; i < 30; i++) step(1 / 60);
  new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting && autoAt === null && !touched && cam.el > 1.5) autoAt = performance.now() + 1600; }, { threshold: 0.5 }).observe(canvas);
  if (reduceMotion) { cam.el = 0.52; cam.az = -0.55; touched = true; }

  function setCamButtons(which) { bPlane.setAttribute('aria-pressed', String(which === 'plane')); bST.setAttribute('aria-pressed', String(which === 'st')); }
  function setCoordButtons(which) { bLab.setAttribute('aria-pressed', String(which === 'lab')); bObs.setAttribute('aria-pressed', String(which === 'obs')); }
  bPlane.addEventListener('click', () => { touched = true; camTo = { el: Math.PI / 2, az: Math.round(cam.az / (Math.PI / 2)) * (Math.PI / 2) }; setCamButtons('plane'); if (!s0.running) { cam.el = camTo.el; camTo = null; s0.draw(); } });
  bST.addEventListener('click', () => { touched = true; camTo = { el: 0.52, az: Math.abs(cam.az) < 0.1 ? -0.55 : cam.az }; setCamButtons('st'); if (!s0.running) { cam.el = camTo.el; camTo = null; s0.draw(); } });
  bLab.addEventListener('click', () => { sTo = 0; setCoordButtons('lab'); if (!s0.running) { s = 0; s0.draw(); } });
  bObs.addEventListener('click', () => { sTo = 1; setCoordButtons('obs'); if (!s0.running) { s = 1; s0.draw(); } });
  slider.addEventListener('input', () => { v = +slider.value; sync(); if (!s0.running) s0.draw(); });
  function sync() { out.textContent = `v = ${v.toFixed(2)}c · γ = ${(1 / Math.sqrt(1 - v * v)).toFixed(2)}`; }
  sync(); setCamButtons(cam.el > 1.5 ? 'plane' : 'st'); setCoordButtons('lab');
  canvas.addEventListener('pointerdown', e => { touched = true; camTo = null; drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    cam.az += (e.clientX - drag[0]) * 0.008;
    cam.el = clamp(cam.el - (e.clientY - drag[1]) * 0.006, 0.16, Math.PI / 2);
    drag = [e.clientX, e.clientY];
    setCamButtons(cam.el > 1.5 ? 'plane' : 'st');
    if (!s0.running) s0.draw();
  });
  const end = () => { drag = null; canvas.style.cursor = ''; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  function photonColor(D) {
    const base = tok.muted;
    if (D < 1) return mix(base, tok['ink-sienna'], clamp((1 - D) / 0.3, 0, 1));
    return mix(base, tok['ink-indigo'], clamp((D - 1) / 0.45, 0, 1));
  }

  function draw() {
    const c = s0.ctx, W = s0.w, H = s0.h;
    c.fillStyle = tok.canvas; c.fillRect(0, 0, W, H);
    const F = frame();
    const el = cam.el, ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(cam.az), sa = Math.sin(cam.az);
    const tilt = clamp(ce / Math.cos(0.52), 0, 1); // 0 in the plane view, 1 when fully tilted
    const Sp = Math.min(W / 2.5, (H - 56) / 2.25), St = Math.min(W / 3.3, (H - 50) / (DEPTH * ce + 2.9 * se + 0.1));
    const S = Sp + (St - Sp) * tilt;
    const cx = W / 2, cy = H / 2 + 6, shift = s * v * DEPTH / 2 * tilt;
    const P = (X, Y, T) => {
      X -= shift;
      const X1 = X * ca - Y * sa, Dp = X * sa + Y * ca;
      return [cx + S * X1, cy - S * ((T + DEPTH / 2) * ce + Dp * se)];
    };
    const PD = (x, y, t) => { const d = F.D(x, y, t); return [P(d[0], d[1], d[2]), d[2]]; };
    const ink = tok.text, red = tok.accent;
    const fadeT = T => clamp(1 + T / DEPTH, 0, 1);

    // the lab box: its corners' world lines (at rest in the lab), dashed
    c.lineWidth = 1; c.setLineDash([2, 4]);
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const tTop = F.Tobs / F.g + v * x;
      const [p0] = PD(x, y, tTop), [p1] = PD(x, y, tTop - DEPTH * F.g);
      c.strokeStyle = rgba(ink, 0.12 * tilt); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    }
    c.setLineDash([]);

    // body world lines, faded by age, with beads at equal proper time
    for (const b of bodies) {
      const H2 = b.hist, col = b.sel ? red : ink;
      let prev = null, chunkA = -1;
      c.lineWidth = b.sel ? 1.6 : 1.2;
      for (let i = 0; i < H2.length; i++) {
        const e = H2[i], [p, T] = PD(e.x, e.y, e.t);
        const fut = F.gfun(e.x, e.t) > 0;
        if (T < -DEPTH) { prev = null; continue; }
        if (prev) {
          if (T > 0.7) { prev = null; continue; }
          const a = fut ? 0.1 : (0.18 + 0.72 * fadeT(T)) * (b.sel ? 1 : 0.85);
          if (Math.abs(a - chunkA) > 0.04 || i % 24 === 0) { if (chunkA >= 0) c.stroke(); c.strokeStyle = rgba(col, a); chunkA = a; c.beginPath(); c.moveTo(prev[0], prev[1]); }
          c.lineTo(p[0], p[1]);
        }
        prev = p;
      }
      if (chunkA >= 0) c.stroke();
      // beads
      let next = Math.ceil((H2[0] ? H2[0].tau : 0) / BEAD) * BEAD;
      for (const e of H2) {
        if (e.tau < next) continue;
        next += BEAD;
        if (F.gfun(e.x, e.t) > 0) break;
        const [p, T] = PD(e.x, e.y, e.t);
        if (T < -DEPTH) continue;
        c.fillStyle = rgba(col, (0.25 + 0.7 * fadeT(T)) * (b.sel ? 1 : 0.85));
        c.beginPath(); c.arc(p[0], p[1], b.sel ? 2.1 : 1.8, 0, TAU); c.fill();
      }
    }

    // pions: massive bosons on straight timelike world lines, beaded by their own clocks
    for (const q of pions) {
      const t1 = Math.min(q.tEnd, tNow);
      const steps = 24;
      let prev = null;
      c.lineWidth = 1.3;
      for (let k = 0; k <= steps; k++) {
        const t = q.t + (t1 - q.t) * k / steps, x = q.x + q.vx * (t - q.t), y = q.y + q.vy * (t - q.t);
        const [p, T] = PD(x, y, t);
        if (T >= -DEPTH && prev) {
          const fut = F.gfun(x, t) > 0;
          c.strokeStyle = rgba(tok['ink-mulberry'], fut ? 0.18 : 0.25 + 0.65 * fadeT(T));
          c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(p[0], p[1]); c.stroke();
        }
        prev = T >= -DEPTH ? p : null;
      }
      for (let tau = 0.15; tau * q.g < t1 - q.t; tau += 0.15) {
        const t = q.t + tau * q.g, x = q.x + q.vx * (t - q.t), y = q.y + q.vy * (t - q.t);
        if (F.gfun(x, t) > 0) break;
        const [p, T] = PD(x, y, t); if (T < -DEPTH) continue;
        c.fillStyle = rgba(tok['ink-mulberry'], 0.3 + 0.6 * fadeT(T)); c.beginPath(); c.arc(p[0], p[1], 1.6, 0, TAU); c.fill();
      }
    }

    // photons: light-like world lines, colored by their energy in the lab
    for (const ph of photons) {
      const t1 = Math.min(ph.tEnd, tNow);
      if (t1 <= ph.t) continue;
      const lam = t => [ph.x + ph.dx * (t - ph.t), ph.y + ph.dy * (t - ph.t)];
      // split at the observer's present: g is linear along the line
      const g0 = F.gfun(ph.x, ph.t), [xe, ye] = lam(t1), g1 = F.gfun(xe, t1);
      const tS = g0 < 0 && g1 > 0 ? ph.t + (t1 - ph.t) * (-g0 / (g1 - g0)) : (g1 <= 0 ? t1 : ph.t);
      const col = photonColor(ph.D);
      const seg = (ta, tb, alphaFn, width) => {
        if (tb <= ta) return;
        const n = 6;
        for (let k = 0; k < n; k++) {
          const tA = ta + (tb - ta) * k / n, tB = ta + (tb - ta) * (k + 1) / n;
          const [xa, ya] = lam(tA), [xb, yb] = lam(tB);
          const [pa, Ta] = PD(xa, ya, tA), [pb, Tb] = PD(xb, yb, tB);
          if (Tb < -DEPTH) continue;
          c.strokeStyle = rgba(col, alphaFn(Math.max(Ta, -DEPTH))); c.lineWidth = width;
          c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.stroke();
        }
      };
      seg(ph.t, tS, T => 0.3 + 0.65 * fadeT(T), 1.25);
      seg(tS, t1, () => 0.08, 1);
    }

    // the observer's present: the lab box cut by the slice, with the lab's rulers
    const corner = (x, y) => PD(x, y, F.Tobs / F.g + v * x)[0];
    const pc = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    c.beginPath(); pc.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    c.fillStyle = rgba(ink, (tok.dark ? 0.05 : 0.035) * tilt); c.fill();
    c.strokeStyle = rgba(ink, 0.42); c.lineWidth = 1; c.stroke();
    c.strokeStyle = rgba(ink, 0.09); c.beginPath();
    for (let k = -4; k <= 4; k++) {
      const q = k * 0.25;
      let a = corner(q, -1), b = corner(q, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      a = corner(-1, q); b = corner(1, q); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
    }
    c.stroke();

    // the red body's past light cone, which is the same 45° cone in every frame
    const A = sliceOf(bodies[0], F);
    if (A && tilt > 0.05) {
      const [, , Ta] = F.D(A.x, A.y, A.t), da = F.D(A.x, A.y, A.t);
      for (const d of [0.5, 1]) {
        if (Ta - d < -DEPTH) break;
        c.strokeStyle = rgba(red, 0.3 * tilt * (1.2 - d * 0.5)); c.lineWidth = 1; c.beginPath();
        for (let k = 0; k <= 56; k++) { const a = k / 56 * TAU, p = P(da[0] + d * Math.cos(a), da[1] + d * Math.sin(a), Ta - d); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        c.stroke();
      }
    }

    // photons and pions at the present
    for (const ph of photons) {
      const t1 = Math.min(ph.tEnd, tNow), g0 = F.gfun(ph.x, ph.t);
      const xe = ph.x + ph.dx * (t1 - ph.t), g1 = F.gfun(xe, t1);
      if (!(g0 <= 0 && g1 > 0)) continue;
      const t = ph.t + (t1 - ph.t) * (-g0 / (g1 - g0)), x = ph.x + ph.dx * (t - ph.t), y = ph.y + ph.dy * (t - ph.t);
      const p = PD(x, y, t)[0], q = PD(x - ph.dx * 0.05, y - ph.dy * 0.05, t)[0];
      c.strokeStyle = photonColor(ph.D); c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(p[0], p[1]); c.stroke(); c.lineCap = 'butt';
    }
    for (const q of pions) {
      const t1 = Math.min(q.tEnd, tNow), g0 = F.gfun(q.x, q.t), x1 = q.x + q.vx * (t1 - q.t), g1 = F.gfun(x1, t1);
      if (!(g0 <= 0 && g1 > 0)) continue;
      const t = q.t + (t1 - q.t) * (-g0 / (g1 - g0)), p = PD(q.x + q.vx * (t - q.t), q.y + q.vy * (t - q.t), t)[0];
      c.fillStyle = tok['ink-mulberry']; c.beginPath(); c.arc(p[0], p[1], 3.2, 0, TAU); c.fill();
    }

    // bodies at the observer's present: rest-frame disks, contracted along their motion, with a spoke
    for (const b of bodies) {
      const e = sliceOf(b, F); if (!e) continue;
      const [p] = PD(e.x, e.y, e.t);
      const d0 = F.D(e.x, e.y, e.t), d1 = F.D(e.x + e.vx * 0.01, e.y + e.vy * 0.01, e.t + 0.01);
      const ux = (d1[0] - d0[0]) / (d1[2] - d0[2]), uy = (d1[1] - d0[1]) / (d1[2] - d0[2]);
      const u = Math.min(0.99, Math.hypot(ux, uy)), ang = Math.atan2(uy, ux);
      const R = S * 0.06 * Math.sqrt(b.m);
      c.save(); c.translate(p[0], p[1]);
      // the disk lives in the slice; squash it by the camera's view of the plane
      c.scale(1, Math.max(0.12, se));
      c.rotate(-(ang + cam.az));
      c.scale(Math.sqrt(1 - u * u), 1);
      c.beginPath(); c.arc(0, 0, R, 0, TAU);
      c.fillStyle = b.sel ? red : mix(tok.canvas, ink, 0.82); c.fill();
      c.lineWidth = 1.5; c.strokeStyle = tok.canvas; c.stroke();
      const spoke = b.spin * e.tau;
      c.strokeStyle = tok.canvas; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(R * 0.85 * Math.cos(spoke), R * 0.85 * Math.sin(spoke)); c.stroke();
      c.restore();
    }

    // a time axis, once tilted
    if (tilt > 0.1) {
      let best = null;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = corner(x, y); if (!best || q[0] < best.q[0]) best = { x, y, q }; }
      c.font = `italic 13px ${FONT}`; c.fillStyle = rgba(tok.muted, tilt); c.textAlign = 'right'; c.textBaseline = 'middle';
      c.strokeStyle = rgba(ink, 0.3 * tilt); c.lineWidth = 1;
      const dc = F.D(best.x, best.y, F.Tobs / F.g + v * best.x), X0 = dc[0], Tc = dc[2];
      const top = P(X0, best.y, Tc), bot = P(X0, best.y, Math.max(-DEPTH, Tc - DEPTH));
      c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(bot[0], bot[1]); c.stroke();
      for (let k = 1; k <= 3; k++) { if (Tc - k < -DEPTH) break; const q = P(X0, best.y, Tc - k); c.beginPath(); c.moveTo(q[0] - 3, q[1]); c.lineTo(q[0] + 3, q[1]); c.stroke(); c.fillText(`${k} ago`, q[0] - 7, q[1]); }
      c.fillText('now', top[0] - 7, top[1]);
    }
    c.font = `italic 14px ${FONT}`; c.fillStyle = tok.muted; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillText(tilt > 0.5 ? (s > 0.5 ? 'observer coordinates' : 'lab coordinates') : 'the present', W - 14, 27);

    // the twins meet each 4.5 when the traveller turns at home; the traveller's clock runs at 1/γ
    const since = ((tNow % 4.5) + 4.5) % 4.5, home = since, aged = since * Math.sqrt(1 - 0.7467 * 0.7467);
    const twins = `Since the twins last met, the traveller has aged ${aged.toFixed(2)} and the one at home ${home.toFixed(2)}.`;
    const who = Math.abs(v) < 0.005 ? 'the lab' : `an observer moving at ${v.toFixed(2)}c`;
    if (tilt < 0.5) cap(`Plane view: the present for ${who}, with each trail the shadow of a world line. Drag down or choose Spacetime to tilt it. ${twins}`);
    else cap(`Spacetime view in ${s > 0.5 ? 'the observer’s' : 'lab'} coordinates. The plane is the present for ${who}${s <= 0.5 && Math.abs(v) >= 0.005 ? '; in the lab it tilts by Δt = v Δx' : ''}. Light keeps to 45° in every frame, and beads mark equal proper time. ${twins}`);
  }
  wirePause(s0, $('#pp-wl'));
}
INITS.push(wl_Worldline);
