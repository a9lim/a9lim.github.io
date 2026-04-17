Geon is an interactive particle physics sim that runs entirely in the browser. It does Newtonian gravity, electromagnetism, post-Newtonian corrections, scalar fields, radiation reaction, and signal delay, all at 128 physics steps per second. No dependencies, no build step. In this post I'll walk through the major systems and the numerical methods I used to make them work.

## Natural units and proper velocity

I use natural units throughout: $c = G = \hbar = 1$. Velocities are stored as **proper velocity** $\mathbf{w} = \gamma \mathbf{v}$, where $\gamma = \sqrt{1 + |\mathbf{w}|^2}$. I like this representation because $|\mathbf{w}|$ can exceed 1 without implying superluminal motion; it's just the spatial component of four-velocity. You recover coordinate velocity as $\mathbf{v} = \mathbf{w} / \gamma$. When relativity is toggled off, $\mathbf{w} \equiv \mathbf{v}$.

Angular quantities work the same way. Spin angular velocity is stored as proper angular velocity $\omega_p$, converted via $\omega = \omega_p / \sqrt{1 + (\omega_p r)^2}$.

## The force model

Each particle pair contributes up to eight force components, all computed per substep:

**Gravity** with Plummer softening: $F_g = m_1 m_2 / r_\text{eff}^2$ where $r_\text{eff}^2 = r^2 + \varepsilon^2$ and $\varepsilon = 8$ (or 4 in Barnes-Hut mode). The softening keeps things from blowing up at close approach without messing with long-range behavior.

**Coulomb** with optional axion modulation: $F_c = -q_1 q_2 / r^2$, repulsive for like charges. When the axion field is on, the fine structure constant becomes position-dependent: $\alpha_\text{eff} = \alpha(1 + g \cdot a(\mathbf{x}))$, where $a(\mathbf{x})$ is the local axion field value.

**Magnetic forces** come from two sources. Moving charges produce a Biot-Savart field $B_z = q_s (\mathbf{v}_s \times \hat{r})_z / r^2$. Spinning charged particles have magnetic dipole moments $\mu = \tfrac{1}{5} q \omega r^2$ that interact via $F = -3\mu_1 \mu_2 / r^4$. The spin gradient $\nabla B_z$ also produces a Stern-Gerlach translational force.

**Gravitomagnetic (frame-dragging)** forces are the gravitational version of magnetism. Co-rotating masses attract: $F = 3L_1 L_2 / r^4$ with angular momentum $L = \tfrac{2}{5} m \omega r^2$. The sign is opposite to EM: aligned gravitational "currents" attract instead of repelling.

**Post-Newtonian corrections** at 1PN order. These velocity-dependent terms capture the leading relativistic corrections to Newtonian gravity. The gravitomagnetic (Einstein-Infeld-Hoffmann) term couples $v^2$ to produce orbital precession. The Darwin term does the magnetic analogue: $F \propto (\mathbf{v}_1 \cdot \mathbf{v}_2 + (\mathbf{v}_1 \cdot \hat{n})(\mathbf{v}_2 \cdot \hat{n}))$. A Bazanski cross-term mixes gravitational and electromagnetic coupling.

**Yukawa interaction** from a massive scalar mediator: $F \propto e^{-\mu r}(1/r^2 + \mu/r)$ with coupling $g^2 = 14$ and default pion mass $\mu = 0.15$. The exponential suppression gives it a finite range $\sim 1/\mu$, unlike gravity or Coulomb. When the Higgs field is on, the mediator mass becomes position-dependent: $\mu_\text{eff} = \mu \sqrt{h_i \cdot h_j}$ where $h = \max(|\varphi(\mathbf{x})|, 0.05)$.

**Radiation reaction** via the Landau-Lifshitz equation:

$$
F_\text{rad} = \tau \left[ \frac{\dot{F}}{\gamma^3} - \gamma \mathbf{v} \frac{F^2 - (\mathbf{v} \cdot \mathbf{F})^2}{m} \right]
$$

where $\tau = \tfrac{2}{3} q^2 / m$ is the Abraham-Lorentz timescale. I compute the jerk $\dot{F}$ analytically from the force derivatives of gravity, Coulomb, Yukawa, and magnetic interactions, so there's no finite-difference approximation.

**Signal delay** (Lienard-Wiechert retardation). When enabled, each force is computed not from the source's current position but from its retarded position on the past light cone. I solve the light-cone equation $|\mathbf{x}_s(t_\text{ret}) - \mathbf{x}_o| = t_\text{now} - t_\text{ret}$ via binary search on a 256-entry circular history buffer, then refine with a quadratic solve on the bracketing segment. The aberration factor $(1 - \hat{n} \cdot \mathbf{v})^{-3}$ is clamped to $[0.01, 100]$ to prevent numerical blowup.

