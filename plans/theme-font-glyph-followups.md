# Theme/font glyph follow-up

## Resolution

Use Ghostty's built-in `Symbols Nerd Font` fallback and restore the intended Starship glyphs.

No additional font installation, explicit fallback entry, or patched MonoLisa build is needed. Ghostty 1.3.1 already resolves every requested codepoint from its bundled symbols-only Nerd Font while keeping `MonoLisaCode` as the primary text face.

The active Starship configuration now uses the intended glyphs:

| Glyph | Codepoint | Nerd Fonts name | Starship use | Ghostty face |
|---|---:|---|---|---|
| `󰘧` | U+F0627 | `md-lambda` | Prompt character | Symbols Nerd Font |
| `` | U+E725 | `dev-git_branch` | Git branch | Symbols Nerd Font |
| `` | U+E627 | `seti-go` | Go module | Symbols Nerd Font |
| `` | U+E620 | `seti-lua` | Lua module | Symbols Nerd Font |
| `` | U+F2DC | `fa-snowflake` / `fa-snowflake_o` | Nix shell | Symbols Nerd Font |
| `` | U+E718 | `dev-nodejs_small` | Node module | Symbols Nerd Font |

## Why fallback is the correct approach

Ghostty 1.2 replaced its patched JetBrains Mono resources with a standalone symbols-only Nerd Font. Ghostty now automatically scales Nerd Font symbols to the terminal cell and states that patched fonts are unnecessary in Ghostty. This directly supports using unmodified MonoLisa for text and Ghostty's bundled symbols for icons. [Ghostty 1.2 release notes](https://ghostty.org/docs/install/release-notes/1-2-0#built-in-nerd-font-improvement)

MonoLisa's official FAQ recommends fallback because it avoids modifying font files on every upgrade. It also confirms that privately patching a personal MonoLisa copy is permitted if fallback does not work. [MonoLisa FAQ](https://www.monolisa.dev/faq#how-to-enable-nerd-fonts-with-monolisa)

Nerd Fonts likewise documents a `SymbolsOnly` fallback as the one-font solution for unpatched text fonts. Its acknowledged tradeoff is that symbol scaling and placement depend on the terminal, which Ghostty specifically addresses with automatic cell-size adjustment. [Nerd Fonts installation option 8](https://github.com/ryanoasis/nerd-fonts#option-8-font-fallback)

Ghostty supports repeated `font-family` entries and `font-codepoint-map` for explicit fallback control. Neither is necessary here because Ghostty already chooses its bundled `Symbols Nerd Font` for all six codepoints. [Ghostty font configuration reference](https://ghostty.org/docs/config/reference#font-family)

## Local verification

```bash
ghostty --version

for glyph in '󰘧' '' '' '' '' ''; do
    ghostty +show-face --string="$glyph" --font-family=MonoLisaCode
done
```

Verified locally with Ghostty 1.3.1. Every command reported `found in face “Symbols Nerd Font”`.

To verify the rendered prompt after restarting or reloading Ghostty:

```bash
STARSHIP_CONFIG="$HOME/.config/starship.toml" starship prompt
```

## Patching fallback, not recommended for Ghostty

If a different terminal cannot provide reliable fallback, MonoLisa permits a privately patched personal copy. Nerd Fonts recommends downloading the complete `FontPatcher.zip`, installing FontForge, and running the patcher with `--complete`. The patched files must stay private and should use a distinct family name to avoid colliding with the original MonoLisa installation.

```bash
brew install fontforge
curl -fLO https://github.com/ryanoasis/nerd-fonts/releases/latest/download/FontPatcher.zip
unzip FontPatcher.zip -d FontPatcher
fontforge -script FontPatcher/font-patcher --complete --mono \
  --name 'MonoLisaCode Nerd Font' \
  --outputdir "$HOME/Library/Fonts" \
  /path/to/private/MonoLisaCode-Regular.ttf
```

Each installed style would need to be patched separately. This adds upgrade and font-family maintenance that Ghostty's built-in fallback avoids. [Nerd Fonts font patcher](https://github.com/ryanoasis/nerd-fonts#font-patcher)
