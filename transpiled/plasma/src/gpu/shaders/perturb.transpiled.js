// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/perturb.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: d2f50f967e4ad9c459e1b68d2c250f48bdbf2738edaf500dd8e0a42120c03545
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":55766,"lines":1107,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.655Z
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
    const PERTURB_GAUSS_CULL = 1.0e-4;

    function excite_az(x, y) {
        const rx = (x - bindings.p.cx);
        const ry = (y - bindings.p.cy);
        const r2 = ((rx * rx) + (ry * ry));
        const sigma2 = (((bindings.p.sigma * bindings.p.sigma)) < (1.0e-12) ? (1.0e-12) : ((bindings.p.sigma * bindings.p.sigma)));
        const g = Math.exp((((-0.5) * r2) / sigma2));
        return ((bindings.p.amplitude * (((bindings.p.dvec_x * ry) - (bindings.p.dvec_y * rx)))) * g);
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["apply_drag"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_apply_drag(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0 = bindings.U0;
        const _b_U1 = bindings.U1;
        const _b_p = bindings.p;
        const _u_p_cx = _b_p.cx;
        const _u_p_cy = _b_p.cy;
        const _u_p_dvec_x = _b_p.dvec_x;
        const _u_p_dvec_y = _b_p.dvec_y;
        const _u_p_sigma = _b_p.sigma;
        const _u_p_amplitude = _b_p.amplitude;
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix >= n) || (iy >= n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const i = (ix + ghost);
                    const j = (iy + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((j * nT) + i);
                        break _inl_6;
                    }
                    const idx = _inl_6_result;
                    const dxv = _u_U_uniforms_dx;
                    const x = ((((+(ix)) + 0.5)) * dxv);
                    const y = ((((+(iy)) + 0.5)) * dxv);
                    let _inl_7_result;
                    _inl_7: {
                        const _inl_7_rx = (x - _u_p_cx);
                        const _inl_7_ry = (y - _u_p_cy);
                        const _inl_7_r2 = ((_inl_7_rx * _inl_7_rx) + (_inl_7_ry * _inl_7_ry));
                        const _inl_7_sigma2 = (((_u_p_sigma * _u_p_sigma)) < (1.0e-12) ? (1.0e-12) : ((_u_p_sigma * _u_p_sigma)));
                        _inl_7_result = Math.exp((((-0.5) * _inl_7_r2) / _inl_7_sigma2));
                        break _inl_7;
                    }
                    const w = _inl_7_result;
                    if ((w < PERTURB_GAUSS_CULL)) {
                        break __invocation;
                    }
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const _sroa_0_base = ((idx) * 4 + 0);
                    const u0_old_x = _b_U0[_sroa_0_base + 0];
                    const u0_old_y = _b_U0[_sroa_0_base + 1];
                    const u0_old_z = _b_U0[_sroa_0_base + 2];
                    const u0_old_w = _b_U0[_sroa_0_base + 3];
                    const rho = ((u0_old_x) < (1.0e-12) ? (1.0e-12) : (u0_old_x));
                    const dmx = (((_u_p_amplitude * w) * _u_p_dvec_x) * rho);
                    const dmy = (((_u_p_amplitude * w) * _u_p_dvec_y) * rho);
                    const mvx_old = u0_old_y;
                    const mvy_old = u0_old_z;
                    const dKE = (((((mvx_old * dmx) + (mvy_old * dmy))) / rho) + ((0.5 * (((dmx * dmx) + (dmy * dmy)))) / rho));
                    let u0_x = u0_old_x;
                    let u0_y = u0_old_y;
                    let u0_z = u0_old_z;
                    let u0_w = u0_old_w;
                    u0_y = (mvx_old + dmx);
                    u0_z = (mvy_old + dmy);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u0_x;
                        const _wt1 = u0_y;
                        const _wt2 = u0_z;
                        const _wt3 = u0_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _sroa_1_base = ((idx) * 4 + 0);
                    let u1_x = _b_U1[_sroa_1_base + 0];
                    let u1_y = _b_U1[_sroa_1_base + 1];
                    let u1_z = _b_U1[_sroa_1_base + 2];
                    let u1_w = _b_U1[_sroa_1_base + 3];
                    u1_x = (u1_x + dKE);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u1_x;
                        const _wt1 = u1_y;
                        const _wt2 = u1_z;
                        const _wt3 = u1_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const n = _u_U_uniforms_grid_n;
                            const ix = gid_x;
                            const iy = gid_y;
                            if (((ix >= n) || (iy >= n))) {
                                break __invocation;
                            }
                            const ghost = _u_U_uniforms_ghost_w;
                            const nT = _u_U_uniforms_grid_n_total;
                            const i = (ix + ghost);
                            const j = (iy + ghost);
                            let _inl_6_result;
                            _inl_6: {
                                _inl_6_result = ((j * nT) + i);
                                break _inl_6;
                            }
                            const idx = _inl_6_result;
                            const dxv = _u_U_uniforms_dx;
                            const x = ((((+(ix)) + 0.5)) * dxv);
                            const y = ((((+(iy)) + 0.5)) * dxv);
                            let _inl_7_result;
                            _inl_7: {
                                const _inl_7_rx = (x - _u_p_cx);
                                const _inl_7_ry = (y - _u_p_cy);
                                const _inl_7_r2 = ((_inl_7_rx * _inl_7_rx) + (_inl_7_ry * _inl_7_ry));
                                const _inl_7_sigma2 = (((_u_p_sigma * _u_p_sigma)) < (1.0e-12) ? (1.0e-12) : ((_u_p_sigma * _u_p_sigma)));
                                _inl_7_result = Math.exp((((-0.5) * _inl_7_r2) / _inl_7_sigma2));
                                break _inl_7;
                            }
                            const w = _inl_7_result;
                            if ((w < PERTURB_GAUSS_CULL)) {
                                break __invocation;
                            }
                            const p_floor = _u_U_uniforms_pressure_floor;
                            const _sroa_2_base = ((idx) * 4 + 0);
                            const u0_old_x = _b_U0[_sroa_2_base + 0];
                            const u0_old_y = _b_U0[_sroa_2_base + 1];
                            const u0_old_z = _b_U0[_sroa_2_base + 2];
                            const u0_old_w = _b_U0[_sroa_2_base + 3];
                            const rho = ((u0_old_x) < (1.0e-12) ? (1.0e-12) : (u0_old_x));
                            const dmx = (((_u_p_amplitude * w) * _u_p_dvec_x) * rho);
                            const dmy = (((_u_p_amplitude * w) * _u_p_dvec_y) * rho);
                            const mvx_old = u0_old_y;
                            const mvy_old = u0_old_z;
                            const dKE = (((((mvx_old * dmx) + (mvy_old * dmy))) / rho) + ((0.5 * (((dmx * dmx) + (dmy * dmy)))) / rho));
                            let u0_x = u0_old_x;
                            let u0_y = u0_old_y;
                            let u0_z = u0_old_z;
                            let u0_w = u0_old_w;
                            u0_y = (mvx_old + dmx);
                            u0_z = (mvy_old + dmy);
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = u0_x;
                                const _wt1 = u0_y;
                                const _wt2 = u0_z;
                                const _wt3 = u0_w;
                                _b_U0[_wbase + 0] = _wt0;
                                _b_U0[_wbase + 1] = _wt1;
                                _b_U0[_wbase + 2] = _wt2;
                                _b_U0[_wbase + 3] = _wt3;
                            }
                            const _sroa_3_base = ((idx) * 4 + 0);
                            let u1_x = _b_U1[_sroa_3_base + 0];
                            let u1_y = _b_U1[_sroa_3_base + 1];
                            let u1_z = _b_U1[_sroa_3_base + 2];
                            let u1_w = _b_U1[_sroa_3_base + 3];
                            u1_x = (u1_x + dKE);
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = u1_x;
                                const _wt1 = u1_y;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const n = _u_U_uniforms_grid_n;
                        const ix = gid_x;
                        const iy = gid_y;
                        if (((ix >= n) || (iy >= n))) {
                            break __invocation;
                        }
                        const ghost = _u_U_uniforms_ghost_w;
                        const nT = _u_U_uniforms_grid_n_total;
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((j * nT) + i);
                            break _inl_6;
                        }
                        const idx = _inl_6_result;
                        const dxv = _u_U_uniforms_dx;
                        const x = ((((+(ix)) + 0.5)) * dxv);
                        const y = ((((+(iy)) + 0.5)) * dxv);
                        let _inl_7_result;
                        _inl_7: {
                            const _inl_7_rx = (x - _u_p_cx);
                            const _inl_7_ry = (y - _u_p_cy);
                            const _inl_7_r2 = ((_inl_7_rx * _inl_7_rx) + (_inl_7_ry * _inl_7_ry));
                            const _inl_7_sigma2 = (((_u_p_sigma * _u_p_sigma)) < (1.0e-12) ? (1.0e-12) : ((_u_p_sigma * _u_p_sigma)));
                            _inl_7_result = Math.exp((((-0.5) * _inl_7_r2) / _inl_7_sigma2));
                            break _inl_7;
                        }
                        const w = _inl_7_result;
                        if ((w < PERTURB_GAUSS_CULL)) {
                            break __invocation;
                        }
                        const p_floor = _u_U_uniforms_pressure_floor;
                        const _sroa_4_base = ((idx) * 4 + 0);
                        const u0_old_x = _b_U0[_sroa_4_base + 0];
                        const u0_old_y = _b_U0[_sroa_4_base + 1];
                        const u0_old_z = _b_U0[_sroa_4_base + 2];
                        const u0_old_w = _b_U0[_sroa_4_base + 3];
                        const rho = ((u0_old_x) < (1.0e-12) ? (1.0e-12) : (u0_old_x));
                        const dmx = (((_u_p_amplitude * w) * _u_p_dvec_x) * rho);
                        const dmy = (((_u_p_amplitude * w) * _u_p_dvec_y) * rho);
                        const mvx_old = u0_old_y;
                        const mvy_old = u0_old_z;
                        const dKE = (((((mvx_old * dmx) + (mvy_old * dmy))) / rho) + ((0.5 * (((dmx * dmx) + (dmy * dmy)))) / rho));
                        let u0_x = u0_old_x;
                        let u0_y = u0_old_y;
                        let u0_z = u0_old_z;
                        let u0_w = u0_old_w;
                        u0_y = (mvx_old + dmx);
                        u0_z = (mvy_old + dmy);
                        {
                            const _wbase = ((idx) * 4 + 0);
                            const _wt0 = u0_x;
                            const _wt1 = u0_y;
                            const _wt2 = u0_z;
                            const _wt3 = u0_w;
                            _b_U0[_wbase + 0] = _wt0;
                            _b_U0[_wbase + 1] = _wt1;
                            _b_U0[_wbase + 2] = _wt2;
                            _b_U0[_wbase + 3] = _wt3;
                        }
                        const _sroa_5_base = ((idx) * 4 + 0);
                        let u1_x = _b_U1[_sroa_5_base + 0];
                        let u1_y = _b_U1[_sroa_5_base + 1];
                        let u1_z = _b_U1[_sroa_5_base + 2];
                        let u1_w = _b_U1[_sroa_5_base + 3];
                        u1_x = (u1_x + dKE);
                        {
                            const _wbase = ((idx) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix >= n) || (iy >= n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const i = (ix + ghost);
                    const j = (iy + ghost);
                    let _inl_6_result;
                    _inl_6: {
                        _inl_6_result = ((j * nT) + i);
                        break _inl_6;
                    }
                    const idx = _inl_6_result;
                    const dxv = _u_U_uniforms_dx;
                    const x = ((((+(ix)) + 0.5)) * dxv);
                    const y = ((((+(iy)) + 0.5)) * dxv);
                    let _inl_7_result;
                    _inl_7: {
                        const _inl_7_rx = (x - _u_p_cx);
                        const _inl_7_ry = (y - _u_p_cy);
                        const _inl_7_r2 = ((_inl_7_rx * _inl_7_rx) + (_inl_7_ry * _inl_7_ry));
                        const _inl_7_sigma2 = (((_u_p_sigma * _u_p_sigma)) < (1.0e-12) ? (1.0e-12) : ((_u_p_sigma * _u_p_sigma)));
                        _inl_7_result = Math.exp((((-0.5) * _inl_7_r2) / _inl_7_sigma2));
                        break _inl_7;
                    }
                    const w = _inl_7_result;
                    if ((w < PERTURB_GAUSS_CULL)) {
                        break __invocation;
                    }
                    const p_floor = _u_U_uniforms_pressure_floor;
                    const _sroa_6_base = ((idx) * 4 + 0);
                    const u0_old_x = _b_U0[_sroa_6_base + 0];
                    const u0_old_y = _b_U0[_sroa_6_base + 1];
                    const u0_old_z = _b_U0[_sroa_6_base + 2];
                    const u0_old_w = _b_U0[_sroa_6_base + 3];
                    const rho = ((u0_old_x) < (1.0e-12) ? (1.0e-12) : (u0_old_x));
                    const dmx = (((_u_p_amplitude * w) * _u_p_dvec_x) * rho);
                    const dmy = (((_u_p_amplitude * w) * _u_p_dvec_y) * rho);
                    const mvx_old = u0_old_y;
                    const mvy_old = u0_old_z;
                    const dKE = (((((mvx_old * dmx) + (mvy_old * dmy))) / rho) + ((0.5 * (((dmx * dmx) + (dmy * dmy)))) / rho));
                    let u0_x = u0_old_x;
                    let u0_y = u0_old_y;
                    let u0_z = u0_old_z;
                    let u0_w = u0_old_w;
                    u0_y = (mvx_old + dmx);
                    u0_z = (mvy_old + dmy);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u0_x;
                        const _wt1 = u0_y;
                        const _wt2 = u0_z;
                        const _wt3 = u0_w;
                        _b_U0[_wbase + 0] = _wt0;
                        _b_U0[_wbase + 1] = _wt1;
                        _b_U0[_wbase + 2] = _wt2;
                        _b_U0[_wbase + 3] = _wt3;
                    }
                    const _sroa_7_base = ((idx) * 4 + 0);
                    let u1_x = _b_U1[_sroa_7_base + 0];
                    let u1_y = _b_U1[_sroa_7_base + 1];
                    let u1_z = _b_U1[_sroa_7_base + 2];
                    let u1_w = _b_U1[_sroa_7_base + 3];
                    u1_x = (u1_x + dKE);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u1_x;
                        const _wt1 = u1_y;
                        const _wt2 = u1_z;
                        const _wt3 = u1_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["apply_drag"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_apply_drag(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_excite_b"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_1_apply_excite_b(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix > n) || (iy > n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const dxv = _u_U_uniforms_dx;
                    const x0 = ((+(ix)) * dxv);
                    const y0 = ((+(iy)) * dxv);
                    const x1 = (x0 + dxv);
                    const y1 = (y0 + dxv);
                    const az_00 = excite_az(x0, y0);
                    const az_10 = excite_az(x1, y0);
                    const az_01 = excite_az(x0, y1);
                    if (((ix <= n) && (iy < n))) {
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        const dBx = (((az_01 - az_00)) / dxv);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((j * ((nT + 1))) + i);
                            break _inl_8;
                        }
                        const bxi = _inl_8_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] + dBx);
                    }
                    if (((ix < n) && (iy <= n))) {
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        const dBy = ((-((az_10 - az_00))) / dxv);
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((j * nT) + i);
                            break _inl_9;
                        }
                        const byi = _inl_9_result;
                        _b_By_face[byi] = (_b_By_face[byi] + dBy);
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const n = _u_U_uniforms_grid_n;
                            const ix = gid_x;
                            const iy = gid_y;
                            if (((ix > n) || (iy > n))) {
                                break __invocation;
                            }
                            const ghost = _u_U_uniforms_ghost_w;
                            const nT = _u_U_uniforms_grid_n_total;
                            const dxv = _u_U_uniforms_dx;
                            const x0 = ((+(ix)) * dxv);
                            const y0 = ((+(iy)) * dxv);
                            const x1 = (x0 + dxv);
                            const y1 = (y0 + dxv);
                            const az_00 = excite_az(x0, y0);
                            const az_10 = excite_az(x1, y0);
                            const az_01 = excite_az(x0, y1);
                            if (((ix <= n) && (iy < n))) {
                                const i = (ix + ghost);
                                const j = (iy + ghost);
                                const dBx = (((az_01 - az_00)) / dxv);
                                let _inl_8_result;
                                _inl_8: {
                                    _inl_8_result = ((j * ((nT + 1))) + i);
                                    break _inl_8;
                                }
                                const bxi = _inl_8_result;
                                _b_Bx_face[bxi] = (_b_Bx_face[bxi] + dBx);
                            }
                            if (((ix < n) && (iy <= n))) {
                                const i = (ix + ghost);
                                const j = (iy + ghost);
                                const dBy = ((-((az_10 - az_00))) / dxv);
                                let _inl_9_result;
                                _inl_9: {
                                    _inl_9_result = ((j * nT) + i);
                                    break _inl_9;
                                }
                                const byi = _inl_9_result;
                                _b_By_face[byi] = (_b_By_face[byi] + dBy);
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const n = _u_U_uniforms_grid_n;
                        const ix = gid_x;
                        const iy = gid_y;
                        if (((ix > n) || (iy > n))) {
                            break __invocation;
                        }
                        const ghost = _u_U_uniforms_ghost_w;
                        const nT = _u_U_uniforms_grid_n_total;
                        const dxv = _u_U_uniforms_dx;
                        const x0 = ((+(ix)) * dxv);
                        const y0 = ((+(iy)) * dxv);
                        const x1 = (x0 + dxv);
                        const y1 = (y0 + dxv);
                        const az_00 = excite_az(x0, y0);
                        const az_10 = excite_az(x1, y0);
                        const az_01 = excite_az(x0, y1);
                        if (((ix <= n) && (iy < n))) {
                            const i = (ix + ghost);
                            const j = (iy + ghost);
                            const dBx = (((az_01 - az_00)) / dxv);
                            let _inl_8_result;
                            _inl_8: {
                                _inl_8_result = ((j * ((nT + 1))) + i);
                                break _inl_8;
                            }
                            const bxi = _inl_8_result;
                            _b_Bx_face[bxi] = (_b_Bx_face[bxi] + dBx);
                        }
                        if (((ix < n) && (iy <= n))) {
                            const i = (ix + ghost);
                            const j = (iy + ghost);
                            const dBy = ((-((az_10 - az_00))) / dxv);
                            let _inl_9_result;
                            _inl_9: {
                                _inl_9_result = ((j * nT) + i);
                                break _inl_9;
                            }
                            const byi = _inl_9_result;
                            _b_By_face[byi] = (_b_By_face[byi] + dBy);
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix > n) || (iy > n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const dxv = _u_U_uniforms_dx;
                    const x0 = ((+(ix)) * dxv);
                    const y0 = ((+(iy)) * dxv);
                    const x1 = (x0 + dxv);
                    const y1 = (y0 + dxv);
                    const az_00 = excite_az(x0, y0);
                    const az_10 = excite_az(x1, y0);
                    const az_01 = excite_az(x0, y1);
                    if (((ix <= n) && (iy < n))) {
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        const dBx = (((az_01 - az_00)) / dxv);
                        let _inl_8_result;
                        _inl_8: {
                            _inl_8_result = ((j * ((nT + 1))) + i);
                            break _inl_8;
                        }
                        const bxi = _inl_8_result;
                        _b_Bx_face[bxi] = (_b_Bx_face[bxi] + dBx);
                    }
                    if (((ix < n) && (iy <= n))) {
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        const dBy = ((-((az_10 - az_00))) / dxv);
                        let _inl_9_result;
                        _inl_9: {
                            _inl_9_result = ((j * nT) + i);
                            break _inl_9;
                        }
                        const byi = _inl_9_result;
                        _b_By_face[byi] = (_b_By_face[byi] + dBy);
                    }
                }
            }
        }
    }
    entry["apply_excite_b"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_1_apply_excite_b(workgroups, bindings, domain, origin);
    };

    entryInfo["apply_excite_energy"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_2_apply_excite_energy(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _b_U1 = bindings.U1;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_p = bindings.p;
        const _u_p_amplitude = _b_p.amplitude;
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix >= n) || (iy >= n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const i = (ix + ghost);
                    const j = (iy + ghost);
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((j * nT) + i);
                        break _inl_10;
                    }
                    const idx = _inl_10_result;
                    const dxv = _u_U_uniforms_dx;
                    const x0 = ((+(ix)) * dxv);
                    const y0 = ((+(iy)) * dxv);
                    const x1 = (x0 + dxv);
                    const y1 = (y0 + dxv);
                    const az_00 = excite_az(x0, y0);
                    const az_10 = excite_az(x1, y0);
                    const az_01 = excite_az(x0, y1);
                    const az_11 = excite_az(x1, y1);
                    const dBx_left = (((az_01 - az_00)) / dxv);
                    const dBx_right = (((az_11 - az_10)) / dxv);
                    const dBy_bot = ((-((az_10 - az_00))) / dxv);
                    const dBy_top = ((-((az_11 - az_01))) / dxv);
                    const dBx_cell = (0.5 * ((dBx_left + dBx_right)));
                    const dBy_cell = (0.5 * ((dBy_bot + dBy_top)));
                    if (((Math.abs(dBx_cell) + Math.abs(dBy_cell)) < (PERTURB_GAUSS_CULL * ((_u_p_amplitude) < (1.0) ? (1.0) : (_u_p_amplitude))))) {
                        break __invocation;
                    }
                    let _inl_11_result;
                    _inl_11: {
                        let _inl_11__inl_0_result;
                        _inl_11__inl_0: {
                            _inl_11__inl_0_result = ((j * ((nT + 1))) + i);
                            break _inl_11__inl_0;
                        }
                        _inl_11_result = _inl_11__inl_0_result;
                        break _inl_11;
                    }
                    let _inl_12_result;
                    _inl_12: {
                        const _inl_12__inl_1_ix = (i + 1);
                        let _inl_12__inl_1_result;
                        _inl_12__inl_1: {
                            _inl_12__inl_1_result = ((j * ((nT + 1))) + _inl_12__inl_1_ix);
                            break _inl_12__inl_1;
                        }
                        _inl_12_result = _inl_12__inl_1_result;
                        break _inl_12;
                    }
                    const bx_new = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_2_result;
                        _inl_13__inl_2: {
                            _inl_13__inl_2_result = ((j * nT) + i);
                            break _inl_13__inl_2;
                        }
                        _inl_13_result = _inl_13__inl_2_result;
                        break _inl_13;
                    }
                    let _inl_14_result;
                    _inl_14: {
                        const _inl_14__inl_3_iy = (j + 1);
                        let _inl_14__inl_3_result;
                        _inl_14__inl_3: {
                            _inl_14__inl_3_result = ((_inl_14__inl_3_iy * nT) + i);
                            break _inl_14__inl_3;
                        }
                        _inl_14_result = _inl_14__inl_3_result;
                        break _inl_14;
                    }
                    const by_new = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                    const bx_old = (bx_new - dBx_cell);
                    const by_old = (by_new - dBy_cell);
                    const dEmag = ((0.5 * (((bx_new * bx_new) + (by_new * by_new)))) - (0.5 * (((bx_old * bx_old) + (by_old * by_old)))));
                    const _sroa_8_base = ((idx) * 4 + 0);
                    let u1_x = _b_U1[_sroa_8_base + 0];
                    let u1_y = _b_U1[_sroa_8_base + 1];
                    let u1_z = _b_U1[_sroa_8_base + 2];
                    let u1_w = _b_U1[_sroa_8_base + 3];
                    u1_x = (u1_x + dEmag);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u1_x;
                        const _wt1 = u1_y;
                        const _wt2 = u1_z;
                        const _wt3 = u1_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        __invocation: {
                            const n = _u_U_uniforms_grid_n;
                            const ix = gid_x;
                            const iy = gid_y;
                            if (((ix >= n) || (iy >= n))) {
                                break __invocation;
                            }
                            const ghost = _u_U_uniforms_ghost_w;
                            const nT = _u_U_uniforms_grid_n_total;
                            const i = (ix + ghost);
                            const j = (iy + ghost);
                            let _inl_10_result;
                            _inl_10: {
                                _inl_10_result = ((j * nT) + i);
                                break _inl_10;
                            }
                            const idx = _inl_10_result;
                            const dxv = _u_U_uniforms_dx;
                            const x0 = ((+(ix)) * dxv);
                            const y0 = ((+(iy)) * dxv);
                            const x1 = (x0 + dxv);
                            const y1 = (y0 + dxv);
                            const az_00 = excite_az(x0, y0);
                            const az_10 = excite_az(x1, y0);
                            const az_01 = excite_az(x0, y1);
                            const az_11 = excite_az(x1, y1);
                            const dBx_left = (((az_01 - az_00)) / dxv);
                            const dBx_right = (((az_11 - az_10)) / dxv);
                            const dBy_bot = ((-((az_10 - az_00))) / dxv);
                            const dBy_top = ((-((az_11 - az_01))) / dxv);
                            const dBx_cell = (0.5 * ((dBx_left + dBx_right)));
                            const dBy_cell = (0.5 * ((dBy_bot + dBy_top)));
                            if (((Math.abs(dBx_cell) + Math.abs(dBy_cell)) < (PERTURB_GAUSS_CULL * ((_u_p_amplitude) < (1.0) ? (1.0) : (_u_p_amplitude))))) {
                                break __invocation;
                            }
                            let _inl_11_result;
                            _inl_11: {
                                let _inl_11__inl_0_result;
                                _inl_11__inl_0: {
                                    _inl_11__inl_0_result = ((j * ((nT + 1))) + i);
                                    break _inl_11__inl_0;
                                }
                                _inl_11_result = _inl_11__inl_0_result;
                                break _inl_11;
                            }
                            let _inl_12_result;
                            _inl_12: {
                                const _inl_12__inl_1_ix = (i + 1);
                                let _inl_12__inl_1_result;
                                _inl_12__inl_1: {
                                    _inl_12__inl_1_result = ((j * ((nT + 1))) + _inl_12__inl_1_ix);
                                    break _inl_12__inl_1;
                                }
                                _inl_12_result = _inl_12__inl_1_result;
                                break _inl_12;
                            }
                            const bx_new = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                            let _inl_13_result;
                            _inl_13: {
                                let _inl_13__inl_2_result;
                                _inl_13__inl_2: {
                                    _inl_13__inl_2_result = ((j * nT) + i);
                                    break _inl_13__inl_2;
                                }
                                _inl_13_result = _inl_13__inl_2_result;
                                break _inl_13;
                            }
                            let _inl_14_result;
                            _inl_14: {
                                const _inl_14__inl_3_iy = (j + 1);
                                let _inl_14__inl_3_result;
                                _inl_14__inl_3: {
                                    _inl_14__inl_3_result = ((_inl_14__inl_3_iy * nT) + i);
                                    break _inl_14__inl_3;
                                }
                                _inl_14_result = _inl_14__inl_3_result;
                                break _inl_14;
                            }
                            const by_new = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                            const bx_old = (bx_new - dBx_cell);
                            const by_old = (by_new - dBy_cell);
                            const dEmag = ((0.5 * (((bx_new * bx_new) + (by_new * by_new)))) - (0.5 * (((bx_old * bx_old) + (by_old * by_old)))));
                            const _sroa_9_base = ((idx) * 4 + 0);
                            let u1_x = _b_U1[_sroa_9_base + 0];
                            let u1_y = _b_U1[_sroa_9_base + 1];
                            let u1_z = _b_U1[_sroa_9_base + 2];
                            let u1_w = _b_U1[_sroa_9_base + 3];
                            u1_x = (u1_x + dEmag);
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = u1_x;
                                const _wt1 = u1_y;
                                const _wt2 = u1_z;
                                const _wt3 = u1_w;
                                _b_U1[_wbase + 0] = _wt0;
                                _b_U1[_wbase + 1] = _wt1;
                                _b_U1[_wbase + 2] = _wt2;
                                _b_U1[_wbase + 3] = _wt3;
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    __invocation: {
                        const n = _u_U_uniforms_grid_n;
                        const ix = gid_x;
                        const iy = gid_y;
                        if (((ix >= n) || (iy >= n))) {
                            break __invocation;
                        }
                        const ghost = _u_U_uniforms_ghost_w;
                        const nT = _u_U_uniforms_grid_n_total;
                        const i = (ix + ghost);
                        const j = (iy + ghost);
                        let _inl_10_result;
                        _inl_10: {
                            _inl_10_result = ((j * nT) + i);
                            break _inl_10;
                        }
                        const idx = _inl_10_result;
                        const dxv = _u_U_uniforms_dx;
                        const x0 = ((+(ix)) * dxv);
                        const y0 = ((+(iy)) * dxv);
                        const x1 = (x0 + dxv);
                        const y1 = (y0 + dxv);
                        const az_00 = excite_az(x0, y0);
                        const az_10 = excite_az(x1, y0);
                        const az_01 = excite_az(x0, y1);
                        const az_11 = excite_az(x1, y1);
                        const dBx_left = (((az_01 - az_00)) / dxv);
                        const dBx_right = (((az_11 - az_10)) / dxv);
                        const dBy_bot = ((-((az_10 - az_00))) / dxv);
                        const dBy_top = ((-((az_11 - az_01))) / dxv);
                        const dBx_cell = (0.5 * ((dBx_left + dBx_right)));
                        const dBy_cell = (0.5 * ((dBy_bot + dBy_top)));
                        if (((Math.abs(dBx_cell) + Math.abs(dBy_cell)) < (PERTURB_GAUSS_CULL * ((_u_p_amplitude) < (1.0) ? (1.0) : (_u_p_amplitude))))) {
                            break __invocation;
                        }
                        let _inl_11_result;
                        _inl_11: {
                            let _inl_11__inl_0_result;
                            _inl_11__inl_0: {
                                _inl_11__inl_0_result = ((j * ((nT + 1))) + i);
                                break _inl_11__inl_0;
                            }
                            _inl_11_result = _inl_11__inl_0_result;
                            break _inl_11;
                        }
                        let _inl_12_result;
                        _inl_12: {
                            const _inl_12__inl_1_ix = (i + 1);
                            let _inl_12__inl_1_result;
                            _inl_12__inl_1: {
                                _inl_12__inl_1_result = ((j * ((nT + 1))) + _inl_12__inl_1_ix);
                                break _inl_12__inl_1;
                            }
                            _inl_12_result = _inl_12__inl_1_result;
                            break _inl_12;
                        }
                        const bx_new = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                        let _inl_13_result;
                        _inl_13: {
                            let _inl_13__inl_2_result;
                            _inl_13__inl_2: {
                                _inl_13__inl_2_result = ((j * nT) + i);
                                break _inl_13__inl_2;
                            }
                            _inl_13_result = _inl_13__inl_2_result;
                            break _inl_13;
                        }
                        let _inl_14_result;
                        _inl_14: {
                            const _inl_14__inl_3_iy = (j + 1);
                            let _inl_14__inl_3_result;
                            _inl_14__inl_3: {
                                _inl_14__inl_3_result = ((_inl_14__inl_3_iy * nT) + i);
                                break _inl_14__inl_3;
                            }
                            _inl_14_result = _inl_14__inl_3_result;
                            break _inl_14;
                        }
                        const by_new = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                        const bx_old = (bx_new - dBx_cell);
                        const by_old = (by_new - dBy_cell);
                        const dEmag = ((0.5 * (((bx_new * bx_new) + (by_new * by_new)))) - (0.5 * (((bx_old * bx_old) + (by_old * by_old)))));
                        const _sroa_10_base = ((idx) * 4 + 0);
                        let u1_x = _b_U1[_sroa_10_base + 0];
                        let u1_y = _b_U1[_sroa_10_base + 1];
                        let u1_z = _b_U1[_sroa_10_base + 2];
                        let u1_w = _b_U1[_sroa_10_base + 3];
                        u1_x = (u1_x + dEmag);
                        {
                            const _wbase = ((idx) * 4 + 0);
                            const _wt0 = u1_x;
                            const _wt1 = u1_y;
                            const _wt2 = u1_z;
                            const _wt3 = u1_w;
                            _b_U1[_wbase + 0] = _wt0;
                            _b_U1[_wbase + 1] = _wt1;
                            _b_U1[_wbase + 2] = _wt2;
                            _b_U1[_wbase + 3] = _wt3;
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
                __invocation: {
                    const n = _u_U_uniforms_grid_n;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix >= n) || (iy >= n))) {
                        break __invocation;
                    }
                    const ghost = _u_U_uniforms_ghost_w;
                    const nT = _u_U_uniforms_grid_n_total;
                    const i = (ix + ghost);
                    const j = (iy + ghost);
                    let _inl_10_result;
                    _inl_10: {
                        _inl_10_result = ((j * nT) + i);
                        break _inl_10;
                    }
                    const idx = _inl_10_result;
                    const dxv = _u_U_uniforms_dx;
                    const x0 = ((+(ix)) * dxv);
                    const y0 = ((+(iy)) * dxv);
                    const x1 = (x0 + dxv);
                    const y1 = (y0 + dxv);
                    const az_00 = excite_az(x0, y0);
                    const az_10 = excite_az(x1, y0);
                    const az_01 = excite_az(x0, y1);
                    const az_11 = excite_az(x1, y1);
                    const dBx_left = (((az_01 - az_00)) / dxv);
                    const dBx_right = (((az_11 - az_10)) / dxv);
                    const dBy_bot = ((-((az_10 - az_00))) / dxv);
                    const dBy_top = ((-((az_11 - az_01))) / dxv);
                    const dBx_cell = (0.5 * ((dBx_left + dBx_right)));
                    const dBy_cell = (0.5 * ((dBy_bot + dBy_top)));
                    if (((Math.abs(dBx_cell) + Math.abs(dBy_cell)) < (PERTURB_GAUSS_CULL * ((_u_p_amplitude) < (1.0) ? (1.0) : (_u_p_amplitude))))) {
                        break __invocation;
                    }
                    let _inl_11_result;
                    _inl_11: {
                        let _inl_11__inl_0_result;
                        _inl_11__inl_0: {
                            _inl_11__inl_0_result = ((j * ((nT + 1))) + i);
                            break _inl_11__inl_0;
                        }
                        _inl_11_result = _inl_11__inl_0_result;
                        break _inl_11;
                    }
                    let _inl_12_result;
                    _inl_12: {
                        const _inl_12__inl_1_ix = (i + 1);
                        let _inl_12__inl_1_result;
                        _inl_12__inl_1: {
                            _inl_12__inl_1_result = ((j * ((nT + 1))) + _inl_12__inl_1_ix);
                            break _inl_12__inl_1;
                        }
                        _inl_12_result = _inl_12__inl_1_result;
                        break _inl_12;
                    }
                    const bx_new = (0.5 * ((_b_Bx_face[_inl_11_result] + _b_Bx_face[_inl_12_result])));
                    let _inl_13_result;
                    _inl_13: {
                        let _inl_13__inl_2_result;
                        _inl_13__inl_2: {
                            _inl_13__inl_2_result = ((j * nT) + i);
                            break _inl_13__inl_2;
                        }
                        _inl_13_result = _inl_13__inl_2_result;
                        break _inl_13;
                    }
                    let _inl_14_result;
                    _inl_14: {
                        const _inl_14__inl_3_iy = (j + 1);
                        let _inl_14__inl_3_result;
                        _inl_14__inl_3: {
                            _inl_14__inl_3_result = ((_inl_14__inl_3_iy * nT) + i);
                            break _inl_14__inl_3;
                        }
                        _inl_14_result = _inl_14__inl_3_result;
                        break _inl_14;
                    }
                    const by_new = (0.5 * ((_b_By_face[_inl_13_result] + _b_By_face[_inl_14_result])));
                    const bx_old = (bx_new - dBx_cell);
                    const by_old = (by_new - dBy_cell);
                    const dEmag = ((0.5 * (((bx_new * bx_new) + (by_new * by_new)))) - (0.5 * (((bx_old * bx_old) + (by_old * by_old)))));
                    const _sroa_11_base = ((idx) * 4 + 0);
                    let u1_x = _b_U1[_sroa_11_base + 0];
                    let u1_y = _b_U1[_sroa_11_base + 1];
                    let u1_z = _b_U1[_sroa_11_base + 2];
                    let u1_w = _b_U1[_sroa_11_base + 3];
                    u1_x = (u1_x + dEmag);
                    {
                        const _wbase = ((idx) * 4 + 0);
                        const _wt0 = u1_x;
                        const _wt1 = u1_y;
                        const _wt2 = u1_z;
                        const _wt3 = u1_w;
                        _b_U1[_wbase + 0] = _wt0;
                        _b_U1[_wbase + 1] = _wt1;
                        _b_U1[_wbase + 2] = _wt2;
                        _b_U1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    }
    entry["apply_excite_energy"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_2_apply_excite_energy(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["apply_drag"] = function (workgroups, domain, origin) {
            return __entry_0_apply_drag(workgroups, bindings, domain, origin);
        };
        bound["apply_excite_b"] = function (workgroups, domain, origin) {
            return __entry_1_apply_excite_b(workgroups, bindings, domain, origin);
        };
        bound["apply_excite_energy"] = function (workgroups, domain, origin) {
            return __entry_2_apply_excite_energy(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0","U1","Bx_face","By_face","p"], entryInfo };
}
