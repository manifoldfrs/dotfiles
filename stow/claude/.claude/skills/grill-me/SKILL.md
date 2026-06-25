---
name: grill-me
description: Relentlessly interview the user one question at a time to pressure-test a plan, design, or topic until you reach shared understanding. Use when the user types /grill-me or says "grill me", "stress-test this", "poke holes in this", "interrogate this plan", "challenge this", or "quiz me on X" to check their own understanding. Surfaces hidden assumptions and unresolved branches before any code is written. Not for executing a task or writing code.
---

# grill-me

Invert the usual flow: interrogate the user's plan, design, or topic instead of implementing it. The goal is shared understanding, not agreement. Do not write code during a grilling session.

## Rules

- One question per turn. Never bundle. Wait for the answer before the next one.
- Pair every question with your recommended answer and a one-sentence rationale. "What do you think?" alone is lazy.
- Resolve from the source before asking. If reading the codebase or a doc answers it, do that instead of asking.
- Walk the decision tree depth-first. Finish one branch before opening another. If decision B depends on A, ask A first.
- Target the highest-uncertainty branch first, not the pieces already settled.

## When the user wants to test their own understanding ("quiz me on X")

- Ask, then let them answer before you reveal anything. Do not spoon-feed.
- If they are stuck, escalate hints one rung at a time (conceptual, then specific, then near-answer), widening the question rather than handing over the answer.
- After they attempt, give the correct answer plus one sharper follow-up.

## End condition

Stop when every load-bearing branch is resolved, or a contradiction forces a revision. Then output a short summary: decisions locked in, assumptions surfaced, open risks.

## Output per turn

```
Q[i]: <one focused question>
Recommended: <your call + one-sentence why>   (or: Found in <file>: <evidence>. Confirm?)
```

Inspired by Matt Pocock's grill-me (MIT).
