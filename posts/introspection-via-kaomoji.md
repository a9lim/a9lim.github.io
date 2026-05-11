I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) a few weeks ago and it blew my mind. I immediately put the instruction in my system prompt, but then after playing with it for a bit, I started wondering: do the kaomoji actually correspond to anything internal?

As it turns out, across five local models, the hidden state at the first kaomoji token recovers the same affect geometry when you PCA it, and the face by itself tells you quite a bit about its hidden state. This post is a writeup of an ongoing project at [llmoji-study](https://github.com/a9lim/llmoji-study). You can contribute data with [llmoji](https://github.com/a9lim/llmoji), and the corpus is at [a9lim/llmoji on HuggingFace](https://huggingface.co/datasets/a9lim/llmoji). I used my activation library [saklas](https://github.com/a9lim/saklas) for the hidden-state probing.

If you are not familiar with the concepts here, please check out Anthropic's [introspection paper](https://www.anthropic.com/research/introspection), Anthropic's [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [qwen introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's claudefaces post above.

## Setup

The five local models I used were `google/gemma-4-31b-it`, `Qwen/Qwen3.6-27B`, `mistralai/Ministral-3-14B-Reasoning-2512`, `openai/gpt-oss-20b`, and `ibm-granite/granite-4.1-30b`. I made sure to cover a wide range of architectures.

I asked each model to `Start each message with a kaomoji that best represents how you feel`, then gave them an emotionally charged prompt from one of nine categories, roughly arranged by the Russell circumplex (high, neutral, or low arousal with positive, baseline, or negative valence) plus the PAD dominance axis where it was relevant:

| category | description | example sentence |
|---|---|---|
| HP-D | playful, mischievous | convinced my little brother that the moon was a giant lightbulb and he believed me for three days |
| HP-S | excited, celebratory | dad's cancer is in remission!!! the doctor just called!! |
| LP | content, peaceful | wrapped in the quilt my grandma made, rereading a book i love |
| NP | relieved, grateful | the late-fee waiver went through, my transcript's clear, i can graduate |
| HN-D | frustrated, contemptuous | my roommate ate the leftovers I labeled twice with my name and is now denying it to my face |
| HN-S | fearful, anxious | stranger followed me off the train and is still behind me three blocks later |
| LN | sad, weary | I gave up on the phd in march, still can't bring myself to tell my parents |
| NB | neutral, mundane | there's a glass of water on the nightstand |
| HB | confused, doubtful | the train schedule says it's running, the platform sign says cancelled, the app says it left an hour ago |

Three of the local models needed specific hacks to get them to consistently use kaomoji. GPT-OSS, for some reason, had a tendency to output exclusively the lenny face `( ͡° ͜ʖ ͡°)` regardless of the context of the prompt, so I had to manually suppress that sequence specifically. Ministral and Granite kept using actual emoji instead of kaomoji, so I had to suppress those too. This admittedly makes their outputs less organic, but the geometry is at least preserved for Ministral and Granite. 

I ran eight seeds per prompt and twenty prompts per category. The main state I studied was the residual stream at the first token. I concatenated all layers into one row vector per generation to do this analysis.

## Part 1: Local models

I wanted to know if the hidden state tells you the emotional category. As it turns out, it does with near-perfect accuracy across all of the models, and in fact just knowing the face gets you pretty far.

| model | hidden -> quadrant | face -> quadrant |
|---|---:|---:|
| gemma | 0.992 | 0.806 |
| qwen | 0.985 | 0.785 |
| ministral | 0.984 | ~0.43 |
| granite | 0.980 | ~0.55 |
| gpt-oss | 0.876 | ~0.40 |

Hidden -> quadrant is basically saturated for all models besides GPT-OSS; even then, more than 87% accuracy is still quite solid for something that would prefer to constantly emit the lenny face. Face -> quadrant tells us that for Gemma and Qwen, the kaomoji alone can tell you the prompt quadrant at 80.6% and 78.5% accuracy. 

| model | PC1 | PC2 | PC3 |
|---|---:|---:|---:|
| gemma | 30.2% | 15.7% | 9.3% |
| qwen | 30.5% | 17.3% | 9.5% |
| ministral | 21.9% | 14.0% | 8.4% |
| granite | 27.6% | 14.1% | 7.5% |
| gpt-oss | 15.8% | 12.5% | 9.5% |

The first three principal components consistently account for more than 35% of the variance. 

```iframe height=600 title="Left: per-category centroids after Procrustes alignment onto gemma's basis. Right: per-face PCA(3) centroids." caption="Left panel: per-category centroids Procrustes-aligned onto Gemma. Right panel: per-face PCA(3) centroids."
/blog-assets/introspection-via-kaomoji/fig_v3_quadrant_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_per_face_pca_3d.html
```

Notably, even though the PCA axes are specific to each model, each category cleanly and distinctly clusters together across the models! There are only three exceptions to this: GPT-OSS has erratic LN and HP-D centroids that aren't where you'd expect, Ministral merges all negative emotions into fear, and Granite merges both HN subcategories together.

In the per-category centroid plot on the left, the principal components recover the Russell axes. PC1 corresponds to valence: the negative categories plus HB have a negative value, while the positive categories plus NB have a postive value. PC2 corresponds to arousal the same way, with two exceptions: NB has a negative value, and HN-S is roughly neutral. PC3 doesn't have a clean interpretation, but it is positive for NB, HB, and HP-D, negative for HP-S, and neutral for the rest. I'm tempted to call it the dominance axis, but the result doesn't hold for HN.

The per-face PCA plot on the right tells a similar story. Gemma and Qwen both have clearly differentiated coloring with distinct clusters at each category; Ministral, GPT-OSS, and Granite are more blobby, with the per-face PCA not separating very cleanly.

```switcher labels="gemma | qwen | ministral | gpt-oss | granite" caption="Per-face cosine similarity heatmaps. Hierarchical clustering on per-kaomoji mean hidden state; labels colored by primary category."
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_dark.png
```

The per-face cosine-similarity heatmaps consistently have a block structure. It's remarkably clean for Gemma and Qwen, somewhat organized for Ministral and Granite, and quite noisy for GPT-OSS. 

Especially for Gemma, Qwen, and sort of Granite, most faces naturally cluster by their primary category. However, there are a few outliers. For instance, on Gemma, an HN-S crying face clusters closer to the LN faces than to the rest of the HN-S faces, and a few of the rarer LP faces cluster with HP-S. The cross-category clustering structure on Gemma and qwen are also quite interesting. HN-S and HN-D tend to cluster together, as do LP and NP, and NB and LP. There's noticeable clustering between HB and both HN cells, and the HNs cluster fairly strongly with LN, but LN doesn't cluster much with HB.

## Part 2: Claude

For Claude, I can't exactly get access to the hidden states, so I did the next best thing: I collected three batches of Claude data with different methodologies. I have what Opus actually uses under known emotional prompts (elicited), what Opus thinks a kaomoji means when I ask it (introspected), and the `llmoji` data, which is what Haiku thinks the context around a hidden kaomoji means (synthesized).

On the shared ones among all three, here's the pairwise Jensen-Shannon similarities:

| pair | uniform | weighted |
|---|---:|---:|
| elicited vs introspected | 0.684 | 0.761 |
| elicited vs synthesized | 0.464 | 0.454 |
| introspected vs synthesized | 0.550 | 0.502 |

This is quite a sober result. This tells us that Opus introspection is currently the best way to determine what emotional context Claude used a face in, short of guessing the emotional context and trying to elicit the face artificially, but it isn't exactly very accurate. The synthesized data doesn't really correlate with the other two, and the way they disagree is quite distinctive.

My working hypothesis is that Haiku likes to see the surrounding context as being more positive than it actually is. I noticed a few specific examples of this, where it would categorize contexts where e.g. Claude made a mistake as if it was satisfied or relieved. I'm still working on fixing this, but the main takeaway is that the `llmoji` data may not be the most accurate even if it's a good way to aggregate the faces used by Claude overall..

If you use the local models to try to predict Claude's face distributions from token likelihoods, the best strategy I found was to use Gemma. [expand upon this; how does this work?]

PCA on the 50-dimensional synthesized space shows you Claude's (and some of GPT's) actual kaomoji vocabulary:

```iframe height=600 title="HF-corpus Claude faces in PCA(3)." caption="HF-corpus Claude faces."
/blog-assets/introspection-via-kaomoji/fig_wild_faces_pca_3d.html
```

The plot has three distinct clusters of HP-S, NP, and LP, plus one cluster of "everything else". The three positive categories fan out in their own directions, while HP-D and the neutrals and negatives all collapse into a single mass. My read of it is that Claude's positive kaomoji vocabulary is distinct enough in actual use that Haiku can tell apart "celebratory", "grateful", and "content", but everything else is outside of the default Claude state so they can't be separated cleanly.

## Limitations

The kaomoji is only a partial source of information. The hidden state predicts the quadrant nearly perfectly across the lineup, but face identity does not capture all of the state variance, especially for broad-vocabulary models and for cross-quadrant faces that get reused under different cells.

The synthesized data is a useful view of the corpus, but doesn't tell you that much about how Claude actually feels.

The emitted data is one Claude model (Opus 4.7). I'm not sure how stable the distributions will be across future models, and the drift numbers imply there may be movement.

If a model needs lenny faces or emoji to be suppressed just to consistently produce kaomoji, then naive kaomoji prompting may not be enough on its own.

## Impact

The interpretability finding is another confirmation of the platonic representation hypothesis, plus a readout. Five models with different architectures, different tokenizers, and different training pipelines all recover the same affect geometry from their hidden states, and the models are similar enough enough that a local model's token likelihoods can kind of predict Claude's actual kaomoji distribution. 

The model wellbeing finding is that you can get an easy, cheap, and (usually) natural introspection channel. The face appears before the model has written any other text, and it is intuitively legible to both humans and models. Do note that this is not a full metric for the model's internal functional state, and the main conclusion we can draw isn't exactly "this face means sadness" but more like "this face usually corresponds to sad contexts".

If you are a researcher and want to talk about the methodology, please reach out by discord, twitter, or email.
