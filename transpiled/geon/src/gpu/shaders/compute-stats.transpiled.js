// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/compute-stats.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 454af5cfbfa04b0f16ede5068c7a6e15b822470f45d5bc3775edea95a657fbc7
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":62576,"lines":1218,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":2,"workgroupReductionInits":0,"flatWorkgroupArrays":13,"flatWorkgroupSlots":832,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.664Z
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
    const KE_WG = 64;
    const FLD_WG = 64;

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

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["statsKEMom"] = {"workgroupSize":[64,1,1],"phases":4,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":13,"optimizedWorkgroupReductionInits":0};
    function __entry_0_statsKEMom(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_params = bindings.params;
        const _u_params_aliveCount = _b_params.aliveCount;
        const _u_params_toggles0 = _b_params.toggles0;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_stats = bindings.stats;
        const wg = Object.create(null);
        wg.sh_linearKE = new Float32Array(64);
        wg.sh_spinKE = new Float32Array(64);
        wg.sh_px = new Float32Array(64);
        wg.sh_py = new Float32Array(64);
        wg.sh_totalMass = new Float32Array(64);
        wg.sh_comX = new Float32Array(64);
        wg.sh_comY = new Float32Array(64);
        wg.sh_orbAngMom = new Float32Array(64);
        wg.sh_spinAngMom = new Float32Array(64);
        wg.sh_comXFinal = 0;
        wg.sh_comYFinal = 0;
        wg.sh_higgsE = new Float32Array(64);
        wg.sh_axionE = new Float32Array(64);
        wg.sh_fmx = new Float32Array(64);
        wg.sh_fmy = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_linearKE.fill(0);
            wg.sh_spinKE.fill(0);
            wg.sh_px.fill(0);
            wg.sh_py.fill(0);
            wg.sh_totalMass.fill(0);
            wg.sh_comX.fill(0);
            wg.sh_comY.fill(0);
            wg.sh_orbAngMom.fill(0);
            wg.sh_spinAngMom.fill(0);
            wg.sh_comXFinal = 0;
            wg.sh_comYFinal = 0;
            wg.sh_higgsE.fill(0);
            wg.sh_axionE.fill(0);
            wg.sh_fmx.fill(0);
            wg.sh_fmy.fill(0);
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        const n = _u_params_aliveCount;
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = (((_u_params_toggles0 & RELATIVITY_BIT)) != 0);
                            break _inl_24;
                        }
                        const relOn = _inl_24_result;
                        let localLinearKE = 0.0;
                        let localSpinKE = 0.0;
                        let localPx = 0.0;
                        let localPy = 0.0;
                        let localTotalMass = 0.0;
                        let localComX = 0.0;
                        let localComY = 0.0;
                        let i = tid;
                        while ((i < n)) {
                            const _sroa_0_base = ((i) * 9);
                            const p_posX = _b_particles[_sroa_0_base + 0];
                            const p_posY = _b_particles[_sroa_0_base + 1];
                            const p_velWX = _b_particles[_sroa_0_base + 2];
                            const p_velWY = _b_particles[_sroa_0_base + 3];
                            const p_mass = _b_particles[_sroa_0_base + 4];
                            const p_charge = _b_particles[_sroa_0_base + 5];
                            const p_angW = _b_particles[_sroa_0_base + 6];
                            const p_baseMass = _b_particles[_sroa_0_base + 7];
                            const p_flags = _b_particles[_sroa_0_base + 8];
                            if ((((p_flags & FLAG_ALIVE)) != 0)) {
                                const _sroa_1_base = ((i) * 8);
                                const d_magMoment = _b_derived[_sroa_1_base + 0];
                                const d_angMomentum = _b_derived[_sroa_1_base + 1];
                                const d_invMass = _b_derived[_sroa_1_base + 2];
                                const d_radiusSq = _b_derived[_sroa_1_base + 3];
                                const d_velX = _b_derived[_sroa_1_base + 4];
                                const d_velY = _b_derived[_sroa_1_base + 5];
                                const d_angVel = _b_derived[_sroa_1_base + 6];
                                const d_bodyRSq = _b_derived[_sroa_1_base + 7];
                                const m = p_mass;
                                if (relOn) {
                                    const wSq = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
                                    const gamma = Math.sqrt((1.0 + wSq));
                                    localLinearKE = (localLinearKE + ((wSq / ((gamma + 1.0))) * m));
                                    const srSq = ((p_angW * p_angW) * d_bodyRSq);
                                    const gammaRot = Math.sqrt((1.0 + srSq));
                                    localSpinKE = (localSpinKE + (((INERTIA_K * m) * srSq) / ((gammaRot + 1.0))));
                                } else {
                                    const vSq = ((d_velX * d_velX) + (d_velY * d_velY));
                                    localLinearKE = (localLinearKE + ((0.5 * m) * vSq));
                                    localSpinKE = (localSpinKE + (((((0.5 * INERTIA_K) * m) * d_bodyRSq) * d_angVel) * d_angVel));
                                }
                                localPx = (localPx + (m * p_velWX));
                                localPy = (localPy + (m * p_velWY));
                                localTotalMass = (localTotalMass + m);
                                localComX = (localComX + (m * p_posX));
                                localComY = (localComY + (m * p_posY));
                            }
                            i = (i + KE_WG);
                        }
                        wg.sh_linearKE[((tid))] = localLinearKE;
                        wg.sh_spinKE[((tid))] = localSpinKE;
                        wg.sh_px[((tid))] = localPx;
                        wg.sh_py[((tid))] = localPy;
                        wg.sh_totalMass[((tid))] = localTotalMass;
                        wg.sh_comX[((tid))] = localComX;
                        wg.sh_comY[((tid))] = localComY;
                    }
                }
            }
            for (let stride = (KE_WG >> 1); (stride > 0); stride = (stride >> 1)) {
                {
                    const lz = 0;
                    const ly = 0;
                    for (let lx = 0; lx < Lx; lx++) {
                        const lid_x = lx;
                        {
                            const tid = lid_x;
                            const n = _u_params_aliveCount;
                            if ((tid < stride)) {
                                wg.sh_linearKE[((tid))] = (wg.sh_linearKE[((tid))] + wg.sh_linearKE[(((tid + stride)))]);
                                wg.sh_spinKE[((tid))] = (wg.sh_spinKE[((tid))] + wg.sh_spinKE[(((tid + stride)))]);
                                wg.sh_px[((tid))] = (wg.sh_px[((tid))] + wg.sh_px[(((tid + stride)))]);
                                wg.sh_py[((tid))] = (wg.sh_py[((tid))] + wg.sh_py[(((tid + stride)))]);
                                wg.sh_totalMass[((tid))] = (wg.sh_totalMass[((tid))] + wg.sh_totalMass[(((tid + stride)))]);
                                wg.sh_comX[((tid))] = (wg.sh_comX[((tid))] + wg.sh_comX[(((tid + stride)))]);
                                wg.sh_comY[((tid))] = (wg.sh_comY[((tid))] + wg.sh_comY[(((tid + stride)))]);
                            }
                        }
                    }
                }
            }
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        const n = _u_params_aliveCount;
                        if ((tid == 0)) {
                            const tm = wg.sh_totalMass[((0))];
                            let cx = wg.sh_comX[((0))];
                            let cy = wg.sh_comY[((0))];
                            if ((tm > 0.0)) {
                                cx = (cx / tm);
                                cy = (cy / tm);
                            }
                            wg.sh_comXFinal = cx;
                            wg.sh_comYFinal = cy;
                            _b_stats[0] = wg.sh_linearKE[((0))];
                            _b_stats[1] = wg.sh_spinKE[((0))];
                            _b_stats[2] = wg.sh_px[((0))];
                            _b_stats[3] = wg.sh_py[((0))];
                            _b_stats[8] = tm;
                            _b_stats[9] = (+(n));
                            _b_stats[6] = cx;
                            _b_stats[7] = cy;
                        }
                    }
                }
            }
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        const n = _u_params_aliveCount;
                        const comXF = wg.sh_comXFinal;
                        const comYF = wg.sh_comYFinal;
                        let localOrbAngMom = 0.0;
                        let localSpinAngMom = 0.0;
                        i = tid;
                        while ((i < n)) {
                            const _sroa_2_base = ((i) * 9);
                            const p_posX = _b_particles[_sroa_2_base + 0];
                            const p_posY = _b_particles[_sroa_2_base + 1];
                            const p_velWX = _b_particles[_sroa_2_base + 2];
                            const p_velWY = _b_particles[_sroa_2_base + 3];
                            const p_mass = _b_particles[_sroa_2_base + 4];
                            const p_charge = _b_particles[_sroa_2_base + 5];
                            const p_angW = _b_particles[_sroa_2_base + 6];
                            const p_baseMass = _b_particles[_sroa_2_base + 7];
                            const p_flags = _b_particles[_sroa_2_base + 8];
                            if ((((p_flags & FLAG_ALIVE)) != 0)) {
                                const _sroa_3_base = ((i) * 8);
                                const d_magMoment = _b_derived[_sroa_3_base + 0];
                                const d_angMomentum = _b_derived[_sroa_3_base + 1];
                                const d_invMass = _b_derived[_sroa_3_base + 2];
                                const d_radiusSq = _b_derived[_sroa_3_base + 3];
                                const d_velX = _b_derived[_sroa_3_base + 4];
                                const d_velY = _b_derived[_sroa_3_base + 5];
                                const d_angVel = _b_derived[_sroa_3_base + 6];
                                const d_bodyRSq = _b_derived[_sroa_3_base + 7];
                                const m = p_mass;
                                localOrbAngMom = (localOrbAngMom + ((((p_posX - comXF)) * ((m * p_velWY))) - (((p_posY - comYF)) * ((m * p_velWX)))));
                                localSpinAngMom = (localSpinAngMom + (((INERTIA_K * m) * d_bodyRSq) * p_angW));
                            }
                            i = (i + KE_WG);
                        }
                        wg.sh_orbAngMom[((tid))] = localOrbAngMom;
                        wg.sh_spinAngMom[((tid))] = localSpinAngMom;
                    }
                }
            }
            for (let stride = (KE_WG >> 1); (stride > 0); stride = (stride >> 1)) {
                {
                    const lz = 0;
                    const ly = 0;
                    for (let lx = 0; lx < Lx; lx++) {
                        const lid_x = lx;
                        {
                            const tid = lid_x;
                            const n = _u_params_aliveCount;
                            if ((tid < stride)) {
                                wg.sh_orbAngMom[((tid))] = (wg.sh_orbAngMom[((tid))] + wg.sh_orbAngMom[(((tid + stride)))]);
                                wg.sh_spinAngMom[((tid))] = (wg.sh_spinAngMom[((tid))] + wg.sh_spinAngMom[(((tid + stride)))]);
                            }
                        }
                    }
                }
            }
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        const n = _u_params_aliveCount;
                        if ((tid == 0)) {
                            _b_stats[4] = wg.sh_orbAngMom[((0))];
                            _b_stats[5] = wg.sh_spinAngMom[((0))];
                        }
                    }
                }
            }
        }
    }
    entry["statsKEMom"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_statsKEMom(workgroups, bindings, domain, origin);
    };

    entryInfo["statsPE"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":13,"optimizedWorkgroupReductionInits":0};
    function __entry_1_statsPE(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_params = bindings.params;
        const _u_params_aliveCount = _b_params.aliveCount;
        const _u_params_toggles0 = _b_params.toggles0;
        const _u_params_domainW = _b_params.domainW;
        const _u_params_domainH = _b_params.domainH;
        const _u_params_yukawaMu = _b_params.yukawaMu;
        const _u_params_boundaryMode = _b_params.boundaryMode;
        const _u_params_topologyMode = _b_params.topologyMode;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_stats = bindings.stats;
        const _b_axYukMod = bindings.axYukMod;
        const wg = Object.create(null);
        wg.sh_linearKE = new Float32Array(64);
        wg.sh_spinKE = new Float32Array(64);
        wg.sh_px = new Float32Array(64);
        wg.sh_py = new Float32Array(64);
        wg.sh_totalMass = new Float32Array(64);
        wg.sh_comX = new Float32Array(64);
        wg.sh_comY = new Float32Array(64);
        wg.sh_orbAngMom = new Float32Array(64);
        wg.sh_spinAngMom = new Float32Array(64);
        wg.sh_comXFinal = 0;
        wg.sh_comYFinal = 0;
        wg.sh_higgsE = new Float32Array(64);
        wg.sh_axionE = new Float32Array(64);
        wg.sh_fmx = new Float32Array(64);
        wg.sh_fmy = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_linearKE.fill(0);
            wg.sh_spinKE.fill(0);
            wg.sh_px.fill(0);
            wg.sh_py.fill(0);
            wg.sh_totalMass.fill(0);
            wg.sh_comX.fill(0);
            wg.sh_comY.fill(0);
            wg.sh_orbAngMom.fill(0);
            wg.sh_spinAngMom.fill(0);
            wg.sh_comXFinal = 0;
            wg.sh_comYFinal = 0;
            wg.sh_higgsE.fill(0);
            wg.sh_axionE.fill(0);
            wg.sh_fmx.fill(0);
            wg.sh_fmy.fill(0);
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    const n = _u_params_aliveCount;
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = (((_u_params_toggles0 & GRAVITY_BIT)) != 0);
                        break _inl_25;
                    }
                    const gravOn = _inl_25_result;
                    let _inl_26_result;
                    _inl_26: {
                        _inl_26_result = (((_u_params_toggles0 & COULOMB_BIT)) != 0);
                        break _inl_26;
                    }
                    const coulOn = _inl_26_result;
                    let _inl_27_result;
                    _inl_27: {
                        _inl_27_result = (((_u_params_toggles0 & MAGNETIC_BIT)) != 0);
                        break _inl_27;
                    }
                    const magOn = _inl_27_result;
                    let _inl_28_result;
                    _inl_28: {
                        _inl_28_result = (((_u_params_toggles0 & GRAVITOMAG_BIT)) != 0);
                        break _inl_28;
                    }
                    const gmOn = _inl_28_result;
                    let _inl_29_result;
                    _inl_29: {
                        _inl_29_result = (((_u_params_toggles0 & ONE_PN_BIT)) != 0);
                        break _inl_29;
                    }
                    const onePNOn = _inl_29_result;
                    let _inl_30_result;
                    _inl_30: {
                        _inl_30_result = (((_u_params_toggles0 & YUKAWA_BIT)) != 0);
                        break _inl_30;
                    }
                    const yukOn = _inl_30_result;
                    let _inl_31_result;
                    _inl_31: {
                        _inl_31_result = (((_u_params_toggles0 & HIGGS_BIT)) != 0);
                        break _inl_31;
                    }
                    const higgsOn = _inl_31_result;
                    let _inl_32_result;
                    _inl_32: {
                        _inl_32_result = (((_u_params_toggles0 & BLACK_HOLE_BIT)) != 0);
                        break _inl_32;
                    }
                    const bhOn = _inl_32_result;
                    const softeningSq = (bhOn ? BH_SOFTENING_SQ : SOFTENING_SQ);
                    const yukMu = _u_params_yukawaMu;
                    let pe = 0.0;
                    let darwinE = 0.0;
                    let darwinPx = 0.0;
                    let darwinPy = 0.0;
                    for (let i = 0; (i < n); i++) {
                        const _sroa_4_base = ((i) * 9);
                        const pi_posX = _b_particles[_sroa_4_base + 0];
                        const pi_posY = _b_particles[_sroa_4_base + 1];
                        const pi_velWX = _b_particles[_sroa_4_base + 2];
                        const pi_velWY = _b_particles[_sroa_4_base + 3];
                        const pi_mass = _b_particles[_sroa_4_base + 4];
                        const pi_charge = _b_particles[_sroa_4_base + 5];
                        const pi_angW = _b_particles[_sroa_4_base + 6];
                        const pi_baseMass = _b_particles[_sroa_4_base + 7];
                        const pi_flags = _b_particles[_sroa_4_base + 8];
                        if ((((pi_flags & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        const _sroa_5_base = ((i) * 8);
                        const di_magMoment = _b_derived[_sroa_5_base + 0];
                        const di_angMomentum = _b_derived[_sroa_5_base + 1];
                        const di_invMass = _b_derived[_sroa_5_base + 2];
                        const di_radiusSq = _b_derived[_sroa_5_base + 3];
                        const di_velX = _b_derived[_sroa_5_base + 4];
                        const di_velY = _b_derived[_sroa_5_base + 5];
                        const di_angVel = _b_derived[_sroa_5_base + 6];
                        const di_bodyRSq = _b_derived[_sroa_5_base + 7];
                        const _sroa_6_base = ((i) * 4);
                        const modi_axMod = _b_axYukMod[_sroa_6_base + 0];
                        const modi_yukMod = _b_axYukMod[_sroa_6_base + 1];
                        const modi_higgsMod = _b_axYukMod[_sroa_6_base + 2];
                        const modi__pad = _b_axYukMod[_sroa_6_base + 3];
                        for (let j = (i + 1); (j < n); j++) {
                            const _sroa_7_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_7_base + 0];
                            const pj_posY = _b_particles[_sroa_7_base + 1];
                            const pj_velWX = _b_particles[_sroa_7_base + 2];
                            const pj_velWY = _b_particles[_sroa_7_base + 3];
                            const pj_mass = _b_particles[_sroa_7_base + 4];
                            const pj_charge = _b_particles[_sroa_7_base + 5];
                            const pj_angW = _b_particles[_sroa_7_base + 6];
                            const pj_baseMass = _b_particles[_sroa_7_base + 7];
                            const pj_flags = _b_particles[_sroa_7_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const _sroa_8_base = ((j) * 8);
                            const dj_magMoment = _b_derived[_sroa_8_base + 0];
                            const dj_angMomentum = _b_derived[_sroa_8_base + 1];
                            const dj_invMass = _b_derived[_sroa_8_base + 2];
                            const dj_radiusSq = _b_derived[_sroa_8_base + 3];
                            const dj_velX = _b_derived[_sroa_8_base + 4];
                            const dj_velY = _b_derived[_sroa_8_base + 5];
                            const dj_angVel = _b_derived[_sroa_8_base + 6];
                            const dj_bodyRSq = _b_derived[_sroa_8_base + 7];
                            const _sroa_9_base = ((j) * 4);
                            const modj_axMod = _b_axYukMod[_sroa_9_base + 0];
                            const modj_yukMod = _b_axYukMod[_sroa_9_base + 1];
                            const modj_higgsMod = _b_axYukMod[_sroa_9_base + 2];
                            const modj__pad = _b_axYukMod[_sroa_9_base + 3];
                            let dx = (pj_posX - pi_posX);
                            let dy = (pj_posY - pi_posY);
                            if ((_u_params_boundaryMode == BOUND_LOOP)) {
                                const _sroa_10 = fullMinImageP(pi_posX, pi_posY, pj_posX, pj_posY, _u_params_domainW, _u_params_domainH, _u_params_topologyMode);
                                const mi_x = _sroa_10.x;
                                const mi_y = _sroa_10.y;
                                dx = mi_x;
                                dy = mi_y;
                            }
                            const rSq = (((dx * dx) + (dy * dy)) + softeningSq);
                            const invR = (1.0 / Math.sqrt(rSq));
                            const r = (rSq * invR);
                            const invR3 = ((invR * invR) * invR);
                            const rx = (dx * invR);
                            const ry = (dy * invR);
                            const axModPair = Math.sqrt((((modi_axMod * modj_axMod)) < (0.0) ? (0.0) : ((modi_axMod * modj_axMod))));
                            const yukModPair = Math.sqrt((((modi_yukMod * modj_yukMod)) < (0.0) ? (0.0) : ((modi_yukMod * modj_yukMod))));
                            if (gravOn) {
                                pe = (pe - ((pi_mass * pj_mass) * invR));
                            }
                            if (coulOn) {
                                pe = (pe + (((pi_charge * pj_charge) * invR) * axModPair));
                            }
                            if (magOn) {
                                pe = (pe + (((di_magMoment * dj_magMoment) * invR3) * axModPair));
                            }
                            if (gmOn) {
                                pe = (pe - ((di_angMomentum * dj_angMomentum) * invR3));
                            }
                            const viDotVj = ((di_velX * dj_velX) + (di_velY * dj_velY));
                            const viDotR = ((di_velX * rx) + (di_velY * ry));
                            const vjDotR = ((dj_velX * rx) + (dj_velY * ry));
                            const velTerm = (viDotVj + (viDotR * vjDotR));
                            const sumVx = (di_velX + dj_velX);
                            const sumVy = (di_velY + dj_velY);
                            const svDotR = ((sumVx * rx) + (sumVy * ry));
                            if (onePNOn) {
                                if (gmOn) {
                                    const viSq = ((di_velX * di_velX) + (di_velY * di_velY));
                                    const vjSq = ((dj_velX * dj_velX) + (dj_velY * dj_velY));
                                    pe = (pe - (((pi_mass * pj_mass) * invR) * (((((1.5 * ((viSq + vjSq))) - (3.5 * viDotVj)) - ((0.5 * viDotR) * vjDotR)) + (((pi_mass + pj_mass)) * invR)))));
                                }
                                if (magOn) {
                                    pe = (pe - ((((0.5 * pi_charge) * pj_charge) * invR) * velTerm));
                                }
                                if ((magOn && gmOn)) {
                                    const crossCoeff = (((pi_charge * pj_charge) * ((pi_mass + pj_mass))) - ((((pi_charge * pi_charge) * pj_mass) + ((pj_charge * pj_charge) * pi_mass))));
                                    pe = (pe + (((0.5 * crossCoeff) * invR) * invR));
                                }
                            } else {
                                if (magOn) {
                                    const qqInvR = (((pi_charge * pj_charge) * invR) * axModPair);
                                    darwinE = (darwinE - ((0.5 * qqInvR) * velTerm));
                                    const coeff = (qqInvR * 0.5);
                                    darwinPx = (darwinPx + (coeff * ((sumVx + (rx * svDotR)))));
                                    darwinPy = (darwinPy + (coeff * ((sumVy + (ry * svDotR)))));
                                }
                                if (gmOn) {
                                    const mmInvR = ((pi_mass * pj_mass) * invR);
                                    darwinE = (darwinE + ((0.5 * mmInvR) * velTerm));
                                    const coeff = (mmInvR * 0.5);
                                    darwinPx = (darwinPx - (coeff * ((sumVx + (rx * svDotR)))));
                                    darwinPy = (darwinPy - (coeff * ((sumVy + (ry * svDotR)))));
                                }
                                if ((magOn && gmOn)) {
                                    const crossCoeff = (((pi_charge * pj_charge) * ((pi_mass + pj_mass))) - ((((pi_charge * pi_charge) * pj_mass) + ((pj_charge * pj_charge) * pi_mass))));
                                    darwinE = (darwinE + (((0.5 * crossCoeff) * invR) * invR));
                                }
                            }
                            if (yukOn) {
                                const muEff = (higgsOn ? (yukMu * Math.sqrt((modi_higgsMod * modj_higgsMod))) : yukMu);
                                const mur = (muEff * r);
                                if ((mur < 6.0)) {
                                    const yukPE = ((((((-YUKAWA_COUPLING) * yukModPair) * pi_mass) * pj_mass) * Math.exp((-mur))) * invR);
                                    pe = (pe + yukPE);
                                    if (onePNOn) {
                                        pe = (pe + (((((((0.5 * YUKAWA_COUPLING) * yukModPair) * pi_mass) * pj_mass) * Math.exp((-mur))) * invR) * ((viDotVj + ((viDotR * vjDotR) * ((1.0 + mur)))))));
                                    }
                                }
                            }
                        }
                    }
                    _b_stats[10] = pe;
                    _b_stats[11] = darwinE;
                    _b_stats[12] = darwinPx;
                    _b_stats[13] = darwinPy;
                }
            }
        }
    }
    entry["statsPE"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_statsPE(workgroups, bindings, domain, origin);
    };

    entryInfo["statsField"] = {"workgroupSize":[64,1,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":13,"optimizedWorkgroupReductionInits":0};
    function __entry_2_statsField(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_params = bindings.params;
        const _u_params_toggles0 = _b_params.toggles0;
        const _u_params_domainW = _b_params.domainW;
        const _u_params_domainH = _b_params.domainH;
        const _u_params_higgsMass = _b_params.higgsMass;
        const _u_params_axionMass = _b_params.axionMass;
        const _u_params_fieldGridRes = _b_params.fieldGridRes;
        const _b_stats = bindings.stats;
        const _b_higgsField = bindings.higgsField;
        const _b_higgsFieldDot = bindings.higgsFieldDot;
        const _b_axionField = bindings.axionField;
        const _b_axionFieldDot = bindings.axionFieldDot;
        const wg = Object.create(null);
        wg.sh_linearKE = new Float32Array(64);
        wg.sh_spinKE = new Float32Array(64);
        wg.sh_px = new Float32Array(64);
        wg.sh_py = new Float32Array(64);
        wg.sh_totalMass = new Float32Array(64);
        wg.sh_comX = new Float32Array(64);
        wg.sh_comY = new Float32Array(64);
        wg.sh_orbAngMom = new Float32Array(64);
        wg.sh_spinAngMom = new Float32Array(64);
        wg.sh_comXFinal = 0;
        wg.sh_comYFinal = 0;
        wg.sh_higgsE = new Float32Array(64);
        wg.sh_axionE = new Float32Array(64);
        wg.sh_fmx = new Float32Array(64);
        wg.sh_fmy = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_linearKE.fill(0);
            wg.sh_spinKE.fill(0);
            wg.sh_px.fill(0);
            wg.sh_py.fill(0);
            wg.sh_totalMass.fill(0);
            wg.sh_comX.fill(0);
            wg.sh_comY.fill(0);
            wg.sh_orbAngMom.fill(0);
            wg.sh_spinAngMom.fill(0);
            wg.sh_comXFinal = 0;
            wg.sh_comYFinal = 0;
            wg.sh_higgsE.fill(0);
            wg.sh_axionE.fill(0);
            wg.sh_fmx.fill(0);
            wg.sh_fmy.fill(0);
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        let _inl_33_result;
                        _inl_33: {
                            _inl_33_result = (((_u_params_toggles0 & HIGGS_BIT)) != 0);
                            break _inl_33;
                        }
                        const higgsOn = _inl_33_result;
                        let _inl_34_result;
                        _inl_34: {
                            _inl_34_result = (((_u_params_toggles0 & AXION_BIT)) != 0);
                            break _inl_34;
                        }
                        const axionOn = _inl_34_result;
                        const FGRID = _u_params_fieldGridRes;
                        const FGRID_SQ = (FGRID * FGRID);
                        let localHiggsE = 0.0;
                        let localAxionE = 0.0;
                        let localFmx = 0.0;
                        let localFmy = 0.0;
                        if ((((higgsOn || axionOn)) && (FGRID > 0))) {
                            const cellW = (_u_params_domainW / (+(FGRID)));
                            const cellH = (_u_params_domainH / (+(FGRID)));
                            const cellArea = (cellW * cellH);
                            const invCellWSq = (1.0 / ((cellW * cellW)));
                            const invCellHSq = (1.0 / ((cellH * cellH)));
                            const mH = _u_params_higgsMass;
                            const muSqH = ((0.5 * mH) * mH);
                            const vacOffsetH = (0.25 * muSqH);
                            const mA = _u_params_axionMass;
                            const mASq = (mA * mA);
                            const scaleX = (cellH * 0.5);
                            const scaleY = (cellW * 0.5);
                            let idx = tid;
                            while ((idx < FGRID_SQ)) {
                                const ix = (idx % FGRID);
                                const iy = (idx / FGRID);
                                const ixp = (((FGRID - 1)) < ((ix + 1)) ? ((FGRID - 1)) : ((ix + 1)));
                                const iyp = (((FGRID - 1)) < ((iy + 1)) ? ((FGRID - 1)) : ((iy + 1)));
                                const ixm = ((ix == 0) ? 0 : (ix - 1));
                                const iym = ((iy == 0) ? 0 : (iy - 1));
                                if (higgsOn) {
                                    const phi = _b_higgsField[idx];
                                    const phiDot = _b_higgsFieldDot[idx];
                                    const dfx = (_b_higgsField[((iyp * FGRID) + ix)] - _b_higgsField[((iym * FGRID) + ix)]);
                                    const dfy = (_b_higgsField[((iy * FGRID) + ixp)] - _b_higgsField[((iy * FGRID) + ixm)]);
                                    const ke = ((0.5 * phiDot) * phiDot);
                                    const grad = ((0.5 * ((((dfx * dfx) * invCellHSq) + ((dfy * dfy) * invCellWSq)))) * 0.25);
                                    const pot = ((muSqH * (((((-0.5) * phi) * phi) + ((((0.25 * phi) * phi) * phi) * phi)))) + vacOffsetH);
                                    localHiggsE = (localHiggsE + ((((ke + grad) + pot)) * cellArea));
                                    localFmx = (localFmx - ((phiDot * dfy) * scaleX));
                                    localFmy = (localFmy - ((phiDot * dfx) * scaleY));
                                }
                                if (axionOn) {
                                    const a = _b_axionField[idx];
                                    const aDot = _b_axionFieldDot[idx];
                                    const dfx = (_b_axionField[((iyp * FGRID) + ix)] - _b_axionField[((iym * FGRID) + ix)]);
                                    const dfy = (_b_axionField[((iy * FGRID) + ixp)] - _b_axionField[((iy * FGRID) + ixm)]);
                                    const ke = ((0.5 * aDot) * aDot);
                                    const grad = ((0.5 * ((((dfx * dfx) * invCellHSq) + ((dfy * dfy) * invCellWSq)))) * 0.25);
                                    const pot = (((0.5 * mASq) * a) * a);
                                    localAxionE = (localAxionE + ((((ke + grad) + pot)) * cellArea));
                                    localFmx = (localFmx - ((aDot * dfy) * scaleX));
                                    localFmy = (localFmy - ((aDot * dfx) * scaleY));
                                }
                                if ((higgsOn && axionOn)) {
                                    const phi = _b_higgsField[idx];
                                    const a = _b_axionField[idx];
                                    localHiggsE = (localHiggsE + ((((((0.5 * HIGGS_AXION_COUPLING) * phi) * phi) * a) * a) * cellArea));
                                }
                                idx = (idx + FLD_WG);
                            }
                        }
                        wg.sh_higgsE[((tid))] = localHiggsE;
                        wg.sh_axionE[((tid))] = localAxionE;
                        wg.sh_fmx[((tid))] = localFmx;
                        wg.sh_fmy[((tid))] = localFmy;
                    }
                }
            }
            for (let stride = (FLD_WG >> 1); (stride > 0); stride = (stride >> 1)) {
                {
                    const lz = 0;
                    const ly = 0;
                    for (let lx = 0; lx < Lx; lx++) {
                        const lid_x = lx;
                        {
                            const tid = lid_x;
                            const FGRID = _u_params_fieldGridRes;
                            const FGRID_SQ = (FGRID * FGRID);
                            if ((tid < stride)) {
                                wg.sh_higgsE[((tid))] = (wg.sh_higgsE[((tid))] + wg.sh_higgsE[(((tid + stride)))]);
                                wg.sh_axionE[((tid))] = (wg.sh_axionE[((tid))] + wg.sh_axionE[(((tid + stride)))]);
                                wg.sh_fmx[((tid))] = (wg.sh_fmx[((tid))] + wg.sh_fmx[(((tid + stride)))]);
                                wg.sh_fmy[((tid))] = (wg.sh_fmy[((tid))] + wg.sh_fmy[(((tid + stride)))]);
                            }
                        }
                    }
                }
            }
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid_x = lx;
                    {
                        const tid = lid_x;
                        const FGRID = _u_params_fieldGridRes;
                        const FGRID_SQ = (FGRID * FGRID);
                        if ((tid == 0)) {
                            _b_stats[14] = wg.sh_higgsE[((0))];
                            _b_stats[15] = wg.sh_axionE[((0))];
                            _b_stats[18] = wg.sh_fmx[((0))];
                            _b_stats[19] = wg.sh_fmy[((0))];
                        }
                    }
                }
            }
        }
    }
    entry["statsField"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_statsField(workgroups, bindings, domain, origin);
    };

    entryInfo["statsPFISel"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":13,"optimizedWorkgroupReductionInits":0};
    function __entry_3_statsPFISel(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_params = bindings.params;
        const _u_params_aliveCount = _b_params.aliveCount;
        const _u_params_selectedIdx = _b_params.selectedIdx;
        const _u_params_toggles0 = _b_params.toggles0;
        const _u_params_domainW = _b_params.domainW;
        const _u_params_domainH = _b_params.domainH;
        const _u_params_fieldGridRes = _b_params.fieldGridRes;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_forces = bindings.forces;
        const _b_stats = bindings.stats;
        const _b_higgsField = bindings.higgsField;
        const _b_axionField = bindings.axionField;
        const wg = Object.create(null);
        wg.sh_linearKE = new Float32Array(64);
        wg.sh_spinKE = new Float32Array(64);
        wg.sh_px = new Float32Array(64);
        wg.sh_py = new Float32Array(64);
        wg.sh_totalMass = new Float32Array(64);
        wg.sh_comX = new Float32Array(64);
        wg.sh_comY = new Float32Array(64);
        wg.sh_orbAngMom = new Float32Array(64);
        wg.sh_spinAngMom = new Float32Array(64);
        wg.sh_comXFinal = 0;
        wg.sh_comYFinal = 0;
        wg.sh_higgsE = new Float32Array(64);
        wg.sh_axionE = new Float32Array(64);
        wg.sh_fmx = new Float32Array(64);
        wg.sh_fmy = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_linearKE.fill(0);
            wg.sh_spinKE.fill(0);
            wg.sh_px.fill(0);
            wg.sh_py.fill(0);
            wg.sh_totalMass.fill(0);
            wg.sh_comX.fill(0);
            wg.sh_comY.fill(0);
            wg.sh_orbAngMom.fill(0);
            wg.sh_spinAngMom.fill(0);
            wg.sh_comXFinal = 0;
            wg.sh_comYFinal = 0;
            wg.sh_higgsE.fill(0);
            wg.sh_axionE.fill(0);
            wg.sh_fmx.fill(0);
            wg.sh_fmy.fill(0);
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    const n = _u_params_aliveCount;
                    let _inl_35_result;
                    _inl_35: {
                        _inl_35_result = (((_u_params_toggles0 & COULOMB_BIT)) != 0);
                        break _inl_35;
                    }
                    const coulOn = _inl_35_result;
                    let _inl_36_result;
                    _inl_36: {
                        _inl_36_result = (((_u_params_toggles0 & YUKAWA_BIT)) != 0);
                        break _inl_36;
                    }
                    const yukOn = _inl_36_result;
                    let _inl_37_result;
                    _inl_37: {
                        _inl_37_result = (((_u_params_toggles0 & HIGGS_BIT)) != 0);
                        break _inl_37;
                    }
                    const higgsOn = _inl_37_result;
                    let _inl_38_result;
                    _inl_38: {
                        _inl_38_result = (((_u_params_toggles0 & AXION_BIT)) != 0);
                        break _inl_38;
                    }
                    const axionOn = _inl_38_result;
                    const FGRID = _u_params_fieldGridRes;
                    let higgsPfiE = 0.0;
                    let axionPfiE = 0.0;
                    if ((((higgsOn || axionOn)) && (FGRID > 0))) {
                        const cellW = (_u_params_domainW / (+(FGRID)));
                        const cellH = (_u_params_domainH / (+(FGRID)));
                        const invCellW = (1.0 / cellW);
                        const invCellH = (1.0 / cellH);
                        for (let i = 0; (i < n); i++) {
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
                            if ((((p_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const gx = ((p_posX * invCellW) - 0.5);
                            const gy = ((p_posY * invCellH) - 0.5);
                            const ix0 = ((Math.floor(gx)) | 0);
                            const iy0 = ((Math.floor(gy)) | 0);
                            const fx = (gx - (+(ix0)));
                            const fy = (gy - (+(iy0)));
                            let wx = Array.from({ length: 4 }, () => 0);
                            let wy = Array.from({ length: 4 }, () => 0);
                            const fx2 = (fx * fx);
                            const fx3 = (fx2 * fx);
                            wx[0] = (((((1.0 - (3.0 * fx)) + (3.0 * fx2)) - fx3)) / 6.0);
                            wx[1] = ((((4.0 - (6.0 * fx2)) + (3.0 * fx3))) / 6.0);
                            wx[2] = (((((1.0 + (3.0 * fx)) + (3.0 * fx2)) - (3.0 * fx3))) / 6.0);
                            wx[3] = (fx3 / 6.0);
                            const fy2 = (fy * fy);
                            const fy3 = (fy2 * fy);
                            wy[0] = (((((1.0 - (3.0 * fy)) + (3.0 * fy2)) - fy3)) / 6.0);
                            wy[1] = ((((4.0 - (6.0 * fy2)) + (3.0 * fy3))) / 6.0);
                            wy[2] = (((((1.0 + (3.0 * fy)) + (3.0 * fy2)) - (3.0 * fy3))) / 6.0);
                            wy[3] = (fy3 / 6.0);
                            let higgsVal = 0.0;
                            let axionVal = 0.0;
                            for (let dy = 0; (dy < 4); dy++) {
                                const ny = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(((iy0 + dy) - 1), 0, (((FGRID) | 0) - 1)));
                                const wwy = wy[dy];
                                for (let dx = 0; (dx < 4); dx++) {
                                    const nx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(((ix0 + dx) - 1), 0, (((FGRID) | 0) - 1)));
                                    const w = (wx[dx] * wwy);
                                    const ci = ((((ny) >>> 0) * FGRID) + ((nx) >>> 0));
                                    if (higgsOn) {
                                        higgsVal = (higgsVal + (_b_higgsField[ci] * w));
                                    }
                                    if (axionOn) {
                                        axionVal = (axionVal + (_b_axionField[ci] * w));
                                    }
                                }
                            }
                            if (higgsOn) {
                                higgsPfiE = (higgsPfiE - (p_baseMass * ((Math.abs(higgsVal) - 1.0))));
                            }
                            if (axionOn) {
                                const isAnti = (((p_flags & FLAG_ANTIMATTER)) != 0);
                                if (coulOn) {
                                    axionPfiE = (axionPfiE - (((AXION_COUPLING * p_charge) * p_charge) * axionVal));
                                }
                                if (yukOn) {
                                    const sign = (isAnti ? (-1.0) : 1.0);
                                    axionPfiE = (axionPfiE - (((AXION_COUPLING * p_mass) * sign) * axionVal));
                                }
                            }
                        }
                    }
                    _b_stats[16] = higgsPfiE;
                    _b_stats[17] = axionPfiE;
                    const selIdx = _u_params_selectedIdx;
                    if (((selIdx >= 0) && (((selIdx) >>> 0) < n))) {
                        const si = ((selIdx) >>> 0);
                        const _sroa_12_base = ((si) * 9);
                        const p_posX = _b_particles[_sroa_12_base + 0];
                        const p_posY = _b_particles[_sroa_12_base + 1];
                        const p_velWX = _b_particles[_sroa_12_base + 2];
                        const p_velWY = _b_particles[_sroa_12_base + 3];
                        const p_mass = _b_particles[_sroa_12_base + 4];
                        const p_charge = _b_particles[_sroa_12_base + 5];
                        const p_angW = _b_particles[_sroa_12_base + 6];
                        const p_baseMass = _b_particles[_sroa_12_base + 7];
                        const p_flags = _b_particles[_sroa_12_base + 8];
                        const _sroa_13_base = ((si) * 8);
                        const d_magMoment = _b_derived[_sroa_13_base + 0];
                        const d_angMomentum = _b_derived[_sroa_13_base + 1];
                        const d_invMass = _b_derived[_sroa_13_base + 2];
                        const d_radiusSq = _b_derived[_sroa_13_base + 3];
                        const d_velX = _b_derived[_sroa_13_base + 4];
                        const d_velY = _b_derived[_sroa_13_base + 5];
                        const d_angVel = _b_derived[_sroa_13_base + 6];
                        const d_bodyRSq = _b_derived[_sroa_13_base + 7];
                        const _sroa_14_base = ((si) * 40);
                        const af_f0_x = _b_forces[_sroa_14_base + 0];
                        const af_f0_y = _b_forces[_sroa_14_base + 1];
                        const af_f0_z = _b_forces[_sroa_14_base + 2];
                        const af_f0_w = _b_forces[_sroa_14_base + 3];
                        const af_f1_x = _b_forces[_sroa_14_base + 4];
                        const af_f1_y = _b_forces[_sroa_14_base + 5];
                        const af_f1_z = _b_forces[_sroa_14_base + 6];
                        const af_f1_w = _b_forces[_sroa_14_base + 7];
                        const af_f2_x = _b_forces[_sroa_14_base + 8];
                        const af_f2_y = _b_forces[_sroa_14_base + 9];
                        const af_f2_z = _b_forces[_sroa_14_base + 10];
                        const af_f2_w = _b_forces[_sroa_14_base + 11];
                        const af_f3_x = _b_forces[_sroa_14_base + 12];
                        const af_f3_y = _b_forces[_sroa_14_base + 13];
                        const af_f3_z = _b_forces[_sroa_14_base + 14];
                        const af_f3_w = _b_forces[_sroa_14_base + 15];
                        const af_f4_x = _b_forces[_sroa_14_base + 16];
                        const af_f4_y = _b_forces[_sroa_14_base + 17];
                        const af_f4_z = _b_forces[_sroa_14_base + 18];
                        const af_f4_w = _b_forces[_sroa_14_base + 19];
                        const af_f5_x = _b_forces[_sroa_14_base + 20];
                        const af_f5_y = _b_forces[_sroa_14_base + 21];
                        const af_f5_z = _b_forces[_sroa_14_base + 22];
                        const af_f5_w = _b_forces[_sroa_14_base + 23];
                        const af_torques_x = _b_forces[_sroa_14_base + 24];
                        const af_torques_y = _b_forces[_sroa_14_base + 25];
                        const af_torques_z = _b_forces[_sroa_14_base + 26];
                        const af_torques_w = _b_forces[_sroa_14_base + 27];
                        const af_bFields_x = _b_forces[_sroa_14_base + 28];
                        const af_bFields_y = _b_forces[_sroa_14_base + 29];
                        const af_bFields_z = _b_forces[_sroa_14_base + 30];
                        const af_bFields_w = _b_forces[_sroa_14_base + 31];
                        const af_bFieldGrads_x = _b_forces[_sroa_14_base + 32];
                        const af_bFieldGrads_y = _b_forces[_sroa_14_base + 33];
                        const af_bFieldGrads_z = _b_forces[_sroa_14_base + 34];
                        const af_bFieldGrads_w = _b_forces[_sroa_14_base + 35];
                        const af_totalForce_x = _b_forces[_sroa_14_base + 36];
                        const af_totalForce_y = _b_forces[_sroa_14_base + 37];
                        const af_jerk_x = _b_forces[_sroa_14_base + 38];
                        const af_jerk_y = _b_forces[_sroa_14_base + 39];
                        _b_stats[32] = p_posX;
                        _b_stats[33] = p_posY;
                        _b_stats[34] = p_velWX;
                        _b_stats[35] = p_velWY;
                        _b_stats[36] = p_mass;
                        _b_stats[37] = p_charge;
                        _b_stats[38] = p_angW;
                        _b_stats[39] = p_baseMass;
                        _b_stats[40] = rt.bitcast_f32_u32(p_flags);
                        _b_stats[41] = Math.sqrt(d_radiusSq);
                        _b_stats[42] = d_velX;
                        _b_stats[43] = d_velY;
                        _b_stats[44] = d_angVel;
                        _b_stats[45] = d_magMoment;
                        _b_stats[46] = d_angMomentum;
                        _b_stats[47] = ((((p_flags & FLAG_ANTIMATTER)) != 0) ? 1.0 : 0.0);
                        _b_stats[48] = af_f0_x;
                        _b_stats[49] = af_f0_y;
                        _b_stats[50] = af_f0_z;
                        _b_stats[51] = af_f0_w;
                        _b_stats[52] = af_f1_x;
                        _b_stats[53] = af_f1_y;
                        _b_stats[54] = af_f1_z;
                        _b_stats[55] = af_f1_w;
                        _b_stats[56] = af_f2_x;
                        _b_stats[57] = af_f2_y;
                        _b_stats[58] = af_f2_z;
                        _b_stats[59] = af_f2_w;
                        _b_stats[60] = af_f3_x;
                        _b_stats[61] = af_f3_y;
                        _b_stats[62] = af_f3_z;
                        _b_stats[63] = af_f3_w;
                        _b_stats[64] = af_f4_x;
                        _b_stats[65] = af_f4_y;
                        _b_stats[66] = af_f4_z;
                        _b_stats[67] = af_f4_w;
                        _b_stats[68] = af_f5_x;
                        _b_stats[69] = af_f5_y;
                    } else {
                        _b_stats[36] = (-1.0);
                    }
                }
            }
        }
    }
    entry["statsPFISel"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_statsPFISel(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["statsKEMom"] = function (workgroups, domain, origin) {
            return __entry_0_statsKEMom(workgroups, bindings, domain, origin);
        };
        bound["statsPE"] = function (workgroups, domain, origin) {
            return __entry_1_statsPE(workgroups, bindings, domain, origin);
        };
        bound["statsField"] = function (workgroups, domain, origin) {
            return __entry_2_statsField(workgroups, bindings, domain, origin);
        };
        bound["statsPFISel"] = function (workgroups, domain, origin) {
            return __entry_3_statsPFISel(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["params","particles","derived","forces","stats","axYukMod","higgsField","higgsFieldDot","axionField","axionFieldDot"], entryInfo };
}
