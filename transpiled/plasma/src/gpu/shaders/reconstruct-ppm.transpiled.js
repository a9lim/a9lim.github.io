// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/reconstruct-ppm.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 2a9b5771497aa43da49ae518b291b9b56a10a9b405b7f6a826176e19a395e3c2
// generated: 2026-05-25T23:32:29.821Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

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
        const ke = ((0.5 * P_rho) * ((((P_vx * P_vx) + (P_vy * P_vy)) + (P_vz * P_vz))));
        const mb = (0.5 * ((((P_bx * P_bx) + (P_by * P_by)) + (P_bz * P_bz))));
        P_p = (((((gamma - 1.0)) * (((U1_x - ke) - mb)))) < (p_floor) ? (p_floor) : ((((gamma - 1.0)) * (((U1_x - ke) - mb)))));
        return { rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz };
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
        const af_prime = ((0.5 * S.alpha_f) / ((S.w * S.sqrtd)));
        const as_prime = ((0.5 * S.alpha_s) / ((S.w * S.sqrtd)));
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
        const af = ((S.w * S.alpha_f) * S.sqrtd);
        const as_ = ((S.w * S.alpha_s) * S.sqrtd);
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
            return rt.vec2(0.0, 0.0);
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
        return rt.vec2(dL, dR);
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
        let out_L = null;
        let out_R = null;
        out_L = { fL: r0_x, aL: r1_x, sL: r2_x, e: r3_x, sR: r4_x, aR: r5_x, fR: r6_x };
        out_R = { fL: r0_y, aL: r1_y, sL: r2_y, e: r3_y, sR: r4_y, aR: r5_y, fR: r6_y };
        return { L: out_L, R: out_R };
    }

    function primitive_safety_net(w_left_raw, w_right_raw, w_c, w_m1, w_p1) {
        let L_rho = 0;
        let L_vn = 0;
        let L_vt1 = 0;
        let L_vt2 = 0;
        let L_bt1 = 0;
        let L_bt2 = 0;
        let L_p = 0;
        L_rho = rt.clampScalar(w_left_raw.rho, ((w_m1.rho) < (w_c.rho) ? (w_m1.rho) : (w_c.rho)), ((w_c.rho) < (w_m1.rho) ? (w_m1.rho) : (w_c.rho)));
        L_vn = rt.clampScalar(w_left_raw.vn, ((w_m1.vn) < (w_c.vn) ? (w_m1.vn) : (w_c.vn)), ((w_c.vn) < (w_m1.vn) ? (w_m1.vn) : (w_c.vn)));
        L_vt1 = rt.clampScalar(w_left_raw.vt1, ((w_m1.vt1) < (w_c.vt1) ? (w_m1.vt1) : (w_c.vt1)), ((w_c.vt1) < (w_m1.vt1) ? (w_m1.vt1) : (w_c.vt1)));
        L_vt2 = rt.clampScalar(w_left_raw.vt2, ((w_m1.vt2) < (w_c.vt2) ? (w_m1.vt2) : (w_c.vt2)), ((w_c.vt2) < (w_m1.vt2) ? (w_m1.vt2) : (w_c.vt2)));
        L_bt1 = rt.clampScalar(w_left_raw.bt1, ((w_m1.bt1) < (w_c.bt1) ? (w_m1.bt1) : (w_c.bt1)), ((w_c.bt1) < (w_m1.bt1) ? (w_m1.bt1) : (w_c.bt1)));
        L_bt2 = rt.clampScalar(w_left_raw.bt2, ((w_m1.bt2) < (w_c.bt2) ? (w_m1.bt2) : (w_c.bt2)), ((w_c.bt2) < (w_m1.bt2) ? (w_m1.bt2) : (w_c.bt2)));
        L_p = rt.clampScalar(w_left_raw.p, ((w_m1.p) < (w_c.p) ? (w_m1.p) : (w_c.p)), ((w_c.p) < (w_m1.p) ? (w_m1.p) : (w_c.p)));
        let R_rho = 0;
        let R_vn = 0;
        let R_vt1 = 0;
        let R_vt2 = 0;
        let R_bt1 = 0;
        let R_bt2 = 0;
        let R_p = 0;
        R_rho = rt.clampScalar(w_right_raw.rho, ((w_p1.rho) < (w_c.rho) ? (w_p1.rho) : (w_c.rho)), ((w_c.rho) < (w_p1.rho) ? (w_p1.rho) : (w_c.rho)));
        R_vn = rt.clampScalar(w_right_raw.vn, ((w_p1.vn) < (w_c.vn) ? (w_p1.vn) : (w_c.vn)), ((w_c.vn) < (w_p1.vn) ? (w_p1.vn) : (w_c.vn)));
        R_vt1 = rt.clampScalar(w_right_raw.vt1, ((w_p1.vt1) < (w_c.vt1) ? (w_p1.vt1) : (w_c.vt1)), ((w_c.vt1) < (w_p1.vt1) ? (w_p1.vt1) : (w_c.vt1)));
        R_vt2 = rt.clampScalar(w_right_raw.vt2, ((w_p1.vt2) < (w_c.vt2) ? (w_p1.vt2) : (w_c.vt2)), ((w_c.vt2) < (w_p1.vt2) ? (w_p1.vt2) : (w_c.vt2)));
        R_bt1 = rt.clampScalar(w_right_raw.bt1, ((w_p1.bt1) < (w_c.bt1) ? (w_p1.bt1) : (w_c.bt1)), ((w_c.bt1) < (w_p1.bt1) ? (w_p1.bt1) : (w_c.bt1)));
        R_bt2 = rt.clampScalar(w_right_raw.bt2, ((w_p1.bt2) < (w_c.bt2) ? (w_p1.bt2) : (w_c.bt2)), ((w_c.bt2) < (w_p1.bt2) ? (w_p1.bt2) : (w_c.bt2)));
        R_p = rt.clampScalar(w_right_raw.p, ((w_p1.p) < (w_c.p) ? (w_p1.p) : (w_c.p)), ((w_c.p) < (w_p1.p) ? (w_p1.p) : (w_c.p)));
        const _sroa_7 = ppm_limit_delta((w_c.rho - L_rho), (R_rho - w_c.rho));
        const r_rho_x = _sroa_7.x;
        const r_rho_y = _sroa_7.y;
        const _sroa_8 = ppm_limit_delta((w_c.vn - L_vn), (R_vn - w_c.vn));
        const r_vn_x = _sroa_8.x;
        const r_vn_y = _sroa_8.y;
        const _sroa_9 = ppm_limit_delta((w_c.vt1 - L_vt1), (R_vt1 - w_c.vt1));
        const r_vt1_x = _sroa_9.x;
        const r_vt1_y = _sroa_9.y;
        const _sroa_10 = ppm_limit_delta((w_c.vt2 - L_vt2), (R_vt2 - w_c.vt2));
        const r_vt2_x = _sroa_10.x;
        const r_vt2_y = _sroa_10.y;
        const _sroa_11 = ppm_limit_delta((w_c.bt1 - L_bt1), (R_bt1 - w_c.bt1));
        const r_bt1_x = _sroa_11.x;
        const r_bt1_y = _sroa_11.y;
        const _sroa_12 = ppm_limit_delta((w_c.bt2 - L_bt2), (R_bt2 - w_c.bt2));
        const r_bt2_x = _sroa_12.x;
        const r_bt2_y = _sroa_12.y;
        const _sroa_13 = ppm_limit_delta((w_c.p - L_p), (R_p - w_c.p));
        const r_p_x = _sroa_13.x;
        const r_p_y = _sroa_13.y;
        let out_L = null;
        let out_R = null;
        out_L = { rho: (w_c.rho - r_rho_x), vn: (w_c.vn - r_vn_x), vt1: (w_c.vt1 - r_vt1_x), vt2: (w_c.vt2 - r_vt2_x), bt1: (w_c.bt1 - r_bt1_x), bt2: (w_c.bt2 - r_bt2_x), p: (w_c.p - r_p_x) };
        out_R = { rho: (w_c.rho + r_rho_y), vn: (w_c.vn + r_vn_y), vt1: (w_c.vt1 + r_vt1_y), vt2: (w_c.vt2 + r_vt2_y), bt1: (w_c.bt1 + r_bt1_y), bt2: (w_c.bt2 + r_bt2_y), p: (w_c.p + r_p_y) };
        return { L: out_L, R: out_R };
    }

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_gamma = _b_U_uniforms.gamma;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const _u_U_uniforms_pressure_floor = _b_U_uniforms.pressure_floor;
        const _b_U0_in = bindings.U0_in;
        const _b_U1_in = bindings.U1_in;
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_edge_l_0 = bindings.edge_l_0;
        const _b_edge_l_1 = bindings.edge_l_1;
        const _b_edge_r_0 = bindings.edge_r_0;
        const _b_edge_r_1 = bindings.edge_r_1;
        const _b_sweep = bindings.sweep;
        const _u_sweep_sweep_dir = _b_sweep.sweep_dir;
        const wg = Object.create(null);
        for (let wgz = 0; wgz < Wz; wgz++)
        for (let wgy = 0; wgy < Wy; wgy++)
        for (let wgx = 0; wgx < Wx; wgx++) {
            wg.tile = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => ({ rho: 0, vx: 0, vy: 0, vz: 0, p: 0, bx: 0, by: 0, bz: 0 })));
            // Phase 0
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
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
                    const axis = _u_sweep_sweep_dir;
                    const g = _u_U_uniforms_gamma;
                    const pf = _u_U_uniforms_pressure_floor;
                    const nt_max = (rt.i32(n_total) - 1);
                    const gx = ((rt.i32(gid_x) + rt.i32(ghost)) - 1);
                    const gy = ((rt.i32(gid_y) + rt.i32(ghost)) - 1);
                    const lx = rt.i32(lid_x);
                    const ly = rt.i32(lid_y);
                    const cx = rt.u32(rt.clampScalar(gx, 0, nt_max));
                    const cy = rt.u32(rt.clampScalar(gy, 0, nt_max));
                    let _inl_9_result;
                    _inl_9: {
                        let _inl_9__inl_4_result;
                        _inl_9__inl_4: {
                            _inl_9__inl_4_result = ((cy * n_total) + cx);
                            break _inl_9__inl_4;
                        }
                        const _inl_9_idx = _inl_9__inl_4_result;
                        let _inl_9__inl_5_result;
                        _inl_9__inl_5: {
                            let _inl_9__inl_5__inl_0_result;
                            _inl_9__inl_5__inl_0: {
                                _inl_9__inl_5__inl_0_result = ((cy * ((n_total + 1))) + cx);
                                break _inl_9__inl_5__inl_0;
                            }
                            _inl_9__inl_5_result = _inl_9__inl_5__inl_0_result;
                            break _inl_9__inl_5;
                        }
                        let _inl_9__inl_6_result;
                        _inl_9__inl_6: {
                            const _inl_9__inl_6__inl_1_ix = (cx + 1);
                            let _inl_9__inl_6__inl_1_result;
                            _inl_9__inl_6__inl_1: {
                                _inl_9__inl_6__inl_1_result = ((cy * ((n_total + 1))) + _inl_9__inl_6__inl_1_ix);
                                break _inl_9__inl_6__inl_1;
                            }
                            _inl_9__inl_6_result = _inl_9__inl_6__inl_1_result;
                            break _inl_9__inl_6;
                        }
                        const _inl_9_bx = (0.5 * ((_b_Bx_face[_inl_9__inl_5_result] + _b_Bx_face[_inl_9__inl_6_result])));
                        let _inl_9__inl_7_result;
                        _inl_9__inl_7: {
                            let _inl_9__inl_7__inl_2_result;
                            _inl_9__inl_7__inl_2: {
                                _inl_9__inl_7__inl_2_result = ((cy * n_total) + cx);
                                break _inl_9__inl_7__inl_2;
                            }
                            _inl_9__inl_7_result = _inl_9__inl_7__inl_2_result;
                            break _inl_9__inl_7;
                        }
                        let _inl_9__inl_8_result;
                        _inl_9__inl_8: {
                            const _inl_9__inl_8__inl_3_iy = (cy + 1);
                            let _inl_9__inl_8__inl_3_result;
                            _inl_9__inl_8__inl_3: {
                                _inl_9__inl_8__inl_3_result = ((_inl_9__inl_8__inl_3_iy * n_total) + cx);
                                break _inl_9__inl_8__inl_3;
                            }
                            _inl_9__inl_8_result = _inl_9__inl_8__inl_3_result;
                            break _inl_9__inl_8;
                        }
                        const _inl_9_by = (0.5 * ((_b_By_face[_inl_9__inl_7_result] + _b_By_face[_inl_9__inl_8_result])));
                        _inl_9_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_9_idx) * 4 + 0) + 0], _b_U0_in[((_inl_9_idx) * 4 + 0) + 1], _b_U0_in[((_inl_9_idx) * 4 + 0) + 2], _b_U0_in[((_inl_9_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_9_idx) * 4 + 0) + 0], _b_U1_in[((_inl_9_idx) * 4 + 0) + 1], _b_U1_in[((_inl_9_idx) * 4 + 0) + 2], _b_U1_in[((_inl_9_idx) * 4 + 0) + 3]), _inl_9_bx, _inl_9_by, g, pf);
                        break _inl_9;
                    }
                    wg.tile[(ly + 2)][(lx + 2)] = _inl_9_result;
                    if ((lid_x < 2)) {
                        const sx = rt.u32(rt.clampScalar((gx - 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar(gy, 0, nt_max));
                        let _inl_10_result;
                        _inl_10: {
                            let _inl_10__inl_4_result;
                            _inl_10__inl_4: {
                                _inl_10__inl_4_result = ((sy * n_total) + sx);
                                break _inl_10__inl_4;
                            }
                            const _inl_10_idx = _inl_10__inl_4_result;
                            let _inl_10__inl_5_result;
                            _inl_10__inl_5: {
                                let _inl_10__inl_5__inl_0_result;
                                _inl_10__inl_5__inl_0: {
                                    _inl_10__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_10__inl_5__inl_0;
                                }
                                _inl_10__inl_5_result = _inl_10__inl_5__inl_0_result;
                                break _inl_10__inl_5;
                            }
                            let _inl_10__inl_6_result;
                            _inl_10__inl_6: {
                                const _inl_10__inl_6__inl_1_ix = (sx + 1);
                                let _inl_10__inl_6__inl_1_result;
                                _inl_10__inl_6__inl_1: {
                                    _inl_10__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_10__inl_6__inl_1_ix);
                                    break _inl_10__inl_6__inl_1;
                                }
                                _inl_10__inl_6_result = _inl_10__inl_6__inl_1_result;
                                break _inl_10__inl_6;
                            }
                            const _inl_10_bx = (0.5 * ((_b_Bx_face[_inl_10__inl_5_result] + _b_Bx_face[_inl_10__inl_6_result])));
                            let _inl_10__inl_7_result;
                            _inl_10__inl_7: {
                                let _inl_10__inl_7__inl_2_result;
                                _inl_10__inl_7__inl_2: {
                                    _inl_10__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_10__inl_7__inl_2;
                                }
                                _inl_10__inl_7_result = _inl_10__inl_7__inl_2_result;
                                break _inl_10__inl_7;
                            }
                            let _inl_10__inl_8_result;
                            _inl_10__inl_8: {
                                const _inl_10__inl_8__inl_3_iy = (sy + 1);
                                let _inl_10__inl_8__inl_3_result;
                                _inl_10__inl_8__inl_3: {
                                    _inl_10__inl_8__inl_3_result = ((_inl_10__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_10__inl_8__inl_3;
                                }
                                _inl_10__inl_8_result = _inl_10__inl_8__inl_3_result;
                                break _inl_10__inl_8;
                            }
                            const _inl_10_by = (0.5 * ((_b_By_face[_inl_10__inl_7_result] + _b_By_face[_inl_10__inl_8_result])));
                            _inl_10_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_10_idx) * 4 + 0) + 0], _b_U0_in[((_inl_10_idx) * 4 + 0) + 1], _b_U0_in[((_inl_10_idx) * 4 + 0) + 2], _b_U0_in[((_inl_10_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_10_idx) * 4 + 0) + 0], _b_U1_in[((_inl_10_idx) * 4 + 0) + 1], _b_U1_in[((_inl_10_idx) * 4 + 0) + 2], _b_U1_in[((_inl_10_idx) * 4 + 0) + 3]), _inl_10_bx, _inl_10_by, g, pf);
                            break _inl_10;
                        }
                        wg.tile[(ly + 2)][lx] = _inl_10_result;
                    }
                    if ((lid_x >= 6)) {
                        const sx = rt.u32(rt.clampScalar((gx + 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar(gy, 0, nt_max));
                        let _inl_11_result;
                        _inl_11: {
                            let _inl_11__inl_4_result;
                            _inl_11__inl_4: {
                                _inl_11__inl_4_result = ((sy * n_total) + sx);
                                break _inl_11__inl_4;
                            }
                            const _inl_11_idx = _inl_11__inl_4_result;
                            let _inl_11__inl_5_result;
                            _inl_11__inl_5: {
                                let _inl_11__inl_5__inl_0_result;
                                _inl_11__inl_5__inl_0: {
                                    _inl_11__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_11__inl_5__inl_0;
                                }
                                _inl_11__inl_5_result = _inl_11__inl_5__inl_0_result;
                                break _inl_11__inl_5;
                            }
                            let _inl_11__inl_6_result;
                            _inl_11__inl_6: {
                                const _inl_11__inl_6__inl_1_ix = (sx + 1);
                                let _inl_11__inl_6__inl_1_result;
                                _inl_11__inl_6__inl_1: {
                                    _inl_11__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_11__inl_6__inl_1_ix);
                                    break _inl_11__inl_6__inl_1;
                                }
                                _inl_11__inl_6_result = _inl_11__inl_6__inl_1_result;
                                break _inl_11__inl_6;
                            }
                            const _inl_11_bx = (0.5 * ((_b_Bx_face[_inl_11__inl_5_result] + _b_Bx_face[_inl_11__inl_6_result])));
                            let _inl_11__inl_7_result;
                            _inl_11__inl_7: {
                                let _inl_11__inl_7__inl_2_result;
                                _inl_11__inl_7__inl_2: {
                                    _inl_11__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_11__inl_7__inl_2;
                                }
                                _inl_11__inl_7_result = _inl_11__inl_7__inl_2_result;
                                break _inl_11__inl_7;
                            }
                            let _inl_11__inl_8_result;
                            _inl_11__inl_8: {
                                const _inl_11__inl_8__inl_3_iy = (sy + 1);
                                let _inl_11__inl_8__inl_3_result;
                                _inl_11__inl_8__inl_3: {
                                    _inl_11__inl_8__inl_3_result = ((_inl_11__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_11__inl_8__inl_3;
                                }
                                _inl_11__inl_8_result = _inl_11__inl_8__inl_3_result;
                                break _inl_11__inl_8;
                            }
                            const _inl_11_by = (0.5 * ((_b_By_face[_inl_11__inl_7_result] + _b_By_face[_inl_11__inl_8_result])));
                            _inl_11_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_11_idx) * 4 + 0) + 0], _b_U0_in[((_inl_11_idx) * 4 + 0) + 1], _b_U0_in[((_inl_11_idx) * 4 + 0) + 2], _b_U0_in[((_inl_11_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_11_idx) * 4 + 0) + 0], _b_U1_in[((_inl_11_idx) * 4 + 0) + 1], _b_U1_in[((_inl_11_idx) * 4 + 0) + 2], _b_U1_in[((_inl_11_idx) * 4 + 0) + 3]), _inl_11_bx, _inl_11_by, g, pf);
                            break _inl_11;
                        }
                        wg.tile[(ly + 2)][(lx + 4)] = _inl_11_result;
                    }
                    if ((lid_y < 2)) {
                        const sx = rt.u32(rt.clampScalar(gx, 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy - 2), 0, nt_max));
                        let _inl_12_result;
                        _inl_12: {
                            let _inl_12__inl_4_result;
                            _inl_12__inl_4: {
                                _inl_12__inl_4_result = ((sy * n_total) + sx);
                                break _inl_12__inl_4;
                            }
                            const _inl_12_idx = _inl_12__inl_4_result;
                            let _inl_12__inl_5_result;
                            _inl_12__inl_5: {
                                let _inl_12__inl_5__inl_0_result;
                                _inl_12__inl_5__inl_0: {
                                    _inl_12__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_12__inl_5__inl_0;
                                }
                                _inl_12__inl_5_result = _inl_12__inl_5__inl_0_result;
                                break _inl_12__inl_5;
                            }
                            let _inl_12__inl_6_result;
                            _inl_12__inl_6: {
                                const _inl_12__inl_6__inl_1_ix = (sx + 1);
                                let _inl_12__inl_6__inl_1_result;
                                _inl_12__inl_6__inl_1: {
                                    _inl_12__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_12__inl_6__inl_1_ix);
                                    break _inl_12__inl_6__inl_1;
                                }
                                _inl_12__inl_6_result = _inl_12__inl_6__inl_1_result;
                                break _inl_12__inl_6;
                            }
                            const _inl_12_bx = (0.5 * ((_b_Bx_face[_inl_12__inl_5_result] + _b_Bx_face[_inl_12__inl_6_result])));
                            let _inl_12__inl_7_result;
                            _inl_12__inl_7: {
                                let _inl_12__inl_7__inl_2_result;
                                _inl_12__inl_7__inl_2: {
                                    _inl_12__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_12__inl_7__inl_2;
                                }
                                _inl_12__inl_7_result = _inl_12__inl_7__inl_2_result;
                                break _inl_12__inl_7;
                            }
                            let _inl_12__inl_8_result;
                            _inl_12__inl_8: {
                                const _inl_12__inl_8__inl_3_iy = (sy + 1);
                                let _inl_12__inl_8__inl_3_result;
                                _inl_12__inl_8__inl_3: {
                                    _inl_12__inl_8__inl_3_result = ((_inl_12__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_12__inl_8__inl_3;
                                }
                                _inl_12__inl_8_result = _inl_12__inl_8__inl_3_result;
                                break _inl_12__inl_8;
                            }
                            const _inl_12_by = (0.5 * ((_b_By_face[_inl_12__inl_7_result] + _b_By_face[_inl_12__inl_8_result])));
                            _inl_12_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_12_idx) * 4 + 0) + 0], _b_U0_in[((_inl_12_idx) * 4 + 0) + 1], _b_U0_in[((_inl_12_idx) * 4 + 0) + 2], _b_U0_in[((_inl_12_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_12_idx) * 4 + 0) + 0], _b_U1_in[((_inl_12_idx) * 4 + 0) + 1], _b_U1_in[((_inl_12_idx) * 4 + 0) + 2], _b_U1_in[((_inl_12_idx) * 4 + 0) + 3]), _inl_12_bx, _inl_12_by, g, pf);
                            break _inl_12;
                        }
                        wg.tile[ly][(lx + 2)] = _inl_12_result;
                    }
                    if ((lid_y >= 6)) {
                        const sx = rt.u32(rt.clampScalar(gx, 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy + 2), 0, nt_max));
                        let _inl_13_result;
                        _inl_13: {
                            let _inl_13__inl_4_result;
                            _inl_13__inl_4: {
                                _inl_13__inl_4_result = ((sy * n_total) + sx);
                                break _inl_13__inl_4;
                            }
                            const _inl_13_idx = _inl_13__inl_4_result;
                            let _inl_13__inl_5_result;
                            _inl_13__inl_5: {
                                let _inl_13__inl_5__inl_0_result;
                                _inl_13__inl_5__inl_0: {
                                    _inl_13__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_13__inl_5__inl_0;
                                }
                                _inl_13__inl_5_result = _inl_13__inl_5__inl_0_result;
                                break _inl_13__inl_5;
                            }
                            let _inl_13__inl_6_result;
                            _inl_13__inl_6: {
                                const _inl_13__inl_6__inl_1_ix = (sx + 1);
                                let _inl_13__inl_6__inl_1_result;
                                _inl_13__inl_6__inl_1: {
                                    _inl_13__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_13__inl_6__inl_1_ix);
                                    break _inl_13__inl_6__inl_1;
                                }
                                _inl_13__inl_6_result = _inl_13__inl_6__inl_1_result;
                                break _inl_13__inl_6;
                            }
                            const _inl_13_bx = (0.5 * ((_b_Bx_face[_inl_13__inl_5_result] + _b_Bx_face[_inl_13__inl_6_result])));
                            let _inl_13__inl_7_result;
                            _inl_13__inl_7: {
                                let _inl_13__inl_7__inl_2_result;
                                _inl_13__inl_7__inl_2: {
                                    _inl_13__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_13__inl_7__inl_2;
                                }
                                _inl_13__inl_7_result = _inl_13__inl_7__inl_2_result;
                                break _inl_13__inl_7;
                            }
                            let _inl_13__inl_8_result;
                            _inl_13__inl_8: {
                                const _inl_13__inl_8__inl_3_iy = (sy + 1);
                                let _inl_13__inl_8__inl_3_result;
                                _inl_13__inl_8__inl_3: {
                                    _inl_13__inl_8__inl_3_result = ((_inl_13__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_13__inl_8__inl_3;
                                }
                                _inl_13__inl_8_result = _inl_13__inl_8__inl_3_result;
                                break _inl_13__inl_8;
                            }
                            const _inl_13_by = (0.5 * ((_b_By_face[_inl_13__inl_7_result] + _b_By_face[_inl_13__inl_8_result])));
                            _inl_13_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_13_idx) * 4 + 0) + 0], _b_U0_in[((_inl_13_idx) * 4 + 0) + 1], _b_U0_in[((_inl_13_idx) * 4 + 0) + 2], _b_U0_in[((_inl_13_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_13_idx) * 4 + 0) + 0], _b_U1_in[((_inl_13_idx) * 4 + 0) + 1], _b_U1_in[((_inl_13_idx) * 4 + 0) + 2], _b_U1_in[((_inl_13_idx) * 4 + 0) + 3]), _inl_13_bx, _inl_13_by, g, pf);
                            break _inl_13;
                        }
                        wg.tile[(ly + 4)][(lx + 2)] = _inl_13_result;
                    }
                    if (((lid_x < 2) && (lid_y < 2))) {
                        const sx = rt.u32(rt.clampScalar((gx - 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy - 2), 0, nt_max));
                        let _inl_14_result;
                        _inl_14: {
                            let _inl_14__inl_4_result;
                            _inl_14__inl_4: {
                                _inl_14__inl_4_result = ((sy * n_total) + sx);
                                break _inl_14__inl_4;
                            }
                            const _inl_14_idx = _inl_14__inl_4_result;
                            let _inl_14__inl_5_result;
                            _inl_14__inl_5: {
                                let _inl_14__inl_5__inl_0_result;
                                _inl_14__inl_5__inl_0: {
                                    _inl_14__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_14__inl_5__inl_0;
                                }
                                _inl_14__inl_5_result = _inl_14__inl_5__inl_0_result;
                                break _inl_14__inl_5;
                            }
                            let _inl_14__inl_6_result;
                            _inl_14__inl_6: {
                                const _inl_14__inl_6__inl_1_ix = (sx + 1);
                                let _inl_14__inl_6__inl_1_result;
                                _inl_14__inl_6__inl_1: {
                                    _inl_14__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_14__inl_6__inl_1_ix);
                                    break _inl_14__inl_6__inl_1;
                                }
                                _inl_14__inl_6_result = _inl_14__inl_6__inl_1_result;
                                break _inl_14__inl_6;
                            }
                            const _inl_14_bx = (0.5 * ((_b_Bx_face[_inl_14__inl_5_result] + _b_Bx_face[_inl_14__inl_6_result])));
                            let _inl_14__inl_7_result;
                            _inl_14__inl_7: {
                                let _inl_14__inl_7__inl_2_result;
                                _inl_14__inl_7__inl_2: {
                                    _inl_14__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_14__inl_7__inl_2;
                                }
                                _inl_14__inl_7_result = _inl_14__inl_7__inl_2_result;
                                break _inl_14__inl_7;
                            }
                            let _inl_14__inl_8_result;
                            _inl_14__inl_8: {
                                const _inl_14__inl_8__inl_3_iy = (sy + 1);
                                let _inl_14__inl_8__inl_3_result;
                                _inl_14__inl_8__inl_3: {
                                    _inl_14__inl_8__inl_3_result = ((_inl_14__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_14__inl_8__inl_3;
                                }
                                _inl_14__inl_8_result = _inl_14__inl_8__inl_3_result;
                                break _inl_14__inl_8;
                            }
                            const _inl_14_by = (0.5 * ((_b_By_face[_inl_14__inl_7_result] + _b_By_face[_inl_14__inl_8_result])));
                            _inl_14_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_14_idx) * 4 + 0) + 0], _b_U0_in[((_inl_14_idx) * 4 + 0) + 1], _b_U0_in[((_inl_14_idx) * 4 + 0) + 2], _b_U0_in[((_inl_14_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_14_idx) * 4 + 0) + 0], _b_U1_in[((_inl_14_idx) * 4 + 0) + 1], _b_U1_in[((_inl_14_idx) * 4 + 0) + 2], _b_U1_in[((_inl_14_idx) * 4 + 0) + 3]), _inl_14_bx, _inl_14_by, g, pf);
                            break _inl_14;
                        }
                        wg.tile[ly][lx] = _inl_14_result;
                    }
                    if (((lid_x >= 6) && (lid_y < 2))) {
                        const sx = rt.u32(rt.clampScalar((gx + 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy - 2), 0, nt_max));
                        let _inl_15_result;
                        _inl_15: {
                            let _inl_15__inl_4_result;
                            _inl_15__inl_4: {
                                _inl_15__inl_4_result = ((sy * n_total) + sx);
                                break _inl_15__inl_4;
                            }
                            const _inl_15_idx = _inl_15__inl_4_result;
                            let _inl_15__inl_5_result;
                            _inl_15__inl_5: {
                                let _inl_15__inl_5__inl_0_result;
                                _inl_15__inl_5__inl_0: {
                                    _inl_15__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_15__inl_5__inl_0;
                                }
                                _inl_15__inl_5_result = _inl_15__inl_5__inl_0_result;
                                break _inl_15__inl_5;
                            }
                            let _inl_15__inl_6_result;
                            _inl_15__inl_6: {
                                const _inl_15__inl_6__inl_1_ix = (sx + 1);
                                let _inl_15__inl_6__inl_1_result;
                                _inl_15__inl_6__inl_1: {
                                    _inl_15__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_15__inl_6__inl_1_ix);
                                    break _inl_15__inl_6__inl_1;
                                }
                                _inl_15__inl_6_result = _inl_15__inl_6__inl_1_result;
                                break _inl_15__inl_6;
                            }
                            const _inl_15_bx = (0.5 * ((_b_Bx_face[_inl_15__inl_5_result] + _b_Bx_face[_inl_15__inl_6_result])));
                            let _inl_15__inl_7_result;
                            _inl_15__inl_7: {
                                let _inl_15__inl_7__inl_2_result;
                                _inl_15__inl_7__inl_2: {
                                    _inl_15__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_15__inl_7__inl_2;
                                }
                                _inl_15__inl_7_result = _inl_15__inl_7__inl_2_result;
                                break _inl_15__inl_7;
                            }
                            let _inl_15__inl_8_result;
                            _inl_15__inl_8: {
                                const _inl_15__inl_8__inl_3_iy = (sy + 1);
                                let _inl_15__inl_8__inl_3_result;
                                _inl_15__inl_8__inl_3: {
                                    _inl_15__inl_8__inl_3_result = ((_inl_15__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_15__inl_8__inl_3;
                                }
                                _inl_15__inl_8_result = _inl_15__inl_8__inl_3_result;
                                break _inl_15__inl_8;
                            }
                            const _inl_15_by = (0.5 * ((_b_By_face[_inl_15__inl_7_result] + _b_By_face[_inl_15__inl_8_result])));
                            _inl_15_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_15_idx) * 4 + 0) + 0], _b_U0_in[((_inl_15_idx) * 4 + 0) + 1], _b_U0_in[((_inl_15_idx) * 4 + 0) + 2], _b_U0_in[((_inl_15_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_15_idx) * 4 + 0) + 0], _b_U1_in[((_inl_15_idx) * 4 + 0) + 1], _b_U1_in[((_inl_15_idx) * 4 + 0) + 2], _b_U1_in[((_inl_15_idx) * 4 + 0) + 3]), _inl_15_bx, _inl_15_by, g, pf);
                            break _inl_15;
                        }
                        wg.tile[ly][(lx + 4)] = _inl_15_result;
                    }
                    if (((lid_x < 2) && (lid_y >= 6))) {
                        const sx = rt.u32(rt.clampScalar((gx - 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy + 2), 0, nt_max));
                        let _inl_16_result;
                        _inl_16: {
                            let _inl_16__inl_4_result;
                            _inl_16__inl_4: {
                                _inl_16__inl_4_result = ((sy * n_total) + sx);
                                break _inl_16__inl_4;
                            }
                            const _inl_16_idx = _inl_16__inl_4_result;
                            let _inl_16__inl_5_result;
                            _inl_16__inl_5: {
                                let _inl_16__inl_5__inl_0_result;
                                _inl_16__inl_5__inl_0: {
                                    _inl_16__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_16__inl_5__inl_0;
                                }
                                _inl_16__inl_5_result = _inl_16__inl_5__inl_0_result;
                                break _inl_16__inl_5;
                            }
                            let _inl_16__inl_6_result;
                            _inl_16__inl_6: {
                                const _inl_16__inl_6__inl_1_ix = (sx + 1);
                                let _inl_16__inl_6__inl_1_result;
                                _inl_16__inl_6__inl_1: {
                                    _inl_16__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_16__inl_6__inl_1_ix);
                                    break _inl_16__inl_6__inl_1;
                                }
                                _inl_16__inl_6_result = _inl_16__inl_6__inl_1_result;
                                break _inl_16__inl_6;
                            }
                            const _inl_16_bx = (0.5 * ((_b_Bx_face[_inl_16__inl_5_result] + _b_Bx_face[_inl_16__inl_6_result])));
                            let _inl_16__inl_7_result;
                            _inl_16__inl_7: {
                                let _inl_16__inl_7__inl_2_result;
                                _inl_16__inl_7__inl_2: {
                                    _inl_16__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_16__inl_7__inl_2;
                                }
                                _inl_16__inl_7_result = _inl_16__inl_7__inl_2_result;
                                break _inl_16__inl_7;
                            }
                            let _inl_16__inl_8_result;
                            _inl_16__inl_8: {
                                const _inl_16__inl_8__inl_3_iy = (sy + 1);
                                let _inl_16__inl_8__inl_3_result;
                                _inl_16__inl_8__inl_3: {
                                    _inl_16__inl_8__inl_3_result = ((_inl_16__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_16__inl_8__inl_3;
                                }
                                _inl_16__inl_8_result = _inl_16__inl_8__inl_3_result;
                                break _inl_16__inl_8;
                            }
                            const _inl_16_by = (0.5 * ((_b_By_face[_inl_16__inl_7_result] + _b_By_face[_inl_16__inl_8_result])));
                            _inl_16_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_16_idx) * 4 + 0) + 0], _b_U0_in[((_inl_16_idx) * 4 + 0) + 1], _b_U0_in[((_inl_16_idx) * 4 + 0) + 2], _b_U0_in[((_inl_16_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_16_idx) * 4 + 0) + 0], _b_U1_in[((_inl_16_idx) * 4 + 0) + 1], _b_U1_in[((_inl_16_idx) * 4 + 0) + 2], _b_U1_in[((_inl_16_idx) * 4 + 0) + 3]), _inl_16_bx, _inl_16_by, g, pf);
                            break _inl_16;
                        }
                        wg.tile[(ly + 4)][lx] = _inl_16_result;
                    }
                    if (((lid_x >= 6) && (lid_y >= 6))) {
                        const sx = rt.u32(rt.clampScalar((gx + 2), 0, nt_max));
                        const sy = rt.u32(rt.clampScalar((gy + 2), 0, nt_max));
                        let _inl_17_result;
                        _inl_17: {
                            let _inl_17__inl_4_result;
                            _inl_17__inl_4: {
                                _inl_17__inl_4_result = ((sy * n_total) + sx);
                                break _inl_17__inl_4;
                            }
                            const _inl_17_idx = _inl_17__inl_4_result;
                            let _inl_17__inl_5_result;
                            _inl_17__inl_5: {
                                let _inl_17__inl_5__inl_0_result;
                                _inl_17__inl_5__inl_0: {
                                    _inl_17__inl_5__inl_0_result = ((sy * ((n_total + 1))) + sx);
                                    break _inl_17__inl_5__inl_0;
                                }
                                _inl_17__inl_5_result = _inl_17__inl_5__inl_0_result;
                                break _inl_17__inl_5;
                            }
                            let _inl_17__inl_6_result;
                            _inl_17__inl_6: {
                                const _inl_17__inl_6__inl_1_ix = (sx + 1);
                                let _inl_17__inl_6__inl_1_result;
                                _inl_17__inl_6__inl_1: {
                                    _inl_17__inl_6__inl_1_result = ((sy * ((n_total + 1))) + _inl_17__inl_6__inl_1_ix);
                                    break _inl_17__inl_6__inl_1;
                                }
                                _inl_17__inl_6_result = _inl_17__inl_6__inl_1_result;
                                break _inl_17__inl_6;
                            }
                            const _inl_17_bx = (0.5 * ((_b_Bx_face[_inl_17__inl_5_result] + _b_Bx_face[_inl_17__inl_6_result])));
                            let _inl_17__inl_7_result;
                            _inl_17__inl_7: {
                                let _inl_17__inl_7__inl_2_result;
                                _inl_17__inl_7__inl_2: {
                                    _inl_17__inl_7__inl_2_result = ((sy * n_total) + sx);
                                    break _inl_17__inl_7__inl_2;
                                }
                                _inl_17__inl_7_result = _inl_17__inl_7__inl_2_result;
                                break _inl_17__inl_7;
                            }
                            let _inl_17__inl_8_result;
                            _inl_17__inl_8: {
                                const _inl_17__inl_8__inl_3_iy = (sy + 1);
                                let _inl_17__inl_8__inl_3_result;
                                _inl_17__inl_8__inl_3: {
                                    _inl_17__inl_8__inl_3_result = ((_inl_17__inl_8__inl_3_iy * n_total) + sx);
                                    break _inl_17__inl_8__inl_3;
                                }
                                _inl_17__inl_8_result = _inl_17__inl_8__inl_3_result;
                                break _inl_17__inl_8;
                            }
                            const _inl_17_by = (0.5 * ((_b_By_face[_inl_17__inl_7_result] + _b_By_face[_inl_17__inl_8_result])));
                            _inl_17_result = cons_to_prim_mhd(rt.vec4(_b_U0_in[((_inl_17_idx) * 4 + 0) + 0], _b_U0_in[((_inl_17_idx) * 4 + 0) + 1], _b_U0_in[((_inl_17_idx) * 4 + 0) + 2], _b_U0_in[((_inl_17_idx) * 4 + 0) + 3]), rt.vec4(_b_U1_in[((_inl_17_idx) * 4 + 0) + 0], _b_U1_in[((_inl_17_idx) * 4 + 0) + 1], _b_U1_in[((_inl_17_idx) * 4 + 0) + 2], _b_U1_in[((_inl_17_idx) * 4 + 0) + 3]), _inl_17_bx, _inl_17_by, g, pf);
                            break _inl_17;
                        }
                        wg.tile[(ly + 4)][(lx + 4)] = _inl_17_result;
                    }
                }
            }
            // Phase 1
            for (let lz = 0; lz < Lz; lz++)
            for (let ly = 0; ly < Ly; ly++)
            for (let lx = 0; lx < Lx; lx++) {
                const gid_x = wgx*Lx + lx;
                const gid_y = wgy*Ly + ly;
                const lid_x = lx;
                const lid_y = ly;
                __invocation: {
                    if ((!in_extent)) {
                        break __invocation;
                    }
                    const ix = rt.u32(gx);
                    const iy = rt.u32(gy);
                    let _inl_18_result;
                    _inl_18: {
                        _inl_18_result = ((iy * n_total) + ix);
                        break _inl_18;
                    }
                    const idx = _inl_18_result;
                    let stencil_ok = true;
                    if ((axis == 0)) {
                        stencil_ok = (((ix >= 2)) && (((ix + 2) < n_total)));
                    } else {
                        stencil_ok = (((iy >= 2)) && (((iy + 2) < n_total)));
                    }
                    const _sroa_14 = wg.tile[(ly + 2)][(lx + 2)];
                    const tc_rho = _sroa_14.rho;
                    const tc_vx = _sroa_14.vx;
                    const tc_vy = _sroa_14.vy;
                    const tc_vz = _sroa_14.vz;
                    const tc_p = _sroa_14.p;
                    const tc_bx = _sroa_14.bx;
                    const tc_by = _sroa_14.by;
                    const tc_bz = _sroa_14.bz;
                    if ((!stencil_ok)) {
                        const _sroa_15 = permute_prim({ rho: tc_rho, vx: tc_vx, vy: tc_vy, vz: tc_vz, p: tc_p, bx: tc_bx, by: tc_by, bz: tc_bz }, axis);
                        const pcL_rho = _sroa_15.rho;
                        const pcL_vn = _sroa_15.vn;
                        const pcL_vt1 = _sroa_15.vt1;
                        const pcL_vt2 = _sroa_15.vt2;
                        const pcL_bt1 = _sroa_15.bt1;
                        const pcL_bt2 = _sroa_15.bt2;
                        const pcL_p = _sroa_15.p;
                        const pcL_bn = _sroa_15.bn;
                        let _inl_19_result;
                        _inl_19: {
                            _inl_19_result = { rho: pcL_rho, vn: pcL_vn, vt1: pcL_vt1, vt2: pcL_vt2, bt1: pcL_bt1, bt2: pcL_bt2, p: pcL_p };
                            break _inl_19;
                        }
                        const _inl_20_bn = pcL_bn;
                        let _inl_20_result;
                        _inl_20: {
                            let _inl_33_R_p0_x = 0;
                            let _inl_33_R_p0_y = 0;
                            let _inl_33_R_p0_z = 0;
                            let _inl_33_R_p0_w = 0;
                            let _inl_33_R_p1_x = 0;
                            let _inl_33_R_p1_y = 0;
                            let _inl_33_R_p1_z = 0;
                            let _inl_33_R_p1_w = 0;
                            if ((axis == 0)) {
                                {
                                    const _wt0 = _inl_19_result.rho;
                                    const _wt1 = _inl_19_result.vn;
                                    const _wt2 = _inl_19_result.vt1;
                                    const _wt3 = _inl_19_result.vt2;
                                    _inl_33_R_p0_x = _wt0;
                                    _inl_33_R_p0_y = _wt1;
                                    _inl_33_R_p0_z = _wt2;
                                    _inl_33_R_p0_w = _wt3;
                                }
                                {
                                    const _wt0 = _inl_19_result.p;
                                    const _wt1 = _inl_19_result.bt1;
                                    const _wt2 = _inl_19_result.bt2;
                                    const _wt3 = 0.0;
                                    _inl_33_R_p1_x = _wt0;
                                    _inl_33_R_p1_y = _wt1;
                                    _inl_33_R_p1_z = _wt2;
                                    _inl_33_R_p1_w = _wt3;
                                }
                            } else {
                                {
                                    const _wt0 = _inl_19_result.rho;
                                    const _wt1 = _inl_19_result.vt2;
                                    const _wt2 = _inl_19_result.vn;
                                    const _wt3 = _inl_19_result.vt1;
                                    _inl_33_R_p0_x = _wt0;
                                    _inl_33_R_p0_y = _wt1;
                                    _inl_33_R_p0_z = _wt2;
                                    _inl_33_R_p0_w = _wt3;
                                }
                                {
                                    const _wt0 = _inl_19_result.p;
                                    const _wt1 = _inl_19_result.bt2;
                                    const _wt2 = _inl_19_result.bt1;
                                    const _wt3 = 0.0;
                                    _inl_33_R_p1_x = _wt0;
                                    _inl_33_R_p1_y = _wt1;
                                    _inl_33_R_p1_z = _wt2;
                                    _inl_33_R_p1_w = _wt3;
                                }
                            }
                            _inl_20_result = { p0: rt.vec4(_inl_33_R_p0_x, _inl_33_R_p0_y, _inl_33_R_p0_z, _inl_33_R_p0_w), p1: rt.vec4(_inl_33_R_p1_x, _inl_33_R_p1_y, _inl_33_R_p1_z, _inl_33_R_p1_w) };
                            break _inl_20;
                        }
                        const _sroa_16 = _inl_20_result;
                        const pp_p0_x = _sroa_16.p0.x;
                        const pp_p0_y = _sroa_16.p0.y;
                        const pp_p0_z = _sroa_16.p0.z;
                        const pp_p0_w = _sroa_16.p0.w;
                        const pp_p1_x = _sroa_16.p1.x;
                        const pp_p1_y = _sroa_16.p1.y;
                        const pp_p1_z = _sroa_16.p1.z;
                        const pp_p1_w = _sroa_16.p1.w;
                        const _sroa_17 = rt.vec4(pp_p0_x, pp_p0_y, pp_p0_z, pp_p0_w);
                        let l0_x = _sroa_17.x;
                        let l0_y = _sroa_17.y;
                        let l0_z = _sroa_17.z;
                        let l0_w = _sroa_17.w;
                        const _sroa_18 = rt.vec4(pp_p0_x, pp_p0_y, pp_p0_z, pp_p0_w);
                        let r0_x = _sroa_18.x;
                        let r0_y = _sroa_18.y;
                        let r0_z = _sroa_18.z;
                        let r0_w = _sroa_18.w;
                        const _sroa_19 = rt.vec4(pp_p1_x, pp_p1_y, pp_p1_z, pp_p1_w);
                        let l1_x = _sroa_19.x;
                        let l1_y = _sroa_19.y;
                        let l1_z = _sroa_19.z;
                        let l1_w = _sroa_19.w;
                        const _sroa_20 = rt.vec4(pp_p1_x, pp_p1_y, pp_p1_z, pp_p1_w);
                        let r1_x = _sroa_20.x;
                        let r1_y = _sroa_20.y;
                        let r1_z = _sroa_20.z;
                        let r1_w = _sroa_20.w;
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
                    if ((axis == 0)) {
                        const _sroa_21 = wg.tile[(ly + 2)][lx];
                        tm2_rho = _sroa_21.rho;
                        tm2_vx = _sroa_21.vx;
                        tm2_vy = _sroa_21.vy;
                        tm2_vz = _sroa_21.vz;
                        tm2_p = _sroa_21.p;
                        tm2_bx = _sroa_21.bx;
                        tm2_by = _sroa_21.by;
                        tm2_bz = _sroa_21.bz;
                        const _sroa_22 = wg.tile[(ly + 2)][(lx + 1)];
                        tm1_rho = _sroa_22.rho;
                        tm1_vx = _sroa_22.vx;
                        tm1_vy = _sroa_22.vy;
                        tm1_vz = _sroa_22.vz;
                        tm1_p = _sroa_22.p;
                        tm1_bx = _sroa_22.bx;
                        tm1_by = _sroa_22.by;
                        tm1_bz = _sroa_22.bz;
                        const _sroa_23 = wg.tile[(ly + 2)][(lx + 3)];
                        tp1_rho = _sroa_23.rho;
                        tp1_vx = _sroa_23.vx;
                        tp1_vy = _sroa_23.vy;
                        tp1_vz = _sroa_23.vz;
                        tp1_p = _sroa_23.p;
                        tp1_bx = _sroa_23.bx;
                        tp1_by = _sroa_23.by;
                        tp1_bz = _sroa_23.bz;
                        const _sroa_24 = wg.tile[(ly + 2)][(lx + 4)];
                        tp2_rho = _sroa_24.rho;
                        tp2_vx = _sroa_24.vx;
                        tp2_vy = _sroa_24.vy;
                        tp2_vz = _sroa_24.vz;
                        tp2_p = _sroa_24.p;
                        tp2_bx = _sroa_24.bx;
                        tp2_by = _sroa_24.by;
                        tp2_bz = _sroa_24.bz;
                    } else {
                        const _sroa_25 = wg.tile[ly][(lx + 2)];
                        tm2_rho = _sroa_25.rho;
                        tm2_vx = _sroa_25.vx;
                        tm2_vy = _sroa_25.vy;
                        tm2_vz = _sroa_25.vz;
                        tm2_p = _sroa_25.p;
                        tm2_bx = _sroa_25.bx;
                        tm2_by = _sroa_25.by;
                        tm2_bz = _sroa_25.bz;
                        const _sroa_26 = wg.tile[(ly + 1)][(lx + 2)];
                        tm1_rho = _sroa_26.rho;
                        tm1_vx = _sroa_26.vx;
                        tm1_vy = _sroa_26.vy;
                        tm1_vz = _sroa_26.vz;
                        tm1_p = _sroa_26.p;
                        tm1_bx = _sroa_26.bx;
                        tm1_by = _sroa_26.by;
                        tm1_bz = _sroa_26.bz;
                        const _sroa_27 = wg.tile[(ly + 3)][(lx + 2)];
                        tp1_rho = _sroa_27.rho;
                        tp1_vx = _sroa_27.vx;
                        tp1_vy = _sroa_27.vy;
                        tp1_vz = _sroa_27.vz;
                        tp1_p = _sroa_27.p;
                        tp1_bx = _sroa_27.bx;
                        tp1_by = _sroa_27.by;
                        tp1_bz = _sroa_27.bz;
                        const _sroa_28 = wg.tile[(ly + 4)][(lx + 2)];
                        tp2_rho = _sroa_28.rho;
                        tp2_vx = _sroa_28.vx;
                        tp2_vy = _sroa_28.vy;
                        tp2_vz = _sroa_28.vz;
                        tp2_p = _sroa_28.p;
                        tp2_bx = _sroa_28.bx;
                        tp2_by = _sroa_28.by;
                        tp2_bz = _sroa_28.bz;
                    }
                    const _sroa_29 = permute_prim({ rho: tc_rho, vx: tc_vx, vy: tc_vy, vz: tc_vz, p: tc_p, bx: tc_bx, by: tc_by, bz: tc_bz }, axis);
                    const perm_c_rho = _sroa_29.rho;
                    const perm_c_vn = _sroa_29.vn;
                    const perm_c_vt1 = _sroa_29.vt1;
                    const perm_c_vt2 = _sroa_29.vt2;
                    const perm_c_bt1 = _sroa_29.bt1;
                    const perm_c_bt2 = _sroa_29.bt2;
                    const perm_c_p = _sroa_29.p;
                    const perm_c_bn = _sroa_29.bn;
                    const _sroa_30 = permute_prim({ rho: tm2_rho, vx: tm2_vx, vy: tm2_vy, vz: tm2_vz, p: tm2_p, bx: tm2_bx, by: tm2_by, bz: tm2_bz }, axis);
                    const perm_m2_rho = _sroa_30.rho;
                    const perm_m2_vn = _sroa_30.vn;
                    const perm_m2_vt1 = _sroa_30.vt1;
                    const perm_m2_vt2 = _sroa_30.vt2;
                    const perm_m2_bt1 = _sroa_30.bt1;
                    const perm_m2_bt2 = _sroa_30.bt2;
                    const perm_m2_p = _sroa_30.p;
                    const perm_m2_bn = _sroa_30.bn;
                    const _sroa_31 = permute_prim({ rho: tm1_rho, vx: tm1_vx, vy: tm1_vy, vz: tm1_vz, p: tm1_p, bx: tm1_bx, by: tm1_by, bz: tm1_bz }, axis);
                    const perm_m1_rho = _sroa_31.rho;
                    const perm_m1_vn = _sroa_31.vn;
                    const perm_m1_vt1 = _sroa_31.vt1;
                    const perm_m1_vt2 = _sroa_31.vt2;
                    const perm_m1_bt1 = _sroa_31.bt1;
                    const perm_m1_bt2 = _sroa_31.bt2;
                    const perm_m1_p = _sroa_31.p;
                    const perm_m1_bn = _sroa_31.bn;
                    const _sroa_32 = permute_prim({ rho: tp1_rho, vx: tp1_vx, vy: tp1_vy, vz: tp1_vz, p: tp1_p, bx: tp1_bx, by: tp1_by, bz: tp1_bz }, axis);
                    const perm_p1_rho = _sroa_32.rho;
                    const perm_p1_vn = _sroa_32.vn;
                    const perm_p1_vt1 = _sroa_32.vt1;
                    const perm_p1_vt2 = _sroa_32.vt2;
                    const perm_p1_bt1 = _sroa_32.bt1;
                    const perm_p1_bt2 = _sroa_32.bt2;
                    const perm_p1_p = _sroa_32.p;
                    const perm_p1_bn = _sroa_32.bn;
                    const _sroa_33 = permute_prim({ rho: tp2_rho, vx: tp2_vx, vy: tp2_vy, vz: tp2_vz, p: tp2_p, bx: tp2_bx, by: tp2_by, bz: tp2_bz }, axis);
                    const perm_p2_rho = _sroa_33.rho;
                    const perm_p2_vn = _sroa_33.vn;
                    const perm_p2_vt1 = _sroa_33.vt1;
                    const perm_p2_vt2 = _sroa_33.vt2;
                    const perm_p2_bt1 = _sroa_33.bt1;
                    const perm_p2_bt2 = _sroa_33.bt2;
                    const perm_p2_p = _sroa_33.p;
                    const perm_p2_bn = _sroa_33.bn;
                    let _inl_21_result;
                    _inl_21: {
                        _inl_21_result = { rho: perm_c_rho, vn: perm_c_vn, vt1: perm_c_vt1, vt2: perm_c_vt2, bt1: perm_c_bt1, bt2: perm_c_bt2, p: perm_c_p };
                        break _inl_21;
                    }
                    const _sroa_34 = _inl_21_result;
                    const w_c_rho = _sroa_34.rho;
                    const w_c_vn = _sroa_34.vn;
                    const w_c_vt1 = _sroa_34.vt1;
                    const w_c_vt2 = _sroa_34.vt2;
                    const w_c_bt1 = _sroa_34.bt1;
                    const w_c_bt2 = _sroa_34.bt2;
                    const w_c_p = _sroa_34.p;
                    let _inl_22_result;
                    _inl_22: {
                        _inl_22_result = { rho: perm_m2_rho, vn: perm_m2_vn, vt1: perm_m2_vt1, vt2: perm_m2_vt2, bt1: perm_m2_bt1, bt2: perm_m2_bt2, p: perm_m2_p };
                        break _inl_22;
                    }
                    const _sroa_35 = _inl_22_result;
                    const w_m2_rho = _sroa_35.rho;
                    const w_m2_vn = _sroa_35.vn;
                    const w_m2_vt1 = _sroa_35.vt1;
                    const w_m2_vt2 = _sroa_35.vt2;
                    const w_m2_bt1 = _sroa_35.bt1;
                    const w_m2_bt2 = _sroa_35.bt2;
                    const w_m2_p = _sroa_35.p;
                    let _inl_23_result;
                    _inl_23: {
                        _inl_23_result = { rho: perm_m1_rho, vn: perm_m1_vn, vt1: perm_m1_vt1, vt2: perm_m1_vt2, bt1: perm_m1_bt1, bt2: perm_m1_bt2, p: perm_m1_p };
                        break _inl_23;
                    }
                    const _sroa_36 = _inl_23_result;
                    const w_m1_rho = _sroa_36.rho;
                    const w_m1_vn = _sroa_36.vn;
                    const w_m1_vt1 = _sroa_36.vt1;
                    const w_m1_vt2 = _sroa_36.vt2;
                    const w_m1_bt1 = _sroa_36.bt1;
                    const w_m1_bt2 = _sroa_36.bt2;
                    const w_m1_p = _sroa_36.p;
                    let _inl_24_result;
                    _inl_24: {
                        _inl_24_result = { rho: perm_p1_rho, vn: perm_p1_vn, vt1: perm_p1_vt1, vt2: perm_p1_vt2, bt1: perm_p1_bt1, bt2: perm_p1_bt2, p: perm_p1_p };
                        break _inl_24;
                    }
                    const _sroa_37 = _inl_24_result;
                    const w_p1_rho = _sroa_37.rho;
                    const w_p1_vn = _sroa_37.vn;
                    const w_p1_vt1 = _sroa_37.vt1;
                    const w_p1_vt2 = _sroa_37.vt2;
                    const w_p1_bt1 = _sroa_37.bt1;
                    const w_p1_bt2 = _sroa_37.bt2;
                    const w_p1_p = _sroa_37.p;
                    let _inl_25_result;
                    _inl_25: {
                        _inl_25_result = { rho: perm_p2_rho, vn: perm_p2_vn, vt1: perm_p2_vt1, vt2: perm_p2_vt2, bt1: perm_p2_bt1, bt2: perm_p2_bt2, p: perm_p2_p };
                        break _inl_25;
                    }
                    const _sroa_38 = _inl_25_result;
                    const w_p2_rho = _sroa_38.rho;
                    const w_p2_vn = _sroa_38.vn;
                    const w_p2_vt1 = _sroa_38.vt1;
                    const w_p2_vt2 = _sroa_38.vt2;
                    const w_p2_bt1 = _sroa_38.bt1;
                    const w_p2_bt2 = _sroa_38.bt2;
                    const w_p2_p = _sroa_38.p;
                    const bn_c = perm_c_bn;
                    const c7 = (7.0 / 12.0);
                    const c1 = (1.0 / 12.0);
                    let _inl_26_result;
                    _inl_26: {
                        _inl_26_result = { rho: ((c7 * ((w_m1_rho + w_c_rho))) - (c1 * ((w_m2_rho + w_p1_rho)))), vn: ((c7 * ((w_m1_vn + w_c_vn))) - (c1 * ((w_m2_vn + w_p1_vn)))), vt1: ((c7 * ((w_m1_vt1 + w_c_vt1))) - (c1 * ((w_m2_vt1 + w_p1_vt1)))), vt2: ((c7 * ((w_m1_vt2 + w_c_vt2))) - (c1 * ((w_m2_vt2 + w_p1_vt2)))), bt1: ((c7 * ((w_m1_bt1 + w_c_bt1))) - (c1 * ((w_m2_bt1 + w_p1_bt1)))), bt2: ((c7 * ((w_m1_bt2 + w_c_bt2))) - (c1 * ((w_m2_bt2 + w_p1_bt2)))), p: ((c7 * ((w_m1_p + w_c_p))) - (c1 * ((w_m2_p + w_p1_p)))) };
                        break _inl_26;
                    }
                    const _sroa_39 = _inl_26_result;
                    const qL_raw_rho = _sroa_39.rho;
                    const qL_raw_vn = _sroa_39.vn;
                    const qL_raw_vt1 = _sroa_39.vt1;
                    const qL_raw_vt2 = _sroa_39.vt2;
                    const qL_raw_bt1 = _sroa_39.bt1;
                    const qL_raw_bt2 = _sroa_39.bt2;
                    const qL_raw_p = _sroa_39.p;
                    let _inl_27_result;
                    _inl_27: {
                        _inl_27_result = { rho: ((c7 * ((w_c_rho + w_p1_rho))) - (c1 * ((w_m1_rho + w_p2_rho)))), vn: ((c7 * ((w_c_vn + w_p1_vn))) - (c1 * ((w_m1_vn + w_p2_vn)))), vt1: ((c7 * ((w_c_vt1 + w_p1_vt1))) - (c1 * ((w_m1_vt1 + w_p2_vt1)))), vt2: ((c7 * ((w_c_vt2 + w_p1_vt2))) - (c1 * ((w_m1_vt2 + w_p2_vt2)))), bt1: ((c7 * ((w_c_bt1 + w_p1_bt1))) - (c1 * ((w_m1_bt1 + w_p2_bt1)))), bt2: ((c7 * ((w_c_bt2 + w_p1_bt2))) - (c1 * ((w_m1_bt2 + w_p2_bt2)))), p: ((c7 * ((w_c_p + w_p1_p))) - (c1 * ((w_m1_p + w_p2_p)))) };
                        break _inl_27;
                    }
                    const _sroa_40 = _inl_27_result;
                    const qR_raw_rho = _sroa_40.rho;
                    const qR_raw_vn = _sroa_40.vn;
                    const qR_raw_vt1 = _sroa_40.vt1;
                    const qR_raw_vt2 = _sroa_40.vt2;
                    const qR_raw_bt1 = _sroa_40.bt1;
                    const qR_raw_bt2 = _sroa_40.bt2;
                    const qR_raw_p = _sroa_40.p;
                    let _inl_28_result;
                    _inl_28: {
                        _inl_28_result = { rho: (w_c_rho - qL_raw_rho), vn: (w_c_vn - qL_raw_vn), vt1: (w_c_vt1 - qL_raw_vt1), vt2: (w_c_vt2 - qL_raw_vt2), bt1: (w_c_bt1 - qL_raw_bt1), bt2: (w_c_bt2 - qL_raw_bt2), p: (w_c_p - qL_raw_p) };
                        break _inl_28;
                    }
                    const _sroa_41 = _inl_28_result;
                    const dL_prim_rho = _sroa_41.rho;
                    const dL_prim_vn = _sroa_41.vn;
                    const dL_prim_vt1 = _sroa_41.vt1;
                    const dL_prim_vt2 = _sroa_41.vt2;
                    const dL_prim_bt1 = _sroa_41.bt1;
                    const dL_prim_bt2 = _sroa_41.bt2;
                    const dL_prim_p = _sroa_41.p;
                    let _inl_29_result;
                    _inl_29: {
                        _inl_29_result = { rho: (qR_raw_rho - w_c_rho), vn: (qR_raw_vn - w_c_vn), vt1: (qR_raw_vt1 - w_c_vt1), vt2: (qR_raw_vt2 - w_c_vt2), bt1: (qR_raw_bt1 - w_c_bt1), bt2: (qR_raw_bt2 - w_c_bt2), p: (qR_raw_p - w_c_p) };
                        break _inl_29;
                    }
                    const _sroa_42 = _inl_29_result;
                    const dR_prim_rho = _sroa_42.rho;
                    const dR_prim_vn = _sroa_42.vn;
                    const dR_prim_vt1 = _sroa_42.vt1;
                    const dR_prim_vt2 = _sroa_42.vt2;
                    const dR_prim_bt1 = _sroa_42.bt1;
                    const dR_prim_bt2 = _sroa_42.bt2;
                    const dR_prim_p = _sroa_42.p;
                    const _sroa_43 = mhd_eigensystem({ rho: w_c_rho, vn: w_c_vn, vt1: w_c_vt1, vt2: w_c_vt2, bt1: w_c_bt1, bt2: w_c_bt2, p: w_c_p }, bn_c, g);
                    const eig_asq = _sroa_43.asq;
                    const eig_a = _sroa_43.a;
                    const eig_cfsq = _sroa_43.cfsq;
                    const eig_cf = _sroa_43.cf;
                    const eig_cssq = _sroa_43.cssq;
                    const eig_cs = _sroa_43.cs;
                    const eig_alpha_f = _sroa_43.alpha_f;
                    const eig_alpha_s = _sroa_43.alpha_s;
                    const eig_bet1 = _sroa_43.bet1;
                    const eig_bet2 = _sroa_43.bet2;
                    const eig_sgn_bn = _sroa_43.sgn_bn;
                    const eig_sqrtd = _sroa_43.sqrtd;
                    const eig_isqrtd = _sroa_43.isqrtd;
                    const eig_inv_rho = _sroa_43.inv_rho;
                    const _sroa_44 = project_to_char({ rho: dL_prim_rho, vn: dL_prim_vn, vt1: dL_prim_vt1, vt2: dL_prim_vt2, bt1: dL_prim_bt1, bt2: dL_prim_bt2, p: dL_prim_p }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                    const aL_fL = _sroa_44.fL;
                    const aL_aL = _sroa_44.aL;
                    const aL_sL = _sroa_44.sL;
                    const aL_e = _sroa_44.e;
                    const aL_sR = _sroa_44.sR;
                    const aL_aR = _sroa_44.aR;
                    const aL_fR = _sroa_44.fR;
                    const _sroa_45 = project_to_char({ rho: dR_prim_rho, vn: dR_prim_vn, vt1: dR_prim_vt1, vt2: dR_prim_vt2, bt1: dR_prim_bt1, bt2: dR_prim_bt2, p: dR_prim_p }, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                    const aR_fL = _sroa_45.fL;
                    const aR_aL = _sroa_45.aL;
                    const aR_sL = _sroa_45.sL;
                    const aR_e = _sroa_45.e;
                    const aR_sR = _sroa_45.sR;
                    const aR_aR = _sroa_45.aR;
                    const aR_fR = _sroa_45.fR;
                    const _sroa_46 = ppm_limit_char({ fL: aL_fL, aL: aL_aL, sL: aL_sL, e: aL_e, sR: aL_sR, aR: aL_aR, fR: aL_fR }, { fL: aR_fL, aL: aR_aL, sL: aR_sL, e: aR_e, sR: aR_sR, aR: aR_aR, fR: aR_fR });
                    const lim_L = _sroa_46.L;
                    const lim_R = _sroa_46.R;
                    const _sroa_47 = project_from_char(lim_L, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                    const dL_lim_rho = _sroa_47.rho;
                    const dL_lim_vn = _sroa_47.vn;
                    const dL_lim_vt1 = _sroa_47.vt1;
                    const dL_lim_vt2 = _sroa_47.vt2;
                    const dL_lim_bt1 = _sroa_47.bt1;
                    const dL_lim_bt2 = _sroa_47.bt2;
                    const dL_lim_p = _sroa_47.p;
                    const _sroa_48 = project_from_char(lim_R, { asq: eig_asq, a: eig_a, cfsq: eig_cfsq, cf: eig_cf, cssq: eig_cssq, cs: eig_cs, alpha_f: eig_alpha_f, alpha_s: eig_alpha_s, bet1: eig_bet1, bet2: eig_bet2, sgn_bn: eig_sgn_bn, sqrtd: eig_sqrtd, isqrtd: eig_isqrtd, inv_rho: eig_inv_rho });
                    const dR_lim_rho = _sroa_48.rho;
                    const dR_lim_vn = _sroa_48.vn;
                    const dR_lim_vt1 = _sroa_48.vt1;
                    const dR_lim_vt2 = _sroa_48.vt2;
                    const dR_lim_bt1 = _sroa_48.bt1;
                    const dR_lim_bt2 = _sroa_48.bt2;
                    const dR_lim_p = _sroa_48.p;
                    let _inl_30_result;
                    _inl_30: {
                        _inl_30_result = { rho: (w_c_rho - dL_lim_rho), vn: (w_c_vn - dL_lim_vn), vt1: (w_c_vt1 - dL_lim_vt1), vt2: (w_c_vt2 - dL_lim_vt2), bt1: (w_c_bt1 - dL_lim_bt1), bt2: (w_c_bt2 - dL_lim_bt2), p: (w_c_p - dL_lim_p) };
                        break _inl_30;
                    }
                    const _sroa_49 = _inl_30_result;
                    const w_left_raw_rho = _sroa_49.rho;
                    const w_left_raw_vn = _sroa_49.vn;
                    const w_left_raw_vt1 = _sroa_49.vt1;
                    const w_left_raw_vt2 = _sroa_49.vt2;
                    const w_left_raw_bt1 = _sroa_49.bt1;
                    const w_left_raw_bt2 = _sroa_49.bt2;
                    const w_left_raw_p = _sroa_49.p;
                    let _inl_31_result;
                    _inl_31: {
                        _inl_31_result = { rho: (w_c_rho + dR_lim_rho), vn: (w_c_vn + dR_lim_vn), vt1: (w_c_vt1 + dR_lim_vt1), vt2: (w_c_vt2 + dR_lim_vt2), bt1: (w_c_bt1 + dR_lim_bt1), bt2: (w_c_bt2 + dR_lim_bt2), p: (w_c_p + dR_lim_p) };
                        break _inl_31;
                    }
                    const _sroa_50 = _inl_31_result;
                    const w_right_raw_rho = _sroa_50.rho;
                    const w_right_raw_vn = _sroa_50.vn;
                    const w_right_raw_vt1 = _sroa_50.vt1;
                    const w_right_raw_vt2 = _sroa_50.vt2;
                    const w_right_raw_bt1 = _sroa_50.bt1;
                    const w_right_raw_bt2 = _sroa_50.bt2;
                    const w_right_raw_p = _sroa_50.p;
                    const _sroa_51 = primitive_safety_net({ rho: w_left_raw_rho, vn: w_left_raw_vn, vt1: w_left_raw_vt1, vt2: w_left_raw_vt2, bt1: w_left_raw_bt1, bt2: w_left_raw_bt2, p: w_left_raw_p }, { rho: w_right_raw_rho, vn: w_right_raw_vn, vt1: w_right_raw_vt1, vt2: w_right_raw_vt2, bt1: w_right_raw_bt1, bt2: w_right_raw_bt2, p: w_right_raw_p }, { rho: w_c_rho, vn: w_c_vn, vt1: w_c_vt1, vt2: w_c_vt2, bt1: w_c_bt1, bt2: w_c_bt2, p: w_c_p }, { rho: w_m1_rho, vn: w_m1_vn, vt1: w_m1_vt1, vt2: w_m1_vt2, bt1: w_m1_bt1, bt2: w_m1_bt2, p: w_m1_p }, { rho: w_p1_rho, vn: w_p1_vn, vt1: w_p1_vt1, vt2: w_p1_vt2, bt1: w_p1_bt1, bt2: w_p1_bt2, p: w_p1_p });
                    const safe_L = _sroa_51.L;
                    const safe_R = _sroa_51.R;
                    const _sroa_52 = safe_L;
                    const w_left_rho = _sroa_52.rho;
                    const w_left_vn = _sroa_52.vn;
                    const w_left_vt1 = _sroa_52.vt1;
                    const w_left_vt2 = _sroa_52.vt2;
                    const w_left_bt1 = _sroa_52.bt1;
                    const w_left_bt2 = _sroa_52.bt2;
                    const w_left_p = _sroa_52.p;
                    const _sroa_53 = safe_R;
                    const w_right_rho = _sroa_53.rho;
                    const w_right_vn = _sroa_53.vn;
                    const w_right_vt1 = _sroa_53.vt1;
                    const w_right_vt2 = _sroa_53.vt2;
                    const w_right_bt1 = _sroa_53.bt1;
                    const w_right_bt2 = _sroa_53.bt2;
                    const w_right_p = _sroa_53.p;
                    let _inl_32_result;
                    _inl_32: {
                        let _inl_33_R_p0_x = 0;
                        let _inl_33_R_p0_y = 0;
                        let _inl_33_R_p0_z = 0;
                        let _inl_33_R_p0_w = 0;
                        let _inl_33_R_p1_x = 0;
                        let _inl_33_R_p1_y = 0;
                        let _inl_33_R_p1_z = 0;
                        let _inl_33_R_p1_w = 0;
                        if ((axis == 0)) {
                            {
                                const _wt0 = w_left_rho;
                                const _wt1 = w_left_vn;
                                const _wt2 = w_left_vt1;
                                const _wt3 = w_left_vt2;
                                _inl_33_R_p0_x = _wt0;
                                _inl_33_R_p0_y = _wt1;
                                _inl_33_R_p0_z = _wt2;
                                _inl_33_R_p0_w = _wt3;
                            }
                            {
                                const _wt0 = w_left_p;
                                const _wt1 = w_left_bt1;
                                const _wt2 = w_left_bt2;
                                const _wt3 = 0.0;
                                _inl_33_R_p1_x = _wt0;
                                _inl_33_R_p1_y = _wt1;
                                _inl_33_R_p1_z = _wt2;
                                _inl_33_R_p1_w = _wt3;
                            }
                        } else {
                            {
                                const _wt0 = w_left_rho;
                                const _wt1 = w_left_vt2;
                                const _wt2 = w_left_vn;
                                const _wt3 = w_left_vt1;
                                _inl_33_R_p0_x = _wt0;
                                _inl_33_R_p0_y = _wt1;
                                _inl_33_R_p0_z = _wt2;
                                _inl_33_R_p0_w = _wt3;
                            }
                            {
                                const _wt0 = w_left_p;
                                const _wt1 = w_left_bt2;
                                const _wt2 = w_left_bt1;
                                const _wt3 = 0.0;
                                _inl_33_R_p1_x = _wt0;
                                _inl_33_R_p1_y = _wt1;
                                _inl_33_R_p1_z = _wt2;
                                _inl_33_R_p1_w = _wt3;
                            }
                        }
                        _inl_32_result = { p0: rt.vec4(_inl_33_R_p0_x, _inl_33_R_p0_y, _inl_33_R_p0_z, _inl_33_R_p0_w), p1: rt.vec4(_inl_33_R_p1_x, _inl_33_R_p1_y, _inl_33_R_p1_z, _inl_33_R_p1_w) };
                        break _inl_32;
                    }
                    const _sroa_54 = _inl_32_result;
                    const pp_L_p0_x = _sroa_54.p0.x;
                    const pp_L_p0_y = _sroa_54.p0.y;
                    const pp_L_p0_z = _sroa_54.p0.z;
                    const pp_L_p0_w = _sroa_54.p0.w;
                    const pp_L_p1_x = _sroa_54.p1.x;
                    const pp_L_p1_y = _sroa_54.p1.y;
                    const pp_L_p1_z = _sroa_54.p1.z;
                    const pp_L_p1_w = _sroa_54.p1.w;
                    let _inl_33_result;
                    _inl_33: {
                        let _inl_33_R_p0_x = 0;
                        let _inl_33_R_p0_y = 0;
                        let _inl_33_R_p0_z = 0;
                        let _inl_33_R_p0_w = 0;
                        let _inl_33_R_p1_x = 0;
                        let _inl_33_R_p1_y = 0;
                        let _inl_33_R_p1_z = 0;
                        let _inl_33_R_p1_w = 0;
                        if ((axis == 0)) {
                            {
                                const _wt0 = w_right_rho;
                                const _wt1 = w_right_vn;
                                const _wt2 = w_right_vt1;
                                const _wt3 = w_right_vt2;
                                _inl_33_R_p0_x = _wt0;
                                _inl_33_R_p0_y = _wt1;
                                _inl_33_R_p0_z = _wt2;
                                _inl_33_R_p0_w = _wt3;
                            }
                            {
                                const _wt0 = w_right_p;
                                const _wt1 = w_right_bt1;
                                const _wt2 = w_right_bt2;
                                const _wt3 = 0.0;
                                _inl_33_R_p1_x = _wt0;
                                _inl_33_R_p1_y = _wt1;
                                _inl_33_R_p1_z = _wt2;
                                _inl_33_R_p1_w = _wt3;
                            }
                        } else {
                            {
                                const _wt0 = w_right_rho;
                                const _wt1 = w_right_vt2;
                                const _wt2 = w_right_vn;
                                const _wt3 = w_right_vt1;
                                _inl_33_R_p0_x = _wt0;
                                _inl_33_R_p0_y = _wt1;
                                _inl_33_R_p0_z = _wt2;
                                _inl_33_R_p0_w = _wt3;
                            }
                            {
                                const _wt0 = w_right_p;
                                const _wt1 = w_right_bt2;
                                const _wt2 = w_right_bt1;
                                const _wt3 = 0.0;
                                _inl_33_R_p1_x = _wt0;
                                _inl_33_R_p1_y = _wt1;
                                _inl_33_R_p1_z = _wt2;
                                _inl_33_R_p1_w = _wt3;
                            }
                        }
                        _inl_33_result = { p0: rt.vec4(_inl_33_R_p0_x, _inl_33_R_p0_y, _inl_33_R_p0_z, _inl_33_R_p0_w), p1: rt.vec4(_inl_33_R_p1_x, _inl_33_R_p1_y, _inl_33_R_p1_z, _inl_33_R_p1_w) };
                        break _inl_33;
                    }
                    const _sroa_55 = _inl_33_result;
                    const pp_R_p0_x = _sroa_55.p0.x;
                    const pp_R_p0_y = _sroa_55.p0.y;
                    const pp_R_p0_z = _sroa_55.p0.z;
                    const pp_R_p0_w = _sroa_55.p0.w;
                    const pp_R_p1_x = _sroa_55.p1.x;
                    const pp_R_p1_y = _sroa_55.p1.y;
                    const pp_R_p1_z = _sroa_55.p1.z;
                    const pp_R_p1_w = _sroa_55.p1.w;
                    const _sroa_56 = rt.vec4(pp_L_p0_x, pp_L_p0_y, pp_L_p0_z, pp_L_p0_w);
                    let l0_x = _sroa_56.x;
                    let l0_y = _sroa_56.y;
                    let l0_z = _sroa_56.z;
                    let l0_w = _sroa_56.w;
                    const _sroa_57 = rt.vec4(pp_R_p0_x, pp_R_p0_y, pp_R_p0_z, pp_R_p0_w);
                    let r0_x = _sroa_57.x;
                    let r0_y = _sroa_57.y;
                    let r0_z = _sroa_57.z;
                    let r0_w = _sroa_57.w;
                    const _sroa_58 = rt.vec4(pp_L_p1_x, pp_L_p1_y, pp_L_p1_z, pp_L_p1_w);
                    let l1_x = _sroa_58.x;
                    let l1_y = _sroa_58.y;
                    let l1_z = _sroa_58.z;
                    let l1_w = _sroa_58.w;
                    const _sroa_59 = rt.vec4(pp_R_p1_x, pp_R_p1_y, pp_R_p1_z, pp_R_p1_w);
                    let r1_x = _sroa_59.x;
                    let r1_y = _sroa_59.y;
                    let r1_z = _sroa_59.z;
                    let r1_w = _sroa_59.w;
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
    };

    return { entry, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","edge_l_0","edge_l_1","edge_r_0","edge_r_1","sweep"] };
}
