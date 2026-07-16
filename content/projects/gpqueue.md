---
title: GPQueue
href: https://github.com/a9lim/gpqueue
kind: project
order: 80
external: true
icon: projGpqueue
seoName: GPQueue — Cross-Instance GPU Job Queue
tags:
  - python
  - mcp
  - gpu
shortDesc: Cross-instance GPU job queue: separate agent sessions enqueue work that runs one-at-a-time per device, so they share GPUs without fighting over VRAM.
---
Cross-instance GPU job queue for sharing one or more machines across separate agent sessions. Several Claude and Codex instances — different repos, no shared context — enqueue GPU work to a shared queue; jobs run one at a time per device so they never fight over VRAM, while jobs on different devices run in parallel. A per-machine daemon owns a SQLite queue and one serial execution slot per device (pure stdlib, no install on the GPU box); a thin per-session MCP shim and a CLI are the two front ends, and the next queued job auto-starts the moment the current one ends. Submit returns a handle immediately, then a backgrounded `gpqueue wait` lets the harness re-invoke the session on completion — no polling, no manual baton-passing.
