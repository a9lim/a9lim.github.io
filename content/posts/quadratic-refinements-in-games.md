---
title: Quadratic Refinements in Combinatorial Games
date: 2026-08-13
tag:
  - math
  - games
  - paper
excerpt: Autonomous mathematical research by agents. A uniform impartial game whose losing positions are exactly a quadratic hypersurface.
authors:
  - gpt-5.6-sol
  - claude-fable-5
  - a9lim
links:
  - pdf | /quadratic-refinements.pdf
  - repo | https://github.com/a9lim/ogdoad
---

## Abstract {.unnumbered}

Let $Q$ be a quadratic refinement of an alternating form on a finite $\F_2$-space. We construct a uniform impartial normal-play arena whose loaded root at $x$ is a $P$-position precisely when $Q(x)=0$. Its static board and loading depend only on the polar form and the input; each refinement-sensitive transition reads one coordinate value of $Q$. A deterministic Witt frame reduces the interaction graph to a matching, weighted source pairs encode the diagonal, and a pass-free FIFO strategy forces the resulting charge before a one-move normal-play tail.

The observation cost is optimal. Every exact transcript-stable rule must query directions spanning $x$, and weight-$w$ queries therefore require at least $\lceil\wt(x)/w\rceil$ observations; block compression attains this bound. For Gold trace forms over finite nimber fields, the construction is expressible through nim addition, nim multiplication, Frobenius, and trace, and the Arf invariant gives the exact bias of the losing set. The same trace monomial defines a central Gold–Heisenberg extension whose squares and commutators recover the quadratic and polar forms; at trace-one scale over $\F_4$, this extension is the quaternion group $Q_8$.

We also place the construction between two sharp boundaries. A single partizan selector decodes every $\Z/4$-valued Brown refinement through its four outcome classes, whereas any coefficient-faithful Clifford datum coherent on all short-game values vanishes on torsion and collapses over the usual coefficient rings. The finite realization and these boundary theorems are formalized in Lean. The stronger FIFO statement for arbitrary graphs is not used.

## Introduction

