// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-reduce.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 9c24667291a532b29c582513800f0373f62490a6ae7c72165596536e0d35d70b
// generated: 2026-05-25T23:32:29.816Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const F32_ONE_BITS = 0x3F800000;
    const F32_ZERO_BITS = 0;

    const entry = Object.create(null);

    entry["reset"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_lic_minmax = bindings.lic_minmax;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_min = 0;
            wg.tile_max = 0;
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                __invocation: {
                    void rt.atomicStoreU32At(_b_lic_minmax, 0, F32_ONE_BITS);
                    void rt.atomicStoreU32At(_b_lic_minmax, 1, F32_ZERO_BITS);
                }
            }
        }
    };

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_lic_out = bindings.lic_out;
        const _b_lic_minmax = bindings.lic_minmax;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_min = 0;
            wg.tile_max = 0;
            // Optimized workgroup reduction init phase
            wg.tile_min = F32_ONE_BITS;
            wg.tile_max = F32_ZERO_BITS;
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
                            _inl_4_result = ((iy * n_total) + ix);
                            break _inl_4;
                        }
                        const raw = _b_lic_out[_inl_4_result];
                        const L_safe = (((raw >= 0.0) && (raw == raw)) ? raw : 0.0);
                        const L = rt.clampScalar(L_safe, 0.0, 1.0);
                        const bits = rt.bitcast_u32_f32(L);
                        rt.atomicMinU32At(wg, "tile_min", bits);
                        rt.atomicMaxU32At(wg, "tile_max", bits);
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
                        const lo = rt.atomicLoadU32At(wg, "tile_min");
                        const hi = rt.atomicLoadU32At(wg, "tile_max");
                        rt.atomicMinU32At(_b_lic_minmax, 0, lo);
                        rt.atomicMaxU32At(_b_lic_minmax, 1, hi);
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","lic_out","lic_minmax"] };
}
