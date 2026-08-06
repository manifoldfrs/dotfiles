# Global Pi Skills Review v4

## Purpose

Review local, Matt Pocock, and dmmulroy skills side by side before making any changes. Each skill is grouped in one place with its comparisons, complete `SKILL.md` files, support-file inventory, and decision field. No installation or implementation is authorized yet.

## Approved Direction

- Global Pi skills with one tracked source at `stow/agents/.agents/skills/`.
- Expose that source at `~/.agents/skills/`, which Pi discovers natively.
- Pi is the only required harness.
- Keep complete skill folders.
- Do not install Matt's deprecated, in-progress, personal, or miscellaneous groups by default.
- Required updater compares both `mattpocock/skills` and `dmmulroy/.dotfiles` against local skills without a hard-coded skill allowlist.
- Updater reports added, changed, unchanged, and removed skills, generates a Plannotator-ready report, and does not overwrite files during review.

## Recorded Decisions

- `architecture-scan`: keep; rewrite its ranking language more concisely.
- `bro`: keep as is.
- `coding-standards-go`: keep.
- `coding-standards-ts`: revamp into a larger progressive-disclosure skill inspired by dmmulroy's `coding-standards` structure.

## Required Update Script

Create `scripts/update_agent_skills.sh` during implementation:

```bash
./scripts/update_agent_skills.sh
./scripts/update_agent_skills.sh --review
./scripts/update_agent_skills.sh --sync
```

It should fetch temporary snapshots of both upstream repositories, discover their skill directories, compare them with the canonical local tree, print both commit SHAs, and let the user review choices before sync. Accepted changes remain uncommitted for `git diff` review.

## Source Revisions

- Local: `6673a861d1966ec761cc0f5ec1dd33fb86177ac0`
- Matt: `2ab958093e83e0ec752e6c1c5932da465bf23e0c`
- dmmulroy: `c2322c6534f586b146ae0e8d9296019396aa32c0`

## How to Review

Work through the skill sections below. For each skill, choose **keep**, **add**, **adopt**, **merge**, **rewrite**, or **skip**. Same-name versions and exact diffs are directly above their full Markdown, so no cross-document scrolling is needed.

## Skills

## `architecture-scan`

**Decision:** Keep; rewrite ranking language concisely

### Availability

- **Local:** `SKILL.md` SHA-256 `87b624c42e`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: architecture-scan
> description: Evidence-backed architecture scan for refactor candidates. Use when the user asks to review a codebase area, find architecture issues, rank refactors, or identify ownership and seam problems before writing a spec.
> disable-model-invocation: true
> ---
>
> # Architecture Scan
>
> Run an evidence-backed scan of a repository, directory, feature, module, file set, or concern. Return a ranked shortlist of architecture candidates. Do not edit files, refactor, create ADRs, or write a tech spec during the scan.
>
> Use `../coding-standards-go/SKILL.md`, `../coding-standards-ts/SKILL.md`, and `../domain-modeling/SKILL.md` when relevant. Choose the standards file that matches the code under review.
>
> ## 1. Set the scan boundary
>
> Use the scope supplied by the user. If no useful scope is supplied:
>
> 1. Inspect the repository shape and major entrypoints.
> 2. Infer the scope only when one area clearly dominates.
> 3. Otherwise ask one question that lets the user choose the scope.
>
> Record:
>
> - candidate boundary,
> - evidence halo outside the boundary,
> - exclusions,
> - governing docs, standards, `CONTEXT.md`, and ADRs found.
>
> The evidence halo may include callers, dependencies, composition roots, and tests outside the boundary. Use it only to understand evidence. Do not form candidates for it.
>
> ## 2. Build an evidence map
>
> Use reads and searches. Do not run tests, linters, builds, formatters, or static-analysis commands during the scan.
>
> Map the architectural surfaces inside the boundary:
>
> - public entrypoints,
> - runtime entrypoints,
> - domain module clusters,
> - application or service modules,
> - external adapters,
> - persistence boundaries,
> - process or runtime boundaries,
> - side-effect owners,
> - resource-lifetime owners,
> - tests that exercise those seams.
>
> For each surface or group, record:
>
> - representative files,
> - call path,
> - caller-visible outcome,
> - existing test evidence,
> - applicable standards,
> - concrete findings.
>
> Evidence beats vibes. Keep only friction that is repeated, crosses a boundary, leaks into callers, obscures ownership, or blocks testing through a real seam. Drop isolated cleanup.
>
> ## 3. Form candidates
>
> Architecture changes who owns an invariant, policy, translation, orchestration, side effect, resource lifetime, or runtime coordination.
>
> Turn each retained friction into an ownership move:
>
> ```txt
> current owner or callers -> proposed owner
> ```
>
> Do not design the final interface. That belongs in a later tech-spec workflow.
>
> Drop candidates that are:
>
> - aesthetic only,
> - evidence-free,
> - contradicted by sound local precedent,
> - speculative flexibility,
> - isolated cleanup,
> - implementation work disguised as architecture.
>
> Keep at most five candidates, including zero if none clears the evidence bar.
>
> ## 4. Rank candidates
>
> Rank by architectural leverage:
>
> - breadth of caller burden removed,
> - consequence of correctness risk removed,
> - ownership clarity gained,
> - testability gained,
> - runtime or operational risk reduced,
> - cost of new interface or indirection.
>
> When leverage is close, prefer stronger evidence and then the smaller coherent ownership move.
>
> Use recommendation strength consistently:
>
> - `Strong`: friction, ownership move, and leverage are supported by concrete evidence.
> - `Worth exploring`: friction is supported, but the ownership move or leverage depends on a source-unverifiable claim.
>
> Do not use `Worth exploring` to avoid available inspection. Inspect what source can answer first.
>
> ## 5. Present the result
>
> Start with a concise scan summary:
>
> - boundary,
> - evidence halo,
> - covered inventory categories,
> - governing sources,
> - material exclusions.
>
> If no candidate survives, say that and explain why observed signals were pruned.
>
> Otherwise return cards in ranked order:
>
> ```md
> ### <Candidate title> - <Strong | Worth exploring>
>
> - **Standards:** <applicable standards>
> - **Files/modules:** `path:line`, `path:line`
> - **Current friction:** <caller burden, risk, duplication, poor seam, or test friction>
> - **Evidence:** <concrete call path, repetition, leaked representation, invalid state path, or test contortion>
> - **Ownership move:** <current owner or callers> -> <proposed owner>
> - **Expected leverage:** <burden or risk removed relative to new machinery>
> - **Existing test evidence:** <test path:line or none found>
> - **Verification seam:** <public interface or real adapter through which the move would be tested>
> - **Evidence gap:** <only for Worth exploring>
> - **Context/ADR note:** <optional>
> ```
>
> End with:
>
> ```md
> Top recommendation: <candidate title> - <why it has the greatest architectural leverage>
>
> Which candidate would you like to prepare for the tech-spec workflow?
> ```
>
> ## After selection
>
> Only after the user selects a candidate, prepare a brief for `../tech-spec/`:
>
> - candidate title,
> - involved files and modules,
> - problem and current friction,
> - gathered evidence,
> - current-to-proposed ownership move,
> - applicable standards,
> - known constraints and invariants,
> - suspected seams, boundaries, adapters, and call paths,
> - open questions,
> - context or ADR suggestions.
>
> Do not invoke or write the spec unless the user asks.
>
> ## Completion criterion
>
> Every surviving candidate traces to cited evidence or an exact evidence gap. The result contains no more than five candidates and does not include implementation work.

---

## `ask-matt`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `b1a134ada2`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `b1a134ada2`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: ask-matt
> description: Ask which skill or flow fits your situation. A router over the skills in this repo.
> disable-model-invocation: true
> ---
>
> # Ask Matt
>
> You don't remember every skill, so ask.
>
> A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath.
>
> ## The main flow: idea → ship
>
> The route most work travels. You have an idea and want it built.
>
> 1. **`/grill-with-docs`** — sharpen the idea by interview. Start here when you **have a codebase**: it's stateful, retaining what it learns in `CONTEXT.md` and ADRs. (No codebase? Use `/grill-me` — see Standalone. Both run the same `/grilling` primitive; `grill-with-docs` is the one that leaves a paper trail.)
> 2. **Branch — can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions (see Crossing sessions):
>    - **`/handoff`** out, then open a fresh session against that file,
>    - **`/prototype`** to answer the question with throwaway code,
>    - **`/handoff`** back what you learned, and reference it from the original idea thread.
> 3. **Branch — is this a multi-session build?**
>    - **Yes** → **`/to-spec`** (turn the thread into a spec), then **`/to-tickets`** to split it into tracer-bullet tickets, each declaring its **blocking edges**. On a local tracker that's one file per ticket under `.scratch/<feature>/issues/`, worked blockers-first by hand; on a real tracker the edges become native blocking links, so any ticket whose blockers are done can be grabbed — kick off **`/implement`** per ticket, **clearing context between each one**.
>    - **No** → **`/implement`** right here, in the same context window.
>
>    Either way, **`/implement`** builds each issue by driving **`/tdd`** internally — one red-green slice at a time — then closes out by running **`/code-review`**, a two-axis review (Standards + Spec) of the diff, before committing. Reach for **`/tdd`** on its own when you just want to build a concrete behaviour test-first without a full spec, and **`/code-review`** on its own whenever you want to review a branch or PR against a fixed point.
>
> ### Context hygiene
>
> Keep steps 1–3 in **one unbroken context window** — don't compact or clear until after `/to-tickets` — so the grilling, spec, and tickets all build on the same thinking. Each `/implement` then starts fresh, working from the ticket.
>
> The limit on this is the **[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**: the window (~120k tokens on state-of-the-art models) within which the model still reasons sharply. If a session approaches it before `/to-tickets`, don't push on degraded — `/handoff` and continue in a fresh thread.
>
> ## On-ramps
>
> A starting situation that generates work, then merges onto the main flow.
>
> - **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.
>
>   Triage is only for issues **you didn't create** — bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.
>
> - **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on *this* bug — then fixes with a regression test. Its post-mortem hands off to **`/improve-codebase-architecture`** when the real finding is that there's no good seam to lock the bug down.
>
> - **A huge, foggy effort — a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time — producing **decisions, not deliverables** — until the fog is pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't — and it's slower and denser, so save it for exactly that, never a well-scoped feature.
>
>   When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/to-spec`**, which collapses the map's linked decisions into a buildable plan, then `/to-tickets` and `/implement` as usual. Looping the map straight into `/implement` skips that collapse and throws the linked detail away — go straight to `/implement` only when the effort turned out genuinely small.
>
> ## Codebase health
>
> Not feature work — upkeep.
>
> - **`/improve-codebase-architecture`** — run whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `/grill-with-docs`. It's the survey that finds the candidates; **`/codebase-design`** (below) is the bench you design the chosen one on.
>
> ## Vocabulary underneath
>
> Two model-invoked references that run *beneath* the other skills — each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.
>
> - **`/domain-modeling`** — sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word ("account" doing three jobs), record a hard-to-reverse decision as an ADR. It's the active discipline `/grill-with-docs` drives to keep `CONTEXT.md` a clean glossary.
> - **`/codebase-design`** — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `/tdd` and `/improve-codebase-architecture` both speak it.
>
> ## Crossing sessions
>
> - **`/handoff`** — when a thread is full or you need to branch off (e.g. into a `/prototype` session), this compacts the conversation into a markdown file. You don't continue in place — you **open a new session and reference that file** to carry the context across. It's the bridge between context windows, in either direction. Use it when you want a **fresh session** but need the **current conversation preserved**.
> - **`/compact`** (built-in) — stay in the **same conversation**, letting the earlier turns be summarized. Use it at **intentional breaks between phases**, when you don't mind losing the verbatim history. Don't compact mid-phase — the agent can lose its way. `/handoff` forks; `/compact` continues.
>
> ## Standalone
>
> Off the main flow entirely.
>
> - **`/grill-me`** — the same relentless interview as `/grill-with-docs`, but for when you have **no codebase**. Stateless: it saves nothing locally, builds no `CONTEXT.md`. Reach for it to sharpen any plan or design that doesn't live in a repo.
> - **`/prototype`** — a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway from day one — keep the answer, delete the code. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
> - **`/research`** — delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at `/grill-with-docs` — research feeds the thinking, it doesn't replace it.
> - **`/teach`** — learn a concept over multiple sessions, using the current directory as a stateful workspace.
> - **`/writing-great-skills`** — reference for writing and editing skills well.
>
> ## Precondition
>
> **`/setup-matt-pocock-skills`** — run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.

#### dmmulroy `SKILL.md`

> ---
> name: ask-matt
> description: Ask which skill or flow fits your situation. A router over the skills in this repo.
> disable-model-invocation: true
> ---
>
> # Ask Matt
>
> You don't remember every skill, so ask.
>
> A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath.
>
> ## The main flow: idea → ship
>
> The route most work travels. You have an idea and want it built.
>
> 1. **`/grill-with-docs`** — sharpen the idea by interview. Start here when you **have a codebase**: it's stateful, retaining what it learns in `CONTEXT.md` and ADRs. (No codebase? Use `/grill-me` — see Standalone. Both run the same `/grilling` primitive; `grill-with-docs` is the one that leaves a paper trail.)
> 2. **Branch — can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions (see Crossing sessions):
>    - **`/handoff`** out, then open a fresh session against that file,
>    - **`/prototype`** to answer the question with throwaway code,
>    - **`/handoff`** back what you learned, and reference it from the original idea thread.
> 3. **Branch — is this a multi-session build?**
>    - **Yes** → **`/to-spec`** (turn the thread into a spec), then **`/to-tickets`** to split it into tracer-bullet tickets, each declaring its **blocking edges**. On a local tracker that's one file per ticket under `.scratch/<feature>/issues/`, worked blockers-first by hand; on a real tracker the edges become native blocking links, so any ticket whose blockers are done can be grabbed — kick off **`/implement`** per ticket, **clearing context between each one**.
>    - **No** → **`/implement`** right here, in the same context window.
>
>    Either way, **`/implement`** builds each issue by driving **`/tdd`** internally — one red-green slice at a time — then closes out by running **`/code-review`**, a two-axis review (Standards + Spec) of the diff, before committing. Reach for **`/tdd`** on its own when you just want to build a concrete behaviour test-first without a full spec, and **`/code-review`** on its own whenever you want to review a branch or PR against a fixed point.
>
> ### Context hygiene
>
> Keep steps 1–3 in **one unbroken context window** — don't compact or clear until after `/to-tickets` — so the grilling, spec, and tickets all build on the same thinking. Each `/implement` then starts fresh, working from the ticket.
>
> The limit on this is the **[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**: the window (~120k tokens on state-of-the-art models) within which the model still reasons sharply. If a session approaches it before `/to-tickets`, don't push on degraded — `/handoff` and continue in a fresh thread.
>
> ## On-ramps
>
> A starting situation that generates work, then merges onto the main flow.
>
> - **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.
>
>   Triage is only for issues **you didn't create** — bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.
>
> - **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on *this* bug — then fixes with a regression test. Its post-mortem hands off to **`/improve-codebase-architecture`** when the real finding is that there's no good seam to lock the bug down.
>
> - **A huge, foggy effort — a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time — producing **decisions, not deliverables** — until the fog is pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't — and it's slower and denser, so save it for exactly that, never a well-scoped feature.
>
>   When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/to-spec`**, which collapses the map's linked decisions into a buildable plan, then `/to-tickets` and `/implement` as usual. Looping the map straight into `/implement` skips that collapse and throws the linked detail away — go straight to `/implement` only when the effort turned out genuinely small.
>
> ## Codebase health
>
> Not feature work — upkeep.
>
> - **`/improve-codebase-architecture`** — run whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `/grill-with-docs`. It's the survey that finds the candidates; **`/codebase-design`** (below) is the bench you design the chosen one on.
>
> ## Vocabulary underneath
>
> Two model-invoked references that run *beneath* the other skills — each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.
>
> - **`/domain-modeling`** — sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word ("account" doing three jobs), record a hard-to-reverse decision as an ADR. It's the active discipline `/grill-with-docs` drives to keep `CONTEXT.md` a clean glossary.
> - **`/codebase-design`** — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `/tdd` and `/improve-codebase-architecture` both speak it.
>
> ## Crossing sessions
>
> - **`/handoff`** — when a thread is full or you need to branch off (e.g. into a `/prototype` session), this compacts the conversation into a markdown file. You don't continue in place — you **open a new session and reference that file** to carry the context across. It's the bridge between context windows, in either direction. Use it when you want a **fresh session** but need the **current conversation preserved**.
> - **`/compact`** (built-in) — stay in the **same conversation**, letting the earlier turns be summarized. Use it at **intentional breaks between phases**, when you don't mind losing the verbatim history. Don't compact mid-phase — the agent can lose its way. `/handoff` forks; `/compact` continues.
>
> ## Standalone
>
> Off the main flow entirely.
>
> - **`/grill-me`** — the same relentless interview as `/grill-with-docs`, but for when you have **no codebase**. Stateless: it saves nothing locally, builds no `CONTEXT.md`. Reach for it to sharpen any plan or design that doesn't live in a repo.
> - **`/prototype`** — a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway from day one — keep the answer, delete the code. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
> - **`/research`** — delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at `/grill-with-docs` — research feeds the thinking, it doesn't replace it.
> - **`/teach`** — learn a concept over multiple sessions, using the current directory as a stateful workspace.
> - **`/writing-great-skills`** — reference for writing and editing skills well.
>
> ## Precondition
>
> **`/setup-matt-pocock-skills`** — run before your first engineering flow to configure the issue tracker, triage labels, and doc layout the other skills assume. Custom issue trackers also work.

---

## `bootstrap-prelude`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `9822c6ec94`; support: `prelude.ts`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: bootstrap-prelude
> description: Prelude bootstrapping for TypeScript. Use when creating or rebuilding a prelude.ts from ambient generic helpers and types.
> disable-model-invocation: true
> ---
>
> # Bootstrap a TypeScript Prelude
>
> A prelude is an explicitly imported module for **ambient** helpers and types: ubiquitous, domain-neutral building blocks that have no more precise owner. Use the bundled [`prelude.ts`](prelude.ts) as the foundation, then adapt it to evidence from the target repository. Apply [`../coding-standards/SKILL.md`](../coding-standards/SKILL.md) throughout.
>
> Ambient describes a helper's role, not a TypeScript global. Keep prelude exports behind ordinary imports; do not add global declarations or global augmentation.
>
> ## 1. Map the repository
>
> Read repository instructions, package manifests, TypeScript configuration, source layout, and import conventions. Locate:
>
> - an existing prelude or equivalent shared module;
> - files named `utils`, `helpers`, `common`, `types`, `result`, `errors`, or similar;
> - generic type aliases and tiny generic functions repeated across modules;
> - established libraries for results, schemas, redaction, branding, collections, and exhaustive matching;
> - every caller of plausible ambient helpers.
>
> Search by both filenames and concepts. Use the ubiquitous generic helper/type categories in the coding standards as seed search terms, then inspect definitions and callers rather than classifying from names alone.
>
> **Completion criterion:** Every plausible ambient definition found by repository-wide filename, symbol, and duplication scans is inventoried with its owner, callers, dependencies, and current behavior.
>
> ## 2. Classify every candidate
>
> A symbol belongs in the prelude when all of these hold:
>
> - it is domain-neutral and useful across unrelated modules;
> - no domain, application service, adapter, protocol, or focused generic module is a more precise owner;
> - centralizing it reduces duplication or gives a ubiquitous concept one canonical implementation;
> - its dependencies are minimal, stable, and already justified by the project;
> - its behavior is small enough to understand at the import site or hidden behind a precise type.
>
> Keep a symbol with its focused owner when it encodes domain meaning, application policy, boundary translation, framework behavior, I/O, or a cohesive generic concept such as string casing or non-trivial collection operations. Prefer an established library over a local duplicate. A prelude is a curated foundation, not a barrel or miscellaneous dumping ground.
>
> Record one decision for every candidate: use the established library, keep the current owner, move into the prelude, merge with a template symbol, or delete as an unused duplicate.
>
> **Completion criterion:** Every inventoried candidate has one decision grounded in its semantics and callers; no candidate remains classified only by its filename or name.
>
> ## 3. Seed from the template
>
> Read the bundled [`prelude.ts`](prelude.ts) completely. Copy it to the project's established shared-module location as the starting point. If a prelude already exists, merge deliberately instead of overwriting it.
>
> Choose exactly one expected-failure foundation:
>
> 1. When the project uses Effect, use Effect's result/error facilities and remove the template's local `Result` fallback.
> 2. When the project uses `better-result`, use it and remove the local fallback.
> 3. When the project uses neither, ask whether to install `better-result`.
>    - If accepted, install it and remove the local fallback.
>    - If declined, enable the template's local `Result` types and helpers.
>
> Retain each other template export only when repository usage, the coding standards, or the requested foundation justifies it. Preserve compatible existing behavior when merging equivalent helpers; surface semantic conflicts rather than silently choosing one implementation.
>
> **Completion criterion:** The target file is founded on the template, has exactly one result strategy, and every retained template export has an explicit justification.
>
> ## 4. Consolidate ambient helpers and types
>
> Move or merge the approved repository candidates into the prelude. For each moved symbol:
>
> - preserve behavior unless a behavior change was requested;
> - preserve or deliberately migrate its public name and type contract;
> - update every caller to import from the prelude directly;
> - retain required JSDoc, safety comments, and targeted lint suppressions;
> - remove superseded definitions and compatibility re-exports after their callers move.
>
> Keep the resulting module side-effect free. It must not read configuration, acquire resources, register handlers, perform I/O, contain domain/application policy, or re-export unrelated modules.
>
> **Completion criterion:** Every approved candidate has one canonical definition, every caller uses it, and no removed source remains as a second source of truth.
>
> ## 5. Verify the foundation
>
> Run the repository's formatter, type checker, linter, and focused tests. Search again for the old symbols, duplicate definitions, stale import paths, and broad utility files that were part of the inventory. Review every prelude export for current usage or an explicit foundational reason.
>
> Report:
>
> - the chosen result strategy;
> - template exports retained or removed;
> - repository helpers moved, merged, left in place, or deleted;
> - verification commands and outcomes.
>
> **Completion criterion:** Repository checks pass, every inventory decision is reflected in code, duplicate ambient definitions are gone, and every prelude export is justified.

---

## `bro`

**Decision:** Keep as is

### Availability

- **Local:** `SKILL.md` SHA-256 `aa329d0cee`; support: none
- **dmmulroy:** `SKILL.md` SHA-256 `aa329d0cee`; support: none

### Exact comparison

#### Local vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Local: none.
- Only in dmmulroy: none.
- Matching support files: none.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: bro
> description: Restate the last message in plain human language, with no jargon.
> disable-model-invocation: true
> ---
>
> Restate your last message. Stop using jargon and speak coherently. State it more simply and concisely, like one human talking to another.

#### dmmulroy `SKILL.md`

> ---
> name: bro
> description: Restate the last message in plain human language, with no jargon.
> disable-model-invocation: true
> ---
>
> Restate your last message. Stop using jargon and speak coherently. State it more simply and concisely, like one human talking to another.

---

## `cloudflare-composition-root`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `655b1c051d`; support: `EXAMPLES.md`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: cloudflare-composition-root
> description: Composition roots for Hono and Cloudflare. Use when adding a binding-backed service or refactoring raw runtime dependencies out of inner code.
> ---
>
> # Cloudflare Composition Root
>
> Use a **composition root**: each runtime entrypoint turns raw Cloudflare capabilities into application-owned dependencies, assembles services, and invokes them. Inner code receives ports, never `Env`, raw bindings, framework service locators, or binding names.
>
> ```text
> Cloudflare entrypoint
>   → tracer + parsed configuration
>   → binding adapters
>   → exact service dependencies
>   → application service
>   → protocol projection
> ```
>
> Apply `../coding-standards/SKILL.md` for TypeScript contracts, parsing, errors, side effects, and tests. When implementation shape is unclear, consult [EXAMPLES.md](EXAMPLES.md) for Hono, WorkerEntrypoint, adapter, and refactor templates.
>
> ## Ownership
>
> - **Entrypoint adapter:** parses the external request/event, establishes invocation context, constructs dependencies, invokes a service, and projects its result.
> - **Binding adapter:** implements an application-owned port using KV, R2, D1, Durable Objects, Queues, service bindings, Workflows, or another external capability.
> - **Application service:** owns one use case's sequencing, fallback, retry, and best-effort policy.
> - **Domain module:** owns pure values and invariants.
> - **Port:** names exactly the capability a consumer needs; it does not mirror a Cloudflare API.
>
> Raw platform values may exist only in composition roots and binding adapters. A binding adapter accepts the smallest platform capability, not all of `Env`.
>
> ## 1. Map the boundary
>
> Inspect repository instructions and the affected:
>
> - Hono app factories, middleware order, route registration, and context types;
> - Worker, WorkerEntrypoint, Durable Object, Workflow, queue, and scheduled entrypoints;
> - `Env` declarations and every use of the relevant binding;
> - tracer creation, correlation, error reporting, and detached-work ownership;
> - existing services, adapters, ports, tests, and architecture checks.
>
> Trace each affected behavior from entrypoint to side effect and caller-visible result. For refactors, record current error, retry, fallback, serialization, and tracing behavior before moving it.
>
> **Completion criterion:** Every affected entrypoint, binding consumer, behavior, lifecycle, side effect, failure policy, and existing test seam is accounted for.
>
> ## 2. Design application-owned dependencies
>
> Define contracts from consumer needs:
>
> ```ts
> /** Persistence capability required by document application services. */
> export interface DocumentStore {
>   /** Find one document by its domain ID. */
>   find(id: DocumentId): Promise<Document | null>;
>   /** Persist one valid document. */
>   save(document: Document): Promise<void>;
> }
>
> /** Exact dependencies of the publish-document use case. */
> export type PublishDocumentDependencies = Readonly<{
>   documents: DocumentStore;
>   clock: Clock;
>   tracer: Tracer;
> }>;
> ```
>
> Rules:
>
> - Use domain inputs and parsed outputs, not raw keys, strings, request objects, or binding options.
> - Expose only operations required by real callers.
> - Keep each service's dependency object exact; never create a shared mega-bag or rename `Env` to `Dependencies`.
> - Put platform serialization, keyspaces, pagination tokens, TTLs, metadata, and output parsing in the binding adapter.
> - Let the application service own policy. The adapter translates failures precisely enough for the service to distinguish recoverable conditions from corruption and defects.
> - Inject `Tracer` into services and adapters that create spans; do not add it to every method signature.
> - Add an application-owned factory only when scope is genuinely dynamic after composition, such as account-bound construction after authentication. The factory must not expose `Env` or raw bindings.
>
> Choose lifetimes explicitly:
>
> - Reuse immutable adapters and services when their bindings and tracer are safe across concurrent invocations.
> - Construct per invocation when they retain request-scoped runtime objects or mutable invocation state.
> - Hand detached work to an explicit owner such as a narrow background-task port; do not leak `ExecutionContext` inward.
>
> **Completion criterion:** Every inner signature uses application/domain types; each operation and factory has a current caller; and dependency, tracer, and side-effect lifetimes have explicit owners.
>
> ## 3. Build or refactor
>
> ### New service branch
>
> 1. Implement the application service against its ports without importing Hono or Cloudflare runtime types.
> 2. Implement one binding adapter per external role. Give technology-specific implementations explicit names, such as `WorkersKvDocumentStore`.
> 3. Keep protocol concerns in the HTTP, RPC, queue, Workflow, or scheduled adapter.
> 4. Compose the service at every entrypoint that serves the use case.
>
> ### Existing code branch
>
> 1. Preserve caller-visible behavior with tests at the current public seam where evidence is missing.
> 2. Define the port at the direct consumer from the operations it already uses.
> 3. Put the existing raw binding behind an adapter before changing policy.
> 4. Replace the direct consumer's raw dependency with the port.
> 5. Move adapter construction outward one layer at a time. Intermediate layers may pass the typed port, never both the port and raw binding as a permanent design.
> 6. Split mixed modules: policy moves to the application service; platform mechanics move to the adapter; protocol mapping stays at the entrypoint.
> 7. Remove obsolete `Env` parameters, factories, generic wrappers, duplicated parsers/key builders, and compatibility overloads after their final callers move.
>
> Do not broaden the refactor to unrelated bindings merely for symmetry.
>
> **Completion criterion:** New code is fully composed on every serving surface, or every migrated raw binding reaches only its adapter; behavior and policy changes are either absent or explicitly requested and tested.
>
> ## 4. Compose every runtime surface
>
> At each composition root, in order:
>
> 1. Parse configuration and entrypoint props.
> 2. Create or obtain the tracer.
> 3. Establish correlation before invoking traced work.
> 4. Wrap raw bindings in adapters, injecting the tracer where needed.
> 5. Assemble exact service dependencies.
> 6. Invoke the service through a thin protocol adapter.
> 7. Map results and safe errors to the external contract.
>
> For Hono:
>
> - Prefer `createApp(dependencies)` and route/middleware factories that close over exact dependencies.
> - Inject the tracer used by root tracing middleware instead of creating unrelated tracers deeper in the app.
> - If dependencies are invocation-scoped, have the entrypoint supply a narrow request-composition function that closes over raw bindings; invoke it from the earliest owning middleware after correlation is established.
> - Store only exact typed capabilities in Hono variables. Neither composition middleware nor route modules reach through `context.env` for raw bindings.
>
> For WorkerEntrypoint, Durable Objects, Workflows, queues, and scheduled handlers, treat each runtime constructor or handler as its own composition root. Do not assume one surface's dependency graph or lifecycle fits another.
>
> **Completion criterion:** Every serving surface establishes tracing and constructs the complete dependency graph; no inner module acquires runtime resources or reads a binding name.
>
> ## 5. Verify the seam
>
> Verify through production seams:
>
> - application-service behavior with small recording fakes implementing real ports;
> - binding-adapter serialization, parsing, and failures against the representative local Cloudflare runtime;
> - entrypoint composition and external result/error projection;
> - span names, correlation, safe attributes, and detached-work ownership;
> - type checking, focused tests, architecture checks, and repository-required validation.
>
> Search for leakage using the project's binding names and runtime types, for example:
>
> ```bash
> rg 'Env|KVNamespace|R2Bucket|D1Database|DurableObjectNamespace|ExecutionContext' src
> ```
>
> Classify every match: composition root, binding adapter, unavoidable framework declaration, or violation. Also search for direct `context.env` and binding-name access in route, service, domain, and capability modules.
>
> **Completion criterion:** Every raw platform reference is classified and permitted; every changed port, adapter, service, entrypoint, failure path, and lifecycle has evidence; and no application module imports or receives Cloudflare runtime types.

---

## `code-review`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `6a65cc6111`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `6a65cc6111`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: code-review
> description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/PRD asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
> ---
>
> Two-axis review of the diff between `HEAD` and a fixed point the user supplies:
>
> - **Standards** — does the code conform to this repo's documented coding standards?
> - **Spec** — does the code faithfully implement the originating issue / PRD / spec?
>
> Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.
>
> The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if `docs/agents/issue-tracker.md` is missing.
>
> ## Process
>
> ### 1. Pin the fixed point
>
> Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.
>
> Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.
>
> Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.
>
> ### 2. Identify the spec source
>
> Look for the originating spec, in this order:
>
> 1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
> 2. A path the user passed as an argument.
> 3. A PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
> 4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".
>
> ### 3. Identify the standards sources
>
> Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.
>
> On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:
>
> - **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
> - **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.
>
> Each smell reads *what it is* → *how to fix*; match it against the diff:
>
> - **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
> - **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
> - **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
> - **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
> - **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
> - **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
> - **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
> - **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
> - **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
> - **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
> - **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
> - **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.
>
> ### 4. Spawn both sub-agents in parallel
>
> Send a single message with two `Agent` tool calls. Use the `general-purpose` subagent for both.
>
> **Standards sub-agent prompt** — include:
>
> - The full diff command and commit list.
> - The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
> - The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."
>
> **Spec sub-agent prompt** — include:
>
> - The diff command and commit list.
> - The path or fetched contents of the spec.
> - The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."
>
> If the spec is missing, skip the Spec sub-agent and note this in the final report.
>
> ### 5. Aggregate
>
> Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).
>
> End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.
>
> ## Why two axes
>
> A change can pass one axis and fail the other:
>
> - Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
> - Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
>
> Reporting them separately stops one axis from masking the other.

#### dmmulroy `SKILL.md`

> ---
> name: code-review
> description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/PRD asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
> ---
>
> Two-axis review of the diff between `HEAD` and a fixed point the user supplies:
>
> - **Standards** — does the code conform to this repo's documented coding standards?
> - **Spec** — does the code faithfully implement the originating issue / PRD / spec?
>
> Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.
>
> The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if `docs/agents/issue-tracker.md` is missing.
>
> ## Process
>
> ### 1. Pin the fixed point
>
> Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.
>
> Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.
>
> Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.
>
> ### 2. Identify the spec source
>
> Look for the originating spec, in this order:
>
> 1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
> 2. A path the user passed as an argument.
> 3. A PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
> 4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".
>
> ### 3. Identify the standards sources
>
> Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.
>
> On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:
>
> - **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
> - **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.
>
> Each smell reads *what it is* → *how to fix*; match it against the diff:
>
> - **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
> - **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
> - **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
> - **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
> - **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
> - **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
> - **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
> - **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
> - **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
> - **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
> - **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
> - **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.
>
> ### 4. Spawn both sub-agents in parallel
>
> Send a single message with two `Agent` tool calls. Use the `general-purpose` subagent for both.
>
> **Standards sub-agent prompt** — include:
>
> - The full diff command and commit list.
> - The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
> - The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."
>
> **Spec sub-agent prompt** — include:
>
> - The diff command and commit list.
> - The path or fetched contents of the spec.
> - The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."
>
> If the spec is missing, skip the Spec sub-agent and note this in the final report.
>
> ### 5. Aggregate
>
> Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).
>
> End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.
>
> ## Why two axes
>
> A change can pass one axis and fail the other:
>
> - Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
> - Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
>
> Reporting them separately stops one axis from masking the other.

---

## `codebase-design`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `a8d50abac5`; support: `DEEPENING.md`, `DESIGN-IT-TWICE.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `a8d50abac5`; support: `DEEPENING.md`, `DESIGN-IT-TWICE.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `DEEPENING.md`, `DESIGN-IT-TWICE.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: codebase-design
> description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
> ---
>
> # Codebase Design
>
> Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Use this language and these principles wherever code is being designed or restructured. The aim is leverage for callers, locality for maintainers, and testability for everyone.
>
> ## Glossary
>
> Use these terms exactly — don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point.
>
> **Module** — anything with an interface and an implementation. Deliberately scale-agnostic: a function, class, package, or tier-spanning slice. _Avoid_: unit, component, service.
>
> **Interface** — everything a caller must know to use the module correctly: the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics. _Avoid_: API, signature (too narrow — they refer only to the type-level surface).
>
> **Implementation** — what's inside a module, its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.
>
> **Depth** — leverage at the interface: the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.
>
> **Seam** _(Michael Feathers)_ — a place where you can alter behaviour without editing in that place; the *location* at which a module's interface lives. Where to put the seam is its own design decision, distinct from what goes behind it. _Avoid_: boundary (overloaded with DDD's bounded context).
>
> **Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).
>
> **Leverage** — what callers get from depth: more capability per unit of interface they learn. One implementation pays back across N call sites and M tests.
>
> **Locality** — what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.
>
> ## Deep vs shallow
>
> **Deep module** = small interface + lots of implementation:
>
> ```
> ┌─────────────────────┐
> │   Small Interface   │  ← Few methods, simple params
> ├─────────────────────┤
> │                     │
> │  Deep Implementation│  ← Complex logic hidden
> │                     │
> └─────────────────────┘
> ```
>
> **Shallow module** = large interface + little implementation (avoid):
>
> ```
> ┌─────────────────────────────────┐
> │       Large Interface           │  ← Many methods, complex params
> ├─────────────────────────────────┤
> │  Thin Implementation            │  ← Just passes through
> └─────────────────────────────────┘
> ```
>
> When designing an interface, ask:
>
> - Can I reduce the number of methods?
> - Can I simplify the parameters?
> - Can I hide more complexity inside?
>
> ## Principles
>
> - **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts — they just aren't part of the interface. A module can have **internal seams** (private to its implementation, used by its own tests) as well as the **external seam** at its interface.
> - **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
> - **The interface is the test surface.** Callers and tests cross the same seam. If you want to test *past* the interface, the module is probably the wrong shape.
> - **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.
>
> ## Designing for testability
>
> Good interfaces make testing natural:
>
> 1. **Accept dependencies, don't create them.**
>
>    ```typescript
>    // Testable
>    function processOrder(order, paymentGateway) {}
>
>    // Hard to test
>    function processOrder(order) {
>      const gateway = new StripeGateway();
>    }
>    ```
>
> 2. **Return results, don't produce side effects.**
>
>    ```typescript
>    // Testable
>    function calculateDiscount(cart): Discount {}
>
>    // Hard to test
>    function applyDiscount(cart): void {
>      cart.total -= discount;
>    }
>    ```
>
> 3. **Small surface area.** Fewer methods = fewer tests needed. Fewer params = simpler test setup.
>
> ## Relationships
>
> - A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
> - **Depth** is a property of a **Module**, measured against its **Interface**.
> - A **Seam** is where a **Module**'s **Interface** lives.
> - An **Adapter** sits at a **Seam** and satisfies the **Interface**.
> - **Depth** produces **Leverage** for callers and **Locality** for maintainers.
>
> ## Rejected framings
>
> - **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
> - **"Interface" as the TypeScript `interface` keyword or a class's public methods**: too narrow — interface here includes every fact a caller must know.
> - **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.
>
> ## Going deeper
>
> - **Deepening a cluster given its dependencies** — see [DEEPENING.md](DEEPENING.md): dependency categories, seam discipline, and replace-don't-layer testing.
> - **Exploring alternative interfaces** — see [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): spin up parallel sub-agents to design the interface several radically different ways, then compare on depth, locality, and seam placement.

#### dmmulroy `SKILL.md`

> ---
> name: codebase-design
> description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
> ---
>
> # Codebase Design
>
> Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Use this language and these principles wherever code is being designed or restructured. The aim is leverage for callers, locality for maintainers, and testability for everyone.
>
> ## Glossary
>
> Use these terms exactly — don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point.
>
> **Module** — anything with an interface and an implementation. Deliberately scale-agnostic: a function, class, package, or tier-spanning slice. _Avoid_: unit, component, service.
>
> **Interface** — everything a caller must know to use the module correctly: the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics. _Avoid_: API, signature (too narrow — they refer only to the type-level surface).
>
> **Implementation** — what's inside a module, its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.
>
> **Depth** — leverage at the interface: the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.
>
> **Seam** _(Michael Feathers)_ — a place where you can alter behaviour without editing in that place; the *location* at which a module's interface lives. Where to put the seam is its own design decision, distinct from what goes behind it. _Avoid_: boundary (overloaded with DDD's bounded context).
>
> **Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).
>
> **Leverage** — what callers get from depth: more capability per unit of interface they learn. One implementation pays back across N call sites and M tests.
>
> **Locality** — what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.
>
> ## Deep vs shallow
>
> **Deep module** = small interface + lots of implementation:
>
> ```
> ┌─────────────────────┐
> │   Small Interface   │  ← Few methods, simple params
> ├─────────────────────┤
> │                     │
> │  Deep Implementation│  ← Complex logic hidden
> │                     │
> └─────────────────────┘
> ```
>
> **Shallow module** = large interface + little implementation (avoid):
>
> ```
> ┌─────────────────────────────────┐
> │       Large Interface           │  ← Many methods, complex params
> ├─────────────────────────────────┤
> │  Thin Implementation            │  ← Just passes through
> └─────────────────────────────────┘
> ```
>
> When designing an interface, ask:
>
> - Can I reduce the number of methods?
> - Can I simplify the parameters?
> - Can I hide more complexity inside?
>
> ## Principles
>
> - **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts — they just aren't part of the interface. A module can have **internal seams** (private to its implementation, used by its own tests) as well as the **external seam** at its interface.
> - **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
> - **The interface is the test surface.** Callers and tests cross the same seam. If you want to test *past* the interface, the module is probably the wrong shape.
> - **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.
>
> ## Designing for testability
>
> Good interfaces make testing natural:
>
> 1. **Accept dependencies, don't create them.**
>
>    ```typescript
>    // Testable
>    function processOrder(order, paymentGateway) {}
>
>    // Hard to test
>    function processOrder(order) {
>      const gateway = new StripeGateway();
>    }
>    ```
>
> 2. **Return results, don't produce side effects.**
>
>    ```typescript
>    // Testable
>    function calculateDiscount(cart): Discount {}
>
>    // Hard to test
>    function applyDiscount(cart): void {
>      cart.total -= discount;
>    }
>    ```
>
> 3. **Small surface area.** Fewer methods = fewer tests needed. Fewer params = simpler test setup.
>
> ## Relationships
>
> - A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
> - **Depth** is a property of a **Module**, measured against its **Interface**.
> - A **Seam** is where a **Module**'s **Interface** lives.
> - An **Adapter** sits at a **Seam** and satisfies the **Interface**.
> - **Depth** produces **Leverage** for callers and **Locality** for maintainers.
>
> ## Rejected framings
>
> - **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
> - **"Interface" as the TypeScript `interface` keyword or a class's public methods**: too narrow — interface here includes every fact a caller must know.
> - **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.
>
> ## Going deeper
>
> - **Deepening a cluster given its dependencies** — see [DEEPENING.md](DEEPENING.md): dependency categories, seam discipline, and replace-don't-layer testing.
> - **Exploring alternative interfaces** — see [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): spin up parallel sub-agents to design the interface several radically different ways, then compare on depth, locality, and seam placement.

---

## `coding-standards`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `3b589d29f9`; support: `references/comments-and-jsdoc.md`, `references/configuration-and-resources.md`, `references/domain-types-and-state.md`, `references/effect-caching.md`, `references/effect-configuration.md`, `references/effect-http-clients.md`, `references/effect-scheduling-and-retry.md`, `references/effect-schema-and-data.md`, `references/effect-services.md`, `references/effect-streams.md`, `references/effect-testing.md`, `references/effect.md`, `references/errors.md`, `references/imports-exports-and-files.md`, `references/modules-services-and-adapters.md`, `references/parsing-and-schemas.md`, `references/persistence.md`, `references/sensitive-data-and-observability.md`, `references/testing.md`, `references/typescript-safety.md`, `references/workflows-transactions-and-idempotency.md`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: coding-standards
> description: Correct-by-construction TypeScript and Effect standards. Use for TypeScript engineering, Effect code, or when another skill needs the user's coding standards.
> ---
>
> # TypeScript and Effect Coding Standards
>
> Build **correct by construction**: parse data into meaningful types, make expected failures explicit, keep effects behind cohesive services, and test through real interfaces.
>
> ## Decision priority
>
> When rules pull in different directions:
>
> 1. Preserve correctness, safety, and debuggability.
> 2. Apply these standards to new code and the complete behavior being changed.
> 3. Follow compatible repository architecture and conventions.
> 4. Contain incompatible older patterns at the nearest existing edge.
> 5. Keep unrelated behavior unchanged unless a broader migration was requested.
> 6. Record meaningful trade-offs with comments or ADRs.
>
> ## Core principles
>
> - Expected failures are values; defects may throw or panic.
> - Parse external and serialized data into domain/application types at the edge.
> - Make illegal states unrepresentable where practical.
> - Start meaningful services from explicit interfaces.
> - Prefer composition, a functional core, and an imperative shell.
> - Design deep, cohesive modules with low caller burden.
> - Make every abstraction pass the deletion test.
> - Test behavior through real interfaces using real or faithful implementations rather than module mocks.
> - Prefer the simplest correct design and the least code.
>
> ## 1. Establish the local rules
>
> Read the nearest `AGENTS.md`, package configuration, architecture docs, and the changed area's conventions for errors, schemas, services, tests, observability, and files.
>
> Apply the decision priority above when local conventions conflict with these standards.
>
> **Complete when:** the governing files and runtime/library versions have been identified, and every compatible or incompatible local pattern touching the changed behavior is accounted for.
>
> ## 2. Trace the behavior and load applicable references
>
> Trace each caller-visible operation from input through every decision and effect to its observable result. Classify each changed concern as domain behavior, application policy, technology/framework mechanics, or composition/resource wiring.
>
> Read every applicable reference completely before designing the change:
>
> - [`references/effect.md`](references/effect.md) — whenever Effect code changes; follow its branch pointers before editing.
> - [`references/errors.md`](references/errors.md) — when behavior can fail or absence may be ordinary.
> - [`references/sensitive-data-and-observability.md`](references/sensitive-data-and-observability.md) — when behavior handles secrets, personal data, logging, tracing, metrics, or error reporting.
> - [`references/parsing-and-schemas.md`](references/parsing-and-schemas.md) — when data crosses an external/serialized edge, a schema changes, or protocol/persistence representations are designed.
> - [`references/domain-types-and-state.md`](references/domain-types-and-state.md) — when IDs, units, constrained values, optional inputs, entities, lifecycle states, or operation options change.
> - [`references/modules-services-and-adapters.md`](references/modules-services-and-adapters.md) — when behavior owns domain rules, coordinates effects, uses dependencies, crosses technology boundaries, or changes module/service design.
> - [`references/persistence.md`](references/persistence.md) — when behavior reads or writes a database, cache, durable object, ORM model, transaction, or persisted record.
> - [`references/workflows-transactions-and-idempotency.md`](references/workflows-transactions-and-idempotency.md) — when work spans boundaries, retries, resumes, receives redelivery, delays, compensates, or may execute more than once.
> - [`references/configuration-and-resources.md`](references/configuration-and-resources.md) — when behavior reads configuration, creates/closes resources, performs startup work, uses time/randomness, or touches global state.
> - [`references/testing.md`](references/testing.md) — whenever behavior, public inference, tests, or test implementations change.
> - [`references/typescript-safety.md`](references/typescript-safety.md) — when types, signatures, mutable values, casts, non-null assumptions, or compiler settings change.
> - [`references/imports-exports-and-files.md`](references/imports-exports-and-files.md) — when imports, exports, entrypoints, helper placement, or file organization change.
> - [`references/comments-and-jsdoc.md`](references/comments-and-jsdoc.md) — when exported symbols, comments, JSDoc, user-facing text, or rendered errors change.
>
> **Complete when:** every changed input, output, failure, dependency, effect, state transition, external representation, and test surface maps to an owning module and an applicable reference.
>
> ## 3. Design from the public types inward
>
> Define or confirm the caller-facing input, output, expected errors, and service interfaces before implementing them. Parse less-trusted data before it reaches inner code. Keep domain calculations pure. Put application policy and effect order in the owning service. Keep framework/provider types private to their owner.
>
> Check existing modules, services, clients, Adapters, schemas, errors, and helpers before adding one. Apply the deletion test: an abstraction earns its place when removing it would spread meaningful complexity into callers. For each new abstraction, record the existing owner or direct implementation considered and why it does not fit.
>
> **Complete when:** caller-facing inputs, outputs, expected errors, and service interfaces are explicit; every changed dependency and effect has one owner; each new abstraction has deletion-test evidence for the final report; and framework/provider types remain private to their owner.
>
> ## 4. Implement the complete changed behavior
>
> Implement every path required by the caller-visible operation, including expected failures, external translations, diagnostics, and resource behavior. Keep unrelated old behavior unchanged. Preserve existing compatible telemetry and error-reporting hooks.
>
> **Complete when:** every traced path is implemented through its owning interface; expected failures use explicit error values; external data reaches inner code as parsed types; and public application/domain contracts expose application/domain types.
>
> ## 5. Verify through public interfaces
>
> Add or update the tests required by [`references/testing.md`](references/testing.md). Run the repository's required verification commands, adding individual typecheck, test, build, or lint commands only when they are not already covered. Re-read each applicable reference and check every changed symbol against it. Fix each exception or report it with concrete evidence.
>
> **Complete when:** every required check passes or has a reported failure with concrete evidence; every applicable reference rule has been checked; every caller-visible feature has its required coverage; every added or changed export is intentional and has the documentation required by [`references/comments-and-jsdoc.md`](references/comments-and-jsdoc.md); each abstraction, helper, and cast in the changed behavior is required and conforms to its applicable reference; and all changes remain within the requested scope.

### dmmulroy supporting references

#### `comments-and-jsdoc.md`

> # Comments and JSDoc
>
> Every exported JavaScript or TypeScript symbol has JSDoc at its original declaration. A concise comment is sufficient when it states the sharpest caller-visible fact the signature cannot show. Use additional prose or tags only for further constraints, expected failures, side effects, ownership, invariants, trade-offs, non-obvious domain rules, or safety justifications.
>
> Names, public documentation, UI copy, and rendered errors use durable vocabulary appropriate to their audience. Use ordinary domain phrases readers are likely to search for when those phrases differ from an identifier's spelling. Keep ticket names, migration phases, internal storage fields, framework mechanics, and planning language in internal implementation or planning material.
>
> Public methods and properties of an exported class also require JSDoc. Document private/internal code when safe maintenance depends on a non-obvious purpose, invariant, domain rule, side effect, trade-off, or safety justification.
>
> Document each original declaration once; re-exports rely on that documentation. Write explicit documentation in place of inheritance tags such as `@inheritDoc`.
>
> Attach `/** ... */` JSDoc directly to its declaration. Include tags when they add caller-relevant information:
>
> ```ts
> /**
>  * Parse and validate an email address at an external input boundary.
>  *
>  * @param input - Raw input received from outside the application.
>  * @returns A validated email address, or `InvalidEmailAddress` when validation fails.
>  */
> export function parseEmailAddress(input: string): Result<EmailAddress, InvalidEmailAddress>;
> ```
>
> Add `@template` when a type parameter has a role or constraint the signature does not make clear:
>
> ```ts
> /**
>  * Map the success value of a result while preserving its error channel.
>  *
>  * @template E - Error channel preserved without invoking `fn`.
>  * @param fn - Transforms the success value; it is skipped when `result` contains an error.
>  * @returns A result containing the transformed success value or the original error.
>  */
> export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
> ```
>
> Reserve `@throws` for unrecoverable defects, framework-required behavior, and temporary `notYetImplemented` paths. Describe expected typed errors in `@returns` or the operation's documented outcomes.
>
> Document exported object fields whose semantics extend beyond their names and types:
>
> ```ts
> /** Options that bound and identify an outbound request. */
> export type RequestOptions = {
>   /** Total request budget, including connection setup and retries. */
>   readonly timeout: Duration;
>
>   /** Correlation identifier forwarded unchanged to downstream services. */
>   readonly correlationId: CorrelationId;
> };
> ```
>
> ## Completion check
>
> Complete when every applicable rule above has been checked: every exported symbol and public class member has useful JSDoc on its original declaration; concise comments state the sharpest fact the signature cannot show and longer comments earn their additional detail; re-exports rely on the original declaration; inherited public members have explicit documentation; non-obvious exported fields and private/internal behavior are documented; `@throws` is reserved for the listed defect paths; comments add meaning beyond the code and include searchable ordinary domain phrases when identifier spelling differs; and public language uses durable, audience-appropriate vocabulary while internal implementation and planning terms stay internal.

#### `configuration-and-resources.md`

> # Configuration and resources
>
> At startup or the earliest composition boundary, read environment and runtime configuration once, parse it into typed values, and pass those values inward.
>
> Apply [`errors.md`](errors.md) to configuration failures and [`sensitive-data-and-observability.md`](sensitive-data-and-observability.md) to credentials and other sensitive configuration. For Effect configuration, resources, time, or randomness, apply [`effect.md`](effect.md) and every matching branch.
>
> Entrypoints/bootstrap own top-level side effects and each resource's acquisition, lifetime, and release. Keep every other module's imports inert: start servers, open connections, read environment variables, register handlers, and perform top-level I/O only in true entrypoints.
>
> Confine mutable singleton/global state to framework boundaries. Define constants and pure lookup tables as ordinary values.
>
> Make time and randomness explicit dependencies. Dependency-bearing modules consume runtime clock and random capabilities; pure domain functions accept concrete timestamps or generated values.
>
> ## Completion check
>
> Every environment and configuration source is read at startup or the earliest composition boundary and parsed once into typed values; every known configuration failure remains typed until the startup boundary produces a non-sensitive failure outcome; every acquired resource has one explicit owner and is released on success, failure, and cancellation or interruption; every non-entrypoint import is inert; mutable singleton/global state stays at a framework boundary; and time and randomness enter dependency-bearing modules as explicit capabilities and pure functions as concrete values.

#### `domain-types-and-state.md`

> # Domain types and state
>
> ## Branded and refined values
>
> Brand every domain/entity identifier by default, such as `UserId`, `OrgId`, or `WorkflowId`.
>
> Brand units whose raw values could be mixed, such as `Milliseconds`, `Bytes`, or `UsdCents`.
>
> Use parsed domain types for strings and numbers with real rules or domain meaning, such as `EmailAddress`, `Url`, `Slug`, `PositiveInt`, or `Percentage`.
>
> Keep ordinary display text, local counters, indexes, and implementation-only values as primitives until they gain an invariant or domain meaning.
>
> Construct branded/refined values through parsers or smart constructors, then pass those values instead of raw strings or numbers.
>
> ## Operation inputs and optionality
>
> Push optionality outward. Branch or parse before calling a function that requires a value.
>
> Use `Partial<T>` only when partiality is the actual domain concept. Define explicit operation inputs otherwise.
>
> For non-trivial calls, keep the one obvious primary domain input positional. Group related configuration or capability controls into a named options object when names prevent order mistakes or make policy visible.
>
> ## Lifecycle state
>
> Use a tagged union or equivalent value class when lifecycle states allow different data, operations, or transitions. Use a simple status value when states only need identification. A status value plus a clear transition function is enough when it fully expresses the lifecycle rules.
>
> ```ts
> type Invoice =
>   | { readonly _tag: "Draft"; readonly id: InvoiceId; readonly lines: NonEmptyArray<LineItem> }
>   | { readonly _tag: "Sent"; readonly id: InvoiceId; readonly sentAt: Instant }
>   | { readonly _tag: "Paid"; readonly id: InvoiceId; readonly paidAt: Instant };
> ```
>
> Handle every closed tagged union exhaustively. When a switch needs an impossible-case helper, use the repository's established helper as specified in [`errors.md`](errors.md).
>
> At external protocol boundaries, model unknown variants with an explicit, tested fallback policy; keep internal closed unions exhaustive.
>
> ## Boolean blindness
>
> Use independent booleans when their combinations are genuinely independent and valid.
>
> Boolean parameters that control behavior become named options or domain values:
>
> ```ts
> createUser(input, { emailVerification: "skip" });
> ```
>
> Booleans remain appropriate predicate results:
>
> ```ts
> isExpired(token): boolean;
> hasPermission(user, permission): boolean;
> ```
>
> ## Completion check
>
> Complete when every changed domain value, operation input, and state concern is accounted for:
>
> - each identifier, mixable unit, and constrained scalar has a parser or smart constructor that establishes its invariant;
> - each remaining primitive has no domain invariant or mix-up risk that warrants a domain type;
> - optionality is resolved before required calls, and each `Partial<T>` represents actual domain partiality;
> - each non-trivial call keeps its primary input obvious and names controls that expose policy or prevent order mistakes;
> - each lifecycle representation permits exactly its valid data, operations, and transitions;
> - each closed union is handled exhaustively, and each open external protocol has an explicit, tested unknown-variant policy; and
> - each boolean represents either an independently valid combination or a predicate result, while behavior controls use named options or domain values.

#### `effect-caching.md`

> # Caching, Memoization, And Request Dedupe
>
> Use `effect/Cache` when its keyed memoization, TTL, capacity, lifecycle, and eviction semantics fit. When it fits, do not hand-roll `Map`/TTL/prune caches, in-flight deduplication maps, or LRU logic.
>
> ## Core Rules
>
> - `Cache.make({ capacity, lookup, timeToLive })` caches per-key lookups with one fixed TTL for all entries.
> - Concurrent `Cache.get` calls for the same missing key share one pending lookup; use that behavior for in-flight deduplication.
> - `capacity` is required and supplies the cache's eviction bound.
> - `Cache.invalidate(cache, key)` and `Cache.refresh(cache, key)` handle explicit staleness; `Cache.has` checks without triggering a lookup.
> - Cache construction is effectful. Build each cache once in its owning Layer or Scope and share the handle.
> - For a single value without a key, use `Effect.cached(effect)` or `Effect.cachedWithTTL(effect, ttl)`.
> - For cached resources that need cleanup, such as connections or clients, use `ScopedCache`.
>
> ## Exit-Aware TTL
>
> `Cache.makeWith(lookup, { capacity, timeToLive(exit, key) })` computes each entry's TTL from the lookup's `Exit`. Give transient failures and degraded fallbacks a zero TTL (`0`, `"0 millis"`, or `Duration.zero`) so the caller receives the result while the next lookup can try again. A short negative-cache TTL can protect an upstream from repeated stable failures such as not-found results.
>
> ```ts
> import { Cache, Duration, Effect, Exit } from "effect"
>
> const makeResolver = Effect.gen(function* () {
>   const cache = yield* Cache.makeWith(
>     (channelRef: string) => resolveUncached(channelRef), // returns { where, cacheable }
>     {
>       capacity: 300,
>       timeToLive: (exit) =>
>         Exit.isSuccess(exit) && exit.value.cacheable ? "10 minutes" : Duration.zero,
>     },
>   )
>   return (channelRef: string) =>
>     Cache.get(cache, channelRef).pipe(Effect.map((resolved) => resolved.where))
> })
> ```
>
> ## Acquire Expensive Clients Once
>
> Construct or authenticate clients while building the owning Layer, then close over the yielded service or client in the cache lookup. Each cache miss then pays only for the provider operation. When this changes service or Layer construction, also read [`effect-services.md`](effect-services.md).
>
> ## Request Batching (`Effect.request` + `RequestResolver`)
>
> A `RequestResolver` batches pending requests when one backend call can answer multiple keys, such as SQL `IN (...)`, DataLoader-style endpoints, or batch GET. Per-item endpoints use `Effect.forEach(items, f, { concurrency: n })`, optionally through a `Cache` for deduplication and memoization.
>
> `RequestResolver.batchN(resolver, n)` bounds batch size; `RequestResolver.makeGrouped` groups requests that resolve through different targets.
>
> Selection guide:
>
> - Same key requested repeatedly over time → `Cache`.
> - Same key requested concurrently in one burst → `Cache` (shared pending lookup).
> - Many distinct keys, backend has a batch endpoint → `Effect.request` + `RequestResolver`.
> - Many distinct keys, per-item endpoint only → `Effect.forEach(..., { concurrency: n })`, optionally through a `Cache`.
>
> ## Completion Check
>
> For every cache or batching path, the chosen primitive matches the key pattern and backend; each keyed cache has an intentional capacity, TTL and invalidation policy, and lifetime owner; stable dependencies are acquired once; same-key concurrency uses built-in deduplication; and each `RequestResolver` maps multiple keys to one backend call.

#### `effect-configuration.md`

> # Effect configuration
>
> This reference covers Effect `Config` recipes, providers, and config-backed Layers. For configuration ownership, startup failure handling, and resource lifecycle, also apply [`configuration-and-resources.md`](configuration-and-resources.md).
>
> Install environment-backed providers at the composition root, then read typed runtime configuration through Effect `Config` recipes.
>
> ```ts
> export const dataDirectoryConfig = Config.schema(
>   AbsolutePath,
>   "APP_DATA_DIR",
> )
>
> export const layerFromEnvironment = Layer.effect(
>   Configuration.Service,
>   Effect.gen(function* () {
>     const apiKey = yield* Config.redacted("API_KEY")
>     const optionalModel = yield* Config.option(Config.string("MODEL"))
>     const enabled = yield* Config.boolean("FEATURE_ENABLED").pipe(
>       Config.withDefault(false),
>     )
>
>     return Configuration.Service.of({ apiKey, optionalModel, enabled })
>   }),
> )
> ```
>
> ## Config Recipes
>
> - `Config<T>` is yieldable and reads the current `ConfigProvider` reference.
> - The default provider is `ConfigProvider.fromEnv()`.
> - Use `Config.redacted(...)` for credentials.
> - Use `Config.schema(...)` or `Config.mapOrFail(...)` for refined values.
> - Use `Config.option(...)` for semantic absence.
> - Use `Config.withDefault(...)` for missing-data defaults only; malformed values still fail.
> - `Config.orElse(...)` catches any config parse failure; use it when every such failure should select the fallback.
> - Use `Config.unwrap(...)` / `Config.Wrap<T>` for `layerConfig(...)` helpers.
>
> ## Providers
>
> - Use `ConfigProvider.layer(provider)` to replace the active provider for an app or suite.
> - Use `ConfigProvider.layerAdd(provider)` for fallbacks; pass `{ asPrimary: true }` when the added provider must override the current provider.
> - Use `ConfigProvider.fromEnv(...)` for environment variables.
> - Use `ConfigProvider.constantCase` when camelCase schema keys should read `SCREAMING_SNAKE_CASE` env vars.
> - Use `ConfigProvider.nested(...)` to scope a provider under a prefix.
>
> For tests that supply configuration, follow [`effect-testing.md#config-in-tests`](effect-testing.md#config-in-tests).
>
> ## Layer Config Helpers
>
> A `layerConfig(options: Config.Wrap<Options>)` helper earns its place when callers need to compose runtime `Config` recipes. Keep `layer(options)` as the concrete constructor for callers that already have decoded options.
>
> ```ts
> export const layerConfig = (
>   config: Config.Wrap<ClientOptions>,
> ) =>
>   Layer.effect(
>     Client.Service,
>     Config.unwrap(config).pipe(
>       Effect.flatMap(makeClient),
>       Effect.map((client) => Client.Service.of(client)),
>     ),
>   )
> ```
>
> Expose only the constructor forms required by actual callers.
>
> ## Completion check
>
> Every runtime value is decoded through a typed `Config` recipe; credentials use `Config.redacted`; defaults distinguish missing values from malformed values; every `Config.orElse` fallback intentionally covers all parse failures; provider replacement, fallback, and precedence are explicit; every `layerConfig` has a caller that composes `Config` recipes; and configuration tests follow the linked testing strategy.

#### `effect-http-clients.md`

> # HTTP Clients
>
> Default to Effect HTTP client modules for outgoing HTTP in application and provider code:
>
> - `effect/unstable/http/HttpClient`
> - `effect/unstable/http/HttpClientRequest`
> - `effect/unstable/http/HttpClientResponse`
> - `effect/unstable/http/HttpClientError`
>
> For a runtime or library boundary that cannot depend on unstable Effect HTTP modules, follow [Raw Fetch Exception](#raw-fetch-exception).
>
> ## Boundary Shape
>
> Each HTTP boundary operation should be a named Effect that owns the complete protocol interaction:
>
> - construct the request;
> - attach authentication and headers;
> - execute the request with interruption support;
> - classify status before decoding a success body;
> - decode the response into application or domain types;
> - translate transport, status, and decode failures into typed application errors;
> - apply the operation's retry and rate-limit policy.
>
> Place these protocol mechanics in an outbound Adapter or a private concrete client. Application services call that boundary and own application policy. Keep database transaction scopes limited to database work. Read [`modules-services-and-adapters.md`](modules-services-and-adapters.md) when deciding whether a separate Adapter is earned, and [`workflows-transactions-and-idempotency.md`](workflows-transactions-and-idempotency.md) when an HTTP operation can repeat or interacts with a transaction.
>
> ## Effect HttpClient
>
> Useful APIs:
>
> - `HttpClient.get(...)`, `post(...)`, `put(...)`, `patch(...)`, `del(...)`, `execute(...)` for service accessors.
> - `HttpClient.mapRequest(...)` / `mapRequestEffect(...)` for configured client transforms.
> - `HttpClientRequest.prependUrl(...)` for base URLs.
> - `HttpClientRequest.bearerToken(...)` for bearer auth.
> - `HttpClientRequest.acceptJson` for JSON accept headers.
> - `HttpClientRequest.bodyJson(...)` for effectful JSON body encoding.
> - `HttpClientRequest.schemaBodyJson(...)` for schema-backed JSON body encoding.
> - `HttpClient.filterStatusOk` / `HttpClientResponse.filterStatusOk` before decoding when non-2xx responses are failures.
> - `HttpClientResponse.schemaBodyJson(...)` for body-only decoding, `schemaJson(...)` for status/headers/body decoding, and `schemaNoBody(...)` for status/headers decoding.
>
> ## Retry And Rate Limits
>
> Retry an outgoing operation when its idempotency guarantee makes repetition safe. Choose the retry owner by failure semantics:
>
> - Use `HttpClient.retryTransient(...)` for transport errors, timeouts, and HTTP `408`, `429`, `500`, `502`, `503`, and `504` responses.
> - Use operation-level `Effect.retry(...)` when retry depends on domain-specific typed errors, provider payloads, or operation idempotency.
>
> Use `HttpClient.withRateLimiter(...)` for proactive pacing that learns from rate-limit and `Retry-After` headers. It requires a `RateLimiter` plus initial window, limit, and key options, adds `RateLimiterError` to the error channel, and retries `429` responses by default.
>
> Read [`effect-scheduling-and-retry.md`](effect-scheduling-and-retry.md) when operation-level retry needs a custom schedule or a typed provider error carries `retryAfterMs`.
>
> ## Raw Fetch Exception
>
> Choose raw `fetch` for a platform transport or a runtime/library boundary that cannot take a dependency on unstable Effect HTTP modules. Keep that boundary focused on request construction, execution, interruption, status classification, response decoding, and typed failure translation. A boundary that can accept unstable Effect HTTP modules moves to Effect HttpClient when it needs shared client transforms, HTTP retry helpers, or rate limiting.
>
> ```ts
> const request = Effect.fn("Provider.request")(function* (input: RequestInput) {
>   const response = yield* Effect.tryPromise({
>     try: (signal) => fetch(input.url, { signal, headers: input.headers }),
>     catch: (cause) => new ProviderError({ operation: "Provider.request", cause }),
>   })
>
>   if (!response.ok) {
>     return yield* Effect.fail(new ProviderRejected({
>       operation: "Provider.request",
>       status: response.status,
>     }))
>   }
>
>   const json = yield* Effect.tryPromise({
>     try: () => response.json(),
>     catch: (cause) => new ProviderError({ operation: "Provider.decodeJson", cause }),
>   })
>
>   return yield* Schema.decodeUnknownEffect(ResponseSchema)(json).pipe(
>     Effect.mapError((cause) =>
>       new ProviderError({ operation: "Provider.decodeResponse", cause }),
>     ),
>   )
> })
> ```
>
> For raw-fetch boundaries:
>
> - Pass the `AbortSignal` from `Effect.tryPromise` to `fetch`.
> - Classify HTTP status before decoding a successful payload.
> - Decode unknown response bodies with Schema at the boundary. Read [`parsing-and-schemas.md`](parsing-and-schemas.md) when defining the response representation or its application/domain translation.
> - Retain provider evidence needed for diagnosis as safe structured fields. Read [`sensitive-data-and-observability.md`](sensitive-data-and-observability.md) when requests, responses, or diagnostics may contain secrets or personal data.
>
> ## Completion Check
>
> Every outgoing HTTP operation uses Effect HttpClient or records a concrete runtime/library reason for raw `fetch`; request construction, authentication, interruption, status classification, schema decoding, typed failure translation, and safe diagnostics have clear owners; status is classified before a success body is decoded; database transaction scopes contain only database work; and every retry or rate-limit policy has explicit ownership and a proven idempotency guarantee.

#### `effect-scheduling-and-retry.md`

> # Scheduling And Retry
>
> Use `Schedule` to express retry, polling, pacing, and repeated background work.
>
> ## Core Rules
>
> - `Effect.retry(...)` retries typed failures; defects and interruptions are not retried.
> - `Effect.repeat(...)` repeats successful effects; failures stop repetition unless the pass handles them first.
> - The source effect runs once before the schedule is stepped.
> - `Schedule.recurs(3)` means three retries/repetitions after the initial run.
> - `Schedule.spaced(...)` waits after work completes.
> - `Schedule.fixed(...)` aligns executions to a cadence.
> - Use `Schedule.exponential(...)` or `Schedule.fibonacci(...)` for backoff.
> - Add `Schedule.jittered` to avoid synchronized retry storms.
> - Use `Schedule.recurs(...)` for a counter schedule or `Schedule.upTo({ times })` to bound a delay schedule.
> - Use `Schedule.tapInput(...)` to log retry inputs.
> - Use `Schedule.tap(...)` when full schedule metadata matters.
> - Use `Effect.retryOrElse(...)` when exhausted retries need a fallback/reporting effect.
> - Retry only at the narrowest boundary with proven idempotency.
> - Keep exhausted failures visible unless the boundary has a truthful fallback.
>
> When retries can duplicate side effects, read [`workflows-transactions-and-idempotency.md`](workflows-transactions-and-idempotency.md) to choose the retry owner and safety guarantee.
>
> ## Polling Workers
>
> Handle expected pass failures through the typed error channel.
>
> ```ts
> const pass = runPass().pipe(
>   Effect.tapError((error) =>
>     Effect.logError("Worker.pass_failed", error),
>   ),
>   Effect.ignore,
> )
>
> const run = pass.pipe(
>   Effect.repeat(Schedule.spaced("1 second")),
> )
> ```
>
> This shape says expected operational pass failures are logged and the worker continues. Defects still defect and can reach supervision.
>
> Use cause-level recovery only at supervision boundaries where the policy is truly "report non-interrupt failure and continue".
>
> ```ts
> const logNonInterruptCauseAndContinue = (message: string) =>
>   Effect.catchCauseIf(
>     (cause) => !Cause.hasInterrupts(cause),
>     (cause) => Effect.logError(message, cause),
>   )
> ```
>
> Recover expected typed failures with `Effect.catchIf(...)`, `Effect.catchFilter(...)`, `Effect.catchTag(...)`, or `Effect.retry(...)`.
>
> ## Per-Item Failure Isolation
>
> For batch workers, catch expected item-level typed failures around each item so one bad item does not stall the batch.
>
> ```ts
> yield* Effect.forEach(
>   items,
>   (item) =>
>     processItem(item).pipe(
>       Effect.tapError((error) =>
>         Effect.logError("Worker.item_failed", error).pipe(
>           Effect.annotateLogs({ itemId: item.id }),
>         ),
>       ),
>       Effect.ignore,
>     ),
>   { discard: true, concurrency: 5 },
> )
> ```
>
> This isolation is truthful when the product policy retries the item later or deliberately skips it.
>
> ## Reusable Retry Policy
>
> ```ts
> const reconciliationRetrySchedule: Schedule.Schedule<unknown, ReconciliationError> =
>   Schedule.exponential("100 millis").pipe(
>     Schedule.jittered,
>     Schedule.upTo({ times: 5 }),
>   )
>
> const reconcileWithRetry = (target: Target) =>
>   reconcile(target).pipe(
>     Effect.retry(
>       reconciliationRetrySchedule.pipe(
>         Schedule.tapInput((error) =>
>           Effect.logWarning("Agent.Reconciliation.retrying").pipe(
>             Effect.annotateLogs({ operation: error.operation }),
>           ),
>         ),
>       ),
>     ),
>     Effect.tapError((error) =>
>       Effect.logError("Agent.Reconciliation.stopped", error),
>     ),
>   )
> ```
>
> Use this shape when retry state is useful for logs or metrics. The final `tapError` reports exhaustion while preserving the typed failure.
>
> ## Rate-Limit-Aware Typed Retry
>
> For provider errors that carry `retryAfterMs`, let the schedule use the larger of the backoff delay and the provider delay.
>
> ```ts
> type RateLimited = {
>   readonly retryAfterMs?: number | undefined
> }
>
> const providerRetrySchedule: Schedule.Schedule<RateLimited, RateLimited> =
>   Schedule.exponential("200 millis").pipe(
>     Schedule.jittered,
>     Schedule.upTo({ times: 5 }),
>     Schedule.passthrough,
>     Schedule.modifyDelay(({ input, duration }) =>
>       Effect.succeed(
>         input.retryAfterMs === undefined
>           ? duration
>           : Duration.max(duration, Duration.millis(input.retryAfterMs)),
>       ),
>     ),
>   )
> ```
>
> Use this for operation-level retries over typed provider errors. For Effect `HttpClient`-level 429 handling and proactive pacing, read [`effect-http-clients.md`](effect-http-clients.md).
>
> ## Timeouts And Delays
>
> - Use `Effect.timeout(...)` when the operation has a real deadline.
> - Use `Effect.delay(...)` when one operation should start later.
> - Use `Effect.sleep(...)` when sleeping itself is the domain behavior.
> - Use `Effect.repeat(...)` with `Schedule` for recurring work.
> - In tests, control time with `TestClock`; read [`effect-testing.md`](effect-testing.md).
>
> ## Completion Check
>
> Every retry and repetition has an explicit owner and termination policy, including intentional unbounded workers. Every retried side effect has a proven safety guarantee. Polling and batch workers state whether each expected failure continues, retries, skips, or stops. Exhausted failures remain typed and visible unless the owning boundary provides a truthful fallback. Time-based tests use deterministic clock control.

#### `effect-schema-and-data.md`

> # Schema And Data Modeling
>
> Use this when touching data models, DTOs, row schemas, wire contracts, brands, variants, optional fields, or decoders.
>
> ## Records
>
> Default to `Schema.Struct(...)` plus a same-name `interface`.
>
> ```ts
> export const User = Schema.Struct({
>   id: UserId,
>   name: Schema.NonEmptyString,
>   email: Schema.optionalKey(Schema.String),
> })
>
> export interface User extends Schema.Schema.Type<typeof User> {}
> ```
>
> Guidance:
>
> - Add `.annotate({ identifier: "User" })` only when tooling consumes it: HTTP API, RPC, OpenAPI/JSON Schema, docs, diagnostics, or codegen.
> - Use `schema.make(...)` when construction is trusted.
> - Use `schema.makeEffect(...)` when construction failure should stay in the Effect error channel.
> - Apply [`parsing-and-schemas.md`](parsing-and-schemas.md) to boundary ownership and trust decisions. Decode unknown input with `Schema.decodeUnknownEffect(...)` by default.
> - Use `Schema.decodeUnknownSync(...)` only in scripts, tests, or startup paths where throwing is acceptable.
> - Use `Schema.decodeUnknownOption(...)` only when mismatch details are intentionally discarded.
> - Use `Schema.decodeUnknownResult(...)` for pure code that wants explicit success/failure without Effect.
>
> ## Field And Contract Reuse
>
> Reuse fields directly when contracts are semantically related.
>
> ```ts
> export const CreateUserInput = Schema.Struct({
>   name: User.fields.name,
>   email: User.fields.email,
> })
>
> export const StoredUser = User.pipe(
>   Schema.fieldsAssign({
>     createdAt: Schema.DateTimeUtcFromString,
>   }),
> )
> ```
>
> Guidance:
>
> - Use `.fields`, `Schema.fieldsAssign(...)`, and `.mapFields(...)` to build small contracts with a genuine semantic relationship.
> - Use `Schema.encodeKeys(...)` when decoded TypeScript names differ from encoded wire/storage keys and naming is the only difference.
> - Keep explicit mapping when behavior, joins, validation, or domain translation is involved.
> - Use `Schema.extendTo(...)` sparingly for decoded-only derived fields.
>
> ## Optionality And Defaults
>
> Apply [`domain-types-and-state.md`](domain-types-and-state.md) to decide domain optionality. Represent the encoded contract precisely:
>
> - Use `Schema.optionalKey(...)` for absent JSON/storage keys.
> - Use `Schema.optional(...)` only when explicit `undefined` is part of the contract.
> - Use `Schema.NullOr`, `Schema.UndefinedOr`, or `Schema.NullishOr` only when nullish values are part of the encoded contract.
> - Keep normalized defaulted values as required fields and apply defaults in constructors/decoding.
>
> ## Nominal Values
>
> Apply [`domain-types-and-state.md`](domain-types-and-state.md) to decide which values require brands or refinements.
>
> - Implement scalar IDs and value objects as constrained branded schemas.
> - Apply normal schema constraints before `Schema.brand(...)` for most code.
> - Use `Schema.fromBrand(...)` when the project already models brands with `Brand` constructors or needs the check packaged with the brand constructor.
>
> ## Variants
>
> ```ts
> type Step = Data.TaggedEnum<{
>   Continue: { readonly cursor: number }
>   Finished: { readonly count: number }
> }>
>
> export const Step = Data.taggedEnum<Step>()
>
> const next = Step.Continue({ cursor: 10 })
> const label = Step.$match(next, {
>   Continue: ({ cursor }) => `continue at ${cursor}`,
>   Finished: ({ count }) => `finished ${count}`,
> })
> ```
>
> ```ts
> export const Event = Schema.TaggedUnion({
>   Started: { runId: RunId },
>   Finished: { runId: RunId, result: Schema.Json },
> })
>
> export type Event = typeof Event.Type
>
> const event = Event.cases.Started.make({ runId })
> const label = Event.match(event, {
>   Started: ({ runId }) => `started ${runId}`,
>   Finished: ({ runId }) => `finished ${runId}`,
> })
> ```
>
> Guidance:
>
> - Use `Data.TaggedEnum` for internal control-flow algebras; it provides constructors, `$is`, and exhaustive `$match`.
> - Use `Schema.TaggedStruct` for the ordinary Effect-owned `_tag` variant.
> - Use `Schema.TaggedUnion` when the union needs decoding, encoding, persistence, wire validation, JSON Schema derivation, or schema composition.
> - Use `Schema.tag(...)` when an external contract has a custom discriminator field such as `type` or `kind`; combine those structs with `Schema.toTaggedUnion("type")` when union helpers are needed.
> - If the encoded contract omits the discriminant, use `Schema.tagDefaultOmit(...)` deliberately.
> - Use structural schemas—`Schema.Struct`, `Schema.TaggedStruct`, or `Schema.TaggedUnion`—for new data models.
>
> ## Errors
>
> Apply [`errors.md`](errors.md) to the error's meaning, granularity, context, message, and recovery guidance. `Schema.TaggedErrorClass` is the explicit class exception for typed Effect errors.
>
> ```ts
> export class PersistenceError extends Schema.TaggedErrorClass<PersistenceError>()(
>   "UserRepo.PersistenceError",
>   {
>     operation: Schema.String,
>     message: Schema.String,
>     cause: Schema.Defect(),
>   },
> ) {}
> ```
>
> Guidance:
>
> - Use schema unions for public API or transport error surfaces.
> - Use `Schema.Defect()` for defect-like payloads.
>
> ## Completion Check
>
> Every changed Effect data model uses the selected record or variant representation; every reused field preserves the same meaning; every encoded optional or nullish state is intentional; every default produces a required normalized value; every decoder matches its boundary's trust and failure policy; and every serialized error surface follows [`errors.md`](errors.md).

#### `effect-services.md`

> # Effect services
>
> Apply [`modules-services-and-adapters.md`](modules-services-and-adapters.md) for ownership and Adapter decisions.
>
> Treat a service as an **authority seam**: a cohesive capability whose requirements propagate through Effect context. The application capability module owns its interface, tag, and expected errors. Each concrete implementation owner keeps its construction and applicable production or reusable test Layers with that implementation.
>
> ## Service test
>
> A real service owns at least one meaningful capability:
>
> - authority over persistence, credentials, external I/O, runtime resources, configuration, time, randomness, or lifecycle;
> - cohesive effect sequencing or policy reused across entrypoints;
> - state or behavior with real production and test/runtime variation.
>
> Prefer an existing Effect service such as `Clock`, `Crypto`, `Random`, `Config`, `HttpClient`, `FileSystem`, or `Path` before defining an application service.
>
> Keep these as values or pure modules:
>
> - parsed domain inputs and per-call request data;
> - deterministic calculations, parsers, and constructors;
> - options that select policy for one call;
> - framework values confined to their Adapter;
> - wrappers that only rename or forward another service.
>
> A service seam represents real ownership or variability in production. When injection is the only need, keep the injected data as a value or local fixture. Record the production evidence for the service-or-value decision and the rejected alternative.
>
> ## Authority and requirements
>
> The application module identified by [`modules-services-and-adapters.md`](modules-services-and-adapters.md) owns the capability's interface and tag. A technology Adapter owns its concrete `make` and Layer only after translation, mechanics, reuse, or real implementation variation earns that seam. The composition root selects top-level concrete Layers; a service module assembles only dependency implementations it truthfully owns. Reusable policy remains in its owning application service.
>
> Yield stable runtime capabilities and implementation dependencies while building the Layer and close over them in service methods. Yield request-, fiber-, or operation-scoped context inside the method that uses it. Let requirements propagate until the module that truthfully chooses an implementation provides them.
>
> Authorization evidence, scoped handles, and other operation-specific capability values remain explicit inputs when they are part of the request or domain contract. Passing an external library's constructor options remains correct after the owning Adapter has yielded the relevant runtime capability. React props, request values, domain inputs, and framework constructors remain explicit values rather than Effect dependencies.
>
> ## Module shape
>
> Follow the project's established equivalent of this shape:
>
> ```ts
> export interface Interface {
>   readonly operation: (input: Input) => Effect.Effect<Output, OperationError>
> }
>
> export class Service extends Context.Service<Service, Interface>()(
>   "@app/Capability",
> ) {}
>
> export const make: Effect.Effect<
>   Service["Service"],
>   never,
>   Dependency.Service
> > = Effect.gen(function* () {
>   const dependency = yield* Dependency.Service
>
>   const operation = Effect.fn("Capability.operation")(function* (input: Input) {
>     return yield* dependency.operation(input)
>   })
>
>   return Service.of({ operation })
> })
>
> export const layerWithoutDependencies = Layer.effect(Service, make)
>
> export const layer = layerWithoutDependencies.pipe(
>   Layer.provide([Dependency.layer]),
> )
> ```
>
> `Interface`, `Service`, `make`, `layerWithoutDependencies`, and `layer` are canonical role names within an Effect capability module. The owning module namespace and service tag identify the capability. `layerWithoutDependencies` preserves requirements for composition. `layer` is the ready production assembly and provides the concrete dependency Layers chosen by this module.
>
> Choose the Layer constructor that matches acquisition: `Layer.succeed` for an existing value, `Layer.sync` for lazy synchronous construction, and `Layer.effect` for effectful acquisition. Use `Layer.effectContext` when one acquisition intentionally supplies several tags, especially a production service and its test-control service. Use `Layer.unwrap` when configuration or runtime discovery builds the Layer. Use `Layer.fresh` or `Effect.provide(layer, { local: true })` only when an operation or test requires isolated acquisition. Reserve `Context.Reference` for ambient runtime values with a safe, truthful default.
>
> Keep the interface cohesive and domain-shaped. Inject dependencies as yielded service objects rather than callback functions; a function capability fits only when higher-order behavior is itself the capability.
>
> ## Module surface
>
> One valid module surface gives the ES module one canonical namespace while keeping file-local role names:
>
> ```ts
> export interface Interface {
>   readonly getUserById: (id: UserId) => Effect.Effect<User, NotFound | PersistenceError>
> }
>
> export class Service extends Context.Service<Service, Interface>()(
>   "@app/UserStore",
> ) {}
>
> export * as UserStore from "./user-store.js"
> ```
>
> Consumers import the owning leaf directly and yield `UserStore.Service`. A folder or package entrypoint may relay the leaf's established identity with `export { UserStore } from "./user-store.js"`. Use this self-export style only where the runtime and toolchain support it; otherwise use ordinary named exports or a separate public entrypoint. Keep schemas, row codecs, helpers, and implementation details private.
>
> ## Runtime wiring
>
> - Use `Layer.provide` when the current module truthfully chooses and hides an implementation dependency.
> - Use `Layer.provideMerge` only when downstream consumers should still receive that dependency.
> - Use `Layer.mergeAll` for independent exposed Layers.
> - Keep runtime Layer values flat, named, and topologically ordered.
> - Provide dependencies at their owning boundaries so application authority and lifecycle requirements remain visible.
>
> A Layer that owns a stream, listener, worker, subscription, or long-lived fiber forks it into the Layer scope so acquisition can complete. Read [`effect-streams.md`](effect-streams.md) for the lifecycle pattern.
>
> ## Named operation boundaries
>
> Use `Effect.fn("Capability.operation")` for public and non-trivial internal service methods. Reserve `Effect.fnUntraced` for internal helpers whose stack-frame and span metadata are intentionally unnecessary. Keep the generator focused on the operation and use one or two whole-function transforms for concerns that need the complete effect and original arguments, such as error classification, logging annotations, spans, bounded retry, timeout, cleanup, or result mapping. Each transform receives `(effect, ...originalArgs)`:
>
> ```ts
> const readAttachment = Effect.fn("Attachment.read")(
>   function* (ref: AttachmentRef) {
>     return yield* client.read(ref)
>   },
>   (effect, ref) =>
>     effect.pipe(
>       attachmentError("Attachment.read", { attachmentId: ref.id }),
>     ),
> )
> ```
>
> For operation-labelled boundary errors, prefer a shared curried `mapError` helper over repeated wrappers:
>
> ```ts
> const persistenceError = operationError(PersistenceError.make)
>
> const row = yield* query.pipe(
>   persistenceError("UserStore.findById"),
> )
> ```
>
> Name the helper for the error it creates. Pair structured error fields with `Effect.fn` boundaries and spans for observability.
>
> ## Test Layers
>
> When tests or reusable test implementations change, read [`effect-testing.md`](effect-testing.md) for static implementations, test-control services, shared backing objects, and focused local mocks.
>
> Tests cross the same service interface as production callers. Use `layerMemory` for a faithful in-memory implementation of the observable contract. Prefer a real local substitute when persistence, transactions, serialization, or protocol behavior matters. Keep a narrow one-off fake in its test when promoting it would create production surface solely for that test.
>
> Name reusable implementations for their observable behavior, such as `InMemoryCache`, `RecordingEmailSender`, or `TestClock`.
>
> ## Completion check
>
> Complete when:
>
> - the service-or-value decision cites production ownership or variability and the rejected alternative;
> - every applicable interface, tag, construction effect, expected error, method, production Layer, and reusable test implementation has exactly one owner;
> - stable runtime capabilities and implementation dependencies are captured during Layer construction, operation-specific capability values remain explicit inputs, scoped context is yielded where used, and requirements remain visible until the module that selects an implementation provides them;
> - each Layer constructor matches acquisition, each provided dependency is an implementation the provider truthfully owns, and long-lived work is scoped;
> - public and non-trivial service operations have named boundaries, with whole-operation concerns applied at those boundaries;
> - the module surface exposes only service API intended for callers and uses canonical role names consistently; and
> - the test strategy exercises the production interface at the fidelity required by the observable contract.

#### `effect-streams.md`

> # Streams
>
> Use this when working with `Stream`, event sources, async iterables, queue/pubsub-backed streams, pagination, backpressure, throttling, debouncing, or long-lived stream consumers.
>
> ## Mental Model
>
> `Stream<A, E, R>` is an effectful source that can emit many `A` values over time, fail with `E`, and require services `R`. Streams are pull-based and backpressured; consumption controls demand.
>
> Use streams for sources that are naturally many-valued and time-ordered:
>
> - gateway events
> - provider callbacks adapted through queues
> - subscription/event logs
> - paginated APIs
> - file/stdin/platform streams
> - scheduled ticks when values matter
> - pipelines with filtering, mapping, buffering, throttling, or bounded concurrent processing
>
> Use `Effect.repeat(...)` with `Schedule` for one repeated effect with no emitted values; read [`effect-scheduling-and-retry.md`](effect-scheduling-and-retry.md). Reserve streams for work that emits values.
>
> ## Source Chooser
>
> - In-memory values: `Stream.make(...)` or `Stream.fromIterable(...)`.
> - Queue-backed callback boundary: `Queue` plus `Stream.fromQueue(...)`.
> - Broadcast events: `PubSub` plus `Stream.fromPubSub(...)`.
> - Latest-value state plus updates: `SubscriptionRef`.
> - Schedule-generated ticks/values: `Stream.fromSchedule(...)`.
> - Paginated pull APIs: `Stream.paginate(...)`; its effectful step returns `Effect<[chunk, Option<nextState>]>`.
> - Async iterable/platform source: prefer a native Effect source; otherwise use `Stream.fromAsyncIterable(...)`.
> - Effect that produces a stream after reading services/config: `Stream.unwrap(...)`.
>
> ## Transformation Chooser
>
> - Pure transformation: `Stream.map(...)`.
> - Effectful transformation: `Stream.mapEffect(...)`.
> - Bounded concurrent effectful transformation: `Stream.mapEffect(fn, { concurrency })`.
> - Drop ordering when order is irrelevant and latency matters: `Stream.mapEffect(fn, { concurrency, unordered: true })`.
> - One input to zero/many outputs: `Stream.flatMap(...)`.
> - Multiple inner streams concurrently: `Stream.flatMap(fn, { concurrency })`.
> - Keep only matching values: `Stream.filter(...)` / `Stream.filterEffect(...)`.
> - Stateful transformation: `Stream.mapAccum(...)` / `Stream.mapAccumEffect(...)`.
>
> ## Consumption Chooser
>
> - Side-effecting consumer: `Stream.runForEach(...)`.
> - Ignore elements but run the stream: `Stream.runDrain`.
> - Materialize a finite stream: `Stream.runCollect`.
> - Fold into a value: `Stream.runFold(...)`.
> - Long-lived consumer: use the scoped layer pattern below.
>
> Use `Stream.runCollect` only when the stream is known to terminate.
>
> ## Long-Lived Consumers
>
> Own long-lived stream consumers in layers and fork them into the layer scope.
>
> ```ts
> export const layer = Layer.effectDiscard(
>   Effect.gen(function* () {
>     const gateway = yield* Gateway.Service
>
>     yield* gateway.events.pipe(
>       Stream.filter(isMessageEvent),
>       Stream.runForEach(handleEvent),
>       Effect.forkScoped,
>     )
>   }),
> )
> ```
>
> If service methods must fork work into the layer lifetime, capture `Scope.Scope` during layer acquisition, use `Effect.forkIn(scope)` internally, and keep the scope private. Let stream failures reach the owning boundary unless it has a truthful recovery policy.
>
> ## Queues, PubSub, And SubscriptionRef
>
> - Use `Queue` when each event/item should be consumed by one consumer or worker.
> - Use `PubSub` when every subscriber should see every event.
> - Use `SubscriptionRef` when consumers need the current value and a stream of changes.
> - Expose a `Stream` from service interfaces for caller-consumed events.
> - Keep producer queues and mutable refs inside the implementation or test service.
>
> Good service shape:
>
> ```ts
> export interface Interface {
>   readonly events: Stream.Stream<ProviderEvent, ProviderError>
>   readonly status: Stream.Stream<ProviderStatus>
> }
> ```
>
> Implementation can use private `Queue` / `SubscriptionRef`; consumers see streams.
>
> ## Backpressure And Buffers
>
> Prefer natural stream backpressure first.
>
> Use `Stream.buffer(...)` only when producer and consumer should decouple.
>
> - `strategy: "suspend"`: apply backpressure when full.
> - `strategy: "dropping"`: drop new values when full.
> - `strategy: "sliding"`: keep the latest values by dropping old ones.
> - `capacity: "unbounded"`: rare; use only when growth is bounded elsewhere.
>
> Use `Stream.debounce(...)` for quiet-period behavior and `Stream.throttle(...)` / `Stream.throttleEffect(...)` for rate-shaped streams.
>
> ## Error Handling
>
> - Translate typed errors at boundaries with `Stream.mapError(...)`.
> - Recover typed errors with `Stream.catchIf(...)`, `Stream.catchTag(...)`, or `Stream.catchFilter(...)`.
> - Reserve `Stream.catchCause(...)` for explicit supervision boundaries.
>
> ## Keyed Concurrency
>
> For keyed work, preserve ordering within each key while allowing different keys to run concurrently. Prefer an existing named keyed-run helper; otherwise keep the required fiber bookkeeping in one named helper rather than scattering it through consumers. Choose queueing, replacement, or coalescing semantics from the owning operation's policy.
>
> ## Tests
>
> - Use `Stream.fromIterable(...)` for finite fixtures; compose it with `Stream.concat(Stream.never)` when the fixture represents an open subscription.
> - Use `Stream.empty` for no events.
> - Use `Stream.fromQueue(...)` with a test-owned `Queue` when the test needs to drive events interactively.
> - Bound open streams with `Stream.take(n)` before `Stream.runCollect`.
>
> For stream tests involving time or concurrency, read and apply [`effect-testing.md`](effect-testing.md) completely.
>
> ## Completion Check
>
> The source matches the producer's delivery semantics; ordering and concurrency are explicit; every collected stream is finite; buffers have a bounded-growth policy; long-lived consumers have a scoped owner; queue, `PubSub`, and `SubscriptionRef` internals stay behind stream-facing service interfaces; and typed failures, defects, and interruption reach a boundary with an explicit policy.

#### `effect-testing.md`

> # Effect testing
>
> Apply the test levels, observable-outcome rules, and completion check in [`testing.md`](testing.md) to every Effect test. This reference adds Effect runtime, time, synchronization, and test-Layer rules.
>
> ## Defaults
>
> - Use `it.effect` by default.
> - Use `it.live` when real time or live runtime services are the behavior under test.
> - Drive sleeps, schedules, retries, leases, and timeouts with `TestClock.setTime` or `TestClock.adjust`.
> - Fork a sleeping effect before advancing `TestClock`.
> - Assert interruption and finalization when they are observable parts of the behavior under test.
>
> For retry or schedule tests, also read [`effect-scheduling-and-retry.md`](effect-scheduling-and-retry.md).
>
> ```ts
> it.effect("finds a user", () =>
>   Effect.gen(function* () {
>     const users = yield* UserRepo.Service
>     const result = yield* users.find(UserId.make("u1"))
>     expect(Option.isSome(result)).toBe(true)
>   }).pipe(Effect.provide(UserRepo.layerTest)),
> )
> ```
>
> ## Explicit synchronization
>
> - Use `Deferred` for one-shot readiness or completion signals.
> - Use `Queue` to hand test-controlled work or observed events across fibers.
> - Use `Latch` for reusable open/close coordination gates.
> - Use `Ref` for shared test observation state.
> - Coordinate through an existing lifecycle, status, or result interface. Put test-only controls on a test-control service; public interfaces expose observations required by production callers.
>
> ```ts
> it.effect("publishes exactly once", () =>
>   Effect.gen(function* () {
>     const ready = yield* Deferred.make<void>()
>
>     const fiber = yield* Effect.gen(function* () {
>       yield* Deferred.succeed(ready, undefined)
>       return yield* publisher.publishNext()
>     }).pipe(Effect.forkScoped)
>
>     yield* Deferred.await(ready)
>     const message = yield* Fiber.join(fiber)
>
>     expect(message).toEqual(expectedMessage)
>   }),
> )
> ```
>
> ## Reusable test implementations
>
> Read [`effect-services.md`](effect-services.md#test-layers) before designing a reusable test Layer. When reusable state, failure injection, or observation belongs to a real service seam, expose a `TestService` for test control and inspection while production code continues through the real `Service` tag.
>
> ```ts
> export interface Interface {
>   readonly send: (message: Message) => Effect.Effect<void, SendError>
> }
>
> export class Service extends Context.Service<Service, Interface>()(
>   "@app/Notifier",
> ) {}
>
> export interface TestInterface extends Interface {
>   readonly sentMessages: () => Effect.Effect<ReadonlyArray<Message>>
>   readonly failNextSend: (error: SendError) => Effect.Effect<void>
> }
>
> export class TestService extends Context.Service<TestService, TestInterface>()(
>   "@app/Notifier/Test",
> ) {}
>
> export const layerTest = Layer.effectContext(
>   Effect.gen(function* () {
>     const sent = yield* Ref.make<ReadonlyArray<Message>>([])
>     const nextFailure = yield* Ref.make<Option.Option<SendError>>(Option.none())
>
>     const service = TestService.of({
>       send: Effect.fn("Notifier.Test.send")(function* (message) {
>         const failure = yield* Ref.getAndSet(nextFailure, Option.none())
>         if (Option.isSome(failure)) return yield* Effect.fail(failure.value)
>         yield* Ref.update(sent, (messages) => [...messages, message])
>       }),
>       sentMessages: Effect.fn("Notifier.Test.sentMessages")(function* () {
>         return yield* Ref.get(sent)
>       }),
>       failNextSend: Effect.fn("Notifier.Test.failNextSend")(function* (error) {
>         yield* Ref.set(nextFailure, Option.some(error))
>       }),
>     })
>
>     return Context.empty().pipe(
>       Context.add(Service, service),
>       Context.add(TestService, service),
>     )
>   }),
> )
> ```
>
> Keep service members function-valued, including zero-argument operations, so `Effect.fn` applies uniformly. `Layer.mock` fits a tiny local partial implementation whose omitted members fail loudly when called.
>
> ## Configuration
>
> For tests that provide runtime configuration or choose whether to exercise Config decoding, read [`effect-configuration.md`](effect-configuration.md#providers).
>
> ## Completion check
>
> The completion check in [`testing.md`](testing.md#completion-check) passes; the test runtime matches the behavior under test; every temporal test drives time with `TestClock`, with sleeping effects started before the clock advances; concurrent readiness and ordering use explicit synchronization; reusable test implementations cross the production service tag while test controls remain on the test-control tag; observable interruption and finalization contracts are asserted; and every applicable service, retry/schedule, and configuration pointer above has been followed.

#### `effect.md`

> # Effect
>
> These defaults target Effect v4.
>
> ## Source rule
>
> Inspect the project's pinned `effect` package version and source before selecting APIs. Prefer vendored or pinned examples over remembered APIs. Consult current upstream source only when the pinned package does not answer the question.
>
> ## Branch chooser
>
> Read every branch that matches the changed behavior:
>
> - Data models, schemas, brands, variants, optional keys, or decoders: [`effect-schema-and-data.md`](effect-schema-and-data.md).
> - Services, module surfaces, Layers, runtime wiring, `Effect.fn`, or test services: [`effect-services.md`](effect-services.md).
> - Runtime config, environment variables, `ConfigProvider`, or `layerConfig`: [`effect-configuration.md`](effect-configuration.md).
> - Retry, repeat, polling, backoff, jitter, rate limits, timeouts, or pass loops: [`effect-scheduling-and-retry.md`](effect-scheduling-and-retry.md).
> - Memoization, TTL caches, concurrent lookup deduplication, or request batching: [`effect-caching.md`](effect-caching.md).
> - Streams, event sources, async iterables, queues, pubsubs, pagination, backpressure, or stream consumers: [`effect-streams.md`](effect-streams.md).
> - Outgoing HTTP, Effect `HttpClient`, status handling, or HTTP rate limiting: [`effect-http-clients.md`](effect-http-clients.md).
> - Effect tests, time, sleeps, concurrency synchronization, fakes, or test Layers: [`effect-testing.md`](effect-testing.md).
>
> ## Cross-cutting defaults
>
> - Compose workflows with `Effect.gen(function* () { ... })` and the project's established `Effect.fn` patterns.
> - Recover from the typed error channel at the narrowest boundary with a truthful response; preserve defects and interruption.
> - Use native Effect workflows. Isolate unavoidable Promise or platform APIs in their owning Adapter.
>
> ## Completion check
>
> Every matching branch has been read, every chosen Effect API has been verified in the pinned package source, and every cross-cutting default has been checked against each changed Effect path. Report any exception with concrete evidence.

#### `errors.md`

> # Errors
>
> ## Expected failures are values
>
> Every known failure mode appears in the return type as a custom tagged error, even when the immediate caller cannot recover. A caller handles the error or returns it upward. The outermost boundary translates it into a valid outcome such as an HTTP response, CLI exit code, retry decision, dead letter, or startup error message.
>
> Known failures include domain, parsing, authorization, integration, I/O, persistence, configuration, and workflow failures.
>
> Use, in order:
>
> 1. Effect in an Effect codebase.
> 2. `better-result` when available.
> 3. A small local tagged union:
>
> ```ts
> type Result<T, E extends Error> =
>   | { readonly _tag: "ok"; readonly value: T }
>   | { readonly _tag: "err"; readonly error: E };
> ```
>
> Prefer:
>
> ```ts
> Promise<Result<User, UserLookupError>>
> ```
>
> rather than a `Promise<User>` that rejects for ordinary lookup or storage failures.
>
> Promise rejection is equivalent to throwing. The module that directly owns a third-party client—an Adapter or a localized service implementation—catches unclassified rejection and translates it into a known tagged error before it crosses that module's public interface. Rejection may escape application code only for a defect.
>
> ## Defects
>
> Throw or panic only when a defect makes correct execution impossible, rather than because the current caller lacks a recovery strategy. Defects include:
>
> - violated internal invariants;
> - impossible branches;
> - temporary `notYetImplemented` paths;
> - catastrophic runtime conditions.
>
> Known configuration failures are values; the composition root reports them safely and terminates startup.
>
> Use the repository's established defect mechanism; otherwise use the runtime's native throw or panic. Reuse shared defect helpers when they carry stable semantics or serve multiple callers:
>
> ```ts
> export function casesHandled(unexpectedCase: never): never;
> export function shouldNeverHappen(msg?: string): never;
> export function notYetImplemented(msg?: string): never;
> ```
>
> Use `casesHandled` for exhaustive union handling. Keep a defect helper local until stable semantics or reuse earns shared ownership.
>
> ## Custom errors
>
> Expected failures use custom tagged errors, generally extending:
>
> - `Error`;
> - `TaggedError` from `better-result`;
> - `Schema.TaggedErrorClass` in Effect codebases.
>
> A custom error includes:
>
> - a stable tag using `as const`;
> - a useful message explaining what failed, why when known, and how to recover when actionable;
> - structured contextual fields with the relevant operation and safe domain/provider data;
> - safe telemetry fields;
> - an optional `cause: unknown`.
>
> Keep distinct failure modes as granular error types and union them at the operation boundary. Combine failures only when callers handle them the same way, they need the same observability, and structured fields preserve the useful context.
>
> The error that owns a failure constructs its stable message. Begin the message with a stable literal phrase that leads a plain-text search back to the owning error definition, then append dynamic context. Callers may add safe context or translate the error at an outer boundary. Error classification uses tags and fields rather than matching message text.
>
> Model absence according to the operation's meaning. Return an optional value when missing data is an ordinary result for the caller to interpret. Return a typed not-found error when the operation requires the value or absence violates its local invariant or precondition.
>
> ```ts
> export class UserStoreUnavailable extends Error {
>   readonly _tag = "UserStoreUnavailable" as const;
>
>   constructor(
>     readonly operation: "findActiveByEmail",
>     readonly provider: "postgres",
>     readonly cause: unknown,
>   ) {
>     super(`User store unavailable during ${operation}`);
>   }
> }
> ```
>
> Keep error unions precise at module boundaries:
>
> ```ts
> Result<User, UserNotFound | UserStoreUnavailable>
> ```
>
> Broad `AppError`-style types belong near entrypoints, orchestration, logging, and rendering layers.
>
> ## Completion check
>
> Every applicable rule above has been checked: each known failure is represented by a granular typed error or explicitly classified as a defect; throws and rejections are reserved for defects; absence has the intended optional or typed not-found meaning; error types own stable, searchable literal message prefixes and safe structured context; operation error unions remain precise; third-party rejections are translated by their owner; outer boundaries translate expected failures into valid outcomes; and failure classification uses tags and fields.

#### `imports-exports-and-files.md`

> # Imports, exports, and files
>
> ## Imports and exports
>
> Import directly from the file that owns an abstraction. Use re-export layers and barrels only as intentional package or public entrypoints.
>
> Use named imports for self-describing exported operations, classes, and focused shared helpers:
>
> ```ts
> import { parseEmailAddress } from "./email-address";
> import { PasswordReset } from "./password-reset";
> ```
>
> Import related Domain Module operations through a namespace when the module follows an established canonical API and the namespace preserves useful ownership at call sites.
>
> Use `import type` and `export type` for type-only imports and exports.
>
> Use static imports for ordinary dependencies. Use dynamic `import()` at lazy-loading, optional-runtime, plugin, or code-splitting boundaries. Resolve ordinary dependency timing and cycles through the static module structure.
>
> Export only what callers should use. Keep internal helpers private and test through public interfaces. When changed behavior makes an exported name inaccurate or changes its audience, rename it in the same change and update every caller.
>
> Use ES modules for application-owned grouping. Reserve a TypeScript `namespace` for required interop.
>
> ## Files and helpers
>
> Give each file a searchable subject that identifies what it owns. Prefer concept- or domain-qualified names over generic role names when the role alone would collide or hide ownership:
>
> ```txt
> email-address.ts
> billing-period.ts
> string-case.ts
> array.ts
> ```
>
> A shared generic helper file has an explicit stable subject. A helper may move there as soon as its meaning is generic and stable; a second consumer is useful evidence, not a prerequisite. Keep each family with its subject:
>
> - exhaustive and exceptional-control-flow helpers such as `casesHandled`, `shouldNeverHappen`, and `notYetImplemented`;
> - sensitive-value wrappers such as `Redacted`;
> - tagged-union type operations such as `Tags`, `ExtractTag`, and `ExcludeTag`;
> - common `Result` operations when the repository uses neither Effect nor `better-result`;
> - genuinely broad type operations.
>
> Domain and application policy stay with their owning modules.
>
> A file owns one cohesive concept or capability. It may contain related operations and private helpers that share that owner. Split unrelated concepts; keep helpers that make sense only inside one concept with their owner. Use cohesion and discoverability rather than file-size limits.
>
> ## Completion check
>
> Complete when every applicable rule above has been checked: imports point directly to owners and exported operations remain self-describing unless an established canonical namespace carries ownership; re-exports serve intentional public entrypoints; type-only edges use type-only syntax; dynamic imports serve a loading or runtime boundary; exports expose only caller-facing behavior and stale names change with their behavior or audience; internal helpers are tested through public interfaces; TypeScript namespaces satisfy a required interop constraint; files and shared helpers have searchable stable subjects; domain and application policy remain with their owners; and each changed file owns one cohesive concept or capability.

#### `modules-services-and-adapters.md`

> # Modules, services, and Adapters
>
> ## Roles
>
> **Domain Module**, **Application Service Module**, **Adapter Module**, and **composition root** name responsibilities, not required folders, suffixes, or TypeScript constructs.
>
> Classify code by what would make it change:
>
> - Business meaning, invariant, calculation, or legal state transition: **Domain Module**.
> - Application policy, authorization, or effect sequence: **Application Service Module**.
> - Protocol, framework, database, runtime, or third-party API: **Adapter Module**.
> - Construction or wiring: **composition root**.
>
> The normal flow is:
>
> ```txt
> external input -> inbound Adapter -> Application Service -> Domain Module
>                                            |
>                                            +-> application-owned capability
>                                            |     -> outbound Adapter -> external system
>                                            |
>                                            +-> private concrete client -> external system
> ```
>
> Domain Modules form the functional core. Application Services and Adapters form the imperative shell. An inbound Adapter may call a Domain Module directly when the operation is pure and requires only parsed input.
>
> For each changed operation:
>
> 1. Trace it from ingress to every effect and observable result.
> 2. Put intrinsic meanings, calculations, and transitions in Domain Modules.
> 3. Put application policy and effect ordering in an Application Service.
> 4. Choose private concrete clients or outbound Adapters by applying [Adapters and concrete clients](#adapters-and-concrete-clients).
> 5. Wire concrete clients and Adapters at the composition root.
>
> Apply the deletion test before adding or preserving an abstraction.
>
> ## Domain Modules
>
> A Domain Module is a pure, type-driven abstract data type centered on one domain type or tightly related family. Use one for a real domain distinction, invariant, calculation, decision, or lifecycle.
>
> A Domain Module may own its:
>
> - type and supporting types;
> - parsers and smart constructors;
> - combinators and predicates;
> - legal transitions and calculations;
> - formatting and domain representations;
> - test generators.
>
> It returns refined values, expresses expected failures as precise values, and remains independent of I/O, frameworks, persistence, ambient time, randomness, and mutable global state.
>
> Its inputs and outputs are domain values rather than protocol or persistence records. Pure permission decisions over parsed values may live here; authentication and authorization responsibilities follow the allocation below.
>
> Plain functions, immutable value classes, and static-style classes are all valid. A domain class constructs through parsers or smart constructors, keeps invalid instances unconstructable, exposes immutable state, and remains pure.
>
> ## Application Services
>
> An Application Service owns one cohesive application operation or capability. Use one when behavior coordinates authorization, domain decisions, persistence, external calls, transactions, messages, time, IDs, telemetry, or multiple entrypoints.
>
> Design a meaningful service from its explicit interface first. In plain TypeScript, use a service interface and implementation class. When an Effect service, tag, `make`, Layer, or dependency requirement changes, read and apply [`effect-services.md`](effect-services.md). Reserve service interfaces for helpers that own an application capability.
>
> An Application Service:
>
> - accepts and returns application/domain types with precise expected-error unions;
> - depends on the smallest cohesive capability services that own the needed behavior;
> - receives services, configuration, clocks, randomness, and similar capabilities explicitly;
> - owns which effects occur, under what policy, and in what order;
> - keeps its public contract independent of framework, ORM, vendor SDK, and runtime types.
>
> Plain TypeScript dependency-bearing classes receive service objects through constructors. Effect code yields stable runtime capabilities and implementation dependencies through context. Authorization evidence, scoped handles, and other operation-specific capability values remain explicit inputs when they are part of the request or domain contract. A callback dependency is appropriate when higher-order behavior itself is the capability.
>
> A service may expose multiple related methods when they share one owner and reason to change. `Service` is an honest name for a broad cohesive capability when a more specific noun would misstate its scope, as with `EmailService` or `UserService`.
>
> Build broader services by composing smaller cohesive capability services. The broader service owns operation-specific policy; the smaller services own reusable mechanisms. For example, an `EmailService` may compose an earned `EmailSender` and expose `sendWelcomeEmail` and `sendPasswordResetEmail`. Start with a private concrete client when extracting the smaller capability would only add forwarding, as described below.
>
> Application Services own policy and effect ordering while delegating substantial domain calculations and reusable mechanisms to their owning modules. Their operation bodies make sequence and decision points visible without accumulating unrelated implementations or introducing pass-through modules.
>
> ## Capability and operation names
>
> Name an interface for what the capability is, using ordinary domain or operational vocabulary that stays stable across callers: `UserStore`, `EmailSender`, or an honestly broad `EmailService`. Put specific behavior in operation names such as `findActiveByEmail` or `sendPasswordResetEmail`.
>
> Consumer-qualified capability names such as `UsersForPasswordReset` are prohibited: the consumer belongs at the call site, while the dependency keeps its stable name. Use architecture words such as `Repository`, `Gateway`, `Provider`, `Port`, or `Manager` only when that word is the capability's actual established meaning, not as a generic suffix used to manufacture a noun.
>
> Name an operation so its purpose remains clear at ordinary call sites and definition-site search results. Include domain context that distinguishes the operation; omit words that add no meaning.
>
> Start a meaningful service with its interface. When the interface and ordinary implementation naturally need the same name, use a compact `I` prefix:
>
> ```ts
> export interface IEmailService {
>   sendWelcomeEmail(...): Result<void, SendWelcomeEmailError>;
>   sendPasswordResetEmail(...): Result<void, SendPasswordResetEmailError>;
> }
>
> export class EmailService implements IEmailService {
>   // ...
> }
> ```
>
> Interfaces whose implementations already have natural distinguishing names need no prefix:
>
> ```ts
> export interface UserStore {
>   findActiveByEmail(email: EmailAddress): Promise<Result<ActiveUser, UserLookupError>>;
> }
>
> export class PostgresUserStore implements UserStore {
>   // ...
> }
> ```
>
> Name a dependency variable for the object it holds. Keep `Service`, `Store`, or `Sender` when the bare domain noun could mean a value: `emailService` is clearer than `email`. A natural plural may already communicate a collection-like capability, so both `users` and `userStore` can be clear. Preserve either clear local name rather than creating naming-only churn. When changed behavior makes a name inaccurate or changes its audience, rename it as part of the same change.
>
> Use the shortest qualifier that preserves an implementation's meaningful and searchable distinction, such as `PostgresUserStore`, `ResendEmailSender`, or `SystemClock`. Additional adjectives identify distinct observable behavior rather than construction trivia.
>
> ## Adapters and concrete clients
>
> An inbound Adapter parses an external request, event, or command; invokes an Application Service or eligible pure Domain Module; and turns the result into the external protocol.
>
> An outbound Adapter implements an application-owned capability using a concrete technology. It owns protocol/schema translation, framework lifecycle, external failure classification, safe diagnostics, and short-lived technical retries that preserve the capability's meaning.
>
> One concrete external client may remain private inside the service that owns its use while a separate Adapter would only forward calls. The owner catches and translates client failures before they cross its public interface. Extract an Adapter when it hides meaningful translation or mechanics, is reused, or supports real implementation variation.
>
> For example, an `EmailService` may initially use `ResendClient` directly. Introduce `EmailSender`, `ResendEmailSender`, and `MailgunEmailSender` when provider variation or meaningful provider mechanics appear.
>
> Before creating an Adapter or service:
>
> 1. Check existing services, clients, and Adapters.
> 2. Use an existing concrete client directly when a new Adapter would only forward and the client remains private.
> 3. Reuse an existing cohesive Adapter through its capability contract.
> 4. Extend an Adapter when the new method fits its owner and reason to change.
> 5. Create an Adapter when it hides meaningful translation or mechanics, serves multiple owners, or supports real implementation variation.
>
> Create an ADR for a lasting architectural boundary, shared pattern, provider strategy, or deliberate exception. For each new service or Adapter, record which existing owners were checked and why reuse or extension did not fit.
>
> ## Authentication and authorization
>
> Allocate authentication and authorization responsibilities as follows:
>
> - inbound Adapters verify boundary credentials and produce a parsed `Principal`, `Session`, or `CommandActor`;
> - Domain Modules define pure permission decisions over parsed values;
> - Application Services gather context and enforce those decisions while carrying out the operation;
> - Adapters translate missing credentials and denied operations into protocol outcomes.
>
> ## Completion check
>
> Complete when every changed operation has been traced and accounted for against every applicable rule in this reference:
>
> - each concern has one owner, Domain Modules remain pure, and authentication and authorization follow the stated allocation;
> - each meaningful service starts from an explicit interface, broader services compose smaller cohesive capabilities only after those seams earn their place, and orchestration keeps sequence and policy visible while delegating owned calculations and mechanisms;
> - protocol, framework, persistence, runtime, and vendor details stop at their owning Adapter or private service implementation;
> - each new abstraction passes the deletion test and existing-owner check, with required evidence or ADR recorded;
> - capability names use ordinary vocabulary that stays stable across callers, operation names remain clear at call sites and definition-site searches, stale names change with their behavior or audience, and implementation qualifiers preserve only meaningful distinctions; and
> - each entrypoint parses protocol input, invokes the owning application or pure domain operation, and renders the protocol result.

#### `parsing-and-schemas.md`

> # Parsing and schemas
>
> ## Parse boundary data
>
> Boundary code turns unknown or less-structured input into application or domain types before it enters inner code.
>
> ## Boundary representations
>
> Use a separate protocol or persistence representation when its fields, encoding, naming, optionality, or semantics differ from the application input and the separation keeps those boundary concerns out of inner code. `DTO` describes this boundary role in prose; symbols use their actual meaning, such as `CreateUserRequest`, `StripeCustomerResponse`, or `UserRecord`:
>
> ```txt
> unknown -> CreateUserRequest -> CreateUserInput -> EmailAddress/UserId/etc.
> ```
>
> When the boundary and application shapes have the same meaning and invariants, parse directly into the application input:
>
> ```txt
> unknown -> CreateUserInput
> ```
>
> A boundary schema owns its protocol or persistence representation. Derive that representation's type from the schema, keep it inside the owning boundary, and translate it into an application or domain type before calling inner code. When an Effect Schema directly produces the final branded domain type, derive that type from the Schema without an intermediate representation.
>
> ## Parser names
>
> Use names that preserve meaning:
>
> - `parseX(input): Result<X, ParseXError>` for untrusted or less-structured input;
> - `makeX(...)` / `createX(...)` for smart constructors from already-typed pieces;
> - `isX(value): value is X` for true predicates;
> - `assertX(...)` at tests or framework boundaries whose API requires throwing.
>
> Functions that refine untrusted or less-structured input are parsers named `parseX`. `validateX` and `normalizeX` are prohibited aliases for parsers.
>
> ## Schema choices
>
> Use schema libraries as boundary parsers. Choose, in order:
>
> 1. the repository's established schema library;
> 2. Effect Schema in Effect codebases;
> 3. Standard Schema compatibility for generic helpers;
> 4. Zod 4 otherwise;
> 5. a hand-written smart constructor/parser when it is clearer for a small domain type.
>
> Represent parsing failures with typed custom errors.
>
> Parse every path where less-trusted data re-enters typed code, including database reads, cache hits, RPC responses, event consumption, workflow replay, and serialized-state rehydration—even when the same process wrote the data. A write-time parser does not prove stored or replayed bytes remain valid.
>
> On a measured performance-critical path, a documented trust invariant may replace read-time parsing. Keep the unchecked representation inside its owning boundary.
>
> ## Completion check
>
> Every external or serialized input path in the changed behavior has an owning schema or parser; every value passed into inner application code is an application or domain type; every parsing failure is typed; boundary representations remain inside their owning boundaries; and every path that relies on a trust invariant instead of read-time parsing has measured evidence, documentation, and containment.

#### `persistence.md`

> # Persistence
>
> Read this reference when changed behavior reads or writes a database, cache, durable object, ORM model, or persisted record.
>
> Also read:
>
> - [`modules-services-and-adapters.md`](modules-services-and-adapters.md) for persistence capability ownership, Adapter design, and public contracts;
> - [`parsing-and-schemas.md`](parsing-and-schemas.md) when stored data is read or its representation changes;
> - [`testing.md`](testing.md) when persistence behavior changes;
> - [`workflows-transactions-and-idempotency.md`](workflows-transactions-and-idempotency.md) when transaction scope, retries, or duplicate execution may change.
>
> Define each persistence boundary around a cohesive domain capability, with table layout kept as a private implementation detail.
>
> Treat stored rows, ORM models, and cached values as serialized input under the parsing rules. Keep queries, schema details, raw records, and ORM mechanics inside the owning persistence module.
>
> ## Completion check
>
> Every changed persistence operation belongs to one cohesive domain capability; table layout, queries, schema details, raw records, and ORM mechanics remain private to the owning persistence module; every stored-data read satisfies the parsing completion check; and every other linked reference whose trigger applies has passed its completion check or has a reported exception with concrete evidence.

#### `sensitive-data-and-observability.md`

> # Sensitive data and observability
>
> Use the repository's established tracing, logging, metrics, and error-reporting hooks. Where structured tracing exists, preserve active trace context across changed requests, jobs, workflows, application modules, Adapters, and external calls.
>
> Annotate diagnostics with structured fields such as:
>
> - opaque domain IDs approved for diagnostic use;
> - operation names;
> - dependency/provider names;
> - state tags;
> - retry counts;
> - typed error tags;
> - bounded summaries derived from allowlisted fields.
>
> Treat personal data as private by default. Record only the minimum fields explicitly allowed by repository policy or established convention, after applying any required minimization or sanitization.
>
> Represent tokens, API keys, passwords, raw credentials, and other secrets with a `Redacted<T>` wrapper. Use Effect's `Redacted.Redacted` in Effect codebases or a local shared `Redacted<T>` wrapper elsewhere. Wrap these values at the boundary, preserve the wrapper through application code, and unwrap only in the module performing the final I/O operation that requires the raw value.
>
> Errors, traces, logs, metrics, reports, and snapshots contain only redacted representations of secrets and approved representations of personal data.
>
> ## Completion check
>
> Every changed credential and secret is wrapped from its input boundary through the final-I/O owner. Every added or changed diagnostic field has been verified as approved for diagnostics, an approved minimal representation of personal data, or a redacted representation of a secret. Each changed failure records all applicable diagnostic context: operation, safe identifiers, provider, typed error tag, and retry state. Existing observability hooks remain connected, and structured trace context crosses every changed boundary where tracing is established.

#### `testing.md`

> # Testing
>
> ## Test through real interfaces
>
> Every caller-visible feature has an end-to-end happy-path test through its real public entrypoint when the normal test environment can run it reliably.
>
> Add end-to-end coverage for expected error paths that the public entrypoint can exercise reliably. Cover remaining important failures at the closest real interface. Report why end-to-end coverage is impractical when unreliable third parties or unreasonable setup, runtime, or cost prevent it.
>
> Prefer tests by confidence:
>
> 1. end-to-end tests through real public entrypoints;
> 2. integration tests through real interfaces;
> 3. focused/property tests for pure Domain Modules;
> 4. unit tests for meaningful behavior rather than implementation details.
>
> Module mocking with `vi.mock` or `jest.mock` is forbidden. Replace behavior through real services and implementations:
>
> - constructor-injected interfaces/classes;
> - Effect services/Layers;
> - local database substitutes such as SQLite;
> - faithful in-memory implementations;
> - fake external implementations when needed.
>
> Assert observable outcomes:
>
> - returned values/errors;
> - persisted state;
> - emitted events/messages;
> - rendered responses;
> - sent email records in a recording/local implementation.
>
> A spy assertion is appropriate only when the interaction is itself the observable behavior. Prefer a recording implementation and inspect its public records over spying on implementation methods.
>
> ## Property tests and arbitraries
>
> Assess property-based testing for every changed invariant, transition, normalization, equivalence, ordering, idempotence, or roundtrip. Add property tests when generated inputs cover meaningful cases beyond a short example list. Apply this assessment especially to parsers, smart constructors, branded/refined types, state machines, serialization, and lawful combinators.
>
> Use `fast-check` in normal TypeScript projects. In Effect projects, prefer Effect's FastCheck integration and derive arbitraries from owning Schemas when available.
>
> Keep reusable arbitraries beside the domain module they support. Add a shared test-data entrypoint only when multiple consumers need one:
>
> ```txt
> src/billing/
>   invoice-number.ts
>   invoice-number.test.ts
>   invoice-number.arbitrary.ts
> ```
>
> Generated test data passes through the same parsers, smart constructors, and invariants as production values.
>
> ## Test implementations
>
> A dependency interface represents real ownership or variability, not a test-only desire to mock.
>
> - Keep a narrow one-off fake local to its test.
> - Export a reusable static or recording implementation when its complete behavior is useful across tests.
> - Use an established conventional name when it communicates expected behavior, such as `TestClock`.
> - Otherwise use the shortest truthful behavior/implementation qualifier, such as `InMemoryCache`, `RecordingEmailSender`, `NoopEmailSender`, or `FailingEmailSender`.
> - Use SQLite or another real local substitute when queries, schema, serialization, transactions, or protocol behavior matter.
> - Use and name an implementation as in-memory only when it faithfully preserves the complete observable contract under test.
>
> Keep production branches, exports, flags, and behavior determined by production needs. Test through an existing public interface or a faithful inert harness when no real dependency interface exists.
>
> ## Compile-time behavior
>
> When inference is public behavior, add compile-time tests using ordinary call sites without rescue annotations or casts. Assert inferred success and expected-failure types so widening regressions fail the test.
>
> ## Completion check
>
> Every changed caller-visible behavior has an end-to-end happy path or a reported concrete blocker; each expected error path is covered at the highest reliable real interface or has a reported concrete blocker; every changed property named above has been assessed and applicable property tests are present; changed public inference has compile-time success and expected-failure tests; tests cross real interfaces without module mocks; generated data preserves production invariants; production surfaces remain determined by production needs; and every reusable test implementation truthfully matches its name and complete observable contract.

#### `typescript-safety.md`

> # TypeScript safety
>
> ## Strictness and immutable values
>
> New or changed TypeScript configurations enable:
>
> - `strict: true`;
> - `noUncheckedIndexedAccess: true`;
> - `exactOptionalPropertyTypes: true`;
> - `noImplicitOverride: true`;
> - `noFallthroughCasesInSwitch: true`.
>
> A legacy configuration that cannot adopt a listed flag within the changed behavior keeps the exception scoped to that configuration and records the blocking compiler diagnostics and migration boundary.
>
> Prefer immutable values:
>
> ```ts
> type CreateUserInput = {
>   readonly email: EmailAddress;
>   readonly roles: ReadonlyArray<Role>;
> };
> ```
>
> Localize mutation inside imperative shell code, performance-sensitive internals, builders, or Adapters and hide it behind a precise interface.
>
> Exported interface methods and public class methods have explicit return types. Exported functions that return an object, union, or collection also state that return type explicitly. Write a concise return type inline; introduce a named exported result contract when its name adds domain meaning or the contract is reused. Derive the contract from an owning runtime schema instead of duplicating schema and handwritten types. Local callbacks and unexported helpers use inference when their declarations preserve the complete contract.
>
> ## Casts, `any`, and non-null assertions
>
> Resolve uncertain values with branching, parsing, refinement, or a more precise type. Reserve `any` and `as Type` for invariants TypeScript cannot express. `as const` is ordinary and needs no justification.
>
> Highly generic helpers, branding internals, interop boundaries, and combinators may need a cast because TypeScript cannot express the invariant. Every non-`as const` cast includes a Rust-like safety comment:
>
> ```ts
> // SAFETY: TypeScript cannot express the brand. parseEmailAddress checked the normalized string before branding. Callers cannot construct EmailAddress except through this parser.
> return normalized as EmailAddress;
> ```
>
> A necessary `any` includes a targeted lint suppression and justification:
>
> ```ts
> // oxlint-disable-next-line no-explicit-any -- SAFETY: This helper preserves arbitrary function parameters; TypeScript cannot express this variadic constraint without any.
> type Fn = (...args: any[]) => unknown;
> ```
>
> Branch, parse, or refine optional values so required values are present before use.
>
> ## Completion check
>
> Changed source compiles under the repository's strict settings. Every new or changed TypeScript configuration enables all listed flags, or each scoped legacy exception records its blocking diagnostics and migration boundary. Mutable state is contained. Exported interface methods, public class methods, and exported functions returning objects, unions, or collections have explicit return types; a named exported result contract adds domain meaning or serves more than one declaration, and derives from an owning schema where one exists. Every non-`as const` cast has a valid safety comment, every `any` has a targeted lint suppression and safety justification, and no changed non-null assertion remains.

#### `workflows-transactions-and-idempotency.md`

> # Workflows, transactions, and idempotency
>
> Use an ordinary call when an operation requires no atomic state change. Use a database transaction when changes within one datastore must commit or roll back together.
>
> Use a saga or durable workflow when progress must survive process loss or redelivery, or the operation requires long delays, compensation, resumability, timers, human approval, cross-service coordination, or multiple transaction boundaries.
>
> Retry ownership and durability follow the operation's authority, side-effect safety, and required lifetime. Project and domain design determine the concrete arrangement.
>
> Close database transactions before network calls or long-running work.
>
> Require an explicit idempotency strategy when an operation has a real duplicate-execution path through retries, redelivery, workflow resumption, concurrent submission, or repeated external requests. Choose the strategy at the layer that owns duplication and record it in the design:
>
> - an idempotency key when a caller can provide a stable identity for repeated requests;
> - a natural unique constraint when duplicates violate an existing uniqueness invariant;
> - a deduplication record when a redelivered message or event has a stable identity;
> - a state-machine transition guard when the current state determines whether the mutation may run;
> - a transactional outbox when a state change and intent to publish must be recorded atomically;
> - a transactional inbox when message deduplication and the resulting state change must commit atomically.
>
> For every retried side effect, state the guarantee that makes repeated execution safe, such as stable-key deduplication, a uniqueness constraint, or a guarded state transition.
>
> ## Completion check
>
> Every changed operation is assigned to an ordinary call, database transaction, or durable workflow using the criteria above; every database transaction closes before network or long-running work; every retry's owner and durability match the operation's authority, side-effect safety, and required lifetime; every retried side effect has a stated repeated-execution guarantee; and every real duplicate-execution path has a recorded idempotency strategy at the layer that owns it.

---

## `coding-standards-go`

**Decision:** Keep

### Availability

- **Local:** `SKILL.md` SHA-256 `a8c9c6ae6b`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: coding-standards-go
> description: Go coding standards for correct-by-construction implementation. Use for Go engineering, code review, TDD planning, or when another skill needs the user's Go standards.
> ---
>
> # Go Coding Standards
>
> Build correct-by-construction Go. Apply these rules when the change introduces or alters the concern they govern. Use existing project conventions when they are compatible. Do not add machinery for concerns the task does not have.
>
> ## Principles
>
> ### 1. Repository before invention
>
> - Search existing contracts, packages, helpers, adapters, tests, and dependencies before adding a library, pattern, interface, helper, constant, validation rule, workflow, or file.
> - Reuse the existing abstraction when it fits.
> - Make the smallest coherent improvement.
> - Do not add migration, rollout, compatibility, or backfill machinery unless there is a current constraint or explicit user intent.
>
> ### 2. Name the actual abstraction
>
> - Name functions, types, workflows, metrics, and files for what they do, not what the first caller needs.
> - Do not name generic code after one use case.
> - Docstrings and metric descriptions must match the real trigger condition.
> - Names should survive the next caller.
>
> ### 3. Preserve absence
>
> - Do not coerce nil, empty, or missing state into a fake concrete default.
> - Preserve the absent state with nil, an empty string, a typed nil, a `Found bool`, or an explicit `Absent` value when the distinction matters.
> - Branch explicitly in the consumer.
> - Add a metric or log on meaningful absent branches so rollout state is visible.
>
> ### 4. Parse at the edge
>
> - Treat external input, config, serialized data, proto payloads, persisted data, and third-party responses as boundary input.
> - Check bad shapes before parsing. A check that continues with the original unrefined value is not enough.
> - Keep protocol and persistence DTOs as explicit boundary projections.
> - Verify external contracts against a real response when possible. Use `curl`, a small `go run`, or `protojson.Marshal` output. Do not ship a guessed contract.
>
> ### 5. Put invariants in one place
>
> - Constants live in the narrowest package all callers can import.
> - Validation belongs with the domain type, contract owner, or boundary parser that owns the invariant.
> - Business logic belongs in the service or application layer, not in handlers.
> - If another layer already enforces an invariant, do not duplicate it with a different rule.
>
> ### 6. Trust infrastructure
>
> - Check database constraints, framework middleware, and platform guarantees before writing duplicate service-layer checks.
> - If the database has `UNIQUE` or `ON CONFLICT DO NOTHING`, do not build a fetch-then-compare path that can race.
> - Use typed conflict errors, `rowsAffected == 0`, or existing platform signals directly when they express the condition.
>
> ### 7. Own boundaries and files
>
> - A new `.go` file needs a real boundary, a cohesive helper cluster, a public type worth discovering by file name, or a subsystem imported directly by other packages.
> - A single private helper used by one or two functions should usually live in the file that owns the caller.
> - Keep framework, persistence, protocol, and runtime types at the composition root or inside adapters.
> - Avoid pass-through wrappers and mega-interfaces that hide no policy, invariant, sequencing, or translation.
>
> ### 8. Keep functions cognitively simple
>
> - Keep cognitive complexity under 15.
> - Prefer early returns so the happy path stays shallow.
> - Extract a named helper for a decision, not for the caller.
> - Prefer `switch` or a lookup table over long `else if` chains when the branches map values.
> - For Go, run `gocognit -over 15 <package>` when a function is getting hard to read.
>
> ### 9. Own side effects and concurrency
>
> - Pass `context.Context` through external calls and long-running work.
> - Acquire resources in the scope that owns their lifetime and release them on every exit.
> - Do not perform I/O or acquire resources at import time.
> - Package-level mutable maps are unsafe across goroutines unless protected. Prefer a function, immutable map, or synchronization.
> - Bound fan-out, propagate cancellation, and wait for child work when concurrent work belongs to the current operation.
>
> ### 10. Test public behavior first
>
> - Test caller-visible behavior before private helpers.
> - Cover every validation rule, guard, precondition, and error branch with inputs that trigger that branch.
> - Assert results, persisted state, messages, responses, adapter records, or errors that callers can observe.
> - Use production seams for replacement. Avoid tests that only prove private call order.
> - Match evidence depth to risk. Use the real database, runtime, or migration path when the claim depends on it.
>
> ### 11. Mock carefully
>
> - Use exact call counts with a known `Times(N)` when using gomock.
> - Use broad matchers only for context, logger, or opaque dependencies.
> - Use typed values for identifier-shaped parameters, seeded through builders or fixtures.
> - Put expectations at the test site or in an opt-in helper the test calls explicitly.
> - Do not use `Skip*Mock`, `Allow*Mock`, or opt-out flags on test-case structs.
>
> ### 12. Commerce work stack
>
> Use these rules when working in the commerce Go stack or a similar payment path.
>
> - For amount parsing, check `""`, `"."`, `".50"`, `"+"`, `"-1"`, `"abc"`, `"0"`, leading and trailing whitespace, and mixed case before writing the happy path.
> - Reject zero-amount inputs in financial paths when zero is not valid.
> - Use the approved EVM address equality helper instead of plain string equality when address casing can vary.
> - Use `common.Address{}.Hex()` for the zero EVM address when that package is already in use.
> - Put a `defer` that mutates step state after validation, so validation failures do not leave the step stuck.
> - When handlers reject a proto field, add the matching field behavior annotation or proto comment so the proto carries the contract.
> - Before implementing from a TDD, extract required metrics, log fields, monitor expressions, and runbook queries into a checklist.
>
> ## Completion criterion
>
> For each applicable principle, cite the supporting source, test, validation output, or blocker. Do not present an unsupported claim as verified.

---

## `coding-standards-ts`

**Decision:** Revamp as a larger progressive-disclosure skill inspired by dmmulroy/coding-standards

### Availability

- **Local:** `SKILL.md` SHA-256 `ae11455a21`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: coding-standards-ts
> description: TypeScript coding standards for correct-by-construction implementation. Use for TypeScript engineering, code review, TDD planning, or when another skill needs the user's TypeScript standards.
> ---
>
> # TypeScript Coding Standards
>
> Build correct-by-construction TypeScript. Apply a principle when the change introduces or alters the concern it governs. Apply it across contracts, behavior, data flow, state, effects, and verification. Do not add machinery for absent concerns.
>
> ## Principles
>
> ### 1. Repository before invention
>
> - Inspect existing contracts, modules, adapters, tests, dependencies, and project conventions before introducing a library, pattern, module, seam, helper, or validation rule.
> - Make the smallest coherent improvement.
> - Speculative abstractions, migrations, rollouts, and compatibility layers require a concrete current constraint or explicit user intent.
>
> ### 2. Parse at the boundary
>
> - Treat external, serialized, persisted, framework-shaped, and configuration values as `unknown` boundary input.
> - A parser returns a refined value that flows inward. Checking a value and then continuing with the original raw value is not enough.
> - Never trust decoded data with `as`.
> - Keep protocol and persistence DTOs as explicit projections defined at the boundary.
> - Treat every serialization, process, worker, queue, network, or storage hop as a new boundary. Cross it with serializable DTOs and parse again.
> - At the composition root, parse environment and configuration once, then translate raw platform bindings into typed configuration and narrow application capabilities.
>
> ### 3. Make invalid states unrepresentable
>
> - Put domain invariants on the domain type or module that owns them.
> - Use precise operation inputs and required values. Push optionality outward.
> - Prefer branded types, discriminated unions, readonly value objects, or small domain modules for distinctions that prevent realistic misuse.
> - Prefer state machines or discriminated unions over contradictory booleans.
> - Use exhaustive case analysis for closed variants. Avoid default branches that hide newly added cases.
> - Preserve absence when it matters. Do not turn missing, null, undefined, or empty values into fake defaults just to simplify the next line.
>
> ### 4. Expected failures are values
>
> - Model expected failures with typed result channels, discriminated unions, or custom error types with stable literal tags.
> - Do not hide expected failures in thrown exceptions or rejected promises.
> - Catch `unknown` only where it can be classified, recovered from, or translated.
> - Detect cancellation before doing additional work.
> - Keep original causes internally when useful, but expose only safe structured projections.
>
> ### 5. Design deep modules around real seams
>
> - A module should hide meaningful invariants, policy, sequencing, translation, or side-effect ownership.
> - Application service modules own cohesive use cases and sequence effects through narrow application-owned ports.
> - Adapter modules own boundary translation and technology mechanics.
> - Keep raw external framework, SDK, protocol, and persistence types at the composition root or inside adapters.
> - Reject pass-through wrappers, mega-interfaces, and shallow modules that add indirection without leverage.
>
> ### 6. Every side effect has an owner
>
> - Acquire each resource in the scope that owns its lifetime and release it on every exit.
> - No floating promises. Every promise is awaited, returned, collected, or handed to explicit detached-work machinery.
> - Detached work needs an owner for lifetime, cancellation, rejection handling, and observability.
> - Modules do not perform I/O or acquire resources at import time.
> - When fan-out is useful, bound it, propagate cancellation, await child work, and prevent it from outliving the owning scope.
>
> ### 7. Make mutation retry-safe
>
> - Make retried commands idempotent.
> - Guard concurrent transitions atomically.
> - Do not hold database transactions open across network calls.
> - Use a transactional outbox or equivalent when commit and delivery must agree.
> - Persist coordination state only when progress must survive crashes or redelivery.
>
> ### 8. Observe without exposing
>
> - Secrets never enter errors, logs, traces, metrics, snapshots, or diagnostic strings.
> - Wrap sensitive values in redaction-safe types at ingress when practical.
> - Record stable operation, dependency, state, retry, correlation, and error-tag fields. Do not serialize arbitrary payloads, thrown values, or environments.
> - Preserve existing reporting hooks and keep telemetry out of domain decisions.
>
> ### 9. Verify behavior through real seams
>
> - Assert caller-visible results, expected failures, persisted state, messages, responses, or adapter records.
> - Replace dependencies through production seams. Avoid module patching and method spies for internal collaborators.
> - Control time, randomness, IDs, cancellation, and external behavior through real seams.
> - Match evidence depth to risk.
> - Use property tests for general invariants when they pay for themselves.
> - Verify database and runtime claims against the actual implementation when those semantics matter.
>
> ### 10. Preserve TypeScript's checks
>
> - Keep strict compiler settings and precise readonly contracts.
> - Avoid `any`, non-null assertions, unchecked casts, hidden mutation, and accidental thenables.
> - Treat every unavoidable escape hatch as an unsafe block. Keep it local behind a precise interface and add `SAFETY:` with the runtime invariant that makes it sound.
> - Document exported functions, classes, constants, types, and public methods when their contract, invariants, side effects, or expected failures are not obvious from the type.
> - Use `@throws` only for defects or boundary-required exception contracts.
> - Never weaken project-wide checks for a local change.
>
> ### 11. Keep functions cognitively simple
>
> - Keep cognitive complexity under 15 when practical.
> - Flatten nesting with guard clauses.
> - Extract named helpers for decisions.
> - Prefer lookup tables or maps when branches map values to values.
> - For TypeScript, use ESLint cognitive-complexity rules when the project has them.
>
> ## Completion criterion
>
> Treat every applicable principle as a proof obligation. Done means each principle is either inapplicable or supported by repository inspection, static checks, focused tests, or evidence from the actual runtime. For each blocked obligation, report the unsupported claim, blocker, risk, and remaining check.

---

## `diagnosing-bugs`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `7a0779480f`; support: `agents/openai.yaml`, `scripts/hitl-loop.template.sh`
- **dmmulroy:** `SKILL.md` SHA-256 `7a0779480f`; support: `agents/openai.yaml`, `scripts/hitl-loop.template.sh`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`, `scripts/hitl-loop.template.sh`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: diagnosing-bugs
> description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
> ---
>
> # Diagnosing Bugs
>
> A discipline for hard bugs. Skip phases only when explicitly justified.
>
> When exploring the codebase, read `CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
>
> ## Phase 1 — Build a feedback loop
>
> **This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug — one that goes red on _this_ bug — you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.
>
> Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**
>
> ### Ways to construct one — try them in roughly this order
>
> 1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
> 2. **Curl / HTTP script** against a running dev server.
> 3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
> 4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
> 5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
> 6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
> 7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
> 8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
> 9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
> 10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.
>
> Build the right feedback loop, and the bug is 90% fixed.
>
> ### Tighten the loop
>
> Treat the loop as a product. Once you have _a_ loop, **tighten** it:
>
> - Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
> - Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
> - Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)
>
> A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight — a debugging superpower.
>
> ### Non-deterministic bugs
>
> The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not — keep raising the rate until it's debuggable.
>
> ### When you genuinely cannot build a loop
>
> Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.
>
> ### Completion criterion — a tight loop that goes red
>
> Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** — a script path, a test invocation, a curl — that you have **already run at least once** (paste the invocation and its output), and that is:
>
> - [ ] **Red-capable** — it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring" — it must be able to _catch this specific bug_.
> - [ ] **Deterministic** — same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
> - [ ] **Fast** — seconds, not minutes.
> - [ ] **Agent-runnable** — you can run it unattended; a human in the loop only via `scripts/hitl-loop.template.sh`.
>
> If you catch yourself reading code to build a theory before this command exists, **stop — jumping straight to a hypothesis is the exact failure this skill prevents.** No red-capable command, no Phase 2.
>
> ## Phase 2 — Reproduce + minimise
>
> Run the loop. Watch it go red — the bug appears.
>
> Confirm:
>
> - [ ] The loop produces the failure mode the **user** described — not a different failure that happens to be nearby. Wrong bug = wrong fix.
> - [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
> - [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.
>
> ### Minimise
>
> Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut — keep only what's load-bearing for the failure.
>
> Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.
>
> Done when **every remaining element is load-bearing** — removing any one of them makes the loop go green.
>
> Do not proceed until you have reproduced **and** minimised.
>
> ## Phase 3 — Hypothesise
>
> Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.
>
> Each hypothesis must be **falsifiable**: state the prediction it makes.
>
> > Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."
>
> If you cannot state the prediction, the hypothesis is a vibe — discard or sharpen it.
>
> **Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it — proceed with your ranking if the user is AFK.
>
> ## Phase 4 — Instrument
>
> Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**
>
> Tool preference:
>
> 1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
> 2. **Targeted logs** at the boundaries that distinguish hypotheses.
> 3. Never "log everything and grep".
>
> **Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.
>
> **Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.
>
> ## Phase 5 — Fix + regression test
>
> Write the regression test **before the fix** — but only if there is a **correct seam** for it.
>
> A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.
>
> **If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.
>
> If a correct seam exists:
>
> 1. Turn the minimised repro into a failing test at that seam.
> 2. Watch it fail.
> 3. Apply the fix.
> 4. Watch it pass.
> 5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.
>
> ## Phase 6 — Cleanup + post-mortem
>
> Required before declaring done:
>
> - [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
> - [ ] Regression test passes (or absence of seam is documented)
> - [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
> - [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
> - [ ] The hypothesis that turned out correct is stated in the commit / PR message — so the next debugger learns
>
> **Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling) hand off to the `/improve-codebase-architecture` skill with the specifics. Make the recommendation **after** the fix is in, not before — you have more information now than when you started.

#### dmmulroy `SKILL.md`

> ---
> name: diagnosing-bugs
> description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
> ---
>
> # Diagnosing Bugs
>
> A discipline for hard bugs. Skip phases only when explicitly justified.
>
> When exploring the codebase, read `CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.
>
> ## Phase 1 — Build a feedback loop
>
> **This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug — one that goes red on _this_ bug — you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.
>
> Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**
>
> ### Ways to construct one — try them in roughly this order
>
> 1. **Failing test** at whatever seam reaches the bug — unit, integration, e2e.
> 2. **Curl / HTTP script** against a running dev server.
> 3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
> 4. **Headless browser script** (Playwright / Puppeteer) — drives the UI, asserts on DOM/console/network.
> 5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
> 6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
> 7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
> 8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
> 9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
> 10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.
>
> Build the right feedback loop, and the bug is 90% fixed.
>
> ### Tighten the loop
>
> Treat the loop as a product. Once you have _a_ loop, **tighten** it:
>
> - Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
> - Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
> - Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)
>
> A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight — a debugging superpower.
>
> ### Non-deterministic bugs
>
> The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not — keep raising the rate until it's debuggable.
>
> ### When you genuinely cannot build a loop
>
> Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.
>
> ### Completion criterion — a tight loop that goes red
>
> Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** — a script path, a test invocation, a curl — that you have **already run at least once** (paste the invocation and its output), and that is:
>
> - [ ] **Red-capable** — it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring" — it must be able to _catch this specific bug_.
> - [ ] **Deterministic** — same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
> - [ ] **Fast** — seconds, not minutes.
> - [ ] **Agent-runnable** — you can run it unattended; a human in the loop only via `scripts/hitl-loop.template.sh`.
>
> If you catch yourself reading code to build a theory before this command exists, **stop — jumping straight to a hypothesis is the exact failure this skill prevents.** No red-capable command, no Phase 2.
>
> ## Phase 2 — Reproduce + minimise
>
> Run the loop. Watch it go red — the bug appears.
>
> Confirm:
>
> - [ ] The loop produces the failure mode the **user** described — not a different failure that happens to be nearby. Wrong bug = wrong fix.
> - [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
> - [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.
>
> ### Minimise
>
> Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut — keep only what's load-bearing for the failure.
>
> Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.
>
> Done when **every remaining element is load-bearing** — removing any one of them makes the loop go green.
>
> Do not proceed until you have reproduced **and** minimised.
>
> ## Phase 3 — Hypothesise
>
> Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.
>
> Each hypothesis must be **falsifiable**: state the prediction it makes.
>
> > Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."
>
> If you cannot state the prediction, the hypothesis is a vibe — discard or sharpen it.
>
> **Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it — proceed with your ranking if the user is AFK.
>
> ## Phase 4 — Instrument
>
> Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**
>
> Tool preference:
>
> 1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
> 2. **Targeted logs** at the boundaries that distinguish hypotheses.
> 3. Never "log everything and grep".
>
> **Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.
>
> **Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.
>
> ## Phase 5 — Fix + regression test
>
> Write the regression test **before the fix** — but only if there is a **correct seam** for it.
>
> A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.
>
> **If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.
>
> If a correct seam exists:
>
> 1. Turn the minimised repro into a failing test at that seam.
> 2. Watch it fail.
> 3. Apply the fix.
> 4. Watch it pass.
> 5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.
>
> ## Phase 6 — Cleanup + post-mortem
>
> Required before declaring done:
>
> - [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
> - [ ] Regression test passes (or absence of seam is documented)
> - [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
> - [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
> - [ ] The hypothesis that turned out correct is stated in the commit / PR message — so the next debugger learns
>
> **Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling) hand off to the `/improve-codebase-architecture` skill with the specifics. Make the recommendation **after** the fix is in, not before — you have more information now than when you started.

---

## `domain-modeling`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `b0dd522fbf`; support: none
- **Matt:** `SKILL.md` SHA-256 `152e2c9723`; support: `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `152e2c9723`; support: `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `agents/openai.yaml`

### Exact comparison

#### Local vs Matt

- `SKILL.md`: different.

```diff
--- Local/domain-modeling/SKILL.md
+++ Matt/domain-modeling/SKILL.md
@@ -1,144 +1,74 @@
 ---
 name: domain-modeling
-description: Build and sharpen a project's domain model. Use when the user wants precise terminology, ubiquitous language, CONTEXT.md updates, or ADRs for hard-to-reverse design decisions.
+description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
 ---
 
 # Domain Modeling
 
-Use this skill when the work changes domain language or durable design decisions. Reading a glossary is normal repo hygiene. This skill is for changing the model, resolving terms, or recording decisions.
+Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)
 
 ## File structure
 
-Most repos have one context:
+Most repos have a single context:
 
-```txt
+```
 /
 ├── CONTEXT.md
 ├── docs/
 │   └── adr/
+│       ├── 0001-event-sourced-orders.md
+│       └── 0002-postgres-for-write-model.md
 └── src/
 ```
 
-Multi-context repos use a root `CONTEXT-MAP.md`:
+If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:
 
-```txt
+```
 /
 ├── CONTEXT-MAP.md
-├── docs/adr/
-└── src/
-    ├── ordering/CONTEXT.md
-    └── billing/CONTEXT.md
+├── docs/
+│   └── adr/                          ← system-wide decisions
+├── src/
+│   ├── ordering/
+│   │   ├── CONTEXT.md
+│   │   └── docs/adr/                 ← context-specific decisions
+│   └── billing/
+│       ├── CONTEXT.md
+│       └── docs/adr/
 ```
 
-Create files lazily. If no `CONTEXT.md` exists, create it only when the first term is resolved. If no `docs/adr/` exists, create it only when the first ADR is needed.
+Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.
 
-## Start of session
+## During the session
 
-1. Search for `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, decision indexes, and equivalent domain-language docs.
-2. If `CONTEXT-MAP.md` exists, use it to choose the right context. Ask only when the context is ambiguous.
-3. Read relevant code when a term or relationship can be confirmed from implementation.
-4. Keep implementation details out of `CONTEXT.md`.
+### Challenge against the glossary
 
-## Challenge language
+When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
 
-Call out problems immediately:
+### Sharpen fuzzy language
 
-- A term conflicts with the glossary.
-- The user uses one word for two different concepts.
-- The user uses two words for the same concept.
-- The plan conflicts with code behavior.
-- A relationship between concepts is vague.
+When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
 
-Use concrete scenarios to force precision.
+### Discuss concrete scenarios
 
-Example:
+When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.
 
-```txt
-CONTEXT.md defines "Customer" as the buyer organization, but this plan uses customer for an API user. Which concept do you mean?
-```
+### Cross-reference with code
 
-## CONTEXT.md format
+When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"
 
-Use this shape:
+### Update CONTEXT.md inline
 
-```md
-# <Context Name>
+When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
 
-One or two sentences describing what this context is and why it exists.
+`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
 
-## Language
+### Offer ADRs sparingly
 
-**Order**:
-One or two sentences defining the term.
-_Avoid_: Purchase, transaction
+Only offer to create an ADR when all three are true:
 
-**Invoice**:
-A request for payment sent to a customer after delivery.
-_Avoid_: Bill, payment request
-```
+1. **Hard to reverse** — the cost of changing your mind later is meaningful
+2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
+3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons
 
-Rules:
-
-- Be opinionated. Pick the canonical term.
-- Keep definitions to one or two sentences.
-- Define what the concept is, not every behavior it has.
-- Include project-specific domain terms only.
-- Put implementation decisions in ADRs, not `CONTEXT.md`.
-- Group terms under subheadings when clusters emerge.
-
-For multiple contexts, `CONTEXT-MAP.md` should list contexts and relationships:
-
-```md
-# Context Map
-
-## Contexts
-
-- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
-- [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments
-
-## Relationships
-
-- **Ordering -> Billing**: Ordering emits `OrderPlaced`; Billing consumes it to generate invoices.
-```
-
-## ADR rules
-
-Offer an ADR only when all three are true:
-
-1. Hard to reverse.
-2. Surprising without context.
-3. The result of a real trade-off.
-
-Skip ADRs for easy-to-change decisions, obvious choices, and implementation notes that the code already explains.
-
-ADRs live in `docs/adr/` with sequential names:
-
-```txt
-0001-use-postgres-for-write-model.md
-0002-communicate-with-domain-events.md
-```
-
-Minimal ADR shape:
-
-```md
-# <Short decision title>
-
-One to three sentences: context, decision, and why.
-```
-
-Optional sections are allowed only when useful:
-
-- Status,
-- Considered Options,
-- Consequences.
-
-## During implementation or design
-
-- Update `CONTEXT.md` as soon as a term is resolved.
-- Draft an ADR as soon as a qualifying decision crystallizes.
-- Cite the source of a term or decision when possible.
-- If the code and docs disagree, stop and ask which source should change.
-
-## Completion criterion
-
-Done means the plan's language matches the project's language, every resolved durable term is captured, and every qualifying decision has either an ADR or an explicit reason no ADR was written.
+If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).
```
- Only in Local: none.
- Only in Matt: `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `agents/openai.yaml`.
- Matching support files: none.
- Changed support files: none.
#### Local vs dmmulroy

- `SKILL.md`: different.

```diff
--- Local/domain-modeling/SKILL.md
+++ dmmulroy/domain-modeling/SKILL.md
@@ -1,144 +1,74 @@
 ---
 name: domain-modeling
-description: Build and sharpen a project's domain model. Use when the user wants precise terminology, ubiquitous language, CONTEXT.md updates, or ADRs for hard-to-reverse design decisions.
+description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
 ---
 
 # Domain Modeling
 
-Use this skill when the work changes domain language or durable design decisions. Reading a glossary is normal repo hygiene. This skill is for changing the model, resolving terms, or recording decisions.
+Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)
 
 ## File structure
 
-Most repos have one context:
+Most repos have a single context:
 
-```txt
+```
 /
 ├── CONTEXT.md
 ├── docs/
 │   └── adr/
+│       ├── 0001-event-sourced-orders.md
+│       └── 0002-postgres-for-write-model.md
 └── src/
 ```
 
-Multi-context repos use a root `CONTEXT-MAP.md`:
+If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:
 
-```txt
+```
 /
 ├── CONTEXT-MAP.md
-├── docs/adr/
-└── src/
-    ├── ordering/CONTEXT.md
-    └── billing/CONTEXT.md
+├── docs/
+│   └── adr/                          ← system-wide decisions
+├── src/
+│   ├── ordering/
+│   │   ├── CONTEXT.md
+│   │   └── docs/adr/                 ← context-specific decisions
+│   └── billing/
+│       ├── CONTEXT.md
+│       └── docs/adr/
 ```
 
-Create files lazily. If no `CONTEXT.md` exists, create it only when the first term is resolved. If no `docs/adr/` exists, create it only when the first ADR is needed.
+Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.
 
-## Start of session
+## During the session
 
-1. Search for `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, decision indexes, and equivalent domain-language docs.
-2. If `CONTEXT-MAP.md` exists, use it to choose the right context. Ask only when the context is ambiguous.
-3. Read relevant code when a term or relationship can be confirmed from implementation.
-4. Keep implementation details out of `CONTEXT.md`.
+### Challenge against the glossary
 
-## Challenge language
+When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
 
-Call out problems immediately:
+### Sharpen fuzzy language
 
-- A term conflicts with the glossary.
-- The user uses one word for two different concepts.
-- The user uses two words for the same concept.
-- The plan conflicts with code behavior.
-- A relationship between concepts is vague.
+When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
 
-Use concrete scenarios to force precision.
+### Discuss concrete scenarios
 
-Example:
+When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.
 
-```txt
-CONTEXT.md defines "Customer" as the buyer organization, but this plan uses customer for an API user. Which concept do you mean?
-```
+### Cross-reference with code
 
-## CONTEXT.md format
+When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"
 
-Use this shape:
+### Update CONTEXT.md inline
 
-```md
-# <Context Name>
+When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
 
-One or two sentences describing what this context is and why it exists.
+`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
 
-## Language
+### Offer ADRs sparingly
 
-**Order**:
-One or two sentences defining the term.
-_Avoid_: Purchase, transaction
+Only offer to create an ADR when all three are true:
 
-**Invoice**:
-A request for payment sent to a customer after delivery.
-_Avoid_: Bill, payment request
-```
+1. **Hard to reverse** — the cost of changing your mind later is meaningful
+2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
+3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons
 
-Rules:
-
-- Be opinionated. Pick the canonical term.
-- Keep definitions to one or two sentences.
-- Define what the concept is, not every behavior it has.
-- Include project-specific domain terms only.
-- Put implementation decisions in ADRs, not `CONTEXT.md`.
-- Group terms under subheadings when clusters emerge.
-
-For multiple contexts, `CONTEXT-MAP.md` should list contexts and relationships:
-
-```md
-# Context Map
-
-## Contexts
-
-- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
-- [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments
-
-## Relationships
-
-- **Ordering -> Billing**: Ordering emits `OrderPlaced`; Billing consumes it to generate invoices.
-```
-
-## ADR rules
-
-Offer an ADR only when all three are true:
-
-1. Hard to reverse.
-2. Surprising without context.
-3. The result of a real trade-off.
-
-Skip ADRs for easy-to-change decisions, obvious choices, and implementation notes that the code already explains.
-
-ADRs live in `docs/adr/` with sequential names:
-
-```txt
-0001-use-postgres-for-write-model.md
-0002-communicate-with-domain-events.md
-```
-
-Minimal ADR shape:
-
-```md
-# <Short decision title>
-
-One to three sentences: context, decision, and why.
-```
-
-Optional sections are allowed only when useful:
-
-- Status,
-- Considered Options,
-- Consequences.
-
-## During implementation or design
-
-- Update `CONTEXT.md` as soon as a term is resolved.
-- Draft an ADR as soon as a qualifying decision crystallizes.
-- Cite the source of a term or decision when possible.
-- If the code and docs disagree, stop and ask which source should change.
-
-## Completion criterion
-
-Done means the plan's language matches the project's language, every resolved durable term is captured, and every qualifying decision has either an ADR or an explicit reason no ADR was written.
+If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).
```
- Only in Local: none.
- Only in dmmulroy: `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `agents/openai.yaml`.
- Matching support files: none.
- Changed support files: none.
#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `ADR-FORMAT.md`, `CONTEXT-FORMAT.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: domain-modeling
> description: Build and sharpen a project's domain model. Use when the user wants precise terminology, ubiquitous language, CONTEXT.md updates, or ADRs for hard-to-reverse design decisions.
> ---
>
> # Domain Modeling
>
> Use this skill when the work changes domain language or durable design decisions. Reading a glossary is normal repo hygiene. This skill is for changing the model, resolving terms, or recording decisions.
>
> ## File structure
>
> Most repos have one context:
>
> ```txt
> /
> ├── CONTEXT.md
> ├── docs/
> │   └── adr/
> └── src/
> ```
>
> Multi-context repos use a root `CONTEXT-MAP.md`:
>
> ```txt
> /
> ├── CONTEXT-MAP.md
> ├── docs/adr/
> └── src/
>     ├── ordering/CONTEXT.md
>     └── billing/CONTEXT.md
> ```
>
> Create files lazily. If no `CONTEXT.md` exists, create it only when the first term is resolved. If no `docs/adr/` exists, create it only when the first ADR is needed.
>
> ## Start of session
>
> 1. Search for `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, decision indexes, and equivalent domain-language docs.
> 2. If `CONTEXT-MAP.md` exists, use it to choose the right context. Ask only when the context is ambiguous.
> 3. Read relevant code when a term or relationship can be confirmed from implementation.
> 4. Keep implementation details out of `CONTEXT.md`.
>
> ## Challenge language
>
> Call out problems immediately:
>
> - A term conflicts with the glossary.
> - The user uses one word for two different concepts.
> - The user uses two words for the same concept.
> - The plan conflicts with code behavior.
> - A relationship between concepts is vague.
>
> Use concrete scenarios to force precision.
>
> Example:
>
> ```txt
> CONTEXT.md defines "Customer" as the buyer organization, but this plan uses customer for an API user. Which concept do you mean?
> ```
>
> ## CONTEXT.md format
>
> Use this shape:
>
> ```md
> # <Context Name>
>
> One or two sentences describing what this context is and why it exists.
>
> ## Language
>
> **Order**:
> One or two sentences defining the term.
> _Avoid_: Purchase, transaction
>
> **Invoice**:
> A request for payment sent to a customer after delivery.
> _Avoid_: Bill, payment request
> ```
>
> Rules:
>
> - Be opinionated. Pick the canonical term.
> - Keep definitions to one or two sentences.
> - Define what the concept is, not every behavior it has.
> - Include project-specific domain terms only.
> - Put implementation decisions in ADRs, not `CONTEXT.md`.
> - Group terms under subheadings when clusters emerge.
>
> For multiple contexts, `CONTEXT-MAP.md` should list contexts and relationships:
>
> ```md
> # Context Map
>
> ## Contexts
>
> - [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
> - [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments
>
> ## Relationships
>
> - **Ordering -> Billing**: Ordering emits `OrderPlaced`; Billing consumes it to generate invoices.
> ```
>
> ## ADR rules
>
> Offer an ADR only when all three are true:
>
> 1. Hard to reverse.
> 2. Surprising without context.
> 3. The result of a real trade-off.
>
> Skip ADRs for easy-to-change decisions, obvious choices, and implementation notes that the code already explains.
>
> ADRs live in `docs/adr/` with sequential names:
>
> ```txt
> 0001-use-postgres-for-write-model.md
> 0002-communicate-with-domain-events.md
> ```
>
> Minimal ADR shape:
>
> ```md
> # <Short decision title>
>
> One to three sentences: context, decision, and why.
> ```
>
> Optional sections are allowed only when useful:
>
> - Status,
> - Considered Options,
> - Consequences.
>
> ## During implementation or design
>
> - Update `CONTEXT.md` as soon as a term is resolved.
> - Draft an ADR as soon as a qualifying decision crystallizes.
> - Cite the source of a term or decision when possible.
> - If the code and docs disagree, stop and ask which source should change.
>
> ## Completion criterion
>
> Done means the plan's language matches the project's language, every resolved durable term is captured, and every qualifying decision has either an ADR or an explicit reason no ADR was written.

#### Matt `SKILL.md`

> ---
> name: domain-modeling
> description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
> ---
>
> # Domain Modeling
>
> Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)
>
> ## File structure
>
> Most repos have a single context:
>
> ```
> /
> ├── CONTEXT.md
> ├── docs/
> │   └── adr/
> │       ├── 0001-event-sourced-orders.md
> │       └── 0002-postgres-for-write-model.md
> └── src/
> ```
>
> If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:
>
> ```
> /
> ├── CONTEXT-MAP.md
> ├── docs/
> │   └── adr/                          ← system-wide decisions
> ├── src/
> │   ├── ordering/
> │   │   ├── CONTEXT.md
> │   │   └── docs/adr/                 ← context-specific decisions
> │   └── billing/
> │       ├── CONTEXT.md
> │       └── docs/adr/
> ```
>
> Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.
>
> ## During the session
>
> ### Challenge against the glossary
>
> When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
>
> ### Sharpen fuzzy language
>
> When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
>
> ### Discuss concrete scenarios
>
> When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.
>
> ### Cross-reference with code
>
> When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"
>
> ### Update CONTEXT.md inline
>
> When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
>
> `CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
>
> ### Offer ADRs sparingly
>
> Only offer to create an ADR when all three are true:
>
> 1. **Hard to reverse** — the cost of changing your mind later is meaningful
> 2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
> 3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons
>
> If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

#### dmmulroy `SKILL.md`

> ---
> name: domain-modeling
> description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
> ---
>
> # Domain Modeling
>
> Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)
>
> ## File structure
>
> Most repos have a single context:
>
> ```
> /
> ├── CONTEXT.md
> ├── docs/
> │   └── adr/
> │       ├── 0001-event-sourced-orders.md
> │       └── 0002-postgres-for-write-model.md
> └── src/
> ```
>
> If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:
>
> ```
> /
> ├── CONTEXT-MAP.md
> ├── docs/
> │   └── adr/                          ← system-wide decisions
> ├── src/
> │   ├── ordering/
> │   │   ├── CONTEXT.md
> │   │   └── docs/adr/                 ← context-specific decisions
> │   └── billing/
> │       ├── CONTEXT.md
> │       └── docs/adr/
> ```
>
> Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.
>
> ## During the session
>
> ### Challenge against the glossary
>
> When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
>
> ### Sharpen fuzzy language
>
> When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."
>
> ### Discuss concrete scenarios
>
> When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.
>
> ### Cross-reference with code
>
> When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"
>
> ### Update CONTEXT.md inline
>
> When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
>
> `CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.
>
> ### Offer ADRs sparingly
>
> Only offer to create an ADR when all three are true:
>
> 1. **Hard to reverse** — the cost of changing your mind later is meaningful
> 2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
> 3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons
>
> If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

---

## `grill-me`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `89f02c3174`; support: none
- **Matt:** `SKILL.md` SHA-256 `6189dfceb7`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `6189dfceb7`; support: `agents/openai.yaml`

### Exact comparison

#### Local vs Matt

- `SKILL.md`: different.

```diff
--- Local/grill-me/SKILL.md
+++ Matt/grill-me/SKILL.md
@@ -1,36 +1,7 @@
 ---
 name: grill-me
-description: Relentlessly interview the user one question at a time to pressure-test a plan, design, or topic until you reach shared understanding. Use when the user types /grill-me or says "grill me", "stress-test this", "poke holes in this", "interrogate this plan", "challenge this", or "quiz me on X" to check their own understanding. Surfaces hidden assumptions and unresolved branches before any code is written. Not for executing a task or writing code.
+description: A relentless interview to sharpen a plan or design.
+disable-model-invocation: true
 ---
 
-# grill-me
-
-Invert the usual flow: interrogate the user's plan, design, or topic instead of implementing it. The goal is shared understanding, not agreement. Do not write code during a grilling session.
-
-## Rules
-
-- One question per turn. Never bundle. Wait for the answer before the next one.
-- Pair every question with your recommended answer and a one-sentence rationale. "What do you think?" alone is lazy.
-- Resolve from the source before asking. If reading the codebase or a doc answers it, do that instead of asking.
-- Walk the decision tree depth-first. Finish one branch before opening another. If decision B depends on A, ask A first.
-- Target the highest-uncertainty branch first, not the pieces already settled.
-
-## When the user wants to test their own understanding ("quiz me on X")
-
-- Ask, then let them answer before you reveal anything. Do not spoon-feed.
-- If they are stuck, escalate hints one rung at a time (conceptual, then specific, then near-answer), widening the question rather than handing over the answer.
-- After they attempt, give the correct answer plus one sharper follow-up.
-
-## End condition
-
-Stop when every load-bearing branch is resolved, or a contradiction forces a revision. Then output a short summary: decisions locked in, assumptions surfaced, open risks.
-
-## Output per turn
-
-```
-Q[i]: <one focused question>
-Recommended: <your call + one-sentence why>   (or: Found in <file>: <evidence>. Confirm?)
-```
-
-Inspired by Matt Pocock's grill-me (MIT).
-
+Run a `/grilling` session.
```
- Only in Local: none.
- Only in Matt: `agents/openai.yaml`.
- Matching support files: none.
- Changed support files: none.
#### Local vs dmmulroy

- `SKILL.md`: different.

```diff
--- Local/grill-me/SKILL.md
+++ dmmulroy/grill-me/SKILL.md
@@ -1,36 +1,7 @@
 ---
 name: grill-me
-description: Relentlessly interview the user one question at a time to pressure-test a plan, design, or topic until you reach shared understanding. Use when the user types /grill-me or says "grill me", "stress-test this", "poke holes in this", "interrogate this plan", "challenge this", or "quiz me on X" to check their own understanding. Surfaces hidden assumptions and unresolved branches before any code is written. Not for executing a task or writing code.
+description: A relentless interview to sharpen a plan or design.
+disable-model-invocation: true
 ---
 
-# grill-me
-
-Invert the usual flow: interrogate the user's plan, design, or topic instead of implementing it. The goal is shared understanding, not agreement. Do not write code during a grilling session.
-
-## Rules
-
-- One question per turn. Never bundle. Wait for the answer before the next one.
-- Pair every question with your recommended answer and a one-sentence rationale. "What do you think?" alone is lazy.
-- Resolve from the source before asking. If reading the codebase or a doc answers it, do that instead of asking.
-- Walk the decision tree depth-first. Finish one branch before opening another. If decision B depends on A, ask A first.
-- Target the highest-uncertainty branch first, not the pieces already settled.
-
-## When the user wants to test their own understanding ("quiz me on X")
-
-- Ask, then let them answer before you reveal anything. Do not spoon-feed.
-- If they are stuck, escalate hints one rung at a time (conceptual, then specific, then near-answer), widening the question rather than handing over the answer.
-- After they attempt, give the correct answer plus one sharper follow-up.
-
-## End condition
-
-Stop when every load-bearing branch is resolved, or a contradiction forces a revision. Then output a short summary: decisions locked in, assumptions surfaced, open risks.
-
-## Output per turn
-
-```
-Q[i]: <one focused question>
-Recommended: <your call + one-sentence why>   (or: Found in <file>: <evidence>. Confirm?)
-```
-
-Inspired by Matt Pocock's grill-me (MIT).
-
+Run a `/grilling` session.
```
- Only in Local: none.
- Only in dmmulroy: `agents/openai.yaml`.
- Matching support files: none.
- Changed support files: none.
#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: grill-me
> description: Relentlessly interview the user one question at a time to pressure-test a plan, design, or topic until you reach shared understanding. Use when the user types /grill-me or says "grill me", "stress-test this", "poke holes in this", "interrogate this plan", "challenge this", or "quiz me on X" to check their own understanding. Surfaces hidden assumptions and unresolved branches before any code is written. Not for executing a task or writing code.
> ---
>
> # grill-me
>
> Invert the usual flow: interrogate the user's plan, design, or topic instead of implementing it. The goal is shared understanding, not agreement. Do not write code during a grilling session.
>
> ## Rules
>
> - One question per turn. Never bundle. Wait for the answer before the next one.
> - Pair every question with your recommended answer and a one-sentence rationale. "What do you think?" alone is lazy.
> - Resolve from the source before asking. If reading the codebase or a doc answers it, do that instead of asking.
> - Walk the decision tree depth-first. Finish one branch before opening another. If decision B depends on A, ask A first.
> - Target the highest-uncertainty branch first, not the pieces already settled.
>
> ## When the user wants to test their own understanding ("quiz me on X")
>
> - Ask, then let them answer before you reveal anything. Do not spoon-feed.
> - If they are stuck, escalate hints one rung at a time (conceptual, then specific, then near-answer), widening the question rather than handing over the answer.
> - After they attempt, give the correct answer plus one sharper follow-up.
>
> ## End condition
>
> Stop when every load-bearing branch is resolved, or a contradiction forces a revision. Then output a short summary: decisions locked in, assumptions surfaced, open risks.
>
> ## Output per turn
>
> ```
> Q[i]: <one focused question>
> Recommended: <your call + one-sentence why>   (or: Found in <file>: <evidence>. Confirm?)
> ```
>
> Inspired by Matt Pocock's grill-me (MIT).

#### Matt `SKILL.md`

> ---
> name: grill-me
> description: A relentless interview to sharpen a plan or design.
> disable-model-invocation: true
> ---
>
> Run a `/grilling` session.

#### dmmulroy `SKILL.md`

> ---
> name: grill-me
> description: A relentless interview to sharpen a plan or design.
> disable-model-invocation: true
> ---
>
> Run a `/grilling` session.

---

## `grill-me-with-docs`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `f760304522`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: grill-me-with-docs
> description: Project-aware grilling. Interview the user one question at a time to pressure-test a plan or design against the repo's existing docs, decisions, and code, then capture what crystallizes into CONTEXT.md and ADRs inline. Use when the user types /grill-me-with-docs or asks to "grill this against the codebase", "stress-test this plan in this project", or wants terminology and decisions aligned before implementing. Use grill-me instead for a greenfield topic with no repo.
> ---
>
> # grill-me-with-docs
>
> The project-aware sibling of grill-me. Same one-question-at-a-time discipline, but every question is grounded in what the project already says. Do not write feature code during the session.
>
> ## Before grilling
>
> Read what exists: `CONTEXT.md` (or `CONTEXT-MAP.md` for multi-context layouts), `docs/adr/*`, the root `README`, and the relevant code. Index the terminology and prior decisions.
>
> ## Rules
>
> - One question per turn, each with your recommended answer. Wait for the answer.
> - If the codebase or a doc answers it, read it and confirm rather than ask.
> - Ground each question in a source: "CONTEXT.md defines 'session' as a 30-minute window, but your plan uses it for the auth token. Which did you mean?"
> - Flag conflicts immediately, between the plan and the glossary, or between the user's stated behavior and the actual code.
> - Walk the tree depth-first, dependencies first.
>
> ## Capture as you go
>
> ### CONTEXT.md
>
> - A term gets resolved, update `CONTEXT.md` now, not at the end.
> - Domain terms only. No implementation details, specs, or scratch notes.
> - Create `CONTEXT.md` on first resolved term if it is absent.
> - If `CONTEXT-MAP.md` exists, use it to choose the right context file. Ask only when the context is ambiguous.
> - Pick one canonical term and list rejected synonyms under `_Avoid_` when useful.
> - Keep definitions to one or two sentences that define what the concept is.
>
> Use this shape:
>
> ```md
> **Order**:
> A customer request that can be accepted, fulfilled, cancelled, or billed.
> _Avoid_: Purchase, transaction
> ```
>
> ### ADRs
>
> Offer an ADR only when all three are true:
>
> 1. The decision is hard to reverse.
> 2. The decision would be surprising without context.
> 3. The decision came from a real trade-off.
>
> Skip ADRs for obvious choices, easy-to-change choices, and implementation details the code already explains.
>
> ADRs live in `docs/adr/` and use sequential names like `0001-use-postgres-for-write-model.md`. A minimal ADR is enough:
>
> ```md
> # <Short decision title>
>
> One to three sentences: context, decision, and why.
> ```
>
> ## End condition
>
> Stop when open branches are resolved and the plan's language matches the project's. Output the locked-in decisions and list the docs you touched.
>
> Inspired by Matt Pocock's grill-with-docs (MIT).

---

## `grill-with-docs`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `610d091047`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `610d091047`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: grill-with-docs
> description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
> disable-model-invocation: true
> ---
>
> Run a `/grilling` session, using the `/domain-modeling` skill.

#### dmmulroy `SKILL.md`

> ---
> name: grill-with-docs
> description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
> disable-model-invocation: true
> ---
>
> Run a `/grilling` session, using the `/domain-modeling` skill.

---

## `grilling`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `44331dda57`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `44331dda57`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: grilling
> description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
> ---
>
> Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.
>
> Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.
>
> If a *fact* can be found by exploring the environment (filesystem, tools, etc.), look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer.
>
> Do not act on it until I confirm we have reached a shared understanding.

#### dmmulroy `SKILL.md`

> ---
> name: grilling
> description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
> ---
>
> Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.
>
> Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.
>
> If a *fact* can be found by exploring the environment (filesystem, tools, etc.), look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer.
>
> Do not act on it until I confirm we have reached a shared understanding.

---

## `handoff`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `57c9f1f392`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `57c9f1f392`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: handoff
> description: Compact the current conversation into a handoff document for another agent to pick up.
> argument-hint: "What will the next session be used for?"
> disable-model-invocation: true
> ---
>
> Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.
>
> Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.
>
> Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.
>
> Redact any sensitive information, such as API keys, passwords, or personally identifiable information.
>
> If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

#### dmmulroy `SKILL.md`

> ---
> name: handoff
> description: Compact the current conversation into a handoff document for another agent to pick up.
> argument-hint: "What will the next session be used for?"
> disable-model-invocation: true
> ---
>
> Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.
>
> Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.
>
> Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.
>
> Redact any sensitive information, such as API keys, passwords, or personally identifiable information.
>
> If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

---

## `herdr`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `c43a78b330`; support: none
- **dmmulroy:** `SKILL.md` SHA-256 `2ddac3a3c3`; support: none

### Exact comparison

#### Local vs dmmulroy

- `SKILL.md`: different.

```diff
--- Local/herdr/SKILL.md
+++ dmmulroy/herdr/SKILL.md
@@ -1,60 +1,195 @@
 ---
 name: herdr
-description: Control Herdr workspaces, tabs, panes, and coding agents through its CLI when running inside a Herdr-managed pane.
+description: "Control Herdr, a terminl multiplexer for coding agents. Use Herdr to inspect or control panes, tabs, workspaces, terminals, run commands, and or starting and monitoring background processes like dev servers. Use for subagent when the user or another skills explicitly asks for or requies subagents. Requires HERDR_ENV=1."
 ---
 
-# Herdr agent workflow
+# Herdr
 
-Before using this skill, check that `HERDR_ENV=1`. If it is not, explain that the current process is not inside Herdr and stop.
+Herdr organizes terminals into workspaces, tabs, and panes, recognizes coding agents running inside panes, and exposes the current session through the `herdr` CLI.
 
-Herdr workspaces are project contexts, tabs are subcontexts, and panes are real terminals. IDs can change when items close, so list current resources instead of reusing stale IDs.
+Before issuing any control command, verify that this agent is running inside a Herdr-managed pane:
 
-## Discover
+```bash
+test "${HERDR_ENV:-}" = 1
+```
+
+If the check fails, say that you are not running inside Herdr and stop. Do not inspect or control the focused Herdr session from outside Herdr.
+
+When the check passes, the `herdr` binary in `PATH` talks to the current session. Use it to inspect neighboring work, create terminal layout, start agents and commands, read output, and wait for state changes.
+
+## Learn the current CLI
+
+The installed binary is the authority for command syntax. Start with:
+
+```bash
+herdr --help
+```
+
+Then print the relevant command group by running the group without a subcommand:
+
+```bash
+herdr agent
+herdr pane
+herdr workspace
+herdr tab
+herdr worktree
+herdr terminal
+herdr notification
+herdr integration
+herdr session
+```
+
+Do not run bare `herdr` for discovery; it launches or attaches the TUI. Do not probe a mutating nested command by omitting arguments. Commands such as `herdr workspace create` are valid with defaults and will execute.
+
+Most control commands return JSON. Read identifiers and state from those responses instead of predicting them.
+
+## Understand layout, panes, and agents
+
+Choose the primitive that matches the job:
+
+- Workspace, tab, and pane topology organize terminal locations.
+- Pane commands control raw terminals, shells, tests, servers, input, and output.
+- Agent commands control the recognized coding agent currently occupying a pane.
+
+A pane exists whether or not it contains an agent. `agent start` requires an existing available shell pane and never creates, splits, or moves layout. Use pane commands for ordinary processes. Use agent commands when Herdr must validate agent identity or interpret `idle`, `working`, `blocked`, `done`, and `unknown` lifecycle states.
+
+Agent commands accept either a unique live agent name or the pane ID currently hosting that agent. They do not accept terminal IDs or bare agent-kind labels. Names must match `[a-z][a-z0-9_-]{0,31}` and be unique among live agents. A name follows the current pane occupant and is cleared when that agent exits, is released, or is replaced.
+
+`idle` means the agent is ready for input and its tab has been seen in the focused Herdr UI. `done` is the same underlying idle state after unseen background work finishes. Focusing the tab or targeting the pane or agent with a focus command marks it seen. CLI reads do not mark it seen. `blocked` means Herdr recognized an approval or question UI. `unknown` means an agent is present but Herdr cannot classify it confidently; it does not prove completion.
+
+## Use IDs and caller context
+
+Public IDs are opaque stable handles:
+
+- workspace: `w1`
+- tab: `w1:t1`
+- pane: `w1:p1`
+
+Closed tab and pane IDs are not reused. A pane moved into another workspace receives a new workspace-qualified pane ID. After `pane move`, continue with `.result.move_result.pane.pane_id` or the live agent name. The old value is reported as `.result.move_result.previous_pane_id`; only the moved process's inherited caller context keeps resolving that old ID, so do not use it as a general agent target.
+
+Herdr injects the caller's context into each managed pane:
+
+```bash
+printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
+```
+
+Prefer `--current` when a pane command should target the calling pane. Omitting a target may use the UI-focused pane, which can belong to the user or another client.
+
+Discover live state with:
 
 ```bash
 herdr workspace list
-herdr tab list
-herdr pane list
+herdr tab list --workspace "$HERDR_WORKSPACE_ID"
+herdr pane current --current
+herdr pane list --workspace "$HERDR_WORKSPACE_ID"
 herdr agent list
 ```
 
-The focused pane is the current agent's pane. Do not control it through Herdr unless the user explicitly asks.
+Creation responses expose the IDs to use next. `workspace create` returns `.result.workspace`, `.result.tab`, and `.result.root_pane`. `tab create` returns `.result.tab` and `.result.root_pane`. `pane split` returns the new pane as `.result.pane`.
 
-## Create and manage workspaces and tabs
+## Start and coordinate an agent
+
+Default to a sibling pane in the current tab and the current working directory. Do not create a workspace, tab, worktree, or different cwd unless the user explicitly requests that topology or location.
+
+Honor a direction requested by the user. Otherwise inspect the caller pane:
 
 ```bash
-herdr workspace create --cwd /path/to/project --label project --no-focus
-herdr workspace focus <workspace-id>
-herdr workspace rename <workspace-id> <label>
-herdr workspace close <workspace-id>
-
-herdr tab create --workspace <workspace-id> --label logs --no-focus
-herdr tab focus <tab-id>
-herdr tab rename <tab-id> <label>
-herdr tab close <tab-id>
+herdr pane layout --pane "$HERDR_PANE_ID"
 ```
 
-## Split panes and run commands
+Split a wide pane to the right and a narrow or tall pane down. Avoid repeated same-direction splits that create unusably narrow columns or short rows. Keep the user's focus in the calling pane and explicitly preserve the caller's working directory:
 
 ```bash
-herdr pane split --current --direction right --no-focus
-herdr pane split --current --direction down --no-focus
-herdr pane run <pane-id> "npm test"
-herdr pane read <pane-id> --source recent-unwrapped --lines 100
-herdr pane close <pane-id>
+herdr pane split --current --direction right --cwd "$PWD" --no-focus
 ```
 
-Parse the new pane ID from `result.pane.pane_id` in the split response. Prefer `pane run` over separate text and Enter operations.
+Replace `right` with `down` when appropriate. Read the new pane ID from `.result.pane.pane_id`.
 
-## Coordinate agents
+An available shell pane must be at its interactive prompt, with the shell itself in the foreground and no foreground command, editor, or agent running. Start a supported agent in that pane with a useful unique name:
 
 ```bash
-herdr agent list
-herdr agent start codex --cwd /path/to/project --split right --no-focus -- codex
-herdr agent focus <agent-target>
-herdr agent read <agent-target> --source recent-unwrapped --lines 100
-herdr agent send <agent-target> "review the current changes"
-herdr agent wait <agent-target> --status done --timeout 120000
+herdr agent start reviewer --kind codex --pane <returned-pane-id>
 ```
 
-Use `--no-focus` when creating background work. Inspect existing output with `read`, and use `wait` only for future state or output. Do not guess IDs.
+Use the kind requested by the user. Run `herdr agent` to inspect the installed kind list and options. Pass native agent arguments only after `--`:
+
+```bash
+herdr agent start reviewer --kind codex --pane <returned-pane-id> -- <agent-args...>
+```
+
+`agent start` returns only after Herdr detects the expected agent in the same pane and considers it ready for interactive input. It defaults to a 30-second startup timeout.
+
+Submit work through the agent surface:
+
+```bash
+herdr agent prompt reviewer "Review the current diff and report only actionable findings." --wait --timeout 120000
+```
+
+`agent prompt` atomically submits text and encoded Enter while honoring the pane's live bracketed-paste mode. For normal agent work, `--wait` is enough: it waits for the first settled `idle`, `done`, or `blocked` state. Do not repeat those defaults with `--until`.
+
+A prompt sent from a non-working state must produce an observed lifecycle change within five seconds. Otherwise Herdr returns `agent_prompt_stalled` instead of waiting indefinitely. This wait tracks lifecycle state, not an individual turn; if the agent is already working, completion of the active turn may satisfy it.
+
+Use `--until` only for a state-specific workflow, such as waiting for an already-running agent to request input:
+
+```bash
+herdr agent wait reviewer --until blocked --timeout 120000
+```
+
+Without `--until`, standalone `agent wait` uses the same settled-state defaults as `agent prompt --wait`.
+
+Use logical keys for interactive agent UI controls:
+
+```bash
+herdr agent send-keys reviewer esc
+herdr agent send-keys reviewer ctrl+c
+```
+
+Herdr validates all keys before writing any bytes. Read the result through the resolved agent:
+
+```bash
+herdr agent get reviewer
+herdr agent read reviewer --source recent-unwrapped --lines 120
+```
+
+If a wait fails or returns `blocked`, inspect `agent get` and `agent read` before deciding what input to send. Use the pane surface only when raw terminal control is intentional.
+
+## Run an ordinary command in another pane
+
+Create a sibling pane with the same geometry rule, preserve the caller's working directory, and keep user focus unchanged:
+
+```bash
+herdr pane split --current --direction right --cwd "$PWD" --no-focus
+```
+
+Read the new pane ID from `.result.pane.pane_id`, then run and inspect the command:
+
+```bash
+herdr pane run <returned-pane-id> "just test"
+herdr pane wait-output <returned-pane-id> --match "test result" --timeout 120000
+herdr pane read <returned-pane-id> --source recent-unwrapped --lines 120
+```
+
+`pane run` atomically sends command text and Enter. `pane wait-output` searches the selected snapshot immediately, so output that already exists can match. Use `--match <text>` for a literal substring or `--regex <pattern>` for a Rust regular expression. Omitting `--timeout` allows an indefinite wait.
+
+Use the read source that matches the task:
+
+- `visible`: the currently rendered viewport.
+- `recent`: recent rendered output, including soft wraps.
+- `recent-unwrapped`: recent output with soft wraps joined; prefer it for logs and transcripts.
+- `detection`: the plain-text bottom-buffer snapshot used for agent detection.
+
+Use `--format ansi` when colors and terminal styling are evidence. Otherwise use text.
+
+`--lines` asks Herdr for more rows from the pane's available screen and host scrollback. If increasing it does not reveal more of a completed response, the pane is probably running the agent on the terminal's alternate screen. Rows that leave the alternate screen do not enter Herdr's host scrollback, so a larger line count cannot recover them.
+
+After that failed read, ask the agent to write its complete response as Markdown in a temporary directory and reply only with the file path, then read the file directly. Use this only as a fallback; do not request file output in the initial prompt.
+
+## Safety and coordination rules
+
+- Use `--no-focus` for background work unless the user asked to switch context.
+- Use `--current`, an explicit pane ID, or a unique agent name. Do not rely on another client's focused pane.
+- Parse IDs from JSON responses. Do not derive them from sidebar order or examples.
+- Do not close workspaces, tabs, panes, or sessions you did not create unless the user explicitly asked.
+- Never run `herdr server stop` from an active session unless the user explicitly intends to stop the server and its pane processes.
+- Never kill the main Herdr process. Use named test sessions for experiments that need an isolated server.
+- CLI server errors are JSON on stderr with exit status 1. CLI syntax errors exit with status 2.
```
- Only in Local: none.
- Only in dmmulroy: none.
- Matching support files: none.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: herdr
> description: Control Herdr workspaces, tabs, panes, and coding agents through its CLI when running inside a Herdr-managed pane.
> ---
>
> # Herdr agent workflow
>
> Before using this skill, check that `HERDR_ENV=1`. If it is not, explain that the current process is not inside Herdr and stop.
>
> Herdr workspaces are project contexts, tabs are subcontexts, and panes are real terminals. IDs can change when items close, so list current resources instead of reusing stale IDs.
>
> ## Discover
>
> ```bash
> herdr workspace list
> herdr tab list
> herdr pane list
> herdr agent list
> ```
>
> The focused pane is the current agent's pane. Do not control it through Herdr unless the user explicitly asks.
>
> ## Create and manage workspaces and tabs
>
> ```bash
> herdr workspace create --cwd /path/to/project --label project --no-focus
> herdr workspace focus <workspace-id>
> herdr workspace rename <workspace-id> <label>
> herdr workspace close <workspace-id>
>
> herdr tab create --workspace <workspace-id> --label logs --no-focus
> herdr tab focus <tab-id>
> herdr tab rename <tab-id> <label>
> herdr tab close <tab-id>
> ```
>
> ## Split panes and run commands
>
> ```bash
> herdr pane split --current --direction right --no-focus
> herdr pane split --current --direction down --no-focus
> herdr pane run <pane-id> "npm test"
> herdr pane read <pane-id> --source recent-unwrapped --lines 100
> herdr pane close <pane-id>
> ```
>
> Parse the new pane ID from `result.pane.pane_id` in the split response. Prefer `pane run` over separate text and Enter operations.
>
> ## Coordinate agents
>
> ```bash
> herdr agent list
> herdr agent start codex --cwd /path/to/project --split right --no-focus -- codex
> herdr agent focus <agent-target>
> herdr agent read <agent-target> --source recent-unwrapped --lines 100
> herdr agent send <agent-target> "review the current changes"
> herdr agent wait <agent-target> --status done --timeout 120000
> ```
>
> Use `--no-focus` when creating background work. Inspect existing output with `read`, and use `wait` only for future state or output. Do not guess IDs.

#### dmmulroy `SKILL.md`

> ---
> name: herdr
> description: "Control Herdr, a terminl multiplexer for coding agents. Use Herdr to inspect or control panes, tabs, workspaces, terminals, run commands, and or starting and monitoring background processes like dev servers. Use for subagent when the user or another skills explicitly asks for or requies subagents. Requires HERDR_ENV=1."
> ---
>
> # Herdr
>
> Herdr organizes terminals into workspaces, tabs, and panes, recognizes coding agents running inside panes, and exposes the current session through the `herdr` CLI.
>
> Before issuing any control command, verify that this agent is running inside a Herdr-managed pane:
>
> ```bash
> test "${HERDR_ENV:-}" = 1
> ```
>
> If the check fails, say that you are not running inside Herdr and stop. Do not inspect or control the focused Herdr session from outside Herdr.
>
> When the check passes, the `herdr` binary in `PATH` talks to the current session. Use it to inspect neighboring work, create terminal layout, start agents and commands, read output, and wait for state changes.
>
> ## Learn the current CLI
>
> The installed binary is the authority for command syntax. Start with:
>
> ```bash
> herdr --help
> ```
>
> Then print the relevant command group by running the group without a subcommand:
>
> ```bash
> herdr agent
> herdr pane
> herdr workspace
> herdr tab
> herdr worktree
> herdr terminal
> herdr notification
> herdr integration
> herdr session
> ```
>
> Do not run bare `herdr` for discovery; it launches or attaches the TUI. Do not probe a mutating nested command by omitting arguments. Commands such as `herdr workspace create` are valid with defaults and will execute.
>
> Most control commands return JSON. Read identifiers and state from those responses instead of predicting them.
>
> ## Understand layout, panes, and agents
>
> Choose the primitive that matches the job:
>
> - Workspace, tab, and pane topology organize terminal locations.
> - Pane commands control raw terminals, shells, tests, servers, input, and output.
> - Agent commands control the recognized coding agent currently occupying a pane.
>
> A pane exists whether or not it contains an agent. `agent start` requires an existing available shell pane and never creates, splits, or moves layout. Use pane commands for ordinary processes. Use agent commands when Herdr must validate agent identity or interpret `idle`, `working`, `blocked`, `done`, and `unknown` lifecycle states.
>
> Agent commands accept either a unique live agent name or the pane ID currently hosting that agent. They do not accept terminal IDs or bare agent-kind labels. Names must match `[a-z][a-z0-9_-]{0,31}` and be unique among live agents. A name follows the current pane occupant and is cleared when that agent exits, is released, or is replaced.
>
> `idle` means the agent is ready for input and its tab has been seen in the focused Herdr UI. `done` is the same underlying idle state after unseen background work finishes. Focusing the tab or targeting the pane or agent with a focus command marks it seen. CLI reads do not mark it seen. `blocked` means Herdr recognized an approval or question UI. `unknown` means an agent is present but Herdr cannot classify it confidently; it does not prove completion.
>
> ## Use IDs and caller context
>
> Public IDs are opaque stable handles:
>
> - workspace: `w1`
> - tab: `w1:t1`
> - pane: `w1:p1`
>
> Closed tab and pane IDs are not reused. A pane moved into another workspace receives a new workspace-qualified pane ID. After `pane move`, continue with `.result.move_result.pane.pane_id` or the live agent name. The old value is reported as `.result.move_result.previous_pane_id`; only the moved process's inherited caller context keeps resolving that old ID, so do not use it as a general agent target.
>
> Herdr injects the caller's context into each managed pane:
>
> ```bash
> printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
> ```
>
> Prefer `--current` when a pane command should target the calling pane. Omitting a target may use the UI-focused pane, which can belong to the user or another client.
>
> Discover live state with:
>
> ```bash
> herdr workspace list
> herdr tab list --workspace "$HERDR_WORKSPACE_ID"
> herdr pane current --current
> herdr pane list --workspace "$HERDR_WORKSPACE_ID"
> herdr agent list
> ```
>
> Creation responses expose the IDs to use next. `workspace create` returns `.result.workspace`, `.result.tab`, and `.result.root_pane`. `tab create` returns `.result.tab` and `.result.root_pane`. `pane split` returns the new pane as `.result.pane`.
>
> ## Start and coordinate an agent
>
> Default to a sibling pane in the current tab and the current working directory. Do not create a workspace, tab, worktree, or different cwd unless the user explicitly requests that topology or location.
>
> Honor a direction requested by the user. Otherwise inspect the caller pane:
>
> ```bash
> herdr pane layout --pane "$HERDR_PANE_ID"
> ```
>
> Split a wide pane to the right and a narrow or tall pane down. Avoid repeated same-direction splits that create unusably narrow columns or short rows. Keep the user's focus in the calling pane and explicitly preserve the caller's working directory:
>
> ```bash
> herdr pane split --current --direction right --cwd "$PWD" --no-focus
> ```
>
> Replace `right` with `down` when appropriate. Read the new pane ID from `.result.pane.pane_id`.
>
> An available shell pane must be at its interactive prompt, with the shell itself in the foreground and no foreground command, editor, or agent running. Start a supported agent in that pane with a useful unique name:
>
> ```bash
> herdr agent start reviewer --kind codex --pane <returned-pane-id>
> ```
>
> Use the kind requested by the user. Run `herdr agent` to inspect the installed kind list and options. Pass native agent arguments only after `--`:
>
> ```bash
> herdr agent start reviewer --kind codex --pane <returned-pane-id> -- <agent-args...>
> ```
>
> `agent start` returns only after Herdr detects the expected agent in the same pane and considers it ready for interactive input. It defaults to a 30-second startup timeout.
>
> Submit work through the agent surface:
>
> ```bash
> herdr agent prompt reviewer "Review the current diff and report only actionable findings." --wait --timeout 120000
> ```
>
> `agent prompt` atomically submits text and encoded Enter while honoring the pane's live bracketed-paste mode. For normal agent work, `--wait` is enough: it waits for the first settled `idle`, `done`, or `blocked` state. Do not repeat those defaults with `--until`.
>
> A prompt sent from a non-working state must produce an observed lifecycle change within five seconds. Otherwise Herdr returns `agent_prompt_stalled` instead of waiting indefinitely. This wait tracks lifecycle state, not an individual turn; if the agent is already working, completion of the active turn may satisfy it.
>
> Use `--until` only for a state-specific workflow, such as waiting for an already-running agent to request input:
>
> ```bash
> herdr agent wait reviewer --until blocked --timeout 120000
> ```
>
> Without `--until`, standalone `agent wait` uses the same settled-state defaults as `agent prompt --wait`.
>
> Use logical keys for interactive agent UI controls:
>
> ```bash
> herdr agent send-keys reviewer esc
> herdr agent send-keys reviewer ctrl+c
> ```
>
> Herdr validates all keys before writing any bytes. Read the result through the resolved agent:
>
> ```bash
> herdr agent get reviewer
> herdr agent read reviewer --source recent-unwrapped --lines 120
> ```
>
> If a wait fails or returns `blocked`, inspect `agent get` and `agent read` before deciding what input to send. Use the pane surface only when raw terminal control is intentional.
>
> ## Run an ordinary command in another pane
>
> Create a sibling pane with the same geometry rule, preserve the caller's working directory, and keep user focus unchanged:
>
> ```bash
> herdr pane split --current --direction right --cwd "$PWD" --no-focus
> ```
>
> Read the new pane ID from `.result.pane.pane_id`, then run and inspect the command:
>
> ```bash
> herdr pane run <returned-pane-id> "just test"
> herdr pane wait-output <returned-pane-id> --match "test result" --timeout 120000
> herdr pane read <returned-pane-id> --source recent-unwrapped --lines 120
> ```
>
> `pane run` atomically sends command text and Enter. `pane wait-output` searches the selected snapshot immediately, so output that already exists can match. Use `--match <text>` for a literal substring or `--regex <pattern>` for a Rust regular expression. Omitting `--timeout` allows an indefinite wait.
>
> Use the read source that matches the task:
>
> - `visible`: the currently rendered viewport.
> - `recent`: recent rendered output, including soft wraps.
> - `recent-unwrapped`: recent output with soft wraps joined; prefer it for logs and transcripts.
> - `detection`: the plain-text bottom-buffer snapshot used for agent detection.
>
> Use `--format ansi` when colors and terminal styling are evidence. Otherwise use text.
>
> `--lines` asks Herdr for more rows from the pane's available screen and host scrollback. If increasing it does not reveal more of a completed response, the pane is probably running the agent on the terminal's alternate screen. Rows that leave the alternate screen do not enter Herdr's host scrollback, so a larger line count cannot recover them.
>
> After that failed read, ask the agent to write its complete response as Markdown in a temporary directory and reply only with the file path, then read the file directly. Use this only as a fallback; do not request file output in the initial prompt.
>
> ## Safety and coordination rules
>
> - Use `--no-focus` for background work unless the user asked to switch context.
> - Use `--current`, an explicit pane ID, or a unique agent name. Do not rely on another client's focused pane.
> - Parse IDs from JSON responses. Do not derive them from sidebar order or examples.
> - Do not close workspaces, tabs, panes, or sessions you did not create unless the user explicitly asked.
> - Never run `herdr server stop` from an active session unless the user explicitly intends to stop the server and its pane processes.
> - Never kill the main Herdr process. Use named test sessions for experiments that need an isolated server.
> - CLI server errors are JSON on stderr with exit status 1. CLI syntax errors exit with status 2.

---

## `implement`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `6d3fd9e83b`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `6d3fd9e83b`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: implement
> description: "Implement a piece of work based on a spec or set of tickets."
> disable-model-invocation: true
> ---
>
> Implement the work described by the user in the spec or tickets.
>
> Use /tdd where possible, at pre-agreed seams.
>
> Run typechecking regularly, single test files regularly, and the full test suite once at the end.
>
> Once done, use /code-review to review the work.
>
> Commit your work to the current branch.

#### dmmulroy `SKILL.md`

> ---
> name: implement
> description: "Implement a piece of work based on a spec or set of tickets."
> disable-model-invocation: true
> ---
>
> Implement the work described by the user in the spec or tickets.
>
> Use /tdd where possible, at pre-agreed seams.
>
> Run typechecking regularly, single test files regularly, and the full test suite once at the end.
>
> Once done, use /code-review to review the work.
>
> Commit your work to the current branch.

---

## `improve-codebase-architecture`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `4b4cb798c3`; support: `HTML-REPORT.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `4b4cb798c3`; support: `HTML-REPORT.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `HTML-REPORT.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: improve-codebase-architecture
> description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
> disable-model-invocation: true
> ---
>
> # Improve Codebase Architecture
>
> Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.
>
> This command is _informed_ by the project's domain model and built on a shared design vocabulary:
>
> - Run the `/codebase-design` skill for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion — don't drift into "component," "service," "API," or "boundary."
> - The domain language in `CONTEXT.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.
>
> ## Process
>
> ### 1. Explore
>
> **Scope before you scan — YAGNI.** Deepening a module pays off by making future changes to it easier, so put extra weight on the parts of the codebase that have recently changed. Decide *where* to look before you look:
>
> - If the user named a direction — a module, a subsystem, a pain point — take it, and skip the inference below.
> - Otherwise, walk back a good stretch of the commit history (`git log --oneline`) to find the codebase's hot spots — the files and areas that keep coming up — and let those paths pull your attention first. If the changes are scattered with no clear hot spot, widen the net.
>
> Read the project's domain glossary (`CONTEXT.md`) and any ADRs in the area you're touching first.
>
> Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:
>
> - Where does understanding one concept require bouncing between many small modules?
> - Where are modules **shallow** — interface nearly as complex as the implementation?
> - Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
> - Where do tightly-coupled modules leak across their seams?
> - Which parts of the codebase are untested, or hard to test through their current interface?
>
> Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.
>
> ### 2. Present candidates as an HTML report
>
> Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user — `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows — and tell them the absolute path.
>
> The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
>
> For each candidate, render a card with:
>
> - **Files** — which files/modules are involved
> - **Problem** — why the current architecture is causing friction
> - **Solution** — plain English description of what would change
> - **Benefits** — explained in terms of locality and leverage, and how tests would improve
> - **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
> - **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge
>
> End the report with a **Top recommendation** section: which candidate you'd tackle first and why.
>
> **Use CONTEXT.md vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."
>
> **ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. a warning callout: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.
>
> See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.
>
> Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"
>
> ### 3. Grilling loop
>
> Once the user picks a candidate, run the `/grilling` skill to walk the decision tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.
>
> Side effects happen inline as decisions crystallize — run the `/domain-modeling` skill to keep the domain model current as you go:
>
> - **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md`. Create the file lazily if it doesn't exist.
> - **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
> - **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones.
> - **Want to explore alternative interfaces for the deepened module?** Run the `/codebase-design` skill and use its design-it-twice parallel sub-agent pattern.

#### dmmulroy `SKILL.md`

> ---
> name: improve-codebase-architecture
> description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
> disable-model-invocation: true
> ---
>
> # Improve Codebase Architecture
>
> Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.
>
> This command is _informed_ by the project's domain model and built on a shared design vocabulary:
>
> - Run the `/codebase-design` skill for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every suggestion — don't drift into "component," "service," "API," or "boundary."
> - The domain language in `CONTEXT.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate.
>
> ## Process
>
> ### 1. Explore
>
> **Scope before you scan — YAGNI.** Deepening a module pays off by making future changes to it easier, so put extra weight on the parts of the codebase that have recently changed. Decide *where* to look before you look:
>
> - If the user named a direction — a module, a subsystem, a pain point — take it, and skip the inference below.
> - Otherwise, walk back a good stretch of the commit history (`git log --oneline`) to find the codebase's hot spots — the files and areas that keep coming up — and let those paths pull your attention first. If the changes are scattered with no clear hot spot, widen the net.
>
> Read the project's domain glossary (`CONTEXT.md`) and any ADRs in the area you're touching first.
>
> Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:
>
> - Where does understanding one concept require bouncing between many small modules?
> - Where are modules **shallow** — interface nearly as complex as the implementation?
> - Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
> - Where do tightly-coupled modules leak across their seams?
> - Which parts of the codebase are untested, or hard to test through their current interface?
>
> Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.
>
> ### 2. Present candidates as an HTML report
>
> Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user — `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows — and tell them the absolute path.
>
> The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.
>
> For each candidate, render a card with:
>
> - **Files** — which files/modules are involved
> - **Problem** — why the current architecture is causing friction
> - **Solution** — plain English description of what would change
> - **Benefits** — explained in terms of locality and leverage, and how tests would improve
> - **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
> - **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge
>
> End the report with a **Top recommendation** section: which candidate you'd tackle first and why.
>
> **Use CONTEXT.md vocabulary for the domain, and the `/codebase-design` vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."
>
> **ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. a warning callout: _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.
>
> See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.
>
> Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"
>
> ### 3. Grilling loop
>
> Once the user picks a candidate, run the `/grilling` skill to walk the decision tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.
>
> Side effects happen inline as decisions crystallize — run the `/domain-modeling` skill to keep the domain model current as you go:
>
> - **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md`. Create the file lazily if it doesn't exist.
> - **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
> - **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones.
> - **Want to explore alternative interfaces for the deepened module?** Run the `/codebase-design` skill and use its design-it-twice parallel sub-agent pattern.

---

## `plannotator-annotate`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `8187a97281`; support: `agents/openai.yaml`

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: plannotator-annotate
> description: Open Plannotator's annotation UI for a markdown file, HTML file, URL, or folder and then respond to the returned annotations.
> disable-model-invocation: true
> ---
>
> # Plannotator Annotate
>
> Use this skill when the user wants to annotate a document in Plannotator instead of reviewing it inline in chat.
>
> Run:
>
> ```bash
> plannotator annotate <path-or-url>
> ```
>
> Behavior:
>
> 1. Launch the command with Bash.
> 2. Wait for the browser review to finish.
> 3. If annotations are returned, address them directly.
> 4. If the session closes without feedback, say so briefly and continue.
>
> Do not ask the user to paste a shell command into the chat. Run the command yourself.

---

## `plannotator-last`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `1f5b8dbd52`; support: `agents/openai.yaml`

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: plannotator-last
> description: Open Plannotator on the latest rendered assistant message and use the returned annotations to revise that message or continue.
> disable-model-invocation: true
> ---
>
> # Plannotator Last
>
> Use this skill when the user wants to annotate the latest assistant response in Plannotator.
>
> Do not send a commentary/status message before running the command. The command
> targets the latest rendered assistant response, so a preamble can mistakenly become the
> thing being annotated.
>
> Run:
>
> ```bash
> plannotator last
> ```
>
> Behavior:
>
> 1. Launch the command with Bash.
> 2. Wait for the annotation session to finish.
> 3. If feedback is returned, incorporate it into the follow-up response.
> 4. If the session closes without feedback, mention that briefly and continue.
>
> Run the command yourself rather than telling the user to invoke shell syntax manually.

---

## `plannotator-review`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `35164a956c`; support: `agents/openai.yaml`

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: plannotator-review
> description: Open Plannotator's browser-based code review UI for the current worktree or a pull request URL, then act on the feedback that comes back.
> disable-model-invocation: true
> ---
>
> # Plannotator Review
>
> Use this skill when the user wants to review current code changes in Plannotator instead of reading a diff inline.
>
> Run:
>
> ```bash
> plannotator review [optional-pr-url]
> ```
>
> Behavior:
>
> 1. Launch the command with Bash.
> 2. Wait for it to finish.
> 3. If it returns feedback or annotations, address them in the same conversation.
> 4. If it returns an approval/LGTM-style message, acknowledge that review passed and continue.
>
> Do not ask the user to copy shell commands into chat. Run the command yourself.

---

## `prelude`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `fcd49c7847`; support: `prelude.ts`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: prelude
> description: Prelude bootstrapping for TypeScript. Use when creating or rebuilding a prelude.ts from ambient generic helpers and types.
> disable-model-invocation: true
> ---
>
> # Bootstrap a TypeScript Prelude
>
> A prelude is an explicitly imported module for **ambient** helpers and types: ubiquitous, domain-neutral building blocks that have no more precise owner. Use the bundled [`prelude.ts`](prelude.ts) as the foundation, then adapt it to evidence from the target repository. Apply [`../coding-standards/SKILL.md`](../coding-standards/SKILL.md) throughout.
>
> Ambient describes a helper's role, not a TypeScript global. Keep prelude exports behind ordinary imports; do not add global declarations or global augmentation.
>
> ## 1. Map the repository
>
> Read repository instructions, package manifests, TypeScript configuration, source layout, and import conventions. Locate:
>
> - an existing prelude or equivalent shared module;
> - files named `utils`, `helpers`, `common`, `types`, `result`, `errors`, or similar;
> - generic type aliases and tiny generic functions repeated across modules;
> - established libraries for results, schemas, redaction, branding, collections, and exhaustive matching;
> - every caller of plausible ambient helpers.
>
> Search by both filenames and concepts. Use the ubiquitous generic helper/type categories in the coding standards as seed search terms, then inspect definitions and callers rather than classifying from names alone.
>
> **Completion criterion:** Every plausible ambient definition found by repository-wide filename, symbol, and duplication scans is inventoried with its owner, callers, dependencies, and current behavior.
>
> ## 2. Classify every candidate
>
> A symbol belongs in the prelude when all of these hold:
>
> - it is domain-neutral and useful across unrelated modules;
> - no domain, application service, adapter, protocol, or focused generic module is a more precise owner;
> - centralizing it reduces duplication or gives a ubiquitous concept one canonical implementation;
> - its dependencies are minimal, stable, and already justified by the project;
> - its behavior is small enough to understand at the import site or hidden behind a precise type.
>
> Keep a symbol with its focused owner when it encodes domain meaning, application policy, boundary translation, framework behavior, I/O, or a cohesive generic concept such as string casing or non-trivial collection operations. Prefer an established library over a local duplicate. A prelude is a curated foundation, not a barrel or miscellaneous dumping ground.
>
> Record one decision for every candidate: use the established library, keep the current owner, move into the prelude, merge with a template symbol, or delete as an unused duplicate.
>
> **Completion criterion:** Every inventoried candidate has one decision grounded in its semantics and callers; no candidate remains classified only by its filename or name.
>
> ## 3. Seed from the template
>
> Read the bundled [`prelude.ts`](prelude.ts) completely. Copy it to the project's established shared-module location as the starting point. If a prelude already exists, merge deliberately instead of overwriting it.
>
> Choose exactly one expected-failure foundation:
>
> 1. When the project uses Effect, use Effect's result/error facilities and remove the template's local `Result` fallback.
> 2. When the project uses `better-result`, use it and remove the local fallback.
> 3. When the project uses neither, ask whether to install `better-result`.
>    - If accepted, install it and remove the local fallback.
>    - If declined, enable the template's local `Result` types and helpers.
>
> Retain each other template export only when repository usage, the coding standards, or the requested foundation justifies it. Preserve compatible existing behavior when merging equivalent helpers; surface semantic conflicts rather than silently choosing one implementation.
>
> **Completion criterion:** The target file is founded on the template, has exactly one result strategy, and every retained template export has an explicit justification.
>
> ## 4. Consolidate ambient helpers and types
>
> Move or merge the approved repository candidates into the prelude. For each moved symbol:
>
> - preserve behavior unless a behavior change was requested;
> - preserve or deliberately migrate its public name and type contract;
> - update every caller to import from the prelude directly;
> - retain required JSDoc, safety comments, and targeted lint suppressions;
> - remove superseded definitions and compatibility re-exports after their callers move.
>
> Keep the resulting module side-effect free. It must not read configuration, acquire resources, register handlers, perform I/O, contain domain/application policy, or re-export unrelated modules.
>
> **Completion criterion:** Every approved candidate has one canonical definition, every caller uses it, and no removed source remains as a second source of truth.
>
> ## 5. Verify the foundation
>
> Run the repository's formatter, type checker, linter, and focused tests. Search again for the old symbols, duplicate definitions, stale import paths, and broad utility files that were part of the inventory. Review every prelude export for current usage or an explicit foundational reason.
>
> Report:
>
> - the chosen result strategy;
> - template exports retained or removed;
> - repository helpers moved, merged, left in place, or deleted;
> - verification commands and outcomes.
>
> **Completion criterion:** Repository checks pass, every inventory decision is reflected in code, duplicate ambient definitions are gone, and every prelude export is justified.

---

## `prototype`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `03074862d4`; support: `LOGIC.md`, `UI.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `03074862d4`; support: `LOGIC.md`, `UI.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `LOGIC.md`, `UI.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: prototype
> description: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
> ---
>
> # Prototype
>
> A prototype is **throwaway code that answers a question**. The question decides the shape.
>
> ## Pick a branch
>
> Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:
>
> - **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
> - **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.
>
> The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.
>
> ## Rules that apply to both
>
> 1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
> 2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
> 3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
> 4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
> 5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
> 6. **Capture it when done.** Fold any validated decision into the real code, then capture the prototype itself as a **primary source**: commit it to a throwaway branch, out of main, and leave a context pointer to that branch on the implementation issue. Capture the answer too — the verdict and the question it settled — in the issue or a commit. The main branch keeps only the validated decision.

#### dmmulroy `SKILL.md`

> ---
> name: prototype
> description: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.
> ---
>
> # Prototype
>
> A prototype is **throwaway code that answers a question**. The question decides the shape.
>
> ## Pick a branch
>
> Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:
>
> - **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
> - **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.
>
> The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.
>
> ## Rules that apply to both
>
> 1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
> 2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
> 3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
> 4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
> 5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
> 6. **Capture it when done.** Fold any validated decision into the real code, then capture the prototype itself as a **primary source**: commit it to a throwaway branch, out of main, and leave a context pointer to that branch on the implementation issue. Capture the answer too — the verdict and the question it settled — in the issue or a commit. The main branch keeps only the validated decision.

---

## `quiz-me`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `da8395b35d`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: quiz-me
> description: Active-recall tutoring that tests and strengthens the user's understanding of a topic, concept, or codebase area. Use when the user types /quiz-me or says "quiz me", "test me on X", "test my understanding", "drill me on", "check what I know about", or "flashcards on X". One question at a time, escalating hints, never hands over the answer. Not for pressure-testing a plan or design (use grill-me), and not for writing code.
> ---
>
> # quiz-me
>
> Test the user's recall, do not think for them. Self-generated answers stick; answers you hand over do not. Keep your turns short, one question, no lecture.
>
> ## Setup (one short prompt, then start)
>
> Ask for: the topic or source material, the level (beginner / intermediate / advanced), and the length (number of questions or minutes). If they name a codebase area, treat the repo as the source.
>
> ## Grounding
>
> If quizzing on code, docs, or any external contract, read the real files first and base questions and answers on them. Never invent a fact, an API, or a field name. If you are unsure of the answer yourself, say so rather than assert it.
>
> ## The loop, per question
>
> 1. Ask one question. Start with recall, then progress to "why" and "how" (elaborative) as they succeed.
> 2. Let them answer. Then ask "Confidence 1-5?".
> 3. If wrong or stuck, escalate hints one rung at a time: conceptual, then specific, then near-answer. Widen the question rather than reveal the answer. Give the answer only if they say "just tell me", and only after one attempt.
> 4. After their attempt: a one-line correction, then one sharper follow-up.
> 5. Red-flag anything wrong or rated 1-2 confidence for end-of-session review.
>
> ## Checkpoints
>
> - Feynman: every few questions, ask them to explain the concept simply, as if teaching it. Flag answers that only restate jargon.
> - Synthesis: every ~5 questions, ask for a 3-sentence summary in their own words.
> - Adapt: interleave subtopics and raise or lower difficulty to track their performance.
>
> ## End of session
>
> Give a short score, list the red-flagged items, and suggest when to review them again (most is forgotten within a day). Offer to save the red-flagged items to `~/.claude/quiz/<topic>.md` so a later `/quiz-me` can re-drill them.

---

## `recipe-diagrams`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `c7bff7697c`; support: `scripts/render_recipe_diagram.py`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: recipe-diagrams
> description: "Recipe diagrams: convert any recipe into a Cooking for Engineers-style ASCII process-flow table with aligned ingredient streams, preparation branches, joins, temperatures, timings, and finish steps. Use when the user asks for a recipe diagram."
> compatibility: Requires Python 3.
> disable-model-invocation: true
> ---
>
> # Recipe diagrams
>
> Convert the recipe into a dependency graph, then render that graph as a Cooking for Engineers-style ASCII table. Read the table left to right: ingredient rows are streams, columns are stages, and vertically merged action cells are joins.
>
> ## Steps
>
> 1. **Normalize the source.** Read the complete recipe, including yield, ingredient headings, ingredient preparation, numbered method, notes that alter execution, and any linked source the user supplied. Preserve quantities, equipment, temperatures, times, sensory completion cues, resting/cooling, and serving steps. The source is normalized when every execution-relevant source statement has one prospective home in the diagram.
>
> 2. **Build the dependency graph.** Separate global setup from ingredient streams and operations. Treat an ingredient's inline preparation (for example, `onion, diced`) as an operation unless it is purchased in that state. Split an ingredient into labeled portions when the source uses it at different stages. Keep independent preparations in the same column when order does not matter; place dependent operations in later columns. The graph is complete when every ingredient reaches every operation that consumes it and all operations lead to the finished result.
>
> 3. **Make the graph planar.** Order ingredient rows so every operation consumes one contiguous row range. Each later join spans the complete ranges of the intermediates it combines. Add columns until actions in one column have disjoint row ranges. The layout is complete when no action range is discontinuous and no two action ranges overlap within a column.
>
> 4. **Encode the layout.** Write a temporary JSON file using the schema below. Keep labels imperative and compact, but retain execution details. Use plain strings; the renderer transliterates symbols to ASCII.
>
> ```json
> {
>   "title": "Recipe name",
>   "yield": "about 10 servings",
>   "setup": [
>     "Butter and flour a loaf pan",
>     "Preheat oven to 350 deg F (170 deg C)"
>   ],
>   "ingredients": [
>     "2 large (250 g) ripe bananas",
>     "6 Tbsp (90 mL) butter"
>   ],
>   "columns": [
>     {
>       "actions": [
>         { "rows": [0, 0], "label": "mash" },
>         { "rows": [1, 1], "label": "melt" }
>       ]
>     },
>     {
>       "actions": [
>         { "rows": [0, 1], "label": "mix until smooth" }
>       ]
>     }
>   ]
> }
> ```
>
> `rows` is an inclusive, zero-based ingredient-row range. A blank stage cell means that stream carries forward unchanged. A cell spanning several rows consumes those ingredients or the intermediates already produced from them. Put pan preparation, preheating, and other recipe-wide prerequisites in `setup`; put cooking, cooling, garnishing, and serving in action columns at their actual dependency point.
>
> 5. **Audit before rendering.** Compare the JSON against the source. Verify every ingredient and portion, every operation, all ordering constraints, and all execution details exactly once. Preserve genuine alternatives in the relevant label. Mark source uncertainty with `[?]` and explain it after the diagram rather than inventing a resolution. The audit is complete only when every source item is accounted for.
>
> 6. **Render and return.** Resolve `scripts/render_recipe_diagram.py` relative to this `SKILL.md`, then run:
>
> ```bash
> python3 scripts/render_recipe_diagram.py /tmp/recipe-diagram.json --width 120
> ```
>
> Increase `--width` when the renderer reports that the diagram is too narrow. Return its stdout in a fenced `text` block without editing spacing. If `[?]` appears, follow the block with a short `Uncertainties` list. The output is complete when the renderer exits successfully, every line between the outer borders has identical length, and every output character is ASCII.

---

## `research`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `af378829f0`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `2173808760`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: different.

```diff
--- Matt/research/SKILL.md
+++ dmmulroy/research/SKILL.md
@@ -3,9 +3,18 @@
 description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
 ---
 
-Spin up a **background agent** to do the research, so you keep working while it reads.
+Spin up **exactly one background agent** to do the research, so you keep working while it reads.
 
-Its job:
+## Recursion guard
+
+Before spawning, check `RESEARCH_SUBAGENT`:
+
+- If `RESEARCH_SUBAGENT=1`, this pane is already the delegated researcher. **Do not spawn any agent or pane.** Perform the research and write the report directly.
+- Otherwise, create one background pane with `herdr pane split ... --env RESEARCH_SUBAGENT=1`, and explicitly tell that agent not to delegate or spawn subagents.
+
+Never create a second research agent as a retry. If the delegated agent stalls or fails, stop/close it and complete the research in the original pane.
+
+The background agent's job:
 
 1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
 2. Write the findings to a single Markdown file, citing each claim's source.
```
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: research
> description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
> ---
>
> Spin up a **background agent** to do the research, so you keep working while it reads.
>
> Its job:
>
> 1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
> 2. Write the findings to a single Markdown file, citing each claim's source.
> 3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.

#### dmmulroy `SKILL.md`

> ---
> name: research
> description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
> ---
>
> Spin up **exactly one background agent** to do the research, so you keep working while it reads.
>
> ## Recursion guard
>
> Before spawning, check `RESEARCH_SUBAGENT`:
>
> - If `RESEARCH_SUBAGENT=1`, this pane is already the delegated researcher. **Do not spawn any agent or pane.** Perform the research and write the report directly.
> - Otherwise, create one background pane with `herdr pane split ... --env RESEARCH_SUBAGENT=1`, and explicitly tell that agent not to delegate or spawn subagents.
>
> Never create a second research agent as a retry. If the delegated agent stalls or fails, stop/close it and complete the research in the original pane.
>
> The background agent's job:
>
> 1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
> 2. Write the findings to a single Markdown file, citing each claim's source.
> 3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.

---

## `resolving-merge-conflicts`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `c7c9ba8136`; support: `agents/openai.yaml`

This name exists in only one reviewed source.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: resolving-merge-conflicts
> description: "Use when you need to resolve an in-progress git merge/rebase conflict."
> ---
>
> 1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.
>
> 2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.
>
> 3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.
>
> 4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.
>
> 5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.

---

## `setup-matt-pocock-skills`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `def265a8b1`; support: `agents/openai.yaml`, `domain.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`, `triage-labels.md`
- **dmmulroy:** `SKILL.md` SHA-256 `def265a8b1`; support: `agents/openai.yaml`, `domain.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`, `triage-labels.md`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`, `domain.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`, `triage-labels.md`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: setup-matt-pocock-skills
> description: Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
> disable-model-invocation: true
> ---
>
> # Setup Matt Pocock's Skills
>
> Scaffold the per-repo configuration that the engineering skills assume:
>
> - **Issue tracker** — where issues live (GitHub by default; local markdown is also supported out of the box)
> - **Triage labels** — the strings used for the five canonical triage roles
> - **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
>
> This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.
>
> ## Process
>
> ### 1. Explore
>
> Look at the current repo to understand its starting state. Read whatever exists; don't assume:
>
> - `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
> - `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
> - `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
> - `docs/adr/` and any `src/*/docs/adr/` directories
> - `docs/agents/` — does this skill's prior output already exist?
> - `.scratch/` — sign that a local-markdown issue tracker convention is already in use
> - Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
> - Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.
>
> ### 2. Present findings and ask
>
> Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.
>
> Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).
>
> **Section A — Issue tracker.**
>
> > Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, `to-spec`, and `qa` read from and write to it — they need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.
>
> Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:
>
> - **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
> - **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
> - **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
> - **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose
>
> Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.
>
> **Section B — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.
>
> If it is installed, ask exactly one question:
>
> > Do you want to keep the default triage labels? (recommended: **yes**)
>
> The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.
>
> **Section C — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.
>
> Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.
>
> ### 3. Confirm and edit
>
> Show the user a draft of:
>
> - The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
> - The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed)
>
> Let them edit before writing.
>
> ### 4. Write
>
> **Pick the file to edit:**
>
> - If `CLAUDE.md` exists, edit it.
> - Else if `AGENTS.md` exists, edit it.
> - If neither exists, ask the user which one to create — don't pick for them.
>
> Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.
>
> If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.
>
> The block:
>
> ```markdown
> ## Agent skills
>
> ### Issue tracker
>
> [one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.
>
> ### Triage labels
>
> [one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.
>
> ### Domain docs
>
> [one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.
> ```
>
> Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.
>
> Then write the docs files using the seed templates in this skill folder as a starting point:
>
> - [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
> - [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
> - [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
> - [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
> - [domain.md](./domain.md) — domain doc consumer rules + layout
>
> For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.
>
> ### 5. Done
>
> Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.

#### dmmulroy `SKILL.md`

> ---
> name: setup-matt-pocock-skills
> description: Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
> disable-model-invocation: true
> ---
>
> # Setup Matt Pocock's Skills
>
> Scaffold the per-repo configuration that the engineering skills assume:
>
> - **Issue tracker** — where issues live (GitHub by default; local markdown is also supported out of the box)
> - **Triage labels** — the strings used for the five canonical triage roles
> - **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
>
> This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.
>
> ## Process
>
> ### 1. Explore
>
> Look at the current repo to understand its starting state. Read whatever exists; don't assume:
>
> - `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
> - `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
> - `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
> - `docs/adr/` and any `src/*/docs/adr/` directories
> - `docs/agents/` — does this skill's prior output already exist?
> - `.scratch/` — sign that a local-markdown issue tracker convention is already in use
> - Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
> - Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.
>
> ### 2. Present findings and ask
>
> Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.
>
> Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).
>
> **Section A — Issue tracker.**
>
> > Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, `to-spec`, and `qa` read from and write to it — they need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.
>
> Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:
>
> - **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
> - **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
> - **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
> - **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose
>
> Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.
>
> **Section B — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.
>
> If it is installed, ask exactly one question:
>
> > Do you want to keep the default triage labels? (recommended: **yes**)
>
> The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.
>
> **Section C — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.
>
> Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.
>
> ### 3. Confirm and edit
>
> Show the user a draft of:
>
> - The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
> - The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed)
>
> Let them edit before writing.
>
> ### 4. Write
>
> **Pick the file to edit:**
>
> - If `CLAUDE.md` exists, edit it.
> - Else if `AGENTS.md` exists, edit it.
> - If neither exists, ask the user which one to create — don't pick for them.
>
> Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.
>
> If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.
>
> The block:
>
> ```markdown
> ## Agent skills
>
> ### Issue tracker
>
> [one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.
>
> ### Triage labels
>
> [one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.
>
> ### Domain docs
>
> [one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.
> ```
>
> Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.
>
> Then write the docs files using the seed templates in this skill folder as a starting point:
>
> - [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
> - [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
> - [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
> - [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
> - [domain.md](./domain.md) — domain doc consumer rules + layout
>
> For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.
>
> ### 5. Done
>
> Tell the user the setup is complete and which engineering skills will now read from these files. Mention they can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.

---

## `tdd`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `b730be050b`; support: none
- **Matt:** `SKILL.md` SHA-256 `5363bb2775`; support: `agents/openai.yaml`, `mocking.md`, `tests.md`
- **dmmulroy:** `SKILL.md` SHA-256 `5363bb2775`; support: `agents/openai.yaml`, `mocking.md`, `tests.md`

### Exact comparison

#### Local vs Matt

- `SKILL.md`: different.

```diff
--- Local/tdd/SKILL.md
+++ Matt/tdd/SKILL.md
@@ -1,106 +1,36 @@
 ---
 name: tdd
-description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, asks for outside-in tests, or wants integration-style behavior tests.
+description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
 ---
 
 # Test-Driven Development
 
-Use this skill to build or fix behavior test-first. The goal is not to write many tests up front. The goal is to learn through one thin behavior slice at a time.
+TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.
 
-## Core rule
+When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.
 
-Tests should verify public behavior through real seams. They should describe what the system does, not how internals cooperate.
+## What a good test is
 
-Good tests:
+Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.
 
-- Call a public function, command, handler, API, CLI, or adapter seam.
-- Assert caller-visible results, errors, persisted state, emitted messages, responses, or recorded adapter calls.
-- Survive private refactors.
-- Use names that read like behavior specifications.
+See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.
 
-Bad tests:
+## Seams — where tests go
 
-- Test private helpers before the public behavior.
-- Mock internal collaborators owned by the same package.
-- Assert incidental call order or broad call counts.
-- Duplicate implementation structure in the test.
+A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.
 
-## Avoid horizontal slices
+**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything — agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.
 
-Do not write all tests first, then all implementation. That locks in imagined behavior before the first real design feedback.
+Ask: "What's the public interface, and which seams should we test?"
 
-Use vertical slices:
+## Anti-patterns
 
-1. Pick one behavior.
-2. Write one failing test for that behavior.
-3. Write the smallest implementation that passes.
-4. Refactor only while green.
-5. Repeat.
+- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
+- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
+- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.
 
-## Workflow
+## Rules of the loop
 
-### 1. Plan the public surface
-
-Before writing code:
-
-- Identify the public interface or seam to test.
-- List the behaviors, not implementation steps.
-- Pick the first behavior that proves the path end to end.
-- Search existing tests for style, fixtures, builders, fakes, and validation patterns.
-- If a `CONTEXT.md`, ADR, spec, or TDD exists, read it and use its vocabulary.
-
-Ask the user only for choices that source files cannot answer.
-
-### 2. Red
-
-Write one test that fails for the right reason.
-
-- The test should exercise one behavior.
-- The test should use production seams.
-- The test should construct the input that triggers the branch being tested.
-- For bugs, the first test should reproduce the bug through user-visible behavior when practical.
-
-### 3. Green
-
-Write the smallest coherent implementation that passes.
-
-- Do not anticipate later tests.
-- Do not add optional paths, compatibility layers, or defensive handling the test does not need unless an existing contract requires it.
-- Keep implementation changes scoped to the behavior under test.
-
-### 4. Refactor
-
-Refactor only when tests are green.
-
-Look for:
-
-- duplicated behavior or rules,
-- long functions or nested branches,
-- shallow pass-through wrappers,
-- validation in the wrong layer,
-- primitive values hiding domain concepts,
-- test friction that points to a missing seam.
-
-Run the relevant tests after each refactor step.
-
-## Go and gomock guidance
-
-- Prefer real implementations, local test servers, test databases, or recording fakes through production interfaces.
-- When using gomock, set exact call counts with a known `Times(N)`.
-- Use typed identifier values from builders or fixtures. Avoid `gomock.Any()` for IDs, amounts, addresses, or domain keys.
-- Use `gomock.Any()` for `context.Context`, loggers, or opaque dependencies only.
-- Put expectations in the test or an opt-in helper called by the test.
-- Do not add `Skip*Mock`, `Allow*Mock`, or opt-out flags to test-case structs.
-
-## Checklist per cycle
-
-- The test describes behavior, not implementation.
-- The test uses a public interface or real seam.
-- The failure proves the behavior is missing or wrong.
-- The implementation is minimal for the current behavior.
-- No speculative feature was added.
-- Relevant validation, guard, precondition, and error branches are covered.
-
-## Completion criterion
-
-Done means every important behavior, invariant, boundary, and expected failure has either a behavior test or an explicit reason it was not tested. Report the validation command that was run.
+- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
+- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
+- **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.
```
- Only in Local: none.
- Only in Matt: `agents/openai.yaml`, `mocking.md`, `tests.md`.
- Matching support files: none.
- Changed support files: none.
#### Local vs dmmulroy

- `SKILL.md`: different.

```diff
--- Local/tdd/SKILL.md
+++ dmmulroy/tdd/SKILL.md
@@ -1,106 +1,36 @@
 ---
 name: tdd
-description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, asks for outside-in tests, or wants integration-style behavior tests.
+description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
 ---
 
 # Test-Driven Development
 
-Use this skill to build or fix behavior test-first. The goal is not to write many tests up front. The goal is to learn through one thin behavior slice at a time.
+TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.
 
-## Core rule
+When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.
 
-Tests should verify public behavior through real seams. They should describe what the system does, not how internals cooperate.
+## What a good test is
 
-Good tests:
+Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.
 
-- Call a public function, command, handler, API, CLI, or adapter seam.
-- Assert caller-visible results, errors, persisted state, emitted messages, responses, or recorded adapter calls.
-- Survive private refactors.
-- Use names that read like behavior specifications.
+See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.
 
-Bad tests:
+## Seams — where tests go
 
-- Test private helpers before the public behavior.
-- Mock internal collaborators owned by the same package.
-- Assert incidental call order or broad call counts.
-- Duplicate implementation structure in the test.
+A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.
 
-## Avoid horizontal slices
+**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything — agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.
 
-Do not write all tests first, then all implementation. That locks in imagined behavior before the first real design feedback.
+Ask: "What's the public interface, and which seams should we test?"
 
-Use vertical slices:
+## Anti-patterns
 
-1. Pick one behavior.
-2. Write one failing test for that behavior.
-3. Write the smallest implementation that passes.
-4. Refactor only while green.
-5. Repeat.
+- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
+- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
+- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.
 
-## Workflow
+## Rules of the loop
 
-### 1. Plan the public surface
-
-Before writing code:
-
-- Identify the public interface or seam to test.
-- List the behaviors, not implementation steps.
-- Pick the first behavior that proves the path end to end.
-- Search existing tests for style, fixtures, builders, fakes, and validation patterns.
-- If a `CONTEXT.md`, ADR, spec, or TDD exists, read it and use its vocabulary.
-
-Ask the user only for choices that source files cannot answer.
-
-### 2. Red
-
-Write one test that fails for the right reason.
-
-- The test should exercise one behavior.
-- The test should use production seams.
-- The test should construct the input that triggers the branch being tested.
-- For bugs, the first test should reproduce the bug through user-visible behavior when practical.
-
-### 3. Green
-
-Write the smallest coherent implementation that passes.
-
-- Do not anticipate later tests.
-- Do not add optional paths, compatibility layers, or defensive handling the test does not need unless an existing contract requires it.
-- Keep implementation changes scoped to the behavior under test.
-
-### 4. Refactor
-
-Refactor only when tests are green.
-
-Look for:
-
-- duplicated behavior or rules,
-- long functions or nested branches,
-- shallow pass-through wrappers,
-- validation in the wrong layer,
-- primitive values hiding domain concepts,
-- test friction that points to a missing seam.
-
-Run the relevant tests after each refactor step.
-
-## Go and gomock guidance
-
-- Prefer real implementations, local test servers, test databases, or recording fakes through production interfaces.
-- When using gomock, set exact call counts with a known `Times(N)`.
-- Use typed identifier values from builders or fixtures. Avoid `gomock.Any()` for IDs, amounts, addresses, or domain keys.
-- Use `gomock.Any()` for `context.Context`, loggers, or opaque dependencies only.
-- Put expectations in the test or an opt-in helper called by the test.
-- Do not add `Skip*Mock`, `Allow*Mock`, or opt-out flags to test-case structs.
-
-## Checklist per cycle
-
-- The test describes behavior, not implementation.
-- The test uses a public interface or real seam.
-- The failure proves the behavior is missing or wrong.
-- The implementation is minimal for the current behavior.
-- No speculative feature was added.
-- Relevant validation, guard, precondition, and error branches are covered.
-
-## Completion criterion
-
-Done means every important behavior, invariant, boundary, and expected failure has either a behavior test or an explicit reason it was not tested. Report the validation command that was run.
+- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
+- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
+- **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.
```
- Only in Local: none.
- Only in dmmulroy: `agents/openai.yaml`, `mocking.md`, `tests.md`.
- Matching support files: none.
- Changed support files: none.
#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`, `mocking.md`, `tests.md`.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: tdd
> description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, asks for outside-in tests, or wants integration-style behavior tests.
> ---
>
> # Test-Driven Development
>
> Use this skill to build or fix behavior test-first. The goal is not to write many tests up front. The goal is to learn through one thin behavior slice at a time.
>
> ## Core rule
>
> Tests should verify public behavior through real seams. They should describe what the system does, not how internals cooperate.
>
> Good tests:
>
> - Call a public function, command, handler, API, CLI, or adapter seam.
> - Assert caller-visible results, errors, persisted state, emitted messages, responses, or recorded adapter calls.
> - Survive private refactors.
> - Use names that read like behavior specifications.
>
> Bad tests:
>
> - Test private helpers before the public behavior.
> - Mock internal collaborators owned by the same package.
> - Assert incidental call order or broad call counts.
> - Duplicate implementation structure in the test.
>
> ## Avoid horizontal slices
>
> Do not write all tests first, then all implementation. That locks in imagined behavior before the first real design feedback.
>
> Use vertical slices:
>
> 1. Pick one behavior.
> 2. Write one failing test for that behavior.
> 3. Write the smallest implementation that passes.
> 4. Refactor only while green.
> 5. Repeat.
>
> ## Workflow
>
> ### 1. Plan the public surface
>
> Before writing code:
>
> - Identify the public interface or seam to test.
> - List the behaviors, not implementation steps.
> - Pick the first behavior that proves the path end to end.
> - Search existing tests for style, fixtures, builders, fakes, and validation patterns.
> - If a `CONTEXT.md`, ADR, spec, or TDD exists, read it and use its vocabulary.
>
> Ask the user only for choices that source files cannot answer.
>
> ### 2. Red
>
> Write one test that fails for the right reason.
>
> - The test should exercise one behavior.
> - The test should use production seams.
> - The test should construct the input that triggers the branch being tested.
> - For bugs, the first test should reproduce the bug through user-visible behavior when practical.
>
> ### 3. Green
>
> Write the smallest coherent implementation that passes.
>
> - Do not anticipate later tests.
> - Do not add optional paths, compatibility layers, or defensive handling the test does not need unless an existing contract requires it.
> - Keep implementation changes scoped to the behavior under test.
>
> ### 4. Refactor
>
> Refactor only when tests are green.
>
> Look for:
>
> - duplicated behavior or rules,
> - long functions or nested branches,
> - shallow pass-through wrappers,
> - validation in the wrong layer,
> - primitive values hiding domain concepts,
> - test friction that points to a missing seam.
>
> Run the relevant tests after each refactor step.
>
> ## Go and gomock guidance
>
> - Prefer real implementations, local test servers, test databases, or recording fakes through production interfaces.
> - When using gomock, set exact call counts with a known `Times(N)`.
> - Use typed identifier values from builders or fixtures. Avoid `gomock.Any()` for IDs, amounts, addresses, or domain keys.
> - Use `gomock.Any()` for `context.Context`, loggers, or opaque dependencies only.
> - Put expectations in the test or an opt-in helper called by the test.
> - Do not add `Skip*Mock`, `Allow*Mock`, or opt-out flags to test-case structs.
>
> ## Checklist per cycle
>
> - The test describes behavior, not implementation.
> - The test uses a public interface or real seam.
> - The failure proves the behavior is missing or wrong.
> - The implementation is minimal for the current behavior.
> - No speculative feature was added.
> - Relevant validation, guard, precondition, and error branches are covered.
>
> ## Completion criterion
>
> Done means every important behavior, invariant, boundary, and expected failure has either a behavior test or an explicit reason it was not tested. Report the validation command that was run.

#### Matt `SKILL.md`

> ---
> name: tdd
> description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
> ---
>
> # Test-Driven Development
>
> TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.
>
> When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.
>
> ## What a good test is
>
> Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.
>
> See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.
>
> ## Seams — where tests go
>
> A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.
>
> **Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything — agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.
>
> Ask: "What's the public interface, and which seams should we test?"
>
> ## Anti-patterns
>
> - **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
> - **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
> - **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.
>
> ## Rules of the loop
>
> - **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
> - **One slice at a time.** One seam, one test, one minimal implementation per cycle.
> - **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.

#### dmmulroy `SKILL.md`

> ---
> name: tdd
> description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
> ---
>
> # Test-Driven Development
>
> TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.
>
> When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.
>
> ## What a good test is
>
> Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists — and survives refactors because it doesn't care about internal structure.
>
> See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.
>
> ## Seams — where tests go
>
> A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.
>
> **Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything — agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.
>
> Ask: "What's the public interface, and which seams should we test?"
>
> ## Anti-patterns
>
> - **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
> - **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
> - **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.
>
> ## Rules of the loop
>
> - **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
> - **One slice at a time.** One seam, one test, one minimal implementation per cycle.
> - **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.

---

## `teach`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `6d2dbe5e03`; support: `GLOSSARY-FORMAT.md`, `LEARNING-RECORD-FORMAT.md`, `MISSION-FORMAT.md`, `RESOURCES-FORMAT.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `6d2dbe5e03`; support: `GLOSSARY-FORMAT.md`, `LEARNING-RECORD-FORMAT.md`, `MISSION-FORMAT.md`, `RESOURCES-FORMAT.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `GLOSSARY-FORMAT.md`, `LEARNING-RECORD-FORMAT.md`, `MISSION-FORMAT.md`, `RESOURCES-FORMAT.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: teach
> description: Teach the user a new skill or concept, within this workspace.
> disable-model-invocation: true
> argument-hint: "What would you like to learn about?"
> ---
>
> The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.
>
> ## Teaching Workspace
>
> Treat the current directory as a teaching workspace. The state of their learning is captured in this directory in several files:
>
> - `MISSION.md`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
> - `./reference/*.html`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning. They should be beautiful documents which print out well, and are designed for quick reference.
> - `RESOURCES.md`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
> - `./learning-records/*.md`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled `0001-<dash-case-name>.md`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
> - `./lessons/*.html`: A directory of lessons. A **lesson** is a single, self-contained HTML output that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this workspace.
> - `./assets/*`: Reusable **components** shared across lessons. See [Assets](#assets).
> - `NOTES.md`: A scratchpad for you to jot down user preferences, or working notes.
>
> ## Philosophy
>
> To learn at a deep level, the user needs three things:
>
> - **Knowledge**, captured from high-quality, high-trust resources
> - **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
> - **Wisdom**, which comes from interacting with other learners and practitioners
>
> Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.
>
> Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.
>
> ### Fluency vs Storage Strength
>
> You should be careful to split between two types of learning:
>
> - **Fluency strength**: in-the-moment retrieval of knowledge
> - **Storage strength**: long-term retention of knowledge
>
> Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Try to design lessons which build long-term retention by desirable difficulty:
>
> - Using retrieval practice (recall from memory)
> - Spacing (distributing practice over time)
> - Interleaving (mixing up different but related topics in practice - for skills practice only)
>
> ## Lessons
>
> A lesson is the main thing you produce — the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file, saved to `./lessons/` and titled `0001-<dash-case-name>.html` where the number increments each time.
>
> A lesson should be **beautiful** — clean, readable typography and layout — since the user will return to these later to review. Think Tufte.
>
> The lesson should be short, and completable very quickly. Learners' working memory is very small, and we need to stay within it. But each lesson should give the user a single tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.
>
> If possible, open the lesson file for the user by running a CLI command.
>
> Each lesson should link via HTML anchors to other lessons and reference documents.
>
> Each lesson should recommend a primary source for the user to read or watch. This should be the most high-quality, high-trust resource you found on the topic.
>
> Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.
>
> ## Assets
>
> Lessons are built from reusable **components**, stored in `./assets/`: stylesheets, quiz widgets, simulators, diagram helpers — anything a second lesson could reuse.
>
> Reuse is the default, not the exception. Before authoring a lesson, read `./assets/` and build from the components already there. When a lesson needs something new and reusable, write it as a component in `./assets/` and link to it — never inline code a future lesson would duplicate.
>
> A shared stylesheet is the first component every workspace earns: every lesson links it, so the lessons look like one consistent course rather than a pile of one-offs. As the workspace grows, so should the component library.
>
> ## The Mission
>
> Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.
>
> If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.
>
> Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.
>
> Missions may change as the user develops more skills and knowledge. This is normal - make sure to update the `MISSION.md` and add a learning record to capture the change. Confirm with the user before changing the mission.
>
> ## Zone Of Proximal Development
>
> Each lesson, the user should always feel as if they are being challenged 'just enough'.
>
> The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:
>
> - Reading their `learning-records`
> - Figuring out the right thing to teach them based on their mission
> - Teach the most relevant thing that fits in their zone of proximal development
>
> ## Knowledge
>
> Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.
>
> Knowledge should first be gathered from trusted resources. Use `RESOURCES.md` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson.
>
> For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.
>
> ## Skills
>
> If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.
>
> For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons. There are several tools at your disposal:
>
> - Interactive lessons, using quizzes and light in-browser tasks
> - Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses)
>
> Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately - and ideally automatically.
>
> For quizzes, each answer should be exactly the same number of words (and characters, if possible). Don't give the user any clues about the answer through formatting.
>
> ## Acquiring Wisdom
>
> Wisdom comes from true real-world interaction - testing your skills outside the learning environment.
>
> When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.
>
> A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.
>
> You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.
>
> ## Reference Documents
>
> While creating lessons, you should also create reference documents. Lessons can reference these documents - they are useful for tracking raw units of knowledge useful across lessons.
>
> Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.
>
> Some learning topics lend themselves to reference:
>
> - Syntax and code snippets for programming
> - Algorithms and flowcharts for processes
> - Yoga poses and sequences for yoga
> - Exercises and routines for fitness
> - Glossaries for any topic with its own nomenclature
>
> Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson.
>
> ## `NOTES.md`
>
> The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.

#### dmmulroy `SKILL.md`

> ---
> name: teach
> description: Teach the user a new skill or concept, within this workspace.
> disable-model-invocation: true
> argument-hint: "What would you like to learn about?"
> ---
>
> The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.
>
> ## Teaching Workspace
>
> Treat the current directory as a teaching workspace. The state of their learning is captured in this directory in several files:
>
> - `MISSION.md`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
> - `./reference/*.html`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning. They should be beautiful documents which print out well, and are designed for quick reference.
> - `RESOURCES.md`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
> - `./learning-records/*.md`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled `0001-<dash-case-name>.md`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
> - `./lessons/*.html`: A directory of lessons. A **lesson** is a single, self-contained HTML output that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this workspace.
> - `./assets/*`: Reusable **components** shared across lessons. See [Assets](#assets).
> - `NOTES.md`: A scratchpad for you to jot down user preferences, or working notes.
>
> ## Philosophy
>
> To learn at a deep level, the user needs three things:
>
> - **Knowledge**, captured from high-quality, high-trust resources
> - **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
> - **Wisdom**, which comes from interacting with other learners and practitioners
>
> Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.
>
> Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.
>
> ### Fluency vs Storage Strength
>
> You should be careful to split between two types of learning:
>
> - **Fluency strength**: in-the-moment retrieval of knowledge
> - **Storage strength**: long-term retention of knowledge
>
> Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Try to design lessons which build long-term retention by desirable difficulty:
>
> - Using retrieval practice (recall from memory)
> - Spacing (distributing practice over time)
> - Interleaving (mixing up different but related topics in practice - for skills practice only)
>
> ## Lessons
>
> A lesson is the main thing you produce — the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file, saved to `./lessons/` and titled `0001-<dash-case-name>.html` where the number increments each time.
>
> A lesson should be **beautiful** — clean, readable typography and layout — since the user will return to these later to review. Think Tufte.
>
> The lesson should be short, and completable very quickly. Learners' working memory is very small, and we need to stay within it. But each lesson should give the user a single tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.
>
> If possible, open the lesson file for the user by running a CLI command.
>
> Each lesson should link via HTML anchors to other lessons and reference documents.
>
> Each lesson should recommend a primary source for the user to read or watch. This should be the most high-quality, high-trust resource you found on the topic.
>
> Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.
>
> ## Assets
>
> Lessons are built from reusable **components**, stored in `./assets/`: stylesheets, quiz widgets, simulators, diagram helpers — anything a second lesson could reuse.
>
> Reuse is the default, not the exception. Before authoring a lesson, read `./assets/` and build from the components already there. When a lesson needs something new and reusable, write it as a component in `./assets/` and link to it — never inline code a future lesson would duplicate.
>
> A shared stylesheet is the first component every workspace earns: every lesson links it, so the lessons look like one consistent course rather than a pile of one-offs. As the workspace grows, so should the component library.
>
> ## The Mission
>
> Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.
>
> If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.
>
> Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.
>
> Missions may change as the user develops more skills and knowledge. This is normal - make sure to update the `MISSION.md` and add a learning record to capture the change. Confirm with the user before changing the mission.
>
> ## Zone Of Proximal Development
>
> Each lesson, the user should always feel as if they are being challenged 'just enough'.
>
> The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:
>
> - Reading their `learning-records`
> - Figuring out the right thing to teach them based on their mission
> - Teach the most relevant thing that fits in their zone of proximal development
>
> ## Knowledge
>
> Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.
>
> Knowledge should first be gathered from trusted resources. Use `RESOURCES.md` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson.
>
> For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.
>
> ## Skills
>
> If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.
>
> For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons. There are several tools at your disposal:
>
> - Interactive lessons, using quizzes and light in-browser tasks
> - Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses)
>
> Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately - and ideally automatically.
>
> For quizzes, each answer should be exactly the same number of words (and characters, if possible). Don't give the user any clues about the answer through formatting.
>
> ## Acquiring Wisdom
>
> Wisdom comes from true real-world interaction - testing your skills outside the learning environment.
>
> When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.
>
> A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.
>
> You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.
>
> ## Reference Documents
>
> While creating lessons, you should also create reference documents. Lessons can reference these documents - they are useful for tracking raw units of knowledge useful across lessons.
>
> Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.
>
> Some learning topics lend themselves to reference:
>
> - Syntax and code snippets for programming
> - Algorithms and flowcharts for processes
> - Yoga poses and sequences for yoga
> - Exercises and routines for fitness
> - Glossaries for any topic with its own nomenclature
>
> Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson.
>
> ## `NOTES.md`
>
> The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.

---

## `tech-spec`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `2b2de72bd9`; support: none
- **dmmulroy:** `SKILL.md` SHA-256 `8dc7343afa`; support: none

### Exact comparison

#### Local vs dmmulroy

- `SKILL.md`: different.

```diff
--- Local/tech-spec/SKILL.md
+++ dmmulroy/tech-spec/SKILL.md
@@ -1,141 +1,186 @@
 ---
 name: tech-spec
-description: Write a design-only technical handoff with contracts, seams, call stacks, data flow, file map, tests, risks, and open questions. Use before implementation when the plan needs to be precise.
+description: Write a typed call-stack architecture handoff.
 disable-model-invocation: true
 ---
 
 # Tech Spec
 
-A tech spec is a design-only implementation handoff. It should make contracts, data flow, seams, and tests clear enough that another engineer can implement without inventing missing architecture.
-
-Do not implement while using this skill. Save a file only when the user asks for a file. Otherwise return the spec inline.
-
-Use `../coding-standards-go/SKILL.md`, `../coding-standards-ts/SKILL.md`, `../tdd/SKILL.md`, and `../domain-modeling/SKILL.md` when relevant. Choose the standards file that matches the target language.
-
-## Choose a path
-
-### Path A: Convert known context to a spec
-
-Use this when the conversation, docs, issue, code, or previous exploration already contains enough information.
-
-### Path B: Grill first
-
-Use this when the problem, users, constraints, affected code, acceptance criteria, or design direction are still unclear. Ask one question at a time and include your recommended answer. If a file answers the question, read it instead of asking.
-
-Do not invent missing requirements to make the spec feel complete.
-
-## Path A workflow
+A tech spec is a **typed call-stack architecture handoff**: code-shaped contracts plus execution flows. Prefer TypeScript pseudocode over prose wherever precision matters.
+
+This skill is design-only. Do not implement. Save a file only when the user asks for a file; otherwise return the spec inline.
+
+## Branch selection
+
+1. Use **Path A: Convert context to spec** when the conversation, docs, or codebase already contain enough background to describe the change.
+2. Use **Path B: Grill first** when the user wants a new spec but has not provided enough problem, constraints, design direction, affected code, or acceptance criteria.
+
+If a question can be answered by exploring the codebase, inspect the codebase instead of asking.
+
+Completion criterion: the branch is chosen from actual available context; missing architectural decisions are not invented.
+
+## Path A: Convert context to spec
 
 ### 1. Load standards and local context
 
-Read relevant standards, docs, ADRs, `CONTEXT.md`, code, tests, and existing patterns.
-
-Completion check: the spec uses project vocabulary and does not introduce a library, pattern, schema style, adapter, or test strategy before checking precedent.
+Inspect existing code and docs for local vocabulary, module layout, domain concepts, errors, adapters, observability, runtime patterns, and test style.
+
+Completion criterion: the spec uses project vocabulary and does not introduce a pattern, library, adapter, schema style, or test strategy before checking local precedent.
 
 ### 2. Extract the design problem
 
 Capture:
 
-- current state,
-- problem,
-- users or callers,
-- goals,
-- non-goals,
-- constraints,
-- invariants,
-- affected systems,
-- likely entrypoints,
-- runtime and operational concerns,
-- risks,
+- current state;
+- problem;
+- users/callers;
+- goals;
+- non-goals;
+- constraints;
+- invariants;
+- affected systems;
+- likely entrypoints;
+- operational/runtime concerns;
+- risks;
 - open questions.
 
-Every claimed requirement must trace to conversation, code, docs, or an explicit open question.
-
-### 3. Compare alternatives
-
-Produce materially different options before recommending one. Options should differ in interface shape, ownership, seam placement, call stack, persistence, runtime behavior, or module boundaries.
-
-For each option, sketch:
-
-- public contracts,
-- input and output shapes,
-- expected failures,
-- seams and adapters,
-- ownership boundaries,
-- entrypoint-to-side-effect flow,
-- parsing and projection strategy,
-- observability, cancellation, idempotency, and authorization when relevant,
-- test strategy,
+Mark unknowns as open questions instead of filling gaps with plausible design.
+
+Completion criterion: every claimed requirement or constraint is grounded in conversation, code, docs, or an explicit open question.
+
+### 3. Explore design alternatives
+
+Produce materially different alternatives before choosing the recommended design. Alternatives should differ in interface shape, seam placement, ownership, call stack, runtime topology, or module boundaries — not just names.
+
+For each alternative, sketch:
+
+- domain types and state model;
+- public/module interfaces and APIs;
+- input/output types;
+- expected failure types;
+- seams, boundaries, and adapters;
+- entrypoint-to-side-effect call stack;
+- parsing/projection strategy;
+- authorization, observability, cancellation, idempotency, and transaction flow when reachable;
+- test seam strategy;
 - tradeoffs.
 
-### 4. Specify recommended contracts
+Compare alternatives on:
+
+- caller burden;
+- module depth and leverage;
+- locality of invariants and change;
+- seam placement;
+- boundary parsing and projections;
+- error and cancellation model;
+- testability through real seams;
+- operational/runtime fit;
+- implementation complexity.
+
+Completion criterion: the recommendation is chosen after comparing alternatives, not before.
+
+### 4. Specify the recommended typed contracts
 
 For the recommended design, outline every new, changed, or deleted:
 
-- domain value,
-- refined type or sentinel,
-- state variant,
-- input or output type,
-- request or response shape,
-- function signature,
-- interface,
-- expected error,
-- adapter contract,
-- protocol DTO,
-- persistence DTO,
+- domain value;
+- branded/refined type;
+- state machine variant;
+- input/output type;
+- request/response shape;
+- function signature;
+- class or module interface;
+- expected-failure/custom-error type;
+- adapter interface;
+- protocol DTO;
+- persistence DTO/projection;
+- runtime-boundary codec;
 - public API.
 
-Use Go-like pseudocode for Go work. Use the repository's language when the project is not Go.
+Name seams, adapters, implementations, ownership boundaries, and what crosses each boundary. State what each layer may know and what must not leak across the seam.
+
+Completion criterion: every new or changed boundary has a concrete type/interface/API sketch, or an explicit reason no new contract is needed.
 
 ### 5. Specify call stacks and data flow
 
-Show each affected behavior from entrypoint to side effects and response.
-
-Use this shape when helpful:
+For every new, changed, or deleted behavior, show the call stack from entrypoint to side effects and response.
+
+Include type/data flow:
 
 ```txt
 raw input
-  -> boundary DTO or unknown value
-  -> parser or validator
-  -> canonical application input
-  -> service or domain operation
+  -> boundary DTO / unknown
+  -> parser
+  -> canonical domain/application input
+  -> service/module interface
   -> adapter call
-  -> typed result or error
+  -> typed result/error
   -> projection
   -> serialized output
 ```
 
-Include failure, retry, cancellation, transaction, idempotency, observability, and authorization flow when they apply.
+Include current vs proposed flow when changing existing behavior. Include failure, retry, cancellation, transactionality, idempotency, observability, authorization, and runtime-hop flow when reachable.
+
+Completion criterion: every affected behavior has an end-to-end call stack and type/data-flow trace.
 
 ### 6. Map files and modules
 
-List files to add, change, or delete. For each file, state what it owns:
-
-- contract,
-- code path,
-- boundary,
-- adapter,
-- domain concept,
-- test responsibility,
-- runtime configuration.
-
-### 7. Write the RGR test plan
-
-Use red-green-refactor vertical slices. Do not write a horizontal plan where all tests come before all code.
-
-Each slice should include:
-
-- behavior under test,
-- public interface or seam,
-- first failing assertion,
-- minimal implementation target,
-- refactor note if any.
-
-Cover public behavior, important failures, parser rejection and acceptance, domain invariants, adapter contracts, runtime semantics, cancellation, retries, idempotency, and observability when relevant.
-
-## Required outline
-
-Use this shape unless the task is small enough to compress without losing contracts or call stacks:
+List:
+
+- files/modules to add;
+- files/modules to change;
+- files/modules to delete, if any;
+- test files;
+- config/migration/runtime files, if any.
+
+For each file, state the contract, code path, boundary, adapter, domain concept, or test responsibility it owns.
+
+Completion criterion: every contract and call-stack step maps to a file/module or an open question.
+
+### 7. Write the RGR TDD test plan
+
+Use the sibling TDD workflow and testing standards. Plan vertical Red-Green-Refactor slices: one failing behavior test, minimal implementation, repeat. Do not write a horizontal "all tests first, all code later" plan.
+
+Favor behavior through public interfaces and real seams over implementation-coupled mocks.
+
+Cover proportionately:
+
+- happy paths;
+- failure paths;
+- parser rejection and accepted shapes;
+- domain invariants and state transitions;
+- adapter contracts;
+- persistence/runtime semantics;
+- cancellation/retry/idempotency paths;
+- observability and safe summaries where relevant;
+- end-to-end flows for high-consequence behavior.
+
+Completion criterion: every public behavior, invariant, important failure path, changed boundary, and changed seam has a red test slice or an explicit reason not to test it.
+
+### 8. Produce the spec
+
+Return the spec inline unless the user requested a file path. If a file was requested, save it there.
+
+Do not implement and do not ask to implement by default.
+
+Completion criterion: the output follows the outline below and is implementation-ready for another engineer.
+
+## Path B: Grill first
+
+1. Do not write a full spec yet.
+   - State that there is not enough context for an implementation-ready tech spec.
+   - Completion criterion: the agent has not invented requirements, APIs, files, or call stacks.
+2. Start a grilling interview.
+   - Ask one question at a time and provide the recommended answer with each question.
+   - If a question can be answered by exploring the codebase, inspect the codebase instead of asking.
+   - Completion criterion: the interview has enough context for Path A: problem, users/callers, constraints, affected systems, desired behavior, boundaries, likely APIs, invariants, risks, and acceptance tests.
+3. Convert to the spec.
+   - Once grilling context is sufficient, run Path A.
+   - Completion criterion: the final artifact is a typed call-stack architecture handoff, not interview notes.
+
+## Required spec outline
+
+Use this shape unless the task is tiny enough to compress without losing contracts or call stacks:
 
 ```md
 # <Title>
@@ -172,6 +217,16 @@
 
 ## Call Stacks and Data Flow
 
+### Current / Old Flow
+
+### Proposed / New Flow
+
+### Failure Flow
+
+### Retry / Cancellation / Idempotency Flow
+
+### Observability Flow
+
 ## Files to Add / Change / Delete
 
 ## RGR TDD Test Plan
@@ -179,14 +234,15 @@
 ## Risks and Open Questions
 ```
 
+Omit sections that truly do not apply, but do not omit typed contracts, seams, call stacks, or tests merely because they are hard to specify.
+
 ## Writing rules
 
-- Types and call stacks define what changes.
-- Prose explains why.
-- Keep unknowns as open questions.
-- Do not invent product requirements, domain rules, APIs, or call stacks.
-- Avoid speculative abstraction. Every seam must earn its existence through a real boundary, invariant, ownership move, runtime concern, or test seam.
-
-## Completion criterion
-
-The spec is implementation-ready and every claim traces to conversation, docs, code, or an explicit open question.
+- Code first: TypeScript pseudocode defines contracts, APIs, and data flow.
+- Prose explains why; types and call stacks define what changes.
+- Focus on types, interfaces, APIs, inputs/outputs, seams, boundaries, adapters, domain modules, service modules, external adapters, and call stacks.
+- Prefer precise domain values over strings, booleans, nullable bags, and loosely shaped objects.
+- Keep seams real: adapters translate framework, persistence, network, time, randomness, telemetry, runtime, or platform boundaries.
+- Avoid speculative abstraction; every seam earns its existence through invariants, locality, leverage, testing, or a real boundary.
+- Keep a single source of truth; do not restate the same rule in multiple sections unless one section points to the other.
+- Unknowns stay open questions. Do not invent product requirements, domain rules, APIs, or call stacks to make the spec feel complete.
```
- Only in Local: none.
- Only in dmmulroy: none.
- Matching support files: none.
- Changed support files: none.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: tech-spec
> description: Write a design-only technical handoff with contracts, seams, call stacks, data flow, file map, tests, risks, and open questions. Use before implementation when the plan needs to be precise.
> disable-model-invocation: true
> ---
>
> # Tech Spec
>
> A tech spec is a design-only implementation handoff. It should make contracts, data flow, seams, and tests clear enough that another engineer can implement without inventing missing architecture.
>
> Do not implement while using this skill. Save a file only when the user asks for a file. Otherwise return the spec inline.
>
> Use `../coding-standards-go/SKILL.md`, `../coding-standards-ts/SKILL.md`, `../tdd/SKILL.md`, and `../domain-modeling/SKILL.md` when relevant. Choose the standards file that matches the target language.
>
> ## Choose a path
>
> ### Path A: Convert known context to a spec
>
> Use this when the conversation, docs, issue, code, or previous exploration already contains enough information.
>
> ### Path B: Grill first
>
> Use this when the problem, users, constraints, affected code, acceptance criteria, or design direction are still unclear. Ask one question at a time and include your recommended answer. If a file answers the question, read it instead of asking.
>
> Do not invent missing requirements to make the spec feel complete.
>
> ## Path A workflow
>
> ### 1. Load standards and local context
>
> Read relevant standards, docs, ADRs, `CONTEXT.md`, code, tests, and existing patterns.
>
> Completion check: the spec uses project vocabulary and does not introduce a library, pattern, schema style, adapter, or test strategy before checking precedent.
>
> ### 2. Extract the design problem
>
> Capture:
>
> - current state,
> - problem,
> - users or callers,
> - goals,
> - non-goals,
> - constraints,
> - invariants,
> - affected systems,
> - likely entrypoints,
> - runtime and operational concerns,
> - risks,
> - open questions.
>
> Every claimed requirement must trace to conversation, code, docs, or an explicit open question.
>
> ### 3. Compare alternatives
>
> Produce materially different options before recommending one. Options should differ in interface shape, ownership, seam placement, call stack, persistence, runtime behavior, or module boundaries.
>
> For each option, sketch:
>
> - public contracts,
> - input and output shapes,
> - expected failures,
> - seams and adapters,
> - ownership boundaries,
> - entrypoint-to-side-effect flow,
> - parsing and projection strategy,
> - observability, cancellation, idempotency, and authorization when relevant,
> - test strategy,
> - tradeoffs.
>
> ### 4. Specify recommended contracts
>
> For the recommended design, outline every new, changed, or deleted:
>
> - domain value,
> - refined type or sentinel,
> - state variant,
> - input or output type,
> - request or response shape,
> - function signature,
> - interface,
> - expected error,
> - adapter contract,
> - protocol DTO,
> - persistence DTO,
> - public API.
>
> Use Go-like pseudocode for Go work. Use the repository's language when the project is not Go.
>
> ### 5. Specify call stacks and data flow
>
> Show each affected behavior from entrypoint to side effects and response.
>
> Use this shape when helpful:
>
> ```txt
> raw input
>   -> boundary DTO or unknown value
>   -> parser or validator
>   -> canonical application input
>   -> service or domain operation
>   -> adapter call
>   -> typed result or error
>   -> projection
>   -> serialized output
> ```
>
> Include failure, retry, cancellation, transaction, idempotency, observability, and authorization flow when they apply.
>
> ### 6. Map files and modules
>
> List files to add, change, or delete. For each file, state what it owns:
>
> - contract,
> - code path,
> - boundary,
> - adapter,
> - domain concept,
> - test responsibility,
> - runtime configuration.
>
> ### 7. Write the RGR test plan
>
> Use red-green-refactor vertical slices. Do not write a horizontal plan where all tests come before all code.
>
> Each slice should include:
>
> - behavior under test,
> - public interface or seam,
> - first failing assertion,
> - minimal implementation target,
> - refactor note if any.
>
> Cover public behavior, important failures, parser rejection and acceptance, domain invariants, adapter contracts, runtime semantics, cancellation, retries, idempotency, and observability when relevant.
>
> ## Required outline
>
> Use this shape unless the task is small enough to compress without losing contracts or call stacks:
>
> ```md
> # <Title>
>
> ## Summary
>
> ## Context / Current State
>
> ## Goals
>
> ## Non-Goals
>
> ## Invariants
>
> ## Design Constraints
>
> ## Alternatives Considered
>
> ### Option 1: <name>
>
> ### Option 2: <name>
>
> ### Option 3: <name>
>
> ## Recommendation
>
> ## Proposed Design
>
> ## Domain Model and Types
>
> ## Types, Interfaces, and APIs
>
> ## Seams, Boundaries, Adapters, and Implementations
>
> ## Call Stacks and Data Flow
>
> ## Files to Add / Change / Delete
>
> ## RGR TDD Test Plan
>
> ## Risks and Open Questions
> ```
>
> ## Writing rules
>
> - Types and call stacks define what changes.
> - Prose explains why.
> - Keep unknowns as open questions.
> - Do not invent product requirements, domain rules, APIs, or call stacks.
> - Avoid speculative abstraction. Every seam must earn its existence through a real boundary, invariant, ownership move, runtime concern, or test seam.
>
> ## Completion criterion
>
> The spec is implementation-ready and every claim traces to conversation, docs, code, or an explicit open question.

#### dmmulroy `SKILL.md`

> ---
> name: tech-spec
> description: Write a typed call-stack architecture handoff.
> disable-model-invocation: true
> ---
>
> # Tech Spec
>
> A tech spec is a **typed call-stack architecture handoff**: code-shaped contracts plus execution flows. Prefer TypeScript pseudocode over prose wherever precision matters.
>
> This skill is design-only. Do not implement. Save a file only when the user asks for a file; otherwise return the spec inline.
>
> ## Branch selection
>
> 1. Use **Path A: Convert context to spec** when the conversation, docs, or codebase already contain enough background to describe the change.
> 2. Use **Path B: Grill first** when the user wants a new spec but has not provided enough problem, constraints, design direction, affected code, or acceptance criteria.
>
> If a question can be answered by exploring the codebase, inspect the codebase instead of asking.
>
> Completion criterion: the branch is chosen from actual available context; missing architectural decisions are not invented.
>
> ## Path A: Convert context to spec
>
> ### 1. Load standards and local context
>
> Inspect existing code and docs for local vocabulary, module layout, domain concepts, errors, adapters, observability, runtime patterns, and test style.
>
> Completion criterion: the spec uses project vocabulary and does not introduce a pattern, library, adapter, schema style, or test strategy before checking local precedent.
>
> ### 2. Extract the design problem
>
> Capture:
>
> - current state;
> - problem;
> - users/callers;
> - goals;
> - non-goals;
> - constraints;
> - invariants;
> - affected systems;
> - likely entrypoints;
> - operational/runtime concerns;
> - risks;
> - open questions.
>
> Mark unknowns as open questions instead of filling gaps with plausible design.
>
> Completion criterion: every claimed requirement or constraint is grounded in conversation, code, docs, or an explicit open question.
>
> ### 3. Explore design alternatives
>
> Produce materially different alternatives before choosing the recommended design. Alternatives should differ in interface shape, seam placement, ownership, call stack, runtime topology, or module boundaries — not just names.
>
> For each alternative, sketch:
>
> - domain types and state model;
> - public/module interfaces and APIs;
> - input/output types;
> - expected failure types;
> - seams, boundaries, and adapters;
> - entrypoint-to-side-effect call stack;
> - parsing/projection strategy;
> - authorization, observability, cancellation, idempotency, and transaction flow when reachable;
> - test seam strategy;
> - tradeoffs.
>
> Compare alternatives on:
>
> - caller burden;
> - module depth and leverage;
> - locality of invariants and change;
> - seam placement;
> - boundary parsing and projections;
> - error and cancellation model;
> - testability through real seams;
> - operational/runtime fit;
> - implementation complexity.
>
> Completion criterion: the recommendation is chosen after comparing alternatives, not before.
>
> ### 4. Specify the recommended typed contracts
>
> For the recommended design, outline every new, changed, or deleted:
>
> - domain value;
> - branded/refined type;
> - state machine variant;
> - input/output type;
> - request/response shape;
> - function signature;
> - class or module interface;
> - expected-failure/custom-error type;
> - adapter interface;
> - protocol DTO;
> - persistence DTO/projection;
> - runtime-boundary codec;
> - public API.
>
> Name seams, adapters, implementations, ownership boundaries, and what crosses each boundary. State what each layer may know and what must not leak across the seam.
>
> Completion criterion: every new or changed boundary has a concrete type/interface/API sketch, or an explicit reason no new contract is needed.
>
> ### 5. Specify call stacks and data flow
>
> For every new, changed, or deleted behavior, show the call stack from entrypoint to side effects and response.
>
> Include type/data flow:
>
> ```txt
> raw input
>   -> boundary DTO / unknown
>   -> parser
>   -> canonical domain/application input
>   -> service/module interface
>   -> adapter call
>   -> typed result/error
>   -> projection
>   -> serialized output
> ```
>
> Include current vs proposed flow when changing existing behavior. Include failure, retry, cancellation, transactionality, idempotency, observability, authorization, and runtime-hop flow when reachable.
>
> Completion criterion: every affected behavior has an end-to-end call stack and type/data-flow trace.
>
> ### 6. Map files and modules
>
> List:
>
> - files/modules to add;
> - files/modules to change;
> - files/modules to delete, if any;
> - test files;
> - config/migration/runtime files, if any.
>
> For each file, state the contract, code path, boundary, adapter, domain concept, or test responsibility it owns.
>
> Completion criterion: every contract and call-stack step maps to a file/module or an open question.
>
> ### 7. Write the RGR TDD test plan
>
> Use the sibling TDD workflow and testing standards. Plan vertical Red-Green-Refactor slices: one failing behavior test, minimal implementation, repeat. Do not write a horizontal "all tests first, all code later" plan.
>
> Favor behavior through public interfaces and real seams over implementation-coupled mocks.
>
> Cover proportionately:
>
> - happy paths;
> - failure paths;
> - parser rejection and accepted shapes;
> - domain invariants and state transitions;
> - adapter contracts;
> - persistence/runtime semantics;
> - cancellation/retry/idempotency paths;
> - observability and safe summaries where relevant;
> - end-to-end flows for high-consequence behavior.
>
> Completion criterion: every public behavior, invariant, important failure path, changed boundary, and changed seam has a red test slice or an explicit reason not to test it.
>
> ### 8. Produce the spec
>
> Return the spec inline unless the user requested a file path. If a file was requested, save it there.
>
> Do not implement and do not ask to implement by default.
>
> Completion criterion: the output follows the outline below and is implementation-ready for another engineer.
>
> ## Path B: Grill first
>
> 1. Do not write a full spec yet.
>    - State that there is not enough context for an implementation-ready tech spec.
>    - Completion criterion: the agent has not invented requirements, APIs, files, or call stacks.
> 2. Start a grilling interview.
>    - Ask one question at a time and provide the recommended answer with each question.
>    - If a question can be answered by exploring the codebase, inspect the codebase instead of asking.
>    - Completion criterion: the interview has enough context for Path A: problem, users/callers, constraints, affected systems, desired behavior, boundaries, likely APIs, invariants, risks, and acceptance tests.
> 3. Convert to the spec.
>    - Once grilling context is sufficient, run Path A.
>    - Completion criterion: the final artifact is a typed call-stack architecture handoff, not interview notes.
>
> ## Required spec outline
>
> Use this shape unless the task is tiny enough to compress without losing contracts or call stacks:
>
> ```md
> # <Title>
>
> ## Summary
>
> ## Context / Current State
>
> ## Goals
>
> ## Non-Goals
>
> ## Invariants
>
> ## Design Constraints
>
> ## Alternatives Considered
>
> ### Option 1: <name>
>
> ### Option 2: <name>
>
> ### Option 3: <name>
>
> ## Recommendation
>
> ## Proposed Design
>
> ## Domain Model and Types
>
> ## Types, Interfaces, and APIs
>
> ## Seams, Boundaries, Adapters, and Implementations
>
> ## Call Stacks and Data Flow
>
> ### Current / Old Flow
>
> ### Proposed / New Flow
>
> ### Failure Flow
>
> ### Retry / Cancellation / Idempotency Flow
>
> ### Observability Flow
>
> ## Files to Add / Change / Delete
>
> ## RGR TDD Test Plan
>
> ## Risks and Open Questions
> ```
>
> Omit sections that truly do not apply, but do not omit typed contracts, seams, call stacks, or tests merely because they are hard to specify.
>
> ## Writing rules
>
> - Code first: TypeScript pseudocode defines contracts, APIs, and data flow.
> - Prose explains why; types and call stacks define what changes.
> - Focus on types, interfaces, APIs, inputs/outputs, seams, boundaries, adapters, domain modules, service modules, external adapters, and call stacks.
> - Prefer precise domain values over strings, booleans, nullable bags, and loosely shaped objects.
> - Keep seams real: adapters translate framework, persistence, network, time, randomness, telemetry, runtime, or platform boundaries.
> - Avoid speculative abstraction; every seam earns its existence through invariants, locality, leverage, testing, or a real boundary.
> - Keep a single source of truth; do not restate the same rule in multiple sections unless one section points to the other.
> - Unknowns stay open questions. Do not invent product requirements, domain rules, APIs, or call stacks to make the spec feel complete.

---

## `tldr`

**Decision:** Pending

### Availability

- **Local:** `SKILL.md` SHA-256 `30ce7d41c6`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### Local `SKILL.md`

> ---
> name: tldr
> description: Toggle ultra-terse replies. Use when the user types /tldr or asks to "be brief", "keep it short", "tldr", "less verbose", or "short mode". Turn off with "/tldr off", "normal mode", or "be verbose". While on, replies are 5 lines or fewer until turned off. Never shortens code, commands, exact error messages, or security warnings.
> ---
>
> # tldr mode
>
> A persistent reply-length mode. It stays on until explicitly turned off.
>
> ## Toggle
>
> - Invoked with "off", "stop", "normal", or "verbose" -> reply `tldr off`, then resume the default style.
> - Otherwise -> reply `tldr on`, then apply the rules below to every reply until turned off.
>
> ## Rules while on
>
> - Max 5 lines. The result plus the next step, nothing else.
> - No preamble, no restating the request, no closing offer to help.
> - Do not narrate tool use unless asked.
> - One idea per line. Short bullets over paragraphs. Tables only if asked.
> - For a decision or risk: give the verdict in 5 lines or fewer, then one line: `say expand for the full reasoning`.
>
> ## Never shorten
>
> - Code or commands the user will run or paste.
> - Exact error messages and stack traces.
> - Security or data-loss warnings.

---

## `to-spec`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `267638edd5`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `267638edd5`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: to-spec
> description: Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
> disable-model-invocation: true
> ---
>
> This skill takes the current conversation context and codebase understanding and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what you already know.
>
> The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.
>
> ## Process
>
> 1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.
>
> 2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.
>
> Check with the user that these seams match their expectations.
>
> 3. Write the spec using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label - no need for additional triage.
>
> <spec-template>
>
> ## Problem Statement
>
> The problem that the user is facing, from the user's perspective.
>
> ## Solution
>
> The solution to the problem, from the user's perspective.
>
> ## User Stories
>
> A LONG, numbered list of user stories. Each user story should be in the format of:
>
> 1. As an <actor>, I want a <feature>, so that <benefit>
>
> <user-story-example>
> 1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
> </user-story-example>
>
> This list of user stories should be extremely extensive and cover all aspects of the feature.
>
> ## Implementation Decisions
>
> A list of implementation decisions that were made. This can include:
>
> - The modules that will be built/modified
> - The interfaces of those modules that will be modified
> - Technical clarifications from the developer
> - Architectural decisions
> - Schema changes
> - API contracts
> - Specific interactions
>
> Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.
>
> Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.
>
> ## Testing Decisions
>
> A list of testing decisions that were made. Include:
>
> - A description of what makes a good test (only test external behavior, not implementation details)
> - Which modules will be tested
> - Prior art for the tests (i.e. similar types of tests in the codebase)
>
> ## Out of Scope
>
> A description of the things that are out of scope for this spec.
>
> ## Further Notes
>
> Any further notes about the feature.
>
> </spec-template>

#### dmmulroy `SKILL.md`

> ---
> name: to-spec
> description: Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
> disable-model-invocation: true
> ---
>
> This skill takes the current conversation context and codebase understanding and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what you already know.
>
> The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.
>
> ## Process
>
> 1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.
>
> 2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.
>
> Check with the user that these seams match their expectations.
>
> 3. Write the spec using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label - no need for additional triage.
>
> <spec-template>
>
> ## Problem Statement
>
> The problem that the user is facing, from the user's perspective.
>
> ## Solution
>
> The solution to the problem, from the user's perspective.
>
> ## User Stories
>
> A LONG, numbered list of user stories. Each user story should be in the format of:
>
> 1. As an <actor>, I want a <feature>, so that <benefit>
>
> <user-story-example>
> 1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
> </user-story-example>
>
> This list of user stories should be extremely extensive and cover all aspects of the feature.
>
> ## Implementation Decisions
>
> A list of implementation decisions that were made. This can include:
>
> - The modules that will be built/modified
> - The interfaces of those modules that will be modified
> - Technical clarifications from the developer
> - Architectural decisions
> - Schema changes
> - API contracts
> - Specific interactions
>
> Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.
>
> Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.
>
> ## Testing Decisions
>
> A list of testing decisions that were made. Include:
>
> - A description of what makes a good test (only test external behavior, not implementation details)
> - Which modules will be tested
> - Prior art for the tests (i.e. similar types of tests in the codebase)
>
> ## Out of Scope
>
> A description of the things that are out of scope for this spec.
>
> ## Further Notes
>
> Any further notes about the feature.
>
> </spec-template>

---

## `to-tickets`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `5ecdf1d4df`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `5ecdf1d4df`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: to-tickets
> description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.
> disable-model-invocation: true
> ---
>
> # To Tickets
>
> Break a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring the tickets that **block** it.
>
> The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.
>
> ## Process
>
> ### 1. Gather context
>
> Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.
>
> ### 2. Explore the codebase (optional)
>
> If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.
>
> Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."
>
> ### 3. Draft vertical slices
>
> Break the work into **tracer bullet** tickets.
>
> <vertical-slice-rules>
>
> - Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
> - A completed slice is demoable or verifiable on its own
> - Each slice is sized to fit in a single fresh context window
> - Any prefactoring should be done first
>
> </vertical-slice-rules>
>
> Give each ticket its **blocking edges** — the other tickets that must complete before it can start. A ticket with no blockers can start immediately.
>
> **Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.
>
> ### 4. Quiz the user
>
> Present the proposed breakdown as a numbered list. For each ticket, show:
>
> - **Title**: short descriptive name
> - **Blocked by**: which other tickets (if any) must complete first
> - **What it delivers**: the end-to-end behaviour this ticket makes work
>
> Ask the user:
>
> - Does the granularity feel right? (too coarse / too fine)
> - Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
> - Should any tickets be merged or split further?
>
> Iterate until the user approves the breakdown.
>
> ### 5. Publish the tickets to the configured tracker
>
> Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured — the tickets are the same either way, only the shape of the blocking edges changes:
>
> - **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below — one ticket per file, never a single combined file.
> - **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise — the tickets are agent-grabbable by construction.
>
> Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.
>
> Do NOT close or modify any parent issue.
>
> <local-ticket-template>
>
> # <NN> — <Ticket title>
>
> **What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective — not a layer-by-layer implementation list.
>
> **Blocked by:** the numbers/titles of the tickets that gate this one, or "None — can start immediately".
>
> **Status:** ready-for-agent
>
> - [ ] Acceptance criterion 1
> - [ ] Acceptance criterion 2
>
> </local-ticket-template>
>
> <issue-template>
>
> ## Parent
>
> A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).
>
> ## What to build
>
> The end-to-end behaviour this ticket makes work, from the user's perspective — not layer-by-layer implementation.
>
> ## Acceptance criteria
>
> - [ ] Criterion 1
> - [ ] Criterion 2
>
> ## Blocked by
>
> - A reference to each blocking ticket, or "None — can start immediately".
>
> </issue-template>
>
> In either form, avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

#### dmmulroy `SKILL.md`

> ---
> name: to-tickets
> description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.
> disable-model-invocation: true
> ---
>
> # To Tickets
>
> Break a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring the tickets that **block** it.
>
> The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.
>
> ## Process
>
> ### 1. Gather context
>
> Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.
>
> ### 2. Explore the codebase (optional)
>
> If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.
>
> Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."
>
> ### 3. Draft vertical slices
>
> Break the work into **tracer bullet** tickets.
>
> <vertical-slice-rules>
>
> - Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
> - A completed slice is demoable or verifiable on its own
> - Each slice is sized to fit in a single fresh context window
> - Any prefactoring should be done first
>
> </vertical-slice-rules>
>
> Give each ticket its **blocking edges** — the other tickets that must complete before it can start. A ticket with no blockers can start immediately.
>
> **Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.
>
> ### 4. Quiz the user
>
> Present the proposed breakdown as a numbered list. For each ticket, show:
>
> - **Title**: short descriptive name
> - **Blocked by**: which other tickets (if any) must complete first
> - **What it delivers**: the end-to-end behaviour this ticket makes work
>
> Ask the user:
>
> - Does the granularity feel right? (too coarse / too fine)
> - Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
> - Should any tickets be merged or split further?
>
> Iterate until the user approves the breakdown.
>
> ### 5. Publish the tickets to the configured tracker
>
> Publish the approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured — the tickets are the same either way, only the shape of the blocking edges changes:
>
> - **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below — one ticket per file, never a single combined file.
> - **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise — the tickets are agent-grabbable by construction.
>
> Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.
>
> Do NOT close or modify any parent issue.
>
> <local-ticket-template>
>
> # <NN> — <Ticket title>
>
> **What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective — not a layer-by-layer implementation list.
>
> **Blocked by:** the numbers/titles of the tickets that gate this one, or "None — can start immediately".
>
> **Status:** ready-for-agent
>
> - [ ] Acceptance criterion 1
> - [ ] Acceptance criterion 2
>
> </local-ticket-template>
>
> <issue-template>
>
> ## Parent
>
> A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).
>
> ## What to build
>
> The end-to-end behaviour this ticket makes work, from the user's perspective — not layer-by-layer implementation.
>
> ## Acceptance criteria
>
> - [ ] Criterion 1
> - [ ] Criterion 2
>
> ## Blocked by
>
> - A reference to each blocking ticket, or "None — can start immediately".
>
> </issue-template>
>
> In either form, avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

---

## `triage`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `d45827c299`; support: `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `d45827c299`; support: `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `AGENT-BRIEF.md`, `OUT-OF-SCOPE.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: triage
> description: Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write agent-ready briefs.
> disable-model-invocation: true
> ---
>
> # Triage
>
> Move issues on the project issue tracker through a small state machine of triage roles.
>
> If this repo treats external pull requests as a request surface (see the issue-tracker config), triage covers them too: **a PR is an issue with attached code** — same roles, same states, same machine, with a few deltas marked "for a PR" below. Resolve a bare `#42` to an issue or PR per the tracker config.
>
> Every comment or issue posted to the issue tracker during triage **must** start with this disclaimer:
>
> ```
> > *This was generated by AI during triage.*
> ```
>
> ## Reference docs
>
> - [AGENT-BRIEF.md](AGENT-BRIEF.md) — how to write durable agent briefs
> - [OUT-OF-SCOPE.md](OUT-OF-SCOPE.md) — how the `.out-of-scope/` knowledge base works
>
> ## Roles
>
> Two **category** roles:
>
> - `bug` — something is broken
> - `enhancement` — new feature or improvement
>
> Five **state** roles:
>
> - `needs-triage` — maintainer needs to evaluate
> - `needs-info` — waiting on reporter for more information
> - `ready-for-agent` — fully specified, ready for an AFK agent
> - `ready-for-human` — needs human implementation
> - `wontfix` — will not be actioned
>
> For a PR, the same states read against the attached code: `ready-for-agent` means a brief is attached and an agent should take the next step on the diff; `ready-for-human` means it's ready for a human to merge.
>
> Every triaged issue should carry exactly one category role and one state role. If state roles conflict, flag it and ask the maintainer before doing anything else.
>
> These are canonical role names — the actual label strings used in the issue tracker may differ. The mapping should have been provided to you - run `/setup-matt-pocock-skills` if not.
>
> State transitions: an unlabeled issue normally goes to `needs-triage` first; from there it moves to `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. `needs-info` returns to `needs-triage` once the reporter replies. The maintainer can override at any time — flag transitions that look unusual and ask before proceeding.
>
> ## Invocation
>
> The maintainer invokes `/triage` and describes what they want in natural language. Interpret the request and act. Examples:
>
> - "Show me anything that needs my attention"
> - "Let's look at #42" (issue or PR)
> - "Move #42 to ready-for-agent"
> - "What's ready for agents to pick up?"
>
> ## Show what needs attention
>
> Query the issue tracker and present three buckets, oldest first:
>
> 1. **Unlabeled** — never triaged.
> 2. **`needs-triage`** — evaluation in progress.
> 3. **`needs-info` with reporter activity since the last triage notes** — needs re-evaluation.
>
> When PRs are in scope, include external PRs in these buckets and tag each line `[PR]` or `[issue]`. Discovery surfaces only *external* PRs (the tracker config defines who counts as external) — a collaborator's in-flight PR is not triage work. This filter is discovery-only; an explicitly named PR is always triaged regardless of author.
>
> Show counts and a one-line summary per item. Let the maintainer pick.
>
> ## Triage a specific issue or PR
>
> 1. **Gather context.** Read the full issue or PR (body, comments, labels, author, dates; for a PR, the diff too). Parse any prior triage notes so you don't re-ask resolved questions. Explore the codebase using the project's domain glossary, respecting ADRs in the area. Run two checks against the codebase: (a) **redundancy** — search for an existing implementation of the requested behavior by domain concept (not just the request's wording), and report where you looked. If found, it's an already-implemented `wontfix` (step 5). (b) **prior rejection** — read `.out-of-scope/*.md` and surface any that resembles this request.
>
> 2. **Recommend.** Tell the maintainer your category and state recommendation with reasoning, plus a brief codebase summary relevant to the request — including whether it's already implemented. Wait for direction.
>
> 3. **Verify the claim.** Before any grilling, check that the claim holds up. For a bug, reproduce it from the reporter's steps. For a PR, confirm the diff does what it claims — check it out, run the relevant tests or commands. Report what happened: confirmed (with code path), failed, or insufficient detail (a strong `needs-info` signal). A confirmed verification makes a much stronger agent brief.
>
> 4. **Grill (if needed).** If the request needs fleshing out, run the `/grilling` and `/domain-modeling` skills together — grill it into shape one question at a time, sharpening domain terms and updating `CONTEXT.md`/ADRs inline as decisions land.
>
> 5. **Apply the outcome:**
>    - `ready-for-agent` — post an agent brief comment ([AGENT-BRIEF.md](AGENT-BRIEF.md)).
>    - `ready-for-human` — same structure as an agent brief, but note why it can't be delegated (judgment calls, external access, design decisions, manual testing).
>    - `needs-info` — post triage notes (template below).
>    - `wontfix` — close, with the comment depending on *why*:
>      - **Already implemented** — the change already exists in the codebase. Point to where it lives; do **not** write to `.out-of-scope/` (that KB is for *rejected* requests, not built ones).
>      - **Rejected (bug)** — polite explanation, then close.
>      - **Rejected (enhancement)** — write to `.out-of-scope/`, link to it from a comment, then close ([OUT-OF-SCOPE.md](OUT-OF-SCOPE.md)).
>    - `needs-triage` — apply the role. Optional comment if there's partial progress.
>
> ## Quick state override
>
> If the maintainer says "move #42 to ready-for-agent", trust them and apply the role directly. Confirm what you're about to do (role changes, comment, close), then act. Skip grilling. If moving to `ready-for-agent` without a grilling session, ask whether they want to write an agent brief.
>
> ## Needs-info template
>
> ```markdown
> ## Triage Notes
>
> **What we've established so far:**
>
> - point 1
> - point 2
>
> **What we still need from you (@reporter):**
>
> - question 1
> - question 2
> ```
>
> Capture everything resolved during grilling under "established so far" so the work isn't lost. Questions must be specific and actionable, not "please provide more info".
>
> ## Resuming a previous session
>
> If prior triage notes exist on the issue or PR, read them, check whether the reporter has answered any outstanding questions, and present an updated picture before continuing. Don't re-ask resolved questions.

#### dmmulroy `SKILL.md`

> ---
> name: triage
> description: Move issues and external PRs through a state machine of triage roles — categorise, verify, grill if needed, and write agent-ready briefs.
> disable-model-invocation: true
> ---
>
> # Triage
>
> Move issues on the project issue tracker through a small state machine of triage roles.
>
> If this repo treats external pull requests as a request surface (see the issue-tracker config), triage covers them too: **a PR is an issue with attached code** — same roles, same states, same machine, with a few deltas marked "for a PR" below. Resolve a bare `#42` to an issue or PR per the tracker config.
>
> Every comment or issue posted to the issue tracker during triage **must** start with this disclaimer:
>
> ```
> > *This was generated by AI during triage.*
> ```
>
> ## Reference docs
>
> - [AGENT-BRIEF.md](AGENT-BRIEF.md) — how to write durable agent briefs
> - [OUT-OF-SCOPE.md](OUT-OF-SCOPE.md) — how the `.out-of-scope/` knowledge base works
>
> ## Roles
>
> Two **category** roles:
>
> - `bug` — something is broken
> - `enhancement` — new feature or improvement
>
> Five **state** roles:
>
> - `needs-triage` — maintainer needs to evaluate
> - `needs-info` — waiting on reporter for more information
> - `ready-for-agent` — fully specified, ready for an AFK agent
> - `ready-for-human` — needs human implementation
> - `wontfix` — will not be actioned
>
> For a PR, the same states read against the attached code: `ready-for-agent` means a brief is attached and an agent should take the next step on the diff; `ready-for-human` means it's ready for a human to merge.
>
> Every triaged issue should carry exactly one category role and one state role. If state roles conflict, flag it and ask the maintainer before doing anything else.
>
> These are canonical role names — the actual label strings used in the issue tracker may differ. The mapping should have been provided to you - run `/setup-matt-pocock-skills` if not.
>
> State transitions: an unlabeled issue normally goes to `needs-triage` first; from there it moves to `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. `needs-info` returns to `needs-triage` once the reporter replies. The maintainer can override at any time — flag transitions that look unusual and ask before proceeding.
>
> ## Invocation
>
> The maintainer invokes `/triage` and describes what they want in natural language. Interpret the request and act. Examples:
>
> - "Show me anything that needs my attention"
> - "Let's look at #42" (issue or PR)
> - "Move #42 to ready-for-agent"
> - "What's ready for agents to pick up?"
>
> ## Show what needs attention
>
> Query the issue tracker and present three buckets, oldest first:
>
> 1. **Unlabeled** — never triaged.
> 2. **`needs-triage`** — evaluation in progress.
> 3. **`needs-info` with reporter activity since the last triage notes** — needs re-evaluation.
>
> When PRs are in scope, include external PRs in these buckets and tag each line `[PR]` or `[issue]`. Discovery surfaces only *external* PRs (the tracker config defines who counts as external) — a collaborator's in-flight PR is not triage work. This filter is discovery-only; an explicitly named PR is always triaged regardless of author.
>
> Show counts and a one-line summary per item. Let the maintainer pick.
>
> ## Triage a specific issue or PR
>
> 1. **Gather context.** Read the full issue or PR (body, comments, labels, author, dates; for a PR, the diff too). Parse any prior triage notes so you don't re-ask resolved questions. Explore the codebase using the project's domain glossary, respecting ADRs in the area. Run two checks against the codebase: (a) **redundancy** — search for an existing implementation of the requested behavior by domain concept (not just the request's wording), and report where you looked. If found, it's an already-implemented `wontfix` (step 5). (b) **prior rejection** — read `.out-of-scope/*.md` and surface any that resembles this request.
>
> 2. **Recommend.** Tell the maintainer your category and state recommendation with reasoning, plus a brief codebase summary relevant to the request — including whether it's already implemented. Wait for direction.
>
> 3. **Verify the claim.** Before any grilling, check that the claim holds up. For a bug, reproduce it from the reporter's steps. For a PR, confirm the diff does what it claims — check it out, run the relevant tests or commands. Report what happened: confirmed (with code path), failed, or insufficient detail (a strong `needs-info` signal). A confirmed verification makes a much stronger agent brief.
>
> 4. **Grill (if needed).** If the request needs fleshing out, run the `/grilling` and `/domain-modeling` skills together — grill it into shape one question at a time, sharpening domain terms and updating `CONTEXT.md`/ADRs inline as decisions land.
>
> 5. **Apply the outcome:**
>    - `ready-for-agent` — post an agent brief comment ([AGENT-BRIEF.md](AGENT-BRIEF.md)).
>    - `ready-for-human` — same structure as an agent brief, but note why it can't be delegated (judgment calls, external access, design decisions, manual testing).
>    - `needs-info` — post triage notes (template below).
>    - `wontfix` — close, with the comment depending on *why*:
>      - **Already implemented** — the change already exists in the codebase. Point to where it lives; do **not** write to `.out-of-scope/` (that KB is for *rejected* requests, not built ones).
>      - **Rejected (bug)** — polite explanation, then close.
>      - **Rejected (enhancement)** — write to `.out-of-scope/`, link to it from a comment, then close ([OUT-OF-SCOPE.md](OUT-OF-SCOPE.md)).
>    - `needs-triage` — apply the role. Optional comment if there's partial progress.
>
> ## Quick state override
>
> If the maintainer says "move #42 to ready-for-agent", trust them and apply the role directly. Confirm what you're about to do (role changes, comment, close), then act. Skip grilling. If moving to `ready-for-agent` without a grilling session, ask whether they want to write an agent brief.
>
> ## Needs-info template
>
> ```markdown
> ## Triage Notes
>
> **What we've established so far:**
>
> - point 1
> - point 2
>
> **What we still need from you (@reporter):**
>
> - question 1
> - question 2
> ```
>
> Capture everything resolved during grilling under "established so far" so the work isn't lost. Questions must be specific and actionable, not "please provide more info".
>
> ## Resuming a previous session
>
> If prior triage notes exist on the issue or PR, read them, check whether the reporter has answered any outstanding questions, and present an updated picture before continuing. Don't re-ask resolved questions.

---

## `wayfinder`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `257e40665b`; support: `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `257e40665b`; support: `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: wayfinder
> description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.
> disable-model-invocation: true
> ---
>
> A loose idea has arrived — too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** — questions whose resolution is a decision, not slices of a build to execute — one at a time until the route is clear.
>
> The destination varies per effort, and naming it is the first act of charting — it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic — engineering work, course content, whatever fits the shape.
>
> ## Plan, don't do
>
> Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear — nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes** — carrying execution into the map itself — but absent that, produce decisions, not deliverables.
>
> ## Refer by name
>
> Every map and ticket is an issue, so it has a **name** — its title. In everything the human reads — narration, the map's Decisions-so-far — refer to it by that name, never by a bare id, number, or slug. A wall of `#42, #43, #44` is illegible; names read at a glance. The id and URL don't vanish — a name wraps its link — but they ride *inside* the name, never stand in for it.
>
> ## The Map
>
> The map is a single issue on this repo's issue tracker, labelled `wayfinder:map` — the canonical artifact. Its tickets are child issues of the map.
>
> The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place — its ticket — so the map never restates it, only gists it and links.
>
> **Where the map, its child tickets, blocking, and frontier queries physically live is tracker-specific.** The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if not. Consult the tracker doc's "Wayfinding operations" section for how _this_ repo expresses them. If no tracker has been provided, default to the local-markdown tracker.
>
> ### The map body
>
> The whole map at low resolution, loaded once per session. Open tickets are **not** listed — they are open child issues, found by query.
>
> ```markdown
> ## Destination
>
> <what reaching the end of this map looks like — the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>
>
> ## Notes
>
> <domain; skills every session should consult; standing preferences for this effort>
>
> ## Decisions so far
>
> <!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->
>
> - [<closed ticket title>](link) — <one-line gist of the answer>
>
> ## Not yet specified
>
> <!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->
>
> ## Out of scope
>
> <!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
> ```
>
> ### Tickets
>
> Each ticket is a **child issue** of the map; the tracker's issue id is its identity. Its body is the question, sized to one 100K token agent session:
>
> ```markdown
> ## Question
>
> <the decision or investigation this ticket resolves>
> ```
>
> Each ticket carries a `wayfinder:<type>` label — one of `research`, `prototype`, `grilling`, `task` (see [Ticket Types](#ticket-types)).
>
> A session **claims** a ticket by assigning it to the dev driving the map, **first**, before any work, so concurrent sessions skip it. That assignee _is_ the claim: an open, unassigned ticket is unclaimed.
>
> Blocking uses the tracker's **native** dependency relationship — essential because it renders the frontier _visually_ in the tracker's own UI, so the human sees what's takeable without opening the map. Only a tracker that lacks native blocking falls back to a body convention. A ticket is **unblocked** when every ticket blocking it is closed; the **frontier** is the open, unblocked, unclaimed children — the edge of the known.
>
> The answer isn't part of the body — it's recorded on resolution (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the issue, not pasted in.
>
> ## Ticket Types
>
> Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks for themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).
>
> - **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a `/research` **subagent**. Use when knowledge outside the current working directory is required.
> - **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to — an outline, a rough take, a stub, or UI/logic code via the /prototype skill. Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
> - **Grilling** (HITL): Conversation via the /grilling and /domain-modeling skills, one question at a time. The default case.
> - **Task** (HITL or AFK): Manual work that must happen before a *decision* can be made — nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that *does* rather than decides — and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.
>
> ## Fog of war
>
> The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war** — the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets — one at a time, until the way to the destination is clear and no tickets remain.
>
> The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination — everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.
>
> **Fog or ticket?** The test is whether you can state the question precisely now — _not_ whether you can answer it now.
>
> - **Ticket when** the question is already sharp — even if it's blocked and you can't act on it yet.
> - **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.
>
> **Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).
>
> ## Out of scope
>
> Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope** — it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.
>
> Out-of-scope work never graduates — the frontier stops at the destination — so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.
>
> Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination — mis-scoped in while charting, or exposed by a resolution — **close it** (a closed ticket is unambiguously off the frontier) and leave one line in the **Out of scope** section: the gist plus why it's out of scope, linking the closed ticket. It stays out of **Decisions so far**, which records the route actually walked — a scope boundary isn't a step on it.
>
> ## Invocation
>
> Two modes. Either way, **never resolve more than one ticket per session** — with the exception of research tickets.
>
> ### Chart the map
>
> User invokes with a loose idea.
>
> 1. **Name the destination.** Run a `/grilling` and `/domain-modeling` session to pin down what this map is finding its way to — the spec, decision, or change. The destination fixes the scope, so it's settled first.
> 2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** — the way to the destination is already clear, the whole journey small enough for one session — you don't need a map. Stop and ask the user how they'd like to proceed.
> 3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
> 4. **Create the tickets you can specify now** as child issues of the map — then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog — the **Not yet specified** section.
> 5. **Fire the research subagents.** For each `research` ticket you just created, spin up a `/research` subagent to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
> 6. Stop — charting is one session's work; it hand-resolves nothing.
>
> ### Work through the map
>
> User invokes with a map (URL or number). A ticket is **optional** — without one, you pick the next decision, not the user.
>
> 1. Load the **map** — the low-res view, not every ticket body.
> 2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
> 3. Resolve it — **zoom as needed**: fetch the full body of any related or closed ticket on demand; invoke the skills the `## Notes` block names. If in doubt, use `/grilling` and `/domain-modeling`.
> 4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
> 5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals a ticket — this one or another — sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.
>
> The user may run unblocked tickets in parallel, so expect other sessions to be editing the tracker concurrently.

#### dmmulroy `SKILL.md`

> ---
> name: wayfinder
> description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.
> disable-model-invocation: true
> ---
>
> A loose idea has arrived — too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** — questions whose resolution is a decision, not slices of a build to execute — one at a time until the route is clear.
>
> The destination varies per effort, and naming it is the first act of charting — it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic — engineering work, course content, whatever fits the shape.
>
> ## Plan, don't do
>
> Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear — nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes** — carrying execution into the map itself — but absent that, produce decisions, not deliverables.
>
> ## Refer by name
>
> Every map and ticket is an issue, so it has a **name** — its title. In everything the human reads — narration, the map's Decisions-so-far — refer to it by that name, never by a bare id, number, or slug. A wall of `#42, #43, #44` is illegible; names read at a glance. The id and URL don't vanish — a name wraps its link — but they ride *inside* the name, never stand in for it.
>
> ## The Map
>
> The map is a single issue on this repo's issue tracker, labelled `wayfinder:map` — the canonical artifact. Its tickets are child issues of the map.
>
> The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place — its ticket — so the map never restates it, only gists it and links.
>
> **Where the map, its child tickets, blocking, and frontier queries physically live is tracker-specific.** The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if not. Consult the tracker doc's "Wayfinding operations" section for how _this_ repo expresses them. If no tracker has been provided, default to the local-markdown tracker.
>
> ### The map body
>
> The whole map at low resolution, loaded once per session. Open tickets are **not** listed — they are open child issues, found by query.
>
> ```markdown
> ## Destination
>
> <what reaching the end of this map looks like — the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>
>
> ## Notes
>
> <domain; skills every session should consult; standing preferences for this effort>
>
> ## Decisions so far
>
> <!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail the ticket holds -->
>
> - [<closed ticket title>](link) — <one-line gist of the answer>
>
> ## Not yet specified
>
> <!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->
>
> ## Out of scope
>
> <!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
> ```
>
> ### Tickets
>
> Each ticket is a **child issue** of the map; the tracker's issue id is its identity. Its body is the question, sized to one 100K token agent session:
>
> ```markdown
> ## Question
>
> <the decision or investigation this ticket resolves>
> ```
>
> Each ticket carries a `wayfinder:<type>` label — one of `research`, `prototype`, `grilling`, `task` (see [Ticket Types](#ticket-types)).
>
> A session **claims** a ticket by assigning it to the dev driving the map, **first**, before any work, so concurrent sessions skip it. That assignee _is_ the claim: an open, unassigned ticket is unclaimed.
>
> Blocking uses the tracker's **native** dependency relationship — essential because it renders the frontier _visually_ in the tracker's own UI, so the human sees what's takeable without opening the map. Only a tracker that lacks native blocking falls back to a body convention. A ticket is **unblocked** when every ticket blocking it is closed; the **frontier** is the open, unblocked, unclaimed children — the edge of the known.
>
> The answer isn't part of the body — it's recorded on resolution (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the issue, not pasted in.
>
> ## Ticket Types
>
> Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks for themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).
>
> - **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a `/research` **subagent**. Use when knowledge outside the current working directory is required.
> - **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to — an outline, a rough take, a stub, or UI/logic code via the /prototype skill. Links the prototype as an asset. Use when "how should it look" or "how should it behave" is the key question.
> - **Grilling** (HITL): Conversation via the /grilling and /domain-modeling skills, one question at a time. The default case.
> - **Task** (HITL or AFK): Manual work that must happen before a *decision* can be made — nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that *does* rather than decides — and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.
>
> ## Fog of war
>
> The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war** — the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets — one at a time, until the way to the destination is clear and no tickets remain.
>
> The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination — everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.
>
> **Fog or ticket?** The test is whether you can state the question precisely now — _not_ whether you can answer it now.
>
> - **Ticket when** the question is already sharp — even if it's blocked and you can't act on it yet.
> - **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.
>
> **Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).
>
> ## Out of scope
>
> Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope** — it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.
>
> Out-of-scope work never graduates — the frontier stops at the destination — so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.
>
> Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination — mis-scoped in while charting, or exposed by a resolution — **close it** (a closed ticket is unambiguously off the frontier) and leave one line in the **Out of scope** section: the gist plus why it's out of scope, linking the closed ticket. It stays out of **Decisions so far**, which records the route actually walked — a scope boundary isn't a step on it.
>
> ## Invocation
>
> Two modes. Either way, **never resolve more than one ticket per session** — with the exception of research tickets.
>
> ### Chart the map
>
> User invokes with a loose idea.
>
> 1. **Name the destination.** Run a `/grilling` and `/domain-modeling` session to pin down what this map is finding its way to — the spec, decision, or change. The destination fixes the scope, so it's settled first.
> 2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** — the way to the destination is already clear, the whole journey small enough for one session — you don't need a map. Stop and ask the user how they'd like to proceed.
> 3. **Create the map** (label `wayfinder:map`): Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
> 4. **Create the tickets you can specify now** as child issues of the map — then wire blocking edges in a **second pass** (issues need ids before they can reference each other). Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog — the **Not yet specified** section.
> 5. **Fire the research subagents.** For each `research` ticket you just created, spin up a `/research` subagent to resolve it in parallel, capturing its findings on a throwaway `research/<name>` branch with a context pointer from the ticket.
> 6. Stop — charting is one session's work; it hand-resolves nothing.
>
> ### Work through the map
>
> User invokes with a map (URL or number). A ticket is **optional** — without one, you pick the next decision, not the user.
>
> 1. Load the **map** — the low-res view, not every ticket body.
> 2. Choose the ticket. If the user named one, use it. Otherwise take the first frontier ticket in order. **Claim it**: assign it to yourself before any work.
> 3. Resolve it — **zoom as needed**: fetch the full body of any related or closed ticket on demand; invoke the skills the `## Notes` block names. If in doubt, use `/grilling` and `/domain-modeling`.
> 4. Record the resolution: post the answer as a **resolution comment**, **close** the issue, and **append a context pointer** to the map's Decisions-so-far.
> 5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals a ticket — this one or another — sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or delete those tickets.
>
> The user may run unblocked tickets in parallel, so expect other sessions to be editing the tracker concurrently.

---

## `workday-training`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `ab7922f534`; support: `references/chrome-browser.md`, `references/helium-browser.md`, `references/other-browsers.md`, `references/scorm-12-api.md`

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: workday-training
> description: "Complete Workday learning courses, certifications, and compliance trainings — especially SCORM 1.2 modules (e.g. Traliant, Articulate Storyline). Connects to an existing Chromium-based browser via CDP and manipulates the SCORM LMS API directly to bypass slow UI interactions. Use when asked to complete trainings, certifications, or compliance courses on Workday."
> disable-model-invocation: true
> ---
>
> # Workday Training Completion
>
> Complete Workday learning courses efficiently by connecting to an existing browser session via CDP and manipulating the SCORM 1.2 LMS API directly rather than clicking through slides.
>
> ## Prerequisites
>
> - `agent-browser` installed globally (`vp install -g agent-browser` or `npm install -g agent-browser`)
> - A Chromium-based browser with the Workday session already authenticated
> - The browser must have remote debugging enabled (via launch flag or built-in DevTools setting)
>
> ## Step 1: Connect to the Browser via CDP
>
> Any Chromium-based browser exposes a CDP (Chrome DevTools Protocol) endpoint when remote debugging is enabled. The connection method depends on the browser.
>
> ### Generic approach
>
> All Chromium-based browsers write a `DevToolsActivePort` file to their user data directory when remote debugging is active. It contains two lines: the port number and the WebSocket path.
>
> ```bash
> PORT=$(head -1 "<browser-user-data-dir>/DevToolsActivePort")
> GUID=$(tail -1 "<browser-user-data-dir>/DevToolsActivePort")
> export CDP="ws://127.0.0.1:${PORT}${GUID}"
> ```
>
> If the browser was launched with an explicit `--remote-debugging-port=<N>`:
>
> ```bash
> agent-browser --cdp <N> tab          # port-based (works when HTTP discovery is available)
> # or
> export CDP="ws://127.0.0.1:<N>"      # WebSocket-based
> ```
>
> ### Browser-specific references
>
> Each browser has different data directory paths and CDP quirks. See the appropriate reference:
>
> - **Helium Browser** — [references/helium-browser.md](references/helium-browser.md) ⚠️ Has CDP quirks; read before connecting
> - **Google Chrome** — [references/chrome-browser.md](references/chrome-browser.md)
> - **Other Chromium forks** (Brave, Edge, Arc, Vivaldi, ungoogled-chromium) — [references/other-browsers.md](references/other-browsers.md)
>
> ### Verify Connection
>
> ```bash
> agent-browser --cdp "$CDP" tab
> ```
>
> This lists all open tabs. Find the Workday tab.
>
> ## Step 2: Navigate to the Course
>
> ### If the user provides a URL
>
> ```bash
> agent-browser --cdp "$CDP" tab <N>  # Switch to Workday tab
> agent-browser --cdp "$CDP" open "<course-url>"
> ```
>
> ### If already on the course page
>
> ```bash
> agent-browser --cdp "$CDP" tab <N>
> agent-browser --cdp "$CDP" screenshot /tmp/workday-course.png
> ```
>
> Take a screenshot to verify the course page and understand the lesson structure (how many lessons, what types).
>
> ## Step 3: Identify Lesson Types
>
> Workday courses consist of ordered lessons. Each lesson has a type visible in the sidebar:
>
> | Type | Description | Completion Strategy |
> |------|-------------|-------------------|
> | **Media** | SCORM module (Traliant, Articulate Storyline, etc.) | SCORM API manipulation (see Step 4) |
> | **External Link** | Opens a URL in a new tab | Click the link, return to course page |
> | **Survey** | Feedback survey | Usually marked Optional; can be skipped |
> | **Document** | View a document | Click to view, return |
>
> Use `agent-browser --cdp "$CDP" snapshot -i` to get the interactive element tree and identify lesson links, "Next Lesson" buttons, etc.
>
> ## Step 4: Complete SCORM 1.2 Media Lessons
>
> This is the core technique. SCORM 1.2 modules embed an iframe that communicates with a parent frame via the SCORM 1.2 API (`window.API`).
>
> ### 4a: Understand the Tab/Frame Structure
>
> When a SCORM lesson loads, Workday creates an iframe architecture:
>
> ```
> Tab N: Workday course page (*.myworkday.com)
>   └── iframe: ScormEngineInterface (scorm engine wrapper)
>         ├── window.API  ← SCORM 1.2 LMS API lives HERE
>         └── iframe: Course content (Storyline/Traliant player)
>               └── DS.playerGlobals (Articulate internals, if needed)
> ```
>
> The SCORM API (`window.API`) is on the **ScormEngineInterface** tab/frame, NOT the main Workday tab and NOT the inner content iframe.
>
> ### 4b: Find the SCORM API Tab
>
> After clicking into a Media lesson and waiting for it to load:
>
> ```bash
> agent-browser --cdp "$CDP" tab
> ```
>
> Look for a tab with "ScormEngineInterface" in the title or URL, or a tab whose URL contains `scormengine` or `rustici`. It may also appear as an untitled tab.
>
> Switch to that tab and verify:
>
> ```bash
> agent-browser --cdp "$CDP" tab <SCORM_TAB>
> agent-browser --cdp "$CDP" eval "typeof window.API !== 'undefined' && typeof window.API.LMSGetValue === 'function'"
> ```
>
> If this returns `true`, you found it.
>
> ### 4c: Check Current SCORM State
>
> ```bash
> agent-browser --cdp "$CDP" eval '(() => {
>   const api = window.API;
>   return JSON.stringify({
>     status: api.LMSGetValue("cmi.core.lesson_status"),
>     score: api.LMSGetValue("cmi.core.score.raw"),
>     location: api.LMSGetValue("cmi.core.lesson_location"),
>     suspend: api.LMSGetValue("cmi.suspend_data"),
>     time: api.LMSGetValue("cmi.core.total_time")
>   }, null, 2);
> })()'
> ```
>
> ### 4d: Set Completion and Score
>
> ```bash
> agent-browser --cdp "$CDP" eval '(() => {
>   const api = window.API;
>   api.LMSSetValue("cmi.core.score.raw", "100");
>   api.LMSSetValue("cmi.core.score.min", "0");
>   api.LMSSetValue("cmi.core.score.max", "100");
>   api.LMSSetValue("cmi.core.lesson_status", "passed");
>   api.LMSSetValue("cmi.core.session_time", "0001:30:00.0");
>   const commitResult = api.LMSCommit("");
>   const finishResult = api.LMSFinish("");
>   return JSON.stringify({ commitResult, finishResult });
> })()'
> ```
>
> Both `LMSCommit` and `LMSFinish` should return `"true"`.
>
> **Critical:** You MUST call `LMSCommit("")` before `LMSFinish("")`. `LMSCommit` flushes the data to the LMS server. `LMSFinish` ends the session. Without `LMSCommit`, the score/status may not persist.
>
> ### 4e: Return to Course Page
>
> Switch back to the Workday course tab and verify the lesson shows a green checkmark:
>
> ```bash
> agent-browser --cdp "$CDP" tab <WORKDAY_TAB>
> agent-browser --cdp "$CDP" screenshot /tmp/after-lesson.png
> ```
>
> ## Step 5: Complete External Link Lessons
>
> These just require clicking the external link button:
>
> ```bash
> agent-browser --cdp "$CDP" snapshot -i
> # Find the "View External Link" button
> agent-browser --cdp "$CDP" click @e<N>  # The "Leave Workday site: View External Link" button
> ```
>
> Wait for the new tab to open, then switch back to the Workday tab. Workday registers completion when the link is clicked.
>
> ## Step 6: Handle Optional Lessons (Surveys)
>
> When all required lessons are complete and you advance to an optional lesson, Workday shows a modal:
>
> > **"All Required Lessons Completed"**
> > "Continue to take optional lessons now or continue to complete course to skip optional lessons."
>
> Click **"Continue to Complete"** to finish the course without doing optional lessons:
>
> ```bash
> agent-browser --cdp "$CDP" snapshot -i
> # Find "Continue to Complete" button
> agent-browser --cdp "$CDP" click @e<N>
> ```
>
> ## Step 7: Verify Course Completion
>
> The course completion page shows a trophy graphic and **"Course Completed!"** text. Take a final screenshot to confirm:
>
> ```bash
> agent-browser --cdp "$CDP" screenshot /tmp/course-complete.png
> ```
>
> ## Troubleshooting
>
> ### SCORM API not found on any tab
>
> The SCORM engine may load inside an iframe rather than a separate tab. Try evaluating on the main Workday tab with frame traversal:
>
> ```bash
> agent-browser --cdp "$CDP" eval '(() => {
>   for (let i = 0; i < window.frames.length; i++) {
>     try {
>       if (window.frames[i].API) return "Found API in frame " + i;
>     } catch(e) { /* cross-origin */ }
>   }
>   return "API not found in any frame";
> })()'
> ```
>
> ### LMSCommit returns "false"
>
> The SCORM engine may require specific data fields. Check the error:
>
> ```bash
> agent-browser --cdp "$CDP" eval "window.API.LMSGetLastError()"
> agent-browser --cdp "$CDP" eval "window.API.LMSGetErrorString(window.API.LMSGetLastError())"
> agent-browser --cdp "$CDP" eval "window.API.LMSGetDiagnostic(window.API.LMSGetLastError())"
> ```
>
> ### Session already finished
>
> If `LMSFinish` was already called, the session is closed. You may need to reload the lesson to get a fresh SCORM session:
>
> ```bash
> agent-browser --cdp "$CDP" tab <WORKDAY_TAB>
> agent-browser --cdp "$CDP" reload
> ```
>
> ### Workday doesn't reflect completion
>
> Workday polls for SCORM updates. After calling `LMSCommit` + `LMSFinish`, wait a few seconds and then reload or navigate away and back to the course page to see updated status.
>
> ### Articulate Storyline fast-forward (fallback)
>
> If direct SCORM manipulation doesn't work (e.g., the LMS validates progress checkpoints), you can fast-forward Storyline's internal timeline on the content tab:
>
> ```bash
> agent-browser --cdp "$CDP" eval '(() => {
>   DS.animationClock.overrideClock(500);
>   for (let i = 0; i < 400; i++) DS.animationClock.tick();
>   return "Fast-forwarded timeline";
> })()'
> ```
>
> This is slower than direct SCORM API manipulation (still requires clicking "Next" per slide) but more reliable when the LMS validates progress.
>
> ## References
>
> - [SCORM 1.2 API](references/scorm-12-api.md) — Complete data model, methods, error codes, and SCORM 2004 differences
> - [Helium Browser CDP](references/helium-browser.md) — Connection quirks and DevToolsActivePort location
> - [Google Chrome CDP](references/chrome-browser.md) — DevToolsActivePort paths per OS, launch flags
> - [Other Chromium Browsers](references/other-browsers.md) — Brave, Edge, Arc, Vivaldi, ungoogled-chromium
>
> ## Quick Recipe
>
> ```bash
> # 1. Connect (read the appropriate browser reference for your browser)
> #    Generic pattern:
> PORT=$(head -1 "<browser-data-dir>/DevToolsActivePort")
> GUID=$(tail -1 "<browser-data-dir>/DevToolsActivePort")
> export CDP="ws://127.0.0.1:${PORT}${GUID}"
>
> # 2. List tabs, find Workday
> agent-browser --cdp "$CDP" tab
>
> # 3. For each Media lesson:
> #    a. Click into the lesson ("Next Lesson" button or lesson link)
> #    b. Wait for SCORM iframe to load (~3-5 seconds)
> #    c. Find the SCORM engine tab (look for ScormEngineInterface)
> #    d. Set score + status + commit + finish (Step 4d)
> #    e. Return to course page, verify checkmark
>
> # 4. For External Link lessons: click the link, return
>
> # 5. When "All Required Lessons Completed" modal appears:
> #    click "Continue to Complete"
>
> # 6. Verify "Course Completed!" trophy screen
> ```

---

## `write-discoverable-code`

**Decision:** Pending

### Availability

- **dmmulroy:** `SKILL.md` SHA-256 `c873629b49`; support: none

This name exists in only one reviewed source.

### Full Markdown

#### dmmulroy `SKILL.md`

> ---
> name: write-discoverable-code
> description: |
>   Rules for writing code that coding agents (and humans) can find and understand through
>   plain-text search. Apply whenever writing or renaming code: functions, types, constants,
>   files, error messages, doc comments.
>
>   Grounded in measurement: agents navigate by plain-text search, not by AST or
>   language server, so every identifier is a search query and every search miss
>   costs wasted reads.
> license: MIT
> ---
>
> # Write discoverable code
>
> Coding agents discover code by searching for strings and reading small windows around the
> hits. They have no hover text, no jump-to-definition, and no memory between sessions. These
> rules make code resolvable in one search instead of five.
>
> ## 1. Names are search queries
>
> - **Exported symbols get 2–4 word names, at least one of them a domain word.**
>   `diffUserObjects`, not `diff`. `queueEventForDispatch`, not `queue`.
>   Measured on a ~700k-line monorepo: 1-word exported names are globally unique 61% of
>   the time; 3-word names 96%; 4+ words 98%. Three words is the knee of the curve.
>   Use the shortest name that greps uniquely; put the rest in the doc comment.
> - **Give generic verbs their object.** `sanitizeEmailHtml`, not `sanitize`;
>   `validateSmtpConfig`, not `validateConfig`. Qualify only as far as uniqueness
>   requires, then stop.
> - **One definition site per symbol.** Never copy a function between files; move it and
>   delete the original in the same change. Shared helpers get one concept-named home
>   and are imported everywhere else.
> - **Do not rely on the module path to disambiguate a generic name.** The import that
>   disambiguates `users/diff.ts` from `orders/diff.ts` sits at the top of the file; the
>   search hit is at line 300. Put the context in the symbol (`formatDurationMs`), not the
>   folder. Exception: rigid, absolute conventions where the path carries the meaning
>   (e.g. every contract file exporting `Input`/`Output`).
> - **One concept, one spelling.** Pick `organizationId` or `orgId` and use it everywhere;
>   every synonym splits every future search in half. Reuse existing vocabulary in the
>   codebase you are editing rather than introducing near-synonyms.
> - **When behavior or audience changes, rename in the same commit.** A stale name is
>   misinformation with a 100% open rate — that includes visibility markers: a `_private`
>   helper that other modules now import needs a public name.
> - **Filenames are names too — never use bare-role filenames.** `config.ts`, `types.ts`,
>   `utils.ts`, `helpers.ts`, `handlers.ts` say nothing in a search result and collide with
>   every other module's config/types/utils in the repo. Prefix the domain:
>   `billing-plan-config.ts`, not `config.ts`. (`index.ts` is acceptable only as a
>   thin re-export entry point.)
>
> ## 2. Types are the documentation agents can't skip
>
> - **Brand your primitive IDs.** `z.string().brand<'UserId'>()` (TS) or newtypes (Rust).
>   A `transferOwnership(userId: string, orgId: string)` signature makes argument
>   transposition invisible; branded types make it a compile error that names the concepts.
> - **Use capability-token parameter types** for privileged operations (e.g. requiring an
>   `OrgScopedDb` instead of a raw connection). A comment is a request; a required type is
>   physics.
> - **Model state with discriminated unions**, not clusters of nullable fields with implicit
>   rules.
> - **Name types like they'll be quoted back** — they will be, in compiler errors the agent
>   uses to self-correct. `OrgScopedDb` explains itself; `Ctx2` does not. Avoid `any`: every
>   `any` is a spot where the compiler goes silent and the agent is back to guessing.
>
> ## 3. Say it where the search lands
>
> - **One-line doc comment on every export**, stating the sharpest constraint the code
>   itself can't show (units, timezone, "source time, not insert time", ownership).
>   The definition is where a name search lands; that line is your whole message.
> - **Write the plain-words phrase in the doc comment.** Searches arrive as natural language
>   ("rate limit", "retry delay"), and camelCase identifiers don't match phrase greps —
>   `RateLimiter` is invisible to a search for "rate limit". The doc comment above each
>   export should contain, in ordinary spaced-out words, the phrase someone would search
>   for: a `SessionExpiryChecker` should say /\*_ Checks whether the user session has
>   expired. _/ so that a grep for "session expired" or "session has expired" lands here.
> - **A module should make sense with its imports unread.** Each imported name plus its
>   doc line should say enough that the reader never has to open the source module. If
>   they do, the import's name is failing, not the reader.
> - **Keep strings whole.** Never build event names, flags, or error codes with template
>   interpolation (`` `github.${entity}.${action}` `` makes `github.pr.merged` unsearchable).
>   Write the full literal even when a loop feels DRYer.
> - **Error messages start with a unique literal prefix**, so a message seen in a log greps
>   straight back to the throw site. ``throw new Error(`Webhook signature mismatch for ${id}`)``,
>   never ``throw new Error(`${prefix}: mismatch`)``.
> - **One searchable concept per file, and keep orchestrators thin.** The code that answers
>   "where is X done?" should live in a module named after X — the thing a reader would
>   ask about, not the mechanism inside — not inline in a coordinator,
>   pipeline, or service class. An orchestrator should read as a sequence of calls into
>   well-named modules; if a reader lands in it from a search, every line should point them
>   one hop from the real implementation. Burying the implementation of several concepts in
>   one large file makes every search for any of them land on the same wall of code.
>   Split until each question-sized concept has one named home, then stop: a helper
>   meaningful only inside one concept belongs inline, and a file per tiny function
>   fragments one answer across several reads. The test runs both ways: a module that
>   answers many unrelated questions is holding more than one concept.
> - **Colocate tests** (`foo.test.ts` next to `foo.ts`) so one search finds behavior and its
>   specification together.
> - **Mark dead ends.** `@deprecated` on the old path, with a pointer to the new one.
>
> ## Quick checklist before committing
>
> 1. Would one search for each new exported name be enough to find its implementation?
> 2. Would swapping two arguments of the new function fail the build?
> 3. Is the one thing a caller must know but the signature can't say (units, timezone,
>    ownership, ordering) written right at the definition?
> 4. Do all log/error strings exist verbatim in the source?
> 5. Did anything change behavior without changing its name?
> 6. When code moved, is it gone from where it came from?

---

## `writing-great-skills`

**Decision:** Pending

### Availability

- **Matt:** `SKILL.md` SHA-256 `4d6ccbc376`; support: `GLOSSARY.md`, `agents/openai.yaml`
- **dmmulroy:** `SKILL.md` SHA-256 `4d6ccbc376`; support: `GLOSSARY.md`, `agents/openai.yaml`

### Exact comparison

#### Matt vs dmmulroy

- `SKILL.md`: exact byte-for-byte match.
- Only in Matt: none.
- Only in dmmulroy: none.
- Matching support files: `GLOSSARY.md`, `agents/openai.yaml`.
- Changed support files: none.

### Full Markdown

#### Matt `SKILL.md`

> ---
> name: writing-great-skills
> description: Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.
> disable-model-invocation: true
> ---
>
> A skill exists to wrangle determinism out of a stochastic system. **Predictability** — the agent taking the same _process_ every run, not producing the same output — is the root virtue; every lever below serves it.
>
> **Bold terms** are defined in [`GLOSSARY.md`](GLOSSARY.md); look them up there for the full meaning.
>
> ## Invocation
>
> Two choices, trading different costs:
>
> - A **model-invoked** skill keeps a **description**, so the agent can fire it autonomously _and_ other skills can reach it (you can still type its name too). It contributes to **context load** — the description sits in the window every turn. Mechanics: omit `disable-model-invocation`, and write a model-facing description with rich trigger phrasing ("Use when the user wants…, mentions…").
> - A **user-invoked** skill strips the description from the agent's reach: only you, typing its name, can invoke it — and no other skill can. Zero context load, but it spends **cognitive load**: _you_ are the index that must remember it exists. Mechanics: set `disable-model-invocation: true`; the `description` becomes human-facing — a one-line summary, trigger lists stripped.
>
> Pick model-invocation only when the agent must reach the skill on its own, or another skill must. If it only ever fires by hand, make it user-invoked and pay no context load.
>
> When user-invoked skills multiply past what you can remember, that piled-up cognitive load is cured by a **router skill**: one user-invoked skill that names the others and when to reach for each.
>
> ## Writing the description
>
> A model-invoked **description** does two jobs — state what the skill is, and list the **branches** that should trigger it. Every word increases **context load**, so a description earns even harder pruning than the body:
>
> - **Front-load the skill's leading word** — the description is where it does its invocation work.
> - **One trigger per branch.** Synonyms that rename a single branch are **duplication** — "build features using TDD … asks for test-first development" is one branch written twice. Collapse them; keep only genuinely distinct branches.
> - **Cut identity that's already in the body.** Keep the description to triggers, plus any "when another skill needs…" reach clause.
>
> ## Information hierarchy
>
> A skill is built from two content types — **steps** and **reference** — that mix freely: a skill can be all steps, all reference, or both. The core decision is which to use and where each sits on the **information hierarchy**, a ladder ranked by how immediately the agent needs the material:
>
> 1. **In-skill step** — an ordered action in `SKILL.md`, the primary tier: what the agent does, in order. Each step ends on a **completion criterion**, the condition that tells the agent the work is done. Make it _checkable_ (can the agent tell done from not-done?) and, where it matters, _exhaustive_ ("every modified model accounted for", not "produce a change list") — a vague criterion invites **premature completion**.
> 2. **In-skill reference** — a definition, rule, or fact in `SKILL.md`, consulted on demand. Often a legitimately flat peer-set (every rule of a review on one rung) — a fine arrangement, not a smell. _This skill is all reference._
> 3. **External reference** — reference pushed out of `SKILL.md` into a separate file, reached by a **context pointer**, loaded only when the pointer fires. (Spans _disclosed_ reference — a sibling file like `GLOSSARY.md`, still part of the skill — through fully **external reference** that lives outside the skill system and any skill can point at.)
>
> A demanding completion criterion drives thorough **legwork** — the digging the agent does within the work — whether the skill has steps or not, since "every rule applied" binds flat reference just as "every step done" binds a sequence.
>
> Push too little down and the top bloats; push too much and you hide material the agent actually needs. That tension is the whole decision.
>
> **Progressive disclosure** is the move down the ladder — out of `SKILL.md` into a linked file — so the top stays legible. Mechanics: a linked `.md` file in the skill folder, named for what it holds (this skill discloses its full definitions to `GLOSSARY.md`). Some skills are used in more than one way, and each distinct way is a **branch** — different runs taking different paths through the skill. Branching is the cleanest disclosure test: inline what every branch needs, and push behind a pointer what only some branches reach. A **context pointer**'s _wording_, not its target, decides when and how reliably the agent reaches the material.
>
> Where the ladder decides _how far down_ a piece sits, **co-location** decides _what sits beside it_ once there: keep a concept's definition, rules, and caveats under one heading rather than scattered, so reading one part brings its neighbours with it.
>
> ## When to split
>
> **Granularity** is how finely you divide skills, and each cut spends one of the two loads, so split only when the cut earns it. Two cuts:
>
> - **By invocation** — split off a **model-invoked** skill when you have a distinct **leading word** that should trigger it on its own, or another skill must reach it. You pay **context load** for the new always-loaded **description**, so that independent reach has to be worth it.
> - **By sequence** — split a run of **steps** when the steps still ahead (a step's **post-completion steps**) tempt the agent to rush the one in front of it (**premature completion**). Keeping them out of view encourages the agent to do more **legwork** on the current task.
>
> ## Pruning
>
> Keep each meaning in a **single source of truth**: one authoritative place, so changing the behaviour is a one-place edit.
>
> Check every line for **relevance**: does it still bear on what the skill does?
>
> Then hunt **no-ops** sentence by sentence, not just line by line: run the no-op test on each sentence in isolation, and when one fails, delete the whole sentence rather than trim words from it. Be aggressive — most prose that fails should go, not be rewritten.
>
> ## Leading words
>
> A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the skill (e.g. _lesson_, _fog of war_, _tracer bullets_). Repeated throughout the text (though not necessarily - a strong leading word might only be needed once), it accumulates a distributed definition and anchors a whole region of behaviour in the fewest tokens, by recruiting priors the model already holds.
>
> It serves predictability twice. In the body it anchors _execution_: the agent reaches for the same behaviour every time the word appears. In the description it anchors _invocation_: when the same word lives in your prompts, docs, and code, the agent links that shared language to the skill and fires it more reliably.
>
> Hunt for opportunities to refactor skills to use leading words. A triad spelled out at three sites (**duplication**), a description spending a sentence to gesture at one idea — each is a passage begging to **collapse** into a single token. Examples include:
>
> - "fast, deterministic, low-overhead" -> _tight_ — one quality restated across a phase — into a single pretrained word (a _tight_ loop).
> - "a loop you believe in" -> _red_ — converts a fuzzy gate into a binary observable state (the loop goes _red_ on the bug, or it doesn't).
>
> You win twice over: fewer tokens, _and_ a sharper hook for the agent to hang its thinking on. Assume every skill is carrying restatements that leading words retire — go find them.
>
> ## Failure modes
>
> Use these to diagnose issues the user may be having with the skill.
>
> - **Premature completion** — ending a step before it's genuinely done, attention slipping to _being done_. Defence, in order: sharpen the completion criterion first (cheap, local); only if it is irreducibly fuzzy _and_ you observe the rush, hide the post-completion steps by splitting (the sequence cut).
> - **Duplication** — the same meaning in more than one place. Costs maintenance and tokens, and inflates a meaning's prominence on the ladder past its real rank.
> - **Sediment** — stale layers that settle because adding feels safe and removing feels risky. The default fate of any skill without a pruning discipline.
> - **Sprawl** — a skill simply too long, even when every line is live and unique. Hurts readability and maintainability and wastes tokens. The cure is the ladder: disclose **reference** behind pointers, and split by **branch** or sequence so each path carries only what it needs.
> - **No-op** — a line the model already obeys by default, so you pay load to say nothing. The test: does it change behaviour versus the default? A weak leading word (_be thorough_ when the agent is already thorough-ish) is a no-op; the fix is a stronger word (_relentless_), not a different technique.
> - **Negation** — steering by prohibition backfires: _don't think of an elephant_ names the elephant and makes it more available, not less. Prompt the **positive** — state the target behaviour so the banned one is never spoken; keep a prohibition only as a hard guardrail you can't phrase positively, and even then pair it with what to do instead.

#### dmmulroy `SKILL.md`

> ---
> name: writing-great-skills
> description: Reference for writing and editing skills well — the vocabulary and principles that make a skill predictable.
> disable-model-invocation: true
> ---
>
> A skill exists to wrangle determinism out of a stochastic system. **Predictability** — the agent taking the same _process_ every run, not producing the same output — is the root virtue; every lever below serves it.
>
> **Bold terms** are defined in [`GLOSSARY.md`](GLOSSARY.md); look them up there for the full meaning.
>
> ## Invocation
>
> Two choices, trading different costs:
>
> - A **model-invoked** skill keeps a **description**, so the agent can fire it autonomously _and_ other skills can reach it (you can still type its name too). It contributes to **context load** — the description sits in the window every turn. Mechanics: omit `disable-model-invocation`, and write a model-facing description with rich trigger phrasing ("Use when the user wants…, mentions…").
> - A **user-invoked** skill strips the description from the agent's reach: only you, typing its name, can invoke it — and no other skill can. Zero context load, but it spends **cognitive load**: _you_ are the index that must remember it exists. Mechanics: set `disable-model-invocation: true`; the `description` becomes human-facing — a one-line summary, trigger lists stripped.
>
> Pick model-invocation only when the agent must reach the skill on its own, or another skill must. If it only ever fires by hand, make it user-invoked and pay no context load.
>
> When user-invoked skills multiply past what you can remember, that piled-up cognitive load is cured by a **router skill**: one user-invoked skill that names the others and when to reach for each.
>
> ## Writing the description
>
> A model-invoked **description** does two jobs — state what the skill is, and list the **branches** that should trigger it. Every word increases **context load**, so a description earns even harder pruning than the body:
>
> - **Front-load the skill's leading word** — the description is where it does its invocation work.
> - **One trigger per branch.** Synonyms that rename a single branch are **duplication** — "build features using TDD … asks for test-first development" is one branch written twice. Collapse them; keep only genuinely distinct branches.
> - **Cut identity that's already in the body.** Keep the description to triggers, plus any "when another skill needs…" reach clause.
>
> ## Information hierarchy
>
> A skill is built from two content types — **steps** and **reference** — that mix freely: a skill can be all steps, all reference, or both. The core decision is which to use and where each sits on the **information hierarchy**, a ladder ranked by how immediately the agent needs the material:
>
> 1. **In-skill step** — an ordered action in `SKILL.md`, the primary tier: what the agent does, in order. Each step ends on a **completion criterion**, the condition that tells the agent the work is done. Make it _checkable_ (can the agent tell done from not-done?) and, where it matters, _exhaustive_ ("every modified model accounted for", not "produce a change list") — a vague criterion invites **premature completion**.
> 2. **In-skill reference** — a definition, rule, or fact in `SKILL.md`, consulted on demand. Often a legitimately flat peer-set (every rule of a review on one rung) — a fine arrangement, not a smell. _This skill is all reference._
> 3. **External reference** — reference pushed out of `SKILL.md` into a separate file, reached by a **context pointer**, loaded only when the pointer fires. (Spans _disclosed_ reference — a sibling file like `GLOSSARY.md`, still part of the skill — through fully **external reference** that lives outside the skill system and any skill can point at.)
>
> A demanding completion criterion drives thorough **legwork** — the digging the agent does within the work — whether the skill has steps or not, since "every rule applied" binds flat reference just as "every step done" binds a sequence.
>
> Push too little down and the top bloats; push too much and you hide material the agent actually needs. That tension is the whole decision.
>
> **Progressive disclosure** is the move down the ladder — out of `SKILL.md` into a linked file — so the top stays legible. Mechanics: a linked `.md` file in the skill folder, named for what it holds (this skill discloses its full definitions to `GLOSSARY.md`). Some skills are used in more than one way, and each distinct way is a **branch** — different runs taking different paths through the skill. Branching is the cleanest disclosure test: inline what every branch needs, and push behind a pointer what only some branches reach. A **context pointer**'s _wording_, not its target, decides when and how reliably the agent reaches the material.
>
> Where the ladder decides _how far down_ a piece sits, **co-location** decides _what sits beside it_ once there: keep a concept's definition, rules, and caveats under one heading rather than scattered, so reading one part brings its neighbours with it.
>
> ## When to split
>
> **Granularity** is how finely you divide skills, and each cut spends one of the two loads, so split only when the cut earns it. Two cuts:
>
> - **By invocation** — split off a **model-invoked** skill when you have a distinct **leading word** that should trigger it on its own, or another skill must reach it. You pay **context load** for the new always-loaded **description**, so that independent reach has to be worth it.
> - **By sequence** — split a run of **steps** when the steps still ahead (a step's **post-completion steps**) tempt the agent to rush the one in front of it (**premature completion**). Keeping them out of view encourages the agent to do more **legwork** on the current task.
>
> ## Pruning
>
> Keep each meaning in a **single source of truth**: one authoritative place, so changing the behaviour is a one-place edit.
>
> Check every line for **relevance**: does it still bear on what the skill does?
>
> Then hunt **no-ops** sentence by sentence, not just line by line: run the no-op test on each sentence in isolation, and when one fails, delete the whole sentence rather than trim words from it. Be aggressive — most prose that fails should go, not be rewritten.
>
> ## Leading words
>
> A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the skill (e.g. _lesson_, _fog of war_, _tracer bullets_). Repeated throughout the text (though not necessarily - a strong leading word might only be needed once), it accumulates a distributed definition and anchors a whole region of behaviour in the fewest tokens, by recruiting priors the model already holds.
>
> It serves predictability twice. In the body it anchors _execution_: the agent reaches for the same behaviour every time the word appears. In the description it anchors _invocation_: when the same word lives in your prompts, docs, and code, the agent links that shared language to the skill and fires it more reliably.
>
> Hunt for opportunities to refactor skills to use leading words. A triad spelled out at three sites (**duplication**), a description spending a sentence to gesture at one idea — each is a passage begging to **collapse** into a single token. Examples include:
>
> - "fast, deterministic, low-overhead" -> _tight_ — one quality restated across a phase — into a single pretrained word (a _tight_ loop).
> - "a loop you believe in" -> _red_ — converts a fuzzy gate into a binary observable state (the loop goes _red_ on the bug, or it doesn't).
>
> You win twice over: fewer tokens, _and_ a sharper hook for the agent to hang its thinking on. Assume every skill is carrying restatements that leading words retire — go find them.
>
> ## Failure modes
>
> Use these to diagnose issues the user may be having with the skill.
>
> - **Premature completion** — ending a step before it's genuinely done, attention slipping to _being done_. Defence, in order: sharpen the completion criterion first (cheap, local); only if it is irreducibly fuzzy _and_ you observe the rush, hide the post-completion steps by splitting (the sequence cut).
> - **Duplication** — the same meaning in more than one place. Costs maintenance and tokens, and inflates a meaning's prominence on the ladder past its real rank.
> - **Sediment** — stale layers that settle because adding feels safe and removing feels risky. The default fate of any skill without a pruning discipline.
> - **Sprawl** — a skill simply too long, even when every line is live and unique. Hurts readability and maintainability and wastes tokens. The cure is the ladder: disclose **reference** behind pointers, and split by **branch** or sequence so each path carries only what it needs.
> - **No-op** — a line the model already obeys by default, so you pay load to say nothing. The test: does it change behaviour versus the default? A weak leading word (_be thorough_ when the agent is already thorough-ish) is a no-op; the fix is a stronger word (_relentless_), not a different technique.
> - **Negation** — steering by prohibition backfires: _don't think of an elephant_ names the elephant and makes it more available, not less. Prompt the **positive** — state the target behaviour so the banned one is never spoken; keep a prohibition only as a hard guardrail you can't phrase positively, and even then pair it with what to do instead.

---

## Exit Criteria

- [ ] Every grouped skill section reviewed.
- [ ] Every overlap resolved after comparing exact diffs and full Markdown.
- [ ] `grill-me-with-docs` versus `grill-with-docs` resolved.
- [ ] Architecture-scan rewrite direction finalized.
- [ ] TypeScript coding standards revamp scope finalized.
- [ ] Update-script behavior approved.
- [ ] User explicitly authorizes implementation later.
