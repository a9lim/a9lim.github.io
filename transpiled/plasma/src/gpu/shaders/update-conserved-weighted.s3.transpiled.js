// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/update-conserved-weighted.wgsl
// wgsl-variant: s3
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: caaafe848c71af331930dba1f3d57fc64de6bb7eea06511a0b69064832e05766
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"stage_params":{"a0":0.3333333333333333,"a1":0.6666666666666666,"dt_w":0.6666666666666666}}}
// wgsl-metrics: {"bytes":77357,"lines":1029,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":20,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.720Z
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
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_geometry_mode = _b_U_uniforms.geometry_mode;
        const _u_U_uniforms_geometry_r_min = _b_U_uniforms.geometry_r_min;
        const _b_stage_params = bindings.stage_params;
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
                    {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx_c = _inl_6_result;
                        const _inl_7_ix = (ix + 1);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + _inl_7_ix);
                            break _inl_7;
                        }
                        const idx_xhi = _inl_7_result;
                        const _inl_8_iy = (iy + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((_inl_8_iy * n_total) + ix);
                            break _inl_8;
                        }
                        const idx_yhi = _inl_8_result;
                        const dt = _u_dt_buf_dt;
                        const dx = _u_U_uniforms_dx;
                        const scale = ((0.6666666666666666 * dt) / dx);
                        const _inl_9_flags = _u_U_uniforms_physics_flags;
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = (((_inl_9_flags & FLAG_GEOMETRY)) != 0);
                            break _inl_9;
                        }
                        const geom_cyl = (_inl_9_result && (_u_U_uniforms_geometry_mode == 1));
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
                        let L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                        let L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                        let L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                        let L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                        let L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                        let L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                        let L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                        let L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                        if (geom_cyl) {
                            const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                            const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                            const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                            const div_r_0_x = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                            const div_r_0_y = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                            const div_r_0_z = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                            const div_r_0_w = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                            const div_r_1_x = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                            const div_r_1_y = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                            const div_r_1_z = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                            const div_r_1_w = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                            {
                                const _wt0 = (-(div_r_0_x + (dFy_0_x / dx)));
                                const _wt1 = (-(div_r_0_y + (dFy_0_y / dx)));
                                const _wt2 = (-(div_r_0_z + (dFy_0_z / dx)));
                                const _wt3 = (-(div_r_0_w + (dFy_0_w / dx)));
                                L0_x = _wt0;
                                L0_y = _wt1;
                                L0_z = _wt2;
                                L0_w = _wt3;
                            }
                            {
                                const _wt0 = ((-mask_x) * (div_r_1_x + (dFy_1_x / dx)));
                                const _wt1 = ((-mask_y) * (div_r_1_y + (dFy_1_y / dx)));
                                const _wt2 = ((-mask_z) * (div_r_1_z + (dFy_1_z / dx)));
                                const _wt3 = ((-mask_w) * (div_r_1_w + (dFy_1_w / dx)));
                                L1_x = _wt0;
                                L1_y = _wt1;
                                L1_z = _wt2;
                                L1_w = _wt3;
                            }
                        }
                        const u0_blend_x = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 0]));
                        const u0_blend_y = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 1]));
                        const u0_blend_z = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 2]));
                        const u0_blend_w = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 3]));
                        const u1_blend_x = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 0]));
                        const u1_blend_y = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 1]));
                        const u1_blend_z = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 2]));
                        const u1_blend_w = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 3]));
                        let u0_raw_x = (u0_blend_x + ((0.6666666666666666 * dt) * L0_x));
                        let u0_raw_y = (u0_blend_y + ((0.6666666666666666 * dt) * L0_y));
                        let u0_raw_z = (u0_blend_z + ((0.6666666666666666 * dt) * L0_z));
                        let u0_raw_w = (u0_blend_w + ((0.6666666666666666 * dt) * L0_w));
                        let u1_raw_x = (u1_blend_x + ((0.6666666666666666 * dt) * L1_x));
                        let u1_raw_y = (u1_blend_y + ((0.6666666666666666 * dt) * L1_y));
                        let u1_raw_z = (u1_blend_z + ((0.6666666666666666 * dt) * L1_z));
                        let u1_raw_w = (u1_blend_w + ((0.6666666666666666 * dt) * L1_w));
                        const _inl_10_flags = _u_U_uniforms_physics_flags;
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = (((_inl_10_flags & FLAG_POSITIVITY)) != 0);
                            break _inl_10;
                        }
                        if (_inl_10_result) {
                            let theta = 1.0;
                            if (((!((u0_raw_x == u0_raw_x))) || (!((u1_raw_x == u1_raw_x))))) {
                                theta = 0.0;
                            } else {
                                const rho_floor = DENSITY_FLOOR;
                                if (((u0_raw_x < rho_floor) && (u0_blend_x > rho_floor))) {
                                    const denom = (((u0_blend_x - u0_raw_x)) < (1.0e-30) ? (1.0e-30) : ((u0_blend_x - u0_raw_x)));
                                    theta = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) < (theta) ? ((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) : (theta));
                                }
                                let u0_theta_x = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                let u0_theta_y = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                let u0_theta_z = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                let u0_theta_w = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                let u1_theta_x = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                let u1_theta_y = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                let u1_theta_z = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                let u1_theta_w = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                const eint_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                                const rho_b = ((u0_blend_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_blend_x));
                                const ke_b = ((0.5 * ((((u0_blend_y * u0_blend_y) + (u0_blend_z * u0_blend_z)) + (u0_blend_w * u0_blend_w)))) / rho_b);
                                const eint_b = (u1_blend_x - ke_b);
                                const rho_t = ((u0_theta_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_theta_x));
                                const ke_t = ((0.5 * ((((u0_theta_y * u0_theta_y) + (u0_theta_z * u0_theta_z)) + (u0_theta_w * u0_theta_w)))) / rho_t);
                                const eint_t = (u1_theta_x - ke_t);
                                if (((eint_t < eint_floor) && (eint_b > eint_floor))) {
                                    const denom_e = (((eint_b - eint_t)) < (1.0e-30) ? (1.0e-30) : ((eint_b - eint_t)));
                                    const theta_e = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((eint_b - eint_floor)) / denom_e), 0.0, 1.0));
                                    theta = ((theta_e) < (theta) ? (theta_e) : (theta));
                                }
                            }
                            {
                                const _wt0 = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                const _wt1 = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                const _wt2 = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                const _wt3 = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                u0_raw_x = _wt0;
                                u0_raw_y = _wt1;
                                u0_raw_z = _wt2;
                                u0_raw_w = _wt3;
                            }
                            {
                                const _wt0 = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                const _wt1 = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                const _wt2 = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                const _wt3 = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                u1_raw_x = _wt0;
                                u1_raw_y = _wt1;
                                u1_raw_z = _wt2;
                                u1_raw_w = _wt3;
                            }
                        }
                        let mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                        let my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                        let mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                        const rho_in = ((u0_raw_x == u0_raw_x) ? u0_raw_x : DENSITY_FLOOR);
                        const rho = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(rho_in, DENSITY_FLOOR, 1.0e30));
                        const density_floored = (!((u0_raw_x > DENSITY_FLOOR)));
                        const V_MAX_SANE = 10.0;
                        const v_inv_rho = (1.0 / rho);
                        const vx_raw = (mx * v_inv_rho);
                        const vy_raw = (my * v_inv_rho);
                        const vz_raw = (mz * v_inv_rho);
                        const v_mag = Math.sqrt((((vx_raw * vx_raw) + (vy_raw * vy_raw)) + (vz_raw * vz_raw)));
                        if ((density_floored && (v_mag > V_MAX_SANE))) {
                            const scale = (V_MAX_SANE / v_mag);
                            mx = (mx * scale);
                            my = (my * scale);
                            mz = (mz * scale);
                        }
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E_in = ((u1_raw_x == u1_raw_x) ? u1_raw_x : E_min);
                        const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(E_in, E_min, 1.0e30));
                        const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                        const eth_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                        const eth_in = ((u1_raw_z == u1_raw_z) ? u1_raw_z : eth_floor);
                        const eth_aux = ((eth_in) < (eth_floor) ? (eth_floor) : (eth_in));
                        const p_aux = (((((_u_U_uniforms_gamma - 1.0)) * eth_aux)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * eth_aux)));
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
                        const _inl_11_gamma = _u_U_uniforms_gamma;
                        const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = (((p_aux) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p_aux)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                            break _inl_11;
                        }
                        {
                            const _wbase = ((idx_c) * 4 + 0);
                            const _wt0 = E;
                            const _wt1 = bz;
                            const _wt2 = eth_aux;
                            const _wt3 = _inl_11_result;
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
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((iy * n_total) + ix);
                                break _inl_6;
                            }
                            const idx_c = _inl_6_result;
                            const _inl_7_ix = (ix + 1);
                            let _inl_7_result;
                            _inl_7: {
                                _inl_7_result = ((iy * n_total) + _inl_7_ix);
                                break _inl_7;
                            }
                            const idx_xhi = _inl_7_result;
                            const _inl_8_iy = (iy + 1);
                            let _inl_8_result;
                            _inl_8: {
                                _inl_8_result = ((_inl_8_iy * n_total) + ix);
                                break _inl_8;
                            }
                            const idx_yhi = _inl_8_result;
                            const dt = _u_dt_buf_dt;
                            const dx = _u_U_uniforms_dx;
                            const scale = ((0.6666666666666666 * dt) / dx);
                            const _inl_9_flags = _u_U_uniforms_physics_flags;
                            let _inl_9_result;
                            _inl_9: {
                                _inl_9_result = (((_inl_9_flags & FLAG_GEOMETRY)) != 0);
                                break _inl_9;
                            }
                            const geom_cyl = (_inl_9_result && (_u_U_uniforms_geometry_mode == 1));
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
                            let L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                            let L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                            let L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                            let L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                            let L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                            let L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                            let L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                            let L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                            if (geom_cyl) {
                                const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                                const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                                const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                                const div_r_0_x = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                                const div_r_0_y = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                                const div_r_0_z = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                                const div_r_0_w = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                                const div_r_1_x = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                                const div_r_1_y = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                                const div_r_1_z = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                                const div_r_1_w = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                                {
                                    const _wt0 = (-(div_r_0_x + (dFy_0_x / dx)));
                                    const _wt1 = (-(div_r_0_y + (dFy_0_y / dx)));
                                    const _wt2 = (-(div_r_0_z + (dFy_0_z / dx)));
                                    const _wt3 = (-(div_r_0_w + (dFy_0_w / dx)));
                                    L0_x = _wt0;
                                    L0_y = _wt1;
                                    L0_z = _wt2;
                                    L0_w = _wt3;
                                }
                                {
                                    const _wt0 = ((-mask_x) * (div_r_1_x + (dFy_1_x / dx)));
                                    const _wt1 = ((-mask_y) * (div_r_1_y + (dFy_1_y / dx)));
                                    const _wt2 = ((-mask_z) * (div_r_1_z + (dFy_1_z / dx)));
                                    const _wt3 = ((-mask_w) * (div_r_1_w + (dFy_1_w / dx)));
                                    L1_x = _wt0;
                                    L1_y = _wt1;
                                    L1_z = _wt2;
                                    L1_w = _wt3;
                                }
                            }
                            const u0_blend_x = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 0]));
                            const u0_blend_y = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 1]));
                            const u0_blend_z = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 2]));
                            const u0_blend_w = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 3]));
                            const u1_blend_x = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 0]));
                            const u1_blend_y = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 1]));
                            const u1_blend_z = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 2]));
                            const u1_blend_w = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 3]));
                            let u0_raw_x = (u0_blend_x + ((0.6666666666666666 * dt) * L0_x));
                            let u0_raw_y = (u0_blend_y + ((0.6666666666666666 * dt) * L0_y));
                            let u0_raw_z = (u0_blend_z + ((0.6666666666666666 * dt) * L0_z));
                            let u0_raw_w = (u0_blend_w + ((0.6666666666666666 * dt) * L0_w));
                            let u1_raw_x = (u1_blend_x + ((0.6666666666666666 * dt) * L1_x));
                            let u1_raw_y = (u1_blend_y + ((0.6666666666666666 * dt) * L1_y));
                            let u1_raw_z = (u1_blend_z + ((0.6666666666666666 * dt) * L1_z));
                            let u1_raw_w = (u1_blend_w + ((0.6666666666666666 * dt) * L1_w));
                            const _inl_10_flags = _u_U_uniforms_physics_flags;
                            let _inl_10_result;
                            _inl_10: {
                                _inl_10_result = (((_inl_10_flags & FLAG_POSITIVITY)) != 0);
                                break _inl_10;
                            }
                            if (_inl_10_result) {
                                let theta = 1.0;
                                if (((!((u0_raw_x == u0_raw_x))) || (!((u1_raw_x == u1_raw_x))))) {
                                    theta = 0.0;
                                } else {
                                    const rho_floor = DENSITY_FLOOR;
                                    if (((u0_raw_x < rho_floor) && (u0_blend_x > rho_floor))) {
                                        const denom = (((u0_blend_x - u0_raw_x)) < (1.0e-30) ? (1.0e-30) : ((u0_blend_x - u0_raw_x)));
                                        theta = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) < (theta) ? ((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) : (theta));
                                    }
                                    let u0_theta_x = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                    let u0_theta_y = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                    let u0_theta_z = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                    let u0_theta_w = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                    let u1_theta_x = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                    let u1_theta_y = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                    let u1_theta_z = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                    let u1_theta_w = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                    const eint_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                                    const rho_b = ((u0_blend_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_blend_x));
                                    const ke_b = ((0.5 * ((((u0_blend_y * u0_blend_y) + (u0_blend_z * u0_blend_z)) + (u0_blend_w * u0_blend_w)))) / rho_b);
                                    const eint_b = (u1_blend_x - ke_b);
                                    const rho_t = ((u0_theta_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_theta_x));
                                    const ke_t = ((0.5 * ((((u0_theta_y * u0_theta_y) + (u0_theta_z * u0_theta_z)) + (u0_theta_w * u0_theta_w)))) / rho_t);
                                    const eint_t = (u1_theta_x - ke_t);
                                    if (((eint_t < eint_floor) && (eint_b > eint_floor))) {
                                        const denom_e = (((eint_b - eint_t)) < (1.0e-30) ? (1.0e-30) : ((eint_b - eint_t)));
                                        const theta_e = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((eint_b - eint_floor)) / denom_e), 0.0, 1.0));
                                        theta = ((theta_e) < (theta) ? (theta_e) : (theta));
                                    }
                                }
                                {
                                    const _wt0 = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                    const _wt1 = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                    const _wt2 = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                    const _wt3 = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                    u0_raw_x = _wt0;
                                    u0_raw_y = _wt1;
                                    u0_raw_z = _wt2;
                                    u0_raw_w = _wt3;
                                }
                                {
                                    const _wt0 = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                    const _wt1 = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                    const _wt2 = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                    const _wt3 = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                    u1_raw_x = _wt0;
                                    u1_raw_y = _wt1;
                                    u1_raw_z = _wt2;
                                    u1_raw_w = _wt3;
                                }
                            }
                            let mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                            let my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                            let mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                            const rho_in = ((u0_raw_x == u0_raw_x) ? u0_raw_x : DENSITY_FLOOR);
                            const rho = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(rho_in, DENSITY_FLOOR, 1.0e30));
                            const density_floored = (!((u0_raw_x > DENSITY_FLOOR)));
                            const V_MAX_SANE = 10.0;
                            const v_inv_rho = (1.0 / rho);
                            const vx_raw = (mx * v_inv_rho);
                            const vy_raw = (my * v_inv_rho);
                            const vz_raw = (mz * v_inv_rho);
                            const v_mag = Math.sqrt((((vx_raw * vx_raw) + (vy_raw * vy_raw)) + (vz_raw * vz_raw)));
                            if ((density_floored && (v_mag > V_MAX_SANE))) {
                                const scale = (V_MAX_SANE / v_mag);
                                mx = (mx * scale);
                                my = (my * scale);
                                mz = (mz * scale);
                            }
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                            const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                            const E_in = ((u1_raw_x == u1_raw_x) ? u1_raw_x : E_min);
                            const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(E_in, E_min, 1.0e30));
                            const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                            const eth_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                            const eth_in = ((u1_raw_z == u1_raw_z) ? u1_raw_z : eth_floor);
                            const eth_aux = ((eth_in) < (eth_floor) ? (eth_floor) : (eth_in));
                            const p_aux = (((((_u_U_uniforms_gamma - 1.0)) * eth_aux)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * eth_aux)));
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
                            const _inl_11_gamma = _u_U_uniforms_gamma;
                            const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = (((p_aux) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p_aux)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                                break _inl_11;
                            }
                            {
                                const _wbase = ((idx_c) * 4 + 0);
                                const _wt0 = E;
                                const _wt1 = bz;
                                const _wt2 = eth_aux;
                                const _wt3 = _inl_11_result;
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
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx_c = _inl_6_result;
                        const _inl_7_ix = (ix + 1);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + _inl_7_ix);
                            break _inl_7;
                        }
                        const idx_xhi = _inl_7_result;
                        const _inl_8_iy = (iy + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((_inl_8_iy * n_total) + ix);
                            break _inl_8;
                        }
                        const idx_yhi = _inl_8_result;
                        const dt = _u_dt_buf_dt;
                        const dx = _u_U_uniforms_dx;
                        const scale = ((0.6666666666666666 * dt) / dx);
                        const _inl_9_flags = _u_U_uniforms_physics_flags;
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = (((_inl_9_flags & FLAG_GEOMETRY)) != 0);
                            break _inl_9;
                        }
                        const geom_cyl = (_inl_9_result && (_u_U_uniforms_geometry_mode == 1));
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
                        let L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                        let L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                        let L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                        let L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                        let L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                        let L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                        let L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                        let L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                        if (geom_cyl) {
                            const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                            const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                            const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                            const div_r_0_x = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                            const div_r_0_y = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                            const div_r_0_z = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                            const div_r_0_w = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                            const div_r_1_x = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                            const div_r_1_y = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                            const div_r_1_z = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                            const div_r_1_w = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                            {
                                const _wt0 = (-(div_r_0_x + (dFy_0_x / dx)));
                                const _wt1 = (-(div_r_0_y + (dFy_0_y / dx)));
                                const _wt2 = (-(div_r_0_z + (dFy_0_z / dx)));
                                const _wt3 = (-(div_r_0_w + (dFy_0_w / dx)));
                                L0_x = _wt0;
                                L0_y = _wt1;
                                L0_z = _wt2;
                                L0_w = _wt3;
                            }
                            {
                                const _wt0 = ((-mask_x) * (div_r_1_x + (dFy_1_x / dx)));
                                const _wt1 = ((-mask_y) * (div_r_1_y + (dFy_1_y / dx)));
                                const _wt2 = ((-mask_z) * (div_r_1_z + (dFy_1_z / dx)));
                                const _wt3 = ((-mask_w) * (div_r_1_w + (dFy_1_w / dx)));
                                L1_x = _wt0;
                                L1_y = _wt1;
                                L1_z = _wt2;
                                L1_w = _wt3;
                            }
                        }
                        const u0_blend_x = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 0]));
                        const u0_blend_y = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 1]));
                        const u0_blend_z = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 2]));
                        const u0_blend_w = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 3]));
                        const u1_blend_x = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 0]));
                        const u1_blend_y = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 1]));
                        const u1_blend_z = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 2]));
                        const u1_blend_w = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 3]));
                        let u0_raw_x = (u0_blend_x + ((0.6666666666666666 * dt) * L0_x));
                        let u0_raw_y = (u0_blend_y + ((0.6666666666666666 * dt) * L0_y));
                        let u0_raw_z = (u0_blend_z + ((0.6666666666666666 * dt) * L0_z));
                        let u0_raw_w = (u0_blend_w + ((0.6666666666666666 * dt) * L0_w));
                        let u1_raw_x = (u1_blend_x + ((0.6666666666666666 * dt) * L1_x));
                        let u1_raw_y = (u1_blend_y + ((0.6666666666666666 * dt) * L1_y));
                        let u1_raw_z = (u1_blend_z + ((0.6666666666666666 * dt) * L1_z));
                        let u1_raw_w = (u1_blend_w + ((0.6666666666666666 * dt) * L1_w));
                        const _inl_10_flags = _u_U_uniforms_physics_flags;
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = (((_inl_10_flags & FLAG_POSITIVITY)) != 0);
                            break _inl_10;
                        }
                        if (_inl_10_result) {
                            let theta = 1.0;
                            if (((!((u0_raw_x == u0_raw_x))) || (!((u1_raw_x == u1_raw_x))))) {
                                theta = 0.0;
                            } else {
                                const rho_floor = DENSITY_FLOOR;
                                if (((u0_raw_x < rho_floor) && (u0_blend_x > rho_floor))) {
                                    const denom = (((u0_blend_x - u0_raw_x)) < (1.0e-30) ? (1.0e-30) : ((u0_blend_x - u0_raw_x)));
                                    theta = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) < (theta) ? ((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) : (theta));
                                }
                                let u0_theta_x = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                let u0_theta_y = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                let u0_theta_z = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                let u0_theta_w = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                let u1_theta_x = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                let u1_theta_y = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                let u1_theta_z = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                let u1_theta_w = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                const eint_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                                const rho_b = ((u0_blend_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_blend_x));
                                const ke_b = ((0.5 * ((((u0_blend_y * u0_blend_y) + (u0_blend_z * u0_blend_z)) + (u0_blend_w * u0_blend_w)))) / rho_b);
                                const eint_b = (u1_blend_x - ke_b);
                                const rho_t = ((u0_theta_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_theta_x));
                                const ke_t = ((0.5 * ((((u0_theta_y * u0_theta_y) + (u0_theta_z * u0_theta_z)) + (u0_theta_w * u0_theta_w)))) / rho_t);
                                const eint_t = (u1_theta_x - ke_t);
                                if (((eint_t < eint_floor) && (eint_b > eint_floor))) {
                                    const denom_e = (((eint_b - eint_t)) < (1.0e-30) ? (1.0e-30) : ((eint_b - eint_t)));
                                    const theta_e = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((eint_b - eint_floor)) / denom_e), 0.0, 1.0));
                                    theta = ((theta_e) < (theta) ? (theta_e) : (theta));
                                }
                            }
                            {
                                const _wt0 = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                                const _wt1 = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                                const _wt2 = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                                const _wt3 = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                                u0_raw_x = _wt0;
                                u0_raw_y = _wt1;
                                u0_raw_z = _wt2;
                                u0_raw_w = _wt3;
                            }
                            {
                                const _wt0 = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                                const _wt1 = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                                const _wt2 = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                                const _wt3 = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                                u1_raw_x = _wt0;
                                u1_raw_y = _wt1;
                                u1_raw_z = _wt2;
                                u1_raw_w = _wt3;
                            }
                        }
                        let mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                        let my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                        let mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                        const rho_in = ((u0_raw_x == u0_raw_x) ? u0_raw_x : DENSITY_FLOOR);
                        const rho = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(rho_in, DENSITY_FLOOR, 1.0e30));
                        const density_floored = (!((u0_raw_x > DENSITY_FLOOR)));
                        const V_MAX_SANE = 10.0;
                        const v_inv_rho = (1.0 / rho);
                        const vx_raw = (mx * v_inv_rho);
                        const vy_raw = (my * v_inv_rho);
                        const vz_raw = (mz * v_inv_rho);
                        const v_mag = Math.sqrt((((vx_raw * vx_raw) + (vy_raw * vy_raw)) + (vz_raw * vz_raw)));
                        if ((density_floored && (v_mag > V_MAX_SANE))) {
                            const scale = (V_MAX_SANE / v_mag);
                            mx = (mx * scale);
                            my = (my * scale);
                            mz = (mz * scale);
                        }
                        const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                        const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                        const E_in = ((u1_raw_x == u1_raw_x) ? u1_raw_x : E_min);
                        const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(E_in, E_min, 1.0e30));
                        const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                        const eth_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                        const eth_in = ((u1_raw_z == u1_raw_z) ? u1_raw_z : eth_floor);
                        const eth_aux = ((eth_in) < (eth_floor) ? (eth_floor) : (eth_in));
                        const p_aux = (((((_u_U_uniforms_gamma - 1.0)) * eth_aux)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * eth_aux)));
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
                        const _inl_11_gamma = _u_U_uniforms_gamma;
                        const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = (((p_aux) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p_aux)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                            break _inl_11;
                        }
                        {
                            const _wbase = ((idx_c) * 4 + 0);
                            const _wt0 = E;
                            const _wt1 = bz;
                            const _wt2 = eth_aux;
                            const _wt3 = _inl_11_result;
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
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((iy * n_total) + ix);
                        break _inl_6;
                    }
                    const idx_c = _inl_6_result;
                    const _inl_7_ix = (ix + 1);
                    let _inl_7_result;
                    _inl_7: {
                        _inl_7_result = ((iy * n_total) + _inl_7_ix);
                        break _inl_7;
                    }
                    const idx_xhi = _inl_7_result;
                    const _inl_8_iy = (iy + 1);
                    let _inl_8_result;
                    _inl_8: {
                        _inl_8_result = ((_inl_8_iy * n_total) + ix);
                        break _inl_8;
                    }
                    const idx_yhi = _inl_8_result;
                    const dt = _u_dt_buf_dt;
                    const dx = _u_U_uniforms_dx;
                    const scale = ((0.6666666666666666 * dt) / dx);
                    const _inl_9_flags = _u_U_uniforms_physics_flags;
                    let _inl_9_result;
                    _inl_9: {
                        _inl_9_result = (((_inl_9_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_9;
                    }
                    const geom_cyl = (_inl_9_result && (_u_U_uniforms_geometry_mode == 1));
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
                    let L0_x = ((-(dFx_0_x + dFy_0_x)) / dx);
                    let L0_y = ((-(dFx_0_y + dFy_0_y)) / dx);
                    let L0_z = ((-(dFx_0_z + dFy_0_z)) / dx);
                    let L0_w = ((-(dFx_0_w + dFy_0_w)) / dx);
                    let L1_x = (((-mask_x) * (dFx_1_x + dFy_1_x)) / dx);
                    let L1_y = (((-mask_y) * (dFx_1_y + dFy_1_y)) / dx);
                    let L1_z = (((-mask_z) * (dFx_1_z + dFy_1_z)) / dx);
                    let L1_w = (((-mask_w) * (dFx_1_w + dFy_1_w)) / dx);
                    if (geom_cyl) {
                        const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                        const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                        const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                        const div_r_0_x = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                        const div_r_0_y = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                        const div_r_0_z = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                        const div_r_0_w = (((r_r * _b_flux_x_0[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_0[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                        const div_r_1_x = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 0]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 0])) / ((r_c * dx)));
                        const div_r_1_y = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 1]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 1])) / ((r_c * dx)));
                        const div_r_1_z = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 2]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 2])) / ((r_c * dx)));
                        const div_r_1_w = (((r_r * _b_flux_x_1[((idx_xhi) * 4 + 0) + 3]) - (r_l * _b_flux_x_1[((idx_c) * 4 + 0) + 3])) / ((r_c * dx)));
                        {
                            const _wt0 = (-(div_r_0_x + (dFy_0_x / dx)));
                            const _wt1 = (-(div_r_0_y + (dFy_0_y / dx)));
                            const _wt2 = (-(div_r_0_z + (dFy_0_z / dx)));
                            const _wt3 = (-(div_r_0_w + (dFy_0_w / dx)));
                            L0_x = _wt0;
                            L0_y = _wt1;
                            L0_z = _wt2;
                            L0_w = _wt3;
                        }
                        {
                            const _wt0 = ((-mask_x) * (div_r_1_x + (dFy_1_x / dx)));
                            const _wt1 = ((-mask_y) * (div_r_1_y + (dFy_1_y / dx)));
                            const _wt2 = ((-mask_z) * (div_r_1_z + (dFy_1_z / dx)));
                            const _wt3 = ((-mask_w) * (div_r_1_w + (dFy_1_w / dx)));
                            L1_x = _wt0;
                            L1_y = _wt1;
                            L1_z = _wt2;
                            L1_w = _wt3;
                        }
                    }
                    const u0_blend_x = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 0]));
                    const u0_blend_y = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 1]));
                    const u0_blend_z = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 2]));
                    const u0_blend_w = ((0.3333333333333333 * _b_U0_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U0_other[((idx_c) * 4 + 0) + 3]));
                    const u1_blend_x = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 0]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 0]));
                    const u1_blend_y = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 1]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 1]));
                    const u1_blend_z = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 2]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 2]));
                    const u1_blend_w = ((0.3333333333333333 * _b_U1_n[((idx_c) * 4 + 0) + 3]) + (0.6666666666666666 * _b_U1_other[((idx_c) * 4 + 0) + 3]));
                    let u0_raw_x = (u0_blend_x + ((0.6666666666666666 * dt) * L0_x));
                    let u0_raw_y = (u0_blend_y + ((0.6666666666666666 * dt) * L0_y));
                    let u0_raw_z = (u0_blend_z + ((0.6666666666666666 * dt) * L0_z));
                    let u0_raw_w = (u0_blend_w + ((0.6666666666666666 * dt) * L0_w));
                    let u1_raw_x = (u1_blend_x + ((0.6666666666666666 * dt) * L1_x));
                    let u1_raw_y = (u1_blend_y + ((0.6666666666666666 * dt) * L1_y));
                    let u1_raw_z = (u1_blend_z + ((0.6666666666666666 * dt) * L1_z));
                    let u1_raw_w = (u1_blend_w + ((0.6666666666666666 * dt) * L1_w));
                    const _inl_10_flags = _u_U_uniforms_physics_flags;
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = (((_inl_10_flags & FLAG_POSITIVITY)) != 0);
                        break _inl_10;
                    }
                    if (_inl_10_result) {
                        let theta = 1.0;
                        if (((!((u0_raw_x == u0_raw_x))) || (!((u1_raw_x == u1_raw_x))))) {
                            theta = 0.0;
                        } else {
                            const rho_floor = DENSITY_FLOOR;
                            if (((u0_raw_x < rho_floor) && (u0_blend_x > rho_floor))) {
                                const denom = (((u0_blend_x - u0_raw_x)) < (1.0e-30) ? (1.0e-30) : ((u0_blend_x - u0_raw_x)));
                                theta = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) < (theta) ? ((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((u0_blend_x - rho_floor)) / denom), 0.0, 1.0))) : (theta));
                            }
                            let u0_theta_x = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                            let u0_theta_y = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                            let u0_theta_z = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                            let u0_theta_w = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                            let u1_theta_x = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                            let u1_theta_y = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                            let u1_theta_z = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                            let u1_theta_w = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                            const eint_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                            const rho_b = ((u0_blend_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_blend_x));
                            const ke_b = ((0.5 * ((((u0_blend_y * u0_blend_y) + (u0_blend_z * u0_blend_z)) + (u0_blend_w * u0_blend_w)))) / rho_b);
                            const eint_b = (u1_blend_x - ke_b);
                            const rho_t = ((u0_theta_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_theta_x));
                            const ke_t = ((0.5 * ((((u0_theta_y * u0_theta_y) + (u0_theta_z * u0_theta_z)) + (u0_theta_w * u0_theta_w)))) / rho_t);
                            const eint_t = (u1_theta_x - ke_t);
                            if (((eint_t < eint_floor) && (eint_b > eint_floor))) {
                                const denom_e = (((eint_b - eint_t)) < (1.0e-30) ? (1.0e-30) : ((eint_b - eint_t)));
                                const theta_e = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((eint_b - eint_floor)) / denom_e), 0.0, 1.0));
                                theta = ((theta_e) < (theta) ? (theta_e) : (theta));
                            }
                        }
                        {
                            const _wt0 = (u0_blend_x + (theta * (u0_raw_x - u0_blend_x)));
                            const _wt1 = (u0_blend_y + (theta * (u0_raw_y - u0_blend_y)));
                            const _wt2 = (u0_blend_z + (theta * (u0_raw_z - u0_blend_z)));
                            const _wt3 = (u0_blend_w + (theta * (u0_raw_w - u0_blend_w)));
                            u0_raw_x = _wt0;
                            u0_raw_y = _wt1;
                            u0_raw_z = _wt2;
                            u0_raw_w = _wt3;
                        }
                        {
                            const _wt0 = (u1_blend_x + (theta * (u1_raw_x - u1_blend_x)));
                            const _wt1 = (u1_blend_y + (theta * (u1_raw_y - u1_blend_y)));
                            const _wt2 = (u1_blend_z + (theta * (u1_raw_z - u1_blend_z)));
                            const _wt3 = (u1_blend_w + (theta * (u1_raw_w - u1_blend_w)));
                            u1_raw_x = _wt0;
                            u1_raw_y = _wt1;
                            u1_raw_z = _wt2;
                            u1_raw_w = _wt3;
                        }
                    }
                    let mx = ((u0_raw_y == u0_raw_y) ? u0_raw_y : 0.0);
                    let my = ((u0_raw_z == u0_raw_z) ? u0_raw_z : 0.0);
                    let mz = ((u0_raw_w == u0_raw_w) ? u0_raw_w : 0.0);
                    const rho_in = ((u0_raw_x == u0_raw_x) ? u0_raw_x : DENSITY_FLOOR);
                    const rho = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(rho_in, DENSITY_FLOOR, 1.0e30));
                    const density_floored = (!((u0_raw_x > DENSITY_FLOOR)));
                    const V_MAX_SANE = 10.0;
                    const v_inv_rho = (1.0 / rho);
                    const vx_raw = (mx * v_inv_rho);
                    const vy_raw = (my * v_inv_rho);
                    const vz_raw = (mz * v_inv_rho);
                    const v_mag = Math.sqrt((((vx_raw * vx_raw) + (vy_raw * vy_raw)) + (vz_raw * vz_raw)));
                    if ((density_floored && (v_mag > V_MAX_SANE))) {
                        const scale = (V_MAX_SANE / v_mag);
                        mx = (mx * scale);
                        my = (my * scale);
                        mz = (mz * scale);
                    }
                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho);
                    const E_min = (ke + (_u_U_uniforms_pressure_floor / ((_u_U_uniforms_gamma - 1.0))));
                    const E_in = ((u1_raw_x == u1_raw_x) ? u1_raw_x : E_min);
                    const E = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(E_in, E_min, 1.0e30));
                    const bz = ((u1_raw_y == u1_raw_y) ? u1_raw_y : 0.0);
                    const eth_floor = (_u_U_uniforms_pressure_floor / (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0))));
                    const eth_in = ((u1_raw_z == u1_raw_z) ? u1_raw_z : eth_floor);
                    const eth_aux = ((eth_in) < (eth_floor) ? (eth_floor) : (eth_in));
                    const p_aux = (((((_u_U_uniforms_gamma - 1.0)) * eth_aux)) < (_u_U_uniforms_pressure_floor) ? (_u_U_uniforms_pressure_floor) : ((((_u_U_uniforms_gamma - 1.0)) * eth_aux)));
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
                    const _inl_11_gamma = _u_U_uniforms_gamma;
                    const _inl_11_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = (((p_aux) < (_inl_11_p_floor) ? (_inl_11_p_floor) : (p_aux)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), _inl_11_gamma));
                        break _inl_11;
                    }
                    {
                        const _wbase = ((idx_c) * 4 + 0);
                        const _wt0 = E;
                        const _wt1 = bz;
                        const _wt2 = eth_aux;
                        const _wt3 = _inl_11_result;
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

    return { entry, bind, bindings: ["U_uniforms","stage_params","U0_n","U1_n","U0_other","U1_other","flux_x_0","flux_x_1","flux_y_0","flux_y_1","dt_buf","U0_out","U1_out"], entryInfo };
}
