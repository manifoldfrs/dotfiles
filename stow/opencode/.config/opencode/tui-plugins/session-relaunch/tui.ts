import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { Plugin } from '@opencode/plugin/tui'

type Context = Plugin.Context

type Run = { ok: boolean; output: string }

function run(argv: string[], timeout: number) {
  return new Promise<Run>(resolve => {
    execFile(argv[0], argv.slice(1), { timeout }, (error, stdout, stderr) => {
      resolve({ ok: !error, output: [stdout, stderr].filter(Boolean).join('\n').trim() || (error?.message ?? '') })
    })
  })
}

async function installedVersion() {
  const { ok, output } = await run(['opencode', '--version'], 10_000)

  if (!ok) return undefined

  return output.match(/\d+\.\d+\.\d+\S*/)?.[0]
}

async function confirmBusySessions(context: Context) {
  const busy = context.data.session.list().filter(session => context.data.session.status(session.id) === 'running')

  if (busy.length === 0) return true

  const confirmed = await context.ui.dialog.confirm({
    title: 'Restart OpenCode?',
    message: `${busy.length} running session${busy.length === 1 ? '' : 's'} will be interrupted by the service restart.`,
    label: { confirm: 'Restart', cancel: 'Cancel' },
  })

  return confirmed === true
}

// The shell's `opencode` wrapper sets OPENCODE_RELAUNCH_FILE and resumes the session id written there after exit.
async function relaunch(context: Context, summary?: string) {
  const route = context.ui.router.current()
  const sessionID = route.type === 'session' ? route.sessionID : undefined
  const relaunchFile = process.env.OPENCODE_RELAUNCH_FILE

  if (!relaunchFile) {
    const resume = sessionID ? `opencode -s ${sessionID}` : 'opencode'
    context.ui.toast.show({ message: [summary, `Exit and run \`${resume}\` to continue on the new version.`].filter(Boolean).join(' '), variant: 'warning' })

    return
  }

  if (!await confirmBusySessions(context)) return

  context.ui.toast.show({ message: [summary, 'Restarting OpenCode…'].filter(Boolean).join(' ') })
  const restart = await run(['opencode', 'service', 'restart'], 60_000)

  if (!restart.ok) {
    context.ui.toast.show({ message: `OpenCode service restart failed. ${restart.output || 'No output.'}`, variant: 'error' })

    return
  }

  // An empty file still relaunches; the wrapper starts a fresh TUI when no session was open.
  await writeFile(relaunchFile, sessionID ?? '\n')
  context.keymap.dispatch('app.exit')
}

async function offerRelaunch(context: Context, version: string) {
  if (version === context.app.version.replace(/^v/, '')) return

  const confirmed = await context.ui.dialog.confirm({
    title: 'OpenCode updated',
    message: `OpenCode ${version} is installed. Relaunch now and resume this session?`,
    label: { confirm: 'Relaunch', cancel: 'Later' },
  })

  if (confirmed === true) await relaunch(context, `Updated OpenCode to ${version}.`)
}

async function upgrade(context: Context) {
  const running = context.app.version.replace(/^v/, '')
  context.ui.toast.show({ message: `Checking for OpenCode updates (${running})…` })
  const result = await run(['opencode', 'upgrade'], 180_000)

  if (!result.ok) {
    context.ui.toast.show({ message: `OpenCode update failed. ${result.output || 'No output.'}`, variant: 'error' })

    return
  }

  const installed = await installedVersion()

  if (!installed || installed === running) {
    context.ui.toast.show({ message: `OpenCode is up to date (${running}).`, variant: 'success' })

    return
  }

  await relaunch(context, `Updated OpenCode: ${running} -> ${installed}.`)
}

export default Plugin.define({
  id: 'session-relaunch',
  setup(context) {
    // OpenCode's built-in /update installs without relaunching, so this uses /upgrade to avoid shadowing it.
    context.keymap.layer(() => ({
      mode: 'global',
      commands: [
        {
          id: 'session-relaunch.upgrade',
          title: 'Upgrade OpenCode and relaunch',
          description: 'Upgrade OpenCode, then resume this session on the new version',
          palette: true,
          slash: { name: 'upgrade' },
          run: () => upgrade(context),
        },
        {
          id: 'session-relaunch.relaunch',
          title: 'Relaunch OpenCode',
          description: 'Restart the OpenCode service and TUI, then resume this session',
          palette: true,
          slash: { name: 'relaunch' },
          run: () => relaunch(context),
        },
      ],
    }))

    return context.data.on('installation.updated', event => {
      // The event handler cannot await, so the prompt runs detached and reports its own failure.
      offerRelaunch(context, event.data.version.replace(/^v/, '')).catch(cause => {
        context.ui.toast.show({ message: `OpenCode relaunch failed. ${cause instanceof Error ? cause.message : String(cause)}`, variant: 'error' })
      })
    })
  },
})
