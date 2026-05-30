// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/radiation.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 55f2453b865e76818fb769ae5bb118d00328748979c526daf566b868ab71ff61
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":314361,"lines":4751,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":48,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.728Z
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

    entryInfo["larmorRadiation"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_larmorRadiation(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _u_u_frameCount = _b_u.frameCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_derived = bindings.derived;
        const _b_allForces = bindings.allForces;
        const _b_radState = bindings.radState;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
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
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!coulombOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    if ((Math.abs(_b_particles[((i) * 9 + 5)]) < EPSILON)) {
                        break __invocation;
                    }
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const wMagSq = ((wx * wx) + (wy * wy));
                    if ((wMagSq < (EPSILON * EPSILON))) {
                        break __invocation;
                    }
                    const gamma = Math.sqrt((1.0 + wMagSq));
                    const qSq = (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]);
                    const mInv = _b_derived[((i) * 8 + 2)];
                    const tau = ((0.6666666666666666 * qSq) * mInv);
                    const _sroa_0_base = ((i) * 40);
                    const af_f0_x = _b_allForces[_sroa_0_base + 0];
                    const af_f0_y = _b_allForces[_sroa_0_base + 1];
                    const af_f0_z = _b_allForces[_sroa_0_base + 2];
                    const af_f0_w = _b_allForces[_sroa_0_base + 3];
                    const af_f1_x = _b_allForces[_sroa_0_base + 4];
                    const af_f1_y = _b_allForces[_sroa_0_base + 5];
                    const af_f1_z = _b_allForces[_sroa_0_base + 6];
                    const af_f1_w = _b_allForces[_sroa_0_base + 7];
                    const af_f2_x = _b_allForces[_sroa_0_base + 8];
                    const af_f2_y = _b_allForces[_sroa_0_base + 9];
                    const af_f2_z = _b_allForces[_sroa_0_base + 10];
                    const af_f2_w = _b_allForces[_sroa_0_base + 11];
                    const af_f3_x = _b_allForces[_sroa_0_base + 12];
                    const af_f3_y = _b_allForces[_sroa_0_base + 13];
                    const af_f3_z = _b_allForces[_sroa_0_base + 14];
                    const af_f3_w = _b_allForces[_sroa_0_base + 15];
                    const af_f4_x = _b_allForces[_sroa_0_base + 16];
                    const af_f4_y = _b_allForces[_sroa_0_base + 17];
                    const af_f4_z = _b_allForces[_sroa_0_base + 18];
                    const af_f4_w = _b_allForces[_sroa_0_base + 19];
                    const af_f5_x = _b_allForces[_sroa_0_base + 20];
                    const af_f5_y = _b_allForces[_sroa_0_base + 21];
                    const af_f5_z = _b_allForces[_sroa_0_base + 22];
                    const af_f5_w = _b_allForces[_sroa_0_base + 23];
                    const af_torques_x = _b_allForces[_sroa_0_base + 24];
                    const af_torques_y = _b_allForces[_sroa_0_base + 25];
                    const af_torques_z = _b_allForces[_sroa_0_base + 26];
                    const af_torques_w = _b_allForces[_sroa_0_base + 27];
                    const af_bFields_x = _b_allForces[_sroa_0_base + 28];
                    const af_bFields_y = _b_allForces[_sroa_0_base + 29];
                    const af_bFields_z = _b_allForces[_sroa_0_base + 30];
                    const af_bFields_w = _b_allForces[_sroa_0_base + 31];
                    const af_bFieldGrads_x = _b_allForces[_sroa_0_base + 32];
                    const af_bFieldGrads_y = _b_allForces[_sroa_0_base + 33];
                    const af_bFieldGrads_z = _b_allForces[_sroa_0_base + 34];
                    const af_bFieldGrads_w = _b_allForces[_sroa_0_base + 35];
                    const af_totalForce_x = _b_allForces[_sroa_0_base + 36];
                    const af_totalForce_y = _b_allForces[_sroa_0_base + 37];
                    const af_jerk_x = _b_allForces[_sroa_0_base + 38];
                    const af_jerk_y = _b_allForces[_sroa_0_base + 39];
                    const _sroa_1_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_1_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_1_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_1_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_1_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_1_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_1_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_1_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_1_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_1_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_1_base + 9];
                    let rs__pad1 = _b_radState[_sroa_1_base + 10];
                    let rs__pad2 = _b_radState[_sroa_1_base + 11];
                    let fRadX = (tau * af_jerk_x);
                    let fRadY = (tau * af_jerk_y);
                    const relativityOn = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    if ((relativityOn && (gamma > 1.0))) {
                        const invG3 = (1.0 / (((gamma * gamma) * gamma)));
                        fRadX = (fRadX * invG3);
                        fRadY = (fRadY * invG3);
                        const invGamma = (1.0 / gamma);
                        const vx = (wx * invGamma);
                        const vy = (wy * invGamma);
                        const _sroa_2_base = ((i) * 40 + 36);
                        const ftv_x = _b_allForces[_sroa_2_base + 0];
                        const ftv_y = _b_allForces[_sroa_2_base + 1];
                        const fx = ftv_x;
                        const fy = ftv_y;
                        const fSq = ((fx * fx) + (fy * fy));
                        const vDotF = ((vx * fx) + (vy * fy));
                        const t23 = ((((-tau) * gamma) * ((fSq - (vDotF * vDotF)))) * mInv);
                        fRadX = (fRadX + (t23 * vx));
                        fRadY = (fRadY + (t23 * vy));
                    }
                    const dt = _u_u_dt;
                    const keBefore = ((wMagSq / ((gamma + 1.0))) * _b_particles[((i) * 9 + 4)]);
                    {
                        const _wbase = ((i) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + ((fRadX * dt) * mInv));
                    }
                    {
                        const _wbase = ((i) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + ((fRadY * dt) * mInv));
                    }
                    rs_radDisplayX = fRadX;
                    rs_radDisplayY = fRadY;
                    const _sroa_3_base = ((i) * 40);
                    let afRad_f0_x = _b_allForces[_sroa_3_base + 0];
                    let afRad_f0_y = _b_allForces[_sroa_3_base + 1];
                    let afRad_f0_z = _b_allForces[_sroa_3_base + 2];
                    let afRad_f0_w = _b_allForces[_sroa_3_base + 3];
                    let afRad_f1_x = _b_allForces[_sroa_3_base + 4];
                    let afRad_f1_y = _b_allForces[_sroa_3_base + 5];
                    let afRad_f1_z = _b_allForces[_sroa_3_base + 6];
                    let afRad_f1_w = _b_allForces[_sroa_3_base + 7];
                    let afRad_f2_x = _b_allForces[_sroa_3_base + 8];
                    let afRad_f2_y = _b_allForces[_sroa_3_base + 9];
                    let afRad_f2_z = _b_allForces[_sroa_3_base + 10];
                    let afRad_f2_w = _b_allForces[_sroa_3_base + 11];
                    let afRad_f3_x = _b_allForces[_sroa_3_base + 12];
                    let afRad_f3_y = _b_allForces[_sroa_3_base + 13];
                    let afRad_f3_z = _b_allForces[_sroa_3_base + 14];
                    let afRad_f3_w = _b_allForces[_sroa_3_base + 15];
                    let afRad_f4_x = _b_allForces[_sroa_3_base + 16];
                    let afRad_f4_y = _b_allForces[_sroa_3_base + 17];
                    let afRad_f4_z = _b_allForces[_sroa_3_base + 18];
                    let afRad_f4_w = _b_allForces[_sroa_3_base + 19];
                    let afRad_f5_x = _b_allForces[_sroa_3_base + 20];
                    let afRad_f5_y = _b_allForces[_sroa_3_base + 21];
                    let afRad_f5_z = _b_allForces[_sroa_3_base + 22];
                    let afRad_f5_w = _b_allForces[_sroa_3_base + 23];
                    let afRad_torques_x = _b_allForces[_sroa_3_base + 24];
                    let afRad_torques_y = _b_allForces[_sroa_3_base + 25];
                    let afRad_torques_z = _b_allForces[_sroa_3_base + 26];
                    let afRad_torques_w = _b_allForces[_sroa_3_base + 27];
                    let afRad_bFields_x = _b_allForces[_sroa_3_base + 28];
                    let afRad_bFields_y = _b_allForces[_sroa_3_base + 29];
                    let afRad_bFields_z = _b_allForces[_sroa_3_base + 30];
                    let afRad_bFields_w = _b_allForces[_sroa_3_base + 31];
                    let afRad_bFieldGrads_x = _b_allForces[_sroa_3_base + 32];
                    let afRad_bFieldGrads_y = _b_allForces[_sroa_3_base + 33];
                    let afRad_bFieldGrads_z = _b_allForces[_sroa_3_base + 34];
                    let afRad_bFieldGrads_w = _b_allForces[_sroa_3_base + 35];
                    let afRad_totalForce_x = _b_allForces[_sroa_3_base + 36];
                    let afRad_totalForce_y = _b_allForces[_sroa_3_base + 37];
                    let afRad_jerk_x = _b_allForces[_sroa_3_base + 38];
                    let afRad_jerk_y = _b_allForces[_sroa_3_base + 39];
                    afRad_f3_x = fRadX;
                    afRad_f3_y = fRadY;
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afRad_f0_x;
                        _b_allForces[_wbase + 1] = afRad_f0_y;
                        _b_allForces[_wbase + 2] = afRad_f0_z;
                        _b_allForces[_wbase + 3] = afRad_f0_w;
                        _b_allForces[_wbase + 4] = afRad_f1_x;
                        _b_allForces[_wbase + 5] = afRad_f1_y;
                        _b_allForces[_wbase + 6] = afRad_f1_z;
                        _b_allForces[_wbase + 7] = afRad_f1_w;
                        _b_allForces[_wbase + 8] = afRad_f2_x;
                        _b_allForces[_wbase + 9] = afRad_f2_y;
                        _b_allForces[_wbase + 10] = afRad_f2_z;
                        _b_allForces[_wbase + 11] = afRad_f2_w;
                        _b_allForces[_wbase + 12] = afRad_f3_x;
                        _b_allForces[_wbase + 13] = afRad_f3_y;
                        _b_allForces[_wbase + 14] = afRad_f3_z;
                        _b_allForces[_wbase + 15] = afRad_f3_w;
                        _b_allForces[_wbase + 16] = afRad_f4_x;
                        _b_allForces[_wbase + 17] = afRad_f4_y;
                        _b_allForces[_wbase + 18] = afRad_f4_z;
                        _b_allForces[_wbase + 19] = afRad_f4_w;
                        _b_allForces[_wbase + 20] = afRad_f5_x;
                        _b_allForces[_wbase + 21] = afRad_f5_y;
                        _b_allForces[_wbase + 22] = afRad_f5_z;
                        _b_allForces[_wbase + 23] = afRad_f5_w;
                        _b_allForces[_wbase + 24] = afRad_torques_x;
                        _b_allForces[_wbase + 25] = afRad_torques_y;
                        _b_allForces[_wbase + 26] = afRad_torques_z;
                        _b_allForces[_wbase + 27] = afRad_torques_w;
                        _b_allForces[_wbase + 28] = afRad_bFields_x;
                        _b_allForces[_wbase + 29] = afRad_bFields_y;
                        _b_allForces[_wbase + 30] = afRad_bFields_z;
                        _b_allForces[_wbase + 31] = afRad_bFields_w;
                        _b_allForces[_wbase + 32] = afRad_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afRad_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afRad_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afRad_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afRad_totalForce_x;
                        _b_allForces[_wbase + 37] = afRad_totalForce_y;
                        _b_allForces[_wbase + 38] = afRad_jerk_x;
                        _b_allForces[_wbase + 39] = afRad_jerk_y;
                    }
                    const wx2 = _b_particles[((i) * 9 + 2)];
                    const wy2 = _b_particles[((i) * 9 + 3)];
                    const wMagSqAfter = ((wx2 * wx2) + (wy2 * wy2));
                    const gammaAfter = Math.sqrt((1.0 + wMagSqAfter));
                    const keAfter = ((wMagSqAfter / ((gammaAfter + 1.0))) * _b_particles[((i) * 9 + 4)]);
                    const dE = ((0.0) < ((keBefore - keAfter)) ? ((keBefore - keAfter)) : (0.0));
                    rs_radAccum = (rs_radAccum + dE);
                    if ((rs_radAccum >= MIN_MASS)) {
                        const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                        if ((phIdx < MAX_PHOTONS)) {
                            const _sroa_4_base = ((i) * 40 + 36);
                            const ftv3_x = _b_allForces[_sroa_4_base + 0];
                            const ftv3_y = _b_allForces[_sroa_4_base + 1];
                            const ax = (ftv3_x * mInv);
                            const ay = (ftv3_y * mInv);
                            const aMag = Math.sqrt(((ax * ax) + (ay * ay)));
                            let emitAngle = 0;
                            if ((aMag > EPSILON)) {
                                const accelAngle = Math.atan2(ay, ax);
                                let accepted = false;
                                let seedBase = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                    const _inl_24_seed = (seedBase ^ ((t * 1234567)));
                                    let _inl_24_result;
                                    _inl_24: {
                                        let _inl_24__inl_0_result;
                                        _inl_24__inl_0: {
                                            let _inl_24__inl_0_state = ((_inl_24_seed * 747796405) + 2891336453);
                                            const _inl_24__inl_0_word = (((((_inl_24__inl_0_state >> ((((_inl_24__inl_0_state >> 28)) + 4)))) ^ _inl_24__inl_0_state)) * 277803737);
                                            _inl_24__inl_0_result = (((_inl_24__inl_0_word >> 22)) ^ _inl_24__inl_0_word);
                                            break _inl_24__inl_0;
                                        }
                                        _inl_24_result = ((+(_inl_24__inl_0_result)) / 4294967296.0);
                                        break _inl_24;
                                    }
                                    const theta = (_inl_24_result * TWO_PI);
                                    const sinTh = Math.sin(theta);
                                    const _inl_25_seed = (seedBase ^ (((t * 7654321) + 1)));
                                    let _inl_25_result;
                                    _inl_25: {
                                        let _inl_25__inl_0_result;
                                        _inl_25__inl_0: {
                                            let _inl_25__inl_0_state = ((_inl_25_seed * 747796405) + 2891336453);
                                            const _inl_25__inl_0_word = (((((_inl_25__inl_0_state >> ((((_inl_25__inl_0_state >> 28)) + 4)))) ^ _inl_25__inl_0_state)) * 277803737);
                                            _inl_25__inl_0_result = (((_inl_25__inl_0_word >> 22)) ^ _inl_25__inl_0_word);
                                            break _inl_25__inl_0;
                                        }
                                        _inl_25_result = ((+(_inl_25__inl_0_result)) / 4294967296.0);
                                        break _inl_25;
                                    }
                                    if ((_inl_25_result <= (sinTh * sinTh))) {
                                        emitAngle = (accelAngle + theta);
                                        accepted = true;
                                        break;
                                    }
                                }
                                if ((!accepted)) {
                                    emitAngle = (accelAngle + HALF_PI);
                                }
                                if ((gamma > ABERRATION_THRESHOLD)) {
                                    const beta = Math.sqrt((((1.0 - (1.0 / ((gamma * gamma))))) < (0.0) ? (0.0) : ((1.0 - (1.0 / ((gamma * gamma)))))));
                                    const vx2 = (wx * ((1.0 / gamma)));
                                    const vy2 = (wy * ((1.0 / gamma)));
                                    const velAngle = Math.atan2(vy2, vx2);
                                    const delta = (emitAngle - velAngle);
                                    const sinD = Math.sin(delta);
                                    const cosD = Math.cos(delta);
                                    const denom = (1.0 + (beta * cosD));
                                    emitAngle = (velAngle + Math.atan2((sinD / ((gamma * denom))), (((cosD + beta)) / denom)));
                                }
                            } else {
                                const _inl_26_seed = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                let _inl_26_result;
                                _inl_26: {
                                    let _inl_26__inl_0_result;
                                    _inl_26__inl_0: {
                                        let _inl_26__inl_0_state = ((_inl_26_seed * 747796405) + 2891336453);
                                        const _inl_26__inl_0_word = (((((_inl_26__inl_0_state >> ((((_inl_26__inl_0_state >> 28)) + 4)))) ^ _inl_26__inl_0_state)) * 277803737);
                                        _inl_26__inl_0_result = (((_inl_26__inl_0_word >> 22)) ^ _inl_26__inl_0_word);
                                        break _inl_26__inl_0;
                                    }
                                    _inl_26_result = ((+(_inl_26__inl_0_result)) / 4294967296.0);
                                    break _inl_26;
                                }
                                emitAngle = (_inl_26_result * TWO_PI);
                            }
                            const cosA = Math.cos(emitAngle);
                            const sinA = Math.sin(emitAngle);
                            const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                            let ph_posX = 0;
                            let ph_posY = 0;
                            let ph_velX = 0;
                            let ph_velY = 0;
                            let ph_energy = 0;
                            let ph_emitterId = 0;
                            let ph_lifetime = 0;
                            let ph_flags = 0;
                            ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                            ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                            ph_velX = cosA;
                            ph_velY = sinA;
                            ph_energy = rs_radAccum;
                            ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                            rs_radAccum = 0.0;
                        } else {
                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
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
                            const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                            const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                            if (((!coulombOn) || (!radiationOn))) {
                                break __invocation;
                            }
                            if ((Math.abs(_b_particles[((i) * 9 + 5)]) < EPSILON)) {
                                break __invocation;
                            }
                            const wx = _b_particles[((i) * 9 + 2)];
                            const wy = _b_particles[((i) * 9 + 3)];
                            const wMagSq = ((wx * wx) + (wy * wy));
                            if ((wMagSq < (EPSILON * EPSILON))) {
                                break __invocation;
                            }
                            const gamma = Math.sqrt((1.0 + wMagSq));
                            const qSq = (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]);
                            const mInv = _b_derived[((i) * 8 + 2)];
                            const tau = ((0.6666666666666666 * qSq) * mInv);
                            const _sroa_5_base = ((i) * 40);
                            const af_f0_x = _b_allForces[_sroa_5_base + 0];
                            const af_f0_y = _b_allForces[_sroa_5_base + 1];
                            const af_f0_z = _b_allForces[_sroa_5_base + 2];
                            const af_f0_w = _b_allForces[_sroa_5_base + 3];
                            const af_f1_x = _b_allForces[_sroa_5_base + 4];
                            const af_f1_y = _b_allForces[_sroa_5_base + 5];
                            const af_f1_z = _b_allForces[_sroa_5_base + 6];
                            const af_f1_w = _b_allForces[_sroa_5_base + 7];
                            const af_f2_x = _b_allForces[_sroa_5_base + 8];
                            const af_f2_y = _b_allForces[_sroa_5_base + 9];
                            const af_f2_z = _b_allForces[_sroa_5_base + 10];
                            const af_f2_w = _b_allForces[_sroa_5_base + 11];
                            const af_f3_x = _b_allForces[_sroa_5_base + 12];
                            const af_f3_y = _b_allForces[_sroa_5_base + 13];
                            const af_f3_z = _b_allForces[_sroa_5_base + 14];
                            const af_f3_w = _b_allForces[_sroa_5_base + 15];
                            const af_f4_x = _b_allForces[_sroa_5_base + 16];
                            const af_f4_y = _b_allForces[_sroa_5_base + 17];
                            const af_f4_z = _b_allForces[_sroa_5_base + 18];
                            const af_f4_w = _b_allForces[_sroa_5_base + 19];
                            const af_f5_x = _b_allForces[_sroa_5_base + 20];
                            const af_f5_y = _b_allForces[_sroa_5_base + 21];
                            const af_f5_z = _b_allForces[_sroa_5_base + 22];
                            const af_f5_w = _b_allForces[_sroa_5_base + 23];
                            const af_torques_x = _b_allForces[_sroa_5_base + 24];
                            const af_torques_y = _b_allForces[_sroa_5_base + 25];
                            const af_torques_z = _b_allForces[_sroa_5_base + 26];
                            const af_torques_w = _b_allForces[_sroa_5_base + 27];
                            const af_bFields_x = _b_allForces[_sroa_5_base + 28];
                            const af_bFields_y = _b_allForces[_sroa_5_base + 29];
                            const af_bFields_z = _b_allForces[_sroa_5_base + 30];
                            const af_bFields_w = _b_allForces[_sroa_5_base + 31];
                            const af_bFieldGrads_x = _b_allForces[_sroa_5_base + 32];
                            const af_bFieldGrads_y = _b_allForces[_sroa_5_base + 33];
                            const af_bFieldGrads_z = _b_allForces[_sroa_5_base + 34];
                            const af_bFieldGrads_w = _b_allForces[_sroa_5_base + 35];
                            const af_totalForce_x = _b_allForces[_sroa_5_base + 36];
                            const af_totalForce_y = _b_allForces[_sroa_5_base + 37];
                            const af_jerk_x = _b_allForces[_sroa_5_base + 38];
                            const af_jerk_y = _b_allForces[_sroa_5_base + 39];
                            const _sroa_6_base = ((i) * 12);
                            let rs_radAccum = _b_radState[_sroa_6_base + 0];
                            let rs_hawkAccum = _b_radState[_sroa_6_base + 1];
                            let rs_yukawaRadAccum = _b_radState[_sroa_6_base + 2];
                            let rs_radDisplayX = _b_radState[_sroa_6_base + 3];
                            let rs_radDisplayY = _b_radState[_sroa_6_base + 4];
                            let rs_quadAccum = _b_radState[_sroa_6_base + 5];
                            let rs_emQuadAccum = _b_radState[_sroa_6_base + 6];
                            let rs_d3IContrib = _b_radState[_sroa_6_base + 7];
                            let rs_d3QContrib = _b_radState[_sroa_6_base + 8];
                            let rs_schwingerAccum = _b_radState[_sroa_6_base + 9];
                            let rs__pad1 = _b_radState[_sroa_6_base + 10];
                            let rs__pad2 = _b_radState[_sroa_6_base + 11];
                            let fRadX = (tau * af_jerk_x);
                            let fRadY = (tau * af_jerk_y);
                            const relativityOn = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                            if ((relativityOn && (gamma > 1.0))) {
                                const invG3 = (1.0 / (((gamma * gamma) * gamma)));
                                fRadX = (fRadX * invG3);
                                fRadY = (fRadY * invG3);
                                const invGamma = (1.0 / gamma);
                                const vx = (wx * invGamma);
                                const vy = (wy * invGamma);
                                const _sroa_7_base = ((i) * 40 + 36);
                                const ftv_x = _b_allForces[_sroa_7_base + 0];
                                const ftv_y = _b_allForces[_sroa_7_base + 1];
                                const fx = ftv_x;
                                const fy = ftv_y;
                                const fSq = ((fx * fx) + (fy * fy));
                                const vDotF = ((vx * fx) + (vy * fy));
                                const t23 = ((((-tau) * gamma) * ((fSq - (vDotF * vDotF)))) * mInv);
                                fRadX = (fRadX + (t23 * vx));
                                fRadY = (fRadY + (t23 * vy));
                            }
                            const dt = _u_u_dt;
                            const keBefore = ((wMagSq / ((gamma + 1.0))) * _b_particles[((i) * 9 + 4)]);
                            {
                                const _wbase = ((i) * 9 + 2) - 2;
                                _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + ((fRadX * dt) * mInv));
                            }
                            {
                                const _wbase = ((i) * 9 + 3) - 3;
                                _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + ((fRadY * dt) * mInv));
                            }
                            rs_radDisplayX = fRadX;
                            rs_radDisplayY = fRadY;
                            const _sroa_8_base = ((i) * 40);
                            let afRad_f0_x = _b_allForces[_sroa_8_base + 0];
                            let afRad_f0_y = _b_allForces[_sroa_8_base + 1];
                            let afRad_f0_z = _b_allForces[_sroa_8_base + 2];
                            let afRad_f0_w = _b_allForces[_sroa_8_base + 3];
                            let afRad_f1_x = _b_allForces[_sroa_8_base + 4];
                            let afRad_f1_y = _b_allForces[_sroa_8_base + 5];
                            let afRad_f1_z = _b_allForces[_sroa_8_base + 6];
                            let afRad_f1_w = _b_allForces[_sroa_8_base + 7];
                            let afRad_f2_x = _b_allForces[_sroa_8_base + 8];
                            let afRad_f2_y = _b_allForces[_sroa_8_base + 9];
                            let afRad_f2_z = _b_allForces[_sroa_8_base + 10];
                            let afRad_f2_w = _b_allForces[_sroa_8_base + 11];
                            let afRad_f3_x = _b_allForces[_sroa_8_base + 12];
                            let afRad_f3_y = _b_allForces[_sroa_8_base + 13];
                            let afRad_f3_z = _b_allForces[_sroa_8_base + 14];
                            let afRad_f3_w = _b_allForces[_sroa_8_base + 15];
                            let afRad_f4_x = _b_allForces[_sroa_8_base + 16];
                            let afRad_f4_y = _b_allForces[_sroa_8_base + 17];
                            let afRad_f4_z = _b_allForces[_sroa_8_base + 18];
                            let afRad_f4_w = _b_allForces[_sroa_8_base + 19];
                            let afRad_f5_x = _b_allForces[_sroa_8_base + 20];
                            let afRad_f5_y = _b_allForces[_sroa_8_base + 21];
                            let afRad_f5_z = _b_allForces[_sroa_8_base + 22];
                            let afRad_f5_w = _b_allForces[_sroa_8_base + 23];
                            let afRad_torques_x = _b_allForces[_sroa_8_base + 24];
                            let afRad_torques_y = _b_allForces[_sroa_8_base + 25];
                            let afRad_torques_z = _b_allForces[_sroa_8_base + 26];
                            let afRad_torques_w = _b_allForces[_sroa_8_base + 27];
                            let afRad_bFields_x = _b_allForces[_sroa_8_base + 28];
                            let afRad_bFields_y = _b_allForces[_sroa_8_base + 29];
                            let afRad_bFields_z = _b_allForces[_sroa_8_base + 30];
                            let afRad_bFields_w = _b_allForces[_sroa_8_base + 31];
                            let afRad_bFieldGrads_x = _b_allForces[_sroa_8_base + 32];
                            let afRad_bFieldGrads_y = _b_allForces[_sroa_8_base + 33];
                            let afRad_bFieldGrads_z = _b_allForces[_sroa_8_base + 34];
                            let afRad_bFieldGrads_w = _b_allForces[_sroa_8_base + 35];
                            let afRad_totalForce_x = _b_allForces[_sroa_8_base + 36];
                            let afRad_totalForce_y = _b_allForces[_sroa_8_base + 37];
                            let afRad_jerk_x = _b_allForces[_sroa_8_base + 38];
                            let afRad_jerk_y = _b_allForces[_sroa_8_base + 39];
                            afRad_f3_x = fRadX;
                            afRad_f3_y = fRadY;
                            {
                                const _wbase = ((i) * 40);
                                _b_allForces[_wbase + 0] = afRad_f0_x;
                                _b_allForces[_wbase + 1] = afRad_f0_y;
                                _b_allForces[_wbase + 2] = afRad_f0_z;
                                _b_allForces[_wbase + 3] = afRad_f0_w;
                                _b_allForces[_wbase + 4] = afRad_f1_x;
                                _b_allForces[_wbase + 5] = afRad_f1_y;
                                _b_allForces[_wbase + 6] = afRad_f1_z;
                                _b_allForces[_wbase + 7] = afRad_f1_w;
                                _b_allForces[_wbase + 8] = afRad_f2_x;
                                _b_allForces[_wbase + 9] = afRad_f2_y;
                                _b_allForces[_wbase + 10] = afRad_f2_z;
                                _b_allForces[_wbase + 11] = afRad_f2_w;
                                _b_allForces[_wbase + 12] = afRad_f3_x;
                                _b_allForces[_wbase + 13] = afRad_f3_y;
                                _b_allForces[_wbase + 14] = afRad_f3_z;
                                _b_allForces[_wbase + 15] = afRad_f3_w;
                                _b_allForces[_wbase + 16] = afRad_f4_x;
                                _b_allForces[_wbase + 17] = afRad_f4_y;
                                _b_allForces[_wbase + 18] = afRad_f4_z;
                                _b_allForces[_wbase + 19] = afRad_f4_w;
                                _b_allForces[_wbase + 20] = afRad_f5_x;
                                _b_allForces[_wbase + 21] = afRad_f5_y;
                                _b_allForces[_wbase + 22] = afRad_f5_z;
                                _b_allForces[_wbase + 23] = afRad_f5_w;
                                _b_allForces[_wbase + 24] = afRad_torques_x;
                                _b_allForces[_wbase + 25] = afRad_torques_y;
                                _b_allForces[_wbase + 26] = afRad_torques_z;
                                _b_allForces[_wbase + 27] = afRad_torques_w;
                                _b_allForces[_wbase + 28] = afRad_bFields_x;
                                _b_allForces[_wbase + 29] = afRad_bFields_y;
                                _b_allForces[_wbase + 30] = afRad_bFields_z;
                                _b_allForces[_wbase + 31] = afRad_bFields_w;
                                _b_allForces[_wbase + 32] = afRad_bFieldGrads_x;
                                _b_allForces[_wbase + 33] = afRad_bFieldGrads_y;
                                _b_allForces[_wbase + 34] = afRad_bFieldGrads_z;
                                _b_allForces[_wbase + 35] = afRad_bFieldGrads_w;
                                _b_allForces[_wbase + 36] = afRad_totalForce_x;
                                _b_allForces[_wbase + 37] = afRad_totalForce_y;
                                _b_allForces[_wbase + 38] = afRad_jerk_x;
                                _b_allForces[_wbase + 39] = afRad_jerk_y;
                            }
                            const wx2 = _b_particles[((i) * 9 + 2)];
                            const wy2 = _b_particles[((i) * 9 + 3)];
                            const wMagSqAfter = ((wx2 * wx2) + (wy2 * wy2));
                            const gammaAfter = Math.sqrt((1.0 + wMagSqAfter));
                            const keAfter = ((wMagSqAfter / ((gammaAfter + 1.0))) * _b_particles[((i) * 9 + 4)]);
                            const dE = ((0.0) < ((keBefore - keAfter)) ? ((keBefore - keAfter)) : (0.0));
                            rs_radAccum = (rs_radAccum + dE);
                            if ((rs_radAccum >= MIN_MASS)) {
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const _sroa_9_base = ((i) * 40 + 36);
                                    const ftv3_x = _b_allForces[_sroa_9_base + 0];
                                    const ftv3_y = _b_allForces[_sroa_9_base + 1];
                                    const ax = (ftv3_x * mInv);
                                    const ay = (ftv3_y * mInv);
                                    const aMag = Math.sqrt(((ax * ax) + (ay * ay)));
                                    let emitAngle = 0;
                                    if ((aMag > EPSILON)) {
                                        const accelAngle = Math.atan2(ay, ax);
                                        let accepted = false;
                                        let seedBase = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                        for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                            const _inl_24_seed = (seedBase ^ ((t * 1234567)));
                                            let _inl_24_result;
                                            _inl_24: {
                                                let _inl_24__inl_0_result;
                                                _inl_24__inl_0: {
                                                    let _inl_24__inl_0_state = ((_inl_24_seed * 747796405) + 2891336453);
                                                    const _inl_24__inl_0_word = (((((_inl_24__inl_0_state >> ((((_inl_24__inl_0_state >> 28)) + 4)))) ^ _inl_24__inl_0_state)) * 277803737);
                                                    _inl_24__inl_0_result = (((_inl_24__inl_0_word >> 22)) ^ _inl_24__inl_0_word);
                                                    break _inl_24__inl_0;
                                                }
                                                _inl_24_result = ((+(_inl_24__inl_0_result)) / 4294967296.0);
                                                break _inl_24;
                                            }
                                            const theta = (_inl_24_result * TWO_PI);
                                            const sinTh = Math.sin(theta);
                                            const _inl_25_seed = (seedBase ^ (((t * 7654321) + 1)));
                                            let _inl_25_result;
                                            _inl_25: {
                                                let _inl_25__inl_0_result;
                                                _inl_25__inl_0: {
                                                    let _inl_25__inl_0_state = ((_inl_25_seed * 747796405) + 2891336453);
                                                    const _inl_25__inl_0_word = (((((_inl_25__inl_0_state >> ((((_inl_25__inl_0_state >> 28)) + 4)))) ^ _inl_25__inl_0_state)) * 277803737);
                                                    _inl_25__inl_0_result = (((_inl_25__inl_0_word >> 22)) ^ _inl_25__inl_0_word);
                                                    break _inl_25__inl_0;
                                                }
                                                _inl_25_result = ((+(_inl_25__inl_0_result)) / 4294967296.0);
                                                break _inl_25;
                                            }
                                            if ((_inl_25_result <= (sinTh * sinTh))) {
                                                emitAngle = (accelAngle + theta);
                                                accepted = true;
                                                break;
                                            }
                                        }
                                        if ((!accepted)) {
                                            emitAngle = (accelAngle + HALF_PI);
                                        }
                                        if ((gamma > ABERRATION_THRESHOLD)) {
                                            const beta = Math.sqrt((((1.0 - (1.0 / ((gamma * gamma))))) < (0.0) ? (0.0) : ((1.0 - (1.0 / ((gamma * gamma)))))));
                                            const vx2 = (wx * ((1.0 / gamma)));
                                            const vy2 = (wy * ((1.0 / gamma)));
                                            const velAngle = Math.atan2(vy2, vx2);
                                            const delta = (emitAngle - velAngle);
                                            const sinD = Math.sin(delta);
                                            const cosD = Math.cos(delta);
                                            const denom = (1.0 + (beta * cosD));
                                            emitAngle = (velAngle + Math.atan2((sinD / ((gamma * denom))), (((cosD + beta)) / denom)));
                                        }
                                    } else {
                                        const _inl_26_seed = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                        let _inl_26_result;
                                        _inl_26: {
                                            let _inl_26__inl_0_result;
                                            _inl_26__inl_0: {
                                                let _inl_26__inl_0_state = ((_inl_26_seed * 747796405) + 2891336453);
                                                const _inl_26__inl_0_word = (((((_inl_26__inl_0_state >> ((((_inl_26__inl_0_state >> 28)) + 4)))) ^ _inl_26__inl_0_state)) * 277803737);
                                                _inl_26__inl_0_result = (((_inl_26__inl_0_word >> 22)) ^ _inl_26__inl_0_word);
                                                break _inl_26__inl_0;
                                            }
                                            _inl_26_result = ((+(_inl_26__inl_0_result)) / 4294967296.0);
                                            break _inl_26;
                                        }
                                        emitAngle = (_inl_26_result * TWO_PI);
                                    }
                                    const cosA = Math.cos(emitAngle);
                                    const sinA = Math.sin(emitAngle);
                                    const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                                    ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                                    ph_velX = cosA;
                                    ph_velY = sinA;
                                    ph_energy = rs_radAccum;
                                    ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                                    rs_radAccum = 0.0;
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                                }
                            }
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
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
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                        if (((!coulombOn) || (!radiationOn))) {
                            break __invocation;
                        }
                        if ((Math.abs(_b_particles[((i) * 9 + 5)]) < EPSILON)) {
                            break __invocation;
                        }
                        const wx = _b_particles[((i) * 9 + 2)];
                        const wy = _b_particles[((i) * 9 + 3)];
                        const wMagSq = ((wx * wx) + (wy * wy));
                        if ((wMagSq < (EPSILON * EPSILON))) {
                            break __invocation;
                        }
                        const gamma = Math.sqrt((1.0 + wMagSq));
                        const qSq = (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]);
                        const mInv = _b_derived[((i) * 8 + 2)];
                        const tau = ((0.6666666666666666 * qSq) * mInv);
                        const _sroa_10_base = ((i) * 40);
                        const af_f0_x = _b_allForces[_sroa_10_base + 0];
                        const af_f0_y = _b_allForces[_sroa_10_base + 1];
                        const af_f0_z = _b_allForces[_sroa_10_base + 2];
                        const af_f0_w = _b_allForces[_sroa_10_base + 3];
                        const af_f1_x = _b_allForces[_sroa_10_base + 4];
                        const af_f1_y = _b_allForces[_sroa_10_base + 5];
                        const af_f1_z = _b_allForces[_sroa_10_base + 6];
                        const af_f1_w = _b_allForces[_sroa_10_base + 7];
                        const af_f2_x = _b_allForces[_sroa_10_base + 8];
                        const af_f2_y = _b_allForces[_sroa_10_base + 9];
                        const af_f2_z = _b_allForces[_sroa_10_base + 10];
                        const af_f2_w = _b_allForces[_sroa_10_base + 11];
                        const af_f3_x = _b_allForces[_sroa_10_base + 12];
                        const af_f3_y = _b_allForces[_sroa_10_base + 13];
                        const af_f3_z = _b_allForces[_sroa_10_base + 14];
                        const af_f3_w = _b_allForces[_sroa_10_base + 15];
                        const af_f4_x = _b_allForces[_sroa_10_base + 16];
                        const af_f4_y = _b_allForces[_sroa_10_base + 17];
                        const af_f4_z = _b_allForces[_sroa_10_base + 18];
                        const af_f4_w = _b_allForces[_sroa_10_base + 19];
                        const af_f5_x = _b_allForces[_sroa_10_base + 20];
                        const af_f5_y = _b_allForces[_sroa_10_base + 21];
                        const af_f5_z = _b_allForces[_sroa_10_base + 22];
                        const af_f5_w = _b_allForces[_sroa_10_base + 23];
                        const af_torques_x = _b_allForces[_sroa_10_base + 24];
                        const af_torques_y = _b_allForces[_sroa_10_base + 25];
                        const af_torques_z = _b_allForces[_sroa_10_base + 26];
                        const af_torques_w = _b_allForces[_sroa_10_base + 27];
                        const af_bFields_x = _b_allForces[_sroa_10_base + 28];
                        const af_bFields_y = _b_allForces[_sroa_10_base + 29];
                        const af_bFields_z = _b_allForces[_sroa_10_base + 30];
                        const af_bFields_w = _b_allForces[_sroa_10_base + 31];
                        const af_bFieldGrads_x = _b_allForces[_sroa_10_base + 32];
                        const af_bFieldGrads_y = _b_allForces[_sroa_10_base + 33];
                        const af_bFieldGrads_z = _b_allForces[_sroa_10_base + 34];
                        const af_bFieldGrads_w = _b_allForces[_sroa_10_base + 35];
                        const af_totalForce_x = _b_allForces[_sroa_10_base + 36];
                        const af_totalForce_y = _b_allForces[_sroa_10_base + 37];
                        const af_jerk_x = _b_allForces[_sroa_10_base + 38];
                        const af_jerk_y = _b_allForces[_sroa_10_base + 39];
                        const _sroa_11_base = ((i) * 12);
                        let rs_radAccum = _b_radState[_sroa_11_base + 0];
                        let rs_hawkAccum = _b_radState[_sroa_11_base + 1];
                        let rs_yukawaRadAccum = _b_radState[_sroa_11_base + 2];
                        let rs_radDisplayX = _b_radState[_sroa_11_base + 3];
                        let rs_radDisplayY = _b_radState[_sroa_11_base + 4];
                        let rs_quadAccum = _b_radState[_sroa_11_base + 5];
                        let rs_emQuadAccum = _b_radState[_sroa_11_base + 6];
                        let rs_d3IContrib = _b_radState[_sroa_11_base + 7];
                        let rs_d3QContrib = _b_radState[_sroa_11_base + 8];
                        let rs_schwingerAccum = _b_radState[_sroa_11_base + 9];
                        let rs__pad1 = _b_radState[_sroa_11_base + 10];
                        let rs__pad2 = _b_radState[_sroa_11_base + 11];
                        let fRadX = (tau * af_jerk_x);
                        let fRadY = (tau * af_jerk_y);
                        const relativityOn = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                        if ((relativityOn && (gamma > 1.0))) {
                            const invG3 = (1.0 / (((gamma * gamma) * gamma)));
                            fRadX = (fRadX * invG3);
                            fRadY = (fRadY * invG3);
                            const invGamma = (1.0 / gamma);
                            const vx = (wx * invGamma);
                            const vy = (wy * invGamma);
                            const _sroa_12_base = ((i) * 40 + 36);
                            const ftv_x = _b_allForces[_sroa_12_base + 0];
                            const ftv_y = _b_allForces[_sroa_12_base + 1];
                            const fx = ftv_x;
                            const fy = ftv_y;
                            const fSq = ((fx * fx) + (fy * fy));
                            const vDotF = ((vx * fx) + (vy * fy));
                            const t23 = ((((-tau) * gamma) * ((fSq - (vDotF * vDotF)))) * mInv);
                            fRadX = (fRadX + (t23 * vx));
                            fRadY = (fRadY + (t23 * vy));
                        }
                        const dt = _u_u_dt;
                        const keBefore = ((wMagSq / ((gamma + 1.0))) * _b_particles[((i) * 9 + 4)]);
                        {
                            const _wbase = ((i) * 9 + 2) - 2;
                            _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + ((fRadX * dt) * mInv));
                        }
                        {
                            const _wbase = ((i) * 9 + 3) - 3;
                            _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + ((fRadY * dt) * mInv));
                        }
                        rs_radDisplayX = fRadX;
                        rs_radDisplayY = fRadY;
                        const _sroa_13_base = ((i) * 40);
                        let afRad_f0_x = _b_allForces[_sroa_13_base + 0];
                        let afRad_f0_y = _b_allForces[_sroa_13_base + 1];
                        let afRad_f0_z = _b_allForces[_sroa_13_base + 2];
                        let afRad_f0_w = _b_allForces[_sroa_13_base + 3];
                        let afRad_f1_x = _b_allForces[_sroa_13_base + 4];
                        let afRad_f1_y = _b_allForces[_sroa_13_base + 5];
                        let afRad_f1_z = _b_allForces[_sroa_13_base + 6];
                        let afRad_f1_w = _b_allForces[_sroa_13_base + 7];
                        let afRad_f2_x = _b_allForces[_sroa_13_base + 8];
                        let afRad_f2_y = _b_allForces[_sroa_13_base + 9];
                        let afRad_f2_z = _b_allForces[_sroa_13_base + 10];
                        let afRad_f2_w = _b_allForces[_sroa_13_base + 11];
                        let afRad_f3_x = _b_allForces[_sroa_13_base + 12];
                        let afRad_f3_y = _b_allForces[_sroa_13_base + 13];
                        let afRad_f3_z = _b_allForces[_sroa_13_base + 14];
                        let afRad_f3_w = _b_allForces[_sroa_13_base + 15];
                        let afRad_f4_x = _b_allForces[_sroa_13_base + 16];
                        let afRad_f4_y = _b_allForces[_sroa_13_base + 17];
                        let afRad_f4_z = _b_allForces[_sroa_13_base + 18];
                        let afRad_f4_w = _b_allForces[_sroa_13_base + 19];
                        let afRad_f5_x = _b_allForces[_sroa_13_base + 20];
                        let afRad_f5_y = _b_allForces[_sroa_13_base + 21];
                        let afRad_f5_z = _b_allForces[_sroa_13_base + 22];
                        let afRad_f5_w = _b_allForces[_sroa_13_base + 23];
                        let afRad_torques_x = _b_allForces[_sroa_13_base + 24];
                        let afRad_torques_y = _b_allForces[_sroa_13_base + 25];
                        let afRad_torques_z = _b_allForces[_sroa_13_base + 26];
                        let afRad_torques_w = _b_allForces[_sroa_13_base + 27];
                        let afRad_bFields_x = _b_allForces[_sroa_13_base + 28];
                        let afRad_bFields_y = _b_allForces[_sroa_13_base + 29];
                        let afRad_bFields_z = _b_allForces[_sroa_13_base + 30];
                        let afRad_bFields_w = _b_allForces[_sroa_13_base + 31];
                        let afRad_bFieldGrads_x = _b_allForces[_sroa_13_base + 32];
                        let afRad_bFieldGrads_y = _b_allForces[_sroa_13_base + 33];
                        let afRad_bFieldGrads_z = _b_allForces[_sroa_13_base + 34];
                        let afRad_bFieldGrads_w = _b_allForces[_sroa_13_base + 35];
                        let afRad_totalForce_x = _b_allForces[_sroa_13_base + 36];
                        let afRad_totalForce_y = _b_allForces[_sroa_13_base + 37];
                        let afRad_jerk_x = _b_allForces[_sroa_13_base + 38];
                        let afRad_jerk_y = _b_allForces[_sroa_13_base + 39];
                        afRad_f3_x = fRadX;
                        afRad_f3_y = fRadY;
                        {
                            const _wbase = ((i) * 40);
                            _b_allForces[_wbase + 0] = afRad_f0_x;
                            _b_allForces[_wbase + 1] = afRad_f0_y;
                            _b_allForces[_wbase + 2] = afRad_f0_z;
                            _b_allForces[_wbase + 3] = afRad_f0_w;
                            _b_allForces[_wbase + 4] = afRad_f1_x;
                            _b_allForces[_wbase + 5] = afRad_f1_y;
                            _b_allForces[_wbase + 6] = afRad_f1_z;
                            _b_allForces[_wbase + 7] = afRad_f1_w;
                            _b_allForces[_wbase + 8] = afRad_f2_x;
                            _b_allForces[_wbase + 9] = afRad_f2_y;
                            _b_allForces[_wbase + 10] = afRad_f2_z;
                            _b_allForces[_wbase + 11] = afRad_f2_w;
                            _b_allForces[_wbase + 12] = afRad_f3_x;
                            _b_allForces[_wbase + 13] = afRad_f3_y;
                            _b_allForces[_wbase + 14] = afRad_f3_z;
                            _b_allForces[_wbase + 15] = afRad_f3_w;
                            _b_allForces[_wbase + 16] = afRad_f4_x;
                            _b_allForces[_wbase + 17] = afRad_f4_y;
                            _b_allForces[_wbase + 18] = afRad_f4_z;
                            _b_allForces[_wbase + 19] = afRad_f4_w;
                            _b_allForces[_wbase + 20] = afRad_f5_x;
                            _b_allForces[_wbase + 21] = afRad_f5_y;
                            _b_allForces[_wbase + 22] = afRad_f5_z;
                            _b_allForces[_wbase + 23] = afRad_f5_w;
                            _b_allForces[_wbase + 24] = afRad_torques_x;
                            _b_allForces[_wbase + 25] = afRad_torques_y;
                            _b_allForces[_wbase + 26] = afRad_torques_z;
                            _b_allForces[_wbase + 27] = afRad_torques_w;
                            _b_allForces[_wbase + 28] = afRad_bFields_x;
                            _b_allForces[_wbase + 29] = afRad_bFields_y;
                            _b_allForces[_wbase + 30] = afRad_bFields_z;
                            _b_allForces[_wbase + 31] = afRad_bFields_w;
                            _b_allForces[_wbase + 32] = afRad_bFieldGrads_x;
                            _b_allForces[_wbase + 33] = afRad_bFieldGrads_y;
                            _b_allForces[_wbase + 34] = afRad_bFieldGrads_z;
                            _b_allForces[_wbase + 35] = afRad_bFieldGrads_w;
                            _b_allForces[_wbase + 36] = afRad_totalForce_x;
                            _b_allForces[_wbase + 37] = afRad_totalForce_y;
                            _b_allForces[_wbase + 38] = afRad_jerk_x;
                            _b_allForces[_wbase + 39] = afRad_jerk_y;
                        }
                        const wx2 = _b_particles[((i) * 9 + 2)];
                        const wy2 = _b_particles[((i) * 9 + 3)];
                        const wMagSqAfter = ((wx2 * wx2) + (wy2 * wy2));
                        const gammaAfter = Math.sqrt((1.0 + wMagSqAfter));
                        const keAfter = ((wMagSqAfter / ((gammaAfter + 1.0))) * _b_particles[((i) * 9 + 4)]);
                        const dE = ((0.0) < ((keBefore - keAfter)) ? ((keBefore - keAfter)) : (0.0));
                        rs_radAccum = (rs_radAccum + dE);
                        if ((rs_radAccum >= MIN_MASS)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const _sroa_14_base = ((i) * 40 + 36);
                                const ftv3_x = _b_allForces[_sroa_14_base + 0];
                                const ftv3_y = _b_allForces[_sroa_14_base + 1];
                                const ax = (ftv3_x * mInv);
                                const ay = (ftv3_y * mInv);
                                const aMag = Math.sqrt(((ax * ax) + (ay * ay)));
                                let emitAngle = 0;
                                if ((aMag > EPSILON)) {
                                    const accelAngle = Math.atan2(ay, ax);
                                    let accepted = false;
                                    let seedBase = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                    for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                        const _inl_24_seed = (seedBase ^ ((t * 1234567)));
                                        let _inl_24_result;
                                        _inl_24: {
                                            let _inl_24__inl_0_result;
                                            _inl_24__inl_0: {
                                                let _inl_24__inl_0_state = ((_inl_24_seed * 747796405) + 2891336453);
                                                const _inl_24__inl_0_word = (((((_inl_24__inl_0_state >> ((((_inl_24__inl_0_state >> 28)) + 4)))) ^ _inl_24__inl_0_state)) * 277803737);
                                                _inl_24__inl_0_result = (((_inl_24__inl_0_word >> 22)) ^ _inl_24__inl_0_word);
                                                break _inl_24__inl_0;
                                            }
                                            _inl_24_result = ((+(_inl_24__inl_0_result)) / 4294967296.0);
                                            break _inl_24;
                                        }
                                        const theta = (_inl_24_result * TWO_PI);
                                        const sinTh = Math.sin(theta);
                                        const _inl_25_seed = (seedBase ^ (((t * 7654321) + 1)));
                                        let _inl_25_result;
                                        _inl_25: {
                                            let _inl_25__inl_0_result;
                                            _inl_25__inl_0: {
                                                let _inl_25__inl_0_state = ((_inl_25_seed * 747796405) + 2891336453);
                                                const _inl_25__inl_0_word = (((((_inl_25__inl_0_state >> ((((_inl_25__inl_0_state >> 28)) + 4)))) ^ _inl_25__inl_0_state)) * 277803737);
                                                _inl_25__inl_0_result = (((_inl_25__inl_0_word >> 22)) ^ _inl_25__inl_0_word);
                                                break _inl_25__inl_0;
                                            }
                                            _inl_25_result = ((+(_inl_25__inl_0_result)) / 4294967296.0);
                                            break _inl_25;
                                        }
                                        if ((_inl_25_result <= (sinTh * sinTh))) {
                                            emitAngle = (accelAngle + theta);
                                            accepted = true;
                                            break;
                                        }
                                    }
                                    if ((!accepted)) {
                                        emitAngle = (accelAngle + HALF_PI);
                                    }
                                    if ((gamma > ABERRATION_THRESHOLD)) {
                                        const beta = Math.sqrt((((1.0 - (1.0 / ((gamma * gamma))))) < (0.0) ? (0.0) : ((1.0 - (1.0 / ((gamma * gamma)))))));
                                        const vx2 = (wx * ((1.0 / gamma)));
                                        const vy2 = (wy * ((1.0 / gamma)));
                                        const velAngle = Math.atan2(vy2, vx2);
                                        const delta = (emitAngle - velAngle);
                                        const sinD = Math.sin(delta);
                                        const cosD = Math.cos(delta);
                                        const denom = (1.0 + (beta * cosD));
                                        emitAngle = (velAngle + Math.atan2((sinD / ((gamma * denom))), (((cosD + beta)) / denom)));
                                    }
                                } else {
                                    const _inl_26_seed = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                    let _inl_26_result;
                                    _inl_26: {
                                        let _inl_26__inl_0_result;
                                        _inl_26__inl_0: {
                                            let _inl_26__inl_0_state = ((_inl_26_seed * 747796405) + 2891336453);
                                            const _inl_26__inl_0_word = (((((_inl_26__inl_0_state >> ((((_inl_26__inl_0_state >> 28)) + 4)))) ^ _inl_26__inl_0_state)) * 277803737);
                                            _inl_26__inl_0_result = (((_inl_26__inl_0_word >> 22)) ^ _inl_26__inl_0_word);
                                            break _inl_26__inl_0;
                                        }
                                        _inl_26_result = ((+(_inl_26__inl_0_result)) / 4294967296.0);
                                        break _inl_26;
                                    }
                                    emitAngle = (_inl_26_result * TWO_PI);
                                }
                                const cosA = Math.cos(emitAngle);
                                const sinA = Math.sin(emitAngle);
                                const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                                ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = rs_radAccum;
                                ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                                rs_radAccum = 0.0;
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                            }
                        }
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
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
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!coulombOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    if ((Math.abs(_b_particles[((i) * 9 + 5)]) < EPSILON)) {
                        break __invocation;
                    }
                    const wx = _b_particles[((i) * 9 + 2)];
                    const wy = _b_particles[((i) * 9 + 3)];
                    const wMagSq = ((wx * wx) + (wy * wy));
                    if ((wMagSq < (EPSILON * EPSILON))) {
                        break __invocation;
                    }
                    const gamma = Math.sqrt((1.0 + wMagSq));
                    const qSq = (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]);
                    const mInv = _b_derived[((i) * 8 + 2)];
                    const tau = ((0.6666666666666666 * qSq) * mInv);
                    const _sroa_15_base = ((i) * 40);
                    const af_f0_x = _b_allForces[_sroa_15_base + 0];
                    const af_f0_y = _b_allForces[_sroa_15_base + 1];
                    const af_f0_z = _b_allForces[_sroa_15_base + 2];
                    const af_f0_w = _b_allForces[_sroa_15_base + 3];
                    const af_f1_x = _b_allForces[_sroa_15_base + 4];
                    const af_f1_y = _b_allForces[_sroa_15_base + 5];
                    const af_f1_z = _b_allForces[_sroa_15_base + 6];
                    const af_f1_w = _b_allForces[_sroa_15_base + 7];
                    const af_f2_x = _b_allForces[_sroa_15_base + 8];
                    const af_f2_y = _b_allForces[_sroa_15_base + 9];
                    const af_f2_z = _b_allForces[_sroa_15_base + 10];
                    const af_f2_w = _b_allForces[_sroa_15_base + 11];
                    const af_f3_x = _b_allForces[_sroa_15_base + 12];
                    const af_f3_y = _b_allForces[_sroa_15_base + 13];
                    const af_f3_z = _b_allForces[_sroa_15_base + 14];
                    const af_f3_w = _b_allForces[_sroa_15_base + 15];
                    const af_f4_x = _b_allForces[_sroa_15_base + 16];
                    const af_f4_y = _b_allForces[_sroa_15_base + 17];
                    const af_f4_z = _b_allForces[_sroa_15_base + 18];
                    const af_f4_w = _b_allForces[_sroa_15_base + 19];
                    const af_f5_x = _b_allForces[_sroa_15_base + 20];
                    const af_f5_y = _b_allForces[_sroa_15_base + 21];
                    const af_f5_z = _b_allForces[_sroa_15_base + 22];
                    const af_f5_w = _b_allForces[_sroa_15_base + 23];
                    const af_torques_x = _b_allForces[_sroa_15_base + 24];
                    const af_torques_y = _b_allForces[_sroa_15_base + 25];
                    const af_torques_z = _b_allForces[_sroa_15_base + 26];
                    const af_torques_w = _b_allForces[_sroa_15_base + 27];
                    const af_bFields_x = _b_allForces[_sroa_15_base + 28];
                    const af_bFields_y = _b_allForces[_sroa_15_base + 29];
                    const af_bFields_z = _b_allForces[_sroa_15_base + 30];
                    const af_bFields_w = _b_allForces[_sroa_15_base + 31];
                    const af_bFieldGrads_x = _b_allForces[_sroa_15_base + 32];
                    const af_bFieldGrads_y = _b_allForces[_sroa_15_base + 33];
                    const af_bFieldGrads_z = _b_allForces[_sroa_15_base + 34];
                    const af_bFieldGrads_w = _b_allForces[_sroa_15_base + 35];
                    const af_totalForce_x = _b_allForces[_sroa_15_base + 36];
                    const af_totalForce_y = _b_allForces[_sroa_15_base + 37];
                    const af_jerk_x = _b_allForces[_sroa_15_base + 38];
                    const af_jerk_y = _b_allForces[_sroa_15_base + 39];
                    const _sroa_16_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_16_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_16_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_16_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_16_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_16_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_16_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_16_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_16_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_16_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_16_base + 9];
                    let rs__pad1 = _b_radState[_sroa_16_base + 10];
                    let rs__pad2 = _b_radState[_sroa_16_base + 11];
                    let fRadX = (tau * af_jerk_x);
                    let fRadY = (tau * af_jerk_y);
                    const relativityOn = (((_u_u_toggles0 & RELATIVITY_BIT)) != 0);
                    if ((relativityOn && (gamma > 1.0))) {
                        const invG3 = (1.0 / (((gamma * gamma) * gamma)));
                        fRadX = (fRadX * invG3);
                        fRadY = (fRadY * invG3);
                        const invGamma = (1.0 / gamma);
                        const vx = (wx * invGamma);
                        const vy = (wy * invGamma);
                        const _sroa_17_base = ((i) * 40 + 36);
                        const ftv_x = _b_allForces[_sroa_17_base + 0];
                        const ftv_y = _b_allForces[_sroa_17_base + 1];
                        const fx = ftv_x;
                        const fy = ftv_y;
                        const fSq = ((fx * fx) + (fy * fy));
                        const vDotF = ((vx * fx) + (vy * fy));
                        const t23 = ((((-tau) * gamma) * ((fSq - (vDotF * vDotF)))) * mInv);
                        fRadX = (fRadX + (t23 * vx));
                        fRadY = (fRadY + (t23 * vy));
                    }
                    const dt = _u_u_dt;
                    const keBefore = ((wMagSq / ((gamma + 1.0))) * _b_particles[((i) * 9 + 4)]);
                    {
                        const _wbase = ((i) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] + ((fRadX * dt) * mInv));
                    }
                    {
                        const _wbase = ((i) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] + ((fRadY * dt) * mInv));
                    }
                    rs_radDisplayX = fRadX;
                    rs_radDisplayY = fRadY;
                    const _sroa_18_base = ((i) * 40);
                    let afRad_f0_x = _b_allForces[_sroa_18_base + 0];
                    let afRad_f0_y = _b_allForces[_sroa_18_base + 1];
                    let afRad_f0_z = _b_allForces[_sroa_18_base + 2];
                    let afRad_f0_w = _b_allForces[_sroa_18_base + 3];
                    let afRad_f1_x = _b_allForces[_sroa_18_base + 4];
                    let afRad_f1_y = _b_allForces[_sroa_18_base + 5];
                    let afRad_f1_z = _b_allForces[_sroa_18_base + 6];
                    let afRad_f1_w = _b_allForces[_sroa_18_base + 7];
                    let afRad_f2_x = _b_allForces[_sroa_18_base + 8];
                    let afRad_f2_y = _b_allForces[_sroa_18_base + 9];
                    let afRad_f2_z = _b_allForces[_sroa_18_base + 10];
                    let afRad_f2_w = _b_allForces[_sroa_18_base + 11];
                    let afRad_f3_x = _b_allForces[_sroa_18_base + 12];
                    let afRad_f3_y = _b_allForces[_sroa_18_base + 13];
                    let afRad_f3_z = _b_allForces[_sroa_18_base + 14];
                    let afRad_f3_w = _b_allForces[_sroa_18_base + 15];
                    let afRad_f4_x = _b_allForces[_sroa_18_base + 16];
                    let afRad_f4_y = _b_allForces[_sroa_18_base + 17];
                    let afRad_f4_z = _b_allForces[_sroa_18_base + 18];
                    let afRad_f4_w = _b_allForces[_sroa_18_base + 19];
                    let afRad_f5_x = _b_allForces[_sroa_18_base + 20];
                    let afRad_f5_y = _b_allForces[_sroa_18_base + 21];
                    let afRad_f5_z = _b_allForces[_sroa_18_base + 22];
                    let afRad_f5_w = _b_allForces[_sroa_18_base + 23];
                    let afRad_torques_x = _b_allForces[_sroa_18_base + 24];
                    let afRad_torques_y = _b_allForces[_sroa_18_base + 25];
                    let afRad_torques_z = _b_allForces[_sroa_18_base + 26];
                    let afRad_torques_w = _b_allForces[_sroa_18_base + 27];
                    let afRad_bFields_x = _b_allForces[_sroa_18_base + 28];
                    let afRad_bFields_y = _b_allForces[_sroa_18_base + 29];
                    let afRad_bFields_z = _b_allForces[_sroa_18_base + 30];
                    let afRad_bFields_w = _b_allForces[_sroa_18_base + 31];
                    let afRad_bFieldGrads_x = _b_allForces[_sroa_18_base + 32];
                    let afRad_bFieldGrads_y = _b_allForces[_sroa_18_base + 33];
                    let afRad_bFieldGrads_z = _b_allForces[_sroa_18_base + 34];
                    let afRad_bFieldGrads_w = _b_allForces[_sroa_18_base + 35];
                    let afRad_totalForce_x = _b_allForces[_sroa_18_base + 36];
                    let afRad_totalForce_y = _b_allForces[_sroa_18_base + 37];
                    let afRad_jerk_x = _b_allForces[_sroa_18_base + 38];
                    let afRad_jerk_y = _b_allForces[_sroa_18_base + 39];
                    afRad_f3_x = fRadX;
                    afRad_f3_y = fRadY;
                    {
                        const _wbase = ((i) * 40);
                        _b_allForces[_wbase + 0] = afRad_f0_x;
                        _b_allForces[_wbase + 1] = afRad_f0_y;
                        _b_allForces[_wbase + 2] = afRad_f0_z;
                        _b_allForces[_wbase + 3] = afRad_f0_w;
                        _b_allForces[_wbase + 4] = afRad_f1_x;
                        _b_allForces[_wbase + 5] = afRad_f1_y;
                        _b_allForces[_wbase + 6] = afRad_f1_z;
                        _b_allForces[_wbase + 7] = afRad_f1_w;
                        _b_allForces[_wbase + 8] = afRad_f2_x;
                        _b_allForces[_wbase + 9] = afRad_f2_y;
                        _b_allForces[_wbase + 10] = afRad_f2_z;
                        _b_allForces[_wbase + 11] = afRad_f2_w;
                        _b_allForces[_wbase + 12] = afRad_f3_x;
                        _b_allForces[_wbase + 13] = afRad_f3_y;
                        _b_allForces[_wbase + 14] = afRad_f3_z;
                        _b_allForces[_wbase + 15] = afRad_f3_w;
                        _b_allForces[_wbase + 16] = afRad_f4_x;
                        _b_allForces[_wbase + 17] = afRad_f4_y;
                        _b_allForces[_wbase + 18] = afRad_f4_z;
                        _b_allForces[_wbase + 19] = afRad_f4_w;
                        _b_allForces[_wbase + 20] = afRad_f5_x;
                        _b_allForces[_wbase + 21] = afRad_f5_y;
                        _b_allForces[_wbase + 22] = afRad_f5_z;
                        _b_allForces[_wbase + 23] = afRad_f5_w;
                        _b_allForces[_wbase + 24] = afRad_torques_x;
                        _b_allForces[_wbase + 25] = afRad_torques_y;
                        _b_allForces[_wbase + 26] = afRad_torques_z;
                        _b_allForces[_wbase + 27] = afRad_torques_w;
                        _b_allForces[_wbase + 28] = afRad_bFields_x;
                        _b_allForces[_wbase + 29] = afRad_bFields_y;
                        _b_allForces[_wbase + 30] = afRad_bFields_z;
                        _b_allForces[_wbase + 31] = afRad_bFields_w;
                        _b_allForces[_wbase + 32] = afRad_bFieldGrads_x;
                        _b_allForces[_wbase + 33] = afRad_bFieldGrads_y;
                        _b_allForces[_wbase + 34] = afRad_bFieldGrads_z;
                        _b_allForces[_wbase + 35] = afRad_bFieldGrads_w;
                        _b_allForces[_wbase + 36] = afRad_totalForce_x;
                        _b_allForces[_wbase + 37] = afRad_totalForce_y;
                        _b_allForces[_wbase + 38] = afRad_jerk_x;
                        _b_allForces[_wbase + 39] = afRad_jerk_y;
                    }
                    const wx2 = _b_particles[((i) * 9 + 2)];
                    const wy2 = _b_particles[((i) * 9 + 3)];
                    const wMagSqAfter = ((wx2 * wx2) + (wy2 * wy2));
                    const gammaAfter = Math.sqrt((1.0 + wMagSqAfter));
                    const keAfter = ((wMagSqAfter / ((gammaAfter + 1.0))) * _b_particles[((i) * 9 + 4)]);
                    const dE = ((0.0) < ((keBefore - keAfter)) ? ((keBefore - keAfter)) : (0.0));
                    rs_radAccum = (rs_radAccum + dE);
                    if ((rs_radAccum >= MIN_MASS)) {
                        const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                        if ((phIdx < MAX_PHOTONS)) {
                            const _sroa_19_base = ((i) * 40 + 36);
                            const ftv3_x = _b_allForces[_sroa_19_base + 0];
                            const ftv3_y = _b_allForces[_sroa_19_base + 1];
                            const ax = (ftv3_x * mInv);
                            const ay = (ftv3_y * mInv);
                            const aMag = Math.sqrt(((ax * ax) + (ay * ay)));
                            let emitAngle = 0;
                            if ((aMag > EPSILON)) {
                                const accelAngle = Math.atan2(ay, ax);
                                let accepted = false;
                                let seedBase = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                    const _inl_24_seed = (seedBase ^ ((t * 1234567)));
                                    let _inl_24_result;
                                    _inl_24: {
                                        let _inl_24__inl_0_result;
                                        _inl_24__inl_0: {
                                            let _inl_24__inl_0_state = ((_inl_24_seed * 747796405) + 2891336453);
                                            const _inl_24__inl_0_word = (((((_inl_24__inl_0_state >> ((((_inl_24__inl_0_state >> 28)) + 4)))) ^ _inl_24__inl_0_state)) * 277803737);
                                            _inl_24__inl_0_result = (((_inl_24__inl_0_word >> 22)) ^ _inl_24__inl_0_word);
                                            break _inl_24__inl_0;
                                        }
                                        _inl_24_result = ((+(_inl_24__inl_0_result)) / 4294967296.0);
                                        break _inl_24;
                                    }
                                    const theta = (_inl_24_result * TWO_PI);
                                    const sinTh = Math.sin(theta);
                                    const _inl_25_seed = (seedBase ^ (((t * 7654321) + 1)));
                                    let _inl_25_result;
                                    _inl_25: {
                                        let _inl_25__inl_0_result;
                                        _inl_25__inl_0: {
                                            let _inl_25__inl_0_state = ((_inl_25_seed * 747796405) + 2891336453);
                                            const _inl_25__inl_0_word = (((((_inl_25__inl_0_state >> ((((_inl_25__inl_0_state >> 28)) + 4)))) ^ _inl_25__inl_0_state)) * 277803737);
                                            _inl_25__inl_0_result = (((_inl_25__inl_0_word >> 22)) ^ _inl_25__inl_0_word);
                                            break _inl_25__inl_0;
                                        }
                                        _inl_25_result = ((+(_inl_25__inl_0_result)) / 4294967296.0);
                                        break _inl_25;
                                    }
                                    if ((_inl_25_result <= (sinTh * sinTh))) {
                                        emitAngle = (accelAngle + theta);
                                        accepted = true;
                                        break;
                                    }
                                }
                                if ((!accepted)) {
                                    emitAngle = (accelAngle + HALF_PI);
                                }
                                if ((gamma > ABERRATION_THRESHOLD)) {
                                    const beta = Math.sqrt((((1.0 - (1.0 / ((gamma * gamma))))) < (0.0) ? (0.0) : ((1.0 - (1.0 / ((gamma * gamma)))))));
                                    const vx2 = (wx * ((1.0 / gamma)));
                                    const vy2 = (wy * ((1.0 / gamma)));
                                    const velAngle = Math.atan2(vy2, vx2);
                                    const delta = (emitAngle - velAngle);
                                    const sinD = Math.sin(delta);
                                    const cosD = Math.cos(delta);
                                    const denom = (1.0 + (beta * cosD));
                                    emitAngle = (velAngle + Math.atan2((sinD / ((gamma * denom))), (((cosD + beta)) / denom)));
                                }
                            } else {
                                const _inl_26_seed = (((i * 2654435761)) ^ ((_u_u_frameCount * 1664525)));
                                let _inl_26_result;
                                _inl_26: {
                                    let _inl_26__inl_0_result;
                                    _inl_26__inl_0: {
                                        let _inl_26__inl_0_state = ((_inl_26_seed * 747796405) + 2891336453);
                                        const _inl_26__inl_0_word = (((((_inl_26__inl_0_state >> ((((_inl_26__inl_0_state >> 28)) + 4)))) ^ _inl_26__inl_0_state)) * 277803737);
                                        _inl_26__inl_0_result = (((_inl_26__inl_0_word >> 22)) ^ _inl_26__inl_0_word);
                                        break _inl_26__inl_0;
                                    }
                                    _inl_26_result = ((+(_inl_26__inl_0_result)) / 4294967296.0);
                                    break _inl_26;
                                }
                                emitAngle = (_inl_26_result * TWO_PI);
                            }
                            const cosA = Math.cos(emitAngle);
                            const sinA = Math.sin(emitAngle);
                            const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                            let ph_posX = 0;
                            let ph_posY = 0;
                            let ph_velX = 0;
                            let ph_velY = 0;
                            let ph_energy = 0;
                            let ph_emitterId = 0;
                            let ph_lifetime = 0;
                            let ph_flags = 0;
                            ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                            ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                            ph_velX = cosA;
                            ph_velY = sinA;
                            ph_energy = rs_radAccum;
                            ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                            rs_radAccum = 0.0;
                        } else {
                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
                    }
                }
            }
        }
    }
    entry["larmorRadiation"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_larmorRadiation(workgroups, bindings, domain, origin);
    };

    entryInfo["hawkingRadiation"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_hawkingRadiation(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_simTime = _b_u.simTime;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _u_u_frameCount = _b_u.frameCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_derived = bindings.derived;
        const _b_radState = bindings.radState;
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
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!blackHoleOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    if ((_b_particles[((i) * 9 + 4)] <= 0.0)) {
                        break __invocation;
                    }
                    const M = _b_particles[((i) * 9 + 4)];
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = _b_particles[((i) * 9 + 6)];
                    const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const Q = _b_particles[((i) * 9 + 5)];
                    const disc = (((M * M) - (a * a)) - (Q * Q));
                    let power = 0.0;
                    if ((disc > EPSILON)) {
                        const rPlus = (M + Math.sqrt(disc));
                        const denom = ((((rPlus * rPlus) + (a * a))) < (EPSILON) ? (EPSILON) : (((rPlus * rPlus) + (a * a))));
                        const kappa = (Math.sqrt(disc) / denom);
                        const T = (kappa / TWO_PI);
                        const A = ((4.0 * PI) * (((rPlus * rPlus) + (a * a))));
                        const sigma = ((PI * PI) / 60.0);
                        power = (((((sigma * T) * T) * T) * T) * A);
                    }
                    const dt = _u_u_dt;
                    const dE = ((_b_particles[((i) * 9 + 4)]) < ((power * dt)) ? (_b_particles[((i) * 9 + 4)]) : ((power * dt)));
                    const preMass = _b_particles[((i) * 9 + 4)];
                    if ((dE > 0.0)) {
                        {
                            const _wbase = ((i) * 9 + 4) - 4;
                            _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - dE);
                        }
                        {
                            const _wbase = ((i) * 9 + 7) - 7;
                            _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (dE / preMass)));
                        }
                    }
                    if (((dE <= 0.0) && (_b_particles[((i) * 9 + 4)] > MIN_MASS))) {
                        break __invocation;
                    }
                    const _sroa_20_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_20_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_20_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_20_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_20_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_20_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_20_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_20_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_20_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_20_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_20_base + 9];
                    let rs__pad1 = _b_radState[_sroa_20_base + 10];
                    let rs__pad2 = _b_radState[_sroa_20_base + 11];
                    rs_hawkAccum = (rs_hawkAccum + dE);
                    if ((_b_particles[((i) * 9 + 4)] <= MIN_MASS)) {
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        if (coulombOn) {
                            let remQ = _b_particles[((i) * 9 + 5)];
                            const csign = ((remQ > 0.0) ? 1.0 : (-1.0));
                            let seed = (((i * 7654321)) ^ _u_u_frameCount);
                            for (let ci = 0; (ci < 16); ci++) {
                                if ((Math.abs(remQ) < (BOSON_CHARGE - EPSILON))) {
                                    break;
                                }
                                const li = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                if ((li >= PION_POOL_CAP)) {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                    break;
                                }
                                seed = ((seed * 747796405) + 2891336453);
                                const lAngle = (((+(seed)) / 4294967296.0) * TWO_PI);
                                const lCos = Math.cos(lAngle);
                                const lSin = Math.sin(lAngle);
                                const lSpeed = ((MAX_SPEED_RATIO) < ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))));
                                const lGamma = (1.0 / Math.sqrt((((1.0 - (lSpeed * lSpeed))) < (EPSILON) ? (EPSILON) : ((1.0 - (lSpeed * lSpeed))))));
                                let lep_posX = 0;
                                let lep_posY = 0;
                                let lep_wX = 0;
                                let lep_wY = 0;
                                let lep_mass = 0;
                                let lep_charge = 0;
                                let lep_energy = 0;
                                let lep_emitterId = 0;
                                let lep_age = 0;
                                let lep_flags = 0;
                                let lep_kind = 0;
                                let lep__pad1 = 0;
                                lep_posX = (_b_particles[((i) * 9 + 0)] + (lCos * SPAWN_OFFSET_FLOOR));
                                lep_posY = (_b_particles[((i) * 9 + 1)] + (lSin * SPAWN_OFFSET_FLOOR));
                                lep_wX = ((lGamma * lSpeed) * lCos);
                                lep_wY = ((lGamma * lSpeed) * lSin);
                                lep_mass = ELECTRON_MASS;
                                lep_charge = (csign * BOSON_CHARGE);
                                lep_energy = 0.0;
                                lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                                lep_age = 0;
                                lep_flags = 1;
                                lep_kind = 1;
                                lep__pad1 = 0;
                                {
                                    const _wbase = ((li) * 12);
                                    _b_pions[_wbase + 0] = lep_posX;
                                    _b_pions[_wbase + 1] = lep_posY;
                                    _b_pions[_wbase + 2] = lep_wX;
                                    _b_pions[_wbase + 3] = lep_wY;
                                    _b_pions[_wbase + 4] = lep_mass;
                                    _b_pions[_wbase + 5] = lep_charge;
                                    _b_pions[_wbase + 6] = lep_energy;
                                    _b_pions[_wbase + 7] = lep_emitterId;
                                    _b_pions[_wbase + 8] = lep_age;
                                    _b_pions[_wbase + 9] = lep_flags;
                                    _b_pions[_wbase + 10] = lep_kind;
                                    _b_pions[_wbase + 11] = lep__pad1;
                                }
                                remQ = (remQ - (csign * BOSON_CHARGE));
                                {
                                    const _wbase = ((i) * 9 + 4) - 4;
                                    _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                                }
                            }
                            {
                                const _wbase = ((i) * 9 + 5) - 5;
                                _b_particles[_wbase + 5] = remQ;
                            }
                        }
                        const finalEnergy = (rs_hawkAccum + ((_b_particles[((i) * 9 + 4)]) < (0.0) ? (0.0) : (_b_particles[((i) * 9 + 4)])));
                        if ((finalEnergy > 0.0)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const _inl_27_seed = (((i * 12345)) ^ _u_u_frameCount);
                                let _inl_27_result;
                                _inl_27: {
                                    let _inl_27__inl_0_result;
                                    _inl_27__inl_0: {
                                        let _inl_27__inl_0_state = ((_inl_27_seed * 747796405) + 2891336453);
                                        const _inl_27__inl_0_word = (((((_inl_27__inl_0_state >> ((((_inl_27__inl_0_state >> 28)) + 4)))) ^ _inl_27__inl_0_state)) * 277803737);
                                        _inl_27__inl_0_result = (((_inl_27__inl_0_word >> 22)) ^ _inl_27__inl_0_word);
                                        break _inl_27__inl_0;
                                    }
                                    _inl_27_result = ((+(_inl_27__inl_0_result)) / 4294967296.0);
                                    break _inl_27;
                                }
                                const angle = (_inl_27_result * TWO_PI);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * SPAWN_OFFSET_FLOOR));
                                ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * SPAWN_OFFSET_FLOOR));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = finalEnergy;
                                ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                        rs_hawkAccum = 0.0;
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
                        }
                        {
                            const _wbase = ((i) * 9 + 4) - 4;
                            _b_particles[_wbase + 4] = 0.0;
                        }
                        {
                            const _wbase = ((i) * 9 + 8) - 8;
                            _b_particles[_wbase + 8] = (((_b_particles[((i) * 9 + 8)] & (~FLAG_ALIVE))) | FLAG_RETIRED);
                        }
                        {
                            const _wbase = ((i) * 5 + 2) - 2;
                            _b_particleAux[_wbase + 2] = _u_u_simTime;
                        }
                        {
                            const _wbase = ((i) * 5 + 3) - 3;
                            _b_particleAux[_wbase + 3] = preMass;
                        }
                        {
                            const _wbase = ((i) * 5 + 4) - 4;
                            _b_particleAux[_wbase + 4] = angvel;
                        }
                        break __invocation;
                    }
                    const newM = _b_particles[((i) * 9 + 4)];
                    const newBodyRSq = Math.pow(newM, 0.6666666666666666);
                    const newAngVel = (_b_particles[((i) * 9 + 6)] / Math.sqrt((1.0 + ((_b_particles[((i) * 9 + 6)] * _b_particles[((i) * 9 + 6)]) * newBodyRSq))));
                    const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                    const newDisc = (((newM * newM) - (newA * newA)) - (Q * Q));
                    const newRadius = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                    const _sroa_21_base = ((i) * 8);
                    let drd_magMoment = _b_derived[_sroa_21_base + 0];
                    let drd_angMomentum = _b_derived[_sroa_21_base + 1];
                    let drd_invMass = _b_derived[_sroa_21_base + 2];
                    let drd_radiusSq = _b_derived[_sroa_21_base + 3];
                    let drd_velX = _b_derived[_sroa_21_base + 4];
                    let drd_velY = _b_derived[_sroa_21_base + 5];
                    let drd_angVel = _b_derived[_sroa_21_base + 6];
                    let drd_bodyRSq = _b_derived[_sroa_21_base + 7];
                    drd_invMass = ((newM > EPSILON) ? (1.0 / newM) : 0.0);
                    drd_radiusSq = (newRadius * newRadius);
                    drd_bodyRSq = newBodyRSq;
                    {
                        const _wbase = ((i) * 8);
                        _b_derived[_wbase + 0] = drd_magMoment;
                        _b_derived[_wbase + 1] = drd_angMomentum;
                        _b_derived[_wbase + 2] = drd_invMass;
                        _b_derived[_wbase + 3] = drd_radiusSq;
                        _b_derived[_wbase + 4] = drd_velX;
                        _b_derived[_wbase + 5] = drd_velY;
                        _b_derived[_wbase + 6] = drd_angVel;
                        _b_derived[_wbase + 7] = drd_bodyRSq;
                    }
                    {
                        const _wbase = ((i) * 5 + 0) - 0;
                        _b_particleAux[_wbase + 0] = newRadius;
                    }
                    if ((rs_hawkAccum >= MIN_MASS)) {
                        const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                        if ((phIdx < MAX_PHOTONS)) {
                            const _inl_28_seed = (((i * 12345)) ^ _u_u_frameCount);
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
                            const angle = (_inl_28_result * TWO_PI);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const offset = (((newRadius * 1.5)) < (1.0) ? (1.0) : ((newRadius * 1.5)));
                            let ph_posX = 0;
                            let ph_posY = 0;
                            let ph_velX = 0;
                            let ph_velY = 0;
                            let ph_energy = 0;
                            let ph_emitterId = 0;
                            let ph_lifetime = 0;
                            let ph_flags = 0;
                            ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                            ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                            ph_velX = cosA;
                            ph_velY = sinA;
                            ph_energy = rs_hawkAccum;
                            ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                            rs_hawkAccum = 0.0;
                        } else {
                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
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
                            const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                            const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                            if (((!blackHoleOn) || (!radiationOn))) {
                                break __invocation;
                            }
                            if ((_b_particles[((i) * 9 + 4)] <= 0.0)) {
                                break __invocation;
                            }
                            const M = _b_particles[((i) * 9 + 4)];
                            const bodyRSq = Math.pow(M, 0.6666666666666666);
                            const angw = _b_particles[((i) * 9 + 6)];
                            const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                            const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                            const Q = _b_particles[((i) * 9 + 5)];
                            const disc = (((M * M) - (a * a)) - (Q * Q));
                            let power = 0.0;
                            if ((disc > EPSILON)) {
                                const rPlus = (M + Math.sqrt(disc));
                                const denom = ((((rPlus * rPlus) + (a * a))) < (EPSILON) ? (EPSILON) : (((rPlus * rPlus) + (a * a))));
                                const kappa = (Math.sqrt(disc) / denom);
                                const T = (kappa / TWO_PI);
                                const A = ((4.0 * PI) * (((rPlus * rPlus) + (a * a))));
                                const sigma = ((PI * PI) / 60.0);
                                power = (((((sigma * T) * T) * T) * T) * A);
                            }
                            const dt = _u_u_dt;
                            const dE = ((_b_particles[((i) * 9 + 4)]) < ((power * dt)) ? (_b_particles[((i) * 9 + 4)]) : ((power * dt)));
                            const preMass = _b_particles[((i) * 9 + 4)];
                            if ((dE > 0.0)) {
                                {
                                    const _wbase = ((i) * 9 + 4) - 4;
                                    _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - dE);
                                }
                                {
                                    const _wbase = ((i) * 9 + 7) - 7;
                                    _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (dE / preMass)));
                                }
                            }
                            if (((dE <= 0.0) && (_b_particles[((i) * 9 + 4)] > MIN_MASS))) {
                                break __invocation;
                            }
                            const _sroa_22_base = ((i) * 12);
                            let rs_radAccum = _b_radState[_sroa_22_base + 0];
                            let rs_hawkAccum = _b_radState[_sroa_22_base + 1];
                            let rs_yukawaRadAccum = _b_radState[_sroa_22_base + 2];
                            let rs_radDisplayX = _b_radState[_sroa_22_base + 3];
                            let rs_radDisplayY = _b_radState[_sroa_22_base + 4];
                            let rs_quadAccum = _b_radState[_sroa_22_base + 5];
                            let rs_emQuadAccum = _b_radState[_sroa_22_base + 6];
                            let rs_d3IContrib = _b_radState[_sroa_22_base + 7];
                            let rs_d3QContrib = _b_radState[_sroa_22_base + 8];
                            let rs_schwingerAccum = _b_radState[_sroa_22_base + 9];
                            let rs__pad1 = _b_radState[_sroa_22_base + 10];
                            let rs__pad2 = _b_radState[_sroa_22_base + 11];
                            rs_hawkAccum = (rs_hawkAccum + dE);
                            if ((_b_particles[((i) * 9 + 4)] <= MIN_MASS)) {
                                const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                                if (coulombOn) {
                                    let remQ = _b_particles[((i) * 9 + 5)];
                                    const csign = ((remQ > 0.0) ? 1.0 : (-1.0));
                                    let seed = (((i * 7654321)) ^ _u_u_frameCount);
                                    for (let ci = 0; (ci < 16); ci++) {
                                        if ((Math.abs(remQ) < (BOSON_CHARGE - EPSILON))) {
                                            break;
                                        }
                                        const li = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                        if ((li >= PION_POOL_CAP)) {
                                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                            break;
                                        }
                                        seed = ((seed * 747796405) + 2891336453);
                                        const lAngle = (((+(seed)) / 4294967296.0) * TWO_PI);
                                        const lCos = Math.cos(lAngle);
                                        const lSin = Math.sin(lAngle);
                                        const lSpeed = ((MAX_SPEED_RATIO) < ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))));
                                        const lGamma = (1.0 / Math.sqrt((((1.0 - (lSpeed * lSpeed))) < (EPSILON) ? (EPSILON) : ((1.0 - (lSpeed * lSpeed))))));
                                        let lep_posX = 0;
                                        let lep_posY = 0;
                                        let lep_wX = 0;
                                        let lep_wY = 0;
                                        let lep_mass = 0;
                                        let lep_charge = 0;
                                        let lep_energy = 0;
                                        let lep_emitterId = 0;
                                        let lep_age = 0;
                                        let lep_flags = 0;
                                        let lep_kind = 0;
                                        let lep__pad1 = 0;
                                        lep_posX = (_b_particles[((i) * 9 + 0)] + (lCos * SPAWN_OFFSET_FLOOR));
                                        lep_posY = (_b_particles[((i) * 9 + 1)] + (lSin * SPAWN_OFFSET_FLOOR));
                                        lep_wX = ((lGamma * lSpeed) * lCos);
                                        lep_wY = ((lGamma * lSpeed) * lSin);
                                        lep_mass = ELECTRON_MASS;
                                        lep_charge = (csign * BOSON_CHARGE);
                                        lep_energy = 0.0;
                                        lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                                        lep_age = 0;
                                        lep_flags = 1;
                                        lep_kind = 1;
                                        lep__pad1 = 0;
                                        {
                                            const _wbase = ((li) * 12);
                                            _b_pions[_wbase + 0] = lep_posX;
                                            _b_pions[_wbase + 1] = lep_posY;
                                            _b_pions[_wbase + 2] = lep_wX;
                                            _b_pions[_wbase + 3] = lep_wY;
                                            _b_pions[_wbase + 4] = lep_mass;
                                            _b_pions[_wbase + 5] = lep_charge;
                                            _b_pions[_wbase + 6] = lep_energy;
                                            _b_pions[_wbase + 7] = lep_emitterId;
                                            _b_pions[_wbase + 8] = lep_age;
                                            _b_pions[_wbase + 9] = lep_flags;
                                            _b_pions[_wbase + 10] = lep_kind;
                                            _b_pions[_wbase + 11] = lep__pad1;
                                        }
                                        remQ = (remQ - (csign * BOSON_CHARGE));
                                        {
                                            const _wbase = ((i) * 9 + 4) - 4;
                                            _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                                        }
                                    }
                                    {
                                        const _wbase = ((i) * 9 + 5) - 5;
                                        _b_particles[_wbase + 5] = remQ;
                                    }
                                }
                                const finalEnergy = (rs_hawkAccum + ((_b_particles[((i) * 9 + 4)]) < (0.0) ? (0.0) : (_b_particles[((i) * 9 + 4)])));
                                if ((finalEnergy > 0.0)) {
                                    const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                    if ((phIdx < MAX_PHOTONS)) {
                                        const _inl_27_seed = (((i * 12345)) ^ _u_u_frameCount);
                                        let _inl_27_result;
                                        _inl_27: {
                                            let _inl_27__inl_0_result;
                                            _inl_27__inl_0: {
                                                let _inl_27__inl_0_state = ((_inl_27_seed * 747796405) + 2891336453);
                                                const _inl_27__inl_0_word = (((((_inl_27__inl_0_state >> ((((_inl_27__inl_0_state >> 28)) + 4)))) ^ _inl_27__inl_0_state)) * 277803737);
                                                _inl_27__inl_0_result = (((_inl_27__inl_0_word >> 22)) ^ _inl_27__inl_0_word);
                                                break _inl_27__inl_0;
                                            }
                                            _inl_27_result = ((+(_inl_27__inl_0_result)) / 4294967296.0);
                                            break _inl_27;
                                        }
                                        const angle = (_inl_27_result * TWO_PI);
                                        const cosA = Math.cos(angle);
                                        const sinA = Math.sin(angle);
                                        let ph_posX = 0;
                                        let ph_posY = 0;
                                        let ph_velX = 0;
                                        let ph_velY = 0;
                                        let ph_energy = 0;
                                        let ph_emitterId = 0;
                                        let ph_lifetime = 0;
                                        let ph_flags = 0;
                                        ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * SPAWN_OFFSET_FLOOR));
                                        ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * SPAWN_OFFSET_FLOOR));
                                        ph_velX = cosA;
                                        ph_velY = sinA;
                                        ph_energy = finalEnergy;
                                        ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                                rs_hawkAccum = 0.0;
                                {
                                    const _wbase = ((i) * 12);
                                    _b_radState[_wbase + 0] = rs_radAccum;
                                    _b_radState[_wbase + 1] = rs_hawkAccum;
                                    _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                    _b_radState[_wbase + 3] = rs_radDisplayX;
                                    _b_radState[_wbase + 4] = rs_radDisplayY;
                                    _b_radState[_wbase + 5] = rs_quadAccum;
                                    _b_radState[_wbase + 6] = rs_emQuadAccum;
                                    _b_radState[_wbase + 7] = rs_d3IContrib;
                                    _b_radState[_wbase + 8] = rs_d3QContrib;
                                    _b_radState[_wbase + 9] = rs_schwingerAccum;
                                    _b_radState[_wbase + 10] = rs__pad1;
                                    _b_radState[_wbase + 11] = rs__pad2;
                                }
                                {
                                    const _wbase = ((i) * 9 + 4) - 4;
                                    _b_particles[_wbase + 4] = 0.0;
                                }
                                {
                                    const _wbase = ((i) * 9 + 8) - 8;
                                    _b_particles[_wbase + 8] = (((_b_particles[((i) * 9 + 8)] & (~FLAG_ALIVE))) | FLAG_RETIRED);
                                }
                                {
                                    const _wbase = ((i) * 5 + 2) - 2;
                                    _b_particleAux[_wbase + 2] = _u_u_simTime;
                                }
                                {
                                    const _wbase = ((i) * 5 + 3) - 3;
                                    _b_particleAux[_wbase + 3] = preMass;
                                }
                                {
                                    const _wbase = ((i) * 5 + 4) - 4;
                                    _b_particleAux[_wbase + 4] = angvel;
                                }
                                break __invocation;
                            }
                            const newM = _b_particles[((i) * 9 + 4)];
                            const newBodyRSq = Math.pow(newM, 0.6666666666666666);
                            const newAngVel = (_b_particles[((i) * 9 + 6)] / Math.sqrt((1.0 + ((_b_particles[((i) * 9 + 6)] * _b_particles[((i) * 9 + 6)]) * newBodyRSq))));
                            const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                            const newDisc = (((newM * newM) - (newA * newA)) - (Q * Q));
                            const newRadius = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                            const _sroa_23_base = ((i) * 8);
                            let drd_magMoment = _b_derived[_sroa_23_base + 0];
                            let drd_angMomentum = _b_derived[_sroa_23_base + 1];
                            let drd_invMass = _b_derived[_sroa_23_base + 2];
                            let drd_radiusSq = _b_derived[_sroa_23_base + 3];
                            let drd_velX = _b_derived[_sroa_23_base + 4];
                            let drd_velY = _b_derived[_sroa_23_base + 5];
                            let drd_angVel = _b_derived[_sroa_23_base + 6];
                            let drd_bodyRSq = _b_derived[_sroa_23_base + 7];
                            drd_invMass = ((newM > EPSILON) ? (1.0 / newM) : 0.0);
                            drd_radiusSq = (newRadius * newRadius);
                            drd_bodyRSq = newBodyRSq;
                            {
                                const _wbase = ((i) * 8);
                                _b_derived[_wbase + 0] = drd_magMoment;
                                _b_derived[_wbase + 1] = drd_angMomentum;
                                _b_derived[_wbase + 2] = drd_invMass;
                                _b_derived[_wbase + 3] = drd_radiusSq;
                                _b_derived[_wbase + 4] = drd_velX;
                                _b_derived[_wbase + 5] = drd_velY;
                                _b_derived[_wbase + 6] = drd_angVel;
                                _b_derived[_wbase + 7] = drd_bodyRSq;
                            }
                            {
                                const _wbase = ((i) * 5 + 0) - 0;
                                _b_particleAux[_wbase + 0] = newRadius;
                            }
                            if ((rs_hawkAccum >= MIN_MASS)) {
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const _inl_28_seed = (((i * 12345)) ^ _u_u_frameCount);
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
                                    const angle = (_inl_28_result * TWO_PI);
                                    const cosA = Math.cos(angle);
                                    const sinA = Math.sin(angle);
                                    const offset = (((newRadius * 1.5)) < (1.0) ? (1.0) : ((newRadius * 1.5)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                                    ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                                    ph_velX = cosA;
                                    ph_velY = sinA;
                                    ph_energy = rs_hawkAccum;
                                    ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                                    rs_hawkAccum = 0.0;
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                                }
                            }
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
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
                        const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                        const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                        if (((!blackHoleOn) || (!radiationOn))) {
                            break __invocation;
                        }
                        if ((_b_particles[((i) * 9 + 4)] <= 0.0)) {
                            break __invocation;
                        }
                        const M = _b_particles[((i) * 9 + 4)];
                        const bodyRSq = Math.pow(M, 0.6666666666666666);
                        const angw = _b_particles[((i) * 9 + 6)];
                        const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                        const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                        const Q = _b_particles[((i) * 9 + 5)];
                        const disc = (((M * M) - (a * a)) - (Q * Q));
                        let power = 0.0;
                        if ((disc > EPSILON)) {
                            const rPlus = (M + Math.sqrt(disc));
                            const denom = ((((rPlus * rPlus) + (a * a))) < (EPSILON) ? (EPSILON) : (((rPlus * rPlus) + (a * a))));
                            const kappa = (Math.sqrt(disc) / denom);
                            const T = (kappa / TWO_PI);
                            const A = ((4.0 * PI) * (((rPlus * rPlus) + (a * a))));
                            const sigma = ((PI * PI) / 60.0);
                            power = (((((sigma * T) * T) * T) * T) * A);
                        }
                        const dt = _u_u_dt;
                        const dE = ((_b_particles[((i) * 9 + 4)]) < ((power * dt)) ? (_b_particles[((i) * 9 + 4)]) : ((power * dt)));
                        const preMass = _b_particles[((i) * 9 + 4)];
                        if ((dE > 0.0)) {
                            {
                                const _wbase = ((i) * 9 + 4) - 4;
                                _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - dE);
                            }
                            {
                                const _wbase = ((i) * 9 + 7) - 7;
                                _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (dE / preMass)));
                            }
                        }
                        if (((dE <= 0.0) && (_b_particles[((i) * 9 + 4)] > MIN_MASS))) {
                            break __invocation;
                        }
                        const _sroa_24_base = ((i) * 12);
                        let rs_radAccum = _b_radState[_sroa_24_base + 0];
                        let rs_hawkAccum = _b_radState[_sroa_24_base + 1];
                        let rs_yukawaRadAccum = _b_radState[_sroa_24_base + 2];
                        let rs_radDisplayX = _b_radState[_sroa_24_base + 3];
                        let rs_radDisplayY = _b_radState[_sroa_24_base + 4];
                        let rs_quadAccum = _b_radState[_sroa_24_base + 5];
                        let rs_emQuadAccum = _b_radState[_sroa_24_base + 6];
                        let rs_d3IContrib = _b_radState[_sroa_24_base + 7];
                        let rs_d3QContrib = _b_radState[_sroa_24_base + 8];
                        let rs_schwingerAccum = _b_radState[_sroa_24_base + 9];
                        let rs__pad1 = _b_radState[_sroa_24_base + 10];
                        let rs__pad2 = _b_radState[_sroa_24_base + 11];
                        rs_hawkAccum = (rs_hawkAccum + dE);
                        if ((_b_particles[((i) * 9 + 4)] <= MIN_MASS)) {
                            const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                            if (coulombOn) {
                                let remQ = _b_particles[((i) * 9 + 5)];
                                const csign = ((remQ > 0.0) ? 1.0 : (-1.0));
                                let seed = (((i * 7654321)) ^ _u_u_frameCount);
                                for (let ci = 0; (ci < 16); ci++) {
                                    if ((Math.abs(remQ) < (BOSON_CHARGE - EPSILON))) {
                                        break;
                                    }
                                    const li = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                    if ((li >= PION_POOL_CAP)) {
                                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                        break;
                                    }
                                    seed = ((seed * 747796405) + 2891336453);
                                    const lAngle = (((+(seed)) / 4294967296.0) * TWO_PI);
                                    const lCos = Math.cos(lAngle);
                                    const lSin = Math.sin(lAngle);
                                    const lSpeed = ((MAX_SPEED_RATIO) < ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))));
                                    const lGamma = (1.0 / Math.sqrt((((1.0 - (lSpeed * lSpeed))) < (EPSILON) ? (EPSILON) : ((1.0 - (lSpeed * lSpeed))))));
                                    let lep_posX = 0;
                                    let lep_posY = 0;
                                    let lep_wX = 0;
                                    let lep_wY = 0;
                                    let lep_mass = 0;
                                    let lep_charge = 0;
                                    let lep_energy = 0;
                                    let lep_emitterId = 0;
                                    let lep_age = 0;
                                    let lep_flags = 0;
                                    let lep_kind = 0;
                                    let lep__pad1 = 0;
                                    lep_posX = (_b_particles[((i) * 9 + 0)] + (lCos * SPAWN_OFFSET_FLOOR));
                                    lep_posY = (_b_particles[((i) * 9 + 1)] + (lSin * SPAWN_OFFSET_FLOOR));
                                    lep_wX = ((lGamma * lSpeed) * lCos);
                                    lep_wY = ((lGamma * lSpeed) * lSin);
                                    lep_mass = ELECTRON_MASS;
                                    lep_charge = (csign * BOSON_CHARGE);
                                    lep_energy = 0.0;
                                    lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                                    lep_age = 0;
                                    lep_flags = 1;
                                    lep_kind = 1;
                                    lep__pad1 = 0;
                                    {
                                        const _wbase = ((li) * 12);
                                        _b_pions[_wbase + 0] = lep_posX;
                                        _b_pions[_wbase + 1] = lep_posY;
                                        _b_pions[_wbase + 2] = lep_wX;
                                        _b_pions[_wbase + 3] = lep_wY;
                                        _b_pions[_wbase + 4] = lep_mass;
                                        _b_pions[_wbase + 5] = lep_charge;
                                        _b_pions[_wbase + 6] = lep_energy;
                                        _b_pions[_wbase + 7] = lep_emitterId;
                                        _b_pions[_wbase + 8] = lep_age;
                                        _b_pions[_wbase + 9] = lep_flags;
                                        _b_pions[_wbase + 10] = lep_kind;
                                        _b_pions[_wbase + 11] = lep__pad1;
                                    }
                                    remQ = (remQ - (csign * BOSON_CHARGE));
                                    {
                                        const _wbase = ((i) * 9 + 4) - 4;
                                        _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                                    }
                                }
                                {
                                    const _wbase = ((i) * 9 + 5) - 5;
                                    _b_particles[_wbase + 5] = remQ;
                                }
                            }
                            const finalEnergy = (rs_hawkAccum + ((_b_particles[((i) * 9 + 4)]) < (0.0) ? (0.0) : (_b_particles[((i) * 9 + 4)])));
                            if ((finalEnergy > 0.0)) {
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const _inl_27_seed = (((i * 12345)) ^ _u_u_frameCount);
                                    let _inl_27_result;
                                    _inl_27: {
                                        let _inl_27__inl_0_result;
                                        _inl_27__inl_0: {
                                            let _inl_27__inl_0_state = ((_inl_27_seed * 747796405) + 2891336453);
                                            const _inl_27__inl_0_word = (((((_inl_27__inl_0_state >> ((((_inl_27__inl_0_state >> 28)) + 4)))) ^ _inl_27__inl_0_state)) * 277803737);
                                            _inl_27__inl_0_result = (((_inl_27__inl_0_word >> 22)) ^ _inl_27__inl_0_word);
                                            break _inl_27__inl_0;
                                        }
                                        _inl_27_result = ((+(_inl_27__inl_0_result)) / 4294967296.0);
                                        break _inl_27;
                                    }
                                    const angle = (_inl_27_result * TWO_PI);
                                    const cosA = Math.cos(angle);
                                    const sinA = Math.sin(angle);
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * SPAWN_OFFSET_FLOOR));
                                    ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * SPAWN_OFFSET_FLOOR));
                                    ph_velX = cosA;
                                    ph_velY = sinA;
                                    ph_energy = finalEnergy;
                                    ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                            rs_hawkAccum = 0.0;
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
                            }
                            {
                                const _wbase = ((i) * 9 + 4) - 4;
                                _b_particles[_wbase + 4] = 0.0;
                            }
                            {
                                const _wbase = ((i) * 9 + 8) - 8;
                                _b_particles[_wbase + 8] = (((_b_particles[((i) * 9 + 8)] & (~FLAG_ALIVE))) | FLAG_RETIRED);
                            }
                            {
                                const _wbase = ((i) * 5 + 2) - 2;
                                _b_particleAux[_wbase + 2] = _u_u_simTime;
                            }
                            {
                                const _wbase = ((i) * 5 + 3) - 3;
                                _b_particleAux[_wbase + 3] = preMass;
                            }
                            {
                                const _wbase = ((i) * 5 + 4) - 4;
                                _b_particleAux[_wbase + 4] = angvel;
                            }
                            break __invocation;
                        }
                        const newM = _b_particles[((i) * 9 + 4)];
                        const newBodyRSq = Math.pow(newM, 0.6666666666666666);
                        const newAngVel = (_b_particles[((i) * 9 + 6)] / Math.sqrt((1.0 + ((_b_particles[((i) * 9 + 6)] * _b_particles[((i) * 9 + 6)]) * newBodyRSq))));
                        const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                        const newDisc = (((newM * newM) - (newA * newA)) - (Q * Q));
                        const newRadius = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                        const _sroa_25_base = ((i) * 8);
                        let drd_magMoment = _b_derived[_sroa_25_base + 0];
                        let drd_angMomentum = _b_derived[_sroa_25_base + 1];
                        let drd_invMass = _b_derived[_sroa_25_base + 2];
                        let drd_radiusSq = _b_derived[_sroa_25_base + 3];
                        let drd_velX = _b_derived[_sroa_25_base + 4];
                        let drd_velY = _b_derived[_sroa_25_base + 5];
                        let drd_angVel = _b_derived[_sroa_25_base + 6];
                        let drd_bodyRSq = _b_derived[_sroa_25_base + 7];
                        drd_invMass = ((newM > EPSILON) ? (1.0 / newM) : 0.0);
                        drd_radiusSq = (newRadius * newRadius);
                        drd_bodyRSq = newBodyRSq;
                        {
                            const _wbase = ((i) * 8);
                            _b_derived[_wbase + 0] = drd_magMoment;
                            _b_derived[_wbase + 1] = drd_angMomentum;
                            _b_derived[_wbase + 2] = drd_invMass;
                            _b_derived[_wbase + 3] = drd_radiusSq;
                            _b_derived[_wbase + 4] = drd_velX;
                            _b_derived[_wbase + 5] = drd_velY;
                            _b_derived[_wbase + 6] = drd_angVel;
                            _b_derived[_wbase + 7] = drd_bodyRSq;
                        }
                        {
                            const _wbase = ((i) * 5 + 0) - 0;
                            _b_particleAux[_wbase + 0] = newRadius;
                        }
                        if ((rs_hawkAccum >= MIN_MASS)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const _inl_28_seed = (((i * 12345)) ^ _u_u_frameCount);
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
                                const angle = (_inl_28_result * TWO_PI);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
                                const offset = (((newRadius * 1.5)) < (1.0) ? (1.0) : ((newRadius * 1.5)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                                ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = rs_hawkAccum;
                                ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                                rs_hawkAccum = 0.0;
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                            }
                        }
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
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
                    const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!blackHoleOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    if ((_b_particles[((i) * 9 + 4)] <= 0.0)) {
                        break __invocation;
                    }
                    const M = _b_particles[((i) * 9 + 4)];
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = _b_particles[((i) * 9 + 6)];
                    const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const Q = _b_particles[((i) * 9 + 5)];
                    const disc = (((M * M) - (a * a)) - (Q * Q));
                    let power = 0.0;
                    if ((disc > EPSILON)) {
                        const rPlus = (M + Math.sqrt(disc));
                        const denom = ((((rPlus * rPlus) + (a * a))) < (EPSILON) ? (EPSILON) : (((rPlus * rPlus) + (a * a))));
                        const kappa = (Math.sqrt(disc) / denom);
                        const T = (kappa / TWO_PI);
                        const A = ((4.0 * PI) * (((rPlus * rPlus) + (a * a))));
                        const sigma = ((PI * PI) / 60.0);
                        power = (((((sigma * T) * T) * T) * T) * A);
                    }
                    const dt = _u_u_dt;
                    const dE = ((_b_particles[((i) * 9 + 4)]) < ((power * dt)) ? (_b_particles[((i) * 9 + 4)]) : ((power * dt)));
                    const preMass = _b_particles[((i) * 9 + 4)];
                    if ((dE > 0.0)) {
                        {
                            const _wbase = ((i) * 9 + 4) - 4;
                            _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - dE);
                        }
                        {
                            const _wbase = ((i) * 9 + 7) - 7;
                            _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (dE / preMass)));
                        }
                    }
                    if (((dE <= 0.0) && (_b_particles[((i) * 9 + 4)] > MIN_MASS))) {
                        break __invocation;
                    }
                    const _sroa_26_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_26_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_26_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_26_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_26_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_26_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_26_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_26_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_26_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_26_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_26_base + 9];
                    let rs__pad1 = _b_radState[_sroa_26_base + 10];
                    let rs__pad2 = _b_radState[_sroa_26_base + 11];
                    rs_hawkAccum = (rs_hawkAccum + dE);
                    if ((_b_particles[((i) * 9 + 4)] <= MIN_MASS)) {
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        if (coulombOn) {
                            let remQ = _b_particles[((i) * 9 + 5)];
                            const csign = ((remQ > 0.0) ? 1.0 : (-1.0));
                            let seed = (((i * 7654321)) ^ _u_u_frameCount);
                            for (let ci = 0; (ci < 16); ci++) {
                                if ((Math.abs(remQ) < (BOSON_CHARGE - EPSILON))) {
                                    break;
                                }
                                const li = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                if ((li >= PION_POOL_CAP)) {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                    break;
                                }
                                seed = ((seed * 747796405) + 2891336453);
                                const lAngle = (((+(seed)) / 4294967296.0) * TWO_PI);
                                const lCos = Math.cos(lAngle);
                                const lSin = Math.sin(lAngle);
                                const lSpeed = ((MAX_SPEED_RATIO) < ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt(((((ELECTRON_MASS * 3.0) * ELECTRON_MASS)) < (0.0) ? (0.0) : (((ELECTRON_MASS * 3.0) * ELECTRON_MASS)))) / (((3.0 * ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((3.0 * ELECTRON_MASS))))));
                                const lGamma = (1.0 / Math.sqrt((((1.0 - (lSpeed * lSpeed))) < (EPSILON) ? (EPSILON) : ((1.0 - (lSpeed * lSpeed))))));
                                let lep_posX = 0;
                                let lep_posY = 0;
                                let lep_wX = 0;
                                let lep_wY = 0;
                                let lep_mass = 0;
                                let lep_charge = 0;
                                let lep_energy = 0;
                                let lep_emitterId = 0;
                                let lep_age = 0;
                                let lep_flags = 0;
                                let lep_kind = 0;
                                let lep__pad1 = 0;
                                lep_posX = (_b_particles[((i) * 9 + 0)] + (lCos * SPAWN_OFFSET_FLOOR));
                                lep_posY = (_b_particles[((i) * 9 + 1)] + (lSin * SPAWN_OFFSET_FLOOR));
                                lep_wX = ((lGamma * lSpeed) * lCos);
                                lep_wY = ((lGamma * lSpeed) * lSin);
                                lep_mass = ELECTRON_MASS;
                                lep_charge = (csign * BOSON_CHARGE);
                                lep_energy = 0.0;
                                lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                                lep_age = 0;
                                lep_flags = 1;
                                lep_kind = 1;
                                lep__pad1 = 0;
                                {
                                    const _wbase = ((li) * 12);
                                    _b_pions[_wbase + 0] = lep_posX;
                                    _b_pions[_wbase + 1] = lep_posY;
                                    _b_pions[_wbase + 2] = lep_wX;
                                    _b_pions[_wbase + 3] = lep_wY;
                                    _b_pions[_wbase + 4] = lep_mass;
                                    _b_pions[_wbase + 5] = lep_charge;
                                    _b_pions[_wbase + 6] = lep_energy;
                                    _b_pions[_wbase + 7] = lep_emitterId;
                                    _b_pions[_wbase + 8] = lep_age;
                                    _b_pions[_wbase + 9] = lep_flags;
                                    _b_pions[_wbase + 10] = lep_kind;
                                    _b_pions[_wbase + 11] = lep__pad1;
                                }
                                remQ = (remQ - (csign * BOSON_CHARGE));
                                {
                                    const _wbase = ((i) * 9 + 4) - 4;
                                    _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                                }
                            }
                            {
                                const _wbase = ((i) * 9 + 5) - 5;
                                _b_particles[_wbase + 5] = remQ;
                            }
                        }
                        const finalEnergy = (rs_hawkAccum + ((_b_particles[((i) * 9 + 4)]) < (0.0) ? (0.0) : (_b_particles[((i) * 9 + 4)])));
                        if ((finalEnergy > 0.0)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const _inl_27_seed = (((i * 12345)) ^ _u_u_frameCount);
                                let _inl_27_result;
                                _inl_27: {
                                    let _inl_27__inl_0_result;
                                    _inl_27__inl_0: {
                                        let _inl_27__inl_0_state = ((_inl_27_seed * 747796405) + 2891336453);
                                        const _inl_27__inl_0_word = (((((_inl_27__inl_0_state >> ((((_inl_27__inl_0_state >> 28)) + 4)))) ^ _inl_27__inl_0_state)) * 277803737);
                                        _inl_27__inl_0_result = (((_inl_27__inl_0_word >> 22)) ^ _inl_27__inl_0_word);
                                        break _inl_27__inl_0;
                                    }
                                    _inl_27_result = ((+(_inl_27__inl_0_result)) / 4294967296.0);
                                    break _inl_27;
                                }
                                const angle = (_inl_27_result * TWO_PI);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * SPAWN_OFFSET_FLOOR));
                                ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * SPAWN_OFFSET_FLOOR));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = finalEnergy;
                                ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                        rs_hawkAccum = 0.0;
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
                        }
                        {
                            const _wbase = ((i) * 9 + 4) - 4;
                            _b_particles[_wbase + 4] = 0.0;
                        }
                        {
                            const _wbase = ((i) * 9 + 8) - 8;
                            _b_particles[_wbase + 8] = (((_b_particles[((i) * 9 + 8)] & (~FLAG_ALIVE))) | FLAG_RETIRED);
                        }
                        {
                            const _wbase = ((i) * 5 + 2) - 2;
                            _b_particleAux[_wbase + 2] = _u_u_simTime;
                        }
                        {
                            const _wbase = ((i) * 5 + 3) - 3;
                            _b_particleAux[_wbase + 3] = preMass;
                        }
                        {
                            const _wbase = ((i) * 5 + 4) - 4;
                            _b_particleAux[_wbase + 4] = angvel;
                        }
                        break __invocation;
                    }
                    const newM = _b_particles[((i) * 9 + 4)];
                    const newBodyRSq = Math.pow(newM, 0.6666666666666666);
                    const newAngVel = (_b_particles[((i) * 9 + 6)] / Math.sqrt((1.0 + ((_b_particles[((i) * 9 + 6)] * _b_particles[((i) * 9 + 6)]) * newBodyRSq))));
                    const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                    const newDisc = (((newM * newM) - (newA * newA)) - (Q * Q));
                    const newRadius = ((newDisc >= 0.0) ? (newM + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : newM);
                    const _sroa_27_base = ((i) * 8);
                    let drd_magMoment = _b_derived[_sroa_27_base + 0];
                    let drd_angMomentum = _b_derived[_sroa_27_base + 1];
                    let drd_invMass = _b_derived[_sroa_27_base + 2];
                    let drd_radiusSq = _b_derived[_sroa_27_base + 3];
                    let drd_velX = _b_derived[_sroa_27_base + 4];
                    let drd_velY = _b_derived[_sroa_27_base + 5];
                    let drd_angVel = _b_derived[_sroa_27_base + 6];
                    let drd_bodyRSq = _b_derived[_sroa_27_base + 7];
                    drd_invMass = ((newM > EPSILON) ? (1.0 / newM) : 0.0);
                    drd_radiusSq = (newRadius * newRadius);
                    drd_bodyRSq = newBodyRSq;
                    {
                        const _wbase = ((i) * 8);
                        _b_derived[_wbase + 0] = drd_magMoment;
                        _b_derived[_wbase + 1] = drd_angMomentum;
                        _b_derived[_wbase + 2] = drd_invMass;
                        _b_derived[_wbase + 3] = drd_radiusSq;
                        _b_derived[_wbase + 4] = drd_velX;
                        _b_derived[_wbase + 5] = drd_velY;
                        _b_derived[_wbase + 6] = drd_angVel;
                        _b_derived[_wbase + 7] = drd_bodyRSq;
                    }
                    {
                        const _wbase = ((i) * 5 + 0) - 0;
                        _b_particleAux[_wbase + 0] = newRadius;
                    }
                    if ((rs_hawkAccum >= MIN_MASS)) {
                        const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                        if ((phIdx < MAX_PHOTONS)) {
                            const _inl_28_seed = (((i * 12345)) ^ _u_u_frameCount);
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
                            const angle = (_inl_28_result * TWO_PI);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const offset = (((newRadius * 1.5)) < (1.0) ? (1.0) : ((newRadius * 1.5)));
                            let ph_posX = 0;
                            let ph_posY = 0;
                            let ph_velX = 0;
                            let ph_velY = 0;
                            let ph_energy = 0;
                            let ph_emitterId = 0;
                            let ph_lifetime = 0;
                            let ph_flags = 0;
                            ph_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                            ph_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                            ph_velX = cosA;
                            ph_velY = sinA;
                            ph_energy = rs_hawkAccum;
                            ph_emitterId = _b_particleAux[((i) * 5 + 1)];
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
                            rs_hawkAccum = 0.0;
                        } else {
                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
                    }
                }
            }
        }
    }
    entry["hawkingRadiation"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_hawkingRadiation(workgroups, bindings, domain, origin);
    };

    entryInfo["pionEmission"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_pionEmission(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_yukawaCoupling = _b_u.yukawaCoupling;
        const _u_u_yukawaMu = _b_u.yukawaMu;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _u_u_frameCount = _b_u.frameCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_allForces = bindings.allForces;
        const _b_radState = bindings.radState;
        const _b_axYukMod = bindings.axYukMod;
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
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const yukawaOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!yukawaOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    const fYukX = _b_allForces[((i) * 40 + 12) + 2];
                    const fYukY = _b_allForces[((i) * 40 + 12) + 3];
                    const fYukSq = ((fYukX * fYukX) + (fYukY * fYukY));
                    if ((fYukSq < (EPSILON * EPSILON))) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const coupling = _u_u_yukawaCoupling;
                    let dE = (((coupling / 3.0) * fYukSq) * dt);
                    const _sroa_28_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_28_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_28_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_28_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_28_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_28_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_28_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_28_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_28_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_28_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_28_base + 9];
                    let rs__pad1 = _b_radState[_sroa_28_base + 10];
                    let rs__pad2 = _b_radState[_sroa_28_base + 11];
                    rs_yukawaRadAccum = (rs_yukawaRadAccum + dE);
                    const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    const pionMass = (higgsOn ? (_u_u_yukawaMu * _b_axYukMod[((i) * 4 + 0) + 2]) : _u_u_yukawaMu);
                    if ((rs_yukawaRadAccum >= (pionMass + MIN_MASS))) {
                        const ke = (rs_yukawaRadAccum - pionMass);
                        if ((ke > 0.0)) {
                            const piIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                            if ((piIdx < PION_POOL_CAP)) {
                                const accelAngle = Math.atan2(fYukY, fYukX);
                                let angle = 0;
                                let seedBase = (((i * 2246822519)) ^ ((_u_u_frameCount * 2654435769)));
                                let accepted = false;
                                for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                    const _inl_29_seed = (seedBase ^ ((t * 1234567)));
                                    let _inl_29_result;
                                    _inl_29: {
                                        let _inl_29__inl_0_result;
                                        _inl_29__inl_0: {
                                            let _inl_29__inl_0_state = ((_inl_29_seed * 747796405) + 2891336453);
                                            const _inl_29__inl_0_word = (((((_inl_29__inl_0_state >> ((((_inl_29__inl_0_state >> 28)) + 4)))) ^ _inl_29__inl_0_state)) * 277803737);
                                            _inl_29__inl_0_result = (((_inl_29__inl_0_word >> 22)) ^ _inl_29__inl_0_word);
                                            break _inl_29__inl_0;
                                        }
                                        _inl_29_result = ((+(_inl_29__inl_0_result)) / 4294967296.0);
                                        break _inl_29;
                                    }
                                    const phi = (_inl_29_result * TWO_PI);
                                    const cosTheta = Math.cos((phi - accelAngle));
                                    const _inl_30_seed = (seedBase ^ (((t * 9876543) + 1)));
                                    let _inl_30_result;
                                    _inl_30: {
                                        let _inl_30__inl_0_result;
                                        _inl_30__inl_0: {
                                            let _inl_30__inl_0_state = ((_inl_30_seed * 747796405) + 2891336453);
                                            const _inl_30__inl_0_word = (((((_inl_30__inl_0_state >> ((((_inl_30__inl_0_state >> 28)) + 4)))) ^ _inl_30__inl_0_state)) * 277803737);
                                            _inl_30__inl_0_result = (((_inl_30__inl_0_word >> 22)) ^ _inl_30__inl_0_word);
                                            break _inl_30__inl_0;
                                        }
                                        _inl_30_result = ((+(_inl_30__inl_0_result)) / 4294967296.0);
                                        break _inl_30;
                                    }
                                    if ((_inl_30_result <= (cosTheta * cosTheta))) {
                                        angle = phi;
                                        accepted = true;
                                        break;
                                    }
                                }
                                if ((!accepted)) {
                                    const _inl_31_seed = (seedBase ^ 999);
                                    let _inl_31_result;
                                    _inl_31: {
                                        let _inl_31__inl_0_result;
                                        _inl_31__inl_0: {
                                            let _inl_31__inl_0_state = ((_inl_31_seed * 747796405) + 2891336453);
                                            const _inl_31__inl_0_word = (((((_inl_31__inl_0_state >> ((((_inl_31__inl_0_state >> 28)) + 4)))) ^ _inl_31__inl_0_state)) * 277803737);
                                            _inl_31__inl_0_result = (((_inl_31__inl_0_word >> 22)) ^ _inl_31__inl_0_word);
                                            break _inl_31__inl_0;
                                        }
                                        _inl_31_result = ((+(_inl_31__inl_0_result)) / 4294967296.0);
                                        break _inl_31;
                                    }
                                    angle = (accelAngle + ((_inl_31_result < 0.5) ? PI : 0.0));
                                }
                                const wx2 = _b_particles[((i) * 9 + 2)];
                                const wy2 = _b_particles[((i) * 9 + 3)];
                                const wSqPi = ((wx2 * wx2) + (wy2 * wy2));
                                if ((wSqPi > (EPSILON * EPSILON))) {
                                    const betaP = ((MAX_SPEED_RATIO) < (Math.sqrt((wSqPi / ((1.0 + wSqPi))))) ? (MAX_SPEED_RATIO) : (Math.sqrt((wSqPi / ((1.0 + wSqPi))))));
                                    if ((betaP > EPSILON)) {
                                        const gammaP = (1.0 / Math.sqrt((((1.0 - (betaP * betaP))) < (EPSILON) ? (EPSILON) : ((1.0 - (betaP * betaP))))));
                                        const invGammaPi = (1.0 / Math.sqrt((1.0 + wSqPi)));
                                        const boostAngle = Math.atan2((wy2 * invGammaPi), (wx2 * invGammaPi));
                                        const phiRel = (angle - boostAngle);
                                        const labRel = Math.atan2(Math.sin(phiRel), (gammaP * ((Math.cos(phiRel) + betaP))));
                                        angle = (labRel + boostAngle);
                                    }
                                }
                                const speed = ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))));
                                const gammaPI = (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed))))));
                                const piWx = ((gammaPI * speed) * Math.cos(angle));
                                const piWy = ((gammaPI * speed) * Math.sin(angle));
                                const _inl_32_seed = (((i * 98765)) ^ ((_u_u_frameCount * 4321)));
                                let _inl_32_result;
                                _inl_32: {
                                    let _inl_32__inl_0_result;
                                    _inl_32__inl_0: {
                                        let _inl_32__inl_0_state = ((_inl_32_seed * 747796405) + 2891336453);
                                        const _inl_32__inl_0_word = (((((_inl_32__inl_0_state >> ((((_inl_32__inl_0_state >> 28)) + 4)))) ^ _inl_32__inl_0_state)) * 277803737);
                                        _inl_32__inl_0_result = (((_inl_32__inl_0_word >> 22)) ^ _inl_32__inl_0_word);
                                        break _inl_32__inl_0;
                                    }
                                    _inl_32_result = ((+(_inl_32__inl_0_result)) / 4294967296.0);
                                    break _inl_32;
                                }
                                const rng = _inl_32_result;
                                let piChg = 0.0;
                                const emitterIsCharged = (Math.abs(_b_particles[((i) * 9 + 5)]) >= EPSILON);
                                if (((rng > 0.5) && emitterIsCharged)) {
                                    const _inl_33_seed = (((i * 54321)) ^ ((_u_u_frameCount * 6789)));
                                    let _inl_33_result;
                                    _inl_33: {
                                        let _inl_33__inl_0_result;
                                        _inl_33__inl_0: {
                                            let _inl_33__inl_0_state = ((_inl_33_seed * 747796405) + 2891336453);
                                            const _inl_33__inl_0_word = (((((_inl_33__inl_0_state >> ((((_inl_33__inl_0_state >> 28)) + 4)))) ^ _inl_33__inl_0_state)) * 277803737);
                                            _inl_33__inl_0_result = (((_inl_33__inl_0_word >> 22)) ^ _inl_33__inl_0_word);
                                            break _inl_33__inl_0;
                                        }
                                        _inl_33_result = ((+(_inl_33__inl_0_result)) / 4294967296.0);
                                        break _inl_33;
                                    }
                                    const rng2 = _inl_33_result;
                                    piChg = ((rng2 < 0.5) ? BOSON_CHARGE : (-BOSON_CHARGE));
                                    {
                                        const _wbase = ((i) * 9 + 5) - 5;
                                        _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - piChg);
                                    }
                                }
                                const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                let pi_posX = 0;
                                let pi_posY = 0;
                                let pi_wX = 0;
                                let pi_wY = 0;
                                let pi_mass = 0;
                                let pi_charge = 0;
                                let pi_energy = 0;
                                let pi_emitterId = 0;
                                let pi_age = 0;
                                let pi_flags = 0;
                                let pi_kind = 0;
                                let pi__pad1 = 0;
                                pi_posX = (_b_particles[((i) * 9 + 0)] + (Math.cos(angle) * offset));
                                pi_posY = (_b_particles[((i) * 9 + 1)] + (Math.sin(angle) * offset));
                                pi_wX = piWx;
                                pi_wY = piWy;
                                pi_mass = pionMass;
                                pi_charge = piChg;
                                pi_energy = rs_yukawaRadAccum;
                                pi_emitterId = _b_particleAux[((i) * 5 + 1)];
                                pi_age = 0;
                                pi_flags = 1;
                                pi_kind = 0;
                                pi__pad1 = 0;
                                {
                                    const _wbase = ((piIdx) * 12);
                                    _b_pions[_wbase + 0] = pi_posX;
                                    _b_pions[_wbase + 1] = pi_posY;
                                    _b_pions[_wbase + 2] = pi_wX;
                                    _b_pions[_wbase + 3] = pi_wY;
                                    _b_pions[_wbase + 4] = pi_mass;
                                    _b_pions[_wbase + 5] = pi_charge;
                                    _b_pions[_wbase + 6] = pi_energy;
                                    _b_pions[_wbase + 7] = pi_emitterId;
                                    _b_pions[_wbase + 8] = pi_age;
                                    _b_pions[_wbase + 9] = pi_flags;
                                    _b_pions[_wbase + 10] = pi_kind;
                                    _b_pions[_wbase + 11] = pi__pad1;
                                }
                                const rrWx = _b_particles[((i) * 9 + 2)];
                                const rrWy = _b_particles[((i) * 9 + 3)];
                                const wSq = ((rrWx * rrWx) + (rrWy * rrWy));
                                if ((wSq > (EPSILON * EPSILON))) {
                                    const gam = Math.sqrt((1.0 + wSq));
                                    const pKE = (((gam - 1.0)) * _b_particles[((i) * 9 + 4)]);
                                    if ((pKE > rs_yukawaRadAccum)) {
                                        const keNew = (pKE - rs_yukawaRadAccum);
                                        const gammaNew = (1.0 + (keNew / _b_particles[((i) * 9 + 4)]));
                                        const wSqNew = ((gammaNew * gammaNew) - 1.0);
                                        if ((wSqNew > (EPSILON * EPSILON))) {
                                            const sc = Math.sqrt((wSqNew / wSq));
                                            {
                                                const _wbase = ((i) * 9 + 2) - 2;
                                                _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] * sc);
                                            }
                                            {
                                                const _wbase = ((i) * 9 + 3) - 3;
                                                _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] * sc);
                                            }
                                        }
                                    }
                                }
                                rs_yukawaRadAccum = 0.0;
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                            }
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
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
                            const yukawaOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                            const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                            if (((!yukawaOn) || (!radiationOn))) {
                                break __invocation;
                            }
                            const fYukX = _b_allForces[((i) * 40 + 12) + 2];
                            const fYukY = _b_allForces[((i) * 40 + 12) + 3];
                            const fYukSq = ((fYukX * fYukX) + (fYukY * fYukY));
                            if ((fYukSq < (EPSILON * EPSILON))) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            const coupling = _u_u_yukawaCoupling;
                            let dE = (((coupling / 3.0) * fYukSq) * dt);
                            const _sroa_29_base = ((i) * 12);
                            let rs_radAccum = _b_radState[_sroa_29_base + 0];
                            let rs_hawkAccum = _b_radState[_sroa_29_base + 1];
                            let rs_yukawaRadAccum = _b_radState[_sroa_29_base + 2];
                            let rs_radDisplayX = _b_radState[_sroa_29_base + 3];
                            let rs_radDisplayY = _b_radState[_sroa_29_base + 4];
                            let rs_quadAccum = _b_radState[_sroa_29_base + 5];
                            let rs_emQuadAccum = _b_radState[_sroa_29_base + 6];
                            let rs_d3IContrib = _b_radState[_sroa_29_base + 7];
                            let rs_d3QContrib = _b_radState[_sroa_29_base + 8];
                            let rs_schwingerAccum = _b_radState[_sroa_29_base + 9];
                            let rs__pad1 = _b_radState[_sroa_29_base + 10];
                            let rs__pad2 = _b_radState[_sroa_29_base + 11];
                            rs_yukawaRadAccum = (rs_yukawaRadAccum + dE);
                            const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                            const pionMass = (higgsOn ? (_u_u_yukawaMu * _b_axYukMod[((i) * 4 + 0) + 2]) : _u_u_yukawaMu);
                            if ((rs_yukawaRadAccum >= (pionMass + MIN_MASS))) {
                                const ke = (rs_yukawaRadAccum - pionMass);
                                if ((ke > 0.0)) {
                                    const piIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                    if ((piIdx < PION_POOL_CAP)) {
                                        const accelAngle = Math.atan2(fYukY, fYukX);
                                        let angle = 0;
                                        let seedBase = (((i * 2246822519)) ^ ((_u_u_frameCount * 2654435769)));
                                        let accepted = false;
                                        for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                            const _inl_29_seed = (seedBase ^ ((t * 1234567)));
                                            let _inl_29_result;
                                            _inl_29: {
                                                let _inl_29__inl_0_result;
                                                _inl_29__inl_0: {
                                                    let _inl_29__inl_0_state = ((_inl_29_seed * 747796405) + 2891336453);
                                                    const _inl_29__inl_0_word = (((((_inl_29__inl_0_state >> ((((_inl_29__inl_0_state >> 28)) + 4)))) ^ _inl_29__inl_0_state)) * 277803737);
                                                    _inl_29__inl_0_result = (((_inl_29__inl_0_word >> 22)) ^ _inl_29__inl_0_word);
                                                    break _inl_29__inl_0;
                                                }
                                                _inl_29_result = ((+(_inl_29__inl_0_result)) / 4294967296.0);
                                                break _inl_29;
                                            }
                                            const phi = (_inl_29_result * TWO_PI);
                                            const cosTheta = Math.cos((phi - accelAngle));
                                            const _inl_30_seed = (seedBase ^ (((t * 9876543) + 1)));
                                            let _inl_30_result;
                                            _inl_30: {
                                                let _inl_30__inl_0_result;
                                                _inl_30__inl_0: {
                                                    let _inl_30__inl_0_state = ((_inl_30_seed * 747796405) + 2891336453);
                                                    const _inl_30__inl_0_word = (((((_inl_30__inl_0_state >> ((((_inl_30__inl_0_state >> 28)) + 4)))) ^ _inl_30__inl_0_state)) * 277803737);
                                                    _inl_30__inl_0_result = (((_inl_30__inl_0_word >> 22)) ^ _inl_30__inl_0_word);
                                                    break _inl_30__inl_0;
                                                }
                                                _inl_30_result = ((+(_inl_30__inl_0_result)) / 4294967296.0);
                                                break _inl_30;
                                            }
                                            if ((_inl_30_result <= (cosTheta * cosTheta))) {
                                                angle = phi;
                                                accepted = true;
                                                break;
                                            }
                                        }
                                        if ((!accepted)) {
                                            const _inl_31_seed = (seedBase ^ 999);
                                            let _inl_31_result;
                                            _inl_31: {
                                                let _inl_31__inl_0_result;
                                                _inl_31__inl_0: {
                                                    let _inl_31__inl_0_state = ((_inl_31_seed * 747796405) + 2891336453);
                                                    const _inl_31__inl_0_word = (((((_inl_31__inl_0_state >> ((((_inl_31__inl_0_state >> 28)) + 4)))) ^ _inl_31__inl_0_state)) * 277803737);
                                                    _inl_31__inl_0_result = (((_inl_31__inl_0_word >> 22)) ^ _inl_31__inl_0_word);
                                                    break _inl_31__inl_0;
                                                }
                                                _inl_31_result = ((+(_inl_31__inl_0_result)) / 4294967296.0);
                                                break _inl_31;
                                            }
                                            angle = (accelAngle + ((_inl_31_result < 0.5) ? PI : 0.0));
                                        }
                                        const wx2 = _b_particles[((i) * 9 + 2)];
                                        const wy2 = _b_particles[((i) * 9 + 3)];
                                        const wSqPi = ((wx2 * wx2) + (wy2 * wy2));
                                        if ((wSqPi > (EPSILON * EPSILON))) {
                                            const betaP = ((MAX_SPEED_RATIO) < (Math.sqrt((wSqPi / ((1.0 + wSqPi))))) ? (MAX_SPEED_RATIO) : (Math.sqrt((wSqPi / ((1.0 + wSqPi))))));
                                            if ((betaP > EPSILON)) {
                                                const gammaP = (1.0 / Math.sqrt((((1.0 - (betaP * betaP))) < (EPSILON) ? (EPSILON) : ((1.0 - (betaP * betaP))))));
                                                const invGammaPi = (1.0 / Math.sqrt((1.0 + wSqPi)));
                                                const boostAngle = Math.atan2((wy2 * invGammaPi), (wx2 * invGammaPi));
                                                const phiRel = (angle - boostAngle);
                                                const labRel = Math.atan2(Math.sin(phiRel), (gammaP * ((Math.cos(phiRel) + betaP))));
                                                angle = (labRel + boostAngle);
                                            }
                                        }
                                        const speed = ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))));
                                        const gammaPI = (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed))))));
                                        const piWx = ((gammaPI * speed) * Math.cos(angle));
                                        const piWy = ((gammaPI * speed) * Math.sin(angle));
                                        const _inl_32_seed = (((i * 98765)) ^ ((_u_u_frameCount * 4321)));
                                        let _inl_32_result;
                                        _inl_32: {
                                            let _inl_32__inl_0_result;
                                            _inl_32__inl_0: {
                                                let _inl_32__inl_0_state = ((_inl_32_seed * 747796405) + 2891336453);
                                                const _inl_32__inl_0_word = (((((_inl_32__inl_0_state >> ((((_inl_32__inl_0_state >> 28)) + 4)))) ^ _inl_32__inl_0_state)) * 277803737);
                                                _inl_32__inl_0_result = (((_inl_32__inl_0_word >> 22)) ^ _inl_32__inl_0_word);
                                                break _inl_32__inl_0;
                                            }
                                            _inl_32_result = ((+(_inl_32__inl_0_result)) / 4294967296.0);
                                            break _inl_32;
                                        }
                                        const rng = _inl_32_result;
                                        let piChg = 0.0;
                                        const emitterIsCharged = (Math.abs(_b_particles[((i) * 9 + 5)]) >= EPSILON);
                                        if (((rng > 0.5) && emitterIsCharged)) {
                                            const _inl_33_seed = (((i * 54321)) ^ ((_u_u_frameCount * 6789)));
                                            let _inl_33_result;
                                            _inl_33: {
                                                let _inl_33__inl_0_result;
                                                _inl_33__inl_0: {
                                                    let _inl_33__inl_0_state = ((_inl_33_seed * 747796405) + 2891336453);
                                                    const _inl_33__inl_0_word = (((((_inl_33__inl_0_state >> ((((_inl_33__inl_0_state >> 28)) + 4)))) ^ _inl_33__inl_0_state)) * 277803737);
                                                    _inl_33__inl_0_result = (((_inl_33__inl_0_word >> 22)) ^ _inl_33__inl_0_word);
                                                    break _inl_33__inl_0;
                                                }
                                                _inl_33_result = ((+(_inl_33__inl_0_result)) / 4294967296.0);
                                                break _inl_33;
                                            }
                                            const rng2 = _inl_33_result;
                                            piChg = ((rng2 < 0.5) ? BOSON_CHARGE : (-BOSON_CHARGE));
                                            {
                                                const _wbase = ((i) * 9 + 5) - 5;
                                                _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - piChg);
                                            }
                                        }
                                        const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                        let pi_posX = 0;
                                        let pi_posY = 0;
                                        let pi_wX = 0;
                                        let pi_wY = 0;
                                        let pi_mass = 0;
                                        let pi_charge = 0;
                                        let pi_energy = 0;
                                        let pi_emitterId = 0;
                                        let pi_age = 0;
                                        let pi_flags = 0;
                                        let pi_kind = 0;
                                        let pi__pad1 = 0;
                                        pi_posX = (_b_particles[((i) * 9 + 0)] + (Math.cos(angle) * offset));
                                        pi_posY = (_b_particles[((i) * 9 + 1)] + (Math.sin(angle) * offset));
                                        pi_wX = piWx;
                                        pi_wY = piWy;
                                        pi_mass = pionMass;
                                        pi_charge = piChg;
                                        pi_energy = rs_yukawaRadAccum;
                                        pi_emitterId = _b_particleAux[((i) * 5 + 1)];
                                        pi_age = 0;
                                        pi_flags = 1;
                                        pi_kind = 0;
                                        pi__pad1 = 0;
                                        {
                                            const _wbase = ((piIdx) * 12);
                                            _b_pions[_wbase + 0] = pi_posX;
                                            _b_pions[_wbase + 1] = pi_posY;
                                            _b_pions[_wbase + 2] = pi_wX;
                                            _b_pions[_wbase + 3] = pi_wY;
                                            _b_pions[_wbase + 4] = pi_mass;
                                            _b_pions[_wbase + 5] = pi_charge;
                                            _b_pions[_wbase + 6] = pi_energy;
                                            _b_pions[_wbase + 7] = pi_emitterId;
                                            _b_pions[_wbase + 8] = pi_age;
                                            _b_pions[_wbase + 9] = pi_flags;
                                            _b_pions[_wbase + 10] = pi_kind;
                                            _b_pions[_wbase + 11] = pi__pad1;
                                        }
                                        const rrWx = _b_particles[((i) * 9 + 2)];
                                        const rrWy = _b_particles[((i) * 9 + 3)];
                                        const wSq = ((rrWx * rrWx) + (rrWy * rrWy));
                                        if ((wSq > (EPSILON * EPSILON))) {
                                            const gam = Math.sqrt((1.0 + wSq));
                                            const pKE = (((gam - 1.0)) * _b_particles[((i) * 9 + 4)]);
                                            if ((pKE > rs_yukawaRadAccum)) {
                                                const keNew = (pKE - rs_yukawaRadAccum);
                                                const gammaNew = (1.0 + (keNew / _b_particles[((i) * 9 + 4)]));
                                                const wSqNew = ((gammaNew * gammaNew) - 1.0);
                                                if ((wSqNew > (EPSILON * EPSILON))) {
                                                    const sc = Math.sqrt((wSqNew / wSq));
                                                    {
                                                        const _wbase = ((i) * 9 + 2) - 2;
                                                        _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] * sc);
                                                    }
                                                    {
                                                        const _wbase = ((i) * 9 + 3) - 3;
                                                        _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] * sc);
                                                    }
                                                }
                                            }
                                        }
                                        rs_yukawaRadAccum = 0.0;
                                    } else {
                                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                    }
                                }
                            }
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
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
                        const yukawaOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                        const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                        if (((!yukawaOn) || (!radiationOn))) {
                            break __invocation;
                        }
                        const fYukX = _b_allForces[((i) * 40 + 12) + 2];
                        const fYukY = _b_allForces[((i) * 40 + 12) + 3];
                        const fYukSq = ((fYukX * fYukX) + (fYukY * fYukY));
                        if ((fYukSq < (EPSILON * EPSILON))) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const coupling = _u_u_yukawaCoupling;
                        let dE = (((coupling / 3.0) * fYukSq) * dt);
                        const _sroa_30_base = ((i) * 12);
                        let rs_radAccum = _b_radState[_sroa_30_base + 0];
                        let rs_hawkAccum = _b_radState[_sroa_30_base + 1];
                        let rs_yukawaRadAccum = _b_radState[_sroa_30_base + 2];
                        let rs_radDisplayX = _b_radState[_sroa_30_base + 3];
                        let rs_radDisplayY = _b_radState[_sroa_30_base + 4];
                        let rs_quadAccum = _b_radState[_sroa_30_base + 5];
                        let rs_emQuadAccum = _b_radState[_sroa_30_base + 6];
                        let rs_d3IContrib = _b_radState[_sroa_30_base + 7];
                        let rs_d3QContrib = _b_radState[_sroa_30_base + 8];
                        let rs_schwingerAccum = _b_radState[_sroa_30_base + 9];
                        let rs__pad1 = _b_radState[_sroa_30_base + 10];
                        let rs__pad2 = _b_radState[_sroa_30_base + 11];
                        rs_yukawaRadAccum = (rs_yukawaRadAccum + dE);
                        const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                        const pionMass = (higgsOn ? (_u_u_yukawaMu * _b_axYukMod[((i) * 4 + 0) + 2]) : _u_u_yukawaMu);
                        if ((rs_yukawaRadAccum >= (pionMass + MIN_MASS))) {
                            const ke = (rs_yukawaRadAccum - pionMass);
                            if ((ke > 0.0)) {
                                const piIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                if ((piIdx < PION_POOL_CAP)) {
                                    const accelAngle = Math.atan2(fYukY, fYukX);
                                    let angle = 0;
                                    let seedBase = (((i * 2246822519)) ^ ((_u_u_frameCount * 2654435769)));
                                    let accepted = false;
                                    for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                        const _inl_29_seed = (seedBase ^ ((t * 1234567)));
                                        let _inl_29_result;
                                        _inl_29: {
                                            let _inl_29__inl_0_result;
                                            _inl_29__inl_0: {
                                                let _inl_29__inl_0_state = ((_inl_29_seed * 747796405) + 2891336453);
                                                const _inl_29__inl_0_word = (((((_inl_29__inl_0_state >> ((((_inl_29__inl_0_state >> 28)) + 4)))) ^ _inl_29__inl_0_state)) * 277803737);
                                                _inl_29__inl_0_result = (((_inl_29__inl_0_word >> 22)) ^ _inl_29__inl_0_word);
                                                break _inl_29__inl_0;
                                            }
                                            _inl_29_result = ((+(_inl_29__inl_0_result)) / 4294967296.0);
                                            break _inl_29;
                                        }
                                        const phi = (_inl_29_result * TWO_PI);
                                        const cosTheta = Math.cos((phi - accelAngle));
                                        const _inl_30_seed = (seedBase ^ (((t * 9876543) + 1)));
                                        let _inl_30_result;
                                        _inl_30: {
                                            let _inl_30__inl_0_result;
                                            _inl_30__inl_0: {
                                                let _inl_30__inl_0_state = ((_inl_30_seed * 747796405) + 2891336453);
                                                const _inl_30__inl_0_word = (((((_inl_30__inl_0_state >> ((((_inl_30__inl_0_state >> 28)) + 4)))) ^ _inl_30__inl_0_state)) * 277803737);
                                                _inl_30__inl_0_result = (((_inl_30__inl_0_word >> 22)) ^ _inl_30__inl_0_word);
                                                break _inl_30__inl_0;
                                            }
                                            _inl_30_result = ((+(_inl_30__inl_0_result)) / 4294967296.0);
                                            break _inl_30;
                                        }
                                        if ((_inl_30_result <= (cosTheta * cosTheta))) {
                                            angle = phi;
                                            accepted = true;
                                            break;
                                        }
                                    }
                                    if ((!accepted)) {
                                        const _inl_31_seed = (seedBase ^ 999);
                                        let _inl_31_result;
                                        _inl_31: {
                                            let _inl_31__inl_0_result;
                                            _inl_31__inl_0: {
                                                let _inl_31__inl_0_state = ((_inl_31_seed * 747796405) + 2891336453);
                                                const _inl_31__inl_0_word = (((((_inl_31__inl_0_state >> ((((_inl_31__inl_0_state >> 28)) + 4)))) ^ _inl_31__inl_0_state)) * 277803737);
                                                _inl_31__inl_0_result = (((_inl_31__inl_0_word >> 22)) ^ _inl_31__inl_0_word);
                                                break _inl_31__inl_0;
                                            }
                                            _inl_31_result = ((+(_inl_31__inl_0_result)) / 4294967296.0);
                                            break _inl_31;
                                        }
                                        angle = (accelAngle + ((_inl_31_result < 0.5) ? PI : 0.0));
                                    }
                                    const wx2 = _b_particles[((i) * 9 + 2)];
                                    const wy2 = _b_particles[((i) * 9 + 3)];
                                    const wSqPi = ((wx2 * wx2) + (wy2 * wy2));
                                    if ((wSqPi > (EPSILON * EPSILON))) {
                                        const betaP = ((MAX_SPEED_RATIO) < (Math.sqrt((wSqPi / ((1.0 + wSqPi))))) ? (MAX_SPEED_RATIO) : (Math.sqrt((wSqPi / ((1.0 + wSqPi))))));
                                        if ((betaP > EPSILON)) {
                                            const gammaP = (1.0 / Math.sqrt((((1.0 - (betaP * betaP))) < (EPSILON) ? (EPSILON) : ((1.0 - (betaP * betaP))))));
                                            const invGammaPi = (1.0 / Math.sqrt((1.0 + wSqPi)));
                                            const boostAngle = Math.atan2((wy2 * invGammaPi), (wx2 * invGammaPi));
                                            const phiRel = (angle - boostAngle);
                                            const labRel = Math.atan2(Math.sin(phiRel), (gammaP * ((Math.cos(phiRel) + betaP))));
                                            angle = (labRel + boostAngle);
                                        }
                                    }
                                    const speed = ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))));
                                    const gammaPI = (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed))))));
                                    const piWx = ((gammaPI * speed) * Math.cos(angle));
                                    const piWy = ((gammaPI * speed) * Math.sin(angle));
                                    const _inl_32_seed = (((i * 98765)) ^ ((_u_u_frameCount * 4321)));
                                    let _inl_32_result;
                                    _inl_32: {
                                        let _inl_32__inl_0_result;
                                        _inl_32__inl_0: {
                                            let _inl_32__inl_0_state = ((_inl_32_seed * 747796405) + 2891336453);
                                            const _inl_32__inl_0_word = (((((_inl_32__inl_0_state >> ((((_inl_32__inl_0_state >> 28)) + 4)))) ^ _inl_32__inl_0_state)) * 277803737);
                                            _inl_32__inl_0_result = (((_inl_32__inl_0_word >> 22)) ^ _inl_32__inl_0_word);
                                            break _inl_32__inl_0;
                                        }
                                        _inl_32_result = ((+(_inl_32__inl_0_result)) / 4294967296.0);
                                        break _inl_32;
                                    }
                                    const rng = _inl_32_result;
                                    let piChg = 0.0;
                                    const emitterIsCharged = (Math.abs(_b_particles[((i) * 9 + 5)]) >= EPSILON);
                                    if (((rng > 0.5) && emitterIsCharged)) {
                                        const _inl_33_seed = (((i * 54321)) ^ ((_u_u_frameCount * 6789)));
                                        let _inl_33_result;
                                        _inl_33: {
                                            let _inl_33__inl_0_result;
                                            _inl_33__inl_0: {
                                                let _inl_33__inl_0_state = ((_inl_33_seed * 747796405) + 2891336453);
                                                const _inl_33__inl_0_word = (((((_inl_33__inl_0_state >> ((((_inl_33__inl_0_state >> 28)) + 4)))) ^ _inl_33__inl_0_state)) * 277803737);
                                                _inl_33__inl_0_result = (((_inl_33__inl_0_word >> 22)) ^ _inl_33__inl_0_word);
                                                break _inl_33__inl_0;
                                            }
                                            _inl_33_result = ((+(_inl_33__inl_0_result)) / 4294967296.0);
                                            break _inl_33;
                                        }
                                        const rng2 = _inl_33_result;
                                        piChg = ((rng2 < 0.5) ? BOSON_CHARGE : (-BOSON_CHARGE));
                                        {
                                            const _wbase = ((i) * 9 + 5) - 5;
                                            _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - piChg);
                                        }
                                    }
                                    const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                    let pi_posX = 0;
                                    let pi_posY = 0;
                                    let pi_wX = 0;
                                    let pi_wY = 0;
                                    let pi_mass = 0;
                                    let pi_charge = 0;
                                    let pi_energy = 0;
                                    let pi_emitterId = 0;
                                    let pi_age = 0;
                                    let pi_flags = 0;
                                    let pi_kind = 0;
                                    let pi__pad1 = 0;
                                    pi_posX = (_b_particles[((i) * 9 + 0)] + (Math.cos(angle) * offset));
                                    pi_posY = (_b_particles[((i) * 9 + 1)] + (Math.sin(angle) * offset));
                                    pi_wX = piWx;
                                    pi_wY = piWy;
                                    pi_mass = pionMass;
                                    pi_charge = piChg;
                                    pi_energy = rs_yukawaRadAccum;
                                    pi_emitterId = _b_particleAux[((i) * 5 + 1)];
                                    pi_age = 0;
                                    pi_flags = 1;
                                    pi_kind = 0;
                                    pi__pad1 = 0;
                                    {
                                        const _wbase = ((piIdx) * 12);
                                        _b_pions[_wbase + 0] = pi_posX;
                                        _b_pions[_wbase + 1] = pi_posY;
                                        _b_pions[_wbase + 2] = pi_wX;
                                        _b_pions[_wbase + 3] = pi_wY;
                                        _b_pions[_wbase + 4] = pi_mass;
                                        _b_pions[_wbase + 5] = pi_charge;
                                        _b_pions[_wbase + 6] = pi_energy;
                                        _b_pions[_wbase + 7] = pi_emitterId;
                                        _b_pions[_wbase + 8] = pi_age;
                                        _b_pions[_wbase + 9] = pi_flags;
                                        _b_pions[_wbase + 10] = pi_kind;
                                        _b_pions[_wbase + 11] = pi__pad1;
                                    }
                                    const rrWx = _b_particles[((i) * 9 + 2)];
                                    const rrWy = _b_particles[((i) * 9 + 3)];
                                    const wSq = ((rrWx * rrWx) + (rrWy * rrWy));
                                    if ((wSq > (EPSILON * EPSILON))) {
                                        const gam = Math.sqrt((1.0 + wSq));
                                        const pKE = (((gam - 1.0)) * _b_particles[((i) * 9 + 4)]);
                                        if ((pKE > rs_yukawaRadAccum)) {
                                            const keNew = (pKE - rs_yukawaRadAccum);
                                            const gammaNew = (1.0 + (keNew / _b_particles[((i) * 9 + 4)]));
                                            const wSqNew = ((gammaNew * gammaNew) - 1.0);
                                            if ((wSqNew > (EPSILON * EPSILON))) {
                                                const sc = Math.sqrt((wSqNew / wSq));
                                                {
                                                    const _wbase = ((i) * 9 + 2) - 2;
                                                    _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] * sc);
                                                }
                                                {
                                                    const _wbase = ((i) * 9 + 3) - 3;
                                                    _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] * sc);
                                                }
                                            }
                                        }
                                    }
                                    rs_yukawaRadAccum = 0.0;
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                }
                            }
                        }
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
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
                    const yukawaOn = (((_u_u_toggles0 & YUKAWA_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if (((!yukawaOn) || (!radiationOn))) {
                        break __invocation;
                    }
                    const fYukX = _b_allForces[((i) * 40 + 12) + 2];
                    const fYukY = _b_allForces[((i) * 40 + 12) + 3];
                    const fYukSq = ((fYukX * fYukX) + (fYukY * fYukY));
                    if ((fYukSq < (EPSILON * EPSILON))) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const coupling = _u_u_yukawaCoupling;
                    let dE = (((coupling / 3.0) * fYukSq) * dt);
                    const _sroa_31_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_31_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_31_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_31_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_31_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_31_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_31_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_31_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_31_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_31_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_31_base + 9];
                    let rs__pad1 = _b_radState[_sroa_31_base + 10];
                    let rs__pad2 = _b_radState[_sroa_31_base + 11];
                    rs_yukawaRadAccum = (rs_yukawaRadAccum + dE);
                    const higgsOn = (((_u_u_toggles0 & HIGGS_BIT)) != 0);
                    const pionMass = (higgsOn ? (_u_u_yukawaMu * _b_axYukMod[((i) * 4 + 0) + 2]) : _u_u_yukawaMu);
                    if ((rs_yukawaRadAccum >= (pionMass + MIN_MASS))) {
                        const ke = (rs_yukawaRadAccum - pionMass);
                        if ((ke > 0.0)) {
                            const piIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                            if ((piIdx < PION_POOL_CAP)) {
                                const accelAngle = Math.atan2(fYukY, fYukX);
                                let angle = 0;
                                let seedBase = (((i * 2246822519)) ^ ((_u_u_frameCount * 2654435769)));
                                let accepted = false;
                                for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
                                    const _inl_29_seed = (seedBase ^ ((t * 1234567)));
                                    let _inl_29_result;
                                    _inl_29: {
                                        let _inl_29__inl_0_result;
                                        _inl_29__inl_0: {
                                            let _inl_29__inl_0_state = ((_inl_29_seed * 747796405) + 2891336453);
                                            const _inl_29__inl_0_word = (((((_inl_29__inl_0_state >> ((((_inl_29__inl_0_state >> 28)) + 4)))) ^ _inl_29__inl_0_state)) * 277803737);
                                            _inl_29__inl_0_result = (((_inl_29__inl_0_word >> 22)) ^ _inl_29__inl_0_word);
                                            break _inl_29__inl_0;
                                        }
                                        _inl_29_result = ((+(_inl_29__inl_0_result)) / 4294967296.0);
                                        break _inl_29;
                                    }
                                    const phi = (_inl_29_result * TWO_PI);
                                    const cosTheta = Math.cos((phi - accelAngle));
                                    const _inl_30_seed = (seedBase ^ (((t * 9876543) + 1)));
                                    let _inl_30_result;
                                    _inl_30: {
                                        let _inl_30__inl_0_result;
                                        _inl_30__inl_0: {
                                            let _inl_30__inl_0_state = ((_inl_30_seed * 747796405) + 2891336453);
                                            const _inl_30__inl_0_word = (((((_inl_30__inl_0_state >> ((((_inl_30__inl_0_state >> 28)) + 4)))) ^ _inl_30__inl_0_state)) * 277803737);
                                            _inl_30__inl_0_result = (((_inl_30__inl_0_word >> 22)) ^ _inl_30__inl_0_word);
                                            break _inl_30__inl_0;
                                        }
                                        _inl_30_result = ((+(_inl_30__inl_0_result)) / 4294967296.0);
                                        break _inl_30;
                                    }
                                    if ((_inl_30_result <= (cosTheta * cosTheta))) {
                                        angle = phi;
                                        accepted = true;
                                        break;
                                    }
                                }
                                if ((!accepted)) {
                                    const _inl_31_seed = (seedBase ^ 999);
                                    let _inl_31_result;
                                    _inl_31: {
                                        let _inl_31__inl_0_result;
                                        _inl_31__inl_0: {
                                            let _inl_31__inl_0_state = ((_inl_31_seed * 747796405) + 2891336453);
                                            const _inl_31__inl_0_word = (((((_inl_31__inl_0_state >> ((((_inl_31__inl_0_state >> 28)) + 4)))) ^ _inl_31__inl_0_state)) * 277803737);
                                            _inl_31__inl_0_result = (((_inl_31__inl_0_word >> 22)) ^ _inl_31__inl_0_word);
                                            break _inl_31__inl_0;
                                        }
                                        _inl_31_result = ((+(_inl_31__inl_0_result)) / 4294967296.0);
                                        break _inl_31;
                                    }
                                    angle = (accelAngle + ((_inl_31_result < 0.5) ? PI : 0.0));
                                }
                                const wx2 = _b_particles[((i) * 9 + 2)];
                                const wy2 = _b_particles[((i) * 9 + 3)];
                                const wSqPi = ((wx2 * wx2) + (wy2 * wy2));
                                if ((wSqPi > (EPSILON * EPSILON))) {
                                    const betaP = ((MAX_SPEED_RATIO) < (Math.sqrt((wSqPi / ((1.0 + wSqPi))))) ? (MAX_SPEED_RATIO) : (Math.sqrt((wSqPi / ((1.0 + wSqPi))))));
                                    if ((betaP > EPSILON)) {
                                        const gammaP = (1.0 / Math.sqrt((((1.0 - (betaP * betaP))) < (EPSILON) ? (EPSILON) : ((1.0 - (betaP * betaP))))));
                                        const invGammaPi = (1.0 / Math.sqrt((1.0 + wSqPi)));
                                        const boostAngle = Math.atan2((wy2 * invGammaPi), (wx2 * invGammaPi));
                                        const phiRel = (angle - boostAngle);
                                        const labRel = Math.atan2(Math.sin(phiRel), (gammaP * ((Math.cos(phiRel) + betaP))));
                                        angle = (labRel + boostAngle);
                                    }
                                }
                                const speed = ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * pionMass))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * pionMass))))))) / (((ke + pionMass)) < (EPSILON) ? (EPSILON) : ((ke + pionMass))))));
                                const gammaPI = (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed))))));
                                const piWx = ((gammaPI * speed) * Math.cos(angle));
                                const piWy = ((gammaPI * speed) * Math.sin(angle));
                                const _inl_32_seed = (((i * 98765)) ^ ((_u_u_frameCount * 4321)));
                                let _inl_32_result;
                                _inl_32: {
                                    let _inl_32__inl_0_result;
                                    _inl_32__inl_0: {
                                        let _inl_32__inl_0_state = ((_inl_32_seed * 747796405) + 2891336453);
                                        const _inl_32__inl_0_word = (((((_inl_32__inl_0_state >> ((((_inl_32__inl_0_state >> 28)) + 4)))) ^ _inl_32__inl_0_state)) * 277803737);
                                        _inl_32__inl_0_result = (((_inl_32__inl_0_word >> 22)) ^ _inl_32__inl_0_word);
                                        break _inl_32__inl_0;
                                    }
                                    _inl_32_result = ((+(_inl_32__inl_0_result)) / 4294967296.0);
                                    break _inl_32;
                                }
                                const rng = _inl_32_result;
                                let piChg = 0.0;
                                const emitterIsCharged = (Math.abs(_b_particles[((i) * 9 + 5)]) >= EPSILON);
                                if (((rng > 0.5) && emitterIsCharged)) {
                                    const _inl_33_seed = (((i * 54321)) ^ ((_u_u_frameCount * 6789)));
                                    let _inl_33_result;
                                    _inl_33: {
                                        let _inl_33__inl_0_result;
                                        _inl_33__inl_0: {
                                            let _inl_33__inl_0_state = ((_inl_33_seed * 747796405) + 2891336453);
                                            const _inl_33__inl_0_word = (((((_inl_33__inl_0_state >> ((((_inl_33__inl_0_state >> 28)) + 4)))) ^ _inl_33__inl_0_state)) * 277803737);
                                            _inl_33__inl_0_result = (((_inl_33__inl_0_word >> 22)) ^ _inl_33__inl_0_word);
                                            break _inl_33__inl_0;
                                        }
                                        _inl_33_result = ((+(_inl_33__inl_0_result)) / 4294967296.0);
                                        break _inl_33;
                                    }
                                    const rng2 = _inl_33_result;
                                    piChg = ((rng2 < 0.5) ? BOSON_CHARGE : (-BOSON_CHARGE));
                                    {
                                        const _wbase = ((i) * 9 + 5) - 5;
                                        _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - piChg);
                                    }
                                }
                                const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                                let pi_posX = 0;
                                let pi_posY = 0;
                                let pi_wX = 0;
                                let pi_wY = 0;
                                let pi_mass = 0;
                                let pi_charge = 0;
                                let pi_energy = 0;
                                let pi_emitterId = 0;
                                let pi_age = 0;
                                let pi_flags = 0;
                                let pi_kind = 0;
                                let pi__pad1 = 0;
                                pi_posX = (_b_particles[((i) * 9 + 0)] + (Math.cos(angle) * offset));
                                pi_posY = (_b_particles[((i) * 9 + 1)] + (Math.sin(angle) * offset));
                                pi_wX = piWx;
                                pi_wY = piWy;
                                pi_mass = pionMass;
                                pi_charge = piChg;
                                pi_energy = rs_yukawaRadAccum;
                                pi_emitterId = _b_particleAux[((i) * 5 + 1)];
                                pi_age = 0;
                                pi_flags = 1;
                                pi_kind = 0;
                                pi__pad1 = 0;
                                {
                                    const _wbase = ((piIdx) * 12);
                                    _b_pions[_wbase + 0] = pi_posX;
                                    _b_pions[_wbase + 1] = pi_posY;
                                    _b_pions[_wbase + 2] = pi_wX;
                                    _b_pions[_wbase + 3] = pi_wY;
                                    _b_pions[_wbase + 4] = pi_mass;
                                    _b_pions[_wbase + 5] = pi_charge;
                                    _b_pions[_wbase + 6] = pi_energy;
                                    _b_pions[_wbase + 7] = pi_emitterId;
                                    _b_pions[_wbase + 8] = pi_age;
                                    _b_pions[_wbase + 9] = pi_flags;
                                    _b_pions[_wbase + 10] = pi_kind;
                                    _b_pions[_wbase + 11] = pi__pad1;
                                }
                                const rrWx = _b_particles[((i) * 9 + 2)];
                                const rrWy = _b_particles[((i) * 9 + 3)];
                                const wSq = ((rrWx * rrWx) + (rrWy * rrWy));
                                if ((wSq > (EPSILON * EPSILON))) {
                                    const gam = Math.sqrt((1.0 + wSq));
                                    const pKE = (((gam - 1.0)) * _b_particles[((i) * 9 + 4)]);
                                    if ((pKE > rs_yukawaRadAccum)) {
                                        const keNew = (pKE - rs_yukawaRadAccum);
                                        const gammaNew = (1.0 + (keNew / _b_particles[((i) * 9 + 4)]));
                                        const wSqNew = ((gammaNew * gammaNew) - 1.0);
                                        if ((wSqNew > (EPSILON * EPSILON))) {
                                            const sc = Math.sqrt((wSqNew / wSq));
                                            {
                                                const _wbase = ((i) * 9 + 2) - 2;
                                                _b_particles[_wbase + 2] = (_b_particles[_wbase + 2] * sc);
                                            }
                                            {
                                                const _wbase = ((i) * 9 + 3) - 3;
                                                _b_particles[_wbase + 3] = (_b_particles[_wbase + 3] * sc);
                                            }
                                        }
                                    }
                                }
                                rs_yukawaRadAccum = 0.0;
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                            }
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
                    }
                }
            }
        }
    }
    entry["pionEmission"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_pionEmission(workgroups, bindings, domain, origin);
    };

    entryInfo["schwingerDischarge"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_schwingerDischarge(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _u_u_frameCount = _b_u.frameCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_derived = bindings.derived;
        const _b_radState = bindings.radState;
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
                    if ((i >= _u_u_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if ((((!blackHoleOn) || (!coulombOn)) || (!radiationOn))) {
                        break __invocation;
                    }
                    let M = _b_particles[((i) * 9 + 4)];
                    if ((M <= MIN_MASS)) {
                        break __invocation;
                    }
                    const Q = _b_particles[((i) * 9 + 5)];
                    const absQ = Math.abs(Q);
                    if ((absQ < (BOSON_CHARGE - EPSILON))) {
                        break __invocation;
                    }
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = _b_particles[((i) * 9 + 6)];
                    const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const disc = (((M * M) - (a * a)) - (Q * Q));
                    const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                    const rPlusSq = (rPlus * rPlus);
                    const sigma = (rPlusSq + (a * a));
                    const E_field = (absQ / sigma);
                    if ((E_field <= (0.5 * SCHWINGER_E_CR))) {
                        break __invocation;
                    }
                    const dRate = (((((SCHWINGER_COEFF * absQ) * absQ) / sigma) * Math.exp((((-PI) * SCHWINGER_E_CR) / E_field))) * _u_u_dt);
                    const _sroa_32_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_32_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_32_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_32_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_32_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_32_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_32_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_32_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_32_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_32_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_32_base + 9];
                    let rs__pad1 = _b_radState[_sroa_32_base + 10];
                    let rs__pad2 = _b_radState[_sroa_32_base + 11];
                    rs_schwingerAccum = (rs_schwingerAccum + dRate);
                    if ((rs_schwingerAccum < 1.0)) {
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
                        }
                        break __invocation;
                    }
                    rs_schwingerAccum = 0.0;
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
                    }
                    const idx0 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                    if ((idx0 >= PION_POOL_CAP)) {
                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                        break __invocation;
                    }
                    const _inl_34_seed = (((i * 3456789)) ^ _u_u_frameCount);
                    let _inl_34_result;
                    _inl_34: {
                        let _inl_34__inl_0_result;
                        _inl_34__inl_0: {
                            let _inl_34__inl_0_state = ((_inl_34_seed * 747796405) + 2891336453);
                            const _inl_34__inl_0_word = (((((_inl_34__inl_0_state >> ((((_inl_34__inl_0_state >> 28)) + 4)))) ^ _inl_34__inl_0_state)) * 277803737);
                            _inl_34__inl_0_result = (((_inl_34__inl_0_word >> 22)) ^ _inl_34__inl_0_word);
                            break _inl_34__inl_0;
                        }
                        _inl_34_result = ((+(_inl_34__inl_0_result)) / 4294967296.0);
                        break _inl_34;
                    }
                    const angle = (_inl_34_result * TWO_PI);
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                    const ePhi = (((BOSON_CHARGE * absQ) * rPlus) / sigma);
                    const ke = (((ePhi - ELECTRON_MASS)) < (0.0) ? (0.0) : ((ePhi - ELECTRON_MASS)));
                    const speed = ((ke <= 0.0) ? 0.0 : ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS)))))));
                    const gammaL = ((ke <= 0.0) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed)))))));
                    const wx = ((gammaL * speed) * cosA);
                    const wy = ((gammaL * speed) * sinA);
                    const sign = ((Q > 0.0) ? 1.0 : (-1.0));
                    let lep_posX = 0;
                    let lep_posY = 0;
                    let lep_wX = 0;
                    let lep_wY = 0;
                    let lep_mass = 0;
                    let lep_charge = 0;
                    let lep_energy = 0;
                    let lep_emitterId = 0;
                    let lep_age = 0;
                    let lep_flags = 0;
                    let lep_kind = 0;
                    let lep__pad1 = 0;
                    lep_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                    lep_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                    lep_wX = wx;
                    lep_wY = wy;
                    lep_mass = ELECTRON_MASS;
                    lep_charge = (sign * BOSON_CHARGE);
                    lep_energy = 0.0;
                    lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                    lep_age = 0;
                    lep_flags = 1;
                    lep_kind = 1;
                    lep__pad1 = 0;
                    {
                        const _wbase = ((idx0) * 12);
                        _b_pions[_wbase + 0] = lep_posX;
                        _b_pions[_wbase + 1] = lep_posY;
                        _b_pions[_wbase + 2] = lep_wX;
                        _b_pions[_wbase + 3] = lep_wY;
                        _b_pions[_wbase + 4] = lep_mass;
                        _b_pions[_wbase + 5] = lep_charge;
                        _b_pions[_wbase + 6] = lep_energy;
                        _b_pions[_wbase + 7] = lep_emitterId;
                        _b_pions[_wbase + 8] = lep_age;
                        _b_pions[_wbase + 9] = lep_flags;
                        _b_pions[_wbase + 10] = lep_kind;
                        _b_pions[_wbase + 11] = lep__pad1;
                    }
                    {
                        const _wbase = ((i) * 9 + 5) - 5;
                        _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - (sign * BOSON_CHARGE));
                    }
                    const preMass = _b_particles[((i) * 9 + 4)];
                    {
                        const _wbase = ((i) * 9 + 4) - 4;
                        _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                    }
                    if ((preMass > EPSILON)) {
                        {
                            const _wbase = ((i) * 9 + 7) - 7;
                            _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (ELECTRON_MASS / preMass)));
                        }
                    }
                    M = _b_particles[((i) * 9 + 4)];
                    const newBodyRSq = Math.pow(M, 0.6666666666666666);
                    const newAngVel = (angw / Math.sqrt((1.0 + ((angw * angw) * newBodyRSq))));
                    const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                    const newDisc = (((M * M) - (newA * newA)) - (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]));
                    const newRadius = ((newDisc >= 0.0) ? (M + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : M);
                    const _sroa_33_base = ((i) * 8);
                    let drd_magMoment = _b_derived[_sroa_33_base + 0];
                    let drd_angMomentum = _b_derived[_sroa_33_base + 1];
                    let drd_invMass = _b_derived[_sroa_33_base + 2];
                    let drd_radiusSq = _b_derived[_sroa_33_base + 3];
                    let drd_velX = _b_derived[_sroa_33_base + 4];
                    let drd_velY = _b_derived[_sroa_33_base + 5];
                    let drd_angVel = _b_derived[_sroa_33_base + 6];
                    let drd_bodyRSq = _b_derived[_sroa_33_base + 7];
                    drd_invMass = ((M > EPSILON) ? (1.0 / M) : 0.0);
                    drd_radiusSq = (newRadius * newRadius);
                    drd_bodyRSq = newBodyRSq;
                    {
                        const _wbase = ((i) * 8);
                        _b_derived[_wbase + 0] = drd_magMoment;
                        _b_derived[_wbase + 1] = drd_angMomentum;
                        _b_derived[_wbase + 2] = drd_invMass;
                        _b_derived[_wbase + 3] = drd_radiusSq;
                        _b_derived[_wbase + 4] = drd_velX;
                        _b_derived[_wbase + 5] = drd_velY;
                        _b_derived[_wbase + 6] = drd_angVel;
                        _b_derived[_wbase + 7] = drd_bodyRSq;
                    }
                    {
                        const _wbase = ((i) * 5 + 0) - 0;
                        _b_particleAux[_wbase + 0] = newRadius;
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
                            const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                            const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                            const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                            if ((((!blackHoleOn) || (!coulombOn)) || (!radiationOn))) {
                                break __invocation;
                            }
                            let M = _b_particles[((i) * 9 + 4)];
                            if ((M <= MIN_MASS)) {
                                break __invocation;
                            }
                            const Q = _b_particles[((i) * 9 + 5)];
                            const absQ = Math.abs(Q);
                            if ((absQ < (BOSON_CHARGE - EPSILON))) {
                                break __invocation;
                            }
                            const bodyRSq = Math.pow(M, 0.6666666666666666);
                            const angw = _b_particles[((i) * 9 + 6)];
                            const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                            const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                            const disc = (((M * M) - (a * a)) - (Q * Q));
                            const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                            const rPlusSq = (rPlus * rPlus);
                            const sigma = (rPlusSq + (a * a));
                            const E_field = (absQ / sigma);
                            if ((E_field <= (0.5 * SCHWINGER_E_CR))) {
                                break __invocation;
                            }
                            const dRate = (((((SCHWINGER_COEFF * absQ) * absQ) / sigma) * Math.exp((((-PI) * SCHWINGER_E_CR) / E_field))) * _u_u_dt);
                            const _sroa_34_base = ((i) * 12);
                            let rs_radAccum = _b_radState[_sroa_34_base + 0];
                            let rs_hawkAccum = _b_radState[_sroa_34_base + 1];
                            let rs_yukawaRadAccum = _b_radState[_sroa_34_base + 2];
                            let rs_radDisplayX = _b_radState[_sroa_34_base + 3];
                            let rs_radDisplayY = _b_radState[_sroa_34_base + 4];
                            let rs_quadAccum = _b_radState[_sroa_34_base + 5];
                            let rs_emQuadAccum = _b_radState[_sroa_34_base + 6];
                            let rs_d3IContrib = _b_radState[_sroa_34_base + 7];
                            let rs_d3QContrib = _b_radState[_sroa_34_base + 8];
                            let rs_schwingerAccum = _b_radState[_sroa_34_base + 9];
                            let rs__pad1 = _b_radState[_sroa_34_base + 10];
                            let rs__pad2 = _b_radState[_sroa_34_base + 11];
                            rs_schwingerAccum = (rs_schwingerAccum + dRate);
                            if ((rs_schwingerAccum < 1.0)) {
                                {
                                    const _wbase = ((i) * 12);
                                    _b_radState[_wbase + 0] = rs_radAccum;
                                    _b_radState[_wbase + 1] = rs_hawkAccum;
                                    _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                    _b_radState[_wbase + 3] = rs_radDisplayX;
                                    _b_radState[_wbase + 4] = rs_radDisplayY;
                                    _b_radState[_wbase + 5] = rs_quadAccum;
                                    _b_radState[_wbase + 6] = rs_emQuadAccum;
                                    _b_radState[_wbase + 7] = rs_d3IContrib;
                                    _b_radState[_wbase + 8] = rs_d3QContrib;
                                    _b_radState[_wbase + 9] = rs_schwingerAccum;
                                    _b_radState[_wbase + 10] = rs__pad1;
                                    _b_radState[_wbase + 11] = rs__pad2;
                                }
                                break __invocation;
                            }
                            rs_schwingerAccum = 0.0;
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
                            }
                            const idx0 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                            if ((idx0 >= PION_POOL_CAP)) {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                break __invocation;
                            }
                            const _inl_34_seed = (((i * 3456789)) ^ _u_u_frameCount);
                            let _inl_34_result;
                            _inl_34: {
                                let _inl_34__inl_0_result;
                                _inl_34__inl_0: {
                                    let _inl_34__inl_0_state = ((_inl_34_seed * 747796405) + 2891336453);
                                    const _inl_34__inl_0_word = (((((_inl_34__inl_0_state >> ((((_inl_34__inl_0_state >> 28)) + 4)))) ^ _inl_34__inl_0_state)) * 277803737);
                                    _inl_34__inl_0_result = (((_inl_34__inl_0_word >> 22)) ^ _inl_34__inl_0_word);
                                    break _inl_34__inl_0;
                                }
                                _inl_34_result = ((+(_inl_34__inl_0_result)) / 4294967296.0);
                                break _inl_34;
                            }
                            const angle = (_inl_34_result * TWO_PI);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                            const ePhi = (((BOSON_CHARGE * absQ) * rPlus) / sigma);
                            const ke = (((ePhi - ELECTRON_MASS)) < (0.0) ? (0.0) : ((ePhi - ELECTRON_MASS)));
                            const speed = ((ke <= 0.0) ? 0.0 : ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS)))))));
                            const gammaL = ((ke <= 0.0) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed)))))));
                            const wx = ((gammaL * speed) * cosA);
                            const wy = ((gammaL * speed) * sinA);
                            const sign = ((Q > 0.0) ? 1.0 : (-1.0));
                            let lep_posX = 0;
                            let lep_posY = 0;
                            let lep_wX = 0;
                            let lep_wY = 0;
                            let lep_mass = 0;
                            let lep_charge = 0;
                            let lep_energy = 0;
                            let lep_emitterId = 0;
                            let lep_age = 0;
                            let lep_flags = 0;
                            let lep_kind = 0;
                            let lep__pad1 = 0;
                            lep_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                            lep_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                            lep_wX = wx;
                            lep_wY = wy;
                            lep_mass = ELECTRON_MASS;
                            lep_charge = (sign * BOSON_CHARGE);
                            lep_energy = 0.0;
                            lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                            lep_age = 0;
                            lep_flags = 1;
                            lep_kind = 1;
                            lep__pad1 = 0;
                            {
                                const _wbase = ((idx0) * 12);
                                _b_pions[_wbase + 0] = lep_posX;
                                _b_pions[_wbase + 1] = lep_posY;
                                _b_pions[_wbase + 2] = lep_wX;
                                _b_pions[_wbase + 3] = lep_wY;
                                _b_pions[_wbase + 4] = lep_mass;
                                _b_pions[_wbase + 5] = lep_charge;
                                _b_pions[_wbase + 6] = lep_energy;
                                _b_pions[_wbase + 7] = lep_emitterId;
                                _b_pions[_wbase + 8] = lep_age;
                                _b_pions[_wbase + 9] = lep_flags;
                                _b_pions[_wbase + 10] = lep_kind;
                                _b_pions[_wbase + 11] = lep__pad1;
                            }
                            {
                                const _wbase = ((i) * 9 + 5) - 5;
                                _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - (sign * BOSON_CHARGE));
                            }
                            const preMass = _b_particles[((i) * 9 + 4)];
                            {
                                const _wbase = ((i) * 9 + 4) - 4;
                                _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                            }
                            if ((preMass > EPSILON)) {
                                {
                                    const _wbase = ((i) * 9 + 7) - 7;
                                    _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (ELECTRON_MASS / preMass)));
                                }
                            }
                            M = _b_particles[((i) * 9 + 4)];
                            const newBodyRSq = Math.pow(M, 0.6666666666666666);
                            const newAngVel = (angw / Math.sqrt((1.0 + ((angw * angw) * newBodyRSq))));
                            const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                            const newDisc = (((M * M) - (newA * newA)) - (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]));
                            const newRadius = ((newDisc >= 0.0) ? (M + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : M);
                            const _sroa_35_base = ((i) * 8);
                            let drd_magMoment = _b_derived[_sroa_35_base + 0];
                            let drd_angMomentum = _b_derived[_sroa_35_base + 1];
                            let drd_invMass = _b_derived[_sroa_35_base + 2];
                            let drd_radiusSq = _b_derived[_sroa_35_base + 3];
                            let drd_velX = _b_derived[_sroa_35_base + 4];
                            let drd_velY = _b_derived[_sroa_35_base + 5];
                            let drd_angVel = _b_derived[_sroa_35_base + 6];
                            let drd_bodyRSq = _b_derived[_sroa_35_base + 7];
                            drd_invMass = ((M > EPSILON) ? (1.0 / M) : 0.0);
                            drd_radiusSq = (newRadius * newRadius);
                            drd_bodyRSq = newBodyRSq;
                            {
                                const _wbase = ((i) * 8);
                                _b_derived[_wbase + 0] = drd_magMoment;
                                _b_derived[_wbase + 1] = drd_angMomentum;
                                _b_derived[_wbase + 2] = drd_invMass;
                                _b_derived[_wbase + 3] = drd_radiusSq;
                                _b_derived[_wbase + 4] = drd_velX;
                                _b_derived[_wbase + 5] = drd_velY;
                                _b_derived[_wbase + 6] = drd_angVel;
                                _b_derived[_wbase + 7] = drd_bodyRSq;
                            }
                            {
                                const _wbase = ((i) * 5 + 0) - 0;
                                _b_particleAux[_wbase + 0] = newRadius;
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
                        const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                        if ((((!blackHoleOn) || (!coulombOn)) || (!radiationOn))) {
                            break __invocation;
                        }
                        let M = _b_particles[((i) * 9 + 4)];
                        if ((M <= MIN_MASS)) {
                            break __invocation;
                        }
                        const Q = _b_particles[((i) * 9 + 5)];
                        const absQ = Math.abs(Q);
                        if ((absQ < (BOSON_CHARGE - EPSILON))) {
                            break __invocation;
                        }
                        const bodyRSq = Math.pow(M, 0.6666666666666666);
                        const angw = _b_particles[((i) * 9 + 6)];
                        const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                        const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                        const disc = (((M * M) - (a * a)) - (Q * Q));
                        const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                        const rPlusSq = (rPlus * rPlus);
                        const sigma = (rPlusSq + (a * a));
                        const E_field = (absQ / sigma);
                        if ((E_field <= (0.5 * SCHWINGER_E_CR))) {
                            break __invocation;
                        }
                        const dRate = (((((SCHWINGER_COEFF * absQ) * absQ) / sigma) * Math.exp((((-PI) * SCHWINGER_E_CR) / E_field))) * _u_u_dt);
                        const _sroa_36_base = ((i) * 12);
                        let rs_radAccum = _b_radState[_sroa_36_base + 0];
                        let rs_hawkAccum = _b_radState[_sroa_36_base + 1];
                        let rs_yukawaRadAccum = _b_radState[_sroa_36_base + 2];
                        let rs_radDisplayX = _b_radState[_sroa_36_base + 3];
                        let rs_radDisplayY = _b_radState[_sroa_36_base + 4];
                        let rs_quadAccum = _b_radState[_sroa_36_base + 5];
                        let rs_emQuadAccum = _b_radState[_sroa_36_base + 6];
                        let rs_d3IContrib = _b_radState[_sroa_36_base + 7];
                        let rs_d3QContrib = _b_radState[_sroa_36_base + 8];
                        let rs_schwingerAccum = _b_radState[_sroa_36_base + 9];
                        let rs__pad1 = _b_radState[_sroa_36_base + 10];
                        let rs__pad2 = _b_radState[_sroa_36_base + 11];
                        rs_schwingerAccum = (rs_schwingerAccum + dRate);
                        if ((rs_schwingerAccum < 1.0)) {
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rs_radAccum;
                                _b_radState[_wbase + 1] = rs_hawkAccum;
                                _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rs_radDisplayX;
                                _b_radState[_wbase + 4] = rs_radDisplayY;
                                _b_radState[_wbase + 5] = rs_quadAccum;
                                _b_radState[_wbase + 6] = rs_emQuadAccum;
                                _b_radState[_wbase + 7] = rs_d3IContrib;
                                _b_radState[_wbase + 8] = rs_d3QContrib;
                                _b_radState[_wbase + 9] = rs_schwingerAccum;
                                _b_radState[_wbase + 10] = rs__pad1;
                                _b_radState[_wbase + 11] = rs__pad2;
                            }
                            break __invocation;
                        }
                        rs_schwingerAccum = 0.0;
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
                        }
                        const idx0 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                        if ((idx0 >= PION_POOL_CAP)) {
                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                            break __invocation;
                        }
                        const _inl_34_seed = (((i * 3456789)) ^ _u_u_frameCount);
                        let _inl_34_result;
                        _inl_34: {
                            let _inl_34__inl_0_result;
                            _inl_34__inl_0: {
                                let _inl_34__inl_0_state = ((_inl_34_seed * 747796405) + 2891336453);
                                const _inl_34__inl_0_word = (((((_inl_34__inl_0_state >> ((((_inl_34__inl_0_state >> 28)) + 4)))) ^ _inl_34__inl_0_state)) * 277803737);
                                _inl_34__inl_0_result = (((_inl_34__inl_0_word >> 22)) ^ _inl_34__inl_0_word);
                                break _inl_34__inl_0;
                            }
                            _inl_34_result = ((+(_inl_34__inl_0_result)) / 4294967296.0);
                            break _inl_34;
                        }
                        const angle = (_inl_34_result * TWO_PI);
                        const cosA = Math.cos(angle);
                        const sinA = Math.sin(angle);
                        const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                        const ePhi = (((BOSON_CHARGE * absQ) * rPlus) / sigma);
                        const ke = (((ePhi - ELECTRON_MASS)) < (0.0) ? (0.0) : ((ePhi - ELECTRON_MASS)));
                        const speed = ((ke <= 0.0) ? 0.0 : ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS)))))));
                        const gammaL = ((ke <= 0.0) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed)))))));
                        const wx = ((gammaL * speed) * cosA);
                        const wy = ((gammaL * speed) * sinA);
                        const sign = ((Q > 0.0) ? 1.0 : (-1.0));
                        let lep_posX = 0;
                        let lep_posY = 0;
                        let lep_wX = 0;
                        let lep_wY = 0;
                        let lep_mass = 0;
                        let lep_charge = 0;
                        let lep_energy = 0;
                        let lep_emitterId = 0;
                        let lep_age = 0;
                        let lep_flags = 0;
                        let lep_kind = 0;
                        let lep__pad1 = 0;
                        lep_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                        lep_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                        lep_wX = wx;
                        lep_wY = wy;
                        lep_mass = ELECTRON_MASS;
                        lep_charge = (sign * BOSON_CHARGE);
                        lep_energy = 0.0;
                        lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                        lep_age = 0;
                        lep_flags = 1;
                        lep_kind = 1;
                        lep__pad1 = 0;
                        {
                            const _wbase = ((idx0) * 12);
                            _b_pions[_wbase + 0] = lep_posX;
                            _b_pions[_wbase + 1] = lep_posY;
                            _b_pions[_wbase + 2] = lep_wX;
                            _b_pions[_wbase + 3] = lep_wY;
                            _b_pions[_wbase + 4] = lep_mass;
                            _b_pions[_wbase + 5] = lep_charge;
                            _b_pions[_wbase + 6] = lep_energy;
                            _b_pions[_wbase + 7] = lep_emitterId;
                            _b_pions[_wbase + 8] = lep_age;
                            _b_pions[_wbase + 9] = lep_flags;
                            _b_pions[_wbase + 10] = lep_kind;
                            _b_pions[_wbase + 11] = lep__pad1;
                        }
                        {
                            const _wbase = ((i) * 9 + 5) - 5;
                            _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - (sign * BOSON_CHARGE));
                        }
                        const preMass = _b_particles[((i) * 9 + 4)];
                        {
                            const _wbase = ((i) * 9 + 4) - 4;
                            _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                        }
                        if ((preMass > EPSILON)) {
                            {
                                const _wbase = ((i) * 9 + 7) - 7;
                                _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (ELECTRON_MASS / preMass)));
                            }
                        }
                        M = _b_particles[((i) * 9 + 4)];
                        const newBodyRSq = Math.pow(M, 0.6666666666666666);
                        const newAngVel = (angw / Math.sqrt((1.0 + ((angw * angw) * newBodyRSq))));
                        const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                        const newDisc = (((M * M) - (newA * newA)) - (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]));
                        const newRadius = ((newDisc >= 0.0) ? (M + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : M);
                        const _sroa_37_base = ((i) * 8);
                        let drd_magMoment = _b_derived[_sroa_37_base + 0];
                        let drd_angMomentum = _b_derived[_sroa_37_base + 1];
                        let drd_invMass = _b_derived[_sroa_37_base + 2];
                        let drd_radiusSq = _b_derived[_sroa_37_base + 3];
                        let drd_velX = _b_derived[_sroa_37_base + 4];
                        let drd_velY = _b_derived[_sroa_37_base + 5];
                        let drd_angVel = _b_derived[_sroa_37_base + 6];
                        let drd_bodyRSq = _b_derived[_sroa_37_base + 7];
                        drd_invMass = ((M > EPSILON) ? (1.0 / M) : 0.0);
                        drd_radiusSq = (newRadius * newRadius);
                        drd_bodyRSq = newBodyRSq;
                        {
                            const _wbase = ((i) * 8);
                            _b_derived[_wbase + 0] = drd_magMoment;
                            _b_derived[_wbase + 1] = drd_angMomentum;
                            _b_derived[_wbase + 2] = drd_invMass;
                            _b_derived[_wbase + 3] = drd_radiusSq;
                            _b_derived[_wbase + 4] = drd_velX;
                            _b_derived[_wbase + 5] = drd_velY;
                            _b_derived[_wbase + 6] = drd_angVel;
                            _b_derived[_wbase + 7] = drd_bodyRSq;
                        }
                        {
                            const _wbase = ((i) * 5 + 0) - 0;
                            _b_particleAux[_wbase + 0] = newRadius;
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
                    const blackHoleOn = (((_u_u_toggles0 & BLACK_HOLE_BIT)) != 0);
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const radiationOn = (((_u_u_toggles0 & RADIATION_BIT)) != 0);
                    if ((((!blackHoleOn) || (!coulombOn)) || (!radiationOn))) {
                        break __invocation;
                    }
                    let M = _b_particles[((i) * 9 + 4)];
                    if ((M <= MIN_MASS)) {
                        break __invocation;
                    }
                    const Q = _b_particles[((i) * 9 + 5)];
                    const absQ = Math.abs(Q);
                    if ((absQ < (BOSON_CHARGE - EPSILON))) {
                        break __invocation;
                    }
                    const bodyRSq = Math.pow(M, 0.6666666666666666);
                    const angw = _b_particles[((i) * 9 + 6)];
                    const angvel = (angw / Math.sqrt((1.0 + ((angw * angw) * bodyRSq))));
                    const a = ((INERTIA_K * bodyRSq) * Math.abs(angvel));
                    const disc = (((M * M) - (a * a)) - (Q * Q));
                    const rPlus = ((disc >= 0.0) ? (M + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : M);
                    const rPlusSq = (rPlus * rPlus);
                    const sigma = (rPlusSq + (a * a));
                    const E_field = (absQ / sigma);
                    if ((E_field <= (0.5 * SCHWINGER_E_CR))) {
                        break __invocation;
                    }
                    const dRate = (((((SCHWINGER_COEFF * absQ) * absQ) / sigma) * Math.exp((((-PI) * SCHWINGER_E_CR) / E_field))) * _u_u_dt);
                    const _sroa_38_base = ((i) * 12);
                    let rs_radAccum = _b_radState[_sroa_38_base + 0];
                    let rs_hawkAccum = _b_radState[_sroa_38_base + 1];
                    let rs_yukawaRadAccum = _b_radState[_sroa_38_base + 2];
                    let rs_radDisplayX = _b_radState[_sroa_38_base + 3];
                    let rs_radDisplayY = _b_radState[_sroa_38_base + 4];
                    let rs_quadAccum = _b_radState[_sroa_38_base + 5];
                    let rs_emQuadAccum = _b_radState[_sroa_38_base + 6];
                    let rs_d3IContrib = _b_radState[_sroa_38_base + 7];
                    let rs_d3QContrib = _b_radState[_sroa_38_base + 8];
                    let rs_schwingerAccum = _b_radState[_sroa_38_base + 9];
                    let rs__pad1 = _b_radState[_sroa_38_base + 10];
                    let rs__pad2 = _b_radState[_sroa_38_base + 11];
                    rs_schwingerAccum = (rs_schwingerAccum + dRate);
                    if ((rs_schwingerAccum < 1.0)) {
                        {
                            const _wbase = ((i) * 12);
                            _b_radState[_wbase + 0] = rs_radAccum;
                            _b_radState[_wbase + 1] = rs_hawkAccum;
                            _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                            _b_radState[_wbase + 3] = rs_radDisplayX;
                            _b_radState[_wbase + 4] = rs_radDisplayY;
                            _b_radState[_wbase + 5] = rs_quadAccum;
                            _b_radState[_wbase + 6] = rs_emQuadAccum;
                            _b_radState[_wbase + 7] = rs_d3IContrib;
                            _b_radState[_wbase + 8] = rs_d3QContrib;
                            _b_radState[_wbase + 9] = rs_schwingerAccum;
                            _b_radState[_wbase + 10] = rs__pad1;
                            _b_radState[_wbase + 11] = rs__pad2;
                        }
                        break __invocation;
                    }
                    rs_schwingerAccum = 0.0;
                    {
                        const _wbase = ((i) * 12);
                        _b_radState[_wbase + 0] = rs_radAccum;
                        _b_radState[_wbase + 1] = rs_hawkAccum;
                        _b_radState[_wbase + 2] = rs_yukawaRadAccum;
                        _b_radState[_wbase + 3] = rs_radDisplayX;
                        _b_radState[_wbase + 4] = rs_radDisplayY;
                        _b_radState[_wbase + 5] = rs_quadAccum;
                        _b_radState[_wbase + 6] = rs_emQuadAccum;
                        _b_radState[_wbase + 7] = rs_d3IContrib;
                        _b_radState[_wbase + 8] = rs_d3QContrib;
                        _b_radState[_wbase + 9] = rs_schwingerAccum;
                        _b_radState[_wbase + 10] = rs__pad1;
                        _b_radState[_wbase + 11] = rs__pad2;
                    }
                    const idx0 = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                    if ((idx0 >= PION_POOL_CAP)) {
                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                        break __invocation;
                    }
                    const _inl_34_seed = (((i * 3456789)) ^ _u_u_frameCount);
                    let _inl_34_result;
                    _inl_34: {
                        let _inl_34__inl_0_result;
                        _inl_34__inl_0: {
                            let _inl_34__inl_0_state = ((_inl_34_seed * 747796405) + 2891336453);
                            const _inl_34__inl_0_word = (((((_inl_34__inl_0_state >> ((((_inl_34__inl_0_state >> 28)) + 4)))) ^ _inl_34__inl_0_state)) * 277803737);
                            _inl_34__inl_0_result = (((_inl_34__inl_0_word >> 22)) ^ _inl_34__inl_0_word);
                            break _inl_34__inl_0;
                        }
                        _inl_34_result = ((+(_inl_34__inl_0_result)) / 4294967296.0);
                        break _inl_34;
                    }
                    const angle = (_inl_34_result * TWO_PI);
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    const offset = (((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)) < (SPAWN_OFFSET_FLOOR) ? (SPAWN_OFFSET_FLOOR) : ((_b_particleAux[((i) * 5 + 0)] * SPAWN_OFFSET_MUL)));
                    const ePhi = (((BOSON_CHARGE * absQ) * rPlus) / sigma);
                    const ke = (((ePhi - ELECTRON_MASS)) < (0.0) ? (0.0) : ((ePhi - ELECTRON_MASS)));
                    const speed = ((ke <= 0.0) ? 0.0 : ((MAX_SPEED_RATIO) < ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS))))) ? (MAX_SPEED_RATIO) : ((Math.sqrt((((ke * ((ke + (2.0 * ELECTRON_MASS))))) < (0.0) ? (0.0) : ((ke * ((ke + (2.0 * ELECTRON_MASS))))))) / (((ke + ELECTRON_MASS)) < (EPSILON) ? (EPSILON) : ((ke + ELECTRON_MASS)))))));
                    const gammaL = ((ke <= 0.0) ? 1.0 : (1.0 / Math.sqrt((((1.0 - (speed * speed))) < (EPSILON) ? (EPSILON) : ((1.0 - (speed * speed)))))));
                    const wx = ((gammaL * speed) * cosA);
                    const wy = ((gammaL * speed) * sinA);
                    const sign = ((Q > 0.0) ? 1.0 : (-1.0));
                    let lep_posX = 0;
                    let lep_posY = 0;
                    let lep_wX = 0;
                    let lep_wY = 0;
                    let lep_mass = 0;
                    let lep_charge = 0;
                    let lep_energy = 0;
                    let lep_emitterId = 0;
                    let lep_age = 0;
                    let lep_flags = 0;
                    let lep_kind = 0;
                    let lep__pad1 = 0;
                    lep_posX = (_b_particles[((i) * 9 + 0)] + (cosA * offset));
                    lep_posY = (_b_particles[((i) * 9 + 1)] + (sinA * offset));
                    lep_wX = wx;
                    lep_wY = wy;
                    lep_mass = ELECTRON_MASS;
                    lep_charge = (sign * BOSON_CHARGE);
                    lep_energy = 0.0;
                    lep_emitterId = _b_particleAux[((i) * 5 + 1)];
                    lep_age = 0;
                    lep_flags = 1;
                    lep_kind = 1;
                    lep__pad1 = 0;
                    {
                        const _wbase = ((idx0) * 12);
                        _b_pions[_wbase + 0] = lep_posX;
                        _b_pions[_wbase + 1] = lep_posY;
                        _b_pions[_wbase + 2] = lep_wX;
                        _b_pions[_wbase + 3] = lep_wY;
                        _b_pions[_wbase + 4] = lep_mass;
                        _b_pions[_wbase + 5] = lep_charge;
                        _b_pions[_wbase + 6] = lep_energy;
                        _b_pions[_wbase + 7] = lep_emitterId;
                        _b_pions[_wbase + 8] = lep_age;
                        _b_pions[_wbase + 9] = lep_flags;
                        _b_pions[_wbase + 10] = lep_kind;
                        _b_pions[_wbase + 11] = lep__pad1;
                    }
                    {
                        const _wbase = ((i) * 9 + 5) - 5;
                        _b_particles[_wbase + 5] = (_b_particles[_wbase + 5] - (sign * BOSON_CHARGE));
                    }
                    const preMass = _b_particles[((i) * 9 + 4)];
                    {
                        const _wbase = ((i) * 9 + 4) - 4;
                        _b_particles[_wbase + 4] = (_b_particles[_wbase + 4] - ELECTRON_MASS);
                    }
                    if ((preMass > EPSILON)) {
                        {
                            const _wbase = ((i) * 9 + 7) - 7;
                            _b_particles[_wbase + 7] = (_b_particles[_wbase + 7] * (1.0 - (ELECTRON_MASS / preMass)));
                        }
                    }
                    M = _b_particles[((i) * 9 + 4)];
                    const newBodyRSq = Math.pow(M, 0.6666666666666666);
                    const newAngVel = (angw / Math.sqrt((1.0 + ((angw * angw) * newBodyRSq))));
                    const newA = ((INERTIA_K * newBodyRSq) * Math.abs(newAngVel));
                    const newDisc = (((M * M) - (newA * newA)) - (_b_particles[((i) * 9 + 5)] * _b_particles[((i) * 9 + 5)]));
                    const newRadius = ((newDisc >= 0.0) ? (M + Math.sqrt(((0.0) < (newDisc) ? (newDisc) : (0.0)))) : M);
                    const _sroa_39_base = ((i) * 8);
                    let drd_magMoment = _b_derived[_sroa_39_base + 0];
                    let drd_angMomentum = _b_derived[_sroa_39_base + 1];
                    let drd_invMass = _b_derived[_sroa_39_base + 2];
                    let drd_radiusSq = _b_derived[_sroa_39_base + 3];
                    let drd_velX = _b_derived[_sroa_39_base + 4];
                    let drd_velY = _b_derived[_sroa_39_base + 5];
                    let drd_angVel = _b_derived[_sroa_39_base + 6];
                    let drd_bodyRSq = _b_derived[_sroa_39_base + 7];
                    drd_invMass = ((M > EPSILON) ? (1.0 / M) : 0.0);
                    drd_radiusSq = (newRadius * newRadius);
                    drd_bodyRSq = newBodyRSq;
                    {
                        const _wbase = ((i) * 8);
                        _b_derived[_wbase + 0] = drd_magMoment;
                        _b_derived[_wbase + 1] = drd_angMomentum;
                        _b_derived[_wbase + 2] = drd_invMass;
                        _b_derived[_wbase + 3] = drd_radiusSq;
                        _b_derived[_wbase + 4] = drd_velX;
                        _b_derived[_wbase + 5] = drd_velY;
                        _b_derived[_wbase + 6] = drd_angVel;
                        _b_derived[_wbase + 7] = drd_bodyRSq;
                    }
                    {
                        const _wbase = ((i) * 5 + 0) - 0;
                        _b_particleAux[_wbase + 0] = newRadius;
                    }
                }
            }
        }
    }
    entry["schwingerDischarge"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_schwingerDischarge(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["larmorRadiation"] = function (workgroups, domain, origin) {
            return __entry_0_larmorRadiation(workgroups, bindings, domain, origin);
        };
        bound["hawkingRadiation"] = function (workgroups, domain, origin) {
            return __entry_1_hawkingRadiation(workgroups, bindings, domain, origin);
        };
        bound["pionEmission"] = function (workgroups, domain, origin) {
            return __entry_2_pionEmission(workgroups, bindings, domain, origin);
        };
        bound["schwingerDischarge"] = function (workgroups, domain, origin) {
            return __entry_3_schwingerDischarge(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","particles","particleAux","derived","allForces","radState","axYukMod","photons","phCount","pions","piCount"], entryInfo };
}
