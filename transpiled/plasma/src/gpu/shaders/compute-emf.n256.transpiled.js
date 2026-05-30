// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/compute-emf.wgsl
// wgsl-variant: n256
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: b55fdb2a41c2bfb85552144e8005bfac5210c8dd1d76781d28b818aaeb76f926
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"U_uniforms":{"grid_n":256,"grid_n_total":260,"ghost_w":2}},"fixedWorkgroups":[33,33,1]}
// wgsl-metrics: {"bytes":66930,"lines":1103,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.536Z
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

    function ez_edge_idx(ix, iy, n_total) {
        return ((iy * ((n_total + 1))) + ix);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const Wx = 33, Wy = 33, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_emf_mode = _b_U_uniforms.emf_mode;
        const _b_flux_x_1 = bindings.flux_x_1;
        const _b_flux_y_1 = bindings.flux_y_1;
        const _b_Ez_edge = bindings.Ez_edge;
        const _b_U0 = bindings.U0;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = (256 + 1);
        const __clipYBound = (256 + 1);
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
                        const extent = (n_interior + 1);
                        const ix = (ghost + gid_x);
                        const iy = (ghost + gid_y);
                        const _inl_11_iy = (iy - 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((_inl_11_iy * n_total) + ix);
                            break _inl_11;
                        }
                        const _sroa_0_base = ((_inl_11_result) * 4 + 0);
                        const fxl_x = _b_flux_x_1[_sroa_0_base + 0];
                        const fxl_y = _b_flux_x_1[_sroa_0_base + 1];
                        const fxl_z = _b_flux_x_1[_sroa_0_base + 2];
                        const fxl_w = _b_flux_x_1[_sroa_0_base + 3];
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * n_total) + ix);
                            break _inl_12;
                        }
                        const _sroa_1_base = ((_inl_12_result) * 4 + 0);
                        const fxh_x = _b_flux_x_1[_sroa_1_base + 0];
                        const fxh_y = _b_flux_x_1[_sroa_1_base + 1];
                        const fxh_z = _b_flux_x_1[_sroa_1_base + 2];
                        const fxh_w = _b_flux_x_1[_sroa_1_base + 3];
                        const _inl_13_ix = (ix - 1);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + _inl_13_ix);
                            break _inl_13;
                        }
                        const _sroa_2_base = ((_inl_13_result) * 4 + 0);
                        const fyl_x = _b_flux_y_1[_sroa_2_base + 0];
                        const fyl_y = _b_flux_y_1[_sroa_2_base + 1];
                        const fyl_z = _b_flux_y_1[_sroa_2_base + 2];
                        const fyl_w = _b_flux_y_1[_sroa_2_base + 3];
                        let _inl_14_result;
                        _inl_14: {
                            _inl_14_result = ((iy * n_total) + ix);
                            break _inl_14;
                        }
                        const _sroa_3_base = ((_inl_14_result) * 4 + 0);
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
                        const _inl_15_ix = (ix - 1);
                        const _inl_15_iy = (iy - 1);
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_6_result;
                            _inl_15__inl_6: {
                                _inl_15__inl_6_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_6;
                            }
                            const _sroa_4_base = ((_inl_15__inl_6_result) * 4 + 0);
                            const _inl_15_u0_x = _b_U0[_sroa_4_base + 0];
                            const _inl_15_u0_y = _b_U0[_sroa_4_base + 1];
                            const _inl_15_u0_z = _b_U0[_sroa_4_base + 2];
                            const _inl_15_u0_w = _b_U0[_sroa_4_base + 3];
                            const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                            const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                            const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                            let _inl_15__inl_7_result;
                            _inl_15__inl_7: {
                                _inl_15__inl_7_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15_ix);
                                break _inl_15__inl_7;
                            }
                            const _inl_15__inl_8_ix = (_inl_15_ix + 1);
                            let _inl_15__inl_8_result;
                            _inl_15__inl_8: {
                                _inl_15__inl_8_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15__inl_8_ix);
                                break _inl_15__inl_8;
                            }
                            const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_7_result] + _b_Bx_face[_inl_15__inl_8_result])));
                            let _inl_15__inl_9_result;
                            _inl_15__inl_9: {
                                _inl_15__inl_9_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_9;
                            }
                            const _inl_15__inl_10_iy = (_inl_15_iy + 1);
                            let _inl_15__inl_10_result;
                            _inl_15__inl_10: {
                                _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_10;
                            }
                            const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                            _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                            break _inl_15;
                        }
                        const ez_sw = _inl_15_result;
                        const _inl_16_iy = (iy - 1);
                        let _inl_16_result;
                        _inl_16: {
                            let _inl_16__inl_6_result;
                            _inl_16__inl_6: {
                                _inl_16__inl_6_result = ((_inl_16_iy * n_total) + ix);
                                break _inl_16__inl_6;
                            }
                            const _sroa_5_base = ((_inl_16__inl_6_result) * 4 + 0);
                            const _inl_16_u0_x = _b_U0[_sroa_5_base + 0];
                            const _inl_16_u0_y = _b_U0[_sroa_5_base + 1];
                            const _inl_16_u0_z = _b_U0[_sroa_5_base + 2];
                            const _inl_16_u0_w = _b_U0[_sroa_5_base + 3];
                            const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                            const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                            const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                            let _inl_16__inl_7_result;
                            _inl_16__inl_7: {
                                _inl_16__inl_7_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                                break _inl_16__inl_7;
                            }
                            const _inl_16__inl_8_ix = (ix + 1);
                            let _inl_16__inl_8_result;
                            _inl_16__inl_8: {
                                _inl_16__inl_8_result = ((_inl_16_iy * ((n_total + 1))) + _inl_16__inl_8_ix);
                                break _inl_16__inl_8;
                            }
                            const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_7_result] + _b_Bx_face[_inl_16__inl_8_result])));
                            let _inl_16__inl_9_result;
                            _inl_16__inl_9: {
                                _inl_16__inl_9_result = ((_inl_16_iy * n_total) + ix);
                                break _inl_16__inl_9;
                            }
                            const _inl_16__inl_10_iy = (_inl_16_iy + 1);
                            let _inl_16__inl_10_result;
                            _inl_16__inl_10: {
                                _inl_16__inl_10_result = ((_inl_16__inl_10_iy * n_total) + ix);
                                break _inl_16__inl_10;
                            }
                            const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_9_result] + _b_By_face[_inl_16__inl_10_result])));
                            _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                            break _inl_16;
                        }
                        const ez_se = _inl_16_result;
                        const _inl_17_ix = (ix - 1);
                        let _inl_17_result;
                        _inl_17: {
                            let _inl_17__inl_6_result;
                            _inl_17__inl_6: {
                                _inl_17__inl_6_result = ((iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_6;
                            }
                            const _sroa_6_base = ((_inl_17__inl_6_result) * 4 + 0);
                            const _inl_17_u0_x = _b_U0[_sroa_6_base + 0];
                            const _inl_17_u0_y = _b_U0[_sroa_6_base + 1];
                            const _inl_17_u0_z = _b_U0[_sroa_6_base + 2];
                            const _inl_17_u0_w = _b_U0[_sroa_6_base + 3];
                            const _inl_17_rho = ((_inl_17_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_17_u0_x));
                            const _inl_17_vx = (_inl_17_u0_y / _inl_17_rho);
                            const _inl_17_vy = (_inl_17_u0_z / _inl_17_rho);
                            let _inl_17__inl_7_result;
                            _inl_17__inl_7: {
                                _inl_17__inl_7_result = ((iy * ((n_total + 1))) + _inl_17_ix);
                                break _inl_17__inl_7;
                            }
                            const _inl_17__inl_8_ix = (_inl_17_ix + 1);
                            let _inl_17__inl_8_result;
                            _inl_17__inl_8: {
                                _inl_17__inl_8_result = ((iy * ((n_total + 1))) + _inl_17__inl_8_ix);
                                break _inl_17__inl_8;
                            }
                            const _inl_17_bx = (0.5 * ((_b_Bx_face[_inl_17__inl_7_result] + _b_Bx_face[_inl_17__inl_8_result])));
                            let _inl_17__inl_9_result;
                            _inl_17__inl_9: {
                                _inl_17__inl_9_result = ((iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_9;
                            }
                            const _inl_17__inl_10_iy = (iy + 1);
                            let _inl_17__inl_10_result;
                            _inl_17__inl_10: {
                                _inl_17__inl_10_result = ((_inl_17__inl_10_iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_10;
                            }
                            const _inl_17_by = (0.5 * ((_b_By_face[_inl_17__inl_9_result] + _b_By_face[_inl_17__inl_10_result])));
                            _inl_17_result = ((_inl_17_vy * _inl_17_bx) - (_inl_17_vx * _inl_17_by));
                            break _inl_17;
                        }
                        const ez_nw = _inl_17_result;
                        let _inl_18_result;
                        _inl_18: {
                            let _inl_18__inl_6_result;
                            _inl_18__inl_6: {
                                _inl_18__inl_6_result = ((iy * n_total) + ix);
                                break _inl_18__inl_6;
                            }
                            const _sroa_7_base = ((_inl_18__inl_6_result) * 4 + 0);
                            const _inl_18_u0_x = _b_U0[_sroa_7_base + 0];
                            const _inl_18_u0_y = _b_U0[_sroa_7_base + 1];
                            const _inl_18_u0_z = _b_U0[_sroa_7_base + 2];
                            const _inl_18_u0_w = _b_U0[_sroa_7_base + 3];
                            const _inl_18_rho = ((_inl_18_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_u0_x));
                            const _inl_18_vx = (_inl_18_u0_y / _inl_18_rho);
                            const _inl_18_vy = (_inl_18_u0_z / _inl_18_rho);
                            let _inl_18__inl_7_result;
                            _inl_18__inl_7: {
                                _inl_18__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_18__inl_7;
                            }
                            const _inl_18__inl_8_ix = (ix + 1);
                            let _inl_18__inl_8_result;
                            _inl_18__inl_8: {
                                _inl_18__inl_8_result = ((iy * ((n_total + 1))) + _inl_18__inl_8_ix);
                                break _inl_18__inl_8;
                            }
                            const _inl_18_bx = (0.5 * ((_b_Bx_face[_inl_18__inl_7_result] + _b_Bx_face[_inl_18__inl_8_result])));
                            let _inl_18__inl_9_result;
                            _inl_18__inl_9: {
                                _inl_18__inl_9_result = ((iy * n_total) + ix);
                                break _inl_18__inl_9;
                            }
                            const _inl_18__inl_10_iy = (iy + 1);
                            let _inl_18__inl_10_result;
                            _inl_18__inl_10: {
                                _inl_18__inl_10_result = ((_inl_18__inl_10_iy * n_total) + ix);
                                break _inl_18__inl_10;
                            }
                            const _inl_18_by = (0.5 * ((_b_By_face[_inl_18__inl_9_result] + _b_By_face[_inl_18__inl_10_result])));
                            _inl_18_result = ((_inl_18_vy * _inl_18_bx) - (_inl_18_vx * _inl_18_by));
                            break _inl_18;
                        }
                        const ez_ne = _inl_18_result;
                        const TOL = 1.0e-12;
                        const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                        const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                        const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                        const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                        const ez_bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                        const ez_up = ((0.5 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri))) - (0.25 * ((((up_lo + up_hi) + up_le) + up_ri))));
                        const _inl_19_flags = _u_U_uniforms_physics_flags;
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = (((_inl_19_flags & FLAG_EMF_UPWIND)) != 0);
                            break _inl_19;
                        }
                        const upwind = (((_u_U_uniforms_emf_mode == 1)) || _inl_19_result);
                        _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = (upwind ? ez_up : ez_bs);
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
                            const extent = (n_interior + 1);
                            const ix = (ghost + gid_x);
                            const iy = (ghost + gid_y);
                            const _inl_11_iy = (iy - 1);
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = ((_inl_11_iy * n_total) + ix);
                                break _inl_11;
                            }
                            const _sroa_8_base = ((_inl_11_result) * 4 + 0);
                            const fxl_x = _b_flux_x_1[_sroa_8_base + 0];
                            const fxl_y = _b_flux_x_1[_sroa_8_base + 1];
                            const fxl_z = _b_flux_x_1[_sroa_8_base + 2];
                            const fxl_w = _b_flux_x_1[_sroa_8_base + 3];
                            let _inl_12_result;
                            _inl_12: {
                                _inl_12_result = ((iy * n_total) + ix);
                                break _inl_12;
                            }
                            const _sroa_9_base = ((_inl_12_result) * 4 + 0);
                            const fxh_x = _b_flux_x_1[_sroa_9_base + 0];
                            const fxh_y = _b_flux_x_1[_sroa_9_base + 1];
                            const fxh_z = _b_flux_x_1[_sroa_9_base + 2];
                            const fxh_w = _b_flux_x_1[_sroa_9_base + 3];
                            const _inl_13_ix = (ix - 1);
                            let _inl_13_result;
                            _inl_13: {
                                _inl_13_result = ((iy * n_total) + _inl_13_ix);
                                break _inl_13;
                            }
                            const _sroa_10_base = ((_inl_13_result) * 4 + 0);
                            const fyl_x = _b_flux_y_1[_sroa_10_base + 0];
                            const fyl_y = _b_flux_y_1[_sroa_10_base + 1];
                            const fyl_z = _b_flux_y_1[_sroa_10_base + 2];
                            const fyl_w = _b_flux_y_1[_sroa_10_base + 3];
                            let _inl_14_result;
                            _inl_14: {
                                _inl_14_result = ((iy * n_total) + ix);
                                break _inl_14;
                            }
                            const _sroa_11_base = ((_inl_14_result) * 4 + 0);
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
                            const _inl_15_ix = (ix - 1);
                            const _inl_15_iy = (iy - 1);
                            let _inl_15_result;
                            _inl_15: {
                                let _inl_15__inl_6_result;
                                _inl_15__inl_6: {
                                    _inl_15__inl_6_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                    break _inl_15__inl_6;
                                }
                                const _sroa_12_base = ((_inl_15__inl_6_result) * 4 + 0);
                                const _inl_15_u0_x = _b_U0[_sroa_12_base + 0];
                                const _inl_15_u0_y = _b_U0[_sroa_12_base + 1];
                                const _inl_15_u0_z = _b_U0[_sroa_12_base + 2];
                                const _inl_15_u0_w = _b_U0[_sroa_12_base + 3];
                                const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                                const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                                const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                                let _inl_15__inl_7_result;
                                _inl_15__inl_7: {
                                    _inl_15__inl_7_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15_ix);
                                    break _inl_15__inl_7;
                                }
                                const _inl_15__inl_8_ix = (_inl_15_ix + 1);
                                let _inl_15__inl_8_result;
                                _inl_15__inl_8: {
                                    _inl_15__inl_8_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15__inl_8_ix);
                                    break _inl_15__inl_8;
                                }
                                const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_7_result] + _b_Bx_face[_inl_15__inl_8_result])));
                                let _inl_15__inl_9_result;
                                _inl_15__inl_9: {
                                    _inl_15__inl_9_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                    break _inl_15__inl_9;
                                }
                                const _inl_15__inl_10_iy = (_inl_15_iy + 1);
                                let _inl_15__inl_10_result;
                                _inl_15__inl_10: {
                                    _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + _inl_15_ix);
                                    break _inl_15__inl_10;
                                }
                                const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                                _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                                break _inl_15;
                            }
                            const ez_sw = _inl_15_result;
                            const _inl_16_iy = (iy - 1);
                            let _inl_16_result;
                            _inl_16: {
                                let _inl_16__inl_6_result;
                                _inl_16__inl_6: {
                                    _inl_16__inl_6_result = ((_inl_16_iy * n_total) + ix);
                                    break _inl_16__inl_6;
                                }
                                const _sroa_13_base = ((_inl_16__inl_6_result) * 4 + 0);
                                const _inl_16_u0_x = _b_U0[_sroa_13_base + 0];
                                const _inl_16_u0_y = _b_U0[_sroa_13_base + 1];
                                const _inl_16_u0_z = _b_U0[_sroa_13_base + 2];
                                const _inl_16_u0_w = _b_U0[_sroa_13_base + 3];
                                const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                                const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                                const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                                let _inl_16__inl_7_result;
                                _inl_16__inl_7: {
                                    _inl_16__inl_7_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                                    break _inl_16__inl_7;
                                }
                                const _inl_16__inl_8_ix = (ix + 1);
                                let _inl_16__inl_8_result;
                                _inl_16__inl_8: {
                                    _inl_16__inl_8_result = ((_inl_16_iy * ((n_total + 1))) + _inl_16__inl_8_ix);
                                    break _inl_16__inl_8;
                                }
                                const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_7_result] + _b_Bx_face[_inl_16__inl_8_result])));
                                let _inl_16__inl_9_result;
                                _inl_16__inl_9: {
                                    _inl_16__inl_9_result = ((_inl_16_iy * n_total) + ix);
                                    break _inl_16__inl_9;
                                }
                                const _inl_16__inl_10_iy = (_inl_16_iy + 1);
                                let _inl_16__inl_10_result;
                                _inl_16__inl_10: {
                                    _inl_16__inl_10_result = ((_inl_16__inl_10_iy * n_total) + ix);
                                    break _inl_16__inl_10;
                                }
                                const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_9_result] + _b_By_face[_inl_16__inl_10_result])));
                                _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                                break _inl_16;
                            }
                            const ez_se = _inl_16_result;
                            const _inl_17_ix = (ix - 1);
                            let _inl_17_result;
                            _inl_17: {
                                let _inl_17__inl_6_result;
                                _inl_17__inl_6: {
                                    _inl_17__inl_6_result = ((iy * n_total) + _inl_17_ix);
                                    break _inl_17__inl_6;
                                }
                                const _sroa_14_base = ((_inl_17__inl_6_result) * 4 + 0);
                                const _inl_17_u0_x = _b_U0[_sroa_14_base + 0];
                                const _inl_17_u0_y = _b_U0[_sroa_14_base + 1];
                                const _inl_17_u0_z = _b_U0[_sroa_14_base + 2];
                                const _inl_17_u0_w = _b_U0[_sroa_14_base + 3];
                                const _inl_17_rho = ((_inl_17_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_17_u0_x));
                                const _inl_17_vx = (_inl_17_u0_y / _inl_17_rho);
                                const _inl_17_vy = (_inl_17_u0_z / _inl_17_rho);
                                let _inl_17__inl_7_result;
                                _inl_17__inl_7: {
                                    _inl_17__inl_7_result = ((iy * ((n_total + 1))) + _inl_17_ix);
                                    break _inl_17__inl_7;
                                }
                                const _inl_17__inl_8_ix = (_inl_17_ix + 1);
                                let _inl_17__inl_8_result;
                                _inl_17__inl_8: {
                                    _inl_17__inl_8_result = ((iy * ((n_total + 1))) + _inl_17__inl_8_ix);
                                    break _inl_17__inl_8;
                                }
                                const _inl_17_bx = (0.5 * ((_b_Bx_face[_inl_17__inl_7_result] + _b_Bx_face[_inl_17__inl_8_result])));
                                let _inl_17__inl_9_result;
                                _inl_17__inl_9: {
                                    _inl_17__inl_9_result = ((iy * n_total) + _inl_17_ix);
                                    break _inl_17__inl_9;
                                }
                                const _inl_17__inl_10_iy = (iy + 1);
                                let _inl_17__inl_10_result;
                                _inl_17__inl_10: {
                                    _inl_17__inl_10_result = ((_inl_17__inl_10_iy * n_total) + _inl_17_ix);
                                    break _inl_17__inl_10;
                                }
                                const _inl_17_by = (0.5 * ((_b_By_face[_inl_17__inl_9_result] + _b_By_face[_inl_17__inl_10_result])));
                                _inl_17_result = ((_inl_17_vy * _inl_17_bx) - (_inl_17_vx * _inl_17_by));
                                break _inl_17;
                            }
                            const ez_nw = _inl_17_result;
                            let _inl_18_result;
                            _inl_18: {
                                let _inl_18__inl_6_result;
                                _inl_18__inl_6: {
                                    _inl_18__inl_6_result = ((iy * n_total) + ix);
                                    break _inl_18__inl_6;
                                }
                                const _sroa_15_base = ((_inl_18__inl_6_result) * 4 + 0);
                                const _inl_18_u0_x = _b_U0[_sroa_15_base + 0];
                                const _inl_18_u0_y = _b_U0[_sroa_15_base + 1];
                                const _inl_18_u0_z = _b_U0[_sroa_15_base + 2];
                                const _inl_18_u0_w = _b_U0[_sroa_15_base + 3];
                                const _inl_18_rho = ((_inl_18_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_u0_x));
                                const _inl_18_vx = (_inl_18_u0_y / _inl_18_rho);
                                const _inl_18_vy = (_inl_18_u0_z / _inl_18_rho);
                                let _inl_18__inl_7_result;
                                _inl_18__inl_7: {
                                    _inl_18__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_18__inl_7;
                                }
                                const _inl_18__inl_8_ix = (ix + 1);
                                let _inl_18__inl_8_result;
                                _inl_18__inl_8: {
                                    _inl_18__inl_8_result = ((iy * ((n_total + 1))) + _inl_18__inl_8_ix);
                                    break _inl_18__inl_8;
                                }
                                const _inl_18_bx = (0.5 * ((_b_Bx_face[_inl_18__inl_7_result] + _b_Bx_face[_inl_18__inl_8_result])));
                                let _inl_18__inl_9_result;
                                _inl_18__inl_9: {
                                    _inl_18__inl_9_result = ((iy * n_total) + ix);
                                    break _inl_18__inl_9;
                                }
                                const _inl_18__inl_10_iy = (iy + 1);
                                let _inl_18__inl_10_result;
                                _inl_18__inl_10: {
                                    _inl_18__inl_10_result = ((_inl_18__inl_10_iy * n_total) + ix);
                                    break _inl_18__inl_10;
                                }
                                const _inl_18_by = (0.5 * ((_b_By_face[_inl_18__inl_9_result] + _b_By_face[_inl_18__inl_10_result])));
                                _inl_18_result = ((_inl_18_vy * _inl_18_bx) - (_inl_18_vx * _inl_18_by));
                                break _inl_18;
                            }
                            const ez_ne = _inl_18_result;
                            const TOL = 1.0e-12;
                            const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                            const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                            const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                            const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                            const ez_bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                            const ez_up = ((0.5 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri))) - (0.25 * ((((up_lo + up_hi) + up_le) + up_ri))));
                            const _inl_19_flags = _u_U_uniforms_physics_flags;
                            let _inl_19_result;
                            _inl_19: {
                                _inl_19_result = (((_inl_19_flags & FLAG_EMF_UPWIND)) != 0);
                                break _inl_19;
                            }
                            const upwind = (((_u_U_uniforms_emf_mode == 1)) || _inl_19_result);
                            _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = (upwind ? ez_up : ez_bs);
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
                        const extent = (n_interior + 1);
                        const ix = (ghost + gid_x);
                        const iy = (ghost + gid_y);
                        const _inl_11_iy = (iy - 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((_inl_11_iy * n_total) + ix);
                            break _inl_11;
                        }
                        const _sroa_16_base = ((_inl_11_result) * 4 + 0);
                        const fxl_x = _b_flux_x_1[_sroa_16_base + 0];
                        const fxl_y = _b_flux_x_1[_sroa_16_base + 1];
                        const fxl_z = _b_flux_x_1[_sroa_16_base + 2];
                        const fxl_w = _b_flux_x_1[_sroa_16_base + 3];
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((iy * n_total) + ix);
                            break _inl_12;
                        }
                        const _sroa_17_base = ((_inl_12_result) * 4 + 0);
                        const fxh_x = _b_flux_x_1[_sroa_17_base + 0];
                        const fxh_y = _b_flux_x_1[_sroa_17_base + 1];
                        const fxh_z = _b_flux_x_1[_sroa_17_base + 2];
                        const fxh_w = _b_flux_x_1[_sroa_17_base + 3];
                        const _inl_13_ix = (ix - 1);
                        let _inl_13_result;
                        _inl_13: {
                            _inl_13_result = ((iy * n_total) + _inl_13_ix);
                            break _inl_13;
                        }
                        const _sroa_18_base = ((_inl_13_result) * 4 + 0);
                        const fyl_x = _b_flux_y_1[_sroa_18_base + 0];
                        const fyl_y = _b_flux_y_1[_sroa_18_base + 1];
                        const fyl_z = _b_flux_y_1[_sroa_18_base + 2];
                        const fyl_w = _b_flux_y_1[_sroa_18_base + 3];
                        let _inl_14_result;
                        _inl_14: {
                            _inl_14_result = ((iy * n_total) + ix);
                            break _inl_14;
                        }
                        const _sroa_19_base = ((_inl_14_result) * 4 + 0);
                        const fyr_x = _b_flux_y_1[_sroa_19_base + 0];
                        const fyr_y = _b_flux_y_1[_sroa_19_base + 1];
                        const fyr_z = _b_flux_y_1[_sroa_19_base + 2];
                        const fyr_w = _b_flux_y_1[_sroa_19_base + 3];
                        const ez_x_lo = (-fxl_z);
                        const ez_x_hi = (-fxh_z);
                        const ez_y_le = fyl_z;
                        const ez_y_ri = fyr_z;
                        const vx_lo = fxl_w;
                        const vx_hi = fxh_w;
                        const vy_le = fyl_w;
                        const vy_ri = fyr_w;
                        const _inl_15_ix = (ix - 1);
                        const _inl_15_iy = (iy - 1);
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_6_result;
                            _inl_15__inl_6: {
                                _inl_15__inl_6_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_6;
                            }
                            const _sroa_20_base = ((_inl_15__inl_6_result) * 4 + 0);
                            const _inl_15_u0_x = _b_U0[_sroa_20_base + 0];
                            const _inl_15_u0_y = _b_U0[_sroa_20_base + 1];
                            const _inl_15_u0_z = _b_U0[_sroa_20_base + 2];
                            const _inl_15_u0_w = _b_U0[_sroa_20_base + 3];
                            const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                            const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                            const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                            let _inl_15__inl_7_result;
                            _inl_15__inl_7: {
                                _inl_15__inl_7_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15_ix);
                                break _inl_15__inl_7;
                            }
                            const _inl_15__inl_8_ix = (_inl_15_ix + 1);
                            let _inl_15__inl_8_result;
                            _inl_15__inl_8: {
                                _inl_15__inl_8_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15__inl_8_ix);
                                break _inl_15__inl_8;
                            }
                            const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_7_result] + _b_Bx_face[_inl_15__inl_8_result])));
                            let _inl_15__inl_9_result;
                            _inl_15__inl_9: {
                                _inl_15__inl_9_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_9;
                            }
                            const _inl_15__inl_10_iy = (_inl_15_iy + 1);
                            let _inl_15__inl_10_result;
                            _inl_15__inl_10: {
                                _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + _inl_15_ix);
                                break _inl_15__inl_10;
                            }
                            const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                            _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                            break _inl_15;
                        }
                        const ez_sw = _inl_15_result;
                        const _inl_16_iy = (iy - 1);
                        let _inl_16_result;
                        _inl_16: {
                            let _inl_16__inl_6_result;
                            _inl_16__inl_6: {
                                _inl_16__inl_6_result = ((_inl_16_iy * n_total) + ix);
                                break _inl_16__inl_6;
                            }
                            const _sroa_21_base = ((_inl_16__inl_6_result) * 4 + 0);
                            const _inl_16_u0_x = _b_U0[_sroa_21_base + 0];
                            const _inl_16_u0_y = _b_U0[_sroa_21_base + 1];
                            const _inl_16_u0_z = _b_U0[_sroa_21_base + 2];
                            const _inl_16_u0_w = _b_U0[_sroa_21_base + 3];
                            const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                            const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                            const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                            let _inl_16__inl_7_result;
                            _inl_16__inl_7: {
                                _inl_16__inl_7_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                                break _inl_16__inl_7;
                            }
                            const _inl_16__inl_8_ix = (ix + 1);
                            let _inl_16__inl_8_result;
                            _inl_16__inl_8: {
                                _inl_16__inl_8_result = ((_inl_16_iy * ((n_total + 1))) + _inl_16__inl_8_ix);
                                break _inl_16__inl_8;
                            }
                            const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_7_result] + _b_Bx_face[_inl_16__inl_8_result])));
                            let _inl_16__inl_9_result;
                            _inl_16__inl_9: {
                                _inl_16__inl_9_result = ((_inl_16_iy * n_total) + ix);
                                break _inl_16__inl_9;
                            }
                            const _inl_16__inl_10_iy = (_inl_16_iy + 1);
                            let _inl_16__inl_10_result;
                            _inl_16__inl_10: {
                                _inl_16__inl_10_result = ((_inl_16__inl_10_iy * n_total) + ix);
                                break _inl_16__inl_10;
                            }
                            const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_9_result] + _b_By_face[_inl_16__inl_10_result])));
                            _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                            break _inl_16;
                        }
                        const ez_se = _inl_16_result;
                        const _inl_17_ix = (ix - 1);
                        let _inl_17_result;
                        _inl_17: {
                            let _inl_17__inl_6_result;
                            _inl_17__inl_6: {
                                _inl_17__inl_6_result = ((iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_6;
                            }
                            const _sroa_22_base = ((_inl_17__inl_6_result) * 4 + 0);
                            const _inl_17_u0_x = _b_U0[_sroa_22_base + 0];
                            const _inl_17_u0_y = _b_U0[_sroa_22_base + 1];
                            const _inl_17_u0_z = _b_U0[_sroa_22_base + 2];
                            const _inl_17_u0_w = _b_U0[_sroa_22_base + 3];
                            const _inl_17_rho = ((_inl_17_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_17_u0_x));
                            const _inl_17_vx = (_inl_17_u0_y / _inl_17_rho);
                            const _inl_17_vy = (_inl_17_u0_z / _inl_17_rho);
                            let _inl_17__inl_7_result;
                            _inl_17__inl_7: {
                                _inl_17__inl_7_result = ((iy * ((n_total + 1))) + _inl_17_ix);
                                break _inl_17__inl_7;
                            }
                            const _inl_17__inl_8_ix = (_inl_17_ix + 1);
                            let _inl_17__inl_8_result;
                            _inl_17__inl_8: {
                                _inl_17__inl_8_result = ((iy * ((n_total + 1))) + _inl_17__inl_8_ix);
                                break _inl_17__inl_8;
                            }
                            const _inl_17_bx = (0.5 * ((_b_Bx_face[_inl_17__inl_7_result] + _b_Bx_face[_inl_17__inl_8_result])));
                            let _inl_17__inl_9_result;
                            _inl_17__inl_9: {
                                _inl_17__inl_9_result = ((iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_9;
                            }
                            const _inl_17__inl_10_iy = (iy + 1);
                            let _inl_17__inl_10_result;
                            _inl_17__inl_10: {
                                _inl_17__inl_10_result = ((_inl_17__inl_10_iy * n_total) + _inl_17_ix);
                                break _inl_17__inl_10;
                            }
                            const _inl_17_by = (0.5 * ((_b_By_face[_inl_17__inl_9_result] + _b_By_face[_inl_17__inl_10_result])));
                            _inl_17_result = ((_inl_17_vy * _inl_17_bx) - (_inl_17_vx * _inl_17_by));
                            break _inl_17;
                        }
                        const ez_nw = _inl_17_result;
                        let _inl_18_result;
                        _inl_18: {
                            let _inl_18__inl_6_result;
                            _inl_18__inl_6: {
                                _inl_18__inl_6_result = ((iy * n_total) + ix);
                                break _inl_18__inl_6;
                            }
                            const _sroa_23_base = ((_inl_18__inl_6_result) * 4 + 0);
                            const _inl_18_u0_x = _b_U0[_sroa_23_base + 0];
                            const _inl_18_u0_y = _b_U0[_sroa_23_base + 1];
                            const _inl_18_u0_z = _b_U0[_sroa_23_base + 2];
                            const _inl_18_u0_w = _b_U0[_sroa_23_base + 3];
                            const _inl_18_rho = ((_inl_18_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_u0_x));
                            const _inl_18_vx = (_inl_18_u0_y / _inl_18_rho);
                            const _inl_18_vy = (_inl_18_u0_z / _inl_18_rho);
                            let _inl_18__inl_7_result;
                            _inl_18__inl_7: {
                                _inl_18__inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_18__inl_7;
                            }
                            const _inl_18__inl_8_ix = (ix + 1);
                            let _inl_18__inl_8_result;
                            _inl_18__inl_8: {
                                _inl_18__inl_8_result = ((iy * ((n_total + 1))) + _inl_18__inl_8_ix);
                                break _inl_18__inl_8;
                            }
                            const _inl_18_bx = (0.5 * ((_b_Bx_face[_inl_18__inl_7_result] + _b_Bx_face[_inl_18__inl_8_result])));
                            let _inl_18__inl_9_result;
                            _inl_18__inl_9: {
                                _inl_18__inl_9_result = ((iy * n_total) + ix);
                                break _inl_18__inl_9;
                            }
                            const _inl_18__inl_10_iy = (iy + 1);
                            let _inl_18__inl_10_result;
                            _inl_18__inl_10: {
                                _inl_18__inl_10_result = ((_inl_18__inl_10_iy * n_total) + ix);
                                break _inl_18__inl_10;
                            }
                            const _inl_18_by = (0.5 * ((_b_By_face[_inl_18__inl_9_result] + _b_By_face[_inl_18__inl_10_result])));
                            _inl_18_result = ((_inl_18_vy * _inl_18_bx) - (_inl_18_vx * _inl_18_by));
                            break _inl_18;
                        }
                        const ez_ne = _inl_18_result;
                        const TOL = 1.0e-12;
                        const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                        const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                        const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                        const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                        const ez_bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                        const ez_up = ((0.5 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri))) - (0.25 * ((((up_lo + up_hi) + up_le) + up_ri))));
                        const _inl_19_flags = _u_U_uniforms_physics_flags;
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = (((_inl_19_flags & FLAG_EMF_UPWIND)) != 0);
                            break _inl_19;
                        }
                        const upwind = (((_u_U_uniforms_emf_mode == 1)) || _inl_19_result);
                        _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = (upwind ? ez_up : ez_bs);
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
                    const extent = (n_interior + 1);
                    const ix = (ghost + gid_x);
                    const iy = (ghost + gid_y);
                    const _inl_11_iy = (iy - 1);
                    let _inl_11_result;
                    _inl_11: {
                        _inl_11_result = ((_inl_11_iy * n_total) + ix);
                        break _inl_11;
                    }
                    const _sroa_24_base = ((_inl_11_result) * 4 + 0);
                    const fxl_x = _b_flux_x_1[_sroa_24_base + 0];
                    const fxl_y = _b_flux_x_1[_sroa_24_base + 1];
                    const fxl_z = _b_flux_x_1[_sroa_24_base + 2];
                    const fxl_w = _b_flux_x_1[_sroa_24_base + 3];
                    let _inl_12_result;
                    _inl_12: {
                        _inl_12_result = ((iy * n_total) + ix);
                        break _inl_12;
                    }
                    const _sroa_25_base = ((_inl_12_result) * 4 + 0);
                    const fxh_x = _b_flux_x_1[_sroa_25_base + 0];
                    const fxh_y = _b_flux_x_1[_sroa_25_base + 1];
                    const fxh_z = _b_flux_x_1[_sroa_25_base + 2];
                    const fxh_w = _b_flux_x_1[_sroa_25_base + 3];
                    const _inl_13_ix = (ix - 1);
                    let _inl_13_result;
                    _inl_13: {
                        _inl_13_result = ((iy * n_total) + _inl_13_ix);
                        break _inl_13;
                    }
                    const _sroa_26_base = ((_inl_13_result) * 4 + 0);
                    const fyl_x = _b_flux_y_1[_sroa_26_base + 0];
                    const fyl_y = _b_flux_y_1[_sroa_26_base + 1];
                    const fyl_z = _b_flux_y_1[_sroa_26_base + 2];
                    const fyl_w = _b_flux_y_1[_sroa_26_base + 3];
                    let _inl_14_result;
                    _inl_14: {
                        _inl_14_result = ((iy * n_total) + ix);
                        break _inl_14;
                    }
                    const _sroa_27_base = ((_inl_14_result) * 4 + 0);
                    const fyr_x = _b_flux_y_1[_sroa_27_base + 0];
                    const fyr_y = _b_flux_y_1[_sroa_27_base + 1];
                    const fyr_z = _b_flux_y_1[_sroa_27_base + 2];
                    const fyr_w = _b_flux_y_1[_sroa_27_base + 3];
                    const ez_x_lo = (-fxl_z);
                    const ez_x_hi = (-fxh_z);
                    const ez_y_le = fyl_z;
                    const ez_y_ri = fyr_z;
                    const vx_lo = fxl_w;
                    const vx_hi = fxh_w;
                    const vy_le = fyl_w;
                    const vy_ri = fyr_w;
                    const _inl_15_ix = (ix - 1);
                    const _inl_15_iy = (iy - 1);
                    let _inl_15_result;
                    _inl_15: {
                        let _inl_15__inl_6_result;
                        _inl_15__inl_6: {
                            _inl_15__inl_6_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_6;
                        }
                        const _sroa_28_base = ((_inl_15__inl_6_result) * 4 + 0);
                        const _inl_15_u0_x = _b_U0[_sroa_28_base + 0];
                        const _inl_15_u0_y = _b_U0[_sroa_28_base + 1];
                        const _inl_15_u0_z = _b_U0[_sroa_28_base + 2];
                        const _inl_15_u0_w = _b_U0[_sroa_28_base + 3];
                        const _inl_15_rho = ((_inl_15_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_15_u0_x));
                        const _inl_15_vx = (_inl_15_u0_y / _inl_15_rho);
                        const _inl_15_vy = (_inl_15_u0_z / _inl_15_rho);
                        let _inl_15__inl_7_result;
                        _inl_15__inl_7: {
                            _inl_15__inl_7_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15_ix);
                            break _inl_15__inl_7;
                        }
                        const _inl_15__inl_8_ix = (_inl_15_ix + 1);
                        let _inl_15__inl_8_result;
                        _inl_15__inl_8: {
                            _inl_15__inl_8_result = ((_inl_15_iy * ((n_total + 1))) + _inl_15__inl_8_ix);
                            break _inl_15__inl_8;
                        }
                        const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_7_result] + _b_Bx_face[_inl_15__inl_8_result])));
                        let _inl_15__inl_9_result;
                        _inl_15__inl_9: {
                            _inl_15__inl_9_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_9;
                        }
                        const _inl_15__inl_10_iy = (_inl_15_iy + 1);
                        let _inl_15__inl_10_result;
                        _inl_15__inl_10: {
                            _inl_15__inl_10_result = ((_inl_15__inl_10_iy * n_total) + _inl_15_ix);
                            break _inl_15__inl_10;
                        }
                        const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_9_result] + _b_By_face[_inl_15__inl_10_result])));
                        _inl_15_result = ((_inl_15_vy * _inl_15_bx) - (_inl_15_vx * _inl_15_by));
                        break _inl_15;
                    }
                    const ez_sw = _inl_15_result;
                    const _inl_16_iy = (iy - 1);
                    let _inl_16_result;
                    _inl_16: {
                        let _inl_16__inl_6_result;
                        _inl_16__inl_6: {
                            _inl_16__inl_6_result = ((_inl_16_iy * n_total) + ix);
                            break _inl_16__inl_6;
                        }
                        const _sroa_29_base = ((_inl_16__inl_6_result) * 4 + 0);
                        const _inl_16_u0_x = _b_U0[_sroa_29_base + 0];
                        const _inl_16_u0_y = _b_U0[_sroa_29_base + 1];
                        const _inl_16_u0_z = _b_U0[_sroa_29_base + 2];
                        const _inl_16_u0_w = _b_U0[_sroa_29_base + 3];
                        const _inl_16_rho = ((_inl_16_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_16_u0_x));
                        const _inl_16_vx = (_inl_16_u0_y / _inl_16_rho);
                        const _inl_16_vy = (_inl_16_u0_z / _inl_16_rho);
                        let _inl_16__inl_7_result;
                        _inl_16__inl_7: {
                            _inl_16__inl_7_result = ((_inl_16_iy * ((n_total + 1))) + ix);
                            break _inl_16__inl_7;
                        }
                        const _inl_16__inl_8_ix = (ix + 1);
                        let _inl_16__inl_8_result;
                        _inl_16__inl_8: {
                            _inl_16__inl_8_result = ((_inl_16_iy * ((n_total + 1))) + _inl_16__inl_8_ix);
                            break _inl_16__inl_8;
                        }
                        const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_7_result] + _b_Bx_face[_inl_16__inl_8_result])));
                        let _inl_16__inl_9_result;
                        _inl_16__inl_9: {
                            _inl_16__inl_9_result = ((_inl_16_iy * n_total) + ix);
                            break _inl_16__inl_9;
                        }
                        const _inl_16__inl_10_iy = (_inl_16_iy + 1);
                        let _inl_16__inl_10_result;
                        _inl_16__inl_10: {
                            _inl_16__inl_10_result = ((_inl_16__inl_10_iy * n_total) + ix);
                            break _inl_16__inl_10;
                        }
                        const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_9_result] + _b_By_face[_inl_16__inl_10_result])));
                        _inl_16_result = ((_inl_16_vy * _inl_16_bx) - (_inl_16_vx * _inl_16_by));
                        break _inl_16;
                    }
                    const ez_se = _inl_16_result;
                    const _inl_17_ix = (ix - 1);
                    let _inl_17_result;
                    _inl_17: {
                        let _inl_17__inl_6_result;
                        _inl_17__inl_6: {
                            _inl_17__inl_6_result = ((iy * n_total) + _inl_17_ix);
                            break _inl_17__inl_6;
                        }
                        const _sroa_30_base = ((_inl_17__inl_6_result) * 4 + 0);
                        const _inl_17_u0_x = _b_U0[_sroa_30_base + 0];
                        const _inl_17_u0_y = _b_U0[_sroa_30_base + 1];
                        const _inl_17_u0_z = _b_U0[_sroa_30_base + 2];
                        const _inl_17_u0_w = _b_U0[_sroa_30_base + 3];
                        const _inl_17_rho = ((_inl_17_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_17_u0_x));
                        const _inl_17_vx = (_inl_17_u0_y / _inl_17_rho);
                        const _inl_17_vy = (_inl_17_u0_z / _inl_17_rho);
                        let _inl_17__inl_7_result;
                        _inl_17__inl_7: {
                            _inl_17__inl_7_result = ((iy * ((n_total + 1))) + _inl_17_ix);
                            break _inl_17__inl_7;
                        }
                        const _inl_17__inl_8_ix = (_inl_17_ix + 1);
                        let _inl_17__inl_8_result;
                        _inl_17__inl_8: {
                            _inl_17__inl_8_result = ((iy * ((n_total + 1))) + _inl_17__inl_8_ix);
                            break _inl_17__inl_8;
                        }
                        const _inl_17_bx = (0.5 * ((_b_Bx_face[_inl_17__inl_7_result] + _b_Bx_face[_inl_17__inl_8_result])));
                        let _inl_17__inl_9_result;
                        _inl_17__inl_9: {
                            _inl_17__inl_9_result = ((iy * n_total) + _inl_17_ix);
                            break _inl_17__inl_9;
                        }
                        const _inl_17__inl_10_iy = (iy + 1);
                        let _inl_17__inl_10_result;
                        _inl_17__inl_10: {
                            _inl_17__inl_10_result = ((_inl_17__inl_10_iy * n_total) + _inl_17_ix);
                            break _inl_17__inl_10;
                        }
                        const _inl_17_by = (0.5 * ((_b_By_face[_inl_17__inl_9_result] + _b_By_face[_inl_17__inl_10_result])));
                        _inl_17_result = ((_inl_17_vy * _inl_17_bx) - (_inl_17_vx * _inl_17_by));
                        break _inl_17;
                    }
                    const ez_nw = _inl_17_result;
                    let _inl_18_result;
                    _inl_18: {
                        let _inl_18__inl_6_result;
                        _inl_18__inl_6: {
                            _inl_18__inl_6_result = ((iy * n_total) + ix);
                            break _inl_18__inl_6;
                        }
                        const _sroa_31_base = ((_inl_18__inl_6_result) * 4 + 0);
                        const _inl_18_u0_x = _b_U0[_sroa_31_base + 0];
                        const _inl_18_u0_y = _b_U0[_sroa_31_base + 1];
                        const _inl_18_u0_z = _b_U0[_sroa_31_base + 2];
                        const _inl_18_u0_w = _b_U0[_sroa_31_base + 3];
                        const _inl_18_rho = ((_inl_18_u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_18_u0_x));
                        const _inl_18_vx = (_inl_18_u0_y / _inl_18_rho);
                        const _inl_18_vy = (_inl_18_u0_z / _inl_18_rho);
                        let _inl_18__inl_7_result;
                        _inl_18__inl_7: {
                            _inl_18__inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_18__inl_7;
                        }
                        const _inl_18__inl_8_ix = (ix + 1);
                        let _inl_18__inl_8_result;
                        _inl_18__inl_8: {
                            _inl_18__inl_8_result = ((iy * ((n_total + 1))) + _inl_18__inl_8_ix);
                            break _inl_18__inl_8;
                        }
                        const _inl_18_bx = (0.5 * ((_b_Bx_face[_inl_18__inl_7_result] + _b_Bx_face[_inl_18__inl_8_result])));
                        let _inl_18__inl_9_result;
                        _inl_18__inl_9: {
                            _inl_18__inl_9_result = ((iy * n_total) + ix);
                            break _inl_18__inl_9;
                        }
                        const _inl_18__inl_10_iy = (iy + 1);
                        let _inl_18__inl_10_result;
                        _inl_18__inl_10: {
                            _inl_18__inl_10_result = ((_inl_18__inl_10_iy * n_total) + ix);
                            break _inl_18__inl_10;
                        }
                        const _inl_18_by = (0.5 * ((_b_By_face[_inl_18__inl_9_result] + _b_By_face[_inl_18__inl_10_result])));
                        _inl_18_result = ((_inl_18_vy * _inl_18_bx) - (_inl_18_vx * _inl_18_by));
                        break _inl_18;
                    }
                    const ez_ne = _inl_18_result;
                    const TOL = 1.0e-12;
                    const up_lo = ((vx_lo > TOL) ? ez_sw : ((vx_lo < (-TOL)) ? ez_se : (0.5 * ((ez_sw + ez_se)))));
                    const up_hi = ((vx_hi > TOL) ? ez_nw : ((vx_hi < (-TOL)) ? ez_ne : (0.5 * ((ez_nw + ez_ne)))));
                    const up_le = ((vy_le > TOL) ? ez_sw : ((vy_le < (-TOL)) ? ez_nw : (0.5 * ((ez_sw + ez_nw)))));
                    const up_ri = ((vy_ri > TOL) ? ez_se : ((vy_ri < (-TOL)) ? ez_ne : (0.5 * ((ez_se + ez_ne)))));
                    const ez_bs = (0.25 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri)));
                    const ez_up = ((0.5 * ((((ez_x_lo + ez_x_hi) + ez_y_le) + ez_y_ri))) - (0.25 * ((((up_lo + up_hi) + up_le) + up_ri))));
                    const _inl_19_flags = _u_U_uniforms_physics_flags;
                    let _inl_19_result;
                    _inl_19: {
                        _inl_19_result = (((_inl_19_flags & FLAG_EMF_UPWIND)) != 0);
                        break _inl_19;
                    }
                    const upwind = (((_u_U_uniforms_emf_mode == 1)) || _inl_19_result);
                    _b_Ez_edge[ez_edge_idx(ix, iy, n_total)] = (upwind ? ez_up : ez_bs);
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

    return { entry, bind, bindings: ["U_uniforms","flux_x_1","flux_y_1","Ez_edge","U0","Bx_face","By_face"], entryInfo };
}
