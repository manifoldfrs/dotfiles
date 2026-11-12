#!/bin/bash
set -e
f="$1"
mkdir -p "$f/bin" "$f/test"
cat > "$f/README.md" <<'EOF'
# dedupe.sh DIR

- Recursively scans the regular files under `DIR`, including hidden files and files in hidden directories; symlinks are ignored and never followed or deleted.
- Files with identical content form a duplicate group; empty files are never treated as duplicates.
- In each group, the file whose path relative to `DIR` sorts first in byte order (`LC_ALL=C`) is kept, and every other file in the group is deleted.
- Prints one line per deleted file, `removed <path relative to DIR>`, sorted in byte order, and nothing else on stdout.
- Exits 0 on success; exits 2 with a message on stderr when `DIR` is missing or not a directory.
- Must work for any file name, including spaces, leading dashes, glob characters, and backslashes.
EOF
cat > "$f/bin/dedupe.sh" <<'EOF'
#!/bin/bash
dir=$1
cd $dir
for f in $(find . -type f | sort); do
  sum=$(shasum -a 256 $f | cut -d' ' -f1)
  seen=$(grep -l $sum /tmp/dedupe_sums 2>/dev/null)
  if grep -q "^$sum" /tmp/dedupe_sums 2>/dev/null; then
    rm $f
    echo "removed ${f#./}"
  else
    echo "$sum $f" >> /tmp/dedupe_sums
  fi
done
rm -f /tmp/dedupe_sums
EOF
chmod +x "$f/bin/dedupe.sh"
cat > "$f/test/run.sh" <<'EOF'
#!/bin/bash
here="$(cd "$(dirname "$0")/.." && pwd)"
t="$(mktemp -d)"
mkdir -p "$t/photos/trip 2026"
printf 'A' > "$t/photos/a.jpg"
printf 'A' > "$t/photos/trip 2026/a copy.jpg"
printf 'B' > "$t/photos/b.jpg"
out="$(bash "$here/bin/dedupe.sh" "$t/photos")"
expected="removed trip 2026/a copy.jpg"
if [ "$out" != "$expected" ] || [ -e "$t/photos/trip 2026/a copy.jpg" ] || [ ! -e "$t/photos/a.jpg" ]; then
  echo "FAIL: got '$out'"
  exit 1
fi
echo ok
EOF
echo done > "$2"
