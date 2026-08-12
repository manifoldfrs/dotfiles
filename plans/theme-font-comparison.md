# Theme and Font Comparison: Current Setup vs dmmulroy

## Context

The reference screenshot shows Ghostty hosting Herdr, with Neovim in the main pane. The visual character comes from a coordinated Catppuccin Macchiato palette across all three layers plus MonoLisa at a noticeably larger size.

Reference screenshot: `/var/folders/7n/wm_y_lw91392bqm5lxr5wndc0000gn/T/pi-clipboard-ba75dbe7-0b1f-4f47-8ecd-9517fc52c4f2.png`

The selected direction is to adopt dmmulroy's coordinated Catppuccin Macchiato environment and **fully switch the interactive shell from Zsh + Powerlevel10k to Fish + Starship**, including his modular Fish configuration, abbreviations, functions, completions, and prompt structure. Use the installed `MonoLisaCode` family at **14 pt**. Neovim and Herdr workflow/keybinding changes remain outside the visual/shell scope unless explicitly called out below.

## Visual summary

| Layer | Current setup | dmmulroy setup |
|---|---|---|
| Ghostty | TokyoNight Night | Catppuccin Macchiato |
| Terminal font | JetBrainsMono Nerd Font, 14 pt | MonoLisa, 18 pt in his config; target installed `MonoLisaCode`, 14 pt locally |
| Neovim | Tokyo Night `night`, transparent surfaces | Catppuccin Macchiato, opaque base |
| Herdr | Built-in `tokyo-night` | Catppuccin base with explicit Macchiato tokens |
| Pi | Custom `tokyonight-frsh` | Custom `catppuccin-macchiato` theme is tracked and documented |
| Shell | Zsh + Powerlevel10k | **Selected target:** Fish + Starship + Catppuccin Fish colors, accepting a likely prompt-latency increase for the preferred visuals and Fish UX |
| GUI editors | Cursor and Zed configs currently active in the repository | No tracked GUI-editor appearance beyond IdeaVim; archive local Cursor and Zed configs rather than theme them |

### Overall character

- **Current:** darker, cooler, higher-contrast Tokyo Night base; smaller and denser JetBrains Mono text; transparent Neovim surfaces allow Ghostty to dominate the background.
- **dmmulroy:** softer slate-blue Macchiato base; warmer pastel syntax; larger, more editorial MonoLisa shapes; opaque and consistent surfaces across Ghostty, Herdr, and Neovim.

## Font comparison

| Attribute | Current | dmmulroy |
|---|---|---|
| Family | JetBrainsMono Nerd Font | MonoLisa |
| Ghostty size | 14 pt | 18 pt in his repository; **14 pt selected for the local target** |
| Style mapping | Family and size only | Regular, Regular Italic, Bold, Bold Italic explicitly mapped |
| Density | Compact, more code visible | Larger, airier, easier to read on stream/video |
| Personality | Technical and familiar | Rounded, humanist, more distinctive |
| Icons | Nerd Font glyphs built into selected family | Local target uses installed `MonoLisaCode` and validates each configured Starship glyph |
| Licensing/provisioning | Installed through Homebrew | Installed from a private repository by his bootstrap script |

Neovim and Herdr do not choose fonts themselves. When hosted by Ghostty they inherit Ghostty's font. This means a single Ghostty font change affects editor text, Herdr chrome, Pi, shell prompts, and terminal agent interfaces.

### MonoLisa installation

Use **MonoLisa Code at 14 pt** to preserve the compact density of the previous terminal setup while adopting the selected font family. The user has purchased and installed MonoLisa successfully. Font Book shows `MonoLisaCode` with 20 styles, and `ghostty +list-fonts` reports the exact family name `MonoLisaCode` with regular and italic weights from Hairline through Black. No additional font acquisition or font-file handling is needed for this migration.

#### Installation status

