import { describe, expect, mock, test } from 'claude-code/testing'

function typed(command: string) {
  return { command, args: '', origin: { kind: 'composer' as const }, presentation: { isFullscreen: false, columns: 80 } }
}

function ran(stdout: string, exitCode = 0) {
  return { value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
}

describe('register', () => {
  test('/update installs a newer version, records the session, and exits', async ($, on) => {
    const writes: { path: string; text: string }[] = []
    const commands: string[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('command.register', ($, e) => ({ value: { command: e.name } }))
    on('session.version', () => ({ value: { version: '2.1.287', base: '2.1.287' } }))
    on('session.id', () => ({ value: 'abc-123' }))
    mock.env(on, { CLAUDE_RELAUNCH_FILE: '/tmp/claude-relaunch.X' })
    const clock = mock.clock(on)
    on('process.run', ($, e) => (e.argv[1] === '--version' ? ran('2.1.290 (Claude Code)\n') : ran('Updated\n')))
    on('fs.write', ($, e) => {
      writes.push({ path: e.path, text: e.text })
      return { value: undefined }
    })
    on('command.run', ($, e) => {
      commands.push(e.command)
      return {}
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const { text } = await $.command.run(typed('update'))
    await clock.settle()

    expect(text).toBe('Updated Claude Code: 2.1.287 -> 2.1.290. Restarting Claude Code…')
    expect(writes).toEqual([{ path: '/tmp/claude-relaunch.X', text: 'abc-123' }])
    expect(commands).toContain('exit')
  })

  test('/update stays put when already on the installed version', async ($, on) => {
    const writes: string[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('command.register', ($, e) => ({ value: { command: e.name } }))
    on('session.version', () => ({ value: { version: '2.1.287', base: '2.1.287' } }))
    on('process.run', ($, e) => (e.argv[1] === '--version' ? ran('2.1.287 (Claude Code)\n') : ran('Up to date\n')))
    on('fs.write', ($, e) => {
      writes.push(e.path)
      return { value: undefined }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const { text } = await $.command.run(typed('update'))

    expect(text).toBe('Claude Code is up to date (2.1.287).')
    expect(writes).toEqual([])
  })

  test('/restart outside the shell wrapper prints the resume command instead of exiting', async ($, on) => {
    const writes: string[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('command.register', ($, e) => ({ value: { command: e.name } }))
    on('session.id', () => ({ value: 'abc-123' }))
    mock.env(on, {})
    on('fs.write', ($, e) => {
      writes.push(e.path)
      return { value: undefined }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const { text } = await $.command.run(typed('restart'))

    expect(text).toBe('Exit and run `claude --resume abc-123` to continue on the new version.')
    expect(writes).toEqual([])
  })
})
