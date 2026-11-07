import { Plugin } from "@opencode/plugin"
import { Option } from "effect"
import { decodeToolInput, isJevTool, jevCaller, logFailure, logNote, resultText, toolCaller, type CallIdentity, type Context } from "./jev.ts"
import { PIPELINE_INPUT, PIPELINE_TOOL, runPipelineTool } from "./pipeline-tool.ts"
import { editOf } from "./scope.ts"
import { isScreened, isSentLink, screenResult, withWarning } from "./screen.ts"
import { DECISION_REMINDER, MAX_EVIDENCE, PIPELINE_DESCRIPTION, RECENT_PROMPTS, errorText, isSecretFile, reviewTurn, toolEvidence, type CodeEdit, type Evidence, type Generate, type Json, type TurnReview } from "./shared.ts"

// Send-backs start with this marker so the prompt hook does not treat them as a new user turn.
const SEND_BACK = "[jev]"

// The model reads text and the person reads description, so a note for the person needs placeholder text the model can pass over.
const PERSON_ONLY = `${SEND_BACK} A note was shown to the user. It needs no reply.`

// OpenCode runs anything sent during the idle hook, even with resume false, so a note must arrive after the session is idle.
const NOTE_DELAY_MS = 250

const MAX_SESSIONS = 50

type SessionMessage = Awaited<ReturnType<Context["session"]["context"]>>[number]

type SessionID = Parameters<Context["session"]["get"]>[0]["sessionID"]

type Turn = {
  mainSession: SessionID | undefined
  prompts: string[]
  edits: CodeEdit[]
  evidence: Evidence[]
  notes: string[]
  seq: number
  lastCall: CallIdentity | undefined
  ranTool: boolean
  reminded: boolean
  checked: boolean
}

// One server hosts every session for days, so turn state is keyed by session and only the most recently used are kept.
const turns = new Map<string, Turn>()

function forgetOldestSession() {
  const oldest = turns.keys().next()

  if (!oldest.done) turns.delete(oldest.value)
}

function turnOf(sessionID: string) {
  const existing = turns.get(sessionID)

  if (existing) {
    turns.delete(sessionID)
    turns.set(sessionID, existing)

    return existing
  }

  const turn: Turn = { mainSession: undefined, prompts: [], edits: [], evidence: [], notes: [], seq: 0, lastCall: undefined, ranTool: false, reminded: false, checked: false }

  turns.set(sessionID, turn)

  if (turns.size > MAX_SESSIONS) forgetOldestSession()

  return turn
}

function recordEvidence(turn: Turn, tool: string, input: Json, output: string) {
  turn.seq += 1
  turn.ranTool = true
  turn.evidence = [...turn.evidence, toolEvidence(turn.seq, tool, JSON.stringify(input), output)].slice(-MAX_EVIDENCE)
}

function answerText(message: SessionMessage) {
  if (message.type !== "assistant") return ""

  return message.content.flatMap(part => (part.type === "text" ? [part.text] : [])).join("\n")
}

// A subagent runs in a child session: its prompt and output are the agent's, but its edits belong to the main turn.
async function mainSessionOf(ctx: Context, sessionID: SessionID): Promise<SessionID | undefined> {
  const turn = turnOf(sessionID)

  if (turn.mainSession) return turn.mainSession

  try {
    const { parentID } = await ctx.session.get({ sessionID })

    turn.mainSession = parentID === undefined ? sessionID : await mainSessionOf(ctx, parentID)

    return turn.mainSession
  } catch (cause) {
    await logFailure("session lookup", cause)

    return undefined
  }
}

// Stateless like Claude Code's model call: with the session in view, a claim the user asked for reads as coming from them and goes unchecked.
function statelessGenerate(ctx: Context): Generate {
  return async prompt => (await ctx.experimental.generate.text({ prompt })).text
}

async function reviewFinishedTurn(ctx: Context, sessionID: SessionID, turn: Turn, identity: CallIdentity): Promise<TurnReview> {
  const messages = await ctx.session.context({ sessionID })
  const last = messages.findLast(message => message.type === "assistant")

  if (!last) return { agent: undefined, person: [] }

  const { prompts, edits, evidence, ranTool } = turn
  const callJev = jevCaller(toolCaller(ctx, identity))

  return reviewTurn(callJev, statelessGenerate(ctx), { prompts, edits, answer: answerText(last), evidence, ranTool })
}

