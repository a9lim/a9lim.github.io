// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-nonideal.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 7275d7b59ea56c1eb8aa910ea33314140c45113a531285aa471e4f7937b99362
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":65892,"lines":1272,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":5,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.576Z
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

    function ez_edge_idx(ix, iy, n_total) {
        return ((iy * ((n_total + 1))) + ix);
    }

    function cell_pressure_ni(ix, iy, n_total) {
        let _inl_10_result;
        _inl_10: {
            _inl_10_result = ((iy * n_total) + ix);
            break _inl_10;
        }
        const c = _inl_10_result;
        const _sroa_0_base = ((c) * 4 + 0);
        const u0_x = bindings.U0[_sroa_0_base + 0];
        const u0_y = bindings.U0[_sroa_0_base + 1];
        const u0_z = bindings.U0[_sroa_0_base + 2];
        const u0_w = bindings.U0[_sroa_0_base + 3];
        const _sroa_1_base = ((c) * 4 + 0);
        const u1_x = bindings.U1[_sroa_1_base + 0];
        const u1_y = bindings.U1[_sroa_1_base + 1];
        const u1_z = bindings.U1[_sroa_1_base + 2];
        const u1_w = bindings.U1[_sroa_1_base + 3];
        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
        const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
        let _inl_11_result;
        _inl_11: {
            let _inl_11__inl_6_result;
            _inl_11__inl_6: {
                _inl_11__inl_6_result = ((iy * ((n_total + 1))) + ix);
                break _inl_11__inl_6;
            }
            const _inl_11__inl_7_ix = (ix + 1);
            let _inl_11__inl_7_result;
            _inl_11__inl_7: {
                _inl_11__inl_7_result = ((iy * ((n_total + 1))) + _inl_11__inl_7_ix);
                break _inl_11__inl_7;
            }
            _inl_11_result = (0.5 * ((bindings.Bx_face[_inl_11__inl_6_result] + bindings.Bx_face[_inl_11__inl_7_result])));
            break _inl_11;
        }
        const bx = _inl_11_result;
        let _inl_12_result;
        _inl_12: {
            let _inl_12__inl_8_result;
            _inl_12__inl_8: {
                _inl_12__inl_8_result = ((iy * n_total) + ix);
                break _inl_12__inl_8;
            }
            const _inl_12__inl_9_iy = (iy + 1);
            let _inl_12__inl_9_result;
            _inl_12__inl_9: {
                _inl_12__inl_9_result = ((_inl_12__inl_9_iy * n_total) + ix);
                break _inl_12__inl_9;
            }
            _inl_12_result = (0.5 * ((bindings.By_face[_inl_12__inl_8_result] + bindings.By_face[_inl_12__inl_9_result])));
            break _inl_12;
        }
        const by = _inl_12_result;
        const mb = (0.5 * ((((bx * bx) + (by * by)) + (u1_y * u1_y))));
        return (((((bindings.U_uniforms.gamma - 1.0)) * (((u1_x - ke) - mb)))) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : ((((bindings.U_uniforms.gamma - 1.0)) * (((u1_x - ke) - mb)))));
    }

    function corner_jb_ni(ix, iy, n_total) {
        const dx = bindings.U_uniforms.dx;
        let R_Jx = 0;
        let R_Jy = 0;
        let R_Jz = 0;
        let R_Bx = 0;
        let R_By = 0;
        let R_Bz = 0;
        let R_rho = 0;
        const _inl_15_iy = (iy - 1);
        let _inl_15_result;
        _inl_15: {
            _inl_15_result = ((_inl_15_iy * ((n_total + 1))) + ix);
            break _inl_15;
        }
        let _inl_16_result;
        _inl_16: {
            _inl_16_result = ((iy * ((n_total + 1))) + ix);
            break _inl_16;
        }
        R_Bx = (0.5 * ((bindings.Bx_face[_inl_15_result] + bindings.Bx_face[_inl_16_result])));
        const _inl_17_ix = (ix - 1);
        let _inl_17_result;
        _inl_17: {
            _inl_17_result = ((iy * n_total) + _inl_17_ix);
            break _inl_17;
        }
        let _inl_18_result;
        _inl_18: {
            _inl_18_result = ((iy * n_total) + ix);
            break _inl_18;
        }
        R_By = (0.5 * ((bindings.By_face[_inl_17_result] + bindings.By_face[_inl_18_result])));
        const _inl_19_ix = (ix - 1);
        const _inl_19_iy = (iy - 1);
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = ((_inl_19_iy * n_total) + _inl_19_ix);
            break _inl_19;
        }
        const bz_sw = bindings.U1[((_inl_19_result) * 4 + 0) + 1];
        const _inl_20_iy = (iy - 1);
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = ((_inl_20_iy * n_total) + ix);
            break _inl_20;
        }
        const bz_se = bindings.U1[((_inl_20_result) * 4 + 0) + 1];
        const _inl_21_ix = (ix - 1);
        let _inl_21_result;
        _inl_21: {
            _inl_21_result = ((iy * n_total) + _inl_21_ix);
            break _inl_21;
        }
        const bz_nw = bindings.U1[((_inl_21_result) * 4 + 0) + 1];
        let _inl_22_result;
        _inl_22: {
            _inl_22_result = ((iy * n_total) + ix);
            break _inl_22;
        }
        const bz_ne = bindings.U1[((_inl_22_result) * 4 + 0) + 1];
        R_Bz = (0.25 * ((((bz_sw + bz_se) + bz_nw) + bz_ne)));
        const _inl_23_ix = (ix - 1);
        const _inl_23_iy = (iy - 1);
        let _inl_23_result;
        _inl_23: {
            _inl_23_result = ((_inl_23_iy * n_total) + _inl_23_ix);
            break _inl_23;
        }
        const rho_sw = bindings.U0[((_inl_23_result) * 4 + 0) + 0];
        const _inl_24_iy = (iy - 1);
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = ((_inl_24_iy * n_total) + ix);
            break _inl_24;
        }
        const rho_se = bindings.U0[((_inl_24_result) * 4 + 0) + 0];
        const _inl_25_ix = (ix - 1);
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((iy * n_total) + _inl_25_ix);
            break _inl_25;
        }
        const rho_nw = bindings.U0[((_inl_25_result) * 4 + 0) + 0];
        let _inl_26_result;
        _inl_26: {
            _inl_26_result = ((iy * n_total) + ix);
            break _inl_26;
        }
        const rho_ne = bindings.U0[((_inl_26_result) * 4 + 0) + 0];
        R_rho = (((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : ((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))));
        const _inl_27_ix = (ix - 1);
        let _inl_27_result;
        _inl_27: {
            _inl_27_result = ((iy * n_total) + _inl_27_ix);
            break _inl_27;
        }
        const by_l = bindings.By_face[_inl_27_result];
        let _inl_28_result;
        _inl_28: {
            _inl_28_result = ((iy * n_total) + ix);
            break _inl_28;
        }
        const by_r = bindings.By_face[_inl_28_result];
        const _inl_29_iy = (iy - 1);
        let _inl_29_result;
        _inl_29: {
            _inl_29_result = ((_inl_29_iy * ((n_total + 1))) + ix);
            break _inl_29;
        }
        const bx_d = bindings.Bx_face[_inl_29_result];
        let _inl_30_result;
        _inl_30: {
            _inl_30_result = ((iy * ((n_total + 1))) + ix);
            break _inl_30;
        }
        const bx_u = bindings.Bx_face[_inl_30_result];
        R_Jz = ((((by_r - by_l)) / dx) - (((bx_u - bx_d)) / dx));
        const bz_d_avg = (0.5 * ((bz_sw + bz_se)));
        const bz_u_avg = (0.5 * ((bz_nw + bz_ne)));
        const bz_l_avg = (0.5 * ((bz_sw + bz_nw)));
        const bz_r_avg = (0.5 * ((bz_se + bz_ne)));
        R_Jx = (((bz_u_avg - bz_d_avg)) / dx);
        R_Jy = ((-((bz_r_avg - bz_l_avg))) / dx);
        return { Jx: R_Jx, Jy: R_Jy, Jz: R_Jz, Bx: R_Bx, By: R_By, Bz: R_Bz, rho: R_rho };
    }

    function ambipolar_e_corner(ix, iy, n_total) {
        const _sroa_2 = corner_jb_ni(ix, iy, n_total);
        const s_Jx = _sroa_2.Jx;
        const s_Jy = _sroa_2.Jy;
        const s_Jz = _sroa_2.Jz;
        const s_Bx = _sroa_2.Bx;
        const s_By = _sroa_2.By;
        const s_Bz = _sroa_2.Bz;
        const s_rho = _sroa_2.rho;
        const b2 = (((s_Bx * s_Bx) + (s_By * s_By)) + (s_Bz * s_Bz));
        if ((b2 <= 1.0e-20)) {
            return {x:0.0, y:0.0, z:0.0};
        }
        const jdotb = (((s_Jx * s_Bx) + (s_Jy * s_By)) + (s_Jz * s_Bz));
        const jperp_x = (s_Jx - (s_Bx * ((jdotb / b2))));
        const jperp_y = (s_Jy - (s_By * ((jdotb / b2))));
        const jperp_z = (s_Jz - (s_Bz * ((jdotb / b2))));
        const _inl_31_ix = (ix - 1);
        const _inl_31_iy = (iy - 1);
        let _inl_31_result;
        _inl_31: {
            const _inl_31_f0 = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.neutral_frac, 0.0, 1.0));
            const _inl_31_T0 = ((bindings.U_uniforms.ionization_T0) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.ionization_T0));
            let _inl_31__inl_14_result;
            _inl_31__inl_14: {
                let _inl_31__inl_14__inl_13_result;
                _inl_31__inl_14__inl_13: {
                    _inl_31__inl_14__inl_13_result = ((_inl_31_iy * n_total) + _inl_31_ix);
                    break _inl_31__inl_14__inl_13;
                }
                const _inl_31__inl_14_rho = ((bindings.U0[((_inl_31__inl_14__inl_13_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_31__inl_14__inl_13_result) * 4 + 0) + 0]));
                _inl_31__inl_14_result = (cell_pressure_ni(_inl_31_ix, _inl_31_iy, n_total) / _inl_31__inl_14_rho);
                break _inl_31__inl_14;
            }
            const _inl_31_T = ((_inl_31__inl_14_result) < (0.0) ? (0.0) : (_inl_31__inl_14_result));
            _inl_31_result = (_inl_31_f0 / ((1.0 + (((_inl_31_T / _inl_31_T0)) * ((_inl_31_T / _inl_31_T0))))));
            break _inl_31;
        }
        const f_sw = _inl_31_result;
        const _inl_32_iy = (iy - 1);
        let _inl_32_result;
        _inl_32: {
            const _inl_32_f0 = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.neutral_frac, 0.0, 1.0));
            const _inl_32_T0 = ((bindings.U_uniforms.ionization_T0) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.ionization_T0));
            let _inl_32__inl_14_result;
            _inl_32__inl_14: {
                let _inl_32__inl_14__inl_13_result;
                _inl_32__inl_14__inl_13: {
                    _inl_32__inl_14__inl_13_result = ((_inl_32_iy * n_total) + ix);
                    break _inl_32__inl_14__inl_13;
                }
                const _inl_32__inl_14_rho = ((bindings.U0[((_inl_32__inl_14__inl_13_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_32__inl_14__inl_13_result) * 4 + 0) + 0]));
                _inl_32__inl_14_result = (cell_pressure_ni(ix, _inl_32_iy, n_total) / _inl_32__inl_14_rho);
                break _inl_32__inl_14;
            }
            const _inl_32_T = ((_inl_32__inl_14_result) < (0.0) ? (0.0) : (_inl_32__inl_14_result));
            _inl_32_result = (_inl_32_f0 / ((1.0 + (((_inl_32_T / _inl_32_T0)) * ((_inl_32_T / _inl_32_T0))))));
            break _inl_32;
        }
        const f_se = _inl_32_result;
        const _inl_33_ix = (ix - 1);
        let _inl_33_result;
        _inl_33: {
            const _inl_33_f0 = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.neutral_frac, 0.0, 1.0));
            const _inl_33_T0 = ((bindings.U_uniforms.ionization_T0) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.ionization_T0));
            let _inl_33__inl_14_result;
            _inl_33__inl_14: {
                let _inl_33__inl_14__inl_13_result;
                _inl_33__inl_14__inl_13: {
                    _inl_33__inl_14__inl_13_result = ((iy * n_total) + _inl_33_ix);
                    break _inl_33__inl_14__inl_13;
                }
                const _inl_33__inl_14_rho = ((bindings.U0[((_inl_33__inl_14__inl_13_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_33__inl_14__inl_13_result) * 4 + 0) + 0]));
                _inl_33__inl_14_result = (cell_pressure_ni(_inl_33_ix, iy, n_total) / _inl_33__inl_14_rho);
                break _inl_33__inl_14;
            }
            const _inl_33_T = ((_inl_33__inl_14_result) < (0.0) ? (0.0) : (_inl_33__inl_14_result));
            _inl_33_result = (_inl_33_f0 / ((1.0 + (((_inl_33_T / _inl_33_T0)) * ((_inl_33_T / _inl_33_T0))))));
            break _inl_33;
        }
        const f_nw = _inl_33_result;
        let _inl_34_result;
        _inl_34: {
            const _inl_34_f0 = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.neutral_frac, 0.0, 1.0));
            const _inl_34_T0 = ((bindings.U_uniforms.ionization_T0) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.ionization_T0));
            let _inl_34__inl_14_result;
            _inl_34__inl_14: {
                let _inl_34__inl_14__inl_13_result;
                _inl_34__inl_14__inl_13: {
                    _inl_34__inl_14__inl_13_result = ((iy * n_total) + ix);
                    break _inl_34__inl_14__inl_13;
                }
                const _inl_34__inl_14_rho = ((bindings.U0[((_inl_34__inl_14__inl_13_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_34__inl_14__inl_13_result) * 4 + 0) + 0]));
                _inl_34__inl_14_result = (cell_pressure_ni(ix, iy, n_total) / _inl_34__inl_14_rho);
                break _inl_34__inl_14;
            }
            const _inl_34_T = ((_inl_34__inl_14_result) < (0.0) ? (0.0) : (_inl_34__inl_14_result));
            _inl_34_result = (_inl_34_f0 / ((1.0 + (((_inl_34_T / _inl_34_T0)) * ((_inl_34_T / _inl_34_T0))))));
            break _inl_34;
        }
        const f_ne = _inl_34_result;
        const neutral = (0.25 * ((((f_sw + f_se) + f_nw) + f_ne)));
        const eta_a = (((bindings.U_uniforms.ambipolar_eta) < (0.0) ? (0.0) : (bindings.U_uniforms.ambipolar_eta)) * neutral);
        return {x:(eta_a * jperp_x), y:(eta_a * jperp_y), z:(eta_a * jperp_z)};
    }

    function biermann_cell(ix, iy, n_total) {
        const pe_frac = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.hall_electron_pressure_frac, 0.0, 1.0));
        const pe_l = (pe_frac * cell_pressure_ni((ix - 1), iy, n_total));
        const pe_r = (pe_frac * cell_pressure_ni((ix + 1), iy, n_total));
        const pe_d = (pe_frac * cell_pressure_ni(ix, (iy - 1), n_total));
        const pe_u = (pe_frac * cell_pressure_ni(ix, (iy + 1), n_total));
        const _inl_35_ix = (ix - 1);
        let _inl_35_result;
        _inl_35: {
            _inl_35_result = ((iy * n_total) + _inl_35_ix);
            break _inl_35;
        }
        const rho_l = ((bindings.U0[((_inl_35_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_35_result) * 4 + 0) + 0]));
        const _inl_36_ix = (ix + 1);
        let _inl_36_result;
        _inl_36: {
            _inl_36_result = ((iy * n_total) + _inl_36_ix);
            break _inl_36;
        }
        const rho_r = ((bindings.U0[((_inl_36_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_36_result) * 4 + 0) + 0]));
        const _inl_37_iy = (iy - 1);
        let _inl_37_result;
        _inl_37: {
            _inl_37_result = ((_inl_37_iy * n_total) + ix);
            break _inl_37;
        }
        const rho_d = ((bindings.U0[((_inl_37_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_37_result) * 4 + 0) + 0]));
        const _inl_38_iy = (iy + 1);
        let _inl_38_result;
        _inl_38: {
            _inl_38_result = ((_inl_38_iy * n_total) + ix);
            break _inl_38;
        }
        const rho_u = ((bindings.U0[((_inl_38_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_38_result) * 4 + 0) + 0]));
        let _inl_39_result;
        _inl_39: {
            _inl_39_result = ((iy * n_total) + ix);
            break _inl_39;
        }
        const rho_c = ((bindings.U0[((_inl_39_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_39_result) * 4 + 0) + 0]));
        const inv_2dx = (0.5 / bindings.U_uniforms.dx);
        const grad_rho_x = (((rho_r - rho_l)) * inv_2dx);
        const grad_rho_y = (((rho_u - rho_d)) * inv_2dx);
        const grad_pe_x = (((pe_r - pe_l)) * inv_2dx);
        const grad_pe_y = (((pe_u - pe_d)) * inv_2dx);
        return ((bindings.U_uniforms.biermann_coeff * (((grad_rho_x * grad_pe_y) - (grad_rho_y * grad_pe_x)))) / (((rho_c * rho_c)) < (1.0e-20) ? (1.0e-20) : ((rho_c * rho_c))));
    }

    function load_E(ix, iy, n_total) {
        let _inl_40_result;
        _inl_40: {
            _inl_40_result = ((iy * ((n_total + 1))) + ix);
            break _inl_40;
        }
        const _sroa_3_base = ((_inl_40_result) * 4 + 0);
        const e_x = bindings.nonideal_E[_sroa_3_base + 0];
        const e_y = bindings.nonideal_E[_sroa_3_base + 1];
        const e_z = bindings.nonideal_E[_sroa_3_base + 2];
        const e_w = bindings.nonideal_E[_sroa_3_base + 3];
        return {x:e_x, y:e_y, z:e_z};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["compute_emf"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_compute_emf(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_hall_electron_pressure_frac = _b_U_uniforms.hall_electron_pressure_frac;
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_neutral_frac = _b_U_uniforms.neutral_frac;
        const _b_nonideal_E = bindings.nonideal_E;
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
                    const _inl_41_flags = _u_U_uniforms_physics_flags;
                    let _inl_41_result;
                    _inl_41: {
                        _inl_41_result = (((_inl_41_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_41;
                    }
                    const ambi_on = ((_inl_41_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_42_flags = _u_U_uniforms_physics_flags;
                    let _inl_42_result;
                    _inl_42: {
                        _inl_42_result = (((_inl_42_flags & FLAG_BIERMANN)) != 0);
                        break _inl_42;
                    }
                    const biermann_on = ((_inl_42_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!ambi_on) && (!biermann_on))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    let e_x = 0.0;
                    let e_y = 0.0;
                    let e_z = 0.0;
                    if (ambi_on) {
                        const _sroa_4 = ambipolar_e_corner(ix, iy, n_total);
                        e_x = _sroa_4.x;
                        e_y = _sroa_4.y;
                        e_z = _sroa_4.z;
                    }
                    let battery = 0.0;
                    if (((biermann_on && (gid_x < n_interior)) && (gid_y < n_interior))) {
                        battery = biermann_cell(ix, iy, n_total);
                    }
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_x;
                        const _wt1 = e_y;
                        const _wt2 = e_z;
                        const _wt3 = battery;
                        _b_nonideal_E[_wbase + 0] = _wt0;
                        _b_nonideal_E[_wbase + 1] = _wt1;
                        _b_nonideal_E[_wbase + 2] = _wt2;
                        _b_nonideal_E[_wbase + 3] = _wt3;
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
                            const _inl_41_flags = _u_U_uniforms_physics_flags;
                            let _inl_41_result;
                            _inl_41: {
                                _inl_41_result = (((_inl_41_flags & FLAG_AMBIPOLAR)) != 0);
                                break _inl_41;
                            }
                            const ambi_on = ((_inl_41_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                            const _inl_42_flags = _u_U_uniforms_physics_flags;
                            let _inl_42_result;
                            _inl_42: {
                                _inl_42_result = (((_inl_42_flags & FLAG_BIERMANN)) != 0);
                                break _inl_42;
                            }
                            const biermann_on = ((_inl_42_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                            if (((!ambi_on) && (!biermann_on))) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const extent = (n_interior + 1);
                            if (((gid_x >= extent) || (gid_y >= extent))) {
                                break __invocation;
                            }
                            const ix = (ghost + gid_x);
                            const iy = (ghost + gid_y);
                            let e_x = 0.0;
                            let e_y = 0.0;
                            let e_z = 0.0;
                            if (ambi_on) {
                                const _sroa_5 = ambipolar_e_corner(ix, iy, n_total);
                                e_x = _sroa_5.x;
                                e_y = _sroa_5.y;
                                e_z = _sroa_5.z;
                            }
                            let battery = 0.0;
                            if (((biermann_on && (gid_x < n_interior)) && (gid_y < n_interior))) {
                                battery = biermann_cell(ix, iy, n_total);
                            }
                            {
                                const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                                const _wt0 = e_x;
                                const _wt1 = e_y;
                                const _wt2 = e_z;
                                const _wt3 = battery;
                                _b_nonideal_E[_wbase + 0] = _wt0;
                                _b_nonideal_E[_wbase + 1] = _wt1;
                                _b_nonideal_E[_wbase + 2] = _wt2;
                                _b_nonideal_E[_wbase + 3] = _wt3;
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
                        const _inl_41_flags = _u_U_uniforms_physics_flags;
                        let _inl_41_result;
                        _inl_41: {
                            _inl_41_result = (((_inl_41_flags & FLAG_AMBIPOLAR)) != 0);
                            break _inl_41;
                        }
                        const ambi_on = ((_inl_41_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                        const _inl_42_flags = _u_U_uniforms_physics_flags;
                        let _inl_42_result;
                        _inl_42: {
                            _inl_42_result = (((_inl_42_flags & FLAG_BIERMANN)) != 0);
                            break _inl_42;
                        }
                        const biermann_on = ((_inl_42_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                        if (((!ambi_on) && (!biermann_on))) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const extent = (n_interior + 1);
                        if (((gid_x >= extent) || (gid_y >= extent))) {
                            break __invocation;
                        }
                        const ix = (ghost + gid_x);
                        const iy = (ghost + gid_y);
                        let e_x = 0.0;
                        let e_y = 0.0;
                        let e_z = 0.0;
                        if (ambi_on) {
                            const _sroa_6 = ambipolar_e_corner(ix, iy, n_total);
                            e_x = _sroa_6.x;
                            e_y = _sroa_6.y;
                            e_z = _sroa_6.z;
                        }
                        let battery = 0.0;
                        if (((biermann_on && (gid_x < n_interior)) && (gid_y < n_interior))) {
                            battery = biermann_cell(ix, iy, n_total);
                        }
                        {
                            const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                            const _wt0 = e_x;
                            const _wt1 = e_y;
                            const _wt2 = e_z;
                            const _wt3 = battery;
                            _b_nonideal_E[_wbase + 0] = _wt0;
                            _b_nonideal_E[_wbase + 1] = _wt1;
                            _b_nonideal_E[_wbase + 2] = _wt2;
                            _b_nonideal_E[_wbase + 3] = _wt3;
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
                    const _inl_41_flags = _u_U_uniforms_physics_flags;
                    let _inl_41_result;
                    _inl_41: {
                        _inl_41_result = (((_inl_41_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_41;
                    }
                    const ambi_on = ((_inl_41_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_42_flags = _u_U_uniforms_physics_flags;
                    let _inl_42_result;
                    _inl_42: {
                        _inl_42_result = (((_inl_42_flags & FLAG_BIERMANN)) != 0);
                        break _inl_42;
                    }
                    const biermann_on = ((_inl_42_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!ambi_on) && (!biermann_on))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    let e_x = 0.0;
                    let e_y = 0.0;
                    let e_z = 0.0;
                    if (ambi_on) {
                        const _sroa_7 = ambipolar_e_corner(ix, iy, n_total);
                        e_x = _sroa_7.x;
                        e_y = _sroa_7.y;
                        e_z = _sroa_7.z;
                    }
                    let battery = 0.0;
                    if (((biermann_on && (gid_x < n_interior)) && (gid_y < n_interior))) {
                        battery = biermann_cell(ix, iy, n_total);
                    }
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_x;
                        const _wt1 = e_y;
                        const _wt2 = e_z;
                        const _wt3 = battery;
                        _b_nonideal_E[_wbase + 0] = _wt0;
                        _b_nonideal_E[_wbase + 1] = _wt1;
                        _b_nonideal_E[_wbase + 2] = _wt2;
                        _b_nonideal_E[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["compute_emf"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_compute_emf(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_update"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_apply_update(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_hall_electron_pressure_frac = _b_U_uniforms.hall_electron_pressure_frac;
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_neutral_frac = _b_U_uniforms.neutral_frac;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_nonideal_E = bindings.nonideal_E;
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
                    const _inl_43_flags = _u_U_uniforms_physics_flags;
                    let _inl_43_result;
                    _inl_43: {
                        _inl_43_result = (((_inl_43_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_43;
                    }
                    const ambi_on = ((_inl_43_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_44_flags = _u_U_uniforms_physics_flags;
                    let _inl_44_result;
                    _inl_44: {
                        _inl_44_result = (((_inl_44_flags & FLAG_BIERMANN)) != 0);
                        break _inl_44;
                    }
                    const biermann_on = ((_inl_44_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!ambi_on) && (!biermann_on))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    const dt = _u_dt_buf_dt;
                    const dt_dx = (dt / _u_U_uniforms_dx);
                    if (ambi_on) {
                        if ((gid_y < n_interior)) {
                            const _sroa_8 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_8.x;
                            const e0_y = _sroa_8.y;
                            const e0_z = _sroa_8.z;
                            const _sroa_9 = load_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_9.x;
                            const e1_y = _sroa_9.y;
                            const e1_z = _sroa_9.z;
                            let _inl_45_result;
                            _inl_45: {
                                _inl_45_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_45;
                            }
                            const bxi = _inl_45_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_10 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_10.x;
                            const e0_y = _sroa_10.y;
                            const e0_z = _sroa_10.z;
                            const _sroa_11 = load_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_11.x;
                            const e1_y = _sroa_11.y;
                            const e1_z = _sroa_11.z;
                            let _inl_46_result;
                            _inl_46: {
                                _inl_46_result = ((iy * n_total) + ix);
                                break _inl_46;
                            }
                            const byi = _inl_46_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_47_result;
                        _inl_47: {
                            _inl_47_result = ((iy * n_total) + ix);
                            break _inl_47;
                        }
                        const c = _inl_47_result;
                        const _sroa_12_base = ((c) * 4 + 0);
                        let u1_x = _b_U1[_sroa_12_base + 0];
                        let u1_y = _b_U1[_sroa_12_base + 1];
                        let u1_z = _b_U1[_sroa_12_base + 2];
                        let u1_w = _b_U1[_sroa_12_base + 3];
                        if (ambi_on) {
                            const _sroa_13 = load_E(ix, iy, n_total);
                            const e_sw_x = _sroa_13.x;
                            const e_sw_y = _sroa_13.y;
                            const e_sw_z = _sroa_13.z;
                            const _sroa_14 = load_E((ix + 1), iy, n_total);
                            const e_se_x = _sroa_14.x;
                            const e_se_y = _sroa_14.y;
                            const e_se_z = _sroa_14.z;
                            const _sroa_15 = load_E(ix, (iy + 1), n_total);
                            const e_nw_x = _sroa_15.x;
                            const e_nw_y = _sroa_15.y;
                            const e_nw_z = _sroa_15.z;
                            const _sroa_16 = load_E((ix + 1), (iy + 1), n_total);
                            const e_ne_x = _sroa_16.x;
                            const e_ne_y = _sroa_16.y;
                            const e_ne_z = _sroa_16.z;
                            const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                            const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * dt));
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                        if (biermann_on) {
                            let _inl_48_result;
                            _inl_48: {
                                _inl_48_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_48;
                            }
                            const b = _b_nonideal_E[((_inl_48_result) * 4 + 0) + 3];
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + (b * dt));
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
                        }
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
                            const _inl_43_flags = _u_U_uniforms_physics_flags;
                            let _inl_43_result;
                            _inl_43: {
                                _inl_43_result = (((_inl_43_flags & FLAG_AMBIPOLAR)) != 0);
                                break _inl_43;
                            }
                            const ambi_on = ((_inl_43_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                            const _inl_44_flags = _u_U_uniforms_physics_flags;
                            let _inl_44_result;
                            _inl_44: {
                                _inl_44_result = (((_inl_44_flags & FLAG_BIERMANN)) != 0);
                                break _inl_44;
                            }
                            const biermann_on = ((_inl_44_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                            if (((!ambi_on) && (!biermann_on))) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const extent = (n_interior + 1);
                            if (((gid_x >= extent) || (gid_y >= extent))) {
                                break __invocation;
                            }
                            const ix = (ghost + gid_x);
                            const iy = (ghost + gid_y);
                            const dt = _u_dt_buf_dt;
                            const dt_dx = (dt / _u_U_uniforms_dx);
                            if (ambi_on) {
                                if ((gid_y < n_interior)) {
                                    const _sroa_17 = load_E(ix, iy, n_total);
                                    const e0_x = _sroa_17.x;
                                    const e0_y = _sroa_17.y;
                                    const e0_z = _sroa_17.z;
                                    const _sroa_18 = load_E(ix, (iy + 1), n_total);
                                    const e1_x = _sroa_18.x;
                                    const e1_y = _sroa_18.y;
                                    const e1_z = _sroa_18.z;
                                    let _inl_45_result;
                                    _inl_45: {
                                        _inl_45_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_45;
                                    }
                                    const bxi = _inl_45_result;
                                    _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                                }
                                if ((gid_x < n_interior)) {
                                    const _sroa_19 = load_E(ix, iy, n_total);
                                    const e0_x = _sroa_19.x;
                                    const e0_y = _sroa_19.y;
                                    const e0_z = _sroa_19.z;
                                    const _sroa_20 = load_E((ix + 1), iy, n_total);
                                    const e1_x = _sroa_20.x;
                                    const e1_y = _sroa_20.y;
                                    const e1_z = _sroa_20.z;
                                    let _inl_46_result;
                                    _inl_46: {
                                        _inl_46_result = ((iy * n_total) + ix);
                                        break _inl_46;
                                    }
                                    const byi = _inl_46_result;
                                    _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                                }
                            }
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                let _inl_47_result;
                                _inl_47: {
                                    _inl_47_result = ((iy * n_total) + ix);
                                    break _inl_47;
                                }
                                const c = _inl_47_result;
                                const _sroa_21_base = ((c) * 4 + 0);
                                let u1_x = _b_U1[_sroa_21_base + 0];
                                let u1_y = _b_U1[_sroa_21_base + 1];
                                let u1_z = _b_U1[_sroa_21_base + 2];
                                let u1_w = _b_U1[_sroa_21_base + 3];
                                if (ambi_on) {
                                    const _sroa_22 = load_E(ix, iy, n_total);
                                    const e_sw_x = _sroa_22.x;
                                    const e_sw_y = _sroa_22.y;
                                    const e_sw_z = _sroa_22.z;
                                    const _sroa_23 = load_E((ix + 1), iy, n_total);
                                    const e_se_x = _sroa_23.x;
                                    const e_se_y = _sroa_23.y;
                                    const e_se_z = _sroa_23.z;
                                    const _sroa_24 = load_E(ix, (iy + 1), n_total);
                                    const e_nw_x = _sroa_24.x;
                                    const e_nw_y = _sroa_24.y;
                                    const e_nw_z = _sroa_24.z;
                                    const _sroa_25 = load_E((ix + 1), (iy + 1), n_total);
                                    const e_ne_x = _sroa_25.x;
                                    const e_ne_y = _sroa_25.y;
                                    const e_ne_z = _sroa_25.z;
                                    const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                                    const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                                    {
                                        const _wt0 = u1_x;
                                        const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * dt));
                                        const _wt2 = u1_z;
                                        const _wt3 = u1_w;
                                        u1_x = _wt0;
                                        u1_y = _wt1;
                                        u1_z = _wt2;
                                        u1_w = _wt3;
                                    }
                                }
                                if (biermann_on) {
                                    let _inl_48_result;
                                    _inl_48: {
                                        _inl_48_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_48;
                                    }
                                    const b = _b_nonideal_E[((_inl_48_result) * 4 + 0) + 3];
                                    {
                                        const _wt0 = u1_x;
                                        const _wt1 = (u1_y + (b * dt));
                                        const _wt2 = u1_z;
                                        const _wt3 = u1_w;
                                        u1_x = _wt0;
                                        u1_y = _wt1;
                                        u1_z = _wt2;
                                        u1_w = _wt3;
                                    }
                                }
                                {
                                    const _wbase = ((c) * 4 + 0);
                                    const _wt0 = u1_x;
                                    const _wt1 = u1_y;
                                    const _wt2 = u1_z;
                                    const _wt3 = u1_w;
                                    _b_U1[_wbase + 0] = _wt0;
                                    _b_U1[_wbase + 1] = _wt1;
                                    _b_U1[_wbase + 2] = _wt2;
                                    _b_U1[_wbase + 3] = _wt3;
                                }
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
                        const _inl_43_flags = _u_U_uniforms_physics_flags;
                        let _inl_43_result;
                        _inl_43: {
                            _inl_43_result = (((_inl_43_flags & FLAG_AMBIPOLAR)) != 0);
                            break _inl_43;
                        }
                        const ambi_on = ((_inl_43_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                        const _inl_44_flags = _u_U_uniforms_physics_flags;
                        let _inl_44_result;
                        _inl_44: {
                            _inl_44_result = (((_inl_44_flags & FLAG_BIERMANN)) != 0);
                            break _inl_44;
                        }
                        const biermann_on = ((_inl_44_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                        if (((!ambi_on) && (!biermann_on))) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const extent = (n_interior + 1);
                        if (((gid_x >= extent) || (gid_y >= extent))) {
                            break __invocation;
                        }
                        const ix = (ghost + gid_x);
                        const iy = (ghost + gid_y);
                        const dt = _u_dt_buf_dt;
                        const dt_dx = (dt / _u_U_uniforms_dx);
                        if (ambi_on) {
                            if ((gid_y < n_interior)) {
                                const _sroa_26 = load_E(ix, iy, n_total);
                                const e0_x = _sroa_26.x;
                                const e0_y = _sroa_26.y;
                                const e0_z = _sroa_26.z;
                                const _sroa_27 = load_E(ix, (iy + 1), n_total);
                                const e1_x = _sroa_27.x;
                                const e1_y = _sroa_27.y;
                                const e1_z = _sroa_27.z;
                                let _inl_45_result;
                                _inl_45: {
                                    _inl_45_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_45;
                                }
                                const bxi = _inl_45_result;
                                _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                            }
                            if ((gid_x < n_interior)) {
                                const _sroa_28 = load_E(ix, iy, n_total);
                                const e0_x = _sroa_28.x;
                                const e0_y = _sroa_28.y;
                                const e0_z = _sroa_28.z;
                                const _sroa_29 = load_E((ix + 1), iy, n_total);
                                const e1_x = _sroa_29.x;
                                const e1_y = _sroa_29.y;
                                const e1_z = _sroa_29.z;
                                let _inl_46_result;
                                _inl_46: {
                                    _inl_46_result = ((iy * n_total) + ix);
                                    break _inl_46;
                                }
                                const byi = _inl_46_result;
                                _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                            }
                        }
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
                            let _inl_47_result;
                            _inl_47: {
                                _inl_47_result = ((iy * n_total) + ix);
                                break _inl_47;
                            }
                            const c = _inl_47_result;
                            const _sroa_30_base = ((c) * 4 + 0);
                            let u1_x = _b_U1[_sroa_30_base + 0];
                            let u1_y = _b_U1[_sroa_30_base + 1];
                            let u1_z = _b_U1[_sroa_30_base + 2];
                            let u1_w = _b_U1[_sroa_30_base + 3];
                            if (ambi_on) {
                                const _sroa_31 = load_E(ix, iy, n_total);
                                const e_sw_x = _sroa_31.x;
                                const e_sw_y = _sroa_31.y;
                                const e_sw_z = _sroa_31.z;
                                const _sroa_32 = load_E((ix + 1), iy, n_total);
                                const e_se_x = _sroa_32.x;
                                const e_se_y = _sroa_32.y;
                                const e_se_z = _sroa_32.z;
                                const _sroa_33 = load_E(ix, (iy + 1), n_total);
                                const e_nw_x = _sroa_33.x;
                                const e_nw_y = _sroa_33.y;
                                const e_nw_z = _sroa_33.z;
                                const _sroa_34 = load_E((ix + 1), (iy + 1), n_total);
                                const e_ne_x = _sroa_34.x;
                                const e_ne_y = _sroa_34.y;
                                const e_ne_z = _sroa_34.z;
                                const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                                const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                                {
                                    const _wt0 = u1_x;
                                    const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * dt));
                                    const _wt2 = u1_z;
                                    const _wt3 = u1_w;
                                    u1_x = _wt0;
                                    u1_y = _wt1;
                                    u1_z = _wt2;
                                    u1_w = _wt3;
                                }
                            }
                            if (biermann_on) {
                                let _inl_48_result;
                                _inl_48: {
                                    _inl_48_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_48;
                                }
                                const b = _b_nonideal_E[((_inl_48_result) * 4 + 0) + 3];
                                {
                                    const _wt0 = u1_x;
                                    const _wt1 = (u1_y + (b * dt));
                                    const _wt2 = u1_z;
                                    const _wt3 = u1_w;
                                    u1_x = _wt0;
                                    u1_y = _wt1;
                                    u1_z = _wt2;
                                    u1_w = _wt3;
                                }
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = u1_x;
                                const _wt1 = u1_y;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
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
                const gid_y = __gy;
                __invocation: {
                    const _inl_43_flags = _u_U_uniforms_physics_flags;
                    let _inl_43_result;
                    _inl_43: {
                        _inl_43_result = (((_inl_43_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_43;
                    }
                    const ambi_on = ((_inl_43_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_44_flags = _u_U_uniforms_physics_flags;
                    let _inl_44_result;
                    _inl_44: {
                        _inl_44_result = (((_inl_44_flags & FLAG_BIERMANN)) != 0);
                        break _inl_44;
                    }
                    const biermann_on = ((_inl_44_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!ambi_on) && (!biermann_on))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    const dt = _u_dt_buf_dt;
                    const dt_dx = (dt / _u_U_uniforms_dx);
                    if (ambi_on) {
                        if ((gid_y < n_interior)) {
                            const _sroa_35 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_35.x;
                            const e0_y = _sroa_35.y;
                            const e0_z = _sroa_35.z;
                            const _sroa_36 = load_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_36.x;
                            const e1_y = _sroa_36.y;
                            const e1_z = _sroa_36.z;
                            let _inl_45_result;
                            _inl_45: {
                                _inl_45_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_45;
                            }
                            const bxi = _inl_45_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_37 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_37.x;
                            const e0_y = _sroa_37.y;
                            const e0_z = _sroa_37.z;
                            const _sroa_38 = load_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_38.x;
                            const e1_y = _sroa_38.y;
                            const e1_z = _sroa_38.z;
                            let _inl_46_result;
                            _inl_46: {
                                _inl_46_result = ((iy * n_total) + ix);
                                break _inl_46;
                            }
                            const byi = _inl_46_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_47_result;
                        _inl_47: {
                            _inl_47_result = ((iy * n_total) + ix);
                            break _inl_47;
                        }
                        const c = _inl_47_result;
                        const _sroa_39_base = ((c) * 4 + 0);
                        let u1_x = _b_U1[_sroa_39_base + 0];
                        let u1_y = _b_U1[_sroa_39_base + 1];
                        let u1_z = _b_U1[_sroa_39_base + 2];
                        let u1_w = _b_U1[_sroa_39_base + 3];
                        if (ambi_on) {
                            const _sroa_40 = load_E(ix, iy, n_total);
                            const e_sw_x = _sroa_40.x;
                            const e_sw_y = _sroa_40.y;
                            const e_sw_z = _sroa_40.z;
                            const _sroa_41 = load_E((ix + 1), iy, n_total);
                            const e_se_x = _sroa_41.x;
                            const e_se_y = _sroa_41.y;
                            const e_se_z = _sroa_41.z;
                            const _sroa_42 = load_E(ix, (iy + 1), n_total);
                            const e_nw_x = _sroa_42.x;
                            const e_nw_y = _sroa_42.y;
                            const e_nw_z = _sroa_42.z;
                            const _sroa_43 = load_E((ix + 1), (iy + 1), n_total);
                            const e_ne_x = _sroa_43.x;
                            const e_ne_y = _sroa_43.y;
                            const e_ne_z = _sroa_43.z;
                            const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                            const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * dt));
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                        if (biermann_on) {
                            let _inl_48_result;
                            _inl_48: {
                                _inl_48_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_48;
                            }
                            const b = _b_nonideal_E[((_inl_48_result) * 4 + 0) + 3];
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + (b * dt));
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        }
    }
    entry["apply_update"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_apply_update(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["compute_emf"] = function (workgroups, domain, origin) {
            return __entry_0_compute_emf(workgroups, bindings, domain, origin);
        };
        bound["apply_update"] = function (workgroups, domain, origin) {
            return __entry_1_apply_update(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","nonideal_E"], entryInfo };
}
