# Agent Skills Usage Examples

Practical examples for using the global skills in any repository with Pi.

## How to invoke skills in Pi

For an explicit invocation:

```text
/skill:<name> <what you want>
```

Example:

```text
/skill:diagnosing-bugs Find why this test became flaky after the queue refactor.
```

Skills marked **automatic or explicit** may also be selected by Pi from a natural-language request. Explicit invocation is more reliable when you care about following a particular process.

Skills marked **explicit** run only when you invoke them.

## A typical feature flow

For a large feature:

```text
/skill:grill-with-docs Pressure-test this feature against the repository.
/skill:to-spec Turn our agreed design into a spec.
/skill:to-tickets Split the spec into independently implementable tickets.
/skill:implement Implement ticket 1 using TDD and finish with code review.
```

For a small feature or bug:

```text
/skill:tdd Add support for cancelling a pending transfer.
```

For a difficult bug:

```text
/skill:diagnosing-bugs Diagnose why duplicate webhook deliveries create two records.
```

---

## Planning, design, and discovery

### `ask-matt` — explicit

Use when you do not know which skill or sequence fits.

```text
/skill:ask-matt I have an unclear feature request that will probably touch the database, API, and UI. What flow should I use?
```

Expected result: a recommended skill or ordered flow. It should route you, not start the work.

### `architecture-scan` — explicit

Use to find evidence-backed architecture improvements before designing one.

```text
/skill:architecture-scan Scan src/billing and its callers. Rank the strongest ownership or seam problems, but do not refactor anything.
```

Expected result: a small ranked list tied to concrete files and call paths.

### `codebase-design` — automatic or explicit

Use when deciding module boundaries, interfaces, seams, and adapters.

```text
/skill:codebase-design Help me design a deep module around payment retries. Compare two interface shapes and identify the real seam.
```

Expected result: design reasoning using a consistent deep-module vocabulary, not an implementation.

### `domain-modeling` — automatic or explicit

Use when repository terms are vague, overloaded, or contradictory.

```text
/skill:domain-modeling We use “account” for a login identity, a bank account, and a billing customer. Help us establish precise terms and update CONTEXT.md.
```

Expected result: clarified terminology and, only when justified, an architectural decision record.

### `grill-me` — explicit

Use outside a repository, or when no project documentation should be written.

```text
/skill:grill-me Grill me on this SaaS idea. Ask one decision at a time and do not start building anything.
```

Expected result: a demanding interview that exposes assumptions.

### `grilling` — automatic or explicit

Use the interview technique directly without a larger wrapper.

```text
/skill:grilling Stress-test my proposal to replace polling with webhooks. Research facts yourself, but leave product decisions to me.
```

Expected result: questions in dependency order, followed by a shared-understanding gate.

### `grill-with-docs` — explicit

Use for Matt's repository-aware interview flow.

```text
/skill:grill-with-docs Grill this plan to add organization-level billing. Check the code and existing docs, then preserve settled terms and decisions.
```

Expected result: an interview informed by the repository, with relevant updates to `CONTEXT.md` or ADRs.

### `grill-me-with-docs` — automatic or explicit

Use the preserved local project-aware grilling workflow.

```text
/skill:grill-me-with-docs Stress-test this migration plan against the current code, CONTEXT.md, and ADRs. Capture only decisions that actually settle.
```

Expected result: one-question-at-a-time review against local evidence. Prefer either this or `grill-with-docs` consistently within a project.

### `improve-codebase-architecture` — explicit

Use for a broader architecture health pass.

```text
/skill:improve-codebase-architecture Review packages/orders for deepening opportunities and show me the visual report. Do not change code yet.
```

Expected result: an HTML report of candidate improvements, followed by an interview about the selected candidate.

### `prototype` — automatic or explicit

Use when a runnable experiment can answer a design question better than discussion.

```text
/skill:prototype Build a throwaway terminal prototype to test whether these subscription states and transitions make sense.
```

Expected result: disposable runnable evidence and a clear answer to one design question—not production code.

### `research` — automatic or explicit

Use for primary-source research that should become a cited repository document.

```text
/skill:research Research Stripe's current idempotency and webhook retry guarantees from official docs. Save a cited report under docs/research/.
```

Expected result: a Markdown report citing authoritative sources.

### `tech-spec` — explicit

Use when implementation needs a precise design handoff.

```text
/skill:tech-spec Write a design-only spec for moving notification delivery behind an adapter. Include contracts, call stacks, files, tests, risks, and open questions.
```

Expected result: an implementation-ready design without code changes.

### `to-questionnaire` — explicit

Use when another person holds information needed to proceed.

```text
/skill:to-questionnaire Create a questionnaire for our compliance lead about data retention, deletion timing, audit logs, and legal holds.
```

