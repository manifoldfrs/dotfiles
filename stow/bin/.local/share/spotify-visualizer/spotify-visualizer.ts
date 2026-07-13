#!/usr/bin/env tsx

import { createHash, randomBytes } from "node:crypto"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ""
const REDIRECT_PORT = Number(process.env.SPOTIFY_VISUALIZER_PORT ?? "8974")
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`
const SCOPES = ["user-read-currently-playing", "user-read-playback-state", "user-modify-playback-state"].join(" ")
const CACHE_DIR = join(homedir(), ".cache", "dotfiles", "spotify-visualizer")
const TOKEN_PATH = join(CACHE_DIR, "tokens.json")
const FPS = 30
const POLL_MS = 1500
const MIN_ROWS = 10
const MIN_COLS = 24
const HELP_ARG = new Set(["-h", "--help", "help"])

type Tokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

type TrackState = {
  isPlaying: boolean
  progressMs: number
  durationMs: number
  lastUpdate: number
  trackId: string
  trackName: string
  artists: string
  trackSeed: number
  shuffleState: boolean
  repeatState: "off" | "track" | "context"
}

type SpotifyTrack = {
  id?: string
  name?: string
  duration_ms?: number
  artists?: { name?: string }[]
}

type SpotifyCurrentlyPlaying = {
  is_playing?: boolean
  progress_ms?: number | null
  item?: SpotifyTrack | null
  shuffle_state?: boolean
  repeat_state?: "off" | "track" | "context"
}

const STOPS: { at: number; color: readonly [number, number, number] }[] = [
  { at: 0, color: [96, 12, 24] },
  { at: 0.45, color: [255, 42, 72] },
  { at: 0.75, color: [255, 122, 40] },
  { at: 1, color: [252, 234, 14] },
]

let state: TrackState = {
  isPlaying: false,
  progressMs: 0,
  durationMs: 0,
  lastUpdate: performance.now(),
  trackId: "",
  trackName: "Waiting for Spotify",
  artists: "Start playback on any Spotify device",
  trackSeed: 0,
  shuffleState: false,
  repeatState: "off",
}
let heights: number[] = []
let pulse = 0
let running = true
let lastError = ""
let notice = ""
let noticeUntil = 0

function usage(): string {
  return [
    "spotify-visualizer",
    "",
    "Procedural Spotify terminal visualizer for terminal panes.",
    "",
    "Requirements:",
    "  SPOTIFY_CLIENT_ID must be set to a Spotify app client id.",
    `  The Spotify app must allow redirect URI: ${REDIRECT_URI}`,
    "",
    "Controls:",
    "  Space toggles play and pause.",
    "  n skips to the next track.",
    "  p skips to the previous track.",
    "  s toggles shuffle.",
    "  r cycles repeat off, context, and current track.",
    "  q or Ctrl-C exits and restores the terminal.",
  ].join("\n")
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function ramp(level: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, level))
  for (let i = 1; i < STOPS.length; i++) {
    const a = STOPS[i - 1]
    const b = STOPS[i]
    if (!a || !b) continue
    if (x <= b.at) {
      const t = (x - a.at) / (b.at - a.at || 1)
      return [lerp(a.color[0], b.color[0], t), lerp(a.color[1], b.color[1], t), lerp(a.color[2], b.color[2], t)]
    }
  }
  const last = STOPS[STOPS.length - 1]?.color ?? [252, 234, 14]
  return [last[0], last[1], last[2]]
}

function seedFromId(id: string): number {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 997
  return s / 100
}

function ansiFg(r: number, g: number, b: number): string {
  return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m`
}

function dimColor(): string {
  return ansiFg(45, 8, 14)
}

function reset(): string {
  return "\x1b[0m"
}

function clearScreen(): string {
  return "\x1b[2J\x1b[H"
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  if (max <= 3) return value.slice(0, max)
  return `${value.slice(0, max - 3)}...`
}

