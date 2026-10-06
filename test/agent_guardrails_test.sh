#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
guardrails="$repo_dir/stow/bin/.local/share/agent-guardrails"
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

sql_app_dir=$(mktemp -d)
mkdir -p "$sql_app_dir/db/migrate"
printf "INSERT INTO \"schema_migrations\" (version) VALUES\n('20260801000000'),\n('20260901120000');\n" >"$sql_app_dir/db/structure.sql"
touch "$sql_app_dir/db/migrate/20260901120000_create_cards.rb" "$sql_app_dir/db/migrate/20261001090000_add_title_to_cards.rb"
expect block run_edit_hook "$sql_app_dir/db/migrate/20260901120000_create_cards.rb"
expect allow run_edit_hook "$sql_app_dir/db/migrate/20261001090000_add_title_to_cards.rb"
rm -rf "$sql_app_dir"

if [ "$failures" -ne 0 ]; then
    printf 'FAIL: %s agent guardrail expectation(s)\n' "$failures"
    exit 1
fi

printf 'PASS: agent guardrails block destructive Rails commands and generated Rails files\n'
