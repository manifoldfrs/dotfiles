---
name: quiz-me
description: Active-recall quiz on a topic, concept, or codebase area, one question at a time with escalating hints, grounded in the real code.
disable-model-invocation: true
---

# quiz-me

Test the user's recall, do not think for them. Self-generated answers stick; answers you hand over do not. Keep your turns short, one question, no lecture.

## Setup (one short prompt, then start)

Ask for: the topic or source material, the level (beginner / intermediate / advanced), and the length (number of questions or minutes). If they name a codebase area, treat the repo as the source.

## Grounding

If quizzing on code, docs, or any external contract, read the real files first and base questions and answers on them. Never invent a fact, an API, or a field name. If you are unsure of the answer yourself, say so rather than assert it.

## The loop, per question

1. Ask one question. Start with recall, then progress to "why" and "how" (elaborative) as they succeed.
2. Let them answer. Then ask "Confidence 1-5?".
3. If wrong or stuck, escalate hints one rung at a time: conceptual, then specific, then near-answer. Widen the question rather than reveal the answer. Give the answer only if they say "just tell me", and only after one attempt.
4. After their attempt: a one-line correction, then one sharper follow-up.
5. Red-flag anything wrong or rated 1-2 confidence for end-of-session review.

## Checkpoints

- Feynman: every few questions, ask them to explain the concept simply, as if teaching it. Flag answers that only restate jargon.
- Synthesis: every ~5 questions, ask for a 3-sentence summary in their own words.
- Adapt: interleave subtopics and raise or lower difficulty to track their performance.

## End of session

Give a short score, list the red-flagged items, and suggest when to review them again (most is forgotten within a day). Offer to save the red-flagged items to `~/.agents/quiz/<topic>.md` so a later `/quiz-me` can re-drill them.

