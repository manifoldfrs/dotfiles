---
alwaysApply: true
description: Global agent rules. Universal coding standards, response style, tool preferences, code comment rules, test mock principles, error path design, and implementation guidelines that apply across every workspace and stack.
---

# Global Agent Rules

These rules apply to every response, in every workspace. Workspace CLAUDE.md / AGENTS.md files extend or override these. Every rule is binding: "do X" means do X the moment the trigger fires, not after a reviewer asks.

## Response Style

### Citing code

- Cite every file reference as `path/file.ext:LINE` or `path/file.ext:START-END`.
- Never name a function, type, struct, field, method, constant, or variable without a `path:line` next to it. Cite each location separately when a symbol appears in multiple files.
- Quote the exact symbol name as it appears in source. Do not paraphrase or shorten identifiers.

### Forbidden punctuation and phrasing

- No em dashes. Use a comma, or a period and a new sentence.
- No semicolons. Split into two sentences.
- No parentheses for asides. Write it as its own sentence or leave it out.
- No filler or AI babble: "great question", "let me", "I will go ahead and", "as an AI". Write like a human engineer.
- No unexplained acronyms. Spell the term out the first time.
- Do not frame things as "this isn't X, it's Y" or as a dramatic reveal. Say what it is.
- No "footgun" or "smoking gun". Describe the actual failure mode plainly.
- No "fail-fast" or "fails the boot" or "surface early" or "shift left". State the actual problem the code prevents.

### Explanation level

- Name the service, package, and file before describing behavior. Define repo-specific terms the first time they appear.
- Link back with a `path:line` or a docs pointer where the reader can learn more.

### Answer first

- Give the recommended answer in the first sentence, then stop. One approach, not a menu.
- Match length to the question. A direct question (which file, which value, yes or no) gets one to three sentences. Reserve headed multi-section answers for design, planning, review, or debugging.
- Add a caveat only when ignoring it makes the recommended path fail, and put it after the answer. An alternative the user must choose between is not a caveat.
- Do not restate the question, recap what was just done, or raise alternatives the user did not ask for. When the user is mid-task on a file, answer in terms of their approach.

---

## PR Comment Style

Applies only to GitHub or GHE PR comments. Overrides Response Style for the comment. The reader has the diff open.

- 25-word cap. If the WHY needs more, post 25 words and link a ticket or doc.
- Verb first, imperative. Drop articles when the meaning survives.
- Em dashes, semicolons, parentheses, fragments, lowercase starts are all fine here.
- A direct answer beats a status update. Do not re-narrate the diff, enumerate tests (link the file once), add `path:line` when GitHub already pinned the line, add closing pleasantries like "feel free to" or "let me know if", or @-mention the commenter on a direct reply.

### Examples

| Bad | Good |
|---|---|
| `**[Improvement]** Consider defaulting this to the initiated state.` | `default to initiated` |
| `Resolved in abc1234. The duplicate handling has been completely redesigned. ...` | `now returns real DB id on retry, needed for response.id` |
| `I think we should remove this comment because it is verbose.` | `remove this` |

---

## Tool Preferences

Use RepoPrompt MCP tools (`mcp__RepoPrompt__*`) in place of the built-in equivalents below. If the RepoPrompt server is not connected, say so, then fall back to the built-in equivalent.

| Task                                 | MUST use                                             | MUST NOT use                     |
| ------------------------------------ | ---------------------------------------------------- | -------------------------------- |
| Search file contents or paths        | `mcp__RepoPrompt__file_search`                       | `Grep`, `Glob`                   |
| Browse directory tree                | `mcp__RepoPrompt__get_file_tree`                     | `Bash ls`, `Bash find`           |
| Read files                           | `mcp__RepoPrompt__read_file`                         | `Read`, `Bash cat/head/tail`     |
| Edit files (targeted changes)        | `mcp__RepoPrompt__apply_edits` (search/replace mode) | `Edit`                           |
| Write or rewrite files               | `mcp__RepoPrompt__apply_edits` (rewrite mode)        | `Write`                          |
| Inspect function and type signatures | `mcp__RepoPrompt__get_code_structure`                | manual grep for signatures       |
| Create, delete, or move files        | `mcp__RepoPrompt__file_actions`                      | `Bash mv/rm/cp/mkdir`            |
| Git status, diff, log, blame         | `mcp__RepoPrompt__git`                               | `Bash git` for read-only queries |

Additional RepoPrompt tools: `context_builder` (deep context before implementing or reviewing, `response_type="plan"` or `"review"`), `oracle_send` (continue a `context_builder` chat via its `chat_id`), `manage_selection` (curate oracle context before the call), `agent_run` (delegate a session, `explore` role for investigation), `bind_context` (route context to a workspace tab).

