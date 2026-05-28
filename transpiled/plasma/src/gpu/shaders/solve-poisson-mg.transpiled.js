// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/solve-poisson-mg.wgsl
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: 5a75e69ca11b5353e9d7aac3de4af7f23f64ccacf864c8638397c99d107f4597
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":54037,"lines":1032,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":12,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-27T17:41:05.239Z
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
    const PI_MG = 3.141592653589793;

    function sample_phi(gx_in, gy_in, n) {
        const ni = ((n) | 0);
        let _inl_6_result;
        _inl_6: {
            _inl_6_result = (bindings.U_uniforms.gravity_boundary_mode == 1);
            break _inl_6;
        }
        if (_inl_6_result) {
            if (((((gx_in < 0) || (gx_in >= ni)) || (gy_in < 0)) || (gy_in >= ni))) {
                return 0.0;
            }
            const _inl_7_ix = ((gx_in) >>> 0);
            const _inl_7_iy = ((gy_in) >>> 0);
            let _inl_7_result;
            _inl_7: {
                _inl_7_result = ((_inl_7_iy * n) + _inl_7_ix);
                break _inl_7;
            }
            return bindings.phi_in[_inl_7_result];
        }
        const gx = (((((gx_in % ni)) + ni)) % ni);
        const gy = (((((gy_in % ni)) + ni)) % ni);
        const _inl_8_ix = ((gx) >>> 0);
        const _inl_8_iy = ((gy) >>> 0);
        let _inl_8_result;
        _inl_8: {
            _inl_8_result = ((_inl_8_iy * n) + _inl_8_ix);
            break _inl_8;
        }
        return bindings.phi_in[_inl_8_result];
    }

    function sample_rhs(gx_in, gy_in, n) {
        const ni = ((n) | 0);
        let _inl_9_result;
        _inl_9: {
            _inl_9_result = (bindings.U_uniforms.gravity_boundary_mode == 1);
            break _inl_9;
        }
        if (_inl_9_result) {
            if (((((gx_in < 0) || (gx_in >= ni)) || (gy_in < 0)) || (gy_in >= ni))) {
                return 0.0;
            }
            const _inl_10_ix = ((gx_in) >>> 0);
            const _inl_10_iy = ((gy_in) >>> 0);
            let _inl_10_result;
            _inl_10: {
                _inl_10_result = ((_inl_10_iy * n) + _inl_10_ix);
                break _inl_10;
            }
            return bindings.rhs_in[_inl_10_result];
        }
        const gx = (((((gx_in % ni)) + ni)) % ni);
        const gy = (((((gy_in % ni)) + ni)) % ni);
        const _inl_11_ix = ((gx) >>> 0);
        const _inl_11_iy = ((gy) >>> 0);
        let _inl_11_result;
        _inl_11: {
            _inl_11_result = ((_inl_11_iy * n) + _inl_11_ix);
            break _inl_11;
        }
        return bindings.rhs_in[_inl_11_result];
    }

    function sample_coarse(gx_in, gy_in, n) {
        const ni = ((n) | 0);
        let _inl_12_result;
        _inl_12: {
            _inl_12_result = (bindings.U_uniforms.gravity_boundary_mode == 1);
            break _inl_12;
        }
        if (_inl_12_result) {
            if (((((gx_in < 0) || (gx_in >= ni)) || (gy_in < 0)) || (gy_in >= ni))) {
                return 0.0;
            }
            const _inl_13_ix = ((gx_in) >>> 0);
            const _inl_13_iy = ((gy_in) >>> 0);
            let _inl_13_result;
            _inl_13: {
                _inl_13_result = ((_inl_13_iy * n) + _inl_13_ix);
                break _inl_13;
            }
            return bindings.phi_coarse[_inl_13_result];
        }
        const gx = (((((gx_in % ni)) + ni)) % ni);
        const gy = (((((gy_in % ni)) + ni)) % ni);
        const _inl_14_ix = ((gx) >>> 0);
        const _inl_14_iy = ((gy) >>> 0);
        let _inl_14_result;
        _inl_14: {
            _inl_14_result = ((_inl_14_iy * n) + _inl_14_ix);
            break _inl_14;
        }
        return bindings.phi_coarse[_inl_14_result];
    }

    function residual_at(gx, gy, n, dx) {
        const c = sample_phi(gx, gy, n);
        const l = sample_phi((gx - 1), gy, n);
        const r = sample_phi((gx + 1), gy, n);
        const d = sample_phi(gx, (gy - 1), n);
        const u = sample_phi(gx, (gy + 1), n);
        let _inl_15_result;
        _inl_15: {
            if ((bindings.U_uniforms.gravity_softening <= 0.0)) {
                _inl_15_result = 0.0;
                break _inl_15;
            }
            const _inl_15_s = ((bindings.U_uniforms.gravity_softening) < (1.0e-30) ? (1.0e-30) : (bindings.U_uniforms.gravity_softening));
            _inl_15_result = (1.0 / ((_inl_15_s * _inl_15_s)));
            break _inl_15;
        }
        const lap = (((((((l + r) + d) + u) - (4.0 * c))) / (((dx * dx)) < (1.0e-30) ? (1.0e-30) : ((dx * dx)))) - (c * _inl_15_result));
        const rhs = sample_rhs(gx, gy, n);
        return (rhs - lap);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["init_level0"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_init_level0(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_gravity_G = _b_U_uniforms.gravity_G;
        const _u_U_uniforms_gravity_boundary_mode = _b_U_uniforms.gravity_boundary_mode;
        const _b_mg = bindings.mg;
        const _u_mg_level_n = _b_mg.level_n;
        const _b_U0 = bindings.U0;
        const _b_rho_mean = bindings.rho_mean;
        const _b_phi_main = bindings.phi_main;
        const _b_phi_out = bindings.phi_out;
        const _b_rhs_out = bindings.rhs_out;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_mg_level_n;
        const __clipYBound = _u_mg_level_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n = _u_mg_level_n;
                        const ghost = _u_U_uniforms_ghost_w;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = ((iy * n_total) + ix);
                            break _inl_16;
                        }
                        const c_main = _inl_16_result;
                        const _inl_17_ix = gid_x;
                        const _inl_17_iy = gid_y;
                        let _inl_17_result;
                        _inl_17: {
                            _inl_17_result = ((_inl_17_iy * n) + _inl_17_ix);
                            break _inl_17;
                        }
                        const c = _inl_17_result;
                        const rho = _b_U0[((c_main) * 4 + 0) + 0];
                        let _inl_18_result;
                        _inl_18: {
                            _inl_18_result = (_u_U_uniforms_gravity_boundary_mode == 1);
                            break _inl_18;
                        }
                        const rho_bar = (_inl_18_result ? 0.0 : _b_rho_mean[0]);
                        _b_rhs_out[c] = (((4.0 * PI_MG) * _u_U_uniforms_gravity_G) * ((rho - rho_bar)));
                        _b_phi_out[c] = _b_phi_main[c_main];
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
                            const n = _u_mg_level_n;
                            const ghost = _u_U_uniforms_ghost_w;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            let _inl_16_result;
                            _inl_16: {
                                _inl_16_result = ((iy * n_total) + ix);
                                break _inl_16;
                            }
                            const c_main = _inl_16_result;
                            const _inl_17_ix = gid_x;
                            const _inl_17_iy = gid_y;
                            let _inl_17_result;
                            _inl_17: {
                                _inl_17_result = ((_inl_17_iy * n) + _inl_17_ix);
                                break _inl_17;
                            }
                            const c = _inl_17_result;
                            const rho = _b_U0[((c_main) * 4 + 0) + 0];
                            let _inl_18_result;
                            _inl_18: {
                                _inl_18_result = (_u_U_uniforms_gravity_boundary_mode == 1);
                                break _inl_18;
                            }
                            const rho_bar = (_inl_18_result ? 0.0 : _b_rho_mean[0]);
                            _b_rhs_out[c] = (((4.0 * PI_MG) * _u_U_uniforms_gravity_G) * ((rho - rho_bar)));
                            _b_phi_out[c] = _b_phi_main[c_main];
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
                        const n = _u_mg_level_n;
                        const ghost = _u_U_uniforms_ghost_w;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        let _inl_16_result;
                        _inl_16: {
                            _inl_16_result = ((iy * n_total) + ix);
                            break _inl_16;
                        }
                        const c_main = _inl_16_result;
                        const _inl_17_ix = gid_x;
                        const _inl_17_iy = gid_y;
                        let _inl_17_result;
                        _inl_17: {
                            _inl_17_result = ((_inl_17_iy * n) + _inl_17_ix);
                            break _inl_17;
                        }
                        const c = _inl_17_result;
                        const rho = _b_U0[((c_main) * 4 + 0) + 0];
                        let _inl_18_result;
                        _inl_18: {
                            _inl_18_result = (_u_U_uniforms_gravity_boundary_mode == 1);
                            break _inl_18;
                        }
                        const rho_bar = (_inl_18_result ? 0.0 : _b_rho_mean[0]);
                        _b_rhs_out[c] = (((4.0 * PI_MG) * _u_U_uniforms_gravity_G) * ((rho - rho_bar)));
                        _b_phi_out[c] = _b_phi_main[c_main];
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
                    const n = _u_mg_level_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    let _inl_16_result;
                    _inl_16: {
                        _inl_16_result = ((iy * n_total) + ix);
                        break _inl_16;
                    }
                    const c_main = _inl_16_result;
                    const _inl_17_ix = gid_x;
                    const _inl_17_iy = gid_y;
                    let _inl_17_result;
                    _inl_17: {
                        _inl_17_result = ((_inl_17_iy * n) + _inl_17_ix);
                        break _inl_17;
                    }
                    const c = _inl_17_result;
                    const rho = _b_U0[((c_main) * 4 + 0) + 0];
                    let _inl_18_result;
                    _inl_18: {
                        _inl_18_result = (_u_U_uniforms_gravity_boundary_mode == 1);
                        break _inl_18;
                    }
                    const rho_bar = (_inl_18_result ? 0.0 : _b_rho_mean[0]);
                    _b_rhs_out[c] = (((4.0 * PI_MG) * _u_U_uniforms_gravity_G) * ((rho - rho_bar)));
                    _b_phi_out[c] = _b_phi_main[c_main];
                }
            }
        }
    }
    entry["init_level0"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_init_level0(workgroups, bindings, domain, origin);
    };

    entryInfo["smooth_level"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_smooth_level(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gravity_softening = _b_U_uniforms.gravity_softening;
        const _u_U_uniforms_gravity_poisson_omega = _b_U_uniforms.gravity_poisson_omega;
        const _b_mg = bindings.mg;
        const _u_mg_level_n = _b_mg.level_n;
        const _u_mg_stride = _b_mg.stride;
        const _b_phi_in = bindings.phi_in;
        const _b_phi_out = bindings.phi_out;
        const _b_rhs_in = bindings.rhs_in;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_mg_level_n;
        const __clipYBound = _u_mg_level_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n = _u_mg_level_n;
                        const gx = ((gid_x) | 0);
                        const gy = ((gid_y) | 0);
                        const _inl_19_ix = gid_x;
                        const _inl_19_iy = gid_y;
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = ((_inl_19_iy * n) + _inl_19_ix);
                            break _inl_19;
                        }
                        const c = _inl_19_result;
                        const l = sample_phi((gx - 1), gy, n);
                        const r = sample_phi((gx + 1), gy, n);
                        const d = sample_phi(gx, (gy - 1), n);
                        const u = sample_phi(gx, (gy + 1), n);
                        const _inl_20_stride = _u_mg_stride;
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = (_u_U_uniforms_dx * (+(((_inl_20_stride) < (1) ? (1) : (_inl_20_stride)))));
                            break _inl_20;
                        }
                        const dx = _inl_20_result;
                        const soft2 = ((_u_U_uniforms_gravity_softening > 0.0) ? (((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening)))) * ((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening))))) : 0.0);
                        const jacobi = ((((((l + r) + d) + u) - ((dx * dx) * _b_rhs_in[c]))) / (((4.0 + soft2)) < (1.0e-6) ? (1.0e-6) : ((4.0 + soft2))));
                        const omega = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_gravity_poisson_omega, 0.05, 1.95));
                        _b_phi_out[c] = (_b_phi_in[c] + (jacobi - _b_phi_in[c]) * omega);
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
                            const n = _u_mg_level_n;
                            const gx = ((gid_x) | 0);
                            const gy = ((gid_y) | 0);
                            const _inl_19_ix = gid_x;
                            const _inl_19_iy = gid_y;
                            let _inl_19_result;
                            _inl_19: {
                                _inl_19_result = ((_inl_19_iy * n) + _inl_19_ix);
                                break _inl_19;
                            }
                            const c = _inl_19_result;
                            const l = sample_phi((gx - 1), gy, n);
                            const r = sample_phi((gx + 1), gy, n);
                            const d = sample_phi(gx, (gy - 1), n);
                            const u = sample_phi(gx, (gy + 1), n);
                            const _inl_20_stride = _u_mg_stride;
                            let _inl_20_result;
                            _inl_20: {
                                _inl_20_result = (_u_U_uniforms_dx * (+(((_inl_20_stride) < (1) ? (1) : (_inl_20_stride)))));
                                break _inl_20;
                            }
                            const dx = _inl_20_result;
                            const soft2 = ((_u_U_uniforms_gravity_softening > 0.0) ? (((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening)))) * ((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening))))) : 0.0);
                            const jacobi = ((((((l + r) + d) + u) - ((dx * dx) * _b_rhs_in[c]))) / (((4.0 + soft2)) < (1.0e-6) ? (1.0e-6) : ((4.0 + soft2))));
                            const omega = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_gravity_poisson_omega, 0.05, 1.95));
                            _b_phi_out[c] = (_b_phi_in[c] + (jacobi - _b_phi_in[c]) * omega);
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
                        const n = _u_mg_level_n;
                        const gx = ((gid_x) | 0);
                        const gy = ((gid_y) | 0);
                        const _inl_19_ix = gid_x;
                        const _inl_19_iy = gid_y;
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = ((_inl_19_iy * n) + _inl_19_ix);
                            break _inl_19;
                        }
                        const c = _inl_19_result;
                        const l = sample_phi((gx - 1), gy, n);
                        const r = sample_phi((gx + 1), gy, n);
                        const d = sample_phi(gx, (gy - 1), n);
                        const u = sample_phi(gx, (gy + 1), n);
                        const _inl_20_stride = _u_mg_stride;
                        let _inl_20_result;
                        _inl_20: {
                            _inl_20_result = (_u_U_uniforms_dx * (+(((_inl_20_stride) < (1) ? (1) : (_inl_20_stride)))));
                            break _inl_20;
                        }
                        const dx = _inl_20_result;
                        const soft2 = ((_u_U_uniforms_gravity_softening > 0.0) ? (((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening)))) * ((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening))))) : 0.0);
                        const jacobi = ((((((l + r) + d) + u) - ((dx * dx) * _b_rhs_in[c]))) / (((4.0 + soft2)) < (1.0e-6) ? (1.0e-6) : ((4.0 + soft2))));
                        const omega = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_gravity_poisson_omega, 0.05, 1.95));
                        _b_phi_out[c] = (_b_phi_in[c] + (jacobi - _b_phi_in[c]) * omega);
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
                    const n = _u_mg_level_n;
                    const gx = ((gid_x) | 0);
                    const gy = ((gid_y) | 0);
                    const _inl_19_ix = gid_x;
                    const _inl_19_iy = gid_y;
                    let _inl_19_result;
                    _inl_19: {
                        _inl_19_result = ((_inl_19_iy * n) + _inl_19_ix);
                        break _inl_19;
                    }
                    const c = _inl_19_result;
                    const l = sample_phi((gx - 1), gy, n);
                    const r = sample_phi((gx + 1), gy, n);
                    const d = sample_phi(gx, (gy - 1), n);
                    const u = sample_phi(gx, (gy + 1), n);
                    const _inl_20_stride = _u_mg_stride;
                    let _inl_20_result;
                    _inl_20: {
                        _inl_20_result = (_u_U_uniforms_dx * (+(((_inl_20_stride) < (1) ? (1) : (_inl_20_stride)))));
                        break _inl_20;
                    }
                    const dx = _inl_20_result;
                    const soft2 = ((_u_U_uniforms_gravity_softening > 0.0) ? (((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening)))) * ((dx / ((_u_U_uniforms_gravity_softening) < (1.0e-30) ? (1.0e-30) : (_u_U_uniforms_gravity_softening))))) : 0.0);
                    const jacobi = ((((((l + r) + d) + u) - ((dx * dx) * _b_rhs_in[c]))) / (((4.0 + soft2)) < (1.0e-6) ? (1.0e-6) : ((4.0 + soft2))));
                    const omega = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(_u_U_uniforms_gravity_poisson_omega, 0.05, 1.95));
                    _b_phi_out[c] = (_b_phi_in[c] + (jacobi - _b_phi_in[c]) * omega);
                }
            }
        }
    }
    entry["smooth_level"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_smooth_level(workgroups, bindings, domain, origin);
    };

    entryInfo["restrict_residual"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_restrict_residual(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _b_mg = bindings.mg;
        const _u_mg_level_n = _b_mg.level_n;
        const _u_mg_stride = _b_mg.stride;
        const _b_phi_out = bindings.phi_out;
        const _b_rhs_out = bindings.rhs_out;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_mg_level_n;
        const __clipYBound = _u_mg_level_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n_coarse = _u_mg_level_n;
                        const n_fine = (n_coarse * 2);
                        const stride_fine = (((_u_mg_stride / 2)) < (1) ? (1) : ((_u_mg_stride / 2)));
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = (_u_U_uniforms_dx * (+(((stride_fine) < (1) ? (1) : (stride_fine)))));
                            break _inl_21;
                        }
                        const dx_fine = _inl_21_result;
                        const fx = (((gid_x * 2)) | 0);
                        const fy = (((gid_y * 2)) | 0);
                        const r_c = residual_at(fx, fy, n_fine, dx_fine);
                        const r_l = residual_at((fx - 1), fy, n_fine, dx_fine);
                        const r_r = residual_at((fx + 1), fy, n_fine, dx_fine);
                        const r_d = residual_at(fx, (fy - 1), n_fine, dx_fine);
                        const r_u = residual_at(fx, (fy + 1), n_fine, dx_fine);
                        const r_ld = residual_at((fx - 1), (fy - 1), n_fine, dx_fine);
                        const r_lu = residual_at((fx - 1), (fy + 1), n_fine, dx_fine);
                        const r_rd = residual_at((fx + 1), (fy - 1), n_fine, dx_fine);
                        const r_ru = residual_at((fx + 1), (fy + 1), n_fine, dx_fine);
                        const _inl_22_ix = gid_x;
                        const _inl_22_iy = gid_y;
                        let _inl_22_result;
                        _inl_22: {
                            _inl_22_result = ((_inl_22_iy * n_coarse) + _inl_22_ix);
                            break _inl_22;
                        }
                        const c = _inl_22_result;
                        _b_rhs_out[c] = (((((4.0 * r_c) + (2.0 * ((((r_l + r_r) + r_d) + r_u)))) + ((((r_ld + r_lu) + r_rd) + r_ru)))) / 16.0);
                        _b_phi_out[c] = 0.0;
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
                            const n_coarse = _u_mg_level_n;
                            const n_fine = (n_coarse * 2);
                            const stride_fine = (((_u_mg_stride / 2)) < (1) ? (1) : ((_u_mg_stride / 2)));
                            let _inl_21_result;
                            _inl_21: {
                                _inl_21_result = (_u_U_uniforms_dx * (+(((stride_fine) < (1) ? (1) : (stride_fine)))));
                                break _inl_21;
                            }
                            const dx_fine = _inl_21_result;
                            const fx = (((gid_x * 2)) | 0);
                            const fy = (((gid_y * 2)) | 0);
                            const r_c = residual_at(fx, fy, n_fine, dx_fine);
                            const r_l = residual_at((fx - 1), fy, n_fine, dx_fine);
                            const r_r = residual_at((fx + 1), fy, n_fine, dx_fine);
                            const r_d = residual_at(fx, (fy - 1), n_fine, dx_fine);
                            const r_u = residual_at(fx, (fy + 1), n_fine, dx_fine);
                            const r_ld = residual_at((fx - 1), (fy - 1), n_fine, dx_fine);
                            const r_lu = residual_at((fx - 1), (fy + 1), n_fine, dx_fine);
                            const r_rd = residual_at((fx + 1), (fy - 1), n_fine, dx_fine);
                            const r_ru = residual_at((fx + 1), (fy + 1), n_fine, dx_fine);
                            const _inl_22_ix = gid_x;
                            const _inl_22_iy = gid_y;
                            let _inl_22_result;
                            _inl_22: {
                                _inl_22_result = ((_inl_22_iy * n_coarse) + _inl_22_ix);
                                break _inl_22;
                            }
                            const c = _inl_22_result;
                            _b_rhs_out[c] = (((((4.0 * r_c) + (2.0 * ((((r_l + r_r) + r_d) + r_u)))) + ((((r_ld + r_lu) + r_rd) + r_ru)))) / 16.0);
                            _b_phi_out[c] = 0.0;
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
                        const n_coarse = _u_mg_level_n;
                        const n_fine = (n_coarse * 2);
                        const stride_fine = (((_u_mg_stride / 2)) < (1) ? (1) : ((_u_mg_stride / 2)));
                        let _inl_21_result;
                        _inl_21: {
                            _inl_21_result = (_u_U_uniforms_dx * (+(((stride_fine) < (1) ? (1) : (stride_fine)))));
                            break _inl_21;
                        }
                        const dx_fine = _inl_21_result;
                        const fx = (((gid_x * 2)) | 0);
                        const fy = (((gid_y * 2)) | 0);
                        const r_c = residual_at(fx, fy, n_fine, dx_fine);
                        const r_l = residual_at((fx - 1), fy, n_fine, dx_fine);
                        const r_r = residual_at((fx + 1), fy, n_fine, dx_fine);
                        const r_d = residual_at(fx, (fy - 1), n_fine, dx_fine);
                        const r_u = residual_at(fx, (fy + 1), n_fine, dx_fine);
                        const r_ld = residual_at((fx - 1), (fy - 1), n_fine, dx_fine);
                        const r_lu = residual_at((fx - 1), (fy + 1), n_fine, dx_fine);
                        const r_rd = residual_at((fx + 1), (fy - 1), n_fine, dx_fine);
                        const r_ru = residual_at((fx + 1), (fy + 1), n_fine, dx_fine);
                        const _inl_22_ix = gid_x;
                        const _inl_22_iy = gid_y;
                        let _inl_22_result;
                        _inl_22: {
                            _inl_22_result = ((_inl_22_iy * n_coarse) + _inl_22_ix);
                            break _inl_22;
                        }
                        const c = _inl_22_result;
                        _b_rhs_out[c] = (((((4.0 * r_c) + (2.0 * ((((r_l + r_r) + r_d) + r_u)))) + ((((r_ld + r_lu) + r_rd) + r_ru)))) / 16.0);
                        _b_phi_out[c] = 0.0;
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
                    const n_coarse = _u_mg_level_n;
                    const n_fine = (n_coarse * 2);
                    const stride_fine = (((_u_mg_stride / 2)) < (1) ? (1) : ((_u_mg_stride / 2)));
                    let _inl_21_result;
                    _inl_21: {
                        _inl_21_result = (_u_U_uniforms_dx * (+(((stride_fine) < (1) ? (1) : (stride_fine)))));
                        break _inl_21;
                    }
                    const dx_fine = _inl_21_result;
                    const fx = (((gid_x * 2)) | 0);
                    const fy = (((gid_y * 2)) | 0);
                    const r_c = residual_at(fx, fy, n_fine, dx_fine);
                    const r_l = residual_at((fx - 1), fy, n_fine, dx_fine);
                    const r_r = residual_at((fx + 1), fy, n_fine, dx_fine);
                    const r_d = residual_at(fx, (fy - 1), n_fine, dx_fine);
                    const r_u = residual_at(fx, (fy + 1), n_fine, dx_fine);
                    const r_ld = residual_at((fx - 1), (fy - 1), n_fine, dx_fine);
                    const r_lu = residual_at((fx - 1), (fy + 1), n_fine, dx_fine);
                    const r_rd = residual_at((fx + 1), (fy - 1), n_fine, dx_fine);
                    const r_ru = residual_at((fx + 1), (fy + 1), n_fine, dx_fine);
                    const _inl_22_ix = gid_x;
                    const _inl_22_iy = gid_y;
                    let _inl_22_result;
                    _inl_22: {
                        _inl_22_result = ((_inl_22_iy * n_coarse) + _inl_22_ix);
                        break _inl_22;
                    }
                    const c = _inl_22_result;
                    _b_rhs_out[c] = (((((4.0 * r_c) + (2.0 * ((((r_l + r_r) + r_d) + r_u)))) + ((((r_ld + r_lu) + r_rd) + r_ru)))) / 16.0);
                    _b_phi_out[c] = 0.0;
                }
            }
        }
    }
    entry["restrict_residual"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_restrict_residual(workgroups, bindings, domain, origin);
    };

    entryInfo["prolongate_add"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_3_prolongate_add(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_mg = bindings.mg;
        const _u_mg_level_n = _b_mg.level_n;
        const _b_phi_in = bindings.phi_in;
        const _b_phi_out = bindings.phi_out;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_mg_level_n;
        const __clipYBound = _u_mg_level_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n_fine = _u_mg_level_n;
                        const n_coarse = (((n_fine / 2)) < (1) ? (1) : ((n_fine / 2)));
                        const ux = (((((+(gid_x)) + 0.5)) * 0.5) - 0.5);
                        const uy = (((((+(gid_y)) + 0.5)) * 0.5) - 0.5);
                        const x0 = ((Math.floor(ux)) | 0);
                        const y0 = ((Math.floor(uy)) | 0);
                        const tx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ux - Math.floor(ux)), 0.0, 1.0));
                        const ty = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((uy - Math.floor(uy)), 0.0, 1.0));
                        const c00 = sample_coarse(x0, y0, n_coarse);
                        const c10 = sample_coarse((x0 + 1), y0, n_coarse);
                        const c01 = sample_coarse(x0, (y0 + 1), n_coarse);
                        const c11 = sample_coarse((x0 + 1), (y0 + 1), n_coarse);
                        const e0 = (c00 + (c10 - c00) * tx);
                        const e1 = (c01 + (c11 - c01) * tx);
                        const corr = (e0 + (e1 - e0) * ty);
                        const _inl_23_ix = gid_x;
                        const _inl_23_iy = gid_y;
                        let _inl_23_result;
                        _inl_23: {
                            _inl_23_result = ((_inl_23_iy * n_fine) + _inl_23_ix);
                            break _inl_23;
                        }
                        const c = _inl_23_result;
                        _b_phi_out[c] = (_b_phi_in[c] + corr);
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
                            const n_fine = _u_mg_level_n;
                            const n_coarse = (((n_fine / 2)) < (1) ? (1) : ((n_fine / 2)));
                            const ux = (((((+(gid_x)) + 0.5)) * 0.5) - 0.5);
                            const uy = (((((+(gid_y)) + 0.5)) * 0.5) - 0.5);
                            const x0 = ((Math.floor(ux)) | 0);
                            const y0 = ((Math.floor(uy)) | 0);
                            const tx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ux - Math.floor(ux)), 0.0, 1.0));
                            const ty = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((uy - Math.floor(uy)), 0.0, 1.0));
                            const c00 = sample_coarse(x0, y0, n_coarse);
                            const c10 = sample_coarse((x0 + 1), y0, n_coarse);
                            const c01 = sample_coarse(x0, (y0 + 1), n_coarse);
                            const c11 = sample_coarse((x0 + 1), (y0 + 1), n_coarse);
                            const e0 = (c00 + (c10 - c00) * tx);
                            const e1 = (c01 + (c11 - c01) * tx);
                            const corr = (e0 + (e1 - e0) * ty);
                            const _inl_23_ix = gid_x;
                            const _inl_23_iy = gid_y;
                            let _inl_23_result;
                            _inl_23: {
                                _inl_23_result = ((_inl_23_iy * n_fine) + _inl_23_ix);
                                break _inl_23;
                            }
                            const c = _inl_23_result;
                            _b_phi_out[c] = (_b_phi_in[c] + corr);
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
                        const n_fine = _u_mg_level_n;
                        const n_coarse = (((n_fine / 2)) < (1) ? (1) : ((n_fine / 2)));
                        const ux = (((((+(gid_x)) + 0.5)) * 0.5) - 0.5);
                        const uy = (((((+(gid_y)) + 0.5)) * 0.5) - 0.5);
                        const x0 = ((Math.floor(ux)) | 0);
                        const y0 = ((Math.floor(uy)) | 0);
                        const tx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ux - Math.floor(ux)), 0.0, 1.0));
                        const ty = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((uy - Math.floor(uy)), 0.0, 1.0));
                        const c00 = sample_coarse(x0, y0, n_coarse);
                        const c10 = sample_coarse((x0 + 1), y0, n_coarse);
                        const c01 = sample_coarse(x0, (y0 + 1), n_coarse);
                        const c11 = sample_coarse((x0 + 1), (y0 + 1), n_coarse);
                        const e0 = (c00 + (c10 - c00) * tx);
                        const e1 = (c01 + (c11 - c01) * tx);
                        const corr = (e0 + (e1 - e0) * ty);
                        const _inl_23_ix = gid_x;
                        const _inl_23_iy = gid_y;
                        let _inl_23_result;
                        _inl_23: {
                            _inl_23_result = ((_inl_23_iy * n_fine) + _inl_23_ix);
                            break _inl_23;
                        }
                        const c = _inl_23_result;
                        _b_phi_out[c] = (_b_phi_in[c] + corr);
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
                    const n_fine = _u_mg_level_n;
                    const n_coarse = (((n_fine / 2)) < (1) ? (1) : ((n_fine / 2)));
                    const ux = (((((+(gid_x)) + 0.5)) * 0.5) - 0.5);
                    const uy = (((((+(gid_y)) + 0.5)) * 0.5) - 0.5);
                    const x0 = ((Math.floor(ux)) | 0);
                    const y0 = ((Math.floor(uy)) | 0);
                    const tx = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ux - Math.floor(ux)), 0.0, 1.0));
                    const ty = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((uy - Math.floor(uy)), 0.0, 1.0));
                    const c00 = sample_coarse(x0, y0, n_coarse);
                    const c10 = sample_coarse((x0 + 1), y0, n_coarse);
                    const c01 = sample_coarse(x0, (y0 + 1), n_coarse);
                    const c11 = sample_coarse((x0 + 1), (y0 + 1), n_coarse);
                    const e0 = (c00 + (c10 - c00) * tx);
                    const e1 = (c01 + (c11 - c01) * tx);
                    const corr = (e0 + (e1 - e0) * ty);
                    const _inl_23_ix = gid_x;
                    const _inl_23_iy = gid_y;
                    let _inl_23_result;
                    _inl_23: {
                        _inl_23_result = ((_inl_23_iy * n_fine) + _inl_23_ix);
                        break _inl_23;
                    }
                    const c = _inl_23_result;
                    _b_phi_out[c] = (_b_phi_in[c] + corr);
                }
            }
        }
    }
    entry["prolongate_add"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_3_prolongate_add(workgroups, bindings, domain, origin);
    };

    entryInfo["copy_to_main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_4_copy_to_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_mg = bindings.mg;
        const _u_mg_level_n = _b_mg.level_n;
        const _b_phi_main = bindings.phi_main;
        const _b_phi_in = bindings.phi_in;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        const __clipXBound = _u_mg_level_n;
        const __clipYBound = _u_mg_level_n;
        if (Gy === 1 && Gz === 1) {
            if (Oy < __clipYBound) {
                const __clipXn = Math.min(Xn, __clipXBound);
                for (let __gx = Ox; __gx < __clipXn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = Oy;
                    {
                        const n = _u_mg_level_n;
                        const ghost = _u_U_uniforms_ghost_w;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const _inl_24_ix = (gid_x + ghost);
                        const _inl_24_iy = (gid_y + ghost);
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = ((_inl_24_iy * n_total) + _inl_24_ix);
                            break _inl_24;
                        }
                        const c_main = _inl_24_result;
                        const _inl_25_ix = gid_x;
                        const _inl_25_iy = gid_y;
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = ((_inl_25_iy * n) + _inl_25_ix);
                            break _inl_25;
                        }
                        _b_phi_main[c_main] = _b_phi_in[_inl_25_result];
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
                            const n = _u_mg_level_n;
                            const ghost = _u_U_uniforms_ghost_w;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const _inl_24_ix = (gid_x + ghost);
                            const _inl_24_iy = (gid_y + ghost);
                            let _inl_24_result;
                            _inl_24: {
                                _inl_24_result = ((_inl_24_iy * n_total) + _inl_24_ix);
                                break _inl_24;
                            }
                            const c_main = _inl_24_result;
                            const _inl_25_ix = gid_x;
                            const _inl_25_iy = gid_y;
                            let _inl_25_result;
                            _inl_25: {
                                _inl_25_result = ((_inl_25_iy * n) + _inl_25_ix);
                                break _inl_25;
                            }
                            _b_phi_main[c_main] = _b_phi_in[_inl_25_result];
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
                        const n = _u_mg_level_n;
                        const ghost = _u_U_uniforms_ghost_w;
                        const n_total = _u_U_uniforms_grid_n_total;
                        const _inl_24_ix = (gid_x + ghost);
                        const _inl_24_iy = (gid_y + ghost);
                        let _inl_24_result;
                        _inl_24: {
                            _inl_24_result = ((_inl_24_iy * n_total) + _inl_24_ix);
                            break _inl_24;
                        }
                        const c_main = _inl_24_result;
                        const _inl_25_ix = gid_x;
                        const _inl_25_iy = gid_y;
                        let _inl_25_result;
                        _inl_25: {
                            _inl_25_result = ((_inl_25_iy * n) + _inl_25_ix);
                            break _inl_25;
                        }
                        _b_phi_main[c_main] = _b_phi_in[_inl_25_result];
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
                    const n = _u_mg_level_n;
                    const ghost = _u_U_uniforms_ghost_w;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const _inl_24_ix = (gid_x + ghost);
                    const _inl_24_iy = (gid_y + ghost);
                    let _inl_24_result;
                    _inl_24: {
                        _inl_24_result = ((_inl_24_iy * n_total) + _inl_24_ix);
                        break _inl_24;
                    }
                    const c_main = _inl_24_result;
                    const _inl_25_ix = gid_x;
                    const _inl_25_iy = gid_y;
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = ((_inl_25_iy * n) + _inl_25_ix);
                        break _inl_25;
                    }
                    _b_phi_main[c_main] = _b_phi_in[_inl_25_result];
                }
            }
        }
    }
    entry["copy_to_main"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_4_copy_to_main(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["init_level0"] = function (workgroups, domain, origin) {
            return __entry_0_init_level0(workgroups, bindings, domain, origin);
        };
        bound["smooth_level"] = function (workgroups, domain, origin) {
            return __entry_1_smooth_level(workgroups, bindings, domain, origin);
        };
        bound["restrict_residual"] = function (workgroups, domain, origin) {
            return __entry_2_restrict_residual(workgroups, bindings, domain, origin);
        };
        bound["prolongate_add"] = function (workgroups, domain, origin) {
            return __entry_3_prolongate_add(workgroups, bindings, domain, origin);
        };
        bound["copy_to_main"] = function (workgroups, domain, origin) {
            return __entry_4_copy_to_main(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","mg","U0","rho_mean","phi_main","phi_in","phi_out","rhs_in","rhs_out","phi_coarse"], entryInfo };
}
