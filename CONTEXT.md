# Dotfiles Context

This glossary defines the repository's language for moving configuration between version control, a live machine, and multiple coding-agent harnesses.

## Configuration lifecycle

**Tracked source**:
The version-controlled representation of configuration that this repository owns and can reproduce.
_Avoid_: Backup, live config

**Live configuration**:
The configuration a tool reads from the user's home directory on the current machine.
_Avoid_: Tracked source

**Stow package**:
A named collection of tracked sources that maps onto the same relative locations under the user's home directory.
_Avoid_: App, module

**Apply**:
Reconcile selected Stow packages into the live configuration, normally by creating or refreshing managed links.
_Avoid_: Install, deploy

**Capture**:
Copy current live configuration into tracked sources for review and possible commit.
_Avoid_: Backup

**Safety backup**:
A timestamped copy of conflicting live configuration preserved before this repository replaces or links that location.
_Avoid_: Capture, tracked source

**Machine-local state**:
Configuration, credentials, caches, sessions, or logs that belong to one machine and remain outside version control.
_Avoid_: Tracked source

**Archive**:
Inactive configuration retained for reference or rollback but excluded from the current setup.
_Avoid_: Package, live configuration

## Agent configuration

**Shared skill catalog**:
The tracked set of agent skills made available to supported harnesses from one canonical source tree.
_Avoid_: Claude skills, Pi skills

**Baseline catalog**:
The stable Matt Pocock skill set that forms the upstream foundation of the shared skill catalog.
_Avoid_: Personalization layer

**Personalization layer**:
Dillon Mulroy skills that supplement the baseline catalog without replacing skills already supplied by it.
_Avoid_: Baseline catalog, local skill

**Local skill**:
A skill owned by this repository and preserved independently of either upstream catalog.
_Avoid_: Personalization layer

**Skill ownership**:
The recorded source of authority for a skill, which determines whether synchronization follows Matt Pocock, Dillon Mulroy, or this repository.
_Avoid_: Skill location

**Harness adapter**:
A harness-specific wrapper or configuration that exposes shared behavior without creating another canonical implementation.
_Avoid_: Skill copy

**Global agent rules**:
User-scoped instructions shared across repositories and imported by supported coding-agent harnesses.
_Avoid_: Project rules

**Project rules**:
Repository-scoped instructions that describe local contracts, commands, and hazards without redefining global preferences.
_Avoid_: Global agent rules
