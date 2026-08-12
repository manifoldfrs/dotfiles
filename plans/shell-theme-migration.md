# Fish, Starship, and Macchiato migration record

## Final selection

- Catppuccin Macchiato: Ghostty, Herdr, Neovim, Pi, Fish, fzf, and Starship.
- MonoLisaCode 14 pt: Ghostty regular, italic, bold, and bold-italic faces.
- Opaque Neovim surfaces: editor, floats, completion menus, Snacks, Telescope-compatible groups, and Diffview.
- Intentional mismatches: Codex and OpenCode remain Tokyo Night. Cursor and Zed are archived and not restored.
- Prompt glyphs: the intended Nerd Font symbols render through Ghostty's built-in `Symbols Nerd Font` fallback while MonoLisaCode remains the primary text face. See `plans/theme-font-glyph-followups.md`.

## Shell startup baseline and result

Measured on 2026-08-11 from this repository on Apple Silicon macOS.

### Zsh baseline before switch

Five non-TTY `zsh -i -c exit` runs measured 0.23-0.25 seconds. Powerlevel10k's gitstatus and ZLE initialization reported non-TTY errors, so these numbers are a migration baseline rather than an interactive prompt benchmark.

### Fish and Starship after migration

Twenty runs:

| Measurement | Minimum | Median | Mean | Maximum |
|---|---:|---:|---:|---:|
| `fish -i -c exit` | 50.93 ms | 54.10 ms | 53.97 ms | 57.63 ms |
| standalone `starship prompt` process in this Git repo | 39.47 ms | 42.32 ms | 42.36 ms | 48.22 ms |

`starship timings` reported 17 ms for `git_branch` and 18 ms for `git_status`; all other rendered modules were at or below 1 ms. The recurring module work is therefore about 35 ms and remains below the 50 ms project target. Fish startup remains below the 100 ms first-prompt target.

The largest Fish startup entries were Starship initialization, fzf integration, Zoxide initialization, and the one-time registration of the 171 Git abbreviations. Homebrew environment setup uses static Fish variables and paths rather than spawning `brew shellenv` on every shell.

## Validation commands

```bash
find stow/fish stow/fish-cb -name '*.fish' -print0 | xargs -0 -n1 fish -n
fish --profile-startup /tmp/fish-startup.profile -i -c exit
STARSHIP_CONFIG="$PWD/stow/fish/.config/starship.toml" starship timings
bash test/run_tests.sh
```
