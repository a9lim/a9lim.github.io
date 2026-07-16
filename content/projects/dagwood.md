---
title: Dagwood
href: https://github.com/a9lim/dagwood
kind: project
order: 60
external: true
icon: projDagwood
seoName: Dagwood — DAG-Native Task Tracker
tags:
  - python
  - mcp
  - task tracker
shortDesc: DAG-native task tracker where tasks are nodes, dependencies are edges, and the live frontier is everything you can start right now.
---
Task tracker built on a DAG: tasks are nodes, dependencies are edges, and it foregrounds the frontier — the unfinished tasks whose dependencies are all done, which is everything you can actually work on right now. The whole project state lives in a single .dag/dag.toml file committed next to your code, and a live web canvas, an MCP interface for coding agents, and git are all just windows onto that one file.
