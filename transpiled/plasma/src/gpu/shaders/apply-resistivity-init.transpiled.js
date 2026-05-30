// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-resistivity-init.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 432413f1ef33bbdc431826fa2b95878c7ef6193678e0f2387da8786abcb887ac
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":35202,"lines":650,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.697Z
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

    function anomalous_eta(j_mag, eta0, alpha, jcrit) {
        if ((alpha <= 0.0)) {
            return eta0;
        }
        const jcrit_safe = ((jcrit) < (1.0e-12) ? (1.0e-12) : (jcrit));
        const r = (j_mag / jcrit_safe);
        const excess = ((0.0) < ((r - 1.0)) ? ((r - 1.0)) : (0.0));
        return (eta0 + ((alpha * excess) * excess));
    }

    function ez_res_init_corner(cx, cy, n_total, dx_inv) {
        let _inl_10_result;
        _inl_10: {
            let _inl_10__inl_6_result;
            _inl_10__inl_6: {
                _inl_10__inl_6_result = ((cy * n_total) + cx);
                break _inl_10__inl_6;
            }
            const _inl_10_by_R = bindings.By_init[_inl_10__inl_6_result];
            const _inl_10__inl_7_ix = (cx - 1);
            let _inl_10__inl_7_result;
            _inl_10__inl_7: {
                _inl_10__inl_7_result = ((cy * n_total) + _inl_10__inl_7_ix);
                break _inl_10__inl_7;
            }
            const _inl_10_by_L = bindings.By_init[_inl_10__inl_7_result];
            let _inl_10__inl_8_result;
            _inl_10__inl_8: {
                _inl_10__inl_8_result = ((cy * ((n_total + 1))) + cx);
                break _inl_10__inl_8;
            }
            const _inl_10_bx_U = bindings.Bx_init[_inl_10__inl_8_result];
            const _inl_10__inl_9_iy = (cy - 1);
            let _inl_10__inl_9_result;
            _inl_10__inl_9: {
                _inl_10__inl_9_result = ((_inl_10__inl_9_iy * ((n_total + 1))) + cx);
                break _inl_10__inl_9;
            }
            const _inl_10_bx_D = bindings.Bx_init[_inl_10__inl_9_result];
            _inl_10_result = (((((_inl_10_by_R - _inl_10_by_L)) - ((_inl_10_bx_U - _inl_10_bx_D)))) * dx_inv);
            break _inl_10;
        }
        const jz = _inl_10_result;
        const alpha = bindings.U_uniforms.eta_anom_alpha;
        let eta_c = bindings.U_uniforms.eta;
        if ((alpha > 0.0)) {
            eta_c = anomalous_eta(Math.abs(jz), bindings.U_uniforms.eta, alpha, bindings.U_uniforms.eta_anom_jcrit);
        }
        return (eta_c * jz);
    }

    function eta_cell_init(ix, iy, n_total, dx_inv) {
        const alpha = bindings.U_uniforms.eta_anom_alpha;
        if ((alpha <= 0.0)) {
            return bindings.U_uniforms.eta;
        }
        let _inl_19_result;
        _inl_19: {
            const _inl_19__inl_11_ix = (ix + 1);
            let _inl_19__inl_11_result;
            _inl_19__inl_11: {
                _inl_19__inl_11_result = ((iy * n_total) + _inl_19__inl_11_ix);
                break _inl_19__inl_11;
            }
            const _inl_19__inl_12_ix = (ix + 1);
            const _inl_19__inl_12_iy = (iy + 1);
            let _inl_19__inl_12_result;
            _inl_19__inl_12: {
                _inl_19__inl_12_result = ((_inl_19__inl_12_iy * n_total) + _inl_19__inl_12_ix);
                break _inl_19__inl_12;
            }
            const _inl_19_by_R = (0.5 * ((bindings.By_init[_inl_19__inl_11_result] + bindings.By_init[_inl_19__inl_12_result])));
            const _inl_19__inl_13_ix = (ix - 1);
            let _inl_19__inl_13_result;
            _inl_19__inl_13: {
                _inl_19__inl_13_result = ((iy * n_total) + _inl_19__inl_13_ix);
                break _inl_19__inl_13;
            }
            const _inl_19__inl_14_ix = (ix - 1);
            const _inl_19__inl_14_iy = (iy + 1);
            let _inl_19__inl_14_result;
            _inl_19__inl_14: {
                _inl_19__inl_14_result = ((_inl_19__inl_14_iy * n_total) + _inl_19__inl_14_ix);
                break _inl_19__inl_14;
            }
            const _inl_19_by_L = (0.5 * ((bindings.By_init[_inl_19__inl_13_result] + bindings.By_init[_inl_19__inl_14_result])));
            const _inl_19__inl_15_iy = (iy + 1);
            let _inl_19__inl_15_result;
            _inl_19__inl_15: {
                _inl_19__inl_15_result = ((_inl_19__inl_15_iy * ((n_total + 1))) + ix);
                break _inl_19__inl_15;
            }
            const _inl_19__inl_16_ix = (ix + 1);
            const _inl_19__inl_16_iy = (iy + 1);
            let _inl_19__inl_16_result;
            _inl_19__inl_16: {
                _inl_19__inl_16_result = ((_inl_19__inl_16_iy * ((n_total + 1))) + _inl_19__inl_16_ix);
                break _inl_19__inl_16;
            }
            const _inl_19_bx_U = (0.5 * ((bindings.Bx_init[_inl_19__inl_15_result] + bindings.Bx_init[_inl_19__inl_16_result])));
            const _inl_19__inl_17_iy = (iy - 1);
            let _inl_19__inl_17_result;
            _inl_19__inl_17: {
                _inl_19__inl_17_result = ((_inl_19__inl_17_iy * ((n_total + 1))) + ix);
                break _inl_19__inl_17;
            }
            const _inl_19__inl_18_ix = (ix + 1);
            const _inl_19__inl_18_iy = (iy - 1);
            let _inl_19__inl_18_result;
            _inl_19__inl_18: {
                _inl_19__inl_18_result = ((_inl_19__inl_18_iy * ((n_total + 1))) + _inl_19__inl_18_ix);
                break _inl_19__inl_18;
            }
            const _inl_19_bx_D = (0.5 * ((bindings.Bx_init[_inl_19__inl_17_result] + bindings.Bx_init[_inl_19__inl_18_result])));
            const _inl_19_dby_dx = ((((_inl_19_by_R - _inl_19_by_L)) * 0.5) * dx_inv);
            const _inl_19_dbx_dy = ((((_inl_19_bx_U - _inl_19_bx_D)) * 0.5) * dx_inv);
            _inl_19_result = Math.abs((_inl_19_dby_dx - _inl_19_dbx_dy));
            break _inl_19;
        }
        const jmag = _inl_19_result;
        return anomalous_eta(jmag, bindings.U_uniforms.eta, alpha, bindings.U_uniforms.eta_anom_jcrit);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_sts_meta = bindings.sts_meta;
        const _u_sts_meta_substep_idx = _b_sts_meta.substep_idx;
        const _u_sts_meta_s_total = _b_sts_meta.s_total;
        const _b_sts_coeffs = bindings.sts_coeffs;
        const _b_Bx_init = bindings.Bx_init;
        const _b_By_init = bindings.By_init;
        const _b_U1_init = bindings.U1_init;
        const _b_Bx_pprev = bindings.Bx_pprev;
        const _b_By_pprev = bindings.By_pprev;
        const _b_U1_pprev = bindings.U1_pprev;
        const _b_Bx_tmp = bindings.Bx_tmp;
        const _b_By_tmp = bindings.By_tmp;
        const _b_U1_tmp = bindings.U1_tmp;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt_hyp = _b_dt_buf.dt_hyp;
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
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const dx_inv = (1.0 / _u_U_uniforms_dx);
                    const dx2_inv = (dx_inv * dx_inv);
                    const dt_super = _u_dt_buf_dt_hyp;
                    if ((_u_sts_meta_s_total == 0)) {
                        break __invocation;
                    }
                    const j_idx = _u_sts_meta_substep_idx;
                    const base = (((j_idx - 1)) * 4);
                    const mu_j = _b_sts_coeffs[base];
                    const nu_j = _b_sts_coeffs[(base + 1)];
                    const gam_tilde_j = _b_sts_coeffs[(base + 3)];
                    const one_minus = ((1.0 - mu_j) - nu_j);
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    const in_cell_interior = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                    const in_bx_face = ((((ix >= ghost) && (ix <= (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                    const in_by_face = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy <= (ghost + n_interior)));
                    if ((!(((in_cell_interior || in_bx_face) || in_by_face)))) {
                        break __invocation;
                    }
                    if (in_cell_interior) {
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = ((iy * n_total) + ix);
                            break _inl_20;
                        }
                        const c = _inl_20_result;
                        const _inl_21_ix = (ix - 1);
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = ((iy * n_total) + _inl_21_ix);
                            break _inl_21;
                        }
                        const xl = _inl_21_result;
                        const _inl_22_ix = (ix + 1);
                        let _inl_22_result;
                        _inl_22: {
                            _inl_22_result = ((iy * n_total) + _inl_22_ix);
                            break _inl_22;
                        }
                        const xr = _inl_22_result;
                        const _inl_23_iy = (iy - 1);
                        let _inl_23_result;
                        _inl_23: {
                            _inl_23_result = ((_inl_23_iy * n_total) + ix);
                            break _inl_23;
                        }
                        const yd = _inl_23_result;
                        const _inl_24_iy = (iy + 1);
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = ((_inl_24_iy * n_total) + ix);
                            break _inl_24;
                        }
                        const yu = _inl_24_result;
                        const eta_c = eta_cell_init(ix, iy, n_total, dx_inv);
                        const bz_0 = _b_U1_init[((c) * 4 + 0) + 1];
                        const lap_0 = ((((_b_U1_init[((xr) * 4 + 0) + 1] + _b_U1_init[((xl) * 4 + 0) + 1]) + _b_U1_init[((yu) * 4 + 0) + 1]) + _b_U1_init[((yd) * 4 + 0) + 1]) - (4.0 * bz_0));
                        const L_0 = ((eta_c * dx2_inv) * lap_0);
                        const pprev_bz = _b_U1_pprev[((c) * 4 + 0) + 1];
                        const bz_new = (((one_minus * bz_0) + (nu_j * pprev_bz)) + ((dt_super * gam_tilde_j) * L_0));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_init[((c) * 4 + 0) + 0];
                            const _wt1 = bz_new;
                            const _wt2 = _b_U1_init[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_init[((c) * 4 + 0) + 3];
                            _b_U1_tmp[_wbase + 0] = _wt0;
                            _b_U1_tmp[_wbase + 1] = _wt1;
                            _b_U1_tmp[_wbase + 2] = _wt2;
                            _b_U1_tmp[_wbase + 3] = _wt3;
                        }
                    }
                    if (in_bx_face) {
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_25;
                        }
                        const c = _inl_25_result;
                        const ez_bot = ez_res_init_corner(ix, iy, n_total, dx_inv);
                        const ez_top = ez_res_init_corner(ix, (iy + 1), n_total, dx_inv);
                        const L_0 = ((-((ez_top - ez_bot))) * dx_inv);
                        const v_0 = _b_Bx_init[c];
                        const pprev = _b_Bx_pprev[c];
                        _b_Bx_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
                    }
                    if (in_by_face) {
                        let _inl_26_result;
                        _inl_26: {
                            _inl_26_result = ((iy * n_total) + ix);
                            break _inl_26;
                        }
                        const c = _inl_26_result;
                        const ez_lft = ez_res_init_corner(ix, iy, n_total, dx_inv);
                        const ez_rgt = ez_res_init_corner((ix + 1), iy, n_total, dx_inv);
                        const L_0 = (((ez_rgt - ez_lft)) * dx_inv);
                        const v_0 = _b_By_init[c];
                        const pprev = _b_By_pprev[c];
                        _b_By_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
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
                            const n_total = _u_U_uniforms_grid_n_total;
                            const n_interior = _u_U_uniforms_grid_n;
                            const ghost = _u_U_uniforms_ghost_w;
                            const dx_inv = (1.0 / _u_U_uniforms_dx);
                            const dx2_inv = (dx_inv * dx_inv);
                            const dt_super = _u_dt_buf_dt_hyp;
                            if ((_u_sts_meta_s_total == 0)) {
                                break __invocation;
                            }
                            const j_idx = _u_sts_meta_substep_idx;
                            const base = (((j_idx - 1)) * 4);
                            const mu_j = _b_sts_coeffs[base];
                            const nu_j = _b_sts_coeffs[(base + 1)];
                            const gam_tilde_j = _b_sts_coeffs[(base + 3)];
                            const one_minus = ((1.0 - mu_j) - nu_j);
                            const ix = ((gid_x + ghost) - 1);
                            const iy = ((gid_y + ghost) - 1);
                            const in_cell_interior = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                            const in_bx_face = ((((ix >= ghost) && (ix <= (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                            const in_by_face = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy <= (ghost + n_interior)));
                            if ((!(((in_cell_interior || in_bx_face) || in_by_face)))) {
                                break __invocation;
                            }
                            if (in_cell_interior) {
                                let _inl_20_result;
                                _inl_20: {
                                    _inl_20_result = ((iy * n_total) + ix);
                                    break _inl_20;
                                }
                                const c = _inl_20_result;
                                const _inl_21_ix = (ix - 1);
                                let _inl_21_result;
                                _inl_21: {
                                    _inl_21_result = ((iy * n_total) + _inl_21_ix);
                                    break _inl_21;
                                }
                                const xl = _inl_21_result;
                                const _inl_22_ix = (ix + 1);
                                let _inl_22_result;
                                _inl_22: {
                                    _inl_22_result = ((iy * n_total) + _inl_22_ix);
                                    break _inl_22;
                                }
                                const xr = _inl_22_result;
                                const _inl_23_iy = (iy - 1);
                                let _inl_23_result;
                                _inl_23: {
                                    _inl_23_result = ((_inl_23_iy * n_total) + ix);
                                    break _inl_23;
                                }
                                const yd = _inl_23_result;
                                const _inl_24_iy = (iy + 1);
                                let _inl_24_result;
                                _inl_24: {
                                    _inl_24_result = ((_inl_24_iy * n_total) + ix);
                                    break _inl_24;
                                }
                                const yu = _inl_24_result;
                                const eta_c = eta_cell_init(ix, iy, n_total, dx_inv);
                                const bz_0 = _b_U1_init[((c) * 4 + 0) + 1];
                                const lap_0 = ((((_b_U1_init[((xr) * 4 + 0) + 1] + _b_U1_init[((xl) * 4 + 0) + 1]) + _b_U1_init[((yu) * 4 + 0) + 1]) + _b_U1_init[((yd) * 4 + 0) + 1]) - (4.0 * bz_0));
                                const L_0 = ((eta_c * dx2_inv) * lap_0);
                                const pprev_bz = _b_U1_pprev[((c) * 4 + 0) + 1];
                                const bz_new = (((one_minus * bz_0) + (nu_j * pprev_bz)) + ((dt_super * gam_tilde_j) * L_0));
                                {
                                    const _wbase = ((c) * 4 + 0);
                                    const _wt0 = _b_U1_init[((c) * 4 + 0) + 0];
                                    const _wt1 = bz_new;
                                    const _wt2 = _b_U1_init[((c) * 4 + 0) + 2];
                                    const _wt3 = _b_U1_init[((c) * 4 + 0) + 3];
                                    _b_U1_tmp[_wbase + 0] = _wt0;
                                    _b_U1_tmp[_wbase + 1] = _wt1;
                                    _b_U1_tmp[_wbase + 2] = _wt2;
                                    _b_U1_tmp[_wbase + 3] = _wt3;
                                }
                            }
                            if (in_bx_face) {
                                let _inl_25_result;
                                _inl_25: {
                                    _inl_25_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_25;
                                }
                                const c = _inl_25_result;
                                const ez_bot = ez_res_init_corner(ix, iy, n_total, dx_inv);
                                const ez_top = ez_res_init_corner(ix, (iy + 1), n_total, dx_inv);
                                const L_0 = ((-((ez_top - ez_bot))) * dx_inv);
                                const v_0 = _b_Bx_init[c];
                                const pprev = _b_Bx_pprev[c];
                                _b_Bx_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
                            }
                            if (in_by_face) {
                                let _inl_26_result;
                                _inl_26: {
                                    _inl_26_result = ((iy * n_total) + ix);
                                    break _inl_26;
                                }
                                const c = _inl_26_result;
                                const ez_lft = ez_res_init_corner(ix, iy, n_total, dx_inv);
                                const ez_rgt = ez_res_init_corner((ix + 1), iy, n_total, dx_inv);
                                const L_0 = (((ez_rgt - ez_lft)) * dx_inv);
                                const v_0 = _b_By_init[c];
                                const pprev = _b_By_pprev[c];
                                _b_By_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
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
                        const n_total = _u_U_uniforms_grid_n_total;
                        const n_interior = _u_U_uniforms_grid_n;
                        const ghost = _u_U_uniforms_ghost_w;
                        const dx_inv = (1.0 / _u_U_uniforms_dx);
                        const dx2_inv = (dx_inv * dx_inv);
                        const dt_super = _u_dt_buf_dt_hyp;
                        if ((_u_sts_meta_s_total == 0)) {
                            break __invocation;
                        }
                        const j_idx = _u_sts_meta_substep_idx;
                        const base = (((j_idx - 1)) * 4);
                        const mu_j = _b_sts_coeffs[base];
                        const nu_j = _b_sts_coeffs[(base + 1)];
                        const gam_tilde_j = _b_sts_coeffs[(base + 3)];
                        const one_minus = ((1.0 - mu_j) - nu_j);
                        const ix = ((gid_x + ghost) - 1);
                        const iy = ((gid_y + ghost) - 1);
                        const in_cell_interior = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                        const in_bx_face = ((((ix >= ghost) && (ix <= (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                        const in_by_face = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy <= (ghost + n_interior)));
                        if ((!(((in_cell_interior || in_bx_face) || in_by_face)))) {
                            break __invocation;
                        }
                        if (in_cell_interior) {
                            let _inl_20_result;
                            _inl_20: {
                                _inl_20_result = ((iy * n_total) + ix);
                                break _inl_20;
                            }
                            const c = _inl_20_result;
                            const _inl_21_ix = (ix - 1);
                            let _inl_21_result;
                            _inl_21: {
                                _inl_21_result = ((iy * n_total) + _inl_21_ix);
                                break _inl_21;
                            }
                            const xl = _inl_21_result;
                            const _inl_22_ix = (ix + 1);
                            let _inl_22_result;
                            _inl_22: {
                                _inl_22_result = ((iy * n_total) + _inl_22_ix);
                                break _inl_22;
                            }
                            const xr = _inl_22_result;
                            const _inl_23_iy = (iy - 1);
                            let _inl_23_result;
                            _inl_23: {
                                _inl_23_result = ((_inl_23_iy * n_total) + ix);
                                break _inl_23;
                            }
                            const yd = _inl_23_result;
                            const _inl_24_iy = (iy + 1);
                            let _inl_24_result;
                            _inl_24: {
                                _inl_24_result = ((_inl_24_iy * n_total) + ix);
                                break _inl_24;
                            }
                            const yu = _inl_24_result;
                            const eta_c = eta_cell_init(ix, iy, n_total, dx_inv);
                            const bz_0 = _b_U1_init[((c) * 4 + 0) + 1];
                            const lap_0 = ((((_b_U1_init[((xr) * 4 + 0) + 1] + _b_U1_init[((xl) * 4 + 0) + 1]) + _b_U1_init[((yu) * 4 + 0) + 1]) + _b_U1_init[((yd) * 4 + 0) + 1]) - (4.0 * bz_0));
                            const L_0 = ((eta_c * dx2_inv) * lap_0);
                            const pprev_bz = _b_U1_pprev[((c) * 4 + 0) + 1];
                            const bz_new = (((one_minus * bz_0) + (nu_j * pprev_bz)) + ((dt_super * gam_tilde_j) * L_0));
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _b_U1_init[((c) * 4 + 0) + 0];
                                const _wt1 = bz_new;
                                const _wt2 = _b_U1_init[((c) * 4 + 0) + 2];
                                const _wt3 = _b_U1_init[((c) * 4 + 0) + 3];
                                _b_U1_tmp[_wbase + 0] = _wt0;
                                _b_U1_tmp[_wbase + 1] = _wt1;
                                _b_U1_tmp[_wbase + 2] = _wt2;
                                _b_U1_tmp[_wbase + 3] = _wt3;
                            }
                        }
                        if (in_bx_face) {
                            let _inl_25_result;
                            _inl_25: {
                                _inl_25_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_25;
                            }
                            const c = _inl_25_result;
                            const ez_bot = ez_res_init_corner(ix, iy, n_total, dx_inv);
                            const ez_top = ez_res_init_corner(ix, (iy + 1), n_total, dx_inv);
                            const L_0 = ((-((ez_top - ez_bot))) * dx_inv);
                            const v_0 = _b_Bx_init[c];
                            const pprev = _b_Bx_pprev[c];
                            _b_Bx_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
                        }
                        if (in_by_face) {
                            let _inl_26_result;
                            _inl_26: {
                                _inl_26_result = ((iy * n_total) + ix);
                                break _inl_26;
                            }
                            const c = _inl_26_result;
                            const ez_lft = ez_res_init_corner(ix, iy, n_total, dx_inv);
                            const ez_rgt = ez_res_init_corner((ix + 1), iy, n_total, dx_inv);
                            const L_0 = (((ez_rgt - ez_lft)) * dx_inv);
                            const v_0 = _b_By_init[c];
                            const pprev = _b_By_pprev[c];
                            _b_By_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
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
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const dx_inv = (1.0 / _u_U_uniforms_dx);
                    const dx2_inv = (dx_inv * dx_inv);
                    const dt_super = _u_dt_buf_dt_hyp;
                    if ((_u_sts_meta_s_total == 0)) {
                        break __invocation;
                    }
                    const j_idx = _u_sts_meta_substep_idx;
                    const base = (((j_idx - 1)) * 4);
                    const mu_j = _b_sts_coeffs[base];
                    const nu_j = _b_sts_coeffs[(base + 1)];
                    const gam_tilde_j = _b_sts_coeffs[(base + 3)];
                    const one_minus = ((1.0 - mu_j) - nu_j);
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    const in_cell_interior = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                    const in_bx_face = ((((ix >= ghost) && (ix <= (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)));
                    const in_by_face = ((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy <= (ghost + n_interior)));
                    if ((!(((in_cell_interior || in_bx_face) || in_by_face)))) {
                        break __invocation;
                    }
                    if (in_cell_interior) {
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = ((iy * n_total) + ix);
                            break _inl_20;
                        }
                        const c = _inl_20_result;
                        const _inl_21_ix = (ix - 1);
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = ((iy * n_total) + _inl_21_ix);
                            break _inl_21;
                        }
                        const xl = _inl_21_result;
                        const _inl_22_ix = (ix + 1);
                        let _inl_22_result;
                        _inl_22: {
                            _inl_22_result = ((iy * n_total) + _inl_22_ix);
                            break _inl_22;
                        }
                        const xr = _inl_22_result;
                        const _inl_23_iy = (iy - 1);
                        let _inl_23_result;
                        _inl_23: {
                            _inl_23_result = ((_inl_23_iy * n_total) + ix);
                            break _inl_23;
                        }
                        const yd = _inl_23_result;
                        const _inl_24_iy = (iy + 1);
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = ((_inl_24_iy * n_total) + ix);
                            break _inl_24;
                        }
                        const yu = _inl_24_result;
                        const eta_c = eta_cell_init(ix, iy, n_total, dx_inv);
                        const bz_0 = _b_U1_init[((c) * 4 + 0) + 1];
                        const lap_0 = ((((_b_U1_init[((xr) * 4 + 0) + 1] + _b_U1_init[((xl) * 4 + 0) + 1]) + _b_U1_init[((yu) * 4 + 0) + 1]) + _b_U1_init[((yd) * 4 + 0) + 1]) - (4.0 * bz_0));
                        const L_0 = ((eta_c * dx2_inv) * lap_0);
                        const pprev_bz = _b_U1_pprev[((c) * 4 + 0) + 1];
                        const bz_new = (((one_minus * bz_0) + (nu_j * pprev_bz)) + ((dt_super * gam_tilde_j) * L_0));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_init[((c) * 4 + 0) + 0];
                            const _wt1 = bz_new;
                            const _wt2 = _b_U1_init[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_init[((c) * 4 + 0) + 3];
                            _b_U1_tmp[_wbase + 0] = _wt0;
                            _b_U1_tmp[_wbase + 1] = _wt1;
                            _b_U1_tmp[_wbase + 2] = _wt2;
                            _b_U1_tmp[_wbase + 3] = _wt3;
                        }
                    }
                    if (in_bx_face) {
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_25;
                        }
                        const c = _inl_25_result;
                        const ez_bot = ez_res_init_corner(ix, iy, n_total, dx_inv);
                        const ez_top = ez_res_init_corner(ix, (iy + 1), n_total, dx_inv);
                        const L_0 = ((-((ez_top - ez_bot))) * dx_inv);
                        const v_0 = _b_Bx_init[c];
                        const pprev = _b_Bx_pprev[c];
                        _b_Bx_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
                    }
                    if (in_by_face) {
                        let _inl_26_result;
                        _inl_26: {
                            _inl_26_result = ((iy * n_total) + ix);
                            break _inl_26;
                        }
                        const c = _inl_26_result;
                        const ez_lft = ez_res_init_corner(ix, iy, n_total, dx_inv);
                        const ez_rgt = ez_res_init_corner((ix + 1), iy, n_total, dx_inv);
                        const L_0 = (((ez_rgt - ez_lft)) * dx_inv);
                        const v_0 = _b_By_init[c];
                        const pprev = _b_By_pprev[c];
                        _b_By_tmp[c] = (((one_minus * v_0) + (nu_j * pprev)) + ((dt_super * gam_tilde_j) * L_0));
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

    return { entry, bind, bindings: ["U_uniforms","sts_meta","sts_coeffs","Bx_init","By_init","U1_init","Bx_pprev","By_pprev","U1_pprev","Bx_tmp","By_tmp","U1_tmp","dt_buf"], entryInfo };
}
