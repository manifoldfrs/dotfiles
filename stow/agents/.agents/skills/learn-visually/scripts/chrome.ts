#!/usr/bin/env bun
// Drives headless Chrome over the DevTools protocol with no npm dependencies.
//
//   bun chrome.ts check <page.html> [--spec spec.json] [--out dir] [--widths 375,768,1280]
//   bun chrome.ts pdf <page.html> <out.pdf>
//
// check: loads the page at each width, runs the spec's steps, screenshots, audits
// accessible names and horizontal overflow, and fails on any console error or
// uncaught exception. The spec format is documented in references/interactive.md.
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

type Step =
  | { click: string }
  | { press: string }
  | { fill: string; value: string }
  | { focus: string }
  | { tab: number }
  | { wait: number }
  | { eval: string; expect?: unknown; label?: string }
  | { screenshot: string }
  | { capture: string; as: string }
  | { reducedMotion: boolean }
  | { colorScheme: "light" | "dark" }

type Spec = { widths?: number[]; steps?: Step[]; perWidth?: Step[] }

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  Bun.which("google-chrome"),
  Bun.which("chromium"),
  Bun.which("chromium-browser"),
].filter(Boolean) as string[]

function findChrome(): string {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
  if (!found) throw new Error("Chrome not found; set CHROME to its binary path")
  return found
}

class Cdp {
  private nextId = 1
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>()
  private listeners: ((method: string, params: any) => void)[] = []
  constructor(private socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)!
        this.pending.delete(message.id)
        if (message.error) reject(new Error(`${message.error.message} ${message.error.data ?? ""}`))
        else resolve(message.result)
        return
      }
      for (const listener of this.listeners) listener(message.method, message.params)
    })
  }
  static async connect(url: string): Promise<Cdp> {
    const socket = new WebSocket(url)
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true })
      socket.addEventListener("error", reject, { once: true })
    })
    return new Cdp(socket)
  }
  send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const id = this.nextId++
    this.socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  on(listener: (method: string, params: any) => void) {
    this.listeners.push(listener)
  }
  waitFor(method: string, timeoutMs = 15000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), timeoutMs)
      this.on((m, params) => {
        if (m === method) {
          clearTimeout(timer)
          resolve(params)
        }
      })
    })
  }
  close() {
    this.socket.close()
  }
}

async function launch(): Promise<{ cdp: Cdp; stop: () => Promise<void> }> {
  const profile = await mkdtemp(path.join(tmpdir(), "learn-visually-chrome-"))
  const chrome = Bun.spawn(
    [
      findChrome(),
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  )
  const portFile = path.join(profile, "DevToolsActivePort")
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await Bun.sleep(100)
  const [port] = (await readFile(portFile, "utf8")).split("\n")
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((target: any) => target.type === "page")
  const cdp = await Cdp.connect(page.webSocketDebuggerUrl)
  const stop = async () => {
    cdp.close()
    chrome.kill()
    await chrome.exited
    await rm(profile, { recursive: true, force: true })
  }
  return { cdp, stop }
}

async function open(cdp: Cdp, file: string, width: number) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: width < 600 })
  const loaded = cdp.waitFor("Page.loadEventFired")
  await cdp.send("Page.navigate", { url: `file://${path.resolve(file)}` })
  await loaded
  await Bun.sleep(300)
}

async function evaluate(cdp: Cdp, expression: string): Promise<unknown> {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(`eval failed: ${expression}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`)
  return result.result.value
}

async function screenshot(cdp: Cdp, file: string) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true })
  await writeFile(file, Buffer.from(data, "base64"))
}

