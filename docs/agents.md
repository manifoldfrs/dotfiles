# AI Agent Harnesses

This repository configures four coding-agent harnesses around one set of global rules, shared skills, shell guardrails, and MCP definitions.
See [CONTEXT.md](../CONTEXT.md) for the terminology used here, [docs/skills.md](skills.md) for the generated skill catalog, and [mcp/README.md](../mcp/README.md) for MCP server details.

## Harness roles

| Harness | Role | Tracked package | Notes |
| --- | --- | --- | --- |
| **Codex** | Primary harness | `stow/codex/` | Owns the canonical global `AGENTS.md`, shared skills, and guardrail hook scripts. |
| **Pi** | Worker | `stow/pi/` | Used for non-GPT models and Pi-native workflows (direct or via Codex's `$pi-skill` bridge); owns the canonical `mcp.json`. |
| **Claude Code** | Standalone | `stow/claude/` | Configured for direct use with its own mods; links rules and hooks to `stow/codex/`. |
| **OpenCode 2** | Standalone | `stow/opencode/` | Configured for direct use; links rules to `stow/codex/` and receives generated MCP and skill command files. |

Codex does not fall back to OpenCode or silently substitute a model when a route or provider fails.

## Codex (primary harness)

The tracked macOS configuration (`stow/codex/.codex/config.toml`) uses GPT-6.2 Sol at medium reasoning with Ultrafast.
On Linux (`agentbox`), `scripts/stow.sh` skips `.codex/config.toml` so Codex keeps its own machine-local config while still linking `AGENTS.md`, skills, hooks, and themes.
The tracked macOS configuration disables routine command approvals and the filesystem sandbox while keeping the shared guardrail hooks enabled.
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

## Pi (worker harness)

Pi defaults to `openai/gpt-6.2-sol-ultrafast` at medium thinking (`stow/pi/.pi/agent/settings.json`).
The `codex-fast-variants` extension adds `-fast` and `-ultrafast` variants inheriting each base model's context window, while `stow/pi/.pi/agent/models.json` overrides context windows for `gpt-6.1-sol*` (500K) and `gpt-6-astra*` (272K).
If a Pi model is missing after sign-in, run `pi update --models` and start a new Pi session.

### Running Pi from Codex (`$pi-skill`)

In Codex, `$pi-skill` lists the skills Pi loads in the current project or runs one in a fresh Pi worker session:

```text
$pi-skill council review the staged changes only
$pi-skill pistack-interrogate review this design
```

- The bridge reads the worker's live Pi skill catalog rather than a mirrored list.
- It passes only the scoped brief, not the Codex conversation.
- To run a specific model, ask Codex to use the bridge's `model <provider/model> '<brief>'` command.
- Missing routes or provider errors are reported without switching models or harnesses.
- Workflows that require an interactive Pi UI must be continued in Pi directly.

#### Worker setup (`pi-worker.json`)

The bridge requires Node.js and a machine-local `pi-worker.json` in `$CODEX_HOME` (normally `~/.codex`), pointing to the intended Pi executable and an existing private state directory separate from `~/.pi/agent`:

```json
{
  "executable": "/absolute/path/to/pi",
  "agentDir": "/absolute/path/to/private-pi-worker-state",
  "timeoutSeconds": 180
}
```

1. Initialize and authenticate the worker directory by launching the same Pi executable with `PI_CODING_AGENT_DIR` set to `agentDir`.
2. Configure the extensions and skills the worker should load; a new directory does not inherit `~/.pi/agent` or its sign-ins.
   Do not symlink the auth store back to `~/.pi/agent`.
3. To expose `council` to the worker, link `skills/council` inside `agentDir` to `stow/codex/skills/council/` in this checkout.
4. Allow `agentDir` as a writable root in the Codex session (for example, `codex --add-dir /absolute/path/to/private-pi-worker-state`) and permit network access when needed without disabling the sandbox.

The launcher prints a job ID; stop that process group explicitly with its `cancel <job-id>` command.
The configured timeout also stops the process group, though pressing Stop in Codex is not yet wired to `cancel`.

### Gemini 4 Neon in Pi

Install the [Antigravity CLI](https://antigravity.google/docs/getting-started/), run `agy`, and sign in with an account that has access to Neon.
If the pinned bridge is not already installed, run `pi install npm:@tian.zuo/pi-antigravity@0.12.1`, then start a new Pi session and choose `antigravity/gemini-4-neon` in `/model`.
The bridge uses the local `agy` login, and Pi tools mode routes workspace tool calls through Pi's permission hooks.
Note that [Google does not support wrapping `agy` in a third-party coding agent on consumer plans](https://antigravity.google/docs/faq/).

### pstack in Pi

Pi loads Lauren Tan's pstack through the published [`pi-pstack-adapter`](https://github.com/elderfo/pi-pstack-adapter).
On first run, the adapter asks before fetching its certified upstream snapshot.

- `/pistack-status` shows the active release and capabilities.
- `/pistack-check <skill>` verifies prerequisites for a skill.
- `/skill:pistack-poteto-mode <task>` starts a playbook and turns on sticky Poteto Mode for follow-up requests in that Pi session.
- New sessions start with sticky mode off; manage it with `/pistack-sticky on`, `/pistack-sticky off`, or `/pistack-sticky status`.

Arena's candidates and judge pool and Interrogate's reviewers use Opus 5.5, Sol 6.2, and Gemini 4 Neon at `high`, configured in [`pi-pstack-adapter.json`](../stow/pi/.pi/agent/pi-pstack-adapter.json).
Arena picks an eligible judge from a different vendor than the parent model.
Playbooks do not authorize delegation, commits, pushes, PRs, merges, or live changes.
Retired workflows are archived in [`old/skills/`](../old/skills/); other harnesses receive the retained shared skill catalog, not the Pi adapter.

### PR writing with Gemini (`neon-pr`)

Run [`/skill:neon-pr`](../stow/pi/.pi/agent/skills/neon-pr/SKILL.md) in Pi to draft a PR title and body with Gemini 4 Neon.
The skill also applies to the writing step of pstack's Opening a PR playbook; Pi asks first if drafting delegation is not already authorized.
Gemini follows pstack's writing rules without changing its model roles, and Pi only publishes the copy when authorized.

### Council

Run `$council <review scope>` from Codex for independent reviews from Opus 5.5, Sol 6.2, and Gemini 4 Neon at `high` thinking.
The dedicated Pi worker runs Opus and Sol, and the signed-in `agy` CLI runs Neon directly.
When invoking `/skill:council` from interactive Pi, use the same reviewer routes.
Prefix the arguments with a minimum score (for example, `/skill:council 9.5 review this diff`) to require that score from every reviewer.
Council repeats the review after authorized fixes, whereas Interrogate reports failures it can reproduce.
[Council](../stow/codex/skills/council/SKILL.md) lives in the Codex package, and Pi's Stow package links to that copy.

## Shared rules and skills

### Global rules

Codex owns the canonical global rules at `stow/codex/.codex/AGENTS.md`.
The Pi, Claude Code, and OpenCode Stow packages expose that file through relative symlinks so all four harnesses read the same rules.
Reload or restart active sessions after editing them.

### Shared skill catalog

Shared skills live in `stow/codex/skills/shared/`.
`scripts/stow.sh` links each skill folder into `~/.agents/skills/` (read by Pi, Codex, and OpenCode) and `~/.claude/skills/` (read by Claude Code).
Existing links through `stow/pi/skills` continue to resolve and are repointed on the next Stow apply.

- Ownership and archive exclusions are recorded in `stow/codex/skills/shared/.skill-sources.tsv`; see [CONTEXT.md](../CONTEXT.md) for the ownership terms.
- `local` skills are never overwritten by sync, and `excluded` skills are never restored.
- Plannotator's own skills are excluded because its installer owns them (run by bootstrap).
- A new machine gets the tracked snapshot from `./scripts/stow.sh apply` without fetching upstream catalogs.
- [docs/skills.md](skills.md) is generated from each `SKILL.md` by `./scripts/skill_catalog.sh`.
  The same script generates one OpenCode command per skill under `stow/opencode/.config/opencode/commands/` because OpenCode loads skills with `@skill-id` rather than `/skill-id`.

```bash
./scripts/update_agent_skills.sh --check   # report drift from upstream catalogs
./scripts/update_agent_skills.sh --review  # open a Plannotator review of the diff
./scripts/update_agent_skills.sh --sync    # update the tracked snapshot (uncommitted)
./scripts/skill_catalog.sh                 # regenerate docs/skills.md and OpenCode commands
```

`scripts/validate-dotfiles.sh` checks that `docs/skills.md` and the OpenCode skill commands are up to date.

## Extensions, mods, and shared integrations

### Jev judgments

Jev logic is maintained once in `stow/pi/.pi/agent/extensions/jev-guardrails/shared.ts`:

- **Pi (`jev-guardrails`):** screens web results, audits edit scope, fact-checks answers, and adds the `jev_pipeline` tool.
  It calls the `jev` server in Pi's `mcp.json` over stdio because Pi's extension loader does not expose its MCP client.
- **Claude Code (`jev-checks` mod):** runs the same checks from `stow/claude/.claude/mods/`.
  Because Claude Code only loads mod files whose real path is inside the mod, `hooks/jev-shared.ts` is generated from Pi's file by `./scripts/harness_sync.sh`.
  Test with `claude plugin test <mod folder>`.
- **OpenCode (`jev` plugin):** imports Pi's `shared.ts` directly from `stow/opencode/.config/opencode/plugins/jev/`.
  OpenCode bundles its runtime `effect` package, so `package.json` pins matching versions for tests and typechecks only; failed checks log to `~/.local/share/opencode/log/jev-plugin.log`.
- **Codex:** uses the shared `jev` skill and Jev MCP server (via Code Mode) rather than an automatic hook extension.

```bash
(cd stow/opencode/.config/opencode/plugins/jev && pnpm install --frozen-lockfile && pnpm test && pnpm run check)
```

### xAI search (`xai_search`)

Claude Code's `xai-search` mod, OpenCode's `xai-search` plugin, and Codex's `xai-search` MCP server all expose `xai_search` through Pi's guarded runner.
They share the tool definition in `stow/pi/.pi/agent/extensions/xai-search/xai-shared.ts`, and `./scripts/harness_sync.sh` copies it into the Claude Code mod.
Codex exposes `xai_search` both directly and through Code Mode, reusing Pi's existing SuperGrok or X Premium login (`/login xai`) with no separate API key.

```bash
(cd stow/opencode/.config/opencode/plugins/xai-search && pnpm install --frozen-lockfile && pnpm test && pnpm run check)
```

### Browser and desktop automation

- **`agent-browser`:** used for browser work in an isolated profile (even when a site requires sign-in); agents never attach to your personal browser profile.
  Installed via `npm-global-packages.txt`, or manually with `npm install -g agent-browser` (and `agent-browser install` if Chrome is unavailable).
  The shared `agent-browser` skill loads the CLI's version-matched core guide, and `modern-web-guidance` comes from [agent-browser v0.43.0](https://github.com/vercel-labs/agent-browser/tree/1cc19526f3641c8543d55aa6700e7c55b37ac356) (Apache-2.0).
- **`cua-driver`:** used for native macOS apps and desktop automation (installed via `Brewfile`).
  Grant Accessibility and Screen Recording permissions with `cua-driver permissions grant`.

### Pi-specific extensions and UI

- **UI theme:** Pi uses its built-in interface with the `tokyonight-frsh` palette.
  The `claude-style-ui`, `frsh-header`, and `signal-deck` extensions remain tracked but disabled in Pi's settings.
- **`pi-cloak`:** masks secret values (`.env`, `.vars`, `local.bash`, auth and credential files) returned by Pi's `read` tool using the rules in `stow/pi/.pi/agent/cloak.json`.
  Run `/cloak-status` to inspect active rules; shell commands such as `cat` are not covered.
- **`/save-md <name>`:** saves the last reply as `<name>.md` (adapted, like `pi-cloak`, from Dillon Mulroy's dotfiles).
- **Session helpers:** `skill-toast` and `inline-skills` notify when a skill loads; `/update` and `/restart` resume the session through the `pi` shell wrapper.

### Claude Code mods

- **`codemode`:** ports Pi's codemode to Claude Code.
  Scripts run in a Node child under `--permission` and call tools through `$.tool.call` so hooks and permission checks still apply.
  Test with `claude plugin test` and `node --test runner/runner.test.mjs` inside the mod folder.
- **`bold-color`:** draws bold reply text in Tokyo Night blue.
- **`tool-row-color`:** keeps running and folded tool rows in the main text color instead of grey.
- **`session-relaunch`:** works with the `claude` shell wrapper to resume sessions cleanly.

## Guardrails

Codex's `stow/codex/.codex/hooks.json` runs the shared scripts in `stow/codex/.codex/hooks/` to block dangerous shell commands and manual edits to generated files.
On first run on either macOS or Linux (`agentbox`), review and trust the expected hooks in Codex via `/hooks` (tracked trust entries are path-specific, and on Linux `stow.sh` skips `config.toml`, so also verify `hooks = true` under `[features]` in machine-local `~/.codex/config.toml`).

- **Claude Code** links to those scripts from its hooks directory.
- **Pi** runs them via `agent-guardrails` through compatibility links in `~/.pi/agent/guardrails/` (a `~/.pi/agent/hooks/` directory triggers a deprecation prompt).
- **OpenCode** uses the same shell-command script in its standalone `guardrails` plugin, without the generated-file rules.
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
- **Pi:** uses the native Plannotator integration to open a review and send feedback straight to the active session.
- **Terminal:** in Herdr, press `Ctrl-a Shift-o` to review a folder or `Ctrl-a Shift-l` to review an agent's last reply; in Rex, run `plannotator-tui` directly.

## Debugging Pi requests

```bash
pi-log   # launch Pi with the request logger enabled for that process only
```

Logs are written to `~/.pi/agent/logs/requests/` with owner-only permissions.
They contain full prompts and tool results, so review them before sharing and delete them when finished:

```bash
rm -rf ~/.pi/agent/logs/requests
```
