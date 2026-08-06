# How Matt Pocock's Skills Setup Works

## Purpose

Explain Matt Pocock's skill system before deciding which skills to adopt, merge, rewrite, or skip. This is a review document; it does not authorize installation or implementation.

## Sources

- <https://www.aihero.dev/skills>
- <https://github.com/mattpocock/skills>
- Individual AI Hero skill pages
- `docs/plans/agent-skills-review-v4.md`
- dmmulroy's `home/.agents/skills/`

## The Three Layers

Matt's system consists of:

1. global skill definitions,
2. composable workflows,
3. optional repository-specific configuration for tracker-oriented workflows.

## 1. Global Skill Definitions

Each skill is a directory containing `SKILL.md` and optional references, scripts, templates, and agent metadata:

```text
<skill>/
├── SKILL.md
├── references/
├── scripts/
└── agents/openai.yaml
```

The harness initially sees only the skill's name and description. It loads the full instructions when the user explicitly invokes a skill or the model decides a model-invoked skill matches the task.

For Pi, definitions can be globally available under `~/.agents/skills/`. Pi natively discovers that directory, which fits the proposed Stow layout:

```text
tracked source:
  stow/agents/.agents/skills/<skill>/

runtime:
  ~/.agents/skills/<skill> -> <dotfiles>/stow/agents/.agents/skills/<skill>
```

Global installation makes the workflows available while Pi is working in any repository.

## 2. Composable Workflows

The stable catalog is not a collection of unrelated prompts. Larger user-invoked skills rely on smaller reference or model-invoked skills.

### Main engineering flow

```text
grill-with-docs
  → to-spec
  → to-tickets
  → implement
  → code-review
```

### Main-flow responsibilities

- **`grill-with-docs`** clarifies an idea through an interview and can record settled terminology and consequential decisions.
- **`to-spec`** synthesizes what is already settled. It deliberately does not conduct another interview.
- **`to-tickets`** breaks a specification into tracer-bullet tickets with explicit blocking relationships.
- **`implement`** executes an existing specification or ticket set using TDD, typechecking, focused tests, and final verification.
- **`code-review`** reviews the result against repository standards and the originating specification.

### Shared supporting skills

- **`domain-modeling`** owns ubiquitous-language and ADR discipline. Canonical terms go into `CONTEXT.md`; consequential decisions go into ADRs.
- **`codebase-design`** supplies architectural vocabulary: modules, interfaces, depth, seams, adapters, locality, and leverage.
- **`grilling`** provides reusable interviewing behavior. `grill-me` and `grill-with-docs` are user-facing applications of it.
- **`tdd`** provides the test-first implementation loop used directly or by `implement`.
- **`diagnosing-bugs`** follows `reproduce → minimize → hypothesize → instrument → fix → regression test`.
- **`prototype`** builds disposable code to answer one uncertain design question.
- **`research`** collects evidence from high-trust sources and records cited findings.
- **`handoff`** compacts the live conversation without copying settled material already stored elsewhere.
- **`ask-matt`** routes the user to an appropriate skill or flow; it does not perform the work itself.

This composition explains why some files look incomplete in isolation: they expect neighboring skills to provide shared concepts or behavior.

## 3. Repository-Specific Configuration

`setup-matt-pocock-skills` is separate from global installation.

Global installation makes definitions available everywhere. Some workflows still need repository-specific answers:

- Where do issues live?
- Which triage labels does this repository use?
- Where should domain documentation and ADRs live?
- Does a monorepo have multiple domain contexts?

The setup skill can record those answers in:

```text
docs/agents/issue-tracker.md
docs/agents/domain.md
docs/agents/triage-labels.md
```

It may also add an `## Agent skills` reference to `AGENTS.md` or `CLAUDE.md`.

This does not install another copy of the skills. It creates configuration consumed by tracker-oriented global workflows such as `triage`, `to-spec`, `to-tickets`, and `wayfinder`.

Therefore:

- **Global installation** makes workflows available in every repository.
- **Per-repository setup** tells certain workflows how to interact with that repository's tracker and documentation layout.

