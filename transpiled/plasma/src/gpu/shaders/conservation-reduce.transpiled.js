// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/conservation-reduce.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 76e388b1c5424f050623609cf47dfc8b42f75977228df23fb056385b767beea4
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":28577,"lines":481,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":1,"flatWorkgroupSlots":1536,"staticBranchPrunes":0}
// generated: 2026-05-30T21:32:08.733Z
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
    const QUANTITY_COUNT = 24;
    const TILE_THREADS = 64;

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["tile"] = {"workgroupSize":[8,8,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_0_tile(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_dx = _b_U_uniforms.dx;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_tile_partials = bindings.tile_partials;
        const wg = Object.create(null);
        wg.tile_scratch = new Float32Array(1536);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile_scratch.fill(0);
            const wid_x = wgx;
            const wid_y = wgy;
            const nwg_x = Wx;
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
                            const dx_inv = (1.0 / _u_U_uniforms_dx);
                            const p_floor = _u_U_uniforms_pressure_floor;
                            const gamma_m1 = (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0)));
                            let c0 = 0.0;
                            let c1 = 0.0;
                            let c2 = 0.0;
                            let c3 = 0.0;
                            let c4 = 0.0;
                            let c5 = 0.0;
                            let c6 = 0.0;
                            let c7 = 0.0;
                            let c8 = 0.0;
                            let c9 = 0.0;
                            let c10 = 1.0e30;
                            let c11 = 0.0;
                            let c12 = 0.0;
                            let c13 = 0.0;
                            let c14 = 0.0;
                            let c15 = 0.0;
                            let c16 = 0.0;
                            let c17 = 0.0;
                            let c18 = 0.0;
                            let c19 = 0.0;
                            let c20 = 0.0;
                            if (((gid_x < n_interior) && (gid_y < n_interior))) {
                                const ix = (gid_x + ghost);
                                const iy = (gid_y + ghost);
                                let _inl_6_result;
                                _inl_6: {
                                    _inl_6_result = ((iy * n_total) + ix);
                                    break _inl_6;
                                }
                                const idx = _inl_6_result;
                                const _sroa_0_base = ((idx) * 4 + 0);
                                const u0_x = _b_U0_in[_sroa_0_base + 0];
                                const u0_y = _b_U0_in[_sroa_0_base + 1];
                                const u0_z = _b_U0_in[_sroa_0_base + 2];
                                const u0_w = _b_U0_in[_sroa_0_base + 3];
                                const _sroa_1_base = ((idx) * 4 + 0);
                                const u1_x = _b_U1_in[_sroa_1_base + 0];
                                const u1_y = _b_U1_in[_sroa_1_base + 1];
                                const u1_z = _b_U1_in[_sroa_1_base + 2];
                                const u1_w = _b_U1_in[_sroa_1_base + 3];
                                let _inl_7_result;
                                _inl_7: {
                                    let _inl_7__inl_0_result;
                                    _inl_7__inl_0: {
                                        _inl_7__inl_0_result = ((iy * ((n_total + 1))) + ix);
                                        break _inl_7__inl_0;
                                    }
                                    _inl_7_result = _inl_7__inl_0_result;
                                    break _inl_7;
                                }
                                const bxL = _b_Bx_face[_inl_7_result];
                                let _inl_8_result;
                                _inl_8: {
                                    const _inl_8__inl_1_ix = (ix + 1);
                                    let _inl_8__inl_1_result;
                                    _inl_8__inl_1: {
                                        _inl_8__inl_1_result = ((iy * ((n_total + 1))) + _inl_8__inl_1_ix);
                                        break _inl_8__inl_1;
                                    }
                                    _inl_8_result = _inl_8__inl_1_result;
                                    break _inl_8;
                                }
                                const bxR = _b_Bx_face[_inl_8_result];
                                let _inl_9_result;
                                _inl_9: {
                                    let _inl_9__inl_2_result;
                                    _inl_9__inl_2: {
                                        _inl_9__inl_2_result = ((iy * n_total) + ix);
                                        break _inl_9__inl_2;
                                    }
                                    _inl_9_result = _inl_9__inl_2_result;
                                    break _inl_9;
                                }
                                const byD = _b_By_face[_inl_9_result];
                                let _inl_10_result;
                                _inl_10: {
                                    const _inl_10__inl_3_iy = (iy + 1);
                                    let _inl_10__inl_3_result;
                                    _inl_10__inl_3: {
                                        _inl_10__inl_3_result = ((_inl_10__inl_3_iy * n_total) + ix);
                                        break _inl_10__inl_3;
                                    }
                                    _inl_10_result = _inl_10__inl_3_result;
                                    break _inl_10;
                                }
                                const byU = _b_By_face[_inl_10_result];
                                const bx_c = (0.5 * ((bxL + bxR)));
                                const by_c = (0.5 * ((byD + byU)));
                                const bz_c = u1_y;
                                const _inl_11_v = u0_x;
                                let _inl_11_result;
                                _inl_11: {
                                    _inl_11_result = ((_inl_11_v == _inl_11_v) && (Math.abs(_inl_11_v) < 1.0e30));
                                    break _inl_11;
                                }
                                const _inl_12_v = u0_y;
                                let _inl_12_result;
                                _inl_12: {
                                    _inl_12_result = ((_inl_12_v == _inl_12_v) && (Math.abs(_inl_12_v) < 1.0e30));
                                    break _inl_12;
                                }
                                const _inl_13_v = u0_z;
                                let _inl_13_result;
                                _inl_13: {
                                    _inl_13_result = ((_inl_13_v == _inl_13_v) && (Math.abs(_inl_13_v) < 1.0e30));
                                    break _inl_13;
                                }
                                const _inl_14_v = u0_w;
                                let _inl_14_result;
                                _inl_14: {
                                    _inl_14_result = ((_inl_14_v == _inl_14_v) && (Math.abs(_inl_14_v) < 1.0e30));
                                    break _inl_14;
                                }
                                const _inl_15_v = u1_x;
                                let _inl_15_result;
                                _inl_15: {
                                    _inl_15_result = ((_inl_15_v == _inl_15_v) && (Math.abs(_inl_15_v) < 1.0e30));
                                    break _inl_15;
                                }
                                const _inl_16_v = u1_y;
                                let _inl_16_result;
                                _inl_16: {
                                    _inl_16_result = ((_inl_16_v == _inl_16_v) && (Math.abs(_inl_16_v) < 1.0e30));
                                    break _inl_16;
                                }
                                const _inl_17_v = u1_z;
                                let _inl_17_result;
                                _inl_17: {
                                    _inl_17_result = ((_inl_17_v == _inl_17_v) && (Math.abs(_inl_17_v) < 1.0e30));
                                    break _inl_17;
                                }
                                const _inl_18_v = u1_w;
                                let _inl_18_result;
                                _inl_18: {
                                    _inl_18_result = ((_inl_18_v == _inl_18_v) && (Math.abs(_inl_18_v) < 1.0e30));
                                    break _inl_18;
                                }
                                let _inl_19_result;
                                _inl_19: {
                                    _inl_19_result = ((bxL == bxL) && (Math.abs(bxL) < 1.0e30));
                                    break _inl_19;
                                }
                                let _inl_20_result;
                                _inl_20: {
                                    _inl_20_result = ((bxR == bxR) && (Math.abs(bxR) < 1.0e30));
                                    break _inl_20;
                                }
                                let _inl_21_result;
                                _inl_21: {
                                    _inl_21_result = ((byD == byD) && (Math.abs(byD) < 1.0e30));
                                    break _inl_21;
                                }
                                let _inl_22_result;
                                _inl_22: {
                                    _inl_22_result = ((byU == byU) && (Math.abs(byU) < 1.0e30));
                                    break _inl_22;
                                }
                                const good = (((((((((((_inl_11_result && _inl_12_result) && _inl_13_result) && _inl_14_result) && _inl_15_result) && _inl_16_result) && _inl_17_result) && _inl_18_result) && _inl_19_result) && _inl_20_result) && _inl_21_result) && _inl_22_result);
                                if (good) {
                                    const rho = ((u0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (u0_x));
                                    const vx = (u0_y / rho);
                                    const vy = (u0_z / rho);
                                    const vz = (u0_w / rho);
                                    const ke = ((0.5 * rho) * ((((vx * vx) + (vy * vy)) + (vz * vz))));
                                    const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (bz_c * bz_c))));
                                    const eth_floor = (p_floor / gamma_m1);
                                    const eth_total = ((u1_x - ke) - mb);
                                    let _inl_23_result;
                                    _inl_23: {
                                        _inl_23_result = ((eth_total == eth_total) && (Math.abs(eth_total) < 1.0e30));
                                        break _inl_23;
                                    }
                                    const total_ok = (_inl_23_result && (eth_total > ((eth_floor) < ((DUAL_ENERGY_FRACTION * ((Math.abs(u1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(u1_x))))) ? ((DUAL_ENERGY_FRACTION * ((Math.abs(u1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(u1_x))))) : (eth_floor))));
                                    const eth = (total_ok ? eth_total : ((u1_z) < (eth_floor) ? (eth_floor) : (u1_z)));
                                    const p = (((gamma_m1 * eth)) < (p_floor) ? (p_floor) : ((gamma_m1 * eth)));
                                    const beta = (((2.0 * p)) / (((2.0 * mb)) < (1.0e-12) ? (1.0e-12) : ((2.0 * mb))));
                                    const bmag = Math.sqrt((((((bx_c * bx_c) + (by_c * by_c)) + (bz_c * bz_c))) < (0.0) ? (0.0) : ((((bx_c * bx_c) + (by_c * by_c)) + (bz_c * bz_c)))));
                                    const vmag = Math.sqrt((((((vx * vx) + (vy * vy)) + (vz * vz))) < (0.0) ? (0.0) : ((((vx * vx) + (vy * vy)) + (vz * vz)))));
                                    const divB = ((((bxR - bxL)) * dx_inv) + (((byU - byD)) * dx_inv));
                                    c0 = u0_x;
                                    c1 = u0_y;
                                    c2 = u0_z;
                                    c3 = u0_w;
                                    c4 = u1_x;
                                    c5 = mb;
                                    c6 = Math.abs(divB);
                                    c7 = ke;
                                    c8 = (p / gamma_m1);
                                    c9 = beta;
                                    c10 = beta;
                                    c11 = beta;
                                    c12 = bmag;
                                    c13 = vmag;
                                    c15 = (divB * divB);
                                    c20 = 1.0;
                                    if ((u0_x <= (1.001 * DENSITY_FLOOR))) {
                                        c17 = 1.0;
                                    }
                                    if ((p <= (1.001 * p_floor))) {
                                        c18 = 1.0;
                                    }
                                    if (((gid_x == ((n_interior >> 1))) && (gid_y >= ((n_interior >> 1))))) {
                                        let _inl_24_result;
                                        _inl_24: {
                                            _inl_24_result = ((iy * ((n_total + 1))) + ix);
                                            break _inl_24;
                                        }
                                        c19 = _b_Bx_face[_inl_24_result];
                                    }
                                    if (((((gid_x > 0) && (gid_x < (n_interior - 1))) && (gid_y > 0)) && (gid_y < (n_interior - 1)))) {
                                        const _inl_25_ix = (ix + 1);
                                        let _inl_25_result;
                                        _inl_25: {
                                            _inl_25_result = ((iy * n_total) + _inl_25_ix);
                                            break _inl_25;
                                        }
                                        const _inl_26_ix = (ix + 1);
                                        const _inl_26_iy = (iy + 1);
                                        let _inl_26_result;
                                        _inl_26: {
                                            _inl_26_result = ((_inl_26_iy * n_total) + _inl_26_ix);
                                            break _inl_26;
                                        }
                                        const byR = (0.5 * ((_b_By_face[_inl_25_result] + _b_By_face[_inl_26_result])));
                                        const _inl_27_ix = (ix - 1);
                                        let _inl_27_result;
                                        _inl_27: {
                                            _inl_27_result = ((iy * n_total) + _inl_27_ix);
                                            break _inl_27;
                                        }
                                        const _inl_28_ix = (ix - 1);
                                        const _inl_28_iy = (iy + 1);
                                        let _inl_28_result;
                                        _inl_28: {
                                            _inl_28_result = ((_inl_28_iy * n_total) + _inl_28_ix);
                                            break _inl_28;
                                        }
                                        const byL = (0.5 * ((_b_By_face[_inl_27_result] + _b_By_face[_inl_28_result])));
                                        const _inl_29_iy = (iy + 1);
                                        let _inl_29_result;
                                        _inl_29: {
                                            _inl_29_result = ((_inl_29_iy * ((n_total + 1))) + ix);
                                            break _inl_29;
                                        }
                                        const _inl_30_ix = (ix + 1);
                                        const _inl_30_iy = (iy + 1);
                                        let _inl_30_result;
                                        _inl_30: {
                                            _inl_30_result = ((_inl_30_iy * ((n_total + 1))) + _inl_30_ix);
                                            break _inl_30;
                                        }
                                        const bxU = (0.5 * ((_b_Bx_face[_inl_29_result] + _b_Bx_face[_inl_30_result])));
                                        const _inl_31_iy = (iy - 1);
                                        let _inl_31_result;
                                        _inl_31: {
                                            _inl_31_result = ((_inl_31_iy * ((n_total + 1))) + ix);
                                            break _inl_31;
                                        }
                                        const _inl_32_ix = (ix + 1);
                                        const _inl_32_iy = (iy - 1);
                                        let _inl_32_result;
                                        _inl_32: {
                                            _inl_32_result = ((_inl_32_iy * ((n_total + 1))) + _inl_32_ix);
                                            break _inl_32;
                                        }
                                        const bxD = (0.5 * ((_b_Bx_face[_inl_31_result] + _b_Bx_face[_inl_32_result])));
                                        c14 = Math.abs((((((byR - byL)) * 0.5) * dx_inv) - ((((bxU - bxD)) * 0.5) * dx_inv)));
                                    }
                                } else {
                                    c16 = 1.0;
                                }
                            }
                            const base = (lid * QUANTITY_COUNT);
                            wg.tile_scratch[((base))] = c0;
                            wg.tile_scratch[(((base + 1)))] = c1;
                            wg.tile_scratch[(((base + 2)))] = c2;
                            wg.tile_scratch[(((base + 3)))] = c3;
                            wg.tile_scratch[(((base + 4)))] = c4;
                            wg.tile_scratch[(((base + 5)))] = c5;
                            wg.tile_scratch[(((base + 6)))] = c6;
                            wg.tile_scratch[(((base + 7)))] = c7;
                            wg.tile_scratch[(((base + 8)))] = c8;
                            wg.tile_scratch[(((base + 9)))] = c9;
                            wg.tile_scratch[(((base + 10)))] = c10;
                            wg.tile_scratch[(((base + 11)))] = c11;
                            wg.tile_scratch[(((base + 12)))] = c12;
                            wg.tile_scratch[(((base + 13)))] = c13;
                            wg.tile_scratch[(((base + 14)))] = c14;
                            wg.tile_scratch[(((base + 15)))] = c15;
                            wg.tile_scratch[(((base + 16)))] = c16;
                            wg.tile_scratch[(((base + 17)))] = c17;
                            wg.tile_scratch[(((base + 18)))] = c18;
                            wg.tile_scratch[(((base + 19)))] = c19;
                            wg.tile_scratch[(((base + 20)))] = c20;
                            wg.tile_scratch[(((base + 21)))] = 0.0;
                            wg.tile_scratch[(((base + 22)))] = 0.0;
                            wg.tile_scratch[(((base + 23)))] = 0.0;
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
                            const dx_inv = (1.0 / _u_U_uniforms_dx);
                            const p_floor = _u_U_uniforms_pressure_floor;
                            const gamma_m1 = (((_u_U_uniforms_gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((_u_U_uniforms_gamma - 1.0)));
                            const base = (lid * QUANTITY_COUNT);
                            if ((lid == 0)) {
                                let s0 = 0.0;
                                let s1 = 0.0;
                                let s2 = 0.0;
                                let s3 = 0.0;
                                let s4 = 0.0;
                                let s5 = 0.0;
                                let s6 = 0.0;
                                let s7 = 0.0;
                                let s8 = 0.0;
                                let s9 = 0.0;
                                let s10 = 1.0e30;
                                let s11 = 0.0;
                                let s12 = 0.0;
                                let s13 = 0.0;
                                let s14 = 0.0;
                                let s15 = 0.0;
                                let s16 = 0.0;
                                let s17 = 0.0;
                                let s18 = 0.0;
                                let s19 = 0.0;
                                let s20 = 0.0;
                                for (let k = 0; (k < TILE_THREADS); k = (k + 1)) {
                                    const off = (k * QUANTITY_COUNT);
                                    s0 = (s0 + wg.tile_scratch[((off))]);
                                    s1 = (s1 + wg.tile_scratch[(((off + 1)))]);
                                    s2 = (s2 + wg.tile_scratch[(((off + 2)))]);
                                    s3 = (s3 + wg.tile_scratch[(((off + 3)))]);
                                    s4 = (s4 + wg.tile_scratch[(((off + 4)))]);
                                    s5 = (s5 + wg.tile_scratch[(((off + 5)))]);
                                    s6 = (s6 + wg.tile_scratch[(((off + 6)))]);
                                    s7 = (s7 + wg.tile_scratch[(((off + 7)))]);
                                    s8 = (s8 + wg.tile_scratch[(((off + 8)))]);
                                    s9 = (s9 + wg.tile_scratch[(((off + 9)))]);
                                    s10 = ((wg.tile_scratch[(((off + 10)))]) < (s10) ? (wg.tile_scratch[(((off + 10)))]) : (s10));
                                    s11 = ((s11) < (wg.tile_scratch[(((off + 11)))]) ? (wg.tile_scratch[(((off + 11)))]) : (s11));
                                    s12 = ((s12) < (wg.tile_scratch[(((off + 12)))]) ? (wg.tile_scratch[(((off + 12)))]) : (s12));
                                    s13 = ((s13) < (wg.tile_scratch[(((off + 13)))]) ? (wg.tile_scratch[(((off + 13)))]) : (s13));
                                    s14 = ((s14) < (wg.tile_scratch[(((off + 14)))]) ? (wg.tile_scratch[(((off + 14)))]) : (s14));
                                    s15 = (s15 + wg.tile_scratch[(((off + 15)))]);
                                    s16 = (s16 + wg.tile_scratch[(((off + 16)))]);
                                    s17 = (s17 + wg.tile_scratch[(((off + 17)))]);
                                    s18 = (s18 + wg.tile_scratch[(((off + 18)))]);
                                    s19 = (s19 + wg.tile_scratch[(((off + 19)))]);
                                    s20 = (s20 + wg.tile_scratch[(((off + 20)))]);
                                }
                                const tile_idx = ((wid_y * nwg_x) + wid_x);
                                const out = (tile_idx * QUANTITY_COUNT);
                                _b_tile_partials[out] = s0;
                                _b_tile_partials[(out + 1)] = s1;
                                _b_tile_partials[(out + 2)] = s2;
                                _b_tile_partials[(out + 3)] = s3;
                                _b_tile_partials[(out + 4)] = s4;
                                _b_tile_partials[(out + 5)] = s5;
                                _b_tile_partials[(out + 6)] = s6;
                                _b_tile_partials[(out + 7)] = s7;
                                _b_tile_partials[(out + 8)] = s8;
                                _b_tile_partials[(out + 9)] = s9;
                                _b_tile_partials[(out + 10)] = s10;
                                _b_tile_partials[(out + 11)] = s11;
                                _b_tile_partials[(out + 12)] = s12;
                                _b_tile_partials[(out + 13)] = s13;
                                _b_tile_partials[(out + 14)] = s14;
                                _b_tile_partials[(out + 15)] = s15;
                                _b_tile_partials[(out + 16)] = s16;
                                _b_tile_partials[(out + 17)] = s17;
                                _b_tile_partials[(out + 18)] = s18;
                                _b_tile_partials[(out + 19)] = s19;
                                _b_tile_partials[(out + 20)] = s20;
                                _b_tile_partials[(out + 21)] = 0.0;
                                _b_tile_partials[(out + 22)] = 0.0;
                                _b_tile_partials[(out + 23)] = 0.0;
                            }
                        }
                    }
                }
            }
        }
    }
    entry["tile"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_tile(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["tile"] = function (workgroups, domain, origin) {
            return __entry_0_tile(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","tile_partials"], entryInfo };
}
