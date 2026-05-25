// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-resistivity.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 0b50876f7d65a6a7454f3293cbfa19f5c972e07204a4e0c849a8e8f2c2033366
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.660Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

    const entry = Object.create(null);

    entry["snapshot"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_eta = _b_U_uniforms.eta;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_U1_out = bindings.U1_out;
        const _b_Bx_snap = bindings.Bx_snap;
        const _b_By_snap = bindings.By_snap;
        const _b_U1_snap = bindings.U1_snap;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const eta = _u_U_uniforms_eta;
                    if ((eta == 0.0)) {
                        break __invocation;
                    }
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((ix < n_total) && (iy < n_total))) {
                        let _inl_4_result;
                        _inl_4: {
                            _inl_4_result = ((iy * n_total) + ix);
                            break _inl_4;
                        }
                        const c = _inl_4_result;
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_out[((c) * 4 + 0) + 0];
                            const _wt1 = _b_U1_out[((c) * 4 + 0) + 1];
                            const _wt2 = _b_U1_out[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_out[((c) * 4 + 0) + 3];
                            _b_U1_snap[_wbase + 0] = _wt0;
                            _b_U1_snap[_wbase + 1] = _wt1;
                            _b_U1_snap[_wbase + 2] = _wt2;
                            _b_U1_snap[_wbase + 3] = _wt3;
                        }
                    }
                    if (((ix <= n_total) && (iy < n_total))) {
                        let _inl_5_result;
                        _inl_5: {
                            _inl_5_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_5;
                        }
                        const cx = _inl_5_result;
                        _b_Bx_snap[cx] = _b_Bx_face[cx];
                    }
                    if (((ix < n_total) && (iy <= n_total))) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const cy = _inl_6_result;
                        _b_By_snap[cy] = _b_By_face[cy];
                    }
                }
            }
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const eta = _u_U_uniforms_eta;
                    if ((eta == 0.0)) {
                        break __invocation;
                    }
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((ix < n_total) && (iy < n_total))) {
                        let _inl_4_result;
                        _inl_4: {
                            _inl_4_result = ((iy * n_total) + ix);
                            break _inl_4;
                        }
                        const c = _inl_4_result;
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_out[((c) * 4 + 0) + 0];
                            const _wt1 = _b_U1_out[((c) * 4 + 0) + 1];
                            const _wt2 = _b_U1_out[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_out[((c) * 4 + 0) + 3];
                            _b_U1_snap[_wbase + 0] = _wt0;
                            _b_U1_snap[_wbase + 1] = _wt1;
                            _b_U1_snap[_wbase + 2] = _wt2;
                            _b_U1_snap[_wbase + 3] = _wt3;
                        }
                    }
                    if (((ix <= n_total) && (iy < n_total))) {
                        let _inl_5_result;
                        _inl_5: {
                            _inl_5_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_5;
                        }
                        const cx = _inl_5_result;
                        _b_Bx_snap[cx] = _b_Bx_face[cx];
                    }
                    if (((ix < n_total) && (iy <= n_total))) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const cy = _inl_6_result;
                        _b_By_snap[cy] = _b_By_face[cy];
                    }
                }
            }
        }
    };

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_eta = _b_U_uniforms.eta;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_stage_params = bindings.stage_params;
        const _u_stage_params_dt_w = _b_stage_params.dt_w;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_U1_out = bindings.U1_out;
        const _b_dt_buf = bindings.dt_buf;
        const _b_Bx_snap = bindings.Bx_snap;
        const _b_By_snap = bindings.By_snap;
        const _b_U1_snap = bindings.U1_snap;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const eta = _u_U_uniforms_eta;
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = (((_u_stage_params_dt_w * dt) * eta) / ((dx * dx)));
                    if ((eta == 0.0)) {
                        break __invocation;
                    }
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + ix);
                            break _inl_7;
                        }
                        const c = _inl_7_result;
                        const _inl_8_ix = (ix - 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((iy * n_total) + _inl_8_ix);
                            break _inl_8;
                        }
                        const xl = _inl_8_result;
                        const _inl_9_ix = (ix + 1);
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((iy * n_total) + _inl_9_ix);
                            break _inl_9;
                        }
                        const xr = _inl_9_result;
                        const _inl_10_iy = (iy - 1);
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((_inl_10_iy * n_total) + ix);
                            break _inl_10;
                        }
                        const yd = _inl_10_result;
                        const _inl_11_iy = (iy + 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((_inl_11_iy * n_total) + ix);
                            break _inl_11;
                        }
                        const yu = _inl_11_result;
                        const bz_c = _b_U1_snap[((c) * 4 + 0) + 1];
                        const lap = ((((_b_U1_snap[((xr) * 4 + 0) + 1] + _b_U1_snap[((xl) * 4 + 0) + 1]) + _b_U1_snap[((yu) * 4 + 0) + 1]) + _b_U1_snap[((yd) * 4 + 0) + 1]) - (4.0 * bz_c));
                        const _sroa_0_base = ((c) * 4 + 0);
                        let u1_x = _b_U1_out[_sroa_0_base + 0];
                        let u1_y = _b_U1_out[_sroa_0_base + 1];
                        let u1_z = _b_U1_out[_sroa_0_base + 2];
                        let u1_w = _b_U1_out[_sroa_0_base + 3];
                        u1_y = (bz_c + (coef * lap));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1_out[_wbase + 0] = _wt0;
                            _b_U1_out[_wbase + 1] = _wt1;
                            _b_U1_out[_wbase + 2] = _wt2;
                            _b_U1_out[_wbase + 3] = _wt3;
                        }
                    }
                    if (((((ix > ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_12;
                        }
                        const c = _inl_12_result;
                        const _inl_13_ix = (ix - 1);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * ((n_total + 1))) + _inl_13_ix);
                            break _inl_13;
                        }
                        const xl = _inl_13_result;
                        const _inl_14_ix = (ix + 1);
                        let _inl_14_result;
                        _inl_14: {
                            _inl_14_result = ((iy * ((n_total + 1))) + _inl_14_ix);
                            break _inl_14;
                        }
                        const xr = _inl_14_result;
                        const _inl_15_iy = (iy - 1);
                        let _inl_15_result;
                        _inl_15: {
                            _inl_15_result = ((_inl_15_iy * ((n_total + 1))) + ix);
                            break _inl_15;
                        }
                        const yd = _inl_15_result;
                        const _inl_16_iy = (iy + 1);
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                            break _inl_16;
                        }
                        const yu = _inl_16_result;
                        const v = _b_Bx_snap[c];
                        const lap = ((((_b_Bx_snap[xr] + _b_Bx_snap[xl]) + _b_Bx_snap[yu]) + _b_Bx_snap[yd]) - (4.0 * v));
                        _b_Bx_face[c] = (v + (coef * lap));
                    }
                    if (((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy > ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_17_result;
                        _inl_17: {
                            _inl_17_result = ((iy * n_total) + ix);
                            break _inl_17;
                        }
                        const c = _inl_17_result;
                        const _inl_18_ix = (ix - 1);
                        let _inl_18_result;
                        _inl_18: {
                            _inl_18_result = ((iy * n_total) + _inl_18_ix);
                            break _inl_18;
                        }
                        const xl = _inl_18_result;
                        const _inl_19_ix = (ix + 1);
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = ((iy * n_total) + _inl_19_ix);
                            break _inl_19;
                        }
                        const xr = _inl_19_result;
                        const _inl_20_iy = (iy - 1);
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = ((_inl_20_iy * n_total) + ix);
                            break _inl_20;
                        }
                        const yd = _inl_20_result;
                        const _inl_21_iy = (iy + 1);
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = ((_inl_21_iy * n_total) + ix);
                            break _inl_21;
                        }
                        const yu = _inl_21_result;
                        const v = _b_By_snap[c];
                        const lap = ((((_b_By_snap[xr] + _b_By_snap[xl]) + _b_By_snap[yu]) + _b_By_snap[yd]) - (4.0 * v));
                        _b_By_face[c] = (v + (coef * lap));
                    }
                }
            }
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const eta = _u_U_uniforms_eta;
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = (((_u_stage_params_dt_w * dt) * eta) / ((dx * dx)));
                    if ((eta == 0.0)) {
                        break __invocation;
                    }
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + ix);
                            break _inl_7;
                        }
                        const c = _inl_7_result;
                        const _inl_8_ix = (ix - 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((iy * n_total) + _inl_8_ix);
                            break _inl_8;
                        }
                        const xl = _inl_8_result;
                        const _inl_9_ix = (ix + 1);
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((iy * n_total) + _inl_9_ix);
                            break _inl_9;
                        }
                        const xr = _inl_9_result;
                        const _inl_10_iy = (iy - 1);
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((_inl_10_iy * n_total) + ix);
                            break _inl_10;
                        }
                        const yd = _inl_10_result;
                        const _inl_11_iy = (iy + 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((_inl_11_iy * n_total) + ix);
                            break _inl_11;
                        }
                        const yu = _inl_11_result;
                        const bz_c = _b_U1_snap[((c) * 4 + 0) + 1];
                        const lap = ((((_b_U1_snap[((xr) * 4 + 0) + 1] + _b_U1_snap[((xl) * 4 + 0) + 1]) + _b_U1_snap[((yu) * 4 + 0) + 1]) + _b_U1_snap[((yd) * 4 + 0) + 1]) - (4.0 * bz_c));
                        const _sroa_1_base = ((c) * 4 + 0);
                        let u1_x = _b_U1_out[_sroa_1_base + 0];
                        let u1_y = _b_U1_out[_sroa_1_base + 1];
                        let u1_z = _b_U1_out[_sroa_1_base + 2];
                        let u1_w = _b_U1_out[_sroa_1_base + 3];
                        u1_y = (bz_c + (coef * lap));
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1_out[_wbase + 0] = _wt0;
                            _b_U1_out[_wbase + 1] = _wt1;
                            _b_U1_out[_wbase + 2] = _wt2;
                            _b_U1_out[_wbase + 3] = _wt3;
                        }
                    }
                    if (((((ix > ghost) && (ix < (ghost + n_interior))) && (iy >= ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_12;
                        }
                        const c = _inl_12_result;
                        const _inl_13_ix = (ix - 1);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * ((n_total + 1))) + _inl_13_ix);
                            break _inl_13;
                        }
                        const xl = _inl_13_result;
                        const _inl_14_ix = (ix + 1);
                        let _inl_14_result;
                        _inl_14: {
                            _inl_14_result = ((iy * ((n_total + 1))) + _inl_14_ix);
                            break _inl_14;
                        }
                        const xr = _inl_14_result;
                        const _inl_15_iy = (iy - 1);
                        let _inl_15_result;
                        _inl_15: {
                            _inl_15_result = ((_inl_15_iy * ((n_total + 1))) + ix);
                            break _inl_15;
                        }
                        const yd = _inl_15_result;
                        const _inl_16_iy = (iy + 1);
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                            break _inl_16;
                        }
                        const yu = _inl_16_result;
                        const v = _b_Bx_snap[c];
                        const lap = ((((_b_Bx_snap[xr] + _b_Bx_snap[xl]) + _b_Bx_snap[yu]) + _b_Bx_snap[yd]) - (4.0 * v));
                        _b_Bx_face[c] = (v + (coef * lap));
                    }
                    if (((((ix >= ghost) && (ix < (ghost + n_interior))) && (iy > ghost)) && (iy < (ghost + n_interior)))) {
                        let _inl_17_result;
                        _inl_17: {
                            _inl_17_result = ((iy * n_total) + ix);
                            break _inl_17;
                        }
                        const c = _inl_17_result;
                        const _inl_18_ix = (ix - 1);
                        let _inl_18_result;
                        _inl_18: {
                            _inl_18_result = ((iy * n_total) + _inl_18_ix);
                            break _inl_18;
                        }
                        const xl = _inl_18_result;
                        const _inl_19_ix = (ix + 1);
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = ((iy * n_total) + _inl_19_ix);
                            break _inl_19;
                        }
                        const xr = _inl_19_result;
                        const _inl_20_iy = (iy - 1);
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = ((_inl_20_iy * n_total) + ix);
                            break _inl_20;
                        }
                        const yd = _inl_20_result;
                        const _inl_21_iy = (iy + 1);
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = ((_inl_21_iy * n_total) + ix);
                            break _inl_21;
                        }
                        const yu = _inl_21_result;
                        const v = _b_By_snap[c];
                        const lap = ((((_b_By_snap[xr] + _b_By_snap[xl]) + _b_By_snap[yu]) + _b_By_snap[yd]) - (4.0 * v));
                        _b_By_face[c] = (v + (coef * lap));
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","stage_params","Bx_face","By_face","U1_out","dt_buf","Bx_snap","By_snap","U1_snap"] };
}
