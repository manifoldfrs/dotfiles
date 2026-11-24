# Research: Cursor as the code reader, Pi as the harness

Updated 2026-10-13.
Checked against Cursor's official docs, the Pi package gallery, VS Code's source and docs, Ghostty's docs, and this repo's own setup notes.

## The question

Agents write nearly all the code now, so the editor's job is mostly reading and reviewing.
Neovim does that well but needs ongoing configuration.
Cursor promises a full setup with little configuration.
Pi stays the harness either way.
The open questions were what a switch gains and loses, whether Cursor's iOS app can replace the Droplet plus Termius plus Tailscale, whether Pi works with Cursor mobile, and where Pi should run: Cursor's integrated terminal or Ghostty.

## Short answer

Use Cursor as the reader and reviewer on the Mac.
Keep Pi in Ghostty and Herdr, locally and on `agentbox`.
Keep the Droplet, Tailscale, and Termius.
Cursor for iOS cannot replace them for Pi, because it only controls Cursor's own agents.
Optionally add Cursor Cloud Agents or Bugbot later as a second, separate system.

## What you gain by switching the reader to Cursor

- Zero-config language intelligence for reading: go-to-definition, references, hover types, and diagnostics work from the extension marketplace without maintaining 33 Lua plugin files and a `lazy-lock.json`.
- A better review surface than terminal diffs: side-by-side diffs, inline diagnostics, a file tree, symbol search, and GitLens-style blame in one window.
- Bugbot, Cursor's automated PR reviewer, which reviews every PR update for bugs, security issues, and quality problems and can also review a branch diff before you push.
- A real Pi bridge exists: the third-party `pi-ide-integration` package attaches a live Pi session to Cursor over a loopback WebSocket, so Pi sees your selection, open editors, and diagnostics, and Pi can open files and diffs in Cursor for you to review.
- Remote SSH workspaces, so Cursor on the Mac can read code that lives on `agentbox` with extensions running on the server.
- Tab completion and Cursor's own agent as a second opinion, even if Pi stays primary.

## What you lose

- Speed and weight: Cursor is an Electron app, and your own archived notes in `old/cursor/current-archive/cursor-performance-notes.md` record watcher churn, roughly 632 MB of extensions, and several hundred MB of workspace state from your last Cursor period.
- Your Vim setup: VSCodeVim covers the common motions, but it is not Neovim, and your Herdr `vim-herdr-navigation` keys and Neovim plugins do not carry over.
- One more subscription and billing surface: Pro is $20/mo, and third-party models draw from a usage pool billed at API prices.
- A second config home to keep in Stow: Cursor settings live in `~/Library/Application Support/Cursor/User/`, extensions are local state, and Cursor rewrites its own settings files the way Claude Code and Codex already fight this repo's Stow links.
- Nothing about Pi gets simpler: Pi's skills, MCP servers, providers, and sessions all stay exactly where they are, because Cursor mobile and Cloud Agents only run Cursor's agent loop.

## Cursor mobile, Pi, and the Droplet

Cursor for iOS is a controller for Cursor agents, not an IDE.
Cursor's docs say it directly: the app "isn't an IDE", and the editor, terminal, and file browser stay on the web.
On the phone you start Cursor cloud agents, follow them live, and review and merge their PRs.

That gives three hard facts for a Pi user:

1. There is no way to drive a Pi session from Cursor mobile.
   Pi is a terminal TUI with no Cursor backend, and the iOS app has no SSH client, no terminal, and no third-party harness support.
2. Remote Control does not change this.
   It hands a Cursor desktop agent session to your phone while tool calls keep running on your computer, and that computer "must stay awake and online", which is the exact problem `agentbox` already solved.
3. The one real bridge is My Machines.
   You can register the Droplet as a self-hosted worker (`agent worker start`), and then Cursor mobile can direct Cursor agents whose terminal commands, edits, and tests execute on the Droplet over an outbound connection, with no inbound ports.
   That replaces the Droplet's job only if you also replace Pi with Cursor's agent loop for those runs.
   Your Pi skills, global rules, MCP config, subagents, and Herdr panes do not come along.

Cloud Agents without the Droplet are the other replacement path, and they trade differently.
Each run gets an isolated Ubuntu VM, clones the repo, works on a branch, and pushes a PR.
You configure each repo's environment with a snapshot or a `.cursor/environment.json` Dockerfile, and runs are billed at the selected model's API pricing.
User-level config from your home directory is not present, by Cursor's own docs.
That is a fine system, but it is a new per-repo environment to build and maintain in place of the one persistent, stowed environment you already verified end to end on 2026-10-08, at a flat $24/mo.

So the Droplet, Tailscale, and Termius stay load-bearing as long as Pi is the harness and the phone must reach real Pi sessions with the Mac closed.
Cursor iOS would only retire them if you moved the harness itself to Cursor, which contradicts the premise.

## Terminal: Ghostty or Cursor's integrated terminal

Two different questions hide here: rendering efficiency and session survival.

On rendering, Ghostty is a native Swift and AppKit app with Metal GPU rendering, built to sit in the fastest class of terminal emulators.
Cursor's integrated terminal is xterm.js inside Electron.
For a TUI harness that repaints constantly, plus Herdr multiplexing on top, Ghostty is the more efficient and lower-latency host.
Your current stack also depends on it: `stow/herdr` keys, the `xterm-ghostty` terminfo you installed on `agentbox`, and your Ghostty keybinds.

On survival, the integrated terminal loses outright for long Pi runs.
A Pi session in Cursor's terminal dies with the Cursor window and with the Mac.
A Pi session in Herdr, local or on `agentbox`, survives disconnects, which is the whole point of the current setup.

