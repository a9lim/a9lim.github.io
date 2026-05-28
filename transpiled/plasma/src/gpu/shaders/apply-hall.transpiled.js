// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-hall.wgsl
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: a84ccc06a09bd0c5d0cdecd0d6f9fefdb08099ae1f589e1b9fccfbfe465f262a
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":87887,"lines":1667,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":1,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-27T17:41:05.151Z
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

    function corner_jb(ix, iy, n_total) {
        const dx = bindings.U_uniforms.dx;
        let R_Jx = 0;
        let R_Jy = 0;
        let R_Jz = 0;
        let R_Bx = 0;
        let R_By = 0;
        let R_Bz = 0;
        let R_rho = 0;
        const _inl_17_iy = (iy - 1);
        let _inl_17_result;
        _inl_17: {
            _inl_17_result = ((_inl_17_iy * ((n_total + 1))) + ix);
            break _inl_17;
        }
        let _inl_18_result;
        _inl_18: {
            _inl_18_result = ((iy * ((n_total + 1))) + ix);
            break _inl_18;
        }
        R_Bx = (0.5 * ((bindings.Bx_face[_inl_17_result] + bindings.Bx_face[_inl_18_result])));
        const _inl_19_ix = (ix - 1);
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = ((iy * n_total) + _inl_19_ix);
            break _inl_19;
        }
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = ((iy * n_total) + ix);
            break _inl_20;
        }
        R_By = (0.5 * ((bindings.By_face[_inl_19_result] + bindings.By_face[_inl_20_result])));
        const _inl_21_ix = (ix - 1);
        const _inl_21_iy = (iy - 1);
        let _inl_21_result;
        _inl_21: {
            _inl_21_result = ((_inl_21_iy * n_total) + _inl_21_ix);
            break _inl_21;
        }
        const bz_sw = bindings.U1[((_inl_21_result) * 4 + 0) + 1];
        const _inl_22_iy = (iy - 1);
        let _inl_22_result;
        _inl_22: {
            _inl_22_result = ((_inl_22_iy * n_total) + ix);
            break _inl_22;
        }
        const bz_se = bindings.U1[((_inl_22_result) * 4 + 0) + 1];
        const _inl_23_ix = (ix - 1);
        let _inl_23_result;
        _inl_23: {
            _inl_23_result = ((iy * n_total) + _inl_23_ix);
            break _inl_23;
        }
        const bz_nw = bindings.U1[((_inl_23_result) * 4 + 0) + 1];
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = ((iy * n_total) + ix);
            break _inl_24;
        }
        const bz_ne = bindings.U1[((_inl_24_result) * 4 + 0) + 1];
        R_Bz = (0.25 * ((((bz_sw + bz_se) + bz_nw) + bz_ne)));
        const _inl_25_ix = (ix - 1);
        const _inl_25_iy = (iy - 1);
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((_inl_25_iy * n_total) + _inl_25_ix);
            break _inl_25;
        }
        const rho_sw = bindings.U0[((_inl_25_result) * 4 + 0) + 0];
        const _inl_26_iy = (iy - 1);
        let _inl_26_result;
        _inl_26: {
            _inl_26_result = ((_inl_26_iy * n_total) + ix);
            break _inl_26;
        }
        const rho_se = bindings.U0[((_inl_26_result) * 4 + 0) + 0];
        const _inl_27_ix = (ix - 1);
        let _inl_27_result;
        _inl_27: {
            _inl_27_result = ((iy * n_total) + _inl_27_ix);
            break _inl_27;
        }
        const rho_nw = bindings.U0[((_inl_27_result) * 4 + 0) + 0];
        let _inl_28_result;
        _inl_28: {
            _inl_28_result = ((iy * n_total) + ix);
            break _inl_28;
        }
        const rho_ne = bindings.U0[((_inl_28_result) * 4 + 0) + 0];
        R_rho = (((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : ((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))));
        const _inl_29_ix = (ix - 1);
        let _inl_29_result;
        _inl_29: {
            _inl_29_result = ((iy * n_total) + _inl_29_ix);
            break _inl_29;
        }
        const by_l = bindings.By_face[_inl_29_result];
        let _inl_30_result;
        _inl_30: {
            _inl_30_result = ((iy * n_total) + ix);
            break _inl_30;
        }
        const by_r = bindings.By_face[_inl_30_result];
        const _inl_31_iy = (iy - 1);
        let _inl_31_result;
        _inl_31: {
            _inl_31_result = ((_inl_31_iy * ((n_total + 1))) + ix);
            break _inl_31;
        }
        const bx_d = bindings.Bx_face[_inl_31_result];
        let _inl_32_result;
        _inl_32: {
            _inl_32_result = ((iy * ((n_total + 1))) + ix);
            break _inl_32;
        }
        const bx_u = bindings.Bx_face[_inl_32_result];
        R_Jz = ((((by_r - by_l)) / dx) - (((bx_u - bx_d)) / dx));
        const bz_d_avg = (0.5 * ((bz_sw + bz_se)));
        const bz_u_avg = (0.5 * ((bz_nw + bz_ne)));
        const bz_l_avg = (0.5 * ((bz_sw + bz_nw)));
        const bz_r_avg = (0.5 * ((bz_se + bz_ne)));
        R_Jx = (((bz_u_avg - bz_d_avg)) / dx);
        R_Jy = ((-((bz_r_avg - bz_l_avg))) / dx);
        return { Jx: R_Jx, Jy: R_Jy, Jz: R_Jz, Bx: R_Bx, By: R_By, Bz: R_Bz, rho: R_rho };
    }

    function hall_e_corner(ix, iy, n_total) {
        const _sroa_0 = corner_jb(ix, iy, n_total);
        const s_Jx = _sroa_0.Jx;
        const s_Jy = _sroa_0.Jy;
        const s_Jz = _sroa_0.Jz;
        const s_Bx = _sroa_0.Bx;
        const s_By = _sroa_0.By;
        const s_Bz = _sroa_0.Bz;
        const s_rho = _sroa_0.rho;
        const prefactor = (bindings.U_uniforms.hall_di / s_rho);
        const pe_frac = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.hall_electron_pressure_frac, 0.0, 1.0));
        const _inl_33_ix = (ix - 1);
        const _inl_33_iy = (iy - 1);
        let _inl_33_result;
        _inl_33: {
            let _inl_33__inl_11_result;
            _inl_33__inl_11: {
                _inl_33__inl_11_result = ((_inl_33_iy * n_total) + _inl_33_ix);
                break _inl_33__inl_11;
            }
            const _sroa_1_base = ((_inl_33__inl_11_result) * 4 + 0);
            const _inl_33_u0_x = bindings.U0[_sroa_1_base + 0];
            const _inl_33_u0_y = bindings.U0[_sroa_1_base + 1];
            const _inl_33_u0_z = bindings.U0[_sroa_1_base + 2];
            const _inl_33_u0_w = bindings.U0[_sroa_1_base + 3];
            let _inl_33__inl_12_result;
            _inl_33__inl_12: {
                _inl_33__inl_12_result = ((_inl_33_iy * n_total) + _inl_33_ix);
                break _inl_33__inl_12;
            }
            const _sroa_2_base = ((_inl_33__inl_12_result) * 4 + 0);
            const _inl_33_u1_x = bindings.U1[_sroa_2_base + 0];
            const _inl_33_u1_y = bindings.U1[_sroa_2_base + 1];
            const _inl_33_u1_z = bindings.U1[_sroa_2_base + 2];
            const _inl_33_u1_w = bindings.U1[_sroa_2_base + 3];
            const _inl_33_rho = ((_inl_33_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_33_u0_x));
            const _inl_33_ke = ((0.5 * ((((_inl_33_u0_y * _inl_33_u0_y) + (_inl_33_u0_z * _inl_33_u0_z)) + (_inl_33_u0_w * _inl_33_u0_w)))) / _inl_33_rho);
            let _inl_33__inl_13_result;
            _inl_33__inl_13: {
                _inl_33__inl_13_result = ((_inl_33_iy * ((n_total + 1))) + _inl_33_ix);
                break _inl_33__inl_13;
            }
            const _inl_33__inl_14_ix = (_inl_33_ix + 1);
            let _inl_33__inl_14_result;
            _inl_33__inl_14: {
                _inl_33__inl_14_result = ((_inl_33_iy * ((n_total + 1))) + _inl_33__inl_14_ix);
                break _inl_33__inl_14;
            }
            const _inl_33_bx_c = (0.5 * ((bindings.Bx_face[_inl_33__inl_13_result] + bindings.Bx_face[_inl_33__inl_14_result])));
            let _inl_33__inl_15_result;
            _inl_33__inl_15: {
                _inl_33__inl_15_result = ((_inl_33_iy * n_total) + _inl_33_ix);
                break _inl_33__inl_15;
            }
            const _inl_33__inl_16_iy = (_inl_33_iy + 1);
            let _inl_33__inl_16_result;
            _inl_33__inl_16: {
                _inl_33__inl_16_result = ((_inl_33__inl_16_iy * n_total) + _inl_33_ix);
                break _inl_33__inl_16;
            }
            const _inl_33_by_c = (0.5 * ((bindings.By_face[_inl_33__inl_15_result] + bindings.By_face[_inl_33__inl_16_result])));
            const _inl_33_mb = (0.5 * ((((_inl_33_bx_c * _inl_33_bx_c) + (_inl_33_by_c * _inl_33_by_c)) + (_inl_33_u1_y * _inl_33_u1_y))));
            _inl_33_result = (((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_33_u1_x - _inl_33_ke) - _inl_33_mb)))) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : ((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_33_u1_x - _inl_33_ke) - _inl_33_mb)))));
            break _inl_33;
        }
        const pe_sw = (pe_frac * _inl_33_result);
        const _inl_34_iy = (iy - 1);
        let _inl_34_result;
        _inl_34: {
            let _inl_34__inl_11_result;
            _inl_34__inl_11: {
                _inl_34__inl_11_result = ((_inl_34_iy * n_total) + ix);
                break _inl_34__inl_11;
            }
            const _sroa_3_base = ((_inl_34__inl_11_result) * 4 + 0);
            const _inl_34_u0_x = bindings.U0[_sroa_3_base + 0];
            const _inl_34_u0_y = bindings.U0[_sroa_3_base + 1];
            const _inl_34_u0_z = bindings.U0[_sroa_3_base + 2];
            const _inl_34_u0_w = bindings.U0[_sroa_3_base + 3];
            let _inl_34__inl_12_result;
            _inl_34__inl_12: {
                _inl_34__inl_12_result = ((_inl_34_iy * n_total) + ix);
                break _inl_34__inl_12;
            }
            const _sroa_4_base = ((_inl_34__inl_12_result) * 4 + 0);
            const _inl_34_u1_x = bindings.U1[_sroa_4_base + 0];
            const _inl_34_u1_y = bindings.U1[_sroa_4_base + 1];
            const _inl_34_u1_z = bindings.U1[_sroa_4_base + 2];
            const _inl_34_u1_w = bindings.U1[_sroa_4_base + 3];
            const _inl_34_rho = ((_inl_34_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_34_u0_x));
            const _inl_34_ke = ((0.5 * ((((_inl_34_u0_y * _inl_34_u0_y) + (_inl_34_u0_z * _inl_34_u0_z)) + (_inl_34_u0_w * _inl_34_u0_w)))) / _inl_34_rho);
            let _inl_34__inl_13_result;
            _inl_34__inl_13: {
                _inl_34__inl_13_result = ((_inl_34_iy * ((n_total + 1))) + ix);
                break _inl_34__inl_13;
            }
            const _inl_34__inl_14_ix = (ix + 1);
            let _inl_34__inl_14_result;
            _inl_34__inl_14: {
                _inl_34__inl_14_result = ((_inl_34_iy * ((n_total + 1))) + _inl_34__inl_14_ix);
                break _inl_34__inl_14;
            }
            const _inl_34_bx_c = (0.5 * ((bindings.Bx_face[_inl_34__inl_13_result] + bindings.Bx_face[_inl_34__inl_14_result])));
            let _inl_34__inl_15_result;
            _inl_34__inl_15: {
                _inl_34__inl_15_result = ((_inl_34_iy * n_total) + ix);
                break _inl_34__inl_15;
            }
            const _inl_34__inl_16_iy = (_inl_34_iy + 1);
            let _inl_34__inl_16_result;
            _inl_34__inl_16: {
                _inl_34__inl_16_result = ((_inl_34__inl_16_iy * n_total) + ix);
                break _inl_34__inl_16;
            }
            const _inl_34_by_c = (0.5 * ((bindings.By_face[_inl_34__inl_15_result] + bindings.By_face[_inl_34__inl_16_result])));
            const _inl_34_mb = (0.5 * ((((_inl_34_bx_c * _inl_34_bx_c) + (_inl_34_by_c * _inl_34_by_c)) + (_inl_34_u1_y * _inl_34_u1_y))));
            _inl_34_result = (((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_34_u1_x - _inl_34_ke) - _inl_34_mb)))) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : ((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_34_u1_x - _inl_34_ke) - _inl_34_mb)))));
            break _inl_34;
        }
        const pe_se = (pe_frac * _inl_34_result);
        const _inl_35_ix = (ix - 1);
        let _inl_35_result;
        _inl_35: {
            let _inl_35__inl_11_result;
            _inl_35__inl_11: {
                _inl_35__inl_11_result = ((iy * n_total) + _inl_35_ix);
                break _inl_35__inl_11;
            }
            const _sroa_5_base = ((_inl_35__inl_11_result) * 4 + 0);
            const _inl_35_u0_x = bindings.U0[_sroa_5_base + 0];
            const _inl_35_u0_y = bindings.U0[_sroa_5_base + 1];
            const _inl_35_u0_z = bindings.U0[_sroa_5_base + 2];
            const _inl_35_u0_w = bindings.U0[_sroa_5_base + 3];
            let _inl_35__inl_12_result;
            _inl_35__inl_12: {
                _inl_35__inl_12_result = ((iy * n_total) + _inl_35_ix);
                break _inl_35__inl_12;
            }
            const _sroa_6_base = ((_inl_35__inl_12_result) * 4 + 0);
            const _inl_35_u1_x = bindings.U1[_sroa_6_base + 0];
            const _inl_35_u1_y = bindings.U1[_sroa_6_base + 1];
            const _inl_35_u1_z = bindings.U1[_sroa_6_base + 2];
            const _inl_35_u1_w = bindings.U1[_sroa_6_base + 3];
            const _inl_35_rho = ((_inl_35_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_35_u0_x));
            const _inl_35_ke = ((0.5 * ((((_inl_35_u0_y * _inl_35_u0_y) + (_inl_35_u0_z * _inl_35_u0_z)) + (_inl_35_u0_w * _inl_35_u0_w)))) / _inl_35_rho);
            let _inl_35__inl_13_result;
            _inl_35__inl_13: {
                _inl_35__inl_13_result = ((iy * ((n_total + 1))) + _inl_35_ix);
                break _inl_35__inl_13;
            }
            const _inl_35__inl_14_ix = (_inl_35_ix + 1);
            let _inl_35__inl_14_result;
            _inl_35__inl_14: {
                _inl_35__inl_14_result = ((iy * ((n_total + 1))) + _inl_35__inl_14_ix);
                break _inl_35__inl_14;
            }
            const _inl_35_bx_c = (0.5 * ((bindings.Bx_face[_inl_35__inl_13_result] + bindings.Bx_face[_inl_35__inl_14_result])));
            let _inl_35__inl_15_result;
            _inl_35__inl_15: {
                _inl_35__inl_15_result = ((iy * n_total) + _inl_35_ix);
                break _inl_35__inl_15;
            }
            const _inl_35__inl_16_iy = (iy + 1);
            let _inl_35__inl_16_result;
            _inl_35__inl_16: {
                _inl_35__inl_16_result = ((_inl_35__inl_16_iy * n_total) + _inl_35_ix);
                break _inl_35__inl_16;
            }
            const _inl_35_by_c = (0.5 * ((bindings.By_face[_inl_35__inl_15_result] + bindings.By_face[_inl_35__inl_16_result])));
            const _inl_35_mb = (0.5 * ((((_inl_35_bx_c * _inl_35_bx_c) + (_inl_35_by_c * _inl_35_by_c)) + (_inl_35_u1_y * _inl_35_u1_y))));
            _inl_35_result = (((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_35_u1_x - _inl_35_ke) - _inl_35_mb)))) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : ((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_35_u1_x - _inl_35_ke) - _inl_35_mb)))));
            break _inl_35;
        }
        const pe_nw = (pe_frac * _inl_35_result);
        let _inl_36_result;
        _inl_36: {
            let _inl_36__inl_11_result;
            _inl_36__inl_11: {
                _inl_36__inl_11_result = ((iy * n_total) + ix);
                break _inl_36__inl_11;
            }
            const _sroa_7_base = ((_inl_36__inl_11_result) * 4 + 0);
            const _inl_36_u0_x = bindings.U0[_sroa_7_base + 0];
            const _inl_36_u0_y = bindings.U0[_sroa_7_base + 1];
            const _inl_36_u0_z = bindings.U0[_sroa_7_base + 2];
            const _inl_36_u0_w = bindings.U0[_sroa_7_base + 3];
            let _inl_36__inl_12_result;
            _inl_36__inl_12: {
                _inl_36__inl_12_result = ((iy * n_total) + ix);
                break _inl_36__inl_12;
            }
            const _sroa_8_base = ((_inl_36__inl_12_result) * 4 + 0);
            const _inl_36_u1_x = bindings.U1[_sroa_8_base + 0];
            const _inl_36_u1_y = bindings.U1[_sroa_8_base + 1];
            const _inl_36_u1_z = bindings.U1[_sroa_8_base + 2];
            const _inl_36_u1_w = bindings.U1[_sroa_8_base + 3];
            const _inl_36_rho = ((_inl_36_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_36_u0_x));
            const _inl_36_ke = ((0.5 * ((((_inl_36_u0_y * _inl_36_u0_y) + (_inl_36_u0_z * _inl_36_u0_z)) + (_inl_36_u0_w * _inl_36_u0_w)))) / _inl_36_rho);
            let _inl_36__inl_13_result;
            _inl_36__inl_13: {
                _inl_36__inl_13_result = ((iy * ((n_total + 1))) + ix);
                break _inl_36__inl_13;
            }
            const _inl_36__inl_14_ix = (ix + 1);
            let _inl_36__inl_14_result;
            _inl_36__inl_14: {
                _inl_36__inl_14_result = ((iy * ((n_total + 1))) + _inl_36__inl_14_ix);
                break _inl_36__inl_14;
            }
            const _inl_36_bx_c = (0.5 * ((bindings.Bx_face[_inl_36__inl_13_result] + bindings.Bx_face[_inl_36__inl_14_result])));
            let _inl_36__inl_15_result;
            _inl_36__inl_15: {
                _inl_36__inl_15_result = ((iy * n_total) + ix);
                break _inl_36__inl_15;
            }
            const _inl_36__inl_16_iy = (iy + 1);
            let _inl_36__inl_16_result;
            _inl_36__inl_16: {
                _inl_36__inl_16_result = ((_inl_36__inl_16_iy * n_total) + ix);
                break _inl_36__inl_16;
            }
            const _inl_36_by_c = (0.5 * ((bindings.By_face[_inl_36__inl_15_result] + bindings.By_face[_inl_36__inl_16_result])));
            const _inl_36_mb = (0.5 * ((((_inl_36_bx_c * _inl_36_bx_c) + (_inl_36_by_c * _inl_36_by_c)) + (_inl_36_u1_y * _inl_36_u1_y))));
            _inl_36_result = (((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_36_u1_x - _inl_36_ke) - _inl_36_mb)))) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : ((((bindings.U_uniforms.gamma - 1.0)) * (((_inl_36_u1_x - _inl_36_ke) - _inl_36_mb)))));
            break _inl_36;
        }
        const pe_ne = (pe_frac * _inl_36_result);
        const grad_pe_x = ((0.5 * ((((pe_se + pe_ne)) - ((pe_sw + pe_nw))))) / bindings.U_uniforms.dx);
        const grad_pe_y = ((0.5 * ((((pe_nw + pe_ne)) - ((pe_sw + pe_se))))) / bindings.U_uniforms.dx);
        return {x:(prefactor * (((((s_Jy * s_Bz) - (s_Jz * s_By))) - grad_pe_x))), y:(prefactor * (((((s_Jz * s_Bx) - (s_Jx * s_Bz))) - grad_pe_y))), z:(prefactor * (((s_Jx * s_By) - (s_Jy * s_Bx))))};
    }

    function load_E(ix, iy, n_total) {
        let _inl_37_result;
        _inl_37: {
            _inl_37_result = ((iy * ((n_total + 1))) + ix);
            break _inl_37;
        }
        const _sroa_9_base = ((_inl_37_result) * 4 + 0);
        const e_x = bindings.hall_E[_sroa_9_base + 0];
        const e_y = bindings.hall_E[_sroa_9_base + 1];
        const e_z = bindings.hall_E[_sroa_9_base + 2];
        const e_w = bindings.hall_E[_sroa_9_base + 3];
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
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_U1 = bindings.U1;
        const _b_hall_E = bindings.hall_E;
        const _b_hall_mb0 = bindings.hall_mb0;
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
                    const _inl_38_flags = _u_U_uniforms_physics_flags;
                    let _inl_38_result;
                    _inl_38: {
                        _inl_38_result = (((_inl_38_flags & FLAG_HALL)) != 0);
                        break _inl_38;
                    }
                    if ((!_inl_38_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                    const _sroa_10 = hall_e_corner(ix, iy, n_total);
                    const e_x = _sroa_10.x;
                    const e_y = _sroa_10.y;
                    const e_z = _sroa_10.z;
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_x;
                        const _wt1 = e_y;
                        const _wt2 = e_z;
                        const _wt3 = 0.0;
                        _b_hall_E[_wbase + 0] = _wt0;
                        _b_hall_E[_wbase + 1] = _wt1;
                        _b_hall_E[_wbase + 2] = _wt2;
                        _b_hall_E[_wbase + 3] = _wt3;
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_39_result;
                        _inl_39: {
                            _inl_39_result = ((iy * n_total) + ix);
                            break _inl_39;
                        }
                        const c = _inl_39_result;
                        let _inl_40_result;
                        _inl_40: {
                            let _inl_40__inl_6_result;
                            _inl_40__inl_6: {
                                _inl_40__inl_6_result = ((iy * n_total) + ix);
                                break _inl_40__inl_6;
                            }
                            const _sroa_11_base = ((_inl_40__inl_6_result) * 4 + 0);
                            const _inl_40_u1_x = _b_U1[_sroa_11_base + 0];
                            const _inl_40_u1_y = _b_U1[_sroa_11_base + 1];
                            const _inl_40_u1_z = _b_U1[_sroa_11_base + 2];
                            const _inl_40_u1_w = _b_U1[_sroa_11_base + 3];
                            let _inl_40__inl_7_result;
                            _inl_40__inl_7: {
                                _inl_40__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_40__inl_7;
                            }
                            const _inl_40__inl_8_ix = (ix + 1);
                            let _inl_40__inl_8_result;
                            _inl_40__inl_8: {
                                _inl_40__inl_8_result = ((iy * ((n_total + 1))) + _inl_40__inl_8_ix);
                                break _inl_40__inl_8;
                            }
                            const _inl_40_bx_c = (0.5 * ((_b_Bx_face[_inl_40__inl_7_result] + _b_Bx_face[_inl_40__inl_8_result])));
                            let _inl_40__inl_9_result;
                            _inl_40__inl_9: {
                                _inl_40__inl_9_result = ((iy * n_total) + ix);
                                break _inl_40__inl_9;
                            }
                            const _inl_40__inl_10_iy = (iy + 1);
                            let _inl_40__inl_10_result;
                            _inl_40__inl_10: {
                                _inl_40__inl_10_result = ((_inl_40__inl_10_iy * n_total) + ix);
                                break _inl_40__inl_10;
                            }
                            const _inl_40_by_c = (0.5 * ((_b_By_face[_inl_40__inl_9_result] + _b_By_face[_inl_40__inl_10_result])));
                            _inl_40_result = (0.5 * ((((_inl_40_bx_c * _inl_40_bx_c) + (_inl_40_by_c * _inl_40_by_c)) + (_inl_40_u1_y * _inl_40_u1_y))));
                            break _inl_40;
                        }
                        _b_hall_mb0[c] = _inl_40_result;
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
                            const _inl_38_flags = _u_U_uniforms_physics_flags;
                            let _inl_38_result;
                            _inl_38: {
                                _inl_38_result = (((_inl_38_flags & FLAG_HALL)) != 0);
                                break _inl_38;
                            }
                            if ((!_inl_38_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                            const _sroa_12 = hall_e_corner(ix, iy, n_total);
                            const e_x = _sroa_12.x;
                            const e_y = _sroa_12.y;
                            const e_z = _sroa_12.z;
                            {
                                const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                                const _wt0 = e_x;
                                const _wt1 = e_y;
                                const _wt2 = e_z;
                                const _wt3 = 0.0;
                                _b_hall_E[_wbase + 0] = _wt0;
                                _b_hall_E[_wbase + 1] = _wt1;
                                _b_hall_E[_wbase + 2] = _wt2;
                                _b_hall_E[_wbase + 3] = _wt3;
                            }
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                let _inl_39_result;
                                _inl_39: {
                                    _inl_39_result = ((iy * n_total) + ix);
                                    break _inl_39;
                                }
                                const c = _inl_39_result;
                                let _inl_40_result;
                                _inl_40: {
                                    let _inl_40__inl_6_result;
                                    _inl_40__inl_6: {
                                        _inl_40__inl_6_result = ((iy * n_total) + ix);
                                        break _inl_40__inl_6;
                                    }
                                    const _sroa_13_base = ((_inl_40__inl_6_result) * 4 + 0);
                                    const _inl_40_u1_x = _b_U1[_sroa_13_base + 0];
                                    const _inl_40_u1_y = _b_U1[_sroa_13_base + 1];
                                    const _inl_40_u1_z = _b_U1[_sroa_13_base + 2];
                                    const _inl_40_u1_w = _b_U1[_sroa_13_base + 3];
                                    let _inl_40__inl_7_result;
                                    _inl_40__inl_7: {
                                        _inl_40__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_40__inl_7;
                                    }
                                    const _inl_40__inl_8_ix = (ix + 1);
                                    let _inl_40__inl_8_result;
                                    _inl_40__inl_8: {
                                        _inl_40__inl_8_result = ((iy * ((n_total + 1))) + _inl_40__inl_8_ix);
                                        break _inl_40__inl_8;
                                    }
                                    const _inl_40_bx_c = (0.5 * ((_b_Bx_face[_inl_40__inl_7_result] + _b_Bx_face[_inl_40__inl_8_result])));
                                    let _inl_40__inl_9_result;
                                    _inl_40__inl_9: {
                                        _inl_40__inl_9_result = ((iy * n_total) + ix);
                                        break _inl_40__inl_9;
                                    }
                                    const _inl_40__inl_10_iy = (iy + 1);
                                    let _inl_40__inl_10_result;
                                    _inl_40__inl_10: {
                                        _inl_40__inl_10_result = ((_inl_40__inl_10_iy * n_total) + ix);
                                        break _inl_40__inl_10;
                                    }
                                    const _inl_40_by_c = (0.5 * ((_b_By_face[_inl_40__inl_9_result] + _b_By_face[_inl_40__inl_10_result])));
                                    _inl_40_result = (0.5 * ((((_inl_40_bx_c * _inl_40_bx_c) + (_inl_40_by_c * _inl_40_by_c)) + (_inl_40_u1_y * _inl_40_u1_y))));
                                    break _inl_40;
                                }
                                _b_hall_mb0[c] = _inl_40_result;
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
                        const _inl_38_flags = _u_U_uniforms_physics_flags;
                        let _inl_38_result;
                        _inl_38: {
                            _inl_38_result = (((_inl_38_flags & FLAG_HALL)) != 0);
                            break _inl_38;
                        }
                        if ((!_inl_38_result)) {
                            break __invocation;
                        }
                        if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                        const _sroa_14 = hall_e_corner(ix, iy, n_total);
                        const e_x = _sroa_14.x;
                        const e_y = _sroa_14.y;
                        const e_z = _sroa_14.z;
                        {
                            const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                            const _wt0 = e_x;
                            const _wt1 = e_y;
                            const _wt2 = e_z;
                            const _wt3 = 0.0;
                            _b_hall_E[_wbase + 0] = _wt0;
                            _b_hall_E[_wbase + 1] = _wt1;
                            _b_hall_E[_wbase + 2] = _wt2;
                            _b_hall_E[_wbase + 3] = _wt3;
                        }
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
                            let _inl_39_result;
                            _inl_39: {
                                _inl_39_result = ((iy * n_total) + ix);
                                break _inl_39;
                            }
                            const c = _inl_39_result;
                            let _inl_40_result;
                            _inl_40: {
                                let _inl_40__inl_6_result;
                                _inl_40__inl_6: {
                                    _inl_40__inl_6_result = ((iy * n_total) + ix);
                                    break _inl_40__inl_6;
                                }
                                const _sroa_15_base = ((_inl_40__inl_6_result) * 4 + 0);
                                const _inl_40_u1_x = _b_U1[_sroa_15_base + 0];
                                const _inl_40_u1_y = _b_U1[_sroa_15_base + 1];
                                const _inl_40_u1_z = _b_U1[_sroa_15_base + 2];
                                const _inl_40_u1_w = _b_U1[_sroa_15_base + 3];
                                let _inl_40__inl_7_result;
                                _inl_40__inl_7: {
                                    _inl_40__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_40__inl_7;
                                }
                                const _inl_40__inl_8_ix = (ix + 1);
                                let _inl_40__inl_8_result;
                                _inl_40__inl_8: {
                                    _inl_40__inl_8_result = ((iy * ((n_total + 1))) + _inl_40__inl_8_ix);
                                    break _inl_40__inl_8;
                                }
                                const _inl_40_bx_c = (0.5 * ((_b_Bx_face[_inl_40__inl_7_result] + _b_Bx_face[_inl_40__inl_8_result])));
                                let _inl_40__inl_9_result;
                                _inl_40__inl_9: {
                                    _inl_40__inl_9_result = ((iy * n_total) + ix);
                                    break _inl_40__inl_9;
                                }
                                const _inl_40__inl_10_iy = (iy + 1);
                                let _inl_40__inl_10_result;
                                _inl_40__inl_10: {
                                    _inl_40__inl_10_result = ((_inl_40__inl_10_iy * n_total) + ix);
                                    break _inl_40__inl_10;
                                }
                                const _inl_40_by_c = (0.5 * ((_b_By_face[_inl_40__inl_9_result] + _b_By_face[_inl_40__inl_10_result])));
                                _inl_40_result = (0.5 * ((((_inl_40_bx_c * _inl_40_bx_c) + (_inl_40_by_c * _inl_40_by_c)) + (_inl_40_u1_y * _inl_40_u1_y))));
                                break _inl_40;
                            }
                            _b_hall_mb0[c] = _inl_40_result;
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
                    const _inl_38_flags = _u_U_uniforms_physics_flags;
                    let _inl_38_result;
                    _inl_38: {
                        _inl_38_result = (((_inl_38_flags & FLAG_HALL)) != 0);
                        break _inl_38;
                    }
                    if ((!_inl_38_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                    const _sroa_16 = hall_e_corner(ix, iy, n_total);
                    const e_x = _sroa_16.x;
                    const e_y = _sroa_16.y;
                    const e_z = _sroa_16.z;
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_x;
                        const _wt1 = e_y;
                        const _wt2 = e_z;
                        const _wt3 = 0.0;
                        _b_hall_E[_wbase + 0] = _wt0;
                        _b_hall_E[_wbase + 1] = _wt1;
                        _b_hall_E[_wbase + 2] = _wt2;
                        _b_hall_E[_wbase + 3] = _wt3;
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_39_result;
                        _inl_39: {
                            _inl_39_result = ((iy * n_total) + ix);
                            break _inl_39;
                        }
                        const c = _inl_39_result;
                        let _inl_40_result;
                        _inl_40: {
                            let _inl_40__inl_6_result;
                            _inl_40__inl_6: {
                                _inl_40__inl_6_result = ((iy * n_total) + ix);
                                break _inl_40__inl_6;
                            }
                            const _sroa_17_base = ((_inl_40__inl_6_result) * 4 + 0);
                            const _inl_40_u1_x = _b_U1[_sroa_17_base + 0];
                            const _inl_40_u1_y = _b_U1[_sroa_17_base + 1];
                            const _inl_40_u1_z = _b_U1[_sroa_17_base + 2];
                            const _inl_40_u1_w = _b_U1[_sroa_17_base + 3];
                            let _inl_40__inl_7_result;
                            _inl_40__inl_7: {
                                _inl_40__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_40__inl_7;
                            }
                            const _inl_40__inl_8_ix = (ix + 1);
                            let _inl_40__inl_8_result;
                            _inl_40__inl_8: {
                                _inl_40__inl_8_result = ((iy * ((n_total + 1))) + _inl_40__inl_8_ix);
                                break _inl_40__inl_8;
                            }
                            const _inl_40_bx_c = (0.5 * ((_b_Bx_face[_inl_40__inl_7_result] + _b_Bx_face[_inl_40__inl_8_result])));
                            let _inl_40__inl_9_result;
                            _inl_40__inl_9: {
                                _inl_40__inl_9_result = ((iy * n_total) + ix);
                                break _inl_40__inl_9;
                            }
                            const _inl_40__inl_10_iy = (iy + 1);
                            let _inl_40__inl_10_result;
                            _inl_40__inl_10: {
                                _inl_40__inl_10_result = ((_inl_40__inl_10_iy * n_total) + ix);
                                break _inl_40__inl_10;
                            }
                            const _inl_40_by_c = (0.5 * ((_b_By_face[_inl_40__inl_9_result] + _b_By_face[_inl_40__inl_10_result])));
                            _inl_40_result = (0.5 * ((((_inl_40_bx_c * _inl_40_bx_c) + (_inl_40_by_c * _inl_40_by_c)) + (_inl_40_u1_y * _inl_40_u1_y))));
                            break _inl_40;
                        }
                        _b_hall_mb0[c] = _inl_40_result;
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
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_U1 = bindings.U1;
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
                    const _inl_41_flags = _u_U_uniforms_physics_flags;
                    let _inl_41_result;
                    _inl_41: {
                        _inl_41_result = (((_inl_41_flags & FLAG_HALL)) != 0);
                        break _inl_41;
                    }
                    if ((!_inl_41_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                    const dt_dx = (_u_dt_buf_dt / _u_U_uniforms_dx);
                    if ((gid_y < n_interior)) {
                        const _sroa_18 = load_E(ix, iy, n_total);
                        const e0_x = _sroa_18.x;
                        const e0_y = _sroa_18.y;
                        const e0_z = _sroa_18.z;
                        const _sroa_19 = load_E(ix, (iy + 1), n_total);
                        const e1_x = _sroa_19.x;
                        const e1_y = _sroa_19.y;
                        const e1_z = _sroa_19.z;
                        let _inl_42_result;
                        _inl_42: {
                            _inl_42_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_42;
                        }
                        const bxi = _inl_42_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                    }
                    if ((gid_x < n_interior)) {
                        const _sroa_20 = load_E(ix, iy, n_total);
                        const e0_x = _sroa_20.x;
                        const e0_y = _sroa_20.y;
                        const e0_z = _sroa_20.z;
                        const _sroa_21 = load_E((ix + 1), iy, n_total);
                        const e1_x = _sroa_21.x;
                        const e1_y = _sroa_21.y;
                        const e1_z = _sroa_21.z;
                        let _inl_43_result;
                        _inl_43: {
                            _inl_43_result = ((iy * n_total) + ix);
                            break _inl_43;
                        }
                        const byi = _inl_43_result;
                        _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
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
                        let _inl_44_result;
                        _inl_44: {
                            _inl_44_result = ((iy * n_total) + ix);
                            break _inl_44;
                        }
                        const c = _inl_44_result;
                        const _sroa_26_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_26_base + 0];
                        const u1_y = _b_U1[_sroa_26_base + 1];
                        const u1_z = _b_U1[_sroa_26_base + 2];
                        const u1_w = _b_U1[_sroa_26_base + 3];
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * _u_dt_buf_dt));
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
                            const _inl_41_flags = _u_U_uniforms_physics_flags;
                            let _inl_41_result;
                            _inl_41: {
                                _inl_41_result = (((_inl_41_flags & FLAG_HALL)) != 0);
                                break _inl_41;
                            }
                            if ((!_inl_41_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                            const dt_dx = (_u_dt_buf_dt / _u_U_uniforms_dx);
                            if ((gid_y < n_interior)) {
                                const _sroa_27 = load_E(ix, iy, n_total);
                                const e0_x = _sroa_27.x;
                                const e0_y = _sroa_27.y;
                                const e0_z = _sroa_27.z;
                                const _sroa_28 = load_E(ix, (iy + 1), n_total);
                                const e1_x = _sroa_28.x;
                                const e1_y = _sroa_28.y;
                                const e1_z = _sroa_28.z;
                                let _inl_42_result;
                                _inl_42: {
                                    _inl_42_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_42;
                                }
                                const bxi = _inl_42_result;
                                _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                            }
                            if ((gid_x < n_interior)) {
                                const _sroa_29 = load_E(ix, iy, n_total);
                                const e0_x = _sroa_29.x;
                                const e0_y = _sroa_29.y;
                                const e0_z = _sroa_29.z;
                                const _sroa_30 = load_E((ix + 1), iy, n_total);
                                const e1_x = _sroa_30.x;
                                const e1_y = _sroa_30.y;
                                const e1_z = _sroa_30.z;
                                let _inl_43_result;
                                _inl_43: {
                                    _inl_43_result = ((iy * n_total) + ix);
                                    break _inl_43;
                                }
                                const byi = _inl_43_result;
                                _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                            }
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
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
                                let _inl_44_result;
                                _inl_44: {
                                    _inl_44_result = ((iy * n_total) + ix);
                                    break _inl_44;
                                }
                                const c = _inl_44_result;
                                const _sroa_35_base = ((c) * 4 + 0);
                                const u1_x = _b_U1[_sroa_35_base + 0];
                                const u1_y = _b_U1[_sroa_35_base + 1];
                                const u1_z = _b_U1[_sroa_35_base + 2];
                                const u1_w = _b_U1[_sroa_35_base + 3];
                                {
                                    const _wbase = ((c) * 4 + 0);
                                    const _wt0 = u1_x;
                                    const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * _u_dt_buf_dt));
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
                        const _inl_41_flags = _u_U_uniforms_physics_flags;
                        let _inl_41_result;
                        _inl_41: {
                            _inl_41_result = (((_inl_41_flags & FLAG_HALL)) != 0);
                            break _inl_41;
                        }
                        if ((!_inl_41_result)) {
                            break __invocation;
                        }
                        if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                        const dt_dx = (_u_dt_buf_dt / _u_U_uniforms_dx);
                        if ((gid_y < n_interior)) {
                            const _sroa_36 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_36.x;
                            const e0_y = _sroa_36.y;
                            const e0_z = _sroa_36.z;
                            const _sroa_37 = load_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_37.x;
                            const e1_y = _sroa_37.y;
                            const e1_z = _sroa_37.z;
                            let _inl_42_result;
                            _inl_42: {
                                _inl_42_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_42;
                            }
                            const bxi = _inl_42_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_38 = load_E(ix, iy, n_total);
                            const e0_x = _sroa_38.x;
                            const e0_y = _sroa_38.y;
                            const e0_z = _sroa_38.z;
                            const _sroa_39 = load_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_39.x;
                            const e1_y = _sroa_39.y;
                            const e1_z = _sroa_39.z;
                            let _inl_43_result;
                            _inl_43: {
                                _inl_43_result = ((iy * n_total) + ix);
                                break _inl_43;
                            }
                            const byi = _inl_43_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
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
                            let _inl_44_result;
                            _inl_44: {
                                _inl_44_result = ((iy * n_total) + ix);
                                break _inl_44;
                            }
                            const c = _inl_44_result;
                            const _sroa_44_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_44_base + 0];
                            const u1_y = _b_U1[_sroa_44_base + 1];
                            const u1_z = _b_U1[_sroa_44_base + 2];
                            const u1_w = _b_U1[_sroa_44_base + 3];
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * _u_dt_buf_dt));
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
                    const _inl_41_flags = _u_U_uniforms_physics_flags;
                    let _inl_41_result;
                    _inl_41: {
                        _inl_41_result = (((_inl_41_flags & FLAG_HALL)) != 0);
                        break _inl_41;
                    }
                    if ((!_inl_41_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
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
                    const dt_dx = (_u_dt_buf_dt / _u_U_uniforms_dx);
                    if ((gid_y < n_interior)) {
                        const _sroa_45 = load_E(ix, iy, n_total);
                        const e0_x = _sroa_45.x;
                        const e0_y = _sroa_45.y;
                        const e0_z = _sroa_45.z;
                        const _sroa_46 = load_E(ix, (iy + 1), n_total);
                        const e1_x = _sroa_46.x;
                        const e1_y = _sroa_46.y;
                        const e1_z = _sroa_46.z;
                        let _inl_42_result;
                        _inl_42: {
                            _inl_42_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_42;
                        }
                        const bxi = _inl_42_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                    }
                    if ((gid_x < n_interior)) {
                        const _sroa_47 = load_E(ix, iy, n_total);
                        const e0_x = _sroa_47.x;
                        const e0_y = _sroa_47.y;
                        const e0_z = _sroa_47.z;
                        const _sroa_48 = load_E((ix + 1), iy, n_total);
                        const e1_x = _sroa_48.x;
                        const e1_y = _sroa_48.y;
                        const e1_z = _sroa_48.z;
                        let _inl_43_result;
                        _inl_43: {
                            _inl_43_result = ((iy * n_total) + ix);
                            break _inl_43;
                        }
                        const byi = _inl_43_result;
                        _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        const _sroa_49 = load_E(ix, iy, n_total);
                        const e_sw_x = _sroa_49.x;
                        const e_sw_y = _sroa_49.y;
                        const e_sw_z = _sroa_49.z;
                        const _sroa_50 = load_E((ix + 1), iy, n_total);
                        const e_se_x = _sroa_50.x;
                        const e_se_y = _sroa_50.y;
                        const e_se_z = _sroa_50.z;
                        const _sroa_51 = load_E(ix, (iy + 1), n_total);
                        const e_nw_x = _sroa_51.x;
                        const e_nw_y = _sroa_51.y;
                        const e_nw_z = _sroa_51.z;
                        const _sroa_52 = load_E((ix + 1), (iy + 1), n_total);
                        const e_ne_x = _sroa_52.x;
                        const e_ne_y = _sroa_52.y;
                        const e_ne_z = _sroa_52.z;
                        const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                        const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                        let _inl_44_result;
                        _inl_44: {
                            _inl_44_result = ((iy * n_total) + ix);
                            break _inl_44;
                        }
                        const c = _inl_44_result;
                        const _sroa_53_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_53_base + 0];
                        const u1_y = _b_U1[_sroa_53_base + 1];
                        const u1_z = _b_U1[_sroa_53_base + 2];
                        const u1_w = _b_U1[_sroa_53_base + 3];
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = (u1_y + ((((-dEy_dx) + dEx_dy)) * _u_dt_buf_dt));
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

    entryInfo["repair_energy"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_repair_energy(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_U1 = bindings.U1;
        const _b_hall_mb0 = bindings.hall_mb0;
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
                    const _inl_45_flags = _u_U_uniforms_physics_flags;
                    let _inl_45_result;
                    _inl_45: {
                        _inl_45_result = (((_inl_45_flags & FLAG_HALL)) != 0);
                        break _inl_45;
                    }
                    if ((!_inl_45_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    let _inl_46_result;
                    _inl_46: {
                        _inl_46_result = ((iy * n_total) + ix);
                        break _inl_46;
                    }
                    const c = _inl_46_result;
                    const _sroa_54_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_54_base + 0];
                    const u1_y = _b_U1[_sroa_54_base + 1];
                    const u1_z = _b_U1[_sroa_54_base + 2];
                    const u1_w = _b_U1[_sroa_54_base + 3];
                    let _inl_47_result;
                    _inl_47: {
                        let _inl_47__inl_6_result;
                        _inl_47__inl_6: {
                            _inl_47__inl_6_result = ((iy * n_total) + ix);
                            break _inl_47__inl_6;
                        }
                        const _sroa_55_base = ((_inl_47__inl_6_result) * 4 + 0);
                        const _inl_47_u1_x = _b_U1[_sroa_55_base + 0];
                        const _inl_47_u1_y = _b_U1[_sroa_55_base + 1];
                        const _inl_47_u1_z = _b_U1[_sroa_55_base + 2];
                        const _inl_47_u1_w = _b_U1[_sroa_55_base + 3];
                        let _inl_47__inl_7_result;
                        _inl_47__inl_7: {
                            _inl_47__inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_47__inl_7;
                        }
                        const _inl_47__inl_8_ix = (ix + 1);
                        let _inl_47__inl_8_result;
                        _inl_47__inl_8: {
                            _inl_47__inl_8_result = ((iy * ((n_total + 1))) + _inl_47__inl_8_ix);
                            break _inl_47__inl_8;
                        }
                        const _inl_47_bx_c = (0.5 * ((_b_Bx_face[_inl_47__inl_7_result] + _b_Bx_face[_inl_47__inl_8_result])));
                        let _inl_47__inl_9_result;
                        _inl_47__inl_9: {
                            _inl_47__inl_9_result = ((iy * n_total) + ix);
                            break _inl_47__inl_9;
                        }
                        const _inl_47__inl_10_iy = (iy + 1);
                        let _inl_47__inl_10_result;
                        _inl_47__inl_10: {
                            _inl_47__inl_10_result = ((_inl_47__inl_10_iy * n_total) + ix);
                            break _inl_47__inl_10;
                        }
                        const _inl_47_by_c = (0.5 * ((_b_By_face[_inl_47__inl_9_result] + _b_By_face[_inl_47__inl_10_result])));
                        _inl_47_result = (0.5 * ((((_inl_47_bx_c * _inl_47_bx_c) + (_inl_47_by_c * _inl_47_by_c)) + (_inl_47_u1_y * _inl_47_u1_y))));
                        break _inl_47;
                    }
                    const dmb = (_inl_47_result - _b_hall_mb0[c]);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = (u1_x + dmb);
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
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const _inl_45_flags = _u_U_uniforms_physics_flags;
                            let _inl_45_result;
                            _inl_45: {
                                _inl_45_result = (((_inl_45_flags & FLAG_HALL)) != 0);
                                break _inl_45;
                            }
                            if ((!_inl_45_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_hall_di <= 0.0)) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                                break __invocation;
                            }
                            const ix = (ghost + gid_x);
                            const iy = (ghost + gid_y);
                            let _inl_46_result;
                            _inl_46: {
                                _inl_46_result = ((iy * n_total) + ix);
                                break _inl_46;
                            }
                            const c = _inl_46_result;
                            const _sroa_56_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_56_base + 0];
                            const u1_y = _b_U1[_sroa_56_base + 1];
                            const u1_z = _b_U1[_sroa_56_base + 2];
                            const u1_w = _b_U1[_sroa_56_base + 3];
                            let _inl_47_result;
                            _inl_47: {
                                let _inl_47__inl_6_result;
                                _inl_47__inl_6: {
                                    _inl_47__inl_6_result = ((iy * n_total) + ix);
                                    break _inl_47__inl_6;
                                }
                                const _sroa_57_base = ((_inl_47__inl_6_result) * 4 + 0);
                                const _inl_47_u1_x = _b_U1[_sroa_57_base + 0];
                                const _inl_47_u1_y = _b_U1[_sroa_57_base + 1];
                                const _inl_47_u1_z = _b_U1[_sroa_57_base + 2];
                                const _inl_47_u1_w = _b_U1[_sroa_57_base + 3];
                                let _inl_47__inl_7_result;
                                _inl_47__inl_7: {
                                    _inl_47__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_47__inl_7;
                                }
                                const _inl_47__inl_8_ix = (ix + 1);
                                let _inl_47__inl_8_result;
                                _inl_47__inl_8: {
                                    _inl_47__inl_8_result = ((iy * ((n_total + 1))) + _inl_47__inl_8_ix);
                                    break _inl_47__inl_8;
                                }
                                const _inl_47_bx_c = (0.5 * ((_b_Bx_face[_inl_47__inl_7_result] + _b_Bx_face[_inl_47__inl_8_result])));
                                let _inl_47__inl_9_result;
                                _inl_47__inl_9: {
                                    _inl_47__inl_9_result = ((iy * n_total) + ix);
                                    break _inl_47__inl_9;
                                }
                                const _inl_47__inl_10_iy = (iy + 1);
                                let _inl_47__inl_10_result;
                                _inl_47__inl_10: {
                                    _inl_47__inl_10_result = ((_inl_47__inl_10_iy * n_total) + ix);
                                    break _inl_47__inl_10;
                                }
                                const _inl_47_by_c = (0.5 * ((_b_By_face[_inl_47__inl_9_result] + _b_By_face[_inl_47__inl_10_result])));
                                _inl_47_result = (0.5 * ((((_inl_47_bx_c * _inl_47_bx_c) + (_inl_47_by_c * _inl_47_by_c)) + (_inl_47_u1_y * _inl_47_u1_y))));
                                break _inl_47;
                            }
                            const dmb = (_inl_47_result - _b_hall_mb0[c]);
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = (u1_x + dmb);
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
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const _inl_45_flags = _u_U_uniforms_physics_flags;
                        let _inl_45_result;
                        _inl_45: {
                            _inl_45_result = (((_inl_45_flags & FLAG_HALL)) != 0);
                            break _inl_45;
                        }
                        if ((!_inl_45_result)) {
                            break __invocation;
                        }
                        if ((_u_U_uniforms_hall_di <= 0.0)) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                            break __invocation;
                        }
                        const ix = (ghost + gid_x);
                        const iy = (ghost + gid_y);
                        let _inl_46_result;
                        _inl_46: {
                            _inl_46_result = ((iy * n_total) + ix);
                            break _inl_46;
                        }
                        const c = _inl_46_result;
                        const _sroa_58_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_58_base + 0];
                        const u1_y = _b_U1[_sroa_58_base + 1];
                        const u1_z = _b_U1[_sroa_58_base + 2];
                        const u1_w = _b_U1[_sroa_58_base + 3];
                        let _inl_47_result;
                        _inl_47: {
                            let _inl_47__inl_6_result;
                            _inl_47__inl_6: {
                                _inl_47__inl_6_result = ((iy * n_total) + ix);
                                break _inl_47__inl_6;
                            }
                            const _sroa_59_base = ((_inl_47__inl_6_result) * 4 + 0);
                            const _inl_47_u1_x = _b_U1[_sroa_59_base + 0];
                            const _inl_47_u1_y = _b_U1[_sroa_59_base + 1];
                            const _inl_47_u1_z = _b_U1[_sroa_59_base + 2];
                            const _inl_47_u1_w = _b_U1[_sroa_59_base + 3];
                            let _inl_47__inl_7_result;
                            _inl_47__inl_7: {
                                _inl_47__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_47__inl_7;
                            }
                            const _inl_47__inl_8_ix = (ix + 1);
                            let _inl_47__inl_8_result;
                            _inl_47__inl_8: {
                                _inl_47__inl_8_result = ((iy * ((n_total + 1))) + _inl_47__inl_8_ix);
                                break _inl_47__inl_8;
                            }
                            const _inl_47_bx_c = (0.5 * ((_b_Bx_face[_inl_47__inl_7_result] + _b_Bx_face[_inl_47__inl_8_result])));
                            let _inl_47__inl_9_result;
                            _inl_47__inl_9: {
                                _inl_47__inl_9_result = ((iy * n_total) + ix);
                                break _inl_47__inl_9;
                            }
                            const _inl_47__inl_10_iy = (iy + 1);
                            let _inl_47__inl_10_result;
                            _inl_47__inl_10: {
                                _inl_47__inl_10_result = ((_inl_47__inl_10_iy * n_total) + ix);
                                break _inl_47__inl_10;
                            }
                            const _inl_47_by_c = (0.5 * ((_b_By_face[_inl_47__inl_9_result] + _b_By_face[_inl_47__inl_10_result])));
                            _inl_47_result = (0.5 * ((((_inl_47_bx_c * _inl_47_bx_c) + (_inl_47_by_c * _inl_47_by_c)) + (_inl_47_u1_y * _inl_47_u1_y))));
                            break _inl_47;
                        }
                        const dmb = (_inl_47_result - _b_hall_mb0[c]);
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = (u1_x + dmb);
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
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const _inl_45_flags = _u_U_uniforms_physics_flags;
                    let _inl_45_result;
                    _inl_45: {
                        _inl_45_result = (((_inl_45_flags & FLAG_HALL)) != 0);
                        break _inl_45;
                    }
                    if ((!_inl_45_result)) {
                        break __invocation;
                    }
                    if ((_u_U_uniforms_hall_di <= 0.0)) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    let _inl_46_result;
                    _inl_46: {
                        _inl_46_result = ((iy * n_total) + ix);
                        break _inl_46;
                    }
                    const c = _inl_46_result;
                    const _sroa_60_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_60_base + 0];
                    const u1_y = _b_U1[_sroa_60_base + 1];
                    const u1_z = _b_U1[_sroa_60_base + 2];
                    const u1_w = _b_U1[_sroa_60_base + 3];
                    let _inl_47_result;
                    _inl_47: {
                        let _inl_47__inl_6_result;
                        _inl_47__inl_6: {
                            _inl_47__inl_6_result = ((iy * n_total) + ix);
                            break _inl_47__inl_6;
                        }
                        const _sroa_61_base = ((_inl_47__inl_6_result) * 4 + 0);
                        const _inl_47_u1_x = _b_U1[_sroa_61_base + 0];
                        const _inl_47_u1_y = _b_U1[_sroa_61_base + 1];
                        const _inl_47_u1_z = _b_U1[_sroa_61_base + 2];
                        const _inl_47_u1_w = _b_U1[_sroa_61_base + 3];
                        let _inl_47__inl_7_result;
                        _inl_47__inl_7: {
                            _inl_47__inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_47__inl_7;
                        }
                        const _inl_47__inl_8_ix = (ix + 1);
                        let _inl_47__inl_8_result;
                        _inl_47__inl_8: {
                            _inl_47__inl_8_result = ((iy * ((n_total + 1))) + _inl_47__inl_8_ix);
                            break _inl_47__inl_8;
                        }
                        const _inl_47_bx_c = (0.5 * ((_b_Bx_face[_inl_47__inl_7_result] + _b_Bx_face[_inl_47__inl_8_result])));
                        let _inl_47__inl_9_result;
                        _inl_47__inl_9: {
                            _inl_47__inl_9_result = ((iy * n_total) + ix);
                            break _inl_47__inl_9;
                        }
                        const _inl_47__inl_10_iy = (iy + 1);
                        let _inl_47__inl_10_result;
                        _inl_47__inl_10: {
                            _inl_47__inl_10_result = ((_inl_47__inl_10_iy * n_total) + ix);
                            break _inl_47__inl_10;
                        }
                        const _inl_47_by_c = (0.5 * ((_b_By_face[_inl_47__inl_9_result] + _b_By_face[_inl_47__inl_10_result])));
                        _inl_47_result = (0.5 * ((((_inl_47_bx_c * _inl_47_bx_c) + (_inl_47_by_c * _inl_47_by_c)) + (_inl_47_u1_y * _inl_47_u1_y))));
                        break _inl_47;
                    }
                    const dmb = (_inl_47_result - _b_hall_mb0[c]);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = (u1_x + dmb);
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
    entry["repair_energy"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_repair_energy(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["compute_emf"] = function (workgroups, domain, origin) {
            return __entry_0_compute_emf(workgroups, bindings, domain, origin);
        };
        bound["apply_update"] = function (workgroups, domain, origin) {
            return __entry_1_apply_update(workgroups, bindings, domain, origin);
        };
        bound["repair_energy"] = function (workgroups, domain, origin) {
            return __entry_2_repair_energy(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","Bx_face","By_face","U1","dt_buf","hall_E","hall_mb0"], entryInfo };
}
