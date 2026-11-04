# Why Claude reads as unclear in OpenCode

Researched 2026-11-03.

## Conclusion

There are two separate causes, and the model is neither of them.
Confusing replies trace to the OpenCode Jev answer check, which makes the model reply to a message the user cannot read.
Tiring replies trace at least partly to the OpenCode UI: the same text read worse there than in Claude Code when the user compared them.
The complaint counts below only measure confusion, so they say nothing about how pleasant a reply is to read.

## Evidence

### Same model, nearly the same prompt

OpenCode's `claude-agent` provider runs the real `claude` binary.
The running process used `--effort=medium --model=opus --tools= --setting-sources= --strict-mcp-config`.
The provider uses the `claude_code` system prompt preset and appends one `runtime_info` line.
The stored request for the session shows `claude-opus-5-5` at `medium` on all 79 API requests.

A diff of the stored system prompts found no tone or writing instruction that only one side has.
The native prompt adds Chrome and memory sections, and OpenCode adds Code Mode, the skill list, and the rules files.
The OpenCode prompt is about 61 KB and the sampled native prompt about 24 KB, though native sessions deliver rules in a separate reminder message.

### Effort does not explain it

Anthropic documents `medium` as the Opus 5.5 default ([effort docs](https://platform.claude.com/docs/en/build-with-claude/effort)).
743 of 884 native Opus 5.5 replies also ran at `medium`, even though `~/.claude/settings.json` sets `effortLevel` to `high`.

### Complaints follow Jev send-backs

Local transcripts, Opus 5.5 only, counting clarity complaints such as `/bro` and `plain-english` in the next user message.

| Group | Replies | Complaints | Rate |
| --- | --- | --- | --- |
| Native Claude Code | 884 | 18 | 2.0% |
| OpenCode, all | 94 | 9 | 9.6% |
| OpenCode, reply to a normal message | 39 | 1 | 2.6% |
| OpenCode, reply to a Jev send-back | 20 | 6 | 30% |

The send-back versus normal difference has a one-sided Fisher p of about 0.005.
The rows use two slightly different matchers, so the OpenCode rows do not sum exactly.
The sample is small, and 5 of the 8 complaints in the second count came from one session.
Complaints were found by pattern match, not by reading each one.
Context size showed no clean trend: 1.6%, 1.2%, 4.5%, and 2.9% across rising context bands.

### Mechanism

`stow/opencode/.config/opencode/plugins/jev/index.ts` sends the check result through `ctx.session.synthetic` with no `description`.
The model receives it as a user message.
The OpenCode TUI code shows a synthetic message's `description`, falling back to an empty string, so the flag text appears not to be displayed.
This comes from reading the bundled TUI code and was not confirmed by a live test.

The send-back also tells the model to correct each flagged item and then give the user the corrected answer.
The reply therefore becomes an audit response, with phrases such as "the value flag" and "this send-back" that have no meaning to a reader who never saw the flags.
Failed checks caused this too: 15 of the 27 send-backs only reported that the check itself had failed.

The plugin landed on 2026-10-30, which fits the complaint that this started lately.

## Outside sources

Anthropic says Opus 5.5 improved clarity and follows writing rules ([announcement](https://www.anthropic.com/claude-opus-5-5)).
That is a vendor claim, and one [Hacker News comment](https://news.ycombinator.com/item?id=49875283) still reports long, overcomplicated explanations.
No first-party source links OpenCode to worse writing.

### Rendering

The user had OpenCode repeat a Claude Code reply word for word and found it worse to read, which is one person's reading rather than a measurement.
In that screenshot, lines run about 130 characters, with muted body text and orange bold.
The [`cli.json` schema](https://opencode.ai/v2/cli.json) has no setting for text width.
It does offer `theme`, `session.sidebar`, and `session.markdown`.

## Recommendation

Try a different theme and a narrower pane in OpenCode, then compare against Claude Code.
Fix the send-back whichever harness stays.
Stop sending failed-check notices to the model, and write them to the log instead.
Give real flags a `description` so the user sees them, and tell the model to answer for a reader who has not seen the flags.
Compare the complaint rate over the next few sessions.
