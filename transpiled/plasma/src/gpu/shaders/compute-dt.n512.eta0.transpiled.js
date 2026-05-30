// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/compute-dt.wgsl
// wgsl-variant: n512.eta0
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: f35d75587b6759d3d91a7ad748b27804fe3768050fd4930ae20964516337f25f
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"inlineHotFns":["jz_mag_at"],"specializeUniforms":{"U_uniforms":{"grid_n":512,"grid_n_total":516,"ghost_w":2,"eta_anom_alpha":0}},"fixedWorkgroups":[64,64,1]}
// wgsl-metrics: {"bytes":33490,"lines":548,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":10,"workgroupReductionInits":4,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":1}
// generated: 2026-05-30T22:40:33.531Z
export default function _wgsl_module(rt) {
    const FLAG_COOLING = (1 << 0);
    const FLAG_GRAVITY_EXT = (1 << 1);
    const FLAG_GRAVITY_SELF = (1 << 2);
    const FLAG_CONDUCTION = (1 << 3);
    const FLAG_HALL = (1 << 4);
    const FLAG_POSITIVITY = (1 << 5);
    const FLAG_EMF_UPWIND = (1 << 6);
    const FLAG_AMBIPOLAR = (1 << 7);
    const FLAG_BIERMANN = (1 << 8);
    const FLAG_VISCOSITY = (1 << 9);
    const FLAG_GEOMETRY = (1 << 10);
    const FLAG_SPONGE = (1 << 11);
    const FLAG_HEATING = (1 << 12);
    const FLAG_RADIATION = (1 << 13);
    const FLAG_ELECTRON_INERTIA = (1 << 14);
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const EDGE_N_BC = 0;
    const EDGE_S_BC = 1;
    const EDGE_E_BC = 2;
    const EDGE_W_BC = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const DUAL_ENERGY_FRACTION = 1.0e-3;
    const DT_MIN = 1.0e-10;
    const DT_MAX = 1.0e-2;
    const TRANSPORT_SCALE_MAX_DT = 1.0e5;

    function pressure_from_dual_energy(U0, U1, bx_c, by_c, gamma, p_floor) {
        const U0_x = U0.x;
        const U0_y = U0.y;
        const U0_z = U0.z;
        const U0_w = U0.w;
        const U1_x = U1.x;
        const U1_y = U1.y;
        const U1_z = U1.z;
        const U1_w = U1.w;
        const rho = ((U0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (U0_x));
        const vx = (U0_y / rho);
        const vy = (U0_z / rho);
        const vz = (U0_w / rho);
        const ke = ((0.5 * rho) * ((((vx * vx) + (vy * vy)) + (vz * vz))));
        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y))));
        const eth_total = ((U1_x - ke) - mb);
        const eth_floor = (p_floor / (((gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((gamma - 1.0))));
        const total_ok = ((eth_total > ((eth_floor) < ((DUAL_ENERGY_FRACTION * ((Math.abs(U1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(U1_x))))) ? ((DUAL_ENERGY_FRACTION * ((Math.abs(U1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(U1_x))))) : (eth_floor))) && (eth_total == eth_total));
        const dual_eth_in = ((U1_z == U1_z) ? U1_z : eth_floor);
        const dual_eth = ((dual_eth_in) < (eth_floor) ? (eth_floor) : (dual_eth_in));
        const eth = (total_ok ? eth_total : dual_eth);
        return (((((gamma - 1.0)) * eth)) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * eth)));
    }

    function cons_to_prim_mhd(U0, U1, bx_c, by_c, gamma, p_floor) {
        const U0_x = U0.x;
        const U0_y = U0.y;
        const U0_z = U0.z;
        const U0_w = U0.w;
        const U1_x = U1.x;
        const U1_y = U1.y;
        const U1_z = U1.z;
        const U1_w = U1.w;
        let P_rho = 0;
        let P_vx = 0;
        let P_vy = 0;
        let P_vz = 0;
        let P_p = 0;
        let P_bx = 0;
        let P_by = 0;
        let P_bz = 0;
        P_rho = ((U0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (U0_x));
        P_vx = (U0_y / P_rho);
        P_vy = (U0_z / P_rho);
        P_vz = (U0_w / P_rho);
        P_bx = bx_c;
        P_by = by_c;
        P_bz = U1_y;
        P_p = pressure_from_dual_energy({x:U0_x, y:U0_y, z:U0_z, w:U0_w}, {x:U1_x, y:U1_y, z:U1_z, w:U1_w}, bx_c, by_c, gamma, p_floor);
        return { rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz };
    }

    function fast_mag_speed(P, gamma, axis, p_floor) {
        const rho = ((P.rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (P.rho));
        const p = ((P.p) < (p_floor) ? (p_floor) : (P.p));
        const cs2 = ((gamma * p) / rho);
        const b2 = (((P.bx * P.bx) + (P.by * P.by)) + (P.bz * P.bz));
        const ca2 = (b2 / rho);
        let can2 = 0;
        if ((axis == 0)) {
            can2 = ((P.bx * P.bx) / rho);
        } else {
            can2 = ((P.by * P.by) / rho);
        }
        const sum = (cs2 + ca2);
        const disc = ((((sum * sum) - ((4.0 * cs2) * can2))) < (0.0) ? (0.0) : (((sum * sum) - ((4.0 * cs2) * can2))));
        const cf2 = (0.5 * ((sum + Math.sqrt(disc))));
        return Math.sqrt(((cf2) < (0.0) ? (0.0) : (cf2)));
    }

    function anomalous_eta(j_mag, eta0, alpha, jcrit) {
        if ((alpha <= 0.0)) {
            return eta0;
        }
        const jcrit_safe = ((jcrit) < (1.0e-12) ? (1.0e-12) : (jcrit));
        const r = (j_mag / jcrit_safe);
        const excess = ((0.0) < ((r - 1.0)) ? ((r - 1.0)) : (0.0));
        return (eta0 + ((alpha * excess) * excess));
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["reset"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_reset(workgroups, bindings, domain, origin) {
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_wavespeed = bindings.wavespeed;
        const _b_eta_max_buf = bindings.eta_max_buf;
        const _b_hall_speed_buf = bindings.hall_speed_buf;
        const _b_cond_speed_buf = bindings.cond_speed_buf;
        const wg = Object.create(null);
        wg.tile_max_wave = 0;
        wg.tile_max_eta = 0;
        wg.tile_max_hall = 0;
        wg.tile_max_cond = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max_wave = 0;
            wg.tile_max_eta = 0;
            wg.tile_max_hall = 0;
            wg.tile_max_cond = 0;
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    void (_b_wavespeed[0] = 0);
                    void (_b_eta_max_buf[0] = 0);
                    void (_b_hall_speed_buf[0] = 0);
                    void (_b_cond_speed_buf[0] = 0);
                }
            }
        }
    }
    entry["reset"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_reset(workgroups, bindings, domain, origin);
    };

    entryInfo["reduce"] = {"workgroupSize":[8,8,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":4};
    function __entry_1_reduce(workgroups, bindings, domain, origin) {
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_eta = _b_U_uniforms.eta;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_cfl = _b_U_uniforms.cfl;
        const _u_U_uniforms_eta_anom_jcrit = _b_U_uniforms.eta_anom_jcrit;
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_hall_substeps_max = _b_U_uniforms.hall_substeps_max;
        const _u_U_uniforms_cooling_T_ref = _b_U_uniforms.cooling_T_ref;
        const _u_U_uniforms_conduction_kappa = _b_U_uniforms.conduction_kappa;
        const _u_U_uniforms_gravity_gx = _b_U_uniforms.gravity_gx;
        const _u_U_uniforms_gravity_gy = _b_U_uniforms.gravity_gy;
        const _u_U_uniforms_gravity_G = _b_U_uniforms.gravity_G;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_hall_electron_pressure_frac = _b_U_uniforms.hall_electron_pressure_frac;
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_neutral_frac = _b_U_uniforms.neutral_frac;
        const _u_U_uniforms_viscosity_nu = _b_U_uniforms.viscosity_nu;
        const _u_U_uniforms_viscosity_bulk = _b_U_uniforms.viscosity_bulk;
        const _u_U_uniforms_viscosity_shock = _b_U_uniforms.viscosity_shock;
        const _u_U_uniforms_source_substeps_max = _b_U_uniforms.source_substeps_max;
        const _u_U_uniforms_geometry_mode = _b_U_uniforms.geometry_mode;
        const _u_U_uniforms_geometry_r_min = _b_U_uniforms.geometry_r_min;
        const _u_U_uniforms_radiation_c = _b_U_uniforms.radiation_c;
        const _u_U_uniforms_radiation_kappa_abs = _b_U_uniforms.radiation_kappa_abs;
        const _u_U_uniforms_radiation_kappa_scat = _b_U_uniforms.radiation_kappa_scat;
        const _u_U_uniforms_electron_inertia_length = _b_U_uniforms.electron_inertia_length;
        const _u_U_uniforms_electron_inertia_damping = _b_U_uniforms.electron_inertia_damping;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_wavespeed = bindings.wavespeed;
        const _b_eta_max_buf = bindings.eta_max_buf;
        const _b_hall_speed_buf = bindings.hall_speed_buf;
        const _b_cond_speed_buf = bindings.cond_speed_buf;
        const wg = Object.create(null);
        wg.tile_max_wave = 0;
        wg.tile_max_eta = 0;
        wg.tile_max_hall = 0;
        wg.tile_max_cond = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max_wave = 0;
            wg.tile_max_eta = 0;
            wg.tile_max_hall = 0;
            wg.tile_max_cond = 0;
            // Optimized workgroup reduction init phase
            wg.tile_max_wave = 0;
            wg.tile_max_eta = 0;
            wg.tile_max_hall = 0;
            wg.tile_max_cond = 0;
            // Phase 0
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        const lid = lz*Ly*Lx + ly*Lx + lx;
                        {
                            const n_interior = 512;
                            const n_total = 516;
                            const ghost = 2;
                            const dx_inv = (1.0 / _u_U_uniforms_dx);
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                const ix = (gid_x + ghost);
                                const iy = (gid_y + ghost);
                                let _inl_14_result;
                                _inl_14: {
                                    let _inl_14__inl_0_result;
                                    _inl_14__inl_0: {
                                        _inl_14__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_14__inl_0;
                                    }
                                    _inl_14_result = _inl_14__inl_0_result;
                                    break _inl_14;
                                }
                                let _inl_15_result;
                                _inl_15: {
                                    const _inl_15__inl_1_ix = (ix + 1);
                                    let _inl_15__inl_1_result;
                                    _inl_15__inl_1: {
                                        _inl_15__inl_1_result = ((iy * ((n_total + 1))) + _inl_15__inl_1_ix);
                                        break _inl_15__inl_1;
                                    }
                                    _inl_15_result = _inl_15__inl_1_result;
                                    break _inl_15;
                                }
                                const bx = (0.5 * ((_b_Bx_face[_inl_14_result] + _b_Bx_face[_inl_15_result])));
                                let _inl_16_result;
                                _inl_16: {
                                    let _inl_16__inl_2_result;
                                    _inl_16__inl_2: {
                                        _inl_16__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_16__inl_2;
                                    }
                                    _inl_16_result = _inl_16__inl_2_result;
                                    break _inl_16;
                                }
                                let _inl_17_result;
                                _inl_17: {
                                    const _inl_17__inl_3_iy = (iy + 1);
                                    let _inl_17__inl_3_result;
                                    _inl_17__inl_3: {
                                        _inl_17__inl_3_result = ((_inl_17__inl_3_iy * n_total) + ix);
                                        break _inl_17__inl_3;
                                    }
                                    _inl_17_result = _inl_17__inl_3_result;
                                    break _inl_17;
                                }
                                const by = (0.5 * ((_b_By_face[_inl_16_result] + _b_By_face[_inl_17_result])));
                                let _inl_18_result;
                                _inl_18: {
                                    _inl_18_result = ((iy * n_total) + ix);
                                    break _inl_18;
                                }
                                const idx = _inl_18_result;
                                const pf = _u_U_uniforms_pressure_floor;
                                const _sroa_0 = cons_to_prim_mhd(((_b) => ({x:_b_U0_in[_b + 0], y:_b_U0_in[_b + 1], z:_b_U0_in[_b + 2], w:_b_U0_in[_b + 3]}))(((idx) * 4 + 0)), ((_b) => ({x:_b_U1_in[_b + 0], y:_b_U1_in[_b + 1], z:_b_U1_in[_b + 2], w:_b_U1_in[_b + 3]}))(((idx) * 4 + 0)), bx, by, _u_U_uniforms_gamma, pf);
                                const P_rho = _sroa_0.rho;
                                const P_vx = _sroa_0.vx;
                                const P_vy = _sroa_0.vy;
                                const P_vz = _sroa_0.vz;
                                const P_p = _sroa_0.p;
                                const P_bx = _sroa_0.bx;
                                const P_by = _sroa_0.by;
                                const P_bz = _sroa_0.bz;
                                const rho = ((P_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (P_rho));
                                const cfx = fast_mag_speed({ rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz }, _u_U_uniforms_gamma, 0, pf);
                                const cfy = fast_mag_speed({ rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz }, _u_U_uniforms_gamma, 1, pf);
                                const sx = (Math.abs(P_vx) + cfx);
                                const sy = (Math.abs(P_vy) + cfy);
                                let s = (sx + sy);
                                const dx = _u_U_uniforms_dx;
                                const cfl_safe = ((_u_U_uniforms_cfl) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_cfl));
                                const flags = _u_U_uniforms_physics_flags;
                                const b2 = (((P_bx * P_bx) + (P_by * P_by)) + (P_bz * P_bz));
                                let _inl_19_result;
                                _inl_19: {
                                    _inl_19_result = (((flags & FLAG_HALL)) != 0);
                                    break _inl_19;
                                }
                                if ((_inl_19_result && (_u_U_uniforms_hall_di > 0.0))) {
                                    const vA = Math.sqrt((((b2 / rho)) < (0.0) ? (0.0) : ((b2 / rho))));
                                    const r_hall = ((vA * _u_U_uniforms_hall_di) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx))));
                                    const r_hall_safe = (((r_hall >= 0.0) && (r_hall == r_hall)) ? r_hall : 0.0);
                                    (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "tile_max_hall", rt.bitcast_u32_f32(r_hall_safe)));
                                    const n_hall = (((+(((_u_U_uniforms_hall_substeps_max) < (1) ? (1) : (_u_U_uniforms_hall_substeps_max))))) < (1.0) ? (1.0) : ((+(((_u_U_uniforms_hall_substeps_max) < (1) ? (1) : (_u_U_uniforms_hall_substeps_max))))));
                                    const s_hall_cap = (((cfl_safe * dx) * r_hall_safe) / (((2.0 * n_hall) * 0.5)));
                                    s = (s + (((s_hall_cap >= 0.0) && (s_hall_cap == s_hall_cap)) ? s_hall_cap : 0.0));
                                }
                                let _inl_20_result;
                                _inl_20: {
                                    _inl_20_result = (((flags & FLAG_CONDUCTION)) != 0);
                                    break _inl_20;
                                }
                                if ((_inl_20_result && (_u_U_uniforms_conduction_kappa > 0.0))) {
                                    const theta = (((P_p / rho)) / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                                    let _inl_21_result;
                                    _inl_21: {
                                        _inl_21_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(((theta) < (1.0e-30) ? (1.0e-30) : (theta)), 2.5), 0.0, TRANSPORT_SCALE_MAX_DT));
                                        break _inl_21;
                                    }
                                    const kappa_T = (_u_U_uniforms_conduction_kappa * _inl_21_result);
                                    const chi = (((((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))) * kappa_T) / rho);
                                    const r_cond = ((4.0 * chi) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx))));
                                    const r_cond_safe = (((r_cond >= 0.0) && (r_cond == r_cond)) ? r_cond : 0.0);
                                    (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "tile_max_cond", rt.bitcast_u32_f32(r_cond_safe)));
                                    const n_cond = (((+(((_u_U_uniforms_source_substeps_max) < (1) ? (1) : (_u_U_uniforms_source_substeps_max))))) < (1.0) ? (1.0) : ((+(((_u_U_uniforms_source_substeps_max) < (1) ? (1) : (_u_U_uniforms_source_substeps_max))))));
                                    const s_cond_cap = (((cfl_safe * dx) * r_cond_safe) / (((2.0 * n_cond) * 0.5)));
                                    s = (s + (((s_cond_cap >= 0.0) && (s_cond_cap == s_cond_cap)) ? s_cond_cap : 0.0));
                                }
                                const n_src = (((+(((_u_U_uniforms_source_substeps_max) < (1) ? (1) : (_u_U_uniforms_source_substeps_max))))) < (1.0) ? (1.0) : ((+(((_u_U_uniforms_source_substeps_max) < (1) ? (1) : (_u_U_uniforms_source_substeps_max))))));
                                let _inl_22_result;
                                _inl_22: {
                                    _inl_22_result = (((flags & FLAG_VISCOSITY)) != 0);
                                    break _inl_22;
                                }
                                if (_inl_22_result) {
                                    const nu_eff = (((((_u_U_uniforms_viscosity_nu * TRANSPORT_SCALE_MAX_DT)) < ((_u_U_uniforms_viscosity_bulk * TRANSPORT_SCALE_MAX_DT)) ? ((_u_U_uniforms_viscosity_bulk * TRANSPORT_SCALE_MAX_DT)) : ((_u_U_uniforms_viscosity_nu * TRANSPORT_SCALE_MAX_DT)))) < (_u_U_uniforms_viscosity_shock) ? (_u_U_uniforms_viscosity_shock) : ((((_u_U_uniforms_viscosity_nu * TRANSPORT_SCALE_MAX_DT)) < ((_u_U_uniforms_viscosity_bulk * TRANSPORT_SCALE_MAX_DT)) ? ((_u_U_uniforms_viscosity_bulk * TRANSPORT_SCALE_MAX_DT)) : ((_u_U_uniforms_viscosity_nu * TRANSPORT_SCALE_MAX_DT)))));
                                    const r_visc = ((4.0 * ((nu_eff) < (0.0) ? (0.0) : (nu_eff))) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx))));
                                    const s_visc_cap = (((cfl_safe * dx) * r_visc) / (((2.0 * n_src) * 0.45)));
                                    s = (s + (((s_visc_cap >= 0.0) && (s_visc_cap == s_visc_cap)) ? s_visc_cap : 0.0));
                                }
                                let r_nonideal = 0.0;
                                let _inl_23_result;
                                _inl_23: {
                                    _inl_23_result = (((flags & FLAG_AMBIPOLAR)) != 0);
                                    break _inl_23;
                                }
                                if (((_inl_23_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0))) {
                                    r_nonideal = (r_nonideal + (((4.0 * _u_U_uniforms_ambipolar_eta) * ((_u_U_uniforms_neutral_frac) < (0.0) ? (0.0) : (_u_U_uniforms_neutral_frac))) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx)))));
                                }
                                let _inl_24_result;
                                _inl_24: {
                                    _inl_24_result = (((flags & FLAG_BIERMANN)) != 0);
                                    break _inl_24;
                                }
                                if (((_inl_24_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0))) {
                                    r_nonideal = (r_nonideal + (Math.abs(_u_U_uniforms_biermann_coeff) / ((dx) < (1.0e-30) ? (1.0e-30) : (dx))));
                                }
                                let _inl_25_result;
                                _inl_25: {
                                    _inl_25_result = (((flags & FLAG_ELECTRON_INERTIA)) != 0);
                                    break _inl_25;
                                }
                                if (((_inl_25_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0))) {
                                    const eta4 = ((_u_U_uniforms_electron_inertia_damping * _u_U_uniforms_electron_inertia_length) * _u_U_uniforms_electron_inertia_length);
                                    r_nonideal = (r_nonideal + ((32.0 * eta4) / (((((dx * dx) * dx) * dx)) < (1.0e-30) ? (1.0e-30) : ((((dx * dx) * dx) * dx)))));
                                }
                                const s_nonideal_cap = (((cfl_safe * dx) * r_nonideal) / (((2.0 * n_src) * 0.45)));
                                s = (s + (((s_nonideal_cap >= 0.0) && (s_nonideal_cap == s_nonideal_cap)) ? s_nonideal_cap : 0.0));
                                let _inl_26_result;
                                _inl_26: {
                                    _inl_26_result = (((flags & FLAG_RADIATION)) != 0);
                                    break _inl_26;
                                }
                                if (((_inl_26_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))))) {
                                    const kappa = (((_u_U_uniforms_radiation_kappa_abs) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_abs)) + ((_u_U_uniforms_radiation_kappa_scat) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_scat)));
                                    const opacity_min = 0.01;
                                    const r_rad = ((kappa > 0.0) ? ((4.0 * _u_U_uniforms_radiation_c) / (((((kappa * opacity_min) * dx) * dx)) < (1.0e-30) ? (1.0e-30) : ((((kappa * opacity_min) * dx) * dx)))) : 0.0);
                                    const s_rad_cap = (((cfl_safe * dx) * r_rad) / (((2.0 * n_src) * 0.35)));
                                    s = (s + (((s_rad_cap >= 0.0) && (s_rad_cap == s_rad_cap)) ? s_rad_cap : 0.0));
                                }
                                let _inl_27_result;
                                _inl_27: {
                                    _inl_27_result = (((flags & FLAG_GRAVITY_EXT)) != 0);
                                    break _inl_27;
                                }
                                if (_inl_27_result) {
                                    const g_ext = Math.sqrt(((_u_U_uniforms_gravity_gx * _u_U_uniforms_gravity_gx) + (_u_U_uniforms_gravity_gy * _u_U_uniforms_gravity_gy)));
                                    if ((g_ext > 0.0)) {
                                        const s_g = ((4.0 * cfl_safe) * Math.sqrt((((dx * g_ext)) < (0.0) ? (0.0) : ((dx * g_ext)))));
                                        s = (s + (((s_g >= 0.0) && (s_g == s_g)) ? s_g : 0.0));
                                    }
                                }
                                let _inl_28_result;
                                _inl_28: {
                                    _inl_28_result = (((flags & FLAG_GRAVITY_SELF)) != 0);
                                    break _inl_28;
                                }
                                if ((_inl_28_result && (_u_U_uniforms_gravity_G > 0.0))) {
                                    const omega_g = Math.sqrt(((((12.566370614359172 * _u_U_uniforms_gravity_G) * rho)) < (0.0) ? (0.0) : (((12.566370614359172 * _u_U_uniforms_gravity_G) * rho))));
                                    const s_self_g = (((4.0 * cfl_safe) * dx) * omega_g);
                                    s = (s + (((s_self_g >= 0.0) && (s_self_g == s_self_g)) ? s_self_g : 0.0));
                                }
                                let _inl_29_result;
                                _inl_29: {
                                    _inl_29_result = (((flags & FLAG_GEOMETRY)) != 0);
                                    break _inl_29;
                                }
                                if ((_inl_29_result && (_u_U_uniforms_geometry_mode == 1))) {
                                    const r_cell = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                                    const s_fast = ((sx) < (sy) ? (sy) : (sx));
                                    const omega_geom = (s_fast / r_cell);
                                    const s_geom = (((4.0 * cfl_safe) * dx) * omega_geom);
                                    s = (s + (((s_geom >= 0.0) && (s_geom == s_geom)) ? s_geom : 0.0));
                                }
                                const s_safe = (((s >= 0.0) && (s == s)) ? s : 0.0);
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "tile_max_wave", rt.bitcast_u32_f32(s_safe)));
                                const alpha = 0;
                                let eta_l = 0;
                                {
                                    eta_l = _u_U_uniforms_eta;
                                }
                                const eta_safe = (((eta_l >= 0.0) && (eta_l == eta_l)) ? eta_l : 0.0);
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "tile_max_eta", rt.bitcast_u32_f32(eta_safe)));
                            }
                        }
                    }
                }
            }
            // Phase 1
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        const lid = lz*Ly*Lx + ly*Lx + lx;
                        {
                            const n_interior = 512;
                            const n_total = 516;
                            const ghost = 2;
                            const dx_inv = (1.0 / _u_U_uniforms_dx);
                            if ((lid == 0)) {
                                const mw = wg["tile_max_wave"];
                                const me = wg["tile_max_eta"];
                                const mh = wg["tile_max_hall"];
                                const mc = wg["tile_max_cond"];
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_wavespeed, 0, mw));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_eta_max_buf, 0, me));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_hall_speed_buf, 0, mh));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_cond_speed_buf, 0, mc));
                            }
                        }
                    }
                }
            }
        }
    }
    entry["reduce"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_reduce(workgroups, bindings, domain, origin);
    };

    entryInfo["finalize"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_finalize(workgroups, bindings, domain, origin) {
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_cfl = _b_U_uniforms.cfl;
        const _b_wavespeed = bindings.wavespeed;
        const _b_dt_buf = bindings.dt_buf;
        const _b_eta_max_buf = bindings.eta_max_buf;
        const _b_hall_speed_buf = bindings.hall_speed_buf;
        const _b_cond_speed_buf = bindings.cond_speed_buf;
        const wg = Object.create(null);
        wg.tile_max_wave = 0;
        wg.tile_max_eta = 0;
        wg.tile_max_hall = 0;
        wg.tile_max_cond = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max_wave = 0;
            wg.tile_max_eta = 0;
            wg.tile_max_hall = 0;
            wg.tile_max_cond = 0;
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    const s_bits = _b_wavespeed[0];
                    const s = ((rt.bitcast_f32_u32(s_bits)) < (1.0e-12) ? (1.0e-12) : (rt.bitcast_f32_u32(s_bits)));
                    const dx = _u_U_uniforms_dx;
                    const cfl_safe = ((_u_U_uniforms_cfl) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_cfl));
                    const dt_hyp = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(((cfl_safe * dx) / s), DT_MIN, DT_MAX));
                    _b_dt_buf[0] = dt_hyp;
                    const e_bits = _b_eta_max_buf[0];
                    const eta_max = ((rt.bitcast_f32_u32(e_bits)) < (0.0) ? (0.0) : (rt.bitcast_f32_u32(e_bits)));
                    let dt_par = 0;
                    if ((eta_max > 1.0e-30)) {
                        dt_par = (((0.25 * dx) * dx) / eta_max);
                    } else {
                        dt_par = 1.0e30;
                    }
                    _b_dt_buf[1] = dt_par;
                    _b_dt_buf[2] = eta_max;
                    const h_bits = _b_hall_speed_buf[0];
                    _b_dt_buf[3] = ((rt.bitcast_f32_u32(h_bits)) < (0.0) ? (0.0) : (rt.bitcast_f32_u32(h_bits)));
                    const c_bits = _b_cond_speed_buf[0];
                    _b_dt_buf[4] = ((rt.bitcast_f32_u32(c_bits)) < (0.0) ? (0.0) : (rt.bitcast_f32_u32(c_bits)));
                }
            }
        }
    }
    entry["finalize"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_finalize(workgroups, bindings, domain, origin);
    };

    entryInfo["reset_reduce_finalize"] = {"sequence":true,"fusedDispatch":true,"entries":["reset","reduce","finalize"],"workgroupEntry":"reduce","workgroupSize":[8,8,1],"phases":4,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":4};
    function __entry_3_reset_reduce_finalize(workgroups, bindings, domain, origin) {
        __entry_0_reset([1, 1, 1], bindings, undefined, undefined);
        __entry_1_reduce(workgroups, bindings, domain, origin);
        __entry_2_finalize([1, 1, 1], bindings, undefined, undefined);
    }
    entry["reset_reduce_finalize"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_reset_reduce_finalize(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["reset"] = function (workgroups, domain, origin) {
            return __entry_0_reset(workgroups, bindings, domain, origin);
        };
        bound["reduce"] = function (workgroups, domain, origin) {
            return __entry_1_reduce(workgroups, bindings, domain, origin);
        };
        bound["finalize"] = function (workgroups, domain, origin) {
            return __entry_2_finalize(workgroups, bindings, domain, origin);
        };
        bound["reset_reduce_finalize"] = function (workgroups, domain, origin) {
            return __entry_3_reset_reduce_finalize(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","wavespeed","dt_buf","eta_max_buf","hall_speed_buf","cond_speed_buf"], entryInfo };
}
