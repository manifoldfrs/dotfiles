# Cursor Settings in This Repo

This folder tracks your personal Cursor configuration that is safe to version:

- `settings.json`
- `keybindings.json`
- `extensions.txt` (extension IDs)

## Refresh this backup

From repo root:

```bash
mkdir -p cursor
cp "$HOME/Library/Application Support/Cursor/User/settings.json" cursor/settings.json
cp "$HOME/Library/Application Support/Cursor/User/keybindings.json" cursor/keybindings.json
python3 - <<'PY'
from pathlib import Path
import re

ext_dir = Path.home() / ".cursor" / "extensions"
out = Path("cursor/extensions.txt")
ids = set()

for p in ext_dir.iterdir():
    name = p.name
    if name.startswith(".") or name == "extensions.json":
        continue
    m = re.match(r"^(.*?)-\\d", name)
    ids.add(m.group(1) if m else name)

out.write_text("\n".join(sorted(ids)) + "\n")
print(f"Wrote {len(ids)} extensions to {out}")
PY
```