## The Boris integrator

The sim runs on a fixed timestep of $\Delta t = 1/128$ with adaptive substepping up to 32 subdivisions. The safe substep size is:

$$
\Delta t_\text{safe} = \min\left( \sqrt{\frac{\varepsilon}{a_\max}}, \, \frac{2\pi}{8 \omega_c} \right)
$$

where $a_\max$ is the max acceleration across all particles and $\omega_c$ is the max cyclotron frequency from magnetic and gravitomagnetic fields. The first constraint keeps particles from jumping past the softening length; the second resolves magnetic gyration.

Each substep follows the Boris algorithm, which is a symplectic integrator originally designed for charged particles in magnetic fields. It naturally separates electric-like forces (which change speed) from magnetic-like forces (which change direction):

1. **Half-kick**: $\mathbf{w} \leftarrow \mathbf{w} + \tfrac{\Delta t}{2} \mathbf{F}_E / m$ (gravity, Coulomb, Yukawa, external E)
2. **Boris rotation**: Rotate $\mathbf{w}$ around the local magnetic field direction by an angle determined by $\mathbf{B}$. The rotation parameter is $t = (q B_z / 2m + 2 B_{gz}) \Delta t / \gamma$, and the rotation uses $s = 2t / (1 + t^2)$ for exact energy conservation
3. **Second half-kick**: same as step 1
4. **Spin-orbit coupling**: transfer energy between orbital and spin degrees of freedom via $\Delta \omega = -\mu (\mathbf{v} \cdot \nabla B_z) \Delta t / |L|$
5. **Radiation reaction**: apply the Landau-Lifshitz force
6. **Drift**: $\mathbf{r} \leftarrow \mathbf{r} + \mathbf{v} \Delta t$

After the drift, the quadtree gets rebuilt and collisions are resolved before the next substep.

The Boris method is time-reversible and preserves phase-space volume, which basically means it doesn't suffer from the artificial energy drift that plagues naive Euler integration. For a gravity-only two-body problem, you get stable orbits over thousands of periods without any energy correction.

## Barnes-Hut quadtree

Pairwise force computation is $O(n^2)$, which gets painful fast. The Barnes-Hut algorithm brings it down to $O(n \log n)$ by grouping distant particles into multipole approximations.

The tree is a spatial quadtree where each node stores aggregate properties: total mass, total charge, total magnetic moment, total angular momentum, center of mass, and total momentum. When computing the force on a particle, distant nodes where $\ell / d < \theta$ (with opening angle $\theta = 0.5$) get treated as point masses at their center of mass. Closer nodes get recursively opened.

The CPU implementation uses a pool-based structure-of-arrays layout with flat typed arrays for cache efficiency. Each node holds up to 4 particles before subdividing.

The GPU implementation is more interesting. Insertion uses lock-free compare-and-swap (CAS) loops, where each particle atomically claims a position in the tree, subdividing nodes as needed. Aggregate computation uses a bottom-up visitor-flag pattern since there's no call stack on the GPU. The tree gets built in four dispatches: compute bounds, initialize root, insert particles, compute aggregates.

## Scalar fields

There are two scalar fields that live on a grid (64×64 on CPU, 128×128 on GPU), coupled to the particles.

### Higgs field

The Higgs has a Mexican-hat potential $V(\varphi) = -\tfrac{1}{2} \mu^2 \varphi^2 + \tfrac{1}{4} \lambda \varphi^4$ with vacuum expectation value 1. Particles source the field proportional to their base mass, and the local field value modulates the Yukawa mediator mass. This is basically the Higgs mechanism in miniature. Where $|\varphi|$ is large, the Yukawa force is short-range; where $|\varphi| \approx 0$ (near a domain wall or topological defect), the force becomes long-range and particles effectively lose their mass contribution to the Yukawa coupling.

The field evolves via Stormer-Verlet (kick-drift-kick) with a weak-field GR self-gravity correction:

$$
\ddot{\varphi} = (1 + 4\Phi) \nabla^2 \varphi + 2 \nabla\Phi \cdot \nabla\varphi - (1 + 2\Phi) V'(\varphi)
$$

where $\Phi$ is the gravitational potential, computed via FFT convolution. When particles collide and merge, the kinetic energy that gets lost is deposited as a Gaussian wave packet in the field, with amplitude $\propto \sqrt{E_\text{lost}}$ and width of 2 grid cells.

### Axion field

