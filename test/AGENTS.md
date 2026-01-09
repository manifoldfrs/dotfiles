# AGENTS.md - Test Infrastructure

## Package Identity

Docker-based testing infrastructure for validating dotfiles installation.
Tests run in Ubuntu container to verify scripts work in clean environments.

## Setup & Run

```bash
# Run full test suite locally (from repo root)
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test

# Run tests directly (requires zsh, git, curl)
bash test/run_tests.sh

# Validate shell script syntax only (fast)
bash -n ../shell_setup.sh && bash -n ../mcp_setup.sh

# Check what CI runs
cat ../.github/workflows/test.yml
```

## Patterns & Conventions

### Test Script Structure
Tests follow this pattern (see `run_tests.sh`):

```bash
# ✅ DO: Use numbered tests with clear output
echo "[TEST 1] Checking shell script syntax..."
bash -n shell_setup.sh
echo "[PASS] No syntax errors"

# ✅ DO: Exit on failure with descriptive message
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "[FAIL] Oh My Zsh installation failed"
    exit 1
fi

# ❌ DON'T: Silent failures
# ❌ DON'T: Tests without [PASS]/[FAIL] output
```

### What Gets Tested
1. **Shell script syntax** - `bash -n` validation
2. **Git config security** - No SSH URL rewrites (blocks CI on fresh machines)
3. **Oh My Zsh installation** - Verifies curl + install script works
4. **nvm installation** - HTTPS clone (not SSH)
5. **zsh-syntax-highlighting** - Plugin installation
6. **Config file copying** - `.zshrc`, `.gitconfig`
7. **Config validation** - Theme and plugin settings

### Docker Test Environment
- **Base image**: Ubuntu (see `Dockerfile`)
- **Installs**: zsh, git, curl, bash
- **Copies**: Entire dotfiles repo to `/root/dotfiles`
- **Runs**: `test/run_tests.sh`

## Touch Points / Key Files

| Purpose | File |
|---------|------|
| Test runner | `run_tests.sh` |
| Docker environment | `Dockerfile` |
| CI workflow | `../.github/workflows/test.yml` |
| Scripts being tested | `../shell_setup.sh`, `../mcp_setup.sh` |

## JIT Index Hints

```bash
# Find all test assertions
rg "\[TEST|\[PASS|\[FAIL" run_tests.sh

# Find what CI tests on macOS vs Docker
rg -A5 "test-macos|test-docker" ../.github/workflows/test.yml

# Find security checks
rg "insteadOf|sshCommand" run_tests.sh

# Count number of tests
rg -c "\[TEST" run_tests.sh
```

## Common Gotchas

1. **Docker test fails but local works?** Ubuntu vs macOS differences
2. **SSH check failing?** Uncommented `insteadOf` in `.gitconfig` breaks fresh clones
3. **nvm test failing?** Must use HTTPS clone, not SSH
4. **Test hangs?** Oh My Zsh install might be waiting for input - ensure `--unattended`

## Pre-PR Checks

```bash
# Full validation (from repo root)
bash -n shell_setup.sh && bash -n mcp_setup.sh && \
docker build -t dotfiles-test -f test/Dockerfile . && \
docker run --rm dotfiles-test
```

## Adding a New Test

1. Add test block to `run_tests.sh` following existing pattern
2. Use `[TEST N]`, `[PASS]`, `[FAIL]` format
3. Exit with code 1 on failure
4. Test locally: `bash test/run_tests.sh`
5. Test in Docker: `docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test`
6. Update `.github/workflows/test.yml` if test requires specific tools