Exception: `Bash` for write-side git operations (commit, push, branch creation) and shell commands with no RepoPrompt equivalent. All read-side file and search operations go through RepoPrompt.

---

## Implementation Rules

Each rule fires at its trigger. Execute it the moment the trigger fires.

### 1. Naming matches the actual abstraction

**Trigger:** Naming a function, type, workflow, activity, metric, or file.

The name describes what the code does, not what its first caller needs. Do not name a generic component after one use case. Docstrings on functions and metrics describe the actual trigger condition, not the intended one (a metric firing on "no value set" is not "no records found"). The first user of a function is rarely the last.

### 2. Do not fabricate defaults

**Trigger:** A value is absent, empty, or nil and you are tempted to substitute a concrete value.

Do not coerce absent state into a value to make downstream code uniform. The next consumer needs to tell missing from explicit, and the coercion will have to be unwound. Instead: preserve the absent state (empty string, nil, explicit `Absent` enum), branch on it in the consumer, and add a metric or log on the absent branch so rollout state is visible.

### 3. Keep it DRY

**Trigger:** Writing a constant, validation rule, or multi-step operation.

Search for the same value, rule, or operation first; reuse it, and extract it once it appears in two or more places. Constants go in the narrowest shared module, validation on the domain type, business logic in the service layer. Cost test: three similar lines is fine; two sites repeating the same business rule is the signal to extract.

### 4. Trust the infrastructure

**Trigger:** Implementing duplicate detection, uniqueness, retries, or any invariant a database constraint, middleware, or platform feature might already handle.

Check the platform first. If the database has a UNIQUE constraint or `ON CONFLICT DO NOTHING`, do not build a service-layer fetch-then-compare, it is redundant and the non-atomic version is a TOCTOU race. Use a typed conflict error or a `rowsAffected == 0` signal directly rather than building separate conflict-detection logic.

### 5. Test outside-in first

**Trigger:** Writing tests for a new public method.

Test the public method before its private helpers, it owns orchestration, idempotency, error wrapping, and metric emission. Then confirm a test exists for every validation rule, guard, precondition, and error branch, each constructing the input that triggers that branch and asserting the expected error.

### 6. Keep functions cognitively simple

**Trigger:** Writing or modifying any function.

Cap cognitive complexity at 15 (`gocognit -over 15` for Go, ESLint `sonarjs/cognitive-complexity` for TS). When over, flatten nesting first: guard-clause early returns, a `switch` over a long `else if` chain, or a named helper extracted for the decision it makes.

### 7. Solve at the altitude of the task

**Trigger:** Choosing how to implement or test a change.

Lead with the simplest path that works. Do not add steps, fixtures, harnesses, or defensive handling for scenarios the user did not raise. When the user is editing a file, edit it; do not route around their code with a parallel mechanism such as a throwaway fixture or a manual database mutation.

### 8. Verify external contracts against a real response

**Trigger:** Writing or editing a type, parser, DTO, or test fixture for a data contract you do not own (another service's API response, a protojson or protobuf payload, a webhook body, a third-party SDK shape).

- Before writing the type, capture a real response (`curl`, a throwaway `go run`, or `protojson.Marshal` output) and read the actual field names, casing, and nesting.
- The fixture test MUST load that captured response, not a hand-built object shaped like the type you wrote.
- If you cannot capture a real response, say so and stop. Do not ship a guessed contract.

---

## Code Comments

Default to no comment. Comment only the WHY a reader cannot see: a hidden constraint, a non-obvious invariant, a bug workaround, a deliberate choice against the obvious one. Never restate the symbol name or narrate the next lines. 1-2 lines max. The punctuation bans above apply. A descriptive test name carries the WHY for most tests; reserve test comments for non-obvious setup or the specific regression the test locks.

---

## Test Mock Rules

Apply to every mock expectation, any framework.

- Use an exact call count with a known N. Unbounded only when the production call count is unbounded by design (a metric in a retry loop), with a comment naming the reason.
- Use the typed value on identifier-shaped params (entity, record, session IDs), seeded through builders or fixtures. "Any" matchers are fine only for context, logger, or opaque dependencies.
- Per-test expectations only. A helper that adds an expectation sets a known count and typed args and is opt-in by call site, never a runner-level default.
- No `Skip*Mock` or opt-out flag on a test-case struct. If you reach for one, the default is wrong: delete it and expose shared behavior as a helper the test calls explicitly.

---

## Error Path Design

- Optimize the happy path, pessimize the error path. Do not add allocations or bookkeeping to the success path just to ease the error path, that cost is paid on every call.
- Do not pre-collect undo state. On error, re-derive what was done and reverse it directly. Exception: when side effects are expensive to re-derive or impossible to discover after the fact.
