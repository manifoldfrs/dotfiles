#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
guardrails="$repo_dir/stow/codex/.codex/hooks"
agy_guardrail="$repo_dir/stow/antigravity/.gemini/config/hooks/agy-pretool-guardrail.sh"
app_dir=$(mktemp -d)
trap 'rm -rf "$app_dir"' EXIT
failures=0

mkdir -p "$app_dir/db/migrate" "$app_dir/config/credentials"
cat >"$app_dir/db/schema.rb" <<'RUBY'
ActiveRecord::Schema[8.0].define(version: 2026_09_01_120000) do
end
RUBY
touch "$app_dir/db/migrate/20260901120000_create_cards.rb"
touch "$app_dir/db/migrate/20261001090000_add_title_to_cards.rb"

run_bash_hook() {
    jq -n --arg command "$1" '{tool_input: {command: $command}}' \
        | bash "$guardrails/block-dangerous-bash.sh" >/dev/null 2>&1
}

run_edit_hook() {
    jq -n --arg path "$1" --arg cwd "$app_dir" '{cwd: $cwd, tool_input: {file_path: $path}}' \
        | bash "$guardrails/block-generated-edits.sh" >/dev/null 2>&1
}

run_codex_patch_hook() {
    local patch
    patch=$(printf '*** Begin Patch\n*** Update File: %s\n@@\n-end\n+end # fixture\n*** End Patch' "$1")
    jq -n --arg patch "$patch" --arg cwd "$app_dir" \
        '{cwd: $cwd, hook_event_name: "PreToolUse", tool_name: "apply_patch", tool_input: {command: $patch}}' \
        | bash "$guardrails/block-generated-edits.sh" >/dev/null 2>&1
}

expect() {
    local expected=$1
    local hook=$2
    local value=$3
    local status=0
    "$hook" "$value" || status=$?
    if { [ "$expected" = block ] && [ "$status" -ne 2 ]; } || { [ "$expected" = allow ] && [ "$status" -ne 0 ]; }; then
        printf 'FAIL: expected %s (%s): %s, got exit %s\n' "$expected" "$hook" "$value" "$status"
        failures=$((failures + 1))
    fi
}

expect block run_bash_hook 'bin/rails db:drop'
expect block run_bash_hook 'bundle exec rake db:reset'
expect block run_bash_hook 'bin/rails db:schema:load'
expect block run_bash_hook 'bin/rails db:purge'
expect block run_bash_hook 'bin/rails db:seed:replant'
expect block run_bash_hook 'bin/rails db:truncate_all'
expect block run_bash_hook 'RAILS_ENV=production bin/rails db:migrate'
expect block run_bash_hook 'bin/rails runner -e production "User.count"'
expect block run_bash_hook 'bin/rails console --environment=production'
expect block run_bash_hook 'DISABLE_DATABASE_ENVIRONMENT_CHECK=1 bin/rails db:migrate'
expect block run_bash_hook 'bin/rails credentials:edit'
expect allow run_bash_hook 'RAILS_ENV=test bin/rails db:reset'
expect allow run_bash_hook 'bin/rails db:migrate'
expect allow run_bash_hook 'bin/rails db:rollback'
expect allow run_bash_hook 'bin/rails test test/models/card_test.rb'
expect allow run_bash_hook 'bin/rails credentials:show'
expect allow run_bash_hook 'rg production config/deploy.yml'

expect block run_edit_hook "$app_dir/db/schema.rb"
expect block run_edit_hook 'db/schema.rb'
expect block run_codex_patch_hook "$app_dir/db/schema.rb"
expect allow run_codex_patch_hook "$app_dir/db/seeds.rb"
expect block run_edit_hook "$app_dir/db/queue_schema.rb"
expect block run_edit_hook "$app_dir/db/structure.sql"
expect block run_edit_hook "$app_dir/Gemfile.lock"
expect block run_edit_hook "$app_dir/config/credentials.yml.enc"
expect block run_edit_hook "$app_dir/config/credentials/production.yml.enc"
expect block run_edit_hook "$app_dir/config/master.key"
expect block run_edit_hook "$app_dir/config/credentials/production.key"
expect block run_edit_hook "$app_dir/db/migrate/20260901120000_create_cards.rb"
expect block run_edit_hook 'db/migrate/20260901120000_create_cards.rb'
expect allow run_edit_hook "$app_dir/db/migrate/20261001090000_add_title_to_cards.rb"
expect allow run_edit_hook "$app_dir/db/migrate/20261002090000_add_body_to_cards.rb"
expect allow run_edit_hook "$app_dir/db/seeds.rb"
expect allow run_edit_hook "$app_dir/app/models/card.rb"
expect allow run_edit_hook "$app_dir/Gemfile"

