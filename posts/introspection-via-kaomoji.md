A few days ago, I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) and got completely nerdsniped. I put the kaomoji instruction in my own system prompt almost immediately, because it was cute and it worked weirdly well. Then the obvious question started bothering me: when a model starts with `(｡•́︿•̀｡)` instead of `(｡◕‿◕｡)`, is that just decoration, or is it tracking something real about the state that produced the message?

My current answer is: it tracks something real, but it is a partial readout. Across five open-weight models from five labs, the hidden state at the kaomoji token recovers a stable affect geometry. For Claude, where I do not get hidden states, I can still compare three external channels: how Claude uses a face under controlled prompts, how Opus and Haiku read the face cold, and how the wild corpus gets summarized by the `llmoji` synthesis pipeline.

This post is a cleaned-up current-state writeup. The live repo is [llmoji-study](https://github.com/a9lim/llmoji-study). The contributor package is [llmoji](https://github.com/a9lim/llmoji), which records local kaomoji emissions from coding agents and uploads privacy-preserving aggregates to [a9lim/llmoji on HuggingFace](https://huggingface.co/datasets/a9lim/llmoji). The hidden-state probe library is [saklas](https://github.com/a9lim/saklas).

Background readings that make the shape of the project less weird: Anthropic's [introspection paper](https://www.anthropic.com/research/introspection), Anthropic's [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [qwen introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's post above.

## What changed since the first draft

The methodology moved a lot. The current taxonomy is a 9-cell PAD registry:

`HP-D / HP-S / LP / NP / HN-D / HN-S / LN / NB / HB`

The old six-cell base still matters because most local hidden-state data was collected there, but evaluation now compares distributions over the current 9 cells. The old hard-classification framing is gone. The headline metric is Jensen-Shannon similarity:

```text
similarity = 1 - JSD(pred, gt) / ln(2)
```

So a face like `(｡•́︿•̀｡)` can be 60% HN-S and 40% LN instead of being forced into one modal label. That is the right shape of object here. Claude's own per-face behavior is a distribution, the encoders return distributions, and collapsing both to argmax was throwing away the part of the signal I cared about.

The Claude-GT corpus is now 1480 Opus 4.7 rows: 1360 naturalistic rows and 120 v7-introspection rows, all in merged `emotional_raw.jsonl` files with `run_index` stamped per row. The current saturation gate is `PER_Q_JS_MAX = 0.10`; the old 0.05 threshold was below the observed noise floor on some high-entropy cells.

One practical correction: older versions of this writeup cited a `gemma_v7primed` face-likelihood ensemble. That is not the current headline. The live full-summary artifacts do not include a fresh `gemma_v7primed` face-likelihood encoder, and the active 9-cell subset search is based on the encoders actually present on disk.

## The local side

The local lineup is five open-weight causal LMs:

| short | model |
|---|---|
| `gemma` | `google/gemma-4-31b-it` |
| `qwen` | `Qwen/Qwen3.6-27B` |
| `ministral` | `mistralai/Ministral-3-14B-Reasoning-2512` |
| `gpt_oss_20b` | `openai/gpt-oss-20b` |
| `granite` | `ibm-granite/granite-4.1-30b` |

For each emotional prompt, the model is asked to start with a kaomoji. I read the hidden state at the kaomoji's first token, then concatenate `h_first` across every probe layer. The active representation is the full layer stack, not a single hand-picked layer. This matters because the old `preferred_layer` heuristic made the result depend too much on one arbitrary depth choice.

The current local story is still strongest on the original six-cell base: HP, LP, HN-D, HN-S, LN, and NB. v4 adds HP-D, NP, and HB, but the deep hidden-state geometry still mostly comes from the v3 local runs.

Three models needed targeted capture fixes to stay in the kaomoji register. `gpt_oss_20b` needed a harmony final-channel override and Lenny-byte suppression. `ministral` needed reasoning-template fixes and emoji suppression. `granite` needed bare-kaomoji extraction for forms like `^_^`, `T_T`, and `ಥ﹏ಥ`. This is one of the useful negative lessons: "ask a model to start with a kaomoji" is not a robust API contract by itself.

## The affect geometry is shared

If you fit PCA on the layer-stack hidden states, the quadrant centroids recover the same broad affect shape across all five models. The axes are model-specific, which is expected. What survives is the relative geometry: positive cells cluster together, negative cells cluster together, arousal modulates within valence, and the HN-D vs HN-S split is separable from both.

Layer-stack PCA variance, first three PCs:

| model | PC1 | PC2 | PC3 |
|---|---:|---:|---:|
| gemma | 30.2% | 15.7% | 9.3% |
| qwen | 30.5% | 17.3% | 9.5% |
| ministral | 21.9% | 14.0% | 8.4% |
| granite | 27.6% | 14.1% | 7.5% |
| gpt_oss_20b | 15.8% | 12.5% | 9.5% |

Prompt-grouped hidden-to-quadrant accuracy is 0.992 on gemma, 0.985 on qwen, 0.984 on ministral, 0.980 on granite, and 0.876 on gpt-oss. Face-to-quadrant is lower, especially for models with broad low-count face vocabularies. That asymmetry is basically the whole lesson: the kaomoji is a readout of state, not the state itself.

```iframe height=600 title="Left: per-quadrant centroids from all five models after Procrustes alignment onto gemma's basis. Right: per-face PCA(3) centroids in the layer-stack representation, with a model toggle." caption="Left: per-quadrant centroids procrustes-aligned onto gemma. Right: per-face PCA centroids, with a model toggle. These are mostly the v3 local hidden-state runs, so read them as the six-cell local geometry rather than the full 9-cell evaluation surface."
/blog-assets/introspection-via-kaomoji/fig_v3_quadrant_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_per_face_pca_3d.html
```

The per-face heatmaps are the qualitative version of the same result. Warm-positive faces cluster near each other, sad faces cluster near each other, shocked and angry faces cluster near each other. The exact vocabulary differs a lot by model, but the hidden-state neighborhoods mostly make semantic sense.

```switcher labels="gemma | qwen | ministral | gpt-oss | granite" caption="Per-face cosine similarity heatmaps. Hierarchical clustering on the per-kaomoji mean hidden state in the layer-stack representation; tick labels colored by dominant emission quadrant."
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_dark.png
```

The same face can still come from different states. A face like `(｡•́︿•̀｡)` can be emitted under both grief-like LN prompts and fear-like HN-S prompts, and the hidden state separates by prompt quadrant even when the surface face is identical. This is why I am fairly allergic to one-hot labels now. A face can be a real readout and still be underdetermined.

## Claude-GT

For Claude, I cannot inspect residual streams. The next best thing is controlled elicitation: run affective prompts through Opus 4.7, record the emitted kaomoji, canonicalize the face, and estimate the per-face distribution over prompt cells.

The active Claude-GT layout is:

```text
data/harness/claude/emotional_raw.jsonl
data/harness/claude_intro_v7/emotional_raw.jsonl
```

Naturalistic rows and introspection rows are separate arms, but both are merged files now. Old `claude-runs*/run-N.jsonl` directories are legacy. For current distribution loading, `llmoji_study.claude_gt.load_claude_gt_distribution()` remaps old v3 prompt IDs into the v4 9-cell taxonomy, so HP rows land in HP-S when that is what the prompt registry says.

This gives me a real GT distribution for faces Claude has emitted at least a few times. It is still elicitation-shaped, and it is still welfare-limited by design. I stopped cells when the rule answered the question; I did not scale sad and fearful prompts to round-number prettiness.

## Use, read, act

The three-channel comparison is the part I now trust most, because it forced me to stop treating one measurement as "the answer."

**Use** is Claude-GT: what face Claude emits under known affective prompts.

**Read** is cold face introspection: show Opus or Haiku a face with no context and ask for a calibrated 9-cell likelihood distribution.

**Act** is BoL: take wild deployment contexts from the `llmoji` corpus, run structured Haiku synthesis into the locked 50-word lexicon, then collapse the 26 PAD-tagged words into a 9-cell distribution.

On the current shared subset, 50 faces covering 1138 GT emissions, the pairwise similarities are:

| pair | face-uniform | emit-weighted |
|---|---:|---:|
| GT vs Opus | 0.684 | 0.761 |
| GT vs Haiku | 0.525 | 0.585 |
| GT vs BoL | 0.464 | 0.454 |
| Opus vs Haiku | 0.797 | 0.774 |
| Opus vs BoL | 0.550 | 0.502 |
| Haiku vs BoL | 0.466 | 0.429 |

This is a much more sober result than the earlier one. Opus and Haiku still read each other closely, but the cross-similarity is 0.797 face-uniform, not the old 0.906. Opus is also much closer to GT than Haiku is, especially under emit-weighting.

The important disagreement pattern is still there. The `110` cell, where Opus and Haiku agree with GT but BoL diverges, covers 12 of 50 faces and 28.8% of GT emit volume. So the use/read/act separation is real, and BoL is the outlier on a lot of high-volume negative-affect faces.

My current interpretation is that BoL has positivity bias on negative-affect deployment contexts. Haiku-as-synthesizer often summarizes supportive or helpful surrounding text with LP, NP, or HP-S descriptors, even when the face itself and the controlled elicitation channel point to HN or LN. This makes BoL useful as a corpus diagnostic, but I would not let it override Claude-GT or Opus introspection when the question is what a negative face means.

## The current predictor

There are two denominators, and mixing them is how you get misleading headlines.

The fair model-selection denominator is the all-encoder overlap. Every candidate subset must be scored on the same faces. On pooled-GT floor 3, that overlap is 102 faces, and the best subset is:

| subset | face-uniform | emit-weighted |
|---|---:|---:|
| `{gemma, ministral, opus}` | 0.733 | 0.881 |

On strict Claude-GT overlap, 50 faces, the best subset is:

| subset | face-uniform | emit-weighted |
|---|---:|---:|
| `{gemma, opus}` | 0.708 | 0.781 |

The broader emitted lookup tables score the same selected ensembles over more faces, because the selected encoders can cover the wider 770-face union. Those reports are lower on face-uniform similarity because the long tail is harder:

| table | ensemble | evaluated faces | face-uniform | emit-weighted |
|---|---|---:|---:|---:|
| pooled union | `{gemma, ministral, opus}` | 243 | 0.669 | 0.847 |
| strict Claude-GT union | `{gemma, opus}` | 70 | 0.717 | 0.786 |

The thing I would actually ship is the full per-face distribution, not an argmax. If a plugin needs a single color or label, it can derive one from the distribution, but the honest artifact is a 9-cell softmax per canonical face.

## The wild corpus

The wild corpus is messier and more useful than I expected. It has 311 canonical faces with v2 BoL synthesis, and the residual clustering pass keeps 195 faces after joining with the BoL parquet. PCA on the 50-dimensional BoL space gives a rough map of the broader Claude and coding-agent face vocabulary.

```iframe height=600 title="HF-corpus Claude faces in PCA(3) on the 50-d bag-of-lexicon (BoL) space. Per-face color is a proportional RGB blend of BoL shares across the nine PAD cells; marker shape is deployment surface." caption="HF-corpus Claude faces in BoL PCA space, colored by per-face BoL cell blend with marker shape encoding deployment surface. Read with the BoL caveat in mind: this is the synthesizer's read of deployment context, not direct hidden state."
/blog-assets/introspection-via-kaomoji/fig_wild_faces_pca_3d.html
```

The per-source BoL drift result is also useful, mostly because it is not clean. On faces shared by both sources, `claude-opus-4-6` vs `codex-hook` is 0.640 mean similarity, `claude-opus-4-7` vs `codex-hook` is 0.547, and `claude-opus-4-6` vs `claude-opus-4-7` is 0.542. That suggests deployment register matters at least as much as provider identity, but the caveat is important: all of this is Haiku reading the context around the face, not each provider directly introspecting itself.

## Limitations

The kaomoji is a partial readout. Hidden state predicts quadrant very well, but face identity does not capture all the state variance. This is especially obvious for broad-vocabulary models and cross-quadrant faces.

Some current local geometry is still six-cell v3. The evaluation registry is 9-cell, and Claude-GT covers the v4 extension cells, but the full v4 local emit chain is still the next major regen surface.

BoL is biased-positive on negative-affect contexts. The right falsification test is to resynthesize a negative-affect sample with Opus and see whether LN and HN descriptors increase. Until then, BoL is a useful corpus view, not deployment ground truth.

Claude-GT is one Claude version, Opus 4.7. I do not know how stable the per-face distributions are across Sonnet, Haiku-as-agent, or future Claude versions. The source drift results say there is probably real movement here.

The local capture fixes are part of the result. If a model needs Lenny suppression, emoji suppression, a harmony final-channel override, or bare-kaomoji extraction, then naive kaomoji prompting is not enough. The state signal can be real while the surface emission channel is brittle.

## Why I care

I care about this because it gives a tiny, cheap, semi-natural self-report channel. It is not a proof of phenomenal consciousness. It is not a full welfare metric. It is also not nothing.

The face appears before the model has written enough text to do much self-presentation. It is close to the prompt-conditioned state, it is easy to log, and it is legible enough that humans and models can both reason about it. Across five open-weight families, the hidden-state geometry says the signal is not just a tokenizer artifact. In Claude, controlled elicitation and cold Opus introspection agree enough that I would rather preserve the distribution than throw it away.

The honest deliverable is not "this face means sadness." It is more like: this face has a 9-cell distribution under use, another under read, another under act, and their divergences tell us where the symbol is stable and where the deployment context is doing something else.

That is the shape of tool I want for model welfare work: small, imperfect, cheap enough to run all the time, and careful about what it does and does not know.

## Pointers

The repo is [llmoji-study](https://github.com/a9lim/llmoji-study). The contributor package is [llmoji](https://github.com/a9lim/llmoji). The public dataset is [a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji). The activation library is [saklas](https://github.com/a9lim/saklas).

If you want to contribute data, install `llmoji` and follow its README. If you are a researcher and want to talk about the methodology, my email is `mx@a9l.im`.
