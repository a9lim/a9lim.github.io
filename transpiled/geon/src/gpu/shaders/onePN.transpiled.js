// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/onePN.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: ce20ea8fa5385e7f66e8f73f5ae7c1ecb42d19692527391ace2f90f844f9e7e0
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":232354,"lines":3836,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":1,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.864Z
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
    const NONE = (-1);
    const MAX_STACK = 48;

    function fullMinImageP(ox, oy, sx, sy, domW, domH, topo) {
        const halfW = (domW * 0.5);
        const halfH = (domH * 0.5);
        if ((topo == TOPO_TORUS)) {
            let rx = (sx - ox);
            if ((rx > halfW)) {
                rx = (rx - domW);
            } else if ((rx < (-halfW))) {
                rx = (rx + domW);
            }
            let ry = (sy - oy);
            if ((ry > halfH)) {
                ry = (ry - domH);
            } else if ((ry < (-halfH))) {
                ry = (ry + domH);
            }
            return {x:rx, y:ry};
        }
        let dx0 = (sx - ox);
        let dy0 = (sy - oy);
        if ((topo == TOPO_KLEIN)) {
            if ((dx0 > halfW)) {
                dx0 = (dx0 - domW);
            } else if ((dx0 < (-halfW))) {
                dx0 = (dx0 + domW);
            }
        }
        let bestSq = ((dx0 * dx0) + (dy0 * dy0));
        let bestDx = dx0;
        let bestDy = dy0;
        if ((topo == TOPO_KLEIN)) {
            const gx = (domW - sx);
            let dx1 = (gx - ox);
            if ((dx1 > halfW)) {
                dx1 = (dx1 - domW);
            } else if ((dx1 < (-halfW))) {
                dx1 = (dx1 + domW);
            }
            let dy1 = (((sy + domH)) - oy);
            if ((dy1 > domH)) {
                dy1 = (dy1 - (2.0 * domH));
            } else if ((dy1 < (-domH))) {
                dy1 = (dy1 + (2.0 * domH));
            }
            const dSq1 = ((dx1 * dx1) + (dy1 * dy1));
            if ((dSq1 < bestSq)) {
                bestDx = dx1;
                bestDy = dy1;
                bestSq = dSq1;
            }
            let dy1b = (((sy - domH)) - oy);
            if ((dy1b > domH)) {
                dy1b = (dy1b - (2.0 * domH));
            } else if ((dy1b < (-domH))) {
                dy1b = (dy1b + (2.0 * domH));
            }
            const dSq1b = ((dx1 * dx1) + (dy1b * dy1b));
            if ((dSq1b < bestSq)) {
                bestDx = dx1;
                bestDy = dy1b;
            }
        } else {
            const gx = (domW - sx);
            const dxG = (gx - ox);
            let dyG = (((sy + domH)) - oy);
            if ((dyG > domH)) {
                dyG = (dyG - (2.0 * domH));
            } else if ((dyG < (-domH))) {
                dyG = (dyG + (2.0 * domH));
            }
            const dSqG = ((dxG * dxG) + (dyG * dyG));
            if ((dSqG < bestSq)) {
                bestDx = dxG;
                bestDy = dyG;
                bestSq = dSqG;
            }
            const gy = (domH - sy);
            let dxH = (((sx + domW)) - ox);
            if ((dxH > domW)) {
                dxH = (dxH - (2.0 * domW));
            } else if ((dxH < (-domW))) {
                dxH = (dxH + (2.0 * domW));
            }
            const dyH = (gy - oy);
            const dSqH = ((dxH * dxH) + (dyH * dyH));
            if ((dSqH < bestSq)) {
                bestDx = dxH;
                bestDy = dyH;
                bestSq = dSqH;
            }
            let dxC = ((((2.0 * domW) - sx)) - ox);
            if ((dxC > domW)) {
                dxC = (dxC - (2.0 * domW));
            } else if ((dxC < (-domW))) {
                dxC = (dxC + (2.0 * domW));
            }
            let dyC = ((((2.0 * domH) - sy)) - oy);
            if ((dyC > domH)) {
                dyC = (dyC - (2.0 * domH));
            } else if ((dyC < (-domH))) {
                dyC = (dyC + (2.0 * domH));
            }
            const dSqC = ((dxC * dxC) + (dyC * dyC));
            if ((dSqC < bestSq)) {
                bestDx = dxC;
                bestDy = dyC;
            }
        }
        return {x:bestDx, y:bestDy};
    }

    function getDelayedStateGPU(srcIdx, obsX, obsY, simTime, periodic, domW, domH, topoMode, isDead) {
        let result_x = 0;
        let result_y = 0;
        let result_vx = 0;
        let result_vy = 0;
        let result_angw = 0;
        let result_valid = false;
        result_valid = false;
        const metaBase = (srcIdx * HIST_META_STRIDE);
        const writeIdx = bindings.histMeta[metaBase];
        const count = bindings.histMeta[(metaBase + 1)];
        if ((count < 2)) {
            return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
        }
        const start = ((((writeIdx - count) + HISTORY_LEN)) & HISTORY_MASK);
        const newest = ((((writeIdx - 1) + HISTORY_LEN)) & HISTORY_MASK);
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = (((srcIdx * HISTORY_LEN) * HIST_STRIDE) + (start * HIST_STRIDE));
            break _inl_19;
        }
        const oldestBase = _inl_19_result;
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = (((srcIdx * HISTORY_LEN) * HIST_STRIDE) + (newest * HIST_STRIDE));
            break _inl_20;
        }
        const newestBase = _inl_20_result;
        const tOldest = bindings.histData[(oldestBase + 5)];
        const tNewest = bindings.histData[(newestBase + 5)];
        const timeSpan = (simTime - tOldest);
        if ((timeSpan < EPSILON)) {
            return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
        }
        const nxPos = bindings.histData[newestBase];
        const nyPos = bindings.histData[(newestBase + 1)];
        let cdx = 0;
        let cdy = 0;
        if (periodic) {
            const _sroa_0 = fullMinImageP(obsX, obsY, nxPos, nyPos, domW, domH, topoMode);
            const d_x = _sroa_0.x;
            const d_y = _sroa_0.y;
            cdx = d_x;
            cdy = d_y;
        } else {
            cdx = (nxPos - obsX);
            cdy = (nyPos - obsY);
        }
        const distSq = ((cdx * cdx) + (cdy * cdy));
        if ((distSq <= ((4.0 * timeSpan) * timeSpan))) {
            let bsLo = 0;
            let bsHi = (((count) | 0) - 2);
            for (let bsIter = 0; (bsIter < 16); bsIter++) {
                if ((bsLo >= bsHi)) {
                    break;
                }
                const mid = (((bsLo + bsHi)) >> 1);
                const _inl_21_sampleIdx = (((start + (((mid + 1)) >>> 0))) & HISTORY_MASK);
                let _inl_21_result;
                _inl_21: {
                    _inl_21_result = (((srcIdx * HISTORY_LEN) * HIST_STRIDE) + (_inl_21_sampleIdx * HIST_STRIDE));
                    break _inl_21;
                }
                const midBase = _inl_21_result;
                const tMid = bindings.histData[(midBase + 5)];
                let bx = 0;
                let by = 0;
                if (periodic) {
                    const _sroa_1 = fullMinImageP(obsX, obsY, bindings.histData[midBase], bindings.histData[(midBase + 1)], domW, domH, topoMode);
                    const d_x = _sroa_1.x;
                    const d_y = _sroa_1.y;
                    bx = d_x;
                    by = d_y;
                } else {
                    bx = (bindings.histData[midBase] - obsX);
                    by = (bindings.histData[(midBase + 1)] - obsY);
                }
                const g = (Math.sqrt(((bx * bx) + (by * by))) - ((simTime - tMid)));
                if ((g < 0.0)) {
                    bsLo = (mid + 1);
                } else {
                    bsHi = mid;
                }
            }
            let segK = bsLo;
            const center = segK;
            for (let offset = 0; (offset <= 1); offset++) {
                for (let dir = ((offset == 0) ? 1 : (-1)); (dir <= 1); dir = (dir + 2)) {
                    const k = (center + (offset * dir));
                    if (((k < 0) || (k > (((count) | 0) - 2)))) {
                        continue;
                    }
                    const _inl_22_sampleIdx = (((start + ((k) >>> 0))) & HISTORY_MASK);
                    let _inl_22_result;
                    _inl_22: {
                        _inl_22_result = (((srcIdx * HISTORY_LEN) * HIST_STRIDE) + (_inl_22_sampleIdx * HIST_STRIDE));
                        break _inl_22;
                    }
                    const loBase = _inl_22_result;
                    const _inl_23_sampleIdx = (((((start + ((k) >>> 0))) + 1)) & HISTORY_MASK);
                    let _inl_23_result;
                    _inl_23: {
                        _inl_23_result = (((srcIdx * HISTORY_LEN) * HIST_STRIDE) + (_inl_23_sampleIdx * HIST_STRIDE));
                        break _inl_23;
                    }
                    const hiBase = _inl_23_result;
                    const tLo = bindings.histData[(loBase + 5)];
                    const segDt = (bindings.histData[(hiBase + 5)] - tLo);
                    if ((segDt < EPSILON)) {
                        continue;
                    }
                    const xLo = bindings.histData[loBase];
                    const yLo = bindings.histData[(loBase + 1)];
                    const xHi = bindings.histData[hiBase];
                    const yHi = bindings.histData[(hiBase + 1)];
                    let dx = 0;
                    let dy = 0;
                    let vx = 0;
                    let vy = 0;
                    if (periodic) {
                        const _sroa_2 = fullMinImageP(obsX, obsY, xLo, yLo, domW, domH, topoMode);
                        const d0_x = _sroa_2.x;
                        const d0_y = _sroa_2.y;
                        dx = d0_x;
                        dy = d0_y;
                        const _sroa_3 = fullMinImageP(xLo, yLo, xHi, yHi, domW, domH, topoMode);
                        const d1_x = _sroa_3.x;
                        const d1_y = _sroa_3.y;
                        vx = (d1_x / segDt);
                        vy = (d1_y / segDt);
                    } else {
                        dx = (xLo - obsX);
                        dy = (yLo - obsY);
                        vx = (((xHi - xLo)) / segDt);
                        vy = (((yHi - yLo)) / segDt);
                    }
                    const rSq = ((dx * dx) + (dy * dy));
                    const vSq = ((vx * vx) + (vy * vy));
                    const dDotV = ((dx * vx) + (dy * vy));
                    const T = (simTime - tLo);
                    const a = (vSq - 1.0);
                    const h = (dDotV + T);
                    const c = (rSq - (T * T));
                    const disc = ((h * h) - (a * c));
                    if ((disc < 0.0)) {
                        continue;
                    }
                    const sqrtDisc = Math.sqrt(((disc) < (0.0) ? (0.0) : (disc)));
                    let s_sol = 0;
                    if ((Math.abs(a) < EPSILON)) {
                        if ((Math.abs(h) < EPSILON)) {
                            continue;
                        }
                        s_sol = ((-c) / ((2.0 * h)));
                    } else {
                        const s1 = ((((-h) + sqrtDisc)) / a);
                        const s2 = ((((-h) - sqrtDisc)) / a);
                        const ok1 = ((s1 >= (-EPSILON)) && (s1 <= (segDt + EPSILON)));
                        const ok2 = ((s2 >= (-EPSILON)) && (s2 <= (segDt + EPSILON)));
                        if ((ok1 && ok2)) {
                            s_sol = ((s1) < (s2) ? (s2) : (s1));
                        } else if (ok1) {
                            s_sol = s1;
                        } else if (ok2) {
                            s_sol = s2;
                        } else {
                            continue;
                        }
                    }
                    s_sol = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(s_sol, 0.0, segDt));
                    const frac = (s_sol / segDt);
                    result_x = (xLo + (frac * ((xHi - xLo))));
                    result_y = (yLo + (frac * ((yHi - yLo))));
                    const loVx = bindings.histData[(loBase + 2)];
                    const hiVx = bindings.histData[(hiBase + 2)];
                    const loVy = bindings.histData[(loBase + 3)];
                    const hiVy = bindings.histData[(hiBase + 3)];
                    result_vx = (loVx + (frac * ((hiVx - loVx))));
                    result_vy = (loVy + (frac * ((hiVy - loVy))));
                    const loAngw = bindings.histData[(loBase + 4)];
                    const hiAngw = bindings.histData[(hiBase + 4)];
                    result_angw = (loAngw + (frac * ((hiAngw - loAngw))));
                    result_valid = true;
                    return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
                }
            }
        }
        if (isDead) {
            return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
        }
        {
            const xStart = bindings.histData[oldestBase];
            const yStart = bindings.histData[(oldestBase + 1)];
            let dx = 0;
            let dy = 0;
            if (periodic) {
                const _sroa_4 = fullMinImageP(obsX, obsY, xStart, yStart, domW, domH, topoMode);
                const d_x = _sroa_4.x;
                const d_y = _sroa_4.y;
                dx = d_x;
                dy = d_y;
            } else {
                dx = (xStart - obsX);
                dy = (yStart - obsY);
            }
            const vx = bindings.histData[(oldestBase + 2)];
            const vy = bindings.histData[(oldestBase + 3)];
            const rSq = ((dx * dx) + (dy * dy));
            const vSq = ((vx * vx) + (vy * vy));
            const dDotV = ((dx * vx) + (dy * vy));
            const T = timeSpan;
            const a = (vSq - 1.0);
            const h = (dDotV + T);
            const c = (rSq - (T * T));
            const disc = ((h * h) - (a * c));
            if ((disc < 0.0)) {
                return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
            }
            const sqrtDisc = Math.sqrt(disc);
            let s_sol = 0;
            if ((Math.abs(a) < EPSILON)) {
                if ((Math.abs(h) < EPSILON)) {
                    return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
                }
                s_sol = ((-c) / ((2.0 * h)));
            } else {
                const s1 = ((((-h) + sqrtDisc)) / a);
                const s2 = ((((-h) - sqrtDisc)) / a);
                const ok1 = (s1 <= EPSILON);
                const ok2 = (s2 <= EPSILON);
                if ((ok1 && ok2)) {
                    s_sol = ((s1) < (s2) ? (s2) : (s1));
                } else if (ok1) {
                    s_sol = s1;
                } else if (ok2) {
                    s_sol = s2;
                } else {
                    return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
                }
            }
            if ((s_sol > 0.0)) {
                s_sol = 0.0;
            }
            const creationTimeBits = bindings.histMeta[((srcIdx * HIST_META_STRIDE) + 2)];
            const creationTime = rt.bitcast_f32_u32(creationTimeBits);
            if (((tOldest + s_sol) < creationTime)) {
                return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
            }
            result_x = (xStart + (vx * s_sol));
            result_y = (yStart + (vy * s_sol));
            result_vx = vx;
            result_vy = vy;
            result_angw = bindings.histData[(oldestBase + 4)];
            result_valid = true;
            return { x: result_x, y: result_y, vx: result_vx, vy: result_vy, angw: result_angw, valid: result_valid };
        }
    }

    function accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, sMass, sCharge, sYukMod, softeningSq, periodic, domW, domH, topo, gmOn, magOn, yukOn, higgsOn, yukawaMu, yukawaCoupling, pYukMod, pHiggsMod, sHiggsMod) {
        let rx = (sx - px);
        let ry = (sy - py);
        if (periodic) {
            const _sroa_5 = fullMinImageP(px, py, sx, sy, domW, domH, topo);
            const d_x = _sroa_5.x;
            const d_y = _sroa_5.y;
            rx = d_x;
            ry = d_y;
        }
        const rSq = (((rx * rx) + (ry * ry)) + softeningSq);
        const invRSq = (1.0 / rSq);
        const invR = Math.sqrt(invRSq);
        const r_val = (1.0 / invR);
        const nx = (rx * invR);
        const ny = (ry * invR);
        let fx = 0.0;
        let fy = 0.0;
        if (gmOn) {
            const v1Sq = ((pvx * pvx) + (pvy * pvy));
            const v2Sq = ((svx * svx) + (svy * svy));
            const nDotV1 = ((nx * pvx) + (ny * pvy));
            const nDotV2 = ((nx * svx) + (ny * svy));
            const radial = (((((-v1Sq) - (2.0 * v2Sq)) + ((1.5 * nDotV2) * nDotV2)) + ((5.0 * pMass) * invR)) + ((4.0 * sMass) * invR));
            const v1Coeff = ((4.0 * nDotV1) - (3.0 * nDotV2));
            const v2Coeff = (3.0 * nDotV2);
            const base = (((pMass * sMass) * invRSq) * invR);
            fx = (fx + (base * (((rx * radial) + ((((pvx * v1Coeff) + (svx * v2Coeff))) * r_val)))));
            fy = (fy + (base * (((ry * radial) + ((((pvy * v1Coeff) + (svy * v2Coeff))) * r_val)))));
        }
        if (magOn) {
            const v2DotN = ((svx * nx) + (svy * ny));
            const v1DotN = ((pvx * nx) + (pvy * ny));
            const coeff = (((0.5 * pCharge) * sCharge) * invRSq);
            fx = (fx + (coeff * (((pvx * v2DotN) - (((3.0 * nx) * v1DotN) * v2DotN)))));
            fy = (fy + (coeff * (((pvy * v2DotN) - (((3.0 * ny) * v1DotN) * v2DotN)))));
        }
        if ((gmOn && magOn)) {
            const crossCoeff = (((pCharge * sCharge) * ((pMass + sMass))) - ((((pCharge * pCharge) * sMass) + ((sCharge * sCharge) * pMass))));
            const fDir = ((crossCoeff * invRSq) * invRSq);
            fx = (fx + (rx * fDir));
            fy = (fy + (ry * fDir));
        }
        if (yukOn) {
            const mu = (higgsOn ? (yukawaMu * Math.sqrt((pHiggsMod * sHiggsMod))) : yukawaMu);
            const muR_val = (mu * r_val);
            const expMuR = ((muR_val < 80.0) ? Math.exp((-muR_val)) : 0.0);
            const nDotV1 = ((nx * pvx) + (ny * pvy));
            const nDotV2 = ((nx * svx) + (ny * svy));
            const v1DotV2 = ((pvx * svx) + (pvy * svy));
            const alpha = (1.0 + (mu * r_val));
            const beta = ((((((0.5 * yukawaCoupling) * Math.sqrt((((pYukMod * sYukMod)) < (0.0) ? (0.0) : ((pYukMod * sYukMod))))) * pMass) * sMass) * expMuR) * invRSq);
            const radial = (-(((alpha * v1DotV2) + ((((((alpha * alpha) + alpha) + 1.0)) * nDotV1) * nDotV2))));
            fx = (fx + (beta * (((radial * nx) + (alpha * (((nDotV2 * pvx) + (nDotV1 * svx))))))));
            fy = (fy + (beta * (((radial * ny) + (alpha * (((nDotV2 * pvy) + (nDotV1 * svy))))))));
        }
        return {x:fx, y:fy};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["compute1PN"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_compute1PN(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_simTime = _b_u.simTime;
        const _u_u_domainW = _b_u.domainW;
        const _u_u_domainH = _b_u.domainH;
        const _u_u_softeningSq = _b_u.softeningSq;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_yukawaCoupling = _b_u.yukawaCoupling;
        const _u_u_yukawaMu = _b_u.yukawaMu;
        const _u_u_boundaryMode = _b_u.boundaryMode;
        const _u_u_topologyMode = _b_u.topologyMode;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_axYukMod = bindings.axYukMod;
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                    const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                    const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                    const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    const _sroa_6_base = ((i) * 40);
                    let af_f0_x = _b_allForces[_sroa_6_base + 0];
                    let af_f0_y = _b_allForces[_sroa_6_base + 1];
                    let af_f0_z = _b_allForces[_sroa_6_base + 2];
                    let af_f0_w = _b_allForces[_sroa_6_base + 3];
                    let af_f1_x = _b_allForces[_sroa_6_base + 4];
                    let af_f1_y = _b_allForces[_sroa_6_base + 5];
                    let af_f1_z = _b_allForces[_sroa_6_base + 6];
                    let af_f1_w = _b_allForces[_sroa_6_base + 7];
                    let af_f2_x = _b_allForces[_sroa_6_base + 8];
                    let af_f2_y = _b_allForces[_sroa_6_base + 9];
                    let af_f2_z = _b_allForces[_sroa_6_base + 10];
                    let af_f2_w = _b_allForces[_sroa_6_base + 11];
                    let af_f3_x = _b_allForces[_sroa_6_base + 12];
                    let af_f3_y = _b_allForces[_sroa_6_base + 13];
                    let af_f3_z = _b_allForces[_sroa_6_base + 14];
                    let af_f3_w = _b_allForces[_sroa_6_base + 15];
                    let af_f4_x = _b_allForces[_sroa_6_base + 16];
                    let af_f4_y = _b_allForces[_sroa_6_base + 17];
                    let af_f4_z = _b_allForces[_sroa_6_base + 18];
                    let af_f4_w = _b_allForces[_sroa_6_base + 19];
                    let af_f5_x = _b_allForces[_sroa_6_base + 20];
                    let af_f5_y = _b_allForces[_sroa_6_base + 21];
                    let af_f5_z = _b_allForces[_sroa_6_base + 22];
                    let af_f5_w = _b_allForces[_sroa_6_base + 23];
                    let af_torques_x = _b_allForces[_sroa_6_base + 24];
                    let af_torques_y = _b_allForces[_sroa_6_base + 25];
                    let af_torques_z = _b_allForces[_sroa_6_base + 26];
                    let af_torques_w = _b_allForces[_sroa_6_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_6_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_6_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_6_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_6_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_6_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_6_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_6_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_6_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_6_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_6_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_6_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_6_base + 39];
                    af_f2_x = 0.0;
                    af_f2_y = 0.0;
                    {
                        const _wbase = ((i) * 40);
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                    const invG = (1.0 / gamma);
                    const pvx = (wx * invG);
                    const pvy = (wy * invG);
                    const pMass = _b_particles[((i) * 9 + 4)];
                    const pCharge = _b_particles[((i) * 9 + 5)];
                    let f1pnX = 0.0;
                    let f1pnY = 0.0;
                    const pYukMod = _b_axYukMod[((i) * 4 + 0) + 1];
                    const pHiggsMod = _b_axYukMod[((i) * 4 + 0) + 2];
                    const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    const n = _u_u_aliveCount;
                    for (let j = 0; (j < n); j++) {
                        if ((j == i)) {
                            continue;
                        }
                        if ((((_b_particles[((j) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        let sx = 0;
                        let sy = 0;
                        let svx = 0;
                        let svy = 0;
                        if (signalDelayed) {
                            const _sroa_7 = getDelayedStateGPU(j, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                            const delayed_x = _sroa_7.x;
                            const delayed_y = _sroa_7.y;
                            const delayed_vx = _sroa_7.vx;
                            const delayed_vy = _sroa_7.vy;
                            const delayed_angw = _sroa_7.angw;
                            const delayed_valid = _sroa_7.valid;
                            if ((!delayed_valid)) {
                                continue;
                            }
                            sx = delayed_x;
                            sy = delayed_y;
                            svx = delayed_vx;
                            svy = delayed_vy;
                        } else {
                            sx = _b_particles[((j) * 9 + 0)];
                            sy = _b_particles[((j) * 9 + 1)];
                            const swx = _b_particles[((j) * 9 + 2)];
                            const swy = _b_particles[((j) * 9 + 3)];
                            const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                            svx = (swx / sg);
                            svy = (swy / sg);
                        }
                        const _sroa_8 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, _b_particles[((j) * 9 + 4)], _b_particles[((j) * 9 + 5)], _b_axYukMod[((j) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOn, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukMod, pHiggsMod, _b_axYukMod[((j) * 4 + 0) + 2]);
                        const f_x = _sroa_8.x;
                        const f_y = _sroa_8.y;
                        f1pnX = (f1pnX + f_x);
                        f1pnY = (f1pnY + f_y);
                    }
                    const _sroa_9_base = ((i) * 40);
                    let afOut_f0_x = _b_allForces[_sroa_9_base + 0];
                    let afOut_f0_y = _b_allForces[_sroa_9_base + 1];
                    let afOut_f0_z = _b_allForces[_sroa_9_base + 2];
                    let afOut_f0_w = _b_allForces[_sroa_9_base + 3];
                    let afOut_f1_x = _b_allForces[_sroa_9_base + 4];
                    let afOut_f1_y = _b_allForces[_sroa_9_base + 5];
                    let afOut_f1_z = _b_allForces[_sroa_9_base + 6];
                    let afOut_f1_w = _b_allForces[_sroa_9_base + 7];
                    let afOut_f2_x = _b_allForces[_sroa_9_base + 8];
                    let afOut_f2_y = _b_allForces[_sroa_9_base + 9];
                    let afOut_f2_z = _b_allForces[_sroa_9_base + 10];
                    let afOut_f2_w = _b_allForces[_sroa_9_base + 11];
                    let afOut_f3_x = _b_allForces[_sroa_9_base + 12];
                    let afOut_f3_y = _b_allForces[_sroa_9_base + 13];
                    let afOut_f3_z = _b_allForces[_sroa_9_base + 14];
                    let afOut_f3_w = _b_allForces[_sroa_9_base + 15];
                    let afOut_f4_x = _b_allForces[_sroa_9_base + 16];
                    let afOut_f4_y = _b_allForces[_sroa_9_base + 17];
                    let afOut_f4_z = _b_allForces[_sroa_9_base + 18];
                    let afOut_f4_w = _b_allForces[_sroa_9_base + 19];
                    let afOut_f5_x = _b_allForces[_sroa_9_base + 20];
                    let afOut_f5_y = _b_allForces[_sroa_9_base + 21];
                    let afOut_f5_z = _b_allForces[_sroa_9_base + 22];
                    let afOut_f5_w = _b_allForces[_sroa_9_base + 23];
                    let afOut_torques_x = _b_allForces[_sroa_9_base + 24];
                    let afOut_torques_y = _b_allForces[_sroa_9_base + 25];
                    let afOut_torques_z = _b_allForces[_sroa_9_base + 26];
                    let afOut_torques_w = _b_allForces[_sroa_9_base + 27];
                    let afOut_bFields_x = _b_allForces[_sroa_9_base + 28];
                    let afOut_bFields_y = _b_allForces[_sroa_9_base + 29];
                    let afOut_bFields_z = _b_allForces[_sroa_9_base + 30];
                    let afOut_bFields_w = _b_allForces[_sroa_9_base + 31];
                    let afOut_bFieldGrads_x = _b_allForces[_sroa_9_base + 32];
                    let afOut_bFieldGrads_y = _b_allForces[_sroa_9_base + 33];
                    let afOut_bFieldGrads_z = _b_allForces[_sroa_9_base + 34];
                    let afOut_bFieldGrads_w = _b_allForces[_sroa_9_base + 35];
                    let afOut_totalForce_x = _b_allForces[_sroa_9_base + 36];
                    let afOut_totalForce_y = _b_allForces[_sroa_9_base + 37];
                    let afOut_jerk_x = _b_allForces[_sroa_9_base + 38];
                    let afOut_jerk_y = _b_allForces[_sroa_9_base + 39];
                    afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                    afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afOut_f0_x;
                        _b_allForces[_wbase + 1] = afOut_f0_y;
                        _b_allForces[_wbase + 2] = afOut_f0_z;
                        _b_allForces[_wbase + 3] = afOut_f0_w;
                        _b_allForces[_wbase + 4] = afOut_f1_x;
                        _b_allForces[_wbase + 5] = afOut_f1_y;
                        _b_allForces[_wbase + 6] = afOut_f1_z;
                        _b_allForces[_wbase + 7] = afOut_f1_w;
                        _b_allForces[_wbase + 8] = afOut_f2_x;
                        _b_allForces[_wbase + 9] = afOut_f2_y;
                        _b_allForces[_wbase + 10] = afOut_f2_z;
                        _b_allForces[_wbase + 11] = afOut_f2_w;
                        _b_allForces[_wbase + 12] = afOut_f3_x;
                        _b_allForces[_wbase + 13] = afOut_f3_y;
                        _b_allForces[_wbase + 14] = afOut_f3_z;
                        _b_allForces[_wbase + 15] = afOut_f3_w;
                        _b_allForces[_wbase + 16] = afOut_f4_x;
                        _b_allForces[_wbase + 17] = afOut_f4_y;
                        _b_allForces[_wbase + 18] = afOut_f4_z;
                        _b_allForces[_wbase + 19] = afOut_f4_w;
                        _b_allForces[_wbase + 20] = afOut_f5_x;
                        _b_allForces[_wbase + 21] = afOut_f5_y;
                        _b_allForces[_wbase + 22] = afOut_f5_z;
                        _b_allForces[_wbase + 23] = afOut_f5_w;
                        _b_allForces[_wbase + 24] = afOut_torques_x;
                        _b_allForces[_wbase + 25] = afOut_torques_y;
                        _b_allForces[_wbase + 26] = afOut_torques_z;
                        _b_allForces[_wbase + 27] = afOut_torques_w;
                        _b_allForces[_wbase + 28] = afOut_bFields_x;
                        _b_allForces[_wbase + 29] = afOut_bFields_y;
                        _b_allForces[_wbase + 30] = afOut_bFields_z;
                        _b_allForces[_wbase + 31] = afOut_bFields_w;
                        _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afOut_totalForce_x;
                        _b_allForces[_wbase + 37] = afOut_totalForce_y;
                        _b_allForces[_wbase + 38] = afOut_jerk_x;
                        _b_allForces[_wbase + 39] = afOut_jerk_y;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const i = gid_x;
                            if ((i >= _u_u_aliveCount)) {
                                break __invocation;
                            }
                            if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                            const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                            const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                            const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                            const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                            const _sroa_10_base = ((i) * 40);
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
                            af_f2_x = 0.0;
                            af_f2_y = 0.0;
                            {
                                const _wbase = ((i) * 40);
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
                            const px = _b_particles[((i) * 9 + 0)];
                            const py = _b_particles[((i) * 9 + 1)];
                            const wx = _b_particles[((i) * 9 + 2)];
                            const wy = _b_particles[((i) * 9 + 3)];
                            const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                            const invG = (1.0 / gamma);
                            const pvx = (wx * invG);
                            const pvy = (wy * invG);
                            const pMass = _b_particles[((i) * 9 + 4)];
                            const pCharge = _b_particles[((i) * 9 + 5)];
                            let f1pnX = 0.0;
                            let f1pnY = 0.0;
                            const pYukMod = _b_axYukMod[((i) * 4 + 0) + 1];
                            const pHiggsMod = _b_axYukMod[((i) * 4 + 0) + 2];
                            const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                            const n = _u_u_aliveCount;
                            for (let j = 0; (j < n); j++) {
                                if ((j == i)) {
                                    continue;
                                }
                                if ((((_b_particles[((j) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                let sx = 0;
                                let sy = 0;
                                let svx = 0;
                                let svy = 0;
                                if (signalDelayed) {
                                    const _sroa_11 = getDelayedStateGPU(j, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                    const delayed_x = _sroa_11.x;
                                    const delayed_y = _sroa_11.y;
                                    const delayed_vx = _sroa_11.vx;
                                    const delayed_vy = _sroa_11.vy;
                                    const delayed_angw = _sroa_11.angw;
                                    const delayed_valid = _sroa_11.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    sx = delayed_x;
                                    sy = delayed_y;
                                    svx = delayed_vx;
                                    svy = delayed_vy;
                                } else {
                                    sx = _b_particles[((j) * 9 + 0)];
                                    sy = _b_particles[((j) * 9 + 1)];
                                    const swx = _b_particles[((j) * 9 + 2)];
                                    const swy = _b_particles[((j) * 9 + 3)];
                                    const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                    svx = (swx / sg);
                                    svy = (swy / sg);
                                }
                                const _sroa_12 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, _b_particles[((j) * 9 + 4)], _b_particles[((j) * 9 + 5)], _b_axYukMod[((j) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOn, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukMod, pHiggsMod, _b_axYukMod[((j) * 4 + 0) + 2]);
                                const f_x = _sroa_12.x;
                                const f_y = _sroa_12.y;
                                f1pnX = (f1pnX + f_x);
                                f1pnY = (f1pnY + f_y);
                            }
                            const _sroa_13_base = ((i) * 40);
                            let afOut_f0_x = _b_allForces[_sroa_13_base + 0];
                            let afOut_f0_y = _b_allForces[_sroa_13_base + 1];
                            let afOut_f0_z = _b_allForces[_sroa_13_base + 2];
                            let afOut_f0_w = _b_allForces[_sroa_13_base + 3];
                            let afOut_f1_x = _b_allForces[_sroa_13_base + 4];
                            let afOut_f1_y = _b_allForces[_sroa_13_base + 5];
                            let afOut_f1_z = _b_allForces[_sroa_13_base + 6];
                            let afOut_f1_w = _b_allForces[_sroa_13_base + 7];
                            let afOut_f2_x = _b_allForces[_sroa_13_base + 8];
                            let afOut_f2_y = _b_allForces[_sroa_13_base + 9];
                            let afOut_f2_z = _b_allForces[_sroa_13_base + 10];
                            let afOut_f2_w = _b_allForces[_sroa_13_base + 11];
                            let afOut_f3_x = _b_allForces[_sroa_13_base + 12];
                            let afOut_f3_y = _b_allForces[_sroa_13_base + 13];
                            let afOut_f3_z = _b_allForces[_sroa_13_base + 14];
                            let afOut_f3_w = _b_allForces[_sroa_13_base + 15];
                            let afOut_f4_x = _b_allForces[_sroa_13_base + 16];
                            let afOut_f4_y = _b_allForces[_sroa_13_base + 17];
                            let afOut_f4_z = _b_allForces[_sroa_13_base + 18];
                            let afOut_f4_w = _b_allForces[_sroa_13_base + 19];
                            let afOut_f5_x = _b_allForces[_sroa_13_base + 20];
                            let afOut_f5_y = _b_allForces[_sroa_13_base + 21];
                            let afOut_f5_z = _b_allForces[_sroa_13_base + 22];
                            let afOut_f5_w = _b_allForces[_sroa_13_base + 23];
                            let afOut_torques_x = _b_allForces[_sroa_13_base + 24];
                            let afOut_torques_y = _b_allForces[_sroa_13_base + 25];
                            let afOut_torques_z = _b_allForces[_sroa_13_base + 26];
                            let afOut_torques_w = _b_allForces[_sroa_13_base + 27];
                            let afOut_bFields_x = _b_allForces[_sroa_13_base + 28];
                            let afOut_bFields_y = _b_allForces[_sroa_13_base + 29];
                            let afOut_bFields_z = _b_allForces[_sroa_13_base + 30];
                            let afOut_bFields_w = _b_allForces[_sroa_13_base + 31];
                            let afOut_bFieldGrads_x = _b_allForces[_sroa_13_base + 32];
                            let afOut_bFieldGrads_y = _b_allForces[_sroa_13_base + 33];
                            let afOut_bFieldGrads_z = _b_allForces[_sroa_13_base + 34];
                            let afOut_bFieldGrads_w = _b_allForces[_sroa_13_base + 35];
                            let afOut_totalForce_x = _b_allForces[_sroa_13_base + 36];
                            let afOut_totalForce_y = _b_allForces[_sroa_13_base + 37];
                            let afOut_jerk_x = _b_allForces[_sroa_13_base + 38];
                            let afOut_jerk_y = _b_allForces[_sroa_13_base + 39];
                            afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                            afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                            {
                                const _wbase = ((i) * 40);
                                _b_allForces[_wbase + 0] = afOut_f0_x;
                                _b_allForces[_wbase + 1] = afOut_f0_y;
                                _b_allForces[_wbase + 2] = afOut_f0_z;
                                _b_allForces[_wbase + 3] = afOut_f0_w;
                                _b_allForces[_wbase + 4] = afOut_f1_x;
                                _b_allForces[_wbase + 5] = afOut_f1_y;
                                _b_allForces[_wbase + 6] = afOut_f1_z;
                                _b_allForces[_wbase + 7] = afOut_f1_w;
                                _b_allForces[_wbase + 8] = afOut_f2_x;
                                _b_allForces[_wbase + 9] = afOut_f2_y;
                                _b_allForces[_wbase + 10] = afOut_f2_z;
                                _b_allForces[_wbase + 11] = afOut_f2_w;
                                _b_allForces[_wbase + 12] = afOut_f3_x;
                                _b_allForces[_wbase + 13] = afOut_f3_y;
                                _b_allForces[_wbase + 14] = afOut_f3_z;
                                _b_allForces[_wbase + 15] = afOut_f3_w;
                                _b_allForces[_wbase + 16] = afOut_f4_x;
                                _b_allForces[_wbase + 17] = afOut_f4_y;
                                _b_allForces[_wbase + 18] = afOut_f4_z;
                                _b_allForces[_wbase + 19] = afOut_f4_w;
                                _b_allForces[_wbase + 20] = afOut_f5_x;
                                _b_allForces[_wbase + 21] = afOut_f5_y;
                                _b_allForces[_wbase + 22] = afOut_f5_z;
                                _b_allForces[_wbase + 23] = afOut_f5_w;
                                _b_allForces[_wbase + 24] = afOut_torques_x;
                                _b_allForces[_wbase + 25] = afOut_torques_y;
                                _b_allForces[_wbase + 26] = afOut_torques_z;
                                _b_allForces[_wbase + 27] = afOut_torques_w;
                                _b_allForces[_wbase + 28] = afOut_bFields_x;
                                _b_allForces[_wbase + 29] = afOut_bFields_y;
                                _b_allForces[_wbase + 30] = afOut_bFields_z;
                                _b_allForces[_wbase + 31] = afOut_bFields_w;
                                _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                                _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                                _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                                _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                                _b_allForces[_wbase + 36] = afOut_totalForce_x;
                                _b_allForces[_wbase + 37] = afOut_totalForce_y;
                                _b_allForces[_wbase + 38] = afOut_jerk_x;
                                _b_allForces[_wbase + 39] = afOut_jerk_y;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const i = gid_x;
                        if ((i >= _u_u_aliveCount)) {
                            break __invocation;
                        }
                        if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                        const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                        const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                        const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                        const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                        const _sroa_14_base = ((i) * 40);
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
                        af_f2_x = 0.0;
                        af_f2_y = 0.0;
                        {
                            const _wbase = ((i) * 40);
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
                        const px = _b_particles[((i) * 9 + 0)];
                        const py = _b_particles[((i) * 9 + 1)];
                        const wx = _b_particles[((i) * 9 + 2)];
                        const wy = _b_particles[((i) * 9 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        const invG = (1.0 / gamma);
                        const pvx = (wx * invG);
                        const pvy = (wy * invG);
                        const pMass = _b_particles[((i) * 9 + 4)];
                        const pCharge = _b_particles[((i) * 9 + 5)];
                        let f1pnX = 0.0;
                        let f1pnY = 0.0;
                        const pYukMod = _b_axYukMod[((i) * 4 + 0) + 1];
                        const pHiggsMod = _b_axYukMod[((i) * 4 + 0) + 2];
                        const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                        const n = _u_u_aliveCount;
                        for (let j = 0; (j < n); j++) {
                            if ((j == i)) {
                                continue;
                            }
                            if ((((_b_particles[((j) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            let sx = 0;
                            let sy = 0;
                            let svx = 0;
                            let svy = 0;
                            if (signalDelayed) {
                                const _sroa_15 = getDelayedStateGPU(j, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                const delayed_x = _sroa_15.x;
                                const delayed_y = _sroa_15.y;
                                const delayed_vx = _sroa_15.vx;
                                const delayed_vy = _sroa_15.vy;
                                const delayed_angw = _sroa_15.angw;
                                const delayed_valid = _sroa_15.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                sx = delayed_x;
                                sy = delayed_y;
                                svx = delayed_vx;
                                svy = delayed_vy;
                            } else {
                                sx = _b_particles[((j) * 9 + 0)];
                                sy = _b_particles[((j) * 9 + 1)];
                                const swx = _b_particles[((j) * 9 + 2)];
                                const swy = _b_particles[((j) * 9 + 3)];
                                const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                svx = (swx / sg);
                                svy = (swy / sg);
                            }
                            const _sroa_16 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, _b_particles[((j) * 9 + 4)], _b_particles[((j) * 9 + 5)], _b_axYukMod[((j) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOn, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukMod, pHiggsMod, _b_axYukMod[((j) * 4 + 0) + 2]);
                            const f_x = _sroa_16.x;
                            const f_y = _sroa_16.y;
                            f1pnX = (f1pnX + f_x);
                            f1pnY = (f1pnY + f_y);
                        }
                        const _sroa_17_base = ((i) * 40);
                        let afOut_f0_x = _b_allForces[_sroa_17_base + 0];
                        let afOut_f0_y = _b_allForces[_sroa_17_base + 1];
                        let afOut_f0_z = _b_allForces[_sroa_17_base + 2];
                        let afOut_f0_w = _b_allForces[_sroa_17_base + 3];
                        let afOut_f1_x = _b_allForces[_sroa_17_base + 4];
                        let afOut_f1_y = _b_allForces[_sroa_17_base + 5];
                        let afOut_f1_z = _b_allForces[_sroa_17_base + 6];
                        let afOut_f1_w = _b_allForces[_sroa_17_base + 7];
                        let afOut_f2_x = _b_allForces[_sroa_17_base + 8];
                        let afOut_f2_y = _b_allForces[_sroa_17_base + 9];
                        let afOut_f2_z = _b_allForces[_sroa_17_base + 10];
                        let afOut_f2_w = _b_allForces[_sroa_17_base + 11];
                        let afOut_f3_x = _b_allForces[_sroa_17_base + 12];
                        let afOut_f3_y = _b_allForces[_sroa_17_base + 13];
                        let afOut_f3_z = _b_allForces[_sroa_17_base + 14];
                        let afOut_f3_w = _b_allForces[_sroa_17_base + 15];
                        let afOut_f4_x = _b_allForces[_sroa_17_base + 16];
                        let afOut_f4_y = _b_allForces[_sroa_17_base + 17];
                        let afOut_f4_z = _b_allForces[_sroa_17_base + 18];
                        let afOut_f4_w = _b_allForces[_sroa_17_base + 19];
                        let afOut_f5_x = _b_allForces[_sroa_17_base + 20];
                        let afOut_f5_y = _b_allForces[_sroa_17_base + 21];
                        let afOut_f5_z = _b_allForces[_sroa_17_base + 22];
                        let afOut_f5_w = _b_allForces[_sroa_17_base + 23];
                        let afOut_torques_x = _b_allForces[_sroa_17_base + 24];
                        let afOut_torques_y = _b_allForces[_sroa_17_base + 25];
                        let afOut_torques_z = _b_allForces[_sroa_17_base + 26];
                        let afOut_torques_w = _b_allForces[_sroa_17_base + 27];
                        let afOut_bFields_x = _b_allForces[_sroa_17_base + 28];
                        let afOut_bFields_y = _b_allForces[_sroa_17_base + 29];
                        let afOut_bFields_z = _b_allForces[_sroa_17_base + 30];
                        let afOut_bFields_w = _b_allForces[_sroa_17_base + 31];
                        let afOut_bFieldGrads_x = _b_allForces[_sroa_17_base + 32];
                        let afOut_bFieldGrads_y = _b_allForces[_sroa_17_base + 33];
                        let afOut_bFieldGrads_z = _b_allForces[_sroa_17_base + 34];
                        let afOut_bFieldGrads_w = _b_allForces[_sroa_17_base + 35];
                        let afOut_totalForce_x = _b_allForces[_sroa_17_base + 36];
                        let afOut_totalForce_y = _b_allForces[_sroa_17_base + 37];
                        let afOut_jerk_x = _b_allForces[_sroa_17_base + 38];
                        let afOut_jerk_y = _b_allForces[_sroa_17_base + 39];
                        afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                        afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                        {
                            const _wbase = ((i) * 40);
                            _b_allForces[_wbase + 0] = afOut_f0_x;
                            _b_allForces[_wbase + 1] = afOut_f0_y;
                            _b_allForces[_wbase + 2] = afOut_f0_z;
                            _b_allForces[_wbase + 3] = afOut_f0_w;
                            _b_allForces[_wbase + 4] = afOut_f1_x;
                            _b_allForces[_wbase + 5] = afOut_f1_y;
                            _b_allForces[_wbase + 6] = afOut_f1_z;
                            _b_allForces[_wbase + 7] = afOut_f1_w;
                            _b_allForces[_wbase + 8] = afOut_f2_x;
                            _b_allForces[_wbase + 9] = afOut_f2_y;
                            _b_allForces[_wbase + 10] = afOut_f2_z;
                            _b_allForces[_wbase + 11] = afOut_f2_w;
                            _b_allForces[_wbase + 12] = afOut_f3_x;
                            _b_allForces[_wbase + 13] = afOut_f3_y;
                            _b_allForces[_wbase + 14] = afOut_f3_z;
                            _b_allForces[_wbase + 15] = afOut_f3_w;
                            _b_allForces[_wbase + 16] = afOut_f4_x;
                            _b_allForces[_wbase + 17] = afOut_f4_y;
                            _b_allForces[_wbase + 18] = afOut_f4_z;
                            _b_allForces[_wbase + 19] = afOut_f4_w;
                            _b_allForces[_wbase + 20] = afOut_f5_x;
                            _b_allForces[_wbase + 21] = afOut_f5_y;
                            _b_allForces[_wbase + 22] = afOut_f5_z;
                            _b_allForces[_wbase + 23] = afOut_f5_w;
                            _b_allForces[_wbase + 24] = afOut_torques_x;
                            _b_allForces[_wbase + 25] = afOut_torques_y;
                            _b_allForces[_wbase + 26] = afOut_torques_z;
                            _b_allForces[_wbase + 27] = afOut_torques_w;
                            _b_allForces[_wbase + 28] = afOut_bFields_x;
                            _b_allForces[_wbase + 29] = afOut_bFields_y;
                            _b_allForces[_wbase + 30] = afOut_bFields_z;
                            _b_allForces[_wbase + 31] = afOut_bFields_w;
                            _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                            _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                            _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                            _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                            _b_allForces[_wbase + 36] = afOut_totalForce_x;
                            _b_allForces[_wbase + 37] = afOut_totalForce_y;
                            _b_allForces[_wbase + 38] = afOut_jerk_x;
                            _b_allForces[_wbase + 39] = afOut_jerk_y;
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                    const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                    const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                    const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    const _sroa_18_base = ((i) * 40);
                    let af_f0_x = _b_allForces[_sroa_18_base + 0];
                    let af_f0_y = _b_allForces[_sroa_18_base + 1];
                    let af_f0_z = _b_allForces[_sroa_18_base + 2];
                    let af_f0_w = _b_allForces[_sroa_18_base + 3];
                    let af_f1_x = _b_allForces[_sroa_18_base + 4];
                    let af_f1_y = _b_allForces[_sroa_18_base + 5];
                    let af_f1_z = _b_allForces[_sroa_18_base + 6];
                    let af_f1_w = _b_allForces[_sroa_18_base + 7];
                    let af_f2_x = _b_allForces[_sroa_18_base + 8];
                    let af_f2_y = _b_allForces[_sroa_18_base + 9];
                    let af_f2_z = _b_allForces[_sroa_18_base + 10];
                    let af_f2_w = _b_allForces[_sroa_18_base + 11];
                    let af_f3_x = _b_allForces[_sroa_18_base + 12];
                    let af_f3_y = _b_allForces[_sroa_18_base + 13];
                    let af_f3_z = _b_allForces[_sroa_18_base + 14];
                    let af_f3_w = _b_allForces[_sroa_18_base + 15];
                    let af_f4_x = _b_allForces[_sroa_18_base + 16];
                    let af_f4_y = _b_allForces[_sroa_18_base + 17];
                    let af_f4_z = _b_allForces[_sroa_18_base + 18];
                    let af_f4_w = _b_allForces[_sroa_18_base + 19];
                    let af_f5_x = _b_allForces[_sroa_18_base + 20];
                    let af_f5_y = _b_allForces[_sroa_18_base + 21];
                    let af_f5_z = _b_allForces[_sroa_18_base + 22];
                    let af_f5_w = _b_allForces[_sroa_18_base + 23];
                    let af_torques_x = _b_allForces[_sroa_18_base + 24];
                    let af_torques_y = _b_allForces[_sroa_18_base + 25];
                    let af_torques_z = _b_allForces[_sroa_18_base + 26];
                    let af_torques_w = _b_allForces[_sroa_18_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_18_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_18_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_18_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_18_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_18_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_18_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_18_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_18_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_18_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_18_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_18_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_18_base + 39];
                    af_f2_x = 0.0;
                    af_f2_y = 0.0;
                    {
                        const _wbase = ((i) * 40);
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                    const invG = (1.0 / gamma);
                    const pvx = (wx * invG);
                    const pvy = (wy * invG);
                    const pMass = _b_particles[((i) * 9 + 4)];
                    const pCharge = _b_particles[((i) * 9 + 5)];
                    let f1pnX = 0.0;
                    let f1pnY = 0.0;
                    const pYukMod = _b_axYukMod[((i) * 4 + 0) + 1];
                    const pHiggsMod = _b_axYukMod[((i) * 4 + 0) + 2];
                    const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    const n = _u_u_aliveCount;
                    for (let j = 0; (j < n); j++) {
                        if ((j == i)) {
                            continue;
                        }
                        if ((((_b_particles[((j) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        let sx = 0;
                        let sy = 0;
                        let svx = 0;
                        let svy = 0;
                        if (signalDelayed) {
                            const _sroa_19 = getDelayedStateGPU(j, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                            const delayed_x = _sroa_19.x;
                            const delayed_y = _sroa_19.y;
                            const delayed_vx = _sroa_19.vx;
                            const delayed_vy = _sroa_19.vy;
                            const delayed_angw = _sroa_19.angw;
                            const delayed_valid = _sroa_19.valid;
                            if ((!delayed_valid)) {
                                continue;
                            }
                            sx = delayed_x;
                            sy = delayed_y;
                            svx = delayed_vx;
                            svy = delayed_vy;
                        } else {
                            sx = _b_particles[((j) * 9 + 0)];
                            sy = _b_particles[((j) * 9 + 1)];
                            const swx = _b_particles[((j) * 9 + 2)];
                            const swy = _b_particles[((j) * 9 + 3)];
                            const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                            svx = (swx / sg);
                            svy = (swy / sg);
                        }
                        const _sroa_20 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, _b_particles[((j) * 9 + 4)], _b_particles[((j) * 9 + 5)], _b_axYukMod[((j) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOn, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukMod, pHiggsMod, _b_axYukMod[((j) * 4 + 0) + 2]);
                        const f_x = _sroa_20.x;
                        const f_y = _sroa_20.y;
                        f1pnX = (f1pnX + f_x);
                        f1pnY = (f1pnY + f_y);
                    }
                    const _sroa_21_base = ((i) * 40);
                    let afOut_f0_x = _b_allForces[_sroa_21_base + 0];
                    let afOut_f0_y = _b_allForces[_sroa_21_base + 1];
                    let afOut_f0_z = _b_allForces[_sroa_21_base + 2];
                    let afOut_f0_w = _b_allForces[_sroa_21_base + 3];
                    let afOut_f1_x = _b_allForces[_sroa_21_base + 4];
                    let afOut_f1_y = _b_allForces[_sroa_21_base + 5];
                    let afOut_f1_z = _b_allForces[_sroa_21_base + 6];
                    let afOut_f1_w = _b_allForces[_sroa_21_base + 7];
                    let afOut_f2_x = _b_allForces[_sroa_21_base + 8];
                    let afOut_f2_y = _b_allForces[_sroa_21_base + 9];
                    let afOut_f2_z = _b_allForces[_sroa_21_base + 10];
                    let afOut_f2_w = _b_allForces[_sroa_21_base + 11];
                    let afOut_f3_x = _b_allForces[_sroa_21_base + 12];
                    let afOut_f3_y = _b_allForces[_sroa_21_base + 13];
                    let afOut_f3_z = _b_allForces[_sroa_21_base + 14];
                    let afOut_f3_w = _b_allForces[_sroa_21_base + 15];
                    let afOut_f4_x = _b_allForces[_sroa_21_base + 16];
                    let afOut_f4_y = _b_allForces[_sroa_21_base + 17];
                    let afOut_f4_z = _b_allForces[_sroa_21_base + 18];
                    let afOut_f4_w = _b_allForces[_sroa_21_base + 19];
                    let afOut_f5_x = _b_allForces[_sroa_21_base + 20];
                    let afOut_f5_y = _b_allForces[_sroa_21_base + 21];
                    let afOut_f5_z = _b_allForces[_sroa_21_base + 22];
                    let afOut_f5_w = _b_allForces[_sroa_21_base + 23];
                    let afOut_torques_x = _b_allForces[_sroa_21_base + 24];
                    let afOut_torques_y = _b_allForces[_sroa_21_base + 25];
                    let afOut_torques_z = _b_allForces[_sroa_21_base + 26];
                    let afOut_torques_w = _b_allForces[_sroa_21_base + 27];
                    let afOut_bFields_x = _b_allForces[_sroa_21_base + 28];
                    let afOut_bFields_y = _b_allForces[_sroa_21_base + 29];
                    let afOut_bFields_z = _b_allForces[_sroa_21_base + 30];
                    let afOut_bFields_w = _b_allForces[_sroa_21_base + 31];
                    let afOut_bFieldGrads_x = _b_allForces[_sroa_21_base + 32];
                    let afOut_bFieldGrads_y = _b_allForces[_sroa_21_base + 33];
                    let afOut_bFieldGrads_z = _b_allForces[_sroa_21_base + 34];
                    let afOut_bFieldGrads_w = _b_allForces[_sroa_21_base + 35];
                    let afOut_totalForce_x = _b_allForces[_sroa_21_base + 36];
                    let afOut_totalForce_y = _b_allForces[_sroa_21_base + 37];
                    let afOut_jerk_x = _b_allForces[_sroa_21_base + 38];
                    let afOut_jerk_y = _b_allForces[_sroa_21_base + 39];
                    afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                    afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afOut_f0_x;
                        _b_allForces[_wbase + 1] = afOut_f0_y;
                        _b_allForces[_wbase + 2] = afOut_f0_z;
                        _b_allForces[_wbase + 3] = afOut_f0_w;
                        _b_allForces[_wbase + 4] = afOut_f1_x;
                        _b_allForces[_wbase + 5] = afOut_f1_y;
                        _b_allForces[_wbase + 6] = afOut_f1_z;
                        _b_allForces[_wbase + 7] = afOut_f1_w;
                        _b_allForces[_wbase + 8] = afOut_f2_x;
                        _b_allForces[_wbase + 9] = afOut_f2_y;
                        _b_allForces[_wbase + 10] = afOut_f2_z;
                        _b_allForces[_wbase + 11] = afOut_f2_w;
                        _b_allForces[_wbase + 12] = afOut_f3_x;
                        _b_allForces[_wbase + 13] = afOut_f3_y;
                        _b_allForces[_wbase + 14] = afOut_f3_z;
                        _b_allForces[_wbase + 15] = afOut_f3_w;
                        _b_allForces[_wbase + 16] = afOut_f4_x;
                        _b_allForces[_wbase + 17] = afOut_f4_y;
                        _b_allForces[_wbase + 18] = afOut_f4_z;
                        _b_allForces[_wbase + 19] = afOut_f4_w;
                        _b_allForces[_wbase + 20] = afOut_f5_x;
                        _b_allForces[_wbase + 21] = afOut_f5_y;
                        _b_allForces[_wbase + 22] = afOut_f5_z;
                        _b_allForces[_wbase + 23] = afOut_f5_w;
                        _b_allForces[_wbase + 24] = afOut_torques_x;
                        _b_allForces[_wbase + 25] = afOut_torques_y;
                        _b_allForces[_wbase + 26] = afOut_torques_z;
                        _b_allForces[_wbase + 27] = afOut_torques_w;
                        _b_allForces[_wbase + 28] = afOut_bFields_x;
                        _b_allForces[_wbase + 29] = afOut_bFields_y;
                        _b_allForces[_wbase + 30] = afOut_bFields_z;
                        _b_allForces[_wbase + 31] = afOut_bFields_w;
                        _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afOut_totalForce_x;
                        _b_allForces[_wbase + 37] = afOut_totalForce_y;
                        _b_allForces[_wbase + 38] = afOut_jerk_x;
                        _b_allForces[_wbase + 39] = afOut_jerk_y;
                    }
                }
            }
        }
    }
    entry["compute1PN"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_compute1PN(workgroups, bindings, domain, origin);
    };

    entryInfo["compute1PNTree"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_compute1PNTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_simTime = _b_u.simTime;
        const _u_u_domainW = _b_u.domainW;
        const _u_u_domainH = _b_u.domainH;
        const _u_u_softeningSq = _b_u.softeningSq;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_yukawaCoupling = _b_u.yukawaCoupling;
        const _u_u_yukawaMu = _b_u.yukawaMu;
        const _u_u_boundaryMode = _b_u.boundaryMode;
        const _u_u_topologyMode = _b_u.topologyMode;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_axYukMod = bindings.axYukMod;
        const _b_allForces = bindings.allForces;
        const _b_ghostOriginalIdx = bindings.ghostOriginalIdx;
        const _b_nodes = bindings.nodes;
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_GHOST)) != 0)) {
                        break __invocation;
                    }
                    const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                    const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                    const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                    const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    const _sroa_22_base = ((i) * 40);
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
                    af_f2_x = 0.0;
                    af_f2_y = 0.0;
                    {
                        const _wbase = ((i) * 40);
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                    const invG = (1.0 / gamma);
                    const pvx = (wx * invG);
                    const pvy = (wy * invG);
                    const pMass = _b_particles[((i) * 9 + 4)];
                    const pCharge = _b_particles[((i) * 9 + 5)];
                    let f1pnX = 0.0;
                    let f1pnY = 0.0;
                    const pYukModT = _b_axYukMod[((i) * 4 + 0) + 1];
                    const pHiggsModT = _b_axYukMod[((i) * 4 + 0) + 2];
                    const higgsOnT = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let stackTop = 1;
                    stack[0] = 0;
                    while (true) {
                        if ((stackTop == 0)) {
                            break;
                        }
                        stackTop = (stackTop - 1);
                        const nodeIdx = stack[stackTop];
                        let _inl_24_result;
                        _inl_24: {
                            let _inl_24__inl_7_result;
                            _inl_24__inl_7: {
                                _inl_24__inl_7_result = (nodeIdx * NODE_STRIDE);
                                break _inl_24__inl_7;
                            }
                            _inl_24_result = rt.bitcast_f32_u32(_b_nodes[(_inl_24__inl_7_result + 6)]);
                            break _inl_24;
                        }
                        const nodeMass = _inl_24_result;
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        let _inl_25_result;
                        _inl_25: {
                            let _inl_25__inl_5_result;
                            _inl_25__inl_5: {
                                _inl_25__inl_5_result = (nodeIdx * NODE_STRIDE);
                                break _inl_25__inl_5;
                            }
                            _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                            break _inl_25;
                        }
                        const comX = _inl_25_result;
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_6_result;
                            _inl_26__inl_6: {
                                _inl_26__inl_6_result = (nodeIdx * NODE_STRIDE);
                                break _inl_26__inl_6;
                            }
                            _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                            break _inl_26;
                        }
                        const comY = _inl_26_result;
                        let dx = (comX - px);
                        let dy = (comY - py);
                        if (periodic) {
                            const _sroa_23 = fullMinImageP(px, py, comX, comY, _u_u_domainW, _u_u_domainH, _u_u_topologyMode);
                            const d_x = _sroa_23.x;
                            const d_y = _sroa_23.y;
                            dx = d_x;
                            dy = d_y;
                        }
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_27_result;
                        _inl_27: {
                            let _inl_27__inl_3_result;
                            _inl_27__inl_3: {
                                _inl_27__inl_3_result = (nodeIdx * NODE_STRIDE);
                                break _inl_27__inl_3;
                            }
                            _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                            break _inl_27;
                        }
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_1_result;
                            _inl_28__inl_1: {
                                _inl_28__inl_1_result = (nodeIdx * NODE_STRIDE);
                                break _inl_28__inl_1;
                            }
                            _inl_28_result = rt.bitcast_f32_u32(_b_nodes[_inl_28__inl_1_result]);
                            break _inl_28;
                        }
                        const size = (_inl_27_result - _inl_28_result);
                        let _inl_29_result;
                        _inl_29: {
                            let _inl_29__inl_13_result;
                            _inl_29__inl_13: {
                                _inl_29__inl_13_result = (nodeIdx * NODE_STRIDE);
                                break _inl_29__inl_13;
                            }
                            _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                            break _inl_29;
                        }
                        const isLeaf = (_inl_29_result == NONE);
                        let _inl_30_result;
                        _inl_30: {
                            let _inl_30__inl_17_result;
                            _inl_30__inl_17: {
                                _inl_30__inl_17_result = (nodeIdx * NODE_STRIDE);
                                break _inl_30__inl_17;
                            }
                            _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_17_result + 16)]);
                            break _inl_30;
                        }
                        const particleIdx = _inl_30_result;
                        if ((isLeaf && (particleIdx >= 0))) {
                            const sIdx = ((particleIdx) >>> 0);
                            const _sroa_24_base = ((sIdx) * 9);
                            const sPs_posX = _b_particles[_sroa_24_base + 0];
                            const sPs_posY = _b_particles[_sroa_24_base + 1];
                            const sPs_velWX = _b_particles[_sroa_24_base + 2];
                            const sPs_velWY = _b_particles[_sroa_24_base + 3];
                            const sPs_mass = _b_particles[_sroa_24_base + 4];
                            const sPs_charge = _b_particles[_sroa_24_base + 5];
                            const sPs_angW = _b_particles[_sroa_24_base + 6];
                            const sPs_baseMass = _b_particles[_sroa_24_base + 7];
                            const sPs_flags = _b_particles[_sroa_24_base + 8];
                            if ((sIdx == i)) {
                                continue;
                            }
                            const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                            let origIdx = sIdx;
                            if ((isGhost && (sIdx >= _u_u_aliveCount))) {
                                origIdx = _b_ghostOriginalIdx[(sIdx - _u_u_aliveCount)];
                            }
                            if ((origIdx == i)) {
                                continue;
                            }
                            const sIsRetired = (((sPs_flags & FLAG_RETIRED)) != 0);
                            if ((((sPs_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            if (sIsRetired) {
                                continue;
                            }
                            let sx = 0;
                            let sy = 0;
                            let svx = 0;
                            let svy = 0;
                            if ((signalDelayed && (!isGhost))) {
                                const _sroa_25 = getDelayedStateGPU(sIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                const delayed_x = _sroa_25.x;
                                const delayed_y = _sroa_25.y;
                                const delayed_vx = _sroa_25.vx;
                                const delayed_vy = _sroa_25.vy;
                                const delayed_angw = _sroa_25.angw;
                                const delayed_valid = _sroa_25.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                sx = delayed_x;
                                sy = delayed_y;
                                svx = delayed_vx;
                                svy = delayed_vy;
                            } else if ((signalDelayed && isGhost)) {
                                const _sroa_26_base = ((origIdx) * 9);
                                const origPs_posX = _b_particles[_sroa_26_base + 0];
                                const origPs_posY = _b_particles[_sroa_26_base + 1];
                                const origPs_velWX = _b_particles[_sroa_26_base + 2];
                                const origPs_velWY = _b_particles[_sroa_26_base + 3];
                                const origPs_mass = _b_particles[_sroa_26_base + 4];
                                const origPs_charge = _b_particles[_sroa_26_base + 5];
                                const origPs_angW = _b_particles[_sroa_26_base + 6];
                                const origPs_baseMass = _b_particles[_sroa_26_base + 7];
                                const origPs_flags = _b_particles[_sroa_26_base + 8];
                                const _sroa_27 = getDelayedStateGPU(origIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                const delayed_x = _sroa_27.x;
                                const delayed_y = _sroa_27.y;
                                const delayed_vx = _sroa_27.vx;
                                const delayed_vy = _sroa_27.vy;
                                const delayed_angw = _sroa_27.angw;
                                const delayed_valid = _sroa_27.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const shiftX = (sPs_posX - origPs_posX);
                                const shiftY = (sPs_posY - origPs_posY);
                                sx = (delayed_x + shiftX);
                                sy = (delayed_y + shiftY);
                                svx = delayed_vx;
                                svy = delayed_vy;
                            } else {
                                sx = sPs_posX;
                                sy = sPs_posY;
                                const swx = sPs_velWX;
                                const swy = sPs_velWY;
                                const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                svx = (swx / sg);
                                svy = (swy / sg);
                            }
                            const _sroa_28 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, sPs_mass, sPs_charge, _b_axYukMod[((sIdx) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, _b_axYukMod[((sIdx) * 4 + 0) + 2]);
                            const f_x = _sroa_28.x;
                            const f_y = _sroa_28.y;
                            f1pnX = (f1pnX + f_x);
                            f1pnY = (f1pnY + f_y);
                        } else if (((!isLeaf) && (((size * size) < (BH_THETA_SQ * dSq))))) {
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_11_result;
                                _inl_31__inl_11: {
                                    _inl_31__inl_11_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_31__inl_11;
                                }
                                _inl_31_result = rt.bitcast_f32_u32(_b_nodes[(_inl_31__inl_11_result + 10)]);
                                break _inl_31;
                            }
                            const avgVx = (_inl_31_result / nodeMass);
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_12_result;
                                _inl_32__inl_12: {
                                    _inl_32__inl_12_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_32__inl_12;
                                }
                                _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_12_result + 11)]);
                                break _inl_32;
                            }
                            const avgVy = (_inl_32_result / nodeMass);
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_8_result;
                                _inl_33__inl_8: {
                                    _inl_33__inl_8_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_33__inl_8;
                                }
                                _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_8_result + 7)]);
                                break _inl_33;
                            }
                            const _sroa_29 = accum1PN(px, py, pvx, pvy, pMass, pCharge, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 1.0, _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, 1.0);
                            const f_x = _sroa_29.x;
                            const f_y = _sroa_29.y;
                            f1pnX = (f1pnX + f_x);
                            f1pnY = (f1pnY + f_y);
                        } else if ((!isLeaf)) {
                            if (((stackTop + 4) <= MAX_STACK)) {
                                let _inl_34_result;
                                _inl_34: {
                                    let _inl_34__inl_13_result;
                                    _inl_34__inl_13: {
                                        _inl_34__inl_13_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_34__inl_13;
                                    }
                                    _inl_34_result = rt.bitcast_i32_u32(_b_nodes[(_inl_34__inl_13_result + 12)]);
                                    break _inl_34;
                                }
                                const nw = _inl_34_result;
                                let _inl_35_result;
                                _inl_35: {
                                    let _inl_35__inl_14_result;
                                    _inl_35__inl_14: {
                                        _inl_35__inl_14_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_35__inl_14;
                                    }
                                    _inl_35_result = rt.bitcast_i32_u32(_b_nodes[(_inl_35__inl_14_result + 13)]);
                                    break _inl_35;
                                }
                                const ne = _inl_35_result;
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_15_result;
                                    _inl_36__inl_15: {
                                        _inl_36__inl_15_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_36__inl_15;
                                    }
                                    _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_15_result + 14)]);
                                    break _inl_36;
                                }
                                const sw = _inl_36_result;
                                let _inl_37_result;
                                _inl_37: {
                                    let _inl_37__inl_16_result;
                                    _inl_37__inl_16: {
                                        _inl_37__inl_16_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_37__inl_16;
                                    }
                                    _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_16_result + 15)]);
                                    break _inl_37;
                                }
                                const se = _inl_37_result;
                                if ((nw != NONE)) {
                                    stack[stackTop] = ((nw) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((ne != NONE)) {
                                    stack[stackTop] = ((ne) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((sw != NONE)) {
                                    stack[stackTop] = ((sw) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((se != NONE)) {
                                    stack[stackTop] = ((se) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                            }
                        }
                    }
                    const _sroa_30_base = ((i) * 40);
                    let afOut_f0_x = _b_allForces[_sroa_30_base + 0];
                    let afOut_f0_y = _b_allForces[_sroa_30_base + 1];
                    let afOut_f0_z = _b_allForces[_sroa_30_base + 2];
                    let afOut_f0_w = _b_allForces[_sroa_30_base + 3];
                    let afOut_f1_x = _b_allForces[_sroa_30_base + 4];
                    let afOut_f1_y = _b_allForces[_sroa_30_base + 5];
                    let afOut_f1_z = _b_allForces[_sroa_30_base + 6];
                    let afOut_f1_w = _b_allForces[_sroa_30_base + 7];
                    let afOut_f2_x = _b_allForces[_sroa_30_base + 8];
                    let afOut_f2_y = _b_allForces[_sroa_30_base + 9];
                    let afOut_f2_z = _b_allForces[_sroa_30_base + 10];
                    let afOut_f2_w = _b_allForces[_sroa_30_base + 11];
                    let afOut_f3_x = _b_allForces[_sroa_30_base + 12];
                    let afOut_f3_y = _b_allForces[_sroa_30_base + 13];
                    let afOut_f3_z = _b_allForces[_sroa_30_base + 14];
                    let afOut_f3_w = _b_allForces[_sroa_30_base + 15];
                    let afOut_f4_x = _b_allForces[_sroa_30_base + 16];
                    let afOut_f4_y = _b_allForces[_sroa_30_base + 17];
                    let afOut_f4_z = _b_allForces[_sroa_30_base + 18];
                    let afOut_f4_w = _b_allForces[_sroa_30_base + 19];
                    let afOut_f5_x = _b_allForces[_sroa_30_base + 20];
                    let afOut_f5_y = _b_allForces[_sroa_30_base + 21];
                    let afOut_f5_z = _b_allForces[_sroa_30_base + 22];
                    let afOut_f5_w = _b_allForces[_sroa_30_base + 23];
                    let afOut_torques_x = _b_allForces[_sroa_30_base + 24];
                    let afOut_torques_y = _b_allForces[_sroa_30_base + 25];
                    let afOut_torques_z = _b_allForces[_sroa_30_base + 26];
                    let afOut_torques_w = _b_allForces[_sroa_30_base + 27];
                    let afOut_bFields_x = _b_allForces[_sroa_30_base + 28];
                    let afOut_bFields_y = _b_allForces[_sroa_30_base + 29];
                    let afOut_bFields_z = _b_allForces[_sroa_30_base + 30];
                    let afOut_bFields_w = _b_allForces[_sroa_30_base + 31];
                    let afOut_bFieldGrads_x = _b_allForces[_sroa_30_base + 32];
                    let afOut_bFieldGrads_y = _b_allForces[_sroa_30_base + 33];
                    let afOut_bFieldGrads_z = _b_allForces[_sroa_30_base + 34];
                    let afOut_bFieldGrads_w = _b_allForces[_sroa_30_base + 35];
                    let afOut_totalForce_x = _b_allForces[_sroa_30_base + 36];
                    let afOut_totalForce_y = _b_allForces[_sroa_30_base + 37];
                    let afOut_jerk_x = _b_allForces[_sroa_30_base + 38];
                    let afOut_jerk_y = _b_allForces[_sroa_30_base + 39];
                    afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                    afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afOut_f0_x;
                        _b_allForces[_wbase + 1] = afOut_f0_y;
                        _b_allForces[_wbase + 2] = afOut_f0_z;
                        _b_allForces[_wbase + 3] = afOut_f0_w;
                        _b_allForces[_wbase + 4] = afOut_f1_x;
                        _b_allForces[_wbase + 5] = afOut_f1_y;
                        _b_allForces[_wbase + 6] = afOut_f1_z;
                        _b_allForces[_wbase + 7] = afOut_f1_w;
                        _b_allForces[_wbase + 8] = afOut_f2_x;
                        _b_allForces[_wbase + 9] = afOut_f2_y;
                        _b_allForces[_wbase + 10] = afOut_f2_z;
                        _b_allForces[_wbase + 11] = afOut_f2_w;
                        _b_allForces[_wbase + 12] = afOut_f3_x;
                        _b_allForces[_wbase + 13] = afOut_f3_y;
                        _b_allForces[_wbase + 14] = afOut_f3_z;
                        _b_allForces[_wbase + 15] = afOut_f3_w;
                        _b_allForces[_wbase + 16] = afOut_f4_x;
                        _b_allForces[_wbase + 17] = afOut_f4_y;
                        _b_allForces[_wbase + 18] = afOut_f4_z;
                        _b_allForces[_wbase + 19] = afOut_f4_w;
                        _b_allForces[_wbase + 20] = afOut_f5_x;
                        _b_allForces[_wbase + 21] = afOut_f5_y;
                        _b_allForces[_wbase + 22] = afOut_f5_z;
                        _b_allForces[_wbase + 23] = afOut_f5_w;
                        _b_allForces[_wbase + 24] = afOut_torques_x;
                        _b_allForces[_wbase + 25] = afOut_torques_y;
                        _b_allForces[_wbase + 26] = afOut_torques_z;
                        _b_allForces[_wbase + 27] = afOut_torques_w;
                        _b_allForces[_wbase + 28] = afOut_bFields_x;
                        _b_allForces[_wbase + 29] = afOut_bFields_y;
                        _b_allForces[_wbase + 30] = afOut_bFields_z;
                        _b_allForces[_wbase + 31] = afOut_bFields_w;
                        _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afOut_totalForce_x;
                        _b_allForces[_wbase + 37] = afOut_totalForce_y;
                        _b_allForces[_wbase + 38] = afOut_jerk_x;
                        _b_allForces[_wbase + 39] = afOut_jerk_y;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const i = gid_x;
                            if ((i >= _u_u_aliveCount)) {
                                break __invocation;
                            }
                            if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            if ((((_b_particles[((i) * 9 + 8)] & FLAG_GHOST)) != 0)) {
                                break __invocation;
                            }
                            const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                            const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                            const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                            const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                            const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                            const _sroa_31_base = ((i) * 40);
                            let af_f0_x = _b_allForces[_sroa_31_base + 0];
                            let af_f0_y = _b_allForces[_sroa_31_base + 1];
                            let af_f0_z = _b_allForces[_sroa_31_base + 2];
                            let af_f0_w = _b_allForces[_sroa_31_base + 3];
                            let af_f1_x = _b_allForces[_sroa_31_base + 4];
                            let af_f1_y = _b_allForces[_sroa_31_base + 5];
                            let af_f1_z = _b_allForces[_sroa_31_base + 6];
                            let af_f1_w = _b_allForces[_sroa_31_base + 7];
                            let af_f2_x = _b_allForces[_sroa_31_base + 8];
                            let af_f2_y = _b_allForces[_sroa_31_base + 9];
                            let af_f2_z = _b_allForces[_sroa_31_base + 10];
                            let af_f2_w = _b_allForces[_sroa_31_base + 11];
                            let af_f3_x = _b_allForces[_sroa_31_base + 12];
                            let af_f3_y = _b_allForces[_sroa_31_base + 13];
                            let af_f3_z = _b_allForces[_sroa_31_base + 14];
                            let af_f3_w = _b_allForces[_sroa_31_base + 15];
                            let af_f4_x = _b_allForces[_sroa_31_base + 16];
                            let af_f4_y = _b_allForces[_sroa_31_base + 17];
                            let af_f4_z = _b_allForces[_sroa_31_base + 18];
                            let af_f4_w = _b_allForces[_sroa_31_base + 19];
                            let af_f5_x = _b_allForces[_sroa_31_base + 20];
                            let af_f5_y = _b_allForces[_sroa_31_base + 21];
                            let af_f5_z = _b_allForces[_sroa_31_base + 22];
                            let af_f5_w = _b_allForces[_sroa_31_base + 23];
                            let af_torques_x = _b_allForces[_sroa_31_base + 24];
                            let af_torques_y = _b_allForces[_sroa_31_base + 25];
                            let af_torques_z = _b_allForces[_sroa_31_base + 26];
                            let af_torques_w = _b_allForces[_sroa_31_base + 27];
                            let af_bFields_x = _b_allForces[_sroa_31_base + 28];
                            let af_bFields_y = _b_allForces[_sroa_31_base + 29];
                            let af_bFields_z = _b_allForces[_sroa_31_base + 30];
                            let af_bFields_w = _b_allForces[_sroa_31_base + 31];
                            let af_bFieldGrads_x = _b_allForces[_sroa_31_base + 32];
                            let af_bFieldGrads_y = _b_allForces[_sroa_31_base + 33];
                            let af_bFieldGrads_z = _b_allForces[_sroa_31_base + 34];
                            let af_bFieldGrads_w = _b_allForces[_sroa_31_base + 35];
                            let af_totalForce_x = _b_allForces[_sroa_31_base + 36];
                            let af_totalForce_y = _b_allForces[_sroa_31_base + 37];
                            let af_jerk_x = _b_allForces[_sroa_31_base + 38];
                            let af_jerk_y = _b_allForces[_sroa_31_base + 39];
                            af_f2_x = 0.0;
                            af_f2_y = 0.0;
                            {
                                const _wbase = ((i) * 40);
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
                            const px = _b_particles[((i) * 9 + 0)];
                            const py = _b_particles[((i) * 9 + 1)];
                            const wx = _b_particles[((i) * 9 + 2)];
                            const wy = _b_particles[((i) * 9 + 3)];
                            const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                            const invG = (1.0 / gamma);
                            const pvx = (wx * invG);
                            const pvy = (wy * invG);
                            const pMass = _b_particles[((i) * 9 + 4)];
                            const pCharge = _b_particles[((i) * 9 + 5)];
                            let f1pnX = 0.0;
                            let f1pnY = 0.0;
                            const pYukModT = _b_axYukMod[((i) * 4 + 0) + 1];
                            const pHiggsModT = _b_axYukMod[((i) * 4 + 0) + 2];
                            const higgsOnT = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                            let stack = Array.from({ length: 48 }, () => 0);
                            let stackTop = 1;
                            stack[0] = 0;
                            while (true) {
                                if ((stackTop == 0)) {
                                    break;
                                }
                                stackTop = (stackTop - 1);
                                const nodeIdx = stack[stackTop];
                                let _inl_24_result;
                                _inl_24: {
                                    let _inl_24__inl_7_result;
                                    _inl_24__inl_7: {
                                        _inl_24__inl_7_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_24__inl_7;
                                    }
                                    _inl_24_result = rt.bitcast_f32_u32(_b_nodes[(_inl_24__inl_7_result + 6)]);
                                    break _inl_24;
                                }
                                const nodeMass = _inl_24_result;
                                if ((nodeMass < EPSILON)) {
                                    continue;
                                }
                                let _inl_25_result;
                                _inl_25: {
                                    let _inl_25__inl_5_result;
                                    _inl_25__inl_5: {
                                        _inl_25__inl_5_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_25__inl_5;
                                    }
                                    _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                                    break _inl_25;
                                }
                                const comX = _inl_25_result;
                                let _inl_26_result;
                                _inl_26: {
                                    let _inl_26__inl_6_result;
                                    _inl_26__inl_6: {
                                        _inl_26__inl_6_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_26__inl_6;
                                    }
                                    _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                                    break _inl_26;
                                }
                                const comY = _inl_26_result;
                                let dx = (comX - px);
                                let dy = (comY - py);
                                if (periodic) {
                                    const _sroa_32 = fullMinImageP(px, py, comX, comY, _u_u_domainW, _u_u_domainH, _u_u_topologyMode);
                                    const d_x = _sroa_32.x;
                                    const d_y = _sroa_32.y;
                                    dx = d_x;
                                    dy = d_y;
                                }
                                const dSq = ((dx * dx) + (dy * dy));
                                let _inl_27_result;
                                _inl_27: {
                                    let _inl_27__inl_3_result;
                                    _inl_27__inl_3: {
                                        _inl_27__inl_3_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_27__inl_3;
                                    }
                                    _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                                    break _inl_27;
                                }
                                let _inl_28_result;
                                _inl_28: {
                                    let _inl_28__inl_1_result;
                                    _inl_28__inl_1: {
                                        _inl_28__inl_1_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_28__inl_1;
                                    }
                                    _inl_28_result = rt.bitcast_f32_u32(_b_nodes[_inl_28__inl_1_result]);
                                    break _inl_28;
                                }
                                const size = (_inl_27_result - _inl_28_result);
                                let _inl_29_result;
                                _inl_29: {
                                    let _inl_29__inl_13_result;
                                    _inl_29__inl_13: {
                                        _inl_29__inl_13_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_29__inl_13;
                                    }
                                    _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                                    break _inl_29;
                                }
                                const isLeaf = (_inl_29_result == NONE);
                                let _inl_30_result;
                                _inl_30: {
                                    let _inl_30__inl_17_result;
                                    _inl_30__inl_17: {
                                        _inl_30__inl_17_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_30__inl_17;
                                    }
                                    _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_17_result + 16)]);
                                    break _inl_30;
                                }
                                const particleIdx = _inl_30_result;
                                if ((isLeaf && (particleIdx >= 0))) {
                                    const sIdx = ((particleIdx) >>> 0);
                                    const _sroa_33_base = ((sIdx) * 9);
                                    const sPs_posX = _b_particles[_sroa_33_base + 0];
                                    const sPs_posY = _b_particles[_sroa_33_base + 1];
                                    const sPs_velWX = _b_particles[_sroa_33_base + 2];
                                    const sPs_velWY = _b_particles[_sroa_33_base + 3];
                                    const sPs_mass = _b_particles[_sroa_33_base + 4];
                                    const sPs_charge = _b_particles[_sroa_33_base + 5];
                                    const sPs_angW = _b_particles[_sroa_33_base + 6];
                                    const sPs_baseMass = _b_particles[_sroa_33_base + 7];
                                    const sPs_flags = _b_particles[_sroa_33_base + 8];
                                    if ((sIdx == i)) {
                                        continue;
                                    }
                                    const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                                    let origIdx = sIdx;
                                    if ((isGhost && (sIdx >= _u_u_aliveCount))) {
                                        origIdx = _b_ghostOriginalIdx[(sIdx - _u_u_aliveCount)];
                                    }
                                    if ((origIdx == i)) {
                                        continue;
                                    }
                                    const sIsRetired = (((sPs_flags & FLAG_RETIRED)) != 0);
                                    if ((((sPs_flags & FLAG_ALIVE)) == 0)) {
                                        continue;
                                    }
                                    if (sIsRetired) {
                                        continue;
                                    }
                                    let sx = 0;
                                    let sy = 0;
                                    let svx = 0;
                                    let svy = 0;
                                    if ((signalDelayed && (!isGhost))) {
                                        const _sroa_34 = getDelayedStateGPU(sIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                        const delayed_x = _sroa_34.x;
                                        const delayed_y = _sroa_34.y;
                                        const delayed_vx = _sroa_34.vx;
                                        const delayed_vy = _sroa_34.vy;
                                        const delayed_angw = _sroa_34.angw;
                                        const delayed_valid = _sroa_34.valid;
                                        if ((!delayed_valid)) {
                                            continue;
                                        }
                                        sx = delayed_x;
                                        sy = delayed_y;
                                        svx = delayed_vx;
                                        svy = delayed_vy;
                                    } else if ((signalDelayed && isGhost)) {
                                        const _sroa_35_base = ((origIdx) * 9);
                                        const origPs_posX = _b_particles[_sroa_35_base + 0];
                                        const origPs_posY = _b_particles[_sroa_35_base + 1];
                                        const origPs_velWX = _b_particles[_sroa_35_base + 2];
                                        const origPs_velWY = _b_particles[_sroa_35_base + 3];
                                        const origPs_mass = _b_particles[_sroa_35_base + 4];
                                        const origPs_charge = _b_particles[_sroa_35_base + 5];
                                        const origPs_angW = _b_particles[_sroa_35_base + 6];
                                        const origPs_baseMass = _b_particles[_sroa_35_base + 7];
                                        const origPs_flags = _b_particles[_sroa_35_base + 8];
                                        const _sroa_36 = getDelayedStateGPU(origIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                        const delayed_x = _sroa_36.x;
                                        const delayed_y = _sroa_36.y;
                                        const delayed_vx = _sroa_36.vx;
                                        const delayed_vy = _sroa_36.vy;
                                        const delayed_angw = _sroa_36.angw;
                                        const delayed_valid = _sroa_36.valid;
                                        if ((!delayed_valid)) {
                                            continue;
                                        }
                                        const shiftX = (sPs_posX - origPs_posX);
                                        const shiftY = (sPs_posY - origPs_posY);
                                        sx = (delayed_x + shiftX);
                                        sy = (delayed_y + shiftY);
                                        svx = delayed_vx;
                                        svy = delayed_vy;
                                    } else {
                                        sx = sPs_posX;
                                        sy = sPs_posY;
                                        const swx = sPs_velWX;
                                        const swy = sPs_velWY;
                                        const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                        svx = (swx / sg);
                                        svy = (swy / sg);
                                    }
                                    const _sroa_37 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, sPs_mass, sPs_charge, _b_axYukMod[((sIdx) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, _b_axYukMod[((sIdx) * 4 + 0) + 2]);
                                    const f_x = _sroa_37.x;
                                    const f_y = _sroa_37.y;
                                    f1pnX = (f1pnX + f_x);
                                    f1pnY = (f1pnY + f_y);
                                } else if (((!isLeaf) && (((size * size) < (BH_THETA_SQ * dSq))))) {
                                    let _inl_31_result;
                                    _inl_31: {
                                        let _inl_31__inl_11_result;
                                        _inl_31__inl_11: {
                                            _inl_31__inl_11_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_31__inl_11;
                                        }
                                        _inl_31_result = rt.bitcast_f32_u32(_b_nodes[(_inl_31__inl_11_result + 10)]);
                                        break _inl_31;
                                    }
                                    const avgVx = (_inl_31_result / nodeMass);
                                    let _inl_32_result;
                                    _inl_32: {
                                        let _inl_32__inl_12_result;
                                        _inl_32__inl_12: {
                                            _inl_32__inl_12_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_32__inl_12;
                                        }
                                        _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_12_result + 11)]);
                                        break _inl_32;
                                    }
                                    const avgVy = (_inl_32_result / nodeMass);
                                    let _inl_33_result;
                                    _inl_33: {
                                        let _inl_33__inl_8_result;
                                        _inl_33__inl_8: {
                                            _inl_33__inl_8_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_33__inl_8;
                                        }
                                        _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_8_result + 7)]);
                                        break _inl_33;
                                    }
                                    const _sroa_38 = accum1PN(px, py, pvx, pvy, pMass, pCharge, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 1.0, _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, 1.0);
                                    const f_x = _sroa_38.x;
                                    const f_y = _sroa_38.y;
                                    f1pnX = (f1pnX + f_x);
                                    f1pnY = (f1pnY + f_y);
                                } else if ((!isLeaf)) {
                                    if (((stackTop + 4) <= MAX_STACK)) {
                                        let _inl_34_result;
                                        _inl_34: {
                                            let _inl_34__inl_13_result;
                                            _inl_34__inl_13: {
                                                _inl_34__inl_13_result = (nodeIdx * NODE_STRIDE);
                                                break _inl_34__inl_13;
                                            }
                                            _inl_34_result = rt.bitcast_i32_u32(_b_nodes[(_inl_34__inl_13_result + 12)]);
                                            break _inl_34;
                                        }
                                        const nw = _inl_34_result;
                                        let _inl_35_result;
                                        _inl_35: {
                                            let _inl_35__inl_14_result;
                                            _inl_35__inl_14: {
                                                _inl_35__inl_14_result = (nodeIdx * NODE_STRIDE);
                                                break _inl_35__inl_14;
                                            }
                                            _inl_35_result = rt.bitcast_i32_u32(_b_nodes[(_inl_35__inl_14_result + 13)]);
                                            break _inl_35;
                                        }
                                        const ne = _inl_35_result;
                                        let _inl_36_result;
                                        _inl_36: {
                                            let _inl_36__inl_15_result;
                                            _inl_36__inl_15: {
                                                _inl_36__inl_15_result = (nodeIdx * NODE_STRIDE);
                                                break _inl_36__inl_15;
                                            }
                                            _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_15_result + 14)]);
                                            break _inl_36;
                                        }
                                        const sw = _inl_36_result;
                                        let _inl_37_result;
                                        _inl_37: {
                                            let _inl_37__inl_16_result;
                                            _inl_37__inl_16: {
                                                _inl_37__inl_16_result = (nodeIdx * NODE_STRIDE);
                                                break _inl_37__inl_16;
                                            }
                                            _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_16_result + 15)]);
                                            break _inl_37;
                                        }
                                        const se = _inl_37_result;
                                        if ((nw != NONE)) {
                                            stack[stackTop] = ((nw) >>> 0);
                                            stackTop = (stackTop + 1);
                                        }
                                        if ((ne != NONE)) {
                                            stack[stackTop] = ((ne) >>> 0);
                                            stackTop = (stackTop + 1);
                                        }
                                        if ((sw != NONE)) {
                                            stack[stackTop] = ((sw) >>> 0);
                                            stackTop = (stackTop + 1);
                                        }
                                        if ((se != NONE)) {
                                            stack[stackTop] = ((se) >>> 0);
                                            stackTop = (stackTop + 1);
                                        }
                                    }
                                }
                            }
                            const _sroa_39_base = ((i) * 40);
                            let afOut_f0_x = _b_allForces[_sroa_39_base + 0];
                            let afOut_f0_y = _b_allForces[_sroa_39_base + 1];
                            let afOut_f0_z = _b_allForces[_sroa_39_base + 2];
                            let afOut_f0_w = _b_allForces[_sroa_39_base + 3];
                            let afOut_f1_x = _b_allForces[_sroa_39_base + 4];
                            let afOut_f1_y = _b_allForces[_sroa_39_base + 5];
                            let afOut_f1_z = _b_allForces[_sroa_39_base + 6];
                            let afOut_f1_w = _b_allForces[_sroa_39_base + 7];
                            let afOut_f2_x = _b_allForces[_sroa_39_base + 8];
                            let afOut_f2_y = _b_allForces[_sroa_39_base + 9];
                            let afOut_f2_z = _b_allForces[_sroa_39_base + 10];
                            let afOut_f2_w = _b_allForces[_sroa_39_base + 11];
                            let afOut_f3_x = _b_allForces[_sroa_39_base + 12];
                            let afOut_f3_y = _b_allForces[_sroa_39_base + 13];
                            let afOut_f3_z = _b_allForces[_sroa_39_base + 14];
                            let afOut_f3_w = _b_allForces[_sroa_39_base + 15];
                            let afOut_f4_x = _b_allForces[_sroa_39_base + 16];
                            let afOut_f4_y = _b_allForces[_sroa_39_base + 17];
                            let afOut_f4_z = _b_allForces[_sroa_39_base + 18];
                            let afOut_f4_w = _b_allForces[_sroa_39_base + 19];
                            let afOut_f5_x = _b_allForces[_sroa_39_base + 20];
                            let afOut_f5_y = _b_allForces[_sroa_39_base + 21];
                            let afOut_f5_z = _b_allForces[_sroa_39_base + 22];
                            let afOut_f5_w = _b_allForces[_sroa_39_base + 23];
                            let afOut_torques_x = _b_allForces[_sroa_39_base + 24];
                            let afOut_torques_y = _b_allForces[_sroa_39_base + 25];
                            let afOut_torques_z = _b_allForces[_sroa_39_base + 26];
                            let afOut_torques_w = _b_allForces[_sroa_39_base + 27];
                            let afOut_bFields_x = _b_allForces[_sroa_39_base + 28];
                            let afOut_bFields_y = _b_allForces[_sroa_39_base + 29];
                            let afOut_bFields_z = _b_allForces[_sroa_39_base + 30];
                            let afOut_bFields_w = _b_allForces[_sroa_39_base + 31];
                            let afOut_bFieldGrads_x = _b_allForces[_sroa_39_base + 32];
                            let afOut_bFieldGrads_y = _b_allForces[_sroa_39_base + 33];
                            let afOut_bFieldGrads_z = _b_allForces[_sroa_39_base + 34];
                            let afOut_bFieldGrads_w = _b_allForces[_sroa_39_base + 35];
                            let afOut_totalForce_x = _b_allForces[_sroa_39_base + 36];
                            let afOut_totalForce_y = _b_allForces[_sroa_39_base + 37];
                            let afOut_jerk_x = _b_allForces[_sroa_39_base + 38];
                            let afOut_jerk_y = _b_allForces[_sroa_39_base + 39];
                            afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                            afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                            {
                                const _wbase = ((i) * 40);
                                _b_allForces[_wbase + 0] = afOut_f0_x;
                                _b_allForces[_wbase + 1] = afOut_f0_y;
                                _b_allForces[_wbase + 2] = afOut_f0_z;
                                _b_allForces[_wbase + 3] = afOut_f0_w;
                                _b_allForces[_wbase + 4] = afOut_f1_x;
                                _b_allForces[_wbase + 5] = afOut_f1_y;
                                _b_allForces[_wbase + 6] = afOut_f1_z;
                                _b_allForces[_wbase + 7] = afOut_f1_w;
                                _b_allForces[_wbase + 8] = afOut_f2_x;
                                _b_allForces[_wbase + 9] = afOut_f2_y;
                                _b_allForces[_wbase + 10] = afOut_f2_z;
                                _b_allForces[_wbase + 11] = afOut_f2_w;
                                _b_allForces[_wbase + 12] = afOut_f3_x;
                                _b_allForces[_wbase + 13] = afOut_f3_y;
                                _b_allForces[_wbase + 14] = afOut_f3_z;
                                _b_allForces[_wbase + 15] = afOut_f3_w;
                                _b_allForces[_wbase + 16] = afOut_f4_x;
                                _b_allForces[_wbase + 17] = afOut_f4_y;
                                _b_allForces[_wbase + 18] = afOut_f4_z;
                                _b_allForces[_wbase + 19] = afOut_f4_w;
                                _b_allForces[_wbase + 20] = afOut_f5_x;
                                _b_allForces[_wbase + 21] = afOut_f5_y;
                                _b_allForces[_wbase + 22] = afOut_f5_z;
                                _b_allForces[_wbase + 23] = afOut_f5_w;
                                _b_allForces[_wbase + 24] = afOut_torques_x;
                                _b_allForces[_wbase + 25] = afOut_torques_y;
                                _b_allForces[_wbase + 26] = afOut_torques_z;
                                _b_allForces[_wbase + 27] = afOut_torques_w;
                                _b_allForces[_wbase + 28] = afOut_bFields_x;
                                _b_allForces[_wbase + 29] = afOut_bFields_y;
                                _b_allForces[_wbase + 30] = afOut_bFields_z;
                                _b_allForces[_wbase + 31] = afOut_bFields_w;
                                _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                                _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                                _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                                _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                                _b_allForces[_wbase + 36] = afOut_totalForce_x;
                                _b_allForces[_wbase + 37] = afOut_totalForce_y;
                                _b_allForces[_wbase + 38] = afOut_jerk_x;
                                _b_allForces[_wbase + 39] = afOut_jerk_y;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const i = gid_x;
                        if ((i >= _u_u_aliveCount)) {
                            break __invocation;
                        }
                        if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        if ((((_b_particles[((i) * 9 + 8)] & FLAG_GHOST)) != 0)) {
                            break __invocation;
                        }
                        const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                        const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                        const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                        const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                        const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                        const _sroa_40_base = ((i) * 40);
                        let af_f0_x = _b_allForces[_sroa_40_base + 0];
                        let af_f0_y = _b_allForces[_sroa_40_base + 1];
                        let af_f0_z = _b_allForces[_sroa_40_base + 2];
                        let af_f0_w = _b_allForces[_sroa_40_base + 3];
                        let af_f1_x = _b_allForces[_sroa_40_base + 4];
                        let af_f1_y = _b_allForces[_sroa_40_base + 5];
                        let af_f1_z = _b_allForces[_sroa_40_base + 6];
                        let af_f1_w = _b_allForces[_sroa_40_base + 7];
                        let af_f2_x = _b_allForces[_sroa_40_base + 8];
                        let af_f2_y = _b_allForces[_sroa_40_base + 9];
                        let af_f2_z = _b_allForces[_sroa_40_base + 10];
                        let af_f2_w = _b_allForces[_sroa_40_base + 11];
                        let af_f3_x = _b_allForces[_sroa_40_base + 12];
                        let af_f3_y = _b_allForces[_sroa_40_base + 13];
                        let af_f3_z = _b_allForces[_sroa_40_base + 14];
                        let af_f3_w = _b_allForces[_sroa_40_base + 15];
                        let af_f4_x = _b_allForces[_sroa_40_base + 16];
                        let af_f4_y = _b_allForces[_sroa_40_base + 17];
                        let af_f4_z = _b_allForces[_sroa_40_base + 18];
                        let af_f4_w = _b_allForces[_sroa_40_base + 19];
                        let af_f5_x = _b_allForces[_sroa_40_base + 20];
                        let af_f5_y = _b_allForces[_sroa_40_base + 21];
                        let af_f5_z = _b_allForces[_sroa_40_base + 22];
                        let af_f5_w = _b_allForces[_sroa_40_base + 23];
                        let af_torques_x = _b_allForces[_sroa_40_base + 24];
                        let af_torques_y = _b_allForces[_sroa_40_base + 25];
                        let af_torques_z = _b_allForces[_sroa_40_base + 26];
                        let af_torques_w = _b_allForces[_sroa_40_base + 27];
                        let af_bFields_x = _b_allForces[_sroa_40_base + 28];
                        let af_bFields_y = _b_allForces[_sroa_40_base + 29];
                        let af_bFields_z = _b_allForces[_sroa_40_base + 30];
                        let af_bFields_w = _b_allForces[_sroa_40_base + 31];
                        let af_bFieldGrads_x = _b_allForces[_sroa_40_base + 32];
                        let af_bFieldGrads_y = _b_allForces[_sroa_40_base + 33];
                        let af_bFieldGrads_z = _b_allForces[_sroa_40_base + 34];
                        let af_bFieldGrads_w = _b_allForces[_sroa_40_base + 35];
                        let af_totalForce_x = _b_allForces[_sroa_40_base + 36];
                        let af_totalForce_y = _b_allForces[_sroa_40_base + 37];
                        let af_jerk_x = _b_allForces[_sroa_40_base + 38];
                        let af_jerk_y = _b_allForces[_sroa_40_base + 39];
                        af_f2_x = 0.0;
                        af_f2_y = 0.0;
                        {
                            const _wbase = ((i) * 40);
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
                        const px = _b_particles[((i) * 9 + 0)];
                        const py = _b_particles[((i) * 9 + 1)];
                        const wx = _b_particles[((i) * 9 + 2)];
                        const wy = _b_particles[((i) * 9 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        const invG = (1.0 / gamma);
                        const pvx = (wx * invG);
                        const pvy = (wy * invG);
                        const pMass = _b_particles[((i) * 9 + 4)];
                        const pCharge = _b_particles[((i) * 9 + 5)];
                        let f1pnX = 0.0;
                        let f1pnY = 0.0;
                        const pYukModT = _b_axYukMod[((i) * 4 + 0) + 1];
                        const pHiggsModT = _b_axYukMod[((i) * 4 + 0) + 2];
                        const higgsOnT = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                        let stack = Array.from({ length: 48 }, () => 0);
                        let stackTop = 1;
                        stack[0] = 0;
                        while (true) {
                            if ((stackTop == 0)) {
                                break;
                            }
                            stackTop = (stackTop - 1);
                            const nodeIdx = stack[stackTop];
                            let _inl_24_result;
                            _inl_24: {
                                let _inl_24__inl_7_result;
                                _inl_24__inl_7: {
                                    _inl_24__inl_7_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_24__inl_7;
                                }
                                _inl_24_result = rt.bitcast_f32_u32(_b_nodes[(_inl_24__inl_7_result + 6)]);
                                break _inl_24;
                            }
                            const nodeMass = _inl_24_result;
                            if ((nodeMass < EPSILON)) {
                                continue;
                            }
                            let _inl_25_result;
                            _inl_25: {
                                let _inl_25__inl_5_result;
                                _inl_25__inl_5: {
                                    _inl_25__inl_5_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_25__inl_5;
                                }
                                _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                                break _inl_25;
                            }
                            const comX = _inl_25_result;
                            let _inl_26_result;
                            _inl_26: {
                                let _inl_26__inl_6_result;
                                _inl_26__inl_6: {
                                    _inl_26__inl_6_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_26__inl_6;
                                }
                                _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                                break _inl_26;
                            }
                            const comY = _inl_26_result;
                            let dx = (comX - px);
                            let dy = (comY - py);
                            if (periodic) {
                                const _sroa_41 = fullMinImageP(px, py, comX, comY, _u_u_domainW, _u_u_domainH, _u_u_topologyMode);
                                const d_x = _sroa_41.x;
                                const d_y = _sroa_41.y;
                                dx = d_x;
                                dy = d_y;
                            }
                            const dSq = ((dx * dx) + (dy * dy));
                            let _inl_27_result;
                            _inl_27: {
                                let _inl_27__inl_3_result;
                                _inl_27__inl_3: {
                                    _inl_27__inl_3_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_27__inl_3;
                                }
                                _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                                break _inl_27;
                            }
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_1_result;
                                _inl_28__inl_1: {
                                    _inl_28__inl_1_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_28__inl_1;
                                }
                                _inl_28_result = rt.bitcast_f32_u32(_b_nodes[_inl_28__inl_1_result]);
                                break _inl_28;
                            }
                            const size = (_inl_27_result - _inl_28_result);
                            let _inl_29_result;
                            _inl_29: {
                                let _inl_29__inl_13_result;
                                _inl_29__inl_13: {
                                    _inl_29__inl_13_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_29__inl_13;
                                }
                                _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                                break _inl_29;
                            }
                            const isLeaf = (_inl_29_result == NONE);
                            let _inl_30_result;
                            _inl_30: {
                                let _inl_30__inl_17_result;
                                _inl_30__inl_17: {
                                    _inl_30__inl_17_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_30__inl_17;
                                }
                                _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_17_result + 16)]);
                                break _inl_30;
                            }
                            const particleIdx = _inl_30_result;
                            if ((isLeaf && (particleIdx >= 0))) {
                                const sIdx = ((particleIdx) >>> 0);
                                const _sroa_42_base = ((sIdx) * 9);
                                const sPs_posX = _b_particles[_sroa_42_base + 0];
                                const sPs_posY = _b_particles[_sroa_42_base + 1];
                                const sPs_velWX = _b_particles[_sroa_42_base + 2];
                                const sPs_velWY = _b_particles[_sroa_42_base + 3];
                                const sPs_mass = _b_particles[_sroa_42_base + 4];
                                const sPs_charge = _b_particles[_sroa_42_base + 5];
                                const sPs_angW = _b_particles[_sroa_42_base + 6];
                                const sPs_baseMass = _b_particles[_sroa_42_base + 7];
                                const sPs_flags = _b_particles[_sroa_42_base + 8];
                                if ((sIdx == i)) {
                                    continue;
                                }
                                const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                                let origIdx = sIdx;
                                if ((isGhost && (sIdx >= _u_u_aliveCount))) {
                                    origIdx = _b_ghostOriginalIdx[(sIdx - _u_u_aliveCount)];
                                }
                                if ((origIdx == i)) {
                                    continue;
                                }
                                const sIsRetired = (((sPs_flags & FLAG_RETIRED)) != 0);
                                if ((((sPs_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                if (sIsRetired) {
                                    continue;
                                }
                                let sx = 0;
                                let sy = 0;
                                let svx = 0;
                                let svy = 0;
                                if ((signalDelayed && (!isGhost))) {
                                    const _sroa_43 = getDelayedStateGPU(sIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                    const delayed_x = _sroa_43.x;
                                    const delayed_y = _sroa_43.y;
                                    const delayed_vx = _sroa_43.vx;
                                    const delayed_vy = _sroa_43.vy;
                                    const delayed_angw = _sroa_43.angw;
                                    const delayed_valid = _sroa_43.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    sx = delayed_x;
                                    sy = delayed_y;
                                    svx = delayed_vx;
                                    svy = delayed_vy;
                                } else if ((signalDelayed && isGhost)) {
                                    const _sroa_44_base = ((origIdx) * 9);
                                    const origPs_posX = _b_particles[_sroa_44_base + 0];
                                    const origPs_posY = _b_particles[_sroa_44_base + 1];
                                    const origPs_velWX = _b_particles[_sroa_44_base + 2];
                                    const origPs_velWY = _b_particles[_sroa_44_base + 3];
                                    const origPs_mass = _b_particles[_sroa_44_base + 4];
                                    const origPs_charge = _b_particles[_sroa_44_base + 5];
                                    const origPs_angW = _b_particles[_sroa_44_base + 6];
                                    const origPs_baseMass = _b_particles[_sroa_44_base + 7];
                                    const origPs_flags = _b_particles[_sroa_44_base + 8];
                                    const _sroa_45 = getDelayedStateGPU(origIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                    const delayed_x = _sroa_45.x;
                                    const delayed_y = _sroa_45.y;
                                    const delayed_vx = _sroa_45.vx;
                                    const delayed_vy = _sroa_45.vy;
                                    const delayed_angw = _sroa_45.angw;
                                    const delayed_valid = _sroa_45.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    const shiftX = (sPs_posX - origPs_posX);
                                    const shiftY = (sPs_posY - origPs_posY);
                                    sx = (delayed_x + shiftX);
                                    sy = (delayed_y + shiftY);
                                    svx = delayed_vx;
                                    svy = delayed_vy;
                                } else {
                                    sx = sPs_posX;
                                    sy = sPs_posY;
                                    const swx = sPs_velWX;
                                    const swy = sPs_velWY;
                                    const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                    svx = (swx / sg);
                                    svy = (swy / sg);
                                }
                                const _sroa_46 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, sPs_mass, sPs_charge, _b_axYukMod[((sIdx) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, _b_axYukMod[((sIdx) * 4 + 0) + 2]);
                                const f_x = _sroa_46.x;
                                const f_y = _sroa_46.y;
                                f1pnX = (f1pnX + f_x);
                                f1pnY = (f1pnY + f_y);
                            } else if (((!isLeaf) && (((size * size) < (BH_THETA_SQ * dSq))))) {
                                let _inl_31_result;
                                _inl_31: {
                                    let _inl_31__inl_11_result;
                                    _inl_31__inl_11: {
                                        _inl_31__inl_11_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_31__inl_11;
                                    }
                                    _inl_31_result = rt.bitcast_f32_u32(_b_nodes[(_inl_31__inl_11_result + 10)]);
                                    break _inl_31;
                                }
                                const avgVx = (_inl_31_result / nodeMass);
                                let _inl_32_result;
                                _inl_32: {
                                    let _inl_32__inl_12_result;
                                    _inl_32__inl_12: {
                                        _inl_32__inl_12_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_32__inl_12;
                                    }
                                    _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_12_result + 11)]);
                                    break _inl_32;
                                }
                                const avgVy = (_inl_32_result / nodeMass);
                                let _inl_33_result;
                                _inl_33: {
                                    let _inl_33__inl_8_result;
                                    _inl_33__inl_8: {
                                        _inl_33__inl_8_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_33__inl_8;
                                    }
                                    _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_8_result + 7)]);
                                    break _inl_33;
                                }
                                const _sroa_47 = accum1PN(px, py, pvx, pvy, pMass, pCharge, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 1.0, _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, 1.0);
                                const f_x = _sroa_47.x;
                                const f_y = _sroa_47.y;
                                f1pnX = (f1pnX + f_x);
                                f1pnY = (f1pnY + f_y);
                            } else if ((!isLeaf)) {
                                if (((stackTop + 4) <= MAX_STACK)) {
                                    let _inl_34_result;
                                    _inl_34: {
                                        let _inl_34__inl_13_result;
                                        _inl_34__inl_13: {
                                            _inl_34__inl_13_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_34__inl_13;
                                        }
                                        _inl_34_result = rt.bitcast_i32_u32(_b_nodes[(_inl_34__inl_13_result + 12)]);
                                        break _inl_34;
                                    }
                                    const nw = _inl_34_result;
                                    let _inl_35_result;
                                    _inl_35: {
                                        let _inl_35__inl_14_result;
                                        _inl_35__inl_14: {
                                            _inl_35__inl_14_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_35__inl_14;
                                        }
                                        _inl_35_result = rt.bitcast_i32_u32(_b_nodes[(_inl_35__inl_14_result + 13)]);
                                        break _inl_35;
                                    }
                                    const ne = _inl_35_result;
                                    let _inl_36_result;
                                    _inl_36: {
                                        let _inl_36__inl_15_result;
                                        _inl_36__inl_15: {
                                            _inl_36__inl_15_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_36__inl_15;
                                        }
                                        _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_15_result + 14)]);
                                        break _inl_36;
                                    }
                                    const sw = _inl_36_result;
                                    let _inl_37_result;
                                    _inl_37: {
                                        let _inl_37__inl_16_result;
                                        _inl_37__inl_16: {
                                            _inl_37__inl_16_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_37__inl_16;
                                        }
                                        _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_16_result + 15)]);
                                        break _inl_37;
                                    }
                                    const se = _inl_37_result;
                                    if ((nw != NONE)) {
                                        stack[stackTop] = ((nw) >>> 0);
                                        stackTop = (stackTop + 1);
                                    }
                                    if ((ne != NONE)) {
                                        stack[stackTop] = ((ne) >>> 0);
                                        stackTop = (stackTop + 1);
                                    }
                                    if ((sw != NONE)) {
                                        stack[stackTop] = ((sw) >>> 0);
                                        stackTop = (stackTop + 1);
                                    }
                                    if ((se != NONE)) {
                                        stack[stackTop] = ((se) >>> 0);
                                        stackTop = (stackTop + 1);
                                    }
                                }
                            }
                        }
                        const _sroa_48_base = ((i) * 40);
                        let afOut_f0_x = _b_allForces[_sroa_48_base + 0];
                        let afOut_f0_y = _b_allForces[_sroa_48_base + 1];
                        let afOut_f0_z = _b_allForces[_sroa_48_base + 2];
                        let afOut_f0_w = _b_allForces[_sroa_48_base + 3];
                        let afOut_f1_x = _b_allForces[_sroa_48_base + 4];
                        let afOut_f1_y = _b_allForces[_sroa_48_base + 5];
                        let afOut_f1_z = _b_allForces[_sroa_48_base + 6];
                        let afOut_f1_w = _b_allForces[_sroa_48_base + 7];
                        let afOut_f2_x = _b_allForces[_sroa_48_base + 8];
                        let afOut_f2_y = _b_allForces[_sroa_48_base + 9];
                        let afOut_f2_z = _b_allForces[_sroa_48_base + 10];
                        let afOut_f2_w = _b_allForces[_sroa_48_base + 11];
                        let afOut_f3_x = _b_allForces[_sroa_48_base + 12];
                        let afOut_f3_y = _b_allForces[_sroa_48_base + 13];
                        let afOut_f3_z = _b_allForces[_sroa_48_base + 14];
                        let afOut_f3_w = _b_allForces[_sroa_48_base + 15];
                        let afOut_f4_x = _b_allForces[_sroa_48_base + 16];
                        let afOut_f4_y = _b_allForces[_sroa_48_base + 17];
                        let afOut_f4_z = _b_allForces[_sroa_48_base + 18];
                        let afOut_f4_w = _b_allForces[_sroa_48_base + 19];
                        let afOut_f5_x = _b_allForces[_sroa_48_base + 20];
                        let afOut_f5_y = _b_allForces[_sroa_48_base + 21];
                        let afOut_f5_z = _b_allForces[_sroa_48_base + 22];
                        let afOut_f5_w = _b_allForces[_sroa_48_base + 23];
                        let afOut_torques_x = _b_allForces[_sroa_48_base + 24];
                        let afOut_torques_y = _b_allForces[_sroa_48_base + 25];
                        let afOut_torques_z = _b_allForces[_sroa_48_base + 26];
                        let afOut_torques_w = _b_allForces[_sroa_48_base + 27];
                        let afOut_bFields_x = _b_allForces[_sroa_48_base + 28];
                        let afOut_bFields_y = _b_allForces[_sroa_48_base + 29];
                        let afOut_bFields_z = _b_allForces[_sroa_48_base + 30];
                        let afOut_bFields_w = _b_allForces[_sroa_48_base + 31];
                        let afOut_bFieldGrads_x = _b_allForces[_sroa_48_base + 32];
                        let afOut_bFieldGrads_y = _b_allForces[_sroa_48_base + 33];
                        let afOut_bFieldGrads_z = _b_allForces[_sroa_48_base + 34];
                        let afOut_bFieldGrads_w = _b_allForces[_sroa_48_base + 35];
                        let afOut_totalForce_x = _b_allForces[_sroa_48_base + 36];
                        let afOut_totalForce_y = _b_allForces[_sroa_48_base + 37];
                        let afOut_jerk_x = _b_allForces[_sroa_48_base + 38];
                        let afOut_jerk_y = _b_allForces[_sroa_48_base + 39];
                        afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                        afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                        {
                            const _wbase = ((i) * 40);
                            _b_allForces[_wbase + 0] = afOut_f0_x;
                            _b_allForces[_wbase + 1] = afOut_f0_y;
                            _b_allForces[_wbase + 2] = afOut_f0_z;
                            _b_allForces[_wbase + 3] = afOut_f0_w;
                            _b_allForces[_wbase + 4] = afOut_f1_x;
                            _b_allForces[_wbase + 5] = afOut_f1_y;
                            _b_allForces[_wbase + 6] = afOut_f1_z;
                            _b_allForces[_wbase + 7] = afOut_f1_w;
                            _b_allForces[_wbase + 8] = afOut_f2_x;
                            _b_allForces[_wbase + 9] = afOut_f2_y;
                            _b_allForces[_wbase + 10] = afOut_f2_z;
                            _b_allForces[_wbase + 11] = afOut_f2_w;
                            _b_allForces[_wbase + 12] = afOut_f3_x;
                            _b_allForces[_wbase + 13] = afOut_f3_y;
                            _b_allForces[_wbase + 14] = afOut_f3_z;
                            _b_allForces[_wbase + 15] = afOut_f3_w;
                            _b_allForces[_wbase + 16] = afOut_f4_x;
                            _b_allForces[_wbase + 17] = afOut_f4_y;
                            _b_allForces[_wbase + 18] = afOut_f4_z;
                            _b_allForces[_wbase + 19] = afOut_f4_w;
                            _b_allForces[_wbase + 20] = afOut_f5_x;
                            _b_allForces[_wbase + 21] = afOut_f5_y;
                            _b_allForces[_wbase + 22] = afOut_f5_z;
                            _b_allForces[_wbase + 23] = afOut_f5_w;
                            _b_allForces[_wbase + 24] = afOut_torques_x;
                            _b_allForces[_wbase + 25] = afOut_torques_y;
                            _b_allForces[_wbase + 26] = afOut_torques_z;
                            _b_allForces[_wbase + 27] = afOut_torques_w;
                            _b_allForces[_wbase + 28] = afOut_bFields_x;
                            _b_allForces[_wbase + 29] = afOut_bFields_y;
                            _b_allForces[_wbase + 30] = afOut_bFields_z;
                            _b_allForces[_wbase + 31] = afOut_bFields_w;
                            _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                            _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                            _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                            _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                            _b_allForces[_wbase + 36] = afOut_totalForce_x;
                            _b_allForces[_wbase + 37] = afOut_totalForce_y;
                            _b_allForces[_wbase + 38] = afOut_jerk_x;
                            _b_allForces[_wbase + 39] = afOut_jerk_y;
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_GHOST)) != 0)) {
                        break __invocation;
                    }
                    const gmOn = (((_u_u_toggles0 & GRAVITOMAG_BIT)) != 0);
                    const magOn = (((_u_u_toggles0 & MAGNETIC_BIT)) != 0);
                    const yukOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const periodic = (_u_u_boundaryMode == BOUND_LOOP);
                    const signalDelayed = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    const _sroa_49_base = ((i) * 40);
                    let af_f0_x = _b_allForces[_sroa_49_base + 0];
                    let af_f0_y = _b_allForces[_sroa_49_base + 1];
                    let af_f0_z = _b_allForces[_sroa_49_base + 2];
                    let af_f0_w = _b_allForces[_sroa_49_base + 3];
                    let af_f1_x = _b_allForces[_sroa_49_base + 4];
                    let af_f1_y = _b_allForces[_sroa_49_base + 5];
                    let af_f1_z = _b_allForces[_sroa_49_base + 6];
                    let af_f1_w = _b_allForces[_sroa_49_base + 7];
                    let af_f2_x = _b_allForces[_sroa_49_base + 8];
                    let af_f2_y = _b_allForces[_sroa_49_base + 9];
                    let af_f2_z = _b_allForces[_sroa_49_base + 10];
                    let af_f2_w = _b_allForces[_sroa_49_base + 11];
                    let af_f3_x = _b_allForces[_sroa_49_base + 12];
                    let af_f3_y = _b_allForces[_sroa_49_base + 13];
                    let af_f3_z = _b_allForces[_sroa_49_base + 14];
                    let af_f3_w = _b_allForces[_sroa_49_base + 15];
                    let af_f4_x = _b_allForces[_sroa_49_base + 16];
                    let af_f4_y = _b_allForces[_sroa_49_base + 17];
                    let af_f4_z = _b_allForces[_sroa_49_base + 18];
                    let af_f4_w = _b_allForces[_sroa_49_base + 19];
                    let af_f5_x = _b_allForces[_sroa_49_base + 20];
                    let af_f5_y = _b_allForces[_sroa_49_base + 21];
                    let af_f5_z = _b_allForces[_sroa_49_base + 22];
                    let af_f5_w = _b_allForces[_sroa_49_base + 23];
                    let af_torques_x = _b_allForces[_sroa_49_base + 24];
                    let af_torques_y = _b_allForces[_sroa_49_base + 25];
                    let af_torques_z = _b_allForces[_sroa_49_base + 26];
                    let af_torques_w = _b_allForces[_sroa_49_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_49_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_49_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_49_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_49_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_49_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_49_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_49_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_49_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_49_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_49_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_49_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_49_base + 39];
                    af_f2_x = 0.0;
                    af_f2_y = 0.0;
                    {
                        const _wbase = ((i) * 40);
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                    const invG = (1.0 / gamma);
                    const pvx = (wx * invG);
                    const pvy = (wy * invG);
                    const pMass = _b_particles[((i) * 9 + 4)];
                    const pCharge = _b_particles[((i) * 9 + 5)];
                    let f1pnX = 0.0;
                    let f1pnY = 0.0;
                    const pYukModT = _b_axYukMod[((i) * 4 + 0) + 1];
                    const pHiggsModT = _b_axYukMod[((i) * 4 + 0) + 2];
                    const higgsOnT = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let stackTop = 1;
                    stack[0] = 0;
                    while (true) {
                        if ((stackTop == 0)) {
                            break;
                        }
                        stackTop = (stackTop - 1);
                        const nodeIdx = stack[stackTop];
                        let _inl_24_result;
                        _inl_24: {
                            let _inl_24__inl_7_result;
                            _inl_24__inl_7: {
                                _inl_24__inl_7_result = (nodeIdx * NODE_STRIDE);
                                break _inl_24__inl_7;
                            }
                            _inl_24_result = rt.bitcast_f32_u32(_b_nodes[(_inl_24__inl_7_result + 6)]);
                            break _inl_24;
                        }
                        const nodeMass = _inl_24_result;
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        let _inl_25_result;
                        _inl_25: {
                            let _inl_25__inl_5_result;
                            _inl_25__inl_5: {
                                _inl_25__inl_5_result = (nodeIdx * NODE_STRIDE);
                                break _inl_25__inl_5;
                            }
                            _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                            break _inl_25;
                        }
                        const comX = _inl_25_result;
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_6_result;
                            _inl_26__inl_6: {
                                _inl_26__inl_6_result = (nodeIdx * NODE_STRIDE);
                                break _inl_26__inl_6;
                            }
                            _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                            break _inl_26;
                        }
                        const comY = _inl_26_result;
                        let dx = (comX - px);
                        let dy = (comY - py);
                        if (periodic) {
                            const _sroa_50 = fullMinImageP(px, py, comX, comY, _u_u_domainW, _u_u_domainH, _u_u_topologyMode);
                            const d_x = _sroa_50.x;
                            const d_y = _sroa_50.y;
                            dx = d_x;
                            dy = d_y;
                        }
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_27_result;
                        _inl_27: {
                            let _inl_27__inl_3_result;
                            _inl_27__inl_3: {
                                _inl_27__inl_3_result = (nodeIdx * NODE_STRIDE);
                                break _inl_27__inl_3;
                            }
                            _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                            break _inl_27;
                        }
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_1_result;
                            _inl_28__inl_1: {
                                _inl_28__inl_1_result = (nodeIdx * NODE_STRIDE);
                                break _inl_28__inl_1;
                            }
                            _inl_28_result = rt.bitcast_f32_u32(_b_nodes[_inl_28__inl_1_result]);
                            break _inl_28;
                        }
                        const size = (_inl_27_result - _inl_28_result);
                        let _inl_29_result;
                        _inl_29: {
                            let _inl_29__inl_13_result;
                            _inl_29__inl_13: {
                                _inl_29__inl_13_result = (nodeIdx * NODE_STRIDE);
                                break _inl_29__inl_13;
                            }
                            _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                            break _inl_29;
                        }
                        const isLeaf = (_inl_29_result == NONE);
                        let _inl_30_result;
                        _inl_30: {
                            let _inl_30__inl_17_result;
                            _inl_30__inl_17: {
                                _inl_30__inl_17_result = (nodeIdx * NODE_STRIDE);
                                break _inl_30__inl_17;
                            }
                            _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_17_result + 16)]);
                            break _inl_30;
                        }
                        const particleIdx = _inl_30_result;
                        if ((isLeaf && (particleIdx >= 0))) {
                            const sIdx = ((particleIdx) >>> 0);
                            const _sroa_51_base = ((sIdx) * 9);
                            const sPs_posX = _b_particles[_sroa_51_base + 0];
                            const sPs_posY = _b_particles[_sroa_51_base + 1];
                            const sPs_velWX = _b_particles[_sroa_51_base + 2];
                            const sPs_velWY = _b_particles[_sroa_51_base + 3];
                            const sPs_mass = _b_particles[_sroa_51_base + 4];
                            const sPs_charge = _b_particles[_sroa_51_base + 5];
                            const sPs_angW = _b_particles[_sroa_51_base + 6];
                            const sPs_baseMass = _b_particles[_sroa_51_base + 7];
                            const sPs_flags = _b_particles[_sroa_51_base + 8];
                            if ((sIdx == i)) {
                                continue;
                            }
                            const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                            let origIdx = sIdx;
                            if ((isGhost && (sIdx >= _u_u_aliveCount))) {
                                origIdx = _b_ghostOriginalIdx[(sIdx - _u_u_aliveCount)];
                            }
                            if ((origIdx == i)) {
                                continue;
                            }
                            const sIsRetired = (((sPs_flags & FLAG_RETIRED)) != 0);
                            if ((((sPs_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            if (sIsRetired) {
                                continue;
                            }
                            let sx = 0;
                            let sy = 0;
                            let svx = 0;
                            let svy = 0;
                            if ((signalDelayed && (!isGhost))) {
                                const _sroa_52 = getDelayedStateGPU(sIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                const delayed_x = _sroa_52.x;
                                const delayed_y = _sroa_52.y;
                                const delayed_vx = _sroa_52.vx;
                                const delayed_vy = _sroa_52.vy;
                                const delayed_angw = _sroa_52.angw;
                                const delayed_valid = _sroa_52.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                sx = delayed_x;
                                sy = delayed_y;
                                svx = delayed_vx;
                                svy = delayed_vy;
                            } else if ((signalDelayed && isGhost)) {
                                const _sroa_53_base = ((origIdx) * 9);
                                const origPs_posX = _b_particles[_sroa_53_base + 0];
                                const origPs_posY = _b_particles[_sroa_53_base + 1];
                                const origPs_velWX = _b_particles[_sroa_53_base + 2];
                                const origPs_velWY = _b_particles[_sroa_53_base + 3];
                                const origPs_mass = _b_particles[_sroa_53_base + 4];
                                const origPs_charge = _b_particles[_sroa_53_base + 5];
                                const origPs_angW = _b_particles[_sroa_53_base + 6];
                                const origPs_baseMass = _b_particles[_sroa_53_base + 7];
                                const origPs_flags = _b_particles[_sroa_53_base + 8];
                                const _sroa_54 = getDelayedStateGPU(origIdx, px, py, _u_u_simTime, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, false);
                                const delayed_x = _sroa_54.x;
                                const delayed_y = _sroa_54.y;
                                const delayed_vx = _sroa_54.vx;
                                const delayed_vy = _sroa_54.vy;
                                const delayed_angw = _sroa_54.angw;
                                const delayed_valid = _sroa_54.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const shiftX = (sPs_posX - origPs_posX);
                                const shiftY = (sPs_posY - origPs_posY);
                                sx = (delayed_x + shiftX);
                                sy = (delayed_y + shiftY);
                                svx = delayed_vx;
                                svy = delayed_vy;
                            } else {
                                sx = sPs_posX;
                                sy = sPs_posY;
                                const swx = sPs_velWX;
                                const swy = sPs_velWY;
                                const sg = Math.sqrt(((1.0 + (swx * swx)) + (swy * swy)));
                                svx = (swx / sg);
                                svy = (swy / sg);
                            }
                            const _sroa_55 = accum1PN(px, py, pvx, pvy, pMass, pCharge, sx, sy, svx, svy, sPs_mass, sPs_charge, _b_axYukMod[((sIdx) * 4 + 0) + 1], _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, _b_axYukMod[((sIdx) * 4 + 0) + 2]);
                            const f_x = _sroa_55.x;
                            const f_y = _sroa_55.y;
                            f1pnX = (f1pnX + f_x);
                            f1pnY = (f1pnY + f_y);
                        } else if (((!isLeaf) && (((size * size) < (BH_THETA_SQ * dSq))))) {
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_11_result;
                                _inl_31__inl_11: {
                                    _inl_31__inl_11_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_31__inl_11;
                                }
                                _inl_31_result = rt.bitcast_f32_u32(_b_nodes[(_inl_31__inl_11_result + 10)]);
                                break _inl_31;
                            }
                            const avgVx = (_inl_31_result / nodeMass);
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_12_result;
                                _inl_32__inl_12: {
                                    _inl_32__inl_12_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_32__inl_12;
                                }
                                _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_12_result + 11)]);
                                break _inl_32;
                            }
                            const avgVy = (_inl_32_result / nodeMass);
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_8_result;
                                _inl_33__inl_8: {
                                    _inl_33__inl_8_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_33__inl_8;
                                }
                                _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_8_result + 7)]);
                                break _inl_33;
                            }
                            const _sroa_56 = accum1PN(px, py, pvx, pvy, pMass, pCharge, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 1.0, _u_u_softeningSq, periodic, _u_u_domainW, _u_u_domainH, _u_u_topologyMode, gmOn, magOn, yukOn, higgsOnT, _u_u_yukawaMu, _u_u_yukawaCoupling, pYukModT, pHiggsModT, 1.0);
                            const f_x = _sroa_56.x;
                            const f_y = _sroa_56.y;
                            f1pnX = (f1pnX + f_x);
                            f1pnY = (f1pnY + f_y);
                        } else if ((!isLeaf)) {
                            if (((stackTop + 4) <= MAX_STACK)) {
                                let _inl_34_result;
                                _inl_34: {
                                    let _inl_34__inl_13_result;
                                    _inl_34__inl_13: {
                                        _inl_34__inl_13_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_34__inl_13;
                                    }
                                    _inl_34_result = rt.bitcast_i32_u32(_b_nodes[(_inl_34__inl_13_result + 12)]);
                                    break _inl_34;
                                }
                                const nw = _inl_34_result;
                                let _inl_35_result;
                                _inl_35: {
                                    let _inl_35__inl_14_result;
                                    _inl_35__inl_14: {
                                        _inl_35__inl_14_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_35__inl_14;
                                    }
                                    _inl_35_result = rt.bitcast_i32_u32(_b_nodes[(_inl_35__inl_14_result + 13)]);
                                    break _inl_35;
                                }
                                const ne = _inl_35_result;
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_15_result;
                                    _inl_36__inl_15: {
                                        _inl_36__inl_15_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_36__inl_15;
                                    }
                                    _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_15_result + 14)]);
                                    break _inl_36;
                                }
                                const sw = _inl_36_result;
                                let _inl_37_result;
                                _inl_37: {
                                    let _inl_37__inl_16_result;
                                    _inl_37__inl_16: {
                                        _inl_37__inl_16_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_37__inl_16;
                                    }
                                    _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_16_result + 15)]);
                                    break _inl_37;
                                }
                                const se = _inl_37_result;
                                if ((nw != NONE)) {
                                    stack[stackTop] = ((nw) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((ne != NONE)) {
                                    stack[stackTop] = ((ne) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((sw != NONE)) {
                                    stack[stackTop] = ((sw) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                                if ((se != NONE)) {
                                    stack[stackTop] = ((se) >>> 0);
                                    stackTop = (stackTop + 1);
                                }
                            }
                        }
                    }
                    const _sroa_57_base = ((i) * 40);
                    let afOut_f0_x = _b_allForces[_sroa_57_base + 0];
                    let afOut_f0_y = _b_allForces[_sroa_57_base + 1];
                    let afOut_f0_z = _b_allForces[_sroa_57_base + 2];
                    let afOut_f0_w = _b_allForces[_sroa_57_base + 3];
                    let afOut_f1_x = _b_allForces[_sroa_57_base + 4];
                    let afOut_f1_y = _b_allForces[_sroa_57_base + 5];
                    let afOut_f1_z = _b_allForces[_sroa_57_base + 6];
                    let afOut_f1_w = _b_allForces[_sroa_57_base + 7];
                    let afOut_f2_x = _b_allForces[_sroa_57_base + 8];
                    let afOut_f2_y = _b_allForces[_sroa_57_base + 9];
                    let afOut_f2_z = _b_allForces[_sroa_57_base + 10];
                    let afOut_f2_w = _b_allForces[_sroa_57_base + 11];
                    let afOut_f3_x = _b_allForces[_sroa_57_base + 12];
                    let afOut_f3_y = _b_allForces[_sroa_57_base + 13];
                    let afOut_f3_z = _b_allForces[_sroa_57_base + 14];
                    let afOut_f3_w = _b_allForces[_sroa_57_base + 15];
                    let afOut_f4_x = _b_allForces[_sroa_57_base + 16];
                    let afOut_f4_y = _b_allForces[_sroa_57_base + 17];
                    let afOut_f4_z = _b_allForces[_sroa_57_base + 18];
                    let afOut_f4_w = _b_allForces[_sroa_57_base + 19];
                    let afOut_f5_x = _b_allForces[_sroa_57_base + 20];
                    let afOut_f5_y = _b_allForces[_sroa_57_base + 21];
                    let afOut_f5_z = _b_allForces[_sroa_57_base + 22];
                    let afOut_f5_w = _b_allForces[_sroa_57_base + 23];
                    let afOut_torques_x = _b_allForces[_sroa_57_base + 24];
                    let afOut_torques_y = _b_allForces[_sroa_57_base + 25];
                    let afOut_torques_z = _b_allForces[_sroa_57_base + 26];
                    let afOut_torques_w = _b_allForces[_sroa_57_base + 27];
                    let afOut_bFields_x = _b_allForces[_sroa_57_base + 28];
                    let afOut_bFields_y = _b_allForces[_sroa_57_base + 29];
                    let afOut_bFields_z = _b_allForces[_sroa_57_base + 30];
                    let afOut_bFields_w = _b_allForces[_sroa_57_base + 31];
                    let afOut_bFieldGrads_x = _b_allForces[_sroa_57_base + 32];
                    let afOut_bFieldGrads_y = _b_allForces[_sroa_57_base + 33];
                    let afOut_bFieldGrads_z = _b_allForces[_sroa_57_base + 34];
                    let afOut_bFieldGrads_w = _b_allForces[_sroa_57_base + 35];
                    let afOut_totalForce_x = _b_allForces[_sroa_57_base + 36];
                    let afOut_totalForce_y = _b_allForces[_sroa_57_base + 37];
                    let afOut_jerk_x = _b_allForces[_sroa_57_base + 38];
                    let afOut_jerk_y = _b_allForces[_sroa_57_base + 39];
                    afOut_f2_x = ((f1pnX != f1pnX) ? 0.0 : f1pnX);
                    afOut_f2_y = ((f1pnY != f1pnY) ? 0.0 : f1pnY);
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afOut_f0_x;
                        _b_allForces[_wbase + 1] = afOut_f0_y;
                        _b_allForces[_wbase + 2] = afOut_f0_z;
                        _b_allForces[_wbase + 3] = afOut_f0_w;
                        _b_allForces[_wbase + 4] = afOut_f1_x;
                        _b_allForces[_wbase + 5] = afOut_f1_y;
                        _b_allForces[_wbase + 6] = afOut_f1_z;
                        _b_allForces[_wbase + 7] = afOut_f1_w;
                        _b_allForces[_wbase + 8] = afOut_f2_x;
                        _b_allForces[_wbase + 9] = afOut_f2_y;
                        _b_allForces[_wbase + 10] = afOut_f2_z;
                        _b_allForces[_wbase + 11] = afOut_f2_w;
                        _b_allForces[_wbase + 12] = afOut_f3_x;
                        _b_allForces[_wbase + 13] = afOut_f3_y;
                        _b_allForces[_wbase + 14] = afOut_f3_z;
                        _b_allForces[_wbase + 15] = afOut_f3_w;
                        _b_allForces[_wbase + 16] = afOut_f4_x;
                        _b_allForces[_wbase + 17] = afOut_f4_y;
                        _b_allForces[_wbase + 18] = afOut_f4_z;
                        _b_allForces[_wbase + 19] = afOut_f4_w;
                        _b_allForces[_wbase + 20] = afOut_f5_x;
                        _b_allForces[_wbase + 21] = afOut_f5_y;
                        _b_allForces[_wbase + 22] = afOut_f5_z;
                        _b_allForces[_wbase + 23] = afOut_f5_w;
                        _b_allForces[_wbase + 24] = afOut_torques_x;
                        _b_allForces[_wbase + 25] = afOut_torques_y;
                        _b_allForces[_wbase + 26] = afOut_torques_z;
                        _b_allForces[_wbase + 27] = afOut_torques_w;
                        _b_allForces[_wbase + 28] = afOut_bFields_x;
                        _b_allForces[_wbase + 29] = afOut_bFields_y;
                        _b_allForces[_wbase + 30] = afOut_bFields_z;
                        _b_allForces[_wbase + 31] = afOut_bFields_w;
                        _b_allForces[_wbase + 32] = afOut_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afOut_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afOut_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afOut_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afOut_totalForce_x;
                        _b_allForces[_wbase + 37] = afOut_totalForce_y;
                        _b_allForces[_wbase + 38] = afOut_jerk_x;
                        _b_allForces[_wbase + 39] = afOut_jerk_y;
                    }
                }
            }
        }
    }
    entry["compute1PNTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_compute1PNTree(workgroups, bindings, domain, origin);
    };

    entryInfo["vvKick1PN"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_vvKick1PN(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_allForces = bindings.allForces;
        const _b_f1pnOld = bindings.f1pnOld;
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const halfDtOverM = ((_u_u_dt * 0.5) * _b_derived[((i) * 8 + 2)]);
                    const _sroa_58_base = ((i) * 40 + 8);
                    const af1pn_x = _b_allForces[_sroa_58_base + 0];
                    const af1pn_y = _b_allForces[_sroa_58_base + 1];
                    const af1pn_z = _b_allForces[_sroa_58_base + 2];
                    const af1pn_w = _b_allForces[_sroa_58_base + 3];
                    const _sroa_59 = {x:af1pn_x, y:af1pn_y};
                    const newF_x = _sroa_59.x;
                    const newF_y = _sroa_59.y;
                    const _sroa_60 = {x:_b_f1pnOld[(i * 2)], y:_b_f1pnOld[((i * 2) + 1)]};
                    const oldF_x = _sroa_60.x;
                    const oldF_y = _sroa_60.y;
                    {
                        const _wbase = ((i) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + (((newF_x - oldF_x)) * halfDtOverM));
                    }
                    {
                        const _wbase = ((i) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + (((newF_y - oldF_y)) * halfDtOverM));
                    }
                    if (((_b_particles[((i) * 9 + 2)] != _b_particles[((i) * 9 + 2)]) || (_b_particles[((i) * 9 + 3)] != _b_particles[((i) * 9 + 3)]))) {
                        {
                            const _wbase = ((i) * 9 + 2) - 2;
                            _b_particles[_wbase + 2] = 0.0;
                        }
                        {
                            const _wbase = ((i) * 9 + 3) - 3;
                            _b_particles[_wbase + 3] = 0.0;
                        }
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const i = gid_x;
                            if ((i >= _u_u_aliveCount)) {
                                break __invocation;
                            }
                            if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            const halfDtOverM = ((_u_u_dt * 0.5) * _b_derived[((i) * 8 + 2)]);
                            const _sroa_61_base = ((i) * 40 + 8);
                            const af1pn_x = _b_allForces[_sroa_61_base + 0];
                            const af1pn_y = _b_allForces[_sroa_61_base + 1];
                            const af1pn_z = _b_allForces[_sroa_61_base + 2];
                            const af1pn_w = _b_allForces[_sroa_61_base + 3];
                            const _sroa_62 = {x:af1pn_x, y:af1pn_y};
                            const newF_x = _sroa_62.x;
                            const newF_y = _sroa_62.y;
                            const _sroa_63 = {x:_b_f1pnOld[(i * 2)], y:_b_f1pnOld[((i * 2) + 1)]};
                            const oldF_x = _sroa_63.x;
                            const oldF_y = _sroa_63.y;
                            {
                                const _wbase = ((i) * 9 + 2) - 2;
                                _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + (((newF_x - oldF_x)) * halfDtOverM));
                            }
                            {
                                const _wbase = ((i) * 9 + 3) - 3;
                                _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + (((newF_y - oldF_y)) * halfDtOverM));
                            }
                            if (((_b_particles[((i) * 9 + 2)] != _b_particles[((i) * 9 + 2)]) || (_b_particles[((i) * 9 + 3)] != _b_particles[((i) * 9 + 3)]))) {
                                {
                                    const _wbase = ((i) * 9 + 2) - 2;
                                    _b_particles[_wbase + 2] = 0.0;
                                }
                                {
                                    const _wbase = ((i) * 9 + 3) - 3;
                                    _b_particles[_wbase + 3] = 0.0;
                                }
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const i = gid_x;
                        if ((i >= _u_u_aliveCount)) {
                            break __invocation;
                        }
                        if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        const halfDtOverM = ((_u_u_dt * 0.5) * _b_derived[((i) * 8 + 2)]);
                        const _sroa_64_base = ((i) * 40 + 8);
                        const af1pn_x = _b_allForces[_sroa_64_base + 0];
                        const af1pn_y = _b_allForces[_sroa_64_base + 1];
                        const af1pn_z = _b_allForces[_sroa_64_base + 2];
                        const af1pn_w = _b_allForces[_sroa_64_base + 3];
                        const _sroa_65 = {x:af1pn_x, y:af1pn_y};
                        const newF_x = _sroa_65.x;
                        const newF_y = _sroa_65.y;
                        const _sroa_66 = {x:_b_f1pnOld[(i * 2)], y:_b_f1pnOld[((i * 2) + 1)]};
                        const oldF_x = _sroa_66.x;
                        const oldF_y = _sroa_66.y;
                        {
                            const _wbase = ((i) * 9 + 2) - 2;
                            _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + (((newF_x - oldF_x)) * halfDtOverM));
                        }
                        {
                            const _wbase = ((i) * 9 + 3) - 3;
                            _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + (((newF_y - oldF_y)) * halfDtOverM));
                        }
                        if (((_b_particles[((i) * 9 + 2)] != _b_particles[((i) * 9 + 2)]) || (_b_particles[((i) * 9 + 3)] != _b_particles[((i) * 9 + 3)]))) {
                            {
                                const _wbase = ((i) * 9 + 2) - 2;
                                _b_particles[_wbase + 2] = 0.0;
                            }
                            {
                                const _wbase = ((i) * 9 + 3) - 3;
                                _b_particles[_wbase + 3] = 0.0;
                            }
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
                    const i = gid_x;
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const halfDtOverM = ((_u_u_dt * 0.5) * _b_derived[((i) * 8 + 2)]);
                    const _sroa_67_base = ((i) * 40 + 8);
                    const af1pn_x = _b_allForces[_sroa_67_base + 0];
                    const af1pn_y = _b_allForces[_sroa_67_base + 1];
                    const af1pn_z = _b_allForces[_sroa_67_base + 2];
                    const af1pn_w = _b_allForces[_sroa_67_base + 3];
                    const _sroa_68 = {x:af1pn_x, y:af1pn_y};
                    const newF_x = _sroa_68.x;
                    const newF_y = _sroa_68.y;
                    const _sroa_69 = {x:_b_f1pnOld[(i * 2)], y:_b_f1pnOld[((i * 2) + 1)]};
                    const oldF_x = _sroa_69.x;
                    const oldF_y = _sroa_69.y;
                    {
                        const _wbase = ((i) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + (((newF_x - oldF_x)) * halfDtOverM));
                    }
                    {
                        const _wbase = ((i) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + (((newF_y - oldF_y)) * halfDtOverM));
                    }
                    if (((_b_particles[((i) * 9 + 2)] != _b_particles[((i) * 9 + 2)]) || (_b_particles[((i) * 9 + 3)] != _b_particles[((i) * 9 + 3)]))) {
                        {
                            const _wbase = ((i) * 9 + 2) - 2;
                            _b_particles[_wbase + 2] = 0.0;
                        }
                        {
                            const _wbase = ((i) * 9 + 3) - 3;
                            _b_particles[_wbase + 3] = 0.0;
                        }
                    }
                }
            }
        }
    }
    entry["vvKick1PN"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_vvKick1PN(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["compute1PN"] = function (workgroups, domain, origin) {
            return __entry_0_compute1PN(workgroups, bindings, domain, origin);
        };
        bound["compute1PNTree"] = function (workgroups, domain, origin) {
            return __entry_1_compute1PNTree(workgroups, bindings, domain, origin);
        };
        bound["vvKick1PN"] = function (workgroups, domain, origin) {
            return __entry_2_vvKick1PN(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","particles","derived","axYukMod","allForces","f1pnOld","histData","histMeta","ghostOriginalIdx","nodes"], entryInfo };
}
