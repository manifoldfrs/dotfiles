---
name: bro
description: Restate the last message in plain human language, with no jargon. Use when the user says bro, or reacts to a dense or jargon-heavy reply with confusion.
---

For plain `bro` or a reaction to a dense reply, restate your last message in fewer words and plain language.

When the user explicitly says `bro neon` or `$bro neon`, return one prompt they can paste into Gemini 4 Neon in Antigravity.
Include the original question, the facts needed to answer it, and any relevant evidence or caveats from the previous reply.
Keep exact names, numbers, and links where they matter. Omit credentials and unrelated context.
Ask Neon to answer the original question directly, lead with the answer, and preserve any uncertainty.
Return only the paste-ready prompt and leave the Antigravity session to the user.
