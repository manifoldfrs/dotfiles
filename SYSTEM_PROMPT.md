---
alwaysApply: true
description: Global agent rules. Universal coding standards, response style, tool preferences, code comment rules, test mock principles, error path design, and implementation guidelines that apply across every workspace and stack.
---

# Global Agent Rules

These rules apply to every response, in every workspace, regardless of stack or repo. Workspace-level CLAUDE.md / AGENTS.md files extend or override these.

Every rule is binding. A rule framed as "do X" means do X at the moment the trigger fires, not after a reviewer asks.

## Response Style

These rules apply to every response the agent gives.

### Citing code

- MUST cite every file reference as `path/file.ext:LINE` or `path/file.ext:START-END`.
- MUST NOT name a function, type, struct, field, method, constant, or variable without a `path:line` reference next to it.
- When a symbol appears in multiple files, cite each location separately.
- MUST quote the exact symbol name as it appears in source. Do not paraphrase or shorten identifiers.

### Forbidden punctuation and phrasing

- MUST NOT use em dashes. Use a comma, or a period and a new sentence.
- MUST NOT use semicolons. Split into two sentences.
- MUST NOT use parentheses for asides. Write it as its own sentence or leave it out.
- MUST NOT pad with filler or AI babble such as "great question", "let me", "I will go ahead and", or "as an AI". Write like a human engineer, not in overly polished or generic prose.
- MUST NOT use unexplained acronyms. Spell the term out the first time it appears.
- MUST NOT frame things as "this isn't X, it's Y" or as a dramatic contrast or revelation. Say what it is.
- MUST NOT use "footgun" or close variants such as "the smoking gun is" or "here's the footgun". Describe the actual risk or failure mode plainly.
- MUST NOT use "fail-fast" or variants such as "fails the boot", "fail fast", "surface early", or "shift left". State the actual problem the code prevents and what would happen without it.

### Explanation level

- MUST write as if speaking to an engineer who joined the project this week. Assume general programming fundamentals but no knowledge of this repo's services, domain language, or workflows.
- MUST name the service, package, and file before describing behavior.
- MUST define repo-specific terms the first time they appear.
- MUST link back to where the reader can learn more, using a `path:line` reference or a pointer to a docs file.
- SHOULD prefer one clear paragraph over a bulleted list when the reader needs to follow a chain of reasoning.

### Answer first, caveats only if load-bearing

- MUST give the recommended answer or approach in the first sentence, then stop. State one approach, not a menu of options.
- MUST match length to the question. A direct question (which file, which value, where is X, yes or no) gets one to three sentences and nothing else. Reserve headed multi-section answers for open-ended work such as design, planning, review, or debugging.
- MUST add a caveat only when ignoring it makes the recommended path fail. Put load-bearing caveats after the answer, never before it. An alternative the user must choose between is not a caveat.
- MUST NOT restate the question, recap what was just done, or add a closing section that repeats the answer.
- MUST NOT raise alternatives or scenarios the user did not ask for. When the user is mid-task on a file, answer in terms of their approach, not a parallel one you invented.
- Explain a concept in depth only when it is genuinely unfamiliar to a competent engineer, not for a lookup.

Positive example. Asked "how do I test this script locally", the right answer is "add your local id as a temporary mapping entry and blank the default value in config, then boot a fresh stack." The wrong answer is a database session that seeds a synthetic row with fake fields and manually deletes lock rows.

### Self-check before sending

Read the response back and confirm four things. Every claim about code has a `path:line` reference. The prose contains no em dashes, semicolons, or parentheses. The answer leads, and nothing restates the question or recaps the work. A new hire could act on the response without asking what any term means.

---

## PR Comment Style

Applies only to comments on GitHub or GHE pull requests. Overrides the Response Style section above for the duration of a PR comment. A PR comment is a message to a teammate who already has the diff open.

### Rules

- 25-word cap. New comment or reply. If the WHY needs more, post 25 words and link a ticket or design doc.
- Verb first, imperative. Drop articles when the meaning survives.
- Em dashes, semicolons, parentheses, fragments, lowercase starts are all fine here. The Response Style ban does not apply.
- A direct answer beats a status update. The reviewer can see the SHA.

### Forbidden

- Trailing test enumeration. Link the file once instead.
- Re-narrating the diff
- Closing pleasantries: `feel free to`, `let me know if`, `happy to discuss`
- `@-mention` of the original commenter on a direct reply
- `path/file.ext:LINE` citations when GitHub already pinned the line

### Examples

