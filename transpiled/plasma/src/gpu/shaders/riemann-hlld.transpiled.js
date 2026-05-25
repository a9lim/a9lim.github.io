// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/riemann-hlld.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 75c0aba68ba4648d12f5ad63c300d8d612a15993795e7318296cb244bb851d8f
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.679Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;
    const HLLD_BX_EPS2 = 1.0e-10;
    const HLLD_WS_TOL = 1.0e-8;

    function fast_mag_speed(P, gamma, axis, p_floor) {
        const rho = ((P.rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (P.rho));
        const p = ((P.p) < (p_floor) ? (p_floor) : (P.p));
        const cs2 = ((gamma * p) / rho);
        const b2 = (((P.bx * P.bx) + (P.by * P.by)) + (P.bz * P.bz));
        const ca2 = (b2 / rho);
        let can2 = 0;
        if ((axis == 0)) {
            can2 = ((P.bx * P.bx) / rho);
        } else {
            can2 = ((P.by * P.by) / rho);
        }
        const sum = (cs2 + ca2);
        const disc = ((((sum * sum) - ((4.0 * cs2) * can2))) < (0.0) ? (0.0) : (((sum * sum) - ((4.0 * cs2) * can2))));
        const cf2 = (0.5 * ((sum + Math.sqrt(disc))));
        return Math.sqrt(((cf2) < (0.0) ? (0.0) : (cf2)));
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
        {
            const _wt0 = E;
            const _wt1 = P.bz;
            const _wt2 = 0.0;
            const _wt3 = 0.0;
            R_U1_x = _wt0;
            R_U1_y = _wt1;
            R_U1_z = _wt2;
            R_U1_w = _wt3;
        }
        return { U0: rt.vec4(R_U0_x, R_U0_y, R_U0_z, R_U0_w), U1: rt.vec4(R_U1_x, R_U1_y, R_U1_z, R_U1_w) };
    }

    function unpack_edge_prim(edge0, edge1, b_normal, axis, p_floor) {
        const edge0_x = edge0.x;
        const edge0_y = edge0.y;
        const edge0_z = edge0.z;
        const edge0_w = edge0.w;
        const edge1_x = edge1.x;
        const edge1_y = edge1.y;
        const edge1_z = edge1.z;
        const edge1_w = edge1.w;
        let Q_rho = 0;
        let Q_vx = 0;
        let Q_vy = 0;
        let Q_vz = 0;
        let Q_p = 0;
        let Q_bx = 0;
        let Q_by = 0;
        let Q_bz = 0;
        Q_rho = ((edge0_x) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (edge0_x));
        Q_vx = edge0_y;
        Q_vy = edge0_z;
        Q_vz = edge0_w;
        Q_p = ((edge1_x) < (p_floor) ? (p_floor) : (edge1_x));
        Q_bz = edge1_z;
        if ((axis == 0)) {
            Q_bx = b_normal;
            Q_by = edge1_y;
        } else {
            Q_bx = edge1_y;
            Q_by = b_normal;
        }
        return { rho: Q_rho, vx: Q_vx, vy: Q_vy, vz: Q_vz, p: Q_p, bx: Q_bx, by: Q_by, bz: Q_bz };
    }

    function prim_to_axis_state(P, axis, gamma) {
        let A_rho = 0;
        let A_un = 0;
        let A_ut1 = 0;
        let A_ut2 = 0;
        let A_bn = 0;
        let A_bt1 = 0;
        let A_bt2 = 0;
        let A_p = 0;
        let A_pT = 0;
        let A_E = 0;
        A_rho = P.rho;
        A_p = P.p;
        A_bn = ((axis == 0) ? P.bx : P.by);
        if ((axis == 0)) {
            A_un = P.vx;
            A_ut1 = P.vy;
            A_ut2 = P.vz;
            A_bt1 = P.by;
            A_bt2 = P.bz;
        } else {
            A_un = P.vy;
            A_ut1 = P.vx;
            A_ut2 = P.vz;
            A_bt1 = P.bx;
            A_bt2 = P.bz;
        }
        const b2 = (((A_bn * A_bn) + (A_bt1 * A_bt1)) + (A_bt2 * A_bt2));
        A_pT = (A_p + (0.5 * b2));
        const v2 = (((A_un * A_un) + (A_ut1 * A_ut1)) + (A_ut2 * A_ut2));
        A_E = (((A_p / ((gamma - 1.0))) + ((0.5 * A_rho) * v2)) + (0.5 * b2));
        return { rho: A_rho, un: A_un, ut1: A_ut1, ut2: A_ut2, bn: A_bn, bt1: A_bt1, bt2: A_bt2, p: A_p, pT: A_pT, E: A_E };
    }

    function axis_flux(A) {
        let F_f_rho = 0;
        let F_f_mn = 0;
        let F_f_mt1 = 0;
        let F_f_mt2 = 0;
        let F_f_E = 0;
        let F_f_bt1 = 0;
        let F_f_bt2 = 0;
        F_f_rho = (A.rho * A.un);
        F_f_mn = ((((A.rho * A.un) * A.un) + A.pT) - (A.bn * A.bn));
        F_f_mt1 = (((A.rho * A.un) * A.ut1) - (A.bn * A.bt1));
        F_f_mt2 = (((A.rho * A.un) * A.ut2) - (A.bn * A.bt2));
        const vdotb = (((A.un * A.bn) + (A.ut1 * A.bt1)) + (A.ut2 * A.bt2));
        F_f_E = ((((A.E + A.pT)) * A.un) - (A.bn * vdotb));
        F_f_bt1 = ((A.un * A.bt1) - (A.ut1 * A.bn));
        F_f_bt2 = ((A.un * A.bt2) - (A.ut2 * A.bn));
        return { f_rho: F_f_rho, f_mn: F_f_mn, f_mt1: F_f_mt1, f_mt2: F_f_mt2, f_E: F_f_E, f_bt1: F_f_bt1, f_bt2: F_f_bt2 };
    }

    function pack_flux(F, axis) {
        let P_f0_x = 0;
        let P_f0_y = 0;
        let P_f0_z = 0;
        let P_f0_w = 0;
        let P_f1_x = 0;
        let P_f1_y = 0;
        let P_f1_z = 0;
        let P_f1_w = 0;
        let P_fBt1 = 0;
        let P_fBt2 = 0;
        if ((axis == 0)) {
            {
                const _wt0 = F.f_rho;
                const _wt1 = F.f_mn;
                const _wt2 = F.f_mt1;
                const _wt3 = F.f_mt2;
                P_f0_x = _wt0;
                P_f0_y = _wt1;
                P_f0_z = _wt2;
                P_f0_w = _wt3;
            }
            {
                const _wt0 = F.f_E;
                const _wt1 = F.f_bt2;
                const _wt2 = 0.0;
                const _wt3 = 0.0;
                P_f1_x = _wt0;
                P_f1_y = _wt1;
                P_f1_z = _wt2;
                P_f1_w = _wt3;
            }
            P_fBt1 = F.f_bt1;
        } else {
            {
                const _wt0 = F.f_rho;
                const _wt1 = F.f_mt1;
                const _wt2 = F.f_mn;
                const _wt3 = F.f_mt2;
                P_f0_x = _wt0;
                P_f0_y = _wt1;
                P_f0_z = _wt2;
                P_f0_w = _wt3;
            }
            {
                const _wt0 = F.f_E;
                const _wt1 = F.f_bt2;
                const _wt2 = 0.0;
                const _wt3 = 0.0;
                P_f1_x = _wt0;
                P_f1_y = _wt1;
                P_f1_z = _wt2;
                P_f1_w = _wt3;
            }
            P_fBt1 = F.f_bt1;
        }
        P_fBt2 = 0.0;
        return { f0: rt.vec4(P_f0_x, P_f0_y, P_f0_z, P_f0_w), f1: rt.vec4(P_f1_x, P_f1_y, P_f1_z, P_f1_w), fBt1: P_fBt1, fBt2: P_fBt2 };
    }

    function hll_flux_mhd(in_, axis, gamma) {
        const SL = in_.SL;
        const SR = in_.SR;
        const _sroa_0 = in_.FL;
        const FL_f_rho = _sroa_0.f_rho;
        const FL_f_mn = _sroa_0.f_mn;
        const FL_f_mt1 = _sroa_0.f_mt1;
        const FL_f_mt2 = _sroa_0.f_mt2;
        const FL_f_E = _sroa_0.f_E;
        const FL_f_bt1 = _sroa_0.f_bt1;
        const FL_f_bt2 = _sroa_0.f_bt2;
        const _sroa_1 = in_.FR;
        const FR_f_rho = _sroa_1.f_rho;
        const FR_f_mn = _sroa_1.f_mn;
        const FR_f_mt1 = _sroa_1.f_mt1;
        const FR_f_mt2 = _sroa_1.f_mt2;
        const FR_f_E = _sroa_1.f_E;
        const FR_f_bt1 = _sroa_1.f_bt1;
        const FR_f_bt2 = _sroa_1.f_bt2;
        let out_f0_x = 0;
        let out_f0_y = 0;
        let out_f0_z = 0;
        let out_f0_w = 0;
        let out_f1_x = 0;
        let out_f1_y = 0;
        let out_f1_z = 0;
        let out_f1_w = 0;
        let out_fBt1 = 0;
        let out_fBt2 = 0;
        if ((SL >= 0.0)) {
            const _sroa_2 = pack_flux({ f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 }, axis);
            const pf_f0_x = _sroa_2.f0.x;
            const pf_f0_y = _sroa_2.f0.y;
            const pf_f0_z = _sroa_2.f0.z;
            const pf_f0_w = _sroa_2.f0.w;
            const pf_f1_x = _sroa_2.f1.x;
            const pf_f1_y = _sroa_2.f1.y;
            const pf_f1_z = _sroa_2.f1.z;
            const pf_f1_w = _sroa_2.f1.w;
            const pf_fBt1 = _sroa_2.fBt1;
            const pf_fBt2 = _sroa_2.fBt2;
            {
                const _wt0 = pf_f0_x;
                const _wt1 = pf_f0_y;
                const _wt2 = pf_f0_z;
                const _wt3 = pf_f0_w;
                out_f0_x = _wt0;
                out_f0_y = _wt1;
                out_f0_z = _wt2;
                out_f0_w = _wt3;
            }
            {
                const _wt0 = pf_f1_x;
                const _wt1 = pf_f1_y;
                const _wt2 = pf_f1_z;
                const _wt3 = pf_f1_w;
                out_f1_x = _wt0;
                out_f1_y = _wt1;
                out_f1_z = _wt2;
                out_f1_w = _wt3;
            }
            out_fBt1 = pf_fBt1;
            out_fBt2 = pf_fBt2;
            return { f0: rt.vec4(out_f0_x, out_f0_y, out_f0_z, out_f0_w), f1: rt.vec4(out_f1_x, out_f1_y, out_f1_z, out_f1_w), fBt1: out_fBt1, fBt2: out_fBt2 };
        }
        if ((SR <= 0.0)) {
            const _sroa_3 = pack_flux({ f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 }, axis);
            const pf_f0_x = _sroa_3.f0.x;
            const pf_f0_y = _sroa_3.f0.y;
            const pf_f0_z = _sroa_3.f0.z;
            const pf_f0_w = _sroa_3.f0.w;
            const pf_f1_x = _sroa_3.f1.x;
            const pf_f1_y = _sroa_3.f1.y;
            const pf_f1_z = _sroa_3.f1.z;
            const pf_f1_w = _sroa_3.f1.w;
            const pf_fBt1 = _sroa_3.fBt1;
            const pf_fBt2 = _sroa_3.fBt2;
            {
                const _wt0 = pf_f0_x;
                const _wt1 = pf_f0_y;
                const _wt2 = pf_f0_z;
                const _wt3 = pf_f0_w;
                out_f0_x = _wt0;
                out_f0_y = _wt1;
                out_f0_z = _wt2;
                out_f0_w = _wt3;
            }
            {
                const _wt0 = pf_f1_x;
                const _wt1 = pf_f1_y;
                const _wt2 = pf_f1_z;
                const _wt3 = pf_f1_w;
                out_f1_x = _wt0;
                out_f1_y = _wt1;
                out_f1_z = _wt2;
                out_f1_w = _wt3;
            }
            out_fBt1 = pf_fBt1;
            out_fBt2 = pf_fBt2;
            return { f0: rt.vec4(out_f0_x, out_f0_y, out_f0_z, out_f0_w), f1: rt.vec4(out_f1_x, out_f1_y, out_f1_z, out_f1_w), fBt1: out_fBt1, fBt2: out_fBt2 };
        }
        const _sroa_4 = prim_to_cons_pair(in_.QL, gamma, bindings.U_uniforms.pressure_floor);
        const CL_U0_x = _sroa_4.U0.x;
        const CL_U0_y = _sroa_4.U0.y;
        const CL_U0_z = _sroa_4.U0.z;
        const CL_U0_w = _sroa_4.U0.w;
        const CL_U1_x = _sroa_4.U1.x;
        const CL_U1_y = _sroa_4.U1.y;
        const CL_U1_z = _sroa_4.U1.z;
        const CL_U1_w = _sroa_4.U1.w;
        const _sroa_5 = prim_to_cons_pair(in_.QR, gamma, bindings.U_uniforms.pressure_floor);
        const CR_U0_x = _sroa_5.U0.x;
        const CR_U0_y = _sroa_5.U0.y;
        const CR_U0_z = _sroa_5.U0.z;
        const CR_U0_w = _sroa_5.U0.w;
        const CR_U1_x = _sroa_5.U1.x;
        const CR_U1_y = _sroa_5.U1.y;
        const CR_U1_z = _sroa_5.U1.z;
        const CR_U1_w = _sroa_5.U1.w;
        const denom = (((SR - SL)) < (1.0e-12) ? (1.0e-12) : ((SR - SL)));
        const inv = (1.0 / denom);
        const dU0_x = (CR_U0_x - CL_U0_x);
        const dU0_y = (CR_U0_y - CL_U0_y);
        const dU0_z = (CR_U0_z - CL_U0_z);
        const dU0_w = (CR_U0_w - CL_U0_w);
        const dU1_x = (CR_U1_x - CL_U1_x);
        const dU1_y = (CR_U1_y - CL_U1_y);
        const dU1_z = (CR_U1_z - CL_U1_z);
        const dU1_w = (CR_U1_w - CL_U1_w);
        let Favg_f_rho = 0;
        let Favg_f_mn = 0;
        let Favg_f_mt1 = 0;
        let Favg_f_mt2 = 0;
        let Favg_f_E = 0;
        let Favg_f_bt1 = 0;
        let Favg_f_bt2 = 0;
        const dMn = ((axis == 0) ? dU0_y : dU0_z);
        const dMt1 = ((axis == 0) ? dU0_z : dU0_y);
        const dMt2 = dU0_w;
        Favg_f_rho = (((((SR * FL_f_rho) - (SL * FR_f_rho)) + ((SL * SR) * dU0_x))) * inv);
        Favg_f_mn = (((((SR * FL_f_mn) - (SL * FR_f_mn)) + ((SL * SR) * dMn))) * inv);
        Favg_f_mt1 = (((((SR * FL_f_mt1) - (SL * FR_f_mt1)) + ((SL * SR) * dMt1))) * inv);
        Favg_f_mt2 = (((((SR * FL_f_mt2) - (SL * FR_f_mt2)) + ((SL * SR) * dMt2))) * inv);
        Favg_f_E = (((((SR * FL_f_E) - (SL * FR_f_E)) + ((SL * SR) * dU1_x))) * inv);
        Favg_f_bt1 = (((((SR * FL_f_bt1) - (SL * FR_f_bt1)) + ((SL * SR) * ((in_.AR.bt1 - in_.AL.bt1))))) * inv);
        Favg_f_bt2 = (((((SR * FL_f_bt2) - (SL * FR_f_bt2)) + ((SL * SR) * ((in_.AR.bt2 - in_.AL.bt2))))) * inv);
        const _sroa_6 = pack_flux({ f_rho: Favg_f_rho, f_mn: Favg_f_mn, f_mt1: Favg_f_mt1, f_mt2: Favg_f_mt2, f_E: Favg_f_E, f_bt1: Favg_f_bt1, f_bt2: Favg_f_bt2 }, axis);
        const pf_f0_x = _sroa_6.f0.x;
        const pf_f0_y = _sroa_6.f0.y;
        const pf_f0_z = _sroa_6.f0.z;
        const pf_f0_w = _sroa_6.f0.w;
        const pf_f1_x = _sroa_6.f1.x;
        const pf_f1_y = _sroa_6.f1.y;
        const pf_f1_z = _sroa_6.f1.z;
        const pf_f1_w = _sroa_6.f1.w;
        const pf_fBt1 = _sroa_6.fBt1;
        const pf_fBt2 = _sroa_6.fBt2;
        {
            const _wt0 = pf_f0_x;
            const _wt1 = pf_f0_y;
            const _wt2 = pf_f0_z;
            const _wt3 = pf_f0_w;
            out_f0_x = _wt0;
            out_f0_y = _wt1;
            out_f0_z = _wt2;
            out_f0_w = _wt3;
        }
        {
            const _wt0 = pf_f1_x;
            const _wt1 = pf_f1_y;
            const _wt2 = pf_f1_z;
            const _wt3 = pf_f1_w;
            out_f1_x = _wt0;
            out_f1_y = _wt1;
            out_f1_z = _wt2;
            out_f1_w = _wt3;
        }
        out_fBt1 = pf_fBt1;
        out_fBt2 = pf_fBt2;
        return { f0: rt.vec4(out_f0_x, out_f0_y, out_f0_z, out_f0_w), f1: rt.vec4(out_f1_x, out_f1_y, out_f1_z, out_f1_w), fBt1: out_fBt1, fBt2: out_fBt2 };
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
        const _b_Bx_face = bindings.Bx_face;
        const _b_By_face = bindings.By_face;
        const _b_edge_l_0 = bindings.edge_l_0;
        const _b_edge_l_1 = bindings.edge_l_1;
        const _b_edge_r_0 = bindings.edge_r_0;
        const _b_edge_r_1 = bindings.edge_r_1;
        const _b_flux_0 = bindings.flux_0;
        const _b_flux_1 = bindings.flux_1;
        const _b_sweep = bindings.sweep;
        const _u_sweep_sweep_dir = _b_sweep.sweep_dir;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_interior = _u_U_uniforms_grid_n;
                    const n_total = _u_U_uniforms_grid_n_total;
                    const ghost = _u_U_uniforms_ghost_w;
                    const axis = _u_sweep_sweep_dir;
                    const g = _u_U_uniforms_gamma;
                    let x_extent = 0;
                    let y_extent = 0;
                    if ((axis == 0)) {
                        x_extent = (n_interior + 1);
                        y_extent = (n_interior + 2);
                    } else {
                        x_extent = (n_interior + 2);
                        y_extent = (n_interior + 1);
                    }
                    if (((gid_x >= x_extent) || (gid_y >= y_extent))) {
                        break __invocation;
                    }
                    let ix = 0;
                    let iy = 0;
                    if ((axis == 0)) {
                        ix = (ghost + gid_x);
                        iy = ((ghost + gid_y) - 1);
                    } else {
                        ix = ((ghost + gid_x) - 1);
                        iy = (ghost + gid_y);
                    }
                    let ix_l = ix;
                    let iy_l = iy;
                    if ((axis == 0)) {
                        ix_l = (ix - 1);
                    } else {
                        iy_l = (iy - 1);
                    }
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy_l * n_total) + ix_l);
                        break _inl_4;
                    }
                    const idx_l = _inl_4_result;
                    let _inl_5_result;
                    _inl_5: {
                        _inl_5_result = ((iy * n_total) + ix);
                        break _inl_5;
                    }
                    const idx_r = _inl_5_result;
                    let b_normal = 0;
                    if ((axis == 0)) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_6;
                        }
                        b_normal = _b_Bx_face[_inl_6_result];
                    } else {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + ix);
                            break _inl_7;
                        }
                        b_normal = _b_By_face[_inl_7_result];
                    }
                    const pf = _u_U_uniforms_pressure_floor;
                    const _sroa_7 = unpack_edge_prim(rt.vec4(_b_edge_r_0[((idx_l) * 4 + 0) + 0], _b_edge_r_0[((idx_l) * 4 + 0) + 1], _b_edge_r_0[((idx_l) * 4 + 0) + 2], _b_edge_r_0[((idx_l) * 4 + 0) + 3]), rt.vec4(_b_edge_r_1[((idx_l) * 4 + 0) + 0], _b_edge_r_1[((idx_l) * 4 + 0) + 1], _b_edge_r_1[((idx_l) * 4 + 0) + 2], _b_edge_r_1[((idx_l) * 4 + 0) + 3]), b_normal, axis, pf);
                    const QL_rho = _sroa_7.rho;
                    const QL_vx = _sroa_7.vx;
                    const QL_vy = _sroa_7.vy;
                    const QL_vz = _sroa_7.vz;
                    const QL_p = _sroa_7.p;
                    const QL_bx = _sroa_7.bx;
                    const QL_by = _sroa_7.by;
                    const QL_bz = _sroa_7.bz;
                    const _sroa_8 = unpack_edge_prim(rt.vec4(_b_edge_l_0[((idx_r) * 4 + 0) + 0], _b_edge_l_0[((idx_r) * 4 + 0) + 1], _b_edge_l_0[((idx_r) * 4 + 0) + 2], _b_edge_l_0[((idx_r) * 4 + 0) + 3]), rt.vec4(_b_edge_l_1[((idx_r) * 4 + 0) + 0], _b_edge_l_1[((idx_r) * 4 + 0) + 1], _b_edge_l_1[((idx_r) * 4 + 0) + 2], _b_edge_l_1[((idx_r) * 4 + 0) + 3]), b_normal, axis, pf);
                    const QR_rho = _sroa_8.rho;
                    const QR_vx = _sroa_8.vx;
                    const QR_vy = _sroa_8.vy;
                    const QR_vz = _sroa_8.vz;
                    const QR_p = _sroa_8.p;
                    const QR_bx = _sroa_8.bx;
                    const QR_by = _sroa_8.by;
                    const QR_bz = _sroa_8.bz;
                    const _sroa_9 = prim_to_axis_state({ rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz }, axis, g);
                    const AL_rho = _sroa_9.rho;
                    const AL_un = _sroa_9.un;
                    const AL_ut1 = _sroa_9.ut1;
                    const AL_ut2 = _sroa_9.ut2;
                    const AL_bn = _sroa_9.bn;
                    const AL_bt1 = _sroa_9.bt1;
                    const AL_bt2 = _sroa_9.bt2;
                    const AL_p = _sroa_9.p;
                    const AL_pT = _sroa_9.pT;
                    const AL_E = _sroa_9.E;
                    const _sroa_10 = prim_to_axis_state({ rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz }, axis, g);
                    const AR_rho = _sroa_10.rho;
                    const AR_un = _sroa_10.un;
                    const AR_ut1 = _sroa_10.ut1;
                    const AR_ut2 = _sroa_10.ut2;
                    const AR_bn = _sroa_10.bn;
                    const AR_bt1 = _sroa_10.bt1;
                    const AR_bt2 = _sroa_10.bt2;
                    const AR_p = _sroa_10.p;
                    const AR_pT = _sroa_10.pT;
                    const AR_E = _sroa_10.E;
                    const _sroa_11 = axis_flux({ rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E });
                    const FL_f_rho = _sroa_11.f_rho;
                    const FL_f_mn = _sroa_11.f_mn;
                    const FL_f_mt1 = _sroa_11.f_mt1;
                    const FL_f_mt2 = _sroa_11.f_mt2;
                    const FL_f_E = _sroa_11.f_E;
                    const FL_f_bt1 = _sroa_11.f_bt1;
                    const FL_f_bt2 = _sroa_11.f_bt2;
                    const _sroa_12 = axis_flux({ rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E });
                    const FR_f_rho = _sroa_12.f_rho;
                    const FR_f_mn = _sroa_12.f_mn;
                    const FR_f_mt1 = _sroa_12.f_mt1;
                    const FR_f_mt2 = _sroa_12.f_mt2;
                    const FR_f_E = _sroa_12.f_E;
                    const FR_f_bt1 = _sroa_12.f_bt1;
                    const FR_f_bt2 = _sroa_12.f_bt2;
                    const cfL = fast_mag_speed({ rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz }, g, axis, pf);
                    const cfR = fast_mag_speed({ rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz }, g, axis, pf);
                    const SL = (((AR_un - cfR)) < ((AL_un - cfL)) ? ((AR_un - cfR)) : ((AL_un - cfL)));
                    const SR = (((AL_un + cfL)) < ((AR_un + cfR)) ? ((AR_un + cfR)) : ((AL_un + cfL)));
                    const rcL_pre = (AL_rho * ((SL - AL_un)));
                    const rcR_pre = (AR_rho * ((SR - AR_un)));
                    const SM_den_pre = (rcR_pre - rcL_pre);
                    const SM_face = ((((((rcR_pre * AR_un) - (rcL_pre * AL_un)) - AR_pT) + AL_pT)) / ((Math.abs(SM_den_pre) < 1.0e-30) ? (Math.sign(SM_den_pre) * 1.0e-12) : SM_den_pre));
                    const dst = idx_r;
                    if ((SL >= 0.0)) {
                        const _sroa_13 = pack_flux({ f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 }, axis);
                        const pfL_f0_x = _sroa_13.f0.x;
                        const pfL_f0_y = _sroa_13.f0.y;
                        const pfL_f0_z = _sroa_13.f0.z;
                        const pfL_f0_w = _sroa_13.f0.w;
                        const pfL_f1_x = _sroa_13.f1.x;
                        const pfL_f1_y = _sroa_13.f1.y;
                        const pfL_f1_z = _sroa_13.f1.z;
                        const pfL_f1_w = _sroa_13.f1.w;
                        const pfL_fBt1 = _sroa_13.fBt1;
                        const pfL_fBt2 = _sroa_13.fBt2;
                        {
                            const _ftmp = rt.vec4(pfL_f0_x, pfL_f0_y, pfL_f0_z, pfL_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfL_f1_x, pfL_f1_y, pfL_f1_z, pfL_f1_w).x;
                            const _wt1 = rt.vec4(pfL_f1_x, pfL_f1_y, pfL_f1_z, pfL_f1_w).y;
                            const _wt2 = pfL_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    if ((SR <= 0.0)) {
                        const _sroa_14 = pack_flux({ f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 }, axis);
                        const pfR_f0_x = _sroa_14.f0.x;
                        const pfR_f0_y = _sroa_14.f0.y;
                        const pfR_f0_z = _sroa_14.f0.z;
                        const pfR_f0_w = _sroa_14.f0.w;
                        const pfR_f1_x = _sroa_14.f1.x;
                        const pfR_f1_y = _sroa_14.f1.y;
                        const pfR_f1_z = _sroa_14.f1.z;
                        const pfR_f1_w = _sroa_14.f1.w;
                        const pfR_fBt1 = _sroa_14.fBt1;
                        const pfR_fBt2 = _sroa_14.fBt2;
                        {
                            const _ftmp = rt.vec4(pfR_f0_x, pfR_f0_y, pfR_f0_z, pfR_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfR_f1_x, pfR_f1_y, pfR_f1_z, pfR_f1_w).x;
                            const _wt1 = rt.vec4(pfR_f1_x, pfR_f1_y, pfR_f1_z, pfR_f1_w).y;
                            const _wt2 = pfR_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    if (((SR - SL) < (HLLD_WS_TOL * (((Math.abs(SR) + Math.abs(SL)) + 1.0e-12))))) {
                        let hin_QL = null;
                        let hin_QR = null;
                        let hin_AL = null;
                        let hin_AR = null;
                        let hin_FL = null;
                        let hin_FR = null;
                        let hin_SL = 0;
                        let hin_SR = 0;
                        hin_QL = { rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz };
                        hin_QR = { rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz };
                        hin_AL = { rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E };
                        hin_AR = { rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E };
                        hin_FL = { f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 };
                        hin_FR = { f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 };
                        hin_SL = SL;
                        hin_SR = SR;
                        const _sroa_15 = hll_flux_mhd({ QL: hin_QL, QR: hin_QR, AL: hin_AL, AR: hin_AR, FL: hin_FL, FR: hin_FR, SL: hin_SL, SR: hin_SR }, axis, g);
                        const h_f0_x = _sroa_15.f0.x;
                        const h_f0_y = _sroa_15.f0.y;
                        const h_f0_z = _sroa_15.f0.z;
                        const h_f0_w = _sroa_15.f0.w;
                        const h_f1_x = _sroa_15.f1.x;
                        const h_f1_y = _sroa_15.f1.y;
                        const h_f1_z = _sroa_15.f1.z;
                        const h_f1_w = _sroa_15.f1.w;
                        const h_fBt1 = _sroa_15.fBt1;
                        const h_fBt2 = _sroa_15.fBt2;
                        {
                            const _ftmp = rt.vec4(h_f0_x, h_f0_y, h_f0_z, h_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).x;
                            const _wt1 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).y;
                            const _wt2 = h_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const SM = SM_face;
                    const pT_star = (AL_pT + ((AL_rho * ((SL - AL_un))) * ((SM - AL_un))));
                    if ((pT_star <= pf)) {
                        let hin_QL = null;
                        let hin_QR = null;
                        let hin_AL = null;
                        let hin_AR = null;
                        let hin_FL = null;
                        let hin_FR = null;
                        let hin_SL = 0;
                        let hin_SR = 0;
                        hin_QL = { rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz };
                        hin_QR = { rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz };
                        hin_AL = { rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E };
                        hin_AR = { rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E };
                        hin_FL = { f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 };
                        hin_FR = { f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 };
                        hin_SL = SL;
                        hin_SR = SR;
                        const _sroa_16 = hll_flux_mhd({ QL: hin_QL, QR: hin_QR, AL: hin_AL, AR: hin_AR, FL: hin_FL, FR: hin_FR, SL: hin_SL, SR: hin_SR }, axis, g);
                        const h_f0_x = _sroa_16.f0.x;
                        const h_f0_y = _sroa_16.f0.y;
                        const h_f0_z = _sroa_16.f0.z;
                        const h_f0_w = _sroa_16.f0.w;
                        const h_f1_x = _sroa_16.f1.x;
                        const h_f1_y = _sroa_16.f1.y;
                        const h_f1_z = _sroa_16.f1.z;
                        const h_f1_w = _sroa_16.f1.w;
                        const h_fBt1 = _sroa_16.fBt1;
                        const h_fBt2 = _sroa_16.fBt2;
                        {
                            const _ftmp = rt.vec4(h_f0_x, h_f0_y, h_f0_z, h_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).x;
                            const _wt1 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).y;
                            const _wt2 = h_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const bn2 = (b_normal * b_normal);
                    const rho_scale = (((0.5 * ((AL_rho + AR_rho)))) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : ((0.5 * ((AL_rho + AR_rho)))));
                    const half_dS = (0.5 * ((SR - SL)));
                    const branchA = (bn2 < (((HLLD_BX_EPS2 * rho_scale) * half_dS) * half_dS));
                    if (branchA) {
                        const denom_L = (((-1.0e-20)) < ((SL - SM)) ? ((-1.0e-20)) : ((SL - SM)));
                        const denom_R = (((SR - SM)) < (1.0e-20) ? (1.0e-20) : ((SR - SM)));
                        const rhoLs = ((AL_rho * ((SL - AL_un))) / denom_L);
                        const rhoRs = ((AR_rho * ((SR - AR_un))) / denom_R);
                        const E_Ls = (((((((SL - AL_un)) * AL_E) - (AL_pT * AL_un)) + (pT_star * SM))) / ((SL - SM)));
                        const E_Rs = (((((((SR - AR_un)) * AR_E) - (AR_pT * AR_un)) + (pT_star * SM))) / ((SR - SM)));
                        let Fout_f_rho = 0;
                        let Fout_f_mn = 0;
                        let Fout_f_mt1 = 0;
                        let Fout_f_mt2 = 0;
                        let Fout_f_E = 0;
                        let Fout_f_bt1 = 0;
                        let Fout_f_bt2 = 0;
                        if ((SM >= 0.0)) {
                            Fout_f_rho = (FL_f_rho + (SL * ((rhoLs - AL_rho))));
                            Fout_f_mn = (FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un)))));
                            Fout_f_mt1 = (FL_f_mt1 + (SL * (((rhoLs * AL_ut1) - (AL_rho * AL_ut1)))));
                            Fout_f_mt2 = (FL_f_mt2 + (SL * (((rhoLs * AL_ut2) - (AL_rho * AL_ut2)))));
                            Fout_f_E = (FL_f_E + (SL * ((E_Ls - AL_E))));
                            Fout_f_bt1 = (FL_f_bt1 + (SL * ((((AL_bt1 * ((SL - AL_un))) / ((SL - SM))) - AL_bt1))));
                            Fout_f_bt2 = (FL_f_bt2 + (SL * ((((AL_bt2 * ((SL - AL_un))) / ((SL - SM))) - AL_bt2))));
                        } else {
                            Fout_f_rho = (FR_f_rho + (SR * ((rhoRs - AR_rho))));
                            Fout_f_mn = (FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un)))));
                            Fout_f_mt1 = (FR_f_mt1 + (SR * (((rhoRs * AR_ut1) - (AR_rho * AR_ut1)))));
                            Fout_f_mt2 = (FR_f_mt2 + (SR * (((rhoRs * AR_ut2) - (AR_rho * AR_ut2)))));
                            Fout_f_E = (FR_f_E + (SR * ((E_Rs - AR_E))));
                            Fout_f_bt1 = (FR_f_bt1 + (SR * ((((AR_bt1 * ((SR - AR_un))) / ((SR - SM))) - AR_bt1))));
                            Fout_f_bt2 = (FR_f_bt2 + (SR * ((((AR_bt2 * ((SR - AR_un))) / ((SR - SM))) - AR_bt2))));
                        }
                        const _sroa_17 = pack_flux({ f_rho: Fout_f_rho, f_mn: Fout_f_mn, f_mt1: Fout_f_mt1, f_mt2: Fout_f_mt2, f_E: Fout_f_E, f_bt1: Fout_f_bt1, f_bt2: Fout_f_bt2 }, axis);
                        const pfA_f0_x = _sroa_17.f0.x;
                        const pfA_f0_y = _sroa_17.f0.y;
                        const pfA_f0_z = _sroa_17.f0.z;
                        const pfA_f0_w = _sroa_17.f0.w;
                        const pfA_f1_x = _sroa_17.f1.x;
                        const pfA_f1_y = _sroa_17.f1.y;
                        const pfA_f1_z = _sroa_17.f1.z;
                        const pfA_f1_w = _sroa_17.f1.w;
                        const pfA_fBt1 = _sroa_17.fBt1;
                        const pfA_fBt2 = _sroa_17.fBt2;
                        {
                            const _ftmp = rt.vec4(pfA_f0_x, pfA_f0_y, pfA_f0_z, pfA_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfA_f1_x, pfA_f1_y, pfA_f1_z, pfA_f1_w).x;
                            const _wt1 = rt.vec4(pfA_f1_x, pfA_f1_y, pfA_f1_z, pfA_f1_w).y;
                            const _wt2 = pfA_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const dL = (((-1.0e-20)) < ((SL - SM)) ? ((-1.0e-20)) : ((SL - SM)));
                    const dR = (((SR - SM)) < (1.0e-20) ? (1.0e-20) : ((SR - SM)));
                    const rhoLs = ((AL_rho * ((SL - AL_un))) / dL);
                    const rhoRs = ((AR_rho * ((SR - AR_un))) / dR);
                    const denomL_raw = (((AL_rho * ((SL - AL_un))) * ((SL - SM))) - bn2);
                    const denomR_raw = (((AR_rho * ((SR - AR_un))) * ((SR - SM))) - bn2);
                    const safeDL = ((Math.abs(denomL_raw) < 1.0e-20) ? 1.0e-20 : denomL_raw);
                    const safeDR = ((Math.abs(denomR_raw) < 1.0e-20) ? 1.0e-20 : denomR_raw);
                    const g_L = (((AL_rho * ((SL - AL_un))) * ((SL - AL_un))) - bn2);
                    const g_R = (((AR_rho * ((SR - AR_un))) * ((SR - AR_un))) - bn2);
                    const ut1_Ls = (AL_ut1 - (((b_normal * AL_bt1) * ((SM - AL_un))) / safeDL));
                    const ut2_Ls = (AL_ut2 - (((b_normal * AL_bt2) * ((SM - AL_un))) / safeDL));
                    const ut1_Rs = (AR_ut1 - (((b_normal * AR_bt1) * ((SM - AR_un))) / safeDR));
                    const ut2_Rs = (AR_ut2 - (((b_normal * AR_bt2) * ((SM - AR_un))) / safeDR));
                    const bt1_Ls = ((AL_bt1 * g_L) / safeDL);
                    const bt2_Ls = ((AL_bt2 * g_L) / safeDL);
                    const bt1_Rs = ((AR_bt1 * g_R) / safeDR);
                    const bt2_Rs = ((AR_bt2 * g_R) / safeDR);
                    const vdotb_L = (((AL_un * b_normal) + (AL_ut1 * AL_bt1)) + (AL_ut2 * AL_bt2));
                    const vdotb_R = (((AR_un * b_normal) + (AR_ut1 * AR_bt1)) + (AR_ut2 * AR_bt2));
                    const vdotbLs = (((SM * b_normal) + (ut1_Ls * bt1_Ls)) + (ut2_Ls * bt2_Ls));
                    const vdotbRs = (((SM * b_normal) + (ut1_Rs * bt1_Rs)) + (ut2_Rs * bt2_Rs));
                    const E_Ls = ((((((((SL - AL_un)) * AL_E) - (AL_pT * AL_un)) + (pT_star * SM)) + (b_normal * ((vdotb_L - vdotbLs))))) / ((SL - SM)));
                    const E_Rs = ((((((((SR - AR_un)) * AR_E) - (AR_pT * AR_un)) + (pT_star * SM)) + (b_normal * ((vdotb_R - vdotbRs))))) / ((SR - SM)));
                    const absBn = Math.abs(b_normal);
                    const SLs = (SM - (absBn / Math.sqrt(((rhoLs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoLs)))));
                    const SRs = (SM + (absBn / Math.sqrt(((rhoRs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoRs)))));
                    const srL = Math.sqrt(((rhoLs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoLs)));
                    const srR = Math.sqrt(((rhoRs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoRs)));
                    const srSum = (srL + srR);
                    const sgnBn = ((b_normal >= 0.0) ? 1.0 : (-1.0));
                    const ut1_ss = (((((srL * ut1_Ls) + (srR * ut1_Rs)) + (((bt1_Rs - bt1_Ls)) * sgnBn))) / srSum);
                    const ut2_ss = (((((srL * ut2_Ls) + (srR * ut2_Rs)) + (((bt2_Rs - bt2_Ls)) * sgnBn))) / srSum);
                    const bt1_ss = (((((srL * bt1_Rs) + (srR * bt1_Ls)) + (((srL * srR) * ((ut1_Rs - ut1_Ls))) * sgnBn))) / srSum);
                    const bt2_ss = (((((srL * bt2_Rs) + (srR * bt2_Ls)) + (((srL * srR) * ((ut2_Rs - ut2_Ls))) * sgnBn))) / srSum);
                    const vdotb_ss = (((SM * b_normal) + (ut1_ss * bt1_ss)) + (ut2_ss * bt2_ss));
                    const E_Lss = (E_Ls - ((srL * sgnBn) * ((vdotbLs - vdotb_ss))));
                    const E_Rss = (E_Rs + ((srR * sgnBn) * ((vdotbRs - vdotb_ss))));
                    let Fout_f_rho = 0;
                    let Fout_f_mn = 0;
                    let Fout_f_mt1 = 0;
                    let Fout_f_mt2 = 0;
                    let Fout_f_E = 0;
                    let Fout_f_bt1 = 0;
                    let Fout_f_bt2 = 0;
                    if ((SLs >= 0.0)) {
                        Fout_f_rho = (FL_f_rho + (SL * ((rhoLs - AL_rho))));
                        Fout_f_mn = (FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un)))));
                        Fout_f_mt1 = (FL_f_mt1 + (SL * (((rhoLs * ut1_Ls) - (AL_rho * AL_ut1)))));
                        Fout_f_mt2 = (FL_f_mt2 + (SL * (((rhoLs * ut2_Ls) - (AL_rho * AL_ut2)))));
                        Fout_f_E = (FL_f_E + (SL * ((E_Ls - AL_E))));
                        Fout_f_bt1 = (FL_f_bt1 + (SL * ((bt1_Ls - AL_bt1))));
                        Fout_f_bt2 = (FL_f_bt2 + (SL * ((bt2_Ls - AL_bt2))));
                    } else if ((SM >= 0.0)) {
                        Fout_f_rho = ((FL_f_rho + (SL * ((rhoLs - AL_rho)))) + (SLs * ((rhoLs - rhoLs))));
                        Fout_f_mn = ((FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un))))) + (SLs * (((rhoLs * SM) - (rhoLs * SM)))));
                        Fout_f_mt1 = ((FL_f_mt1 + (SL * (((rhoLs * ut1_Ls) - (AL_rho * AL_ut1))))) + (SLs * (((rhoLs * ut1_ss) - (rhoLs * ut1_Ls)))));
                        Fout_f_mt2 = ((FL_f_mt2 + (SL * (((rhoLs * ut2_Ls) - (AL_rho * AL_ut2))))) + (SLs * (((rhoLs * ut2_ss) - (rhoLs * ut2_Ls)))));
                        Fout_f_E = ((FL_f_E + (SL * ((E_Ls - AL_E)))) + (SLs * ((E_Lss - E_Ls))));
                        Fout_f_bt1 = ((FL_f_bt1 + (SL * ((bt1_Ls - AL_bt1)))) + (SLs * ((bt1_ss - bt1_Ls))));
                        Fout_f_bt2 = ((FL_f_bt2 + (SL * ((bt2_Ls - AL_bt2)))) + (SLs * ((bt2_ss - bt2_Ls))));
                    } else if ((SRs >= 0.0)) {
                        Fout_f_rho = ((FR_f_rho + (SR * ((rhoRs - AR_rho)))) + (SRs * ((rhoRs - rhoRs))));
                        Fout_f_mn = ((FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un))))) + (SRs * (((rhoRs * SM) - (rhoRs * SM)))));
                        Fout_f_mt1 = ((FR_f_mt1 + (SR * (((rhoRs * ut1_Rs) - (AR_rho * AR_ut1))))) + (SRs * (((rhoRs * ut1_ss) - (rhoRs * ut1_Rs)))));
                        Fout_f_mt2 = ((FR_f_mt2 + (SR * (((rhoRs * ut2_Rs) - (AR_rho * AR_ut2))))) + (SRs * (((rhoRs * ut2_ss) - (rhoRs * ut2_Rs)))));
                        Fout_f_E = ((FR_f_E + (SR * ((E_Rs - AR_E)))) + (SRs * ((E_Rss - E_Rs))));
                        Fout_f_bt1 = ((FR_f_bt1 + (SR * ((bt1_Rs - AR_bt1)))) + (SRs * ((bt1_ss - bt1_Rs))));
                        Fout_f_bt2 = ((FR_f_bt2 + (SR * ((bt2_Rs - AR_bt2)))) + (SRs * ((bt2_ss - bt2_Rs))));
                    } else {
                        Fout_f_rho = (FR_f_rho + (SR * ((rhoRs - AR_rho))));
                        Fout_f_mn = (FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un)))));
                        Fout_f_mt1 = (FR_f_mt1 + (SR * (((rhoRs * ut1_Rs) - (AR_rho * AR_ut1)))));
                        Fout_f_mt2 = (FR_f_mt2 + (SR * (((rhoRs * ut2_Rs) - (AR_rho * AR_ut2)))));
                        Fout_f_E = (FR_f_E + (SR * ((E_Rs - AR_E))));
                        Fout_f_bt1 = (FR_f_bt1 + (SR * ((bt1_Rs - AR_bt1))));
                        Fout_f_bt2 = (FR_f_bt2 + (SR * ((bt2_Rs - AR_bt2))));
                    }
                    const _sroa_18 = pack_flux({ f_rho: Fout_f_rho, f_mn: Fout_f_mn, f_mt1: Fout_f_mt1, f_mt2: Fout_f_mt2, f_E: Fout_f_E, f_bt1: Fout_f_bt1, f_bt2: Fout_f_bt2 }, axis);
                    const pfH_f0_x = _sroa_18.f0.x;
                    const pfH_f0_y = _sroa_18.f0.y;
                    const pfH_f0_z = _sroa_18.f0.z;
                    const pfH_f0_w = _sroa_18.f0.w;
                    const pfH_f1_x = _sroa_18.f1.x;
                    const pfH_f1_y = _sroa_18.f1.y;
                    const pfH_f1_z = _sroa_18.f1.z;
                    const pfH_f1_w = _sroa_18.f1.w;
                    const pfH_fBt1 = _sroa_18.fBt1;
                    const pfH_fBt2 = _sroa_18.fBt2;
                    {
                        const _ftmp = rt.vec4(pfH_f0_x, pfH_f0_y, pfH_f0_z, pfH_f0_w);
                        const _wbase = ((dst) * 4 + 0);
                        _b_flux_0[_wbase + 0] = _ftmp.x;
                        _b_flux_0[_wbase + 1] = _ftmp.y;
                        _b_flux_0[_wbase + 2] = _ftmp.z;
                        _b_flux_0[_wbase + 3] = _ftmp.w;
                    }
                    {
                        const _wbase = ((dst) * 4 + 0);
                        const _wt0 = rt.vec4(pfH_f1_x, pfH_f1_y, pfH_f1_z, pfH_f1_w).x;
                        const _wt1 = rt.vec4(pfH_f1_x, pfH_f1_y, pfH_f1_z, pfH_f1_w).y;
                        const _wt2 = pfH_fBt1;
                        const _wt3 = SM_face;
                        _b_flux_1[_wbase + 0] = _wt0;
                        _b_flux_1[_wbase + 1] = _wt1;
                        _b_flux_1[_wbase + 2] = _wt2;
                        _b_flux_1[_wbase + 3] = _wt3;
                    }
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
                    const axis = _u_sweep_sweep_dir;
                    const g = _u_U_uniforms_gamma;
                    let x_extent = 0;
                    let y_extent = 0;
                    if ((axis == 0)) {
                        x_extent = (n_interior + 1);
                        y_extent = (n_interior + 2);
                    } else {
                        x_extent = (n_interior + 2);
                        y_extent = (n_interior + 1);
                    }
                    if (((gid_x >= x_extent) || (gid_y >= y_extent))) {
                        break __invocation;
                    }
                    let ix = 0;
                    let iy = 0;
                    if ((axis == 0)) {
                        ix = (ghost + gid_x);
                        iy = ((ghost + gid_y) - 1);
                    } else {
                        ix = ((ghost + gid_x) - 1);
                        iy = (ghost + gid_y);
                    }
                    let ix_l = ix;
                    let iy_l = iy;
                    if ((axis == 0)) {
                        ix_l = (ix - 1);
                    } else {
                        iy_l = (iy - 1);
                    }
                    let _inl_4_result;
                    _inl_4: {
                        _inl_4_result = ((iy_l * n_total) + ix_l);
                        break _inl_4;
                    }
                    const idx_l = _inl_4_result;
                    let _inl_5_result;
                    _inl_5: {
                        _inl_5_result = ((iy * n_total) + ix);
                        break _inl_5;
                    }
                    const idx_r = _inl_5_result;
                    let b_normal = 0;
                    if ((axis == 0)) {
                        let _inl_6_result;
                        _inl_6: {
                            _inl_6_result = ((iy * ((n_total + 1))) + ix);
                            break _inl_6;
                        }
                        b_normal = _b_Bx_face[_inl_6_result];
                    } else {
                        let _inl_7_result;
                        _inl_7: {
                            _inl_7_result = ((iy * n_total) + ix);
                            break _inl_7;
                        }
                        b_normal = _b_By_face[_inl_7_result];
                    }
                    const pf = _u_U_uniforms_pressure_floor;
                    const _sroa_19 = unpack_edge_prim(rt.vec4(_b_edge_r_0[((idx_l) * 4 + 0) + 0], _b_edge_r_0[((idx_l) * 4 + 0) + 1], _b_edge_r_0[((idx_l) * 4 + 0) + 2], _b_edge_r_0[((idx_l) * 4 + 0) + 3]), rt.vec4(_b_edge_r_1[((idx_l) * 4 + 0) + 0], _b_edge_r_1[((idx_l) * 4 + 0) + 1], _b_edge_r_1[((idx_l) * 4 + 0) + 2], _b_edge_r_1[((idx_l) * 4 + 0) + 3]), b_normal, axis, pf);
                    const QL_rho = _sroa_19.rho;
                    const QL_vx = _sroa_19.vx;
                    const QL_vy = _sroa_19.vy;
                    const QL_vz = _sroa_19.vz;
                    const QL_p = _sroa_19.p;
                    const QL_bx = _sroa_19.bx;
                    const QL_by = _sroa_19.by;
                    const QL_bz = _sroa_19.bz;
                    const _sroa_20 = unpack_edge_prim(rt.vec4(_b_edge_l_0[((idx_r) * 4 + 0) + 0], _b_edge_l_0[((idx_r) * 4 + 0) + 1], _b_edge_l_0[((idx_r) * 4 + 0) + 2], _b_edge_l_0[((idx_r) * 4 + 0) + 3]), rt.vec4(_b_edge_l_1[((idx_r) * 4 + 0) + 0], _b_edge_l_1[((idx_r) * 4 + 0) + 1], _b_edge_l_1[((idx_r) * 4 + 0) + 2], _b_edge_l_1[((idx_r) * 4 + 0) + 3]), b_normal, axis, pf);
                    const QR_rho = _sroa_20.rho;
                    const QR_vx = _sroa_20.vx;
                    const QR_vy = _sroa_20.vy;
                    const QR_vz = _sroa_20.vz;
                    const QR_p = _sroa_20.p;
                    const QR_bx = _sroa_20.bx;
                    const QR_by = _sroa_20.by;
                    const QR_bz = _sroa_20.bz;
                    const _sroa_21 = prim_to_axis_state({ rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz }, axis, g);
                    const AL_rho = _sroa_21.rho;
                    const AL_un = _sroa_21.un;
                    const AL_ut1 = _sroa_21.ut1;
                    const AL_ut2 = _sroa_21.ut2;
                    const AL_bn = _sroa_21.bn;
                    const AL_bt1 = _sroa_21.bt1;
                    const AL_bt2 = _sroa_21.bt2;
                    const AL_p = _sroa_21.p;
                    const AL_pT = _sroa_21.pT;
                    const AL_E = _sroa_21.E;
                    const _sroa_22 = prim_to_axis_state({ rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz }, axis, g);
                    const AR_rho = _sroa_22.rho;
                    const AR_un = _sroa_22.un;
                    const AR_ut1 = _sroa_22.ut1;
                    const AR_ut2 = _sroa_22.ut2;
                    const AR_bn = _sroa_22.bn;
                    const AR_bt1 = _sroa_22.bt1;
                    const AR_bt2 = _sroa_22.bt2;
                    const AR_p = _sroa_22.p;
                    const AR_pT = _sroa_22.pT;
                    const AR_E = _sroa_22.E;
                    const _sroa_23 = axis_flux({ rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E });
                    const FL_f_rho = _sroa_23.f_rho;
                    const FL_f_mn = _sroa_23.f_mn;
                    const FL_f_mt1 = _sroa_23.f_mt1;
                    const FL_f_mt2 = _sroa_23.f_mt2;
                    const FL_f_E = _sroa_23.f_E;
                    const FL_f_bt1 = _sroa_23.f_bt1;
                    const FL_f_bt2 = _sroa_23.f_bt2;
                    const _sroa_24 = axis_flux({ rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E });
                    const FR_f_rho = _sroa_24.f_rho;
                    const FR_f_mn = _sroa_24.f_mn;
                    const FR_f_mt1 = _sroa_24.f_mt1;
                    const FR_f_mt2 = _sroa_24.f_mt2;
                    const FR_f_E = _sroa_24.f_E;
                    const FR_f_bt1 = _sroa_24.f_bt1;
                    const FR_f_bt2 = _sroa_24.f_bt2;
                    const cfL = fast_mag_speed({ rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz }, g, axis, pf);
                    const cfR = fast_mag_speed({ rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz }, g, axis, pf);
                    const SL = (((AR_un - cfR)) < ((AL_un - cfL)) ? ((AR_un - cfR)) : ((AL_un - cfL)));
                    const SR = (((AL_un + cfL)) < ((AR_un + cfR)) ? ((AR_un + cfR)) : ((AL_un + cfL)));
                    const rcL_pre = (AL_rho * ((SL - AL_un)));
                    const rcR_pre = (AR_rho * ((SR - AR_un)));
                    const SM_den_pre = (rcR_pre - rcL_pre);
                    const SM_face = ((((((rcR_pre * AR_un) - (rcL_pre * AL_un)) - AR_pT) + AL_pT)) / ((Math.abs(SM_den_pre) < 1.0e-30) ? (Math.sign(SM_den_pre) * 1.0e-12) : SM_den_pre));
                    const dst = idx_r;
                    if ((SL >= 0.0)) {
                        const _sroa_25 = pack_flux({ f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 }, axis);
                        const pfL_f0_x = _sroa_25.f0.x;
                        const pfL_f0_y = _sroa_25.f0.y;
                        const pfL_f0_z = _sroa_25.f0.z;
                        const pfL_f0_w = _sroa_25.f0.w;
                        const pfL_f1_x = _sroa_25.f1.x;
                        const pfL_f1_y = _sroa_25.f1.y;
                        const pfL_f1_z = _sroa_25.f1.z;
                        const pfL_f1_w = _sroa_25.f1.w;
                        const pfL_fBt1 = _sroa_25.fBt1;
                        const pfL_fBt2 = _sroa_25.fBt2;
                        {
                            const _ftmp = rt.vec4(pfL_f0_x, pfL_f0_y, pfL_f0_z, pfL_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfL_f1_x, pfL_f1_y, pfL_f1_z, pfL_f1_w).x;
                            const _wt1 = rt.vec4(pfL_f1_x, pfL_f1_y, pfL_f1_z, pfL_f1_w).y;
                            const _wt2 = pfL_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    if ((SR <= 0.0)) {
                        const _sroa_26 = pack_flux({ f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 }, axis);
                        const pfR_f0_x = _sroa_26.f0.x;
                        const pfR_f0_y = _sroa_26.f0.y;
                        const pfR_f0_z = _sroa_26.f0.z;
                        const pfR_f0_w = _sroa_26.f0.w;
                        const pfR_f1_x = _sroa_26.f1.x;
                        const pfR_f1_y = _sroa_26.f1.y;
                        const pfR_f1_z = _sroa_26.f1.z;
                        const pfR_f1_w = _sroa_26.f1.w;
                        const pfR_fBt1 = _sroa_26.fBt1;
                        const pfR_fBt2 = _sroa_26.fBt2;
                        {
                            const _ftmp = rt.vec4(pfR_f0_x, pfR_f0_y, pfR_f0_z, pfR_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfR_f1_x, pfR_f1_y, pfR_f1_z, pfR_f1_w).x;
                            const _wt1 = rt.vec4(pfR_f1_x, pfR_f1_y, pfR_f1_z, pfR_f1_w).y;
                            const _wt2 = pfR_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    if (((SR - SL) < (HLLD_WS_TOL * (((Math.abs(SR) + Math.abs(SL)) + 1.0e-12))))) {
                        let hin_QL = null;
                        let hin_QR = null;
                        let hin_AL = null;
                        let hin_AR = null;
                        let hin_FL = null;
                        let hin_FR = null;
                        let hin_SL = 0;
                        let hin_SR = 0;
                        hin_QL = { rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz };
                        hin_QR = { rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz };
                        hin_AL = { rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E };
                        hin_AR = { rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E };
                        hin_FL = { f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 };
                        hin_FR = { f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 };
                        hin_SL = SL;
                        hin_SR = SR;
                        const _sroa_27 = hll_flux_mhd({ QL: hin_QL, QR: hin_QR, AL: hin_AL, AR: hin_AR, FL: hin_FL, FR: hin_FR, SL: hin_SL, SR: hin_SR }, axis, g);
                        const h_f0_x = _sroa_27.f0.x;
                        const h_f0_y = _sroa_27.f0.y;
                        const h_f0_z = _sroa_27.f0.z;
                        const h_f0_w = _sroa_27.f0.w;
                        const h_f1_x = _sroa_27.f1.x;
                        const h_f1_y = _sroa_27.f1.y;
                        const h_f1_z = _sroa_27.f1.z;
                        const h_f1_w = _sroa_27.f1.w;
                        const h_fBt1 = _sroa_27.fBt1;
                        const h_fBt2 = _sroa_27.fBt2;
                        {
                            const _ftmp = rt.vec4(h_f0_x, h_f0_y, h_f0_z, h_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).x;
                            const _wt1 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).y;
                            const _wt2 = h_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const SM = SM_face;
                    const pT_star = (AL_pT + ((AL_rho * ((SL - AL_un))) * ((SM - AL_un))));
                    if ((pT_star <= pf)) {
                        let hin_QL = null;
                        let hin_QR = null;
                        let hin_AL = null;
                        let hin_AR = null;
                        let hin_FL = null;
                        let hin_FR = null;
                        let hin_SL = 0;
                        let hin_SR = 0;
                        hin_QL = { rho: QL_rho, vx: QL_vx, vy: QL_vy, vz: QL_vz, p: QL_p, bx: QL_bx, by: QL_by, bz: QL_bz };
                        hin_QR = { rho: QR_rho, vx: QR_vx, vy: QR_vy, vz: QR_vz, p: QR_p, bx: QR_bx, by: QR_by, bz: QR_bz };
                        hin_AL = { rho: AL_rho, un: AL_un, ut1: AL_ut1, ut2: AL_ut2, bn: AL_bn, bt1: AL_bt1, bt2: AL_bt2, p: AL_p, pT: AL_pT, E: AL_E };
                        hin_AR = { rho: AR_rho, un: AR_un, ut1: AR_ut1, ut2: AR_ut2, bn: AR_bn, bt1: AR_bt1, bt2: AR_bt2, p: AR_p, pT: AR_pT, E: AR_E };
                        hin_FL = { f_rho: FL_f_rho, f_mn: FL_f_mn, f_mt1: FL_f_mt1, f_mt2: FL_f_mt2, f_E: FL_f_E, f_bt1: FL_f_bt1, f_bt2: FL_f_bt2 };
                        hin_FR = { f_rho: FR_f_rho, f_mn: FR_f_mn, f_mt1: FR_f_mt1, f_mt2: FR_f_mt2, f_E: FR_f_E, f_bt1: FR_f_bt1, f_bt2: FR_f_bt2 };
                        hin_SL = SL;
                        hin_SR = SR;
                        const _sroa_28 = hll_flux_mhd({ QL: hin_QL, QR: hin_QR, AL: hin_AL, AR: hin_AR, FL: hin_FL, FR: hin_FR, SL: hin_SL, SR: hin_SR }, axis, g);
                        const h_f0_x = _sroa_28.f0.x;
                        const h_f0_y = _sroa_28.f0.y;
                        const h_f0_z = _sroa_28.f0.z;
                        const h_f0_w = _sroa_28.f0.w;
                        const h_f1_x = _sroa_28.f1.x;
                        const h_f1_y = _sroa_28.f1.y;
                        const h_f1_z = _sroa_28.f1.z;
                        const h_f1_w = _sroa_28.f1.w;
                        const h_fBt1 = _sroa_28.fBt1;
                        const h_fBt2 = _sroa_28.fBt2;
                        {
                            const _ftmp = rt.vec4(h_f0_x, h_f0_y, h_f0_z, h_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).x;
                            const _wt1 = rt.vec4(h_f1_x, h_f1_y, h_f1_z, h_f1_w).y;
                            const _wt2 = h_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const bn2 = (b_normal * b_normal);
                    const rho_scale = (((0.5 * ((AL_rho + AR_rho)))) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : ((0.5 * ((AL_rho + AR_rho)))));
                    const half_dS = (0.5 * ((SR - SL)));
                    const branchA = (bn2 < (((HLLD_BX_EPS2 * rho_scale) * half_dS) * half_dS));
                    if (branchA) {
                        const denom_L = (((-1.0e-20)) < ((SL - SM)) ? ((-1.0e-20)) : ((SL - SM)));
                        const denom_R = (((SR - SM)) < (1.0e-20) ? (1.0e-20) : ((SR - SM)));
                        const rhoLs = ((AL_rho * ((SL - AL_un))) / denom_L);
                        const rhoRs = ((AR_rho * ((SR - AR_un))) / denom_R);
                        const E_Ls = (((((((SL - AL_un)) * AL_E) - (AL_pT * AL_un)) + (pT_star * SM))) / ((SL - SM)));
                        const E_Rs = (((((((SR - AR_un)) * AR_E) - (AR_pT * AR_un)) + (pT_star * SM))) / ((SR - SM)));
                        let Fout_f_rho = 0;
                        let Fout_f_mn = 0;
                        let Fout_f_mt1 = 0;
                        let Fout_f_mt2 = 0;
                        let Fout_f_E = 0;
                        let Fout_f_bt1 = 0;
                        let Fout_f_bt2 = 0;
                        if ((SM >= 0.0)) {
                            Fout_f_rho = (FL_f_rho + (SL * ((rhoLs - AL_rho))));
                            Fout_f_mn = (FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un)))));
                            Fout_f_mt1 = (FL_f_mt1 + (SL * (((rhoLs * AL_ut1) - (AL_rho * AL_ut1)))));
                            Fout_f_mt2 = (FL_f_mt2 + (SL * (((rhoLs * AL_ut2) - (AL_rho * AL_ut2)))));
                            Fout_f_E = (FL_f_E + (SL * ((E_Ls - AL_E))));
                            Fout_f_bt1 = (FL_f_bt1 + (SL * ((((AL_bt1 * ((SL - AL_un))) / ((SL - SM))) - AL_bt1))));
                            Fout_f_bt2 = (FL_f_bt2 + (SL * ((((AL_bt2 * ((SL - AL_un))) / ((SL - SM))) - AL_bt2))));
                        } else {
                            Fout_f_rho = (FR_f_rho + (SR * ((rhoRs - AR_rho))));
                            Fout_f_mn = (FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un)))));
                            Fout_f_mt1 = (FR_f_mt1 + (SR * (((rhoRs * AR_ut1) - (AR_rho * AR_ut1)))));
                            Fout_f_mt2 = (FR_f_mt2 + (SR * (((rhoRs * AR_ut2) - (AR_rho * AR_ut2)))));
                            Fout_f_E = (FR_f_E + (SR * ((E_Rs - AR_E))));
                            Fout_f_bt1 = (FR_f_bt1 + (SR * ((((AR_bt1 * ((SR - AR_un))) / ((SR - SM))) - AR_bt1))));
                            Fout_f_bt2 = (FR_f_bt2 + (SR * ((((AR_bt2 * ((SR - AR_un))) / ((SR - SM))) - AR_bt2))));
                        }
                        const _sroa_29 = pack_flux({ f_rho: Fout_f_rho, f_mn: Fout_f_mn, f_mt1: Fout_f_mt1, f_mt2: Fout_f_mt2, f_E: Fout_f_E, f_bt1: Fout_f_bt1, f_bt2: Fout_f_bt2 }, axis);
                        const pfA_f0_x = _sroa_29.f0.x;
                        const pfA_f0_y = _sroa_29.f0.y;
                        const pfA_f0_z = _sroa_29.f0.z;
                        const pfA_f0_w = _sroa_29.f0.w;
                        const pfA_f1_x = _sroa_29.f1.x;
                        const pfA_f1_y = _sroa_29.f1.y;
                        const pfA_f1_z = _sroa_29.f1.z;
                        const pfA_f1_w = _sroa_29.f1.w;
                        const pfA_fBt1 = _sroa_29.fBt1;
                        const pfA_fBt2 = _sroa_29.fBt2;
                        {
                            const _ftmp = rt.vec4(pfA_f0_x, pfA_f0_y, pfA_f0_z, pfA_f0_w);
                            const _wbase = ((dst) * 4 + 0);
                            _b_flux_0[_wbase + 0] = _ftmp.x;
                            _b_flux_0[_wbase + 1] = _ftmp.y;
                            _b_flux_0[_wbase + 2] = _ftmp.z;
                            _b_flux_0[_wbase + 3] = _ftmp.w;
                        }
                        {
                            const _wbase = ((dst) * 4 + 0);
                            const _wt0 = rt.vec4(pfA_f1_x, pfA_f1_y, pfA_f1_z, pfA_f1_w).x;
                            const _wt1 = rt.vec4(pfA_f1_x, pfA_f1_y, pfA_f1_z, pfA_f1_w).y;
                            const _wt2 = pfA_fBt1;
                            const _wt3 = SM_face;
                            _b_flux_1[_wbase + 0] = _wt0;
                            _b_flux_1[_wbase + 1] = _wt1;
                            _b_flux_1[_wbase + 2] = _wt2;
                            _b_flux_1[_wbase + 3] = _wt3;
                        }
                        break __invocation;
                    }
                    const dL = (((-1.0e-20)) < ((SL - SM)) ? ((-1.0e-20)) : ((SL - SM)));
                    const dR = (((SR - SM)) < (1.0e-20) ? (1.0e-20) : ((SR - SM)));
                    const rhoLs = ((AL_rho * ((SL - AL_un))) / dL);
                    const rhoRs = ((AR_rho * ((SR - AR_un))) / dR);
                    const denomL_raw = (((AL_rho * ((SL - AL_un))) * ((SL - SM))) - bn2);
                    const denomR_raw = (((AR_rho * ((SR - AR_un))) * ((SR - SM))) - bn2);
                    const safeDL = ((Math.abs(denomL_raw) < 1.0e-20) ? 1.0e-20 : denomL_raw);
                    const safeDR = ((Math.abs(denomR_raw) < 1.0e-20) ? 1.0e-20 : denomR_raw);
                    const g_L = (((AL_rho * ((SL - AL_un))) * ((SL - AL_un))) - bn2);
                    const g_R = (((AR_rho * ((SR - AR_un))) * ((SR - AR_un))) - bn2);
                    const ut1_Ls = (AL_ut1 - (((b_normal * AL_bt1) * ((SM - AL_un))) / safeDL));
                    const ut2_Ls = (AL_ut2 - (((b_normal * AL_bt2) * ((SM - AL_un))) / safeDL));
                    const ut1_Rs = (AR_ut1 - (((b_normal * AR_bt1) * ((SM - AR_un))) / safeDR));
                    const ut2_Rs = (AR_ut2 - (((b_normal * AR_bt2) * ((SM - AR_un))) / safeDR));
                    const bt1_Ls = ((AL_bt1 * g_L) / safeDL);
                    const bt2_Ls = ((AL_bt2 * g_L) / safeDL);
                    const bt1_Rs = ((AR_bt1 * g_R) / safeDR);
                    const bt2_Rs = ((AR_bt2 * g_R) / safeDR);
                    const vdotb_L = (((AL_un * b_normal) + (AL_ut1 * AL_bt1)) + (AL_ut2 * AL_bt2));
                    const vdotb_R = (((AR_un * b_normal) + (AR_ut1 * AR_bt1)) + (AR_ut2 * AR_bt2));
                    const vdotbLs = (((SM * b_normal) + (ut1_Ls * bt1_Ls)) + (ut2_Ls * bt2_Ls));
                    const vdotbRs = (((SM * b_normal) + (ut1_Rs * bt1_Rs)) + (ut2_Rs * bt2_Rs));
                    const E_Ls = ((((((((SL - AL_un)) * AL_E) - (AL_pT * AL_un)) + (pT_star * SM)) + (b_normal * ((vdotb_L - vdotbLs))))) / ((SL - SM)));
                    const E_Rs = ((((((((SR - AR_un)) * AR_E) - (AR_pT * AR_un)) + (pT_star * SM)) + (b_normal * ((vdotb_R - vdotbRs))))) / ((SR - SM)));
                    const absBn = Math.abs(b_normal);
                    const SLs = (SM - (absBn / Math.sqrt(((rhoLs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoLs)))));
                    const SRs = (SM + (absBn / Math.sqrt(((rhoRs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoRs)))));
                    const srL = Math.sqrt(((rhoLs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoLs)));
                    const srR = Math.sqrt(((rhoRs) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (rhoRs)));
                    const srSum = (srL + srR);
                    const sgnBn = ((b_normal >= 0.0) ? 1.0 : (-1.0));
                    const ut1_ss = (((((srL * ut1_Ls) + (srR * ut1_Rs)) + (((bt1_Rs - bt1_Ls)) * sgnBn))) / srSum);
                    const ut2_ss = (((((srL * ut2_Ls) + (srR * ut2_Rs)) + (((bt2_Rs - bt2_Ls)) * sgnBn))) / srSum);
                    const bt1_ss = (((((srL * bt1_Rs) + (srR * bt1_Ls)) + (((srL * srR) * ((ut1_Rs - ut1_Ls))) * sgnBn))) / srSum);
                    const bt2_ss = (((((srL * bt2_Rs) + (srR * bt2_Ls)) + (((srL * srR) * ((ut2_Rs - ut2_Ls))) * sgnBn))) / srSum);
                    const vdotb_ss = (((SM * b_normal) + (ut1_ss * bt1_ss)) + (ut2_ss * bt2_ss));
                    const E_Lss = (E_Ls - ((srL * sgnBn) * ((vdotbLs - vdotb_ss))));
                    const E_Rss = (E_Rs + ((srR * sgnBn) * ((vdotbRs - vdotb_ss))));
                    let Fout_f_rho = 0;
                    let Fout_f_mn = 0;
                    let Fout_f_mt1 = 0;
                    let Fout_f_mt2 = 0;
                    let Fout_f_E = 0;
                    let Fout_f_bt1 = 0;
                    let Fout_f_bt2 = 0;
                    if ((SLs >= 0.0)) {
                        Fout_f_rho = (FL_f_rho + (SL * ((rhoLs - AL_rho))));
                        Fout_f_mn = (FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un)))));
                        Fout_f_mt1 = (FL_f_mt1 + (SL * (((rhoLs * ut1_Ls) - (AL_rho * AL_ut1)))));
                        Fout_f_mt2 = (FL_f_mt2 + (SL * (((rhoLs * ut2_Ls) - (AL_rho * AL_ut2)))));
                        Fout_f_E = (FL_f_E + (SL * ((E_Ls - AL_E))));
                        Fout_f_bt1 = (FL_f_bt1 + (SL * ((bt1_Ls - AL_bt1))));
                        Fout_f_bt2 = (FL_f_bt2 + (SL * ((bt2_Ls - AL_bt2))));
                    } else if ((SM >= 0.0)) {
                        Fout_f_rho = ((FL_f_rho + (SL * ((rhoLs - AL_rho)))) + (SLs * ((rhoLs - rhoLs))));
                        Fout_f_mn = ((FL_f_mn + (SL * (((rhoLs * SM) - (AL_rho * AL_un))))) + (SLs * (((rhoLs * SM) - (rhoLs * SM)))));
                        Fout_f_mt1 = ((FL_f_mt1 + (SL * (((rhoLs * ut1_Ls) - (AL_rho * AL_ut1))))) + (SLs * (((rhoLs * ut1_ss) - (rhoLs * ut1_Ls)))));
                        Fout_f_mt2 = ((FL_f_mt2 + (SL * (((rhoLs * ut2_Ls) - (AL_rho * AL_ut2))))) + (SLs * (((rhoLs * ut2_ss) - (rhoLs * ut2_Ls)))));
                        Fout_f_E = ((FL_f_E + (SL * ((E_Ls - AL_E)))) + (SLs * ((E_Lss - E_Ls))));
                        Fout_f_bt1 = ((FL_f_bt1 + (SL * ((bt1_Ls - AL_bt1)))) + (SLs * ((bt1_ss - bt1_Ls))));
                        Fout_f_bt2 = ((FL_f_bt2 + (SL * ((bt2_Ls - AL_bt2)))) + (SLs * ((bt2_ss - bt2_Ls))));
                    } else if ((SRs >= 0.0)) {
                        Fout_f_rho = ((FR_f_rho + (SR * ((rhoRs - AR_rho)))) + (SRs * ((rhoRs - rhoRs))));
                        Fout_f_mn = ((FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un))))) + (SRs * (((rhoRs * SM) - (rhoRs * SM)))));
                        Fout_f_mt1 = ((FR_f_mt1 + (SR * (((rhoRs * ut1_Rs) - (AR_rho * AR_ut1))))) + (SRs * (((rhoRs * ut1_ss) - (rhoRs * ut1_Rs)))));
                        Fout_f_mt2 = ((FR_f_mt2 + (SR * (((rhoRs * ut2_Rs) - (AR_rho * AR_ut2))))) + (SRs * (((rhoRs * ut2_ss) - (rhoRs * ut2_Rs)))));
                        Fout_f_E = ((FR_f_E + (SR * ((E_Rs - AR_E)))) + (SRs * ((E_Rss - E_Rs))));
                        Fout_f_bt1 = ((FR_f_bt1 + (SR * ((bt1_Rs - AR_bt1)))) + (SRs * ((bt1_ss - bt1_Rs))));
                        Fout_f_bt2 = ((FR_f_bt2 + (SR * ((bt2_Rs - AR_bt2)))) + (SRs * ((bt2_ss - bt2_Rs))));
                    } else {
                        Fout_f_rho = (FR_f_rho + (SR * ((rhoRs - AR_rho))));
                        Fout_f_mn = (FR_f_mn + (SR * (((rhoRs * SM) - (AR_rho * AR_un)))));
                        Fout_f_mt1 = (FR_f_mt1 + (SR * (((rhoRs * ut1_Rs) - (AR_rho * AR_ut1)))));
                        Fout_f_mt2 = (FR_f_mt2 + (SR * (((rhoRs * ut2_Rs) - (AR_rho * AR_ut2)))));
                        Fout_f_E = (FR_f_E + (SR * ((E_Rs - AR_E))));
                        Fout_f_bt1 = (FR_f_bt1 + (SR * ((bt1_Rs - AR_bt1))));
                        Fout_f_bt2 = (FR_f_bt2 + (SR * ((bt2_Rs - AR_bt2))));
                    }
                    const _sroa_30 = pack_flux({ f_rho: Fout_f_rho, f_mn: Fout_f_mn, f_mt1: Fout_f_mt1, f_mt2: Fout_f_mt2, f_E: Fout_f_E, f_bt1: Fout_f_bt1, f_bt2: Fout_f_bt2 }, axis);
                    const pfH_f0_x = _sroa_30.f0.x;
                    const pfH_f0_y = _sroa_30.f0.y;
                    const pfH_f0_z = _sroa_30.f0.z;
                    const pfH_f0_w = _sroa_30.f0.w;
                    const pfH_f1_x = _sroa_30.f1.x;
                    const pfH_f1_y = _sroa_30.f1.y;
                    const pfH_f1_z = _sroa_30.f1.z;
                    const pfH_f1_w = _sroa_30.f1.w;
                    const pfH_fBt1 = _sroa_30.fBt1;
                    const pfH_fBt2 = _sroa_30.fBt2;
                    {
                        const _ftmp = rt.vec4(pfH_f0_x, pfH_f0_y, pfH_f0_z, pfH_f0_w);
                        const _wbase = ((dst) * 4 + 0);
                        _b_flux_0[_wbase + 0] = _ftmp.x;
                        _b_flux_0[_wbase + 1] = _ftmp.y;
                        _b_flux_0[_wbase + 2] = _ftmp.z;
                        _b_flux_0[_wbase + 3] = _ftmp.w;
                    }
                    {
                        const _wbase = ((dst) * 4 + 0);
                        const _wt0 = rt.vec4(pfH_f1_x, pfH_f1_y, pfH_f1_z, pfH_f1_w).x;
                        const _wt1 = rt.vec4(pfH_f1_x, pfH_f1_y, pfH_f1_z, pfH_f1_w).y;
                        const _wt2 = pfH_fBt1;
                        const _wt3 = SM_face;
                        _b_flux_1[_wbase + 0] = _wt0;
                        _b_flux_1[_wbase + 1] = _wt1;
                        _b_flux_1[_wbase + 2] = _wt2;
                        _b_flux_1[_wbase + 3] = _wt3;
                    }
                }
            }
        }
    };

    return { entry, bindings: ["U_uniforms","U0_in","U1_in","Bx_face","By_face","edge_l_0","edge_l_1","edge_r_0","edge_r_1","flux_0","flux_1","sweep"] };
}
