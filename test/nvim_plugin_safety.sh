#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_REF="HEAD"
SKIP_TMUX=0
ALLOW_LOCKFILE_CHANGE=0

usage() {
  cat <<'EOF'
Usage: bash test/nvim_plugin_safety.sh [options]

Options:
  --base-ref <ref>            Base git ref for one-by-one plugin rollout (default: HEAD)
  --skip-tmux                 Skip tmux startup verification
  --allow-lockfile-change     Allow nvim/lazy-lock.json checksum changes
  -h, --help                  Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-ref)
      BASE_REF="$2"
      shift 2
      ;;
    --skip-tmux)
      SKIP_TMUX=1
      shift
      ;;
    --allow-lockfile-change)
      ALLOW_LOCKFILE_CHANGE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[FAIL] Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

if ! command -v nvim >/dev/null 2>&1; then
  echo "[FAIL] nvim is required for plugin safety checks"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[FAIL] Must run inside a git repository"
  exit 1
fi

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "[FAIL] Invalid base ref: $BASE_REF"
  exit 1
fi

checksum_file() {
  local file_path="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file_path" | awk '{print $1}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{print $1}'
    return
  fi
  echo "[FAIL] Requires shasum or sha256sum for lockfile verification" >&2
  exit 1
}

LOCKFILE="$ROOT_DIR/nvim/lazy-lock.json"
LOCK_BEFORE="$(checksum_file "$LOCKFILE")"

SANDBOX_DIR="$(mktemp -d "${TMPDIR:-/tmp}/nvim-sandbox.XXXXXX")"
SNAPSHOT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/nvim-snapshot.XXXXXX")"
SNAPSHOT_FILE="$SNAPSHOT_DIR/nvim-config-snapshot.tgz"
trap 'rm -rf "$SANDBOX_DIR" "$SNAPSHOT_DIR"' EXIT

tar -czf "$SNAPSHOT_FILE" -C "$ROOT_DIR" nvim

echo "=== Neovim Plugin Safety Checks ==="
echo "[INFO] Base ref: $BASE_REF"
echo "[INFO] Snapshot: $SNAPSHOT_FILE"
echo ""

echo "[CHECK 1] Guard against background mutation traps..."
if grep -R -n 'Snacks\.toggle\.option("background"' nvim/lua/plugins >/dev/null 2>&1; then
  echo "[FAIL] Found Snacks background toggle. This is known to trigger OptionSet background loops."
  grep -R -n 'Snacks\.toggle\.option("background"' nvim/lua/plugins || true
  exit 1
fi

