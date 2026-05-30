// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-reduce.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: f23dad8dda5575bd606a9dc561005de4247d37ccafb10d6b415c5231fe4d963d
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":7492,"lines":164,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":5,"workgroupReductionInits":2,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.555Z
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
    const F32_ONE_BITS = 0x3F800000;
    const F32_ZERO_BITS = 0;

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["reset"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_reset(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_lic_minmax = bindings.lic_minmax;
        const wg = Object.create(null);
        wg.tile_min = 0;
        wg.tile_max = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_min = 0;
            wg.tile_max = 0;
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    void (_b_lic_minmax[0] = F32_ONE_BITS);
                    void (_b_lic_minmax[1] = F32_ZERO_BITS);
                }
            }
        }
    }
    entry["reset"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_reset(workgroups, bindings, domain, origin);
    };

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":2};
    function __entry_1_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_lic_out = bindings.lic_out;
        const _b_lic_minmax = bindings.lic_minmax;
        const wg = Object.create(null);
        wg.tile_min = 0;
        wg.tile_max = 0;
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_min = 0;
            wg.tile_max = 0;
            // Optimized workgroup reduction init phase
            wg.tile_min = F32_ONE_BITS;
            wg.tile_max = F32_ZERO_BITS;
            // Phase 0
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        const lid = lz*Ly*Lx + ly*Lx + lx;
                        {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                const ix = (gid_x + ghost);
                                const iy = (gid_y + ghost);
                                let _inl_6_result;
                                _inl_6: {
                                    _inl_6_result = ((iy * n_total) + ix);
                                    break _inl_6;
                                }
                                const raw = _b_lic_out[_inl_6_result];
                                const L_safe = (((raw >= 0.0) && (raw == raw)) ? raw : 0.0);
                                const L = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(L_safe, 0.0, 1.0));
                                const bits = rt.bitcast_u32_f32(L);
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(wg, "tile_min", bits));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(wg, "tile_max", bits));
                            }
                        }
                    }
                }
            }
            // Phase 1
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        const lid = lz*Ly*Lx + ly*Lx + lx;
                        {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if ((lid == 0)) {
                                const lo = wg["tile_min"];
                                const hi = wg["tile_max"];
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v < _o) _r[_k] = _v; return _o; })(_b_lic_minmax, 0, lo));
                                (((_r, _k, _v) => { const _o = _r[_k]; if (_v > _o) _r[_k] = _v; return _o; })(_b_lic_minmax, 1, hi));
                            }
                        }
                    }
                }
            }
        }
    }
    entry["main"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_main(workgroups, bindings, domain, origin);
    };

    entryInfo["reset_main"] = {"sequence":true,"fusedDispatch":true,"entries":["reset","main"],"workgroupEntry":"main","workgroupSize":[8,8,1],"phases":3,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":2};
    function __entry_2_reset_main(workgroups, bindings, domain, origin) {
        __entry_0_reset([1, 1, 1], bindings, undefined, undefined);
        __entry_1_main(workgroups, bindings, domain, origin);
    }
    entry["reset_main"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_reset_main(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["reset"] = function (workgroups, domain, origin) {
            return __entry_0_reset(workgroups, bindings, domain, origin);
        };
        bound["main"] = function (workgroups, domain, origin) {
            return __entry_1_main(workgroups, bindings, domain, origin);
        };
        bound["reset_main"] = function (workgroups, domain, origin) {
            return __entry_2_reset_main(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","lic_out","lic_minmax"], entryInfo };
}
