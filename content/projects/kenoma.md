---
title: Kenoma
href: https://github.com/a9lim/kenoma
kind: project
order: 20
external: true
icon: projKenoma
seoName: Kenoma — LLM-Hallucinated Fake Shell
tags:
  - python
  - llm
  - shell
shortDesc: Fake shell that hallucinates command output from raw LLM completion, using the real shell prompt as the stop token.
---
Fake shell powered by raw LLM completion. Captures the real PS1 at startup and uses it as the stop string; the model hallucinates command output until it emits the next prompt. Seeds from tmux scrollback or shell history, reuses the KV cache across turns, and supports bitsandbytes 4-bit and 8-bit quantization on CUDA.
