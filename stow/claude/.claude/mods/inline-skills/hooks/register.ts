import type { EngineInterface, Register } from 'claude-code'

// Ported from Pi's inline-skills extension: `/name` at a word start, ending at whitespace, closing punctuation, or the end, so paths like `/tmp/x` never match.
const SKILL_MENTION = /(?<=^|[\s(])\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=$|\s|[.,;:!?)](?:\s|$))/g
const CODE_SPAN = /```[\s\S]*?```|`[^`\n]*`/g
const FRONTMATTER = /^---\n[\s\S]*?\n---\n/

type SkillFile = { name: string; path: string; body: string }

/** Returns the names mentioned as `/name` outside code, in mention order. */
export function findMentions(text: string): string[] {
  const prose = text.replace(CODE_SPAN, code => ' '.repeat(code.length))
  return [...new Set([...prose.matchAll(SKILL_MENTION)].map(match => match[1] ?? ''))]
}

/** Resolves a name as Claude Code ranks same-named skills: personal before project. */
async function findSkill($: EngineInterface, name: string, dirs: string[]): Promise<SkillFile | undefined> {
  for (const dir of dirs) {
    const path = `${dir}/${name}/SKILL.md`
    const text = await $.fs.read(path).catch(() => undefined)
    if (text !== undefined) return { name, path, body: text.replace(FRONTMATTER, '').trim() }
  }
  return undefined
}

function skillBlock(skill: SkillFile) {
  const base = skill.path.slice(0, skill.path.lastIndexOf('/'))
  return `<skill name="${skill.name}" location="${skill.path}">\nReferences are relative to ${base}.\n\n${skill.body}\n</skill>`
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (e.isMeta) return next(e)
    // A leading `/name` is the engine's own command, expanded already.
    const names = findMentions(e.text).filter(name => name !== e.command?.name)
    if (!names.length) return next(e)

    const home = await $.env.get('HOME')
    const dirs = [...(home ? [`${home}/.claude/skills`] : []), `${await $.session.root()}/.claude/skills`]
    const skills = (await Promise.all(names.map(name => findSkill($, name, dirs)))).filter(skill => skill !== undefined)
    if (!skills.length) return next(e)

    $.ui.toast(`Skills loaded: ${skills.map(skill => `/${skill.name}`).join(' ')}`)
    return next({ ...e, context: [...(e.context ?? []), ...skills.map(skillBlock)] })
  })
}
