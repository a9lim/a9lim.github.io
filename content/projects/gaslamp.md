---
title: Gaslamp
href: https://github.com/a9lim/gaslamp
kind: project
order: 70
external: true
icon: projGaslamp
seoName: Gaslamp — Claude Code ↔ Codex MCP Bridge
tags:
  - mcp
  - agent
  - javascript
shortDesc: MCP bridge that hands work between Claude Code and Codex — either agent can call the other for a review, a second opinion, or a fix.
---
MCP bridge that lets Claude Code and Codex hand work to each other — either side passes the lamp for a review, a second opinion, or a fix, reading and writing both ways. It talks to codex mcp-server directly instead of routing through Codex’s experimental app-server broker plus a Claude subagent, the layering that made the stock connector hang about half the time; a thin shim exposes the reverse Codex → Claude channel the stock setup lacks entirely.
