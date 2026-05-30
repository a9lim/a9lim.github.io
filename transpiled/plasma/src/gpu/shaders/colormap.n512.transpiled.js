// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/colormap.wgsl
// wgsl-variant: n512
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 42ae315d89c6f2b67b11d60fcc5cae375190d1c0f21c8e39ce9dd491cf7c2447
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"U_uniforms":{"grid_n":512,"grid_n_total":516,"ghost_w":2}},"fixedWorkgroups":[64,64,1]}
// wgsl-metrics: {"bytes":14997,"lines":292,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":4,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.611Z
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
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_view_min = _b_U_uniforms.view_min;
        const _u_U_uniforms_view_max = _b_U_uniforms.view_max;
        const _b_field = bindings.field;
        const _b_lut = bindings.lut;
        const _b_colored = bindings.colored;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = 512;
        const __clipYBound = 512;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n_interior = 512;
                        const n_total = 516;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx = _inl_6_result;
                        const v = _b_field[idx];
                        const lo = _u_U_uniforms_view_min;
                        const hi = _u_U_uniforms_view_max;
                        const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                        const u = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((v - lo)) / span), 0.0, 1.0));
                        const t = (u * 255.0);
                        const i0 = ((Math.floor(t)) >>> 0);
                        const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                        const frac = (t - (+(i0)));
                        const _sroa_0_base = ((i0) * 4 + 0);
                        const c0_x = _b_lut[_sroa_0_base + 0];
                        const c0_y = _b_lut[_sroa_0_base + 1];
                        const c0_z = _b_lut[_sroa_0_base + 2];
                        const c0_w = _b_lut[_sroa_0_base + 3];
                        const _sroa_1_base = ((i1) * 4 + 0);
                        const c1_x = _b_lut[_sroa_1_base + 0];
                        const c1_y = _b_lut[_sroa_1_base + 1];
                        const c1_z = _b_lut[_sroa_1_base + 2];
                        const c1_w = _b_lut[_sroa_1_base + 3];
                        const _sroa_2 = {x:(c0_x + (c1_x - c0_x) * frac), y:(c0_y + (c1_y - c0_y) * frac), z:(c0_z + (c1_z - c0_z) * frac), w:(c0_w + (c1_w - c0_w) * frac)};
                        const c_x = _sroa_2.x;
                        const c_y = _sroa_2.y;
                        const c_z = _sroa_2.z;
                        const c_w = _sroa_2.w;
                        {
                            const _wbase = ((idx) * 4 + 0);
                            const _wt0 = c_x;
                            const _wt1 = c_y;
                            const _wt2 = c_z;
                            const _wt3 = 1.0;
                            _b_colored[_wbase + 0] = _wt0;
                            _b_colored[_wbase + 1] = _wt1;
                            _b_colored[_wbase + 2] = _wt2;
                            _b_colored[_wbase + 3] = _wt3;
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
                            const n_interior = 512;
                            const n_total = 516;
                            const ghost = 2;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((iy * n_total) + ix);
                                break _inl_6;
                            }
                            const idx = _inl_6_result;
                            const v = _b_field[idx];
                            const lo = _u_U_uniforms_view_min;
                            const hi = _u_U_uniforms_view_max;
                            const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                            const u = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((v - lo)) / span), 0.0, 1.0));
                            const t = (u * 255.0);
                            const i0 = ((Math.floor(t)) >>> 0);
                            const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                            const frac = (t - (+(i0)));
                            const _sroa_3_base = ((i0) * 4 + 0);
                            const c0_x = _b_lut[_sroa_3_base + 0];
                            const c0_y = _b_lut[_sroa_3_base + 1];
                            const c0_z = _b_lut[_sroa_3_base + 2];
                            const c0_w = _b_lut[_sroa_3_base + 3];
                            const _sroa_4_base = ((i1) * 4 + 0);
                            const c1_x = _b_lut[_sroa_4_base + 0];
                            const c1_y = _b_lut[_sroa_4_base + 1];
                            const c1_z = _b_lut[_sroa_4_base + 2];
                            const c1_w = _b_lut[_sroa_4_base + 3];
                            const _sroa_5 = {x:(c0_x + (c1_x - c0_x) * frac), y:(c0_y + (c1_y - c0_y) * frac), z:(c0_z + (c1_z - c0_z) * frac), w:(c0_w + (c1_w - c0_w) * frac)};
                            const c_x = _sroa_5.x;
                            const c_y = _sroa_5.y;
                            const c_z = _sroa_5.z;
                            const c_w = _sroa_5.w;
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = c_x;
                                const _wt1 = c_y;
                                const _wt2 = c_z;
                                const _wt3 = 1.0;
                                _b_colored[_wbase + 0] = _wt0;
                                _b_colored[_wbase + 1] = _wt1;
                                _b_colored[_wbase + 2] = _wt2;
                                _b_colored[_wbase + 3] = _wt3;
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
                        const n_interior = 512;
                        const n_total = 516;
                        const ghost = 2;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * n_total) + ix);
                            break _inl_6;
                        }
                        const idx = _inl_6_result;
                        const v = _b_field[idx];
                        const lo = _u_U_uniforms_view_min;
                        const hi = _u_U_uniforms_view_max;
                        const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                        const u = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((v - lo)) / span), 0.0, 1.0));
                        const t = (u * 255.0);
                        const i0 = ((Math.floor(t)) >>> 0);
                        const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                        const frac = (t - (+(i0)));
                        const _sroa_6_base = ((i0) * 4 + 0);
                        const c0_x = _b_lut[_sroa_6_base + 0];
                        const c0_y = _b_lut[_sroa_6_base + 1];
                        const c0_z = _b_lut[_sroa_6_base + 2];
                        const c0_w = _b_lut[_sroa_6_base + 3];
                        const _sroa_7_base = ((i1) * 4 + 0);
                        const c1_x = _b_lut[_sroa_7_base + 0];
                        const c1_y = _b_lut[_sroa_7_base + 1];
                        const c1_z = _b_lut[_sroa_7_base + 2];
                        const c1_w = _b_lut[_sroa_7_base + 3];
                        const _sroa_8 = {x:(c0_x + (c1_x - c0_x) * frac), y:(c0_y + (c1_y - c0_y) * frac), z:(c0_z + (c1_z - c0_z) * frac), w:(c0_w + (c1_w - c0_w) * frac)};
                        const c_x = _sroa_8.x;
                        const c_y = _sroa_8.y;
                        const c_z = _sroa_8.z;
                        const c_w = _sroa_8.w;
                        {
                            const _wbase = ((idx) * 4 + 0);
                            const _wt0 = c_x;
                            const _wt1 = c_y;
                            const _wt2 = c_z;
                            const _wt3 = 1.0;
                            _b_colored[_wbase + 0] = _wt0;
                            _b_colored[_wbase + 1] = _wt1;
                            _b_colored[_wbase + 2] = _wt2;
                            _b_colored[_wbase + 3] = _wt3;
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
                    const n_interior = 512;
                    const n_total = 516;
                    const ghost = 2;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((iy * n_total) + ix);
                        break _inl_6;
                    }
                    const idx = _inl_6_result;
                    const v = _b_field[idx];
                    const lo = _u_U_uniforms_view_min;
                    const hi = _u_U_uniforms_view_max;
                    const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                    const u = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((((v - lo)) / span), 0.0, 1.0));
                    const t = (u * 255.0);
                    const i0 = ((Math.floor(t)) >>> 0);
                    const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                    const frac = (t - (+(i0)));
                    const _sroa_9_base = ((i0) * 4 + 0);
                    const c0_x = _b_lut[_sroa_9_base + 0];
                    const c0_y = _b_lut[_sroa_9_base + 1];
                    const c0_z = _b_lut[_sroa_9_base + 2];
                    const c0_w = _b_lut[_sroa_9_base + 3];
                    const _sroa_10_base = ((i1) * 4 + 0);
                    const c1_x = _b_lut[_sroa_10_base + 0];
                    const c1_y = _b_lut[_sroa_10_base + 1];
                    const c1_z = _b_lut[_sroa_10_base + 2];
                    const c1_w = _b_lut[_sroa_10_base + 3];
                    const _sroa_11 = {x:(c0_x + (c1_x - c0_x) * frac), y:(c0_y + (c1_y - c0_y) * frac), z:(c0_z + (c1_z - c0_z) * frac), w:(c0_w + (c1_w - c0_w) * frac)};
                    const c_x = _sroa_11.x;
                    const c_y = _sroa_11.y;
                    const c_z = _sroa_11.z;
                    const c_w = _sroa_11.w;
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = c_x;
                        const _wt1 = c_y;
                        const _wt2 = c_z;
                        const _wt3 = 1.0;
                        _b_colored[_wbase + 0] = _wt0;
                        _b_colored[_wbase + 1] = _wt1;
                        _b_colored[_wbase + 2] = _wt2;
                        _b_colored[_wbase + 3] = _wt3;
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

    return { entry, bind, bindings: ["U_uniforms","field","lut","colored"], entryInfo };
}
