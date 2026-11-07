import { Option, Schema } from "effect"
import type { CodeEdit, Json } from "./shared.ts"

// Argument names of OpenCode's built-in edit, write, and patch tools.
const decodeEdit = Schema.decodeUnknownOption(Schema.Struct({ path: Schema.String, oldString: Schema.String, newString: Schema.String }))

const decodeWrite = Schema.decodeUnknownOption(Schema.Struct({ path: Schema.String, content: Schema.String }))

const decodePatch = Schema.decodeUnknownOption(Schema.Struct({ patchText: Schema.String }))

const editParsers = new Map<string, (input: Json) => Option.Option<CodeEdit>>([
  ["edit", input => Option.map(decodeEdit(input), args => ({ file: args.path, before: args.oldString, after: args.newString }))],
  ["write", input => Option.map(decodeWrite(input), args => ({ file: args.path, before: "", after: args.content }))],
  ["patch", input => Option.map(decodePatch(input), args => ({ file: "patch", before: "", after: args.patchText }))],
])

export function editOf(tool: string, input: Json) {
  const parse = editParsers.get(tool)

  return parse ? Option.getOrUndefined(parse(input)) : undefined
}
