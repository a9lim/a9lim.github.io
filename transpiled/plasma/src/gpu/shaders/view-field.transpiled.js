// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/view-field.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: c09f5af3015d24afec808eac47493a3399d6deb5473ce87b379a2d5fa09064f3
// generated: 2026-05-25T23:32:29.828Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_view_mode = _b_U_uniforms.view_mode;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_field = bindings.field;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_8_result;
                    _inl_8: {
                        _inl_8_result = ((iy * n_total) + ix);
                        break _inl_8;
                    }
                    const idx_c = _inl_8_result;
                    let _inl_9_result;
                    _inl_9: {
                        let _inl_9__inl_4_result;
                        _inl_9__inl_4: {
                            let _inl_9__inl_4__inl_0_result;
                            _inl_9__inl_4__inl_0: {
                                _inl_9__inl_4__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_9__inl_4__inl_0;
                            }
                            _inl_9__inl_4_result = _inl_9__inl_4__inl_0_result;
                            break _inl_9__inl_4;
                        }
                        let _inl_9__inl_5_result;
                        _inl_9__inl_5: {
                            const _inl_9__inl_5__inl_1_ix = (ix + 1);
                            let _inl_9__inl_5__inl_1_result;
                            _inl_9__inl_5__inl_1: {
                                _inl_9__inl_5__inl_1_result = ((iy * ((n_total + 1))) + _inl_9__inl_5__inl_1_ix);
                                break _inl_9__inl_5__inl_1;
                            }
                            _inl_9__inl_5_result = _inl_9__inl_5__inl_1_result;
                            break _inl_9__inl_5;
                        }
                        _inl_9_result = (0.5 * ((_b_Bx_face[_inl_9__inl_4_result] + _b_Bx_face[_inl_9__inl_5_result])));
                        break _inl_9;
                    }
                    const bx_c = _inl_9_result;
                    let _inl_10_result;
                    _inl_10: {
                        let _inl_10__inl_6_result;
                        _inl_10__inl_6: {
                            let _inl_10__inl_6__inl_2_result;
                            _inl_10__inl_6__inl_2: {
                                _inl_10__inl_6__inl_2_result = ((iy * n_total) + ix);
                                break _inl_10__inl_6__inl_2;
                            }
                            _inl_10__inl_6_result = _inl_10__inl_6__inl_2_result;
                            break _inl_10__inl_6;
                        }
                        let _inl_10__inl_7_result;
                        _inl_10__inl_7: {
                            const _inl_10__inl_7__inl_3_iy = (iy + 1);
                            let _inl_10__inl_7__inl_3_result;
                            _inl_10__inl_7__inl_3: {
                                _inl_10__inl_7__inl_3_result = ((_inl_10__inl_7__inl_3_iy * n_total) + ix);
                                break _inl_10__inl_7__inl_3;
                            }
                            _inl_10__inl_7_result = _inl_10__inl_7__inl_3_result;
                            break _inl_10__inl_7;
                        }
                        _inl_10_result = (0.5 * ((_b_By_face[_inl_10__inl_6_result] + _b_By_face[_inl_10__inl_7_result])));
                        break _inl_10;
                    }
                    const by_c = _inl_10_result;
                    const _sroa_0_base = ((idx_c) * 4 + 0);
                    const U0_x = _b_U0_in[_sroa_0_base + 0];
                    const U0_y = _b_U0_in[_sroa_0_base + 1];
                    const U0_z = _b_U0_in[_sroa_0_base + 2];
                    const U0_w = _b_U0_in[_sroa_0_base + 3];
                    const _sroa_1_base = ((idx_c) * 4 + 0);
                    const U1_x = _b_U1_in[_sroa_1_base + 0];
                    const U1_y = _b_U1_in[_sroa_1_base + 1];
                    const U1_z = _b_U1_in[_sroa_1_base + 2];
                    const U1_w = _b_U1_in[_sroa_1_base + 3];
                    const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
                    const mode = _u_U_uniforms_view_mode;
                    let v = 0.0;
                    if ((mode == 0)) {
                        v = U0_x;
                    } else if ((mode == 1)) {
                        const vx = (U0_y / rho);
                        const vy = (U0_z / rho);
                        const vz = (U0_w / rho);
                        const ke = ((0.5 * rho) * ((((vx * vx) + (vy * vy)) + (vz * vz))));
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y))));
                        v = (((((_u_U_uniforms_gamma - 1.0)) * (((U1_x - ke) - mb)))) < (1.0e-6) ? (1.0e-6) : ((((_u_U_uniforms_gamma - 1.0)) * (((U1_x - ke) - mb)))));
                    } else if ((mode == 2)) {
                        const vx = (U0_y / rho);
                        const vy = (U0_z / rho);
                        const vz = (U0_w / rho);
                        v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                    } else if ((mode == 3)) {
                        v = Math.sqrt((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y)));
                    } else {
                        const _inl_11_ix = (ix + 1);
                        let _inl_11_result;
                        _inl_11: {
                            let _inl_11__inl_6_result;
                            _inl_11__inl_6: {
                                let _inl_11__inl_6__inl_2_result;
                                _inl_11__inl_6__inl_2: {
                                    _inl_11__inl_6__inl_2_result = ((iy * n_total) + _inl_11_ix);
                                    break _inl_11__inl_6__inl_2;
                                }
                                _inl_11__inl_6_result = _inl_11__inl_6__inl_2_result;
                                break _inl_11__inl_6;
                            }
                            let _inl_11__inl_7_result;
                            _inl_11__inl_7: {
                                const _inl_11__inl_7__inl_3_iy = (iy + 1);
                                let _inl_11__inl_7__inl_3_result;
                                _inl_11__inl_7__inl_3: {
                                    _inl_11__inl_7__inl_3_result = ((_inl_11__inl_7__inl_3_iy * n_total) + _inl_11_ix);
                                    break _inl_11__inl_7__inl_3;
                                }
                                _inl_11__inl_7_result = _inl_11__inl_7__inl_3_result;
                                break _inl_11__inl_7;
                            }
                            _inl_11_result = (0.5 * ((_b_By_face[_inl_11__inl_6_result] + _b_By_face[_inl_11__inl_7_result])));
                            break _inl_11;
                        }
                        const by_cR = _inl_11_result;
                        const _inl_12_ix = (ix - 1);
                        let _inl_12_result;
                        _inl_12: {
                            let _inl_12__inl_6_result;
                            _inl_12__inl_6: {
                                let _inl_12__inl_6__inl_2_result;
                                _inl_12__inl_6__inl_2: {
                                    _inl_12__inl_6__inl_2_result = ((iy * n_total) + _inl_12_ix);
                                    break _inl_12__inl_6__inl_2;
                                }
                                _inl_12__inl_6_result = _inl_12__inl_6__inl_2_result;
                                break _inl_12__inl_6;
                            }
                            let _inl_12__inl_7_result;
                            _inl_12__inl_7: {
                                const _inl_12__inl_7__inl_3_iy = (iy + 1);
                                let _inl_12__inl_7__inl_3_result;
                                _inl_12__inl_7__inl_3: {
                                    _inl_12__inl_7__inl_3_result = ((_inl_12__inl_7__inl_3_iy * n_total) + _inl_12_ix);
                                    break _inl_12__inl_7__inl_3;
                                }
                                _inl_12__inl_7_result = _inl_12__inl_7__inl_3_result;
                                break _inl_12__inl_7;
                            }
                            _inl_12_result = (0.5 * ((_b_By_face[_inl_12__inl_6_result] + _b_By_face[_inl_12__inl_7_result])));
                            break _inl_12;
                        }
                        const by_cL = _inl_12_result;
                        const _inl_13_iy = (iy + 1);
                        let _inl_13_result;
                        _inl_13: {
                            let _inl_13__inl_4_result;
                            _inl_13__inl_4: {
                                let _inl_13__inl_4__inl_0_result;
                                _inl_13__inl_4__inl_0: {
                                    _inl_13__inl_4__inl_0_result = ((_inl_13_iy * ((n_total + 1))) + ix);
                                    break _inl_13__inl_4__inl_0;
                                }
                                _inl_13__inl_4_result = _inl_13__inl_4__inl_0_result;
                                break _inl_13__inl_4;
                            }
                            let _inl_13__inl_5_result;
                            _inl_13__inl_5: {
                                const _inl_13__inl_5__inl_1_ix = (ix + 1);
                                let _inl_13__inl_5__inl_1_result;
                                _inl_13__inl_5__inl_1: {
                                    _inl_13__inl_5__inl_1_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13__inl_5__inl_1_ix);
                                    break _inl_13__inl_5__inl_1;
                                }
                                _inl_13__inl_5_result = _inl_13__inl_5__inl_1_result;
                                break _inl_13__inl_5;
                            }
                            _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_4_result] + _b_Bx_face[_inl_13__inl_5_result])));
                            break _inl_13;
                        }
                        const bx_cU = _inl_13_result;
                        const _inl_14_iy = (iy - 1);
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_4_result;
                            _inl_14__inl_4: {
                                let _inl_14__inl_4__inl_0_result;
                                _inl_14__inl_4__inl_0: {
                                    _inl_14__inl_4__inl_0_result = ((_inl_14_iy * ((n_total + 1))) + ix);
                                    break _inl_14__inl_4__inl_0;
                                }
                                _inl_14__inl_4_result = _inl_14__inl_4__inl_0_result;
                                break _inl_14__inl_4;
                            }
                            let _inl_14__inl_5_result;
                            _inl_14__inl_5: {
                                const _inl_14__inl_5__inl_1_ix = (ix + 1);
                                let _inl_14__inl_5__inl_1_result;
                                _inl_14__inl_5__inl_1: {
                                    _inl_14__inl_5__inl_1_result = ((_inl_14_iy * ((n_total + 1))) + _inl_14__inl_5__inl_1_ix);
                                    break _inl_14__inl_5__inl_1;
                                }
                                _inl_14__inl_5_result = _inl_14__inl_5__inl_1_result;
                                break _inl_14__inl_5;
                            }
                            _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_4_result] + _b_Bx_face[_inl_14__inl_5_result])));
                            break _inl_14;
                        }
                        const bx_cD = _inl_14_result;
                        const dby_dx = (((by_cR - by_cL)) / ((2.0 * _u_U_uniforms_dx)));
                        const dbx_dy = (((bx_cU - bx_cD)) / ((2.0 * _u_U_uniforms_dx)));
                        v = (dby_dx - dbx_dy);
                    }
                    _b_field[idx_c] = v;
                }
            }
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_8_result;
                    _inl_8: {
                        _inl_8_result = ((iy * n_total) + ix);
                        break _inl_8;
                    }
                    const idx_c = _inl_8_result;
                    let _inl_9_result;
                    _inl_9: {
                        let _inl_9__inl_4_result;
                        _inl_9__inl_4: {
                            let _inl_9__inl_4__inl_0_result;
                            _inl_9__inl_4__inl_0: {
                                _inl_9__inl_4__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_9__inl_4__inl_0;
                            }
                            _inl_9__inl_4_result = _inl_9__inl_4__inl_0_result;
                            break _inl_9__inl_4;
                        }
                        let _inl_9__inl_5_result;
                        _inl_9__inl_5: {
                            const _inl_9__inl_5__inl_1_ix = (ix + 1);
                            let _inl_9__inl_5__inl_1_result;
                            _inl_9__inl_5__inl_1: {
                                _inl_9__inl_5__inl_1_result = ((iy * ((n_total + 1))) + _inl_9__inl_5__inl_1_ix);
                                break _inl_9__inl_5__inl_1;
                            }
                            _inl_9__inl_5_result = _inl_9__inl_5__inl_1_result;
                            break _inl_9__inl_5;
                        }
                        _inl_9_result = (0.5 * ((_b_Bx_face[_inl_9__inl_4_result] + _b_Bx_face[_inl_9__inl_5_result])));
                        break _inl_9;
                    }
                    const bx_c = _inl_9_result;
                    let _inl_10_result;
                    _inl_10: {
                        let _inl_10__inl_6_result;
                        _inl_10__inl_6: {
                            let _inl_10__inl_6__inl_2_result;
                            _inl_10__inl_6__inl_2: {
                                _inl_10__inl_6__inl_2_result = ((iy * n_total) + ix);
                                break _inl_10__inl_6__inl_2;
                            }
                            _inl_10__inl_6_result = _inl_10__inl_6__inl_2_result;
                            break _inl_10__inl_6;
                        }
                        let _inl_10__inl_7_result;
                        _inl_10__inl_7: {
                            const _inl_10__inl_7__inl_3_iy = (iy + 1);
                            let _inl_10__inl_7__inl_3_result;
                            _inl_10__inl_7__inl_3: {
                                _inl_10__inl_7__inl_3_result = ((_inl_10__inl_7__inl_3_iy * n_total) + ix);
                                break _inl_10__inl_7__inl_3;
                            }
                            _inl_10__inl_7_result = _inl_10__inl_7__inl_3_result;
                            break _inl_10__inl_7;
                        }
                        _inl_10_result = (0.5 * ((_b_By_face[_inl_10__inl_6_result] + _b_By_face[_inl_10__inl_7_result])));
                        break _inl_10;
                    }
                    const by_c = _inl_10_result;
                    const _sroa_2_base = ((idx_c) * 4 + 0);
                    const U0_x = _b_U0_in[_sroa_2_base + 0];
                    const U0_y = _b_U0_in[_sroa_2_base + 1];
                    const U0_z = _b_U0_in[_sroa_2_base + 2];
                    const U0_w = _b_U0_in[_sroa_2_base + 3];
                    const _sroa_3_base = ((idx_c) * 4 + 0);
                    const U1_x = _b_U1_in[_sroa_3_base + 0];
                    const U1_y = _b_U1_in[_sroa_3_base + 1];
                    const U1_z = _b_U1_in[_sroa_3_base + 2];
                    const U1_w = _b_U1_in[_sroa_3_base + 3];
                    const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
                    const mode = _u_U_uniforms_view_mode;
                    let v = 0.0;
                    if ((mode == 0)) {
                        v = U0_x;
                    } else if ((mode == 1)) {
                        const vx = (U0_y / rho);
                        const vy = (U0_z / rho);
                        const vz = (U0_w / rho);
                        const ke = ((0.5 * rho) * ((((vx * vx) + (vy * vy)) + (vz * vz))));
                        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y))));
                        v = (((((_u_U_uniforms_gamma - 1.0)) * (((U1_x - ke) - mb)))) < (1.0e-6) ? (1.0e-6) : ((((_u_U_uniforms_gamma - 1.0)) * (((U1_x - ke) - mb)))));
                    } else if ((mode == 2)) {
                        const vx = (U0_y / rho);
                        const vy = (U0_z / rho);
                        const vz = (U0_w / rho);
                        v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                    } else if ((mode == 3)) {
                        v = Math.sqrt((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y)));
                    } else {
                        const _inl_11_ix = (ix + 1);
                        let _inl_11_result;
                        _inl_11: {
                            let _inl_11__inl_6_result;
                            _inl_11__inl_6: {
                                let _inl_11__inl_6__inl_2_result;
                                _inl_11__inl_6__inl_2: {
                                    _inl_11__inl_6__inl_2_result = ((iy * n_total) + _inl_11_ix);
                                    break _inl_11__inl_6__inl_2;
                                }
                                _inl_11__inl_6_result = _inl_11__inl_6__inl_2_result;
                                break _inl_11__inl_6;
                            }
                            let _inl_11__inl_7_result;
                            _inl_11__inl_7: {
                                const _inl_11__inl_7__inl_3_iy = (iy + 1);
                                let _inl_11__inl_7__inl_3_result;
                                _inl_11__inl_7__inl_3: {
                                    _inl_11__inl_7__inl_3_result = ((_inl_11__inl_7__inl_3_iy * n_total) + _inl_11_ix);
                                    break _inl_11__inl_7__inl_3;
                                }
                                _inl_11__inl_7_result = _inl_11__inl_7__inl_3_result;
                                break _inl_11__inl_7;
                            }
                            _inl_11_result = (0.5 * ((_b_By_face[_inl_11__inl_6_result] + _b_By_face[_inl_11__inl_7_result])));
                            break _inl_11;
                        }
                        const by_cR = _inl_11_result;
                        const _inl_12_ix = (ix - 1);
                        let _inl_12_result;
                        _inl_12: {
                            let _inl_12__inl_6_result;
                            _inl_12__inl_6: {
                                let _inl_12__inl_6__inl_2_result;
                                _inl_12__inl_6__inl_2: {
                                    _inl_12__inl_6__inl_2_result = ((iy * n_total) + _inl_12_ix);
                                    break _inl_12__inl_6__inl_2;
                                }
                                _inl_12__inl_6_result = _inl_12__inl_6__inl_2_result;
                                break _inl_12__inl_6;
                            }
                            let _inl_12__inl_7_result;
                            _inl_12__inl_7: {
                                const _inl_12__inl_7__inl_3_iy = (iy + 1);
                                let _inl_12__inl_7__inl_3_result;
                                _inl_12__inl_7__inl_3: {
                                    _inl_12__inl_7__inl_3_result = ((_inl_12__inl_7__inl_3_iy * n_total) + _inl_12_ix);
                                    break _inl_12__inl_7__inl_3;
                                }
                                _inl_12__inl_7_result = _inl_12__inl_7__inl_3_result;
                                break _inl_12__inl_7;
                            }
                            _inl_12_result = (0.5 * ((_b_By_face[_inl_12__inl_6_result] + _b_By_face[_inl_12__inl_7_result])));
                            break _inl_12;
                        }
                        const by_cL = _inl_12_result;
                        const _inl_13_iy = (iy + 1);
                        let _inl_13_result;
                        _inl_13: {
                            let _inl_13__inl_4_result;
                            _inl_13__inl_4: {
                                let _inl_13__inl_4__inl_0_result;
                                _inl_13__inl_4__inl_0: {
                                    _inl_13__inl_4__inl_0_result = ((_inl_13_iy * ((n_total + 1))) + ix);
                                    break _inl_13__inl_4__inl_0;
                                }
                                _inl_13__inl_4_result = _inl_13__inl_4__inl_0_result;
                                break _inl_13__inl_4;
                            }
                            let _inl_13__inl_5_result;
                            _inl_13__inl_5: {
                                const _inl_13__inl_5__inl_1_ix = (ix + 1);
                                let _inl_13__inl_5__inl_1_result;
                                _inl_13__inl_5__inl_1: {
                                    _inl_13__inl_5__inl_1_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13__inl_5__inl_1_ix);
                                    break _inl_13__inl_5__inl_1;
                                }
                                _inl_13__inl_5_result = _inl_13__inl_5__inl_1_result;
                                break _inl_13__inl_5;
                            }
                            _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_4_result] + _b_Bx_face[_inl_13__inl_5_result])));
                            break _inl_13;
                        }
                        const bx_cU = _inl_13_result;
                        const _inl_14_iy = (iy - 1);
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_4_result;
                            _inl_14__inl_4: {
                                let _inl_14__inl_4__inl_0_result;
                                _inl_14__inl_4__inl_0: {
                                    _inl_14__inl_4__inl_0_result = ((_inl_14_iy * ((n_total + 1))) + ix);
                                    break _inl_14__inl_4__inl_0;
                                }
                                _inl_14__inl_4_result = _inl_14__inl_4__inl_0_result;
                                break _inl_14__inl_4;
                            }
                            let _inl_14__inl_5_result;
                            _inl_14__inl_5: {
                                const _inl_14__inl_5__inl_1_ix = (ix + 1);
                                let _inl_14__inl_5__inl_1_result;
                                _inl_14__inl_5__inl_1: {
                                    _inl_14__inl_5__inl_1_result = ((_inl_14_iy * ((n_total + 1))) + _inl_14__inl_5__inl_1_ix);
                                    break _inl_14__inl_5__inl_1;
                                }
                                _inl_14__inl_5_result = _inl_14__inl_5__inl_1_result;
                                break _inl_14__inl_5;
                            }
                            _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_4_result] + _b_Bx_face[_inl_14__inl_5_result])));
                            break _inl_14;
                        }
                        const bx_cD = _inl_14_result;
                        const dby_dx = (((by_cR - by_cL)) / ((2.0 * _u_U_uniforms_dx)));
                        const dbx_dy = (((bx_cU - bx_cD)) / ((2.0 * _u_U_uniforms_dx)));
                        v = (dby_dx - dbx_dy);
                    }
                    _b_field[idx_c] = v;
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","field"] };
}
