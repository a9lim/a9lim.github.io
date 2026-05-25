// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/apply-bcs.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: cb93df1d649b7c3363de8d86749c8635c261dee08dfd3e638a0e1142f361eb16
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.657Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

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

    function driven_cons() {
        let P_rho = 0;
        let P_vx = 0;
        let P_vy = 0;
        let P_vz = 0;
        let P_p = 0;
        let P_bx = 0;
        let P_by = 0;
        let P_bz = 0;
        P_rho = ((bindings.bc.driven_rho) < (DENSITY_FLOOR) ? (DENSITY_FLOOR) : (bindings.bc.driven_rho));
        P_vx = bindings.bc.driven_vx;
        P_vy = bindings.bc.driven_vy;
        P_vz = bindings.bc.driven_vz;
        P_p = ((bindings.bc.driven_p) < (bindings.U_uniforms.pressure_floor) ? (bindings.U_uniforms.pressure_floor) : (bindings.bc.driven_p));
        P_bx = bindings.bc.driven_bx;
        P_by = bindings.bc.driven_by;
        P_bz = bindings.bc.driven_bz;
        const _sroa_0 = prim_to_cons_pair({ rho: P_rho, vx: P_vx, vy: P_vy, vz: P_vz, p: P_p, bx: P_bx, by: P_by, bz: P_bz }, bindings.U_uniforms.gamma, bindings.U_uniforms.pressure_floor);
        const cp_U0_x = _sroa_0.U0.x;
        const cp_U0_y = _sroa_0.U0.y;
        const cp_U0_z = _sroa_0.U0.z;
        const cp_U0_w = _sroa_0.U0.w;
        const cp_U1_x = _sroa_0.U1.x;
        const cp_U1_y = _sroa_0.U1.y;
        const cp_U1_z = _sroa_0.U1.z;
        const cp_U1_w = _sroa_0.U1.w;
        return [rt.vec4(cp_U0_x, cp_U0_y, cp_U0_z, cp_U0_w), rt.vec4(cp_U1_x, cp_U1_y, cp_U1_z, cp_U1_w)];
    }

    function fill_cell_ghost(ix, iy, ghost, n_interior, n_total) {
        let _inl_4_result;
        _inl_4: {
            if ((ix < ghost)) {
                _inl_4_result = bindings.bc.mode_w;
                break _inl_4;
            }
            if ((ix >= (ghost + n_interior))) {
                _inl_4_result = bindings.bc.mode_e;
                break _inl_4;
            }
            _inl_4_result = BC_PERIODIC;
            break _inl_4;
        }
        const h_mode = _inl_4_result;
        let _inl_5_result;
        _inl_5: {
            if ((iy < ghost)) {
                _inl_5_result = bindings.bc.mode_s;
                break _inl_5;
            }
            if ((iy >= (ghost + n_interior))) {
                _inl_5_result = bindings.bc.mode_n;
                break _inl_5;
            }
            _inl_5_result = BC_PERIODIC;
            break _inl_5;
        }
        const v_mode = _inl_5_result;
        const in_h_ghost = (((ix < ghost)) || ((ix >= (ghost + n_interior))));
        const in_v_ghost = (((iy < ghost)) || ((iy >= (ghost + n_interior))));
        if (((!in_h_ghost) && (!in_v_ghost))) {
            return;
        }
        let mode = 0;
        if ((in_h_ghost && in_v_ghost)) {
            let _inl_6_result;
            _inl_6: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_6_result = h_mode;
                    break _inl_6;
                }
                _inl_6_result = v_mode;
                break _inl_6;
            }
            mode = _inl_6_result;
        } else if (in_h_ghost) {
            mode = h_mode;
        } else {
            mode = v_mode;
        }
        let _inl_7_result;
        _inl_7: {
            _inl_7_result = ((iy * n_total) + ix);
            break _inl_7;
        }
        const dst = _inl_7_result;
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
            let _inl_8_result;
            _inl_8: {
                _inl_8_result = ((src_j * n_total) + src_i);
                break _inl_8;
            }
            const src = _inl_8_result;
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
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = ghost;
            } else if ((ix >= (ghost + n_interior))) {
                src_i = ((ghost + n_interior) - 1);
            }
            if ((iy < ghost)) {
                src_j = ghost;
            } else if ((iy >= (ghost + n_interior))) {
                src_j = ((ghost + n_interior) - 1);
            }
            let _inl_9_result;
            _inl_9: {
                _inl_9_result = ((src_j * n_total) + src_i);
                break _inl_9;
            }
            const src = _inl_9_result;
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
            let _inl_10_result;
            _inl_10: {
                _inl_10_result = ((src_j * n_total) + src_i);
                break _inl_10;
            }
            const src = _inl_10_result;
            const _sroa_1_base = ((src) * 4 + 0);
            let u0_x = bindings.U0[_sroa_1_base + 0];
            let u0_y = bindings.U0[_sroa_1_base + 1];
            let u0_z = bindings.U0[_sroa_1_base + 2];
            let u0_w = bindings.U0[_sroa_1_base + 3];
            const _sroa_2_base = ((src) * 4 + 0);
            let u1_x = bindings.U1[_sroa_2_base + 0];
            let u1_y = bindings.U1[_sroa_2_base + 1];
            let u1_z = bindings.U1[_sroa_2_base + 2];
            let u1_w = bindings.U1[_sroa_2_base + 3];
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
        const cons = driven_cons();
        {
            const _ftmp = cons[0];
            const _wbase = ((dst) * 4 + 0);
            bindings.U0[_wbase + 0] = _ftmp.x;
            bindings.U0[_wbase + 1] = _ftmp.y;
            bindings.U0[_wbase + 2] = _ftmp.z;
            bindings.U0[_wbase + 3] = _ftmp.w;
        }
        {
            const _ftmp = cons[1];
            const _wbase = ((dst) * 4 + 0);
            bindings.U1[_wbase + 0] = _ftmp.x;
            bindings.U1[_wbase + 1] = _ftmp.y;
            bindings.U1[_wbase + 2] = _ftmp.z;
            bindings.U1[_wbase + 3] = _ftmp.w;
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
        let _inl_11_result;
        _inl_11: {
            if ((ix < ghost)) {
                _inl_11_result = bindings.bc.mode_w;
                break _inl_11;
            }
            if ((ix >= (ghost + n_interior))) {
                _inl_11_result = bindings.bc.mode_e;
                break _inl_11;
            }
            _inl_11_result = BC_PERIODIC;
            break _inl_11;
        }
        const h_mode = _inl_11_result;
        let _inl_12_result;
        _inl_12: {
            if ((iy < ghost)) {
                _inl_12_result = bindings.bc.mode_s;
                break _inl_12;
            }
            if ((iy >= (ghost + n_interior))) {
                _inl_12_result = bindings.bc.mode_n;
                break _inl_12;
            }
            _inl_12_result = BC_PERIODIC;
            break _inl_12;
        }
        const v_mode = _inl_12_result;
        let mode = 0;
        if (on_w_wall) {
            mode = bindings.bc.mode_w;
        } else if (on_e_wall) {
            mode = bindings.bc.mode_e;
        } else if ((in_h_ghost && in_v_ghost)) {
            let _inl_13_result;
            _inl_13: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_13_result = h_mode;
                    break _inl_13;
                }
                _inl_13_result = v_mode;
                break _inl_13;
            }
            mode = _inl_13_result;
        } else if (in_h_ghost) {
            mode = h_mode;
        } else {
            mode = v_mode;
        }
        let _inl_14_result;
        _inl_14: {
            _inl_14_result = ((iy * ((n_total + 1))) + ix);
            break _inl_14;
        }
        const dst = _inl_14_result;
        if ((mode == BC_PERIODIC)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = (ix + n_interior);
            } else if ((ix > (ghost + n_interior))) {
                src_i = (ix - n_interior);
            }
            if ((iy < ghost)) {
                src_j = (iy + n_interior);
            } else if ((iy >= (ghost + n_interior))) {
                src_j = (iy - n_interior);
            }
            if ((on_w_wall || on_e_wall)) {
                src_i = ghost;
            }
            let _inl_15_result;
            _inl_15: {
                _inl_15_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_15;
            }
            bindings.Bx_face[dst] = bindings.Bx_face[_inl_15_result];
            return;
        }
        if ((mode == BC_OUTFLOW)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = ghost;
            } else if ((ix > (ghost + n_interior))) {
                src_i = (ghost + n_interior);
            }
            if ((iy < ghost)) {
                src_j = ghost;
            } else if ((iy >= (ghost + n_interior))) {
                src_j = ((ghost + n_interior) - 1);
            }
            let _inl_16_result;
            _inl_16: {
                _inl_16_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_16;
            }
            bindings.Bx_face[dst] = bindings.Bx_face[_inl_16_result];
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
            let _inl_17_result;
            _inl_17: {
                _inl_17_result = ((src_j * ((n_total + 1))) + src_i);
                break _inl_17;
            }
            let v = bindings.Bx_face[_inl_17_result];
            if (flip) {
                v = (-v);
            }
            bindings.Bx_face[dst] = v;
            return;
        }
        bindings.Bx_face[dst] = bindings.bc.driven_bx;
    }

    function fill_by_face(ix, iy, ghost, n_interior, n_total) {
        const in_v_ghost = (((iy < ghost)) || ((iy > (ghost + n_interior))));
        const on_s_wall = ((iy == ghost));
        const on_n_wall = ((iy == (ghost + n_interior)));
        const in_h_ghost = (((ix < ghost)) || ((ix >= (ghost + n_interior))));
        if (((((!in_v_ghost) && (!on_s_wall)) && (!on_n_wall)) && (!in_h_ghost))) {
            return;
        }
        let _inl_18_result;
        _inl_18: {
            if ((ix < ghost)) {
                _inl_18_result = bindings.bc.mode_w;
                break _inl_18;
            }
            if ((ix >= (ghost + n_interior))) {
                _inl_18_result = bindings.bc.mode_e;
                break _inl_18;
            }
            _inl_18_result = BC_PERIODIC;
            break _inl_18;
        }
        const h_mode = _inl_18_result;
        let _inl_19_result;
        _inl_19: {
            if ((iy < ghost)) {
                _inl_19_result = bindings.bc.mode_s;
                break _inl_19;
            }
            if ((iy >= (ghost + n_interior))) {
                _inl_19_result = bindings.bc.mode_n;
                break _inl_19;
            }
            _inl_19_result = BC_PERIODIC;
            break _inl_19;
        }
        const v_mode = _inl_19_result;
        let mode = 0;
        if (on_s_wall) {
            mode = bindings.bc.mode_s;
        } else if (on_n_wall) {
            mode = bindings.bc.mode_n;
        } else if ((in_h_ghost && in_v_ghost)) {
            let _inl_20_result;
            _inl_20: {
                if ((h_mode != BC_PERIODIC)) {
                    _inl_20_result = h_mode;
                    break _inl_20;
                }
                _inl_20_result = v_mode;
                break _inl_20;
            }
            mode = _inl_20_result;
        } else if (in_v_ghost) {
            mode = v_mode;
        } else {
            mode = h_mode;
        }
        let _inl_21_result;
        _inl_21: {
            _inl_21_result = ((iy * n_total) + ix);
            break _inl_21;
        }
        const dst = _inl_21_result;
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
            } else if ((iy > (ghost + n_interior))) {
                src_j = (iy - n_interior);
            }
            if ((on_s_wall || on_n_wall)) {
                src_j = ghost;
            }
            let _inl_22_result;
            _inl_22: {
                _inl_22_result = ((src_j * n_total) + src_i);
                break _inl_22;
            }
            bindings.By_face[dst] = bindings.By_face[_inl_22_result];
            return;
        }
        if ((mode == BC_OUTFLOW)) {
            let src_i = ix;
            let src_j = iy;
            if ((ix < ghost)) {
                src_i = ghost;
            } else if ((ix >= (ghost + n_interior))) {
                src_i = ((ghost + n_interior) - 1);
            }
            if ((iy < ghost)) {
                src_j = ghost;
            } else if ((iy > (ghost + n_interior))) {
                src_j = (ghost + n_interior);
            }
            let _inl_23_result;
            _inl_23: {
                _inl_23_result = ((src_j * n_total) + src_i);
                break _inl_23;
            }
            bindings.By_face[dst] = bindings.By_face[_inl_23_result];
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
            let _inl_24_result;
            _inl_24: {
                _inl_24_result = ((src_j * n_total) + src_i);
                break _inl_24;
            }
            let v = bindings.By_face[_inl_24_result];
            if (flip) {
                v = (-v);
            }
            bindings.By_face[dst] = v;
            return;
        }
        bindings.By_face[dst] = bindings.bc.driven_by;
    }

    const entry = Object.create(null);

    entry["main"] = function ({ workgroups, bindings }) {
        const [Wx, Wy, Wz] = workgroups;
        const Lx = 8, Ly = 8, Lz = 1;
        const _b_U_uniforms = bindings.U_uniforms;
        const _u_U_uniforms_grid_n = _b_U_uniforms.grid_n;
        const _u_U_uniforms_grid_n_total = _b_U_uniforms.grid_n_total;
        const _u_U_uniforms_ghost_w = _b_U_uniforms.ghost_w;
        const Gx = Wx * Lx, Gy = Wy * Ly, Gz = Wz * Lz;
        if (Gy === 1 && Gz === 1) {
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                const gid_y = 0;
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
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
        } else {
            for (let __gz = 0; __gz < Gz; __gz++)
            for (let gid_y = 0; gid_y < Gy; gid_y++)
            for (let gid_x = 0; gid_x < Gx; gid_x++) {
                __invocation: {
                    const n_total = _u_U_uniforms_grid_n_total;
                    const n_interior = _u_U_uniforms_grid_n;
                    const ghost = _u_U_uniforms_ghost_w;
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
    };

    return { entry, bindings: ["U_uniforms","bc","U0","U1","Bx_face","By_face"] };
}
