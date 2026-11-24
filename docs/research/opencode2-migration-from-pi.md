# Research: OpenCode 2 migration from this Pi setup

## Summary

OpenCode 2 is stable.
The current first-party update endpoint reports the active `latest` release as `2.0.11` from `@opencode/cli`, and npm maps the `latest` tag to that same stable version.
The current installation choices are:

```bash
curl -fsSL https://opencode.ai/v2/install | bash
# or
npm install -g @opencode/cli@latest

opencode --version
```

The stable package exposes `opencode` as the primary executable and retains `opencode2` as a compatibility alias.
The older `/v2/docs` migration page and old `@opencode-ai/cli` metadata still describe the beta-era side-by-side arrangement, so they must not be treated as current installation guidance.
The safest path is to keep Pi working, capture a safety backup of the shared `~/.config/opencode` tree, migrate the existing OpenCode configuration, and then separately port the known breaking areas: the plugin API, server API consumers, and terminal-client configuration.
This repository is already well positioned for skills because OpenCode 2 directly discovers `~/.agents/skills`, but its Pi extensions, prompt templates, agent packages, and sessions do not have a verified automatic migration path.

## Findings

1. **Claim:** OpenCode 2 is now the stable release, not a side-by-side beta.
   **Sources:** [OpenCode V2 installer](https://opencode.ai/v2/install), [current CLI release endpoint](https://opencode.ai/update/api/latest/cli/npm), [stable npm package](https://www.npmjs.com/package/@opencode/cli).
   **Support:** The release endpoint identifies the active `latest` channel as stable version `2.0.11` from `@opencode/cli`; npm's `latest` tag matches; and the V2 installer installs `opencode` while creating an `opencode2` compatibility shim.
   **Confidence:** High.
   **Practical implication:** Install with `curl -fsSL https://opencode.ai/v2/install | bash` or `npm install -g @opencode/cli@latest`, then verify `opencode --version` reports a 2.x release.
   The old `@opencode-ai/cli@beta` command is obsolete.

2. **Claim:** Stable V2 can replace the `opencode` executable and shares the existing configuration path.
   **Sources:** [OpenCode V2 installer](https://opencode.ai/v2/install), [V1 migration guide](https://opencode.ai/v2/docs/migrate-v1/), [`stow/opencode/.config/opencode/opencode.jsonc`](../../stow/opencode/.config/opencode/opencode.jsonc), [`stow/opencode/.config/opencode/tui.json`](../../stow/opencode/.config/opencode/tui.json).
   **Support:** The current installer uses `APP=opencode`, installs into `~/.opencode/bin/opencode`, and adds an `opencode2` compatibility shim; configuration remains under `~/.config/opencode`.
   **Researcher inference:** Running the stable installer can replace the currently resolved V1 executable rather than preserving independent V1 and V2 commands.
   **Confidence:** High.
   **Recommended safety sequence:** Record `command -v opencode` and `opencode --version`, capture a timestamped copy of `~/.config/opencode`, keep the tracked Stow source unchanged during the first launch, and inspect migration-produced changes before capturing intentional V2 sources.

3. **Claim:** The current OpenCode configuration has concrete V2 migration work in the config, MCP, CLI, and plugin categories.
   **Sources:** [V2 configuration](https://opencode.ai/v2/docs/config/), [V1 migration guide](https://opencode.ai/v2/docs/migrate-v1/), [V2 CLI configuration](https://opencode.ai/v2/docs/cli/config/).
   **Support:** Direct evidence identifies V2-native `providers`, `mcp.servers`, and `compaction.keep.tokens` / `compaction.keep.buffer`; it also says `tui.json` migrates to global `cli.json`.
   **Repository evidence:** The tracked config currently uses singular `provider`, top-level `mcp`, and `tui.json`; it has no explicit compaction settings.
   **Confidence:** High.
   **Action:** Prefer the official migration/normalization over a speculative hand conversion, then verify the resulting provider model override (`textVerbosity`), all three MCP servers, and the Tokyo Night theme.

4. **Claim:** Existing `AGENTS.md` content is reusable, but Pi's global file is not automatically the OpenCode global file.
   **Sources:** [V2 instructions](https://opencode.ai/v2/docs/instructions/), [`AGENTS.md`](../../../../../code/personal/dotfiles/AGENTS.md), [`stow/pi/.pi/agent/AGENTS.md`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/AGENTS.md).
   **Support:** Direct evidence says V2 reads project `AGENTS.md` and global `~/.config/opencode/AGENTS.md`; the `instructions` array is currently inactive.
   **Repository evidence:** The project already has `AGENTS.md`, while global rules are tracked only at `stow/pi/.pi/agent/AGENTS.md`; there is no tracked `stow/opencode/.config/opencode/AGENTS.md`.
   **Confidence:** High.
   **Action:** Let the project rules work as-is, and create a deliberate OpenCode global adapter later rather than pointing V2 at Pi's file through the inactive `instructions` setting.

5. **Claim:** The shared skill catalog is the lowest-risk migration category.
   **Sources:** [V2 skills](https://opencode.ai/v2/docs/skills/), [`scripts/stow.sh`](../../../../../code/personal/dotfiles/scripts/stow.sh), [`CONTEXT.md`](../../../../../code/personal/dotfiles/CONTEXT.md).
   **Support:** Direct evidence says V2 directly discovers global `~/.agents/skills`.
   **Repository evidence:** The `agents` Stow package already owns `stow/agents/.agents/skills`, and `scripts/stow.sh` targets `~/.agents/skills` as the shared skill catalog.
   **Confidence:** High.
   **Action:** Do not duplicate skills under the OpenCode config tree; verify discovery in stable `opencode` after applying the existing `agents` package.

6. **Claim:** The tracked OpenCode plugin requires a V2 port and must not be assumed compatible.
   **Sources:** [V2 plugins](https://opencode.ai/v2/docs/build/plugins/), [V1 migration guide](https://opencode.ai/v2/docs/migrate-v1/), [`stow/opencode/.config/opencode/plugin/cb-guards.ts`](../../stow/opencode/.config/opencode/plugin/cb-guards.ts).
   **Support:** Direct evidence says the V2 plugin API breaks from V1 and the server API also breaks.
   **Repository evidence:** `cb-guards.ts` uses the legacy default plugin factory, while V2 requires a `Plugin.define({ id, setup })` default export and discovers local plugins under plural `plugins/` directories.
   **Confidence:** High.
   **Action:** Move the implementation to `stow/opencode/.config/opencode/plugins/cb-guards.ts`, port its hooks to `ctx.tool.hook("execute.before", ...)`, and test both dangerous-command blocking and generated-file blocking before relying on V2 for edits.

7. **Claim:** Pi extensions and extension packages need capability-by-capability replacement, not file copying.
   **Sources:** [V2 plugins](https://opencode.ai/v2/docs/plugins/), [`stow/pi/.pi/agent/settings.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/settings.json), [`stow/pi/.pi/agent/extensions/gpt-verbosity.ts`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/extensions/gpt-verbosity.ts), [`stow/pi/.pi/agent/extensions/code-edit-reminder.ts`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/extensions/code-edit-reminder.ts), [`stow/pi/.pi/agent/extensions/typesafe-ai/index.ts`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/extensions/typesafe-ai/index.ts).
   **Support:** Direct evidence establishes a distinct V2 plugin API.
   **Researcher inference:** Pi's `ExtensionAPI` modules and packages (`pi-mcp-adapter`, `pi-subagents`, `pi-intercom`, `pi-prompt-template-model`, and Plannotator's Pi extension) are harness-specific and cannot be treated as OpenCode V2 plugins without an explicit first-party compatibility statement.
   **Confidence:** High for incompatibility-by-default; low for availability of V2 replacements.
   **Action:** Inventory required outcomes—guardrails, response verbosity, TypeSafe tool, request logging, subagents/intercom, prompt-template model selection, and Plannotator—and port only those with a documented V2 API or maintained V2 plugin.

8. **Claim:** MCP should be migrated from the existing OpenCode definitions, not from Pi's adapter format.
   **Sources:** [V2 configuration](https://opencode.ai/v2/docs/config/), [`stow/opencode/.config/opencode/opencode.jsonc`](../../../../../code/personal/dotfiles/stow/opencode/.config/opencode/opencode.jsonc), [`stow/pi/.pi/agent/mcp.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/mcp.json).
   **Support:** Direct evidence identifies `mcp.servers` as the V2-native field.
   **Repository evidence:** Both harnesses configure Ref, Exa, and RepoPromptCE, but their schemas and environment interpolation syntax differ.
   **Confidence:** High.
   **Action:** Verify V2 migration of the existing OpenCode local/remote server definitions and secret interpolation; do not copy Pi's `imports`, `mcpServers`, `directTools`, or `${VAR}` syntax into V2 without documentation.

9. **Claim:** Provider/model settings need runtime verification after normalization; provider authentication migration is not established by the supplied evidence.
   **Sources:** [V2 configuration](https://opencode.ai/v2/docs/config/), [`stow/opencode/.config/opencode/opencode.jsonc`](../../../../../code/personal/dotfiles/stow/opencode/.config/opencode/opencode.jsonc), [`stow/pi/.pi/agent/settings.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/settings.json).
   **Support:** Direct evidence says V2 has native `providers`; repository evidence shows OpenCode overrides GPT-5.5 `textVerbosity`, while Pi defaults to provider `openai-codex`, model `gpt-5.6-sol`, and medium thinking.
   **Confidence:** Medium.
   **Action:** Authenticate using only the V2 provider flow documented by the live docs, then explicitly select and test the intended provider/model.
   Do not assume Pi credentials, Pi model IDs, thinking-level settings, or OpenCode V1 auth state transfer to V2.

10. **Claim:** Compaction has a new explicit V2 shape, but there is no current repository value to preserve.
    **Sources:** [V2 configuration](https://opencode.ai/v2/docs/config/), [`stow/opencode/.config/opencode/opencode.jsonc`](../../../../../code/personal/dotfiles/stow/opencode/.config/opencode/opencode.jsonc).
    **Support:** Direct evidence names `compaction.keep.tokens` and `compaction.buffer`; the tracked OpenCode file has no `compaction` section.
    **Confidence:** High.
    **Action:** Start with the documented V2 defaults: automatic compaction enabled, 15,000 recent tokens retained, and a 20,000-token safety buffer.
    Add explicit values only if testing shows the defaults do not fit the intended workflow.

11. **Claim:** CLI appearance moves from `tui.json` to global `cli.json`, and CLI config can be changed without restarting.
    **Sources:** [V1 migration guide](https://opencode.ai/v2/docs/migrate-v1/), [V2 CLI configuration](https://opencode.ai/v2/docs/cli/config/), [`stow/opencode/.config/opencode/tui.json`](../../../../../code/personal/dotfiles/stow/opencode/.config/opencode/tui.json), [`stow/pi/.pi/agent/keybindings.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/keybindings.json), [`stow/pi/.pi/agent/themes/catppuccin-macchiato.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/themes/catppuccin-macchiato.json).
    **Support:** Direct evidence says global `cli.json` replaces/migrates `tui.json` and is live-reloaded.
    **Repository evidence:** OpenCode currently tracks only `theme: "tokyonight"`; Pi has a substantial custom keymap and a custom Catppuccin theme.
    **Confidence:** High for location/reload; low for exact keybinding/theme schema compatibility.
    **Action:** Migrate Tokyo Night first, then map Pi bindings intentionally using the current V2 CLI schema rather than copying either Pi JSON file.

12. **Claim:** Hot reload is useful but bounded.
    **Sources:** [V2 plugins](https://opencode.ai/v2/docs/plugins/), [V2 CLI configuration](https://opencode.ai/v2/docs/cli/config/).
    **Support:** Direct evidence says watched configuration directories auto-reload, global `cli.json` live-reloads, and changes to unwatched dependencies may require a restart.
    **Confidence:** High.
    **Action:** Treat direct config/plugin edits in watched locations as reloadable, but restart `opencode` after dependency installs or changes outside watched paths.

13. **Claim:** No verified automatic path was found for Pi prompt templates/slash commands, agent definitions, or session history.
    **Sources:** [OpenCode V2 docs](https://opencode.ai/v2/docs), [V1 migration guide](https://opencode.ai/v2/docs/migrate-v1/), [`stow/pi/.pi/agent/settings.json`](../../../../../code/personal/dotfiles/stow/pi/.pi/agent/settings.json).
    **Support:** The supplied first-party extracts do not state that these Pi artifacts or sessions are imported.
    **Confidence:** Medium.
    **Action:** Treat them as non-migrating until a first-party page explicitly documents import support.
    Recreate only essential slash-command/prompt behavior in the V2-native format, and keep Pi available for old sessions.

## Pi-to-OpenCode 2 capability matrix

| Pi capability | OpenCode 2 path | Migration status | Recommendation |
| --- | --- | --- | --- |
| Global `AGENTS.md` | `~/.config/opencode/AGENTS.md` | Manual harness adapter | Keep one canonical global-rules source and expose it at the OpenCode path rather than maintaining divergent copies. |
| Shared skills | Native discovery of `~/.agents/skills` | Ready | Keep `stow/agents/.agents/skills` canonical and do not duplicate it. |
| MCP via `pi-mcp-adapter` | Native `mcp.servers` config | Ready after smoke test | Retain the existing OpenCode definitions for RepoPromptCE, Ref, and Exa; do not copy Pi's adapter schema. |
| Pi prompt templates | OpenCode command Markdown files | Manual conversion | Copy only useful templates such as `rp`, `rp-plan`, `rp-review`, `rp-search`, and `rp-tree` into the OpenCode `commands/` adapter directory. |
| `pi-subagents` | Built-in OpenCode agents/subagents | Partial replacement | Recreate necessary role definitions and workflows; do not expect Pi orchestration scripts or session state to transfer. |
| `pi-intercom` | No verified equivalent | Gap | Keep Pi for workflows that depend on cross-session messaging until a maintained V2 equivalent exists. |
| `pi-prompt-template-model` | Commands plus agents/model selection | Partial replacement | Convert static templates first; separately test whether V2 commands can preserve per-command model selection and loops. |
| Plannotator Pi extension | Plannotator CLI invoked through skills/shell | Partial replacement | Test the existing shared Plannotator skills in OpenCode; the Pi extension itself is not portable. |
| `cb-guards.ts` | V2 `Plugin.define` plus tool hooks | Required port | This is the cutover blocker for safe editing. |
| `typesafe-ai` | V2 `ctx.tool.transform` | Straightforward port | Preserve the existing narrow typed-evaluation contract and credential handling. |
| `optojr-slack.ts` | V2 `ctx.tool.transform` | Straightforward port | Preserve Keychain-backed credentials and the hosted relay; never move credentials into tracked config. |
| `gpt-verbosity.ts` | Model settings or `session.http.request` hook | Likely config-only | Prefer the existing `textVerbosity` model setting; add a request hook only if the provider ignores it. |
| `request-logger.ts` | V2 HTTP request/response hooks | Portable with caveats | Port only if still needed and keep logs as machine-local state; AI SDK models do not currently pass through V2 HTTP hooks. |
| `code-edit-reminder.ts` | V2 tool `execute.after` hook | Portable | Preserve only if the behavior remains useful after V2 testing. |
| `codex-fast-variants` | Provider/catalog transforms and request hooks | High-effort port | First check whether OpenCode's current OpenAI provider exposes the desired fast/service-tier behavior natively. |
| `copy-all.ts` | TUI/plugin client feature | Unverified | Use built-in export/copy behavior if sufficient; otherwise defer until the V2 TUI plugin API is stable. |
| `frsh-header.ts`, `git-status-widget.ts` | TUI package plugin | Cosmetic, deferred | Do not block migration on Pi-specific chrome. |
| `lg.ts` | Static OpenCode command | Easy replacement | Recreate as command Markdown rather than a plugin. |
| `update.ts` | Native update policy or package-manager update | Do not port initially | Use the stable config's `update` policy or rerun `npm install -g @opencode/cli@latest`; add custom automation only if native updates are insufficient. |
| `zsh-user-bash.ts` | Shell/tool configuration | Probably unnecessary | Test OpenCode's shell behavior before adding a hook. |
| Pi themes/keybindings | Global `cli.json` | Manual mapping | Keep Tokyo Night initially, then map only the Pi bindings that are still valuable. |
| Pi sessions | No verified importer | Not migrated | Keep Pi installed for history and export durable summaries for sessions that matter. |

## Suggested phased migration

1. Record `command -v opencode` and `opencode --version`, then capture a safety backup of the live `~/.config/opencode` directory.
2. Install stable V2 with the official V2 installer or `npm install -g @opencode/cli@latest`, then verify `opencode --version` reports 2.x.
3. Run and observe official normalization, then diff the shared config directory; do not write the result into the tracked Stow package yet.
4. Verify project `AGENTS.md` and the existing `~/.agents/skills` catalog.
5. Verify provider authentication/model choice and all three MCP servers with non-destructive calls.
6. Port and test `cb-guards.ts`; regard editing as unsafe until both blocker paths work.
7. Move `tui.json` intent to global `cli.json`, then test theme, keybindings, and live reload.
8. Decide separately which Pi-only capabilities warrant V2 implementations.
9. Only after successful acceptance, create intentional tracked V2 sources and update bootstrap/Stow handling; retain Pi and V1 rollback paths until sessions and missing capabilities are no longer needed.

## Contradictions

The official V2 installer and release endpoint now identify stable 2.x as the primary `opencode` release, while the older V2 introduction and migration pages still call it beta and describe `opencode2` as a separate executable.
Treat the current release endpoint, current installer, and `@opencode/cli` stable npm metadata as authoritative for installation status.
Continue using the V2 reference pages for configuration and APIs, but ignore their stale beta-era installation wording.

## Missing evidence

- Whether this repository should follow `@opencode/cli@latest`, use the official installer, or pin a tested stable 2.x build for reproducibility.
- Exact migration command, whether migration is automatic in every startup path, and whether it writes files in place.
- Exact V2 schemas for prompt templates/slash commands, custom agents, keybindings, themes, provider authentication, and model variants.
- Whether any OpenCode V1 authentication state is reused by V2.
- Whether OpenCode V1 sessions can be read by V2; no first-party statement about importing Pi sessions was supplied.
- Whether supported V2 replacements exist for Pi subagents, intercom, Plannotator, prompt-template model selection, TypeSafe, or request logging.
- The complete watch boundary and whether every plugin source edit is reloaded safely.
- The current defaults and operational tradeoffs for `compaction.keep.tokens` and `compaction.keep.buffer`.

## Sources

### Kept

- [OpenCode V2 installer](https://opencode.ai/v2/install) — current first-party stable installer behavior, package namespace, primary executable, and compatibility shim.
- [Current CLI release endpoint](https://opencode.ai/update/api/latest/cli/npm) — current first-party release channel, package, version, and source revision.
- [Migrate from V1](https://opencode.ai/v2/docs/migrate-v1/) — compatibility and breaking-change guidance; its beta/install wording is stale.
- [V2 configuration](https://opencode.ai/v2/docs/config/) — official native config fields.
- [V2 CLI configuration](https://opencode.ai/v2/docs/cli/config/) — official `cli.json` and live-reload behavior.
- [V2 instructions](https://opencode.ai/v2/docs/instructions/) — official `AGENTS.md` discovery behavior.
- [V2 skills](https://opencode.ai/v2/docs/skills/) — official global skill discovery behavior.
- [V2 plugins](https://opencode.ai/v2/docs/build/plugins/) — official API, hooks, local discovery, and reload boundaries.
- [V2 compaction](https://opencode.ai/v2/docs/compaction/) — official checkpoint behavior and defaults.
- [Stable npm package metadata](https://www.npmjs.com/package/@opencode/cli) — stable `latest` tag, 2.x version, `opencode` and compatibility `opencode2` binaries, and postinstall mechanism.
- [OpenCode V2 docs](https://opencode.ai/v2/docs) — V2 reference entry point; installation-status wording may lag the stable release endpoint.
- Repository files cited in the findings — direct evidence of likely migration categories only, not evidence of V2 behavior.

### Rejected/deprioritized

- Third-party posts, package listings, examples, and migration guides — excluded by task scope.
- Unsupplied details recalled from prior OpenCode versions — excluded because they could not be verified against current V2 first-party material in this worker.

## Next steps

Perform a controlled macOS smoke test that records the resolved executable and pre/post `~/.config/opencode` diff and validates provider auth, MCP, skills, instructions, plugin blockers, CLI reload, and session visibility.
Do not modify the tracked dotfiles until that diff and capability checklist are reviewed.
