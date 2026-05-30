// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/bosons-tree-walk.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: e49d14b1564e802d2fbde09c009192df8bf43aec2eab68da1424c5eea80e566e
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":213185,"lines":3774,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.779Z
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

    function absorptionRadius(m, q, angW) {
        const bodyR = Math.pow(m, 0.3333333333333333);
        const bodyRSq = (bodyR * bodyR);
        let angVel = angW;
        if ((((bindings.u.toggles0 & RELATIVITY_BIT)) != 0)) {
            const sr = (angW * bodyR);
            angVel = (angW / Math.sqrt((1.0 + (sr * sr))));
        }
        if ((((bindings.u.toggles0 & BLACK_HOLE_BIT)) == 0)) {
            return bodyR;
        }
        const a = ((INERTIA_K * bodyRSq) * Math.abs(angVel));
        const disc = (((m * m) - (a * a)) - (q * q));
        return ((disc >= 0.0) ? (m + Math.sqrt(((0.0) < (disc) ? (disc) : (0.0)))) : m);
    }

    function absorbFourMomentum(j, energy, px, py, charge) {
        const _sroa_0_base = ((j) * 9);
        let p_posX = bindings.particles[_sroa_0_base + 0];
        let p_posY = bindings.particles[_sroa_0_base + 1];
        let p_velWX = bindings.particles[_sroa_0_base + 2];
        let p_velWY = bindings.particles[_sroa_0_base + 3];
        let p_mass = bindings.particles[_sroa_0_base + 4];
        let p_charge = bindings.particles[_sroa_0_base + 5];
        let p_angW = bindings.particles[_sroa_0_base + 6];
        let p_baseMass = bindings.particles[_sroa_0_base + 7];
        let p_flags = bindings.particles[_sroa_0_base + 8];
        if (((p_mass <= EPSILON) || (energy <= EPSILON))) {
            return false;
        }
        const wSq0 = ((p_velWX * p_velWX) + (p_velWY * p_velWY));
        const e0 = (p_mass * Math.sqrt((1.0 + wSq0)));
        const px0 = (p_mass * p_velWX);
        const py0 = (p_mass * p_velWY);
        const e1 = (e0 + energy);
        const px1 = (px0 + px);
        const py1 = (py0 + py);
        const mSq = (((e1 * e1) - (px1 * px1)) - (py1 * py1));
        if ((!((mSq > EPSILON)))) {
            return false;
        }
        const newMass = Math.sqrt(mSq);
        if (((newMass != newMass) || (newMass <= MIN_MASS))) {
            return false;
        }
        p_baseMass = (p_baseMass * ((newMass / p_mass)));
        p_mass = newMass;
        p_charge = (p_charge + charge);
        p_velWX = (px1 / newMass);
        p_velWY = (py1 / newMass);
        {
            const _wbase = ((j) * 9);
            bindings.particles[_wbase + 0] = p_posX;
            bindings.particles[_wbase + 1] = p_posY;
            bindings.particles[_wbase + 2] = p_velWX;
            bindings.particles[_wbase + 3] = p_velWY;
            bindings.particles[_wbase + 4] = p_mass;
            bindings.particles[_wbase + 5] = p_charge;
            bindings.particles[_wbase + 6] = p_angW;
            bindings.particles[_wbase + 7] = p_baseMass;
            bindings.particles[_wbase + 8] = p_flags;
        }
        const _sroa_1_base = ((j) * 5);
        let aux_radius = bindings.particleAux[_sroa_1_base + 0];
        let aux_particleId = bindings.particleAux[_sroa_1_base + 1];
        let aux_deathTime = bindings.particleAux[_sroa_1_base + 2];
        let aux_deathMass = bindings.particleAux[_sroa_1_base + 3];
        let aux_deathAngVel = bindings.particleAux[_sroa_1_base + 4];
        aux_radius = absorptionRadius(newMass, p_charge, p_angW);
        {
            const _wbase = ((j) * 5);
            bindings.particleAux[_wbase + 0] = aux_radius;
            bindings.particleAux[_wbase + 1] = aux_particleId;
            bindings.particleAux[_wbase + 2] = aux_deathTime;
            bindings.particleAux[_wbase + 3] = aux_deathMass;
            bindings.particleAux[_wbase + 4] = aux_deathAngVel;
        }
        return true;
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["updatePhotonsTree"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_updatePhotonsTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _b_nodes = bindings.nodes;
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
                    if ((i >= _b_phCount[0])) {
                        break __invocation;
                    }
                    const _sroa_2_base = ((i) * 8);
                    let ph_posX = _b_photons[_sroa_2_base + 0];
                    let ph_posY = _b_photons[_sroa_2_base + 1];
                    let ph_velX = _b_photons[_sroa_2_base + 2];
                    let ph_velY = _b_photons[_sroa_2_base + 3];
                    let ph_energy = _b_photons[_sroa_2_base + 4];
                    let ph_emitterId = _b_photons[_sroa_2_base + 5];
                    let ph_lifetime = _b_photons[_sroa_2_base + 6];
                    let ph_flags = _b_photons[_sroa_2_base + 7];
                    if ((((ph_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const phPosX = ph_posX;
                    const phPosY = ph_posY;
                    let phVX = ph_velX;
                    let phVY = ph_velY;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
                        let _inl_24_result;
                        _inl_24: {
                            let _inl_24__inl_7_result;
                            _inl_24__inl_7: {
                                _inl_24__inl_7_result = (nIdx * NODE_STRIDE);
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
                                _inl_25__inl_5_result = (nIdx * NODE_STRIDE);
                                break _inl_25__inl_5;
                            }
                            _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                            break _inl_25;
                        }
                        const cx = _inl_25_result;
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_6_result;
                            _inl_26__inl_6: {
                                _inl_26__inl_6_result = (nIdx * NODE_STRIDE);
                                break _inl_26__inl_6;
                            }
                            _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                            break _inl_26;
                        }
                        const cy = _inl_26_result;
                        const dx = (cx - phPosX);
                        const dy = (cy - phPosY);
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_27_result;
                        _inl_27: {
                            let _inl_27__inl_3_result;
                            _inl_27__inl_3: {
                                _inl_27__inl_3_result = (nIdx * NODE_STRIDE);
                                break _inl_27__inl_3;
                            }
                            _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                            break _inl_27;
                        }
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_1_result;
                            _inl_28__inl_1: {
                                _inl_28__inl_1_result = (nIdx * NODE_STRIDE);
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
                                _inl_29__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_29__inl_13;
                            }
                            _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                            break _inl_29;
                        }
                        const isLeaf = (_inl_29_result == NONE);
                        if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            const rSq = (dSq + BOSON_SOFTENING_SQ);
                            const invRSq = (1.0 / rSq);
                            const invR3 = (invRSq * Math.sqrt(invRSq));
                            phVX = (phVX + ((((2.0 * nodeMass) * dx) * invR3) * dt));
                            phVY = (phVY + ((((2.0 * nodeMass) * dy) * invR3) * dt));
                        } else if (((top + 4) <= 48)) {
                            let _inl_30_result;
                            _inl_30: {
                                let _inl_30__inl_13_result;
                                _inl_30__inl_13: {
                                    _inl_30__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_30__inl_13;
                                }
                                _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_13_result + 12)]);
                                break _inl_30;
                            }
                            const nw = _inl_30_result;
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_14_result;
                                _inl_31__inl_14: {
                                    _inl_31__inl_14_result = (nIdx * NODE_STRIDE);
                                    break _inl_31__inl_14;
                                }
                                _inl_31_result = rt.bitcast_i32_u32(_b_nodes[(_inl_31__inl_14_result + 13)]);
                                break _inl_31;
                            }
                            const ne = _inl_31_result;
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_15_result;
                                _inl_32__inl_15: {
                                    _inl_32__inl_15_result = (nIdx * NODE_STRIDE);
                                    break _inl_32__inl_15;
                                }
                                _inl_32_result = rt.bitcast_i32_u32(_b_nodes[(_inl_32__inl_15_result + 14)]);
                                break _inl_32;
                            }
                            const sw = _inl_32_result;
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_16_result;
                                _inl_33__inl_16: {
                                    _inl_33__inl_16_result = (nIdx * NODE_STRIDE);
                                    break _inl_33__inl_16;
                                }
                                _inl_33_result = rt.bitcast_i32_u32(_b_nodes[(_inl_33__inl_16_result + 15)]);
                                break _inl_33;
                            }
                            const se = _inl_33_result;
                            if ((nw != NONE)) {
                                stack[((top) >>> 0)] = ((nw) >>> 0);
                                top++;
                            }
                            if ((ne != NONE)) {
                                stack[((top) >>> 0)] = ((ne) >>> 0);
                                top++;
                            }
                            if ((sw != NONE)) {
                                stack[((top) >>> 0)] = ((sw) >>> 0);
                                top++;
                            }
                            if ((se != NONE)) {
                                stack[((top) >>> 0)] = ((se) >>> 0);
                                top++;
                            }
                        }
                    }
                    const vSq = ((phVX * phVX) + (phVY * phVY));
                    if ((vSq > EPSILON)) {
                        const invV = (1.0 / Math.sqrt(vSq));
                        phVX = (phVX * invV);
                        phVY = (phVY * invV);
                    }
                    if (((phVX != phVX) || (phVY != phVY))) {
                        phVX = 1.0;
                        phVY = 0.0;
                    }
                    ph_velX = phVX;
                    ph_velY = phVY;
                    ph_posX = (ph_posX + (phVX * dt));
                    ph_posY = (ph_posY + (phVY * dt));
                    ph_lifetime = (ph_lifetime + dt);
                    if ((ph_lifetime > PHOTON_LIFETIME)) {
                        ph_flags = (ph_flags & (~1));
                    }
                    {
                        const _wbase = ((i) * 8);
                        _b_photons[_wbase + 0] = ph_posX;
                        _b_photons[_wbase + 1] = ph_posY;
                        _b_photons[_wbase + 2] = ph_velX;
                        _b_photons[_wbase + 3] = ph_velY;
                        _b_photons[_wbase + 4] = ph_energy;
                        _b_photons[_wbase + 5] = ph_emitterId;
                        _b_photons[_wbase + 6] = ph_lifetime;
                        _b_photons[_wbase + 7] = ph_flags;
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
                            if ((i >= _b_phCount[0])) {
                                break __invocation;
                            }
                            const _sroa_3_base = ((i) * 8);
                            let ph_posX = _b_photons[_sroa_3_base + 0];
                            let ph_posY = _b_photons[_sroa_3_base + 1];
                            let ph_velX = _b_photons[_sroa_3_base + 2];
                            let ph_velY = _b_photons[_sroa_3_base + 3];
                            let ph_energy = _b_photons[_sroa_3_base + 4];
                            let ph_emitterId = _b_photons[_sroa_3_base + 5];
                            let ph_lifetime = _b_photons[_sroa_3_base + 6];
                            let ph_flags = _b_photons[_sroa_3_base + 7];
                            if ((((ph_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            const phPosX = ph_posX;
                            const phPosY = ph_posY;
                            let phVX = ph_velX;
                            let phVY = ph_velY;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[((top) >>> 0)];
                                let _inl_24_result;
                                _inl_24: {
                                    let _inl_24__inl_7_result;
                                    _inl_24__inl_7: {
                                        _inl_24__inl_7_result = (nIdx * NODE_STRIDE);
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
                                        _inl_25__inl_5_result = (nIdx * NODE_STRIDE);
                                        break _inl_25__inl_5;
                                    }
                                    _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                                    break _inl_25;
                                }
                                const cx = _inl_25_result;
                                let _inl_26_result;
                                _inl_26: {
                                    let _inl_26__inl_6_result;
                                    _inl_26__inl_6: {
                                        _inl_26__inl_6_result = (nIdx * NODE_STRIDE);
                                        break _inl_26__inl_6;
                                    }
                                    _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                                    break _inl_26;
                                }
                                const cy = _inl_26_result;
                                const dx = (cx - phPosX);
                                const dy = (cy - phPosY);
                                const dSq = ((dx * dx) + (dy * dy));
                                let _inl_27_result;
                                _inl_27: {
                                    let _inl_27__inl_3_result;
                                    _inl_27__inl_3: {
                                        _inl_27__inl_3_result = (nIdx * NODE_STRIDE);
                                        break _inl_27__inl_3;
                                    }
                                    _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                                    break _inl_27;
                                }
                                let _inl_28_result;
                                _inl_28: {
                                    let _inl_28__inl_1_result;
                                    _inl_28__inl_1: {
                                        _inl_28__inl_1_result = (nIdx * NODE_STRIDE);
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
                                        _inl_29__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_29__inl_13;
                                    }
                                    _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                                    break _inl_29;
                                }
                                const isLeaf = (_inl_29_result == NONE);
                                if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                    const rSq = (dSq + BOSON_SOFTENING_SQ);
                                    const invRSq = (1.0 / rSq);
                                    const invR3 = (invRSq * Math.sqrt(invRSq));
                                    phVX = (phVX + ((((2.0 * nodeMass) * dx) * invR3) * dt));
                                    phVY = (phVY + ((((2.0 * nodeMass) * dy) * invR3) * dt));
                                } else if (((top + 4) <= 48)) {
                                    let _inl_30_result;
                                    _inl_30: {
                                        let _inl_30__inl_13_result;
                                        _inl_30__inl_13: {
                                            _inl_30__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_30__inl_13;
                                        }
                                        _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_13_result + 12)]);
                                        break _inl_30;
                                    }
                                    const nw = _inl_30_result;
                                    let _inl_31_result;
                                    _inl_31: {
                                        let _inl_31__inl_14_result;
                                        _inl_31__inl_14: {
                                            _inl_31__inl_14_result = (nIdx * NODE_STRIDE);
                                            break _inl_31__inl_14;
                                        }
                                        _inl_31_result = rt.bitcast_i32_u32(_b_nodes[(_inl_31__inl_14_result + 13)]);
                                        break _inl_31;
                                    }
                                    const ne = _inl_31_result;
                                    let _inl_32_result;
                                    _inl_32: {
                                        let _inl_32__inl_15_result;
                                        _inl_32__inl_15: {
                                            _inl_32__inl_15_result = (nIdx * NODE_STRIDE);
                                            break _inl_32__inl_15;
                                        }
                                        _inl_32_result = rt.bitcast_i32_u32(_b_nodes[(_inl_32__inl_15_result + 14)]);
                                        break _inl_32;
                                    }
                                    const sw = _inl_32_result;
                                    let _inl_33_result;
                                    _inl_33: {
                                        let _inl_33__inl_16_result;
                                        _inl_33__inl_16: {
                                            _inl_33__inl_16_result = (nIdx * NODE_STRIDE);
                                            break _inl_33__inl_16;
                                        }
                                        _inl_33_result = rt.bitcast_i32_u32(_b_nodes[(_inl_33__inl_16_result + 15)]);
                                        break _inl_33;
                                    }
                                    const se = _inl_33_result;
                                    if ((nw != NONE)) {
                                        stack[((top) >>> 0)] = ((nw) >>> 0);
                                        top++;
                                    }
                                    if ((ne != NONE)) {
                                        stack[((top) >>> 0)] = ((ne) >>> 0);
                                        top++;
                                    }
                                    if ((sw != NONE)) {
                                        stack[((top) >>> 0)] = ((sw) >>> 0);
                                        top++;
                                    }
                                    if ((se != NONE)) {
                                        stack[((top) >>> 0)] = ((se) >>> 0);
                                        top++;
                                    }
                                }
                            }
                            const vSq = ((phVX * phVX) + (phVY * phVY));
                            if ((vSq > EPSILON)) {
                                const invV = (1.0 / Math.sqrt(vSq));
                                phVX = (phVX * invV);
                                phVY = (phVY * invV);
                            }
                            if (((phVX != phVX) || (phVY != phVY))) {
                                phVX = 1.0;
                                phVY = 0.0;
                            }
                            ph_velX = phVX;
                            ph_velY = phVY;
                            ph_posX = (ph_posX + (phVX * dt));
                            ph_posY = (ph_posY + (phVY * dt));
                            ph_lifetime = (ph_lifetime + dt);
                            if ((ph_lifetime > PHOTON_LIFETIME)) {
                                ph_flags = (ph_flags & (~1));
                            }
                            {
                                const _wbase = ((i) * 8);
                                _b_photons[_wbase + 0] = ph_posX;
                                _b_photons[_wbase + 1] = ph_posY;
                                _b_photons[_wbase + 2] = ph_velX;
                                _b_photons[_wbase + 3] = ph_velY;
                                _b_photons[_wbase + 4] = ph_energy;
                                _b_photons[_wbase + 5] = ph_emitterId;
                                _b_photons[_wbase + 6] = ph_lifetime;
                                _b_photons[_wbase + 7] = ph_flags;
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
                        if ((i >= _b_phCount[0])) {
                            break __invocation;
                        }
                        const _sroa_4_base = ((i) * 8);
                        let ph_posX = _b_photons[_sroa_4_base + 0];
                        let ph_posY = _b_photons[_sroa_4_base + 1];
                        let ph_velX = _b_photons[_sroa_4_base + 2];
                        let ph_velY = _b_photons[_sroa_4_base + 3];
                        let ph_energy = _b_photons[_sroa_4_base + 4];
                        let ph_emitterId = _b_photons[_sroa_4_base + 5];
                        let ph_lifetime = _b_photons[_sroa_4_base + 6];
                        let ph_flags = _b_photons[_sroa_4_base + 7];
                        if ((((ph_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const phPosX = ph_posX;
                        const phPosY = ph_posY;
                        let phVX = ph_velX;
                        let phVY = ph_velY;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_24_result;
                            _inl_24: {
                                let _inl_24__inl_7_result;
                                _inl_24__inl_7: {
                                    _inl_24__inl_7_result = (nIdx * NODE_STRIDE);
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
                                    _inl_25__inl_5_result = (nIdx * NODE_STRIDE);
                                    break _inl_25__inl_5;
                                }
                                _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                                break _inl_25;
                            }
                            const cx = _inl_25_result;
                            let _inl_26_result;
                            _inl_26: {
                                let _inl_26__inl_6_result;
                                _inl_26__inl_6: {
                                    _inl_26__inl_6_result = (nIdx * NODE_STRIDE);
                                    break _inl_26__inl_6;
                                }
                                _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                                break _inl_26;
                            }
                            const cy = _inl_26_result;
                            const dx = (cx - phPosX);
                            const dy = (cy - phPosY);
                            const dSq = ((dx * dx) + (dy * dy));
                            let _inl_27_result;
                            _inl_27: {
                                let _inl_27__inl_3_result;
                                _inl_27__inl_3: {
                                    _inl_27__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_27__inl_3;
                                }
                                _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                                break _inl_27;
                            }
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_1_result;
                                _inl_28__inl_1: {
                                    _inl_28__inl_1_result = (nIdx * NODE_STRIDE);
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
                                    _inl_29__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_29__inl_13;
                                }
                                _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                                break _inl_29;
                            }
                            const isLeaf = (_inl_29_result == NONE);
                            if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                const rSq = (dSq + BOSON_SOFTENING_SQ);
                                const invRSq = (1.0 / rSq);
                                const invR3 = (invRSq * Math.sqrt(invRSq));
                                phVX = (phVX + ((((2.0 * nodeMass) * dx) * invR3) * dt));
                                phVY = (phVY + ((((2.0 * nodeMass) * dy) * invR3) * dt));
                            } else if (((top + 4) <= 48)) {
                                let _inl_30_result;
                                _inl_30: {
                                    let _inl_30__inl_13_result;
                                    _inl_30__inl_13: {
                                        _inl_30__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_30__inl_13;
                                    }
                                    _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_13_result + 12)]);
                                    break _inl_30;
                                }
                                const nw = _inl_30_result;
                                let _inl_31_result;
                                _inl_31: {
                                    let _inl_31__inl_14_result;
                                    _inl_31__inl_14: {
                                        _inl_31__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_31__inl_14;
                                    }
                                    _inl_31_result = rt.bitcast_i32_u32(_b_nodes[(_inl_31__inl_14_result + 13)]);
                                    break _inl_31;
                                }
                                const ne = _inl_31_result;
                                let _inl_32_result;
                                _inl_32: {
                                    let _inl_32__inl_15_result;
                                    _inl_32__inl_15: {
                                        _inl_32__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_32__inl_15;
                                    }
                                    _inl_32_result = rt.bitcast_i32_u32(_b_nodes[(_inl_32__inl_15_result + 14)]);
                                    break _inl_32;
                                }
                                const sw = _inl_32_result;
                                let _inl_33_result;
                                _inl_33: {
                                    let _inl_33__inl_16_result;
                                    _inl_33__inl_16: {
                                        _inl_33__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_33__inl_16;
                                    }
                                    _inl_33_result = rt.bitcast_i32_u32(_b_nodes[(_inl_33__inl_16_result + 15)]);
                                    break _inl_33;
                                }
                                const se = _inl_33_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                        const vSq = ((phVX * phVX) + (phVY * phVY));
                        if ((vSq > EPSILON)) {
                            const invV = (1.0 / Math.sqrt(vSq));
                            phVX = (phVX * invV);
                            phVY = (phVY * invV);
                        }
                        if (((phVX != phVX) || (phVY != phVY))) {
                            phVX = 1.0;
                            phVY = 0.0;
                        }
                        ph_velX = phVX;
                        ph_velY = phVY;
                        ph_posX = (ph_posX + (phVX * dt));
                        ph_posY = (ph_posY + (phVY * dt));
                        ph_lifetime = (ph_lifetime + dt);
                        if ((ph_lifetime > PHOTON_LIFETIME)) {
                            ph_flags = (ph_flags & (~1));
                        }
                        {
                            const _wbase = ((i) * 8);
                            _b_photons[_wbase + 0] = ph_posX;
                            _b_photons[_wbase + 1] = ph_posY;
                            _b_photons[_wbase + 2] = ph_velX;
                            _b_photons[_wbase + 3] = ph_velY;
                            _b_photons[_wbase + 4] = ph_energy;
                            _b_photons[_wbase + 5] = ph_emitterId;
                            _b_photons[_wbase + 6] = ph_lifetime;
                            _b_photons[_wbase + 7] = ph_flags;
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
                    if ((i >= _b_phCount[0])) {
                        break __invocation;
                    }
                    const _sroa_5_base = ((i) * 8);
                    let ph_posX = _b_photons[_sroa_5_base + 0];
                    let ph_posY = _b_photons[_sroa_5_base + 1];
                    let ph_velX = _b_photons[_sroa_5_base + 2];
                    let ph_velY = _b_photons[_sroa_5_base + 3];
                    let ph_energy = _b_photons[_sroa_5_base + 4];
                    let ph_emitterId = _b_photons[_sroa_5_base + 5];
                    let ph_lifetime = _b_photons[_sroa_5_base + 6];
                    let ph_flags = _b_photons[_sroa_5_base + 7];
                    if ((((ph_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const phPosX = ph_posX;
                    const phPosY = ph_posY;
                    let phVX = ph_velX;
                    let phVY = ph_velY;
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
                        let _inl_24_result;
                        _inl_24: {
                            let _inl_24__inl_7_result;
                            _inl_24__inl_7: {
                                _inl_24__inl_7_result = (nIdx * NODE_STRIDE);
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
                                _inl_25__inl_5_result = (nIdx * NODE_STRIDE);
                                break _inl_25__inl_5;
                            }
                            _inl_25_result = rt.bitcast_f32_u32(_b_nodes[(_inl_25__inl_5_result + 4)]);
                            break _inl_25;
                        }
                        const cx = _inl_25_result;
                        let _inl_26_result;
                        _inl_26: {
                            let _inl_26__inl_6_result;
                            _inl_26__inl_6: {
                                _inl_26__inl_6_result = (nIdx * NODE_STRIDE);
                                break _inl_26__inl_6;
                            }
                            _inl_26_result = rt.bitcast_f32_u32(_b_nodes[(_inl_26__inl_6_result + 5)]);
                            break _inl_26;
                        }
                        const cy = _inl_26_result;
                        const dx = (cx - phPosX);
                        const dy = (cy - phPosY);
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_27_result;
                        _inl_27: {
                            let _inl_27__inl_3_result;
                            _inl_27__inl_3: {
                                _inl_27__inl_3_result = (nIdx * NODE_STRIDE);
                                break _inl_27__inl_3;
                            }
                            _inl_27_result = rt.bitcast_f32_u32(_b_nodes[(_inl_27__inl_3_result + 2)]);
                            break _inl_27;
                        }
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_1_result;
                            _inl_28__inl_1: {
                                _inl_28__inl_1_result = (nIdx * NODE_STRIDE);
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
                                _inl_29__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_29__inl_13;
                            }
                            _inl_29_result = rt.bitcast_i32_u32(_b_nodes[(_inl_29__inl_13_result + 12)]);
                            break _inl_29;
                        }
                        const isLeaf = (_inl_29_result == NONE);
                        if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            const rSq = (dSq + BOSON_SOFTENING_SQ);
                            const invRSq = (1.0 / rSq);
                            const invR3 = (invRSq * Math.sqrt(invRSq));
                            phVX = (phVX + ((((2.0 * nodeMass) * dx) * invR3) * dt));
                            phVY = (phVY + ((((2.0 * nodeMass) * dy) * invR3) * dt));
                        } else if (((top + 4) <= 48)) {
                            let _inl_30_result;
                            _inl_30: {
                                let _inl_30__inl_13_result;
                                _inl_30__inl_13: {
                                    _inl_30__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_30__inl_13;
                                }
                                _inl_30_result = rt.bitcast_i32_u32(_b_nodes[(_inl_30__inl_13_result + 12)]);
                                break _inl_30;
                            }
                            const nw = _inl_30_result;
                            let _inl_31_result;
                            _inl_31: {
                                let _inl_31__inl_14_result;
                                _inl_31__inl_14: {
                                    _inl_31__inl_14_result = (nIdx * NODE_STRIDE);
                                    break _inl_31__inl_14;
                                }
                                _inl_31_result = rt.bitcast_i32_u32(_b_nodes[(_inl_31__inl_14_result + 13)]);
                                break _inl_31;
                            }
                            const ne = _inl_31_result;
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_15_result;
                                _inl_32__inl_15: {
                                    _inl_32__inl_15_result = (nIdx * NODE_STRIDE);
                                    break _inl_32__inl_15;
                                }
                                _inl_32_result = rt.bitcast_i32_u32(_b_nodes[(_inl_32__inl_15_result + 14)]);
                                break _inl_32;
                            }
                            const sw = _inl_32_result;
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_16_result;
                                _inl_33__inl_16: {
                                    _inl_33__inl_16_result = (nIdx * NODE_STRIDE);
                                    break _inl_33__inl_16;
                                }
                                _inl_33_result = rt.bitcast_i32_u32(_b_nodes[(_inl_33__inl_16_result + 15)]);
                                break _inl_33;
                            }
                            const se = _inl_33_result;
                            if ((nw != NONE)) {
                                stack[((top) >>> 0)] = ((nw) >>> 0);
                                top++;
                            }
                            if ((ne != NONE)) {
                                stack[((top) >>> 0)] = ((ne) >>> 0);
                                top++;
                            }
                            if ((sw != NONE)) {
                                stack[((top) >>> 0)] = ((sw) >>> 0);
                                top++;
                            }
                            if ((se != NONE)) {
                                stack[((top) >>> 0)] = ((se) >>> 0);
                                top++;
                            }
                        }
                    }
                    const vSq = ((phVX * phVX) + (phVY * phVY));
                    if ((vSq > EPSILON)) {
                        const invV = (1.0 / Math.sqrt(vSq));
                        phVX = (phVX * invV);
                        phVY = (phVY * invV);
                    }
                    if (((phVX != phVX) || (phVY != phVY))) {
                        phVX = 1.0;
                        phVY = 0.0;
                    }
                    ph_velX = phVX;
                    ph_velY = phVY;
                    ph_posX = (ph_posX + (phVX * dt));
                    ph_posY = (ph_posY + (phVY * dt));
                    ph_lifetime = (ph_lifetime + dt);
                    if ((ph_lifetime > PHOTON_LIFETIME)) {
                        ph_flags = (ph_flags & (~1));
                    }
                    {
                        const _wbase = ((i) * 8);
                        _b_photons[_wbase + 0] = ph_posX;
                        _b_photons[_wbase + 1] = ph_posY;
                        _b_photons[_wbase + 2] = ph_velX;
                        _b_photons[_wbase + 3] = ph_velY;
                        _b_photons[_wbase + 4] = ph_energy;
                        _b_photons[_wbase + 5] = ph_emitterId;
                        _b_photons[_wbase + 6] = ph_lifetime;
                        _b_photons[_wbase + 7] = ph_flags;
                    }
                }
            }
        }
    }
    entry["updatePhotonsTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_updatePhotonsTree(workgroups, bindings, domain, origin);
    };

    entryInfo["updatePionsTree"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_updatePionsTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_toggles0 = _b_u.toggles0;
        const _b_nodes = bindings.nodes;
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
                    if ((i >= _b_piCount[0])) {
                        break __invocation;
                    }
                    const _sroa_6_base = ((i) * 12);
                    let pi_posX = _b_pions[_sroa_6_base + 0];
                    let pi_posY = _b_pions[_sroa_6_base + 1];
                    let pi_wX = _b_pions[_sroa_6_base + 2];
                    let pi_wY = _b_pions[_sroa_6_base + 3];
                    let pi_mass = _b_pions[_sroa_6_base + 4];
                    let pi_charge = _b_pions[_sroa_6_base + 5];
                    let pi_energy = _b_pions[_sroa_6_base + 6];
                    let pi_emitterId = _b_pions[_sroa_6_base + 7];
                    let pi_age = _b_pions[_sroa_6_base + 8];
                    let pi_flags = _b_pions[_sroa_6_base + 9];
                    let pi_kind = _b_pions[_sroa_6_base + 10];
                    let pi__pad1 = _b_pions[_sroa_6_base + 11];
                    if ((((pi_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const piPosX = pi_posX;
                    const piPosY = pi_posY;
                    let piWX = pi_wX;
                    let piWY = pi_wY;
                    const wSq = ((piWX * piWX) + (piWY * piWY));
                    const gamma = Math.sqrt((1.0 + wSq));
                    const vSq = (wSq / (((gamma * gamma)) < (EPSILON) ? (EPSILON) : ((gamma * gamma))));
                    const grFactor = (1.0 + vSq);
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const piCharge = pi_charge;
                    const coulombScale = ((coulombOn && (Math.abs(piCharge) > EPSILON)) ? ((-piCharge) * dt) : 0.0);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
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
                        const nodeMass = _inl_34_result;
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
                        const nodeCharge = _inl_35_result;
                        const skip = ((nodeMass < EPSILON) && (((nodeCharge == 0.0) || (coulombScale == 0.0))));
                        if (skip) {
                            continue;
                        }
                        let _inl_36_result;
                        _inl_36: {
                            let _inl_36__inl_5_result;
                            _inl_36__inl_5: {
                                _inl_36__inl_5_result = (nIdx * NODE_STRIDE);
                                break _inl_36__inl_5;
                            }
                            _inl_36_result = rt.bitcast_f32_u32(_b_nodes[(_inl_36__inl_5_result + 4)]);
                            break _inl_36;
                        }
                        const cx = _inl_36_result;
                        let _inl_37_result;
                        _inl_37: {
                            let _inl_37__inl_6_result;
                            _inl_37__inl_6: {
                                _inl_37__inl_6_result = (nIdx * NODE_STRIDE);
                                break _inl_37__inl_6;
                            }
                            _inl_37_result = rt.bitcast_f32_u32(_b_nodes[(_inl_37__inl_6_result + 5)]);
                            break _inl_37;
                        }
                        const cy = _inl_37_result;
                        const dx = (cx - piPosX);
                        const dy = (cy - piPosY);
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_38_result;
                        _inl_38: {
                            let _inl_38__inl_3_result;
                            _inl_38__inl_3: {
                                _inl_38__inl_3_result = (nIdx * NODE_STRIDE);
                                break _inl_38__inl_3;
                            }
                            _inl_38_result = rt.bitcast_f32_u32(_b_nodes[(_inl_38__inl_3_result + 2)]);
                            break _inl_38;
                        }
                        let _inl_39_result;
                        _inl_39: {
                            let _inl_39__inl_1_result;
                            _inl_39__inl_1: {
                                _inl_39__inl_1_result = (nIdx * NODE_STRIDE);
                                break _inl_39__inl_1;
                            }
                            _inl_39_result = rt.bitcast_f32_u32(_b_nodes[_inl_39__inl_1_result]);
                            break _inl_39;
                        }
                        const size = (_inl_38_result - _inl_39_result);
                        let _inl_40_result;
                        _inl_40: {
                            let _inl_40__inl_13_result;
                            _inl_40__inl_13: {
                                _inl_40__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_40__inl_13;
                            }
                            _inl_40_result = rt.bitcast_i32_u32(_b_nodes[(_inl_40__inl_13_result + 12)]);
                            break _inl_40;
                        }
                        const isLeaf = (_inl_40_result == NONE);
                        if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            const rSq = (dSq + BOSON_SOFTENING_SQ);
                            const invRSq = (1.0 / rSq);
                            const invR3 = (invRSq * Math.sqrt(invRSq));
                            piWX = (piWX + ((((grFactor * nodeMass) * dx) * invR3) * dt));
                            piWY = (piWY + ((((grFactor * nodeMass) * dy) * invR3) * dt));
                            if (((coulombScale != 0.0) && (nodeCharge != 0.0))) {
                                const fC = ((coulombScale * nodeCharge) * invR3);
                                piWX = (piWX + (fC * dx));
                                piWY = (piWY + (fC * dy));
                            }
                        } else if (((top + 4) <= 48)) {
                            let _inl_41_result;
                            _inl_41: {
                                let _inl_41__inl_13_result;
                                _inl_41__inl_13: {
                                    _inl_41__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_41__inl_13;
                                }
                                _inl_41_result = rt.bitcast_i32_u32(_b_nodes[(_inl_41__inl_13_result + 12)]);
                                break _inl_41;
                            }
                            const nw = _inl_41_result;
                            let _inl_42_result;
                            _inl_42: {
                                let _inl_42__inl_14_result;
                                _inl_42__inl_14: {
                                    _inl_42__inl_14_result = (nIdx * NODE_STRIDE);
                                    break _inl_42__inl_14;
                                }
                                _inl_42_result = rt.bitcast_i32_u32(_b_nodes[(_inl_42__inl_14_result + 13)]);
                                break _inl_42;
                            }
                            const ne = _inl_42_result;
                            let _inl_43_result;
                            _inl_43: {
                                let _inl_43__inl_15_result;
                                _inl_43__inl_15: {
                                    _inl_43__inl_15_result = (nIdx * NODE_STRIDE);
                                    break _inl_43__inl_15;
                                }
                                _inl_43_result = rt.bitcast_i32_u32(_b_nodes[(_inl_43__inl_15_result + 14)]);
                                break _inl_43;
                            }
                            const sw = _inl_43_result;
                            let _inl_44_result;
                            _inl_44: {
                                let _inl_44__inl_16_result;
                                _inl_44__inl_16: {
                                    _inl_44__inl_16_result = (nIdx * NODE_STRIDE);
                                    break _inl_44__inl_16;
                                }
                                _inl_44_result = rt.bitcast_i32_u32(_b_nodes[(_inl_44__inl_16_result + 15)]);
                                break _inl_44;
                            }
                            const se = _inl_44_result;
                            if ((nw != NONE)) {
                                stack[((top) >>> 0)] = ((nw) >>> 0);
                                top++;
                            }
                            if ((ne != NONE)) {
                                stack[((top) >>> 0)] = ((ne) >>> 0);
                                top++;
                            }
                            if ((sw != NONE)) {
                                stack[((top) >>> 0)] = ((sw) >>> 0);
                                top++;
                            }
                            if ((se != NONE)) {
                                stack[((top) >>> 0)] = ((se) >>> 0);
                                top++;
                            }
                        }
                    }
                    if (((piWX != piWX) || (piWY != piWY))) {
                        piWX = 0.0;
                        piWY = 0.0;
                    }
                    const gamma2 = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                    const invGamma2 = (1.0 / gamma2);
                    const velX = (piWX * invGamma2);
                    const velY = (piWY * invGamma2);
                    pi_wX = piWX;
                    pi_wY = piWY;
                    pi_posX = (pi_posX + (velX * dt));
                    pi_posY = (pi_posY + (velY * dt));
                    pi_age = (pi_age + 1);
                    if ((pi_kind == 1)) {
                        pi_energy = (pi_energy + dt);
                        if ((pi_energy > LEPTON_LIFETIME)) {
                            pi_flags = (pi_flags & (~1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
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
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        __invocation: {
                            const i = gid_x;
                            if ((i >= _b_piCount[0])) {
                                break __invocation;
                            }
                            const _sroa_7_base = ((i) * 12);
                            let pi_posX = _b_pions[_sroa_7_base + 0];
                            let pi_posY = _b_pions[_sroa_7_base + 1];
                            let pi_wX = _b_pions[_sroa_7_base + 2];
                            let pi_wY = _b_pions[_sroa_7_base + 3];
                            let pi_mass = _b_pions[_sroa_7_base + 4];
                            let pi_charge = _b_pions[_sroa_7_base + 5];
                            let pi_energy = _b_pions[_sroa_7_base + 6];
                            let pi_emitterId = _b_pions[_sroa_7_base + 7];
                            let pi_age = _b_pions[_sroa_7_base + 8];
                            let pi_flags = _b_pions[_sroa_7_base + 9];
                            let pi_kind = _b_pions[_sroa_7_base + 10];
                            let pi__pad1 = _b_pions[_sroa_7_base + 11];
                            if ((((pi_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            const piPosX = pi_posX;
                            const piPosY = pi_posY;
                            let piWX = pi_wX;
                            let piWY = pi_wY;
                            const wSq = ((piWX * piWX) + (piWY * piWY));
                            const gamma = Math.sqrt((1.0 + wSq));
                            const vSq = (wSq / (((gamma * gamma)) < (EPSILON) ? (EPSILON) : ((gamma * gamma))));
                            const grFactor = (1.0 + vSq);
                            const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                            const piCharge = pi_charge;
                            const coulombScale = ((coulombOn && (Math.abs(piCharge) > EPSILON)) ? ((-piCharge) * dt) : 0.0);
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            while ((top > 0)) {
                                top--;
                                const nIdx = stack[((top) >>> 0)];
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
                                const nodeMass = _inl_34_result;
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
                                const nodeCharge = _inl_35_result;
                                const skip = ((nodeMass < EPSILON) && (((nodeCharge == 0.0) || (coulombScale == 0.0))));
                                if (skip) {
                                    continue;
                                }
                                let _inl_36_result;
                                _inl_36: {
                                    let _inl_36__inl_5_result;
                                    _inl_36__inl_5: {
                                        _inl_36__inl_5_result = (nIdx * NODE_STRIDE);
                                        break _inl_36__inl_5;
                                    }
                                    _inl_36_result = rt.bitcast_f32_u32(_b_nodes[(_inl_36__inl_5_result + 4)]);
                                    break _inl_36;
                                }
                                const cx = _inl_36_result;
                                let _inl_37_result;
                                _inl_37: {
                                    let _inl_37__inl_6_result;
                                    _inl_37__inl_6: {
                                        _inl_37__inl_6_result = (nIdx * NODE_STRIDE);
                                        break _inl_37__inl_6;
                                    }
                                    _inl_37_result = rt.bitcast_f32_u32(_b_nodes[(_inl_37__inl_6_result + 5)]);
                                    break _inl_37;
                                }
                                const cy = _inl_37_result;
                                const dx = (cx - piPosX);
                                const dy = (cy - piPosY);
                                const dSq = ((dx * dx) + (dy * dy));
                                let _inl_38_result;
                                _inl_38: {
                                    let _inl_38__inl_3_result;
                                    _inl_38__inl_3: {
                                        _inl_38__inl_3_result = (nIdx * NODE_STRIDE);
                                        break _inl_38__inl_3;
                                    }
                                    _inl_38_result = rt.bitcast_f32_u32(_b_nodes[(_inl_38__inl_3_result + 2)]);
                                    break _inl_38;
                                }
                                let _inl_39_result;
                                _inl_39: {
                                    let _inl_39__inl_1_result;
                                    _inl_39__inl_1: {
                                        _inl_39__inl_1_result = (nIdx * NODE_STRIDE);
                                        break _inl_39__inl_1;
                                    }
                                    _inl_39_result = rt.bitcast_f32_u32(_b_nodes[_inl_39__inl_1_result]);
                                    break _inl_39;
                                }
                                const size = (_inl_38_result - _inl_39_result);
                                let _inl_40_result;
                                _inl_40: {
                                    let _inl_40__inl_13_result;
                                    _inl_40__inl_13: {
                                        _inl_40__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_40__inl_13;
                                    }
                                    _inl_40_result = rt.bitcast_i32_u32(_b_nodes[(_inl_40__inl_13_result + 12)]);
                                    break _inl_40;
                                }
                                const isLeaf = (_inl_40_result == NONE);
                                if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                    const rSq = (dSq + BOSON_SOFTENING_SQ);
                                    const invRSq = (1.0 / rSq);
                                    const invR3 = (invRSq * Math.sqrt(invRSq));
                                    piWX = (piWX + ((((grFactor * nodeMass) * dx) * invR3) * dt));
                                    piWY = (piWY + ((((grFactor * nodeMass) * dy) * invR3) * dt));
                                    if (((coulombScale != 0.0) && (nodeCharge != 0.0))) {
                                        const fC = ((coulombScale * nodeCharge) * invR3);
                                        piWX = (piWX + (fC * dx));
                                        piWY = (piWY + (fC * dy));
                                    }
                                } else if (((top + 4) <= 48)) {
                                    let _inl_41_result;
                                    _inl_41: {
                                        let _inl_41__inl_13_result;
                                        _inl_41__inl_13: {
                                            _inl_41__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_41__inl_13;
                                        }
                                        _inl_41_result = rt.bitcast_i32_u32(_b_nodes[(_inl_41__inl_13_result + 12)]);
                                        break _inl_41;
                                    }
                                    const nw = _inl_41_result;
                                    let _inl_42_result;
                                    _inl_42: {
                                        let _inl_42__inl_14_result;
                                        _inl_42__inl_14: {
                                            _inl_42__inl_14_result = (nIdx * NODE_STRIDE);
                                            break _inl_42__inl_14;
                                        }
                                        _inl_42_result = rt.bitcast_i32_u32(_b_nodes[(_inl_42__inl_14_result + 13)]);
                                        break _inl_42;
                                    }
                                    const ne = _inl_42_result;
                                    let _inl_43_result;
                                    _inl_43: {
                                        let _inl_43__inl_15_result;
                                        _inl_43__inl_15: {
                                            _inl_43__inl_15_result = (nIdx * NODE_STRIDE);
                                            break _inl_43__inl_15;
                                        }
                                        _inl_43_result = rt.bitcast_i32_u32(_b_nodes[(_inl_43__inl_15_result + 14)]);
                                        break _inl_43;
                                    }
                                    const sw = _inl_43_result;
                                    let _inl_44_result;
                                    _inl_44: {
                                        let _inl_44__inl_16_result;
                                        _inl_44__inl_16: {
                                            _inl_44__inl_16_result = (nIdx * NODE_STRIDE);
                                            break _inl_44__inl_16;
                                        }
                                        _inl_44_result = rt.bitcast_i32_u32(_b_nodes[(_inl_44__inl_16_result + 15)]);
                                        break _inl_44;
                                    }
                                    const se = _inl_44_result;
                                    if ((nw != NONE)) {
                                        stack[((top) >>> 0)] = ((nw) >>> 0);
                                        top++;
                                    }
                                    if ((ne != NONE)) {
                                        stack[((top) >>> 0)] = ((ne) >>> 0);
                                        top++;
                                    }
                                    if ((sw != NONE)) {
                                        stack[((top) >>> 0)] = ((sw) >>> 0);
                                        top++;
                                    }
                                    if ((se != NONE)) {
                                        stack[((top) >>> 0)] = ((se) >>> 0);
                                        top++;
                                    }
                                }
                            }
                            if (((piWX != piWX) || (piWY != piWY))) {
                                piWX = 0.0;
                                piWY = 0.0;
                            }
                            const gamma2 = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                            const invGamma2 = (1.0 / gamma2);
                            const velX = (piWX * invGamma2);
                            const velY = (piWY * invGamma2);
                            pi_wX = piWX;
                            pi_wY = piWY;
                            pi_posX = (pi_posX + (velX * dt));
                            pi_posY = (pi_posY + (velY * dt));
                            pi_age = (pi_age + 1);
                            if ((pi_kind == 1)) {
                                pi_energy = (pi_energy + dt);
                                if ((pi_energy > LEPTON_LIFETIME)) {
                                    pi_flags = (pi_flags & (~1));
                                }
                            }
                            {
                                const _wbase = ((i) * 12);
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
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    __invocation: {
                        const i = gid_x;
                        if ((i >= _b_piCount[0])) {
                            break __invocation;
                        }
                        const _sroa_8_base = ((i) * 12);
                        let pi_posX = _b_pions[_sroa_8_base + 0];
                        let pi_posY = _b_pions[_sroa_8_base + 1];
                        let pi_wX = _b_pions[_sroa_8_base + 2];
                        let pi_wY = _b_pions[_sroa_8_base + 3];
                        let pi_mass = _b_pions[_sroa_8_base + 4];
                        let pi_charge = _b_pions[_sroa_8_base + 5];
                        let pi_energy = _b_pions[_sroa_8_base + 6];
                        let pi_emitterId = _b_pions[_sroa_8_base + 7];
                        let pi_age = _b_pions[_sroa_8_base + 8];
                        let pi_flags = _b_pions[_sroa_8_base + 9];
                        let pi_kind = _b_pions[_sroa_8_base + 10];
                        let pi__pad1 = _b_pions[_sroa_8_base + 11];
                        if ((((pi_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const piPosX = pi_posX;
                        const piPosY = pi_posY;
                        let piWX = pi_wX;
                        let piWY = pi_wY;
                        const wSq = ((piWX * piWX) + (piWY * piWY));
                        const gamma = Math.sqrt((1.0 + wSq));
                        const vSq = (wSq / (((gamma * gamma)) < (EPSILON) ? (EPSILON) : ((gamma * gamma))));
                        const grFactor = (1.0 + vSq);
                        const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                        const piCharge = pi_charge;
                        const coulombScale = ((coulombOn && (Math.abs(piCharge) > EPSILON)) ? ((-piCharge) * dt) : 0.0);
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        while ((top > 0)) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
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
                            const nodeMass = _inl_34_result;
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
                            const nodeCharge = _inl_35_result;
                            const skip = ((nodeMass < EPSILON) && (((nodeCharge == 0.0) || (coulombScale == 0.0))));
                            if (skip) {
                                continue;
                            }
                            let _inl_36_result;
                            _inl_36: {
                                let _inl_36__inl_5_result;
                                _inl_36__inl_5: {
                                    _inl_36__inl_5_result = (nIdx * NODE_STRIDE);
                                    break _inl_36__inl_5;
                                }
                                _inl_36_result = rt.bitcast_f32_u32(_b_nodes[(_inl_36__inl_5_result + 4)]);
                                break _inl_36;
                            }
                            const cx = _inl_36_result;
                            let _inl_37_result;
                            _inl_37: {
                                let _inl_37__inl_6_result;
                                _inl_37__inl_6: {
                                    _inl_37__inl_6_result = (nIdx * NODE_STRIDE);
                                    break _inl_37__inl_6;
                                }
                                _inl_37_result = rt.bitcast_f32_u32(_b_nodes[(_inl_37__inl_6_result + 5)]);
                                break _inl_37;
                            }
                            const cy = _inl_37_result;
                            const dx = (cx - piPosX);
                            const dy = (cy - piPosY);
                            const dSq = ((dx * dx) + (dy * dy));
                            let _inl_38_result;
                            _inl_38: {
                                let _inl_38__inl_3_result;
                                _inl_38__inl_3: {
                                    _inl_38__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_38__inl_3;
                                }
                                _inl_38_result = rt.bitcast_f32_u32(_b_nodes[(_inl_38__inl_3_result + 2)]);
                                break _inl_38;
                            }
                            let _inl_39_result;
                            _inl_39: {
                                let _inl_39__inl_1_result;
                                _inl_39__inl_1: {
                                    _inl_39__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_39__inl_1;
                                }
                                _inl_39_result = rt.bitcast_f32_u32(_b_nodes[_inl_39__inl_1_result]);
                                break _inl_39;
                            }
                            const size = (_inl_38_result - _inl_39_result);
                            let _inl_40_result;
                            _inl_40: {
                                let _inl_40__inl_13_result;
                                _inl_40__inl_13: {
                                    _inl_40__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_40__inl_13;
                                }
                                _inl_40_result = rt.bitcast_i32_u32(_b_nodes[(_inl_40__inl_13_result + 12)]);
                                break _inl_40;
                            }
                            const isLeaf = (_inl_40_result == NONE);
                            if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                                const rSq = (dSq + BOSON_SOFTENING_SQ);
                                const invRSq = (1.0 / rSq);
                                const invR3 = (invRSq * Math.sqrt(invRSq));
                                piWX = (piWX + ((((grFactor * nodeMass) * dx) * invR3) * dt));
                                piWY = (piWY + ((((grFactor * nodeMass) * dy) * invR3) * dt));
                                if (((coulombScale != 0.0) && (nodeCharge != 0.0))) {
                                    const fC = ((coulombScale * nodeCharge) * invR3);
                                    piWX = (piWX + (fC * dx));
                                    piWY = (piWY + (fC * dy));
                                }
                            } else if (((top + 4) <= 48)) {
                                let _inl_41_result;
                                _inl_41: {
                                    let _inl_41__inl_13_result;
                                    _inl_41__inl_13: {
                                        _inl_41__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_41__inl_13;
                                    }
                                    _inl_41_result = rt.bitcast_i32_u32(_b_nodes[(_inl_41__inl_13_result + 12)]);
                                    break _inl_41;
                                }
                                const nw = _inl_41_result;
                                let _inl_42_result;
                                _inl_42: {
                                    let _inl_42__inl_14_result;
                                    _inl_42__inl_14: {
                                        _inl_42__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_42__inl_14;
                                    }
                                    _inl_42_result = rt.bitcast_i32_u32(_b_nodes[(_inl_42__inl_14_result + 13)]);
                                    break _inl_42;
                                }
                                const ne = _inl_42_result;
                                let _inl_43_result;
                                _inl_43: {
                                    let _inl_43__inl_15_result;
                                    _inl_43__inl_15: {
                                        _inl_43__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_43__inl_15;
                                    }
                                    _inl_43_result = rt.bitcast_i32_u32(_b_nodes[(_inl_43__inl_15_result + 14)]);
                                    break _inl_43;
                                }
                                const sw = _inl_43_result;
                                let _inl_44_result;
                                _inl_44: {
                                    let _inl_44__inl_16_result;
                                    _inl_44__inl_16: {
                                        _inl_44__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_44__inl_16;
                                    }
                                    _inl_44_result = rt.bitcast_i32_u32(_b_nodes[(_inl_44__inl_16_result + 15)]);
                                    break _inl_44;
                                }
                                const se = _inl_44_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                        if (((piWX != piWX) || (piWY != piWY))) {
                            piWX = 0.0;
                            piWY = 0.0;
                        }
                        const gamma2 = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                        const invGamma2 = (1.0 / gamma2);
                        const velX = (piWX * invGamma2);
                        const velY = (piWY * invGamma2);
                        pi_wX = piWX;
                        pi_wY = piWY;
                        pi_posX = (pi_posX + (velX * dt));
                        pi_posY = (pi_posY + (velY * dt));
                        pi_age = (pi_age + 1);
                        if ((pi_kind == 1)) {
                            pi_energy = (pi_energy + dt);
                            if ((pi_energy > LEPTON_LIFETIME)) {
                                pi_flags = (pi_flags & (~1));
                            }
                        }
                        {
                            const _wbase = ((i) * 12);
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
                    if ((i >= _b_piCount[0])) {
                        break __invocation;
                    }
                    const _sroa_9_base = ((i) * 12);
                    let pi_posX = _b_pions[_sroa_9_base + 0];
                    let pi_posY = _b_pions[_sroa_9_base + 1];
                    let pi_wX = _b_pions[_sroa_9_base + 2];
                    let pi_wY = _b_pions[_sroa_9_base + 3];
                    let pi_mass = _b_pions[_sroa_9_base + 4];
                    let pi_charge = _b_pions[_sroa_9_base + 5];
                    let pi_energy = _b_pions[_sroa_9_base + 6];
                    let pi_emitterId = _b_pions[_sroa_9_base + 7];
                    let pi_age = _b_pions[_sroa_9_base + 8];
                    let pi_flags = _b_pions[_sroa_9_base + 9];
                    let pi_kind = _b_pions[_sroa_9_base + 10];
                    let pi__pad1 = _b_pions[_sroa_9_base + 11];
                    if ((((pi_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const piPosX = pi_posX;
                    const piPosY = pi_posY;
                    let piWX = pi_wX;
                    let piWY = pi_wY;
                    const wSq = ((piWX * piWX) + (piWY * piWY));
                    const gamma = Math.sqrt((1.0 + wSq));
                    const vSq = (wSq / (((gamma * gamma)) < (EPSILON) ? (EPSILON) : ((gamma * gamma))));
                    const grFactor = (1.0 + vSq);
                    const coulombOn = (((_u_u_toggles0 & COULOMB_BIT)) != 0);
                    const piCharge = pi_charge;
                    const coulombScale = ((coulombOn && (Math.abs(piCharge) > EPSILON)) ? ((-piCharge) * dt) : 0.0);
                    let stack = Array.from({ length: 48 }, () => 0);
                    let top = 0;
                    stack[0] = 0;
                    top = 1;
                    while ((top > 0)) {
                        top--;
                        const nIdx = stack[((top) >>> 0)];
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
                        const nodeMass = _inl_34_result;
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
                        const nodeCharge = _inl_35_result;
                        const skip = ((nodeMass < EPSILON) && (((nodeCharge == 0.0) || (coulombScale == 0.0))));
                        if (skip) {
                            continue;
                        }
                        let _inl_36_result;
                        _inl_36: {
                            let _inl_36__inl_5_result;
                            _inl_36__inl_5: {
                                _inl_36__inl_5_result = (nIdx * NODE_STRIDE);
                                break _inl_36__inl_5;
                            }
                            _inl_36_result = rt.bitcast_f32_u32(_b_nodes[(_inl_36__inl_5_result + 4)]);
                            break _inl_36;
                        }
                        const cx = _inl_36_result;
                        let _inl_37_result;
                        _inl_37: {
                            let _inl_37__inl_6_result;
                            _inl_37__inl_6: {
                                _inl_37__inl_6_result = (nIdx * NODE_STRIDE);
                                break _inl_37__inl_6;
                            }
                            _inl_37_result = rt.bitcast_f32_u32(_b_nodes[(_inl_37__inl_6_result + 5)]);
                            break _inl_37;
                        }
                        const cy = _inl_37_result;
                        const dx = (cx - piPosX);
                        const dy = (cy - piPosY);
                        const dSq = ((dx * dx) + (dy * dy));
                        let _inl_38_result;
                        _inl_38: {
                            let _inl_38__inl_3_result;
                            _inl_38__inl_3: {
                                _inl_38__inl_3_result = (nIdx * NODE_STRIDE);
                                break _inl_38__inl_3;
                            }
                            _inl_38_result = rt.bitcast_f32_u32(_b_nodes[(_inl_38__inl_3_result + 2)]);
                            break _inl_38;
                        }
                        let _inl_39_result;
                        _inl_39: {
                            let _inl_39__inl_1_result;
                            _inl_39__inl_1: {
                                _inl_39__inl_1_result = (nIdx * NODE_STRIDE);
                                break _inl_39__inl_1;
                            }
                            _inl_39_result = rt.bitcast_f32_u32(_b_nodes[_inl_39__inl_1_result]);
                            break _inl_39;
                        }
                        const size = (_inl_38_result - _inl_39_result);
                        let _inl_40_result;
                        _inl_40: {
                            let _inl_40__inl_13_result;
                            _inl_40__inl_13: {
                                _inl_40__inl_13_result = (nIdx * NODE_STRIDE);
                                break _inl_40__inl_13;
                            }
                            _inl_40_result = rt.bitcast_i32_u32(_b_nodes[(_inl_40__inl_13_result + 12)]);
                            break _inl_40;
                        }
                        const isLeaf = (_inl_40_result == NONE);
                        if ((isLeaf || ((size * size) < (BH_THETA_SQ * dSq)))) {
                            const rSq = (dSq + BOSON_SOFTENING_SQ);
                            const invRSq = (1.0 / rSq);
                            const invR3 = (invRSq * Math.sqrt(invRSq));
                            piWX = (piWX + ((((grFactor * nodeMass) * dx) * invR3) * dt));
                            piWY = (piWY + ((((grFactor * nodeMass) * dy) * invR3) * dt));
                            if (((coulombScale != 0.0) && (nodeCharge != 0.0))) {
                                const fC = ((coulombScale * nodeCharge) * invR3);
                                piWX = (piWX + (fC * dx));
                                piWY = (piWY + (fC * dy));
                            }
                        } else if (((top + 4) <= 48)) {
                            let _inl_41_result;
                            _inl_41: {
                                let _inl_41__inl_13_result;
                                _inl_41__inl_13: {
                                    _inl_41__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_41__inl_13;
                                }
                                _inl_41_result = rt.bitcast_i32_u32(_b_nodes[(_inl_41__inl_13_result + 12)]);
                                break _inl_41;
                            }
                            const nw = _inl_41_result;
                            let _inl_42_result;
                            _inl_42: {
                                let _inl_42__inl_14_result;
                                _inl_42__inl_14: {
                                    _inl_42__inl_14_result = (nIdx * NODE_STRIDE);
                                    break _inl_42__inl_14;
                                }
                                _inl_42_result = rt.bitcast_i32_u32(_b_nodes[(_inl_42__inl_14_result + 13)]);
                                break _inl_42;
                            }
                            const ne = _inl_42_result;
                            let _inl_43_result;
                            _inl_43: {
                                let _inl_43__inl_15_result;
                                _inl_43__inl_15: {
                                    _inl_43__inl_15_result = (nIdx * NODE_STRIDE);
                                    break _inl_43__inl_15;
                                }
                                _inl_43_result = rt.bitcast_i32_u32(_b_nodes[(_inl_43__inl_15_result + 14)]);
                                break _inl_43;
                            }
                            const sw = _inl_43_result;
                            let _inl_44_result;
                            _inl_44: {
                                let _inl_44__inl_16_result;
                                _inl_44__inl_16: {
                                    _inl_44__inl_16_result = (nIdx * NODE_STRIDE);
                                    break _inl_44__inl_16;
                                }
                                _inl_44_result = rt.bitcast_i32_u32(_b_nodes[(_inl_44__inl_16_result + 15)]);
                                break _inl_44;
                            }
                            const se = _inl_44_result;
                            if ((nw != NONE)) {
                                stack[((top) >>> 0)] = ((nw) >>> 0);
                                top++;
                            }
                            if ((ne != NONE)) {
                                stack[((top) >>> 0)] = ((ne) >>> 0);
                                top++;
                            }
                            if ((sw != NONE)) {
                                stack[((top) >>> 0)] = ((sw) >>> 0);
                                top++;
                            }
                            if ((se != NONE)) {
                                stack[((top) >>> 0)] = ((se) >>> 0);
                                top++;
                            }
                        }
                    }
                    if (((piWX != piWX) || (piWY != piWY))) {
                        piWX = 0.0;
                        piWY = 0.0;
                    }
                    const gamma2 = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                    const invGamma2 = (1.0 / gamma2);
                    const velX = (piWX * invGamma2);
                    const velY = (piWY * invGamma2);
                    pi_wX = piWX;
                    pi_wY = piWY;
                    pi_posX = (pi_posX + (velX * dt));
                    pi_posY = (pi_posY + (velY * dt));
                    pi_age = (pi_age + 1);
                    if ((pi_kind == 1)) {
                        pi_energy = (pi_energy + dt);
                        if ((pi_energy > LEPTON_LIFETIME)) {
                            pi_flags = (pi_flags & (~1));
                        }
                    }
                    {
                        const _wbase = ((i) * 12);
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
                }
            }
        }
    }
    entry["updatePionsTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_updatePionsTree(workgroups, bindings, domain, origin);
    };

    entryInfo["absorbPhotonsTree"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_absorbPhotonsTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_nodes = bindings.nodes;
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
                {
                    const count = _b_phCount[0];
                    for (let i = 0; (i < count); i++) {
                        const _sroa_10_base = ((i) * 8);
                        const ph_posX = _b_photons[_sroa_10_base + 0];
                        const ph_posY = _b_photons[_sroa_10_base + 1];
                        const ph_velX = _b_photons[_sroa_10_base + 2];
                        const ph_velY = _b_photons[_sroa_10_base + 3];
                        const ph_energy = _b_photons[_sroa_10_base + 4];
                        const ph_emitterId = _b_photons[_sroa_10_base + 5];
                        const ph_lifetime = _b_photons[_sroa_10_base + 6];
                        const ph_flags = _b_photons[_sroa_10_base + 7];
                        if ((((ph_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((ph_lifetime < BOSON_MIN_AGE_TIME)) {
                            continue;
                        }
                        const phX = ph_posX;
                        const phY = ph_posY;
                        const phEmitterId = ph_emitterId;
                        const phEnergy = ph_energy;
                        const phVelX = ph_velX;
                        const phVelY = ph_velY;
                        const searchR = SOFTENING;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        let absorbed = false;
                        while (((top > 0) && (!absorbed))) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_45_result;
                            _inl_45: {
                                let _inl_45__inl_1_result;
                                _inl_45__inl_1: {
                                    _inl_45__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_45__inl_1;
                                }
                                _inl_45_result = rt.bitcast_f32_u32(_b_nodes[_inl_45__inl_1_result]);
                                break _inl_45;
                            }
                            let _inl_46_result;
                            _inl_46: {
                                let _inl_46__inl_3_result;
                                _inl_46__inl_3: {
                                    _inl_46__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_46__inl_3;
                                }
                                _inl_46_result = rt.bitcast_f32_u32(_b_nodes[(_inl_46__inl_3_result + 2)]);
                                break _inl_46;
                            }
                            let _inl_47_result;
                            _inl_47: {
                                let _inl_47__inl_2_result;
                                _inl_47__inl_2: {
                                    _inl_47__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_47__inl_2;
                                }
                                _inl_47_result = rt.bitcast_f32_u32(_b_nodes[(_inl_47__inl_2_result + 1)]);
                                break _inl_47;
                            }
                            let _inl_48_result;
                            _inl_48: {
                                let _inl_48__inl_4_result;
                                _inl_48__inl_4: {
                                    _inl_48__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_48__inl_4;
                                }
                                _inl_48_result = rt.bitcast_f32_u32(_b_nodes[(_inl_48__inl_4_result + 3)]);
                                break _inl_48;
                            }
                            if ((((((phX + searchR) < _inl_45_result) || ((phX - searchR) > _inl_46_result)) || ((phY + searchR) < _inl_47_result)) || ((phY - searchR) > _inl_48_result))) {
                                continue;
                            }
                            let _inl_49_result;
                            _inl_49: {
                                let _inl_49__inl_13_result;
                                _inl_49__inl_13: {
                                    _inl_49__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_49__inl_13;
                                }
                                _inl_49_result = rt.bitcast_i32_u32(_b_nodes[(_inl_49__inl_13_result + 12)]);
                                break _inl_49;
                            }
                            const isLeaf = (_inl_49_result == NONE);
                            if (isLeaf) {
                                let _inl_50_result;
                                _inl_50: {
                                    let _inl_50__inl_17_result;
                                    _inl_50__inl_17: {
                                        _inl_50__inl_17_result = (nIdx * NODE_STRIDE);
                                        break _inl_50__inl_17;
                                    }
                                    _inl_50_result = rt.bitcast_i32_u32(_b_nodes[(_inl_50__inl_17_result + 16)]);
                                    break _inl_50;
                                }
                                const pIdx = _inl_50_result;
                                if ((pIdx < 0)) {
                                    continue;
                                }
                                const j = ((pIdx) >>> 0);
                                const _sroa_11_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_11_base + 0];
                                const pj_posY = _b_particles[_sroa_11_base + 1];
                                const pj_velWX = _b_particles[_sroa_11_base + 2];
                                const pj_velWY = _b_particles[_sroa_11_base + 3];
                                const pj_mass = _b_particles[_sroa_11_base + 4];
                                const pj_charge = _b_particles[_sroa_11_base + 5];
                                const pj_angW = _b_particles[_sroa_11_base + 6];
                                const pj_baseMass = _b_particles[_sroa_11_base + 7];
                                const pj_flags = _b_particles[_sroa_11_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_12_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_12_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_12_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_12_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_12_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_12_base + 4];
                                if ((auxJ_particleId == phEmitterId)) {
                                    continue;
                                }
                                const dx = (phX - pj_posX);
                                const dy = (phY - pj_posY);
                                if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                    if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                        {
                                            const _wbase = ((i) * 8 + 7) - 7;
                                            _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                        }
                                        absorbed = true;
                                    }
                                }
                            } else if (((top + 4) <= 48)) {
                                let _inl_51_result;
                                _inl_51: {
                                    let _inl_51__inl_13_result;
                                    _inl_51__inl_13: {
                                        _inl_51__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_51__inl_13;
                                    }
                                    _inl_51_result = rt.bitcast_i32_u32(_b_nodes[(_inl_51__inl_13_result + 12)]);
                                    break _inl_51;
                                }
                                const nw = _inl_51_result;
                                let _inl_52_result;
                                _inl_52: {
                                    let _inl_52__inl_14_result;
                                    _inl_52__inl_14: {
                                        _inl_52__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_52__inl_14;
                                    }
                                    _inl_52_result = rt.bitcast_i32_u32(_b_nodes[(_inl_52__inl_14_result + 13)]);
                                    break _inl_52;
                                }
                                const ne = _inl_52_result;
                                let _inl_53_result;
                                _inl_53: {
                                    let _inl_53__inl_15_result;
                                    _inl_53__inl_15: {
                                        _inl_53__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_53__inl_15;
                                    }
                                    _inl_53_result = rt.bitcast_i32_u32(_b_nodes[(_inl_53__inl_15_result + 14)]);
                                    break _inl_53;
                                }
                                const sw = _inl_53_result;
                                let _inl_54_result;
                                _inl_54: {
                                    let _inl_54__inl_16_result;
                                    _inl_54__inl_16: {
                                        _inl_54__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_54__inl_16;
                                    }
                                    _inl_54_result = rt.bitcast_i32_u32(_b_nodes[(_inl_54__inl_16_result + 15)]);
                                    break _inl_54;
                                }
                                const se = _inl_54_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        {
                            const count = _b_phCount[0];
                            for (let i = 0; (i < count); i++) {
                                const _sroa_13_base = ((i) * 8);
                                const ph_posX = _b_photons[_sroa_13_base + 0];
                                const ph_posY = _b_photons[_sroa_13_base + 1];
                                const ph_velX = _b_photons[_sroa_13_base + 2];
                                const ph_velY = _b_photons[_sroa_13_base + 3];
                                const ph_energy = _b_photons[_sroa_13_base + 4];
                                const ph_emitterId = _b_photons[_sroa_13_base + 5];
                                const ph_lifetime = _b_photons[_sroa_13_base + 6];
                                const ph_flags = _b_photons[_sroa_13_base + 7];
                                if ((((ph_flags & 1)) == 0)) {
                                    continue;
                                }
                                if ((ph_lifetime < BOSON_MIN_AGE_TIME)) {
                                    continue;
                                }
                                const phX = ph_posX;
                                const phY = ph_posY;
                                const phEmitterId = ph_emitterId;
                                const phEnergy = ph_energy;
                                const phVelX = ph_velX;
                                const phVelY = ph_velY;
                                const searchR = SOFTENING;
                                let stack = Array.from({ length: 48 }, () => 0);
                                let top = 0;
                                stack[0] = 0;
                                top = 1;
                                let absorbed = false;
                                while (((top > 0) && (!absorbed))) {
                                    top--;
                                    const nIdx = stack[((top) >>> 0)];
                                    let _inl_45_result;
                                    _inl_45: {
                                        let _inl_45__inl_1_result;
                                        _inl_45__inl_1: {
                                            _inl_45__inl_1_result = (nIdx * NODE_STRIDE);
                                            break _inl_45__inl_1;
                                        }
                                        _inl_45_result = rt.bitcast_f32_u32(_b_nodes[_inl_45__inl_1_result]);
                                        break _inl_45;
                                    }
                                    let _inl_46_result;
                                    _inl_46: {
                                        let _inl_46__inl_3_result;
                                        _inl_46__inl_3: {
                                            _inl_46__inl_3_result = (nIdx * NODE_STRIDE);
                                            break _inl_46__inl_3;
                                        }
                                        _inl_46_result = rt.bitcast_f32_u32(_b_nodes[(_inl_46__inl_3_result + 2)]);
                                        break _inl_46;
                                    }
                                    let _inl_47_result;
                                    _inl_47: {
                                        let _inl_47__inl_2_result;
                                        _inl_47__inl_2: {
                                            _inl_47__inl_2_result = (nIdx * NODE_STRIDE);
                                            break _inl_47__inl_2;
                                        }
                                        _inl_47_result = rt.bitcast_f32_u32(_b_nodes[(_inl_47__inl_2_result + 1)]);
                                        break _inl_47;
                                    }
                                    let _inl_48_result;
                                    _inl_48: {
                                        let _inl_48__inl_4_result;
                                        _inl_48__inl_4: {
                                            _inl_48__inl_4_result = (nIdx * NODE_STRIDE);
                                            break _inl_48__inl_4;
                                        }
                                        _inl_48_result = rt.bitcast_f32_u32(_b_nodes[(_inl_48__inl_4_result + 3)]);
                                        break _inl_48;
                                    }
                                    if ((((((phX + searchR) < _inl_45_result) || ((phX - searchR) > _inl_46_result)) || ((phY + searchR) < _inl_47_result)) || ((phY - searchR) > _inl_48_result))) {
                                        continue;
                                    }
                                    let _inl_49_result;
                                    _inl_49: {
                                        let _inl_49__inl_13_result;
                                        _inl_49__inl_13: {
                                            _inl_49__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_49__inl_13;
                                        }
                                        _inl_49_result = rt.bitcast_i32_u32(_b_nodes[(_inl_49__inl_13_result + 12)]);
                                        break _inl_49;
                                    }
                                    const isLeaf = (_inl_49_result == NONE);
                                    if (isLeaf) {
                                        let _inl_50_result;
                                        _inl_50: {
                                            let _inl_50__inl_17_result;
                                            _inl_50__inl_17: {
                                                _inl_50__inl_17_result = (nIdx * NODE_STRIDE);
                                                break _inl_50__inl_17;
                                            }
                                            _inl_50_result = rt.bitcast_i32_u32(_b_nodes[(_inl_50__inl_17_result + 16)]);
                                            break _inl_50;
                                        }
                                        const pIdx = _inl_50_result;
                                        if ((pIdx < 0)) {
                                            continue;
                                        }
                                        const j = ((pIdx) >>> 0);
                                        const _sroa_14_base = ((j) * 9);
                                        const pj_posX = _b_particles[_sroa_14_base + 0];
                                        const pj_posY = _b_particles[_sroa_14_base + 1];
                                        const pj_velWX = _b_particles[_sroa_14_base + 2];
                                        const pj_velWY = _b_particles[_sroa_14_base + 3];
                                        const pj_mass = _b_particles[_sroa_14_base + 4];
                                        const pj_charge = _b_particles[_sroa_14_base + 5];
                                        const pj_angW = _b_particles[_sroa_14_base + 6];
                                        const pj_baseMass = _b_particles[_sroa_14_base + 7];
                                        const pj_flags = _b_particles[_sroa_14_base + 8];
                                        if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                            continue;
                                        }
                                        const _sroa_15_base = ((j) * 5);
                                        const auxJ_radius = _b_particleAux[_sroa_15_base + 0];
                                        const auxJ_particleId = _b_particleAux[_sroa_15_base + 1];
                                        const auxJ_deathTime = _b_particleAux[_sroa_15_base + 2];
                                        const auxJ_deathMass = _b_particleAux[_sroa_15_base + 3];
                                        const auxJ_deathAngVel = _b_particleAux[_sroa_15_base + 4];
                                        if ((auxJ_particleId == phEmitterId)) {
                                            continue;
                                        }
                                        const dx = (phX - pj_posX);
                                        const dy = (phY - pj_posY);
                                        if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                            if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                                {
                                                    const _wbase = ((i) * 8 + 7) - 7;
                                                    _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                                }
                                                absorbed = true;
                                            }
                                        }
                                    } else if (((top + 4) <= 48)) {
                                        let _inl_51_result;
                                        _inl_51: {
                                            let _inl_51__inl_13_result;
                                            _inl_51__inl_13: {
                                                _inl_51__inl_13_result = (nIdx * NODE_STRIDE);
                                                break _inl_51__inl_13;
                                            }
                                            _inl_51_result = rt.bitcast_i32_u32(_b_nodes[(_inl_51__inl_13_result + 12)]);
                                            break _inl_51;
                                        }
                                        const nw = _inl_51_result;
                                        let _inl_52_result;
                                        _inl_52: {
                                            let _inl_52__inl_14_result;
                                            _inl_52__inl_14: {
                                                _inl_52__inl_14_result = (nIdx * NODE_STRIDE);
                                                break _inl_52__inl_14;
                                            }
                                            _inl_52_result = rt.bitcast_i32_u32(_b_nodes[(_inl_52__inl_14_result + 13)]);
                                            break _inl_52;
                                        }
                                        const ne = _inl_52_result;
                                        let _inl_53_result;
                                        _inl_53: {
                                            let _inl_53__inl_15_result;
                                            _inl_53__inl_15: {
                                                _inl_53__inl_15_result = (nIdx * NODE_STRIDE);
                                                break _inl_53__inl_15;
                                            }
                                            _inl_53_result = rt.bitcast_i32_u32(_b_nodes[(_inl_53__inl_15_result + 14)]);
                                            break _inl_53;
                                        }
                                        const sw = _inl_53_result;
                                        let _inl_54_result;
                                        _inl_54: {
                                            let _inl_54__inl_16_result;
                                            _inl_54__inl_16: {
                                                _inl_54__inl_16_result = (nIdx * NODE_STRIDE);
                                                break _inl_54__inl_16;
                                            }
                                            _inl_54_result = rt.bitcast_i32_u32(_b_nodes[(_inl_54__inl_16_result + 15)]);
                                            break _inl_54;
                                        }
                                        const se = _inl_54_result;
                                        if ((nw != NONE)) {
                                            stack[((top) >>> 0)] = ((nw) >>> 0);
                                            top++;
                                        }
                                        if ((ne != NONE)) {
                                            stack[((top) >>> 0)] = ((ne) >>> 0);
                                            top++;
                                        }
                                        if ((sw != NONE)) {
                                            stack[((top) >>> 0)] = ((sw) >>> 0);
                                            top++;
                                        }
                                        if ((se != NONE)) {
                                            stack[((top) >>> 0)] = ((se) >>> 0);
                                            top++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    {
                        const count = _b_phCount[0];
                        for (let i = 0; (i < count); i++) {
                            const _sroa_16_base = ((i) * 8);
                            const ph_posX = _b_photons[_sroa_16_base + 0];
                            const ph_posY = _b_photons[_sroa_16_base + 1];
                            const ph_velX = _b_photons[_sroa_16_base + 2];
                            const ph_velY = _b_photons[_sroa_16_base + 3];
                            const ph_energy = _b_photons[_sroa_16_base + 4];
                            const ph_emitterId = _b_photons[_sroa_16_base + 5];
                            const ph_lifetime = _b_photons[_sroa_16_base + 6];
                            const ph_flags = _b_photons[_sroa_16_base + 7];
                            if ((((ph_flags & 1)) == 0)) {
                                continue;
                            }
                            if ((ph_lifetime < BOSON_MIN_AGE_TIME)) {
                                continue;
                            }
                            const phX = ph_posX;
                            const phY = ph_posY;
                            const phEmitterId = ph_emitterId;
                            const phEnergy = ph_energy;
                            const phVelX = ph_velX;
                            const phVelY = ph_velY;
                            const searchR = SOFTENING;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            let absorbed = false;
                            while (((top > 0) && (!absorbed))) {
                                top--;
                                const nIdx = stack[((top) >>> 0)];
                                let _inl_45_result;
                                _inl_45: {
                                    let _inl_45__inl_1_result;
                                    _inl_45__inl_1: {
                                        _inl_45__inl_1_result = (nIdx * NODE_STRIDE);
                                        break _inl_45__inl_1;
                                    }
                                    _inl_45_result = rt.bitcast_f32_u32(_b_nodes[_inl_45__inl_1_result]);
                                    break _inl_45;
                                }
                                let _inl_46_result;
                                _inl_46: {
                                    let _inl_46__inl_3_result;
                                    _inl_46__inl_3: {
                                        _inl_46__inl_3_result = (nIdx * NODE_STRIDE);
                                        break _inl_46__inl_3;
                                    }
                                    _inl_46_result = rt.bitcast_f32_u32(_b_nodes[(_inl_46__inl_3_result + 2)]);
                                    break _inl_46;
                                }
                                let _inl_47_result;
                                _inl_47: {
                                    let _inl_47__inl_2_result;
                                    _inl_47__inl_2: {
                                        _inl_47__inl_2_result = (nIdx * NODE_STRIDE);
                                        break _inl_47__inl_2;
                                    }
                                    _inl_47_result = rt.bitcast_f32_u32(_b_nodes[(_inl_47__inl_2_result + 1)]);
                                    break _inl_47;
                                }
                                let _inl_48_result;
                                _inl_48: {
                                    let _inl_48__inl_4_result;
                                    _inl_48__inl_4: {
                                        _inl_48__inl_4_result = (nIdx * NODE_STRIDE);
                                        break _inl_48__inl_4;
                                    }
                                    _inl_48_result = rt.bitcast_f32_u32(_b_nodes[(_inl_48__inl_4_result + 3)]);
                                    break _inl_48;
                                }
                                if ((((((phX + searchR) < _inl_45_result) || ((phX - searchR) > _inl_46_result)) || ((phY + searchR) < _inl_47_result)) || ((phY - searchR) > _inl_48_result))) {
                                    continue;
                                }
                                let _inl_49_result;
                                _inl_49: {
                                    let _inl_49__inl_13_result;
                                    _inl_49__inl_13: {
                                        _inl_49__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_49__inl_13;
                                    }
                                    _inl_49_result = rt.bitcast_i32_u32(_b_nodes[(_inl_49__inl_13_result + 12)]);
                                    break _inl_49;
                                }
                                const isLeaf = (_inl_49_result == NONE);
                                if (isLeaf) {
                                    let _inl_50_result;
                                    _inl_50: {
                                        let _inl_50__inl_17_result;
                                        _inl_50__inl_17: {
                                            _inl_50__inl_17_result = (nIdx * NODE_STRIDE);
                                            break _inl_50__inl_17;
                                        }
                                        _inl_50_result = rt.bitcast_i32_u32(_b_nodes[(_inl_50__inl_17_result + 16)]);
                                        break _inl_50;
                                    }
                                    const pIdx = _inl_50_result;
                                    if ((pIdx < 0)) {
                                        continue;
                                    }
                                    const j = ((pIdx) >>> 0);
                                    const _sroa_17_base = ((j) * 9);
                                    const pj_posX = _b_particles[_sroa_17_base + 0];
                                    const pj_posY = _b_particles[_sroa_17_base + 1];
                                    const pj_velWX = _b_particles[_sroa_17_base + 2];
                                    const pj_velWY = _b_particles[_sroa_17_base + 3];
                                    const pj_mass = _b_particles[_sroa_17_base + 4];
                                    const pj_charge = _b_particles[_sroa_17_base + 5];
                                    const pj_angW = _b_particles[_sroa_17_base + 6];
                                    const pj_baseMass = _b_particles[_sroa_17_base + 7];
                                    const pj_flags = _b_particles[_sroa_17_base + 8];
                                    if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                        continue;
                                    }
                                    const _sroa_18_base = ((j) * 5);
                                    const auxJ_radius = _b_particleAux[_sroa_18_base + 0];
                                    const auxJ_particleId = _b_particleAux[_sroa_18_base + 1];
                                    const auxJ_deathTime = _b_particleAux[_sroa_18_base + 2];
                                    const auxJ_deathMass = _b_particleAux[_sroa_18_base + 3];
                                    const auxJ_deathAngVel = _b_particleAux[_sroa_18_base + 4];
                                    if ((auxJ_particleId == phEmitterId)) {
                                        continue;
                                    }
                                    const dx = (phX - pj_posX);
                                    const dy = (phY - pj_posY);
                                    if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                        if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                            {
                                                const _wbase = ((i) * 8 + 7) - 7;
                                                _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                            }
                                            absorbed = true;
                                        }
                                    }
                                } else if (((top + 4) <= 48)) {
                                    let _inl_51_result;
                                    _inl_51: {
                                        let _inl_51__inl_13_result;
                                        _inl_51__inl_13: {
                                            _inl_51__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_51__inl_13;
                                        }
                                        _inl_51_result = rt.bitcast_i32_u32(_b_nodes[(_inl_51__inl_13_result + 12)]);
                                        break _inl_51;
                                    }
                                    const nw = _inl_51_result;
                                    let _inl_52_result;
                                    _inl_52: {
                                        let _inl_52__inl_14_result;
                                        _inl_52__inl_14: {
                                            _inl_52__inl_14_result = (nIdx * NODE_STRIDE);
                                            break _inl_52__inl_14;
                                        }
                                        _inl_52_result = rt.bitcast_i32_u32(_b_nodes[(_inl_52__inl_14_result + 13)]);
                                        break _inl_52;
                                    }
                                    const ne = _inl_52_result;
                                    let _inl_53_result;
                                    _inl_53: {
                                        let _inl_53__inl_15_result;
                                        _inl_53__inl_15: {
                                            _inl_53__inl_15_result = (nIdx * NODE_STRIDE);
                                            break _inl_53__inl_15;
                                        }
                                        _inl_53_result = rt.bitcast_i32_u32(_b_nodes[(_inl_53__inl_15_result + 14)]);
                                        break _inl_53;
                                    }
                                    const sw = _inl_53_result;
                                    let _inl_54_result;
                                    _inl_54: {
                                        let _inl_54__inl_16_result;
                                        _inl_54__inl_16: {
                                            _inl_54__inl_16_result = (nIdx * NODE_STRIDE);
                                            break _inl_54__inl_16;
                                        }
                                        _inl_54_result = rt.bitcast_i32_u32(_b_nodes[(_inl_54__inl_16_result + 15)]);
                                        break _inl_54;
                                    }
                                    const se = _inl_54_result;
                                    if ((nw != NONE)) {
                                        stack[((top) >>> 0)] = ((nw) >>> 0);
                                        top++;
                                    }
                                    if ((ne != NONE)) {
                                        stack[((top) >>> 0)] = ((ne) >>> 0);
                                        top++;
                                    }
                                    if ((sw != NONE)) {
                                        stack[((top) >>> 0)] = ((sw) >>> 0);
                                        top++;
                                    }
                                    if ((se != NONE)) {
                                        stack[((top) >>> 0)] = ((se) >>> 0);
                                        top++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                {
                    const count = _b_phCount[0];
                    for (let i = 0; (i < count); i++) {
                        const _sroa_19_base = ((i) * 8);
                        const ph_posX = _b_photons[_sroa_19_base + 0];
                        const ph_posY = _b_photons[_sroa_19_base + 1];
                        const ph_velX = _b_photons[_sroa_19_base + 2];
                        const ph_velY = _b_photons[_sroa_19_base + 3];
                        const ph_energy = _b_photons[_sroa_19_base + 4];
                        const ph_emitterId = _b_photons[_sroa_19_base + 5];
                        const ph_lifetime = _b_photons[_sroa_19_base + 6];
                        const ph_flags = _b_photons[_sroa_19_base + 7];
                        if ((((ph_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((ph_lifetime < BOSON_MIN_AGE_TIME)) {
                            continue;
                        }
                        const phX = ph_posX;
                        const phY = ph_posY;
                        const phEmitterId = ph_emitterId;
                        const phEnergy = ph_energy;
                        const phVelX = ph_velX;
                        const phVelY = ph_velY;
                        const searchR = SOFTENING;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        let absorbed = false;
                        while (((top > 0) && (!absorbed))) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_45_result;
                            _inl_45: {
                                let _inl_45__inl_1_result;
                                _inl_45__inl_1: {
                                    _inl_45__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_45__inl_1;
                                }
                                _inl_45_result = rt.bitcast_f32_u32(_b_nodes[_inl_45__inl_1_result]);
                                break _inl_45;
                            }
                            let _inl_46_result;
                            _inl_46: {
                                let _inl_46__inl_3_result;
                                _inl_46__inl_3: {
                                    _inl_46__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_46__inl_3;
                                }
                                _inl_46_result = rt.bitcast_f32_u32(_b_nodes[(_inl_46__inl_3_result + 2)]);
                                break _inl_46;
                            }
                            let _inl_47_result;
                            _inl_47: {
                                let _inl_47__inl_2_result;
                                _inl_47__inl_2: {
                                    _inl_47__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_47__inl_2;
                                }
                                _inl_47_result = rt.bitcast_f32_u32(_b_nodes[(_inl_47__inl_2_result + 1)]);
                                break _inl_47;
                            }
                            let _inl_48_result;
                            _inl_48: {
                                let _inl_48__inl_4_result;
                                _inl_48__inl_4: {
                                    _inl_48__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_48__inl_4;
                                }
                                _inl_48_result = rt.bitcast_f32_u32(_b_nodes[(_inl_48__inl_4_result + 3)]);
                                break _inl_48;
                            }
                            if ((((((phX + searchR) < _inl_45_result) || ((phX - searchR) > _inl_46_result)) || ((phY + searchR) < _inl_47_result)) || ((phY - searchR) > _inl_48_result))) {
                                continue;
                            }
                            let _inl_49_result;
                            _inl_49: {
                                let _inl_49__inl_13_result;
                                _inl_49__inl_13: {
                                    _inl_49__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_49__inl_13;
                                }
                                _inl_49_result = rt.bitcast_i32_u32(_b_nodes[(_inl_49__inl_13_result + 12)]);
                                break _inl_49;
                            }
                            const isLeaf = (_inl_49_result == NONE);
                            if (isLeaf) {
                                let _inl_50_result;
                                _inl_50: {
                                    let _inl_50__inl_17_result;
                                    _inl_50__inl_17: {
                                        _inl_50__inl_17_result = (nIdx * NODE_STRIDE);
                                        break _inl_50__inl_17;
                                    }
                                    _inl_50_result = rt.bitcast_i32_u32(_b_nodes[(_inl_50__inl_17_result + 16)]);
                                    break _inl_50;
                                }
                                const pIdx = _inl_50_result;
                                if ((pIdx < 0)) {
                                    continue;
                                }
                                const j = ((pIdx) >>> 0);
                                const _sroa_20_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_20_base + 0];
                                const pj_posY = _b_particles[_sroa_20_base + 1];
                                const pj_velWX = _b_particles[_sroa_20_base + 2];
                                const pj_velWY = _b_particles[_sroa_20_base + 3];
                                const pj_mass = _b_particles[_sroa_20_base + 4];
                                const pj_charge = _b_particles[_sroa_20_base + 5];
                                const pj_angW = _b_particles[_sroa_20_base + 6];
                                const pj_baseMass = _b_particles[_sroa_20_base + 7];
                                const pj_flags = _b_particles[_sroa_20_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_21_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_21_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_21_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_21_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_21_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_21_base + 4];
                                if ((auxJ_particleId == phEmitterId)) {
                                    continue;
                                }
                                const dx = (phX - pj_posX);
                                const dy = (phY - pj_posY);
                                if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                    if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                        {
                                            const _wbase = ((i) * 8 + 7) - 7;
                                            _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                        }
                                        absorbed = true;
                                    }
                                }
                            } else if (((top + 4) <= 48)) {
                                let _inl_51_result;
                                _inl_51: {
                                    let _inl_51__inl_13_result;
                                    _inl_51__inl_13: {
                                        _inl_51__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_51__inl_13;
                                    }
                                    _inl_51_result = rt.bitcast_i32_u32(_b_nodes[(_inl_51__inl_13_result + 12)]);
                                    break _inl_51;
                                }
                                const nw = _inl_51_result;
                                let _inl_52_result;
                                _inl_52: {
                                    let _inl_52__inl_14_result;
                                    _inl_52__inl_14: {
                                        _inl_52__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_52__inl_14;
                                    }
                                    _inl_52_result = rt.bitcast_i32_u32(_b_nodes[(_inl_52__inl_14_result + 13)]);
                                    break _inl_52;
                                }
                                const ne = _inl_52_result;
                                let _inl_53_result;
                                _inl_53: {
                                    let _inl_53__inl_15_result;
                                    _inl_53__inl_15: {
                                        _inl_53__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_53__inl_15;
                                    }
                                    _inl_53_result = rt.bitcast_i32_u32(_b_nodes[(_inl_53__inl_15_result + 14)]);
                                    break _inl_53;
                                }
                                const sw = _inl_53_result;
                                let _inl_54_result;
                                _inl_54: {
                                    let _inl_54__inl_16_result;
                                    _inl_54__inl_16: {
                                        _inl_54__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_54__inl_16;
                                    }
                                    _inl_54_result = rt.bitcast_i32_u32(_b_nodes[(_inl_54__inl_16_result + 15)]);
                                    break _inl_54;
                                }
                                const se = _inl_54_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    entry["absorbPhotonsTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_absorbPhotonsTree(workgroups, bindings, domain, origin);
    };

    entryInfo["absorbPionsTree"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_absorbPionsTree(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
        const _b_nodes = bindings.nodes;
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
                {
                    const count = _b_piCount[0];
                    for (let i = 0; (i < count); i++) {
                        const _sroa_22_base = ((i) * 12);
                        const pi_posX = _b_pions[_sroa_22_base + 0];
                        const pi_posY = _b_pions[_sroa_22_base + 1];
                        const pi_wX = _b_pions[_sroa_22_base + 2];
                        const pi_wY = _b_pions[_sroa_22_base + 3];
                        const pi_mass = _b_pions[_sroa_22_base + 4];
                        const pi_charge = _b_pions[_sroa_22_base + 5];
                        const pi_energy = _b_pions[_sroa_22_base + 6];
                        const pi_emitterId = _b_pions[_sroa_22_base + 7];
                        const pi_age = _b_pions[_sroa_22_base + 8];
                        const pi_flags = _b_pions[_sroa_22_base + 9];
                        const pi_kind = _b_pions[_sroa_22_base + 10];
                        const pi__pad1 = _b_pions[_sroa_22_base + 11];
                        if ((((pi_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((pi_age < BOSON_MIN_AGE)) {
                            continue;
                        }
                        if ((pi_kind != 0)) {
                            continue;
                        }
                        const piX = pi_posX;
                        const piY = pi_posY;
                        const piEmitterId = pi_emitterId;
                        const piWX = pi_wX;
                        const piWY = pi_wY;
                        const piCharge = pi_charge;
                        const gamma = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                        const piEnergy = (pi_mass * gamma);
                        const piPx = (pi_mass * piWX);
                        const piPy = (pi_mass * piWY);
                        const searchR = SOFTENING;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        let absorbed = false;
                        while (((top > 0) && (!absorbed))) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_55_result;
                            _inl_55: {
                                let _inl_55__inl_1_result;
                                _inl_55__inl_1: {
                                    _inl_55__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_55__inl_1;
                                }
                                _inl_55_result = rt.bitcast_f32_u32(_b_nodes[_inl_55__inl_1_result]);
                                break _inl_55;
                            }
                            let _inl_56_result;
                            _inl_56: {
                                let _inl_56__inl_3_result;
                                _inl_56__inl_3: {
                                    _inl_56__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_56__inl_3;
                                }
                                _inl_56_result = rt.bitcast_f32_u32(_b_nodes[(_inl_56__inl_3_result + 2)]);
                                break _inl_56;
                            }
                            let _inl_57_result;
                            _inl_57: {
                                let _inl_57__inl_2_result;
                                _inl_57__inl_2: {
                                    _inl_57__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_57__inl_2;
                                }
                                _inl_57_result = rt.bitcast_f32_u32(_b_nodes[(_inl_57__inl_2_result + 1)]);
                                break _inl_57;
                            }
                            let _inl_58_result;
                            _inl_58: {
                                let _inl_58__inl_4_result;
                                _inl_58__inl_4: {
                                    _inl_58__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_58__inl_4;
                                }
                                _inl_58_result = rt.bitcast_f32_u32(_b_nodes[(_inl_58__inl_4_result + 3)]);
                                break _inl_58;
                            }
                            if ((((((piX + searchR) < _inl_55_result) || ((piX - searchR) > _inl_56_result)) || ((piY + searchR) < _inl_57_result)) || ((piY - searchR) > _inl_58_result))) {
                                continue;
                            }
                            let _inl_59_result;
                            _inl_59: {
                                let _inl_59__inl_13_result;
                                _inl_59__inl_13: {
                                    _inl_59__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_59__inl_13;
                                }
                                _inl_59_result = rt.bitcast_i32_u32(_b_nodes[(_inl_59__inl_13_result + 12)]);
                                break _inl_59;
                            }
                            const isLeaf = (_inl_59_result == NONE);
                            if (isLeaf) {
                                let _inl_60_result;
                                _inl_60: {
                                    let _inl_60__inl_17_result;
                                    _inl_60__inl_17: {
                                        _inl_60__inl_17_result = (nIdx * NODE_STRIDE);
                                        break _inl_60__inl_17;
                                    }
                                    _inl_60_result = rt.bitcast_i32_u32(_b_nodes[(_inl_60__inl_17_result + 16)]);
                                    break _inl_60;
                                }
                                const pIdx = _inl_60_result;
                                if ((pIdx < 0)) {
                                    continue;
                                }
                                const j = ((pIdx) >>> 0);
                                const _sroa_23_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_23_base + 0];
                                const pj_posY = _b_particles[_sroa_23_base + 1];
                                const pj_velWX = _b_particles[_sroa_23_base + 2];
                                const pj_velWY = _b_particles[_sroa_23_base + 3];
                                const pj_mass = _b_particles[_sroa_23_base + 4];
                                const pj_charge = _b_particles[_sroa_23_base + 5];
                                const pj_angW = _b_particles[_sroa_23_base + 6];
                                const pj_baseMass = _b_particles[_sroa_23_base + 7];
                                const pj_flags = _b_particles[_sroa_23_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_24_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_24_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_24_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_24_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_24_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_24_base + 4];
                                if ((auxJ_particleId == piEmitterId)) {
                                    continue;
                                }
                                const dx = (piX - pj_posX);
                                const dy = (piY - pj_posY);
                                if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                    if (absorbFourMomentum(j, piEnergy, piPx, piPy, piCharge)) {
                                        {
                                            const _wbase = ((i) * 12 + 9) - 9;
                                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                        }
                                        absorbed = true;
                                    }
                                }
                            } else if (((top + 4) <= 48)) {
                                let _inl_61_result;
                                _inl_61: {
                                    let _inl_61__inl_13_result;
                                    _inl_61__inl_13: {
                                        _inl_61__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_61__inl_13;
                                    }
                                    _inl_61_result = rt.bitcast_i32_u32(_b_nodes[(_inl_61__inl_13_result + 12)]);
                                    break _inl_61;
                                }
                                const nw = _inl_61_result;
                                let _inl_62_result;
                                _inl_62: {
                                    let _inl_62__inl_14_result;
                                    _inl_62__inl_14: {
                                        _inl_62__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_62__inl_14;
                                    }
                                    _inl_62_result = rt.bitcast_i32_u32(_b_nodes[(_inl_62__inl_14_result + 13)]);
                                    break _inl_62;
                                }
                                const ne = _inl_62_result;
                                let _inl_63_result;
                                _inl_63: {
                                    let _inl_63__inl_15_result;
                                    _inl_63__inl_15: {
                                        _inl_63__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_63__inl_15;
                                    }
                                    _inl_63_result = rt.bitcast_i32_u32(_b_nodes[(_inl_63__inl_15_result + 14)]);
                                    break _inl_63;
                                }
                                const sw = _inl_63_result;
                                let _inl_64_result;
                                _inl_64: {
                                    let _inl_64__inl_16_result;
                                    _inl_64__inl_16: {
                                        _inl_64__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_64__inl_16;
                                    }
                                    _inl_64_result = rt.bitcast_i32_u32(_b_nodes[(_inl_64__inl_16_result + 15)]);
                                    break _inl_64;
                                }
                                const se = _inl_64_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        {
                            const count = _b_piCount[0];
                            for (let i = 0; (i < count); i++) {
                                const _sroa_25_base = ((i) * 12);
                                const pi_posX = _b_pions[_sroa_25_base + 0];
                                const pi_posY = _b_pions[_sroa_25_base + 1];
                                const pi_wX = _b_pions[_sroa_25_base + 2];
                                const pi_wY = _b_pions[_sroa_25_base + 3];
                                const pi_mass = _b_pions[_sroa_25_base + 4];
                                const pi_charge = _b_pions[_sroa_25_base + 5];
                                const pi_energy = _b_pions[_sroa_25_base + 6];
                                const pi_emitterId = _b_pions[_sroa_25_base + 7];
                                const pi_age = _b_pions[_sroa_25_base + 8];
                                const pi_flags = _b_pions[_sroa_25_base + 9];
                                const pi_kind = _b_pions[_sroa_25_base + 10];
                                const pi__pad1 = _b_pions[_sroa_25_base + 11];
                                if ((((pi_flags & 1)) == 0)) {
                                    continue;
                                }
                                if ((pi_age < BOSON_MIN_AGE)) {
                                    continue;
                                }
                                if ((pi_kind != 0)) {
                                    continue;
                                }
                                const piX = pi_posX;
                                const piY = pi_posY;
                                const piEmitterId = pi_emitterId;
                                const piWX = pi_wX;
                                const piWY = pi_wY;
                                const piCharge = pi_charge;
                                const gamma = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                                const piEnergy = (pi_mass * gamma);
                                const piPx = (pi_mass * piWX);
                                const piPy = (pi_mass * piWY);
                                const searchR = SOFTENING;
                                let stack = Array.from({ length: 48 }, () => 0);
                                let top = 0;
                                stack[0] = 0;
                                top = 1;
                                let absorbed = false;
                                while (((top > 0) && (!absorbed))) {
                                    top--;
                                    const nIdx = stack[((top) >>> 0)];
                                    let _inl_55_result;
                                    _inl_55: {
                                        let _inl_55__inl_1_result;
                                        _inl_55__inl_1: {
                                            _inl_55__inl_1_result = (nIdx * NODE_STRIDE);
                                            break _inl_55__inl_1;
                                        }
                                        _inl_55_result = rt.bitcast_f32_u32(_b_nodes[_inl_55__inl_1_result]);
                                        break _inl_55;
                                    }
                                    let _inl_56_result;
                                    _inl_56: {
                                        let _inl_56__inl_3_result;
                                        _inl_56__inl_3: {
                                            _inl_56__inl_3_result = (nIdx * NODE_STRIDE);
                                            break _inl_56__inl_3;
                                        }
                                        _inl_56_result = rt.bitcast_f32_u32(_b_nodes[(_inl_56__inl_3_result + 2)]);
                                        break _inl_56;
                                    }
                                    let _inl_57_result;
                                    _inl_57: {
                                        let _inl_57__inl_2_result;
                                        _inl_57__inl_2: {
                                            _inl_57__inl_2_result = (nIdx * NODE_STRIDE);
                                            break _inl_57__inl_2;
                                        }
                                        _inl_57_result = rt.bitcast_f32_u32(_b_nodes[(_inl_57__inl_2_result + 1)]);
                                        break _inl_57;
                                    }
                                    let _inl_58_result;
                                    _inl_58: {
                                        let _inl_58__inl_4_result;
                                        _inl_58__inl_4: {
                                            _inl_58__inl_4_result = (nIdx * NODE_STRIDE);
                                            break _inl_58__inl_4;
                                        }
                                        _inl_58_result = rt.bitcast_f32_u32(_b_nodes[(_inl_58__inl_4_result + 3)]);
                                        break _inl_58;
                                    }
                                    if ((((((piX + searchR) < _inl_55_result) || ((piX - searchR) > _inl_56_result)) || ((piY + searchR) < _inl_57_result)) || ((piY - searchR) > _inl_58_result))) {
                                        continue;
                                    }
                                    let _inl_59_result;
                                    _inl_59: {
                                        let _inl_59__inl_13_result;
                                        _inl_59__inl_13: {
                                            _inl_59__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_59__inl_13;
                                        }
                                        _inl_59_result = rt.bitcast_i32_u32(_b_nodes[(_inl_59__inl_13_result + 12)]);
                                        break _inl_59;
                                    }
                                    const isLeaf = (_inl_59_result == NONE);
                                    if (isLeaf) {
                                        let _inl_60_result;
                                        _inl_60: {
                                            let _inl_60__inl_17_result;
                                            _inl_60__inl_17: {
                                                _inl_60__inl_17_result = (nIdx * NODE_STRIDE);
                                                break _inl_60__inl_17;
                                            }
                                            _inl_60_result = rt.bitcast_i32_u32(_b_nodes[(_inl_60__inl_17_result + 16)]);
                                            break _inl_60;
                                        }
                                        const pIdx = _inl_60_result;
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
                                        const _sroa_27_base = ((j) * 5);
                                        const auxJ_radius = _b_particleAux[_sroa_27_base + 0];
                                        const auxJ_particleId = _b_particleAux[_sroa_27_base + 1];
                                        const auxJ_deathTime = _b_particleAux[_sroa_27_base + 2];
                                        const auxJ_deathMass = _b_particleAux[_sroa_27_base + 3];
                                        const auxJ_deathAngVel = _b_particleAux[_sroa_27_base + 4];
                                        if ((auxJ_particleId == piEmitterId)) {
                                            continue;
                                        }
                                        const dx = (piX - pj_posX);
                                        const dy = (piY - pj_posY);
                                        if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                            if (absorbFourMomentum(j, piEnergy, piPx, piPy, piCharge)) {
                                                {
                                                    const _wbase = ((i) * 12 + 9) - 9;
                                                    _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                                }
                                                absorbed = true;
                                            }
                                        }
                                    } else if (((top + 4) <= 48)) {
                                        let _inl_61_result;
                                        _inl_61: {
                                            let _inl_61__inl_13_result;
                                            _inl_61__inl_13: {
                                                _inl_61__inl_13_result = (nIdx * NODE_STRIDE);
                                                break _inl_61__inl_13;
                                            }
                                            _inl_61_result = rt.bitcast_i32_u32(_b_nodes[(_inl_61__inl_13_result + 12)]);
                                            break _inl_61;
                                        }
                                        const nw = _inl_61_result;
                                        let _inl_62_result;
                                        _inl_62: {
                                            let _inl_62__inl_14_result;
                                            _inl_62__inl_14: {
                                                _inl_62__inl_14_result = (nIdx * NODE_STRIDE);
                                                break _inl_62__inl_14;
                                            }
                                            _inl_62_result = rt.bitcast_i32_u32(_b_nodes[(_inl_62__inl_14_result + 13)]);
                                            break _inl_62;
                                        }
                                        const ne = _inl_62_result;
                                        let _inl_63_result;
                                        _inl_63: {
                                            let _inl_63__inl_15_result;
                                            _inl_63__inl_15: {
                                                _inl_63__inl_15_result = (nIdx * NODE_STRIDE);
                                                break _inl_63__inl_15;
                                            }
                                            _inl_63_result = rt.bitcast_i32_u32(_b_nodes[(_inl_63__inl_15_result + 14)]);
                                            break _inl_63;
                                        }
                                        const sw = _inl_63_result;
                                        let _inl_64_result;
                                        _inl_64: {
                                            let _inl_64__inl_16_result;
                                            _inl_64__inl_16: {
                                                _inl_64__inl_16_result = (nIdx * NODE_STRIDE);
                                                break _inl_64__inl_16;
                                            }
                                            _inl_64_result = rt.bitcast_i32_u32(_b_nodes[(_inl_64__inl_16_result + 15)]);
                                            break _inl_64;
                                        }
                                        const se = _inl_64_result;
                                        if ((nw != NONE)) {
                                            stack[((top) >>> 0)] = ((nw) >>> 0);
                                            top++;
                                        }
                                        if ((ne != NONE)) {
                                            stack[((top) >>> 0)] = ((ne) >>> 0);
                                            top++;
                                        }
                                        if ((sw != NONE)) {
                                            stack[((top) >>> 0)] = ((sw) >>> 0);
                                            top++;
                                        }
                                        if ((se != NONE)) {
                                            stack[((top) >>> 0)] = ((se) >>> 0);
                                            top++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    {
                        const count = _b_piCount[0];
                        for (let i = 0; (i < count); i++) {
                            const _sroa_28_base = ((i) * 12);
                            const pi_posX = _b_pions[_sroa_28_base + 0];
                            const pi_posY = _b_pions[_sroa_28_base + 1];
                            const pi_wX = _b_pions[_sroa_28_base + 2];
                            const pi_wY = _b_pions[_sroa_28_base + 3];
                            const pi_mass = _b_pions[_sroa_28_base + 4];
                            const pi_charge = _b_pions[_sroa_28_base + 5];
                            const pi_energy = _b_pions[_sroa_28_base + 6];
                            const pi_emitterId = _b_pions[_sroa_28_base + 7];
                            const pi_age = _b_pions[_sroa_28_base + 8];
                            const pi_flags = _b_pions[_sroa_28_base + 9];
                            const pi_kind = _b_pions[_sroa_28_base + 10];
                            const pi__pad1 = _b_pions[_sroa_28_base + 11];
                            if ((((pi_flags & 1)) == 0)) {
                                continue;
                            }
                            if ((pi_age < BOSON_MIN_AGE)) {
                                continue;
                            }
                            if ((pi_kind != 0)) {
                                continue;
                            }
                            const piX = pi_posX;
                            const piY = pi_posY;
                            const piEmitterId = pi_emitterId;
                            const piWX = pi_wX;
                            const piWY = pi_wY;
                            const piCharge = pi_charge;
                            const gamma = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                            const piEnergy = (pi_mass * gamma);
                            const piPx = (pi_mass * piWX);
                            const piPy = (pi_mass * piWY);
                            const searchR = SOFTENING;
                            let stack = Array.from({ length: 48 }, () => 0);
                            let top = 0;
                            stack[0] = 0;
                            top = 1;
                            let absorbed = false;
                            while (((top > 0) && (!absorbed))) {
                                top--;
                                const nIdx = stack[((top) >>> 0)];
                                let _inl_55_result;
                                _inl_55: {
                                    let _inl_55__inl_1_result;
                                    _inl_55__inl_1: {
                                        _inl_55__inl_1_result = (nIdx * NODE_STRIDE);
                                        break _inl_55__inl_1;
                                    }
                                    _inl_55_result = rt.bitcast_f32_u32(_b_nodes[_inl_55__inl_1_result]);
                                    break _inl_55;
                                }
                                let _inl_56_result;
                                _inl_56: {
                                    let _inl_56__inl_3_result;
                                    _inl_56__inl_3: {
                                        _inl_56__inl_3_result = (nIdx * NODE_STRIDE);
                                        break _inl_56__inl_3;
                                    }
                                    _inl_56_result = rt.bitcast_f32_u32(_b_nodes[(_inl_56__inl_3_result + 2)]);
                                    break _inl_56;
                                }
                                let _inl_57_result;
                                _inl_57: {
                                    let _inl_57__inl_2_result;
                                    _inl_57__inl_2: {
                                        _inl_57__inl_2_result = (nIdx * NODE_STRIDE);
                                        break _inl_57__inl_2;
                                    }
                                    _inl_57_result = rt.bitcast_f32_u32(_b_nodes[(_inl_57__inl_2_result + 1)]);
                                    break _inl_57;
                                }
                                let _inl_58_result;
                                _inl_58: {
                                    let _inl_58__inl_4_result;
                                    _inl_58__inl_4: {
                                        _inl_58__inl_4_result = (nIdx * NODE_STRIDE);
                                        break _inl_58__inl_4;
                                    }
                                    _inl_58_result = rt.bitcast_f32_u32(_b_nodes[(_inl_58__inl_4_result + 3)]);
                                    break _inl_58;
                                }
                                if ((((((piX + searchR) < _inl_55_result) || ((piX - searchR) > _inl_56_result)) || ((piY + searchR) < _inl_57_result)) || ((piY - searchR) > _inl_58_result))) {
                                    continue;
                                }
                                let _inl_59_result;
                                _inl_59: {
                                    let _inl_59__inl_13_result;
                                    _inl_59__inl_13: {
                                        _inl_59__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_59__inl_13;
                                    }
                                    _inl_59_result = rt.bitcast_i32_u32(_b_nodes[(_inl_59__inl_13_result + 12)]);
                                    break _inl_59;
                                }
                                const isLeaf = (_inl_59_result == NONE);
                                if (isLeaf) {
                                    let _inl_60_result;
                                    _inl_60: {
                                        let _inl_60__inl_17_result;
                                        _inl_60__inl_17: {
                                            _inl_60__inl_17_result = (nIdx * NODE_STRIDE);
                                            break _inl_60__inl_17;
                                        }
                                        _inl_60_result = rt.bitcast_i32_u32(_b_nodes[(_inl_60__inl_17_result + 16)]);
                                        break _inl_60;
                                    }
                                    const pIdx = _inl_60_result;
                                    if ((pIdx < 0)) {
                                        continue;
                                    }
                                    const j = ((pIdx) >>> 0);
                                    const _sroa_29_base = ((j) * 9);
                                    const pj_posX = _b_particles[_sroa_29_base + 0];
                                    const pj_posY = _b_particles[_sroa_29_base + 1];
                                    const pj_velWX = _b_particles[_sroa_29_base + 2];
                                    const pj_velWY = _b_particles[_sroa_29_base + 3];
                                    const pj_mass = _b_particles[_sroa_29_base + 4];
                                    const pj_charge = _b_particles[_sroa_29_base + 5];
                                    const pj_angW = _b_particles[_sroa_29_base + 6];
                                    const pj_baseMass = _b_particles[_sroa_29_base + 7];
                                    const pj_flags = _b_particles[_sroa_29_base + 8];
                                    if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                        continue;
                                    }
                                    const _sroa_30_base = ((j) * 5);
                                    const auxJ_radius = _b_particleAux[_sroa_30_base + 0];
                                    const auxJ_particleId = _b_particleAux[_sroa_30_base + 1];
                                    const auxJ_deathTime = _b_particleAux[_sroa_30_base + 2];
                                    const auxJ_deathMass = _b_particleAux[_sroa_30_base + 3];
                                    const auxJ_deathAngVel = _b_particleAux[_sroa_30_base + 4];
                                    if ((auxJ_particleId == piEmitterId)) {
                                        continue;
                                    }
                                    const dx = (piX - pj_posX);
                                    const dy = (piY - pj_posY);
                                    if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                        if (absorbFourMomentum(j, piEnergy, piPx, piPy, piCharge)) {
                                            {
                                                const _wbase = ((i) * 12 + 9) - 9;
                                                _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                            }
                                            absorbed = true;
                                        }
                                    }
                                } else if (((top + 4) <= 48)) {
                                    let _inl_61_result;
                                    _inl_61: {
                                        let _inl_61__inl_13_result;
                                        _inl_61__inl_13: {
                                            _inl_61__inl_13_result = (nIdx * NODE_STRIDE);
                                            break _inl_61__inl_13;
                                        }
                                        _inl_61_result = rt.bitcast_i32_u32(_b_nodes[(_inl_61__inl_13_result + 12)]);
                                        break _inl_61;
                                    }
                                    const nw = _inl_61_result;
                                    let _inl_62_result;
                                    _inl_62: {
                                        let _inl_62__inl_14_result;
                                        _inl_62__inl_14: {
                                            _inl_62__inl_14_result = (nIdx * NODE_STRIDE);
                                            break _inl_62__inl_14;
                                        }
                                        _inl_62_result = rt.bitcast_i32_u32(_b_nodes[(_inl_62__inl_14_result + 13)]);
                                        break _inl_62;
                                    }
                                    const ne = _inl_62_result;
                                    let _inl_63_result;
                                    _inl_63: {
                                        let _inl_63__inl_15_result;
                                        _inl_63__inl_15: {
                                            _inl_63__inl_15_result = (nIdx * NODE_STRIDE);
                                            break _inl_63__inl_15;
                                        }
                                        _inl_63_result = rt.bitcast_i32_u32(_b_nodes[(_inl_63__inl_15_result + 14)]);
                                        break _inl_63;
                                    }
                                    const sw = _inl_63_result;
                                    let _inl_64_result;
                                    _inl_64: {
                                        let _inl_64__inl_16_result;
                                        _inl_64__inl_16: {
                                            _inl_64__inl_16_result = (nIdx * NODE_STRIDE);
                                            break _inl_64__inl_16;
                                        }
                                        _inl_64_result = rt.bitcast_i32_u32(_b_nodes[(_inl_64__inl_16_result + 15)]);
                                        break _inl_64;
                                    }
                                    const se = _inl_64_result;
                                    if ((nw != NONE)) {
                                        stack[((top) >>> 0)] = ((nw) >>> 0);
                                        top++;
                                    }
                                    if ((ne != NONE)) {
                                        stack[((top) >>> 0)] = ((ne) >>> 0);
                                        top++;
                                    }
                                    if ((sw != NONE)) {
                                        stack[((top) >>> 0)] = ((sw) >>> 0);
                                        top++;
                                    }
                                    if ((se != NONE)) {
                                        stack[((top) >>> 0)] = ((se) >>> 0);
                                        top++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                {
                    const count = _b_piCount[0];
                    for (let i = 0; (i < count); i++) {
                        const _sroa_31_base = ((i) * 12);
                        const pi_posX = _b_pions[_sroa_31_base + 0];
                        const pi_posY = _b_pions[_sroa_31_base + 1];
                        const pi_wX = _b_pions[_sroa_31_base + 2];
                        const pi_wY = _b_pions[_sroa_31_base + 3];
                        const pi_mass = _b_pions[_sroa_31_base + 4];
                        const pi_charge = _b_pions[_sroa_31_base + 5];
                        const pi_energy = _b_pions[_sroa_31_base + 6];
                        const pi_emitterId = _b_pions[_sroa_31_base + 7];
                        const pi_age = _b_pions[_sroa_31_base + 8];
                        const pi_flags = _b_pions[_sroa_31_base + 9];
                        const pi_kind = _b_pions[_sroa_31_base + 10];
                        const pi__pad1 = _b_pions[_sroa_31_base + 11];
                        if ((((pi_flags & 1)) == 0)) {
                            continue;
                        }
                        if ((pi_age < BOSON_MIN_AGE)) {
                            continue;
                        }
                        if ((pi_kind != 0)) {
                            continue;
                        }
                        const piX = pi_posX;
                        const piY = pi_posY;
                        const piEmitterId = pi_emitterId;
                        const piWX = pi_wX;
                        const piWY = pi_wY;
                        const piCharge = pi_charge;
                        const gamma = Math.sqrt(((1.0 + (piWX * piWX)) + (piWY * piWY)));
                        const piEnergy = (pi_mass * gamma);
                        const piPx = (pi_mass * piWX);
                        const piPy = (pi_mass * piWY);
                        const searchR = SOFTENING;
                        let stack = Array.from({ length: 48 }, () => 0);
                        let top = 0;
                        stack[0] = 0;
                        top = 1;
                        let absorbed = false;
                        while (((top > 0) && (!absorbed))) {
                            top--;
                            const nIdx = stack[((top) >>> 0)];
                            let _inl_55_result;
                            _inl_55: {
                                let _inl_55__inl_1_result;
                                _inl_55__inl_1: {
                                    _inl_55__inl_1_result = (nIdx * NODE_STRIDE);
                                    break _inl_55__inl_1;
                                }
                                _inl_55_result = rt.bitcast_f32_u32(_b_nodes[_inl_55__inl_1_result]);
                                break _inl_55;
                            }
                            let _inl_56_result;
                            _inl_56: {
                                let _inl_56__inl_3_result;
                                _inl_56__inl_3: {
                                    _inl_56__inl_3_result = (nIdx * NODE_STRIDE);
                                    break _inl_56__inl_3;
                                }
                                _inl_56_result = rt.bitcast_f32_u32(_b_nodes[(_inl_56__inl_3_result + 2)]);
                                break _inl_56;
                            }
                            let _inl_57_result;
                            _inl_57: {
                                let _inl_57__inl_2_result;
                                _inl_57__inl_2: {
                                    _inl_57__inl_2_result = (nIdx * NODE_STRIDE);
                                    break _inl_57__inl_2;
                                }
                                _inl_57_result = rt.bitcast_f32_u32(_b_nodes[(_inl_57__inl_2_result + 1)]);
                                break _inl_57;
                            }
                            let _inl_58_result;
                            _inl_58: {
                                let _inl_58__inl_4_result;
                                _inl_58__inl_4: {
                                    _inl_58__inl_4_result = (nIdx * NODE_STRIDE);
                                    break _inl_58__inl_4;
                                }
                                _inl_58_result = rt.bitcast_f32_u32(_b_nodes[(_inl_58__inl_4_result + 3)]);
                                break _inl_58;
                            }
                            if ((((((piX + searchR) < _inl_55_result) || ((piX - searchR) > _inl_56_result)) || ((piY + searchR) < _inl_57_result)) || ((piY - searchR) > _inl_58_result))) {
                                continue;
                            }
                            let _inl_59_result;
                            _inl_59: {
                                let _inl_59__inl_13_result;
                                _inl_59__inl_13: {
                                    _inl_59__inl_13_result = (nIdx * NODE_STRIDE);
                                    break _inl_59__inl_13;
                                }
                                _inl_59_result = rt.bitcast_i32_u32(_b_nodes[(_inl_59__inl_13_result + 12)]);
                                break _inl_59;
                            }
                            const isLeaf = (_inl_59_result == NONE);
                            if (isLeaf) {
                                let _inl_60_result;
                                _inl_60: {
                                    let _inl_60__inl_17_result;
                                    _inl_60__inl_17: {
                                        _inl_60__inl_17_result = (nIdx * NODE_STRIDE);
                                        break _inl_60__inl_17;
                                    }
                                    _inl_60_result = rt.bitcast_i32_u32(_b_nodes[(_inl_60__inl_17_result + 16)]);
                                    break _inl_60;
                                }
                                const pIdx = _inl_60_result;
                                if ((pIdx < 0)) {
                                    continue;
                                }
                                const j = ((pIdx) >>> 0);
                                const _sroa_32_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_32_base + 0];
                                const pj_posY = _b_particles[_sroa_32_base + 1];
                                const pj_velWX = _b_particles[_sroa_32_base + 2];
                                const pj_velWY = _b_particles[_sroa_32_base + 3];
                                const pj_mass = _b_particles[_sroa_32_base + 4];
                                const pj_charge = _b_particles[_sroa_32_base + 5];
                                const pj_angW = _b_particles[_sroa_32_base + 6];
                                const pj_baseMass = _b_particles[_sroa_32_base + 7];
                                const pj_flags = _b_particles[_sroa_32_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_33_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_33_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_33_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_33_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_33_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_33_base + 4];
                                if ((auxJ_particleId == piEmitterId)) {
                                    continue;
                                }
                                const dx = (piX - pj_posX);
                                const dy = (piY - pj_posY);
                                if ((((dx * dx) + (dy * dy)) < (auxJ_radius * auxJ_radius))) {
                                    if (absorbFourMomentum(j, piEnergy, piPx, piPy, piCharge)) {
                                        {
                                            const _wbase = ((i) * 12 + 9) - 9;
                                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                                        }
                                        absorbed = true;
                                    }
                                }
                            } else if (((top + 4) <= 48)) {
                                let _inl_61_result;
                                _inl_61: {
                                    let _inl_61__inl_13_result;
                                    _inl_61__inl_13: {
                                        _inl_61__inl_13_result = (nIdx * NODE_STRIDE);
                                        break _inl_61__inl_13;
                                    }
                                    _inl_61_result = rt.bitcast_i32_u32(_b_nodes[(_inl_61__inl_13_result + 12)]);
                                    break _inl_61;
                                }
                                const nw = _inl_61_result;
                                let _inl_62_result;
                                _inl_62: {
                                    let _inl_62__inl_14_result;
                                    _inl_62__inl_14: {
                                        _inl_62__inl_14_result = (nIdx * NODE_STRIDE);
                                        break _inl_62__inl_14;
                                    }
                                    _inl_62_result = rt.bitcast_i32_u32(_b_nodes[(_inl_62__inl_14_result + 13)]);
                                    break _inl_62;
                                }
                                const ne = _inl_62_result;
                                let _inl_63_result;
                                _inl_63: {
                                    let _inl_63__inl_15_result;
                                    _inl_63__inl_15: {
                                        _inl_63__inl_15_result = (nIdx * NODE_STRIDE);
                                        break _inl_63__inl_15;
                                    }
                                    _inl_63_result = rt.bitcast_i32_u32(_b_nodes[(_inl_63__inl_15_result + 14)]);
                                    break _inl_63;
                                }
                                const sw = _inl_63_result;
                                let _inl_64_result;
                                _inl_64: {
                                    let _inl_64__inl_16_result;
                                    _inl_64__inl_16: {
                                        _inl_64__inl_16_result = (nIdx * NODE_STRIDE);
                                        break _inl_64__inl_16;
                                    }
                                    _inl_64_result = rt.bitcast_i32_u32(_b_nodes[(_inl_64__inl_16_result + 15)]);
                                    break _inl_64;
                                }
                                const se = _inl_64_result;
                                if ((nw != NONE)) {
                                    stack[((top) >>> 0)] = ((nw) >>> 0);
                                    top++;
                                }
                                if ((ne != NONE)) {
                                    stack[((top) >>> 0)] = ((ne) >>> 0);
                                    top++;
                                }
                                if ((sw != NONE)) {
                                    stack[((top) >>> 0)] = ((sw) >>> 0);
                                    top++;
                                }
                                if ((se != NONE)) {
                                    stack[((top) >>> 0)] = ((se) >>> 0);
                                    top++;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    entry["absorbPionsTree"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_absorbPionsTree(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["updatePhotonsTree"] = function (workgroups, domain, origin) {
            return __entry_0_updatePhotonsTree(workgroups, bindings, domain, origin);
        };
        bound["updatePionsTree"] = function (workgroups, domain, origin) {
            return __entry_1_updatePionsTree(workgroups, bindings, domain, origin);
        };
        bound["absorbPhotonsTree"] = function (workgroups, domain, origin) {
            return __entry_2_absorbPhotonsTree(workgroups, bindings, domain, origin);
        };
        bound["absorbPionsTree"] = function (workgroups, domain, origin) {
            return __entry_3_absorbPionsTree(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","aliveCountAtomic","particles","particleAux","nodes","photons","phCount","pions","piCount"], entryInfo };
}
