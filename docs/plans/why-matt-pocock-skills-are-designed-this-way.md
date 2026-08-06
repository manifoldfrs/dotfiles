# Why Matt Pocock's Skills Are Designed This Way

## Summary

Matt's skills are short, reusable instruction packages for LLM coding agents. They are designed to make an agent follow a repeatable engineering process without loading a giant rulebook into every conversation.

The basic idea is:

```text
LLM = flexible reasoning and execution
Skill = process, constraints, vocabulary, and definition of done
Human = important decisions and approval
Tests/tools = objective feedback
```

## Why They Exist

Matt is trying to address common LLM failure modes:

- acting before the user and agent agree on the goal,
- guessing missing requirements,
- using a different process on every run,
- losing project knowledge between sessions,
- declaring success without enough evidence,
- becoming distracted by too many permanent instructions,
- struggling to navigate wide, tightly coupled codebases.

A skill records the moves Matt wants the agent to repeat for a class of tasks. The goal is consistent **process**, not identical output.

## How a Skill Is Packaged

A typical skill looks like this:

```text
skills/
└── engineering/
    └── tdd/
        ├── SKILL.md          # main procedure
        ├── tests.md          # detailed test guidance
        ├── mocking.md        # loaded only when relevant
        └── agents/
            └── openai.yaml   # optional Codex metadata
```

`SKILL.md` starts with an index entry:

```yaml
---
name: tdd
description: Test-driven development. Use when ...
---
```

The rest of the file describes the process to follow.

## How Pi Loads a Skill

Pi does not load every skill's full instructions at startup. It initially gives the model only a small list of names and descriptions.

```text
Pi starts
   │
   ▼
scan ~/.agents/skills/**/SKILL.md
   │
   ▼
show model skill names + descriptions
   │
   ├── no match ─────────────► continue normally
   │
   ├── user invokes skill ───► read its SKILL.md
   │
   └── model finds a match ──► read its SKILL.md
                                      │
                                      ▼
                         read a reference only if needed
```

This is **progressive disclosure**: start with a small index, load the procedure when needed, then load specialized references only for the relevant branch.

### Why this helps an LLM

- Irrelevant instructions do not compete as strongly for attention.
- More context remains available for code, tests, and conversation.
- Detailed guidance appears close to the action it governs.
- Large standards libraries can exist without being loaded on every task.

The downside is retrieval failure: the model can miss the correct skill or fail to open a referenced file.

## How the Skills Are Split

Matt uses two kinds of skills.

### User-invoked workflows

These set:

```yaml
disable-model-invocation: true
```

The user must start them explicitly. Examples:

```text
grill-with-docs
to-spec
to-tickets
implement
triage
wayfinder
handoff
```

These can publish issues, start large workflows, or move work into a new phase, so the human controls when they begin.

### Model-invoked disciplines

These omit that flag, allowing the model to load them when the task matches. Examples:

```text
grilling
domain-modeling
codebase-design
tdd
diagnosing-bugs
prototype
research
```

They provide reusable techniques that larger workflows can use.

```text
human starts an orchestrator
          │
          ▼
     /to-spec
          │
          ├── uses domain-modeling vocabulary
          └── uses codebase-design vocabulary
```

This preserves human control over major workflow transitions while letting the model retrieve supporting expertise.

## How the Skills Work Together

Matt's main engineering flow is:

```text
grill-with-docs
  → to-spec
  → to-tickets
  → implement
  → code-review
```

- **`grill-with-docs`** clarifies the idea and records important terminology or decisions.
- **`to-spec`** writes down what has already been agreed.
- **`to-tickets`** divides the specification into ordered work.
- **`implement`** builds the work using tests and verification.
- **`code-review`** compares the result with the specification and repository standards.

Smaller skills sit underneath this flow:

- **`grilling`** owns the interview technique.
- **`domain-modeling`** owns project terminology.
- **`codebase-design`** owns module-design vocabulary.
- **`tdd`** owns test-first implementation.
- **`diagnosing-bugs`** owns systematic debugging.

Keeping these separate avoids repeating the same rules in every larger workflow.

## Important Terms

### TDD

**Test-driven development** means building one behavior at a time through a red-green-refactor loop:

