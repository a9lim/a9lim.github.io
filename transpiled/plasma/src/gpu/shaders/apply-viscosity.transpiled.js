// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-viscosity.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 6863d63c5e84c5a20a6c7436e8639ab038ed0353ac3b695b80859665e718b1e4
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":101327,"lines":1667,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":4,"iife":8,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.519Z
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
    const MICRO_TRANSPORT_START_VISC = 72;
    const MICRO_TRANSPORT_COUNT_VISC = 24;
    const INV_LN10_VISC = 0.4342944819032518;
    const TRANSPORT_SCALE_MAX_VISC = 1.0e5;
    const FE_DMOM_CAP_FRAC = 1.0;

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

    function micro_log_interp_visc(start, count, theta) {
        const log_theta = (Math.log(((theta) < (1.0e-30) ? (1.0e-30) : (theta))) * INV_LN10_VISC);
        let idx = start;
        for (let i = 0; (i < 23); i = (i + 1)) {
            if (((i + 1) >= count)) {
                break;
            }
            const _sroa_0_base = ((((start + i) + 1)) * 4 + 0);
            const next_x = bindings.micro[_sroa_0_base + 0];
            const next_y = bindings.micro[_sroa_0_base + 1];
            const next_z = bindings.micro[_sroa_0_base + 2];
            const next_w = bindings.micro[_sroa_0_base + 3];
            if ((log_theta < next_x)) {
                idx = (start + i);
                break;
            }
            idx = ((start + i) + 1);
        }
        const _sroa_1_base = ((idx) * 4 + 0);
        const row_x = bindings.micro[_sroa_1_base + 0];
        const row_y = bindings.micro[_sroa_1_base + 1];
        const row_z = bindings.micro[_sroa_1_base + 2];
        const row_w = bindings.micro[_sroa_1_base + 3];
        return (row_y + (row_z * ((log_theta - row_x))));
    }

    function velocity_at(ix, iy, n_total) {
        let _inl_14_result;
        _inl_14: {
            _inl_14_result = ((iy * n_total) + ix);
            break _inl_14;
        }
        const _sroa_2_base = ((_inl_14_result) * 4 + 0);
        const u0_x = bindings.U0[_sroa_2_base + 0];
        const u0_y = bindings.U0[_sroa_2_base + 1];
        const u0_z = bindings.U0[_sroa_2_base + 2];
        const u0_w = bindings.U0[_sroa_2_base + 3];
        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
        return {x:(u0_y / rho), y:(u0_z / rho), z:(u0_w / rho)};
    }

    function __wgsl_ret_velocity_at_x(ix, iy, n_total) {
        let _inl_14_result;
        _inl_14: {
            _inl_14_result = ((iy * n_total) + ix);
            break _inl_14;
        }
        const _sroa_3_base = ((_inl_14_result) * 4 + 0);
        const u0_x = bindings.U0[_sroa_3_base + 0];
        const u0_y = bindings.U0[_sroa_3_base + 1];
        const u0_z = bindings.U0[_sroa_3_base + 2];
        const u0_w = bindings.U0[_sroa_3_base + 3];
        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
        return (u0_y / rho);
    }

    function __wgsl_ret_velocity_at_y(ix, iy, n_total) {
        let _inl_14_result;
        _inl_14: {
            _inl_14_result = ((iy * n_total) + ix);
            break _inl_14;
        }
        const _sroa_4_base = ((_inl_14_result) * 4 + 0);
        const u0_x = bindings.U0[_sroa_4_base + 0];
        const u0_y = bindings.U0[_sroa_4_base + 1];
        const u0_z = bindings.U0[_sroa_4_base + 2];
        const u0_w = bindings.U0[_sroa_4_base + 3];
        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
        return (u0_z / rho);
    }

    function div_v_at(ix, iy, n_total) {
        const inv_2dx = (0.5 / bindings.U_uniforms.dx);
        const vx_r = __wgsl_ret_velocity_at_x((ix + 1), iy, n_total);
        const vx_l = __wgsl_ret_velocity_at_x((ix - 1), iy, n_total);
        const vy_u = __wgsl_ret_velocity_at_y(ix, (iy + 1), n_total);
        const vy_d = __wgsl_ret_velocity_at_y(ix, (iy - 1), n_total);
        return (((((vx_r - vx_l) + vy_u) - vy_d)) * inv_2dx);
    }

    function cell_bhat(ix, iy, n_total) {
        let _inl_16_result;
        _inl_16: {
            _inl_16_result = ((iy * ((n_total + 1))) + ix);
            break _inl_16;
        }
        const _inl_17_ix = (ix + 1);
        let _inl_17_result;
        _inl_17: {
            _inl_17_result = ((iy * ((n_total + 1))) + _inl_17_ix);
            break _inl_17;
        }
        const bx = (0.5 * ((bindings.Bx_face[_inl_16_result] + bindings.Bx_face[_inl_17_result])));
        let _inl_18_result;
        _inl_18: {
            _inl_18_result = ((iy * n_total) + ix);
            break _inl_18;
        }
        const _inl_19_iy = (iy + 1);
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = ((_inl_19_iy * n_total) + ix);
            break _inl_19;
        }
        const by = (0.5 * ((bindings.By_face[_inl_18_result] + bindings.By_face[_inl_19_result])));
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = ((iy * n_total) + ix);
            break _inl_20;
        }
        const bz = bindings.U1[((_inl_20_result) * 4 + 0) + 1];
        const b2 = (((bx * bx) + (by * by)) + (bz * bz));
        if ((b2 <= 1.0e-20)) {
            return {x:0.0, y:0.0, z:0.0};
        }
        return {x:(bx / Math.sqrt(b2)), y:(by / Math.sqrt(b2)), z:(bz / Math.sqrt(b2))};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["compute_delta"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_compute_delta(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_cooling_T_ref = _b_U_uniforms.cooling_T_ref;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_viscosity_nu = _b_U_uniforms.viscosity_nu;
        const _u_U_uniforms_viscosity_bulk = _b_U_uniforms.viscosity_bulk;
        const _u_U_uniforms_viscosity_aniso_frac = _b_U_uniforms.viscosity_aniso_frac;
        const _u_U_uniforms_viscosity_shock = _b_U_uniforms.viscosity_shock;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_dU_visc = bindings.dU_visc;
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
                const gid_y = Oy;
                __invocation: {
                    const _inl_21_flags = _u_U_uniforms_physics_flags;
                    let _inl_21_result;
                    _inl_21: {
                        _inl_21_result = (((_inl_21_flags & FLAG_VISCOSITY)) != 0);
                        break _inl_21;
                    }
                    if ((!_inl_21_result)) {
                        break __invocation;
                    }
                    const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                    const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                    const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                    if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_22_result;
                    _inl_22: {
                        _inl_22_result = ((iy * n_total) + ix);
                        break _inl_22;
                    }
                    const c = _inl_22_result;
                    const dx = _u_U_uniforms_dx;
                    const inv_dx = (1.0 / dx);
                    const inv_2dx = (0.5 * inv_dx);
                    const inv_dx2 = (inv_dx * inv_dx);
                    const dt = _u_dt_buf_dt;
                    const _sroa_5 = velocity_at(ix, iy, n_total);
                    const vc_x = _sroa_5.x;
                    const vc_y = _sroa_5.y;
                    const vc_z = _sroa_5.z;
                    const _sroa_6 = velocity_at((ix - 1), iy, n_total);
                    const vl_x = _sroa_6.x;
                    const vl_y = _sroa_6.y;
                    const vl_z = _sroa_6.z;
                    const _sroa_7 = velocity_at((ix + 1), iy, n_total);
                    const vr_x = _sroa_7.x;
                    const vr_y = _sroa_7.y;
                    const vr_z = _sroa_7.z;
                    const _sroa_8 = velocity_at(ix, (iy - 1), n_total);
                    const vd_x = _sroa_8.x;
                    const vd_y = _sroa_8.y;
                    const vd_z = _sroa_8.z;
                    const _sroa_9 = velocity_at(ix, (iy + 1), n_total);
                    const vu_x = _sroa_9.x;
                    const vu_y = _sroa_9.y;
                    const vu_z = _sroa_9.z;
                    const lap_x = (((((vl_x + vr_x) + vd_x) + vu_x) - (4.0 * vc_x)) * inv_dx2);
                    const lap_y = (((((vl_y + vr_y) + vd_y) + vu_y) - (4.0 * vc_y)) * inv_dx2);
                    const lap_z = (((((vl_z + vr_z) + vd_z) + vu_z) - (4.0 * vc_z)) * inv_dx2);
                    const div_c = div_v_at(ix, iy, n_total);
                    const div_l = div_v_at((ix - 1), iy, n_total);
                    const div_r = div_v_at((ix + 1), iy, n_total);
                    const div_d = div_v_at(ix, (iy - 1), n_total);
                    const div_u = div_v_at(ix, (iy + 1), n_total);
                    const grad_div_x = (((div_r - div_l)) * inv_2dx);
                    const grad_div_y = (((div_u - div_d)) * inv_2dx);
                    const grad_div_z = 0.0;
                    let _inl_23_result;
                    _inl_23: {
                        let _inl_23__inl_15_result;
                        _inl_23__inl_15: {
                            _inl_23__inl_15_result = ((iy * n_total) + ix);
                            break _inl_23__inl_15;
                        }
                        _inl_23_result = ((_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]));
                        break _inl_23;
                    }
                    const rho = _inl_23_result;
                    const shock_nu = (((shock0 * dx) * dx) * (((-div_c)) < (0.0) ? (0.0) : ((-div_c))));
                    let _inl_24_result;
                    _inl_24: {
                        let _inl_24__inl_10_result;
                        _inl_24__inl_10: {
                            _inl_24__inl_10_result = ((iy * n_total) + ix);
                            break _inl_24__inl_10;
                        }
                        const _sroa_10_base = ((_inl_24__inl_10_result) * 4 + 0);
                        const _inl_24_u0_x = _b_U0[_sroa_10_base + 0];
                        const _inl_24_u0_y = _b_U0[_sroa_10_base + 1];
                        const _inl_24_u0_z = _b_U0[_sroa_10_base + 2];
                        const _inl_24_u0_w = _b_U0[_sroa_10_base + 3];
                        let _inl_24__inl_11_result;
                        _inl_24__inl_11: {
                            _inl_24__inl_11_result = ((iy * n_total) + ix);
                            break _inl_24__inl_11;
                        }
                        const _sroa_11_base = ((_inl_24__inl_11_result) * 4 + 0);
                        const _inl_24_u1_x = _b_U1[_sroa_11_base + 0];
                        const _inl_24_u1_y = _b_U1[_sroa_11_base + 1];
                        const _inl_24_u1_z = _b_U1[_sroa_11_base + 2];
                        const _inl_24_u1_w = _b_U1[_sroa_11_base + 3];
                        const _inl_24_rho = ((_inl_24_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_24_u0_x));
                        let _inl_24__inl_12_result;
                        _inl_24__inl_12: {
                            let _inl_24__inl_12__inl_6_result;
                            _inl_24__inl_12__inl_6: {
                                _inl_24__inl_12__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_24__inl_12__inl_6;
                            }
                            const _inl_24__inl_12__inl_7_ix = (ix + 1);
                            let _inl_24__inl_12__inl_7_result;
                            _inl_24__inl_12__inl_7: {
                                _inl_24__inl_12__inl_7_result = ((iy * ((n_total + 1))) + _inl_24__inl_12__inl_7_ix);
                                break _inl_24__inl_12__inl_7;
                            }
                            _inl_24__inl_12_result = (0.5 * ((_b_Bx_face[_inl_24__inl_12__inl_6_result] + _b_Bx_face[_inl_24__inl_12__inl_7_result])));
                            break _inl_24__inl_12;
                        }
                        let _inl_24__inl_13_result;
                        _inl_24__inl_13: {
                            let _inl_24__inl_13__inl_8_result;
                            _inl_24__inl_13__inl_8: {
                                _inl_24__inl_13__inl_8_result = ((iy * n_total) + ix);
                                break _inl_24__inl_13__inl_8;
                            }
                            const _inl_24__inl_13__inl_9_iy = (iy + 1);
                            let _inl_24__inl_13__inl_9_result;
                            _inl_24__inl_13__inl_9: {
                                _inl_24__inl_13__inl_9_result = ((_inl_24__inl_13__inl_9_iy * n_total) + ix);
                                break _inl_24__inl_13__inl_9;
                            }
                            _inl_24__inl_13_result = (0.5 * ((_b_By_face[_inl_24__inl_13__inl_8_result] + _b_By_face[_inl_24__inl_13__inl_9_result])));
                            break _inl_24__inl_13;
                        }
                        const _inl_24_p = pressure_from_dual_energy({x:_inl_24_u0_x, y:_inl_24_u0_y, z:_inl_24_u0_z, w:_inl_24_u0_w}, {x:_inl_24_u1_x, y:_inl_24_u1_y, z:_inl_24_u1_z, w:_inl_24_u1_w}, _inl_24__inl_12_result, _inl_24__inl_13_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        const _inl_24_theta = (((_inl_24_p / _inl_24_rho)) / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                        _inl_24_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_visc(MICRO_TRANSPORT_START_VISC, MICRO_TRANSPORT_COUNT_VISC, _inl_24_theta)), 0.0, TRANSPORT_SCALE_MAX_VISC));
                        break _inl_24;
                    }
                    const tscale = _inl_24_result;
                    const nu = ((nu0 * tscale) + shock_nu);
                    const zeta = ((zeta0 * tscale) + shock_nu);
                    const _sroa_12 = cell_bhat(ix, iy, n_total);
                    const b_x = _sroa_12.x;
                    const b_y = _sroa_12.y;
                    const b_z = _sroa_12.z;
                    const aniso = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_viscosity_aniso_frac, 0.0, 1.0));
                    const _sroa_13 = {x:(b_x * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), y:(b_y * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), z:(b_z * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z)))};
                    const lap_parallel_x = _sroa_13.x;
                    const lap_parallel_y = _sroa_13.y;
                    const lap_parallel_z = _sroa_13.z;
                    const _sroa_14 = {x:(lap_x + (lap_parallel_x - lap_x) * aniso), y:(lap_y + (lap_parallel_y - lap_y) * aniso), z:(lap_z + (lap_parallel_z - lap_z) * aniso)};
                    const lap_eff_x = _sroa_14.x;
                    const lap_eff_y = _sroa_14.y;
                    const lap_eff_z = _sroa_14.z;
                    const force_x = (rho * ((nu * lap_eff_x) + (zeta * grad_div_x)));
                    const force_y = (rho * ((nu * lap_eff_y) + (zeta * grad_div_y)));
                    const force_z = (rho * ((nu * lap_eff_z) + (zeta * grad_div_z)));
                    const d_mom_x = (force_x * dt);
                    const d_mom_y = (force_y * dt);
                    const d_mom_z = (force_z * dt);
                    const dvdx_x = ((vr_x - vl_x) * inv_2dx);
                    const dvdx_y = ((vr_y - vl_y) * inv_2dx);
                    const dvdx_z = ((vr_z - vl_z) * inv_2dx);
                    const dvdy_x = ((vu_x - vd_x) * inv_2dx);
                    const dvdy_y = ((vu_y - vd_y) * inv_2dx);
                    const dvdy_z = ((vu_z - vd_z) * inv_2dx);
                    const div3 = (div_c / 3.0);
                    const sxx = (dvdx_x - div3);
                    const syy = (dvdy_y - div3);
                    const szz = (-div3);
                    const sxy = (0.5 * ((dvdy_x + dvdx_y)));
                    const sxz = (0.5 * dvdx_z);
                    const syz = (0.5 * dvdy_z);
                    const shear_norm = ((((sxx * sxx) + (syy * syy)) + (szz * szz)) + (2.0 * ((((sxy * sxy) + (sxz * sxz)) + (syz * syz)))));
                    const heat_rate = (rho * ((((2.0 * nu) * shear_norm) + ((zeta * div_c) * div_c))));
                    const dE = (((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)) + (heat_rate * dt));
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = d_mom_x;
                        const _wt1 = d_mom_y;
                        const _wt2 = d_mom_z;
                        const _wt3 = dE;
                        _b_dU_visc[_wbase + 0] = _wt0;
                        _b_dU_visc[_wbase + 1] = _wt1;
                        _b_dU_visc[_wbase + 2] = _wt2;
                        _b_dU_visc[_wbase + 3] = _wt3;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const _inl_21_flags = _u_U_uniforms_physics_flags;
                            let _inl_21_result;
                            _inl_21: {
                                _inl_21_result = (((_inl_21_flags & FLAG_VISCOSITY)) != 0);
                                break _inl_21;
                            }
                            if ((!_inl_21_result)) {
                                break __invocation;
                            }
                            const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                            const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                            const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                            if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                                break __invocation;
                            }
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_22_result;
                            _inl_22: {
                                _inl_22_result = ((iy * n_total) + ix);
                                break _inl_22;
                            }
                            const c = _inl_22_result;
                            const dx = _u_U_uniforms_dx;
                            const inv_dx = (1.0 / dx);
                            const inv_2dx = (0.5 * inv_dx);
                            const inv_dx2 = (inv_dx * inv_dx);
                            const dt = _u_dt_buf_dt;
                            const _sroa_15 = velocity_at(ix, iy, n_total);
                            const vc_x = _sroa_15.x;
                            const vc_y = _sroa_15.y;
                            const vc_z = _sroa_15.z;
                            const _sroa_16 = velocity_at((ix - 1), iy, n_total);
                            const vl_x = _sroa_16.x;
                            const vl_y = _sroa_16.y;
                            const vl_z = _sroa_16.z;
                            const _sroa_17 = velocity_at((ix + 1), iy, n_total);
                            const vr_x = _sroa_17.x;
                            const vr_y = _sroa_17.y;
                            const vr_z = _sroa_17.z;
                            const _sroa_18 = velocity_at(ix, (iy - 1), n_total);
                            const vd_x = _sroa_18.x;
                            const vd_y = _sroa_18.y;
                            const vd_z = _sroa_18.z;
                            const _sroa_19 = velocity_at(ix, (iy + 1), n_total);
                            const vu_x = _sroa_19.x;
                            const vu_y = _sroa_19.y;
                            const vu_z = _sroa_19.z;
                            const lap_x = (((((vl_x + vr_x) + vd_x) + vu_x) - (4.0 * vc_x)) * inv_dx2);
                            const lap_y = (((((vl_y + vr_y) + vd_y) + vu_y) - (4.0 * vc_y)) * inv_dx2);
                            const lap_z = (((((vl_z + vr_z) + vd_z) + vu_z) - (4.0 * vc_z)) * inv_dx2);
                            const div_c = div_v_at(ix, iy, n_total);
                            const div_l = div_v_at((ix - 1), iy, n_total);
                            const div_r = div_v_at((ix + 1), iy, n_total);
                            const div_d = div_v_at(ix, (iy - 1), n_total);
                            const div_u = div_v_at(ix, (iy + 1), n_total);
                            const grad_div_x = (((div_r - div_l)) * inv_2dx);
                            const grad_div_y = (((div_u - div_d)) * inv_2dx);
                            const grad_div_z = 0.0;
                            let _inl_23_result;
                            _inl_23: {
                                let _inl_23__inl_15_result;
                                _inl_23__inl_15: {
                                    _inl_23__inl_15_result = ((iy * n_total) + ix);
                                    break _inl_23__inl_15;
                                }
                                _inl_23_result = ((_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]));
                                break _inl_23;
                            }
                            const rho = _inl_23_result;
                            const shock_nu = (((shock0 * dx) * dx) * (((-div_c)) < (0.0) ? (0.0) : ((-div_c))));
                            let _inl_24_result;
                            _inl_24: {
                                let _inl_24__inl_10_result;
                                _inl_24__inl_10: {
                                    _inl_24__inl_10_result = ((iy * n_total) + ix);
                                    break _inl_24__inl_10;
                                }
                                const _sroa_20_base = ((_inl_24__inl_10_result) * 4 + 0);
                                const _inl_24_u0_x = _b_U0[_sroa_20_base + 0];
                                const _inl_24_u0_y = _b_U0[_sroa_20_base + 1];
                                const _inl_24_u0_z = _b_U0[_sroa_20_base + 2];
                                const _inl_24_u0_w = _b_U0[_sroa_20_base + 3];
                                let _inl_24__inl_11_result;
                                _inl_24__inl_11: {
                                    _inl_24__inl_11_result = ((iy * n_total) + ix);
                                    break _inl_24__inl_11;
                                }
                                const _sroa_21_base = ((_inl_24__inl_11_result) * 4 + 0);
                                const _inl_24_u1_x = _b_U1[_sroa_21_base + 0];
                                const _inl_24_u1_y = _b_U1[_sroa_21_base + 1];
                                const _inl_24_u1_z = _b_U1[_sroa_21_base + 2];
                                const _inl_24_u1_w = _b_U1[_sroa_21_base + 3];
                                const _inl_24_rho = ((_inl_24_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_24_u0_x));
                                let _inl_24__inl_12_result;
                                _inl_24__inl_12: {
                                    let _inl_24__inl_12__inl_6_result;
                                    _inl_24__inl_12__inl_6: {
                                        _inl_24__inl_12__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_24__inl_12__inl_6;
                                    }
                                    const _inl_24__inl_12__inl_7_ix = (ix + 1);
                                    let _inl_24__inl_12__inl_7_result;
                                    _inl_24__inl_12__inl_7: {
                                        _inl_24__inl_12__inl_7_result = ((iy * ((n_total + 1))) + _inl_24__inl_12__inl_7_ix);
                                        break _inl_24__inl_12__inl_7;
                                    }
                                    _inl_24__inl_12_result = (0.5 * ((_b_Bx_face[_inl_24__inl_12__inl_6_result] + _b_Bx_face[_inl_24__inl_12__inl_7_result])));
                                    break _inl_24__inl_12;
                                }
                                let _inl_24__inl_13_result;
                                _inl_24__inl_13: {
                                    let _inl_24__inl_13__inl_8_result;
                                    _inl_24__inl_13__inl_8: {
                                        _inl_24__inl_13__inl_8_result = ((iy * n_total) + ix);
                                        break _inl_24__inl_13__inl_8;
                                    }
                                    const _inl_24__inl_13__inl_9_iy = (iy + 1);
                                    let _inl_24__inl_13__inl_9_result;
                                    _inl_24__inl_13__inl_9: {
                                        _inl_24__inl_13__inl_9_result = ((_inl_24__inl_13__inl_9_iy * n_total) + ix);
                                        break _inl_24__inl_13__inl_9;
                                    }
                                    _inl_24__inl_13_result = (0.5 * ((_b_By_face[_inl_24__inl_13__inl_8_result] + _b_By_face[_inl_24__inl_13__inl_9_result])));
                                    break _inl_24__inl_13;
                                }
                                const _inl_24_p = pressure_from_dual_energy({x:_inl_24_u0_x, y:_inl_24_u0_y, z:_inl_24_u0_z, w:_inl_24_u0_w}, {x:_inl_24_u1_x, y:_inl_24_u1_y, z:_inl_24_u1_z, w:_inl_24_u1_w}, _inl_24__inl_12_result, _inl_24__inl_13_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                const _inl_24_theta = (((_inl_24_p / _inl_24_rho)) / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                                _inl_24_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_visc(MICRO_TRANSPORT_START_VISC, MICRO_TRANSPORT_COUNT_VISC, _inl_24_theta)), 0.0, TRANSPORT_SCALE_MAX_VISC));
                                break _inl_24;
                            }
                            const tscale = _inl_24_result;
                            const nu = ((nu0 * tscale) + shock_nu);
                            const zeta = ((zeta0 * tscale) + shock_nu);
                            const _sroa_22 = cell_bhat(ix, iy, n_total);
                            const b_x = _sroa_22.x;
                            const b_y = _sroa_22.y;
                            const b_z = _sroa_22.z;
                            const aniso = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_viscosity_aniso_frac, 0.0, 1.0));
                            const _sroa_23 = {x:(b_x * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), y:(b_y * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), z:(b_z * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z)))};
                            const lap_parallel_x = _sroa_23.x;
                            const lap_parallel_y = _sroa_23.y;
                            const lap_parallel_z = _sroa_23.z;
                            const _sroa_24 = {x:(lap_x + (lap_parallel_x - lap_x) * aniso), y:(lap_y + (lap_parallel_y - lap_y) * aniso), z:(lap_z + (lap_parallel_z - lap_z) * aniso)};
                            const lap_eff_x = _sroa_24.x;
                            const lap_eff_y = _sroa_24.y;
                            const lap_eff_z = _sroa_24.z;
                            const force_x = (rho * ((nu * lap_eff_x) + (zeta * grad_div_x)));
                            const force_y = (rho * ((nu * lap_eff_y) + (zeta * grad_div_y)));
                            const force_z = (rho * ((nu * lap_eff_z) + (zeta * grad_div_z)));
                            const d_mom_x = (force_x * dt);
                            const d_mom_y = (force_y * dt);
                            const d_mom_z = (force_z * dt);
                            const dvdx_x = ((vr_x - vl_x) * inv_2dx);
                            const dvdx_y = ((vr_y - vl_y) * inv_2dx);
                            const dvdx_z = ((vr_z - vl_z) * inv_2dx);
                            const dvdy_x = ((vu_x - vd_x) * inv_2dx);
                            const dvdy_y = ((vu_y - vd_y) * inv_2dx);
                            const dvdy_z = ((vu_z - vd_z) * inv_2dx);
                            const div3 = (div_c / 3.0);
                            const sxx = (dvdx_x - div3);
                            const syy = (dvdy_y - div3);
                            const szz = (-div3);
                            const sxy = (0.5 * ((dvdy_x + dvdx_y)));
                            const sxz = (0.5 * dvdx_z);
                            const syz = (0.5 * dvdy_z);
                            const shear_norm = ((((sxx * sxx) + (syy * syy)) + (szz * szz)) + (2.0 * ((((sxy * sxy) + (sxz * sxz)) + (syz * syz)))));
                            const heat_rate = (rho * ((((2.0 * nu) * shear_norm) + ((zeta * div_c) * div_c))));
                            const dE = (((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)) + (heat_rate * dt));
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = d_mom_x;
                                const _wt1 = d_mom_y;
                                const _wt2 = d_mom_z;
                                const _wt3 = dE;
                                _b_dU_visc[_wbase + 0] = _wt0;
                                _b_dU_visc[_wbase + 1] = _wt1;
                                _b_dU_visc[_wbase + 2] = _wt2;
                                _b_dU_visc[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const _inl_21_flags = _u_U_uniforms_physics_flags;
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = (((_inl_21_flags & FLAG_VISCOSITY)) != 0);
                            break _inl_21;
                        }
                        if ((!_inl_21_result)) {
                            break __invocation;
                        }
                        const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                        const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                        const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                        if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                            break __invocation;
                        }
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_22_result;
                        _inl_22: {
                            _inl_22_result = ((iy * n_total) + ix);
                            break _inl_22;
                        }
                        const c = _inl_22_result;
                        const dx = _u_U_uniforms_dx;
                        const inv_dx = (1.0 / dx);
                        const inv_2dx = (0.5 * inv_dx);
                        const inv_dx2 = (inv_dx * inv_dx);
                        const dt = _u_dt_buf_dt;
                        const _sroa_25 = velocity_at(ix, iy, n_total);
                        const vc_x = _sroa_25.x;
                        const vc_y = _sroa_25.y;
                        const vc_z = _sroa_25.z;
                        const _sroa_26 = velocity_at((ix - 1), iy, n_total);
                        const vl_x = _sroa_26.x;
                        const vl_y = _sroa_26.y;
                        const vl_z = _sroa_26.z;
                        const _sroa_27 = velocity_at((ix + 1), iy, n_total);
                        const vr_x = _sroa_27.x;
                        const vr_y = _sroa_27.y;
                        const vr_z = _sroa_27.z;
                        const _sroa_28 = velocity_at(ix, (iy - 1), n_total);
                        const vd_x = _sroa_28.x;
                        const vd_y = _sroa_28.y;
                        const vd_z = _sroa_28.z;
                        const _sroa_29 = velocity_at(ix, (iy + 1), n_total);
                        const vu_x = _sroa_29.x;
                        const vu_y = _sroa_29.y;
                        const vu_z = _sroa_29.z;
                        const lap_x = (((((vl_x + vr_x) + vd_x) + vu_x) - (4.0 * vc_x)) * inv_dx2);
                        const lap_y = (((((vl_y + vr_y) + vd_y) + vu_y) - (4.0 * vc_y)) * inv_dx2);
                        const lap_z = (((((vl_z + vr_z) + vd_z) + vu_z) - (4.0 * vc_z)) * inv_dx2);
                        const div_c = div_v_at(ix, iy, n_total);
                        const div_l = div_v_at((ix - 1), iy, n_total);
                        const div_r = div_v_at((ix + 1), iy, n_total);
                        const div_d = div_v_at(ix, (iy - 1), n_total);
                        const div_u = div_v_at(ix, (iy + 1), n_total);
                        const grad_div_x = (((div_r - div_l)) * inv_2dx);
                        const grad_div_y = (((div_u - div_d)) * inv_2dx);
                        const grad_div_z = 0.0;
                        let _inl_23_result;
                        _inl_23: {
                            let _inl_23__inl_15_result;
                            _inl_23__inl_15: {
                                _inl_23__inl_15_result = ((iy * n_total) + ix);
                                break _inl_23__inl_15;
                            }
                            _inl_23_result = ((_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]));
                            break _inl_23;
                        }
                        const rho = _inl_23_result;
                        const shock_nu = (((shock0 * dx) * dx) * (((-div_c)) < (0.0) ? (0.0) : ((-div_c))));
                        let _inl_24_result;
                        _inl_24: {
                            let _inl_24__inl_10_result;
                            _inl_24__inl_10: {
                                _inl_24__inl_10_result = ((iy * n_total) + ix);
                                break _inl_24__inl_10;
                            }
                            const _sroa_30_base = ((_inl_24__inl_10_result) * 4 + 0);
                            const _inl_24_u0_x = _b_U0[_sroa_30_base + 0];
                            const _inl_24_u0_y = _b_U0[_sroa_30_base + 1];
                            const _inl_24_u0_z = _b_U0[_sroa_30_base + 2];
                            const _inl_24_u0_w = _b_U0[_sroa_30_base + 3];
                            let _inl_24__inl_11_result;
                            _inl_24__inl_11: {
                                _inl_24__inl_11_result = ((iy * n_total) + ix);
                                break _inl_24__inl_11;
                            }
                            const _sroa_31_base = ((_inl_24__inl_11_result) * 4 + 0);
                            const _inl_24_u1_x = _b_U1[_sroa_31_base + 0];
                            const _inl_24_u1_y = _b_U1[_sroa_31_base + 1];
                            const _inl_24_u1_z = _b_U1[_sroa_31_base + 2];
                            const _inl_24_u1_w = _b_U1[_sroa_31_base + 3];
                            const _inl_24_rho = ((_inl_24_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_24_u0_x));
                            let _inl_24__inl_12_result;
                            _inl_24__inl_12: {
                                let _inl_24__inl_12__inl_6_result;
                                _inl_24__inl_12__inl_6: {
                                    _inl_24__inl_12__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_24__inl_12__inl_6;
                                }
                                const _inl_24__inl_12__inl_7_ix = (ix + 1);
                                let _inl_24__inl_12__inl_7_result;
                                _inl_24__inl_12__inl_7: {
                                    _inl_24__inl_12__inl_7_result = ((iy * ((n_total + 1))) + _inl_24__inl_12__inl_7_ix);
                                    break _inl_24__inl_12__inl_7;
                                }
                                _inl_24__inl_12_result = (0.5 * ((_b_Bx_face[_inl_24__inl_12__inl_6_result] + _b_Bx_face[_inl_24__inl_12__inl_7_result])));
                                break _inl_24__inl_12;
                            }
                            let _inl_24__inl_13_result;
                            _inl_24__inl_13: {
                                let _inl_24__inl_13__inl_8_result;
                                _inl_24__inl_13__inl_8: {
                                    _inl_24__inl_13__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_24__inl_13__inl_8;
                                }
                                const _inl_24__inl_13__inl_9_iy = (iy + 1);
                                let _inl_24__inl_13__inl_9_result;
                                _inl_24__inl_13__inl_9: {
                                    _inl_24__inl_13__inl_9_result = ((_inl_24__inl_13__inl_9_iy * n_total) + ix);
                                    break _inl_24__inl_13__inl_9;
                                }
                                _inl_24__inl_13_result = (0.5 * ((_b_By_face[_inl_24__inl_13__inl_8_result] + _b_By_face[_inl_24__inl_13__inl_9_result])));
                                break _inl_24__inl_13;
                            }
                            const _inl_24_p = pressure_from_dual_energy({x:_inl_24_u0_x, y:_inl_24_u0_y, z:_inl_24_u0_z, w:_inl_24_u0_w}, {x:_inl_24_u1_x, y:_inl_24_u1_y, z:_inl_24_u1_z, w:_inl_24_u1_w}, _inl_24__inl_12_result, _inl_24__inl_13_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            const _inl_24_theta = (((_inl_24_p / _inl_24_rho)) / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                            _inl_24_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_visc(MICRO_TRANSPORT_START_VISC, MICRO_TRANSPORT_COUNT_VISC, _inl_24_theta)), 0.0, TRANSPORT_SCALE_MAX_VISC));
                            break _inl_24;
                        }
                        const tscale = _inl_24_result;
                        const nu = ((nu0 * tscale) + shock_nu);
                        const zeta = ((zeta0 * tscale) + shock_nu);
                        const _sroa_32 = cell_bhat(ix, iy, n_total);
                        const b_x = _sroa_32.x;
                        const b_y = _sroa_32.y;
                        const b_z = _sroa_32.z;
                        const aniso = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_viscosity_aniso_frac, 0.0, 1.0));
                        const _sroa_33 = {x:(b_x * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), y:(b_y * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), z:(b_z * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z)))};
                        const lap_parallel_x = _sroa_33.x;
                        const lap_parallel_y = _sroa_33.y;
                        const lap_parallel_z = _sroa_33.z;
                        const _sroa_34 = {x:(lap_x + (lap_parallel_x - lap_x) * aniso), y:(lap_y + (lap_parallel_y - lap_y) * aniso), z:(lap_z + (lap_parallel_z - lap_z) * aniso)};
                        const lap_eff_x = _sroa_34.x;
                        const lap_eff_y = _sroa_34.y;
                        const lap_eff_z = _sroa_34.z;
                        const force_x = (rho * ((nu * lap_eff_x) + (zeta * grad_div_x)));
                        const force_y = (rho * ((nu * lap_eff_y) + (zeta * grad_div_y)));
                        const force_z = (rho * ((nu * lap_eff_z) + (zeta * grad_div_z)));
                        const d_mom_x = (force_x * dt);
                        const d_mom_y = (force_y * dt);
                        const d_mom_z = (force_z * dt);
                        const dvdx_x = ((vr_x - vl_x) * inv_2dx);
                        const dvdx_y = ((vr_y - vl_y) * inv_2dx);
                        const dvdx_z = ((vr_z - vl_z) * inv_2dx);
                        const dvdy_x = ((vu_x - vd_x) * inv_2dx);
                        const dvdy_y = ((vu_y - vd_y) * inv_2dx);
                        const dvdy_z = ((vu_z - vd_z) * inv_2dx);
                        const div3 = (div_c / 3.0);
                        const sxx = (dvdx_x - div3);
                        const syy = (dvdy_y - div3);
                        const szz = (-div3);
                        const sxy = (0.5 * ((dvdy_x + dvdx_y)));
                        const sxz = (0.5 * dvdx_z);
                        const syz = (0.5 * dvdy_z);
                        const shear_norm = ((((sxx * sxx) + (syy * syy)) + (szz * szz)) + (2.0 * ((((sxy * sxy) + (sxz * sxz)) + (syz * syz)))));
                        const heat_rate = (rho * ((((2.0 * nu) * shear_norm) + ((zeta * div_c) * div_c))));
                        const dE = (((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)) + (heat_rate * dt));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = d_mom_x;
                            const _wt1 = d_mom_y;
                            const _wt2 = d_mom_z;
                            const _wt3 = dE;
                            _b_dU_visc[_wbase + 0] = _wt0;
                            _b_dU_visc[_wbase + 1] = _wt1;
                            _b_dU_visc[_wbase + 2] = _wt2;
                            _b_dU_visc[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const _inl_21_flags = _u_U_uniforms_physics_flags;
                    let _inl_21_result;
                    _inl_21: {
                        _inl_21_result = (((_inl_21_flags & FLAG_VISCOSITY)) != 0);
                        break _inl_21;
                    }
                    if ((!_inl_21_result)) {
                        break __invocation;
                    }
                    const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                    const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                    const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                    if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_22_result;
                    _inl_22: {
                        _inl_22_result = ((iy * n_total) + ix);
                        break _inl_22;
                    }
                    const c = _inl_22_result;
                    const dx = _u_U_uniforms_dx;
                    const inv_dx = (1.0 / dx);
                    const inv_2dx = (0.5 * inv_dx);
                    const inv_dx2 = (inv_dx * inv_dx);
                    const dt = _u_dt_buf_dt;
                    const _sroa_35 = velocity_at(ix, iy, n_total);
                    const vc_x = _sroa_35.x;
                    const vc_y = _sroa_35.y;
                    const vc_z = _sroa_35.z;
                    const _sroa_36 = velocity_at((ix - 1), iy, n_total);
                    const vl_x = _sroa_36.x;
                    const vl_y = _sroa_36.y;
                    const vl_z = _sroa_36.z;
                    const _sroa_37 = velocity_at((ix + 1), iy, n_total);
                    const vr_x = _sroa_37.x;
                    const vr_y = _sroa_37.y;
                    const vr_z = _sroa_37.z;
                    const _sroa_38 = velocity_at(ix, (iy - 1), n_total);
                    const vd_x = _sroa_38.x;
                    const vd_y = _sroa_38.y;
                    const vd_z = _sroa_38.z;
                    const _sroa_39 = velocity_at(ix, (iy + 1), n_total);
                    const vu_x = _sroa_39.x;
                    const vu_y = _sroa_39.y;
                    const vu_z = _sroa_39.z;
                    const lap_x = (((((vl_x + vr_x) + vd_x) + vu_x) - (4.0 * vc_x)) * inv_dx2);
                    const lap_y = (((((vl_y + vr_y) + vd_y) + vu_y) - (4.0 * vc_y)) * inv_dx2);
                    const lap_z = (((((vl_z + vr_z) + vd_z) + vu_z) - (4.0 * vc_z)) * inv_dx2);
                    const div_c = div_v_at(ix, iy, n_total);
                    const div_l = div_v_at((ix - 1), iy, n_total);
                    const div_r = div_v_at((ix + 1), iy, n_total);
                    const div_d = div_v_at(ix, (iy - 1), n_total);
                    const div_u = div_v_at(ix, (iy + 1), n_total);
                    const grad_div_x = (((div_r - div_l)) * inv_2dx);
                    const grad_div_y = (((div_u - div_d)) * inv_2dx);
                    const grad_div_z = 0.0;
                    let _inl_23_result;
                    _inl_23: {
                        let _inl_23__inl_15_result;
                        _inl_23__inl_15: {
                            _inl_23__inl_15_result = ((iy * n_total) + ix);
                            break _inl_23__inl_15;
                        }
                        _inl_23_result = ((_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_23__inl_15_result) * 4 + 0) + 0]));
                        break _inl_23;
                    }
                    const rho = _inl_23_result;
                    const shock_nu = (((shock0 * dx) * dx) * (((-div_c)) < (0.0) ? (0.0) : ((-div_c))));
                    let _inl_24_result;
                    _inl_24: {
                        let _inl_24__inl_10_result;
                        _inl_24__inl_10: {
                            _inl_24__inl_10_result = ((iy * n_total) + ix);
                            break _inl_24__inl_10;
                        }
                        const _sroa_40_base = ((_inl_24__inl_10_result) * 4 + 0);
                        const _inl_24_u0_x = _b_U0[_sroa_40_base + 0];
                        const _inl_24_u0_y = _b_U0[_sroa_40_base + 1];
                        const _inl_24_u0_z = _b_U0[_sroa_40_base + 2];
                        const _inl_24_u0_w = _b_U0[_sroa_40_base + 3];
                        let _inl_24__inl_11_result;
                        _inl_24__inl_11: {
                            _inl_24__inl_11_result = ((iy * n_total) + ix);
                            break _inl_24__inl_11;
                        }
                        const _sroa_41_base = ((_inl_24__inl_11_result) * 4 + 0);
                        const _inl_24_u1_x = _b_U1[_sroa_41_base + 0];
                        const _inl_24_u1_y = _b_U1[_sroa_41_base + 1];
                        const _inl_24_u1_z = _b_U1[_sroa_41_base + 2];
                        const _inl_24_u1_w = _b_U1[_sroa_41_base + 3];
                        const _inl_24_rho = ((_inl_24_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_24_u0_x));
                        let _inl_24__inl_12_result;
                        _inl_24__inl_12: {
                            let _inl_24__inl_12__inl_6_result;
                            _inl_24__inl_12__inl_6: {
                                _inl_24__inl_12__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_24__inl_12__inl_6;
                            }
                            const _inl_24__inl_12__inl_7_ix = (ix + 1);
                            let _inl_24__inl_12__inl_7_result;
                            _inl_24__inl_12__inl_7: {
                                _inl_24__inl_12__inl_7_result = ((iy * ((n_total + 1))) + _inl_24__inl_12__inl_7_ix);
                                break _inl_24__inl_12__inl_7;
                            }
                            _inl_24__inl_12_result = (0.5 * ((_b_Bx_face[_inl_24__inl_12__inl_6_result] + _b_Bx_face[_inl_24__inl_12__inl_7_result])));
                            break _inl_24__inl_12;
                        }
                        let _inl_24__inl_13_result;
                        _inl_24__inl_13: {
                            let _inl_24__inl_13__inl_8_result;
                            _inl_24__inl_13__inl_8: {
                                _inl_24__inl_13__inl_8_result = ((iy * n_total) + ix);
                                break _inl_24__inl_13__inl_8;
                            }
                            const _inl_24__inl_13__inl_9_iy = (iy + 1);
                            let _inl_24__inl_13__inl_9_result;
                            _inl_24__inl_13__inl_9: {
                                _inl_24__inl_13__inl_9_result = ((_inl_24__inl_13__inl_9_iy * n_total) + ix);
                                break _inl_24__inl_13__inl_9;
                            }
                            _inl_24__inl_13_result = (0.5 * ((_b_By_face[_inl_24__inl_13__inl_8_result] + _b_By_face[_inl_24__inl_13__inl_9_result])));
                            break _inl_24__inl_13;
                        }
                        const _inl_24_p = pressure_from_dual_energy({x:_inl_24_u0_x, y:_inl_24_u0_y, z:_inl_24_u0_z, w:_inl_24_u0_w}, {x:_inl_24_u1_x, y:_inl_24_u1_y, z:_inl_24_u1_z, w:_inl_24_u1_w}, _inl_24__inl_12_result, _inl_24__inl_13_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        const _inl_24_theta = (((_inl_24_p / _inl_24_rho)) / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                        _inl_24_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_visc(MICRO_TRANSPORT_START_VISC, MICRO_TRANSPORT_COUNT_VISC, _inl_24_theta)), 0.0, TRANSPORT_SCALE_MAX_VISC));
                        break _inl_24;
                    }
                    const tscale = _inl_24_result;
                    const nu = ((nu0 * tscale) + shock_nu);
                    const zeta = ((zeta0 * tscale) + shock_nu);
                    const _sroa_42 = cell_bhat(ix, iy, n_total);
                    const b_x = _sroa_42.x;
                    const b_y = _sroa_42.y;
                    const b_z = _sroa_42.z;
                    const aniso = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_viscosity_aniso_frac, 0.0, 1.0));
                    const _sroa_43 = {x:(b_x * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), y:(b_y * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z))), z:(b_z * ((lap_x * b_x) + (lap_y * b_y) + (lap_z * b_z)))};
                    const lap_parallel_x = _sroa_43.x;
                    const lap_parallel_y = _sroa_43.y;
                    const lap_parallel_z = _sroa_43.z;
                    const _sroa_44 = {x:(lap_x + (lap_parallel_x - lap_x) * aniso), y:(lap_y + (lap_parallel_y - lap_y) * aniso), z:(lap_z + (lap_parallel_z - lap_z) * aniso)};
                    const lap_eff_x = _sroa_44.x;
                    const lap_eff_y = _sroa_44.y;
                    const lap_eff_z = _sroa_44.z;
                    const force_x = (rho * ((nu * lap_eff_x) + (zeta * grad_div_x)));
                    const force_y = (rho * ((nu * lap_eff_y) + (zeta * grad_div_y)));
                    const force_z = (rho * ((nu * lap_eff_z) + (zeta * grad_div_z)));
                    const d_mom_x = (force_x * dt);
                    const d_mom_y = (force_y * dt);
                    const d_mom_z = (force_z * dt);
                    const dvdx_x = ((vr_x - vl_x) * inv_2dx);
                    const dvdx_y = ((vr_y - vl_y) * inv_2dx);
                    const dvdx_z = ((vr_z - vl_z) * inv_2dx);
                    const dvdy_x = ((vu_x - vd_x) * inv_2dx);
                    const dvdy_y = ((vu_y - vd_y) * inv_2dx);
                    const dvdy_z = ((vu_z - vd_z) * inv_2dx);
                    const div3 = (div_c / 3.0);
                    const sxx = (dvdx_x - div3);
                    const syy = (dvdy_y - div3);
                    const szz = (-div3);
                    const sxy = (0.5 * ((dvdy_x + dvdx_y)));
                    const sxz = (0.5 * dvdx_z);
                    const syz = (0.5 * dvdy_z);
                    const shear_norm = ((((sxx * sxx) + (syy * syy)) + (szz * szz)) + (2.0 * ((((sxy * sxy) + (sxz * sxz)) + (syz * syz)))));
                    const heat_rate = (rho * ((((2.0 * nu) * shear_norm) + ((zeta * div_c) * div_c))));
                    const dE = (((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)) + (heat_rate * dt));
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = d_mom_x;
                        const _wt1 = d_mom_y;
                        const _wt2 = d_mom_z;
                        const _wt3 = dE;
                        _b_dU_visc[_wbase + 0] = _wt0;
                        _b_dU_visc[_wbase + 1] = _wt1;
                        _b_dU_visc[_wbase + 2] = _wt2;
                        _b_dU_visc[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["compute_delta"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_compute_delta(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_delta"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_apply_delta(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_viscosity_nu = _b_U_uniforms.viscosity_nu;
        const _u_U_uniforms_viscosity_bulk = _b_U_uniforms.viscosity_bulk;
        const _u_U_uniforms_viscosity_shock = _b_U_uniforms.viscosity_shock;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_dU_visc = bindings.dU_visc;
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
                const gid_y = Oy;
                __invocation: {
                    const _inl_25_flags = _u_U_uniforms_physics_flags;
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = (((_inl_25_flags & FLAG_VISCOSITY)) != 0);
                        break _inl_25;
                    }
                    if ((!_inl_25_result)) {
                        break __invocation;
                    }
                    const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                    const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                    const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                    if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_26_result;
                    _inl_26: {
                        _inl_26_result = ((iy * n_total) + ix);
                        break _inl_26;
                    }
                    const c = _inl_26_result;
                    const _sroa_45_base = ((c) * 4 + 0);
                    const du_x = _b_dU_visc[_sroa_45_base + 0];
                    const du_y = _b_dU_visc[_sroa_45_base + 1];
                    const du_z = _b_dU_visc[_sroa_45_base + 2];
                    const du_w = _b_dU_visc[_sroa_45_base + 3];
                    const _sroa_46_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_46_base + 0];
                    const u0_y = _b_U0[_sroa_46_base + 1];
                    const u0_z = _b_U0[_sroa_46_base + 2];
                    const u0_w = _b_U0[_sroa_46_base + 3];
                    const _sroa_47_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_47_base + 0];
                    const u1_y = _b_U1[_sroa_47_base + 1];
                    const u1_z = _b_U1[_sroa_47_base + 2];
                    const u1_w = _b_U1[_sroa_47_base + 3];
                    const rho_old = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const vc_x = (u0_y / rho_old);
                    const vc_y = (u0_z / rho_old);
                    const vc_z = (u0_w / rho_old);
                    const _sroa_48 = {x:du_x, y:du_y, z:du_z};
                    const d_mom_raw_x = _sroa_48.x;
                    const d_mom_raw_y = _sroa_48.y;
                    const d_mom_raw_z = _sroa_48.z;
                    const dt_visc = ((_u_dt_buf_dt) < (1.0e-30) ? (1.0e-30) : (_u_dt_buf_dt));
                    const dmom_cap = (((FE_DMOM_CAP_FRAC * rho_old) * _u_U_uniforms_dx) / dt_visc);
                    const dmom_mag = Math.hypot(d_mom_raw_x, d_mom_raw_y, d_mom_raw_z);
                    const _sroa_49 = {x:((dmom_mag > dmom_cap) ? (d_mom_raw_x * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_x), y:((dmom_mag > dmom_cap) ? (d_mom_raw_y * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_y), z:((dmom_mag > dmom_cap) ? (d_mom_raw_z * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_z)};
                    const d_mom_x = _sroa_49.x;
                    const d_mom_y = _sroa_49.y;
                    const d_mom_z = _sroa_49.z;
                    const dE_lim = ((du_w - ((vc_x * d_mom_raw_x) + (vc_y * d_mom_raw_y) + (vc_z * d_mom_raw_z))) + ((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)));
                    const _sroa_50 = {x:u0_x, y:(u0_y + d_mom_x), z:(u0_z + d_mom_y), w:(u0_w + d_mom_z)};
                    const u0_new_x = _sroa_50.x;
                    const u0_new_y = _sroa_50.y;
                    const u0_new_z = _sroa_50.z;
                    const u0_new_w = _sroa_50.w;
                    const E = (u1_x + dE_lim);
                    const rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                    let _inl_27_result;
                    _inl_27: {
                        let _inl_27__inl_6_result;
                        _inl_27__inl_6: {
                            _inl_27__inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_27__inl_6;
                        }
                        const _inl_27__inl_7_ix = (ix + 1);
                        let _inl_27__inl_7_result;
                        _inl_27__inl_7: {
                            _inl_27__inl_7_result = ((iy * ((n_total + 1))) + _inl_27__inl_7_ix);
                            break _inl_27__inl_7;
                        }
                        _inl_27_result = (0.5 * ((_b_Bx_face[_inl_27__inl_6_result] + _b_Bx_face[_inl_27__inl_7_result])));
                        break _inl_27;
                    }
                    const bx = _inl_27_result;
                    let _inl_28_result;
                    _inl_28: {
                        let _inl_28__inl_8_result;
                        _inl_28__inl_8: {
                            _inl_28__inl_8_result = ((iy * n_total) + ix);
                            break _inl_28__inl_8;
                        }
                        const _inl_28__inl_9_iy = (iy + 1);
                        let _inl_28__inl_9_result;
                        _inl_28__inl_9: {
                            _inl_28__inl_9_result = ((_inl_28__inl_9_iy * n_total) + ix);
                            break _inl_28__inl_9;
                        }
                        _inl_28_result = (0.5 * ((_b_By_face[_inl_28__inl_8_result] + _b_By_face[_inl_28__inl_9_result])));
                        break _inl_28;
                    }
                    const by = _inl_28_result;
                    const ke = ((0.5 * ((((u0_new_y * u0_new_y) + (u0_new_z * u0_new_z)) + (u0_new_w * u0_new_w)))) / rho);
                    const mb = (0.5 * ((((bx * bx) + (by * by)) + (u1_y * u1_y))));
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_new_x;
                        const _wt1 = u0_new_y;
                        const _wt2 = u0_new_z;
                        const _wt3 = u0_new_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_29_bz = u1_y;
                    const _inl_29_gamma = _u_U_uniforms_gamma;
                    const _inl_29_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_29_result_x, _inl_29_result_y, _inl_29_result_z, _inl_29_result_w;
                    _inl_29: {
                        const _inl_29_p_safe = ((p) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (p));
                        const _inl_29_eth = (_inl_29_p_safe / (((_inl_29_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_29_gamma - 1.0))));
                        let _inl_29__inl_4_result;
                        _inl_29__inl_4: {
                            _inl_29__inl_4_result = (((_inl_29_p_safe) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (_inl_29_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_29_gamma));
                            break _inl_29__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_29_bz;
                        const _ir2 = _inl_29_eth;
                        const _ir3 = _inl_29__inl_4_result;
                        _inl_29_result_x = _ir0;
                        _inl_29_result_y = _ir1;
                        _inl_29_result_z = _ir2;
                        _inl_29_result_w = _ir3;
                        break _inl_29;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_29_result_x;
                        const _wt1 = _inl_29_result_y;
                        const _wt2 = _inl_29_result_z;
                        const _wt3 = _inl_29_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const _inl_25_flags = _u_U_uniforms_physics_flags;
                            let _inl_25_result;
                            _inl_25: {
                                _inl_25_result = (((_inl_25_flags & FLAG_VISCOSITY)) != 0);
                                break _inl_25;
                            }
                            if ((!_inl_25_result)) {
                                break __invocation;
                            }
                            const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                            const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                            const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                            if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                                break __invocation;
                            }
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_26_result;
                            _inl_26: {
                                _inl_26_result = ((iy * n_total) + ix);
                                break _inl_26;
                            }
                            const c = _inl_26_result;
                            const _sroa_51_base = ((c) * 4 + 0);
                            const du_x = _b_dU_visc[_sroa_51_base + 0];
                            const du_y = _b_dU_visc[_sroa_51_base + 1];
                            const du_z = _b_dU_visc[_sroa_51_base + 2];
                            const du_w = _b_dU_visc[_sroa_51_base + 3];
                            const _sroa_52_base = ((c) * 4 + 0);
                            const u0_x = _b_U0[_sroa_52_base + 0];
                            const u0_y = _b_U0[_sroa_52_base + 1];
                            const u0_z = _b_U0[_sroa_52_base + 2];
                            const u0_w = _b_U0[_sroa_52_base + 3];
                            const _sroa_53_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_53_base + 0];
                            const u1_y = _b_U1[_sroa_53_base + 1];
                            const u1_z = _b_U1[_sroa_53_base + 2];
                            const u1_w = _b_U1[_sroa_53_base + 3];
                            const rho_old = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const vc_x = (u0_y / rho_old);
                            const vc_y = (u0_z / rho_old);
                            const vc_z = (u0_w / rho_old);
                            const _sroa_54 = {x:du_x, y:du_y, z:du_z};
                            const d_mom_raw_x = _sroa_54.x;
                            const d_mom_raw_y = _sroa_54.y;
                            const d_mom_raw_z = _sroa_54.z;
                            const dt_visc = ((_u_dt_buf_dt) < (1.0e-30) ? (1.0e-30) : (_u_dt_buf_dt));
                            const dmom_cap = (((FE_DMOM_CAP_FRAC * rho_old) * _u_U_uniforms_dx) / dt_visc);
                            const dmom_mag = Math.hypot(d_mom_raw_x, d_mom_raw_y, d_mom_raw_z);
                            const _sroa_55 = {x:((dmom_mag > dmom_cap) ? (d_mom_raw_x * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_x), y:((dmom_mag > dmom_cap) ? (d_mom_raw_y * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_y), z:((dmom_mag > dmom_cap) ? (d_mom_raw_z * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_z)};
                            const d_mom_x = _sroa_55.x;
                            const d_mom_y = _sroa_55.y;
                            const d_mom_z = _sroa_55.z;
                            const dE_lim = ((du_w - ((vc_x * d_mom_raw_x) + (vc_y * d_mom_raw_y) + (vc_z * d_mom_raw_z))) + ((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)));
                            const _sroa_56 = {x:u0_x, y:(u0_y + d_mom_x), z:(u0_z + d_mom_y), w:(u0_w + d_mom_z)};
                            const u0_new_x = _sroa_56.x;
                            const u0_new_y = _sroa_56.y;
                            const u0_new_z = _sroa_56.z;
                            const u0_new_w = _sroa_56.w;
                            const E = (u1_x + dE_lim);
                            const rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                            let _inl_27_result;
                            _inl_27: {
                                let _inl_27__inl_6_result;
                                _inl_27__inl_6: {
                                    _inl_27__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_27__inl_6;
                                }
                                const _inl_27__inl_7_ix = (ix + 1);
                                let _inl_27__inl_7_result;
                                _inl_27__inl_7: {
                                    _inl_27__inl_7_result = ((iy * ((n_total + 1))) + _inl_27__inl_7_ix);
                                    break _inl_27__inl_7;
                                }
                                _inl_27_result = (0.5 * ((_b_Bx_face[_inl_27__inl_6_result] + _b_Bx_face[_inl_27__inl_7_result])));
                                break _inl_27;
                            }
                            const bx = _inl_27_result;
                            let _inl_28_result;
                            _inl_28: {
                                let _inl_28__inl_8_result;
                                _inl_28__inl_8: {
                                    _inl_28__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_28__inl_8;
                                }
                                const _inl_28__inl_9_iy = (iy + 1);
                                let _inl_28__inl_9_result;
                                _inl_28__inl_9: {
                                    _inl_28__inl_9_result = ((_inl_28__inl_9_iy * n_total) + ix);
                                    break _inl_28__inl_9;
                                }
                                _inl_28_result = (0.5 * ((_b_By_face[_inl_28__inl_8_result] + _b_By_face[_inl_28__inl_9_result])));
                                break _inl_28;
                            }
                            const by = _inl_28_result;
                            const ke = ((0.5 * ((((u0_new_y * u0_new_y) + (u0_new_z * u0_new_z)) + (u0_new_w * u0_new_w)))) / rho);
                            const mb = (0.5 * ((((bx * bx) + (by * by)) + (u1_y * u1_y))));
                            const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = u0_new_x;
                                const _wt1 = u0_new_y;
                                const _wt2 = u0_new_z;
                                const _wt3 = u0_new_w;
                                _b_U0[_wbase + 0] = _wt0;
                                _b_U0[_wbase + 1] = _wt1;
                                _b_U0[_wbase + 2] = _wt2;
                                _b_U0[_wbase + 3] = _wt3;
                            }
                            const _inl_29_bz = u1_y;
                            const _inl_29_gamma = _u_U_uniforms_gamma;
                            const _inl_29_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_29_result_x, _inl_29_result_y, _inl_29_result_z, _inl_29_result_w;
                            _inl_29: {
                                const _inl_29_p_safe = ((p) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (p));
                                const _inl_29_eth = (_inl_29_p_safe / (((_inl_29_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_29_gamma - 1.0))));
                                let _inl_29__inl_4_result;
                                _inl_29__inl_4: {
                                    _inl_29__inl_4_result = (((_inl_29_p_safe) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (_inl_29_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_29_gamma));
                                    break _inl_29__inl_4;
                                }
                                const _ir0 = E;
                                const _ir1 = _inl_29_bz;
                                const _ir2 = _inl_29_eth;
                                const _ir3 = _inl_29__inl_4_result;
                                _inl_29_result_x = _ir0;
                                _inl_29_result_y = _ir1;
                                _inl_29_result_z = _ir2;
                                _inl_29_result_w = _ir3;
                                break _inl_29;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_29_result_x;
                                const _wt1 = _inl_29_result_y;
                                const _wt2 = _inl_29_result_z;
                                const _wt3 = _inl_29_result_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const _inl_25_flags = _u_U_uniforms_physics_flags;
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = (((_inl_25_flags & FLAG_VISCOSITY)) != 0);
                            break _inl_25;
                        }
                        if ((!_inl_25_result)) {
                            break __invocation;
                        }
                        const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                        const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                        const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                        if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                            break __invocation;
                        }
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_26_result;
                        _inl_26: {
                            _inl_26_result = ((iy * n_total) + ix);
                            break _inl_26;
                        }
                        const c = _inl_26_result;
                        const _sroa_57_base = ((c) * 4 + 0);
                        const du_x = _b_dU_visc[_sroa_57_base + 0];
                        const du_y = _b_dU_visc[_sroa_57_base + 1];
                        const du_z = _b_dU_visc[_sroa_57_base + 2];
                        const du_w = _b_dU_visc[_sroa_57_base + 3];
                        const _sroa_58_base = ((c) * 4 + 0);
                        const u0_x = _b_U0[_sroa_58_base + 0];
                        const u0_y = _b_U0[_sroa_58_base + 1];
                        const u0_z = _b_U0[_sroa_58_base + 2];
                        const u0_w = _b_U0[_sroa_58_base + 3];
                        const _sroa_59_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_59_base + 0];
                        const u1_y = _b_U1[_sroa_59_base + 1];
                        const u1_z = _b_U1[_sroa_59_base + 2];
                        const u1_w = _b_U1[_sroa_59_base + 3];
                        const rho_old = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const vc_x = (u0_y / rho_old);
                        const vc_y = (u0_z / rho_old);
                        const vc_z = (u0_w / rho_old);
                        const _sroa_60 = {x:du_x, y:du_y, z:du_z};
                        const d_mom_raw_x = _sroa_60.x;
                        const d_mom_raw_y = _sroa_60.y;
                        const d_mom_raw_z = _sroa_60.z;
                        const dt_visc = ((_u_dt_buf_dt) < (1.0e-30) ? (1.0e-30) : (_u_dt_buf_dt));
                        const dmom_cap = (((FE_DMOM_CAP_FRAC * rho_old) * _u_U_uniforms_dx) / dt_visc);
                        const dmom_mag = Math.hypot(d_mom_raw_x, d_mom_raw_y, d_mom_raw_z);
                        const _sroa_61 = {x:((dmom_mag > dmom_cap) ? (d_mom_raw_x * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_x), y:((dmom_mag > dmom_cap) ? (d_mom_raw_y * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_y), z:((dmom_mag > dmom_cap) ? (d_mom_raw_z * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_z)};
                        const d_mom_x = _sroa_61.x;
                        const d_mom_y = _sroa_61.y;
                        const d_mom_z = _sroa_61.z;
                        const dE_lim = ((du_w - ((vc_x * d_mom_raw_x) + (vc_y * d_mom_raw_y) + (vc_z * d_mom_raw_z))) + ((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)));
                        const _sroa_62 = {x:u0_x, y:(u0_y + d_mom_x), z:(u0_z + d_mom_y), w:(u0_w + d_mom_z)};
                        const u0_new_x = _sroa_62.x;
                        const u0_new_y = _sroa_62.y;
                        const u0_new_z = _sroa_62.z;
                        const u0_new_w = _sroa_62.w;
                        const E = (u1_x + dE_lim);
                        const rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                        let _inl_27_result;
                        _inl_27: {
                            let _inl_27__inl_6_result;
                            _inl_27__inl_6: {
                                _inl_27__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_27__inl_6;
                            }
                            const _inl_27__inl_7_ix = (ix + 1);
                            let _inl_27__inl_7_result;
                            _inl_27__inl_7: {
                                _inl_27__inl_7_result = ((iy * ((n_total + 1))) + _inl_27__inl_7_ix);
                                break _inl_27__inl_7;
                            }
                            _inl_27_result = (0.5 * ((_b_Bx_face[_inl_27__inl_6_result] + _b_Bx_face[_inl_27__inl_7_result])));
                            break _inl_27;
                        }
                        const bx = _inl_27_result;
                        let _inl_28_result;
                        _inl_28: {
                            let _inl_28__inl_8_result;
                            _inl_28__inl_8: {
                                _inl_28__inl_8_result = ((iy * n_total) + ix);
                                break _inl_28__inl_8;
                            }
                            const _inl_28__inl_9_iy = (iy + 1);
                            let _inl_28__inl_9_result;
                            _inl_28__inl_9: {
                                _inl_28__inl_9_result = ((_inl_28__inl_9_iy * n_total) + ix);
                                break _inl_28__inl_9;
                            }
                            _inl_28_result = (0.5 * ((_b_By_face[_inl_28__inl_8_result] + _b_By_face[_inl_28__inl_9_result])));
                            break _inl_28;
                        }
                        const by = _inl_28_result;
                        const ke = ((0.5 * ((((u0_new_y * u0_new_y) + (u0_new_z * u0_new_z)) + (u0_new_w * u0_new_w)))) / rho);
                        const mb = (0.5 * ((((bx * bx) + (by * by)) + (u1_y * u1_y))));
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u0_new_x;
                            const _wt1 = u0_new_y;
                            const _wt2 = u0_new_z;
                            const _wt3 = u0_new_w;
                            _b_U0[_wbase + 0] = _wt0;
                            _b_U0[_wbase + 1] = _wt1;
                            _b_U0[_wbase + 2] = _wt2;
                            _b_U0[_wbase + 3] = _wt3;
                        }
                        const _inl_29_bz = u1_y;
                        const _inl_29_gamma = _u_U_uniforms_gamma;
                        const _inl_29_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_29_result_x, _inl_29_result_y, _inl_29_result_z, _inl_29_result_w;
                        _inl_29: {
                            const _inl_29_p_safe = ((p) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (p));
                            const _inl_29_eth = (_inl_29_p_safe / (((_inl_29_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_29_gamma - 1.0))));
                            let _inl_29__inl_4_result;
                            _inl_29__inl_4: {
                                _inl_29__inl_4_result = (((_inl_29_p_safe) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (_inl_29_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_29_gamma));
                                break _inl_29__inl_4;
                            }
                            const _ir0 = E;
                            const _ir1 = _inl_29_bz;
                            const _ir2 = _inl_29_eth;
                            const _ir3 = _inl_29__inl_4_result;
                            _inl_29_result_x = _ir0;
                            _inl_29_result_y = _ir1;
                            _inl_29_result_z = _ir2;
                            _inl_29_result_w = _ir3;
                            break _inl_29;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_29_result_x;
                            const _wt1 = _inl_29_result_y;
                            const _wt2 = _inl_29_result_z;
                            const _wt3 = _inl_29_result_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const _inl_25_flags = _u_U_uniforms_physics_flags;
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = (((_inl_25_flags & FLAG_VISCOSITY)) != 0);
                        break _inl_25;
                    }
                    if ((!_inl_25_result)) {
                        break __invocation;
                    }
                    const nu0 = ((_u_U_uniforms_viscosity_nu) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_nu));
                    const zeta0 = ((_u_U_uniforms_viscosity_bulk) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_bulk));
                    const shock0 = ((_u_U_uniforms_viscosity_shock) < (0.0) ? (0.0) : (_u_U_uniforms_viscosity_shock));
                    if ((((nu0 <= 0.0) && (zeta0 <= 0.0)) && (shock0 <= 0.0))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_26_result;
                    _inl_26: {
                        _inl_26_result = ((iy * n_total) + ix);
                        break _inl_26;
                    }
                    const c = _inl_26_result;
                    const _sroa_63_base = ((c) * 4 + 0);
                    const du_x = _b_dU_visc[_sroa_63_base + 0];
                    const du_y = _b_dU_visc[_sroa_63_base + 1];
                    const du_z = _b_dU_visc[_sroa_63_base + 2];
                    const du_w = _b_dU_visc[_sroa_63_base + 3];
                    const _sroa_64_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_64_base + 0];
                    const u0_y = _b_U0[_sroa_64_base + 1];
                    const u0_z = _b_U0[_sroa_64_base + 2];
                    const u0_w = _b_U0[_sroa_64_base + 3];
                    const _sroa_65_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_65_base + 0];
                    const u1_y = _b_U1[_sroa_65_base + 1];
                    const u1_z = _b_U1[_sroa_65_base + 2];
                    const u1_w = _b_U1[_sroa_65_base + 3];
                    const rho_old = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const vc_x = (u0_y / rho_old);
                    const vc_y = (u0_z / rho_old);
                    const vc_z = (u0_w / rho_old);
                    const _sroa_66 = {x:du_x, y:du_y, z:du_z};
                    const d_mom_raw_x = _sroa_66.x;
                    const d_mom_raw_y = _sroa_66.y;
                    const d_mom_raw_z = _sroa_66.z;
                    const dt_visc = ((_u_dt_buf_dt) < (1.0e-30) ? (1.0e-30) : (_u_dt_buf_dt));
                    const dmom_cap = (((FE_DMOM_CAP_FRAC * rho_old) * _u_U_uniforms_dx) / dt_visc);
                    const dmom_mag = Math.hypot(d_mom_raw_x, d_mom_raw_y, d_mom_raw_z);
                    const _sroa_67 = {x:((dmom_mag > dmom_cap) ? (d_mom_raw_x * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_x), y:((dmom_mag > dmom_cap) ? (d_mom_raw_y * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_y), z:((dmom_mag > dmom_cap) ? (d_mom_raw_z * ((dmom_cap / ((dmom_mag) < (1.0e-30) ? (1.0e-30) : (dmom_mag))))) : d_mom_raw_z)};
                    const d_mom_x = _sroa_67.x;
                    const d_mom_y = _sroa_67.y;
                    const d_mom_z = _sroa_67.z;
                    const dE_lim = ((du_w - ((vc_x * d_mom_raw_x) + (vc_y * d_mom_raw_y) + (vc_z * d_mom_raw_z))) + ((vc_x * d_mom_x) + (vc_y * d_mom_y) + (vc_z * d_mom_z)));
                    const _sroa_68 = {x:u0_x, y:(u0_y + d_mom_x), z:(u0_z + d_mom_y), w:(u0_w + d_mom_z)};
                    const u0_new_x = _sroa_68.x;
                    const u0_new_y = _sroa_68.y;
                    const u0_new_z = _sroa_68.z;
                    const u0_new_w = _sroa_68.w;
                    const E = (u1_x + dE_lim);
                    const rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                    let _inl_27_result;
                    _inl_27: {
                        let _inl_27__inl_6_result;
                        _inl_27__inl_6: {
                            _inl_27__inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_27__inl_6;
                        }
                        const _inl_27__inl_7_ix = (ix + 1);
                        let _inl_27__inl_7_result;
                        _inl_27__inl_7: {
                            _inl_27__inl_7_result = ((iy * ((n_total + 1))) + _inl_27__inl_7_ix);
                            break _inl_27__inl_7;
                        }
                        _inl_27_result = (0.5 * ((_b_Bx_face[_inl_27__inl_6_result] + _b_Bx_face[_inl_27__inl_7_result])));
                        break _inl_27;
                    }
                    const bx = _inl_27_result;
                    let _inl_28_result;
                    _inl_28: {
                        let _inl_28__inl_8_result;
                        _inl_28__inl_8: {
                            _inl_28__inl_8_result = ((iy * n_total) + ix);
                            break _inl_28__inl_8;
                        }
                        const _inl_28__inl_9_iy = (iy + 1);
                        let _inl_28__inl_9_result;
                        _inl_28__inl_9: {
                            _inl_28__inl_9_result = ((_inl_28__inl_9_iy * n_total) + ix);
                            break _inl_28__inl_9;
                        }
                        _inl_28_result = (0.5 * ((_b_By_face[_inl_28__inl_8_result] + _b_By_face[_inl_28__inl_9_result])));
                        break _inl_28;
                    }
                    const by = _inl_28_result;
                    const ke = ((0.5 * ((((u0_new_y * u0_new_y) + (u0_new_z * u0_new_z)) + (u0_new_w * u0_new_w)))) / rho);
                    const mb = (0.5 * ((((bx * bx) + (by * by)) + (u1_y * u1_y))));
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_new_x;
                        const _wt1 = u0_new_y;
                        const _wt2 = u0_new_z;
                        const _wt3 = u0_new_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_29_bz = u1_y;
                    const _inl_29_gamma = _u_U_uniforms_gamma;
                    const _inl_29_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_29_result_x, _inl_29_result_y, _inl_29_result_z, _inl_29_result_w;
                    _inl_29: {
                        const _inl_29_p_safe = ((p) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (p));
                        const _inl_29_eth = (_inl_29_p_safe / (((_inl_29_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_29_gamma - 1.0))));
                        let _inl_29__inl_4_result;
                        _inl_29__inl_4: {
                            _inl_29__inl_4_result = (((_inl_29_p_safe) < (_inl_29_p_floor) ? (_inl_29_p_floor) : (_inl_29_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_29_gamma));
                            break _inl_29__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_29_bz;
                        const _ir2 = _inl_29_eth;
                        const _ir3 = _inl_29__inl_4_result;
                        _inl_29_result_x = _ir0;
                        _inl_29_result_y = _ir1;
                        _inl_29_result_z = _ir2;
                        _inl_29_result_w = _ir3;
                        break _inl_29;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_29_result_x;
                        const _wt1 = _inl_29_result_y;
                        const _wt2 = _inl_29_result_z;
                        const _wt3 = _inl_29_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["apply_delta"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_apply_delta(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["compute_delta"] = function (workgroups, domain, origin) {
            return __entry_0_compute_delta(workgroups, bindings, domain, origin);
        };
        bound["apply_delta"] = function (workgroups, domain, origin) {
            return __entry_1_apply_delta(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","dU_visc","micro"], entryInfo };
}
