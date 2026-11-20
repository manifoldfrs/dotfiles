#!/usr/bin/env bash
# Shared agent hook: block dangerous bash patterns.
# Exit 2 = block with stderr shown to the agent. Exit 0 = allow.
# Accepts Claude-style and Codex-style hook JSON payloads.

set -uo pipefail
trap 'echo "Hook error in $(basename "$0") at line $LINENO. Failing closed." >&2; exit 2' ERR

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not installed but required by $(basename "$0"). Install jq or remove this hook." >&2
  exit 2
fi

input=$(cat) || { echo "Hook $(basename "$0"): failed to read stdin. Failing closed." >&2; exit 2; }
cmd=$(printf '%s' "$input" | jq -r '
  def parsed_arguments:
    if (.arguments? | type) == "string" then
      try (.arguments | fromjson) catch {}
    elif (.arguments? | type) == "object" then
      .arguments
    else
      {}
    end;

  [
    .tool_input.command?,
    .input.command?,
    .params.command?,
    .command?,
    .toolCall.arguments.command?,
    .tool_call.arguments.command?,
    parsed_arguments.command?
  ]
  | map(select(type == "string" and length > 0))
  | .[0] // empty
' 2>/dev/null) || {
  echo "Hook $(basename "$0"): malformed JSON input. Failing closed." >&2
  exit 2
}
[ -z "$cmd" ] && exit 0

# Heredoc bodies and quoted prose only mention flags and paths, so rules must not see them.
# Quoted single tokens keep their text so "main" and "$HOME" still match.
mask_filter=$(cat <<'JQ'
gsub("<<-?\\s*[\"']?(?<tag>\\w+)[\"']?(?<rest>[^\\n]*)[\\s\\S]*?\\n\\s*\\k<tag>\\b"; .rest)
| gsub("(?<quoted>'[^']*'|\"(?:[^\"\\\\]|\\\\[\\s\\S])*\")";
    .quoted[1:-1] as $inner
    | if ($inner | test("\\s")) and ($inner | test("\\$\\(|`") | not) then "\"\"" else $inner end)
JQ
)
scan=$cmd
# jq's gsub is quadratic and this hook has a 5s timeout, so long commands stay unmasked.
if [ "${#cmd}" -le 32768 ]; then
  scan=$(printf '%s' "$cmd" | jq -Rrs "$mask_filter" 2>/dev/null) || {
    echo "Hook $(basename "$0"): failed to parse the command. Failing closed." >&2
    exit 2
  }
fi

