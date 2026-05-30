// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/energy-floor.wgsl
// wgsl-variant: n512
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: c0925bdff4f4d228ff30bc8e6a4ee7815925cd47a26ffd60e6f332f9bd560d55
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"U_uniforms":{"grid_n":512,"grid_n_total":516,"ghost_w":2}},"fixedWorkgroups":[64,64,1]}
// wgsl-metrics: {"bytes":29688,"lines":537,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":4,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.639Z
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

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0_out = bindings.U0_out;
        const _b_U1_out = bindings.U1_out;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = 512;
        const __clipYBound = 512;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n_interior = 512;
                        const n_total = 516;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const c = _inl_6_result;
                        const _sroa_0_base = ((c) * 4 + 0);
                        const u0_x = _b_U0_out[_sroa_0_base + 0];
                        const u0_y = _b_U0_out[_sroa_0_base + 1];
                        const u0_z = _b_U0_out[_sroa_0_base + 2];
                        const u0_w = _b_U0_out[_sroa_0_base + 3];
                        const _sroa_1_base = ((c) * 4 + 0);
                        const u1_x = _b_U1_out[_sroa_1_base + 0];
                        const u1_y = _b_U1_out[_sroa_1_base + 1];
                        const u1_z = _b_U1_out[_sroa_1_base + 2];
                        const u1_w = _b_U1_out[_sroa_1_base + 3];
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const mx = u0_y;
                        const my = u0_z;
                        const mz = u0_w;
                        const bz = u1_y;
                        let _inl_7_result;
                        _inl_7: {
                            let _inl_7__inl_0_result;
                            _inl_7__inl_0: {
                                _inl_7__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_7__inl_0;
                            }
                            _inl_7_result = _inl_7__inl_0_result;
                            break _inl_7;
                        }
                        let _inl_8_result;
                        _inl_8: {
                            const _inl_8__inl_1_ix = (ix + 1);
                            let _inl_8__inl_1_result;
                            _inl_8__inl_1: {
                                _inl_8__inl_1_result = ((iy * ((n_total + 1))) + _inl_8__inl_1_ix);
                                break _inl_8__inl_1;
                            }
                            _inl_8_result = _inl_8__inl_1_result;
                            break _inl_8;
                        }
                        const bx_c = (0.5 * ((_b_Bx_face[_inl_7_result] + _b_Bx_face[_inl_8_result])));
                        let _inl_9_result;
                        _inl_9: {
                            let _inl_9__inl_2_result;
                            _inl_9__inl_2: {
                                _inl_9__inl_2_result = ((iy * n_total) + ix);
                                break _inl_9__inl_2;
                            }
                            _inl_9_result = _inl_9__inl_2_result;
                            break _inl_9;
                        }
                        let _inl_10_result;
                        _inl_10: {
                            const _inl_10__inl_3_iy = (iy + 1);
                            let _inl_10__inl_3_result;
                            _inl_10__inl_3: {
                                _inl_10__inl_3_result = ((_inl_10__inl_3_iy * n_total) + ix);
                                break _inl_10__inl_3;
                            }
                            _inl_10_result = _inl_10__inl_3_result;
                            break _inl_10;
                        }
                        const by_c = (0.5 * ((_b_By_face[_inl_9_result] + _b_By_face[_inl_10_result])));
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(u1_x, E_min, 1.0e30));
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                        const _inl_11_gamma = _u_U_uniforms_gamma;
                        const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_11_result_x, _inl_11_result_y, _inl_11_result_z, _inl_11_result_w;
                        _inl_11: {
                            const _inl_11_p_safe = ((p) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p));
                            const _inl_11_eth = (_inl_11_p_safe / (((_inl_11_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_11_gamma - 1.0))));
                            let _inl_11__inl_4_result;
                            _inl_11__inl_4: {
                                _inl_11__inl_4_result = (((_inl_11_p_safe) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (_inl_11_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                                break _inl_11__inl_4;
                            }
                            const _ir0 = E;
                            const _ir1 = bz;
                            const _ir2 = _inl_11_eth;
                            const _ir3 = _inl_11__inl_4_result;
                            _inl_11_result_x = _ir0;
                            _inl_11_result_y = _ir1;
                            _inl_11_result_z = _ir2;
                            _inl_11_result_w = _ir3;
                            break _inl_11;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_11_result_x;
                            const _wt1 = _inl_11_result_y;
                            const _wt2 = _inl_11_result_z;
                            const _wt3 = _inl_11_result_w;
                            _b_U1_out[_wbase + 0] = _wt0;
                            _b_U1_out[_wbase + 1] = _wt1;
                            _b_U1_out[_wbase + 2] = _wt2;
                            _b_U1_out[_wbase + 3] = _wt3;
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
                        {
                            const n_interior = 512;
                            const n_total = 516;
                            const ghost = 2;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((iy * n_total) + ix);
                                break _inl_6;
                            }
                            const c = _inl_6_result;
                            const _sroa_2_base = ((c) * 4 + 0);
                            const u0_x = _b_U0_out[_sroa_2_base + 0];
                            const u0_y = _b_U0_out[_sroa_2_base + 1];
                            const u0_z = _b_U0_out[_sroa_2_base + 2];
                            const u0_w = _b_U0_out[_sroa_2_base + 3];
                            const _sroa_3_base = ((c) * 4 + 0);
                            const u1_x = _b_U1_out[_sroa_3_base + 0];
                            const u1_y = _b_U1_out[_sroa_3_base + 1];
                            const u1_z = _b_U1_out[_sroa_3_base + 2];
                            const u1_w = _b_U1_out[_sroa_3_base + 3];
                            const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const mx = u0_y;
                            const my = u0_z;
                            const mz = u0_w;
                            const bz = u1_y;
                            let _inl_7_result;
                            _inl_7: {
                                let _inl_7__inl_0_result;
                                _inl_7__inl_0: {
                                    _inl_7__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_7__inl_0;
                                }
                                _inl_7_result = _inl_7__inl_0_result;
                                break _inl_7;
                            }
                            let _inl_8_result;
                            _inl_8: {
                                const _inl_8__inl_1_ix = (ix + 1);
                                let _inl_8__inl_1_result;
                                _inl_8__inl_1: {
                                    _inl_8__inl_1_result = ((iy * ((n_total + 1))) + _inl_8__inl_1_ix);
                                    break _inl_8__inl_1;
                                }
                                _inl_8_result = _inl_8__inl_1_result;
                                break _inl_8;
                            }
                            const bx_c = (0.5 * ((_b_Bx_face[_inl_7_result] + _b_Bx_face[_inl_8_result])));
                            let _inl_9_result;
                            _inl_9: {
                                let _inl_9__inl_2_result;
                                _inl_9__inl_2: {
                                    _inl_9__inl_2_result = ((iy * n_total) + ix);
                                    break _inl_9__inl_2;
                                }
                                _inl_9_result = _inl_9__inl_2_result;
                                break _inl_9;
                            }
                            let _inl_10_result;
                            _inl_10: {
                                const _inl_10__inl_3_iy = (iy + 1);
                                let _inl_10__inl_3_result;
                                _inl_10__inl_3: {
                                    _inl_10__inl_3_result = ((_inl_10__inl_3_iy * n_total) + ix);
                                    break _inl_10__inl_3;
                                }
                                _inl_10_result = _inl_10__inl_3_result;
                                break _inl_10;
                            }
                            const by_c = (0.5 * ((_b_By_face[_inl_9_result] + _b_By_face[_inl_10_result])));
                            const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                            const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                            const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(u1_x, E_min, 1.0e30));
                            const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                            const _inl_11_gamma = _u_U_uniforms_gamma;
                            const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_11_result_x, _inl_11_result_y, _inl_11_result_z, _inl_11_result_w;
                            _inl_11: {
                                const _inl_11_p_safe = ((p) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p));
                                const _inl_11_eth = (_inl_11_p_safe / (((_inl_11_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_11_gamma - 1.0))));
                                let _inl_11__inl_4_result;
                                _inl_11__inl_4: {
                                    _inl_11__inl_4_result = (((_inl_11_p_safe) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (_inl_11_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                                    break _inl_11__inl_4;
                                }
                                const _ir0 = E;
                                const _ir1 = bz;
                                const _ir2 = _inl_11_eth;
                                const _ir3 = _inl_11__inl_4_result;
                                _inl_11_result_x = _ir0;
                                _inl_11_result_y = _ir1;
                                _inl_11_result_z = _ir2;
                                _inl_11_result_w = _ir3;
                                break _inl_11;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_11_result_x;
                                const _wt1 = _inl_11_result_y;
                                const _wt2 = _inl_11_result_z;
                                const _wt3 = _inl_11_result_w;
                                _b_U1_out[_wbase + 0] = _wt0;
                                _b_U1_out[_wbase + 1] = _wt1;
                                _b_U1_out[_wbase + 2] = _wt2;
                                _b_U1_out[_wbase + 3] = _wt3;
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
                    {
                        const n_interior = 512;
                        const n_total = 516;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const c = _inl_6_result;
                        const _sroa_4_base = ((c) * 4 + 0);
                        const u0_x = _b_U0_out[_sroa_4_base + 0];
                        const u0_y = _b_U0_out[_sroa_4_base + 1];
                        const u0_z = _b_U0_out[_sroa_4_base + 2];
                        const u0_w = _b_U0_out[_sroa_4_base + 3];
                        const _sroa_5_base = ((c) * 4 + 0);
                        const u1_x = _b_U1_out[_sroa_5_base + 0];
                        const u1_y = _b_U1_out[_sroa_5_base + 1];
                        const u1_z = _b_U1_out[_sroa_5_base + 2];
                        const u1_w = _b_U1_out[_sroa_5_base + 3];
                        const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const mx = u0_y;
                        const my = u0_z;
                        const mz = u0_w;
                        const bz = u1_y;
                        let _inl_7_result;
                        _inl_7: {
                            let _inl_7__inl_0_result;
                            _inl_7__inl_0: {
                                _inl_7__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_7__inl_0;
                            }
                            _inl_7_result = _inl_7__inl_0_result;
                            break _inl_7;
                        }
                        let _inl_8_result;
                        _inl_8: {
                            const _inl_8__inl_1_ix = (ix + 1);
                            let _inl_8__inl_1_result;
                            _inl_8__inl_1: {
                                _inl_8__inl_1_result = ((iy * ((n_total + 1))) + _inl_8__inl_1_ix);
                                break _inl_8__inl_1;
                            }
                            _inl_8_result = _inl_8__inl_1_result;
                            break _inl_8;
                        }
                        const bx_c = (0.5 * ((_b_Bx_face[_inl_7_result] + _b_Bx_face[_inl_8_result])));
                        let _inl_9_result;
                        _inl_9: {
                            let _inl_9__inl_2_result;
                            _inl_9__inl_2: {
                                _inl_9__inl_2_result = ((iy * n_total) + ix);
                                break _inl_9__inl_2;
                            }
                            _inl_9_result = _inl_9__inl_2_result;
                            break _inl_9;
                        }
                        let _inl_10_result;
                        _inl_10: {
                            const _inl_10__inl_3_iy = (iy + 1);
                            let _inl_10__inl_3_result;
                            _inl_10__inl_3: {
                                _inl_10__inl_3_result = ((_inl_10__inl_3_iy * n_total) + ix);
                                break _inl_10__inl_3;
                            }
                            _inl_10_result = _inl_10__inl_3_result;
                            break _inl_10;
                        }
                        const by_c = (0.5 * ((_b_By_face[_inl_9_result] + _b_By_face[_inl_10_result])));
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(u1_x, E_min, 1.0e30));
                        const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                        const _inl_11_gamma = _u_U_uniforms_gamma;
                        const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_11_result_x, _inl_11_result_y, _inl_11_result_z, _inl_11_result_w;
                        _inl_11: {
                            const _inl_11_p_safe = ((p) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p));
                            const _inl_11_eth = (_inl_11_p_safe / (((_inl_11_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_11_gamma - 1.0))));
                            let _inl_11__inl_4_result;
                            _inl_11__inl_4: {
                                _inl_11__inl_4_result = (((_inl_11_p_safe) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (_inl_11_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                                break _inl_11__inl_4;
                            }
                            const _ir0 = E;
                            const _ir1 = bz;
                            const _ir2 = _inl_11_eth;
                            const _ir3 = _inl_11__inl_4_result;
                            _inl_11_result_x = _ir0;
                            _inl_11_result_y = _ir1;
                            _inl_11_result_z = _ir2;
                            _inl_11_result_w = _ir3;
                            break _inl_11;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_11_result_x;
                            const _wt1 = _inl_11_result_y;
                            const _wt2 = _inl_11_result_z;
                            const _wt3 = _inl_11_result_w;
                            _b_U1_out[_wbase + 0] = _wt0;
                            _b_U1_out[_wbase + 1] = _wt1;
                            _b_U1_out[_wbase + 2] = _wt2;
                            _b_U1_out[_wbase + 3] = _wt3;
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
                {
                    const n_interior = 512;
                    const n_total = 516;
                    const ghost = 2;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((iy * n_total) + ix);
                        break _inl_6;
                    }
                    const c = _inl_6_result;
                    const _sroa_6_base = ((c) * 4 + 0);
                    const u0_x = _b_U0_out[_sroa_6_base + 0];
                    const u0_y = _b_U0_out[_sroa_6_base + 1];
                    const u0_z = _b_U0_out[_sroa_6_base + 2];
                    const u0_w = _b_U0_out[_sroa_6_base + 3];
                    const _sroa_7_base = ((c) * 4 + 0);
                    const u1_x = _b_U1_out[_sroa_7_base + 0];
                    const u1_y = _b_U1_out[_sroa_7_base + 1];
                    const u1_z = _b_U1_out[_sroa_7_base + 2];
                    const u1_w = _b_U1_out[_sroa_7_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const mx = u0_y;
                    const my = u0_z;
                    const mz = u0_w;
                    const bz = u1_y;
                    let _inl_7_result;
                    _inl_7: {
                        let _inl_7__inl_0_result;
                        _inl_7__inl_0: {
                            _inl_7__inl_0_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_7__inl_0;
                        }
                        _inl_7_result = _inl_7__inl_0_result;
                        break _inl_7;
                    }
                    let _inl_8_result;
                    _inl_8: {
                        const _inl_8__inl_1_ix = (ix + 1);
                        let _inl_8__inl_1_result;
                        _inl_8__inl_1: {
                            _inl_8__inl_1_result = ((iy * ((n_total + 1))) + _inl_8__inl_1_ix);
                            break _inl_8__inl_1;
                        }
                        _inl_8_result = _inl_8__inl_1_result;
                        break _inl_8;
                    }
                    const bx_c = (0.5 * ((_b_Bx_face[_inl_7_result] + _b_Bx_face[_inl_8_result])));
                    let _inl_9_result;
                    _inl_9: {
                        let _inl_9__inl_2_result;
                        _inl_9__inl_2: {
                            _inl_9__inl_2_result = ((iy * n_total) + ix);
                            break _inl_9__inl_2;
                        }
                        _inl_9_result = _inl_9__inl_2_result;
                        break _inl_9;
                    }
                    let _inl_10_result;
                    _inl_10: {
                        const _inl_10__inl_3_iy = (iy + 1);
                        let _inl_10__inl_3_result;
                        _inl_10__inl_3: {
                            _inl_10__inl_3_result = ((_inl_10__inl_3_iy * n_total) + ix);
                            break _inl_10__inl_3;
                        }
                        _inl_10_result = _inl_10__inl_3_result;
                        break _inl_10;
                    }
                    const by_c = (0.5 * ((_b_By_face[_inl_9_result] + _b_By_face[_inl_10_result])));
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(u1_x, E_min, 1.0e30));
                    const p = (((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * (((E - ke) - mb)))));
                    const _inl_11_gamma = _u_U_uniforms_gamma;
                    const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_11_result_x, _inl_11_result_y, _inl_11_result_z, _inl_11_result_w;
                    _inl_11: {
                        const _inl_11_p_safe = ((p) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p));
                        const _inl_11_eth = (_inl_11_p_safe / (((_inl_11_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_11_gamma - 1.0))));
                        let _inl_11__inl_4_result;
                        _inl_11__inl_4: {
                            _inl_11__inl_4_result = (((_inl_11_p_safe) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (_inl_11_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                            break _inl_11__inl_4;
                        }
                        const _ir0 = E;
                        const _ir1 = bz;
                        const _ir2 = _inl_11_eth;
                        const _ir3 = _inl_11__inl_4_result;
                        _inl_11_result_x = _ir0;
                        _inl_11_result_y = _ir1;
                        _inl_11_result_z = _ir2;
                        _inl_11_result_w = _ir3;
                        break _inl_11;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_11_result_x;
                        const _wt1 = _inl_11_result_y;
                        const _wt2 = _inl_11_result_z;
                        const _wt3 = _inl_11_result_w;
                        _b_U1_out[_wbase + 0] = _wt0;
                        _b_U1_out[_wbase + 1] = _wt1;
                        _b_U1_out[_wbase + 2] = _wt2;
                        _b_U1_out[_wbase + 3] = _wt3;
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

    return { entry, bind, bindings: ["U_uniforms","U0_out","U1_out","Bx_face","By_face"], entryInfo };
}
