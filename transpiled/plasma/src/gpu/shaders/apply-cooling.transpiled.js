// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-cooling.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 1c96eecd5f360c12f590f2c352834923f802ac21be0363a3e549448033b569c7
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":49266,"lines":917,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.564Z
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
    const COOLING_CURVE_TABULATED = 3;
    const MICRO_COOL_START = 0;
    const MICRO_COOL_COUNT = 24;
    const INV_LN10 = 0.4342944819032518;

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

    function micro_segment(start, count, theta) {
        const log_theta = (Math.log(((theta) < (1.0e-30) ? (1.0e-30) : (theta))) * INV_LN10);
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
        const r_x = bindings.micro[_sroa_1_base + 0];
        const r_y = bindings.micro[_sroa_1_base + 1];
        const r_z = bindings.micro[_sroa_1_base + 2];
        const r_w = bindings.micro[_sroa_1_base + 3];
        return { theta_lo: Math.pow(10.0, r_x), lambda_lo: Math.pow(10.0, r_y), alpha: r_z };
    }

    function cooling_table_segment(theta) {
        let s_theta_lo = 0;
        let s_lambda_lo = 0;
        let s_alpha = 0;
        if ((theta <= 3.0e-4)) {
            s_theta_lo = 1.0e-4;
            s_lambda_lo = 0.02;
            s_alpha = 1.261860;
        } else if ((theta <= 1.0e-3)) {
            s_theta_lo = 3.0e-4;
            s_lambda_lo = 0.08;
            s_alpha = 1.336773;
        } else if ((theta <= 3.0e-3)) {
            s_theta_lo = 1.0e-3;
            s_lambda_lo = 0.40;
            s_alpha = 1.000000;
        } else if ((theta <= 1.0e-2)) {
            s_theta_lo = 3.0e-3;
            s_lambda_lo = 1.20;
            s_alpha = 0.642199;
        } else if ((theta <= 3.0e-2)) {
            s_theta_lo = 1.0e-2;
            s_lambda_lo = 2.60;
            s_alpha = 0.392116;
        } else if ((theta <= 1.0e-1)) {
            s_theta_lo = 3.0e-2;
            s_lambda_lo = 4.00;
            s_alpha = (-0.238944);
        } else if ((theta <= 3.0e-1)) {
            s_theta_lo = 1.0e-1;
            s_lambda_lo = 3.00;
            s_alpha = (-0.572184);
        } else if ((theta <= 1.0)) {
            s_theta_lo = 3.0e-1;
            s_lambda_lo = 1.60;
            s_alpha = (-0.390377);
        } else if ((theta <= 3.0)) {
            s_theta_lo = 1.0;
            s_lambda_lo = 1.00;
            s_alpha = (-0.261860);
        } else if ((theta <= 10.0)) {
            s_theta_lo = 3.0;
            s_lambda_lo = 0.75;
            s_alpha = 0.238944;
        } else if ((theta <= 30.0)) {
            s_theta_lo = 10.0;
            s_lambda_lo = 1.00;
            s_alpha = 0.535026;
        } else if ((theta <= 100.0)) {
            s_theta_lo = 30.0;
            s_lambda_lo = 1.80;
            s_alpha = 0.503446;
        } else {
            s_theta_lo = 100.0;
            s_lambda_lo = 3.30;
            s_alpha = 0.5;
        }
        return { theta_lo: s_theta_lo, lambda_lo: s_lambda_lo, alpha: s_alpha };
    }

    function cooling_cie_segment(theta) {
        let s_theta_lo = 0;
        let s_lambda_lo = 0;
        let s_alpha = 0;
        if ((theta <= 3.0e-4)) {
            s_theta_lo = 1.0e-4;
            s_lambda_lo = 0.005;
            s_alpha = 0.40;
        } else if ((theta <= 1.0e-3)) {
            s_theta_lo = 3.0e-4;
            s_lambda_lo = 0.008;
            s_alpha = 0.82;
        } else if ((theta <= 3.0e-3)) {
            s_theta_lo = 1.0e-3;
            s_lambda_lo = 0.020;
            s_alpha = 1.47;
        } else if ((theta <= 1.0e-2)) {
            s_theta_lo = 3.0e-3;
            s_lambda_lo = 0.10;
            s_alpha = 1.34;
        } else if ((theta <= 3.0e-2)) {
            s_theta_lo = 1.0e-2;
            s_lambda_lo = 0.50;
            s_alpha = 1.47;
        } else if ((theta <= 1.0e-1)) {
            s_theta_lo = 3.0e-2;
            s_lambda_lo = 2.50;
            s_alpha = 0.58;
        } else if ((theta <= 3.0e-1)) {
            s_theta_lo = 1.0e-1;
            s_lambda_lo = 5.00;
            s_alpha = (-0.63);
        } else if ((theta <= 1.0)) {
            s_theta_lo = 3.0e-1;
            s_lambda_lo = 2.50;
            s_alpha = (-0.47);
        } else if ((theta <= 3.0)) {
            s_theta_lo = 1.0;
            s_lambda_lo = 1.40;
            s_alpha = (-0.31);
        } else if ((theta <= 10.0)) {
            s_theta_lo = 3.0;
            s_lambda_lo = 1.00;
            s_alpha = 0.19;
        } else if ((theta <= 30.0)) {
            s_theta_lo = 10.0;
            s_lambda_lo = 1.25;
            s_alpha = 0.33;
        } else if ((theta <= 100.0)) {
            s_theta_lo = 30.0;
            s_lambda_lo = 1.80;
            s_alpha = 0.43;
        } else if ((theta <= 300.0)) {
            s_theta_lo = 100.0;
            s_lambda_lo = 3.00;
            s_alpha = 0.50;
        } else {
            s_theta_lo = 300.0;
            s_lambda_lo = 5.20;
            s_alpha = 0.50;
        }
        return { theta_lo: s_theta_lo, lambda_lo: s_lambda_lo, alpha: s_alpha };
    }

    function cooling_segment(theta) {
        if ((bindings.U_uniforms.cooling_curve_mode == COOLING_CURVE_TABULATED)) {
            return micro_segment(MICRO_COOL_START, MICRO_COOL_COUNT, theta);
        }
        if ((bindings.U_uniforms.cooling_curve_mode == 2)) {
            return cooling_cie_segment(theta);
        }
        return cooling_table_segment(theta);
    }

    function cooling_metal_scale(theta) {
        if (((bindings.U_uniforms.cooling_curve_mode != 2) && (bindings.U_uniforms.cooling_curve_mode != COOLING_CURVE_TABULATED))) {
            return 1.0;
        }
        const z = ((bindings.U_uniforms.cooling_metallicity) < (0.0) ? (0.0) : (bindings.U_uniforms.cooling_metallicity));
        const line_weight = (1.0 / ((1.0 + Math.pow((((theta / 30.0)) < (0.0) ? (0.0) : ((theta / 30.0))), 2.0))));
        const metal = (0.18 + (0.82 * z));
        return (1.0 + (metal - 1.0) * line_weight);
    }

    function theta_after_powerlaw(theta0, dt, rate, seg) {
        let _inl_6_result;
        _inl_6: {
            _inl_6_result = ((rate * seg.lambda_lo) / Math.pow(((seg.theta_lo) < (1.0e-12) ? (1.0e-12) : (seg.theta_lo)), seg.alpha));
            break _inl_6;
        }
        const A = _inl_6_result;
        if (((A <= 0.0) || (dt <= 0.0))) {
            return theta0;
        }
        const a = seg.alpha;
        if ((Math.abs((a - 1.0)) < 1.0e-4)) {
            return (theta0 * Math.exp(((-A) * dt)));
        }
        const p = (1.0 - a);
        const y = (Math.pow(theta0, p) - ((p * A) * dt));
        if (((y <= 0.0) && (p > 0.0))) {
            return 0.0;
        }
        return Math.pow(((y) < (1.0e-30) ? (1.0e-30) : (y)), (1.0 / p));
    }

    function time_to_theta(theta0, theta1, rate, seg) {
        if ((theta1 >= theta0)) {
            return 0.0;
        }
        let _inl_7_result;
        _inl_7: {
            _inl_7_result = ((rate * seg.lambda_lo) / Math.pow(((seg.theta_lo) < (1.0e-12) ? (1.0e-12) : (seg.theta_lo)), seg.alpha));
            break _inl_7;
        }
        const A = _inl_7_result;
        if ((A <= 0.0)) {
            return 1.0e30;
        }
        const a = seg.alpha;
        if ((Math.abs((a - 1.0)) < 1.0e-4)) {
            return (((Math.log((theta0 / ((theta1) < (1.0e-30) ? (1.0e-30) : (theta1)))) / A)) < (0.0) ? (0.0) : ((Math.log((theta0 / ((theta1) < (1.0e-30) ? (1.0e-30) : (theta1)))) / A)));
        }
        const p = (1.0 - a);
        return (((((Math.pow(theta0, p) - Math.pow(theta1, p))) / ((A * p)))) < (0.0) ? (0.0) : ((((Math.pow(theta0, p) - Math.pow(theta1, p))) / ((A * p)))));
    }

    function cool_table_theta(theta0, theta_floor, dt, rate) {
        let theta = ((theta0) < (theta_floor) ? (theta_floor) : (theta0));
        let rem = dt;
        for (let iter = 0; (iter < 24); iter = (iter + 1)) {
            if (((rem <= 0.0) || (theta <= theta_floor))) {
                break;
            }
            const _sroa_2 = cooling_segment(theta);
            const seg0_theta_lo = _sroa_2.theta_lo;
            const seg0_lambda_lo = _sroa_2.lambda_lo;
            const seg0_alpha = _sroa_2.alpha;
            const seg = { theta_lo: seg0_theta_lo, lambda_lo: (seg0_lambda_lo * cooling_metal_scale(theta)), alpha: seg0_alpha };
            let lower = seg.theta_lo;
            if ((theta_floor > lower)) {
                lower = theta_floor;
            }
            if ((seg.theta_lo <= 1.0e-4)) {
                lower = theta_floor;
            }
            const dt_lower = time_to_theta(theta, lower, rate, seg);
            if (((dt_lower <= 1.0e-12) || (dt_lower != dt_lower))) {
                theta = lower;
            } else if ((rem < dt_lower)) {
                const theta_trial = theta_after_powerlaw(theta, rem, rate, seg);
                theta = theta_trial;
                if ((theta < lower)) {
                    theta = lower;
                }
                rem = 0.0;
            } else {
                theta = lower;
                rem = (rem - dt_lower);
            }
        }
        return ((theta) < (theta_floor) ? (theta_floor) : (theta));
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_cooling_lambda0 = _b_U_uniforms.cooling_lambda0;
        const _u_U_uniforms_cooling_T_floor = _b_U_uniforms.cooling_T_floor;
        const _u_U_uniforms_cooling_T_ref = _b_U_uniforms.cooling_T_ref;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_cooling_curve_mode = _b_U_uniforms.cooling_curve_mode;
        const _u_U_uniforms_heating_gamma0 = _b_U_uniforms.heating_gamma0;
        const _u_U_uniforms_heating_density_exp = _b_U_uniforms.heating_density_exp;
        const _u_U_uniforms_heating_T_cut = _b_U_uniforms.heating_T_cut;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
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
                    const _inl_8_flags = _u_U_uniforms_physics_flags;
                    let _inl_8_result;
                    _inl_8: {
                        _inl_8_result = (((_inl_8_flags & FLAG_COOLING)) != 0);
                        break _inl_8;
                    }
                    const cooling_on = (_inl_8_result && (_u_U_uniforms_cooling_lambda0 > 0.0));
                    const _inl_9_flags = _u_U_uniforms_physics_flags;
                    let _inl_9_result;
                    _inl_9: {
                        _inl_9_result = (((_inl_9_flags & FLAG_HEATING)) != 0);
                        break _inl_9;
                    }
                    const heating_on = (_inl_9_result && (_u_U_uniforms_heating_gamma0 > 0.0));
                    if (((!cooling_on) && (!heating_on))) {
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
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((iy * n_total) + ix);
                        break _inl_10;
                    }
                    const c = _inl_10_result;
                    const _sroa_3_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_3_base + 0];
                    const u0_y = _b_U0[_sroa_3_base + 1];
                    const u0_z = _b_U0[_sroa_3_base + 2];
                    const u0_w = _b_U0[_sroa_3_base + 3];
                    const _sroa_4_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_4_base + 0];
                    const u1_y = _b_U1[_sroa_4_base + 1];
                    const u1_z = _b_U1[_sroa_4_base + 2];
                    const u1_w = _b_U1[_sroa_4_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const mx = u0_y;
                    const my = u0_z;
                    const mz = u0_w;
                    const E = u1_x;
                    const bz = u1_y;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = ((iy * ((n_total + 1))) + ix);
                        break _inl_11;
                    }
                    const _inl_12_ix = (ix + 1);
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * ((n_total + 1))) + _inl_12_ix);
                        break _inl_12;
                    }
                    const bx_c = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + ix);
                        break _inl_13;
                    }
                    const _inl_14_iy = (iy + 1);
                    let _inl_14_result;
                    _inl_14: {
                        _inl_14_result = ((_inl_14_iy * n_total) + ix);
                        break _inl_14;
                    }
                    const by_c = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const p = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx_c, by_c, _u_U_uniforms_gamma, p_floor);
                    const T = (p / rho);
                    const dT_excess = (T - _u_U_uniforms_cooling_T_floor);
                    const T_ref = ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref));
                    let T_new = T;
                    if ((cooling_on && (dT_excess > 0.0))) {
                        if ((_u_U_uniforms_cooling_curve_mode == 0)) {
                            const s0 = Math.sqrt((dT_excess / T_ref));
                            const C = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / ((2.0 * T_ref)));
                            const s1 = (((s0 - (C * _u_dt_buf_dt))) < (0.0) ? (0.0) : ((s0 - (C * _u_dt_buf_dt))));
                            T_new = (_u_U_uniforms_cooling_T_floor + ((T_ref * s1) * s1));
                        } else {
                            const theta0 = (((T / T_ref)) < (1.0e-8) ? (1.0e-8) : ((T / T_ref)));
                            const theta_floor = (((_u_U_uniforms_cooling_T_floor / T_ref)) < (1.0e-8) ? (1.0e-8) : ((_u_U_uniforms_cooling_T_floor / T_ref)));
                            const rate = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / T_ref);
                            T_new = (T_ref * cool_table_theta(theta0, theta_floor, _u_dt_buf_dt, rate));
                        }
                    }
                    const p_new = (((rho * T_new)) < (p_floor) ? (p_floor) : ((rho * T_new)));
                    let E_new = ((ke + mb) + (p_new / ((_u_U_uniforms_gamma - 1.0))));
                    if (heating_on) {
                        const rho_term = Math.pow(rho, ((_u_U_uniforms_heating_density_exp) < (0.0) ? (0.0) : (_u_U_uniforms_heating_density_exp)));
                        const cutoff = _u_U_uniforms_heating_T_cut;
                        const hot_suppression = ((cutoff > 0.0) ? (1.0 / ((1.0 + Math.pow((((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff)))) < (0.0) ? (0.0) : ((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff))))), 4.0)))) : 1.0);
                        E_new = (E_new + (((_u_U_uniforms_heating_gamma0 * rho_term) * hot_suppression) * _u_dt_buf_dt));
                    }
                    const p_final = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (p_floor) ? (p_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                    const _inl_15_gamma = _u_U_uniforms_gamma;
                    let _inl_15_result_x, _inl_15_result_y, _inl_15_result_z, _inl_15_result_w;
                    _inl_15: {
                        const _inl_15_p_safe = ((p_final) < (p_floor) ? (p_floor) : (p_final));
                        const _inl_15_eth = (_inl_15_p_safe / (((_inl_15_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_15_gamma - 1.0))));
                        let _inl_15__inl_4_result;
                        _inl_15__inl_4: {
                            _inl_15__inl_4_result = (((_inl_15_p_safe) < (p_floor) ? (p_floor) : (_inl_15_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_15_gamma));
                            break _inl_15__inl_4;
                        }
                        const _ir0 = E_new;
                        const _ir1 = bz;
                        const _ir2 = _inl_15_eth;
                        const _ir3 = _inl_15__inl_4_result;
                        _inl_15_result_x = _ir0;
                        _inl_15_result_y = _ir1;
                        _inl_15_result_z = _ir2;
                        _inl_15_result_w = _ir3;
                        break _inl_15;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_15_result_x;
                        const _wt1 = _inl_15_result_y;
                        const _wt2 = _inl_15_result_z;
                        const _wt3 = _inl_15_result_w;
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
                            const _inl_8_flags = _u_U_uniforms_physics_flags;
                            let _inl_8_result;
                            _inl_8: {
                                _inl_8_result = (((_inl_8_flags & FLAG_COOLING)) != 0);
                                break _inl_8;
                            }
                            const cooling_on = (_inl_8_result && (_u_U_uniforms_cooling_lambda0 > 0.0));
                            const _inl_9_flags = _u_U_uniforms_physics_flags;
                            let _inl_9_result;
                            _inl_9: {
                                _inl_9_result = (((_inl_9_flags & FLAG_HEATING)) != 0);
                                break _inl_9;
                            }
                            const heating_on = (_inl_9_result && (_u_U_uniforms_heating_gamma0 > 0.0));
                            if (((!cooling_on) && (!heating_on))) {
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
                            let _inl_10_result;
                            _inl_10: {
                                _inl_10_result = ((iy * n_total) + ix);
                                break _inl_10;
                            }
                            const c = _inl_10_result;
                            const _sroa_5_base = ((c) * 4 + 0);
                            const u0_x = _b_U0[_sroa_5_base + 0];
                            const u0_y = _b_U0[_sroa_5_base + 1];
                            const u0_z = _b_U0[_sroa_5_base + 2];
                            const u0_w = _b_U0[_sroa_5_base + 3];
                            const _sroa_6_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_6_base + 0];
                            const u1_y = _b_U1[_sroa_6_base + 1];
                            const u1_z = _b_U1[_sroa_6_base + 2];
                            const u1_w = _b_U1[_sroa_6_base + 3];
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const mx = u0_y;
                            const my = u0_z;
                            const mz = u0_w;
                            const E = u1_x;
                            const bz = u1_y;
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_11;
                            }
                            const _inl_12_ix = (ix + 1);
                            let _inl_12_result;
                            _inl_12: {
                                _inl_12_result = ((iy * ((n_total + 1))) + _inl_12_ix);
                                break _inl_12;
                            }
                            const bx_c = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                            let _inl_13_result;
                            _inl_13: {
                                _inl_13_result = ((iy * n_total) + ix);
                                break _inl_13;
                            }
                            const _inl_14_iy = (iy + 1);
                            let _inl_14_result;
                            _inl_14: {
                                _inl_14_result = ((_inl_14_iy * n_total) + ix);
                                break _inl_14;
                            }
                            const by_c = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                            const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                            const p_floor = _u_U_uniforms_pressure_floor;
                            const p = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx_c, by_c, _u_U_uniforms_gamma, p_floor);
                            const T = (p / rho);
                            const dT_excess = (T - _u_U_uniforms_cooling_T_floor);
                            const T_ref = ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref));
                            let T_new = T;
                            if ((cooling_on && (dT_excess > 0.0))) {
                                if ((_u_U_uniforms_cooling_curve_mode == 0)) {
                                    const s0 = Math.sqrt((dT_excess / T_ref));
                                    const C = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / ((2.0 * T_ref)));
                                    const s1 = (((s0 - (C * _u_dt_buf_dt))) < (0.0) ? (0.0) : ((s0 - (C * _u_dt_buf_dt))));
                                    T_new = (_u_U_uniforms_cooling_T_floor + ((T_ref * s1) * s1));
                                } else {
                                    const theta0 = (((T / T_ref)) < (1.0e-8) ? (1.0e-8) : ((T / T_ref)));
                                    const theta_floor = (((_u_U_uniforms_cooling_T_floor / T_ref)) < (1.0e-8) ? (1.0e-8) : ((_u_U_uniforms_cooling_T_floor / T_ref)));
                                    const rate = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / T_ref);
                                    T_new = (T_ref * cool_table_theta(theta0, theta_floor, _u_dt_buf_dt, rate));
                                }
                            }
                            const p_new = (((rho * T_new)) < (p_floor) ? (p_floor) : ((rho * T_new)));
                            let E_new = ((ke + mb) + (p_new / ((_u_U_uniforms_gamma - 1.0))));
                            if (heating_on) {
                                const rho_term = Math.pow(rho, ((_u_U_uniforms_heating_density_exp) < (0.0) ? (0.0) : (_u_U_uniforms_heating_density_exp)));
                                const cutoff = _u_U_uniforms_heating_T_cut;
                                const hot_suppression = ((cutoff > 0.0) ? (1.0 / ((1.0 + Math.pow((((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff)))) < (0.0) ? (0.0) : ((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff))))), 4.0)))) : 1.0);
                                E_new = (E_new + (((_u_U_uniforms_heating_gamma0 * rho_term) * hot_suppression) * _u_dt_buf_dt));
                            }
                            const p_final = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (p_floor) ? (p_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                            const _inl_15_gamma = _u_U_uniforms_gamma;
                            let _inl_15_result_x, _inl_15_result_y, _inl_15_result_z, _inl_15_result_w;
                            _inl_15: {
                                const _inl_15_p_safe = ((p_final) < (p_floor) ? (p_floor) : (p_final));
                                const _inl_15_eth = (_inl_15_p_safe / (((_inl_15_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_15_gamma - 1.0))));
                                let _inl_15__inl_4_result;
                                _inl_15__inl_4: {
                                    _inl_15__inl_4_result = (((_inl_15_p_safe) < (p_floor) ? (p_floor) : (_inl_15_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_15_gamma));
                                    break _inl_15__inl_4;
                                }
                                const _ir0 = E_new;
                                const _ir1 = bz;
                                const _ir2 = _inl_15_eth;
                                const _ir3 = _inl_15__inl_4_result;
                                _inl_15_result_x = _ir0;
                                _inl_15_result_y = _ir1;
                                _inl_15_result_z = _ir2;
                                _inl_15_result_w = _ir3;
                                break _inl_15;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_15_result_x;
                                const _wt1 = _inl_15_result_y;
                                const _wt2 = _inl_15_result_z;
                                const _wt3 = _inl_15_result_w;
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
                        const _inl_8_flags = _u_U_uniforms_physics_flags;
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = (((_inl_8_flags & FLAG_COOLING)) != 0);
                            break _inl_8;
                        }
                        const cooling_on = (_inl_8_result && (_u_U_uniforms_cooling_lambda0 > 0.0));
                        const _inl_9_flags = _u_U_uniforms_physics_flags;
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = (((_inl_9_flags & FLAG_HEATING)) != 0);
                            break _inl_9;
                        }
                        const heating_on = (_inl_9_result && (_u_U_uniforms_heating_gamma0 > 0.0));
                        if (((!cooling_on) && (!heating_on))) {
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
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((iy * n_total) + ix);
                            break _inl_10;
                        }
                        const c = _inl_10_result;
                        const _sroa_7_base = ((c) * 4 + 0);
                        const u0_x = _b_U0[_sroa_7_base + 0];
                        const u0_y = _b_U0[_sroa_7_base + 1];
                        const u0_z = _b_U0[_sroa_7_base + 2];
                        const u0_w = _b_U0[_sroa_7_base + 3];
                        const _sroa_8_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_8_base + 0];
                        const u1_y = _b_U1[_sroa_8_base + 1];
                        const u1_z = _b_U1[_sroa_8_base + 2];
                        const u1_w = _b_U1[_sroa_8_base + 3];
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const mx = u0_y;
                        const my = u0_z;
                        const mz = u0_w;
                        const E = u1_x;
                        const bz = u1_y;
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_11;
                        }
                        const _inl_12_ix = (ix + 1);
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * ((n_total + 1))) + _inl_12_ix);
                            break _inl_12;
                        }
                        const bx_c = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + ix);
                            break _inl_13;
                        }
                        const _inl_14_iy = (iy + 1);
                        let _inl_14_result;
                        _inl_14: {
                            _inl_14_result = ((_inl_14_iy * n_total) + ix);
                            break _inl_14;
                        }
                        const by_c = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                        const p_floor = _u_U_uniforms_pressure_floor;
                        const p = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx_c, by_c, _u_U_uniforms_gamma, p_floor);
                        const T = (p / rho);
                        const dT_excess = (T - _u_U_uniforms_cooling_T_floor);
                        const T_ref = ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref));
                        let T_new = T;
                        if ((cooling_on && (dT_excess > 0.0))) {
                            if ((_u_U_uniforms_cooling_curve_mode == 0)) {
                                const s0 = Math.sqrt((dT_excess / T_ref));
                                const C = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / ((2.0 * T_ref)));
                                const s1 = (((s0 - (C * _u_dt_buf_dt))) < (0.0) ? (0.0) : ((s0 - (C * _u_dt_buf_dt))));
                                T_new = (_u_U_uniforms_cooling_T_floor + ((T_ref * s1) * s1));
                            } else {
                                const theta0 = (((T / T_ref)) < (1.0e-8) ? (1.0e-8) : ((T / T_ref)));
                                const theta_floor = (((_u_U_uniforms_cooling_T_floor / T_ref)) < (1.0e-8) ? (1.0e-8) : ((_u_U_uniforms_cooling_T_floor / T_ref)));
                                const rate = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / T_ref);
                                T_new = (T_ref * cool_table_theta(theta0, theta_floor, _u_dt_buf_dt, rate));
                            }
                        }
                        const p_new = (((rho * T_new)) < (p_floor) ? (p_floor) : ((rho * T_new)));
                        let E_new = ((ke + mb) + (p_new / ((_u_U_uniforms_gamma - 1.0))));
                        if (heating_on) {
                            const rho_term = Math.pow(rho, ((_u_U_uniforms_heating_density_exp) < (0.0) ? (0.0) : (_u_U_uniforms_heating_density_exp)));
                            const cutoff = _u_U_uniforms_heating_T_cut;
                            const hot_suppression = ((cutoff > 0.0) ? (1.0 / ((1.0 + Math.pow((((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff)))) < (0.0) ? (0.0) : ((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff))))), 4.0)))) : 1.0);
                            E_new = (E_new + (((_u_U_uniforms_heating_gamma0 * rho_term) * hot_suppression) * _u_dt_buf_dt));
                        }
                        const p_final = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (p_floor) ? (p_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                        const _inl_15_gamma = _u_U_uniforms_gamma;
                        let _inl_15_result_x, _inl_15_result_y, _inl_15_result_z, _inl_15_result_w;
                        _inl_15: {
                            const _inl_15_p_safe = ((p_final) < (p_floor) ? (p_floor) : (p_final));
                            const _inl_15_eth = (_inl_15_p_safe / (((_inl_15_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_15_gamma - 1.0))));
                            let _inl_15__inl_4_result;
                            _inl_15__inl_4: {
                                _inl_15__inl_4_result = (((_inl_15_p_safe) < (p_floor) ? (p_floor) : (_inl_15_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_15_gamma));
                                break _inl_15__inl_4;
                            }
                            const _ir0 = E_new;
                            const _ir1 = bz;
                            const _ir2 = _inl_15_eth;
                            const _ir3 = _inl_15__inl_4_result;
                            _inl_15_result_x = _ir0;
                            _inl_15_result_y = _ir1;
                            _inl_15_result_z = _ir2;
                            _inl_15_result_w = _ir3;
                            break _inl_15;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_15_result_x;
                            const _wt1 = _inl_15_result_y;
                            const _wt2 = _inl_15_result_z;
                            const _wt3 = _inl_15_result_w;
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
                    const _inl_8_flags = _u_U_uniforms_physics_flags;
                    let _inl_8_result;
                    _inl_8: {
                        _inl_8_result = (((_inl_8_flags & FLAG_COOLING)) != 0);
                        break _inl_8;
                    }
                    const cooling_on = (_inl_8_result && (_u_U_uniforms_cooling_lambda0 > 0.0));
                    const _inl_9_flags = _u_U_uniforms_physics_flags;
                    let _inl_9_result;
                    _inl_9: {
                        _inl_9_result = (((_inl_9_flags & FLAG_HEATING)) != 0);
                        break _inl_9;
                    }
                    const heating_on = (_inl_9_result && (_u_U_uniforms_heating_gamma0 > 0.0));
                    if (((!cooling_on) && (!heating_on))) {
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
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((iy * n_total) + ix);
                        break _inl_10;
                    }
                    const c = _inl_10_result;
                    const _sroa_9_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_9_base + 0];
                    const u0_y = _b_U0[_sroa_9_base + 1];
                    const u0_z = _b_U0[_sroa_9_base + 2];
                    const u0_w = _b_U0[_sroa_9_base + 3];
                    const _sroa_10_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_10_base + 0];
                    const u1_y = _b_U1[_sroa_10_base + 1];
                    const u1_z = _b_U1[_sroa_10_base + 2];
                    const u1_w = _b_U1[_sroa_10_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const mx = u0_y;
                    const my = u0_z;
                    const mz = u0_w;
                    const E = u1_x;
                    const bz = u1_y;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = ((iy * ((n_total + 1))) + ix);
                        break _inl_11;
                    }
                    const _inl_12_ix = (ix + 1);
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * ((n_total + 1))) + _inl_12_ix);
                        break _inl_12;
                    }
                    const bx_c = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + ix);
                        break _inl_13;
                    }
                    const _inl_14_iy = (iy + 1);
                    let _inl_14_result;
                    _inl_14: {
                        _inl_14_result = ((_inl_14_iy * n_total) + ix);
                        break _inl_14;
                    }
                    const by_c = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const p = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx_c, by_c, _u_U_uniforms_gamma, p_floor);
                    const T = (p / rho);
                    const dT_excess = (T - _u_U_uniforms_cooling_T_floor);
                    const T_ref = ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref));
                    let T_new = T;
                    if ((cooling_on && (dT_excess > 0.0))) {
                        if ((_u_U_uniforms_cooling_curve_mode == 0)) {
                            const s0 = Math.sqrt((dT_excess / T_ref));
                            const C = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / ((2.0 * T_ref)));
                            const s1 = (((s0 - (C * _u_dt_buf_dt))) < (0.0) ? (0.0) : ((s0 - (C * _u_dt_buf_dt))));
                            T_new = (_u_U_uniforms_cooling_T_floor + ((T_ref * s1) * s1));
                        } else {
                            const theta0 = (((T / T_ref)) < (1.0e-8) ? (1.0e-8) : ((T / T_ref)));
                            const theta_floor = (((_u_U_uniforms_cooling_T_floor / T_ref)) < (1.0e-8) ? (1.0e-8) : ((_u_U_uniforms_cooling_T_floor / T_ref)));
                            const rate = (((((_u_U_uniforms_gamma - 1.0)) * rho) * _u_U_uniforms_cooling_lambda0) / T_ref);
                            T_new = (T_ref * cool_table_theta(theta0, theta_floor, _u_dt_buf_dt, rate));
                        }
                    }
                    const p_new = (((rho * T_new)) < (p_floor) ? (p_floor) : ((rho * T_new)));
                    let E_new = ((ke + mb) + (p_new / ((_u_U_uniforms_gamma - 1.0))));
                    if (heating_on) {
                        const rho_term = Math.pow(rho, ((_u_U_uniforms_heating_density_exp) < (0.0) ? (0.0) : (_u_U_uniforms_heating_density_exp)));
                        const cutoff = _u_U_uniforms_heating_T_cut;
                        const hot_suppression = ((cutoff > 0.0) ? (1.0 / ((1.0 + Math.pow((((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff)))) < (0.0) ? (0.0) : ((T / ((cutoff) < (1.0e-30) ? (1.0e-30) : (cutoff))))), 4.0)))) : 1.0);
                        E_new = (E_new + (((_u_U_uniforms_heating_gamma0 * rho_term) * hot_suppression) * _u_dt_buf_dt));
                    }
                    const p_final = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (p_floor) ? (p_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                    const _inl_15_gamma = _u_U_uniforms_gamma;
                    let _inl_15_result_x, _inl_15_result_y, _inl_15_result_z, _inl_15_result_w;
                    _inl_15: {
                        const _inl_15_p_safe = ((p_final) < (p_floor) ? (p_floor) : (p_final));
                        const _inl_15_eth = (_inl_15_p_safe / (((_inl_15_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_15_gamma - 1.0))));
                        let _inl_15__inl_4_result;
                        _inl_15__inl_4: {
                            _inl_15__inl_4_result = (((_inl_15_p_safe) < (p_floor) ? (p_floor) : (_inl_15_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_15_gamma));
                            break _inl_15__inl_4;
                        }
                        const _ir0 = E_new;
                        const _ir1 = bz;
                        const _ir2 = _inl_15_eth;
                        const _ir3 = _inl_15__inl_4_result;
                        _inl_15_result_x = _ir0;
                        _inl_15_result_y = _ir1;
                        _inl_15_result_z = _ir2;
                        _inl_15_result_w = _ir3;
                        break _inl_15;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_15_result_x;
                        const _wt1 = _inl_15_result_y;
                        const _wt2 = _inl_15_result_z;
                        const _wt3 = _inl_15_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
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

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","micro"], entryInfo };
}
