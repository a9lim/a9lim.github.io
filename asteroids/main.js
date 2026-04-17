/* ===================================================================
   Relativistic Asteroids
   ───────────────────────
   Lab frame: classical asteroid simulation with toroidal wrap.
   Ship dynamics use proper relativistic 3-momentum:
     p = γ m v,  v = p c² / E,  E = √(|p|²c² + m²c⁴)
   so |v| asymptotes to c without bound on |p|.

   Render modes:
     • lab — god view, no distortion
     • ship — observer's instantaneous rest frame: light-cone delay,
              relativistic aberration of angles, length contraction
              of asteroid shapes along their proper-motion direction,
              and relativistic Doppler tint per object.

   The ship-frame render is what makes things feel relativistic —
   asteroids ahead crowd toward the velocity vector, blueshift, and
   contract along their direction of relative motion; asteroids behind
   redshift and stretch out across the rear sky.
   =================================================================== */

const $ = (id) => document.getElementById(id);

// ─── Constants and tuning ────────────────────────────────────────────
const C   = 600;            // px / s — speed of light in this universe
const C2  = C * C;
const SHIP_THRUST    = 320; // lab-frame "force" per unit rest mass
const SHIP_TURN      = 3.0; // rad / s
const SHIP_RADIUS    = 12;
const BULLET_TTL     = 1.4; // seconds (lab frame)
const FIRE_COOLDOWN  = 0.18;
const ASTEROID_SIZES = { 3: 44, 2: 26, 1: 14 };  // tier → radius
const ASTEROID_VMAX  = 0.35 * C;
const INVULN_TIME    = 2.2;

// ─── Game state ──────────────────────────────────────────────────────
const state = {
  W: 1600, H: 1000,         // lab world dimensions (toroidal)
  t: 0,                      // lab time
  ship: null,
  asteroids: [],
  bullets: [],
  particles: [],
  score: 0,
  level: 1,
  lives: 3,
  paused: false,
  gameOver: false,
  startedAt: 0,
  view: 'ship',              // 'ship' | 'lab'
  fx: { aberr: true, contract: true, doppler: true, lightcone: true, beam: true },
  input: { left: false, right: false, thrust: false, brake: false, fire: false },
};

function resetGame() {
  state.t = 0;
  state.ship = makeShip();
  state.asteroids = [];
  state.bullets = [];
  state.particles = [];
  state.score = 0;
  state.level = 1;
  state.lives = 3;
  state.paused = false;
  state.gameOver = false;
  state.startedAt = performance.now();
  spawnLevel();
}

function makeShip() {
  return {
    x: state.W / 2, y: state.H / 2,
    px: 0, py: 0,             // 3-momentum (per unit rest mass)
    theta: -Math.PI / 2,      // facing direction (lab frame)
    propTime: 0,
    cooldown: 0,
    invuln: INVULN_TIME,
    alive: true,
  };
}

function spawnLevel() {
  const n = 3 + state.level;
  for (let i = 0; i < n; i++) state.asteroids.push(makeAsteroid(3));
}

function makeAsteroid(tier, x, y) {
  const r = ASTEROID_SIZES[tier];
  const a = Math.random() * Math.PI * 2;
  const speed = (0.05 + Math.random() * 0.95) * ASTEROID_VMAX;
  const verts = 9 + Math.floor(Math.random() * 4);
  const shape = [];
  for (let i = 0; i < verts; i++) {
    const t = (i / verts) * Math.PI * 2;
    const jitter = 0.65 + Math.random() * 0.55;
    shape.push([Math.cos(t) * r * jitter, Math.sin(t) * r * jitter]);
  }
  let sx = x, sy = y;
  if (sx == null) {
    do {
      sx = Math.random() * state.W;
      sy = Math.random() * state.H;
    } while (state.ship && Math.hypot(sx - state.ship.x, sy - state.ship.y) < 220);
  }
  return {
    x: sx, y: sy,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    r, tier, shape,
    rot: Math.random() * Math.PI * 2,
    omega: (Math.random() - 0.5) * 0.6,
    spawned: state.t,
  };
}

