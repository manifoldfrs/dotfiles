# Making Neovim feel like Cursor

Date: 2026-10-21.
Scope: `stow/nvim/.config/nvim` on Neovim 0.12.4, running inside Rex.
Goal: a Cursor-style reading and quick-edit workflow, especially fast file exploration and finding.

## Current state

- File finding already uses `Snacks.picker` (`<C-p>`, `<leader><space>` smart picker, `<leader>/` grep).
- There are two file trees: neo-tree on `<C-n>` and the snacks explorer on `<leader>e`, `<leader>ft`, and `<leader>pt`.
- bufferline reserves a "File Explorer" offset for neo-tree only.
- gitsigns is installed, but inline line blame is off; blame opens fugitive's full blame view.
- No breadcrumbs, no Markdown rendering, and no Cmd-key (`<D-…>`) mappings.

## Findings

### Cmd keys reach Neovim in Rex

A scratch Rex session ran `nvim --clean` with `nnoremap <D-p>` writing a marker file; `rex send-key cmd+p` triggered it.
So Cursor-style Cmd shortcuts are possible in Neovim under Rex.
Caveat: a Cmd shortcut the Rex app itself binds is handled by Rex first.
Rex documents that an unbound key "isn't handled by Rex at all, so it is sent to the focused terminal" ([Keyboard Shortcuts](https://www.superlogical.com/rex/docs/customize/keyboard-shortcuts)), so `rex.unbind("cmd+p")` in `init.lua` frees a key Rex uses.
Rex's default Cmd shortcuts are not listed in the docs; check Settings → Shortcuts before choosing keys.

### The snacks explorer is the closest match to Cursor's sidebar

The snacks explorer is "a picker in disguise" ([explorer docs](https://github.com/folke/snacks.nvim/blob/main/docs/explorer.md)).
Its defaults include `git_status = true`, `diagnostics = true`, `follow_file = true`, `watch = true`, and a `sidebar` layout ([picker docs, explorer source](https://github.com/folke/snacks.nvim/blob/main/docs/picker.md#explorer)).
It has file operations on single keys: `a` add, `d` delete, `r` rename, `c` copy, `m` move, `y`/`p` yank and paste paths, `o` open with the system app.
Because it is a picker, typing filters the tree, which is the part of Cursor's explorer you like.
neo-tree offers similar features but adds plenary and nui and duplicates what snacks already provides.

### The smart picker already does Cursor's "recently opened first"

`Snacks.picker.smart()` merges buffers, recent files, and files, with `frecency = true` and `cwd_bonus = true` ([picker docs, smart](https://github.com/folke/snacks.nvim/blob/main/docs/picker.md#smart)).
snacks ships a `vscode` layout preset: a narrow input at the top with a list, and the preview hidden by default, like Cursor's Cmd-P ([picker docs, vscode layout](https://github.com/folke/snacks.nvim/blob/main/docs/picker.md#vscode)).
fff ([README](https://github.com/dmtrKovalenko/fff)) goes further: a resident Rust index with frecency, typo-resistant matching, and git status, installed through a prebuilt binary or a cargo build.
It is worth trying only if the snacks smart picker feels slow or misses typos in large repos.

### Other Cursor features with a direct equivalent

- Breadcrumbs (`README.md > # Opto2 > ## Architecture` in Cursor): dropbar.nvim, "IDE-like breadcrumbs, out of the box", requires Neovim >= 0.11 ([README](https://github.com/Bekaboo/dropbar.nvim)).
- Inline blame (`You, yesterday | author`): gitsigns `current_line_blame`, formatted by default as `<author>, <author_time:%R> - <summary>` ([README](https://github.com/lewis6991/gitsigns.nvim)).
- Rendered Markdown while reading READMEs: render-markdown.nvim, which renders inside Neovim with no external window ([README](https://github.com/MeanderingProgrammer/render-markdown.nvim)).
- Smooth scrolling: `snacks.scroll`, which handles `scrolloff` and mouse scrolling ([scroll docs](https://github.com/folke/snacks.nvim/blob/main/docs/scroll.md)).
- Icons: mini.icons can mock nvim-web-devicons for other plugins ([README](https://github.com/echasnovski/mini.icons)); current icons already render, so this is optional.

Community sentiment on X (xAI search, no specific posts cited) also points at a sidebar explorer, a fuzzy finder, and dropbar breadcrumbs as the core "VS Code feel"; treat that as background, not evidence.

## Recommendations, ranked

1. **One explorer.** Make the snacks explorer the only tree, remove neo-tree, and point `<C-n>` and the bufferline offset at it.
2. **Cursor Cmd shortcuts**, alongside the existing leader maps:

   | Key | Action |
   | --- | --- |
   | `Cmd-P` | `Snacks.picker.smart()` with the `vscode` layout |
   | `Cmd-Shift-F` | `Snacks.picker.grep()` |
   | `Cmd-B` | toggle the explorer |
   | `Cmd-Shift-P` | `Snacks.picker.commands()` |
   | `Cmd-Shift-O` | `Snacks.picker.lsp_symbols()` (go to symbol) |
   | `Cmd-S` | write |
   | `Cmd-/` | toggle comment |

   Free any of these that Rex binds by default with `rex.unbind` in `stow/rex/.config/rex/keys.lua`.
3. **Breadcrumbs** with dropbar.nvim.
4. **Inline blame** with `current_line_blame = true` in `git.lua`, keeping `<leader>gt` for the full view.
5. **Markdown rendering** with render-markdown.nvim.
6. **Smooth scrolling** with `scroll = { enabled = true }` in snacks.
7. **Optional:** try fff for Cmd-P, and mini.icons, only if the first six leave gaps.

Not covered here: theme changes, the statusline, and LSP or completion behavior.
