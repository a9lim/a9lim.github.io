// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-advect.wgsl
// wgsl-variant: n512
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 2fc98959227e2a27771b423606dedd97f0ca727ed940b1857a9c560bae1ae171
// wgsl-transpiler-sha256: f474a253aa6a80ec60eed44e2b4eb8e5eaaebe9a90358665421c342dd1453de6
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"inlineHotFns":["sample_noise","bx_at_cell","by_at_cell","sample_b_unit"],"specializeUniforms":{"U_uniforms":{"grid_n":512,"grid_n_total":516,"ghost_w":2,"noise_n":1024}},"fixedWorkgroups":[64,64,1]}
// wgsl-metrics: {"bytes":33956,"lines":631,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":10,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:40:33.550Z
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
    const LIC_STEPS = 20;
    const LIC_STEP_SIZE = 0.5;
    const LIC_B_EPS = 1.0e-8;

    function cell_idx_total(ix, iy, n_total) {
        return ((iy * n_total) + ix);
    }

    function sample_b_unit(cx, cy, ghost, n_total, n_interior) {
        const ni = (+(n_interior));
        const cxc = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(cx, 0.0, (ni - 1.0001)));
        const cyc = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(cy, 0.0, (ni - 1.0001)));
        const ix0 = ((Math.floor(cxc)) >>> 0);
        const iy0 = ((Math.floor(cyc)) >>> 0);
        const ix1 = (ix0 + 1);
        const iy1 = (iy0 + 1);
        const fx = (cxc - Math.floor(cxc));
        const fy = (cyc - Math.floor(cyc));
        let _inl_10_result;
        _inl_10: {
            const _inl_10_ix = (ix0 + ghost);
            const _inl_10_iy = (iy0 + ghost);
            let _inl_10__inl_6_result;
            _inl_10__inl_6: {
                let _inl_10__inl_6__inl_0_result;
                _inl_10__inl_6__inl_0: {
                    _inl_10__inl_6__inl_0_result = ((_inl_10_iy * ((n_total + 1))) + _inl_10_ix);
                    break _inl_10__inl_6__inl_0;
                }
                _inl_10__inl_6_result = _inl_10__inl_6__inl_0_result;
                break _inl_10__inl_6;
            }
            let _inl_10__inl_7_result;
            _inl_10__inl_7: {
                const _inl_10__inl_7__inl_1_ix = (_inl_10_ix + 1);
                let _inl_10__inl_7__inl_1_result;
                _inl_10__inl_7__inl_1: {
                    _inl_10__inl_7__inl_1_result = ((_inl_10_iy * ((n_total + 1))) + _inl_10__inl_7__inl_1_ix);
                    break _inl_10__inl_7__inl_1;
                }
                _inl_10__inl_7_result = _inl_10__inl_7__inl_1_result;
                break _inl_10__inl_7;
            }
            _inl_10_result = (0.5 * ((bindings.Bx_face[_inl_10__inl_6_result] + bindings.Bx_face[_inl_10__inl_7_result])));
            break _inl_10;
        }
        const bx00 = _inl_10_result;
        let _inl_11_result;
        _inl_11: {
            const _inl_11_ix = (ix1 + ghost);
            const _inl_11_iy = (iy0 + ghost);
            let _inl_11__inl_6_result;
            _inl_11__inl_6: {
                let _inl_11__inl_6__inl_0_result;
                _inl_11__inl_6__inl_0: {
                    _inl_11__inl_6__inl_0_result = ((_inl_11_iy * ((n_total + 1))) + _inl_11_ix);
                    break _inl_11__inl_6__inl_0;
                }
                _inl_11__inl_6_result = _inl_11__inl_6__inl_0_result;
                break _inl_11__inl_6;
            }
            let _inl_11__inl_7_result;
            _inl_11__inl_7: {
                const _inl_11__inl_7__inl_1_ix = (_inl_11_ix + 1);
                let _inl_11__inl_7__inl_1_result;
                _inl_11__inl_7__inl_1: {
                    _inl_11__inl_7__inl_1_result = ((_inl_11_iy * ((n_total + 1))) + _inl_11__inl_7__inl_1_ix);
                    break _inl_11__inl_7__inl_1;
                }
                _inl_11__inl_7_result = _inl_11__inl_7__inl_1_result;
                break _inl_11__inl_7;
            }
            _inl_11_result = (0.5 * ((bindings.Bx_face[_inl_11__inl_6_result] + bindings.Bx_face[_inl_11__inl_7_result])));
            break _inl_11;
        }
        const bx10 = _inl_11_result;
        let _inl_12_result;
        _inl_12: {
            const _inl_12_ix = (ix0 + ghost);
            const _inl_12_iy = (iy1 + ghost);
            let _inl_12__inl_6_result;
            _inl_12__inl_6: {
                let _inl_12__inl_6__inl_0_result;
                _inl_12__inl_6__inl_0: {
                    _inl_12__inl_6__inl_0_result = ((_inl_12_iy * ((n_total + 1))) + _inl_12_ix);
                    break _inl_12__inl_6__inl_0;
                }
                _inl_12__inl_6_result = _inl_12__inl_6__inl_0_result;
                break _inl_12__inl_6;
            }
            let _inl_12__inl_7_result;
            _inl_12__inl_7: {
                const _inl_12__inl_7__inl_1_ix = (_inl_12_ix + 1);
                let _inl_12__inl_7__inl_1_result;
                _inl_12__inl_7__inl_1: {
                    _inl_12__inl_7__inl_1_result = ((_inl_12_iy * ((n_total + 1))) + _inl_12__inl_7__inl_1_ix);
                    break _inl_12__inl_7__inl_1;
                }
                _inl_12__inl_7_result = _inl_12__inl_7__inl_1_result;
                break _inl_12__inl_7;
            }
            _inl_12_result = (0.5 * ((bindings.Bx_face[_inl_12__inl_6_result] + bindings.Bx_face[_inl_12__inl_7_result])));
            break _inl_12;
        }
        const bx01 = _inl_12_result;
        let _inl_13_result;
        _inl_13: {
            const _inl_13_ix = (ix1 + ghost);
            const _inl_13_iy = (iy1 + ghost);
            let _inl_13__inl_6_result;
            _inl_13__inl_6: {
                let _inl_13__inl_6__inl_0_result;
                _inl_13__inl_6__inl_0: {
                    _inl_13__inl_6__inl_0_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13_ix);
                    break _inl_13__inl_6__inl_0;
                }
                _inl_13__inl_6_result = _inl_13__inl_6__inl_0_result;
                break _inl_13__inl_6;
            }
            let _inl_13__inl_7_result;
            _inl_13__inl_7: {
                const _inl_13__inl_7__inl_1_ix = (_inl_13_ix + 1);
                let _inl_13__inl_7__inl_1_result;
                _inl_13__inl_7__inl_1: {
                    _inl_13__inl_7__inl_1_result = ((_inl_13_iy * ((n_total + 1))) + _inl_13__inl_7__inl_1_ix);
                    break _inl_13__inl_7__inl_1;
                }
                _inl_13__inl_7_result = _inl_13__inl_7__inl_1_result;
                break _inl_13__inl_7;
            }
            _inl_13_result = (0.5 * ((bindings.Bx_face[_inl_13__inl_6_result] + bindings.Bx_face[_inl_13__inl_7_result])));
            break _inl_13;
        }
        const bx11 = _inl_13_result;
        let _inl_14_result;
        _inl_14: {
            const _inl_14_ix = (ix0 + ghost);
            const _inl_14_iy = (iy0 + ghost);
            let _inl_14__inl_8_result;
            _inl_14__inl_8: {
                let _inl_14__inl_8__inl_2_result;
                _inl_14__inl_8__inl_2: {
                    _inl_14__inl_8__inl_2_result = ((_inl_14_iy * n_total) + _inl_14_ix);
                    break _inl_14__inl_8__inl_2;
                }
                _inl_14__inl_8_result = _inl_14__inl_8__inl_2_result;
                break _inl_14__inl_8;
            }
            let _inl_14__inl_9_result;
            _inl_14__inl_9: {
                const _inl_14__inl_9__inl_3_iy = (_inl_14_iy + 1);
                let _inl_14__inl_9__inl_3_result;
                _inl_14__inl_9__inl_3: {
                    _inl_14__inl_9__inl_3_result = ((_inl_14__inl_9__inl_3_iy * n_total) + _inl_14_ix);
                    break _inl_14__inl_9__inl_3;
                }
                _inl_14__inl_9_result = _inl_14__inl_9__inl_3_result;
                break _inl_14__inl_9;
            }
            _inl_14_result = (0.5 * ((bindings.By_face[_inl_14__inl_8_result] + bindings.By_face[_inl_14__inl_9_result])));
            break _inl_14;
        }
        const by00 = _inl_14_result;
        let _inl_15_result;
        _inl_15: {
            const _inl_15_ix = (ix1 + ghost);
            const _inl_15_iy = (iy0 + ghost);
            let _inl_15__inl_8_result;
            _inl_15__inl_8: {
                let _inl_15__inl_8__inl_2_result;
                _inl_15__inl_8__inl_2: {
                    _inl_15__inl_8__inl_2_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                    break _inl_15__inl_8__inl_2;
                }
                _inl_15__inl_8_result = _inl_15__inl_8__inl_2_result;
                break _inl_15__inl_8;
            }
            let _inl_15__inl_9_result;
            _inl_15__inl_9: {
                const _inl_15__inl_9__inl_3_iy = (_inl_15_iy + 1);
                let _inl_15__inl_9__inl_3_result;
                _inl_15__inl_9__inl_3: {
                    _inl_15__inl_9__inl_3_result = ((_inl_15__inl_9__inl_3_iy * n_total) + _inl_15_ix);
                    break _inl_15__inl_9__inl_3;
                }
                _inl_15__inl_9_result = _inl_15__inl_9__inl_3_result;
                break _inl_15__inl_9;
            }
            _inl_15_result = (0.5 * ((bindings.By_face[_inl_15__inl_8_result] + bindings.By_face[_inl_15__inl_9_result])));
            break _inl_15;
        }
        const by10 = _inl_15_result;
        let _inl_16_result;
        _inl_16: {
            const _inl_16_ix = (ix0 + ghost);
            const _inl_16_iy = (iy1 + ghost);
            let _inl_16__inl_8_result;
            _inl_16__inl_8: {
                let _inl_16__inl_8__inl_2_result;
                _inl_16__inl_8__inl_2: {
                    _inl_16__inl_8__inl_2_result = ((_inl_16_iy * n_total) + _inl_16_ix);
                    break _inl_16__inl_8__inl_2;
                }
                _inl_16__inl_8_result = _inl_16__inl_8__inl_2_result;
                break _inl_16__inl_8;
            }
            let _inl_16__inl_9_result;
            _inl_16__inl_9: {
                const _inl_16__inl_9__inl_3_iy = (_inl_16_iy + 1);
                let _inl_16__inl_9__inl_3_result;
                _inl_16__inl_9__inl_3: {
                    _inl_16__inl_9__inl_3_result = ((_inl_16__inl_9__inl_3_iy * n_total) + _inl_16_ix);
                    break _inl_16__inl_9__inl_3;
                }
                _inl_16__inl_9_result = _inl_16__inl_9__inl_3_result;
                break _inl_16__inl_9;
            }
            _inl_16_result = (0.5 * ((bindings.By_face[_inl_16__inl_8_result] + bindings.By_face[_inl_16__inl_9_result])));
            break _inl_16;
        }
        const by01 = _inl_16_result;
        let _inl_17_result;
        _inl_17: {
            const _inl_17_ix = (ix1 + ghost);
            const _inl_17_iy = (iy1 + ghost);
            let _inl_17__inl_8_result;
            _inl_17__inl_8: {
                let _inl_17__inl_8__inl_2_result;
                _inl_17__inl_8__inl_2: {
                    _inl_17__inl_8__inl_2_result = ((_inl_17_iy * n_total) + _inl_17_ix);
                    break _inl_17__inl_8__inl_2;
                }
                _inl_17__inl_8_result = _inl_17__inl_8__inl_2_result;
                break _inl_17__inl_8;
            }
            let _inl_17__inl_9_result;
            _inl_17__inl_9: {
                const _inl_17__inl_9__inl_3_iy = (_inl_17_iy + 1);
                let _inl_17__inl_9__inl_3_result;
                _inl_17__inl_9__inl_3: {
                    _inl_17__inl_9__inl_3_result = ((_inl_17__inl_9__inl_3_iy * n_total) + _inl_17_ix);
                    break _inl_17__inl_9__inl_3;
                }
                _inl_17__inl_9_result = _inl_17__inl_9__inl_3_result;
                break _inl_17__inl_9;
            }
            _inl_17_result = (0.5 * ((bindings.By_face[_inl_17__inl_8_result] + bindings.By_face[_inl_17__inl_9_result])));
            break _inl_17;
        }
        const by11 = _inl_17_result;
        const bx0 = (bx00 + (bx10 - bx00) * fx);
        const bx1 = (bx01 + (bx11 - bx01) * fx);
        const bx = (bx0 + (bx1 - bx0) * fy);
        const by0 = (by00 + (by10 - by00) * fx);
        const by1 = (by01 + (by11 - by01) * fx);
        const by = (by0 + (by1 - by0) * fy);
        const mag = Math.sqrt(((bx * bx) + (by * by)));
        if ((mag < LIC_B_EPS)) {
            return {x:0.0, y:0.0};
        }
        return {x:(bx / mag), y:(by / mag)};
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const Wx = 64, Wy = 64, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _b_noise = bindings.noise;
        const _b_lic_out = bindings.lic_out;
        const _b_lic_u = bindings.lic_u;
        const _u_lic_u_lic_phase = _b_lic_u.lic_phase;
        const _u_lic_u_lic_drift_x = _b_lic_u.lic_drift_x;
        const _u_lic_u_lic_drift_y = _b_lic_u.lic_drift_y;
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
                        const noise_n = 1024;
                        const phase = _u_lic_u_lic_phase;
                        const drift_x = _u_lic_u_lic_drift_x;
                        const drift_y = _u_lic_u_lic_drift_y;
                        let px = ((+(gid_x)) + 0.5);
                        let py = ((+(gid_y)) + 0.5);
                        const scale_x = ((+(noise_n)) / (+(n_interior)));
                        const scale_y = ((+(noise_n)) / (+(n_interior)));
                        let sum = 0.0;
                        let n_samples = 0.0;
                        let stopped = false;
                        for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                            const nx = ((px * scale_x) + (phase * drift_x));
                            const ny = ((py * scale_y) + (phase * drift_y));
                            let _inl_18_result;
                            _inl_18: {
                                const _inl_18_N = (+(noise_n));
                                const _inl_18_xw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((nx - (Math.floor((nx / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                const _inl_18_yw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ny - (Math.floor((ny / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                const _inl_18_x0 = (((Math.floor(_inl_18_xw)) >>> 0) % noise_n);
                                const _inl_18_y0 = (((Math.floor(_inl_18_yw)) >>> 0) % noise_n);
                                const _inl_18_x1 = (((_inl_18_x0 + 1)) % noise_n);
                                const _inl_18_y1 = (((_inl_18_y0 + 1)) % noise_n);
                                const _inl_18_fx = (_inl_18_xw - Math.floor(_inl_18_xw));
                                const _inl_18_fy = (_inl_18_yw - Math.floor(_inl_18_yw));
                                const _inl_18_n00 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x0)];
                                const _inl_18_n10 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x1)];
                                const _inl_18_n01 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x0)];
                                const _inl_18_n11 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x1)];
                                const _inl_18_nx0 = (_inl_18_n00 + (_inl_18_n10 - _inl_18_n00) * _inl_18_fx);
                                const _inl_18_nx1 = (_inl_18_n01 + (_inl_18_n11 - _inl_18_n01) * _inl_18_fx);
                                _inl_18_result = (_inl_18_nx0 + (_inl_18_nx1 - _inl_18_nx0) * _inl_18_fy);
                                break _inl_18;
                            }
                            sum = (sum + _inl_18_result);
                            n_samples = (n_samples + 1.0);
                            if (stopped) {
                                continue;
                            }
                            const _sroa_0 = sample_b_unit(px, py, ghost, n_total, n_interior);
                            const k1_x = _sroa_0.x;
                            const k1_y = _sroa_0.y;
                            if (((k1_x == 0.0) && (k1_y == 0.0))) {
                                stopped = true;
                                continue;
                            }
                            const mx = (px - ((0.5 * LIC_STEP_SIZE) * k1_x));
                            const my = (py - ((0.5 * LIC_STEP_SIZE) * k1_y));
                            const _sroa_1 = sample_b_unit(mx, my, ghost, n_total, n_interior);
                            const k2_x = _sroa_1.x;
                            const k2_y = _sroa_1.y;
                            if (((k2_x == 0.0) && (k2_y == 0.0))) {
                                stopped = true;
                                continue;
                            }
                            px = (px - (LIC_STEP_SIZE * k2_x));
                            py = (py - (LIC_STEP_SIZE * k2_y));
                        }
                        const lum = (sum / ((n_samples) < (1.0) ? (1.0) : (n_samples)));
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        _b_lic_out[cell_idx_total(ix, iy, n_total)] = lum;
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
                            const noise_n = 1024;
                            const phase = _u_lic_u_lic_phase;
                            const drift_x = _u_lic_u_lic_drift_x;
                            const drift_y = _u_lic_u_lic_drift_y;
                            let px = ((+(gid_x)) + 0.5);
                            let py = ((+(gid_y)) + 0.5);
                            const scale_x = ((+(noise_n)) / (+(n_interior)));
                            const scale_y = ((+(noise_n)) / (+(n_interior)));
                            let sum = 0.0;
                            let n_samples = 0.0;
                            let stopped = false;
                            for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                                const nx = ((px * scale_x) + (phase * drift_x));
                                const ny = ((py * scale_y) + (phase * drift_y));
                                let _inl_18_result;
                                _inl_18: {
                                    const _inl_18_N = (+(noise_n));
                                    const _inl_18_xw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((nx - (Math.floor((nx / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                    const _inl_18_yw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ny - (Math.floor((ny / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                    const _inl_18_x0 = (((Math.floor(_inl_18_xw)) >>> 0) % noise_n);
                                    const _inl_18_y0 = (((Math.floor(_inl_18_yw)) >>> 0) % noise_n);
                                    const _inl_18_x1 = (((_inl_18_x0 + 1)) % noise_n);
                                    const _inl_18_y1 = (((_inl_18_y0 + 1)) % noise_n);
                                    const _inl_18_fx = (_inl_18_xw - Math.floor(_inl_18_xw));
                                    const _inl_18_fy = (_inl_18_yw - Math.floor(_inl_18_yw));
                                    const _inl_18_n00 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x0)];
                                    const _inl_18_n10 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x1)];
                                    const _inl_18_n01 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x0)];
                                    const _inl_18_n11 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x1)];
                                    const _inl_18_nx0 = (_inl_18_n00 + (_inl_18_n10 - _inl_18_n00) * _inl_18_fx);
                                    const _inl_18_nx1 = (_inl_18_n01 + (_inl_18_n11 - _inl_18_n01) * _inl_18_fx);
                                    _inl_18_result = (_inl_18_nx0 + (_inl_18_nx1 - _inl_18_nx0) * _inl_18_fy);
                                    break _inl_18;
                                }
                                sum = (sum + _inl_18_result);
                                n_samples = (n_samples + 1.0);
                                if (stopped) {
                                    continue;
                                }
                                const _sroa_2 = sample_b_unit(px, py, ghost, n_total, n_interior);
                                const k1_x = _sroa_2.x;
                                const k1_y = _sroa_2.y;
                                if (((k1_x == 0.0) && (k1_y == 0.0))) {
                                    stopped = true;
                                    continue;
                                }
                                const mx = (px - ((0.5 * LIC_STEP_SIZE) * k1_x));
                                const my = (py - ((0.5 * LIC_STEP_SIZE) * k1_y));
                                const _sroa_3 = sample_b_unit(mx, my, ghost, n_total, n_interior);
                                const k2_x = _sroa_3.x;
                                const k2_y = _sroa_3.y;
                                if (((k2_x == 0.0) && (k2_y == 0.0))) {
                                    stopped = true;
                                    continue;
                                }
                                px = (px - (LIC_STEP_SIZE * k2_x));
                                py = (py - (LIC_STEP_SIZE * k2_y));
                            }
                            const lum = (sum / ((n_samples) < (1.0) ? (1.0) : (n_samples)));
                            const ix = (gid_x + ghost);
                            const iy = (gid_y + ghost);
                            _b_lic_out[cell_idx_total(ix, iy, n_total)] = lum;
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
                        const noise_n = 1024;
                        const phase = _u_lic_u_lic_phase;
                        const drift_x = _u_lic_u_lic_drift_x;
                        const drift_y = _u_lic_u_lic_drift_y;
                        let px = ((+(gid_x)) + 0.5);
                        let py = ((+(gid_y)) + 0.5);
                        const scale_x = ((+(noise_n)) / (+(n_interior)));
                        const scale_y = ((+(noise_n)) / (+(n_interior)));
                        let sum = 0.0;
                        let n_samples = 0.0;
                        let stopped = false;
                        for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                            const nx = ((px * scale_x) + (phase * drift_x));
                            const ny = ((py * scale_y) + (phase * drift_y));
                            let _inl_18_result;
                            _inl_18: {
                                const _inl_18_N = (+(noise_n));
                                const _inl_18_xw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((nx - (Math.floor((nx / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                const _inl_18_yw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ny - (Math.floor((ny / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                                const _inl_18_x0 = (((Math.floor(_inl_18_xw)) >>> 0) % noise_n);
                                const _inl_18_y0 = (((Math.floor(_inl_18_yw)) >>> 0) % noise_n);
                                const _inl_18_x1 = (((_inl_18_x0 + 1)) % noise_n);
                                const _inl_18_y1 = (((_inl_18_y0 + 1)) % noise_n);
                                const _inl_18_fx = (_inl_18_xw - Math.floor(_inl_18_xw));
                                const _inl_18_fy = (_inl_18_yw - Math.floor(_inl_18_yw));
                                const _inl_18_n00 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x0)];
                                const _inl_18_n10 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x1)];
                                const _inl_18_n01 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x0)];
                                const _inl_18_n11 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x1)];
                                const _inl_18_nx0 = (_inl_18_n00 + (_inl_18_n10 - _inl_18_n00) * _inl_18_fx);
                                const _inl_18_nx1 = (_inl_18_n01 + (_inl_18_n11 - _inl_18_n01) * _inl_18_fx);
                                _inl_18_result = (_inl_18_nx0 + (_inl_18_nx1 - _inl_18_nx0) * _inl_18_fy);
                                break _inl_18;
                            }
                            sum = (sum + _inl_18_result);
                            n_samples = (n_samples + 1.0);
                            if (stopped) {
                                continue;
                            }
                            const _sroa_4 = sample_b_unit(px, py, ghost, n_total, n_interior);
                            const k1_x = _sroa_4.x;
                            const k1_y = _sroa_4.y;
                            if (((k1_x == 0.0) && (k1_y == 0.0))) {
                                stopped = true;
                                continue;
                            }
                            const mx = (px - ((0.5 * LIC_STEP_SIZE) * k1_x));
                            const my = (py - ((0.5 * LIC_STEP_SIZE) * k1_y));
                            const _sroa_5 = sample_b_unit(mx, my, ghost, n_total, n_interior);
                            const k2_x = _sroa_5.x;
                            const k2_y = _sroa_5.y;
                            if (((k2_x == 0.0) && (k2_y == 0.0))) {
                                stopped = true;
                                continue;
                            }
                            px = (px - (LIC_STEP_SIZE * k2_x));
                            py = (py - (LIC_STEP_SIZE * k2_y));
                        }
                        const lum = (sum / ((n_samples) < (1.0) ? (1.0) : (n_samples)));
                        const ix = (gid_x + ghost);
                        const iy = (gid_y + ghost);
                        _b_lic_out[cell_idx_total(ix, iy, n_total)] = lum;
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
                    const noise_n = 1024;
                    const phase = _u_lic_u_lic_phase;
                    const drift_x = _u_lic_u_lic_drift_x;
                    const drift_y = _u_lic_u_lic_drift_y;
                    let px = ((+(gid_x)) + 0.5);
                    let py = ((+(gid_y)) + 0.5);
                    const scale_x = ((+(noise_n)) / (+(n_interior)));
                    const scale_y = ((+(noise_n)) / (+(n_interior)));
                    let sum = 0.0;
                    let n_samples = 0.0;
                    let stopped = false;
                    for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                        const nx = ((px * scale_x) + (phase * drift_x));
                        const ny = ((py * scale_y) + (phase * drift_y));
                        let _inl_18_result;
                        _inl_18: {
                            const _inl_18_N = (+(noise_n));
                            const _inl_18_xw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((nx - (Math.floor((nx / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                            const _inl_18_yw = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((ny - (Math.floor((ny / _inl_18_N)) * _inl_18_N)), 0.0, _inl_18_N));
                            const _inl_18_x0 = (((Math.floor(_inl_18_xw)) >>> 0) % noise_n);
                            const _inl_18_y0 = (((Math.floor(_inl_18_yw)) >>> 0) % noise_n);
                            const _inl_18_x1 = (((_inl_18_x0 + 1)) % noise_n);
                            const _inl_18_y1 = (((_inl_18_y0 + 1)) % noise_n);
                            const _inl_18_fx = (_inl_18_xw - Math.floor(_inl_18_xw));
                            const _inl_18_fy = (_inl_18_yw - Math.floor(_inl_18_yw));
                            const _inl_18_n00 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x0)];
                            const _inl_18_n10 = _b_noise[((_inl_18_y0 * noise_n) + _inl_18_x1)];
                            const _inl_18_n01 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x0)];
                            const _inl_18_n11 = _b_noise[((_inl_18_y1 * noise_n) + _inl_18_x1)];
                            const _inl_18_nx0 = (_inl_18_n00 + (_inl_18_n10 - _inl_18_n00) * _inl_18_fx);
                            const _inl_18_nx1 = (_inl_18_n01 + (_inl_18_n11 - _inl_18_n01) * _inl_18_fx);
                            _inl_18_result = (_inl_18_nx0 + (_inl_18_nx1 - _inl_18_nx0) * _inl_18_fy);
                            break _inl_18;
                        }
                        sum = (sum + _inl_18_result);
                        n_samples = (n_samples + 1.0);
                        if (stopped) {
                            continue;
                        }
                        const _sroa_6 = sample_b_unit(px, py, ghost, n_total, n_interior);
                        const k1_x = _sroa_6.x;
                        const k1_y = _sroa_6.y;
                        if (((k1_x == 0.0) && (k1_y == 0.0))) {
                            stopped = true;
                            continue;
                        }
                        const mx = (px - ((0.5 * LIC_STEP_SIZE) * k1_x));
                        const my = (py - ((0.5 * LIC_STEP_SIZE) * k1_y));
                        const _sroa_7 = sample_b_unit(mx, my, ghost, n_total, n_interior);
                        const k2_x = _sroa_7.x;
                        const k2_y = _sroa_7.y;
                        if (((k2_x == 0.0) && (k2_y == 0.0))) {
                            stopped = true;
                            continue;
                        }
                        px = (px - (LIC_STEP_SIZE * k2_x));
                        py = (py - (LIC_STEP_SIZE * k2_y));
                    }
                    const lum = (sum / ((n_samples) < (1.0) ? (1.0) : (n_samples)));
                    const ix = (gid_x + ghost);
                    const iy = (gid_y + ghost);
                    _b_lic_out[cell_idx_total(ix, iy, n_total)] = lum;
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

    return { entry, bind, bindings: ["U_uniforms","Bx_face","By_face","noise","lic_out","lic_u"], entryInfo };
}
