// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/update-b-weighted.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 30724e7e552f83538ef989553582c4c41d415e594dc34fd36931ccabb935ea26
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.680Z
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
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_stage_params = bindings.stage_params;
        const _u_stage_params_a0 = _b_stage_params.a0;
        const _u_stage_params_a1 = _b_stage_params.a1;
        const _u_stage_params_dt_w = _b_stage_params.dt_w;
        const _b_Bx_n = bindings.Bx_n;
        const _b_By_n = bindings.By_n;
        const _b_Bx_other = bindings.Bx_other;
        const _b_By_other = bindings.By_other;
        const _b_Ez_edge = bindings.Ez_edge;
        const _b_dt_buf = bindings.dt_buf;
        const _b_Bx_out = bindings.Bx_out;
        const _b_By_out = bindings.By_out;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = ((_u_stage_params_dt_w * dt) / dx);
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_4_result;
                        _inl_4: {
                            _inl_4_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_4;
                        }
                        const dst = _inl_4_result;
                        const _inl_5_iy = (biy + 1);
                        let _inl_5_result;
                        _inl_5: {
                            _inl_5_result = ((_inl_5_iy * ((n_total + 1))) + bix);
                            break _inl_5;
                        }
                        const ez_top = _b_Ez_edge[_inl_5_result];
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_6;
                        }
                        const ez_bot = _b_Ez_edge[_inl_6_result];
                        _b_Bx_out[dst] = (((_u_stage_params_a0 * _b_Bx_n[dst]) + (_u_stage_params_a1 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                    }
                    if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((biy * n_total) + bix);
                            break _inl_7;
                        }
                        const dst = _inl_7_result;
                        const _inl_8_ix = (bix + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((biy * ((n_total + 1))) + _inl_8_ix);
                            break _inl_8;
                        }
                        const ez_rgt = _b_Ez_edge[_inl_8_result];
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_9;
                        }
                        const ez_lft = _b_Ez_edge[_inl_9_result];
                        _b_By_out[dst] = (((_u_stage_params_a0 * _b_By_n[dst]) + (_u_stage_params_a1 * _b_By_other[dst])) + (coef * ((ez_rgt - ez_lft))));
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
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = ((_u_stage_params_dt_w * dt) / dx);
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_4_result;
                        _inl_4: {
                            _inl_4_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_4;
                        }
                        const dst = _inl_4_result;
                        const _inl_5_iy = (biy + 1);
                        let _inl_5_result;
                        _inl_5: {
                            _inl_5_result = ((_inl_5_iy * ((n_total + 1))) + bix);
                            break _inl_5;
                        }
                        const ez_top = _b_Ez_edge[_inl_5_result];
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_6;
                        }
                        const ez_bot = _b_Ez_edge[_inl_6_result];
                        _b_Bx_out[dst] = (((_u_stage_params_a0 * _b_Bx_n[dst]) + (_u_stage_params_a1 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                    }
                    if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((biy * n_total) + bix);
                            break _inl_7;
                        }
                        const dst = _inl_7_result;
                        const _inl_8_ix = (bix + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((biy * ((n_total + 1))) + _inl_8_ix);
                            break _inl_8;
                        }
                        const ez_rgt = _b_Ez_edge[_inl_8_result];
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_9;
                        }
                        const ez_lft = _b_Ez_edge[_inl_9_result];
                        _b_By_out[dst] = (((_u_stage_params_a0 * _b_By_n[dst]) + (_u_stage_params_a1 * _b_By_other[dst])) + (coef * ((ez_rgt - ez_lft))));
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","stage_params","Bx_n","By_n","Bx_other","By_other","Ez_edge","dt_buf","Bx_out","By_out"] };
}
