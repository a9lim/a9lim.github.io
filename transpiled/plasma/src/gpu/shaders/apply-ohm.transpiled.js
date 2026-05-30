// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-ohm.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 6187377ef1f46cc5c392dbe398919639b5b0773534d6371c3c0f59c25b6b1a05
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":203848,"lines":3529,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":8,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.692Z
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
    const MICRO_ION_START = 24;
    const MICRO_ION_COUNT = 24;
    const INV_LN10_OHM = 0.4342944819032518;
    const BIERMANN_DBZ_CAP_FRAC = 1.0;

    function cell_idx_total(ix, iy, n_total) {
        return ((iy * n_total) + ix);
    }

    function ez_edge_idx(ix, iy, n_total) {
        return ((iy * ((n_total + 1))) + ix);
    }

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

    function micro_log_interp_ohm(start, count, theta) {
        const log_theta = (Math.log(((theta) < (1.0e-30) ? (1.0e-30) : (theta))) * INV_LN10_OHM);
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

    function cell_pressure_ohm(ix, iy, n_total) {
        let _inl_10_result;
        _inl_10: {
            _inl_10_result = ((iy * n_total) + ix);
            break _inl_10;
        }
        const _sroa_2_base = ((_inl_10_result) * 4 + 0);
        const u0_x = bindings.U0[_sroa_2_base + 0];
        const u0_y = bindings.U0[_sroa_2_base + 1];
        const u0_z = bindings.U0[_sroa_2_base + 2];
        const u0_w = bindings.U0[_sroa_2_base + 3];
        let _inl_11_result;
        _inl_11: {
            _inl_11_result = ((iy * n_total) + ix);
            break _inl_11;
        }
        const _sroa_3_base = ((_inl_11_result) * 4 + 0);
        const u1_x = bindings.U1[_sroa_3_base + 0];
        const u1_y = bindings.U1[_sroa_3_base + 1];
        const u1_z = bindings.U1[_sroa_3_base + 2];
        const u1_w = bindings.U1[_sroa_3_base + 3];
        let _inl_12_result;
        _inl_12: {
            let _inl_12__inl_6_result;
            _inl_12__inl_6: {
                _inl_12__inl_6_result = ((iy * ((n_total + 1))) + ix);
                break _inl_12__inl_6;
            }
            const _inl_12__inl_7_ix = (ix + 1);
            let _inl_12__inl_7_result;
            _inl_12__inl_7: {
                _inl_12__inl_7_result = ((iy * ((n_total + 1))) + _inl_12__inl_7_ix);
                break _inl_12__inl_7;
            }
            _inl_12_result = (0.5 * ((bindings.Bx_face[_inl_12__inl_6_result] + bindings.Bx_face[_inl_12__inl_7_result])));
            break _inl_12;
        }
        let _inl_13_result;
        _inl_13: {
            let _inl_13__inl_8_result;
            _inl_13__inl_8: {
                _inl_13__inl_8_result = ((iy * n_total) + ix);
                break _inl_13__inl_8;
            }
            const _inl_13__inl_9_iy = (iy + 1);
            let _inl_13__inl_9_result;
            _inl_13__inl_9: {
                _inl_13__inl_9_result = ((_inl_13__inl_9_iy * n_total) + ix);
                break _inl_13__inl_9;
            }
            _inl_13_result = (0.5 * ((bindings.By_face[_inl_13__inl_8_result] + bindings.By_face[_inl_13__inl_9_result])));
            break _inl_13;
        }
        return pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, _inl_12_result, _inl_13_result, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
    }

    function neutral_fraction_ohm(ix, iy, n_total) {
        const f0 = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.neutral_frac, 0.0, 1.0));
        if ((f0 <= 0.0)) {
            return 0.0;
        }
        let _inl_15_result;
        _inl_15: {
            let _inl_15__inl_14_result;
            _inl_15__inl_14: {
                _inl_15__inl_14_result = ((iy * n_total) + ix);
                break _inl_15__inl_14;
            }
            const _inl_15_rho = ((bindings.U0[((_inl_15__inl_14_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_15__inl_14_result) * 4 + 0) + 0]));
            _inl_15_result = (cell_pressure_ohm(ix, iy, n_total) / _inl_15_rho);
            break _inl_15;
        }
        const theta = (_inl_15_result / ((bindings.U_uniforms.ionization_T0) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.ionization_T0)));
        const log_f = micro_log_interp_ohm(MICRO_ION_START, MICRO_ION_COUNT, theta);
        return (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((f0 * Math.pow(10.0, log_f)), 0.0, 1.0));
    }

    function corner_jb_ohm(ix, iy, n_total) {
        const dx = bindings.U_uniforms.dx;
        let R_Jx = 0;
        let R_Jy = 0;
        let R_Jz = 0;
        let R_Bx = 0;
        let R_By = 0;
        let R_Bz = 0;
        let R_rho = 0;
        const _inl_16_iy = (iy - 1);
        let _inl_16_result;
        _inl_16: {
            _inl_16_result = ((_inl_16_iy * ((n_total + 1))) + ix);
            break _inl_16;
        }
        let _inl_17_result;
        _inl_17: {
            _inl_17_result = ((iy * ((n_total + 1))) + ix);
            break _inl_17;
        }
        R_Bx = (0.5 * ((bindings.Bx_face[_inl_16_result] + bindings.Bx_face[_inl_17_result])));
        const _inl_18_ix = (ix - 1);
        let _inl_18_result;
        _inl_18: {
            _inl_18_result = ((iy * n_total) + _inl_18_ix);
            break _inl_18;
        }
        let _inl_19_result;
        _inl_19: {
            _inl_19_result = ((iy * n_total) + ix);
            break _inl_19;
        }
        R_By = (0.5 * ((bindings.By_face[_inl_18_result] + bindings.By_face[_inl_19_result])));
        const _inl_20_ix = (ix - 1);
        const _inl_20_iy = (iy - 1);
        let _inl_20_result;
        _inl_20: {
            _inl_20_result = ((_inl_20_iy * n_total) + _inl_20_ix);
            break _inl_20;
        }
        const bz_sw = bindings.U1[((_inl_20_result) * 4 + 0) + 1];
        const _inl_21_iy = (iy - 1);
        let _inl_21_result;
        _inl_21: {
            _inl_21_result = ((_inl_21_iy * n_total) + ix);
            break _inl_21;
        }
        const bz_se = bindings.U1[((_inl_21_result) * 4 + 0) + 1];
        const _inl_22_ix = (ix - 1);
        let _inl_22_result;
        _inl_22: {
            _inl_22_result = ((iy * n_total) + _inl_22_ix);
            break _inl_22;
        }
        const bz_nw = bindings.U1[((_inl_22_result) * 4 + 0) + 1];
        let _inl_23_result;
        _inl_23: {
            _inl_23_result = ((iy * n_total) + ix);
            break _inl_23;
        }
        const bz_ne = bindings.U1[((_inl_23_result) * 4 + 0) + 1];
        R_Bz = (0.25 * ((((bz_sw + bz_se) + bz_nw) + bz_ne)));
        const _inl_24_ix = (ix - 1);
        const _inl_24_iy = (iy - 1);
        let _inl_24_result;
        _inl_24: {
            _inl_24_result = ((_inl_24_iy * n_total) + _inl_24_ix);
            break _inl_24;
        }
        const rho_sw = bindings.U0[((_inl_24_result) * 4 + 0) + 0];
        const _inl_25_iy = (iy - 1);
        let _inl_25_result;
        _inl_25: {
            _inl_25_result = ((_inl_25_iy * n_total) + ix);
            break _inl_25;
        }
        const rho_se = bindings.U0[((_inl_25_result) * 4 + 0) + 0];
        const _inl_26_ix = (ix - 1);
        let _inl_26_result;
        _inl_26: {
            _inl_26_result = ((iy * n_total) + _inl_26_ix);
            break _inl_26;
        }
        const rho_nw = bindings.U0[((_inl_26_result) * 4 + 0) + 0];
        let _inl_27_result;
        _inl_27: {
            _inl_27_result = ((iy * n_total) + ix);
            break _inl_27;
        }
        const rho_ne = bindings.U0[((_inl_27_result) * 4 + 0) + 0];
        R_rho = (((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : ((0.25 * ((((rho_sw + rho_se) + rho_nw) + rho_ne)))));
        const _inl_28_ix = (ix - 1);
        let _inl_28_result;
        _inl_28: {
            _inl_28_result = ((iy * n_total) + _inl_28_ix);
            break _inl_28;
        }
        const by_l = bindings.By_face[_inl_28_result];
        let _inl_29_result;
        _inl_29: {
            _inl_29_result = ((iy * n_total) + ix);
            break _inl_29;
        }
        const by_r = bindings.By_face[_inl_29_result];
        const _inl_30_iy = (iy - 1);
        let _inl_30_result;
        _inl_30: {
            _inl_30_result = ((_inl_30_iy * ((n_total + 1))) + ix);
            break _inl_30;
        }
        const bx_d = bindings.Bx_face[_inl_30_result];
        let _inl_31_result;
        _inl_31: {
            _inl_31_result = ((iy * ((n_total + 1))) + ix);
            break _inl_31;
        }
        const bx_u = bindings.Bx_face[_inl_31_result];
        R_Jz = ((((by_r - by_l)) / dx) - (((bx_u - bx_d)) / dx));
        const bz_d_avg = (0.5 * ((bz_sw + bz_se)));
        const bz_u_avg = (0.5 * ((bz_nw + bz_ne)));
        const bz_l_avg = (0.5 * ((bz_sw + bz_nw)));
        const bz_r_avg = (0.5 * ((bz_se + bz_ne)));
        R_Jx = (((bz_u_avg - bz_d_avg)) / dx);
        R_Jy = ((-((bz_r_avg - bz_l_avg))) / dx);
        return { Jx: R_Jx, Jy: R_Jy, Jz: R_Jz, Bx: R_Bx, By: R_By, Bz: R_Bz, rho: R_rho };
    }

    function hall_e_corner_ohm(ix, iy, n_total) {
        const _inl_35_flags = bindings.U_uniforms.physics_flags;
        let _inl_35_result;
        _inl_35: {
            _inl_35_result = (((_inl_35_flags & FLAG_HALL)) != 0);
            break _inl_35;
        }
        if (((!_inl_35_result) || (bindings.U_uniforms.hall_di <= 0.0))) {
            return {x:0.0, y:0.0, z:0.0};
        }
        const _sroa_4 = corner_jb_ohm(ix, iy, n_total);
        const s_Jx = _sroa_4.Jx;
        const s_Jy = _sroa_4.Jy;
        const s_Jz = _sroa_4.Jz;
        const s_Bx = _sroa_4.Bx;
        const s_By = _sroa_4.By;
        const s_Bz = _sroa_4.Bz;
        const s_rho = _sroa_4.rho;
        const prefactor = (bindings.U_uniforms.hall_di / s_rho);
        const pe_frac = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.hall_electron_pressure_frac, 0.0, 1.0));
        const pe_sw = (pe_frac * cell_pressure_ohm((ix - 1), (iy - 1), n_total));
        const pe_se = (pe_frac * cell_pressure_ohm(ix, (iy - 1), n_total));
        const pe_nw = (pe_frac * cell_pressure_ohm((ix - 1), iy, n_total));
        const pe_ne = (pe_frac * cell_pressure_ohm(ix, iy, n_total));
        const grad_pe_x = ((0.5 * ((((pe_se + pe_ne)) - ((pe_sw + pe_nw))))) / bindings.U_uniforms.dx);
        const grad_pe_y = ((0.5 * ((((pe_nw + pe_ne)) - ((pe_sw + pe_se))))) / bindings.U_uniforms.dx);
        return {x:(prefactor * (((((s_Jy * s_Bz) - (s_Jz * s_By))) - grad_pe_x))), y:(prefactor * (((((s_Jz * s_Bx) - (s_Jx * s_Bz))) - grad_pe_y))), z:(prefactor * (((s_Jx * s_By) - (s_Jy * s_Bx))))};
    }

    function ambipolar_e_corner_ohm(ix, iy, n_total) {
        const _inl_36_flags = bindings.U_uniforms.physics_flags;
        let _inl_36_result;
        _inl_36: {
            _inl_36_result = (((_inl_36_flags & FLAG_AMBIPOLAR)) != 0);
            break _inl_36;
        }
        if (((!_inl_36_result) || (bindings.U_uniforms.ambipolar_eta <= 0.0))) {
            return {x:0.0, y:0.0, z:0.0};
        }
        const _sroa_5 = corner_jb_ohm(ix, iy, n_total);
        const s_Jx = _sroa_5.Jx;
        const s_Jy = _sroa_5.Jy;
        const s_Jz = _sroa_5.Jz;
        const s_Bx = _sroa_5.Bx;
        const s_By = _sroa_5.By;
        const s_Bz = _sroa_5.Bz;
        const s_rho = _sroa_5.rho;
        const b2 = (((s_Bx * s_Bx) + (s_By * s_By)) + (s_Bz * s_Bz));
        if ((b2 <= 1.0e-20)) {
            return {x:0.0, y:0.0, z:0.0};
        }
        const jdotb = (((s_Jx * s_Bx) + (s_Jy * s_By)) + (s_Jz * s_Bz));
        const jperp_x = (s_Jx - (s_Bx * ((jdotb / b2))));
        const jperp_y = (s_Jy - (s_By * ((jdotb / b2))));
        const jperp_z = (s_Jz - (s_Bz * ((jdotb / b2))));
        const f_sw = neutral_fraction_ohm((ix - 1), (iy - 1), n_total);
        const f_se = neutral_fraction_ohm(ix, (iy - 1), n_total);
        const f_nw = neutral_fraction_ohm((ix - 1), iy, n_total);
        const f_ne = neutral_fraction_ohm(ix, iy, n_total);
        const neutral = (0.25 * ((((f_sw + f_se) + f_nw) + f_ne)));
        return {x:((((bindings.U_uniforms.ambipolar_eta) < (0.0) ? (0.0) : (bindings.U_uniforms.ambipolar_eta)) * neutral) * jperp_x), y:((((bindings.U_uniforms.ambipolar_eta) < (0.0) ? (0.0) : (bindings.U_uniforms.ambipolar_eta)) * neutral) * jperp_y), z:((((bindings.U_uniforms.ambipolar_eta) < (0.0) ? (0.0) : (bindings.U_uniforms.ambipolar_eta)) * neutral) * jperp_z)};
    }

    function electron_inertia_e_corner_ohm(ix, iy, n_total) {
        const _inl_37_flags = bindings.U_uniforms.physics_flags;
        let _inl_37_result;
        _inl_37: {
            _inl_37_result = (((_inl_37_flags & FLAG_ELECTRON_INERTIA)) != 0);
            break _inl_37;
        }
        if ((((!_inl_37_result) || (bindings.U_uniforms.electron_inertia_length <= 0.0)) || (bindings.U_uniforms.electron_inertia_damping <= 0.0))) {
            return {x:0.0, y:0.0, z:0.0};
        }
        const dx = bindings.U_uniforms.dx;
        const j0 = corner_jb_ohm(ix, iy, n_total).Jz;
        const jl = corner_jb_ohm((ix - 1), iy, n_total).Jz;
        const jr = corner_jb_ohm((ix + 1), iy, n_total).Jz;
        const jd = corner_jb_ohm(ix, (iy - 1), n_total).Jz;
        const ju = corner_jb_ohm(ix, (iy + 1), n_total).Jz;
        const lap_jz = ((((((jl + jr) + jd) + ju) - (4.0 * j0))) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx))));
        const eta4 = ((bindings.U_uniforms.electron_inertia_damping * bindings.U_uniforms.electron_inertia_length) * bindings.U_uniforms.electron_inertia_length);
        return {x:0.0, y:0.0, z:((-eta4) * lap_jz)};
    }

    function biermann_cell_ohm(ix, iy, n_total) {
        const _inl_38_flags = bindings.U_uniforms.physics_flags;
        let _inl_38_result;
        _inl_38: {
            _inl_38_result = (((_inl_38_flags & FLAG_BIERMANN)) != 0);
            break _inl_38;
        }
        if ((((!_inl_38_result) || (bindings.U_uniforms.biermann_coeff == 0.0)) || (bindings.U_uniforms.hall_electron_pressure_frac <= 0.0))) {
            return 0.0;
        }
        const pe_frac = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(bindings.U_uniforms.hall_electron_pressure_frac, 0.0, 1.0));
        const pe_l = (pe_frac * cell_pressure_ohm((ix - 1), iy, n_total));
        const pe_r = (pe_frac * cell_pressure_ohm((ix + 1), iy, n_total));
        const pe_d = (pe_frac * cell_pressure_ohm(ix, (iy - 1), n_total));
        const pe_u = (pe_frac * cell_pressure_ohm(ix, (iy + 1), n_total));
        const _inl_39_ix = (ix - 1);
        let _inl_39_result;
        _inl_39: {
            _inl_39_result = ((iy * n_total) + _inl_39_ix);
            break _inl_39;
        }
        const rho_l = ((bindings.U0[((_inl_39_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_39_result) * 4 + 0) + 0]));
        const _inl_40_ix = (ix + 1);
        let _inl_40_result;
        _inl_40: {
            _inl_40_result = ((iy * n_total) + _inl_40_ix);
            break _inl_40;
        }
        const rho_r = ((bindings.U0[((_inl_40_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_40_result) * 4 + 0) + 0]));
        const _inl_41_iy = (iy - 1);
        let _inl_41_result;
        _inl_41: {
            _inl_41_result = ((_inl_41_iy * n_total) + ix);
            break _inl_41;
        }
        const rho_d = ((bindings.U0[((_inl_41_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_41_result) * 4 + 0) + 0]));
        const _inl_42_iy = (iy + 1);
        let _inl_42_result;
        _inl_42: {
            _inl_42_result = ((_inl_42_iy * n_total) + ix);
            break _inl_42;
        }
        const rho_u = ((bindings.U0[((_inl_42_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_42_result) * 4 + 0) + 0]));
        let _inl_43_result;
        _inl_43: {
            _inl_43_result = ((iy * n_total) + ix);
            break _inl_43;
        }
        const rho_c = ((bindings.U0[((_inl_43_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_43_result) * 4 + 0) + 0]));
        const inv_2dx = (0.5 / bindings.U_uniforms.dx);
        const grad_rho_x = (((rho_r - rho_l)) * inv_2dx);
        const grad_rho_y = (((rho_u - rho_d)) * inv_2dx);
        const grad_pe_x = (((pe_r - pe_l)) * inv_2dx);
        const grad_pe_y = (((pe_u - pe_d)) * inv_2dx);
        return ((bindings.U_uniforms.biermann_coeff * (((grad_rho_x * grad_pe_y) - (grad_rho_y * grad_pe_x)))) / (((rho_c * rho_c)) < (1.0e-20) ? (1.0e-20) : ((rho_c * rho_c))));
    }

    function load_hall_E(ix, iy, n_total) {
        let _inl_45_result;
        _inl_45: {
            _inl_45_result = ((iy * ((n_total + 1))) + ix);
            break _inl_45;
        }
        const _sroa_6_base = ((_inl_45_result) * 4 + 0);
        const e_x = bindings.hall_E[_sroa_6_base + 0];
        const e_y = bindings.hall_E[_sroa_6_base + 1];
        const e_z = bindings.hall_E[_sroa_6_base + 2];
        const e_w = bindings.hall_E[_sroa_6_base + 3];
        return {x:e_x, y:e_y, z:e_z};
    }

    function load_ambipolar_E(ix, iy, n_total) {
        let _inl_46_result;
        _inl_46: {
            _inl_46_result = ((iy * ((n_total + 1))) + ix);
            break _inl_46;
        }
        const idx = _inl_46_result;
        const _sroa_7_base = ((idx) * 4 + 0);
        const total_x = bindings.ohm_E[_sroa_7_base + 0];
        const total_y = bindings.ohm_E[_sroa_7_base + 1];
        const total_z = bindings.ohm_E[_sroa_7_base + 2];
        const total_w = bindings.ohm_E[_sroa_7_base + 3];
        const _sroa_8_base = ((idx) * 4 + 0);
        const hall_x = bindings.hall_E[_sroa_8_base + 0];
        const hall_y = bindings.hall_E[_sroa_8_base + 1];
        const hall_z = bindings.hall_E[_sroa_8_base + 2];
        const hall_w = bindings.hall_E[_sroa_8_base + 3];
        return {x:(total_x - hall_x), y:(total_y - hall_y), z:(total_z - hall_z)};
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
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_electron_inertia_length = _b_U_uniforms.electron_inertia_length;
        const _u_U_uniforms_electron_inertia_damping = _b_U_uniforms.electron_inertia_damping;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_ohm_E = bindings.ohm_E;
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
                    const _inl_47_flags = _u_U_uniforms_physics_flags;
                    let _inl_47_result;
                    _inl_47: {
                        _inl_47_result = (((_inl_47_flags & FLAG_HALL)) != 0);
                        break _inl_47;
                    }
                    const _inl_48_flags = _u_U_uniforms_physics_flags;
                    let _inl_48_result;
                    _inl_48: {
                        _inl_48_result = (((_inl_48_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_48;
                    }
                    const _inl_49_flags = _u_U_uniforms_physics_flags;
                    let _inl_49_result;
                    _inl_49: {
                        _inl_49_result = (((_inl_49_flags & FLAG_BIERMANN)) != 0);
                        break _inl_49;
                    }
                    const _inl_50_flags = _u_U_uniforms_physics_flags;
                    let _inl_50_result;
                    _inl_50: {
                        _inl_50_result = (((_inl_50_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_50;
                    }
                    const any_on = (((((_inl_47_result && (_u_U_uniforms_hall_di > 0.0))) || ((_inl_48_result && (_u_U_uniforms_ambipolar_eta > 0.0)))) || ((_inl_49_result && (_u_U_uniforms_biermann_coeff != 0.0)))) || (((_inl_50_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0))));
                    if ((!any_on)) {
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
                    const _sroa_9 = hall_e_corner_ohm(ix, iy, n_total);
                    const e_hall_x = _sroa_9.x;
                    const e_hall_y = _sroa_9.y;
                    const e_hall_z = _sroa_9.z;
                    const _sroa_10 = ambipolar_e_corner_ohm(ix, iy, n_total);
                    const e_ambi_x = _sroa_10.x;
                    const e_ambi_y = _sroa_10.y;
                    const e_ambi_z = _sroa_10.z;
                    const _sroa_11 = electron_inertia_e_corner_ohm(ix, iy, n_total);
                    const e_ei_x = _sroa_11.x;
                    const e_ei_y = _sroa_11.y;
                    const e_ei_z = _sroa_11.z;
                    let battery = 0.0;
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        battery = biermann_cell_ohm(ix, iy, n_total);
                        let _inl_51_result;
                        _inl_51: {
                            let _inl_51__inl_32_result;
                            _inl_51__inl_32: {
                                _inl_51__inl_32_result = ((iy * n_total) + ix);
                                break _inl_51__inl_32;
                            }
                            const _sroa_12_base = ((_inl_51__inl_32_result) * 4 + 0);
                            const _inl_51_u1_x = _b_U1[_sroa_12_base + 0];
                            const _inl_51_u1_y = _b_U1[_sroa_12_base + 1];
                            const _inl_51_u1_z = _b_U1[_sroa_12_base + 2];
                            const _inl_51_u1_w = _b_U1[_sroa_12_base + 3];
                            let _inl_51__inl_33_result;
                            _inl_51__inl_33: {
                                let _inl_51__inl_33__inl_6_result;
                                _inl_51__inl_33__inl_6: {
                                    _inl_51__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_51__inl_33__inl_6;
                                }
                                const _inl_51__inl_33__inl_7_ix = (ix + 1);
                                let _inl_51__inl_33__inl_7_result;
                                _inl_51__inl_33__inl_7: {
                                    _inl_51__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_51__inl_33__inl_7_ix);
                                    break _inl_51__inl_33__inl_7;
                                }
                                _inl_51__inl_33_result = (0.5 * ((_b_Bx_face[_inl_51__inl_33__inl_6_result] + _b_Bx_face[_inl_51__inl_33__inl_7_result])));
                                break _inl_51__inl_33;
                            }
                            const _inl_51_bx_c = _inl_51__inl_33_result;
                            let _inl_51__inl_34_result;
                            _inl_51__inl_34: {
                                let _inl_51__inl_34__inl_8_result;
                                _inl_51__inl_34__inl_8: {
                                    _inl_51__inl_34__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_51__inl_34__inl_8;
                                }
                                const _inl_51__inl_34__inl_9_iy = (iy + 1);
                                let _inl_51__inl_34__inl_9_result;
                                _inl_51__inl_34__inl_9: {
                                    _inl_51__inl_34__inl_9_result = ((_inl_51__inl_34__inl_9_iy * n_total) + ix);
                                    break _inl_51__inl_34__inl_9;
                                }
                                _inl_51__inl_34_result = (0.5 * ((_b_By_face[_inl_51__inl_34__inl_8_result] + _b_By_face[_inl_51__inl_34__inl_9_result])));
                                break _inl_51__inl_34;
                            }
                            const _inl_51_by_c = _inl_51__inl_34_result;
                            _inl_51_result = (0.5 * ((((_inl_51_bx_c * _inl_51_bx_c) + (_inl_51_by_c * _inl_51_by_c)) + (_inl_51_u1_y * _inl_51_u1_y))));
                            break _inl_51;
                        }
                        _b_hall_mb0[cell_idx_total(ix, iy, n_total)] = _inl_51_result;
                    }
                    const e_total_x = ((e_hall_x + e_ambi_x) + e_ei_x);
                    const e_total_y = ((e_hall_y + e_ambi_y) + e_ei_y);
                    const e_total_z = ((e_hall_z + e_ambi_z) + e_ei_z);
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_total_x;
                        const _wt1 = e_total_y;
                        const _wt2 = e_total_z;
                        const _wt3 = battery;
                        _b_ohm_E[_wbase + 0] = _wt0;
                        _b_ohm_E[_wbase + 1] = _wt1;
                        _b_ohm_E[_wbase + 2] = _wt2;
                        _b_ohm_E[_wbase + 3] = _wt3;
                    }
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_hall_x;
                        const _wt1 = e_hall_y;
                        const _wt2 = e_hall_z;
                        const _wt3 = 0.0;
                        _b_hall_E[_wbase + 0] = _wt0;
                        _b_hall_E[_wbase + 1] = _wt1;
                        _b_hall_E[_wbase + 2] = _wt2;
                        _b_hall_E[_wbase + 3] = _wt3;
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
                            const _inl_47_flags = _u_U_uniforms_physics_flags;
                            let _inl_47_result;
                            _inl_47: {
                                _inl_47_result = (((_inl_47_flags & FLAG_HALL)) != 0);
                                break _inl_47;
                            }
                            const _inl_48_flags = _u_U_uniforms_physics_flags;
                            let _inl_48_result;
                            _inl_48: {
                                _inl_48_result = (((_inl_48_flags & FLAG_AMBIPOLAR)) != 0);
                                break _inl_48;
                            }
                            const _inl_49_flags = _u_U_uniforms_physics_flags;
                            let _inl_49_result;
                            _inl_49: {
                                _inl_49_result = (((_inl_49_flags & FLAG_BIERMANN)) != 0);
                                break _inl_49;
                            }
                            const _inl_50_flags = _u_U_uniforms_physics_flags;
                            let _inl_50_result;
                            _inl_50: {
                                _inl_50_result = (((_inl_50_flags & FLAG_ELECTRON_INERTIA)) != 0);
                                break _inl_50;
                            }
                            const any_on = (((((_inl_47_result && (_u_U_uniforms_hall_di > 0.0))) || ((_inl_48_result && (_u_U_uniforms_ambipolar_eta > 0.0)))) || ((_inl_49_result && (_u_U_uniforms_biermann_coeff != 0.0)))) || (((_inl_50_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0))));
                            if ((!any_on)) {
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
                            const _sroa_13 = hall_e_corner_ohm(ix, iy, n_total);
                            const e_hall_x = _sroa_13.x;
                            const e_hall_y = _sroa_13.y;
                            const e_hall_z = _sroa_13.z;
                            const _sroa_14 = ambipolar_e_corner_ohm(ix, iy, n_total);
                            const e_ambi_x = _sroa_14.x;
                            const e_ambi_y = _sroa_14.y;
                            const e_ambi_z = _sroa_14.z;
                            const _sroa_15 = electron_inertia_e_corner_ohm(ix, iy, n_total);
                            const e_ei_x = _sroa_15.x;
                            const e_ei_y = _sroa_15.y;
                            const e_ei_z = _sroa_15.z;
                            let battery = 0.0;
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                battery = biermann_cell_ohm(ix, iy, n_total);
                                let _inl_51_result;
                                _inl_51: {
                                    let _inl_51__inl_32_result;
                                    _inl_51__inl_32: {
                                        _inl_51__inl_32_result = ((iy * n_total) + ix);
                                        break _inl_51__inl_32;
                                    }
                                    const _sroa_16_base = ((_inl_51__inl_32_result) * 4 + 0);
                                    const _inl_51_u1_x = _b_U1[_sroa_16_base + 0];
                                    const _inl_51_u1_y = _b_U1[_sroa_16_base + 1];
                                    const _inl_51_u1_z = _b_U1[_sroa_16_base + 2];
                                    const _inl_51_u1_w = _b_U1[_sroa_16_base + 3];
                                    let _inl_51__inl_33_result;
                                    _inl_51__inl_33: {
                                        let _inl_51__inl_33__inl_6_result;
                                        _inl_51__inl_33__inl_6: {
                                            _inl_51__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                            break _inl_51__inl_33__inl_6;
                                        }
                                        const _inl_51__inl_33__inl_7_ix = (ix + 1);
                                        let _inl_51__inl_33__inl_7_result;
                                        _inl_51__inl_33__inl_7: {
                                            _inl_51__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_51__inl_33__inl_7_ix);
                                            break _inl_51__inl_33__inl_7;
                                        }
                                        _inl_51__inl_33_result = (0.5 * ((_b_Bx_face[_inl_51__inl_33__inl_6_result] + _b_Bx_face[_inl_51__inl_33__inl_7_result])));
                                        break _inl_51__inl_33;
                                    }
                                    const _inl_51_bx_c = _inl_51__inl_33_result;
                                    let _inl_51__inl_34_result;
                                    _inl_51__inl_34: {
                                        let _inl_51__inl_34__inl_8_result;
                                        _inl_51__inl_34__inl_8: {
                                            _inl_51__inl_34__inl_8_result = ((iy * n_total) + ix);
                                            break _inl_51__inl_34__inl_8;
                                        }
                                        const _inl_51__inl_34__inl_9_iy = (iy + 1);
                                        let _inl_51__inl_34__inl_9_result;
                                        _inl_51__inl_34__inl_9: {
                                            _inl_51__inl_34__inl_9_result = ((_inl_51__inl_34__inl_9_iy * n_total) + ix);
                                            break _inl_51__inl_34__inl_9;
                                        }
                                        _inl_51__inl_34_result = (0.5 * ((_b_By_face[_inl_51__inl_34__inl_8_result] + _b_By_face[_inl_51__inl_34__inl_9_result])));
                                        break _inl_51__inl_34;
                                    }
                                    const _inl_51_by_c = _inl_51__inl_34_result;
                                    _inl_51_result = (0.5 * ((((_inl_51_bx_c * _inl_51_bx_c) + (_inl_51_by_c * _inl_51_by_c)) + (_inl_51_u1_y * _inl_51_u1_y))));
                                    break _inl_51;
                                }
                                _b_hall_mb0[cell_idx_total(ix, iy, n_total)] = _inl_51_result;
                            }
                            const e_total_x = ((e_hall_x + e_ambi_x) + e_ei_x);
                            const e_total_y = ((e_hall_y + e_ambi_y) + e_ei_y);
                            const e_total_z = ((e_hall_z + e_ambi_z) + e_ei_z);
                            {
                                const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                                const _wt0 = e_total_x;
                                const _wt1 = e_total_y;
                                const _wt2 = e_total_z;
                                const _wt3 = battery;
                                _b_ohm_E[_wbase + 0] = _wt0;
                                _b_ohm_E[_wbase + 1] = _wt1;
                                _b_ohm_E[_wbase + 2] = _wt2;
                                _b_ohm_E[_wbase + 3] = _wt3;
                            }
                            {
                                const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                                const _wt0 = e_hall_x;
                                const _wt1 = e_hall_y;
                                const _wt2 = e_hall_z;
                                const _wt3 = 0.0;
                                _b_hall_E[_wbase + 0] = _wt0;
                                _b_hall_E[_wbase + 1] = _wt1;
                                _b_hall_E[_wbase + 2] = _wt2;
                                _b_hall_E[_wbase + 3] = _wt3;
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
                        const _inl_47_flags = _u_U_uniforms_physics_flags;
                        let _inl_47_result;
                        _inl_47: {
                            _inl_47_result = (((_inl_47_flags & FLAG_HALL)) != 0);
                            break _inl_47;
                        }
                        const _inl_48_flags = _u_U_uniforms_physics_flags;
                        let _inl_48_result;
                        _inl_48: {
                            _inl_48_result = (((_inl_48_flags & FLAG_AMBIPOLAR)) != 0);
                            break _inl_48;
                        }
                        const _inl_49_flags = _u_U_uniforms_physics_flags;
                        let _inl_49_result;
                        _inl_49: {
                            _inl_49_result = (((_inl_49_flags & FLAG_BIERMANN)) != 0);
                            break _inl_49;
                        }
                        const _inl_50_flags = _u_U_uniforms_physics_flags;
                        let _inl_50_result;
                        _inl_50: {
                            _inl_50_result = (((_inl_50_flags & FLAG_ELECTRON_INERTIA)) != 0);
                            break _inl_50;
                        }
                        const any_on = (((((_inl_47_result && (_u_U_uniforms_hall_di > 0.0))) || ((_inl_48_result && (_u_U_uniforms_ambipolar_eta > 0.0)))) || ((_inl_49_result && (_u_U_uniforms_biermann_coeff != 0.0)))) || (((_inl_50_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0))));
                        if ((!any_on)) {
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
                        const _sroa_17 = hall_e_corner_ohm(ix, iy, n_total);
                        const e_hall_x = _sroa_17.x;
                        const e_hall_y = _sroa_17.y;
                        const e_hall_z = _sroa_17.z;
                        const _sroa_18 = ambipolar_e_corner_ohm(ix, iy, n_total);
                        const e_ambi_x = _sroa_18.x;
                        const e_ambi_y = _sroa_18.y;
                        const e_ambi_z = _sroa_18.z;
                        const _sroa_19 = electron_inertia_e_corner_ohm(ix, iy, n_total);
                        const e_ei_x = _sroa_19.x;
                        const e_ei_y = _sroa_19.y;
                        const e_ei_z = _sroa_19.z;
                        let battery = 0.0;
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
                            battery = biermann_cell_ohm(ix, iy, n_total);
                            let _inl_51_result;
                            _inl_51: {
                                let _inl_51__inl_32_result;
                                _inl_51__inl_32: {
                                    _inl_51__inl_32_result = ((iy * n_total) + ix);
                                    break _inl_51__inl_32;
                                }
                                const _sroa_20_base = ((_inl_51__inl_32_result) * 4 + 0);
                                const _inl_51_u1_x = _b_U1[_sroa_20_base + 0];
                                const _inl_51_u1_y = _b_U1[_sroa_20_base + 1];
                                const _inl_51_u1_z = _b_U1[_sroa_20_base + 2];
                                const _inl_51_u1_w = _b_U1[_sroa_20_base + 3];
                                let _inl_51__inl_33_result;
                                _inl_51__inl_33: {
                                    let _inl_51__inl_33__inl_6_result;
                                    _inl_51__inl_33__inl_6: {
                                        _inl_51__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_51__inl_33__inl_6;
                                    }
                                    const _inl_51__inl_33__inl_7_ix = (ix + 1);
                                    let _inl_51__inl_33__inl_7_result;
                                    _inl_51__inl_33__inl_7: {
                                        _inl_51__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_51__inl_33__inl_7_ix);
                                        break _inl_51__inl_33__inl_7;
                                    }
                                    _inl_51__inl_33_result = (0.5 * ((_b_Bx_face[_inl_51__inl_33__inl_6_result] + _b_Bx_face[_inl_51__inl_33__inl_7_result])));
                                    break _inl_51__inl_33;
                                }
                                const _inl_51_bx_c = _inl_51__inl_33_result;
                                let _inl_51__inl_34_result;
                                _inl_51__inl_34: {
                                    let _inl_51__inl_34__inl_8_result;
                                    _inl_51__inl_34__inl_8: {
                                        _inl_51__inl_34__inl_8_result = ((iy * n_total) + ix);
                                        break _inl_51__inl_34__inl_8;
                                    }
                                    const _inl_51__inl_34__inl_9_iy = (iy + 1);
                                    let _inl_51__inl_34__inl_9_result;
                                    _inl_51__inl_34__inl_9: {
                                        _inl_51__inl_34__inl_9_result = ((_inl_51__inl_34__inl_9_iy * n_total) + ix);
                                        break _inl_51__inl_34__inl_9;
                                    }
                                    _inl_51__inl_34_result = (0.5 * ((_b_By_face[_inl_51__inl_34__inl_8_result] + _b_By_face[_inl_51__inl_34__inl_9_result])));
                                    break _inl_51__inl_34;
                                }
                                const _inl_51_by_c = _inl_51__inl_34_result;
                                _inl_51_result = (0.5 * ((((_inl_51_bx_c * _inl_51_bx_c) + (_inl_51_by_c * _inl_51_by_c)) + (_inl_51_u1_y * _inl_51_u1_y))));
                                break _inl_51;
                            }
                            _b_hall_mb0[cell_idx_total(ix, iy, n_total)] = _inl_51_result;
                        }
                        const e_total_x = ((e_hall_x + e_ambi_x) + e_ei_x);
                        const e_total_y = ((e_hall_y + e_ambi_y) + e_ei_y);
                        const e_total_z = ((e_hall_z + e_ambi_z) + e_ei_z);
                        {
                            const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                            const _wt0 = e_total_x;
                            const _wt1 = e_total_y;
                            const _wt2 = e_total_z;
                            const _wt3 = battery;
                            _b_ohm_E[_wbase + 0] = _wt0;
                            _b_ohm_E[_wbase + 1] = _wt1;
                            _b_ohm_E[_wbase + 2] = _wt2;
                            _b_ohm_E[_wbase + 3] = _wt3;
                        }
                        {
                            const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                            const _wt0 = e_hall_x;
                            const _wt1 = e_hall_y;
                            const _wt2 = e_hall_z;
                            const _wt3 = 0.0;
                            _b_hall_E[_wbase + 0] = _wt0;
                            _b_hall_E[_wbase + 1] = _wt1;
                            _b_hall_E[_wbase + 2] = _wt2;
                            _b_hall_E[_wbase + 3] = _wt3;
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
                    const _inl_47_flags = _u_U_uniforms_physics_flags;
                    let _inl_47_result;
                    _inl_47: {
                        _inl_47_result = (((_inl_47_flags & FLAG_HALL)) != 0);
                        break _inl_47;
                    }
                    const _inl_48_flags = _u_U_uniforms_physics_flags;
                    let _inl_48_result;
                    _inl_48: {
                        _inl_48_result = (((_inl_48_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_48;
                    }
                    const _inl_49_flags = _u_U_uniforms_physics_flags;
                    let _inl_49_result;
                    _inl_49: {
                        _inl_49_result = (((_inl_49_flags & FLAG_BIERMANN)) != 0);
                        break _inl_49;
                    }
                    const _inl_50_flags = _u_U_uniforms_physics_flags;
                    let _inl_50_result;
                    _inl_50: {
                        _inl_50_result = (((_inl_50_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_50;
                    }
                    const any_on = (((((_inl_47_result && (_u_U_uniforms_hall_di > 0.0))) || ((_inl_48_result && (_u_U_uniforms_ambipolar_eta > 0.0)))) || ((_inl_49_result && (_u_U_uniforms_biermann_coeff != 0.0)))) || (((_inl_50_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0))));
                    if ((!any_on)) {
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
                    const _sroa_21 = hall_e_corner_ohm(ix, iy, n_total);
                    const e_hall_x = _sroa_21.x;
                    const e_hall_y = _sroa_21.y;
                    const e_hall_z = _sroa_21.z;
                    const _sroa_22 = ambipolar_e_corner_ohm(ix, iy, n_total);
                    const e_ambi_x = _sroa_22.x;
                    const e_ambi_y = _sroa_22.y;
                    const e_ambi_z = _sroa_22.z;
                    const _sroa_23 = electron_inertia_e_corner_ohm(ix, iy, n_total);
                    const e_ei_x = _sroa_23.x;
                    const e_ei_y = _sroa_23.y;
                    const e_ei_z = _sroa_23.z;
                    let battery = 0.0;
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        battery = biermann_cell_ohm(ix, iy, n_total);
                        let _inl_51_result;
                        _inl_51: {
                            let _inl_51__inl_32_result;
                            _inl_51__inl_32: {
                                _inl_51__inl_32_result = ((iy * n_total) + ix);
                                break _inl_51__inl_32;
                            }
                            const _sroa_24_base = ((_inl_51__inl_32_result) * 4 + 0);
                            const _inl_51_u1_x = _b_U1[_sroa_24_base + 0];
                            const _inl_51_u1_y = _b_U1[_sroa_24_base + 1];
                            const _inl_51_u1_z = _b_U1[_sroa_24_base + 2];
                            const _inl_51_u1_w = _b_U1[_sroa_24_base + 3];
                            let _inl_51__inl_33_result;
                            _inl_51__inl_33: {
                                let _inl_51__inl_33__inl_6_result;
                                _inl_51__inl_33__inl_6: {
                                    _inl_51__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_51__inl_33__inl_6;
                                }
                                const _inl_51__inl_33__inl_7_ix = (ix + 1);
                                let _inl_51__inl_33__inl_7_result;
                                _inl_51__inl_33__inl_7: {
                                    _inl_51__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_51__inl_33__inl_7_ix);
                                    break _inl_51__inl_33__inl_7;
                                }
                                _inl_51__inl_33_result = (0.5 * ((_b_Bx_face[_inl_51__inl_33__inl_6_result] + _b_Bx_face[_inl_51__inl_33__inl_7_result])));
                                break _inl_51__inl_33;
                            }
                            const _inl_51_bx_c = _inl_51__inl_33_result;
                            let _inl_51__inl_34_result;
                            _inl_51__inl_34: {
                                let _inl_51__inl_34__inl_8_result;
                                _inl_51__inl_34__inl_8: {
                                    _inl_51__inl_34__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_51__inl_34__inl_8;
                                }
                                const _inl_51__inl_34__inl_9_iy = (iy + 1);
                                let _inl_51__inl_34__inl_9_result;
                                _inl_51__inl_34__inl_9: {
                                    _inl_51__inl_34__inl_9_result = ((_inl_51__inl_34__inl_9_iy * n_total) + ix);
                                    break _inl_51__inl_34__inl_9;
                                }
                                _inl_51__inl_34_result = (0.5 * ((_b_By_face[_inl_51__inl_34__inl_8_result] + _b_By_face[_inl_51__inl_34__inl_9_result])));
                                break _inl_51__inl_34;
                            }
                            const _inl_51_by_c = _inl_51__inl_34_result;
                            _inl_51_result = (0.5 * ((((_inl_51_bx_c * _inl_51_bx_c) + (_inl_51_by_c * _inl_51_by_c)) + (_inl_51_u1_y * _inl_51_u1_y))));
                            break _inl_51;
                        }
                        _b_hall_mb0[cell_idx_total(ix, iy, n_total)] = _inl_51_result;
                    }
                    const e_total_x = ((e_hall_x + e_ambi_x) + e_ei_x);
                    const e_total_y = ((e_hall_y + e_ambi_y) + e_ei_y);
                    const e_total_z = ((e_hall_z + e_ambi_z) + e_ei_z);
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_total_x;
                        const _wt1 = e_total_y;
                        const _wt2 = e_total_z;
                        const _wt3 = battery;
                        _b_ohm_E[_wbase + 0] = _wt0;
                        _b_ohm_E[_wbase + 1] = _wt1;
                        _b_ohm_E[_wbase + 2] = _wt2;
                        _b_ohm_E[_wbase + 3] = _wt3;
                    }
                    {
                        const _wbase = ((ez_edge_idx(ix, iy, n_total)) * 4 + 0);
                        const _wt0 = e_hall_x;
                        const _wt1 = e_hall_y;
                        const _wt2 = e_hall_z;
                        const _wt3 = 0.0;
                        _b_hall_E[_wbase + 0] = _wt0;
                        _b_hall_E[_wbase + 1] = _wt1;
                        _b_hall_E[_wbase + 2] = _wt2;
                        _b_hall_E[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["compute_emf"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_compute_emf(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_hall_update"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_apply_hall_update(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
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
                    const _inl_52_flags = _u_U_uniforms_physics_flags;
                    let _inl_52_result;
                    _inl_52: {
                        _inl_52_result = (((_inl_52_flags & FLAG_HALL)) != 0);
                        break _inl_52;
                    }
                    if (((!_inl_52_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                        const _sroa_25 = load_hall_E(ix, iy, n_total);
                        const e0_x = _sroa_25.x;
                        const e0_y = _sroa_25.y;
                        const e0_z = _sroa_25.z;
                        const _sroa_26 = load_hall_E(ix, (iy + 1), n_total);
                        const e1_x = _sroa_26.x;
                        const e1_y = _sroa_26.y;
                        const e1_z = _sroa_26.z;
                        let _inl_53_result;
                        _inl_53: {
                            _inl_53_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_53;
                        }
                        const bxi = _inl_53_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                    }
                    if ((gid_x < n_interior)) {
                        const _sroa_27 = load_hall_E(ix, iy, n_total);
                        const e0_x = _sroa_27.x;
                        const e0_y = _sroa_27.y;
                        const e0_z = _sroa_27.z;
                        const _sroa_28 = load_hall_E((ix + 1), iy, n_total);
                        const e1_x = _sroa_28.x;
                        const e1_y = _sroa_28.y;
                        const e1_z = _sroa_28.z;
                        let _inl_54_result;
                        _inl_54: {
                            _inl_54_result = ((iy * n_total) + ix);
                            break _inl_54;
                        }
                        const byi = _inl_54_result;
                        _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        const _sroa_29 = load_hall_E(ix, iy, n_total);
                        const e_sw_x = _sroa_29.x;
                        const e_sw_y = _sroa_29.y;
                        const e_sw_z = _sroa_29.z;
                        const _sroa_30 = load_hall_E((ix + 1), iy, n_total);
                        const e_se_x = _sroa_30.x;
                        const e_se_y = _sroa_30.y;
                        const e_se_z = _sroa_30.z;
                        const _sroa_31 = load_hall_E(ix, (iy + 1), n_total);
                        const e_nw_x = _sroa_31.x;
                        const e_nw_y = _sroa_31.y;
                        const e_nw_z = _sroa_31.z;
                        const _sroa_32 = load_hall_E((ix + 1), (iy + 1), n_total);
                        const e_ne_x = _sroa_32.x;
                        const e_ne_y = _sroa_32.y;
                        const e_ne_z = _sroa_32.z;
                        const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                        const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                        let _inl_55_result;
                        _inl_55: {
                            _inl_55_result = ((iy * n_total) + ix);
                            break _inl_55;
                        }
                        const c = _inl_55_result;
                        const _sroa_33_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_33_base + 0];
                        const u1_y = _b_U1[_sroa_33_base + 1];
                        const u1_z = _b_U1[_sroa_33_base + 2];
                        const u1_w = _b_U1[_sroa_33_base + 3];
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
                            const _inl_52_flags = _u_U_uniforms_physics_flags;
                            let _inl_52_result;
                            _inl_52: {
                                _inl_52_result = (((_inl_52_flags & FLAG_HALL)) != 0);
                                break _inl_52;
                            }
                            if (((!_inl_52_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                                const _sroa_34 = load_hall_E(ix, iy, n_total);
                                const e0_x = _sroa_34.x;
                                const e0_y = _sroa_34.y;
                                const e0_z = _sroa_34.z;
                                const _sroa_35 = load_hall_E(ix, (iy + 1), n_total);
                                const e1_x = _sroa_35.x;
                                const e1_y = _sroa_35.y;
                                const e1_z = _sroa_35.z;
                                let _inl_53_result;
                                _inl_53: {
                                    _inl_53_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_53;
                                }
                                const bxi = _inl_53_result;
                                _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                            }
                            if ((gid_x < n_interior)) {
                                const _sroa_36 = load_hall_E(ix, iy, n_total);
                                const e0_x = _sroa_36.x;
                                const e0_y = _sroa_36.y;
                                const e0_z = _sroa_36.z;
                                const _sroa_37 = load_hall_E((ix + 1), iy, n_total);
                                const e1_x = _sroa_37.x;
                                const e1_y = _sroa_37.y;
                                const e1_z = _sroa_37.z;
                                let _inl_54_result;
                                _inl_54: {
                                    _inl_54_result = ((iy * n_total) + ix);
                                    break _inl_54;
                                }
                                const byi = _inl_54_result;
                                _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                            }
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                const _sroa_38 = load_hall_E(ix, iy, n_total);
                                const e_sw_x = _sroa_38.x;
                                const e_sw_y = _sroa_38.y;
                                const e_sw_z = _sroa_38.z;
                                const _sroa_39 = load_hall_E((ix + 1), iy, n_total);
                                const e_se_x = _sroa_39.x;
                                const e_se_y = _sroa_39.y;
                                const e_se_z = _sroa_39.z;
                                const _sroa_40 = load_hall_E(ix, (iy + 1), n_total);
                                const e_nw_x = _sroa_40.x;
                                const e_nw_y = _sroa_40.y;
                                const e_nw_z = _sroa_40.z;
                                const _sroa_41 = load_hall_E((ix + 1), (iy + 1), n_total);
                                const e_ne_x = _sroa_41.x;
                                const e_ne_y = _sroa_41.y;
                                const e_ne_z = _sroa_41.z;
                                const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                                const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                                let _inl_55_result;
                                _inl_55: {
                                    _inl_55_result = ((iy * n_total) + ix);
                                    break _inl_55;
                                }
                                const c = _inl_55_result;
                                const _sroa_42_base = ((c) * 4 + 0);
                                const u1_x = _b_U1[_sroa_42_base + 0];
                                const u1_y = _b_U1[_sroa_42_base + 1];
                                const u1_z = _b_U1[_sroa_42_base + 2];
                                const u1_w = _b_U1[_sroa_42_base + 3];
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
                        const _inl_52_flags = _u_U_uniforms_physics_flags;
                        let _inl_52_result;
                        _inl_52: {
                            _inl_52_result = (((_inl_52_flags & FLAG_HALL)) != 0);
                            break _inl_52;
                        }
                        if (((!_inl_52_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                            const _sroa_43 = load_hall_E(ix, iy, n_total);
                            const e0_x = _sroa_43.x;
                            const e0_y = _sroa_43.y;
                            const e0_z = _sroa_43.z;
                            const _sroa_44 = load_hall_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_44.x;
                            const e1_y = _sroa_44.y;
                            const e1_z = _sroa_44.z;
                            let _inl_53_result;
                            _inl_53: {
                                _inl_53_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_53;
                            }
                            const bxi = _inl_53_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_45 = load_hall_E(ix, iy, n_total);
                            const e0_x = _sroa_45.x;
                            const e0_y = _sroa_45.y;
                            const e0_z = _sroa_45.z;
                            const _sroa_46 = load_hall_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_46.x;
                            const e1_y = _sroa_46.y;
                            const e1_z = _sroa_46.z;
                            let _inl_54_result;
                            _inl_54: {
                                _inl_54_result = ((iy * n_total) + ix);
                                break _inl_54;
                            }
                            const byi = _inl_54_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
                            const _sroa_47 = load_hall_E(ix, iy, n_total);
                            const e_sw_x = _sroa_47.x;
                            const e_sw_y = _sroa_47.y;
                            const e_sw_z = _sroa_47.z;
                            const _sroa_48 = load_hall_E((ix + 1), iy, n_total);
                            const e_se_x = _sroa_48.x;
                            const e_se_y = _sroa_48.y;
                            const e_se_z = _sroa_48.z;
                            const _sroa_49 = load_hall_E(ix, (iy + 1), n_total);
                            const e_nw_x = _sroa_49.x;
                            const e_nw_y = _sroa_49.y;
                            const e_nw_z = _sroa_49.z;
                            const _sroa_50 = load_hall_E((ix + 1), (iy + 1), n_total);
                            const e_ne_x = _sroa_50.x;
                            const e_ne_y = _sroa_50.y;
                            const e_ne_z = _sroa_50.z;
                            const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                            const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                            let _inl_55_result;
                            _inl_55: {
                                _inl_55_result = ((iy * n_total) + ix);
                                break _inl_55;
                            }
                            const c = _inl_55_result;
                            const _sroa_51_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_51_base + 0];
                            const u1_y = _b_U1[_sroa_51_base + 1];
                            const u1_z = _b_U1[_sroa_51_base + 2];
                            const u1_w = _b_U1[_sroa_51_base + 3];
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
                    const _inl_52_flags = _u_U_uniforms_physics_flags;
                    let _inl_52_result;
                    _inl_52: {
                        _inl_52_result = (((_inl_52_flags & FLAG_HALL)) != 0);
                        break _inl_52;
                    }
                    if (((!_inl_52_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                        const _sroa_52 = load_hall_E(ix, iy, n_total);
                        const e0_x = _sroa_52.x;
                        const e0_y = _sroa_52.y;
                        const e0_z = _sroa_52.z;
                        const _sroa_53 = load_hall_E(ix, (iy + 1), n_total);
                        const e1_x = _sroa_53.x;
                        const e1_y = _sroa_53.y;
                        const e1_z = _sroa_53.z;
                        let _inl_53_result;
                        _inl_53: {
                            _inl_53_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_53;
                        }
                        const bxi = _inl_53_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                    }
                    if ((gid_x < n_interior)) {
                        const _sroa_54 = load_hall_E(ix, iy, n_total);
                        const e0_x = _sroa_54.x;
                        const e0_y = _sroa_54.y;
                        const e0_z = _sroa_54.z;
                        const _sroa_55 = load_hall_E((ix + 1), iy, n_total);
                        const e1_x = _sroa_55.x;
                        const e1_y = _sroa_55.y;
                        const e1_z = _sroa_55.z;
                        let _inl_54_result;
                        _inl_54: {
                            _inl_54_result = ((iy * n_total) + ix);
                            break _inl_54;
                        }
                        const byi = _inl_54_result;
                        _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        const _sroa_56 = load_hall_E(ix, iy, n_total);
                        const e_sw_x = _sroa_56.x;
                        const e_sw_y = _sroa_56.y;
                        const e_sw_z = _sroa_56.z;
                        const _sroa_57 = load_hall_E((ix + 1), iy, n_total);
                        const e_se_x = _sroa_57.x;
                        const e_se_y = _sroa_57.y;
                        const e_se_z = _sroa_57.z;
                        const _sroa_58 = load_hall_E(ix, (iy + 1), n_total);
                        const e_nw_x = _sroa_58.x;
                        const e_nw_y = _sroa_58.y;
                        const e_nw_z = _sroa_58.z;
                        const _sroa_59 = load_hall_E((ix + 1), (iy + 1), n_total);
                        const e_ne_x = _sroa_59.x;
                        const e_ne_y = _sroa_59.y;
                        const e_ne_z = _sroa_59.z;
                        const dEy_dx = ((0.5 * ((((e_se_y + e_ne_y)) - ((e_sw_y + e_nw_y))))) / _u_U_uniforms_dx);
                        const dEx_dy = ((0.5 * ((((e_nw_x + e_ne_x)) - ((e_sw_x + e_se_x))))) / _u_U_uniforms_dx);
                        let _inl_55_result;
                        _inl_55: {
                            _inl_55_result = ((iy * n_total) + ix);
                            break _inl_55;
                        }
                        const c = _inl_55_result;
                        const _sroa_60_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_60_base + 0];
                        const u1_y = _b_U1[_sroa_60_base + 1];
                        const u1_z = _b_U1[_sroa_60_base + 2];
                        const u1_w = _b_U1[_sroa_60_base + 3];
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
    entry["apply_hall_update"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_apply_hall_update(workgroups, bindings, domain, origin);
    };

    entryInfo["repair_hall_energy"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_repair_hall_energy(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_hall_di = _b_U_uniforms.hall_di;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
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
                    const _inl_56_flags = _u_U_uniforms_physics_flags;
                    let _inl_56_result;
                    _inl_56: {
                        _inl_56_result = (((_inl_56_flags & FLAG_HALL)) != 0);
                        break _inl_56;
                    }
                    if (((!_inl_56_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                    let _inl_57_result;
                    _inl_57: {
                        _inl_57_result = ((iy * n_total) + ix);
                        break _inl_57;
                    }
                    const c = _inl_57_result;
                    const _sroa_61_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_61_base + 0];
                    const u0_y = _b_U0[_sroa_61_base + 1];
                    const u0_z = _b_U0[_sroa_61_base + 2];
                    const u0_w = _b_U0[_sroa_61_base + 3];
                    const _sroa_62_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_62_base + 0];
                    const u1_y = _b_U1[_sroa_62_base + 1];
                    const u1_z = _b_U1[_sroa_62_base + 2];
                    const u1_w = _b_U1[_sroa_62_base + 3];
                    let _inl_58_result;
                    _inl_58: {
                        let _inl_58__inl_32_result;
                        _inl_58__inl_32: {
                            _inl_58__inl_32_result = ((iy * n_total) + ix);
                            break _inl_58__inl_32;
                        }
                        const _sroa_63_base = ((_inl_58__inl_32_result) * 4 + 0);
                        const _inl_58_u1_x = _b_U1[_sroa_63_base + 0];
                        const _inl_58_u1_y = _b_U1[_sroa_63_base + 1];
                        const _inl_58_u1_z = _b_U1[_sroa_63_base + 2];
                        const _inl_58_u1_w = _b_U1[_sroa_63_base + 3];
                        let _inl_58__inl_33_result;
                        _inl_58__inl_33: {
                            let _inl_58__inl_33__inl_6_result;
                            _inl_58__inl_33__inl_6: {
                                _inl_58__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_58__inl_33__inl_6;
                            }
                            const _inl_58__inl_33__inl_7_ix = (ix + 1);
                            let _inl_58__inl_33__inl_7_result;
                            _inl_58__inl_33__inl_7: {
                                _inl_58__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_58__inl_33__inl_7_ix);
                                break _inl_58__inl_33__inl_7;
                            }
                            _inl_58__inl_33_result = (0.5 * ((_b_Bx_face[_inl_58__inl_33__inl_6_result] + _b_Bx_face[_inl_58__inl_33__inl_7_result])));
                            break _inl_58__inl_33;
                        }
                        const _inl_58_bx_c = _inl_58__inl_33_result;
                        let _inl_58__inl_34_result;
                        _inl_58__inl_34: {
                            let _inl_58__inl_34__inl_8_result;
                            _inl_58__inl_34__inl_8: {
                                _inl_58__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_58__inl_34__inl_8;
                            }
                            const _inl_58__inl_34__inl_9_iy = (iy + 1);
                            let _inl_58__inl_34__inl_9_result;
                            _inl_58__inl_34__inl_9: {
                                _inl_58__inl_34__inl_9_result = ((_inl_58__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_58__inl_34__inl_9;
                            }
                            _inl_58__inl_34_result = (0.5 * ((_b_By_face[_inl_58__inl_34__inl_8_result] + _b_By_face[_inl_58__inl_34__inl_9_result])));
                            break _inl_58__inl_34;
                        }
                        const _inl_58_by_c = _inl_58__inl_34_result;
                        _inl_58_result = (0.5 * ((((_inl_58_bx_c * _inl_58_bx_c) + (_inl_58_by_c * _inl_58_by_c)) + (_inl_58_u1_y * _inl_58_u1_y))));
                        break _inl_58;
                    }
                    const dmb = (_inl_58_result - _b_hall_mb0[c]);
                    const E = (u1_x + dmb);
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    let _inl_59_result;
                    _inl_59: {
                        let _inl_59__inl_32_result;
                        _inl_59__inl_32: {
                            _inl_59__inl_32_result = ((iy * n_total) + ix);
                            break _inl_59__inl_32;
                        }
                        const _sroa_64_base = ((_inl_59__inl_32_result) * 4 + 0);
                        const _inl_59_u1_x = _b_U1[_sroa_64_base + 0];
                        const _inl_59_u1_y = _b_U1[_sroa_64_base + 1];
                        const _inl_59_u1_z = _b_U1[_sroa_64_base + 2];
                        const _inl_59_u1_w = _b_U1[_sroa_64_base + 3];
                        let _inl_59__inl_33_result;
                        _inl_59__inl_33: {
                            let _inl_59__inl_33__inl_6_result;
                            _inl_59__inl_33__inl_6: {
                                _inl_59__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_59__inl_33__inl_6;
                            }
                            const _inl_59__inl_33__inl_7_ix = (ix + 1);
                            let _inl_59__inl_33__inl_7_result;
                            _inl_59__inl_33__inl_7: {
                                _inl_59__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_59__inl_33__inl_7_ix);
                                break _inl_59__inl_33__inl_7;
                            }
                            _inl_59__inl_33_result = (0.5 * ((_b_Bx_face[_inl_59__inl_33__inl_6_result] + _b_Bx_face[_inl_59__inl_33__inl_7_result])));
                            break _inl_59__inl_33;
                        }
                        const _inl_59_bx_c = _inl_59__inl_33_result;
                        let _inl_59__inl_34_result;
                        _inl_59__inl_34: {
                            let _inl_59__inl_34__inl_8_result;
                            _inl_59__inl_34__inl_8: {
                                _inl_59__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_59__inl_34__inl_8;
                            }
                            const _inl_59__inl_34__inl_9_iy = (iy + 1);
                            let _inl_59__inl_34__inl_9_result;
                            _inl_59__inl_34__inl_9: {
                                _inl_59__inl_34__inl_9_result = ((_inl_59__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_59__inl_34__inl_9;
                            }
                            _inl_59__inl_34_result = (0.5 * ((_b_By_face[_inl_59__inl_34__inl_8_result] + _b_By_face[_inl_59__inl_34__inl_9_result])));
                            break _inl_59__inl_34;
                        }
                        const _inl_59_by_c = _inl_59__inl_34_result;
                        _inl_59_result = (0.5 * ((((_inl_59_bx_c * _inl_59_bx_c) + (_inl_59_by_c * _inl_59_by_c)) + (_inl_59_u1_y * _inl_59_u1_y))));
                        break _inl_59;
                    }
                    const mb = _inl_59_result;
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    const _inl_60_bz = u1_y;
                    const _inl_60_gamma = _u_U_uniforms_gamma;
                    const _inl_60_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_60_result_x, _inl_60_result_y, _inl_60_result_z, _inl_60_result_w;
                    _inl_60: {
                        const _inl_60_p_safe = ((p) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (p));
                        const _inl_60_eth = (_inl_60_p_safe / (((_inl_60_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_60_gamma - 1.0))));
                        let _inl_60__inl_4_result;
                        _inl_60__inl_4: {
                            _inl_60__inl_4_result = (((_inl_60_p_safe) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (_inl_60_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_60_gamma));
                            break _inl_60__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_60_bz;
                        const _ir2 = _inl_60_eth;
                        const _ir3 = _inl_60__inl_4_result;
                        _inl_60_result_x = _ir0;
                        _inl_60_result_y = _ir1;
                        _inl_60_result_z = _ir2;
                        _inl_60_result_w = _ir3;
                        break _inl_60;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_60_result_x;
                        const _wt1 = _inl_60_result_y;
                        const _wt2 = _inl_60_result_z;
                        const _wt3 = _inl_60_result_w;
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
                            const _inl_56_flags = _u_U_uniforms_physics_flags;
                            let _inl_56_result;
                            _inl_56: {
                                _inl_56_result = (((_inl_56_flags & FLAG_HALL)) != 0);
                                break _inl_56;
                            }
                            if (((!_inl_56_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                            let _inl_57_result;
                            _inl_57: {
                                _inl_57_result = ((iy * n_total) + ix);
                                break _inl_57;
                            }
                            const c = _inl_57_result;
                            const _sroa_65_base = ((c) * 4 + 0);
                            const u0_x = _b_U0[_sroa_65_base + 0];
                            const u0_y = _b_U0[_sroa_65_base + 1];
                            const u0_z = _b_U0[_sroa_65_base + 2];
                            const u0_w = _b_U0[_sroa_65_base + 3];
                            const _sroa_66_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_66_base + 0];
                            const u1_y = _b_U1[_sroa_66_base + 1];
                            const u1_z = _b_U1[_sroa_66_base + 2];
                            const u1_w = _b_U1[_sroa_66_base + 3];
                            let _inl_58_result;
                            _inl_58: {
                                let _inl_58__inl_32_result;
                                _inl_58__inl_32: {
                                    _inl_58__inl_32_result = ((iy * n_total) + ix);
                                    break _inl_58__inl_32;
                                }
                                const _sroa_67_base = ((_inl_58__inl_32_result) * 4 + 0);
                                const _inl_58_u1_x = _b_U1[_sroa_67_base + 0];
                                const _inl_58_u1_y = _b_U1[_sroa_67_base + 1];
                                const _inl_58_u1_z = _b_U1[_sroa_67_base + 2];
                                const _inl_58_u1_w = _b_U1[_sroa_67_base + 3];
                                let _inl_58__inl_33_result;
                                _inl_58__inl_33: {
                                    let _inl_58__inl_33__inl_6_result;
                                    _inl_58__inl_33__inl_6: {
                                        _inl_58__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_58__inl_33__inl_6;
                                    }
                                    const _inl_58__inl_33__inl_7_ix = (ix + 1);
                                    let _inl_58__inl_33__inl_7_result;
                                    _inl_58__inl_33__inl_7: {
                                        _inl_58__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_58__inl_33__inl_7_ix);
                                        break _inl_58__inl_33__inl_7;
                                    }
                                    _inl_58__inl_33_result = (0.5 * ((_b_Bx_face[_inl_58__inl_33__inl_6_result] + _b_Bx_face[_inl_58__inl_33__inl_7_result])));
                                    break _inl_58__inl_33;
                                }
                                const _inl_58_bx_c = _inl_58__inl_33_result;
                                let _inl_58__inl_34_result;
                                _inl_58__inl_34: {
                                    let _inl_58__inl_34__inl_8_result;
                                    _inl_58__inl_34__inl_8: {
                                        _inl_58__inl_34__inl_8_result = ((iy * n_total) + ix);
                                        break _inl_58__inl_34__inl_8;
                                    }
                                    const _inl_58__inl_34__inl_9_iy = (iy + 1);
                                    let _inl_58__inl_34__inl_9_result;
                                    _inl_58__inl_34__inl_9: {
                                        _inl_58__inl_34__inl_9_result = ((_inl_58__inl_34__inl_9_iy * n_total) + ix);
                                        break _inl_58__inl_34__inl_9;
                                    }
                                    _inl_58__inl_34_result = (0.5 * ((_b_By_face[_inl_58__inl_34__inl_8_result] + _b_By_face[_inl_58__inl_34__inl_9_result])));
                                    break _inl_58__inl_34;
                                }
                                const _inl_58_by_c = _inl_58__inl_34_result;
                                _inl_58_result = (0.5 * ((((_inl_58_bx_c * _inl_58_bx_c) + (_inl_58_by_c * _inl_58_by_c)) + (_inl_58_u1_y * _inl_58_u1_y))));
                                break _inl_58;
                            }
                            const dmb = (_inl_58_result - _b_hall_mb0[c]);
                            const E = (u1_x + dmb);
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                            let _inl_59_result;
                            _inl_59: {
                                let _inl_59__inl_32_result;
                                _inl_59__inl_32: {
                                    _inl_59__inl_32_result = ((iy * n_total) + ix);
                                    break _inl_59__inl_32;
                                }
                                const _sroa_68_base = ((_inl_59__inl_32_result) * 4 + 0);
                                const _inl_59_u1_x = _b_U1[_sroa_68_base + 0];
                                const _inl_59_u1_y = _b_U1[_sroa_68_base + 1];
                                const _inl_59_u1_z = _b_U1[_sroa_68_base + 2];
                                const _inl_59_u1_w = _b_U1[_sroa_68_base + 3];
                                let _inl_59__inl_33_result;
                                _inl_59__inl_33: {
                                    let _inl_59__inl_33__inl_6_result;
                                    _inl_59__inl_33__inl_6: {
                                        _inl_59__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_59__inl_33__inl_6;
                                    }
                                    const _inl_59__inl_33__inl_7_ix = (ix + 1);
                                    let _inl_59__inl_33__inl_7_result;
                                    _inl_59__inl_33__inl_7: {
                                        _inl_59__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_59__inl_33__inl_7_ix);
                                        break _inl_59__inl_33__inl_7;
                                    }
                                    _inl_59__inl_33_result = (0.5 * ((_b_Bx_face[_inl_59__inl_33__inl_6_result] + _b_Bx_face[_inl_59__inl_33__inl_7_result])));
                                    break _inl_59__inl_33;
                                }
                                const _inl_59_bx_c = _inl_59__inl_33_result;
                                let _inl_59__inl_34_result;
                                _inl_59__inl_34: {
                                    let _inl_59__inl_34__inl_8_result;
                                    _inl_59__inl_34__inl_8: {
                                        _inl_59__inl_34__inl_8_result = ((iy * n_total) + ix);
                                        break _inl_59__inl_34__inl_8;
                                    }
                                    const _inl_59__inl_34__inl_9_iy = (iy + 1);
                                    let _inl_59__inl_34__inl_9_result;
                                    _inl_59__inl_34__inl_9: {
                                        _inl_59__inl_34__inl_9_result = ((_inl_59__inl_34__inl_9_iy * n_total) + ix);
                                        break _inl_59__inl_34__inl_9;
                                    }
                                    _inl_59__inl_34_result = (0.5 * ((_b_By_face[_inl_59__inl_34__inl_8_result] + _b_By_face[_inl_59__inl_34__inl_9_result])));
                                    break _inl_59__inl_34;
                                }
                                const _inl_59_by_c = _inl_59__inl_34_result;
                                _inl_59_result = (0.5 * ((((_inl_59_bx_c * _inl_59_bx_c) + (_inl_59_by_c * _inl_59_by_c)) + (_inl_59_u1_y * _inl_59_u1_y))));
                                break _inl_59;
                            }
                            const mb = _inl_59_result;
                            const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                            const _inl_60_bz = u1_y;
                            const _inl_60_gamma = _u_U_uniforms_gamma;
                            const _inl_60_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_60_result_x, _inl_60_result_y, _inl_60_result_z, _inl_60_result_w;
                            _inl_60: {
                                const _inl_60_p_safe = ((p) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (p));
                                const _inl_60_eth = (_inl_60_p_safe / (((_inl_60_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_60_gamma - 1.0))));
                                let _inl_60__inl_4_result;
                                _inl_60__inl_4: {
                                    _inl_60__inl_4_result = (((_inl_60_p_safe) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (_inl_60_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_60_gamma));
                                    break _inl_60__inl_4;
                                }
                                const _ir0 = E;
                                const _ir1 = _inl_60_bz;
                                const _ir2 = _inl_60_eth;
                                const _ir3 = _inl_60__inl_4_result;
                                _inl_60_result_x = _ir0;
                                _inl_60_result_y = _ir1;
                                _inl_60_result_z = _ir2;
                                _inl_60_result_w = _ir3;
                                break _inl_60;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_60_result_x;
                                const _wt1 = _inl_60_result_y;
                                const _wt2 = _inl_60_result_z;
                                const _wt3 = _inl_60_result_w;
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
                        const _inl_56_flags = _u_U_uniforms_physics_flags;
                        let _inl_56_result;
                        _inl_56: {
                            _inl_56_result = (((_inl_56_flags & FLAG_HALL)) != 0);
                            break _inl_56;
                        }
                        if (((!_inl_56_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                        let _inl_57_result;
                        _inl_57: {
                            _inl_57_result = ((iy * n_total) + ix);
                            break _inl_57;
                        }
                        const c = _inl_57_result;
                        const _sroa_69_base = ((c) * 4 + 0);
                        const u0_x = _b_U0[_sroa_69_base + 0];
                        const u0_y = _b_U0[_sroa_69_base + 1];
                        const u0_z = _b_U0[_sroa_69_base + 2];
                        const u0_w = _b_U0[_sroa_69_base + 3];
                        const _sroa_70_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_70_base + 0];
                        const u1_y = _b_U1[_sroa_70_base + 1];
                        const u1_z = _b_U1[_sroa_70_base + 2];
                        const u1_w = _b_U1[_sroa_70_base + 3];
                        let _inl_58_result;
                        _inl_58: {
                            let _inl_58__inl_32_result;
                            _inl_58__inl_32: {
                                _inl_58__inl_32_result = ((iy * n_total) + ix);
                                break _inl_58__inl_32;
                            }
                            const _sroa_71_base = ((_inl_58__inl_32_result) * 4 + 0);
                            const _inl_58_u1_x = _b_U1[_sroa_71_base + 0];
                            const _inl_58_u1_y = _b_U1[_sroa_71_base + 1];
                            const _inl_58_u1_z = _b_U1[_sroa_71_base + 2];
                            const _inl_58_u1_w = _b_U1[_sroa_71_base + 3];
                            let _inl_58__inl_33_result;
                            _inl_58__inl_33: {
                                let _inl_58__inl_33__inl_6_result;
                                _inl_58__inl_33__inl_6: {
                                    _inl_58__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_58__inl_33__inl_6;
                                }
                                const _inl_58__inl_33__inl_7_ix = (ix + 1);
                                let _inl_58__inl_33__inl_7_result;
                                _inl_58__inl_33__inl_7: {
                                    _inl_58__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_58__inl_33__inl_7_ix);
                                    break _inl_58__inl_33__inl_7;
                                }
                                _inl_58__inl_33_result = (0.5 * ((_b_Bx_face[_inl_58__inl_33__inl_6_result] + _b_Bx_face[_inl_58__inl_33__inl_7_result])));
                                break _inl_58__inl_33;
                            }
                            const _inl_58_bx_c = _inl_58__inl_33_result;
                            let _inl_58__inl_34_result;
                            _inl_58__inl_34: {
                                let _inl_58__inl_34__inl_8_result;
                                _inl_58__inl_34__inl_8: {
                                    _inl_58__inl_34__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_58__inl_34__inl_8;
                                }
                                const _inl_58__inl_34__inl_9_iy = (iy + 1);
                                let _inl_58__inl_34__inl_9_result;
                                _inl_58__inl_34__inl_9: {
                                    _inl_58__inl_34__inl_9_result = ((_inl_58__inl_34__inl_9_iy * n_total) + ix);
                                    break _inl_58__inl_34__inl_9;
                                }
                                _inl_58__inl_34_result = (0.5 * ((_b_By_face[_inl_58__inl_34__inl_8_result] + _b_By_face[_inl_58__inl_34__inl_9_result])));
                                break _inl_58__inl_34;
                            }
                            const _inl_58_by_c = _inl_58__inl_34_result;
                            _inl_58_result = (0.5 * ((((_inl_58_bx_c * _inl_58_bx_c) + (_inl_58_by_c * _inl_58_by_c)) + (_inl_58_u1_y * _inl_58_u1_y))));
                            break _inl_58;
                        }
                        const dmb = (_inl_58_result - _b_hall_mb0[c]);
                        const E = (u1_x + dmb);
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                        let _inl_59_result;
                        _inl_59: {
                            let _inl_59__inl_32_result;
                            _inl_59__inl_32: {
                                _inl_59__inl_32_result = ((iy * n_total) + ix);
                                break _inl_59__inl_32;
                            }
                            const _sroa_72_base = ((_inl_59__inl_32_result) * 4 + 0);
                            const _inl_59_u1_x = _b_U1[_sroa_72_base + 0];
                            const _inl_59_u1_y = _b_U1[_sroa_72_base + 1];
                            const _inl_59_u1_z = _b_U1[_sroa_72_base + 2];
                            const _inl_59_u1_w = _b_U1[_sroa_72_base + 3];
                            let _inl_59__inl_33_result;
                            _inl_59__inl_33: {
                                let _inl_59__inl_33__inl_6_result;
                                _inl_59__inl_33__inl_6: {
                                    _inl_59__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_59__inl_33__inl_6;
                                }
                                const _inl_59__inl_33__inl_7_ix = (ix + 1);
                                let _inl_59__inl_33__inl_7_result;
                                _inl_59__inl_33__inl_7: {
                                    _inl_59__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_59__inl_33__inl_7_ix);
                                    break _inl_59__inl_33__inl_7;
                                }
                                _inl_59__inl_33_result = (0.5 * ((_b_Bx_face[_inl_59__inl_33__inl_6_result] + _b_Bx_face[_inl_59__inl_33__inl_7_result])));
                                break _inl_59__inl_33;
                            }
                            const _inl_59_bx_c = _inl_59__inl_33_result;
                            let _inl_59__inl_34_result;
                            _inl_59__inl_34: {
                                let _inl_59__inl_34__inl_8_result;
                                _inl_59__inl_34__inl_8: {
                                    _inl_59__inl_34__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_59__inl_34__inl_8;
                                }
                                const _inl_59__inl_34__inl_9_iy = (iy + 1);
                                let _inl_59__inl_34__inl_9_result;
                                _inl_59__inl_34__inl_9: {
                                    _inl_59__inl_34__inl_9_result = ((_inl_59__inl_34__inl_9_iy * n_total) + ix);
                                    break _inl_59__inl_34__inl_9;
                                }
                                _inl_59__inl_34_result = (0.5 * ((_b_By_face[_inl_59__inl_34__inl_8_result] + _b_By_face[_inl_59__inl_34__inl_9_result])));
                                break _inl_59__inl_34;
                            }
                            const _inl_59_by_c = _inl_59__inl_34_result;
                            _inl_59_result = (0.5 * ((((_inl_59_bx_c * _inl_59_bx_c) + (_inl_59_by_c * _inl_59_by_c)) + (_inl_59_u1_y * _inl_59_u1_y))));
                            break _inl_59;
                        }
                        const mb = _inl_59_result;
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                        const _inl_60_bz = u1_y;
                        const _inl_60_gamma = _u_U_uniforms_gamma;
                        const _inl_60_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_60_result_x, _inl_60_result_y, _inl_60_result_z, _inl_60_result_w;
                        _inl_60: {
                            const _inl_60_p_safe = ((p) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (p));
                            const _inl_60_eth = (_inl_60_p_safe / (((_inl_60_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_60_gamma - 1.0))));
                            let _inl_60__inl_4_result;
                            _inl_60__inl_4: {
                                _inl_60__inl_4_result = (((_inl_60_p_safe) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (_inl_60_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_60_gamma));
                                break _inl_60__inl_4;
                            }
                            const _ir0 = E;
                            const _ir1 = _inl_60_bz;
                            const _ir2 = _inl_60_eth;
                            const _ir3 = _inl_60__inl_4_result;
                            _inl_60_result_x = _ir0;
                            _inl_60_result_y = _ir1;
                            _inl_60_result_z = _ir2;
                            _inl_60_result_w = _ir3;
                            break _inl_60;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_60_result_x;
                            const _wt1 = _inl_60_result_y;
                            const _wt2 = _inl_60_result_z;
                            const _wt3 = _inl_60_result_w;
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
                    const _inl_56_flags = _u_U_uniforms_physics_flags;
                    let _inl_56_result;
                    _inl_56: {
                        _inl_56_result = (((_inl_56_flags & FLAG_HALL)) != 0);
                        break _inl_56;
                    }
                    if (((!_inl_56_result) || (_u_U_uniforms_hall_di <= 0.0))) {
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
                    let _inl_57_result;
                    _inl_57: {
                        _inl_57_result = ((iy * n_total) + ix);
                        break _inl_57;
                    }
                    const c = _inl_57_result;
                    const _sroa_73_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_73_base + 0];
                    const u0_y = _b_U0[_sroa_73_base + 1];
                    const u0_z = _b_U0[_sroa_73_base + 2];
                    const u0_w = _b_U0[_sroa_73_base + 3];
                    const _sroa_74_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_74_base + 0];
                    const u1_y = _b_U1[_sroa_74_base + 1];
                    const u1_z = _b_U1[_sroa_74_base + 2];
                    const u1_w = _b_U1[_sroa_74_base + 3];
                    let _inl_58_result;
                    _inl_58: {
                        let _inl_58__inl_32_result;
                        _inl_58__inl_32: {
                            _inl_58__inl_32_result = ((iy * n_total) + ix);
                            break _inl_58__inl_32;
                        }
                        const _sroa_75_base = ((_inl_58__inl_32_result) * 4 + 0);
                        const _inl_58_u1_x = _b_U1[_sroa_75_base + 0];
                        const _inl_58_u1_y = _b_U1[_sroa_75_base + 1];
                        const _inl_58_u1_z = _b_U1[_sroa_75_base + 2];
                        const _inl_58_u1_w = _b_U1[_sroa_75_base + 3];
                        let _inl_58__inl_33_result;
                        _inl_58__inl_33: {
                            let _inl_58__inl_33__inl_6_result;
                            _inl_58__inl_33__inl_6: {
                                _inl_58__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_58__inl_33__inl_6;
                            }
                            const _inl_58__inl_33__inl_7_ix = (ix + 1);
                            let _inl_58__inl_33__inl_7_result;
                            _inl_58__inl_33__inl_7: {
                                _inl_58__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_58__inl_33__inl_7_ix);
                                break _inl_58__inl_33__inl_7;
                            }
                            _inl_58__inl_33_result = (0.5 * ((_b_Bx_face[_inl_58__inl_33__inl_6_result] + _b_Bx_face[_inl_58__inl_33__inl_7_result])));
                            break _inl_58__inl_33;
                        }
                        const _inl_58_bx_c = _inl_58__inl_33_result;
                        let _inl_58__inl_34_result;
                        _inl_58__inl_34: {
                            let _inl_58__inl_34__inl_8_result;
                            _inl_58__inl_34__inl_8: {
                                _inl_58__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_58__inl_34__inl_8;
                            }
                            const _inl_58__inl_34__inl_9_iy = (iy + 1);
                            let _inl_58__inl_34__inl_9_result;
                            _inl_58__inl_34__inl_9: {
                                _inl_58__inl_34__inl_9_result = ((_inl_58__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_58__inl_34__inl_9;
                            }
                            _inl_58__inl_34_result = (0.5 * ((_b_By_face[_inl_58__inl_34__inl_8_result] + _b_By_face[_inl_58__inl_34__inl_9_result])));
                            break _inl_58__inl_34;
                        }
                        const _inl_58_by_c = _inl_58__inl_34_result;
                        _inl_58_result = (0.5 * ((((_inl_58_bx_c * _inl_58_bx_c) + (_inl_58_by_c * _inl_58_by_c)) + (_inl_58_u1_y * _inl_58_u1_y))));
                        break _inl_58;
                    }
                    const dmb = (_inl_58_result - _b_hall_mb0[c]);
                    const E = (u1_x + dmb);
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    let _inl_59_result;
                    _inl_59: {
                        let _inl_59__inl_32_result;
                        _inl_59__inl_32: {
                            _inl_59__inl_32_result = ((iy * n_total) + ix);
                            break _inl_59__inl_32;
                        }
                        const _sroa_76_base = ((_inl_59__inl_32_result) * 4 + 0);
                        const _inl_59_u1_x = _b_U1[_sroa_76_base + 0];
                        const _inl_59_u1_y = _b_U1[_sroa_76_base + 1];
                        const _inl_59_u1_z = _b_U1[_sroa_76_base + 2];
                        const _inl_59_u1_w = _b_U1[_sroa_76_base + 3];
                        let _inl_59__inl_33_result;
                        _inl_59__inl_33: {
                            let _inl_59__inl_33__inl_6_result;
                            _inl_59__inl_33__inl_6: {
                                _inl_59__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_59__inl_33__inl_6;
                            }
                            const _inl_59__inl_33__inl_7_ix = (ix + 1);
                            let _inl_59__inl_33__inl_7_result;
                            _inl_59__inl_33__inl_7: {
                                _inl_59__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_59__inl_33__inl_7_ix);
                                break _inl_59__inl_33__inl_7;
                            }
                            _inl_59__inl_33_result = (0.5 * ((_b_Bx_face[_inl_59__inl_33__inl_6_result] + _b_Bx_face[_inl_59__inl_33__inl_7_result])));
                            break _inl_59__inl_33;
                        }
                        const _inl_59_bx_c = _inl_59__inl_33_result;
                        let _inl_59__inl_34_result;
                        _inl_59__inl_34: {
                            let _inl_59__inl_34__inl_8_result;
                            _inl_59__inl_34__inl_8: {
                                _inl_59__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_59__inl_34__inl_8;
                            }
                            const _inl_59__inl_34__inl_9_iy = (iy + 1);
                            let _inl_59__inl_34__inl_9_result;
                            _inl_59__inl_34__inl_9: {
                                _inl_59__inl_34__inl_9_result = ((_inl_59__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_59__inl_34__inl_9;
                            }
                            _inl_59__inl_34_result = (0.5 * ((_b_By_face[_inl_59__inl_34__inl_8_result] + _b_By_face[_inl_59__inl_34__inl_9_result])));
                            break _inl_59__inl_34;
                        }
                        const _inl_59_by_c = _inl_59__inl_34_result;
                        _inl_59_result = (0.5 * ((((_inl_59_bx_c * _inl_59_bx_c) + (_inl_59_by_c * _inl_59_by_c)) + (_inl_59_u1_y * _inl_59_u1_y))));
                        break _inl_59;
                    }
                    const mb = _inl_59_result;
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    const _inl_60_bz = u1_y;
                    const _inl_60_gamma = _u_U_uniforms_gamma;
                    const _inl_60_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_60_result_x, _inl_60_result_y, _inl_60_result_z, _inl_60_result_w;
                    _inl_60: {
                        const _inl_60_p_safe = ((p) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (p));
                        const _inl_60_eth = (_inl_60_p_safe / (((_inl_60_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_60_gamma - 1.0))));
                        let _inl_60__inl_4_result;
                        _inl_60__inl_4: {
                            _inl_60__inl_4_result = (((_inl_60_p_safe) < (_inl_60_p_floor) ? (_inl_60_p_floor) : (_inl_60_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_60_gamma));
                            break _inl_60__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = _inl_60_bz;
                        const _ir2 = _inl_60_eth;
                        const _ir3 = _inl_60__inl_4_result;
                        _inl_60_result_x = _ir0;
                        _inl_60_result_y = _ir1;
                        _inl_60_result_z = _ir2;
                        _inl_60_result_w = _ir3;
                        break _inl_60;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_60_result_x;
                        const _wt1 = _inl_60_result_y;
                        const _wt2 = _inl_60_result_z;
                        const _wt3 = _inl_60_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["repair_hall_energy"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_repair_hall_energy(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_dissipative_update"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_apply_dissipative_update(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_hall_electron_pressure_frac = _b_U_uniforms.hall_electron_pressure_frac;
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_neutral_frac = _b_U_uniforms.neutral_frac;
        const _u_U_uniforms_electron_inertia_length = _b_U_uniforms.electron_inertia_length;
        const _u_U_uniforms_electron_inertia_damping = _b_U_uniforms.electron_inertia_damping;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_ohm_E = bindings.ohm_E;
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
                    const _inl_61_flags = _u_U_uniforms_physics_flags;
                    let _inl_61_result;
                    _inl_61: {
                        _inl_61_result = (((_inl_61_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_61;
                    }
                    const ambi_on = ((_inl_61_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_62_flags = _u_U_uniforms_physics_flags;
                    let _inl_62_result;
                    _inl_62: {
                        _inl_62_result = (((_inl_62_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_62;
                    }
                    const electron_inertia_on = ((_inl_62_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                    const nonhall_on = (ambi_on || electron_inertia_on);
                    const _inl_63_flags = _u_U_uniforms_physics_flags;
                    let _inl_63_result;
                    _inl_63: {
                        _inl_63_result = (((_inl_63_flags & FLAG_BIERMANN)) != 0);
                        break _inl_63;
                    }
                    const biermann_on = ((_inl_63_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!nonhall_on) && (!biermann_on))) {
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
                    if (nonhall_on) {
                        if ((gid_y < n_interior)) {
                            const _sroa_77 = load_ambipolar_E(ix, iy, n_total);
                            const e0_x = _sroa_77.x;
                            const e0_y = _sroa_77.y;
                            const e0_z = _sroa_77.z;
                            const _sroa_78 = load_ambipolar_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_78.x;
                            const e1_y = _sroa_78.y;
                            const e1_z = _sroa_78.z;
                            let _inl_64_result;
                            _inl_64: {
                                _inl_64_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_64;
                            }
                            const bxi = _inl_64_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_79 = load_ambipolar_E(ix, iy, n_total);
                            const e0_x = _sroa_79.x;
                            const e0_y = _sroa_79.y;
                            const e0_z = _sroa_79.z;
                            const _sroa_80 = load_ambipolar_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_80.x;
                            const e1_y = _sroa_80.y;
                            const e1_z = _sroa_80.z;
                            let _inl_65_result;
                            _inl_65: {
                                _inl_65_result = ((iy * n_total) + ix);
                                break _inl_65;
                            }
                            const byi = _inl_65_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_66_result;
                        _inl_66: {
                            _inl_66_result = ((iy * n_total) + ix);
                            break _inl_66;
                        }
                        const c = _inl_66_result;
                        const _sroa_81_base = ((c) * 4 + 0);
                        let u1_x = _b_U1[_sroa_81_base + 0];
                        let u1_y = _b_U1[_sroa_81_base + 1];
                        let u1_z = _b_U1[_sroa_81_base + 2];
                        let u1_w = _b_U1[_sroa_81_base + 3];
                        if (nonhall_on) {
                            const _sroa_82 = load_ambipolar_E(ix, iy, n_total);
                            const e_sw_x = _sroa_82.x;
                            const e_sw_y = _sroa_82.y;
                            const e_sw_z = _sroa_82.z;
                            const _sroa_83 = load_ambipolar_E((ix + 1), iy, n_total);
                            const e_se_x = _sroa_83.x;
                            const e_se_y = _sroa_83.y;
                            const e_se_z = _sroa_83.z;
                            const _sroa_84 = load_ambipolar_E(ix, (iy + 1), n_total);
                            const e_nw_x = _sroa_84.x;
                            const e_nw_y = _sroa_84.y;
                            const e_nw_z = _sroa_84.z;
                            const _sroa_85 = load_ambipolar_E((ix + 1), (iy + 1), n_total);
                            const e_ne_x = _sroa_85.x;
                            const e_ne_y = _sroa_85.y;
                            const e_ne_z = _sroa_85.z;
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
                            let _inl_67_result;
                            _inl_67: {
                                _inl_67_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_67;
                            }
                            const b = _b_ohm_E[((_inl_67_result) * 4 + 0) + 3];
                            const p_c = ((cell_pressure_ohm(ix, iy, n_total)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : (cell_pressure_ohm(ix, iy, n_total)));
                            const bz_cap = (BIERMANN_DBZ_CAP_FRAC * Math.sqrt((2.0 * p_c)));
                            const dbz = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((b * dt), (-bz_cap), bz_cap));
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + dbz);
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
                            const _inl_61_flags = _u_U_uniforms_physics_flags;
                            let _inl_61_result;
                            _inl_61: {
                                _inl_61_result = (((_inl_61_flags & FLAG_AMBIPOLAR)) != 0);
                                break _inl_61;
                            }
                            const ambi_on = ((_inl_61_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                            const _inl_62_flags = _u_U_uniforms_physics_flags;
                            let _inl_62_result;
                            _inl_62: {
                                _inl_62_result = (((_inl_62_flags & FLAG_ELECTRON_INERTIA)) != 0);
                                break _inl_62;
                            }
                            const electron_inertia_on = ((_inl_62_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                            const nonhall_on = (ambi_on || electron_inertia_on);
                            const _inl_63_flags = _u_U_uniforms_physics_flags;
                            let _inl_63_result;
                            _inl_63: {
                                _inl_63_result = (((_inl_63_flags & FLAG_BIERMANN)) != 0);
                                break _inl_63;
                            }
                            const biermann_on = ((_inl_63_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                            if (((!nonhall_on) && (!biermann_on))) {
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
                            if (nonhall_on) {
                                if ((gid_y < n_interior)) {
                                    const _sroa_86 = load_ambipolar_E(ix, iy, n_total);
                                    const e0_x = _sroa_86.x;
                                    const e0_y = _sroa_86.y;
                                    const e0_z = _sroa_86.z;
                                    const _sroa_87 = load_ambipolar_E(ix, (iy + 1), n_total);
                                    const e1_x = _sroa_87.x;
                                    const e1_y = _sroa_87.y;
                                    const e1_z = _sroa_87.z;
                                    let _inl_64_result;
                                    _inl_64: {
                                        _inl_64_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_64;
                                    }
                                    const bxi = _inl_64_result;
                                    _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                                }
                                if ((gid_x < n_interior)) {
                                    const _sroa_88 = load_ambipolar_E(ix, iy, n_total);
                                    const e0_x = _sroa_88.x;
                                    const e0_y = _sroa_88.y;
                                    const e0_z = _sroa_88.z;
                                    const _sroa_89 = load_ambipolar_E((ix + 1), iy, n_total);
                                    const e1_x = _sroa_89.x;
                                    const e1_y = _sroa_89.y;
                                    const e1_z = _sroa_89.z;
                                    let _inl_65_result;
                                    _inl_65: {
                                        _inl_65_result = ((iy * n_total) + ix);
                                        break _inl_65;
                                    }
                                    const byi = _inl_65_result;
                                    _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                                }
                            }
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                let _inl_66_result;
                                _inl_66: {
                                    _inl_66_result = ((iy * n_total) + ix);
                                    break _inl_66;
                                }
                                const c = _inl_66_result;
                                const _sroa_90_base = ((c) * 4 + 0);
                                let u1_x = _b_U1[_sroa_90_base + 0];
                                let u1_y = _b_U1[_sroa_90_base + 1];
                                let u1_z = _b_U1[_sroa_90_base + 2];
                                let u1_w = _b_U1[_sroa_90_base + 3];
                                if (nonhall_on) {
                                    const _sroa_91 = load_ambipolar_E(ix, iy, n_total);
                                    const e_sw_x = _sroa_91.x;
                                    const e_sw_y = _sroa_91.y;
                                    const e_sw_z = _sroa_91.z;
                                    const _sroa_92 = load_ambipolar_E((ix + 1), iy, n_total);
                                    const e_se_x = _sroa_92.x;
                                    const e_se_y = _sroa_92.y;
                                    const e_se_z = _sroa_92.z;
                                    const _sroa_93 = load_ambipolar_E(ix, (iy + 1), n_total);
                                    const e_nw_x = _sroa_93.x;
                                    const e_nw_y = _sroa_93.y;
                                    const e_nw_z = _sroa_93.z;
                                    const _sroa_94 = load_ambipolar_E((ix + 1), (iy + 1), n_total);
                                    const e_ne_x = _sroa_94.x;
                                    const e_ne_y = _sroa_94.y;
                                    const e_ne_z = _sroa_94.z;
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
                                    let _inl_67_result;
                                    _inl_67: {
                                        _inl_67_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_67;
                                    }
                                    const b = _b_ohm_E[((_inl_67_result) * 4 + 0) + 3];
                                    const p_c = ((cell_pressure_ohm(ix, iy, n_total)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : (cell_pressure_ohm(ix, iy, n_total)));
                                    const bz_cap = (BIERMANN_DBZ_CAP_FRAC * Math.sqrt((2.0 * p_c)));
                                    const dbz = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((b * dt), (-bz_cap), bz_cap));
                                    {
                                        const _wt0 = u1_x;
                                        const _wt1 = (u1_y + dbz);
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
                        const _inl_61_flags = _u_U_uniforms_physics_flags;
                        let _inl_61_result;
                        _inl_61: {
                            _inl_61_result = (((_inl_61_flags & FLAG_AMBIPOLAR)) != 0);
                            break _inl_61;
                        }
                        const ambi_on = ((_inl_61_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                        const _inl_62_flags = _u_U_uniforms_physics_flags;
                        let _inl_62_result;
                        _inl_62: {
                            _inl_62_result = (((_inl_62_flags & FLAG_ELECTRON_INERTIA)) != 0);
                            break _inl_62;
                        }
                        const electron_inertia_on = ((_inl_62_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                        const nonhall_on = (ambi_on || electron_inertia_on);
                        const _inl_63_flags = _u_U_uniforms_physics_flags;
                        let _inl_63_result;
                        _inl_63: {
                            _inl_63_result = (((_inl_63_flags & FLAG_BIERMANN)) != 0);
                            break _inl_63;
                        }
                        const biermann_on = ((_inl_63_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                        if (((!nonhall_on) && (!biermann_on))) {
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
                        if (nonhall_on) {
                            if ((gid_y < n_interior)) {
                                const _sroa_95 = load_ambipolar_E(ix, iy, n_total);
                                const e0_x = _sroa_95.x;
                                const e0_y = _sroa_95.y;
                                const e0_z = _sroa_95.z;
                                const _sroa_96 = load_ambipolar_E(ix, (iy + 1), n_total);
                                const e1_x = _sroa_96.x;
                                const e1_y = _sroa_96.y;
                                const e1_z = _sroa_96.z;
                                let _inl_64_result;
                                _inl_64: {
                                    _inl_64_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_64;
                                }
                                const bxi = _inl_64_result;
                                _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                            }
                            if ((gid_x < n_interior)) {
                                const _sroa_97 = load_ambipolar_E(ix, iy, n_total);
                                const e0_x = _sroa_97.x;
                                const e0_y = _sroa_97.y;
                                const e0_z = _sroa_97.z;
                                const _sroa_98 = load_ambipolar_E((ix + 1), iy, n_total);
                                const e1_x = _sroa_98.x;
                                const e1_y = _sroa_98.y;
                                const e1_z = _sroa_98.z;
                                let _inl_65_result;
                                _inl_65: {
                                    _inl_65_result = ((iy * n_total) + ix);
                                    break _inl_65;
                                }
                                const byi = _inl_65_result;
                                _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                            }
                        }
                        if (((gid_x < n_interior) && (gid_y < n_interior))) {
                            let _inl_66_result;
                            _inl_66: {
                                _inl_66_result = ((iy * n_total) + ix);
                                break _inl_66;
                            }
                            const c = _inl_66_result;
                            const _sroa_99_base = ((c) * 4 + 0);
                            let u1_x = _b_U1[_sroa_99_base + 0];
                            let u1_y = _b_U1[_sroa_99_base + 1];
                            let u1_z = _b_U1[_sroa_99_base + 2];
                            let u1_w = _b_U1[_sroa_99_base + 3];
                            if (nonhall_on) {
                                const _sroa_100 = load_ambipolar_E(ix, iy, n_total);
                                const e_sw_x = _sroa_100.x;
                                const e_sw_y = _sroa_100.y;
                                const e_sw_z = _sroa_100.z;
                                const _sroa_101 = load_ambipolar_E((ix + 1), iy, n_total);
                                const e_se_x = _sroa_101.x;
                                const e_se_y = _sroa_101.y;
                                const e_se_z = _sroa_101.z;
                                const _sroa_102 = load_ambipolar_E(ix, (iy + 1), n_total);
                                const e_nw_x = _sroa_102.x;
                                const e_nw_y = _sroa_102.y;
                                const e_nw_z = _sroa_102.z;
                                const _sroa_103 = load_ambipolar_E((ix + 1), (iy + 1), n_total);
                                const e_ne_x = _sroa_103.x;
                                const e_ne_y = _sroa_103.y;
                                const e_ne_z = _sroa_103.z;
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
                                let _inl_67_result;
                                _inl_67: {
                                    _inl_67_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_67;
                                }
                                const b = _b_ohm_E[((_inl_67_result) * 4 + 0) + 3];
                                const p_c = ((cell_pressure_ohm(ix, iy, n_total)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : (cell_pressure_ohm(ix, iy, n_total)));
                                const bz_cap = (BIERMANN_DBZ_CAP_FRAC * Math.sqrt((2.0 * p_c)));
                                const dbz = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((b * dt), (-bz_cap), bz_cap));
                                {
                                    const _wt0 = u1_x;
                                    const _wt1 = (u1_y + dbz);
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
                    const _inl_61_flags = _u_U_uniforms_physics_flags;
                    let _inl_61_result;
                    _inl_61: {
                        _inl_61_result = (((_inl_61_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_61;
                    }
                    const ambi_on = ((_inl_61_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_62_flags = _u_U_uniforms_physics_flags;
                    let _inl_62_result;
                    _inl_62: {
                        _inl_62_result = (((_inl_62_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_62;
                    }
                    const electron_inertia_on = ((_inl_62_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                    const nonhall_on = (ambi_on || electron_inertia_on);
                    const _inl_63_flags = _u_U_uniforms_physics_flags;
                    let _inl_63_result;
                    _inl_63: {
                        _inl_63_result = (((_inl_63_flags & FLAG_BIERMANN)) != 0);
                        break _inl_63;
                    }
                    const biermann_on = ((_inl_63_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if (((!nonhall_on) && (!biermann_on))) {
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
                    if (nonhall_on) {
                        if ((gid_y < n_interior)) {
                            const _sroa_104 = load_ambipolar_E(ix, iy, n_total);
                            const e0_x = _sroa_104.x;
                            const e0_y = _sroa_104.y;
                            const e0_z = _sroa_104.z;
                            const _sroa_105 = load_ambipolar_E(ix, (iy + 1), n_total);
                            const e1_x = _sroa_105.x;
                            const e1_y = _sroa_105.y;
                            const e1_z = _sroa_105.z;
                            let _inl_64_result;
                            _inl_64: {
                                _inl_64_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_64;
                            }
                            const bxi = _inl_64_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] - (dt_dx * ((e1_z - e0_z))));
                        }
                        if ((gid_x < n_interior)) {
                            const _sroa_106 = load_ambipolar_E(ix, iy, n_total);
                            const e0_x = _sroa_106.x;
                            const e0_y = _sroa_106.y;
                            const e0_z = _sroa_106.z;
                            const _sroa_107 = load_ambipolar_E((ix + 1), iy, n_total);
                            const e1_x = _sroa_107.x;
                            const e1_y = _sroa_107.y;
                            const e1_z = _sroa_107.z;
                            let _inl_65_result;
                            _inl_65: {
                                _inl_65_result = ((iy * n_total) + ix);
                                break _inl_65;
                            }
                            const byi = _inl_65_result;
                            _b_By_face[byi] = (_b_By_face[byi] + (dt_dx * ((e1_z - e0_z))));
                        }
                    }
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        let _inl_66_result;
                        _inl_66: {
                            _inl_66_result = ((iy * n_total) + ix);
                            break _inl_66;
                        }
                        const c = _inl_66_result;
                        const _sroa_108_base = ((c) * 4 + 0);
                        let u1_x = _b_U1[_sroa_108_base + 0];
                        let u1_y = _b_U1[_sroa_108_base + 1];
                        let u1_z = _b_U1[_sroa_108_base + 2];
                        let u1_w = _b_U1[_sroa_108_base + 3];
                        if (nonhall_on) {
                            const _sroa_109 = load_ambipolar_E(ix, iy, n_total);
                            const e_sw_x = _sroa_109.x;
                            const e_sw_y = _sroa_109.y;
                            const e_sw_z = _sroa_109.z;
                            const _sroa_110 = load_ambipolar_E((ix + 1), iy, n_total);
                            const e_se_x = _sroa_110.x;
                            const e_se_y = _sroa_110.y;
                            const e_se_z = _sroa_110.z;
                            const _sroa_111 = load_ambipolar_E(ix, (iy + 1), n_total);
                            const e_nw_x = _sroa_111.x;
                            const e_nw_y = _sroa_111.y;
                            const e_nw_z = _sroa_111.z;
                            const _sroa_112 = load_ambipolar_E((ix + 1), (iy + 1), n_total);
                            const e_ne_x = _sroa_112.x;
                            const e_ne_y = _sroa_112.y;
                            const e_ne_z = _sroa_112.z;
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
                            let _inl_67_result;
                            _inl_67: {
                                _inl_67_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_67;
                            }
                            const b = _b_ohm_E[((_inl_67_result) * 4 + 0) + 3];
                            const p_c = ((cell_pressure_ohm(ix, iy, n_total)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : (cell_pressure_ohm(ix, iy, n_total)));
                            const bz_cap = (BIERMANN_DBZ_CAP_FRAC * Math.sqrt((2.0 * p_c)));
                            const dbz = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((b * dt), (-bz_cap), bz_cap));
                            {
                                const _wt0 = u1_x;
                                const _wt1 = (u1_y + dbz);
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
    entry["apply_dissipative_update"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_apply_dissipative_update(workgroups, bindings, domain, origin);
    };

    entryInfo["repair_dissipative_energy"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_4_repair_dissipative_energy(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_hall_electron_pressure_frac = _b_U_uniforms.hall_electron_pressure_frac;
        const _u_U_uniforms_ambipolar_eta = _b_U_uniforms.ambipolar_eta;
        const _u_U_uniforms_biermann_coeff = _b_U_uniforms.biermann_coeff;
        const _u_U_uniforms_neutral_frac = _b_U_uniforms.neutral_frac;
        const _u_U_uniforms_electron_inertia_length = _b_U_uniforms.electron_inertia_length;
        const _u_U_uniforms_electron_inertia_damping = _b_U_uniforms.electron_inertia_damping;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
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
                    const _inl_68_flags = _u_U_uniforms_physics_flags;
                    let _inl_68_result;
                    _inl_68: {
                        _inl_68_result = (((_inl_68_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_68;
                    }
                    const ambi_on = ((_inl_68_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_69_flags = _u_U_uniforms_physics_flags;
                    let _inl_69_result;
                    _inl_69: {
                        _inl_69_result = (((_inl_69_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_69;
                    }
                    const electron_inertia_on = ((_inl_69_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                    const _inl_70_flags = _u_U_uniforms_physics_flags;
                    let _inl_70_result;
                    _inl_70: {
                        _inl_70_result = (((_inl_70_flags & FLAG_BIERMANN)) != 0);
                        break _inl_70;
                    }
                    const biermann_on = ((_inl_70_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if ((((!ambi_on) && (!electron_inertia_on)) && (!biermann_on))) {
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
                    let _inl_71_result;
                    _inl_71: {
                        _inl_71_result = ((iy * n_total) + ix);
                        break _inl_71;
                    }
                    const c = _inl_71_result;
                    const _sroa_113_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_113_base + 0];
                    const u0_y = _b_U0[_sroa_113_base + 1];
                    const u0_z = _b_U0[_sroa_113_base + 2];
                    const u0_w = _b_U0[_sroa_113_base + 3];
                    const _sroa_114_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_114_base + 0];
                    const u1_y = _b_U1[_sroa_114_base + 1];
                    const u1_z = _b_U1[_sroa_114_base + 2];
                    const u1_w = _b_U1[_sroa_114_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    let _inl_72_result;
                    _inl_72: {
                        let _inl_72__inl_32_result;
                        _inl_72__inl_32: {
                            _inl_72__inl_32_result = ((iy * n_total) + ix);
                            break _inl_72__inl_32;
                        }
                        const _sroa_115_base = ((_inl_72__inl_32_result) * 4 + 0);
                        const _inl_72_u1_x = _b_U1[_sroa_115_base + 0];
                        const _inl_72_u1_y = _b_U1[_sroa_115_base + 1];
                        const _inl_72_u1_z = _b_U1[_sroa_115_base + 2];
                        const _inl_72_u1_w = _b_U1[_sroa_115_base + 3];
                        let _inl_72__inl_33_result;
                        _inl_72__inl_33: {
                            let _inl_72__inl_33__inl_6_result;
                            _inl_72__inl_33__inl_6: {
                                _inl_72__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_72__inl_33__inl_6;
                            }
                            const _inl_72__inl_33__inl_7_ix = (ix + 1);
                            let _inl_72__inl_33__inl_7_result;
                            _inl_72__inl_33__inl_7: {
                                _inl_72__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_72__inl_33__inl_7_ix);
                                break _inl_72__inl_33__inl_7;
                            }
                            _inl_72__inl_33_result = (0.5 * ((_b_Bx_face[_inl_72__inl_33__inl_6_result] + _b_Bx_face[_inl_72__inl_33__inl_7_result])));
                            break _inl_72__inl_33;
                        }
                        const _inl_72_bx_c = _inl_72__inl_33_result;
                        let _inl_72__inl_34_result;
                        _inl_72__inl_34: {
                            let _inl_72__inl_34__inl_8_result;
                            _inl_72__inl_34__inl_8: {
                                _inl_72__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_72__inl_34__inl_8;
                            }
                            const _inl_72__inl_34__inl_9_iy = (iy + 1);
                            let _inl_72__inl_34__inl_9_result;
                            _inl_72__inl_34__inl_9: {
                                _inl_72__inl_34__inl_9_result = ((_inl_72__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_72__inl_34__inl_9;
                            }
                            _inl_72__inl_34_result = (0.5 * ((_b_By_face[_inl_72__inl_34__inl_8_result] + _b_By_face[_inl_72__inl_34__inl_9_result])));
                            break _inl_72__inl_34;
                        }
                        const _inl_72_by_c = _inl_72__inl_34_result;
                        _inl_72_result = (0.5 * ((((_inl_72_bx_c * _inl_72_bx_c) + (_inl_72_by_c * _inl_72_by_c)) + (_inl_72_u1_y * _inl_72_u1_y))));
                        break _inl_72;
                    }
                    const mb = _inl_72_result;
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))));
                    const _inl_73_E = u1_x;
                    const _inl_73_bz = u1_y;
                    const _inl_73_gamma = _u_U_uniforms_gamma;
                    const _inl_73_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_73_result_x, _inl_73_result_y, _inl_73_result_z, _inl_73_result_w;
                    _inl_73: {
                        const _inl_73_p_safe = ((p) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (p));
                        const _inl_73_eth = (_inl_73_p_safe / (((_inl_73_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_73_gamma - 1.0))));
                        let _inl_73__inl_4_result;
                        _inl_73__inl_4: {
                            _inl_73__inl_4_result = (((_inl_73_p_safe) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (_inl_73_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_73_gamma));
                            break _inl_73__inl_4;
                        }
                        const _ir0 = _inl_73_E;
                        const _ir1 = _inl_73_bz;
                        const _ir2 = _inl_73_eth;
                        const _ir3 = _inl_73__inl_4_result;
                        _inl_73_result_x = _ir0;
                        _inl_73_result_y = _ir1;
                        _inl_73_result_z = _ir2;
                        _inl_73_result_w = _ir3;
                        break _inl_73;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_73_result_x;
                        const _wt1 = _inl_73_result_y;
                        const _wt2 = _inl_73_result_z;
                        const _wt3 = _inl_73_result_w;
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
                            const _inl_68_flags = _u_U_uniforms_physics_flags;
                            let _inl_68_result;
                            _inl_68: {
                                _inl_68_result = (((_inl_68_flags & FLAG_AMBIPOLAR)) != 0);
                                break _inl_68;
                            }
                            const ambi_on = ((_inl_68_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                            const _inl_69_flags = _u_U_uniforms_physics_flags;
                            let _inl_69_result;
                            _inl_69: {
                                _inl_69_result = (((_inl_69_flags & FLAG_ELECTRON_INERTIA)) != 0);
                                break _inl_69;
                            }
                            const electron_inertia_on = ((_inl_69_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                            const _inl_70_flags = _u_U_uniforms_physics_flags;
                            let _inl_70_result;
                            _inl_70: {
                                _inl_70_result = (((_inl_70_flags & FLAG_BIERMANN)) != 0);
                                break _inl_70;
                            }
                            const biermann_on = ((_inl_70_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                            if ((((!ambi_on) && (!electron_inertia_on)) && (!biermann_on))) {
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
                            let _inl_71_result;
                            _inl_71: {
                                _inl_71_result = ((iy * n_total) + ix);
                                break _inl_71;
                            }
                            const c = _inl_71_result;
                            const _sroa_116_base = ((c) * 4 + 0);
                            const u0_x = _b_U0[_sroa_116_base + 0];
                            const u0_y = _b_U0[_sroa_116_base + 1];
                            const u0_z = _b_U0[_sroa_116_base + 2];
                            const u0_w = _b_U0[_sroa_116_base + 3];
                            const _sroa_117_base = ((c) * 4 + 0);
                            const u1_x = _b_U1[_sroa_117_base + 0];
                            const u1_y = _b_U1[_sroa_117_base + 1];
                            const u1_z = _b_U1[_sroa_117_base + 2];
                            const u1_w = _b_U1[_sroa_117_base + 3];
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                            let _inl_72_result;
                            _inl_72: {
                                let _inl_72__inl_32_result;
                                _inl_72__inl_32: {
                                    _inl_72__inl_32_result = ((iy * n_total) + ix);
                                    break _inl_72__inl_32;
                                }
                                const _sroa_118_base = ((_inl_72__inl_32_result) * 4 + 0);
                                const _inl_72_u1_x = _b_U1[_sroa_118_base + 0];
                                const _inl_72_u1_y = _b_U1[_sroa_118_base + 1];
                                const _inl_72_u1_z = _b_U1[_sroa_118_base + 2];
                                const _inl_72_u1_w = _b_U1[_sroa_118_base + 3];
                                let _inl_72__inl_33_result;
                                _inl_72__inl_33: {
                                    let _inl_72__inl_33__inl_6_result;
                                    _inl_72__inl_33__inl_6: {
                                        _inl_72__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_72__inl_33__inl_6;
                                    }
                                    const _inl_72__inl_33__inl_7_ix = (ix + 1);
                                    let _inl_72__inl_33__inl_7_result;
                                    _inl_72__inl_33__inl_7: {
                                        _inl_72__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_72__inl_33__inl_7_ix);
                                        break _inl_72__inl_33__inl_7;
                                    }
                                    _inl_72__inl_33_result = (0.5 * ((_b_Bx_face[_inl_72__inl_33__inl_6_result] + _b_Bx_face[_inl_72__inl_33__inl_7_result])));
                                    break _inl_72__inl_33;
                                }
                                const _inl_72_bx_c = _inl_72__inl_33_result;
                                let _inl_72__inl_34_result;
                                _inl_72__inl_34: {
                                    let _inl_72__inl_34__inl_8_result;
                                    _inl_72__inl_34__inl_8: {
                                        _inl_72__inl_34__inl_8_result = ((iy * n_total) + ix);
                                        break _inl_72__inl_34__inl_8;
                                    }
                                    const _inl_72__inl_34__inl_9_iy = (iy + 1);
                                    let _inl_72__inl_34__inl_9_result;
                                    _inl_72__inl_34__inl_9: {
                                        _inl_72__inl_34__inl_9_result = ((_inl_72__inl_34__inl_9_iy * n_total) + ix);
                                        break _inl_72__inl_34__inl_9;
                                    }
                                    _inl_72__inl_34_result = (0.5 * ((_b_By_face[_inl_72__inl_34__inl_8_result] + _b_By_face[_inl_72__inl_34__inl_9_result])));
                                    break _inl_72__inl_34;
                                }
                                const _inl_72_by_c = _inl_72__inl_34_result;
                                _inl_72_result = (0.5 * ((((_inl_72_bx_c * _inl_72_bx_c) + (_inl_72_by_c * _inl_72_by_c)) + (_inl_72_u1_y * _inl_72_u1_y))));
                                break _inl_72;
                            }
                            const mb = _inl_72_result;
                            const p = (((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))));
                            const _inl_73_E = u1_x;
                            const _inl_73_bz = u1_y;
                            const _inl_73_gamma = _u_U_uniforms_gamma;
                            const _inl_73_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_73_result_x, _inl_73_result_y, _inl_73_result_z, _inl_73_result_w;
                            _inl_73: {
                                const _inl_73_p_safe = ((p) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (p));
                                const _inl_73_eth = (_inl_73_p_safe / (((_inl_73_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_73_gamma - 1.0))));
                                let _inl_73__inl_4_result;
                                _inl_73__inl_4: {
                                    _inl_73__inl_4_result = (((_inl_73_p_safe) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (_inl_73_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_73_gamma));
                                    break _inl_73__inl_4;
                                }
                                const _ir0 = _inl_73_E;
                                const _ir1 = _inl_73_bz;
                                const _ir2 = _inl_73_eth;
                                const _ir3 = _inl_73__inl_4_result;
                                _inl_73_result_x = _ir0;
                                _inl_73_result_y = _ir1;
                                _inl_73_result_z = _ir2;
                                _inl_73_result_w = _ir3;
                                break _inl_73;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_73_result_x;
                                const _wt1 = _inl_73_result_y;
                                const _wt2 = _inl_73_result_z;
                                const _wt3 = _inl_73_result_w;
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
                        const _inl_68_flags = _u_U_uniforms_physics_flags;
                        let _inl_68_result;
                        _inl_68: {
                            _inl_68_result = (((_inl_68_flags & FLAG_AMBIPOLAR)) != 0);
                            break _inl_68;
                        }
                        const ambi_on = ((_inl_68_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                        const _inl_69_flags = _u_U_uniforms_physics_flags;
                        let _inl_69_result;
                        _inl_69: {
                            _inl_69_result = (((_inl_69_flags & FLAG_ELECTRON_INERTIA)) != 0);
                            break _inl_69;
                        }
                        const electron_inertia_on = ((_inl_69_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                        const _inl_70_flags = _u_U_uniforms_physics_flags;
                        let _inl_70_result;
                        _inl_70: {
                            _inl_70_result = (((_inl_70_flags & FLAG_BIERMANN)) != 0);
                            break _inl_70;
                        }
                        const biermann_on = ((_inl_70_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                        if ((((!ambi_on) && (!electron_inertia_on)) && (!biermann_on))) {
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
                        let _inl_71_result;
                        _inl_71: {
                            _inl_71_result = ((iy * n_total) + ix);
                            break _inl_71;
                        }
                        const c = _inl_71_result;
                        const _sroa_119_base = ((c) * 4 + 0);
                        const u0_x = _b_U0[_sroa_119_base + 0];
                        const u0_y = _b_U0[_sroa_119_base + 1];
                        const u0_z = _b_U0[_sroa_119_base + 2];
                        const u0_w = _b_U0[_sroa_119_base + 3];
                        const _sroa_120_base = ((c) * 4 + 0);
                        const u1_x = _b_U1[_sroa_120_base + 0];
                        const u1_y = _b_U1[_sroa_120_base + 1];
                        const u1_z = _b_U1[_sroa_120_base + 2];
                        const u1_w = _b_U1[_sroa_120_base + 3];
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                        let _inl_72_result;
                        _inl_72: {
                            let _inl_72__inl_32_result;
                            _inl_72__inl_32: {
                                _inl_72__inl_32_result = ((iy * n_total) + ix);
                                break _inl_72__inl_32;
                            }
                            const _sroa_121_base = ((_inl_72__inl_32_result) * 4 + 0);
                            const _inl_72_u1_x = _b_U1[_sroa_121_base + 0];
                            const _inl_72_u1_y = _b_U1[_sroa_121_base + 1];
                            const _inl_72_u1_z = _b_U1[_sroa_121_base + 2];
                            const _inl_72_u1_w = _b_U1[_sroa_121_base + 3];
                            let _inl_72__inl_33_result;
                            _inl_72__inl_33: {
                                let _inl_72__inl_33__inl_6_result;
                                _inl_72__inl_33__inl_6: {
                                    _inl_72__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_72__inl_33__inl_6;
                                }
                                const _inl_72__inl_33__inl_7_ix = (ix + 1);
                                let _inl_72__inl_33__inl_7_result;
                                _inl_72__inl_33__inl_7: {
                                    _inl_72__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_72__inl_33__inl_7_ix);
                                    break _inl_72__inl_33__inl_7;
                                }
                                _inl_72__inl_33_result = (0.5 * ((_b_Bx_face[_inl_72__inl_33__inl_6_result] + _b_Bx_face[_inl_72__inl_33__inl_7_result])));
                                break _inl_72__inl_33;
                            }
                            const _inl_72_bx_c = _inl_72__inl_33_result;
                            let _inl_72__inl_34_result;
                            _inl_72__inl_34: {
                                let _inl_72__inl_34__inl_8_result;
                                _inl_72__inl_34__inl_8: {
                                    _inl_72__inl_34__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_72__inl_34__inl_8;
                                }
                                const _inl_72__inl_34__inl_9_iy = (iy + 1);
                                let _inl_72__inl_34__inl_9_result;
                                _inl_72__inl_34__inl_9: {
                                    _inl_72__inl_34__inl_9_result = ((_inl_72__inl_34__inl_9_iy * n_total) + ix);
                                    break _inl_72__inl_34__inl_9;
                                }
                                _inl_72__inl_34_result = (0.5 * ((_b_By_face[_inl_72__inl_34__inl_8_result] + _b_By_face[_inl_72__inl_34__inl_9_result])));
                                break _inl_72__inl_34;
                            }
                            const _inl_72_by_c = _inl_72__inl_34_result;
                            _inl_72_result = (0.5 * ((((_inl_72_bx_c * _inl_72_bx_c) + (_inl_72_by_c * _inl_72_by_c)) + (_inl_72_u1_y * _inl_72_u1_y))));
                            break _inl_72;
                        }
                        const mb = _inl_72_result;
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))));
                        const _inl_73_E = u1_x;
                        const _inl_73_bz = u1_y;
                        const _inl_73_gamma = _u_U_uniforms_gamma;
                        const _inl_73_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_73_result_x, _inl_73_result_y, _inl_73_result_z, _inl_73_result_w;
                        _inl_73: {
                            const _inl_73_p_safe = ((p) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (p));
                            const _inl_73_eth = (_inl_73_p_safe / (((_inl_73_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_73_gamma - 1.0))));
                            let _inl_73__inl_4_result;
                            _inl_73__inl_4: {
                                _inl_73__inl_4_result = (((_inl_73_p_safe) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (_inl_73_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_73_gamma));
                                break _inl_73__inl_4;
                            }
                            const _ir0 = _inl_73_E;
                            const _ir1 = _inl_73_bz;
                            const _ir2 = _inl_73_eth;
                            const _ir3 = _inl_73__inl_4_result;
                            _inl_73_result_x = _ir0;
                            _inl_73_result_y = _ir1;
                            _inl_73_result_z = _ir2;
                            _inl_73_result_w = _ir3;
                            break _inl_73;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_73_result_x;
                            const _wt1 = _inl_73_result_y;
                            const _wt2 = _inl_73_result_z;
                            const _wt3 = _inl_73_result_w;
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
                    const _inl_68_flags = _u_U_uniforms_physics_flags;
                    let _inl_68_result;
                    _inl_68: {
                        _inl_68_result = (((_inl_68_flags & FLAG_AMBIPOLAR)) != 0);
                        break _inl_68;
                    }
                    const ambi_on = ((_inl_68_result && (_u_U_uniforms_ambipolar_eta > 0.0)) && (_u_U_uniforms_neutral_frac > 0.0));
                    const _inl_69_flags = _u_U_uniforms_physics_flags;
                    let _inl_69_result;
                    _inl_69: {
                        _inl_69_result = (((_inl_69_flags & FLAG_ELECTRON_INERTIA)) != 0);
                        break _inl_69;
                    }
                    const electron_inertia_on = ((_inl_69_result && (_u_U_uniforms_electron_inertia_length > 0.0)) && (_u_U_uniforms_electron_inertia_damping > 0.0));
                    const _inl_70_flags = _u_U_uniforms_physics_flags;
                    let _inl_70_result;
                    _inl_70: {
                        _inl_70_result = (((_inl_70_flags & FLAG_BIERMANN)) != 0);
                        break _inl_70;
                    }
                    const biermann_on = ((_inl_70_result && (_u_U_uniforms_biermann_coeff != 0.0)) && (_u_U_uniforms_hall_electron_pressure_frac > 0.0));
                    if ((((!ambi_on) && (!electron_inertia_on)) && (!biermann_on))) {
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
                    let _inl_71_result;
                    _inl_71: {
                        _inl_71_result = ((iy * n_total) + ix);
                        break _inl_71;
                    }
                    const c = _inl_71_result;
                    const _sroa_122_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_122_base + 0];
                    const u0_y = _b_U0[_sroa_122_base + 1];
                    const u0_z = _b_U0[_sroa_122_base + 2];
                    const u0_w = _b_U0[_sroa_122_base + 3];
                    const _sroa_123_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_123_base + 0];
                    const u1_y = _b_U1[_sroa_123_base + 1];
                    const u1_z = _b_U1[_sroa_123_base + 2];
                    const u1_w = _b_U1[_sroa_123_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const ke = ((0.5 * ((((u0_y * u0_y) + (u0_z * u0_z)) + (u0_w * u0_w)))) / rho);
                    let _inl_72_result;
                    _inl_72: {
                        let _inl_72__inl_32_result;
                        _inl_72__inl_32: {
                            _inl_72__inl_32_result = ((iy * n_total) + ix);
                            break _inl_72__inl_32;
                        }
                        const _sroa_124_base = ((_inl_72__inl_32_result) * 4 + 0);
                        const _inl_72_u1_x = _b_U1[_sroa_124_base + 0];
                        const _inl_72_u1_y = _b_U1[_sroa_124_base + 1];
                        const _inl_72_u1_z = _b_U1[_sroa_124_base + 2];
                        const _inl_72_u1_w = _b_U1[_sroa_124_base + 3];
                        let _inl_72__inl_33_result;
                        _inl_72__inl_33: {
                            let _inl_72__inl_33__inl_6_result;
                            _inl_72__inl_33__inl_6: {
                                _inl_72__inl_33__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_72__inl_33__inl_6;
                            }
                            const _inl_72__inl_33__inl_7_ix = (ix + 1);
                            let _inl_72__inl_33__inl_7_result;
                            _inl_72__inl_33__inl_7: {
                                _inl_72__inl_33__inl_7_result = ((iy * ((n_total + 1))) + _inl_72__inl_33__inl_7_ix);
                                break _inl_72__inl_33__inl_7;
                            }
                            _inl_72__inl_33_result = (0.5 * ((_b_Bx_face[_inl_72__inl_33__inl_6_result] + _b_Bx_face[_inl_72__inl_33__inl_7_result])));
                            break _inl_72__inl_33;
                        }
                        const _inl_72_bx_c = _inl_72__inl_33_result;
                        let _inl_72__inl_34_result;
                        _inl_72__inl_34: {
                            let _inl_72__inl_34__inl_8_result;
                            _inl_72__inl_34__inl_8: {
                                _inl_72__inl_34__inl_8_result = ((iy * n_total) + ix);
                                break _inl_72__inl_34__inl_8;
                            }
                            const _inl_72__inl_34__inl_9_iy = (iy + 1);
                            let _inl_72__inl_34__inl_9_result;
                            _inl_72__inl_34__inl_9: {
                                _inl_72__inl_34__inl_9_result = ((_inl_72__inl_34__inl_9_iy * n_total) + ix);
                                break _inl_72__inl_34__inl_9;
                            }
                            _inl_72__inl_34_result = (0.5 * ((_b_By_face[_inl_72__inl_34__inl_8_result] + _b_By_face[_inl_72__inl_34__inl_9_result])));
                            break _inl_72__inl_34;
                        }
                        const _inl_72_by_c = _inl_72__inl_34_result;
                        _inl_72_result = (0.5 * ((((_inl_72_bx_c * _inl_72_bx_c) + (_inl_72_by_c * _inl_72_by_c)) + (_inl_72_u1_y * _inl_72_u1_y))));
                        break _inl_72;
                    }
                    const mb = _inl_72_result;
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((u1_x - ke) - mb)))));
                    const _inl_73_E = u1_x;
                    const _inl_73_bz = u1_y;
                    const _inl_73_gamma = _u_U_uniforms_gamma;
                    const _inl_73_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_73_result_x, _inl_73_result_y, _inl_73_result_z, _inl_73_result_w;
                    _inl_73: {
                        const _inl_73_p_safe = ((p) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (p));
                        const _inl_73_eth = (_inl_73_p_safe / (((_inl_73_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_73_gamma - 1.0))));
                        let _inl_73__inl_4_result;
                        _inl_73__inl_4: {
                            _inl_73__inl_4_result = (((_inl_73_p_safe) < (_inl_73_p_floor) ? (_inl_73_p_floor) : (_inl_73_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_73_gamma));
                            break _inl_73__inl_4;
                        }
                        const _ir0 = _inl_73_E;
                        const _ir1 = _inl_73_bz;
                        const _ir2 = _inl_73_eth;
                        const _ir3 = _inl_73__inl_4_result;
                        _inl_73_result_x = _ir0;
                        _inl_73_result_y = _ir1;
                        _inl_73_result_z = _ir2;
                        _inl_73_result_w = _ir3;
                        break _inl_73;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_73_result_x;
                        const _wt1 = _inl_73_result_y;
                        const _wt2 = _inl_73_result_z;
                        const _wt3 = _inl_73_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["repair_dissipative_energy"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_4_repair_dissipative_energy(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["compute_emf"] = function (workgroups, domain, origin) {
            return __entry_0_compute_emf(workgroups, bindings, domain, origin);
        };
        bound["apply_hall_update"] = function (workgroups, domain, origin) {
            return __entry_1_apply_hall_update(workgroups, bindings, domain, origin);
        };
        bound["repair_hall_energy"] = function (workgroups, domain, origin) {
            return __entry_2_repair_hall_energy(workgroups, bindings, domain, origin);
        };
        bound["apply_dissipative_update"] = function (workgroups, domain, origin) {
            return __entry_3_apply_dissipative_update(workgroups, bindings, domain, origin);
        };
        bound["repair_dissipative_energy"] = function (workgroups, domain, origin) {
            return __entry_4_repair_dissipative_energy(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","ohm_E","hall_E","hall_mb0","micro"], entryInfo };
}