```text
RED      write one test that fails
GREEN    write the minimum code that makes it pass
REFACTOR improve the code while all tests remain passing
REPEAT
```

The feedback from running the test is more reliable than asking the LLM whether its own code is correct.

### ADR

An **architectural decision record** is a short document explaining an important technical choice:

- the situation,
- the options considered,
- the chosen option,
- why it won.

Matt reserves ADRs for decisions that are hard to reverse, surprising without context, and based on a real tradeoff.

### Leading words

Matt uses compact terms such as `red-green`, `tracer bullet`, `seam`, and `deep module`. These terms already carry rich meaning in model training, so a few tokens can activate a larger behavior pattern.

## Why This Design Can Help LLMs

The design targets specific LLM weaknesses:

| LLM weakness | Skill design response |
| --- | --- |
| Limited context | Progressive disclosure |
| No durable memory | Specs, ADRs, `CONTEXT.md`, tickets, handoffs |
| Guesses missing decisions | Explicit human decision gates |
| Inconsistent process | Repeatable procedures |
| Weak self-evaluation | Tests, typechecking, reproduction, instrumentation |
| Terminology drift | Shared vocabulary skills |
| Premature completion | Explicit completion criteria |
| Difficult code navigation | Deep modules with small interfaces |

The key pattern is to move correctness away from the model's confidence and toward observable evidence.

## Is There Evidence That Skills Work?

### Matt's evidence

I found no controlled benchmark of Matt's exact catalog against the same engineering tasks without his skills. His evidence is mostly personal use, examples, user reports, and manual iteration.

His “63% token reduction” refers to reducing the size of the skill text, not proving a 63% improvement in engineering outcomes.

So Matt's specific performance claims should be tested rather than assumed.

### Independent evidence

Research on Agent Skills is mixed:

- **SkillsBench:** curated skills improved average pass rate by 16.2 percentage points, but software engineering improved only 4.5 points and some tasks became worse.
- **Context-Bench Skills:** relevant skills improved capable models by about 14.1%, but performance dropped when the model had to select the skill itself.
- **SWE-Skills-Bench:** across 49 software-engineering skills, average improvement was only 1.2%; most skills changed nothing and several hurt performance.

The defensible conclusion is:

> Focused, human-written, task-relevant skills can help capable models. Mismatched, stale, oversized, or poorly selected skills may do nothing or make results worse.

## How We Could Evaluate Them in Pi

For a candidate skill, run the same repository task under three conditions:

```text
A. skill unavailable
B. skill explicitly invoked
C. full catalog available; Pi must select it
```

Repeat each condition and measure:

- acceptance tests passed,
- regressions introduced,
- required process followed,
- correct skill and references loaded,
- unauthorized assumptions or edits,
- tokens, tool calls, and elapsed time.

This answers three separate questions:

1. Does the skill improve the result?
2. Can Pi follow it when explicitly invoked?
3. Can Pi discover it from the catalog?

## Matt's Skills vs. dmmulroy's Skills

Dmmulroy is not using a competing skill system. His directory is mostly Matt's workflow with personal layers added around it.

```text
Matt's catalog
├── general engineering workflows
│   ├── grill-with-docs
│   ├── to-spec
│   ├── to-tickets
│   ├── implement
│   └── code-review
├── reusable techniques
│   ├── tdd
│   ├── diagnosing-bugs
│   ├── domain-modeling
│   └── codebase-design
└── general productivity
    ├── handoff
    └── teach

dmmulroy's directory
├── many exact copies of Matt's skills
└── personal additions
    ├── coding-standards          # TypeScript + Effect rules
    ├── cloudflare-composition-root
    ├── bootstrap-prelude
    ├── prelude
    ├── recipe-diagrams
    ├── workday-training
    └── write-discoverable-code
```

The main difference is ownership:

| Matt | dmmulroy |
| --- | --- |
| General workflows intended for many engineers | Matt's workflows plus one developer's stack and habits |
| Avoids prescribing one TypeScript stack | Adds detailed TypeScript, Effect, Cloudflare, and resource rules |
| Provides the process graph | Provides local implementation standards used inside that process |
| Updates from Matt's public catalog | Carries personal additions and may pin or adapt upstream copies |

