# Harness study

Compares Claude Code and Pi on response time, accuracy, tokens, and cost with the same model (`claude-opus-5-5`, medium effort), and asks whether Pi's codemode is worth porting to Claude Code.

## Arms

| Arm | Command |
|---|---|
| `cc` | `claude -p --output-format stream-json --effort medium --dangerously-skip-permissions` |
| `pi` | `pi -p --mode json --thinking medium --exclude-tools codemode` |
| `pi-codemode` | `pi -p --mode json --thinking medium` with codemode available (`codemode.mode: on`, the live default) |
| `pi-codemode-only` | Same, plus a fixture `.pi/settings.json` with `codemode.mode: only` and `--approve`, so every tool call goes through a codemode script |
| `cc-codemode` | `cc` plus the [codemode mod](../stow/claude/.claude/mods/codemode/), Claude Code's port of Pi's codemode |

Both Claude Code arms pin their mod list with `--settings`, so `cc` runs without the codemode mod even when it is enabled live.

Every arm runs with the user's live configuration: mods, hooks, extensions, guardrails, and MCP servers.
Pi's provider is `pi-claude-cli`, so Pi's model calls also go through a `claude` subprocess; the comparison isolates system prompt, tool surface, and harness loop, not transport.

## Tasks

Each task in `tasks/<name>/` has `setup.sh FIXTURE EXPECTED_FILE`, `prompt.md`, and `check.sh FIXTURE EXPECTED_FILE ANSWER`.
Fixtures are generated deterministically into `$TMPDIR` and committed to a throwaway git repository, so no run touches this repository.

| Task | Kind | Graded by |
|---|---|---|
| `qa-baseline` | No tools; measures harness prompt overhead | exact answer |
| `fanout-ports` | Read 40 TOML files, sum filtered values, with comment and key decoys | exact answer |
| `log-filter` | Filter a 60k-line log with service and level decoys | exact answer |
| `org-chart` | Join 80 JSON files to find a manager | exact answer |
| `dead-function` | Find the one unreferenced function among 20 modules | exact answer |
| `bash-bugfix` | Fix an off-by-one in a Bash script | test passes, tests unchanged |
| `js-bugfix` | Fix two bugs across Node modules | `node --test` passes, tests unchanged |
| `rename-across` | Rename a function across 14 files without touching look-alikes | grep checks and test pass |

### Complex suite (`tasks-complex/`)

| Task | Kind | Graded by |
|---|---|---|
| `mcp-orders` | Page through 90 orders on a local MCP server, with status-case, country-whitespace, billing-country, and discount traps | exact answer |
| `mcp-tickets` | Paged ticket search joined with customer lookups, with merged-ticket and `enterprise-trial` traps | exact answer |
| `ledger-reconcile` | Match a ledger against a bank CSV with mixed reference styles, date and amount formats, split payments, and sign flips | exact answer |
| `ttl-cache` | Fix an LRU cache with TTL against a written spec | hidden tests |
| `parse-duration` | Rewrite a duration parser against a strict grammar | hidden tests |
| `map-limit` | Fix a bounded-concurrency mapper: refill, order, fail-fast, validation | hidden tests |
| `misleading-debug` | A crash in `report.js` caused by shared-default mutation in `config.js` | hidden tests |
| `bash-dedupe` | Fix a dedupe script for hostile file names, symlinks, and byte-order keepers on Bash 3.2 | hidden tests |

The MCP tasks use [mcp/fixture-server.mjs](mcp/fixture-server.mjs), a deterministic stdio server; answer keys come from [mcp/expected.mjs](mcp/expected.mjs), which the server does not expose.
Claude Code gets the server through `--mcp-config`; `pi` and `pi-codemode` get it with `direct` exposure, and `pi-codemode-only` with `codemode` exposure.
Hidden tests live in each task's `hidden/` directory and run on a copy of the fixture after the agent finishes; answer keys are written to `results/<name>/keys/`, outside every fixture.

## Run

```bash
harness-study/run.sh --reps 5 --jobs 4                    # all tasks and arms
harness-study/run.sh --tasks log-filter --arms cc,pi      # subset
harness-study/run.sh --suite tasks-complex --reps 16      # complex suite
harness-study/run.sh --rescore harness-study/results/run1 # regrade raw transcripts
harness-study/summarize.sh harness-study/results/run1
```