# Text handed to another shell is real code, so check it with only the quote marks removed.
shell_wrapper='(^|[;&|[:space:]])((bash|sh|zsh|dash)([[:space:]]+-[a-zA-Z]*c|[[:space:]]*([<|;&]|$))|eval[[:space:]]|ssh[[:space:]])'
if grep -qE "$shell_wrapper" <<<"$scan"; then
  scan=${cmd//[\"\']/ }
fi

# One simple command per line, so a rule's conditions must all hold in the same command.
segments=$(printf '%s\n' "$scan" | tr ';&|()`' '\n\n\n\n\n\n')

# --no-verify (skips pre-commit hooks)
if grep -qE '(^|[[:space:]/])git[[:space:]].*(^|[^A-Za-z0-9_])--no-verify([^A-Za-z0-9_]|$)' <<<"$segments"; then
  echo "Refusing --no-verify. If a pre-commit hook fails, fix the underlying issue." >&2
  exit 2
fi

# --no-gpg-sign / -c commit.gpgsign=false
if grep -qE '(^|[[:space:]/])git[[:space:]].*(^|[^A-Za-z0-9_])(--no-gpg-sign|commit\.gpgsign=false)([^A-Za-z0-9_]|$)' <<<"$segments"; then
  echo "Refusing to bypass GPG signing." >&2
  exit 2
fi

# git push --force / -f / +refspec targeting a protected branch (main, master, sandbox, production, release)
# Match space, colon or plus before the branch name (NOT slash, which would false-match user/main, feature/main).
# Match space or end-of-line after the branch name (allows main:main refspec, blocks main alone).
if grep -E 'git[[:space:]]+push' <<<"$segments" \
   | grep -E '(--force(-with-lease)?([[:space:]=]|$)|[[:space:]]-f([[:space:]]|$)|[[:space:]]\+[^[:space:]])' \
   | grep -E '[[:space:]:+](main|master|sandbox|production|release)([[:space:]:]|$)' >/dev/null; then
  echo "Refusing force-push to a protected branch (main/master/sandbox/production/release)." >&2
  echo "If this is intentional, ask the user to confirm and run it themselves." >&2
  echo "Tip: 'git push --force-with-lease' is safer than '--force' when you do need to force." >&2
  exit 2
fi

# git rebase -i (interactive, no TTY in agent context)
if grep -qE 'git[[:space:]]+rebase[[:space:]].*-i([[:space:]]|$)' <<<"$segments"; then
  echo "Refusing 'git rebase -i'. Interactive rebase needs a terminal the agent does not have." >&2
  exit 2
fi

# git add -i / -p (interactive)
if grep -qE 'git[[:space:]]+add([[:space:]]+[^-;&|[:space:]][^;&|[:space:]]*|[[:space:]]+-{1,2}[a-zA-Z][-a-zA-Z=]*|[[:space:]]+--)*[[:space:]]+(-[a-zA-Z]*[ip][a-zA-Z]*|--interactive|--patch)([[:space:];&|=]|$)' <<<"$segments"; then
  echo "Refusing interactive 'git add -i' or '-p'. Stage specific files by name instead." >&2
  exit 2
fi

# Recursive rm of the filesystem root, a home directory, or a top-level system directory
rm_target='(/\*?|/(Applications|Library|System|Users|Volumes|bin|etc|home|lib|opt|private|root|sbin|usr|var)/?\*?|/(Users|home)/[^/[:space:]]+/?\*?|~/?\*?|\$HOME/?\*?|\$\{HOME\}/?\*?)'
if grep -E '(^|[[:space:]/])rm[[:space:]]' <<<"$segments" \
   | grep -E '[[:space:]](-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$)' \
   | grep -E "[[:space:]]$rm_target([[:space:]]|\$)" >/dev/null; then
  echo "Refusing recursive 'rm' of the root, a home directory, or a top-level system directory." >&2
  echo "If this is necessary, run it yourself outside the agent." >&2
  exit 2
fi

# git reset --hard with no ref (resets working tree to HEAD, destroys uncommitted work)
if grep -qE 'git[[:space:]]+reset[[:space:]]+--hard[[:space:]]*$' <<<"$segments"; then
  echo "Refusing 'git reset --hard' without a target ref. This destroys uncommitted work." >&2
  exit 2
fi

# git checkout -- . / git restore . (destroys all working tree changes)
if grep -qE 'git[[:space:]]+(checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+\.)([[:space:]]|$)' <<<"$segments"; then
  echo "Refusing wholesale working-tree discard ('git checkout -- .' or 'git restore .')." >&2
  echo "Restore specific files instead." >&2
  exit 2
fi

# Rails and Rake commands, used by the Rails checks below
rails_command='(^|[^A-Za-z0-9_./-])(bin/rails|bin/rake|rails|rake)[[:space:]]'

# Destructive Rails database tasks, allowed only when explicitly targeting the test database
if grep -qE "$rails_command" <<<"$scan" \
   && grep -qE '(^|[[:space:]])db:(drop|reset|purge|truncate_all|schema:load|structure:load|seed:replant)([[:space:]]|$)' <<<"$scan" \
   && ! grep -qE '(^|[[:space:]])RAILS_ENV=test([[:space:]]|$)' <<<"$scan"; then
  echo "Refusing a destructive Rails database task outside RAILS_ENV=test." >&2
  echo "These tasks erase development data. Ask the user to run it, or prefix RAILS_ENV=test for the test database." >&2
  exit 2
fi

# Rails or Rake commands targeting production
if grep -qE "$rails_command" <<<"$scan" \
   && grep -qE '((RAILS|RACK)_ENV=production|(-e|--environment)[[:space:]=]production)([[:space:]]|$)' <<<"$scan"; then
  echo "Refusing a Rails command against production. Ask the user to run it." >&2
  exit 2
fi

# Disabling Rails' protected-environment check
if grep -qE '(^|[[:space:]])DISABLE_DATABASE_ENVIRONMENT_CHECK=1' <<<"$scan"; then
  echo "Refusing to bypass Rails' protected-environment database check." >&2
  exit 2
fi

# Interactive credentials editing (needs a terminal editor and the master key)
if grep -qE "$rails_command" <<<"$scan" \
   && grep -qE '(^|[[:space:]])credentials:edit([[:space:]]|$)' <<<"$scan"; then
  echo "Refusing 'credentials:edit'. It opens an interactive editor on secrets; ask the user to run it." >&2
  exit 2
fi

exit 0
