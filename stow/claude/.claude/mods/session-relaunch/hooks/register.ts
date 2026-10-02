import type { EngineInterface, Register } from 'claude-code'

async function installedVersion($: EngineInterface) {
  const { exitCode, stdout } = await $.process.run(['claude', '--version'], { timeoutMs: 10_000 })
  if (exitCode !== 0) return undefined
  return stdout.trim().split(/\s+/)[0] || undefined
}

// The shell's `claude` wrapper sets CLAUDE_RELAUNCH_FILE and resumes the session id written there after exit.
async function relaunch($: EngineInterface, summary?: string) {
  const sessionId = await $.session.id()
  const relaunchFile = await $.env.get('CLAUDE_RELAUNCH_FILE')
  if (!relaunchFile) {
    return { text: [summary, `Exit and run \`claude --resume ${sessionId}\` to continue on the new version.`].filter(Boolean).join(' ') }
  }

  await $.fs.write(relaunchFile, sessionId)
  // A command can't run another command while its own hook is in flight, so exit once this one returns.
  $.clock.after(0, () => {
    void $.command.run({ command: 'exit' })
  })
  return { text: [summary, 'Restarting Claude Code…'].filter(Boolean).join(' ') }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'update', description: 'Update Claude Code, then resume this session on the new version' })
    await $.command.register({ name: 'restart', description: 'Restart Claude Code and resume this session' })

    return next(e)
  })

  on('command.run', { command: 'update' }, async $ => {
    const { version: running } = await $.session.version()
    const update = await $.process.run(['claude', 'update'], { timeoutMs: 180_000 })
    if (update.exitCode !== 0) {
      const output = [update.stdout, update.stderr].filter(Boolean).join('\n').trim()
      return { text: `Claude Code update failed. ${output || 'No output.'}` }
    }

    const installed = await installedVersion($)
    if (!installed || installed === running) return { text: `Claude Code is up to date (${running}).` }

    return relaunch($, `Updated Claude Code: ${running} -> ${installed}.`)
  })

  on('command.run', { command: 'restart' }, $ => relaunch($))
}
