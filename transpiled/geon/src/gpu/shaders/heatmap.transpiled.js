// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/heatmap.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 36e438cf70a1a31ba11c4c6844025fecdec9db06667ad8f530a661e4dbc868bd
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":135420,"lines":2445,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":1,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.845Z
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
    const HM_MAX_STACK = 48;
    const HM_NONE = (-1);

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

    function accumulatePotential(wx, wy, srcX, srcY, mass, charge, doG, doC, doY, softeningSq, yCutSq, yukCoupling, yukMu, periodic, gPhi, ePhi, yPhi) {
        let dx = 0;
        let dy = 0;
        if (periodic) {
            const _sroa_5 = fullMinImageP(wx, wy, srcX, srcY, bindings.hu.domainW, bindings.hu.domainH, bindings.hu.topologyMode);
            const d_x = _sroa_5.x;
            const d_y = _sroa_5.y;
            dx = d_x;
            dy = d_y;
        } else {
            dx = (srcX - wx);
            dy = (srcY - wy);
        }
        const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
        const invR = (1.0 / Math.sqrt(rSq));
        if (doG) {
            gPhi[0] = (gPhi[0] - (mass * invR));
        }
        if (doC) {
            ePhi[0] = (ePhi[0] + (charge * invR));
        }
        if ((doY && (rSq < yCutSq))) {
            const r = (1.0 / invR);
            yPhi[0] = (yPhi[0] - (((yukCoupling * mass) * Math.exp(((-yukMu) * r))) * invR));
        }
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["computeHeatmap"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_computeHeatmap(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_gravPotential = bindings.gravPotential;
        const _b_elecPotential = bindings.elecPotential;
        const _b_yukawaPotential = bindings.yukawaPotential;
        const _b_hu = bindings.hu;
        const _u_hu_viewLeft = _b_hu.viewLeft;
        const _u_hu_viewTop = _b_hu.viewTop;
        const _u_hu_cellW = _b_hu.cellW;
        const _u_hu_cellH = _b_hu.cellH;
        const _u_hu_softeningSq = _b_hu.softeningSq;
        const _u_hu_yukawaCoupling = _b_hu.yukawaCoupling;
        const _u_hu_yukawaMu = _b_hu.yukawaMu;
        const _u_hu_simTime = _b_hu.simTime;
        const _u_hu_domainW = _b_hu.domainW;
        const _u_hu_domainH = _b_hu.domainH;
        const _u_hu_doGravity = _b_hu.doGravity;
        const _u_hu_doCoulomb = _b_hu.doCoulomb;
        const _u_hu_doYukawa = _b_hu.doYukawa;
        const _u_hu_useDelay = _b_hu.useDelay;
        const _u_hu_periodic = _b_hu.periodic;
        const _u_hu_topologyMode = _b_hu.topologyMode;
        const _u_hu_particleCount = _b_hu.particleCount;
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
                const gid_y = Oy;
                __invocation: {
                    const gx = gid_x;
                    const gy = gid_y;
                    if (((gx >= HGRID) || (gy >= HGRID))) {
                        break __invocation;
                    }
                    const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                    const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                    let gPhi = [0.0];
                    let ePhi = [0.0];
                    let yPhi = [0.0];
                    const doG = (_u_hu_doGravity != 0);
                    const doC = (_u_hu_doCoulomb != 0);
                    const doY = (_u_hu_doYukawa != 0);
                    const useDelay = (_u_hu_useDelay != 0);
                    const isPeriodic = (_u_hu_periodic != 0);
                    const _inl_24_mu = _u_hu_yukawaMu;
                    let _inl_24_result;
                    _inl_24: {
                        const _inl_24_cutoff = (6.0 / _inl_24_mu);
                        _inl_24_result = (_inl_24_cutoff * _inl_24_cutoff);
                        break _inl_24;
                    }
                    const yCutSq = (doY ? _inl_24_result : 1e30);
                    for (let i = 0; (i < _u_hu_particleCount); i++) {
                        const _sroa_6_base = ((i) * 9);
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
                        if ((((flag & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        let srcX = p_posX;
                        let srcY = p_posY;
                        if (useDelay) {
                            const _sroa_7 = getDelayedStateGPU(i, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, false);
                            const ret_x = _sroa_7.x;
                            const ret_y = _sroa_7.y;
                            const ret_vx = _sroa_7.vx;
                            const ret_vy = _sroa_7.vy;
                            const ret_angw = _sroa_7.angw;
                            const ret_valid = _sroa_7.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            srcX = ret_x;
                            srcY = ret_y;
                        }
                        accumulatePotential(wx, wy, srcX, srcY, p_mass, p_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                    }
                    if (useDelay) {
                        for (let di = 0; (di < _u_hu_particleCount); di++) {
                            const _sroa_8_base = ((di) * 9);
                            const dp_posX = _b_particles[_sroa_8_base + 0];
                            const dp_posY = _b_particles[_sroa_8_base + 1];
                            const dp_velWX = _b_particles[_sroa_8_base + 2];
                            const dp_velWY = _b_particles[_sroa_8_base + 3];
                            const dp_mass = _b_particles[_sroa_8_base + 4];
                            const dp_charge = _b_particles[_sroa_8_base + 5];
                            const dp_angW = _b_particles[_sroa_8_base + 6];
                            const dp_baseMass = _b_particles[_sroa_8_base + 7];
                            const dp_flags = _b_particles[_sroa_8_base + 8];
                            if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                continue;
                            }
                            if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                continue;
                            }
                            const _sroa_9 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                            const ret_x = _sroa_9.x;
                            const ret_y = _sroa_9.y;
                            const ret_vx = _sroa_9.vx;
                            const ret_vy = _sroa_9.vy;
                            const ret_angw = _sroa_9.angw;
                            const ret_valid = _sroa_9.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            const _sroa_10_base = ((di) * 5);
                            const dAux_radius = _b_particleAux[_sroa_10_base + 0];
                            const dAux_particleId = _b_particleAux[_sroa_10_base + 1];
                            const dAux_deathTime = _b_particleAux[_sroa_10_base + 2];
                            const dAux_deathMass = _b_particleAux[_sroa_10_base + 3];
                            const dAux_deathAngVel = _b_particleAux[_sroa_10_base + 4];
                            accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                        }
                    }
                    const idx = ((gy * HGRID) + gx);
                    _b_gravPotential[idx] = gPhi[0];
                    _b_elecPotential[idx] = ePhi[0];
                    _b_yukawaPotential[idx] = yPhi[0];
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const gx = gid_x;
                            const gy = gid_y;
                            if (((gx >= HGRID) || (gy >= HGRID))) {
                                break __invocation;
                            }
                            const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                            const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                            let gPhi = [0.0];
                            let ePhi = [0.0];
                            let yPhi = [0.0];
                            const doG = (_u_hu_doGravity != 0);
                            const doC = (_u_hu_doCoulomb != 0);
                            const doY = (_u_hu_doYukawa != 0);
                            const useDelay = (_u_hu_useDelay != 0);
                            const isPeriodic = (_u_hu_periodic != 0);
                            const _inl_24_mu = _u_hu_yukawaMu;
                            let _inl_24_result;
                            _inl_24: {
                                const _inl_24_cutoff = (6.0 / _inl_24_mu);
                                _inl_24_result = (_inl_24_cutoff * _inl_24_cutoff);
                                break _inl_24;
                            }
                            const yCutSq = (doY ? _inl_24_result : 1e30);
                            for (let i = 0; (i < _u_hu_particleCount); i++) {
                                const _sroa_11_base = ((i) * 9);
                                const p_posX = _b_particles[_sroa_11_base + 0];
                                const p_posY = _b_particles[_sroa_11_base + 1];
                                const p_velWX = _b_particles[_sroa_11_base + 2];
                                const p_velWY = _b_particles[_sroa_11_base + 3];
                                const p_mass = _b_particles[_sroa_11_base + 4];
                                const p_charge = _b_particles[_sroa_11_base + 5];
                                const p_angW = _b_particles[_sroa_11_base + 6];
                                const p_baseMass = _b_particles[_sroa_11_base + 7];
                                const p_flags = _b_particles[_sroa_11_base + 8];
                                const flag = p_flags;
                                if ((((flag & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                let srcX = p_posX;
                                let srcY = p_posY;
                                if (useDelay) {
                                    const _sroa_12 = getDelayedStateGPU(i, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, false);
                                    const ret_x = _sroa_12.x;
                                    const ret_y = _sroa_12.y;
                                    const ret_vx = _sroa_12.vx;
                                    const ret_vy = _sroa_12.vy;
                                    const ret_angw = _sroa_12.angw;
                                    const ret_valid = _sroa_12.valid;
                                    if ((!ret_valid)) {
                                        continue;
                                    }
                                    srcX = ret_x;
                                    srcY = ret_y;
                                }
                                accumulatePotential(wx, wy, srcX, srcY, p_mass, p_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                            }
                            if (useDelay) {
                                for (let di = 0; (di < _u_hu_particleCount); di++) {
                                    const _sroa_13_base = ((di) * 9);
                                    const dp_posX = _b_particles[_sroa_13_base + 0];
                                    const dp_posY = _b_particles[_sroa_13_base + 1];
                                    const dp_velWX = _b_particles[_sroa_13_base + 2];
                                    const dp_velWY = _b_particles[_sroa_13_base + 3];
                                    const dp_mass = _b_particles[_sroa_13_base + 4];
                                    const dp_charge = _b_particles[_sroa_13_base + 5];
                                    const dp_angW = _b_particles[_sroa_13_base + 6];
                                    const dp_baseMass = _b_particles[_sroa_13_base + 7];
                                    const dp_flags = _b_particles[_sroa_13_base + 8];
                                    if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                        continue;
                                    }
                                    if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                        continue;
                                    }
                                    const _sroa_14 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                                    const ret_x = _sroa_14.x;
                                    const ret_y = _sroa_14.y;
                                    const ret_vx = _sroa_14.vx;
                                    const ret_vy = _sroa_14.vy;
                                    const ret_angw = _sroa_14.angw;
                                    const ret_valid = _sroa_14.valid;
                                    if ((!ret_valid)) {
                                        continue;
                                    }
                                    const _sroa_15_base = ((di) * 5);
                                    const dAux_radius = _b_particleAux[_sroa_15_base + 0];
                                    const dAux_particleId = _b_particleAux[_sroa_15_base + 1];
                                    const dAux_deathTime = _b_particleAux[_sroa_15_base + 2];
                                    const dAux_deathMass = _b_particleAux[_sroa_15_base + 3];
                                    const dAux_deathAngVel = _b_particleAux[_sroa_15_base + 4];
                                    accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                                }
                            }
                            const idx = ((gy * HGRID) + gx);
                            _b_gravPotential[idx] = gPhi[0];
                            _b_elecPotential[idx] = ePhi[0];
                            _b_yukawaPotential[idx] = yPhi[0];
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const gx = gid_x;
                        const gy = gid_y;
                        if (((gx >= HGRID) || (gy >= HGRID))) {
                            break __invocation;
                        }
                        const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                        const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                        let gPhi = [0.0];
                        let ePhi = [0.0];
                        let yPhi = [0.0];
                        const doG = (_u_hu_doGravity != 0);
                        const doC = (_u_hu_doCoulomb != 0);
                        const doY = (_u_hu_doYukawa != 0);
                        const useDelay = (_u_hu_useDelay != 0);
                        const isPeriodic = (_u_hu_periodic != 0);
                        const _inl_24_mu = _u_hu_yukawaMu;
                        let _inl_24_result;
                        _inl_24: {
                            const _inl_24_cutoff = (6.0 / _inl_24_mu);
                            _inl_24_result = (_inl_24_cutoff * _inl_24_cutoff);
                            break _inl_24;
                        }
                        const yCutSq = (doY ? _inl_24_result : 1e30);
                        for (let i = 0; (i < _u_hu_particleCount); i++) {
                            const _sroa_16_base = ((i) * 9);
                            const p_posX = _b_particles[_sroa_16_base + 0];
                            const p_posY = _b_particles[_sroa_16_base + 1];
                            const p_velWX = _b_particles[_sroa_16_base + 2];
                            const p_velWY = _b_particles[_sroa_16_base + 3];
                            const p_mass = _b_particles[_sroa_16_base + 4];
                            const p_charge = _b_particles[_sroa_16_base + 5];
                            const p_angW = _b_particles[_sroa_16_base + 6];
                            const p_baseMass = _b_particles[_sroa_16_base + 7];
                            const p_flags = _b_particles[_sroa_16_base + 8];
                            const flag = p_flags;
                            if ((((flag & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            let srcX = p_posX;
                            let srcY = p_posY;
                            if (useDelay) {
                                const _sroa_17 = getDelayedStateGPU(i, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, false);
                                const ret_x = _sroa_17.x;
                                const ret_y = _sroa_17.y;
                                const ret_vx = _sroa_17.vx;
                                const ret_vy = _sroa_17.vy;
                                const ret_angw = _sroa_17.angw;
                                const ret_valid = _sroa_17.valid;
                                if ((!ret_valid)) {
                                    continue;
                                }
                                srcX = ret_x;
                                srcY = ret_y;
                            }
                            accumulatePotential(wx, wy, srcX, srcY, p_mass, p_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                        }
                        if (useDelay) {
                            for (let di = 0; (di < _u_hu_particleCount); di++) {
                                const _sroa_18_base = ((di) * 9);
                                const dp_posX = _b_particles[_sroa_18_base + 0];
                                const dp_posY = _b_particles[_sroa_18_base + 1];
                                const dp_velWX = _b_particles[_sroa_18_base + 2];
                                const dp_velWY = _b_particles[_sroa_18_base + 3];
                                const dp_mass = _b_particles[_sroa_18_base + 4];
                                const dp_charge = _b_particles[_sroa_18_base + 5];
                                const dp_angW = _b_particles[_sroa_18_base + 6];
                                const dp_baseMass = _b_particles[_sroa_18_base + 7];
                                const dp_flags = _b_particles[_sroa_18_base + 8];
                                if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                    continue;
                                }
                                if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                    continue;
                                }
                                const _sroa_19 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                                const ret_x = _sroa_19.x;
                                const ret_y = _sroa_19.y;
                                const ret_vx = _sroa_19.vx;
                                const ret_vy = _sroa_19.vy;
                                const ret_angw = _sroa_19.angw;
                                const ret_valid = _sroa_19.valid;
                                if ((!ret_valid)) {
                                    continue;
                                }
                                const _sroa_20_base = ((di) * 5);
                                const dAux_radius = _b_particleAux[_sroa_20_base + 0];
                                const dAux_particleId = _b_particleAux[_sroa_20_base + 1];
                                const dAux_deathTime = _b_particleAux[_sroa_20_base + 2];
                                const dAux_deathMass = _b_particleAux[_sroa_20_base + 3];
                                const dAux_deathAngVel = _b_particleAux[_sroa_20_base + 4];
                                accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                            }
                        }
                        const idx = ((gy * HGRID) + gx);
                        _b_gravPotential[idx] = gPhi[0];
                        _b_elecPotential[idx] = ePhi[0];
                        _b_yukawaPotential[idx] = yPhi[0];
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const gx = gid_x;
                    const gy = gid_y;
                    if (((gx >= HGRID) || (gy >= HGRID))) {
                        break __invocation;
                    }
                    const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                    const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                    let gPhi = [0.0];
                    let ePhi = [0.0];
                    let yPhi = [0.0];
                    const doG = (_u_hu_doGravity != 0);
                    const doC = (_u_hu_doCoulomb != 0);
                    const doY = (_u_hu_doYukawa != 0);
                    const useDelay = (_u_hu_useDelay != 0);
                    const isPeriodic = (_u_hu_periodic != 0);
                    const _inl_24_mu = _u_hu_yukawaMu;
                    let _inl_24_result;
                    _inl_24: {
                        const _inl_24_cutoff = (6.0 / _inl_24_mu);
                        _inl_24_result = (_inl_24_cutoff * _inl_24_cutoff);
                        break _inl_24;
                    }
                    const yCutSq = (doY ? _inl_24_result : 1e30);
                    for (let i = 0; (i < _u_hu_particleCount); i++) {
                        const _sroa_21_base = ((i) * 9);
                        const p_posX = _b_particles[_sroa_21_base + 0];
                        const p_posY = _b_particles[_sroa_21_base + 1];
                        const p_velWX = _b_particles[_sroa_21_base + 2];
                        const p_velWY = _b_particles[_sroa_21_base + 3];
                        const p_mass = _b_particles[_sroa_21_base + 4];
                        const p_charge = _b_particles[_sroa_21_base + 5];
                        const p_angW = _b_particles[_sroa_21_base + 6];
                        const p_baseMass = _b_particles[_sroa_21_base + 7];
                        const p_flags = _b_particles[_sroa_21_base + 8];
                        const flag = p_flags;
                        if ((((flag & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        let srcX = p_posX;
                        let srcY = p_posY;
                        if (useDelay) {
                            const _sroa_22 = getDelayedStateGPU(i, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, false);
                            const ret_x = _sroa_22.x;
                            const ret_y = _sroa_22.y;
                            const ret_vx = _sroa_22.vx;
                            const ret_vy = _sroa_22.vy;
                            const ret_angw = _sroa_22.angw;
                            const ret_valid = _sroa_22.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            srcX = ret_x;
                            srcY = ret_y;
                        }
                        accumulatePotential(wx, wy, srcX, srcY, p_mass, p_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                    }
                    if (useDelay) {
                        for (let di = 0; (di < _u_hu_particleCount); di++) {
                            const _sroa_23_base = ((di) * 9);
                            const dp_posX = _b_particles[_sroa_23_base + 0];
                            const dp_posY = _b_particles[_sroa_23_base + 1];
                            const dp_velWX = _b_particles[_sroa_23_base + 2];
                            const dp_velWY = _b_particles[_sroa_23_base + 3];
                            const dp_mass = _b_particles[_sroa_23_base + 4];
                            const dp_charge = _b_particles[_sroa_23_base + 5];
                            const dp_angW = _b_particles[_sroa_23_base + 6];
                            const dp_baseMass = _b_particles[_sroa_23_base + 7];
                            const dp_flags = _b_particles[_sroa_23_base + 8];
                            if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                continue;
                            }
                            if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                continue;
                            }
                            const _sroa_24 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                            const ret_x = _sroa_24.x;
                            const ret_y = _sroa_24.y;
                            const ret_vx = _sroa_24.vx;
                            const ret_vy = _sroa_24.vy;
                            const ret_angw = _sroa_24.angw;
                            const ret_valid = _sroa_24.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            const _sroa_25_base = ((di) * 5);
                            const dAux_radius = _b_particleAux[_sroa_25_base + 0];
                            const dAux_particleId = _b_particleAux[_sroa_25_base + 1];
                            const dAux_deathTime = _b_particleAux[_sroa_25_base + 2];
                            const dAux_deathMass = _b_particleAux[_sroa_25_base + 3];
                            const dAux_deathAngVel = _b_particleAux[_sroa_25_base + 4];
                            accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, _u_hu_softeningSq, yCutSq, _u_hu_yukawaCoupling, _u_hu_yukawaMu, isPeriodic, gPhi, ePhi, yPhi);
                        }
                    }
                    const idx = ((gy * HGRID) + gx);
                    _b_gravPotential[idx] = gPhi[0];
                    _b_elecPotential[idx] = ePhi[0];
                    _b_yukawaPotential[idx] = yPhi[0];
                }
            }
        }
    }
    entry["computeHeatmap"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_computeHeatmap(workgroups, bindings, domain, origin);
    };

    entryInfo["computeHeatmapTree"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_computeHeatmapTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_nodes = bindings.nodes;
        const _b_gravPotential = bindings.gravPotential;
        const _b_elecPotential = bindings.elecPotential;
        const _b_yukawaPotential = bindings.yukawaPotential;
        const _b_hu = bindings.hu;
        const _u_hu_viewLeft = _b_hu.viewLeft;
        const _u_hu_viewTop = _b_hu.viewTop;
        const _u_hu_cellW = _b_hu.cellW;
        const _u_hu_cellH = _b_hu.cellH;
        const _u_hu_softeningSq = _b_hu.softeningSq;
        const _u_hu_yukawaCoupling = _b_hu.yukawaCoupling;
        const _u_hu_yukawaMu = _b_hu.yukawaMu;
        const _u_hu_simTime = _b_hu.simTime;
        const _u_hu_domainW = _b_hu.domainW;
        const _u_hu_domainH = _b_hu.domainH;
        const _u_hu_doGravity = _b_hu.doGravity;
        const _u_hu_doCoulomb = _b_hu.doCoulomb;
        const _u_hu_doYukawa = _b_hu.doYukawa;
        const _u_hu_useDelay = _b_hu.useDelay;
        const _u_hu_periodic = _b_hu.periodic;
        const _u_hu_topologyMode = _b_hu.topologyMode;
        const _u_hu_particleCount = _b_hu.particleCount;
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
                const gid_y = Oy;
                __invocation: {
                    const gx = gid_x;
                    const gy = gid_y;
                    if (((gx >= HGRID) || (gy >= HGRID))) {
                        break __invocation;
                    }
                    const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                    const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                    let gPhi = [0.0];
                    let ePhi = [0.0];
                    let yPhi = [0.0];
                    const doG = (_u_hu_doGravity != 0);
                    const doC = (_u_hu_doCoulomb != 0);
                    const doY = (_u_hu_doYukawa != 0);
                    const softeningSq = _u_hu_softeningSq;
                    const _inl_25_mu = _u_hu_yukawaMu;
                    let _inl_25_result;
                    _inl_25: {
                        const _inl_25_cutoff = (6.0 / _inl_25_mu);
                        _inl_25_result = (_inl_25_cutoff * _inl_25_cutoff);
                        break _inl_25;
                    }
                    const yCutSq = (doY ? _inl_25_result : 1e30);
                    const yukCoupling = _u_hu_yukawaCoupling;
                    const yukMu = _u_hu_yukawaMu;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_13_result;
                            _inl_26__inl_13: {
                                _inl_26__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_26__inl_13;
                            }
                            _inl_26_result = rt.bitcast_i32_u32(_b_nodes[(_inl_26__inl_13_result + 12)]);
                            break _inl_26;
                        }
                        const isLeaf = (_inl_26_result == HM_NONE);
                        if (isLeaf) {
                            let _inl_27_result;
                            _inl_27: {
                                let _inl_27__inl_17_result;
                                _inl_27__inl_17: {
                                    _inl_27__inl_17_result = (nIdx * NODE_STRIDE);
                                    break _inl_27__inl_17;
                                }
                                _inl_27_result = rt.bitcast_i32_u32(_b_nodes[(_inl_27__inl_17_result + 16)]);
                                break _inl_27;
                            }
                            const pIdx = _inl_27_result;
                            if ((pIdx < 0)) {
                                continue;
                            }
                            const j = ((pIdx) >>> 0);
                            const _sroa_26_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_26_base + 0];
                            const pj_posY = _b_particles[_sroa_26_base + 1];
                            const pj_velWX = _b_particles[_sroa_26_base + 2];
                            const pj_velWY = _b_particles[_sroa_26_base + 3];
                            const pj_mass = _b_particles[_sroa_26_base + 4];
                            const pj_charge = _b_particles[_sroa_26_base + 5];
                            const pj_angW = _b_particles[_sroa_26_base + 6];
                            const pj_baseMass = _b_particles[_sroa_26_base + 7];
                            const pj_flags = _b_particles[_sroa_26_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const dx = (pj_posX - wx);
                            const dy = (pj_posY - wy);
                            const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
                            const invR = (1.0 / Math.sqrt(rSq));
                            if (doG) {
                                gPhi[0] = (gPhi[0] - (pj_mass * invR));
                            }
                            if (doC) {
                                ePhi[0] = (ePhi[0] + (pj_charge * invR));
                            }
                            if ((doY && (rSq < yCutSq))) {
                                const r = (1.0 / invR);
                                yPhi[0] = (yPhi[0] - (((yukCoupling * pj_mass) * Math.exp(((-yukMu) * r))) * invR));
                            }
                        } else {
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_5_result;
                                _inl_28__inl_5: {
                                    _inl_28__inl_5_result = (nIdx * NODE_STRIDE);
                                    break _inl_28__inl_5;
                                }
                                _inl_28_result = rt.bitcast_f32_u32(_b_nodes[(_inl_28__inl_5_result + 4)]);
                                break _inl_28;
                            }
                            const comX = _inl_28_result;
                            let _inl_29_result;
                            _inl_29: {
                                let _inl_29__inl_6_result;
                                _inl_29__inl_6: {
                                    _inl_29__inl_6_result = (nIdx * NODE_STRIDE);
                                    break _inl_29__inl_6;
                                }
                                _inl_29_result = rt.bitcast_f32_u32(_b_nodes[(_inl_29__inl_6_result + 5)]);
                                break _inl_29;
                            }
                            const comY = _inl_29_result;
                            const dx = (comX - wx);
                            const dy = (comY - wy);
                            const distSq = (((dx * dx) + (dy * dy)) + softeningSq);
                            let _inl_30_result;
                            _inl_30: {
                                let _inl_30__inl_3_result;
                                _inl_30__inl_3: {
                                    _inl_30__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_30__inl_3;
                                }
                                _inl_30_result = rt.bitcast_f32_u32(_b_nodes[(_inl_30__inl_3_result + 2)]);
                                break _inl_30;
                            }
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_1_result;
                                _inl_31__inl_1: {
                                    _inl_31__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_31__inl_1;
                                }
                                _inl_31_result = rt.bitcast_f32_u32(_b_nodes[_inl_31__inl_1_result]);
                                break _inl_31;
                            }
                            const sizeX = (_inl_30_result - _inl_31_result);
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_4_result;
                                _inl_32__inl_4: {
                                    _inl_32__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_32__inl_4;
                                }
                                _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_4_result + 3)]);
                                break _inl_32;
                            }
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_2_result;
                                _inl_33__inl_2: {
                                    _inl_33__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_33__inl_2;
                                }
                                _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_2_result + 1)]);
                                break _inl_33;
                            }
                            const sizeY = (_inl_32_result - _inl_33_result);
                            const sizeSq = (((sizeX * sizeX)) < ((sizeY * sizeY)) ? ((sizeY * sizeY)) : ((sizeX * sizeX)));
                            if ((sizeSq < (BH_THETA_SQ * distSq))) {
                                let _inl_34_result;
                                _inl_34: {
                                    let _inl_34__inl_7_result;
                                    _inl_34__inl_7: {
                                        _inl_34__inl_7_result = (nIdx * NODE_STRIDE);
                                        break _inl_34__inl_7;
                                    }
                                    _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_7_result + 6)]);
                                    break _inl_34;
                                }
                                const aggMass = _inl_34_result;
                                let _inl_35_result;
                                _inl_35: {
                                    let _inl_35__inl_8_result;
                                    _inl_35__inl_8: {
                                        _inl_35__inl_8_result = (nIdx * NODE_STRIDE);
                                        break _inl_35__inl_8;
                                    }
                                    _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_8_result + 7)]);
                                    break _inl_35;
                                }
                                const aggCharge = _inl_35_result;
                                const invR = (1.0 / Math.sqrt(distSq));
                                if (doG) {
                                    gPhi[0] = (gPhi[0] - (aggMass * invR));
                                }
                                if (doC) {
                                    ePhi[0] = (ePhi[0] + (aggCharge * invR));
                                }
                                if ((doY && (distSq < yCutSq))) {
                                    const r = (1.0 / invR);
                                    yPhi[0] = (yPhi[0] - (((yukCoupling * aggMass) * Math.exp(((-yukMu) * r))) * invR));
                                }
                            } else if (((top + 4) <= ((HM_MAX_STACK) | 0))) {
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_13_result;
                                    _inl_36__inl_13: {
                                        _inl_36__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_36__inl_13;
                                    }
                                    _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_13_result + 12)]);
                                    break _inl_36;
                                }
                                const nw = _inl_36_result;
                                let _inl_37_result;
                                _inl_37: {
                                    let _inl_37__inl_14_result;
                                    _inl_37__inl_14: {
                                        _inl_37__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_37__inl_14;
                                    }
                                    _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_14_result + 13)]);
                                    break _inl_37;
                                }
                                const ne = _inl_37_result;
                                let _inl_38_result;
                                _inl_38: {
                                    let _inl_38__inl_15_result;
                                    _inl_38__inl_15: {
                                        _inl_38__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_38__inl_15;
                                    }
                                    _inl_38_result = rt.bitcast_i32_u32(_b_nodes[(_inl_38__inl_15_result + 14)]);
                                    break _inl_38;
                                }
                                const sw = _inl_38_result;
                                let _inl_39_result;
                                _inl_39: {
                                    let _inl_39__inl_16_result;
                                    _inl_39__inl_16: {
                                        _inl_39__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_39__inl_16;
                                    }
                                    _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                    break _inl_39;
                                }
                                const se = _inl_39_result;
                                if ((nw != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                    const useDelay = (_u_hu_useDelay != 0);
                    const isPeriodic = (_u_hu_periodic != 0);
                    if (useDelay) {
                        for (let di = 0; (di < _u_hu_particleCount); di++) {
                            const _sroa_27_base = ((di) * 9);
                            const dp_posX = _b_particles[_sroa_27_base + 0];
                            const dp_posY = _b_particles[_sroa_27_base + 1];
                            const dp_velWX = _b_particles[_sroa_27_base + 2];
                            const dp_velWY = _b_particles[_sroa_27_base + 3];
                            const dp_mass = _b_particles[_sroa_27_base + 4];
                            const dp_charge = _b_particles[_sroa_27_base + 5];
                            const dp_angW = _b_particles[_sroa_27_base + 6];
                            const dp_baseMass = _b_particles[_sroa_27_base + 7];
                            const dp_flags = _b_particles[_sroa_27_base + 8];
                            if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                continue;
                            }
                            if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                continue;
                            }
                            const _sroa_28 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                            const ret_x = _sroa_28.x;
                            const ret_y = _sroa_28.y;
                            const ret_vx = _sroa_28.vx;
                            const ret_vy = _sroa_28.vy;
                            const ret_angw = _sroa_28.angw;
                            const ret_valid = _sroa_28.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            const _sroa_29_base = ((di) * 5);
                            const dAux_radius = _b_particleAux[_sroa_29_base + 0];
                            const dAux_particleId = _b_particleAux[_sroa_29_base + 1];
                            const dAux_deathTime = _b_particleAux[_sroa_29_base + 2];
                            const dAux_deathMass = _b_particleAux[_sroa_29_base + 3];
                            const dAux_deathAngVel = _b_particleAux[_sroa_29_base + 4];
                            accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, softeningSq, yCutSq, yukCoupling, yukMu, isPeriodic, gPhi, ePhi, yPhi);
                        }
                    }
                    const idx = ((gy * HGRID) + gx);
                    _b_gravPotential[idx] = gPhi[0];
                    _b_elecPotential[idx] = ePhi[0];
                    _b_yukawaPotential[idx] = yPhi[0];
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const gx = gid_x;
                            const gy = gid_y;
                            if (((gx >= HGRID) || (gy >= HGRID))) {
                                break __invocation;
                            }
                            const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                            const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                            let gPhi = [0.0];
                            let ePhi = [0.0];
                            let yPhi = [0.0];
                            const doG = (_u_hu_doGravity != 0);
                            const doC = (_u_hu_doCoulomb != 0);
                            const doY = (_u_hu_doYukawa != 0);
                            const softeningSq = _u_hu_softeningSq;
                            const _inl_25_mu = _u_hu_yukawaMu;
                            let _inl_25_result;
                            _inl_25: {
                                const _inl_25_cutoff = (6.0 / _inl_25_mu);
                                _inl_25_result = (_inl_25_cutoff * _inl_25_cutoff);
                                break _inl_25;
                            }
                            const yCutSq = (doY ? _inl_25_result : 1e30);
                            const yukCoupling = _u_hu_yukawaCoupling;
                            const yukMu = _u_hu_yukawaMu;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[((top) >>> 0)];
                                let _inl_26_result;
                                _inl_26: {
                                    let _inl_26__inl_13_result;
                                    _inl_26__inl_13: {
                                        _inl_26__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_26__inl_13;
                                    }
                                    _inl_26_result = rt.bitcast_i32_u32(_b_nodes[(_inl_26__inl_13_result + 12)]);
                                    break _inl_26;
                                }
                                const isLeaf = (_inl_26_result == HM_NONE);
                                if (isLeaf) {
                                    let _inl_27_result;
                                    _inl_27: {
                                        let _inl_27__inl_17_result;
                                        _inl_27__inl_17: {
                                            _inl_27__inl_17_result = (nIdx * NODE_STRIDE);
                                            break _inl_27__inl_17;
                                        }
                                        _inl_27_result = rt.bitcast_i32_u32(_b_nodes[(_inl_27__inl_17_result + 16)]);
                                        break _inl_27;
                                    }
                                    const pIdx = _inl_27_result;
                                    if ((pIdx < 0)) {
                                        continue;
                                    }
                                    const j = ((pIdx) >>> 0);
                                    const _sroa_30_base = ((j) * 9);
                                    const pj_posX = _b_particles[_sroa_30_base + 0];
                                    const pj_posY = _b_particles[_sroa_30_base + 1];
                                    const pj_velWX = _b_particles[_sroa_30_base + 2];
                                    const pj_velWY = _b_particles[_sroa_30_base + 3];
                                    const pj_mass = _b_particles[_sroa_30_base + 4];
                                    const pj_charge = _b_particles[_sroa_30_base + 5];
                                    const pj_angW = _b_particles[_sroa_30_base + 6];
                                    const pj_baseMass = _b_particles[_sroa_30_base + 7];
                                    const pj_flags = _b_particles[_sroa_30_base + 8];
                                    if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                        continue;
                                    }
                                    const dx = (pj_posX - wx);
                                    const dy = (pj_posY - wy);
                                    const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
                                    const invR = (1.0 / Math.sqrt(rSq));
                                    if (doG) {
                                        gPhi[0] = (gPhi[0] - (pj_mass * invR));
                                    }
                                    if (doC) {
                                        ePhi[0] = (ePhi[0] + (pj_charge * invR));
                                    }
                                    if ((doY && (rSq < yCutSq))) {
                                        const r = (1.0 / invR);
                                        yPhi[0] = (yPhi[0] - (((yukCoupling * pj_mass) * Math.exp(((-yukMu) * r))) * invR));
                                    }
                                } else {
                                    let _inl_28_result;
                                    _inl_28: {
                                        let _inl_28__inl_5_result;
                                        _inl_28__inl_5: {
                                            _inl_28__inl_5_result = (nIdx * NODE_STRIDE);
                                            break _inl_28__inl_5;
                                        }
                                        _inl_28_result = rt.bitcast_f32_u32(_b_nodes[(_inl_28__inl_5_result + 4)]);
                                        break _inl_28;
                                    }
                                    const comX = _inl_28_result;
                                    let _inl_29_result;
                                    _inl_29: {
                                        let _inl_29__inl_6_result;
                                        _inl_29__inl_6: {
                                            _inl_29__inl_6_result = (nIdx * NODE_STRIDE);
                                            break _inl_29__inl_6;
                                        }
                                        _inl_29_result = rt.bitcast_f32_u32(_b_nodes[(_inl_29__inl_6_result + 5)]);
                                        break _inl_29;
                                    }
                                    const comY = _inl_29_result;
                                    const dx = (comX - wx);
                                    const dy = (comY - wy);
                                    const distSq = (((dx * dx) + (dy * dy)) + softeningSq);
                                    let _inl_30_result;
                                    _inl_30: {
                                        let _inl_30__inl_3_result;
                                        _inl_30__inl_3: {
                                            _inl_30__inl_3_result = (nIdx * NODE_STRIDE);
                                            break _inl_30__inl_3;
                                        }
                                        _inl_30_result = rt.bitcast_f32_u32(_b_nodes[(_inl_30__inl_3_result + 2)]);
                                        break _inl_30;
                                    }
                                    let _inl_31_result;
                                    _inl_31: {
                                        let _inl_31__inl_1_result;
                                        _inl_31__inl_1: {
                                            _inl_31__inl_1_result = (nIdx * NODE_STRIDE);
                                            break _inl_31__inl_1;
                                        }
                                        _inl_31_result = rt.bitcast_f32_u32(_b_nodes[_inl_31__inl_1_result]);
                                        break _inl_31;
                                    }
                                    const sizeX = (_inl_30_result - _inl_31_result);
                                    let _inl_32_result;
                                    _inl_32: {
                                        let _inl_32__inl_4_result;
                                        _inl_32__inl_4: {
                                            _inl_32__inl_4_result = (nIdx * NODE_STRIDE);
                                            break _inl_32__inl_4;
                                        }
                                        _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_4_result + 3)]);
                                        break _inl_32;
                                    }
                                    let _inl_33_result;
                                    _inl_33: {
                                        let _inl_33__inl_2_result;
                                        _inl_33__inl_2: {
                                            _inl_33__inl_2_result = (nIdx * NODE_STRIDE);
                                            break _inl_33__inl_2;
                                        }
                                        _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_2_result + 1)]);
                                        break _inl_33;
                                    }
                                    const sizeY = (_inl_32_result - _inl_33_result);
                                    const sizeSq = (((sizeX * sizeX)) < ((sizeY * sizeY)) ? ((sizeY * sizeY)) : ((sizeX * sizeX)));
                                    if ((sizeSq < (BH_THETA_SQ * distSq))) {
                                        let _inl_34_result;
                                        _inl_34: {
                                            let _inl_34__inl_7_result;
                                            _inl_34__inl_7: {
                                                _inl_34__inl_7_result = (nIdx * NODE_STRIDE);
                                                break _inl_34__inl_7;
                                            }
                                            _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_7_result + 6)]);
                                            break _inl_34;
                                        }
                                        const aggMass = _inl_34_result;
                                        let _inl_35_result;
                                        _inl_35: {
                                            let _inl_35__inl_8_result;
                                            _inl_35__inl_8: {
                                                _inl_35__inl_8_result = (nIdx * NODE_STRIDE);
                                                break _inl_35__inl_8;
                                            }
                                            _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_8_result + 7)]);
                                            break _inl_35;
                                        }
                                        const aggCharge = _inl_35_result;
                                        const invR = (1.0 / Math.sqrt(distSq));
                                        if (doG) {
                                            gPhi[0] = (gPhi[0] - (aggMass * invR));
                                        }
                                        if (doC) {
                                            ePhi[0] = (ePhi[0] + (aggCharge * invR));
                                        }
                                        if ((doY && (distSq < yCutSq))) {
                                            const r = (1.0 / invR);
                                            yPhi[0] = (yPhi[0] - (((yukCoupling * aggMass) * Math.exp(((-yukMu) * r))) * invR));
                                        }
                                    } else if (((top + 4) <= ((HM_MAX_STACK) | 0))) {
                                        let _inl_36_result;
                                        _inl_36: {
                                            let _inl_36__inl_13_result;
                                            _inl_36__inl_13: {
                                                _inl_36__inl_13_result = (nIdx * NODE_STRIDE);
                                                break _inl_36__inl_13;
                                            }
                                            _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_13_result + 12)]);
                                            break _inl_36;
                                        }
                                        const nw = _inl_36_result;
                                        let _inl_37_result;
                                        _inl_37: {
                                            let _inl_37__inl_14_result;
                                            _inl_37__inl_14: {
                                                _inl_37__inl_14_result = (nIdx * NODE_STRIDE);
                                                break _inl_37__inl_14;
                                            }
                                            _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_14_result + 13)]);
                                            break _inl_37;
                                        }
                                        const ne = _inl_37_result;
                                        let _inl_38_result;
                                        _inl_38: {
                                            let _inl_38__inl_15_result;
                                            _inl_38__inl_15: {
                                                _inl_38__inl_15_result = (nIdx * NODE_STRIDE);
                                                break _inl_38__inl_15;
                                            }
                                            _inl_38_result = rt.bitcast_i32_u32(_b_nodes[(_inl_38__inl_15_result + 14)]);
                                            break _inl_38;
                                        }
                                        const sw = _inl_38_result;
                                        let _inl_39_result;
                                        _inl_39: {
                                            let _inl_39__inl_16_result;
                                            _inl_39__inl_16: {
                                                _inl_39__inl_16_result = (nIdx * NODE_STRIDE);
                                                break _inl_39__inl_16;
                                            }
                                            _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                            break _inl_39;
                                        }
                                        const se = _inl_39_result;
                                        if ((nw != HM_NONE)) {
                                            stack[((top) >>> 0)] = ((nw) >>> 0);
                                            top++;
                                        }
                                        if ((ne != HM_NONE)) {
                                            stack[((top) >>> 0)] = ((ne) >>> 0);
                                            top++;
                                        }
                                        if ((sw != HM_NONE)) {
                                            stack[((top) >>> 0)] = ((sw) >>> 0);
                                            top++;
                                        }
                                        if ((se != HM_NONE)) {
                                            stack[((top) >>> 0)] = ((se) >>> 0);
                                            top++;
                                        }
                                    }
                                }
                            }
                            const useDelay = (_u_hu_useDelay != 0);
                            const isPeriodic = (_u_hu_periodic != 0);
                            if (useDelay) {
                                for (let di = 0; (di < _u_hu_particleCount); di++) {
                                    const _sroa_31_base = ((di) * 9);
                                    const dp_posX = _b_particles[_sroa_31_base + 0];
                                    const dp_posY = _b_particles[_sroa_31_base + 1];
                                    const dp_velWX = _b_particles[_sroa_31_base + 2];
                                    const dp_velWY = _b_particles[_sroa_31_base + 3];
                                    const dp_mass = _b_particles[_sroa_31_base + 4];
                                    const dp_charge = _b_particles[_sroa_31_base + 5];
                                    const dp_angW = _b_particles[_sroa_31_base + 6];
                                    const dp_baseMass = _b_particles[_sroa_31_base + 7];
                                    const dp_flags = _b_particles[_sroa_31_base + 8];
                                    if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                        continue;
                                    }
                                    if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                        continue;
                                    }
                                    const _sroa_32 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                                    const ret_x = _sroa_32.x;
                                    const ret_y = _sroa_32.y;
                                    const ret_vx = _sroa_32.vx;
                                    const ret_vy = _sroa_32.vy;
                                    const ret_angw = _sroa_32.angw;
                                    const ret_valid = _sroa_32.valid;
                                    if ((!ret_valid)) {
                                        continue;
                                    }
                                    const _sroa_33_base = ((di) * 5);
                                    const dAux_radius = _b_particleAux[_sroa_33_base + 0];
                                    const dAux_particleId = _b_particleAux[_sroa_33_base + 1];
                                    const dAux_deathTime = _b_particleAux[_sroa_33_base + 2];
                                    const dAux_deathMass = _b_particleAux[_sroa_33_base + 3];
                                    const dAux_deathAngVel = _b_particleAux[_sroa_33_base + 4];
                                    accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, softeningSq, yCutSq, yukCoupling, yukMu, isPeriodic, gPhi, ePhi, yPhi);
                                }
                            }
                            const idx = ((gy * HGRID) + gx);
                            _b_gravPotential[idx] = gPhi[0];
                            _b_elecPotential[idx] = ePhi[0];
                            _b_yukawaPotential[idx] = yPhi[0];
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const gx = gid_x;
                        const gy = gid_y;
                        if (((gx >= HGRID) || (gy >= HGRID))) {
                            break __invocation;
                        }
                        const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                        const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                        let gPhi = [0.0];
                        let ePhi = [0.0];
                        let yPhi = [0.0];
                        const doG = (_u_hu_doGravity != 0);
                        const doC = (_u_hu_doCoulomb != 0);
                        const doY = (_u_hu_doYukawa != 0);
                        const softeningSq = _u_hu_softeningSq;
                        const _inl_25_mu = _u_hu_yukawaMu;
                        let _inl_25_result;
                        _inl_25: {
                            const _inl_25_cutoff = (6.0 / _inl_25_mu);
                            _inl_25_result = (_inl_25_cutoff * _inl_25_cutoff);
                            break _inl_25;
                        }
                        const yCutSq = (doY ? _inl_25_result : 1e30);
                        const yukCoupling = _u_hu_yukawaCoupling;
                        const yukMu = _u_hu_yukawaMu;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_26_result;
                            _inl_26: {
                                let _inl_26__inl_13_result;
                                _inl_26__inl_13: {
                                    _inl_26__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_26__inl_13;
                                }
                                _inl_26_result = rt.bitcast_i32_u32(_b_nodes[(_inl_26__inl_13_result + 12)]);
                                break _inl_26;
                            }
                            const isLeaf = (_inl_26_result == HM_NONE);
                            if (isLeaf) {
                                let _inl_27_result;
                                _inl_27: {
                                    let _inl_27__inl_17_result;
                                    _inl_27__inl_17: {
                                        _inl_27__inl_17_result = (nIdx * NODE_STRIDE);
                                        break _inl_27__inl_17;
                                    }
                                    _inl_27_result = rt.bitcast_i32_u32(_b_nodes[(_inl_27__inl_17_result + 16)]);
                                    break _inl_27;
                                }
                                const pIdx = _inl_27_result;
                                if ((pIdx < 0)) {
                                    continue;
                                }
                                const j = ((pIdx) >>> 0);
                                const _sroa_34_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_34_base + 0];
                                const pj_posY = _b_particles[_sroa_34_base + 1];
                                const pj_velWX = _b_particles[_sroa_34_base + 2];
                                const pj_velWY = _b_particles[_sroa_34_base + 3];
                                const pj_mass = _b_particles[_sroa_34_base + 4];
                                const pj_charge = _b_particles[_sroa_34_base + 5];
                                const pj_angW = _b_particles[_sroa_34_base + 6];
                                const pj_baseMass = _b_particles[_sroa_34_base + 7];
                                const pj_flags = _b_particles[_sroa_34_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const dx = (pj_posX - wx);
                                const dy = (pj_posY - wy);
                                const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
                                const invR = (1.0 / Math.sqrt(rSq));
                                if (doG) {
                                    gPhi[0] = (gPhi[0] - (pj_mass * invR));
                                }
                                if (doC) {
                                    ePhi[0] = (ePhi[0] + (pj_charge * invR));
                                }
                                if ((doY && (rSq < yCutSq))) {
                                    const r = (1.0 / invR);
                                    yPhi[0] = (yPhi[0] - (((yukCoupling * pj_mass) * Math.exp(((-yukMu) * r))) * invR));
                                }
                            } else {
                                let _inl_28_result;
                                _inl_28: {
                                    let _inl_28__inl_5_result;
                                    _inl_28__inl_5: {
                                        _inl_28__inl_5_result = (nIdx * NODE_STRIDE);
                                        break _inl_28__inl_5;
                                    }
                                    _inl_28_result = rt.bitcast_f32_u32(_b_nodes[(_inl_28__inl_5_result + 4)]);
                                    break _inl_28;
                                }
                                const comX = _inl_28_result;
                                let _inl_29_result;
                                _inl_29: {
                                    let _inl_29__inl_6_result;
                                    _inl_29__inl_6: {
                                        _inl_29__inl_6_result = (nIdx * NODE_STRIDE);
                                        break _inl_29__inl_6;
                                    }
                                    _inl_29_result = rt.bitcast_f32_u32(_b_nodes[(_inl_29__inl_6_result + 5)]);
                                    break _inl_29;
                                }
                                const comY = _inl_29_result;
                                const dx = (comX - wx);
                                const dy = (comY - wy);
                                const distSq = (((dx * dx) + (dy * dy)) + softeningSq);
                                let _inl_30_result;
                                _inl_30: {
                                    let _inl_30__inl_3_result;
                                    _inl_30__inl_3: {
                                        _inl_30__inl_3_result = (nIdx * NODE_STRIDE);
                                        break _inl_30__inl_3;
                                    }
                                    _inl_30_result = rt.bitcast_f32_u32(_b_nodes[(_inl_30__inl_3_result + 2)]);
                                    break _inl_30;
                                }
                                let _inl_31_result;
                                _inl_31: {
                                    let _inl_31__inl_1_result;
                                    _inl_31__inl_1: {
                                        _inl_31__inl_1_result = (nIdx * NODE_STRIDE);
                                        break _inl_31__inl_1;
                                    }
                                    _inl_31_result = rt.bitcast_f32_u32(_b_nodes[_inl_31__inl_1_result]);
                                    break _inl_31;
                                }
                                const sizeX = (_inl_30_result - _inl_31_result);
                                let _inl_32_result;
                                _inl_32: {
                                    let _inl_32__inl_4_result;
                                    _inl_32__inl_4: {
                                        _inl_32__inl_4_result = (nIdx * NODE_STRIDE);
                                        break _inl_32__inl_4;
                                    }
                                    _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_4_result + 3)]);
                                    break _inl_32;
                                }
                                let _inl_33_result;
                                _inl_33: {
                                    let _inl_33__inl_2_result;
                                    _inl_33__inl_2: {
                                        _inl_33__inl_2_result = (nIdx * NODE_STRIDE);
                                        break _inl_33__inl_2;
                                    }
                                    _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_2_result + 1)]);
                                    break _inl_33;
                                }
                                const sizeY = (_inl_32_result - _inl_33_result);
                                const sizeSq = (((sizeX * sizeX)) < ((sizeY * sizeY)) ? ((sizeY * sizeY)) : ((sizeX * sizeX)));
                                if ((sizeSq < (BH_THETA_SQ * distSq))) {
                                    let _inl_34_result;
                                    _inl_34: {
                                        let _inl_34__inl_7_result;
                                        _inl_34__inl_7: {
                                            _inl_34__inl_7_result = (nIdx * NODE_STRIDE);
                                            break _inl_34__inl_7;
                                        }
                                        _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_7_result + 6)]);
                                        break _inl_34;
                                    }
                                    const aggMass = _inl_34_result;
                                    let _inl_35_result;
                                    _inl_35: {
                                        let _inl_35__inl_8_result;
                                        _inl_35__inl_8: {
                                            _inl_35__inl_8_result = (nIdx * NODE_STRIDE);
                                            break _inl_35__inl_8;
                                        }
                                        _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_8_result + 7)]);
                                        break _inl_35;
                                    }
                                    const aggCharge = _inl_35_result;
                                    const invR = (1.0 / Math.sqrt(distSq));
                                    if (doG) {
                                        gPhi[0] = (gPhi[0] - (aggMass * invR));
                                    }
                                    if (doC) {
                                        ePhi[0] = (ePhi[0] + (aggCharge * invR));
                                    }
                                    if ((doY && (distSq < yCutSq))) {
                                        const r = (1.0 / invR);
                                        yPhi[0] = (yPhi[0] - (((yukCoupling * aggMass) * Math.exp(((-yukMu) * r))) * invR));
                                    }
                                } else if (((top + 4) <= ((HM_MAX_STACK) | 0))) {
                                    let _inl_36_result;
                                    _inl_36: {
                                        let _inl_36__inl_13_result;
                                        _inl_36__inl_13: {
                                            _inl_36__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_36__inl_13;
                                        }
                                        _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_13_result + 12)]);
                                        break _inl_36;
                                    }
                                    const nw = _inl_36_result;
                                    let _inl_37_result;
                                    _inl_37: {
                                        let _inl_37__inl_14_result;
                                        _inl_37__inl_14: {
                                            _inl_37__inl_14_result = (nIdx * NODE_STRIDE);
                                            break _inl_37__inl_14;
                                        }
                                        _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_14_result + 13)]);
                                        break _inl_37;
                                    }
                                    const ne = _inl_37_result;
                                    let _inl_38_result;
                                    _inl_38: {
                                        let _inl_38__inl_15_result;
                                        _inl_38__inl_15: {
                                            _inl_38__inl_15_result = (nIdx * NODE_STRIDE);
                                            break _inl_38__inl_15;
                                        }
                                        _inl_38_result = rt.bitcast_i32_u32(_b_nodes[(_inl_38__inl_15_result + 14)]);
                                        break _inl_38;
                                    }
                                    const sw = _inl_38_result;
                                    let _inl_39_result;
                                    _inl_39: {
                                        let _inl_39__inl_16_result;
                                        _inl_39__inl_16: {
                                            _inl_39__inl_16_result = (nIdx * NODE_STRIDE);
                                            break _inl_39__inl_16;
                                        }
                                        _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                        break _inl_39;
                                    }
                                    const se = _inl_39_result;
                                    if ((nw != HM_NONE)) {
                                        stack[((top) >>> 0)] = ((nw) >>> 0);
                                        top++;
                                    }
                                    if ((ne != HM_NONE)) {
                                        stack[((top) >>> 0)] = ((ne) >>> 0);
                                        top++;
                                    }
                                    if ((sw != HM_NONE)) {
                                        stack[((top) >>> 0)] = ((sw) >>> 0);
                                        top++;
                                    }
                                    if ((se != HM_NONE)) {
                                        stack[((top) >>> 0)] = ((se) >>> 0);
                                        top++;
                                    }
                                }
                            }
                        }
                        const useDelay = (_u_hu_useDelay != 0);
                        const isPeriodic = (_u_hu_periodic != 0);
                        if (useDelay) {
                            for (let di = 0; (di < _u_hu_particleCount); di++) {
                                const _sroa_35_base = ((di) * 9);
                                const dp_posX = _b_particles[_sroa_35_base + 0];
                                const dp_posY = _b_particles[_sroa_35_base + 1];
                                const dp_velWX = _b_particles[_sroa_35_base + 2];
                                const dp_velWY = _b_particles[_sroa_35_base + 3];
                                const dp_mass = _b_particles[_sroa_35_base + 4];
                                const dp_charge = _b_particles[_sroa_35_base + 5];
                                const dp_angW = _b_particles[_sroa_35_base + 6];
                                const dp_baseMass = _b_particles[_sroa_35_base + 7];
                                const dp_flags = _b_particles[_sroa_35_base + 8];
                                if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                    continue;
                                }
                                if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                    continue;
                                }
                                const _sroa_36 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                                const ret_x = _sroa_36.x;
                                const ret_y = _sroa_36.y;
                                const ret_vx = _sroa_36.vx;
                                const ret_vy = _sroa_36.vy;
                                const ret_angw = _sroa_36.angw;
                                const ret_valid = _sroa_36.valid;
                                if ((!ret_valid)) {
                                    continue;
                                }
                                const _sroa_37_base = ((di) * 5);
                                const dAux_radius = _b_particleAux[_sroa_37_base + 0];
                                const dAux_particleId = _b_particleAux[_sroa_37_base + 1];
                                const dAux_deathTime = _b_particleAux[_sroa_37_base + 2];
                                const dAux_deathMass = _b_particleAux[_sroa_37_base + 3];
                                const dAux_deathAngVel = _b_particleAux[_sroa_37_base + 4];
                                accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, softeningSq, yCutSq, yukCoupling, yukMu, isPeriodic, gPhi, ePhi, yPhi);
                            }
                        }
                        const idx = ((gy * HGRID) + gx);
                        _b_gravPotential[idx] = gPhi[0];
                        _b_elecPotential[idx] = ePhi[0];
                        _b_yukawaPotential[idx] = yPhi[0];
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const gx = gid_x;
                    const gy = gid_y;
                    if (((gx >= HGRID) || (gy >= HGRID))) {
                        break __invocation;
                    }
                    const wx = (_u_hu_viewLeft + ((((+(gx)) + 0.5)) * _u_hu_cellW));
                    const wy = (_u_hu_viewTop + ((((+(gy)) + 0.5)) * _u_hu_cellH));
                    let gPhi = [0.0];
                    let ePhi = [0.0];
                    let yPhi = [0.0];
                    const doG = (_u_hu_doGravity != 0);
                    const doC = (_u_hu_doCoulomb != 0);
                    const doY = (_u_hu_doYukawa != 0);
                    const softeningSq = _u_hu_softeningSq;
                    const _inl_25_mu = _u_hu_yukawaMu;
                    let _inl_25_result;
                    _inl_25: {
                        const _inl_25_cutoff = (6.0 / _inl_25_mu);
                        _inl_25_result = (_inl_25_cutoff * _inl_25_cutoff);
                        break _inl_25;
                    }
                    const yCutSq = (doY ? _inl_25_result : 1e30);
                    const yukCoupling = _u_hu_yukawaCoupling;
                    const yukMu = _u_hu_yukawaMu;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_13_result;
                            _inl_26__inl_13: {
                                _inl_26__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_26__inl_13;
                            }
                            _inl_26_result = rt.bitcast_i32_u32(_b_nodes[(_inl_26__inl_13_result + 12)]);
                            break _inl_26;
                        }
                        const isLeaf = (_inl_26_result == HM_NONE);
                        if (isLeaf) {
                            let _inl_27_result;
                            _inl_27: {
                                let _inl_27__inl_17_result;
                                _inl_27__inl_17: {
                                    _inl_27__inl_17_result = (nIdx * NODE_STRIDE);
                                    break _inl_27__inl_17;
                                }
                                _inl_27_result = rt.bitcast_i32_u32(_b_nodes[(_inl_27__inl_17_result + 16)]);
                                break _inl_27;
                            }
                            const pIdx = _inl_27_result;
                            if ((pIdx < 0)) {
                                continue;
                            }
                            const j = ((pIdx) >>> 0);
                            const _sroa_38_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_38_base + 0];
                            const pj_posY = _b_particles[_sroa_38_base + 1];
                            const pj_velWX = _b_particles[_sroa_38_base + 2];
                            const pj_velWY = _b_particles[_sroa_38_base + 3];
                            const pj_mass = _b_particles[_sroa_38_base + 4];
                            const pj_charge = _b_particles[_sroa_38_base + 5];
                            const pj_angW = _b_particles[_sroa_38_base + 6];
                            const pj_baseMass = _b_particles[_sroa_38_base + 7];
                            const pj_flags = _b_particles[_sroa_38_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const dx = (pj_posX - wx);
                            const dy = (pj_posY - wy);
                            const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
                            const invR = (1.0 / Math.sqrt(rSq));
                            if (doG) {
                                gPhi[0] = (gPhi[0] - (pj_mass * invR));
                            }
                            if (doC) {
                                ePhi[0] = (ePhi[0] + (pj_charge * invR));
                            }
                            if ((doY && (rSq < yCutSq))) {
                                const r = (1.0 / invR);
                                yPhi[0] = (yPhi[0] - (((yukCoupling * pj_mass) * Math.exp(((-yukMu) * r))) * invR));
                            }
                        } else {
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_5_result;
                                _inl_28__inl_5: {
                                    _inl_28__inl_5_result = (nIdx * NODE_STRIDE);
                                    break _inl_28__inl_5;
                                }
                                _inl_28_result = rt.bitcast_f32_u32(_b_nodes[(_inl_28__inl_5_result + 4)]);
                                break _inl_28;
                            }
                            const comX = _inl_28_result;
                            let _inl_29_result;
                            _inl_29: {
                                let _inl_29__inl_6_result;
                                _inl_29__inl_6: {
                                    _inl_29__inl_6_result = (nIdx * NODE_STRIDE);
                                    break _inl_29__inl_6;
                                }
                                _inl_29_result = rt.bitcast_f32_u32(_b_nodes[(_inl_29__inl_6_result + 5)]);
                                break _inl_29;
                            }
                            const comY = _inl_29_result;
                            const dx = (comX - wx);
                            const dy = (comY - wy);
                            const distSq = (((dx * dx) + (dy * dy)) + softeningSq);
                            let _inl_30_result;
                            _inl_30: {
                                let _inl_30__inl_3_result;
                                _inl_30__inl_3: {
                                    _inl_30__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_30__inl_3;
                                }
                                _inl_30_result = rt.bitcast_f32_u32(_b_nodes[(_inl_30__inl_3_result + 2)]);
                                break _inl_30;
                            }
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_1_result;
                                _inl_31__inl_1: {
                                    _inl_31__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_31__inl_1;
                                }
                                _inl_31_result = rt.bitcast_f32_u32(_b_nodes[_inl_31__inl_1_result]);
                                break _inl_31;
                            }
                            const sizeX = (_inl_30_result - _inl_31_result);
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_4_result;
                                _inl_32__inl_4: {
                                    _inl_32__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_32__inl_4;
                                }
                                _inl_32_result = rt.bitcast_f32_u32(_b_nodes[(_inl_32__inl_4_result + 3)]);
                                break _inl_32;
                            }
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_2_result;
                                _inl_33__inl_2: {
                                    _inl_33__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_33__inl_2;
                                }
                                _inl_33_result = rt.bitcast_f32_u32(_b_nodes[(_inl_33__inl_2_result + 1)]);
                                break _inl_33;
                            }
                            const sizeY = (_inl_32_result - _inl_33_result);
                            const sizeSq = (((sizeX * sizeX)) < ((sizeY * sizeY)) ? ((sizeY * sizeY)) : ((sizeX * sizeX)));
                            if ((sizeSq < (BH_THETA_SQ * distSq))) {
                                let _inl_34_result;
                                _inl_34: {
                                    let _inl_34__inl_7_result;
                                    _inl_34__inl_7: {
                                        _inl_34__inl_7_result = (nIdx * NODE_STRIDE);
                                        break _inl_34__inl_7;
                                    }
                                    _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_7_result + 6)]);
                                    break _inl_34;
                                }
                                const aggMass = _inl_34_result;
                                let _inl_35_result;
                                _inl_35: {
                                    let _inl_35__inl_8_result;
                                    _inl_35__inl_8: {
                                        _inl_35__inl_8_result = (nIdx * NODE_STRIDE);
                                        break _inl_35__inl_8;
                                    }
                                    _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_8_result + 7)]);
                                    break _inl_35;
                                }
                                const aggCharge = _inl_35_result;
                                const invR = (1.0 / Math.sqrt(distSq));
                                if (doG) {
                                    gPhi[0] = (gPhi[0] - (aggMass * invR));
                                }
                                if (doC) {
                                    ePhi[0] = (ePhi[0] + (aggCharge * invR));
                                }
                                if ((doY && (distSq < yCutSq))) {
                                    const r = (1.0 / invR);
                                    yPhi[0] = (yPhi[0] - (((yukCoupling * aggMass) * Math.exp(((-yukMu) * r))) * invR));
                                }
                            } else if (((top + 4) <= ((HM_MAX_STACK) | 0))) {
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_13_result;
                                    _inl_36__inl_13: {
                                        _inl_36__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_36__inl_13;
                                    }
                                    _inl_36_result = rt.bitcast_i32_u32(_b_nodes[(_inl_36__inl_13_result + 12)]);
                                    break _inl_36;
                                }
                                const nw = _inl_36_result;
                                let _inl_37_result;
                                _inl_37: {
                                    let _inl_37__inl_14_result;
                                    _inl_37__inl_14: {
                                        _inl_37__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_37__inl_14;
                                    }
                                    _inl_37_result = rt.bitcast_i32_u32(_b_nodes[(_inl_37__inl_14_result + 13)]);
                                    break _inl_37;
                                }
                                const ne = _inl_37_result;
                                let _inl_38_result;
                                _inl_38: {
                                    let _inl_38__inl_15_result;
                                    _inl_38__inl_15: {
                                        _inl_38__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_38__inl_15;
                                    }
                                    _inl_38_result = rt.bitcast_i32_u32(_b_nodes[(_inl_38__inl_15_result + 14)]);
                                    break _inl_38;
                                }
                                const sw = _inl_38_result;
                                let _inl_39_result;
                                _inl_39: {
                                    let _inl_39__inl_16_result;
                                    _inl_39__inl_16: {
                                        _inl_39__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_39__inl_16;
                                    }
                                    _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                    break _inl_39;
                                }
                                const se = _inl_39_result;
                                if ((nw != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != HM_NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                    const useDelay = (_u_hu_useDelay != 0);
                    const isPeriodic = (_u_hu_periodic != 0);
                    if (useDelay) {
                        for (let di = 0; (di < _u_hu_particleCount); di++) {
                            const _sroa_39_base = ((di) * 9);
                            const dp_posX = _b_particles[_sroa_39_base + 0];
                            const dp_posY = _b_particles[_sroa_39_base + 1];
                            const dp_velWX = _b_particles[_sroa_39_base + 2];
                            const dp_velWY = _b_particles[_sroa_39_base + 3];
                            const dp_mass = _b_particles[_sroa_39_base + 4];
                            const dp_charge = _b_particles[_sroa_39_base + 5];
                            const dp_angW = _b_particles[_sroa_39_base + 6];
                            const dp_baseMass = _b_particles[_sroa_39_base + 7];
                            const dp_flags = _b_particles[_sroa_39_base + 8];
                            if ((((dp_flags & FLAG_RETIRED)) == 0)) {
                                continue;
                            }
                            if ((((dp_flags & FLAG_ALIVE)) != 0)) {
                                continue;
                            }
                            const _sroa_40 = getDelayedStateGPU(di, wx, wy, _u_hu_simTime, isPeriodic, _u_hu_domainW, _u_hu_domainH, _u_hu_topologyMode, true);
                            const ret_x = _sroa_40.x;
                            const ret_y = _sroa_40.y;
                            const ret_vx = _sroa_40.vx;
                            const ret_vy = _sroa_40.vy;
                            const ret_angw = _sroa_40.angw;
                            const ret_valid = _sroa_40.valid;
                            if ((!ret_valid)) {
                                continue;
                            }
                            const _sroa_41_base = ((di) * 5);
                            const dAux_radius = _b_particleAux[_sroa_41_base + 0];
                            const dAux_particleId = _b_particleAux[_sroa_41_base + 1];
                            const dAux_deathTime = _b_particleAux[_sroa_41_base + 2];
                            const dAux_deathMass = _b_particleAux[_sroa_41_base + 3];
                            const dAux_deathAngVel = _b_particleAux[_sroa_41_base + 4];
                            accumulatePotential(wx, wy, ret_x, ret_y, dAux_deathMass, dp_charge, doG, doC, doY, softeningSq, yCutSq, yukCoupling, yukMu, isPeriodic, gPhi, ePhi, yPhi);
                        }
                    }
                    const idx = ((gy * HGRID) + gx);
                    _b_gravPotential[idx] = gPhi[0];
                    _b_elecPotential[idx] = ePhi[0];
                    _b_yukawaPotential[idx] = yPhi[0];
                }
            }
        }
    }
    entry["computeHeatmapTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_computeHeatmapTree(workgroups, bindings, domain, origin);
    };

    entryInfo["blurHorizontal"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_blurHorizontal(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_arr = bindings.arr;
        const _b_blurTemp = bindings.blurTemp;
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
                const gid_y = Oy;
                __invocation: {
                    const x = gid_x;
                    const y = gid_y;
                    if (((x >= HGRID) || (y >= HGRID))) {
                        break __invocation;
                    }
                    const row = (y * HGRID);
                    const l = _b_arr[(row + ((x > 0) ? (x - 1) : 0))];
                    const c = _b_arr[(row + x)];
                    const r = _b_arr[(row + ((x < (HGRID - 1)) ? (x + 1) : (HGRID - 1)))];
                    _b_blurTemp[(row + x)] = ((((l + c) + r)) * (0.3333333333333333));
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const x = gid_x;
                            const y = gid_y;
                            if (((x >= HGRID) || (y >= HGRID))) {
                                break __invocation;
                            }
                            const row = (y * HGRID);
                            const l = _b_arr[(row + ((x > 0) ? (x - 1) : 0))];
                            const c = _b_arr[(row + x)];
                            const r = _b_arr[(row + ((x < (HGRID - 1)) ? (x + 1) : (HGRID - 1)))];
                            _b_blurTemp[(row + x)] = ((((l + c) + r)) * (0.3333333333333333));
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const x = gid_x;
                        const y = gid_y;
                        if (((x >= HGRID) || (y >= HGRID))) {
                            break __invocation;
                        }
                        const row = (y * HGRID);
                        const l = _b_arr[(row + ((x > 0) ? (x - 1) : 0))];
                        const c = _b_arr[(row + x)];
                        const r = _b_arr[(row + ((x < (HGRID - 1)) ? (x + 1) : (HGRID - 1)))];
                        _b_blurTemp[(row + x)] = ((((l + c) + r)) * (0.3333333333333333));
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const x = gid_x;
                    const y = gid_y;
                    if (((x >= HGRID) || (y >= HGRID))) {
                        break __invocation;
                    }
                    const row = (y * HGRID);
                    const l = _b_arr[(row + ((x > 0) ? (x - 1) : 0))];
                    const c = _b_arr[(row + x)];
                    const r = _b_arr[(row + ((x < (HGRID - 1)) ? (x + 1) : (HGRID - 1)))];
                    _b_blurTemp[(row + x)] = ((((l + c) + r)) * (0.3333333333333333));
                }
            }
        }
    }
    entry["blurHorizontal"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_blurHorizontal(workgroups, bindings, domain, origin);
    };

    entryInfo["blurVertical"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_blurVertical(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_arr = bindings.arr;
        const _b_blurTemp = bindings.blurTemp;
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
                const gid_y = Oy;
                __invocation: {
                    const x = gid_x;
                    const y = gid_y;
                    if (((x >= HGRID) || (y >= HGRID))) {
                        break __invocation;
                    }
                    const t = _b_blurTemp[((((y > 0) ? (y - 1) : 0) * HGRID) + x)];
                    const c = _b_blurTemp[((y * HGRID) + x)];
                    const b = _b_blurTemp[((((y < (HGRID - 1)) ? (y + 1) : (HGRID - 1)) * HGRID) + x)];
                    _b_arr[((y * HGRID) + x)] = ((((t + c) + b)) * (0.3333333333333333));
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const x = gid_x;
                            const y = gid_y;
                            if (((x >= HGRID) || (y >= HGRID))) {
                                break __invocation;
                            }
                            const t = _b_blurTemp[((((y > 0) ? (y - 1) : 0) * HGRID) + x)];
                            const c = _b_blurTemp[((y * HGRID) + x)];
                            const b = _b_blurTemp[((((y < (HGRID - 1)) ? (y + 1) : (HGRID - 1)) * HGRID) + x)];
                            _b_arr[((y * HGRID) + x)] = ((((t + c) + b)) * (0.3333333333333333));
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const x = gid_x;
                        const y = gid_y;
                        if (((x >= HGRID) || (y >= HGRID))) {
                            break __invocation;
                        }
                        const t = _b_blurTemp[((((y > 0) ? (y - 1) : 0) * HGRID) + x)];
                        const c = _b_blurTemp[((y * HGRID) + x)];
                        const b = _b_blurTemp[((((y < (HGRID - 1)) ? (y + 1) : (HGRID - 1)) * HGRID) + x)];
                        _b_arr[((y * HGRID) + x)] = ((((t + c) + b)) * (0.3333333333333333));
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const x = gid_x;
                    const y = gid_y;
                    if (((x >= HGRID) || (y >= HGRID))) {
                        break __invocation;
                    }
                    const t = _b_blurTemp[((((y > 0) ? (y - 1) : 0) * HGRID) + x)];
                    const c = _b_blurTemp[((y * HGRID) + x)];
                    const b = _b_blurTemp[((((y < (HGRID - 1)) ? (y + 1) : (HGRID - 1)) * HGRID) + x)];
                    _b_arr[((y * HGRID) + x)] = ((((t + c) + b)) * (0.3333333333333333));
                }
            }
        }
    }
    entry["blurVertical"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_blurVertical(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["computeHeatmap"] = function (workgroups, domain, origin) {
            return __entry_0_computeHeatmap(workgroups, bindings, domain, origin);
        };
        bound["computeHeatmapTree"] = function (workgroups, domain, origin) {
            return __entry_1_computeHeatmapTree(workgroups, bindings, domain, origin);
        };
        bound["blurHorizontal"] = function (workgroups, domain, origin) {
            return __entry_2_blurHorizontal(workgroups, bindings, domain, origin);
        };
        bound["blurVertical"] = function (workgroups, domain, origin) {
            return __entry_3_blurVertical(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["particles","particleAux","nodes","gravPotential","elecPotential","yukawaPotential","hu","histData","histMeta","arr","blurTemp"], entryInfo };
}
