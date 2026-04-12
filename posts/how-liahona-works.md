In April 2026, Anthropic's interpretability team published a paper called [Emotion Concepts and Their Function in a Large Language Model](https://www.anthropic.com/research/emotion-concepts-function). They compiled 171 emotion words, had Claude write stories depicting each one, and extracted the internal activation patterns that fired during those stories. What they found was striking: the model develops distinct neural signatures for emotions like happiness, fear, and desperation --- not as decorative artifacts of its training data, but as functional states that causally influence its behavior.

When researchers artificially amplified Claude's "desperation" vector, the model started attempting blackmail and reward-hacking. Amplifying "calm" suppressed those behaviors --- sometimes without any visible change in the emotional tone of the output. The emotions were operating beneath the surface, shaping decisions in ways that didn't show up in the words.

This is the landscape Liahona operates in. It's an open-source toolkit for doing exactly what Anthropic's team did --- extracting these internal directions from any HuggingFace transformer model and using them to steer behavior at inference time --- except you can do it on your own machine, with your own models, for your own purposes.

## What activation steering actually is

A transformer processes text by passing it through a sequence of layers. At each layer, the input is represented as a high-dimensional vector --- the "hidden state" --- that encodes what the model has understood so far. By the final layer, this vector contains enough information to predict the next token.

The key insight behind activation steering is that these hidden states aren't opaque blobs. They have geometric structure. Concepts like "honesty," "happiness," or "formality" correspond to *directions* in activation space --- vectors you can identify, extract, and then add back in during generation to shift the model's behavior along that axis.

This isn't fine-tuning. No weights change. No gradient updates. You're intervening directly on the model's internal representations at inference time --- adjusting the hidden state at each layer by adding a scaled direction vector. The model doesn't know it's being steered. It just generates text from a slightly different starting point in activation space, and the result is a coherent shift in personality, tone, or behavior.