Dmmulroy's `coding-standards` is the clearest example. Its short `SKILL.md` routes the agent to detailed references for parsing, errors, persistence, testing, Effect, resources, and observability. That content is valuable for dmmulroy because it matches his stack. We should copy the **structure**, but only adopt rules that match our own projects.

## Example: Using the Flow in Opto

Opto already has useful repository instructions:

- root and subdirectory `AGENTS.md` files,
- test, lint, and typecheck commands,
- Next.js, FastAPI, Supabase, Plaid, and Stripe conventions,
- security and migration rules,
- architecture and schema documentation.

Those files tell an agent **how this repository works**. They do not define a repeatable process for turning an unclear request into reviewed code.

Consider an illustrative request:

> Add a new transaction-splitting behavior that affects a Next.js API route, Supabase data, and the user-visible history.

### Using the current setup alone

```text
request
  → Pi reads AGENTS.md
  → Pi explores the route, database, and tests
  → Pi chooses its own planning process
  → Pi may ask questions, write code, or propose a plan
  → Pi runs the commands listed in AGENTS.md
```

The repository instructions provide strong implementation constraints, but the session still depends on the model deciding:

- whether requirements are settled,
- which user-visible behaviors matter,
- where the test seam belongs,
- whether a schema decision needs documenting,
- how to divide the work,
- when human approval is required.

### Who invokes each step?

You would start the major workflow steps yourself. Pi should not automatically decide to grill you, publish a spec, create tickets, or begin a large implementation.

```text
YOU                         PI / supporting skills
 │
 ├─ /skill:grill-with-docs ─► runs the interview
 │                              may load grilling
 │                              may load domain-modeling
 │
 ├─ review and approve understanding
 │
 ├─ /skill:to-spec ─────────► writes the spec
 │                              may load codebase-design
 │
 ├─ review and approve spec
 │
 ├─ /skill:to-tickets ──────► creates tickets, if worth the overhead
 │
 ├─ review and approve tickets
 │
 └─ /skill:implement ───────► implements the approved work
                                should apply tdd
                                should finish with code-review
```

The left side is deliberately human-controlled because these are user-invoked orchestrators. The right side contains model-invoked supporting skills that Pi is allowed to load automatically.

In practice, cross-skill loading is not perfectly reliable. A skill mentioning `tdd` does not guarantee Pi will open `tdd/SKILL.md`. For important work, we should verify the tool trace or explicitly say:

```text
/skill:implement Use the tdd and code-review skills explicitly.
```

You can also invoke a supporting skill directly when you want only that technique:

```text
/skill:tdd Add this small behavior test-first.
/skill:diagnosing-bugs Diagnose this failing transaction-splitting test.
/skill:code-review Review the current diff against AGENTS.md and the spec.
```

So the answer is:

- **You invoke the major phases.**
- **Pi may automatically load supporting techniques.**
- **For now, explicitly naming important supporting skills is safer than assuming composition worked.**

### Opto flow in detail

```text
1. YOU: /skill:grill-with-docs
   PI: inspect Opto's transaction-splitting behavior, ask unresolved
       product questions, and agree on terminology and scope.

2. YOU: approve the understanding, then /skill:to-spec
   PI: turn it into explicit behaviors, a test seam, and out-of-scope items.

3. YOU: approve the spec. If the change is large, /skill:to-tickets
   PI: split it into end-to-end slices and record blocking order.

4. YOU: approve the work breakdown, then /skill:implement
   PI: implement at the agreed seam, preferably loading tdd:
       RED → one failing test
       GREEN → minimum passing code
       REPEAT → database, API, and UI behavior
       then run Opto's type, lint, and test commands.

5. PI should load code-review at the end of implement.
   If it does not, YOU invoke /skill:code-review explicitly.
   PI compares the diff with the spec and Opto's AGENTS.md rules.
```

Matt's AI Hero pages often display commands as `/to-spec` because Claude Code exposes them that way. In Pi, the documented command format is `/skill:to-spec`.

### What is actually better?

The skills would not replace Opto's current documentation. They would add process around it:

| Opto today | Added by Matt's skills |
| --- | --- |
| Repository map and commands | Ordered idea-to-review workflow |
| Coding and security rules | Explicit human decision gates |
| Definition of done | Intermediate spec and ticket artifacts |
| Existing test conventions | One-behavior-at-a-time TDD loop |
| Architecture documents | Rules for updating vocabulary and ADRs |
| Agent chooses its own process | Repeatable process selected by the user |

