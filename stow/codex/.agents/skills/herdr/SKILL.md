---
name: herdr
description: Control Herdr workspaces, tabs, panes, and coding agents through its CLI when running inside a Herdr-managed pane.
---

# Herdr agent workflow

Before using this skill, check that `HERDR_ENV=1`. If it is not, explain that the current process is not inside Herdr and stop.

Herdr workspaces are project contexts, tabs are subcontexts, and panes are real terminals. IDs can change when items close, so list current resources instead of reusing stale IDs.

## Discover

```bash
herdr workspace list
herdr tab list
herdr pane list
herdr agent list
```

The focused pane is the current agent's pane. Do not control it through Herdr unless the user explicitly asks.

## Create and manage workspaces and tabs

```bash
herdr workspace create --cwd /path/to/project --label project --no-focus
herdr workspace focus <workspace-id>
herdr workspace rename <workspace-id> <label>
herdr workspace close <workspace-id>

herdr tab create --workspace <workspace-id> --label logs --no-focus
herdr tab focus <tab-id>
herdr tab rename <tab-id> <label>
herdr tab close <tab-id>
```

## Split panes and run commands

```bash
herdr pane split --current --direction right --no-focus
herdr pane split --current --direction down --no-focus
herdr pane run <pane-id> "npm test"
herdr pane read <pane-id> --source recent-unwrapped --lines 100
herdr pane close <pane-id>
```

Parse the new pane ID from `result.pane.pane_id` in the split response. Prefer `pane run` over separate text and Enter operations.

## Coordinate agents

```bash
herdr agent list
herdr agent start codex --cwd /path/to/project --split right --no-focus -- codex
herdr agent focus <agent-target>
herdr agent read <agent-target> --source recent-unwrapped --lines 100
herdr agent send <agent-target> "review the current changes"
herdr agent wait <agent-target> --status done --timeout 120000
```

Use `--no-focus` when creating background work. Inspect existing output with `read`, and use `wait` only for future state or output. Do not guess IDs.