The integrated terminal still has one genuine convenience: it is already in the repo directory inside the IDE.
Use it for quick one-off commands and test runs while reading.
Run Pi in Ghostty and Herdr.

## Can Ghostty be used with Cursor

Yes, as the external terminal, not as the integrated one.
There is no way to embed a native terminal emulator inside Cursor's panel; that panel is xterm.js.
VS Code upstream supports Ghostty explicitly as the macOS external terminal (`terminal.external.osxExec: "Ghostty.app"`, opened with ⇧⌘C), and Cursor inherits the VS Code settings model, though the exact Ghostty special case depends on how current Cursor's fork is.
Verify it in your installed build before relying on it.
The fallback of `open -a Ghostty .` from the integrated terminal always works.

Combined with `pi-ide-integration`, the practical loop is: Pi runs in Ghostty next to Cursor, Pi opens the files and diffs it wants you to review in Cursor, and your selection in Cursor flows back into Pi's next prompt.
Note the bridge is loopback-only, so it pairs a local Pi with local Cursor.
For code on `agentbox`, use Cursor Remote SSH to read, and keep driving that Pi through Herdr.

## Recommended target setup

| Layer | Keep or change |
|---|---|
| Reading and reviewing on Mac | Cursor, mostly default settings, VSCodeVim if wanted, `files.watcherExclude` from your archived notes |
| Harness | Pi in Ghostty plus Herdr, unchanged |
| Always-on execution | `agentbox` Droplet plus Tailscale, unchanged |
| Phone access to Pi | Termius plus Mosh plus Herdr, unchanged |
| Pi to Cursor link | Optional: `pi install npm:pi-ide-integration`, review its source first as Pi's gallery itself warns |
| Extra review | Optional: Bugbot on repos where a second automated reviewer earns its cost |
| Neovim | Keep installed and stowed as the fallback and the server-side editor; stop investing in it |

## Follow-up: can Neovim just become Cursor-like

Added 2026-10-13 after auditing the current config and reading dev posts from people who ran both setups.

The current hand-rolled config already covers most of what Cursor gives a reader: LSP navigation, hover, and diagnostics for TypeScript, Ruby, Go, Python (ty), Lua, and C; blink.cmp completion; snacks picker and explorer; Diffview, gitsigns, and fugitive for review; conform and nvim-lint; vim-test; twoslash queries and ts-error-translator for TypeScript reading.
It is, in effect, a hand-rolled subset of LazyVim's folke-centered stack across 21 small plugin files.

The real gaps are short and specific:

1. No debugger at all.
   Adding one means nvim-dap plus a UI, a debug adapter per language, and launch or attach config per project, although nvim-dap now reads `.vscode/launch.json` automatically and LazyVim's `dap.core` and language extras pre-wire the common stacks.
   The LazyVim book's verdict is that debuggers rarely work out of the box in any editor and the setup skill does not transfer between projects, so Cursor's edge here is discoverability (marketplace installs the adapter, snippet generates `launch.json`, variables and watch UI are built in), not magic.
2. No AI next-edit completion like Cursor Tab.
   The closest maintained equivalent is sidekick.nvim's Next Edit Suggestions, which needs a Copilot subscription; a beta plugin, neocursor.nvim, even drives Cursor's real Tab backend from a Cursor login.
   When agents write the code, this gap matters least.
3. No in-editor agent panel, which Herdr plus Pi already replaces.
   Bridges exist for the nice-to-have context sharing: `pi-nvim` and `aliou/nvim-pi` send files and selections from Neovim to a running Pi and let Pi read Neovim's diagnostics and reload edited buffers, and sidekick.nvim can host Pi in a terminal split.
   All are third-party and need a source review before installing.
4. Polish gaps: inlay hints exist as a snacks toggle but are off by default, and there is no outline or breadcrumbs plugin.
   These are one-plugin or one-option fixes, not a rewrite.

What the dev posts say, consistently:

- Replicating Cursor's integrated AI inside Neovim is the fragile part.
  Adam Drake's two-week attempt found Supermaven's Tab predictions underwhelming, avante.nvim slow to configure, error-prone, and hard to read, and opencode.nvim close on UX but beaten on cost by Cursor's flat $20, so he went back to Cursor and kept Neovim for focused hand-coding.
  That failure mode does not apply here, because Pi in a Herdr pane is already the agent and nothing needs to live inside the editor.
- The pane pattern is the one that works.
  Daniel Miessler replaced Cursor with Claude Code and Neovim in three Ghostty panes after finding Neovim AI plugins glitchy or gross to configure, which is structurally the setup already in this repo.
- The maintenance tax is the real reason people leave Neovim.
  Aman Azad quit after two and a half years over LSP wrangling, random Lua errors, abandoned plugins like null-ls, and formatter conflicts, then later also left Cursor and landed on terminal-hosted agents as the workhorse with a GUI editor opened per worktree only for manual review.
  Kevin McKelvin and Nick Janetakis took the other exit: keep Neovim, move to LazyVim, and let the distro and its extras absorb the update churn, accepting one-maintainer risk and occasionally pinned versions.
- Using both is normal.
  James Read runs Cursor daily for AI-assisted work and Neovim for everything else, and treats it as tools in a toolbox rather than a binary choice.

The tradeoff, stated plainly:

