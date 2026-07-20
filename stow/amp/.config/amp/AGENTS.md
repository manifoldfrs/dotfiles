# Global Amp Agent Rules

These rules apply to every Amp session unless a project `AGENTS.md` overrides them.

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
| Search file contents or paths | `mcp__RepoPromptCE__file_search` |
| Browse directory trees | `mcp__RepoPromptCE__get_file_tree` |
| Read files | `mcp__RepoPromptCE__read_file` |
| Edit files | `mcp__RepoPromptCE__apply_edits` |
| Create, delete, or move files | `mcp__RepoPromptCE__file_actions` |
| Inspect code structure | `mcp__RepoPromptCE__get_code_structure` |
| Git status, diff, log, blame | `mcp__RepoPromptCE__git` |

Use normal shell commands for validation, tests, package commands, and write-side git operations such as commits and pushes.

## Agent Tooling

When available on PATH, prefer the pinned `agent-commander` AXI tools over raw CLIs for agent-facing workflows:

| Task | Prefer |
| --- | --- |
| GitHub issues, PRs, CI, releases, and repo operations | `gh-axi` |
| Browser automation, page interaction, console, and network debugging | `chrome-devtools-axi` |
| Rich HTML plans, reports, diagrams, comparisons, and human review surfaces | `lavish-axi` |
| PR creation or validation gates when the repo has been initialized | `git push no-mistakes` or `no-mistakes` |
| Isolated reusable worktrees for manual agent sessions | `treehouse` |

Use `lavish-axi` when a complex decision or report would be easier to review visually.
Use `no-mistakes init` once per Git repo before relying on the `no-mistakes` remote.

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