// ─── Relativistic helpers ────────────────────────────────────────────
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function pToV(px, py) {
  const p2 = px * px + py * py;
  const E  = Math.sqrt(p2 * C2 + C2 * C2);          // E/m = √(p²c² + c⁴)
  return [px * C2 / E, py * C2 / E, E / C2];        // also returns γ
}

function wrap(dx, dy) {
  const W = state.W, H = state.H;
  dx = ((dx + W * 1.5) % W) - W / 2;
  dy = ((dy + H * 1.5) % H) - H / 2;
  return [dx, dy];
}

// Solve light-cone for a constant-velocity emitter:
//     |dr - v_a τ| = c τ      →   τ²(c²-|v|²) - 2τ(dr·v) - |dr|² = 0
// Take the positive root.
function lightCone(dx, dy, vx, vy) {
  const v2 = vx * vx + vy * vy;
  const A  = C2 - v2;
  const B  = -(dx * vx + dy * vy);
  const Cc = -(dx * dx + dy * dy);
  const disc = B * B - A * Cc;
  const tau  = (-B + Math.sqrt(Math.max(0, disc))) / A;
  return { tau, ax: dx - vx * tau, ay: dy - vy * tau };
}

// Aberration: lab-frame direction (cosθ,sinθ) measured from +v̂_s axis
// → ship-frame direction (cosθ',sinθ') in the same local basis.
function aberrate(cosT, sinT, beta, gamma) {
  const denom = 1 + beta * cosT;
  return [(cosT + beta) / denom, sinT / (gamma * denom)];
}

// Doppler factor (received / emitted) for stationary lab emitter and
// observer with β along +x: D = γ(1 + β cosθ).
function dopplerFactor(cosT, beta, gamma) {
  return gamma * (1 + beta * cosT);
}

// Velocity addition: asteroid v_a in lab → asteroid velocity in ship frame.
function addVel(vax, vay, vsx, vsy) {
  const vs2 = vsx * vsx + vsy * vsy;
  if (vs2 < 1e-9) return [vax, vay];
  const gs = 1 / Math.sqrt(Math.max(1e-12, 1 - vs2 / C2));
  const dot = vax * vsx + vay * vsy;
  const denom = 1 - dot / C2;
  const vsmag = Math.sqrt(vs2);
  const ux = vsx / vsmag, uy = vsy / vsmag;
  const vapar = vax * ux + vay * uy;
  const vapx  = vax - vapar * ux;
  const vapy  = vay - vapar * uy;
  const newPar = (vapar - vsmag) / denom;
  const px = newPar * ux + vapx / (gs * denom);
  const py = newPar * uy + vapy / (gs * denom);
  return [px, py];
}

