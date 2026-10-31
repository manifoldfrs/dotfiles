import { Plugin } from "@opencode/plugin"
import { Option } from "effect"
import { MIN_ANSWER_CHARS, hasJson, reviewAnswer, type Evidence } from "./answer.ts"
import { decodeToolInput, errorMessage, isJevTool, logFailure, resultText, toolCaller, type CallIdentity, type Context, type Generate, type Json } from "./jev.ts"
import { PIPELINE_DESCRIPTION, PIPELINE_INPUT, PIPELINE_TOOL, decodePipelineInput, runPipeline } from "./pipeline-tool.ts"
import { DECISION_REMINDER, editOf, reviewScope, type CodeEdit } from "./scope.ts"
import { isScreened, screenResult, withWarning } from "./screen.ts"

// Send-backs start with this marker so the prompt hook does not treat them as a new user turn.
const SEND_BACK = "[jev]"

const RECENT_PROMPTS = 3

const MAX_EVIDENCE = 40

const INPUT_CHARS = 500

// earlier holds recent turns' tool output, since answers often recap work from before the latest prompt.
type Turn = {
  prompts: string[]
  edits: CodeEdit[]
  evidence: Evidence[]
  earlier: Evidence[]
  seq: number
  lastCall: CallIdentity | undefined
  reminded: boolean
  checked: boolean
}

type SessionMessage = Awaited<ReturnType<Context["session"]["context"]>>[number]

// One server hosts every session, so turn state is keyed by session. It resets on plugin reload, losing at most a turn in flight.
const turns = new Map<string, Turn>()

function turnOf(sessionID: string) {
  const existing = turns.get(sessionID)

  if (existing) return existing

  const turn: Turn = { prompts: [], edits: [], evidence: [], earlier: [], seq: 0, lastCall: undefined, reminded: false, checked: false }

  turns.set(sessionID, turn)

  return turn
}

// The call's input is evidence too: answers report which command ran or which file was read.
function evidenceOf(turn: Turn, tool: string, input: Json, output: string): Evidence {
  const args = JSON.stringify(input).slice(0, INPUT_CHARS)

  turn.seq += 1

  return { id: `${turn.seq}:${tool}`, text: `${tool} input: ${args}\n${output}` }
}

function requestEvidence(turn: Turn): Evidence[] {
  const request = turn.prompts.at(-1)

  return request ? [{ id: "user-request", text: `The user's request. It shows what was asked, not what is true:\n${request}` }] : []
}

function answerText(message: SessionMessage) {
  if (message.type !== "assistant") return ""

  return message.content.flatMap(part => (part.type === "text" ? [part.text] : [])).join("\n")
}

async function failure(check: string, cause: unknown, instruction: string) {
  await logFailure(check, cause)

  return `Automatic Jev ${check} failed (${errorMessage(cause)}). ${instruction}`
}

function sessionGenerate(ctx: Context, sessionID: string): Generate {
  return async prompt => (await ctx.session.generate({ sessionID, prompt })).text
}

async function checkTurn(ctx: Context, sessionID: string, turn: Turn, identity: CallIdentity) {
  const messages = await ctx.session.context({ sessionID })
  const last = messages.findLast(message => message.type === "assistant")

  if (!last) return undefined

  const answer = answerText(last)
  const tools = toolCaller(ctx, identity)
  const checkAnswer = turn.evidence.length > 0 && (answer.length >= MIN_ANSWER_CHARS || hasJson(answer))

  const sections = await Promise.all([
    turn.edits.length
      ? reviewScope(tools, turn.prompts, turn.edits).catch(cause =>
          failure("edit-scope audit", cause, "Do not claim it passed; perform the normal final review and completion gate."))
      : undefined,
    checkAnswer
      ? reviewAnswer(tools, sessionGenerate(ctx, sessionID), answer, [...requestEvidence(turn), ...turn.earlier, ...turn.evidence]).catch(cause =>
          failure("answer check", cause, "Do not claim your answer was verified; check its claims against the tool output yourself."))
      : undefined,
  ])

  const flagged = sections.flatMap(section => (section ? [section] : []))

  return flagged.length ? flagged.join("\n\n") : undefined
}

export default Plugin.define({
  id: "jev",
  async setup(ctx) {
    await ctx.session.hook("prompt", e => {
      if (e.prompt.text.startsWith(SEND_BACK)) return

      const turn = turnOf(e.sessionID)

      turn.prompts = [...turn.prompts, e.prompt.text].slice(-RECENT_PROMPTS)
      turn.edits = []
      turn.earlier = [...turn.earlier, ...turn.evidence].slice(-MAX_EVIDENCE)
      turn.evidence = []
      turn.reminded = false
      turn.checked = false
    })

    await ctx.tool.hook("execute.after", async e => {
      if (isJevTool(e.tool) || e.tool === PIPELINE_TOOL) return

      const turn = turnOf(e.sessionID)
      const identity: CallIdentity = { sessionID: e.sessionID, agent: e.agent, messageID: e.messageID, id: e.id }
      const input = Option.getOrElse(decodeToolInput(e.input), (): Json => null)

      turn.lastCall = identity

      if (e.status === "error") {
        turn.evidence = [...turn.evidence, evidenceOf(turn, e.tool, input, `Error: ${e.error.message}`)].slice(-MAX_EVIDENCE)

        return
      }

      if (isScreened(e.tool, input)) e.result = await screenResult(toolCaller(ctx, identity), e.result)

      turn.evidence = [...turn.evidence, evidenceOf(turn, e.tool, input, resultText(e.result))].slice(-MAX_EVIDENCE)

      const edit = editOf(e.tool, input)

      if (!edit) return

      turn.edits.push(edit)

      if (turn.reminded) return

      turn.reminded = true
      e.result = withWarning(e.result, DECISION_REMINDER)
    })

    await ctx.session.hook("experimental.idle", async e => {
      // The session wakes again when its own shell or subagent finishes, so check the turn then.
      if (e.background.some(job => job.sessionID === e.sessionID)) return

      const turn = turns.get(e.sessionID)

      // A turn with edits or evidence ran a tool, so lastCall carries the IDs the check's own tool calls report under.
      if (!turn?.lastCall || turn.checked || (!turn.edits.length && !turn.evidence.length)) return

      turn.checked = true

      const text = await checkTurn(ctx, e.sessionID, turn, turn.lastCall)

      if (text) await ctx.session.synthetic({ sessionID: e.sessionID, text: `${SEND_BACK} ${text}` })
    })

    await ctx.tool.transform(editor => {
      editor.add({
        name: PIPELINE_TOOL,
        description: PIPELINE_DESCRIPTION,
        input: PIPELINE_INPUT,
        options: { codemode: false },
        execute: async (input, context) => {
          const identity: CallIdentity = { sessionID: context.sessionID, agent: context.agent, messageID: context.messageID, id: context.id }

          try {
            return { content: JSON.stringify(await runPipeline(toolCaller(ctx, identity), context.sessionID, decodePipelineInput(input))) }
          } catch (cause) {
            throw new Error(`jev-pipeline failed: ${errorMessage(cause)}`)
          }
        },
      })
    })
  },
})