async function capture(cdp: Cdp, selector: string, file: string) {
  const box = (await evaluate(
    cdp,
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
      el.scrollIntoView({block: "center"}); const r = el.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height } })()`,
  )) as { x: number; y: number; width: number; height: number } | null
  if (!box) throw new Error(`capture: no element matches ${selector}`)
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...box, scale: 1 } })
  await writeFile(file, Buffer.from(data, "base64"))
}

const KEYS: Record<string, { key: string; code: string; keyCode: number }> = {
  " ": { key: " ", code: "Space", keyCode: 32 },
  Space: { key: " ", code: "Space", keyCode: 32 },
  Enter: { key: "Enter", code: "Enter", keyCode: 13 },
  Tab: { key: "Tab", code: "Tab", keyCode: 9 },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
}

async function press(cdp: Cdp, name: string) {
  const known = KEYS[name]
  const key = known ?? { key: name, code: `Key${name.toUpperCase()}`, keyCode: name.toUpperCase().charCodeAt(0) }
  const text = key.key.length === 1 ? key.key : undefined
  const base = { key: key.key, code: key.code, windowsVirtualKeyCode: key.keyCode, nativeVirtualKeyCode: key.keyCode }
  await cdp.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", ...base, text })
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...base })
}

async function click(cdp: Cdp, selector: string) {
  const box = await evaluate(
    cdp,
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
      el.scrollIntoView({block: "center"}); const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: !!el.disabled } })()`,
  ) as { x: number; y: number; disabled: boolean } | null
  if (!box) throw new Error(`click: no element matches ${selector}`)
  if (box.disabled) throw new Error(`click: ${selector} is disabled`)
  for (const type of ["mousePressed", "mouseReleased"])
    await cdp.send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 })
}

const AUDIT = `(() => {
  const problems = []
  const name = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim()
    || (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent.trim())
    || el.closest("label")?.textContent.trim() || ""
  for (const el of document.querySelectorAll("button, input, select, textarea, [role=button], [role=slider]")) {
    if (el.type === "hidden") continue
    if (!name(el)) problems.push("no accessible name: " + el.outerHTML.slice(0, 80))
  }
  for (const el of document.querySelectorAll("[onclick]:not(button):not(a):not(input)"))
    problems.push("click handler on non-control: " + el.outerHTML.slice(0, 80))
  const overflow = document.documentElement.scrollWidth - window.innerWidth
  if (overflow > 1) problems.push("page overflows horizontally by " + overflow + "px")
  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el)
    if (style.overflowX !== "visible" || el.closest("pre, svg, table")) continue
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && el.children.length === 0)
      problems.push("text clipped or overflowing: " + el.outerHTML.slice(0, 80))
  }
  return problems
})()`

async function runSteps(cdp: Cdp, steps: Step[], width: number, outDir: string, results: string[]) {
  for (const step of steps) {
    if ("click" in step) await click(cdp, step.click)
    else if ("press" in step) await press(cdp, step.press)
    else if ("fill" in step)
      await evaluate(
        cdp,
        `(() => { const el = document.querySelector(${JSON.stringify(step.fill)}); if (!el) throw new Error("fill: missing ${step.fill}");
          el.value = ${JSON.stringify(step.value)}; el.dispatchEvent(new Event("input", {bubbles: true})); el.dispatchEvent(new Event("change", {bubbles: true})) })()`,
      )
    else if ("focus" in step) await evaluate(cdp, `document.querySelector(${JSON.stringify(step.focus)}).focus()`)
    else if ("tab" in step) for (let i = 0; i < step.tab; i++) await press(cdp, "Tab")
    else if ("wait" in step) await Bun.sleep(step.wait)
    else if ("reducedMotion" in step)
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: step.reducedMotion ? "reduce" : "no-preference" }],
      })
    else if ("colorScheme" in step)
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: step.colorScheme }] })
    else if ("screenshot" in step) await screenshot(cdp, path.join(outDir, `${step.screenshot}-${width}.png`))
    else if ("capture" in step) await capture(cdp, step.capture, path.join(outDir, `${step.as}-${width}.png`))
    else if ("eval" in step) {
      const value = await evaluate(cdp, step.eval)
      const label = step.label ?? step.eval
      if ("expect" in step) {
        const pass = JSON.stringify(value) === JSON.stringify(step.expect)
        results.push(`${pass ? "PASS" : "FAIL"} [${width}] ${label} => ${JSON.stringify(value)}${pass ? "" : ` (expected ${JSON.stringify(step.expect)})`}`)
      } else results.push(`INFO [${width}] ${label} => ${JSON.stringify(value)}`)
    }
    await Bun.sleep(60)
  }
}

