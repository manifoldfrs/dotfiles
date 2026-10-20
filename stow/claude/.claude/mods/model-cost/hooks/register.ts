import type { EngineInterface, Register } from 'claude-code'

type Costs = Record<string, number>

// The engine reports only the session total, so each step is charged the total's growth since the last step.
// Side calls (titles, classifiers) land on the next step's model, and parallel subagents can swap charges.
let costs: Costs = {}
let lastUsd = 0

// statusline.sh reads this file by session id.
async function costFile($: EngineInterface) {
  const dir = (await $.env.get('TMPDIR')) || '/tmp/'
  return `${dir.replace(/\/?$/, '/')}claude-model-cost-${await $.session.id()}.json`
}

async function sessionUsd($: EngineInterface) {
  const { cost } = await $.session.usage()
  return cost?.usd ?? 0
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const path = await costFile($)
    const saved = await $.fs.read(path).catch(() => undefined)
    costs = saved ? JSON.parse(saved) : {}
    lastUsd = await sessionUsd($)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)

    const usd = await sessionUsd($)
    // A smaller total means /clear restarted the ledger.
    if (usd < lastUsd) {
      costs = {}
      lastUsd = 0
    }

    const model = result.usage?.model ?? e.model
    costs[model] = (costs[model] ?? 0) + usd - lastUsd
    lastUsd = usd
    await $.fs.write(await costFile($), JSON.stringify(costs))

    return result
  })
}
