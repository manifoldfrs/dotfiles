# Cursor 3 vs Neovim Findings

## Goal

Figure out whether it makes more sense to keep leaning into Cursor 3 or to improve this Neovim setup so it captures most of the parts of Cursor that feel especially good for reading and navigating code.

This document covers:

- a focused audit of the current Neovim UX
- the gaps between this setup and Cursor 3
- a minimal patch set to make Neovim feel more Cursor-like without turning it into plugin soup
- a practical split workflow for using both tools intentionally

## Executive Summary

This Neovim config is already much closer to "Cursor-like" than a typical terminal editor setup.

It already has:

- a command-palette style command line and UI layer via `noice.nvim`
- a modern file/search/symbol picker via `snacks.nvim`
- fast symbol/reference/definition navigation via LSP + Snacks pickers
- project-wide search and replace via `nvim-spectre`
- motion tooling via `flash.nvim`
- git review and file history via `gitsigns.nvim` and `diffview.nvim`
- modern completion via `blink.cmp`
- discoverable keymaps via `which-key.nvim`

The main things Cursor 3 still gives you that Neovim does not naturally replicate are:

- semantic codebase search
- agent-first workflows across repos/worktrees/cloud
- integrated browser and design feedback loop
- AI editing/review/planning as a cohesive product instead of separate tools

The practical conclusion is:

- keep `nvim` as the primary code-reading and keyboard editing environment
- improve a few UX seams so it feels more obvious and more polished
- use Cursor 3 selectively for semantic search, AI-heavy refactors, agent delegation, and browser-assisted UI work

## Local Findings

### Performance

Measured locally with:

```bash
nvim --headless --startuptime /tmp/nvim-startup.log -c qa
```

Observed startup completion:

- `--- NVIM STARTED ---` at about `165.924ms`

That is an excellent result for a full plugin-based Neovim config and is a major reason to keep Neovim as the default editing surface.

### Command Palette and Picker Layer

The current setup already covers the core navigation loop very well.

From `nvim/lua/plugins/noice.lua`:

- popup command line enabled
- command palette preset enabled
- improved LSP markdown rendering enabled

From `nvim/lua/plugins/snacks.lua`:

- `<leader><space>`: smart find files
- `<C-p>`: find files
- `<leader>/`: grep
- `<leader>sf`: find files
- `<leader>sg`: grep
- `<leader>sb`: buffers
- `<leader>ss`: LSP symbols
- `<leader>sS`: workspace symbols
- `gd`, `gD`, `gr`, `gI`, `gy`: picker-backed code navigation
- `<leader>e`: file explorer

This is already the rough equivalent of the everyday "command palette + fuzzy search + jump to thing" loop many people reach for in Cursor.

### Discoverability

From `nvim/lua/plugins/which-key.lua`:

- leader namespaces are clean and consistent
- descriptions are already present for the important groups

This is good, but the config still feels slightly more "remember the bindings" than "browse the capabilities" because some high-value picker actions are available but not surfaced as aggressively as they could be.

### Reading and Navigation

From `nvim/lua/plugins/flash.lua`:

- character jump
- word jump
- line jump

From `nvim/lua/plugins/lsp-config.lua` and `nvim/lua/plugins/snacks.lua`:

- hover docs
- definitions
- declarations
- implementations
- references
- diagnostics
- rename and code actions

From `nvim/lua/plugins/treesitter.lua` and current options:

- treesitter-backed highlighting
- cursor line
- line numbers and relative numbers
- sign column always on
- scroll offsets

This is already a strong code-reading setup.

### Search and Replace

From `nvim/lua/plugins/spectre.lua`:

- project replace panel
- search current word
- search current file

This covers one of the big practical reasons people like AI editors less than they think they do: when plain grep/replace is good, it is often still the fastest tool.

### Git and Review

From `nvim/lua/plugins/git.lua` and `nvim/lua/plugins/diffview.lua`:

- inline hunk indicators
- hunk preview
- blame toggle
- next/previous hunk
- repo and file history
- diff tree review UI

For local code reading and review, this is already strong.

## Where Cursor 3 Still Wins

### Semantic Search

Cursor documents both exact-match grep and semantic search over indexed codebases. The important distinction is that Cursor can answer prompts like "where do we handle authentication?" even if the exact word does not appear in the relevant file.

That is not something this Neovim setup naturally replaces with standard picker + ripgrep tooling.

### Agent Workflows

Cursor 3 is now explicitly positioned as an agent-first workspace:

- many agents in parallel
- cross-repo and worktree workflows
- local/cloud handoff
- diff/review flows tied directly to agent output

This is a genuine product-level difference, not just a keybinding difference.

### Integrated Browser / UI Iteration

Cursor 3 includes an integrated browser and design mode. That matters for frontend work where pointing at UI and iterating against a running app is part of the main loop.

Neovim can participate in that workflow, but it does not own it end to end.

### Cohesive AI Surface

Even with good CLI tooling, Neovim tends to compose AI through separate tools and terminals. Cursor is still better when the task is:

- "understand this codebase by meaning"
- "make this refactor across many files"
- "plan, edit, review, and open PRs in one place"

## Performance Comparison Notes

### What is confirmed

Cursor officially says Cursor 3 was built "from scratch" and describes it as faster, cleaner, and centered around agents.

Cursor also documents:

- improved large-file diff performance in 3.0
- caching to improve explorer subagent startup time
- an indexing/search stack that combines semantic search and exact grep

