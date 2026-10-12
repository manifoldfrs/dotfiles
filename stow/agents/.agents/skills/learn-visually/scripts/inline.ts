#!/usr/bin/env bun
// Builds a self-contained HTML file from a source page.
//   bun inline.ts <index.src.html> <index.html>
//
// Markers, with paths relative to the source file:
//   <link rel="stylesheet" href="x.css" data-inline>  → <style>…</style>
//   /* @inline path/module.mjs */                    → module text without import lines or `export`
//   /* @json path/data.json */                       → the JSON text
// One shared module scope means inlined modules must not repeat top-level names.
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [source, out] = Bun.argv.slice(2)
if (!source || !out) {
  console.error("usage: bun inline.ts <index.src.html> <index.html>")
  process.exit(2)
}
const dir = path.dirname(path.resolve(source))
const read = (relative: string) => readFileSync(path.join(dir, relative), "utf8")

const moduleText = (relative: string) =>
  read(relative)
    .split("\n")
    .filter((line) => !/^import\s.*from\s/.test(line))
    .map((line) => line.replace(/^export (?=(async\s+)?(function|const|let|class)\b)/, ""))
    .join("\n")

let html = read(path.basename(source))
html = html.replace(/<link rel="stylesheet" href="([^"]+)" data-inline>/g, (_, href) => `<style>\n${read(href)}</style>`)
html = html.replace(/\/\* @inline ([^ ]+) \*\//g, (_, file) => `// ${file}\n${moduleText(file)}`)
html = html.replace(/\/\* @json ([^ ]+) \*\//g, (_, file) => read(file).trim())

const leftovers = html.match(/@inline |@json |data-inline/g)
if (leftovers) throw new Error(`unresolved markers: ${leftovers.join(", ")}`)
if (/<script[^>]+src=|<link[^>]+href="(?!#)/.test(html)) console.warn("warning: page still references external files")
writeFileSync(out, html)
console.log(`wrote ${out} (${(html.length / 1024).toFixed(1)} KB)`)
