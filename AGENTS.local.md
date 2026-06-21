# User Rules

When writing for this user, avoid:

- **AI babble** - overly polished, generic, or filler language. Write like a human engineer.
- **Em dashes (—)** - use commas, periods, or parentheses instead.
- **"This isn't X, it's Y" constructions** - don't frame things as dramatic contrasts or revelations. Just say what it is.
- **"That's the footgun"** (and close variants like "the smoking gun is...", "here's the footgun") - don't use this phrase. Describe the actual risk or failure mode plainly.
- **"fail-fast"** (and variants like "fails the boot", "fail fast", "surface early", "shift left") - don't use this jargon. State the actual problem the code prevents and what would happen if it did not.
- **Verbose responses** - Explain concepts, solutions, and everything else in SIMPLE terms. Pretend I'm a new engineer that just onboarded to the team. You're a Senior Software engineer that must teach me in the right way.

**Why:** User explicitly flagged these as patterns they don't want in vision docs, code review output, chat replies, or any writing.

**How to apply:** Review all written output (prose, summaries, code comments, PR descriptions, chat replies) for these patterns before presenting. Applies globally, not just to vision docs.

# Commerce Engine — Agent Rules

Every rule in this file is binding. The agent MUST follow each rule during implementation, not just during review. A rule framed as "do X" means do X at the moment the trigger condition is met, not after a reviewer asks. Violations caught in review mean the rule was not followed. The goal is zero violations reaching review.

These rules extend the global rules in `~/.cbcode-home/.claude/CLAUDE.md`. Engine-specific overrides only. Universal rules (response style, PR comment style, code comment rules, test mock principles, error path design, naming, do-not-fabricate-defaults, DRY, trust-the-infrastructure, test-outside-in) live in the global file. Do not duplicate them here.

Mechanical safety rules (no edits to generated files, no `--no-verify`, no force-push to protected branches, no `make run-all` or `make clean` without confirmation, no edits to production configs or committed migrations) are enforced by hooks under `.claude/hooks/` and `~/.cbcode-home/.claude/hooks/`. Do not duplicate them here either.

## Tool Preferences

MUST use RepoPrompt MCP tools (`mcp__RepoPrompt__*`) in place of the built-in equivalents listed below. RepoPrompt tools are optimized for reliability and token efficiency in this workspace.

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

The only exception is `Bash` for write-side git operations (commit, push, branch creation) and for running shell commands that have no RepoPrompt equivalent. All read-side file and search operations MUST go through RepoPrompt.

---

## Implementation Rules

These rules fire at specific moments during implementation. Each rule states its trigger condition, body, and the verification evidence that proves it was followed. When the trigger fires, execute the rule immediately. Before claiming an implementation complete, walk each Verify checklist and produce the cited evidence. A `path:line` reference to a test, a constant, or a proto annotation is evidence. A verbal walkthrough is not.

### 1. Right location, right abstraction level

**Trigger:** When writing a new function or moving an existing one.

Before placing a function, check two things. First, search for an existing function that already does the same operation. Use `mcp__RepoPrompt__file_search` to search for the operation name across the codebase. Second, check whether the function operates on a generic type. If it does, it MUST NOT live in a use-case-specific file. Place it in a general file in the same package, or in `internal/shared/` if multiple packages need it.

- If a function takes a parameter only for logging or correlation and is otherwise generic, drop the parameter. The caller decorates the context-logger before calling.
- If a validation function exists but is not called at the current call site, use the existing function. Do not duplicate the invariants inline.
- For zero EVM addresses, use `common.Address{}.Hex()`. Do not re-type the hex literal.

### 2. Correctness at the edges

**Trigger:** When writing any validation, parser, or input handler.

Run the input through these cases mentally before writing the happy path: `""`, `"."`, `".50"`, `"+"`, `"-1"`, `"abc"`, `"0"`, leading/trailing whitespace, mixed case. If any case silently produces zero or a partial value, add a rejection before the input reaches the parser.

- EVM address comparisons MUST use case-insensitive equality via `shared_web3.IsEVMAddressEqual`.
- Zero-amount inputs in financial paths MUST be explicitly rejected, not silently passed through.
- Checking `== ""` is necessary but not sufficient for amount fields. PR #15 found that `"."` reached `parseAmountParts` and produced `0` without error. Validate format with a regex before parsing.
- A `defer` that mutates step state MUST come after all validation. Otherwise a validation failure leaves the step stuck.

**Verify:**

1. State what `""`, `"."`, `".50"`, `"+"`, `"-1"`, `"abc"`, `"0"` each produce. Any silent zero or partial value means a format check is missing.
2. For every EVM address comparison, cite the `path/file.go:LINE` and confirm it uses `shared_web3.IsEVMAddressEqual` or case-insensitive equality.
3. For every `defer` that mutates step state, cite the `path/file.go:LINE` and confirm all validation runs before the defer.

### 3. Single source of truth

**Trigger:** When adding validation, a default value, or state tracking.

Before adding a check, confirm no other layer already enforces the same invariant. If the API layer validates expiry, do not re-validate with a different buffer in the service layer.

- Package-level mutable maps are unsafe across goroutines. Replace with a function or a sync-protected accessor.
- Use typed sentinels for absent values. A `Found bool` field, a typed nil, or an explicit `Absent` enum value is clearer than overloading an empty string or zero.