// ─── Simulation step (lab frame) ─────────────────────────────────────
function step(dt) {
  if (state.paused || state.gameOver) return;

  state.t += dt;
  const ship = state.ship;

  if (state.input.left)  ship.theta -= SHIP_TURN * dt;
  if (state.input.right) ship.theta += SHIP_TURN * dt;

  if (state.input.thrust) {
    ship.px += Math.cos(ship.theta) * SHIP_THRUST * dt;
    ship.py += Math.sin(ship.theta) * SHIP_THRUST * dt;
  }
  if (state.input.brake) {
    const [vx, vy] = pToV(ship.px, ship.py);
    const sp = Math.hypot(vx, vy);
    if (sp > 1) {
      ship.px -= (vx / sp) * SHIP_THRUST * 0.7 * dt;
      ship.py -= (vy / sp) * SHIP_THRUST * 0.7 * dt;
    }
  }

  const [vx, vy, gamma] = pToV(ship.px, ship.py);
  ship.x = (ship.x + vx * dt + state.W) % state.W;
  ship.y = (ship.y + vy * dt + state.H) % state.H;
  ship.propTime += dt / gamma;
  ship.cooldown = Math.max(0, ship.cooldown - dt);
  ship.invuln   = Math.max(0, ship.invuln  - dt);

  if (state.input.fire && ship.cooldown === 0 && ship.alive) {
    fireBullet(ship, vx, vy);
    ship.cooldown = FIRE_COOLDOWN;
  }

  for (const a of state.asteroids) {
    a.x = (a.x + a.vx * dt + state.W) % state.W;
    a.y = (a.y + a.vy * dt + state.H) % state.H;
    a.rot += a.omega * dt;
  }

  for (const b of state.bullets) {
    b.x = (b.x + b.vx * dt + state.W) % state.W;
    b.y = (b.y + b.vy * dt + state.H) % state.H;
    b.ttl -= dt;
  }
  state.bullets = state.bullets.filter(b => b.ttl > 0);

  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.ttl -= dt;
  }
  state.particles = state.particles.filter(p => p.ttl > 0);

  outer: for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    for (let j = state.asteroids.length - 1; j >= 0; j--) {
      const a = state.asteroids[j];
      const [dx, dy] = wrap(a.x - b.x, a.y - b.y);
      if (dx * dx + dy * dy < a.r * a.r) {
        state.bullets.splice(i, 1);
        destroyAsteroid(j);
        continue outer;
      }
    }
  }

  if (ship.alive && ship.invuln === 0) {
    for (const a of state.asteroids) {
      const [dx, dy] = wrap(a.x - ship.x, a.y - ship.y);
      if (dx * dx + dy * dy < (a.r + SHIP_RADIUS) * (a.r + SHIP_RADIUS)) {
        killShip();
        break;
      }
    }
  }

  if (state.asteroids.length === 0) {
    state.level++;
    spawnLevel();
  }
}

function fireBullet(ship, vsx, vsy) {
  // Bullet is a photon: in ship frame it leaves at speed c along ship.theta.
  // Inverse aberration gives lab-frame direction.
  let dx = Math.cos(ship.theta), dy = Math.sin(ship.theta);
  const vs2 = vsx * vsx + vsy * vsy;
  if (vs2 > 1e-9) {
    const beta  = Math.sqrt(vs2) / C;
    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const ux = vsx / Math.sqrt(vs2), uy = vsy / Math.sqrt(vs2);
    const wx = -uy, wy = ux;
    const dPar  = dx * ux + dy * uy;
    const dPerp = dx * wx + dy * wy;
    const denom = 1 - beta * dPar;
    const cosL = (dPar - beta) / denom;
    const sinL = dPerp / (gamma * denom);
    dx = ux * cosL + wx * sinL;
    dy = uy * cosL + wy * sinL;
  }
  state.bullets.push({
    x: ship.x + dx * SHIP_RADIUS * 1.4,
    y: ship.y + dy * SHIP_RADIUS * 1.4,
    vx: dx * C, vy: dy * C,
    ttl: BULLET_TTL,
    born: state.t,
  });
}

function destroyAsteroid(idx) {
  const a = state.asteroids[idx];
  state.score += (4 - a.tier) * 50;
  state.asteroids.splice(idx, 1);
  for (let i = 0; i < 14; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp  = (60 + Math.random() * 220);
    state.particles.push({
      x: a.x, y: a.y,
      vx: Math.cos(ang) * sp + a.vx,
      vy: Math.sin(ang) * sp + a.vy,
      ttl: 0.4 + Math.random() * 0.5,
      maxTtl: 0.9,
    });
  }
  if (a.tier > 1) {
    for (let i = 0; i < 2; i++) {
      const child = makeAsteroid(a.tier - 1, a.x, a.y);
      child.vx += a.vx * 0.5;
      child.vy += a.vy * 0.5;
      state.asteroids.push(child);
    }
  }
  updateHud();
}

