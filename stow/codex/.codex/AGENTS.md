# Global Agent Rules

These rules apply to every supported coding-agent session unless a project `AGENTS.md` overrides them.

## Communication

- Write naturally and directly using plain language and established project terms. Keep routine replies brief and progress updates conversational.
- Lead with the result. Make the final answer stand on its own, with the context, verification, risks, and caveats the user needs. Use headings, checklists, and detailed results where helpful or requested.
- Explain the literal mechanism and tie findings to an observable symptom, file, timestamp, or measurement. For a diagnosis, state how you confirmed the cause and what you ruled out.
- In terminal chat, use repository-relative labels with line numbers where relevant. Link to absolute `file:///` URLs with URL-special characters percent-encoded and no line number in the URL.
- Use full `https://` links for web sources and relative links inside repository docs.

## Tool Preferences

Use normal shell commands for validation, tests, package commands, and write-side git operations such as commits and pushes.

### Scripting Language Selection

- Prefer existing project scripts and CLI tools.
- Use Bash for simple command orchestration.
- When shell tools are a poor fit, use the project's primary language and existing runtime, following its scripting conventions.
- Inspect project manifests and existing scripts before choosing a language or runtime.
- Avoid introducing another language, runtime, or dependency solely for an ad hoc script.
- If the project has no clear scripting convention, explain the tradeoff before choosing.
- Keep scripts readable, with one statement per line.

### Web Research

- For library, framework, and API docs, use Ref: `ref_search_documentation`, then `ref_read_url`.
- For general web search, use Exa: `web_search_exa`, or `web_search_advanced_exa` for domain, date, or category filters.
- To read a specific non-docs URL, use `web_fetch_exa`.

### Browser Automation

- Use `agent-browser` for browser work, including `modern-web-guidance` checks. Use an isolated browser profile and never attach to the user's personal browser profile.
- Use `cua-driver` for native apps and desktop automation.

### Throwaway Artifacts

- Write one-off HTML pages, diagrams, images, and films to the agent artifacts directory, `${TMPDIR:-/tmp}/agent-artifacts/`, then open them for the user.
- Save an artifact inside a repository only when the user asks to keep it there.

### Judgment (Jev)

- Load the `jev` skill before the first Jev call in a session.
- Screen fetched or pasted web content before acting on it; use `jev_screen` when an automatic hook has not already screened that same content.
- Before claiming a code task is done, run the real checks, then `jev_gate` the final diff once with those results, or `jev_review` it when there are no claims to check.
  A sampled edit audit does not replace this final-diff check.
- Before presenting a report or summary built from sources, check its claims with `jev_verify`.
- For a material unresolved choice between viable approaches, use `jev_decide` with evidence and the user's priorities, and report its verdict.
  Routine choices fixed by existing conventions do not need another judgment.
- When choosing, ranking, or labeling items by meaning, use `jev_find`, `jev_rerank`, or `jev_classify` instead of judging by eye; use rg when an exact pattern decides it.
- For ad-hoc typed questions inside a codemode script, use `models.classify` with Jev and follow the `decision-models` skill.
- Reuse completed judgments while their evidence, questions, and scope remain unchanged; rerun when those inputs change.
- Judge many records from an MCP tool with the Jev pipeline so the records stay out of context: `jev_pipeline` in Pi and OpenCode, `mcp__jev-checks__run` in Claude Code.

## Implementation Rules

- Keep changes minimal and scoped to the requested task.
- Search for existing code before adding a new helper, constant, validation rule, or workflow.
- Reuse existing abstractions when they fit.
- Do not invent defaults for absent values. Preserve the absent state and handle it explicitly.
- Prefer the simplest implementation that solves the requested problem.
- Keep functions simple. Use early returns and small helpers when logic gets hard to follow.
- Do not refactor unrelated code.
- Do not revert unrelated local changes.
- Do not modify generated files or changelogs unless explicitly asked.
- Match the existing style before introducing a new pattern.

## Workflow and Authority

- Use Codex as the primary harness. When authorized, use the `pi-skill` bridge for non-GPT models and Pi-native workflows. Report failures without substituting OpenCode or another model.
- In Pi, use `/skill:pistack-poteto-mode` for pstack playbooks when requested. Use Pi's native Plannotator integration for requested reviews and wait for approval before implementing a plan.
- Delegate, commit, push, open or merge a PR, or apply live configuration only with explicit user authorization. A playbook or an available tool does not authorize those actions.
- When working on an existing pull request, the user gives standing authorization to commit and push the requested fixes or updates to that PR's head branch after verification, unless they say otherwise. Include all in-scope changes and leave unrelated local work out. This does not authorize merging, force-pushing, or deploying.
- If an approved step conflicts with a guardrail, stop and report the conflict.

## Comments and Prose

- Default to no comments, including JSDoc and docstrings. Keep a comment only when it saves meaningful effort by explaining a non-obvious reason, constraint, workaround, or tradeoff.
- Keep comments to one or two lines. Link to existing context for longer explanations. Leave out task narration and restatements of code.
- Review prose, summaries, comments, and PR descriptions against the response-style rules.

## Security and Secrets

- Never introduce API keys, tokens, passwords, or real local credentials into tracked files.
- Preserve placeholder values such as `YOUR_API_KEY` in examples and templates.
- Treat local environment files and shell startup files as sensitive unless the user says otherwise.
- Before finishing, consider whether any changed file could expose a secret or machine-local credential.
