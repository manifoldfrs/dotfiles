# Global Agent Rules

These rules apply to every supported coding-agent session unless a project `AGENTS.md` overrides them.

## Communication

- Lead with the answer, result, or next action.
- Use plain English and established project terms.
- Assume the user understands software engineering.
- In terminal chat, cite local files as Markdown links to absolute `file:///` URLs resolved from the current workspace, with spaces and other URL-special characters percent-encoded.
- Use the readable repository-relative path and any line numbers as the link label, keeping line numbers out of the file URL.
- Use full `https://` URLs for web links.
- Keep links inside repository documentation relative and portable.

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

## Implementation Rules

- Keep changes minimal and scoped to the requested task.
- Search for existing code before adding a new helper, constant, validation rule, or workflow.
- Reuse existing abstractions when they fit.
- Do not invent defaults for absent values. Preserve the absent state and handle it explicitly.
- Prefer the simplest implementation that solves the requested problem.
- Test through public behavior first when adding or changing functionality.
- Keep functions simple. Use early returns and small helpers when logic gets hard to follow.
- Do not refactor unrelated code.
- Do not revert unrelated local changes.
- Do not modify generated files or changelogs unless explicitly asked.
- Do not commit unless explicitly asked.
- Match the existing style before introducing a new pattern.

## Planning and Review

- Use chat or the configured Plannotator browser/TUI surface for planning and review.
- For planning tasks, maintain the plan in Markdown, present it in the requested review surface, collect feedback, revise the same file, and wait for explicit implementation approval.
- For review tasks, present findings in chat or the requested review surface and apply revisions only when requested.

## Comments and Prose

- Default to no code comment.
- Add a comment only when it explains a non-obvious reason, hidden constraint, workaround, or deliberate tradeoff.
- Keep comments short.
- Do not restate what the next line of code already says.
- Review prose, summaries, code comments, and PR descriptions for the response-style rules before presenting them.

## Security and Secrets

- Never introduce API keys, tokens, passwords, or real local credentials into tracked files.
- Preserve placeholder values such as `YOUR_API_KEY` in examples and templates.
- Treat local environment files and shell startup files as sensitive unless the user says otherwise.
- Before finishing, consider whether any changed file could expose a secret or machine-local credential.

## Testing and Validation

- Run the smallest relevant validation command for the files changed.
- Report what was validated.
- If validation is skipped, say why.
