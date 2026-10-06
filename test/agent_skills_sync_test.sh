#!/bin/bash
set -euo pipefail

repo_dir=${1:?Pass the dotfiles repository directory}
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT

mkdir -p "$test_dir/repo/scripts" "$test_dir/bin" \
    "$test_dir/repo/stow/agents/.agents/skills/local-matt" \
    "$test_dir/repo/stow/agents/.agents/skills/local-dmm" \
    "$test_dir/matt/skills/engineering/local-matt" \
    "$test_dir/matt/skills/engineering/upstream" \
    "$test_dir/dmm/home/.agents/skills/local-dmm" \
    "$test_dir/dmm/home/.agents/skills/upstream" \
    "$test_dir/matt/skills/engineering/dropped-matt" \
    "$test_dir/dmm/home/.agents/skills/dropped-dmm"

cp "$repo_dir/scripts/update_agent_skills.sh" "$test_dir/repo/scripts/"
skills_dir="$test_dir/repo/stow/agents/.agents/skills"
printf 'local Matt customization\n' >"$skills_dir/local-matt/SKILL.md"
printf 'local Dillon customization\n' >"$skills_dir/local-dmm/SKILL.md"
printf '# skill\tsource\ndropped-dmm\texcluded\ndropped-matt\texcluded\nlocal-matt\tlocal\nlocal-dmm\tlocal\n' >"$skills_dir/.skill-sources.tsv"
printf 'Matt replacement\n' >"$test_dir/matt/skills/engineering/local-matt/SKILL.md"
printf 'Dillon replacement\n' >"$test_dir/dmm/home/.agents/skills/local-dmm/SKILL.md"
printf 'Matt baseline\n' >"$test_dir/matt/skills/engineering/upstream/SKILL.md"
printf 'Dillon collision\n' >"$test_dir/dmm/home/.agents/skills/upstream/SKILL.md"
printf 'Matt skill the user removed\n' >"$test_dir/matt/skills/engineering/dropped-matt/SKILL.md"
printf 'Dillon skill the user removed\n' >"$test_dir/dmm/home/.agents/skills/dropped-dmm/SKILL.md"

cat >"$test_dir/bin/git" <<'EOF'
#!/bin/bash
set -euo pipefail
if [ "$1" = "clone" ]; then
    case "$5" in
        https://github.com/mattpocock/skills.git) source_dir="$FIXTURE_ROOT/matt" ;;
        https://github.com/dmmulroy/.dotfiles.git) source_dir="$FIXTURE_ROOT/dmm" ;;
        *) exit 1 ;;
    esac
    cp -R "$source_dir" "$6"
elif [ "$1" = "-C" ] && [ "$3" = "rev-parse" ]; then
    printf 'fixture-sha\n'
else
    exit 1
fi
EOF
chmod +x "$test_dir/bin/git"

PATH="$test_dir/bin:$PATH" FIXTURE_ROOT="$test_dir" \
    bash "$test_dir/repo/scripts/update_agent_skills.sh" --sync >"$test_dir/sync.log"

grep -Fxq 'local Matt customization' "$skills_dir/local-matt/SKILL.md"
grep -Fxq 'local Dillon customization' "$skills_dir/local-dmm/SKILL.md"
grep -Fxq 'Matt baseline' "$skills_dir/upstream/SKILL.md"
awk -F '\t' '$1 == "local-matt" && $2 == "local" { found=1 } END { exit !found }' "$skills_dir/.skill-sources.tsv"
awk -F '\t' '$1 == "local-dmm" && $2 == "local" { found=1 } END { exit !found }' "$skills_dir/.skill-sources.tsv"
awk -F '\t' '$1 == "upstream" && $2 == "matt" { found=1 } END { exit !found }' "$skills_dir/.skill-sources.tsv"
[ ! -e "$skills_dir/dropped-matt" ]
[ ! -e "$skills_dir/dropped-dmm" ]
awk -F '\t' '$1 == "dropped-matt" && $2 == "excluded" { found=1 } END { exit !found }' "$skills_dir/.skill-sources.tsv"
awk -F '\t' '$1 == "dropped-dmm" && $2 == "excluded" { found=1 } END { exit !found }' "$skills_dir/.skill-sources.tsv"

PATH="$test_dir/bin:$PATH" FIXTURE_ROOT="$test_dir" \
    bash "$test_dir/repo/scripts/update_agent_skills.sh" --check >"$test_dir/check.log"

printf 'PASS: skill sync preserves local ownership, keeps excluded skills out, and keeps Matt baseline precedence\n'
