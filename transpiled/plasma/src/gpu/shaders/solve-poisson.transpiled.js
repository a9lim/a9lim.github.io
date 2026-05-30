// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/solve-poisson.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 82567154681b62d6e2aa72fac758ea568e08155e5a39a759ac7c9f4108fcf098
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":16759,"lines":331,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":1,"workgroupReductionInits":0,"flatWorkgroupArrays":1,"flatWorkgroupSlots":64,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.781Z
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
    const POISSON_WG = 8;
    const POISSON_LANES = 64;
    const PI_POISSON = 3.141592653589793;

    function phi_sample(gx_in, gy_in, n_interior, n_total, ghost) {
        const n = ((n_interior) | 0);
        let _inl_9_result;
        _inl_9: {
            _inl_9_result = (bindings.U_uniforms.gravity_boundary_mode == 1);
            break _inl_9;
        }
        if (_inl_9_result) {
            if (((((gx_in < 0) || (gx_in >= n)) || (gy_in < 0)) || (gy_in >= n))) {
                return 0.0;
            }
            const _inl_10_gx = ((gx_in) >>> 0);
            const _inl_10_gy = ((gy_in) >>> 0);
            let _inl_10_result;
            _inl_10: {
                const _inl_10_ix = (ghost + _inl_10_gx);
                const _inl_10_iy = (ghost + _inl_10_gy);
                let _inl_10__inl_6_result;
                _inl_10__inl_6: {
                    _inl_10__inl_6_result = ((_inl_10_iy * n_total) + _inl_10_ix);
                    break _inl_10__inl_6;
                }
                _inl_10_result = _inl_10__inl_6_result;
                break _inl_10;
            }
            return bindings.phi_in[_inl_10_result];
        }
        const gx = (((((gx_in % n)) + n)) % n);
        const gy = (((((gy_in % n)) + n)) % n);
        const _inl_11_gx = ((gx) >>> 0);
        const _inl_11_gy = ((gy) >>> 0);
        let _inl_11_result;
        _inl_11: {
            const _inl_11_ix = (ghost + _inl_11_gx);
            const _inl_11_iy = (ghost + _inl_11_gy);
            let _inl_11__inl_6_result;
            _inl_11__inl_6: {
                _inl_11__inl_6_result = ((_inl_11_iy * n_total) + _inl_11_ix);
                break _inl_11__inl_6;
            }
            _inl_11_result = _inl_11__inl_6_result;
            break _inl_11;
        }
        return bindings.phi_in[_inl_11_result];
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["reduce_mean"] = {"workgroupSize":[8,8,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_0_reduce_mean(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_U0 = bindings.U0;
        const _b_rho_mean_partials = bindings.rho_mean_partials;
        const wg = Object.create(null);
        wg.rho_tile = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.rho_tile.fill(0);
            const wid_x = wgx;
            const wid_y = wgy;
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
                            let rho = 0.0;
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                const _inl_12_gx = gid_x;
                                const _inl_12_gy = gid_y;
                                let _inl_12_result;
                                _inl_12: {
                                    const _inl_12_ix = (ghost + _inl_12_gx);
                                    const _inl_12_iy = (ghost + _inl_12_gy);
                                    let _inl_12__inl_6_result;
                                    _inl_12__inl_6: {
                                        _inl_12__inl_6_result = ((_inl_12_iy * n_total) + _inl_12_ix);
                                        break _inl_12__inl_6;
                                    }
                                    _inl_12_result = _inl_12__inl_6_result;
                                    break _inl_12;
                                }
                                const c = _inl_12_result;
                                rho = _b_U0[((c) * 4 + 0) + 0];
                            }
                            wg.rho_tile[((lid))] = rho;
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
                            let stride = (POISSON_LANES / 2);
                            while (true) {
                                if ((stride == 0)) {
                                    break;
                                }
                                if ((lid < stride)) {
                                    wg.rho_tile[((lid))] = (wg.rho_tile[((lid))] + wg.rho_tile[(((lid + stride)))]);
                                }
                                rt.workgroupBarrier();
                                stride = (stride / 2);
                            }
                            if ((lid == 0)) {
                                const tiles = ((((n_interior + POISSON_WG) - 1)) / POISSON_WG);
                                _b_rho_mean_partials[((wid_y * tiles) + wid_x)] = wg.rho_tile[((0))];
                            }
                        }
                    }
                }
            }
        }
    }
    entry["reduce_mean"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_reduce_mean(workgroups, bindings, domain, origin);
    };

    entryInfo["finalize_mean"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_1_finalize_mean(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _b_rho_mean = bindings.rho_mean;
        const _b_rho_mean_partials = bindings.rho_mean_partials;
        const wg = Object.create(null);
        wg.rho_tile = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.rho_tile.fill(0);
            {
                const lz = 0;
                const ly = 0;
                const lx = 0;
                {
                    const n_interior = _u_U_uniforms_grid_n;
                    const tiles = ((((n_interior + POISSON_WG) - 1)) / POISSON_WG);
                    const tile_count = (tiles * tiles);
                    let sum = 0.0;
                    for (let i = 0; (i < tile_count); i = (i + 1)) {
                        sum = (sum + _b_rho_mean_partials[i]);
                    }
                    const cells = (+((n_interior * n_interior)));
                    _b_rho_mean[0] = (sum / ((cells) < (1.0) ? (1.0) : (cells)));
                }
            }
        }
    }
    entry["finalize_mean"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_finalize_mean(workgroups, bindings, domain, origin);
    };

    entryInfo["iterate"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_2_iterate(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_gravity_G = _b_U_uniforms.gravity_G;
        const _u_U_uniforms_physics_flags = _b_U_uniforms.physics_flags;
        const _u_U_uniforms_geometry_mode = _b_U_uniforms.geometry_mode;
        const _u_U_uniforms_geometry_r_min = _b_U_uniforms.geometry_r_min;
        const _u_U_uniforms_gravity_softening = _b_U_uniforms.gravity_softening;
        const _u_U_uniforms_gravity_poisson_omega = _b_U_uniforms.gravity_poisson_omega;
        const _u_U_uniforms_gravity_boundary_mode = _b_U_uniforms.gravity_boundary_mode;
        const _b_U0 = bindings.U0;
        const _b_phi_in = bindings.phi_in;
        const _b_phi_out = bindings.phi_out;
        const _b_rho_mean = bindings.rho_mean;
        const wg = Object.create(null);
        wg.rho_tile = new Float32Array(64);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.rho_tile.fill(0);
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        __invocation: {
                            const _inl_13_flags = _u_U_uniforms_physics_flags;
                            let _inl_13_result;
                            _inl_13: {
                                _inl_13_result = (((_inl_13_flags & FLAG_GRAVITY_SELF)) != 0);
                                break _inl_13;
                            }
                            if ((!_inl_13_result)) {
                                break __invocation;
                            }
                            if ((_u_U_uniforms_gravity_G <= 0.0)) {
                                break __invocation;
                            }
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                                break __invocation;
                            }
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_14_result;
                            _inl_14: {
                                _inl_14_result = ((iy * n_total) + ix);
                                break _inl_14;
                            }
                            const c = _inl_14_result;
                            const rho = _b_U0[((c) * 4 + 0) + 0];
                            let _inl_15_result;
                            _inl_15: {
                                _inl_15_result = (_u_U_uniforms_gravity_boundary_mode == 1);
                                break _inl_15;
                            }
                            const rho_bar = (_inl_15_result ? 0.0 : _b_rho_mean[0]);
                            const rhs = (((4.0 * PI_POISSON) * _u_U_uniforms_gravity_G) * ((rho - rho_bar)));
                            const gx = ((gid_x) | 0);
                            const gy = ((gid_y) | 0);
                            const phi_l = phi_sample((gx - 1), gy, n_interior, n_total, ghost);
                            const phi_r = phi_sample((gx + 1), gy, n_interior, n_total, ghost);
                            const phi_d = phi_sample(gx, (gy - 1), n_interior, n_total, ghost);
                            const phi_u = phi_sample(gx, (gy + 1), n_interior, n_total, ghost);
                            const dx = _u_U_uniforms_dx;
                            const softened = (_u_U_uniforms_gravity_softening > 0.0);
                            const soft2 = (softened ? (((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening)))) * ((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening))))) : 0.0);
                            let jacobi = 0;
                            let _inl_16_result;
                            _inl_16: {
                                const _inl_16__inl_8_flags = _u_U_uniforms_physics_flags;
                                let _inl_16__inl_8_result;
                                _inl_16__inl_8: {
                                    _inl_16__inl_8_result = (((_inl_16__inl_8_flags & FLAG_GEOMETRY)) != 0);
                                    break _inl_16__inl_8;
                                }
                                _inl_16_result = (_inl_16__inl_8_result && (_u_U_uniforms_geometry_mode == 1));
                                break _inl_16;
                            }
                            if (_inl_16_result) {
                                const r_l = (((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((+(gid_x)) * dx))));
                                const r_r = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))) < (0.0) ? (0.0) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 1.0)) * dx))));
                                const r_c = (((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))) < ((0.5 * dx)) ? ((0.5 * dx)) : ((_u_U_uniforms_geometry_r_min + ((((+(gid_x)) + 0.5)) * dx))));
                                const numerator = ((((r_r * phi_r) + (r_l * phi_l)) + (r_c * ((phi_u + phi_d)))) - (((r_c * dx) * dx) * rhs));
                                const denom = (((r_r + r_l) + (2.0 * r_c)) + (soft2 * r_c));
                                jacobi = (numerator / ((denom) < (1.0e-6) ? (1.0e-6) : (denom)));
                            } else {
                                jacobi = ((((((phi_l + phi_r) + phi_d) + phi_u) - ((dx * dx) * rhs))) / (((4.0 + soft2)) < (1.0e-6) ? (1.0e-6) : ((4.0 + soft2))));
                            }
                            const omega = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_gravity_poisson_omega, 0.05, 1.95));
                            _b_phi_out[c] = (_b_phi_in[c] + (jacobi - _b_phi_in[c]) * omega);
                        }
                    }
                }
            }
        }
    }
    entry["iterate"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_iterate(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["reduce_mean"] = function (workgroups, domain, origin) {
            return __entry_0_reduce_mean(workgroups, bindings, domain, origin);
        };
        bound["finalize_mean"] = function (workgroups, domain, origin) {
            return __entry_1_finalize_mean(workgroups, bindings, domain, origin);
        };
        bound["iterate"] = function (workgroups, domain, origin) {
            return __entry_2_iterate(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","phi_in","phi_out","rho_mean","rho_mean_partials"], entryInfo };
}
