# Cursor performance notes

## What I found locally

- Your global Cursor settings live in `~/Library/Application Support/Cursor/User/settings.json`.
- You currently do **not** have `files.watcherExclude`, `search.exclude`, or `files.exclude` configured there.
- You already have `cursor.processExplorer.enabled: false`, which is good.
- You have a few potentially heavier editor features enabled:
  - `cursor.general.enableShadowWorkspace: true`
  - `editor.inlineSuggest.enabled: true`
  - `editor.semanticHighlighting.enabled: true`
  - `editor.bracketPairColorization.enabled: true`
- Local Cursor data is fairly large:
  - `workspaceStorage`: ~234 MB
  - `History`: ~102 MB
  - `.cursor/extensions`: ~632 MB
- One large workspace storage entry is tied to `frshbb.github.io.code-workspace` and contains a large `ms-vscode.js-debug` profile cache.

## Recommendations to test

### 1. Add watcher/search excludes

Recent Cursor docs and forum guidance suggest `.cursorignore` helps indexing, but `files.watcherExclude` is still the practical fix for large generated folders causing CPU/RAM churn.

Suggested settings to try:

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/coverage/**": true,
    "**/.venv/**": true,
    "**/__pycache__/**": true,
    "**/.pytest_cache/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true,
    "**/.venv": true
  },
  "files.exclude": {
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true
  }
}
```

### 2. Add repo-level ignore files

For repos that feel slow, add:

- `.cursorignore` for files/folders AI should not access
- `.cursorindexingignore` for files/folders AI can access occasionally but should not index

Good candidates:

- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `coverage/`
- `.venv/`
- `__pycache__/`
- test output folders
- generated assets
- large logs

### 3. Test disabling expensive editor features

If typing, file switching, or large-file rendering feels laggy, test these one at a time:

- `cursor.general.enableShadowWorkspace`
- `editor.inlineSuggest.enabled`
- `editor.semanticHighlighting.enabled`
- `editor.bracketPairColorization.enabled`

### 4. Audit extensions

Cursor's troubleshooting docs recommend:

- enable the Extension Monitor
- use `Developer: Open Extension Monitor`
- use `Developer: Open Process Explorer`
- test with `cursor --disable-extensions`

If performance improves with extensions disabled, re-enable them gradually.

### 5. Clean stale local state

Potential cleanup areas:

- old `workspaceStorage` entries
- old `History` entries
- unused extensions in `.cursor/extensions`
- large debug/session caches under workspace storage

## Notes from docs and research

### Cursor docs

- Cursor recommends `.cursorignore` and `.cursorindexingignore` to reduce indexing scope and improve performance in large codebases.
- Cursor troubleshooting guidance for CPU/RAM issues points to extension/resource diagnosis first.
- Cursor docs also note that large codebases naturally use more resources.

### Forum guidance

- Recent reports indicate file watching may still scan paths you would expect ignore files to cover.
- The practical workaround repeatedly suggested is `files.watcherExclude`, especially on macOS and in repos with large generated output.

## Security note

- `~/Library/Application Support/Cursor/User/syncLocalSettings.json` contains a GitHub token in plain text.
- Rotate that token when convenient.