Expected result: a focused questionnaire aimed at the actual knowledge gap.

### `wayfinder` — explicit

Use for work too uncertain and large to fit in one session.

```text
/skill:wayfinder Map the decisions needed to split this monolith into independently deployable services. Publish decision tickets, not implementation tickets.
```

Expected result: a shared map of investigations and decisions that eventually feeds `to-spec`.

---

## Specifications, tickets, implementation, and review

### `setup-matt-pocock-skills` — explicit

Run once in a repository before using tracker-dependent Matt workflows.

```text
/skill:setup-matt-pocock-skills Configure this repo to use local Markdown issues under .scratch, the default triage labels, and a single root CONTEXT.md.
```

Expected result: reviewed configuration under `docs/agents/` and a small pointer in the existing agent instructions. It should never run automatically during Stow setup.

### `to-spec` — explicit

Use after the decisions are settled. It synthesizes; it does not interview again.

```text
/skill:to-spec Turn our conversation about passwordless login into a spec. Publish it to the configured tracker after showing me the proposed test seams.
```

Expected result: problem, behavior, scope, decisions, seams, and testing expectations.

### `to-tickets` — explicit

Use when a spec is too large for one implementation session.

```text
/skill:to-tickets Split docs/specs/passwordless-login.md into tracer-bullet tickets with explicit blocking relationships.
```

Expected result: end-to-end tickets that can be implemented in dependency order.

### `implement` — explicit

Use only after a spec or ticket is approved.

```text
/skill:implement Implement issue #142. Use the tdd skill at the agreed public seam, run the repository checks, and apply code-review before committing.
```

Expected result: tested implementation of the agreed work without reopening settled design.

### `tdd` — automatic or explicit

Use for one behavior at a time through red, green, and refactor.

```text
/skill:tdd Add rejection of expired invitation tokens. Start with one failing public-behavior test, make it pass minimally, then continue one behavior at a time.
```

Expected result: test → minimal implementation → next test, not a batch of speculative tests.

### `code-review` — automatic or explicit

Use to review a branch or working diff against both standards and requested behavior.

```text
/skill:code-review Review changes since origin/main against AGENTS.md and issue #142. Separate standards findings from spec findings.
```

Expected result: actionable findings tied to the diff, with false positives filtered out.

### `triage` — explicit

Use for incoming reports and external requests, not tickets generated by `to-tickets`.

```text
/skill:triage Triage the open issues labeled needs-triage. Verify reproducibility, request missing information, and prepare agent-ready briefs where possible.
```

Expected result: issues moved through the configured triage states.

### `diagnosing-bugs` — automatic or explicit

Use for difficult bugs, regressions, flakes, and performance failures.

```text
/skill:diagnosing-bugs Diagnose why the reconciliation job occasionally creates duplicate ledger entries. Establish one reproducible failing command before proposing a fix.
```

Expected result: reproduce → minimize → hypothesize → instrument → fix → regression test.

### `resolving-merge-conflicts` — automatic or explicit

Use while a merge or rebase is already conflicted.

```text
/skill:resolving-merge-conflicts Resolve the current rebase conflicts by tracing the intent of both branches. Validate the result and continue the rebase; never abort it automatically.
```

Expected result: intent-preserving resolutions and completed validation.

---

## Coding standards and stack-specific guidance

### `coding-standards` — automatic or explicit

Use dmmulroy's larger TypeScript and Effect standards with progressive references.

```text
/skill:coding-standards Implement the TypeScript webhook ingestion path. Load the parsing, errors, idempotency, persistence, testing, and observability references that apply.
```

Expected result: correct-by-construction TypeScript with only relevant references loaded.

### `coding-standards-ts` — automatic or explicit

Use the preserved concise local TypeScript standards.

```text
/skill:coding-standards-ts Review this Next.js route for unsafe input handling, invalid states, misplaced effects, and tests coupled to implementation.
```

Expected result: a focused application of local TypeScript principles. Prefer `coding-standards` when Effect or its detailed references are relevant.

### `coding-standards-go` — automatic or explicit

Use for Go design, implementation, or review.

```text
/skill:coding-standards-go Add a Go adapter for the provider API. Preserve absence, pass context, own resource lifetimes, and test observable behavior.
```

Expected result: repository-aware, correct-by-construction Go.

### `cloudflare-composition-root` — automatic or explicit

Use in Hono/Cloudflare projects when runtime bindings leak into inner code.

```text
/skill:cloudflare-composition-root Refactor this Hono worker so Durable Object and KV bindings are translated into application services at the composition root.
```

Expected result: Cloudflare-specific dependencies stay at the outer edge.

### `write-discoverable-code` — automatic or explicit

