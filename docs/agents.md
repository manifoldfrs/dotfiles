# AI Agent Harnesses

Codex is the primary harness, with Claude Code for Opus and Fable and Antigravity CLI for Gemini Neon.
See [CONTEXT.md](../CONTEXT.md) for the terminology used here, [docs/skills.md](skills.md) for the generated skill catalog, and [mcp/README.md](../mcp/README.md) for MCP server details.

## Harness roles

| Harness | Role | Tracked package | Notes |
| --- | --- | --- | --- |
| **Codex** | Primary harness | `stow/codex/` | Owns the canonical global `AGENTS.md`, shared skills, and guardrail hook scripts. |
| **Claude Code** | Native Anthropic route | `stow/claude/` | Runs Opus in Council. Use `claude --model fable` when you want Fable. |
| **Antigravity CLI** | Native Gemini route | `stow/antigravity/` | Use `gemini-4-neon-high` for Neon. Interactive `agy` passes `--dangerously-skip-permissions`; `~/.gemini/antigravity-cli/settings.json` stays machine-local. |

The retired Pi and OpenCode configurations are preserved under [`old/stow/`](../old/stow/).

## Codex (primary harness)

The tracked template (`stow/codex/.codex/config.toml`) defaults to GPT-6.2 Sol at medium reasoning.
On macOS and Linux, `scripts/stow.sh apply` seeds a missing `~/.codex/config.toml` from the template, preserves existing local configs, and converts legacy Stow links to local copies.
Codex saves reasoning changes and other preferences to the machine-local file.
To restore approval prompts and workspace isolation for a session:

```bash
codex -a on-request -s workspace-write
```

The terminal footer shows the percentage of the context window used once token usage is available.
Run `/statusline` in Codex to customize the footer.

### Resuming sessions

| Command | Behavior |
| --- | --- |
| `codex resume --last` | Resume the most recent interactive session for the current directory. |
| `codex resume --last --all` | Resume the most recent interactive session across directories. |
| `codex resume` | Open the session picker for the current directory. |

### Handing off a long task

If you expect a context reset or want to hand off an unfinished task, ask for a short checkpoint in the existing task notes or the thread.

> Record the current goal, the latest correction and any earlier constraints that still apply, the last check that actually ran and its result, and the next check to run.

### Council

