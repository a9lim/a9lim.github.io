// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-normalize.wgsl
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: e2616e0c1620016fda6a87a414153bc4371853cad4775503410fab15758b1412
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":8656,"lines":177,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":4,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-27T17:41:05.206Z
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
    const NORM_EPS = 1.0e-4;

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_lic_minmax = bindings.lic_minmax;
        const _b_lic_out = bindings.lic_out;
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
                        const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                        const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                        const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx = _inl_6_result;
                        const raw = _b_lic_out[idx];
                        const norm = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((raw - lo)) / denom), 0.0, 1.0));
                        _b_lic_out[idx] = norm;
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
                            const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                            const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                            const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((iy * n_total) + ix);
                                break _inl_6;
                            }
                            const idx = _inl_6_result;
                            const raw = _b_lic_out[idx];
                            const norm = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((raw - lo)) / denom), 0.0, 1.0));
                            _b_lic_out[idx] = norm;
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
                        const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                        const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                        const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx = _inl_6_result;
                        const raw = _b_lic_out[idx];
                        const norm = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((raw - lo)) / denom), 0.0, 1.0));
                        _b_lic_out[idx] = norm;
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
                    const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                    const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                    const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((iy * n_total) + ix);
                        break _inl_6;
                    }
                    const idx = _inl_6_result;
                    const raw = _b_lic_out[idx];
                    const norm = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((raw - lo)) / denom), 0.0, 1.0));
                    _b_lic_out[idx] = norm;
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

    return { entry, bind, bindings: ["U_uniforms","lic_minmax","lic_out"], entryInfo };
}
