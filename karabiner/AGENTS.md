# AGENTS.md - Karabiner Configuration

## Package Identity
Karabiner-Elements keyboard remapping config for macOS.
Primary JSON in `karabiner/karabiner.json` with complex rules under `karabiner/assets/complex_modifications/`.

## Setup & Run
```bash
mkdir -p ~/.config/karabiner
cp karabiner/karabiner.json ~/.config/karabiner/karabiner.json
# Reload settings in Karabiner-Elements UI
```

## Patterns & Conventions

### File Organization
```
karabiner/
├── karabiner.json
└── assets/complex_modifications/*.json
```

### Examples
- ✅ DO: Keep main profile + devices in `karabiner/karabiner.json`
- ✅ DO: Store complex rules in `karabiner/assets/complex_modifications/1747964595.json`
- ✅ DO: Use descriptive rule names (see `karabiner/karabiner.json`)
- ❌ DON'T: Edit archived configs in `old/iterm2/karabiner/karabiner.json`
- ❌ DON'T: Copy archived rules from `old/iterm2/karabiner/assets/complex_modifications/1598813989.json`

## Touch Points / Key Files
- Main config: `karabiner/karabiner.json`
- Complex rules: `karabiner/assets/complex_modifications/*.json`
- Legacy archive: `old/iterm2/karabiner/karabiner.json`

## JIT Index Hints
```bash
rg '"description"' karabiner/karabiner.json
rg 'manipulators' karabiner/karabiner.json
rg --files -g 'karabiner/assets/complex_modifications/*.json'
```

## Common Gotchas
- Invalid JSON causes Karabiner to ignore changes
- Device IDs are hardware-specific; preserve existing identifiers
- Complex rules belong in asset files, not inline copies of legacy rules

## Pre-PR Checks
```bash
python -m json.tool karabiner/karabiner.json > /dev/null
```