for file in nvim/lua/plugins/*.lua; do
  if grep -q 'nvim_create_autocmd("OptionSet"' "$file" && grep -q 'background' "$file"; then
    echo "[FAIL] Found OptionSet + background autocmd risk in $file"
    exit 1
  fi
done

echo "[PASS] No background mutation traps found"
echo ""

echo "[CHECK 2] Guard high-risk plugins from eager startup..."
for plugin_file in nvim/lua/plugins/noice.lua; do
  if [[ -f "$plugin_file" ]]; then
    if grep -q 'lazy\s*=\s*false' "$plugin_file"; then
      echo "[FAIL] $plugin_file sets lazy = false"
      exit 1
    fi
    if ! grep -Eq 'event\s*=|cmd\s*=|keys\s*=|ft\s*=' "$plugin_file"; then
      echo "[FAIL] $plugin_file is missing lazy-load trigger (event/cmd/keys/ft)"
      exit 1
    fi
  fi
done

echo "[PASS] High-risk plugins are lazy-loaded"
echo ""

echo "[CHECK 3] Build isolated Neovim profile from $BASE_REF..."
mkdir -p "$SANDBOX_DIR/home/.config"
git archive "$BASE_REF" nvim | tar -x -C "$SANDBOX_DIR/home/.config"
echo "[PASS] Isolated profile created"
echo ""

run_startup_smoke() {
  local label="$1"
  local home_dir="$SANDBOX_DIR/home"

  echo "[SMOKE] $label :: headless startup"
  env \
    HOME="$home_dir" \
    XDG_CONFIG_HOME="$home_dir/.config" \
    XDG_DATA_HOME="$home_dir/.local/share" \
    XDG_STATE_HOME="$home_dir/.local/state" \
    XDG_CACHE_HOME="$home_dir/.cache" \
    nvim --headless -c "qa"

  echo "[SMOKE] $label :: interactive startup"
  env \
    HOME="$home_dir" \
    XDG_CONFIG_HOME="$home_dir/.config" \
    XDG_DATA_HOME="$home_dir/.local/share" \
    XDG_STATE_HOME="$home_dir/.local/state" \
    XDG_CACHE_HOME="$home_dir/.cache" \
    nvim -c "sleep 1 | qa"

  if [[ "$SKIP_TMUX" -eq 0 ]] && command -v tmux >/dev/null 2>&1; then
    local session_name="nvim_safety_$RANDOM"
    echo "[SMOKE] $label :: tmux startup"
    tmux kill-session -t "$session_name" >/dev/null 2>&1 || true
    tmux new-session -d -s "$session_name" "env HOME='$home_dir' XDG_CONFIG_HOME='$home_dir/.config' XDG_DATA_HOME='$home_dir/.local/share' XDG_STATE_HOME='$home_dir/.local/state' XDG_CACHE_HOME='$home_dir/.cache' nvim -c 'sleep 1 | qa'"
    sleep 4
    if tmux has-session -t "$session_name" 2>/dev/null; then
      tmux kill-session -t "$session_name" >/dev/null 2>&1 || true
      echo "[FAIL] tmux startup did not exit for $label"
      return 1
    fi
  fi
}

echo "[CHECK 4] Startup checks on baseline profile..."
changed_plugins=()
while IFS= read -r plugin_path; do
  if [[ -n "$plugin_path" ]]; then
    changed_plugins+=("$plugin_path")
  fi
done < <(git diff --name-only "$BASE_REF" -- 'nvim/lua/plugins/*.lua')

baseline_failed=0
if ! run_startup_smoke "baseline:$BASE_REF"; then
  baseline_failed=1
fi
if [[ "$baseline_failed" -eq 0 ]]; then
  echo "[PASS] Baseline startup checks passed"
else
  if [[ "${#changed_plugins[@]}" -eq 0 ]]; then
    echo "[FAIL] Baseline startup failed and no plugin edits are present to validate"
    exit 1
  fi
  echo "[WARN] Baseline startup failed for $BASE_REF; continuing to validate rollout fixes"
fi

echo ""
echo "[CHECK 5] One-by-one rollout for changed plugin files..."

if [[ "${#changed_plugins[@]}" -eq 0 ]]; then
  echo "[PASS] No plugin file changes relative to $BASE_REF"
else
  for plugin_path in "${changed_plugins[@]}"; do
    echo "[STEP] Applying $plugin_path"
    mkdir -p "$SANDBOX_DIR/home/.config/$(dirname "$plugin_path")"
    cp "$ROOT_DIR/$plugin_path" "$SANDBOX_DIR/home/.config/$plugin_path"
    run_startup_smoke "rollout:$plugin_path"
  done
  echo "[PASS] One-by-one rollout checks passed"
fi

echo ""
LOCK_AFTER="$(checksum_file "$LOCKFILE")"
if [[ "$ALLOW_LOCKFILE_CHANGE" -eq 0 ]] && [[ "$LOCK_BEFORE" != "$LOCK_AFTER" ]]; then
  echo "[FAIL] nvim/lazy-lock.json changed during safety checks"
  echo "       Re-run with --allow-lockfile-change only when explicitly approved"
  exit 1
fi

echo "[PASS] lazy-lock.json unchanged"
echo ""
echo "=== ALL NEOVIM PLUGIN SAFETY CHECKS PASSED ==="