Use when naming or organizing code so agents and humans can find it with plain-text search.

```text
/skill:write-discoverable-code Rename and reorganize this generic utils.ts module so exported names, files, errors, and comments are easy to locate with grep.
```

Expected result: domain-rich identifiers, searchable literals, and concept-focused files.

---

## Session, communication, and learning

### `handoff` — explicit

Use when another session, directory, harness, or person must continue the work.

```text
/skill:handoff Prepare a handoff for a fresh Pi session that will implement issue #142. Reference the existing spec and diff instead of copying them.
```

Expected result: a compact temporary document containing only live context and next steps.

### `bro` — explicit

Use when the previous answer was too abstract or full of jargon.

```text
/skill:bro
```

Expected result: the previous message restated plainly and concisely.

### `wait-what` — explicit

Use when the previous explanation did not land and needs a better framing.

```text
/skill:wait-what I lost you when you started talking about capability tokens.
```

Expected result: a clearer re-pitch with the missing context supplied.

### `tldr` — automatic or explicit

Use to toggle terse responses.

```text
/skill:tldr on
```

Later:

```text
/skill:tldr off
```

Expected result: short responses while enabled, without truncating code, exact errors, commands, or safety warnings.

### `quiz-me` — automatic or explicit

Use for active recall about a repository or technical topic.

```text
/skill:quiz-me Test my understanding of this repository's authentication flow. Ask one question at a time and use escalating hints.
```

Expected result: guided recall without immediately revealing answers.

### `teach` — explicit

Use for a stateful, multi-session learning workspace.

```text
/skill:teach Teach me how this compiler's type inference works using examples from the current repository. Track my progress in this workspace.
```

Expected result: a structured learning path and durable learning records.

### `writing-for-agents` — automatic or explicit

Use when writing material an agent will consume.

```text
/skill:writing-for-agents Rewrite AGENTS.md so always-loaded rules stay small and task-specific detail is progressively disclosed.
```

Expected result: concise behavioral instructions, strong context pointers, and less duplicated prose.

---

## Tools and operational helpers

### `plannotator-annotate` — explicit

Use to review a document, URL, or directory in Plannotator.

```text
/skill:plannotator-annotate docs/specs/new-billing-flow.md
```

Expected result: browser annotation followed by revisions based on your comments.

### `plannotator-last` — explicit

Use to annotate the agent's latest rendered response.

```text
/skill:plannotator-last
```

Expected result: the latest message opens in Plannotator and is revised from your feedback.

### `plannotator-review` — explicit

Use for browser-based review of the current worktree or a pull request.

```text
/skill:plannotator-review
```

Or:

```text
/skill:plannotator-review https://github.com/example/project/pull/142
```

Expected result: visual diff review followed by fixes or a response to findings.

### `herdr` — automatic or explicit

Use from a Herdr-managed pane to control workspaces, panes, tabs, and agents.

```text
/skill:herdr Open a new tab for the API service, split a pane for tests, and launch a coding agent in the implementation pane.
```

Expected result: Herdr CLI operations against the current workspace.

### `wizard` — automatic or explicit

Use when a human must complete browser or credential steps the agent cannot perform.

```text
/skill:wizard Create an interactive setup wizard for a new Stripe test environment. Open the required pages, capture keys safely, update .env, and offer to set GitHub secrets.
```

Expected result: a reviewable Bash wizard. Inspect it before running because it may write environment files or repository secrets.

### `recipe-diagrams` — explicit

Use to convert a recipe into an aligned ASCII process diagram.

```text
/skill:recipe-diagrams Convert this sourdough recipe into a dependency diagram showing parallel preparation, joins, temperatures, and timings.
```

Expected result: validated recipe JSON and an aligned ASCII diagram.

### `workday-training` — explicit

This imported personal skill controls an authenticated browser and SCORM state. Use it only when you are authorized and still satisfy the training's real learning and attestation requirements.

```text
/skill:workday-training Help me navigate my assigned Workday course and track completion while I review the required material.
```

Do not use it to falsify attendance, answers, comprehension, certification, or compliance completion.

## Choosing between overlapping skills

Some preserved local skills overlap with imported ones:

| Situation | Prefer |
| --- | --- |
| Matt's standard repository-aware interview flow | `grill-with-docs` |
| Existing local interview behavior | `grill-me-with-docs` |
| Detailed TypeScript/Effect standards | `coding-standards` |
| Concise local TypeScript standards | `coding-standards-ts` |
| Unsure which Matt workflow fits | `ask-matt` |
| Need only a direct technique | Invoke `tdd`, `diagnosing-bugs`, `research`, etc. directly |

Explicitly name the skill when overlap could make automatic selection ambiguous.