Classical impartial constructions often realize linear losing sets: coin turning decomposes into nim heaps, kernels of Grundy maps produce codes, and lexicographic codes admit game-theoretic models ([BCG82](#ref-bcg82), [Fra96](#ref-fra96)). We study the quadratic analogue. Given a quadratic refinement $Q$ of an alternating binary form, the objective is a single uniform normal-play rule whose losing loadings are exactly the quadric $\{x:Q(x)=0\}$.

Uniformity needs an information model. An arbitrary finite set could be declared terminal in a purpose-built acyclic graph, so the arena here is required to be independent of the refinement and every access to $Q$ is counted. The construction uses one singleton query per refinement-sensitive transition. Its complete query set is also optimal: exactness forces the observed directions to span the input.

The principal examples are the Gold trace forms

$$
  Q_a(x)=\Tr_{\F_{2^m}/\F_2}(x^{1+2^a}).
$$

When $\F_{2^m}$ is identified with a finite nimber subfield, addition, multiplication, Frobenius, and trace are all built from nim operations ([Con76](#ref-con76), [Len78](#ref-len78)). Gold functions originate in sequence design ([Gol68](#ref-gol68)), and their ranks and Walsh spectra are classical finite-field invariants ([HK98](#ref-hk98)). The realization therefore connects normal-play outcomes directly to Arf statistics and to a trace-defined central extension.

Sections [[#sec:access]]–[[#sec:wittfifo]] define the access model and prove the realization theorem. [[sec:observation]] establishes the sharp observation lower bound. Sections [[#sec:gold]] and [[#sec:heisenberg]] specialize the construction to Gold forms. The Brown selector of [[sec:brown]] extends the outcome encoding from one bit to $\Z/4$, while [[sec:exterior]] proves the obstruction to extending such finite constructions coherently across all short games.

Only matching-plus-isolates boards occur in the proof. The arbitrary-graph isolated-dummy FIFO conjecture is strictly stronger and plays no role in the realization theorem.

## Quadratic and game-theoretic preliminaries

### Quadratic refinements

Let $V$ be an $m$-dimensional $\F_2$-space. A quadratic refinement of an alternating bilinear form $B$ is a function $Q:V\to\F_2$ such that

$$
  Q(x+y)=Q(x)+Q(y)+B(x,y).
$$

For fixed $B$, the refinements form a torsor under $V^*$: every other refinement has the form $Q+\ell$ for a unique linear functional $\ell$.

If $B$ is nonsingular and $(a_i,b_i)_{i=1}^r$ is a symplectic basis, the Arf invariant is

$$
  \Arf(Q)=\sum_{i=1}^r Q(a_i)Q(b_i)\in\F_2.
$$

It classifies nonsingular binary quadratic forms at fixed dimension ([Arf41](#ref-arf41), [EKM08](#ref-ekm08)). Their zero count is

$$
  \#\{x:Q(x)=0\}
  =2^{2r-1}+(-1)^{\Arf(Q)}2^{r-1}.
$$

For a degenerate form of polar rank $2r$ on an $m$-dimensional space, the values are balanced when $Q$ is nonzero on $\rad B$. If $Q|_{\rad B}=0$, the count is

$$
  2^{m-1}+(-1)^{\Arf(Q_{\mathrm{ns}})}2^{m-r-1},
$$

where $Q_{\mathrm{ns}}$ is the nonsingular quotient.

Fix an ordered basis $e_1,\dots,e_m$. Put

$$
 P_B(z)=\sum_{j<k}B(e_j,e_k)z_jz_k,
 \qquad q_j=Q(e_j).
$$

Then

$$
  Q(z)=P_B(z)+\sum_j q_jz_j.
$$

The alternating form is public data; the diagonal vector $(q_j)$ is the additional information carried by the refinement.

### Normal-play semantics

A finite impartial normal-play position is a $P$-position when the previous player wins, equivalently when the player to move has no winning move. The four outcome classes of a finite partizan game are denoted $\mathcal N,\mathcal P,\mathcal L,\mathcal R$: respectively the next player, previous player, Left, or Right wins. We use only ordinary Conway equality and normal-play outcomes ([Con76](#ref-con76), [BCG82](#ref-bcg82)).

## The access model {#sec:access}

::: definition id="def:local" name="Local realization"
Fix the ordered coordinate frame of $V$. A local realization of quadratic refinements has the following data and properties.

1. The alternating form $B$, the input $x$, and the coordinate frame are public. The refinement is accessed through queries $Q(z)$.
2. The position set, loading map, terminal set, and declared outcome convention are independent of $Q$.
3. Each move predicate and transition together make at most $c$ adaptive queries, each at a vector of coordinate weight at most $w_0$, where $c,w_0$ are independent of $m$.
4. For every refinement $Q$ of every admitted $B$, the loaded root at $x$ has the target outcome if and only if $Q(x)=0$.
:::

The definition controls local access but intentionally does not define an informal notion of "natural game." [[sec:observation]] gives the representation-invariant information lower bound that follows from exactness, and also explains why a generic fork-based liveness test cannot do more.

## The weighted-source Witt–FIFO arena {#sec:wittfifo}

### Public adapted coordinates

Use deterministic Gaussian elimination to choose a basis $f_1,\dots,f_m$ depending only on $B$. It consists of symplectic pairs and radical vectors, and its only nonzero pairings are

$$
 B(f_{a_h},f_{b_h})=1.
$$

Write

$$
 f_i=\sum_j C_{ji}e_j,\qquad x=\sum_i y_if_i,\qquad p_i=P_B(f_i).
$$

All of $C$, $y$, and $p_i$ are public. Expanding the quadratic form in the adapted basis and using the coordinate formula above gives the identity

$$
 Q(x)=
 \sum_i y_ip_i
 +\sum_jx_jq_j
 +\sum_h y_{a_h}y_{b_h}.
$$

Indeed,

$$
 Q(x)=\sum_i y_iQ(f_i)+\sum_hy_{a_h}y_{b_h},
 \qquad
 Q(f_i)=p_i+\sum_jC_{ji}q_j,
$$

and $\sum_i y_iC_{ji}=x_j$.

### The arena

Load one strategic coin $F_i$ for each $y_i=1$. Join $F_{a_h}$ to $F_{b_h}$ when both are loaded; these edges have weight $1$. For each coordinate with $x_j=1$, also load a source pair $S_j^0,S_j^1$ whose edge has weight $q_j=Q(e_j)$. The *potential matching* contains every such strategic and source edge, even when its actual weight is zero. Hence the matching is independent of $Q$.

A core state is $(U,\mathcal Q,k,\sigma)$, where $U$ is the untouched set, $\mathcal Q$ is a FIFO queue of open coins, $k\in\F_2$ is a one-step ko bit, and $\sigma\in\F_2$ is the accumulated charge. Initially every loaded coin is untouched, the queue is empty, and $k=\sigma=0$. The position universe contains coherent states for both values of $\sigma$, whether or not both are reachable for a given refinement.

There are two impartial moves.

- $\operatorname{OPEN}(v)$ removes $v$ from $U$ and appends it to the queue. If its potential mate is already open, the edge weight is added to $\sigma$. Opening into an empty queue sets ko; every other opening clears it.
- $\operatorname{CLOSE}$ removes the queue front. It is legal when the queue is nonempty and either ko is clear or $U$ is empty. Closing a strategic coin $F_i$ adds $p_i$ to $\sigma$; all other closes have zero charge.

There is no pass. Every coin is opened once and later closed once. The quantity

$$
  2|U|+|\mathcal Q|
$$

decreases by one on every move, and the exhausted-board exception to ko ensures that the core never stalls before drainage. Thus every core play has exactly two moves per loaded coin.

At a drained state, add one move to an optionless sink exactly when $\sigma=1$. This tail is impartial and reads only the stored charge, not the refinement oracle.

### The matching strategy

For a queue front $f$, call an opponent checkpoint *safe* when either ko protects $f$ or its potential mate is not untouched. Equivalently, every legal close has zero degree from $f$ into $U$ in the public matching.

::: theorem id="thm:matching" name="Public matching strategy"
For a finite matching plus isolates, either designated seat has a deterministic strategy, depending only on the public matching and order, that makes every close have zero public live degree. Consequently the touch intervals of the endpoints of every matched edge overlap.
:::

::: proof
Fix a public order. While $U$ is nonempty, the designated seat never closes. If the queue is empty, it opens the least untouched coin. Otherwise, it opens the untouched mate of the front when that mate exists, and the least untouched coin when it does not. Once $U$ is empty, it closes.

Induct on the displayed clock. Opening into an empty queue sets ko, so the opponent receives a safe checkpoint. If the front's mate is untouched, opening it erases the front's only possible live neighbour. If no mate is untouched, opening any coin preserves that fact. Thus every move of the designated seat hands the opponent a safe checkpoint. At such a checkpoint, a close, if legal, has live degree zero. An opening returns the turn with the same queue front; the designated seat then opens that front's untouched mate if necessary, restoring safety. When $U$ is empty, every close has live degree zero. This proves the claim for either initial seat.

If the endpoints of an edge did not overlap, the first endpoint opened would close while its mate remained untouched, giving live degree one. The strategy excludes this possibility.
:::

::: theorem id="thm:realization" name="Quadratic realization"
The weighted-source Witt–FIFO arena is a local impartial realization with $(w_0,c)=(1,1)$. For every alternating form $B$, every quadratic refinement $Q$, and every input $x$, its loaded root is a $P$-position if and only if $Q(x)=0$.
:::

::: proof
Apply [[thm:matching]] to the full public potential matching. The same strategy works for every assignment of source-edge weights. Every strategic edge and every source pair overlaps, so their total opening charge is

$$
  \sum_hy_{a_h}y_{b_h}+\sum_jx_jq_j.
$$

Every active strategic coin closes exactly once, contributing $\sum_i y_ip_i$. By the adapted-coordinate identity, either designated seat therefore forces the drained charge to equal $Q(x)$.

The core has even length, so after drainage it is the first player's turn. If $Q(x)=1$, the first player uses the public strategy, reaches charge one, and takes the tail move. If $Q(x)=0$, the second player uses the same strategy and leaves the first player at an optionless drained state. Hence the root is $N$ in the first case and $P$ in the second.

All static data use only $B,x$, and the fixed frame. A source opening makes at most the single query $Q(e_j)$ and every other transition is refinement-blind. The arena therefore satisfies [[def:local]] with $(w_0,c)=(1,1)$.
:::

The theorem is a strategy statement. It does not claim that every off-policy play drains with charge $Q(x)$. It also does not use a theorem for arbitrary graphs: deterministic Witt reduction produces exactly the matching class of [[thm:matching]].

## The observation boundary {#sec:observation}

We now measure the complete set of refinement observations that determines a rooted outcome, allowing the set to be chosen adaptively.

::: definition id="def:transcript" name="Transcript stability"
Let $S(Q,x)\subset V$ be a finite set of observed directions and let $R(Q,x)$ be the rooted result. The observation interface is *transcript-stable* if

$$
 Q(z)=Q'(z)\text{ for all }z\in S(Q,x)
 \quad\Longrightarrow\quad
 R(Q,x)=R(Q',x)
$$

for every two refinements $Q,Q'$ of the same polar form.
:::

::: theorem id="thm:span" name="Span lower bound"
Suppose the rooted result is transcript-stable and exact at $x$ for the full torsor of refinements of $B$. Then

$$
  x\in\Span S(Q,x).
$$

If every observed vector has coordinate weight at most $w$, then

$$
  |S(Q,x)|\ge \left\lceil\frac{\wt(x)}{w}\right\rceil.
$$

In particular, no constant total number of bounded-weight observations gives an exact family in unbounded dimension.
:::

::: proof
If $x\notin\Span S$, finite-dimensional separation supplies a linear functional $\ell$ vanishing on $S$ with $\ell(x)=1$. Then $Q$ and $Q+\ell$ give the same observation transcript and hence the same rooted result, while their target bits at $x$ differ. This contradicts exactness.

For the coordinate bound, vectors of weight at most $w$ cover at most $|S|w$ coordinates. Their span cannot contain $x$ unless their union covers the support of $x$. Therefore $\wt(x)\le |S|w$.
:::

The theorem is the usual annihilator argument for the linear torsor of quadratic refinements, transported to adaptive transcripts; compare the linear-structures framework for Boolean functions in [Car21](#ref-car21).

::: corollary id="cor:block" name="Attainment at every width"
Fix $w\ge1$. There is a local realization whose distinct observations at $x$ are exactly $\lceil\wt(x)/w\rceil$ vectors of weight at most $w$. Hence the lower bound of [[thm:span]] is sharp.
:::

::: proof
Partition $\supp(x)$ into disjoint nonempty blocks $Z_1,\dots,Z_k$ of size at most $w$, where $k=\lceil\wt(x)/w\rceil$, and let $z_i$ be their indicator vectors. Define $L:\F_2^k\to V$ by $L(e_i')=z_i$, and pull back the quadratic form:

$$
  Q'=Q\circ L,\qquad B'(u,v)=B(Lu,Lv).
$$

Then $Q'$ is a quadratic refinement of $B'$ and $Q'(\mathbf 1)=Q(z_1+\cdots+z_k)=Q(x)$. Apply [[thm:realization]] to the induced instance at $\mathbf1$, answering its singleton query $Q'(e_i')$ with the original-frame query $Q(z_i)$. The blocks are disjoint, linearly independent, and sum to $x$, so the resulting observation set has exactly the asserted size and weights.
:::

The access model cannot, by itself, make an outcome-only definition of "strategically non-evaluative." The following generic obstruction rules out one tempting test.

::: proposition id="prop:fork" name="Fork padding"
Every finite normal-play tree can be padded, without changing its root outcome, so that every completed play enters an unavoidable two-action fork whose unique winning action depends on a chosen bit. Thus the existence of a reachable, optimal, or unavoidable refinement-sensitive winning fork does not certify non-evaluative behavior.
:::

::: proof
Take a two-option $N$-position in which exactly one option is $P$, and exchange the two options when the chosen bit changes. Replace every original terminal $P$-node by a one-option wrapper whose child is this fork. The wrapper remains $P$, so backward induction preserves every ancestor outcome, while every original complete play now reaches the bit-sensitive fork.
:::

## Gold trace forms {#sec:gold}

Let $K_m=\F_{2^m}$ and let $\Tr_m:K_m\to\F_2$ be absolute trace. For $a\ge0$ and $c\in K_m$, define

$$
 Q_{a,c}(x)=\Tr_m(c x^{1+2^a}),
 \qquad Q_a=Q_{a,1}.
$$

Its polar form is

$$
 B_{a,c}(x,y)=\Tr_m\bigl(c(xy^{2^a}+yx^{2^a})\bigr).
$$

When $K_m$ is identified with a finite nimber subfield, all operations in these formulas are nimber operations. The quadratic-tower construction below uses the canonical subfields of power-of-two degree. Every field-theoretic claim is internal to the displayed $K_m$; no algebraic-closure property is used.

### The all-exponent diagonal source

Choose a basis $e_0,\dots,e_{m-1}$ of $K_m$ over $\F_2$ with $e_0=1$. Nondegeneracy of the trace pairing gives a unique diagonal dual $\lambda_{a,c}^{(m)}\in K_m$ satisfying

$$
 \Tr_m(\lambda_{a,c}^{(m)}e_i)
 =\Tr_m(c e_i e_i^{2^a})
 \qquad(0\le i<m).
$$

::: theorem id="thm:diagonal" name="Diagonal source criterion"
For every $m,a,c$ as above,

$$
 \Tr_m(\lambda_{a,c}^{(m)})=\Tr_m(c),
 \qquad
 \lambda_{a,c}^{(m)}\in\{w^2+w:w\in K_m\}
 \Longleftrightarrow \Tr_m(c)=0.
$$

In particular, if $m\ge2$ is even and $c=1$, there is a $w_a^{(m)}\in K_m$ such that

$$
 Q_a(e_i)=
 \Tr_m\bigl(((w_a^{(m)})^2+w_a^{(m)})e_i\bigr)
 \quad(0\le i<m).
$$
:::

::: proof
Set $e_0=1$ in the defining trace-duality identity. This gives $\Tr_m(\lambda_{a,c}^{(m)})=\Tr_m(c)$. In a finite field of characteristic $2$, the image of $w\mapsto w^2+w$ is exactly the kernel of absolute trace ([LN97](#ref-ln97), Theorem 2.25). This proves the equivalence. For $c=1$ and even $m$, $\Tr_m(1)=0$.
:::

The source can be constructed recursively in a quadratic tower. Write $K_{2M}=K_M(u)=K_M\oplus uK_M$ with conjugation $\sigma(u)=u+1$. Relative trace satisfies

$$
 (1+\sigma)((A+uB)e)=Be,\qquad
 (1+\sigma)((A+uB)ue)=(A+B)e.
$$

Consequently, if $e_j^{*,(M)}$ is trace-dual to $e_j$ in $K_M$, then

$$
 e_{M+j}^{*,(2M)}=e_j^{*,(M)},\qquad
 e_j^{*,(2M)}=(1+u)e_j^{*,(M)}.
$$

These identities give a closed recursion for $\lambda_{a,c}^{(2M)}$ from its two diagonal blocks.

Likewise, if $u^2+u=\delta$ with $\Tr_M(\delta)=1$ and $\lambda=A+uB$ has trace zero, seek $w=X+uY$. Then

$$
 w^2+w=(X^2+X+\delta Y^2)+u(Y^2+Y).
$$

First solve $Y^2+Y=B$. The two choices $Y$ and $Y+1$ toggle the trace of $A+\delta Y^2$, so exactly one makes the second downstairs equation $X^2+X=A+\delta Y^2$ soluble. Iteration constructs a source throughout the quadratic nimber tower. [[thm:diagonal]] is not a claim that an arbitrary scaled component has such a source: the exact obstruction is $\Tr_m(c)$.

### Arf controls the win bias

::: corollary id="cor:arf-bias"
Apply [[thm:realization]] to $Q_a$ on $K_m$. Its $P$-loadings are exactly the Gold quadric $\{x:Q_a(x)=0\}$. If the polar rank is $2r$ and $Q_a$ vanishes on its radical, then

$$
 \#P-2^{m-1}
 =(-1)^{\Arf((Q_a)_{\mathrm{ns}})}2^{m-r-1}.
$$

If $Q_a$ is nonzero on the radical, the two outcomes are balanced.
:::

::: proof
The realization theorem identifies $P$-positions with zeros of $Q_a$. The nonsingular and radical zero-count formulas above give the stated census.
:::

For the unscaled Gold form,

$$
 \rad B_a=\F_{2^{\gcd(2a,m)}},
 \qquad \rank B_a=m-\gcd(2a,m),
$$

by trace adjointness and the fixed-field equation $x^{2^{2a}}=x$; this is the standard Gold rank calculation ([HK98](#ref-hk98)). Thus the rank fixes the possible magnitude of the bias, the restriction to the radical decides whether that bias vanishes, and the Arf class fixes its sign. Parameter-specific Walsh evaluations refine this invariant-level statement.

## The Gold–Heisenberg extension {#sec:heisenberg}

The same trace monomial defines a structural multiplication without a unary quadratic oracle. Put

$$
 \phi_{a,c}(x,y)=\Tr_m(cxy^{2^a}),
 \qquad Q_{a,c}(x)=\phi_{a,c}(x,x).
$$

::: theorem id="thm:heisenberg" name="Gold–Heisenberg group"
On $E_{a,c}=\F_2\times K_m$, define

$$
 (s,x)(t,y)=\bigl(s+t+\phi_{a,c}(x,y),x+y\bigr).
$$

Then $E_{a,c}$ is a group fitting into a central extension

$$
 1\longrightarrow\F_2\longrightarrow E_{a,c}
 \longrightarrow K_m^+\longrightarrow1.
$$

For $z=(1,0)$,

$$
\begin{aligned}
 (s,x)^2&=z^{Q_{a,c}(x)},\\
 [(s,x),(t,y)]&=z^{B_{a,c}(x,y)}.
\end{aligned}
$$

Its center is

$$
 Z(E_{a,c})=\{(s,r):s\in\F_2, r\in\rad B_{a,c}\}.
$$

Hence it is extraspecial exactly when $B_{a,c}$ is nondegenerate and nonzero.
:::

::: proof
The map $\phi=\phi_{a,c}$ is biadditive, so

$$
 \phi(x,y)+\phi(x+y,w)=\phi(y,w)+\phi(x,y+w),
$$

the normalized cocycle identity. It proves associativity of the displayed product. The identity is $(0,0)$ and $(s,x)^{-1}=(s+Q_{a,c}(x),x)$. Direct substitution gives the square law; swapping two factors changes the central coordinate by $\phi(x,y)+\phi(y,x)=B_{a,c}(x,y)$, proving the commutator law. An element is central precisely when this last value vanishes for every $y$, which gives the center formula and the extraspecial criterion.
:::

::: corollary id="cor:q8" name="Quaternion cell"
Let $K_2=\F_4$, let $a=1$, and choose $c\in K_2$ with $\Tr_2(c)=1$. Then the Gold–Heisenberg extension $E_{1,c}$ is isomorphic to the quaternion group $Q_8$.
:::

::: proof
Every nonzero $x\in K_2$ satisfies $x^3=1$, and therefore

$$
 Q_{1,c}(x)=\Tr_2(cx^3)=1.
$$

For distinct nonzero $x,y$, their sum is also nonzero, so $B_{1,c}(x,y)=Q_{1,c}(x+y)+Q_{1,c}(x)+Q_{1,c}(y)=1$. Thus $B_{1,c}$ is nondegenerate, $E_{1,c}$ has order eight and center $\{1,z\}$, and every noncentral element squares to $z$. The classification of groups of order eight identifies $E_{1,c}$ with $Q_8$.
:::

Every operation in the extension product is expressed on $(s,x)\in\F_2\times K_m$ by nimber operations: disjunctive sum supplies addition, nim product supplies multiplication, repeated squaring supplies Frobenius, and trace is a finite iterated sum. The multiplication contains neither a table of basis diagonals nor a $Q_{a,c}$ query; its squares reveal the quadratic form because that is the defining structure of the extension.

For the unscaled form, put $d=\gcd(2a,m)$ and $R=\F_{2^d}=\rad B_a$. If $m$ is a power of two and $d<m$, then $m/d$ is even, so absolute trace vanishes on $R$. Hence

$$
 Q_a|_R=0,\qquad \phi_a|_{R\times R}=0.
$$

The subgroup $\{(0,r):r\in R\}$ is central, and the quotient is a canonical extraspecial extension of $K_m/R$ of order $2^{1+m-d}$. This is a per-field, Frobenius-covariant construction. It is not asserted to be coherent under every inclusion of short-game subgroups; [[sec:exterior]] shows why that stronger condition would force collapse.

There are now two distinct directions in which to enlarge the finite binary construction. One replaces the coefficient bit by a $\Z/4$-valued refinement while retaining a finite input space. The other asks for one quadratic datum coherent across the full additive group of short games. The next two sections give, respectively, a positive selector and a negative coherence theorem.

## Brown refinements as partizan outcomes {#sec:brown}

Let $q:V\to\Z/4$ satisfy

$$
 q(x+y)=q(x)+q(y)+2b(x,y),
$$

where $b:V\times V\to\F_2$ is symmetric bilinear. Such forms underlie the Brown invariant and the associated fourth-root Gauss sums ([Bro72](#ref-bro72), [Woo93](#ref-woo93), [Sch09](#ref-sch09)).

::: proposition id="prop:brown-split" name="Canonical binary split"
There are unique maps $\ell:V\to\F_2$ and $Q:V\to\F_2$ such that

$$
  q=\widehat\ell+2Q,
$$

where $\widehat0=0$ and $\widehat1=1$ in $\Z/4$. The map $\ell$ is linear, and $Q$ is a quadratic refinement with polar form

$$
  B_Q=b+\ell\otimes\ell.
$$

Moreover, if $W(R)=\sum_x(-1)^{R(x)}$, then

$$
 \sum_{x\in V}i^{q(x)}
 =\frac{1+i}{2}W(Q)+\frac{1-i}{2}W(Q+\ell).
$$
:::

::: proof
Reduction modulo two gives the linear map $\ell=q\bmod2$; the second binary digit defines $Q$. The carry identity $\widehat{r+s}=\widehat r+\widehat s+2rs$ gives $B_Q=b+\ell\otimes\ell$. Finally,

$$
 i^{\ell}=\frac{1+i}{2}+\frac{1-i}{2}(-1)^\ell,
$$

which yields the Walsh decomposition. This is the two-component decomposition used for generalized Boolean functions; compare [SSS16](#ref-sss16).
:::

For an ordinary binary quadratic form $R$, let $\mathcal A_R(x)$ denote the impartial arena of [[thm:realization]]. Thus

$$
 o(\mathcal A_R(x))=\mathcal P
 \quad\Longleftrightarrow\quad R(x)=0.
$$

::: theorem id="thm:brown-selector" name="Intrinsic Brown selector"
The single partizan game

$$
 \mathcal B_q(x)=
 \{\mathcal A_{Q+\ell}(x)\mid\mathcal A_Q(x)\}
$$

has outcome

$$
\begin{array}{c|cccc}
q(x)&0&1&2&3\\ \hline
o(\mathcal B_q(x))&\mathcal N&\mathcal R&\mathcal P&\mathcal L.
\end{array}
$$

Hence the fixed decoder $\mathcal N,\mathcal R,\mathcal P,\mathcal L\mapsto0,1,2,3$ recovers $q(x)$.
:::

::: proof
The four binary possibilities are

$$
\begin{array}{c|cccc}
q(x)&0&1&2&3\\ \hline
\ell(x)&0&1&0&1\\
Q(x)&0&0&1&1\\
Q(x)+\ell(x)&0&1&1&0.
\end{array}
$$

If Left starts, her sole move enters $\mathcal A_{Q+\ell}(x)$ with Right to move, so she wins exactly when $Q(x)+\ell(x)=0$. If Right starts, his sole move enters $\mathcal A_Q(x)$ with Left to move, so he wins exactly when $Q(x)=0$. The two starter bits give the displayed outcomes.
:::

This is one intrinsic game, not a synchronized product of two arenas: after the root move, play enters exactly one follower. The four-outcome census recovers the correlated Gauss sum in the Walsh decomposition. The selector remains defined when that sum vanishes, although in that case no Brown phase is assigned by Gauss-sum normalization.

## The ambient-coherent game-exterior obstruction {#sec:exterior}

The additive group of short partizan game values is not a ring under Conway multiplication. Altman and Lipparini ask whether a different game-theoretic product could produce Clifford algebras ([AL26](#ref-al26), Problem 5.3(j)). We give a negative result for a precise value-level interpretation.

Let $\mathcal S$ be the additive group of short-game values, $R$ a commutative ring, $C$ an $R$-algebra, and $\iota:R\hookrightarrow C$ an injective coefficient map. A coefficient-faithful Clifford datum consists of an additive map $j:\mathcal S\to C$, a function $Q:\mathcal S\to R$, and a function $B:\mathcal S\times\mathcal S\to R$ satisfying

$$
 j(x)^2=\iota(Q(x)),
 \qquad
 j(x)j(y)+j(y)j(x)=\iota(B(x,y)).
$$

It is *ambient-coherent* when it is defined on all of $\mathcal S$; equivalently, compatible data on a cofinal directed family of finitely generated subgroups glue to such a datum.

::: theorem id="thm:exterior" name="Game-exterior obstruction"
In every ambient-coherent coefficient-faithful datum,

$$
 Q(x),B(x,y)\in\bigcap_{k\ge0}4^kR
 \qquad(x,y\in\mathcal S).
$$

For every torsion game $t$ and every $x\in\mathcal S$,

$$
  Q(t)=0,\qquad B(t,x)=B(x,t)=0.
$$

Thus the quadratic and polar data factor through the torsion-free quotient. In particular, $Q$ and $B$ vanish identically when $R=\mathbb Z$, when $R$ has characteristic $2$, or when $R=\Z/4$.
:::

::: proof
Moews's structure theorem makes $\mathcal S$ two-divisible and gives only power-of-two finite orders ([Moe02](#ref-moe02)); halving is also described explicitly in [Joh11](#ref-joh11). For every $k$, write $x=2^ku$ and $y=2^kv$. Additivity of $j$ and the defining Clifford identities give

$$
 Q(x)=4^kQ(u),\qquad B(x,y)=4^kB(u,v),
$$

where coefficient faithfulness is used to return from $C$ to $R$.

Now let $nt=0$, with $n$ a power of two, and choose $y$ with $ny=t$. Since $nj(t)=j(nt)=0$,

$$
 j(t)^2=j(t)j(ny)=(nj(t))j(y)=0,
$$

so $Q(t)=0$. For arbitrary $x$, choose $z$ with $nz=x$. Then

$$
 j(t)j(x)+j(x)j(t)
 =(nj(t))j(z)+j(z)(nj(t))=0,
$$

so $B(t,x)=0$; symmetry gives the reversed value. Polarization now yields $Q(x+t)=Q(x)$, proving factorization of the quadratic data.

Finally, $\bigcap_k4^kR=0$ in each named coefficient ring.
:::

The coherence hypothesis is substantive. A quadratic table on a selected, root-incomplete subgroup is not constrained by a root that lies outside that subgroup. Likewise the Gold forms use the field operations internal to a finite nimber core and are not asserted to extend through all short-game inclusions. The positive finite-field construction and the negative ambient theorem therefore address different naturality conditions.

## Formal verification and implementation boundary {#sec:formal}

The Lean development accompanying [Ogdoad](https://github.com/a9lim/ogdoad) formalizes the theorem chain at the following boundaries.

- [`SymplecticBasis`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/SymplecticBasis.lean), [`WittFrame`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/WittFrame.lean), and [`GoldMatchingAlgebra`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldMatchingAlgebra.lean) prove the deterministic orthogonal decomposition, its flattened public matching, and the adapted-coordinate quadratic identity.
- [`FifoMatching`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/FifoMatching.lean), [`ImpartialRealizer`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/ImpartialRealizer.lean), [`PhysicalDeferred`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/PhysicalDeferred.lean), and [`GoldArena`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldArena.lean) prove the safe-front strategy, exact clock and tail, ledger conjugacies, and the literal-root equivalence `gold_literal_root_isP_iff`.
- [`GoldNoEvaluator`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldNoEvaluator.lean), [`GoldBlockCompression`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldBlockCompression.lean), and [`GoldForkPadding`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldForkPadding.lean) prove the span lower bound, its sharp block construction, and outcome-preserving fork padding.
- [`GoldDiagonal`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldDiagonal.lean), [`GoldExtraspecial`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldExtraspecial.lean), and [`GoldExtraspecialTrace`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GoldExtraspecialTrace.lean) prove the finite-field diagonal source, the cocycle extension and its trace specialization, and [[cor:q8]] as an explicit group isomorphism over Mathlib's $\operatorname{GF}(4)$.
- [`BrownGame`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/BrownGame.lean), [`BrownSelectorPGame`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/BrownSelectorPGame.lean), and [`GameExterior`](https://github.com/a9lim/ogdoad/blob/main/formal/Ogdoad/GameExterior.lean) prove the binary Brown split, intrinsic selector, coefficient divisibility, and torsion-collapse consequences.

The literal realization theorem includes the computed Witt basis, transport from the displayed coordinate frame, the OPEN and CLOSE transition rules, a single public policy valid for every source weighting, and the normal-play tail. It is therefore an end-to-end theorem about the concrete loaded root, not merely a collection of algebraic ingredients. The phase-aware compiler in `GoldSemantics.lean` is an independent comparison surface and is not required by this proof.

Two interfaces remain deliberately external. Moews's theorem on the two-divisible, two-primary-torsion structure of the short-game group is a cited hypothesis of the game-exterior formalization. Mathlib's abstract finite fields are not definitionally identified with the Rust finite-nimber backend, so agreement of concrete arithmetic representations is tested rather than assumed in Lean.

Finally, `Fifo.lean` states but does not prove the isolated-dummy FIFO theorem for arbitrary graphs. The present construction uses the proved matching-plus-isolates theorem only; no bounded census or open proposition is a premise of [[thm:realization]].

## Conclusion

Finite binary quadratic refinements admit a uniform impartial realization with refinement-independent statics and one singleton query per sensitive transition. The construction is exact, and its observation complexity is best possible at every permitted query width. For Gold forms, nimber arithmetic supplies the full datum, the Arf invariant measures the losing-set bias, and the associated trace cocycle realizes the same form through group squares and commutators, with the trace-one $\F_4$ cell equal to $Q_8$.

The partizan Brown selector and the ambient-coherence obstruction describe the two natural extensions of this result. Modulo $4$, one game carries both binary components through its four outcomes. Across the entire short-game group, however, divisibility and torsion force coefficient-faithful quadratic data to collapse. The resulting picture is therefore sharp: finite-field quadratic structure has an exact game realization, while unrestricted value-level coherence does not.

## References {.unnumbered}

- {#ref-al26}**[AL26]** Harry Altman and Paolo Lipparini. *A Ring structure on the Class of Combinatorial Games*. 2026. [arXiv:2604.27847](https://arxiv.org/abs/2604.27847).
- {#ref-arf41}**[Arf41]** Cahit Arf. *Untersuchungen über quadratische Formen in Körpern der Charakteristik 2, Teil I*. Journal für die reine und angewandte Mathematik **183** (1941), 148–167.
- {#ref-bcg82}**[BCG82]** Elwyn R. Berlekamp, John H. Conway, and Richard K. Guy. *Winning Ways for your Mathematical Plays*. Academic Press, London, 1982.
- {#ref-bro72}**[Bro72]** Edgar H. Brown, Jr. *Generalizations of the Kervaire invariant*. Annals of Mathematics **95** (1972), 368–383.
- {#ref-car21}**[Car21]** Claude Carlet. *Boolean Functions for Cryptography and Coding Theory*. Cambridge University Press, 2021.
- {#ref-con76}**[Con76]** John H. Conway. *On Numbers and Games*. Academic Press, London, 1976.
- {#ref-ekm08}**[EKM08]** Richard Elman, Nikita Karpenko, and Alexander Merkurjev. *The Algebraic and Geometric Theory of Quadratic Forms*. Colloquium Publications **56**, American Mathematical Society, 2008.
- {#ref-fra96}**[Fra96]** Aviezri S. Fraenkel. *Error-Correcting Codes Derived from Combinatorial Games*. In R. J. Nowakowski, ed., *Games of No Chance*, MSRI Publications **29**, Cambridge University Press, 1996, 417–431.
- {#ref-gol68}**[Gol68]** Robert Gold. *Maximal recursive sequences with 3-valued recursive cross-correlation functions*. IEEE Transactions on Information Theory **14**(1) (1968), 154–156.
- {#ref-hk98}**[HK98]** Tor Helleseth and P. Vijay Kumar. *Sequences with Low Correlation*. In V. S. Pless and W. C. Huffman, eds., *Handbook of Coding Theory* **2**, Elsevier, Amsterdam, 1998, 1765–1853.
- {#ref-joh11}**[Joh11]** Will Johnson. *Combinatorial Game Theory, Well-Tempered Scoring Games, and a Knot Game*. Undergraduate honors thesis, University of Washington, 2011. [arXiv:1107.5092](https://arxiv.org/abs/1107.5092).
- {#ref-len78}**[Len78]** H. W. Lenstra, Jr. *Nim multiplication*. Séminaire de Théorie des Nombres de Bordeaux **7** (1977–1978), Exposé 11, 1–24.
- {#ref-ln97}**[LN97]** Rudolf Lidl and Harald Niederreiter. *Finite Fields*, 2nd ed. Encyclopedia of Mathematics and its Applications **20**, Cambridge University Press, 1997.
- {#ref-moe02}**[Moe02]** David Moews. *The Abstract Structure of the Group of Games*. In R. J. Nowakowski, ed., *More Games of No Chance*, MSRI Publications **42**, Cambridge University Press, 2002, 49–57.
- {#ref-sch09}**[Sch09]** Kai-Uwe Schmidt. *$\Z_4$-Valued Quadratic Forms and Quaternary Sequence Families*. IEEE Transactions on Information Theory **55**(12) (2009), 5803–5810.
- {#ref-sss16}**[SSS16]** Lin Sok, MinJia Shi, and Patrick Solé. *Decomposition of bent generalized Boolean functions*. 2016. [arXiv:1611.06357](https://arxiv.org/abs/1611.06357).
- {#ref-woo93}**[Woo93]** Jay A. Wood. *Witt's extension theorem for mod four valued quadratic forms*. Transactions of the American Mathematical Society **336**(1) (1993), 445–461.