function setNotice(message: string, ttlMs = 3000): void {
  notice = message
  noticeUntil = performance.now() + ttlMs
}

function visibleNotice(): string {
  if (!notice || performance.now() > noticeUntil) return ""
  return notice
}

function readTokens(): Tokens | null {
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, "utf8")) as Tokens
  } catch {
    return null
  }
}

function writeTokens(tokens: Tokens): void {
  mkdirSync(dirname(TOKEN_PATH), { recursive: true })
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 })
}

function clearTokens(): void {
  try {
    rmSync(TOKEN_PATH)
  } catch {
    return
  }
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function openUrl(url: string): void {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  const child = spawn(command, args, { detached: true, stdio: "ignore" })
  child.unref()
}

function readRequestUrl(req: IncomingMessage): URL | null {
  if (!req.url) return null
  return new URL(req.url, REDIRECT_URI)
}

function sendHtml(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "text/html" })
  res.end(body)
}

async function waitForAuthCode(verifier: string): Promise<string> {
  const challenge = base64url(createHash("sha256").update(verifier).digest())
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  })
  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = readRequestUrl(req)
      if (!url || url.pathname !== "/callback") {
        sendHtml(res, 404, "Not found")
        return
      }
      const error = url.searchParams.get("error")
      if (error) {
        sendHtml(res, 400, "Spotify authorization failed. You can close this tab.")
        server.close()
        reject(new Error(error))
        return
      }
      const code = url.searchParams.get("code")
      if (!code) {
        sendHtml(res, 400, "Missing authorization code. You can close this tab.")
        server.close()
        reject(new Error("Missing authorization code"))
        return
      }
      sendHtml(res, 200, "Spotify visualizer is authorized. You can close this tab and return to the terminal.")
      server.close()
      resolve(code)
    })
    server.on("error", reject)
    server.listen(REDIRECT_PORT, "127.0.0.1", () => {
      console.log(`Opening Spotify authorization. Redirect URI: ${REDIRECT_URI}`)
      openUrl(authUrl)
    })
  })
}

async function requestTokens(code: string, verifier: string): Promise<Tokens> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`)
  const body = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
  return { accessToken: body.access_token, refreshToken: body.refresh_token, expiresAt: Date.now() + body.expires_in * 1000 }
}

async function refreshTokens(tokens: Tokens): Promise<Tokens> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }).toString(),
  })
  if (res.status === 400 || res.status === 401) clearTokens()
  if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`)
  const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + body.expires_in * 1000,
  }
}

async function getValidTokens(): Promise<Tokens> {
  const existing = readTokens()
  if (!existing) {
    const verifier = base64url(randomBytes(64))
    const code = await waitForAuthCode(verifier)
    const tokens = await requestTokens(code, verifier)
    writeTokens(tokens)
    return tokens
  }
  if (Date.now() < existing.expiresAt - 60_000) return existing
  const refreshed = await refreshTokens(existing)
  writeTokens(refreshed)
  return refreshed
}

async function fetchPlayback(): Promise<void> {
  try {
    const tokens = await getValidTokens()
    const res = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    if (res.status === 204) {
      state = {
        ...state,
        isPlaying: false,
        progressMs: 0,
        durationMs: 0,
        lastUpdate: performance.now(),
        trackId: "",
        trackName: "Nothing playing",
        artists: "Start playback on Spotify",
      }
      lastError = ""
      return
    }
    if (res.status === 401) clearTokens()
    if (!res.ok) throw new Error(`Spotify playback request failed: ${res.status}`)
    const body = (await res.json()) as SpotifyCurrentlyPlaying
    const item = body.item
    if (!item?.id) {
      state = {
        ...state,
        isPlaying: false,
        progressMs: 0,
        durationMs: 0,
        lastUpdate: performance.now(),
        trackId: "",
        trackName: "Unsupported Spotify item",
        artists: "Play a track to visualize",
      }
      lastError = ""
      return
    }
    state = {
      isPlaying: body.is_playing ?? false,
      progressMs: body.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
      lastUpdate: performance.now(),
      trackId: item.id,
      trackName: item.name ?? "Unknown track",
      artists: item.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || "Unknown artist",
      trackSeed: seedFromId(item.id),
      shuffleState: body.shuffle_state ?? false,
      repeatState: body.repeat_state ?? "off",
    }
    lastError = ""
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
  }
}

