// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/boson-tree.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: bc5ec00c0fb52197c00037b23ecd0d6942b3724c805ff1611d4bca0e15dee024
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":181346,"lines":3266,"rtVec":0,"rtPoly":0,"rtAtomic":9,"rtNumeric":0,"fround":0,"hypot":0,"iife":14,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.642Z
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
    const NODE_WORDS = 20;
    const NONE = (-1);
    const LOCK_BIT = (-2147483648);
    const N_MIN_X = 0;
    const N_MIN_Y = 1;
    const N_MAX_X = 2;
    const N_MAX_Y = 3;
    const N_COM_X = 4;
    const N_COM_Y = 5;
    const N_TOTAL_MASS = 6;
    const N_TOTAL_CHARGE = 7;
    const N_PARTICLE_COUNT = 12;
    const N_DIVIDED = 13;
    const N_NW = 14;
    const N_NE = 15;
    const N_SW = 16;
    const N_SE = 17;
    const N_PARTICLE_IDX = 18;
    const N_PARENT = 19;

    function nodeF32(nodeIdx, field) {
        return rt.bitcast_f32_u32(bindings.bosonTree[((nodeIdx * NODE_WORDS) + field)]);
    }

    function nodeU32(nodeIdx, field) {
        return bindings.bosonTree[((nodeIdx * NODE_WORDS) + field)];
    }

    function setNodeF32(nodeIdx, field, val) {
        void (bindings.bosonTree[((nodeIdx * NODE_WORDS) + field)] = rt.bitcast_u32_f32(val));
    }

    function setNodeU32(nodeIdx, field, val) {
        void (bindings.bosonTree[((nodeIdx * NODE_WORDS) + field)] = val);
    }

    function casParticleIdx(nodeIdx, expected, desired) {
        const offset = ((nodeIdx * NODE_WORDS) + N_PARTICLE_IDX);
        const result = rt.atomicCompareExchangeWeakAt(bindings.bosonTree, offset, rt.bitcast_u32_i32(expected), rt.bitcast_u32_i32(desired));
        return rt.bitcast_i32_f32(result.old_value);
    }

    function getParentIndex(nodeIdx) {
        return rt.bitcast_i32_u32(bindings.bosonTree[((nodeIdx * NODE_WORDS) + N_PARENT)]);
    }

    function atomicAddParticleCount(nodeIdx, val) {
        return (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.bosonTree, ((nodeIdx * NODE_WORDS) + N_PARTICLE_COUNT), val));
    }

    function allocNode() {
        return (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.bosonNodeCounter, 0, 1));
    }

    function initNode(idx, minX, minY, maxX, maxY, parentIdx) {
        const base = (idx * NODE_WORDS);
        void (bindings.bosonTree[(base + N_MIN_X)] = rt.bitcast_u32_f32(minX));
        void (bindings.bosonTree[(base + N_MIN_Y)] = rt.bitcast_u32_f32(minY));
        void (bindings.bosonTree[(base + N_MAX_X)] = rt.bitcast_u32_f32(maxX));
        void (bindings.bosonTree[(base + N_MAX_Y)] = rt.bitcast_u32_f32(maxY));
        void (bindings.bosonTree[(base + N_COM_X)] = rt.bitcast_u32_f32(0.0));
        void (bindings.bosonTree[(base + N_COM_Y)] = rt.bitcast_u32_f32(0.0));
        void (bindings.bosonTree[(base + N_TOTAL_MASS)] = rt.bitcast_u32_f32(0.0));
        void (bindings.bosonTree[(base + N_TOTAL_CHARGE)] = rt.bitcast_u32_f32(0.0));
        void (bindings.bosonTree[(base + N_PARTICLE_COUNT)] = 0);
        void (bindings.bosonTree[(base + N_DIVIDED)] = 0);
        void (bindings.bosonTree[(base + N_NW)] = 0xFFFFFFFF);
        void (bindings.bosonTree[(base + N_NE)] = 0xFFFFFFFF);
        void (bindings.bosonTree[(base + N_SW)] = 0xFFFFFFFF);
        void (bindings.bosonTree[(base + N_SE)] = 0xFFFFFFFF);
        void (bindings.bosonTree[(base + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(NONE));
        void (bindings.bosonTree[(base + N_PARENT)] = rt.bitcast_u32_i32(parentIdx));
    }

    function childFor(nodeIdx, px, py) {
        const minX = nodeF32(nodeIdx, N_MIN_X);
        const minY = nodeF32(nodeIdx, N_MIN_Y);
        const maxX = nodeF32(nodeIdx, N_MAX_X);
        const maxY = nodeF32(nodeIdx, N_MAX_Y);
        const midX = (((minX + maxX)) * 0.5);
        const midY = (((minY + maxY)) * 0.5);
        const nw = nodeU32(nodeIdx, N_NW);
        const ne = nodeU32(nodeIdx, N_NE);
        const sw = nodeU32(nodeIdx, N_SW);
        const se = nodeU32(nodeIdx, N_SE);
        let _inl_24_result;
        _inl_24: {
            if ((px < midX)) {
                _inl_24_result = ((py >= midY) ? sw : nw);
                break _inl_24;
            } else {
                _inl_24_result = ((py >= midY) ? se : ne);
                break _inl_24;
            }
        }
        return _inl_24_result;
    }

    function subdivide(nodeIdx) {
        const minX = nodeF32(nodeIdx, N_MIN_X);
        const minY = nodeF32(nodeIdx, N_MIN_Y);
        const maxX = nodeF32(nodeIdx, N_MAX_X);
        const maxY = nodeF32(nodeIdx, N_MAX_Y);
        const cx = (((minX + maxX)) * 0.5);
        const cy = (((minY + maxY)) * 0.5);
        const parentI32 = ((nodeIdx) | 0);
        const nw = allocNode();
        const ne = allocNode();
        const sw = allocNode();
        const se = allocNode();
        initNode(nw, minX, minY, cx, cy, parentI32);
        initNode(ne, cx, minY, maxX, cy, parentI32);
        initNode(sw, minX, cy, cx, maxY, parentI32);
        initNode(se, cx, cy, maxX, maxY, parentI32);
        setNodeU32(nodeIdx, N_NW, nw);
        setNodeU32(nodeIdx, N_NE, ne);
        setNodeU32(nodeIdx, N_SW, sw);
        setNodeU32(nodeIdx, N_SE, se);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["insertBosonsIntoTree"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_insertBosonsIntoTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_bosonTree = bindings.bosonTree;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
        const _b_pions = bindings.pions;
        const _b_piCount = bindings.piCount;
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    let bx = 0;
                    let by = 0;
                    let bMass = 0;
                    if ((i < phN)) {
                        if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        bMass = _b_photons[((i) * 8 + 4)];
                    } else {
                        const pi = (i - phN);
                        if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                    }
                    let cur = 0;
                    let depth = 0;
                    while (true) {
                        if ((depth >= MAX_DEPTH)) {
                            break;
                        }
                        const prev = casParticleIdx(cur, NONE, ((i) | 0));
                        if ((prev == NONE)) {
                            setNodeU32(cur, N_PARTICLE_COUNT, 1);
                            const parentIdx = getParentIndex(cur);
                            if ((parentIdx >= 0)) {
                                atomicAddParticleCount(((parentIdx) >>> 0), 1);
                            }
                            break;
                        }
                        const prevUnlocked = (prev & (~LOCK_BIT));
                        if (((prevUnlocked >= 0) && (rt.bitcast_i32_u32(nodeU32(cur, N_NW)) == NONE))) {
                            const lockResult = casParticleIdx(cur, prev, (prev | LOCK_BIT));
                            if ((lockResult == prev)) {
                                subdivide(cur);
                                const displacedIdx = ((prev) >>> 0);
                                let dispX = 0;
                                let dispY = 0;
                                if ((displacedIdx < phN)) {
                                    dispX = _b_photons[((displacedIdx) * 8 + 0)];
                                    dispY = _b_photons[((displacedIdx) * 8 + 1)];
                                } else {
                                    const dpi = (displacedIdx - phN);
                                    dispX = _b_pions[((dpi) * 12 + 0)];
                                    dispY = _b_pions[((dpi) * 12 + 1)];
                                }
                                const childForDisplaced = childFor(cur, dispX, dispY);
                                void (_b_bosonTree[((childForDisplaced * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(prev));
                                setNodeU32(childForDisplaced, N_PARTICLE_COUNT, 1);
                                atomicAddParticleCount(cur, 1);
                                void (_b_bosonTree[((cur * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(NONE));
                                cur = childFor(cur, bx, by);
                                depth = (depth + 1);
                                continue;
                            }
                        }
                        if ((rt.bitcast_i32_u32(nodeU32(cur, N_NW)) != NONE)) {
                            cur = childFor(cur, bx, by);
                            depth = (depth + 1);
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
                            const phN = _b_phCount[0];
                            const piN = _b_piCount[0];
                            const total = (phN + piN);
                            if ((i >= total)) {
                                break __invocation;
                            }
                            let bx = 0;
                            let by = 0;
                            let bMass = 0;
                            if ((i < phN)) {
                                if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                                    break __invocation;
                                }
                                bx = _b_photons[((i) * 8 + 0)];
                                by = _b_photons[((i) * 8 + 1)];
                                bMass = _b_photons[((i) * 8 + 4)];
                            } else {
                                const pi = (i - phN);
                                if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                                    break __invocation;
                                }
                                bx = _b_pions[((pi) * 12 + 0)];
                                by = _b_pions[((pi) * 12 + 1)];
                                const wx = _b_pions[((pi) * 12 + 2)];
                                const wy = _b_pions[((pi) * 12 + 3)];
                                const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                                bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                            }
                            let cur = 0;
                            let depth = 0;
                            while (true) {
                                if ((depth >= MAX_DEPTH)) {
                                    break;
                                }
                                const prev = casParticleIdx(cur, NONE, ((i) | 0));
                                if ((prev == NONE)) {
                                    setNodeU32(cur, N_PARTICLE_COUNT, 1);
                                    const parentIdx = getParentIndex(cur);
                                    if ((parentIdx >= 0)) {
                                        atomicAddParticleCount(((parentIdx) >>> 0), 1);
                                    }
                                    break;
                                }
                                const prevUnlocked = (prev & (~LOCK_BIT));
                                if (((prevUnlocked >= 0) && (rt.bitcast_i32_u32(nodeU32(cur, N_NW)) == NONE))) {
                                    const lockResult = casParticleIdx(cur, prev, (prev | LOCK_BIT));
                                    if ((lockResult == prev)) {
                                        subdivide(cur);
                                        const displacedIdx = ((prev) >>> 0);
                                        let dispX = 0;
                                        let dispY = 0;
                                        if ((displacedIdx < phN)) {
                                            dispX = _b_photons[((displacedIdx) * 8 + 0)];
                                            dispY = _b_photons[((displacedIdx) * 8 + 1)];
                                        } else {
                                            const dpi = (displacedIdx - phN);
                                            dispX = _b_pions[((dpi) * 12 + 0)];
                                            dispY = _b_pions[((dpi) * 12 + 1)];
                                        }
                                        const childForDisplaced = childFor(cur, dispX, dispY);
                                        void (_b_bosonTree[((childForDisplaced * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(prev));
                                        setNodeU32(childForDisplaced, N_PARTICLE_COUNT, 1);
                                        atomicAddParticleCount(cur, 1);
                                        void (_b_bosonTree[((cur * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(NONE));
                                        cur = childFor(cur, bx, by);
                                        depth = (depth + 1);
                                        continue;
                                    }
                                }
                                if ((rt.bitcast_i32_u32(nodeU32(cur, N_NW)) != NONE)) {
                                    cur = childFor(cur, bx, by);
                                    depth = (depth + 1);
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
                        const phN = _b_phCount[0];
                        const piN = _b_piCount[0];
                        const total = (phN + piN);
                        if ((i >= total)) {
                            break __invocation;
                        }
                        let bx = 0;
                        let by = 0;
                        let bMass = 0;
                        if ((i < phN)) {
                            if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                                break __invocation;
                            }
                            bx = _b_photons[((i) * 8 + 0)];
                            by = _b_photons[((i) * 8 + 1)];
                            bMass = _b_photons[((i) * 8 + 4)];
                        } else {
                            const pi = (i - phN);
                            if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                                break __invocation;
                            }
                            bx = _b_pions[((pi) * 12 + 0)];
                            by = _b_pions[((pi) * 12 + 1)];
                            const wx = _b_pions[((pi) * 12 + 2)];
                            const wy = _b_pions[((pi) * 12 + 3)];
                            const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                            bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                        }
                        let cur = 0;
                        let depth = 0;
                        while (true) {
                            if ((depth >= MAX_DEPTH)) {
                                break;
                            }
                            const prev = casParticleIdx(cur, NONE, ((i) | 0));
                            if ((prev == NONE)) {
                                setNodeU32(cur, N_PARTICLE_COUNT, 1);
                                const parentIdx = getParentIndex(cur);
                                if ((parentIdx >= 0)) {
                                    atomicAddParticleCount(((parentIdx) >>> 0), 1);
                                }
                                break;
                            }
                            const prevUnlocked = (prev & (~LOCK_BIT));
                            if (((prevUnlocked >= 0) && (rt.bitcast_i32_u32(nodeU32(cur, N_NW)) == NONE))) {
                                const lockResult = casParticleIdx(cur, prev, (prev | LOCK_BIT));
                                if ((lockResult == prev)) {
                                    subdivide(cur);
                                    const displacedIdx = ((prev) >>> 0);
                                    let dispX = 0;
                                    let dispY = 0;
                                    if ((displacedIdx < phN)) {
                                        dispX = _b_photons[((displacedIdx) * 8 + 0)];
                                        dispY = _b_photons[((displacedIdx) * 8 + 1)];
                                    } else {
                                        const dpi = (displacedIdx - phN);
                                        dispX = _b_pions[((dpi) * 12 + 0)];
                                        dispY = _b_pions[((dpi) * 12 + 1)];
                                    }
                                    const childForDisplaced = childFor(cur, dispX, dispY);
                                    void (_b_bosonTree[((childForDisplaced * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(prev));
                                    setNodeU32(childForDisplaced, N_PARTICLE_COUNT, 1);
                                    atomicAddParticleCount(cur, 1);
                                    void (_b_bosonTree[((cur * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(NONE));
                                    cur = childFor(cur, bx, by);
                                    depth = (depth + 1);
                                    continue;
                                }
                            }
                            if ((rt.bitcast_i32_u32(nodeU32(cur, N_NW)) != NONE)) {
                                cur = childFor(cur, bx, by);
                                depth = (depth + 1);
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    let bx = 0;
                    let by = 0;
                    let bMass = 0;
                    if ((i < phN)) {
                        if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        bMass = _b_photons[((i) * 8 + 4)];
                    } else {
                        const pi = (i - phN);
                        if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                    }
                    let cur = 0;
                    let depth = 0;
                    while (true) {
                        if ((depth >= MAX_DEPTH)) {
                            break;
                        }
                        const prev = casParticleIdx(cur, NONE, ((i) | 0));
                        if ((prev == NONE)) {
                            setNodeU32(cur, N_PARTICLE_COUNT, 1);
                            const parentIdx = getParentIndex(cur);
                            if ((parentIdx >= 0)) {
                                atomicAddParticleCount(((parentIdx) >>> 0), 1);
                            }
                            break;
                        }
                        const prevUnlocked = (prev & (~LOCK_BIT));
                        if (((prevUnlocked >= 0) && (rt.bitcast_i32_u32(nodeU32(cur, N_NW)) == NONE))) {
                            const lockResult = casParticleIdx(cur, prev, (prev | LOCK_BIT));
                            if ((lockResult == prev)) {
                                subdivide(cur);
                                const displacedIdx = ((prev) >>> 0);
                                let dispX = 0;
                                let dispY = 0;
                                if ((displacedIdx < phN)) {
                                    dispX = _b_photons[((displacedIdx) * 8 + 0)];
                                    dispY = _b_photons[((displacedIdx) * 8 + 1)];
                                } else {
                                    const dpi = (displacedIdx - phN);
                                    dispX = _b_pions[((dpi) * 12 + 0)];
                                    dispY = _b_pions[((dpi) * 12 + 1)];
                                }
                                const childForDisplaced = childFor(cur, dispX, dispY);
                                void (_b_bosonTree[((childForDisplaced * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(prev));
                                setNodeU32(childForDisplaced, N_PARTICLE_COUNT, 1);
                                atomicAddParticleCount(cur, 1);
                                void (_b_bosonTree[((cur * NODE_WORDS) + N_PARTICLE_IDX)] = rt.bitcast_u32_i32(NONE));
                                cur = childFor(cur, bx, by);
                                depth = (depth + 1);
                                continue;
                            }
                        }
                        if ((rt.bitcast_i32_u32(nodeU32(cur, N_NW)) != NONE)) {
                            cur = childFor(cur, bx, by);
                            depth = (depth + 1);
                        }
                    }
                }
            }
        }
    }
    entry["insertBosonsIntoTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_insertBosonsIntoTree(workgroups, bindings, domain, origin);
    };

    entryInfo["computeBosonAggregates"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_computeBosonAggregates(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_bosonVisitorFlags = bindings.bosonVisitorFlags;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
        const _b_pions = bindings.pions;
        const _b_piCount = bindings.piCount;
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    let bx = 0;
                    let by = 0;
                    let bMass = 0;
                    let bCharge = 0;
                    let alive = false;
                    if ((i < phN)) {
                        alive = (((_b_photons[((i) * 8 + 7)] & 1)) != 0);
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        bMass = _b_photons[((i) * 8 + 4)];
                        bCharge = 0.0;
                    } else {
                        const pi = (i - phN);
                        alive = (((_b_pions[((pi) * 12 + 9)] & 1)) != 0);
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                        bCharge = _b_pions[((pi) * 12 + 5)];
                    }
                    if ((!alive)) {
                        break __invocation;
                    }
                    let leafNode = 0;
                    let depth = 0;
                    while (true) {
                        if ((depth >= MAX_DEPTH)) {
                            break;
                        }
                        if ((rt.bitcast_i32_u32(nodeU32(leafNode, N_NW)) == NONE)) {
                            break;
                        }
                        leafNode = childFor(leafNode, bx, by);
                        depth = (depth + 1);
                    }
                    setNodeF32(leafNode, N_TOTAL_MASS, bMass);
                    setNodeF32(leafNode, N_TOTAL_CHARGE, bCharge);
                    if ((bMass > 0.0)) {
                        setNodeF32(leafNode, N_COM_X, bx);
                        setNodeF32(leafNode, N_COM_Y, by);
                    }
                    let curNode = getParentIndex(leafNode);
                    while (true) {
                        if ((curNode < 0)) {
                            break;
                        }
                        const nodeU = ((curNode) >>> 0);
                        const expectedVisitors = nodeU32(nodeU, N_PARTICLE_COUNT);
                        const prev2 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_bosonVisitorFlags, nodeU, 1));
                        if ((prev2 < (expectedVisitors - 1))) {
                            break;
                        }
                        const c0 = nodeU32(nodeU, N_NW);
                        const c1 = nodeU32(nodeU, N_NE);
                        const c2 = nodeU32(nodeU, N_SW);
                        const c3 = nodeU32(nodeU, N_SE);
                        const m0 = nodeF32(c0, N_TOTAL_MASS);
                        const m1 = nodeF32(c1, N_TOTAL_MASS);
                        const m2 = nodeF32(c2, N_TOTAL_MASS);
                        const m3 = nodeF32(c3, N_TOTAL_MASS);
                        const totalM = (((m0 + m1) + m2) + m3);
                        setNodeF32(nodeU, N_TOTAL_MASS, totalM);
                        setNodeF32(nodeU, N_TOTAL_CHARGE, (((nodeF32(c0, N_TOTAL_CHARGE) + nodeF32(c1, N_TOTAL_CHARGE)) + nodeF32(c2, N_TOTAL_CHARGE)) + nodeF32(c3, N_TOTAL_CHARGE)));
                        if ((totalM > EPSILON)) {
                            const invM = (1.0 / totalM);
                            setNodeF32(nodeU, N_COM_X, ((((((nodeF32(c0, N_COM_X) * m0) + (nodeF32(c1, N_COM_X) * m1)) + (nodeF32(c2, N_COM_X) * m2)) + (nodeF32(c3, N_COM_X) * m3))) * invM));
                            setNodeF32(nodeU, N_COM_Y, ((((((nodeF32(c0, N_COM_Y) * m0) + (nodeF32(c1, N_COM_Y) * m1)) + (nodeF32(c2, N_COM_Y) * m2)) + (nodeF32(c3, N_COM_Y) * m3))) * invM));
                        }
                        curNode = getParentIndex(nodeU);
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
                            const phN = _b_phCount[0];
                            const piN = _b_piCount[0];
                            const total = (phN + piN);
                            if ((i >= total)) {
                                break __invocation;
                            }
                            let bx = 0;
                            let by = 0;
                            let bMass = 0;
                            let bCharge = 0;
                            let alive = false;
                            if ((i < phN)) {
                                alive = (((_b_photons[((i) * 8 + 7)] & 1)) != 0);
                                bx = _b_photons[((i) * 8 + 0)];
                                by = _b_photons[((i) * 8 + 1)];
                                bMass = _b_photons[((i) * 8 + 4)];
                                bCharge = 0.0;
                            } else {
                                const pi = (i - phN);
                                alive = (((_b_pions[((pi) * 12 + 9)] & 1)) != 0);
                                bx = _b_pions[((pi) * 12 + 0)];
                                by = _b_pions[((pi) * 12 + 1)];
                                const wx = _b_pions[((pi) * 12 + 2)];
                                const wy = _b_pions[((pi) * 12 + 3)];
                                const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                                bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                                bCharge = _b_pions[((pi) * 12 + 5)];
                            }
                            if ((!alive)) {
                                break __invocation;
                            }
                            let leafNode = 0;
                            let depth = 0;
                            while (true) {
                                if ((depth >= MAX_DEPTH)) {
                                    break;
                                }
                                if ((rt.bitcast_i32_u32(nodeU32(leafNode, N_NW)) == NONE)) {
                                    break;
                                }
                                leafNode = childFor(leafNode, bx, by);
                                depth = (depth + 1);
                            }
                            setNodeF32(leafNode, N_TOTAL_MASS, bMass);
                            setNodeF32(leafNode, N_TOTAL_CHARGE, bCharge);
                            if ((bMass > 0.0)) {
                                setNodeF32(leafNode, N_COM_X, bx);
                                setNodeF32(leafNode, N_COM_Y, by);
                            }
                            let curNode = getParentIndex(leafNode);
                            while (true) {
                                if ((curNode < 0)) {
                                    break;
                                }
                                const nodeU = ((curNode) >>> 0);
                                const expectedVisitors = nodeU32(nodeU, N_PARTICLE_COUNT);
                                const prev2 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_bosonVisitorFlags, nodeU, 1));
                                if ((prev2 < (expectedVisitors - 1))) {
                                    break;
                                }
                                const c0 = nodeU32(nodeU, N_NW);
                                const c1 = nodeU32(nodeU, N_NE);
                                const c2 = nodeU32(nodeU, N_SW);
                                const c3 = nodeU32(nodeU, N_SE);
                                const m0 = nodeF32(c0, N_TOTAL_MASS);
                                const m1 = nodeF32(c1, N_TOTAL_MASS);
                                const m2 = nodeF32(c2, N_TOTAL_MASS);
                                const m3 = nodeF32(c3, N_TOTAL_MASS);
                                const totalM = (((m0 + m1) + m2) + m3);
                                setNodeF32(nodeU, N_TOTAL_MASS, totalM);
                                setNodeF32(nodeU, N_TOTAL_CHARGE, (((nodeF32(c0, N_TOTAL_CHARGE) + nodeF32(c1, N_TOTAL_CHARGE)) + nodeF32(c2, N_TOTAL_CHARGE)) + nodeF32(c3, N_TOTAL_CHARGE)));
                                if ((totalM > EPSILON)) {
                                    const invM = (1.0 / totalM);
                                    setNodeF32(nodeU, N_COM_X, ((((((nodeF32(c0, N_COM_X) * m0) + (nodeF32(c1, N_COM_X) * m1)) + (nodeF32(c2, N_COM_X) * m2)) + (nodeF32(c3, N_COM_X) * m3))) * invM));
                                    setNodeF32(nodeU, N_COM_Y, ((((((nodeF32(c0, N_COM_Y) * m0) + (nodeF32(c1, N_COM_Y) * m1)) + (nodeF32(c2, N_COM_Y) * m2)) + (nodeF32(c3, N_COM_Y) * m3))) * invM));
                                }
                                curNode = getParentIndex(nodeU);
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
                        const phN = _b_phCount[0];
                        const piN = _b_piCount[0];
                        const total = (phN + piN);
                        if ((i >= total)) {
                            break __invocation;
                        }
                        let bx = 0;
                        let by = 0;
                        let bMass = 0;
                        let bCharge = 0;
                        let alive = false;
                        if ((i < phN)) {
                            alive = (((_b_photons[((i) * 8 + 7)] & 1)) != 0);
                            bx = _b_photons[((i) * 8 + 0)];
                            by = _b_photons[((i) * 8 + 1)];
                            bMass = _b_photons[((i) * 8 + 4)];
                            bCharge = 0.0;
                        } else {
                            const pi = (i - phN);
                            alive = (((_b_pions[((pi) * 12 + 9)] & 1)) != 0);
                            bx = _b_pions[((pi) * 12 + 0)];
                            by = _b_pions[((pi) * 12 + 1)];
                            const wx = _b_pions[((pi) * 12 + 2)];
                            const wy = _b_pions[((pi) * 12 + 3)];
                            const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                            bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                            bCharge = _b_pions[((pi) * 12 + 5)];
                        }
                        if ((!alive)) {
                            break __invocation;
                        }
                        let leafNode = 0;
                        let depth = 0;
                        while (true) {
                            if ((depth >= MAX_DEPTH)) {
                                break;
                            }
                            if ((rt.bitcast_i32_u32(nodeU32(leafNode, N_NW)) == NONE)) {
                                break;
                            }
                            leafNode = childFor(leafNode, bx, by);
                            depth = (depth + 1);
                        }
                        setNodeF32(leafNode, N_TOTAL_MASS, bMass);
                        setNodeF32(leafNode, N_TOTAL_CHARGE, bCharge);
                        if ((bMass > 0.0)) {
                            setNodeF32(leafNode, N_COM_X, bx);
                            setNodeF32(leafNode, N_COM_Y, by);
                        }
                        let curNode = getParentIndex(leafNode);
                        while (true) {
                            if ((curNode < 0)) {
                                break;
                            }
                            const nodeU = ((curNode) >>> 0);
                            const expectedVisitors = nodeU32(nodeU, N_PARTICLE_COUNT);
                            const prev2 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_bosonVisitorFlags, nodeU, 1));
                            if ((prev2 < (expectedVisitors - 1))) {
                                break;
                            }
                            const c0 = nodeU32(nodeU, N_NW);
                            const c1 = nodeU32(nodeU, N_NE);
                            const c2 = nodeU32(nodeU, N_SW);
                            const c3 = nodeU32(nodeU, N_SE);
                            const m0 = nodeF32(c0, N_TOTAL_MASS);
                            const m1 = nodeF32(c1, N_TOTAL_MASS);
                            const m2 = nodeF32(c2, N_TOTAL_MASS);
                            const m3 = nodeF32(c3, N_TOTAL_MASS);
                            const totalM = (((m0 + m1) + m2) + m3);
                            setNodeF32(nodeU, N_TOTAL_MASS, totalM);
                            setNodeF32(nodeU, N_TOTAL_CHARGE, (((nodeF32(c0, N_TOTAL_CHARGE) + nodeF32(c1, N_TOTAL_CHARGE)) + nodeF32(c2, N_TOTAL_CHARGE)) + nodeF32(c3, N_TOTAL_CHARGE)));
                            if ((totalM > EPSILON)) {
                                const invM = (1.0 / totalM);
                                setNodeF32(nodeU, N_COM_X, ((((((nodeF32(c0, N_COM_X) * m0) + (nodeF32(c1, N_COM_X) * m1)) + (nodeF32(c2, N_COM_X) * m2)) + (nodeF32(c3, N_COM_X) * m3))) * invM));
                                setNodeF32(nodeU, N_COM_Y, ((((((nodeF32(c0, N_COM_Y) * m0) + (nodeF32(c1, N_COM_Y) * m1)) + (nodeF32(c2, N_COM_Y) * m2)) + (nodeF32(c3, N_COM_Y) * m3))) * invM));
                            }
                            curNode = getParentIndex(nodeU);
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    let bx = 0;
                    let by = 0;
                    let bMass = 0;
                    let bCharge = 0;
                    let alive = false;
                    if ((i < phN)) {
                        alive = (((_b_photons[((i) * 8 + 7)] & 1)) != 0);
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        bMass = _b_photons[((i) * 8 + 4)];
                        bCharge = 0.0;
                    } else {
                        const pi = (i - phN);
                        alive = (((_b_pions[((pi) * 12 + 9)] & 1)) != 0);
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const gamma = Math.sqrt(((1.0 + (wx * wx)) + (wy * wy)));
                        bMass = (_b_pions[((pi) * 12 + 4)] * gamma);
                        bCharge = _b_pions[((pi) * 12 + 5)];
                    }
                    if ((!alive)) {
                        break __invocation;
                    }
                    let leafNode = 0;
                    let depth = 0;
                    while (true) {
                        if ((depth >= MAX_DEPTH)) {
                            break;
                        }
                        if ((rt.bitcast_i32_u32(nodeU32(leafNode, N_NW)) == NONE)) {
                            break;
                        }
                        leafNode = childFor(leafNode, bx, by);
                        depth = (depth + 1);
                    }
                    setNodeF32(leafNode, N_TOTAL_MASS, bMass);
                    setNodeF32(leafNode, N_TOTAL_CHARGE, bCharge);
                    if ((bMass > 0.0)) {
                        setNodeF32(leafNode, N_COM_X, bx);
                        setNodeF32(leafNode, N_COM_Y, by);
                    }
                    let curNode = getParentIndex(leafNode);
                    while (true) {
                        if ((curNode < 0)) {
                            break;
                        }
                        const nodeU = ((curNode) >>> 0);
                        const expectedVisitors = nodeU32(nodeU, N_PARTICLE_COUNT);
                        const prev2 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_bosonVisitorFlags, nodeU, 1));
                        if ((prev2 < (expectedVisitors - 1))) {
                            break;
                        }
                        const c0 = nodeU32(nodeU, N_NW);
                        const c1 = nodeU32(nodeU, N_NE);
                        const c2 = nodeU32(nodeU, N_SW);
                        const c3 = nodeU32(nodeU, N_SE);
                        const m0 = nodeF32(c0, N_TOTAL_MASS);
                        const m1 = nodeF32(c1, N_TOTAL_MASS);
                        const m2 = nodeF32(c2, N_TOTAL_MASS);
                        const m3 = nodeF32(c3, N_TOTAL_MASS);
                        const totalM = (((m0 + m1) + m2) + m3);
                        setNodeF32(nodeU, N_TOTAL_MASS, totalM);
                        setNodeF32(nodeU, N_TOTAL_CHARGE, (((nodeF32(c0, N_TOTAL_CHARGE) + nodeF32(c1, N_TOTAL_CHARGE)) + nodeF32(c2, N_TOTAL_CHARGE)) + nodeF32(c3, N_TOTAL_CHARGE)));
                        if ((totalM > EPSILON)) {
                            const invM = (1.0 / totalM);
                            setNodeF32(nodeU, N_COM_X, ((((((nodeF32(c0, N_COM_X) * m0) + (nodeF32(c1, N_COM_X) * m1)) + (nodeF32(c2, N_COM_X) * m2)) + (nodeF32(c3, N_COM_X) * m3))) * invM));
                            setNodeF32(nodeU, N_COM_Y, ((((((nodeF32(c0, N_COM_Y) * m0) + (nodeF32(c1, N_COM_Y) * m1)) + (nodeF32(c2, N_COM_Y) * m2)) + (nodeF32(c3, N_COM_Y) * m3))) * invM));
                        }
                        curNode = getParentIndex(nodeU);
                    }
                }
            }
        }
    }
    entry["computeBosonAggregates"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_computeBosonAggregates(workgroups, bindings, domain, origin);
    };

    entryInfo["computeBosonGravity"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_computeBosonGravity(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const pMass = _b_particles[((i) * 9 + 4)];
                    let force_x = 0.0;
                    let force_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - px);
                        const dy = (cy - py);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_25_result_x, _inl_25_result_y;
                            _inl_25: {
                                const _inl_25_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_25_invRSq = (1.0 / _inl_25_rSq);
                                const _inl_25_f = (((pMass * nodeMass) * Math.sqrt(_inl_25_invRSq)) * _inl_25_invRSq);
                                const _ir0 = (dx * _inl_25_f);
                                const _ir1 = (dy * _inl_25_f);
                                _inl_25_result_x = _ir0;
                                _inl_25_result_y = _ir1;
                                break _inl_25;
                            }
                            {
                                const _wt0 = _inl_25_result_x;
                                const _wt1 = _inl_25_result_y;
                                force_x += _wt0;
                                force_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    const _sroa_0_base = ((i) * 40);
                    let af_f0_x = _b_allForces[_sroa_0_base + 0];
                    let af_f0_y = _b_allForces[_sroa_0_base + 1];
                    let af_f0_z = _b_allForces[_sroa_0_base + 2];
                    let af_f0_w = _b_allForces[_sroa_0_base + 3];
                    let af_f1_x = _b_allForces[_sroa_0_base + 4];
                    let af_f1_y = _b_allForces[_sroa_0_base + 5];
                    let af_f1_z = _b_allForces[_sroa_0_base + 6];
                    let af_f1_w = _b_allForces[_sroa_0_base + 7];
                    let af_f2_x = _b_allForces[_sroa_0_base + 8];
                    let af_f2_y = _b_allForces[_sroa_0_base + 9];
                    let af_f2_z = _b_allForces[_sroa_0_base + 10];
                    let af_f2_w = _b_allForces[_sroa_0_base + 11];
                    let af_f3_x = _b_allForces[_sroa_0_base + 12];
                    let af_f3_y = _b_allForces[_sroa_0_base + 13];
                    let af_f3_z = _b_allForces[_sroa_0_base + 14];
                    let af_f3_w = _b_allForces[_sroa_0_base + 15];
                    let af_f4_x = _b_allForces[_sroa_0_base + 16];
                    let af_f4_y = _b_allForces[_sroa_0_base + 17];
                    let af_f4_z = _b_allForces[_sroa_0_base + 18];
                    let af_f4_w = _b_allForces[_sroa_0_base + 19];
                    let af_f5_x = _b_allForces[_sroa_0_base + 20];
                    let af_f5_y = _b_allForces[_sroa_0_base + 21];
                    let af_f5_z = _b_allForces[_sroa_0_base + 22];
                    let af_f5_w = _b_allForces[_sroa_0_base + 23];
                    let af_torques_x = _b_allForces[_sroa_0_base + 24];
                    let af_torques_y = _b_allForces[_sroa_0_base + 25];
                    let af_torques_z = _b_allForces[_sroa_0_base + 26];
                    let af_torques_w = _b_allForces[_sroa_0_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_0_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_0_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_0_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_0_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_0_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_0_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_0_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_0_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_0_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_0_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_0_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_0_base + 39];
                    af_f0_x = (af_f0_x + force_x);
                    af_f0_y = (af_f0_y + force_y);
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
                            const px = _b_particles[((i) * 9 + 0)];
                            const py = _b_particles[((i) * 9 + 1)];
                            const pMass = _b_particles[((i) * 9 + 4)];
                            let force_x = 0.0;
                            let force_y = 0.0;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[top];
                                const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                                if ((nodeMass < EPSILON)) {
                                    continue;
                                }
                                const cx = nodeF32(nIdx, N_COM_X);
                                const cy = nodeF32(nIdx, N_COM_Y);
                                const dx = (cx - px);
                                const dy = (cy - py);
                                const dSq = ((dx * dx) + (dy * dy));
                                const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                                const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                                if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                    let _inl_25_result_x, _inl_25_result_y;
                                    _inl_25: {
                                        const _inl_25_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                        const _inl_25_invRSq = (1.0 / _inl_25_rSq);
                                        const _inl_25_f = (((pMass * nodeMass) * Math.sqrt(_inl_25_invRSq)) * _inl_25_invRSq);
                                        const _ir0 = (dx * _inl_25_f);
                                        const _ir1 = (dy * _inl_25_f);
                                        _inl_25_result_x = _ir0;
                                        _inl_25_result_y = _ir1;
                                        break _inl_25;
                                    }
                                    {
                                        const _wt0 = _inl_25_result_x;
                                        const _wt1 = _inl_25_result_y;
                                        force_x += _wt0;
                                        force_y += _wt1;
                                    }
                                } else if (((top + 4) <= 48)) {
                                    stack[top] = nodeU32(nIdx, N_NW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_NE);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SE);
                                    top++;
                                }
                            }
                            const _sroa_1_base = ((i) * 40);
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
                            af_f0_x = (af_f0_x + force_x);
                            af_f0_y = (af_f0_y + force_y);
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
                        const px = _b_particles[((i) * 9 + 0)];
                        const py = _b_particles[((i) * 9 + 1)];
                        const pMass = _b_particles[((i) * 9 + 4)];
                        let force_x = 0.0;
                        let force_y = 0.0;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[top];
                            const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                            if ((nodeMass < EPSILON)) {
                                continue;
                            }
                            const cx = nodeF32(nIdx, N_COM_X);
                            const cy = nodeF32(nIdx, N_COM_Y);
                            const dx = (cx - px);
                            const dy = (cy - py);
                            const dSq = ((dx * dx) + (dy * dy));
                            const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                            const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                            if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                let _inl_25_result_x, _inl_25_result_y;
                                _inl_25: {
                                    const _inl_25_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                    const _inl_25_invRSq = (1.0 / _inl_25_rSq);
                                    const _inl_25_f = (((pMass * nodeMass) * Math.sqrt(_inl_25_invRSq)) * _inl_25_invRSq);
                                    const _ir0 = (dx * _inl_25_f);
                                    const _ir1 = (dy * _inl_25_f);
                                    _inl_25_result_x = _ir0;
                                    _inl_25_result_y = _ir1;
                                    break _inl_25;
                                }
                                {
                                    const _wt0 = _inl_25_result_x;
                                    const _wt1 = _inl_25_result_y;
                                    force_x += _wt0;
                                    force_y += _wt1;
                                }
                            } else if (((top + 4) <= 48)) {
                                stack[top] = nodeU32(nIdx, N_NW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_NE);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SE);
                                top++;
                            }
                        }
                        const _sroa_2_base = ((i) * 40);
                        let af_f0_x = _b_allForces[_sroa_2_base + 0];
                        let af_f0_y = _b_allForces[_sroa_2_base + 1];
                        let af_f0_z = _b_allForces[_sroa_2_base + 2];
                        let af_f0_w = _b_allForces[_sroa_2_base + 3];
                        let af_f1_x = _b_allForces[_sroa_2_base + 4];
                        let af_f1_y = _b_allForces[_sroa_2_base + 5];
                        let af_f1_z = _b_allForces[_sroa_2_base + 6];
                        let af_f1_w = _b_allForces[_sroa_2_base + 7];
                        let af_f2_x = _b_allForces[_sroa_2_base + 8];
                        let af_f2_y = _b_allForces[_sroa_2_base + 9];
                        let af_f2_z = _b_allForces[_sroa_2_base + 10];
                        let af_f2_w = _b_allForces[_sroa_2_base + 11];
                        let af_f3_x = _b_allForces[_sroa_2_base + 12];
                        let af_f3_y = _b_allForces[_sroa_2_base + 13];
                        let af_f3_z = _b_allForces[_sroa_2_base + 14];
                        let af_f3_w = _b_allForces[_sroa_2_base + 15];
                        let af_f4_x = _b_allForces[_sroa_2_base + 16];
                        let af_f4_y = _b_allForces[_sroa_2_base + 17];
                        let af_f4_z = _b_allForces[_sroa_2_base + 18];
                        let af_f4_w = _b_allForces[_sroa_2_base + 19];
                        let af_f5_x = _b_allForces[_sroa_2_base + 20];
                        let af_f5_y = _b_allForces[_sroa_2_base + 21];
                        let af_f5_z = _b_allForces[_sroa_2_base + 22];
                        let af_f5_w = _b_allForces[_sroa_2_base + 23];
                        let af_torques_x = _b_allForces[_sroa_2_base + 24];
                        let af_torques_y = _b_allForces[_sroa_2_base + 25];
                        let af_torques_z = _b_allForces[_sroa_2_base + 26];
                        let af_torques_w = _b_allForces[_sroa_2_base + 27];
                        let af_bFields_x = _b_allForces[_sroa_2_base + 28];
                        let af_bFields_y = _b_allForces[_sroa_2_base + 29];
                        let af_bFields_z = _b_allForces[_sroa_2_base + 30];
                        let af_bFields_w = _b_allForces[_sroa_2_base + 31];
                        let af_bFieldGrads_x = _b_allForces[_sroa_2_base + 32];
                        let af_bFieldGrads_y = _b_allForces[_sroa_2_base + 33];
                        let af_bFieldGrads_z = _b_allForces[_sroa_2_base + 34];
                        let af_bFieldGrads_w = _b_allForces[_sroa_2_base + 35];
                        let af_totalForce_x = _b_allForces[_sroa_2_base + 36];
                        let af_totalForce_y = _b_allForces[_sroa_2_base + 37];
                        let af_jerk_x = _b_allForces[_sroa_2_base + 38];
                        let af_jerk_y = _b_allForces[_sroa_2_base + 39];
                        af_f0_x = (af_f0_x + force_x);
                        af_f0_y = (af_f0_y + force_y);
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
                    const px = _b_particles[((i) * 9 + 0)];
                    const py = _b_particles[((i) * 9 + 1)];
                    const pMass = _b_particles[((i) * 9 + 4)];
                    let force_x = 0.0;
                    let force_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - px);
                        const dy = (cy - py);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_25_result_x, _inl_25_result_y;
                            _inl_25: {
                                const _inl_25_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_25_invRSq = (1.0 / _inl_25_rSq);
                                const _inl_25_f = (((pMass * nodeMass) * Math.sqrt(_inl_25_invRSq)) * _inl_25_invRSq);
                                const _ir0 = (dx * _inl_25_f);
                                const _ir1 = (dy * _inl_25_f);
                                _inl_25_result_x = _ir0;
                                _inl_25_result_y = _ir1;
                                break _inl_25;
                            }
                            {
                                const _wt0 = _inl_25_result_x;
                                const _wt1 = _inl_25_result_y;
                                force_x += _wt0;
                                force_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    const _sroa_3_base = ((i) * 40);
                    let af_f0_x = _b_allForces[_sroa_3_base + 0];
                    let af_f0_y = _b_allForces[_sroa_3_base + 1];
                    let af_f0_z = _b_allForces[_sroa_3_base + 2];
                    let af_f0_w = _b_allForces[_sroa_3_base + 3];
                    let af_f1_x = _b_allForces[_sroa_3_base + 4];
                    let af_f1_y = _b_allForces[_sroa_3_base + 5];
                    let af_f1_z = _b_allForces[_sroa_3_base + 6];
                    let af_f1_w = _b_allForces[_sroa_3_base + 7];
                    let af_f2_x = _b_allForces[_sroa_3_base + 8];
                    let af_f2_y = _b_allForces[_sroa_3_base + 9];
                    let af_f2_z = _b_allForces[_sroa_3_base + 10];
                    let af_f2_w = _b_allForces[_sroa_3_base + 11];
                    let af_f3_x = _b_allForces[_sroa_3_base + 12];
                    let af_f3_y = _b_allForces[_sroa_3_base + 13];
                    let af_f3_z = _b_allForces[_sroa_3_base + 14];
                    let af_f3_w = _b_allForces[_sroa_3_base + 15];
                    let af_f4_x = _b_allForces[_sroa_3_base + 16];
                    let af_f4_y = _b_allForces[_sroa_3_base + 17];
                    let af_f4_z = _b_allForces[_sroa_3_base + 18];
                    let af_f4_w = _b_allForces[_sroa_3_base + 19];
                    let af_f5_x = _b_allForces[_sroa_3_base + 20];
                    let af_f5_y = _b_allForces[_sroa_3_base + 21];
                    let af_f5_z = _b_allForces[_sroa_3_base + 22];
                    let af_f5_w = _b_allForces[_sroa_3_base + 23];
                    let af_torques_x = _b_allForces[_sroa_3_base + 24];
                    let af_torques_y = _b_allForces[_sroa_3_base + 25];
                    let af_torques_z = _b_allForces[_sroa_3_base + 26];
                    let af_torques_w = _b_allForces[_sroa_3_base + 27];
                    let af_bFields_x = _b_allForces[_sroa_3_base + 28];
                    let af_bFields_y = _b_allForces[_sroa_3_base + 29];
                    let af_bFields_z = _b_allForces[_sroa_3_base + 30];
                    let af_bFields_w = _b_allForces[_sroa_3_base + 31];
                    let af_bFieldGrads_x = _b_allForces[_sroa_3_base + 32];
                    let af_bFieldGrads_y = _b_allForces[_sroa_3_base + 33];
                    let af_bFieldGrads_z = _b_allForces[_sroa_3_base + 34];
                    let af_bFieldGrads_w = _b_allForces[_sroa_3_base + 35];
                    let af_totalForce_x = _b_allForces[_sroa_3_base + 36];
                    let af_totalForce_y = _b_allForces[_sroa_3_base + 37];
                    let af_jerk_x = _b_allForces[_sroa_3_base + 38];
                    let af_jerk_y = _b_allForces[_sroa_3_base + 39];
                    af_f0_x = (af_f0_x + force_x);
                    af_f0_y = (af_f0_y + force_y);
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
                }
            }
        }
    }
    entry["computeBosonGravity"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_computeBosonGravity(workgroups, bindings, domain, origin);
    };

    entryInfo["applyBosonBosonGravity"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_applyBosonBosonGravity(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
        const _b_pions = bindings.pions;
        const _b_piCount = bindings.piCount;
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    let bx = 0;
                    let by = 0;
                    let grFactor = 0;
                    if ((i < phN)) {
                        if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        grFactor = 2.0;
                    } else {
                        const pi = (i - phN);
                        if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const wSq = ((wx * wx) + (wy * wy));
                        const vSq = (wSq / ((1.0 + wSq)));
                        grFactor = (1.0 + vSq);
                    }
                    const massFactor = (grFactor * dt);
                    let kick_x = 0.0;
                    let kick_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - bx);
                        const dy = (cy - by);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_26_result_x, _inl_26_result_y;
                            _inl_26: {
                                const _inl_26_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_26_invRSq = (1.0 / _inl_26_rSq);
                                const _inl_26_f = (((massFactor * nodeMass) * Math.sqrt(_inl_26_invRSq)) * _inl_26_invRSq);
                                const _ir0 = (dx * _inl_26_f);
                                const _ir1 = (dy * _inl_26_f);
                                _inl_26_result_x = _ir0;
                                _inl_26_result_y = _ir1;
                                break _inl_26;
                            }
                            {
                                const _wt0 = _inl_26_result_x;
                                const _wt1 = _inl_26_result_y;
                                kick_x += _wt0;
                                kick_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    if ((i < phN)) {
                        let pvx = (_b_photons[((i) * 8 + 2)] + kick_x);
                        let pvy = (_b_photons[((i) * 8 + 3)] + kick_y);
                        const vSq = ((pvx * pvx) + (pvy * pvy));
                        if ((vSq > EPSILON)) {
                            const invV = (1 / Math.sqrt(vSq));
                            pvx = (pvx * invV);
                            pvy = (pvy * invV);
                        }
                        if (((pvx != pvx) || (pvy != pvy))) {
                            pvx = 1.0;
                            pvy = 0.0;
                        }
                        {
                            const _wbase = ((i) * 8 + 2) - 2;
                            _b_photons[_wbase + 2] = pvx;
                        }
                        {
                            const _wbase = ((i) * 8 + 3) - 3;
                            _b_photons[_wbase + 3] = pvy;
                        }
                    } else {
                        const pi2 = (i - phN);
                        {
                            const _wbase = ((pi2) * 12 + 2) - 2;
                            _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                        }
                        {
                            const _wbase = ((pi2) * 12 + 3) - 3;
                            _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                            const phN = _b_phCount[0];
                            const piN = _b_piCount[0];
                            const total = (phN + piN);
                            if ((i >= total)) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            let bx = 0;
                            let by = 0;
                            let grFactor = 0;
                            if ((i < phN)) {
                                if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                                    break __invocation;
                                }
                                bx = _b_photons[((i) * 8 + 0)];
                                by = _b_photons[((i) * 8 + 1)];
                                grFactor = 2.0;
                            } else {
                                const pi = (i - phN);
                                if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                                    break __invocation;
                                }
                                bx = _b_pions[((pi) * 12 + 0)];
                                by = _b_pions[((pi) * 12 + 1)];
                                const wx = _b_pions[((pi) * 12 + 2)];
                                const wy = _b_pions[((pi) * 12 + 3)];
                                const wSq = ((wx * wx) + (wy * wy));
                                const vSq = (wSq / ((1.0 + wSq)));
                                grFactor = (1.0 + vSq);
                            }
                            const massFactor = (grFactor * dt);
                            let kick_x = 0.0;
                            let kick_y = 0.0;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[top];
                                const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                                if ((nodeMass < EPSILON)) {
                                    continue;
                                }
                                const cx = nodeF32(nIdx, N_COM_X);
                                const cy = nodeF32(nIdx, N_COM_Y);
                                const dx = (cx - bx);
                                const dy = (cy - by);
                                const dSq = ((dx * dx) + (dy * dy));
                                const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                                const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                                if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                    let _inl_26_result_x, _inl_26_result_y;
                                    _inl_26: {
                                        const _inl_26_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                        const _inl_26_invRSq = (1.0 / _inl_26_rSq);
                                        const _inl_26_f = (((massFactor * nodeMass) * Math.sqrt(_inl_26_invRSq)) * _inl_26_invRSq);
                                        const _ir0 = (dx * _inl_26_f);
                                        const _ir1 = (dy * _inl_26_f);
                                        _inl_26_result_x = _ir0;
                                        _inl_26_result_y = _ir1;
                                        break _inl_26;
                                    }
                                    {
                                        const _wt0 = _inl_26_result_x;
                                        const _wt1 = _inl_26_result_y;
                                        kick_x += _wt0;
                                        kick_y += _wt1;
                                    }
                                } else if (((top + 4) <= 48)) {
                                    stack[top] = nodeU32(nIdx, N_NW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_NE);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SE);
                                    top++;
                                }
                            }
                            if ((i < phN)) {
                                let pvx = (_b_photons[((i) * 8 + 2)] + kick_x);
                                let pvy = (_b_photons[((i) * 8 + 3)] + kick_y);
                                const vSq = ((pvx * pvx) + (pvy * pvy));
                                if ((vSq > EPSILON)) {
                                    const invV = (1 / Math.sqrt(vSq));
                                    pvx = (pvx * invV);
                                    pvy = (pvy * invV);
                                }
                                if (((pvx != pvx) || (pvy != pvy))) {
                                    pvx = 1.0;
                                    pvy = 0.0;
                                }
                                {
                                    const _wbase = ((i) * 8 + 2) - 2;
                                    _b_photons[_wbase + 2] = pvx;
                                }
                                {
                                    const _wbase = ((i) * 8 + 3) - 3;
                                    _b_photons[_wbase + 3] = pvy;
                                }
                            } else {
                                const pi2 = (i - phN);
                                {
                                    const _wbase = ((pi2) * 12 + 2) - 2;
                                    _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                                }
                                {
                                    const _wbase = ((pi2) * 12 + 3) - 3;
                                    _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                        const phN = _b_phCount[0];
                        const piN = _b_piCount[0];
                        const total = (phN + piN);
                        if ((i >= total)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        let bx = 0;
                        let by = 0;
                        let grFactor = 0;
                        if ((i < phN)) {
                            if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                                break __invocation;
                            }
                            bx = _b_photons[((i) * 8 + 0)];
                            by = _b_photons[((i) * 8 + 1)];
                            grFactor = 2.0;
                        } else {
                            const pi = (i - phN);
                            if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                                break __invocation;
                            }
                            bx = _b_pions[((pi) * 12 + 0)];
                            by = _b_pions[((pi) * 12 + 1)];
                            const wx = _b_pions[((pi) * 12 + 2)];
                            const wy = _b_pions[((pi) * 12 + 3)];
                            const wSq = ((wx * wx) + (wy * wy));
                            const vSq = (wSq / ((1.0 + wSq)));
                            grFactor = (1.0 + vSq);
                        }
                        const massFactor = (grFactor * dt);
                        let kick_x = 0.0;
                        let kick_y = 0.0;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[top];
                            const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                            if ((nodeMass < EPSILON)) {
                                continue;
                            }
                            const cx = nodeF32(nIdx, N_COM_X);
                            const cy = nodeF32(nIdx, N_COM_Y);
                            const dx = (cx - bx);
                            const dy = (cy - by);
                            const dSq = ((dx * dx) + (dy * dy));
                            const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                            const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                            if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                let _inl_26_result_x, _inl_26_result_y;
                                _inl_26: {
                                    const _inl_26_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                    const _inl_26_invRSq = (1.0 / _inl_26_rSq);
                                    const _inl_26_f = (((massFactor * nodeMass) * Math.sqrt(_inl_26_invRSq)) * _inl_26_invRSq);
                                    const _ir0 = (dx * _inl_26_f);
                                    const _ir1 = (dy * _inl_26_f);
                                    _inl_26_result_x = _ir0;
                                    _inl_26_result_y = _ir1;
                                    break _inl_26;
                                }
                                {
                                    const _wt0 = _inl_26_result_x;
                                    const _wt1 = _inl_26_result_y;
                                    kick_x += _wt0;
                                    kick_y += _wt1;
                                }
                            } else if (((top + 4) <= 48)) {
                                stack[top] = nodeU32(nIdx, N_NW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_NE);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SE);
                                top++;
                            }
                        }
                        if ((i < phN)) {
                            let pvx = (_b_photons[((i) * 8 + 2)] + kick_x);
                            let pvy = (_b_photons[((i) * 8 + 3)] + kick_y);
                            const vSq = ((pvx * pvx) + (pvy * pvy));
                            if ((vSq > EPSILON)) {
                                const invV = (1 / Math.sqrt(vSq));
                                pvx = (pvx * invV);
                                pvy = (pvy * invV);
                            }
                            if (((pvx != pvx) || (pvy != pvy))) {
                                pvx = 1.0;
                                pvy = 0.0;
                            }
                            {
                                const _wbase = ((i) * 8 + 2) - 2;
                                _b_photons[_wbase + 2] = pvx;
                            }
                            {
                                const _wbase = ((i) * 8 + 3) - 3;
                                _b_photons[_wbase + 3] = pvy;
                            }
                        } else {
                            const pi2 = (i - phN);
                            {
                                const _wbase = ((pi2) * 12 + 2) - 2;
                                _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                            }
                            {
                                const _wbase = ((pi2) * 12 + 3) - 3;
                                _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                    const phN = _b_phCount[0];
                    const piN = _b_piCount[0];
                    const total = (phN + piN);
                    if ((i >= total)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    let bx = 0;
                    let by = 0;
                    let grFactor = 0;
                    if ((i < phN)) {
                        if ((((_b_photons[((i) * 8 + 7)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_photons[((i) * 8 + 0)];
                        by = _b_photons[((i) * 8 + 1)];
                        grFactor = 2.0;
                    } else {
                        const pi = (i - phN);
                        if ((((_b_pions[((pi) * 12 + 9)] & 1)) == 0)) {
                            break __invocation;
                        }
                        bx = _b_pions[((pi) * 12 + 0)];
                        by = _b_pions[((pi) * 12 + 1)];
                        const wx = _b_pions[((pi) * 12 + 2)];
                        const wy = _b_pions[((pi) * 12 + 3)];
                        const wSq = ((wx * wx) + (wy * wy));
                        const vSq = (wSq / ((1.0 + wSq)));
                        grFactor = (1.0 + vSq);
                    }
                    const massFactor = (grFactor * dt);
                    let kick_x = 0.0;
                    let kick_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeMass = nodeF32(nIdx, N_TOTAL_MASS);
                        if ((nodeMass < EPSILON)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - bx);
                        const dy = (cy - by);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_26_result_x, _inl_26_result_y;
                            _inl_26: {
                                const _inl_26_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_26_invRSq = (1.0 / _inl_26_rSq);
                                const _inl_26_f = (((massFactor * nodeMass) * Math.sqrt(_inl_26_invRSq)) * _inl_26_invRSq);
                                const _ir0 = (dx * _inl_26_f);
                                const _ir1 = (dy * _inl_26_f);
                                _inl_26_result_x = _ir0;
                                _inl_26_result_y = _ir1;
                                break _inl_26;
                            }
                            {
                                const _wt0 = _inl_26_result_x;
                                const _wt1 = _inl_26_result_y;
                                kick_x += _wt0;
                                kick_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    if ((i < phN)) {
                        let pvx = (_b_photons[((i) * 8 + 2)] + kick_x);
                        let pvy = (_b_photons[((i) * 8 + 3)] + kick_y);
                        const vSq = ((pvx * pvx) + (pvy * pvy));
                        if ((vSq > EPSILON)) {
                            const invV = (1 / Math.sqrt(vSq));
                            pvx = (pvx * invV);
                            pvy = (pvy * invV);
                        }
                        if (((pvx != pvx) || (pvy != pvy))) {
                            pvx = 1.0;
                            pvy = 0.0;
                        }
                        {
                            const _wbase = ((i) * 8 + 2) - 2;
                            _b_photons[_wbase + 2] = pvx;
                        }
                        {
                            const _wbase = ((i) * 8 + 3) - 3;
                            _b_photons[_wbase + 3] = pvy;
                        }
                    } else {
                        const pi2 = (i - phN);
                        {
                            const _wbase = ((pi2) * 12 + 2) - 2;
                            _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                        }
                        {
                            const _wbase = ((pi2) * 12 + 3) - 3;
                            _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
                        }
                    }
                }
            }
        }
    }
    entry["applyBosonBosonGravity"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_applyBosonBosonGravity(workgroups, bindings, domain, origin);
    };

    entryInfo["applyPionPionCoulomb"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_4_applyPionPionCoulomb(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _b_pions = bindings.pions;
        const _b_piCount = bindings.piCount;
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
                    const piN = _b_piCount[0];
                    if ((i >= piN)) {
                        break __invocation;
                    }
                    const _sroa_4_base = ((i) * 12);
                    const piState_posX = _b_pions[_sroa_4_base + 0];
                    const piState_posY = _b_pions[_sroa_4_base + 1];
                    const piState_wX = _b_pions[_sroa_4_base + 2];
                    const piState_wY = _b_pions[_sroa_4_base + 3];
                    const piState_mass = _b_pions[_sroa_4_base + 4];
                    const piState_charge = _b_pions[_sroa_4_base + 5];
                    const piState_energy = _b_pions[_sroa_4_base + 6];
                    const piState_emitterId = _b_pions[_sroa_4_base + 7];
                    const piState_age = _b_pions[_sroa_4_base + 8];
                    const piState_flags = _b_pions[_sroa_4_base + 9];
                    const piState_kind = _b_pions[_sroa_4_base + 10];
                    const piState__pad1 = _b_pions[_sroa_4_base + 11];
                    if ((((piState_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((Math.abs(piState_charge) < EPSILON)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const bx = piState_posX;
                    const by = piState_posY;
                    const scale = ((-piState_charge) * dt);
                    let kick_x = 0.0;
                    let kick_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeCharge = nodeF32(nIdx, N_TOTAL_CHARGE);
                        if ((nodeCharge == 0.0)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - bx);
                        const dy = (cy - by);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_27_result_x, _inl_27_result_y;
                            _inl_27: {
                                const _inl_27_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_27_invRSq = (1.0 / _inl_27_rSq);
                                const _inl_27_f = (((scale * nodeCharge) * Math.sqrt(_inl_27_invRSq)) * _inl_27_invRSq);
                                const _ir0 = (dx * _inl_27_f);
                                const _ir1 = (dy * _inl_27_f);
                                _inl_27_result_x = _ir0;
                                _inl_27_result_y = _ir1;
                                break _inl_27;
                            }
                            {
                                const _wt0 = _inl_27_result_x;
                                const _wt1 = _inl_27_result_y;
                                kick_x += _wt0;
                                kick_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    {
                        const _wbase = ((i) * 12 + 2) - 2;
                        _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                    }
                    {
                        const _wbase = ((i) * 12 + 3) - 3;
                        _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                            const piN = _b_piCount[0];
                            if ((i >= piN)) {
                                break __invocation;
                            }
                            const _sroa_5_base = ((i) * 12);
                            const piState_posX = _b_pions[_sroa_5_base + 0];
                            const piState_posY = _b_pions[_sroa_5_base + 1];
                            const piState_wX = _b_pions[_sroa_5_base + 2];
                            const piState_wY = _b_pions[_sroa_5_base + 3];
                            const piState_mass = _b_pions[_sroa_5_base + 4];
                            const piState_charge = _b_pions[_sroa_5_base + 5];
                            const piState_energy = _b_pions[_sroa_5_base + 6];
                            const piState_emitterId = _b_pions[_sroa_5_base + 7];
                            const piState_age = _b_pions[_sroa_5_base + 8];
                            const piState_flags = _b_pions[_sroa_5_base + 9];
                            const piState_kind = _b_pions[_sroa_5_base + 10];
                            const piState__pad1 = _b_pions[_sroa_5_base + 11];
                            if ((((piState_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            if ((Math.abs(piState_charge) < EPSILON)) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            const bx = piState_posX;
                            const by = piState_posY;
                            const scale = ((-piState_charge) * dt);
                            let kick_x = 0.0;
                            let kick_y = 0.0;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[top];
                                const nodeCharge = nodeF32(nIdx, N_TOTAL_CHARGE);
                                if ((nodeCharge == 0.0)) {
                                    continue;
                                }
                                const cx = nodeF32(nIdx, N_COM_X);
                                const cy = nodeF32(nIdx, N_COM_Y);
                                const dx = (cx - bx);
                                const dy = (cy - by);
                                const dSq = ((dx * dx) + (dy * dy));
                                const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                                const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                                if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                    let _inl_27_result_x, _inl_27_result_y;
                                    _inl_27: {
                                        const _inl_27_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                        const _inl_27_invRSq = (1.0 / _inl_27_rSq);
                                        const _inl_27_f = (((scale * nodeCharge) * Math.sqrt(_inl_27_invRSq)) * _inl_27_invRSq);
                                        const _ir0 = (dx * _inl_27_f);
                                        const _ir1 = (dy * _inl_27_f);
                                        _inl_27_result_x = _ir0;
                                        _inl_27_result_y = _ir1;
                                        break _inl_27;
                                    }
                                    {
                                        const _wt0 = _inl_27_result_x;
                                        const _wt1 = _inl_27_result_y;
                                        kick_x += _wt0;
                                        kick_y += _wt1;
                                    }
                                } else if (((top + 4) <= 48)) {
                                    stack[top] = nodeU32(nIdx, N_NW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_NE);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SW);
                                    top++;
                                    stack[top] = nodeU32(nIdx, N_SE);
                                    top++;
                                }
                            }
                            {
                                const _wbase = ((i) * 12 + 2) - 2;
                                _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                            }
                            {
                                const _wbase = ((i) * 12 + 3) - 3;
                                _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                        const piN = _b_piCount[0];
                        if ((i >= piN)) {
                            break __invocation;
                        }
                        const _sroa_6_base = ((i) * 12);
                        const piState_posX = _b_pions[_sroa_6_base + 0];
                        const piState_posY = _b_pions[_sroa_6_base + 1];
                        const piState_wX = _b_pions[_sroa_6_base + 2];
                        const piState_wY = _b_pions[_sroa_6_base + 3];
                        const piState_mass = _b_pions[_sroa_6_base + 4];
                        const piState_charge = _b_pions[_sroa_6_base + 5];
                        const piState_energy = _b_pions[_sroa_6_base + 6];
                        const piState_emitterId = _b_pions[_sroa_6_base + 7];
                        const piState_age = _b_pions[_sroa_6_base + 8];
                        const piState_flags = _b_pions[_sroa_6_base + 9];
                        const piState_kind = _b_pions[_sroa_6_base + 10];
                        const piState__pad1 = _b_pions[_sroa_6_base + 11];
                        if ((((piState_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        if ((Math.abs(piState_charge) < EPSILON)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const bx = piState_posX;
                        const by = piState_posY;
                        const scale = ((-piState_charge) * dt);
                        let kick_x = 0.0;
                        let kick_y = 0.0;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[top];
                            const nodeCharge = nodeF32(nIdx, N_TOTAL_CHARGE);
                            if ((nodeCharge == 0.0)) {
                                continue;
                            }
                            const cx = nodeF32(nIdx, N_COM_X);
                            const cy = nodeF32(nIdx, N_COM_Y);
                            const dx = (cx - bx);
                            const dy = (cy - by);
                            const dSq = ((dx * dx) + (dy * dy));
                            const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                            const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                            if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                let _inl_27_result_x, _inl_27_result_y;
                                _inl_27: {
                                    const _inl_27_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                    const _inl_27_invRSq = (1.0 / _inl_27_rSq);
                                    const _inl_27_f = (((scale * nodeCharge) * Math.sqrt(_inl_27_invRSq)) * _inl_27_invRSq);
                                    const _ir0 = (dx * _inl_27_f);
                                    const _ir1 = (dy * _inl_27_f);
                                    _inl_27_result_x = _ir0;
                                    _inl_27_result_y = _ir1;
                                    break _inl_27;
                                }
                                {
                                    const _wt0 = _inl_27_result_x;
                                    const _wt1 = _inl_27_result_y;
                                    kick_x += _wt0;
                                    kick_y += _wt1;
                                }
                            } else if (((top + 4) <= 48)) {
                                stack[top] = nodeU32(nIdx, N_NW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_NE);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SW);
                                top++;
                                stack[top] = nodeU32(nIdx, N_SE);
                                top++;
                            }
                        }
                        {
                            const _wbase = ((i) * 12 + 2) - 2;
                            _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                        }
                        {
                            const _wbase = ((i) * 12 + 3) - 3;
                            _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
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
                    const piN = _b_piCount[0];
                    if ((i >= piN)) {
                        break __invocation;
                    }
                    const _sroa_7_base = ((i) * 12);
                    const piState_posX = _b_pions[_sroa_7_base + 0];
                    const piState_posY = _b_pions[_sroa_7_base + 1];
                    const piState_wX = _b_pions[_sroa_7_base + 2];
                    const piState_wY = _b_pions[_sroa_7_base + 3];
                    const piState_mass = _b_pions[_sroa_7_base + 4];
                    const piState_charge = _b_pions[_sroa_7_base + 5];
                    const piState_energy = _b_pions[_sroa_7_base + 6];
                    const piState_emitterId = _b_pions[_sroa_7_base + 7];
                    const piState_age = _b_pions[_sroa_7_base + 8];
                    const piState_flags = _b_pions[_sroa_7_base + 9];
                    const piState_kind = _b_pions[_sroa_7_base + 10];
                    const piState__pad1 = _b_pions[_sroa_7_base + 11];
                    if ((((piState_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((Math.abs(piState_charge) < EPSILON)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const bx = piState_posX;
                    const by = piState_posY;
                    const scale = ((-piState_charge) * dt);
                    let kick_x = 0.0;
                    let kick_y = 0.0;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[top];
                        const nodeCharge = nodeF32(nIdx, N_TOTAL_CHARGE);
                        if ((nodeCharge == 0.0)) {
                            continue;
                        }
                        const cx = nodeF32(nIdx, N_COM_X);
                        const cy = nodeF32(nIdx, N_COM_Y);
                        const dx = (cx - bx);
                        const dy = (cy - by);
                        const dSq = ((dx * dx) + (dy * dy));
                        const size = (nodeF32(nIdx, N_MAX_X) - nodeF32(nIdx, N_MIN_X));
                        const isDivided = (rt.bitcast_i32_u32(nodeU32(nIdx, N_NW)) != NONE);
                        if (((!isDivided) || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            let _inl_27_result_x, _inl_27_result_y;
                            _inl_27: {
                                const _inl_27_rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const _inl_27_invRSq = (1.0 / _inl_27_rSq);
                                const _inl_27_f = (((scale * nodeCharge) * Math.sqrt(_inl_27_invRSq)) * _inl_27_invRSq);
                                const _ir0 = (dx * _inl_27_f);
                                const _ir1 = (dy * _inl_27_f);
                                _inl_27_result_x = _ir0;
                                _inl_27_result_y = _ir1;
                                break _inl_27;
                            }
                            {
                                const _wt0 = _inl_27_result_x;
                                const _wt1 = _inl_27_result_y;
                                kick_x += _wt0;
                                kick_y += _wt1;
                            }
                        } else if (((top + 4) <= 48)) {
                            stack[top] = nodeU32(nIdx, N_NW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_NE);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SW);
                            top++;
                            stack[top] = nodeU32(nIdx, N_SE);
                            top++;
                        }
                    }
                    {
                        const _wbase = ((i) * 12 + 2) - 2;
                        _b_pions[_wbase + 2] = (_b_pions[_wbase + 2] + kick_x);
                    }
                    {
                        const _wbase = ((i) * 12 + 3) - 3;
                        _b_pions[_wbase + 3] = (_b_pions[_wbase + 3] + kick_y);
                    }
                }
            }
        }
    }
    entry["applyPionPionCoulomb"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_4_applyPionPionCoulomb(workgroups, bindings, domain, origin);
    };

    entryInfo["annihilatePions"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_5_annihilatePions(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
        const _b_pions = bindings.pions;
        const _b_piCount = bindings.piCount;
        const _b_pionClaims = bindings.pionClaims;
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
                    const piN = _b_piCount[0];
                    if ((i >= piN)) {
                        break __invocation;
                    }
                    const _sroa_8_base = ((i) * 12);
                    let pi1_posX = _b_pions[_sroa_8_base + 0];
                    let pi1_posY = _b_pions[_sroa_8_base + 1];
                    let pi1_wX = _b_pions[_sroa_8_base + 2];
                    let pi1_wY = _b_pions[_sroa_8_base + 3];
                    let pi1_mass = _b_pions[_sroa_8_base + 4];
                    let pi1_charge = _b_pions[_sroa_8_base + 5];
                    let pi1_energy = _b_pions[_sroa_8_base + 6];
                    let pi1_emitterId = _b_pions[_sroa_8_base + 7];
                    let pi1_age = _b_pions[_sroa_8_base + 8];
                    let pi1_flags = _b_pions[_sroa_8_base + 9];
                    let pi1_kind = _b_pions[_sroa_8_base + 10];
                    let pi1__pad1 = _b_pions[_sroa_8_base + 11];
                    if ((((pi1_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((Math.abs(pi1_charge) < EPSILON)) {
                        break __invocation;
                    }
                    if ((pi1_age < BOSON_MIN_AGE)) {
                        break __invocation;
                    }
                    const claimSelf = rt.atomicCompareExchangeWeakAt(_b_pionClaims, i, 0, (i + 1));
                    if ((!claimSelf.exchanged)) {
                        break __invocation;
                    }
                    const p1x = pi1_posX;
                    const p1y = pi1_posY;
                    const p1c = pi1_charge;
                    const p1k = pi1_kind;
                    for (let j = (i + 1); (j < piN); j++) {
                        const _sroa_9_base = ((j) * 12);
                        const pi2_posX = _b_pions[_sroa_9_base + 0];
                        const pi2_posY = _b_pions[_sroa_9_base + 1];
                        const pi2_wX = _b_pions[_sroa_9_base + 2];
                        const pi2_wY = _b_pions[_sroa_9_base + 3];
                        const pi2_mass = _b_pions[_sroa_9_base + 4];
                        const pi2_charge = _b_pions[_sroa_9_base + 5];
                        const pi2_energy = _b_pions[_sroa_9_base + 6];
                        const pi2_emitterId = _b_pions[_sroa_9_base + 7];
                        const pi2_age = _b_pions[_sroa_9_base + 8];
                        const pi2_flags = _b_pions[_sroa_9_base + 9];
                        const pi2_kind = _b_pions[_sroa_9_base + 10];
                        const pi2__pad1 = _b_pions[_sroa_9_base + 11];
                        if ((((pi2_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((pi2_kind != p1k)) {
                            continue;
                        }
                        if (((Math.abs(pi2_charge) < EPSILON) || ((pi2_charge * p1c) > 0.0))) {
                            continue;
                        }
                        if ((pi2_age < BOSON_MIN_AGE)) {
                            continue;
                        }
                        const dx = (p1x - pi2_posX);
                        const dy = (p1y - pi2_posY);
                        if ((((dx * dx) + (dy * dy)) >= BOSON_SOFTENING_SQ)) {
                            continue;
                        }
                        const claimTarget = rt.atomicCompareExchangeWeakAt(_b_pionClaims, j, 0, (i + 1));
                        if ((!claimTarget.exchanged)) {
                            continue;
                        }
                        {
                            const _wbase = ((i) * 12 + 9) - 9;
                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                        }
                        {
                            const _wbase = ((j) * 12 + 9) - 9;
                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                        }
                        const w1x = pi1_wX;
                        const w1y = pi1_wY;
                        const w2x = pi2_wX;
                        const w2y = pi2_wY;
                        const g1 = Math.sqrt(((1.0 + (w1x * w1x)) + (w1y * w1y)));
                        const g2 = Math.sqrt(((1.0 + (w2x * w2x)) + (w2y * w2y)));
                        const E = ((pi1_mass * g1) + (pi2_mass * g2));
                        const px = ((w1x * pi1_mass) + (w2x * pi2_mass));
                        const py2 = ((w1y * pi1_mass) + (w2y * pi2_mass));
                        if ((E < EPSILON)) {
                            break;
                        }
                        const vComX = (px / E);
                        const vComY = (py2 / E);
                        const vComSq = ((vComX * vComX) + (vComY * vComY));
                        const gammaCom = ((vComSq < 1e-12) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq)))) < (EPSILON) ? (EPSILON) : ((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq))))))));
                        const sCom = (((E * E) - (px * px)) - (py2 * py2));
                        const mInv = ((sCom > 0.0) ? Math.sqrt(sCom) : E);
                        const ePhRest = (mInv * 0.5);
                        const _inl_28_seed = (((i * 73856093)) ^ ((pi1_age * 19349663)));
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_0_result;
                            _inl_28__inl_0: {
                                let _inl_28__inl_0_state = ((_inl_28_seed * 747796405) + 2891336453);
                                const _inl_28__inl_0_word = (((((_inl_28__inl_0_state >> ((((_inl_28__inl_0_state >> 28)) + 4)))) ^ _inl_28__inl_0_state)) * 277803737);
                                _inl_28__inl_0_result = (((_inl_28__inl_0_word >> 22)) ^ _inl_28__inl_0_word);
                                break _inl_28__inl_0;
                            }
                            _inl_28_result = ((+(_inl_28__inl_0_result)) / 4294967296.0);
                            break _inl_28;
                        }
                        const rng = _inl_28_result;
                        const angle = (rng * TWO_PI);
                        const cosA = Math.cos(angle);
                        const sinA = Math.sin(angle);
                        const midX = (((p1x + pi2_posX)) * 0.5);
                        const midY = (((p1y + pi2_posY)) * 0.5);
                        const emitOffset = (((pi1_mass * 1.5)) < (1.0) ? (1.0) : ((pi1_mass * 1.5)));
                        for (let s = 0; (s < 2); s++) {
                            const sign = ((s == 0) ? 1.0 : (-1.0));
                            let phPx = ((sign * ePhRest) * cosA);
                            let phPy = ((sign * ePhRest) * sinA);
                            if ((vComSq > 1e-12)) {
                                const vCom = Math.sqrt(vComSq);
                                const nx = (vComX / vCom);
                                const ny = (vComY / vCom);
                                const pPar = ((phPx * nx) + (phPy * ny));
                                const pPerpX = (phPx - (pPar * nx));
                                const pPerpY = (phPy - (pPar * ny));
                                const pParB = (gammaCom * ((pPar + (vCom * ePhRest))));
                                phPx = ((pParB * nx) + pPerpX);
                                phPy = ((pParB * ny) + pPerpY);
                            }
                            const pMag = Math.sqrt(((phPx * phPx) + (phPy * phPy)));
                            if ((pMag < EPSILON)) {
                                continue;
                            }
                            const dirX = (phPx / pMag);
                            const dirY = (phPy / pMag);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (midX + (dirX * emitOffset));
                                ph_posY = (midY + (dirY * emitOffset));
                                ph_velX = dirX;
                                ph_velY = dirY;
                                ph_energy = pMag;
                                ph_emitterId = 0xFFFFFFFF;
                                ph_lifetime = 0.0;
                                ph_flags = 1;
                                {
                                    const _wbase = ((phIdx) * 8);
                                    _b_photons[_wbase + 0] = ph_posX;
                                    _b_photons[_wbase + 1] = ph_posY;
                                    _b_photons[_wbase + 2] = ph_velX;
                                    _b_photons[_wbase + 3] = ph_velY;
                                    _b_photons[_wbase + 4] = ph_energy;
                                    _b_photons[_wbase + 5] = ph_emitterId;
                                    _b_photons[_wbase + 6] = ph_lifetime;
                                    _b_photons[_wbase + 7] = ph_flags;
                                }
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                            }
                        }
                        break;
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
                            const piN = _b_piCount[0];
                            if ((i >= piN)) {
                                break __invocation;
                            }
                            const _sroa_10_base = ((i) * 12);
                            let pi1_posX = _b_pions[_sroa_10_base + 0];
                            let pi1_posY = _b_pions[_sroa_10_base + 1];
                            let pi1_wX = _b_pions[_sroa_10_base + 2];
                            let pi1_wY = _b_pions[_sroa_10_base + 3];
                            let pi1_mass = _b_pions[_sroa_10_base + 4];
                            let pi1_charge = _b_pions[_sroa_10_base + 5];
                            let pi1_energy = _b_pions[_sroa_10_base + 6];
                            let pi1_emitterId = _b_pions[_sroa_10_base + 7];
                            let pi1_age = _b_pions[_sroa_10_base + 8];
                            let pi1_flags = _b_pions[_sroa_10_base + 9];
                            let pi1_kind = _b_pions[_sroa_10_base + 10];
                            let pi1__pad1 = _b_pions[_sroa_10_base + 11];
                            if ((((pi1_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            if ((Math.abs(pi1_charge) < EPSILON)) {
                                break __invocation;
                            }
                            if ((pi1_age < BOSON_MIN_AGE)) {
                                break __invocation;
                            }
                            const claimSelf = rt.atomicCompareExchangeWeakAt(_b_pionClaims, i, 0, (i + 1));
                            if ((!claimSelf.exchanged)) {
                                break __invocation;
                            }
                            const p1x = pi1_posX;
                            const p1y = pi1_posY;
                            const p1c = pi1_charge;
                            const p1k = pi1_kind;
                            for (let j = (i + 1); (j < piN); j++) {
                                const _sroa_11_base = ((j) * 12);
                                const pi2_posX = _b_pions[_sroa_11_base + 0];
                                const pi2_posY = _b_pions[_sroa_11_base + 1];
                                const pi2_wX = _b_pions[_sroa_11_base + 2];
                                const pi2_wY = _b_pions[_sroa_11_base + 3];
                                const pi2_mass = _b_pions[_sroa_11_base + 4];
                                const pi2_charge = _b_pions[_sroa_11_base + 5];
                                const pi2_energy = _b_pions[_sroa_11_base + 6];
                                const pi2_emitterId = _b_pions[_sroa_11_base + 7];
                                const pi2_age = _b_pions[_sroa_11_base + 8];
                                const pi2_flags = _b_pions[_sroa_11_base + 9];
                                const pi2_kind = _b_pions[_sroa_11_base + 10];
                                const pi2__pad1 = _b_pions[_sroa_11_base + 11];
                                if ((((pi2_flags & 1)) == 0)) {
                                    continue;
                                }
                                if ((pi2_kind != p1k)) {
                                    continue;
                                }
                                if (((Math.abs(pi2_charge) < EPSILON) || ((pi2_charge * p1c) > 0.0))) {
                                    continue;
                                }
                                if ((pi2_age < BOSON_MIN_AGE)) {
                                    continue;
                                }
                                const dx = (p1x - pi2_posX);
                                const dy = (p1y - pi2_posY);
                                if ((((dx * dx) + (dy * dy)) >= BOSON_SOFTENING_SQ)) {
                                    continue;
                                }
                                const claimTarget = rt.atomicCompareExchangeWeakAt(_b_pionClaims, j, 0, (i + 1));
                                if ((!claimTarget.exchanged)) {
                                    continue;
                                }
                                {
                                    const _wbase = ((i) * 12 + 9) - 9;
                                    _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                }
                                {
                                    const _wbase = ((j) * 12 + 9) - 9;
                                    _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                }
                                const w1x = pi1_wX;
                                const w1y = pi1_wY;
                                const w2x = pi2_wX;
                                const w2y = pi2_wY;
                                const g1 = Math.sqrt(((1.0 + (w1x * w1x)) + (w1y * w1y)));
                                const g2 = Math.sqrt(((1.0 + (w2x * w2x)) + (w2y * w2y)));
                                const E = ((pi1_mass * g1) + (pi2_mass * g2));
                                const px = ((w1x * pi1_mass) + (w2x * pi2_mass));
                                const py2 = ((w1y * pi1_mass) + (w2y * pi2_mass));
                                if ((E < EPSILON)) {
                                    break;
                                }
                                const vComX = (px / E);
                                const vComY = (py2 / E);
                                const vComSq = ((vComX * vComX) + (vComY * vComY));
                                const gammaCom = ((vComSq < 1e-12) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq)))) < (EPSILON) ? (EPSILON) : ((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq))))))));
                                const sCom = (((E * E) - (px * px)) - (py2 * py2));
                                const mInv = ((sCom > 0.0) ? Math.sqrt(sCom) : E);
                                const ePhRest = (mInv * 0.5);
                                const _inl_28_seed = (((i * 73856093)) ^ ((pi1_age * 19349663)));
                                let _inl_28_result;
                                _inl_28: {
                                    let _inl_28__inl_0_result;
                                    _inl_28__inl_0: {
                                        let _inl_28__inl_0_state = ((_inl_28_seed * 747796405) + 2891336453);
                                        const _inl_28__inl_0_word = (((((_inl_28__inl_0_state >> ((((_inl_28__inl_0_state >> 28)) + 4)))) ^ _inl_28__inl_0_state)) * 277803737);
                                        _inl_28__inl_0_result = (((_inl_28__inl_0_word >> 22)) ^ _inl_28__inl_0_word);
                                        break _inl_28__inl_0;
                                    }
                                    _inl_28_result = ((+(_inl_28__inl_0_result)) / 4294967296.0);
                                    break _inl_28;
                                }
                                const rng = _inl_28_result;
                                const angle = (rng * TWO_PI);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
                                const midX = (((p1x + pi2_posX)) * 0.5);
                                const midY = (((p1y + pi2_posY)) * 0.5);
                                const emitOffset = (((pi1_mass * 1.5)) < (1.0) ? (1.0) : ((pi1_mass * 1.5)));
                                for (let s = 0; (s < 2); s++) {
                                    const sign = ((s == 0) ? 1.0 : (-1.0));
                                    let phPx = ((sign * ePhRest) * cosA);
                                    let phPy = ((sign * ePhRest) * sinA);
                                    if ((vComSq > 1e-12)) {
                                        const vCom = Math.sqrt(vComSq);
                                        const nx = (vComX / vCom);
                                        const ny = (vComY / vCom);
                                        const pPar = ((phPx * nx) + (phPy * ny));
                                        const pPerpX = (phPx - (pPar * nx));
                                        const pPerpY = (phPy - (pPar * ny));
                                        const pParB = (gammaCom * ((pPar + (vCom * ePhRest))));
                                        phPx = ((pParB * nx) + pPerpX);
                                        phPy = ((pParB * ny) + pPerpY);
                                    }
                                    const pMag = Math.sqrt(((phPx * phPx) + (phPy * phPy)));
                                    if ((pMag < EPSILON)) {
                                        continue;
                                    }
                                    const dirX = (phPx / pMag);
                                    const dirY = (phPy / pMag);
                                    const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                    if ((phIdx < MAX_PHOTONS)) {
                                        let ph_posX = 0;
                                        let ph_posY = 0;
                                        let ph_velX = 0;
                                        let ph_velY = 0;
                                        let ph_energy = 0;
                                        let ph_emitterId = 0;
                                        let ph_lifetime = 0;
                                        let ph_flags = 0;
                                        ph_posX = (midX + (dirX * emitOffset));
                                        ph_posY = (midY + (dirY * emitOffset));
                                        ph_velX = dirX;
                                        ph_velY = dirY;
                                        ph_energy = pMag;
                                        ph_emitterId = 0xFFFFFFFF;
                                        ph_lifetime = 0.0;
                                        ph_flags = 1;
                                        {
                                            const _wbase = ((phIdx) * 8);
                                            _b_photons[_wbase + 0] = ph_posX;
                                            _b_photons[_wbase + 1] = ph_posY;
                                            _b_photons[_wbase + 2] = ph_velX;
                                            _b_photons[_wbase + 3] = ph_velY;
                                            _b_photons[_wbase + 4] = ph_energy;
                                            _b_photons[_wbase + 5] = ph_emitterId;
                                            _b_photons[_wbase + 6] = ph_lifetime;
                                            _b_photons[_wbase + 7] = ph_flags;
                                        }
                                    } else {
                                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                                    }
                                }
                                break;
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
                        const piN = _b_piCount[0];
                        if ((i >= piN)) {
                            break __invocation;
                        }
                        const _sroa_12_base = ((i) * 12);
                        let pi1_posX = _b_pions[_sroa_12_base + 0];
                        let pi1_posY = _b_pions[_sroa_12_base + 1];
                        let pi1_wX = _b_pions[_sroa_12_base + 2];
                        let pi1_wY = _b_pions[_sroa_12_base + 3];
                        let pi1_mass = _b_pions[_sroa_12_base + 4];
                        let pi1_charge = _b_pions[_sroa_12_base + 5];
                        let pi1_energy = _b_pions[_sroa_12_base + 6];
                        let pi1_emitterId = _b_pions[_sroa_12_base + 7];
                        let pi1_age = _b_pions[_sroa_12_base + 8];
                        let pi1_flags = _b_pions[_sroa_12_base + 9];
                        let pi1_kind = _b_pions[_sroa_12_base + 10];
                        let pi1__pad1 = _b_pions[_sroa_12_base + 11];
                        if ((((pi1_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        if ((Math.abs(pi1_charge) < EPSILON)) {
                            break __invocation;
                        }
                        if ((pi1_age < BOSON_MIN_AGE)) {
                            break __invocation;
                        }
                        const claimSelf = rt.atomicCompareExchangeWeakAt(_b_pionClaims, i, 0, (i + 1));
                        if ((!claimSelf.exchanged)) {
                            break __invocation;
                        }
                        const p1x = pi1_posX;
                        const p1y = pi1_posY;
                        const p1c = pi1_charge;
                        const p1k = pi1_kind;
                        for (let j = (i + 1); (j < piN); j++) {
                            const _sroa_13_base = ((j) * 12);
                            const pi2_posX = _b_pions[_sroa_13_base + 0];
                            const pi2_posY = _b_pions[_sroa_13_base + 1];
                            const pi2_wX = _b_pions[_sroa_13_base + 2];
                            const pi2_wY = _b_pions[_sroa_13_base + 3];
                            const pi2_mass = _b_pions[_sroa_13_base + 4];
                            const pi2_charge = _b_pions[_sroa_13_base + 5];
                            const pi2_energy = _b_pions[_sroa_13_base + 6];
                            const pi2_emitterId = _b_pions[_sroa_13_base + 7];
                            const pi2_age = _b_pions[_sroa_13_base + 8];
                            const pi2_flags = _b_pions[_sroa_13_base + 9];
                            const pi2_kind = _b_pions[_sroa_13_base + 10];
                            const pi2__pad1 = _b_pions[_sroa_13_base + 11];
                            if ((((pi2_flags & 1)) == 0)) {
                                continue;
                            }
                            if ((pi2_kind != p1k)) {
                                continue;
                            }
                            if (((Math.abs(pi2_charge) < EPSILON) || ((pi2_charge * p1c) > 0.0))) {
                                continue;
                            }
                            if ((pi2_age < BOSON_MIN_AGE)) {
                                continue;
                            }
                            const dx = (p1x - pi2_posX);
                            const dy = (p1y - pi2_posY);
                            if ((((dx * dx) + (dy * dy)) >= BOSON_SOFTENING_SQ)) {
                                continue;
                            }
                            const claimTarget = rt.atomicCompareExchangeWeakAt(_b_pionClaims, j, 0, (i + 1));
                            if ((!claimTarget.exchanged)) {
                                continue;
                            }
                            {
                                const _wbase = ((i) * 12 + 9) - 9;
                                _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                            }
                            {
                                const _wbase = ((j) * 12 + 9) - 9;
                                _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                            }
                            const w1x = pi1_wX;
                            const w1y = pi1_wY;
                            const w2x = pi2_wX;
                            const w2y = pi2_wY;
                            const g1 = Math.sqrt(((1.0 + (w1x * w1x)) + (w1y * w1y)));
                            const g2 = Math.sqrt(((1.0 + (w2x * w2x)) + (w2y * w2y)));
                            const E = ((pi1_mass * g1) + (pi2_mass * g2));
                            const px = ((w1x * pi1_mass) + (w2x * pi2_mass));
                            const py2 = ((w1y * pi1_mass) + (w2y * pi2_mass));
                            if ((E < EPSILON)) {
                                break;
                            }
                            const vComX = (px / E);
                            const vComY = (py2 / E);
                            const vComSq = ((vComX * vComX) + (vComY * vComY));
                            const gammaCom = ((vComSq < 1e-12) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq)))) < (EPSILON) ? (EPSILON) : ((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq))))))));
                            const sCom = (((E * E) - (px * px)) - (py2 * py2));
                            const mInv = ((sCom > 0.0) ? Math.sqrt(sCom) : E);
                            const ePhRest = (mInv * 0.5);
                            const _inl_28_seed = (((i * 73856093)) ^ ((pi1_age * 19349663)));
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_0_result;
                                _inl_28__inl_0: {
                                    let _inl_28__inl_0_state = ((_inl_28_seed * 747796405) + 2891336453);
                                    const _inl_28__inl_0_word = (((((_inl_28__inl_0_state >> ((((_inl_28__inl_0_state >> 28)) + 4)))) ^ _inl_28__inl_0_state)) * 277803737);
                                    _inl_28__inl_0_result = (((_inl_28__inl_0_word >> 22)) ^ _inl_28__inl_0_word);
                                    break _inl_28__inl_0;
                                }
                                _inl_28_result = ((+(_inl_28__inl_0_result)) / 4294967296.0);
                                break _inl_28;
                            }
                            const rng = _inl_28_result;
                            const angle = (rng * TWO_PI);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const midX = (((p1x + pi2_posX)) * 0.5);
                            const midY = (((p1y + pi2_posY)) * 0.5);
                            const emitOffset = (((pi1_mass * 1.5)) < (1.0) ? (1.0) : ((pi1_mass * 1.5)));
                            for (let s = 0; (s < 2); s++) {
                                const sign = ((s == 0) ? 1.0 : (-1.0));
                                let phPx = ((sign * ePhRest) * cosA);
                                let phPy = ((sign * ePhRest) * sinA);
                                if ((vComSq > 1e-12)) {
                                    const vCom = Math.sqrt(vComSq);
                                    const nx = (vComX / vCom);
                                    const ny = (vComY / vCom);
                                    const pPar = ((phPx * nx) + (phPy * ny));
                                    const pPerpX = (phPx - (pPar * nx));
                                    const pPerpY = (phPy - (pPar * ny));
                                    const pParB = (gammaCom * ((pPar + (vCom * ePhRest))));
                                    phPx = ((pParB * nx) + pPerpX);
                                    phPy = ((pParB * ny) + pPerpY);
                                }
                                const pMag = Math.sqrt(((phPx * phPx) + (phPy * phPy)));
                                if ((pMag < EPSILON)) {
                                    continue;
                                }
                                const dirX = (phPx / pMag);
                                const dirY = (phPy / pMag);
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (midX + (dirX * emitOffset));
                                    ph_posY = (midY + (dirY * emitOffset));
                                    ph_velX = dirX;
                                    ph_velY = dirY;
                                    ph_energy = pMag;
                                    ph_emitterId = 0xFFFFFFFF;
                                    ph_lifetime = 0.0;
                                    ph_flags = 1;
                                    {
                                        const _wbase = ((phIdx) * 8);
                                        _b_photons[_wbase + 0] = ph_posX;
                                        _b_photons[_wbase + 1] = ph_posY;
                                        _b_photons[_wbase + 2] = ph_velX;
                                        _b_photons[_wbase + 3] = ph_velY;
                                        _b_photons[_wbase + 4] = ph_energy;
                                        _b_photons[_wbase + 5] = ph_emitterId;
                                        _b_photons[_wbase + 6] = ph_lifetime;
                                        _b_photons[_wbase + 7] = ph_flags;
                                    }
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                                }
                            }
                            break;
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
                    const piN = _b_piCount[0];
                    if ((i >= piN)) {
                        break __invocation;
                    }
                    const _sroa_14_base = ((i) * 12);
                    let pi1_posX = _b_pions[_sroa_14_base + 0];
                    let pi1_posY = _b_pions[_sroa_14_base + 1];
                    let pi1_wX = _b_pions[_sroa_14_base + 2];
                    let pi1_wY = _b_pions[_sroa_14_base + 3];
                    let pi1_mass = _b_pions[_sroa_14_base + 4];
                    let pi1_charge = _b_pions[_sroa_14_base + 5];
                    let pi1_energy = _b_pions[_sroa_14_base + 6];
                    let pi1_emitterId = _b_pions[_sroa_14_base + 7];
                    let pi1_age = _b_pions[_sroa_14_base + 8];
                    let pi1_flags = _b_pions[_sroa_14_base + 9];
                    let pi1_kind = _b_pions[_sroa_14_base + 10];
                    let pi1__pad1 = _b_pions[_sroa_14_base + 11];
                    if ((((pi1_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((Math.abs(pi1_charge) < EPSILON)) {
                        break __invocation;
                    }
                    if ((pi1_age < BOSON_MIN_AGE)) {
                        break __invocation;
                    }
                    const claimSelf = rt.atomicCompareExchangeWeakAt(_b_pionClaims, i, 0, (i + 1));
                    if ((!claimSelf.exchanged)) {
                        break __invocation;
                    }
                    const p1x = pi1_posX;
                    const p1y = pi1_posY;
                    const p1c = pi1_charge;
                    const p1k = pi1_kind;
                    for (let j = (i + 1); (j < piN); j++) {
                        const _sroa_15_base = ((j) * 12);
                        const pi2_posX = _b_pions[_sroa_15_base + 0];
                        const pi2_posY = _b_pions[_sroa_15_base + 1];
                        const pi2_wX = _b_pions[_sroa_15_base + 2];
                        const pi2_wY = _b_pions[_sroa_15_base + 3];
                        const pi2_mass = _b_pions[_sroa_15_base + 4];
                        const pi2_charge = _b_pions[_sroa_15_base + 5];
                        const pi2_energy = _b_pions[_sroa_15_base + 6];
                        const pi2_emitterId = _b_pions[_sroa_15_base + 7];
                        const pi2_age = _b_pions[_sroa_15_base + 8];
                        const pi2_flags = _b_pions[_sroa_15_base + 9];
                        const pi2_kind = _b_pions[_sroa_15_base + 10];
                        const pi2__pad1 = _b_pions[_sroa_15_base + 11];
                        if ((((pi2_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((pi2_kind != p1k)) {
                            continue;
                        }
                        if (((Math.abs(pi2_charge) < EPSILON) || ((pi2_charge * p1c) > 0.0))) {
                            continue;
                        }
                        if ((pi2_age < BOSON_MIN_AGE)) {
                            continue;
                        }
                        const dx = (p1x - pi2_posX);
                        const dy = (p1y - pi2_posY);
                        if ((((dx * dx) + (dy * dy)) >= BOSON_SOFTENING_SQ)) {
                            continue;
                        }
                        const claimTarget = rt.atomicCompareExchangeWeakAt(_b_pionClaims, j, 0, (i + 1));
                        if ((!claimTarget.exchanged)) {
                            continue;
                        }
                        {
                            const _wbase = ((i) * 12 + 9) - 9;
                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                        }
                        {
                            const _wbase = ((j) * 12 + 9) - 9;
                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                        }
                        const w1x = pi1_wX;
                        const w1y = pi1_wY;
                        const w2x = pi2_wX;
                        const w2y = pi2_wY;
                        const g1 = Math.sqrt(((1.0 + (w1x * w1x)) + (w1y * w1y)));
                        const g2 = Math.sqrt(((1.0 + (w2x * w2x)) + (w2y * w2y)));
                        const E = ((pi1_mass * g1) + (pi2_mass * g2));
                        const px = ((w1x * pi1_mass) + (w2x * pi2_mass));
                        const py2 = ((w1y * pi1_mass) + (w2y * pi2_mass));
                        if ((E < EPSILON)) {
                            break;
                        }
                        const vComX = (px / E);
                        const vComY = (py2 / E);
                        const vComSq = ((vComX * vComX) + (vComY * vComY));
                        const gammaCom = ((vComSq < 1e-12) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq)))) < (EPSILON) ? (EPSILON) : ((1.0 - (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vComSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vComSq))))))));
                        const sCom = (((E * E) - (px * px)) - (py2 * py2));
                        const mInv = ((sCom > 0.0) ? Math.sqrt(sCom) : E);
                        const ePhRest = (mInv * 0.5);
                        const _inl_28_seed = (((i * 73856093)) ^ ((pi1_age * 19349663)));
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_0_result;
                            _inl_28__inl_0: {
                                let _inl_28__inl_0_state = ((_inl_28_seed * 747796405) + 2891336453);
                                const _inl_28__inl_0_word = (((((_inl_28__inl_0_state >> ((((_inl_28__inl_0_state >> 28)) + 4)))) ^ _inl_28__inl_0_state)) * 277803737);
                                _inl_28__inl_0_result = (((_inl_28__inl_0_word >> 22)) ^ _inl_28__inl_0_word);
                                break _inl_28__inl_0;
                            }
                            _inl_28_result = ((+(_inl_28__inl_0_result)) / 4294967296.0);
                            break _inl_28;
                        }
                        const rng = _inl_28_result;
                        const angle = (rng * TWO_PI);
                        const cosA = Math.cos(angle);
                        const sinA = Math.sin(angle);
                        const midX = (((p1x + pi2_posX)) * 0.5);
                        const midY = (((p1y + pi2_posY)) * 0.5);
                        const emitOffset = (((pi1_mass * 1.5)) < (1.0) ? (1.0) : ((pi1_mass * 1.5)));
                        for (let s = 0; (s < 2); s++) {
                            const sign = ((s == 0) ? 1.0 : (-1.0));
                            let phPx = ((sign * ePhRest) * cosA);
                            let phPy = ((sign * ePhRest) * sinA);
                            if ((vComSq > 1e-12)) {
                                const vCom = Math.sqrt(vComSq);
                                const nx = (vComX / vCom);
                                const ny = (vComY / vCom);
                                const pPar = ((phPx * nx) + (phPy * ny));
                                const pPerpX = (phPx - (pPar * nx));
                                const pPerpY = (phPy - (pPar * ny));
                                const pParB = (gammaCom * ((pPar + (vCom * ePhRest))));
                                phPx = ((pParB * nx) + pPerpX);
                                phPy = ((pParB * ny) + pPerpY);
                            }
                            const pMag = Math.sqrt(((phPx * phPx) + (phPy * phPy)));
                            if ((pMag < EPSILON)) {
                                continue;
                            }
                            const dirX = (phPx / pMag);
                            const dirY = (phPy / pMag);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (midX + (dirX * emitOffset));
                                ph_posY = (midY + (dirY * emitOffset));
                                ph_velX = dirX;
                                ph_velY = dirY;
                                ph_energy = pMag;
                                ph_emitterId = 0xFFFFFFFF;
                                ph_lifetime = 0.0;
                                ph_flags = 1;
                                {
                                    const _wbase = ((phIdx) * 8);
                                    _b_photons[_wbase + 0] = ph_posX;
                                    _b_photons[_wbase + 1] = ph_posY;
                                    _b_photons[_wbase + 2] = ph_velX;
                                    _b_photons[_wbase + 3] = ph_velY;
                                    _b_photons[_wbase + 4] = ph_energy;
                                    _b_photons[_wbase + 5] = ph_emitterId;
                                    _b_photons[_wbase + 6] = ph_lifetime;
                                    _b_photons[_wbase + 7] = ph_flags;
                                }
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    entry["annihilatePions"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_5_annihilatePions(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["insertBosonsIntoTree"] = function (workgroups, domain, origin) {
            return __entry_0_insertBosonsIntoTree(workgroups, bindings, domain, origin);
        };
        bound["computeBosonAggregates"] = function (workgroups, domain, origin) {
            return __entry_1_computeBosonAggregates(workgroups, bindings, domain, origin);
        };
        bound["computeBosonGravity"] = function (workgroups, domain, origin) {
            return __entry_2_computeBosonGravity(workgroups, bindings, domain, origin);
        };
        bound["applyBosonBosonGravity"] = function (workgroups, domain, origin) {
            return __entry_3_applyBosonBosonGravity(workgroups, bindings, domain, origin);
        };
        bound["applyPionPionCoulomb"] = function (workgroups, domain, origin) {
            return __entry_4_applyPionPionCoulomb(workgroups, bindings, domain, origin);
        };
        bound["annihilatePions"] = function (workgroups, domain, origin) {
            return __entry_5_annihilatePions(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","bosonTree","bosonNodeCounter","bosonVisitorFlags","photons","phCount","pions","piCount","pionClaims","particles","allForces"], entryInfo };
}
