#!/usr/bin/env bash
# PreToolUse hook: block dangerous bash patterns.
# Exit 2 = block with stderr shown to model. Exit 0 = allow.
# Fail-closed: any unexpected error converts to exit 2 (block) rather than the
# default exit 1 from `set -e`, which Claude Code treats as non-blocking.

set -uo pipefail
trap 'echo "Hook error in $(basename "$0") at line $LINENO. Failing closed." >&2; exit 2' ERR

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not installed but required by $(basename "$0"). Install jq or remove this hook." >&2
  exit 2
fi

input=$(cat) || { echo "Hook $(basename "$0"): failed to read stdin. Failing closed." >&2; exit 2; }
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null) || {
  echo "Hook $(basename "$0"): malformed JSON input. Failing closed." >&2
  exit 2
}
[ -z "$cmd" ] && exit 0

# --no-verify (skips pre-commit hooks)
if echo "$cmd" | grep -qE '(^|[^A-Za-z0-9_])--no-verify([^A-Za-z0-9_]|$)'; then
  echo "Refusing --no-verify. If a pre-commit hook fails, fix the underlying issue." >&2
  exit 2
fi

# --no-gpg-sign / -c commit.gpgsign=false
if echo "$cmd" | grep -qE '(^|[^A-Za-z0-9_])(--no-gpg-sign|commit\.gpgsign=false)([^A-Za-z0-9_]|$)'; then
  echo "Refusing to bypass GPG signing." >&2
  exit 2
fi

# git push --force / -f targeting a protected branch (main, master, sandbox, production, release)
# Match space or colon before the branch name (NOT slash, which would false-match user/main, feature/main).
# Match space or end-of-line after the branch name (allows main:main refspec, blocks main alone).
if echo "$cmd" | grep -qE 'git[[:space:]]+push.*(--force[[:space:]=]|--force-with-lease([[:space:]=]|$)|[[:space:]]-f([[:space:]]|$))' \
   && echo "$cmd" | grep -qE '[[:space:]:](main|master|sandbox|production|release)([[:space:]:]|$)'; then
  echo "Refusing force-push to a protected branch (main/master/sandbox/production/release)." >&2
  echo "If this is intentional, ask the user to confirm and run it themselves." >&2
  echo "Tip: 'git push --force-with-lease' is safer than '--force' when you do need to force." >&2
  exit 2
fi

# git rebase -i (interactive, no TTY in agent context)
if echo "$cmd" | grep -qE 'git[[:space:]]+rebase[[:space:]].*-i([[:space:]]|$)'; then
  echo "Refusing 'git rebase -i'. Interactive rebase needs a terminal the agent does not have." >&2
  exit 2
fi

# git add -i / -p (interactive)
if echo "$cmd" | grep -qE 'git[[:space:]]+add[[:space:]].*-(i|p)([[:space:]]|$)'; then
  echo "Refusing interactive 'git add -i' or '-p'. Stage specific files by name instead." >&2
  exit 2
fi

# rm -rf on absolute paths (rm -rf /, rm -rf ~, rm -rf $HOME)
if echo "$cmd" | grep -qE 'rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[[:space:]]+(/[a-zA-Z]|~|\$HOME|\$\{HOME)'; then
  echo "Refusing 'rm -rf' targeting an absolute or home path." >&2
  echo "If this is necessary, run it yourself outside the agent." >&2
  exit 2
fi

# git reset --hard with no ref (resets working tree to HEAD, destroys uncommitted work)
if echo "$cmd" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard[[:space:]]*($|[|;&])'; then
  echo "Refusing 'git reset --hard' without a target ref. This destroys uncommitted work." >&2
  exit 2
fi

# git checkout -- . / git restore . (destroys all working tree changes)
if echo "$cmd" | grep -qE 'git[[:space:]]+(checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+\.)([[:space:]]|$)'; then
  echo "Refusing wholesale working-tree discard ('git checkout -- .' or 'git restore .')." >&2
  echo "Restore specific files instead." >&2
  exit 2
fi

# git branch -D (force-delete branch)
if echo "$cmd" | grep -qE 'git[[:space:]]+branch[[:space:]].*-D([[:space:]]|$)'; then
  echo "Refusing 'git branch -D' (force-delete). Use '-d' or ask the user." >&2
  exit 2
fi

exit 0