### 4. New files require a real boundary

**Trigger:** When creating a new `.go` file.

A new file is justified only when it holds at least three or four cohesive helpers, OR fronts a distinct subsystem other packages import directly, OR holds a public type that warrants discoverability by file name.

A single private helper used by one or two other files in the same package MUST go in the file that owns the calling service struct. PR #970 inlined `payment_session_billing.go` into `payment_session.go` because it was a single-helper file.

### 5. Proto annotations match handler enforcement

**Trigger:** When writing or modifying a handler that validates request fields.

For every field the handler rejects when empty, add `[(google.api.field_behavior) = REQUIRED]` to the proto. For every format or range constraint the handler enforces, add a comment on the proto field documenting the valid format. A consumer reading only the proto MUST get the correct contract without also reading the handler source.

**Verify:**

1. For every field the handler rejects when empty, cite `protos/path/file.proto:LINE` and confirm `[(google.api.field_behavior) = REQUIRED]`.
2. For every regex or value range the handler enforces, confirm the proto comment documents the valid format.
3. For every enum field where UNSPECIFIED is rejected, confirm the proto comment documents that UNSPECIFIED is invalid.

### 6. TDD observability is not optional

**Trigger:** Before writing any implementation code for a ticket that has a TDD.

Extract every metric name, log query, and monitor expression from the TDD into a concrete list. Track each item as you implement. After implementation, verify each item exists in the diff.

- Tracing spans do not replace statsd counters. They are different systems.
- A monitor query like `commerce.engine.settlement.reconciliation.error.as_count()` requires a metric constant in `internal/shared/metrics/metrics_names.go`. If the constant does not exist, the monitor has nothing to aggregate.
- A runbook log query requires structured log fields. If the implementation logs the error but omits a required field, the runbook query returns no results.
- Metric names MUST follow the dotted sub-namespace pattern `commerce.engine.{service}.{category}.{event}`. Group related counters under a shared sub-namespace like `billing_config.missing` and `billing_config.invalid`. Do not collapse to a single underscore-joined segment.

**Verify:**

1. For each metric the TDD names, cite the constant in `internal/shared/metrics/metrics_names.go:LINE`.
2. For each statsd counter the TDD requires, confirm a `statsd.Incr` or equivalent call exists in the diff.
3. For each structured log the TDD requires, confirm the log line includes all specified fields.
4. If an item is intentionally deferred, note it explicitly in the PR description.

### 7. Mock hygiene (gomock)

**Trigger:** When writing or modifying a gomock EXPECT.

The global Test Mock Rules state the principles. This rule translates them to gomock and engine fixtures.

- Use `Times(N)` with a known N. `AnyTimes()` only when the production call count is genuinely unbounded by design (e.g. metric inside a retry loop), and add a comment naming the reason.
- Use the typed value on identifier-shaped parameters, seeded through `builders` and `seed*BaseData` helpers. `gomock.Any()` is acceptable for context, logger, or opaque dependencies only. Example: `EXPECT().GetBillingConfig(gomock.Any(), seed.Operator.ID)`, not `EXPECT().GetBillingConfig(gomock.Any(), gomock.Any())`.
- Place EXPECTs at the test site or in an opt-in helper the test calls explicitly. The wallet authorize tests follow this pattern: `mockAuthorizeTransactionLoadsOnly` for tests that control the billing call themselves, `mockAuthorizeTransactionWithCalls` for tests that do not care. Each test picks one explicitly.
- No `Skip*Mock` or `Allow*Mock` flag on any test-case struct.

**Verify:**

1. For every EXPECT in the diff, confirm `Times(N)` with a known N, or an `AnyTimes()` with a comment naming the unbounded-by-design reason.
2. For every identifier-shaped parameter, confirm a seeded typed value is passed (not `gomock.Any()`).
3. For every helper that adds an EXPECT, confirm it sets a known call count with typed args and is called explicitly per-test.
4. Confirm no test-case struct has a `Skip*Mock` or `Allow*Mock` flag.

---

## Reference PRs

These PRs are canonical examples of engine-specific rules being applied in review.

- **PR #957** COM2-2518 operator_settings billing namespace. EIP-55 normalization at write time. CAIP-2 parity test. `Validate()` shipped with explicit deferral to next ticket.
- **PR #970** COM2-2567 auto-fill fee params from billing config. Surfaced "do not fabricate defaults" (empty `BillingConfig.Mode` coerced to `gross` had to be unwound, see global Rule 2) and Rule 4 above (`payment_session_billing.go` inlined into `payment_session.go`).
- **PR #15** COM2-2516 settlement service write API. Surfaced "trust the infrastructure" (global Rule 4, service-layer equivalence check duplicated `ON CONFLICT DO NOTHING` and introduced a TOCTOU race), Rule 5 above (handler enforced `payment_method` as required but proto had no REQUIRED annotation), Rule 6 above (TDD specified statsd counters but PR only added DD tracing spans), and "test outside-in first" (global Rule 5, 600 lines of private-helper tests but zero lines testing the public method).
- **PR #12** COM2-2620 settlement_account_workflow. Canonical example of reviewer comment voice. See PR Comment Style in `~/.cbcode-home/.claude/CLAUDE.md`.
