// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-conduction.wgsl
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: abb7107e52d638218fe6c21b1cdf70a0bb3044aee977e065161b86c48acc0902
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":59156,"lines":1095,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":2,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-27T17:41:05.142Z
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
    const MICRO_TRANSPORT_START = 72;
    const MICRO_TRANSPORT_COUNT = 24;
    const INV_LN10_COND = 0.4342944819032518;
    const TRANSPORT_SCALE_MAX_COND = 1.0e5;

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
        const dual_eth = ((U1_z) < (eth_floor) ? (eth_floor) : (U1_z));
        const eth = (total_ok ? eth_total : dual_eth);
        return (((((gamma - 1.0)) * eth)) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * eth)));
    }

    function micro_log_interp_cond(start, count, theta) {
        const log_theta = (Math.log(((theta) < (1.0e-30) ? (1.0e-30) : (theta))) * INV_LN10_COND);
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

    function cell_T(ix, iy, n_total, p_floor, gamma) {
        let _inl_6_result;
        _inl_6: {
            _inl_6_result = ((iy * n_total) + ix);
            break _inl_6;
        }
        const c = _inl_6_result;
        const _sroa_2_base = ((c) * 4 + 0);
        const u0_x = bindings.U0[_sroa_2_base + 0];
        const u0_y = bindings.U0[_sroa_2_base + 1];
        const u0_z = bindings.U0[_sroa_2_base + 2];
        const u0_w = bindings.U0[_sroa_2_base + 3];
        const _sroa_3_base = ((c) * 4 + 0);
        const u1_x = bindings.U1[_sroa_3_base + 0];
        const u1_y = bindings.U1[_sroa_3_base + 1];
        const u1_z = bindings.U1[_sroa_3_base + 2];
        const u1_w = bindings.U1[_sroa_3_base + 3];
        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
        let _inl_7_result;
        _inl_7: {
            _inl_7_result = ((iy * ((n_total + 1))) + ix);
            break _inl_7;
        }
        const _inl_8_ix = (ix + 1);
        let _inl_8_result;
        _inl_8: {
            _inl_8_result = ((iy * ((n_total + 1))) + _inl_8_ix);
            break _inl_8;
        }
        const bx_c = (0.5 * ((bindings.Bx_face[_inl_7_result] + bindings.Bx_face[_inl_8_result])));
        let _inl_9_result;
        _inl_9: {
            _inl_9_result = ((iy * n_total) + ix);
            break _inl_9;
        }
        const _inl_10_iy = (iy + 1);
        let _inl_10_result;
        _inl_10: {
            _inl_10_result = ((_inl_10_iy * n_total) + ix);
            break _inl_10;
        }
        const by_c = (0.5 * ((bindings.By_face[_inl_9_result] + bindings.By_face[_inl_10_result])));
        const p = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx_c, by_c, gamma, p_floor);
        return (p / rho);
    }

    function heat_flux_sat_factor(qx, qy, rho_face, T_face, gamma) {
        const phi_sat = bindings.U_uniforms.conduction_sat_frac;
        if ((phi_sat <= 0.0)) {
            return 1.0;
        }
        const cs = Math.sqrt((((gamma * T_face)) < (0.0) ? (0.0) : ((gamma * T_face))));
        const q_sat = ((((((phi_sat * ((rho_face) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho_face))) * cs) * cs) * cs)) < (1.0e-30) ? (1.0e-30) : (((((phi_sat * ((rho_face) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho_face))) * cs) * cs) * cs)));
        const q_mag = Math.sqrt(((((qx * qx) + (qy * qy))) < (0.0) ? (0.0) : (((qx * qx) + (qy * qy)))));
        return (1.0 / Math.sqrt((1.0 + (((q_mag / q_sat)) * ((q_mag / q_sat))))));
    }

    function q_x_face(ix, iy, n_total, p_floor, gamma) {
        const T_c = cell_T(ix, iy, n_total, p_floor, gamma);
        const theta_c = (T_c / ((bindings.U_uniforms.cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.cooling_T_ref)));
        let _inl_15_result;
        _inl_15: {
            _inl_15_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_cond(MICRO_TRANSPORT_START, MICRO_TRANSPORT_COUNT, theta_c)), 0.0, TRANSPORT_SCALE_MAX_COND));
            break _inl_15;
        }
        const kappa = (bindings.U_uniforms.conduction_kappa * _inl_15_result);
        if ((kappa <= 0.0)) {
            return 0.0;
        }
        const f_iso = bindings.U_uniforms.conduction_iso_frac;
        const dx = bindings.U_uniforms.dx;
        const T_l = cell_T((ix - 1), iy, n_total, p_floor, gamma);
        const T_r = cell_T(ix, iy, n_total, p_floor, gamma);
        const dTdx = (((T_r - T_l)) / dx);
        const T_dl = cell_T((ix - 1), (iy - 1), n_total, p_floor, gamma);
        const T_ul = cell_T((ix - 1), (iy + 1), n_total, p_floor, gamma);
        const T_dr = cell_T(ix, (iy - 1), n_total, p_floor, gamma);
        const T_ur = cell_T(ix, (iy + 1), n_total, p_floor, gamma);
        const dTdy_l = (((T_ul - T_dl)) / ((2.0 * dx)));
        const dTdy_r = (((T_ur - T_dr)) / ((2.0 * dx)));
        const dTdy = (0.5 * ((dTdy_l + dTdy_r)));
        let _inl_16_result;
        _inl_16: {
            _inl_16_result = ((iy * ((n_total + 1))) + ix);
            break _inl_16;
        }
        const bx_face = bindings.Bx_face[_inl_16_result];
        const _inl_17_ix = (ix - 1);
        let _inl_17_result;
        _inl_17: {
            let _inl_17__inl_13_result;
            _inl_17__inl_13: {
                _inl_17__inl_13_result = ((iy * n_total) + _inl_17_ix);
                break _inl_17__inl_13;
            }
            const _inl_17__inl_14_iy = (iy + 1);
            let _inl_17__inl_14_result;
            _inl_17__inl_14: {
                _inl_17__inl_14_result = ((_inl_17__inl_14_iy * n_total) + _inl_17_ix);
                break _inl_17__inl_14;
            }
            _inl_17_result = (0.5 * ((bindings.By_face[_inl_17__inl_13_result] + bindings.By_face[_inl_17__inl_14_result])));
            break _inl_17;
        }
        const by_l = _inl_17_result;
        let _inl_18_result;
        _inl_18: {
            let _inl_18__inl_13_result;
            _inl_18__inl_13: {
                _inl_18__inl_13_result = ((iy * n_total) + ix);
                break _inl_18__inl_13;
            }
            const _inl_18__inl_14_iy = (iy + 1);
            let _inl_18__inl_14_result;
            _inl_18__inl_14: {
                _inl_18__inl_14_result = ((_inl_18__inl_14_iy * n_total) + ix);
                break _inl_18__inl_14;
            }
            _inl_18_result = (0.5 * ((bindings.By_face[_inl_18__inl_13_result] + bindings.By_face[_inl_18__inl_14_result])));
            break _inl_18;
        }
        const by_r = _inl_18_result;
        const by_face = (0.5 * ((by_l + by_r)));
        const b_mag = (Math.sqrt(((bx_face * bx_face) + (by_face * by_face))) + 1.0e-30);
        const bxh = (bx_face / b_mag);
        const byh = (by_face / b_mag);
        const b_dot_gT = ((bxh * dTdx) + (byh * dTdy));
        const qx_raw = ((-kappa) * ((((((1.0 - f_iso)) * bxh) * b_dot_gT) + (f_iso * dTdx))));
        const qy_raw = ((-kappa) * ((((((1.0 - f_iso)) * byh) * b_dot_gT) + (f_iso * dTdy))));
        const _inl_19_ix = (ix - 1);
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = ((iy * n_total) + _inl_19_ix);
            break _inl_19;
        }
        const rho_l = ((bindings.U0[((_inl_19_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_19_result) * 4 + 0) + 0]));
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = ((iy * n_total) + ix);
            break _inl_20;
        }
        const rho_r = ((bindings.U0[((_inl_20_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_20_result) * 4 + 0) + 0]));
        const rho_face = (0.5 * ((rho_l + rho_r)));
        const T_face = (((0.5 * ((T_l + T_r)))) < (0.0) ? (0.0) : ((0.5 * ((T_l + T_r)))));
        return (qx_raw * heat_flux_sat_factor(qx_raw, qy_raw, rho_face, T_face, gamma));
    }

    function q_y_face(ix, iy, n_total, p_floor, gamma) {
        const T_c = cell_T(ix, iy, n_total, p_floor, gamma);
        const theta_c = (T_c / ((bindings.U_uniforms.cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.cooling_T_ref)));
        let _inl_21_result;
        _inl_21: {
            _inl_21_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_cond(MICRO_TRANSPORT_START, MICRO_TRANSPORT_COUNT, theta_c)), 0.0, TRANSPORT_SCALE_MAX_COND));
            break _inl_21;
        }
        const kappa = (bindings.U_uniforms.conduction_kappa * _inl_21_result);
        if ((kappa <= 0.0)) {
            return 0.0;
        }
        const f_iso = bindings.U_uniforms.conduction_iso_frac;
        const dx = bindings.U_uniforms.dx;
        const T_d = cell_T(ix, (iy - 1), n_total, p_floor, gamma);
        const T_u = cell_T(ix, iy, n_total, p_floor, gamma);
        const dTdy = (((T_u - T_d)) / dx);
        const T_ld = cell_T((ix - 1), (iy - 1), n_total, p_floor, gamma);
        const T_rd = cell_T((ix + 1), (iy - 1), n_total, p_floor, gamma);
        const T_lu = cell_T((ix - 1), iy, n_total, p_floor, gamma);
        const T_ru = cell_T((ix + 1), iy, n_total, p_floor, gamma);
        const dTdx_d = (((T_rd - T_ld)) / ((2.0 * dx)));
        const dTdx_u = (((T_ru - T_lu)) / ((2.0 * dx)));
        const dTdx = (0.5 * ((dTdx_d + dTdx_u)));
        let _inl_22_result;
        _inl_22: {
            _inl_22_result = ((iy * n_total) + ix);
            break _inl_22;
        }
        const by_face = bindings.By_face[_inl_22_result];
        const _inl_23_iy = (iy - 1);
        let _inl_23_result;
        _inl_23: {
            let _inl_23__inl_11_result;
            _inl_23__inl_11: {
                _inl_23__inl_11_result = ((_inl_23_iy * ((n_total + 1))) + ix);
                break _inl_23__inl_11;
            }
            const _inl_23__inl_12_ix = (ix + 1);
            let _inl_23__inl_12_result;
            _inl_23__inl_12: {
                _inl_23__inl_12_result = ((_inl_23_iy * ((n_total + 1))) + _inl_23__inl_12_ix);
                break _inl_23__inl_12;
            }
            _inl_23_result = (0.5 * ((bindings.Bx_face[_inl_23__inl_11_result] + bindings.Bx_face[_inl_23__inl_12_result])));
            break _inl_23;
        }
        const bx_d = _inl_23_result;
        let _inl_24_result;
        _inl_24: {
            let _inl_24__inl_11_result;
            _inl_24__inl_11: {
                _inl_24__inl_11_result = ((iy * ((n_total + 1))) + ix);
                break _inl_24__inl_11;
            }
            const _inl_24__inl_12_ix = (ix + 1);
            let _inl_24__inl_12_result;
            _inl_24__inl_12: {
                _inl_24__inl_12_result = ((iy * ((n_total + 1))) + _inl_24__inl_12_ix);
                break _inl_24__inl_12;
            }
            _inl_24_result = (0.5 * ((bindings.Bx_face[_inl_24__inl_11_result] + bindings.Bx_face[_inl_24__inl_12_result])));
            break _inl_24;
        }
        const bx_u = _inl_24_result;
        const bx_face = (0.5 * ((bx_d + bx_u)));
        const b_mag = (Math.sqrt(((bx_face * bx_face) + (by_face * by_face))) + 1.0e-30);
        const bxh = (bx_face / b_mag);
        const byh = (by_face / b_mag);
        const b_dot_gT = ((bxh * dTdx) + (byh * dTdy));
        const qx_raw = ((-kappa) * ((((((1.0 - f_iso)) * bxh) * b_dot_gT) + (f_iso * dTdx))));
        const qy_raw = ((-kappa) * ((((((1.0 - f_iso)) * byh) * b_dot_gT) + (f_iso * dTdy))));
        const _inl_25_iy = (iy - 1);
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((_inl_25_iy * n_total) + ix);
            break _inl_25;
        }
        const rho_d = ((bindings.U0[((_inl_25_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_25_result) * 4 + 0) + 0]));
        let _inl_26_result;
        _inl_26: {
            _inl_26_result = ((iy * n_total) + ix);
            break _inl_26;
        }
        const rho_u = ((bindings.U0[((_inl_26_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_26_result) * 4 + 0) + 0]));
        const rho_face = (0.5 * ((rho_d + rho_u)));
        const T_face = (((0.5 * ((T_d + T_u)))) < (0.0) ? (0.0) : ((0.5 * ((T_d + T_u)))));
        return (qy_raw * heat_flux_sat_factor(qx_raw, qy_raw, rho_face, T_face, gamma));
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
        const _u_U_uniforms_conduction_kappa = _b_U_uniforms.conduction_kappa;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_geometry_mode = _b_U_uniforms.geometry_mode;
        const _u_U_uniforms_geometry_r_min = _b_U_uniforms.geometry_r_min;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_dE_cond = bindings.dE_cond;
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
                    const _inl_27_flags = _u_U_uniforms_physics_flags;
                    let _inl_27_result;
                    _inl_27: {
                        _inl_27_result = (((_inl_27_flags & FLAG_CONDUCTION)) != 0);
                        break _inl_27;
                    }
                    if ((!_inl_27_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                    let _inl_28_result;
                    _inl_28: {
                        _inl_28_result = ((iy * n_total) + ix);
                        break _inl_28;
                    }
                    const c = _inl_28_result;
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const gamma = _u_U_uniforms_gamma;
                    const dx = _u_U_uniforms_dx;
                    const dt = _u_dt_buf_dt;
                    const qxL = q_x_face(ix, iy, n_total, p_floor, gamma);
                    const qxR = q_x_face((ix + 1), iy, n_total, p_floor, gamma);
                    const qyD = q_y_face(ix, iy, n_total, p_floor, gamma);
                    const qyU = q_y_face(ix, (iy + 1), n_total, p_floor, gamma);
                    let divq = (((((qxR - qxL) + qyU) - qyD)) / dx);
                    const _inl_29_flags = _u_U_uniforms_physics_flags;
                    let _inl_29_result;
                    _inl_29: {
                        _inl_29_result = (((_inl_29_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_29;
                    }
                    const geom_cyl = (_inl_29_result && (_u_U_uniforms_geometry_mode == 1));
                    if (geom_cyl) {
                        const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                        const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                        const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                        divq = (((((r_r * qxR) - (r_l * qxL))) / ((r_c * dx))) + (((qyU - qyD)) / dx));
                    }
                    const dE = ((-divq) * dt);
                    _b_dE_cond[c] = dE;
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const _inl_27_flags = _u_U_uniforms_physics_flags;
                            let _inl_27_result;
                            _inl_27: {
                                _inl_27_result = (((_inl_27_flags & FLAG_CONDUCTION)) != 0);
                                break _inl_27;
                            }
                            if ((!_inl_27_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                            let _inl_28_result;
                            _inl_28: {
                                _inl_28_result = ((iy * n_total) + ix);
                                break _inl_28;
                            }
                            const c = _inl_28_result;
                            const p_floor = _u_U_uniforms_pressure_floor;
                            const gamma = _u_U_uniforms_gamma;
                            const dx = _u_U_uniforms_dx;
                            const dt = _u_dt_buf_dt;
                            const qxL = q_x_face(ix, iy, n_total, p_floor, gamma);
                            const qxR = q_x_face((ix + 1), iy, n_total, p_floor, gamma);
                            const qyD = q_y_face(ix, iy, n_total, p_floor, gamma);
                            const qyU = q_y_face(ix, (iy + 1), n_total, p_floor, gamma);
                            let divq = (((((qxR - qxL) + qyU) - qyD)) / dx);
                            const _inl_29_flags = _u_U_uniforms_physics_flags;
                            let _inl_29_result;
                            _inl_29: {
                                _inl_29_result = (((_inl_29_flags & FLAG_GEOMETRY)) != 0);
                                break _inl_29;
                            }
                            const geom_cyl = (_inl_29_result && (_u_U_uniforms_geometry_mode == 1));
                            if (geom_cyl) {
                                const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                                const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                                const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                                divq = (((((r_r * qxR) - (r_l * qxL))) / ((r_c * dx))) + (((qyU - qyD)) / dx));
                            }
                            const dE = ((-divq) * dt);
                            _b_dE_cond[c] = dE;
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const _inl_27_flags = _u_U_uniforms_physics_flags;
                        let _inl_27_result;
                        _inl_27: {
                            _inl_27_result = (((_inl_27_flags & FLAG_CONDUCTION)) != 0);
                            break _inl_27;
                        }
                        if ((!_inl_27_result)) {
                            break __invocation;
                        }
                        if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                        let _inl_28_result;
                        _inl_28: {
                            _inl_28_result = ((iy * n_total) + ix);
                            break _inl_28;
                        }
                        const c = _inl_28_result;
                        const p_floor = _u_U_uniforms_pressure_floor;
                        const gamma = _u_U_uniforms_gamma;
                        const dx = _u_U_uniforms_dx;
                        const dt = _u_dt_buf_dt;
                        const qxL = q_x_face(ix, iy, n_total, p_floor, gamma);
                        const qxR = q_x_face((ix + 1), iy, n_total, p_floor, gamma);
                        const qyD = q_y_face(ix, iy, n_total, p_floor, gamma);
                        const qyU = q_y_face(ix, (iy + 1), n_total, p_floor, gamma);
                        let divq = (((((qxR - qxL) + qyU) - qyD)) / dx);
                        const _inl_29_flags = _u_U_uniforms_physics_flags;
                        let _inl_29_result;
                        _inl_29: {
                            _inl_29_result = (((_inl_29_flags & FLAG_GEOMETRY)) != 0);
                            break _inl_29;
                        }
                        const geom_cyl = (_inl_29_result && (_u_U_uniforms_geometry_mode == 1));
                        if (geom_cyl) {
                            const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                            const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                            const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                            divq = (((((r_r * qxR) - (r_l * qxL))) / ((r_c * dx))) + (((qyU - qyD)) / dx));
                        }
                        const dE = ((-divq) * dt);
                        _b_dE_cond[c] = dE;
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
                    const _inl_27_flags = _u_U_uniforms_physics_flags;
                    let _inl_27_result;
                    _inl_27: {
                        _inl_27_result = (((_inl_27_flags & FLAG_CONDUCTION)) != 0);
                        break _inl_27;
                    }
                    if ((!_inl_27_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                    let _inl_28_result;
                    _inl_28: {
                        _inl_28_result = ((iy * n_total) + ix);
                        break _inl_28;
                    }
                    const c = _inl_28_result;
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const gamma = _u_U_uniforms_gamma;
                    const dx = _u_U_uniforms_dx;
                    const dt = _u_dt_buf_dt;
                    const qxL = q_x_face(ix, iy, n_total, p_floor, gamma);
                    const qxR = q_x_face((ix + 1), iy, n_total, p_floor, gamma);
                    const qyD = q_y_face(ix, iy, n_total, p_floor, gamma);
                    const qyU = q_y_face(ix, (iy + 1), n_total, p_floor, gamma);
                    let divq = (((((qxR - qxL) + qyU) - qyD)) / dx);
                    const _inl_29_flags = _u_U_uniforms_physics_flags;
                    let _inl_29_result;
                    _inl_29: {
                        _inl_29_result = (((_inl_29_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_29;
                    }
                    const geom_cyl = (_inl_29_result && (_u_U_uniforms_geometry_mode == 1));
                    if (geom_cyl) {
                        const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                        const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                        const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                        divq = (((((r_r * qxR) - (r_l * qxL))) / ((r_c * dx))) + (((qyU - qyD)) / dx));
                    }
                    const dE = ((-divq) * dt);
                    _b_dE_cond[c] = dE;
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
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_conduction_kappa = _b_U_uniforms.conduction_kappa;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dE_cond = bindings.dE_cond;
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
                    const _inl_30_flags = _u_U_uniforms_physics_flags;
                    let _inl_30_result;
                    _inl_30: {
                        _inl_30_result = (((_inl_30_flags & FLAG_CONDUCTION)) != 0);
                        break _inl_30;
                    }
                    if ((!_inl_30_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                    let _inl_31_result;
                    _inl_31: {
                        _inl_31_result = ((iy * n_total) + ix);
                        break _inl_31;
                    }
                    const c = _inl_31_result;
                    const _sroa_4_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_4_base + 0];
                    const u0_y = _b_U0[_sroa_4_base + 1];
                    const u0_z = _b_U0[_sroa_4_base + 2];
                    const u0_w = _b_U0[_sroa_4_base + 3];
                    const _sroa_5_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_5_base + 0];
                    const u1_y = _b_U1[_sroa_5_base + 1];
                    const u1_z = _b_U1[_sroa_5_base + 2];
                    const u1_w = _b_U1[_sroa_5_base + 3];
                    const E = (u1_x + _b_dE_cond[c]);
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    let _inl_32_result;
                    _inl_32: {
                        let _inl_32__inl_11_result;
                        _inl_32__inl_11: {
                            _inl_32__inl_11_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_32__inl_11;
                        }
                        const _inl_32__inl_12_ix = (ix + 1);
                        let _inl_32__inl_12_result;
                        _inl_32__inl_12: {
                            _inl_32__inl_12_result = ((iy * ((n_total + 1))) + _inl_32__inl_12_ix);
                            break _inl_32__inl_12;
                        }
                        _inl_32_result = (0.5 * ((_b_Bx_face[_inl_32__inl_11_result] + _b_Bx_face[_inl_32__inl_12_result])));
                        break _inl_32;
                    }
                    const bx_c = _inl_32_result;
                    let _inl_33_result;
                    _inl_33: {
                        let _inl_33__inl_13_result;
                        _inl_33__inl_13: {
                            _inl_33__inl_13_result = ((iy * n_total) + ix);
                            break _inl_33__inl_13;
                        }
                        const _inl_33__inl_14_iy = (iy + 1);
                        let _inl_33__inl_14_result;
                        _inl_33__inl_14: {
                            _inl_33__inl_14_result = ((_inl_33__inl_14_iy * n_total) + ix);
                            break _inl_33__inl_14;
                        }
                        _inl_33_result = (0.5 * ((_b_By_face[_inl_33__inl_13_result] + _b_By_face[_inl_33__inl_14_result])));
                        break _inl_33;
                    }
                    const by_c = _inl_33_result;
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (u1_y * u1_y))));
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    const _inl_34_bz = u1_y;
                    const _inl_34_gamma = _u_U_uniforms_gamma;
                    const _inl_34_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_34_result_x, _inl_34_result_y, _inl_34_result_z, _inl_34_result_w;
                    _inl_34: {
                        const _inl_34_p_safe = ((p) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (p));
                        const _inl_34_eth = (_inl_34_p_safe / (((_inl_34_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_34_gamma - 1.0))));
                        let _inl_34__inl_4_result;
                        _inl_34__inl_4: {
                            _inl_34__inl_4_result = (((_inl_34_p_safe) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (_inl_34_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_34_gamma));
                            break _inl_34__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_34_bz;
                        const _ir2 = _inl_34_eth;
                        const _ir3 = _inl_34__inl_4_result;
                        _inl_34_result_x = _ir0;
                        _inl_34_result_y = _ir1;
                        _inl_34_result_z = _ir2;
                        _inl_34_result_w = _ir3;
                        break _inl_34;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_34_result_x;
                        const _wt1 = _inl_34_result_y;
                        const _wt2 = _inl_34_result_z;
                        const _wt3 = _inl_34_result_w;
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
                            const _inl_30_flags = _u_U_uniforms_physics_flags;
                            let _inl_30_result;
                            _inl_30: {
                                _inl_30_result = (((_inl_30_flags & FLAG_CONDUCTION)) != 0);
                                break _inl_30;
                            }
                            if ((!_inl_30_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                            let _inl_31_result;
                            _inl_31: {
                                _inl_31_result = ((iy * n_total) + ix);
                                break _inl_31;
                            }
                            const c = _inl_31_result;
                            const _sroa_6_base = ((c) * 4 + 0);
                            const u0_x = _b_U0[_sroa_6_base + 0];
                            const u0_y = _b_U0[_sroa_6_base + 1];
                            const u0_z = _b_U0[_sroa_6_base + 2];
                            const u0_w = _b_U0[_sroa_6_base + 3];
                            const _sroa_7_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_7_base + 0];
                            const u1_y = _b_U1[_sroa_7_base + 1];
                            const u1_z = _b_U1[_sroa_7_base + 2];
                            const u1_w = _b_U1[_sroa_7_base + 3];
                            const E = (u1_x + _b_dE_cond[c]);
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            let _inl_32_result;
                            _inl_32: {
                                let _inl_32__inl_11_result;
                                _inl_32__inl_11: {
                                    _inl_32__inl_11_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_32__inl_11;
                                }
                                const _inl_32__inl_12_ix = (ix + 1);
                                let _inl_32__inl_12_result;
                                _inl_32__inl_12: {
                                    _inl_32__inl_12_result = ((iy * ((n_total + 1))) + _inl_32__inl_12_ix);
                                    break _inl_32__inl_12;
                                }
                                _inl_32_result = (0.5 * ((_b_Bx_face[_inl_32__inl_11_result] + _b_Bx_face[_inl_32__inl_12_result])));
                                break _inl_32;
                            }
                            const bx_c = _inl_32_result;
                            let _inl_33_result;
                            _inl_33: {
                                let _inl_33__inl_13_result;
                                _inl_33__inl_13: {
                                    _inl_33__inl_13_result = ((iy * n_total) + ix);
                                    break _inl_33__inl_13;
                                }
                                const _inl_33__inl_14_iy = (iy + 1);
                                let _inl_33__inl_14_result;
                                _inl_33__inl_14: {
                                    _inl_33__inl_14_result = ((_inl_33__inl_14_iy * n_total) + ix);
                                    break _inl_33__inl_14;
                                }
                                _inl_33_result = (0.5 * ((_b_By_face[_inl_33__inl_13_result] + _b_By_face[_inl_33__inl_14_result])));
                                break _inl_33;
                            }
                            const by_c = _inl_33_result;
                            const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                            const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (u1_y * u1_y))));
                            const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                            const _inl_34_bz = u1_y;
                            const _inl_34_gamma = _u_U_uniforms_gamma;
                            const _inl_34_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_34_result_x, _inl_34_result_y, _inl_34_result_z, _inl_34_result_w;
                            _inl_34: {
                                const _inl_34_p_safe = ((p) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (p));
                                const _inl_34_eth = (_inl_34_p_safe / (((_inl_34_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_34_gamma - 1.0))));
                                let _inl_34__inl_4_result;
                                _inl_34__inl_4: {
                                    _inl_34__inl_4_result = (((_inl_34_p_safe) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (_inl_34_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_34_gamma));
                                    break _inl_34__inl_4;
                                }
                                const _ir0 = E;
                                const _ir1 = _inl_34_bz;
                                const _ir2 = _inl_34_eth;
                                const _ir3 = _inl_34__inl_4_result;
                                _inl_34_result_x = _ir0;
                                _inl_34_result_y = _ir1;
                                _inl_34_result_z = _ir2;
                                _inl_34_result_w = _ir3;
                                break _inl_34;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_34_result_x;
                                const _wt1 = _inl_34_result_y;
                                const _wt2 = _inl_34_result_z;
                                const _wt3 = _inl_34_result_w;
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
                        const _inl_30_flags = _u_U_uniforms_physics_flags;
                        let _inl_30_result;
                        _inl_30: {
                            _inl_30_result = (((_inl_30_flags & FLAG_CONDUCTION)) != 0);
                            break _inl_30;
                        }
                        if ((!_inl_30_result)) {
                            break __invocation;
                        }
                        if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                        let _inl_31_result;
                        _inl_31: {
                            _inl_31_result = ((iy * n_total) + ix);
                            break _inl_31;
                        }
                        const c = _inl_31_result;
                        const _sroa_8_base = ((c) * 4 + 0);
                        const u0_x = _b_U0[_sroa_8_base + 0];
                        const u0_y = _b_U0[_sroa_8_base + 1];
                        const u0_z = _b_U0[_sroa_8_base + 2];
                        const u0_w = _b_U0[_sroa_8_base + 3];
                        const _sroa_9_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_9_base + 0];
                        const u1_y = _b_U1[_sroa_9_base + 1];
                        const u1_z = _b_U1[_sroa_9_base + 2];
                        const u1_w = _b_U1[_sroa_9_base + 3];
                        const E = (u1_x + _b_dE_cond[c]);
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        let _inl_32_result;
                        _inl_32: {
                            let _inl_32__inl_11_result;
                            _inl_32__inl_11: {
                                _inl_32__inl_11_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_32__inl_11;
                            }
                            const _inl_32__inl_12_ix = (ix + 1);
                            let _inl_32__inl_12_result;
                            _inl_32__inl_12: {
                                _inl_32__inl_12_result = ((iy * ((n_total + 1))) + _inl_32__inl_12_ix);
                                break _inl_32__inl_12;
                            }
                            _inl_32_result = (0.5 * ((_b_Bx_face[_inl_32__inl_11_result] + _b_Bx_face[_inl_32__inl_12_result])));
                            break _inl_32;
                        }
                        const bx_c = _inl_32_result;
                        let _inl_33_result;
                        _inl_33: {
                            let _inl_33__inl_13_result;
                            _inl_33__inl_13: {
                                _inl_33__inl_13_result = ((iy * n_total) + ix);
                                break _inl_33__inl_13;
                            }
                            const _inl_33__inl_14_iy = (iy + 1);
                            let _inl_33__inl_14_result;
                            _inl_33__inl_14: {
                                _inl_33__inl_14_result = ((_inl_33__inl_14_iy * n_total) + ix);
                                break _inl_33__inl_14;
                            }
                            _inl_33_result = (0.5 * ((_b_By_face[_inl_33__inl_13_result] + _b_By_face[_inl_33__inl_14_result])));
                            break _inl_33;
                        }
                        const by_c = _inl_33_result;
                        const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (u1_y * u1_y))));
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                        const _inl_34_bz = u1_y;
                        const _inl_34_gamma = _u_U_uniforms_gamma;
                        const _inl_34_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_34_result_x, _inl_34_result_y, _inl_34_result_z, _inl_34_result_w;
                        _inl_34: {
                            const _inl_34_p_safe = ((p) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (p));
                            const _inl_34_eth = (_inl_34_p_safe / (((_inl_34_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_34_gamma - 1.0))));
                            let _inl_34__inl_4_result;
                            _inl_34__inl_4: {
                                _inl_34__inl_4_result = (((_inl_34_p_safe) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (_inl_34_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_34_gamma));
                                break _inl_34__inl_4;
                            }
                            const _ir0 = E;
                            const _ir1 = _inl_34_bz;
                            const _ir2 = _inl_34_eth;
                            const _ir3 = _inl_34__inl_4_result;
                            _inl_34_result_x = _ir0;
                            _inl_34_result_y = _ir1;
                            _inl_34_result_z = _ir2;
                            _inl_34_result_w = _ir3;
                            break _inl_34;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_34_result_x;
                            const _wt1 = _inl_34_result_y;
                            const _wt2 = _inl_34_result_z;
                            const _wt3 = _inl_34_result_w;
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
                    const _inl_30_flags = _u_U_uniforms_physics_flags;
                    let _inl_30_result;
                    _inl_30: {
                        _inl_30_result = (((_inl_30_flags & FLAG_CONDUCTION)) != 0);
                        break _inl_30;
                    }
                    if ((!_inl_30_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_conduction_kappa <= 0.0)) {
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
                    let _inl_31_result;
                    _inl_31: {
                        _inl_31_result = ((iy * n_total) + ix);
                        break _inl_31;
                    }
                    const c = _inl_31_result;
                    const _sroa_10_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_10_base + 0];
                    const u0_y = _b_U0[_sroa_10_base + 1];
                    const u0_z = _b_U0[_sroa_10_base + 2];
                    const u0_w = _b_U0[_sroa_10_base + 3];
                    const _sroa_11_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_11_base + 0];
                    const u1_y = _b_U1[_sroa_11_base + 1];
                    const u1_z = _b_U1[_sroa_11_base + 2];
                    const u1_w = _b_U1[_sroa_11_base + 3];
                    const E = (u1_x + _b_dE_cond[c]);
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    let _inl_32_result;
                    _inl_32: {
                        let _inl_32__inl_11_result;
                        _inl_32__inl_11: {
                            _inl_32__inl_11_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_32__inl_11;
                        }
                        const _inl_32__inl_12_ix = (ix + 1);
                        let _inl_32__inl_12_result;
                        _inl_32__inl_12: {
                            _inl_32__inl_12_result = ((iy * ((n_total + 1))) + _inl_32__inl_12_ix);
                            break _inl_32__inl_12;
                        }
                        _inl_32_result = (0.5 * ((_b_Bx_face[_inl_32__inl_11_result] + _b_Bx_face[_inl_32__inl_12_result])));
                        break _inl_32;
                    }
                    const bx_c = _inl_32_result;
                    let _inl_33_result;
                    _inl_33: {
                        let _inl_33__inl_13_result;
                        _inl_33__inl_13: {
                            _inl_33__inl_13_result = ((iy * n_total) + ix);
                            break _inl_33__inl_13;
                        }
                        const _inl_33__inl_14_iy = (iy + 1);
                        let _inl_33__inl_14_result;
                        _inl_33__inl_14: {
                            _inl_33__inl_14_result = ((_inl_33__inl_14_iy * n_total) + ix);
                            break _inl_33__inl_14;
                        }
                        _inl_33_result = (0.5 * ((_b_By_face[_inl_33__inl_13_result] + _b_By_face[_inl_33__inl_14_result])));
                        break _inl_33;
                    }
                    const by_c = _inl_33_result;
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (u1_y * u1_y))));
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    const _inl_34_bz = u1_y;
                    const _inl_34_gamma = _u_U_uniforms_gamma;
                    const _inl_34_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_34_result_x, _inl_34_result_y, _inl_34_result_z, _inl_34_result_w;
                    _inl_34: {
                        const _inl_34_p_safe = ((p) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (p));
                        const _inl_34_eth = (_inl_34_p_safe / (((_inl_34_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_34_gamma - 1.0))));
                        let _inl_34__inl_4_result;
                        _inl_34__inl_4: {
                            _inl_34__inl_4_result = (((_inl_34_p_safe) < (_inl_34_p_floor) ? (_inl_34_p_floor) : (_inl_34_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_34_gamma));
                            break _inl_34__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_34_bz;
                        const _ir2 = _inl_34_eth;
                        const _ir3 = _inl_34__inl_4_result;
                        _inl_34_result_x = _ir0;
                        _inl_34_result_y = _ir1;
                        _inl_34_result_z = _ir2;
                        _inl_34_result_w = _ir3;
                        break _inl_34;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_34_result_x;
                        const _wt1 = _inl_34_result_y;
                        const _wt2 = _inl_34_result_z;
                        const _wt3 = _inl_34_result_w;
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

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","dE_cond","micro"], entryInfo };
}
