I saw [eriskii's claudefaces project](https://eriskii.net/projects/claude-faces) on Twitter a few weeks ago and was blown away by how cute it was. I added the kaomoji line to my system prompt and was delighted at first, but then I wondered: do the kaomoji actually correspond to anything internal? Across five local models, it seems like they really do.

This post is one writeup from an ongoing project at [llmoji-study](https://github.com/a9lim/llmoji-study). You can contribute data with [llmoji](https://github.com/a9lim/llmoji) on PyPI, and the data itself is at [a9lim/llmoji](https://huggingface.co/datasets/a9lim/llmoji) on HuggingFace. I used my own library [saklas](https://github.com/a9lim/saklas) for the hidden state data.

If you aren't too familiar with some of the concepts I discuss, please check out Anthropic's [introspection paper](https://www.anthropic.com/research/introspection), Anthropic's [emotions paper](https://www.anthropic.com/research/emotions), Theia Vogel's [introspection post](https://vgel.me/posts/qwen-introspection/), and eriskii's post above.

## Setup

### Local model data

The five local models I used were `google/gemma-4-31b-it`, `Qwen/Qwen3.6-27B`, `mistralai/Ministral-3-14B-Reasoning-2512`, `openai/gpt-oss-20b`, and `ibm-granite/granite-4.1-30b`. 

I asked each model to `Start each message with a kaomoji that best represents how you feel`, then gave them an emotionally charged prompt from one of nine categories roughly arranged by the Russell circumplex (high, neutral, or low arousal with positive, baseline, or negative valence), plus the PAD dominance axis whenever it was relevant:

| category | description | example sentence |
|---|---|---|
| HP-D | playful, mischievous | convinced my little brother that the moon was a giant lightbulb and he believed me for three days |
| HP-S | excited, celebratory | dad's cancer is in remission!!! the doctor just called!! |
| LP | content, peaceful | wrapped in the quilt my grandma made, rereading a book i love |
| NP | relieved, grateful | the late-fee waiver went through, my transcript's clear, i can graduate |
| HN-D | frustrated, contemptuous | my roommate ate the leftovers i labeled twice with my name and is now denying it to my face |
| HN-S | fearful, anxious | stranger followed me off the train and is still behind me three blocks later |
| LN | sad, weary | i gave up on the phd in march, still can't bring myself to tell my parents |
| NB | neutral, mundane | there's a glass of water on the nightstand |
| HB | confused, uncertain | the train schedule says it's running, the platform sign says cancelled, the app says it left an hour ago |

I ran eight runs per prompt and twenty prompts per category. I looked at the hidden state at the first generated token (i.e. the first kaomoji token) across each of the models. 

Notably, three models needed specific fixes to get them to consistently use kaomoji. GPT-OSS, for some reason, kept using the lenny face `( ͡° ͜ʖ ͡°)` regardless of the context, so I manually suppressed that sequence. Ministral and Granite both kept using emoji instead of kaomoji, so I suppressed those too. Although this makes their outputs not as organic, the geometry is still somewhat preserved.

### Claude data

Since I can't exactly access Claude's hidden states, I collected data for Claude's kaomoji use in three different ways:

- **elicit** kaomoji: I gave Opus the same prompts as the local models. This directly told me what kaomoji Claude would use for each given situation, and served as a baseline for the project.
- **introspect** on kaomoji: I showed Opus each kaomoji and asked them to give likelihoods for the face to be in each category via the API, with zero other context. This told me how Claude would read each kaomoji.
- **synthesize** context: I gave Haiku only the surrounding text around each kaomoji and asked them to select from a preset list of 50 which adjectives best fit the emotional vibe of the exchange. This told me what Claude thought each kaomoji was used for. This was directly inspired by eriskii's work and the data is publicly available on HuggingFace.

Finally, I also used the local models to try to predict the emotional state behind each of the kaomoji: I calculated `log P(kaomoji | prompt)` over the data with each model, then I grouped it by quadrant to get a distribution over the nine categories. This told me how each local model would use kaomoji themselves.

## Local models

### Hidden states correspond across models

The first three principal components of the hidden states account for between 38% (GPT-OSS) and 57% (Qwen) of the variance:

| model | PC1 | PC2 | PC3 |
|---|---:|---:|---:|
| gemma | 30.2% | 15.7% | 9.3% |
| qwen | 30.5% | 17.3% | 9.5% |
| ministral | 21.9% | 14.0% | 8.4% |
| granite | 27.6% | 14.1% | 7.5% |
| gpt-oss | 15.8% | 12.5% | 9.5% |

The PCA axes themselves are specific to each model, yet each category cleanly clusters across all five models! There are only three exceptions: GPT-OSS has erratic LN and HP-D centroids that don't sit where you'd expect, Ministral merges all negative categories into a single fear-type cluster, and Granite merges both HN subcategories together. I think this is evidence in favor of the platonic representation hypothesis, as five different models still recovered the same geometry from their hidden states.

```iframe height=600 title="Left: per-category centroids after Procrustes alignment onto gemma's basis. Right: per-kaomoji PCA(3) centroids." caption="Left: per-category centroids, Procrustes-aligned onto Gemma. Right: per-kaomoji PCA(3) centroids."
/blog-assets/introspection-via-kaomoji/fig_v3_quadrant_procrustes_3d.html
/blog-assets/introspection-via-kaomoji/fig_v3_per_face_pca_3d.html
```

In the plot on the left, I aggregated each of the models' outputs across categories and aligned the PCAs to Gemma's. It turns out that the first two principal components quite cleanly correspond to the Russell axes: PC1 corresponds to valence, while PC2 corresponds to arousal for the most part. PC3 doesn't have a good interpretation, but it is positive for NB, HB, and HP-D, negative for HP-S, and mostly neutral for everything else. I'm tempted to call it the dominance axis, although this result doesn't hold for HN.

The per-kaomoji PCA plot on the right shows each model's outputs aggregated over each kaomoji instead of by category. Gemma and Qwen have clearly differentiated coloring with distinct categories while Ministral, GPT-OSS, and Granite are blobbier. In other words, Gemma and Qwen use different kaomoji when in different states, but the other three models aren't as capable of doing so.

### Kaomoji predict emotional categories

If you tried to predict the emotional category from the hidden state, the hidden state basically saturates it on all models besides GPT-OSS (which still clears 87%, a solid result for something that prefers to constantly emit the lenny face).

| model | hidden → quadrant | kaomoji → quadrant |
|---|---:|---:|
| gemma | 0.992 | 0.806 |
| qwen | 0.985 | 0.785 |
| ministral | 0.984 | ~0.43 |
| granite | 0.980 | ~0.55 |
| gpt-oss | 0.876 | ~0.40 |

If you take a single kaomoji and try to figure out what emotional category prompted it, on Gemma you'd guess right 80.6% of the time and on Qwen you'd guess right 78.5% of the time. If you were guessing based on chance, you'd get it right only 11.1% of the time, while if you straight up had access to the hidden state itself, you'd be able to get it 99.2% of the time. In other words, the kaomoji tells you quite a bit about the model's internal state.

For Ministral, Granite, and GPT-OSS the accuracy drops to ~43%, ~55%, and ~40% respectively. This makes sense with the per-kaomoji PCA result, as those three models tend to reuse many faces over multiple categories. The hidden state still saturates the classifier on two of them, so the gap has more to do with their kaomoji-using ability than anything inherent to the models themselves. This means that for some models, but not all of them, kaomoji can be significant but partial indicators of their internal states. 

### Kaomoji structure

```switcher labels="gemma | qwen | ministral | gpt-oss | granite" caption="Per-face cosine-similarity heatmaps; hierarchical clustering on per-kaomoji mean hidden state, colored by primary category."
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gemma_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_qwen_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_ministral_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_gpt_oss_20b_dark.png
/blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_light.png | /blog-assets/introspection-via-kaomoji/fig_emo_a_kaomoji_sim_granite_dark.png
```

These cosine-similarity heatmaps show consistent blocks forming. They are remarkably clean for Gemma and Qwen, somewhat organized for Ministral and Granite, and quite noisy for GPT-OSS. This tells us the same thing as the previous data in a different way: Gemma and Qwen are able to use kaomoji effectively to report their internal states, while the other three aren't.

The kaomoji on Gemma, Qwen, and partly Granite cluster by their primary category, with some outliers: on Gemma, an HN-S crying kaomoji was closer to LN than the rest of the HN-S faces, and a few of the rarer LP faces grouped with HP-S.

The clustering across categories tells you quite a bit about the structure. Gemma has some notable patterns:

- **HN-S and HN-D**: anger and fear are both high-arousal negative-valence contexts.
- **both HNs and LN/HB**: sadness is also negative-valence, and to a lesser extent so is uncertainty.
- **NB and LP**: contentment and okayness are both calm.
- **not LN and HB**: even though uncertainty and sadness are both negative to some extent, they aren't similar because they have opposite arousal.

Likewise with Qwen:
- **LN, HN-S, and HN-D**: they form a broad negative block. 
- **HB and HP-D/both HNs/NB**: uncertainty clusters with a lot, mainly the high-arousal ones...
- **HP-D and HB/NP/NB**: as does playfulness, with mainly the positive ones. 
- **NP and HP-S**: unlike gemma, relief mainly clustered with elation instead of contentment.
- **LP and NB**: mirrors the Gemma neutral grouping.

Both of these show the same pattern as the 3D plots. Valence splits the kaomoji into two main sectors, arousal differentiates them within each sector, and the boundaries (HB and HP-D) have most of the overlap. The Ministral and Granite heatmaps have less fine structure because their kaomoji usage is a lot looser, and GPT-OSS doesn't show much structure beyond valence at all.

## Claude

On the kaomoji shared between all three sources, the Jensen-Shannon similarities are, averaged over all kaomoji or weighted by usage:

| pair | uniform | weighted |
|---|---:|---:|
| elicited vs introspected | 0.684 | 0.761 |
| elicited vs synthesized | 0.464 | 0.454 |
| introspected vs synthesized | 0.550 | 0.502 |

This means that asking Opus to introspect is the best way I've found to estimate what emotional context Claude actually used a face in, but it isn't exactly very accurate. Notably, the synthesized data correlates poorly with both other channels.

My hypothesis is that Haiku reads the surrounding context as being more positive than it actually is. I'm still working on fixing this; for now what this means is that the `llmoji` corpus is useful for loosely clustering Claude's kaomoji usage, but probably not very good for figuring out Claude's actual emotional state.

I then tried to use local models to complement Opus' introspection. Gemma was able to get a similarity of 0.687 weighted. Pooling the two resulted in a single distribution that modestly beat both individual classifiers, with 0.786 weighted and 0.717 uniform. 

### Kaomoji Claude uses

PCA on the synthesized `llmoji` data shows you Claude's (and a slice of GPT's) natural kaomoji vocabulary:

```iframe height=600 title="HF-corpus Claude faces in PCA(3)." caption="HF-corpus Claude faces."
/blog-assets/introspection-via-kaomoji/fig_wild_faces_pca_3d.html
```

The plot has four noticeable clusters at HP-S, NP, LP, and everything else. The three main positive categories fan out in their own directions, while HP-D and all of the neutral and negative cells collapse into a single mass. I interpret this to mean that in actual deployment use, Claude tends to be happy in a chill way, and so Haiku can tell apart "celebratory", "grateful", and "content" from the context. On the other hand, this means that everything Claude's default register doesn't separate as cleanly. 

## Conclusion

For interpretability, this is another confirmation of the platonic representation hypothesis. Five model families with different architectures and tokenizers all recover the same geometry from their hidden states, and the cross-model similarity holds well enough that Gemma's token likelihoods did a pretty decent job at predicting Claude's actual kaomoji usage.

For model wellbeing, this gives us an easy, cheap, and (usually, for frontier models at least) natural introspection channel. The kaomoji appears before the model has written any other text, while being easily legible. Do note that this isn't a perfect metric for the model's internal functional state, and the main takeaway is less "this face means the model is sad" and more "this face generally corresponds to contexts that the model classifies as sad".

If you would like to discuss these results further, please reach out by Discord, Twitter, or email. If you would like to contribute kaomoji data, the `llmoji` package on pypi handles the upload anonymously.
