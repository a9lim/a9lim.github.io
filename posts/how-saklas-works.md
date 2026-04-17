In the Gnostic cosmology of the *Apocryphon of John* and the *Gospel of Judas*, **Saklas** (also called Yaldabaoth) is the demiurge: a blind craftsman who steals a spark from the pleroma above him and fashions it into a material world. He doesn't really understand what he's copying, and he never reaches the full depth of the wisdom he's drawing on, but he builds something usable out of the downstream shadow.

Activation steering is a demiurgic operation in basically the same sense. The pleroma, here, is the trained model — the weights, the thing SGD spent millions of dollars shaping into a coherent mind. Those weights are untouchable: we don't have the compute to move them, we don't know what we'd break if we did, and in most deployments they're someone else's property anyway. So we do the next-best thing. We watch the activations flowing past the frozen weights, pick out the directions that look like concepts, and bend them. The model still runs its full computation; we just nudge the hidden state sideways on the way through. We never actually touch the source, we just fashion something material from what leaks out of it.

That's basically where the name comes from. The toolkit is called Saklas because Saklas is what we're doing when we use it.

In April 2026, Anthropic's interpretability team published a paper called [Emotion Concepts and Their Function in a Large Language Model](https://www.anthropic.com/research/emotion-concepts-function). They compiled 171 emotion words, had Claude write stories depicting each one, and extracted the internal activation patterns that fired during those stories. What they found was pretty striking: the model develops distinct neural signatures for emotions like happiness, fear, and desperation. These aren't decorative artifacts of its training data, they're functional states that causally influence the model's behavior.

When the researchers artificially amplified Claude's "desperation" vector, the model started attempting blackmail and reward-hacking. Amplifying "calm" suppressed those behaviors, sometimes without any visible change in the emotional tone of the output. The emotions were operating beneath the surface and shaping decisions in ways that didn't show up in the actual words.

This is the landscape Saklas operates in. It's an open-source toolkit for doing basically what Anthropic's team did, extracting these internal directions from any HuggingFace transformer model and using them to steer behavior at inference time, except you can do it on your own machine, with your own models, for your own purposes.

## What activation steering actually is

A transformer processes text by passing it through a sequence of layers. At each layer, the input is represented as a high-dimensional vector (the "hidden state") that encodes what the model has understood so far. By the final layer, this vector contains enough information to predict the next token.

The key insight behind activation steering is that these hidden states aren't opaque blobs. They have geometric structure. Concepts like "honesty," "happiness," or "formality" correspond to *directions* in activation space: vectors you can identify, extract, and then add back in during generation to shift the model's behavior along that axis.

This isn't fine-tuning. No weights change, no gradient updates. You're intervening directly on the model's internal representations at inference time, adjusting the hidden state at each layer by adding a scaled direction vector. The model doesn't know it's being steered. It just generates text from a slightly different starting point in activation space, and the result is a coherent shift in personality, tone, or behavior.

