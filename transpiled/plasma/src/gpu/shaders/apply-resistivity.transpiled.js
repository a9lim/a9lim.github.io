// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-resistivity.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: d25e68ba03d5ff4cb546c9e409100461577812aa5fd2763c81edca30abd5bdbf
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":12439,"lines":264,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.707Z
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

    entryInfo["snapshot"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_snapshot(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_Bx_src = bindings.Bx_src;
        const _b_By_src = bindings.By_src;
        const _b_U1_src = bindings.U1_src;
        const _b_Bx_dst = bindings.Bx_dst;
        const _b_By_dst = bindings.By_dst;
        const _b_U1_dst = bindings.U1_dst;
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
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((ix < n_total) && (iy < n_total))) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const c = _inl_6_result;
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_src[((c) * 4 + 0) + 0];
                            const _wt1 = _b_U1_src[((c) * 4 + 0) + 1];
                            const _wt2 = _b_U1_src[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_src[((c) * 4 + 0) + 3];
                            _b_U1_dst[_wbase + 0] = _wt0;
                            _b_U1_dst[_wbase + 1] = _wt1;
                            _b_U1_dst[_wbase + 2] = _wt2;
                            _b_U1_dst[_wbase + 3] = _wt3;
                        }
                    }
                    if (((ix <= n_total) && (iy < n_total))) {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_7;
                        }
                        const cx = _inl_7_result;
                        _b_Bx_dst[cx] = _b_Bx_src[cx];
                    }
                    if (((ix < n_total) && (iy <= n_total))) {
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((iy * n_total) + ix);
                            break _inl_8;
                        }
                        const cy = _inl_8_result;
                        _b_By_dst[cy] = _b_By_src[cy];
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
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const ix = ((gid_x + ghost) - 1);
                            const iy = ((gid_y + ghost) - 1);
                            if (((ix < n_total) && (iy < n_total))) {
                                let _inl_6_result;
                                _inl_6: {
                                    _inl_6_result = ((iy * n_total) + ix);
                                    break _inl_6;
                                }
                                const c = _inl_6_result;
                                {
                                    const _wbase = ((c) * 4 + 0);
                                    const _wt0 = _b_U1_src[((c) * 4 + 0) + 0];
                                    const _wt1 = _b_U1_src[((c) * 4 + 0) + 1];
                                    const _wt2 = _b_U1_src[((c) * 4 + 0) + 2];
                                    const _wt3 = _b_U1_src[((c) * 4 + 0) + 3];
                                    _b_U1_dst[_wbase + 0] = _wt0;
                                    _b_U1_dst[_wbase + 1] = _wt1;
                                    _b_U1_dst[_wbase + 2] = _wt2;
                                    _b_U1_dst[_wbase + 3] = _wt3;
                                }
                            }
                            if (((ix <= n_total) && (iy < n_total))) {
                                let _inl_7_result;
                                _inl_7: {
                                    _inl_7_result = ((iy * ((n_total + 1))) + ix);
                                    break _inl_7;
                                }
                                const cx = _inl_7_result;
                                _b_Bx_dst[cx] = _b_Bx_src[cx];
                            }
                            if (((ix < n_total) && (iy <= n_total))) {
                                let _inl_8_result;
                                _inl_8: {
                                    _inl_8_result = ((iy * n_total) + ix);
                                    break _inl_8;
                                }
                                const cy = _inl_8_result;
                                _b_By_dst[cy] = _b_By_src[cy];
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
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ghost = _u_U_uniforms_ghost_w;
                        const ix = ((gid_x + ghost) - 1);
                        const iy = ((gid_y + ghost) - 1);
                        if (((ix < n_total) && (iy < n_total))) {
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((iy * n_total) + ix);
                                break _inl_6;
                            }
                            const c = _inl_6_result;
                            {
                                const _wbase = ((c) * 4 + 0);
                                const _wt0 = _b_U1_src[((c) * 4 + 0) + 0];
                                const _wt1 = _b_U1_src[((c) * 4 + 0) + 1];
                                const _wt2 = _b_U1_src[((c) * 4 + 0) + 2];
                                const _wt3 = _b_U1_src[((c) * 4 + 0) + 3];
                                _b_U1_dst[_wbase + 0] = _wt0;
                                _b_U1_dst[_wbase + 1] = _wt1;
                                _b_U1_dst[_wbase + 2] = _wt2;
                                _b_U1_dst[_wbase + 3] = _wt3;
                            }
                        }
                        if (((ix <= n_total) && (iy < n_total))) {
                            let _inl_7_result;
                            _inl_7: {
                                _inl_7_result = ((iy * ((n_total + 1))) + ix);
                                break _inl_7;
                            }
                            const cx = _inl_7_result;
                            _b_Bx_dst[cx] = _b_Bx_src[cx];
                        }
                        if (((ix < n_total) && (iy <= n_total))) {
                            let _inl_8_result;
                            _inl_8: {
                                _inl_8_result = ((iy * n_total) + ix);
                                break _inl_8;
                            }
                            const cy = _inl_8_result;
                            _b_By_dst[cy] = _b_By_src[cy];
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
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const ix = ((gid_x + ghost) - 1);
                    const iy = ((gid_y + ghost) - 1);
                    if (((ix < n_total) && (iy < n_total))) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const c = _inl_6_result;
                        {
                            const _wbase = ((c) * 4 + 0);
                            const _wt0 = _b_U1_src[((c) * 4 + 0) + 0];
                            const _wt1 = _b_U1_src[((c) * 4 + 0) + 1];
                            const _wt2 = _b_U1_src[((c) * 4 + 0) + 2];
                            const _wt3 = _b_U1_src[((c) * 4 + 0) + 3];
                            _b_U1_dst[_wbase + 0] = _wt0;
                            _b_U1_dst[_wbase + 1] = _wt1;
                            _b_U1_dst[_wbase + 2] = _wt2;
                            _b_U1_dst[_wbase + 3] = _wt3;
                        }
                    }
                    if (((ix <= n_total) && (iy < n_total))) {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_7;
                        }
                        const cx = _inl_7_result;
                        _b_Bx_dst[cx] = _b_Bx_src[cx];
                    }
                    if (((ix < n_total) && (iy <= n_total))) {
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((iy * n_total) + ix);
                            break _inl_8;
                        }
                        const cy = _inl_8_result;
                        _b_By_dst[cy] = _b_By_src[cy];
                    }
                }
            }
        }
    }
    entry["snapshot"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_snapshot(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["snapshot"] = function (workgroups, domain, origin) {
            return __entry_0_snapshot(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","Bx_src","By_src","U1_src","Bx_dst","By_dst","U1_dst"], entryInfo };
}
