# Replace tmux with Herdr

## Goal

Replace tmux with Herdr as the persistent terminal workspace manager inside Ghostty while preserving Tokyo Night styling and familiar `Ctrl-a` workflows for tabs, workspaces, panes, copy mode, and detach/reattach.

## Compatibility summary

Herdr cannot load `.tmux.conf`, TPM, or tmux plugins directly. Their important behaviors have native equivalents:

- `janoamaral/tokyo-night-tmux` -> Herdr's built-in `tokyo-night` theme
- `tmux-yank` -> Herdr copy mode and mouse clipboard support
- `tmux-resurrect` and `tmux-continuum` -> persistent Herdr server, layout snapshots, and native coding-agent session restore
- `tmux-sensible` -> native Herdr defaults plus explicit config
- tmux status widgets -> Herdr sidebar and tab bar, with agent state replacing the custom tmux status line

Ghostty remains the terminal emulator. Its existing Tokyo Night theme, font, clipboard settings, and macOS Alt behavior can remain unchanged.

## Proposed Herdr configuration

Add `stow/herdr/.config/herdr/config.toml` with:

```toml
onboarding = false

[terminal]
default_shell = "/bin/zsh"
shell_mode = "auto"
new_cwd = "follow"

[theme]
name = "tokyo-night"

[keys]
prefix = "ctrl+a"
help = "prefix+?"
detach = "prefix+q"
reload_config = "prefix+r"

workspace_picker = ["prefix+s", "prefix+w"]
new_workspace = "prefix+shift+n"
rename_workspace = "prefix+$"
close_workspace = "prefix+d"
previous_workspace = "prefix+("
next_workspace = "prefix+)"

new_tab = "prefix+c"
previous_tab = "prefix+p"
next_tab = "prefix+n"
switch_tab = "prefix+1..9"
rename_tab = "prefix+comma"
close_tab = "prefix+ampersand"

# tmux C-a % creates a side-by-side split.
split_vertical = "prefix+%"

# A TOML literal string avoids escaping the double quote.
# tmux C-a " creates a stacked split.
split_horizontal = 'prefix+"'

focus_pane_left = "prefix+h"
focus_pane_down = "prefix+j"
focus_pane_up = "prefix+k"
focus_pane_right = "prefix+l"
cycle_pane_next = "prefix+o"
last_pane = "prefix+semicolon"
close_pane = "prefix+x"
zoom = "prefix+z"
resize_mode = "prefix+shift+r"
copy_mode = "prefix+["
toggle_sidebar = "prefix+b"

[ui]
mouse_capture = true
right_click_passthrough_modifier = "ctrl"
confirm_close = false
prompt_new_tab_name = true
pane_borders = true
pane_gaps = true
agent_panel_sort = "spaces"

[ui.toast]
delivery = "herdr"
delay_seconds = 1

[ui.toast.herdr]
position = "top-right"

[ui.sound]
enabled = false

[session]
resume_agents_on_restore = true

[remote]
manage_ssh_config = true

[experimental]
allow_nested = false
pane_history = false

[advanced]
scrollback_limit_bytes = 10485760
```

Validate the `Ctrl-a %` and `Ctrl-a "` punctuation bindings against the installed Herdr release and Ghostty. Do not add fallback bindings.

## Implementation steps

1. Move the tracked tmux configuration into the existing historical archive under `old/tmux/`, including `.tmux.conf` and a copy of `tmux-sessionizer`, so the previous setup remains recoverable without remaining active.
2. Replace `brew "tmux"` with `brew "herdr"` in `Brewfile`.
3. Add the `stow/herdr/.config/herdr/config.toml` package and replace `tmux` with `herdr` in the personal and Coinbase package lists in `scripts/stow.sh`.
4. Add `~/.config/herdr/config.toml` to bootstrap and backup target handling.
5. Keep `stow/ghostty/.config/ghostty/config` unchanged initially. Consider hiding Ghostty's native tab bar later if Ghostty tabs plus Herdr tabs feel redundant.
6. Install official Herdr integrations on each machine:

   ```bash
   herdr integration install pi
   herdr integration install codex
   herdr integration install opencode
   herdr integration install claude
   herdr integration status
   ```

7. Keep generated integration files machine-managed because Herdr overwrites them during integration upgrades.
8. Add the Herdr agent skill from `/Users/frshbb/github/tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.agents/skills/herdr/SKILL.md` to the shared Stow-managed skills for Pi, Claude, Codex, and OpenCode so agents can inspect, create, control, and coordinate Herdr workspaces, tabs, panes, and sibling agents.
9. Replace the active `tmux-sessionizer` command with Herdr's `Ctrl-a s` workspace picker. Keep the archived copy under `old/tmux/` only for reference.
10. Stop relying on `nvim-tmux-navigation` for cross-multiplexer movement. Keep `Ctrl-h/j/k/l` inside Neovim and use prefixed `Ctrl-a h/j/k/l` for Herdr panes.
11. Update Stow tests to assert `~/.config/herdr/config.toml` is linked and remove tmux-only startup checks.
12. Remove TPM installation functions and tmux plugin setup from `scripts/stow.sh` as part of the same migration.
13. Update README installation, keybinding, troubleshooting, migration, and command-cheatsheet sections from tmux to Herdr.
14. Remove the active `stow/tmux` package and tmux-specific scripts after their tracked contents are archived under `old/tmux/`.

## Verification

- `herdr` launches inside Ghostty with the Tokyo Night theme.
- `Ctrl-a n/p`, `Ctrl-a 1..9`, and `Ctrl-a c` manage tabs as expected.
- `Ctrl-a Shift-n`, `Ctrl-a $`, and `Ctrl-a d` create, rename, and close workspaces. `Ctrl-a n` remains reserved for next-tab navigation.
- `Ctrl-a s`, `Ctrl-a (` and `Ctrl-a )` select and navigate workspaces.
- `Ctrl-a %` splits right and `Ctrl-a "` splits down without fallback bindings.
- `Ctrl-a h/j/k/l`, `Ctrl-a o`, `Ctrl-a z`, `Ctrl-a x`, and resize mode work.
- Copy mode and mouse selection reach the macOS clipboard.
- Detaching and reattaching preserves live shells and agents.
- Pi, Codex, OpenCode, and Claude appear with correct agent state.
- Pi, Claude, Codex, and OpenCode can discover and use the shared Herdr skill.
- A full Herdr server restart restores layout and resumes supported native agent sessions.
- Neovim receives its own `Ctrl-h/j/k/l` mappings without Herdr stealing them.
- Personal and Coinbase Stow dry-runs link the Herdr config correctly.
- `old/tmux/` contains the previous `.tmux.conf` and `tmux-sessionizer` for recovery.

## Migration strategy

Perform a direct replacement:

1. Archive the tracked tmux configuration and sessionizer under `old/tmux/`.
2. Add and validate the Herdr config.
3. Replace tmux with Herdr in Homebrew, Stow, bootstrap, backup, and tests.
4. Add the shared Herdr agent skill to each supported agent's Stow-managed skill location.
5. Update `README.md` throughout, including requirements, setup, Stow commands, keybindings, troubleshooting, package inventory, and migration guidance.
6. Remove active TPM and tmux automation.
7. Apply the updated Stow profile, install Herdr integrations, and verify the complete workflow in Ghostty.
