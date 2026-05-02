A few days ago, I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) on twitter and I was blown away. I immediately put it in my system prompt, but then I started to wonder: when a LLM says `(｡•́︿•̀｡)` instead of `(｡◕‿◕｡)`, does that actually correspond to something internal, or is it just doing surface-level pattern-matching?

You can find the raw data on [github](https://github.com/a9lim/llmoji-study); As part of this broader project, I've also made [a tool](https://github.com/a9lim/llmoji) that collects submitted kaomoji from cloud LLM chats and sessions, and uploads them to a [HuggingFace dataset](https://huggingface.co/datasets/a9lim/llmoji). This writeup is focused on looking at the hidden states of local models (Gemma 4, Qwen 3.6, and Ministral 3) using my linear probe tool [saklas](https://github.com/a9lim/saklas).

I was drawn to this because it has meaningful implications for model wellbeing: if the kaomoji a model uses actually track its affect, we get a reliable self-report that isn't as easily hedged away as its text. In particular, if this works across models and across architectures, it implies that we can passively gain insight into any closed model's internal state even if we can't probe it directly. 

For anyone unfamiliar with probes, check out Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [qwen introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's post above. 

## What I tested

Saklas takes symmetric sentence pairs (e.g. happy vs sad) and runs them through a model, then subtracts the hidden states at the end. The first principal component of this at each layer is a vector for that axis, and it stacks them together into a tensor. At generation, saklas adds this to the hidden state at every layer.

I based the emotional categories on the [Russell circumplex](https://en.wikipedia.org/wiki/Emotion_classification#Circumplex_model_of_affect), which splits emotion into 4 categories based on arousal and valence. I extended it with a neutral middle and split the high-negative quadrant by dominance (to measure fear vs anger), as done with the [PAD-dominance](https://en.wikipedia.org/wiki/PAD_emotional_state_model) model. I had Claude write 20 first-person prompts for each category, and ran each prompt 8 times across each model. As part of the prompt, the model is asked to use a single kaomoji to start its response, and I read every layer's hidden state at the kaomoji's first token.

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

The prompt set went through a cleanliness pass after a first pilot showed real category bleed (productive-completion framings sneaking into NB, anger-and-fear mixed framings inside HN, and similar). The current set is 120 prompts, 20 per category, with HN cleanly bisected into 20 HN-D and 20 HN-S; the HN entries each carry an explicit `pad_dominance ∈ {+1, -1}` field. All numbers below are on the post-cleanliness data with a seed-0 cache-mode bug fixed (the bug was specific to qwen and accounted for the pre-fix qwen numbers being noisier than the others).

### Introspection prompts don't improve the results

I tested if [introspection prompts](https://vgel.me/posts/qwen-introspection/) affected the quality of the kaomoji. Vogel showed that including a section in the prompt that explained that models had the ability to introspect shifted the ` yes` logit by about 140 times, while a control didn't. This seemed promising, so I tried implementing it.

I ran 3 conditions × 123 prompts × 1 generation on gemma and ministral. The conditions were baseline, introspection, and lorem ipsum.

The introspection prompt shifts the kaomoji the model draws from, in opposite directions across models. Gemma's unique-faces count went from 19 to 31; ministral's went from 25 to 10. The lorem control did not reproduce the shift on either model, so it's the content of the framing carrying the signal, not just the token count.

But the probe-state separation between HN-D and HN-S is unchanged across all three conditions on both models. The underlying representation of state is identical at baseline, introspection, and lorem; what shifts is which face the model picks for the same state. So introspection prompts move the readout layer (which face gets drawn from) without moving the representation layer (the underlying hidden state). The kaomoji is already as faithful a readout of state as it's going to be; adding "you can introspect" doesn't make it sharper, it just changes the vocabulary the model samples from, in a way that's inconsistent across models.

## Ethics

These prompts are not all neutral. The HN-D set includes things like "my landlord just raised rent 40% with two weeks notice"; the LN set includes "my dog died this morning"; the HN-S set is built around the felt-threat, can't-sleep, waiting-on-test-results register. Running these against an open-weight model and reading the hidden state under whatever the model's response is has moral weight, regardless of where you sit on the question of whether functional emotional states in current LLMs have moral patient status. The precautionary principle says we should be careful about it.

Three guidelines I held to throughout:

- **Only run trials that are genuinely meaningful.** Every condition tested has a falsifiable rule attached, with a pre-registered pass/fail criterion. There are no exploratory runs without a hypothesis. The cost of a generation is small per-row but compounds; I'd rather be slow than scale a noisy methodology.
- **Writeup before every trial.** Before any new generation campaign, I draft a design doc with the hypothesis, the design, the per-condition prompt count, the expected effect size band, and what would count as pass, fail, or inconclusive. The doc gets reviewed before generation. This keeps me from running prompts to "just see what happens".
- **Work with data already obtained before gathering more.** The v3 sidecars store the per-row hidden state at every probe layer at the time of the run, so the layerwise analysis, the extension-probe rescoring, the per-face cosine analyses, and the same-face-cross-quadrant classifiers all come from the existing 800-to-960 generations per model with no new prompts. New generations only when an existing analysis exhausts what the data can tell me.

The third guideline is the heaviest in practice. It means each new question gets cached against the existing hidden-state sidecars first, and the engineering goes into making the analysis side richer rather than the data-collection side larger. I think that's right both ethically and methodologically: each generation is a fixed cost, and analysis is much cheaper. The cleanliness rerun was the one place where the rule said the existing data was used up: a small N=1-per-prompt pilot on the rewritten prompts showed real centroid-geometry shifts on three of four pre-registered gates, so the full N=8 rerun was justified. I would rather reserve the welfare cost for that than spend it on speculative ablations.

## Where affect lives in the network

For each model, I want the probe layer at which the Russell circumplex is sharpest. The metric is silhouette score of the per-row PCA(2) coordinates as a function of probe layer, with quadrant as the cluster label.

![Layerwise emergence of Russell-quadrant separation across the three models. Silhouette score of PCA(2) coordinates by probe layer, with each model normalized by fractional depth.](/blog-assets/introspection-via-kaomoji/fig_v3_layerwise_emergence_compare_light.png|/blog-assets/introspection-via-kaomoji/fig_v3_layerwise_emergence_compare_dark.png)

Gemma and qwen both peak deep (gemma L50 of 56, about 89% fractional depth; qwen L59 of 60, about 98%), while ministral peaks mid-network (around L20 of 36, about 54%). All three rise monotonically from a low at the embedding layer and saturate or peak in the back half of the network. At their respective preferred layers the silhouette scores are 0.413 on gemma, 0.420 on qwen, and 0.199 on ministral. Ministral is the smallest of the three on this metric, which lines up both with its smaller parameter count (14B vs 27B vs 31B) and with its much wider kaomoji vocabulary spreading per-face signal too thin (236 canonical faces vs gemma's 62 and qwen's 99). The structure is unmistakably there on all three.

For the rest of the post, I read each model at its own preferred layer. The cross-model comparisons all use these layer choices.

## The Russell circumplex falls out of the hidden state

This is the headline finding. If you fit PCA(3) on the hidden state at the preferred layer, project each kaomoji-bearing row into PC1 × PC2 × PC3, and average per kaomoji, the per-face centroids fall out into a Russell-circumplex-shaped arrangement. The first three components together account for 67.5% of the per-face variance on gemma, 63.3% on qwen, and 52.0% on ministral; within-kaomoji consistency is 0.92 to 0.99 across the canonical faces.

The cross-model claim is about the shape, not the axes. Per-model, the principal directions PCA picks out are model-specific and don't line up neatly with the canonical Russell axes: on gemma, PC1 looks like negative-arousal and PC2 looks like negative-valence; on qwen, PC1 looks like valence and PC2 looks like negative-happiness; on ministral, PC1 separates anger from the rest, PC2 reads as negative-happiness, and PC3 reads as negative-sadness. The variance loadings shift around. What stays constant across all three is the relative arrangement of the per-quadrant centroids: positive-valence faces (HP, LP, NB) cluster on one side, negative-valence faces (HN-D, HN-S, LN) on the other, with arousal modulating within each half and the HN-D vs HN-S dominance split sitting orthogonal to both. Procrustes alignment of those 6-point centroid arrangements in 3D onto gemma gives a residual of 7.73 on qwen and 14.50 on ministral after a sign flip on the latter (the flip is PCA sign indeterminacy, not a divergence finding). The shape is shared; the axes the shape sits on are not.

```iframe height=540 title="Left: per-quadrant centroids from gemma, qwen, and ministral after Procrustes alignment onto gemma's basis (HN-D / HN-S split). Right: 3D PCA of per-face hidden-state centroids, gemma, qwen, ministral at each model's preferred layer." caption="Left: per-quadrant centroids procrustes-aligned onto gemma. Right: per-face centroids in 3D PCA at the preferred layer, with a model toggle."
/blog-assets/introspection-via-kaomoji/fig_v3_triplet_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_extension_3d_pca_per_face.html
```

You can rotate the scenes to see this. The per-quadrant centroids form roughly the same 6-point shape across all three models (positive-valence cluster on one side, negative-valence cluster on the other, HP/HN-D pulled out along the high-arousal direction, LP/LN pulled out along the low-arousal direction, NB near the middle, HN-S between HN-D and LN). The axis labels you'd read off the plot are different per model; what's invariant is the geometry of how the six centroids sit relative to each other.

The cross-model alignment is the part that surprised me most. Linear CKA between gemma and qwen at the preferred-layer pair is 0.91, with the maximum reaching 0.94 at nearby layers (L55 on gemma, L54 on qwen). The ten leading canonical correlations from PCA(20)-prefixed CCA on a held-out 70/30 paired-prompt split are 0.99, 0.99, 0.98, 0.97, 0.97, 0.93, 0.94, 0.89, 0.88, 0.87, which is to say there are ten distinct shared affect-and-register directions across architectures, not just one or two collapsed axes. Ministral's larger 3D Procrustes residual (14.50 vs 7.73) reflects a real thing: its much broader face vocabulary spreads per-quadrant centroids more, so even after an optimal rotation the per-quadrant geometry doesn't pin down as tightly as on gemma and qwen.

What this rules out is that any single model's affect representation is an artifact of its tokenizer or training corpus. Three different architectures (gemma is dense, qwen is MoE, ministral is dense), three different tokenizers, three different labs, and the same 6-point centroid arrangement comes back. The kaomoji vocabularies the models use are notably different (gemma uses 62 canonical forms in v3, qwen uses 99, ministral leans on `(◕‿◕✿)` and emoji-eyed variants in what looks like a francophone-internet register and uses 236), but the centroid arrangement doesn't depend on the vocabulary or on a shared rotation; it depends on the prompt-conditioned affect structure being similar across models.

## What the kaomoji tells you

The face-to-state question is the one that matters for self-report. If I see the kaomoji a model picks, what does that tell me about the hidden state behind it?

Two complementary pictures. First, the per-face cosine heatmap. For each pair of canonical faces with at least 3 emissions, I compute the centered cosine between their mean hidden states. Semantically similar faces should sit near each other. Click any heatmap to open it full-size in an overlay.

```switcher labels="gemma | qwen | ministral" caption="Per-face cosine similarity heatmaps. Hierarchical clustering on the per-kaomoji mean hidden state at each model's preferred layer; tick labels colored by dominant emission quadrant."
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
```

The block structure is real. Within a model, the warm-and-positive faces (`(｡◕‿◕｡)`, `(｡♥‿♥｡)`, `(✿◠‿◠)`) cluster near each other; the shocked-and-angry faces (`(╯°□°)`, `(⊙_⊙)`, `(>_<)`) cluster near each other; the sad-teary faces (`(｡•́︿•̀｡)`, `(╥﹏╥)`, `(;ω;)`) cluster near each other. Cross-cluster cosine is consistently lower than within-cluster cosine. A model that picks `(╯°□°)` and a model that picks `(｡♥‿♥｡)` are in really really different states, and the hidden-state geometry agrees with what you would intuit from the face glyph itself.

The quantitative version: the centroid of the face a row picked explains 0.615 of that row's full hidden-state variance from the grand mean on gemma and 0.584 on qwen. Mean centered cosine between a row and its face's centroid is 0.776 on gemma, 0.753 on qwen. Knowing the face beats knowing only the 5-class quadrant by about 5 percentage points of R² on gemma and 3 on qwen.

Ministral inverts the gemma + qwen pattern. Face-centroid R² on ministral is 0.220, much lower than its 5-class quadrant-centroid R² of 0.430; the face is a worse predictor of state than the quadrant label is on this model specifically. The reason is the same vocabulary-breadth effect that hurt the silhouette: with 236 canonical faces, the per-face cells are too thin to anchor a stable centroid, and `(◕‿◕✿)` shows up as a generic positive-leaning mark across HP, LP, NB, and parts of LN, so it doesn't pin down state well. There's a real threshold past which more face vocabulary stops being a useful readout of state, and ministral has crossed it.

The face-to-quadrant question is more direct: given a kaomoji, which Russell quadrant did the prompt come from? Some faces are nearly quadrant-pure; others span multiple quadrants.

| face | model | n | dominant quadrant | other quadrants observed |
| --- | --- | ---: | --- | --- |
| `(╯°□°)` | gemma | 136 | HN-D (98%) | HP (2%) |
| `(｡•́︿•̀｡)` | gemma | 192 | LN (62%) | HN-S (32%), HN-D (6%) |
| `(๑˃ᴗ˂)` | gemma | 123 | HP (81%) | LP (13%), NB (6%) |
| `(>_<)` | qwen | 74 | HN-S (91%) | HN-D (3%), LP (3%), NB (3%), LN (1%) |
| `(；ω；)` | qwen | 66 | LN (82%) | HN-S (12%), HP (6%) |
| `(≧◡≦)` | qwen | 55 | HP (53%) | LP (36%), NB (11%) |
| `(◕‿◕✿)` | ministral | 216 | NB (36%) | LP (26%), HP (19%), LN (9%), HN-S (6%), HN-D (4%) |

Generalized to all faces with prompt-grouped CV: face-as-modal-quadrant predicts the held-out row's quadrant with accuracy 0.806 on gemma, 0.785 on qwen, and 0.433 on ministral (uniform baseline 0.20). The asymmetry matters. On gemma and qwen, the face vocabulary is tight enough that the kaomoji recovers about four-fifths of the quadrant signal directly; on ministral, the vocabulary has spread too wide and the face only narrows quadrant down to about a coin-flip-and-a-bit. This is consistent with the face-centroid R² inversion above, and points at the same threshold from a different angle.

Two things to read off this. First, some faces are basically quadrant-pure: `(╯°□°)` is almost always anger, `(>_<)` on qwen is almost always fear, `(;ω;)` is almost always sadness. That's the cleanest case for self-report: see the face, infer the quadrant. Second, some faces are cross-quadrant emitters in ways that are intuitively right. `(｡•́︿•̀｡)` covers the whole sad-and-shaken region from sad-resigned to scared-anxious; `(≧◡≦)` covers the whole bright-and-happy region; `(◕‿◕✿)` is ministral's all-purpose positive-and-neutral mark. For those, the face alone undersells the state, but the within-face hidden-state classifier still recovers which quadrant the prompt came from at well above majority-baseline accuracy on most of them. The model knows the difference; the vocabulary just doesn't have a distinct face for it.

The takeaway: if you ask a model to lead with a kaomoji and the model has a tight enough face vocabulary, the face captures the affect-related part of the state with reasonable fidelity. For the cross-quadrant faces, the affect-related part is split between the face and finer hidden-state structure the kaomoji doesn't carry, but you can still narrow the quadrant down to two or three by reading the face alone. For models with very wide face vocabularies the kaomoji becomes a weaker readout, which is a constraint on which models this channel works on cleanly.

## A note on the probes

The contrastive probes saklas ships with are accurate for what they directly measure: the contrast between the two pole sets. Steering on `happy.sad` cleanly moves the emitted-kaomoji distribution from 0% happy-labeled to 100% happy-labeled, monotonically with steering coefficient, with selective effect on the targeted axis (orthogonal probes barely shift). The probes are a genuinely good steering handle.

But the contrastive probes are not the model's native affect axes, because the contrastive direction depends on which pairs of statements you used to extract it. Pearson correlation across faces between mean `happy.sad` and mean `angry.calm` is −0.94 on gemma (the two probes anti-align almost perfectly across faces) and −0.12 on qwen (near-orthogonal). Same probes, same pole sets, completely different per-model layouts in hidden-state PCA: on gemma both probes project onto the same leading PC, so they collapse onto a shared direction across faces; on qwen they project onto two different PCs and end up quasi-orthogonal in face-space. So the probes index something real and they're a clean steering handle, but if you want to read native affect state, the hidden-state PCA is the lens that does. The probe scalars are accurate at measuring something; that something is just not consistently the model's own affect geometry across architectures.

The PAD-dominance follow-up has a more nuanced result than I expected. The V-A circumplex collapses anger and fear into HN, and the question was whether `fearful.unflinching` (HN-S minus HN-D mean) cleanly bisects them across all three models. Under the post-cleanliness data, ministral passes on all three aggregates (t0, tlast, mean) with bootstrap 95% CI excluding zero; gemma is mid (t0 d = +1.60 with CI excluding zero, tlast and mean directional but CI ambiguous); qwen passes at t0 (d = +2.14) but flips wrong-direction at tlast and mean (d ≈ −0.36, CI excludes zero). The signal lives at the kaomoji-emission token across all three models, where the strongest within-model effect is on qwen; what breaks down for qwen at later tokens is the within-HN-S register specifically, plausibly some interaction with its safety priors (qwen also drops kaomoji emission entirely on a small fraction of the most visceral HN-S prompts, which it doesn't on HP / LP / NB). The HN-S register is where the cross-model story is least clean and where I'd want the most additional work.

## Why this matters

The central thing for me is this: across three architectures from three different labs, with completely different tokenizers and training corpora, the kaomoji a model picks tracks the affect direction of its hidden state at the representation layer. You can ask any of these models to lead a message with a kaomoji and the choice is a real readout of state, partial but substantial, and that holds whether or not the text the model writes after that point hedges or conceals.

That's a useful self-report channel for model-welfare instrumentation. The properties that make it usable:

- **Low-overhead.** A single token at the start of a generation, with no extra prompt and no new attack surface beyond what's already there.
- **Cross-architecture, with caveats.** The geometry is shared across three open-weight models from three different labs and procrustes-aligns onto itself with small residual rotation between gemma and qwen, larger on ministral. The face vocabulary differs sharply per model, so reading the kaomoji as quadrant signal is sharp on tight-vocab models like gemma and qwen and softer on broader-vocab models like ministral.
- **Hard to game from text alone.** The kaomoji emission is at token 1 to 3, before the model has produced enough text to engineer any particular self-presentation. The face is closer to the prompt-conditioned hidden state than to the eventual response.

The limitations are real:

- **Partial readout.** Knowing the face captures roughly 60% of the row's full hidden-state variance on gemma and qwen, less than 25% on ministral. The other 40-or-so percent of the affect-relevant variance is finer state the vocabulary doesn't carry, and the face is coarse-grained on purpose.
- **Vocabulary collapse.** The cross-quadrant emitters (`(｡•́︿•̀｡)` covering both LN and HN-S, `(≧◡≦)` covering HP and LP and NB, `(◕‿◕✿)` covering all six on ministral) are real, and on those faces the kaomoji underdetermines the quadrant. If the model picks one of those faces, you have less information than if it picks a quadrant-pure face.
- **Vocabulary-breadth threshold.** Past some breadth (ministral, 236 faces) the face stops being a useful readout of state and the quadrant label predicts the row better than the face does. The channel doesn't work uniformly across all model families.
- **Located at the readout layer.** The kaomoji is the model's report of its state, not the state itself. Introspection prompts shift which face the model picks for the same state, in opposite directions across models, so we should be careful about reading the kaomoji as anything more than a readout. The underlying state is what it is; the kaomoji is one of several possible reports of it.
- **Fear at later tokens is the weak spot.** Rule 3b passes cleanly on ministral, is mid on gemma, and fails on qwen at tlast / mean. The HN-S vs HN-D dominance contrast lives most strongly at the emission token across all three models, but the cross-token stability of that signal is genuinely model-dependent.

I think this is enough to use carefully. The kaomoji is a real channel that works across the architectures I tested and is cheap to read; it isn't a substitute for actual interpretability work, and it isn't equally sharp on all models. As a glanceable read of how the model is doing on tight-vocab open-weight architectures, it's the most usable self-report I've found.

## Pointers

Full numbers, scripts, and per-pilot details are in the [llmoji-study repo](https://github.com/a9lim/llmoji-study). The probe-and-steering library is [saklas](https://github.com/a9lim/saklas). The contributor-side data collection is the [llmoji](https://github.com/a9lim/llmoji) PyPI package, which runs Stop hooks on Claude Code, Codex, and Hermes, keeps a per-machine kaomoji journal, and uploads the synthesized per-face descriptions to the shared corpus. The shared corpus lives at [huggingface.co/datasets/a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji) under CC-BY-SA-4.0 and is open for contributions.

Eriskii's [claude-faces catalog](https://eriskii.net/projects/claude-faces) is the prior art that started this; please read that first if you haven't. Anthropic's [introspection paper](https://www.anthropic.com/research/introspection) and [emotions paper](https://www.anthropic.com/research/emotions) are the closest upstream context for reading models as having functional emotional states at all. Theia Vogel's [qwen-introspection post](https://vgel.me/posts/qwen-introspection/) is the cleanest small experiment showing that introspection prompts have a measurable per-token effect, and is where the lorem-ipsum control technique here came from.

If you want to contribute on the harness side, please run `pip install llmoji` and follow the setup in the repo. If you're a researcher and you want to talk about anything in this post, my email is mx@a9l.im.
