import type { Register } from 'claude-code'

export const register: Register = on => {
  on('skill.prompt', ($, e, next) => {
    $.ui.toast(`Skill ready: /${e.skill}`)

    return next(e)
  })
}
