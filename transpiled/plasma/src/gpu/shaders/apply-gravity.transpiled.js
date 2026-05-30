// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-gravity.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: e723fd686693fe88d429490ac75d1e13bc47ebc0a8d0b8c76042c54ece9184da
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":42131,"lines":754,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.491Z
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

    function phi_at(gx_in, gy_in, n_interior, n_total, ghost) {
        const n = ((n_interior) | 0);
        let gx = gx_in;
        let gy = gy_in;
        if ((bindings.U_uniforms.gravity_boundary_mode == 1)) {
            if (((((gx < 0) || (gx >= n)) || (gy < 0)) || (gy >= n))) {
                return 0.0;
            }
        } else {
            gx = (((((gx % n)) + n)) % n);
            gy = (((((gy % n)) + n)) % n);
        }
        const ix = (ghost + ((gx) >>> 0));
        const iy = (ghost + ((gy) >>> 0));
        let _inl_6_result;
        _inl_6: {
            _inl_6_result = ((iy * n_total) + ix);
            break _inl_6;
        }
        return bindings.phi[_inl_6_result];
    }

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
        const _u_U_uniforms_gravity_gx = _b_U_uniforms.gravity_gx;
        const _u_U_uniforms_gravity_gy = _b_U_uniforms.gravity_gy;
        const _u_U_uniforms_gravity_G = _b_U_uniforms.gravity_G;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        if (Gy === 1 && Gz === 1) {
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = Oy;
                __invocation: {
                    const flags = _u_U_uniforms_physics_flags;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = (((flags & FLAG_GRAVITY_EXT)) != 0);
                        break _inl_11;
                    }
                    const do_ext = _inl_11_result;
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = (((flags & FLAG_GRAVITY_SELF)) != 0);
                        break _inl_12;
                    }
                    const do_self = (_inl_12_result && ((_u_U_uniforms_gravity_G > 0.0)));
                    if (((!do_ext) && (!do_self))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + ix);
                        break _inl_13;
                    }
                    const c = _inl_13_result;
                    const _sroa_0_base = ((c) * 4 + 0);
                    const u0_x = _b_U0[_sroa_0_base + 0];
                    const u0_y = _b_U0[_sroa_0_base + 1];
                    const u0_z = _b_U0[_sroa_0_base + 2];
                    const u0_w = _b_U0[_sroa_0_base + 3];
                    const _sroa_1_base = ((c) * 4 + 0);
                    const u1_x = _b_U1[_sroa_1_base + 0];
                    const u1_y = _b_U1[_sroa_1_base + 1];
                    const u1_z = _b_U1[_sroa_1_base + 2];
                    const u1_w = _b_U1[_sroa_1_base + 3];
                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const vx = (u0_y / rho);
                    const vy = (u0_z / rho);
                    let gx = 0.0;
                    let gy = 0.0;
                    if (do_ext) {
                        gx = (gx + _u_U_uniforms_gravity_gx);
                        gy = (gy + _u_U_uniforms_gravity_gy);
                    }
                    if (do_self) {
                        const dx = _u_U_uniforms_dx;
                        const gx0 = ((gid_x) | 0);
                        const gy0 = ((gid_y) | 0);
                        const dphi_dx = ((((((-phi_at((gx0 + 2), gy0, n_interior, n_total, ghost)) + (8.0 * phi_at((gx0 + 1), gy0, n_interior, n_total, ghost))) - (8.0 * phi_at((gx0 - 1), gy0, n_interior, n_total, ghost))) + phi_at((gx0 - 2), gy0, n_interior, n_total, ghost))) / ((12.0 * dx)));
                        const dphi_dy = ((((((-phi_at(gx0, (gy0 + 2), n_interior, n_total, ghost)) + (8.0 * phi_at(gx0, (gy0 + 1), n_interior, n_total, ghost))) - (8.0 * phi_at(gx0, (gy0 - 1), n_interior, n_total, ghost))) + phi_at(gx0, (gy0 - 2), n_interior, n_total, ghost))) / ((12.0 * dx)));
                        gx = (gx - dphi_dx);
                        gy = (gy - dphi_dy);
                    }
                    const dt = _u_dt_buf_dt;
                    const dpx = ((rho * gx) * dt);
                    const dpy = ((rho * gy) * dt);
                    const vx_mid = (vx + ((0.5 * gx) * dt));
                    const vy_mid = (vy + ((0.5 * gy) * dt));
                    const dE = ((rho * (((vx_mid * gx) + (vy_mid * gy)))) * dt);
                    const _sroa_2 = {x:u0_x, y:(u0_y + dpx), z:(u0_z + dpy), w:u0_w};
                    const u0_new_x = _sroa_2.x;
                    const u0_new_y = _sroa_2.y;
                    const u0_new_z = _sroa_2.z;
                    const u0_new_w = _sroa_2.w;
                    const E_new = (u1_x + dE);
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_7_result;
                        _inl_14__inl_7: {
                            _inl_14__inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_14__inl_7;
                        }
                        const _inl_14__inl_8_ix = (ix + 1);
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((iy * ((n_total + 1))) + _inl_14__inl_8_ix);
                            break _inl_14__inl_8;
                        }
                        _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_7_result] + _b_Bx_face[_inl_14__inl_8_result])));
                        break _inl_14;
                    }
                    const bx = _inl_14_result;
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_9_result;
                        _inl_15__inl_9: {
                            _inl_15__inl_9_result = ((iy * n_total) + ix);
                            break _inl_15__inl_9;
                        }
                        const _inl_15__inl_10_iy = (iy + 1);
                        let _inl_15__inl_10_result;
                        _inl_15__inl_10: {
                            _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + ix);
                            break _inl_15__inl_10;
                        }
                        _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                        break _inl_15;
                    }
                    const by = _inl_15_result;
                    const p_new = pressure_from_dual_energy({x:u0_new_x, y:u0_new_y, z:u0_new_z, w:u0_new_w}, {x:E_new, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_new_x;
                        const _wt1 = u0_new_y;
                        const _wt2 = u0_new_z;
                        const _wt3 = u0_new_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_16_bz = u1_y;
                    const _inl_16_rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                    const _inl_16_gamma = _u_U_uniforms_gamma;
                    const _inl_16_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_16_result_x, _inl_16_result_y, _inl_16_result_z, _inl_16_result_w;
                    _inl_16: {
                        const _inl_16_p_safe = ((p_new) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (p_new));
                        const _inl_16_eth = (_inl_16_p_safe / (((_inl_16_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_16_gamma - 1.0))));
                        let _inl_16__inl_4_result;
                        _inl_16__inl_4: {
                            _inl_16__inl_4_result = (((_inl_16_p_safe) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (_inl_16_p_safe)) / Math.pow(((_inl_16_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_rho)), _inl_16_gamma));
                            break _inl_16__inl_4;
                        }
                        const _ir0 = E_new;
                        const _ir1 = _inl_16_bz;
                        const _ir2 = _inl_16_eth;
                        const _ir3 = _inl_16__inl_4_result;
                        _inl_16_result_x = _ir0;
                        _inl_16_result_y = _ir1;
                        _inl_16_result_z = _ir2;
                        _inl_16_result_w = _ir3;
                        break _inl_16;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_16_result_x;
                        const _wt1 = _inl_16_result_y;
                        const _wt2 = _inl_16_result_z;
                        const _wt3 = _inl_16_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const flags = _u_U_uniforms_physics_flags;
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = (((flags & FLAG_GRAVITY_EXT)) != 0);
                                break _inl_11;
                            }
                            const do_ext = _inl_11_result;
                            let _inl_12_result;
                            _inl_12: {
                                _inl_12_result = (((flags & FLAG_GRAVITY_SELF)) != 0);
                                break _inl_12;
                            }
                            const do_self = (_inl_12_result && ((_u_U_uniforms_gravity_G > 0.0)));
                            if (((!do_ext) && (!do_self))) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                                break __invocation;
                            }
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_13_result;
                            _inl_13: {
                                _inl_13_result = ((iy * n_total) + ix);
                                break _inl_13;
                            }
                            const c = _inl_13_result;
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
                            const vx = (u0_y / rho);
                            const vy = (u0_z / rho);
                            let gx = 0.0;
                            let gy = 0.0;
                            if (do_ext) {
                                gx = (gx + _u_U_uniforms_gravity_gx);
                                gy = (gy + _u_U_uniforms_gravity_gy);
                            }
                            if (do_self) {
                                const dx = _u_U_uniforms_dx;
                                const gx0 = ((gid_x) | 0);
                                const gy0 = ((gid_y) | 0);
                                const dphi_dx = ((((((-phi_at((gx0 + 2), gy0, n_interior, n_total, ghost)) + (8.0 * phi_at((gx0 + 1), gy0, n_interior, n_total, ghost))) - (8.0 * phi_at((gx0 - 1), gy0, n_interior, n_total, ghost))) + phi_at((gx0 - 2), gy0, n_interior, n_total, ghost))) / ((12.0 * dx)));
                                const dphi_dy = ((((((-phi_at(gx0, (gy0 + 2), n_interior, n_total, ghost)) + (8.0 * phi_at(gx0, (gy0 + 1), n_interior, n_total, ghost))) - (8.0 * phi_at(gx0, (gy0 - 1), n_interior, n_total, ghost))) + phi_at(gx0, (gy0 - 2), n_interior, n_total, ghost))) / ((12.0 * dx)));
                                gx = (gx - dphi_dx);
                                gy = (gy - dphi_dy);
                            }
                            const dt = _u_dt_buf_dt;
                            const dpx = ((rho * gx) * dt);
                            const dpy = ((rho * gy) * dt);
                            const vx_mid = (vx + ((0.5 * gx) * dt));
                            const vy_mid = (vy + ((0.5 * gy) * dt));
                            const dE = ((rho * (((vx_mid * gx) + (vy_mid * gy)))) * dt);
                            const _sroa_5 = {x:u0_x, y:(u0_y + dpx), z:(u0_z + dpy), w:u0_w};
                            const u0_new_x = _sroa_5.x;
                            const u0_new_y = _sroa_5.y;
                            const u0_new_z = _sroa_5.z;
                            const u0_new_w = _sroa_5.w;
                            const E_new = (u1_x + dE);
                            let _inl_14_result;
                            _inl_14: {
                                let _inl_14__inl_7_result;
                                _inl_14__inl_7: {
                                    _inl_14__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_14__inl_7;
                                }
                                const _inl_14__inl_8_ix = (ix + 1);
                                let _inl_14__inl_8_result;
                                _inl_14__inl_8: {
                                    _inl_14__inl_8_result = ((iy * ((n_total + 1))) + _inl_14__inl_8_ix);
                                    break _inl_14__inl_8;
                                }
                                _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_7_result] + _b_Bx_face[_inl_14__inl_8_result])));
                                break _inl_14;
                            }
                            const bx = _inl_14_result;
                            let _inl_15_result;
                            _inl_15: {
                                let _inl_15__inl_9_result;
                                _inl_15__inl_9: {
                                    _inl_15__inl_9_result = ((iy * n_total) + ix);
                                    break _inl_15__inl_9;
                                }
                                const _inl_15__inl_10_iy = (iy + 1);
                                let _inl_15__inl_10_result;
                                _inl_15__inl_10: {
                                    _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + ix);
                                    break _inl_15__inl_10;
                                }
                                _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                                break _inl_15;
                            }
                            const by = _inl_15_result;
                            const p_new = pressure_from_dual_energy({x:u0_new_x, y:u0_new_y, z:u0_new_z, w:u0_new_w}, {x:E_new, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = u0_new_x;
                                const _wt1 = u0_new_y;
                                const _wt2 = u0_new_z;
                                const _wt3 = u0_new_w;
                                _b_U0[_wbase + 0] = _wt0;
                                _b_U0[_wbase + 1] = _wt1;
                                _b_U0[_wbase + 2] = _wt2;
                                _b_U0[_wbase + 3] = _wt3;
                            }
                            const _inl_16_bz = u1_y;
                            const _inl_16_rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                            const _inl_16_gamma = _u_U_uniforms_gamma;
                            const _inl_16_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_16_result_x, _inl_16_result_y, _inl_16_result_z, _inl_16_result_w;
                            _inl_16: {
                                const _inl_16_p_safe = ((p_new) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (p_new));
                                const _inl_16_eth = (_inl_16_p_safe / (((_inl_16_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_16_gamma - 1.0))));
                                let _inl_16__inl_4_result;
                                _inl_16__inl_4: {
                                    _inl_16__inl_4_result = (((_inl_16_p_safe) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (_inl_16_p_safe)) / Math.pow(((_inl_16_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_rho)), _inl_16_gamma));
                                    break _inl_16__inl_4;
                                }
                                const _ir0 = E_new;
                                const _ir1 = _inl_16_bz;
                                const _ir2 = _inl_16_eth;
                                const _ir3 = _inl_16__inl_4_result;
                                _inl_16_result_x = _ir0;
                                _inl_16_result_y = _ir1;
                                _inl_16_result_z = _ir2;
                                _inl_16_result_w = _ir3;
                                break _inl_16;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_16_result_x;
                                const _wt1 = _inl_16_result_y;
                                const _wt2 = _inl_16_result_z;
                                const _wt3 = _inl_16_result_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const flags = _u_U_uniforms_physics_flags;
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = (((flags & FLAG_GRAVITY_EXT)) != 0);
                            break _inl_11;
                        }
                        const do_ext = _inl_11_result;
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = (((flags & FLAG_GRAVITY_SELF)) != 0);
                            break _inl_12;
                        }
                        const do_self = (_inl_12_result && ((_u_U_uniforms_gravity_G > 0.0)));
                        if (((!do_ext) && (!do_self))) {
                            break __invocation;
                        }
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                            break __invocation;
                        }
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + ix);
                            break _inl_13;
                        }
                        const c = _inl_13_result;
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
                        const vx = (u0_y / rho);
                        const vy = (u0_z / rho);
                        let gx = 0.0;
                        let gy = 0.0;
                        if (do_ext) {
                            gx = (gx + _u_U_uniforms_gravity_gx);
                            gy = (gy + _u_U_uniforms_gravity_gy);
                        }
                        if (do_self) {
                            const dx = _u_U_uniforms_dx;
                            const gx0 = ((gid_x) | 0);
                            const gy0 = ((gid_y) | 0);
                            const dphi_dx = ((((((-phi_at((gx0 + 2), gy0, n_interior, n_total, ghost)) + (8.0 * phi_at((gx0 + 1), gy0, n_interior, n_total, ghost))) - (8.0 * phi_at((gx0 - 1), gy0, n_interior, n_total, ghost))) + phi_at((gx0 - 2), gy0, n_interior, n_total, ghost))) / ((12.0 * dx)));
                            const dphi_dy = ((((((-phi_at(gx0, (gy0 + 2), n_interior, n_total, ghost)) + (8.0 * phi_at(gx0, (gy0 + 1), n_interior, n_total, ghost))) - (8.0 * phi_at(gx0, (gy0 - 1), n_interior, n_total, ghost))) + phi_at(gx0, (gy0 - 2), n_interior, n_total, ghost))) / ((12.0 * dx)));
                            gx = (gx - dphi_dx);
                            gy = (gy - dphi_dy);
                        }
                        const dt = _u_dt_buf_dt;
                        const dpx = ((rho * gx) * dt);
                        const dpy = ((rho * gy) * dt);
                        const vx_mid = (vx + ((0.5 * gx) * dt));
                        const vy_mid = (vy + ((0.5 * gy) * dt));
                        const dE = ((rho * (((vx_mid * gx) + (vy_mid * gy)))) * dt);
                        const _sroa_8 = {x:u0_x, y:(u0_y + dpx), z:(u0_z + dpy), w:u0_w};
                        const u0_new_x = _sroa_8.x;
                        const u0_new_y = _sroa_8.y;
                        const u0_new_z = _sroa_8.z;
                        const u0_new_w = _sroa_8.w;
                        const E_new = (u1_x + dE);
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_7_result;
                            _inl_14__inl_7: {
                                _inl_14__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_14__inl_7;
                            }
                            const _inl_14__inl_8_ix = (ix + 1);
                            let _inl_14__inl_8_result;
                            _inl_14__inl_8: {
                                _inl_14__inl_8_result = ((iy * ((n_total + 1))) + _inl_14__inl_8_ix);
                                break _inl_14__inl_8;
                            }
                            _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_7_result] + _b_Bx_face[_inl_14__inl_8_result])));
                            break _inl_14;
                        }
                        const bx = _inl_14_result;
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_9_result;
                            _inl_15__inl_9: {
                                _inl_15__inl_9_result = ((iy * n_total) + ix);
                                break _inl_15__inl_9;
                            }
                            const _inl_15__inl_10_iy = (iy + 1);
                            let _inl_15__inl_10_result;
                            _inl_15__inl_10: {
                                _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + ix);
                                break _inl_15__inl_10;
                            }
                            _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                            break _inl_15;
                        }
                        const by = _inl_15_result;
                        const p_new = pressure_from_dual_energy({x:u0_new_x, y:u0_new_y, z:u0_new_z, w:u0_new_w}, {x:E_new, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u0_new_x;
                            const _wt1 = u0_new_y;
                            const _wt2 = u0_new_z;
                            const _wt3 = u0_new_w;
                            _b_U0[_wbase + 0] = _wt0;
                            _b_U0[_wbase + 1] = _wt1;
                            _b_U0[_wbase + 2] = _wt2;
                            _b_U0[_wbase + 3] = _wt3;
                        }
                        const _inl_16_bz = u1_y;
                        const _inl_16_rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                        const _inl_16_gamma = _u_U_uniforms_gamma;
                        const _inl_16_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_16_result_x, _inl_16_result_y, _inl_16_result_z, _inl_16_result_w;
                        _inl_16: {
                            const _inl_16_p_safe = ((p_new) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (p_new));
                            const _inl_16_eth = (_inl_16_p_safe / (((_inl_16_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_16_gamma - 1.0))));
                            let _inl_16__inl_4_result;
                            _inl_16__inl_4: {
                                _inl_16__inl_4_result = (((_inl_16_p_safe) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (_inl_16_p_safe)) / Math.pow(((_inl_16_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_rho)), _inl_16_gamma));
                                break _inl_16__inl_4;
                            }
                            const _ir0 = E_new;
                            const _ir1 = _inl_16_bz;
                            const _ir2 = _inl_16_eth;
                            const _ir3 = _inl_16__inl_4_result;
                            _inl_16_result_x = _ir0;
                            _inl_16_result_y = _ir1;
                            _inl_16_result_z = _ir2;
                            _inl_16_result_w = _ir3;
                            break _inl_16;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_16_result_x;
                            const _wt1 = _inl_16_result_y;
                            const _wt2 = _inl_16_result_z;
                            const _wt3 = _inl_16_result_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
                        }
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                const gid_x = __gx;
                const gid_y = __gy;
                __invocation: {
                    const flags = _u_U_uniforms_physics_flags;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = (((flags & FLAG_GRAVITY_EXT)) != 0);
                        break _inl_11;
                    }
                    const do_ext = _inl_11_result;
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = (((flags & FLAG_GRAVITY_SELF)) != 0);
                        break _inl_12;
                    }
                    const do_self = (_inl_12_result && ((_u_U_uniforms_gravity_G > 0.0)));
                    if (((!do_ext) && (!do_self))) {
                        break __invocation;
                    }
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + ix);
                        break _inl_13;
                    }
                    const c = _inl_13_result;
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
                    const vx = (u0_y / rho);
                    const vy = (u0_z / rho);
                    let gx = 0.0;
                    let gy = 0.0;
                    if (do_ext) {
                        gx = (gx + _u_U_uniforms_gravity_gx);
                        gy = (gy + _u_U_uniforms_gravity_gy);
                    }
                    if (do_self) {
                        const dx = _u_U_uniforms_dx;
                        const gx0 = ((gid_x) | 0);
                        const gy0 = ((gid_y) | 0);
                        const dphi_dx = ((((((-phi_at((gx0 + 2), gy0, n_interior, n_total, ghost)) + (8.0 * phi_at((gx0 + 1), gy0, n_interior, n_total, ghost))) - (8.0 * phi_at((gx0 - 1), gy0, n_interior, n_total, ghost))) + phi_at((gx0 - 2), gy0, n_interior, n_total, ghost))) / ((12.0 * dx)));
                        const dphi_dy = ((((((-phi_at(gx0, (gy0 + 2), n_interior, n_total, ghost)) + (8.0 * phi_at(gx0, (gy0 + 1), n_interior, n_total, ghost))) - (8.0 * phi_at(gx0, (gy0 - 1), n_interior, n_total, ghost))) + phi_at(gx0, (gy0 - 2), n_interior, n_total, ghost))) / ((12.0 * dx)));
                        gx = (gx - dphi_dx);
                        gy = (gy - dphi_dy);
                    }
                    const dt = _u_dt_buf_dt;
                    const dpx = ((rho * gx) * dt);
                    const dpy = ((rho * gy) * dt);
                    const vx_mid = (vx + ((0.5 * gx) * dt));
                    const vy_mid = (vy + ((0.5 * gy) * dt));
                    const dE = ((rho * (((vx_mid * gx) + (vy_mid * gy)))) * dt);
                    const _sroa_11 = {x:u0_x, y:(u0_y + dpx), z:(u0_z + dpy), w:u0_w};
                    const u0_new_x = _sroa_11.x;
                    const u0_new_y = _sroa_11.y;
                    const u0_new_z = _sroa_11.z;
                    const u0_new_w = _sroa_11.w;
                    const E_new = (u1_x + dE);
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_7_result;
                        _inl_14__inl_7: {
                            _inl_14__inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_14__inl_7;
                        }
                        const _inl_14__inl_8_ix = (ix + 1);
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((iy * ((n_total + 1))) + _inl_14__inl_8_ix);
                            break _inl_14__inl_8;
                        }
                        _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_7_result] + _b_Bx_face[_inl_14__inl_8_result])));
                        break _inl_14;
                    }
                    const bx = _inl_14_result;
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_9_result;
                        _inl_15__inl_9: {
                            _inl_15__inl_9_result = ((iy * n_total) + ix);
                            break _inl_15__inl_9;
                        }
                        const _inl_15__inl_10_iy = (iy + 1);
                        let _inl_15__inl_10_result;
                        _inl_15__inl_10: {
                            _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + ix);
                            break _inl_15__inl_10;
                        }
                        _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                        break _inl_15;
                    }
                    const by = _inl_15_result;
                    const p_new = pressure_from_dual_energy({x:u0_new_x, y:u0_new_y, z:u0_new_z, w:u0_new_w}, {x:E_new, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_new_x;
                        const _wt1 = u0_new_y;
                        const _wt2 = u0_new_z;
                        const _wt3 = u0_new_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_16_bz = u1_y;
                    const _inl_16_rho = ((u0_new_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_new_x));
                    const _inl_16_gamma = _u_U_uniforms_gamma;
                    const _inl_16_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_16_result_x, _inl_16_result_y, _inl_16_result_z, _inl_16_result_w;
                    _inl_16: {
                        const _inl_16_p_safe = ((p_new) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (p_new));
                        const _inl_16_eth = (_inl_16_p_safe / (((_inl_16_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_16_gamma - 1.0))));
                        let _inl_16__inl_4_result;
                        _inl_16__inl_4: {
                            _inl_16__inl_4_result = (((_inl_16_p_safe) < (_inl_16_p_floor) ? (_inl_16_p_floor) : (_inl_16_p_safe)) / Math.pow(((_inl_16_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_rho)), _inl_16_gamma));
                            break _inl_16__inl_4;
                        }
                        const _ir0 = E_new;
                        const _ir1 = _inl_16_bz;
                        const _ir2 = _inl_16_eth;
                        const _ir3 = _inl_16__inl_4_result;
                        _inl_16_result_x = _ir0;
                        _inl_16_result_y = _ir1;
                        _inl_16_result_z = _ir2;
                        _inl_16_result_w = _ir3;
                        break _inl_16;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_16_result_x;
                        const _wt1 = _inl_16_result_y;
                        const _wt2 = _inl_16_result_z;
                        const _wt3 = _inl_16_result_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
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

    return { entry, bind, bindings: ["U_uniforms","U0","U1","phi","dt_buf","Bx_face","By_face"], entryInfo };
}
