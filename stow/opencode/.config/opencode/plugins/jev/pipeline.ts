import { Option, Schema } from "effect"
import type { Json } from "./jev.ts"

const Paths = Schema.NonEmptyArray(Schema.NonEmptyString)

const Source = Schema.Struct({
  server: Schema.NonEmptyString,
  tool: Schema.NonEmptyString,
  args: Schema.optionalKey(Schema.JsonObject),
  items: Schema.optionalKey(Schema.NonEmptyString),
})

const Enrich = Schema.Struct({ ...Source.fields, text: Paths })

const Fields = Schema.Struct({ id: Schema.optionalKey(Schema.NonEmptyString), title: Schema.optionalKey(Schema.NonEmptyString), text: Paths })

const Classify = Schema.Struct({
  kind: Schema.Literal("classify"),
  classes: Schema.Array(Schema.Struct({ id: Schema.optionalKey(Schema.NonEmptyString), description: Schema.NonEmptyString })).check(Schema.isMinLength(2)),
  purpose: Schema.optionalKey(Schema.String),
  context: Schema.optionalKey(Schema.Json),
  auto_accept: Schema.optionalKey(Schema.Number),
  minimum_margin: Schema.optionalKey(Schema.Number),
})

const Rerank = Schema.Struct({ kind: Schema.Literal("rerank"), query: Schema.NonEmptyString, top_k: Schema.optionalKey(Schema.Int) })

/** The jev_pipeline tool input. The model writes it, so it is decoded in full before any MCP or Jev call runs. */
export const PipelineInput = Schema.Struct({
  source: Source,
  fields: Fields,
  enrich: Schema.optionalKey(Enrich),
  judge: Schema.Union([Classify, Rerank]),
  limit: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 })),
})

export type PipelineInput = typeof PipelineInput.Type

export type McpStep = typeof Source.Type

export type Classify = typeof Classify.Type

export type Rerank = typeof Rerank.Type

export type Item = { readonly key: string; readonly id: string; readonly title: string; readonly text: string }

// Jev truncates item text at 2,000 characters; trimming here keeps request payloads small.
export const JEV_TEXT_LIMIT = 2_000

export const CLASSIFY_BATCH = 64

export const RERANK_BATCH = 250

const decodeString = Schema.decodeUnknownOption(Schema.String)

const decodeObject = Schema.decodeUnknownOption(Schema.JsonObject)

const decodeList = Schema.decodeUnknownOption(Schema.Array(Schema.Json))

function child(node: Json | undefined, key: string): Json | undefined {
  if (node === undefined) return undefined

  const list = decodeList(node)

  if (Option.isSome(list)) return list.value[Number(key)]

  return Option.match(decodeObject(node), { onNone: () => undefined, onSome: object => object[key] })
}

export function at(value: Json, path: string | undefined): Json | undefined {
  if (!path) return value

  return path.split(".").reduce<Json | undefined>(child, value)
}

export function listAt(value: Json, path: string | undefined): readonly Json[] {
  const list = decodeList(at(value, path))

  if (Option.isNone(list)) throw new Error(`No array at "${path ?? ""}" in the MCP result`)

  return list.value
}

function asText(value: Json | undefined) {
  if (value === undefined || value === null) return ""

  return Option.getOrElse(decodeString(value), () => JSON.stringify(value))
}

export function textOf(value: Json, paths: readonly string[]) {
  return paths.flatMap(path => {
    const text = asText(at(value, path))

    return text ? [text] : []
  }).join("\n")
}

function fillString(template: string, item: Json): Json | undefined {
  const match = /^\{\{(.+)\}\}$/.exec(template)

  return match ? at(item, match[1]) : template
}

// A string that is exactly "{{path}}" becomes the item's value at that path, keeping its type; a missing value drops the key.
export function fillArgs(args: Json, item: Json): Json | undefined {
  const template = decodeString(args)

  if (Option.isSome(template)) return fillString(template.value, item)

  const list = decodeList(args)

  if (Option.isSome(list)) return list.value.map(entry => fillArgs(entry, item) ?? null)

  return Option.match(decodeObject(args), {
    onNone: () => args,
    onSome: object => Object.fromEntries(Object.entries(object).flatMap(([key, entry]) => {
      const filled = fillArgs(entry, item)

      return filled === undefined ? [] : [[key, filled]]
    })),
  })
}

export function toItem(raw: Json, index: number, fields: typeof Fields.Type): Item {
  const text = textOf(raw, fields.text)
  const id = fields.id ? asText(at(raw, fields.id)) : ""
  const title = fields.title ? asText(at(raw, fields.title)) : ""

  return { key: String(index), id: id || String(index), title: title || text.slice(0, 100), text }
}

export function chunks<T>(list: readonly T[], size: number) {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, (index + 1) * size))
}

export async function mapLimit<T, R>(list: readonly T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = []
  let next = 0

  async function worker() {
    for (let index = next++; index < list.length; index = next++) {
      const item = list[index]

      if (item !== undefined) results[index] = await fn(item)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))

  return results
}
