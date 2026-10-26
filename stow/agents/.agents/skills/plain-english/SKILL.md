---
name: plain-english
description: Restate the last message, or a named text, about 80% of the way to ASD-STE100 Simplified Technical English.
disable-model-invocation: true
---

Restate your last message, or the text or file the user names, about 80% of the way to ASD-STE100, the Simplified Technical English of aerospace maintenance manuals.

Keep these STE rules strictly:

- One topic per sentence, and one instruction per sentence in procedures.
- Sentences of at most 20 words in procedures and 25 in descriptions.
- Active voice, with the actor named.
- Imperative mood for actions the reader takes.
- One word for one meaning: pick a term and keep it for the whole text.
- Simple tenses, and no phrasal verbs when a single verb exists.
- Paragraphs of one idea, at most six sentences.
- Lists for steps, and a condition before the action it controls ("If the build fails, read the log").

Relax these, which is the other 20%:

- Use project terms, code identifiers, product names, and technical vocabulary as STE "technical names", even when they are not in the STE dictionary.
- Use a common English word when the STE dictionary word would be stilted.

Leave code, commands, paths, numbers, links, and quoted text exactly as they were.
Keep every fact; drop only padding.
