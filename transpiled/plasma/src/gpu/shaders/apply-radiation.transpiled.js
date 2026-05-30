// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-radiation.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: dec609fbbf80ab0291f3a54f4e18ed903126244903f9968dfa1ac009f6bbaf36
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":174865,"lines":2478,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":10,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.505Z
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
    const MICRO_RAD_ABS_START = 96;
    const MICRO_RAD_SCAT_START = 120;
    const MICRO_RAD_COUNT = 24;
    const INV_LN10_RAD = 0.4342944819032518;

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

    function sample_axis(idx, offset, n_interior, ghost, lo_mode, hi_mode) {
        const local = ((((idx) | 0) - ((ghost) | 0)) + offset);
        const n = ((n_interior) | 0);
        if ((local < 0)) {
            if ((lo_mode == BC_PERIODIC)) {
                return ((ghost + n_interior) - 1);
            }
            return ghost;
        }
        if ((local >= n)) {
            if ((hi_mode == BC_PERIODIC)) {
                return ghost;
            }
            return ((ghost + n_interior) - 1);
        }
        return (((local) >>> 0) + ghost);
    }

    function micro_log_interp_rad(start, count, theta) {
        const log_theta = (Math.log(((theta) < (1.0e-30) ? (1.0e-30) : (theta))) * INV_LN10_RAD);
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

    function diffusion_coeff(ix, iy, n_interior, n_total, ghost) {
        let _inl_25_result;
        _inl_25: {
            let _inl_25__inl_23_result;
            _inl_25__inl_23: {
                let _inl_25__inl_23__inl_19_result;
                _inl_25__inl_23__inl_19: {
                    let _inl_25__inl_23__inl_19__inl_18_result;
                    _inl_25__inl_23__inl_19__inl_18: {
                        let _inl_25__inl_23__inl_19__inl_18__inl_16_result;
                        _inl_25__inl_23__inl_19__inl_18__inl_16: {
                            _inl_25__inl_23__inl_19__inl_18__inl_16_result = ((iy * n_total) + ix);
                            break _inl_25__inl_23__inl_19__inl_18__inl_16;
                        }
                        const _inl_25__inl_23__inl_19__inl_18_rho = ((bindings.U0[((_inl_25__inl_23__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_25__inl_23__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]));
                        let _inl_25__inl_23__inl_19__inl_18__inl_17_result;
                        _inl_25__inl_23__inl_19__inl_18__inl_17: {
                            let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_13_result;
                            _inl_25__inl_23__inl_19__inl_18__inl_17__inl_13: {
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_13;
                            }
                            const _inl_25__inl_23__inl_19__inl_18__inl_17_c = _inl_25__inl_23__inl_19__inl_18__inl_17__inl_13_result;
                            let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14_result;
                            _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14: {
                                let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9_result;
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9: {
                                    let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                        _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0;
                                    }
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9_result = _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                    break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9;
                                }
                                let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10_result;
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10: {
                                    const _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                    let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                        _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                        break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1;
                                    }
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10_result = _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                    break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10;
                                }
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14_result = (0.5 * ((bindings.Bx_face[_inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_9_result] + bindings.Bx_face[_inl_25__inl_23__inl_19__inl_18__inl_17__inl_14__inl_10_result])));
                                break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14;
                            }
                            let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15_result;
                            _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15: {
                                let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11_result;
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11: {
                                    let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                        _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2;
                                    }
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11_result = _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                    break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11;
                                }
                                let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12_result;
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12: {
                                    const _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                    let _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                        _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                        break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3;
                                    }
                                    _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12_result = _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                    break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12;
                                }
                                _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15_result = (0.5 * ((bindings.By_face[_inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_11_result] + bindings.By_face[_inl_25__inl_23__inl_19__inl_18__inl_17__inl_15__inl_12_result])));
                                break _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15;
                            }
                            _inl_25__inl_23__inl_19__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:bindings.U0[_b + 0], y:bindings.U0[_b + 1], z:bindings.U0[_b + 2], w:bindings.U0[_b + 3]}))(((_inl_25__inl_23__inl_19__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:bindings.U1[_b + 0], y:bindings.U1[_b + 1], z:bindings.U1[_b + 2], w:bindings.U1[_b + 3]}))(((_inl_25__inl_23__inl_19__inl_18__inl_17_c) * 4 + 0)), _inl_25__inl_23__inl_19__inl_18__inl_17__inl_14_result, _inl_25__inl_23__inl_19__inl_18__inl_17__inl_15_result, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
                            break _inl_25__inl_23__inl_19__inl_18__inl_17;
                        }
                        _inl_25__inl_23__inl_19__inl_18_result = (_inl_25__inl_23__inl_19__inl_18__inl_17_result / _inl_25__inl_23__inl_19__inl_18_rho);
                        break _inl_25__inl_23__inl_19__inl_18;
                    }
                    _inl_25__inl_23__inl_19_result = (_inl_25__inl_23__inl_19__inl_18_result / ((bindings.U_uniforms.cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.cooling_T_ref)));
                    break _inl_25__inl_23__inl_19;
                }
                let _inl_25__inl_23__inl_20_result;
                _inl_25__inl_23__inl_20: {
                    _inl_25__inl_23__inl_20_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_ABS_START, MICRO_RAD_COUNT, _inl_25__inl_23__inl_19_result)), 0.01, 32.0));
                    break _inl_25__inl_23__inl_20;
                }
                _inl_25__inl_23_result = (((bindings.U_uniforms.radiation_kappa_abs) < (0.0) ? (0.0) : (bindings.U_uniforms.radiation_kappa_abs)) * _inl_25__inl_23__inl_20_result);
                break _inl_25__inl_23;
            }
            let _inl_25__inl_24_result;
            _inl_25__inl_24: {
                let _inl_25__inl_24__inl_21_result;
                _inl_25__inl_24__inl_21: {
                    let _inl_25__inl_24__inl_21__inl_18_result;
                    _inl_25__inl_24__inl_21__inl_18: {
                        let _inl_25__inl_24__inl_21__inl_18__inl_16_result;
                        _inl_25__inl_24__inl_21__inl_18__inl_16: {
                            _inl_25__inl_24__inl_21__inl_18__inl_16_result = ((iy * n_total) + ix);
                            break _inl_25__inl_24__inl_21__inl_18__inl_16;
                        }
                        const _inl_25__inl_24__inl_21__inl_18_rho = ((bindings.U0[((_inl_25__inl_24__inl_21__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_25__inl_24__inl_21__inl_18__inl_16_result) * 4 + 0) + 0]));
                        let _inl_25__inl_24__inl_21__inl_18__inl_17_result;
                        _inl_25__inl_24__inl_21__inl_18__inl_17: {
                            let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_13_result;
                            _inl_25__inl_24__inl_21__inl_18__inl_17__inl_13: {
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_13;
                            }
                            const _inl_25__inl_24__inl_21__inl_18__inl_17_c = _inl_25__inl_24__inl_21__inl_18__inl_17__inl_13_result;
                            let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14_result;
                            _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14: {
                                let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9_result;
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9: {
                                    let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                        _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9__inl_0;
                                    }
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9_result = _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                    break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9;
                                }
                                let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10_result;
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10: {
                                    const _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                    let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                        _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                        break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1;
                                    }
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10_result = _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                    break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10;
                                }
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14_result = (0.5 * ((bindings.Bx_face[_inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_9_result] + bindings.Bx_face[_inl_25__inl_24__inl_21__inl_18__inl_17__inl_14__inl_10_result])));
                                break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14;
                            }
                            let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15_result;
                            _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15: {
                                let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11_result;
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11: {
                                    let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                        _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11__inl_2;
                                    }
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11_result = _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                    break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11;
                                }
                                let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12_result;
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12: {
                                    const _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                    let _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                        _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                        break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3;
                                    }
                                    _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12_result = _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                    break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12;
                                }
                                _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15_result = (0.5 * ((bindings.By_face[_inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_11_result] + bindings.By_face[_inl_25__inl_24__inl_21__inl_18__inl_17__inl_15__inl_12_result])));
                                break _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15;
                            }
                            _inl_25__inl_24__inl_21__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:bindings.U0[_b + 0], y:bindings.U0[_b + 1], z:bindings.U0[_b + 2], w:bindings.U0[_b + 3]}))(((_inl_25__inl_24__inl_21__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:bindings.U1[_b + 0], y:bindings.U1[_b + 1], z:bindings.U1[_b + 2], w:bindings.U1[_b + 3]}))(((_inl_25__inl_24__inl_21__inl_18__inl_17_c) * 4 + 0)), _inl_25__inl_24__inl_21__inl_18__inl_17__inl_14_result, _inl_25__inl_24__inl_21__inl_18__inl_17__inl_15_result, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
                            break _inl_25__inl_24__inl_21__inl_18__inl_17;
                        }
                        _inl_25__inl_24__inl_21__inl_18_result = (_inl_25__inl_24__inl_21__inl_18__inl_17_result / _inl_25__inl_24__inl_21__inl_18_rho);
                        break _inl_25__inl_24__inl_21__inl_18;
                    }
                    _inl_25__inl_24__inl_21_result = (_inl_25__inl_24__inl_21__inl_18_result / ((bindings.U_uniforms.cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.cooling_T_ref)));
                    break _inl_25__inl_24__inl_21;
                }
                let _inl_25__inl_24__inl_22_result;
                _inl_25__inl_24__inl_22: {
                    _inl_25__inl_24__inl_22_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_SCAT_START, MICRO_RAD_COUNT, _inl_25__inl_24__inl_21_result)), 0.01, 4.0));
                    break _inl_25__inl_24__inl_22;
                }
                _inl_25__inl_24_result = (((bindings.U_uniforms.radiation_kappa_scat) < (0.0) ? (0.0) : (bindings.U_uniforms.radiation_kappa_scat)) * _inl_25__inl_24__inl_22_result);
                break _inl_25__inl_24;
            }
            _inl_25_result = (_inl_25__inl_23_result + _inl_25__inl_24_result);
            break _inl_25;
        }
        const kappa = _inl_25_result;
        if (((kappa <= 0.0) || (bindings.U_uniforms.radiation_c <= 0.0))) {
            return 0.0;
        }
        const _inl_26_offset = (-1);
        let _inl_26_result;
        _inl_26: {
            _inl_26_result = sample_axis(ix, _inl_26_offset, n_interior, ghost, bindings.bc.mode_w, bindings.bc.mode_e);
            break _inl_26;
        }
        const ix_l = _inl_26_result;
        const _inl_27_offset = 1;
        let _inl_27_result;
        _inl_27: {
            _inl_27_result = sample_axis(ix, _inl_27_offset, n_interior, ghost, bindings.bc.mode_w, bindings.bc.mode_e);
            break _inl_27;
        }
        const ix_r = _inl_27_result;
        const _inl_28_offset = (-1);
        let _inl_28_result;
        _inl_28: {
            _inl_28_result = sample_axis(iy, _inl_28_offset, n_interior, ghost, bindings.bc.mode_s, bindings.bc.mode_n);
            break _inl_28;
        }
        const iy_d = _inl_28_result;
        const _inl_29_offset = 1;
        let _inl_29_result;
        _inl_29: {
            _inl_29_result = sample_axis(iy, _inl_29_offset, n_interior, ghost, bindings.bc.mode_s, bindings.bc.mode_n);
            break _inl_29;
        }
        const iy_u = _inl_29_result;
        let _inl_30_result;
        _inl_30: {
            let _inl_30__inl_8_result;
            _inl_30__inl_8: {
                let _inl_30__inl_8__inl_7_result;
                _inl_30__inl_8__inl_7: {
                    _inl_30__inl_8__inl_7_result = ((iy * n_total) + ix);
                    break _inl_30__inl_8__inl_7;
                }
                _inl_30__inl_8_result = _inl_30__inl_8__inl_7_result;
                break _inl_30__inl_8;
            }
            _inl_30_result = ((bindings.radiation_E[_inl_30__inl_8_result]) < (bindings.U_uniforms.radiation_floor) ? (bindings.U_uniforms.radiation_floor) : (bindings.radiation_E[_inl_30__inl_8_result]));
            break _inl_30;
        }
        const er = _inl_30_result;
        let _inl_31_result;
        _inl_31: {
            let _inl_31__inl_8_result;
            _inl_31__inl_8: {
                let _inl_31__inl_8__inl_7_result;
                _inl_31__inl_8__inl_7: {
                    _inl_31__inl_8__inl_7_result = ((iy * n_total) + ix_r);
                    break _inl_31__inl_8__inl_7;
                }
                _inl_31__inl_8_result = _inl_31__inl_8__inl_7_result;
                break _inl_31__inl_8;
            }
            _inl_31_result = ((bindings.radiation_E[_inl_31__inl_8_result]) < (bindings.U_uniforms.radiation_floor) ? (bindings.U_uniforms.radiation_floor) : (bindings.radiation_E[_inl_31__inl_8_result]));
            break _inl_31;
        }
        let _inl_32_result;
        _inl_32: {
            let _inl_32__inl_8_result;
            _inl_32__inl_8: {
                let _inl_32__inl_8__inl_7_result;
                _inl_32__inl_8__inl_7: {
                    _inl_32__inl_8__inl_7_result = ((iy * n_total) + ix_l);
                    break _inl_32__inl_8__inl_7;
                }
                _inl_32__inl_8_result = _inl_32__inl_8__inl_7_result;
                break _inl_32__inl_8;
            }
            _inl_32_result = ((bindings.radiation_E[_inl_32__inl_8_result]) < (bindings.U_uniforms.radiation_floor) ? (bindings.U_uniforms.radiation_floor) : (bindings.radiation_E[_inl_32__inl_8_result]));
            break _inl_32;
        }
        const dEx = (((_inl_31_result - _inl_32_result)) / ((2.0 * bindings.U_uniforms.dx)));
        let _inl_33_result;
        _inl_33: {
            let _inl_33__inl_8_result;
            _inl_33__inl_8: {
                let _inl_33__inl_8__inl_7_result;
                _inl_33__inl_8__inl_7: {
                    _inl_33__inl_8__inl_7_result = ((iy_u * n_total) + ix);
                    break _inl_33__inl_8__inl_7;
                }
                _inl_33__inl_8_result = _inl_33__inl_8__inl_7_result;
                break _inl_33__inl_8;
            }
            _inl_33_result = ((bindings.radiation_E[_inl_33__inl_8_result]) < (bindings.U_uniforms.radiation_floor) ? (bindings.U_uniforms.radiation_floor) : (bindings.radiation_E[_inl_33__inl_8_result]));
            break _inl_33;
        }
        let _inl_34_result;
        _inl_34: {
            let _inl_34__inl_8_result;
            _inl_34__inl_8: {
                let _inl_34__inl_8__inl_7_result;
                _inl_34__inl_8__inl_7: {
                    _inl_34__inl_8__inl_7_result = ((iy_d * n_total) + ix);
                    break _inl_34__inl_8__inl_7;
                }
                _inl_34__inl_8_result = _inl_34__inl_8__inl_7_result;
                break _inl_34__inl_8;
            }
            _inl_34_result = ((bindings.radiation_E[_inl_34__inl_8_result]) < (bindings.U_uniforms.radiation_floor) ? (bindings.U_uniforms.radiation_floor) : (bindings.radiation_E[_inl_34__inl_8_result]));
            break _inl_34;
        }
        const dEy = (((_inl_33_result - _inl_34_result)) / ((2.0 * bindings.U_uniforms.dx)));
        let _inl_35_result;
        _inl_35: {
            _inl_35_result = ((iy * n_total) + ix);
            break _inl_35;
        }
        const rho = ((bindings.U0[((_inl_35_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.U0[((_inl_35_result) * 4 + 0) + 0]));
        const denom = ((((kappa * rho) * er)) < (1.0e-30) ? (1.0e-30) : (((kappa * rho) * er)));
        const R = (Math.sqrt(((((dEx * dEx) + (dEy * dEy))) < (0.0) ? (0.0) : (((dEx * dEx) + (dEy * dEy))))) / denom);
        const lambda = (((2.0 + R)) / ((((6.0 + (3.0 * R)) + (R * R))) < (1.0e-30) ? (1.0e-30) : (((6.0 + (3.0 * R)) + (R * R)))));
        return ((bindings.U_uniforms.radiation_c * lambda) / (((kappa * rho)) < (1.0e-30) ? (1.0e-30) : ((kappa * rho))));
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
        const _u_U_uniforms_radiation_c = _b_U_uniforms.radiation_c;
        const _u_U_uniforms_radiation_kappa_abs = _b_U_uniforms.radiation_kappa_abs;
        const _u_U_uniforms_radiation_kappa_scat = _b_U_uniforms.radiation_kappa_scat;
        const _u_U_uniforms_radiation_const = _b_U_uniforms.radiation_const;
        const _u_U_uniforms_radiation_floor = _b_U_uniforms.radiation_floor;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_radiation_E = bindings.radiation_E;
        const _b_radiation_dE = bindings.radiation_dE;
        const _b_bc = bindings.bc;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_U_uniforms_grid_n;
        const __clipYBound = _u_U_uniforms_grid_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    __invocation: {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_36_result;
                        _inl_36: {
                            _inl_36_result = ((iy * n_total) + ix);
                            break _inl_36;
                        }
                        const c = _inl_36_result;
                        let _inl_37_result;
                        _inl_37: {
                            const _inl_37__inl_6_flags = _u_U_uniforms_physics_flags;
                            let _inl_37__inl_6_result;
                            _inl_37__inl_6: {
                                _inl_37__inl_6_result = (((_inl_37__inl_6_flags & FLAG_RADIATION)) != 0);
                                break _inl_37__inl_6;
                            }
                            _inl_37_result = ((_inl_37__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                            break _inl_37;
                        }
                        if ((!_inl_37_result)) {
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = 0.0;
                                const _wt1 = 0.0;
                                const _wt2 = 0.0;
                                const _wt3 = 0.0;
                                _b_radiation_dE[_wbase + 0] = _wt0;
                                _b_radiation_dE[_wbase + 1] = _wt1;
                                _b_radiation_dE[_wbase + 2] = _wt2;
                                _b_radiation_dE[_wbase + 3] = _wt3;
                            }
                            break __invocation;
                        }
                        const _inl_38_offset = (-1);
                        let _inl_38_result;
                        _inl_38: {
                            _inl_38_result = sample_axis(ix, _inl_38_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                            break _inl_38;
                        }
                        const ix_l = _inl_38_result;
                        const _inl_39_offset = 1;
                        let _inl_39_result;
                        _inl_39: {
                            _inl_39_result = sample_axis(ix, _inl_39_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                            break _inl_39;
                        }
                        const ix_r = _inl_39_result;
                        const _inl_40_offset = (-1);
                        let _inl_40_result;
                        _inl_40: {
                            _inl_40_result = sample_axis(iy, _inl_40_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                            break _inl_40;
                        }
                        const iy_d = _inl_40_result;
                        const _inl_41_offset = 1;
                        let _inl_41_result;
                        _inl_41: {
                            _inl_41_result = sample_axis(iy, _inl_41_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                            break _inl_41;
                        }
                        const iy_u = _inl_41_result;
                        let _inl_42_result;
                        _inl_42: {
                            let _inl_42__inl_8_result;
                            _inl_42__inl_8: {
                                let _inl_42__inl_8__inl_7_result;
                                _inl_42__inl_8__inl_7: {
                                    _inl_42__inl_8__inl_7_result = ((iy * n_total) + ix);
                                    break _inl_42__inl_8__inl_7;
                                }
                                _inl_42__inl_8_result = _inl_42__inl_8__inl_7_result;
                                break _inl_42__inl_8;
                            }
                            _inl_42_result = ((_b_radiation_E[_inl_42__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_42__inl_8_result]));
                            break _inl_42;
                        }
                        const er_c = _inl_42_result;
                        let _inl_43_result;
                        _inl_43: {
                            let _inl_43__inl_8_result;
                            _inl_43__inl_8: {
                                let _inl_43__inl_8__inl_7_result;
                                _inl_43__inl_8__inl_7: {
                                    _inl_43__inl_8__inl_7_result = ((iy * n_total) + ix_l);
                                    break _inl_43__inl_8__inl_7;
                                }
                                _inl_43__inl_8_result = _inl_43__inl_8__inl_7_result;
                                break _inl_43__inl_8;
                            }
                            _inl_43_result = ((_b_radiation_E[_inl_43__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_43__inl_8_result]));
                            break _inl_43;
                        }
                        const er_l = _inl_43_result;
                        let _inl_44_result;
                        _inl_44: {
                            let _inl_44__inl_8_result;
                            _inl_44__inl_8: {
                                let _inl_44__inl_8__inl_7_result;
                                _inl_44__inl_8__inl_7: {
                                    _inl_44__inl_8__inl_7_result = ((iy * n_total) + ix_r);
                                    break _inl_44__inl_8__inl_7;
                                }
                                _inl_44__inl_8_result = _inl_44__inl_8__inl_7_result;
                                break _inl_44__inl_8;
                            }
                            _inl_44_result = ((_b_radiation_E[_inl_44__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_44__inl_8_result]));
                            break _inl_44;
                        }
                        const er_r = _inl_44_result;
                        let _inl_45_result;
                        _inl_45: {
                            let _inl_45__inl_8_result;
                            _inl_45__inl_8: {
                                let _inl_45__inl_8__inl_7_result;
                                _inl_45__inl_8__inl_7: {
                                    _inl_45__inl_8__inl_7_result = ((iy_d * n_total) + ix);
                                    break _inl_45__inl_8__inl_7;
                                }
                                _inl_45__inl_8_result = _inl_45__inl_8__inl_7_result;
                                break _inl_45__inl_8;
                            }
                            _inl_45_result = ((_b_radiation_E[_inl_45__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_45__inl_8_result]));
                            break _inl_45;
                        }
                        const er_d = _inl_45_result;
                        let _inl_46_result;
                        _inl_46: {
                            let _inl_46__inl_8_result;
                            _inl_46__inl_8: {
                                let _inl_46__inl_8__inl_7_result;
                                _inl_46__inl_8__inl_7: {
                                    _inl_46__inl_8__inl_7_result = ((iy_u * n_total) + ix);
                                    break _inl_46__inl_8__inl_7;
                                }
                                _inl_46__inl_8_result = _inl_46__inl_8__inl_7_result;
                                break _inl_46__inl_8;
                            }
                            _inl_46_result = ((_b_radiation_E[_inl_46__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_46__inl_8_result]));
                            break _inl_46;
                        }
                        const er_u = _inl_46_result;
                        const D_c = diffusion_coeff(ix, iy, n_interior, n_total, ghost);
                        const D_l = (0.5 * ((D_c + diffusion_coeff(ix_l, iy, n_interior, n_total, ghost))));
                        const D_r = (0.5 * ((D_c + diffusion_coeff(ix_r, iy, n_interior, n_total, ghost))));
                        const D_d = (0.5 * ((D_c + diffusion_coeff(ix, iy_d, n_interior, n_total, ghost))));
                        const D_u = (0.5 * ((D_c + diffusion_coeff(ix, iy_u, n_interior, n_total, ghost))));
                        const inv_dx = (1.0 / _u_U_uniforms_dx);
                        const flux_l = (((-D_l) * ((er_c - er_l))) * inv_dx);
                        const flux_r = (((-D_r) * ((er_r - er_c))) * inv_dx);
                        const flux_d = (((-D_d) * ((er_c - er_d))) * inv_dx);
                        const flux_u = (((-D_u) * ((er_u - er_c))) * inv_dx);
                        const div_flux = (((((flux_r - flux_l) + flux_u) - flux_d)) * inv_dx);
                        const rho = ((_b_U0[((c) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((c) * 4 + 0) + 0]));
                        let _inl_47_result;
                        _inl_47: {
                            let _inl_47__inl_16_result;
                            _inl_47__inl_16: {
                                _inl_47__inl_16_result = ((iy * n_total) + ix);
                                break _inl_47__inl_16;
                            }
                            const _inl_47_rho = ((_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]));
                            let _inl_47__inl_17_result;
                            _inl_47__inl_17: {
                                let _inl_47__inl_17__inl_13_result;
                                _inl_47__inl_17__inl_13: {
                                    _inl_47__inl_17__inl_13_result = ((iy * n_total) + ix);
                                    break _inl_47__inl_17__inl_13;
                                }
                                const _inl_47__inl_17_c = _inl_47__inl_17__inl_13_result;
                                let _inl_47__inl_17__inl_14_result;
                                _inl_47__inl_17__inl_14: {
                                    let _inl_47__inl_17__inl_14__inl_9_result;
                                    _inl_47__inl_17__inl_14__inl_9: {
                                        let _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                        _inl_47__inl_17__inl_14__inl_9__inl_0: {
                                            _inl_47__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                            break _inl_47__inl_17__inl_14__inl_9__inl_0;
                                        }
                                        _inl_47__inl_17__inl_14__inl_9_result = _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                        break _inl_47__inl_17__inl_14__inl_9;
                                    }
                                    let _inl_47__inl_17__inl_14__inl_10_result;
                                    _inl_47__inl_17__inl_14__inl_10: {
                                        const _inl_47__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                        let _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                        _inl_47__inl_17__inl_14__inl_10__inl_1: {
                                            _inl_47__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_47__inl_17__inl_14__inl_10__inl_1_ix);
                                            break _inl_47__inl_17__inl_14__inl_10__inl_1;
                                        }
                                        _inl_47__inl_17__inl_14__inl_10_result = _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                        break _inl_47__inl_17__inl_14__inl_10;
                                    }
                                    _inl_47__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_47__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_47__inl_17__inl_14__inl_10_result])));
                                    break _inl_47__inl_17__inl_14;
                                }
                                let _inl_47__inl_17__inl_15_result;
                                _inl_47__inl_17__inl_15: {
                                    let _inl_47__inl_17__inl_15__inl_11_result;
                                    _inl_47__inl_17__inl_15__inl_11: {
                                        let _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                        _inl_47__inl_17__inl_15__inl_11__inl_2: {
                                            _inl_47__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                            break _inl_47__inl_17__inl_15__inl_11__inl_2;
                                        }
                                        _inl_47__inl_17__inl_15__inl_11_result = _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                        break _inl_47__inl_17__inl_15__inl_11;
                                    }
                                    let _inl_47__inl_17__inl_15__inl_12_result;
                                    _inl_47__inl_17__inl_15__inl_12: {
                                        const _inl_47__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                        let _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                        _inl_47__inl_17__inl_15__inl_12__inl_3: {
                                            _inl_47__inl_17__inl_15__inl_12__inl_3_result = ((_inl_47__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                            break _inl_47__inl_17__inl_15__inl_12__inl_3;
                                        }
                                        _inl_47__inl_17__inl_15__inl_12_result = _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                        break _inl_47__inl_17__inl_15__inl_12;
                                    }
                                    _inl_47__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_47__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_47__inl_17__inl_15__inl_12_result])));
                                    break _inl_47__inl_17__inl_15;
                                }
                                _inl_47__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), _inl_47__inl_17__inl_14_result, _inl_47__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                break _inl_47__inl_17;
                            }
                            _inl_47_result = (_inl_47__inl_17_result / _inl_47_rho);
                            break _inl_47;
                        }
                        const T = _inl_47_result;
                        const er_lte = (((_u_U_uniforms_radiation_const) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_const)) * Math.pow(((T) < (0.0) ? (0.0) : (T)), 4.0));
                        let _inl_48_result;
                        _inl_48: {
                            let _inl_48__inl_19_result;
                            _inl_48__inl_19: {
                                let _inl_48__inl_19__inl_18_result;
                                _inl_48__inl_19__inl_18: {
                                    let _inl_48__inl_19__inl_18__inl_16_result;
                                    _inl_48__inl_19__inl_18__inl_16: {
                                        _inl_48__inl_19__inl_18__inl_16_result = ((iy * n_total) + ix);
                                        break _inl_48__inl_19__inl_18__inl_16;
                                    }
                                    const _inl_48__inl_19__inl_18_rho = ((_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]));
                                    let _inl_48__inl_19__inl_18__inl_17_result;
                                    _inl_48__inl_19__inl_18__inl_17: {
                                        let _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_13: {
                                            _inl_48__inl_19__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                            break _inl_48__inl_19__inl_18__inl_17__inl_13;
                                        }
                                        const _inl_48__inl_19__inl_18__inl_17_c = _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                        let _inl_48__inl_19__inl_18__inl_17__inl_14_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_14: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9;
                                            }
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10: {
                                                const _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result])));
                                            break _inl_48__inl_19__inl_18__inl_17__inl_14;
                                        }
                                        let _inl_48__inl_19__inl_18__inl_17__inl_15_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_15: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11;
                                            }
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12: {
                                                const _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result])));
                                            break _inl_48__inl_19__inl_18__inl_17__inl_15;
                                        }
                                        _inl_48__inl_19__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), _inl_48__inl_19__inl_18__inl_17__inl_14_result, _inl_48__inl_19__inl_18__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                        break _inl_48__inl_19__inl_18__inl_17;
                                    }
                                    _inl_48__inl_19__inl_18_result = (_inl_48__inl_19__inl_18__inl_17_result / _inl_48__inl_19__inl_18_rho);
                                    break _inl_48__inl_19__inl_18;
                                }
                                _inl_48__inl_19_result = (_inl_48__inl_19__inl_18_result / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                                break _inl_48__inl_19;
                            }
                            let _inl_48__inl_20_result;
                            _inl_48__inl_20: {
                                _inl_48__inl_20_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_ABS_START, MICRO_RAD_COUNT, _inl_48__inl_19_result)), 0.01, 32.0));
                                break _inl_48__inl_20;
                            }
                            _inl_48_result = (((_u_U_uniforms_radiation_kappa_abs) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_abs)) * _inl_48__inl_20_result);
                            break _inl_48;
                        }
                        const kappa_abs = _inl_48_result;
                        const dt = ((_u_dt_buf_dt) < (0.0) ? (0.0) : (_u_dt_buf_dt));
                        const a = ((_u_U_uniforms_radiation_c * kappa_abs) * rho);
                        const exch_dEr = (((er_lte - er_c)) * ((1.0 - Math.exp(((-a) * dt)))));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = (((-div_flux) * dt) + exch_dEr);
                            const _wt1 = (-exch_dEr);
                            const _wt2 = 0.0;
                            const _wt3 = 0.0;
                            _b_radiation_dE[_wbase + 0] = _wt0;
                            _b_radiation_dE[_wbase + 1] = _wt1;
                            _b_radiation_dE[_wbase + 2] = _wt2;
                            _b_radiation_dE[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                const __clipGx = Math.min(Gx, __clipXBound);
                const __clipGy = Math.min(Gy, __clipYBound);
                for (let __gy = 0, __rowBase = 0; __gy < __clipGy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < __clipGx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_36_result;
                            _inl_36: {
                                _inl_36_result = ((iy * n_total) + ix);
                                break _inl_36;
                            }
                            const c = _inl_36_result;
                            let _inl_37_result;
                            _inl_37: {
                                const _inl_37__inl_6_flags = _u_U_uniforms_physics_flags;
                                let _inl_37__inl_6_result;
                                _inl_37__inl_6: {
                                    _inl_37__inl_6_result = (((_inl_37__inl_6_flags & FLAG_RADIATION)) != 0);
                                    break _inl_37__inl_6;
                                }
                                _inl_37_result = ((_inl_37__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                                break _inl_37;
                            }
                            if ((!_inl_37_result)) {
                                {
                                    const _wbase = ((c) * 4 + 0);
                                    const _wt0 = 0.0;
                                    const _wt1 = 0.0;
                                    const _wt2 = 0.0;
                                    const _wt3 = 0.0;
                                    _b_radiation_dE[_wbase + 0] = _wt0;
                                    _b_radiation_dE[_wbase + 1] = _wt1;
                                    _b_radiation_dE[_wbase + 2] = _wt2;
                                    _b_radiation_dE[_wbase + 3] = _wt3;
                                }
                                break __invocation;
                            }
                            const _inl_38_offset = (-1);
                            let _inl_38_result;
                            _inl_38: {
                                _inl_38_result = sample_axis(ix, _inl_38_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                                break _inl_38;
                            }
                            const ix_l = _inl_38_result;
                            const _inl_39_offset = 1;
                            let _inl_39_result;
                            _inl_39: {
                                _inl_39_result = sample_axis(ix, _inl_39_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                                break _inl_39;
                            }
                            const ix_r = _inl_39_result;
                            const _inl_40_offset = (-1);
                            let _inl_40_result;
                            _inl_40: {
                                _inl_40_result = sample_axis(iy, _inl_40_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                                break _inl_40;
                            }
                            const iy_d = _inl_40_result;
                            const _inl_41_offset = 1;
                            let _inl_41_result;
                            _inl_41: {
                                _inl_41_result = sample_axis(iy, _inl_41_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                                break _inl_41;
                            }
                            const iy_u = _inl_41_result;
                            let _inl_42_result;
                            _inl_42: {
                                let _inl_42__inl_8_result;
                                _inl_42__inl_8: {
                                    let _inl_42__inl_8__inl_7_result;
                                    _inl_42__inl_8__inl_7: {
                                        _inl_42__inl_8__inl_7_result = ((iy * n_total) + ix);
                                        break _inl_42__inl_8__inl_7;
                                    }
                                    _inl_42__inl_8_result = _inl_42__inl_8__inl_7_result;
                                    break _inl_42__inl_8;
                                }
                                _inl_42_result = ((_b_radiation_E[_inl_42__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_42__inl_8_result]));
                                break _inl_42;
                            }
                            const er_c = _inl_42_result;
                            let _inl_43_result;
                            _inl_43: {
                                let _inl_43__inl_8_result;
                                _inl_43__inl_8: {
                                    let _inl_43__inl_8__inl_7_result;
                                    _inl_43__inl_8__inl_7: {
                                        _inl_43__inl_8__inl_7_result = ((iy * n_total) + ix_l);
                                        break _inl_43__inl_8__inl_7;
                                    }
                                    _inl_43__inl_8_result = _inl_43__inl_8__inl_7_result;
                                    break _inl_43__inl_8;
                                }
                                _inl_43_result = ((_b_radiation_E[_inl_43__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_43__inl_8_result]));
                                break _inl_43;
                            }
                            const er_l = _inl_43_result;
                            let _inl_44_result;
                            _inl_44: {
                                let _inl_44__inl_8_result;
                                _inl_44__inl_8: {
                                    let _inl_44__inl_8__inl_7_result;
                                    _inl_44__inl_8__inl_7: {
                                        _inl_44__inl_8__inl_7_result = ((iy * n_total) + ix_r);
                                        break _inl_44__inl_8__inl_7;
                                    }
                                    _inl_44__inl_8_result = _inl_44__inl_8__inl_7_result;
                                    break _inl_44__inl_8;
                                }
                                _inl_44_result = ((_b_radiation_E[_inl_44__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_44__inl_8_result]));
                                break _inl_44;
                            }
                            const er_r = _inl_44_result;
                            let _inl_45_result;
                            _inl_45: {
                                let _inl_45__inl_8_result;
                                _inl_45__inl_8: {
                                    let _inl_45__inl_8__inl_7_result;
                                    _inl_45__inl_8__inl_7: {
                                        _inl_45__inl_8__inl_7_result = ((iy_d * n_total) + ix);
                                        break _inl_45__inl_8__inl_7;
                                    }
                                    _inl_45__inl_8_result = _inl_45__inl_8__inl_7_result;
                                    break _inl_45__inl_8;
                                }
                                _inl_45_result = ((_b_radiation_E[_inl_45__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_45__inl_8_result]));
                                break _inl_45;
                            }
                            const er_d = _inl_45_result;
                            let _inl_46_result;
                            _inl_46: {
                                let _inl_46__inl_8_result;
                                _inl_46__inl_8: {
                                    let _inl_46__inl_8__inl_7_result;
                                    _inl_46__inl_8__inl_7: {
                                        _inl_46__inl_8__inl_7_result = ((iy_u * n_total) + ix);
                                        break _inl_46__inl_8__inl_7;
                                    }
                                    _inl_46__inl_8_result = _inl_46__inl_8__inl_7_result;
                                    break _inl_46__inl_8;
                                }
                                _inl_46_result = ((_b_radiation_E[_inl_46__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_46__inl_8_result]));
                                break _inl_46;
                            }
                            const er_u = _inl_46_result;
                            const D_c = diffusion_coeff(ix, iy, n_interior, n_total, ghost);
                            const D_l = (0.5 * ((D_c + diffusion_coeff(ix_l, iy, n_interior, n_total, ghost))));
                            const D_r = (0.5 * ((D_c + diffusion_coeff(ix_r, iy, n_interior, n_total, ghost))));
                            const D_d = (0.5 * ((D_c + diffusion_coeff(ix, iy_d, n_interior, n_total, ghost))));
                            const D_u = (0.5 * ((D_c + diffusion_coeff(ix, iy_u, n_interior, n_total, ghost))));
                            const inv_dx = (1.0 / _u_U_uniforms_dx);
                            const flux_l = (((-D_l) * ((er_c - er_l))) * inv_dx);
                            const flux_r = (((-D_r) * ((er_r - er_c))) * inv_dx);
                            const flux_d = (((-D_d) * ((er_c - er_d))) * inv_dx);
                            const flux_u = (((-D_u) * ((er_u - er_c))) * inv_dx);
                            const div_flux = (((((flux_r - flux_l) + flux_u) - flux_d)) * inv_dx);
                            const rho = ((_b_U0[((c) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((c) * 4 + 0) + 0]));
                            let _inl_47_result;
                            _inl_47: {
                                let _inl_47__inl_16_result;
                                _inl_47__inl_16: {
                                    _inl_47__inl_16_result = ((iy * n_total) + ix);
                                    break _inl_47__inl_16;
                                }
                                const _inl_47_rho = ((_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]));
                                let _inl_47__inl_17_result;
                                _inl_47__inl_17: {
                                    let _inl_47__inl_17__inl_13_result;
                                    _inl_47__inl_17__inl_13: {
                                        _inl_47__inl_17__inl_13_result = ((iy * n_total) + ix);
                                        break _inl_47__inl_17__inl_13;
                                    }
                                    const _inl_47__inl_17_c = _inl_47__inl_17__inl_13_result;
                                    let _inl_47__inl_17__inl_14_result;
                                    _inl_47__inl_17__inl_14: {
                                        let _inl_47__inl_17__inl_14__inl_9_result;
                                        _inl_47__inl_17__inl_14__inl_9: {
                                            let _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                            _inl_47__inl_17__inl_14__inl_9__inl_0: {
                                                _inl_47__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                                break _inl_47__inl_17__inl_14__inl_9__inl_0;
                                            }
                                            _inl_47__inl_17__inl_14__inl_9_result = _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                            break _inl_47__inl_17__inl_14__inl_9;
                                        }
                                        let _inl_47__inl_17__inl_14__inl_10_result;
                                        _inl_47__inl_17__inl_14__inl_10: {
                                            const _inl_47__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                            let _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                            _inl_47__inl_17__inl_14__inl_10__inl_1: {
                                                _inl_47__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_47__inl_17__inl_14__inl_10__inl_1_ix);
                                                break _inl_47__inl_17__inl_14__inl_10__inl_1;
                                            }
                                            _inl_47__inl_17__inl_14__inl_10_result = _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                            break _inl_47__inl_17__inl_14__inl_10;
                                        }
                                        _inl_47__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_47__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_47__inl_17__inl_14__inl_10_result])));
                                        break _inl_47__inl_17__inl_14;
                                    }
                                    let _inl_47__inl_17__inl_15_result;
                                    _inl_47__inl_17__inl_15: {
                                        let _inl_47__inl_17__inl_15__inl_11_result;
                                        _inl_47__inl_17__inl_15__inl_11: {
                                            let _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                            _inl_47__inl_17__inl_15__inl_11__inl_2: {
                                                _inl_47__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                                break _inl_47__inl_17__inl_15__inl_11__inl_2;
                                            }
                                            _inl_47__inl_17__inl_15__inl_11_result = _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                            break _inl_47__inl_17__inl_15__inl_11;
                                        }
                                        let _inl_47__inl_17__inl_15__inl_12_result;
                                        _inl_47__inl_17__inl_15__inl_12: {
                                            const _inl_47__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                            let _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                            _inl_47__inl_17__inl_15__inl_12__inl_3: {
                                                _inl_47__inl_17__inl_15__inl_12__inl_3_result = ((_inl_47__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                                break _inl_47__inl_17__inl_15__inl_12__inl_3;
                                            }
                                            _inl_47__inl_17__inl_15__inl_12_result = _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                            break _inl_47__inl_17__inl_15__inl_12;
                                        }
                                        _inl_47__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_47__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_47__inl_17__inl_15__inl_12_result])));
                                        break _inl_47__inl_17__inl_15;
                                    }
                                    _inl_47__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), _inl_47__inl_17__inl_14_result, _inl_47__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                    break _inl_47__inl_17;
                                }
                                _inl_47_result = (_inl_47__inl_17_result / _inl_47_rho);
                                break _inl_47;
                            }
                            const T = _inl_47_result;
                            const er_lte = (((_u_U_uniforms_radiation_const) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_const)) * Math.pow(((T) < (0.0) ? (0.0) : (T)), 4.0));
                            let _inl_48_result;
                            _inl_48: {
                                let _inl_48__inl_19_result;
                                _inl_48__inl_19: {
                                    let _inl_48__inl_19__inl_18_result;
                                    _inl_48__inl_19__inl_18: {
                                        let _inl_48__inl_19__inl_18__inl_16_result;
                                        _inl_48__inl_19__inl_18__inl_16: {
                                            _inl_48__inl_19__inl_18__inl_16_result = ((iy * n_total) + ix);
                                            break _inl_48__inl_19__inl_18__inl_16;
                                        }
                                        const _inl_48__inl_19__inl_18_rho = ((_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]));
                                        let _inl_48__inl_19__inl_18__inl_17_result;
                                        _inl_48__inl_19__inl_18__inl_17: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_13: {
                                                _inl_48__inl_19__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                                break _inl_48__inl_19__inl_18__inl_17__inl_13;
                                            }
                                            const _inl_48__inl_19__inl_18__inl_17_c = _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9: {
                                                    let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                                        _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                                        break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0;
                                                    }
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9;
                                                }
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10: {
                                                    const _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                                    let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                                        _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                                        break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1;
                                                    }
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result])));
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14;
                                            }
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11: {
                                                    let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                                        _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                                        break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2;
                                                    }
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11;
                                                }
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12: {
                                                    const _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                                    let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                                        _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                                        break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3;
                                                    }
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result])));
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), _inl_48__inl_19__inl_18__inl_17__inl_14_result, _inl_48__inl_19__inl_18__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                            break _inl_48__inl_19__inl_18__inl_17;
                                        }
                                        _inl_48__inl_19__inl_18_result = (_inl_48__inl_19__inl_18__inl_17_result / _inl_48__inl_19__inl_18_rho);
                                        break _inl_48__inl_19__inl_18;
                                    }
                                    _inl_48__inl_19_result = (_inl_48__inl_19__inl_18_result / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                                    break _inl_48__inl_19;
                                }
                                let _inl_48__inl_20_result;
                                _inl_48__inl_20: {
                                    _inl_48__inl_20_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_ABS_START, MICRO_RAD_COUNT, _inl_48__inl_19_result)), 0.01, 32.0));
                                    break _inl_48__inl_20;
                                }
                                _inl_48_result = (((_u_U_uniforms_radiation_kappa_abs) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_abs)) * _inl_48__inl_20_result);
                                break _inl_48;
                            }
                            const kappa_abs = _inl_48_result;
                            const dt = ((_u_dt_buf_dt) < (0.0) ? (0.0) : (_u_dt_buf_dt));
                            const a = ((_u_U_uniforms_radiation_c * kappa_abs) * rho);
                            const exch_dEr = (((er_lte - er_c)) * ((1.0 - Math.exp(((-a) * dt)))));
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = (((-div_flux) * dt) + exch_dEr);
                                const _wt1 = (-exch_dEr);
                                const _wt2 = 0.0;
                                const _wt3 = 0.0;
                                _b_radiation_dE[_wbase + 0] = _wt0;
                                _b_radiation_dE[_wbase + 1] = _wt1;
                                _b_radiation_dE[_wbase + 2] = _wt2;
                                _b_radiation_dE[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                const __clipXn = Math.min(Xn, __clipXBound);
                const __clipYn = Math.min(Yn, __clipYBound);
                for (let __gy = Oy; __gy < __clipYn; __gy++)
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_36_result;
                        _inl_36: {
                            _inl_36_result = ((iy * n_total) + ix);
                            break _inl_36;
                        }
                        const c = _inl_36_result;
                        let _inl_37_result;
                        _inl_37: {
                            const _inl_37__inl_6_flags = _u_U_uniforms_physics_flags;
                            let _inl_37__inl_6_result;
                            _inl_37__inl_6: {
                                _inl_37__inl_6_result = (((_inl_37__inl_6_flags & FLAG_RADIATION)) != 0);
                                break _inl_37__inl_6;
                            }
                            _inl_37_result = ((_inl_37__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                            break _inl_37;
                        }
                        if ((!_inl_37_result)) {
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = 0.0;
                                const _wt1 = 0.0;
                                const _wt2 = 0.0;
                                const _wt3 = 0.0;
                                _b_radiation_dE[_wbase + 0] = _wt0;
                                _b_radiation_dE[_wbase + 1] = _wt1;
                                _b_radiation_dE[_wbase + 2] = _wt2;
                                _b_radiation_dE[_wbase + 3] = _wt3;
                            }
                            break __invocation;
                        }
                        const _inl_38_offset = (-1);
                        let _inl_38_result;
                        _inl_38: {
                            _inl_38_result = sample_axis(ix, _inl_38_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                            break _inl_38;
                        }
                        const ix_l = _inl_38_result;
                        const _inl_39_offset = 1;
                        let _inl_39_result;
                        _inl_39: {
                            _inl_39_result = sample_axis(ix, _inl_39_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                            break _inl_39;
                        }
                        const ix_r = _inl_39_result;
                        const _inl_40_offset = (-1);
                        let _inl_40_result;
                        _inl_40: {
                            _inl_40_result = sample_axis(iy, _inl_40_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                            break _inl_40;
                        }
                        const iy_d = _inl_40_result;
                        const _inl_41_offset = 1;
                        let _inl_41_result;
                        _inl_41: {
                            _inl_41_result = sample_axis(iy, _inl_41_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                            break _inl_41;
                        }
                        const iy_u = _inl_41_result;
                        let _inl_42_result;
                        _inl_42: {
                            let _inl_42__inl_8_result;
                            _inl_42__inl_8: {
                                let _inl_42__inl_8__inl_7_result;
                                _inl_42__inl_8__inl_7: {
                                    _inl_42__inl_8__inl_7_result = ((iy * n_total) + ix);
                                    break _inl_42__inl_8__inl_7;
                                }
                                _inl_42__inl_8_result = _inl_42__inl_8__inl_7_result;
                                break _inl_42__inl_8;
                            }
                            _inl_42_result = ((_b_radiation_E[_inl_42__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_42__inl_8_result]));
                            break _inl_42;
                        }
                        const er_c = _inl_42_result;
                        let _inl_43_result;
                        _inl_43: {
                            let _inl_43__inl_8_result;
                            _inl_43__inl_8: {
                                let _inl_43__inl_8__inl_7_result;
                                _inl_43__inl_8__inl_7: {
                                    _inl_43__inl_8__inl_7_result = ((iy * n_total) + ix_l);
                                    break _inl_43__inl_8__inl_7;
                                }
                                _inl_43__inl_8_result = _inl_43__inl_8__inl_7_result;
                                break _inl_43__inl_8;
                            }
                            _inl_43_result = ((_b_radiation_E[_inl_43__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_43__inl_8_result]));
                            break _inl_43;
                        }
                        const er_l = _inl_43_result;
                        let _inl_44_result;
                        _inl_44: {
                            let _inl_44__inl_8_result;
                            _inl_44__inl_8: {
                                let _inl_44__inl_8__inl_7_result;
                                _inl_44__inl_8__inl_7: {
                                    _inl_44__inl_8__inl_7_result = ((iy * n_total) + ix_r);
                                    break _inl_44__inl_8__inl_7;
                                }
                                _inl_44__inl_8_result = _inl_44__inl_8__inl_7_result;
                                break _inl_44__inl_8;
                            }
                            _inl_44_result = ((_b_radiation_E[_inl_44__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_44__inl_8_result]));
                            break _inl_44;
                        }
                        const er_r = _inl_44_result;
                        let _inl_45_result;
                        _inl_45: {
                            let _inl_45__inl_8_result;
                            _inl_45__inl_8: {
                                let _inl_45__inl_8__inl_7_result;
                                _inl_45__inl_8__inl_7: {
                                    _inl_45__inl_8__inl_7_result = ((iy_d * n_total) + ix);
                                    break _inl_45__inl_8__inl_7;
                                }
                                _inl_45__inl_8_result = _inl_45__inl_8__inl_7_result;
                                break _inl_45__inl_8;
                            }
                            _inl_45_result = ((_b_radiation_E[_inl_45__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_45__inl_8_result]));
                            break _inl_45;
                        }
                        const er_d = _inl_45_result;
                        let _inl_46_result;
                        _inl_46: {
                            let _inl_46__inl_8_result;
                            _inl_46__inl_8: {
                                let _inl_46__inl_8__inl_7_result;
                                _inl_46__inl_8__inl_7: {
                                    _inl_46__inl_8__inl_7_result = ((iy_u * n_total) + ix);
                                    break _inl_46__inl_8__inl_7;
                                }
                                _inl_46__inl_8_result = _inl_46__inl_8__inl_7_result;
                                break _inl_46__inl_8;
                            }
                            _inl_46_result = ((_b_radiation_E[_inl_46__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_46__inl_8_result]));
                            break _inl_46;
                        }
                        const er_u = _inl_46_result;
                        const D_c = diffusion_coeff(ix, iy, n_interior, n_total, ghost);
                        const D_l = (0.5 * ((D_c + diffusion_coeff(ix_l, iy, n_interior, n_total, ghost))));
                        const D_r = (0.5 * ((D_c + diffusion_coeff(ix_r, iy, n_interior, n_total, ghost))));
                        const D_d = (0.5 * ((D_c + diffusion_coeff(ix, iy_d, n_interior, n_total, ghost))));
                        const D_u = (0.5 * ((D_c + diffusion_coeff(ix, iy_u, n_interior, n_total, ghost))));
                        const inv_dx = (1.0 / _u_U_uniforms_dx);
                        const flux_l = (((-D_l) * ((er_c - er_l))) * inv_dx);
                        const flux_r = (((-D_r) * ((er_r - er_c))) * inv_dx);
                        const flux_d = (((-D_d) * ((er_c - er_d))) * inv_dx);
                        const flux_u = (((-D_u) * ((er_u - er_c))) * inv_dx);
                        const div_flux = (((((flux_r - flux_l) + flux_u) - flux_d)) * inv_dx);
                        const rho = ((_b_U0[((c) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((c) * 4 + 0) + 0]));
                        let _inl_47_result;
                        _inl_47: {
                            let _inl_47__inl_16_result;
                            _inl_47__inl_16: {
                                _inl_47__inl_16_result = ((iy * n_total) + ix);
                                break _inl_47__inl_16;
                            }
                            const _inl_47_rho = ((_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]));
                            let _inl_47__inl_17_result;
                            _inl_47__inl_17: {
                                let _inl_47__inl_17__inl_13_result;
                                _inl_47__inl_17__inl_13: {
                                    _inl_47__inl_17__inl_13_result = ((iy * n_total) + ix);
                                    break _inl_47__inl_17__inl_13;
                                }
                                const _inl_47__inl_17_c = _inl_47__inl_17__inl_13_result;
                                let _inl_47__inl_17__inl_14_result;
                                _inl_47__inl_17__inl_14: {
                                    let _inl_47__inl_17__inl_14__inl_9_result;
                                    _inl_47__inl_17__inl_14__inl_9: {
                                        let _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                        _inl_47__inl_17__inl_14__inl_9__inl_0: {
                                            _inl_47__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                            break _inl_47__inl_17__inl_14__inl_9__inl_0;
                                        }
                                        _inl_47__inl_17__inl_14__inl_9_result = _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                        break _inl_47__inl_17__inl_14__inl_9;
                                    }
                                    let _inl_47__inl_17__inl_14__inl_10_result;
                                    _inl_47__inl_17__inl_14__inl_10: {
                                        const _inl_47__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                        let _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                        _inl_47__inl_17__inl_14__inl_10__inl_1: {
                                            _inl_47__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_47__inl_17__inl_14__inl_10__inl_1_ix);
                                            break _inl_47__inl_17__inl_14__inl_10__inl_1;
                                        }
                                        _inl_47__inl_17__inl_14__inl_10_result = _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                        break _inl_47__inl_17__inl_14__inl_10;
                                    }
                                    _inl_47__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_47__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_47__inl_17__inl_14__inl_10_result])));
                                    break _inl_47__inl_17__inl_14;
                                }
                                let _inl_47__inl_17__inl_15_result;
                                _inl_47__inl_17__inl_15: {
                                    let _inl_47__inl_17__inl_15__inl_11_result;
                                    _inl_47__inl_17__inl_15__inl_11: {
                                        let _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                        _inl_47__inl_17__inl_15__inl_11__inl_2: {
                                            _inl_47__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                            break _inl_47__inl_17__inl_15__inl_11__inl_2;
                                        }
                                        _inl_47__inl_17__inl_15__inl_11_result = _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                        break _inl_47__inl_17__inl_15__inl_11;
                                    }
                                    let _inl_47__inl_17__inl_15__inl_12_result;
                                    _inl_47__inl_17__inl_15__inl_12: {
                                        const _inl_47__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                        let _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                        _inl_47__inl_17__inl_15__inl_12__inl_3: {
                                            _inl_47__inl_17__inl_15__inl_12__inl_3_result = ((_inl_47__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                            break _inl_47__inl_17__inl_15__inl_12__inl_3;
                                        }
                                        _inl_47__inl_17__inl_15__inl_12_result = _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                        break _inl_47__inl_17__inl_15__inl_12;
                                    }
                                    _inl_47__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_47__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_47__inl_17__inl_15__inl_12_result])));
                                    break _inl_47__inl_17__inl_15;
                                }
                                _inl_47__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), _inl_47__inl_17__inl_14_result, _inl_47__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                break _inl_47__inl_17;
                            }
                            _inl_47_result = (_inl_47__inl_17_result / _inl_47_rho);
                            break _inl_47;
                        }
                        const T = _inl_47_result;
                        const er_lte = (((_u_U_uniforms_radiation_const) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_const)) * Math.pow(((T) < (0.0) ? (0.0) : (T)), 4.0));
                        let _inl_48_result;
                        _inl_48: {
                            let _inl_48__inl_19_result;
                            _inl_48__inl_19: {
                                let _inl_48__inl_19__inl_18_result;
                                _inl_48__inl_19__inl_18: {
                                    let _inl_48__inl_19__inl_18__inl_16_result;
                                    _inl_48__inl_19__inl_18__inl_16: {
                                        _inl_48__inl_19__inl_18__inl_16_result = ((iy * n_total) + ix);
                                        break _inl_48__inl_19__inl_18__inl_16;
                                    }
                                    const _inl_48__inl_19__inl_18_rho = ((_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]));
                                    let _inl_48__inl_19__inl_18__inl_17_result;
                                    _inl_48__inl_19__inl_18__inl_17: {
                                        let _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_13: {
                                            _inl_48__inl_19__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                            break _inl_48__inl_19__inl_18__inl_17__inl_13;
                                        }
                                        const _inl_48__inl_19__inl_18__inl_17_c = _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                        let _inl_48__inl_19__inl_18__inl_17__inl_14_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_14: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9;
                                            }
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10: {
                                                const _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                                let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result])));
                                            break _inl_48__inl_19__inl_18__inl_17__inl_14;
                                        }
                                        let _inl_48__inl_19__inl_18__inl_17__inl_15_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_15: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11: {
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11;
                                            }
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12: {
                                                const _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                                let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                                    _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                                    break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3;
                                                }
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result])));
                                            break _inl_48__inl_19__inl_18__inl_17__inl_15;
                                        }
                                        _inl_48__inl_19__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), _inl_48__inl_19__inl_18__inl_17__inl_14_result, _inl_48__inl_19__inl_18__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                        break _inl_48__inl_19__inl_18__inl_17;
                                    }
                                    _inl_48__inl_19__inl_18_result = (_inl_48__inl_19__inl_18__inl_17_result / _inl_48__inl_19__inl_18_rho);
                                    break _inl_48__inl_19__inl_18;
                                }
                                _inl_48__inl_19_result = (_inl_48__inl_19__inl_18_result / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                                break _inl_48__inl_19;
                            }
                            let _inl_48__inl_20_result;
                            _inl_48__inl_20: {
                                _inl_48__inl_20_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_ABS_START, MICRO_RAD_COUNT, _inl_48__inl_19_result)), 0.01, 32.0));
                                break _inl_48__inl_20;
                            }
                            _inl_48_result = (((_u_U_uniforms_radiation_kappa_abs) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_abs)) * _inl_48__inl_20_result);
                            break _inl_48;
                        }
                        const kappa_abs = _inl_48_result;
                        const dt = ((_u_dt_buf_dt) < (0.0) ? (0.0) : (_u_dt_buf_dt));
                        const a = ((_u_U_uniforms_radiation_c * kappa_abs) * rho);
                        const exch_dEr = (((er_lte - er_c)) * ((1.0 - Math.exp(((-a) * dt)))));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = (((-div_flux) * dt) + exch_dEr);
                            const _wt1 = (-exch_dEr);
                            const _wt2 = 0.0;
                            const _wt3 = 0.0;
                            _b_radiation_dE[_wbase + 0] = _wt0;
                            _b_radiation_dE[_wbase + 1] = _wt1;
                            _b_radiation_dE[_wbase + 2] = _wt2;
                            _b_radiation_dE[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else {
            const __clipXn = Math.min(Xn, __clipXBound);
            const __clipYn = Math.min(Yn, __clipYBound);
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < __clipYn; __gy++)
            for (let __gx = Ox; __gx < __clipXn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_36_result;
                    _inl_36: {
                        _inl_36_result = ((iy * n_total) + ix);
                        break _inl_36;
                    }
                    const c = _inl_36_result;
                    let _inl_37_result;
                    _inl_37: {
                        const _inl_37__inl_6_flags = _u_U_uniforms_physics_flags;
                        let _inl_37__inl_6_result;
                        _inl_37__inl_6: {
                            _inl_37__inl_6_result = (((_inl_37__inl_6_flags & FLAG_RADIATION)) != 0);
                            break _inl_37__inl_6;
                        }
                        _inl_37_result = ((_inl_37__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                        break _inl_37;
                    }
                    if ((!_inl_37_result)) {
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = 0.0;
                            const _wt1 = 0.0;
                            const _wt2 = 0.0;
                            const _wt3 = 0.0;
                            _b_radiation_dE[_wbase + 0] = _wt0;
                            _b_radiation_dE[_wbase + 1] = _wt1;
                            _b_radiation_dE[_wbase + 2] = _wt2;
                            _b_radiation_dE[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const _inl_38_offset = (-1);
                    let _inl_38_result;
                    _inl_38: {
                        _inl_38_result = sample_axis(ix, _inl_38_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                        break _inl_38;
                    }
                    const ix_l = _inl_38_result;
                    const _inl_39_offset = 1;
                    let _inl_39_result;
                    _inl_39: {
                        _inl_39_result = sample_axis(ix, _inl_39_offset, n_interior, ghost, _b_bc.mode_w, _b_bc.mode_e);
                        break _inl_39;
                    }
                    const ix_r = _inl_39_result;
                    const _inl_40_offset = (-1);
                    let _inl_40_result;
                    _inl_40: {
                        _inl_40_result = sample_axis(iy, _inl_40_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                        break _inl_40;
                    }
                    const iy_d = _inl_40_result;
                    const _inl_41_offset = 1;
                    let _inl_41_result;
                    _inl_41: {
                        _inl_41_result = sample_axis(iy, _inl_41_offset, n_interior, ghost, _b_bc.mode_s, _b_bc.mode_n);
                        break _inl_41;
                    }
                    const iy_u = _inl_41_result;
                    let _inl_42_result;
                    _inl_42: {
                        let _inl_42__inl_8_result;
                        _inl_42__inl_8: {
                            let _inl_42__inl_8__inl_7_result;
                            _inl_42__inl_8__inl_7: {
                                _inl_42__inl_8__inl_7_result = ((iy * n_total) + ix);
                                break _inl_42__inl_8__inl_7;
                            }
                            _inl_42__inl_8_result = _inl_42__inl_8__inl_7_result;
                            break _inl_42__inl_8;
                        }
                        _inl_42_result = ((_b_radiation_E[_inl_42__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_42__inl_8_result]));
                        break _inl_42;
                    }
                    const er_c = _inl_42_result;
                    let _inl_43_result;
                    _inl_43: {
                        let _inl_43__inl_8_result;
                        _inl_43__inl_8: {
                            let _inl_43__inl_8__inl_7_result;
                            _inl_43__inl_8__inl_7: {
                                _inl_43__inl_8__inl_7_result = ((iy * n_total) + ix_l);
                                break _inl_43__inl_8__inl_7;
                            }
                            _inl_43__inl_8_result = _inl_43__inl_8__inl_7_result;
                            break _inl_43__inl_8;
                        }
                        _inl_43_result = ((_b_radiation_E[_inl_43__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_43__inl_8_result]));
                        break _inl_43;
                    }
                    const er_l = _inl_43_result;
                    let _inl_44_result;
                    _inl_44: {
                        let _inl_44__inl_8_result;
                        _inl_44__inl_8: {
                            let _inl_44__inl_8__inl_7_result;
                            _inl_44__inl_8__inl_7: {
                                _inl_44__inl_8__inl_7_result = ((iy * n_total) + ix_r);
                                break _inl_44__inl_8__inl_7;
                            }
                            _inl_44__inl_8_result = _inl_44__inl_8__inl_7_result;
                            break _inl_44__inl_8;
                        }
                        _inl_44_result = ((_b_radiation_E[_inl_44__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_44__inl_8_result]));
                        break _inl_44;
                    }
                    const er_r = _inl_44_result;
                    let _inl_45_result;
                    _inl_45: {
                        let _inl_45__inl_8_result;
                        _inl_45__inl_8: {
                            let _inl_45__inl_8__inl_7_result;
                            _inl_45__inl_8__inl_7: {
                                _inl_45__inl_8__inl_7_result = ((iy_d * n_total) + ix);
                                break _inl_45__inl_8__inl_7;
                            }
                            _inl_45__inl_8_result = _inl_45__inl_8__inl_7_result;
                            break _inl_45__inl_8;
                        }
                        _inl_45_result = ((_b_radiation_E[_inl_45__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_45__inl_8_result]));
                        break _inl_45;
                    }
                    const er_d = _inl_45_result;
                    let _inl_46_result;
                    _inl_46: {
                        let _inl_46__inl_8_result;
                        _inl_46__inl_8: {
                            let _inl_46__inl_8__inl_7_result;
                            _inl_46__inl_8__inl_7: {
                                _inl_46__inl_8__inl_7_result = ((iy_u * n_total) + ix);
                                break _inl_46__inl_8__inl_7;
                            }
                            _inl_46__inl_8_result = _inl_46__inl_8__inl_7_result;
                            break _inl_46__inl_8;
                        }
                        _inl_46_result = ((_b_radiation_E[_inl_46__inl_8_result]) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : (_b_radiation_E[_inl_46__inl_8_result]));
                        break _inl_46;
                    }
                    const er_u = _inl_46_result;
                    const D_c = diffusion_coeff(ix, iy, n_interior, n_total, ghost);
                    const D_l = (0.5 * ((D_c + diffusion_coeff(ix_l, iy, n_interior, n_total, ghost))));
                    const D_r = (0.5 * ((D_c + diffusion_coeff(ix_r, iy, n_interior, n_total, ghost))));
                    const D_d = (0.5 * ((D_c + diffusion_coeff(ix, iy_d, n_interior, n_total, ghost))));
                    const D_u = (0.5 * ((D_c + diffusion_coeff(ix, iy_u, n_interior, n_total, ghost))));
                    const inv_dx = (1.0 / _u_U_uniforms_dx);
                    const flux_l = (((-D_l) * ((er_c - er_l))) * inv_dx);
                    const flux_r = (((-D_r) * ((er_r - er_c))) * inv_dx);
                    const flux_d = (((-D_d) * ((er_c - er_d))) * inv_dx);
                    const flux_u = (((-D_u) * ((er_u - er_c))) * inv_dx);
                    const div_flux = (((((flux_r - flux_l) + flux_u) - flux_d)) * inv_dx);
                    const rho = ((_b_U0[((c) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((c) * 4 + 0) + 0]));
                    let _inl_47_result;
                    _inl_47: {
                        let _inl_47__inl_16_result;
                        _inl_47__inl_16: {
                            _inl_47__inl_16_result = ((iy * n_total) + ix);
                            break _inl_47__inl_16;
                        }
                        const _inl_47_rho = ((_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_47__inl_16_result) * 4 + 0) + 0]));
                        let _inl_47__inl_17_result;
                        _inl_47__inl_17: {
                            let _inl_47__inl_17__inl_13_result;
                            _inl_47__inl_17__inl_13: {
                                _inl_47__inl_17__inl_13_result = ((iy * n_total) + ix);
                                break _inl_47__inl_17__inl_13;
                            }
                            const _inl_47__inl_17_c = _inl_47__inl_17__inl_13_result;
                            let _inl_47__inl_17__inl_14_result;
                            _inl_47__inl_17__inl_14: {
                                let _inl_47__inl_17__inl_14__inl_9_result;
                                _inl_47__inl_17__inl_14__inl_9: {
                                    let _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                    _inl_47__inl_17__inl_14__inl_9__inl_0: {
                                        _inl_47__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_47__inl_17__inl_14__inl_9__inl_0;
                                    }
                                    _inl_47__inl_17__inl_14__inl_9_result = _inl_47__inl_17__inl_14__inl_9__inl_0_result;
                                    break _inl_47__inl_17__inl_14__inl_9;
                                }
                                let _inl_47__inl_17__inl_14__inl_10_result;
                                _inl_47__inl_17__inl_14__inl_10: {
                                    const _inl_47__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                    let _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                    _inl_47__inl_17__inl_14__inl_10__inl_1: {
                                        _inl_47__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_47__inl_17__inl_14__inl_10__inl_1_ix);
                                        break _inl_47__inl_17__inl_14__inl_10__inl_1;
                                    }
                                    _inl_47__inl_17__inl_14__inl_10_result = _inl_47__inl_17__inl_14__inl_10__inl_1_result;
                                    break _inl_47__inl_17__inl_14__inl_10;
                                }
                                _inl_47__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_47__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_47__inl_17__inl_14__inl_10_result])));
                                break _inl_47__inl_17__inl_14;
                            }
                            let _inl_47__inl_17__inl_15_result;
                            _inl_47__inl_17__inl_15: {
                                let _inl_47__inl_17__inl_15__inl_11_result;
                                _inl_47__inl_17__inl_15__inl_11: {
                                    let _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                    _inl_47__inl_17__inl_15__inl_11__inl_2: {
                                        _inl_47__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_47__inl_17__inl_15__inl_11__inl_2;
                                    }
                                    _inl_47__inl_17__inl_15__inl_11_result = _inl_47__inl_17__inl_15__inl_11__inl_2_result;
                                    break _inl_47__inl_17__inl_15__inl_11;
                                }
                                let _inl_47__inl_17__inl_15__inl_12_result;
                                _inl_47__inl_17__inl_15__inl_12: {
                                    const _inl_47__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                    let _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                    _inl_47__inl_17__inl_15__inl_12__inl_3: {
                                        _inl_47__inl_17__inl_15__inl_12__inl_3_result = ((_inl_47__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                        break _inl_47__inl_17__inl_15__inl_12__inl_3;
                                    }
                                    _inl_47__inl_17__inl_15__inl_12_result = _inl_47__inl_17__inl_15__inl_12__inl_3_result;
                                    break _inl_47__inl_17__inl_15__inl_12;
                                }
                                _inl_47__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_47__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_47__inl_17__inl_15__inl_12_result])));
                                break _inl_47__inl_17__inl_15;
                            }
                            _inl_47__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_47__inl_17_c) * 4 + 0)), _inl_47__inl_17__inl_14_result, _inl_47__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            break _inl_47__inl_17;
                        }
                        _inl_47_result = (_inl_47__inl_17_result / _inl_47_rho);
                        break _inl_47;
                    }
                    const T = _inl_47_result;
                    const er_lte = (((_u_U_uniforms_radiation_const) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_const)) * Math.pow(((T) < (0.0) ? (0.0) : (T)), 4.0));
                    let _inl_48_result;
                    _inl_48: {
                        let _inl_48__inl_19_result;
                        _inl_48__inl_19: {
                            let _inl_48__inl_19__inl_18_result;
                            _inl_48__inl_19__inl_18: {
                                let _inl_48__inl_19__inl_18__inl_16_result;
                                _inl_48__inl_19__inl_18__inl_16: {
                                    _inl_48__inl_19__inl_18__inl_16_result = ((iy * n_total) + ix);
                                    break _inl_48__inl_19__inl_18__inl_16;
                                }
                                const _inl_48__inl_19__inl_18_rho = ((_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_b_U0[((_inl_48__inl_19__inl_18__inl_16_result) * 4 + 0) + 0]));
                                let _inl_48__inl_19__inl_18__inl_17_result;
                                _inl_48__inl_19__inl_18__inl_17: {
                                    let _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                    _inl_48__inl_19__inl_18__inl_17__inl_13: {
                                        _inl_48__inl_19__inl_18__inl_17__inl_13_result = ((iy * n_total) + ix);
                                        break _inl_48__inl_19__inl_18__inl_17__inl_13;
                                    }
                                    const _inl_48__inl_19__inl_18__inl_17_c = _inl_48__inl_19__inl_18__inl_17__inl_13_result;
                                    let _inl_48__inl_19__inl_18__inl_17__inl_14_result;
                                    _inl_48__inl_19__inl_18__inl_17__inl_14: {
                                        let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0: {
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9__inl_0_result;
                                            break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_9;
                                        }
                                        let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10: {
                                            const _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix = (ix + 1);
                                            let _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1: {
                                                _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_ix);
                                                break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result = _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10__inl_1_result;
                                            break _inl_48__inl_19__inl_18__inl_17__inl_14__inl_10;
                                        }
                                        _inl_48__inl_19__inl_18__inl_17__inl_14_result = (0.5 * ((_b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_9_result] + _b_Bx_face[_inl_48__inl_19__inl_18__inl_17__inl_14__inl_10_result])));
                                        break _inl_48__inl_19__inl_18__inl_17__inl_14;
                                    }
                                    let _inl_48__inl_19__inl_18__inl_17__inl_15_result;
                                    _inl_48__inl_19__inl_18__inl_17__inl_15: {
                                        let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11: {
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2: {
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result = ((iy * n_total) + ix);
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11__inl_2_result;
                                            break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_11;
                                        }
                                        let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result;
                                        _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12: {
                                            const _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy = (iy + 1);
                                            let _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3: {
                                                _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result = ((_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_iy * n_total) + ix);
                                                break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3;
                                            }
                                            _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result = _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12__inl_3_result;
                                            break _inl_48__inl_19__inl_18__inl_17__inl_15__inl_12;
                                        }
                                        _inl_48__inl_19__inl_18__inl_17__inl_15_result = (0.5 * ((_b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_11_result] + _b_By_face[_inl_48__inl_19__inl_18__inl_17__inl_15__inl_12_result])));
                                        break _inl_48__inl_19__inl_18__inl_17__inl_15;
                                    }
                                    _inl_48__inl_19__inl_18__inl_17_result = pressure_from_dual_energy(((_b) => ({x:_b_U0[_b + 0], y:_b_U0[_b + 1], z:_b_U0[_b + 2], w:_b_U0[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), ((_b) => ({x:_b_U1[_b + 0], y:_b_U1[_b + 1], z:_b_U1[_b + 2], w:_b_U1[_b + 3]}))(((_inl_48__inl_19__inl_18__inl_17_c) * 4 + 0)), _inl_48__inl_19__inl_18__inl_17__inl_14_result, _inl_48__inl_19__inl_18__inl_17__inl_15_result, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                    break _inl_48__inl_19__inl_18__inl_17;
                                }
                                _inl_48__inl_19__inl_18_result = (_inl_48__inl_19__inl_18__inl_17_result / _inl_48__inl_19__inl_18_rho);
                                break _inl_48__inl_19__inl_18;
                            }
                            _inl_48__inl_19_result = (_inl_48__inl_19__inl_18_result / ((_u_U_uniforms_cooling_T_ref) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_cooling_T_ref)));
                            break _inl_48__inl_19;
                        }
                        let _inl_48__inl_20_result;
                        _inl_48__inl_20: {
                            _inl_48__inl_20_result = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(Math.pow(10.0, micro_log_interp_rad(MICRO_RAD_ABS_START, MICRO_RAD_COUNT, _inl_48__inl_19_result)), 0.01, 32.0));
                            break _inl_48__inl_20;
                        }
                        _inl_48_result = (((_u_U_uniforms_radiation_kappa_abs) < (0.0) ? (0.0) : (_u_U_uniforms_radiation_kappa_abs)) * _inl_48__inl_20_result);
                        break _inl_48;
                    }
                    const kappa_abs = _inl_48_result;
                    const dt = ((_u_dt_buf_dt) < (0.0) ? (0.0) : (_u_dt_buf_dt));
                    const a = ((_u_U_uniforms_radiation_c * kappa_abs) * rho);
                    const exch_dEr = (((er_lte - er_c)) * ((1.0 - Math.exp(((-a) * dt)))));
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = (((-div_flux) * dt) + exch_dEr);
                        const _wt1 = (-exch_dEr);
                        const _wt2 = 0.0;
                        const _wt3 = 0.0;
                        _b_radiation_dE[_wbase + 0] = _wt0;
                        _b_radiation_dE[_wbase + 1] = _wt1;
                        _b_radiation_dE[_wbase + 2] = _wt2;
                        _b_radiation_dE[_wbase + 3] = _wt3;
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
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_radiation_c = _b_U_uniforms.radiation_c;
        const _u_U_uniforms_radiation_kappa_abs = _b_U_uniforms.radiation_kappa_abs;
        const _u_U_uniforms_radiation_kappa_scat = _b_U_uniforms.radiation_kappa_scat;
        const _u_U_uniforms_radiation_floor = _b_U_uniforms.radiation_floor;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_radiation_E = bindings.radiation_E;
        const _b_radiation_dE = bindings.radiation_dE;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_U_uniforms_grid_n;
        const __clipYBound = _u_U_uniforms_grid_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    __invocation: {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_49_result;
                        _inl_49: {
                            _inl_49_result = ((iy * n_total) + ix);
                            break _inl_49;
                        }
                        const c = _inl_49_result;
                        let _inl_50_result;
                        _inl_50: {
                            const _inl_50__inl_6_flags = _u_U_uniforms_physics_flags;
                            let _inl_50__inl_6_result;
                            _inl_50__inl_6: {
                                _inl_50__inl_6_result = (((_inl_50__inl_6_flags & FLAG_RADIATION)) != 0);
                                break _inl_50__inl_6;
                            }
                            _inl_50_result = ((_inl_50__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                            break _inl_50;
                        }
                        if ((!_inl_50_result)) {
                            break __invocation;
                        }
                        const _sroa_2_base = ((c) * 4 + 0);
                        const d_x = _b_radiation_dE[_sroa_2_base + 0];
                        const d_y = _b_radiation_dE[_sroa_2_base + 1];
                        const d_z = _b_radiation_dE[_sroa_2_base + 2];
                        const d_w = _b_radiation_dE[_sroa_2_base + 3];
                        _b_radiation_E[c] = (((_b_radiation_E[c] + d_x)) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : ((_b_radiation_E[c] + d_x)));
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
                        const bz = u1_y;
                        let _inl_51_result;
                        _inl_51: {
                            let _inl_51__inl_9_result;
                            _inl_51__inl_9: {
                                let _inl_51__inl_9__inl_0_result;
                                _inl_51__inl_9__inl_0: {
                                    _inl_51__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_51__inl_9__inl_0;
                                }
                                _inl_51__inl_9_result = _inl_51__inl_9__inl_0_result;
                                break _inl_51__inl_9;
                            }
                            let _inl_51__inl_10_result;
                            _inl_51__inl_10: {
                                const _inl_51__inl_10__inl_1_ix = (ix + 1);
                                let _inl_51__inl_10__inl_1_result;
                                _inl_51__inl_10__inl_1: {
                                    _inl_51__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_51__inl_10__inl_1_ix);
                                    break _inl_51__inl_10__inl_1;
                                }
                                _inl_51__inl_10_result = _inl_51__inl_10__inl_1_result;
                                break _inl_51__inl_10;
                            }
                            _inl_51_result = (0.5 * ((_b_Bx_face[_inl_51__inl_9_result] + _b_Bx_face[_inl_51__inl_10_result])));
                            break _inl_51;
                        }
                        const bx_c = _inl_51_result;
                        let _inl_52_result;
                        _inl_52: {
                            let _inl_52__inl_11_result;
                            _inl_52__inl_11: {
                                let _inl_52__inl_11__inl_2_result;
                                _inl_52__inl_11__inl_2: {
                                    _inl_52__inl_11__inl_2_result = ((iy * n_total) + ix);
                                    break _inl_52__inl_11__inl_2;
                                }
                                _inl_52__inl_11_result = _inl_52__inl_11__inl_2_result;
                                break _inl_52__inl_11;
                            }
                            let _inl_52__inl_12_result;
                            _inl_52__inl_12: {
                                const _inl_52__inl_12__inl_3_iy = (iy + 1);
                                let _inl_52__inl_12__inl_3_result;
                                _inl_52__inl_12__inl_3: {
                                    _inl_52__inl_12__inl_3_result = ((_inl_52__inl_12__inl_3_iy * n_total) + ix);
                                    break _inl_52__inl_12__inl_3;
                                }
                                _inl_52__inl_12_result = _inl_52__inl_12__inl_3_result;
                                break _inl_52__inl_12;
                            }
                            _inl_52_result = (0.5 * ((_b_By_face[_inl_52__inl_11_result] + _b_By_face[_inl_52__inl_12_result])));
                            break _inl_52;
                        }
                        const by_c = _inl_52_result;
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                        const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E_new = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((u1_x + d_y), E_min, 1.0e30));
                        const p_new = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                        const _inl_53_gamma = _u_U_uniforms_gamma;
                        const _inl_53_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_53_result_x, _inl_53_result_y, _inl_53_result_z, _inl_53_result_w;
                        _inl_53: {
                            const _inl_53_p_safe = ((p_new) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (p_new));
                            const _inl_53_eth = (_inl_53_p_safe / (((_inl_53_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_53_gamma - 1.0))));
                            let _inl_53__inl_4_result;
                            _inl_53__inl_4: {
                                _inl_53__inl_4_result = (((_inl_53_p_safe) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (_inl_53_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_53_gamma));
                                break _inl_53__inl_4;
                            }
                            const _ir0 = E_new;
                            const _ir1 = bz;
                            const _ir2 = _inl_53_eth;
                            const _ir3 = _inl_53__inl_4_result;
                            _inl_53_result_x = _ir0;
                            _inl_53_result_y = _ir1;
                            _inl_53_result_z = _ir2;
                            _inl_53_result_w = _ir3;
                            break _inl_53;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_53_result_x;
                            const _wt1 = _inl_53_result_y;
                            const _wt2 = _inl_53_result_z;
                            const _wt3 = _inl_53_result_w;
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
                const __clipGx = Math.min(Gx, __clipXBound);
                const __clipGy = Math.min(Gy, __clipYBound);
                for (let __gy = 0, __rowBase = 0; __gy < __clipGy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < __clipGx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_49_result;
                            _inl_49: {
                                _inl_49_result = ((iy * n_total) + ix);
                                break _inl_49;
                            }
                            const c = _inl_49_result;
                            let _inl_50_result;
                            _inl_50: {
                                const _inl_50__inl_6_flags = _u_U_uniforms_physics_flags;
                                let _inl_50__inl_6_result;
                                _inl_50__inl_6: {
                                    _inl_50__inl_6_result = (((_inl_50__inl_6_flags & FLAG_RADIATION)) != 0);
                                    break _inl_50__inl_6;
                                }
                                _inl_50_result = ((_inl_50__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                                break _inl_50;
                            }
                            if ((!_inl_50_result)) {
                                break __invocation;
                            }
                            const _sroa_5_base = ((c) * 4 + 0);
                            const d_x = _b_radiation_dE[_sroa_5_base + 0];
                            const d_y = _b_radiation_dE[_sroa_5_base + 1];
                            const d_z = _b_radiation_dE[_sroa_5_base + 2];
                            const d_w = _b_radiation_dE[_sroa_5_base + 3];
                            _b_radiation_E[c] = (((_b_radiation_E[c] + d_x)) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : ((_b_radiation_E[c] + d_x)));
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
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const mx = u0_y;
                            const my = u0_z;
                            const mz = u0_w;
                            const bz = u1_y;
                            let _inl_51_result;
                            _inl_51: {
                                let _inl_51__inl_9_result;
                                _inl_51__inl_9: {
                                    let _inl_51__inl_9__inl_0_result;
                                    _inl_51__inl_9__inl_0: {
                                        _inl_51__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_51__inl_9__inl_0;
                                    }
                                    _inl_51__inl_9_result = _inl_51__inl_9__inl_0_result;
                                    break _inl_51__inl_9;
                                }
                                let _inl_51__inl_10_result;
                                _inl_51__inl_10: {
                                    const _inl_51__inl_10__inl_1_ix = (ix + 1);
                                    let _inl_51__inl_10__inl_1_result;
                                    _inl_51__inl_10__inl_1: {
                                        _inl_51__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_51__inl_10__inl_1_ix);
                                        break _inl_51__inl_10__inl_1;
                                    }
                                    _inl_51__inl_10_result = _inl_51__inl_10__inl_1_result;
                                    break _inl_51__inl_10;
                                }
                                _inl_51_result = (0.5 * ((_b_Bx_face[_inl_51__inl_9_result] + _b_Bx_face[_inl_51__inl_10_result])));
                                break _inl_51;
                            }
                            const bx_c = _inl_51_result;
                            let _inl_52_result;
                            _inl_52: {
                                let _inl_52__inl_11_result;
                                _inl_52__inl_11: {
                                    let _inl_52__inl_11__inl_2_result;
                                    _inl_52__inl_11__inl_2: {
                                        _inl_52__inl_11__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_52__inl_11__inl_2;
                                    }
                                    _inl_52__inl_11_result = _inl_52__inl_11__inl_2_result;
                                    break _inl_52__inl_11;
                                }
                                let _inl_52__inl_12_result;
                                _inl_52__inl_12: {
                                    const _inl_52__inl_12__inl_3_iy = (iy + 1);
                                    let _inl_52__inl_12__inl_3_result;
                                    _inl_52__inl_12__inl_3: {
                                        _inl_52__inl_12__inl_3_result = ((_inl_52__inl_12__inl_3_iy * n_total) + ix);
                                        break _inl_52__inl_12__inl_3;
                                    }
                                    _inl_52__inl_12_result = _inl_52__inl_12__inl_3_result;
                                    break _inl_52__inl_12;
                                }
                                _inl_52_result = (0.5 * ((_b_By_face[_inl_52__inl_11_result] + _b_By_face[_inl_52__inl_12_result])));
                                break _inl_52;
                            }
                            const by_c = _inl_52_result;
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                            const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                            const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                            const E_new = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((u1_x + d_y), E_min, 1.0e30));
                            const p_new = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                            const _inl_53_gamma = _u_U_uniforms_gamma;
                            const _inl_53_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_53_result_x, _inl_53_result_y, _inl_53_result_z, _inl_53_result_w;
                            _inl_53: {
                                const _inl_53_p_safe = ((p_new) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (p_new));
                                const _inl_53_eth = (_inl_53_p_safe / (((_inl_53_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_53_gamma - 1.0))));
                                let _inl_53__inl_4_result;
                                _inl_53__inl_4: {
                                    _inl_53__inl_4_result = (((_inl_53_p_safe) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (_inl_53_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_53_gamma));
                                    break _inl_53__inl_4;
                                }
                                const _ir0 = E_new;
                                const _ir1 = bz;
                                const _ir2 = _inl_53_eth;
                                const _ir3 = _inl_53__inl_4_result;
                                _inl_53_result_x = _ir0;
                                _inl_53_result_y = _ir1;
                                _inl_53_result_z = _ir2;
                                _inl_53_result_w = _ir3;
                                break _inl_53;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_53_result_x;
                                const _wt1 = _inl_53_result_y;
                                const _wt2 = _inl_53_result_z;
                                const _wt3 = _inl_53_result_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                const __clipXn = Math.min(Xn, __clipXBound);
                const __clipYn = Math.min(Yn, __clipYBound);
                for (let __gy = Oy; __gy < __clipYn; __gy++)
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_49_result;
                        _inl_49: {
                            _inl_49_result = ((iy * n_total) + ix);
                            break _inl_49;
                        }
                        const c = _inl_49_result;
                        let _inl_50_result;
                        _inl_50: {
                            const _inl_50__inl_6_flags = _u_U_uniforms_physics_flags;
                            let _inl_50__inl_6_result;
                            _inl_50__inl_6: {
                                _inl_50__inl_6_result = (((_inl_50__inl_6_flags & FLAG_RADIATION)) != 0);
                                break _inl_50__inl_6;
                            }
                            _inl_50_result = ((_inl_50__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                            break _inl_50;
                        }
                        if ((!_inl_50_result)) {
                            break __invocation;
                        }
                        const _sroa_8_base = ((c) * 4 + 0);
                        const d_x = _b_radiation_dE[_sroa_8_base + 0];
                        const d_y = _b_radiation_dE[_sroa_8_base + 1];
                        const d_z = _b_radiation_dE[_sroa_8_base + 2];
                        const d_w = _b_radiation_dE[_sroa_8_base + 3];
                        _b_radiation_E[c] = (((_b_radiation_E[c] + d_x)) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : ((_b_radiation_E[c] + d_x)));
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
                        const bz = u1_y;
                        let _inl_51_result;
                        _inl_51: {
                            let _inl_51__inl_9_result;
                            _inl_51__inl_9: {
                                let _inl_51__inl_9__inl_0_result;
                                _inl_51__inl_9__inl_0: {
                                    _inl_51__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_51__inl_9__inl_0;
                                }
                                _inl_51__inl_9_result = _inl_51__inl_9__inl_0_result;
                                break _inl_51__inl_9;
                            }
                            let _inl_51__inl_10_result;
                            _inl_51__inl_10: {
                                const _inl_51__inl_10__inl_1_ix = (ix + 1);
                                let _inl_51__inl_10__inl_1_result;
                                _inl_51__inl_10__inl_1: {
                                    _inl_51__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_51__inl_10__inl_1_ix);
                                    break _inl_51__inl_10__inl_1;
                                }
                                _inl_51__inl_10_result = _inl_51__inl_10__inl_1_result;
                                break _inl_51__inl_10;
                            }
                            _inl_51_result = (0.5 * ((_b_Bx_face[_inl_51__inl_9_result] + _b_Bx_face[_inl_51__inl_10_result])));
                            break _inl_51;
                        }
                        const bx_c = _inl_51_result;
                        let _inl_52_result;
                        _inl_52: {
                            let _inl_52__inl_11_result;
                            _inl_52__inl_11: {
                                let _inl_52__inl_11__inl_2_result;
                                _inl_52__inl_11__inl_2: {
                                    _inl_52__inl_11__inl_2_result = ((iy * n_total) + ix);
                                    break _inl_52__inl_11__inl_2;
                                }
                                _inl_52__inl_11_result = _inl_52__inl_11__inl_2_result;
                                break _inl_52__inl_11;
                            }
                            let _inl_52__inl_12_result;
                            _inl_52__inl_12: {
                                const _inl_52__inl_12__inl_3_iy = (iy + 1);
                                let _inl_52__inl_12__inl_3_result;
                                _inl_52__inl_12__inl_3: {
                                    _inl_52__inl_12__inl_3_result = ((_inl_52__inl_12__inl_3_iy * n_total) + ix);
                                    break _inl_52__inl_12__inl_3;
                                }
                                _inl_52__inl_12_result = _inl_52__inl_12__inl_3_result;
                                break _inl_52__inl_12;
                            }
                            _inl_52_result = (0.5 * ((_b_By_face[_inl_52__inl_11_result] + _b_By_face[_inl_52__inl_12_result])));
                            break _inl_52;
                        }
                        const by_c = _inl_52_result;
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                        const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E_new = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((u1_x + d_y), E_min, 1.0e30));
                        const p_new = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                        const _inl_53_gamma = _u_U_uniforms_gamma;
                        const _inl_53_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_53_result_x, _inl_53_result_y, _inl_53_result_z, _inl_53_result_w;
                        _inl_53: {
                            const _inl_53_p_safe = ((p_new) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (p_new));
                            const _inl_53_eth = (_inl_53_p_safe / (((_inl_53_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_53_gamma - 1.0))));
                            let _inl_53__inl_4_result;
                            _inl_53__inl_4: {
                                _inl_53__inl_4_result = (((_inl_53_p_safe) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (_inl_53_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_53_gamma));
                                break _inl_53__inl_4;
                            }
                            const _ir0 = E_new;
                            const _ir1 = bz;
                            const _ir2 = _inl_53_eth;
                            const _ir3 = _inl_53__inl_4_result;
                            _inl_53_result_x = _ir0;
                            _inl_53_result_y = _ir1;
                            _inl_53_result_z = _ir2;
                            _inl_53_result_w = _ir3;
                            break _inl_53;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_53_result_x;
                            const _wt1 = _inl_53_result_y;
                            const _wt2 = _inl_53_result_z;
                            const _wt3 = _inl_53_result_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else {
            const __clipXn = Math.min(Xn, __clipXBound);
            const __clipYn = Math.min(Yn, __clipYBound);
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < __clipYn; __gy++)
            for (let __gx = Ox; __gx < __clipXn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_49_result;
                    _inl_49: {
                        _inl_49_result = ((iy * n_total) + ix);
                        break _inl_49;
                    }
                    const c = _inl_49_result;
                    let _inl_50_result;
                    _inl_50: {
                        const _inl_50__inl_6_flags = _u_U_uniforms_physics_flags;
                        let _inl_50__inl_6_result;
                        _inl_50__inl_6: {
                            _inl_50__inl_6_result = (((_inl_50__inl_6_flags & FLAG_RADIATION)) != 0);
                            break _inl_50__inl_6;
                        }
                        _inl_50_result = ((_inl_50__inl_6_result && (_u_U_uniforms_radiation_c > 0.0)) && (((_u_U_uniforms_radiation_kappa_abs > 0.0) || (_u_U_uniforms_radiation_kappa_scat > 0.0))));
                        break _inl_50;
                    }
                    if ((!_inl_50_result)) {
                        break __invocation;
                    }
                    const _sroa_11_base = ((c) * 4 + 0);
                    const d_x = _b_radiation_dE[_sroa_11_base + 0];
                    const d_y = _b_radiation_dE[_sroa_11_base + 1];
                    const d_z = _b_radiation_dE[_sroa_11_base + 2];
                    const d_w = _b_radiation_dE[_sroa_11_base + 3];
                    _b_radiation_E[c] = (((_b_radiation_E[c] + d_x)) < (_u_U_uniforms_radiation_floor) ? (_u_U_uniforms_radiation_floor) : ((_b_radiation_E[c] + d_x)));
                    const _sroa_12_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_12_base + 0];
                    const u0_y = _b_U0[_sroa_12_base + 1];
                    const u0_z = _b_U0[_sroa_12_base + 2];
                    const u0_w = _b_U0[_sroa_12_base + 3];
                    const _sroa_13_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_13_base + 0];
                    const u1_y = _b_U1[_sroa_13_base + 1];
                    const u1_z = _b_U1[_sroa_13_base + 2];
                    const u1_w = _b_U1[_sroa_13_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const mx = u0_y;
                    const my = u0_z;
                    const mz = u0_w;
                    const bz = u1_y;
                    let _inl_51_result;
                    _inl_51: {
                        let _inl_51__inl_9_result;
                        _inl_51__inl_9: {
                            let _inl_51__inl_9__inl_0_result;
                            _inl_51__inl_9__inl_0: {
                                _inl_51__inl_9__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_51__inl_9__inl_0;
                            }
                            _inl_51__inl_9_result = _inl_51__inl_9__inl_0_result;
                            break _inl_51__inl_9;
                        }
                        let _inl_51__inl_10_result;
                        _inl_51__inl_10: {
                            const _inl_51__inl_10__inl_1_ix = (ix + 1);
                            let _inl_51__inl_10__inl_1_result;
                            _inl_51__inl_10__inl_1: {
                                _inl_51__inl_10__inl_1_result = ((iy * ((n_total + 1))) + _inl_51__inl_10__inl_1_ix);
                                break _inl_51__inl_10__inl_1;
                            }
                            _inl_51__inl_10_result = _inl_51__inl_10__inl_1_result;
                            break _inl_51__inl_10;
                        }
                        _inl_51_result = (0.5 * ((_b_Bx_face[_inl_51__inl_9_result] + _b_Bx_face[_inl_51__inl_10_result])));
                        break _inl_51;
                    }
                    const bx_c = _inl_51_result;
                    let _inl_52_result;
                    _inl_52: {
                        let _inl_52__inl_11_result;
                        _inl_52__inl_11: {
                            let _inl_52__inl_11__inl_2_result;
                            _inl_52__inl_11__inl_2: {
                                _inl_52__inl_11__inl_2_result = ((iy * n_total) + ix);
                                break _inl_52__inl_11__inl_2;
                            }
                            _inl_52__inl_11_result = _inl_52__inl_11__inl_2_result;
                            break _inl_52__inl_11;
                        }
                        let _inl_52__inl_12_result;
                        _inl_52__inl_12: {
                            const _inl_52__inl_12__inl_3_iy = (iy + 1);
                            let _inl_52__inl_12__inl_3_result;
                            _inl_52__inl_12__inl_3: {
                                _inl_52__inl_12__inl_3_result = ((_inl_52__inl_12__inl_3_iy * n_total) + ix);
                                break _inl_52__inl_12__inl_3;
                            }
                            _inl_52__inl_12_result = _inl_52__inl_12__inl_3_result;
                            break _inl_52__inl_12;
                        }
                        _inl_52_result = (0.5 * ((_b_By_face[_inl_52__inl_11_result] + _b_By_face[_inl_52__inl_12_result])));
                        break _inl_52;
                    }
                    const by_c = _inl_52_result;
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E_new = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((u1_x + d_y), E_min, 1.0e30));
                    const p_new = (((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E_new - ke) - mb)))));
                    const _inl_53_gamma = _u_U_uniforms_gamma;
                    const _inl_53_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_53_result_x, _inl_53_result_y, _inl_53_result_z, _inl_53_result_w;
                    _inl_53: {
                        const _inl_53_p_safe = ((p_new) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (p_new));
                        const _inl_53_eth = (_inl_53_p_safe / (((_inl_53_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_53_gamma - 1.0))));
                        let _inl_53__inl_4_result;
                        _inl_53__inl_4: {
                            _inl_53__inl_4_result = (((_inl_53_p_safe) < (_inl_53_p_floor) ? (_inl_53_p_floor) : (_inl_53_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_53_gamma));
                            break _inl_53__inl_4;
                        }
                        const _ir0 = E_new;
                        const _ir1 = bz;
                        const _ir2 = _inl_53_eth;
                        const _ir3 = _inl_53__inl_4_result;
                        _inl_53_result_x = _ir0;
                        _inl_53_result_y = _ir1;
                        _inl_53_result_z = _ir2;
                        _inl_53_result_w = _ir3;
                        break _inl_53;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_53_result_x;
                        const _wt1 = _inl_53_result_y;
                        const _wt2 = _inl_53_result_z;
                        const _wt3 = _inl_53_result_w;
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

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf","radiation_E","radiation_dE","micro","bc"], entryInfo };
}
