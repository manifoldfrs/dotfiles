# pstack model configuration

These model roles apply when Codex is the parent.

feature, refactoring: codex:gpt-6.2-sol@high
bug-fix: codex:gpt-6.2-sol@high
perf-issue: codex:gpt-6.2-sol@high
hillclimb: codex:gpt-6.2-sol@high
judgment and prose: claude:claude-opus-5-5@high
hardest tasks: claude:claude-opus-5-5@high
how explorer: agy:gemini-4-neon-high@default
how explainer: claude:claude-opus-5-5@high
why investigators, synthesizer: inherit-parent
reflect tooling, judgment, divergent, synthesizer: inherit-parent
arena runners: claude:claude-opus-5-5@high, codex:gpt-6.2-sol@high
arena cross-judge pool: agy:gemini-4-neon-high@default, claude:claude-opus-5-5@high
swarm workers: codex:gpt-6.2-sol@high
architect runners: claude:claude-opus-5-5@high, codex:gpt-6.2-sol@high
interrogate reviewers: claude:claude-opus-5-5@high, codex:gpt-6.2-sol@high
codex writer sandbox: bounded
