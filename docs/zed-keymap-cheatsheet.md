# Zed keymap cheat sheet

This maps the Neovim leader system onto `stow/zed/.config/zed/keymap.json`.
Leader is space and localleader is comma, as in Neovim.
Press space and pause for Zed's built-in which-key menu, or press `alt-/` mid-chord to list pending bindings.
The custom Zed Dev build (`zed-custom/patches`) shows the Neovim group names and descriptions from `which_key.labels` in settings.
Stock Zed rejects that setting and the flash actions, so this config needs Zed Dev.

## Groups

| Prefix | Group | Highlights |
| --- | --- | --- |
| `space f` | File | `ff` find files, `fr` recent, `fs`/`fS` save/save all, `ft` tree, `fT` reveal in tree, `fy` copy path, `fe` edit settings |
| `space p` | Project | `pf` files, `pp` recent, `pt` tree |
| `space b` | Buffer | `bb`/`bf`/`,` tab switcher, `bd`/`bc` close, `bn`/`bN` next/prev, `bp` pin |
| `space s` | Search | `sg`/`sp`/`/` project search, `sf` files, `ss`/`sj` outline, `sS` project symbols, `sd` diagnostics, `sc` themes, `sk` keymap editor, `se` rename |
| `space g` | Git | `gg` lazygit (task), `gd`/`gD` diff, `gs` git panel, `gb` branches, `gl`/`gh`/`gH` history, `gp` toggle hunks, `gt` blame |
| `space t` | Test | `tt` test nearest (task), `tf` test file (task), `ts` task picker, `tl` rerun last task |
| `space w` | Window | `wh`/`wj`/`wk`/`wl` focus pane, `wv`/`w/` split right, `ws`/`w-` split down, `wd` close item, `w=` reset sizes |
| `space j` | Jump | `jj` flash to a typed pattern, `jw` flash to word starts, `jl` flash to line starts |
| `space u` | Toggle | `uh` inlay hints, `uw` soft wrap, `ul` line numbers |
| `space q` | Quit | `qq` quit Zed, `qf` close window |
| `,` | Localleader | `,f` format, `,r` rename, `,a` code actions, `,d` hover, `,s` outline, `,t`/`,T` tests |

## Non-leader keys carried over

`jk` leaves insert mode.
`;` opens the command palette, where `:w`, `:q`, `:bd`, `:Git`, and `:<line>` aliases work.
`gr` references, `gi` implementation, and `gl` hover follow the Neovim setup instead of the Zed vim defaults.
`]h` and `[h` move between git hunks.
`shift-h` and `shift-l` cycle buffers, replacing Vim's screen-top/bottom motions as in Neovim.
`alt-j` and `alt-k` move lines.
`ctrl-arrows` resize panes.
`ctrl-p` opens the file finder and `ctrl-n` focuses the project panel, in the editor only so the terminal panel keeps its shell keys.
`ctrl-a` splits and `ctrl-\`` opening Ghostty are unchanged from the previous Zed era.
`shift-s` in visual mode adds surrounds.

## Not ported, deliberately or because Zed has no equivalent

Herdr pane-crossing on `ctrl-hjkl` and the Herdr annotate map stay in Neovim, because Zed does not run inside Herdr.
Snacks pickers for undo history, marks, jumps, quickfix, notifications, and scratch buffers have no Zed analog; the underlying Vim marks, jumplist (`ctrl-o`), and a plain new file cover the daily cases.
Noice history, Cloak secret masking, Spectre's replace panel, Diffview's two-pane file history, and Twoslash queries have no Zed equivalent; project search-and-replace and the git history tab are the approximations.
The `%%` command-line path expansion and reload-config maps do not translate, because Zed's `:` is a command palette without arguments and settings reload automatically.
Test-suite and test-visit have no direct analog; `space t s` opens the task picker instead.