| | Cursor-like Neovim | Cursor as reader/debugger |
|---|---|---|
| Reading/review | Already at parity for LSP, diff, blame, search; keyboard-native inside Herdr | Parity plus GUI discoverability, minimap-style overview, richer previews for images and markdown |
| Debugger | Build it: adapter and launch config per language and project; `launch.json` is shared, so work is not wasted if you later switch | Install extension, generate `launch.json`, go; watch and call-stack UI included |
| AI inside editor | Tab via Copilot NES (extra subscription) or beta backends; agent panel unnecessary with Pi in Herdr | Tab and agent included, but redundant next to Pi |
| Maintenance | Yours forever: Neovim releases, plugin breakage, LSP churn, times two machines (Mac and `agentbox`), though Stow keeps them identical | Cursor's: auto-updates, but their release can also move your settings, and the config still needs a Stow story on the Mac only |
| Droplet parity | Identical editor over SSH in a Herdr pane, no extra server | Needs the Remote SSH server component on `agentbox`, and the GUI only exists on the Mac |
| Cost | Free; optional Copilot if NES is wanted | $20/mo Pro, which also carries Grok Bot and Bugbot |
| Exit cost | None; config is already tracked | Low for code, but review habits and keymaps re-form around the GUI |

Grok Bot is independent of this choice.
It is a separate product: named, persistent bots on a shared Cursor cloud computer with browser, filesystem, and terminal, reachable from its desktop app and iOS, included with every paid individual Cursor plan or through a linked SuperGrok subscription, with weekly-resetting usage.
Paying for Cursor to get Grok Bot and Bugbot does not obligate using the Cursor editor at all.

Revised recommendation: keep Neovim as the reader, close only the debugger gap and the cheap polish gaps, add a Pi-Neovim bridge if the context sharing proves wanted, and treat a Cursor subscription as payment for Grok Bot, Bugbot, and an occasional debugging overflow tool.
Copy LazyVim's DAP extra configuration rather than hand-writing adapter tables, and consider a full LazyVim migration only if update breakage, not missing features, becomes the recurring pain.
That is a tracked-source change to `stow/nvim` and needs the usual dry-run and validation before any live apply.

## Follow-up: Cursor as a pure reader, its stack, and performance

Added 2026-10-13.

### Cursor is not open source, and cannot be compiled by users

Cursor is a proprietary fork of Microsoft's MIT-licensed Code-OSS codebase.
Cursor's own license page lists the open source components inside it (Visual Studio Code, Electron, Node.js, Monaco Editor, TypeScript), which is a notice about its ingredients, not a source release.
The public `getcursor/cursor` GitHub repository is an issue tracker, not the source.
There is therefore no custom-compilation path for Cursor itself: no source to patch, no flags to rebuild with, and its AI features also depend on Cursor's servers.
Building the upstream editor from source is possible (that is what VSCodium does), but the result is Code-OSS without any Cursor-specific features, and Microsoft's closed extensions (Pylance, C/C++, C#, Remote) are license-blocked in all forks, Cursor included, which is why Cursor ships its own alternatives such as `anysphere.remote-ssh` and its Pyright fork.

### What Cursor is written in

The VS Code core Cursor forked is fully TypeScript, per Microsoft's own source-organization wiki.
It runs as an Electron app: a Chromium renderer hosts the workbench and the Monaco editor core, with separate Node processes for the extension host, the shared process, the terminal host, and file watching.
Neovim (C and Lua), Ghostty (Swift and AppKit on macOS over a Zig core, Metal rendering), and Herdr are native programs.
That architectural difference, not any one bug, explains the footprint gap.
One fairness note: the language servers are the same external processes in both worlds, so `ts_ls` or `ruby_lsp` costs roughly the same memory under Cursor as under Neovim; the editor shell around them is what differs.

### Measured on this Mac (2026-10-13)

- Cursor running: 9 processes totaling about 678 MB RSS (RSS double-counts shared pages, so treat it as an upper bound), with the main process at about 245 MB.
- Ghostty plus Herdr: about 263 MB RSS across 3 processes, and that stack also hosts the shells and Pi panes inside it.
- Disk: `Cursor.app` is 860 MB against Ghostty's 62 MB; `~/Library/Application Support/Cursor` is 3.2 GB and `~/.cursor/extensions` is 711 MB across 35 extensions, including duplicate old versions.
  Neovim's data directory is 997 MB, mostly plugins and Mason-installed servers, so Neovim is not disk-free either.
- Startup: this repo's Neovim config reaches `NVIM STARTED` in 253 ms; Cursor's cold start was not measured because it was already running.
- Cursor staff on their forum call roughly 1.24 GB with extensions disabled and 1.45 GB with a normal extension set a healthy baseline; the horror stories (8-10 extension hosts at ~4 GB each, over 30 GB total) traced back to stacking four third-party AI extensions on top of Cursor's built-in AI.
  A reader-only profile avoids exactly that failure mode.

For reading, the practical performance questions are keystroke latency, scroll smoothness, search speed, and time for LSP answers.
Monaco in Chromium is slower to echo and scroll than a native terminal grid, and full-text search shells out to ripgrep in both editors, so the felt difference is mostly input latency and memory, not correctness or feature speed.
If Cursor only reads while Pi works in Ghostty, Cursor's cost is additive memory on a machine that is otherwise idle, which is usually the right trade.

### Running Cursor as a pure reader

Setup is mostly already done on this machine: Cursor is installed and running, 35 extensions are present (including `vscodevim.vim` and `anysphere.remote-ssh`), live keybindings exist from April 2026, and `old/cursor/current-archive/` holds the previous settings, keybindings, and extension list in this repo.
The `cursor` CLI is not on `PATH`, which the Pi IDE bridge from the earlier research needs; install it from the Command Palette if that bridge is wanted.

Settings that turn the unused machinery off:

- Cursor Tab: disable globally from the status-bar indicator or Cursor Settings > Tab.
  Also set `"editor.inlineSuggest.enabled": false` to kill extension ghost text.
