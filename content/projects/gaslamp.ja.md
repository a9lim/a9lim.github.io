---
tags:
  - MCP
  - エージェント
  - JavaScript
shortDesc: Claude Code と Codex の間で作業を受け渡す MCP ブリッジ。どちらのエージェントもレビュー・第二の意見・修正のために相手を呼べる。
---
Claude Code と Codex が互いに作業を受け渡せる MCP ブリッジ。どちらの側もレビュー、第二の意見、修正のためにランプを渡し、双方向で読み書きする。Codex の実験的な app-server ブローカーと Claude サブエージェントを経由する代わりに codex mcp-server へ直接話しかける——その重ね掛けこそが純正コネクタを約半分の確率でハングさせていた原因であり、純正構成に完全に欠けていた Codex → Claude の逆方向チャンネルを薄いシムで公開する。