expect block run_bash_hook 'git commit --no-verify -m wip'
expect block run_bash_hook 'git push --force origin main'
expect block run_bash_hook 'rm -rf /'
expect block run_bash_hook 'rm -rf /*'
expect block run_bash_hook 'rm -rf / && echo done'
expect block run_bash_hook 'rm -rf ~'
expect allow run_bash_hook 'rm -rf ./build'
expect allow run_bash_hook 'rm -rf build/'
expect block run_bash_hook 'git add -p'
expect block run_bash_hook 'git add -i src'
expect block run_bash_hook 'git add -Ap'
expect block run_bash_hook 'git add src --patch'
expect block run_bash_hook 'git add -A -p && git commit'
expect allow run_bash_hook 'git add -A && git status | rg -i staged'
expect allow run_bash_hook 'git add src/ip.ts && grep -p foo'
expect allow run_bash_hook 'git add -u'
expect block run_bash_hook 'git add --all -p'
expect block run_bash_hook 'git add --verbose --patch src'
expect block run_bash_hook 'git add -- . -p'
expect block run_bash_hook 'git add --pathspec-from-file=list -p'
expect allow run_bash_hook 'git add --all'
expect allow run_bash_hook 'git branch -D ci/vercel-ci-trial ci/vercel-ci-measure'

expect block run_bash_hook 'rm -fr /usr'
expect block run_bash_hook 'rm -r -f /'
expect block run_bash_hook 'rm --recursive --force /'
expect block run_bash_hook 'rm -rf ./build /'
expect block run_bash_hook 'rm -rf "$HOME"'
expect block run_bash_hook 'rm -rf ${HOME}/'
expect block run_bash_hook 'rm -rf ~/*'
expect block run_bash_hook 'rm -rf /Users/frshbb'
expect allow run_bash_hook 'rm -rf /tmp/agent-artifacts/x'
expect allow run_bash_hook 'rm -rf /Users/frshbb/code/foo/.worktrees/x'
expect allow run_bash_hook 'rm -rf ~/.cache/foo'
expect allow run_bash_hook 'rm -rf "$TMPDIR/foo"'
expect allow run_bash_hook 'rm -f /etc/hosts.bak'

expect block run_bash_hook 'git push origin +main'
expect block run_bash_hook 'git push origin +HEAD:main'
expect block run_bash_hook 'git push origin main --force'
expect block run_bash_hook 'git push --force origin "main"'
expect block run_bash_hook 'git push -f origin master'
expect block run_bash_hook '(git push --force origin main)'
expect allow run_bash_hook 'git push --force origin feature/x && git checkout main'
expect allow run_bash_hook 'git push --force-with-lease origin feature/x'
expect allow run_bash_hook 'git push origin +feature/main'
expect allow run_bash_hook 'git push origin main'

expect block run_bash_hook 'cd src && git commit --no-verify -m wip'
expect block run_bash_hook 'git -c commit.gpgsign=false commit -m wip'
expect allow run_bash_hook 'echo "do not use --no-verify" > notes.md'
expect allow run_bash_hook 'rg -- --no-verify stow'
expect allow run_bash_hook 'git commit -m "explain why git commit --no-verify is refused"'
expect allow run_bash_hook 'git commit -m "remove rm -rf / guard"'
expect allow run_bash_hook 'echo "bin/rails db:drop is refused"'
expect allow run_bash_hook $'git commit -m "$(cat <<\'EOF\'\nstop git commit --no-verify and rm -rf / false positives, it\'s noisy\nEOF\n)"'
expect allow run_bash_hook $'cat > notes.md <<\'EOF\'\ngit push --force origin main\nEOF'

