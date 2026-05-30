// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-bcs.wgsl
// wgsl-variant: n1024.bc-outflow
// helpers-sha256: 8c943a8b7cf30e7437759a9bdb9e53a56f237ffd05d70eb845b914f6b4e2b846
// wgsl-transpile sha256: 230de984bab2919a266d4665fa952917c792a317fb8d017fdc44e57caec37644
// wgsl-transpiler-sha256: f8f743464a9ef9689040c4e7659a83a86a44b7650616b5d1894a7bf750131a93
// wgsl-opts: {"flatStorage":true,"collectErrors":true,"specializeUniforms":{"U_uniforms":{"grid_n":1024,"grid_n_total":1028,"ghost_w":2},"bc":{"mode_n":1,"mode_s":1,"mode_e":1,"mode_w":1}},"fixedWorkgroups":[129,129,1]}
// wgsl-metrics: {"bytes":62438,"lines":1508,"rtVec":0,"rtPoly":0,"rtAtomic":0,"rtNumeric":0,"fround":0,"hypot":0,"iife":0,"workgroupReductionInits":0,"flatWorkgroupArrays":0,"flatWorkgroupSlots":0,"staticBranchPrunes":0}
// generated: 2026-05-30T22:00:38.550Z
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

    function prim_to_cons_pair(P, gamma, p_floor) {
        const rho = ((P.rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (P.rho));
        const p = ((P.p) < (p_floor) ? (p_floor) : (P.p));
        const ke = ((0.5 * rho) * ((((P.vx * P.vx) + (P.vy * P.vy)) + (P.vz * P.vz))));
        const mb = (0.5 * ((((P.bx * P.bx) + (P.by * P.by)) + (P.bz * P.bz))));
        const E = (((p / ((gamma - 1.0))) + ke) + mb);
        let R_U0_x = 0;
        let R_U0_y = 0;
        let R_U0_z = 0;
        let R_U0_w = 0;
        let R_U1_x = 0;
        let R_U1_y = 0;
        let R_U1_z = 0;
        let R_U1_w = 0;
        {
            const _wt0 = rho;
            const _wt1 = (rho * P.vx);
            const _wt2 = (rho * P.vy);
            const _wt3 = (rho * P.vz);
            R_U0_x = _wt0;
            R_U0_y = _wt1;
            R_U0_z = _wt2;
            R_U0_w = _wt3;
        }
        const _inl_5_bz = P.bz;
        let _inl_5_result_x, _inl_5_result_y, _inl_5_result_z, _inl_5_result_w;
        _inl_5: {
            const _inl_5_p_safe = ((p) < (p_floor) ? (p_floor) : (p));
            const _inl_5_eth = (_inl_5_p_safe / (((gamma - 1.0)) < (1.0e-6) ? (1.0e-6) : ((gamma - 1.0))));
            let _inl_5__inl_4_result;
            _inl_5__inl_4: {
                _inl_5__inl_4_result = (((_inl_5_p_safe) < (p_floor) ? (p_floor) : (_inl_5_p_safe)) / Math.pow(((rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rho)), gamma));
                break _inl_5__inl_4;
            }
            const _ir0 = E;
            const _ir1 = _inl_5_bz;
            const _ir2 = _inl_5_eth;
            const _ir3 = _inl_5__inl_4_result;
            _inl_5_result_x = _ir0;
            _inl_5_result_y = _ir1;
            _inl_5_result_z = _ir2;
            _inl_5_result_w = _ir3;
            break _inl_5;
        }
        {
            const _wt0 = _inl_5_result_x;
            const _wt1 = _inl_5_result_y;
            const _wt2 = _inl_5_result_z;
            const _wt3 = _inl_5_result_w;
            R_U1_x = _wt0;
            R_U1_y = _wt1;
            R_U1_z = _wt2;
            R_U1_w = _wt3;
        }
        return { U0: {x:R_U0_x, y:R_U0_y, z:R_U0_z, w:R_U0_w}, U1: {x:R_U1_x, y:R_U1_y, z:R_U1_z, w:R_U1_w} };
    }

    function driven_prim_for_edge(edge) {
        if ((edge == EDGE_S_BC)) {
            return { rho: bindings.bc.driven_s_rho, vx: bindings.bc.driven_s_vx, vy: bindings.bc.driven_s_vy, vz: bindings.bc.driven_s_vz, bx: bindings.bc.driven_s_bx, by: bindings.bc.driven_s_by, bz: bindings.bc.driven_s_bz, p: bindings.bc.driven_s_p };
        }
        if ((edge == EDGE_E_BC)) {
            return { rho: bindings.bc.driven_e_rho, vx: bindings.bc.driven_e_vx, vy: bindings.bc.driven_e_vy, vz: bindings.bc.driven_e_vz, bx: bindings.bc.driven_e_bx, by: bindings.bc.driven_e_by, bz: bindings.bc.driven_e_bz, p: bindings.bc.driven_e_p };
        }
        if ((edge == EDGE_W_BC)) {
            return { rho: bindings.bc.driven_w_rho, vx: bindings.bc.driven_w_vx, vy: bindings.bc.driven_w_vy, vz: bindings.bc.driven_w_vz, bx: bindings.bc.driven_w_bx, by: bindings.bc.driven_w_by, bz: bindings.bc.driven_w_bz, p: bindings.bc.driven_w_p };
        }
        return { rho: bindings.bc.driven_n_rho, vx: bindings.bc.driven_n_vx, vy: bindings.bc.driven_n_vy, vz: bindings.bc.driven_n_vz, bx: bindings.bc.driven_n_bx, by: bindings.bc.driven_n_by, bz: bindings.bc.driven_n_bz, p: bindings.bc.driven_n_p };
    }

    function vert_mode_for_row(iy, ghost, n_interior) {
        if ((iy < ghost)) {
            return 1;
        }
        if ((iy >= (ghost + n_interior))) {
            return 1;
        }
        return BC_PERIODIC;
    }

    function horiz_mode_for_col(ix, ghost, n_interior) {
        if ((ix < ghost)) {
            return 1;
        }
        if ((ix >= (ghost + n_interior))) {
            return 1;
        }
        return BC_PERIODIC;
    }

    function permute_prim_bc(P, axis) {
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
        if ((axis == 0)) {
            R_vn = P.vx;
            R_vt1 = P.vy;
            R_vt2 = P.vz;
            R_bt1 = P.by;
            R_bt2 = P.bz;
            R_bn = P.bx;
        } else {
            R_vn = P.vy;
            R_vt1 = P.vz;
            R_vt2 = P.vx;
            R_bt1 = P.bz;
            R_bt2 = P.bx;
            R_bn = P.by;
        }
        return { rho: R_rho, vn: R_vn, vt1: R_vt1, vt2: R_vt2, bt1: R_bt1, bt2: R_bt2, p: R_p, bn: R_bn };
    }

    function unpermute_prim_bc(P, axis) {
        let R_rho = 0;
        let R_vx = 0;
        let R_vy = 0;
        let R_vz = 0;
        let R_p = 0;
        let R_bx = 0;
        let R_by = 0;
        let R_bz = 0;
        R_rho = P.rho;
        R_p = P.p;
        if ((axis == 0)) {
            R_vx = P.vn;
            R_vy = P.vt1;
            R_vz = P.vt2;
            R_bx = P.bn;
            R_by = P.bt1;
            R_bz = P.bt2;
        } else {
            R_vx = P.vt2;
            R_vy = P.vn;
            R_vz = P.vt1;
            R_bx = P.bt2;
            R_by = P.bn;
            R_bz = P.bt1;
        }
        return { rho: R_rho, vx: R_vx, vy: R_vy, vz: R_vz, p: R_p, bx: R_bx, by: R_by, bz: R_bz };
    }

    function mhd_eigensystem_bc(w, bn, gamma) {
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

    function project_to_char_bc(dW, S) {
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

    function project_from_char_bc(C, S) {
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

    function zero_incoming_chars(C, S, vn, n_out) {
        const _sroa_0 = C;
        let out_fL = _sroa_0.fL;
        let out_aL = _sroa_0.aL;
        let out_sL = _sroa_0.sL;
        let out_e = _sroa_0.e;
        let out_sR = _sroa_0.sR;
        let out_aR = _sroa_0.aR;
        let out_fR = _sroa_0.fR;
        const casq = ((S.asq > 0.0) ? ((S.cfsq * S.cssq) / ((S.asq) < (1.0e-30) ? (1.0e-30) : (S.asq))) : 0.0);
        const ca2 = Math.sqrt(((casq) < (0.0) ? (0.0) : (casq)));
        const lam_fL = (vn - S.cf);
        const lam_aL = (vn - ca2);
        const lam_sL = (vn - S.cs);
        const lam_e = vn;
        const lam_sR = (vn + S.cs);
        const lam_aR = (vn + ca2);
        const lam_fR = (vn + S.cf);
        if (((lam_fL * n_out) < 0.0)) {
            out_fL = 0.0;
        }
        if (((lam_aL * n_out) < 0.0)) {
            out_aL = 0.0;
        }
        if (((lam_sL * n_out) < 0.0)) {
            out_sL = 0.0;
        }
        if (((lam_e * n_out) < 0.0)) {
            out_e = 0.0;
        }
        if (((lam_sR * n_out) < 0.0)) {
            out_sR = 0.0;
        }
        if (((lam_aR * n_out) < 0.0)) {
            out_aR = 0.0;
        }
        if (((lam_fR * n_out) < 0.0)) {
            out_fR = 0.0;
        }
        return { fL: out_fL, aL: out_aL, sL: out_sL, e: out_e, sR: out_sR, aR: out_aR, fR: out_fR };
    }

    function nscbc_outflow_ghost(ib, jb, ii, ji, d, axis, n_out, n_total, gamma, p_floor) {
        let _inl_11_result_rho;
        let _inl_11_result_vx;
        let _inl_11_result_vy;
        let _inl_11_result_vz;
        let _inl_11_result_p;
        let _inl_11_result_bx;
        let _inl_11_result_by;
        let _inl_11_result_bz;
        _inl_11: {
            let _inl_11__inl_6_result;
            _inl_11__inl_6: {
                _inl_11__inl_6_result = ((jb * n_total) + ib);
                break _inl_11__inl_6;
            }
            const _inl_11_idx = _inl_11__inl_6_result;
            let _inl_11__inl_7_result;
            _inl_11__inl_7: {
                let _inl_11__inl_7__inl_0_result;
                _inl_11__inl_7__inl_0: {
                    _inl_11__inl_7__inl_0_result = ((jb * ((n_total + 1))) + ib);
                    break _inl_11__inl_7__inl_0;
                }
                _inl_11__inl_7_result = _inl_11__inl_7__inl_0_result;
                break _inl_11__inl_7;
            }
            let _inl_11__inl_8_result;
            _inl_11__inl_8: {
                const _inl_11__inl_8__inl_1_ix = (ib + 1);
                let _inl_11__inl_8__inl_1_result;
                _inl_11__inl_8__inl_1: {
                    _inl_11__inl_8__inl_1_result = ((jb * ((n_total + 1))) + _inl_11__inl_8__inl_1_ix);
                    break _inl_11__inl_8__inl_1;
                }
                _inl_11__inl_8_result = _inl_11__inl_8__inl_1_result;
                break _inl_11__inl_8;
            }
            const _inl_11_bx = (0.5 * ((bindings.Bx_face[_inl_11__inl_7_result] + bindings.Bx_face[_inl_11__inl_8_result])));
            let _inl_11__inl_9_result;
            _inl_11__inl_9: {
                let _inl_11__inl_9__inl_2_result;
                _inl_11__inl_9__inl_2: {
                    _inl_11__inl_9__inl_2_result = ((jb * n_total) + ib);
                    break _inl_11__inl_9__inl_2;
                }
                _inl_11__inl_9_result = _inl_11__inl_9__inl_2_result;
                break _inl_11__inl_9;
            }
            let _inl_11__inl_10_result;
            _inl_11__inl_10: {
                const _inl_11__inl_10__inl_3_iy = (jb + 1);
                let _inl_11__inl_10__inl_3_result;
                _inl_11__inl_10__inl_3: {
                    _inl_11__inl_10__inl_3_result = ((_inl_11__inl_10__inl_3_iy * n_total) + ib);
                    break _inl_11__inl_10__inl_3;
                }
                _inl_11__inl_10_result = _inl_11__inl_10__inl_3_result;
                break _inl_11__inl_10;
            }
            const _inl_11_by = (0.5 * ((bindings.By_face[_inl_11__inl_9_result] + bindings.By_face[_inl_11__inl_10_result])));
            const _sroa_1 = cons_to_prim_mhd(((_b) => ({x:bindings.U0[_b + 0], y:bindings.U0[_b + 1], z:bindings.U0[_b + 2], w:bindings.U0[_b + 3]}))(((_inl_11_idx) * 4 + 0)), ((_b) => ({x:bindings.U1[_b + 0], y:bindings.U1[_b + 1], z:bindings.U1[_b + 2], w:bindings.U1[_b + 3]}))(((_inl_11_idx) * 4 + 0)), _inl_11_bx, _inl_11_by, gamma, p_floor);
            _inl_11_result_rho = _sroa_1.rho;
            _inl_11_result_vx = _sroa_1.vx;
            _inl_11_result_vy = _sroa_1.vy;
            _inl_11_result_vz = _sroa_1.vz;
            _inl_11_result_p = _sroa_1.p;
            _inl_11_result_bx = _sroa_1.bx;
            _inl_11_result_by = _sroa_1.by;
            _inl_11_result_bz = _sroa_1.bz;
            break _inl_11;
        }
        const pb_rho = _inl_11_result_rho;
        const pb_vx = _inl_11_result_vx;
        const pb_vy = _inl_11_result_vy;
        const pb_vz = _inl_11_result_vz;
        const pb_p = _inl_11_result_p;
        const pb_bx = _inl_11_result_bx;
        const pb_by = _inl_11_result_by;
        const pb_bz = _inl_11_result_bz;
        let _inl_12_result_rho;
        let _inl_12_result_vx;
        let _inl_12_result_vy;
        let _inl_12_result_vz;
        let _inl_12_result_p;
        let _inl_12_result_bx;
        let _inl_12_result_by;
        let _inl_12_result_bz;
        _inl_12: {
            let _inl_12__inl_6_result;
            _inl_12__inl_6: {
                _inl_12__inl_6_result = ((ji * n_total) + ii);
                break _inl_12__inl_6;
            }
            const _inl_12_idx = _inl_12__inl_6_result;
            let _inl_12__inl_7_result;
            _inl_12__inl_7: {
                let _inl_12__inl_7__inl_0_result;
                _inl_12__inl_7__inl_0: {
                    _inl_12__inl_7__inl_0_result = ((ji * ((n_total + 1))) + ii);
                    break _inl_12__inl_7__inl_0;
                }
                _inl_12__inl_7_result = _inl_12__inl_7__inl_0_result;
                break _inl_12__inl_7;
            }
            let _inl_12__inl_8_result;
            _inl_12__inl_8: {
                const _inl_12__inl_8__inl_1_ix = (ii + 1);
                let _inl_12__inl_8__inl_1_result;
                _inl_12__inl_8__inl_1: {
                    _inl_12__inl_8__inl_1_result = ((ji * ((n_total + 1))) + _inl_12__inl_8__inl_1_ix);
                    break _inl_12__inl_8__inl_1;
                }
                _inl_12__inl_8_result = _inl_12__inl_8__inl_1_result;
                break _inl_12__inl_8;
            }
            const _inl_12_bx = (0.5 * ((bindings.Bx_face[_inl_12__inl_7_result] + bindings.Bx_face[_inl_12__inl_8_result])));
            let _inl_12__inl_9_result;
            _inl_12__inl_9: {
                let _inl_12__inl_9__inl_2_result;
                _inl_12__inl_9__inl_2: {
                    _inl_12__inl_9__inl_2_result = ((ji * n_total) + ii);
                    break _inl_12__inl_9__inl_2;
                }
                _inl_12__inl_9_result = _inl_12__inl_9__inl_2_result;
                break _inl_12__inl_9;
            }
            let _inl_12__inl_10_result;
            _inl_12__inl_10: {
                const _inl_12__inl_10__inl_3_iy = (ji + 1);
                let _inl_12__inl_10__inl_3_result;
                _inl_12__inl_10__inl_3: {
                    _inl_12__inl_10__inl_3_result = ((_inl_12__inl_10__inl_3_iy * n_total) + ii);
                    break _inl_12__inl_10__inl_3;
                }
                _inl_12__inl_10_result = _inl_12__inl_10__inl_3_result;
                break _inl_12__inl_10;
            }
            const _inl_12_by = (0.5 * ((bindings.By_face[_inl_12__inl_9_result] + bindings.By_face[_inl_12__inl_10_result])));
            const _sroa_2 = cons_to_prim_mhd(((_b) => ({x:bindings.U0[_b + 0], y:bindings.U0[_b + 1], z:bindings.U0[_b + 2], w:bindings.U0[_b + 3]}))(((_inl_12_idx) * 4 + 0)), ((_b) => ({x:bindings.U1[_b + 0], y:bindings.U1[_b + 1], z:bindings.U1[_b + 2], w:bindings.U1[_b + 3]}))(((_inl_12_idx) * 4 + 0)), _inl_12_bx, _inl_12_by, gamma, p_floor);
            _inl_12_result_rho = _sroa_2.rho;
            _inl_12_result_vx = _sroa_2.vx;
            _inl_12_result_vy = _sroa_2.vy;
            _inl_12_result_vz = _sroa_2.vz;
            _inl_12_result_p = _sroa_2.p;
            _inl_12_result_bx = _sroa_2.bx;
            _inl_12_result_by = _sroa_2.by;
            _inl_12_result_bz = _sroa_2.bz;
            break _inl_12;
        }
        const pi_rho = _inl_12_result_rho;
        const pi_vx = _inl_12_result_vx;
        const pi_vy = _inl_12_result_vy;
        const pi_vz = _inl_12_result_vz;
        const pi_p = _inl_12_result_p;
        const pi_bx = _inl_12_result_bx;
        const pi_by = _inl_12_result_by;
        const pi_bz = _inl_12_result_bz;
        const _sroa_3 = permute_prim_bc({ rho: pb_rho, vx: pb_vx, vy: pb_vy, vz: pb_vz, p: pb_p, bx: pb_bx, by: pb_by, bz: pb_bz }, axis);
        const perm_b_rho = _sroa_3.rho;
        const perm_b_vn = _sroa_3.vn;
        const perm_b_vt1 = _sroa_3.vt1;
        const perm_b_vt2 = _sroa_3.vt2;
        const perm_b_bt1 = _sroa_3.bt1;
        const perm_b_bt2 = _sroa_3.bt2;
        const perm_b_p = _sroa_3.p;
        const perm_b_bn = _sroa_3.bn;
        const _sroa_4 = permute_prim_bc({ rho: pi_rho, vx: pi_vx, vy: pi_vy, vz: pi_vz, p: pi_p, bx: pi_bx, by: pi_by, bz: pi_bz }, axis);
        const perm_i_rho = _sroa_4.rho;
        const perm_i_vn = _sroa_4.vn;
        const perm_i_vt1 = _sroa_4.vt1;
        const perm_i_vt2 = _sroa_4.vt2;
        const perm_i_bt1 = _sroa_4.bt1;
        const perm_i_bt2 = _sroa_4.bt2;
        const perm_i_p = _sroa_4.p;
        const perm_i_bn = _sroa_4.bn;
        let _inl_13_result_rho;
        let _inl_13_result_vn;
        let _inl_13_result_vt1;
        let _inl_13_result_vt2;
        let _inl_13_result_bt1;
        let _inl_13_result_bt2;
        let _inl_13_result_p;
        _inl_13: {
            _inl_13_result_rho = perm_b_rho;
            _inl_13_result_vn = perm_b_vn;
            _inl_13_result_vt1 = perm_b_vt1;
            _inl_13_result_vt2 = perm_b_vt2;
            _inl_13_result_bt1 = perm_b_bt1;
            _inl_13_result_bt2 = perm_b_bt2;
            _inl_13_result_p = perm_b_p;
            break _inl_13;
        }
        const wb_rho = _inl_13_result_rho;
        const wb_vn = _inl_13_result_vn;
        const wb_vt1 = _inl_13_result_vt1;
        const wb_vt2 = _inl_13_result_vt2;
        const wb_bt1 = _inl_13_result_bt1;
        const wb_bt2 = _inl_13_result_bt2;
        const wb_p = _inl_13_result_p;
        let _inl_14_result_rho;
        let _inl_14_result_vn;
        let _inl_14_result_vt1;
        let _inl_14_result_vt2;
        let _inl_14_result_bt1;
        let _inl_14_result_bt2;
        let _inl_14_result_p;
        _inl_14: {
            _inl_14_result_rho = perm_i_rho;
            _inl_14_result_vn = perm_i_vn;
            _inl_14_result_vt1 = perm_i_vt1;
            _inl_14_result_vt2 = perm_i_vt2;
            _inl_14_result_bt1 = perm_i_bt1;
            _inl_14_result_bt2 = perm_i_bt2;
            _inl_14_result_p = perm_i_p;
            break _inl_14;
        }
        const wi_rho = _inl_14_result_rho;
        const wi_vn = _inl_14_result_vn;
        const wi_vt1 = _inl_14_result_vt1;
        const wi_vt2 = _inl_14_result_vt2;
        const wi_bt1 = _inl_14_result_bt1;
        const wi_bt2 = _inl_14_result_bt2;
        const wi_p = _inl_14_result_p;
        let _inl_15_result_rho;
        let _inl_15_result_vn;
        let _inl_15_result_vt1;
        let _inl_15_result_vt2;
        let _inl_15_result_bt1;
        let _inl_15_result_bt2;
        let _inl_15_result_p;
        _inl_15: {
            _inl_15_result_rho = (wb_rho - wi_rho);
            _inl_15_result_vn = (wb_vn - wi_vn);
            _inl_15_result_vt1 = (wb_vt1 - wi_vt1);
            _inl_15_result_vt2 = (wb_vt2 - wi_vt2);
            _inl_15_result_bt1 = (wb_bt1 - wi_bt1);
            _inl_15_result_bt2 = (wb_bt2 - wi_bt2);
            _inl_15_result_p = (wb_p - wi_p);
            break _inl_15;
        }
        const dw_axis_rho = _inl_15_result_rho;
        const dw_axis_vn = _inl_15_result_vn;
        const dw_axis_vt1 = _inl_15_result_vt1;
        const dw_axis_vt2 = _inl_15_result_vt2;
        const dw_axis_bt1 = _inl_15_result_bt1;
        const dw_axis_bt2 = _inl_15_result_bt2;
        const dw_axis_p = _inl_15_result_p;
        const _sroa_5 = mhd_eigensystem_bc({ rho: wb_rho, vn: wb_vn, vt1: wb_vt1, vt2: wb_vt2, bt1: wb_bt1, bt2: wb_bt2, p: wb_p }, perm_b_bn, gamma);
        const eig_asq = _sroa_5.asq;
        const eig_a = _sroa_5.a;
        const eig_cfsq = _sroa_5.cfsq;
        const eig_cf = _sroa_5.cf;
        const eig_cssq = _sroa_5.cssq;
        const eig_cs = _sroa_5.cs;
        const eig_alpha_f = _sroa_5.alpha_f;
        const eig_alpha_s = _sroa_5.alpha_s;
        const eig_bet1 = _sroa_5.bet1;
        const eig_bet2 = _sroa_5.bet2;
        const eig_sgn_bn = _sroa_5.sgn_bn;
        const eig_sqrtd = _sroa_5.sqrtd;
        const eig_isqrtd = _sroa_5.isqrtd;
        const eig_inv_rho = _sroa_5.inv_rho;
        const _sroa_6 = project_to_char_bc({ rho: dw_axis_rho, vn: dw_axis_vn, vt1: dw_axis_vt1, vt2: dw_axis_vt2, bt1: dw_axis_bt1, bt2: dw_axis_bt2, p: dw_axis_p }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
        const a_fL = _sroa_6.fL;
        const a_aL = _sroa_6.aL;
        const a_sL = _sroa_6.sL;
        const a_e = _sroa_6.e;
        const a_sR = _sroa_6.sR;
        const a_aR = _sroa_6.aR;
        const a_fR = _sroa_6.fR;
        const _sroa_7 = zero_incoming_chars({ fL: a_fL, aL: a_aL, sL: a_sL, e: a_e, sR: a_sR, aR: a_aR, fR: a_fR }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho }, perm_b_vn, n_out);
        const a_nr_fL = _sroa_7.fL;
        const a_nr_aL = _sroa_7.aL;
        const a_nr_sL = _sroa_7.sL;
        const a_nr_e = _sroa_7.e;
        const a_nr_sR = _sroa_7.sR;
        const a_nr_aR = _sroa_7.aR;
        const a_nr_fR = _sroa_7.fR;
        const _sroa_8 = project_from_char_bc({ fL: a_nr_fL, aL: a_nr_aL, sL: a_nr_sL, e: a_nr_e, sR: a_nr_sR, aR: a_nr_aR, fR: a_nr_fR }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
        const dw_mod_rho = _sroa_8.rho;
        const dw_mod_vn = _sroa_8.vn;
        const dw_mod_vt1 = _sroa_8.vt1;
        const dw_mod_vt2 = _sroa_8.vt2;
        const dw_mod_bt1 = _sroa_8.bt1;
        const dw_mod_bt2 = _sroa_8.bt2;
        const dw_mod_p = _sroa_8.p;
        let _inl_16_result_rho;
        let _inl_16_result_vn;
        let _inl_16_result_vt1;
        let _inl_16_result_vt2;
        let _inl_16_result_bt1;
        let _inl_16_result_bt2;
        let _inl_16_result_p;
        _inl_16: {
            _inl_16_result_rho = (wb_rho + (d * dw_mod_rho));
            _inl_16_result_vn = (wb_vn + (d * dw_mod_vn));
            _inl_16_result_vt1 = (wb_vt1 + (d * dw_mod_vt1));
            _inl_16_result_vt2 = (wb_vt2 + (d * dw_mod_vt2));
            _inl_16_result_bt1 = (wb_bt1 + (d * dw_mod_bt1));
            _inl_16_result_bt2 = (wb_bt2 + (d * dw_mod_bt2));
            _inl_16_result_p = (wb_p + (d * dw_mod_p));
            break _inl_16;
        }
        const w_ghost_vec_rho = _inl_16_result_rho;
        const w_ghost_vec_vn = _inl_16_result_vn;
        const w_ghost_vec_vt1 = _inl_16_result_vt1;
        const w_ghost_vec_vt2 = _inl_16_result_vt2;
        const w_ghost_vec_bt1 = _inl_16_result_bt1;
        const w_ghost_vec_bt2 = _inl_16_result_bt2;
        const w_ghost_vec_p = _inl_16_result_p;
        let w_ghost_rho = 0;
        let w_ghost_vn = 0;
        let w_ghost_vt1 = 0;
        let w_ghost_vt2 = 0;
        let w_ghost_bt1 = 0;
        let w_ghost_bt2 = 0;
        let w_ghost_p = 0;
        let w_ghost_bn = 0;
        w_ghost_rho = ((w_ghost_vec_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (w_ghost_vec_rho));
        w_ghost_vn = w_ghost_vec_vn;
        w_ghost_vt1 = w_ghost_vec_vt1;
        w_ghost_vt2 = w_ghost_vec_vt2;
        w_ghost_bt1 = w_ghost_vec_bt1;
        w_ghost_bt2 = w_ghost_vec_bt2;
        w_ghost_p = ((w_ghost_vec_p) < (p_floor) ? (p_floor) : (w_ghost_vec_p));
        w_ghost_bn = perm_b_bn;
        const _sroa_9 = unpermute_prim_bc({ rho: w_ghost_rho, vn: w_ghost_vn, vt1: w_ghost_vt1, vt2: w_ghost_vt2, bt1: w_ghost_bt1, bt2: w_ghost_bt2, p: w_ghost_p, bn: w_ghost_bn }, axis);
        const prim_ghost_rho = _sroa_9.rho;
        const prim_ghost_vx = _sroa_9.vx;
        const prim_ghost_vy = _sroa_9.vy;
        const prim_ghost_vz = _sroa_9.vz;
        const prim_ghost_p = _sroa_9.p;
        const prim_ghost_bx = _sroa_9.bx;
        const prim_ghost_by = _sroa_9.by;
        const prim_ghost_bz = _sroa_9.bz;
        return prim_to_cons_pair({ rho: prim_ghost_rho, vx: prim_ghost_vx, vy: prim_ghost_vy, vz: prim_ghost_vz, p: prim_ghost_p, bx: prim_ghost_bx, by: prim_ghost_by, bz: prim_ghost_bz }, gamma, p_floor);
    }

    function fill_cell_ghost(ix, iy, ghost, n_interior, n_total) {
        const h_mode = horiz_mode_for_col(ix, ghost, n_interior);
        const v_mode = vert_mode_for_row(iy, ghost, n_interior);
        const h_edge = ((ix < ghost) ? EDGE_W_BC : EDGE_E_BC);
        const v_edge = ((iy < ghost) ? EDGE_S_BC : EDGE_N_BC);
        const in_h_ghost = (((ix < ghost)) || ((ix >= (ghost + n_interior))));
        const in_v_ghost = (((iy < ghost)) || ((iy >= (ghost + n_interior))));
        if (((!in_h_ghost) && (!in_v_ghost))) {
            return;
        }
        let mode = 0;
        let owner_edge = 0;
        if ((in_h_ghost && in_v_ghost)) {
            let _inl_17_result;
            _inl_17: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_17_result = h_mode;
                    break _inl_17;
                }
                _inl_17_result = v_mode;
                break _inl_17;
            }
            mode = _inl_17_result;
            owner_edge = ((h_mode != BC_PERIODIC) ? h_edge : v_edge);
        } else if (in_h_ghost) {
            mode = h_mode;
            owner_edge = h_edge;
        } else {
            mode = v_mode;
            owner_edge = v_edge;
        }
        let _inl_18_result;
        _inl_18: {
            _inl_18_result = ((iy * n_total) + ix);
            break _inl_18;
        }
        const dst = _inl_18_result;
        if ((mode == BC_PERIODIC)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = (ix + n_interior);
            } else if ((ix >= (ghost + n_interior))) {
                src_i = (ix - n_interior);
            }
            if ((iy < ghost)) {
                src_j = (iy + n_interior);
            } else if ((iy >= (ghost + n_interior))) {
                src_j = (iy - n_interior);
            }
            let _inl_19_result;
            _inl_19: {
                _inl_19_result = ((src_j * n_total) + src_i);
                break _inl_19;
            }
            const src = _inl_19_result;
            {
                const _wbase = ((dst) * 4 + 0);
                const _wt0 = bindings.U0[((src) * 4 + 0) + 0];
                const _wt1 = bindings.U0[((src) * 4 + 0) + 1];
                const _wt2 = bindings.U0[((src) * 4 + 0) + 2];
                const _wt3 = bindings.U0[((src) * 4 + 0) + 3];
                bindings.U0[_wbase + 0] = _wt0;
                bindings.U0[_wbase + 1] = _wt1;
                bindings.U0[_wbase + 2] = _wt2;
                bindings.U0[_wbase + 3] = _wt3;
            }
            {
                const _wbase = ((dst) * 4 + 0);
                const _wt0 = bindings.U1[((src) * 4 + 0) + 0];
                const _wt1 = bindings.U1[((src) * 4 + 0) + 1];
                const _wt2 = bindings.U1[((src) * 4 + 0) + 2];
                const _wt3 = bindings.U1[((src) * 4 + 0) + 3];
                bindings.U1[_wbase + 0] = _wt0;
                bindings.U1[_wbase + 1] = _wt1;
                bindings.U1[_wbase + 2] = _wt2;
                bindings.U1[_wbase + 3] = _wt3;
            }
            return;
        }
        if ((mode == BC_OUTFLOW)) {
            let axis = 0;
            let n_out = 1.0;
            let ib = ix;
            let jb = iy;
            let ii = ix;
            let ji = iy;
            let d = 0.0;
            let use_horiz = false;
            if ((in_h_ghost && in_v_ghost)) {
                if ((h_mode != BC_PERIODIC)) {
                    use_horiz = true;
                } else if ((v_mode != BC_PERIODIC)) {
                    use_horiz = false;
                } else {
                    use_horiz = true;
                }
            } else if (in_h_ghost) {
                use_horiz = true;
            } else {
                use_horiz = false;
            }
            if (use_horiz) {
                axis = 0;
                if ((ix < ghost)) {
                    ib = ghost;
                    ii = (ghost + 1);
                    n_out = (-1.0);
                    d = (+((((ib) | 0) - ((ix) | 0))));
                } else {
                    ib = ((ghost + n_interior) - 1);
                    ii = ((ghost + n_interior) - 2);
                    n_out = 1.0;
                    d = (+((((ix) | 0) - ((ib) | 0))));
                }
                jb = iy;
                ji = iy;
                if ((iy < ghost)) {
                    if ((v_mode == BC_PERIODIC)) {
                        jb = (iy + n_interior);
                        ji = (iy + n_interior);
                    } else {
                        jb = ghost;
                        ji = ghost;
                    }
                } else if ((iy >= (ghost + n_interior))) {
                    if ((v_mode == BC_PERIODIC)) {
                        jb = (iy - n_interior);
                        ji = (iy - n_interior);
                    } else {
                        jb = ((ghost + n_interior) - 1);
                        ji = ((ghost + n_interior) - 1);
                    }
                }
            } else {
                axis = 1;
                if ((iy < ghost)) {
                    jb = ghost;
                    ji = (ghost + 1);
                    n_out = (-1.0);
                    d = (+((((jb) | 0) - ((iy) | 0))));
                } else {
                    jb = ((ghost + n_interior) - 1);
                    ji = ((ghost + n_interior) - 2);
                    n_out = 1.0;
                    d = (+((((iy) | 0) - ((jb) | 0))));
                }
                ib = ix;
                ii = ix;
                if ((ix < ghost)) {
                    if ((h_mode == BC_PERIODIC)) {
                        ib = (ix + n_interior);
                        ii = (ix + n_interior);
                    } else {
                        ib = ghost;
                        ii = ghost;
                    }
                } else if ((ix >= (ghost + n_interior))) {
                    if ((h_mode == BC_PERIODIC)) {
                        ib = (ix - n_interior);
                        ii = (ix - n_interior);
                    } else {
                        ib = ((ghost + n_interior) - 1);
                        ii = ((ghost + n_interior) - 1);
                    }
                }
            }
            const _sroa_10 = nscbc_outflow_ghost(ib, jb, ii, ji, d, axis, n_out, n_total, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
            const cp_U0_x = _sroa_10.U0.x;
            const cp_U0_y = _sroa_10.U0.y;
            const cp_U0_z = _sroa_10.U0.z;
            const cp_U0_w = _sroa_10.U0.w;
            const cp_U1_x = _sroa_10.U1.x;
            const cp_U1_y = _sroa_10.U1.y;
            const cp_U1_z = _sroa_10.U1.z;
            const cp_U1_w = _sroa_10.U1.w;
            {
                const _ftmp = {x:cp_U0_x, y:cp_U0_y, z:cp_U0_z, w:cp_U0_w};
                const _wbase = ((dst) * 4 + 0);
                bindings.U0[_wbase + 0] = _ftmp.x;
                bindings.U0[_wbase + 1] = _ftmp.y;
                bindings.U0[_wbase + 2] = _ftmp.z;
                bindings.U0[_wbase + 3] = _ftmp.w;
            }
            {
                const _ftmp = {x:cp_U1_x, y:cp_U1_y, z:cp_U1_z, w:cp_U1_w};
                const _wbase = ((dst) * 4 + 0);
                bindings.U1[_wbase + 0] = _ftmp.x;
                bindings.U1[_wbase + 1] = _ftmp.y;
                bindings.U1[_wbase + 2] = _ftmp.z;
                bindings.U1[_wbase + 3] = _ftmp.w;
            }
            return;
        }
        if ((mode == BC_REFLECTING)) {
            let src_i = ix;
            let src_j = iy;
            let flip_x = false;
            let flip_y = false;
            const h_is_reflect = (in_h_ghost && ((h_mode == BC_REFLECTING)));
            const v_is_reflect = (in_v_ghost && ((v_mode == BC_REFLECTING)));
            if (h_is_reflect) {
                if ((ix < ghost)) {
                    src_i = (((2 * ghost) - 1) - ix);
                } else {
                    src_i = (((2 * ((ghost + n_interior))) - 1) - ix);
                }
                flip_x = true;
            } else if ((in_h_ghost && (h_mode == BC_PERIODIC))) {
                if ((ix < ghost)) {
                    src_i = (ix + n_interior);
                } else {
                    src_i = (ix - n_interior);
                }
            }
            if (v_is_reflect) {
                if ((iy < ghost)) {
                    src_j = (((2 * ghost) - 1) - iy);
                } else {
                    src_j = (((2 * ((ghost + n_interior))) - 1) - iy);
                }
                flip_y = true;
            } else if ((in_v_ghost && (v_mode == BC_PERIODIC))) {
                if ((iy < ghost)) {
                    src_j = (iy + n_interior);
                } else {
                    src_j = (iy - n_interior);
                }
            }
            let _inl_20_result;
            _inl_20: {
                _inl_20_result = ((src_j * n_total) + src_i);
                break _inl_20;
            }
            const src = _inl_20_result;
            const _sroa_11_base = ((src) * 4 + 0);
            let u0_x = bindings.U0[_sroa_11_base + 0];
            let u0_y = bindings.U0[_sroa_11_base + 1];
            let u0_z = bindings.U0[_sroa_11_base + 2];
            let u0_w = bindings.U0[_sroa_11_base + 3];
            const _sroa_12_base = ((src) * 4 + 0);
            let u1_x = bindings.U1[_sroa_12_base + 0];
            let u1_y = bindings.U1[_sroa_12_base + 1];
            let u1_z = bindings.U1[_sroa_12_base + 2];
            let u1_w = bindings.U1[_sroa_12_base + 3];
            if (flip_x) {
                u0_y = (-u0_y);
            }
            if (flip_y) {
                u0_z = (-u0_z);
            }
            {
                const _wbase = ((dst) * 4 + 0);
                const _wt0 = u0_x;
                const _wt1 = u0_y;
                const _wt2 = u0_z;
                const _wt3 = u0_w;
                bindings.U0[_wbase + 0] = _wt0;
                bindings.U0[_wbase + 1] = _wt1;
                bindings.U0[_wbase + 2] = _wt2;
                bindings.U0[_wbase + 3] = _wt3;
            }
            {
                const _wbase = ((dst) * 4 + 0);
                const _wt0 = u1_x;
                const _wt1 = u1_y;
                const _wt2 = u1_z;
                const _wt3 = u1_w;
                bindings.U1[_wbase + 0] = _wt0;
                bindings.U1[_wbase + 1] = _wt1;
                bindings.U1[_wbase + 2] = _wt2;
                bindings.U1[_wbase + 3] = _wt3;
            }
            return;
        }
        let _inl_21_result_0_x, _inl_21_result_0_y, _inl_21_result_0_z, _inl_21_result_0_w;
        let _inl_21_result_1_x, _inl_21_result_1_y, _inl_21_result_1_z, _inl_21_result_1_w;
        _inl_21: {
            const _sroa_13 = driven_prim_for_edge(owner_edge);
            const _inl_21_D_rho = _sroa_13.rho;
            const _inl_21_D_vx = _sroa_13.vx;
            const _inl_21_D_vy = _sroa_13.vy;
            const _inl_21_D_vz = _sroa_13.vz;
            const _inl_21_D_bx = _sroa_13.bx;
            const _inl_21_D_by = _sroa_13.by;
            const _inl_21_D_bz = _sroa_13.bz;
            const _inl_21_D_p = _sroa_13.p;
            let _inl_21_P_rho = 0;
            let _inl_21_P_vx = 0;
            let _inl_21_P_vy = 0;
            let _inl_21_P_vz = 0;
            let _inl_21_P_p = 0;
            let _inl_21_P_bx = 0;
            let _inl_21_P_by = 0;
            let _inl_21_P_bz = 0;
            _inl_21_P_rho = ((_inl_21_D_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (_inl_21_D_rho));
            _inl_21_P_vx = _inl_21_D_vx;
            _inl_21_P_vy = _inl_21_D_vy;
            _inl_21_P_vz = _inl_21_D_vz;
            _inl_21_P_p = ((_inl_21_D_p) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : (_inl_21_D_p));
            _inl_21_P_bx = _inl_21_D_bx;
            _inl_21_P_by = _inl_21_D_by;
            _inl_21_P_bz = _inl_21_D_bz;
            const _sroa_14 = prim_to_cons_pair({ rho: _inl_21_P_rho, vx: _inl_21_P_vx, vy: _inl_21_P_vy, vz: _inl_21_P_vz, p: _inl_21_P_p, bx: _inl_21_P_bx, by: _inl_21_P_by, bz: _inl_21_P_bz }, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
            const _inl_21_cp_U0_x = _sroa_14.U0.x;
            const _inl_21_cp_U0_y = _sroa_14.U0.y;
            const _inl_21_cp_U0_z = _sroa_14.U0.z;
            const _inl_21_cp_U0_w = _sroa_14.U0.w;
            const _inl_21_cp_U1_x = _sroa_14.U1.x;
            const _inl_21_cp_U1_y = _sroa_14.U1.y;
            const _inl_21_cp_U1_z = _sroa_14.U1.z;
            const _inl_21_cp_U1_w = _sroa_14.U1.w;
            _inl_21_result_0_x = _inl_21_cp_U0_x;
            _inl_21_result_0_y = _inl_21_cp_U0_y;
            _inl_21_result_0_z = _inl_21_cp_U0_z;
            _inl_21_result_0_w = _inl_21_cp_U0_w;
            _inl_21_result_1_x = _inl_21_cp_U1_x;
            _inl_21_result_1_y = _inl_21_cp_U1_y;
            _inl_21_result_1_z = _inl_21_cp_U1_z;
            _inl_21_result_1_w = _inl_21_cp_U1_w;
            break _inl_21;
        }
        const cons_0_x = _inl_21_result_0_x;
        const cons_0_y = _inl_21_result_0_y;
        const cons_0_z = _inl_21_result_0_z;
        const cons_0_w = _inl_21_result_0_w;
        const cons_1_x = _inl_21_result_1_x;
        const cons_1_y = _inl_21_result_1_y;
        const cons_1_z = _inl_21_result_1_z;
        const cons_1_w = _inl_21_result_1_w;
        {
            const _wbase = ((dst) * 4 + 0);
            const _wt0 = cons_0_x;
            const _wt1 = cons_0_y;
            const _wt2 = cons_0_z;
            const _wt3 = cons_0_w;
            bindings.U0[_wbase + 0] = _wt0;
            bindings.U0[_wbase + 1] = _wt1;
            bindings.U0[_wbase + 2] = _wt2;
            bindings.U0[_wbase + 3] = _wt3;
        }
        {
            const _wbase = ((dst) * 4 + 0);
            const _wt0 = cons_1_x;
            const _wt1 = cons_1_y;
            const _wt2 = cons_1_z;
            const _wt3 = cons_1_w;
            bindings.U1[_wbase + 0] = _wt0;
            bindings.U1[_wbase + 1] = _wt1;
            bindings.U1[_wbase + 2] = _wt2;
            bindings.U1[_wbase + 3] = _wt3;
        }
    }

    function fill_bx_face(ix, iy, ghost, n_interior, n_total) {
        const in_h_ghost = (((ix < ghost)) || ((ix > (ghost + n_interior))));
        const on_w_wall = ((ix == ghost));
        const on_e_wall = ((ix == (ghost + n_interior)));
        const in_v_ghost = (((iy < ghost)) || ((iy >= (ghost + n_interior))));
        if (((((!in_h_ghost) && (!on_w_wall)) && (!on_e_wall)) && (!in_v_ghost))) {
            return;
        }
        const h_mode = horiz_mode_for_col(ix, ghost, n_interior);
        const v_mode = vert_mode_for_row(iy, ghost, n_interior);
        const h_edge = ((ix <= ghost) ? EDGE_W_BC : EDGE_E_BC);
        const v_edge = ((iy < ghost) ? EDGE_S_BC : EDGE_N_BC);
        let mode = 0;
        let owner_edge = 0;
        if (on_w_wall) {
            mode = 1;
            owner_edge = EDGE_W_BC;
        } else if (on_e_wall) {
            mode = 1;
            owner_edge = EDGE_E_BC;
        } else if ((in_h_ghost && in_v_ghost)) {
            let _inl_22_result;
            _inl_22: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_22_result = h_mode;
                    break _inl_22;
                }
                _inl_22_result = v_mode;
                break _inl_22;
            }
            mode = _inl_22_result;
            owner_edge = ((h_mode != BC_PERIODIC) ? h_edge : v_edge);
        } else if (in_h_ghost) {
            mode = h_mode;
            owner_edge = h_edge;
        } else {
            mode = v_mode;
            owner_edge = v_edge;
        }
        let _inl_23_result;
        _inl_23: {
            _inl_23_result = ((iy * ((n_total + 1))) + ix);
            break _inl_23;
        }
        const dst = _inl_23_result;
        if ((mode == BC_PERIODIC)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = (ix + n_interior);
            } else if ((ix > (ghost + n_interior))) {
                src_i = (ix - n_interior);
            }
            const on_wall = (on_w_wall || on_e_wall);
            if ((iy < ghost)) {
                if ((on_wall && (v_mode != BC_PERIODIC))) {
                    src_j = ghost;
                } else {
                    src_j = (iy + n_interior);
                }
            } else if ((iy >= (ghost + n_interior))) {
                if ((on_wall && (v_mode != BC_PERIODIC))) {
                    src_j = ((ghost + n_interior) - 1);
                } else {
                    src_j = (iy - n_interior);
                }
            }
            if (on_wall) {
                src_i = ghost;
            }
            let _inl_24_result;
            _inl_24: {
                _inl_24_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_24;
            }
            bindings.Bx_face[dst] = bindings.Bx_face[_inl_24_result];
            return;
        }
        if ((mode == BC_OUTFLOW)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                if ((h_mode == BC_PERIODIC)) {
                    src_i = (ix + n_interior);
                } else {
                    src_i = ghost;
                }
            } else if ((ix > (ghost + n_interior))) {
                if ((h_mode == BC_PERIODIC)) {
                    src_i = (ix - n_interior);
                } else {
                    src_i = (ghost + n_interior);
                }
            }
            if ((iy < ghost)) {
                if ((v_mode == BC_PERIODIC)) {
                    src_j = (iy + n_interior);
                } else {
                    src_j = ghost;
                }
            } else if ((iy >= (ghost + n_interior))) {
                if ((v_mode == BC_PERIODIC)) {
                    src_j = (iy - n_interior);
                } else {
                    src_j = ((ghost + n_interior) - 1);
                }
            }
            let _inl_25_result;
            _inl_25: {
                _inl_25_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_25;
            }
            bindings.Bx_face[dst] = bindings.Bx_face[_inl_25_result];
            return;
        }
        if ((mode == BC_REFLECTING)) {
            if ((on_w_wall || on_e_wall)) {
                bindings.Bx_face[dst] = 0.0;
                return;
            }
            let src_i = ix;
            let src_j = iy;
            let flip = false;
            if ((ix < ghost)) {
                src_i = ((2 * ghost) - ix);
                flip = true;
            } else if ((ix > (ghost + n_interior))) {
                src_i = ((2 * ((ghost + n_interior))) - ix);
                flip = true;
            }
            if ((iy < ghost)) {
                src_j = (((2 * ghost) - 1) - iy);
            } else if ((iy >= (ghost + n_interior))) {
                src_j = (((2 * ((ghost + n_interior))) - 1) - iy);
            }
            let _inl_26_result;
            _inl_26: {
                _inl_26_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_26;
            }
            let v = bindings.Bx_face[_inl_26_result];
            if (flip) {
                v = (-v);
            }
            bindings.Bx_face[dst] = v;
            return;
        }
        let _inl_27_result;
        _inl_27: {
            _inl_27_result = driven_prim_for_edge(owner_edge).bx;
            break _inl_27;
        }
        bindings.Bx_face[dst] = _inl_27_result;
    }

    function fill_by_face(ix, iy, ghost, n_interior, n_total) {
        const in_v_ghost = (((iy < ghost)) || ((iy > (ghost + n_interior))));
        const on_s_wall = ((iy == ghost));
        const on_n_wall = ((iy == (ghost + n_interior)));
        const in_h_ghost = (((ix < ghost)) || ((ix >= (ghost + n_interior))));
        if (((((!in_v_ghost) && (!on_s_wall)) && (!on_n_wall)) && (!in_h_ghost))) {
            return;
        }
        const h_mode = horiz_mode_for_col(ix, ghost, n_interior);
        const v_mode = vert_mode_for_row(iy, ghost, n_interior);
        const h_edge = ((ix < ghost) ? EDGE_W_BC : EDGE_E_BC);
        const v_edge = ((iy <= ghost) ? EDGE_S_BC : EDGE_N_BC);
        let mode = 0;
        let owner_edge = 0;
        if (on_s_wall) {
            mode = 1;
            owner_edge = EDGE_S_BC;
        } else if (on_n_wall) {
            mode = 1;
            owner_edge = EDGE_N_BC;
        } else if ((in_h_ghost && in_v_ghost)) {
            let _inl_28_result;
            _inl_28: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_28_result = h_mode;
                    break _inl_28;
                }
                _inl_28_result = v_mode;
                break _inl_28;
            }
            mode = _inl_28_result;
            owner_edge = ((h_mode != BC_PERIODIC) ? h_edge : v_edge);
        } else if (in_v_ghost) {
            mode = v_mode;
            owner_edge = v_edge;
        } else {
            mode = h_mode;
            owner_edge = h_edge;
        }
        let _inl_29_result;
        _inl_29: {
            _inl_29_result = ((iy * n_total) + ix);
            break _inl_29;
        }
        const dst = _inl_29_result;
        if ((mode == BC_PERIODIC)) {
            let src_i = ix;
            let src_j = iy;
            if ((iy < ghost)) {
                src_j = (iy + n_interior);
            } else if ((iy > (ghost + n_interior))) {
                src_j = (iy - n_interior);
            }
            const on_wall = (on_s_wall || on_n_wall);
            if ((ix < ghost)) {
                if ((on_wall && (h_mode != BC_PERIODIC))) {
                    src_i = ghost;
                } else {
                    src_i = (ix + n_interior);
                }
            } else if ((ix >= (ghost + n_interior))) {
                if ((on_wall && (h_mode != BC_PERIODIC))) {
                    src_i = ((ghost + n_interior) - 1);
                } else {
                    src_i = (ix - n_interior);
                }
            }
            if (on_wall) {
                src_j = ghost;
            }
            let _inl_30_result;
            _inl_30: {
                _inl_30_result = ((src_j * n_total) + src_i);
                break _inl_30;
            }
            bindings.By_face[dst] = bindings.By_face[_inl_30_result];
            return;
        }
        if ((mode == BC_OUTFLOW)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                if ((h_mode == BC_PERIODIC)) {
                    src_i = (ix + n_interior);
                } else {
                    src_i = ghost;
                }
            } else if ((ix >= (ghost + n_interior))) {
                if ((h_mode == BC_PERIODIC)) {
                    src_i = (ix - n_interior);
                } else {
                    src_i = ((ghost + n_interior) - 1);
                }
            }
            if ((iy < ghost)) {
                if ((v_mode == BC_PERIODIC)) {
                    src_j = (iy + n_interior);
                } else {
                    src_j = ghost;
                }
            } else if ((iy > (ghost + n_interior))) {
                if ((v_mode == BC_PERIODIC)) {
                    src_j = (iy - n_interior);
                } else {
                    src_j = (ghost + n_interior);
                }
            }
            let _inl_31_result;
            _inl_31: {
                _inl_31_result = ((src_j * n_total) + src_i);
                break _inl_31;
            }
            bindings.By_face[dst] = bindings.By_face[_inl_31_result];
            return;
        }
        if ((mode == BC_REFLECTING)) {
            if ((on_s_wall || on_n_wall)) {
                bindings.By_face[dst] = 0.0;
                return;
            }
            let src_i = ix;
            let src_j = iy;
            let flip = false;
            if ((iy < ghost)) {
                src_j = ((2 * ghost) - iy);
                flip = true;
            } else if ((iy > (ghost + n_interior))) {
                src_j = ((2 * ((ghost + n_interior))) - iy);
                flip = true;
            }
            if ((ix < ghost)) {
                src_i = (((2 * ghost) - 1) - ix);
            } else if ((ix >= (ghost + n_interior))) {
                src_i = (((2 * ((ghost + n_interior))) - 1) - ix);
            }
            let _inl_32_result;
            _inl_32: {
                _inl_32_result = ((src_j * n_total) + src_i);
                break _inl_32;
            }
            let v = bindings.By_face[_inl_32_result];
            if (flip) {
                v = (-v);
            }
            bindings.By_face[dst] = v;
            return;
        }
        let _inl_33_result;
        _inl_33: {
            _inl_33_result = driven_prim_for_edge(owner_edge).by;
            break _inl_33;
        }
        bindings.By_face[dst] = _inl_33_result;
    }

    const entry = Object.create(null);
    const entryInfo = Object.create(null);

    entryInfo["main"] = {"workgroupSize":[8,8,1],"phases":1,"globalLoop":true,"workgroupMemory":false,"flatWorkgroupArrays":0,"optimizedWorkgroupReductionInits":0};
    function __entry_0_main(workgroups, bindings, domain, origin) {
        const Wx = 129, Wy = 129, Wz = 1;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
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
                {
                    const n_total = 1028;
                    const n_interior = 1024;
                    const ghost = 2;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < n_total) && (iy < n_total))) {
                        fill_cell_ghost(ix, iy, ghost, n_interior, n_total);
                    }
                    if (((ix < (n_total + 1)) && (iy < n_total))) {
                        fill_bx_face(ix, iy, ghost, n_interior, n_total);
                    }
                    if (((ix < n_total) && (iy < (n_total + 1)))) {
                        fill_by_face(ix, iy, ghost, n_interior, n_total);
                    }
                }
            }
        } else if (Gz === 1) {
            if (Ox === 0 && Oy === 0) {
                for (let __gy = 0, __rowBase = 0; __gy < Gy; __gy++, __rowBase += Gx) {
                    for (let __gx = 0; __gx < Gx; __gx++) {
                        const gid_x = __gx;
                        const gid_y = __gy;
                        {
                            const n_total = 1028;
                            const n_interior = 1024;
                            const ghost = 2;
                            const ix = gid_x;
                            const iy = gid_y;
                            if (((ix < n_total) && (iy < n_total))) {
                                fill_cell_ghost(ix, iy, ghost, n_interior, n_total);
                            }
                            if (((ix < (n_total + 1)) && (iy < n_total))) {
                                fill_bx_face(ix, iy, ghost, n_interior, n_total);
                            }
                            if (((ix < n_total) && (iy < (n_total + 1)))) {
                                fill_by_face(ix, iy, ghost, n_interior, n_total);
                            }
                        }
                    }
                }
            } else {
                for (let __gy = Oy; __gy < Yn; __gy++)
                for (let __gx = Ox; __gx < Xn; __gx++) {
                    const gid_x = __gx;
                    const gid_y = __gy;
                    {
                        const n_total = 1028;
                        const n_interior = 1024;
                        const ghost = 2;
                        const ix = gid_x;
                        const iy = gid_y;
                        if (((ix < n_total) && (iy < n_total))) {
                            fill_cell_ghost(ix, iy, ghost, n_interior, n_total);
                        }
                        if (((ix < (n_total + 1)) && (iy < n_total))) {
                            fill_bx_face(ix, iy, ghost, n_interior, n_total);
                        }
                        if (((ix < n_total) && (iy < (n_total + 1)))) {
                            fill_by_face(ix, iy, ghost, n_interior, n_total);
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
                {
                    const n_total = 1028;
                    const n_interior = 1024;
                    const ghost = 2;
                    const ix = gid_x;
                    const iy = gid_y;
                    if (((ix < n_total) && (iy < n_total))) {
                        fill_cell_ghost(ix, iy, ghost, n_interior, n_total);
                    }
                    if (((ix < (n_total + 1)) && (iy < n_total))) {
                        fill_bx_face(ix, iy, ghost, n_interior, n_total);
                    }
                    if (((ix < n_total) && (iy < (n_total + 1)))) {
                        fill_by_face(ix, iy, ghost, n_interior, n_total);
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

    return { entry, bind, bindings: ["U_uniforms","bc","U0","U1","Bx_face","By_face"], entryInfo };
}
