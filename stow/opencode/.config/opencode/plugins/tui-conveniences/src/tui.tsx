import { execFile } from "node:child_process"
import { Plugin } from "@opencode/plugin/tui"
import { createSignal } from "solid-js"
import { requestSessionRelaunch } from "./session-relaunch.ts"

const UPDATE_INTERVAL_MS = 2_000

function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, timeout: 2_000, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout.trimEnd())
      },
    )
  })
}

function countUnstagedFiles(statusOutput: string): number {
  if (statusOutput.length === 0) return 0
  return statusOutput
    .split("\n")
    .filter((line) => line.startsWith("??") || line[1] !== " ").length
}

function skillLoadedMessage(skillID: string): string {
  return `Loaded skill: /${skillID}`
}

async function gitStatus(cwd: string): Promise<string> {
  await runGit(["rev-parse", "--is-inside-work-tree"], cwd)
  const [branchOutput, head, status] = await Promise.all([
    runGit(["branch", "--show-current"], cwd),
    runGit(["rev-parse", "--short", "HEAD"], cwd),
    runGit(["status", "--porcelain", "--untracked-files=normal"], cwd),
  ])
  const branch = branchOutput || `detached@${head}`
  const count = countUnstagedFiles(status)
  return ` ${branch} · ${count} unstaged ${count === 1 ? "file" : "files"}`
}

function Footer(props: {
  context: Plugin.Context
  status: () => string
}) {
  let relaunching = false
  const relaunch = async (action: "restart" | "update") => {
    if (relaunching) return
    const route = props.context.ui.router.current()
    if (route.type !== "session") {
      props.context.ui.toast.show({
        message: "Open a session before restarting OpenCode.",
        variant: "warning",
      })
      return
    }
    relaunching = true
    const result = await requestSessionRelaunch(
      action,
      route.sessionID,
      process.env.OPENCODE_RELAUNCH_FILE,
    )
    if (!result.ok) {
      relaunching = false
      props.context.ui.toast.show({ message: result.message, variant: "error" })
      return
    }
    props.context.keymap.dispatch("app.exit")
  }
  props.context.keymap.layer(() => ({
    mode: "global",
    priority: 10,
    commands: [
      {
        id: "frsh.session.restart",
        title: "Restart OpenCode and shared server",
        group: "OpenCode",
        palette: true,
        slash: { name: "restart" },
        run: () => relaunch("restart"),
      },
      {
        id: "frsh.session.update",
        title: "Upgrade OpenCode and restart shared server",
        group: "OpenCode",
        palette: true,
        slash: { name: "update", aliases: ["upgrade"] },
        run: () => relaunch("update"),
      },
      {
        id: "frsh.copy-all",
        title: "Copy complete session transcript",
        group: "Session",
        palette: true,
        slash: { name: "copy-all" },
        run: () => props.context.keymap.dispatch("session.copy"),
      },
    ],
  }))

  return <text fg={props.context.theme.text.muted}>{props.status()}</text>
}

export default Plugin.define({
  id: "frsh.tui-conveniences.cli",
  setup(context) {
    const directory =
      context.location?.directory ?? context.data.location.default().directory
    const [status, setStatus] = createSignal("")

    const updateStatus = async (): Promise<void> => {
      try {
        setStatus(await gitStatus(directory))
      } catch {
        setStatus("")
      }
    }

    void updateStatus()
    const timer = setInterval(() => void updateStatus(), UPDATE_INTERVAL_MS)
    const removeStatus = context.ui.slot({
      append: "prompt.footer.status",
      render: () => <Footer context={context} status={status} />,
    })

    const stopSkillLoaded = context.data.on("session.skill.activated", (event) => {
      context.ui.toast.show({
        title: "Skill ready",
        message: skillLoadedMessage(event.data.id),
        variant: "success",
        duration: 3_000,
      })
    })

    return () => {
      clearInterval(timer)
      stopSkillLoaded()
      removeStatus()
    }
  },
})

export { countUnstagedFiles, skillLoadedMessage }
