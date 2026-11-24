---
name: bro-neon
description: "Use when the user invokes $bro-neon to get a plain-language explanation from Gemini 4 Neon in the current chat."
---

Use the user's question, or the previous reply if they invoke `$bro-neon` alone.
Investigate in Codex first and gather the relevant workspace facts, source links, and caveats.
Give Gemini the original question and that evidence, omitting credentials and unrelated context.
Ask it to answer the user directly in plain language and preserve uncertainty.

Run Gemini 4 Neon Medium using the signed-in Antigravity CLI.
Use an empty temporary working directory and pass the brief as a quoted argument.

```bash
agy --model gemini-4-neon-medium --effort medium --mode plan --sandbox \
  --output-format json --print-timeout 420s -p="$brief"
```

Wait for the response, check that the command succeeded and the JSON has `status: SUCCESS` and a nonempty `response`, then check the explanation against the available evidence and deliver it in the current chat.
If the required model or CLI fails, report the blocker without substituting another model or route.
Return a paste-ready prompt only when the user asks for one.
