# AGENTS.md - Test Infrastructure

## Package Identity
Docker-based test harness validating dotfiles scripts in clean Ubuntu.
Runs `test/run_tests.sh` inside `test/Dockerfile`.

## Setup & Run
```bash
docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test
bash test/run_tests.sh
bash -n shell_setup.sh && bash -n mcp_setup.sh
```

## Patterns & Conventions
- ✅ DO: Use `[TEST N]` / `[PASS]` / `[FAIL]` in `test/run_tests.sh`
- ✅ DO: Exit non-zero on failure (see `test/run_tests.sh`)
- ✅ DO: Keep Docker environment in `test/Dockerfile`
- ❌ DON'T: Add new checks to archived scripts like `old/install.sh`
- ❌ DON'T: Copy legacy setup logic from `old/verify_fonts.sh`

## Touch Points / Key Files
- Test runner: `test/run_tests.sh`
- Docker image: `test/Dockerfile`
- Docker wrapper: `test/docker_test.sh`
- CI workflow: `.github/workflows/test.yml`
- Scripts under test: `shell_setup.sh`, `mcp_setup.sh`

## JIT Index Hints
```bash
rg '\\[TEST|\\[PASS|\\[FAIL' test/run_tests.sh
rg 'docker build|docker run' test/docker_test.sh
rg 'test-docker' .github/workflows/test.yml
```

## Common Gotchas
- Docker tests run on Ubuntu; macOS-only assumptions can fail
- CI rejects SSH URL rewrites in `.gitconfig`
- Oh My Zsh install must stay unattended to avoid hanging tests

## Pre-PR Checks
```bash
bash -n shell_setup.sh && bash -n mcp_setup.sh && docker build -t dotfiles-test -f test/Dockerfile . && docker run --rm dotfiles-test
```
