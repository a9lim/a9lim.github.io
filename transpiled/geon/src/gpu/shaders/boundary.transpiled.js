// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/boundary.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: a61be597cef9f9573eec4c68ec6a6015bc79adb45e0bc43eb3311ba9e7a07169
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":81693,"lines":1332,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":24,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.655Z
export default function _wgsl_module(rt) {
    const SOFTENING = 8.0;
    const SOFTENING_SQ = 64.0;
    const BH_SOFTENING = 4.0;
    const BH_SOFTENING_SQ = 16.0;
    const INERTIA_K = 0.4;
    const MAG_MOMENT_K = 0.2;
    const TIDAL_STRENGTH = 64.0;
    const YUKAWA_COUPLING = 14.0;
    const AXION_COUPLING = 0.05;
    const HIGGS_AXION_COUPLING = 0.01;
    const HIGGS_MASS_FLOOR = 0.05;
    const EPSILON = 0.000001;
    const PI = 3.14159265358979;
    const TWO_PI = 6.28318530717959;
    const HALF_PI = 1.5707963268;
    const BOSON_SOFTENING_SQ = 4.0;
    const BOSON_MIN_AGE = 4;
    const BOSON_MIN_AGE_TIME = 0.03125;
    const MAX_QUAD_WG = 8;
    const PHYSICS_DT = 0.0078125;
    const MIN_MASS = 0.05;
    const ELECTRON_MASS = 0.01;
    const BOSON_CHARGE = 0.1;
    const SCHWINGER_E_CR = ((ELECTRON_MASS * ELECTRON_MASS) / BOSON_CHARGE);
    const SCHWINGER_COEFF = ((BOSON_CHARGE * BOSON_CHARGE) / ((PI * PI)));
    const MAX_SPEED_RATIO = 0.999;
    const PION_DECAY_PROB = 0.0001692110680708847;
    const CHARGED_PION_DECAY_PROB = 0.00008460911338648014;
    const BH_THETA = 0.5;
    const BH_THETA_SQ = 0.25;
    const VELOCITY_VECTOR_SCALE = 32.0;
    const MAX_PARTICLES = 512;
    const MAX_PHOTONS = 4096;
    const MAX_PIONS = 1024;
    const MAX_LEPTONS = 1024;
    const LEPTON_LIFETIME = 512.0;
    const PION_POOL_CAP = 2048;
    const MAX_GHOSTS = 512;
    const PHOTON_LIFETIME = 256.0;
    const MAX_REJECTION_SAMPLES = 32;
    const SPAWN_OFFSET_MUL = 1.5;
    const SPAWN_OFFSET_FLOOR = 1.0;
    const ABERRATION_THRESHOLD = 1.001;
    const ABERRATION_CLAMP_MIN = 0.01;
    const ABERRATION_CLAMP_MAX = 100.0;
    const GRID = 128;
    const GRID_SQ = 16384;
    const GRID_LAST = 127;
    const SCALAR_FIELD_MAX = 2.0;
    const FIELD_EXCITATION_SIGMA = 2.0;
    const SELFGRAV_PHI_MAX = 0.25;
    const HGRID = 128;
    const HGRID_SQ = 16384;
    const HISTORY_LEN = 256;
    const HISTORY_MASK = 255;
    const HIST_STRIDE = 6;
    const HIST_META_STRIDE = 4;
    const TRAIL_LEN = 256;
    const BOUND_DESPAWN = 0;
    const BOUND_BOUNCE = 1;
    const BOUND_LOOP = 2;
    const TOPO_TORUS = 0;
    const TOPO_KLEIN = 1;
    const TOPO_RP2 = 2;
    const TORUS = 0;
    const KLEIN = 1;
    const RP2 = 2;
    const COL_PASS = 0;
    const COL_MERGE = 1;
    const COL_BOUNCE = 2;
    const FLAG_ALIVE = 1;
    const FLAG_RETIRED = 2;
    const FLAG_ANTIMATTER = 4;
    const FLAG_BH = 8;
    const FLAG_GHOST = 16;
    const FLAG_REBORN = 32;
    const FLAG_DEATH_HIST = 64;
    const GRAVITY_BIT = 1;
    const COULOMB_BIT = 2;
    const MAGNETIC_BIT = 4;
    const GRAVITOMAG_BIT = 8;
    const ONE_PN_BIT = 16;
    const RELATIVITY_BIT = 32;
    const SPIN_ORBIT_BIT = 64;
    const RADIATION_BIT = 128;
    const BLACK_HOLE_BIT = 256;
    const DISINTEGRATION_BIT = 512;
    const EXPANSION_BIT = 1024;
    const YUKAWA_BIT = 2048;
    const HIGGS_BIT = 4096;
    const AXION_BIT = 8192;
    const BARNES_HUT_BIT = 16384;
    const BOSON_INTER_BIT = 32768;
    const FIELD_GRAV_BIT = 1;
    const HERTZ_BOUNCE_BIT = 2;
    const MAX_DEPTH = 48;
    const QT_MAX_NODES = 3072;
    const DESPAWN_MARGIN = 64.0;
    const MAX_DISINT_EVENTS = 64;
    const MIN_KUGELBLITZ_ENERGY = 0.2;
    const MIN_KUGELBLITZ_COUNT = 4;
    const COLOR_SLATE = {x:0.5019607843137255, y:0.5254901960784314, z:0.5882352941176471};
    const COLOR_RED = {x:0.8549019607843137, y:0.3254901960784314, z:0.30980392156862746};
    const COLOR_BLUE = {x:0.0, y:0.5686274509803921, z:0.788235294117647};
    const COLOR_GREEN = {x:0.0, y:0.6235294117647059, z:0.40784313725490196};
    const COLOR_CYAN = {x:0.0, y:0.6039215686274509, z:0.6039215686274509};
    const COLOR_ORANGE = {x:0.792156862745098, y:0.40784313725490196, z:0.0};
    const COLOR_YELLOW = {x:0.6, y:0.5294117647058824, z:0.0};
    const COLOR_ROSE = {x:0.8274509803921568, y:0.3176470588235294, z:0.5098039215686274};
    const COLOR_PURPLE = {x:0.592156862745098, y:0.4117647058823529, z:0.8627450980392157};
    const COLOR_BROWN = {x:0.7254901960784313, y:0.4588235294117647, z:0.0};
    const COLOR_LIME = {x:0.26666666666666666, y:0.615686274509804, z:0.1803921568627451};
    const COLOR_INDIGO = {x:0.4196078431372549, y:0.4745098039215686, z:0.9176470588235294};
    const COLOR_MAGENTA = {x:0.7411764705882353, y:0.35294117647058826, z:0.7137254901960784};
    const COLOR_TEXT_LIGHT = {x:0.00392156862745098, y:0.00784313725490196, z:0.011764705882352941};
    const COLOR_TEXT_DARK = {x:0.9568627450980393, y:0.9607843137254902, z:0.9764705882352941};
    const COLOR_ACCENT = {x:0.8823529411764706, y:0.06666666666666667, z:0.027450980392156862};
    const COLOR_ACCENT_LIGHT = {x:0.9137254901960784, y:0.3176470588235294, z:0.25882352941176473};
    const COLOR_SPIN_CW = {x:0.92, y:0.2799999999999999, z:0.0};
    const COLOR_SPIN_CCW = {x:0.92, y:0.2799999999999999, z:0.0};
    const NODE_STRIDE = 20;

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_dt = _b_uniforms.dt;
        const _u_uniforms_simTime = _b_uniforms.simTime;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_toggles0 = _b_uniforms.toggles0;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_aliveCount = _b_uniforms.aliveCount;
        const _u_uniforms_bounceFriction = _b_uniforms.bounceFriction;
        const _b_particleState = bindings.particleState;
        const _b_particleAux = bindings.particleAux;
        const _b_allForces = bindings.allForces;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        if (Gy === 1 && Gz === 1) {
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                __invocation: {
                    const idx = gid_x;
                    if ((idx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    const _sroa_0_base = ((idx) * 9);
                    let ps_posX = _b_particleState[_sroa_0_base + 0];
                    let ps_posY = _b_particleState[_sroa_0_base + 1];
                    let ps_velWX = _b_particleState[_sroa_0_base + 2];
                    let ps_velWY = _b_particleState[_sroa_0_base + 3];
                    let ps_mass = _b_particleState[_sroa_0_base + 4];
                    let ps_charge = _b_particleState[_sroa_0_base + 5];
                    let ps_angW = _b_particleState[_sroa_0_base + 6];
                    let ps_baseMass = _b_particleState[_sroa_0_base + 7];
                    let ps_flags = _b_particleState[_sroa_0_base + 8];
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    let x = ps_posX;
                    let y = ps_posY;
                    const w = _u_uniforms_domainW;
                    const h = _u_uniforms_domainH;
                    if ((_u_uniforms_boundaryMode == BOUND_LOOP)) {
                        const topo = _u_uniforms_topologyMode;
                        if ((topo == TOPO_TORUS)) {
                            if ((x < 0.0)) {
                                x = (x + w);
                            } else if ((x >= w)) {
                                x = (x - w);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                            } else if ((y >= h)) {
                                y = (y - h);
                            }
                            ps_posX = x;
                            ps_posY = y;
                        } else if ((topo == TOPO_KLEIN)) {
                            if ((x < 0.0)) {
                                x = (x + w);
                            } else if ((x >= w)) {
                                x = (x - w);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                                x = (w - x);
                                ps_velWX = (-ps_velWX);
                                ps_angW = (-ps_angW);
                            } else if ((y >= h)) {
                                y = (y - h);
                                x = (w - x);
                                ps_velWX = (-ps_velWX);
                                ps_angW = (-ps_angW);
                            }
                            ps_posX = x;
                            ps_posY = y;
                        } else {
                            let vx = ps_velWX;
                            let vy = ps_velWY;
                            let aw = ps_angW;
                            if ((x < 0.0)) {
                                x = (x + w);
                                y = (h - y);
                                vy = (-vy);
                                aw = (-aw);
                            } else if ((x >= w)) {
                                x = (x - w);
                                y = (h - y);
                                vy = (-vy);
                                aw = (-aw);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                                x = (w - x);
                                vx = (-vx);
                                aw = (-aw);
                            } else if ((y >= h)) {
                                y = (y - h);
                                x = (w - x);
                                vx = (-vx);
                                aw = (-aw);
                            }
                            ps_posX = x;
                            ps_posY = y;
                            ps_velWX = vx;
                            ps_velWY = vy;
                            ps_angW = aw;
                        }
                    } else if ((_u_uniforms_boundaryMode == BOUND_BOUNCE)) {
                        const r = _b_particleAux[((idx) * 5 + 0)];
                        const friction = _u_uniforms_bounceFriction;
                        const dt = _u_uniforms_dt;
                        const m = ps_mass;
                        const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                        const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                        const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                        const vx = (ps_velWX * invGamma);
                        const vy = (ps_velWY * invGamma);
                        const sr = (ps_angW * r);
                        const av = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                        const invM = ((m > EPSILON) ? (1.0 / m) : 0.0);
                        const I = (((INERTIA_K * m) * r) * r);
                        let extFx = 0.0;
                        let extFy = 0.0;
                        let contactTorque = 0.0;
                        let delta = (r - x);
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFx = (extFx + Fn);
                            if ((friction > 0.0)) {
                                const vt = (vy + (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFy = (extFy + Ft);
                                contactTorque = (contactTorque + (r * Ft));
                            }
                        }
                        delta = (r - ((w - x)));
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFx = (extFx - Fn);
                            if ((friction > 0.0)) {
                                const vt = ((-vy) - (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFy = (extFy - Ft);
                                contactTorque = (contactTorque - (r * Ft));
                            }
                        }
                        delta = (r - y);
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFy = (extFy + Fn);
                            if ((friction > 0.0)) {
                                const vt = ((-vx) + (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFx = (extFx - Ft);
                                contactTorque = (contactTorque + (r * Ft));
                            }
                        }
                        delta = (r - ((h - y)));
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFy = (extFy - Fn);
                            if ((friction > 0.0)) {
                                const vt = (vx - (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFx = (extFx + Ft);
                                contactTorque = (contactTorque - (r * Ft));
                            }
                        }
                        ps_velWX = (ps_velWX + ((extFx * dt) * invM));
                        ps_velWY = (ps_velWY + ((extFy * dt) * invM));
                        if (((friction > 0.0) && (I > EPSILON))) {
                            ps_angW = (ps_angW + ((contactTorque * dt) / I));
                        }
                        ps_posX = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(x, 0.0, w));
                        ps_posY = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(y, 0.0, h));
                        if ((((extFx != 0.0) || (extFy != 0.0)) || (contactTorque != 0.0))) {
                            const _sroa_1_base = ((idx) * 40);
                            let af_f0_x = _b_allForces[_sroa_1_base + 0];
                            let af_f0_y = _b_allForces[_sroa_1_base + 1];
                            let af_f0_z = _b_allForces[_sroa_1_base + 2];
                            let af_f0_w = _b_allForces[_sroa_1_base + 3];
                            let af_f1_x = _b_allForces[_sroa_1_base + 4];
                            let af_f1_y = _b_allForces[_sroa_1_base + 5];
                            let af_f1_z = _b_allForces[_sroa_1_base + 6];
                            let af_f1_w = _b_allForces[_sroa_1_base + 7];
                            let af_f2_x = _b_allForces[_sroa_1_base + 8];
                            let af_f2_y = _b_allForces[_sroa_1_base + 9];
                            let af_f2_z = _b_allForces[_sroa_1_base + 10];
                            let af_f2_w = _b_allForces[_sroa_1_base + 11];
                            let af_f3_x = _b_allForces[_sroa_1_base + 12];
                            let af_f3_y = _b_allForces[_sroa_1_base + 13];
                            let af_f3_z = _b_allForces[_sroa_1_base + 14];
                            let af_f3_w = _b_allForces[_sroa_1_base + 15];
                            let af_f4_x = _b_allForces[_sroa_1_base + 16];
                            let af_f4_y = _b_allForces[_sroa_1_base + 17];
                            let af_f4_z = _b_allForces[_sroa_1_base + 18];
                            let af_f4_w = _b_allForces[_sroa_1_base + 19];
                            let af_f5_x = _b_allForces[_sroa_1_base + 20];
                            let af_f5_y = _b_allForces[_sroa_1_base + 21];
                            let af_f5_z = _b_allForces[_sroa_1_base + 22];
                            let af_f5_w = _b_allForces[_sroa_1_base + 23];
                            let af_torques_x = _b_allForces[_sroa_1_base + 24];
                            let af_torques_y = _b_allForces[_sroa_1_base + 25];
                            let af_torques_z = _b_allForces[_sroa_1_base + 26];
                            let af_torques_w = _b_allForces[_sroa_1_base + 27];
                            let af_bFields_x = _b_allForces[_sroa_1_base + 28];
                            let af_bFields_y = _b_allForces[_sroa_1_base + 29];
                            let af_bFields_z = _b_allForces[_sroa_1_base + 30];
                            let af_bFields_w = _b_allForces[_sroa_1_base + 31];
                            let af_bFieldGrads_x = _b_allForces[_sroa_1_base + 32];
                            let af_bFieldGrads_y = _b_allForces[_sroa_1_base + 33];
                            let af_bFieldGrads_z = _b_allForces[_sroa_1_base + 34];
                            let af_bFieldGrads_w = _b_allForces[_sroa_1_base + 35];
                            let af_totalForce_x = _b_allForces[_sroa_1_base + 36];
                            let af_totalForce_y = _b_allForces[_sroa_1_base + 37];
                            let af_jerk_x = _b_allForces[_sroa_1_base + 38];
                            let af_jerk_y = _b_allForces[_sroa_1_base + 39];
                            af_f4_x = (af_f4_x + extFx);
                            af_f4_y = (af_f4_y + extFy);
                            af_totalForce_x = (af_totalForce_x + extFx);
                            af_totalForce_y = (af_totalForce_y + extFy);
                            af_torques_w = (af_torques_w + contactTorque);
                            {
                                const _wbase = ((idx) * 40);
                                _b_allForces[_wbase + 0] = af_f0_x;
                                _b_allForces[_wbase + 1] = af_f0_y;
                                _b_allForces[_wbase + 2] = af_f0_z;
                                _b_allForces[_wbase + 3] = af_f0_w;
                                _b_allForces[_wbase + 4] = af_f1_x;
                                _b_allForces[_wbase + 5] = af_f1_y;
                                _b_allForces[_wbase + 6] = af_f1_z;
                                _b_allForces[_wbase + 7] = af_f1_w;
                                _b_allForces[_wbase + 8] = af_f2_x;
                                _b_allForces[_wbase + 9] = af_f2_y;
                                _b_allForces[_wbase + 10] = af_f2_z;
                                _b_allForces[_wbase + 11] = af_f2_w;
                                _b_allForces[_wbase + 12] = af_f3_x;
                                _b_allForces[_wbase + 13] = af_f3_y;
                                _b_allForces[_wbase + 14] = af_f3_z;
                                _b_allForces[_wbase + 15] = af_f3_w;
                                _b_allForces[_wbase + 16] = af_f4_x;
                                _b_allForces[_wbase + 17] = af_f4_y;
                                _b_allForces[_wbase + 18] = af_f4_z;
                                _b_allForces[_wbase + 19] = af_f4_w;
                                _b_allForces[_wbase + 20] = af_f5_x;
                                _b_allForces[_wbase + 21] = af_f5_y;
                                _b_allForces[_wbase + 22] = af_f5_z;
                                _b_allForces[_wbase + 23] = af_f5_w;
                                _b_allForces[_wbase + 24] = af_torques_x;
                                _b_allForces[_wbase + 25] = af_torques_y;
                                _b_allForces[_wbase + 26] = af_torques_z;
                                _b_allForces[_wbase + 27] = af_torques_w;
                                _b_allForces[_wbase + 28] = af_bFields_x;
                                _b_allForces[_wbase + 29] = af_bFields_y;
                                _b_allForces[_wbase + 30] = af_bFields_z;
                                _b_allForces[_wbase + 31] = af_bFields_w;
                                _b_allForces[_wbase + 32] = af_bFieldGrads_x;
                                _b_allForces[_wbase + 33] = af_bFieldGrads_y;
                                _b_allForces[_wbase + 34] = af_bFieldGrads_z;
                                _b_allForces[_wbase + 35] = af_bFieldGrads_w;
                                _b_allForces[_wbase + 36] = af_totalForce_x;
                                _b_allForces[_wbase + 37] = af_totalForce_y;
                                _b_allForces[_wbase + 38] = af_jerk_x;
                                _b_allForces[_wbase + 39] = af_jerk_y;
                            }
                        }
                    } else {
                        const margin = DESPAWN_MARGIN;
                        if (((((x < (-margin)) || (x >= (w + margin))) || (y < (-margin))) || (y >= (h + margin)))) {
                            const _sroa_2_base = ((idx) * 5);
                            let aux_radius = _b_particleAux[_sroa_2_base + 0];
                            let aux_particleId = _b_particleAux[_sroa_2_base + 1];
                            let aux_deathTime = _b_particleAux[_sroa_2_base + 2];
                            let aux_deathMass = _b_particleAux[_sroa_2_base + 3];
                            let aux_deathAngVel = _b_particleAux[_sroa_2_base + 4];
                            aux_deathTime = _u_uniforms_simTime;
                            aux_deathMass = ps_mass;
                            const r = aux_radius;
                            const sr = (ps_angW * r);
                            const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                            aux_deathAngVel = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                            {
                                const _wbase = ((idx) * 5);
                                _b_particleAux[_wbase + 0] = aux_radius;
                                _b_particleAux[_wbase + 1] = aux_particleId;
                                _b_particleAux[_wbase + 2] = aux_deathTime;
                                _b_particleAux[_wbase + 3] = aux_deathMass;
                                _b_particleAux[_wbase + 4] = aux_deathAngVel;
                            }
                            ps_flags = (((ps_flags & (~FLAG_ALIVE))) | FLAG_RETIRED);
                        }
                    }
                    {
                        const _wbase = ((idx) * 9);
                        _b_particleState[_wbase + 0] = ps_posX;
                        _b_particleState[_wbase + 1] = ps_posY;
                        _b_particleState[_wbase + 2] = ps_velWX;
                        _b_particleState[_wbase + 3] = ps_velWY;
                        _b_particleState[_wbase + 4] = ps_mass;
                        _b_particleState[_wbase + 5] = ps_charge;
                        _b_particleState[_wbase + 6] = ps_angW;
                        _b_particleState[_wbase + 7] = ps_baseMass;
                        _b_particleState[_wbase + 8] = ps_flags;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const idx = gid_x;
                            if ((idx >= _u_uniforms_aliveCount)) {
                                break __invocation;
                            }
                            const _sroa_3_base = ((idx) * 9);
                            let ps_posX = _b_particleState[_sroa_3_base + 0];
                            let ps_posY = _b_particleState[_sroa_3_base + 1];
                            let ps_velWX = _b_particleState[_sroa_3_base + 2];
                            let ps_velWY = _b_particleState[_sroa_3_base + 3];
                            let ps_mass = _b_particleState[_sroa_3_base + 4];
                            let ps_charge = _b_particleState[_sroa_3_base + 5];
                            let ps_angW = _b_particleState[_sroa_3_base + 6];
                            let ps_baseMass = _b_particleState[_sroa_3_base + 7];
                            let ps_flags = _b_particleState[_sroa_3_base + 8];
                            if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            let x = ps_posX;
                            let y = ps_posY;
                            const w = _u_uniforms_domainW;
                            const h = _u_uniforms_domainH;
                            if ((_u_uniforms_boundaryMode == BOUND_LOOP)) {
                                const topo = _u_uniforms_topologyMode;
                                if ((topo == TOPO_TORUS)) {
                                    if ((x < 0.0)) {
                                        x = (x + w);
                                    } else if ((x >= w)) {
                                        x = (x - w);
                                    }
                                    if ((y < 0.0)) {
                                        y = (y + h);
                                    } else if ((y >= h)) {
                                        y = (y - h);
                                    }
                                    ps_posX = x;
                                    ps_posY = y;
                                } else if ((topo == TOPO_KLEIN)) {
                                    if ((x < 0.0)) {
                                        x = (x + w);
                                    } else if ((x >= w)) {
                                        x = (x - w);
                                    }
                                    if ((y < 0.0)) {
                                        y = (y + h);
                                        x = (w - x);
                                        ps_velWX = (-ps_velWX);
                                        ps_angW = (-ps_angW);
                                    } else if ((y >= h)) {
                                        y = (y - h);
                                        x = (w - x);
                                        ps_velWX = (-ps_velWX);
                                        ps_angW = (-ps_angW);
                                    }
                                    ps_posX = x;
                                    ps_posY = y;
                                } else {
                                    let vx = ps_velWX;
                                    let vy = ps_velWY;
                                    let aw = ps_angW;
                                    if ((x < 0.0)) {
                                        x = (x + w);
                                        y = (h - y);
                                        vy = (-vy);
                                        aw = (-aw);
                                    } else if ((x >= w)) {
                                        x = (x - w);
                                        y = (h - y);
                                        vy = (-vy);
                                        aw = (-aw);
                                    }
                                    if ((y < 0.0)) {
                                        y = (y + h);
                                        x = (w - x);
                                        vx = (-vx);
                                        aw = (-aw);
                                    } else if ((y >= h)) {
                                        y = (y - h);
                                        x = (w - x);
                                        vx = (-vx);
                                        aw = (-aw);
                                    }
                                    ps_posX = x;
                                    ps_posY = y;
                                    ps_velWX = vx;
                                    ps_velWY = vy;
                                    ps_angW = aw;
                                }
                            } else if ((_u_uniforms_boundaryMode == BOUND_BOUNCE)) {
                                const r = _b_particleAux[((idx) * 5 + 0)];
                                const friction = _u_uniforms_bounceFriction;
                                const dt = _u_uniforms_dt;
                                const m = ps_mass;
                                const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                                const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                                const vx = (ps_velWX * invGamma);
                                const vy = (ps_velWY * invGamma);
                                const sr = (ps_angW * r);
                                const av = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                                const invM = ((m > EPSILON) ? (1.0 / m) : 0.0);
                                const I = (((INERTIA_K * m) * r) * r);
                                let extFx = 0.0;
                                let extFy = 0.0;
                                let contactTorque = 0.0;
                                let delta = (r - x);
                                if ((delta > 0.0)) {
                                    const Fn = (delta * Math.sqrt(delta));
                                    extFx = (extFx + Fn);
                                    if ((friction > 0.0)) {
                                        const vt = (vy + (av * r));
                                        const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                        extFy = (extFy + Ft);
                                        contactTorque = (contactTorque + (r * Ft));
                                    }
                                }
                                delta = (r - ((w - x)));
                                if ((delta > 0.0)) {
                                    const Fn = (delta * Math.sqrt(delta));
                                    extFx = (extFx - Fn);
                                    if ((friction > 0.0)) {
                                        const vt = ((-vy) - (av * r));
                                        const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                        extFy = (extFy - Ft);
                                        contactTorque = (contactTorque - (r * Ft));
                                    }
                                }
                                delta = (r - y);
                                if ((delta > 0.0)) {
                                    const Fn = (delta * Math.sqrt(delta));
                                    extFy = (extFy + Fn);
                                    if ((friction > 0.0)) {
                                        const vt = ((-vx) + (av * r));
                                        const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                        extFx = (extFx - Ft);
                                        contactTorque = (contactTorque + (r * Ft));
                                    }
                                }
                                delta = (r - ((h - y)));
                                if ((delta > 0.0)) {
                                    const Fn = (delta * Math.sqrt(delta));
                                    extFy = (extFy - Fn);
                                    if ((friction > 0.0)) {
                                        const vt = (vx - (av * r));
                                        const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                        extFx = (extFx + Ft);
                                        contactTorque = (contactTorque - (r * Ft));
                                    }
                                }
                                ps_velWX = (ps_velWX + ((extFx * dt) * invM));
                                ps_velWY = (ps_velWY + ((extFy * dt) * invM));
                                if (((friction > 0.0) && (I > EPSILON))) {
                                    ps_angW = (ps_angW + ((contactTorque * dt) / I));
                                }
                                ps_posX = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(x, 0.0, w));
                                ps_posY = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(y, 0.0, h));
                                if ((((extFx != 0.0) || (extFy != 0.0)) || (contactTorque != 0.0))) {
                                    const _sroa_4_base = ((idx) * 40);
                                    let af_f0_x = _b_allForces[_sroa_4_base + 0];
                                    let af_f0_y = _b_allForces[_sroa_4_base + 1];
                                    let af_f0_z = _b_allForces[_sroa_4_base + 2];
                                    let af_f0_w = _b_allForces[_sroa_4_base + 3];
                                    let af_f1_x = _b_allForces[_sroa_4_base + 4];
                                    let af_f1_y = _b_allForces[_sroa_4_base + 5];
                                    let af_f1_z = _b_allForces[_sroa_4_base + 6];
                                    let af_f1_w = _b_allForces[_sroa_4_base + 7];
                                    let af_f2_x = _b_allForces[_sroa_4_base + 8];
                                    let af_f2_y = _b_allForces[_sroa_4_base + 9];
                                    let af_f2_z = _b_allForces[_sroa_4_base + 10];
                                    let af_f2_w = _b_allForces[_sroa_4_base + 11];
                                    let af_f3_x = _b_allForces[_sroa_4_base + 12];
                                    let af_f3_y = _b_allForces[_sroa_4_base + 13];
                                    let af_f3_z = _b_allForces[_sroa_4_base + 14];
                                    let af_f3_w = _b_allForces[_sroa_4_base + 15];
                                    let af_f4_x = _b_allForces[_sroa_4_base + 16];
                                    let af_f4_y = _b_allForces[_sroa_4_base + 17];
                                    let af_f4_z = _b_allForces[_sroa_4_base + 18];
                                    let af_f4_w = _b_allForces[_sroa_4_base + 19];
                                    let af_f5_x = _b_allForces[_sroa_4_base + 20];
                                    let af_f5_y = _b_allForces[_sroa_4_base + 21];
                                    let af_f5_z = _b_allForces[_sroa_4_base + 22];
                                    let af_f5_w = _b_allForces[_sroa_4_base + 23];
                                    let af_torques_x = _b_allForces[_sroa_4_base + 24];
                                    let af_torques_y = _b_allForces[_sroa_4_base + 25];
                                    let af_torques_z = _b_allForces[_sroa_4_base + 26];
                                    let af_torques_w = _b_allForces[_sroa_4_base + 27];
                                    let af_bFields_x = _b_allForces[_sroa_4_base + 28];
                                    let af_bFields_y = _b_allForces[_sroa_4_base + 29];
                                    let af_bFields_z = _b_allForces[_sroa_4_base + 30];
                                    let af_bFields_w = _b_allForces[_sroa_4_base + 31];
                                    let af_bFieldGrads_x = _b_allForces[_sroa_4_base + 32];
                                    let af_bFieldGrads_y = _b_allForces[_sroa_4_base + 33];
                                    let af_bFieldGrads_z = _b_allForces[_sroa_4_base + 34];
                                    let af_bFieldGrads_w = _b_allForces[_sroa_4_base + 35];
                                    let af_totalForce_x = _b_allForces[_sroa_4_base + 36];
                                    let af_totalForce_y = _b_allForces[_sroa_4_base + 37];
                                    let af_jerk_x = _b_allForces[_sroa_4_base + 38];
                                    let af_jerk_y = _b_allForces[_sroa_4_base + 39];
                                    af_f4_x = (af_f4_x + extFx);
                                    af_f4_y = (af_f4_y + extFy);
                                    af_totalForce_x = (af_totalForce_x + extFx);
                                    af_totalForce_y = (af_totalForce_y + extFy);
                                    af_torques_w = (af_torques_w + contactTorque);
                                    {
                                        const _wbase = ((idx) * 40);
                                        _b_allForces[_wbase + 0] = af_f0_x;
                                        _b_allForces[_wbase + 1] = af_f0_y;
                                        _b_allForces[_wbase + 2] = af_f0_z;
                                        _b_allForces[_wbase + 3] = af_f0_w;
                                        _b_allForces[_wbase + 4] = af_f1_x;
                                        _b_allForces[_wbase + 5] = af_f1_y;
                                        _b_allForces[_wbase + 6] = af_f1_z;
                                        _b_allForces[_wbase + 7] = af_f1_w;
                                        _b_allForces[_wbase + 8] = af_f2_x;
                                        _b_allForces[_wbase + 9] = af_f2_y;
                                        _b_allForces[_wbase + 10] = af_f2_z;
                                        _b_allForces[_wbase + 11] = af_f2_w;
                                        _b_allForces[_wbase + 12] = af_f3_x;
                                        _b_allForces[_wbase + 13] = af_f3_y;
                                        _b_allForces[_wbase + 14] = af_f3_z;
                                        _b_allForces[_wbase + 15] = af_f3_w;
                                        _b_allForces[_wbase + 16] = af_f4_x;
                                        _b_allForces[_wbase + 17] = af_f4_y;
                                        _b_allForces[_wbase + 18] = af_f4_z;
                                        _b_allForces[_wbase + 19] = af_f4_w;
                                        _b_allForces[_wbase + 20] = af_f5_x;
                                        _b_allForces[_wbase + 21] = af_f5_y;
                                        _b_allForces[_wbase + 22] = af_f5_z;
                                        _b_allForces[_wbase + 23] = af_f5_w;
                                        _b_allForces[_wbase + 24] = af_torques_x;
                                        _b_allForces[_wbase + 25] = af_torques_y;
                                        _b_allForces[_wbase + 26] = af_torques_z;
                                        _b_allForces[_wbase + 27] = af_torques_w;
                                        _b_allForces[_wbase + 28] = af_bFields_x;
                                        _b_allForces[_wbase + 29] = af_bFields_y;
                                        _b_allForces[_wbase + 30] = af_bFields_z;
                                        _b_allForces[_wbase + 31] = af_bFields_w;
                                        _b_allForces[_wbase + 32] = af_bFieldGrads_x;
                                        _b_allForces[_wbase + 33] = af_bFieldGrads_y;
                                        _b_allForces[_wbase + 34] = af_bFieldGrads_z;
                                        _b_allForces[_wbase + 35] = af_bFieldGrads_w;
                                        _b_allForces[_wbase + 36] = af_totalForce_x;
                                        _b_allForces[_wbase + 37] = af_totalForce_y;
                                        _b_allForces[_wbase + 38] = af_jerk_x;
                                        _b_allForces[_wbase + 39] = af_jerk_y;
                                    }
                                }
                            } else {
                                const margin = DESPAWN_MARGIN;
                                if (((((x < (-margin)) || (x >= (w + margin))) || (y < (-margin))) || (y >= (h + margin)))) {
                                    const _sroa_5_base = ((idx) * 5);
                                    let aux_radius = _b_particleAux[_sroa_5_base + 0];
                                    let aux_particleId = _b_particleAux[_sroa_5_base + 1];
                                    let aux_deathTime = _b_particleAux[_sroa_5_base + 2];
                                    let aux_deathMass = _b_particleAux[_sroa_5_base + 3];
                                    let aux_deathAngVel = _b_particleAux[_sroa_5_base + 4];
                                    aux_deathTime = _u_uniforms_simTime;
                                    aux_deathMass = ps_mass;
                                    const r = aux_radius;
                                    const sr = (ps_angW * r);
                                    const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                    aux_deathAngVel = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                                    {
                                        const _wbase = ((idx) * 5);
                                        _b_particleAux[_wbase + 0] = aux_radius;
                                        _b_particleAux[_wbase + 1] = aux_particleId;
                                        _b_particleAux[_wbase + 2] = aux_deathTime;
                                        _b_particleAux[_wbase + 3] = aux_deathMass;
                                        _b_particleAux[_wbase + 4] = aux_deathAngVel;
                                    }
                                    ps_flags = (((ps_flags & (~FLAG_ALIVE))) | FLAG_RETIRED);
                                }
                            }
                            {
                                const _wbase = ((idx) * 9);
                                _b_particleState[_wbase + 0] = ps_posX;
                                _b_particleState[_wbase + 1] = ps_posY;
                                _b_particleState[_wbase + 2] = ps_velWX;
                                _b_particleState[_wbase + 3] = ps_velWY;
                                _b_particleState[_wbase + 4] = ps_mass;
                                _b_particleState[_wbase + 5] = ps_charge;
                                _b_particleState[_wbase + 6] = ps_angW;
                                _b_particleState[_wbase + 7] = ps_baseMass;
                                _b_particleState[_wbase + 8] = ps_flags;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const idx = gid_x;
                        if ((idx >= _u_uniforms_aliveCount)) {
                            break __invocation;
                        }
                        const _sroa_6_base = ((idx) * 9);
                        let ps_posX = _b_particleState[_sroa_6_base + 0];
                        let ps_posY = _b_particleState[_sroa_6_base + 1];
                        let ps_velWX = _b_particleState[_sroa_6_base + 2];
                        let ps_velWY = _b_particleState[_sroa_6_base + 3];
                        let ps_mass = _b_particleState[_sroa_6_base + 4];
                        let ps_charge = _b_particleState[_sroa_6_base + 5];
                        let ps_angW = _b_particleState[_sroa_6_base + 6];
                        let ps_baseMass = _b_particleState[_sroa_6_base + 7];
                        let ps_flags = _b_particleState[_sroa_6_base + 8];
                        if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        let x = ps_posX;
                        let y = ps_posY;
                        const w = _u_uniforms_domainW;
                        const h = _u_uniforms_domainH;
                        if ((_u_uniforms_boundaryMode == BOUND_LOOP)) {
                            const topo = _u_uniforms_topologyMode;
                            if ((topo == TOPO_TORUS)) {
                                if ((x < 0.0)) {
                                    x = (x + w);
                                } else if ((x >= w)) {
                                    x = (x - w);
                                }
                                if ((y < 0.0)) {
                                    y = (y + h);
                                } else if ((y >= h)) {
                                    y = (y - h);
                                }
                                ps_posX = x;
                                ps_posY = y;
                            } else if ((topo == TOPO_KLEIN)) {
                                if ((x < 0.0)) {
                                    x = (x + w);
                                } else if ((x >= w)) {
                                    x = (x - w);
                                }
                                if ((y < 0.0)) {
                                    y = (y + h);
                                    x = (w - x);
                                    ps_velWX = (-ps_velWX);
                                    ps_angW = (-ps_angW);
                                } else if ((y >= h)) {
                                    y = (y - h);
                                    x = (w - x);
                                    ps_velWX = (-ps_velWX);
                                    ps_angW = (-ps_angW);
                                }
                                ps_posX = x;
                                ps_posY = y;
                            } else {
                                let vx = ps_velWX;
                                let vy = ps_velWY;
                                let aw = ps_angW;
                                if ((x < 0.0)) {
                                    x = (x + w);
                                    y = (h - y);
                                    vy = (-vy);
                                    aw = (-aw);
                                } else if ((x >= w)) {
                                    x = (x - w);
                                    y = (h - y);
                                    vy = (-vy);
                                    aw = (-aw);
                                }
                                if ((y < 0.0)) {
                                    y = (y + h);
                                    x = (w - x);
                                    vx = (-vx);
                                    aw = (-aw);
                                } else if ((y >= h)) {
                                    y = (y - h);
                                    x = (w - x);
                                    vx = (-vx);
                                    aw = (-aw);
                                }
                                ps_posX = x;
                                ps_posY = y;
                                ps_velWX = vx;
                                ps_velWY = vy;
                                ps_angW = aw;
                            }
                        } else if ((_u_uniforms_boundaryMode == BOUND_BOUNCE)) {
                            const r = _b_particleAux[((idx) * 5 + 0)];
                            const friction = _u_uniforms_bounceFriction;
                            const dt = _u_uniforms_dt;
                            const m = ps_mass;
                            const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                            const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                            const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                            const vx = (ps_velWX * invGamma);
                            const vy = (ps_velWY * invGamma);
                            const sr = (ps_angW * r);
                            const av = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                            const invM = ((m > EPSILON) ? (1.0 / m) : 0.0);
                            const I = (((INERTIA_K * m) * r) * r);
                            let extFx = 0.0;
                            let extFy = 0.0;
                            let contactTorque = 0.0;
                            let delta = (r - x);
                            if ((delta > 0.0)) {
                                const Fn = (delta * Math.sqrt(delta));
                                extFx = (extFx + Fn);
                                if ((friction > 0.0)) {
                                    const vt = (vy + (av * r));
                                    const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                    extFy = (extFy + Ft);
                                    contactTorque = (contactTorque + (r * Ft));
                                }
                            }
                            delta = (r - ((w - x)));
                            if ((delta > 0.0)) {
                                const Fn = (delta * Math.sqrt(delta));
                                extFx = (extFx - Fn);
                                if ((friction > 0.0)) {
                                    const vt = ((-vy) - (av * r));
                                    const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                    extFy = (extFy - Ft);
                                    contactTorque = (contactTorque - (r * Ft));
                                }
                            }
                            delta = (r - y);
                            if ((delta > 0.0)) {
                                const Fn = (delta * Math.sqrt(delta));
                                extFy = (extFy + Fn);
                                if ((friction > 0.0)) {
                                    const vt = ((-vx) + (av * r));
                                    const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                    extFx = (extFx - Ft);
                                    contactTorque = (contactTorque + (r * Ft));
                                }
                            }
                            delta = (r - ((h - y)));
                            if ((delta > 0.0)) {
                                const Fn = (delta * Math.sqrt(delta));
                                extFy = (extFy - Fn);
                                if ((friction > 0.0)) {
                                    const vt = (vx - (av * r));
                                    const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                    extFx = (extFx + Ft);
                                    contactTorque = (contactTorque - (r * Ft));
                                }
                            }
                            ps_velWX = (ps_velWX + ((extFx * dt) * invM));
                            ps_velWY = (ps_velWY + ((extFy * dt) * invM));
                            if (((friction > 0.0) && (I > EPSILON))) {
                                ps_angW = (ps_angW + ((contactTorque * dt) / I));
                            }
                            ps_posX = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(x, 0.0, w));
                            ps_posY = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(y, 0.0, h));
                            if ((((extFx != 0.0) || (extFy != 0.0)) || (contactTorque != 0.0))) {
                                const _sroa_7_base = ((idx) * 40);
                                let af_f0_x = _b_allForces[_sroa_7_base + 0];
                                let af_f0_y = _b_allForces[_sroa_7_base + 1];
                                let af_f0_z = _b_allForces[_sroa_7_base + 2];
                                let af_f0_w = _b_allForces[_sroa_7_base + 3];
                                let af_f1_x = _b_allForces[_sroa_7_base + 4];
                                let af_f1_y = _b_allForces[_sroa_7_base + 5];
                                let af_f1_z = _b_allForces[_sroa_7_base + 6];
                                let af_f1_w = _b_allForces[_sroa_7_base + 7];
                                let af_f2_x = _b_allForces[_sroa_7_base + 8];
                                let af_f2_y = _b_allForces[_sroa_7_base + 9];
                                let af_f2_z = _b_allForces[_sroa_7_base + 10];
                                let af_f2_w = _b_allForces[_sroa_7_base + 11];
                                let af_f3_x = _b_allForces[_sroa_7_base + 12];
                                let af_f3_y = _b_allForces[_sroa_7_base + 13];
                                let af_f3_z = _b_allForces[_sroa_7_base + 14];
                                let af_f3_w = _b_allForces[_sroa_7_base + 15];
                                let af_f4_x = _b_allForces[_sroa_7_base + 16];
                                let af_f4_y = _b_allForces[_sroa_7_base + 17];
                                let af_f4_z = _b_allForces[_sroa_7_base + 18];
                                let af_f4_w = _b_allForces[_sroa_7_base + 19];
                                let af_f5_x = _b_allForces[_sroa_7_base + 20];
                                let af_f5_y = _b_allForces[_sroa_7_base + 21];
                                let af_f5_z = _b_allForces[_sroa_7_base + 22];
                                let af_f5_w = _b_allForces[_sroa_7_base + 23];
                                let af_torques_x = _b_allForces[_sroa_7_base + 24];
                                let af_torques_y = _b_allForces[_sroa_7_base + 25];
                                let af_torques_z = _b_allForces[_sroa_7_base + 26];
                                let af_torques_w = _b_allForces[_sroa_7_base + 27];
                                let af_bFields_x = _b_allForces[_sroa_7_base + 28];
                                let af_bFields_y = _b_allForces[_sroa_7_base + 29];
                                let af_bFields_z = _b_allForces[_sroa_7_base + 30];
                                let af_bFields_w = _b_allForces[_sroa_7_base + 31];
                                let af_bFieldGrads_x = _b_allForces[_sroa_7_base + 32];
                                let af_bFieldGrads_y = _b_allForces[_sroa_7_base + 33];
                                let af_bFieldGrads_z = _b_allForces[_sroa_7_base + 34];
                                let af_bFieldGrads_w = _b_allForces[_sroa_7_base + 35];
                                let af_totalForce_x = _b_allForces[_sroa_7_base + 36];
                                let af_totalForce_y = _b_allForces[_sroa_7_base + 37];
                                let af_jerk_x = _b_allForces[_sroa_7_base + 38];
                                let af_jerk_y = _b_allForces[_sroa_7_base + 39];
                                af_f4_x = (af_f4_x + extFx);
                                af_f4_y = (af_f4_y + extFy);
                                af_totalForce_x = (af_totalForce_x + extFx);
                                af_totalForce_y = (af_totalForce_y + extFy);
                                af_torques_w = (af_torques_w + contactTorque);
                                {
                                    const _wbase = ((idx) * 40);
                                    _b_allForces[_wbase + 0] = af_f0_x;
                                    _b_allForces[_wbase + 1] = af_f0_y;
                                    _b_allForces[_wbase + 2] = af_f0_z;
                                    _b_allForces[_wbase + 3] = af_f0_w;
                                    _b_allForces[_wbase + 4] = af_f1_x;
                                    _b_allForces[_wbase + 5] = af_f1_y;
                                    _b_allForces[_wbase + 6] = af_f1_z;
                                    _b_allForces[_wbase + 7] = af_f1_w;
                                    _b_allForces[_wbase + 8] = af_f2_x;
                                    _b_allForces[_wbase + 9] = af_f2_y;
                                    _b_allForces[_wbase + 10] = af_f2_z;
                                    _b_allForces[_wbase + 11] = af_f2_w;
                                    _b_allForces[_wbase + 12] = af_f3_x;
                                    _b_allForces[_wbase + 13] = af_f3_y;
                                    _b_allForces[_wbase + 14] = af_f3_z;
                                    _b_allForces[_wbase + 15] = af_f3_w;
                                    _b_allForces[_wbase + 16] = af_f4_x;
                                    _b_allForces[_wbase + 17] = af_f4_y;
                                    _b_allForces[_wbase + 18] = af_f4_z;
                                    _b_allForces[_wbase + 19] = af_f4_w;
                                    _b_allForces[_wbase + 20] = af_f5_x;
                                    _b_allForces[_wbase + 21] = af_f5_y;
                                    _b_allForces[_wbase + 22] = af_f5_z;
                                    _b_allForces[_wbase + 23] = af_f5_w;
                                    _b_allForces[_wbase + 24] = af_torques_x;
                                    _b_allForces[_wbase + 25] = af_torques_y;
                                    _b_allForces[_wbase + 26] = af_torques_z;
                                    _b_allForces[_wbase + 27] = af_torques_w;
                                    _b_allForces[_wbase + 28] = af_bFields_x;
                                    _b_allForces[_wbase + 29] = af_bFields_y;
                                    _b_allForces[_wbase + 30] = af_bFields_z;
                                    _b_allForces[_wbase + 31] = af_bFields_w;
                                    _b_allForces[_wbase + 32] = af_bFieldGrads_x;
                                    _b_allForces[_wbase + 33] = af_bFieldGrads_y;
                                    _b_allForces[_wbase + 34] = af_bFieldGrads_z;
                                    _b_allForces[_wbase + 35] = af_bFieldGrads_w;
                                    _b_allForces[_wbase + 36] = af_totalForce_x;
                                    _b_allForces[_wbase + 37] = af_totalForce_y;
                                    _b_allForces[_wbase + 38] = af_jerk_x;
                                    _b_allForces[_wbase + 39] = af_jerk_y;
                                }
                            }
                        } else {
                            const margin = DESPAWN_MARGIN;
                            if (((((x < (-margin)) || (x >= (w + margin))) || (y < (-margin))) || (y >= (h + margin)))) {
                                const _sroa_8_base = ((idx) * 5);
                                let aux_radius = _b_particleAux[_sroa_8_base + 0];
                                let aux_particleId = _b_particleAux[_sroa_8_base + 1];
                                let aux_deathTime = _b_particleAux[_sroa_8_base + 2];
                                let aux_deathMass = _b_particleAux[_sroa_8_base + 3];
                                let aux_deathAngVel = _b_particleAux[_sroa_8_base + 4];
                                aux_deathTime = _u_uniforms_simTime;
                                aux_deathMass = ps_mass;
                                const r = aux_radius;
                                const sr = (ps_angW * r);
                                const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                aux_deathAngVel = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                                {
                                    const _wbase = ((idx) * 5);
                                    _b_particleAux[_wbase + 0] = aux_radius;
                                    _b_particleAux[_wbase + 1] = aux_particleId;
                                    _b_particleAux[_wbase + 2] = aux_deathTime;
                                    _b_particleAux[_wbase + 3] = aux_deathMass;
                                    _b_particleAux[_wbase + 4] = aux_deathAngVel;
                                }
                                ps_flags = (((ps_flags & (~FLAG_ALIVE))) | FLAG_RETIRED);
                            }
                        }
                        {
                            const _wbase = ((idx) * 9);
                            _b_particleState[_wbase + 0] = ps_posX;
                            _b_particleState[_wbase + 1] = ps_posY;
                            _b_particleState[_wbase + 2] = ps_velWX;
                            _b_particleState[_wbase + 3] = ps_velWY;
                            _b_particleState[_wbase + 4] = ps_mass;
                            _b_particleState[_wbase + 5] = ps_charge;
                            _b_particleState[_wbase + 6] = ps_angW;
                            _b_particleState[_wbase + 7] = ps_baseMass;
                            _b_particleState[_wbase + 8] = ps_flags;
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                __invocation: {
                    const idx = gid_x;
                    if ((idx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    const _sroa_9_base = ((idx) * 9);
                    let ps_posX = _b_particleState[_sroa_9_base + 0];
                    let ps_posY = _b_particleState[_sroa_9_base + 1];
                    let ps_velWX = _b_particleState[_sroa_9_base + 2];
                    let ps_velWY = _b_particleState[_sroa_9_base + 3];
                    let ps_mass = _b_particleState[_sroa_9_base + 4];
                    let ps_charge = _b_particleState[_sroa_9_base + 5];
                    let ps_angW = _b_particleState[_sroa_9_base + 6];
                    let ps_baseMass = _b_particleState[_sroa_9_base + 7];
                    let ps_flags = _b_particleState[_sroa_9_base + 8];
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    let x = ps_posX;
                    let y = ps_posY;
                    const w = _u_uniforms_domainW;
                    const h = _u_uniforms_domainH;
                    if ((_u_uniforms_boundaryMode == BOUND_LOOP)) {
                        const topo = _u_uniforms_topologyMode;
                        if ((topo == TOPO_TORUS)) {
                            if ((x < 0.0)) {
                                x = (x + w);
                            } else if ((x >= w)) {
                                x = (x - w);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                            } else if ((y >= h)) {
                                y = (y - h);
                            }
                            ps_posX = x;
                            ps_posY = y;
                        } else if ((topo == TOPO_KLEIN)) {
                            if ((x < 0.0)) {
                                x = (x + w);
                            } else if ((x >= w)) {
                                x = (x - w);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                                x = (w - x);
                                ps_velWX = (-ps_velWX);
                                ps_angW = (-ps_angW);
                            } else if ((y >= h)) {
                                y = (y - h);
                                x = (w - x);
                                ps_velWX = (-ps_velWX);
                                ps_angW = (-ps_angW);
                            }
                            ps_posX = x;
                            ps_posY = y;
                        } else {
                            let vx = ps_velWX;
                            let vy = ps_velWY;
                            let aw = ps_angW;
                            if ((x < 0.0)) {
                                x = (x + w);
                                y = (h - y);
                                vy = (-vy);
                                aw = (-aw);
                            } else if ((x >= w)) {
                                x = (x - w);
                                y = (h - y);
                                vy = (-vy);
                                aw = (-aw);
                            }
                            if ((y < 0.0)) {
                                y = (y + h);
                                x = (w - x);
                                vx = (-vx);
                                aw = (-aw);
                            } else if ((y >= h)) {
                                y = (y - h);
                                x = (w - x);
                                vx = (-vx);
                                aw = (-aw);
                            }
                            ps_posX = x;
                            ps_posY = y;
                            ps_velWX = vx;
                            ps_velWY = vy;
                            ps_angW = aw;
                        }
                    } else if ((_u_uniforms_boundaryMode == BOUND_BOUNCE)) {
                        const r = _b_particleAux[((idx) * 5 + 0)];
                        const friction = _u_uniforms_bounceFriction;
                        const dt = _u_uniforms_dt;
                        const m = ps_mass;
                        const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                        const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                        const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                        const vx = (ps_velWX * invGamma);
                        const vy = (ps_velWY * invGamma);
                        const sr = (ps_angW * r);
                        const av = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                        const invM = ((m > EPSILON) ? (1.0 / m) : 0.0);
                        const I = (((INERTIA_K * m) * r) * r);
                        let extFx = 0.0;
                        let extFy = 0.0;
                        let contactTorque = 0.0;
                        let delta = (r - x);
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFx = (extFx + Fn);
                            if ((friction > 0.0)) {
                                const vt = (vy + (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFy = (extFy + Ft);
                                contactTorque = (contactTorque + (r * Ft));
                            }
                        }
                        delta = (r - ((w - x)));
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFx = (extFx - Fn);
                            if ((friction > 0.0)) {
                                const vt = ((-vy) - (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFy = (extFy - Ft);
                                contactTorque = (contactTorque - (r * Ft));
                            }
                        }
                        delta = (r - y);
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFy = (extFy + Fn);
                            if ((friction > 0.0)) {
                                const vt = ((-vx) + (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFx = (extFx - Ft);
                                contactTorque = (contactTorque + (r * Ft));
                            }
                        }
                        delta = (r - ((h - y)));
                        if ((delta > 0.0)) {
                            const Fn = (delta * Math.sqrt(delta));
                            extFy = (extFy - Fn);
                            if ((friction > 0.0)) {
                                const vt = (vx - (av * r));
                                const Ft = (((-friction) * Fn) * (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((vt * 10.0), (-1.0), 1.0)));
                                extFx = (extFx + Ft);
                                contactTorque = (contactTorque - (r * Ft));
                            }
                        }
                        ps_velWX = (ps_velWX + ((extFx * dt) * invM));
                        ps_velWY = (ps_velWY + ((extFy * dt) * invM));
                        if (((friction > 0.0) && (I > EPSILON))) {
                            ps_angW = (ps_angW + ((contactTorque * dt) / I));
                        }
                        ps_posX = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(x, 0.0, w));
                        ps_posY = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(y, 0.0, h));
                        if ((((extFx != 0.0) || (extFy != 0.0)) || (contactTorque != 0.0))) {
                            const _sroa_10_base = ((idx) * 40);
                            let af_f0_x = _b_allForces[_sroa_10_base + 0];
                            let af_f0_y = _b_allForces[_sroa_10_base + 1];
                            let af_f0_z = _b_allForces[_sroa_10_base + 2];
                            let af_f0_w = _b_allForces[_sroa_10_base + 3];
                            let af_f1_x = _b_allForces[_sroa_10_base + 4];
                            let af_f1_y = _b_allForces[_sroa_10_base + 5];
                            let af_f1_z = _b_allForces[_sroa_10_base + 6];
                            let af_f1_w = _b_allForces[_sroa_10_base + 7];
                            let af_f2_x = _b_allForces[_sroa_10_base + 8];
                            let af_f2_y = _b_allForces[_sroa_10_base + 9];
                            let af_f2_z = _b_allForces[_sroa_10_base + 10];
                            let af_f2_w = _b_allForces[_sroa_10_base + 11];
                            let af_f3_x = _b_allForces[_sroa_10_base + 12];
                            let af_f3_y = _b_allForces[_sroa_10_base + 13];
                            let af_f3_z = _b_allForces[_sroa_10_base + 14];
                            let af_f3_w = _b_allForces[_sroa_10_base + 15];
                            let af_f4_x = _b_allForces[_sroa_10_base + 16];
                            let af_f4_y = _b_allForces[_sroa_10_base + 17];
                            let af_f4_z = _b_allForces[_sroa_10_base + 18];
                            let af_f4_w = _b_allForces[_sroa_10_base + 19];
                            let af_f5_x = _b_allForces[_sroa_10_base + 20];
                            let af_f5_y = _b_allForces[_sroa_10_base + 21];
                            let af_f5_z = _b_allForces[_sroa_10_base + 22];
                            let af_f5_w = _b_allForces[_sroa_10_base + 23];
                            let af_torques_x = _b_allForces[_sroa_10_base + 24];
                            let af_torques_y = _b_allForces[_sroa_10_base + 25];
                            let af_torques_z = _b_allForces[_sroa_10_base + 26];
                            let af_torques_w = _b_allForces[_sroa_10_base + 27];
                            let af_bFields_x = _b_allForces[_sroa_10_base + 28];
                            let af_bFields_y = _b_allForces[_sroa_10_base + 29];
                            let af_bFields_z = _b_allForces[_sroa_10_base + 30];
                            let af_bFields_w = _b_allForces[_sroa_10_base + 31];
                            let af_bFieldGrads_x = _b_allForces[_sroa_10_base + 32];
                            let af_bFieldGrads_y = _b_allForces[_sroa_10_base + 33];
                            let af_bFieldGrads_z = _b_allForces[_sroa_10_base + 34];
                            let af_bFieldGrads_w = _b_allForces[_sroa_10_base + 35];
                            let af_totalForce_x = _b_allForces[_sroa_10_base + 36];
                            let af_totalForce_y = _b_allForces[_sroa_10_base + 37];
                            let af_jerk_x = _b_allForces[_sroa_10_base + 38];
                            let af_jerk_y = _b_allForces[_sroa_10_base + 39];
                            af_f4_x = (af_f4_x + extFx);
                            af_f4_y = (af_f4_y + extFy);
                            af_totalForce_x = (af_totalForce_x + extFx);
                            af_totalForce_y = (af_totalForce_y + extFy);
                            af_torques_w = (af_torques_w + contactTorque);
                            {
                                const _wbase = ((idx) * 40);
                                _b_allForces[_wbase + 0] = af_f0_x;
                                _b_allForces[_wbase + 1] = af_f0_y;
                                _b_allForces[_wbase + 2] = af_f0_z;
                                _b_allForces[_wbase + 3] = af_f0_w;
                                _b_allForces[_wbase + 4] = af_f1_x;
                                _b_allForces[_wbase + 5] = af_f1_y;
                                _b_allForces[_wbase + 6] = af_f1_z;
                                _b_allForces[_wbase + 7] = af_f1_w;
                                _b_allForces[_wbase + 8] = af_f2_x;
                                _b_allForces[_wbase + 9] = af_f2_y;
                                _b_allForces[_wbase + 10] = af_f2_z;
                                _b_allForces[_wbase + 11] = af_f2_w;
                                _b_allForces[_wbase + 12] = af_f3_x;
                                _b_allForces[_wbase + 13] = af_f3_y;
                                _b_allForces[_wbase + 14] = af_f3_z;
                                _b_allForces[_wbase + 15] = af_f3_w;
                                _b_allForces[_wbase + 16] = af_f4_x;
                                _b_allForces[_wbase + 17] = af_f4_y;
                                _b_allForces[_wbase + 18] = af_f4_z;
                                _b_allForces[_wbase + 19] = af_f4_w;
                                _b_allForces[_wbase + 20] = af_f5_x;
                                _b_allForces[_wbase + 21] = af_f5_y;
                                _b_allForces[_wbase + 22] = af_f5_z;
                                _b_allForces[_wbase + 23] = af_f5_w;
                                _b_allForces[_wbase + 24] = af_torques_x;
                                _b_allForces[_wbase + 25] = af_torques_y;
                                _b_allForces[_wbase + 26] = af_torques_z;
                                _b_allForces[_wbase + 27] = af_torques_w;
                                _b_allForces[_wbase + 28] = af_bFields_x;
                                _b_allForces[_wbase + 29] = af_bFields_y;
                                _b_allForces[_wbase + 30] = af_bFields_z;
                                _b_allForces[_wbase + 31] = af_bFields_w;
                                _b_allForces[_wbase + 32] = af_bFieldGrads_x;
                                _b_allForces[_wbase + 33] = af_bFieldGrads_y;
                                _b_allForces[_wbase + 34] = af_bFieldGrads_z;
                                _b_allForces[_wbase + 35] = af_bFieldGrads_w;
                                _b_allForces[_wbase + 36] = af_totalForce_x;
                                _b_allForces[_wbase + 37] = af_totalForce_y;
                                _b_allForces[_wbase + 38] = af_jerk_x;
                                _b_allForces[_wbase + 39] = af_jerk_y;
                            }
                        }
                    } else {
                        const margin = DESPAWN_MARGIN;
                        if (((((x < (-margin)) || (x >= (w + margin))) || (y < (-margin))) || (y >= (h + margin)))) {
                            const _sroa_11_base = ((idx) * 5);
                            let aux_radius = _b_particleAux[_sroa_11_base + 0];
                            let aux_particleId = _b_particleAux[_sroa_11_base + 1];
                            let aux_deathTime = _b_particleAux[_sroa_11_base + 2];
                            let aux_deathMass = _b_particleAux[_sroa_11_base + 3];
                            let aux_deathAngVel = _b_particleAux[_sroa_11_base + 4];
                            aux_deathTime = _u_uniforms_simTime;
                            aux_deathMass = ps_mass;
                            const r = aux_radius;
                            const sr = (ps_angW * r);
                            const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                            aux_deathAngVel = (relOn ? (ps_angW / Math.sqrt((1.0 + (sr * sr)))) : ps_angW);
                            {
                                const _wbase = ((idx) * 5);
                                _b_particleAux[_wbase + 0] = aux_radius;
                                _b_particleAux[_wbase + 1] = aux_particleId;
                                _b_particleAux[_wbase + 2] = aux_deathTime;
                                _b_particleAux[_wbase + 3] = aux_deathMass;
                                _b_particleAux[_wbase + 4] = aux_deathAngVel;
                            }
                            ps_flags = (((ps_flags & (~FLAG_ALIVE))) | FLAG_RETIRED);
                        }
                    }
                    {
                        const _wbase = ((idx) * 9);
                        _b_particleState[_wbase + 0] = ps_posX;
                        _b_particleState[_wbase + 1] = ps_posY;
                        _b_particleState[_wbase + 2] = ps_velWX;
                        _b_particleState[_wbase + 3] = ps_velWY;
                        _b_particleState[_wbase + 4] = ps_mass;
                        _b_particleState[_wbase + 5] = ps_charge;
                        _b_particleState[_wbase + 6] = ps_angW;
                        _b_particleState[_wbase + 7] = ps_baseMass;
                        _b_particleState[_wbase + 8] = ps_flags;
                    }
                }
            }
        }
    }
    entry["main"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_main(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["main"] = function (workgroups, domain, origin) {
            return __entry_0_main(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["uniforms","particleState","particleAux","allForces"], entryInfo };
}
