// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/lic-advect.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: a192ed0d27dc04254bde50b968f756b2a99fcd5715772c52ae6f44aa3d3ee1d0
// generated: 2026-05-25T23:32:29.814Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const LIC_STEPS = 20;
    const LIC_STEP_SIZE = 0.5;
    const LIC_B_EPS = 1.0e-8;

    function cell_idx_total(ix, iy, n_total) {
        return ((iy * n_total) + ix);
    }

    function sample_noise(px, py, noise_n) {
        const N = rt.f32(noise_n);
        const xw = rt.clampScalar((px - (Math.floor((px / N)) * N)), 0.0, N);
        const yw = rt.clampScalar((py - (Math.floor((py / N)) * N)), 0.0, N);
        const x0 = (rt.u32(Math.floor(xw)) % noise_n);
        const y0 = (rt.u32(Math.floor(yw)) % noise_n);
        const x1 = (((x0 + 1)) % noise_n);
        const y1 = (((y0 + 1)) % noise_n);
        const fx = (xw - Math.floor(xw));
        const fy = (yw - Math.floor(yw));
        const n00 = bindings.noise[((y0 * noise_n) + x0)];
        const n10 = bindings.noise[((y0 * noise_n) + x1)];
        const n01 = bindings.noise[((y1 * noise_n) + x0)];
        const n11 = bindings.noise[((y1 * noise_n) + x1)];
        const nx0 = (n00 + (n10 - n00) * fx);
        const nx1 = (n01 + (n11 - n01) * fx);
        return (nx0 + (nx1 - nx0) * fy);
    }

    function sample_b_unit(cx, cy, ghost, n_total, n_interior) {
        const ni = rt.f32(n_interior);
        const cxc = rt.clampScalar(cx, 0.0, (ni - 1.0001));
        const cyc = rt.clampScalar(cy, 0.0, (ni - 1.0001));
        const ix0 = rt.u32(Math.floor(cxc));
        const iy0 = rt.u32(Math.floor(cyc));
        const ix1 = (ix0 + 1);
        const iy1 = (iy0 + 1);
        const fx = (cxc - Math.floor(cxc));
        const fy = (cyc - Math.floor(cyc));
        let _inl_8_result;
        _inl_8: {
            const _inl_8_ix = (ix0 + ghost);
            const _inl_8_iy = (iy0 + ghost);
            let _inl_8__inl_4_result;
            _inl_8__inl_4: {
                let _inl_8__inl_4__inl_0_result;
                _inl_8__inl_4__inl_0: {
                    _inl_8__inl_4__inl_0_result = ((_inl_8_iy * ((n_total + 1))) + _inl_8_ix);
                    break _inl_8__inl_4__inl_0;
                }
                _inl_8__inl_4_result = _inl_8__inl_4__inl_0_result;
                break _inl_8__inl_4;
            }
            let _inl_8__inl_5_result;
            _inl_8__inl_5: {
                const _inl_8__inl_5__inl_1_ix = (_inl_8_ix + 1);
                let _inl_8__inl_5__inl_1_result;
                _inl_8__inl_5__inl_1: {
                    _inl_8__inl_5__inl_1_result = ((_inl_8_iy * ((n_total + 1))) + _inl_8__inl_5__inl_1_ix);
                    break _inl_8__inl_5__inl_1;
                }
                _inl_8__inl_5_result = _inl_8__inl_5__inl_1_result;
                break _inl_8__inl_5;
            }
            _inl_8_result = (0.5 * ((bindings.Bx_face[_inl_8__inl_4_result] + bindings.Bx_face[_inl_8__inl_5_result])));
            break _inl_8;
        }
        const bx00 = _inl_8_result;
        let _inl_9_result;
        _inl_9: {
            const _inl_9_ix = (ix1 + ghost);
            const _inl_9_iy = (iy0 + ghost);
            let _inl_9__inl_4_result;
            _inl_9__inl_4: {
                let _inl_9__inl_4__inl_0_result;
                _inl_9__inl_4__inl_0: {
                    _inl_9__inl_4__inl_0_result = ((_inl_9_iy * ((n_total + 1))) + _inl_9_ix);
                    break _inl_9__inl_4__inl_0;
                }
                _inl_9__inl_4_result = _inl_9__inl_4__inl_0_result;
                break _inl_9__inl_4;
            }
            let _inl_9__inl_5_result;
            _inl_9__inl_5: {
                const _inl_9__inl_5__inl_1_ix = (_inl_9_ix + 1);
                let _inl_9__inl_5__inl_1_result;
                _inl_9__inl_5__inl_1: {
                    _inl_9__inl_5__inl_1_result = ((_inl_9_iy * ((n_total + 1))) + _inl_9__inl_5__inl_1_ix);
                    break _inl_9__inl_5__inl_1;
                }
                _inl_9__inl_5_result = _inl_9__inl_5__inl_1_result;
                break _inl_9__inl_5;
            }
            _inl_9_result = (0.5 * ((bindings.Bx_face[_inl_9__inl_4_result] + bindings.Bx_face[_inl_9__inl_5_result])));
            break _inl_9;
        }
        const bx10 = _inl_9_result;
        let _inl_10_result;
        _inl_10: {
            const _inl_10_ix = (ix0 + ghost);
            const _inl_10_iy = (iy1 + ghost);
            let _inl_10__inl_4_result;
            _inl_10__inl_4: {
                let _inl_10__inl_4__inl_0_result;
                _inl_10__inl_4__inl_0: {
                    _inl_10__inl_4__inl_0_result = ((_inl_10_iy * ((n_total + 1))) + _inl_10_ix);
                    break _inl_10__inl_4__inl_0;
                }
                _inl_10__inl_4_result = _inl_10__inl_4__inl_0_result;
                break _inl_10__inl_4;
            }
            let _inl_10__inl_5_result;
            _inl_10__inl_5: {
                const _inl_10__inl_5__inl_1_ix = (_inl_10_ix + 1);
                let _inl_10__inl_5__inl_1_result;
                _inl_10__inl_5__inl_1: {
                    _inl_10__inl_5__inl_1_result = ((_inl_10_iy * ((n_total + 1))) + _inl_10__inl_5__inl_1_ix);
                    break _inl_10__inl_5__inl_1;
                }
                _inl_10__inl_5_result = _inl_10__inl_5__inl_1_result;
                break _inl_10__inl_5;
            }
            _inl_10_result = (0.5 * ((bindings.Bx_face[_inl_10__inl_4_result] + bindings.Bx_face[_inl_10__inl_5_result])));
            break _inl_10;
        }
        const bx01 = _inl_10_result;
        let _inl_11_result;
        _inl_11: {
            const _inl_11_ix = (ix1 + ghost);
            const _inl_11_iy = (iy1 + ghost);
            let _inl_11__inl_4_result;
            _inl_11__inl_4: {
                let _inl_11__inl_4__inl_0_result;
                _inl_11__inl_4__inl_0: {
                    _inl_11__inl_4__inl_0_result = ((_inl_11_iy * ((n_total + 1))) + _inl_11_ix);
                    break _inl_11__inl_4__inl_0;
                }
                _inl_11__inl_4_result = _inl_11__inl_4__inl_0_result;
                break _inl_11__inl_4;
            }
            let _inl_11__inl_5_result;
            _inl_11__inl_5: {
                const _inl_11__inl_5__inl_1_ix = (_inl_11_ix + 1);
                let _inl_11__inl_5__inl_1_result;
                _inl_11__inl_5__inl_1: {
                    _inl_11__inl_5__inl_1_result = ((_inl_11_iy * ((n_total + 1))) + _inl_11__inl_5__inl_1_ix);
                    break _inl_11__inl_5__inl_1;
                }
                _inl_11__inl_5_result = _inl_11__inl_5__inl_1_result;
                break _inl_11__inl_5;
            }
            _inl_11_result = (0.5 * ((bindings.Bx_face[_inl_11__inl_4_result] + bindings.Bx_face[_inl_11__inl_5_result])));
            break _inl_11;
        }
        const bx11 = _inl_11_result;
        let _inl_12_result;
        _inl_12: {
            const _inl_12_ix = (ix0 + ghost);
            const _inl_12_iy = (iy0 + ghost);
            let _inl_12__inl_6_result;
            _inl_12__inl_6: {
                let _inl_12__inl_6__inl_2_result;
                _inl_12__inl_6__inl_2: {
                    _inl_12__inl_6__inl_2_result = ((_inl_12_iy * n_total) + _inl_12_ix);
                    break _inl_12__inl_6__inl_2;
                }
                _inl_12__inl_6_result = _inl_12__inl_6__inl_2_result;
                break _inl_12__inl_6;
            }
            let _inl_12__inl_7_result;
            _inl_12__inl_7: {
                const _inl_12__inl_7__inl_3_iy = (_inl_12_iy + 1);
                let _inl_12__inl_7__inl_3_result;
                _inl_12__inl_7__inl_3: {
                    _inl_12__inl_7__inl_3_result = ((_inl_12__inl_7__inl_3_iy * n_total) + _inl_12_ix);
                    break _inl_12__inl_7__inl_3;
                }
                _inl_12__inl_7_result = _inl_12__inl_7__inl_3_result;
                break _inl_12__inl_7;
            }
            _inl_12_result = (0.5 * ((bindings.By_face[_inl_12__inl_6_result] + bindings.By_face[_inl_12__inl_7_result])));
            break _inl_12;
        }
        const by00 = _inl_12_result;
        let _inl_13_result;
        _inl_13: {
            const _inl_13_ix = (ix1 + ghost);
            const _inl_13_iy = (iy0 + ghost);
            let _inl_13__inl_6_result;
            _inl_13__inl_6: {
                let _inl_13__inl_6__inl_2_result;
                _inl_13__inl_6__inl_2: {
                    _inl_13__inl_6__inl_2_result = ((_inl_13_iy * n_total) + _inl_13_ix);
                    break _inl_13__inl_6__inl_2;
                }
                _inl_13__inl_6_result = _inl_13__inl_6__inl_2_result;
                break _inl_13__inl_6;
            }
            let _inl_13__inl_7_result;
            _inl_13__inl_7: {
                const _inl_13__inl_7__inl_3_iy = (_inl_13_iy + 1);
                let _inl_13__inl_7__inl_3_result;
                _inl_13__inl_7__inl_3: {
                    _inl_13__inl_7__inl_3_result = ((_inl_13__inl_7__inl_3_iy * n_total) + _inl_13_ix);
                    break _inl_13__inl_7__inl_3;
                }
                _inl_13__inl_7_result = _inl_13__inl_7__inl_3_result;
                break _inl_13__inl_7;
            }
            _inl_13_result = (0.5 * ((bindings.By_face[_inl_13__inl_6_result] + bindings.By_face[_inl_13__inl_7_result])));
            break _inl_13;
        }
        const by10 = _inl_13_result;
        let _inl_14_result;
        _inl_14: {
            const _inl_14_ix = (ix0 + ghost);
            const _inl_14_iy = (iy1 + ghost);
            let _inl_14__inl_6_result;
            _inl_14__inl_6: {
                let _inl_14__inl_6__inl_2_result;
                _inl_14__inl_6__inl_2: {
                    _inl_14__inl_6__inl_2_result = ((_inl_14_iy * n_total) + _inl_14_ix);
                    break _inl_14__inl_6__inl_2;
                }
                _inl_14__inl_6_result = _inl_14__inl_6__inl_2_result;
                break _inl_14__inl_6;
            }
            let _inl_14__inl_7_result;
            _inl_14__inl_7: {
                const _inl_14__inl_7__inl_3_iy = (_inl_14_iy + 1);
                let _inl_14__inl_7__inl_3_result;
                _inl_14__inl_7__inl_3: {
                    _inl_14__inl_7__inl_3_result = ((_inl_14__inl_7__inl_3_iy * n_total) + _inl_14_ix);
                    break _inl_14__inl_7__inl_3;
                }
                _inl_14__inl_7_result = _inl_14__inl_7__inl_3_result;
                break _inl_14__inl_7;
            }
            _inl_14_result = (0.5 * ((bindings.By_face[_inl_14__inl_6_result] + bindings.By_face[_inl_14__inl_7_result])));
            break _inl_14;
        }
        const by01 = _inl_14_result;
        let _inl_15_result;
        _inl_15: {
            const _inl_15_ix = (ix1 + ghost);
            const _inl_15_iy = (iy1 + ghost);
            let _inl_15__inl_6_result;
            _inl_15__inl_6: {
                let _inl_15__inl_6__inl_2_result;
                _inl_15__inl_6__inl_2: {
                    _inl_15__inl_6__inl_2_result = ((_inl_15_iy * n_total) + _inl_15_ix);
                    break _inl_15__inl_6__inl_2;
                }
                _inl_15__inl_6_result = _inl_15__inl_6__inl_2_result;
                break _inl_15__inl_6;
            }
            let _inl_15__inl_7_result;
            _inl_15__inl_7: {
                const _inl_15__inl_7__inl_3_iy = (_inl_15_iy + 1);
                let _inl_15__inl_7__inl_3_result;
                _inl_15__inl_7__inl_3: {
                    _inl_15__inl_7__inl_3_result = ((_inl_15__inl_7__inl_3_iy * n_total) + _inl_15_ix);
                    break _inl_15__inl_7__inl_3;
                }
                _inl_15__inl_7_result = _inl_15__inl_7__inl_3_result;
                break _inl_15__inl_7;
            }
            _inl_15_result = (0.5 * ((bindings.By_face[_inl_15__inl_6_result] + bindings.By_face[_inl_15__inl_7_result])));
            break _inl_15;
        }
        const by11 = _inl_15_result;
        const bx0 = (bx00 + (bx10 - bx00) * fx);
        const bx1 = (bx01 + (bx11 - bx01) * fx);
        const bx = (bx0 + (bx1 - bx0) * fy);
        const by0 = (by00 + (by10 - by00) * fx);
        const by1 = (by01 + (by11 - by01) * fx);
        const by = (by0 + (by1 - by0) * fy);
        const mag = Math.sqrt(((bx * bx) + (by * by)));
        if ((mag < LIC_B_EPS)) {
            return rt.vec2(0.0, 0.0);
        }
        return rt.vec2((bx / mag), (by / mag));
    }

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_noise_n = _b_U_uniforms.noise_n;
        const _b_lic_out = bindings.lic_out;
        const _b_lic_u = bindings.lic_u;
        const _u_lic_u_lic_phase = _b_lic_u.lic_phase;
        const _u_lic_u_lic_drift_x = _b_lic_u.lic_drift_x;
        const _u_lic_u_lic_drift_y = _b_lic_u.lic_drift_y;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const noise_n = _u_U_uniforms_noise_n;
                    const phase = _u_lic_u_lic_phase;
                    const drift_x = _u_lic_u_lic_drift_x;
                    const drift_y = _u_lic_u_lic_drift_y;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    let px = (rt.f32(gid_x) + 0.5);
                    let py = (rt.f32(gid_y) + 0.5);
                    const scale_x = (rt.f32(noise_n) / rt.f32(n_interior));
                    const scale_y = (rt.f32(noise_n) / rt.f32(n_interior));
                    let sum = 0.0;
                    let n_samples = 0.0;
                    let stopped = false;
                    for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                        const nx = ((px * scale_x) + (phase * drift_x));
                        const ny = ((py * scale_y) + (phase * drift_y));
                        sum = (sum + sample_noise(nx, ny, noise_n));
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
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const noise_n = _u_U_uniforms_noise_n;
                    const phase = _u_lic_u_lic_phase;
                    const drift_x = _u_lic_u_lic_drift_x;
                    const drift_y = _u_lic_u_lic_drift_y;
                    if (((gid_x >= n_interior) || (gid_y >= n_interior))) {
                        break __invocation;
                    }
                    let px = (rt.f32(gid_x) + 0.5);
                    let py = (rt.f32(gid_y) + 0.5);
                    const scale_x = (rt.f32(noise_n) / rt.f32(n_interior));
                    const scale_y = (rt.f32(noise_n) / rt.f32(n_interior));
                    let sum = 0.0;
                    let n_samples = 0.0;
                    let stopped = false;
                    for (let k = 0; (k < LIC_STEPS); k = (k + 1)) {
                        const nx = ((px * scale_x) + (phase * drift_x));
                        const ny = ((py * scale_y) + (phase * drift_y));
                        sum = (sum + sample_noise(nx, ny, noise_n));
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
    };

    return { entry, bindings: ["U_uniforms","Bx_face","By_face","noise","lic_out","lic_u"] };
}
