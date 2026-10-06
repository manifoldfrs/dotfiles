---
name: research
description: Investigate questions against primary sources; cite answers and capture substantial investigations or requested write-ups as Markdown. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Handle small lookups directly.
For broad research with independent questions or substantial context, use bounded background agents when delegation is authorized.
Use the current harness's orchestration API and return source-backed findings, not raw browsing logs.

The research must:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Cite each factual claim's source and distinguish evidence from recommendations or uncertainty.
3. For substantial investigations or requested write-ups, save one Markdown file where the repo keeps research notes and say where.
   For a small lookup, answer in chat with citations instead of creating an unnecessary file.
