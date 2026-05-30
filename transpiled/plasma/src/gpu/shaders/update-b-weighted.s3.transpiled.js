// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/update-b-weighted.wgsl
// wgsl-variant: s3
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: bb8fc4b486a2a3679faffea11b47a753d4baed6fb1747888aa14b610e6c3a22c
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"stage_params":{"a0":0.3333333333333333,"a1":0.6666666666666666,"dt_w":0.6666666666666666}}}
// wgsl-metrics: {"bytes":21407,"lines":388,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.709Z
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
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_geometry_mode = _b_U_uniforms.geometry_mode;
        const _u_U_uniforms_geometry_r_min = _b_U_uniforms.geometry_r_min;
        const _b_stage_params = bindings.stage_params;
        const _b_Bx_n = bindings.Bx_n;
        const _b_By_n = bindings.By_n;
        const _b_Bx_other = bindings.Bx_other;
        const _b_By_other = bindings.By_other;
        const _b_Ez_edge = bindings.Ez_edge;
        const _b_dt_buf = bindings.dt_buf;
        const _b_Bx_out = bindings.Bx_out;
        const _b_By_out = bindings.By_out;
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
                {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = ((0.6666666666666666 * dt) / dx);
                    const _inl_6_flags = _u_U_uniforms_physics_flags;
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = (((_inl_6_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_6;
                    }
                    const geom_cyl = (_inl_6_result && (_u_U_uniforms_geometry_mode == 1));
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_7;
                        }
                        const dst = _inl_7_result;
                        const _inl_8_iy = (biy + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((_inl_8_iy * ((n_total + 1))) + bix);
                            break _inl_8;
                        }
                        const ez_top = _b_Ez_edge[_inl_8_result];
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_9;
                        }
                        const ez_bot = _b_Ez_edge[_inl_9_result];
                        _b_Bx_out[dst] = (((0.3333333333333333 * _b_Bx_n[dst]) + (0.6666666666666666 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                    }
                    if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((biy * n_total) + bix);
                            break _inl_10;
                        }
                        const dst = _inl_10_result;
                        const _inl_11_ix = (bix + 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((biy * ((n_total + 1))) + _inl_11_ix);
                            break _inl_11;
                        }
                        const ez_rgt = _b_Ez_edge[_inl_11_result];
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_12;
                        }
                        const ez_lft = _b_Ez_edge[_inl_12_result];
                        let curl_e = (ez_rgt - ez_lft);
                        if (geom_cyl) {
                            const r_l = (((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))));
                            const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))));
                            const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))));
                            curl_e = ((((r_r * ez_rgt) - (r_l * ez_lft))) / r_c);
                        }
                        _b_By_out[dst] = (((0.3333333333333333 * _b_By_n[dst]) + (0.6666666666666666 * _b_By_other[dst])) + (coef * curl_e));
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const dx = _u_U_uniforms_dx;
                            const dt = _b_dt_buf[0];
                            const coef = ((0.6666666666666666 * dt) / dx);
                            const _inl_6_flags = _u_U_uniforms_physics_flags;
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = (((_inl_6_flags & FLAG_GEOMETRY)) != 0);
                                break _inl_6;
                            }
                            const geom_cyl = (_inl_6_result && (_u_U_uniforms_geometry_mode == 1));
                            const ix = gid_x;
                            const iy = gid_y;
                            if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                                const bix = (ix + ghost);
                                const biy = (iy + ghost);
                                let _inl_7_result;
                                _inl_7: {
                                    _inl_7_result = ((biy * ((n_total + 1))) + bix);
                                    break _inl_7;
                                }
                                const dst = _inl_7_result;
                                const _inl_8_iy = (biy + 1);
                                let _inl_8_result;
                                _inl_8: {
                                    _inl_8_result = ((_inl_8_iy * ((n_total + 1))) + bix);
                                    break _inl_8;
                                }
                                const ez_top = _b_Ez_edge[_inl_8_result];
                                let _inl_9_result;
                                _inl_9: {
                                    _inl_9_result = ((biy * ((n_total + 1))) + bix);
                                    break _inl_9;
                                }
                                const ez_bot = _b_Ez_edge[_inl_9_result];
                                _b_Bx_out[dst] = (((0.3333333333333333 * _b_Bx_n[dst]) + (0.6666666666666666 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                            }
                            if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                                const bix = (ix + ghost);
                                const biy = (iy + ghost);
                                let _inl_10_result;
                                _inl_10: {
                                    _inl_10_result = ((biy * n_total) + bix);
                                    break _inl_10;
                                }
                                const dst = _inl_10_result;
                                const _inl_11_ix = (bix + 1);
                                let _inl_11_result;
                                _inl_11: {
                                    _inl_11_result = ((biy * ((n_total + 1))) + _inl_11_ix);
                                    break _inl_11;
                                }
                                const ez_rgt = _b_Ez_edge[_inl_11_result];
                                let _inl_12_result;
                                _inl_12: {
                                    _inl_12_result = ((biy * ((n_total + 1))) + bix);
                                    break _inl_12;
                                }
                                const ez_lft = _b_Ez_edge[_inl_12_result];
                                let curl_e = (ez_rgt - ez_lft);
                                if (geom_cyl) {
                                    const r_l = (((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))));
                                    const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))));
                                    const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))));
                                    curl_e = ((((r_r * ez_rgt) - (r_l * ez_lft))) / r_c);
                                }
                                _b_By_out[dst] = (((0.3333333333333333 * _b_By_n[dst]) + (0.6666666666666666 * _b_By_other[dst])) + (coef * curl_e));
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    {
                        const n_interior = _u_U_uniforms_grid_n;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const dx = _u_U_uniforms_dx;
                        const dt = _b_dt_buf[0];
                        const coef = ((0.6666666666666666 * dt) / dx);
                        const _inl_6_flags = _u_U_uniforms_physics_flags;
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = (((_inl_6_flags & FLAG_GEOMETRY)) != 0);
                            break _inl_6;
                        }
                        const geom_cyl = (_inl_6_result && (_u_U_uniforms_geometry_mode == 1));
                        const ix = gid_x;
                        const iy = gid_y;
                        if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                            const bix = (ix + ghost);
                            const biy = (iy + ghost);
                            let _inl_7_result;
                            _inl_7: {
                                _inl_7_result = ((biy * ((n_total + 1))) + bix);
                                break _inl_7;
                            }
                            const dst = _inl_7_result;
                            const _inl_8_iy = (biy + 1);
                            let _inl_8_result;
                            _inl_8: {
                                _inl_8_result = ((_inl_8_iy * ((n_total + 1))) + bix);
                                break _inl_8;
                            }
                            const ez_top = _b_Ez_edge[_inl_8_result];
                            let _inl_9_result;
                            _inl_9: {
                                _inl_9_result = ((biy * ((n_total + 1))) + bix);
                                break _inl_9;
                            }
                            const ez_bot = _b_Ez_edge[_inl_9_result];
                            _b_Bx_out[dst] = (((0.3333333333333333 * _b_Bx_n[dst]) + (0.6666666666666666 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                        }
                        if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                            const bix = (ix + ghost);
                            const biy = (iy + ghost);
                            let _inl_10_result;
                            _inl_10: {
                                _inl_10_result = ((biy * n_total) + bix);
                                break _inl_10;
                            }
                            const dst = _inl_10_result;
                            const _inl_11_ix = (bix + 1);
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = ((biy * ((n_total + 1))) + _inl_11_ix);
                                break _inl_11;
                            }
                            const ez_rgt = _b_Ez_edge[_inl_11_result];
                            let _inl_12_result;
                            _inl_12: {
                                _inl_12_result = ((biy * ((n_total + 1))) + bix);
                                break _inl_12;
                            }
                            const ez_lft = _b_Ez_edge[_inl_12_result];
                            let curl_e = (ez_rgt - ez_lft);
                            if (geom_cyl) {
                                const r_l = (((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))));
                                const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))));
                                const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))));
                                curl_e = ((((r_r * ez_rgt) - (r_l * ez_lft))) / r_c);
                            }
                            _b_By_out[dst] = (((0.3333333333333333 * _b_By_n[dst]) + (0.6666666666666666 * _b_By_other[dst])) + (coef * curl_e));
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
                {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const dx = _u_U_uniforms_dx;
                    const dt = _b_dt_buf[0];
                    const coef = ((0.6666666666666666 * dt) / dx);
                    const _inl_6_flags = _u_U_uniforms_physics_flags;
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = (((_inl_6_flags & FLAG_GEOMETRY)) != 0);
                        break _inl_6;
                    }
                    const geom_cyl = (_inl_6_result && (_u_U_uniforms_geometry_mode == 1));
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < (n_interior + 1)) && (iy < n_interior))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_7;
                        }
                        const dst = _inl_7_result;
                        const _inl_8_iy = (biy + 1);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((_inl_8_iy * ((n_total + 1))) + bix);
                            break _inl_8;
                        }
                        const ez_top = _b_Ez_edge[_inl_8_result];
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_9;
                        }
                        const ez_bot = _b_Ez_edge[_inl_9_result];
                        _b_Bx_out[dst] = (((0.3333333333333333 * _b_Bx_n[dst]) + (0.6666666666666666 * _b_Bx_other[dst])) - (coef * ((ez_top - ez_bot))));
                    }
                    if (((ix < n_interior) && (iy < (n_interior + 1)))) {
                        const bix = (ix + ghost);
                        const biy = (iy + ghost);
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((biy * n_total) + bix);
                            break _inl_10;
                        }
                        const dst = _inl_10_result;
                        const _inl_11_ix = (bix + 1);
                        let _inl_11_result;
                        _inl_11: {
                            _inl_11_result = ((biy * ((n_total + 1))) + _inl_11_ix);
                            break _inl_11;
                        }
                        const ez_rgt = _b_Ez_edge[_inl_11_result];
                        let _inl_12_result;
                        _inl_12: {
                            _inl_12_result = ((biy * ((n_total + 1))) + bix);
                            break _inl_12;
                        }
                        const ez_lft = _b_Ez_edge[_inl_12_result];
                        let curl_e = (ez_rgt - ez_lft);
                        if (geom_cyl) {
                            const r_l = (((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(ix)) * dx))));
                            const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 1.0)) * dx))));
                            const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(ix)) + 0.5)) * dx))));
                            curl_e = ((((r_r * ez_rgt) - (r_l * ez_lft))) / r_c);
                        }
                        _b_By_out[dst] = (((0.3333333333333333 * _b_By_n[dst]) + (0.6666666666666666 * _b_By_other[dst])) + (coef * curl_e));
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

    return { entry, bind, bindings: ["U_uniforms","stage_params","Bx_n","By_n","Bx_other","By_other","Ez_edge","dt_buf","Bx_out","By_out"], entryInfo };
}
