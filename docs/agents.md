# AI Agent Harnesses

Codex is the primary harness, with Claude Code for Opus and Fable and Antigravity CLI for Gemini Neon.
See [CONTEXT.md](../CONTEXT.md) for the terminology used here, [docs/skills.md](skills.md) for the generated skill catalog, and [mcp/README.md](../mcp/README.md) for MCP server details.

## Harness roles

| Harness | Role | Tracked package | Notes |
| --- | --- | --- | --- |
| **Codex** | Primary harness | `stow/codex/` | Owns the canonical global `AGENTS.md`, shared skills, and guardrail hook scripts. |
| **Claude Code** | Native Anthropic route | `stow/claude/` | Runs Opus and Fable natively (`claude-opus-5-5` in Council; `claude --model fable` resolved to `claude-fable-5-2` in local checks). |
| **Antigravity CLI** | Native Gemini route | Machine-local | Use `gemini-4-neon-high` for Gemini 4 Neon High (verify with `agy models`). |

Pi and OpenCode are retired: their tracked configurations live under [`old/stow/pi/`](../old/stow/pi/) and [`old/stow/opencode/`](../old/stow/opencode/), and retired Pi tests live under [`old/test/`](../old/test/).
Both harnesses were uninstalled on the current Mac (not verified on separate remote hosts such as `agentbox`), local session and state data were preserved, and default bootstrap, Stow, and CI no longer install or require either harness.

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
Council does not automatically substitute Fable for Opus or swap in another harness if a reviewer fails or is unavailable.
Use your existing sign-ins in the three CLIs, and check `agy models` for the exact Neon model.
Google documents [consumer-plan limits on using Antigravity from other agents](https://antigravity.google/docs/faq/).
Prefix the arguments with a minimum score (for example, `$council 9.5 review this diff`) to require that score from every reviewer.
Council repeats the review after authorized fixes.

### pstack in Codex

[Open Pstack](https://github.com/ericlitman/open-pstack) provides Poteto Mode, Arena, and Interrogate as a native Codex plugin.
Codex hosts this plugin directly.
To install it on another machine:

```bash
codex plugin marketplace add https://github.com/ericlitman/open-pstack --ref main
codex plugin add pstack@open-pstack
```

The [Codex model sheet](../stow/codex/.codex/pstack-models.md) assigns GPT-6.2 Sol High and Opus 5.5 High to Arena candidate work, Architect, and Interrogate.
GPT-6.2 Sol High runs as a native Codex subagent under the parent Codex session's sandbox.
Opus 5.5 High runs in Claude Code with its writer sandbox, and the runner explicitly denies writes to shared Git state.
A worktree is a separate checkout and does not itself restrict filesystem access.

Gemini 4 Neon High is pinned through the signed-in Antigravity CLI as `gemini-4-neon-high`.
It handles read-only exploration and is Arena's first cross-judge.
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

- **Codex:** uses the shared `jev` skill and a Codex-owned, pinned Jev MCP registration in `stow/codex/.codex/config.toml` via Code Mode.
  Fetch and screen external text in the same Code Mode call before returning it to the model.

- **Claude Code:** the `jev-checks` mod runs the shared Jev logic from the generated copy at `stow/claude/.claude/mods/jev-checks/hooks/jev-shared.ts`.
  Edit [`mcp/shared/jev.ts`](../mcp/shared/jev.ts), run `./scripts/harness_sync.sh`, then verify with `claude plugin test <mod folder>`.

### xAI search (`xai_search`)

Codex exposes `xai_search` through [Grok Build or the xAI Responses API](../mcp/README.md#codex).
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
- **Terminal:** in Herdr, press `Ctrl-a Shift-o` to review a folder or `Ctrl-a Shift-l` to review an agent's last reply; in Rex, run `plannotator-tui` directly.
