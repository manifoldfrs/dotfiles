# Choosing a harness and models by Popper's standards

Researched 2026-11-06 with Exa, Ref, xAI X search, local git history, and local config.
Conflict of interest: this was written by Claude Opus 5.5 running in Claude Code, so Anthropic and Claude Code were searched for negatives on purpose.
Quotes from X came through xAI search and could not be opened independently, so they are marked `[X via xAI]`.

## Answer

Popper would reject the question as first asked.
"Which lab is the most Popperian?" has the same shape as "who should rule?", and his replacement question is how to arrange things so that bad rulers do little damage.
The useful version here is: which setup makes my errors easiest to find and cheapest to undo?

Taken literally anyway, the rankings are:

- **Most Popperian harness:** OpenCode, with pi close behind. Both are MIT-licensed, work with many providers, and can be read, forked, and left.
- **Least Popperian harness on openness:** Claude Code. It is closed source, and Anthropic does not support it with non-Claude models.
- **Most built-in criticism:** Claude Code and Codex, not the open harnesses.
- **Labs:** there is no single winner, because error correction splits in two. Open-weight labs let outsiders test without permission. Anthropic, OpenAI, and Zhipu publish the best accounts of their own failures.

Recommendation: stay on Claude Code with Opus 5.5, keep Sol as reviewer, and keep OpenCode working as a tested way out.
This is not because Claude Code is more Popperian, since on openness it is the least.
It is because the model moves results far more than the harness does, your own hard task refuted the alternative, and your criticism machinery already runs there.
The switching stops when the choice carries written conditions for its own refutation, listed under [Refutation conditions](#refutation-conditions).

## What the philosophy gives you

Popper and Deutsch judge claims and institutions, not brands.

- Popper: "Every 'good' scientific theory is a prohibition" ([Conjectures and Refutations](https://web.stanford.edu/~paulsko/papers/Popper_CandR.pdf)).
- Popper: origins "have in any case little bearing upon truth", and questions about sources "beg for an authoritarian answer" ([On the Sources of Knowledge and of Ignorance](http://rosenfels.org/Popper.pdf)).
- Popper makes one exception, "Except in history" ([same source](http://rosenfels.org/Popper.pdf)). "We ran this eval" is a historical claim, so discounting an unreproducible report is fair. Discounting a maker is not.
- Popper: objectivity is "a product of the social or public character of scientific method", not of individual impartiality ([Open Society excerpt](http://www.theopensociety.net/2012/04/the-social-character-of-scientific-method/)).
- Deutsch: testability "is of little use in the case of bad explanations", so passing tests is not enough ([Beginning of Infinity excerpts](https://fluidself.org/books/science/the-beginning-of-infinity)).
- Deutsch: the most important knowledge institutions hold is "how to detect and eliminate errors" ([same excerpts](https://fluidself.org/books/science/the-beginning-of-infinity)).

On AI, Deutsch said of LLMs in 2023, ["They don't create knowledge"](https://dirkswebsite.nl/deutschland/2023-04-08-reason-is-fun-minus-1-agi.md).
He has since written that LLMs are "trained to imitate patterns of language, not to discover or verify truth" `[X via xAI]`.
He still treats them as useful tools, and his [2012 essay](https://aeon.co/essays/how-close-are-we-to-creating-artificial-intelligence) calls input-output testing "appropriate for most computer programming other than AGI".
So behavioural tests of harnesses are legitimate by his own lights.

The best counterargument is that the loop can create knowledge even if the model alone cannot.
[FunSearch](https://www.nature.com/articles/s41586-023-06924-6) and [AlphaEvolve](https://arxiv.org/html/2506.13131v1) run variation and selection against evaluators and found new results.
Deutsch's bar is new explanatory knowledge, which this does not reach, and no comment from him on these systems was found.
This is my inference, but it is the practical point: judge the whole loop of model, harness, and checks, never the model alone.

Your suspicion holds.
Being "Popperian-aligned" is an essence, and Popper tells you not to argue about essences.
What survives is a list of behaviours that can be observed to fail.

## Criteria that can fail

These are derived from the sources above, so they are a conjecture of mine and not Popper's own list.

1. **Prohibition:** a capability claim names a result that would refute it.
2. **Repeatability:** outsiders can rerun it from published versions and prompts.
3. **Failure disclosure:** failures are reported, not only wins.
4. **No twists:** a missed claim is withdrawn, not redefined.
5. **Independent evidence:** "tests passed" comes from a recorded run that the agent cannot edit.
6. **Live checks:** a seeded bug makes the checks fail.
7. **Removability:** a change, a default, or the vendor can be dropped without losing work.
8. **Openness to critics:** behaviour changes are versioned, and critics are not punished.

## Labs

| Lab | For | Against |
| --- | --- | --- |
| Anthropic | Postmortems ([Sept 2025](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues), [April 2026](https://www.anthropic.com/research/april-23-postmortem)); [METR employee-like access](https://www.anthropic.com/news/an-update-on-independent-evaluators) | METR says Anthropic ["redacted a majority of the evidence we found most informative"](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/); [dropped its pause pledge](https://time.com/7380854/exclusive-anthropic-drops-flagship-safety-pledge/); Fable 5 [silently degraded AI-development answers](https://www.theverge.com/ai-artificial-intelligence/948280/anthropic-claude-fable-invisible-distillation-guardrail) until reversed; [DMCA notice hit a network of 8.1K repos](https://github.com/github/dmca/blob/master/2026/03/2026-03-31-anthropic.md), mostly retracted; [bars third-party login](https://code.claude.com/docs/en/legal-and-compliance) |
| OpenAI | Postmortems ([sycophancy](https://openai.com/index/expanding-on-sycophancy/), [goblins](https://openai.com/index/where-the-goblins-came-from/)); [iterative deployment](https://openai.com/safety/how-we-think-about-safety-alignment/), the closest doctrine to piecemeal engineering; Codex is Apache-2.0; [endorses OpenCode and pi](https://developers.openai.com/community/codex-for-oss) with ChatGPT plans | [Subpoenaed at least seven critics](https://www.nbcnews.com/tech/tech-news/openai-chatgpt-accused-using-subpoenas-silence-nonprofits-rcna237348); the 2024 non-disparagement clause; Codex [takes no outside pull requests](https://github.com/openai/codex/blob/main/docs/contributing.md) |
| DeepSeek | [MIT weights](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813); [R1 in Nature with published reviewer reports](https://www.nature.com/articles/d41586-025-02979-9) | No technical account of the [Oct 15 outage](https://www.yicaiglobal.com/news/deepseek-offers-compensation-after-nearly-five-hour-outage) was found, nor a system card; [CAISI found it 12x more hijackable](https://www.nist.gov/news-events/news/2025/09/caisi-evaluation-deepseek-ai-models-finds-shortcomings-and-risks) in 2025 |

Zhipu published the best root-cause [postmortem](https://z.ai/blog/scaling-pain) found from a Chinese lab.
Open weights let outsiders test models uninvited, and that is a real Popperian property that no closed lab has.

## Harnesses

| Harness | Source | Other providers | Built-in criticism | Main risk |
| --- | --- | --- | --- | --- |
| Claude Code | [Closed](https://github.com/anthropics/claude-code) | [Unsupported](https://code.claude.com/docs/en/llm-gateway) | Blocking hooks, subagents, `/rewind` | One vendor controls it; [regressions lasted about six weeks](https://www.anthropic.com/research/april-23-postmortem) in spring 2026 |
| Codex | Apache-2.0, no outside PRs | [Subagents inherit the provider](https://developers.openai.com/codex/agent-configuration/subagents) | Hooks, OS sandbox, approvals | Still 0.x, with breaking changes |
| pi | [MIT](https://github.com/earendil-works/pi) | 15+ providers, `/model` mid-session | Extensions only, by design | [Earendil](https://rfc.earendil.com/rfc/0015) plans closed additions |
| OpenCode | MIT | [Best native mixing](https://opencode.ai/v2/docs/agents/) | Permissions, plan agent, snapshots, review | [CVE-2026-22812](https://github.com/anomalyco/opencode/security/advisories/GHSA-vxw4-wv6m-9hhh) went unanswered; Claude access rests on an [unconfirmed permission](https://github.com/anomalyco/opencode/pull/58782) |

## How much the harness matters

Much less than the model, on the evidence available.

[HarnessTax](https://arena.ai/blog/coding-agents-harness-tax) ran 21 model-harness pairs on 30 tasks per benchmark, three times each.
The average harness effect on success stayed within ±2% on SWE-bench Lite and about ±5% on Terminal-Bench 2.0.
Claude Code cost about 2.0× Pi on SWE-bench Lite, and its initial context was over 10× Pi's.
An alternative harness had the best observed success in 9 of 12 comparisons.
Those are API prices, and the extra spend does not map directly onto a flat Claude Max plan.
The authors warn the benchmarks may have been seen in training, and these are short tasks, unlike long migrations.

Within Claude Code on [Terminal-Bench 4.0](https://www.tbench.ai/), Opus 4.8 scored 23.6% and Opus 5.5 scored 64.8%.
That gap dwarfs anything a harness did in HarnessTax, although the two studies are not directly comparable.

## Opus with cheap subagents

Not as a default.

[Hard12](https://ibragim.dev/leaderboard-v2/), updated 2026-11-06, ran 12 hard tasks three times per setup:

| Setup | pass@1 | $/task |
| --- | --- | --- |
| Opus 5.5 medium, solo | 83.3% | $1.20 |
| GPT-6.1 Terra medium on pi, solo | 80.6% | $0.17 |
| Opus 5.5 + DeepSeek V4.1 Flash | 77.8% | $1.31 |
| Opus 5.5 + DeepSeek V4.1 Flash 1017 | 72.2% | $1.29 |
| DeepSeek V4.1 Flash 1017, solo | 58.3% | $0.14 |
| DeepSeek V4.1 Flash 1017 + Sol review loop | 72.2% | $0.28 |

No Opus-led team beat solo Opus.
The author also reports that 71% of team failures were tasks the worker failed alone, and that cache rewrites erased the savings `[X via xAI]`.
Handoffs lose information too: on one task Opus and DeepSeek each passed 3 of 3 alone, but together passed 2 of 3 because Opus wrote a rule into the ticket that the hidden test rejected `[X via xAI]`.

This evidence is weaker than it looks.
At 36 runs per setup, my Fisher exact tests put solo Opus against the best team at p≈0.77 and against the 72.2% team at p≈0.40.
Those tests treat runs as independent, which flatters them, since three runs share a task.
The pattern across many setups matters more than any single gap, and the table has shifted between versions: the original post said 81% versus 67%.

Other evidence points the same way, with limits.
[Cohere's paper](https://arxiv.org/abs/2610.17471) found cheap models pay off as planners but not as implementers, and that teams beat solo agents on long tasks at 3–7× the cost.
Malte Ubl reports DeepSeek subagents under Opus doing 99% of the work for about $9 `[X via xAI]`, but he is Vercel's CTO, the post features Vercel Sandbox, and it reports no quality measure.
Anthropic ["doesn't support routing Claude Code to non-Claude models"](https://code.claude.com/docs/en/llm-gateway), so that setup can break without notice.

Cheap workers suit bulk, independent work with an external check.
If you try this, do it in OpenCode, where cross-provider subagents are a documented feature.
[DeepSeek's own API stores data in China](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html?locale=en_US), so keep work code off it and use a third-party host.

## DHH

"Straight up Claude Code and Opus" is incomplete.
In his [August Lex Fridman interview](https://lexfridman.com/dhh-2-transcript/) he said "I've mainly been driving with Claude" and "they actually have the best harness".
He used Fable for planning and review, Opus 5 for implementation, and said "I always end it, review with Codex xHigh".
He called OpenCode "my main harness for all the open models".
Later he summed up his setup as "any harness, multiple agents concurrently, barely any skills, and using adversarial reviews" `[X via xAI]`.
His setup also moved during 2026, from OpenCode with Opus in [January](https://world.hey.com/dhh/promoting-ai-agents-3ee04945) to starting most tasks with Kimi around February, so he is not a fixed reference point.

## Review evidence

A second look matters, and the evidence on whether it must be a different family is split.

- [A preregistered replay study](https://stephens.page/blog/fresh-eyes-beat-a-second-family/paper/fresh-eyes-beat-a-second-family.pdf) found a fresh same-model session caught as much as the other family, across 183 replayed reviews.
- It also found the original reviews had raised 2 of 6 escaped bugs, and the authoring agent declined both.
- [A planted-error study](https://arxiv.org/html/2610.01471v1) found one same-model plus one cross-model review matched 56.7% of errors, against 42.7% for two same-model reviews.
- [A small pilot](https://arxiv.org/abs/2609.04270) found self-review falsely rejected 35% of correct answers, against 2% for a cross-family reviewer.
- On Hard12, Opus reviewing Sol without running the code requested changes in 31 of 36 runs and broke 4 passing solutions `[X via xAI]`.

The shared lesson is that criticism needs a way to be settled.
A finding that becomes a failing test is a refutation; a finding that stays an opinion can damage working code.

## Your own record

Your git history shows about six changes of main harness between 2026-09-20 and 2026-11-03:

| Date | Commit | Change |
| --- | --- | --- |
| 2026-09-20 | `6defc5c` | OpenCode 2 |
| 2026-10-05 | `eefe131` | Back to pi |
| 2026-10-19 | `1f2a3d7` | Claude Code restored |
| 2026-10-23 | `531086b` | "claudify pi" |
| 2026-10-30 | `0a9b81d` | "welcome back opencode" |
| 2026-11-03 | `895fb0c` | Claude Code primary |

The strongest evidence in this repo is a real refutation: GPT-6 Astra could not complete the opto2 TypeScript-to-Rails migration, which is why the setup moved to Opus 5.5 ([note](chatgpt-sol-ultrafast-and-muse-vs-opus.md)).
That one failed task is worth more than any lab's philosophy.

## Refutation conditions

The commitment is Claude Code, Opus 5.5, Sol review, and OpenCode kept working.
Change it only when one of these happens, and treat a new release or a good post as no reason at all:

1. **Task refutation:** Opus fails a real task of yours, a challenger finishes that same task, and this happens twice in one quarter.
2. **Vendor refutation:** a Claude Code quality regression goes unacknowledged for two weeks, or Anthropic restricts something your workflow needs.
3. **Eval refutation:** a challenger beats the default by more than 15 points on at least 100 runs of your own tasks. Smaller gaps on small samples are noise, as Hard12 shows.

These thresholds are my judgment, not measured values, and they should be revised at most once a quarter.

## Gaps in the current setup

Fixed in tracked config on 2026-11-06, with the veto and the default taking effect once OpenCode is applied and its service restarted:

- **OpenCode had no bash veto.** The new `guardrails` plugin runs `block-dangerous-bash.sh` on OpenCode's `shell` tool. In real runs, `git add -p` ran on both Sol and Opus before the fix and was refused on both after it.
- **OpenCode's default contradicted `CONTEXT.md`.** The default is back to `openai/gpt-6.1-sol-fast`.
- **`sol-loop` could settle a dispute without a test.** A disputed blocker or should now needs a test or repro when one can exercise the claim.

Still open:

- **OpenCode has no generated-file veto.** Claude Code, Codex, and pi block hand edits to generated files, and the `guardrails` plugin covers only the shell.
- **`sol-loop` makes a claim the evidence does not settle.** It says "Sol is a different model family, so it catches what you miss", but the studies above disagree on whether family or freshness does the work.
- **Claude Code has no OS sandbox configured.** `settings.json` uses `bypassPermissions`, so the two `PreToolUse` hooks are the hard gate.

## Limits

- No study measures error-correction support directly, so the harness ranking is inference from features.
- No harness was tested at runtime for this note.
- Portability of your criticism machinery is a crude line-count estimate of about two-thirds.
- `jev_decide` chose this recommendation at 0.78, but I wrote its evidence and one requirement ("without new porting work") favours the incumbent.
- A Claude model recommending Claude should be discounted accordingly, and the refutation conditions exist so you do not have to take my word for it.