Standalone skills can be used without setup. Tracker-dependent skills may otherwise need to ask where output belongs. No setup skill should run automatically during Stow installation.

## User-Invoked and Model-Invoked Skills

### User-invoked

These normally use `disable-model-invocation: true` and run only when explicitly requested:

```text
ask-matt
grill-with-docs
triage
improve-codebase-architecture
setup-matt-pocock-skills
to-spec
to-tickets
implement
wayfinder
grill-me
handoff
teach
```

They are complete workflows whose timing remains under user control. In Pi they should be available through commands such as `/skill:to-spec`.

### Model-invoked

These encode reusable disciplines the model may load when their descriptions match the task:

```text
code-review
codebase-design
diagnosing-bugs
domain-modeling
prototype
research
tdd
grilling
```

Their frontmatter descriptions determine when Pi considers loading them. They can generally still be invoked explicitly.

## Progressive Disclosure

The system avoids putting every rule into every prompt:

1. Pi initially receives skill names and descriptions.
2. It loads the relevant `SKILL.md` only when needed.
3. That skill may direct it to a focused reference file.
4. Larger workflows may rely on other skills.
5. Repository configuration is read only by workflows that need it.

This keeps default context smaller while preserving detailed guidance on demand.

## How dmmulroy Uses the System

The comparison shows that dmmulroy uses Matt's skills as a base rather than maintaining an unrelated system. Many Matt-named `SKILL.md` files are exact copies.

Dmmulroy adds personal and environment-specific layers such as:

- `bootstrap-prelude`,
- `cloudflare-composition-root`,
- `coding-standards`,
- `prelude`,
- `recipe-diagrams`,
- `workday-training`,
- `write-discoverable-code`.

The most relevant structural addition is `coding-standards`. Instead of one large `SKILL.md`, it uses a concise entry point plus focused references:

```text
coding-standards/
├── SKILL.md
└── references/
    ├── typescript-safety.md
    ├── parsing-and-schemas.md
    ├── errors.md
    ├── testing.md
    ├── persistence.md
    ├── modules-services-and-adapters.md
    ├── workflows-transactions-and-idempotency.md
    ├── effect.md
    └── ...
```

The entry skill decides which references matter for the task. This is progressive disclosure inside the skill itself.

Dmmulroy's model is approximately:

```text
Matt's reusable workflow layer
  + personal engineering standards
  + stack-specific references
  + environment/bootstrap skills
```

## Likely Model for This Repository

A comparable structure would be:

```text
approved Matt workflows
  + existing personal skills
  + expanded personal coding standards
  + minimal Pi-specific interpretation
```

The decision is not “Matt versus local versus dmmulroy” as complete alternatives. The review should determine:

1. which workflows Matt already solves well,
2. where current local behavior is preferable,
3. which dmmulroy structures help organize personal standards,
4. which definitions require Pi-specific wording,
5. which skills are tied too closely to someone else's environment.

## Practical Installation Consequences

The Stow work can remain simple:

1. Track approved complete directories under `stow/agents/.agents/skills/`.
2. Expose them globally at `~/.agents/skills/`.
3. Start a fresh Pi session after applying Stow.
4. Confirm every approved skill appears exactly once.
5. Run user-invoked skills explicitly.
6. Let model-invoked skills load from their descriptions.
7. Never run project setup automatically.

The difficult part is selecting and adapting content, not installing it.

## Relationship to the Review Plan

The complete source comparison remains in `docs/plans/agent-skills-review-v4.md`. It groups every skill's local, Matt, and dmmulroy definitions, exact differences, support files, and decision.

Use this explanation to understand the system, then use the comparison document to make adoption decisions.

## Questions for Review

1. Does the distinction between global definitions and optional per-repository tracker configuration make sense?
2. Do we want the full main workflow, or primarily standalone skills and selected stages?
3. Should the local setup follow dmmulroy's pattern of preserving Matt's workflows and layering personal standards around them?
4. Which Pi-specific tool assumptions should be adapted locally, if any?