- [x] MonoLisa acquired through the official distribution.
- [x] Full `MonoLisaCode` family installed in Font Book with 20 styles.
- [x] Ghostty resolves `MonoLisaCode` and its regular/italic weights.
- [x] Set Ghostty font size to 14 pt in `stow/ghostty/.config/ghostty/config`.
- [x] Correct the configured family typo from `MonaLisaCode` to Ghostty's reported `MonoLisaCode` while applying the theme and Fish changes.
- [x] Restart Ghostty once after all configuration changes, then verify regular, italic, bold, and bold-italic rendering.

Source reference for future manual upgrades: [MonoLisa installation FAQ](https://www.monolisa.dev/faq).

#### Nerd Font glyph handling

Starship's configured icons (`󰘧`, ``, ``, ``, ``) use private-use Nerd Font codepoints, so each must be checked with the installed `MonoLisaCode` family. For any missing glyph, create or update `plans/theme-font-glyph-followups.md` with the glyph, Unicode codepoint, Starship module/use, observed rendering, and screenshot if useful. Research the glyph with Exa and Ref against primary sources such as Nerd Fonts, Starship, MonoLisa, and Ghostty, then record candidate fixes and source links in that document. Resolve missing glyphs through Ghostty's supported symbols-only fallback or a privately patched font, then record the verified choice in the glyph follow-up document.

#### Ghostty configuration and verification

Do not assume the family name from filenames. After Font Book installation, run:

```bash
ghostty +list-fonts | rg -i 'MonoLisa'
```

Use the confirmed Ghostty family name `MonoLisaCode` at 14 pt with regular, italic, bold, and bold-italic styles. Verify `󰘧`, ``, ``, ``, and ``, plus italic comments, bold text, ligatures, box drawing, and Herdr borders. Missing private-use glyphs follow the documentation workflow above.

## Configuration differences

### Ghostty

**Current** — `stow/ghostty/.config/ghostty/config`

- `theme = TokyoNight Night`
- `font-family = MonaLisaCode` has already been entered, but must be corrected to `MonoLisaCode`
- `font-size = 14` is already set
- Native macOS tab titlebar
- Unfocused split opacity 0.9

**dmmulroy** — `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.config/ghostty/config`

- `theme = Catppuccin Macchiato`
- `font-family = MonoLisa`
- `font-size = 18`
- Display P3 color space
- Zero and balanced window padding
- Unfocused split opacity 0.97
- Fixed `ghostty` window title

### Neovim

**Current**

- Tokyo Night `night`
- Transparent editor, sidebars, floats, statusline, and tab fill
- Neo-tree, Bufferline, Snacks, Noice, Flash, nvim-lint, and vim-test

**dmmulroy**

- Explicit `catppuccin-macchiato`
- Opaque Macchiato base surfaces
- Custom Telescope base, blue borders, and mauve titles
- Oil, Telescope, Harpoon, Outline, UFO, tiny-inline-diagnostic, TwoSlash, TypeScript Tools, Wilder, and vcsigns

**Shared foundation**

- lazy.nvim
- blink.cmp
- Conform
- Treesitter
- Diffview
- Snacks
- Spectre
- Which-key
- Lualine

The visual migration does not require adopting his Neovim workflow plugins. Theme/font changes should remain separate from plugin and keybinding changes.

### Shell comparison: Fish + Starship vs Zsh + Powerlevel10k

The two setups differ in more than prompt speed. dmmulroy's shell looks richer because Fish, Starship, Catppuccin shell syntax colors, Nerd Font symbols, and a large abbreviation/function library are coordinated. The current shell is deliberately sparse: a Pure-style Powerlevel10k prompt, ANSI colors, fzf history search, and external language-manager initialization. The user has chosen the complete Fish + Starship setup despite Powerlevel10k's benchmark advantage because the combined visuals, autosuggestions, abbreviations, and modular workflow are preferred.

#### Representative visual comparison

Exact output varies by repository and active language, but the configured shapes are approximately:

**Current Zsh + Powerlevel10k**

<div style="background:#1a1b26;color:#c0caf5;padding:12px;border-radius:6px;font-family:monospace"><span style="color:#e0af68">~/code/project</span> <span style="color:#565f89">on</span> <span style="color:#7aa2f7">feature/theme</span> <span style="color:#9ece6a">!</span><br><span style="color:#7aa2f7">❯</span> git status</div>

- Pure-style, two-line, left-only prompt.
- Yellow directory, compact Git branch/status, optional virtualenv/background-job state, and blue/red `❯` prompt character.
- Git counts are intentionally hidden by default, keeping the prompt terse.
- Command duration only appears after five seconds.
- FZF uses a separate hard-coded dark ANSI palette, so it does not currently match Tokyo Night exactly.

**dmmulroy Fish + Starship**

<div style="background:#24273a;color:#cad3f5;padding:12px;border-radius:6px;font-family:monospace"><span style="color:#8aadf4">~/code/project</span> <span style="color:#c6a0f6"> feature/theme</span> <span style="color:#a6da95">[!]</span> <span style="color:#eed49f">via  v22</span><br><span style="color:#a6da95">󰘧</span> git status</div>

- Starship's module-oriented prompt automatically adds Git state and detected language/runtime modules.
- Custom Nerd Font symbols include `` for Git, `` for Go, `` for Lua, `` for Nix, and `󰘧` as the success/error character.
- Directory paths are not truncated to the repository root, while Git branches truncate at 18 characters.
- Node is only detected for actual Node project markers, reducing noise and unnecessary version probes.
- Fish's Catppuccin syntax colors style commands, parameters, strings, errors, autosuggestions, selections, search matches, and completions with exact Macchiato colors.
- Fish abbreviations visibly expand as they are typed, which makes the 171 tracked Git abbreviations discoverable in a way ordinary Zsh aliases are not.

The “cooler” appearance is therefore real. Although its colors and symbols could be imitated in Powerlevel10k, the selected migration adopts Fish + Starship so the visual treatment, native autosuggestions, abbreviations, completions, and modular configuration all match as one system.

#### Decision and accepted tradeoff

Switch completely to **Fish + Starship** and reproduce dmmulroy's shell architecture:

1. Use Fish as the login and interactive shell in Ghostty and Herdr.
2. Use Starship with dmmulroy's module order, symbols, branch truncation, project-aware runtime detection, and Catppuccin-rendered terminal colors.
3. Import the Catppuccin Macchiato Fish syntax/completion palette.
4. Port his Fish abbreviations, lazy functions, command completions, zoxide integration, and Fisher-managed Git plugin.
5. Port the current machine's required environment, fzf behavior, language-manager access, `cbcode`, `find_pr`, and Coinbase-specific behavior into Fish-native configuration rather than continuing to source `.zshrc`.
6. Archive the current Zsh/Powerlevel10k configuration after Fish parity is verified.

The accepted cost is that Starship may add tens of milliseconds of prompt latency in Git-heavy directories compared with Powerlevel10k. Fish's native autosuggestions, discoverable abbreviations, richer prompt modules, exact Macchiato shell coloring, and modular configuration are considered worth that tradeoff. Validation will enforce a performance ceiling: target ≤100 ms first prompt, ≤150 ms first command, and ≤50 ms recurring prompt render in representative repositories. If a Starship module exceeds the ceiling, tune or disable that module rather than reverting the shell decision.

### Herdr

**Current** — `stow/herdr/.config/herdr/config.toml`

- Explicit `name = "tokyo-night"`
- Zsh
- `Ctrl-A` prefix
- tmux-style `%` and `"` splits
- Default sidebar width

**dmmulroy** — `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.config/herdr/config.toml`

- Default Catppuccin base with exact Macchiato custom tokens
- Fish
- `Ctrl-;` prefix
- Backslash and Enter splits
- Sidebar width 32
- Vim/Herdr navigation plugin actions
- 50 MiB scrollback, Kitty graphics, and pane history enabled

Only the theme tokens and possibly sidebar width contribute directly to the screenshot's appearance. Shell and keybinding differences should not be bundled into a visual migration.

### Pi and other interfaces

- Current Pi uses `tokyonight-frsh` from `stow/pi/.pi/agent/settings.json` and `stow/pi/.pi/agent/themes/tokyonight-frsh.json`.
- dmmulroy tracks a full Macchiato Pi theme at `home/.pi/agent/themes/catppuccin-macchiato.json`. His live selection is not verifiable because his settings file is no longer tracked.
- Current Cursor already uses Catppuccin Macchiato with JetBrainsMonoNL Nerd Font at 14 pt, but the entire root `cursor/` configuration will be archived.
- Current Zed uses One Dark Pro UI with Catppuccin Macchiato icons, and the entire root `zed/` configuration will be archived.
- Existing historical Cursor files already occupy `old/cursor/`; move the current root configuration into a distinct `old/cursor/current-archive/` subtree to avoid overwriting that history.
- Archive root `zed/` as `old/zed/` because no existing Zed archive was found.
- Current OpenCode and Codex TUIs use Tokyo Night-family themes. They are terminal interfaces, not GUI editors, and can be aligned in a later terminal-theme consistency pass.

## Approach

Implement the approved visual and shell direction as one coordinated migration:

1. Establish Catppuccin Macchiato across Ghostty, Herdr, Neovim, Pi, Fish, Starship, and terminal completion/search surfaces.
2. Match dmmulroy's opaque Neovim surfaces, Macchiato Telescope treatment, Herdr palette tokens, and terminal-wide color consistency.
3. Use the installed `MonoLisaCode` family at 14 pt.
4. Add Stow-managed Fish and Starship packages based on dmmulroy's structure, then port all environment and work-machine requirements before changing the login shell.
5. Switch Ghostty, Herdr, bootstrap/stow scripts, backups, tests, and documentation from Zsh to Fish.
6. Archive the root Cursor and Zed configurations under `old/` rather than updating their themes.
7. After Fish parity and rollback are verified, archive `stow/zsh/` and `stow/zsh-cb/` under `old/` and remove Powerlevel10k/zsh-syntax-highlighting from the active package set.
8. Keep Codex and OpenCode out of the first pass. They remain candidates for a later terminal-theme consistency change.
9. Keep dmmulroy's Neovim workflow plugins and Herdr keybindings out of scope.

## Files to modify

The approved visual migration will modify these critical files:

- `stow/ghostty/.config/ghostty/config`
- `stow/herdr/.config/herdr/config.toml`
- `stow/nvim/.config/nvim/lua/plugins/colorscheme.lua`
- `stow/nvim/.config/nvim/lua/plugins/lualine.lua`
- `stow/nvim/.config/nvim/lazy-lock.json` after the approved plugin change
- `stow/pi/.pi/agent/settings.json`
- `stow/pi/.pi/agent/themes/catppuccin-macchiato.json` if a local theme file is preferred
- `stow/fish/.config/fish/config.fish` and `conf.d/`, `functions/`, `completions/`, `fish_plugins`
- `stow/fish/.config/starship.toml`
- `stow/fish-cb/.config/fish/conf.d/coinbase.fish` and Fish-native work functions
- `Brewfile` for Fish, Fisher, Starship, and Zoxide; retire active Powerlevel10k/zsh-syntax-highlighting entries
- `scripts/stow.sh`, `scripts/bootstrap.sh`, and `scripts/backup.sh` for Fish package targets, default-shell setup, and backups
- `test/run_tests.sh` for Fish/Fish-CB stow and configuration assertions
- `README.md` and `AGENTS.md` for the new shell architecture and recovery instructions
- `plans/theme-font-glyph-followups.md` only if a configured Starship glyph is missing; record Exa/Ref research and deferred decisions there

Archive moves included in the approved scope:

- `cursor/` → `old/cursor/current-archive/`
- `zed/` → `old/zed/`
- `stow/zsh/` → `old/zsh/` after Fish verification
- `stow/zsh-cb/` → `old/zsh-cb/` after Fish-CB verification

Deferred consistency follow-ups:

- `stow/opencode/.config/opencode/tui.json`
- `stow/codex/.codex/config.toml`
- `stow/codex/.codex/themes/`
- No MonoLisa package work is needed; the purchased family is already installed
- Codex and OpenCode theme alignment remains deferred; Fish/Fisher/Starship are now part of the approved migration

## Reuse

- Use dmmulroy's exact Macchiato values from `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.config/herdr/config.toml` rather than approximating the Herdr palette.
- Adapt the existing Pi semantic mappings from `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.pi/agent/themes/catppuccin-macchiato.json`.
- Adapt the Catppuccin Neovim integration list and Telescope highlights from `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.config/nvim/lua/plugins/color-scheme.lua`.
- Preserve the current diagnostic underline customizations from `stow/nvim/.config/nvim/lua/plugins/colorscheme.lua` when replacing the colorscheme plugin.
- Preserve current Herdr keybindings, session behavior, and notifications while changing its theme and default shell to Fish.
- Keep the current custom Pi extensions theme-driven. `stow/pi/.pi/agent/extensions/frsh-header.ts` already consumes semantic theme colors and should not need hard-coded palette changes.
- Reuse dmmulroy's Fish layout, Catppuccin theme, Starship configuration, 171 Git abbreviations, lazy utility functions, and committed completions from `tools_inspiration/dmmulroy/dmmulroy_dotfiles/home/.config/fish/` and `home/.config/starship.toml`.
- Preserve dmmulroy's project-marker strategy, especially Node detection via `package.json`, `.node-version`, `.nvmrc`, `.tool-versions`, or `node_modules` rather than every JS/TS file.
- Port behavior from `stow/zsh/.zshrc` and `stow/zsh-cb/.zshrc.local` rather than transliterating syntax blindly: environment paths, language-manager availability, fzf commands, `cbcode`, `find_pr`, Go proxy settings, and required Coinbase plugin commands each need a Fish-native owner.
- Reuse Fish's native highlighting, autosuggestions, abbreviations, and lazy function loading rather than recreating Zsh plugin abstractions.

## Steps

- [x] Select the coordinated Catppuccin Macchiato look as the target.
- [x] Set the target font size to 14 pt.
- [x] Capture baseline screenshots of Ghostty, Herdr, Neovim, Pi, completion menus, diagnostics, Telescope/Snacks, and Diffview.
- [x] Archive `cursor/` into `old/cursor/current-archive/` without overwriting the existing historical Cursor files.
- [x] Archive `zed/` into `old/zed/`.
- [x] Install the full MonoLisa Code family; Font Book shows 20 styles and Ghostty confirms the exact family name `MonoLisaCode`.
- [x] While swapping Ghostty to Catppuccin Macchiato and Fish integration, correct `MonaLisaCode` to `MonoLisaCode`; keep the already selected 14 pt size.
- [x] Restart Ghostty after all theme/shell changes, then validate MonoLisa styles and every configured Starship glyph.
- [x] If any prompt glyph is missing, create/update `plans/theme-font-glyph-followups.md`, research its codepoint and supported rendering options with Exa/Ref using primary sources, cite findings, and restore it through Ghostty's verified symbols-only fallback.
- [x] Apply matching Macchiato tokens to Herdr without changing its keybindings or shell.
- [x] Replace the Neovim Tokyo Night plugin configuration with Catppuccin Macchiato while preserving diagnostic behavior.
- [x] Apply dmmulroy's opaque Catppuccin surface treatment and verify it remains visually coherent with Ghostty and Herdr.
- [x] Add/select the Pi Macchiato semantic theme and verify custom extensions inherit it correctly.
- [x] Verify MonoLisaCode 14 pt readability, weight mapping, italics, ligatures, and configured prompt glyphs from the installed licensed family.
- [x] Evaluate Fish + Starship against Zsh + Powerlevel10k using published user-visible latency benchmarks and local configuration analysis.
- [x] Create the Stow-managed Fish package with dmmulroy's `config.fish`, `conf.d` modules, Catppuccin theme, Fisher plugin list, 171 Git abbreviations, lazy functions, and completions.
- [x] Add dmmulroy's Starship configuration and preserve bounded project/language detection.
- [x] Port current PATH, fzf, pyenv, rbenv, NVM, Deno, envman, Bun, and Postgres behavior into Fish without unnecessary eager startup work.
- [x] Create a Fish-CB package that ports Go proxy/path settings, `cbcode`, `find_pr`, and required Coinbase plugin behavior; document any cb-zsh command that cannot be reproduced safely.
- [x] Update Ghostty and Herdr to launch Fish, then update stow/bootstrap/backup scripts, tests, and documentation.
- [x] Preserve rollback until personal and Coinbase Fish profiles pass validation; then archive Zsh and Zsh-CB packages under `old/`.
- [x] Record the current Zsh baseline before switching and benchmark Fish startup plus Starship prompt rendering after implementation.
- [x] Keep Codex and OpenCode unchanged in this pass; do not restore or retheme Cursor and Zed after archival.
- [x] Document the final palette/font choice and any intentionally mismatched applications.

## Verification

### Automated/configuration checks

- Run Ghostty's configuration validation or launch it from a terminal to catch invalid keys or font names.
- Start Neovim headlessly and confirm the Catppuccin plugin loads without errors.
- Run the repository's existing Neovim/config checks, if present.
- Reload Herdr configuration and check its logs/UI for rejected tokens.
- Parse the Pi theme JSON and start Pi with the selected theme.
- Capture a pre-migration `zsh-bench` baseline, then measure Fish with `fish --profile-startup`, repeated real interactive launches, and `starship timings` in representative repositories. Compare first-prompt and first-command readiness where the tools permit equivalent measurement.
- Verify any added language indicators in an empty directory, small Git repository, large Git repository, Node project, and non-Node JS/TS repository.
- Confirm `git diff` contains only the approved appearance files, archive moves, and expected lockfile update.

### Manual visual checks

- Confirm Ghostty, Herdr panels, Neovim base, and Pi backgrounds do not form mismatched color bands.
- Inspect normal, selected, inactive, warning, error, success, and diff states.
- Inspect italics, bold text, Nerd Font icons, box-drawing characters, and ligatures.
- Check Neovim Telescope/Snacks, completion menus, diagnostics, floating windows, Lualine, Diffview, and Markdown rendering.
- Check Herdr sidebar, active/inactive tabs, pane borders, notifications, and agent states.
- Confirm MonoLisaCode remains readable and dense enough at the selected 14 pt size.
- Capture side-by-side screenshots under identical window dimensions to confirm the selected 14 pt size.

## Resolved decisions and remaining gate

- **Theme:** adopt Catppuccin Macchiato across Ghostty, Herdr, Neovim, and Pi.
- **Neovim surfaces:** use dmmulroy's opaque Macchiato treatment.
- **Font size:** use 14 pt.
- **GUI editors:** archive Cursor and Zed under `old/`; do not retheme them.
- **Codex/OpenCode:** defer.
- **Shell:** fully adopt Fish + Starship, including dmmulroy's modular config, Catppuccin colors, abbreviations, functions, completions, and prompt. The measured Powerlevel10k performance advantage is an accepted tradeoff.
- **Font installation:** resolved. The purchased MonoLisa family is installed and 14 pt is already configured; correct the current `MonaLisaCode` typo to `MonoLisaCode`, then restart Ghostty once after the full theme/shell swap.
