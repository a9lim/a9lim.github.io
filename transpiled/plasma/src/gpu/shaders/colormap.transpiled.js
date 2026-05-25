// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/colormap.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 64038105a306a4ea26ba26baf3b80d5ed58653d3839b051e2d2e377aebbe2995
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.662Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_view_min = _b_U_uniforms.view_min;
        const _u_U_uniforms_view_max = _b_U_uniforms.view_max;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_field = bindings.field;
        const _b_lut = bindings.lut;
        const _b_colored = bindings.colored;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const idx = _inl_4_result;
                    const v = _b_field[idx];
                    const lo = _u_U_uniforms_view_min;
                    const hi = _u_U_uniforms_view_max;
                    const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                    const u = rt.clampScalar((((v - lo)) / span), 0.0, 1.0);
                    const t = (u * 255.0);
                    const i0 = rt.u32(Math.floor(t));
                    const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                    const frac = (t - rt.f32(i0));
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
                    const _sroa_2 = rt.mix(rt.vec4(c0_x, c0_y, c0_z, c0_w), rt.vec4(c1_x, c1_y, c1_z, c1_w), frac);
                    const c_x = _sroa_2.x;
                    const c_y = _sroa_2.y;
                    const c_z = _sroa_2.z;
                    const c_w = _sroa_2.w;
                    {
                        const _ftmp = rt.vec4(rt.vec3(c_x, c_y, c_z), 1.0);
                        const _wbase = ((idx) * 4 + 0);
                        _b_colored[_wbase + 0] = _ftmp.x;
                        _b_colored[_wbase + 1] = _ftmp.y;
                        _b_colored[_wbase + 2] = _ftmp.z;
                        _b_colored[_wbase + 3] = _ftmp.w;
                    }
                }
            }
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy * n_total) + ix);
                        break _inl_4;
                    }
                    const idx = _inl_4_result;
                    const v = _b_field[idx];
                    const lo = _u_U_uniforms_view_min;
                    const hi = _u_U_uniforms_view_max;
                    const span = (((hi - lo)) < (1.0e-12) ? (1.0e-12) : ((hi - lo)));
                    const u = rt.clampScalar((((v - lo)) / span), 0.0, 1.0);
                    const t = (u * 255.0);
                    const i0 = rt.u32(Math.floor(t));
                    const i1 = ((255) < ((i0 + 1)) ? (255) : ((i0 + 1)));
                    const frac = (t - rt.f32(i0));
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
                    const _sroa_5 = rt.mix(rt.vec4(c0_x, c0_y, c0_z, c0_w), rt.vec4(c1_x, c1_y, c1_z, c1_w), frac);
                    const c_x = _sroa_5.x;
                    const c_y = _sroa_5.y;
                    const c_z = _sroa_5.z;
                    const c_w = _sroa_5.w;
                    {
                        const _ftmp = rt.vec4(rt.vec3(c_x, c_y, c_z), 1.0);
                        const _wbase = ((idx) * 4 + 0);
                        _b_colored[_wbase + 0] = _ftmp.x;
                        _b_colored[_wbase + 1] = _ftmp.y;
                        _b_colored[_wbase + 2] = _ftmp.z;
                        _b_colored[_wbase + 3] = _ftmp.w;
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","field","lut","colored"] };
}
