// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/view-field.wgsl
// wgsl-variant: speed.n256
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: 842361d227421d46456170eff731bebeed1c8b3007bf43e67cde5ed2b49de93c
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"inlineHotFns":["bx_at","by_at"],"specializeUniforms":{"U_uniforms":{"view_mode":2,"grid_n":256,"grid_n_total":260,"ghost_w":2}},"fixedWorkgroups":[32,32,1]}
// wgsl-metrics: {"bytes":29546,"lines":565,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":12}
// generated: 2026-05-27T17:41:05.270Z
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
        const dual_eth = ((U1_z) < (eth_floor) ? (eth_floor) : (U1_z));
        const eth = (total_ok ? eth_total : dual_eth);
        return (((((gamma - 1.0)) * eth)) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * eth)));
    }

    function cell_temp(ix, iy, n_total) {
        let _inl_10_result;
        _inl_10: {
            _inl_10_result = ((iy * n_total) + ix);
            break _inl_10;
        }
        const idx = _inl_10_result;
        const _sroa_0_base = ((idx) * 4 + 0);
        const U0_x = bindings.U0_in[_sroa_0_base + 0];
        const U0_y = bindings.U0_in[_sroa_0_base + 1];
        const U0_z = bindings.U0_in[_sroa_0_base + 2];
        const U0_w = bindings.U0_in[_sroa_0_base + 3];
        const _sroa_1_base = ((idx) * 4 + 0);
        const U1_x = bindings.U1_in[_sroa_1_base + 0];
        const U1_y = bindings.U1_in[_sroa_1_base + 1];
        const U1_z = bindings.U1_in[_sroa_1_base + 2];
        const U1_w = bindings.U1_in[_sroa_1_base + 3];
        const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
        let _inl_11_result;
        _inl_11: {
            let _inl_11__inl_6_result;
            _inl_11__inl_6: {
                let _inl_11__inl_6__inl_0_result;
                _inl_11__inl_6__inl_0: {
                    _inl_11__inl_6__inl_0_result = ((iy * ((n_total + 1))) + ix);
                    break _inl_11__inl_6__inl_0;
                }
                _inl_11__inl_6_result = _inl_11__inl_6__inl_0_result;
                break _inl_11__inl_6;
            }
            let _inl_11__inl_7_result;
            _inl_11__inl_7: {
                const _inl_11__inl_7__inl_1_ix = (ix + 1);
                let _inl_11__inl_7__inl_1_result;
                _inl_11__inl_7__inl_1: {
                    _inl_11__inl_7__inl_1_result = ((iy * ((n_total + 1))) + _inl_11__inl_7__inl_1_ix);
                    break _inl_11__inl_7__inl_1;
                }
                _inl_11__inl_7_result = _inl_11__inl_7__inl_1_result;
                break _inl_11__inl_7;
            }
            _inl_11_result = (0.5 * ((bindings.Bx_face[_inl_11__inl_6_result] + bindings.Bx_face[_inl_11__inl_7_result])));
            break _inl_11;
        }
        const bx_c = _inl_11_result;
        let _inl_12_result;
        _inl_12: {
            let _inl_12__inl_8_result;
            _inl_12__inl_8: {
                let _inl_12__inl_8__inl_2_result;
                _inl_12__inl_8__inl_2: {
                    _inl_12__inl_8__inl_2_result = ((iy * n_total) + ix);
                    break _inl_12__inl_8__inl_2;
                }
                _inl_12__inl_8_result = _inl_12__inl_8__inl_2_result;
                break _inl_12__inl_8;
            }
            let _inl_12__inl_9_result;
            _inl_12__inl_9: {
                const _inl_12__inl_9__inl_3_iy = (iy + 1);
                let _inl_12__inl_9__inl_3_result;
                _inl_12__inl_9__inl_3: {
                    _inl_12__inl_9__inl_3_result = ((_inl_12__inl_9__inl_3_iy * n_total) + ix);
                    break _inl_12__inl_9__inl_3;
                }
                _inl_12__inl_9_result = _inl_12__inl_9__inl_3_result;
                break _inl_12__inl_9;
            }
            _inl_12_result = (0.5 * ((bindings.By_face[_inl_12__inl_8_result] + bindings.By_face[_inl_12__inl_9_result])));
            break _inl_12;
        }
        const by_c = _inl_12_result;
        const p = pressure_from_dual_energy({x:U0_x, y:U0_y, z:U0_z, w:U0_w}, {x:U1_x, y:U1_y, z:U1_z, w:U1_w}, bx_c, by_c, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
        return (p / rho);
    }

    function heat_flux_sat_factor_view(qx, qy, rho, T) {
        const phi_sat = bindings.U_uniforms.conduction_sat_frac;
        if ((phi_sat <= 0.0)) {
            return 1.0;
        }
        const cs = Math.sqrt((((bindings.U_uniforms.gamma * T)) < (0.0) ? (0.0) : ((bindings.U_uniforms.gamma * T))));
        const q_sat = ((((((phi_sat * ((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho))) * cs) * cs) * cs)) < (1.0e-30) ? (1.0e-30) : (((((phi_sat * ((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho))) * cs) * cs) * cs)));
        const q_mag = Math.sqrt(((((qx * qx) + (qy * qy))) < (0.0) ? (0.0) : (((qx * qx) + (qy * qy)))));
        return (1.0 / Math.sqrt((1.0 + (((q_mag / q_sat)) * ((q_mag / q_sat))))));
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const Wx = 32, Wy = 32, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _u_U_uniforms_cooling_T_ref = _b_U_uniforms.cooling_T_ref;
        const _u_U_uniforms_conduction_kappa = _b_U_uniforms.conduction_kappa;
        const _u_U_uniforms_conduction_iso_frac = _b_U_uniforms.conduction_iso_frac;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_field = bindings.field;
        const _b_phi = bindings.phi;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = 256;
        const __clipYBound = 256;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n_interior = 256;
                        const n_total = 260;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + ix);
                            break _inl_13;
                        }
                        const idx_c = _inl_13_result;
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_6_result;
                            _inl_14__inl_6: {
                                let _inl_14__inl_6__inl_0_result;
                                _inl_14__inl_6__inl_0: {
                                    _inl_14__inl_6__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_14__inl_6__inl_0;
                                }
                                _inl_14__inl_6_result = _inl_14__inl_6__inl_0_result;
                                break _inl_14__inl_6;
                            }
                            let _inl_14__inl_7_result;
                            _inl_14__inl_7: {
                                const _inl_14__inl_7__inl_1_ix = (ix + 1);
                                let _inl_14__inl_7__inl_1_result;
                                _inl_14__inl_7__inl_1: {
                                    _inl_14__inl_7__inl_1_result = ((iy * ((n_total + 1))) + _inl_14__inl_7__inl_1_ix);
                                    break _inl_14__inl_7__inl_1;
                                }
                                _inl_14__inl_7_result = _inl_14__inl_7__inl_1_result;
                                break _inl_14__inl_7;
                            }
                            _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_6_result] + _b_Bx_face[_inl_14__inl_7_result])));
                            break _inl_14;
                        }
                        const bx_c = _inl_14_result;
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_8_result;
                            _inl_15__inl_8: {
                                let _inl_15__inl_8__inl_2_result;
                                _inl_15__inl_8__inl_2: {
                                    _inl_15__inl_8__inl_2_result = ((iy * n_total) + ix);
                                    break _inl_15__inl_8__inl_2;
                                }
                                _inl_15__inl_8_result = _inl_15__inl_8__inl_2_result;
                                break _inl_15__inl_8;
                            }
                            let _inl_15__inl_9_result;
                            _inl_15__inl_9: {
                                const _inl_15__inl_9__inl_3_iy = (iy + 1);
                                let _inl_15__inl_9__inl_3_result;
                                _inl_15__inl_9__inl_3: {
                                    _inl_15__inl_9__inl_3_result = ((_inl_15__inl_9__inl_3_iy * n_total) + ix);
                                    break _inl_15__inl_9__inl_3;
                                }
                                _inl_15__inl_9_result = _inl_15__inl_9__inl_3_result;
                                break _inl_15__inl_9;
                            }
                            _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_8_result] + _b_By_face[_inl_15__inl_9_result])));
                            break _inl_15;
                        }
                        const by_c = _inl_15_result;
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
                        const mode = 2;
                        let v = 0.0;
                        {
                            const vx = (U0_y / rho);
                            const vy = (U0_z / rho);
                            const vz = (U0_w / rho);
                            v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                        }
                        _b_field[idx_c] = v;
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
                            const n_interior = 256;
                            const n_total = 260;
                            const ghost = 2;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_13_result;
                            _inl_13: {
                                _inl_13_result = ((iy * n_total) + ix);
                                break _inl_13;
                            }
                            const idx_c = _inl_13_result;
                            let _inl_14_result;
                            _inl_14: {
                                let _inl_14__inl_6_result;
                                _inl_14__inl_6: {
                                    let _inl_14__inl_6__inl_0_result;
                                    _inl_14__inl_6__inl_0: {
                                        _inl_14__inl_6__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_14__inl_6__inl_0;
                                    }
                                    _inl_14__inl_6_result = _inl_14__inl_6__inl_0_result;
                                    break _inl_14__inl_6;
                                }
                                let _inl_14__inl_7_result;
                                _inl_14__inl_7: {
                                    const _inl_14__inl_7__inl_1_ix = (ix + 1);
                                    let _inl_14__inl_7__inl_1_result;
                                    _inl_14__inl_7__inl_1: {
                                        _inl_14__inl_7__inl_1_result = ((iy * ((n_total + 1))) + _inl_14__inl_7__inl_1_ix);
                                        break _inl_14__inl_7__inl_1;
                                    }
                                    _inl_14__inl_7_result = _inl_14__inl_7__inl_1_result;
                                    break _inl_14__inl_7;
                                }
                                _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_6_result] + _b_Bx_face[_inl_14__inl_7_result])));
                                break _inl_14;
                            }
                            const bx_c = _inl_14_result;
                            let _inl_15_result;
                            _inl_15: {
                                let _inl_15__inl_8_result;
                                _inl_15__inl_8: {
                                    let _inl_15__inl_8__inl_2_result;
                                    _inl_15__inl_8__inl_2: {
                                        _inl_15__inl_8__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_15__inl_8__inl_2;
                                    }
                                    _inl_15__inl_8_result = _inl_15__inl_8__inl_2_result;
                                    break _inl_15__inl_8;
                                }
                                let _inl_15__inl_9_result;
                                _inl_15__inl_9: {
                                    const _inl_15__inl_9__inl_3_iy = (iy + 1);
                                    let _inl_15__inl_9__inl_3_result;
                                    _inl_15__inl_9__inl_3: {
                                        _inl_15__inl_9__inl_3_result = ((_inl_15__inl_9__inl_3_iy * n_total) + ix);
                                        break _inl_15__inl_9__inl_3;
                                    }
                                    _inl_15__inl_9_result = _inl_15__inl_9__inl_3_result;
                                    break _inl_15__inl_9;
                                }
                                _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_8_result] + _b_By_face[_inl_15__inl_9_result])));
                                break _inl_15;
                            }
                            const by_c = _inl_15_result;
                            const _sroa_4_base = ((idx_c) * 4 + 0);
                            const U0_x = _b_U0_in[_sroa_4_base + 0];
                            const U0_y = _b_U0_in[_sroa_4_base + 1];
                            const U0_z = _b_U0_in[_sroa_4_base + 2];
                            const U0_w = _b_U0_in[_sroa_4_base + 3];
                            const _sroa_5_base = ((idx_c) * 4 + 0);
                            const U1_x = _b_U1_in[_sroa_5_base + 0];
                            const U1_y = _b_U1_in[_sroa_5_base + 1];
                            const U1_z = _b_U1_in[_sroa_5_base + 2];
                            const U1_w = _b_U1_in[_sroa_5_base + 3];
                            const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
                            const mode = 2;
                            let v = 0.0;
                            {
                                const vx = (U0_y / rho);
                                const vy = (U0_z / rho);
                                const vz = (U0_w / rho);
                                v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                            }
                            _b_field[idx_c] = v;
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
                        const n_interior = 256;
                        const n_total = 260;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + ix);
                            break _inl_13;
                        }
                        const idx_c = _inl_13_result;
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_6_result;
                            _inl_14__inl_6: {
                                let _inl_14__inl_6__inl_0_result;
                                _inl_14__inl_6__inl_0: {
                                    _inl_14__inl_6__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_14__inl_6__inl_0;
                                }
                                _inl_14__inl_6_result = _inl_14__inl_6__inl_0_result;
                                break _inl_14__inl_6;
                            }
                            let _inl_14__inl_7_result;
                            _inl_14__inl_7: {
                                const _inl_14__inl_7__inl_1_ix = (ix + 1);
                                let _inl_14__inl_7__inl_1_result;
                                _inl_14__inl_7__inl_1: {
                                    _inl_14__inl_7__inl_1_result = ((iy * ((n_total + 1))) + _inl_14__inl_7__inl_1_ix);
                                    break _inl_14__inl_7__inl_1;
                                }
                                _inl_14__inl_7_result = _inl_14__inl_7__inl_1_result;
                                break _inl_14__inl_7;
                            }
                            _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_6_result] + _b_Bx_face[_inl_14__inl_7_result])));
                            break _inl_14;
                        }
                        const bx_c = _inl_14_result;
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_8_result;
                            _inl_15__inl_8: {
                                let _inl_15__inl_8__inl_2_result;
                                _inl_15__inl_8__inl_2: {
                                    _inl_15__inl_8__inl_2_result = ((iy * n_total) + ix);
                                    break _inl_15__inl_8__inl_2;
                                }
                                _inl_15__inl_8_result = _inl_15__inl_8__inl_2_result;
                                break _inl_15__inl_8;
                            }
                            let _inl_15__inl_9_result;
                            _inl_15__inl_9: {
                                const _inl_15__inl_9__inl_3_iy = (iy + 1);
                                let _inl_15__inl_9__inl_3_result;
                                _inl_15__inl_9__inl_3: {
                                    _inl_15__inl_9__inl_3_result = ((_inl_15__inl_9__inl_3_iy * n_total) + ix);
                                    break _inl_15__inl_9__inl_3;
                                }
                                _inl_15__inl_9_result = _inl_15__inl_9__inl_3_result;
                                break _inl_15__inl_9;
                            }
                            _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_8_result] + _b_By_face[_inl_15__inl_9_result])));
                            break _inl_15;
                        }
                        const by_c = _inl_15_result;
                        const _sroa_6_base = ((idx_c) * 4 + 0);
                        const U0_x = _b_U0_in[_sroa_6_base + 0];
                        const U0_y = _b_U0_in[_sroa_6_base + 1];
                        const U0_z = _b_U0_in[_sroa_6_base + 2];
                        const U0_w = _b_U0_in[_sroa_6_base + 3];
                        const _sroa_7_base = ((idx_c) * 4 + 0);
                        const U1_x = _b_U1_in[_sroa_7_base + 0];
                        const U1_y = _b_U1_in[_sroa_7_base + 1];
                        const U1_z = _b_U1_in[_sroa_7_base + 2];
                        const U1_w = _b_U1_in[_sroa_7_base + 3];
                        const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
                        const mode = 2;
                        let v = 0.0;
                        {
                            const vx = (U0_y / rho);
                            const vy = (U0_z / rho);
                            const vz = (U0_w / rho);
                            v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                        }
                        _b_field[idx_c] = v;
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
                    const n_interior = 256;
                    const n_total = 260;
                    const ghost = 2;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + ix);
                        break _inl_13;
                    }
                    const idx_c = _inl_13_result;
                    let _inl_14_result;
                    _inl_14: {
                        let _inl_14__inl_6_result;
                        _inl_14__inl_6: {
                            let _inl_14__inl_6__inl_0_result;
                            _inl_14__inl_6__inl_0: {
                                _inl_14__inl_6__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_14__inl_6__inl_0;
                            }
                            _inl_14__inl_6_result = _inl_14__inl_6__inl_0_result;
                            break _inl_14__inl_6;
                        }
                        let _inl_14__inl_7_result;
                        _inl_14__inl_7: {
                            const _inl_14__inl_7__inl_1_ix = (ix + 1);
                            let _inl_14__inl_7__inl_1_result;
                            _inl_14__inl_7__inl_1: {
                                _inl_14__inl_7__inl_1_result = ((iy * ((n_total + 1))) + _inl_14__inl_7__inl_1_ix);
                                break _inl_14__inl_7__inl_1;
                            }
                            _inl_14__inl_7_result = _inl_14__inl_7__inl_1_result;
                            break _inl_14__inl_7;
                        }
                        _inl_14_result = (0.5 * ((_b_Bx_face[_inl_14__inl_6_result] + _b_Bx_face[_inl_14__inl_7_result])));
                        break _inl_14;
                    }
                    const bx_c = _inl_14_result;
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_8_result;
                        _inl_15__inl_8: {
                            let _inl_15__inl_8__inl_2_result;
                            _inl_15__inl_8__inl_2: {
                                _inl_15__inl_8__inl_2_result = ((iy * n_total) + ix);
                                break _inl_15__inl_8__inl_2;
                            }
                            _inl_15__inl_8_result = _inl_15__inl_8__inl_2_result;
                            break _inl_15__inl_8;
                        }
                        let _inl_15__inl_9_result;
                        _inl_15__inl_9: {
                            const _inl_15__inl_9__inl_3_iy = (iy + 1);
                            let _inl_15__inl_9__inl_3_result;
                            _inl_15__inl_9__inl_3: {
                                _inl_15__inl_9__inl_3_result = ((_inl_15__inl_9__inl_3_iy * n_total) + ix);
                                break _inl_15__inl_9__inl_3;
                            }
                            _inl_15__inl_9_result = _inl_15__inl_9__inl_3_result;
                            break _inl_15__inl_9;
                        }
                        _inl_15_result = (0.5 * ((_b_By_face[_inl_15__inl_8_result] + _b_By_face[_inl_15__inl_9_result])));
                        break _inl_15;
                    }
                    const by_c = _inl_15_result;
                    const _sroa_8_base = ((idx_c) * 4 + 0);
                    const U0_x = _b_U0_in[_sroa_8_base + 0];
                    const U0_y = _b_U0_in[_sroa_8_base + 1];
                    const U0_z = _b_U0_in[_sroa_8_base + 2];
                    const U0_w = _b_U0_in[_sroa_8_base + 3];
                    const _sroa_9_base = ((idx_c) * 4 + 0);
                    const U1_x = _b_U1_in[_sroa_9_base + 0];
                    const U1_y = _b_U1_in[_sroa_9_base + 1];
                    const U1_z = _b_U1_in[_sroa_9_base + 2];
                    const U1_w = _b_U1_in[_sroa_9_base + 3];
                    const rho = ((U0_x) < (1.0e-6) ? (1.0e-6) : (U0_x));
                    const mode = 2;
                    let v = 0.0;
                    {
                        const vx = (U0_y / rho);
                        const vy = (U0_z / rho);
                        const vz = (U0_w / rho);
                        v = Math.sqrt((((vx * vx) + (vy * vy)) + (vz * vz)));
                    }
                    _b_field[idx_c] = v;
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

    return { entry, bind, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","field","phi"], entryInfo };
}
