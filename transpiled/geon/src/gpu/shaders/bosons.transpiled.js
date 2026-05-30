// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/bosons.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: f39687fb7ffd642bb7c3e6e3a9699fa5a7d95a44daffd55cad639cece2f697f9
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":177273,"lines":2963,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":32,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.841Z
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

    entryInfo["updatePhotons"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_updatePhotons(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
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
                    const aliveN = _u_u_aliveCount;
                    const phPosX = ph_posX;
                    const phPosY = ph_posY;
                    let phVX = ph_velX;
                    let phVY = ph_velY;
                    for (let j = 0; (j < aliveN); j++) {
                        const _sroa_3_base = ((j) * 9);
                        const pj_posX = _b_particles[_sroa_3_base + 0];
                        const pj_posY = _b_particles[_sroa_3_base + 1];
                        const pj_velWX = _b_particles[_sroa_3_base + 2];
                        const pj_velWY = _b_particles[_sroa_3_base + 3];
                        const pj_mass = _b_particles[_sroa_3_base + 4];
                        const pj_charge = _b_particles[_sroa_3_base + 5];
                        const pj_angW = _b_particles[_sroa_3_base + 6];
                        const pj_baseMass = _b_particles[_sroa_3_base + 7];
                        const pj_flags = _b_particles[_sroa_3_base + 8];
                        if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        const dx = (pj_posX - phPosX);
                        const dy = (pj_posY - phPosY);
                        const rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                        const invRSq = (1.0 / rSq);
                        const invR3 = (invRSq * Math.sqrt(invRSq));
                        phVX = (phVX + ((((2.0 * pj_mass) * dx) * invR3) * dt));
                        phVY = (phVY + ((((2.0 * pj_mass) * dy) * invR3) * dt));
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
                            const aliveN = _u_u_aliveCount;
                            const phPosX = ph_posX;
                            const phPosY = ph_posY;
                            let phVX = ph_velX;
                            let phVY = ph_velY;
                            for (let j = 0; (j < aliveN); j++) {
                                const _sroa_5_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_5_base + 0];
                                const pj_posY = _b_particles[_sroa_5_base + 1];
                                const pj_velWX = _b_particles[_sroa_5_base + 2];
                                const pj_velWY = _b_particles[_sroa_5_base + 3];
                                const pj_mass = _b_particles[_sroa_5_base + 4];
                                const pj_charge = _b_particles[_sroa_5_base + 5];
                                const pj_angW = _b_particles[_sroa_5_base + 6];
                                const pj_baseMass = _b_particles[_sroa_5_base + 7];
                                const pj_flags = _b_particles[_sroa_5_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const dx = (pj_posX - phPosX);
                                const dy = (pj_posY - phPosY);
                                const rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const invRSq = (1.0 / rSq);
                                const invR3 = (invRSq * Math.sqrt(invRSq));
                                phVX = (phVX + ((((2.0 * pj_mass) * dx) * invR3) * dt));
                                phVY = (phVY + ((((2.0 * pj_mass) * dy) * invR3) * dt));
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
                        const _sroa_6_base = ((i) * 8);
                        let ph_posX = _b_photons[_sroa_6_base + 0];
                        let ph_posY = _b_photons[_sroa_6_base + 1];
                        let ph_velX = _b_photons[_sroa_6_base + 2];
                        let ph_velY = _b_photons[_sroa_6_base + 3];
                        let ph_energy = _b_photons[_sroa_6_base + 4];
                        let ph_emitterId = _b_photons[_sroa_6_base + 5];
                        let ph_lifetime = _b_photons[_sroa_6_base + 6];
                        let ph_flags = _b_photons[_sroa_6_base + 7];
                        if ((((ph_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const aliveN = _u_u_aliveCount;
                        const phPosX = ph_posX;
                        const phPosY = ph_posY;
                        let phVX = ph_velX;
                        let phVY = ph_velY;
                        for (let j = 0; (j < aliveN); j++) {
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
                            const dx = (pj_posX - phPosX);
                            const dy = (pj_posY - phPosY);
                            const rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                            const invRSq = (1.0 / rSq);
                            const invR3 = (invRSq * Math.sqrt(invRSq));
                            phVX = (phVX + ((((2.0 * pj_mass) * dx) * invR3) * dt));
                            phVY = (phVY + ((((2.0 * pj_mass) * dy) * invR3) * dt));
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
                    const _sroa_8_base = ((i) * 8);
                    let ph_posX = _b_photons[_sroa_8_base + 0];
                    let ph_posY = _b_photons[_sroa_8_base + 1];
                    let ph_velX = _b_photons[_sroa_8_base + 2];
                    let ph_velY = _b_photons[_sroa_8_base + 3];
                    let ph_energy = _b_photons[_sroa_8_base + 4];
                    let ph_emitterId = _b_photons[_sroa_8_base + 5];
                    let ph_lifetime = _b_photons[_sroa_8_base + 6];
                    let ph_flags = _b_photons[_sroa_8_base + 7];
                    if ((((ph_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const aliveN = _u_u_aliveCount;
                    const phPosX = ph_posX;
                    const phPosY = ph_posY;
                    let phVX = ph_velX;
                    let phVY = ph_velY;
                    for (let j = 0; (j < aliveN); j++) {
                        const _sroa_9_base = ((j) * 9);
                        const pj_posX = _b_particles[_sroa_9_base + 0];
                        const pj_posY = _b_particles[_sroa_9_base + 1];
                        const pj_velWX = _b_particles[_sroa_9_base + 2];
                        const pj_velWY = _b_particles[_sroa_9_base + 3];
                        const pj_mass = _b_particles[_sroa_9_base + 4];
                        const pj_charge = _b_particles[_sroa_9_base + 5];
                        const pj_angW = _b_particles[_sroa_9_base + 6];
                        const pj_baseMass = _b_particles[_sroa_9_base + 7];
                        const pj_flags = _b_particles[_sroa_9_base + 8];
                        if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                            continue;
                        }
                        const dx = (pj_posX - phPosX);
                        const dy = (pj_posY - phPosY);
                        const rSq = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                        const invRSq = (1.0 / rSq);
                        const invR3 = (invRSq * Math.sqrt(invRSq));
                        phVX = (phVX + ((((2.0 * pj_mass) * dx) * invR3) * dt));
                        phVY = (phVY + ((((2.0 * pj_mass) * dy) * invR3) * dt));
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
    entry["updatePhotons"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_updatePhotons(workgroups, bindings, domain, origin);
    };

    entryInfo["updatePions"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_updatePions(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_toggles0 = _b_u.toggles0;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
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
                    const _sroa_10_base = ((i) * 12);
                    let pi_posX = _b_pions[_sroa_10_base + 0];
                    let pi_posY = _b_pions[_sroa_10_base + 1];
                    let pi_wX = _b_pions[_sroa_10_base + 2];
                    let pi_wY = _b_pions[_sroa_10_base + 3];
                    let pi_mass = _b_pions[_sroa_10_base + 4];
                    let pi_charge = _b_pions[_sroa_10_base + 5];
                    let pi_energy = _b_pions[_sroa_10_base + 6];
                    let pi_emitterId = _b_pions[_sroa_10_base + 7];
                    let pi_age = _b_pions[_sroa_10_base + 8];
                    let pi_flags = _b_pions[_sroa_10_base + 9];
                    let pi_kind = _b_pions[_sroa_10_base + 10];
                    let pi__pad1 = _b_pions[_sroa_10_base + 11];
                    if ((((pi_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const aliveN = _u_u_aliveCount;
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
                    for (let j = 0; (j < aliveN); j++) {
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
                        const dx = (pj_posX - piPosX);
                        const dy = (pj_posY - piPosY);
                        const rSq2 = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                        const invRSq2 = (1.0 / rSq2);
                        const invR3 = (invRSq2 * Math.sqrt(invRSq2));
                        piWX = (piWX + ((((grFactor * pj_mass) * dx) * invR3) * dt));
                        piWY = (piWY + ((((grFactor * pj_mass) * dy) * invR3) * dt));
                        if (((coulombOn && (Math.abs(piCharge) > EPSILON)) && (Math.abs(pj_charge) > EPSILON))) {
                            const fC = ((((-piCharge) * pj_charge) * invR3) * dt);
                            piWX = (piWX + (fC * dx));
                            piWY = (piWY + (fC * dy));
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
                            const _sroa_12_base = ((i) * 12);
                            let pi_posX = _b_pions[_sroa_12_base + 0];
                            let pi_posY = _b_pions[_sroa_12_base + 1];
                            let pi_wX = _b_pions[_sroa_12_base + 2];
                            let pi_wY = _b_pions[_sroa_12_base + 3];
                            let pi_mass = _b_pions[_sroa_12_base + 4];
                            let pi_charge = _b_pions[_sroa_12_base + 5];
                            let pi_energy = _b_pions[_sroa_12_base + 6];
                            let pi_emitterId = _b_pions[_sroa_12_base + 7];
                            let pi_age = _b_pions[_sroa_12_base + 8];
                            let pi_flags = _b_pions[_sroa_12_base + 9];
                            let pi_kind = _b_pions[_sroa_12_base + 10];
                            let pi__pad1 = _b_pions[_sroa_12_base + 11];
                            if ((((pi_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            const dt = _u_u_dt;
                            const aliveN = _u_u_aliveCount;
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
                            for (let j = 0; (j < aliveN); j++) {
                                const _sroa_13_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_13_base + 0];
                                const pj_posY = _b_particles[_sroa_13_base + 1];
                                const pj_velWX = _b_particles[_sroa_13_base + 2];
                                const pj_velWY = _b_particles[_sroa_13_base + 3];
                                const pj_mass = _b_particles[_sroa_13_base + 4];
                                const pj_charge = _b_particles[_sroa_13_base + 5];
                                const pj_angW = _b_particles[_sroa_13_base + 6];
                                const pj_baseMass = _b_particles[_sroa_13_base + 7];
                                const pj_flags = _b_particles[_sroa_13_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const dx = (pj_posX - piPosX);
                                const dy = (pj_posY - piPosY);
                                const rSq2 = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                                const invRSq2 = (1.0 / rSq2);
                                const invR3 = (invRSq2 * Math.sqrt(invRSq2));
                                piWX = (piWX + ((((grFactor * pj_mass) * dx) * invR3) * dt));
                                piWY = (piWY + ((((grFactor * pj_mass) * dy) * invR3) * dt));
                                if (((coulombOn && (Math.abs(piCharge) > EPSILON)) && (Math.abs(pj_charge) > EPSILON))) {
                                    const fC = ((((-piCharge) * pj_charge) * invR3) * dt);
                                    piWX = (piWX + (fC * dx));
                                    piWY = (piWY + (fC * dy));
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
                        const _sroa_14_base = ((i) * 12);
                        let pi_posX = _b_pions[_sroa_14_base + 0];
                        let pi_posY = _b_pions[_sroa_14_base + 1];
                        let pi_wX = _b_pions[_sroa_14_base + 2];
                        let pi_wY = _b_pions[_sroa_14_base + 3];
                        let pi_mass = _b_pions[_sroa_14_base + 4];
                        let pi_charge = _b_pions[_sroa_14_base + 5];
                        let pi_energy = _b_pions[_sroa_14_base + 6];
                        let pi_emitterId = _b_pions[_sroa_14_base + 7];
                        let pi_age = _b_pions[_sroa_14_base + 8];
                        let pi_flags = _b_pions[_sroa_14_base + 9];
                        let pi_kind = _b_pions[_sroa_14_base + 10];
                        let pi__pad1 = _b_pions[_sroa_14_base + 11];
                        if ((((pi_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        const dt = _u_u_dt;
                        const aliveN = _u_u_aliveCount;
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
                        for (let j = 0; (j < aliveN); j++) {
                            const _sroa_15_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_15_base + 0];
                            const pj_posY = _b_particles[_sroa_15_base + 1];
                            const pj_velWX = _b_particles[_sroa_15_base + 2];
                            const pj_velWY = _b_particles[_sroa_15_base + 3];
                            const pj_mass = _b_particles[_sroa_15_base + 4];
                            const pj_charge = _b_particles[_sroa_15_base + 5];
                            const pj_angW = _b_particles[_sroa_15_base + 6];
                            const pj_baseMass = _b_particles[_sroa_15_base + 7];
                            const pj_flags = _b_particles[_sroa_15_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const dx = (pj_posX - piPosX);
                            const dy = (pj_posY - piPosY);
                            const rSq2 = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                            const invRSq2 = (1.0 / rSq2);
                            const invR3 = (invRSq2 * Math.sqrt(invRSq2));
                            piWX = (piWX + ((((grFactor * pj_mass) * dx) * invR3) * dt));
                            piWY = (piWY + ((((grFactor * pj_mass) * dy) * invR3) * dt));
                            if (((coulombOn && (Math.abs(piCharge) > EPSILON)) && (Math.abs(pj_charge) > EPSILON))) {
                                const fC = ((((-piCharge) * pj_charge) * invR3) * dt);
                                piWX = (piWX + (fC * dx));
                                piWY = (piWY + (fC * dy));
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
                    const _sroa_16_base = ((i) * 12);
                    let pi_posX = _b_pions[_sroa_16_base + 0];
                    let pi_posY = _b_pions[_sroa_16_base + 1];
                    let pi_wX = _b_pions[_sroa_16_base + 2];
                    let pi_wY = _b_pions[_sroa_16_base + 3];
                    let pi_mass = _b_pions[_sroa_16_base + 4];
                    let pi_charge = _b_pions[_sroa_16_base + 5];
                    let pi_energy = _b_pions[_sroa_16_base + 6];
                    let pi_emitterId = _b_pions[_sroa_16_base + 7];
                    let pi_age = _b_pions[_sroa_16_base + 8];
                    let pi_flags = _b_pions[_sroa_16_base + 9];
                    let pi_kind = _b_pions[_sroa_16_base + 10];
                    let pi__pad1 = _b_pions[_sroa_16_base + 11];
                    if ((((pi_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    const dt = _u_u_dt;
                    const aliveN = _u_u_aliveCount;
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
                    for (let j = 0; (j < aliveN); j++) {
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
                        const dx = (pj_posX - piPosX);
                        const dy = (pj_posY - piPosY);
                        const rSq2 = (((dx * dx) + (dy * dy)) + BOSON_SOFTENING_SQ);
                        const invRSq2 = (1.0 / rSq2);
                        const invR3 = (invRSq2 * Math.sqrt(invRSq2));
                        piWX = (piWX + ((((grFactor * pj_mass) * dx) * invR3) * dt));
                        piWY = (piWY + ((((grFactor * pj_mass) * dy) * invR3) * dt));
                        if (((coulombOn && (Math.abs(piCharge) > EPSILON)) && (Math.abs(pj_charge) > EPSILON))) {
                            const fC = ((((-piCharge) * pj_charge) * invR3) * dt);
                            piWX = (piWX + (fC * dx));
                            piWY = (piWY + (fC * dy));
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
    entry["updatePions"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_updatePions(workgroups, bindings, domain, origin);
    };

    entryInfo["absorbPhotons"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_absorbPhotons(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
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
                    const aliveN = _u_u_aliveCount;
                    for (let i = 0; (i < count); i++) {
                        const _sroa_18_base = ((i) * 8);
                        const ph_posX = _b_photons[_sroa_18_base + 0];
                        const ph_posY = _b_photons[_sroa_18_base + 1];
                        const ph_velX = _b_photons[_sroa_18_base + 2];
                        const ph_velY = _b_photons[_sroa_18_base + 3];
                        const ph_energy = _b_photons[_sroa_18_base + 4];
                        const ph_emitterId = _b_photons[_sroa_18_base + 5];
                        const ph_lifetime = _b_photons[_sroa_18_base + 6];
                        const ph_flags = _b_photons[_sroa_18_base + 7];
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
                        for (let j = 0; (j < aliveN); j++) {
                            const _sroa_19_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_19_base + 0];
                            const pj_posY = _b_particles[_sroa_19_base + 1];
                            const pj_velWX = _b_particles[_sroa_19_base + 2];
                            const pj_velWY = _b_particles[_sroa_19_base + 3];
                            const pj_mass = _b_particles[_sroa_19_base + 4];
                            const pj_charge = _b_particles[_sroa_19_base + 5];
                            const pj_angW = _b_particles[_sroa_19_base + 6];
                            const pj_baseMass = _b_particles[_sroa_19_base + 7];
                            const pj_flags = _b_particles[_sroa_19_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const _sroa_20_base = ((j) * 5);
                            const auxJ_radius = _b_particleAux[_sroa_20_base + 0];
                            const auxJ_particleId = _b_particleAux[_sroa_20_base + 1];
                            const auxJ_deathTime = _b_particleAux[_sroa_20_base + 2];
                            const auxJ_deathMass = _b_particleAux[_sroa_20_base + 3];
                            const auxJ_deathAngVel = _b_particleAux[_sroa_20_base + 4];
                            if ((auxJ_particleId == phEmitterId)) {
                                continue;
                            }
                            const dx = (phX - pj_posX);
                            const dy = (phY - pj_posY);
                            const distSq = ((dx * dx) + (dy * dy));
                            const rSq = (auxJ_radius * auxJ_radius);
                            if ((distSq < rSq)) {
                                if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                    {
                                        const _wbase = ((i) * 8 + 7) - 7;
                                        _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                    }
                                    break;
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
                            const aliveN = _u_u_aliveCount;
                            for (let i = 0; (i < count); i++) {
                                const _sroa_21_base = ((i) * 8);
                                const ph_posX = _b_photons[_sroa_21_base + 0];
                                const ph_posY = _b_photons[_sroa_21_base + 1];
                                const ph_velX = _b_photons[_sroa_21_base + 2];
                                const ph_velY = _b_photons[_sroa_21_base + 3];
                                const ph_energy = _b_photons[_sroa_21_base + 4];
                                const ph_emitterId = _b_photons[_sroa_21_base + 5];
                                const ph_lifetime = _b_photons[_sroa_21_base + 6];
                                const ph_flags = _b_photons[_sroa_21_base + 7];
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
                                for (let j = 0; (j < aliveN); j++) {
                                    const _sroa_22_base = ((j) * 9);
                                    const pj_posX = _b_particles[_sroa_22_base + 0];
                                    const pj_posY = _b_particles[_sroa_22_base + 1];
                                    const pj_velWX = _b_particles[_sroa_22_base + 2];
                                    const pj_velWY = _b_particles[_sroa_22_base + 3];
                                    const pj_mass = _b_particles[_sroa_22_base + 4];
                                    const pj_charge = _b_particles[_sroa_22_base + 5];
                                    const pj_angW = _b_particles[_sroa_22_base + 6];
                                    const pj_baseMass = _b_particles[_sroa_22_base + 7];
                                    const pj_flags = _b_particles[_sroa_22_base + 8];
                                    if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                        continue;
                                    }
                                    const _sroa_23_base = ((j) * 5);
                                    const auxJ_radius = _b_particleAux[_sroa_23_base + 0];
                                    const auxJ_particleId = _b_particleAux[_sroa_23_base + 1];
                                    const auxJ_deathTime = _b_particleAux[_sroa_23_base + 2];
                                    const auxJ_deathMass = _b_particleAux[_sroa_23_base + 3];
                                    const auxJ_deathAngVel = _b_particleAux[_sroa_23_base + 4];
                                    if ((auxJ_particleId == phEmitterId)) {
                                        continue;
                                    }
                                    const dx = (phX - pj_posX);
                                    const dy = (phY - pj_posY);
                                    const distSq = ((dx * dx) + (dy * dy));
                                    const rSq = (auxJ_radius * auxJ_radius);
                                    if ((distSq < rSq)) {
                                        if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                            {
                                                const _wbase = ((i) * 8 + 7) - 7;
                                                _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                            }
                                            break;
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
                        const aliveN = _u_u_aliveCount;
                        for (let i = 0; (i < count); i++) {
                            const _sroa_24_base = ((i) * 8);
                            const ph_posX = _b_photons[_sroa_24_base + 0];
                            const ph_posY = _b_photons[_sroa_24_base + 1];
                            const ph_velX = _b_photons[_sroa_24_base + 2];
                            const ph_velY = _b_photons[_sroa_24_base + 3];
                            const ph_energy = _b_photons[_sroa_24_base + 4];
                            const ph_emitterId = _b_photons[_sroa_24_base + 5];
                            const ph_lifetime = _b_photons[_sroa_24_base + 6];
                            const ph_flags = _b_photons[_sroa_24_base + 7];
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
                            for (let j = 0; (j < aliveN); j++) {
                                const _sroa_25_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_25_base + 0];
                                const pj_posY = _b_particles[_sroa_25_base + 1];
                                const pj_velWX = _b_particles[_sroa_25_base + 2];
                                const pj_velWY = _b_particles[_sroa_25_base + 3];
                                const pj_mass = _b_particles[_sroa_25_base + 4];
                                const pj_charge = _b_particles[_sroa_25_base + 5];
                                const pj_angW = _b_particles[_sroa_25_base + 6];
                                const pj_baseMass = _b_particles[_sroa_25_base + 7];
                                const pj_flags = _b_particles[_sroa_25_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_26_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_26_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_26_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_26_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_26_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_26_base + 4];
                                if ((auxJ_particleId == phEmitterId)) {
                                    continue;
                                }
                                const dx = (phX - pj_posX);
                                const dy = (phY - pj_posY);
                                const distSq = ((dx * dx) + (dy * dy));
                                const rSq = (auxJ_radius * auxJ_radius);
                                if ((distSq < rSq)) {
                                    if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                        {
                                            const _wbase = ((i) * 8 + 7) - 7;
                                            _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                        }
                                        break;
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
                    const aliveN = _u_u_aliveCount;
                    for (let i = 0; (i < count); i++) {
                        const _sroa_27_base = ((i) * 8);
                        const ph_posX = _b_photons[_sroa_27_base + 0];
                        const ph_posY = _b_photons[_sroa_27_base + 1];
                        const ph_velX = _b_photons[_sroa_27_base + 2];
                        const ph_velY = _b_photons[_sroa_27_base + 3];
                        const ph_energy = _b_photons[_sroa_27_base + 4];
                        const ph_emitterId = _b_photons[_sroa_27_base + 5];
                        const ph_lifetime = _b_photons[_sroa_27_base + 6];
                        const ph_flags = _b_photons[_sroa_27_base + 7];
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
                        for (let j = 0; (j < aliveN); j++) {
                            const _sroa_28_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_28_base + 0];
                            const pj_posY = _b_particles[_sroa_28_base + 1];
                            const pj_velWX = _b_particles[_sroa_28_base + 2];
                            const pj_velWY = _b_particles[_sroa_28_base + 3];
                            const pj_mass = _b_particles[_sroa_28_base + 4];
                            const pj_charge = _b_particles[_sroa_28_base + 5];
                            const pj_angW = _b_particles[_sroa_28_base + 6];
                            const pj_baseMass = _b_particles[_sroa_28_base + 7];
                            const pj_flags = _b_particles[_sroa_28_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const _sroa_29_base = ((j) * 5);
                            const auxJ_radius = _b_particleAux[_sroa_29_base + 0];
                            const auxJ_particleId = _b_particleAux[_sroa_29_base + 1];
                            const auxJ_deathTime = _b_particleAux[_sroa_29_base + 2];
                            const auxJ_deathMass = _b_particleAux[_sroa_29_base + 3];
                            const auxJ_deathAngVel = _b_particleAux[_sroa_29_base + 4];
                            if ((auxJ_particleId == phEmitterId)) {
                                continue;
                            }
                            const dx = (phX - pj_posX);
                            const dy = (phY - pj_posY);
                            const distSq = ((dx * dx) + (dy * dy));
                            const rSq = (auxJ_radius * auxJ_radius);
                            if ((distSq < rSq)) {
                                if (absorbFourMomentum(j, phEnergy, (phEnergy * phVelX), (phEnergy * phVelY), 0.0)) {
                                    {
                                        const _wbase = ((i) * 8 + 7) - 7;
                                        _b_photons[_wbase + 7] = (_b_photons[_wbase + 7] & (~1));
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    entry["absorbPhotons"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_absorbPhotons(workgroups, bindings, domain, origin);
    };

    entryInfo["absorbPions"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_absorbPions(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_aliveCount = _b_u.aliveCount;
        const _b_particles = bindings.particles;
        const _b_particleAux = bindings.particleAux;
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
                    const aliveN = _u_u_aliveCount;
                    for (let i = 0; (i < count); i++) {
                        const _sroa_30_base = ((i) * 12);
                        const pi_posX = _b_pions[_sroa_30_base + 0];
                        const pi_posY = _b_pions[_sroa_30_base + 1];
                        const pi_wX = _b_pions[_sroa_30_base + 2];
                        const pi_wY = _b_pions[_sroa_30_base + 3];
                        const pi_mass = _b_pions[_sroa_30_base + 4];
                        const pi_charge = _b_pions[_sroa_30_base + 5];
                        const pi_energy = _b_pions[_sroa_30_base + 6];
                        const pi_emitterId = _b_pions[_sroa_30_base + 7];
                        const pi_age = _b_pions[_sroa_30_base + 8];
                        const pi_flags = _b_pions[_sroa_30_base + 9];
                        const pi_kind = _b_pions[_sroa_30_base + 10];
                        const pi__pad1 = _b_pions[_sroa_30_base + 11];
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
                        for (let j = 0; (j < aliveN); j++) {
                            const _sroa_31_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_31_base + 0];
                            const pj_posY = _b_particles[_sroa_31_base + 1];
                            const pj_velWX = _b_particles[_sroa_31_base + 2];
                            const pj_velWY = _b_particles[_sroa_31_base + 3];
                            const pj_mass = _b_particles[_sroa_31_base + 4];
                            const pj_charge = _b_particles[_sroa_31_base + 5];
                            const pj_angW = _b_particles[_sroa_31_base + 6];
                            const pj_baseMass = _b_particles[_sroa_31_base + 7];
                            const pj_flags = _b_particles[_sroa_31_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const _sroa_32_base = ((j) * 5);
                            const auxJ_radius = _b_particleAux[_sroa_32_base + 0];
                            const auxJ_particleId = _b_particleAux[_sroa_32_base + 1];
                            const auxJ_deathTime = _b_particleAux[_sroa_32_base + 2];
                            const auxJ_deathMass = _b_particleAux[_sroa_32_base + 3];
                            const auxJ_deathAngVel = _b_particleAux[_sroa_32_base + 4];
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
                                    break;
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
                            const aliveN = _u_u_aliveCount;
                            for (let i = 0; (i < count); i++) {
                                const _sroa_33_base = ((i) * 12);
                                const pi_posX = _b_pions[_sroa_33_base + 0];
                                const pi_posY = _b_pions[_sroa_33_base + 1];
                                const pi_wX = _b_pions[_sroa_33_base + 2];
                                const pi_wY = _b_pions[_sroa_33_base + 3];
                                const pi_mass = _b_pions[_sroa_33_base + 4];
                                const pi_charge = _b_pions[_sroa_33_base + 5];
                                const pi_energy = _b_pions[_sroa_33_base + 6];
                                const pi_emitterId = _b_pions[_sroa_33_base + 7];
                                const pi_age = _b_pions[_sroa_33_base + 8];
                                const pi_flags = _b_pions[_sroa_33_base + 9];
                                const pi_kind = _b_pions[_sroa_33_base + 10];
                                const pi__pad1 = _b_pions[_sroa_33_base + 11];
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
                                for (let j = 0; (j < aliveN); j++) {
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
                                    const _sroa_35_base = ((j) * 5);
                                    const auxJ_radius = _b_particleAux[_sroa_35_base + 0];
                                    const auxJ_particleId = _b_particleAux[_sroa_35_base + 1];
                                    const auxJ_deathTime = _b_particleAux[_sroa_35_base + 2];
                                    const auxJ_deathMass = _b_particleAux[_sroa_35_base + 3];
                                    const auxJ_deathAngVel = _b_particleAux[_sroa_35_base + 4];
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
                                            break;
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
                        const aliveN = _u_u_aliveCount;
                        for (let i = 0; (i < count); i++) {
                            const _sroa_36_base = ((i) * 12);
                            const pi_posX = _b_pions[_sroa_36_base + 0];
                            const pi_posY = _b_pions[_sroa_36_base + 1];
                            const pi_wX = _b_pions[_sroa_36_base + 2];
                            const pi_wY = _b_pions[_sroa_36_base + 3];
                            const pi_mass = _b_pions[_sroa_36_base + 4];
                            const pi_charge = _b_pions[_sroa_36_base + 5];
                            const pi_energy = _b_pions[_sroa_36_base + 6];
                            const pi_emitterId = _b_pions[_sroa_36_base + 7];
                            const pi_age = _b_pions[_sroa_36_base + 8];
                            const pi_flags = _b_pions[_sroa_36_base + 9];
                            const pi_kind = _b_pions[_sroa_36_base + 10];
                            const pi__pad1 = _b_pions[_sroa_36_base + 11];
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
                            for (let j = 0; (j < aliveN); j++) {
                                const _sroa_37_base = ((j) * 9);
                                const pj_posX = _b_particles[_sroa_37_base + 0];
                                const pj_posY = _b_particles[_sroa_37_base + 1];
                                const pj_velWX = _b_particles[_sroa_37_base + 2];
                                const pj_velWY = _b_particles[_sroa_37_base + 3];
                                const pj_mass = _b_particles[_sroa_37_base + 4];
                                const pj_charge = _b_particles[_sroa_37_base + 5];
                                const pj_angW = _b_particles[_sroa_37_base + 6];
                                const pj_baseMass = _b_particles[_sroa_37_base + 7];
                                const pj_flags = _b_particles[_sroa_37_base + 8];
                                if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                    continue;
                                }
                                const _sroa_38_base = ((j) * 5);
                                const auxJ_radius = _b_particleAux[_sroa_38_base + 0];
                                const auxJ_particleId = _b_particleAux[_sroa_38_base + 1];
                                const auxJ_deathTime = _b_particleAux[_sroa_38_base + 2];
                                const auxJ_deathMass = _b_particleAux[_sroa_38_base + 3];
                                const auxJ_deathAngVel = _b_particleAux[_sroa_38_base + 4];
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
                                        break;
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
                    const aliveN = _u_u_aliveCount;
                    for (let i = 0; (i < count); i++) {
                        const _sroa_39_base = ((i) * 12);
                        const pi_posX = _b_pions[_sroa_39_base + 0];
                        const pi_posY = _b_pions[_sroa_39_base + 1];
                        const pi_wX = _b_pions[_sroa_39_base + 2];
                        const pi_wY = _b_pions[_sroa_39_base + 3];
                        const pi_mass = _b_pions[_sroa_39_base + 4];
                        const pi_charge = _b_pions[_sroa_39_base + 5];
                        const pi_energy = _b_pions[_sroa_39_base + 6];
                        const pi_emitterId = _b_pions[_sroa_39_base + 7];
                        const pi_age = _b_pions[_sroa_39_base + 8];
                        const pi_flags = _b_pions[_sroa_39_base + 9];
                        const pi_kind = _b_pions[_sroa_39_base + 10];
                        const pi__pad1 = _b_pions[_sroa_39_base + 11];
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
                        for (let j = 0; (j < aliveN); j++) {
                            const _sroa_40_base = ((j) * 9);
                            const pj_posX = _b_particles[_sroa_40_base + 0];
                            const pj_posY = _b_particles[_sroa_40_base + 1];
                            const pj_velWX = _b_particles[_sroa_40_base + 2];
                            const pj_velWY = _b_particles[_sroa_40_base + 3];
                            const pj_mass = _b_particles[_sroa_40_base + 4];
                            const pj_charge = _b_particles[_sroa_40_base + 5];
                            const pj_angW = _b_particles[_sroa_40_base + 6];
                            const pj_baseMass = _b_particles[_sroa_40_base + 7];
                            const pj_flags = _b_particles[_sroa_40_base + 8];
                            if ((((pj_flags & FLAG_ALIVE)) == 0)) {
                                continue;
                            }
                            const _sroa_41_base = ((j) * 5);
                            const auxJ_radius = _b_particleAux[_sroa_41_base + 0];
                            const auxJ_particleId = _b_particleAux[_sroa_41_base + 1];
                            const auxJ_deathTime = _b_particleAux[_sroa_41_base + 2];
                            const auxJ_deathMass = _b_particleAux[_sroa_41_base + 3];
                            const auxJ_deathAngVel = _b_particleAux[_sroa_41_base + 4];
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
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    entry["absorbPions"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_absorbPions(workgroups, bindings, domain, origin);
    };

    entryInfo["decayPions"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_4_decayPions(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_u = bindings.u;
        const _u_u_dt = _b_u.dt;
        const _u_u_frameCount = _b_u.frameCount;
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
                    const count = _b_piCount[0];
                    if ((i >= count)) {
                        break __invocation;
                    }
                    const _sroa_42_base = ((i) * 12);
                    const piState_posX = _b_pions[_sroa_42_base + 0];
                    const piState_posY = _b_pions[_sroa_42_base + 1];
                    const piState_wX = _b_pions[_sroa_42_base + 2];
                    const piState_wY = _b_pions[_sroa_42_base + 3];
                    const piState_mass = _b_pions[_sroa_42_base + 4];
                    const piState_charge = _b_pions[_sroa_42_base + 5];
                    const piState_energy = _b_pions[_sroa_42_base + 6];
                    const piState_emitterId = _b_pions[_sroa_42_base + 7];
                    const piState_age = _b_pions[_sroa_42_base + 8];
                    const piState_flags = _b_pions[_sroa_42_base + 9];
                    const piState_kind = _b_pions[_sroa_42_base + 10];
                    const piState__pad1 = _b_pions[_sroa_42_base + 11];
                    if ((((piState_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((piState_kind != 0)) {
                        break __invocation;
                    }
                    const isNeutral = (Math.abs(piState_charge) < EPSILON);
                    const baseProb = (isNeutral ? PION_DECAY_PROB : CHARGED_PION_DECAY_PROB);
                    const ticks = (((_u_u_dt / PHYSICS_DT)) < (1.0) ? (1.0) : ((_u_u_dt / PHYSICS_DT)));
                    const prob = (1.0 - Math.pow((1.0 - baseProb), ticks));
                    const _inl_24_seed = (((i * 73856093)) ^ ((_u_u_frameCount * 19349663)));
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
                    const rng = _inl_24_result;
                    if ((rng > prob)) {
                        break __invocation;
                    }
                    const mPi = piState_mass;
                    const wx = piState_wX;
                    const wy = piState_wY;
                    const wSq = ((wx * wx) + (wy * wy));
                    const gamma = Math.sqrt((1.0 + wSq));
                    const invG = (1.0 / gamma);
                    const vx = (wx * invG);
                    const vy = (wy * invG);
                    const vSq = ((vx * vx) + (vy * vy));
                    if (isNeutral) {
                        const _inl_25_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xBEEF);
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
                        const rng2 = _inl_25_result;
                        const restAngle = (rng2 * TWO_PI);
                        const cosR = Math.cos(restAngle);
                        const sinR = Math.sin(restAngle);
                        const eRest = (mPi * 0.5);
                        const piDecayPosX = piState_posX;
                        const piDecayPosY = piState_posY;
                        const piDecayEmitter = piState_emitterId;
                        for (let s = 0; (s < 2); s++) {
                            const sign = ((s == 0) ? 1.0 : (-1.0));
                            let pxR = ((sign * eRest) * cosR);
                            let pyR = ((sign * eRest) * sinR);
                            if ((vSq > 1e-12)) {
                                const v = Math.sqrt(vSq);
                                const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                const nx = (vx / v);
                                const ny = (vy / v);
                                const pPar = ((pxR * nx) + (pyR * ny));
                                const pPerpX = (pxR - (pPar * nx));
                                const pPerpY = (pyR - (pPar * ny));
                                const pParB = (gammaB * ((pPar + (v * eRest))));
                                pxR = ((pParB * nx) + pPerpX);
                                pyR = ((pParB * ny) + pPerpY);
                            }
                            const pMag = Math.sqrt(((pxR * pxR) + (pyR * pyR)));
                            if ((pMag < EPSILON)) {
                                continue;
                            }
                            const invPMag = (1.0 / pMag);
                            const cosA = (pxR * invPMag);
                            const sinA = (pyR * invPMag);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (piDecayPosX + (cosA * emitOffset));
                                ph_posY = (piDecayPosY + (sinA * emitOffset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = pMag;
                                ph_emitterId = piDecayEmitter;
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
                    } else {
                        const mE = ELECTRON_MASS;
                        const piDecayPosX2 = piState_posX;
                        const piDecayPosY2 = piState_posY;
                        const piDecayEmitter2 = piState_emitterId;
                        const piDecayEnergy = piState_energy;
                        const piDecayCharge = piState_charge;
                        if ((mPi <= mE)) {
                            const angle = Math.atan2(vy, vx);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (piDecayPosX2 + (cosA * emitOffset));
                                ph_posY = (piDecayPosY2 + (sinA * emitOffset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = piDecayEnergy;
                                ph_emitterId = piDecayEmitter2;
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
                        } else {
                            const ePhRest = ((((mPi * mPi) - (mE * mE))) / ((2.0 * mPi)));
                            const eElRest = (mPi - ePhRest);
                            const pRest = ePhRest;
                            const _inl_26_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xCAFE);
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
                            const rng3 = _inl_26_result;
                            const restAngle2 = (rng3 * TWO_PI);
                            const cosR = Math.cos(restAngle2);
                            const sinR = Math.sin(restAngle2);
                            let phPxR = (pRest * cosR);
                            let phPyR = (pRest * sinR);
                            let elPxR = ((-pRest) * cosR);
                            let elPyR = ((-pRest) * sinR);
                            let elELab = eElRest;
                            if ((vSq > 1e-12)) {
                                const v = Math.sqrt(vSq);
                                const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                const nx = (vx / v);
                                const ny = (vy / v);
                                const phPar = ((phPxR * nx) + (phPyR * ny));
                                const phPerpX = (phPxR - (phPar * nx));
                                const phPerpY = (phPyR - (phPar * ny));
                                const phParB = (gammaB * ((phPar + (v * ePhRest))));
                                phPxR = ((phParB * nx) + phPerpX);
                                phPyR = ((phParB * ny) + phPerpY);
                                const elPar = ((elPxR * nx) + (elPyR * ny));
                                const elPerpX = (elPxR - (elPar * nx));
                                const elPerpY = (elPyR - (elPar * ny));
                                const elParB = (gammaB * ((elPar + (v * eElRest))));
                                elPxR = ((elParB * nx) + elPerpX);
                                elPyR = ((elParB * ny) + elPerpY);
                                elELab = (gammaB * ((eElRest + (v * elPar))));
                            }
                            const phMag = Math.sqrt(((phPxR * phPxR) + (phPyR * phPyR)));
                            if ((phMag > EPSILON)) {
                                const invPhMag = (1.0 / phMag);
                                const phCos = (phPxR * invPhMag);
                                const phSin = (phPyR * invPhMag);
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (piDecayPosX2 + (phCos * emitOffset));
                                    ph_posY = (piDecayPosY2 + (phSin * emitOffset));
                                    ph_velX = phCos;
                                    ph_velY = phSin;
                                    ph_energy = phMag;
                                    ph_emitterId = piDecayEmitter2;
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
                            if ((elELab > EPSILON)) {
                                const lepIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                if ((lepIdx < PION_POOL_CAP)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    const _sroa_43 = {x:((phMag > EPSILON) ? (phPxR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 1.0), y:((phMag > EPSILON) ? (phPyR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 0.0)};
                                    const phDir_x = _sroa_43.x;
                                    const phDir_y = _sroa_43.y;
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
                                    lep_posX = (piDecayPosX2 - (phDir_x * emitOffset));
                                    lep_posY = (piDecayPosY2 - (phDir_y * emitOffset));
                                    lep_wX = elPxR;
                                    lep_wY = elPyR;
                                    lep_mass = ELECTRON_MASS;
                                    lep_charge = piDecayCharge;
                                    lep_energy = 0.0;
                                    lep_emitterId = piDecayEmitter2;
                                    lep_age = 0;
                                    lep_flags = 1;
                                    lep_kind = 1;
                                    lep__pad1 = 0;
                                    {
                                        const _wbase = ((lepIdx) * 12);
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
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                }
                            }
                        }
                    }
                    {
                        const _wbase = ((i) * 12 + 9) - 9;
                        _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
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
                            const count = _b_piCount[0];
                            if ((i >= count)) {
                                break __invocation;
                            }
                            const _sroa_44_base = ((i) * 12);
                            const piState_posX = _b_pions[_sroa_44_base + 0];
                            const piState_posY = _b_pions[_sroa_44_base + 1];
                            const piState_wX = _b_pions[_sroa_44_base + 2];
                            const piState_wY = _b_pions[_sroa_44_base + 3];
                            const piState_mass = _b_pions[_sroa_44_base + 4];
                            const piState_charge = _b_pions[_sroa_44_base + 5];
                            const piState_energy = _b_pions[_sroa_44_base + 6];
                            const piState_emitterId = _b_pions[_sroa_44_base + 7];
                            const piState_age = _b_pions[_sroa_44_base + 8];
                            const piState_flags = _b_pions[_sroa_44_base + 9];
                            const piState_kind = _b_pions[_sroa_44_base + 10];
                            const piState__pad1 = _b_pions[_sroa_44_base + 11];
                            if ((((piState_flags & 1)) == 0)) {
                                break __invocation;
                            }
                            if ((piState_kind != 0)) {
                                break __invocation;
                            }
                            const isNeutral = (Math.abs(piState_charge) < EPSILON);
                            const baseProb = (isNeutral ? PION_DECAY_PROB : CHARGED_PION_DECAY_PROB);
                            const ticks = (((_u_u_dt / PHYSICS_DT)) < (1.0) ? (1.0) : ((_u_u_dt / PHYSICS_DT)));
                            const prob = (1.0 - Math.pow((1.0 - baseProb), ticks));
                            const _inl_24_seed = (((i * 73856093)) ^ ((_u_u_frameCount * 19349663)));
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
                            const rng = _inl_24_result;
                            if ((rng > prob)) {
                                break __invocation;
                            }
                            const mPi = piState_mass;
                            const wx = piState_wX;
                            const wy = piState_wY;
                            const wSq = ((wx * wx) + (wy * wy));
                            const gamma = Math.sqrt((1.0 + wSq));
                            const invG = (1.0 / gamma);
                            const vx = (wx * invG);
                            const vy = (wy * invG);
                            const vSq = ((vx * vx) + (vy * vy));
                            if (isNeutral) {
                                const _inl_25_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xBEEF);
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
                                const rng2 = _inl_25_result;
                                const restAngle = (rng2 * TWO_PI);
                                const cosR = Math.cos(restAngle);
                                const sinR = Math.sin(restAngle);
                                const eRest = (mPi * 0.5);
                                const piDecayPosX = piState_posX;
                                const piDecayPosY = piState_posY;
                                const piDecayEmitter = piState_emitterId;
                                for (let s = 0; (s < 2); s++) {
                                    const sign = ((s == 0) ? 1.0 : (-1.0));
                                    let pxR = ((sign * eRest) * cosR);
                                    let pyR = ((sign * eRest) * sinR);
                                    if ((vSq > 1e-12)) {
                                        const v = Math.sqrt(vSq);
                                        const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                        const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                        const nx = (vx / v);
                                        const ny = (vy / v);
                                        const pPar = ((pxR * nx) + (pyR * ny));
                                        const pPerpX = (pxR - (pPar * nx));
                                        const pPerpY = (pyR - (pPar * ny));
                                        const pParB = (gammaB * ((pPar + (v * eRest))));
                                        pxR = ((pParB * nx) + pPerpX);
                                        pyR = ((pParB * ny) + pPerpY);
                                    }
                                    const pMag = Math.sqrt(((pxR * pxR) + (pyR * pyR)));
                                    if ((pMag < EPSILON)) {
                                        continue;
                                    }
                                    const invPMag = (1.0 / pMag);
                                    const cosA = (pxR * invPMag);
                                    const sinA = (pyR * invPMag);
                                    const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                    if ((phIdx < MAX_PHOTONS)) {
                                        const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                        let ph_posX = 0;
                                        let ph_posY = 0;
                                        let ph_velX = 0;
                                        let ph_velY = 0;
                                        let ph_energy = 0;
                                        let ph_emitterId = 0;
                                        let ph_lifetime = 0;
                                        let ph_flags = 0;
                                        ph_posX = (piDecayPosX + (cosA * emitOffset));
                                        ph_posY = (piDecayPosY + (sinA * emitOffset));
                                        ph_velX = cosA;
                                        ph_velY = sinA;
                                        ph_energy = pMag;
                                        ph_emitterId = piDecayEmitter;
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
                            } else {
                                const mE = ELECTRON_MASS;
                                const piDecayPosX2 = piState_posX;
                                const piDecayPosY2 = piState_posY;
                                const piDecayEmitter2 = piState_emitterId;
                                const piDecayEnergy = piState_energy;
                                const piDecayCharge = piState_charge;
                                if ((mPi <= mE)) {
                                    const angle = Math.atan2(vy, vx);
                                    const cosA = Math.cos(angle);
                                    const sinA = Math.sin(angle);
                                    const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                    if ((phIdx < MAX_PHOTONS)) {
                                        const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                        let ph_posX = 0;
                                        let ph_posY = 0;
                                        let ph_velX = 0;
                                        let ph_velY = 0;
                                        let ph_energy = 0;
                                        let ph_emitterId = 0;
                                        let ph_lifetime = 0;
                                        let ph_flags = 0;
                                        ph_posX = (piDecayPosX2 + (cosA * emitOffset));
                                        ph_posY = (piDecayPosY2 + (sinA * emitOffset));
                                        ph_velX = cosA;
                                        ph_velY = sinA;
                                        ph_energy = piDecayEnergy;
                                        ph_emitterId = piDecayEmitter2;
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
                                } else {
                                    const ePhRest = ((((mPi * mPi) - (mE * mE))) / ((2.0 * mPi)));
                                    const eElRest = (mPi - ePhRest);
                                    const pRest = ePhRest;
                                    const _inl_26_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xCAFE);
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
                                    const rng3 = _inl_26_result;
                                    const restAngle2 = (rng3 * TWO_PI);
                                    const cosR = Math.cos(restAngle2);
                                    const sinR = Math.sin(restAngle2);
                                    let phPxR = (pRest * cosR);
                                    let phPyR = (pRest * sinR);
                                    let elPxR = ((-pRest) * cosR);
                                    let elPyR = ((-pRest) * sinR);
                                    let elELab = eElRest;
                                    if ((vSq > 1e-12)) {
                                        const v = Math.sqrt(vSq);
                                        const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                        const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                        const nx = (vx / v);
                                        const ny = (vy / v);
                                        const phPar = ((phPxR * nx) + (phPyR * ny));
                                        const phPerpX = (phPxR - (phPar * nx));
                                        const phPerpY = (phPyR - (phPar * ny));
                                        const phParB = (gammaB * ((phPar + (v * ePhRest))));
                                        phPxR = ((phParB * nx) + phPerpX);
                                        phPyR = ((phParB * ny) + phPerpY);
                                        const elPar = ((elPxR * nx) + (elPyR * ny));
                                        const elPerpX = (elPxR - (elPar * nx));
                                        const elPerpY = (elPyR - (elPar * ny));
                                        const elParB = (gammaB * ((elPar + (v * eElRest))));
                                        elPxR = ((elParB * nx) + elPerpX);
                                        elPyR = ((elParB * ny) + elPerpY);
                                        elELab = (gammaB * ((eElRest + (v * elPar))));
                                    }
                                    const phMag = Math.sqrt(((phPxR * phPxR) + (phPyR * phPyR)));
                                    if ((phMag > EPSILON)) {
                                        const invPhMag = (1.0 / phMag);
                                        const phCos = (phPxR * invPhMag);
                                        const phSin = (phPyR * invPhMag);
                                        const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                        if ((phIdx < MAX_PHOTONS)) {
                                            const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                            let ph_posX = 0;
                                            let ph_posY = 0;
                                            let ph_velX = 0;
                                            let ph_velY = 0;
                                            let ph_energy = 0;
                                            let ph_emitterId = 0;
                                            let ph_lifetime = 0;
                                            let ph_flags = 0;
                                            ph_posX = (piDecayPosX2 + (phCos * emitOffset));
                                            ph_posY = (piDecayPosY2 + (phSin * emitOffset));
                                            ph_velX = phCos;
                                            ph_velY = phSin;
                                            ph_energy = phMag;
                                            ph_emitterId = piDecayEmitter2;
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
                                    if ((elELab > EPSILON)) {
                                        const lepIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                        if ((lepIdx < PION_POOL_CAP)) {
                                            const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                            const _sroa_45 = {x:((phMag > EPSILON) ? (phPxR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 1.0), y:((phMag > EPSILON) ? (phPyR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 0.0)};
                                            const phDir_x = _sroa_45.x;
                                            const phDir_y = _sroa_45.y;
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
                                            lep_posX = (piDecayPosX2 - (phDir_x * emitOffset));
                                            lep_posY = (piDecayPosY2 - (phDir_y * emitOffset));
                                            lep_wX = elPxR;
                                            lep_wY = elPyR;
                                            lep_mass = ELECTRON_MASS;
                                            lep_charge = piDecayCharge;
                                            lep_energy = 0.0;
                                            lep_emitterId = piDecayEmitter2;
                                            lep_age = 0;
                                            lep_flags = 1;
                                            lep_kind = 1;
                                            lep__pad1 = 0;
                                            {
                                                const _wbase = ((lepIdx) * 12);
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
                                        } else {
                                            (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                        }
                                    }
                                }
                            }
                            {
                                const _wbase = ((i) * 12 + 9) - 9;
                                _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
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
                        const count = _b_piCount[0];
                        if ((i >= count)) {
                            break __invocation;
                        }
                        const _sroa_46_base = ((i) * 12);
                        const piState_posX = _b_pions[_sroa_46_base + 0];
                        const piState_posY = _b_pions[_sroa_46_base + 1];
                        const piState_wX = _b_pions[_sroa_46_base + 2];
                        const piState_wY = _b_pions[_sroa_46_base + 3];
                        const piState_mass = _b_pions[_sroa_46_base + 4];
                        const piState_charge = _b_pions[_sroa_46_base + 5];
                        const piState_energy = _b_pions[_sroa_46_base + 6];
                        const piState_emitterId = _b_pions[_sroa_46_base + 7];
                        const piState_age = _b_pions[_sroa_46_base + 8];
                        const piState_flags = _b_pions[_sroa_46_base + 9];
                        const piState_kind = _b_pions[_sroa_46_base + 10];
                        const piState__pad1 = _b_pions[_sroa_46_base + 11];
                        if ((((piState_flags & 1)) == 0)) {
                            break __invocation;
                        }
                        if ((piState_kind != 0)) {
                            break __invocation;
                        }
                        const isNeutral = (Math.abs(piState_charge) < EPSILON);
                        const baseProb = (isNeutral ? PION_DECAY_PROB : CHARGED_PION_DECAY_PROB);
                        const ticks = (((_u_u_dt / PHYSICS_DT)) < (1.0) ? (1.0) : ((_u_u_dt / PHYSICS_DT)));
                        const prob = (1.0 - Math.pow((1.0 - baseProb), ticks));
                        const _inl_24_seed = (((i * 73856093)) ^ ((_u_u_frameCount * 19349663)));
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
                        const rng = _inl_24_result;
                        if ((rng > prob)) {
                            break __invocation;
                        }
                        const mPi = piState_mass;
                        const wx = piState_wX;
                        const wy = piState_wY;
                        const wSq = ((wx * wx) + (wy * wy));
                        const gamma = Math.sqrt((1.0 + wSq));
                        const invG = (1.0 / gamma);
                        const vx = (wx * invG);
                        const vy = (wy * invG);
                        const vSq = ((vx * vx) + (vy * vy));
                        if (isNeutral) {
                            const _inl_25_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xBEEF);
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
                            const rng2 = _inl_25_result;
                            const restAngle = (rng2 * TWO_PI);
                            const cosR = Math.cos(restAngle);
                            const sinR = Math.sin(restAngle);
                            const eRest = (mPi * 0.5);
                            const piDecayPosX = piState_posX;
                            const piDecayPosY = piState_posY;
                            const piDecayEmitter = piState_emitterId;
                            for (let s = 0; (s < 2); s++) {
                                const sign = ((s == 0) ? 1.0 : (-1.0));
                                let pxR = ((sign * eRest) * cosR);
                                let pyR = ((sign * eRest) * sinR);
                                if ((vSq > 1e-12)) {
                                    const v = Math.sqrt(vSq);
                                    const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                    const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                    const nx = (vx / v);
                                    const ny = (vy / v);
                                    const pPar = ((pxR * nx) + (pyR * ny));
                                    const pPerpX = (pxR - (pPar * nx));
                                    const pPerpY = (pyR - (pPar * ny));
                                    const pParB = (gammaB * ((pPar + (v * eRest))));
                                    pxR = ((pParB * nx) + pPerpX);
                                    pyR = ((pParB * ny) + pPerpY);
                                }
                                const pMag = Math.sqrt(((pxR * pxR) + (pyR * pyR)));
                                if ((pMag < EPSILON)) {
                                    continue;
                                }
                                const invPMag = (1.0 / pMag);
                                const cosA = (pxR * invPMag);
                                const sinA = (pyR * invPMag);
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (piDecayPosX + (cosA * emitOffset));
                                    ph_posY = (piDecayPosY + (sinA * emitOffset));
                                    ph_velX = cosA;
                                    ph_velY = sinA;
                                    ph_energy = pMag;
                                    ph_emitterId = piDecayEmitter;
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
                        } else {
                            const mE = ELECTRON_MASS;
                            const piDecayPosX2 = piState_posX;
                            const piDecayPosY2 = piState_posY;
                            const piDecayEmitter2 = piState_emitterId;
                            const piDecayEnergy = piState_energy;
                            const piDecayCharge = piState_charge;
                            if ((mPi <= mE)) {
                                const angle = Math.atan2(vy, vx);
                                const cosA = Math.cos(angle);
                                const sinA = Math.sin(angle);
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (piDecayPosX2 + (cosA * emitOffset));
                                    ph_posY = (piDecayPosY2 + (sinA * emitOffset));
                                    ph_velX = cosA;
                                    ph_velY = sinA;
                                    ph_energy = piDecayEnergy;
                                    ph_emitterId = piDecayEmitter2;
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
                            } else {
                                const ePhRest = ((((mPi * mPi) - (mE * mE))) / ((2.0 * mPi)));
                                const eElRest = (mPi - ePhRest);
                                const pRest = ePhRest;
                                const _inl_26_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xCAFE);
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
                                const rng3 = _inl_26_result;
                                const restAngle2 = (rng3 * TWO_PI);
                                const cosR = Math.cos(restAngle2);
                                const sinR = Math.sin(restAngle2);
                                let phPxR = (pRest * cosR);
                                let phPyR = (pRest * sinR);
                                let elPxR = ((-pRest) * cosR);
                                let elPyR = ((-pRest) * sinR);
                                let elELab = eElRest;
                                if ((vSq > 1e-12)) {
                                    const v = Math.sqrt(vSq);
                                    const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                    const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                    const nx = (vx / v);
                                    const ny = (vy / v);
                                    const phPar = ((phPxR * nx) + (phPyR * ny));
                                    const phPerpX = (phPxR - (phPar * nx));
                                    const phPerpY = (phPyR - (phPar * ny));
                                    const phParB = (gammaB * ((phPar + (v * ePhRest))));
                                    phPxR = ((phParB * nx) + phPerpX);
                                    phPyR = ((phParB * ny) + phPerpY);
                                    const elPar = ((elPxR * nx) + (elPyR * ny));
                                    const elPerpX = (elPxR - (elPar * nx));
                                    const elPerpY = (elPyR - (elPar * ny));
                                    const elParB = (gammaB * ((elPar + (v * eElRest))));
                                    elPxR = ((elParB * nx) + elPerpX);
                                    elPyR = ((elParB * ny) + elPerpY);
                                    elELab = (gammaB * ((eElRest + (v * elPar))));
                                }
                                const phMag = Math.sqrt(((phPxR * phPxR) + (phPyR * phPyR)));
                                if ((phMag > EPSILON)) {
                                    const invPhMag = (1.0 / phMag);
                                    const phCos = (phPxR * invPhMag);
                                    const phSin = (phPyR * invPhMag);
                                    const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                    if ((phIdx < MAX_PHOTONS)) {
                                        const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                        let ph_posX = 0;
                                        let ph_posY = 0;
                                        let ph_velX = 0;
                                        let ph_velY = 0;
                                        let ph_energy = 0;
                                        let ph_emitterId = 0;
                                        let ph_lifetime = 0;
                                        let ph_flags = 0;
                                        ph_posX = (piDecayPosX2 + (phCos * emitOffset));
                                        ph_posY = (piDecayPosY2 + (phSin * emitOffset));
                                        ph_velX = phCos;
                                        ph_velY = phSin;
                                        ph_energy = phMag;
                                        ph_emitterId = piDecayEmitter2;
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
                                if ((elELab > EPSILON)) {
                                    const lepIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                    if ((lepIdx < PION_POOL_CAP)) {
                                        const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                        const _sroa_47 = {x:((phMag > EPSILON) ? (phPxR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 1.0), y:((phMag > EPSILON) ? (phPyR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 0.0)};
                                        const phDir_x = _sroa_47.x;
                                        const phDir_y = _sroa_47.y;
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
                                        lep_posX = (piDecayPosX2 - (phDir_x * emitOffset));
                                        lep_posY = (piDecayPosY2 - (phDir_y * emitOffset));
                                        lep_wX = elPxR;
                                        lep_wY = elPyR;
                                        lep_mass = ELECTRON_MASS;
                                        lep_charge = piDecayCharge;
                                        lep_energy = 0.0;
                                        lep_emitterId = piDecayEmitter2;
                                        lep_age = 0;
                                        lep_flags = 1;
                                        lep_kind = 1;
                                        lep__pad1 = 0;
                                        {
                                            const _wbase = ((lepIdx) * 12);
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
                                    } else {
                                        (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                    }
                                }
                            }
                        }
                        {
                            const _wbase = ((i) * 12 + 9) - 9;
                            _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
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
                    const count = _b_piCount[0];
                    if ((i >= count)) {
                        break __invocation;
                    }
                    const _sroa_48_base = ((i) * 12);
                    const piState_posX = _b_pions[_sroa_48_base + 0];
                    const piState_posY = _b_pions[_sroa_48_base + 1];
                    const piState_wX = _b_pions[_sroa_48_base + 2];
                    const piState_wY = _b_pions[_sroa_48_base + 3];
                    const piState_mass = _b_pions[_sroa_48_base + 4];
                    const piState_charge = _b_pions[_sroa_48_base + 5];
                    const piState_energy = _b_pions[_sroa_48_base + 6];
                    const piState_emitterId = _b_pions[_sroa_48_base + 7];
                    const piState_age = _b_pions[_sroa_48_base + 8];
                    const piState_flags = _b_pions[_sroa_48_base + 9];
                    const piState_kind = _b_pions[_sroa_48_base + 10];
                    const piState__pad1 = _b_pions[_sroa_48_base + 11];
                    if ((((piState_flags & 1)) == 0)) {
                        break __invocation;
                    }
                    if ((piState_kind != 0)) {
                        break __invocation;
                    }
                    const isNeutral = (Math.abs(piState_charge) < EPSILON);
                    const baseProb = (isNeutral ? PION_DECAY_PROB : CHARGED_PION_DECAY_PROB);
                    const ticks = (((_u_u_dt / PHYSICS_DT)) < (1.0) ? (1.0) : ((_u_u_dt / PHYSICS_DT)));
                    const prob = (1.0 - Math.pow((1.0 - baseProb), ticks));
                    const _inl_24_seed = (((i * 73856093)) ^ ((_u_u_frameCount * 19349663)));
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
                    const rng = _inl_24_result;
                    if ((rng > prob)) {
                        break __invocation;
                    }
                    const mPi = piState_mass;
                    const wx = piState_wX;
                    const wy = piState_wY;
                    const wSq = ((wx * wx) + (wy * wy));
                    const gamma = Math.sqrt((1.0 + wSq));
                    const invG = (1.0 / gamma);
                    const vx = (wx * invG);
                    const vy = (wy * invG);
                    const vSq = ((vx * vx) + (vy * vy));
                    if (isNeutral) {
                        const _inl_25_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xBEEF);
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
                        const rng2 = _inl_25_result;
                        const restAngle = (rng2 * TWO_PI);
                        const cosR = Math.cos(restAngle);
                        const sinR = Math.sin(restAngle);
                        const eRest = (mPi * 0.5);
                        const piDecayPosX = piState_posX;
                        const piDecayPosY = piState_posY;
                        const piDecayEmitter = piState_emitterId;
                        for (let s = 0; (s < 2); s++) {
                            const sign = ((s == 0) ? 1.0 : (-1.0));
                            let pxR = ((sign * eRest) * cosR);
                            let pyR = ((sign * eRest) * sinR);
                            if ((vSq > 1e-12)) {
                                const v = Math.sqrt(vSq);
                                const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                const nx = (vx / v);
                                const ny = (vy / v);
                                const pPar = ((pxR * nx) + (pyR * ny));
                                const pPerpX = (pxR - (pPar * nx));
                                const pPerpY = (pyR - (pPar * ny));
                                const pParB = (gammaB * ((pPar + (v * eRest))));
                                pxR = ((pParB * nx) + pPerpX);
                                pyR = ((pParB * ny) + pPerpY);
                            }
                            const pMag = Math.sqrt(((pxR * pxR) + (pyR * pyR)));
                            if ((pMag < EPSILON)) {
                                continue;
                            }
                            const invPMag = (1.0 / pMag);
                            const cosA = (pxR * invPMag);
                            const sinA = (pyR * invPMag);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (piDecayPosX + (cosA * emitOffset));
                                ph_posY = (piDecayPosY + (sinA * emitOffset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = pMag;
                                ph_emitterId = piDecayEmitter;
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
                    } else {
                        const mE = ELECTRON_MASS;
                        const piDecayPosX2 = piState_posX;
                        const piDecayPosY2 = piState_posY;
                        const piDecayEmitter2 = piState_emitterId;
                        const piDecayEnergy = piState_energy;
                        const piDecayCharge = piState_charge;
                        if ((mPi <= mE)) {
                            const angle = Math.atan2(vy, vx);
                            const cosA = Math.cos(angle);
                            const sinA = Math.sin(angle);
                            const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                            if ((phIdx < MAX_PHOTONS)) {
                                const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                let ph_posX = 0;
                                let ph_posY = 0;
                                let ph_velX = 0;
                                let ph_velY = 0;
                                let ph_energy = 0;
                                let ph_emitterId = 0;
                                let ph_lifetime = 0;
                                let ph_flags = 0;
                                ph_posX = (piDecayPosX2 + (cosA * emitOffset));
                                ph_posY = (piDecayPosY2 + (sinA * emitOffset));
                                ph_velX = cosA;
                                ph_velY = sinA;
                                ph_energy = piDecayEnergy;
                                ph_emitterId = piDecayEmitter2;
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
                        } else {
                            const ePhRest = ((((mPi * mPi) - (mE * mE))) / ((2.0 * mPi)));
                            const eElRest = (mPi - ePhRest);
                            const pRest = ePhRest;
                            const _inl_26_seed = ((((i * 48271)) ^ ((_u_u_frameCount * 40692))) ^ 0xCAFE);
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
                            const rng3 = _inl_26_result;
                            const restAngle2 = (rng3 * TWO_PI);
                            const cosR = Math.cos(restAngle2);
                            const sinR = Math.sin(restAngle2);
                            let phPxR = (pRest * cosR);
                            let phPyR = (pRest * sinR);
                            let elPxR = ((-pRest) * cosR);
                            let elPyR = ((-pRest) * sinR);
                            let elELab = eElRest;
                            if ((vSq > 1e-12)) {
                                const v = Math.sqrt(vSq);
                                const clampedVSq = (((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) < (vSq) ? ((MAX_SPEED_RATIO * MAX_SPEED_RATIO)) : (vSq));
                                const gammaB = (1.0 / Math.sqrt((((1.0 - clampedVSq)) < (EPSILON) ? (EPSILON) : ((1.0 - clampedVSq)))));
                                const nx = (vx / v);
                                const ny = (vy / v);
                                const phPar = ((phPxR * nx) + (phPyR * ny));
                                const phPerpX = (phPxR - (phPar * nx));
                                const phPerpY = (phPyR - (phPar * ny));
                                const phParB = (gammaB * ((phPar + (v * ePhRest))));
                                phPxR = ((phParB * nx) + phPerpX);
                                phPyR = ((phParB * ny) + phPerpY);
                                const elPar = ((elPxR * nx) + (elPyR * ny));
                                const elPerpX = (elPxR - (elPar * nx));
                                const elPerpY = (elPyR - (elPar * ny));
                                const elParB = (gammaB * ((elPar + (v * eElRest))));
                                elPxR = ((elParB * nx) + elPerpX);
                                elPyR = ((elParB * ny) + elPerpY);
                                elELab = (gammaB * ((eElRest + (v * elPar))));
                            }
                            const phMag = Math.sqrt(((phPxR * phPxR) + (phPyR * phPyR)));
                            if ((phMag > EPSILON)) {
                                const invPhMag = (1.0 / phMag);
                                const phCos = (phPxR * invPhMag);
                                const phSin = (phPyR * invPhMag);
                                const phIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_phCount, 0, 1));
                                if ((phIdx < MAX_PHOTONS)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    let ph_posX = 0;
                                    let ph_posY = 0;
                                    let ph_velX = 0;
                                    let ph_velY = 0;
                                    let ph_energy = 0;
                                    let ph_emitterId = 0;
                                    let ph_lifetime = 0;
                                    let ph_flags = 0;
                                    ph_posX = (piDecayPosX2 + (phCos * emitOffset));
                                    ph_posY = (piDecayPosY2 + (phSin * emitOffset));
                                    ph_velX = phCos;
                                    ph_velY = phSin;
                                    ph_energy = phMag;
                                    ph_emitterId = piDecayEmitter2;
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
                            if ((elELab > EPSILON)) {
                                const lepIdx = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(_b_piCount, 0, 1));
                                if ((lepIdx < PION_POOL_CAP)) {
                                    const emitOffset = (((mPi * 1.5)) < (1.0) ? (1.0) : ((mPi * 1.5)));
                                    const _sroa_49 = {x:((phMag > EPSILON) ? (phPxR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 1.0), y:((phMag > EPSILON) ? (phPyR / ((phMag) < (EPSILON) ? (EPSILON) : (phMag))) : 0.0)};
                                    const phDir_x = _sroa_49.x;
                                    const phDir_y = _sroa_49.y;
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
                                    lep_posX = (piDecayPosX2 - (phDir_x * emitOffset));
                                    lep_posY = (piDecayPosY2 - (phDir_y * emitOffset));
                                    lep_wX = elPxR;
                                    lep_wY = elPyR;
                                    lep_mass = ELECTRON_MASS;
                                    lep_charge = piDecayCharge;
                                    lep_energy = 0.0;
                                    lep_emitterId = piDecayEmitter2;
                                    lep_age = 0;
                                    lep_flags = 1;
                                    lep_kind = 1;
                                    lep__pad1 = 0;
                                    {
                                        const _wbase = ((lepIdx) * 12);
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
                                } else {
                                    (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o - _v; return _o; })(_b_piCount, 0, 1));
                                }
                            }
                        }
                    }
                    {
                        const _wbase = ((i) * 12 + 9) - 9;
                        _b_pions[_wbase + 9] = (_b_pions[_wbase + 9] & (~1));
                    }
                }
            }
        }
    }
    entry["decayPions"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_4_decayPions(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["updatePhotons"] = function (workgroups, domain, origin) {
            return __entry_0_updatePhotons(workgroups, bindings, domain, origin);
        };
        bound["updatePions"] = function (workgroups, domain, origin) {
            return __entry_1_updatePions(workgroups, bindings, domain, origin);
        };
        bound["absorbPhotons"] = function (workgroups, domain, origin) {
            return __entry_2_absorbPhotons(workgroups, bindings, domain, origin);
        };
        bound["absorbPions"] = function (workgroups, domain, origin) {
            return __entry_3_absorbPions(workgroups, bindings, domain, origin);
        };
        bound["decayPions"] = function (workgroups, domain, origin) {
            return __entry_4_decayPions(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["u","aliveCountAtomic","particles","particleAux","photons","phCount","pions","piCount"], entryInfo };
}