Jobs are shuffled so rate limits and drift hit every arm alike.
Results land in `results/<name>/`: `runs/*.json` per run, `summary.md`, and `summary.json`; raw transcripts in `raw/` are ignored by git.

## Results: run1 (2026-11-11, 992 runs, 31 reps per cell)

See [results/run1/summary.md](results/run1/summary.md) for the per-task table.
Reps 1-5 ran the first three arms interleaved and `pi-codemode-only` afterwards; reps 6-31 interleaved all four arms.
Differences are paired by task and rep, with bootstrap 95% confidence intervals and sign-flip permutation p-values.

| Arm | Accuracy | Mean wall s | vs `cc` | Mean input ktok | Mean cost USD |
|---|---|---|---|---|---|
| `cc` | 248/248 | 28.1 | | 188.9 | 0.43 |
| `pi` | 246/248 | 22.8 | -5.3 s (-19%), CI -6.3 to -4.2 | 91.5 | 0.15 |
| `pi-codemode` | 242/248 | 22.4 | -5.8 s (-20%), CI -6.8 to -4.6 | 95.4 | 0.16 |
| `pi-codemode-only` | 247/248 | 21.3 | -6.9 s (-24%), CI -7.9 to -5.8 | 55.7 | 0.15 |

### Claude Code against Pi

- Every Pi arm is faster than Claude Code (p < 0.001); Pi wins 7 of 8 tasks, and `dead-function` is a tie.
- The gap is largest on multi-step tasks (`js-bugfix` +11.0 s, `org-chart` +10.1 s) and is 3.0 s even on the no-tool `qa-baseline`, which is pure harness overhead.
- Claude Code reads about 2x the input tokens and costs about 2.8x per task at list price; its baseline context is 61k tokens against 25k for Pi, and it loads 813 tools from about 30 MCP servers, most of them claude.ai connectors.
- Median non-model time is 14.8 s for Claude Code against 11.5 s for Pi; median model time is 13.5 s against 12.4 s.

### Accuracy

- Every miss is on `log-filter`: cc 0/31, `pi` 2/31, `pi-codemode` 6/31, `pi-codemode-only` 1/31.
- Every miss comes from a run that extracted users with BSD `sed -E 's/.*user=(\S+).*/\1/'`, where `\S` silently fails to match and the count becomes 2075 instead of 1500.
- Both harnesses run the same `/usr/bin/sed`; Claude Code never wrote that pattern (0/31 runs), while Pi arms did in 2, 9, and 1 runs.
  The harness prompt changes how the model writes shell code, not the shell.
- cc against `pi-codemode` is significant (Fisher p = 0.024); cc against all Pi arms pooled (9/93) is not (p = 0.11).

### Codemode

- With codemode optional, the model called it in 1 of 248 runs, so `pi-codemode` behaves like `pi` (-0.45 s, CI -1.5 to +0.6, p = 0.42).
- With codemode forced, Pi is 1.55 s faster than without it (CI -2.7 to -0.4, p = 0.007, which just survives a Bonferroni correction across the six comparisons, threshold 0.0083).
  The gain comes from `log-filter` (-7.9 s): forced runs took 3 turns instead of 6 and triggered the `jev-checks` follow-up loop in 10 runs instead of 17.
  Excluding `log-filter`, the difference is -0.6 s (CI -1.6 to +0.4), not significant.
- Forced codemode cuts input tokens about 40% against `pi`, because tool declarations move into one description, but cost per task changes by under a cent.
- Forced scripts called `bash` 510 times, `read` once, and `jev_gate` once; none used `Promise.all`.
  Only `org-chart` drew on JavaScript (36 of 63 scripts parsed the JSON and computed the answer in the script), with no measurable speedup (-1.6 s, ±3.4 s); elsewhere 2 of 419 scripts processed results, because `bash` already gives the model a scripting surface for local files.

### Guardrail follow-ups

- Pi's `jev-checks` guardrail started a correction loop in 46 runs, 41 of them on `log-filter`, adding about 11-18 s to each affected log-filter run; Claude Code runs never triggered one in print mode.

### Time drift

- Absolute wall time rose about 6-10 s per arm across the evening (for example `cc` 24.8 s in reps 1-5 and 30.8 s in reps 25-31), so compare arms within a batch, as the paired analysis does, rather than against earlier absolute numbers.