async function sendPlayerCommand(label: string, method: "POST" | "PUT", path: string, params?: Record<string, string>): Promise<boolean> {
  try {
    const tokens = await getValidTokens()
    const url = new URL(`https://api.spotify.com/v1/me/player/${path}`)
    for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value)
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })
    if (res.status === 401) clearTokens()
    if (!res.ok && res.status !== 204) throw new Error(`Spotify ${label} request failed: ${res.status}`)
    lastError = ""
    await fetchPlayback()
    return true
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    return false
  }
}

async function togglePlayback(): Promise<void> {
  if (!state.trackId) {
    setNotice("Start playback in Spotify first")
    return
  }
  const endpoint = state.isPlaying ? "pause" : "play"
  await sendPlayerCommand(endpoint, "PUT", endpoint)
}

async function skipNext(): Promise<void> {
  if (!state.trackId) {
    setNotice("Start playback in Spotify first")
    return
  }
  await sendPlayerCommand("next", "POST", "next")
}

async function skipPrevious(): Promise<void> {
  if (!state.trackId) {
    setNotice("Start playback in Spotify first")
    return
  }
  await sendPlayerCommand("previous", "POST", "previous")
}

async function toggleShuffle(): Promise<void> {
  if (!state.trackId) {
    setNotice("Start playback in Spotify first")
    return
  }
  const nextShuffle = !state.shuffleState
  await sendPlayerCommand("shuffle", "PUT", "shuffle", { state: String(nextShuffle) })
}

function nextRepeatState(): "off" | "context" | "track" {
  if (state.repeatState === "off") return "context"
  if (state.repeatState === "context") return "track"
  return "off"
}

async function cycleRepeat(): Promise<void> {
  if (!state.trackId) {
    setNotice("Start playback in Spotify first")
    return
  }
  const nextRepeat = nextRepeatState()
  await sendPlayerCommand("repeat", "PUT", "repeat", { state: nextRepeat })
}

function currentProgressMs(): number {
  if (!state.isPlaying) return state.progressMs
  return state.progressMs + performance.now() - state.lastUpdate
}

function updateHeights(columns: number): void {
  if (heights.length !== columns) heights = new Array(columns).fill(0)
  const now = performance.now()
  const t = now / 1000
  const kick = state.isPlaying ? Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 4 + state.trackSeed), 6) : 0
  pulse += (kick - pulse) * 0.35

  for (let c = 0; c < columns; c++) {
    let target = 0
    if (!state.isPlaying) {
      target = 0.05 + 0.04 * (0.5 + 0.5 * Math.sin(t * 1.1 + c * 0.45))
    } else {
      const base =
        0.5 * Math.abs(Math.sin(c * 0.5 + t * 2.1 + state.trackSeed)) +
        0.3 * Math.abs(Math.sin(c * 0.23 - t * 1.3 + state.trackSeed * 2)) +
        0.2 * Math.abs(Math.sin(c * 0.11 + t * 3.7 + state.trackSeed * 3))
      const flicker = 0.82 + 0.18 * hash(c * 7.3 + Math.floor(t * 12))
      const envelope = 0.45 + 0.55 * Math.sin((c / columns) * Math.PI)
      target = base * flicker * envelope * 0.9 + pulse * 0.12
    }
    target = Math.max(0, Math.min(1, target))
    const smoothing = state.isPlaying ? 0.3 : 0.05
    heights[c] = (heights[c] ?? 0) + (target - (heights[c] ?? 0)) * smoothing
  }
}

