// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-geometry.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 2c14fb8fdb22a822a3458389eb6f14624ed7ef5ef1c84beb2ae9c78ed79db765
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":58102,"lines":1033,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":4,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.489Z
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
        const _u_U_uniforms_sponge_width = _b_U_uniforms.sponge_width;
        const _u_U_uniforms_sponge_strength = _b_U_uniforms.sponge_strength;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_dt_buf = bindings.dt_buf;
        const _u_dt_buf_dt = _b_dt_buf.dt;
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
                    const _inl_10_flags = _u_U_uniforms_physics_flags;
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = (((_inl_10_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_10;
                    }
                    const geom_on = (_inl_10_result && (_u_U_uniforms_geometry_mode == 1));
                    const _inl_11_flags = _u_U_uniforms_physics_flags;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = (((_inl_11_flags & FLAG_SPONGE)) != 0);
                        break _inl_11;
                    }
                    const sponge_on = ((_inl_11_result && (_u_U_uniforms_sponge_width > 0.0)) && (_u_U_uniforms_sponge_strength > 0.0));
                    if (((!geom_on) && (!sponge_on))) {
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
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * n_total) + ix);
                        break _inl_12;
                    }
                    const c = _inl_12_result;
                    const dt = _u_dt_buf_dt;
                    const dx = _u_U_uniforms_dx;
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_6_result;
                        _inl_13__inl_6: {
                            _inl_13__inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_13__inl_6;
                        }
                        const _inl_13__inl_7_ix = (ix + 1);
                        let _inl_13__inl_7_result;
                        _inl_13__inl_7: {
                            _inl_13__inl_7_result = ((iy * ((n_total + 1))) + _inl_13__inl_7_ix);
                            break _inl_13__inl_7;
                        }
                        _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_6_result] + _b_Bx_face[_inl_13__inl_7_result])));
                        break _inl_13;
                    }
                    const bx = _inl_13_result;
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((iy * n_total) + ix);
                            break _inl_14__inl_8;
                        }
                        const _inl_14__inl_9_iy = (iy + 1);
                        let _inl_14__inl_9_result;
                        _inl_14__inl_9: {
                            _inl_14__inl_9_result = ((_inl_14__inl_9_iy * n_total) + ix);
                            break _inl_14__inl_9;
                        }
                        _inl_14_result = (0.5 * ((_b_By_face[_inl_14__inl_8_result] + _b_By_face[_inl_14__inl_9_result])));
                        break _inl_14;
                    }
                    const by = _inl_14_result;
                    const _sroa_0_base = ((c) * 4 + 0);
                    let u0_x = _b_U0[_sroa_0_base + 0];
                    let u0_y = _b_U0[_sroa_0_base + 1];
                    let u0_z = _b_U0[_sroa_0_base + 2];
                    let u0_w = _b_U0[_sroa_0_base + 3];
                    const _sroa_1_base = ((c) * 4 + 0);
                    let u1_x = _b_U1[_sroa_1_base + 0];
                    let u1_y = _b_U1[_sroa_1_base + 1];
                    let u1_z = _b_U1[_sroa_1_base + 2];
                    let u1_w = _b_U1[_sroa_1_base + 3];
                    let rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    let vr = (u0_y / rho);
                    let vz = (u0_z / rho);
                    let vphi = (u0_w / rho);
                    let bphi = u1_y;
                    let _inl_15_result;
                    _inl_15: {
                        _inl_15_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        break _inl_15;
                    }
                    let p = _inl_15_result;
                    if (geom_on) {
                        const r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                        const inv_r = (1.0 / r);
                        const br = bx;
                        const total_pressure = (p + (0.5 * ((((br * br) + (by * by)) + (bphi * bphi)))));
                        const radial_force = ((((((rho * vphi) * vphi) + total_pressure) - (bphi * bphi))) * inv_r);
                        const dmx = (radial_force * dt);
                        const a = (vr * inv_r);
                        const decay = Math.exp(((-a) * dt));
                        let source_factor = dt;
                        if ((Math.abs(a) > 1.0e-8)) {
                            source_factor = (((1.0 - decay)) / a);
                        }
                        const mphi_new = ((u0_w * decay) + ((((br * bphi) * inv_r)) * source_factor));
                        const bphi_new = ((bphi * decay) + ((((vphi * br) * inv_r)) * source_factor));
                        {
                            const _wt0 = rho;
                            const _wt1 = (u0_y + dmx);
                            const _wt2 = u0_z;
                            const _wt3 = mphi_new;
                            u0_x = _wt0;
                            u0_y = _wt1;
                            u0_z = _wt2;
                            u0_w = _wt3;
                        }
                        {
                            const _wt0 = u1_x;
                            const _wt1 = bphi_new;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            u1_x = _wt0;
                            u1_y = _wt1;
                            u1_z = _wt2;
                            u1_w = _wt3;
                        }
                        rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        vr = (u0_y / rho);
                        vz = (u0_z / rho);
                        vphi = (u0_w / rho);
                        bphi = u1_y;
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            break _inl_16;
                        }
                        p = _inl_16_result;
                    }
                    if (sponge_on) {
                        const nx = (n_interior - 1);
                        const d0 = ((gid_y) < (gid_x) ? (gid_y) : (gid_x));
                        const d1 = (((nx - gid_y)) < ((nx - gid_x)) ? ((nx - gid_y)) : ((nx - gid_x)));
                        const dist = (+(((d1) < (d0) ? (d1) : (d0))));
                        const width = ((_u_U_uniforms_sponge_width) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_sponge_width));
                        if ((dist < width)) {
                            const x = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((1.0 - (dist / width)), 0.0, 1.0));
                            const damp = Math.exp(((((-_u_U_uniforms_sponge_strength) * x) * x) * dt));
                            const rho_s = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const mx = (u0_y * damp);
                            const my = (u0_z * damp);
                            const mz = (u0_w * damp);
                            const bz = (u1_y * damp);
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho_s);
                            const mb = (0.5 * ((((bx * bx) + (by * by)) + (bz * bz))));
                            {
                                const _wt0 = rho_s;
                                const _wt1 = mx;
                                const _wt2 = my;
                                const _wt3 = mz;
                                u0_x = _wt0;
                                u0_y = _wt1;
                                u0_z = _wt2;
                                u0_w = _wt3;
                            }
                            {
                                const _wt0 = ((ke + mb) + (p / ((_u_U_uniforms_gamma - 1.0))));
                                const _wt1 = bz;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                    }
                    let _inl_17_result;
                    _inl_17: {
                        _inl_17_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        break _inl_17;
                    }
                    const p_final = _inl_17_result;
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_x;
                        const _wt1 = u0_y;
                        const _wt2 = u0_z;
                        const _wt3 = u0_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_18_E = u1_x;
                    const _inl_18_bz = u1_y;
                    const _inl_18_rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const _inl_18_gamma = _u_U_uniforms_gamma;
                    const _inl_18_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_18_result_x, _inl_18_result_y, _inl_18_result_z, _inl_18_result_w;
                    _inl_18: {
                        const _inl_18_p_safe = ((p_final) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (p_final));
                        const _inl_18_eth = (_inl_18_p_safe / (((_inl_18_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_18_gamma - 1.0))));
                        let _inl_18__inl_4_result;
                        _inl_18__inl_4: {
                            _inl_18__inl_4_result = (((_inl_18_p_safe) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (_inl_18_p_safe)) / Math.pow(((_inl_18_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_rho)), _inl_18_gamma));
                            break _inl_18__inl_4;
                        }
                        const _ir0 = _inl_18_E;
                        const _ir1 = _inl_18_bz;
                        const _ir2 = _inl_18_eth;
                        const _ir3 = _inl_18__inl_4_result;
                        _inl_18_result_x = _ir0;
                        _inl_18_result_y = _ir1;
                        _inl_18_result_z = _ir2;
                        _inl_18_result_w = _ir3;
                        break _inl_18;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_18_result_x;
                        const _wt1 = _inl_18_result_y;
                        const _wt2 = _inl_18_result_z;
                        const _wt3 = _inl_18_result_w;
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
                            const _inl_10_flags = _u_U_uniforms_physics_flags;
                            let _inl_10_result;
                            _inl_10: {
                                _inl_10_result = (((_inl_10_flags & FLAG_GEOMETRY)) != 0);
                                break _inl_10;
                            }
                            const geom_on = (_inl_10_result && (_u_U_uniforms_geometry_mode == 1));
                            const _inl_11_flags = _u_U_uniforms_physics_flags;
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = (((_inl_11_flags & FLAG_SPONGE)) != 0);
                                break _inl_11;
                            }
                            const sponge_on = ((_inl_11_result && (_u_U_uniforms_sponge_width > 0.0)) && (_u_U_uniforms_sponge_strength > 0.0));
                            if (((!geom_on) && (!sponge_on))) {
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
                            let _inl_12_result;
                            _inl_12: {
                                _inl_12_result = ((iy * n_total) + ix);
                                break _inl_12;
                            }
                            const c = _inl_12_result;
                            const dt = _u_dt_buf_dt;
                            const dx = _u_U_uniforms_dx;
                            let _inl_13_result;
                            _inl_13: {
                                let _inl_13__inl_6_result;
                                _inl_13__inl_6: {
                                    _inl_13__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_13__inl_6;
                                }
                                const _inl_13__inl_7_ix = (ix + 1);
                                let _inl_13__inl_7_result;
                                _inl_13__inl_7: {
                                    _inl_13__inl_7_result = ((iy * ((n_total + 1))) + _inl_13__inl_7_ix);
                                    break _inl_13__inl_7;
                                }
                                _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_6_result] + _b_Bx_face[_inl_13__inl_7_result])));
                                break _inl_13;
                            }
                            const bx = _inl_13_result;
                            let _inl_14_result;
                            _inl_14: {
                                let _inl_14__inl_8_result;
                                _inl_14__inl_8: {
                                    _inl_14__inl_8_result = ((iy * n_total) + ix);
                                    break _inl_14__inl_8;
                                }
                                const _inl_14__inl_9_iy = (iy + 1);
                                let _inl_14__inl_9_result;
                                _inl_14__inl_9: {
                                    _inl_14__inl_9_result = ((_inl_14__inl_9_iy * n_total) + ix);
                                    break _inl_14__inl_9;
                                }
                                _inl_14_result = (0.5 * ((_b_By_face[_inl_14__inl_8_result] + _b_By_face[_inl_14__inl_9_result])));
                                break _inl_14;
                            }
                            const by = _inl_14_result;
                            const _sroa_2_base = ((c) * 4 + 0);
                            let u0_x = _b_U0[_sroa_2_base + 0];
                            let u0_y = _b_U0[_sroa_2_base + 1];
                            let u0_z = _b_U0[_sroa_2_base + 2];
                            let u0_w = _b_U0[_sroa_2_base + 3];
                            const _sroa_3_base = ((c) * 4 + 0);
                            let u1_x = _b_U1[_sroa_3_base + 0];
                            let u1_y = _b_U1[_sroa_3_base + 1];
                            let u1_z = _b_U1[_sroa_3_base + 2];
                            let u1_w = _b_U1[_sroa_3_base + 3];
                            let rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            let vr = (u0_y / rho);
                            let vz = (u0_z / rho);
                            let vphi = (u0_w / rho);
                            let bphi = u1_y;
                            let _inl_15_result;
                            _inl_15: {
                                _inl_15_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                break _inl_15;
                            }
                            let p = _inl_15_result;
                            if (geom_on) {
                                const r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                                const inv_r = (1.0 / r);
                                const br = bx;
                                const total_pressure = (p + (0.5 * ((((br * br) + (by * by)) + (bphi * bphi)))));
                                const radial_force = ((((((rho * vphi) * vphi) + total_pressure) - (bphi * bphi))) * inv_r);
                                const dmx = (radial_force * dt);
                                const a = (vr * inv_r);
                                const decay = Math.exp(((-a) * dt));
                                let source_factor = dt;
                                if ((Math.abs(a) > 1.0e-8)) {
                                    source_factor = (((1.0 - decay)) / a);
                                }
                                const mphi_new = ((u0_w * decay) + ((((br * bphi) * inv_r)) * source_factor));
                                const bphi_new = ((bphi * decay) + ((((vphi * br) * inv_r)) * source_factor));
                                {
                                    const _wt0 = rho;
                                    const _wt1 = (u0_y + dmx);
                                    const _wt2 = u0_z;
                                    const _wt3 = mphi_new;
                                    u0_x = _wt0;
                                    u0_y = _wt1;
                                    u0_z = _wt2;
                                    u0_w = _wt3;
                                }
                                {
                                    const _wt0 = u1_x;
                                    const _wt1 = bphi_new;
                                    const _wt2 = u1_z;
                                    const _wt3 = u1_w;
                                    u1_x = _wt0;
                                    u1_y = _wt1;
                                    u1_z = _wt2;
                                    u1_w = _wt3;
                                }
                                rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                                vr = (u0_y / rho);
                                vz = (u0_z / rho);
                                vphi = (u0_w / rho);
                                bphi = u1_y;
                                let _inl_16_result;
                                _inl_16: {
                                    _inl_16_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                    break _inl_16;
                                }
                                p = _inl_16_result;
                            }
                            if (sponge_on) {
                                const nx = (n_interior - 1);
                                const d0 = ((gid_y) < (gid_x) ? (gid_y) : (gid_x));
                                const d1 = (((nx - gid_y)) < ((nx - gid_x)) ? ((nx - gid_y)) : ((nx - gid_x)));
                                const dist = (+(((d1) < (d0) ? (d1) : (d0))));
                                const width = ((_u_U_uniforms_sponge_width) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_sponge_width));
                                if ((dist < width)) {
                                    const x = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((1.0 - (dist / width)), 0.0, 1.0));
                                    const damp = Math.exp(((((-_u_U_uniforms_sponge_strength) * x) * x) * dt));
                                    const rho_s = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                                    const mx = (u0_y * damp);
                                    const my = (u0_z * damp);
                                    const mz = (u0_w * damp);
                                    const bz = (u1_y * damp);
                                    const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho_s);
                                    const mb = (0.5 * ((((bx * bx) + (by * by)) + (bz * bz))));
                                    {
                                        const _wt0 = rho_s;
                                        const _wt1 = mx;
                                        const _wt2 = my;
                                        const _wt3 = mz;
                                        u0_x = _wt0;
                                        u0_y = _wt1;
                                        u0_z = _wt2;
                                        u0_w = _wt3;
                                    }
                                    {
                                        const _wt0 = ((ke + mb) + (p / ((_u_U_uniforms_gamma - 1.0))));
                                        const _wt1 = bz;
                                        const _wt2 = u1_z;
                                        const _wt3 = u1_w;
                                        u1_x = _wt0;
                                        u1_y = _wt1;
                                        u1_z = _wt2;
                                        u1_w = _wt3;
                                    }
                                }
                            }
                            let _inl_17_result;
                            _inl_17: {
                                _inl_17_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                break _inl_17;
                            }
                            const p_final = _inl_17_result;
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = u0_x;
                                const _wt1 = u0_y;
                                const _wt2 = u0_z;
                                const _wt3 = u0_w;
                                _b_U0[_wbase + 0] = _wt0;
                                _b_U0[_wbase + 1] = _wt1;
                                _b_U0[_wbase + 2] = _wt2;
                                _b_U0[_wbase + 3] = _wt3;
                            }
                            const _inl_18_E = u1_x;
                            const _inl_18_bz = u1_y;
                            const _inl_18_rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const _inl_18_gamma = _u_U_uniforms_gamma;
                            const _inl_18_p_floor = _u_U_uniforms_pressure_floor;
                            let _inl_18_result_x, _inl_18_result_y, _inl_18_result_z, _inl_18_result_w;
                            _inl_18: {
                                const _inl_18_p_safe = ((p_final) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (p_final));
                                const _inl_18_eth = (_inl_18_p_safe / (((_inl_18_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_18_gamma - 1.0))));
                                let _inl_18__inl_4_result;
                                _inl_18__inl_4: {
                                    _inl_18__inl_4_result = (((_inl_18_p_safe) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (_inl_18_p_safe)) / Math.pow(((_inl_18_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_rho)), _inl_18_gamma));
                                    break _inl_18__inl_4;
                                }
                                const _ir0 = _inl_18_E;
                                const _ir1 = _inl_18_bz;
                                const _ir2 = _inl_18_eth;
                                const _ir3 = _inl_18__inl_4_result;
                                _inl_18_result_x = _ir0;
                                _inl_18_result_y = _ir1;
                                _inl_18_result_z = _ir2;
                                _inl_18_result_w = _ir3;
                                break _inl_18;
                            }
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _inl_18_result_x;
                                const _wt1 = _inl_18_result_y;
                                const _wt2 = _inl_18_result_z;
                                const _wt3 = _inl_18_result_w;
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
                        const _inl_10_flags = _u_U_uniforms_physics_flags;
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = (((_inl_10_flags & FLAG_GEOMETRY)) != 0);
                            break _inl_10;
                        }
                        const geom_on = (_inl_10_result && (_u_U_uniforms_geometry_mode == 1));
                        const _inl_11_flags = _u_U_uniforms_physics_flags;
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = (((_inl_11_flags & FLAG_SPONGE)) != 0);
                            break _inl_11;
                        }
                        const sponge_on = ((_inl_11_result && (_u_U_uniforms_sponge_width > 0.0)) && (_u_U_uniforms_sponge_strength > 0.0));
                        if (((!geom_on) && (!sponge_on))) {
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
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * n_total) + ix);
                            break _inl_12;
                        }
                        const c = _inl_12_result;
                        const dt = _u_dt_buf_dt;
                        const dx = _u_U_uniforms_dx;
                        let _inl_13_result;
                        _inl_13: {
                            let _inl_13__inl_6_result;
                            _inl_13__inl_6: {
                                _inl_13__inl_6_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_13__inl_6;
                            }
                            const _inl_13__inl_7_ix = (ix + 1);
                            let _inl_13__inl_7_result;
                            _inl_13__inl_7: {
                                _inl_13__inl_7_result = ((iy * ((n_total + 1))) + _inl_13__inl_7_ix);
                                break _inl_13__inl_7;
                            }
                            _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_6_result] + _b_Bx_face[_inl_13__inl_7_result])));
                            break _inl_13;
                        }
                        const bx = _inl_13_result;
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_8_result;
                            _inl_14__inl_8: {
                                _inl_14__inl_8_result = ((iy * n_total) + ix);
                                break _inl_14__inl_8;
                            }
                            const _inl_14__inl_9_iy = (iy + 1);
                            let _inl_14__inl_9_result;
                            _inl_14__inl_9: {
                                _inl_14__inl_9_result = ((_inl_14__inl_9_iy * n_total) + ix);
                                break _inl_14__inl_9;
                            }
                            _inl_14_result = (0.5 * ((_b_By_face[_inl_14__inl_8_result] + _b_By_face[_inl_14__inl_9_result])));
                            break _inl_14;
                        }
                        const by = _inl_14_result;
                        const _sroa_4_base = ((c) * 4 + 0);
                        let u0_x = _b_U0[_sroa_4_base + 0];
                        let u0_y = _b_U0[_sroa_4_base + 1];
                        let u0_z = _b_U0[_sroa_4_base + 2];
                        let u0_w = _b_U0[_sroa_4_base + 3];
                        const _sroa_5_base = ((c) * 4 + 0);
                        let u1_x = _b_U1[_sroa_5_base + 0];
                        let u1_y = _b_U1[_sroa_5_base + 1];
                        let u1_z = _b_U1[_sroa_5_base + 2];
                        let u1_w = _b_U1[_sroa_5_base + 3];
                        let rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        let vr = (u0_y / rho);
                        let vz = (u0_z / rho);
                        let vphi = (u0_w / rho);
                        let bphi = u1_y;
                        let _inl_15_result;
                        _inl_15: {
                            _inl_15_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            break _inl_15;
                        }
                        let p = _inl_15_result;
                        if (geom_on) {
                            const r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                            const inv_r = (1.0 / r);
                            const br = bx;
                            const total_pressure = (p + (0.5 * ((((br * br) + (by * by)) + (bphi * bphi)))));
                            const radial_force = ((((((rho * vphi) * vphi) + total_pressure) - (bphi * bphi))) * inv_r);
                            const dmx = (radial_force * dt);
                            const a = (vr * inv_r);
                            const decay = Math.exp(((-a) * dt));
                            let source_factor = dt;
                            if ((Math.abs(a) > 1.0e-8)) {
                                source_factor = (((1.0 - decay)) / a);
                            }
                            const mphi_new = ((u0_w * decay) + ((((br * bphi) * inv_r)) * source_factor));
                            const bphi_new = ((bphi * decay) + ((((vphi * br) * inv_r)) * source_factor));
                            {
                                const _wt0 = rho;
                                const _wt1 = (u0_y + dmx);
                                const _wt2 = u0_z;
                                const _wt3 = mphi_new;
                                u0_x = _wt0;
                                u0_y = _wt1;
                                u0_z = _wt2;
                                u0_w = _wt3;
                            }
                            {
                                const _wt0 = u1_x;
                                const _wt1 = bphi_new;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                            rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            vr = (u0_y / rho);
                            vz = (u0_z / rho);
                            vphi = (u0_w / rho);
                            bphi = u1_y;
                            let _inl_16_result;
                            _inl_16: {
                                _inl_16_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                                break _inl_16;
                            }
                            p = _inl_16_result;
                        }
                        if (sponge_on) {
                            const nx = (n_interior - 1);
                            const d0 = ((gid_y) < (gid_x) ? (gid_y) : (gid_x));
                            const d1 = (((nx - gid_y)) < ((nx - gid_x)) ? ((nx - gid_y)) : ((nx - gid_x)));
                            const dist = (+(((d1) < (d0) ? (d1) : (d0))));
                            const width = ((_u_U_uniforms_sponge_width) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_sponge_width));
                            if ((dist < width)) {
                                const x = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((1.0 - (dist / width)), 0.0, 1.0));
                                const damp = Math.exp(((((-_u_U_uniforms_sponge_strength) * x) * x) * dt));
                                const rho_s = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                                const mx = (u0_y * damp);
                                const my = (u0_z * damp);
                                const mz = (u0_w * damp);
                                const bz = (u1_y * damp);
                                const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho_s);
                                const mb = (0.5 * ((((bx * bx) + (by * by)) + (bz * bz))));
                                {
                                    const _wt0 = rho_s;
                                    const _wt1 = mx;
                                    const _wt2 = my;
                                    const _wt3 = mz;
                                    u0_x = _wt0;
                                    u0_y = _wt1;
                                    u0_z = _wt2;
                                    u0_w = _wt3;
                                }
                                {
                                    const _wt0 = ((ke + mb) + (p / ((_u_U_uniforms_gamma - 1.0))));
                                    const _wt1 = bz;
                                    const _wt2 = u1_z;
                                    const _wt3 = u1_w;
                                    u1_x = _wt0;
                                    u1_y = _wt1;
                                    u1_z = _wt2;
                                    u1_w = _wt3;
                                }
                            }
                        }
                        let _inl_17_result;
                        _inl_17: {
                            _inl_17_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            break _inl_17;
                        }
                        const p_final = _inl_17_result;
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = u0_x;
                            const _wt1 = u0_y;
                            const _wt2 = u0_z;
                            const _wt3 = u0_w;
                            _b_U0[_wbase + 0] = _wt0;
                            _b_U0[_wbase + 1] = _wt1;
                            _b_U0[_wbase + 2] = _wt2;
                            _b_U0[_wbase + 3] = _wt3;
                        }
                        const _inl_18_E = u1_x;
                        const _inl_18_bz = u1_y;
                        const _inl_18_rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        const _inl_18_gamma = _u_U_uniforms_gamma;
                        const _inl_18_p_floor = _u_U_uniforms_pressure_floor;
                        let _inl_18_result_x, _inl_18_result_y, _inl_18_result_z, _inl_18_result_w;
                        _inl_18: {
                            const _inl_18_p_safe = ((p_final) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (p_final));
                            const _inl_18_eth = (_inl_18_p_safe / (((_inl_18_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_18_gamma - 1.0))));
                            let _inl_18__inl_4_result;
                            _inl_18__inl_4: {
                                _inl_18__inl_4_result = (((_inl_18_p_safe) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (_inl_18_p_safe)) / Math.pow(((_inl_18_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_rho)), _inl_18_gamma));
                                break _inl_18__inl_4;
                            }
                            const _ir0 = _inl_18_E;
                            const _ir1 = _inl_18_bz;
                            const _ir2 = _inl_18_eth;
                            const _ir3 = _inl_18__inl_4_result;
                            _inl_18_result_x = _ir0;
                            _inl_18_result_y = _ir1;
                            _inl_18_result_z = _ir2;
                            _inl_18_result_w = _ir3;
                            break _inl_18;
                        }
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _inl_18_result_x;
                            const _wt1 = _inl_18_result_y;
                            const _wt2 = _inl_18_result_z;
                            const _wt3 = _inl_18_result_w;
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
                    const _inl_10_flags = _u_U_uniforms_physics_flags;
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = (((_inl_10_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_10;
                    }
                    const geom_on = (_inl_10_result && (_u_U_uniforms_geometry_mode == 1));
                    const _inl_11_flags = _u_U_uniforms_physics_flags;
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = (((_inl_11_flags & FLAG_SPONGE)) != 0);
                        break _inl_11;
                    }
                    const sponge_on = ((_inl_11_result && (_u_U_uniforms_sponge_width > 0.0)) && (_u_U_uniforms_sponge_strength > 0.0));
                    if (((!geom_on) && (!sponge_on))) {
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
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * n_total) + ix);
                        break _inl_12;
                    }
                    const c = _inl_12_result;
                    const dt = _u_dt_buf_dt;
                    const dx = _u_U_uniforms_dx;
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_6_result;
                        _inl_13__inl_6: {
                            _inl_13__inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_13__inl_6;
                        }
                        const _inl_13__inl_7_ix = (ix + 1);
                        let _inl_13__inl_7_result;
                        _inl_13__inl_7: {
                            _inl_13__inl_7_result = ((iy * ((n_total + 1))) + _inl_13__inl_7_ix);
                            break _inl_13__inl_7;
                        }
                        _inl_13_result = (0.5 * ((_b_Bx_face[_inl_13__inl_6_result] + _b_Bx_face[_inl_13__inl_7_result])));
                        break _inl_13;
                    }
                    const bx = _inl_13_result;
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_8_result;
                        _inl_14__inl_8: {
                            _inl_14__inl_8_result = ((iy * n_total) + ix);
                            break _inl_14__inl_8;
                        }
                        const _inl_14__inl_9_iy = (iy + 1);
                        let _inl_14__inl_9_result;
                        _inl_14__inl_9: {
                            _inl_14__inl_9_result = ((_inl_14__inl_9_iy * n_total) + ix);
                            break _inl_14__inl_9;
                        }
                        _inl_14_result = (0.5 * ((_b_By_face[_inl_14__inl_8_result] + _b_By_face[_inl_14__inl_9_result])));
                        break _inl_14;
                    }
                    const by = _inl_14_result;
                    const _sroa_6_base = ((c) * 4 + 0);
                    let u0_x = _b_U0[_sroa_6_base + 0];
                    let u0_y = _b_U0[_sroa_6_base + 1];
                    let u0_z = _b_U0[_sroa_6_base + 2];
                    let u0_w = _b_U0[_sroa_6_base + 3];
                    const _sroa_7_base = ((c) * 4 + 0);
                    let u1_x = _b_U1[_sroa_7_base + 0];
                    let u1_y = _b_U1[_sroa_7_base + 1];
                    let u1_z = _b_U1[_sroa_7_base + 2];
                    let u1_w = _b_U1[_sroa_7_base + 3];
                    let rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    let vr = (u0_y / rho);
                    let vz = (u0_z / rho);
                    let vphi = (u0_w / rho);
                    let bphi = u1_y;
                    let _inl_15_result;
                    _inl_15: {
                        _inl_15_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        break _inl_15;
                    }
                    let p = _inl_15_result;
                    if (geom_on) {
                        const r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                        const inv_r = (1.0 / r);
                        const br = bx;
                        const total_pressure = (p + (0.5 * ((((br * br) + (by * by)) + (bphi * bphi)))));
                        const radial_force = ((((((rho * vphi) * vphi) + total_pressure) - (bphi * bphi))) * inv_r);
                        const dmx = (radial_force * dt);
                        const a = (vr * inv_r);
                        const decay = Math.exp(((-a) * dt));
                        let source_factor = dt;
                        if ((Math.abs(a) > 1.0e-8)) {
                            source_factor = (((1.0 - decay)) / a);
                        }
                        const mphi_new = ((u0_w * decay) + ((((br * bphi) * inv_r)) * source_factor));
                        const bphi_new = ((bphi * decay) + ((((vphi * br) * inv_r)) * source_factor));
                        {
                            const _wt0 = rho;
                            const _wt1 = (u0_y + dmx);
                            const _wt2 = u0_z;
                            const _wt3 = mphi_new;
                            u0_x = _wt0;
                            u0_y = _wt1;
                            u0_z = _wt2;
                            u0_w = _wt3;
                        }
                        {
                            const _wt0 = u1_x;
                            const _wt1 = bphi_new;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            u1_x = _wt0;
                            u1_y = _wt1;
                            u1_z = _wt2;
                            u1_w = _wt3;
                        }
                        rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                        vr = (u0_y / rho);
                        vz = (u0_z / rho);
                        vphi = (u0_w / rho);
                        bphi = u1_y;
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                            break _inl_16;
                        }
                        p = _inl_16_result;
                    }
                    if (sponge_on) {
                        const nx = (n_interior - 1);
                        const d0 = ((gid_y) < (gid_x) ? (gid_y) : (gid_x));
                        const d1 = (((nx - gid_y)) < ((nx - gid_x)) ? ((nx - gid_y)) : ((nx - gid_x)));
                        const dist = (+(((d1) < (d0) ? (d1) : (d0))));
                        const width = ((_u_U_uniforms_sponge_width) < (1.0e-6) ? (1.0e-6) : (_u_U_uniforms_sponge_width));
                        if ((dist < width)) {
                            const x = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((1.0 - (dist / width)), 0.0, 1.0));
                            const damp = Math.exp(((((-_u_U_uniforms_sponge_strength) * x) * x) * dt));
                            const rho_s = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                            const mx = (u0_y * damp);
                            const my = (u0_z * damp);
                            const mz = (u0_w * damp);
                            const bz = (u1_y * damp);
                            const ke = ((0.5 * ((((mx * mx) + (my * my)) + (mz * mz)))) / rho_s);
                            const mb = (0.5 * ((((bx * bx) + (by * by)) + (bz * bz))));
                            {
                                const _wt0 = rho_s;
                                const _wt1 = mx;
                                const _wt2 = my;
                                const _wt3 = mz;
                                u0_x = _wt0;
                                u0_y = _wt1;
                                u0_z = _wt2;
                                u0_w = _wt3;
                            }
                            {
                                const _wt0 = ((ke + mb) + (p / ((_u_U_uniforms_gamma - 1.0))));
                                const _wt1 = bz;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                u1_x = _wt0;
                                u1_y = _wt1;
                                u1_z = _wt2;
                                u1_w = _wt3;
                            }
                        }
                    }
                    let _inl_17_result;
                    _inl_17: {
                        _inl_17_result = pressure_from_dual_energy({x:u0_x, y:u0_y, z:u0_z, w:u0_w}, {x:u1_x, y:u1_y, z:u1_z, w:u1_w}, bx, by, _u_U_uniforms_gamma, _u_U_uniforms_pressure_floor);
                        break _inl_17;
                    }
                    const p_final = _inl_17_result;
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = u0_x;
                        const _wt1 = u0_y;
                        const _wt2 = u0_z;
                        const _wt3 = u0_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _inl_18_E = u1_x;
                    const _inl_18_bz = u1_y;
                    const _inl_18_rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                    const _inl_18_gamma = _u_U_uniforms_gamma;
                    const _inl_18_p_floor = _u_U_uniforms_pressure_floor;
                    let _inl_18_result_x, _inl_18_result_y, _inl_18_result_z, _inl_18_result_w;
                    _inl_18: {
                        const _inl_18_p_safe = ((p_final) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (p_final));
                        const _inl_18_eth = (_inl_18_p_safe / (((_inl_18_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_inl_18_gamma - 1.0))));
                        let _inl_18__inl_4_result;
                        _inl_18__inl_4: {
                            _inl_18__inl_4_result = (((_inl_18_p_safe) < (_inl_18_p_floor) ? (_inl_18_p_floor) : (_inl_18_p_safe)) / Math.pow(((_inl_18_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_rho)), _inl_18_gamma));
                            break _inl_18__inl_4;
                        }
                        const _ir0 = _inl_18_E;
                        const _ir1 = _inl_18_bz;
                        const _ir2 = _inl_18_eth;
                        const _ir3 = _inl_18__inl_4_result;
                        _inl_18_result_x = _ir0;
                        _inl_18_result_y = _ir1;
                        _inl_18_result_z = _ir2;
                        _inl_18_result_w = _ir3;
                        break _inl_18;
                    }
                    {
                        const _wbase = ((c) * 4 + 0);
                        const _wt0 = _inl_18_result_x;
                        const _wt1 = _inl_18_result_y;
                        const _wt2 = _inl_18_result_z;
                        const _wt3 = _inl_18_result_w;
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

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","dt_buf"], entryInfo };
}