Run `$council <review scope>` in Codex to ask Claude Code, Codex CLI, and Antigravity CLI for independent reviews of the same brief.
Council selects `claude-opus-5-5`, `gpt-6.2-sol`, and `gemini-4-neon-high`, all at high reasoning effort.
Use your existing sign-ins in the three CLIs, and check `agy models` for the exact Neon model.
Google documents [consumer-plan limits on using Antigravity from other agents](https://antigravity.google/docs/faq/).
Prefix the arguments with a minimum score (for example, `$council 9.5 review this diff`) to require that score from every reviewer.
Council repeats the review after authorized fixes.

### pstack in Codex and Claude Code

See the [Open Pstack skill catalog](pstack-skills.md) for the installed skills and their descriptions.

[Open Pstack](https://github.com/ericlitman/open-pstack) provides Poteto Mode, Arena, and Interrogate as a native Codex plugin.
To install the Codex plugin on another machine:

```bash
codex plugin marketplace add https://github.com/ericlitman/open-pstack --ref main
codex plugin add pstack@open-pstack
```

Claude Code uses the native plugin from the same marketplace.
To install it:

```bash
claude plugin marketplace add ericlitman/open-pstack --scope user
claude plugin install pstack@open-pstack --scope user
```

In Codex, run the pstack PR watcher through `bash "${CODEX_HOME:-$HOME/.codex}/bin/pstack_watch_pr.sh" <installed-watch-pr-path> [options]`.
The launcher keeps Bun dependencies in a versioned `open-pstack/poteto-mode` user cache so the pstack startup hook retains its trust.

The [Codex model sheet](../stow/codex/.codex/pstack-models.md) assigns GPT-6.2 Sol High and Opus 5.5 High to Arena candidate work, Architect, and Interrogate.
GPT-6.2 Sol High runs as a native Codex subagent under the parent Codex session's sandbox.
Opus 5.5 High runs in Claude Code with its writer sandbox, and the runner explicitly denies writes to shared Git state.
A worktree is a separate checkout and does not itself restrict filesystem access.

Gemini 4 Neon High is pinned through the signed-in Antigravity CLI as `gemini-4-neon-high`.
It handles read-only exploration, fills the `judgment and prose` role for multi-phase planning, and is Arena's first cross-judge.
Open Pstack's Antigravity adapter has read-only and full-access writer modes.
Its writer mode cannot confine writes to the assigned worktree, including shared Git state.
The model sheet gives Neon read-only roles so the full-access writer option stays unused.

The exact Sol and Neon model IDs passed live probes and are outside the Open Pstack 1.21.0 setup wizard catalog.
Keep the sheet and its marked copy in Codex's global `AGENTS.md` in sync.
Start a fresh Codex task to pick up model sheet changes.

## Shared rules and skills

### Global rules

Codex owns the canonical global rules at `stow/codex/.codex/AGENTS.md`.
The Claude Code Stow package links to that file.
Reload or restart active sessions after editing them.

### Shared skill catalog

Shared skills live in `stow/codex/skills/shared/`.
`scripts/stow.sh` links each skill folder into `~/.agents/skills/` (read by Codex) and `~/.claude/skills/` (read by Claude Code).
Stow apply repairs old shared skill links that still point to the retired Pi package.

Use `$bro` to simplify the previous reply in the current chat.
In Codex, use the standalone `$bro-neon` skill to gather context, ask Gemini 4 Neon Medium through the signed-in Antigravity CLI, and get the explanation back in the current chat.

- Ownership and archive exclusions are recorded in `stow/codex/skills/shared/.skill-sources.tsv`; see [CONTEXT.md](../CONTEXT.md) for the ownership terms.
- `local` skills are never overwritten by sync, and `excluded` skills are never restored.
- Plannotator's own skills are excluded because its installer owns them (run by bootstrap).
- A new machine gets the tracked snapshot from `./scripts/stow.sh apply` without fetching upstream catalogs.
- [docs/skills.md](skills.md) is generated from each `SKILL.md` by `./scripts/skill_catalog.sh`.

```bash
./scripts/update_agent_skills.sh --check   # report drift from upstream catalogs
./scripts/update_agent_skills.sh --review  # open a Plannotator review of the diff
./scripts/update_agent_skills.sh --sync    # update the tracked snapshot (uncommitted)
./scripts/skill_catalog.sh                 # regenerate docs/skills.md
```

`scripts/validate-dotfiles.sh` checks that `docs/skills.md` is up to date.

## Extensions, mods, and shared integrations

### Jev judgments

- **Codex:** uses the shared `jev` skill and a Codex-owned, pinned Jev MCP registration in Code Mode.
  Fetch and screen external text in the same Code Mode call before returning it to the model.

- **Claude Code:** the `jev-checks` mod runs the shared Jev logic from a generated copy within the mod.
  Edit [`mcp/shared/jev.ts`](../mcp/shared/jev.ts), run `./scripts/harness_sync.sh`, then verify with `claude plugin test <mod folder>`.

### xAI search (`xai_search`)

Codex exposes `xai_search` through [Grok Build or the xAI Responses API](../mcp/README.md#codex).
Claude Code can [register the same server](../mcp/README.md#claude-code).
Without `XAI_API_KEY`, it uses the Grok Build CLI's own sign-in.
Set `XAI_API_KEY` in Codex's launch environment to use exact search filters and output-token caps through the API.
The request and response code lives in `mcp/xai-search/`.

### Browser and desktop automation

- **`agent-browser`:** used for browser work in an isolated profile (even when a site requires sign-in); agents never attach to your personal browser profile.
  Installed via `npm-global-packages.txt`, or manually with `npm install -g agent-browser` (and `agent-browser install` if Chrome is unavailable).
  The shared `agent-browser` skill loads the CLI's version-matched core guide, and `modern-web-guidance` comes from [agent-browser v0.43.0](https://github.com/vercel-labs/agent-browser/tree/1cc19526f3641c8543d55aa6700e7c55b37ac356) (Apache-2.0).
- **`cua-driver`:** used for native macOS apps and desktop automation (installed via `Brewfile`).
  Grant Accessibility and Screen Recording permissions with `cua-driver permissions grant`.

### Claude Code mods

- **`codemode`:** runs JavaScript tool calls in Claude Code.
  Scripts run in a Node child under `--permission` and call tools through `$.tool.call` so hooks and permission checks still apply.
  Test with `claude plugin test` and `node --test runner/runner.test.mjs` inside the mod folder.
- **`bold-color`:** draws bold reply text in Tokyo Night blue.
- **`tool-row-color`:** keeps running and folded tool rows in the main text color instead of grey.
- **`session-relaunch`:** works with the `claude` shell wrapper to resume sessions cleanly.

## Guardrails

Codex's `stow/codex/.codex/hooks.json` runs the shared scripts in `stow/codex/.codex/hooks/` to block dangerous shell commands and manual edits to generated files.
On first run on either macOS or Linux (`agentbox`), verify `hooks = true` under `[features]` in the local `~/.codex/config.toml` and review and trust the expected hooks via `/hooks`.

- **Claude Code** links to those scripts from its hooks directory.
- **Antigravity CLI** links to those scripts through `stow/antigravity/.gemini/config/hooks.json` and the `agy-pretool-guardrail.sh` adapter, which translates Antigravity's `PreToolUse` JSON contract and fails closed on errors.
  Interactive `agy` sessions in Bash and Fish pass `--dangerously-skip-permissions` automatically unless you invoke a subcommand (like `agy models`) or pass `--mode` or `--sandbox`.
- **Rails rules:** schema and lockfile edits are blocked, destructive `db:` tasks require `RAILS_ENV=test`, and production Rails commands are blocked.

Test the shell rules with:

```bash
bash test/agent_guardrails_test.sh "$PWD"
```

## Planning and review (Plannotator)

Plans are project Markdown files and are implemented only after explicit approval.

- **Codex:** Plannotator reviews plans through the `Stop` hook in `stow/codex/.codex/hooks.json`.
  Keep the Plannotator marketplace plugin disabled in Codex because its Claude Code hook manifest uses the unsupported `modules` field.
  On a fresh `agentbox`, install Plannotator ([Phase 8](plans/remote-agent-server.md#phase-8-harnesses-and-auth)) and set `PLANNOTATOR_REMOTE=1` ([Phase 7](plans/remote-agent-server.md#phase-7-secrets)) before relying on that `Stop` hook.
- **Rex:** run `plannotator-tui` directly.

## HTML artifact reviews

Ask Codex to use `$artifact-review` for an HTML plan, side-by-side design comparison, PR or architecture walkthrough, or document.
The skill writes a standalone HTML file and launches the viewer from the Codex thread that will read your comments.
The `bin` Stow package provides the command and the `codex` package provides the skill.

To try the included example from this checkout, run:

```bash
stow/bin/.local/bin/artifact-review stow/bin/.local/share/artifact-review/example.html
```

**Annotate** starts on, so you can select text or click an element right away.
Click **Annotate** to interact with the page, or use **General note** for feedback on the whole document.
Save each comment, then choose **Send feedback** when you finish the review.
When opened by the skill, sending feedback queues a new message in the same Codex thread.
An open thread starts processing the feedback as soon as it is idle.
If you closed the thread, Codex processes the message when you reopen it.
Saved comments survive a reload of the review tab.
The command prints a single JSON result with the file path, its SHA-256 revision, and the submitted comments.
Each anchored comment includes its quote and selector, plus the author-provided `data-review-id` and `data-review-source` when present.
**Close review** returns a dismissal, and Ctrl-C stops the command if you already closed the browser tab.

The viewer reads a snapshot of one local HTML file.
It supports inline diagrams, embedded images, and native HTML controls such as expandable details.
Use a new run to review an edited file.
The review iframe disables artifact scripts and external assets.

The skill saves generated HTML and queued feedback under `${TMPDIR:-/tmp}/agent-artifacts/artifact-review/<thread-id>/`.
`artifact-review workspace` prints the current thread's absolute path.
Codex's `SessionEnd` hook removes that temporary workspace when the session ends.
Codex can also end an idle, unattached session after 30 minutes.
The hook keeps workspaces with queued feedback until Codex handles it.
Use `artifact-review clean` to remove the current workspace sooner.
The example in this repository and files you saved elsewhere remain outside the workspace.

On a remote Rex host, run `artifact-review --no-open FILE.html` and forward the port from the printed URL.
Keep its full path when forwarding so the browser opens the same review session.
For example, if the review URL uses port 45678 and path `/SESSION/`, run this on your Mac and replace both values:

```bash
rex -S agentbox forward open 'http://127.0.0.1:45678/SESSION/'
```
