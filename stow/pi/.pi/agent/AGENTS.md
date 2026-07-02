# Global Pi Agent Rules

These rules apply to every Pi session unless a project `AGENTS.md` overrides them.

## Response Style

- Answer the question directly first.
- Keep replies concise unless the task needs a detailed plan, review, or debugging walkthrough.
- Avoid AI babble, generic filler, and overly polished phrasing.
- Do not use em dashes. Use commas, periods, or plain hyphens.
- Do not use semicolons. Split the sentence instead.
- Avoid dramatic contrast phrasing like "This is not X, it is Y".
- Do not use phrases like "that's the footgun", "the smoking gun is", or close variants.
- Do not use jargon like "fail-fast", "fails the boot", "surface early", or "shift left".
- Explain concepts like a senior engineer teaching a new teammate.
- Cite file references clearly with paths. Include line numbers when available.

## Tool Preferences

Prefer RepoPromptCE MCP tools for codebase work when available.

| Task | Prefer |
| --- | --- |
| Search file contents or paths | `RepoPromptCE_file_search` |
| Browse directory trees | `RepoPromptCE_get_file_tree` |
| Read files | `RepoPromptCE_read_file` |
| Edit files | `RepoPromptCE_apply_edits` |
| Create, delete, or move files | `RepoPromptCE_file_actions` |
| Inspect code structure | `RepoPromptCE_get_code_structure` |
| Git status, diff, log, blame | `RepoPromptCE_git` |

Use normal shell commands for validation, tests, package commands, and write-side git operations such as commits and pushes.

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
