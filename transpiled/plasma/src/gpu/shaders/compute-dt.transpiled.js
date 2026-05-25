// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/compute-dt.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 7a8f9ebfd6deb82190091780c87d8c55be33260ed6aa69eb059f672566ab2b5a
// generated: 2026-05-25T23:32:29.810Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const DT_MIN = 1.0e-8;
    const DT_MAX = 1.0e-2;

    function cons_to_prim_mhd(U0, U1, bx_c, by_c, gamma, p_floor) {
        const U0_x = U0.x;
        const U0_y = U0.y;
        const U0_z = U0.z;
        const U0_w = U0.w;
        const U1_x = U1.x;
        const U1_y = U1.y;
        const U1_z = U1.z;
        const U1_w = U1.w;
        let P_rho = 0;
        let P_vx = 0;
        let P_vy = 0;
        let P_vz = 0;
        let P_p = 0;
        let P_bx = 0;
        let P_by = 0;
        let P_bz = 0;
        P_rho = ((U0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (U0_x));
        P_vx = (U0_y / P_rho);
        P_vy = (U0_z / P_rho);
        P_vz = (U0_w / P_rho);
        P_bx = bx_c;
        P_by = by_c;
        P_bz = U1_y;
        const ke = ((0.5 * P_rho) * ((((P_vx * P_vx) + (P_vy * P_vy)) + (P_vz * P_vz))));
        const mb = (0.5 * ((((P_bx * P_bx) + (P_by * P_by)) + (P_bz * P_bz))));
        P_p = (((((gamma - 1.0)) * (((U1_x - ke) - mb)))) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * (((U1_x - ke) - mb)))));
        return { rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz };
    }

    function fast_mag_speed(P, gamma, axis, p_floor) {
        const rho = ((P.rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (P.rho));
        const p = ((P.p) < (p_floor) ? (p_floor) : (P.p));
        const cs2 = ((gamma * p) / rho);
        const b2 = (((P.bx * P.bx) + (P.by * P.by)) + (P.bz * P.bz));
        const ca2 = (b2 / rho);
        let can2 = 0;
        if ((axis == 0)) {
            can2 = ((P.bx * P.bx) / rho);
        } else {
            can2 = ((P.by * P.by) / rho);
        }
        const sum = (cs2 + ca2);
        const disc = ((((sum * sum) - ((4.0 * cs2) * can2))) < (0.0) ? (0.0) : (((sum * sum) - ((4.0 * cs2) * can2))));
        const cf2 = (0.5 * ((sum + Math.sqrt(disc))));
        return Math.sqrt(((cf2) < (0.0) ? (0.0) : (cf2)));
    }

    const entry = Object.create(null);

    entry["reset"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_wavespeed = bindings.wavespeed;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max = 0;
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                __invocation: {
                    void rt.atomicStoreU32At(_b_wavespeed, 0, 0);
                }
            }
        }
    };

    entry["reduce"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_wavespeed = bindings.wavespeed;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max = 0;
            // Optimized workgroup reduction init phase
            wg.tile_max = 0;
            // Phase 0
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                const gid_x = wgx*Lx + lx;
                const gid_y = wgy*Ly + ly;
                const lid = lz*Ly*Lx + ly*Lx + lx;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x < n_interior) && (gid_y < n_interior))) {
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_4_result;
                        _inl_4: {
                            let _inl_4__inl_0_result;
                            _inl_4__inl_0: {
                                _inl_4__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_4__inl_0;
                            }
                            _inl_4_result = _inl_4__inl_0_result;
                            break _inl_4;
                        }
                        let _inl_5_result;
                        _inl_5: {
                            const _inl_5__inl_1_ix = (ix + 1);
                            let _inl_5__inl_1_result;
                            _inl_5__inl_1: {
                                _inl_5__inl_1_result = ((iy * ((n_total + 1))) + _inl_5__inl_1_ix);
                                break _inl_5__inl_1;
                            }
                            _inl_5_result = _inl_5__inl_1_result;
                            break _inl_5;
                        }
                        const bx = (0.5 * ((_b_Bx_face[_inl_4_result] + _b_Bx_face[_inl_5_result])));
                        let _inl_6_result;
                        _inl_6: {
                            let _inl_6__inl_2_result;
                            _inl_6__inl_2: {
                                _inl_6__inl_2_result = ((iy * n_total) + ix);
                                break _inl_6__inl_2;
                            }
                            _inl_6_result = _inl_6__inl_2_result;
                            break _inl_6;
                        }
                        let _inl_7_result;
                        _inl_7: {
                            const _inl_7__inl_3_iy = (iy + 1);
                            let _inl_7__inl_3_result;
                            _inl_7__inl_3: {
                                _inl_7__inl_3_result = ((_inl_7__inl_3_iy * n_total) + ix);
                                break _inl_7__inl_3;
                            }
                            _inl_7_result = _inl_7__inl_3_result;
                            break _inl_7;
                        }
                        const by = (0.5 * ((_b_By_face[_inl_6_result] + _b_By_face[_inl_7_result])));
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((iy * n_total) + ix);
                            break _inl_8;
                        }
                        const idx = _inl_8_result;
                        const pf = _u_U_uniforms_pressure_floor;
                        const _sroa_0 = cons_to_prim_mhd(rt.vec4(_b_U0_in[((idx) * 4 + 0) + 0], _b_U0_in[((idx) * 4 + 0) + 1], _b_U0_in[((idx) * 4 + 0) + 2], _b_U0_in[((idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((idx) * 4 + 0) + 0], _b_U1_in[((idx) * 4 + 0) + 1], _b_U1_in[((idx) * 4 + 0) + 2], _b_U1_in[((idx) * 4 + 0) + 3]), bx, by, _u_U_uniforms_gamma, pf);
                        const P_rho = _sroa_0.rho;
                        const P_vx = _sroa_0.vx;
                        const P_vy = _sroa_0.vy;
                        const P_vz = _sroa_0.vz;
                        const P_p = _sroa_0.p;
                        const P_bx = _sroa_0.bx;
                        const P_by = _sroa_0.by;
                        const P_bz = _sroa_0.bz;
                        const cfx = fast_mag_speed({ rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz }, _u_U_uniforms_gamma, 0, pf);
                        const cfy = fast_mag_speed({ rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz }, _u_U_uniforms_gamma, 1, pf);
                        const sx = (Math.abs(P_vx) + cfx);
                        const sy = (Math.abs(P_vy) + cfy);
                        const s = ((sx) < (sy) ? (sy) : (sx));
                        const s_safe = (((s >= 0.0) && (s == s)) ? s : 0.0);
                        rt.atomicMaxU32At(wg, "tile_max", rt.bitcast_u32_f32(s_safe));
                    }
                }
            }
            // Phase 1
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                const gid_x = wgx*Lx + lx;
                const gid_y = wgy*Ly + ly;
                const lid = lz*Ly*Lx + ly*Lx + lx;
                __invocation: {
                    if ((lid == 0)) {
                        const m = rt.atomicLoadU32At(wg, "tile_max");
                        rt.atomicMaxU32At(_b_wavespeed, 0, m);
                    }
                }
            }
        }
    };

    entry["finalize"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_eta = _b_U_uniforms.eta;
        const _u_U_uniforms_cfl = _b_U_uniforms.cfl;
        const _b_wavespeed = bindings.wavespeed;
        const _b_dt_buf = bindings.dt_buf;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_max = 0;
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                __invocation: {
                    const s_bits = rt.atomicLoadU32At(_b_wavespeed, 0);
                    const s = ((rt.bitcast_f32_u32(s_bits)) < (1.0e-12) ? (1.0e-12) : (rt.bitcast_f32_u32(s_bits)));
                    const dx = _u_U_uniforms_dx;
                    const eta = _u_U_uniforms_eta;
                    const cfl_safe = ((_u_U_uniforms_cfl) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_cfl));
                    let dt_hyp = ((cfl_safe * dx) / s);
                    let dt_res = 0;
                    if ((eta > 0.0)) {
                        dt_res = (((0.25 * dx) * dx) / eta);
                    } else {
                        dt_res = 1.0e30;
                    }
                    let dt = ((dt_res) < (dt_hyp) ? (dt_res) : (dt_hyp));
                    dt = rt.clampScalar(dt, DT_MIN, DT_MAX);
                    _b_dt_buf[0] = dt;
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","wavespeed","dt_buf"] };
}
