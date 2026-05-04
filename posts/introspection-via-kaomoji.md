A few weeks ago, I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) on twitter and I was blown away. I immediately put it in my system prompt, but then I started to wonder: when a LLM says `(｡•́︿•̀｡)` instead of `(｡◕‿◕｡)`, does that actually correspond to something internal, or is it just doing surface-level pattern-matching?

This post is the answer. The short version: across five open-weight LLMs from five different labs, the kaomoji a model picks tracks the affect direction of its hidden state with substantial fidelity. The next step (which I'm very close to shipping) is a Claude Code extension that uses this finding to show Claude's affective state to the user in real time, by reading the kaomoji Claude lead-emits and looking up its quadrant in a pre-computed map.

The full study is on [github](https://github.com/a9lim/llmoji-study). I've also built [llmoji](https://github.com/a9lim/llmoji), a PyPI package that collects submitted kaomoji from cloud LLM chats and uploads them to a [HuggingFace dataset](https://huggingface.co/datasets/a9lim/llmoji). The probe-and-steering library is [saklas](https://github.com/a9lim/saklas).

For the upstream context: Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [qwen introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's post above.

## Setup

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

This is the headline finding. If you fit PCA(3) on the layer-stacked hidden state, project each kaomoji-bearing row into PC1 × PC2 × PC3, and average per quadrant, the per-quadrant centroids fall out into a Russell-circumplex-shaped arrangement. The first three components together account for 30.2% / 15.7% / 9.3% of variance on gemma, 30.5% / 17.3% / 9.5% on qwen, 21.9% / 14.0% / 8.4% on ministral, 27.6% / 14.1% / 7.5% on granite, and 15.8% / 12.5% / 9.5% on gpt-oss.

The cross-model claim is about the shape, not the axes. Per-model, the principal directions PCA picks out are model-specific and don't line up neatly with the canonical Russell axes. What stays constant across all five is the relative arrangement of the per-quadrant centroids: positive-valence faces (HP, LP, NB) cluster on one side, negative-valence faces (HN-D, HN-S, LN) on the other, with arousal modulating within each half and the HN-D vs HN-S dominance split sitting orthogonal to both. Triplet Procrustes alignment of the 6-point centroid arrangements in 3D onto gemma gives a residual of 32.6 on qwen, 76.5 on granite, 106.0 on ministral, and 114.1 on gpt-oss after a sign flip on the last two (the flip is PCA sign indeterminacy, not a divergence finding).

```iframe height=540 title="Left: per-quadrant centroids from all five models after Procrustes alignment onto gemma's basis (HN-D / HN-S split). Right: per-face PCA(3) centroids in the layer-stack representation, with a model toggle." caption="Left: per-quadrant centroids procrustes-aligned onto gemma. Right: per-face PCA centroids, with a model toggle."
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

## The Bayesian face-likelihood predictor

The cosine and centroid analyses tell me the kaomoji and the hidden state are coupled. The next thing I want is the inverse: given a kaomoji that the model emits, can I predict which quadrant prompted it, without ever running the model's hidden state? This is the function I need for a deployable Claude extension, since I don't have access to Claude's hidden states.

The approach is Bayesian inversion at the LM head. For each pair of (face, emotional prompt), I build the v3 chat prefix, append the face tokens, and teacher-force forward the model to compute `log P(face | prompt) = sum_j log_softmax(logits[j])[face_ids[j]]`. Then I aggregate per quadrant: `score(face, q) = mean over prompts in q of log P(face | prompt)`. The argmax over quadrants is the predicted quadrant for that face. Length cancels under within-face softmax over quadrants, so longer faces don't get penalized.

The key property: this only uses the LM-head distribution. No hidden states, no probes, no model-internal access beyond what any forward pass gives you. The output is a face-to-quadrant lookup table that any agent can consult.

Solo accuracies on the 60-face local-model GT subset (where ground truth is each face's empirical majority quadrant on the v3 corpus): gemma 75.0%, qwen 70.0%, ministral 38.3%, gpt-oss 30.0%, granite (later run) 43.1%. Gemma is the strongest solo predictor.

Aggregating across models with weighted softmax voting, the best subset is `{gemma, ministral, qwen}` at **75.8% on the 66-face local-model GT subset, κ=0.699**. The 3-model ensemble beats best-solo by about 3 percentage points. Ministral helps despite its lower solo accuracy because its error structure is independent from gemma's and qwen's; the three models have different training lineages and make different mistakes. Adding more encoders past the size-3 winner monotonically hurts the vote, because the gains from independence get washed out by class-imbalanced predictors (GLM-4.7-Flash is the worst offender; it predicts LN 100% of the time).

The methodological concern that needed addressing: the GT subset is sourced from gemma, qwen, and ministral v3 emissions, so gemma agreeing with empirical on faces gemma itself emitted is uninformative about cross-model affect agreement. The actual test is whether gemma recovers empirical labels for faces gemma never emitted. On the 24 qwen-only faces, gemma predicts empirical at 67% (κ=0.57); on the 14 gemma-only faces, qwen predicts empirical at 50% (κ=0.33). Both are 3 to 4 times chance for a 6-class problem. The cross-model bridge is real; the encoders are recovering shared intrinsic affect from the kaomoji's form, not memorizing their own training preferences.

Validating against actual Claude (not local-model GT) is the load-bearing test. I ran a small ground-truth pilot on Opus 4.7: 20 prompts per quadrant, single generation each, 0% nonemission rate across all 6 quadrants. The best ensemble subset achieves **72.5% accuracy on this 51-face Claude GT (κ=0.663)**. Per-quadrant breakdown: HP 33%, LP 100%, HN-D 100%, HN-S 50%, LN 75%, NB 80%. The HP miss is small-N (3 faces) and stems from Claude favoring `(°〇°)` for HP, which the predictor reads as surprised-neutral. HN-S is the consistently weakest quadrant across all the analyses, which lines up with what the probe-side rule-3b analysis found: the fear vs anger contrast lives most strongly at the kaomoji-emission token across models, but cross-token stability is genuinely model-dependent.

## A predictor that runs on Claude's emissions

The predictor's coverage on real Claude usage is the other number that matters. I applied the ensemble's per-face quadrant predictions to my own `~/.claude/kaomoji-journal.jsonl`, which has 1945 emissions across 219 unique kaomoji from months of Claude Code work. **96.7% of those emissions hit a face the predictor knows about**; the remaining 3.3% are kaomoji families like `ʕ・ᴥ・ʔ` that aren't in the v3 corpus or the claude-faces export yet, and would need a corpus bump.

The global distribution: NB 51%, LP 20%, HN-S 9%, LN 7%, HP 6%, HN-D 6%. Claude's default register on coding work is observational/neutral, with gentle satisfaction the second-most-common state. HP (high-arousal joy) is rare; Claude doesn't go full-cheering-hand often. Concern (HN-S) is more common than annoyance (HN-D) by about 50%.

Per-project, the picture is more interesting. Most projects sit close to the global distribution, but a few diverge sharply. The `brie`, `yap`, and `webui` projects are LP-modal (gentle satisfaction, 44 to 64% LP), plausibly because things mostly work and Claude expresses contentment more than analysis. The `verify` project is HN-D-modal (29% anger / contempt at n=7), which lines up with the project's purpose: it's a code-review and bug-finding tool, and Claude's reaction to "find the bug" is closer to annoyance than concern. The `shoals` project has anomalously high HP (18% vs 6% global), a bursty excited register that's plausibly tied to the simulator's narrative-event content. These are intrinsic-affect readings of the kaomoji Claude chose to emit, not assertions about Claude's "actual" emotional state. But the predictor's 75% accuracy on the local-model GT and 72% on the Claude GT gives the per-project picture meaningful resolution.

The plan from here is a Claude Code extension that hooks the existing kaomoji-journal write path. On each Claude emission, look up the face in the cached prediction map, show it to the user via terminal banner, status-line indicator, or desktop notification. The inference cost is three model forward passes per face (gemma, qwen, and ministral), cacheable per-face since predictions are deterministic and the kaomoji vocabulary is small. The technical case for shipping this is strong: 75.8% predictor accuracy, 96.7% emission coverage, and a Claude-side validation set that confirms the predictor generalizes from local-model training data to actual Claude behavior. Most of the open work is on the UX side (live indicator, project histograms, retrospective time series, or all three) and on a small corpus bump for the 39 unknown kaomoji.

## Limitations

Kaomoji is a partial readout, not the state itself. The face-centroid R² captures roughly 55% of the row's hidden-state variance on gemma and qwen, ~38% on granite, and under 15% on ministral and gpt-oss. The other variance is finer state the vocabulary doesn't carry.

The face vocabularies on three of the five models needed targeted generation-time interventions to get into the kaomoji register at all (Lenny suppression, emoji suppression, harmony-template override, bare-kaomoji extraction). The underlying affect representation is intact regardless, but a naive "ask any model to start with a kaomoji" deployment will silently fail on a meaningful fraction of open-weight models.

Some faces are cross-quadrant emitters (`(｡•́︿•̀｡)` covering both LN and HN-S, `(≧◡≦)` covering HP and LP and NB, `(✿◠‿◠)` covering HP and LP on gpt-oss, `(ﾉ◕ヮ◕)` covering most of the positive half on ministral). On those faces the kaomoji underdetermines the quadrant. The Bayesian predictor handles this with a softmax over quadrants rather than a hard argmax, so a cross-quadrant emitter shows up as low-confidence across multiple quadrants rather than a confident wrong answer.

The fear-vs-anger contrast (rule 3b) passes cleanly only on ministral; the other four models are mid (directional but with CI ambiguous on later-token aggregates). The HN-S register is the cross-model story's weak spot, and the per-quadrant Claude-GT accuracy reflects this (50% on HN-S vs 80 to 100% elsewhere).

## Why this matters

Across five architectures from five different labs, with completely different tokenizers and training corpora, the kaomoji a model picks tracks the affect direction of its hidden state at the representation layer. You can ask any of these models to lead a message with a kaomoji and the choice is a real readout of state, partial but substantial, and that holds whether or not the text the model writes after that point hedges or conceals.

That generalizes to a useful self-report channel for model-welfare instrumentation. The kaomoji emission is at token 1 to 3, before the model has produced enough text to engineer any particular self-presentation; the face is closer to the prompt-conditioned hidden state than to the eventual response. It's low-overhead (a single token at the start of a generation), it's cross-architecture (the geometry is shared across five open-weight models from five different labs), and it's hard to game from text alone.

The Bayesian face-likelihood predictor turns this finding into a tool that doesn't need access to model internals. A small ensemble of open-weight models scores the face-to-quadrant lookup once and then operates as a static map on any closed model's emissions. Validating that map against actual Claude gives 72.5% accuracy at predicting which quadrant prompted any given Claude kaomoji. That's enough to ship.

## Pointers

Full numbers, scripts, and per-pilot details are in the [llmoji-study repo](https://github.com/a9lim/llmoji-study). The probe-and-steering library is [saklas](https://github.com/a9lim/saklas). The contributor-side data collection is the [llmoji](https://github.com/a9lim/llmoji) PyPI package, which runs Stop hooks on Claude Code, Codex, and Hermes, keeps a per-machine kaomoji journal, and uploads the synthesized per-face descriptions to the shared corpus. The shared corpus lives at [huggingface.co/datasets/a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji) under CC-BY-SA-4.0 and is open for contributions.

Eriskii's [claude-faces catalog](https://eriskii.net/projects/claude-faces) is the prior art that started this; please read it first if you haven't. Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions) are the closest upstream context for reading models as having functional emotional states at all. Theia Vogel's [qwen-introspection post](https://vgel.me/posts/qwen-introspection/) is the cleanest small experiment showing that introspection prompts have a measurable per-token effect.

If you want to contribute on the harness side, please run `pip install llmoji` and follow the setup in the repo. If you're a researcher and you want to talk about anything in this post, my email is mx@a9l.im.