function killShip() {
  const ship = state.ship;
  ship.alive = false;
  for (let i = 0; i < 30; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp  = 80 + Math.random() * 260;
    state.particles.push({
      x: ship.x, y: ship.y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      ttl: 0.6 + Math.random() * 0.7,
      maxTtl: 1.3,
    });
  }
  state.lives--;
  updateHud();
  if (state.lives <= 0) {
    state.gameOver = true;
    showOverlay();
    return;
  }
  setTimeout(() => {
    if (!state.gameOver) {
      state.ship = makeShip();
      for (let tries = 0; tries < 12; tries++) {
        let safe = true;
        for (const a of state.asteroids) {
          const [dx, dy] = wrap(a.x - state.ship.x, a.y - state.ship.y);
          if (dx * dx + dy * dy < 200 * 200) { safe = false; break; }
        }
        if (safe) break;
        state.ship.x = Math.random() * state.W;
        state.ship.y = Math.random() * state.H;
      }
    }
  }, 900);
}

// ─── Render ──────────────────────────────────────────────────────────
const canvas = $('sim-canvas');
const ctx    = canvas.getContext('2d');
let DPR = 1, W = 0, H = 0;

function resize() {
  DPR = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  W = Math.max(1, Math.floor(r.width));
  H = Math.max(1, Math.floor(r.height));
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function dopplerColor(D) {
  const lD = Math.log2(clamp(D, 0.1, 10));
  const t = clamp(lD, -1.5, 1.5) / 1.5;
  if (t >= 0) return _hsl2hex(195, 0.55, 0.7 - t * 0.12);
  return _hsl2hex(12, 0.7, 0.6 + t * 0.12);
}

function transformObject(ax, ay, avx, avy, sx, sy, svx, svy, useLightCone) {
  const [dx0, dy0] = wrap(ax - sx, ay - sy);
  let dx = dx0, dy = dy0;
  if (useLightCone) {
    const lc = lightCone(dx0, dy0, avx, avy);
    dx = lc.ax;
    dy = lc.ay;
  }
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) {
    return { x: 0, y: 0, dist: 0, dop: 1, gammaRel: 1, dirRel: [1, 0], cosT: 1 };
  }
  const vs2 = svx * svx + svy * svy;
  const beta = Math.sqrt(vs2) / C;
  const gamma = 1 / Math.sqrt(Math.max(1e-12, 1 - beta * beta));
  if (beta > 1e-6) {
    const ux = svx / (beta * C), uy = svy / (beta * C);
    const wx = -uy, wy = ux;
    const drx = dx / dist, dry = dy / dist;
    const cosT = drx * ux + dry * uy;
    const sinT = drx * wx + dry * wy;
    let cosAp = cosT, sinAp = sinT;
    if (state.fx.aberr) {
      [cosAp, sinAp] = aberrate(cosT, sinT, beta, gamma);
      const m = Math.hypot(cosAp, sinAp) || 1;
      cosAp /= m; sinAp /= m;
    }
    const fx = ux * cosAp + wx * sinAp;
    const fy = uy * cosAp + wy * sinAp;
    const dop = state.fx.doppler ? dopplerFactor(cosT, beta, gamma) : 1;
    const [rvx, rvy] = state.fx.contract ? addVel(avx, avy, svx, svy) : [0, 0];
    const rv2 = rvx * rvx + rvy * rvy;
    const gRel = 1 / Math.sqrt(Math.max(1e-12, 1 - rv2 / C2));
    const rvm = Math.sqrt(rv2);
    const dirRel = rvm > 1e-6 ? [rvx / rvm, rvy / rvm] : [1, 0];
    return { x: fx * dist, y: fy * dist, dist, dop, gammaRel: gRel, dirRel, cosT };
  }
  const [rvx, rvy] = state.fx.contract ? [avx, avy] : [0, 0];
  const rv2 = rvx * rvx + rvy * rvy;
  const gRel = 1 / Math.sqrt(Math.max(1e-12, 1 - rv2 / C2));
  const rvm = Math.sqrt(rv2);
  const dirRel = rvm > 1e-6 ? [rvx / rvm, rvy / rvm] : [1, 0];
  return { x: dx, y: dy, dist, dop: 1, gammaRel: gRel, dirRel, cosT: 1 };
}