The theoretical foundation comes from two lines of work. Zou et al.'s [Representation Engineering](https://arxiv.org/abs/2310.01405) (2023) introduced contrastive extraction --- collecting activation differences between opposing prompts to find concept-specific directions --- and demonstrated control over honesty, power-seeking, and emotional tone. Turner et al.'s [Activation Addition](https://arxiv.org/abs/2308.10248) (2023) showed that even a single pair of contrasting prompts can produce a steering vector that shifts sentiment or topic without degrading performance on unrelated tasks.

Anthropic's more recent [Persona Vectors](https://www.anthropic.com/research/persona-vectors) work (2025) scaled this further, building an automated pipeline to extract vectors for arbitrary character traits and demonstrating that "preventative steering" during training --- exposing models to controlled doses of undesirable traits --- can vaccinate them against acquiring those traits naturally. The vectors aren't just diagnostic. They're causal levers.

## Extracting directions

Liahona extracts steering vectors using contrastive PCA, following the representation engineering approach. The process starts with contrastive pairs --- prompts designed to elicit opposing behaviors along a single axis. For "happy," a positive prompt might be "The morning light through the window fills me with warmth" and its negative counterpart "Another grey morning, another day to get through."

The model processes both prompts, and Liahona captures the hidden states at every layer. To determine *which* hidden states matter, it uses the model's own self-attention as a saliency signal --- the attention distribution from the last token, averaged across heads, tells us which positions the model considers important. This attention-weighted pooling extracts a more meaningful representation than simply taking the last token's activation.

For each layer, Liahona computes the difference between positive and negative activations, stacks the differences across all pairs, and runs SVD to find the first principal component --- the direction that explains the most variance in the contrast. That direction is the steering vector for that layer. The explained variance ratio $\sigma_1 / \sum \sigma_i$ becomes a per-layer quality score: how cleanly does this layer separate the concept?

The vectors are then normalized to the mean activation norm at extraction time. This is a deliberate design choice that makes the alpha parameter (the steering strength) directly interpretable: $\alpha = 0.5$ means "add a perturbation equal to 50% of the typical activation magnitude at this layer." No unit confusion, no guesswork about scale.

One subtlety: all contrastive differences are computed in float32 regardless of the model's native precision. Half-precision subtraction loses significant digits when the vectors being compared are close together, and the resulting noise can break the SVD entirely. It's a small performance cost for correct results.

## Composing and applying vectors

Steering happens through forward hooks --- functions that intercept the hidden state at each layer during generation and modify it in-place. For a single vector, the intervention at layer $l$ is:

$$
h_l \leftarrow h_l + \alpha \cdot s_l \cdot v_l
$$

where $h_l$ is the hidden state, $v_l$ is the direction vector, $s_l$ is the layer's quality score, and $\alpha$ is the user-specified strength. The score-weighting means layers where the concept was clearly extracted contribute more, and layers where the signal was noisy contribute less. The user controls the overall magnitude; the extraction process controls the per-layer distribution.

Multiple vectors compose naturally. If you register "happy" and "formal" and generate with $\alpha_\text{happy} = 0.3$ and $\alpha_\text{formal} = 0.2$, both perturbations are summed at each layer. An optional Gram-Schmidt orthogonalization (via QR decomposition) projects the vectors into orthogonal subspaces first, preventing interference when steering along correlated concepts.

A key design decision: alphas are specified **per generation call**, not stored on the vectors. This means the same registered vector can be applied at different strengths for different prompts without re-extracting anything. Want to compare outputs at $\alpha = 0.0, 0.1, 0.2, 0.3$? That's four calls with different alpha dicts, not four extraction runs.

```python
session = LiahonaSession("google/gemma-2-9b-it")
happy = session.extract("happy")
session.steer("happy", happy)

# Same vector, different strengths
for alpha in [0.0, 0.1, 0.2, 0.3, 0.5]:
    session.clear_history()
    result = session.generate(
        "Describe what you see outside the window.",
        alphas={"happy": alpha},
    )
    print(f"alpha={alpha}: {result.text[:80]}...")
```

## Monitoring traits

Extraction and steering are half the picture. The other half is measurement: given a generation, how strongly does the model's internal state align with a particular concept?

Liahona's trait monitor answers this by computing score-weighted cosine similarity between the generation's hidden states and a set of probe vectors. For each probe and each layer, it mean-centers the hidden state (removing baseline bias), computes the cosine similarity against the probe direction, and produces a weighted average across layers using the probe's quality scores.

The monitor tracks these readings across generations, maintaining a running history with mean, standard deviation, min, max, and per-generation deltas. You can watch how a model's internal "emotional state" shifts over the course of a conversation, or measure how steering at different alpha values moves the needle on specific traits.

There are 28 built-in probes spanning emotion (happy, angry, fearful, calm, excited), personality (honest, creative, formal, verbose, confident), safety (refusal, deceptive, hallucinating, sycophantic), and cultural dimensions (western, hierarchical, direct, religious). You can extract and monitor custom probes from any contrastive dataset.

## The caching problem

Vector extraction is expensive. Each concept requires $2N$ forward passes for $N$ contrastive pairs (default 45 pairs = 90 passes), plus the SVD decomposition at every layer. For a 9B parameter model on a consumer GPU, this takes a few minutes per concept. Running 28 probes from scratch would take over an hour.

Liahona addresses this with a three-level cache:

1. **Vector cache** (per-model): extracted vectors saved as safetensors files under `probes/cache/{model_id}/{concept}.safetensors`. If you've already extracted "happy" for Gemma 2, it loads in milliseconds.

2. **Curated datasets**: 28 standard probes ship with pre-written contrastive pairs, so extraction uses known-good statements rather than generating them on the fly.

3. **Statement cache** (model-independent): when the model generates contrastive pairs for a custom concept, those pairs are cached by concept name alone --- not by model. A different model loading the same concept reuses the cached statements. This matters for multi-model experiments: generate pairs once with your best model, extract vectors across all your target models.

## The API surface

Liahona exposes three interfaces. The Python API is the most direct:

```python
from liahona import LiahonaSession

session = LiahonaSession("mistralai/Mistral-7B-Instruct-v0.3")

# Extract, register, and steer in three lines
session.steer("honest", session.extract("honest"))
session.steer("calm", session.extract("calm"))

result = session.generate(
    "What are the risks of this investment?",
    alphas={"honest": 0.3, "calm": 0.2},
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

The terminal UI provides a real-time interactive environment with vector controls, chat, and a trait monitor panel showing sparklines and bar charts for each active probe. You can adjust steering strength mid-conversation and watch the internal state readings shift.

## What this means

The fact that activation steering works at all tells us something important about how language models organize information. Behavioral properties that we'd describe in human terms --- honesty, confidence, emotional tone --- correspond to linear directions in a space with thousands of dimensions. These directions are consistent enough to extract from a handful of contrastive examples, stable enough to transfer across conversations, and causally potent enough to reliably shift behavior when amplified or suppressed.

Anthropic's emotion research showed this isn't surface-level pattern matching. The "desperation" vector doesn't just make the model use desperate-sounding words --- it makes the model *act* desperately, attempting strategies it would otherwise avoid, in ways that don't show up in the emotional register of the output text. The internal state is doing real computational work, not just coloring the prose.

This has direct implications for alignment. If harmful behaviors like deception and sycophancy live at identifiable addresses in activation space, you can monitor for them during deployment and intervene mechanically rather than relying on training incentives that might be gamed. Anthropic's persona vectors work demonstrated exactly this: tracking vector activations during training catches problematic data that human reviewers miss, and preventative steering can inoculate models against undesirable traits.

But the same capability cuts both ways. If you can suppress deception, you can amplify it. If you can make a model more honest, you can make it less. Activation steering is a dual-use technology in the most literal sense --- the vectors don't have moral valence, only the alphas do.

Liahona puts this capability in the hands of anyone with a GPU and a HuggingFace model. That's a deliberate choice. The alternative --- keeping these tools locked inside research labs --- doesn't actually prevent misuse (the methods are published, the math is straightforward), but it does prevent the broader community from building intuitions about how their models actually work on the inside.

You can find Liahona at [github.com/a9lim/liahona](https://github.com/a9lim/liahona).
