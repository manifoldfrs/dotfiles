#!/usr/bin/env bun
// Checks a rendered film against its Psychopomp plan.
//
//   bun video_check.ts <film.mp4> <film.plan.json> <out-dir> [--beats film.beats.json] [--strip START..END]
//
// - ffprobe: resolution, frame rate, and duration against the plan's durationNanos
// - captions: every caption actor whose id starts with "footer" stays on screen for
//   its typing time plus 0.3 s per word (at least 1.5 s)
// - frames: one PNG per beat in beats.json, plus a labelled contact sheet
// - --strip: every frame at 25 fps in a window, for checking motion between stills
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [film, planPath, outDir, ...rest] = Bun.argv.slice(2)
if (!film || !planPath || !outDir) {
  console.error("usage: bun video_check.ts <film.mp4> <film.plan.json> <out-dir> [--beats beats.json] [--strip START..END]")
  process.exit(2)
}
const option = (name: string) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined)
mkdirSync(outDir, { recursive: true })
const results: string[] = []
const pass = (ok: boolean, label: string) => results.push(`${ok ? "PASS" : "FAIL"} ${label}`)

function run(cmd: string[]): string {
  const proc = Bun.spawnSync(cmd, { stderr: "pipe" })
  if (proc.exitCode !== 0) throw new Error(`${cmd[0]} failed: ${proc.stderr.toString().slice(0, 400)}`)
  return proc.stdout.toString()
}

const plan = JSON.parse(readFileSync(planPath, "utf8"))
const planSeconds = plan.durationNanos / 1e9

const probe = JSON.parse(run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", film]))
const video = probe.streams.find((s: any) => s.codec_type === "video")
const [num, den] = String(video.r_frame_rate).split("/").map(Number)
const fps = num / den
const duration = Number(probe.format.duration)
pass(video.width === 1920 && video.height === 1080, `resolution ${video.width}x${video.height}`)
pass(Math.abs(fps - 60) < 0.01, `frame rate ${fps.toFixed(2)} fps`)
pass(Math.abs(duration - planSeconds) < 0.1, `duration ${duration.toFixed(2)} s vs plan ${planSeconds.toFixed(2)} s`)
const audio = probe.streams.filter((s: any) => s.codec_type === "audio").length
results.push(`INFO audio streams: ${audio}`)

// Caption timing from the plan.
const channels = new Map<string, any>(plan.continuousChannels.map((c: any) => [c.id, c]))
const captions = plan.actors.filter((a: any) => a.recipe === "caption" && a.id.startsWith("footer"))
let shortest = Infinity
for (const actor of captions) {
  const text = actor.data.lines.flat().map((s: any) => s.text).join("")
  const words = text.split(/\s+/).filter(Boolean).length
  const need = text.length / 48 + Math.max(1.5, 0.3 * words)
  const events = channels.get(`${actor.id}.opacity`)?.events ?? []
  const shown = events.find((e: any) => (e.value ?? e.target) > 0.5)
  if (!shown) continue
  const hidden = events.find((e: any) => e.atNanos > shown.atNanos && (e.value ?? e.target) < 0.5)
  const visible = ((hidden?.atNanos ?? plan.durationNanos) - shown.atNanos) / 1e9
  shortest = Math.min(shortest, visible - need)
  pass(visible + 1e-6 >= need, `caption "${text.slice(0, 48)}" on screen ${visible.toFixed(1)} s, needs ${need.toFixed(1)} s`)
}
results.push(`INFO captions checked: ${captions.length}; smallest margin ${shortest.toFixed(2)} s`)

// Beat frames and a contact sheet.
const beatsPath = option("--beats")
if (beatsPath) {
  const beats = JSON.parse(readFileSync(beatsPath, "utf8")) as { beat: string; seconds: number }[]
  const files: string[] = []
  beats.forEach(({ beat, seconds }, k) => {
    const file = path.join(outDir, `beat-${String(k + 1).padStart(2, "0")}.png`)
    run(["ffmpeg", "-v", "error", "-y", "-ss", String(seconds), "-i", film, "-frames:v", "1", file])
    files.push(file)
    results.push(`INFO beat ${k + 1} at ${seconds.toFixed(2)} s: ${beat} → ${path.basename(file)}`)
  })
  const sheet = path.join(outDir, "beats-sheet.jpg")
  const labelled = beats.flatMap(({ beat, seconds }, k) => ["-label", `${k + 1}. ${seconds.toFixed(1)} s · ${beat}`, files[k]])
  Bun.spawnSync(["magick", "montage", ...labelled, "-tile", "3x", "-geometry", "640x360+4+18", "-pointsize", "16", "-font", "Helvetica", "-background", "#222", "-fill", "#ddd", sheet])
  results.push(`INFO contact sheet: ${sheet}`)
}

// Motion strip.
const strip = option("--strip")
if (strip) {
  const [a, b] = strip.split("..").map(Number)
  const dir = path.join(outDir, `strip-${a}-${b}`)
  mkdirSync(dir, { recursive: true })
  run(["ffmpeg", "-v", "error", "-y", "-ss", String(a), "-to", String(b), "-i", film, "-vf", "fps=25,scale=640:-1", path.join(dir, "f%03d.png")])
  Bun.spawnSync(["magick", "montage", path.join(dir, "f*.png"), "-tile", "8x", "-geometry", "+2+2", "-background", "#222", path.join(outDir, `strip-${a}-${b}.jpg`)])
  results.push(`INFO motion strip: ${path.join(outDir, `strip-${a}-${b}.jpg`)} (25 fps)`)
}

const report = results.join("\n")
writeFileSync(path.join(outDir, "report.txt"), report + "\n")
console.log(report)
if (results.some((line) => line.startsWith("FAIL"))) process.exit(1)
