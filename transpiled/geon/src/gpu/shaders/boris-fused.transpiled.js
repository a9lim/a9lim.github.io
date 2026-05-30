// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/boris-fused.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 428c58eb67b0a869a21f1e6561fe1e20d760a8a18e9f6cee2cd7fffa289cedb8
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":34496,"lines":646,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.823Z
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
        const _u_uniforms_toggles0 = _b_uniforms.toggles0;
        const _u_uniforms_aliveCount = _b_uniforms.aliveCount;
        const _u_uniforms_extBz = _b_uniforms.extBz;
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
                    const idx = gid_x;
                    if ((idx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    if ((((_b_particles[((idx) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const m = _b_particles[((idx) * 9 + 4)];
                    if ((m < EPSILON)) {
                        break __invocation;
                    }
                    const invM = (1.0 / m);
                    const dt = _u_uniforms_dt;
                    const halfDtOverM = ((dt * 0.5) * invM);
                    let wx = _b_particles[((idx) * 9 + 2)];
                    let wy = _b_particles[((idx) * 9 + 3)];
                    const _sroa_0_base = ((idx) * 40);
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
                    const fx = af_totalForce_x;
                    const fy = af_totalForce_y;
                    wx = (wx + (fx * halfDtOverM));
                    wy = (wy + (fy * halfDtOverM));
                    let _inl_24_result;
                    _inl_24: {
                        _inl_24_result = (((_u_uniforms_toggles0 & MAGNETIC_BIT)) != 0);
                        break _inl_24;
                    }
                    const hasMag = (_inl_24_result || (_u_uniforms_extBz != 0.0));
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = (((_u_uniforms_toggles0 & GRAVITOMAG_BIT)) != 0);
                        break _inl_25;
                    }
                    const hasGM = _inl_25_result;
                    if ((hasMag || hasGM)) {
                        const q = _b_particles[((idx) * 9 + 5)];
                        const totalBz = af_bFields_x;
                        const totalBgz = af_bFields_y;
                        let t = 0.0;
                        if (hasMag) {
                            t = (t + (((q * 0.5) * invM) * totalBz));
                        }
                        if (hasGM) {
                            t = (t + (2.0 * totalBgz));
                        }
                        if ((t != 0.0)) {
                            let _inl_26_result;
                            _inl_26: {
                                _inl_26_result = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                break _inl_26;
                            }
                            const relOn = _inl_26_result;
                            const gamma = (relOn ? Math.sqrt(((1.0 + (wx * wx)) + (wy * wy))) : 1.0);
                            t = (t * (dt / gamma));
                            const s = ((2.0 * t) / ((1.0 + (t * t))));
                            const wpx = (wx + (wy * t));
                            const wpy = (wy - (wx * t));
                            wx = (wx + (wpy * s));
                            wy = (wy - (wpx * s));
                        }
                    }
                    wx = (wx + (fx * halfDtOverM));
                    wy = (wy + (fy * halfDtOverM));
                    if (((wx != wx) || (wy != wy))) {
                        wx = 0.0;
                        wy = 0.0;
                    }
                    {
                        const _wbase = ((idx) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = wx;
                    }
                    {
                        const _wbase = ((idx) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = wy;
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
                            if ((((_b_particles[((idx) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            const m = _b_particles[((idx) * 9 + 4)];
                            if ((m < EPSILON)) {
                                break __invocation;
                            }
                            const invM = (1.0 / m);
                            const dt = _u_uniforms_dt;
                            const halfDtOverM = ((dt * 0.5) * invM);
                            let wx = _b_particles[((idx) * 9 + 2)];
                            let wy = _b_particles[((idx) * 9 + 3)];
                            const _sroa_1_base = ((idx) * 40);
                            const af_f0_x = _b_allForces[_sroa_1_base + 0];
                            const af_f0_y = _b_allForces[_sroa_1_base + 1];
                            const af_f0_z = _b_allForces[_sroa_1_base + 2];
                            const af_f0_w = _b_allForces[_sroa_1_base + 3];
                            const af_f1_x = _b_allForces[_sroa_1_base + 4];
                            const af_f1_y = _b_allForces[_sroa_1_base + 5];
                            const af_f1_z = _b_allForces[_sroa_1_base + 6];
                            const af_f1_w = _b_allForces[_sroa_1_base + 7];
                            const af_f2_x = _b_allForces[_sroa_1_base + 8];
                            const af_f2_y = _b_allForces[_sroa_1_base + 9];
                            const af_f2_z = _b_allForces[_sroa_1_base + 10];
                            const af_f2_w = _b_allForces[_sroa_1_base + 11];
                            const af_f3_x = _b_allForces[_sroa_1_base + 12];
                            const af_f3_y = _b_allForces[_sroa_1_base + 13];
                            const af_f3_z = _b_allForces[_sroa_1_base + 14];
                            const af_f3_w = _b_allForces[_sroa_1_base + 15];
                            const af_f4_x = _b_allForces[_sroa_1_base + 16];
                            const af_f4_y = _b_allForces[_sroa_1_base + 17];
                            const af_f4_z = _b_allForces[_sroa_1_base + 18];
                            const af_f4_w = _b_allForces[_sroa_1_base + 19];
                            const af_f5_x = _b_allForces[_sroa_1_base + 20];
                            const af_f5_y = _b_allForces[_sroa_1_base + 21];
                            const af_f5_z = _b_allForces[_sroa_1_base + 22];
                            const af_f5_w = _b_allForces[_sroa_1_base + 23];
                            const af_torques_x = _b_allForces[_sroa_1_base + 24];
                            const af_torques_y = _b_allForces[_sroa_1_base + 25];
                            const af_torques_z = _b_allForces[_sroa_1_base + 26];
                            const af_torques_w = _b_allForces[_sroa_1_base + 27];
                            const af_bFields_x = _b_allForces[_sroa_1_base + 28];
                            const af_bFields_y = _b_allForces[_sroa_1_base + 29];
                            const af_bFields_z = _b_allForces[_sroa_1_base + 30];
                            const af_bFields_w = _b_allForces[_sroa_1_base + 31];
                            const af_bFieldGrads_x = _b_allForces[_sroa_1_base + 32];
                            const af_bFieldGrads_y = _b_allForces[_sroa_1_base + 33];
                            const af_bFieldGrads_z = _b_allForces[_sroa_1_base + 34];
                            const af_bFieldGrads_w = _b_allForces[_sroa_1_base + 35];
                            const af_totalForce_x = _b_allForces[_sroa_1_base + 36];
                            const af_totalForce_y = _b_allForces[_sroa_1_base + 37];
                            const af_jerk_x = _b_allForces[_sroa_1_base + 38];
                            const af_jerk_y = _b_allForces[_sroa_1_base + 39];
                            const fx = af_totalForce_x;
                            const fy = af_totalForce_y;
                            wx = (wx + (fx * halfDtOverM));
                            wy = (wy + (fy * halfDtOverM));
                            let _inl_24_result;
                            _inl_24: {
                                _inl_24_result = (((_u_uniforms_toggles0 & MAGNETIC_BIT)) != 0);
                                break _inl_24;
                            }
                            const hasMag = (_inl_24_result || (_u_uniforms_extBz != 0.0));
                            let _inl_25_result;
                            _inl_25: {
                                _inl_25_result = (((_u_uniforms_toggles0 & GRAVITOMAG_BIT)) != 0);
                                break _inl_25;
                            }
                            const hasGM = _inl_25_result;
                            if ((hasMag || hasGM)) {
                                const q = _b_particles[((idx) * 9 + 5)];
                                const totalBz = af_bFields_x;
                                const totalBgz = af_bFields_y;
                                let t = 0.0;
                                if (hasMag) {
                                    t = (t + (((q * 0.5) * invM) * totalBz));
                                }
                                if (hasGM) {
                                    t = (t + (2.0 * totalBgz));
                                }
                                if ((t != 0.0)) {
                                    let _inl_26_result;
                                    _inl_26: {
                                        _inl_26_result = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                        break _inl_26;
                                    }
                                    const relOn = _inl_26_result;
                                    const gamma = (relOn ? Math.sqrt(((1.0 + (wx * wx)) + (wy * wy))) : 1.0);
                                    t = (t * (dt / gamma));
                                    const s = ((2.0 * t) / ((1.0 + (t * t))));
                                    const wpx = (wx + (wy * t));
                                    const wpy = (wy - (wx * t));
                                    wx = (wx + (wpy * s));
                                    wy = (wy - (wpx * s));
                                }
                            }
                            wx = (wx + (fx * halfDtOverM));
                            wy = (wy + (fy * halfDtOverM));
                            if (((wx != wx) || (wy != wy))) {
                                wx = 0.0;
                                wy = 0.0;
                            }
                            {
                                const _wbase = ((idx) * 9 + 2) - 2;
                                _b_particles[_wbase + 2] = wx;
                            }
                            {
                                const _wbase = ((idx) * 9 + 3) - 3;
                                _b_particles[_wbase + 3] = wy;
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
                        if ((((_b_particles[((idx) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        const m = _b_particles[((idx) * 9 + 4)];
                        if ((m < EPSILON)) {
                            break __invocation;
                        }
                        const invM = (1.0 / m);
                        const dt = _u_uniforms_dt;
                        const halfDtOverM = ((dt * 0.5) * invM);
                        let wx = _b_particles[((idx) * 9 + 2)];
                        let wy = _b_particles[((idx) * 9 + 3)];
                        const _sroa_2_base = ((idx) * 40);
                        const af_f0_x = _b_allForces[_sroa_2_base + 0];
                        const af_f0_y = _b_allForces[_sroa_2_base + 1];
                        const af_f0_z = _b_allForces[_sroa_2_base + 2];
                        const af_f0_w = _b_allForces[_sroa_2_base + 3];
                        const af_f1_x = _b_allForces[_sroa_2_base + 4];
                        const af_f1_y = _b_allForces[_sroa_2_base + 5];
                        const af_f1_z = _b_allForces[_sroa_2_base + 6];
                        const af_f1_w = _b_allForces[_sroa_2_base + 7];
                        const af_f2_x = _b_allForces[_sroa_2_base + 8];
                        const af_f2_y = _b_allForces[_sroa_2_base + 9];
                        const af_f2_z = _b_allForces[_sroa_2_base + 10];
                        const af_f2_w = _b_allForces[_sroa_2_base + 11];
                        const af_f3_x = _b_allForces[_sroa_2_base + 12];
                        const af_f3_y = _b_allForces[_sroa_2_base + 13];
                        const af_f3_z = _b_allForces[_sroa_2_base + 14];
                        const af_f3_w = _b_allForces[_sroa_2_base + 15];
                        const af_f4_x = _b_allForces[_sroa_2_base + 16];
                        const af_f4_y = _b_allForces[_sroa_2_base + 17];
                        const af_f4_z = _b_allForces[_sroa_2_base + 18];
                        const af_f4_w = _b_allForces[_sroa_2_base + 19];
                        const af_f5_x = _b_allForces[_sroa_2_base + 20];
                        const af_f5_y = _b_allForces[_sroa_2_base + 21];
                        const af_f5_z = _b_allForces[_sroa_2_base + 22];
                        const af_f5_w = _b_allForces[_sroa_2_base + 23];
                        const af_torques_x = _b_allForces[_sroa_2_base + 24];
                        const af_torques_y = _b_allForces[_sroa_2_base + 25];
                        const af_torques_z = _b_allForces[_sroa_2_base + 26];
                        const af_torques_w = _b_allForces[_sroa_2_base + 27];
                        const af_bFields_x = _b_allForces[_sroa_2_base + 28];
                        const af_bFields_y = _b_allForces[_sroa_2_base + 29];
                        const af_bFields_z = _b_allForces[_sroa_2_base + 30];
                        const af_bFields_w = _b_allForces[_sroa_2_base + 31];
                        const af_bFieldGrads_x = _b_allForces[_sroa_2_base + 32];
                        const af_bFieldGrads_y = _b_allForces[_sroa_2_base + 33];
                        const af_bFieldGrads_z = _b_allForces[_sroa_2_base + 34];
                        const af_bFieldGrads_w = _b_allForces[_sroa_2_base + 35];
                        const af_totalForce_x = _b_allForces[_sroa_2_base + 36];
                        const af_totalForce_y = _b_allForces[_sroa_2_base + 37];
                        const af_jerk_x = _b_allForces[_sroa_2_base + 38];
                        const af_jerk_y = _b_allForces[_sroa_2_base + 39];
                        const fx = af_totalForce_x;
                        const fy = af_totalForce_y;
                        wx = (wx + (fx * halfDtOverM));
                        wy = (wy + (fy * halfDtOverM));
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = (((_u_uniforms_toggles0 & MAGNETIC_BIT)) != 0);
                            break _inl_24;
                        }
                        const hasMag = (_inl_24_result || (_u_uniforms_extBz != 0.0));
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = (((_u_uniforms_toggles0 & GRAVITOMAG_BIT)) != 0);
                            break _inl_25;
                        }
                        const hasGM = _inl_25_result;
                        if ((hasMag || hasGM)) {
                            const q = _b_particles[((idx) * 9 + 5)];
                            const totalBz = af_bFields_x;
                            const totalBgz = af_bFields_y;
                            let t = 0.0;
                            if (hasMag) {
                                t = (t + (((q * 0.5) * invM) * totalBz));
                            }
                            if (hasGM) {
                                t = (t + (2.0 * totalBgz));
                            }
                            if ((t != 0.0)) {
                                let _inl_26_result;
                                _inl_26: {
                                    _inl_26_result = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                    break _inl_26;
                                }
                                const relOn = _inl_26_result;
                                const gamma = (relOn ? Math.sqrt(((1.0 + (wx * wx)) + (wy * wy))) : 1.0);
                                t = (t * (dt / gamma));
                                const s = ((2.0 * t) / ((1.0 + (t * t))));
                                const wpx = (wx + (wy * t));
                                const wpy = (wy - (wx * t));
                                wx = (wx + (wpy * s));
                                wy = (wy - (wpx * s));
                            }
                        }
                        wx = (wx + (fx * halfDtOverM));
                        wy = (wy + (fy * halfDtOverM));
                        if (((wx != wx) || (wy != wy))) {
                            wx = 0.0;
                            wy = 0.0;
                        }
                        {
                            const _wbase = ((idx) * 9 + 2) - 2;
                            _b_particles[_wbase + 2] = wx;
                        }
                        {
                            const _wbase = ((idx) * 9 + 3) - 3;
                            _b_particles[_wbase + 3] = wy;
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
                    if ((((_b_particles[((idx) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const m = _b_particles[((idx) * 9 + 4)];
                    if ((m < EPSILON)) {
                        break __invocation;
                    }
                    const invM = (1.0 / m);
                    const dt = _u_uniforms_dt;
                    const halfDtOverM = ((dt * 0.5) * invM);
                    let wx = _b_particles[((idx) * 9 + 2)];
                    let wy = _b_particles[((idx) * 9 + 3)];
                    const _sroa_3_base = ((idx) * 40);
                    const af_f0_x = _b_allForces[_sroa_3_base + 0];
                    const af_f0_y = _b_allForces[_sroa_3_base + 1];
                    const af_f0_z = _b_allForces[_sroa_3_base + 2];
                    const af_f0_w = _b_allForces[_sroa_3_base + 3];
                    const af_f1_x = _b_allForces[_sroa_3_base + 4];
                    const af_f1_y = _b_allForces[_sroa_3_base + 5];
                    const af_f1_z = _b_allForces[_sroa_3_base + 6];
                    const af_f1_w = _b_allForces[_sroa_3_base + 7];
                    const af_f2_x = _b_allForces[_sroa_3_base + 8];
                    const af_f2_y = _b_allForces[_sroa_3_base + 9];
                    const af_f2_z = _b_allForces[_sroa_3_base + 10];
                    const af_f2_w = _b_allForces[_sroa_3_base + 11];
                    const af_f3_x = _b_allForces[_sroa_3_base + 12];
                    const af_f3_y = _b_allForces[_sroa_3_base + 13];
                    const af_f3_z = _b_allForces[_sroa_3_base + 14];
                    const af_f3_w = _b_allForces[_sroa_3_base + 15];
                    const af_f4_x = _b_allForces[_sroa_3_base + 16];
                    const af_f4_y = _b_allForces[_sroa_3_base + 17];
                    const af_f4_z = _b_allForces[_sroa_3_base + 18];
                    const af_f4_w = _b_allForces[_sroa_3_base + 19];
                    const af_f5_x = _b_allForces[_sroa_3_base + 20];
                    const af_f5_y = _b_allForces[_sroa_3_base + 21];
                    const af_f5_z = _b_allForces[_sroa_3_base + 22];
                    const af_f5_w = _b_allForces[_sroa_3_base + 23];
                    const af_torques_x = _b_allForces[_sroa_3_base + 24];
                    const af_torques_y = _b_allForces[_sroa_3_base + 25];
                    const af_torques_z = _b_allForces[_sroa_3_base + 26];
                    const af_torques_w = _b_allForces[_sroa_3_base + 27];
                    const af_bFields_x = _b_allForces[_sroa_3_base + 28];
                    const af_bFields_y = _b_allForces[_sroa_3_base + 29];
                    const af_bFields_z = _b_allForces[_sroa_3_base + 30];
                    const af_bFields_w = _b_allForces[_sroa_3_base + 31];
                    const af_bFieldGrads_x = _b_allForces[_sroa_3_base + 32];
                    const af_bFieldGrads_y = _b_allForces[_sroa_3_base + 33];
                    const af_bFieldGrads_z = _b_allForces[_sroa_3_base + 34];
                    const af_bFieldGrads_w = _b_allForces[_sroa_3_base + 35];
                    const af_totalForce_x = _b_allForces[_sroa_3_base + 36];
                    const af_totalForce_y = _b_allForces[_sroa_3_base + 37];
                    const af_jerk_x = _b_allForces[_sroa_3_base + 38];
                    const af_jerk_y = _b_allForces[_sroa_3_base + 39];
                    const fx = af_totalForce_x;
                    const fy = af_totalForce_y;
                    wx = (wx + (fx * halfDtOverM));
                    wy = (wy + (fy * halfDtOverM));
                    let _inl_24_result;
                    _inl_24: {
                        _inl_24_result = (((_u_uniforms_toggles0 & MAGNETIC_BIT)) != 0);
                        break _inl_24;
                    }
                    const hasMag = (_inl_24_result || (_u_uniforms_extBz != 0.0));
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = (((_u_uniforms_toggles0 & GRAVITOMAG_BIT)) != 0);
                        break _inl_25;
                    }
                    const hasGM = _inl_25_result;
                    if ((hasMag || hasGM)) {
                        const q = _b_particles[((idx) * 9 + 5)];
                        const totalBz = af_bFields_x;
                        const totalBgz = af_bFields_y;
                        let t = 0.0;
                        if (hasMag) {
                            t = (t + (((q * 0.5) * invM) * totalBz));
                        }
                        if (hasGM) {
                            t = (t + (2.0 * totalBgz));
                        }
                        if ((t != 0.0)) {
                            let _inl_26_result;
                            _inl_26: {
                                _inl_26_result = (((_u_uniforms_toggles0 & RELATIVITY_BIT)) != 0);
                                break _inl_26;
                            }
                            const relOn = _inl_26_result;
                            const gamma = (relOn ? Math.sqrt(((1.0 + (wx * wx)) + (wy * wy))) : 1.0);
                            t = (t * (dt / gamma));
                            const s = ((2.0 * t) / ((1.0 + (t * t))));
                            const wpx = (wx + (wy * t));
                            const wpy = (wy - (wx * t));
                            wx = (wx + (wpy * s));
                            wy = (wy - (wpx * s));
                        }
                    }
                    wx = (wx + (fx * halfDtOverM));
                    wy = (wy + (fy * halfDtOverM));
                    if (((wx != wx) || (wy != wy))) {
                        wx = 0.0;
                        wy = 0.0;
                    }
                    {
                        const _wbase = ((idx) * 9 + 2) - 2;
                        _b_particles[_wbase + 2] = wx;
                    }
                    {
                        const _wbase = ((idx) * 9 + 3) - 3;
                        _b_particles[_wbase + 3] = wy;
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

    return { entry, bind, bindings: ["uniforms","particles","allForces"], entryInfo };
}
