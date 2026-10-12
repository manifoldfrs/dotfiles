// Tiny SVG string builder for manual figures. Units are CSS px at 96 per inch,
// so a 10 px label prints at 7.5 pt. Colours are the semantic roles from
// tokens.css, so a figure must be inlined into a page that loads it.

const role = (name) => `var(--${name})`

export const C = {
  ink: role("ink"),
  soft: role("ink-soft"),
  muted: role("muted"),
  hair: role("hair"),
  paper: role("paper"),
  signal: role("signal"),
  ok: role("ok"),
  fail: role("fail"),
  state: role("state"),
  stateFill: role("state-fill"),
  rule: role("rule"),
  focus: role("focus"),
  signalWash: role("signal-wash"),
  stateWash: role("state-wash"),
  failWash: role("fail-wash"),
  ruleWash: role("rule-wash"),
}

export const FONT = "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
export const MONO = "'JetBrains Mono NL', Menlo, 'DejaVu Sans Mono', Consolas, monospace"

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const attrs = (a) =>
  Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(" ")

export const tag = (name, a = {}, children = "") => `<${name} ${attrs(a)}>${Array.isArray(children) ? children.join("") : children}</${name}>`
export const svg = (width, height, children, label) =>
  tag("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": label, "font-family": FONT }, children)
export const line = (x1, y1, x2, y2, stroke = C.ink, a = {}) => tag("line", { x1, y1, x2, y2, stroke, ...a })
export const rect = (x, y, width, height, a = {}) => tag("rect", { x, y, width, height, ...a })
export const circle = (cx, cy, r, a = {}) => tag("circle", { cx, cy, r, ...a })
export const path = (d, a = {}) => tag("path", { d, fill: "none", ...a })
export const poly = (points, a = {}) => tag("polyline", { points: points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "), fill: "none", ...a })
export const text = (x, y, content, a = {}) => tag("text", { x, y, "font-size": 10, fill: C.ink, ...a }, esc(content))

// A numbered callout circle, as used by the figure keys.
export const callout = (x, y, n) => [circle(x, y, 8, { fill: C.paper, stroke: C.ink, "stroke-width": 0.9 }), text(x, y + 3.5, n, { "font-size": 9.5, "text-anchor": "middle" })].join("")

// Allowed: filled dot. Rejected: a cross. Never colour alone.
export function decisionMark(x, y, decision, r = 4.5) {
  if (decision === "allow") return circle(x, y, r, { fill: C.ok })
  const d = r - 0.5
  return tag("g", { stroke: C.fail, "stroke-width": 2, "stroke-linecap": "round" }, [line(x - d, y - d, x + d, y + d, C.fail), line(x - d, y + d, x + d, y - d, C.fail)])
}
