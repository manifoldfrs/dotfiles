# fstack doctrine

Every fstack skill points here.
Read it once per session.

## Posture

These instructions are defaults with reasons, not law.
When the code in front of you disagrees, take the better path and flag the conflict.
Surface invariants such as data loss, security, and CI gates; never override them.
Attack your own diff before calling it done.

This posture comes from 37signals' Fizzy `AGENTS.md`.

## The Rails Doctrine in any language

Ruby on Rails is the default taste, and every language gets the same values.

| Pillar | What it means for an agent in any language |
| --- | --- |
| Optimize for programmer happiness | The next reader understands the code quickly; reader load is a review criterion. |
| Convention over Configuration | Follow the repository's and the ecosystem's conventions, and use the framework before new code. |
| The menu is omakase | fstack picks the route, the checks, and the reviewer; the user judges results. |
| No one paradigm | Follow each language's grain; never move one language's architecture into another. |
| Exalt beautiful code | Code reads well where it is used, not only where it is defined. |
| Provide sharp knives | No blanket bans on concerns, callbacks, metaprogramming, or `unsafe`; require judgment and evidence. |
| Value integrated systems | Prefer the monolith and Hotwire Native; add a service, a fully native client, or another language only when it is necessary. |
| Progress over stability | Migrate every caller and delete the old path in one change. |
| Push up a big tent | Other languages are welcome; each gets a thin language pack. |

## Ten rules

1. **Dig before you build.** On build and reshape routes, learn how the code works, why it has its shape, and what a change reaches, before any code.
2. **Facts before judgment.** Describe the code as it is first, then judge it in a separate section.
3. **Reach for the framework.** Find the framework or standard-library feature before writing new code.
4. **Follow the language's grain.** Rails leans on models, database constraints, and tests; Rust, Swift, and Kotlin lean on types and the compiler.
5. **Show, don't spec.** When the shape is contested, make two or three sketches and let the human pick; a mockup settles more than a paragraph.
6. **Continue on reversible work, stop on irreversible work.** One outward action per command.
7. **Subtract first.** Delete dead code and one-caller wrappers before adding, and add no structure until a second real case exists.
8. **Small checked slices.** Each slice ends with a passing check before the next starts.
9. **Prove it on the real thing.** Run the feature, read the stored value, check every edge case; a green suite alone is not done.
10. **Encode the lesson.** A mistake seen twice becomes a lint rule, type, or test before it becomes prose.

## The user's standing rules

These come from the user's corrections across projects.
Each skill named here applies the rule by default.

| Rule | Applied in |
| --- | --- |
| Fix the whole class, not the example the user showed. | `dig` radius, `fstack` fix |
| Enumerate every axis before claiming coverage, and name the axes not checked. | `dig`, `prove` |
| Dismiss a behavior finding only with a test that shows the case works. | `code-review`, `testing` |
| "Fix it" means the smallest fix in the change that owns the feature, with no proposal. | `fstack` fix |
| "Let's think on this" means stop and explain, not pick a default. | `fstack` |
| Add no folders, fields, or layers for a future that has not arrived. | rule 7 |
| Give no time or effort estimates. | every skill |
| Code is the source of truth; plans stay local and code pull requests carry no docs. | `dig`, `pr` |
| Stage only the files that implement the change. | `pr` |
| After a UI change, retake every screenshot under new file names. | `pr` |
| After a rejected or interrupted command, check what actually ran before reporting. | rule 6 |
| Review abstraction, performance, and duplication first. | `code-review` |
| Plans for review use context first, simple English, `CONTEXT.md` terms, and visuals beside the text. | every plan |

## Language packs

Load the pack for the language being changed before writing code.
Each pack states only where its language differs from the Ruby default.

- `coding-standards-rails` for Ruby and Rails, the baseline.
- `coding-standards-javascript` for plain JavaScript.
- `coding-standards-rust`, `coding-standards-swift`, and `coding-standards-kotlin` for Rust, Swift, and Kotlin.
- `coding-standards-ts`, `coding-standards-go`, and `coding-standards` for TypeScript, Go, and Effect.
- For any other language, write a pack from the [language pack template](language-pack-template.md) when work in that language starts.
