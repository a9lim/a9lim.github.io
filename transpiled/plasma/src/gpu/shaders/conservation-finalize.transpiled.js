// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/conservation-finalize.wgsl
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: f14e4db4ebfb9d2f0f47eb6983e31c30fc05c32c0eb8656efd9aef11bf6f7337
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":11881,"lines":229,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":1,"flatWorkgroupSlots":1536,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.633Z
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
    const FINAL_THREADS = 64;

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["finalize"] = {"workgroupSize":[64,1,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_0_finalize(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 64, Ly = 1, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _b_tile_partials = bindings.tile_partials;
        const _b_cons_out = bindings.cons_out;
        const wg = Object.create(null);
        wg.final_scratch = new Float32Array(1536);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.final_scratch.fill(0);
            // Phase 0
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid = lz*Ly*Lx + ly*Lx + lx;
                    {
                        const n_interior = _u_U_uniforms_grid_n;
                        const tiles_per_axis = (((n_interior + 7)) / 8);
                        const num_tiles = (tiles_per_axis * tiles_per_axis);
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
                        for (let t = lid; (t < num_tiles); t = (t + FINAL_THREADS)) {
                            const off = (t * QUANTITY_COUNT);
                            s0 = (s0 + _b_tile_partials[off]);
                            s1 = (s1 + _b_tile_partials[(off + 1)]);
                            s2 = (s2 + _b_tile_partials[(off + 2)]);
                            s3 = (s3 + _b_tile_partials[(off + 3)]);
                            s4 = (s4 + _b_tile_partials[(off + 4)]);
                            s5 = (s5 + _b_tile_partials[(off + 5)]);
                            s6 = (s6 + _b_tile_partials[(off + 6)]);
                            s7 = (s7 + _b_tile_partials[(off + 7)]);
                            s8 = (s8 + _b_tile_partials[(off + 8)]);
                            s9 = (s9 + _b_tile_partials[(off + 9)]);
                            s10 = ((_b_tile_partials[(off + 10)]) < (s10) ? (_b_tile_partials[(off + 10)]) : (s10));
                            s11 = ((s11) < (_b_tile_partials[(off + 11)]) ? (_b_tile_partials[(off + 11)]) : (s11));
                            s12 = ((s12) < (_b_tile_partials[(off + 12)]) ? (_b_tile_partials[(off + 12)]) : (s12));
                            s13 = ((s13) < (_b_tile_partials[(off + 13)]) ? (_b_tile_partials[(off + 13)]) : (s13));
                            s14 = ((s14) < (_b_tile_partials[(off + 14)]) ? (_b_tile_partials[(off + 14)]) : (s14));
                            s15 = (s15 + _b_tile_partials[(off + 15)]);
                            s16 = (s16 + _b_tile_partials[(off + 16)]);
                            s17 = (s17 + _b_tile_partials[(off + 17)]);
                            s18 = (s18 + _b_tile_partials[(off + 18)]);
                            s19 = (s19 + _b_tile_partials[(off + 19)]);
                            s20 = (s20 + _b_tile_partials[(off + 20)]);
                        }
                        const base = (lid * QUANTITY_COUNT);
                        wg.final_scratch[((base))] = s0;
                        wg.final_scratch[(((base + 1)))] = s1;
                        wg.final_scratch[(((base + 2)))] = s2;
                        wg.final_scratch[(((base + 3)))] = s3;
                        wg.final_scratch[(((base + 4)))] = s4;
                        wg.final_scratch[(((base + 5)))] = s5;
                        wg.final_scratch[(((base + 6)))] = s6;
                        wg.final_scratch[(((base + 7)))] = s7;
                        wg.final_scratch[(((base + 8)))] = s8;
                        wg.final_scratch[(((base + 9)))] = s9;
                        wg.final_scratch[(((base + 10)))] = s10;
                        wg.final_scratch[(((base + 11)))] = s11;
                        wg.final_scratch[(((base + 12)))] = s12;
                        wg.final_scratch[(((base + 13)))] = s13;
                        wg.final_scratch[(((base + 14)))] = s14;
                        wg.final_scratch[(((base + 15)))] = s15;
                        wg.final_scratch[(((base + 16)))] = s16;
                        wg.final_scratch[(((base + 17)))] = s17;
                        wg.final_scratch[(((base + 18)))] = s18;
                        wg.final_scratch[(((base + 19)))] = s19;
                        wg.final_scratch[(((base + 20)))] = s20;
                        wg.final_scratch[(((base + 21)))] = 0.0;
                        wg.final_scratch[(((base + 22)))] = 0.0;
                        wg.final_scratch[(((base + 23)))] = 0.0;
                    }
                }
            }
            // Phase 1
            {
                const lz = 0;
                const ly = 0;
                for (let lx = 0; lx < Lx; lx++) {
                    const lid = lz*Ly*Lx + ly*Lx + lx;
                    {
                        const n_interior = _u_U_uniforms_grid_n;
                        const tiles_per_axis = (((n_interior + 7)) / 8);
                        const num_tiles = (tiles_per_axis * tiles_per_axis);
                        const base = (lid * QUANTITY_COUNT);
                        if ((lid == 0)) {
                            let t0 = 0.0;
                            let t1 = 0.0;
                            let t2 = 0.0;
                            let t3 = 0.0;
                            let t4 = 0.0;
                            let t5 = 0.0;
                            let t6 = 0.0;
                            let t7 = 0.0;
                            let t8 = 0.0;
                            let t9 = 0.0;
                            let t10 = 1.0e30;
                            let t11 = 0.0;
                            let t12 = 0.0;
                            let t13 = 0.0;
                            let t14 = 0.0;
                            let t15 = 0.0;
                            let t16 = 0.0;
                            let t17 = 0.0;
                            let t18 = 0.0;
                            let t19 = 0.0;
                            let t20 = 0.0;
                            for (let k = 0; (k < FINAL_THREADS); k = (k + 1)) {
                                const off = (k * QUANTITY_COUNT);
                                t0 = (t0 + wg.final_scratch[((off))]);
                                t1 = (t1 + wg.final_scratch[(((off + 1)))]);
                                t2 = (t2 + wg.final_scratch[(((off + 2)))]);
                                t3 = (t3 + wg.final_scratch[(((off + 3)))]);
                                t4 = (t4 + wg.final_scratch[(((off + 4)))]);
                                t5 = (t5 + wg.final_scratch[(((off + 5)))]);
                                t6 = (t6 + wg.final_scratch[(((off + 6)))]);
                                t7 = (t7 + wg.final_scratch[(((off + 7)))]);
                                t8 = (t8 + wg.final_scratch[(((off + 8)))]);
                                t9 = (t9 + wg.final_scratch[(((off + 9)))]);
                                t10 = ((wg.final_scratch[(((off + 10)))]) < (t10) ? (wg.final_scratch[(((off + 10)))]) : (t10));
                                t11 = ((t11) < (wg.final_scratch[(((off + 11)))]) ? (wg.final_scratch[(((off + 11)))]) : (t11));
                                t12 = ((t12) < (wg.final_scratch[(((off + 12)))]) ? (wg.final_scratch[(((off + 12)))]) : (t12));
                                t13 = ((t13) < (wg.final_scratch[(((off + 13)))]) ? (wg.final_scratch[(((off + 13)))]) : (t13));
                                t14 = ((t14) < (wg.final_scratch[(((off + 14)))]) ? (wg.final_scratch[(((off + 14)))]) : (t14));
                                t15 = (t15 + wg.final_scratch[(((off + 15)))]);
                                t16 = (t16 + wg.final_scratch[(((off + 16)))]);
                                t17 = (t17 + wg.final_scratch[(((off + 17)))]);
                                t18 = (t18 + wg.final_scratch[(((off + 18)))]);
                                t19 = (t19 + wg.final_scratch[(((off + 19)))]);
                                t20 = (t20 + wg.final_scratch[(((off + 20)))]);
                            }
                            _b_cons_out[0] = t0;
                            _b_cons_out[1] = t1;
                            _b_cons_out[2] = t2;
                            _b_cons_out[3] = t3;
                            _b_cons_out[4] = t4;
                            _b_cons_out[5] = t5;
                            _b_cons_out[6] = t6;
                            _b_cons_out[7] = t7;
                            _b_cons_out[8] = t8;
                            _b_cons_out[9] = t9;
                            _b_cons_out[10] = t10;
                            _b_cons_out[11] = t11;
                            _b_cons_out[12] = t12;
                            _b_cons_out[13] = t13;
                            _b_cons_out[14] = t14;
                            _b_cons_out[15] = t15;
                            _b_cons_out[16] = t16;
                            _b_cons_out[17] = t17;
                            _b_cons_out[18] = t18;
                            _b_cons_out[19] = t19;
                            _b_cons_out[20] = t20;
                            _b_cons_out[21] = 0.0;
                            _b_cons_out[22] = 0.0;
                            _b_cons_out[23] = 0.0;
                        }
                    }
                }
            }
        }
    }
    entry["finalize"] = function ({ workgroups, bindings, domain, origin }) {
        return __entry_0_finalize(workgroups, bindings, domain, origin);
    };

    const bind = function (bindings) {
        const bound = Object.create(null);
        bound["finalize"] = function (workgroups, domain, origin) {
            return __entry_0_finalize(workgroups, bindings, domain, origin);
        };
        return bound;
    };

    return { entry, bind, bindings: ["U_uniforms","tile_partials","cons_out"], entryInfo };
}
