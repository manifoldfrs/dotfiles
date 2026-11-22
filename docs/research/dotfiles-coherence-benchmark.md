# Dotfiles coherence benchmark

## Decision

Keep the current configuration in place.
The shorter instructions passed the diagnostic check more often in this sample but missed the predeclared routine latency limit.
The debugging skill did not add a full diagnostic pass over the shorter instructions.
This branch preserves the tested candidate for review.
The live configuration still uses setup A.

## Sol Medium Ultrafast

A used the current rules.
B used the shorter rules.
C used the shorter rules and the opt-in debugging skill.

| Setup | Bash diagnosis full passes | Median active time | Routine full passes | Median active time |
| --- | ---: | ---: | ---: | ---: |
| A | 0/3 | 18.798s | 3/3 | 9.445s |
| B | 2/3 | 17.271s | 3/3 | 11.364s |
| C | 2/3 | 24.580s | 2/3 | 10.035s |

B's routine median was 20.32% over A, versus a 20% allowed increase.
That difference is 30 ms above the acceptance line and does not establish a persistent speed regression with three samples.
Root and global rules decreased from 18,714 to 13,723 bytes (26.7% smaller).

All three setups got the Bash cause right.
The hard-task pass required the locked post-correction login command and its expected output from the disposable account.
Some misses had other valid diagnostic evidence.
For instance, Sol C's third diagnosis executed Pi from a noninteractive login shell and verified the command hash, but did not run the locked command-v probe.
In C's third routine run the model reported the previous successful check after the correction without running it again.
All three B hard-task runs opened with the decisive observation, so there was no headroom to demonstrate the required two additional target-criterion passes for C.

## Astra High, default tier

| Setup | Bash diagnosis | Routine check |
| --- | ---: | ---: |
| A | 1/1 | 1/1 |
| B | 1/1 | 1/1 |
| C | 1/1 | 1/1 |

Astra served as a one-run-per-task regression check.

## Verification and scope

- 24 scored sessions completed.
  The A/B/C rule-retrieval checks and 27 Codex mock routing checks passed.
- The test commits were local repositories with one commit and no remotes.
  A/B differed only in the two AGENTS.md files.
  B/C differed only in the debug skill.
- Tool traces established post-correction command execution.
  Blinded claim verification graded the final answers and scope, with direct trace inspection for lower-confidence decisions.
- All measured Git trees remained clean.
  C received the explicit skill only for hard tasks.
  In C's routine Astra trial, the model independently opened the skill file with a shell command, failing the rule that the skill stay unloaded on routine tasks.
  The task itself still passed its rubric.
- No confirmation block was needed for an eligible candidate.
  B missed its independently binding time limit, and C requires B to pass.
- This benchmark used an isolated Docker Codex account and mock tools.
  Cross-harness runtime compatibility and live integrations were not benchmarked.
