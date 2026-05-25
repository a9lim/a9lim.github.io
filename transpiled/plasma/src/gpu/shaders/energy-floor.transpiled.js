// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/energy-floor.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: dafdeeb049c5596da8f85043a9d8052bebbca83994820e73e211d55956bff10e
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.666Z
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
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0_out = bindings.U0_out;
        const _b_U1_out = bindings.U1_out;
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
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const c = _inl_4_result;
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
                    let _inl_5_result;
                    _inl_5: {
                        let _inl_5__inl_0_result;
                        _inl_5__inl_0: {
                            _inl_5__inl_0_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_5__inl_0;
                        }
                        _inl_5_result = _inl_5__inl_0_result;
                        break _inl_5;
                    }
                    let _inl_6_result;
                    _inl_6: {
                        const _inl_6__inl_1_ix = (ix + 1);
                        let _inl_6__inl_1_result;
                        _inl_6__inl_1: {
                            _inl_6__inl_1_result = ((iy * ((n_total + 1))) + _inl_6__inl_1_ix);
                            break _inl_6__inl_1;
                        }
                        _inl_6_result = _inl_6__inl_1_result;
                        break _inl_6;
                    }
                    const bx_c = (0.5 * ((_b_Bx_face[_inl_5_result] + _b_Bx_face[_inl_6_result])));
                    let _inl_7_result;
                    _inl_7: {
                        let _inl_7__inl_2_result;
                        _inl_7__inl_2: {
                            _inl_7__inl_2_result = ((iy * n_total) + ix);
                            break _inl_7__inl_2;
                        }
                        _inl_7_result = _inl_7__inl_2_result;
                        break _inl_7;
                    }
                    let _inl_8_result;
                    _inl_8: {
                        const _inl_8__inl_3_iy = (iy + 1);
                        let _inl_8__inl_3_result;
                        _inl_8__inl_3: {
                            _inl_8__inl_3_result = ((_inl_8__inl_3_iy * n_total) + ix);
                            break _inl_8__inl_3;
                        }
                        _inl_8_result = _inl_8__inl_3_result;
                        break _inl_8;
                    }
                    const by_c = (0.5 * ((_b_By_face[_inl_7_result] + _b_By_face[_inl_8_result])));
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E = rt.clampScalar(u1_x, E_min, 1.0e30);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = E;
                        const _wt1 = bz;
                        const _wt2 = 0.0;
                        const _wt3 = 0.0;
                        _b_U1_out[_wbase + 0] = _wt0;
                        _b_U1_out[_wbase + 1] = _wt1;
                        _b_U1_out[_wbase + 2] = _wt2;
                        _b_U1_out[_wbase + 3] = _wt3;
                    }
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
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const c = _inl_4_result;
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
                    let _inl_5_result;
                    _inl_5: {
                        let _inl_5__inl_0_result;
                        _inl_5__inl_0: {
                            _inl_5__inl_0_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_5__inl_0;
                        }
                        _inl_5_result = _inl_5__inl_0_result;
                        break _inl_5;
                    }
                    let _inl_6_result;
                    _inl_6: {
                        const _inl_6__inl_1_ix = (ix + 1);
                        let _inl_6__inl_1_result;
                        _inl_6__inl_1: {
                            _inl_6__inl_1_result = ((iy * ((n_total + 1))) + _inl_6__inl_1_ix);
                            break _inl_6__inl_1;
                        }
                        _inl_6_result = _inl_6__inl_1_result;
                        break _inl_6;
                    }
                    const bx_c = (0.5 * ((_b_Bx_face[_inl_5_result] + _b_Bx_face[_inl_6_result])));
                    let _inl_7_result;
                    _inl_7: {
                        let _inl_7__inl_2_result;
                        _inl_7__inl_2: {
                            _inl_7__inl_2_result = ((iy * n_total) + ix);
                            break _inl_7__inl_2;
                        }
                        _inl_7_result = _inl_7__inl_2_result;
                        break _inl_7;
                    }
                    let _inl_8_result;
                    _inl_8: {
                        const _inl_8__inl_3_iy = (iy + 1);
                        let _inl_8__inl_3_result;
                        _inl_8__inl_3: {
                            _inl_8__inl_3_result = ((_inl_8__inl_3_iy * n_total) + ix);
                            break _inl_8__inl_3;
                        }
                        _inl_8_result = _inl_8__inl_3_result;
                        break _inl_8;
                    }
                    const by_c = (0.5 * ((_b_By_face[_inl_7_result] + _b_By_face[_inl_8_result])));
                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz * bz))));
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = ((ke + mb) + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E = rt.clampScalar(u1_x, E_min, 1.0e30);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = E;
                        const _wt1 = bz;
                        const _wt2 = 0.0;
                        const _wt3 = 0.0;
                        _b_U1_out[_wbase + 0] = _wt0;
                        _b_U1_out[_wbase + 1] = _wt1;
                        _b_U1_out[_wbase + 2] = _wt2;
                        _b_U1_out[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","U0_out","U1_out","Bx_face","By_face"] };
}
