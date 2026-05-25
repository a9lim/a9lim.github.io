// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.
// source: plasma/src/gpu/shaders/composite.wgsl
// helpers-sha256: b91e2ee1e6d4fdceaccac2b8f5db37fbde9a5d2b76ef88f1977bbfcf6e6e2833
// wgsl-transpile sha256: 4a500d6ab66a477fca68bef716e58903a829f208b58202c19eb173776189a1f8
// wgsl-opts: {"flatStorage":true,"collectErrors":true}
// generated: 2026-05-25T23:39:36.662Z
export default function _wgsl_module(rt) {
    const BC_PERIODIC = 0;
    const BC_OUTFLOW = 1;
    const BC_REFLECTING = 2;
    const BC_DRIVEN = 3;
    const DENSITY_FLOOR = 1.0e-6;

    const entry = Object.create(null);

    return { entry, bindings: ["U_uniforms","colored","lic_out","lic_u"] };
}
