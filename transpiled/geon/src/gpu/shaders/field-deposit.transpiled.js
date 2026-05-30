// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/field-deposit.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 80bac11e7013164ae588713c48b98876b6ec130c0e3ecb0346a0fc5381948293
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":89160,"lines":1671,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":12,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.810Z
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
    const FP_SCALE = 1048576.0;
    const INV_FP_SCALE = 9.5367431640625e-7;

    function pqsWeights(x, y, invCellW, invCellH) {
        let result = ({ ix: 0, iy: 0, wx: Array.from({ length: 4 }, () => 0), wy: Array.from({ length: 4 }, () => 0) });
        const gx = ((x * invCellW) - 0.5);
        const gy = ((y * invCellH) - 0.5);
        result.ix = ((Math.floor(gx)) | 0);
        result.iy = ((Math.floor(gy)) | 0);
        const dx = (gx - (+(result.ix)));
        const tx = (1.0 - dx);
        const dx2 = (dx * dx);
        const dx3 = (dx2 * dx);
        result.wx[0] = (((tx * tx) * tx) / 6.0);
        result.wx[1] = ((((4.0 - (6.0 * dx2)) + (3.0 * dx3))) / 6.0);
        result.wx[2] = (((((1.0 + (3.0 * dx)) + (3.0 * dx2)) - (3.0 * dx3))) / 6.0);
        result.wx[3] = (dx3 / 6.0);
        const dy = (gy - (+(result.iy)));
        const ty = (1.0 - dy);
        const dy2 = (dy * dy);
        const dy3 = (dy2 * dy);
        result.wy[0] = (((ty * ty) * ty) / 6.0);
        result.wy[1] = ((((4.0 - (6.0 * dy2)) + (3.0 * dy3))) / 6.0);
        result.wy[2] = (((((1.0 + (3.0 * dy)) + (3.0 * dy2)) - (3.0 * dy3))) / 6.0);
        result.wy[3] = (dy3 / 6.0);
        return result;
    }

    function nbIndex(nx, ny, bcMode, topoMode) {
        let cx = nx;
        let cy = ny;
        const G = ((GRID) | 0);
        if ((bcMode == BOUND_LOOP)) {
            if ((topoMode == TORUS)) {
                if ((cx < 0)) {
                    cx = (cx + G);
                } else if ((cx >= G)) {
                    cx = (cx - G);
                }
                if ((cy < 0)) {
                    cy = (cy + G);
                } else if ((cy >= G)) {
                    cy = (cy - G);
                }
            } else if ((topoMode == KLEIN)) {
                if ((cx < 0)) {
                    cx = (cx + G);
                } else if ((cx >= G)) {
                    cx = (cx - G);
                }
                if ((cy < 0)) {
                    cy = (cy + G);
                    cx = ((G - 1) - cx);
                } else if ((cy >= G)) {
                    cy = (cy - G);
                    cx = ((G - 1) - cx);
                }
            } else {
                if ((cx < 0)) {
                    cx = (cx + G);
                    cy = ((G - 1) - cy);
                } else if ((cx >= G)) {
                    cx = (cx - G);
                    cy = ((G - 1) - cy);
                }
                if ((cy < 0)) {
                    cy = (cy + G);
                    cx = ((G - 1) - cx);
                } else if ((cy >= G)) {
                    cy = (cy - G);
                    cx = ((G - 1) - cx);
                }
            }
            return ((cy * G) + cx);
        }
        if ((bcMode == BOUND_BOUNCE)) {
            cx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(cx, 0, (G - 1)));
            cy = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(cy, 0, (G - 1)));
            return ((cy * G) + cx);
        }
        if (((((cx < 0) || (cx >= G)) || (cy < 0)) || (cy >= G))) {
            return (-1);
        }
        return ((cy * G) + cx);
    }

    function atomicDeposit(pqs, value, bcMode, topoMode) {
        const ix = pqs.ix;
        const iy = pqs.iy;
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = ((((ix >= 1) && ((ix + 2) < ((GRID) | 0))) && (iy >= 1)) && ((iy + 2) < ((GRID) | 0)));
            break _inl_24;
        }
        if (_inl_24_result) {
            for (let jy = 0; (jy < 4); jy++) {
                const vwy = (value * pqs.wy[jy]);
                const row = ((((((iy + ((jy) | 0)) - 1)) >>> 0) * GRID) + (((ix - 1)) >>> 0));
                for (let jx = 0; (jx < 4); jx++) {
                    const w = (vwy * pqs.wx[jx]);
                    const fixed = (((w * FP_SCALE)) | 0);
                    if ((fixed != 0)) {
                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.atomicGrid, (row + jx), fixed));
                    }
                }
            }
            return;
        }
        for (let jy = 0; (jy < 4); jy++) {
            const vwy = (value * pqs.wy[jy]);
            for (let jx = 0; (jx < 4); jx++) {
                const idx = nbIndex(((ix + ((jx) | 0)) - 1), ((iy + ((jy) | 0)) - 1), bcMode, topoMode);
                if ((idx >= 0)) {
                    const w = (vwy * pqs.wx[jx]);
                    const fixed = (((w * FP_SCALE)) | 0);
                    if ((fixed != 0)) {
                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.atomicGrid, idx, fixed));
                    }
                }
            }
        }
    }

    function pqsEnergyCoeffs(pqs, cellArea, bcMode, topoMode) {
        const ix = pqs.ix;
        const iy = pqs.iy;
        let linear = 0.0;
        let quad = 0.0;
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((((ix >= 1) && ((ix + 2) < ((GRID) | 0))) && (iy >= 1)) && ((iy + 2) < ((GRID) | 0)));
            break _inl_25;
        }
        if (_inl_25_result) {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                const row = ((((((iy + ((jy) | 0)) - 1)) >>> 0) * GRID) + (((ix - 1)) >>> 0));
                for (let jx = 0; (jx < 4); jx++) {
                    const w = (pqs.wx[jx] * wyj);
                    const idx = (row + jx);
                    linear = (linear + (bindings.targetGrid[idx] * w));
                    quad = (quad + (w * w));
                }
            }
        } else {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                for (let jx = 0; (jx < 4); jx++) {
                    const idx = nbIndex(((ix + ((jx) | 0)) - 1), ((iy + ((jy) | 0)) - 1), bcMode, topoMode);
                    if ((idx >= 0)) {
                        const w = (pqs.wx[jx] * wyj);
                        linear = (linear + (bindings.targetGrid[idx] * w));
                        quad = (quad + (w * w));
                    }
                }
            }
        }
        return {x:(cellArea * linear), y:(cellArea * quad)};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["depositHiggsSource"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_depositHiggsSource(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_higgsCoupling = _b_uniforms.higgsCoupling;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
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
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_0_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_0_base + 0];
                    const p_posY = _b_particles[_sroa_0_base + 1];
                    const p_velWX = _b_particles[_sroa_0_base + 2];
                    const p_velWY = _b_particles[_sroa_0_base + 3];
                    const p_mass = _b_particles[_sroa_0_base + 4];
                    const p_charge = _b_particles[_sroa_0_base + 5];
                    const p_angW = _b_particles[_sroa_0_base + 6];
                    const p_baseMass = _b_particles[_sroa_0_base + 7];
                    const p_flags = _b_particles[_sroa_0_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const bm = p_baseMass;
                    if ((bm < EPSILON)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    const value = (_u_uniforms_higgsCoupling * bm);
                    atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const pid = gid_x;
                            if ((pid >= _u_uniforms_particleCount)) {
                                break __invocation;
                            }
                            const _sroa_1_base = ((pid) * 9);
                            const p_posX = _b_particles[_sroa_1_base + 0];
                            const p_posY = _b_particles[_sroa_1_base + 1];
                            const p_velWX = _b_particles[_sroa_1_base + 2];
                            const p_velWY = _b_particles[_sroa_1_base + 3];
                            const p_mass = _b_particles[_sroa_1_base + 4];
                            const p_charge = _b_particles[_sroa_1_base + 5];
                            const p_angW = _b_particles[_sroa_1_base + 6];
                            const p_baseMass = _b_particles[_sroa_1_base + 7];
                            const p_flags = _b_particles[_sroa_1_base + 8];
                            if ((((p_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const bm = p_baseMass;
                            if ((bm < EPSILON)) {
                                break __invocation;
                            }
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                            const value = (_u_uniforms_higgsCoupling * bm);
                            atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const pid = gid_x;
                        if ((pid >= _u_uniforms_particleCount)) {
                            break __invocation;
                        }
                        const _sroa_2_base = ((pid) * 9);
                        const p_posX = _b_particles[_sroa_2_base + 0];
                        const p_posY = _b_particles[_sroa_2_base + 1];
                        const p_velWX = _b_particles[_sroa_2_base + 2];
                        const p_velWY = _b_particles[_sroa_2_base + 3];
                        const p_mass = _b_particles[_sroa_2_base + 4];
                        const p_charge = _b_particles[_sroa_2_base + 5];
                        const p_angW = _b_particles[_sroa_2_base + 6];
                        const p_baseMass = _b_particles[_sroa_2_base + 7];
                        const p_flags = _b_particles[_sroa_2_base + 8];
                        if ((((p_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const bm = p_baseMass;
                        if ((bm < EPSILON)) {
                            break __invocation;
                        }
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                        const value = (_u_uniforms_higgsCoupling * bm);
                        atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                __invocation: {
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_3_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_3_base + 0];
                    const p_posY = _b_particles[_sroa_3_base + 1];
                    const p_velWX = _b_particles[_sroa_3_base + 2];
                    const p_velWY = _b_particles[_sroa_3_base + 3];
                    const p_mass = _b_particles[_sroa_3_base + 4];
                    const p_charge = _b_particles[_sroa_3_base + 5];
                    const p_angW = _b_particles[_sroa_3_base + 6];
                    const p_baseMass = _b_particles[_sroa_3_base + 7];
                    const p_flags = _b_particles[_sroa_3_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const bm = p_baseMass;
                    if ((bm < EPSILON)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    const value = (_u_uniforms_higgsCoupling * bm);
                    atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        }
    }
    entry["depositHiggsSource"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_depositHiggsSource(workgroups, bindings, domain, origin);
    };

    entryInfo["depositAxionSource"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_depositAxionSource(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_axionCoupling = _b_uniforms.axionCoupling;
        const _u_uniforms_coulombEnabled = _b_uniforms.coulombEnabled;
        const _u_uniforms_yukawaEnabled = _b_uniforms.yukawaEnabled;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
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
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_4_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_4_base + 0];
                    const p_posY = _b_particles[_sroa_4_base + 1];
                    const p_velWX = _b_particles[_sroa_4_base + 2];
                    const p_velWY = _b_particles[_sroa_4_base + 3];
                    const p_mass = _b_particles[_sroa_4_base + 4];
                    const p_charge = _b_particles[_sroa_4_base + 5];
                    const p_angW = _b_particles[_sroa_4_base + 6];
                    const p_baseMass = _b_particles[_sroa_4_base + 7];
                    const p_flags = _b_particles[_sroa_4_base + 8];
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const g = _u_uniforms_axionCoupling;
                    let value = 0.0;
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        const qSq = (p_charge * p_charge);
                        if ((qSq > EPSILON)) {
                            value = (value + (g * qSq));
                        }
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const m = p_mass;
                        if ((m > EPSILON)) {
                            const isAntimatter = (((flag & 4)) != 0);
                            const sign = (isAntimatter ? (-1.0) : 1.0);
                            value = (value + ((g * m) * sign));
                        }
                    }
                    if ((Math.abs(value) < EPSILON)) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const pid = gid_x;
                            if ((pid >= _u_uniforms_particleCount)) {
                                break __invocation;
                            }
                            const _sroa_5_base = ((pid) * 9);
                            const p_posX = _b_particles[_sroa_5_base + 0];
                            const p_posY = _b_particles[_sroa_5_base + 1];
                            const p_velWX = _b_particles[_sroa_5_base + 2];
                            const p_velWY = _b_particles[_sroa_5_base + 3];
                            const p_mass = _b_particles[_sroa_5_base + 4];
                            const p_charge = _b_particles[_sroa_5_base + 5];
                            const p_angW = _b_particles[_sroa_5_base + 6];
                            const p_baseMass = _b_particles[_sroa_5_base + 7];
                            const p_flags = _b_particles[_sroa_5_base + 8];
                            const flag = p_flags;
                            if ((((flag & 1)) == 0)) {
                                break __invocation;
                            }
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const g = _u_uniforms_axionCoupling;
                            let value = 0.0;
                            if ((_u_uniforms_coulombEnabled != 0)) {
                                const qSq = (p_charge * p_charge);
                                if ((qSq > EPSILON)) {
                                    value = (value + (g * qSq));
                                }
                            }
                            if ((_u_uniforms_yukawaEnabled != 0)) {
                                const m = p_mass;
                                if ((m > EPSILON)) {
                                    const isAntimatter = (((flag & 4)) != 0);
                                    const sign = (isAntimatter ? (-1.0) : 1.0);
                                    value = (value + ((g * m) * sign));
                                }
                            }
                            if ((Math.abs(value) < EPSILON)) {
                                break __invocation;
                            }
                            const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                            atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const pid = gid_x;
                        if ((pid >= _u_uniforms_particleCount)) {
                            break __invocation;
                        }
                        const _sroa_6_base = ((pid) * 9);
                        const p_posX = _b_particles[_sroa_6_base + 0];
                        const p_posY = _b_particles[_sroa_6_base + 1];
                        const p_velWX = _b_particles[_sroa_6_base + 2];
                        const p_velWY = _b_particles[_sroa_6_base + 3];
                        const p_mass = _b_particles[_sroa_6_base + 4];
                        const p_charge = _b_particles[_sroa_6_base + 5];
                        const p_angW = _b_particles[_sroa_6_base + 6];
                        const p_baseMass = _b_particles[_sroa_6_base + 7];
                        const p_flags = _b_particles[_sroa_6_base + 8];
                        const flag = p_flags;
                        if ((((flag & 1)) == 0)) {
                            break __invocation;
                        }
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const g = _u_uniforms_axionCoupling;
                        let value = 0.0;
                        if ((_u_uniforms_coulombEnabled != 0)) {
                            const qSq = (p_charge * p_charge);
                            if ((qSq > EPSILON)) {
                                value = (value + (g * qSq));
                            }
                        }
                        if ((_u_uniforms_yukawaEnabled != 0)) {
                            const m = p_mass;
                            if ((m > EPSILON)) {
                                const isAntimatter = (((flag & 4)) != 0);
                                const sign = (isAntimatter ? (-1.0) : 1.0);
                                value = (value + ((g * m) * sign));
                            }
                        }
                        if ((Math.abs(value) < EPSILON)) {
                            break __invocation;
                        }
                        const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                        atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                __invocation: {
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_7_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_7_base + 0];
                    const p_posY = _b_particles[_sroa_7_base + 1];
                    const p_velWX = _b_particles[_sroa_7_base + 2];
                    const p_velWY = _b_particles[_sroa_7_base + 3];
                    const p_mass = _b_particles[_sroa_7_base + 4];
                    const p_charge = _b_particles[_sroa_7_base + 5];
                    const p_angW = _b_particles[_sroa_7_base + 6];
                    const p_baseMass = _b_particles[_sroa_7_base + 7];
                    const p_flags = _b_particles[_sroa_7_base + 8];
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const g = _u_uniforms_axionCoupling;
                    let value = 0.0;
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        const qSq = (p_charge * p_charge);
                        if ((qSq > EPSILON)) {
                            value = (value + (g * qSq));
                        }
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const m = p_mass;
                        if ((m > EPSILON)) {
                            const isAntimatter = (((flag & 4)) != 0);
                            const sign = (isAntimatter ? (-1.0) : 1.0);
                            value = (value + ((g * m) * sign));
                        }
                    }
                    if ((Math.abs(value) < EPSILON)) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    atomicDeposit(pqs, value, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        }
    }
    entry["depositAxionSource"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_depositAxionSource(workgroups, bindings, domain, origin);
    };

    entryInfo["depositSuperradiance"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_depositSuperradiance(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_dt = _b_uniforms.dt;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_axionMass = _b_uniforms.axionMass;
        const _u_uniforms_relativityEnabled = _b_uniforms.relativityEnabled;
        const _u_uniforms_blackHoleEnabled = _b_uniforms.blackHoleEnabled;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
        const _u_uniforms_currentFieldType = _b_uniforms.currentFieldType;
        const _b_axYukMod = bindings.axYukMod;
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
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    if ((_u_uniforms_blackHoleEnabled == 0)) {
                        break __invocation;
                    }
                    if ((_u_uniforms_currentFieldType != 1)) {
                        break __invocation;
                    }
                    const _sroa_8_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_8_base + 0];
                    const p_posY = _b_particles[_sroa_8_base + 1];
                    const p_velWX = _b_particles[_sroa_8_base + 2];
                    const p_velWY = _b_particles[_sroa_8_base + 3];
                    const p_mass = _b_particles[_sroa_8_base + 4];
                    const p_charge = _b_particles[_sroa_8_base + 5];
                    const p_angW = _b_particles[_sroa_8_base + 6];
                    const p_baseMass = _b_particles[_sroa_8_base + 7];
                    const p_flags = _b_particles[_sroa_8_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const M = p_mass;
                    if ((M <= MIN_MASS)) {
                        break __invocation;
                    }
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = p_angW;
                    const absAngw = Math.abs(angw);
                    const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const disc = (((M * M) - (a * a)) - (p_charge * p_charge));
                    const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                    const rPlusSq = (rPlus * rPlus);
                    const sigma = (rPlusSq + (a * a));
                    if ((sigma < EPSILON)) {
                        break __invocation;
                    }
                    const omegaH = (a / sigma);
                    const muA = _u_uniforms_axionMass;
                    if ((muA <= EPSILON)) {
                        break __invocation;
                    }
                    if ((omegaH <= muA)) {
                        break __invocation;
                    }
                    const alphaG = (M * muA);
                    const phiSq = _b_axYukMod[((pid) * 4 + 0) + 3];
                    const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + phiSq)));
                    const I_bh = ((INERTIA_K * bodyRSq) * M);
                    if ((I_bh < EPSILON)) {
                        break __invocation;
                    }
                    const maxByMass = ((0.0) < ((M - MIN_MASS)) ? ((M - MIN_MASS)) : (0.0));
                    const maxBySpin = ((Math.abs(angw) * I_bh) * muA);
                    const dE = ((((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) < ((rate * _u_uniforms_dt)) ? (((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) : ((rate * _u_uniforms_dt)));
                    if ((dE < EPSILON)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    const _sroa_9 = pqsEnergyCoeffs(pqs, (cellW * cellH), _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    const coeff_x = _sroa_9.x;
                    const coeff_y = _sroa_9.y;
                    const B = coeff_x;
                    const C = coeff_y;
                    if ((C <= EPSILON)) {
                        break __invocation;
                    }
                    const amp = ((((-B) + Math.sqrt(((0.0) < (((B * B) + ((2.0 * C) * dE))) ? (((B * B) + ((2.0 * C) * dE))) : (0.0))))) / C);
                    if (((amp <= EPSILON) || (amp != amp))) {
                        break __invocation;
                    }
                    const acceptedE = ((((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) < (dE) ? (((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) : (dE));
                    if ((acceptedE < EPSILON)) {
                        break __invocation;
                    }
                    atomicDeposit(pqs, amp, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    const dJ = (acceptedE / muA);
                    const newM = (M - acceptedE);
                    const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                    const newAngW = (angw - ((signW * dJ) / I_bh));
                    let p2_posX = p_posX;
                    let p2_posY = p_posY;
                    let p2_velWX = p_velWX;
                    let p2_velWY = p_velWY;
                    let p2_mass = p_mass;
                    let p2_charge = p_charge;
                    let p2_angW = p_angW;
                    let p2_baseMass = p_baseMass;
                    let p2_flags = p_flags;
                    p2_mass = newM;
                    p2_baseMass = (p2_baseMass * ((newM / M)));
                    p2_angW = newAngW;
                    {
                        const _wbase = ((pid) * 9);
                        _b_particles[_wbase + 0] = p2_posX;
                        _b_particles[_wbase + 1] = p2_posY;
                        _b_particles[_wbase + 2] = p2_velWX;
                        _b_particles[_wbase + 3] = p2_velWY;
                        _b_particles[_wbase + 4] = p2_mass;
                        _b_particles[_wbase + 5] = p2_charge;
                        _b_particles[_wbase + 6] = p2_angW;
                        _b_particles[_wbase + 7] = p2_baseMass;
                        _b_particles[_wbase + 8] = p2_flags;
                    }
                    const newBodyR = Math.pow(newM, 0.3333333333333333);
                    const newBodyRSq = (newBodyR * newBodyR);
                    let newAngVel = newAngW;
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        const sr = (newAngW * newBodyR);
                        newAngVel = (newAngW / Math.sqrt((1.0 + (sr * sr))));
                    }
                    let activeR = newBodyR;
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                        const newDisc = (((newM * newM) - (newA * newA)) - (p2_charge * p2_charge));
                        activeR = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                    }
                    const _sroa_10_base = ((pid) * 5);
                    let aux_radius = _b_particleAux[_sroa_10_base + 0];
                    let aux_particleId = _b_particleAux[_sroa_10_base + 1];
                    let aux_deathTime = _b_particleAux[_sroa_10_base + 2];
                    let aux_deathMass = _b_particleAux[_sroa_10_base + 3];
                    let aux_deathAngVel = _b_particleAux[_sroa_10_base + 4];
                    aux_radius = activeR;
                    {
                        const _wbase = ((pid) * 5);
                        _b_particleAux[_wbase + 0] = aux_radius;
                        _b_particleAux[_wbase + 1] = aux_particleId;
                        _b_particleAux[_wbase + 2] = aux_deathTime;
                        _b_particleAux[_wbase + 3] = aux_deathMass;
                        _b_particleAux[_wbase + 4] = aux_deathAngVel;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const pid = gid_x;
                            if ((pid >= _u_uniforms_particleCount)) {
                                break __invocation;
                            }
                            if ((_u_uniforms_blackHoleEnabled == 0)) {
                                break __invocation;
                            }
                            if ((_u_uniforms_currentFieldType != 1)) {
                                break __invocation;
                            }
                            const _sroa_11_base = ((pid) * 9);
                            const p_posX = _b_particles[_sroa_11_base + 0];
                            const p_posY = _b_particles[_sroa_11_base + 1];
                            const p_velWX = _b_particles[_sroa_11_base + 2];
                            const p_velWY = _b_particles[_sroa_11_base + 3];
                            const p_mass = _b_particles[_sroa_11_base + 4];
                            const p_charge = _b_particles[_sroa_11_base + 5];
                            const p_angW = _b_particles[_sroa_11_base + 6];
                            const p_baseMass = _b_particles[_sroa_11_base + 7];
                            const p_flags = _b_particles[_sroa_11_base + 8];
                            if ((((p_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const M = p_mass;
                            if ((M <= MIN_MASS)) {
                                break __invocation;
                            }
                            const bodyRSq = Math.pow(M, 0.6666666666666666);
                            const angw = p_angW;
                            const absAngw = Math.abs(angw);
                            const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                            const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                            const disc = (((M * M) - (a * a)) - (p_charge * p_charge));
                            const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                            const rPlusSq = (rPlus * rPlus);
                            const sigma = (rPlusSq + (a * a));
                            if ((sigma < EPSILON)) {
                                break __invocation;
                            }
                            const omegaH = (a / sigma);
                            const muA = _u_uniforms_axionMass;
                            if ((muA <= EPSILON)) {
                                break __invocation;
                            }
                            if ((omegaH <= muA)) {
                                break __invocation;
                            }
                            const alphaG = (M * muA);
                            const phiSq = _b_axYukMod[((pid) * 4 + 0) + 3];
                            const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + phiSq)));
                            const I_bh = ((INERTIA_K * bodyRSq) * M);
                            if ((I_bh < EPSILON)) {
                                break __invocation;
                            }
                            const maxByMass = ((0.0) < ((M - MIN_MASS)) ? ((M - MIN_MASS)) : (0.0));
                            const maxBySpin = ((Math.abs(angw) * I_bh) * muA);
                            const dE = ((((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) < ((rate * _u_uniforms_dt)) ? (((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) : ((rate * _u_uniforms_dt)));
                            if ((dE < EPSILON)) {
                                break __invocation;
                            }
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                            const _sroa_12 = pqsEnergyCoeffs(pqs, (cellW * cellH), _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                            const coeff_x = _sroa_12.x;
                            const coeff_y = _sroa_12.y;
                            const B = coeff_x;
                            const C = coeff_y;
                            if ((C <= EPSILON)) {
                                break __invocation;
                            }
                            const amp = ((((-B) + Math.sqrt(((0.0) < (((B * B) + ((2.0 * C) * dE))) ? (((B * B) + ((2.0 * C) * dE))) : (0.0))))) / C);
                            if (((amp <= EPSILON) || (amp != amp))) {
                                break __invocation;
                            }
                            const acceptedE = ((((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) < (dE) ? (((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) : (dE));
                            if ((acceptedE < EPSILON)) {
                                break __invocation;
                            }
                            atomicDeposit(pqs, amp, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                            const dJ = (acceptedE / muA);
                            const newM = (M - acceptedE);
                            const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                            const newAngW = (angw - ((signW * dJ) / I_bh));
                            let p2_posX = p_posX;
                            let p2_posY = p_posY;
                            let p2_velWX = p_velWX;
                            let p2_velWY = p_velWY;
                            let p2_mass = p_mass;
                            let p2_charge = p_charge;
                            let p2_angW = p_angW;
                            let p2_baseMass = p_baseMass;
                            let p2_flags = p_flags;
                            p2_mass = newM;
                            p2_baseMass = (p2_baseMass * ((newM / M)));
                            p2_angW = newAngW;
                            {
                                const _wbase = ((pid) * 9);
                                _b_particles[_wbase + 0] = p2_posX;
                                _b_particles[_wbase + 1] = p2_posY;
                                _b_particles[_wbase + 2] = p2_velWX;
                                _b_particles[_wbase + 3] = p2_velWY;
                                _b_particles[_wbase + 4] = p2_mass;
                                _b_particles[_wbase + 5] = p2_charge;
                                _b_particles[_wbase + 6] = p2_angW;
                                _b_particles[_wbase + 7] = p2_baseMass;
                                _b_particles[_wbase + 8] = p2_flags;
                            }
                            const newBodyR = Math.pow(newM, 0.3333333333333333);
                            const newBodyRSq = (newBodyR * newBodyR);
                            let newAngVel = newAngW;
                            if ((_u_uniforms_relativityEnabled != 0)) {
                                const sr = (newAngW * newBodyR);
                                newAngVel = (newAngW / Math.sqrt((1.0 + (sr * sr))));
                            }
                            let activeR = newBodyR;
                            if ((_u_uniforms_blackHoleEnabled != 0)) {
                                const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                                const newDisc = (((newM * newM) - (newA * newA)) - (p2_charge * p2_charge));
                                activeR = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                            }
                            const _sroa_13_base = ((pid) * 5);
                            let aux_radius = _b_particleAux[_sroa_13_base + 0];
                            let aux_particleId = _b_particleAux[_sroa_13_base + 1];
                            let aux_deathTime = _b_particleAux[_sroa_13_base + 2];
                            let aux_deathMass = _b_particleAux[_sroa_13_base + 3];
                            let aux_deathAngVel = _b_particleAux[_sroa_13_base + 4];
                            aux_radius = activeR;
                            {
                                const _wbase = ((pid) * 5);
                                _b_particleAux[_wbase + 0] = aux_radius;
                                _b_particleAux[_wbase + 1] = aux_particleId;
                                _b_particleAux[_wbase + 2] = aux_deathTime;
                                _b_particleAux[_wbase + 3] = aux_deathMass;
                                _b_particleAux[_wbase + 4] = aux_deathAngVel;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const pid = gid_x;
                        if ((pid >= _u_uniforms_particleCount)) {
                            break __invocation;
                        }
                        if ((_u_uniforms_blackHoleEnabled == 0)) {
                            break __invocation;
                        }
                        if ((_u_uniforms_currentFieldType != 1)) {
                            break __invocation;
                        }
                        const _sroa_14_base = ((pid) * 9);
                        const p_posX = _b_particles[_sroa_14_base + 0];
                        const p_posY = _b_particles[_sroa_14_base + 1];
                        const p_velWX = _b_particles[_sroa_14_base + 2];
                        const p_velWY = _b_particles[_sroa_14_base + 3];
                        const p_mass = _b_particles[_sroa_14_base + 4];
                        const p_charge = _b_particles[_sroa_14_base + 5];
                        const p_angW = _b_particles[_sroa_14_base + 6];
                        const p_baseMass = _b_particles[_sroa_14_base + 7];
                        const p_flags = _b_particles[_sroa_14_base + 8];
                        if ((((p_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const M = p_mass;
                        if ((M <= MIN_MASS)) {
                            break __invocation;
                        }
                        const bodyRSq = Math.pow(M, 0.6666666666666666);
                        const angw = p_angW;
                        const absAngw = Math.abs(angw);
                        const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                        const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                        const disc = (((M * M) - (a * a)) - (p_charge * p_charge));
                        const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                        const rPlusSq = (rPlus * rPlus);
                        const sigma = (rPlusSq + (a * a));
                        if ((sigma < EPSILON)) {
                            break __invocation;
                        }
                        const omegaH = (a / sigma);
                        const muA = _u_uniforms_axionMass;
                        if ((muA <= EPSILON)) {
                            break __invocation;
                        }
                        if ((omegaH <= muA)) {
                            break __invocation;
                        }
                        const alphaG = (M * muA);
                        const phiSq = _b_axYukMod[((pid) * 4 + 0) + 3];
                        const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + phiSq)));
                        const I_bh = ((INERTIA_K * bodyRSq) * M);
                        if ((I_bh < EPSILON)) {
                            break __invocation;
                        }
                        const maxByMass = ((0.0) < ((M - MIN_MASS)) ? ((M - MIN_MASS)) : (0.0));
                        const maxBySpin = ((Math.abs(angw) * I_bh) * muA);
                        const dE = ((((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) < ((rate * _u_uniforms_dt)) ? (((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) : ((rate * _u_uniforms_dt)));
                        if ((dE < EPSILON)) {
                            break __invocation;
                        }
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                        const _sroa_15 = pqsEnergyCoeffs(pqs, (cellW * cellH), _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                        const coeff_x = _sroa_15.x;
                        const coeff_y = _sroa_15.y;
                        const B = coeff_x;
                        const C = coeff_y;
                        if ((C <= EPSILON)) {
                            break __invocation;
                        }
                        const amp = ((((-B) + Math.sqrt(((0.0) < (((B * B) + ((2.0 * C) * dE))) ? (((B * B) + ((2.0 * C) * dE))) : (0.0))))) / C);
                        if (((amp <= EPSILON) || (amp != amp))) {
                            break __invocation;
                        }
                        const acceptedE = ((((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) < (dE) ? (((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) : (dE));
                        if ((acceptedE < EPSILON)) {
                            break __invocation;
                        }
                        atomicDeposit(pqs, amp, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                        const dJ = (acceptedE / muA);
                        const newM = (M - acceptedE);
                        const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                        const newAngW = (angw - ((signW * dJ) / I_bh));
                        let p2_posX = p_posX;
                        let p2_posY = p_posY;
                        let p2_velWX = p_velWX;
                        let p2_velWY = p_velWY;
                        let p2_mass = p_mass;
                        let p2_charge = p_charge;
                        let p2_angW = p_angW;
                        let p2_baseMass = p_baseMass;
                        let p2_flags = p_flags;
                        p2_mass = newM;
                        p2_baseMass = (p2_baseMass * ((newM / M)));
                        p2_angW = newAngW;
                        {
                            const _wbase = ((pid) * 9);
                            _b_particles[_wbase + 0] = p2_posX;
                            _b_particles[_wbase + 1] = p2_posY;
                            _b_particles[_wbase + 2] = p2_velWX;
                            _b_particles[_wbase + 3] = p2_velWY;
                            _b_particles[_wbase + 4] = p2_mass;
                            _b_particles[_wbase + 5] = p2_charge;
                            _b_particles[_wbase + 6] = p2_angW;
                            _b_particles[_wbase + 7] = p2_baseMass;
                            _b_particles[_wbase + 8] = p2_flags;
                        }
                        const newBodyR = Math.pow(newM, 0.3333333333333333);
                        const newBodyRSq = (newBodyR * newBodyR);
                        let newAngVel = newAngW;
                        if ((_u_uniforms_relativityEnabled != 0)) {
                            const sr = (newAngW * newBodyR);
                            newAngVel = (newAngW / Math.sqrt((1.0 + (sr * sr))));
                        }
                        let activeR = newBodyR;
                        if ((_u_uniforms_blackHoleEnabled != 0)) {
                            const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                            const newDisc = (((newM * newM) - (newA * newA)) - (p2_charge * p2_charge));
                            activeR = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                        }
                        const _sroa_16_base = ((pid) * 5);
                        let aux_radius = _b_particleAux[_sroa_16_base + 0];
                        let aux_particleId = _b_particleAux[_sroa_16_base + 1];
                        let aux_deathTime = _b_particleAux[_sroa_16_base + 2];
                        let aux_deathMass = _b_particleAux[_sroa_16_base + 3];
                        let aux_deathAngVel = _b_particleAux[_sroa_16_base + 4];
                        aux_radius = activeR;
                        {
                            const _wbase = ((pid) * 5);
                            _b_particleAux[_wbase + 0] = aux_radius;
                            _b_particleAux[_wbase + 1] = aux_particleId;
                            _b_particleAux[_wbase + 2] = aux_deathTime;
                            _b_particleAux[_wbase + 3] = aux_deathMass;
                            _b_particleAux[_wbase + 4] = aux_deathAngVel;
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
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    if ((_u_uniforms_blackHoleEnabled == 0)) {
                        break __invocation;
                    }
                    if ((_u_uniforms_currentFieldType != 1)) {
                        break __invocation;
                    }
                    const _sroa_17_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_17_base + 0];
                    const p_posY = _b_particles[_sroa_17_base + 1];
                    const p_velWX = _b_particles[_sroa_17_base + 2];
                    const p_velWY = _b_particles[_sroa_17_base + 3];
                    const p_mass = _b_particles[_sroa_17_base + 4];
                    const p_charge = _b_particles[_sroa_17_base + 5];
                    const p_angW = _b_particles[_sroa_17_base + 6];
                    const p_baseMass = _b_particles[_sroa_17_base + 7];
                    const p_flags = _b_particles[_sroa_17_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const M = p_mass;
                    if ((M <= MIN_MASS)) {
                        break __invocation;
                    }
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = p_angW;
                    const absAngw = Math.abs(angw);
                    const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const disc = (((M * M) - (a * a)) - (p_charge * p_charge));
                    const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                    const rPlusSq = (rPlus * rPlus);
                    const sigma = (rPlusSq + (a * a));
                    if ((sigma < EPSILON)) {
                        break __invocation;
                    }
                    const omegaH = (a / sigma);
                    const muA = _u_uniforms_axionMass;
                    if ((muA <= EPSILON)) {
                        break __invocation;
                    }
                    if ((omegaH <= muA)) {
                        break __invocation;
                    }
                    const alphaG = (M * muA);
                    const phiSq = _b_axYukMod[((pid) * 4 + 0) + 3];
                    const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + phiSq)));
                    const I_bh = ((INERTIA_K * bodyRSq) * M);
                    if ((I_bh < EPSILON)) {
                        break __invocation;
                    }
                    const maxByMass = ((0.0) < ((M - MIN_MASS)) ? ((M - MIN_MASS)) : (0.0));
                    const maxBySpin = ((Math.abs(angw) * I_bh) * muA);
                    const dE = ((((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) < ((rate * _u_uniforms_dt)) ? (((maxBySpin) < (maxByMass) ? (maxBySpin) : (maxByMass))) : ((rate * _u_uniforms_dt)));
                    if ((dE < EPSILON)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    const _sroa_18 = pqsEnergyCoeffs(pqs, (cellW * cellH), _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    const coeff_x = _sroa_18.x;
                    const coeff_y = _sroa_18.y;
                    const B = coeff_x;
                    const C = coeff_y;
                    if ((C <= EPSILON)) {
                        break __invocation;
                    }
                    const amp = ((((-B) + Math.sqrt(((0.0) < (((B * B) + ((2.0 * C) * dE))) ? (((B * B) + ((2.0 * C) * dE))) : (0.0))))) / C);
                    if (((amp <= EPSILON) || (amp != amp))) {
                        break __invocation;
                    }
                    const acceptedE = ((((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) < (dE) ? (((0.0) < (((B * amp) + (((0.5 * C) * amp) * amp))) ? (((B * amp) + (((0.5 * C) * amp) * amp))) : (0.0))) : (dE));
                    if ((acceptedE < EPSILON)) {
                        break __invocation;
                    }
                    atomicDeposit(pqs, amp, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    const dJ = (acceptedE / muA);
                    const newM = (M - acceptedE);
                    const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                    const newAngW = (angw - ((signW * dJ) / I_bh));
                    let p2_posX = p_posX;
                    let p2_posY = p_posY;
                    let p2_velWX = p_velWX;
                    let p2_velWY = p_velWY;
                    let p2_mass = p_mass;
                    let p2_charge = p_charge;
                    let p2_angW = p_angW;
                    let p2_baseMass = p_baseMass;
                    let p2_flags = p_flags;
                    p2_mass = newM;
                    p2_baseMass = (p2_baseMass * ((newM / M)));
                    p2_angW = newAngW;
                    {
                        const _wbase = ((pid) * 9);
                        _b_particles[_wbase + 0] = p2_posX;
                        _b_particles[_wbase + 1] = p2_posY;
                        _b_particles[_wbase + 2] = p2_velWX;
                        _b_particles[_wbase + 3] = p2_velWY;
                        _b_particles[_wbase + 4] = p2_mass;
                        _b_particles[_wbase + 5] = p2_charge;
                        _b_particles[_wbase + 6] = p2_angW;
                        _b_particles[_wbase + 7] = p2_baseMass;
                        _b_particles[_wbase + 8] = p2_flags;
                    }
                    const newBodyR = Math.pow(newM, 0.3333333333333333);
                    const newBodyRSq = (newBodyR * newBodyR);
                    let newAngVel = newAngW;
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        const sr = (newAngW * newBodyR);
                        newAngVel = (newAngW / Math.sqrt((1.0 + (sr * sr))));
                    }
                    let activeR = newBodyR;
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                        const newDisc = (((newM * newM) - (newA * newA)) - (p2_charge * p2_charge));
                        activeR = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                    }
                    const _sroa_19_base = ((pid) * 5);
                    let aux_radius = _b_particleAux[_sroa_19_base + 0];
                    let aux_particleId = _b_particleAux[_sroa_19_base + 1];
                    let aux_deathTime = _b_particleAux[_sroa_19_base + 2];
                    let aux_deathMass = _b_particleAux[_sroa_19_base + 3];
                    let aux_deathAngVel = _b_particleAux[_sroa_19_base + 4];
                    aux_radius = activeR;
                    {
                        const _wbase = ((pid) * 5);
                        _b_particleAux[_wbase + 0] = aux_radius;
                        _b_particleAux[_wbase + 1] = aux_particleId;
                        _b_particleAux[_wbase + 2] = aux_deathTime;
                        _b_particleAux[_wbase + 3] = aux_deathMass;
                        _b_particleAux[_wbase + 4] = aux_deathAngVel;
                    }
                }
            }
        }
    }
    entry["depositSuperradiance"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_depositSuperradiance(workgroups, bindings, domain, origin);
    };

    entryInfo["depositThermal"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_depositThermal(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_relativityEnabled = _b_uniforms.relativityEnabled;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
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
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_20_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_20_base + 0];
                    const p_posY = _b_particles[_sroa_20_base + 1];
                    const p_velWX = _b_particles[_sroa_20_base + 2];
                    const p_velWY = _b_particles[_sroa_20_base + 3];
                    const p_mass = _b_particles[_sroa_20_base + 4];
                    const p_charge = _b_particles[_sroa_20_base + 5];
                    const p_angW = _b_particles[_sroa_20_base + 6];
                    const p_baseMass = _b_particles[_sroa_20_base + 7];
                    const p_flags = _b_particles[_sroa_20_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                    let ke = 0;
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        ke = ((wSq / ((Math.sqrt((1.0 + wSq)) + 1.0))) * p_mass);
                    } else {
                        ke = ((0.5 * p_mass) * wSq);
                    }
                    if ((ke < EPSILON)) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    atomicDeposit(pqs, ke, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const pid = gid_x;
                            if ((pid >= _u_uniforms_particleCount)) {
                                break __invocation;
                            }
                            const _sroa_21_base = ((pid) * 9);
                            const p_posX = _b_particles[_sroa_21_base + 0];
                            const p_posY = _b_particles[_sroa_21_base + 1];
                            const p_velWX = _b_particles[_sroa_21_base + 2];
                            const p_velWY = _b_particles[_sroa_21_base + 3];
                            const p_mass = _b_particles[_sroa_21_base + 4];
                            const p_charge = _b_particles[_sroa_21_base + 5];
                            const p_angW = _b_particles[_sroa_21_base + 6];
                            const p_baseMass = _b_particles[_sroa_21_base + 7];
                            const p_flags = _b_particles[_sroa_21_base + 8];
                            if ((((p_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                            let ke = 0;
                            if ((_u_uniforms_relativityEnabled != 0)) {
                                ke = ((wSq / ((Math.sqrt((1.0 + wSq)) + 1.0))) * p_mass);
                            } else {
                                ke = ((0.5 * p_mass) * wSq);
                            }
                            if ((ke < EPSILON)) {
                                break __invocation;
                            }
                            const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                            atomicDeposit(pqs, ke, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const pid = gid_x;
                        if ((pid >= _u_uniforms_particleCount)) {
                            break __invocation;
                        }
                        const _sroa_22_base = ((pid) * 9);
                        const p_posX = _b_particles[_sroa_22_base + 0];
                        const p_posY = _b_particles[_sroa_22_base + 1];
                        const p_velWX = _b_particles[_sroa_22_base + 2];
                        const p_velWY = _b_particles[_sroa_22_base + 3];
                        const p_mass = _b_particles[_sroa_22_base + 4];
                        const p_charge = _b_particles[_sroa_22_base + 5];
                        const p_angW = _b_particles[_sroa_22_base + 6];
                        const p_baseMass = _b_particles[_sroa_22_base + 7];
                        const p_flags = _b_particles[_sroa_22_base + 8];
                        if ((((p_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                        let ke = 0;
                        if ((_u_uniforms_relativityEnabled != 0)) {
                            ke = ((wSq / ((Math.sqrt((1.0 + wSq)) + 1.0))) * p_mass);
                        } else {
                            ke = ((0.5 * p_mass) * wSq);
                        }
                        if ((ke < EPSILON)) {
                            break __invocation;
                        }
                        const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                        atomicDeposit(pqs, ke, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                __invocation: {
                    const pid = gid_x;
                    if ((pid >= _u_uniforms_particleCount)) {
                        break __invocation;
                    }
                    const _sroa_23_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_23_base + 0];
                    const p_posY = _b_particles[_sroa_23_base + 1];
                    const p_velWX = _b_particles[_sroa_23_base + 2];
                    const p_velWY = _b_particles[_sroa_23_base + 3];
                    const p_mass = _b_particles[_sroa_23_base + 4];
                    const p_charge = _b_particles[_sroa_23_base + 5];
                    const p_angW = _b_particles[_sroa_23_base + 6];
                    const p_baseMass = _b_particles[_sroa_23_base + 7];
                    const p_flags = _b_particles[_sroa_23_base + 8];
                    if ((((p_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                    let ke = 0;
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        ke = ((wSq / ((Math.sqrt((1.0 + wSq)) + 1.0))) * p_mass);
                    } else {
                        ke = ((0.5 * p_mass) * wSq);
                    }
                    if ((ke < EPSILON)) {
                        break __invocation;
                    }
                    const pqs = pqsWeights(p_posX, p_posY, (1.0 / cellW), (1.0 / cellH));
                    atomicDeposit(pqs, ke, _u_uniforms_boundaryMode, _u_uniforms_topologyMode);
                }
            }
        }
    }
    entry["depositThermal"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_depositThermal(workgroups, bindings, domain, origin);
    };

    entryInfo["finalizeDeposit"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_4_finalizeDeposit(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_atomicGrid = bindings.atomicGrid;
        const _b_targetGrid = bindings.targetGrid;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = GRID;
        const __clipYBound = GRID;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const idx = ((gid_y * GRID) + gid_x);
                        _b_targetGrid[idx] = ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE);
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                const __clipGx = Math.min(Gx, __clipXBound);
                const __clipGy = Math.min(Gy, __clipYBound);
                for (let __gy = 0, __rowBase = 0; __gy < __clipGy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < __clipGx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        {
                            const idx = ((gid_y * GRID) + gid_x);
                            _b_targetGrid[idx] = ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE);
                        }
                    }
                }
            } else {
                const __clipXn = Math.min(Xn, __clipXBound);
                const __clipYn = Math.min(Yn, __clipYBound);
                for (let __gy = Oy; __gy < __clipYn; __gy++)
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    {
                        const idx = ((gid_y * GRID) + gid_x);
                        _b_targetGrid[idx] = ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE);
                    }
                }
            }
        } else {
            const __clipXn = Math.min(Xn, __clipXBound);
            const __clipYn = Math.min(Yn, __clipYBound);
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < __clipYn; __gy++)
            for (let __gx = Ox; __gx < __clipXn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                {
                    const idx = ((gid_y * GRID) + gid_x);
                    _b_targetGrid[idx] = ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE);
                }
            }
        }
    }
    entry["finalizeDeposit"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_4_finalizeDeposit(workgroups, bindings, domain, origin);
    };

    entryInfo["finalizeDepositAdd"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_5_finalizeDepositAdd(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_atomicGrid = bindings.atomicGrid;
        const _b_targetGrid = bindings.targetGrid;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = GRID;
        const __clipYBound = GRID;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const idx = ((gid_y * GRID) + gid_x);
                        _b_targetGrid[idx] = (_b_targetGrid[idx] + ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE));
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                const __clipGx = Math.min(Gx, __clipXBound);
                const __clipGy = Math.min(Gy, __clipYBound);
                for (let __gy = 0, __rowBase = 0; __gy < __clipGy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < __clipGx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        {
                            const idx = ((gid_y * GRID) + gid_x);
                            _b_targetGrid[idx] = (_b_targetGrid[idx] + ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE));
                        }
                    }
                }
            } else {
                const __clipXn = Math.min(Xn, __clipXBound);
                const __clipYn = Math.min(Yn, __clipYBound);
                for (let __gy = Oy; __gy < __clipYn; __gy++)
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    {
                        const idx = ((gid_y * GRID) + gid_x);
                        _b_targetGrid[idx] = (_b_targetGrid[idx] + ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE));
                    }
                }
            }
        } else {
            const __clipXn = Math.min(Xn, __clipXBound);
            const __clipYn = Math.min(Yn, __clipYBound);
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < __clipYn; __gy++)
            for (let __gx = Ox; __gx < __clipXn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                {
                    const idx = ((gid_y * GRID) + gid_x);
                    _b_targetGrid[idx] = (_b_targetGrid[idx] + ((+((((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _v; return _o; })(_b_atomicGrid, idx, 0)))) * INV_FP_SCALE));
                }
            }
        }
    }
    entry["finalizeDepositAdd"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_5_finalizeDepositAdd(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["depositHiggsSource"] = function (workgroups, domain, origin) {
            return __entry_0_depositHiggsSource(workgroups, bindings, domain, origin);
        };
        bound["depositAxionSource"] = function (workgroups, domain, origin) {
            return __entry_1_depositAxionSource(workgroups, bindings, domain, origin);
        };
        bound["depositSuperradiance"] = function (workgroups, domain, origin) {
            return __entry_2_depositSuperradiance(workgroups, bindings, domain, origin);
        };
        bound["depositThermal"] = function (workgroups, domain, origin) {
            return __entry_3_depositThermal(workgroups, bindings, domain, origin);
        };
        bound["finalizeDeposit"] = function (workgroups, domain, origin) {
            return __entry_4_finalizeDeposit(workgroups, bindings, domain, origin);
        };
        bound["finalizeDepositAdd"] = function (workgroups, domain, origin) {
            return __entry_5_finalizeDepositAdd(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["particles","particleAux","atomicGrid","targetGrid","uniforms","axYukMod"], entryInfo };
}
