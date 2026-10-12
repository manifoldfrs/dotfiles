# Upstream: Psychopomp motion guidance

Vendored from Kit Langton's Psychopomp at commit `3a50a2bf1897ddeaa4e5a71df85224107aaf734b`, under the MIT License in `LICENSE`.
Source: https://github.com/kitlangton/psychopomp/tree/3a50a2bf1897ddeaa4e5a71df85224107aaf734b/.agents/skills

| File | Upstream path | Use it for |
| --- | --- | --- |
| `explainer-motion.md` | `.agents/skills/explainer-motion/SKILL.md` | motion rules for every beat: energy has a source, one focal action, quiet at rest |
| `TECHNIQUES.md` | `.agents/skills/explainer-motion/TECHNIQUES.md` | calibrated constants for sends, panels, camera, and pacing |
| `STORY.md` | `.agents/skills/psychopomp/STORY.md` | telling a reel: behavior before code, replay rather than redraw, one idea per beat |

The files are copies with one change: `explainer-motion.md` has its frontmatter name changed to `explainer-motion-upstream-reference`, and none is named `SKILL.md`, so no harness discovers them as separate skills.
Diff them against a newer upstream commit before updating.
Where they refer to narration anchors, PR numbers, or committing inside Psychopomp, `references/animation.md` takes precedence for learn-visually films.
