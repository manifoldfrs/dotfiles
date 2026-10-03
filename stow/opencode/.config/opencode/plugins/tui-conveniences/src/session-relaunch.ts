import { writeFile } from "node:fs/promises"

type RelaunchAction = "restart" | "update"

/** Requests a session relaunch; the parent Bash wrapper owns upgrade and shared server restart. */
export async function requestSessionRelaunch(
  action: RelaunchAction,
  sessionID: string,
  relaunchFile: string | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!relaunchFile) {
    return {
      ok: false,
      message: "Launch OpenCode through the Bash opencode wrapper to use /restart and /update.",
    }
  }
  if (!/^ses[A-Za-z0-9_-]+$/.test(sessionID)) {
    return { ok: false, message: "OpenCode relaunch: invalid session ID." }
  }
  try {
    await writeFile(relaunchFile, `${action}\n${sessionID}\n`, { mode: 0o600 })
    return { ok: true }
  } catch {
    return { ok: false, message: "OpenCode relaunch: could not write the relaunch request." }
  }
}
