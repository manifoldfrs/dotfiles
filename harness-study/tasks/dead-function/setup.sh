#!/bin/bash
set -e
fixture="$1"
mkdir -p "$fixture/src"
index="$fixture/src/index.js"
: > "$index"
for i in $(seq -w 1 20); do
  n=$((10#$i))
  next=$(printf "%02d" $(( n % 20 + 1 )))
  f="$fixture/src/mod$i.js"
  {
    echo "function step$i(x) {"
    echo "  return helper$i(x) + 1;"
    echo "}"
    echo "function helper$i(x) {"
    echo "  return x > 100 ? x : require(\"./mod$next\").finish$next(x * 2);"
    echo "}"
    echo "function finish$i(x) {"
    echo "  return x - $n;"
    echo "}"
    if [ "$n" -eq 13 ]; then
      echo "function normalizeLegacy13(x) {"
      echo "  return normalizeLegacy13Strict(x) * 2;"
      echo "}"
      echo "function normalizeLegacy13Strict(x) {"
      echo "  return Math.max(0, x);"
      echo "}"
      echo "module.exports = { step$i, finish$i, normalizeLegacy13Strict };"
    elif [ "$n" -eq 7 ]; then
      echo "function legacyNormalize07(x) {"
      echo "  return Math.abs(x);"
      echo "}"
      echo "module.exports = { step$i, finish$i, legacyNormalize07 };"
    else
      echo "module.exports = { step$i, finish$i };"
    fi
  } > "$f"
  echo "const m$i = require(\"./mod$i\");" >> "$index"
done
{
  echo "let acc = 0;"
  for i in $(seq -w 1 20); do
    echo "acc += m$i.step$i($((10#$i)));"
  done
  echo "acc += m13.normalizeLegacy13Strict(acc);"
  echo "acc += m07.legacyNormalize07(-acc);"
  echo "console.log(acc);"
} >> "$index"
echo "normalizeLegacy13" > "$2"