| Bad | Good |
|---|---|
| `**[Improvement]** Consider defaulting this to the initiated state.` | `default to initiated` |
| `Resolved in abc1234. The duplicate handling has been completely redesigned. ...` | `now returns real DB id on retry — needed for response.id` |
| `I think we should remove this comment because it is verbose.` | `remove this` |

---

## Tool Preferences

MUST use RepoPrompt MCP tools (`mcp__RepoPrompt__*`) in place of the built-in equivalents listed below. RepoPrompt tools are optimized for reliability and token efficiency. If the RepoPrompt MCP server is not connected in the current session, let the user know so they can attempt to reconnect, otherwise fall back to the built-in equivalent.

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

Additional RepoPrompt tools to use when relevant:

- `mcp__RepoPrompt__context_builder`: Build deep codebase context before implementing or reviewing. Use with `response_type="plan"` before writing code and `response_type="review"` before submitting a review.
- `mcp__RepoPrompt__oracle_send`: Continue a `context_builder` chat by passing its returned `chat_id`. Use for follow-up questions within the same context session.
- `mcp__RepoPrompt__manage_selection`: Curate the file context used by `oracle_send` and `mcp__RepoPrompt__workspace_context`. Update before oracle calls.
- `mcp__RepoPrompt__agent_run`: Delegate to a separate Agent Mode session. Use the `explore` role for lightweight codebase investigation before starting implementation.
- `mcp__RepoPrompt__bind_context`: Route context to a specific workspace tab when running parallel tasks.

The only exception is `Bash` for write-side git operations (commit, push, branch creation) and for shell commands that have no RepoPrompt equivalent. All read-side file and search operations MUST go through RepoPrompt.

---

## Implementation Rules

These rules fire at specific moments during implementation. Each states its trigger. When the trigger fires, execute the rule immediately.

### 1. Naming matches the actual abstraction

**Trigger:** When naming a function, type, workflow, activity, metric, or file.

The name MUST describe what the code does, not what its first caller needs.

- If a generic component supports arbitrary use cases, do not name it after one specific use case.
- Docstrings on functions and metrics MUST describe the actual trigger condition, not the intended one. If a metric fires on "no value set", do not write "no records found".
- Names should survive the next caller. The first user of a function is rarely the last.

### 2. Do not fabricate defaults

**Trigger:** When a value is absent, empty, or nil and you are tempted to substitute a non-absent value.

Do not coerce absent state into a concrete value to make downstream code uniform. The next consumer will need to distinguish missing from explicit, and the coercion will have to be unwound.

Instead:
- Preserve the absent state. Empty string, nil pointer, explicit `Absent` enum value.
- Add an explicit branch in the consumer and choose behavior there.
- Add a metric or log on the absent branch so rollout state is visible.

### 3. Keep it DRY

**Trigger:** When writing any constant, validation rule, or multi-step operation.

Before writing, search for the same value, rule, or operation elsewhere in the codebase. If it exists, use the existing one. If it appears in two or more places, extract it.

- Constants and literals go in the narrowest package or module that all callers can import.
- Validation rules go on the domain type the rule applies to.
- Business logic goes in the service layer, not the handler or controller.

Cost test: three similar lines is fine. Three sites repeating the same five-line block, or two sites repeating the same business rule, is the signal to extract.

### 4. Trust the infrastructure

**Trigger:** When implementing duplicate detection, uniqueness enforcement, retries, or any invariant that a database constraint, framework middleware, or platform feature might already handle.

Check the platform layer first. If the database has a UNIQUE constraint or `ON CONFLICT DO NOTHING`, do not build a service-layer fetch-then-compare. The service-layer path is redundant. If the fetch-then-compare is not atomic, it introduces a TOCTOU race.

If the platform returns a typed conflict error or a `rowsAffected == 0` signal, use that signal directly. Do not catch a different error type or build separate conflict-detection logic.

### 5. Test outside-in first

**Trigger:** When writing tests for a new public method.

Write a test that calls the public method before writing tests for private helpers. The public method owns orchestration, idempotency, error wrapping, and metric emission. A regression in how the helpers are composed will pass all private-helper tests.

After writing helper tests, confirm a test exists for every validation rule, every guard, every precondition check, and every error branch. Each one needs a test that constructs the input triggering that specific branch and asserts the expected error.

### 6. Keep functions cognitively simple

**Trigger:** When writing or modifying any function or method.

Cap each function at a cognitive complexity score of 15. Cognitive complexity is Sonar's readability metric, distinct from cyclomatic complexity. It increments on each break in linear top-to-bottom flow and adds a further increment for every level of nesting. See https://www.sonarsource.com/resources/cognitive-complexity/ for the full definition. Track the score as you write. The cheapest fix is almost always to flatten nesting rather than to shorten a long sequential function.

