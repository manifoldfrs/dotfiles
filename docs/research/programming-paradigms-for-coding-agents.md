# Programming paradigms, languages, and system design for coding agents

Researched 2026-10-25 with Exa (papers, first-party engineering posts), Ref (docs), and xAI X search (practitioner takes).
X posts were summarized by xAI search and are cited as opinion; individual posts were not re-read one by one.

## Answer

The single strongest predictor of agent success is not the paradigm but how fast and how precisely the codebase tells the agent it is wrong.
Static types, fast compilers and test runners, strict lints with remediation-style error messages, and executable docs all feed that loop, and that is where the measured evidence is.

On functional vs OOP, the useful part of FP for agents is local reasoning: immutability and explicit data flow mean a function can be understood without loading the rest of the system into context.
The evidence also shows models drift back to imperative style unless a compiler enforces otherwise, so paradigm rules only stick when tooling enforces them.
Deep inheritance and shared mutable object graphs hurt for the same locality reason; plain data plus functions, or OOP with small explicit interfaces, both work.

On languages, training-data volume sets a floor (brand-new languages are near zero), but above that floor language design matters a lot.
Simple, stable, explicit languages with good compilers (Go, Rust, Kotlin, C#, Elixir, strict TypeScript) are repeatedly reported as easier for agents than magic-heavy or fast-churning ecosystems.

On system design, the big shift is that constraints humans used to postpone become day-one requirements.
OpenAI's agent-only team enforced a rigid layered architecture with custom linters from the start and called it a prerequisite, not overhead.
Some classic rules get repriced: DRY is contested, docs become the system of record, and tool ergonomics (errors, logs, idempotent scripts) become part of the code's design.

## Evidence

### Verification loops matter most

Anthropic's Claude Code docs say the highest-leverage practice is giving Claude a check it can run (tests, build, lint, screenshot diff), because without one "looks done" is the only signal ([Claude Code best practices](https://code.claude.com/docs/en/best-practices)).
The same docs name context as the scarce resource: performance degrades as the window fills.
Armin Ronacher's language evaluation weighted the loop heavily: Go's cached incremental tests and fast startup beat Python, whose interpreter boot and process spawning made the agent loop slow ([Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)).
He also lists tool rules that read like API design: tools must be fast, must explain misuse clearly, and must survive "an LLM chaos monkey" (for example, refuse to start a second dev server and say so).

### Types

Type-constrained decoding on TypeScript cut compilation errors by more than half (75.3% on HumanEval, 52.1% on MBPP) and raised functional correctness, with repair of non-compiling code improving 37% relatively ([Mündler et al., PLDI 2025](https://arxiv.org/abs/2504.09246)).
Syntax-only constraining fixed under 10% of errors, because almost all LLM compile errors were type errors, not syntax errors.
The same paper notes that more explicit type annotations give the model useful context, which argues against leaning on inference in agent-edited code.
For humans, TypeScript and Flow caught about 15% of public JavaScript bugs that had already survived review and testing ([Gao, Bird, Barr, ICSE 2017](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf)); agents run that check on every edit.

### Languages

Training data sets a floor.
On McEval-Hard, frontier models scored roughly 59–89% pass@1 in high-resource languages, 27–84% in low-resource ones, and 0–1% in Gleam and MoonBit, which had almost no training data ([Giagnorio et al., 2026](https://arxiv.org/abs/2606.16827)).
Low-resource languages like R and Racket lagged Java and Python in earlier work too ([Giagnorio et al., 2025](https://arxiv.org/abs/2501.19085)).

Above that floor, popularity does not decide it.
Tencent's AutoCodeBench (20 languages, about 200 problems each) had Elixir as the top language for nearly every frontier model, with C#, Kotlin, and Racket next, and Python, Rust, JavaScript, Go, and PHP near the bottom; Claude Opus 4 scored 80.3% in Elixir vs 40.3% in Python ([AutoCodeBench](https://arxiv.org/html/2508.09101)).
Caveat: each language has its own problem set, so this is not a controlled difficulty comparison, and the ranking should be read as suggestive.
SWE-bench Multilingual (real repo issues, one model, about 43 tasks per language) had Rust highest at 58% and C/C++ lowest at 29%, with Go at 31% ([SWE-bench Multilingual](https://www.swebench.com/multilingual)).
The author notes the Rust tasks changed more lines on average, so difficulty did not explain the gap.

José Valim's explanation for Elixir is design, not data: immutability makes inputs and outputs explicit, docs are separate from comments and doctests keep examples correct, documentation lives in one place (HexDocs), and the BEAM runtime is introspectable by agents ([Dashbit](https://dashbit.co/blog/why-elixir-best-language-for-ai)).
He says openly that nobody knows the root causes yet ([BEAM There, Done That interview](https://www.youtube.com/watch?v=2zkDtgLeU14)).
Ronacher's reasons for Go are similar: explicit context passing, structural interfaces, "sloppy" simplicity, and low ecosystem churn so generated code is less likely to be outdated; Python's magic (pytest fixture injection, async event loops) tripped agents up.

Practitioner consensus on X matches this: strict types plus loud, short compiler errors plus a small design space.
Matt Pocock's version is "as fast as Rust, as little design space as Go, the strictest type/verification system ever written" ([post](https://x.com/mattpocockuk/status/2114407583167705279)); Dmitrii Kovanikov argues OCaml and Go for the same reasons ([post](https://x.com/ChShersh/status/2016575231989596514)).
A dissent worth keeping: for reviewing agent output, Go's uniformity can beat Rust's expressiveness ([post](https://x.com/damian_b/status/2078862404423958649)).

### Functional vs object-oriented

There is no controlled study that pits FP against OOP for agents on the same tasks.
What exists:

- Models write imperative code even in functional languages, and more so as they get stronger: declarative-control-flow violations exceeded 68% in Haskell for the strongest models, and immutability violations were rare in Haskell (compiler-enforced) but often over 40% in OCaml and Scala ([Perish or Flourish?, EMNLP 2026 Findings](https://aclanthology.org/2026.findings-emnlp.710.pdf)).
  The practical takeaway is that the compiler, not the prompt, decides whether a paradigm survives agent edits.
- OOP benchmarks show LLMs doing noticeably worse on class-based, multi-object tasks than on function-level ones ([OOP benchmark, ACL Findings 2024](https://aclanthology.org/2024.findings-acl.808/); [JavaBench](https://arxiv.org/abs/2406.12902)), and one study found tasks with higher coupling harder ([arXiv 2408.14834](https://www.arxiv.org/pdf/2408.14834)).
  This is confounded with task size, so it says more about coupling than about OOP itself.
- Valim's locality argument is the clearest mechanism: with `manager = project.getManager(); project.updateVersion()`, you can't know `manager` without reading both methods, so mutable object graphs force more code into context ([Dashbit](https://dashbit.co/blog/why-elixir-best-language-for-ai)).

### Code health

CodeScene's peer-reviewed study of 5,000 Python files found that LLM refactorings broke tests less often on healthy code, with 15–30% lower risk for mid-size models, and that a human-calibrated maintainability metric predicted breakage 3–10× better than perplexity or file size ([Code for Machines, Not Just Humans](https://dl.acm.org/doi/pdf/10.1145/3793655.3793722)).
For Sonnet the healthy/unhealthy difference was not significant, and Claude Code was conservative everywhere, so stronger models narrow the gap but the trend still points the same way.
In short: code that is easy for humans is also easier for agents.

### Architecture and repository design

OpenAI's team that shipped about a million lines with no hand-written code divided every domain into fixed layers (Types → Config → Repo → Service → Runtime → UI), allowed cross-cutting concerns only through one Providers interface, and enforced it with custom linters and structural tests whose error messages contain remediation instructions ([Harness engineering](https://openai.com/index/harness-engineering/)).
They required parsing data at the boundary without prescribing a library, enforced file-size limits and structured logging, kept plans and design docs versioned in the repo, and ran a doc-gardening agent to fix stale docs.
Their framing: enforce invariants centrally, allow freedom locally, and accept code that is correct and legible to future agent runs even when it doesn't match human style.

Anthropic's large-codebase guidance is about navigability: lean layered CLAUDE.md files, per-directory test and lint commands, ignore files for generated code, a root map when directory structure doesn't explain itself, and LSP so the agent searches by symbol instead of string ([How Claude Code works in large codebases](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start)).
Their long-running-agent harness treats the repo as shift handoff: progress files, a feature list, and git history so a fresh context can resume ([Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).

Practitioner takes (opinion) cluster around monorepos for shared context, vertical slices as bounded units of work ([Dillon Mulroy](https://x.com/dillon_mulroy/status/2012902889249792220)), and Ousterhout-style deep modules for locality ([Matt Pocock](https://x.com/mattpocockuk/status/2102719316928221316)).
The same reasoning favors a modular monolith over many small services, since a cross-service change spreads the work across repos and network calls.

### What gets rethought

- **DRY is contested.** GitClear's data shows AI-era code with block duplication up 81% since 2023 and refactoring moves down to 3.8% of changed lines in 2026 ([GitClear 2026](https://www.gitclear.com/the_ai_code_quality_maintainability_gap)).
  Some builders argue duplication is cheaper now because the agent updates every copy ([Dax](https://x.com/thdxr/status/2092273037395538050)), while Karpathy complains agents bloat abstractions and copy-paste blocks regardless of AGENTS.md instructions ([post](https://x.com/karpathy/status/2035173492447224237)).
  Both can be true: agents are bad at choosing abstractions, so a wrong abstraction is worse than duplication, but unmanaged duplication still costs every future change.
- **Docs become the system of record**, versioned and checked by CI, since the agent knows nothing that isn't in the repo or its tools (OpenAI, Anthropic above; the [llms.txt proposal](https://llmstxt.org/) for library docs).
- **Error messages and lint output are UI for agents.** Writing remediation into custom lint messages (OpenAI) and making tools fail loudly and idempotently (Ronacher) turns conventions into feedback.
- **Magic costs more.** Implicit injection, runtime monkeypatching, and filename conventions with shell-special characters (Ronacher's TanStack `$param.tsx` example) all cause avoidable agent failures.
- **Ecosystem stability is a feature**, because agents emit the API they saw in training.

## Recommendations (my synthesis, not measured)

1. Pick a statically typed, fast-compiling language in strict mode with explicit annotations at module boundaries.
2. Make the check loop fast and scoped: per-package test commands, cached tests, quick type checks.
3. Prefer immutable data and explicit inputs/outputs; keep side effects at the edges (functional core, imperative shell). Use OOP for encapsulated state with small interfaces, not inheritance hierarchies.
4. Enforce architecture with linters and structural tests, and write the lint messages as instructions.
5. Organize by feature (vertical slices, deep modules) in a monorepo or modular monolith so one change stays in one place.
6. Avoid framework magic; prefer boring, greppable names and explicit wiring.
7. Keep code health high; it measurably lowers agent breakage, and agents are better at cleanup passes than at choosing abstractions up front.

## Open questions

- No controlled FP-vs-OOP study for agents exists; the locality argument is a mechanism, not a measurement.
- Cross-language benchmarks are not difficulty-matched, so "Elixir is best" is suggestive, not settled.
- Much of the evidence predates the newest models, and stronger models shrink some effects (CodeScene's Sonnet result).
- Whether duplication is net-cheaper with agents has not been measured beyond churn and clone metrics.
