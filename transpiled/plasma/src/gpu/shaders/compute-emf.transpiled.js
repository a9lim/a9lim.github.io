// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/compute-emf.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 9eaeda26b40e54b53043e71ff1aa04d4c752674830d69d1f2eb53d20d46111a5
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.666Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

    function ez_edge_idx(ix, iy, n_total) {
        return ((iy * ((n_total + 1))) + ix);
    }

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_flux_x_1 = bindings.flux_x_1;
        const _b_flux_y_1 = bindings.flux_y_1;
        const _b_Ez_edge = bindings.Ez_edge;
        const _b_U0 = bindings.U0;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    const _inl_9_iy = (iy - 1);
                    let _inl_9_result;
                    _inl_9: {
                        _inl_9_result = ((_inl_9_iy * n_total) + ix);
                        break _inl_9;
                    }
                    const _sroa_0_base = ((_inl_9_result) * 4 + 0);
                    const fxl_x = _b_flux_x_1[_sroa_0_base + 0];
                    const fxl_y = _b_flux_x_1[_sroa_0_base + 1];
                    const fxl_z = _b_flux_x_1[_sroa_0_base + 2];
                    const fxl_w = _b_flux_x_1[_sroa_0_base + 3];
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((iy * n_total) + ix);
                        break _inl_10;
                    }
                    const _sroa_1_base = ((_inl_10_result) * 4 + 0);
                    const fxh_x = _b_flux_x_1[_sroa_1_base + 0];
                    const fxh_y = _b_flux_x_1[_sroa_1_base + 1];
                    const fxh_z = _b_flux_x_1[_sroa_1_base + 2];
                    const fxh_w = _b_flux_x_1[_sroa_1_base + 3];
                    const _inl_11_ix = (ix - 1);
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = ((iy * n_total) + _inl_11_ix);
                        break _inl_11;
                    }
                    const _sroa_2_base = ((_inl_11_result) * 4 + 0);
                    const fyl_x = _b_flux_y_1[_sroa_2_base + 0];
                    const fyl_y = _b_flux_y_1[_sroa_2_base + 1];
                    const fyl_z = _b_flux_y_1[_sroa_2_base + 2];
                    const fyl_w = _b_flux_y_1[_sroa_2_base + 3];
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * n_total) + ix);
                        break _inl_12;
                    }
                    const _sroa_3_base = ((_inl_12_result) * 4 + 0);
                    const fyr_x = _b_flux_y_1[_sroa_3_base + 0];
                    const fyr_y = _b_flux_y_1[_sroa_3_base + 1];
                    const fyr_z = _b_flux_y_1[_sroa_3_base + 2];
                    const fyr_w = _b_flux_y_1[_sroa_3_base + 3];
                    const ez_x_lo = (-fxl_z);
                    const ez_x_hi = (-fxh_z);
                    const ez_y_le = fyl_z;
                    const ez_y_ri = fyr_z;
                    const vx_lo = fxl_w;
                    const vx_hi = fxh_w;
                    const vy_le = fyl_w;
                    const vy_ri = fyr_w;
                    const _inl_13_ix = (ix - 1);
                    const _inl_13_iy = (iy - 1);
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_4_result;
                        _inl_13__inl_4: {
                            _inl_13__inl_4_result = ((_inl_13_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_4;
                        }
                        const _sroa_4_base = ((_inl_13__inl_4_result) * 4 + 0);
                        const _inl_13_u0_x = _b_U0[_sroa_4_base + 0];
                        const _inl_13_u0_y = _b_U0[_sroa_4_base + 1];
                        const _inl_13_u0_z = _b_U0[_sroa_4_base + 2];
                        const _inl_13_u0_w = _b_U0[_sroa_4_base + 3];
                        const _inl_13_rho = ((_inl_13_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_13_u0_x));
                        const _inl_13_vx = (_inl_13_u0_y / _inl_13_rho);
                        const _inl_13_vy = (_inl_13_u0_z / _inl_13_rho);
                        let _inl_13__inl_5_result;
                        _inl_13__inl_5: {
                            _inl_13__inl_5_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13_ix);
                            break _inl_13__inl_5;
                        }
                        const _inl_13__inl_6_ix = (_inl_13_ix + 1);
                        let _inl_13__inl_6_result;
                        _inl_13__inl_6: {
                            _inl_13__inl_6_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13__inl_6_ix);
                            break _inl_13__inl_6;
                        }
                        const _inl_13_bx = (0.5 * ((_b_Bx_face[_inl_13__inl_5_result] + _b_Bx_face[_inl_13__inl_6_result])));
                        let _inl_13__inl_7_result;
                        _inl_13__inl_7: {
                            _inl_13__inl_7_result = ((_inl_13_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_7;
                        }
                        const _inl_13__inl_8_iy = (_inl_13_iy + 1);
                        let _inl_13__inl_8_result;
                        _inl_13__inl_8: {
                            _inl_13__inl_8_result = ((_inl_13__inl_8_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_8;
                        }
                        const _inl_13_by = (0.5 * ((_b_By_face[_inl_13__inl_7_result] + _b_By_face[_inl_13__inl_8_result])));
                        _inl_13_result = ((_inl_13_vy * _inl_13_bx) - (_inl_13_vx * _inl_13_by));
                        break _inl_13;
                    }
                    const ez_sw = _inl_13_result;
                    const _inl_14_iy = (iy - 1);
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_4_result;
                        _inl_14__inl_4: {
                            _inl_14__inl_4_result = ((_inl_14_iy * n_total) + ix);
                            break _inl_14__inl_4;
                        }
                        const _sroa_5_base = ((_inl_14__inl_4_result) * 4 + 0);
                        const _inl_14_u0_x = _b_U0[_sroa_5_base + 0];
                        const _inl_14_u0_y = _b_U0[_sroa_5_base + 1];
                        const _inl_14_u0_z = _b_U0[_sroa_5_base + 2];
                        const _inl_14_u0_w = _b_U0[_sroa_5_base + 3];
                        const _inl_14_rho = ((_inl_14_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_14_u0_x));
                        const _inl_14_vx = (_inl_14_u0_y / _inl_14_rho);
                        const _inl_14_vy = (_inl_14_u0_z / _inl_14_rho);
                        let _inl_14__inl_5_result;
                        _inl_14__inl_5: {
                            _inl_14__inl_5_result = ((_inl_14_iy * ((n_total + 1))) + ix);
                            break _inl_14__inl_5;
                        }
                        const _inl_14__inl_6_ix = (ix + 1);
                        let _inl_14__inl_6_result;
                        _inl_14__inl_6: {
                            _inl_14__inl_6_result = ((_inl_14_iy * ((n_total + 1))) + _inl_14__inl_6_ix);
                            break _inl_14__inl_6;
                        }
                        const _inl_14_bx = (0.5 * ((_b_Bx_face[_inl_14__inl_5_result] + _b_Bx_face[_inl_14__inl_6_result])));
                        let _inl_14__inl_7_result;
                        _inl_14__inl_7: {
                            _inl_14__inl_7_result = ((_inl_14_iy * n_total) + ix);
                            break _inl_14__inl_7;
                        }
                        const _inl_14__inl_8_iy = (_inl_14_iy + 1);
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((_inl_14__inl_8_iy * n_total) + ix);
                            break _inl_14__inl_8;
                        }
                        const _inl_14_by = (0.5 * ((_b_By_face[_inl_14__inl_7_result] + _b_By_face[_inl_14__inl_8_result])));
                        _inl_14_result = ((_inl_14_vy * _inl_14_bx) - (_inl_14_vx * _inl_14_by));
                        break _inl_14;
                    }
                    const ez_se = _inl_14_result;
                    const _inl_15_ix = (ix - 1);
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_4_result;
                        _inl_15__inl_4: {
                            _inl_15__inl_4_result = ((iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_4;
                        }
                        const _sroa_6_base = ((_inl_15__inl_4_result) * 4 + 0);
                        const _inl_15_u0_x = _b_U0[_sroa_6_base + 0];
                        const _inl_15_u0_y = _b_U0[_sroa_6_base + 1];
                        const _inl_15_u0_z = _b_U0[_sroa_6_base + 2];
                        const _inl_15_u0_w = _b_U0[_sroa_6_base + 3];
                        const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                        const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                        const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                        let _inl_15__inl_5_result;
                        _inl_15__inl_5: {
                            _inl_15__inl_5_result = ((iy * ((n_total + 1))) + _inl_15_ix);
                            break _inl_15__inl_5;
                        }
                        const _inl_15__inl_6_ix = (_inl_15_ix + 1);
                        let _inl_15__inl_6_result;
                        _inl_15__inl_6: {
                            _inl_15__inl_6_result = ((iy * ((n_total + 1))) + _inl_15__inl_6_ix);
                            break _inl_15__inl_6;
                        }
                        const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_5_result] + _b_Bx_face[_inl_15__inl_6_result])));
                        let _inl_15__inl_7_result;
                        _inl_15__inl_7: {
                            _inl_15__inl_7_result = ((iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_7;
                        }
                        const _inl_15__inl_8_iy = (iy + 1);
                        let _inl_15__inl_8_result;
                        _inl_15__inl_8: {
                            _inl_15__inl_8_result = ((_inl_15__inl_8_iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_8;
                        }
                        const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_7_result] + _b_By_face[_inl_15__inl_8_result])));
                        _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                        break _inl_15;
                    }
                    const ez_nw = _inl_15_result;
                    let _inl_16_result;
                    _inl_16: {
                        let _inl_16__inl_4_result;
                        _inl_16__inl_4: {
                            _inl_16__inl_4_result = ((iy * n_total) + ix);
                            break _inl_16__inl_4;
                        }
                        const _sroa_7_base = ((_inl_16__inl_4_result) * 4 + 0);
                        const _inl_16_u0_x = _b_U0[_sroa_7_base + 0];
                        const _inl_16_u0_y = _b_U0[_sroa_7_base + 1];
                        const _inl_16_u0_z = _b_U0[_sroa_7_base + 2];
                        const _inl_16_u0_w = _b_U0[_sroa_7_base + 3];
                        const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                        const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                        const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                        let _inl_16__inl_5_result;
                        _inl_16__inl_5: {
                            _inl_16__inl_5_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_16__inl_5;
                        }
                        const _inl_16__inl_6_ix = (ix + 1);
                        let _inl_16__inl_6_result;
                        _inl_16__inl_6: {
                            _inl_16__inl_6_result = ((iy * ((n_total + 1))) + _inl_16__inl_6_ix);
                            break _inl_16__inl_6;
                        }
                        const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_5_result] + _b_Bx_face[_inl_16__inl_6_result])));
                        let _inl_16__inl_7_result;
                        _inl_16__inl_7: {
                            _inl_16__inl_7_result = ((iy * n_total) + ix);
                            break _inl_16__inl_7;
                        }
                        const _inl_16__inl_8_iy = (iy + 1);
                        let _inl_16__inl_8_result;
                        _inl_16__inl_8: {
                            _inl_16__inl_8_result = ((_inl_16__inl_8_iy * n_total) + ix);
                            break _inl_16__inl_8;
                        }
                        const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_7_result] + _b_By_face[_inl_16__inl_8_result])));
                        _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                        break _inl_16;
                    }
                    const ez_ne = _inl_16_result;
                    const TOL = 1.0e-12;
                    const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                    const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                    const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                    const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                    const bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                    const corr_y = (0.25 * ((((ez_x_lo - up_lo)) + ((ez_x_hi - up_hi)))));
                    const corr_x = (0.25 * ((((ez_y_le - up_le)) + ((ez_y_ri - up_ri)))));
                    _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = ((bs + corr_y) + corr_x);
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
                    const extent = (n_interior + 1);
                    if (((gid_x >= extent) || (gid_y >= extent))) {
                        break __invocation;
                    }
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    const _inl_9_iy = (iy - 1);
                    let _inl_9_result;
                    _inl_9: {
                        _inl_9_result = ((_inl_9_iy * n_total) + ix);
                        break _inl_9;
                    }
                    const _sroa_8_base = ((_inl_9_result) * 4 + 0);
                    const fxl_x = _b_flux_x_1[_sroa_8_base + 0];
                    const fxl_y = _b_flux_x_1[_sroa_8_base + 1];
                    const fxl_z = _b_flux_x_1[_sroa_8_base + 2];
                    const fxl_w = _b_flux_x_1[_sroa_8_base + 3];
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((iy * n_total) + ix);
                        break _inl_10;
                    }
                    const _sroa_9_base = ((_inl_10_result) * 4 + 0);
                    const fxh_x = _b_flux_x_1[_sroa_9_base + 0];
                    const fxh_y = _b_flux_x_1[_sroa_9_base + 1];
                    const fxh_z = _b_flux_x_1[_sroa_9_base + 2];
                    const fxh_w = _b_flux_x_1[_sroa_9_base + 3];
                    const _inl_11_ix = (ix - 1);
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = ((iy * n_total) + _inl_11_ix);
                        break _inl_11;
                    }
                    const _sroa_10_base = ((_inl_11_result) * 4 + 0);
                    const fyl_x = _b_flux_y_1[_sroa_10_base + 0];
                    const fyl_y = _b_flux_y_1[_sroa_10_base + 1];
                    const fyl_z = _b_flux_y_1[_sroa_10_base + 2];
                    const fyl_w = _b_flux_y_1[_sroa_10_base + 3];
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * n_total) + ix);
                        break _inl_12;
                    }
                    const _sroa_11_base = ((_inl_12_result) * 4 + 0);
                    const fyr_x = _b_flux_y_1[_sroa_11_base + 0];
                    const fyr_y = _b_flux_y_1[_sroa_11_base + 1];
                    const fyr_z = _b_flux_y_1[_sroa_11_base + 2];
                    const fyr_w = _b_flux_y_1[_sroa_11_base + 3];
                    const ez_x_lo = (-fxl_z);
                    const ez_x_hi = (-fxh_z);
                    const ez_y_le = fyl_z;
                    const ez_y_ri = fyr_z;
                    const vx_lo = fxl_w;
                    const vx_hi = fxh_w;
                    const vy_le = fyl_w;
                    const vy_ri = fyr_w;
                    const _inl_13_ix = (ix - 1);
                    const _inl_13_iy = (iy - 1);
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_4_result;
                        _inl_13__inl_4: {
                            _inl_13__inl_4_result = ((_inl_13_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_4;
                        }
                        const _sroa_12_base = ((_inl_13__inl_4_result) * 4 + 0);
                        const _inl_13_u0_x = _b_U0[_sroa_12_base + 0];
                        const _inl_13_u0_y = _b_U0[_sroa_12_base + 1];
                        const _inl_13_u0_z = _b_U0[_sroa_12_base + 2];
                        const _inl_13_u0_w = _b_U0[_sroa_12_base + 3];
                        const _inl_13_rho = ((_inl_13_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_13_u0_x));
                        const _inl_13_vx = (_inl_13_u0_y / _inl_13_rho);
                        const _inl_13_vy = (_inl_13_u0_z / _inl_13_rho);
                        let _inl_13__inl_5_result;
                        _inl_13__inl_5: {
                            _inl_13__inl_5_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13_ix);
                            break _inl_13__inl_5;
                        }
                        const _inl_13__inl_6_ix = (_inl_13_ix + 1);
                        let _inl_13__inl_6_result;
                        _inl_13__inl_6: {
                            _inl_13__inl_6_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13__inl_6_ix);
                            break _inl_13__inl_6;
                        }
                        const _inl_13_bx = (0.5 * ((_b_Bx_face[_inl_13__inl_5_result] + _b_Bx_face[_inl_13__inl_6_result])));
                        let _inl_13__inl_7_result;
                        _inl_13__inl_7: {
                            _inl_13__inl_7_result = ((_inl_13_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_7;
                        }
                        const _inl_13__inl_8_iy = (_inl_13_iy + 1);
                        let _inl_13__inl_8_result;
                        _inl_13__inl_8: {
                            _inl_13__inl_8_result = ((_inl_13__inl_8_iy * n_total) + _inl_13_ix);
                            break _inl_13__inl_8;
                        }
                        const _inl_13_by = (0.5 * ((_b_By_face[_inl_13__inl_7_result] + _b_By_face[_inl_13__inl_8_result])));
                        _inl_13_result = ((_inl_13_vy * _inl_13_bx) - (_inl_13_vx * _inl_13_by));
                        break _inl_13;
                    }
                    const ez_sw = _inl_13_result;
                    const _inl_14_iy = (iy - 1);
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_4_result;
                        _inl_14__inl_4: {
                            _inl_14__inl_4_result = ((_inl_14_iy * n_total) + ix);
                            break _inl_14__inl_4;
                        }
                        const _sroa_13_base = ((_inl_14__inl_4_result) * 4 + 0);
                        const _inl_14_u0_x = _b_U0[_sroa_13_base + 0];
                        const _inl_14_u0_y = _b_U0[_sroa_13_base + 1];
                        const _inl_14_u0_z = _b_U0[_sroa_13_base + 2];
                        const _inl_14_u0_w = _b_U0[_sroa_13_base + 3];
                        const _inl_14_rho = ((_inl_14_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_14_u0_x));
                        const _inl_14_vx = (_inl_14_u0_y / _inl_14_rho);
                        const _inl_14_vy = (_inl_14_u0_z / _inl_14_rho);
                        let _inl_14__inl_5_result;
                        _inl_14__inl_5: {
                            _inl_14__inl_5_result = ((_inl_14_iy * ((n_total + 1))) + ix);
                            break _inl_14__inl_5;
                        }
                        const _inl_14__inl_6_ix = (ix + 1);
                        let _inl_14__inl_6_result;
                        _inl_14__inl_6: {
                            _inl_14__inl_6_result = ((_inl_14_iy * ((n_total + 1))) + _inl_14__inl_6_ix);
                            break _inl_14__inl_6;
                        }
                        const _inl_14_bx = (0.5 * ((_b_Bx_face[_inl_14__inl_5_result] + _b_Bx_face[_inl_14__inl_6_result])));
                        let _inl_14__inl_7_result;
                        _inl_14__inl_7: {
                            _inl_14__inl_7_result = ((_inl_14_iy * n_total) + ix);
                            break _inl_14__inl_7;
                        }
                        const _inl_14__inl_8_iy = (_inl_14_iy + 1);
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((_inl_14__inl_8_iy * n_total) + ix);
                            break _inl_14__inl_8;
                        }
                        const _inl_14_by = (0.5 * ((_b_By_face[_inl_14__inl_7_result] + _b_By_face[_inl_14__inl_8_result])));
                        _inl_14_result = ((_inl_14_vy * _inl_14_bx) - (_inl_14_vx * _inl_14_by));
                        break _inl_14;
                    }
                    const ez_se = _inl_14_result;
                    const _inl_15_ix = (ix - 1);
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_4_result;
                        _inl_15__inl_4: {
                            _inl_15__inl_4_result = ((iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_4;
                        }
                        const _sroa_14_base = ((_inl_15__inl_4_result) * 4 + 0);
                        const _inl_15_u0_x = _b_U0[_sroa_14_base + 0];
                        const _inl_15_u0_y = _b_U0[_sroa_14_base + 1];
                        const _inl_15_u0_z = _b_U0[_sroa_14_base + 2];
                        const _inl_15_u0_w = _b_U0[_sroa_14_base + 3];
                        const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                        const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                        const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                        let _inl_15__inl_5_result;
                        _inl_15__inl_5: {
                            _inl_15__inl_5_result = ((iy * ((n_total + 1))) + _inl_15_ix);
                            break _inl_15__inl_5;
                        }
                        const _inl_15__inl_6_ix = (_inl_15_ix + 1);
                        let _inl_15__inl_6_result;
                        _inl_15__inl_6: {
                            _inl_15__inl_6_result = ((iy * ((n_total + 1))) + _inl_15__inl_6_ix);
                            break _inl_15__inl_6;
                        }
                        const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_5_result] + _b_Bx_face[_inl_15__inl_6_result])));
                        let _inl_15__inl_7_result;
                        _inl_15__inl_7: {
                            _inl_15__inl_7_result = ((iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_7;
                        }
                        const _inl_15__inl_8_iy = (iy + 1);
                        let _inl_15__inl_8_result;
                        _inl_15__inl_8: {
                            _inl_15__inl_8_result = ((_inl_15__inl_8_iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_8;
                        }
                        const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_7_result] + _b_By_face[_inl_15__inl_8_result])));
                        _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                        break _inl_15;
                    }
                    const ez_nw = _inl_15_result;
                    let _inl_16_result;
                    _inl_16: {
                        let _inl_16__inl_4_result;
                        _inl_16__inl_4: {
                            _inl_16__inl_4_result = ((iy * n_total) + ix);
                            break _inl_16__inl_4;
                        }
                        const _sroa_15_base = ((_inl_16__inl_4_result) * 4 + 0);
                        const _inl_16_u0_x = _b_U0[_sroa_15_base + 0];
                        const _inl_16_u0_y = _b_U0[_sroa_15_base + 1];
                        const _inl_16_u0_z = _b_U0[_sroa_15_base + 2];
                        const _inl_16_u0_w = _b_U0[_sroa_15_base + 3];
                        const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                        const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                        const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                        let _inl_16__inl_5_result;
                        _inl_16__inl_5: {
                            _inl_16__inl_5_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_16__inl_5;
                        }
                        const _inl_16__inl_6_ix = (ix + 1);
                        let _inl_16__inl_6_result;
                        _inl_16__inl_6: {
                            _inl_16__inl_6_result = ((iy * ((n_total + 1))) + _inl_16__inl_6_ix);
                            break _inl_16__inl_6;
                        }
                        const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_5_result] + _b_Bx_face[_inl_16__inl_6_result])));
                        let _inl_16__inl_7_result;
                        _inl_16__inl_7: {
                            _inl_16__inl_7_result = ((iy * n_total) + ix);
                            break _inl_16__inl_7;
                        }
                        const _inl_16__inl_8_iy = (iy + 1);
                        let _inl_16__inl_8_result;
                        _inl_16__inl_8: {
                            _inl_16__inl_8_result = ((_inl_16__inl_8_iy * n_total) + ix);
                            break _inl_16__inl_8;
                        }
                        const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_7_result] + _b_By_face[_inl_16__inl_8_result])));
                        _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                        break _inl_16;
                    }
                    const ez_ne = _inl_16_result;
                    const TOL = 1.0e-12;
                    const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                    const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                    const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                    const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                    const bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                    const corr_y = (0.25 * ((((ez_x_lo - up_lo)) + ((ez_x_hi - up_hi)))));
                    const corr_x = (0.25 * ((((ez_y_le - up_le)) + ((ez_y_ri - up_ri)))));
                    _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = ((bs + corr_y) + corr_x);
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","flux_x_1","flux_y_1","Ez_edge","U0","Bx_face","By_face"] };
}