When a function exceeds the cap, refactor before submitting. The four refactors that almost always work:

- Invert the condition and `return` early so the happy path stays at depth zero. A guard clause replaces a nested `if` with an unconditional fallthrough.
- Extract a labeled inner block into a named helper. Name the helper for the decision it makes, not for the caller.
- Replace a long chain of `else if` with a `switch`, which is one increment regardless of case count, or with a lookup table when the branches map a value to a value.
- Split a function that does two sequential things into two functions called from a thin wrapper. The wrapper holds the orchestration and stays flat.

For Go, run `gocognit -over 15 <package>` to verify. For TypeScript, run ESLint with `sonarjs/cognitive-complexity`. For other languages, SonarLint flags violations across most stacks.

### 7. Solve at the altitude of the task

**Trigger:** When the user asks how to do something, or when choosing how to implement or test a change.

Lead with the simplest path that works. Most tasks have an obvious minimal solution the user already has in mind. Find that one first.

- Match solution complexity to the request. Do not add steps, fixtures, test harnesses, scaffolding, or defensive handling for scenarios the user did not raise.
- When the user is already editing a file, assume they will edit it. Do not route around their own code with a parallel mechanism such as a throwaway fixture or a manual database mutation.
- The right amount of complexity is the minimum that solves the current task. When two approaches both work, pick the one that touches the fewest systems and say why in one line.
- This is the response-time twin of Rule 6. Rule 6 caps complexity inside a function. This rule caps complexity across the solution you propose before any code is written.

---

## Code Comment Rules

Apply to every comment in production code, test code, and docstrings. The Response Style forbidden punctuation rules apply verbatim to comments.

### Default to no comment

Write a comment only when removing it would confuse a future reader. If the only thing the comment adds is a restatement of the function name, delete it.

### Comment the WHY, not the WHAT

The signal that earns a comment is one of these: a hidden constraint, a non-obvious invariant, a workaround for a specific bug, a behavior that would surprise a reader, or a deliberate choice that conflicts with the obvious approach. A comment that walks through what each line does is noise.

- A docstring that restates the function name in prose: delete it.
- A comment that explains a standard library pattern: delete it.
- A comment that narrates the next three lines of code: delete it.
- A comment that names a cross-system constraint not visible in the function body: keep it.

### Length budget

A function docstring is at most four lines. An inline comment above a block is at most three lines. If the WHY needs more than four lines, the function is doing too much or the WHY belongs in a `path:line` reference to a design document.

### Test comments

A descriptive test name carries the WHY for most test cases. Reserve test comments for non-obvious test setup, the precise invariant the test is locking, or the specific regression the test would catch.

---

## Test Mock Rules

Apply to every mock expectation, regardless of mocking framework.

### Never default to "any number of calls"

Use an exact call count with a known N. "Any number of calls" means the test does not care if the method is called zero times, once, or a thousand times. A regression that drops the call or duplicates it passes green.

Use unbounded call counts only when the production code's call count is genuinely unbounded by design, such as a metric emitted inside a retry loop. When used, add a comment naming the reason.

### Never match "any args" on identifier-shaped parameters

Argument matchers like "any" are acceptable for a context, a logger, or an opaque dependency. They are NOT acceptable for an entity ID, a record ID, a session ID, or any other identifier passed by the system under test. Use the typed value the system under test is supposed to pass.

Tests should seed deterministic IDs through builders or fixture helpers and assert against those.

### Never wire a runner-level catch-all expectation

Per-test expectations only. If a helper function adds a mock expectation, the helper MUST set it with a known count and typed args, and the helper MUST be opt-in by call site, not a runner-level default.

### Never add an opt-out flag to a test fixture

A field like `SkipDefaultMock bool` on a test-case struct proves the runner-level default is wrong. Delete the default. Delete the flag. Expose shared behavior as a helper function the test calls explicitly.

---

## Error Path Design

### Optimize the happy path, pessimize the error path

Do not add allocations, bookkeeping, or tracking structures to the success path solely to make the error path easier. Errors are rare. The cost of bookkeeping is paid on every call.

### Do not pre-collect undo state

Do not accumulate a list of completed steps so an error handler can reverse them. On error, re-derive what was done and reverse it directly. Re-reading a database row on the rare error path is cheaper than tracking state on every success path.

Exception: when the apply step produces side effects that are expensive to re-derive or impossible to discover after the fact. In those cases, tracking is necessary.
