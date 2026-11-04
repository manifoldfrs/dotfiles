export type Json = null | boolean | number | string | readonly Json[] | JsonObject

export type JsonObject = { readonly [key: string]: Json }

export function parseJson(text: string): Json {
  return JSON.parse(text)
}

export function objectOf(value: Json | undefined): JsonObject | undefined {
  if (value === undefined || value === null || Array.isArray(value)) return undefined

  const object = Object(value)

  return object === value ? object : undefined
}

export function listOf(value: Json | undefined): readonly Json[] {
  return Array.isArray(value) ? value : []
}

export function textOf(value: Json | undefined) {
  return String(value) === value ? value : undefined
}

export function numberOf(value: Json | undefined) {
  return Number(value) === value ? value : undefined
}
