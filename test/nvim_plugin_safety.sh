#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NVIM_DIR="stow/nvim/.config/nvim"
NVIM_PLUGIN_DIR="$NVIM_DIR/lua/plugins"
BASE_REF="HEAD"
ALLOW_LOCKFILE_CHANGE=0

usage() {
  cat <<'EOF'
Usage: bash test/nvim_plugin_safety.sh [options]

Options:
  --base-ref <ref>            Base git ref for one-by-one plugin rollout (default: HEAD)
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

LOCKFILE="$ROOT_DIR/$NVIM_DIR/lazy-lock.json"
LOCK_BEFORE="$(checksum_file "$LOCKFILE")"

SANDBOX_DIR="$(mktemp -d "${TMPDIR:-/tmp}/nvim-sandbox.XXXXXX")"
SNAPSHOT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/nvim-snapshot.XXXXXX")"
SNAPSHOT_FILE="$SNAPSHOT_DIR/nvim-config-snapshot.tgz"
trap 'rm -rf "$SANDBOX_DIR" "$SNAPSHOT_DIR"' EXIT

tar -czf "$SNAPSHOT_FILE" -C "$ROOT_DIR/stow/nvim/.config" nvim

echo "=== Neovim Plugin Safety Checks ==="
echo "[INFO] Base ref: $BASE_REF"
echo "[INFO] Snapshot: $SNAPSHOT_FILE"
echo ""

echo "[CHECK 1] Guard against background mutation traps..."
if grep -R -n 'Snacks\.toggle\.option("background"' "$NVIM_PLUGIN_DIR" >/dev/null 2>&1; then
  echo "[FAIL] Found Snacks background toggle. This is known to trigger OptionSet background loops."
  grep -R -n 'Snacks\.toggle\.option("background"' "$NVIM_PLUGIN_DIR" || true
  exit 1
fi

for file in "$NVIM_PLUGIN_DIR"/*.lua; do
  if grep -q 'nvim_create_autocmd("OptionSet"' "$file" && grep -q 'background' "$file"; then
    echo "[FAIL] Found OptionSet + background autocmd risk in $file"
    exit 1
  fi
done

echo "[PASS] No background mutation traps found"
echo ""

echo "[CHECK 2] Guard high-risk plugins from eager startup..."
for plugin_file in "$NVIM_PLUGIN_DIR/noice.lua"; do
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
if git cat-file -e "$BASE_REF:$NVIM_DIR" >/dev/null 2>&1; then
  mkdir -p "$SANDBOX_DIR/base"
  git archive "$BASE_REF" "$NVIM_DIR" | tar -x -C "$SANDBOX_DIR/base"
  mv "$SANDBOX_DIR/base/$NVIM_DIR" "$SANDBOX_DIR/home/.config/nvim"
else
  echo "[WARN] $BASE_REF does not contain $NVIM_DIR; using current tree for baseline"
  cp -R "$ROOT_DIR/$NVIM_DIR" "$SANDBOX_DIR/home/.config/nvim"
fi
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
}

echo "[CHECK 4] Startup checks on baseline profile..."
changed_plugins=()
while IFS= read -r plugin_path; do
  if [[ -n "$plugin_path" ]]; then
    changed_plugins+=("$plugin_path")
  fi
done < <(git diff --name-only "$BASE_REF" -- "$NVIM_PLUGIN_DIR/*.lua")

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
    mkdir -p "$SANDBOX_DIR/home/.config/nvim/lua/plugins"
    if [[ -f "$ROOT_DIR/$plugin_path" ]]; then
      cp "$ROOT_DIR/$plugin_path" "$SANDBOX_DIR/home/.config/nvim/lua/plugins/$(basename "$plugin_path")"
    else
      rm -f "$SANDBOX_DIR/home/.config/nvim/lua/plugins/$(basename "$plugin_path")"
    fi
    run_startup_smoke "rollout:$plugin_path"
  done
  echo "[PASS] One-by-one rollout checks passed"
fi

echo ""
LOCK_AFTER="$(checksum_file "$LOCKFILE")"
if [[ "$ALLOW_LOCKFILE_CHANGE" -eq 0 ]] && [[ "$LOCK_BEFORE" != "$LOCK_AFTER" ]]; then
  echo "[FAIL] $NVIM_DIR/lazy-lock.json changed during safety checks"
  echo "       Re-run with --allow-lockfile-change only when explicitly approved"
  exit 1
fi

echo "[PASS] lazy-lock.json unchanged"
echo ""
echo "=== ALL NEOVIM PLUGIN SAFETY CHECKS PASSED ==="
