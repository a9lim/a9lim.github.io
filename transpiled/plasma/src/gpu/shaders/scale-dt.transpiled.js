// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/scale-dt.wgsl
// helpers-sha256: eefe8364e4418fe1122eaec2c334fc5ddb0dee0d50920de592e31eb98cc89805
// wgsl-transpile sha256: 726ff862b7b45f55ccfbfea55456ae56b5c3467fe2e6dae141a1df5c14d02649
// wgsl-transpiler-sha256: ac640ff2e57bd5c92b7bae5ed9f847914e51684c046fab990cf544842ad38716
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// wgsl-metrics: {"bytes":4726,"lines":117,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-27T17:41:05.237Z
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

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[1,1,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 1, Ly = 1, Lz = 1;
        const _b_dt_in = bindings.dt_in;
        const _b_dt_out = bindings.dt_out;
        const Gx = domain && domain[0] != null ? domain[0] : Wx * Lx;
        const Gy = domain && domain[1] != null ? domain[1] : Wy * Ly;
        const Gz = domain && domain[2] != null ? domain[2] : Wz * Lz;
        const Ox = origin && origin[0] != null ? origin[0] : 0;
        const Oy = origin && origin[1] != null ? origin[1] : 0;
        const Oz = origin && origin[2] != null ? origin[2] : 0;
        const Xn = Ox + Gx, Yn = Oy + Gy, Zn = Oz + Gz;
        if (Gy === 1 && Gz === 1) {
            for (let __gx = Ox; __gx < Xn; __gx++) {
                {
                    _b_dt_out[0] = (0.5 * _b_dt_in[0]);
                    _b_dt_out[1] = _b_dt_in[1];
                    _b_dt_out[2] = _b_dt_in[2];
                    _b_dt_out[3] = _b_dt_in[3];
                    _b_dt_out[4] = _b_dt_in[4];
                    _b_dt_out[5] = 0.0;
                    _b_dt_out[6] = 0.0;
                    _b_dt_out[7] = 0.0;
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        {
                            _b_dt_out[0] = (0.5 * _b_dt_in[0]);
                            _b_dt_out[1] = _b_dt_in[1];
                            _b_dt_out[2] = _b_dt_in[2];
                            _b_dt_out[3] = _b_dt_in[3];
                            _b_dt_out[4] = _b_dt_in[4];
                            _b_dt_out[5] = 0.0;
                            _b_dt_out[6] = 0.0;
                            _b_dt_out[7] = 0.0;
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    {
                        _b_dt_out[0] = (0.5 * _b_dt_in[0]);
                        _b_dt_out[1] = _b_dt_in[1];
                        _b_dt_out[2] = _b_dt_in[2];
                        _b_dt_out[3] = _b_dt_in[3];
                        _b_dt_out[4] = _b_dt_in[4];
                        _b_dt_out[5] = 0.0;
                        _b_dt_out[6] = 0.0;
                        _b_dt_out[7] = 0.0;
                    }
                }
            }
        } else {
            for (let __gz = Oz; __gz < Zn; __gz++)
            for (let __gy = Oy; __gy < Yn; __gy++)
            for (let __gx = Ox; __gx < Xn; __gx++) {
                {
                    _b_dt_out[0] = (0.5 * _b_dt_in[0]);
                    _b_dt_out[1] = _b_dt_in[1];
                    _b_dt_out[2] = _b_dt_in[2];
                    _b_dt_out[3] = _b_dt_in[3];
                    _b_dt_out[4] = _b_dt_in[4];
                    _b_dt_out[5] = 0.0;
                    _b_dt_out[6] = 0.0;
                    _b_dt_out[7] = 0.0;
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

    return { entry, bind, bindings: ["dt_in","dt_out"], entryInfo };
}
