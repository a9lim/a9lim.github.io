// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/tree-build.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 81515e28652dc20b79aa93062d2fe40f93fa8a953f5c7c6c9fa62277377cc84b
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":36478,"lines":835,"rtVec":0,"rtPoly":0,"rtAtomic":1,"rtNumeric":0,"fround":0,"hypot":0,"iife":12,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.901Z
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
    const QT_CAPACITY = 1;
    const LOCK_BIT = (-2147483648);
    const FP_SCALE = 65536.0;
    const FP_INV_SCALE = 0.0000152587890625;

    function nodeOffset(idx) {
        return (idx * NODE_STRIDE);
    }

    function getMinX(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[nodeOffset(idx)]);
    }

    function getMinY(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 1)]);
    }

    function getMaxX(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 2)]);
    }

    function getMaxY(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 3)]);
    }

    function getComX(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 4)]);
    }

    function getComY(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 5)]);
    }

    function getTotalMass(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 6)]);
    }

    function getTotalCharge(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 7)]);
    }

    function getTotalMagMoment(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 8)]);
    }

    function getTotalAngMomentum(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 9)]);
    }

    function getTotalMomX(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 10)]);
    }

    function getTotalMomY(idx) {
        return rt.bitcast_f32_u32(bindings.nodes[(nodeOffset(idx) + 11)]);
    }

    function getNW(idx) {
        return rt.bitcast_i32_u32(bindings.nodes[(nodeOffset(idx) + 12)]);
    }

    function getNE(idx) {
        return rt.bitcast_i32_u32(bindings.nodes[(nodeOffset(idx) + 13)]);
    }

    function getSW(idx) {
        return rt.bitcast_i32_u32(bindings.nodes[(nodeOffset(idx) + 14)]);
    }

    function getSE(idx) {
        return rt.bitcast_i32_u32(bindings.nodes[(nodeOffset(idx) + 15)]);
    }

    function setMinX(idx, v) {
        void (bindings.nodes[nodeOffset(idx)] = rt.bitcast_u32_f32(v));
    }

    function setMinY(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 1)] = rt.bitcast_u32_f32(v));
    }

    function setMaxX(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 2)] = rt.bitcast_u32_f32(v));
    }

    function setMaxY(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 3)] = rt.bitcast_u32_f32(v));
    }

    function setComX(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 4)] = rt.bitcast_u32_f32(v));
    }

    function setComY(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 5)] = rt.bitcast_u32_f32(v));
    }

    function setTotalMass(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 6)] = rt.bitcast_u32_f32(v));
    }

    function setTotalCharge(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 7)] = rt.bitcast_u32_f32(v));
    }

    function setTotalMagMoment(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 8)] = rt.bitcast_u32_f32(v));
    }

    function setTotalAngMomentum(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 9)] = rt.bitcast_u32_f32(v));
    }

    function setTotalMomX(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 10)] = rt.bitcast_u32_f32(v));
    }

    function setTotalMomY(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 11)] = rt.bitcast_u32_f32(v));
    }

    function setNW(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 12)] = rt.bitcast_u32_i32(v));
    }

    function setNE(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 13)] = rt.bitcast_u32_i32(v));
    }

    function setSW(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 14)] = rt.bitcast_u32_i32(v));
    }

    function setSE(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 15)] = rt.bitcast_u32_i32(v));
    }

    function getParentIndex(idx) {
        return rt.bitcast_i32_u32(bindings.nodes[(nodeOffset(idx) + 18)]);
    }

    function setParentIndex(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 18)] = rt.bitcast_u32_i32(v));
    }

    function casParticleIndex(idx, expected, desired) {
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = (idx * NODE_STRIDE);
            break _inl_24;
        }
        const offset = (_inl_24_result + 16);
        const result = rt.atomicCompareExchangeWeakAt(bindings.nodes, offset, rt.bitcast_u32_i32(expected), rt.bitcast_u32_i32(desired));
        return rt.bitcast_i32_f32(result.old_value);
    }

    function setParticleIndex(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 16)] = rt.bitcast_u32_i32(v));
    }

    function setParticleCount(idx, v) {
        void (bindings.nodes[(nodeOffset(idx) + 17)] = v);
    }

    function atomicAddParticleCount(idx, delta) {
        return (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.nodes, (nodeOffset(idx) + 17), delta));
    }

    function allocNode() {
        const idx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.nodeCounter, 0, 1));
        if ((idx >= QT_MAX_NODES)) {
            return 0;
        }
        return idx;
    }

    function childFor(nodeIdx, px, py) {
        const cx = (((getMinX(nodeIdx) + getMaxX(nodeIdx))) * 0.5);
        const cy = (((getMinY(nodeIdx) + getMaxY(nodeIdx))) * 0.5);
        if ((py <= cy)) {
            if ((px <= cx)) {
                return ((getNW(nodeIdx)) >>> 0);
            } else {
                return ((getNE(nodeIdx)) >>> 0);
            }
        } else {
            if ((px <= cx)) {
                return ((getSW(nodeIdx)) >>> 0);
            } else {
                return ((getSE(nodeIdx)) >>> 0);
            }
        }
    }

    function subdivide(nodeIdx) {
        const minX = getMinX(nodeIdx);
        const minY = getMinY(nodeIdx);
        const maxX = getMaxX(nodeIdx);
        const maxY = getMaxY(nodeIdx);
        const cx = (((minX + maxX)) * 0.5);
        const cy = (((minY + maxY)) * 0.5);
        const nw = allocNode();
        const ne = allocNode();
        const sw = allocNode();
        const se = allocNode();
        if (((((nw == 0) || (ne == 0)) || (sw == 0)) || (se == 0))) {
            return;
        }
        setMinX(nw, minX);
        setMinY(nw, minY);
        setMaxX(nw, cx);
        setMaxY(nw, cy);
        setNW(nw, NONE);
        setNE(nw, NONE);
        setSW(nw, NONE);
        setSE(nw, NONE);
        setParticleIndex(nw, NONE);
        setParticleCount(nw, 0);
        setParentIndex(nw, ((nodeIdx) | 0));
        setTotalMass(nw, 0.0);
        setTotalCharge(nw, 0.0);
        setTotalMagMoment(nw, 0.0);
        setTotalAngMomentum(nw, 0.0);
        setTotalMomX(nw, 0.0);
        setTotalMomY(nw, 0.0);
        setMinX(ne, cx);
        setMinY(ne, minY);
        setMaxX(ne, maxX);
        setMaxY(ne, cy);
        setNW(ne, NONE);
        setNE(ne, NONE);
        setSW(ne, NONE);
        setSE(ne, NONE);
        setParticleIndex(ne, NONE);
        setParticleCount(ne, 0);
        setParentIndex(ne, ((nodeIdx) | 0));
        setTotalMass(ne, 0.0);
        setTotalCharge(ne, 0.0);
        setTotalMagMoment(ne, 0.0);
        setTotalAngMomentum(ne, 0.0);
        setTotalMomX(ne, 0.0);
        setTotalMomY(ne, 0.0);
        setMinX(sw, minX);
        setMinY(sw, cy);
        setMaxX(sw, cx);
        setMaxY(sw, maxY);
        setNW(sw, NONE);
        setNE(sw, NONE);
        setSW(sw, NONE);
        setSE(sw, NONE);
        setParticleIndex(sw, NONE);
        setParticleCount(sw, 0);
        setParentIndex(sw, ((nodeIdx) | 0));
        setTotalMass(sw, 0.0);
        setTotalCharge(sw, 0.0);
        setTotalMagMoment(sw, 0.0);
        setTotalAngMomentum(sw, 0.0);
        setTotalMomX(sw, 0.0);
        setTotalMomY(sw, 0.0);
        setMinX(se, cx);
        setMinY(se, cy);
        setMaxX(se, maxX);
        setMaxY(se, maxY);
        setNW(se, NONE);
        setNE(se, NONE);
        setSW(se, NONE);
        setSE(se, NONE);
        setParticleIndex(se, NONE);
        setParticleCount(se, 0);
        setParentIndex(se, ((nodeIdx) | 0));
        setTotalMass(se, 0.0);
        setTotalCharge(se, 0.0);
        setTotalMagMoment(se, 0.0);
        setTotalAngMomentum(se, 0.0);
        setTotalMomX(se, 0.0);
        setTotalMomY(se, 0.0);
        setNW(nodeIdx, ((nw) | 0));
        setNE(nodeIdx, ((ne) | 0));
        setSW(nodeIdx, ((sw) | 0));
        setSE(nodeIdx, ((se) | 0));
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["computeBounds"] = {"workgroupSize":[256,1,1],"phases":3,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_computeBounds(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 256, Ly = 1, Lz = 1;
        const _b_bounds = bindings.bounds;
        const _b_particleState = bindings.particleState;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
        const wg = Object.create(null);
        wg.wgMinX = 0;
        wg.wgMinY = 0;
        wg.wgMaxX = 0;
        wg.wgMaxY = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.wgMinX = 0;
            wg.wgMinY = 0;
            wg.wgMaxX = 0;
            wg.wgMaxY = 0;
            // Phase 0
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    const lid_x = lx;
                    {
                        const idx = gid_x;
                        const n = _u_uniforms_particleCount;
                        if ((lid_x == 0)) {
                            void (wg["wgMinX"] = 2147483647);
                            void (wg["wgMinY"] = 2147483647);
                            void (wg["wgMaxX"] = (-2147483647));
                            void (wg["wgMaxY"] = (-2147483647));
                        }
                    }
                }
            }
            // Phase 1
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    const lid_x = lx;
                    {
                        const idx = gid_x;
                        const n = _u_uniforms_particleCount;
                        if ((idx < n)) {
                            const _sroa_0_base = ((idx) * 9);
                            const ps_posX = _b_particleState[_sroa_0_base + 0];
                            const ps_posY = _b_particleState[_sroa_0_base + 1];
                            const ps_velWX = _b_particleState[_sroa_0_base + 2];
                            const ps_velWY = _b_particleState[_sroa_0_base + 3];
                            const ps_mass = _b_particleState[_sroa_0_base + 4];
                            const ps_charge = _b_particleState[_sroa_0_base + 5];
                            const ps_angW = _b_particleState[_sroa_0_base + 6];
                            const ps_baseMass = _b_particleState[_sroa_0_base + 7];
                            const ps_flags = _b_particleState[_sroa_0_base + 8];
                            const isAliveOrGhost = (((ps_flags & ((FLAG_ALIVE | FLAG_GHOST)))) != 0);
                            const isRetired = ((((ps_flags & FLAG_RETIRED)) != 0) && (((ps_flags & FLAG_ALIVE)) == 0));
                            if ((isAliveOrGhost || isRetired)) {
                                const px = (((ps_posX * FP_SCALE)) | 0);
                                const py = (((ps_posY * FP_SCALE)) | 0);
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(wg, "wgMinX", px));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(wg, "wgMinY", py));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "wgMaxX", px));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "wgMaxY", py));
                            }
                        }
                    }
                }
            }
            // Phase 2
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    const lid_x = lx;
                    {
                        const idx = gid_x;
                        const n = _u_uniforms_particleCount;
                        if ((lid_x == 0)) {
                            (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(_b_bounds, 0, wg["wgMinX"]));
                            (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(_b_bounds, 1, wg["wgMinY"]));
                            (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_bounds, 2, wg["wgMaxX"]));
                            (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_bounds, 3, wg["wgMaxY"]));
                        }
                    }
                }
            }
        }
    }
    entry["computeBounds"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_computeBounds(workgroups, bindings, domain, origin);
    };

    entryInfo["initRoot"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_initRoot(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_bounds = bindings.bounds;
        const wg = Object.create(null);
        wg.wgMinX = 0;
        wg.wgMinY = 0;
        wg.wgMaxX = 0;
        wg.wgMaxY = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.wgMinX = 0;
            wg.wgMinY = 0;
            wg.wgMaxX = 0;
            wg.wgMaxY = 0;
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    const minX = ((+(_b_bounds[0])) * FP_INV_SCALE);
                    const minY = ((+(_b_bounds[1])) * FP_INV_SCALE);
                    const maxX = ((+(_b_bounds[2])) * FP_INV_SCALE);
                    const maxY = ((+(_b_bounds[3])) * FP_INV_SCALE);
                    const padX = ((((maxX - minX)) * 0.1) + 1.0);
                    const padY = ((((maxY - minY)) * 0.1) + 1.0);
                    setMinX(0, (minX - padX));
                    setMinY(0, (minY - padY));
                    setMaxX(0, (maxX + padX));
                    setMaxY(0, (maxY + padY));
                    setNW(0, NONE);
                    setNE(0, NONE);
                    setSW(0, NONE);
                    setSE(0, NONE);
                    setParticleIndex(0, NONE);
                    setParticleCount(0, 0);
                    setParentIndex(0, NONE);
                    setTotalMass(0, 0.0);
                    setTotalCharge(0, 0.0);
                    setTotalMagMoment(0, 0.0);
                    setTotalAngMomentum(0, 0.0);
                    setTotalMomX(0, 0.0);
                    setTotalMomY(0, 0.0);
                }
            }
        }
    }
    entry["initRoot"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_initRoot(workgroups, bindings, domain, origin);
    };

    entryInfo["insertParticles"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_insertParticles(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_visitorFlags = bindings.visitorFlags;
        const _b_particleState = bindings.particleState;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
        const wg = Object.create(null);
        wg.wgMinX = 0;
        wg.wgMinY = 0;
        wg.wgMaxX = 0;
        wg.wgMaxY = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.wgMinX = 0;
            wg.wgMinY = 0;
            wg.wgMaxX = 0;
            wg.wgMaxY = 0;
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    __invocation: {
                        const pIdx = gid_x;
                        const n = _u_uniforms_particleCount;
                        if ((pIdx >= n)) {
                            break __invocation;
                        }
                        const _sroa_1_base = ((pIdx) * 9);
                        const ps_posX = _b_particleState[_sroa_1_base + 0];
                        const ps_posY = _b_particleState[_sroa_1_base + 1];
                        const ps_velWX = _b_particleState[_sroa_1_base + 2];
                        const ps_velWY = _b_particleState[_sroa_1_base + 3];
                        const ps_mass = _b_particleState[_sroa_1_base + 4];
                        const ps_charge = _b_particleState[_sroa_1_base + 5];
                        const ps_angW = _b_particleState[_sroa_1_base + 6];
                        const ps_baseMass = _b_particleState[_sroa_1_base + 7];
                        const ps_flags = _b_particleState[_sroa_1_base + 8];
                        const isAliveOrGhost = (((ps_flags & ((FLAG_ALIVE | FLAG_GHOST)))) != 0);
                        const isRetired = ((((ps_flags & FLAG_RETIRED)) != 0) && (((ps_flags & FLAG_ALIVE)) == 0));
                        if (((!isAliveOrGhost) && (!isRetired))) {
                            break __invocation;
                        }
                        const px = ps_posX;
                        const py = ps_posY;
                        let cur = 0;
                        let depth = 0;
                        while (true) {
                            if ((depth >= MAX_DEPTH)) {
                                break;
                            }
                            const prev = casParticleIndex(cur, NONE, ((pIdx) | 0));
                            if ((prev == NONE)) {
                                setParticleCount(cur, 1);
                                const parentIdx = getParentIndex(cur);
                                if ((parentIdx >= 0)) {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_visitorFlags, ((parentIdx) >>> 0), 1));
                                }
                                break;
                            }
                            const prevUnlocked = (prev & (~LOCK_BIT));
                            if (((prevUnlocked >= 0) && (getNW(cur) == NONE))) {
                                const lockResult = casParticleIndex(cur, prev, (prev | LOCK_BIT));
                                if ((lockResult == prev)) {
                                    subdivide(cur);
                                    const displacedIdx = ((prev) >>> 0);
                                    const _sroa_2_base = ((displacedIdx) * 9);
                                    const displacedPs_posX = _b_particleState[_sroa_2_base + 0];
                                    const displacedPs_posY = _b_particleState[_sroa_2_base + 1];
                                    const displacedPs_velWX = _b_particleState[_sroa_2_base + 2];
                                    const displacedPs_velWY = _b_particleState[_sroa_2_base + 3];
                                    const displacedPs_mass = _b_particleState[_sroa_2_base + 4];
                                    const displacedPs_charge = _b_particleState[_sroa_2_base + 5];
                                    const displacedPs_angW = _b_particleState[_sroa_2_base + 6];
                                    const displacedPs_baseMass = _b_particleState[_sroa_2_base + 7];
                                    const displacedPs_flags = _b_particleState[_sroa_2_base + 8];
                                    setParticleCount(cur, 0);
                                    const childForDisplaced = childFor(cur, displacedPs_posX, displacedPs_posY);
                                    setParticleIndex(childForDisplaced, ((displacedIdx) | 0));
                                    setParticleCount(childForDisplaced, 1);
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_visitorFlags, cur, 1));
                                    setParticleIndex(cur, NONE);
                                    cur = childFor(cur, px, py);
                                    depth = (depth + 1);
                                    continue;
                                }
                            }
                            if ((getNW(cur) != NONE)) {
                                cur = childFor(cur, px, py);
                                depth = (depth + 1);
                            }
                        }
                    }
                }
            }
        }
    }
    entry["insertParticles"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_insertParticles(workgroups, bindings, domain, origin);
    };

    entryInfo["computeAggregates"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_computeAggregates(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_visitorFlags = bindings.visitorFlags;
        const _b_particleState = bindings.particleState;
        const _b_derived_in = bindings.derived_in;
        const _b_particleAux = bindings.particleAux;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_particleCount = _b_uniforms.particleCount;
        const wg = Object.create(null);
        wg.wgMinX = 0;
        wg.wgMinY = 0;
        wg.wgMaxX = 0;
        wg.wgMaxY = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.wgMinX = 0;
            wg.wgMinY = 0;
            wg.wgMaxX = 0;
            wg.wgMaxY = 0;
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    __invocation: {
                        const pIdx = gid_x;
                        const n = _u_uniforms_particleCount;
                        if ((pIdx >= n)) {
                            break __invocation;
                        }
                        const _sroa_3_base = ((pIdx) * 9);
                        const ps_posX = _b_particleState[_sroa_3_base + 0];
                        const ps_posY = _b_particleState[_sroa_3_base + 1];
                        const ps_velWX = _b_particleState[_sroa_3_base + 2];
                        const ps_velWY = _b_particleState[_sroa_3_base + 3];
                        const ps_mass = _b_particleState[_sroa_3_base + 4];
                        const ps_charge = _b_particleState[_sroa_3_base + 5];
                        const ps_angW = _b_particleState[_sroa_3_base + 6];
                        const ps_baseMass = _b_particleState[_sroa_3_base + 7];
                        const ps_flags = _b_particleState[_sroa_3_base + 8];
                        const isAliveOrGhost = (((ps_flags & ((FLAG_ALIVE | FLAG_GHOST)))) != 0);
                        const isRetired = ((((ps_flags & FLAG_RETIRED)) != 0) && (((ps_flags & FLAG_ALIVE)) == 0));
                        if (((!isAliveOrGhost) && (!isRetired))) {
                            break __invocation;
                        }
                        const px = ps_posX;
                        const py = ps_posY;
                        let leafNode = 0;
                        let depth = 0;
                        while (true) {
                            if ((depth >= MAX_DEPTH)) {
                                break;
                            }
                            if ((getNW(leafNode) == NONE)) {
                                break;
                            }
                            leafNode = childFor(leafNode, px, py);
                            depth = (depth + 1);
                        }
                        let m = 0;
                        let q = 0;
                        let mm = 0;
                        let am = 0;
                        let wx = 0;
                        let wy = 0;
                        if (isRetired) {
                            const _sroa_4_base = ((pIdx) * 5);
                            const aux_radius = _b_particleAux[_sroa_4_base + 0];
                            const aux_particleId = _b_particleAux[_sroa_4_base + 1];
                            const aux_deathTime = _b_particleAux[_sroa_4_base + 2];
                            const aux_deathMass = _b_particleAux[_sroa_4_base + 3];
                            const aux_deathAngVel = _b_particleAux[_sroa_4_base + 4];
                            m = aux_deathMass;
                            q = ps_charge;
                            const bodyRadSq = Math.pow(m, 0.6666666666666666);
                            const dAngW = aux_deathAngVel;
                            const dAngWSq = (dAngW * dAngW);
                            const dAngVel = (dAngW / Math.sqrt((1.0 + (dAngWSq * bodyRadSq))));
                            mm = (((MAG_MOMENT_K * q) * dAngVel) * bodyRadSq);
                            am = (((INERTIA_K * m) * dAngVel) * bodyRadSq);
                            wx = 0.0;
                            wy = 0.0;
                        } else {
                            m = ps_mass;
                            q = ps_charge;
                            const _sroa_5_base = ((pIdx) * 8);
                            const drvd_magMoment = _b_derived_in[_sroa_5_base + 0];
                            const drvd_angMomentum = _b_derived_in[_sroa_5_base + 1];
                            const drvd_invMass = _b_derived_in[_sroa_5_base + 2];
                            const drvd_radiusSq = _b_derived_in[_sroa_5_base + 3];
                            const drvd_velX = _b_derived_in[_sroa_5_base + 4];
                            const drvd_velY = _b_derived_in[_sroa_5_base + 5];
                            const drvd_angVel = _b_derived_in[_sroa_5_base + 6];
                            const drvd_bodyRSq = _b_derived_in[_sroa_5_base + 7];
                            mm = drvd_magMoment;
                            am = drvd_angMomentum;
                            wx = ps_velWX;
                            wy = ps_velWY;
                        }
                        setTotalMass(leafNode, m);
                        setTotalCharge(leafNode, q);
                        setTotalMagMoment(leafNode, mm);
                        setTotalAngMomentum(leafNode, am);
                        setTotalMomX(leafNode, (m * wx));
                        setTotalMomY(leafNode, (m * wy));
                        if ((m > 0.0)) {
                            setComX(leafNode, px);
                            setComY(leafNode, py);
                        }
                        let curNode = getParentIndex(leafNode);
                        while (true) {
                            if ((curNode < 0)) {
                                break;
                            }
                            const nodeU = ((curNode) >>> 0);
                            const expectedVisitors = _b_visitorFlags[nodeU];
                            const prev = atomicAddParticleCount(nodeU, 1);
                            if ((prev < (expectedVisitors - 1))) {
                                break;
                            }
                            const c0 = ((getNW(nodeU)) >>> 0);
                            const c1 = ((getNE(nodeU)) >>> 0);
                            const c2 = ((getSW(nodeU)) >>> 0);
                            const c3 = ((getSE(nodeU)) >>> 0);
                            const m0 = getTotalMass(c0);
                            const m1 = getTotalMass(c1);
                            const m2 = getTotalMass(c2);
                            const m3 = getTotalMass(c3);
                            const totalM = (((m0 + m1) + m2) + m3);
                            setTotalMass(nodeU, totalM);
                            setTotalCharge(nodeU, (((getTotalCharge(c0) + getTotalCharge(c1)) + getTotalCharge(c2)) + getTotalCharge(c3)));
                            setTotalMagMoment(nodeU, (((getTotalMagMoment(c0) + getTotalMagMoment(c1)) + getTotalMagMoment(c2)) + getTotalMagMoment(c3)));
                            setTotalAngMomentum(nodeU, (((getTotalAngMomentum(c0) + getTotalAngMomentum(c1)) + getTotalAngMomentum(c2)) + getTotalAngMomentum(c3)));
                            setTotalMomX(nodeU, (((getTotalMomX(c0) + getTotalMomX(c1)) + getTotalMomX(c2)) + getTotalMomX(c3)));
                            setTotalMomY(nodeU, (((getTotalMomY(c0) + getTotalMomY(c1)) + getTotalMomY(c2)) + getTotalMomY(c3)));
                            if ((totalM > 0.0)) {
                                setComX(nodeU, ((((((getComX(c0) * m0) + (getComX(c1) * m1)) + (getComX(c2) * m2)) + (getComX(c3) * m3))) / totalM));
                                setComY(nodeU, ((((((getComY(c0) * m0) + (getComY(c1) * m1)) + (getComY(c2) * m2)) + (getComY(c3) * m3))) / totalM));
                            }
                            curNode = getParentIndex(nodeU);
                        }
                    }
                }
            }
        }
    }
    entry["computeAggregates"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_computeAggregates(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["computeBounds"] = function (workgroups, domain, origin) {
            return __entry_0_computeBounds(workgroups, bindings, domain, origin);
        };
        bound["initRoot"] = function (workgroups, domain, origin) {
            return __entry_1_initRoot(workgroups, bindings, domain, origin);
        };
        bound["insertParticles"] = function (workgroups, domain, origin) {
            return __entry_2_insertParticles(workgroups, bindings, domain, origin);
        };
        bound["computeAggregates"] = function (workgroups, domain, origin) {
            return __entry_3_computeAggregates(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["nodes","nodeCounter","bounds","visitorFlags","particleState","derived_in","particleAux","uniforms"], entryInfo };
}