async function deliver(ctx: Context, sessionID: SessionID, review: TurnReview) {
  const description = review.person.join("\n\n")

  if (review.agent) {
    await ctx.session.synthetic({ sessionID, text: `${SEND_BACK} ${review.agent}`, ...(description && { description }) })

    return
  }

  if (!description) return

  setTimeout(() => {
    ctx.session.synthetic({ sessionID, text: PERSON_ONLY, description, resume: false }).catch(cause => logFailure("showing a note", cause))
  }, NOTE_DELAY_MS)
}

export default Plugin.define({
  id: "jev",
  async setup(ctx) {
    await ctx.session.hook("prompt", e => {
      if (e.prompt.text.startsWith(SEND_BACK)) return

      const turn = turnOf(e.sessionID)

      turn.prompts = [...turn.prompts, e.prompt.text].slice(-RECENT_PROMPTS)
      turn.edits = []
      turn.ranTool = false
      turn.reminded = false
      turn.checked = false
    })

    await ctx.tool.hook("execute.after", async e => {
      if (isJevTool(e.tool) || e.tool === PIPELINE_TOOL) return

      const turn = turnOf(e.sessionID)
      const identity: CallIdentity = { sessionID: e.sessionID, agent: e.agent, messageID: e.messageID, id: e.id }
      const input = Option.getOrElse(decodeToolInput(e.input), (): Json => null)
      const secret = input === null || isSecretFile(JSON.stringify(input))
      const main = await mainSessionOf(ctx, e.sessionID)
      const inChildSession = main !== undefined && main !== e.sessionID
      const mainTurn = main === undefined ? turn : turnOf(main)

      turn.lastCall = identity

      if (e.status === "error") {
        if (!secret && !inChildSession) recordEvidence(turn, e.tool, input, `Error: ${e.error.message}`)

        return
      }

      if (isScreened(e.tool, input)) {
        const sentByUser = main === e.sessionID && isSentLink(e.tool, input, turn.prompts)

        const showNote = async (note: string) => {
          await logNote(note)
          mainTurn.notes.push(note)
        }

        e.result = await screenResult(jevCaller(toolCaller(ctx, identity)), showNote, e.result, { sentByUser, secret })
      }

      if (!secret && !inChildSession) recordEvidence(turn, e.tool, input, resultText(e.result))

      const edit = editOf(e.tool, input)

      // A patch can touch any file, and only its input names them.
      if (!edit || isSecretFile(edit.file) || (e.tool === "patch" && secret)) return

      mainTurn.edits.push(edit)

      if (mainTurn.reminded) return

      mainTurn.reminded = true
      e.result = withWarning(e.result, DECISION_REMINDER)
    })

    await ctx.session.hook("experimental.idle", async e => {
      // The session wakes again when its own shell or subagent finishes, so check the turn then.
      if (e.background.some(job => job.sessionID === e.sessionID)) return

      const turn = turns.get(e.sessionID)

      // lastCall carries the IDs the check's own tool calls report under, so a turn without one ran no tool to check.
      if (!turn?.lastCall || turn.checked) return

      const main = await mainSessionOf(ctx, e.sessionID)

      // A failed lookup proves nothing about the session, so the turn is still checked.
      if (main !== undefined && main !== e.sessionID) return

      turn.checked = true

      const review = await reviewFinishedTurn(ctx, e.sessionID, turn, turn.lastCall).catch((cause): TurnReview => ({
        agent: undefined,
        person: [`Jev answer check did not run: ${errorText(cause)}`],
      }))

      await deliver(ctx, e.sessionID, { agent: review.agent, person: [...review.person, ...turn.notes] })

      turn.notes = []
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
            const json = Option.getOrElse(decodeToolInput(input), (): Json => null)

            return { content: JSON.stringify(await runPipelineTool(toolCaller(ctx, identity), context.sessionID, json)) }
          } catch (cause) {
            throw new Error(`jev-pipeline failed: ${errorText(cause)}`)
          }
        },
      })
    })
  },
})
