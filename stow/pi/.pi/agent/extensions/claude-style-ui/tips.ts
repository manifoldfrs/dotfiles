import { listOf, numberOf, objectOf, textOf, withoutSecrets, type Json } from "../jev-guardrails/shared.ts";

export type Tip = { readonly id: string; readonly text: string };

type CommandInfo = { readonly name: string; readonly description?: string; readonly source: string; readonly sourceInfo?: { readonly origin: string } };

const SKILL_PREFIX = "skill:";
const MAX_DESCRIPTION = 90;
const MAX_QUERY = 1_800;
export const RELEVANT_TOP_K = 3;
export const MIN_RELEVANCE = 0.5;

function firstSentence(text: string): string {
  const sentence = text.trim().split(/(?<=\.)\s/)[0] ?? "";
  return sentence.length > MAX_DESCRIPTION ? `${sentence.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…` : sentence;
}

/** One tip per command or skill you added yourself, not ones bundled in packages; inline-skills lets a skill run as `/name`. */
export function tipsFromCommands(commands: readonly CommandInfo[]): Tip[] {
  const seen = new Set<string>();
  const tips: Tip[] = [];

  for (const command of commands) {
    if (command.sourceInfo?.origin === "package") continue;

    const name = command.source === "skill" ? command.name.slice(SKILL_PREFIX.length) : command.name;
    const description = firstSentence(command.description ?? "");

    if (!description || seen.has(name)) continue;

    seen.add(name);
    tips.push({ id: name, text: `/${name} · ${description}` });
  }

  return tips;
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other] as T, result[index] as T];
  }

  return result;
}

/** Ids from a jev_rerank result that clear the relevance bar, best first. */
export function relevantIds(result: Json, minRelevance = MIN_RELEVANCE): string[] {
  return listOf(objectOf(result)?.ranked)
    .map(objectOf)
    .filter((entry) => (numberOf(entry?.relevance) ?? 0) >= minRelevance)
    .flatMap((entry) => textOf(entry?.id) ?? []);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Commands the prompt already names, which need no tip. */
export function mentionedIds(prompt: string, tips: readonly Tip[]): Set<string> {
  return new Set(tips.filter((tip) => new RegExp(`(?:^|[\\s(])/(?:skill:)?${escapeRegExp(tip.id)}(?=$|[\\s.,:;!?)])`).test(prompt)).map((tip) => tip.id));
}

/** Rotating tips for one run: the ones Jev finds relevant to the prompt first, then the rest in random order. */
export class TipDeck {
  private relevant: Tip[] = [];
  private others: Tip[] = [];
  private position = 0;

  reset(tips: readonly Tip[], skip: ReadonlySet<string> = new Set()): void {
    this.relevant = [];
    this.others = shuffled(tips.filter((tip) => !skip.has(tip.id)));
    this.position = 0;
  }

  promote(ids: readonly string[]): void {
    const promoted = ids.flatMap((id) => this.others.find((tip) => tip.id === id) ?? []);
    this.relevant = promoted;
    this.others = this.others.filter((tip) => !promoted.includes(tip));
    this.position = 0;
  }

  isRelevant(tip: Tip): boolean {
    return this.relevant.includes(tip);
  }

  current(): Tip | undefined {
    const all = [...this.relevant, ...this.others];
    return all.length === 0 ? undefined : all[this.position % all.length];
  }

  advance(): void {
    this.position += 1;
  }
}

/** The jev_rerank query for a prompt, with secret-looking lines removed since Jev is an outside service. */
export function rerankQuery(prompt: string): string {
  return `Commands or skills that would help a coding agent with this request:\n\n${withoutSecrets(prompt).slice(0, MAX_QUERY)}`;
}