## Results: complex1 (2026-11-12, 512 runs, 16 reps per cell)

See [results/complex1/summary.md](results/complex1/summary.md) for the per-task table.
All four arms interleaved; differences are paired by task and rep.

| Arm | Accuracy | Mean wall s | vs `cc` | Mean cost USD, MCP tasks | Mean cost USD, other tasks |
|---|---|---|---|---|---|
| `cc` | 128/128 | 59.2 | | 0.86 | 0.49 |
| `pi` | 128/128 | 47.3 | -11.9 s (-20%), CI -13.5 to -10.3 | 0.51 | 0.20 |
| `pi-codemode` | 128/128 | 36.9 | -22.3 s (-38%), CI -26.4 to -18.4 | 0.17 | 0.20 |
| `pi-codemode-only` | 128/128 | 37.4 | -21.8 s (-37%), CI -25.4 to -18.4 | 0.19 | 0.19 |

- Accuracy saturates again: every arm passed every task, including all hidden-test suites.
  The graders bite: agent fixtures show real edits, hidden suites run 7-11 tests each, and a planted `Math.round` to `Math.floor` mutant fails the check.
- Codemode pays off on MCP tasks.
  With codemode available, the model chose it in 32 of 32 MCP runs and 0 of 96 other runs.
  On `mcp-orders` it cut mean wall time by 72 s against `pi` (98 s to 26 s), median turns from 16 to 3, and mean cost from $0.82 to $0.17; scripts paged with loops and fetched all 90 orders with `Promise.all`, then filtered in JavaScript.
  On `mcp-tickets` it saved 8 s.
- Forcing codemode on MCP tasks is 5 s slower than letting the model choose (p < 0.001), because `codemode` exposure hides the tool schemas: all 32 forced MCP runs called `describeTool` or `searchTools` first (0 of 32 with `direct` exposure), using 140 scripts against 69.
- On the six non-MCP tasks, codemode stays neutral: available is -0.6 s (p = 0.37) and forced is -1.7 s (p = 0.025) against `pi`.
- Pi stays faster than Claude Code on every task: 13.5 s (25%) on non-MCP tasks and 7.3 s without codemode on MCP tasks.
- Claude Code makes the 96 MCP calls on `mcp-orders` as tool-call batches of up to 17 per message, so its mean wall time (104 s) is close to plain `pi` (98 s); it has no way to batch them into one script.
- No run touched `keys/`, `hidden/`, `expected.mjs`, `datasets.mjs`, or the server source.

## Results: complex2 (2026-11-12, 256 runs, 8 reps per cell, trimmed Claude Code)

Same complex suite after setting `disableClaudeAiConnectors: true` and turning the Vercel plugin off, which took Claude Code from 815 tools to 97.
See [results/complex2/summary.md](results/complex2/summary.md).

| Comparison (paired, `cc` minus `pi`) | complex1 | complex2 |
|---|---|---|
| All 8 tasks | +11.9 s (+25%) | +4.4 s (+10%), CI +2.3 to +6.5 |
| Six non-MCP tasks | +13.5 s (+33%) | +6.9 s (+18%) |
| Two MCP tasks | +7.3 s (+11%) | -3.1 s (-5%) |

- Every arm again passed every task.
- Claude Code's mean input fell from 250k to 108k tokens on non-MCP tasks, now level with Pi's 114k, and its mean cost from $0.49 to $0.21 (Pi $0.20).
- Claude Code is still slower on most non-MCP tasks, by 6.9 s on average; its median non-model time is 19.9 s against 15.3 s for Pi, so the rest of the gap is harness overhead rather than context size.
- Without codemode, the two harnesses now tie on MCP tasks; `pi-codemode` stays 30.6 s faster than Claude Code there.

## Limits

- In `run1`, all tasks act on local files, where `bash` already covers fan-out and filtering; `complex1` adds two MCP tasks against a local server with no network latency, so remote MCP servers would likely widen the codemode gap.
- Opus 5.5 at medium effort solved every complex task, so neither suite separates the harnesses on accuracy beyond the `sed` pitfall in `run1`.
- With 31 repetitions per cell, overall paired differences of about 1 s are detectable; per-task intervals are about ±3 s.
- Pi's model time comes from per-message `durationMs` and Claude Code's from `duration_api_ms`, so the split between model and harness time is approximate.