The likely benefit is most significant for ambiguous, multi-system work. For a small, obvious bug, the whole flow would be overhead; invoking only `diagnosing-bugs` or `tdd` would make more sense.

The skills are only better if they improve observed outcomes in Pi. Opto is a good evaluation repository because it contains multiple stacks, existing tests, detailed instructions, and real integration boundaries. We can compare the same scoped task with and without a candidate skill.

## Easiest Installation Path

There are two answers depending on whether speed or reproducible dotfiles matters most.

### Fastest possible test

Install the stable `Mattpocock Skills` group globally for Pi using the interactive installer:

```bash
npx skills@latest add mattpocock/skills -g -a pi
```

In the selector:

1. select the 22-skill **Mattpocock Skills** group,
2. do not select the `General` group,
3. confirm Pi as the target.

This writes directly to Pi's global skill directory. It is the easiest way to try the catalog, but it is not yet tracked by this dotfiles repository.

### Easiest durable setup for us

Because this configuration must work on another machine through Stow, the easiest long-term experience is:

```bash
./scripts/update_agent_skills.sh --sync
./scripts/stow.sh apply
```

We would write the update script once. It would:

1. fetch Matt's repository,
2. copy the stable `engineering/` and `productivity/` skills into `stow/agents/.agents/skills/`,
3. fetch dmmulroy's skills for comparison reporting,
4. preserve our local-only skills,
5. show collisions and changes in `git diff`,
6. let Stow expose the result through `~/.agents/skills/`.

On a new machine, cloning the dotfiles repository and running `./scripts/stow.sh apply` would install the already-reviewed snapshot without requiring `npx skills` again.

### How much review is actually necessary?

We do not need to deeply review all 22 skills before trying them. A low-effort policy is:

- install Matt's stable 22-skill group,
- exclude all deprecated, in-progress, personal, and miscellaneous skills,
- use Matt's version when a name collides so his workflow remains internally consistent,
- keep our unique skills,
- preserve `bro`, `coding-standards-go`, and the planned personal coding-standards work,
- run project-writing or remote-issue skills only when explicitly invoked,
- inspect a skill when it first behaves unexpectedly.

The one safety review worth doing up front is checking bundled executable scripts. Most of Matt's stable catalog is Markdown, but any shell script or template capable of writes should be inspected before execution.

### Approved installation policy

The user approved this low-effort policy:

- adopt Matt's stable 22-skill catalog as the baseline,
- exclude deprecated, in-progress, personal, and miscellaneous groups,
- use Matt's version for name collisions so his workflow remains internally consistent,
- keep unique local skills,
- preserve `bro`, `coding-standards-go`, and the planned personal coding-standards work,
- keep project-writing and remote-issue workflows user-invoked,
- inspect bundled executable scripts before use,
- handle unexpected behavior when it appears rather than conducting a long review up front.

Use the durable Stow setup, keep the implementation small, and rely on normal Git diffs for future updates.

## What This Means for Our Setup

A reasonable adaptation would:

1. install approved skills globally at `~/.agents/skills/`,
2. keep the always-loaded descriptions concise,
3. preserve the user-invoked versus model-invoked split,
4. use one source of truth for shared vocabulary,
5. move large coding standards into focused references,
6. preserve explicit human approval gates,
7. adapt tool-specific wording only when Pi testing shows it is needed,
8. evaluate important skills with paired runs instead of trusting the prose.

## Final Decisions

- Use Matt's user-controlled workflow transitions.
- Adopt Matt's stable skills without requiring a paired Pi evaluation first.
- Add dmmulroy's personalization layer on top of Matt's baseline.
- Do not duplicate dmmulroy skill directories that are exact copies of Matt's versions.
- For same-name conflicts, use Matt's version unless the skill is one of the explicitly preserved local skills.
- Add dmmulroy-only skills as the personalization layer, preserving their complete references and scripts.
- Inspect executable files before enabling them, but do not require a prose review of every Markdown file.
- Preserve the approved local skills and continue the planned personal coding-standards revamp.
- Evaluate or revise a skill later only when actual Pi use exposes a problem.
