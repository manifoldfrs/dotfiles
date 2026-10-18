# Shared engineering guidance

This reference holds principles, not an instruction to start fstack or another workflow.
Loading a language pack does not authorize a full investigation, prototype, or second-model review.
Project instructions, safety rules, and the user's requested scope remain authoritative.

## Principles

1. **Understand the change.** Inspect the existing behavior, its callers, and the project's conventions before editing.
   Scale the investigation to the uncertainty; an obvious small change does not need a written ground brief or history audit.
2. **Follow the language and project.** Prefer the standard library, framework, and existing helpers before introducing new machinery.
   No language, server architecture, or UI framework is the default for another language.
3. **Keep ownership clear.** Put invariants and side effects with their real owner; preserve absence and explicit failure behavior.
   Prefer the simplest implementation that meets the current contract.
4. **Work in checked slices.** Keep changes scoped and run the relevant checks as you go.
   Tests exercise public behavior; use the compiler and linter for properties they can enforce.
5. **Verify the claim.** Run the changed behavior where practical, and use the real database, runtime, or UI when the claim depends on it.
   Report untested cases and blockers honestly; reuse relevant evidence rather than repeat identical checks under several skills.
6. **Make deeper work deliberate.** Full investigation, design alternatives, exhaustive proof, and independent review are separate tasks selected by the user or an explicitly requested fstack route.
   Routine inspection, regression tests, and verification still apply to ordinary work.
7. **Respect approval boundaries.** Continue within the authorized scope; stop before unapproved destructive actions, deployment, external messages, and live configuration changes.
   When the user asks to discuss a decision, explain it and wait.
8. **Encode repeated lessons.** Prefer a type, lint rule, or regression test over another prose instruction when a deterministic check can prevent the mistake.

## Language guidance

Load only the packs relevant to the code being changed.
Each pack stands on its own ecosystem's conventions, not on differences from another language.

| Code being changed | Skill |
| --- | --- |
| TypeScript | `coding-standards-ts` |
| Effect services, schemas, or resource management | `coding-standards`, plus the applicable TypeScript guidance |
| Go | `coding-standards-go` |
| Rust | `coding-standards-rust` |
| Swift | `coding-standards-swift` |
| Kotlin | `coding-standards-kotlin` |
| Ruby on Rails | `coding-standards-rails` |
| Plain browser JavaScript in a Rails/Hotwire or import-map application | `coding-standards-javascript` |

Keep concrete application architecture, error contracts, and deployment decisions in the project's own documents.
Do not transfer Rails model patterns into Go, Effect Layers into ordinary TypeScript, or one application's UI stack into another.
For a requested new language pack, use the [language pack template](language-pack-template.md).

## Sources and adaptations

The emphasis on scoped changes, existing conventions, and observable evidence retains ideas from 37signals, HumanLayer, and pstack without adopting a framework-specific architecture globally.
The individual workflow skills retain their own source attribution.