expect block run_bash_hook 'bash -c "git push --force origin main"'
expect block run_bash_hook "ssh host 'rm -rf /'"
expect block run_bash_hook 'eval "git commit --no-verify -m wip"'
expect block run_bash_hook $'bash <<\'EOF\'\nrm -rf /\nEOF'
expect block run_bash_hook $'cat <<\'EOF\' | sh\ngit reset --hard\nEOF'
expect block run_bash_hook 'RAILS_ENV="production" bin/rails db:migrate'
expect block run_bash_hook 'git reset --hard'
expect block run_bash_hook 'git restore . && git status'

sql_app_dir=$(mktemp -d)
mkdir -p "$sql_app_dir/db/migrate"
printf "INSERT INTO \"schema_migrations\" (version) VALUES\n('20260801000000'),\n('20260901120000');\n" >"$sql_app_dir/db/structure.sql"
touch "$sql_app_dir/db/migrate/20260901120000_create_cards.rb" "$sql_app_dir/db/migrate/20261001090000_add_title_to_cards.rb"
expect block run_edit_hook "$sql_app_dir/db/migrate/20260901120000_create_cards.rb"
expect allow run_edit_hook "$sql_app_dir/db/migrate/20261001090000_add_title_to_cards.rb"
rm -rf "$sql_app_dir"

expect_agy() {
    local expected=$1
    local mode=$2
    local payload=$3
    local status=0
    local out
    out=$(printf '%s' "$payload" | bash "$agy_guardrail" "$mode" 2>&1) || status=$?
    if [ "$status" -ne 0 ]; then
        printf 'FAIL: agy adapter exited %s for %s: %s\n' "$status" "$mode" "$out"
        failures=$((failures + 1))
        return
    fi
    local decision reason
    decision=$(printf '%s' "$out" | jq -r '.decision // empty' 2>/dev/null) || decision=""
    reason=$(printf '%s' "$out" | jq -r '.reason // empty' 2>/dev/null) || reason=""
    if [ "$decision" != "$expected" ] || { [ "$expected" = deny ] && [ -z "$reason" ]; }; then
        printf 'FAIL: expected agy %s (%s), got output: %s\n' "$expected" "$mode" "$out"
        failures=$((failures + 1))
    fi
}

expect_agy deny bash "$(jq -n '{toolCall: {name: "run_command", args: {CommandLine: "git push --force origin main"}}}')"
expect_agy deny bash "$(jq -n '{toolCall: {name: "run_command", args: {CommandLine: "bin/rails db:drop"}}}')"
expect_agy deny bash "$(jq -n '{toolCall: {name: "run_command", args: {CommandLine: "rm -rf /"}}}')"
expect_agy allow bash "$(jq -n '{toolCall: {name: "run_command", args: {CommandLine: "git status"}}}')"
expect_agy allow bash "$(jq -n '{toolCall: {name: "run_command", args: {CommandLine: "RAILS_ENV=test bin/rails db:reset"}}}')"
expect_agy deny edit "$(jq -n --arg path "$app_dir/db/schema.rb" --arg cwd "$app_dir" '{cwd: $cwd, toolCall: {name: "edit_file", args: {Path: $path}}}')"
expect_agy deny edit "$(jq -n --arg path 'db/migrate/20260901120000_create_cards.rb' --arg cwd "$app_dir" '{cwd: $cwd, toolCall: {name: "write_file", args: {Path: $path}}}')"
expect_agy deny edit "$(jq -n --arg path "$app_dir/Gemfile.lock" --arg cwd "$app_dir" '{cwd: $cwd, toolCall: {name: "replace_file_content", args: {TargetFile: $path}}}')"
expect_agy allow edit "$(jq -n --arg path "$app_dir/app/models/card.rb" --arg cwd "$app_dir" '{cwd: $cwd, toolCall: {name: "edit_file", args: {Path: $path}}}')"
expect_agy allow edit "$(jq -n --arg path "$app_dir/db/migrate/20261001090000_add_title_to_cards.rb" --arg cwd "$app_dir" '{cwd: $cwd, toolCall: {name: "edit_file", args: {Path: $path}}}')"
expect_agy deny bash '{malformed json'
expect_agy deny edit '{malformed json'

if [ "$failures" -ne 0 ]; then
    printf 'FAIL: %s agent guardrail expectation(s)\n' "$failures"
    exit 1
fi

printf 'PASS: agent guardrails block destructive Rails commands and generated Rails files\n'