function drawAsteroid(a, viewPos, view) {
  ctx.save();
  ctx.translate(viewPos.x, viewPos.y);
  if (state.fx.contract && view === 'ship' && viewPos.gammaRel > 1.001) {
    const ang = Math.atan2(viewPos.dirRel[1], viewPos.dirRel[0]);
    ctx.rotate(ang);
    ctx.scale(1 / viewPos.gammaRel, 1);
    ctx.rotate(-ang);
  }
  ctx.rotate(a.rot);

  ctx.beginPath();
  ctx.moveTo(a.shape[0][0], a.shape[0][1]);
  for (let i = 1; i < a.shape.length; i++) ctx.lineTo(a.shape[i][0], a.shape[i][1]);
  ctx.closePath();

  const fill = view === 'ship' ? dopplerColor(viewPos.dop) : cssVar('--text');
  ctx.fillStyle = fill;
  ctx.globalAlpha = view === 'ship' ? 0.18 : 0.10;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = fill;
  ctx.stroke();
  ctx.restore();
}

function drawShip(ship, atX, atY, theta) {
  ctx.save();
  ctx.translate(atX, atY);
  ctx.rotate(theta);
  const r = SHIP_RADIUS;
  ctx.beginPath();
  ctx.moveTo(r * 1.4, 0);
  ctx.lineTo(-r * 0.9, r * 0.85);
  ctx.lineTo(-r * 0.45, 0);
  ctx.lineTo(-r * 0.9, -r * 0.85);
  ctx.closePath();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = cssVar('--accent');
  ctx.fillStyle   = cssVar('--bg-elevated');
  ctx.fill();
  ctx.stroke();
  if (state.input.thrust && ship.alive) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, 0);
    const flick = 0.4 + Math.random() * 0.6;
    ctx.lineTo(-r * (0.9 + flick), r * 0.4);
    ctx.lineTo(-r * (1.6 + flick), 0);
    ctx.lineTo(-r * (0.9 + flick), -r * 0.4);
    ctx.closePath();
    ctx.fillStyle = cssVar('--accent-light');
    ctx.fill();
  }
  if (ship.invuln > 0 && Math.floor(state.t * 8) % 2 === 0) {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = cssVar('--secondary');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);
  drawStars();
  const ship = state.ship;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  if (state.view === 'lab') {
    for (const a of state.asteroids) {
      const [dx, dy] = wrap(a.x - ship.x, a.y - ship.y);
      drawAsteroid(a, { x: dx, y: dy, gammaRel: 1, dirRel: [1, 0], dop: 1 }, 'lab');
    }
    ctx.fillStyle = cssVar('--accent');
    for (const b of state.bullets) {
      const [dx, dy] = wrap(b.x - ship.x, b.y - ship.y);
      ctx.beginPath();
      ctx.arc(dx, dy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    const [vx, vy] = pToV(ship.px, ship.py);
    if (Math.hypot(vx, vy) > 1) drawVelocityArrow(vx, vy);
  } else {
    const [vx, vy] = pToV(ship.px, ship.py);
    for (const a of state.asteroids) {
      const vp = transformObject(a.x, a.y, a.vx, a.vy, ship.x, ship.y, vx, vy, state.fx.lightcone);
      drawAsteroid(a, vp, 'ship');
    }
    ctx.fillStyle = cssVar('--accent');
    for (const b of state.bullets) {
      const vp = transformObject(b.x, b.y, b.vx, b.vy, ship.x, ship.y, vx, vy, state.fx.lightcone);
      ctx.beginPath();
      ctx.arc(vp.x, vp.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const p of state.particles) {
    const ttlR = clamp(p.ttl / (p.maxTtl || 1), 0, 1);
    const [dx, dy] = wrap(p.x - ship.x, p.y - ship.y);
    let px = dx, py = dy;
    if (state.view === 'ship') {
      const [vx, vy] = pToV(ship.px, ship.py);
      const vp = transformObject(p.x, p.y, p.vx, p.vy, ship.x, ship.y, vx, vy, state.fx.lightcone);
      px = vp.x; py = vp.y;
    }
    ctx.globalAlpha = ttlR;
    ctx.fillStyle = cssVar('--text');
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }
  ctx.globalAlpha = 1;

  if (ship.alive) drawShip(ship, 0, 0, ship.theta);
  ctx.restore();

  drawHudOverlay();
}

function drawVelocityArrow(vx, vy) {
  const sp = Math.hypot(vx, vy);
  if (sp < 1) return;
  const len = clamp(sp / C * 90, 12, 90);
  const ang = Math.atan2(vy, vx);
  ctx.save();
  ctx.rotate(ang);
  ctx.strokeStyle = cssVar('--secondary');
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 6, -3);
  ctx.moveTo(len, 0);
  ctx.lineTo(len - 6, 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Stars (background eye-candy that exhibits aberration & beaming) ─
const STARS = [];
(function seedStars() {
  for (let i = 0; i < 220; i++) {
    STARS.push({
      x: Math.random() * 4000, y: Math.random() * 4000,
      mag: 0.3 + Math.random() * 0.7,
    });
  }
})();

function drawStars() {
  const ship = state.ship;
  const [vx, vy] = pToV(ship.px, ship.py);
  const beta = Math.hypot(vx, vy) / C;
  const gamma = 1 / Math.sqrt(Math.max(1e-12, 1 - beta * beta));
  ctx.save();
  ctx.translate(W / 2, H / 2);
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const ang = (i / STARS.length) * Math.PI * 2 + s.x * 0.0001;
    const r0 = 380 + (s.y % 220);
    const dx = Math.cos(ang) * r0;
    const dy = Math.sin(ang) * r0;
    if (state.view === 'ship' && beta > 1e-4 && state.fx.aberr) {
      const ux = vx / (beta * C), uy = vy / (beta * C);
      const wx = -uy, wy = ux;
      const drx = dx / r0, dry = dy / r0;
      const cosT = drx * ux + dry * uy;
      const sinT = drx * wx + dry * wy;
      const [cAp, sAp] = aberrate(cosT, sinT, beta, gamma);
      const m = Math.hypot(cAp, sAp) || 1;
      const fx = ux * (cAp / m) + wx * (sAp / m);
      const fy = uy * (cAp / m) + wy * (sAp / m);
      const D = state.fx.doppler ? dopplerFactor(cosT, beta, gamma) : 1;
      const beam = state.fx.beam ? clamp(D * D, 0.05, 5) : 1;
      const r = r0 * 0.95;
      ctx.globalAlpha = clamp(s.mag * beam * 0.35, 0, 1);
      ctx.fillStyle = state.fx.doppler ? dopplerColor(D) : cssVar('--text');
      ctx.fillRect(fx * r, fy * r, 1.4, 1.4);
    } else {
      ctx.globalAlpha = s.mag * 0.25;
      ctx.fillStyle = cssVar('--text');
      ctx.fillRect(dx, dy, 1.4, 1.4);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── HUD ──────────────────────────────────────────────────────────────
function updateHud() {
  $('hud-score').textContent = state.score.toString().padStart(6, '0');
  $('hud-level').textContent = state.level;
  $('hud-lives').textContent = '◆'.repeat(Math.max(0, state.lives));
}

function drawHudOverlay() {
  const ship = state.ship;
  const [vx, vy] = pToV(ship.px, ship.py);
  const sp = Math.hypot(vx, vy);
  const beta = sp / C;
  const gamma = 1 / Math.sqrt(Math.max(1e-12, 1 - beta * beta));
  $('stat-beta').textContent  = beta.toFixed(4);
  $('stat-gamma').textContent = gamma >= 100 ? gamma.toFixed(0) : gamma.toFixed(3);
  $('stat-prop').textContent  = ship.propTime.toFixed(2);
  $('stat-lab').textContent   = state.t.toFixed(2);
  $('stat-dilation').textContent = gamma.toFixed(3) + '×';
}

// ─── Overlay panel ───────────────────────────────────────────────────
function showOverlay() {
  $('overlay-title').textContent = state.gameOver ? 'Game over' : 'Paused';
  const sub = $('overlay-sub');
  while (sub.firstChild) sub.removeChild(sub.firstChild);
  if (state.gameOver) {
    sub.appendChild(document.createTextNode('Final score '));
    const a = document.createElement('b'); a.textContent = state.score; sub.appendChild(a);
    sub.appendChild(document.createTextNode(' · Level '));
    const b = document.createElement('b'); b.textContent = state.level; sub.appendChild(b);
    sub.appendChild(document.createElement('br'));
    sub.appendChild(document.createTextNode('Proper time: '));
    const c = document.createElement('b'); c.textContent = state.ship.propTime.toFixed(2) + 's'; sub.appendChild(c);
    sub.appendChild(document.createTextNode(' · Lab time: '));
    const d = document.createElement('b'); d.textContent = state.t.toFixed(2) + 's'; sub.appendChild(d);
  } else {
    sub.appendChild(document.createTextNode('Press P to resume'));
  }
  $('overlay-action').textContent = state.gameOver ? 'New game' : 'Resume';
  $('overlay').hidden = false;
}
function hideOverlay() { $('overlay').hidden = true; }

// ─── Input ───────────────────────────────────────────────────────────
function bindInput() {
  const map = {
    ArrowLeft:  'left',  KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp:    'thrust',KeyW: 'thrust',
    ArrowDown:  'brake', KeyS: 'brake',
    Space:      'fire',
  };
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    const k = map[e.code];
    if (k) { state.input[k] = true; e.preventDefault(); return; }
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyR') { resetGame(); hideOverlay(); }
    if (e.code === 'KeyV') {
      state.view = (state.view === 'ship') ? 'lab' : 'ship';
      $('view-btn').textContent = state.view === 'ship' ? 'Ship frame' : 'Lab frame';
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = map[e.code];
    if (k) { state.input[k] = false; e.preventDefault(); }
  });
}

function togglePause() {
  if (state.gameOver) return;
  state.paused = !state.paused;
  if (state.paused) showOverlay(); else hideOverlay();
  $('play-btn').setAttribute('aria-label', state.paused ? 'Play' : 'Pause');
  $('play-btn').setAttribute('title', state.paused ? 'Play' : 'Pause');
}

// ─── Main loop ───────────────────────────────────────────────────────
let lastT = 0;
function loop(ts) {
  if (!lastT) lastT = ts;
  let dt = (ts - lastT) / 1000;
  lastT = ts;
  if (dt > 0.1) dt = 0.1;
  step(dt);
  drawScene();
  requestAnimationFrame(loop);
}

// ─── Wire UI ─────────────────────────────────────────────────────────
function wireUI() {
  $('play-btn').addEventListener('click', togglePause);
  $('reset-btn').addEventListener('click', () => { resetGame(); hideOverlay(); });
  $('view-btn').addEventListener('click', () => {
    state.view = (state.view === 'ship') ? 'lab' : 'ship';
    $('view-btn').textContent = state.view === 'ship' ? 'Ship frame' : 'Lab frame';
  });
  $('overlay-action').addEventListener('click', () => {
    if (state.gameOver) resetGame();
    else state.paused = false;
    hideOverlay();
  });
  for (const k of ['aberr', 'contract', 'doppler', 'lightcone', 'beam']) {
    const cb = $('fx-' + k);
    cb.checked = state.fx[k];
    cb.addEventListener('change', () => { state.fx[k] = cb.checked; });
  }
  bindTouch();
}

function bindTouch() {
  const bindHold = (id, key) => {
    const el = $(id);
    if (!el) return;
    const on  = (e) => { state.input[key] = true;  e.preventDefault(); };
    const off = (e) => { state.input[key] = false; e.preventDefault(); };
    el.addEventListener('pointerdown',   on);
    el.addEventListener('pointerup',     off);
    el.addEventListener('pointerleave',  off);
    el.addEventListener('pointercancel', off);
  };
  bindHold('touch-left',   'left');
  bindHold('touch-right',  'right');
  bindHold('touch-thrust', 'thrust');
  bindHold('touch-fire',   'fire');
}

// ─── Init ────────────────────────────────────────────────────────────
function init() {
  resize();
  window.addEventListener('resize', resize);
  bindInput();
  wireUI();
  resetGame();
  updateHud();
  requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', init);