- Codebase indexing: turn it off in Cursor Settings, and keep `.cursorignore` / `.cursorindexingignore` plus `files.watcherExclude` and `search.exclude` from the archived performance notes for watcher churn.
- Agent autonomy: Settings > Agents > Approvals & Execution, choose the Allowlist run mode with an empty allowlist, which is Cursor's documented replacement for the removed Ask Every Time mode, so nothing executes unapproved if an agent is ever invoked.
  Set Read Access to Workspace there as well.
- Read-only editors: `"files.readonlyInclude": { "**": true }` makes every editor read-only (with a per-session toggle command when an edit is genuinely needed), which also prevents an accidental keystroke from dirtying a file an agent is working on.
  Turn off `editor.formatOnSave` and Cursor's shadow workspace (`cursor.general.enableShadowWorkspace`), both enabled in the archived settings, since a reader should never write.
- Extensions: keep the language and review set (GitLens, pretty-ts-errors, Biome or ESLint for diagnostics only, Go, Python, Remote SSH, VSCodeVim if wanted) and remove the duplicates and dead weight the Extension Monitor flags.
  Cursor's own performance page puts extensions first for a reason, and `cursor --disable-extensions` is the clean baseline test.

What cannot be removed: the Electron shell and its baseline processes, the account sign-in, and Cursor's own update cadence.
There is no official lightweight build; Cursor staff have logged "Cursor Lite" requests as feedback only.
Speed work is configuration, not compilation: fewer extensions, watcher and index excludes, GPU runtime arguments in `argv.json` if rendering misbehaves, and per-project Profiles so language extensions only load where relevant.

### Verdict for this setup

Using Cursor for everything except the agent loop is coherent with the rest of this research: Ghostty, Herdr, and Pi stay the execution center on the Mac and on `agentbox`, and Cursor becomes the Mac-only reading, review, and debugging glass.
The price is roughly a gigabyte or two of RAM, several GB of disk state that needs occasional pruning, and accepting a closed-source editor whose performance you can tune at the edges but never rebuild.
Given the archived settings and installed extensions, the realistic setup work is an afternoon of pruning and disabling, not a from-scratch configuration.

## Follow-up: reading on mobile

Cursor for iOS cannot be a code reader in the IDE sense: by its own docs the editor, terminal, and file browser stay on the web, and on mobile you see changed files in a diff view, not a full workspace.
What mobile does give is PR-shaped reading: full diffs, commits, checks, and comments for pull requests in connected repos, with full-width diffs and side-by-side review on iPad, but only for Cursor agent sessions and PRs, with no codebase browsing, go-to-definition, or symbol search.
Opening `cursor.com/agents` in a mobile browser adds the web editor and file browser, but only inside a cloud agent's VM workspace.
None of these surfaces can see Pi's work on the Mac or on `agentbox`, so mobile reading for this setup stays: Plannotator review pages from `agentbox` over the tailnet, GitHub PR diffs once Pi pushes a branch, and Termius plus Neovim for real code browsing.
Neovim therefore remains the mobile reader even if Cursor becomes the desktop one.

Workarounds other devs use to get a Cursor-like reader on iPhone or iPad, ranked for this setup:

1. `code-server` on the droplet, served only on the tailnet.
   Coder's code-server runs the real VS Code workbench on a Linux server (about 1 GB RAM and 2 vCPUs) and serves it to a browser; their iPad guide recommends installing it as a Safari PWA and warns it needs a domain name with a valid certificate for WebSockets, which `tailscale serve` plus MagicDNS provides without opening the Cloud Firewall.
   This is the only option that reads Pi's live, uncommitted working tree on `agentbox` with server-side language servers, search, and diffs, and it looks and behaves like Cursor's editor minus Cursor's AI.
   Costs: about a gigabyte of the droplet's 4 GiB when running, extensions come from the Open VSX ecosystem rather than Microsoft's marketplace, and on iPhone the workbench is cramped (it is an iPad-sized UI).
   Installing anything on `agentbox` is a live change and needs separate approval.
2. Remote desktop to the Mac with Jump Desktop over Tailscale.
   This is the workaround Cursor forum users actually report for the real Cursor IDE on iPad: leave the Mac at home running Tailscale and Jump Desktop, connect from iPad with a keyboard, and Cursor is in exactly the state left behind.
   It is the only way to get literal Cursor on a tablet, but the Mac must stay awake, which gives up the lid-closed property the droplet exists for, and on iPhone a streamed desktop is a panning exercise.
3. `github.dev` or `vscode.dev` in mobile Safari.
   Zero setup: change `.com` to `.dev` on any GitHub repo or PR and get the VS Code web UI with search, syntax highlighting, and symbol navigation for popular languages.
   No terminal, no debugger, limited extensions, and only code already pushed to GitHub, so it cannot show an agent's in-progress work on the droplet.
4. Blink Shell as a better terminal client, optionally with Blink Code pointed at a code-server or Codespaces instance.
   Blink is the Mosh-native iOS terminal many terminal-first devs standardize on; it improves the existing Termius path rather than adding a GUI reader by itself.
5. Working Copy plus Textastic or Runestone.
   Clone repos onto the phone and read them offline with syntax highlighting; no LSP navigation, and the copy goes stale the moment an agent pushes, so it suits reference reading, not review of live work.

