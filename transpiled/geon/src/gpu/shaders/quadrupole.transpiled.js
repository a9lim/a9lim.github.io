// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/quadrupole.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 5997da399c3139665e310986820fc8cf41c8bba25f729f0aa13a1b0b87ff3285
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":49336,"lines":883,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":4,"workgroupReductionInits":0,"flatWorkgroupArrays":12,"flatWorkgroupSlots":768,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.722Z
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

    function workgroupReduce4(lid) {
        for (let stride = 32; (stride > 0); stride = (stride >> 1)) {
            rt.workgroupBarrier();
            if ((lid < stride)) {
                wg.sh_comXw[((lid))] = (wg.sh_comXw[((lid))] + wg.sh_comXw[(((lid + stride)))]);
                wg.sh_comYw[((lid))] = (wg.sh_comYw[((lid))] + wg.sh_comYw[(((lid + stride)))]);
                wg.sh_mass[((lid))] = (wg.sh_mass[((lid))] + wg.sh_mass[(((lid + stride)))]);
                wg.sh_ke[((lid))] = (wg.sh_ke[((lid))] + wg.sh_ke[(((lid + stride)))]);
            }
        }
        rt.workgroupBarrier();
    }

    function workgroupReduce8(lid) {
        for (let stride = 32; (stride > 0); stride = (stride >> 1)) {
            rt.workgroupBarrier();
            if ((lid < stride)) {
                wg.sh_d3Ixx[((lid))] = (wg.sh_d3Ixx[((lid))] + wg.sh_d3Ixx[(((lid + stride)))]);
                wg.sh_d3Ixy[((lid))] = (wg.sh_d3Ixy[((lid))] + wg.sh_d3Ixy[(((lid + stride)))]);
                wg.sh_d3Iyy[((lid))] = (wg.sh_d3Iyy[((lid))] + wg.sh_d3Iyy[(((lid + stride)))]);
                wg.sh_d3Qxx[((lid))] = (wg.sh_d3Qxx[((lid))] + wg.sh_d3Qxx[(((lid + stride)))]);
                wg.sh_d3Qxy[((lid))] = (wg.sh_d3Qxy[((lid))] + wg.sh_d3Qxy[(((lid + stride)))]);
                wg.sh_d3Qyy[((lid))] = (wg.sh_d3Qyy[((lid))] + wg.sh_d3Qyy[(((lid + stride)))]);
                wg.sh_totalD3I[((lid))] = (wg.sh_totalD3I[((lid))] + wg.sh_totalD3I[(((lid + stride)))]);
                wg.sh_totalD3Q[((lid))] = (wg.sh_totalD3Q[((lid))] + wg.sh_totalD3Q[(((lid + stride)))]);
            }
        }
        rt.workgroupBarrier();
    }

    function quadSample(Axx, Axy, particleIdx, channel) {
        const peak2 = ((Axx * Axx) + (Axy * Axy));
        if ((peak2 < EPSILON)) {
            const _inl_24_seed = ((((particleIdx * 2654435761)) ^ ((bindings.u.frameCount * 1664525))) ^ ((channel * 999)));
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
            return (_inl_24_result * TWO_PI);
        }
        let seedBase = ((((particleIdx * 2246822519)) ^ ((bindings.u.frameCount * 2654435769))) ^ ((channel * 12345)));
        for (let t = 0; (t < MAX_REJECTION_SAMPLES); t++) {
            const _inl_25_seed = (seedBase ^ ((t * 1234567)));
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
            const phi = (_inl_25_result * TWO_PI);
            const c2 = Math.cos((2.0 * phi));
            const s2 = Math.sin((2.0 * phi));
            const h = ((Axx * c2) + (Axy * s2));
            const _inl_26_seed = (seedBase ^ (((t * 7654321) + 1)));
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
            if (((_inl_26_result * peak2) <= (h * h))) {
                return phi;
            }
        }
        const _inl_27_seed = (seedBase ^ 999999);
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
        return (_inl_27_result * TWO_PI);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["quadrupoleCoM"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":12,"optimizedWorkgroupReductionInits":0};
    function __entry_0_quadrupoleCoM(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_reductionBuf = bindings.reductionBuf;
        const wg = Object.create(null);
        wg.sh_comXw = new Float32Array(64);
        wg.sh_comYw = new Float32Array(64);
        wg.sh_mass = new Float32Array(64);
        wg.sh_ke = new Float32Array(64);
        wg.sh_d3Ixx = new Float32Array(64);
        wg.sh_d3Ixy = new Float32Array(64);
        wg.sh_d3Iyy = new Float32Array(64);
        wg.sh_d3Qxx = new Float32Array(64);
        wg.sh_d3Qxy = new Float32Array(64);
        wg.sh_d3Qyy = new Float32Array(64);
        wg.sh_totalD3I = new Float32Array(64);
        wg.sh_totalD3Q = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_comXw.fill(0);
            wg.sh_comYw.fill(0);
            wg.sh_mass.fill(0);
            wg.sh_ke.fill(0);
            wg.sh_d3Ixx.fill(0);
            wg.sh_d3Ixy.fill(0);
            wg.sh_d3Iyy.fill(0);
            wg.sh_d3Qxx.fill(0);
            wg.sh_d3Qxy.fill(0);
            wg.sh_d3Qyy.fill(0);
            wg.sh_totalD3I.fill(0);
            wg.sh_totalD3Q.fill(0);
            const wgid_x = wgx;
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    const lid_x = lx;
                    {
                        const i = gid_x;
                        const localId = lid_x;
                        const alive = ((i < _u_u_aliveCount) && (((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) != 0));
                        let mXw = 0.0;
                        let mYw = 0.0;
                        let m = 0.0;
                        let ke = 0.0;
                        if (alive) {
                            const mass = _b_particles[((i) * 9 + 4)];
                            mXw = (_b_particles[((i) * 9 + 0)] * mass);
                            mYw = (_b_particles[((i) * 9 + 1)] * mass);
                            m = mass;
                            const wx = _b_particles[((i) * 9 + 2)];
                            const wy = _b_particles[((i) * 9 + 3)];
                            const wSq = ((wx * wx) + (wy * wy));
                            if ((wSq > EPSILON)) {
                                ke = ((mass * wSq) / ((Math.sqrt((1.0 + wSq)) + 1.0)));
                            }
                        }
                        wg.sh_comXw[((localId))] = mXw;
                        wg.sh_comYw[((localId))] = mYw;
                        wg.sh_mass[((localId))] = m;
                        wg.sh_ke[((localId))] = ke;
                        workgroupReduce4(localId);
                        if ((localId == 0)) {
                            const base = (wgid_x * 4);
                            _b_reductionBuf[base] = wg.sh_comXw[((0))];
                            _b_reductionBuf[(base + 1)] = wg.sh_comYw[((0))];
                            _b_reductionBuf[(base + 2)] = wg.sh_mass[((0))];
                            _b_reductionBuf[(base + 3)] = wg.sh_ke[((0))];
                        }
                    }
                }
            }
        }
    }
    entry["quadrupoleCoM"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_quadrupoleCoM(workgroups, bindings, domain, origin);
    };

    entryInfo["quadrupoleContrib"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":12,"optimizedWorkgroupReductionInits":0};
    function __entry_1_quadrupoleContrib(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_derived = bindings.derived;
        const _b_allForces = bindings.allForces;
        const _b_radState = bindings.radState;
        const _b_reductionBuf = bindings.reductionBuf;
        const wg = Object.create(null);
        wg.sh_comXw = new Float32Array(64);
        wg.sh_comYw = new Float32Array(64);
        wg.sh_mass = new Float32Array(64);
        wg.sh_ke = new Float32Array(64);
        wg.sh_d3Ixx = new Float32Array(64);
        wg.sh_d3Ixy = new Float32Array(64);
        wg.sh_d3Iyy = new Float32Array(64);
        wg.sh_d3Qxx = new Float32Array(64);
        wg.sh_d3Qxy = new Float32Array(64);
        wg.sh_d3Qyy = new Float32Array(64);
        wg.sh_totalD3I = new Float32Array(64);
        wg.sh_totalD3Q = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_comXw.fill(0);
            wg.sh_comYw.fill(0);
            wg.sh_mass.fill(0);
            wg.sh_ke.fill(0);
            wg.sh_d3Ixx.fill(0);
            wg.sh_d3Ixy.fill(0);
            wg.sh_d3Iyy.fill(0);
            wg.sh_d3Qxx.fill(0);
            wg.sh_d3Qxy.fill(0);
            wg.sh_d3Qyy.fill(0);
            wg.sh_totalD3I.fill(0);
            wg.sh_totalD3Q.fill(0);
            const wgid_x = wgx;
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    const lid_x = lx;
                    {
                        const i = gid_x;
                        const localId = lid_x;
                        const numWG = (((_u_u_aliveCount + 63)) / 64);
                        let comXw = 0.0;
                        let comYw = 0.0;
                        let totalMass = 0.0;
                        for (let wg = 0; (wg < numWG); wg++) {
                            const base = (wg * 4);
                            comXw = (comXw + _b_reductionBuf[base]);
                            comYw = (comYw + _b_reductionBuf[(base + 1)]);
                            totalMass = (totalMass + _b_reductionBuf[(base + 2)]);
                        }
                        let comX = 0.0;
                        let comY = 0.0;
                        if ((totalMass > EPSILON)) {
                            comX = (comXw / totalMass);
                            comY = (comYw / totalMass);
                        }
                        const alive = ((i < _u_u_aliveCount) && (((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) != 0));
                        const gravOn = (((_u_u_toggles0 & GRAVITY_BIT)) != 0);
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        const gwQuad = gravOn;
                        const emQuad = coulombOn;
                        let d3I_xx = 0.0;
                        let d3I_xy = 0.0;
                        let d3I_yy = 0.0;
                        let d3Q_xx = 0.0;
                        let d3Q_xy = 0.0;
                        let d3Q_yy = 0.0;
                        let contribI = 0.0;
                        let contribQ = 0.0;
                        if (alive) {
                            const wx = _b_particles[((i) * 9 + 2)];
                            const wy = _b_particles[((i) * 9 + 3)];
                            const wSq = ((wx * wx) + (wy * wy));
                            const invGamma = (1.0 / Math.sqrt((1.0 + wSq)));
                            const vx = (wx * invGamma);
                            const vy = (wy * invGamma);
                            const x = (_b_particles[((i) * 9 + 0)] - comX);
                            const y = (_b_particles[((i) * 9 + 1)] - comY);
                            const Fx = _b_allForces[((i) * 40 + 36) + 0];
                            const Fy = _b_allForces[((i) * 40 + 36) + 1];
                            const Jx = _b_allForces[((i) * 40 + 38) + 0];
                            const Jy = _b_allForces[((i) * 40 + 38) + 1];
                            if (gwQuad) {
                                const d3I_xx_i = (((6.0 * vx) * Fx) + ((2.0 * x) * Jx));
                                const d3I_xy_i = ((((Jx * y) + ((3.0 * Fx) * vy)) + ((3.0 * vx) * Fy)) + (x * Jy));
                                const d3I_yy_i = (((6.0 * vy) * Fy) + ((2.0 * y) * Jy));
                                d3I_xx = d3I_xx_i;
                                d3I_xy = d3I_xy_i;
                                d3I_yy = d3I_yy_i;
                                contribI = (((d3I_xx_i * d3I_xx_i) + ((2.0 * d3I_xy_i) * d3I_xy_i)) + (d3I_yy_i * d3I_yy_i));
                            }
                            if (emQuad) {
                                const qm = (_b_particles[((i) * 9 + 5)] * _b_derived[((i) * 8 + 2)]);
                                const d3Q_xx_i = (qm * ((((6.0 * vx) * Fx) + ((2.0 * x) * Jx))));
                                const d3Q_xy_i = (qm * (((((Jx * y) + ((3.0 * Fx) * vy)) + ((3.0 * vx) * Fy)) + (x * Jy))));
                                const d3Q_yy_i = (qm * ((((6.0 * vy) * Fy) + ((2.0 * y) * Jy))));
                                d3Q_xx = d3Q_xx_i;
                                d3Q_xy = d3Q_xy_i;
                                d3Q_yy = d3Q_yy_i;
                                contribQ = (((d3Q_xx_i * d3Q_xx_i) + ((2.0 * d3Q_xy_i) * d3Q_xy_i)) + (d3Q_yy_i * d3Q_yy_i));
                            }
                            const _sroa_0_base = ((i) * 12);
                            let rsW_radAccum = _b_radState[_sroa_0_base + 0];
                            let rsW_hawkAccum = _b_radState[_sroa_0_base + 1];
                            let rsW_yukawaRadAccum = _b_radState[_sroa_0_base + 2];
                            let rsW_radDisplayX = _b_radState[_sroa_0_base + 3];
                            let rsW_radDisplayY = _b_radState[_sroa_0_base + 4];
                            let rsW_quadAccum = _b_radState[_sroa_0_base + 5];
                            let rsW_emQuadAccum = _b_radState[_sroa_0_base + 6];
                            let rsW_d3IContrib = _b_radState[_sroa_0_base + 7];
                            let rsW_d3QContrib = _b_radState[_sroa_0_base + 8];
                            let rsW_schwingerAccum = _b_radState[_sroa_0_base + 9];
                            let rsW__pad1 = _b_radState[_sroa_0_base + 10];
                            let rsW__pad2 = _b_radState[_sroa_0_base + 11];
                            rsW_d3IContrib = contribI;
                            rsW_d3QContrib = contribQ;
                            {
                                const _wbase = ((i) * 12);
                                _b_radState[_wbase + 0] = rsW_radAccum;
                                _b_radState[_wbase + 1] = rsW_hawkAccum;
                                _b_radState[_wbase + 2] = rsW_yukawaRadAccum;
                                _b_radState[_wbase + 3] = rsW_radDisplayX;
                                _b_radState[_wbase + 4] = rsW_radDisplayY;
                                _b_radState[_wbase + 5] = rsW_quadAccum;
                                _b_radState[_wbase + 6] = rsW_emQuadAccum;
                                _b_radState[_wbase + 7] = rsW_d3IContrib;
                                _b_radState[_wbase + 8] = rsW_d3QContrib;
                                _b_radState[_wbase + 9] = rsW_schwingerAccum;
                                _b_radState[_wbase + 10] = rsW__pad1;
                                _b_radState[_wbase + 11] = rsW__pad2;
                            }
                        }
                        wg.sh_d3Ixx[((localId))] = d3I_xx;
                        wg.sh_d3Ixy[((localId))] = d3I_xy;
                        wg.sh_d3Iyy[((localId))] = d3I_yy;
                        wg.sh_d3Qxx[((localId))] = d3Q_xx;
                        wg.sh_d3Qxy[((localId))] = d3Q_xy;
                        wg.sh_d3Qyy[((localId))] = d3Q_yy;
                        wg.sh_totalD3I[((localId))] = contribI;
                        wg.sh_totalD3Q[((localId))] = contribQ;
                        workgroupReduce8(localId);
                        if ((localId == 0)) {
                            const base = ((MAX_QUAD_WG * 4) + (wgid_x * 8));
                            _b_reductionBuf[base] = wg.sh_d3Ixx[((0))];
                            _b_reductionBuf[(base + 1)] = wg.sh_d3Ixy[((0))];
                            _b_reductionBuf[(base + 2)] = wg.sh_d3Iyy[((0))];
                            _b_reductionBuf[(base + 3)] = wg.sh_d3Qxx[((0))];
                            _b_reductionBuf[(base + 4)] = wg.sh_d3Qxy[((0))];
                            _b_reductionBuf[(base + 5)] = wg.sh_d3Qyy[((0))];
                            _b_reductionBuf[(base + 6)] = wg.sh_totalD3I[((0))];
                            _b_reductionBuf[(base + 7)] = wg.sh_totalD3Q[((0))];
                        }
                    }
                }
            }
        }
    }
    entry["quadrupoleContrib"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_quadrupoleContrib(workgroups, bindings, domain, origin);
    };

    entryInfo["quadrupoleApply"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":12,"optimizedWorkgroupReductionInits":0};
    function __entry_2_quadrupoleApply(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_allForces = bindings.allForces;
        const _b_radState = bindings.radState;
        const _b_photons = bindings.photons;
        const _b_phCount = bindings.phCount;
        const _b_reductionBuf = bindings.reductionBuf;
        const wg = Object.create(null);
        wg.sh_comXw = new Float32Array(64);
        wg.sh_comYw = new Float32Array(64);
        wg.sh_mass = new Float32Array(64);
        wg.sh_ke = new Float32Array(64);
        wg.sh_d3Ixx = new Float32Array(64);
        wg.sh_d3Ixy = new Float32Array(64);
        wg.sh_d3Iyy = new Float32Array(64);
        wg.sh_d3Qxx = new Float32Array(64);
        wg.sh_d3Qxy = new Float32Array(64);
        wg.sh_d3Qyy = new Float32Array(64);
        wg.sh_totalD3I = new Float32Array(64);
        wg.sh_totalD3Q = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.sh_comXw.fill(0);
            wg.sh_comYw.fill(0);
            wg.sh_mass.fill(0);
            wg.sh_ke.fill(0);
            wg.sh_d3Ixx.fill(0);
            wg.sh_d3Ixy.fill(0);
            wg.sh_d3Iyy.fill(0);
            wg.sh_d3Qxx.fill(0);
            wg.sh_d3Qxy.fill(0);
            wg.sh_d3Qyy.fill(0);
            wg.sh_totalD3I.fill(0);
            wg.sh_totalD3Q.fill(0);
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const gid_x = wgx*Lx + lx;
                    __invocation: {
                        const i = gid_x;
                        if ((i >= _u_u_aliveCount)) {
                            break __invocation;
                        }
                        if ((((_b_particles[((i) * 9 + 8)] & FLAG_ALIVE)) == 0)) {
                            break __invocation;
                        }
                        const numWG = (((_u_u_aliveCount + 63)) / 64);
                        const gravOn = (((_u_u_toggles0 & GRAVITY_BIT)) != 0);
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        const gwQuad = gravOn;
                        const emQuad = coulombOn;
                        let totalKE = 0.0;
                        for (let wg = 0; (wg < numWG); wg++) {
                            totalKE = (totalKE + _b_reductionBuf[((wg * 4) + 3)]);
                        }
                        let d3Ixx = 0.0;
                        let d3Ixy = 0.0;
                        let d3Iyy = 0.0;
                        let d3Qxx = 0.0;
                        let d3Qxy = 0.0;
                        let d3Qyy = 0.0;
                        let totalD3I = 0.0;
                        let totalD3Q = 0.0;
                        for (let wg = 0; (wg < numWG); wg++) {
                            const base = ((MAX_QUAD_WG * 4) + (wg * 8));
                            d3Ixx = (d3Ixx + _b_reductionBuf[base]);
                            d3Ixy = (d3Ixy + _b_reductionBuf[(base + 1)]);
                            d3Iyy = (d3Iyy + _b_reductionBuf[(base + 2)]);
                            d3Qxx = (d3Qxx + _b_reductionBuf[(base + 3)]);
                            d3Qxy = (d3Qxy + _b_reductionBuf[(base + 4)]);
                            d3Qyy = (d3Qyy + _b_reductionBuf[(base + 5)]);
                            totalD3I = (totalD3I + _b_reductionBuf[(base + 6)]);
                            totalD3Q = (totalD3Q + _b_reductionBuf[(base + 7)]);
                        }
                        const trI = (d3Ixx + d3Iyy);
                        const d3Ixx_tf = (d3Ixx - (trI / 3.0));
                        const d3Iyy_tf = (d3Iyy - (trI / 3.0));
                        const gwPower = (gwQuad ? (0.2 * ((((d3Ixx_tf * d3Ixx_tf) + ((2.0 * d3Ixy) * d3Ixy)) + (d3Iyy_tf * d3Iyy_tf)))) : 0.0);
                        const emPower = (emQuad ? ((0.005555555555555556) * ((((d3Qxx * d3Qxx) + ((2.0 * d3Qxy) * d3Qxy)) + (d3Qyy * d3Qyy)))) : 0.0);
                        const quadPower = (gwPower + emPower);
                        if (((quadPower <= 0.0) || (totalKE <= EPSILON))) {
                            break __invocation;
                        }
                        const dt = PHYSICS_DT;
                        const dE = (quadPower * dt);
                        const gwFrac = (gwPower / quadPower);
                        const gwDE = (dE * gwFrac);
                        const emDE = (dE - gwDE);
                        const invD3I = ((totalD3I > EPSILON) ? (1.0 / totalD3I) : 0.0);
                        const invD3Q = ((totalD3Q > EPSILON) ? (1.0 / totalD3Q) : 0.0);
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
                        const dKE_gw = ((invD3I > 0.0) ? ((gwDE * rs_d3IContrib) * invD3I) : 0.0);
                        const dKE_em = ((invD3Q > 0.0) ? ((emDE * rs_d3QContrib) * invD3Q) : 0.0);
                        const dKE_i = (dKE_gw + dKE_em);
                        rs_quadAccum = (rs_quadAccum + dKE_gw);
                        rs_emQuadAccum = (rs_emQuadAccum + dKE_em);
                        const wx = _b_particles[((i) * 9 + 2)];
                        const wy = _b_particles[((i) * 9 + 3)];
                        const wSq = ((wx * wx) + (wy * wy));
                        const _sroa_2_base = ((i) * 40);
                        const afBase_f0_x = _b_allForces[_sroa_2_base + 0];
                        const afBase_f0_y = _b_allForces[_sroa_2_base + 1];
                        const afBase_f0_z = _b_allForces[_sroa_2_base + 2];
                        const afBase_f0_w = _b_allForces[_sroa_2_base + 3];
                        const afBase_f1_x = _b_allForces[_sroa_2_base + 4];
                        const afBase_f1_y = _b_allForces[_sroa_2_base + 5];
                        const afBase_f1_z = _b_allForces[_sroa_2_base + 6];
                        const afBase_f1_w = _b_allForces[_sroa_2_base + 7];
                        const afBase_f2_x = _b_allForces[_sroa_2_base + 8];
                        const afBase_f2_y = _b_allForces[_sroa_2_base + 9];
                        const afBase_f2_z = _b_allForces[_sroa_2_base + 10];
                        const afBase_f2_w = _b_allForces[_sroa_2_base + 11];
                        const afBase_f3_x = _b_allForces[_sroa_2_base + 12];
                        const afBase_f3_y = _b_allForces[_sroa_2_base + 13];
                        const afBase_f3_z = _b_allForces[_sroa_2_base + 14];
                        const afBase_f3_w = _b_allForces[_sroa_2_base + 15];
                        const afBase_f4_x = _b_allForces[_sroa_2_base + 16];
                        const afBase_f4_y = _b_allForces[_sroa_2_base + 17];
                        const afBase_f4_z = _b_allForces[_sroa_2_base + 18];
                        const afBase_f4_w = _b_allForces[_sroa_2_base + 19];
                        const afBase_f5_x = _b_allForces[_sroa_2_base + 20];
                        const afBase_f5_y = _b_allForces[_sroa_2_base + 21];
                        const afBase_f5_z = _b_allForces[_sroa_2_base + 22];
                        const afBase_f5_w = _b_allForces[_sroa_2_base + 23];
                        const afBase_torques_x = _b_allForces[_sroa_2_base + 24];
                        const afBase_torques_y = _b_allForces[_sroa_2_base + 25];
                        const afBase_torques_z = _b_allForces[_sroa_2_base + 26];
                        const afBase_torques_w = _b_allForces[_sroa_2_base + 27];
                        const afBase_bFields_x = _b_allForces[_sroa_2_base + 28];
                        const afBase_bFields_y = _b_allForces[_sroa_2_base + 29];
                        const afBase_bFields_z = _b_allForces[_sroa_2_base + 30];
                        const afBase_bFields_w = _b_allForces[_sroa_2_base + 31];
                        const afBase_bFieldGrads_x = _b_allForces[_sroa_2_base + 32];
                        const afBase_bFieldGrads_y = _b_allForces[_sroa_2_base + 33];
                        const afBase_bFieldGrads_z = _b_allForces[_sroa_2_base + 34];
                        const afBase_bFieldGrads_w = _b_allForces[_sroa_2_base + 35];
                        const afBase_totalForce_x = _b_allForces[_sroa_2_base + 36];
                        const afBase_totalForce_y = _b_allForces[_sroa_2_base + 37];
                        const afBase_jerk_x = _b_allForces[_sroa_2_base + 38];
                        const afBase_jerk_y = _b_allForces[_sroa_2_base + 39];
                        if (((dKE_i > 0.0) && (wSq > EPSILON))) {
                            const gamma = Math.sqrt((1.0 + wSq));
                            const KE_i = ((wSq / ((gamma + 1.0))) * _b_particles[((i) * 9 + 4)]);
                            if ((dKE_i >= KE_i)) {
                                rs_radDisplayX = (afBase_f3_x - ((_b_particles[((i) * 9 + 4)] * wx) / dt));
                                rs_radDisplayY = (afBase_f3_y - ((_b_particles[((i) * 9 + 4)] * wy) / dt));
                                {
                                    const _wbase = ((i) * 9 + 2) - 2;
                                    _b_particles[_wbase + 2] = 0.0;
                                }
                                {
                                    const _wbase = ((i) * 9 + 3) - 3;
                                    _b_particles[_wbase + 3] = 0.0;
                                }
                            } else {
                                const gammaNew = (1.0 + (((KE_i - dKE_i)) / _b_particles[((i) * 9 + 4)]));
                                const wSqNew = ((gammaNew * gammaNew) - 1.0);
                                const sc = Math.sqrt((wSqNew / wSq));
                                const dragFactor = (((1.0 - sc)) / dt);
                                rs_radDisplayX = (afBase_f3_x - ((_b_particles[((i) * 9 + 4)] * wx) * dragFactor));
                                rs_radDisplayY = (afBase_f3_y - ((_b_particles[((i) * 9 + 4)] * wy) * dragFactor));
                                const newWx = (wx * sc);
                                const newWy = (wy * sc);
                                if (((newWx == newWx) && (newWy == newWy))) {
                                    {
                                        const _wbase = ((i) * 9 + 2) - 2;
                                        _b_particles[_wbase + 2] = newWx;
                                    }
                                    {
                                        const _wbase = ((i) * 9 + 3) - 3;
                                        _b_particles[_wbase + 3] = newWy;
                                    }
                                }
                            }
                        } else {
                            rs_radDisplayX = afBase_f3_x;
                            rs_radDisplayY = afBase_f3_y;
                        }
                        if ((rs_quadAccum >= MIN_MASS)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const angle = quadSample(d3Ixx, d3Ixy, i, 0);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
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
                                ph_energy = rs_quadAccum;
                                ph_emitterId = _b_particleAux[((i) * 5 + 1)];
                                ph_lifetime = 0.0;
                                ph_flags = 3;
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
                                rs_quadAccum = 0.0;
                            } else {
                                (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_phCount, 0, 1));
                            }
                        }
                        if ((rs_emQuadAccum >= MIN_MASS)) {
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const angle = quadSample(d3Qxx, d3Qxy, i, 1);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
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
                                ph_energy = rs_emQuadAccum;
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
                                rs_emQuadAccum = 0.0;
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
                        afRad_f3_x = rs_radDisplayX;
                        afRad_f3_y = rs_radDisplayY;
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
                    }
                }
            }
        }
    }
    entry["quadrupoleApply"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_quadrupoleApply(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["quadrupoleCoM"] = function (workgroups, domain, origin) {
            return __entry_0_quadrupoleCoM(workgroups, bindings, domain, origin);
        };
        bound["quadrupoleContrib"] = function (workgroups, domain, origin) {
            return __entry_1_quadrupoleContrib(workgroups, bindings, domain, origin);
        };
        bound["quadrupoleApply"] = function (workgroups, domain, origin) {
            return __entry_2_quadrupoleApply(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","particles","particleAux","derived","allForces","radState","photons","phCount","reductionBuf"], entryInfo };
}
