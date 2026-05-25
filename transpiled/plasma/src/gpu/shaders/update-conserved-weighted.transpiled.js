// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/update-conserved-weighted.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: d8e1b77da0f262f67468e78ec8cae7a2e59ea5078d90e5502a05e3eea0a2fb5b
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.681Z
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
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_stage_params = bindings.stage_params;
        const _u_stage_params_a0 = _b_stage_params.a0;
        const _u_stage_params_a1 = _b_stage_params.a1;
        const _u_stage_params_dt_w = _b_stage_params.dt_w;
        const _b_U0_n = bindings.U0_n;
        const _b_U1_n = bindings.U1_n;
        const _b_U0_other = bindings.U0_other;
        const _b_U1_other = bindings.U1_other;
        const _b_flux_x_0 = bindings.flux_x_0;
        const _b_flux_x_1 = bindings.flux_x_1;
        const _b_flux_y_0 = bindings.flux_y_0;
        const _b_flux_y_1 = bindings.flux_y_1;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_U0_out = bindings.U0_out;
        const _b_U1_out = bindings.U1_out;
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
                    const idx_c = _inl_4_result;
                    const _inl_5_ix = (ix + 1);
                    let _inl_5_result;
                    _inl_5: {
                        _inl_5_result = ((iy * n_total) + _inl_5_ix);
                        break _inl_5;
                    }
                    const idx_xhi = _inl_5_result;
                    const _inl_6_iy = (iy + 1);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((_inl_6_iy * n_total) + ix);
                        break _inl_6;
                    }
                    const idx_yhi = _inl_6_result;
                    const dt = _u_dt_buf_dt;
                    const dx = _u_U_uniforms_dx;
                    const scale = ((_u_stage_params_dt_w * dt) / dx);
                    const dFx_0_x = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 0] - _b_flux_x_0[((idx_c) * 4 + 0) + 0]);
                    const dFx_0_y = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 1] - _b_flux_x_0[((idx_c) * 4 + 0) + 1]);
                    const dFx_0_z = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 2] - _b_flux_x_0[((idx_c) * 4 + 0) + 2]);
                    const dFx_0_w = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 3] - _b_flux_x_0[((idx_c) * 4 + 0) + 3]);
                    const dFy_0_x = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 0] - _b_flux_y_0[((idx_c) * 4 + 0) + 0]);
                    const dFy_0_y = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 1] - _b_flux_y_0[((idx_c) * 4 + 0) + 1]);
                    const dFy_0_z = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 2] - _b_flux_y_0[((idx_c) * 4 + 0) + 2]);
                    const dFy_0_w = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 3] - _b_flux_y_0[((idx_c) * 4 + 0) + 3]);
                    const dFx_1_x = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 0] - _b_flux_x_1[((idx_c) * 4 + 0) + 0]);
                    const dFx_1_y = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 1] - _b_flux_x_1[((idx_c) * 4 + 0) + 1]);
                    const dFx_1_z = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 2] - _b_flux_x_1[((idx_c) * 4 + 0) + 2]);
                    const dFx_1_w = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 3] - _b_flux_x_1[((idx_c) * 4 + 0) + 3]);
                    const dFy_1_x = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 0] - _b_flux_y_1[((idx_c) * 4 + 0) + 0]);
                    const dFy_1_y = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 1] - _b_flux_y_1[((idx_c) * 4 + 0) + 1]);
                    const dFy_1_z = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 2] - _b_flux_y_1[((idx_c) * 4 + 0) + 2]);
                    const dFy_1_w = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 3] - _b_flux_y_1[((idx_c) * 4 + 0) + 3]);
                    const mask_x = 1.0;
                    const mask_y = 1.0;
                    const mask_z = 0.0;
                    const mask_w = 0.0;
                    const L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                    const L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                    const L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                    const L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                    const L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                    const L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                    const L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                    const L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                    const u0_raw_x = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 0])) + ((_u_stage_params_dt_w * dt) * L0_x));
                    const u0_raw_y = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 1])) + ((_u_stage_params_dt_w * dt) * L0_y));
                    const u0_raw_z = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 2])) + ((_u_stage_params_dt_w * dt) * L0_z));
                    const u0_raw_w = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 3])) + ((_u_stage_params_dt_w * dt) * L0_w));
                    const u1_raw_x = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 0])) + ((_u_stage_params_dt_w * dt) * L1_x));
                    const u1_raw_y = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 1])) + ((_u_stage_params_dt_w * dt) * L1_y));
                    const u1_raw_z = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 2])) + ((_u_stage_params_dt_w * dt) * L1_z));
                    const u1_raw_w = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 3])) + ((_u_stage_params_dt_w * dt) * L1_w));
                    const mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                    const my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                    const mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                    const rho = rt.clampScalar(u0_raw_x, DENSITY_FLOOR, 1.0e30);
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E = rt.clampScalar(u1_raw_x, E_min, 1.0e30);
                    const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                    {
                        const _wbase = ((idx_c) * 4 + 0);
                        const _wt0 = rho;
                        const _wt1 = mx;
                        const _wt2 = my;
                        const _wt3 = mz;
                        _b_U0_out[_wbase + 0] = _wt0;
                        _b_U0_out[_wbase + 1] = _wt1;
                        _b_U0_out[_wbase + 2] = _wt2;
                        _b_U0_out[_wbase + 3] = _wt3;
                    }
                    {
                        const _wbase = ((idx_c) * 4 + 0);
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
                    const idx_c = _inl_4_result;
                    const _inl_5_ix = (ix + 1);
                    let _inl_5_result;
                    _inl_5: {
                        _inl_5_result = ((iy * n_total) + _inl_5_ix);
                        break _inl_5;
                    }
                    const idx_xhi = _inl_5_result;
                    const _inl_6_iy = (iy + 1);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((_inl_6_iy * n_total) + ix);
                        break _inl_6;
                    }
                    const idx_yhi = _inl_6_result;
                    const dt = _u_dt_buf_dt;
                    const dx = _u_U_uniforms_dx;
                    const scale = ((_u_stage_params_dt_w * dt) / dx);
                    const dFx_0_x = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 0] - _b_flux_x_0[((idx_c) * 4 + 0) + 0]);
                    const dFx_0_y = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 1] - _b_flux_x_0[((idx_c) * 4 + 0) + 1]);
                    const dFx_0_z = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 2] - _b_flux_x_0[((idx_c) * 4 + 0) + 2]);
                    const dFx_0_w = (_b_flux_x_0[((idx_xhi) * 4 + 0) + 3] - _b_flux_x_0[((idx_c) * 4 + 0) + 3]);
                    const dFy_0_x = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 0] - _b_flux_y_0[((idx_c) * 4 + 0) + 0]);
                    const dFy_0_y = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 1] - _b_flux_y_0[((idx_c) * 4 + 0) + 1]);
                    const dFy_0_z = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 2] - _b_flux_y_0[((idx_c) * 4 + 0) + 2]);
                    const dFy_0_w = (_b_flux_y_0[((idx_yhi) * 4 + 0) + 3] - _b_flux_y_0[((idx_c) * 4 + 0) + 3]);
                    const dFx_1_x = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 0] - _b_flux_x_1[((idx_c) * 4 + 0) + 0]);
                    const dFx_1_y = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 1] - _b_flux_x_1[((idx_c) * 4 + 0) + 1]);
                    const dFx_1_z = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 2] - _b_flux_x_1[((idx_c) * 4 + 0) + 2]);
                    const dFx_1_w = (_b_flux_x_1[((idx_xhi) * 4 + 0) + 3] - _b_flux_x_1[((idx_c) * 4 + 0) + 3]);
                    const dFy_1_x = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 0] - _b_flux_y_1[((idx_c) * 4 + 0) + 0]);
                    const dFy_1_y = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 1] - _b_flux_y_1[((idx_c) * 4 + 0) + 1]);
                    const dFy_1_z = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 2] - _b_flux_y_1[((idx_c) * 4 + 0) + 2]);
                    const dFy_1_w = (_b_flux_y_1[((idx_yhi) * 4 + 0) + 3] - _b_flux_y_1[((idx_c) * 4 + 0) + 3]);
                    const mask_x = 1.0;
                    const mask_y = 1.0;
                    const mask_z = 0.0;
                    const mask_w = 0.0;
                    const L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                    const L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                    const L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                    const L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                    const L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                    const L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                    const L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                    const L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                    const u0_raw_x = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 0])) + ((_u_stage_params_dt_w * dt) * L0_x));
                    const u0_raw_y = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 1])) + ((_u_stage_params_dt_w * dt) * L0_y));
                    const u0_raw_z = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 2])) + ((_u_stage_params_dt_w * dt) * L0_z));
                    const u0_raw_w = (((_u_stage_params_a0 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (_u_stage_params_a1 * _b_U0_other[((idx_c) * 4 + 0) + 3])) + ((_u_stage_params_dt_w * dt) * L0_w));
                    const u1_raw_x = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 0])) + ((_u_stage_params_dt_w * dt) * L1_x));
                    const u1_raw_y = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 1])) + ((_u_stage_params_dt_w * dt) * L1_y));
                    const u1_raw_z = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 2])) + ((_u_stage_params_dt_w * dt) * L1_z));
                    const u1_raw_w = (((_u_stage_params_a0 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (_u_stage_params_a1 * _b_U1_other[((idx_c) * 4 + 0) + 3])) + ((_u_stage_params_dt_w * dt) * L1_w));
                    const mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                    const my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                    const mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                    const rho = rt.clampScalar(u0_raw_x, DENSITY_FLOOR, 1.0e30);
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E = rt.clampScalar(u1_raw_x, E_min, 1.0e30);
                    const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                    {
                        const _wbase = ((idx_c) * 4 + 0);
                        const _wt0 = rho;
                        const _wt1 = mx;
                        const _wt2 = my;
                        const _wt3 = mz;
                        _b_U0_out[_wbase + 0] = _wt0;
                        _b_U0_out[_wbase + 1] = _wt1;
                        _b_U0_out[_wbase + 2] = _wt2;
                        _b_U0_out[_wbase + 3] = _wt3;
                    }
                    {
                        const _wbase = ((idx_c) * 4 + 0);
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

    return { entry, bindings: ["U_uniforms","stage_params","U0_n","U1_n","U0_other","U1_other","flux_x_0","flux_x_1","flux_y_0","flux_y_1","dt_buf","U0_out","U1_out"] };
}