For iPhone-sized reading, the honest ranking stays: PR diffs (GitHub app or Cursor iOS for Cursor's own PRs) and Plannotator pages first, code-server when a real workspace is needed, and Jump Desktop only when the literal desktop Cursor state matters.

Sources for this section: https://coder.com/docs/code-server and https://coder.com/docs/code-server/ipad; https://code.visualstudio.com/docs/remote/vscode-web; https://docs.github.com/en/codespaces/the-githubdev-web-based-editor; https://jumpdesktop.com/remote-desktop-coding.html; Cursor forum iPad threads at https://forum.cursor.com/t/ipad-pro-support/2946 and https://forum.cursor.com/t/cursor-for-ios-ipad-support/164342; https://workingcopy.app/manual/edit/; https://blink.sh/.

Decision (2026-10-13): `github.dev` is the accepted mobile reader for now, with code-server on `agentbox` deferred unless reading live uncommitted work from the phone becomes a recurring need.
This makes draft PRs the mobile reading surface for Pi work, so pushing a branch and opening a draft PR early is what makes an agent's change phone-readable.

## Steelman: can Neovim match the mouse-first GUI experience

The stated reasons for wanting Cursor as the reader are input-paradigm reasons, not feature reasons: hating keyboard navigation for viewing files, wanting shift-click multi-select plus right-click delete in a file tree, loving the VS Code debugger, and wanting an intuitive out-of-the-box setup.
Steelmanning Neovim against each, with this repo's config as the base (`mouse = "a"` is already set, bufferline tabs are clickable, neo-tree is installed):

- Mouse basics are already there.
  Neovim defaults to mouse on with `mousemodel=popup_setpos`: click places the cursor, the wheel scrolls, and right-click opens a default popup menu that already includes Go to definition, Show Diagnostics, Cut, Copy, Paste, and Select All, and it is user-definable per mode.
  Neo-tree opens and expands on click.
  A surprising amount of casual mouse reading works today with zero changes.
- Multi-select file operations exist, in keyboard clothing.
  Neo-tree gained a selection system in 2026: tag nodes (or visually select a range), then the `_visual` variants of delete, trash, cut, and copy act on the set.
  Oil.nvim goes further for bulk work: the directory is an editable buffer, so deleting lines deletes files, editing names renames, and `:w` applies, including across directories.
  Both are arguably more powerful than Explorer multi-select, and both require thinking in tags, visual ranges, and keys (`d`, `m`, `a`) rather than shift-click and a context menu.
  Neo-tree has no built-in right-click menu; the GitHub issue requesting mouse menus is still a feature request with external proofs of concept.
- Right-click menus are a DIY kit.
  NvChad's menu plugin gives nested, clickable right-click menus (including an LSP menu and an nvim-tree menu), and context-menu.nvim does smart context detection, but the user wires the `<RightMouse>` mapping and writes or extends the menu tables per filetype and plugin.
  The result can look like a GUI menu while remaining one more bespoke system to maintain.
- GUI front ends get closest and cost the Herdr model.
  VimR is a native Swift macOS GUI with a file drawer, double-click with modifiers for tab or split, trackpad pinch and scroll, an Open Quickly fuzzy finder, and markdown preview; Neovide adds smooth scrolling and cursor animation.
  Even in VimR, file manipulation in the drawer is a modal keyboard menu (`m`, then `a`/`m`/`d`/`c`), and any GUI front end is its own window with its own bundled Neovim: it cannot live in a Herdr pane and does not exist on headless `agentbox`.
- The debugger steelman is genuinely good, after assembly.
  nvim-dap-ui's panels are mouse-capable: double-click expands variables and watches, the step controls are clickable icons, and `eval()` gives a hover window for the expression under the cursor.
  It still sits on nvim-dap, a per-language adapter, launch configuration, and user-chosen keymaps for breakpoints and stepping, where VS Code gives gutter-click breakpoints, inline values, and one coherent UI installed with the language extension.

Where the steelman breaks is not any single feature but three structural points.
First, assembly defeats the goal: matching Cursor takes neo-tree selection config, oil, a menu plugin with hand-written menus, dap plus dap-ui, and possibly a GUI front end, which is the opposite of out-of-the-box and adds exactly the maintenance being escaped.
Second, there is no shared convention layer: each plugin invents its own mouse semantics, terminal grids have no hover tooltips on chrome and no Finder drag-and-drop into trees (a drop pastes a path), and settings remain Lua editing rather than a searchable UI.
Third, discoverability decays differently: a GUI enumerates its actions in menus and tooltips, so shallow, intermittent use stays usable on recognition alone, while Neovim's mouse features are themselves hidden behind recall (neo-tree's `?` help, dap-ui's letter mappings).
For an agent-first workflow where the editor is opened often but used shallowly, recognition-over-recall is a structural advantage of the GUI, not a matter of taste.

Verdict: Neovim can approximate roughly 80 percent of the mouse-first experience, and a few pieces (oil bulk edits, the default LSP popup menu, dap-ui) are better than expected.
The last 20 percent (uniform context menus, drag-and-drop, tooltips, settings UI, zero-assembly debugger) is precisely the intuitive-out-of-the-box part that motivates the switch, and buying it in Neovim costs more configuration than the current setup already carries.

Sources: Neovim mouse defaults at https://github.com/neovim/neovim/blob/master/runtime/doc/vim_diff.txt and https://github.com/neovim/neovim/blob/master/runtime/doc/gui.txt; neo-tree selection at https://github.com/nvim-neo-tree/neo-tree.nvim/discussions/472 and mouse-menu request at https://github.com/nvim-neo-tree/neo-tree.nvim/issues/772; https://github.com/stevearc/oil.nvim; https://github.com/NvChad/menu; https://github.com/qvacua/vimr; https://github.com/rcarriga/nvim-dap-ui.

## Superlogical/Rex, and what other devs use as readers

Superlogical is Mitchell Hashimoto's new company (with Jack Pearkes, Alasdair Monk, and Hector Simpson), building "the multiplexer for all work": a durable session layer spanning interactive, automatic (CI, background jobs, coding agents), and production work.
Its first product, Rex, is a terminal multiplexer built on libghostty: native apps, persistent sessions organized as sessions, windows, and blocks, performant remote connections, program activity status, built-in live session sharing, a typed server API with Lua scripting and a CLI, and native scrollback, selection, and scrolling.
Rex entered macOS-only public testing on 2026-10-05 via mailing-list waves; it is free forever, needs no account, and is fully self-hostable.
Linux and Windows servers and iOS, Linux, and Windows clients exist internally at varying readiness but are not in public testing yet.

Rex targets the session layer, not the reader layer: a block is one application, and today that means a terminal, so code inside a Rex session is still read in Neovim or other terminal tools.
What Rex would replace in this setup is Ghostty plus Herdr plus Tailscale plus Termius as one native, multi-device session system with a real iOS client eventually, which is a significant quality-of-life upgrade to exactly the layer the droplet workflow depends on.
The reader question would only change if step two of their plan (make everything composable: blocks with typed APIs exposing structured data and actions) ships non-terminal blocks such as file or diff viewers inside sessions; nothing like that has been announced.
Until the Linux server and iOS client are public, Rex cannot carry the `agentbox` workflow, so it is a watch-and-join-the-beta item, not a migration candidate today.
Ghostty itself is unaffected: it was donated to a non-profit in 2025 and remains the open building block Rex consumes.

Surveying what agent-era devs actually read code in, the stack splits into three layers and no single tool covers all of them:

1. Codebase understanding (open files, follow definitions): GUI editors used as readers.
   Cursor and VS Code dominate; Zed is the native-performance entrant (Rust, GPL open source and buildable from source, free without AI, DAP debugger, SSH remote projects where language servers run on the server and the UI stays local, and a Pi integration through the `pi-acp` ACP adapter whose sessions map to Pi's own session files).
   Aman Azad's endpoint was exactly this shape: terminal-hosted agents as the workhorse, `zed .` opened per worktree for manual review.
   Sublime Text persists as the instant-open reader for huge files and foreign codebases.
2. Change review (is this diff right): PR-shaped surfaces.
   Graphite (stacked PRs, merge queue, unified PR inbox, and its Graphite Agent AI reviewer) is the category leader for teams and was acquired by Cursor in December 2025 explicitly because review has become the bottleneck as writing got faster; AI pre-reviewers (Bugbot, CodeRabbit, Greptile class tools) sit in front so humans read less; GitHub PR plus `github.dev` is the zero-setup baseline; Sublime Merge is the beloved local diff reader (side-by-side diffs, character diffs, drag a hunk edge to expand context, full-file toggle); Plannotator fills this layer in the current setup.
3. Session supervision (what are my agents doing): multiplexers and supervisor apps.
   Herdr and tmux in the terminal; Conductor as the GUI version (isolated worktree per workspace, built-in diff viewer, checks tab, PR flow, for Claude Code and Codex); Vibe Kanban's board over many agents (project sunsetting); and now Rex aiming at this layer with durable, sharable, multi-device sessions.
   A recurring critique is that supervisors multiply output without checking it: parallelism is a throughput fix, review is a trust problem.

Empirical backing for the split: a FAccT 2026 interview study of 17 experienced developers found oversight work decomposes into a priori control, co-planning, real-time monitoring, and post hoc review, with difficulty reviewing agent-generated code a named challenge and test results used as a correctness heuristic.
That maps cleanly onto the three layers above, and onto this repo's existing shape: Pi rules and plans (a priori and co-planning), Herdr on `agentbox` (monitoring), and the still-open reader question (post hoc review).

Implication for the Cursor decision: adopting Cursor fills layer 1 on the desktop and, via Bugbot and the Graphite acquisition, increasingly layer 2; it does nothing for layer 3, which Herdr already covers and Rex may eventually do better.
Zed is the one layer-1 alternative matching the stated values Cursor cannot: native speed in the Ghostty class, truly open source and compilable, SSH reading of live `agentbox` code, and a first-class Pi path through ACP, at the cost of a smaller extension ecosystem, a younger debugger, and no Grok Bot or Bugbot bundled in.
This repo already tried Zed once (`old/zed/` is archived), so any re-evaluation should start from what made it lose last time.

Sources: https://www.superlogical.com/, https://www.superlogical.com/updates/public-testing-beginning, https://www.superlogical.com/rex/docs/automate/cli.md, https://mitchellh.com/writing/superlogical; https://zed.dev/blog/fastest-ai-code-editor, https://zed.dev/docs/remote-development, https://zed.dev/docs/ai/external-agents.html, https://github.com/svkozak/pi-acp; https://fortune.com/2025/12/19/cursor-ai-coding-startup-graphite-competition-heats-up/; https://www.conductor.build/docs/guides/parallel-agents/run-multiple-codex-sessions; https://superterminal.dev/blog/multi-agent-coding-tools-compared.html; https://www.sublimemerge.com/; https://dl.acm.org/doi/pdf/10.1145/3805689.3812402.

## Zed vs Cursor for the reader role

Tested against the accumulated want-list: mouse-first file management, a VS Code-class debugger, intuitive out-of-the-box behavior with little config, native speed, open source or custom compilation if possible, Pi staying in Ghostty and Herdr, Grok Bot access, and coverage of Ruby/Rails, TypeScript, Go, and Python.
Local state: Zed.app is not installed; `~/.config/zed/settings.json` survives and matches the archived `old/zed/settings.json` except the agent model name, dating from a Zed-as-AI-editor period with `vim_mode` on.
Git history archives Zed in a bulk "archive retired configs" commit with no recorded reason, so there is no documented feature failure to re-litigate; the archived tasks even include an `open_in_ghostty` task, the same division of labor being considered now.

Where Zed meets or beats the list:

- Mouse-first file management: the project panel has a full right-click operations menu, multi-entry marking (cmd-click or shift-arrow), trash and delete with confirmation over the marked set, F2 rename, duplicate, reveal in Finder, drag-and-drop within the panel and from Finder into it, compare-two-marked-files diff, and undo/redo of file operations.
  This is the exact interaction that motivated the switch away from Neovim, present natively.
- Debugger: DAP with gutter-click breakpoints, right-click for conditional, log, and hit-count breakpoints, exception breakpoints, inline variable values on by default, built-in adapters for TypeScript, JavaScript, Go, Python, Rust, C/C++, and PHP, Ruby through the extension's `rdbg` adapter, automatic debug scenarios from tests and entry points for TypeScript, Go, Python, and Rust, and it loads existing `.vscode/launch.json` when no `.zed/debug.json` exists.
- Languages: TypeScript runs the same tsserver as Cursor; Go uses gopls in both; Python uses basedpyright and ruff against Cursor's Pyright fork (real Pylance is license-blocked in Cursor anyway); Ruby has a first-party-quality extension offering ruby-lsp or solargraph plus rubocop, Herb for ERB, and sorbet or steep.
- Performance and openness: Rust and GPUI native rendering; third-party benchmarks with varying methods put cold start at roughly 0.2-0.8 s against Cursor's 2.3-2.4 s and idle memory at roughly 140-280 MB against 420-920 MB (this machine's running Cursor measured 678 MB RSS), so treat the gap as directional and architectural rather than exact.
  Zed is GPL open source and buildable from source, which is the custom-compilation option Cursor structurally cannot offer, and it is free with no account when AI is off.
- Reader purity: one `disable_ai: true` switch (also offered at onboarding) turns off the agent panel, edit predictions, and inline assistant together, cleaner than Cursor's several settings.
- Droplet and Pi: SSH remote projects keep the UI local while language servers, terminals, tasks, and the debugger run on `agentbox`, so Zed can read Pi's live droplet tree with local responsiveness, and the `pi-acp` adapter in the ACP registry can host Pi itself in Zed's agent panel with sessions mapping to Pi's session files (an MVP adapter with documented limits).
  Cursor's Pi bridge is loopback-only and cannot do the droplet half of this.
- Discoverability: Zed shipped a graphical Settings Editor in fall 2025 precisely because JSON-only settings were undiscoverable, though advanced settings remain file-only; Cursor inherits VS Code's more mature settings and keymap UIs.

Where "all of the things" fails for Zed:

- No in-editor GitHub PR review.
  The git panel, project diff with per-hunk staging buttons, inline blame, and file history are solid, but reviewing a PR inside Zed is an open request whose suggested workaround is a text-based GitHub MCP flow through the agent; multiple users call it their blocker.
  Cursor has the GitHub PR extension ecosystem plus Bugbot deep links and the Graphite integration trajectory.
  In this setup the gap is softened because review already lives in Plannotator and GitHub, but it is a real absence under "all other software engineering tasks".
- The extension platform cannot host UI-heavy tools.
  Zed extensions have no custom-panel or webview equivalent, so entire categories cannot exist yet: database clients, Docker and Kubernetes explorers, REST clients, data viewers such as the parquet viewer in the current Cursor install, and there is no native Jupyter notebook UI.
  Zed's own community discussion frames this as why developers keep VS Code installed alongside Zed: the gap is platform capability, not editor features.
- Ruby setup friction is documented and specific: Zed expects `ruby-lsp` from the project Gemfile (with `ruby-lsp-rails` for schema and routes and `ruby-lsp-rspec` for test lenses), runs servers from the worktree root, and does not source the login shell, so subdirectory Gemfiles and mise or rbenv version resolution need worktree discipline or shim paths before Rails reading feels zero-config.
  Cursor inherits Shopify's reference VS Code extension behavior.
- Grok Bot and Bugbot are not Zed features at any price; they stay Cursor-plan or SuperGrok products used from their own apps, so a Zed reader plus a Cursor Pro subscription purely for bots and review remains a possible, if odd-looking, combination.
- Mobile is a tie: neither editor reads on iPhone, and the `github.dev` compromise is unchanged.

Scored against the stated wants, Zed delivers the mouse-first reader, the debugger (with Ruby as the one adapter to verify in a real Rails session), better speed, real open source, a cleaner AI off switch, better droplet reading, and a stronger Pi integration path, for free.
It does not deliver in-editor PR review, the long tail of UI extensions and notebooks, or zero-friction Rails setup, and its settings UI is younger than VS Code's.
"All of the things" is therefore close but not literal: roughly everything on the daily reader list, minus the PR-and-platform layer where Cursor's ecosystem is structurally ahead.
The low-regret shape is Zed as the primary reader with Cursor kept installed for overflow (PR UI, exotic extensions or adapters, notebooks), since Cursor is already installed and running and costs nothing to keep at the free tier, upgrading to Pro only if Grok Bot and Bugbot earn it.
Any trial should start with the two verification tasks that decide it: a Rails debugging session through `rdbg` in a real work repo, and an SSH remote project against `agentbox` reading a Pi working tree.

Sources: https://zed.dev/docs/project-panel; https://zed.dev/docs/debugger; https://zed.dev/docs/languages/ruby; https://zed.dev/docs/ai/configuration; https://zed.dev/blog/disable-ai-features; https://zed.dev/blog/settings-ui; https://zed.dev/docs/git; https://zed.dev/docs/remote-development; https://github.com/svkozak/pi-acp; https://github.com/zed-industries/zed/discussions/34759; https://github.com/zed-industries/zed/discussions/59308; https://blog.vsrinath.dev/ruby-lsp-keeps-crashing-in-your-monorepo-here-s-exactly-how-to-fix-it-in-zed; https://www.devtoolreviews.com/reviews/zed-vs-cursor-2026.

Mobile with Zed is the same list as with Cursor.
Zed officially ships only for macOS, Linux, and Windows.
The long-running iOS/Android port request explains why: Zed talks to OS APIs directly rather than through a portability layer, a mobile port means near-double platform code plus a touch UI rewrite, and iOS cannot run the language servers and dev tools the editor depends on, so most features could not run on-device anyway.
The team has pointed at eventual web support instead of native mobile, with no date, and has declined community iOS integration attempts for GPUI.
Zed's remote protocol also has no third-party clients: reading a remote project requires desktop Zed talking to its own headless server over SSH.
One genuinely new option exists: `zed-web`, an unofficial preview port that runs the real GPUI editor in a browser (WebGPU) with a Rust backend in a Docker container holding the workspace, language servers, terminals, and debuggers, single-user behind a token.
It could in principle run on `agentbox` behind `tailscale serve` as a self-hosted browser reader, but it is explicitly preview-grade (untested long-running deployments, incomplete desktop surface), needs Docker and a mounted workspace copy or volume, and on iPhone it inherits the same small-screen workbench problem as code-server, so it is a fun experiment rather than a recommendation.
The accepted `github.dev` compromise therefore stands unchanged whichever desktop reader wins, with Plannotator and Termius covering live-droplet reading, and two future events worth watching: an official Zed web client, and Rex's iOS client improving the terminal path.

Sources: https://github.com/zed-industries/zed/issues/12039; https://github.com/zee295/zed (zed-web branch) and https://github.com/zed-industries/zed/discussions/60629; https://zed.dev/docs/remote-development.

Try Cursor as reader-only for two weeks before touching anything else.
Do not stow Cursor config, register the Droplet as a My Machines worker, or set up Cloud Agent environments until the reader switch has proven itself.
Each of those is a separate decision with its own maintenance cost.

## Sources

- Cursor for iOS: https://cursor.com/docs/cloud-agent/mobile
- Cloud Agents: https://cursor.com/docs/cloud-agent
- Choose where Cloud Agents run: https://cursor.com/docs/cloud-agent/choose-runtime
- My Machines: https://cursor.com/docs/cloud-agent/self-hosted/my-machines
- Cloud agent setup and billing: https://cursor.com/docs/cloud-agent/setup
- Bugbot: https://cursor.com/docs/bugbot
- Cursor pricing: https://cursor.com/docs/account/pricing
- Migrate from VS Code: https://cursor.com/help/getting-started/migrate-vscode
- Pi IDE integration package: https://pi.dev/packages/pi-ide-integration
- VS Code external terminal (Ghostty support in source): https://github.com/microsoft/vscode/blob/main/src/vs/platform/externalTerminal/node/externalTerminalService.ts
- VS Code terminal basics: https://code.visualstudio.com/docs/terminal/basics
- Ghostty features and architecture: https://ghostty.org/docs/features and https://ghostty.org/docs/about
- This repo: `docs/plans/remote-agent-server.md`, `docs/research/cloud-agents-vps-and-phone.md`, `old/cursor/current-archive/cursor-performance-notes.md`
- Grok Bot: https://cursor.com/docs/grok-bot
- LazyVim: https://www.lazyvim.org/ and its debugging chapter at https://lazyvim-ambitious-devs.phillips.codes/course/chapter-17/
- nvim-dap: https://github.com/mfussenegger/nvim-dap (reads `.vscode/launch.json` automatically)
- sidekick.nvim: https://github.com/folke/sidekick.nvim
- Pi-Neovim bridges: https://pi.dev/packages/pi-nvim and https://github.com/aliou/nvim-pi
- neocursor.nvim (Cursor Tab backend in Neovim, beta): https://github.com/teocns/neocursor.nvim
- Neovide: https://neovide.dev/features.html
- Adam Drake, replacing Cursor with Neovim attempt: https://levelup.gitconnected.com/i-tried-to-replace-cursor-with-neovim-for-2-weeks-heres-why-i-switched-back-a1f927d8fe83
- Aman Azad, Moving On From Neovim: https://realamanazad.substack.com/p/moving-on-from-neovim
- Daniel Miessler, Replacing Cursor With Neovim and Claude Code: https://danielmiessler.com/blog/replacing-cursor-with-neovim-claude-code
- James Read, using both Cursor and Neovim: https://blog.jread.com/posts/i-use-cursor-ai/
- Kevin McKelvin, LazyVim stable productivity: https://kmckelvin.com/blog/2024/06/lazyvim-stable-productivity-with-neovim/
- Nick Janetakis, switching to Neovim/LazyVim: https://nickjanetakis.com/blog/why-i-switched-from-vim-to-neovim-lazyvim-and-how-i-did-it
- Cursor open source component notices: https://cursor.com/licenses
- VS Code source organization (TypeScript core, Electron workbench): https://github.com/microsoft/vscode/wiki/Source-Code-Organization
- Cursor performance troubleshooting: https://cursor.com/help/troubleshooting/performance
- Cursor Tab controls: https://cursor.com/help/ai-features/tab
- Cursor agent run modes: https://cursor.com/docs/agent/security/run-modes
- VS Code read-only files (`files.readonlyInclude`): https://github.com/microsoft/vscode/issues/183543
- Microsoft closed extensions blocked in forks: https://www.theregister.com/software/2025/04/24/microsoft-subtracts-c/c-extension-from-vs-code-forks/721912
- VSCodium build docs: https://github.com/VSCodium/vscodium/blob/master/docs/howto-build.md