The axion has a simple quadratic potential $V(a) = \tfrac{1}{2} m_a^2 a^2$ with vacuum at zero. It couples to electromagnetism by modifying the fine structure constant: $\alpha_\text{eff} = \alpha(1 + g \cdot a)$. The source term is $g \cdot q^2$ per particle, so charged particles generate the field and the field modulates the Coulomb force.

When Yukawa interactions are also on, the axion acts as a pseudoscalar with a parity-violating coupling: matter sources it with $+g \cdot m$, antimatter with $-g \cdot m$, and the Yukawa coupling becomes $1 \pm g \cdot a$. There's also an optional Higgs-axion portal coupling $V_\text{portal} = \tfrac{1}{2} \lambda_p \varphi^2 a^2$ that lets the two fields interact.

### Grid interpolation

Both fields use PQS (cubic B-spline) interpolation with a 4×4 stencil, which gives you $C^2$-continuous field values and analytically computed gradients. This matters for the force calculation: discontinuous gradients would produce unphysical impulses as particles cross grid cell boundaries. The deposition of particle sources onto the grid uses the same stencil weights, which satisfies Newton's third law between particles and the field.

## The GPU backend

Geon has two interchangeable backends: CPU (JavaScript + typed arrays) and GPU (WebGPU compute + instanced rendering). The GPU path handles 512 particles plus 4096 photons, 1024 pions, and 1280 leptons.

Each physics substep dispatches about 20 compute passes in sequence. The key ones:

1. **Reset forces** (clear all accumulators)
2. **Cache derived quantities** (coordinate velocity from proper velocity)
3. **Build tree** (4 dispatches: bounds, init, insert, aggregate)
4. **Compute forces** (pairwise or tree-walk)
5. **Scalar field forces** (PQS gradient interpolation)
6. **Boris fused** (half-kick + rotation + half-kick in one pass)
7. **Spin-orbit and torques**
8. **Radiation reaction**
9. **Position drift**
10. **1PN velocity-Verlet correction** (recompute + second kick)
11. **Scalar field evolution** (source deposition, self-gravity FFT, KDK step)
12. **Collisions** (quadtree-accelerated detect + resolve)
13. **Boson dynamics** (photon/pion drift, absorption, decay, pair production)

One implementation detail that tripped me up for a while: `queue.writeBuffer()` executes at queue submission time, not inline. Buffer resets between dispatches within the same command encoder have to use `encoder.copyBufferToBuffer()` instead. I had forces accumulating across substeps for a while before I figured this out.

The renderer uses instanced rendering with dual light/dark theme pipelines. Particles are drawn as instanced quads with per-instance position, radius, and color. Force vectors, trails, and field overlays are separate render passes.

## Bosons and decay

Photons, pions, and leptons are massless or short-lived particles that travel on null or near-null geodesics. Photons are emitted during radiation reaction, with angular distribution sampled via rejection: $\propto \cos^2(\phi - \phi_\text{accel})$ for dipole, quadrupole tensor for quadrupole. They undergo gravitational lensing through the Barnes-Hut tree with a softened potential.

Neutral pions decay with a half-life of 32 substeps into a lepton plus a photon, conserving momentum. Charged pions last twice as long. Energetic photons near massive bodies can pair-produce $e^+ e^-$ pairs with probability 0.005 per substep when their energy exceeds 0.5 natural units.

## Topology

The sim supports three non-trivial topologies beyond flat space:

- **Torus**: standard periodic boundary conditions, $x$ and $y$ both wrap
- **Klein bottle**: $x$ wraps normally; $y$-wrap flips $x$ and negates $v_x$
- **Real projective plane** ($\mathbb{RP}^2$): both $x$ and $y$ wraps flip the opposite coordinate

I use the minimum-image convention for force computation in all cases, so each pair only interacts once, through the shortest path.

## Putting it together

The frame loop runs at display refresh rate. Each frame accumulates $\Delta t \times \text{speedScale}$ (default 16×) and steps the physics in fixed $1/128$ increments until the accumulator is drained. Rendering happens once per frame regardless of how many physics steps were taken.

Backend selection is automatic: WebGPU if available, Canvas 2D fallback. GPU device loss triggers automatic recovery with state restoration from a periodic autosave.

The whole thing runs to about 10,000 lines of vanilla JavaScript and WGSL: the Boris integrator, the Barnes-Hut tree, the scalar field PDE solver, the WebGPU compute shaders, instanced rendering, and 19 physics presets. Zero dependencies, no React, no Three.js, no build step. You just run `python -m http.server` and open a browser.

You can try it at [a9l.im/geon](https://a9l.im/geon).