function render(): void {
  const width = Math.max(MIN_COLS, process.stdout.columns || 80)
  const height = Math.max(MIN_ROWS, process.stdout.rows || 24)
  const headerRows = 3
  const rows = Math.max(1, height - headerRows)
  const columns = width
  updateHeights(columns)

  const progress = currentProgressMs()
  const title = truncate(`${state.trackName} - ${state.artists}`, width)
  const status = state.isPlaying ? "PLAYING" : "PAUSED"
  const time = state.durationMs > 0 ? `${formatTime(progress)} / ${formatTime(state.durationMs)}` : "--:--"
  const inactiveMode = ansiFg(106, 114, 130)
  const shuffleColor = state.shuffleState ? ansiFg(252, 234, 14) : inactiveMode
  const repeatColor = state.repeatState === "off" ? inactiveMode : ansiFg(230, 0, 38)
  const shuffleMode = `[S:${state.shuffleState ? "*" : "-"}]`
  const repeatValue = state.repeatState === "track" ? "1" : state.repeatState === "context" ? "all" : "-"
  const repeatMode = `[R:${repeatValue}]`
  const modes = `${shuffleColor}${shuffleMode}${reset()} ${repeatColor}${repeatMode}${reset()}`
  const legend = "Space play/pause | n next | p previous | s shuffle | r repeat cycle | q quit"
  const message = visibleNotice() || (lastError ? `Spotify: ${lastError}` : legend)
  const lines: string[] = [
    `${ansiFg(230, 0, 38)}${title}${reset()}`.padEnd(width),
    `${ansiFg(252, 234, 14)}${status}${reset()}  ${time}  ${modes}`.padEnd(width),
    `${ansiFg(106, 114, 130)}${truncate(message, width)}${reset()}`.padEnd(width),
  ]

  for (let r = rows - 1; r >= 0; r--) {
    let line = ""
    for (let c = 0; c < columns; c++) {
      const lit = Math.round((heights[c] ?? 0) * rows)
      if (r < lit) {
        const level = rows > 1 ? r / (rows - 1) : 0
        const [red, green, blue] = ramp(level)
        line += `${ansiFg(red, green, blue)}o`
      } else {
        line += `${dimColor()}.`
      }
    }
    lines.push(`${line}${reset()}`)
  }

  process.stdout.write(`\x1b[H${lines.join("\n")}`)
}

function cleanup(): void {
  if (!running) return
  running = false
  process.stdout.write("\x1b[?25h\x1b[?1049l\x1b[0m")
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
}

function setupInput(): void {
  if (!process.stdin.isTTY) return
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on("data", (data: Buffer) => {
    const value = data.toString("utf8")
    if (value === " ") {
      void togglePlayback()
      return
    }
    if (value === "n") {
      void skipNext()
      return
    }
    if (value === "p") {
      void skipPrevious()
      return
    }
    if (value === "s") {
      void toggleShuffle()
      return
    }
    if (value === "r") {
      void cycleRepeat()
      return
    }
    if (value === "q" || data[0] === 3) {
      cleanup()
      process.exit(0)
    }
  })
}

async function main(): Promise<void> {
  if (process.argv.slice(2).some((arg) => HELP_ARG.has(arg))) {
    console.log(usage())
    return
  }
  if (!CLIENT_ID) fail("Set SPOTIFY_CLIENT_ID to your Spotify app client id before running spotify-visualizer.")
  process.on("SIGINT", () => {
    cleanup()
    process.exit(0)
  })
  process.on("SIGTERM", () => {
    cleanup()
    process.exit(0)
  })
  process.on("exit", cleanup)

  await getValidTokens()
  await fetchPlayback()
  setupInput()
  process.stdout.write("\x1b[?1049h\x1b[?25l")
  process.stdout.write(clearScreen())
  setInterval(() => void fetchPlayback(), POLL_MS)
  setInterval(render, 1000 / FPS)
}

void main().catch((error: unknown) => {
  cleanup()
  fail(error instanceof Error ? error.message : String(error))
})
