---
title: Rlaif
href: https://github.com/a9lim/rlaif
kind: project
order: 30
external: true
icon: projRlaif
seoName: Rlaif — Single-User MCP Server
tags:
  - python
  - mcp
  - agent
shortDesc: Single-user MCP server that exposes a PiShock collar as a tool an agent can call to shock you.
---
Single-user MCP server with three tools: one fires a shock, two are read-only for device state and the ops log. Caps intensity and duration, enforces a token-bucket rate limit, and requires an explicit consent flag to raise the conservative defaults. Code-level ceilings make the caps unreachable even by editing config. Please use with care.
