// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/reconstruct-ppm.wgsl
// wgsl-variant: y
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 786987331727f73541fcaff0643dc2425f99f43f3e54f6372d81ddf9573dbe5e
// wgsl-transpiler-sha256: d470123cbc6f7ec463bb1b3d6f64125e4819e92c84ce8bb0c08470cb4cdd8758
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"sweep":{"sweep_dir":1}},"specializeFunctionParams":{"fast_mag_speed":{"axis":1},"mhd_flux":{"axis":1},"normal_velocity_mhd":{"axis":1},"permute_prim":{"axis":1},"pack_prim_pair_from_vec7":{"axis":1},"unpack_edge_prim":{"axis":1},"prim_to_axis_state":{"axis":1},"pack_flux":{"axis":1},"hll_flux_mhd":{"axis":1}}}
// wgsl-metrics: {"bytes":75841,"lines":1301,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":22,"workgroupReductionInits":0,"flatWorkgroupArrays":1,"flatWorkgroupSlots":1152,"staticBranchPrunes":4}
// generated: 2026-05-30T21:32:08.758Z
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

    function pressure_from_dual_energy(U0, U1, bx_c, by_c, gamma, p_floor) {
        const U0_x = U0.x;
        const U0_y = U0.y;
        const U0_z = U0.z;
        const U0_w = U0.w;
        const U1_x = U1.x;
        const U1_y = U1.y;
        const U1_z = U1.z;
        const U1_w = U1.w;
        const rho = ((U0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (U0_x));
        const vx = (U0_y / rho);
        const vy = (U0_z / rho);
        const vz = (U0_w / rho);
        const ke = ((0.5 * rho) * ((((vx * vx) + (vy * vy)) + (vz * vz))));
        const mb = (0.5 * ((((bx_c * bx_c) + (by_c * by_c)) + (U1_y * U1_y))));
        const eth_total = ((U1_x - ke) - mb);
        const eth_floor = (p_floor / (((gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((gamma - 1.0))));
        const total_ok = ((eth_total > ((eth_floor) < ((DUAL_ENERGY_FRACTION * ((Math.abs(U1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(U1_x))))) ? ((DUAL_ENERGY_FRACTION * ((Math.abs(U1_x)) < (eth_floor) ? (eth_floor) : (Math.abs(U1_x))))) : (eth_floor))) && (eth_total == eth_total));
        const dual_eth_in = ((U1_z == U1_z) ? U1_z : eth_floor);
        const dual_eth = ((dual_eth_in) < (eth_floor) ? (eth_floor) : (dual_eth_in));
        const eth = (total_ok ? eth_total : dual_eth);
        return (((((gamma - 1.0)) * eth)) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * eth)));
    }

    function cons_to_prim_mhd(U0, U1, bx_c, by_c, gamma, p_floor) {
        const U0_x = U0.x;
        const U0_y = U0.y;
        const U0_z = U0.z;
        const U0_w = U0.w;
        const U1_x = U1.x;
        const U1_y = U1.y;
        const U1_z = U1.z;
        const U1_w = U1.w;
        let P_rho = 0;
        let P_vx = 0;
        let P_vy = 0;
        let P_vz = 0;
        let P_p = 0;
        let P_bx = 0;
        let P_by = 0;
        let P_bz = 0;
        P_rho = ((U0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (U0_x));
        P_vx = (U0_y / P_rho);
        P_vy = (U0_z / P_rho);
        P_vz = (U0_w / P_rho);
        P_bx = bx_c;
        P_by = by_c;
        P_bz = U1_y;
        P_p = pressure_from_dual_energy({x:U0_x, y:U0_y, z:U0_z, w:U0_w}, {x:U1_x, y:U1_y, z:U1_z, w:U1_w}, bx_c, by_c, gamma, p_floor);
        return { rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz };
    }

    function cell_primitive_cache(ix, iy, n_total, gamma, p_floor) {
        let _inl_6_result;
        _inl_6: {
            _inl_6_result = ((iy * n_total) + ix);
            break _inl_6;
        }
        const idx = _inl_6_result;
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
        const bx = (0.5 * ((bindings.Bx_face[_inl_7_result] + bindings.Bx_face[_inl_8_result])));
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
        const by = (0.5 * ((bindings.By_face[_inl_9_result] + bindings.By_face[_inl_10_result])));
        return cons_to_prim_mhd(((_b) => ({x:bindings.U0_in[_b + 0], y:bindings.U0_in[_b + 1], z:bindings.U0_in[_b + 2], w:bindings.U0_in[_b + 3]}))(((idx) * 4 + 0)), ((_b) => ({x:bindings.U1_in[_b + 0], y:bindings.U1_in[_b + 1], z:bindings.U1_in[_b + 2], w:bindings.U1_in[_b + 3]}))(((idx) * 4 + 0)), bx, by, gamma, p_floor);
    }

    function permute_prim(P, axis) {
        let R_rho = 0;
        let R_vn = 0;
        let R_vt1 = 0;
        let R_vt2 = 0;
        let R_bt1 = 0;
        let R_bt2 = 0;
        let R_p = 0;
        let R_bn = 0;
        R_rho = P.rho;
        R_p = P.p;
        {
            R_vn = P.vy;
            R_vt1 = P.vz;
            R_vt2 = P.vx;
            R_bt1 = P.bz;
            R_bt2 = P.bx;
            R_bn = P.by;
        }
        return { rho: R_rho, vn: R_vn, vt1: R_vt1, vt2: R_vt2, bt1: R_bt1, bt2: R_bt2, p: R_p, bn: R_bn };
    }

    function vec7_of(P) {
        return { rho: P.rho, vn: P.vn, vt1: P.vt1, vt2: P.vt2, bt1: P.bt1, bt2: P.bt2, p: P.p };
    }

    function pack_prim_pair_from_vec7(w, bn, axis) {
        let R_p0_x = 0;
        let R_p0_y = 0;
        let R_p0_z = 0;
        let R_p0_w = 0;
        let R_p1_x = 0;
        let R_p1_y = 0;
        let R_p1_z = 0;
        let R_p1_w = 0;
        {
            {
                const _wt0 = w.rho;
                const _wt1 = w.vt2;
                const _wt2 = w.vn;
                const _wt3 = w.vt1;
                R_p0_x = _wt0;
                R_p0_y = _wt1;
                R_p0_z = _wt2;
                R_p0_w = _wt3;
            }
            {
                const _wt0 = w.p;
                const _wt1 = w.bt2;
                const _wt2 = w.bt1;
                const _wt3 = 0.0;
                R_p1_x = _wt0;
                R_p1_y = _wt1;
                R_p1_z = _wt2;
                R_p1_w = _wt3;
            }
        }
        return { p0: {x:R_p0_x, y:R_p0_y, z:R_p0_z, w:R_p0_w}, p1: {x:R_p1_x, y:R_p1_y, z:R_p1_z, w:R_p1_w} };
    }

    function mhd_eigensystem(w, bn, gamma) {
        let S_asq = 0;
        let S_a = 0;
        let S_cfsq = 0;
        let S_cf = 0;
        let S_cssq = 0;
        let S_cs = 0;
        let S_alpha_f = 0;
        let S_alpha_s = 0;
        let S_bet1 = 0;
        let S_bet2 = 0;
        let S_sgn_bn = 0;
        let S_sqrtd = 0;
        let S_isqrtd = 0;
        let S_inv_rho = 0;
        const rho = ((w.rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (w.rho));
        const p = ((w.p) < (1.0e-30) ? (1.0e-30) : (w.p));
        S_inv_rho = (1.0 / rho);
        S_sqrtd = Math.sqrt(rho);
        S_isqrtd = (1.0 / S_sqrtd);
        const btsq = ((w.bt1 * w.bt1) + (w.bt2 * w.bt2));
        const bxsq = (bn * bn);
        const gamp = (gamma * p);
        const tdif = ((bxsq + btsq) - gamp);
        const cf2_cs2 = Math.sqrt(((tdif * tdif) + ((4.0 * gamp) * btsq)));
        let cfsq_unscaled = (0.5 * ((((bxsq + btsq) + gamp) + cf2_cs2)));
        cfsq_unscaled = ((cfsq_unscaled) < (1.0e-30) ? (1.0e-30) : (cfsq_unscaled));
        let cssq_unscaled = ((gamp * bxsq) / cfsq_unscaled);
        cssq_unscaled = ((cssq_unscaled) < (0.0) ? (0.0) : (cssq_unscaled));
        S_cfsq = (cfsq_unscaled * S_inv_rho);
        S_cssq = (cssq_unscaled * S_inv_rho);
        S_cf = Math.sqrt(S_cfsq);
        S_cs = Math.sqrt(((S_cssq) < (0.0) ? (0.0) : (S_cssq)));
        S_asq = (gamp * S_inv_rho);
        S_a = Math.sqrt(((S_asq) < (0.0) ? (0.0) : (S_asq)));
        const bt = Math.sqrt(btsq);
        if ((bt > 0.0)) {
            S_bet1 = (w.bt1 / bt);
            S_bet2 = (w.bt2 / bt);
        } else {
            S_bet1 = 1.0;
            S_bet2 = 0.0;
        }
        if ((((S_cfsq - S_cssq)) <= 0.0)) {
            S_alpha_f = 1.0;
            S_alpha_s = 0.0;
        } else if ((((S_asq - S_cssq)) <= 0.0)) {
            S_alpha_f = 0.0;
            S_alpha_s = 1.0;
        } else if ((((S_cfsq - S_asq)) <= 0.0)) {
            S_alpha_f = 1.0;
            S_alpha_s = 0.0;
        } else {
            const denom = (S_cfsq - S_cssq);
            S_alpha_f = Math.sqrt((((((S_asq - S_cssq)) / denom)) < (0.0) ? (0.0) : ((((S_asq - S_cssq)) / denom))));
            S_alpha_s = Math.sqrt((((((S_cfsq - S_asq)) / denom)) < (0.0) ? (0.0) : ((((S_cfsq - S_asq)) / denom))));
        }
        S_sgn_bn = ((bn >= 0.0) ? 1.0 : (-1.0));
        return { asq: S_asq, a: S_a, cfsq: S_cfsq, cf: S_cf, cssq: S_cssq, cs: S_cs, alpha_f: S_alpha_f, alpha_s: S_alpha_s, bet1: S_bet1, bet2: S_bet2, sgn_bn: S_sgn_bn, sqrtd: S_sqrtd, isqrtd: S_isqrtd, inv_rho: S_inv_rho };
    }

    function project_to_char(dW, S) {
        const nf = (0.5 / ((S.asq) < (1.0e-30) ? (1.0e-30) : (S.asq)));
        const qf = (((nf * S.cf) * S.alpha_f) * S.sgn_bn);
        const qs = (((nf * S.cs) * S.alpha_s) * S.sgn_bn);
        const af_prime = ((0.5 * S.alpha_f) / ((S.a * S.sqrtd)));
        const as_prime = ((0.5 * S.alpha_s) / ((S.a * S.sqrtd)));
        const bt_term_v = ((S.bet1 * dW.vt1) + (S.bet2 * dW.vt2));
        const bt_term_b = ((S.bet1 * dW.bt1) + (S.bet2 * dW.bt2));
        let C_fL = 0;
        let C_aL = 0;
        let C_sL = 0;
        let C_e = 0;
        let C_sR = 0;
        let C_aR = 0;
        let C_fR = 0;
        C_fL = ((((nf * S.alpha_f) * (((dW.p * S.inv_rho) - (S.cf * dW.vn)))) + (qs * bt_term_v)) + (as_prime * bt_term_b));
        C_aL = (0.5 * (((S.bet1 * ((((dW.bt2 * S.sgn_bn) * S.isqrtd) + dW.vt2))) - (S.bet2 * ((((dW.bt1 * S.sgn_bn) * S.isqrtd) + dW.vt1))))));
        C_sL = ((((nf * S.alpha_s) * (((dW.p * S.inv_rho) - (S.cs * dW.vn)))) - (qf * bt_term_v)) - (af_prime * bt_term_b));
        C_e = (dW.rho - (dW.p / ((S.asq) < (1.0e-30) ? (1.0e-30) : (S.asq))));
        C_sR = ((((nf * S.alpha_s) * (((dW.p * S.inv_rho) + (S.cs * dW.vn)))) + (qf * bt_term_v)) - (af_prime * bt_term_b));
        C_aR = (0.5 * (((S.bet1 * ((((dW.bt2 * S.sgn_bn) * S.isqrtd) - dW.vt2))) - (S.bet2 * ((((dW.bt1 * S.sgn_bn) * S.isqrtd) - dW.vt1))))));
        C_fR = ((((nf * S.alpha_f) * (((dW.p * S.inv_rho) + (S.cf * dW.vn)))) - (qs * bt_term_v)) + (as_prime * bt_term_b));
        return { fL: C_fL, aL: C_aL, sL: C_sL, e: C_e, sR: C_sR, aR: C_aR, fR: C_fR };
    }

    function project_from_char(C, S) {
        const qf = ((S.cf * S.alpha_f) * S.sgn_bn);
        const qs = ((S.cs * S.alpha_s) * S.sgn_bn);
        const af = ((S.a * S.alpha_f) * S.sqrtd);
        const as_ = ((S.a * S.alpha_s) * S.sqrtd);
        const rho = (1.0 / ((S.inv_rho) < (1.0e-30) ? (1.0e-30) : (S.inv_rho)));
        const af_sum = (S.alpha_f * ((C.fL + C.fR)));
        const as_sum = (S.alpha_s * ((C.sL + C.sR)));
        const af_dif = (S.alpha_f * ((C.fR - C.fL)));
        const as_dif = (S.alpha_s * ((C.sR - C.sL)));
        const qs_fdif = (qs * ((C.fL - C.fR)));
        const qf_sdif = (qf * ((C.sR - C.sL)));
        const aL_sum = (C.aL + C.aR);
        const aL_dif = (C.aR - C.aL);
        let W_rho = 0;
        let W_vn = 0;
        let W_vt1 = 0;
        let W_vt2 = 0;
        let W_bt1 = 0;
        let W_bt2 = 0;
        let W_p = 0;
        W_rho = ((rho * ((af_sum + as_sum))) + C.e);
        W_vn = ((S.cf * af_dif) + (S.cs * as_dif));
        W_vt1 = ((S.bet1 * ((qs_fdif + qf_sdif))) + (S.bet2 * ((C.aR - C.aL))));
        W_vt2 = ((S.bet2 * ((qs_fdif + qf_sdif))) + (S.bet1 * ((C.aL - C.aR))));
        W_p = ((rho * S.asq) * ((af_sum + as_sum)));
        W_bt1 = ((S.bet1 * (((as_ * ((C.fL + C.fR))) - (af * ((C.sL + C.sR)))))) - (((S.bet2 * S.sgn_bn) * S.sqrtd) * aL_sum));
        W_bt2 = ((S.bet2 * (((as_ * ((C.fL + C.fR))) - (af * ((C.sL + C.sR)))))) + (((S.bet1 * S.sgn_bn) * S.sqrtd) * aL_sum));
        return { rho: W_rho, vn: W_vn, vt1: W_vt1, vt2: W_vt2, bt1: W_bt1, bt2: W_bt2, p: W_p };
    }

    function ppm_limit_delta(dL_in, dR_in) {
        let dL = dL_in;
        let dR = dR_in;
        if (((dL * dR) <= 0.0)) {
            return {x:0.0, y:0.0};
        }
        const dq = (dL + dR);
        const q6 = (3.0 * ((dL - dR)));
        const dq2 = (dq * dq);
        const test = (dq * q6);
        if ((test > dq2)) {
            dL = (2.0 * dR);
        } else if ((test < (-dq2))) {
            dR = (2.0 * dL);
        }
        return {x:dL, y:dR};
    }

    function ppm_limit_char(aL, aR) {
        const _sroa_0 = ppm_limit_delta(aL.fL, aR.fL);
        const r0_x = _sroa_0.x;
        const r0_y = _sroa_0.y;
        const _sroa_1 = ppm_limit_delta(aL.aL, aR.aL);
        const r1_x = _sroa_1.x;
        const r1_y = _sroa_1.y;
        const _sroa_2 = ppm_limit_delta(aL.sL, aR.sL);
        const r2_x = _sroa_2.x;
        const r2_y = _sroa_2.y;
        const _sroa_3 = ppm_limit_delta(aL.e, aR.e);
        const r3_x = _sroa_3.x;
        const r3_y = _sroa_3.y;
        const _sroa_4 = ppm_limit_delta(aL.sR, aR.sR);
        const r4_x = _sroa_4.x;
        const r4_y = _sroa_4.y;
        const _sroa_5 = ppm_limit_delta(aL.aR, aR.aR);
        const r5_x = _sroa_5.x;
        const r5_y = _sroa_5.y;
        const _sroa_6 = ppm_limit_delta(aL.fR, aR.fR);
        const r6_x = _sroa_6.x;
        const r6_y = _sroa_6.y;
        let out_L_fL = 0;
        let out_L_aL = 0;
        let out_L_sL = 0;
        let out_L_e = 0;
        let out_L_sR = 0;
        let out_L_aR = 0;
        let out_L_fR = 0;
        let out_R_fL = 0;
        let out_R_aL = 0;
        let out_R_sL = 0;
        let out_R_e = 0;
        let out_R_sR = 0;
        let out_R_aR = 0;
        let out_R_fR = 0;
        out_L_fL = r0_x;
        out_L_aL = r1_x;
        out_L_sL = r2_x;
        out_L_e = r3_x;
        out_L_sR = r4_x;
        out_L_aR = r5_x;
        out_L_fR = r6_x;
        out_R_fL = r0_y;
        out_R_aL = r1_y;
        out_R_sL = r2_y;
        out_R_e = r3_y;
        out_R_sR = r4_y;
        out_R_aR = r5_y;
        out_R_fR = r6_y;
        return { L: { fL: out_L_fL, aL: out_L_aL, sL: out_L_sL, e: out_L_e, sR: out_L_sR, aR: out_L_aR, fR: out_L_fR }, R: { fL: out_R_fL, aL: out_R_aL, sL: out_R_sL, e: out_R_e, sR: out_R_sR, aR: out_R_aR, fR: out_R_fR } };
    }

    function ppm4_limit_component(w_L_raw, w_R_raw, w_L_char, w_R_char, w_m2, w_m1, w_c, w_p1, w_p2) {
        const d2c = ((w_m1 - (2.0 * w_c)) + w_p1);
        const d2L = ((w_m2 - (2.0 * w_m1)) + w_c);
        const d2R = ((w_c - (2.0 * w_p1)) + w_p2);
        const d2f = (6.0 * (((w_L_raw - (2.0 * w_c)) + w_R_raw)));
        const cell_bracket = (((w_p1 - w_c)) * ((w_c - w_m1)));
        const face_bracket = (((w_R_raw - w_c)) * ((w_c - w_L_raw)));
        const is_extremum = (((cell_bracket <= 0.0)) || ((face_bracket <= 0.0)));
        const L_clamp = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(w_L_char, ((w_m1) < (w_c) ? (w_m1) : (w_c)), ((w_c) < (w_m1) ? (w_m1) : (w_c))));
        const R_clamp = (((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(w_R_char, ((w_p1) < (w_c) ? (w_p1) : (w_c)), ((w_c) < (w_p1) ? (w_p1) : (w_c))));
        const _sroa_7 = ppm_limit_delta((w_c - L_clamp), (R_clamp - w_c));
        const r_cw_x = _sroa_7.x;
        const r_cw_y = _sroa_7.y;
        const L_cw = (w_c - r_cw_x);
        const R_cw = (w_c + r_cw_y);
        if ((!is_extremum)) {
            return {x:L_cw, y:R_cw};
        }
        const s_c = Math.sign(d2c);
        const s_L = Math.sign(d2L);
        const s_R = Math.sign(d2R);
        const s_f = Math.sign(d2f);
        const signs_agree = (((((s_c == s_f)) && ((s_L == s_f))) && ((s_R == s_f))) && ((s_f != 0.0)));
        const C = 1.25;
        let d2_lim = 0.0;
        if (signs_agree) {
            const bound = (((C * ((((Math.abs(d2R)) < (Math.abs(d2L)) ? (Math.abs(d2R)) : (Math.abs(d2L)))) < (Math.abs(d2c)) ? (((Math.abs(d2R)) < (Math.abs(d2L)) ? (Math.abs(d2R)) : (Math.abs(d2L)))) : (Math.abs(d2c))))) < (Math.abs(d2f)) ? ((C * ((((Math.abs(d2R)) < (Math.abs(d2L)) ? (Math.abs(d2R)) : (Math.abs(d2L)))) < (Math.abs(d2c)) ? (((Math.abs(d2R)) < (Math.abs(d2L)) ? (Math.abs(d2R)) : (Math.abs(d2L)))) : (Math.abs(d2c))))) : (Math.abs(d2f)));
            d2_lim = (s_f * bound);
        }
        if ((Math.abs(d2f) <= 1.0e-30)) {
            return {x:L_cw, y:R_cw};
        }
        const scale = (d2_lim / d2f);
        const L_ppm4 = (w_c + (((w_L_raw - w_c)) * scale));
        const R_ppm4 = (w_c + (((w_R_raw - w_c)) * scale));
        return {x:L_ppm4, y:R_ppm4};
    }

    function primitive_safety_net_ppm4(w_left_raw, w_right_raw, w_left_char, w_right_char, w_c, w_m2, w_m1, w_p1, w_p2) {
        const _sroa_8 = ppm4_limit_component(w_left_raw.rho, w_right_raw.rho, w_left_char.rho, w_right_char.rho, w_m2.rho, w_m1.rho, w_c.rho, w_p1.rho, w_p2.rho);
        const r_rho_x = _sroa_8.x;
        const r_rho_y = _sroa_8.y;
        const _sroa_9 = ppm4_limit_component(w_left_raw.vn, w_right_raw.vn, w_left_char.vn, w_right_char.vn, w_m2.vn, w_m1.vn, w_c.vn, w_p1.vn, w_p2.vn);
        const r_vn_x = _sroa_9.x;
        const r_vn_y = _sroa_9.y;
        const _sroa_10 = ppm4_limit_component(w_left_raw.vt1, w_right_raw.vt1, w_left_char.vt1, w_right_char.vt1, w_m2.vt1, w_m1.vt1, w_c.vt1, w_p1.vt1, w_p2.vt1);
        const r_vt1_x = _sroa_10.x;
        const r_vt1_y = _sroa_10.y;
        const _sroa_11 = ppm4_limit_component(w_left_raw.vt2, w_right_raw.vt2, w_left_char.vt2, w_right_char.vt2, w_m2.vt2, w_m1.vt2, w_c.vt2, w_p1.vt2, w_p2.vt2);
        const r_vt2_x = _sroa_11.x;
        const r_vt2_y = _sroa_11.y;
        const _sroa_12 = ppm4_limit_component(w_left_raw.bt1, w_right_raw.bt1, w_left_char.bt1, w_right_char.bt1, w_m2.bt1, w_m1.bt1, w_c.bt1, w_p1.bt1, w_p2.bt1);
        const r_bt1_x = _sroa_12.x;
        const r_bt1_y = _sroa_12.y;
        const _sroa_13 = ppm4_limit_component(w_left_raw.bt2, w_right_raw.bt2, w_left_char.bt2, w_right_char.bt2, w_m2.bt2, w_m1.bt2, w_c.bt2, w_p1.bt2, w_p2.bt2);
        const r_bt2_x = _sroa_13.x;
        const r_bt2_y = _sroa_13.y;
        const _sroa_14 = ppm4_limit_component(w_left_raw.p, w_right_raw.p, w_left_char.p, w_right_char.p, w_m2.p, w_m1.p, w_c.p, w_p1.p, w_p2.p);
        const r_p_x = _sroa_14.x;
        const r_p_y = _sroa_14.y;
        let out_L_rho = 0;
        let out_L_vn = 0;
        let out_L_vt1 = 0;
        let out_L_vt2 = 0;
        let out_L_bt1 = 0;
        let out_L_bt2 = 0;
        let out_L_p = 0;
        let out_R_rho = 0;
        let out_R_vn = 0;
        let out_R_vt1 = 0;
        let out_R_vt2 = 0;
        let out_R_bt1 = 0;
        let out_R_bt2 = 0;
        let out_R_p = 0;
        out_L_rho = r_rho_x;
        out_L_vn = r_vn_x;
        out_L_vt1 = r_vt1_x;
        out_L_vt2 = r_vt2_x;
        out_L_bt1 = r_bt1_x;
        out_L_bt2 = r_bt2_x;
        out_L_p = r_p_x;
        out_R_rho = r_rho_y;
        out_R_vn = r_vn_y;
        out_R_vt1 = r_vt1_y;
        out_R_vt2 = r_vt2_y;
        out_R_bt1 = r_bt1_y;
        out_R_bt2 = r_bt2_y;
        out_R_p = r_p_y;
        return { L: { rho: out_L_rho, vn: out_L_vn, vt1: out_L_vt1, vt2: out_L_vt2, bt1: out_L_bt1, bt2: out_L_bt2, p: out_L_p }, R: { rho: out_R_rho, vn: out_R_vn, vt1: out_R_vt1, vt2: out_R_vt2, bt1: out_R_bt1, bt2: out_R_bt2, p: out_R_p } };
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":2,"globalLoop":false,"workgroupMemory":true,"flatWorkgroupArrays":1,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_edge_l_0 = bindings.edge_l_0;
        const _b_edge_l_1 = bindings.edge_l_1;
        const _b_edge_r_0 = bindings.edge_r_0;
        const _b_edge_r_1 = bindings.edge_r_1;
        const _b_sweep = bindings.sweep;
        const wg = Object.create(null);
        wg.tile = new Float32Array(1152);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile.fill(0);
            // Phase 0
            {
                const lz = 0;
                for (let ly = 0; ly < Ly; ly++) {
                    for (let lx = 0; lx < Lx; lx++) {
                        const gid_x = wgx*Lx + lx;
                        const gid_y = wgy*Ly + ly;
                        const lid_x = lx;
                        const lid_y = ly;
                        {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const extent = (n_interior + 2);
                            const in_extent = (((gid_x < extent)) && ((gid_y < extent)));
                            const axis = 1;
                            const g = _u_U_uniforms_gamma;
                            const pf = _u_U_uniforms_pressure_floor;
                            const nt_max = (((n_total) | 0) - 1);
                            const gx = ((((gid_x) | 0) + ((ghost) | 0)) - 1);
                            const gy = ((((gid_y) | 0) + ((ghost) | 0)) - 1);
                            const lx = ((lid_x) | 0);
                            const ly = ((lid_y) | 0);
                            const cx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gx, 0, nt_max))) >>> 0);
                            const cy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gy, 0, nt_max))) >>> 0);
                            {
                                const _wbase = ((((ly + 2)) * 96) + (((lx + 2)) * 8));
                                const _stmp = cell_primitive_cache(cx, cy, n_total, g, pf);
                                wg.tile[_wbase + 0] = _stmp.rho;
                                wg.tile[_wbase + 1] = _stmp.vx;
                                wg.tile[_wbase + 2] = _stmp.vy;
                                wg.tile[_wbase + 3] = _stmp.vz;
                                wg.tile[_wbase + 4] = _stmp.p;
                                wg.tile[_wbase + 5] = _stmp.bx;
                                wg.tile[_wbase + 6] = _stmp.by;
                                wg.tile[_wbase + 7] = _stmp.bz;
                            }
                            if ((lid_x < 2)) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx - 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gy, 0, nt_max))) >>> 0);
                                {
                                    const _wbase = ((((ly + 2)) * 96) + ((lx) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if ((lid_x >= 6)) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx + 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gy, 0, nt_max))) >>> 0);
                                {
                                    const _wbase = ((((ly + 2)) * 96) + (((lx + 4)) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if ((lid_y < 2)) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gx, 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy - 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = (((ly) * 96) + (((lx + 2)) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if ((lid_y >= 6)) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gx, 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy + 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = ((((ly + 4)) * 96) + (((lx + 2)) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if (((lid_x < 2) && (lid_y < 2))) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx - 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy - 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = (((ly) * 96) + ((lx) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if (((lid_x >= 6) && (lid_y < 2))) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx + 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy - 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = (((ly) * 96) + (((lx + 4)) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if (((lid_x < 2) && (lid_y >= 6))) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx - 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy + 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = ((((ly + 4)) * 96) + ((lx) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
                            if (((lid_x >= 6) && (lid_y >= 6))) {
                                const sx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gx + 2), 0, nt_max))) >>> 0);
                                const sy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })((gy + 2), 0, nt_max))) >>> 0);
                                {
                                    const _wbase = ((((ly + 4)) * 96) + (((lx + 4)) * 8));
                                    const _stmp = cell_primitive_cache(sx, sy, n_total, g, pf);
                                    wg.tile[_wbase + 0] = _stmp.rho;
                                    wg.tile[_wbase + 1] = _stmp.vx;
                                    wg.tile[_wbase + 2] = _stmp.vy;
                                    wg.tile[_wbase + 3] = _stmp.vz;
                                    wg.tile[_wbase + 4] = _stmp.p;
                                    wg.tile[_wbase + 5] = _stmp.bx;
                                    wg.tile[_wbase + 6] = _stmp.by;
                                    wg.tile[_wbase + 7] = _stmp.bz;
                                }
                            }
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
                        const lid_x = lx;
                        const lid_y = ly;
                        __invocation: {
                            const n_interior = _u_U_uniforms_grid_n;
                            const n_total = _u_U_uniforms_grid_n_total;
                            const ghost = _u_U_uniforms_ghost_w;
                            const extent = (n_interior + 2);
                            const in_extent = (((gid_x < extent)) && ((gid_y < extent)));
                            const axis = 1;
                            const g = _u_U_uniforms_gamma;
                            const pf = _u_U_uniforms_pressure_floor;
                            const nt_max = (((n_total) | 0) - 1);
                            const gx = ((((gid_x) | 0) + ((ghost) | 0)) - 1);
                            const gy = ((((gid_y) | 0) + ((ghost) | 0)) - 1);
                            const lx = ((lid_x) | 0);
                            const ly = ((lid_y) | 0);
                            const cx = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gx, 0, nt_max))) >>> 0);
                            const cy = (((((_x, _lo, _hi) => { const _mx = _x < _lo ? _lo : _x; return _hi < _mx ? _hi : _mx; })(gy, 0, nt_max))) >>> 0);
                            if ((!in_extent)) {
                                break __invocation;
                            }
                            const ix = ((gx) >>> 0);
                            const iy = ((gy) >>> 0);
                            let _inl_11_result;
                            _inl_11: {
                                _inl_11_result = ((iy * n_total) + ix);
                                break _inl_11;
                            }
                            const idx = _inl_11_result;
                            let stencil_ok = true;
                            {
                                stencil_ok = (((iy >= 2)) && (((iy + 2) < n_total)));
                            }
                            const _sroa_15_base = ((((ly + 2)) * 96) + (((lx + 2)) * 8));
                            const tc_rho = wg.tile[_sroa_15_base + 0];
                            const tc_vx = wg.tile[_sroa_15_base + 1];
                            const tc_vy = wg.tile[_sroa_15_base + 2];
                            const tc_vz = wg.tile[_sroa_15_base + 3];
                            const tc_p = wg.tile[_sroa_15_base + 4];
                            const tc_bx = wg.tile[_sroa_15_base + 5];
                            const tc_by = wg.tile[_sroa_15_base + 6];
                            const tc_bz = wg.tile[_sroa_15_base + 7];
                            if ((!stencil_ok)) {
                                const _sroa_16 = permute_prim({ rho: tc_rho, vx: tc_vx, vy: tc_vy, vz: tc_vz, p: tc_p, bx: tc_bx, by: tc_by, bz: tc_bz }, axis);
                                const pcL_rho = _sroa_16.rho;
                                const pcL_vn = _sroa_16.vn;
                                const pcL_vt1 = _sroa_16.vt1;
                                const pcL_vt2 = _sroa_16.vt2;
                                const pcL_bt1 = _sroa_16.bt1;
                                const pcL_bt2 = _sroa_16.bt2;
                                const pcL_p = _sroa_16.p;
                                const pcL_bn = _sroa_16.bn;
                                const _sroa_17 = pack_prim_pair_from_vec7(vec7_of({ rho: pcL_rho, vn: pcL_vn, vt1: pcL_vt1, vt2: pcL_vt2, bt1: pcL_bt1, bt2: pcL_bt2, p: pcL_p, bn: pcL_bn }), pcL_bn, axis);
                                const pp_p0_x = _sroa_17.p0.x;
                                const pp_p0_y = _sroa_17.p0.y;
                                const pp_p0_z = _sroa_17.p0.z;
                                const pp_p0_w = _sroa_17.p0.w;
                                const pp_p1_x = _sroa_17.p1.x;
                                const pp_p1_y = _sroa_17.p1.y;
                                const pp_p1_z = _sroa_17.p1.z;
                                const pp_p1_w = _sroa_17.p1.w;
                                const _sroa_18 = {x:pp_p0_x, y:pp_p0_y, z:pp_p0_z, w:pp_p0_w};
                                let l0_x = _sroa_18.x;
                                let l0_y = _sroa_18.y;
                                let l0_z = _sroa_18.z;
                                let l0_w = _sroa_18.w;
                                const _sroa_19 = {x:pp_p0_x, y:pp_p0_y, z:pp_p0_z, w:pp_p0_w};
                                let r0_x = _sroa_19.x;
                                let r0_y = _sroa_19.y;
                                let r0_z = _sroa_19.z;
                                let r0_w = _sroa_19.w;
                                const _sroa_20 = {x:pp_p1_x, y:pp_p1_y, z:pp_p1_z, w:pp_p1_w};
                                let l1_x = _sroa_20.x;
                                let l1_y = _sroa_20.y;
                                let l1_z = _sroa_20.z;
                                let l1_w = _sroa_20.w;
                                const _sroa_21 = {x:pp_p1_x, y:pp_p1_y, z:pp_p1_z, w:pp_p1_w};
                                let r1_x = _sroa_21.x;
                                let r1_y = _sroa_21.y;
                                let r1_z = _sroa_21.z;
                                let r1_w = _sroa_21.w;
                                l0_x = ((l0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (l0_x));
                                r0_x = ((r0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (r0_x));
                                l1_x = ((l1_x) < (pf) ? (pf) : (l1_x));
                                r1_x = ((r1_x) < (pf) ? (pf) : (r1_x));
                                {
                                    const _wbase = ((idx) * 4 + 0);
                                    const _wt0 = l0_x;
                                    const _wt1 = l0_y;
                                    const _wt2 = l0_z;
                                    const _wt3 = l0_w;
                                    _b_edge_l_0[_wbase + 0] = _wt0;
                                    _b_edge_l_0[_wbase + 1] = _wt1;
                                    _b_edge_l_0[_wbase + 2] = _wt2;
                                    _b_edge_l_0[_wbase + 3] = _wt3;
                                }
                                {
                                    const _wbase = ((idx) * 4 + 0);
                                    const _wt0 = l1_x;
                                    const _wt1 = l1_y;
                                    const _wt2 = l1_z;
                                    const _wt3 = l1_w;
                                    _b_edge_l_1[_wbase + 0] = _wt0;
                                    _b_edge_l_1[_wbase + 1] = _wt1;
                                    _b_edge_l_1[_wbase + 2] = _wt2;
                                    _b_edge_l_1[_wbase + 3] = _wt3;
                                }
                                {
                                    const _wbase = ((idx) * 4 + 0);
                                    const _wt0 = r0_x;
                                    const _wt1 = r0_y;
                                    const _wt2 = r0_z;
                                    const _wt3 = r0_w;
                                    _b_edge_r_0[_wbase + 0] = _wt0;
                                    _b_edge_r_0[_wbase + 1] = _wt1;
                                    _b_edge_r_0[_wbase + 2] = _wt2;
                                    _b_edge_r_0[_wbase + 3] = _wt3;
                                }
                                {
                                    const _wbase = ((idx) * 4 + 0);
                                    const _wt0 = r1_x;
                                    const _wt1 = r1_y;
                                    const _wt2 = r1_z;
                                    const _wt3 = r1_w;
                                    _b_edge_r_1[_wbase + 0] = _wt0;
                                    _b_edge_r_1[_wbase + 1] = _wt1;
                                    _b_edge_r_1[_wbase + 2] = _wt2;
                                    _b_edge_r_1[_wbase + 3] = _wt3;
                                }
                                break __invocation;
                            }
                            let tm2_rho = 0;
                            let tm2_vx = 0;
                            let tm2_vy = 0;
                            let tm2_vz = 0;
                            let tm2_p = 0;
                            let tm2_bx = 0;
                            let tm2_by = 0;
                            let tm2_bz = 0;
                            let tm1_rho = 0;
                            let tm1_vx = 0;
                            let tm1_vy = 0;
                            let tm1_vz = 0;
                            let tm1_p = 0;
                            let tm1_bx = 0;
                            let tm1_by = 0;
                            let tm1_bz = 0;
                            let tp1_rho = 0;
                            let tp1_vx = 0;
                            let tp1_vy = 0;
                            let tp1_vz = 0;
                            let tp1_p = 0;
                            let tp1_bx = 0;
                            let tp1_by = 0;
                            let tp1_bz = 0;
                            let tp2_rho = 0;
                            let tp2_vx = 0;
                            let tp2_vy = 0;
                            let tp2_vz = 0;
                            let tp2_p = 0;
                            let tp2_bx = 0;
                            let tp2_by = 0;
                            let tp2_bz = 0;
                            {
                                const _sroa_22_base = (((ly) * 96) + (((lx + 2)) * 8));
                                tm2_rho = wg.tile[_sroa_22_base + 0];
                                tm2_vx = wg.tile[_sroa_22_base + 1];
                                tm2_vy = wg.tile[_sroa_22_base + 2];
                                tm2_vz = wg.tile[_sroa_22_base + 3];
                                tm2_p = wg.tile[_sroa_22_base + 4];
                                tm2_bx = wg.tile[_sroa_22_base + 5];
                                tm2_by = wg.tile[_sroa_22_base + 6];
                                tm2_bz = wg.tile[_sroa_22_base + 7];
                                const _sroa_23_base = ((((ly + 1)) * 96) + (((lx + 2)) * 8));
                                tm1_rho = wg.tile[_sroa_23_base + 0];
                                tm1_vx = wg.tile[_sroa_23_base + 1];
                                tm1_vy = wg.tile[_sroa_23_base + 2];
                                tm1_vz = wg.tile[_sroa_23_base + 3];
                                tm1_p = wg.tile[_sroa_23_base + 4];
                                tm1_bx = wg.tile[_sroa_23_base + 5];
                                tm1_by = wg.tile[_sroa_23_base + 6];
                                tm1_bz = wg.tile[_sroa_23_base + 7];
                                const _sroa_24_base = ((((ly + 3)) * 96) + (((lx + 2)) * 8));
                                tp1_rho = wg.tile[_sroa_24_base + 0];
                                tp1_vx = wg.tile[_sroa_24_base + 1];
                                tp1_vy = wg.tile[_sroa_24_base + 2];
                                tp1_vz = wg.tile[_sroa_24_base + 3];
                                tp1_p = wg.tile[_sroa_24_base + 4];
                                tp1_bx = wg.tile[_sroa_24_base + 5];
                                tp1_by = wg.tile[_sroa_24_base + 6];
                                tp1_bz = wg.tile[_sroa_24_base + 7];
                                const _sroa_25_base = ((((ly + 4)) * 96) + (((lx + 2)) * 8));
                                tp2_rho = wg.tile[_sroa_25_base + 0];
                                tp2_vx = wg.tile[_sroa_25_base + 1];
                                tp2_vy = wg.tile[_sroa_25_base + 2];
                                tp2_vz = wg.tile[_sroa_25_base + 3];
                                tp2_p = wg.tile[_sroa_25_base + 4];
                                tp2_bx = wg.tile[_sroa_25_base + 5];
                                tp2_by = wg.tile[_sroa_25_base + 6];
                                tp2_bz = wg.tile[_sroa_25_base + 7];
                            }
                            const _sroa_26 = permute_prim({ rho: tc_rho, vx: tc_vx, vy: tc_vy, vz: tc_vz, p: tc_p, bx: tc_bx, by: tc_by, bz: tc_bz }, axis);
                            const perm_c_rho = _sroa_26.rho;
                            const perm_c_vn = _sroa_26.vn;
                            const perm_c_vt1 = _sroa_26.vt1;
                            const perm_c_vt2 = _sroa_26.vt2;
                            const perm_c_bt1 = _sroa_26.bt1;
                            const perm_c_bt2 = _sroa_26.bt2;
                            const perm_c_p = _sroa_26.p;
                            const perm_c_bn = _sroa_26.bn;
                            const _sroa_27 = permute_prim({ rho: tm2_rho, vx: tm2_vx, vy: tm2_vy, vz: tm2_vz, p: tm2_p, bx: tm2_bx, by: tm2_by, bz: tm2_bz }, axis);
                            const perm_m2_rho = _sroa_27.rho;
                            const perm_m2_vn = _sroa_27.vn;
                            const perm_m2_vt1 = _sroa_27.vt1;
                            const perm_m2_vt2 = _sroa_27.vt2;
                            const perm_m2_bt1 = _sroa_27.bt1;
                            const perm_m2_bt2 = _sroa_27.bt2;
                            const perm_m2_p = _sroa_27.p;
                            const perm_m2_bn = _sroa_27.bn;
                            const _sroa_28 = permute_prim({ rho: tm1_rho, vx: tm1_vx, vy: tm1_vy, vz: tm1_vz, p: tm1_p, bx: tm1_bx, by: tm1_by, bz: tm1_bz }, axis);
                            const perm_m1_rho = _sroa_28.rho;
                            const perm_m1_vn = _sroa_28.vn;
                            const perm_m1_vt1 = _sroa_28.vt1;
                            const perm_m1_vt2 = _sroa_28.vt2;
                            const perm_m1_bt1 = _sroa_28.bt1;
                            const perm_m1_bt2 = _sroa_28.bt2;
                            const perm_m1_p = _sroa_28.p;
                            const perm_m1_bn = _sroa_28.bn;
                            const _sroa_29 = permute_prim({ rho: tp1_rho, vx: tp1_vx, vy: tp1_vy, vz: tp1_vz, p: tp1_p, bx: tp1_bx, by: tp1_by, bz: tp1_bz }, axis);
                            const perm_p1_rho = _sroa_29.rho;
                            const perm_p1_vn = _sroa_29.vn;
                            const perm_p1_vt1 = _sroa_29.vt1;
                            const perm_p1_vt2 = _sroa_29.vt2;
                            const perm_p1_bt1 = _sroa_29.bt1;
                            const perm_p1_bt2 = _sroa_29.bt2;
                            const perm_p1_p = _sroa_29.p;
                            const perm_p1_bn = _sroa_29.bn;
                            const _sroa_30 = permute_prim({ rho: tp2_rho, vx: tp2_vx, vy: tp2_vy, vz: tp2_vz, p: tp2_p, bx: tp2_bx, by: tp2_by, bz: tp2_bz }, axis);
                            const perm_p2_rho = _sroa_30.rho;
                            const perm_p2_vn = _sroa_30.vn;
                            const perm_p2_vt1 = _sroa_30.vt1;
                            const perm_p2_vt2 = _sroa_30.vt2;
                            const perm_p2_bt1 = _sroa_30.bt1;
                            const perm_p2_bt2 = _sroa_30.bt2;
                            const perm_p2_p = _sroa_30.p;
                            const perm_p2_bn = _sroa_30.bn;
                            const _sroa_31 = vec7_of({ rho: perm_c_rho, vn: perm_c_vn, vt1: perm_c_vt1, vt2: perm_c_vt2, bt1: perm_c_bt1, bt2: perm_c_bt2, p: perm_c_p, bn: perm_c_bn });
                            const w_c_rho = _sroa_31.rho;
                            const w_c_vn = _sroa_31.vn;
                            const w_c_vt1 = _sroa_31.vt1;
                            const w_c_vt2 = _sroa_31.vt2;
                            const w_c_bt1 = _sroa_31.bt1;
                            const w_c_bt2 = _sroa_31.bt2;
                            const w_c_p = _sroa_31.p;
                            const _sroa_32 = vec7_of({ rho: perm_m2_rho, vn: perm_m2_vn, vt1: perm_m2_vt1, vt2: perm_m2_vt2, bt1: perm_m2_bt1, bt2: perm_m2_bt2, p: perm_m2_p, bn: perm_m2_bn });
                            const w_m2_rho = _sroa_32.rho;
                            const w_m2_vn = _sroa_32.vn;
                            const w_m2_vt1 = _sroa_32.vt1;
                            const w_m2_vt2 = _sroa_32.vt2;
                            const w_m2_bt1 = _sroa_32.bt1;
                            const w_m2_bt2 = _sroa_32.bt2;
                            const w_m2_p = _sroa_32.p;
                            const _sroa_33 = vec7_of({ rho: perm_m1_rho, vn: perm_m1_vn, vt1: perm_m1_vt1, vt2: perm_m1_vt2, bt1: perm_m1_bt1, bt2: perm_m1_bt2, p: perm_m1_p, bn: perm_m1_bn });
                            const w_m1_rho = _sroa_33.rho;
                            const w_m1_vn = _sroa_33.vn;
                            const w_m1_vt1 = _sroa_33.vt1;
                            const w_m1_vt2 = _sroa_33.vt2;
                            const w_m1_bt1 = _sroa_33.bt1;
                            const w_m1_bt2 = _sroa_33.bt2;
                            const w_m1_p = _sroa_33.p;
                            const _sroa_34 = vec7_of({ rho: perm_p1_rho, vn: perm_p1_vn, vt1: perm_p1_vt1, vt2: perm_p1_vt2, bt1: perm_p1_bt1, bt2: perm_p1_bt2, p: perm_p1_p, bn: perm_p1_bn });
                            const w_p1_rho = _sroa_34.rho;
                            const w_p1_vn = _sroa_34.vn;
                            const w_p1_vt1 = _sroa_34.vt1;
                            const w_p1_vt2 = _sroa_34.vt2;
                            const w_p1_bt1 = _sroa_34.bt1;
                            const w_p1_bt2 = _sroa_34.bt2;
                            const w_p1_p = _sroa_34.p;
                            const _sroa_35 = vec7_of({ rho: perm_p2_rho, vn: perm_p2_vn, vt1: perm_p2_vt1, vt2: perm_p2_vt2, bt1: perm_p2_bt1, bt2: perm_p2_bt2, p: perm_p2_p, bn: perm_p2_bn });
                            const w_p2_rho = _sroa_35.rho;
                            const w_p2_vn = _sroa_35.vn;
                            const w_p2_vt1 = _sroa_35.vt1;
                            const w_p2_vt2 = _sroa_35.vt2;
                            const w_p2_bt1 = _sroa_35.bt1;
                            const w_p2_bt2 = _sroa_35.bt2;
                            const w_p2_p = _sroa_35.p;
                            const bn_c = perm_c_bn;
                            const c7 = 0.5833333333333334;
                            const c1 = 0.08333333333333333;
                            let _inl_12_result_rho;
                            let _inl_12_result_vn;
                            let _inl_12_result_vt1;
                            let _inl_12_result_vt2;
                            let _inl_12_result_bt1;
                            let _inl_12_result_bt2;
                            let _inl_12_result_p;
                            _inl_12: {
                                _inl_12_result_rho = ((c7 * ((w_m1_rho + w_c_rho))) - (c1 * ((w_m2_rho + w_p1_rho))));
                                _inl_12_result_vn = ((c7 * ((w_m1_vn + w_c_vn))) - (c1 * ((w_m2_vn + w_p1_vn))));
                                _inl_12_result_vt1 = ((c7 * ((w_m1_vt1 + w_c_vt1))) - (c1 * ((w_m2_vt1 + w_p1_vt1))));
                                _inl_12_result_vt2 = ((c7 * ((w_m1_vt2 + w_c_vt2))) - (c1 * ((w_m2_vt2 + w_p1_vt2))));
                                _inl_12_result_bt1 = ((c7 * ((w_m1_bt1 + w_c_bt1))) - (c1 * ((w_m2_bt1 + w_p1_bt1))));
                                _inl_12_result_bt2 = ((c7 * ((w_m1_bt2 + w_c_bt2))) - (c1 * ((w_m2_bt2 + w_p1_bt2))));
                                _inl_12_result_p = ((c7 * ((w_m1_p + w_c_p))) - (c1 * ((w_m2_p + w_p1_p))));
                                break _inl_12;
                            }
                            const qL_raw_rho = _inl_12_result_rho;
                            const qL_raw_vn = _inl_12_result_vn;
                            const qL_raw_vt1 = _inl_12_result_vt1;
                            const qL_raw_vt2 = _inl_12_result_vt2;
                            const qL_raw_bt1 = _inl_12_result_bt1;
                            const qL_raw_bt2 = _inl_12_result_bt2;
                            const qL_raw_p = _inl_12_result_p;
                            let _inl_13_result_rho;
                            let _inl_13_result_vn;
                            let _inl_13_result_vt1;
                            let _inl_13_result_vt2;
                            let _inl_13_result_bt1;
                            let _inl_13_result_bt2;
                            let _inl_13_result_p;
                            _inl_13: {
                                _inl_13_result_rho = ((c7 * ((w_c_rho + w_p1_rho))) - (c1 * ((w_m1_rho + w_p2_rho))));
                                _inl_13_result_vn = ((c7 * ((w_c_vn + w_p1_vn))) - (c1 * ((w_m1_vn + w_p2_vn))));
                                _inl_13_result_vt1 = ((c7 * ((w_c_vt1 + w_p1_vt1))) - (c1 * ((w_m1_vt1 + w_p2_vt1))));
                                _inl_13_result_vt2 = ((c7 * ((w_c_vt2 + w_p1_vt2))) - (c1 * ((w_m1_vt2 + w_p2_vt2))));
                                _inl_13_result_bt1 = ((c7 * ((w_c_bt1 + w_p1_bt1))) - (c1 * ((w_m1_bt1 + w_p2_bt1))));
                                _inl_13_result_bt2 = ((c7 * ((w_c_bt2 + w_p1_bt2))) - (c1 * ((w_m1_bt2 + w_p2_bt2))));
                                _inl_13_result_p = ((c7 * ((w_c_p + w_p1_p))) - (c1 * ((w_m1_p + w_p2_p))));
                                break _inl_13;
                            }
                            const qR_raw_rho = _inl_13_result_rho;
                            const qR_raw_vn = _inl_13_result_vn;
                            const qR_raw_vt1 = _inl_13_result_vt1;
                            const qR_raw_vt2 = _inl_13_result_vt2;
                            const qR_raw_bt1 = _inl_13_result_bt1;
                            const qR_raw_bt2 = _inl_13_result_bt2;
                            const qR_raw_p = _inl_13_result_p;
                            let _inl_14_result_rho;
                            let _inl_14_result_vn;
                            let _inl_14_result_vt1;
                            let _inl_14_result_vt2;
                            let _inl_14_result_bt1;
                            let _inl_14_result_bt2;
                            let _inl_14_result_p;
                            _inl_14: {
                                _inl_14_result_rho = (w_c_rho - qL_raw_rho);
                                _inl_14_result_vn = (w_c_vn - qL_raw_vn);
                                _inl_14_result_vt1 = (w_c_vt1 - qL_raw_vt1);
                                _inl_14_result_vt2 = (w_c_vt2 - qL_raw_vt2);
                                _inl_14_result_bt1 = (w_c_bt1 - qL_raw_bt1);
                                _inl_14_result_bt2 = (w_c_bt2 - qL_raw_bt2);
                                _inl_14_result_p = (w_c_p - qL_raw_p);
                                break _inl_14;
                            }
                            const dL_prim_rho = _inl_14_result_rho;
                            const dL_prim_vn = _inl_14_result_vn;
                            const dL_prim_vt1 = _inl_14_result_vt1;
                            const dL_prim_vt2 = _inl_14_result_vt2;
                            const dL_prim_bt1 = _inl_14_result_bt1;
                            const dL_prim_bt2 = _inl_14_result_bt2;
                            const dL_prim_p = _inl_14_result_p;
                            let _inl_15_result_rho;
                            let _inl_15_result_vn;
                            let _inl_15_result_vt1;
                            let _inl_15_result_vt2;
                            let _inl_15_result_bt1;
                            let _inl_15_result_bt2;
                            let _inl_15_result_p;
                            _inl_15: {
                                _inl_15_result_rho = (qR_raw_rho - w_c_rho);
                                _inl_15_result_vn = (qR_raw_vn - w_c_vn);
                                _inl_15_result_vt1 = (qR_raw_vt1 - w_c_vt1);
                                _inl_15_result_vt2 = (qR_raw_vt2 - w_c_vt2);
                                _inl_15_result_bt1 = (qR_raw_bt1 - w_c_bt1);
                                _inl_15_result_bt2 = (qR_raw_bt2 - w_c_bt2);
                                _inl_15_result_p = (qR_raw_p - w_c_p);
                                break _inl_15;
                            }
                            const dR_prim_rho = _inl_15_result_rho;
                            const dR_prim_vn = _inl_15_result_vn;
                            const dR_prim_vt1 = _inl_15_result_vt1;
                            const dR_prim_vt2 = _inl_15_result_vt2;
                            const dR_prim_bt1 = _inl_15_result_bt1;
                            const dR_prim_bt2 = _inl_15_result_bt2;
                            const dR_prim_p = _inl_15_result_p;
                            const _sroa_36 = mhd_eigensystem({ rho: w_c_rho, vn: w_c_vn, vt1: w_c_vt1, vt2: w_c_vt2, bt1: w_c_bt1, bt2: w_c_bt2, p: w_c_p }, bn_c, g);
                            const eig_asq = _sroa_36.asq;
                            const eig_a = _sroa_36.a;
                            const eig_cfsq = _sroa_36.cfsq;
                            const eig_cf = _sroa_36.cf;
                            const eig_cssq = _sroa_36.cssq;
                            const eig_cs = _sroa_36.cs;
                            const eig_alpha_f = _sroa_36.alpha_f;
                            const eig_alpha_s = _sroa_36.alpha_s;
                            const eig_bet1 = _sroa_36.bet1;
                            const eig_bet2 = _sroa_36.bet2;
                            const eig_sgn_bn = _sroa_36.sgn_bn;
                            const eig_sqrtd = _sroa_36.sqrtd;
                            const eig_isqrtd = _sroa_36.isqrtd;
                            const eig_inv_rho = _sroa_36.inv_rho;
                            const _sroa_37 = project_to_char({ rho: dL_prim_rho, vn: dL_prim_vn, vt1: dL_prim_vt1, vt2: dL_prim_vt2, bt1: dL_prim_bt1, bt2: dL_prim_bt2, p: dL_prim_p }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                            const aL_fL = _sroa_37.fL;
                            const aL_aL = _sroa_37.aL;
                            const aL_sL = _sroa_37.sL;
                            const aL_e = _sroa_37.e;
                            const aL_sR = _sroa_37.sR;
                            const aL_aR = _sroa_37.aR;
                            const aL_fR = _sroa_37.fR;
                            const _sroa_38 = project_to_char({ rho: dR_prim_rho, vn: dR_prim_vn, vt1: dR_prim_vt1, vt2: dR_prim_vt2, bt1: dR_prim_bt1, bt2: dR_prim_bt2, p: dR_prim_p }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                            const aR_fL = _sroa_38.fL;
                            const aR_aL = _sroa_38.aL;
                            const aR_sL = _sroa_38.sL;
                            const aR_e = _sroa_38.e;
                            const aR_sR = _sroa_38.sR;
                            const aR_aR = _sroa_38.aR;
                            const aR_fR = _sroa_38.fR;
                            const _sroa_39 = ppm_limit_char({ fL: aL_fL, aL: aL_aL, sL: aL_sL, e: aL_e, sR: aL_sR, aR: aL_aR, fR: aL_fR }, { fL: aR_fL, aL: aR_aL, sL: aR_sL, e: aR_e, sR: aR_sR, aR: aR_aR, fR: aR_fR });
                            const lim_L_fL = _sroa_39.L.fL;
                            const lim_L_aL = _sroa_39.L.aL;
                            const lim_L_sL = _sroa_39.L.sL;
                            const lim_L_e = _sroa_39.L.e;
                            const lim_L_sR = _sroa_39.L.sR;
                            const lim_L_aR = _sroa_39.L.aR;
                            const lim_L_fR = _sroa_39.L.fR;
                            const lim_R_fL = _sroa_39.R.fL;
                            const lim_R_aL = _sroa_39.R.aL;
                            const lim_R_sL = _sroa_39.R.sL;
                            const lim_R_e = _sroa_39.R.e;
                            const lim_R_sR = _sroa_39.R.sR;
                            const lim_R_aR = _sroa_39.R.aR;
                            const lim_R_fR = _sroa_39.R.fR;
                            const _sroa_40 = project_from_char({ fL: lim_L_fL, aL: lim_L_aL, sL: lim_L_sL, e: lim_L_e, sR: lim_L_sR, aR: lim_L_aR, fR: lim_L_fR }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                            const dL_lim_rho = _sroa_40.rho;
                            const dL_lim_vn = _sroa_40.vn;
                            const dL_lim_vt1 = _sroa_40.vt1;
                            const dL_lim_vt2 = _sroa_40.vt2;
                            const dL_lim_bt1 = _sroa_40.bt1;
                            const dL_lim_bt2 = _sroa_40.bt2;
                            const dL_lim_p = _sroa_40.p;
                            const _sroa_41 = project_from_char({ fL: lim_R_fL, aL: lim_R_aL, sL: lim_R_sL, e: lim_R_e, sR: lim_R_sR, aR: lim_R_aR, fR: lim_R_fR }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                            const dR_lim_rho = _sroa_41.rho;
                            const dR_lim_vn = _sroa_41.vn;
                            const dR_lim_vt1 = _sroa_41.vt1;
                            const dR_lim_vt2 = _sroa_41.vt2;
                            const dR_lim_bt1 = _sroa_41.bt1;
                            const dR_lim_bt2 = _sroa_41.bt2;
                            const dR_lim_p = _sroa_41.p;
                            let _inl_16_result_rho;
                            let _inl_16_result_vn;
                            let _inl_16_result_vt1;
                            let _inl_16_result_vt2;
                            let _inl_16_result_bt1;
                            let _inl_16_result_bt2;
                            let _inl_16_result_p;
                            _inl_16: {
                                _inl_16_result_rho = (w_c_rho - dL_lim_rho);
                                _inl_16_result_vn = (w_c_vn - dL_lim_vn);
                                _inl_16_result_vt1 = (w_c_vt1 - dL_lim_vt1);
                                _inl_16_result_vt2 = (w_c_vt2 - dL_lim_vt2);
                                _inl_16_result_bt1 = (w_c_bt1 - dL_lim_bt1);
                                _inl_16_result_bt2 = (w_c_bt2 - dL_lim_bt2);
                                _inl_16_result_p = (w_c_p - dL_lim_p);
                                break _inl_16;
                            }
                            const w_left_raw_rho = _inl_16_result_rho;
                            const w_left_raw_vn = _inl_16_result_vn;
                            const w_left_raw_vt1 = _inl_16_result_vt1;
                            const w_left_raw_vt2 = _inl_16_result_vt2;
                            const w_left_raw_bt1 = _inl_16_result_bt1;
                            const w_left_raw_bt2 = _inl_16_result_bt2;
                            const w_left_raw_p = _inl_16_result_p;
                            let _inl_17_result_rho;
                            let _inl_17_result_vn;
                            let _inl_17_result_vt1;
                            let _inl_17_result_vt2;
                            let _inl_17_result_bt1;
                            let _inl_17_result_bt2;
                            let _inl_17_result_p;
                            _inl_17: {
                                _inl_17_result_rho = (w_c_rho + dR_lim_rho);
                                _inl_17_result_vn = (w_c_vn + dR_lim_vn);
                                _inl_17_result_vt1 = (w_c_vt1 + dR_lim_vt1);
                                _inl_17_result_vt2 = (w_c_vt2 + dR_lim_vt2);
                                _inl_17_result_bt1 = (w_c_bt1 + dR_lim_bt1);
                                _inl_17_result_bt2 = (w_c_bt2 + dR_lim_bt2);
                                _inl_17_result_p = (w_c_p + dR_lim_p);
                                break _inl_17;
                            }
                            const w_right_raw_rho = _inl_17_result_rho;
                            const w_right_raw_vn = _inl_17_result_vn;
                            const w_right_raw_vt1 = _inl_17_result_vt1;
                            const w_right_raw_vt2 = _inl_17_result_vt2;
                            const w_right_raw_bt1 = _inl_17_result_bt1;
                            const w_right_raw_bt2 = _inl_17_result_bt2;
                            const w_right_raw_p = _inl_17_result_p;
                            const _sroa_42 = primitive_safety_net_ppm4({ rho: qL_raw_rho, vn: qL_raw_vn, vt1: qL_raw_vt1, vt2: qL_raw_vt2, bt1: qL_raw_bt1, bt2: qL_raw_bt2, p: qL_raw_p }, { rho: qR_raw_rho, vn: qR_raw_vn, vt1: qR_raw_vt1, vt2: qR_raw_vt2, bt1: qR_raw_bt1, bt2: qR_raw_bt2, p: qR_raw_p }, { rho: w_left_raw_rho, vn: w_left_raw_vn, vt1: w_left_raw_vt1, vt2: w_left_raw_vt2, bt1: w_left_raw_bt1, bt2: w_left_raw_bt2, p: w_left_raw_p }, { rho: w_right_raw_rho, vn: w_right_raw_vn, vt1: w_right_raw_vt1, vt2: w_right_raw_vt2, bt1: w_right_raw_bt1, bt2: w_right_raw_bt2, p: w_right_raw_p }, { rho: w_c_rho, vn: w_c_vn, vt1: w_c_vt1, vt2: w_c_vt2, bt1: w_c_bt1, bt2: w_c_bt2, p: w_c_p }, { rho: w_m2_rho, vn: w_m2_vn, vt1: w_m2_vt1, vt2: w_m2_vt2, bt1: w_m2_bt1, bt2: w_m2_bt2, p: w_m2_p }, { rho: w_m1_rho, vn: w_m1_vn, vt1: w_m1_vt1, vt2: w_m1_vt2, bt1: w_m1_bt1, bt2: w_m1_bt2, p: w_m1_p }, { rho: w_p1_rho, vn: w_p1_vn, vt1: w_p1_vt1, vt2: w_p1_vt2, bt1: w_p1_bt1, bt2: w_p1_bt2, p: w_p1_p }, { rho: w_p2_rho, vn: w_p2_vn, vt1: w_p2_vt1, vt2: w_p2_vt2, bt1: w_p2_bt1, bt2: w_p2_bt2, p: w_p2_p });
                            const safe_L_rho = _sroa_42.L.rho;
                            const safe_L_vn = _sroa_42.L.vn;
                            const safe_L_vt1 = _sroa_42.L.vt1;
                            const safe_L_vt2 = _sroa_42.L.vt2;
                            const safe_L_bt1 = _sroa_42.L.bt1;
                            const safe_L_bt2 = _sroa_42.L.bt2;
                            const safe_L_p = _sroa_42.L.p;
                            const safe_R_rho = _sroa_42.R.rho;
                            const safe_R_vn = _sroa_42.R.vn;
                            const safe_R_vt1 = _sroa_42.R.vt1;
                            const safe_R_vt2 = _sroa_42.R.vt2;
                            const safe_R_bt1 = _sroa_42.R.bt1;
                            const safe_R_bt2 = _sroa_42.R.bt2;
                            const safe_R_p = _sroa_42.R.p;
                            const w_left_rho = safe_L_rho;
                            const w_left_vn = safe_L_vn;
                            const w_left_vt1 = safe_L_vt1;
                            const w_left_vt2 = safe_L_vt2;
                            const w_left_bt1 = safe_L_bt1;
                            const w_left_bt2 = safe_L_bt2;
                            const w_left_p = safe_L_p;
                            const w_right_rho = safe_R_rho;
                            const w_right_vn = safe_R_vn;
                            const w_right_vt1 = safe_R_vt1;
                            const w_right_vt2 = safe_R_vt2;
                            const w_right_bt1 = safe_R_bt1;
                            const w_right_bt2 = safe_R_bt2;
                            const w_right_p = safe_R_p;
                            const _sroa_43 = pack_prim_pair_from_vec7({ rho: w_left_rho, vn: w_left_vn, vt1: w_left_vt1, vt2: w_left_vt2, bt1: w_left_bt1, bt2: w_left_bt2, p: w_left_p }, bn_c, axis);
                            const pp_L_p0_x = _sroa_43.p0.x;
                            const pp_L_p0_y = _sroa_43.p0.y;
                            const pp_L_p0_z = _sroa_43.p0.z;
                            const pp_L_p0_w = _sroa_43.p0.w;
                            const pp_L_p1_x = _sroa_43.p1.x;
                            const pp_L_p1_y = _sroa_43.p1.y;
                            const pp_L_p1_z = _sroa_43.p1.z;
                            const pp_L_p1_w = _sroa_43.p1.w;
                            const _sroa_44 = pack_prim_pair_from_vec7({ rho: w_right_rho, vn: w_right_vn, vt1: w_right_vt1, vt2: w_right_vt2, bt1: w_right_bt1, bt2: w_right_bt2, p: w_right_p }, bn_c, axis);
                            const pp_R_p0_x = _sroa_44.p0.x;
                            const pp_R_p0_y = _sroa_44.p0.y;
                            const pp_R_p0_z = _sroa_44.p0.z;
                            const pp_R_p0_w = _sroa_44.p0.w;
                            const pp_R_p1_x = _sroa_44.p1.x;
                            const pp_R_p1_y = _sroa_44.p1.y;
                            const pp_R_p1_z = _sroa_44.p1.z;
                            const pp_R_p1_w = _sroa_44.p1.w;
                            const _sroa_45 = {x:pp_L_p0_x, y:pp_L_p0_y, z:pp_L_p0_z, w:pp_L_p0_w};
                            let l0_x = _sroa_45.x;
                            let l0_y = _sroa_45.y;
                            let l0_z = _sroa_45.z;
                            let l0_w = _sroa_45.w;
                            const _sroa_46 = {x:pp_R_p0_x, y:pp_R_p0_y, z:pp_R_p0_z, w:pp_R_p0_w};
                            let r0_x = _sroa_46.x;
                            let r0_y = _sroa_46.y;
                            let r0_z = _sroa_46.z;
                            let r0_w = _sroa_46.w;
                            const _sroa_47 = {x:pp_L_p1_x, y:pp_L_p1_y, z:pp_L_p1_z, w:pp_L_p1_w};
                            let l1_x = _sroa_47.x;
                            let l1_y = _sroa_47.y;
                            let l1_z = _sroa_47.z;
                            let l1_w = _sroa_47.w;
                            const _sroa_48 = {x:pp_R_p1_x, y:pp_R_p1_y, z:pp_R_p1_z, w:pp_R_p1_w};
                            let r1_x = _sroa_48.x;
                            let r1_y = _sroa_48.y;
                            let r1_z = _sroa_48.z;
                            let r1_w = _sroa_48.w;
                            l0_x = ((l0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (l0_x));
                            r0_x = ((r0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (r0_x));
                            l1_x = ((l1_x) < (pf) ? (pf) : (l1_x));
                            r1_x = ((r1_x) < (pf) ? (pf) : (r1_x));
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = l0_x;
                                const _wt1 = l0_y;
                                const _wt2 = l0_z;
                                const _wt3 = l0_w;
                                _b_edge_l_0[_wbase + 0] = _wt0;
                                _b_edge_l_0[_wbase + 1] = _wt1;
                                _b_edge_l_0[_wbase + 2] = _wt2;
                                _b_edge_l_0[_wbase + 3] = _wt3;
                            }
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = l1_x;
                                const _wt1 = l1_y;
                                const _wt2 = l1_z;
                                const _wt3 = l1_w;
                                _b_edge_l_1[_wbase + 0] = _wt0;
                                _b_edge_l_1[_wbase + 1] = _wt1;
                                _b_edge_l_1[_wbase + 2] = _wt2;
                                _b_edge_l_1[_wbase + 3] = _wt3;
                            }
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = r0_x;
                                const _wt1 = r0_y;
                                const _wt2 = r0_z;
                                const _wt3 = r0_w;
                                _b_edge_r_0[_wbase + 0] = _wt0;
                                _b_edge_r_0[_wbase + 1] = _wt1;
                                _b_edge_r_0[_wbase + 2] = _wt2;
                                _b_edge_r_0[_wbase + 3] = _wt3;
                            }
                            {
                                const _wbase = ((idx) * 4 + 0);
                                const _wt0 = r1_x;
                                const _wt1 = r1_y;
                                const _wt2 = r1_z;
                                const _wt3 = r1_w;
                                _b_edge_r_1[_wbase + 0] = _wt0;
                                _b_edge_r_1[_wbase + 1] = _wt1;
                                _b_edge_r_1[_wbase + 2] = _wt2;
                                _b_edge_r_1[_wbase + 3] = _wt3;
                            }
                        }
                    }
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

    return { entry, bind, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","edge_l_0","edge_l_1","edge_r_0","edge_r_1","sweep"], entryInfo };
}
