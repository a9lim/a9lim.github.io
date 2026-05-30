// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/forces-tree.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: fd444a69d8abea4a336790d2e4ad4654f8e11af8417fc5f89635f8980ca3bb77
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":183017,"lines":2831,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":5,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.874Z
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
    const MAX_STACK = 128;

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

    function accumulateForce(af, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, sx, sy, svx, svy, sMass, sCharge, sAngVel, sMagMoment, sAngMomentum, sAxMod, sYukMod, sHiggsMod, pRi5, jerkOut, useAberration, gravOn, coulOn, magOn, gmOn, yukOn, onePNOn, higgsOn, radOn, needAxMod) {
        const softeningSq = bindings.uniforms.softeningSq;
        const periodic = (bindings.uniforms.boundaryMode == BOUND_LOOP);
        let disp_x = (sx - px);
        let disp_y = (sy - py);
        if (periodic) {
            const _sroa_5 = fullMinImageP(px, py, sx, sy, bindings.uniforms.domainW, bindings.uniforms.domainH, bindings.uniforms.topologyMode);
            disp_x = _sroa_5.x;
            disp_y = _sroa_5.y;
        }
        const rx = disp_x;
        const ry = disp_y;
        const rawRSq = ((rx * rx) + (ry * ry));
        const rSq = (rawRSq + softeningSq);
        const invRSq = (1.0 / rSq);
        const invR = Math.sqrt(invRSq);
        const invR3 = (invR * invRSq);
        const invR5 = (invR3 * invRSq);
        let aberr = 1.0;
        if (useAberration) {
            const nDotV = ((-(((rx * svx) + (ry * svy)))) * invR);
            const denom = (((1.0 - nDotV)) < (ABERRATION_CLAMP_MIN) ? (ABERRATION_CLAMP_MIN) : ((1.0 - nDotV)));
            aberr = ((ABERRATION_CLAMP_MAX) < ((1.0 / (((denom * denom) * denom)))) ? (ABERRATION_CLAMP_MAX) : ((1.0 / (((denom * denom) * denom)))));
        }
        const invR3a = (useAberration ? (invR3 * aberr) : invR3);
        const invR5a = (useAberration ? (invR5 * aberr) : invR5);
        let axModPair = 1.0;
        if (needAxMod) {
            axModPair = Math.sqrt((((pAxMod * sAxMod)) < (0.0) ? (0.0) : ((pAxMod * sAxMod))));
        }
        const vrx = (svx - pVelX);
        const vry = (svy - pVelY);
        const rDotVr = ((rx * vrx) + (ry * vry));
        if (gravOn) {
            const k = (pMass * sMass);
            const fDir = (k * invR3a);
            const fx = (rx * fDir);
            const fy = (ry * fDir);
            (af).f0.x = ((af).f0.x + fx);
            (af).f0.y = ((af).f0.y + fy);
            (af).totalForce.x = ((af).totalForce.x + fx);
            (af).totalForce.y = ((af).totalForce.y + fy);
            if (radOn) {
                const jRadial = (((((-3.0) * rDotVr) * k) * invRSq) * invR3a);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
            }
            const crossRV = ((rx * ((svy - pVelY))) - (ry * ((svx - pVelX))));
            const wOrbit = (crossRV * invRSq);
            const dw = (pAngVel - wOrbit);
            let coupling = sMass;
            if ((coulOn && (pMass > EPSILON))) {
                coupling = (coupling + ((pCharge * sCharge) / pMass));
            }
            const invR6 = ((invRSq * invRSq) * invRSq);
            (af).torques.z = ((af).torques.z + ((((((-TIDAL_STRENGTH) * coupling) * coupling) * pRi5) * invR6) * dw));
        }
        if (coulOn) {
            const k = ((-((pCharge * sCharge))) * axModPair);
            const fDir = (k * invR3a);
            const fx = (rx * fDir);
            const fy = (ry * fDir);
            (af).f0.z = ((af).f0.z + fx);
            (af).f0.w = ((af).f0.w + fy);
            (af).totalForce.x = ((af).totalForce.x + fx);
            (af).totalForce.y = ((af).totalForce.y + fy);
            if (radOn) {
                const jRadial = (((((-3.0) * rDotVr) * k) * invRSq) * invR3a);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
            }
        }
        const crossSV = ((svx * ry) - (svy * rx));
        if (magOn) {
            const axMod = axModPair;
            const fDir = ((((-3.0) * ((pMagMoment * sMagMoment))) * invR5a) * axMod);
            const fx = (rx * fDir);
            const fy = (ry * fDir);
            (af).f1.x = ((af).f1.x + fx);
            (af).f1.y = ((af).f1.y + fy);
            (af).totalForce.x = ((af).totalForce.x + fx);
            (af).totalForce.y = ((af).totalForce.y + fy);
            if (radOn) {
                const invR7a = (invR5a * invRSq);
                const jRadial = ((((15.0 * ((pMagMoment * sMagMoment))) * rDotVr) * invR7a) * axMod);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
            }
            const BzMoving = (((sCharge * crossSV) * invR3) * axMod);
            (af).bFields.x = ((af).bFields.x + BzMoving);
            (af).bFieldGrads.x = ((af).bFieldGrads.x + ((((3.0 * BzMoving) * rx) * invRSq) + (((sCharge * svy) * invR3) * axMod)));
            (af).bFieldGrads.y = ((af).bFieldGrads.y + ((((3.0 * BzMoving) * ry) * invRSq) - (((sCharge * svx) * invR3) * axMod)));
            (af).bFields.x = ((af).bFields.x - ((sMagMoment * invR3) * axMod));
            (af).bFieldGrads.x = ((af).bFieldGrads.x - ((((3.0 * sMagMoment) * rx) * invR5) * axMod));
            (af).bFieldGrads.y = ((af).bFieldGrads.y - ((((3.0 * sMagMoment) * ry) * invR5) * axMod));
        }
        if (gmOn) {
            const fDir = ((3.0 * ((pAngMomentum * sAngMomentum))) * invR5a);
            const fx = (rx * fDir);
            const fy = (ry * fDir);
            (af).f1.z = ((af).f1.z + fx);
            (af).f1.w = ((af).f1.w + fy);
            (af).totalForce.x = ((af).totalForce.x + fx);
            (af).totalForce.y = ((af).totalForce.y + fy);
            if (radOn) {
                const invR7a = (invR5a * invRSq);
                const jRadial = ((((-15.0) * ((pAngMomentum * sAngMomentum))) * rDotVr) * invR7a);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
            }
            const BgzMoving = (((-sMass) * crossSV) * invR3);
            (af).bFields.y = ((af).bFields.y + BgzMoving);
            (af).bFieldGrads.z = ((af).bFieldGrads.z + ((((3.0 * BgzMoving) * rx) * invRSq) - ((sMass * svy) * invR3)));
            (af).bFieldGrads.w = ((af).bFieldGrads.w + ((((3.0 * BgzMoving) * ry) * invRSq) + ((sMass * svx) * invR3)));
            (af).bFields.y = ((af).bFields.y - ((2.0 * sAngMomentum) * invR3));
            (af).bFieldGrads.z = ((af).bFieldGrads.z - (((6.0 * sAngMomentum) * rx) * invR5));
            (af).bFieldGrads.w = ((af).bFieldGrads.w - (((6.0 * sAngMomentum) * ry) * invR5));
            const fdTorque = (((2.0 * sAngMomentum) * ((sAngVel - pAngVel))) * invR3);
            (af).torques.y = ((af).torques.y + fdTorque);
        }
        if (yukOn) {
            const mu = (higgsOn ? (bindings.uniforms.yukawaMu * Math.sqrt((pHiggsMod * sHiggsMod))) : bindings.uniforms.yukawaMu);
            const cutoffSq = (higgsOn ? (((6.0 / ((mu) < (EPSILON) ? (EPSILON) : (mu)))) * ((6.0 / ((mu) < (EPSILON) ? (EPSILON) : (mu))))) : (((6.0 / bindings.uniforms.yukawaMu)) * ((6.0 / bindings.uniforms.yukawaMu))));
            if ((rawRSq < cutoffSq)) {
                const r = (1.0 / invR);
                const muR = (mu * r);
                const expMuR = ((muR < 80.0) ? Math.exp((-muR)) : 0.0);
                const yukModPair = Math.sqrt((((pYukMod * sYukMod)) < (0.0) ? (0.0) : ((pYukMod * sYukMod))));
                const yukInvRa = (useAberration ? (invR * aberr) : invR);
                const fDir = ((((((bindings.uniforms.yukawaCoupling * yukModPair) * pMass) * sMass) * expMuR) * ((invRSq + (mu * invR)))) * yukInvRa);
                const fx = (rx * fDir);
                const fy = (ry * fDir);
                (af).f3.z = ((af).f3.z + fx);
                (af).f3.w = ((af).f3.w + fy);
                (af).totalForce.x = ((af).totalForce.x + fx);
                (af).totalForce.y = ((af).totalForce.y + fy);
                if (radOn) {
                    const jRadial = (((((((((-((((3.0 * invRSq) + ((3.0 * mu) * invR)) + (mu * mu)))) * rDotVr) * bindings.uniforms.yukawaCoupling) * yukModPair) * pMass) * sMass) * expMuR) * invRSq) * yukInvRa);
                    (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                    (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
                }
                if (onePNOn) {
                    const nx = (rx * invR);
                    const ny = (ry * invR);
                    const nDotV1 = ((nx * pVelX) + (ny * pVelY));
                    const nDotV2 = ((nx * svx) + (ny * svy));
                    const v1DotV2 = ((pVelX * svx) + (pVelY * svy));
                    const alpha = (1.0 + (mu * r));
                    const beta = ((((((0.5 * bindings.uniforms.yukawaCoupling) * yukModPair) * pMass) * sMass) * expMuR) * invRSq);
                    const radial = (-(((alpha * v1DotV2) + ((((((alpha * alpha) + alpha) + 1.0)) * nDotV1) * nDotV2))));
                    const sbX = (beta * (((radial * nx) + (alpha * (((nDotV2 * pVelX) + (nDotV1 * svx)))))));
                    const sbY = (beta * (((radial * ny) + (alpha * (((nDotV2 * pVelY) + (nDotV1 * svy)))))));
                    (af).f2.x = ((af).f2.x + sbX);
                    (af).f2.y = ((af).f2.y + sbY);
                    (af).totalForce.x = ((af).totalForce.x + sbX);
                    (af).totalForce.y = ((af).totalForce.y + sbY);
                }
            }
        }
        if ((onePNOn && gmOn)) {
            const r_val = (1.0 / invR);
            const nx = (rx * invR);
            const ny = (ry * invR);
            const v1Sq = ((pVelX * pVelX) + (pVelY * pVelY));
            const v2Sq = ((svx * svx) + (svy * svy));
            const nDotV1 = ((nx * pVelX) + (ny * pVelY));
            const nDotV2 = ((nx * svx) + (ny * svy));
            const radial = (((((-v1Sq) - (2.0 * v2Sq)) + ((1.5 * nDotV2) * nDotV2)) + ((5.0 * pMass) * invR)) + ((4.0 * sMass) * invR));
            const v1Coeff = ((4.0 * nDotV1) - (3.0 * nDotV2));
            const v2Coeff = (3.0 * nDotV2);
            const base = ((pMass * sMass) * invR3);
            const eihX = (base * (((rx * radial) + ((((pVelX * v1Coeff) + (svx * v2Coeff))) * r_val))));
            const eihY = (base * (((ry * radial) + ((((pVelY * v1Coeff) + (svy * v2Coeff))) * r_val))));
            (af).f2.x = ((af).f2.x + eihX);
            (af).f2.y = ((af).f2.y + eihY);
            (af).totalForce.x = ((af).totalForce.x + eihX);
            (af).totalForce.y = ((af).totalForce.y + eihY);
            if (radOn) {
                const kEIH = ((pMass * sMass) * (((5.0 * pMass) + (4.0 * sMass))));
                const fDirEIH = ((kEIH * invRSq) * invRSq);
                const jRadialEIH = ((((((-4.0) * kEIH) * rDotVr) * invRSq) * invRSq) * invRSq);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDirEIH) + (rx * jRadialEIH)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDirEIH) + (ry * jRadialEIH)));
            }
        }
        if ((onePNOn && magOn)) {
            const nx = (rx * invR);
            const ny = (ry * invR);
            const v2DotN = ((svx * nx) + (svy * ny));
            const v1DotN = ((pVelX * nx) + (pVelY * ny));
            const coeff = (((0.5 * pCharge) * sCharge) * invRSq);
            const darX = (coeff * (((pVelX * v2DotN) - (((3.0 * nx) * v1DotN) * v2DotN))));
            const darY = (coeff * (((pVelY * v2DotN) - (((3.0 * ny) * v1DotN) * v2DotN))));
            (af).f2.x = ((af).f2.x + darX);
            (af).f2.y = ((af).f2.y + darY);
            (af).totalForce.x = ((af).totalForce.x + darX);
            (af).totalForce.y = ((af).totalForce.y + darY);
        }
        if (((onePNOn && gmOn) && magOn)) {
            const crossCoeff = (((pCharge * sCharge) * ((pMass + sMass))) - ((((pCharge * pCharge) * sMass) + ((sCharge * sCharge) * pMass))));
            const fDir = ((crossCoeff * invRSq) * invRSq);
            const bazX = (rx * fDir);
            const bazY = (ry * fDir);
            (af).f2.x = ((af).f2.x + bazX);
            (af).f2.y = ((af).f2.y + bazY);
            (af).totalForce.x = ((af).totalForce.x + bazX);
            (af).totalForce.y = ((af).totalForce.y + bazY);
            if (radOn) {
                const jRadial = ((((((-4.0) * crossCoeff) * rDotVr) * invRSq) * invRSq) * invRSq);
                (jerkOut).x = ((jerkOut).x + ((vrx * fDir) + (rx * jRadial)));
                (jerkOut).y = ((jerkOut).y + ((vry * fDir) + (ry * jRadial)));
            }
        }
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_nodes = bindings.nodes;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_dt = _b_uniforms.dt;
        const _u_uniforms_simTime = _b_uniforms.simTime;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_toggles0 = _b_uniforms.toggles0;
        const _u_uniforms_boundaryMode = _b_uniforms.boundaryMode;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_aliveCount = _b_uniforms.aliveCount;
        const _u_uniforms_bhTheta = _b_uniforms.bhTheta;
        const _b_particleState = bindings.particleState;
        const _b_particleAux = bindings.particleAux;
        const _b_derived_in = bindings.derived_in;
        const _b_axYukMod_in = bindings.axYukMod_in;
        const _b_ghostOriginalIdx = bindings.ghostOriginalIdx;
        const _b_allForces = bindings.allForces;
        const _b_maxAccel = bindings.maxAccel;
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
                    const pIdx = gid_x;
                    if ((pIdx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    const _sroa_6_base = ((pIdx) * 9);
                    const ps_posX = _b_particleState[_sroa_6_base + 0];
                    const ps_posY = _b_particleState[_sroa_6_base + 1];
                    const ps_velWX = _b_particleState[_sroa_6_base + 2];
                    const ps_velWY = _b_particleState[_sroa_6_base + 3];
                    const ps_mass = _b_particleState[_sroa_6_base + 4];
                    const ps_charge = _b_particleState[_sroa_6_base + 5];
                    const ps_angW = _b_particleState[_sroa_6_base + 6];
                    const ps_baseMass = _b_particleState[_sroa_6_base + 7];
                    const ps_flags = _b_particleState[_sroa_6_base + 8];
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    if ((((ps_flags & FLAG_GHOST)) != 0)) {
                        break __invocation;
                    }
                    const px = ps_posX;
                    const py = ps_posY;
                    const pMass = ps_mass;
                    const pCharge = ps_charge;
                    const _sroa_7_base = ((pIdx) * 8);
                    const pDerived_magMoment = _b_derived_in[_sroa_7_base + 0];
                    const pDerived_angMomentum = _b_derived_in[_sroa_7_base + 1];
                    const pDerived_invMass = _b_derived_in[_sroa_7_base + 2];
                    const pDerived_radiusSq = _b_derived_in[_sroa_7_base + 3];
                    const pDerived_velX = _b_derived_in[_sroa_7_base + 4];
                    const pDerived_velY = _b_derived_in[_sroa_7_base + 5];
                    const pDerived_angVel = _b_derived_in[_sroa_7_base + 6];
                    const pDerived_bodyRSq = _b_derived_in[_sroa_7_base + 7];
                    const pMagMoment = pDerived_magMoment;
                    const pAngMomentum = pDerived_angMomentum;
                    const _sroa_8_base = ((pIdx) * 5);
                    const pAux_radius = _b_particleAux[_sroa_8_base + 0];
                    const pAux_particleId = _b_particleAux[_sroa_8_base + 1];
                    const pAux_deathTime = _b_particleAux[_sroa_8_base + 2];
                    const pAux_deathMass = _b_particleAux[_sroa_8_base + 3];
                    const pAux_deathAngVel = _b_particleAux[_sroa_8_base + 4];
                    const pBodyRadiusSq = pDerived_bodyRSq;
                    const pBodyRadius = Math.sqrt(pBodyRadiusSq);
                    const pRi5 = ((pBodyRadiusSq * pBodyRadiusSq) * pBodyRadius);
                    const pAngW = ps_angW;
                    const _sroa_9_base = ((pIdx) * 4 + 0);
                    const pAym_x = _b_axYukMod_in[_sroa_9_base + 0];
                    const pAym_y = _b_axYukMod_in[_sroa_9_base + 1];
                    const pAym_z = _b_axYukMod_in[_sroa_9_base + 2];
                    const pAym_w = _b_axYukMod_in[_sroa_9_base + 3];
                    const pAxMod = pAym_x;
                    const pYukMod = pAym_y;
                    const pHiggsMod = pAym_z;
                    const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                    const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                    const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                    const pVelX = (ps_velWX * invGamma);
                    const pVelY = (ps_velWY * invGamma);
                    const pAngVel = (relOn ? (pAngW / Math.sqrt((1.0 + ((pAngW * pAngW) * pBodyRadiusSq)))) : pAngW);
                    const pInvMass = pDerived_invMass;
                    const thetaSq = (_u_uniforms_bhTheta * _u_uniforms_bhTheta);
                    const pid = pAux_particleId;
                    const _t0 = _u_uniforms_toggles0;
                    const _gravOn = (((_t0 & GRAVITY_BIT)) != 0);
                    const _coulOn = (((_t0 & COULOMB_BIT)) != 0);
                    const _magOn = (((_t0 & MAGNETIC_BIT)) != 0);
                    const _gmOn = (((_t0 & GRAVITOMAG_BIT)) != 0);
                    const _yukOn = (((_t0 & YUKAWA_BIT)) != 0);
                    const _onePNOn = (((_t0 & ONE_PN_BIT)) != 0);
                    const _higgsOn = (((_t0 & HIGGS_BIT)) != 0);
                    const _radOn = (((_t0 & RADIATION_BIT)) != 0);
                    const _needAxMod = (((_coulOn || _magOn)) && (((_t0 & AXION_BIT)) != 0));
                    let localJerk = {x:0.0, y:0.0};
                    let localAF = ((_b) => ({ f0: {x:_b_allForces[_b + 0], y:_b_allForces[_b + 1], z:_b_allForces[_b + 2], w:_b_allForces[_b + 3]}, f1: {x:_b_allForces[_b + 4], y:_b_allForces[_b + 5], z:_b_allForces[_b + 6], w:_b_allForces[_b + 7]}, f2: {x:_b_allForces[_b + 8], y:_b_allForces[_b + 9], z:_b_allForces[_b + 10], w:_b_allForces[_b + 11]}, f3: {x:_b_allForces[_b + 12], y:_b_allForces[_b + 13], z:_b_allForces[_b + 14], w:_b_allForces[_b + 15]}, f4: {x:_b_allForces[_b + 16], y:_b_allForces[_b + 17], z:_b_allForces[_b + 18], w:_b_allForces[_b + 19]}, f5: {x:_b_allForces[_b + 20], y:_b_allForces[_b + 21], z:_b_allForces[_b + 22], w:_b_allForces[_b + 23]}, torques: {x:_b_allForces[_b + 24], y:_b_allForces[_b + 25], z:_b_allForces[_b + 26], w:_b_allForces[_b + 27]}, bFields: {x:_b_allForces[_b + 28], y:_b_allForces[_b + 29], z:_b_allForces[_b + 30], w:_b_allForces[_b + 31]}, bFieldGrads: {x:_b_allForces[_b + 32], y:_b_allForces[_b + 33], z:_b_allForces[_b + 34], w:_b_allForces[_b + 35]}, totalForce: {x:_b_allForces[_b + 36], y:_b_allForces[_b + 37]}, jerk: {x:_b_allForces[_b + 38], y:_b_allForces[_b + 39]} }))(((pIdx) * 40));
                    const isPeriodic = (_u_uniforms_boundaryMode == BOUND_LOOP);
                    const hasSignalDelay = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                    const sdTime = (_u_uniforms_simTime - _u_uniforms_dt);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let stackTop = 0;
                    stack[0] = 0;
                    stackTop = 1;
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
                        let comDisp_x = (comX - px);
                        let comDisp_y = (comY - py);
                        if (isPeriodic) {
                            const _sroa_10 = fullMinImageP(px, py, comX, comY, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode);
                            comDisp_x = _sroa_10.x;
                            comDisp_y = _sroa_10.y;
                        }
                        const dx = comDisp_x;
                        const dy = comDisp_y;
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
                            const _sroa_11_base = ((sIdx) * 9);
                            const sPs_posX = _b_particleState[_sroa_11_base + 0];
                            const sPs_posY = _b_particleState[_sroa_11_base + 1];
                            const sPs_velWX = _b_particleState[_sroa_11_base + 2];
                            const sPs_velWY = _b_particleState[_sroa_11_base + 3];
                            const sPs_mass = _b_particleState[_sroa_11_base + 4];
                            const sPs_charge = _b_particleState[_sroa_11_base + 5];
                            const sPs_angW = _b_particleState[_sroa_11_base + 6];
                            const sPs_baseMass = _b_particleState[_sroa_11_base + 7];
                            const sPs_flags = _b_particleState[_sroa_11_base + 8];
                            const _sroa_12_base = ((sIdx) * 5);
                            const sAux_radius = _b_particleAux[_sroa_12_base + 0];
                            const sAux_particleId = _b_particleAux[_sroa_12_base + 1];
                            const sAux_deathTime = _b_particleAux[_sroa_12_base + 2];
                            const sAux_deathMass = _b_particleAux[_sroa_12_base + 3];
                            const sAux_deathAngVel = _b_particleAux[_sroa_12_base + 4];
                            const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                            let origIdx = sIdx;
                            if ((isGhost && (sIdx >= _u_uniforms_aliveCount))) {
                                origIdx = _b_ghostOriginalIdx[(sIdx - _u_uniforms_aliveCount)];
                            }
                            if ((origIdx == pIdx)) {
                                continue;
                            }
                            if ((sIdx == pIdx)) {
                                continue;
                            }
                            const sIsRetired = ((((sPs_flags & FLAG_RETIRED)) != 0) && (((sPs_flags & FLAG_ALIVE)) == 0));
                            if (((((sPs_flags & FLAG_ALIVE)) == 0) && (!sIsRetired))) {
                                continue;
                            }
                            if (sIsRetired) {
                                const _sroa_13 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, true);
                                const delayed_x = _sroa_13.x;
                                const delayed_y = _sroa_13.y;
                                const delayed_vx = _sroa_13.vx;
                                const delayed_vy = _sroa_13.vy;
                                const delayed_angw = _sroa_13.angw;
                                const delayed_valid = _sroa_13.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const _sroa_14_base = ((sIdx) * 5);
                                const sAuxR_radius = _b_particleAux[_sroa_14_base + 0];
                                const sAuxR_particleId = _b_particleAux[_sroa_14_base + 1];
                                const sAuxR_deathTime = _b_particleAux[_sroa_14_base + 2];
                                const sAuxR_deathMass = _b_particleAux[_sroa_14_base + 3];
                                const sAuxR_deathAngVel = _b_particleAux[_sroa_14_base + 4];
                                const deadMass = sAuxR_deathMass;
                                const deadCharge = sPs_charge;
                                const bodyRadSq = Math.pow(deadMass, 0.6666666666666666);
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * deadCharge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * deadMass) * sAngVelRet) * bodyRadSq);
                                const _sroa_15_base = ((sIdx) * 4 + 0);
                                const deadAxYuk_x = _b_axYukMod_in[_sroa_15_base + 0];
                                const deadAxYuk_y = _b_axYukMod_in[_sroa_15_base + 1];
                                const deadAxYuk_z = _b_axYukMod_in[_sroa_15_base + 2];
                                const deadAxYuk_w = _b_axYukMod_in[_sroa_15_base + 3];
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, deadMass, deadCharge, sAngVelRet, sMagMomRet, sAngMomRet, ((Math.abs(deadAxYuk_x) < EPSILON) ? 1.0 : deadAxYuk_x), ((Math.abs(deadAxYuk_y) < EPSILON) ? 1.0 : deadAxYuk_y), ((Math.abs(deadAxYuk_z) < EPSILON) ? 1.0 : deadAxYuk_z), pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                continue;
                            }
                            const _sroa_16_base = ((sIdx) * 4 + 0);
                            const sAYM_x = _b_axYukMod_in[_sroa_16_base + 0];
                            const sAYM_y = _b_axYukMod_in[_sroa_16_base + 1];
                            const sAYM_z = _b_axYukMod_in[_sroa_16_base + 2];
                            const sAYM_w = _b_axYukMod_in[_sroa_16_base + 3];
                            if ((hasSignalDelay && (!isGhost))) {
                                const _sroa_17 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                const delayed_x = _sroa_17.x;
                                const delayed_y = _sroa_17.y;
                                const delayed_vx = _sroa_17.vx;
                                const delayed_vy = _sroa_17.vy;
                                const delayed_angw = _sroa_17.angw;
                                const delayed_valid = _sroa_17.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            } else if ((hasSignalDelay && isGhost)) {
                                const _sroa_18_base = ((origIdx) * 9);
                                const origPs_posX = _b_particleState[_sroa_18_base + 0];
                                const origPs_posY = _b_particleState[_sroa_18_base + 1];
                                const origPs_velWX = _b_particleState[_sroa_18_base + 2];
                                const origPs_velWY = _b_particleState[_sroa_18_base + 3];
                                const origPs_mass = _b_particleState[_sroa_18_base + 4];
                                const origPs_charge = _b_particleState[_sroa_18_base + 5];
                                const origPs_angW = _b_particleState[_sroa_18_base + 6];
                                const origPs_baseMass = _b_particleState[_sroa_18_base + 7];
                                const origPs_flags = _b_particleState[_sroa_18_base + 8];
                                const _sroa_19 = getDelayedStateGPU(origIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                const delayed_x = _sroa_19.x;
                                const delayed_y = _sroa_19.y;
                                const delayed_vx = _sroa_19.vx;
                                const delayed_vy = _sroa_19.vy;
                                const delayed_angw = _sroa_19.angw;
                                const delayed_valid = _sroa_19.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const shiftX = (sPs_posX - origPs_posX);
                                const shiftY = (sPs_posY - origPs_posY);
                                const gsx = (delayed_x + shiftX);
                                const gsy = (delayed_y + shiftY);
                                const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, gsx, gsy, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            } else {
                                const _sroa_20_base = ((sIdx) * 8);
                                const sDerived_magMoment = _b_derived_in[_sroa_20_base + 0];
                                const sDerived_angMomentum = _b_derived_in[_sroa_20_base + 1];
                                const sDerived_invMass = _b_derived_in[_sroa_20_base + 2];
                                const sDerived_radiusSq = _b_derived_in[_sroa_20_base + 3];
                                const sDerived_velX = _b_derived_in[_sroa_20_base + 4];
                                const sDerived_velY = _b_derived_in[_sroa_20_base + 5];
                                const sDerived_angVel = _b_derived_in[_sroa_20_base + 6];
                                const sDerived_bodyRSq = _b_derived_in[_sroa_20_base + 7];
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, sPs_posX, sPs_posY, sDerived_velX, sDerived_velY, sPs_mass, sPs_charge, sDerived_angVel, sDerived_magMoment, sDerived_angMomentum, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            }
                        } else if (((!isLeaf) && (((size * size) < (thetaSq * dSq))))) {
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
                            let _inl_34_result;
                            _inl_34: {
                                let _inl_34__inl_9_result;
                                _inl_34__inl_9: {
                                    _inl_34__inl_9_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_34__inl_9;
                                }
                                _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_9_result + 8)]);
                                break _inl_34;
                            }
                            let _inl_35_result;
                            _inl_35: {
                                let _inl_35__inl_10_result;
                                _inl_35__inl_10: {
                                    _inl_35__inl_10_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_35__inl_10;
                                }
                                _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_10_result + 9)]);
                                break _inl_35;
                            }
                            accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 0.0, _inl_34_result, _inl_35_result, 1.0, 1.0, 1.0, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                        } else if ((!isLeaf)) {
                            if (((stackTop + 4) <= MAX_STACK)) {
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_13_result;
                                    _inl_36__inl_13: {
                                        _inl_36__inl_13_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_37__inl_14_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_38__inl_15_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_39__inl_16_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_39__inl_16;
                                    }
                                    _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                    break _inl_39;
                                }
                                const se = _inl_39_result;
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
                    {
                        const _wlv = localAF.totalForce;
                        const _wt0 = ((localAF.totalForce.x != localAF.totalForce.x) ? 0.0 : localAF.totalForce.x);
                        const _wt1 = ((localAF.totalForce.y != localAF.totalForce.y) ? 0.0 : localAF.totalForce.y);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                    }
                    {
                        const _wlv = localAF.jerk;
                        const _wt0 = ((localJerk.x != localJerk.x) ? 0.0 : localJerk.x);
                        const _wt1 = ((localJerk.y != localJerk.y) ? 0.0 : localJerk.y);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                    }
                    {
                        const _wlv = localAF.bFields;
                        const _wt0 = ((localAF.bFields.x != localAF.bFields.x) ? 0.0 : localAF.bFields.x);
                        const _wt1 = ((localAF.bFields.y != localAF.bFields.y) ? 0.0 : localAF.bFields.y);
                        const _wt2 = localAF.bFields.z;
                        const _wt3 = localAF.bFields.w;
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                        _wlv.z = _wt2;
                        _wlv.w = _wt3;
                    }
                    {
                        const _wlv = localAF.bFieldGrads;
                        const _wt0 = ((localAF.bFieldGrads.x != localAF.bFieldGrads.x) ? 0.0 : localAF.bFieldGrads.x);
                        const _wt1 = ((localAF.bFieldGrads.y != localAF.bFieldGrads.y) ? 0.0 : localAF.bFieldGrads.y);
                        const _wt2 = ((localAF.bFieldGrads.z != localAF.bFieldGrads.z) ? 0.0 : localAF.bFieldGrads.z);
                        const _wt3 = ((localAF.bFieldGrads.w != localAF.bFieldGrads.w) ? 0.0 : localAF.bFieldGrads.w);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                        _wlv.z = _wt2;
                        _wlv.w = _wt3;
                    }
                    {
                        const _wbase = ((pIdx) * 40);
                        const _stmp = localAF;
                        _b_allForces[_wbase + 0] = _stmp.f0.x;
                        _b_allForces[_wbase + 1] = _stmp.f0.y;
                        _b_allForces[_wbase + 2] = _stmp.f0.z;
                        _b_allForces[_wbase + 3] = _stmp.f0.w;
                        _b_allForces[_wbase + 4] = _stmp.f1.x;
                        _b_allForces[_wbase + 5] = _stmp.f1.y;
                        _b_allForces[_wbase + 6] = _stmp.f1.z;
                        _b_allForces[_wbase + 7] = _stmp.f1.w;
                        _b_allForces[_wbase + 8] = _stmp.f2.x;
                        _b_allForces[_wbase + 9] = _stmp.f2.y;
                        _b_allForces[_wbase + 10] = _stmp.f2.z;
                        _b_allForces[_wbase + 11] = _stmp.f2.w;
                        _b_allForces[_wbase + 12] = _stmp.f3.x;
                        _b_allForces[_wbase + 13] = _stmp.f3.y;
                        _b_allForces[_wbase + 14] = _stmp.f3.z;
                        _b_allForces[_wbase + 15] = _stmp.f3.w;
                        _b_allForces[_wbase + 16] = _stmp.f4.x;
                        _b_allForces[_wbase + 17] = _stmp.f4.y;
                        _b_allForces[_wbase + 18] = _stmp.f4.z;
                        _b_allForces[_wbase + 19] = _stmp.f4.w;
                        _b_allForces[_wbase + 20] = _stmp.f5.x;
                        _b_allForces[_wbase + 21] = _stmp.f5.y;
                        _b_allForces[_wbase + 22] = _stmp.f5.z;
                        _b_allForces[_wbase + 23] = _stmp.f5.w;
                        _b_allForces[_wbase + 24] = _stmp.torques.x;
                        _b_allForces[_wbase + 25] = _stmp.torques.y;
                        _b_allForces[_wbase + 26] = _stmp.torques.z;
                        _b_allForces[_wbase + 27] = _stmp.torques.w;
                        _b_allForces[_wbase + 28] = _stmp.bFields.x;
                        _b_allForces[_wbase + 29] = _stmp.bFields.y;
                        _b_allForces[_wbase + 30] = _stmp.bFields.z;
                        _b_allForces[_wbase + 31] = _stmp.bFields.w;
                        _b_allForces[_wbase + 32] = _stmp.bFieldGrads.x;
                        _b_allForces[_wbase + 33] = _stmp.bFieldGrads.y;
                        _b_allForces[_wbase + 34] = _stmp.bFieldGrads.z;
                        _b_allForces[_wbase + 35] = _stmp.bFieldGrads.w;
                        _b_allForces[_wbase + 36] = _stmp.totalForce.x;
                        _b_allForces[_wbase + 37] = _stmp.totalForce.y;
                        _b_allForces[_wbase + 38] = _stmp.jerk.x;
                        _b_allForces[_wbase + 39] = _stmp.jerk.y;
                    }
                    const totalFSq = ((localAF.totalForce.x * localAF.totalForce.x) + (localAF.totalForce.y * localAF.totalForce.y));
                    const accelSq = ((totalFSq * pInvMass) * pInvMass);
                    if (((accelSq == accelSq) && (accelSq < 1e20))) {
                        const accelBits = rt.bitcast_u32_f32(Math.sqrt(accelSq));
                        (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_maxAccel, 0, accelBits));
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const pIdx = gid_x;
                            if ((pIdx >= _u_uniforms_aliveCount)) {
                                break __invocation;
                            }
                            const _sroa_21_base = ((pIdx) * 9);
                            const ps_posX = _b_particleState[_sroa_21_base + 0];
                            const ps_posY = _b_particleState[_sroa_21_base + 1];
                            const ps_velWX = _b_particleState[_sroa_21_base + 2];
                            const ps_velWY = _b_particleState[_sroa_21_base + 3];
                            const ps_mass = _b_particleState[_sroa_21_base + 4];
                            const ps_charge = _b_particleState[_sroa_21_base + 5];
                            const ps_angW = _b_particleState[_sroa_21_base + 6];
                            const ps_baseMass = _b_particleState[_sroa_21_base + 7];
                            const ps_flags = _b_particleState[_sroa_21_base + 8];
                            if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            if ((((ps_flags & FLAG_GHOST)) != 0)) {
                                break __invocation;
                            }
                            const px = ps_posX;
                            const py = ps_posY;
                            const pMass = ps_mass;
                            const pCharge = ps_charge;
                            const _sroa_22_base = ((pIdx) * 8);
                            const pDerived_magMoment = _b_derived_in[_sroa_22_base + 0];
                            const pDerived_angMomentum = _b_derived_in[_sroa_22_base + 1];
                            const pDerived_invMass = _b_derived_in[_sroa_22_base + 2];
                            const pDerived_radiusSq = _b_derived_in[_sroa_22_base + 3];
                            const pDerived_velX = _b_derived_in[_sroa_22_base + 4];
                            const pDerived_velY = _b_derived_in[_sroa_22_base + 5];
                            const pDerived_angVel = _b_derived_in[_sroa_22_base + 6];
                            const pDerived_bodyRSq = _b_derived_in[_sroa_22_base + 7];
                            const pMagMoment = pDerived_magMoment;
                            const pAngMomentum = pDerived_angMomentum;
                            const _sroa_23_base = ((pIdx) * 5);
                            const pAux_radius = _b_particleAux[_sroa_23_base + 0];
                            const pAux_particleId = _b_particleAux[_sroa_23_base + 1];
                            const pAux_deathTime = _b_particleAux[_sroa_23_base + 2];
                            const pAux_deathMass = _b_particleAux[_sroa_23_base + 3];
                            const pAux_deathAngVel = _b_particleAux[_sroa_23_base + 4];
                            const pBodyRadiusSq = pDerived_bodyRSq;
                            const pBodyRadius = Math.sqrt(pBodyRadiusSq);
                            const pRi5 = ((pBodyRadiusSq * pBodyRadiusSq) * pBodyRadius);
                            const pAngW = ps_angW;
                            const _sroa_24_base = ((pIdx) * 4 + 0);
                            const pAym_x = _b_axYukMod_in[_sroa_24_base + 0];
                            const pAym_y = _b_axYukMod_in[_sroa_24_base + 1];
                            const pAym_z = _b_axYukMod_in[_sroa_24_base + 2];
                            const pAym_w = _b_axYukMod_in[_sroa_24_base + 3];
                            const pAxMod = pAym_x;
                            const pYukMod = pAym_y;
                            const pHiggsMod = pAym_z;
                            const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                            const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                            const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                            const pVelX = (ps_velWX * invGamma);
                            const pVelY = (ps_velWY * invGamma);
                            const pAngVel = (relOn ? (pAngW / Math.sqrt((1.0 + ((pAngW * pAngW) * pBodyRadiusSq)))) : pAngW);
                            const pInvMass = pDerived_invMass;
                            const thetaSq = (_u_uniforms_bhTheta * _u_uniforms_bhTheta);
                            const pid = pAux_particleId;
                            const _t0 = _u_uniforms_toggles0;
                            const _gravOn = (((_t0 & GRAVITY_BIT)) != 0);
                            const _coulOn = (((_t0 & COULOMB_BIT)) != 0);
                            const _magOn = (((_t0 & MAGNETIC_BIT)) != 0);
                            const _gmOn = (((_t0 & GRAVITOMAG_BIT)) != 0);
                            const _yukOn = (((_t0 & YUKAWA_BIT)) != 0);
                            const _onePNOn = (((_t0 & ONE_PN_BIT)) != 0);
                            const _higgsOn = (((_t0 & HIGGS_BIT)) != 0);
                            const _radOn = (((_t0 & RADIATION_BIT)) != 0);
                            const _needAxMod = (((_coulOn || _magOn)) && (((_t0 & AXION_BIT)) != 0));
                            let localJerk = {x:0.0, y:0.0};
                            let localAF = ((_b) => ({ f0: {x:_b_allForces[_b + 0], y:_b_allForces[_b + 1], z:_b_allForces[_b + 2], w:_b_allForces[_b + 3]}, f1: {x:_b_allForces[_b + 4], y:_b_allForces[_b + 5], z:_b_allForces[_b + 6], w:_b_allForces[_b + 7]}, f2: {x:_b_allForces[_b + 8], y:_b_allForces[_b + 9], z:_b_allForces[_b + 10], w:_b_allForces[_b + 11]}, f3: {x:_b_allForces[_b + 12], y:_b_allForces[_b + 13], z:_b_allForces[_b + 14], w:_b_allForces[_b + 15]}, f4: {x:_b_allForces[_b + 16], y:_b_allForces[_b + 17], z:_b_allForces[_b + 18], w:_b_allForces[_b + 19]}, f5: {x:_b_allForces[_b + 20], y:_b_allForces[_b + 21], z:_b_allForces[_b + 22], w:_b_allForces[_b + 23]}, torques: {x:_b_allForces[_b + 24], y:_b_allForces[_b + 25], z:_b_allForces[_b + 26], w:_b_allForces[_b + 27]}, bFields: {x:_b_allForces[_b + 28], y:_b_allForces[_b + 29], z:_b_allForces[_b + 30], w:_b_allForces[_b + 31]}, bFieldGrads: {x:_b_allForces[_b + 32], y:_b_allForces[_b + 33], z:_b_allForces[_b + 34], w:_b_allForces[_b + 35]}, totalForce: {x:_b_allForces[_b + 36], y:_b_allForces[_b + 37]}, jerk: {x:_b_allForces[_b + 38], y:_b_allForces[_b + 39]} }))(((pIdx) * 40));
                            const isPeriodic = (_u_uniforms_boundaryMode == BOUND_LOOP);
                            const hasSignalDelay = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                            const sdTime = (_u_uniforms_simTime - _u_uniforms_dt);
                            let stack = Array.from({ length: 48 }, () => 0);
                            let stackTop = 0;
                            stack[0] = 0;
                            stackTop = 1;
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
                                let comDisp_x = (comX - px);
                                let comDisp_y = (comY - py);
                                if (isPeriodic) {
                                    const _sroa_25 = fullMinImageP(px, py, comX, comY, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode);
                                    comDisp_x = _sroa_25.x;
                                    comDisp_y = _sroa_25.y;
                                }
                                const dx = comDisp_x;
                                const dy = comDisp_y;
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
                                    const _sroa_26_base = ((sIdx) * 9);
                                    const sPs_posX = _b_particleState[_sroa_26_base + 0];
                                    const sPs_posY = _b_particleState[_sroa_26_base + 1];
                                    const sPs_velWX = _b_particleState[_sroa_26_base + 2];
                                    const sPs_velWY = _b_particleState[_sroa_26_base + 3];
                                    const sPs_mass = _b_particleState[_sroa_26_base + 4];
                                    const sPs_charge = _b_particleState[_sroa_26_base + 5];
                                    const sPs_angW = _b_particleState[_sroa_26_base + 6];
                                    const sPs_baseMass = _b_particleState[_sroa_26_base + 7];
                                    const sPs_flags = _b_particleState[_sroa_26_base + 8];
                                    const _sroa_27_base = ((sIdx) * 5);
                                    const sAux_radius = _b_particleAux[_sroa_27_base + 0];
                                    const sAux_particleId = _b_particleAux[_sroa_27_base + 1];
                                    const sAux_deathTime = _b_particleAux[_sroa_27_base + 2];
                                    const sAux_deathMass = _b_particleAux[_sroa_27_base + 3];
                                    const sAux_deathAngVel = _b_particleAux[_sroa_27_base + 4];
                                    const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                                    let origIdx = sIdx;
                                    if ((isGhost && (sIdx >= _u_uniforms_aliveCount))) {
                                        origIdx = _b_ghostOriginalIdx[(sIdx - _u_uniforms_aliveCount)];
                                    }
                                    if ((origIdx == pIdx)) {
                                        continue;
                                    }
                                    if ((sIdx == pIdx)) {
                                        continue;
                                    }
                                    const sIsRetired = ((((sPs_flags & FLAG_RETIRED)) != 0) && (((sPs_flags & FLAG_ALIVE)) == 0));
                                    if (((((sPs_flags & FLAG_ALIVE)) == 0) && (!sIsRetired))) {
                                        continue;
                                    }
                                    if (sIsRetired) {
                                        const _sroa_28 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, true);
                                        const delayed_x = _sroa_28.x;
                                        const delayed_y = _sroa_28.y;
                                        const delayed_vx = _sroa_28.vx;
                                        const delayed_vy = _sroa_28.vy;
                                        const delayed_angw = _sroa_28.angw;
                                        const delayed_valid = _sroa_28.valid;
                                        if ((!delayed_valid)) {
                                            continue;
                                        }
                                        const _sroa_29_base = ((sIdx) * 5);
                                        const sAuxR_radius = _b_particleAux[_sroa_29_base + 0];
                                        const sAuxR_particleId = _b_particleAux[_sroa_29_base + 1];
                                        const sAuxR_deathTime = _b_particleAux[_sroa_29_base + 2];
                                        const sAuxR_deathMass = _b_particleAux[_sroa_29_base + 3];
                                        const sAuxR_deathAngVel = _b_particleAux[_sroa_29_base + 4];
                                        const deadMass = sAuxR_deathMass;
                                        const deadCharge = sPs_charge;
                                        const bodyRadSq = Math.pow(deadMass, 0.6666666666666666);
                                        const retAngwSq = (delayed_angw * delayed_angw);
                                        const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                        const sMagMomRet = (((MAG_MOMENT_K * deadCharge) * sAngVelRet) * bodyRadSq);
                                        const sAngMomRet = (((INERTIA_K * deadMass) * sAngVelRet) * bodyRadSq);
                                        const _sroa_30_base = ((sIdx) * 4 + 0);
                                        const deadAxYuk_x = _b_axYukMod_in[_sroa_30_base + 0];
                                        const deadAxYuk_y = _b_axYukMod_in[_sroa_30_base + 1];
                                        const deadAxYuk_z = _b_axYukMod_in[_sroa_30_base + 2];
                                        const deadAxYuk_w = _b_axYukMod_in[_sroa_30_base + 3];
                                        accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, deadMass, deadCharge, sAngVelRet, sMagMomRet, sAngMomRet, ((Math.abs(deadAxYuk_x) < EPSILON) ? 1.0 : deadAxYuk_x), ((Math.abs(deadAxYuk_y) < EPSILON) ? 1.0 : deadAxYuk_y), ((Math.abs(deadAxYuk_z) < EPSILON) ? 1.0 : deadAxYuk_z), pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                        continue;
                                    }
                                    const _sroa_31_base = ((sIdx) * 4 + 0);
                                    const sAYM_x = _b_axYukMod_in[_sroa_31_base + 0];
                                    const sAYM_y = _b_axYukMod_in[_sroa_31_base + 1];
                                    const sAYM_z = _b_axYukMod_in[_sroa_31_base + 2];
                                    const sAYM_w = _b_axYukMod_in[_sroa_31_base + 3];
                                    if ((hasSignalDelay && (!isGhost))) {
                                        const _sroa_32 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                        const delayed_x = _sroa_32.x;
                                        const delayed_y = _sroa_32.y;
                                        const delayed_vx = _sroa_32.vx;
                                        const delayed_vy = _sroa_32.vy;
                                        const delayed_angw = _sroa_32.angw;
                                        const delayed_valid = _sroa_32.valid;
                                        if ((!delayed_valid)) {
                                            continue;
                                        }
                                        const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                        const retAngwSq = (delayed_angw * delayed_angw);
                                        const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                        const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                        const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                        accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                    } else if ((hasSignalDelay && isGhost)) {
                                        const _sroa_33_base = ((origIdx) * 9);
                                        const origPs_posX = _b_particleState[_sroa_33_base + 0];
                                        const origPs_posY = _b_particleState[_sroa_33_base + 1];
                                        const origPs_velWX = _b_particleState[_sroa_33_base + 2];
                                        const origPs_velWY = _b_particleState[_sroa_33_base + 3];
                                        const origPs_mass = _b_particleState[_sroa_33_base + 4];
                                        const origPs_charge = _b_particleState[_sroa_33_base + 5];
                                        const origPs_angW = _b_particleState[_sroa_33_base + 6];
                                        const origPs_baseMass = _b_particleState[_sroa_33_base + 7];
                                        const origPs_flags = _b_particleState[_sroa_33_base + 8];
                                        const _sroa_34 = getDelayedStateGPU(origIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                        const delayed_x = _sroa_34.x;
                                        const delayed_y = _sroa_34.y;
                                        const delayed_vx = _sroa_34.vx;
                                        const delayed_vy = _sroa_34.vy;
                                        const delayed_angw = _sroa_34.angw;
                                        const delayed_valid = _sroa_34.valid;
                                        if ((!delayed_valid)) {
                                            continue;
                                        }
                                        const shiftX = (sPs_posX - origPs_posX);
                                        const shiftY = (sPs_posY - origPs_posY);
                                        const gsx = (delayed_x + shiftX);
                                        const gsy = (delayed_y + shiftY);
                                        const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                        const retAngwSq = (delayed_angw * delayed_angw);
                                        const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                        const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                        const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                        accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, gsx, gsy, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                    } else {
                                        const _sroa_35_base = ((sIdx) * 8);
                                        const sDerived_magMoment = _b_derived_in[_sroa_35_base + 0];
                                        const sDerived_angMomentum = _b_derived_in[_sroa_35_base + 1];
                                        const sDerived_invMass = _b_derived_in[_sroa_35_base + 2];
                                        const sDerived_radiusSq = _b_derived_in[_sroa_35_base + 3];
                                        const sDerived_velX = _b_derived_in[_sroa_35_base + 4];
                                        const sDerived_velY = _b_derived_in[_sroa_35_base + 5];
                                        const sDerived_angVel = _b_derived_in[_sroa_35_base + 6];
                                        const sDerived_bodyRSq = _b_derived_in[_sroa_35_base + 7];
                                        accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, sPs_posX, sPs_posY, sDerived_velX, sDerived_velY, sPs_mass, sPs_charge, sDerived_angVel, sDerived_magMoment, sDerived_angMomentum, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                    }
                                } else if (((!isLeaf) && (((size * size) < (thetaSq * dSq))))) {
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
                                    let _inl_34_result;
                                    _inl_34: {
                                        let _inl_34__inl_9_result;
                                        _inl_34__inl_9: {
                                            _inl_34__inl_9_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_34__inl_9;
                                        }
                                        _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_9_result + 8)]);
                                        break _inl_34;
                                    }
                                    let _inl_35_result;
                                    _inl_35: {
                                        let _inl_35__inl_10_result;
                                        _inl_35__inl_10: {
                                            _inl_35__inl_10_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_35__inl_10;
                                        }
                                        _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_10_result + 9)]);
                                        break _inl_35;
                                    }
                                    accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 0.0, _inl_34_result, _inl_35_result, 1.0, 1.0, 1.0, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                } else if ((!isLeaf)) {
                                    if (((stackTop + 4) <= MAX_STACK)) {
                                        let _inl_36_result;
                                        _inl_36: {
                                            let _inl_36__inl_13_result;
                                            _inl_36__inl_13: {
                                                _inl_36__inl_13_result = (nodeIdx * NODE_STRIDE);
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
                                                _inl_37__inl_14_result = (nodeIdx * NODE_STRIDE);
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
                                                _inl_38__inl_15_result = (nodeIdx * NODE_STRIDE);
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
                                                _inl_39__inl_16_result = (nodeIdx * NODE_STRIDE);
                                                break _inl_39__inl_16;
                                            }
                                            _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                            break _inl_39;
                                        }
                                        const se = _inl_39_result;
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
                            {
                                const _wlv = localAF.totalForce;
                                const _wt0 = ((localAF.totalForce.x != localAF.totalForce.x) ? 0.0 : localAF.totalForce.x);
                                const _wt1 = ((localAF.totalForce.y != localAF.totalForce.y) ? 0.0 : localAF.totalForce.y);
                                _wlv.x = _wt0;
                                _wlv.y = _wt1;
                            }
                            {
                                const _wlv = localAF.jerk;
                                const _wt0 = ((localJerk.x != localJerk.x) ? 0.0 : localJerk.x);
                                const _wt1 = ((localJerk.y != localJerk.y) ? 0.0 : localJerk.y);
                                _wlv.x = _wt0;
                                _wlv.y = _wt1;
                            }
                            {
                                const _wlv = localAF.bFields;
                                const _wt0 = ((localAF.bFields.x != localAF.bFields.x) ? 0.0 : localAF.bFields.x);
                                const _wt1 = ((localAF.bFields.y != localAF.bFields.y) ? 0.0 : localAF.bFields.y);
                                const _wt2 = localAF.bFields.z;
                                const _wt3 = localAF.bFields.w;
                                _wlv.x = _wt0;
                                _wlv.y = _wt1;
                                _wlv.z = _wt2;
                                _wlv.w = _wt3;
                            }
                            {
                                const _wlv = localAF.bFieldGrads;
                                const _wt0 = ((localAF.bFieldGrads.x != localAF.bFieldGrads.x) ? 0.0 : localAF.bFieldGrads.x);
                                const _wt1 = ((localAF.bFieldGrads.y != localAF.bFieldGrads.y) ? 0.0 : localAF.bFieldGrads.y);
                                const _wt2 = ((localAF.bFieldGrads.z != localAF.bFieldGrads.z) ? 0.0 : localAF.bFieldGrads.z);
                                const _wt3 = ((localAF.bFieldGrads.w != localAF.bFieldGrads.w) ? 0.0 : localAF.bFieldGrads.w);
                                _wlv.x = _wt0;
                                _wlv.y = _wt1;
                                _wlv.z = _wt2;
                                _wlv.w = _wt3;
                            }
                            {
                                const _wbase = ((pIdx) * 40);
                                const _stmp = localAF;
                                _b_allForces[_wbase + 0] = _stmp.f0.x;
                                _b_allForces[_wbase + 1] = _stmp.f0.y;
                                _b_allForces[_wbase + 2] = _stmp.f0.z;
                                _b_allForces[_wbase + 3] = _stmp.f0.w;
                                _b_allForces[_wbase + 4] = _stmp.f1.x;
                                _b_allForces[_wbase + 5] = _stmp.f1.y;
                                _b_allForces[_wbase + 6] = _stmp.f1.z;
                                _b_allForces[_wbase + 7] = _stmp.f1.w;
                                _b_allForces[_wbase + 8] = _stmp.f2.x;
                                _b_allForces[_wbase + 9] = _stmp.f2.y;
                                _b_allForces[_wbase + 10] = _stmp.f2.z;
                                _b_allForces[_wbase + 11] = _stmp.f2.w;
                                _b_allForces[_wbase + 12] = _stmp.f3.x;
                                _b_allForces[_wbase + 13] = _stmp.f3.y;
                                _b_allForces[_wbase + 14] = _stmp.f3.z;
                                _b_allForces[_wbase + 15] = _stmp.f3.w;
                                _b_allForces[_wbase + 16] = _stmp.f4.x;
                                _b_allForces[_wbase + 17] = _stmp.f4.y;
                                _b_allForces[_wbase + 18] = _stmp.f4.z;
                                _b_allForces[_wbase + 19] = _stmp.f4.w;
                                _b_allForces[_wbase + 20] = _stmp.f5.x;
                                _b_allForces[_wbase + 21] = _stmp.f5.y;
                                _b_allForces[_wbase + 22] = _stmp.f5.z;
                                _b_allForces[_wbase + 23] = _stmp.f5.w;
                                _b_allForces[_wbase + 24] = _stmp.torques.x;
                                _b_allForces[_wbase + 25] = _stmp.torques.y;
                                _b_allForces[_wbase + 26] = _stmp.torques.z;
                                _b_allForces[_wbase + 27] = _stmp.torques.w;
                                _b_allForces[_wbase + 28] = _stmp.bFields.x;
                                _b_allForces[_wbase + 29] = _stmp.bFields.y;
                                _b_allForces[_wbase + 30] = _stmp.bFields.z;
                                _b_allForces[_wbase + 31] = _stmp.bFields.w;
                                _b_allForces[_wbase + 32] = _stmp.bFieldGrads.x;
                                _b_allForces[_wbase + 33] = _stmp.bFieldGrads.y;
                                _b_allForces[_wbase + 34] = _stmp.bFieldGrads.z;
                                _b_allForces[_wbase + 35] = _stmp.bFieldGrads.w;
                                _b_allForces[_wbase + 36] = _stmp.totalForce.x;
                                _b_allForces[_wbase + 37] = _stmp.totalForce.y;
                                _b_allForces[_wbase + 38] = _stmp.jerk.x;
                                _b_allForces[_wbase + 39] = _stmp.jerk.y;
                            }
                            const totalFSq = ((localAF.totalForce.x * localAF.totalForce.x) + (localAF.totalForce.y * localAF.totalForce.y));
                            const accelSq = ((totalFSq * pInvMass) * pInvMass);
                            if (((accelSq == accelSq) && (accelSq < 1e20))) {
                                const accelBits = rt.bitcast_u32_f32(Math.sqrt(accelSq));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_maxAccel, 0, accelBits));
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const pIdx = gid_x;
                        if ((pIdx >= _u_uniforms_aliveCount)) {
                            break __invocation;
                        }
                        const _sroa_36_base = ((pIdx) * 9);
                        const ps_posX = _b_particleState[_sroa_36_base + 0];
                        const ps_posY = _b_particleState[_sroa_36_base + 1];
                        const ps_velWX = _b_particleState[_sroa_36_base + 2];
                        const ps_velWY = _b_particleState[_sroa_36_base + 3];
                        const ps_mass = _b_particleState[_sroa_36_base + 4];
                        const ps_charge = _b_particleState[_sroa_36_base + 5];
                        const ps_angW = _b_particleState[_sroa_36_base + 6];
                        const ps_baseMass = _b_particleState[_sroa_36_base + 7];
                        const ps_flags = _b_particleState[_sroa_36_base + 8];
                        if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        if ((((ps_flags & FLAG_GHOST)) != 0)) {
                            break __invocation;
                        }
                        const px = ps_posX;
                        const py = ps_posY;
                        const pMass = ps_mass;
                        const pCharge = ps_charge;
                        const _sroa_37_base = ((pIdx) * 8);
                        const pDerived_magMoment = _b_derived_in[_sroa_37_base + 0];
                        const pDerived_angMomentum = _b_derived_in[_sroa_37_base + 1];
                        const pDerived_invMass = _b_derived_in[_sroa_37_base + 2];
                        const pDerived_radiusSq = _b_derived_in[_sroa_37_base + 3];
                        const pDerived_velX = _b_derived_in[_sroa_37_base + 4];
                        const pDerived_velY = _b_derived_in[_sroa_37_base + 5];
                        const pDerived_angVel = _b_derived_in[_sroa_37_base + 6];
                        const pDerived_bodyRSq = _b_derived_in[_sroa_37_base + 7];
                        const pMagMoment = pDerived_magMoment;
                        const pAngMomentum = pDerived_angMomentum;
                        const _sroa_38_base = ((pIdx) * 5);
                        const pAux_radius = _b_particleAux[_sroa_38_base + 0];
                        const pAux_particleId = _b_particleAux[_sroa_38_base + 1];
                        const pAux_deathTime = _b_particleAux[_sroa_38_base + 2];
                        const pAux_deathMass = _b_particleAux[_sroa_38_base + 3];
                        const pAux_deathAngVel = _b_particleAux[_sroa_38_base + 4];
                        const pBodyRadiusSq = pDerived_bodyRSq;
                        const pBodyRadius = Math.sqrt(pBodyRadiusSq);
                        const pRi5 = ((pBodyRadiusSq * pBodyRadiusSq) * pBodyRadius);
                        const pAngW = ps_angW;
                        const _sroa_39_base = ((pIdx) * 4 + 0);
                        const pAym_x = _b_axYukMod_in[_sroa_39_base + 0];
                        const pAym_y = _b_axYukMod_in[_sroa_39_base + 1];
                        const pAym_z = _b_axYukMod_in[_sroa_39_base + 2];
                        const pAym_w = _b_axYukMod_in[_sroa_39_base + 3];
                        const pAxMod = pAym_x;
                        const pYukMod = pAym_y;
                        const pHiggsMod = pAym_z;
                        const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                        const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                        const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                        const pVelX = (ps_velWX * invGamma);
                        const pVelY = (ps_velWY * invGamma);
                        const pAngVel = (relOn ? (pAngW / Math.sqrt((1.0 + ((pAngW * pAngW) * pBodyRadiusSq)))) : pAngW);
                        const pInvMass = pDerived_invMass;
                        const thetaSq = (_u_uniforms_bhTheta * _u_uniforms_bhTheta);
                        const pid = pAux_particleId;
                        const _t0 = _u_uniforms_toggles0;
                        const _gravOn = (((_t0 & GRAVITY_BIT)) != 0);
                        const _coulOn = (((_t0 & COULOMB_BIT)) != 0);
                        const _magOn = (((_t0 & MAGNETIC_BIT)) != 0);
                        const _gmOn = (((_t0 & GRAVITOMAG_BIT)) != 0);
                        const _yukOn = (((_t0 & YUKAWA_BIT)) != 0);
                        const _onePNOn = (((_t0 & ONE_PN_BIT)) != 0);
                        const _higgsOn = (((_t0 & HIGGS_BIT)) != 0);
                        const _radOn = (((_t0 & RADIATION_BIT)) != 0);
                        const _needAxMod = (((_coulOn || _magOn)) && (((_t0 & AXION_BIT)) != 0));
                        let localJerk = {x:0.0, y:0.0};
                        let localAF = ((_b) => ({ f0: {x:_b_allForces[_b + 0], y:_b_allForces[_b + 1], z:_b_allForces[_b + 2], w:_b_allForces[_b + 3]}, f1: {x:_b_allForces[_b + 4], y:_b_allForces[_b + 5], z:_b_allForces[_b + 6], w:_b_allForces[_b + 7]}, f2: {x:_b_allForces[_b + 8], y:_b_allForces[_b + 9], z:_b_allForces[_b + 10], w:_b_allForces[_b + 11]}, f3: {x:_b_allForces[_b + 12], y:_b_allForces[_b + 13], z:_b_allForces[_b + 14], w:_b_allForces[_b + 15]}, f4: {x:_b_allForces[_b + 16], y:_b_allForces[_b + 17], z:_b_allForces[_b + 18], w:_b_allForces[_b + 19]}, f5: {x:_b_allForces[_b + 20], y:_b_allForces[_b + 21], z:_b_allForces[_b + 22], w:_b_allForces[_b + 23]}, torques: {x:_b_allForces[_b + 24], y:_b_allForces[_b + 25], z:_b_allForces[_b + 26], w:_b_allForces[_b + 27]}, bFields: {x:_b_allForces[_b + 28], y:_b_allForces[_b + 29], z:_b_allForces[_b + 30], w:_b_allForces[_b + 31]}, bFieldGrads: {x:_b_allForces[_b + 32], y:_b_allForces[_b + 33], z:_b_allForces[_b + 34], w:_b_allForces[_b + 35]}, totalForce: {x:_b_allForces[_b + 36], y:_b_allForces[_b + 37]}, jerk: {x:_b_allForces[_b + 38], y:_b_allForces[_b + 39]} }))(((pIdx) * 40));
                        const isPeriodic = (_u_uniforms_boundaryMode == BOUND_LOOP);
                        const hasSignalDelay = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                        const sdTime = (_u_uniforms_simTime - _u_uniforms_dt);
                        let stack = Array.from({ length: 48 }, () => 0);
                        let stackTop = 0;
                        stack[0] = 0;
                        stackTop = 1;
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
                            let comDisp_x = (comX - px);
                            let comDisp_y = (comY - py);
                            if (isPeriodic) {
                                const _sroa_40 = fullMinImageP(px, py, comX, comY, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode);
                                comDisp_x = _sroa_40.x;
                                comDisp_y = _sroa_40.y;
                            }
                            const dx = comDisp_x;
                            const dy = comDisp_y;
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
                                const _sroa_41_base = ((sIdx) * 9);
                                const sPs_posX = _b_particleState[_sroa_41_base + 0];
                                const sPs_posY = _b_particleState[_sroa_41_base + 1];
                                const sPs_velWX = _b_particleState[_sroa_41_base + 2];
                                const sPs_velWY = _b_particleState[_sroa_41_base + 3];
                                const sPs_mass = _b_particleState[_sroa_41_base + 4];
                                const sPs_charge = _b_particleState[_sroa_41_base + 5];
                                const sPs_angW = _b_particleState[_sroa_41_base + 6];
                                const sPs_baseMass = _b_particleState[_sroa_41_base + 7];
                                const sPs_flags = _b_particleState[_sroa_41_base + 8];
                                const _sroa_42_base = ((sIdx) * 5);
                                const sAux_radius = _b_particleAux[_sroa_42_base + 0];
                                const sAux_particleId = _b_particleAux[_sroa_42_base + 1];
                                const sAux_deathTime = _b_particleAux[_sroa_42_base + 2];
                                const sAux_deathMass = _b_particleAux[_sroa_42_base + 3];
                                const sAux_deathAngVel = _b_particleAux[_sroa_42_base + 4];
                                const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                                let origIdx = sIdx;
                                if ((isGhost && (sIdx >= _u_uniforms_aliveCount))) {
                                    origIdx = _b_ghostOriginalIdx[(sIdx - _u_uniforms_aliveCount)];
                                }
                                if ((origIdx == pIdx)) {
                                    continue;
                                }
                                if ((sIdx == pIdx)) {
                                    continue;
                                }
                                const sIsRetired = ((((sPs_flags & FLAG_RETIRED)) != 0) && (((sPs_flags & FLAG_ALIVE)) == 0));
                                if (((((sPs_flags & FLAG_ALIVE)) == 0) && (!sIsRetired))) {
                                    continue;
                                }
                                if (sIsRetired) {
                                    const _sroa_43 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, true);
                                    const delayed_x = _sroa_43.x;
                                    const delayed_y = _sroa_43.y;
                                    const delayed_vx = _sroa_43.vx;
                                    const delayed_vy = _sroa_43.vy;
                                    const delayed_angw = _sroa_43.angw;
                                    const delayed_valid = _sroa_43.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    const _sroa_44_base = ((sIdx) * 5);
                                    const sAuxR_radius = _b_particleAux[_sroa_44_base + 0];
                                    const sAuxR_particleId = _b_particleAux[_sroa_44_base + 1];
                                    const sAuxR_deathTime = _b_particleAux[_sroa_44_base + 2];
                                    const sAuxR_deathMass = _b_particleAux[_sroa_44_base + 3];
                                    const sAuxR_deathAngVel = _b_particleAux[_sroa_44_base + 4];
                                    const deadMass = sAuxR_deathMass;
                                    const deadCharge = sPs_charge;
                                    const bodyRadSq = Math.pow(deadMass, 0.6666666666666666);
                                    const retAngwSq = (delayed_angw * delayed_angw);
                                    const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                    const sMagMomRet = (((MAG_MOMENT_K * deadCharge) * sAngVelRet) * bodyRadSq);
                                    const sAngMomRet = (((INERTIA_K * deadMass) * sAngVelRet) * bodyRadSq);
                                    const _sroa_45_base = ((sIdx) * 4 + 0);
                                    const deadAxYuk_x = _b_axYukMod_in[_sroa_45_base + 0];
                                    const deadAxYuk_y = _b_axYukMod_in[_sroa_45_base + 1];
                                    const deadAxYuk_z = _b_axYukMod_in[_sroa_45_base + 2];
                                    const deadAxYuk_w = _b_axYukMod_in[_sroa_45_base + 3];
                                    accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, deadMass, deadCharge, sAngVelRet, sMagMomRet, sAngMomRet, ((Math.abs(deadAxYuk_x) < EPSILON) ? 1.0 : deadAxYuk_x), ((Math.abs(deadAxYuk_y) < EPSILON) ? 1.0 : deadAxYuk_y), ((Math.abs(deadAxYuk_z) < EPSILON) ? 1.0 : deadAxYuk_z), pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                    continue;
                                }
                                const _sroa_46_base = ((sIdx) * 4 + 0);
                                const sAYM_x = _b_axYukMod_in[_sroa_46_base + 0];
                                const sAYM_y = _b_axYukMod_in[_sroa_46_base + 1];
                                const sAYM_z = _b_axYukMod_in[_sroa_46_base + 2];
                                const sAYM_w = _b_axYukMod_in[_sroa_46_base + 3];
                                if ((hasSignalDelay && (!isGhost))) {
                                    const _sroa_47 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                    const delayed_x = _sroa_47.x;
                                    const delayed_y = _sroa_47.y;
                                    const delayed_vx = _sroa_47.vx;
                                    const delayed_vy = _sroa_47.vy;
                                    const delayed_angw = _sroa_47.angw;
                                    const delayed_valid = _sroa_47.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                    const retAngwSq = (delayed_angw * delayed_angw);
                                    const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                    const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                    const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                    accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                } else if ((hasSignalDelay && isGhost)) {
                                    const _sroa_48_base = ((origIdx) * 9);
                                    const origPs_posX = _b_particleState[_sroa_48_base + 0];
                                    const origPs_posY = _b_particleState[_sroa_48_base + 1];
                                    const origPs_velWX = _b_particleState[_sroa_48_base + 2];
                                    const origPs_velWY = _b_particleState[_sroa_48_base + 3];
                                    const origPs_mass = _b_particleState[_sroa_48_base + 4];
                                    const origPs_charge = _b_particleState[_sroa_48_base + 5];
                                    const origPs_angW = _b_particleState[_sroa_48_base + 6];
                                    const origPs_baseMass = _b_particleState[_sroa_48_base + 7];
                                    const origPs_flags = _b_particleState[_sroa_48_base + 8];
                                    const _sroa_49 = getDelayedStateGPU(origIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                    const delayed_x = _sroa_49.x;
                                    const delayed_y = _sroa_49.y;
                                    const delayed_vx = _sroa_49.vx;
                                    const delayed_vy = _sroa_49.vy;
                                    const delayed_angw = _sroa_49.angw;
                                    const delayed_valid = _sroa_49.valid;
                                    if ((!delayed_valid)) {
                                        continue;
                                    }
                                    const shiftX = (sPs_posX - origPs_posX);
                                    const shiftY = (sPs_posY - origPs_posY);
                                    const gsx = (delayed_x + shiftX);
                                    const gsy = (delayed_y + shiftY);
                                    const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                    const retAngwSq = (delayed_angw * delayed_angw);
                                    const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                    const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                    const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                    accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, gsx, gsy, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                } else {
                                    const _sroa_50_base = ((sIdx) * 8);
                                    const sDerived_magMoment = _b_derived_in[_sroa_50_base + 0];
                                    const sDerived_angMomentum = _b_derived_in[_sroa_50_base + 1];
                                    const sDerived_invMass = _b_derived_in[_sroa_50_base + 2];
                                    const sDerived_radiusSq = _b_derived_in[_sroa_50_base + 3];
                                    const sDerived_velX = _b_derived_in[_sroa_50_base + 4];
                                    const sDerived_velY = _b_derived_in[_sroa_50_base + 5];
                                    const sDerived_angVel = _b_derived_in[_sroa_50_base + 6];
                                    const sDerived_bodyRSq = _b_derived_in[_sroa_50_base + 7];
                                    accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, sPs_posX, sPs_posY, sDerived_velX, sDerived_velY, sPs_mass, sPs_charge, sDerived_angVel, sDerived_magMoment, sDerived_angMomentum, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                }
                            } else if (((!isLeaf) && (((size * size) < (thetaSq * dSq))))) {
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
                                let _inl_34_result;
                                _inl_34: {
                                    let _inl_34__inl_9_result;
                                    _inl_34__inl_9: {
                                        _inl_34__inl_9_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_34__inl_9;
                                    }
                                    _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_9_result + 8)]);
                                    break _inl_34;
                                }
                                let _inl_35_result;
                                _inl_35: {
                                    let _inl_35__inl_10_result;
                                    _inl_35__inl_10: {
                                        _inl_35__inl_10_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_35__inl_10;
                                    }
                                    _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_10_result + 9)]);
                                    break _inl_35;
                                }
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 0.0, _inl_34_result, _inl_35_result, 1.0, 1.0, 1.0, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            } else if ((!isLeaf)) {
                                if (((stackTop + 4) <= MAX_STACK)) {
                                    let _inl_36_result;
                                    _inl_36: {
                                        let _inl_36__inl_13_result;
                                        _inl_36__inl_13: {
                                            _inl_36__inl_13_result = (nodeIdx * NODE_STRIDE);
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
                                            _inl_37__inl_14_result = (nodeIdx * NODE_STRIDE);
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
                                            _inl_38__inl_15_result = (nodeIdx * NODE_STRIDE);
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
                                            _inl_39__inl_16_result = (nodeIdx * NODE_STRIDE);
                                            break _inl_39__inl_16;
                                        }
                                        _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                        break _inl_39;
                                    }
                                    const se = _inl_39_result;
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
                        {
                            const _wlv = localAF.totalForce;
                            const _wt0 = ((localAF.totalForce.x != localAF.totalForce.x) ? 0.0 : localAF.totalForce.x);
                            const _wt1 = ((localAF.totalForce.y != localAF.totalForce.y) ? 0.0 : localAF.totalForce.y);
                            _wlv.x = _wt0;
                            _wlv.y = _wt1;
                        }
                        {
                            const _wlv = localAF.jerk;
                            const _wt0 = ((localJerk.x != localJerk.x) ? 0.0 : localJerk.x);
                            const _wt1 = ((localJerk.y != localJerk.y) ? 0.0 : localJerk.y);
                            _wlv.x = _wt0;
                            _wlv.y = _wt1;
                        }
                        {
                            const _wlv = localAF.bFields;
                            const _wt0 = ((localAF.bFields.x != localAF.bFields.x) ? 0.0 : localAF.bFields.x);
                            const _wt1 = ((localAF.bFields.y != localAF.bFields.y) ? 0.0 : localAF.bFields.y);
                            const _wt2 = localAF.bFields.z;
                            const _wt3 = localAF.bFields.w;
                            _wlv.x = _wt0;
                            _wlv.y = _wt1;
                            _wlv.z = _wt2;
                            _wlv.w = _wt3;
                        }
                        {
                            const _wlv = localAF.bFieldGrads;
                            const _wt0 = ((localAF.bFieldGrads.x != localAF.bFieldGrads.x) ? 0.0 : localAF.bFieldGrads.x);
                            const _wt1 = ((localAF.bFieldGrads.y != localAF.bFieldGrads.y) ? 0.0 : localAF.bFieldGrads.y);
                            const _wt2 = ((localAF.bFieldGrads.z != localAF.bFieldGrads.z) ? 0.0 : localAF.bFieldGrads.z);
                            const _wt3 = ((localAF.bFieldGrads.w != localAF.bFieldGrads.w) ? 0.0 : localAF.bFieldGrads.w);
                            _wlv.x = _wt0;
                            _wlv.y = _wt1;
                            _wlv.z = _wt2;
                            _wlv.w = _wt3;
                        }
                        {
                            const _wbase = ((pIdx) * 40);
                            const _stmp = localAF;
                            _b_allForces[_wbase + 0] = _stmp.f0.x;
                            _b_allForces[_wbase + 1] = _stmp.f0.y;
                            _b_allForces[_wbase + 2] = _stmp.f0.z;
                            _b_allForces[_wbase + 3] = _stmp.f0.w;
                            _b_allForces[_wbase + 4] = _stmp.f1.x;
                            _b_allForces[_wbase + 5] = _stmp.f1.y;
                            _b_allForces[_wbase + 6] = _stmp.f1.z;
                            _b_allForces[_wbase + 7] = _stmp.f1.w;
                            _b_allForces[_wbase + 8] = _stmp.f2.x;
                            _b_allForces[_wbase + 9] = _stmp.f2.y;
                            _b_allForces[_wbase + 10] = _stmp.f2.z;
                            _b_allForces[_wbase + 11] = _stmp.f2.w;
                            _b_allForces[_wbase + 12] = _stmp.f3.x;
                            _b_allForces[_wbase + 13] = _stmp.f3.y;
                            _b_allForces[_wbase + 14] = _stmp.f3.z;
                            _b_allForces[_wbase + 15] = _stmp.f3.w;
                            _b_allForces[_wbase + 16] = _stmp.f4.x;
                            _b_allForces[_wbase + 17] = _stmp.f4.y;
                            _b_allForces[_wbase + 18] = _stmp.f4.z;
                            _b_allForces[_wbase + 19] = _stmp.f4.w;
                            _b_allForces[_wbase + 20] = _stmp.f5.x;
                            _b_allForces[_wbase + 21] = _stmp.f5.y;
                            _b_allForces[_wbase + 22] = _stmp.f5.z;
                            _b_allForces[_wbase + 23] = _stmp.f5.w;
                            _b_allForces[_wbase + 24] = _stmp.torques.x;
                            _b_allForces[_wbase + 25] = _stmp.torques.y;
                            _b_allForces[_wbase + 26] = _stmp.torques.z;
                            _b_allForces[_wbase + 27] = _stmp.torques.w;
                            _b_allForces[_wbase + 28] = _stmp.bFields.x;
                            _b_allForces[_wbase + 29] = _stmp.bFields.y;
                            _b_allForces[_wbase + 30] = _stmp.bFields.z;
                            _b_allForces[_wbase + 31] = _stmp.bFields.w;
                            _b_allForces[_wbase + 32] = _stmp.bFieldGrads.x;
                            _b_allForces[_wbase + 33] = _stmp.bFieldGrads.y;
                            _b_allForces[_wbase + 34] = _stmp.bFieldGrads.z;
                            _b_allForces[_wbase + 35] = _stmp.bFieldGrads.w;
                            _b_allForces[_wbase + 36] = _stmp.totalForce.x;
                            _b_allForces[_wbase + 37] = _stmp.totalForce.y;
                            _b_allForces[_wbase + 38] = _stmp.jerk.x;
                            _b_allForces[_wbase + 39] = _stmp.jerk.y;
                        }
                        const totalFSq = ((localAF.totalForce.x * localAF.totalForce.x) + (localAF.totalForce.y * localAF.totalForce.y));
                        const accelSq = ((totalFSq * pInvMass) * pInvMass);
                        if (((accelSq == accelSq) && (accelSq < 1e20))) {
                            const accelBits = rt.bitcast_u32_f32(Math.sqrt(accelSq));
                            (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_maxAccel, 0, accelBits));
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
                    const pIdx = gid_x;
                    if ((pIdx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    const _sroa_51_base = ((pIdx) * 9);
                    const ps_posX = _b_particleState[_sroa_51_base + 0];
                    const ps_posY = _b_particleState[_sroa_51_base + 1];
                    const ps_velWX = _b_particleState[_sroa_51_base + 2];
                    const ps_velWY = _b_particleState[_sroa_51_base + 3];
                    const ps_mass = _b_particleState[_sroa_51_base + 4];
                    const ps_charge = _b_particleState[_sroa_51_base + 5];
                    const ps_angW = _b_particleState[_sroa_51_base + 6];
                    const ps_baseMass = _b_particleState[_sroa_51_base + 7];
                    const ps_flags = _b_particleState[_sroa_51_base + 8];
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    if ((((ps_flags & FLAG_GHOST)) != 0)) {
                        break __invocation;
                    }
                    const px = ps_posX;
                    const py = ps_posY;
                    const pMass = ps_mass;
                    const pCharge = ps_charge;
                    const _sroa_52_base = ((pIdx) * 8);
                    const pDerived_magMoment = _b_derived_in[_sroa_52_base + 0];
                    const pDerived_angMomentum = _b_derived_in[_sroa_52_base + 1];
                    const pDerived_invMass = _b_derived_in[_sroa_52_base + 2];
                    const pDerived_radiusSq = _b_derived_in[_sroa_52_base + 3];
                    const pDerived_velX = _b_derived_in[_sroa_52_base + 4];
                    const pDerived_velY = _b_derived_in[_sroa_52_base + 5];
                    const pDerived_angVel = _b_derived_in[_sroa_52_base + 6];
                    const pDerived_bodyRSq = _b_derived_in[_sroa_52_base + 7];
                    const pMagMoment = pDerived_magMoment;
                    const pAngMomentum = pDerived_angMomentum;
                    const _sroa_53_base = ((pIdx) * 5);
                    const pAux_radius = _b_particleAux[_sroa_53_base + 0];
                    const pAux_particleId = _b_particleAux[_sroa_53_base + 1];
                    const pAux_deathTime = _b_particleAux[_sroa_53_base + 2];
                    const pAux_deathMass = _b_particleAux[_sroa_53_base + 3];
                    const pAux_deathAngVel = _b_particleAux[_sroa_53_base + 4];
                    const pBodyRadiusSq = pDerived_bodyRSq;
                    const pBodyRadius = Math.sqrt(pBodyRadiusSq);
                    const pRi5 = ((pBodyRadiusSq * pBodyRadiusSq) * pBodyRadius);
                    const pAngW = ps_angW;
                    const _sroa_54_base = ((pIdx) * 4 + 0);
                    const pAym_x = _b_axYukMod_in[_sroa_54_base + 0];
                    const pAym_y = _b_axYukMod_in[_sroa_54_base + 1];
                    const pAym_z = _b_axYukMod_in[_sroa_54_base + 2];
                    const pAym_w = _b_axYukMod_in[_sroa_54_base + 3];
                    const pAxMod = pAym_x;
                    const pYukMod = pAym_y;
                    const pHiggsMod = pAym_z;
                    const wSq = ((ps_velWX * ps_velWX) + (ps_velWY * ps_velWY));
                    const relOn = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                    const invGamma = (relOn ? (1.0 / Math.sqrt((1.0 + wSq))) : 1.0);
                    const pVelX = (ps_velWX * invGamma);
                    const pVelY = (ps_velWY * invGamma);
                    const pAngVel = (relOn ? (pAngW / Math.sqrt((1.0 + ((pAngW * pAngW) * pBodyRadiusSq)))) : pAngW);
                    const pInvMass = pDerived_invMass;
                    const thetaSq = (_u_uniforms_bhTheta * _u_uniforms_bhTheta);
                    const pid = pAux_particleId;
                    const _t0 = _u_uniforms_toggles0;
                    const _gravOn = (((_t0 & GRAVITY_BIT)) != 0);
                    const _coulOn = (((_t0 & COULOMB_BIT)) != 0);
                    const _magOn = (((_t0 & MAGNETIC_BIT)) != 0);
                    const _gmOn = (((_t0 & GRAVITOMAG_BIT)) != 0);
                    const _yukOn = (((_t0 & YUKAWA_BIT)) != 0);
                    const _onePNOn = (((_t0 & ONE_PN_BIT)) != 0);
                    const _higgsOn = (((_t0 & HIGGS_BIT)) != 0);
                    const _radOn = (((_t0 & RADIATION_BIT)) != 0);
                    const _needAxMod = (((_coulOn || _magOn)) && (((_t0 & AXION_BIT)) != 0));
                    let localJerk = {x:0.0, y:0.0};
                    let localAF = ((_b) => ({ f0: {x:_b_allForces[_b + 0], y:_b_allForces[_b + 1], z:_b_allForces[_b + 2], w:_b_allForces[_b + 3]}, f1: {x:_b_allForces[_b + 4], y:_b_allForces[_b + 5], z:_b_allForces[_b + 6], w:_b_allForces[_b + 7]}, f2: {x:_b_allForces[_b + 8], y:_b_allForces[_b + 9], z:_b_allForces[_b + 10], w:_b_allForces[_b + 11]}, f3: {x:_b_allForces[_b + 12], y:_b_allForces[_b + 13], z:_b_allForces[_b + 14], w:_b_allForces[_b + 15]}, f4: {x:_b_allForces[_b + 16], y:_b_allForces[_b + 17], z:_b_allForces[_b + 18], w:_b_allForces[_b + 19]}, f5: {x:_b_allForces[_b + 20], y:_b_allForces[_b + 21], z:_b_allForces[_b + 22], w:_b_allForces[_b + 23]}, torques: {x:_b_allForces[_b + 24], y:_b_allForces[_b + 25], z:_b_allForces[_b + 26], w:_b_allForces[_b + 27]}, bFields: {x:_b_allForces[_b + 28], y:_b_allForces[_b + 29], z:_b_allForces[_b + 30], w:_b_allForces[_b + 31]}, bFieldGrads: {x:_b_allForces[_b + 32], y:_b_allForces[_b + 33], z:_b_allForces[_b + 34], w:_b_allForces[_b + 35]}, totalForce: {x:_b_allForces[_b + 36], y:_b_allForces[_b + 37]}, jerk: {x:_b_allForces[_b + 38], y:_b_allForces[_b + 39]} }))(((pIdx) * 40));
                    const isPeriodic = (_u_uniforms_boundaryMode == BOUND_LOOP);
                    const hasSignalDelay = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                    const sdTime = (_u_uniforms_simTime - _u_uniforms_dt);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let stackTop = 0;
                    stack[0] = 0;
                    stackTop = 1;
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
                        let comDisp_x = (comX - px);
                        let comDisp_y = (comY - py);
                        if (isPeriodic) {
                            const _sroa_55 = fullMinImageP(px, py, comX, comY, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode);
                            comDisp_x = _sroa_55.x;
                            comDisp_y = _sroa_55.y;
                        }
                        const dx = comDisp_x;
                        const dy = comDisp_y;
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
                            const _sroa_56_base = ((sIdx) * 9);
                            const sPs_posX = _b_particleState[_sroa_56_base + 0];
                            const sPs_posY = _b_particleState[_sroa_56_base + 1];
                            const sPs_velWX = _b_particleState[_sroa_56_base + 2];
                            const sPs_velWY = _b_particleState[_sroa_56_base + 3];
                            const sPs_mass = _b_particleState[_sroa_56_base + 4];
                            const sPs_charge = _b_particleState[_sroa_56_base + 5];
                            const sPs_angW = _b_particleState[_sroa_56_base + 6];
                            const sPs_baseMass = _b_particleState[_sroa_56_base + 7];
                            const sPs_flags = _b_particleState[_sroa_56_base + 8];
                            const _sroa_57_base = ((sIdx) * 5);
                            const sAux_radius = _b_particleAux[_sroa_57_base + 0];
                            const sAux_particleId = _b_particleAux[_sroa_57_base + 1];
                            const sAux_deathTime = _b_particleAux[_sroa_57_base + 2];
                            const sAux_deathMass = _b_particleAux[_sroa_57_base + 3];
                            const sAux_deathAngVel = _b_particleAux[_sroa_57_base + 4];
                            const isGhost = (((sPs_flags & FLAG_GHOST)) != 0);
                            let origIdx = sIdx;
                            if ((isGhost && (sIdx >= _u_uniforms_aliveCount))) {
                                origIdx = _b_ghostOriginalIdx[(sIdx - _u_uniforms_aliveCount)];
                            }
                            if ((origIdx == pIdx)) {
                                continue;
                            }
                            if ((sIdx == pIdx)) {
                                continue;
                            }
                            const sIsRetired = ((((sPs_flags & FLAG_RETIRED)) != 0) && (((sPs_flags & FLAG_ALIVE)) == 0));
                            if (((((sPs_flags & FLAG_ALIVE)) == 0) && (!sIsRetired))) {
                                continue;
                            }
                            if (sIsRetired) {
                                const _sroa_58 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, true);
                                const delayed_x = _sroa_58.x;
                                const delayed_y = _sroa_58.y;
                                const delayed_vx = _sroa_58.vx;
                                const delayed_vy = _sroa_58.vy;
                                const delayed_angw = _sroa_58.angw;
                                const delayed_valid = _sroa_58.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const _sroa_59_base = ((sIdx) * 5);
                                const sAuxR_radius = _b_particleAux[_sroa_59_base + 0];
                                const sAuxR_particleId = _b_particleAux[_sroa_59_base + 1];
                                const sAuxR_deathTime = _b_particleAux[_sroa_59_base + 2];
                                const sAuxR_deathMass = _b_particleAux[_sroa_59_base + 3];
                                const sAuxR_deathAngVel = _b_particleAux[_sroa_59_base + 4];
                                const deadMass = sAuxR_deathMass;
                                const deadCharge = sPs_charge;
                                const bodyRadSq = Math.pow(deadMass, 0.6666666666666666);
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * deadCharge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * deadMass) * sAngVelRet) * bodyRadSq);
                                const _sroa_60_base = ((sIdx) * 4 + 0);
                                const deadAxYuk_x = _b_axYukMod_in[_sroa_60_base + 0];
                                const deadAxYuk_y = _b_axYukMod_in[_sroa_60_base + 1];
                                const deadAxYuk_z = _b_axYukMod_in[_sroa_60_base + 2];
                                const deadAxYuk_w = _b_axYukMod_in[_sroa_60_base + 3];
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, deadMass, deadCharge, sAngVelRet, sMagMomRet, sAngMomRet, ((Math.abs(deadAxYuk_x) < EPSILON) ? 1.0 : deadAxYuk_x), ((Math.abs(deadAxYuk_y) < EPSILON) ? 1.0 : deadAxYuk_y), ((Math.abs(deadAxYuk_z) < EPSILON) ? 1.0 : deadAxYuk_z), pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                                continue;
                            }
                            const _sroa_61_base = ((sIdx) * 4 + 0);
                            const sAYM_x = _b_axYukMod_in[_sroa_61_base + 0];
                            const sAYM_y = _b_axYukMod_in[_sroa_61_base + 1];
                            const sAYM_z = _b_axYukMod_in[_sroa_61_base + 2];
                            const sAYM_w = _b_axYukMod_in[_sroa_61_base + 3];
                            if ((hasSignalDelay && (!isGhost))) {
                                const _sroa_62 = getDelayedStateGPU(sIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                const delayed_x = _sroa_62.x;
                                const delayed_y = _sroa_62.y;
                                const delayed_vx = _sroa_62.vx;
                                const delayed_vy = _sroa_62.vy;
                                const delayed_angw = _sroa_62.angw;
                                const delayed_valid = _sroa_62.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, delayed_x, delayed_y, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            } else if ((hasSignalDelay && isGhost)) {
                                const _sroa_63_base = ((origIdx) * 9);
                                const origPs_posX = _b_particleState[_sroa_63_base + 0];
                                const origPs_posY = _b_particleState[_sroa_63_base + 1];
                                const origPs_velWX = _b_particleState[_sroa_63_base + 2];
                                const origPs_velWY = _b_particleState[_sroa_63_base + 3];
                                const origPs_mass = _b_particleState[_sroa_63_base + 4];
                                const origPs_charge = _b_particleState[_sroa_63_base + 5];
                                const origPs_angW = _b_particleState[_sroa_63_base + 6];
                                const origPs_baseMass = _b_particleState[_sroa_63_base + 7];
                                const origPs_flags = _b_particleState[_sroa_63_base + 8];
                                const _sroa_64 = getDelayedStateGPU(origIdx, px, py, sdTime, isPeriodic, _u_uniforms_domainW, _u_uniforms_domainH, _u_uniforms_topologyMode, false);
                                const delayed_x = _sroa_64.x;
                                const delayed_y = _sroa_64.y;
                                const delayed_vx = _sroa_64.vx;
                                const delayed_vy = _sroa_64.vy;
                                const delayed_angw = _sroa_64.angw;
                                const delayed_valid = _sroa_64.valid;
                                if ((!delayed_valid)) {
                                    continue;
                                }
                                const shiftX = (sPs_posX - origPs_posX);
                                const shiftY = (sPs_posY - origPs_posY);
                                const gsx = (delayed_x + shiftX);
                                const gsy = (delayed_y + shiftY);
                                const bodyRadSq = _b_derived_in[((sIdx) * 8 + 7)];
                                const retAngwSq = (delayed_angw * delayed_angw);
                                const sAngVelRet = (delayed_angw / Math.sqrt((1.0 + (retAngwSq * bodyRadSq))));
                                const sMagMomRet = (((MAG_MOMENT_K * sPs_charge) * sAngVelRet) * bodyRadSq);
                                const sAngMomRet = (((INERTIA_K * sPs_mass) * sAngVelRet) * bodyRadSq);
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, gsx, gsy, delayed_vx, delayed_vy, sPs_mass, sPs_charge, sAngVelRet, sMagMomRet, sAngMomRet, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, true, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            } else {
                                const _sroa_65_base = ((sIdx) * 8);
                                const sDerived_magMoment = _b_derived_in[_sroa_65_base + 0];
                                const sDerived_angMomentum = _b_derived_in[_sroa_65_base + 1];
                                const sDerived_invMass = _b_derived_in[_sroa_65_base + 2];
                                const sDerived_radiusSq = _b_derived_in[_sroa_65_base + 3];
                                const sDerived_velX = _b_derived_in[_sroa_65_base + 4];
                                const sDerived_velY = _b_derived_in[_sroa_65_base + 5];
                                const sDerived_angVel = _b_derived_in[_sroa_65_base + 6];
                                const sDerived_bodyRSq = _b_derived_in[_sroa_65_base + 7];
                                accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, sPs_posX, sPs_posY, sDerived_velX, sDerived_velY, sPs_mass, sPs_charge, sDerived_angVel, sDerived_magMoment, sDerived_angMomentum, sAYM_x, sAYM_y, sAYM_z, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                            }
                        } else if (((!isLeaf) && (((size * size) < (thetaSq * dSq))))) {
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
                            let _inl_34_result;
                            _inl_34: {
                                let _inl_34__inl_9_result;
                                _inl_34__inl_9: {
                                    _inl_34__inl_9_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_34__inl_9;
                                }
                                _inl_34_result = rt.bitcast_f32_u32(_b_nodes[(_inl_34__inl_9_result + 8)]);
                                break _inl_34;
                            }
                            let _inl_35_result;
                            _inl_35: {
                                let _inl_35__inl_10_result;
                                _inl_35__inl_10: {
                                    _inl_35__inl_10_result = (nodeIdx * NODE_STRIDE);
                                    break _inl_35__inl_10;
                                }
                                _inl_35_result = rt.bitcast_f32_u32(_b_nodes[(_inl_35__inl_10_result + 9)]);
                                break _inl_35;
                            }
                            accumulateForce(localAF, px, py, pMass, pCharge, pMagMoment, pAngMomentum, pAngVel, pVelX, pVelY, pAxMod, pYukMod, pHiggsMod, comX, comY, avgVx, avgVy, nodeMass, _inl_33_result, 0.0, _inl_34_result, _inl_35_result, 1.0, 1.0, 1.0, pRi5, localJerk, false, _gravOn, _coulOn, _magOn, _gmOn, _yukOn, _onePNOn, _higgsOn, _radOn, _needAxMod);
                        } else if ((!isLeaf)) {
                            if (((stackTop + 4) <= MAX_STACK)) {
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_13_result;
                                    _inl_36__inl_13: {
                                        _inl_36__inl_13_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_37__inl_14_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_38__inl_15_result = (nodeIdx * NODE_STRIDE);
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
                                        _inl_39__inl_16_result = (nodeIdx * NODE_STRIDE);
                                        break _inl_39__inl_16;
                                    }
                                    _inl_39_result = rt.bitcast_i32_u32(_b_nodes[(_inl_39__inl_16_result + 15)]);
                                    break _inl_39;
                                }
                                const se = _inl_39_result;
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
                    {
                        const _wlv = localAF.totalForce;
                        const _wt0 = ((localAF.totalForce.x != localAF.totalForce.x) ? 0.0 : localAF.totalForce.x);
                        const _wt1 = ((localAF.totalForce.y != localAF.totalForce.y) ? 0.0 : localAF.totalForce.y);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                    }
                    {
                        const _wlv = localAF.jerk;
                        const _wt0 = ((localJerk.x != localJerk.x) ? 0.0 : localJerk.x);
                        const _wt1 = ((localJerk.y != localJerk.y) ? 0.0 : localJerk.y);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                    }
                    {
                        const _wlv = localAF.bFields;
                        const _wt0 = ((localAF.bFields.x != localAF.bFields.x) ? 0.0 : localAF.bFields.x);
                        const _wt1 = ((localAF.bFields.y != localAF.bFields.y) ? 0.0 : localAF.bFields.y);
                        const _wt2 = localAF.bFields.z;
                        const _wt3 = localAF.bFields.w;
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                        _wlv.z = _wt2;
                        _wlv.w = _wt3;
                    }
                    {
                        const _wlv = localAF.bFieldGrads;
                        const _wt0 = ((localAF.bFieldGrads.x != localAF.bFieldGrads.x) ? 0.0 : localAF.bFieldGrads.x);
                        const _wt1 = ((localAF.bFieldGrads.y != localAF.bFieldGrads.y) ? 0.0 : localAF.bFieldGrads.y);
                        const _wt2 = ((localAF.bFieldGrads.z != localAF.bFieldGrads.z) ? 0.0 : localAF.bFieldGrads.z);
                        const _wt3 = ((localAF.bFieldGrads.w != localAF.bFieldGrads.w) ? 0.0 : localAF.bFieldGrads.w);
                        _wlv.x = _wt0;
                        _wlv.y = _wt1;
                        _wlv.z = _wt2;
                        _wlv.w = _wt3;
                    }
                    {
                        const _wbase = ((pIdx) * 40);
                        const _stmp = localAF;
                        _b_allForces[_wbase + 0] = _stmp.f0.x;
                        _b_allForces[_wbase + 1] = _stmp.f0.y;
                        _b_allForces[_wbase + 2] = _stmp.f0.z;
                        _b_allForces[_wbase + 3] = _stmp.f0.w;
                        _b_allForces[_wbase + 4] = _stmp.f1.x;
                        _b_allForces[_wbase + 5] = _stmp.f1.y;
                        _b_allForces[_wbase + 6] = _stmp.f1.z;
                        _b_allForces[_wbase + 7] = _stmp.f1.w;
                        _b_allForces[_wbase + 8] = _stmp.f2.x;
                        _b_allForces[_wbase + 9] = _stmp.f2.y;
                        _b_allForces[_wbase + 10] = _stmp.f2.z;
                        _b_allForces[_wbase + 11] = _stmp.f2.w;
                        _b_allForces[_wbase + 12] = _stmp.f3.x;
                        _b_allForces[_wbase + 13] = _stmp.f3.y;
                        _b_allForces[_wbase + 14] = _stmp.f3.z;
                        _b_allForces[_wbase + 15] = _stmp.f3.w;
                        _b_allForces[_wbase + 16] = _stmp.f4.x;
                        _b_allForces[_wbase + 17] = _stmp.f4.y;
                        _b_allForces[_wbase + 18] = _stmp.f4.z;
                        _b_allForces[_wbase + 19] = _stmp.f4.w;
                        _b_allForces[_wbase + 20] = _stmp.f5.x;
                        _b_allForces[_wbase + 21] = _stmp.f5.y;
                        _b_allForces[_wbase + 22] = _stmp.f5.z;
                        _b_allForces[_wbase + 23] = _stmp.f5.w;
                        _b_allForces[_wbase + 24] = _stmp.torques.x;
                        _b_allForces[_wbase + 25] = _stmp.torques.y;
                        _b_allForces[_wbase + 26] = _stmp.torques.z;
                        _b_allForces[_wbase + 27] = _stmp.torques.w;
                        _b_allForces[_wbase + 28] = _stmp.bFields.x;
                        _b_allForces[_wbase + 29] = _stmp.bFields.y;
                        _b_allForces[_wbase + 30] = _stmp.bFields.z;
                        _b_allForces[_wbase + 31] = _stmp.bFields.w;
                        _b_allForces[_wbase + 32] = _stmp.bFieldGrads.x;
                        _b_allForces[_wbase + 33] = _stmp.bFieldGrads.y;
                        _b_allForces[_wbase + 34] = _stmp.bFieldGrads.z;
                        _b_allForces[_wbase + 35] = _stmp.bFieldGrads.w;
                        _b_allForces[_wbase + 36] = _stmp.totalForce.x;
                        _b_allForces[_wbase + 37] = _stmp.totalForce.y;
                        _b_allForces[_wbase + 38] = _stmp.jerk.x;
                        _b_allForces[_wbase + 39] = _stmp.jerk.y;
                    }
                    const totalFSq = ((localAF.totalForce.x * localAF.totalForce.x) + (localAF.totalForce.y * localAF.totalForce.y));
                    const accelSq = ((totalFSq * pInvMass) * pInvMass);
                    if (((accelSq == accelSq) && (accelSq < 1e20))) {
                        const accelBits = rt.bitcast_u32_f32(Math.sqrt(accelSq));
                        (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_maxAccel, 0, accelBits));
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

    return { entry, bind, bindings: ["nodes","uniforms","particleState","particleAux","derived_in","axYukMod_in","ghostOriginalIdx","allForces","maxAccel","histData","histMeta"], entryInfo };
}