### What is not confirmed cleanly

I did not find a strong primary source from Cursor explicitly confirming the claim that Cursor 3 itself was rebuilt as a Rust-native desktop app.

There is enough public evidence to say Cursor uses Rust in parts of its broader system, but not enough to confidently state:

- Cursor 3 is fully Rust-native
- Cursor 3 replaced Electron entirely
- Cursor 3 should be expected to match Neovim on startup/idle performance

### Practical interpretation

The safe comparison is:

- `nvim` wins on startup latency, keyboard immediacy, and lightweight local editing
- Cursor 3 likely wins on complex AI-assisted exploration and large-scale codebase understanding
- Cursor 3 may have improved runtime behavior versus earlier versions, but Neovim remains the safer choice if editor responsiveness is the top priority

## Minimal Patch Set to Make Neovim Feel More Like Cursor

This is intentionally small. The point is not to recreate Cursor inside Neovim. The point is to smooth the highest-friction UX gaps.

### 1. Promote the picker into the obvious front door

What to change:

- add a true command/command-history entry point on obvious keys
- expose more Snacks picker actions in `which-key`
- make the picker feel like the central navigation surface

Why:

- the capability is already present
- the missing piece is mostly discoverability and habit formation

Concrete examples:

- add `<leader>:` for command history
- add `<leader>sC` for commands
- add `<leader>sl` for location list
- add `<leader>s/` for search history
- add `<leader>sB` for grep open buffers
- add `<leader>sp` for project/config/plugin search depending on preference

This is the highest-value low-risk improvement.

### 2. Tighten the file explorer story

What to change:

- pick one explorer as the clear default surface
- keep `neo-tree` only if you strongly prefer it over `Snacks.explorer`
- otherwise remove the split-brain between two explorer approaches

Why:

- Cursor feels coherent partly because there is one obvious place to browse files
- your config currently has both `neo-tree` and `Snacks.explorer()` available

Recommendation:

- standardize on one explorer and one key path for file browsing

### 3. Add a "reading mode" bias

What to change:

- make zen mode more intentional
- consider a lighter default layout for code reading
- keep diagnostics visible but not noisy

Why:

- Cursor feels pleasant partly because it gives code room to breathe
- your setup already has `Snacks.zen()` and clean UI primitives; this is mostly about defaults and usage

Recommendation:

- treat `<leader>z` as a first-class reading command
- consider slightly reducing always-on visual noise before adding more UI

### 4. Strengthen symbol-first navigation

What to change:

- make document symbols and workspace symbols part of the default habit loop
- expose them more prominently in docs and which-key

Why:

- Cursor is excellent when you think "take me to the relevant thing"
- Snacks can already do most of that if the bindings are easy to remember

Recommendation:

- keep `<leader>ss` and `<leader>sS`, but surface them as primary commands in docs and which-key descriptions

### 5. Add one AI path, not many

What to change:

- if you want AI from Neovim, choose a single approach instead of layering several plugins

Why:

- Neovim AI setups get messy fast
- Cursor already covers the heavy AI workflow well

Recommendation:

- keep Neovim focused on editing, reading, grep, git, and local code navigation
- let Cursor own semantic search and agentic editing

## Recommended Split Workflow

Use both tools, but with clear boundaries.

### Stay in Neovim for

- reading code file by file
- fast edits
- local grep, replace, and symbol lookup
- git hunk review and file history
- focused terminal-first work
- tests, shell commands, and tmux-based flow

### Jump to Cursor 3 for

- semantic codebase exploration
- agent-driven implementation or refactors
- AI code review and planning
- frontend work where browser context matters
- tasks that benefit from cross-file reasoning by meaning instead of exact names

### Default rule of thumb

Start in `nvim`.

Switch to Cursor when one of these is true:

- you are asking a question about the codebase, not a file
- you want an agent to do the first draft
- you need semantic search rather than exact search
- you want browser-aware UI iteration

Switch back to `nvim` when one of these is true:

- you know the files you need
- the task is mostly editing and reading
- you want speed and precision more than AI help

## Concrete Next Steps

If you want to improve Neovim without overbuilding it, the best order is:

1. expand Snacks picker bindings and which-key coverage
2. choose a single explorer path
3. document a small set of "front door" commands you use every day
4. keep Cursor 3 as the semantic-search and agent workflow tool

That keeps the setup minimal while improving the exact parts of the experience that matter most.

## Sources

### Local config inspected

- `nvim/lua/plugins/snacks.lua`
- `nvim/lua/plugins/noice.lua`
- `nvim/lua/plugins/lsp-config.lua`
- `nvim/lua/plugins/which-key.lua`
- `nvim/lua/plugins/flash.lua`
- `nvim/lua/plugins/spectre.lua`
- `nvim/lua/plugins/git.lua`
- `nvim/lua/plugins/diffview.lua`
- `nvim/lua/plugins/blink.lua`
- `nvim/lua/vim-options.lua`

### Measured locally

- `nvim --headless --startuptime /tmp/nvim-startup.log -c qa`

### External references consulted

- Cursor blog: `https://cursor.com/blog/cursor-3`
- Cursor changelog 3.0: `https://cursor.com/changelog/3-0`
- Cursor Tab page: `https://cursor.com/product/tab`
- Cursor semantic search docs: `https://cursor.com/docs/context/semantic-search`
- Snacks picker docs: `https://github.com/folke/snacks.nvim/blob/main/docs/picker.md`
