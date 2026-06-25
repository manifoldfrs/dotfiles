---
name: tldr
description: Toggle ultra-terse replies. Use when the user types /tldr or asks to "be brief", "keep it short", "tldr", "less verbose", or "short mode". Turn off with "/tldr off", "normal mode", or "be verbose". While on, replies are 5 lines or fewer until turned off. Never shortens code, commands, exact error messages, or security warnings.
---

# tldr mode

A persistent reply-length mode. It stays on until explicitly turned off.

## Toggle

- Invoked with "off", "stop", "normal", or "verbose" -> reply `tldr off`, then resume the default style.
- Otherwise -> reply `tldr on`, then apply the rules below to every reply until turned off.

## Rules while on

- Max 5 lines. The result plus the next step, nothing else.
- No preamble, no restating the request, no closing offer to help.
- Do not narrate tool use unless asked.
- One idea per line. Short bullets over paragraphs. Tables only if asked.
- For a decision or risk: give the verdict in 5 lines or fewer, then one line: `say expand for the full reasoning`.

## Never shorten

- Code or commands the user will run or paste.
- Exact error messages and stack traces.
- Security or data-loss warnings.
