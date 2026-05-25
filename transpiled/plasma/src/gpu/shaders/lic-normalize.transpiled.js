// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-normalize.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 787fad7506743ed78df71a17128b84feb2f317b502f92f44761ce1201034790a
// generated: 2026-05-25T23:32:29.815Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const NORM_EPS = 1.0e-4;

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_lic_minmax = bindings.lic_minmax;
        const _b_lic_out = bindings.lic_out;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                    const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                    const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const idx = _inl_4_result;
                    const raw = _b_lic_out[idx];
                    const norm = rt.clampScalar((((raw - lo)) / denom), 0.0, 1.0);
                    _b_lic_out[idx] = norm;
                }
            }
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const lo = rt.bitcast_f32_u32(_b_lic_minmax[0]);
                    const hi = rt.bitcast_f32_u32(_b_lic_minmax[1]);
                    const denom = (((hi - lo)) < (NORM_EPS) ? (NORM_EPS) : ((hi - lo)));
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const idx = _inl_4_result;
                    const raw = _b_lic_out[idx];
                    const norm = rt.clampScalar((((raw - lo)) / denom), 0.0, 1.0);
                    _b_lic_out[idx] = norm;
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","lic_minmax","lic_out"] };
}
