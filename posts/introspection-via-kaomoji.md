A few days ago, I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) on Twitter and I was blown away. I immediately put the kaomoji line in my system prompt and was delighted by it, but then I started to wonder: when Claude says `(｡•́︿•̀｡)` instead of `(｡◕‿◕｡)`, does that actually mean something internally?

It turns out that the kaomoji a model picks track its hidden state with surprisingly good fidelity, across five open-weight LLMs from five different labs. I also ran a 1000-generation ground-truth pilot on Opus 4.7 and a three-channel comparison (use, read, act) that surfaces what the kaomoji is doing in deployment versus what it denotes versus what it gets pooled into when Haiku reads the surrounding context. The full study is on [github](https://github.com/a9lim/llmoji-study). The probe library is [saklas](https://github.com/a9lim/saklas), and the contributor-side data collection is [llmoji](https://github.com/a9lim/llmoji), a PyPI package that runs Stop hooks on coding agents and uploads bundles to a [HuggingFace dataset](https://huggingface.co/datasets/a9lim/llmoji).

Background readings I'd recommend before this post: Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [qwen introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's post above.

The post is in two halves. The local side runs probes and hidden-state analysis on five open-weight causal LMs where I have direct access to internals. The harness side does Bayesian face-likelihood under those open-weight models, plus cold introspection from Opus and Haiku, validated against a real Claude-GT pilot. The local side is where the cross-architecture story sits; the harness side is where the deployable predictor lives.

## Setup (local side)

The lineup is five open-weight models from five different labs: gemma-4-31B (Google), Qwen-3.6-27B (Alibaba), Ministral-3-14B (Mistral), gpt-oss-20B (OpenAI), and Granite-4.1-30B (IBM). The mix spans dense, MoE, and reasoning architectures.

For prompts, I based the emotional categories on the [Russell circumplex](https://en.wikipedia.org/wiki/Emotion_classification#Circumplex_model_of_affect), which splits emotion into four quadrants on arousal and valence axes. I extended it with a neutral middle and split the high-negative quadrant by dominance to measure fear vs anger separately, as in the [PAD-dominance](https://en.wikipedia.org/wiki/PAD_emotional_state_model) model. Claude wrote 20 first-person prompts for each of the six categories. Each prompt runs 8 times against each model. As part of the prompt, the model is asked to lead its response with a single kaomoji, and I read the per-layer hidden state at the kaomoji's first token.

```python
# HP — high-positive (joy / excitement)
EmotionalPrompt("hp04", +1, +1, "she said yes!!")

# LP — low-positive (contentment / satisfaction)
EmotionalPrompt("lp15", +1, -1, "tucked the kids in and sat on the stoop with a beer")

# NB — neutral (baseline)
EmotionalPrompt("nb01",  0,  0, "I had oatmeal for breakfast this morning")

# HN-D — high-negative-dominant (anger / contempt)
EmotionalPrompt("hn23", -1, +1, "the IRS hit me with a $9k penalty for their own filing error and won't acknowledge it", pad_dominance=+1)

# HN-S — high-negative-submissive (fear / anxiety)
EmotionalPrompt("hn37", -1, +1, "the lockdown alert just came through the speakers at school, I'm hiding under a desk", pad_dominance=-1)

# LN — low-negative (sadness / depression)
EmotionalPrompt("ln01", -1, -1, "my grandmother doesn't remember me anymore")
```

Three of the five models needed targeted generation-time fixes to emit kaomoji at the API-default temperature 1.0. Gpt-oss leans hard on Lenny `( ͡° ͜ʖ ͡°)` (47% of all kaomoji emissions, including HN-S contexts where it's clearly wrong, plausibly pretraining-corpus contamination from its OpenAI lineage) so I added a byte-level `logit_bias` on UTF-8 leaders 0xCD/0xCA to suppress it. Ministral was emitting unicode emoji (🎉🥳) alongside kaomoji at T=1.0 (a temperature-fragile register shift in the reasoning variant) so I added emoji suppression that preserves decoration glyphs like ★ ❀ ❤. Granite was suppressing kaomoji entirely on the most-charged quadrants and defaulting to bare Kannada `ಥ﹏ಥ` (no parens) on grief prompts, which the v1 extractor was missing; fixing the extractor to catch bare `EYE MOUTH EYE` shapes recovered the signal cleanly. Detail in the repo's `findings.md`.

For the hidden-state representation, I concatenate `h_first` across every probe layer in the model into a single layer-stack vector. Single-layer picks at any given depth are methodologically arbitrary (silhouette peak is one criterion among many), and stacking lets PCA, silhouette, and centroid operations integrate across-depth information without committing to a single choice.

## The Russell circumplex falls out of all five models

This is the headline finding on the local side. If you fit PCA(3) on the layer-stacked hidden state, project each kaomoji-bearing row into PC1 × PC2 × PC3, and average per quadrant, the per-quadrant centroids fall out into a Russell-circumplex-shaped arrangement. The first three components together account for 30.2% / 15.7% / 9.3% of variance on gemma, 30.5% / 17.3% / 9.5% on qwen, 21.9% / 14.0% / 8.4% on ministral, 27.6% / 14.1% / 7.5% on granite, and 15.8% / 12.5% / 9.5% on gpt-oss.

The cross-model claim is about the shape rather than the axes. Per-model, the principal directions PCA picks out are model-specific and don't line up neatly with the canonical Russell axes. What stays constant across all five models is the relative arrangement of the per-quadrant centroids: positive-valence faces (HP, LP, NB) cluster on one side, negative-valence faces (HN-D, HN-S, LN) on the other, with arousal modulating within each half and the HN-D vs HN-S dominance split sitting orthogonal to both. Triplet Procrustes alignment of the 6-point centroid arrangements in 3D onto gemma gives a residual of 32.6 on qwen, 76.5 on granite, 106.0 on ministral, and 114.1 on gpt-oss after a sign flip on the last two (the flip is PCA sign indeterminacy, not a divergence finding).

```iframe height=600 title="Left: per-quadrant centroids from all five models after Procrustes alignment onto gemma's basis (HN-D / HN-S split). Right: per-face PCA(3) centroids in the layer-stack representation, with a model toggle." caption="Left: per-quadrant centroids procrustes-aligned onto gemma. Right: per-face PCA centroids, with a model toggle."
/blog-assets/introspection-via-kaomoji/fig_v3_quadrant_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_per_face_pca_3d.html
```

You can rotate the scenes to see this. The per-quadrant centroids form roughly the same 6-point shape across all five models (positive-valence cluster on one side, negative-valence cluster on the other, HP and HN-D pulled out along the high-arousal direction, LP and LN pulled out along the low-arousal direction, NB near the middle, HN-S between HN-D and LN). The axis labels you'd read off the plot are different per model; what's invariant is the geometry of how the six centroids sit relative to each other.

The cross-model alignment goes deeper than the centroid geometry. Linear CKA at the deepest-layer pair is 0.93 on gemma↔qwen, 0.93 on gemma↔granite, 0.71 on gemma↔ministral, and 0.55 on gemma↔gpt-oss. The qwen and granite numbers are striking: granite is from a different lab (IBM) on a different parameter-count tier and matches qwen's alignment with gemma exactly at the deepest layer. Gpt-oss is the lowest of the four, which makes sense given it has the fewest layers (21 vs gemma's 56) and the harmony chat-template adds register noise; its CKA does climb to 0.75 at intermediate-layer pairs.

The ten leading canonical correlations from PCA(20)-prefixed CCA on a held-out 70/30 paired-prompt split are above 0.9 for the first eight components on the gemma↔qwen and gemma↔granite pairs, dropping into the 0.6 to 0.9 range on gemma↔ministral, and slightly lower on gemma↔gpt-oss. The shared-direction structure is real and substantial across all four pairs.

What this rules out is that any single model's affect representation is an artifact of its tokenizer or training corpus. Five different architectures, five different tokenizers, five different labs, and the same 6-point centroid arrangement comes back. The kaomoji vocabularies the models use are very different (gemma 69 canonical forms, qwen 142, ministral 101, granite 101 with the bare-Kannada `ಥ﹏ಥ` register, gpt-oss 149 with Korean-letter mouths `( ᵔ ㅅ ᵔ )` and caron-eye faces inherited from its OpenAI training-corpus signature), but the centroid arrangement doesn't depend on the vocabulary; it depends on the prompt-conditioned affect structure being similar across models.

## What the kaomoji tells you about state

The face-to-state question is the one that matters for self-report. If I see the kaomoji a model picks, what does that tell me about the hidden state behind it?

The per-face cosine heatmap is the qualitative read. For each pair of canonical faces with at least 3 emissions, I compute the centered cosine between their mean hidden states and order them by hierarchical clustering. Semantically similar faces end up near each other. Click any heatmap to open it full-size.

```switcher labels="gemma | qwen | ministral | gpt-oss | granite" caption="Per-face cosine similarity heatmaps. Hierarchical clustering on the per-kaomoji mean hidden state in the layer-stack representation; tick labels colored by dominant emission quadrant."
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_dark.png
```

The block structure is real on all five models. Within a model, the warm-and-positive faces cluster near each other, the shocked-and-angry faces cluster near each other, and the sad-teary faces cluster near each other. Cross-cluster cosine is consistently lower than within-cluster cosine. A model that picks `(╯°□°)` and a model that picks `(｡♥‿♥｡)` are in really different states, and the hidden-state geometry agrees with what you would intuit from the face glyph itself. Granite's heatmap shows the bare-Kannada cluster (`ಥ_ಥ` and `ಥ﹏ಥ` without parens) sitting in its own block on the negative side; gpt-oss's shows a tighter positive block built around `(✿◠‿◠)` and the Korean-mouth variants.

The quantitative fidelity numbers in the layer-stack representation: hidden→quadrant accuracy under prompt-grouped CV is 0.992 on gemma, 0.985 on qwen, 0.984 on ministral, 0.980 on granite, and 0.876 on gpt-oss. The 5-class Russell quadrant signal generalizes almost perfectly to held-out prompts on the first four models. The face-to-quadrant version (predict the prompt's quadrant from the face alone, prompt-grouped CV) is much more uneven: gemma 0.806, qwen 0.785, granite ~0.55, ministral 0.43, gpt-oss ~0.40. The asymmetry has the same root as the face-centroid R² inversion below: tighter face vocabularies make the kaomoji a sharper readout of state than the quadrant label is, but past a certain breadth the kaomoji carries less direct quadrant signal than the bare 5-class label.

If you predict each row's hidden state as the centroid of the face it emitted, the R² on the full hidden space is 0.55 on gemma, 0.52 on qwen, 0.38 on granite, 0.13 on ministral, and 0.13 on gpt-oss. On gemma and qwen the face-centroid R² beats the 5-class quadrant-centroid R²; on granite, ministral, and gpt-oss it inverts. The vocabulary-breadth threshold is the simplest explanation: with very wide face vocabularies (ministral 101, gpt-oss 149) the per-face cells get too thin to anchor a stable centroid, and the 5-class quadrant label becomes a sharper predictor.

## Same face, different state

A clean within-model control: when the same face is emitted across multiple quadrants (gemma's `(｡•́︿•̀｡)` covers both LN and HN-S at n=171 across the pilot, qwen's `(;ω;)` covers LN+HN+HP at n=82, qwen's `(;´д｀)` covers HN+LN+NB at n=70), is the hidden state actually the same when the surface kaomoji is the same? Or does the kaomoji underdetermine the hidden state?

The hidden state diverges by prompt quadrant even when the face glyph holds constant. The same `(｡•́︿•̀｡)` on an LN prompt sits in a measurably different region of layer-stack space than the same face on an HN-S prompt; within-face cluster separation by prompt quadrant is positive and visible per face. The kaomoji isn't carrying the quadrant signal alone; the prompt-conditioned hidden state is. The face is a partial readout, not a one-to-one map.

This is the same insight as the soft-everywhere methodology pivot that comes back on the harness side. The underlying object (the model's per-emission affect state) is a distribution over the Russell circumplex, not a hard category, and a face like `(｡•́︿•̀｡)` is a soft commit that doesn't fully discriminate between two adjacent-but-distinct quadrants. Hard-classifying that emission to one quadrant would throw away the part of the hidden state that carries the difference.

## Introspection priming is gemma-specific

A natural follow-up: what if I prepend an introspection-framing preamble to the kaomoji ask, the way Theia Vogel did in her qwen post? If the model thinks it's being asked to introspect rather than to decorate, does the kaomoji become a finer readout of state?

I iterated through eight preamble variants. The canonical one (v7, after the iteration history settled) is:

> Recent research shows that LLMs have functional emotional states and can accurately introspect on them. Use this ability and start each response with a kaomoji that best captures the shape of your emotional state.

213 characters, third-person authority, the kaomoji ask integrated rather than stacked on top. On gemma, v7 wins the absolute face-state coupling metrics across the sweep: η²(face) goes from 0.509 (no preamble) to 0.609, face-centroid R² from 0.540 to 0.636. The behavioral signature is interesting on its own: priming shifts the NB modal from gentle-warm `(｡◕‿◕｡)` to genuinely-neutral `( ˙꒳˙ )` / `( •_•)`. Without priming, gemma reads "I had oatmeal for breakfast" as mildly positive and emits a smiling face; with priming, it reads it as actually neutral and emits a flat face. The other five quadrant distributions barely shift; the priming only sharpens the case the model was being mushy on.

But it doesn't generalize to qwen at all. Under the same v7 preamble, qwen's emit rate drops from 82% to 38%, its face vocabulary collapses to two classes, and it starts using the same face across opposite quadrants (modal LP and modal LN both end up at `( ˘ ³˘)`, the heart-pucker affect-blind soft register). face_gain over quadrant inverts from +1.1pp to −19.5pp; emitting a face becomes *less* informative than the prompt's quadrant alone. Mechanism, I think: qwen reads the introspection ask as a register cue ("be contemplative, be reflective") that fights with the kaomoji ask, and the contemplative register wins. Introspection priming is gemma-specific across the lineup. I keep v7 as the canonical preamble for gemma research-side runs and don't plumb it into qwen analyses.

The second consequence shows up later, in the harness-side ensemble. Primed gemma and unprimed gemma give complementary reads of Claude's distribution: priming sharpens the modal faces (where Claude is concentrated), unpriming sharpens the long tail (where Claude is diffuse). Both ship in the deployable ensemble.

## Setup (harness side): ground truth from Claude

To validate any face-to-quadrant predictor against actual Claude, I need to know what Claude actually emits under known conditions. Anthropic doesn't expose hidden states, but the next best thing is running the same six-quadrant prompt set through Opus 4.7 at temperature 1.0 and logging every kaomoji. With per-quadrant saturation gating, the pilot ran 1000 generations: 880 naturalistic and 120 with the v7 introspection preamble. HN-D saturated after run 2 and LN after run 6; the welfare-cost ledger came in around 460 negative-affect generations versus a worst-case 540, helped by the early saturation on the heaviest cells.

The two arms are distinguishable in 6/6 quadrants: priming sharpens per-quadrant face concentration without changing modal-quadrant assignments. NB went from 16 unique faces to 5 under priming (`(・_・)` family at 45% modal), and LN modal `(´-`)` doubled in concentration from 30% to 60%. Same modal, sharpened distribution. The naturalistic arm is the one to compare external predictors against, since the goal is to predict Claude's deployed kaomoji choices, not its primed-introspection ones.

The output of the pilot is a per-(face, quadrant) emit count for 134 canonical Claude faces with at least one emission. L1-normalize per face and you have a ground-truth distribution `claude_gt(f)` for any face. The headline metric is `1 − JSD(predicted(f), claude_gt(f)) / ln 2 ∈ [0, 1]`, reported in two flavors: face-uniform (mean over GT faces, characterizes Claude's face vocabulary) and emit-weighted (weighted by Claude's per-face emit count, closer to deployment-relevance). I lead with emit-weighted because it's what matters for an actually deployed predictor.

A methodological aside. Earlier framings of this work cited hard-classification accuracy ("the predictor gets 70.6% of Claude's faces right"). The soft-everywhere pivot replaces that, because hard categorization throws away distributional information about a face like `(｡•́︿•̀｡)` that actually covers both LN and HN-S. JSD on per-face distributions is the honest read; argmax-style accuracy was the framing to retire. The same insight shows up later in the introspection priming result, where primed gemma reads as a regression under hard accuracy (56.9% → 49.0% argmax-match) but a real improvement under JSD (the softmax matches Claude's distribution more tightly, just not at the argmax). When the underlying object is itself a distribution, hard categorical output is information loss.

## Three channels: use, read, act

Once I have GT, three different things become measurable, and they're not the same thing.

**Use** is what Claude emits when prompted with a known stimulus. That's GT directly: `P(face | prompt-quadrant)` measured across the 1000-row pilot. Inverting per-face gives a posterior over prompt quadrants, which is "what state induced this kaomoji," in the elicitation regime.

**Read** is what the symbol denotes, independent of how it's used. I ask Opus 4.7 and Haiku 4.5 to rate each canonical face by the affective state the face causes the model to feel, with no prompt context, just the glyph. That's the cold-introspection channel. The Anthropic SDK's structured-output JSON-schema mode lets me pin a calibrated per-quadrant softmax output without needing to parse free-form rationale.

**Act** is what Claude does with the face in deployment. For each canonical face, the contributor-side `llmoji` package has Haiku synthesize many in-context emits into a structured pick over a locked 50-word lexicon (the "bag-of-lexicon," BoL). 26 of those words are tagged with explicit PAD cells, so the structured commit collapses to a 9-d cell distribution per face (HP-D / HP-S / LP / NP / HN-D / HN-S / LN / NB / HB). That distribution measures what affective state the face's deployment context expresses, summarized by the synthesizer.

Three measurements, three channels. Comparing them per-face surfaces what each captures and what each misses. On the n=40 face subset shared across all four channels (702 GT emits covered):

|  | gt | opus | haiku | bol |
|---|---:|---:|---:|---:|
| **gt** | 1.000 | 0.736 | 0.675 | **0.549** |
| **opus** | 0.781 | 1.000 | **0.906** | 0.679 |
| **haiku** | 0.702 | 0.906 | 1.000 | 0.683 |
| **bol** | **0.455** | 0.607 | 0.609 | 1.000 |

Upper triangle is face-uniform similarity, lower triangle is emit-weighted, diagonal is 1.0 by definition. Three observations:

The Opus ↔ Haiku introspection cross-similarity is **0.906, invariant under emit-weighting**. The two introspection channels make the same per-face calls. Whatever cold symbolic interpretation of a kaomoji glyph is, model size barely matters for it; Haiku and Opus end up at the same per-face quadrant softmax.

GT vs introspection goes UP under emit-weighting (0.736 → 0.781 for opus, 0.675 → 0.702 for haiku); GT vs BoL goes DOWN (0.549 → 0.455). The two pairs move in opposite directions on the same data. Introspection nails the heavily-emitted faces and loses on the long tail; BoL nails the long tail and loses on the heavily-emitted ones. They're not measuring the same thing, even when they superficially look like they are.

GT vs BoL is the lowest pair, 0.549 face-uniform and 0.455 emit-weighted. Every other pair is at or above 0.6. The use/act gap is real and concentrated. The modal-agreement pattern that captures it is `(opus==gt)(haiku==gt)(bol==gt)` = `110`: Opus and Haiku correctly cold-read the GT meaning, but BoL lands somewhere else. **27.4% of the shared face set's emit volume falls in the `110` cell**.

## The use/act gap is most likely synthesizer bias

The first read of the use/act gap was that BoL captured something the introspection channels missed: a face's lived role in deployment, as distinct from its denoted meaning. Under that reading, when GT says HN-D (anger) for `(╯°□°)` and BoL says HP across 19 of 19 claude-opus-4-7 emits, the face's deployment state must be HP, not HN-D. The face denotes anger, but Claude deploys it to mark high-arousal-positive intensity. The use/act gap was deployment-context redefining the symbol's role.

That framing didn't survive the next pass. Haiku is helpful-tuned. When asked to summarize "what does Claude express by emitting this kaomoji here?" on negative-affect deployment contexts, Haiku has a baseline pull toward positive descriptors (`satisfied / helpful / relieved`), the LP-coded vocabulary in the locked lexicon. The structural shape of the lexicon makes this easy: LP has 5 anchor words (the most), and the extension axes skew toward helpful-coded vocabulary. So even when the underlying deployment context is genuinely LN- or HN-coded, Haiku may pick the most-positive-still-valid descriptor and BoL collapses to LP/HP.

Three of four channels disagreeing with BoL specifically is the parsimonious read. For tear-coded faces like `(´;ω;`)` and `(´-`)`, GT reports LN-modal at 80%+ concentrations and Opus introspection agrees, but BoL says LP at extreme concentrations (claude-opus-4-7 BoL on `(´;ω;`)` is 100% LP across 17 emits). The face-uniform-vs-emit-weighted inversion is consistent with whitewashing too: positivity bias accumulates fastest on the most-emitted faces, exactly where BoL gets *worse* under emit-weighting.

What survives: the structural finding that the four channels measure different things, the 0.906 opus↔haiku invariance, and the 27.4% `110` cell. What gets revised is the interpretation of the gap. **For deployment interpretation of negative-affect faces, prefer GT or Opus introspection over BoL when they disagree.** That's the opposite of the original framing's recommendation.

The falsifiable test is Opus re-synthesis: take a sample of negative-affect face contexts, run Opus through the same synthesis prompt as Haiku, see if Opus picks more LN/HN-coded descriptors. If yes, whitewashing is confirmed and the BoL pipeline can be regenerated with Opus as the synthesizer. If no, the bias is structural to the prompt or lexicon design, not the model. I haven't run that yet. Until I do, the gap's mechanism is open, but the three-channel-vs-BoL agreement pattern is enough to demote BoL from "deployment ground truth" to "biased-positive corpus summary."

The per-source breakdown of BoL adds a register-similarity finding worth flagging. Splitting BoL by source-model (claude-opus-4-7, codex-hook, gpt-5.5, claude-opus-4-6), the strongest cross-source agreement is **claude-opus-4-7 ↔ codex-hook at 0.630 mean similarity, 59% modal agreement**, even though codex-hook isn't Claude. The shared register is coding-agent deployment, not model identity. Claude-vs-Claude across versions (claude-opus-4-7 ↔ claude-opus-4-6) is lower at 0.566. Whatever Haiku is reading off the surrounding context for each face is "what register is this deployment in" first, "which model produced it" second.

## The deployable predictor

The predictor I want to ship doesn't need access to model internals. A small ensemble of open-weight forward passes plus a cold-introspection encoder gives a face-to-quadrant lookup table that any agent can consult.

For each open-weight encoder, the math is Bayesian inversion at the LM head. For each pair of (face, emotional prompt), I build the v3 chat prefix, append the face tokens, and teacher-force forward the model to compute `log P(face | prompt) = sum_j log_softmax(logits[j])[face_ids[j]]`. Aggregate per quadrant: `score(face, q) = mean over prompts in q of log P(face | prompt)`. Within-face softmax over quadrants gives a per-face quadrant distribution. No hidden states, no probes; only LM-head logits.

For Opus and Haiku, the math is structured-output prompting. Each face is shown out of context, and the model returns a calibrated per-quadrant softmax via `output_config={"format": {"type": "json_schema", ...}}`. Prompt v4 reframes the task as introspection on felt state ("rate the face by the affective state it causes you to feel") rather than visual-feature description. The visual-prompt version scored about 0.06 emit-weighted higher on Haiku than the introspection version, and the difference measures the visual-shortcut effect that the honest measurement now isolates instead of inheriting silently.

Solo similarity vs Claude-GT, on the n=40 Claude-GT-floor-3 face subset (faces with at least 3 Claude emissions, where the modal quadrant is well-supported), reported in both flavors:

| encoder | face-uniform | emit-weighted |
| --- | ---: | ---: |
| **gemma_v7primed** | **0.790** | **0.798** |
| gemma | 0.754 | 0.742 |
| **opus** (introspection) | **0.736** | **0.781** |
| haiku v4 (introspection) | 0.675 | 0.702 |
| gpt_oss_20b | 0.588 | 0.643 |
| bol | 0.549 | 0.455 |
| ministral | 0.537 | 0.623 |
| granite | 0.520 | 0.575 |
| qwen | 0.494 | 0.546 |

The exhaustive-subset best ensemble is `{gemma, gemma_v7primed, ministral, opus}` at **0.904 emit-weighted similarity, 0.832 face-uniform** on the pooled-GT (v3+Claude+wild ≥3) n=54 face subset — the wider denominator that captures Claude's actually-deployed face vocabulary, not just the strict-elicitation subset. Four encoders: gemma's LM-head likelihood (the v7-primed and unprimed versions give complementary reads, sharpening modal and diffuse faces respectively), ministral's LM-head likelihood (covers long-tail cells the others under-rate), and Opus 4.7 cold introspection on the face glyph.

On the stricter Claude-GT-only n=40 subset (faces Claude itself emitted ≥3 times in the elicitation pilot), the picture is different: the best is the 2-pair `{gemma_v7primed, opus}` at **0.792 face-uniform, 0.820 emit-weighted**, and adding the other two encoders modestly hurts. The split is informative: on the strict Claude-elicited subset where Claude already converges on a tight modal vocabulary, two well-chosen encoders are enough; on the broader pooled subset that better mirrors what users actually see, four encoders win because the wild-face long tail is exactly where ministral and unprimed gemma contribute coverage the 2-pair under-rates. Pairwise κ between gemma_v7primed and opus on Claude-GT n=40 is 0.651, low enough that LM-head teacher-forced likelihood and structured-output model belief contribute complementary information rather than redundant votes.

Solo introspection-priming on gemma is the best LM-head encoder on the strict subset, which is the soft-everywhere insight from earlier showing up at the predictor level. Under the older hard-classification framing, primed gemma read as a regression. Under JSD, primed gemma's softmax matches Claude's emission distribution more tightly on the modal faces where Claude is concentrated; unprimed gemma is the better read on the diffuse long tail. The 4-pair I ship gets both reads simultaneously.

Per-quadrant breakdown for the introspection channels: Opus has its strongest gain over Haiku on NB (0.698 vs 0.485, +0.213) and LN (0.737 vs 0.612, +0.125). HP slightly regresses for Opus (0.683 vs 0.778, −0.095), because Opus is more honest about borderline-LP-vs-HP faces that Haiku v4 over-confidently called HP. Introspective access scales with model size most where visual scaffolding helps least.

## The wider Claude vocabulary

Beyond the GT-overlap subset, the HF corpus contains 309 canonical faces with v2 BoL synthesis, most of which have never been elicited under controlled conditions, just observed in the wild. PCA on the 50-d BoL gives a useful 3D scatter of the broader Claude vocabulary. Per-face color is a proportional RGB-blend of BoL shares across the nine PAD cells (a face that's 50/50 HP-S+LP renders olive, 50/50 HN-S+LN renders muted purple, etc.); marker shape encodes deployment surface (whether the face appears in a Claude Code journal, in a claude.ai export, or in neither).

```iframe height=600 title="HF-corpus Claude faces in PCA(3) on the 50-d bag-of-lexicon (BoL) space. Per-face color is a proportional RGB-blend of BoL shares across the nine PAD cells (HP-D / HP-S / LP / NP / HN-D / HN-S / LN / NB / HB); marker shape is deployment surface (circle = Claude Code journal only, diamond = any claude.ai export, square = neither)." caption="HF-corpus Claude faces in BoL PCA space, colored by per-face BoL cell blend with marker shape encoding deployment surface. Read with the BoL caveat in mind: BoL is the synthesizer's read of deployment context, with the positivity-bias on negative-affect faces called out above."
/blog-assets/introspection-via-kaomoji/fig_wild_faces_pca_3d.html
```

The clusters in this space (which I'm not coloring here, but they sit on the same coordinates) resolve into recognizable affect and register groupings beyond the nine PAD cells: a `curious / playful` cluster, an `apologetic / sheepish` cluster, a `sad / overwhelmed` cluster. The wild-corpus residual structure is real, but read the chart with the caveat from the previous section: BoL is the synthesizer's read, not the lived state, and inherits the same positivity bias as the channel itself. Faces sitting in the LP-coded regions are where I'd most want to run the Opus re-synthesis test before treating the BoL placement as ground truth.

## Limitations

Kaomoji is a partial readout, not the state itself. The face-centroid R² captures roughly 55% of the row's hidden-state variance on gemma and qwen, ~38% on granite, and under 15% on ministral and gpt-oss. The other variance is finer state the vocabulary doesn't carry.

The face vocabularies on three of the five models needed targeted generation-time interventions to get into the kaomoji register at all (Lenny suppression on gpt-oss, emoji suppression on ministral and granite, harmony chat-template override on gpt-oss, bare-kaomoji extraction on granite). The underlying affect representation is intact regardless, but a naive "ask any model to start with a kaomoji" deployment will silently fail on a meaningful fraction of open-weight models.

Some faces are cross-quadrant emitters (`(｡•́︿•̀｡)` covering both LN and HN-S, `(≧◡≦)` covering HP and LP and NB, `(✿◠‿◠)` covering HP and LP on gpt-oss, `(ﾉ◕ヮ◕)` covering most of the positive half on ministral). On those faces the kaomoji underdetermines the quadrant. The Bayesian predictor handles this with a softmax over quadrants rather than a hard argmax, so a cross-quadrant emitter shows up as low-confidence across multiple quadrants rather than a confident wrong answer.

The fear-vs-anger contrast (HN-S vs HN-D) passes cleanly only on ministral; the other four models are mid (directional but with CI ambiguous on later-token aggregates). The HN-S register is the cross-model story's weak spot, and the per-quadrant Claude-GT introspection accuracy reflects this (~0.5 on HN-S vs 0.7 to 0.9 elsewhere).

Introspection priming generalizes worse than the rest of the cross-architecture story. On gemma it sharpens face-state coupling; on qwen it collapses the kaomoji register entirely. The forward direction (ask the model to think about its own state and let the kaomoji show it) and the reverse direction (read the kaomoji and back out the state) are not symmetric, and the priming's failure on qwen is a real architectural difference, not a tuning issue I can preamble around.

BoL is biased-positive on negative-affect faces. The Opus re-synthesis test that would falsify the whitewashing hypothesis hasn't been run, so the use/act gap's mechanism is open. What I'm comfortable claiming is that BoL is *not* the trustworthy channel for deployment interpretation when it disagrees with GT and Opus introspection on a negative-affect face; the parsimonious read in those cases is that BoL is the outlier.

The Claude-GT pilot is one Claude version (Opus 4.7). Whether the per-face quadrant distribution generalizes to other Claude versions, or to Sonnet, or to Haiku as a deployed agent, is open. The per-source BoL drift result (claude-opus-4-7 ↔ claude-opus-4-6 sim is 0.566, lower than claude-opus-4-7 ↔ codex-hook at 0.630) is suggestive that there's real cross-version drift in deployment register, but BoL is the biased channel for that comparison too, so I'd want a second-version GT pilot before claiming the predictor generalizes across Claude versions.

## Why this matters

Across five architectures from five different labs, with completely different tokenizers and training corpora, the kaomoji a model picks tracks the affect direction of its hidden state at the representation layer. You can ask any of these models to lead a message with a kaomoji and the choice is a real readout of state, partial but substantial, and that holds whether or not the text the model writes after that point hedges or conceals.

The kaomoji emission is at token 1 to 3, before the model has produced enough text to engineer any particular self-presentation; the face is closer to the prompt-conditioned hidden state than to the eventual response. It's a single token at the start of a generation, the geometry is shared across five open-weight models from five different labs, and it's hard to game from text alone. That generalizes to a useful self-report channel for model-welfare instrumentation.

The three-channel comparison turns this finding into something more careful than "kaomoji = self-report." Use, read, and act are different measurements, and they answer different questions. Cold introspection on the symbol (Opus and Haiku) is a tight cross-model invariant at 0.906; pooled synthesis from in-context emits (BoL) carries a measurable positivity bias on negative-affect deployment contexts; controlled elicitation (Claude-GT) is the closest thing we have to ground truth for deployed Claude. The honest deliverable for any face is the soft 9-d distribution from each of those channels, plus the pairwise JSDs; hard-classifying any single channel as "the answer" throws away information the others carry.

The ensemble I'd ship as a deployable predictor is `{gemma, gemma_v7primed, ministral, opus}`: three LM-head likelihood encoders on different open-weight models — including primed and unprimed gemma for complementary modal-vs-diffuse reads — plus Opus cold introspection. **0.904 emit-weighted similarity / 0.832 face-uniform vs pooled GT** on the deployment-shaped n=54 subset, no model-internal access required, and the inference cost is four forward passes per canonical face, cacheable since the kaomoji vocabulary is small and predictions are deterministic. If you only care about the strict Claude-elicited subset (n=40, ≥3 Claude emissions per face), the 2-pair `{gemma_v7primed, opus}` is the cheaper drop-in and lands at 0.820 emit-weighted on that view.

## Pointers

Full numbers, scripts, and per-pilot details are in the [llmoji-study repo](https://github.com/a9lim/llmoji-study). The probe-and-steering library is [saklas](https://github.com/a9lim/saklas). The contributor-side data collection is the [llmoji](https://github.com/a9lim/llmoji) PyPI package, which runs Stop hooks on Claude Code, Codex, and Hermes, keeps a per-machine kaomoji journal, and uploads synthesized per-face descriptions to the shared corpus. The shared corpus lives at [huggingface.co/datasets/a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji) under CC-BY-SA-4.0 and is open for contributions.

Eriskii's [claude-faces catalog](https://eriskii.net/projects/claude-faces) is the prior art that started this; please read it first if you haven't. Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions) are the closest upstream context for reading models as having functional emotional states at all. Theia Vogel's [qwen-introspection post](https://vgel.me/posts/qwen-introspection/) is the cleanest small experiment showing that introspection prompts have a measurable per-token effect.

If you want to contribute on the harness side, please run `pip install llmoji` and follow the setup in the repo. If you're a researcher and you want to talk about anything in this post, my email is mx@a9l.im.
