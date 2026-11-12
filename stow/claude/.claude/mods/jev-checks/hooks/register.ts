import type { Register } from 'claude-code'

import { registerCoding } from './coding.ts'
import { registerPipeline } from './pipeline.ts'
import { registerScreen } from './screen.ts'

export const register: Register = (on, options) => {
  registerPipeline(on, options)
  // First registered is outermost, so the answer check records what screening let through, as Pi does.
  registerCoding(on, options)
  registerScreen(on, options)
}