async function check(file: string, specFile: string | undefined, outDir: string, widthsArg: string | undefined) {
  const spec: Spec = specFile ? JSON.parse(await readFile(specFile, "utf8")) : {}
  const widths = widthsArg ? widthsArg.split(",").map(Number) : spec.widths ?? [375, 768, 1280]
  await mkdir(outDir, { recursive: true })
  const { cdp, stop } = await launch()
  const results: string[] = []
  const consoleProblems: string[] = []
  cdp.on((method, params) => {
    if (method === "Runtime.exceptionThrown")
      consoleProblems.push(`exception: ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`)
    if (method === "Runtime.consoleAPICalled" && (params.type === "error" || params.type === "assert"))
      consoleProblems.push(`console.${params.type}: ${params.args.map((a: any) => a.value ?? a.description).join(" ")}`)
    if (method === "Log.entryAdded" && params.entry.level === "error") consoleProblems.push(`log: ${params.entry.text} ${params.entry.url ?? ""}`)
  })
  try {
    await cdp.send("Page.enable")
    await cdp.send("Runtime.enable")
    await cdp.send("Log.enable")
    for (const [index, width] of widths.entries()) {
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] })
      await open(cdp, file, width)
      await screenshot(cdp, path.join(outDir, `initial-${width}.png`))
      const audit = (await evaluate(cdp, AUDIT)) as string[]
      for (const problem of audit) results.push(`FAIL [${width}] audit: ${problem}`)
      if (audit.length === 0) results.push(`PASS [${width}] audit: accessible names, no overflow`)
      const steps = index === 0 ? spec.steps ?? [] : spec.perWidth ?? []
      try {
        await runSteps(cdp, steps, width, outDir, results)
      } catch (error) {
        results.push(`FAIL [${width}] step error: ${(error as Error).message}`)
      }
      await screenshot(cdp, path.join(outDir, `final-${width}.png`))
    }
  } finally {
    await stop()
  }
  for (const problem of consoleProblems) results.push(`FAIL console ${problem}`)
  if (consoleProblems.length === 0) results.push("PASS console: no errors or uncaught exceptions")
  const report = results.join("\n")
  await writeFile(path.join(outDir, "report.txt"), report + "\n")
  console.log(report)
  console.log(`screenshots: ${outDir}`)
  if (results.some((line) => line.startsWith("FAIL"))) process.exit(1)
}

async function pdf(file: string, out: string) {
  const { cdp, stop } = await launch()
  try {
    await cdp.send("Page.enable")
    await cdp.send("Runtime.enable")
    await open(cdp, file, 1100)
    await evaluate(cdp, "document.fonts.ready.then(() => true)")
    const { data } = await cdp.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      generateDocumentOutline: true,
      generateTaggedPDF: true,
    })
    await writeFile(out, Buffer.from(data, "base64"))
    console.log(`wrote ${out}`)
  } finally {
    await stop()
  }
}

const [command, ...rest] = Bun.argv.slice(2)
const option = (name: string) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined)
if (command === "check" && rest[0]) await check(rest[0], option("--spec"), option("--out") ?? "checks/interactive", option("--widths"))
else if (command === "pdf" && rest[0] && rest[1]) await pdf(rest[0], rest[1])
else {
  console.error("usage: bun chrome.ts check <page.html> [--spec spec.json] [--out dir] [--widths 375,768,1280]\n       bun chrome.ts pdf <page.html> <out.pdf>")
  process.exit(2)
}
