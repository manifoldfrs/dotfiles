---
name: architecture-scan
description: Evidence-backed architecture scan for refactor candidates. Use when the user asks to review a codebase area, find architecture issues, rank refactors, or identify ownership and seam problems before writing a spec.
disable-model-invocation: true
---

# Architecture Scan

Run an evidence-backed scan of a repository, directory, feature, module, file set, or concern. Return a ranked shortlist of architecture candidates. Do not edit files, refactor, create ADRs, or write a tech spec during the scan.

Use `../coding-standards-go/SKILL.md`, `../coding-standards-ts/SKILL.md`, and `../domain-modeling/SKILL.md` when relevant. Choose the standards file that matches the code under review.

## 1. Set the scan boundary

Use the scope supplied by the user. If no useful scope is supplied:

1. Inspect the repository shape and major entrypoints.
2. Infer the scope only when one area clearly dominates.
3. Otherwise ask one question that lets the user choose the scope.

Record:

- candidate boundary,
- evidence halo outside the boundary,
- exclusions,
- governing docs, standards, `CONTEXT.md`, and ADRs found.

The evidence halo may include callers, dependencies, composition roots, and tests outside the boundary. Use it only to understand evidence. Do not form candidates for it.

## 2. Build an evidence map

Use reads and searches. Do not run tests, linters, builds, formatters, or static-analysis commands during the scan.

Map the architectural surfaces inside the boundary:

- public entrypoints,
- runtime entrypoints,
- domain module clusters,
- application or service modules,
- external adapters,
- persistence boundaries,
- process or runtime boundaries,
- side-effect owners,
- resource-lifetime owners,
- tests that exercise those seams.

For each surface or group, record:

- representative files,
- call path,
- caller-visible outcome,
- existing test evidence,
- applicable standards,
- concrete findings.

Evidence beats vibes. Keep only friction that is repeated, crosses a boundary, leaks into callers, obscures ownership, or blocks testing through a real seam. Drop isolated cleanup.

## 3. Form candidates

Architecture changes who owns an invariant, policy, translation, orchestration, side effect, resource lifetime, or runtime coordination.

Turn each retained friction into an ownership move:

```txt
current owner or callers -> proposed owner
```

Do not design the final interface. That belongs in a later tech-spec workflow.

Drop candidates that are:

- aesthetic only,
- evidence-free,
- contradicted by sound local precedent,
- speculative flexibility,
- isolated cleanup,
- implementation work disguised as architecture.

Keep at most five candidates, including zero if none clears the evidence bar.

## 4. Rank candidates

Rank by architectural leverage:

- breadth of caller burden removed,
- consequence of correctness risk removed,
- ownership clarity gained,
- testability gained,
- runtime or operational risk reduced,
- cost of new interface or indirection.

When leverage is close, prefer stronger evidence and then the smaller coherent ownership move.

Use recommendation strength consistently:

- `Strong`: friction, ownership move, and leverage are supported by concrete evidence.
- `Worth exploring`: friction is supported, but the ownership move or leverage depends on a source-unverifiable claim.

Do not use `Worth exploring` to avoid available inspection. Inspect what source can answer first.

## 5. Present the result

Start with a concise scan summary:

- boundary,
- evidence halo,
- covered inventory categories,
- governing sources,
- material exclusions.

If no candidate survives, say that and explain why observed signals were pruned.

Otherwise return cards in ranked order:

```md
### <Candidate title> - <Strong | Worth exploring>

- **Standards:** <applicable standards>
- **Files/modules:** `path:line`, `path:line`
- **Current friction:** <caller burden, risk, duplication, poor seam, or test friction>
- **Evidence:** <concrete call path, repetition, leaked representation, invalid state path, or test contortion>
- **Ownership move:** <current owner or callers> -> <proposed owner>
- **Expected leverage:** <burden or risk removed relative to new machinery>
- **Existing test evidence:** <test path:line or none found>
- **Verification seam:** <public interface or real adapter through which the move would be tested>
- **Evidence gap:** <only for Worth exploring>
- **Context/ADR note:** <optional>
```

End with:

```md
Top recommendation: <candidate title> - <why it has the greatest architectural leverage>

Which candidate would you like to prepare for the tech-spec workflow?
```

## After selection

Only after the user selects a candidate, prepare a brief for `../tech-spec/`:

- candidate title,
- involved files and modules,
- problem and current friction,
- gathered evidence,
- current-to-proposed ownership move,
- applicable standards,
- known constraints and invariants,
- suspected seams, boundaries, adapters, and call paths,
- open questions,
- context or ADR suggestions.

Do not invoke or write the spec unless the user asks.

## Completion criterion

Every surviving candidate traces to cited evidence or an exact evidence gap. The result contains no more than five candidates and does not include implementation work.
