// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/field-forces.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 1a053845e81f2f3fe4c79fcf0bdc439c43d29e0584cbe9a046fc8783e12c98c7
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":134597,"lines":2257,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":6,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.824Z
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

    function pqsInterpolate(fieldArr, px, py, invCellW, invCellH, bcMode, topoMode, vacValue) {
        const pqs = pqsWeights(px, py, invCellW, invCellH);
        let val = 0.0;
        const _inl_24_ix = pqs.ix;
        const _inl_24_iy = pqs.iy;
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = ((((_inl_24_ix >= 1) && ((_inl_24_ix + 2) < ((GRID) | 0))) && (_inl_24_iy >= 1)) && ((_inl_24_iy + 2) < ((GRID) | 0)));
            break _inl_24;
        }
        if (_inl_24_result) {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                const row = ((((((pqs.iy + ((jy) | 0)) - 1)) >>> 0) * GRID) + (((pqs.ix - 1)) >>> 0));
                for (let jx = 0; (jx < 4); jx++) {
                    val = (val + (((fieldArr)[(row + jx)] * pqs.wx[jx]) * wyj));
                }
            }
        } else {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                for (let jx = 0; (jx < 4); jx++) {
                    const idx = nbIndex(((pqs.ix + ((jx) | 0)) - 1), ((pqs.iy + ((jy) | 0)) - 1), bcMode, topoMode);
                    const fv = ((idx >= 0) ? (fieldArr)[idx] : vacValue);
                    val = (val + ((fv * pqs.wx[jx]) * wyj));
                }
            }
        }
        return val;
    }

    function pqsGradient(gradXArr, gradYArr, px, py, invCellW, invCellH, bcMode, topoMode) {
        const pqs = pqsWeights(px, py, invCellW, invCellH);
        let gx = 0.0;
        let gy = 0.0;
        const _inl_25_ix = pqs.ix;
        const _inl_25_iy = pqs.iy;
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((((_inl_25_ix >= 1) && ((_inl_25_ix + 2) < ((GRID) | 0))) && (_inl_25_iy >= 1)) && ((_inl_25_iy + 2) < ((GRID) | 0)));
            break _inl_25;
        }
        if (_inl_25_result) {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                const row = ((((((pqs.iy + ((jy) | 0)) - 1)) >>> 0) * GRID) + (((pqs.ix - 1)) >>> 0));
                for (let jx = 0; (jx < 4); jx++) {
                    const w = (pqs.wx[jx] * wyj);
                    gx = (gx + ((gradXArr)[(row + jx)] * w));
                    gy = (gy + ((gradYArr)[(row + jx)] * w));
                }
            }
        } else {
            for (let jy = 0; (jy < 4); jy++) {
                const wyj = pqs.wy[jy];
                for (let jx = 0; (jx < 4); jx++) {
                    const idx = nbIndex(((pqs.ix + ((jx) | 0)) - 1), ((pqs.iy + ((jy) | 0)) - 1), bcMode, topoMode);
                    if ((idx >= 0)) {
                        const w = (pqs.wx[jx] * wyj);
                        gx = (gx + ((gradXArr)[idx] * w));
                        gy = (gy + ((gradYArr)[idx] * w));
                    }
                }
            }
        }
        return {x:(gx * invCellW), y:(gy * invCellH)};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["applyHiggsForces"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_applyHiggsForces(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_higgsField = bindings.higgsField;
        const _b_higgsGradX = bindings.higgsGradX;
        const _b_higgsGradY = bindings.higgsGradY;
        const _b_allForces = bindings.allForces;
        const _b_axYukMod = bindings.axYukMod;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_dt = _b_uniforms.dt;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_higgsCoupling = _b_uniforms.higgsCoupling;
        const _u_uniforms_higgsMassFloor = _b_uniforms.higgsMassFloor;
        const _u_uniforms_higgsMassMaxDelta = _b_uniforms.higgsMassMaxDelta;
        const _u_uniforms_relativityEnabled = _b_uniforms.relativityEnabled;
        const _u_uniforms_blackHoleEnabled = _b_uniforms.blackHoleEnabled;
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
                    let p_posX = _b_particles[_sroa_0_base + 0];
                    let p_posY = _b_particles[_sroa_0_base + 1];
                    let p_velWX = _b_particles[_sroa_0_base + 2];
                    let p_velWY = _b_particles[_sroa_0_base + 3];
                    let p_mass = _b_particles[_sroa_0_base + 4];
                    let p_charge = _b_particles[_sroa_0_base + 5];
                    let p_angW = _b_particles[_sroa_0_base + 6];
                    let p_baseMass = _b_particles[_sroa_0_base + 7];
                    let p_flags = _b_particles[_sroa_0_base + 8];
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const bm = p_baseMass;
                    if ((bm < EPSILON)) {
                        break __invocation;
                    }
                    const px = p_posX;
                    const py = p_posY;
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const invCellW = (1.0 / cellW);
                    const invCellH = (1.0 / cellH);
                    const bcMode = _u_uniforms_boundaryMode;
                    const topoMode = _u_uniforms_topologyMode;
                    const phiLocal = pqsInterpolate(_b_higgsField, px, py, invCellW, invCellH, bcMode, topoMode, 1.0);
                    const hmFloor = _u_uniforms_higgsMassFloor;
                    const _sroa_1_base = ((pid) * 4 + 0);
                    let aym_x = _b_axYukMod[_sroa_1_base + 0];
                    let aym_y = _b_axYukMod[_sroa_1_base + 1];
                    let aym_z = _b_axYukMod[_sroa_1_base + 2];
                    let aym_w = _b_axYukMod[_sroa_1_base + 3];
                    aym_z = ((Math.abs(phiLocal)) < (hmFloor) ? (hmFloor) : (Math.abs(phiLocal)));
                    {
                        const _wbase = ((pid) * 4 + 0);
                        const _wt0 = aym_x;
                        const _wt1 = aym_y;
                        const _wt2 = aym_z;
                        const _wt3 = aym_w;
                        _b_axYukMod[_wbase + 0] = _wt0;
                        _b_axYukMod[_wbase + 1] = _wt1;
                        _b_axYukMod[_wbase + 2] = _wt2;
                        _b_axYukMod[_wbase + 3] = _wt3;
                    }
                    const floor = hmFloor;
                    const targetMass = (((bm * Math.abs(phiLocal))) < ((floor * bm)) ? ((floor * bm)) : ((bm * Math.abs(phiLocal))));
                    const maxDelta = (_u_uniforms_higgsMassMaxDelta * _u_uniforms_dt);
                    const currentMass = p_mass;
                    const diff = (targetMass - currentMass);
                    const clampedDiff = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(diff, (-maxDelta), maxDelta));
                    const newMass = (((currentMass + clampedDiff)) < (MIN_MASS) ? (MIN_MASS) : ((currentMass + clampedDiff)));
                    const massRatio = (currentMass / newMass);
                    p_velWX = (p_velWX * massRatio);
                    p_velWY = (p_velWY * massRatio);
                    p_mass = newMass;
                    {
                        const _wbase = ((pid) * 9);
                        _b_particles[_wbase + 0] = p_posX;
                        _b_particles[_wbase + 1] = p_posY;
                        _b_particles[_wbase + 2] = p_velWX;
                        _b_particles[_wbase + 3] = p_velWY;
                        _b_particles[_wbase + 4] = p_mass;
                        _b_particles[_wbase + 5] = p_charge;
                        _b_particles[_wbase + 6] = p_angW;
                        _b_particles[_wbase + 7] = p_baseMass;
                        _b_particles[_wbase + 8] = p_flags;
                    }
                    const bodyR = Math.pow(newMass, 0.3333333333333333);
                    const bodyRSq = (bodyR * bodyR);
                    const _sroa_2_base = ((pid) * 8);
                    let d_magMoment = _b_derived[_sroa_2_base + 0];
                    let d_angMomentum = _b_derived[_sroa_2_base + 1];
                    let d_invMass = _b_derived[_sroa_2_base + 2];
                    let d_radiusSq = _b_derived[_sroa_2_base + 3];
                    let d_velX = _b_derived[_sroa_2_base + 4];
                    let d_velY = _b_derived[_sroa_2_base + 5];
                    let d_angVel = _b_derived[_sroa_2_base + 6];
                    let d_bodyRSq = _b_derived[_sroa_2_base + 7];
                    d_invMass = ((newMass > EPSILON) ? (1.0 / newMass) : 0.0);
                    d_bodyRSq = bodyRSq;
                    const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        const gamma = Math.sqrt((1.0 + wSq));
                        d_velX = (p_velWX / gamma);
                        d_velY = (p_velWY / gamma);
                    } else {
                        d_velX = p_velWX;
                        d_velY = p_velWY;
                    }
                    const sr = (p_angW * bodyR);
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        d_angVel = (p_angW / Math.sqrt((1.0 + (sr * sr))));
                    } else {
                        d_angVel = p_angW;
                    }
                    let activeR = bodyR;
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const a = ((INERTIA_K * bodyRSq) * Math.abs(d_angVel));
                        const disc = (((newMass * newMass) - (a * a)) - (p_charge * p_charge));
                        activeR = ((disc >= 0.0) ? (newMass + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : newMass);
                    }
                    d_radiusSq = (activeR * activeR);
                    d_magMoment = (((MAG_MOMENT_K * p_charge) * d_angVel) * bodyRSq);
                    d_angMomentum = (((INERTIA_K * newMass) * bodyRSq) * d_angVel);
                    {
                        const _wbase = ((pid) * 8);
                        _b_derived[_wbase + 0] = d_magMoment;
                        _b_derived[_wbase + 1] = d_angMomentum;
                        _b_derived[_wbase + 2] = d_invMass;
                        _b_derived[_wbase + 3] = d_radiusSq;
                        _b_derived[_wbase + 4] = d_velX;
                        _b_derived[_wbase + 5] = d_velY;
                        _b_derived[_wbase + 6] = d_angVel;
                        _b_derived[_wbase + 7] = d_bodyRSq;
                    }
                    const _sroa_3 = pqsGradient(_b_higgsGradX, _b_higgsGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                    const grad_x = _sroa_3.x;
                    const grad_y = _sroa_3.y;
                    const signPhi = ((phiLocal >= 0.0) ? 1.0 : (-1.0));
                    const g = _u_uniforms_higgsCoupling;
                    const fx = (((g * bm) * signPhi) * grad_x);
                    const fy = (((g * bm) * signPhi) * grad_y);
                    const _sroa_4_base = ((pid) * 40);
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
                    af_f4_z = (af_f4_z + fx);
                    af_f4_w = (af_f4_w + fy);
                    af_totalForce_x = (af_totalForce_x + fx);
                    af_totalForce_y = (af_totalForce_y + fy);
                    {
                        const _wbase = ((pid) * 40);
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
                            let p_posX = _b_particles[_sroa_5_base + 0];
                            let p_posY = _b_particles[_sroa_5_base + 1];
                            let p_velWX = _b_particles[_sroa_5_base + 2];
                            let p_velWY = _b_particles[_sroa_5_base + 3];
                            let p_mass = _b_particles[_sroa_5_base + 4];
                            let p_charge = _b_particles[_sroa_5_base + 5];
                            let p_angW = _b_particles[_sroa_5_base + 6];
                            let p_baseMass = _b_particles[_sroa_5_base + 7];
                            let p_flags = _b_particles[_sroa_5_base + 8];
                            const flag = p_flags;
                            if ((((flag & 1)) == 0)) {
                                break __invocation;
                            }
                            const bm = p_baseMass;
                            if ((bm < EPSILON)) {
                                break __invocation;
                            }
                            const px = p_posX;
                            const py = p_posY;
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const invCellW = (1.0 / cellW);
                            const invCellH = (1.0 / cellH);
                            const bcMode = _u_uniforms_boundaryMode;
                            const topoMode = _u_uniforms_topologyMode;
                            const phiLocal = pqsInterpolate(_b_higgsField, px, py, invCellW, invCellH, bcMode, topoMode, 1.0);
                            const hmFloor = _u_uniforms_higgsMassFloor;
                            const _sroa_6_base = ((pid) * 4 + 0);
                            let aym_x = _b_axYukMod[_sroa_6_base + 0];
                            let aym_y = _b_axYukMod[_sroa_6_base + 1];
                            let aym_z = _b_axYukMod[_sroa_6_base + 2];
                            let aym_w = _b_axYukMod[_sroa_6_base + 3];
                            aym_z = ((Math.abs(phiLocal)) < (hmFloor) ? (hmFloor) : (Math.abs(phiLocal)));
                            {
                                const _wbase = ((pid) * 4 + 0);
                                const _wt0 = aym_x;
                                const _wt1 = aym_y;
                                const _wt2 = aym_z;
                                const _wt3 = aym_w;
                                _b_axYukMod[_wbase + 0] = _wt0;
                                _b_axYukMod[_wbase + 1] = _wt1;
                                _b_axYukMod[_wbase + 2] = _wt2;
                                _b_axYukMod[_wbase + 3] = _wt3;
                            }
                            const floor = hmFloor;
                            const targetMass = (((bm * Math.abs(phiLocal))) < ((floor * bm)) ? ((floor * bm)) : ((bm * Math.abs(phiLocal))));
                            const maxDelta = (_u_uniforms_higgsMassMaxDelta * _u_uniforms_dt);
                            const currentMass = p_mass;
                            const diff = (targetMass - currentMass);
                            const clampedDiff = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(diff, (-maxDelta), maxDelta));
                            const newMass = (((currentMass + clampedDiff)) < (MIN_MASS) ? (MIN_MASS) : ((currentMass + clampedDiff)));
                            const massRatio = (currentMass / newMass);
                            p_velWX = (p_velWX * massRatio);
                            p_velWY = (p_velWY * massRatio);
                            p_mass = newMass;
                            {
                                const _wbase = ((pid) * 9);
                                _b_particles[_wbase + 0] = p_posX;
                                _b_particles[_wbase + 1] = p_posY;
                                _b_particles[_wbase + 2] = p_velWX;
                                _b_particles[_wbase + 3] = p_velWY;
                                _b_particles[_wbase + 4] = p_mass;
                                _b_particles[_wbase + 5] = p_charge;
                                _b_particles[_wbase + 6] = p_angW;
                                _b_particles[_wbase + 7] = p_baseMass;
                                _b_particles[_wbase + 8] = p_flags;
                            }
                            const bodyR = Math.pow(newMass, 0.3333333333333333);
                            const bodyRSq = (bodyR * bodyR);
                            const _sroa_7_base = ((pid) * 8);
                            let d_magMoment = _b_derived[_sroa_7_base + 0];
                            let d_angMomentum = _b_derived[_sroa_7_base + 1];
                            let d_invMass = _b_derived[_sroa_7_base + 2];
                            let d_radiusSq = _b_derived[_sroa_7_base + 3];
                            let d_velX = _b_derived[_sroa_7_base + 4];
                            let d_velY = _b_derived[_sroa_7_base + 5];
                            let d_angVel = _b_derived[_sroa_7_base + 6];
                            let d_bodyRSq = _b_derived[_sroa_7_base + 7];
                            d_invMass = ((newMass > EPSILON) ? (1.0 / newMass) : 0.0);
                            d_bodyRSq = bodyRSq;
                            const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                            if ((_u_uniforms_relativityEnabled != 0)) {
                                const gamma = Math.sqrt((1.0 + wSq));
                                d_velX = (p_velWX / gamma);
                                d_velY = (p_velWY / gamma);
                            } else {
                                d_velX = p_velWX;
                                d_velY = p_velWY;
                            }
                            const sr = (p_angW * bodyR);
                            if ((_u_uniforms_relativityEnabled != 0)) {
                                d_angVel = (p_angW / Math.sqrt((1.0 + (sr * sr))));
                            } else {
                                d_angVel = p_angW;
                            }
                            let activeR = bodyR;
                            if ((_u_uniforms_blackHoleEnabled != 0)) {
                                const a = ((INERTIA_K * bodyRSq) * Math.abs(d_angVel));
                                const disc = (((newMass * newMass) - (a * a)) - (p_charge * p_charge));
                                activeR = ((disc >= 0.0) ? (newMass + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : newMass);
                            }
                            d_radiusSq = (activeR * activeR);
                            d_magMoment = (((MAG_MOMENT_K * p_charge) * d_angVel) * bodyRSq);
                            d_angMomentum = (((INERTIA_K * newMass) * bodyRSq) * d_angVel);
                            {
                                const _wbase = ((pid) * 8);
                                _b_derived[_wbase + 0] = d_magMoment;
                                _b_derived[_wbase + 1] = d_angMomentum;
                                _b_derived[_wbase + 2] = d_invMass;
                                _b_derived[_wbase + 3] = d_radiusSq;
                                _b_derived[_wbase + 4] = d_velX;
                                _b_derived[_wbase + 5] = d_velY;
                                _b_derived[_wbase + 6] = d_angVel;
                                _b_derived[_wbase + 7] = d_bodyRSq;
                            }
                            const _sroa_8 = pqsGradient(_b_higgsGradX, _b_higgsGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                            const grad_x = _sroa_8.x;
                            const grad_y = _sroa_8.y;
                            const signPhi = ((phiLocal >= 0.0) ? 1.0 : (-1.0));
                            const g = _u_uniforms_higgsCoupling;
                            const fx = (((g * bm) * signPhi) * grad_x);
                            const fy = (((g * bm) * signPhi) * grad_y);
                            const _sroa_9_base = ((pid) * 40);
                            let af_f0_x = _b_allForces[_sroa_9_base + 0];
                            let af_f0_y = _b_allForces[_sroa_9_base + 1];
                            let af_f0_z = _b_allForces[_sroa_9_base + 2];
                            let af_f0_w = _b_allForces[_sroa_9_base + 3];
                            let af_f1_x = _b_allForces[_sroa_9_base + 4];
                            let af_f1_y = _b_allForces[_sroa_9_base + 5];
                            let af_f1_z = _b_allForces[_sroa_9_base + 6];
                            let af_f1_w = _b_allForces[_sroa_9_base + 7];
                            let af_f2_x = _b_allForces[_sroa_9_base + 8];
                            let af_f2_y = _b_allForces[_sroa_9_base + 9];
                            let af_f2_z = _b_allForces[_sroa_9_base + 10];
                            let af_f2_w = _b_allForces[_sroa_9_base + 11];
                            let af_f3_x = _b_allForces[_sroa_9_base + 12];
                            let af_f3_y = _b_allForces[_sroa_9_base + 13];
                            let af_f3_z = _b_allForces[_sroa_9_base + 14];
                            let af_f3_w = _b_allForces[_sroa_9_base + 15];
                            let af_f4_x = _b_allForces[_sroa_9_base + 16];
                            let af_f4_y = _b_allForces[_sroa_9_base + 17];
                            let af_f4_z = _b_allForces[_sroa_9_base + 18];
                            let af_f4_w = _b_allForces[_sroa_9_base + 19];
                            let af_f5_x = _b_allForces[_sroa_9_base + 20];
                            let af_f5_y = _b_allForces[_sroa_9_base + 21];
                            let af_f5_z = _b_allForces[_sroa_9_base + 22];
                            let af_f5_w = _b_allForces[_sroa_9_base + 23];
                            let af_torques_x = _b_allForces[_sroa_9_base + 24];
                            let af_torques_y = _b_allForces[_sroa_9_base + 25];
                            let af_torques_z = _b_allForces[_sroa_9_base + 26];
                            let af_torques_w = _b_allForces[_sroa_9_base + 27];
                            let af_bFields_x = _b_allForces[_sroa_9_base + 28];
                            let af_bFields_y = _b_allForces[_sroa_9_base + 29];
                            let af_bFields_z = _b_allForces[_sroa_9_base + 30];
                            let af_bFields_w = _b_allForces[_sroa_9_base + 31];
                            let af_bFieldGrads_x = _b_allForces[_sroa_9_base + 32];
                            let af_bFieldGrads_y = _b_allForces[_sroa_9_base + 33];
                            let af_bFieldGrads_z = _b_allForces[_sroa_9_base + 34];
                            let af_bFieldGrads_w = _b_allForces[_sroa_9_base + 35];
                            let af_totalForce_x = _b_allForces[_sroa_9_base + 36];
                            let af_totalForce_y = _b_allForces[_sroa_9_base + 37];
                            let af_jerk_x = _b_allForces[_sroa_9_base + 38];
                            let af_jerk_y = _b_allForces[_sroa_9_base + 39];
                            af_f4_z = (af_f4_z + fx);
                            af_f4_w = (af_f4_w + fy);
                            af_totalForce_x = (af_totalForce_x + fx);
                            af_totalForce_y = (af_totalForce_y + fy);
                            {
                                const _wbase = ((pid) * 40);
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
                        const _sroa_10_base = ((pid) * 9);
                        let p_posX = _b_particles[_sroa_10_base + 0];
                        let p_posY = _b_particles[_sroa_10_base + 1];
                        let p_velWX = _b_particles[_sroa_10_base + 2];
                        let p_velWY = _b_particles[_sroa_10_base + 3];
                        let p_mass = _b_particles[_sroa_10_base + 4];
                        let p_charge = _b_particles[_sroa_10_base + 5];
                        let p_angW = _b_particles[_sroa_10_base + 6];
                        let p_baseMass = _b_particles[_sroa_10_base + 7];
                        let p_flags = _b_particles[_sroa_10_base + 8];
                        const flag = p_flags;
                        if ((((flag & 1)) == 0)) {
                            break __invocation;
                        }
                        const bm = p_baseMass;
                        if ((bm < EPSILON)) {
                            break __invocation;
                        }
                        const px = p_posX;
                        const py = p_posY;
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const invCellW = (1.0 / cellW);
                        const invCellH = (1.0 / cellH);
                        const bcMode = _u_uniforms_boundaryMode;
                        const topoMode = _u_uniforms_topologyMode;
                        const phiLocal = pqsInterpolate(_b_higgsField, px, py, invCellW, invCellH, bcMode, topoMode, 1.0);
                        const hmFloor = _u_uniforms_higgsMassFloor;
                        const _sroa_11_base = ((pid) * 4 + 0);
                        let aym_x = _b_axYukMod[_sroa_11_base + 0];
                        let aym_y = _b_axYukMod[_sroa_11_base + 1];
                        let aym_z = _b_axYukMod[_sroa_11_base + 2];
                        let aym_w = _b_axYukMod[_sroa_11_base + 3];
                        aym_z = ((Math.abs(phiLocal)) < (hmFloor) ? (hmFloor) : (Math.abs(phiLocal)));
                        {
                            const _wbase = ((pid) * 4 + 0);
                            const _wt0 = aym_x;
                            const _wt1 = aym_y;
                            const _wt2 = aym_z;
                            const _wt3 = aym_w;
                            _b_axYukMod[_wbase + 0] = _wt0;
                            _b_axYukMod[_wbase + 1] = _wt1;
                            _b_axYukMod[_wbase + 2] = _wt2;
                            _b_axYukMod[_wbase + 3] = _wt3;
                        }
                        const floor = hmFloor;
                        const targetMass = (((bm * Math.abs(phiLocal))) < ((floor * bm)) ? ((floor * bm)) : ((bm * Math.abs(phiLocal))));
                        const maxDelta = (_u_uniforms_higgsMassMaxDelta * _u_uniforms_dt);
                        const currentMass = p_mass;
                        const diff = (targetMass - currentMass);
                        const clampedDiff = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(diff, (-maxDelta), maxDelta));
                        const newMass = (((currentMass + clampedDiff)) < (MIN_MASS) ? (MIN_MASS) : ((currentMass + clampedDiff)));
                        const massRatio = (currentMass / newMass);
                        p_velWX = (p_velWX * massRatio);
                        p_velWY = (p_velWY * massRatio);
                        p_mass = newMass;
                        {
                            const _wbase = ((pid) * 9);
                            _b_particles[_wbase + 0] = p_posX;
                            _b_particles[_wbase + 1] = p_posY;
                            _b_particles[_wbase + 2] = p_velWX;
                            _b_particles[_wbase + 3] = p_velWY;
                            _b_particles[_wbase + 4] = p_mass;
                            _b_particles[_wbase + 5] = p_charge;
                            _b_particles[_wbase + 6] = p_angW;
                            _b_particles[_wbase + 7] = p_baseMass;
                            _b_particles[_wbase + 8] = p_flags;
                        }
                        const bodyR = Math.pow(newMass, 0.3333333333333333);
                        const bodyRSq = (bodyR * bodyR);
                        const _sroa_12_base = ((pid) * 8);
                        let d_magMoment = _b_derived[_sroa_12_base + 0];
                        let d_angMomentum = _b_derived[_sroa_12_base + 1];
                        let d_invMass = _b_derived[_sroa_12_base + 2];
                        let d_radiusSq = _b_derived[_sroa_12_base + 3];
                        let d_velX = _b_derived[_sroa_12_base + 4];
                        let d_velY = _b_derived[_sroa_12_base + 5];
                        let d_angVel = _b_derived[_sroa_12_base + 6];
                        let d_bodyRSq = _b_derived[_sroa_12_base + 7];
                        d_invMass = ((newMass > EPSILON) ? (1.0 / newMass) : 0.0);
                        d_bodyRSq = bodyRSq;
                        const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                        if ((_u_uniforms_relativityEnabled != 0)) {
                            const gamma = Math.sqrt((1.0 + wSq));
                            d_velX = (p_velWX / gamma);
                            d_velY = (p_velWY / gamma);
                        } else {
                            d_velX = p_velWX;
                            d_velY = p_velWY;
                        }
                        const sr = (p_angW * bodyR);
                        if ((_u_uniforms_relativityEnabled != 0)) {
                            d_angVel = (p_angW / Math.sqrt((1.0 + (sr * sr))));
                        } else {
                            d_angVel = p_angW;
                        }
                        let activeR = bodyR;
                        if ((_u_uniforms_blackHoleEnabled != 0)) {
                            const a = ((INERTIA_K * bodyRSq) * Math.abs(d_angVel));
                            const disc = (((newMass * newMass) - (a * a)) - (p_charge * p_charge));
                            activeR = ((disc >= 0.0) ? (newMass + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : newMass);
                        }
                        d_radiusSq = (activeR * activeR);
                        d_magMoment = (((MAG_MOMENT_K * p_charge) * d_angVel) * bodyRSq);
                        d_angMomentum = (((INERTIA_K * newMass) * bodyRSq) * d_angVel);
                        {
                            const _wbase = ((pid) * 8);
                            _b_derived[_wbase + 0] = d_magMoment;
                            _b_derived[_wbase + 1] = d_angMomentum;
                            _b_derived[_wbase + 2] = d_invMass;
                            _b_derived[_wbase + 3] = d_radiusSq;
                            _b_derived[_wbase + 4] = d_velX;
                            _b_derived[_wbase + 5] = d_velY;
                            _b_derived[_wbase + 6] = d_angVel;
                            _b_derived[_wbase + 7] = d_bodyRSq;
                        }
                        const _sroa_13 = pqsGradient(_b_higgsGradX, _b_higgsGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                        const grad_x = _sroa_13.x;
                        const grad_y = _sroa_13.y;
                        const signPhi = ((phiLocal >= 0.0) ? 1.0 : (-1.0));
                        const g = _u_uniforms_higgsCoupling;
                        const fx = (((g * bm) * signPhi) * grad_x);
                        const fy = (((g * bm) * signPhi) * grad_y);
                        const _sroa_14_base = ((pid) * 40);
                        let af_f0_x = _b_allForces[_sroa_14_base + 0];
                        let af_f0_y = _b_allForces[_sroa_14_base + 1];
                        let af_f0_z = _b_allForces[_sroa_14_base + 2];
                        let af_f0_w = _b_allForces[_sroa_14_base + 3];
                        let af_f1_x = _b_allForces[_sroa_14_base + 4];
                        let af_f1_y = _b_allForces[_sroa_14_base + 5];
                        let af_f1_z = _b_allForces[_sroa_14_base + 6];
                        let af_f1_w = _b_allForces[_sroa_14_base + 7];
                        let af_f2_x = _b_allForces[_sroa_14_base + 8];
                        let af_f2_y = _b_allForces[_sroa_14_base + 9];
                        let af_f2_z = _b_allForces[_sroa_14_base + 10];
                        let af_f2_w = _b_allForces[_sroa_14_base + 11];
                        let af_f3_x = _b_allForces[_sroa_14_base + 12];
                        let af_f3_y = _b_allForces[_sroa_14_base + 13];
                        let af_f3_z = _b_allForces[_sroa_14_base + 14];
                        let af_f3_w = _b_allForces[_sroa_14_base + 15];
                        let af_f4_x = _b_allForces[_sroa_14_base + 16];
                        let af_f4_y = _b_allForces[_sroa_14_base + 17];
                        let af_f4_z = _b_allForces[_sroa_14_base + 18];
                        let af_f4_w = _b_allForces[_sroa_14_base + 19];
                        let af_f5_x = _b_allForces[_sroa_14_base + 20];
                        let af_f5_y = _b_allForces[_sroa_14_base + 21];
                        let af_f5_z = _b_allForces[_sroa_14_base + 22];
                        let af_f5_w = _b_allForces[_sroa_14_base + 23];
                        let af_torques_x = _b_allForces[_sroa_14_base + 24];
                        let af_torques_y = _b_allForces[_sroa_14_base + 25];
                        let af_torques_z = _b_allForces[_sroa_14_base + 26];
                        let af_torques_w = _b_allForces[_sroa_14_base + 27];
                        let af_bFields_x = _b_allForces[_sroa_14_base + 28];
                        let af_bFields_y = _b_allForces[_sroa_14_base + 29];
                        let af_bFields_z = _b_allForces[_sroa_14_base + 30];
                        let af_bFields_w = _b_allForces[_sroa_14_base + 31];
                        let af_bFieldGrads_x = _b_allForces[_sroa_14_base + 32];
                        let af_bFieldGrads_y = _b_allForces[_sroa_14_base + 33];
                        let af_bFieldGrads_z = _b_allForces[_sroa_14_base + 34];
                        let af_bFieldGrads_w = _b_allForces[_sroa_14_base + 35];
                        let af_totalForce_x = _b_allForces[_sroa_14_base + 36];
                        let af_totalForce_y = _b_allForces[_sroa_14_base + 37];
                        let af_jerk_x = _b_allForces[_sroa_14_base + 38];
                        let af_jerk_y = _b_allForces[_sroa_14_base + 39];
                        af_f4_z = (af_f4_z + fx);
                        af_f4_w = (af_f4_w + fy);
                        af_totalForce_x = (af_totalForce_x + fx);
                        af_totalForce_y = (af_totalForce_y + fy);
                        {
                            const _wbase = ((pid) * 40);
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
                    const _sroa_15_base = ((pid) * 9);
                    let p_posX = _b_particles[_sroa_15_base + 0];
                    let p_posY = _b_particles[_sroa_15_base + 1];
                    let p_velWX = _b_particles[_sroa_15_base + 2];
                    let p_velWY = _b_particles[_sroa_15_base + 3];
                    let p_mass = _b_particles[_sroa_15_base + 4];
                    let p_charge = _b_particles[_sroa_15_base + 5];
                    let p_angW = _b_particles[_sroa_15_base + 6];
                    let p_baseMass = _b_particles[_sroa_15_base + 7];
                    let p_flags = _b_particles[_sroa_15_base + 8];
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const bm = p_baseMass;
                    if ((bm < EPSILON)) {
                        break __invocation;
                    }
                    const px = p_posX;
                    const py = p_posY;
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const invCellW = (1.0 / cellW);
                    const invCellH = (1.0 / cellH);
                    const bcMode = _u_uniforms_boundaryMode;
                    const topoMode = _u_uniforms_topologyMode;
                    const phiLocal = pqsInterpolate(_b_higgsField, px, py, invCellW, invCellH, bcMode, topoMode, 1.0);
                    const hmFloor = _u_uniforms_higgsMassFloor;
                    const _sroa_16_base = ((pid) * 4 + 0);
                    let aym_x = _b_axYukMod[_sroa_16_base + 0];
                    let aym_y = _b_axYukMod[_sroa_16_base + 1];
                    let aym_z = _b_axYukMod[_sroa_16_base + 2];
                    let aym_w = _b_axYukMod[_sroa_16_base + 3];
                    aym_z = ((Math.abs(phiLocal)) < (hmFloor) ? (hmFloor) : (Math.abs(phiLocal)));
                    {
                        const _wbase = ((pid) * 4 + 0);
                        const _wt0 = aym_x;
                        const _wt1 = aym_y;
                        const _wt2 = aym_z;
                        const _wt3 = aym_w;
                        _b_axYukMod[_wbase + 0] = _wt0;
                        _b_axYukMod[_wbase + 1] = _wt1;
                        _b_axYukMod[_wbase + 2] = _wt2;
                        _b_axYukMod[_wbase + 3] = _wt3;
                    }
                    const floor = hmFloor;
                    const targetMass = (((bm * Math.abs(phiLocal))) < ((floor * bm)) ? ((floor * bm)) : ((bm * Math.abs(phiLocal))));
                    const maxDelta = (_u_uniforms_higgsMassMaxDelta * _u_uniforms_dt);
                    const currentMass = p_mass;
                    const diff = (targetMass - currentMass);
                    const clampedDiff = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(diff, (-maxDelta), maxDelta));
                    const newMass = (((currentMass + clampedDiff)) < (MIN_MASS) ? (MIN_MASS) : ((currentMass + clampedDiff)));
                    const massRatio = (currentMass / newMass);
                    p_velWX = (p_velWX * massRatio);
                    p_velWY = (p_velWY * massRatio);
                    p_mass = newMass;
                    {
                        const _wbase = ((pid) * 9);
                        _b_particles[_wbase + 0] = p_posX;
                        _b_particles[_wbase + 1] = p_posY;
                        _b_particles[_wbase + 2] = p_velWX;
                        _b_particles[_wbase + 3] = p_velWY;
                        _b_particles[_wbase + 4] = p_mass;
                        _b_particles[_wbase + 5] = p_charge;
                        _b_particles[_wbase + 6] = p_angW;
                        _b_particles[_wbase + 7] = p_baseMass;
                        _b_particles[_wbase + 8] = p_flags;
                    }
                    const bodyR = Math.pow(newMass, 0.3333333333333333);
                    const bodyRSq = (bodyR * bodyR);
                    const _sroa_17_base = ((pid) * 8);
                    let d_magMoment = _b_derived[_sroa_17_base + 0];
                    let d_angMomentum = _b_derived[_sroa_17_base + 1];
                    let d_invMass = _b_derived[_sroa_17_base + 2];
                    let d_radiusSq = _b_derived[_sroa_17_base + 3];
                    let d_velX = _b_derived[_sroa_17_base + 4];
                    let d_velY = _b_derived[_sroa_17_base + 5];
                    let d_angVel = _b_derived[_sroa_17_base + 6];
                    let d_bodyRSq = _b_derived[_sroa_17_base + 7];
                    d_invMass = ((newMass > EPSILON) ? (1.0 / newMass) : 0.0);
                    d_bodyRSq = bodyRSq;
                    const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        const gamma = Math.sqrt((1.0 + wSq));
                        d_velX = (p_velWX / gamma);
                        d_velY = (p_velWY / gamma);
                    } else {
                        d_velX = p_velWX;
                        d_velY = p_velWY;
                    }
                    const sr = (p_angW * bodyR);
                    if ((_u_uniforms_relativityEnabled != 0)) {
                        d_angVel = (p_angW / Math.sqrt((1.0 + (sr * sr))));
                    } else {
                        d_angVel = p_angW;
                    }
                    let activeR = bodyR;
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const a = ((INERTIA_K * bodyRSq) * Math.abs(d_angVel));
                        const disc = (((newMass * newMass) - (a * a)) - (p_charge * p_charge));
                        activeR = ((disc >= 0.0) ? (newMass + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : newMass);
                    }
                    d_radiusSq = (activeR * activeR);
                    d_magMoment = (((MAG_MOMENT_K * p_charge) * d_angVel) * bodyRSq);
                    d_angMomentum = (((INERTIA_K * newMass) * bodyRSq) * d_angVel);
                    {
                        const _wbase = ((pid) * 8);
                        _b_derived[_wbase + 0] = d_magMoment;
                        _b_derived[_wbase + 1] = d_angMomentum;
                        _b_derived[_wbase + 2] = d_invMass;
                        _b_derived[_wbase + 3] = d_radiusSq;
                        _b_derived[_wbase + 4] = d_velX;
                        _b_derived[_wbase + 5] = d_velY;
                        _b_derived[_wbase + 6] = d_angVel;
                        _b_derived[_wbase + 7] = d_bodyRSq;
                    }
                    const _sroa_18 = pqsGradient(_b_higgsGradX, _b_higgsGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                    const grad_x = _sroa_18.x;
                    const grad_y = _sroa_18.y;
                    const signPhi = ((phiLocal >= 0.0) ? 1.0 : (-1.0));
                    const g = _u_uniforms_higgsCoupling;
                    const fx = (((g * bm) * signPhi) * grad_x);
                    const fy = (((g * bm) * signPhi) * grad_y);
                    const _sroa_19_base = ((pid) * 40);
                    let af_f0_x = _b_allForces[_sroa_19_base + 0];
                    let af_f0_y = _b_allForces[_sroa_19_base + 1];
                    let af_f0_z = _b_allForces[_sroa_19_base + 2];
                    let af_f0_w = _b_allForces[_sroa_19_base + 3];
                    let af_f1_x = _b_allForces[_sroa_19_base + 4];
                    let af_f1_y = _b_allForces[_sroa_19_base + 5];
                    let af_f1_z = _b_allForces[_sroa_19_base + 6];
                    let af_f1_w = _b_allForces[_sroa_19_base + 7];
                    let af_f2_x = _b_allForces[_sroa_19_base + 8];
                    let af_f2_y = _b_allForces[_sroa_19_base + 9];
                    let af_f2_z = _b_allForces[_sroa_19_base + 10];
                    let af_f2_w = _b_allForces[_sroa_19_base + 11];
                    let af_f3_x = _b_allForces[_sroa_19_base + 12];
                    let af_f3_y = _b_allForces[_sroa_19_base + 13];
                    let af_f3_z = _b_allForces[_sroa_19_base + 14];
                    let af_f3_w = _b_allForces[_sroa_19_base + 15];
                    let af_f4_x = _b_allForces[_sroa_19_base + 16];
                    let af_f4_y = _b_allForces[_sroa_19_base + 17];
                    let af_f4_z = _b_allForces[_sroa_19_base + 18];
                    let af_f4_w = _b_allForces[_sroa_19_base + 19];
                    let af_f5_x = _b_allForces[_sroa_19_base + 20];
                    let af_f5_y = _b_allForces[_sroa_19_base + 21];
                    let af_f5_z = _b_allForces[_sroa_19_base + 22];
                    let af_f5_w = _b_allForces[_sroa_19_base + 23];
                    let af_torques_x = _b_allForces[_sroa_19_base + 24];
                    let af_torques_y = _b_allForces[_sroa_19_base + 25];
                    let af_torques_z = _b_allForces[_sroa_19_base + 26];
                    let af_torques_w = _b_allForces[_sroa_19_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_19_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_19_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_19_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_19_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_19_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_19_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_19_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_19_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_19_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_19_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_19_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_19_base + 39];
                    af_f4_z = (af_f4_z + fx);
                    af_f4_w = (af_f4_w + fy);
                    af_totalForce_x = (af_totalForce_x + fx);
                    af_totalForce_y = (af_totalForce_y + fy);
                    {
                        const _wbase = ((pid) * 40);
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
            }
        }
    }
    entry["applyHiggsForces"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_applyHiggsForces(workgroups, bindings, domain, origin);
    };

    entryInfo["applyAxionForces"] = {"workgroupSize":[256,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_applyAxionForces(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_axionField = bindings.axionField;
        const _b_axionGradX = bindings.axionGradX;
        const _b_axionGradY = bindings.axionGradY;
        const _b_allForces = bindings.allForces;
        const _b_axYukMod = bindings.axYukMod;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_axionMass = _b_uniforms.axionMass;
        const _u_uniforms_axionCoupling = _b_uniforms.axionCoupling;
        const _u_uniforms_coulombEnabled = _b_uniforms.coulombEnabled;
        const _u_uniforms_yukawaEnabled = _b_uniforms.yukawaEnabled;
        const _u_uniforms_blackHoleEnabled = _b_uniforms.blackHoleEnabled;
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
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const px = p_posX;
                    const py = p_posY;
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const invCellW = (1.0 / cellW);
                    const invCellH = (1.0 / cellH);
                    const bcMode = _u_uniforms_boundaryMode;
                    const topoMode = _u_uniforms_topologyMode;
                    const g = _u_uniforms_axionCoupling;
                    const aLocal = pqsInterpolate(_b_axionField, px, py, invCellW, invCellH, bcMode, topoMode, 0.0);
                    const ga = (g * aLocal);
                    const _sroa_21_base = ((pid) * 4 + 0);
                    let aymVal_x = _b_axYukMod[_sroa_21_base + 0];
                    let aymVal_y = _b_axYukMod[_sroa_21_base + 1];
                    let aymVal_z = _b_axYukMod[_sroa_21_base + 2];
                    let aymVal_w = _b_axYukMod[_sroa_21_base + 3];
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        aymVal_x = ((ga > (-1.0)) ? (1.0 + ga) : 0.0);
                    } else {
                        aymVal_x = 1.0;
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const isAnti = (((flag & 4)) != 0);
                        const sign = (isAnti ? (-1.0) : 1.0);
                        const pq = (sign * ga);
                        aymVal_y = ((pq > (-1.0)) ? (1.0 + pq) : 0.0);
                    } else {
                        aymVal_y = 1.0;
                    }
                    let coupling = 0.0;
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        const q = p_charge;
                        const qSq = (q * q);
                        if ((qSq > EPSILON)) {
                            coupling = (coupling + qSq);
                        }
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const m = p_mass;
                        if ((m > EPSILON)) {
                            const isAnti = (((flag & 4)) != 0);
                            const sign = (isAnti ? (-1.0) : 1.0);
                            coupling = (coupling + (m * sign));
                        }
                    }
                    const _sroa_22_base = ((pid) * 40);
                    let af_f0_x = _b_allForces[_sroa_22_base + 0];
                    let af_f0_y = _b_allForces[_sroa_22_base + 1];
                    let af_f0_z = _b_allForces[_sroa_22_base + 2];
                    let af_f0_w = _b_allForces[_sroa_22_base + 3];
                    let af_f1_x = _b_allForces[_sroa_22_base + 4];
                    let af_f1_y = _b_allForces[_sroa_22_base + 5];
                    let af_f1_z = _b_allForces[_sroa_22_base + 6];
                    let af_f1_w = _b_allForces[_sroa_22_base + 7];
                    let af_f2_x = _b_allForces[_sroa_22_base + 8];
                    let af_f2_y = _b_allForces[_sroa_22_base + 9];
                    let af_f2_z = _b_allForces[_sroa_22_base + 10];
                    let af_f2_w = _b_allForces[_sroa_22_base + 11];
                    let af_f3_x = _b_allForces[_sroa_22_base + 12];
                    let af_f3_y = _b_allForces[_sroa_22_base + 13];
                    let af_f3_z = _b_allForces[_sroa_22_base + 14];
                    let af_f3_w = _b_allForces[_sroa_22_base + 15];
                    let af_f4_x = _b_allForces[_sroa_22_base + 16];
                    let af_f4_y = _b_allForces[_sroa_22_base + 17];
                    let af_f4_z = _b_allForces[_sroa_22_base + 18];
                    let af_f4_w = _b_allForces[_sroa_22_base + 19];
                    let af_f5_x = _b_allForces[_sroa_22_base + 20];
                    let af_f5_y = _b_allForces[_sroa_22_base + 21];
                    let af_f5_z = _b_allForces[_sroa_22_base + 22];
                    let af_f5_w = _b_allForces[_sroa_22_base + 23];
                    let af_torques_x = _b_allForces[_sroa_22_base + 24];
                    let af_torques_y = _b_allForces[_sroa_22_base + 25];
                    let af_torques_z = _b_allForces[_sroa_22_base + 26];
                    let af_torques_w = _b_allForces[_sroa_22_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_22_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_22_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_22_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_22_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_22_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_22_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_22_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_22_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_22_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_22_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_22_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_22_base + 39];
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const M = p_mass;
                        if ((M > MIN_MASS)) {
                            aymVal_w = (aLocal * aLocal);
                            const bodyRSq = Math.pow(M, 0.6666666666666666);
                            const angw = p_angW;
                            const absAngw = Math.abs(angw);
                            const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                            const a_sr = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                            const disc = (((M * M) - (a_sr * a_sr)) - (p_charge * p_charge));
                            const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                            const rPlusSq = (rPlus * rPlus);
                            const sigma = (rPlusSq + (a_sr * a_sr));
                            if ((sigma >= EPSILON)) {
                                const omegaH = (a_sr / sigma);
                                const muA = _u_uniforms_axionMass;
                                if ((omegaH > muA)) {
                                    const alphaG = (M * muA);
                                    const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + (aLocal * aLocal))));
                                    const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                                    af_f5_z = (((-signW) * rate) / muA);
                                }
                            }
                        }
                    }
                    {
                        const _wbase = ((pid) * 4 + 0);
                        const _wt0 = aymVal_x;
                        const _wt1 = aymVal_y;
                        const _wt2 = aymVal_z;
                        const _wt3 = aymVal_w;
                        _b_axYukMod[_wbase + 0] = _wt0;
                        _b_axYukMod[_wbase + 1] = _wt1;
                        _b_axYukMod[_wbase + 2] = _wt2;
                        _b_axYukMod[_wbase + 3] = _wt3;
                    }
                    if ((Math.abs(coupling) < EPSILON)) {
                        {
                            const _wbase = ((pid) * 40);
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
                        break __invocation;
                    }
                    const _sroa_23 = pqsGradient(_b_axionGradX, _b_axionGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                    const grad_x = _sroa_23.x;
                    const grad_y = _sroa_23.y;
                    const fx = ((g * coupling) * grad_x);
                    const fy = ((g * coupling) * grad_y);
                    af_f5_x = (af_f5_x + fx);
                    af_f5_y = (af_f5_y + fy);
                    af_totalForce_x = (af_totalForce_x + fx);
                    af_totalForce_y = (af_totalForce_y + fy);
                    {
                        const _wbase = ((pid) * 40);
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
                            const _sroa_24_base = ((pid) * 9);
                            const p_posX = _b_particles[_sroa_24_base + 0];
                            const p_posY = _b_particles[_sroa_24_base + 1];
                            const p_velWX = _b_particles[_sroa_24_base + 2];
                            const p_velWY = _b_particles[_sroa_24_base + 3];
                            const p_mass = _b_particles[_sroa_24_base + 4];
                            const p_charge = _b_particles[_sroa_24_base + 5];
                            const p_angW = _b_particles[_sroa_24_base + 6];
                            const p_baseMass = _b_particles[_sroa_24_base + 7];
                            const p_flags = _b_particles[_sroa_24_base + 8];
                            const flag = p_flags;
                            if ((((flag & 1)) == 0)) {
                                break __invocation;
                            }
                            const px = p_posX;
                            const py = p_posY;
                            const cellW = (_u_uniforms_domainW / (+(GRID)));
                            const cellH = (_u_uniforms_domainH / (+(GRID)));
                            if (((cellW < EPSILON) || (cellH < EPSILON))) {
                                break __invocation;
                            }
                            const invCellW = (1.0 / cellW);
                            const invCellH = (1.0 / cellH);
                            const bcMode = _u_uniforms_boundaryMode;
                            const topoMode = _u_uniforms_topologyMode;
                            const g = _u_uniforms_axionCoupling;
                            const aLocal = pqsInterpolate(_b_axionField, px, py, invCellW, invCellH, bcMode, topoMode, 0.0);
                            const ga = (g * aLocal);
                            const _sroa_25_base = ((pid) * 4 + 0);
                            let aymVal_x = _b_axYukMod[_sroa_25_base + 0];
                            let aymVal_y = _b_axYukMod[_sroa_25_base + 1];
                            let aymVal_z = _b_axYukMod[_sroa_25_base + 2];
                            let aymVal_w = _b_axYukMod[_sroa_25_base + 3];
                            if ((_u_uniforms_coulombEnabled != 0)) {
                                aymVal_x = ((ga > (-1.0)) ? (1.0 + ga) : 0.0);
                            } else {
                                aymVal_x = 1.0;
                            }
                            if ((_u_uniforms_yukawaEnabled != 0)) {
                                const isAnti = (((flag & 4)) != 0);
                                const sign = (isAnti ? (-1.0) : 1.0);
                                const pq = (sign * ga);
                                aymVal_y = ((pq > (-1.0)) ? (1.0 + pq) : 0.0);
                            } else {
                                aymVal_y = 1.0;
                            }
                            let coupling = 0.0;
                            if ((_u_uniforms_coulombEnabled != 0)) {
                                const q = p_charge;
                                const qSq = (q * q);
                                if ((qSq > EPSILON)) {
                                    coupling = (coupling + qSq);
                                }
                            }
                            if ((_u_uniforms_yukawaEnabled != 0)) {
                                const m = p_mass;
                                if ((m > EPSILON)) {
                                    const isAnti = (((flag & 4)) != 0);
                                    const sign = (isAnti ? (-1.0) : 1.0);
                                    coupling = (coupling + (m * sign));
                                }
                            }
                            const _sroa_26_base = ((pid) * 40);
                            let af_f0_x = _b_allForces[_sroa_26_base + 0];
                            let af_f0_y = _b_allForces[_sroa_26_base + 1];
                            let af_f0_z = _b_allForces[_sroa_26_base + 2];
                            let af_f0_w = _b_allForces[_sroa_26_base + 3];
                            let af_f1_x = _b_allForces[_sroa_26_base + 4];
                            let af_f1_y = _b_allForces[_sroa_26_base + 5];
                            let af_f1_z = _b_allForces[_sroa_26_base + 6];
                            let af_f1_w = _b_allForces[_sroa_26_base + 7];
                            let af_f2_x = _b_allForces[_sroa_26_base + 8];
                            let af_f2_y = _b_allForces[_sroa_26_base + 9];
                            let af_f2_z = _b_allForces[_sroa_26_base + 10];
                            let af_f2_w = _b_allForces[_sroa_26_base + 11];
                            let af_f3_x = _b_allForces[_sroa_26_base + 12];
                            let af_f3_y = _b_allForces[_sroa_26_base + 13];
                            let af_f3_z = _b_allForces[_sroa_26_base + 14];
                            let af_f3_w = _b_allForces[_sroa_26_base + 15];
                            let af_f4_x = _b_allForces[_sroa_26_base + 16];
                            let af_f4_y = _b_allForces[_sroa_26_base + 17];
                            let af_f4_z = _b_allForces[_sroa_26_base + 18];
                            let af_f4_w = _b_allForces[_sroa_26_base + 19];
                            let af_f5_x = _b_allForces[_sroa_26_base + 20];
                            let af_f5_y = _b_allForces[_sroa_26_base + 21];
                            let af_f5_z = _b_allForces[_sroa_26_base + 22];
                            let af_f5_w = _b_allForces[_sroa_26_base + 23];
                            let af_torques_x = _b_allForces[_sroa_26_base + 24];
                            let af_torques_y = _b_allForces[_sroa_26_base + 25];
                            let af_torques_z = _b_allForces[_sroa_26_base + 26];
                            let af_torques_w = _b_allForces[_sroa_26_base + 27];
                            let af_bFields_x = _b_allForces[_sroa_26_base + 28];
                            let af_bFields_y = _b_allForces[_sroa_26_base + 29];
                            let af_bFields_z = _b_allForces[_sroa_26_base + 30];
                            let af_bFields_w = _b_allForces[_sroa_26_base + 31];
                            let af_bFieldGrads_x = _b_allForces[_sroa_26_base + 32];
                            let af_bFieldGrads_y = _b_allForces[_sroa_26_base + 33];
                            let af_bFieldGrads_z = _b_allForces[_sroa_26_base + 34];
                            let af_bFieldGrads_w = _b_allForces[_sroa_26_base + 35];
                            let af_totalForce_x = _b_allForces[_sroa_26_base + 36];
                            let af_totalForce_y = _b_allForces[_sroa_26_base + 37];
                            let af_jerk_x = _b_allForces[_sroa_26_base + 38];
                            let af_jerk_y = _b_allForces[_sroa_26_base + 39];
                            if ((_u_uniforms_blackHoleEnabled != 0)) {
                                const M = p_mass;
                                if ((M > MIN_MASS)) {
                                    aymVal_w = (aLocal * aLocal);
                                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                                    const angw = p_angW;
                                    const absAngw = Math.abs(angw);
                                    const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                                    const a_sr = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                                    const disc = (((M * M) - (a_sr * a_sr)) - (p_charge * p_charge));
                                    const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                                    const rPlusSq = (rPlus * rPlus);
                                    const sigma = (rPlusSq + (a_sr * a_sr));
                                    if ((sigma >= EPSILON)) {
                                        const omegaH = (a_sr / sigma);
                                        const muA = _u_uniforms_axionMass;
                                        if ((omegaH > muA)) {
                                            const alphaG = (M * muA);
                                            const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + (aLocal * aLocal))));
                                            const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                                            af_f5_z = (((-signW) * rate) / muA);
                                        }
                                    }
                                }
                            }
                            {
                                const _wbase = ((pid) * 4 + 0);
                                const _wt0 = aymVal_x;
                                const _wt1 = aymVal_y;
                                const _wt2 = aymVal_z;
                                const _wt3 = aymVal_w;
                                _b_axYukMod[_wbase + 0] = _wt0;
                                _b_axYukMod[_wbase + 1] = _wt1;
                                _b_axYukMod[_wbase + 2] = _wt2;
                                _b_axYukMod[_wbase + 3] = _wt3;
                            }
                            if ((Math.abs(coupling) < EPSILON)) {
                                {
                                    const _wbase = ((pid) * 40);
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
                                break __invocation;
                            }
                            const _sroa_27 = pqsGradient(_b_axionGradX, _b_axionGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                            const grad_x = _sroa_27.x;
                            const grad_y = _sroa_27.y;
                            const fx = ((g * coupling) * grad_x);
                            const fy = ((g * coupling) * grad_y);
                            af_f5_x = (af_f5_x + fx);
                            af_f5_y = (af_f5_y + fy);
                            af_totalForce_x = (af_totalForce_x + fx);
                            af_totalForce_y = (af_totalForce_y + fy);
                            {
                                const _wbase = ((pid) * 40);
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
                        const _sroa_28_base = ((pid) * 9);
                        const p_posX = _b_particles[_sroa_28_base + 0];
                        const p_posY = _b_particles[_sroa_28_base + 1];
                        const p_velWX = _b_particles[_sroa_28_base + 2];
                        const p_velWY = _b_particles[_sroa_28_base + 3];
                        const p_mass = _b_particles[_sroa_28_base + 4];
                        const p_charge = _b_particles[_sroa_28_base + 5];
                        const p_angW = _b_particles[_sroa_28_base + 6];
                        const p_baseMass = _b_particles[_sroa_28_base + 7];
                        const p_flags = _b_particles[_sroa_28_base + 8];
                        const flag = p_flags;
                        if ((((flag & 1)) == 0)) {
                            break __invocation;
                        }
                        const px = p_posX;
                        const py = p_posY;
                        const cellW = (_u_uniforms_domainW / (+(GRID)));
                        const cellH = (_u_uniforms_domainH / (+(GRID)));
                        if (((cellW < EPSILON) || (cellH < EPSILON))) {
                            break __invocation;
                        }
                        const invCellW = (1.0 / cellW);
                        const invCellH = (1.0 / cellH);
                        const bcMode = _u_uniforms_boundaryMode;
                        const topoMode = _u_uniforms_topologyMode;
                        const g = _u_uniforms_axionCoupling;
                        const aLocal = pqsInterpolate(_b_axionField, px, py, invCellW, invCellH, bcMode, topoMode, 0.0);
                        const ga = (g * aLocal);
                        const _sroa_29_base = ((pid) * 4 + 0);
                        let aymVal_x = _b_axYukMod[_sroa_29_base + 0];
                        let aymVal_y = _b_axYukMod[_sroa_29_base + 1];
                        let aymVal_z = _b_axYukMod[_sroa_29_base + 2];
                        let aymVal_w = _b_axYukMod[_sroa_29_base + 3];
                        if ((_u_uniforms_coulombEnabled != 0)) {
                            aymVal_x = ((ga > (-1.0)) ? (1.0 + ga) : 0.0);
                        } else {
                            aymVal_x = 1.0;
                        }
                        if ((_u_uniforms_yukawaEnabled != 0)) {
                            const isAnti = (((flag & 4)) != 0);
                            const sign = (isAnti ? (-1.0) : 1.0);
                            const pq = (sign * ga);
                            aymVal_y = ((pq > (-1.0)) ? (1.0 + pq) : 0.0);
                        } else {
                            aymVal_y = 1.0;
                        }
                        let coupling = 0.0;
                        if ((_u_uniforms_coulombEnabled != 0)) {
                            const q = p_charge;
                            const qSq = (q * q);
                            if ((qSq > EPSILON)) {
                                coupling = (coupling + qSq);
                            }
                        }
                        if ((_u_uniforms_yukawaEnabled != 0)) {
                            const m = p_mass;
                            if ((m > EPSILON)) {
                                const isAnti = (((flag & 4)) != 0);
                                const sign = (isAnti ? (-1.0) : 1.0);
                                coupling = (coupling + (m * sign));
                            }
                        }
                        const _sroa_30_base = ((pid) * 40);
                        let af_f0_x = _b_allForces[_sroa_30_base + 0];
                        let af_f0_y = _b_allForces[_sroa_30_base + 1];
                        let af_f0_z = _b_allForces[_sroa_30_base + 2];
                        let af_f0_w = _b_allForces[_sroa_30_base + 3];
                        let af_f1_x = _b_allForces[_sroa_30_base + 4];
                        let af_f1_y = _b_allForces[_sroa_30_base + 5];
                        let af_f1_z = _b_allForces[_sroa_30_base + 6];
                        let af_f1_w = _b_allForces[_sroa_30_base + 7];
                        let af_f2_x = _b_allForces[_sroa_30_base + 8];
                        let af_f2_y = _b_allForces[_sroa_30_base + 9];
                        let af_f2_z = _b_allForces[_sroa_30_base + 10];
                        let af_f2_w = _b_allForces[_sroa_30_base + 11];
                        let af_f3_x = _b_allForces[_sroa_30_base + 12];
                        let af_f3_y = _b_allForces[_sroa_30_base + 13];
                        let af_f3_z = _b_allForces[_sroa_30_base + 14];
                        let af_f3_w = _b_allForces[_sroa_30_base + 15];
                        let af_f4_x = _b_allForces[_sroa_30_base + 16];
                        let af_f4_y = _b_allForces[_sroa_30_base + 17];
                        let af_f4_z = _b_allForces[_sroa_30_base + 18];
                        let af_f4_w = _b_allForces[_sroa_30_base + 19];
                        let af_f5_x = _b_allForces[_sroa_30_base + 20];
                        let af_f5_y = _b_allForces[_sroa_30_base + 21];
                        let af_f5_z = _b_allForces[_sroa_30_base + 22];
                        let af_f5_w = _b_allForces[_sroa_30_base + 23];
                        let af_torques_x = _b_allForces[_sroa_30_base + 24];
                        let af_torques_y = _b_allForces[_sroa_30_base + 25];
                        let af_torques_z = _b_allForces[_sroa_30_base + 26];
                        let af_torques_w = _b_allForces[_sroa_30_base + 27];
                        let af_bFields_x = _b_allForces[_sroa_30_base + 28];
                        let af_bFields_y = _b_allForces[_sroa_30_base + 29];
                        let af_bFields_z = _b_allForces[_sroa_30_base + 30];
                        let af_bFields_w = _b_allForces[_sroa_30_base + 31];
                        let af_bFieldGrads_x = _b_allForces[_sroa_30_base + 32];
                        let af_bFieldGrads_y = _b_allForces[_sroa_30_base + 33];
                        let af_bFieldGrads_z = _b_allForces[_sroa_30_base + 34];
                        let af_bFieldGrads_w = _b_allForces[_sroa_30_base + 35];
                        let af_totalForce_x = _b_allForces[_sroa_30_base + 36];
                        let af_totalForce_y = _b_allForces[_sroa_30_base + 37];
                        let af_jerk_x = _b_allForces[_sroa_30_base + 38];
                        let af_jerk_y = _b_allForces[_sroa_30_base + 39];
                        if ((_u_uniforms_blackHoleEnabled != 0)) {
                            const M = p_mass;
                            if ((M > MIN_MASS)) {
                                aymVal_w = (aLocal * aLocal);
                                const bodyRSq = Math.pow(M, 0.6666666666666666);
                                const angw = p_angW;
                                const absAngw = Math.abs(angw);
                                const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                                const a_sr = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                                const disc = (((M * M) - (a_sr * a_sr)) - (p_charge * p_charge));
                                const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                                const rPlusSq = (rPlus * rPlus);
                                const sigma = (rPlusSq + (a_sr * a_sr));
                                if ((sigma >= EPSILON)) {
                                    const omegaH = (a_sr / sigma);
                                    const muA = _u_uniforms_axionMass;
                                    if ((omegaH > muA)) {
                                        const alphaG = (M * muA);
                                        const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + (aLocal * aLocal))));
                                        const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                                        af_f5_z = (((-signW) * rate) / muA);
                                    }
                                }
                            }
                        }
                        {
                            const _wbase = ((pid) * 4 + 0);
                            const _wt0 = aymVal_x;
                            const _wt1 = aymVal_y;
                            const _wt2 = aymVal_z;
                            const _wt3 = aymVal_w;
                            _b_axYukMod[_wbase + 0] = _wt0;
                            _b_axYukMod[_wbase + 1] = _wt1;
                            _b_axYukMod[_wbase + 2] = _wt2;
                            _b_axYukMod[_wbase + 3] = _wt3;
                        }
                        if ((Math.abs(coupling) < EPSILON)) {
                            {
                                const _wbase = ((pid) * 40);
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
                            break __invocation;
                        }
                        const _sroa_31 = pqsGradient(_b_axionGradX, _b_axionGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                        const grad_x = _sroa_31.x;
                        const grad_y = _sroa_31.y;
                        const fx = ((g * coupling) * grad_x);
                        const fy = ((g * coupling) * grad_y);
                        af_f5_x = (af_f5_x + fx);
                        af_f5_y = (af_f5_y + fy);
                        af_totalForce_x = (af_totalForce_x + fx);
                        af_totalForce_y = (af_totalForce_y + fy);
                        {
                            const _wbase = ((pid) * 40);
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
                    const _sroa_32_base = ((pid) * 9);
                    const p_posX = _b_particles[_sroa_32_base + 0];
                    const p_posY = _b_particles[_sroa_32_base + 1];
                    const p_velWX = _b_particles[_sroa_32_base + 2];
                    const p_velWY = _b_particles[_sroa_32_base + 3];
                    const p_mass = _b_particles[_sroa_32_base + 4];
                    const p_charge = _b_particles[_sroa_32_base + 5];
                    const p_angW = _b_particles[_sroa_32_base + 6];
                    const p_baseMass = _b_particles[_sroa_32_base + 7];
                    const p_flags = _b_particles[_sroa_32_base + 8];
                    const flag = p_flags;
                    if ((((flag & 1)) == 0)) {
                        break __invocation;
                    }
                    const px = p_posX;
                    const py = p_posY;
                    const cellW = (_u_uniforms_domainW / (+(GRID)));
                    const cellH = (_u_uniforms_domainH / (+(GRID)));
                    if (((cellW < EPSILON) || (cellH < EPSILON))) {
                        break __invocation;
                    }
                    const invCellW = (1.0 / cellW);
                    const invCellH = (1.0 / cellH);
                    const bcMode = _u_uniforms_boundaryMode;
                    const topoMode = _u_uniforms_topologyMode;
                    const g = _u_uniforms_axionCoupling;
                    const aLocal = pqsInterpolate(_b_axionField, px, py, invCellW, invCellH, bcMode, topoMode, 0.0);
                    const ga = (g * aLocal);
                    const _sroa_33_base = ((pid) * 4 + 0);
                    let aymVal_x = _b_axYukMod[_sroa_33_base + 0];
                    let aymVal_y = _b_axYukMod[_sroa_33_base + 1];
                    let aymVal_z = _b_axYukMod[_sroa_33_base + 2];
                    let aymVal_w = _b_axYukMod[_sroa_33_base + 3];
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        aymVal_x = ((ga > (-1.0)) ? (1.0 + ga) : 0.0);
                    } else {
                        aymVal_x = 1.0;
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const isAnti = (((flag & 4)) != 0);
                        const sign = (isAnti ? (-1.0) : 1.0);
                        const pq = (sign * ga);
                        aymVal_y = ((pq > (-1.0)) ? (1.0 + pq) : 0.0);
                    } else {
                        aymVal_y = 1.0;
                    }
                    let coupling = 0.0;
                    if ((_u_uniforms_coulombEnabled != 0)) {
                        const q = p_charge;
                        const qSq = (q * q);
                        if ((qSq > EPSILON)) {
                            coupling = (coupling + qSq);
                        }
                    }
                    if ((_u_uniforms_yukawaEnabled != 0)) {
                        const m = p_mass;
                        if ((m > EPSILON)) {
                            const isAnti = (((flag & 4)) != 0);
                            const sign = (isAnti ? (-1.0) : 1.0);
                            coupling = (coupling + (m * sign));
                        }
                    }
                    const _sroa_34_base = ((pid) * 40);
                    let af_f0_x = _b_allForces[_sroa_34_base + 0];
                    let af_f0_y = _b_allForces[_sroa_34_base + 1];
                    let af_f0_z = _b_allForces[_sroa_34_base + 2];
                    let af_f0_w = _b_allForces[_sroa_34_base + 3];
                    let af_f1_x = _b_allForces[_sroa_34_base + 4];
                    let af_f1_y = _b_allForces[_sroa_34_base + 5];
                    let af_f1_z = _b_allForces[_sroa_34_base + 6];
                    let af_f1_w = _b_allForces[_sroa_34_base + 7];
                    let af_f2_x = _b_allForces[_sroa_34_base + 8];
                    let af_f2_y = _b_allForces[_sroa_34_base + 9];
                    let af_f2_z = _b_allForces[_sroa_34_base + 10];
                    let af_f2_w = _b_allForces[_sroa_34_base + 11];
                    let af_f3_x = _b_allForces[_sroa_34_base + 12];
                    let af_f3_y = _b_allForces[_sroa_34_base + 13];
                    let af_f3_z = _b_allForces[_sroa_34_base + 14];
                    let af_f3_w = _b_allForces[_sroa_34_base + 15];
                    let af_f4_x = _b_allForces[_sroa_34_base + 16];
                    let af_f4_y = _b_allForces[_sroa_34_base + 17];
                    let af_f4_z = _b_allForces[_sroa_34_base + 18];
                    let af_f4_w = _b_allForces[_sroa_34_base + 19];
                    let af_f5_x = _b_allForces[_sroa_34_base + 20];
                    let af_f5_y = _b_allForces[_sroa_34_base + 21];
                    let af_f5_z = _b_allForces[_sroa_34_base + 22];
                    let af_f5_w = _b_allForces[_sroa_34_base + 23];
                    let af_torques_x = _b_allForces[_sroa_34_base + 24];
                    let af_torques_y = _b_allForces[_sroa_34_base + 25];
                    let af_torques_z = _b_allForces[_sroa_34_base + 26];
                    let af_torques_w = _b_allForces[_sroa_34_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_34_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_34_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_34_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_34_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_34_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_34_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_34_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_34_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_34_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_34_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_34_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_34_base + 39];
                    if ((_u_uniforms_blackHoleEnabled != 0)) {
                        const M = p_mass;
                        if ((M > MIN_MASS)) {
                            aymVal_w = (aLocal * aLocal);
                            const bodyRSq = Math.pow(M, 0.6666666666666666);
                            const angw = p_angW;
                            const absAngw = Math.abs(angw);
                            const angvel = (angw / Math.sqrt((1.0 + ((absAngw * absAngw) * bodyRSq))));
                            const a_sr = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                            const disc = (((M * M) - (a_sr * a_sr)) - (p_charge * p_charge));
                            const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                            const rPlusSq = (rPlus * rPlus);
                            const sigma = (rPlusSq + (a_sr * a_sr));
                            if ((sigma >= EPSILON)) {
                                const omegaH = (a_sr / sigma);
                                const muA = _u_uniforms_axionMass;
                                if ((omegaH > muA)) {
                                    const alphaG = (M * muA);
                                    const rate = (((alphaG * alphaG) * ((omegaH - muA))) * ((1.0 + (aLocal * aLocal))));
                                    const signW = ((angw > 0.0) ? 1.0 : (-1.0));
                                    af_f5_z = (((-signW) * rate) / muA);
                                }
                            }
                        }
                    }
                    {
                        const _wbase = ((pid) * 4 + 0);
                        const _wt0 = aymVal_x;
                        const _wt1 = aymVal_y;
                        const _wt2 = aymVal_z;
                        const _wt3 = aymVal_w;
                        _b_axYukMod[_wbase + 0] = _wt0;
                        _b_axYukMod[_wbase + 1] = _wt1;
                        _b_axYukMod[_wbase + 2] = _wt2;
                        _b_axYukMod[_wbase + 3] = _wt3;
                    }
                    if ((Math.abs(coupling) < EPSILON)) {
                        {
                            const _wbase = ((pid) * 40);
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
                        break __invocation;
                    }
                    const _sroa_35 = pqsGradient(_b_axionGradX, _b_axionGradY, px, py, invCellW, invCellH, bcMode, topoMode);
                    const grad_x = _sroa_35.x;
                    const grad_y = _sroa_35.y;
                    const fx = ((g * coupling) * grad_x);
                    const fy = ((g * coupling) * grad_y);
                    af_f5_x = (af_f5_x + fx);
                    af_f5_y = (af_f5_y + fy);
                    af_totalForce_x = (af_totalForce_x + fx);
                    af_totalForce_y = (af_totalForce_y + fy);
                    {
                        const _wbase = ((pid) * 40);
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
            }
        }
    }
    entry["applyAxionForces"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_applyAxionForces(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["applyHiggsForces"] = function (workgroups, domain, origin) {
            return __entry_0_applyHiggsForces(workgroups, bindings, domain, origin);
        };
        bound["applyAxionForces"] = function (workgroups, domain, origin) {
            return __entry_1_applyAxionForces(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["particles","derived","higgsField","higgsGradX","higgsGradY","axionField","axionGradX","axionGradY","allForces","axYukMod","uniforms"], entryInfo };
}
