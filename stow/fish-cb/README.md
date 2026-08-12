# Coinbase Fish profile

This Stow package contains Fish-native Coinbase environment settings plus `cbcode` and `find_pr`.

The former `cb-zsh` plugins (`atlassian`, `jira`, `reconnect_vpn`, `git-scripts`, and `new-user`) cannot be sourced by Fish. The plugin checkout was unavailable on this machine during migration, so their command surfaces could not be inventoried safely. `assume-role -init` also emits shell-specific code and is intentionally not evaluated in Fish. Continue to invoke standalone binaries directly where available, and inventory/port any missing work command on a Coinbase machine before deleting the archived Zsh rollback.

Secrets and machine-local overrides belong in `~/.config/fish/local.fish`.
