// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: geon/src/gpu/shaders/ghost-gen.wgsl
// helpers-sha256: 165cb4ebb9e35e86beab2561fee3a1f79d834c73f5b65aae6134ec1b4a163356
// wgsl-transpile sha256: 8c0c6bf8192edf0c9043f2b9b0e60264f111745e676d610be6c3d4137643d105
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"prependSource":"// ── Auto-generated from config.js + _PALETTE ──\n\n// Physics constants\nconst SOFTENING: f32 = 8.0;\nconst SOFTENING_SQ: f32 = 64.0;\nconst BH_SOFTENING: f32 = 4.0;\nconst BH_SOFTENING_SQ: f32 = 16.0;\nconst INERTIA_K: f32 = 0.4;\nconst MAG_MOMENT_K: f32 = 0.2;\nconst TIDAL_STRENGTH: f32 = 64.0;\nconst YUKAWA_COUPLING: f32 = 14.0;\nconst AXION_COUPLING: f32 = 0.05;\nconst HIGGS_AXION_COUPLING: f32 = 0.01;\nconst HIGGS_MASS_FLOOR: f32 = 0.05;\nconst EPSILON: f32 = 0.000001;\nconst PI: f32 = 3.14159265358979;\nconst TWO_PI: f32 = 6.28318530717959;\nconst HALF_PI: f32 = 1.5707963268;\nconst BOSON_SOFTENING_SQ: f32 = 4.0;\nconst BOSON_MIN_AGE: u32 = 4u;\nconst BOSON_MIN_AGE_TIME: f32 = 0.03125;\nconst MAX_QUAD_WG: u32 = 8u;\nconst PHYSICS_DT: f32 = 0.0078125;\nconst MIN_MASS: f32 = 0.05;\nconst SCHWINGER_E_CR: f32 = ELECTRON_MASS * ELECTRON_MASS / BOSON_CHARGE;  // m_e²/e\nconst SCHWINGER_COEFF: f32 = BOSON_CHARGE * BOSON_CHARGE / (PI * PI);     // e²/π² (rate×area baked in)\nconst ELECTRON_MASS: f32 = 0.01;\nconst BOSON_CHARGE: f32 = 0.1;\nconst MAX_SPEED_RATIO: f32 = 0.999;\nconst PION_DECAY_PROB: f32 = 0.0001692110680708847;\nconst CHARGED_PION_DECAY_PROB: f32 = 0.00008460911338648014;\nconst BH_THETA: f32 = 0.5;\nconst BH_THETA_SQ: f32 = 0.25;\nconst VELOCITY_VECTOR_SCALE: f32 = 32.0;\n\n// Capacity constants\nconst MAX_PARTICLES: u32 = 512u;\nconst MAX_PHOTONS: u32 = 4096u;\nconst MAX_PIONS: u32 = 1024u;\nconst MAX_LEPTONS: u32 = 1024u;\nconst LEPTON_LIFETIME: f32 = 512.0;\nconst PION_POOL_CAP: u32 = 2048u;\nconst MAX_GHOSTS: u32 = 512u;\nconst PHOTON_LIFETIME: f32 = 256.0;\nconst MAX_REJECTION_SAMPLES: u32 = 32u;\nconst SPAWN_OFFSET_MUL: f32 = 1.5;\nconst SPAWN_OFFSET_FLOOR: f32 = 1.0;\nconst ABERRATION_THRESHOLD: f32 = 1.001;\nconst ABERRATION_CLAMP_MIN: f32 = 0.01;\nconst ABERRATION_CLAMP_MAX: f32 = 100.0;\n\n// Grid constants\nconst GRID: u32 = 128u;\nconst GRID_SQ: u32 = 16384u;\nconst GRID_LAST: u32 = 127u;\nconst SCALAR_FIELD_MAX: f32 = 2.0;\nconst FIELD_EXCITATION_SIGMA: f32 = 2.0;\nconst SELFGRAV_PHI_MAX: f32 = 0.25;\nconst HGRID: u32 = 128u;\nconst HGRID_SQ: u32 = 16384u;\n\n// Signal delay / history / trails\nconst HISTORY_LEN: u32 = 256u;\nconst HISTORY_MASK: u32 = 255u;\nconst HIST_STRIDE: u32 = 6u;       // interleaved: posX, posY, velX, velY, angW, time\nconst HIST_META_STRIDE: u32 = 4u;  // writeIdx, count, creationTimeBits, _pad\nconst TRAIL_LEN: u32 = 256u;\n\n// Boundary mode enums\nconst BOUND_DESPAWN: u32 = 0u;\nconst BOUND_BOUNCE: u32 = 1u;\nconst BOUND_LOOP: u32 = 2u;\n\n// Topology enums (both naming conventions)\nconst TOPO_TORUS: u32 = 0u;\nconst TOPO_KLEIN: u32 = 1u;\nconst TOPO_RP2: u32 = 2u;\nconst TORUS: u32 = 0u;\nconst KLEIN: u32 = 1u;\nconst RP2: u32 = 2u;\n\n// Collision mode enums\nconst COL_PASS: u32 = 0u;\nconst COL_MERGE: u32 = 1u;\nconst COL_BOUNCE: u32 = 2u;\n\n// Particle flag bits (standardized FLAG_* prefix)\nconst FLAG_ALIVE: u32 = 1u;\nconst FLAG_RETIRED: u32 = 2u;\nconst FLAG_ANTIMATTER: u32 = 4u;\nconst FLAG_BH: u32 = 8u;\nconst FLAG_GHOST: u32 = 16u;\nconst FLAG_REBORN: u32 = 32u;\nconst FLAG_DEATH_HIST: u32 = 64u;\n\n// Toggle bit constants (toggles0)\nconst GRAVITY_BIT: u32 = 1u;\nconst COULOMB_BIT: u32 = 2u;\nconst MAGNETIC_BIT: u32 = 4u;\nconst GRAVITOMAG_BIT: u32 = 8u;\nconst ONE_PN_BIT: u32 = 16u;\nconst RELATIVITY_BIT: u32 = 32u;\nconst SPIN_ORBIT_BIT: u32 = 64u;\nconst RADIATION_BIT: u32 = 128u;\nconst BLACK_HOLE_BIT: u32 = 256u;\nconst DISINTEGRATION_BIT: u32 = 512u;\nconst EXPANSION_BIT: u32 = 1024u;\nconst YUKAWA_BIT: u32 = 2048u;\nconst HIGGS_BIT: u32 = 4096u;\nconst AXION_BIT: u32 = 8192u;\nconst BARNES_HUT_BIT: u32 = 16384u;\nconst BOSON_INTER_BIT: u32 = 32768u;\n\n// Toggle bit constants (toggles1)\nconst FIELD_GRAV_BIT: u32 = 1u;\nconst HERTZ_BOUNCE_BIT: u32 = 2u;\n\n// Barnes-Hut tree constants\n// NOTE: QT_CAPACITY intentionally NOT included — GPU uses 1 (lock-free), CPU uses 4.\nconst MAX_DEPTH: u32 = 48u;\nconst QT_MAX_NODES: u32 = 3072u;\n\n// Boundary\nconst DESPAWN_MARGIN: f32 = 64.0;\n\n// Disintegration\nconst MAX_DISINT_EVENTS: u32 = 64u;\n\n// Kugelblitz collapse\nconst MIN_KUGELBLITZ_ENERGY: f32 = 0.2;\nconst MIN_KUGELBLITZ_COUNT: u32 = 4u;\n\n// Palette colors\nconst COLOR_SLATE: vec3f = vec3f(0.5019607843137255, 0.5254901960784314, 0.5882352941176471);\nconst COLOR_RED: vec3f = vec3f(0.8549019607843137, 0.3254901960784314, 0.30980392156862746);\nconst COLOR_BLUE: vec3f = vec3f(0.0, 0.5686274509803921, 0.788235294117647);\nconst COLOR_GREEN: vec3f = vec3f(0.0, 0.6235294117647059, 0.40784313725490196);\nconst COLOR_CYAN: vec3f = vec3f(0.0, 0.6039215686274509, 0.6039215686274509);\nconst COLOR_ORANGE: vec3f = vec3f(0.792156862745098, 0.40784313725490196, 0.0);\nconst COLOR_YELLOW: vec3f = vec3f(0.6, 0.5294117647058824, 0.0);\nconst COLOR_ROSE: vec3f = vec3f(0.8274509803921568, 0.3176470588235294, 0.5098039215686274);\nconst COLOR_PURPLE: vec3f = vec3f(0.592156862745098, 0.4117647058823529, 0.8627450980392157);\nconst COLOR_BROWN: vec3f = vec3f(0.7254901960784313, 0.4588235294117647, 0.0);\nconst COLOR_LIME: vec3f = vec3f(0.26666666666666666, 0.615686274509804, 0.1803921568627451);\nconst COLOR_INDIGO: vec3f = vec3f(0.4196078431372549, 0.4745098039215686, 0.9176470588235294);\nconst COLOR_MAGENTA: vec3f = vec3f(0.7411764705882353, 0.35294117647058826, 0.7137254901960784);\n\n// Theme colors\nconst COLOR_TEXT_LIGHT: vec3f = vec3f(0.00392156862745098, 0.00784313725490196, 0.011764705882352941);\nconst COLOR_TEXT_DARK: vec3f = vec3f(0.9568627450980393, 0.9607843137254902, 0.9764705882352941);\nconst COLOR_ACCENT: vec3f = vec3f(0.8823529411764706, 0.06666666666666667, 0.027450980392156862);\nconst COLOR_ACCENT_LIGHT: vec3f = vec3f(0.9137254901960784, 0.3176470588235294, 0.25882352941176473);\n\n// Spin ring colors (HSL-derived from palette hues, 80% sat, 60% lightness)\nconst COLOR_SPIN_CW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\nconst COLOR_SPIN_CCW: vec3f = vec3f(0.92, 0.2799999999999999, 0.0);\n\n"}
// wgsl-metrics: {"bytes":81783,"lines":936,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":1,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.840Z
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

    function appendGhost(gs, ga, dd, origIdx) {
        const slot = (((_r, _k, _v) => { const _o = _r[_k]; _r[_k] = _o + _v; return _o; })(bindings.ghostCounter, 0, 1));
        if ((slot >= MAX_GHOSTS)) {
            return;
        }
        {
            const _wbase = ((slot) * 9);
            const _stmp = gs;
            bindings.ghostState[_wbase + 0] = _stmp.posX;
            bindings.ghostState[_wbase + 1] = _stmp.posY;
            bindings.ghostState[_wbase + 2] = _stmp.velWX;
            bindings.ghostState[_wbase + 3] = _stmp.velWY;
            bindings.ghostState[_wbase + 4] = _stmp.mass;
            bindings.ghostState[_wbase + 5] = _stmp.charge;
            bindings.ghostState[_wbase + 6] = _stmp.angW;
            bindings.ghostState[_wbase + 7] = _stmp.baseMass;
            bindings.ghostState[_wbase + 8] = _stmp.flags;
        }
        {
            const _wbase = ((slot) * 5);
            const _stmp = ga;
            bindings.ghostAux[_wbase + 0] = _stmp.radius;
            bindings.ghostAux[_wbase + 1] = _stmp.particleId;
            bindings.ghostAux[_wbase + 2] = _stmp.deathTime;
            bindings.ghostAux[_wbase + 3] = _stmp.deathMass;
            bindings.ghostAux[_wbase + 4] = _stmp.deathAngVel;
        }
        {
            const _wbase = ((slot) * 8);
            const _stmp = dd;
            bindings.ghostDerived[_wbase + 0] = _stmp.magMoment;
            bindings.ghostDerived[_wbase + 1] = _stmp.angMomentum;
            bindings.ghostDerived[_wbase + 2] = _stmp.invMass;
            bindings.ghostDerived[_wbase + 3] = _stmp.radiusSq;
            bindings.ghostDerived[_wbase + 4] = _stmp.velX;
            bindings.ghostDerived[_wbase + 5] = _stmp.velY;
            bindings.ghostDerived[_wbase + 6] = _stmp.angVel;
            bindings.ghostDerived[_wbase + 7] = _stmp.bodyRSq;
        }
        bindings.ghostOriginalIdx[slot] = origIdx;
    }

    function makeGhostState(px, py, wx, wy, aw, m, q, bm) {
        let gs_posX = 0;
        let gs_posY = 0;
        let gs_velWX = 0;
        let gs_velWY = 0;
        let gs_mass = 0;
        let gs_charge = 0;
        let gs_angW = 0;
        let gs_baseMass = 0;
        let gs_flags = 0;
        gs_posX = px;
        gs_posY = py;
        gs_velWX = wx;
        gs_velWY = wy;
        gs_mass = m;
        gs_charge = q;
        gs_angW = aw;
        gs_baseMass = bm;
        gs_flags = (FLAG_ALIVE | FLAG_GHOST);
        return { posX: gs_posX, posY: gs_posY, velWX: gs_velWX, velWY: gs_velWY, mass: gs_mass, charge: gs_charge, angW: gs_angW, baseMass: gs_baseMass, flags: gs_flags };
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[64,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_particleState = bindings.particleState;
        const _b_derived_in = bindings.derived_in;
        const _b_particleAux_in = bindings.particleAux_in;
        const _b_uniforms = bindings.uniforms;
        const _u_uniforms_domainW = _b_uniforms.domainW;
        const _u_uniforms_domainH = _b_uniforms.domainH;
        const _u_uniforms_topologyMode = _b_uniforms.topologyMode;
        const _u_uniforms_aliveCount = _b_uniforms.aliveCount;
        const _u_uniforms_bhTheta = _b_uniforms.bhTheta;
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
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const W = _u_uniforms_domainW;
                    const H = _u_uniforms_domainH;
                    const margin = (((W) < (H) ? (H) : (W)) * _u_uniforms_bhTheta);
                    const topo = _u_uniforms_topologyMode;
                    const x = ps_posX;
                    const y = ps_posY;
                    const wx = ps_velWX;
                    const wy = ps_velWY;
                    const aw = ps_angW;
                    const m = ps_mass;
                    const q = ps_charge;
                    const bm = ps_baseMass;
                    const _sroa_1_base = ((idx) * 5);
                    const aux_radius = _b_particleAux_in[_sroa_1_base + 0];
                    const aux_particleId = _b_particleAux_in[_sroa_1_base + 1];
                    const aux_deathTime = _b_particleAux_in[_sroa_1_base + 2];
                    const aux_deathMass = _b_particleAux_in[_sroa_1_base + 3];
                    const aux_deathAngVel = _b_particleAux_in[_sroa_1_base + 4];
                    const r = aux_radius;
                    const pid = aux_particleId;
                    const _sroa_2_base = ((idx) * 8);
                    const dd_magMoment = _b_derived_in[_sroa_2_base + 0];
                    const dd_angMomentum = _b_derived_in[_sroa_2_base + 1];
                    const dd_invMass = _b_derived_in[_sroa_2_base + 2];
                    const dd_radiusSq = _b_derived_in[_sroa_2_base + 3];
                    const dd_velX = _b_derived_in[_sroa_2_base + 4];
                    const dd_velY = _b_derived_in[_sroa_2_base + 5];
                    const dd_angVel = _b_derived_in[_sroa_2_base + 6];
                    const dd_bodyRSq = _b_derived_in[_sroa_2_base + 7];
                    const mm = dd_magMoment;
                    const am = dd_angMomentum;
                    let ga_radius = 0;
                    let ga_particleId = 0;
                    let ga_deathTime = 0;
                    let ga_deathMass = 0;
                    let ga_deathAngVel = 0;
                    ga_radius = r;
                    ga_particleId = pid;
                    ga_deathTime = 0.0;
                    ga_deathMass = 0.0;
                    ga_deathAngVel = 0.0;
                    const nearL = (x < margin);
                    const nearR = (x > (W - margin));
                    const nearT = (y < margin);
                    const nearB = (y > (H - margin));
                    let ddKleinY_magMoment = dd_magMoment;
                    let ddKleinY_angMomentum = dd_angMomentum;
                    let ddKleinY_invMass = dd_invMass;
                    let ddKleinY_radiusSq = dd_radiusSq;
                    let ddKleinY_velX = dd_velX;
                    let ddKleinY_velY = dd_velY;
                    let ddKleinY_angVel = dd_angVel;
                    let ddKleinY_bodyRSq = dd_bodyRSq;
                    ddKleinY_velX = (-dd_velX);
                    ddKleinY_angVel = (-dd_angVel);
                    ddKleinY_magMoment = (-mm);
                    ddKleinY_angMomentum = (-am);
                    let ddRP2X_magMoment = dd_magMoment;
                    let ddRP2X_angMomentum = dd_angMomentum;
                    let ddRP2X_invMass = dd_invMass;
                    let ddRP2X_radiusSq = dd_radiusSq;
                    let ddRP2X_velX = dd_velX;
                    let ddRP2X_velY = dd_velY;
                    let ddRP2X_angVel = dd_angVel;
                    let ddRP2X_bodyRSq = dd_bodyRSq;
                    ddRP2X_velY = (-dd_velY);
                    ddRP2X_angVel = (-dd_angVel);
                    ddRP2X_magMoment = (-mm);
                    ddRP2X_angMomentum = (-am);
                    const ddRP2Y_magMoment = ddKleinY_magMoment;
                    const ddRP2Y_angMomentum = ddKleinY_angMomentum;
                    const ddRP2Y_invMass = ddKleinY_invMass;
                    const ddRP2Y_radiusSq = ddKleinY_radiusSq;
                    const ddRP2Y_velX = ddKleinY_velX;
                    const ddRP2Y_velY = ddKleinY_velY;
                    const ddRP2Y_angVel = ddKleinY_angVel;
                    const ddRP2Y_bodyRSq = ddKleinY_bodyRSq;
                    if ((topo == TOPO_TORUS)) {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState(x, (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState(x, (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState((x + W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState((x + W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState((x - W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState((x - W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                    } else if ((topo == TOPO_KLEIN)) {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                    } else {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
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
                            const idx = gid_x;
                            if ((idx >= _u_uniforms_aliveCount)) {
                                break __invocation;
                            }
                            const _sroa_3_base = ((idx) * 9);
                            const ps_posX = _b_particleState[_sroa_3_base + 0];
                            const ps_posY = _b_particleState[_sroa_3_base + 1];
                            const ps_velWX = _b_particleState[_sroa_3_base + 2];
                            const ps_velWY = _b_particleState[_sroa_3_base + 3];
                            const ps_mass = _b_particleState[_sroa_3_base + 4];
                            const ps_charge = _b_particleState[_sroa_3_base + 5];
                            const ps_angW = _b_particleState[_sroa_3_base + 6];
                            const ps_baseMass = _b_particleState[_sroa_3_base + 7];
                            const ps_flags = _b_particleState[_sroa_3_base + 8];
                            if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                                break __invocation;
                            }
                            const W = _u_uniforms_domainW;
                            const H = _u_uniforms_domainH;
                            const margin = (((W) < (H) ? (H) : (W)) * _u_uniforms_bhTheta);
                            const topo = _u_uniforms_topologyMode;
                            const x = ps_posX;
                            const y = ps_posY;
                            const wx = ps_velWX;
                            const wy = ps_velWY;
                            const aw = ps_angW;
                            const m = ps_mass;
                            const q = ps_charge;
                            const bm = ps_baseMass;
                            const _sroa_4_base = ((idx) * 5);
                            const aux_radius = _b_particleAux_in[_sroa_4_base + 0];
                            const aux_particleId = _b_particleAux_in[_sroa_4_base + 1];
                            const aux_deathTime = _b_particleAux_in[_sroa_4_base + 2];
                            const aux_deathMass = _b_particleAux_in[_sroa_4_base + 3];
                            const aux_deathAngVel = _b_particleAux_in[_sroa_4_base + 4];
                            const r = aux_radius;
                            const pid = aux_particleId;
                            const _sroa_5_base = ((idx) * 8);
                            const dd_magMoment = _b_derived_in[_sroa_5_base + 0];
                            const dd_angMomentum = _b_derived_in[_sroa_5_base + 1];
                            const dd_invMass = _b_derived_in[_sroa_5_base + 2];
                            const dd_radiusSq = _b_derived_in[_sroa_5_base + 3];
                            const dd_velX = _b_derived_in[_sroa_5_base + 4];
                            const dd_velY = _b_derived_in[_sroa_5_base + 5];
                            const dd_angVel = _b_derived_in[_sroa_5_base + 6];
                            const dd_bodyRSq = _b_derived_in[_sroa_5_base + 7];
                            const mm = dd_magMoment;
                            const am = dd_angMomentum;
                            let ga_radius = 0;
                            let ga_particleId = 0;
                            let ga_deathTime = 0;
                            let ga_deathMass = 0;
                            let ga_deathAngVel = 0;
                            ga_radius = r;
                            ga_particleId = pid;
                            ga_deathTime = 0.0;
                            ga_deathMass = 0.0;
                            ga_deathAngVel = 0.0;
                            const nearL = (x < margin);
                            const nearR = (x > (W - margin));
                            const nearT = (y < margin);
                            const nearB = (y > (H - margin));
                            let ddKleinY_magMoment = dd_magMoment;
                            let ddKleinY_angMomentum = dd_angMomentum;
                            let ddKleinY_invMass = dd_invMass;
                            let ddKleinY_radiusSq = dd_radiusSq;
                            let ddKleinY_velX = dd_velX;
                            let ddKleinY_velY = dd_velY;
                            let ddKleinY_angVel = dd_angVel;
                            let ddKleinY_bodyRSq = dd_bodyRSq;
                            ddKleinY_velX = (-dd_velX);
                            ddKleinY_angVel = (-dd_angVel);
                            ddKleinY_magMoment = (-mm);
                            ddKleinY_angMomentum = (-am);
                            let ddRP2X_magMoment = dd_magMoment;
                            let ddRP2X_angMomentum = dd_angMomentum;
                            let ddRP2X_invMass = dd_invMass;
                            let ddRP2X_radiusSq = dd_radiusSq;
                            let ddRP2X_velX = dd_velX;
                            let ddRP2X_velY = dd_velY;
                            let ddRP2X_angVel = dd_angVel;
                            let ddRP2X_bodyRSq = dd_bodyRSq;
                            ddRP2X_velY = (-dd_velY);
                            ddRP2X_angVel = (-dd_angVel);
                            ddRP2X_magMoment = (-mm);
                            ddRP2X_angMomentum = (-am);
                            const ddRP2Y_magMoment = ddKleinY_magMoment;
                            const ddRP2Y_angMomentum = ddKleinY_angMomentum;
                            const ddRP2Y_invMass = ddKleinY_invMass;
                            const ddRP2Y_radiusSq = ddKleinY_radiusSq;
                            const ddRP2Y_velX = ddKleinY_velX;
                            const ddRP2Y_velY = ddKleinY_velY;
                            const ddRP2Y_angVel = ddKleinY_angVel;
                            const ddRP2Y_bodyRSq = ddKleinY_bodyRSq;
                            if ((topo == TOPO_TORUS)) {
                                if (nearL) {
                                    appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if (nearR) {
                                    appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if (nearT) {
                                    appendGhost(makeGhostState(x, (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if (nearB) {
                                    appendGhost(makeGhostState(x, (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if ((nearL && nearT)) {
                                    appendGhost(makeGhostState((x + W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if ((nearL && nearB)) {
                                    appendGhost(makeGhostState((x + W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if ((nearR && nearT)) {
                                    appendGhost(makeGhostState((x - W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if ((nearR && nearB)) {
                                    appendGhost(makeGhostState((x - W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                            } else if ((topo == TOPO_KLEIN)) {
                                if (nearL) {
                                    appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if (nearR) {
                                    appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                                }
                                if (nearT) {
                                    appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                                if (nearB) {
                                    appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                                if ((nearL && nearT)) {
                                    appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                                if ((nearL && nearB)) {
                                    appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                                if ((nearR && nearT)) {
                                    appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                                if ((nearR && nearB)) {
                                    appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                                }
                            } else {
                                if (nearL) {
                                    appendGhost(makeGhostState((x + W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                                }
                                if (nearR) {
                                    appendGhost(makeGhostState((x - W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                                }
                                if (nearT) {
                                    appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                                }
                                if (nearB) {
                                    appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                                }
                                if ((nearL && nearT)) {
                                    appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                                }
                                if ((nearL && nearB)) {
                                    appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                                }
                                if ((nearR && nearT)) {
                                    appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                                }
                                if ((nearR && nearB)) {
                                    appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
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
                        const idx = gid_x;
                        if ((idx >= _u_uniforms_aliveCount)) {
                            break __invocation;
                        }
                        const _sroa_6_base = ((idx) * 9);
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
                        const W = _u_uniforms_domainW;
                        const H = _u_uniforms_domainH;
                        const margin = (((W) < (H) ? (H) : (W)) * _u_uniforms_bhTheta);
                        const topo = _u_uniforms_topologyMode;
                        const x = ps_posX;
                        const y = ps_posY;
                        const wx = ps_velWX;
                        const wy = ps_velWY;
                        const aw = ps_angW;
                        const m = ps_mass;
                        const q = ps_charge;
                        const bm = ps_baseMass;
                        const _sroa_7_base = ((idx) * 5);
                        const aux_radius = _b_particleAux_in[_sroa_7_base + 0];
                        const aux_particleId = _b_particleAux_in[_sroa_7_base + 1];
                        const aux_deathTime = _b_particleAux_in[_sroa_7_base + 2];
                        const aux_deathMass = _b_particleAux_in[_sroa_7_base + 3];
                        const aux_deathAngVel = _b_particleAux_in[_sroa_7_base + 4];
                        const r = aux_radius;
                        const pid = aux_particleId;
                        const _sroa_8_base = ((idx) * 8);
                        const dd_magMoment = _b_derived_in[_sroa_8_base + 0];
                        const dd_angMomentum = _b_derived_in[_sroa_8_base + 1];
                        const dd_invMass = _b_derived_in[_sroa_8_base + 2];
                        const dd_radiusSq = _b_derived_in[_sroa_8_base + 3];
                        const dd_velX = _b_derived_in[_sroa_8_base + 4];
                        const dd_velY = _b_derived_in[_sroa_8_base + 5];
                        const dd_angVel = _b_derived_in[_sroa_8_base + 6];
                        const dd_bodyRSq = _b_derived_in[_sroa_8_base + 7];
                        const mm = dd_magMoment;
                        const am = dd_angMomentum;
                        let ga_radius = 0;
                        let ga_particleId = 0;
                        let ga_deathTime = 0;
                        let ga_deathMass = 0;
                        let ga_deathAngVel = 0;
                        ga_radius = r;
                        ga_particleId = pid;
                        ga_deathTime = 0.0;
                        ga_deathMass = 0.0;
                        ga_deathAngVel = 0.0;
                        const nearL = (x < margin);
                        const nearR = (x > (W - margin));
                        const nearT = (y < margin);
                        const nearB = (y > (H - margin));
                        let ddKleinY_magMoment = dd_magMoment;
                        let ddKleinY_angMomentum = dd_angMomentum;
                        let ddKleinY_invMass = dd_invMass;
                        let ddKleinY_radiusSq = dd_radiusSq;
                        let ddKleinY_velX = dd_velX;
                        let ddKleinY_velY = dd_velY;
                        let ddKleinY_angVel = dd_angVel;
                        let ddKleinY_bodyRSq = dd_bodyRSq;
                        ddKleinY_velX = (-dd_velX);
                        ddKleinY_angVel = (-dd_angVel);
                        ddKleinY_magMoment = (-mm);
                        ddKleinY_angMomentum = (-am);
                        let ddRP2X_magMoment = dd_magMoment;
                        let ddRP2X_angMomentum = dd_angMomentum;
                        let ddRP2X_invMass = dd_invMass;
                        let ddRP2X_radiusSq = dd_radiusSq;
                        let ddRP2X_velX = dd_velX;
                        let ddRP2X_velY = dd_velY;
                        let ddRP2X_angVel = dd_angVel;
                        let ddRP2X_bodyRSq = dd_bodyRSq;
                        ddRP2X_velY = (-dd_velY);
                        ddRP2X_angVel = (-dd_angVel);
                        ddRP2X_magMoment = (-mm);
                        ddRP2X_angMomentum = (-am);
                        const ddRP2Y_magMoment = ddKleinY_magMoment;
                        const ddRP2Y_angMomentum = ddKleinY_angMomentum;
                        const ddRP2Y_invMass = ddKleinY_invMass;
                        const ddRP2Y_radiusSq = ddKleinY_radiusSq;
                        const ddRP2Y_velX = ddKleinY_velX;
                        const ddRP2Y_velY = ddKleinY_velY;
                        const ddRP2Y_angVel = ddKleinY_angVel;
                        const ddRP2Y_bodyRSq = ddKleinY_bodyRSq;
                        if ((topo == TOPO_TORUS)) {
                            if (nearL) {
                                appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if (nearR) {
                                appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if (nearT) {
                                appendGhost(makeGhostState(x, (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if (nearB) {
                                appendGhost(makeGhostState(x, (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if ((nearL && nearT)) {
                                appendGhost(makeGhostState((x + W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if ((nearL && nearB)) {
                                appendGhost(makeGhostState((x + W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if ((nearR && nearT)) {
                                appendGhost(makeGhostState((x - W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if ((nearR && nearB)) {
                                appendGhost(makeGhostState((x - W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                        } else if ((topo == TOPO_KLEIN)) {
                            if (nearL) {
                                appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if (nearR) {
                                appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                            }
                            if (nearT) {
                                appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                            if (nearB) {
                                appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                            if ((nearL && nearT)) {
                                appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                            if ((nearL && nearB)) {
                                appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                            if ((nearR && nearT)) {
                                appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                            if ((nearR && nearB)) {
                                appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                            }
                        } else {
                            if (nearL) {
                                appendGhost(makeGhostState((x + W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                            }
                            if (nearR) {
                                appendGhost(makeGhostState((x - W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                            }
                            if (nearT) {
                                appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                            }
                            if (nearB) {
                                appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                            }
                            if ((nearL && nearT)) {
                                appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                            }
                            if ((nearL && nearB)) {
                                appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                            }
                            if ((nearR && nearT)) {
                                appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                            }
                            if ((nearR && nearB)) {
                                appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
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
                    const idx = gid_x;
                    if ((idx >= _u_uniforms_aliveCount)) {
                        break __invocation;
                    }
                    const _sroa_9_base = ((idx) * 9);
                    const ps_posX = _b_particleState[_sroa_9_base + 0];
                    const ps_posY = _b_particleState[_sroa_9_base + 1];
                    const ps_velWX = _b_particleState[_sroa_9_base + 2];
                    const ps_velWY = _b_particleState[_sroa_9_base + 3];
                    const ps_mass = _b_particleState[_sroa_9_base + 4];
                    const ps_charge = _b_particleState[_sroa_9_base + 5];
                    const ps_angW = _b_particleState[_sroa_9_base + 6];
                    const ps_baseMass = _b_particleState[_sroa_9_base + 7];
                    const ps_flags = _b_particleState[_sroa_9_base + 8];
                    if ((((ps_flags & FLAG_ALIVE)) == 0)) {
                        break __invocation;
                    }
                    const W = _u_uniforms_domainW;
                    const H = _u_uniforms_domainH;
                    const margin = (((W) < (H) ? (H) : (W)) * _u_uniforms_bhTheta);
                    const topo = _u_uniforms_topologyMode;
                    const x = ps_posX;
                    const y = ps_posY;
                    const wx = ps_velWX;
                    const wy = ps_velWY;
                    const aw = ps_angW;
                    const m = ps_mass;
                    const q = ps_charge;
                    const bm = ps_baseMass;
                    const _sroa_10_base = ((idx) * 5);
                    const aux_radius = _b_particleAux_in[_sroa_10_base + 0];
                    const aux_particleId = _b_particleAux_in[_sroa_10_base + 1];
                    const aux_deathTime = _b_particleAux_in[_sroa_10_base + 2];
                    const aux_deathMass = _b_particleAux_in[_sroa_10_base + 3];
                    const aux_deathAngVel = _b_particleAux_in[_sroa_10_base + 4];
                    const r = aux_radius;
                    const pid = aux_particleId;
                    const _sroa_11_base = ((idx) * 8);
                    const dd_magMoment = _b_derived_in[_sroa_11_base + 0];
                    const dd_angMomentum = _b_derived_in[_sroa_11_base + 1];
                    const dd_invMass = _b_derived_in[_sroa_11_base + 2];
                    const dd_radiusSq = _b_derived_in[_sroa_11_base + 3];
                    const dd_velX = _b_derived_in[_sroa_11_base + 4];
                    const dd_velY = _b_derived_in[_sroa_11_base + 5];
                    const dd_angVel = _b_derived_in[_sroa_11_base + 6];
                    const dd_bodyRSq = _b_derived_in[_sroa_11_base + 7];
                    const mm = dd_magMoment;
                    const am = dd_angMomentum;
                    let ga_radius = 0;
                    let ga_particleId = 0;
                    let ga_deathTime = 0;
                    let ga_deathMass = 0;
                    let ga_deathAngVel = 0;
                    ga_radius = r;
                    ga_particleId = pid;
                    ga_deathTime = 0.0;
                    ga_deathMass = 0.0;
                    ga_deathAngVel = 0.0;
                    const nearL = (x < margin);
                    const nearR = (x > (W - margin));
                    const nearT = (y < margin);
                    const nearB = (y > (H - margin));
                    let ddKleinY_magMoment = dd_magMoment;
                    let ddKleinY_angMomentum = dd_angMomentum;
                    let ddKleinY_invMass = dd_invMass;
                    let ddKleinY_radiusSq = dd_radiusSq;
                    let ddKleinY_velX = dd_velX;
                    let ddKleinY_velY = dd_velY;
                    let ddKleinY_angVel = dd_angVel;
                    let ddKleinY_bodyRSq = dd_bodyRSq;
                    ddKleinY_velX = (-dd_velX);
                    ddKleinY_angVel = (-dd_angVel);
                    ddKleinY_magMoment = (-mm);
                    ddKleinY_angMomentum = (-am);
                    let ddRP2X_magMoment = dd_magMoment;
                    let ddRP2X_angMomentum = dd_angMomentum;
                    let ddRP2X_invMass = dd_invMass;
                    let ddRP2X_radiusSq = dd_radiusSq;
                    let ddRP2X_velX = dd_velX;
                    let ddRP2X_velY = dd_velY;
                    let ddRP2X_angVel = dd_angVel;
                    let ddRP2X_bodyRSq = dd_bodyRSq;
                    ddRP2X_velY = (-dd_velY);
                    ddRP2X_angVel = (-dd_angVel);
                    ddRP2X_magMoment = (-mm);
                    ddRP2X_angMomentum = (-am);
                    const ddRP2Y_magMoment = ddKleinY_magMoment;
                    const ddRP2Y_angMomentum = ddKleinY_angMomentum;
                    const ddRP2Y_invMass = ddKleinY_invMass;
                    const ddRP2Y_radiusSq = ddKleinY_radiusSq;
                    const ddRP2Y_velX = ddKleinY_velX;
                    const ddRP2Y_velY = ddKleinY_velY;
                    const ddRP2Y_angVel = ddKleinY_angVel;
                    const ddRP2Y_bodyRSq = ddKleinY_bodyRSq;
                    if ((topo == TOPO_TORUS)) {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState(x, (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState(x, (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState((x + W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState((x + W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState((x - W), (y + H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState((x - W), (y - H), wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                    } else if ((topo == TOPO_KLEIN)) {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), y, wx, wy, aw, m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: dd_magMoment, angMomentum: dd_angMomentum, invMass: dd_invMass, radiusSq: dd_radiusSq, velX: dd_velX, velY: dd_velY, angVel: dd_angVel, bodyRSq: dd_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddKleinY_magMoment, angMomentum: ddKleinY_angMomentum, invMass: ddKleinY_invMass, radiusSq: ddKleinY_radiusSq, velX: ddKleinY_velX, velY: ddKleinY_velY, angVel: ddKleinY_angVel, bodyRSq: ddKleinY_bodyRSq }, idx);
                        }
                    } else {
                        if (nearL) {
                            appendGhost(makeGhostState((x + W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                        }
                        if (nearR) {
                            appendGhost(makeGhostState((x - W), (H - y), wx, (-wy), (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2X_magMoment, angMomentum: ddRP2X_angMomentum, invMass: ddRP2X_invMass, radiusSq: ddRP2X_radiusSq, velX: ddRP2X_velX, velY: ddRP2X_velY, angVel: ddRP2X_angVel, bodyRSq: ddRP2X_bodyRSq }, idx);
                        }
                        if (nearT) {
                            appendGhost(makeGhostState((W - x), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if (nearB) {
                            appendGhost(makeGhostState((W - x), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearL && nearT)) {
                            appendGhost(makeGhostState(((W - x) + W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearL && nearB)) {
                            appendGhost(makeGhostState(((W - x) + W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearR && nearT)) {
                            appendGhost(makeGhostState(((W - x) - W), (y + H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
                        if ((nearR && nearB)) {
                            appendGhost(makeGhostState(((W - x) - W), (y - H), (-wx), wy, (-aw), m, q, bm), { radius: ga_radius, particleId: ga_particleId, deathTime: ga_deathTime, deathMass: ga_deathMass, deathAngVel: ga_deathAngVel }, { magMoment: ddRP2Y_magMoment, angMomentum: ddRP2Y_angMomentum, invMass: ddRP2Y_invMass, radiusSq: ddRP2Y_radiusSq, velX: ddRP2Y_velX, velY: ddRP2Y_velY, angVel: ddRP2Y_angVel, bodyRSq: ddRP2Y_bodyRSq }, idx);
                        }
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

    return { entry, bind, bindings: ["particleState","ghostState","ghostAux","derived_in","ghostDerived","particleAux_in","ghostCounter","uniforms","ghostOriginalIdx"], entryInfo };
}
