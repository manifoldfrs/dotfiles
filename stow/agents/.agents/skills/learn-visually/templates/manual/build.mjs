// Builds manual.html from manual.src.html.
//   node manual/build.mjs
// Markers in the source:
//   <!-- figure: name {"json": "options"} -->  → figures.mjs export name(trace, options)
//   {{ expression }}                           → evaluated with `trace` and `fmt` in scope
//   <link rel="stylesheet" href="x.css" data-inline>
import { readFileSync, writeFileSync } from "node:fs"

const here = (file) => new URL(file, import.meta.url)
const trace = JSON.parse(readFileSync(here("../example/trace.json"), "utf8"))
const figures = await import(here("./figures.mjs").href)
const fmt = (x) => (Number.isInteger(x) ? String(x) : Number(x.toFixed(3)).toString())

let html = readFileSync(here("./manual.src.html"), "utf8")
html = html.replace(/<link rel="stylesheet" href="([^"]+)" data-inline>/g, (_, href) => `<style>\n${readFileSync(here(href), "utf8")}</style>`)
html = html.replace(/<!-- figure: (\w+)(?: (\{.*?\}))? -->/g, (_, name, options) => {
  if (!figures[name]) throw new Error(`figures.mjs has no export ${name}`)
  return figures[name](trace, options ? JSON.parse(options) : {})
})
html = html.replace(/\{\{(.+?)\}\}/g, (_, expression) => String(Function("trace", "fmt", `return (${expression})`)(trace, fmt)))
writeFileSync(here("./manual.html"), html)
console.log(`wrote manual/manual.html (${(html.length / 1024).toFixed(1)} KB)`)