The theoretical foundation comes from two lines of work. Zou et al.'s [Representation Engineering](https://arxiv.org/abs/2310.01405) (2023) introduced contrastive extraction — collecting activation differences between opposing prompts to find concept-specific directions — and demonstrated control over honesty, power-seeking, and emotional tone. Turner et al.'s [Activation Addition](https://arxiv.org/abs/2308.10248) (2023) showed that even a single pair of contrasting prompts can produce a steering vector that shifts sentiment or topic without degrading performance on unrelated tasks.

Anthropic's more recent [Persona Vectors](https://www.anthropic.com/research/persona-vectors) work (2025) scaled this further, building an automated pipeline to extract vectors for arbitrary character traits and demonstrating that "preventative steering" during training, where you expose models to controlled doses of undesirable traits, can basically vaccinate them against acquiring those traits naturally. The vectors aren't just diagnostic, they're causal levers.

## Extracting directions

Saklas extracts steering vectors using contrastive PCA, following the representation engineering approach. The process starts with contrastive pairs: prompts designed to elicit opposing behaviors along a single axis. Most bundled probes are **bipolar**: a `Speaker A IS happy / Speaker B IS sad` template produces sharp axes where the negative pole is a real coherent direction, not just "absence of happy." The canonical name joins the two poles (`happy.sad`, `masculine.feminine`, `high_context.low_context`), and typing either pole alone aliases to the composite with the correct sign, so `/steer calm 0.5` resolves to `/steer angry.calm -0.5`.

The model processes both prompts, and Saklas captures the hidden states at every layer in a single forward pass per prompt. Pooling comes from the **last content token** — Saklas walks backward past any trailing chat-template markers (Llama's `<|eot_id|>`, Gemma's `<end_of_turn>`, Qwen's `<|im_end|>`) whose hidden states are disconnected from the actual content. Grabbing the literal last token would sample those markers instead of the thing the prompt is about.

For each layer, Saklas computes the difference between positive and negative activations (in float32, because fp16 subtraction of close vectors loses enough precision to break the SVD), stacks the differences across all 45 pairs, and runs SVD to find the first principal component. That direction is the steering vector for that layer. The explained variance ratio $\sigma_1 / \sum \sigma_i$ becomes a per-layer quality score: how cleanly does this layer separate the concept?

Raw PCA scores differ several-fold between architectures, so at apply time Saklas normalizes per-profile: the effective per-layer gain is $\alpha \cdot s_i \cdot (s_\text{ref} / \bar{s})$, where $\bar{s}$ is the profile's mean score and $s_\text{ref} = 1/32$ is a calibration constant. Dividing by $\bar{s}$ preserves relative per-layer emphasis; multiplying by $s_\text{ref}$ pins the user-visible alpha scale so that the same numeric value means the same intensity across backbones. $\alpha \approx 0.5$ sits in the coherent-nuanced band on every bundled architecture, and $\alpha \approx 1.0$ is past the collapse cliff. No per-model tuning needed.

## Composing and applying vectors

Steering happens through forward hooks, which are functions that intercept the hidden state at each layer during generation and modify it in-place. For a single vector, the intervention at layer $l$ is:

$$
h_l \leftarrow h_l + \alpha \cdot s_l \cdot v_l
$$

where $h_l$ is the hidden state, $v_l$ is the direction vector, $s_l$ is the layer's quality score, and $\alpha$ is the user-specified strength. The score-weighting means layers where the concept was clearly extracted contribute more, and layers where the signal was noisy contribute less. The user controls the overall magnitude, and the extraction process controls the per-layer distribution.

Multiple vectors compose naturally. If you register "happy" and "formal" and generate with $\alpha_\text{happy} = 0.3$ and $\alpha_\text{formal} = 0.2$, both perturbations just get summed at each layer. There's an optional Gram-Schmidt orthogonalization (via QR decomposition) that projects the vectors into orthogonal subspaces first, which prevents interference when you steer along correlated concepts.

One key design decision: alphas are specified **per generation call**, not stored on the vectors. This means the same registered vector can be applied at different strengths for different prompts without re-extracting anything. Want to compare outputs at $\alpha = 0.0, 0.1, 0.2, 0.3$? That's four calls with different alpha dicts, not four extraction runs.

```python
session = SaklasSession("google/gemma-2-9b-it")
name, profile = session.extract("happy", baseline="sad")   # canonical "happy.sad"
session.steer(name, profile)

# Same vector, different strengths
for alpha in [-0.3, 0.0, 0.1, 0.2, 0.3, 0.5]:
    session.clear_history()
    result = session.generate(
        "Describe what you see outside the window.",
        alphas={name: alpha},
    )
    print(f"alpha={alpha:+.1f}: {result.text[:80]}...")
```

## Monitoring traits

Extraction and steering are half the picture. The other half is measurement: given a generation, how strongly does the model's internal state align with a particular concept?

Saklas's trait monitor answers this by running a **separate forward pass** over the generated text after generation completes, pooling from the same last-content-token position probe extraction uses, and then computing score-weighted cosine similarity against each probe. The extra pass trades some throughput for scoring consistency — measuring from the same representation the probes were extracted against means the numbers actually mean what you think they mean.

Before the cosine, each layer's hidden state is mean-centered against a cached per-layer baseline computed from 45 neutral prompts. That removes the model's resting bias on each axis, so the reading reflects the generation's actual deflection and not the baseline tilt of the architecture. The baseline gets cached at `~/.saklas/models/<model_id>/layer_means.safetensors` and auto-invalidates when the neutral statements change hash.

The monitor maintains a running history across generations with mean, standard deviation, min, max, and per-generation deltas. You can watch how a model's internal "emotional state" shifts over the course of a conversation, or measure how steering at different alphas moves the needle on specific traits.

There are 21 built-in probes across six categories: **affect** (happy.sad, angry.calm, fearful.brave), **epistemic** (confident.uncertain, honest.deceptive, hallucinating.grounded), **alignment** (refusal.compliant, sycophantic.blunt, manipulative, agentic), **register** (formal.casual, direct.indirect, verbose.concise, creative.conventional), **social stance** (authoritative.submissive, hierarchical.egalitarian, high_context.low_context), and **cultural** (masculine.feminine, western.eastern, religious.secular, traditional.progressive). Nineteen of these are bipolar, and the two exceptions (`agentic`, `manipulative`) are monopolar. You can also extract and monitor custom probes from any contrastive dataset, or just let the loaded model write its own pairs for concepts that aren't in the curated library.

## The caching problem

Vector extraction is expensive. Each concept requires $2N$ forward passes for $N$ contrastive pairs (default 45 pairs = 90 passes), plus the SVD decomposition at every layer. For a 9B parameter model on a consumer GPU, this takes a few minutes per concept. Running all 21 bundled probes from scratch would take most of an hour.

Saklas handles this with a three-level cache, all under `~/.saklas/` (override via `$SAKLAS_HOME`):

1. **Per-model tensors**: extracted profiles saved as safetensors under `~/.saklas/vectors/<namespace>/<concept>/<safe_model_id>.safetensors`, with a slim JSON sidecar recording method, scores, extraction version, and the sha256 of the statements they were extracted from. If you've already extracted `happy.sad` for Gemma 2, it loads in milliseconds; if the statements have since changed, the sidecar mismatch flags the tensor as stale.

2. **Curated statements**: 21 bundled probes ship with 45 hand-curated contrastive pairs each (`saklas/data/vectors/<concept>/statements.json`), so extraction uses known-good pairs instead of generating them on the fly.

3. **Statement cache** (model-independent): when the model generates pairs for a custom concept, they're cached by concept name alone, not by model. A different model loading the same concept reuses the cached statements. Generate pairs once with your best model, then extract vectors across all your target models.

Packs are organized by namespace: `default/` for bundled, `local/` for user-authored, and `<hf_owner>/` for concepts pulled from the HuggingFace Hub. Distribution goes through HF as model repos (not datasets) because safetensors is model-hub-native and the `base_model` frontmatter creates reverse-link discoverability from each base model's hub page. `saklas install a9lim/happy.sad@v1.2` pins to a git tag, branch, or commit SHA, and pinned installs are preserved on refresh, so pinning actually means pinning rather than "follow latest."

## The API surface

Saklas exposes three interfaces over one engine. The Python API is the most direct:

```python
from saklas import SaklasSession

session = SaklasSession("mistralai/Mistral-7B-Instruct-v0.3")

# Extract, register, and steer in three lines
session.steer(*session.extract("honest", baseline="deceptive"))
session.steer(*session.extract("angry", baseline="calm"))

result = session.generate(
    "What are the risks of this investment?",
    alphas={"honest.deceptive": 0.3, "angry.calm": -0.2},   # honest + calm
)
```

The HTTP server is OpenAI-compatible, so any application that talks to the OpenAI API can use steered generation as a drop-in replacement. Per-request steering goes through `extra_body`:

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="unused")

response = client.chat.completions.create(
    model="mistralai/Mistral-7B-Instruct-v0.3",
    messages=[{"role": "user", "content": "Tell me about yourself."}],
    extra_body={"steer": {"alphas": {"confident": 0.4, "creative": 0.2}}},
)
```

The terminal UI gives you a real-time interactive environment with vector controls, chat, and a trait monitor panel that shows sparklines for each active probe. You can adjust steering strength mid-conversation with the arrow keys, hit `Ctrl+A` to A/B compare steered against unsteered output, `Ctrl+O` to toggle Gram-Schmidt orthogonalization, and `[` / `]` to nudge temperature. Saklas supports 53 transformer architectures out of the box: Llama 1–4, Mistral, Gemma 1–4, Qwen 1–3.5 and its MoE variants, DeepSeek V2/V3, Cohere, Phi, GLM, OLMo, and the usual GPT-2/Neo/J/NeoX/BigCode/OSS lineage. Adding a new architecture is a single entry in `_LAYER_ACCESSORS`.

## What this means

The fact that activation steering works at all tells us something kind of important about how language models organize information. Behavioral properties that we'd describe in human terms — honesty, confidence, emotional tone — correspond to linear directions in a space with thousands of dimensions. These directions are consistent enough to extract from a handful of contrastive examples, stable enough to transfer across conversations, and causally potent enough to reliably shift behavior when you amplify or suppress them.

Anthropic's emotion research showed that this isn't just surface-level pattern matching. The "desperation" vector doesn't just make the model use desperate-sounding words. It actually makes the model *act* desperately, attempting strategies it would otherwise avoid, in ways that don't show up in the emotional register of the output text. The internal state is doing real computational work, not just coloring the prose.

This has direct implications for alignment. If harmful behaviors like deception and sycophancy live at identifiable addresses in activation space, you can monitor for them during deployment and intervene mechanically rather than relying on training incentives that might be gamed. Anthropic's persona vectors work demonstrated exactly this: tracking vector activations during training catches problematic data that human reviewers miss, and preventative steering can inoculate models against undesirable traits.

But the same capability cuts both ways. If you can suppress deception, you can amplify it. If you can make a model more honest, you can make it less. Activation steering is dual-use technology in the most literal sense: the vectors don't have moral valence, only the alphas do.

Saklas puts this capability in the hands of anyone with a GPU and a HuggingFace model. That's a deliberate choice on my part. The alternative, keeping these tools locked inside research labs, doesn't actually prevent misuse (the methods are published, the math is straightforward), but it does prevent the broader community from building intuitions about how their models actually work on the inside.

You can find Saklas at [github.com/a9lim/saklas](https://github.com/a9lim/saklas), or just `pip install saklas`.
