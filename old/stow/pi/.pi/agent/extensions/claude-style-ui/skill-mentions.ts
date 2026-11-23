import type { AutocompleteItem, AutocompleteProvider, AutocompleteSuggestions } from "@earendil-works/pi-tui";

export type SkillInfo = { readonly name: string; readonly description: string };

// Same shape inline-skills expands: `/name` at a word start, so paths like `/tmp/x` never match.
const MENTION_BEING_TYPED = /(?:^|[\s(])(\/[a-z0-9-]*)$/;
// A space right after a finished mention ends it, so an open menu closes instead of switching to file paths.
const MENTION_JUST_ENDED = /(?:^|[\s(])\/[a-z0-9-]+\s$/;
const ANSI = "(?:\\x1b\\[[0-9;]*m)+";

/** The `/partial` skill mention the cursor sits at the end of, or undefined when there is none. */
export function mentionBeingTyped(textBeforeCursor: string): string | undefined {
  return MENTION_BEING_TYPED.exec(textBeforeCursor)?.[1];
}

/** Skills whose name starts with what follows the slash, then those that merely contain it. */
export function matchingSkills(partial: string, skills: readonly SkillInfo[]): SkillInfo[] {
  const query = partial.slice(1);
  const starts = skills.filter((skill) => skill.name.startsWith(query));
  const contains = skills.filter((skill) => !skill.name.startsWith(query) && skill.name.includes(query));

  return [...starts, ...contains];
}

/**
 * Suggests skills for a `/name` typed after other text; a mention at the start of the message is left to Pi's own
 * command menu, which already lists skills.
 */
export function skillMentionProvider(current: AutocompleteProvider, skills: () => readonly SkillInfo[]): AutocompleteProvider {
  return {
    ...(current.triggerCharacters ? { triggerCharacters: current.triggerCharacters } : {}),
    async getSuggestions(lines, cursorLine, cursorCol, options): Promise<AutocompleteSuggestions | null> {
      const before = (lines[cursorLine] ?? "").slice(0, cursorCol);
      const partial = mentionBeingTyped(before);
      const atMessageStart = cursorLine === 0 && before.trimStart() === partial;

      if (MENTION_JUST_ENDED.test(before) && !(cursorLine === 0 && before.trimStart().startsWith("/") && !before.trim().includes(" "))) return null;

      if (partial === undefined || atMessageStart) return current.getSuggestions(lines, cursorLine, cursorCol, options);

      const items: AutocompleteItem[] = matchingSkills(partial, skills()).map((skill) => ({
        value: `/${skill.name}`,
        label: `/${skill.name}`,
        description: skill.description,
      }));

      return items.length ? { items, prefix: partial } : current.getSuggestions(lines, cursorLine, cursorCol, options);
    },
    applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
      if (!prefix.startsWith("/") || !item.value.startsWith("/")) return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix);

      const line = lines[cursorLine] ?? "";
      const start = cursorCol - prefix.length;
      const inserted = `${item.value} `;
      const next = [...lines];

      next[cursorLine] = `${line.slice(0, start)}${inserted}${line.slice(cursorCol)}`;

      return { lines: next, cursorLine, cursorCol: start + inserted.length };
    },
    ...(current.shouldTriggerFileCompletion ? { shouldTriggerFileCompletion: current.shouldTriggerFileCompletion.bind(current) } : {}),
  };
}

/** Colors each `/name` or `/skill:name` of a known skill in a rendered editor row, leaving everything else as it was. */
export function highlightSkillMentions(row: string, names: ReadonlySet<string>, color: (text: string) => string): string {
  if (!names.size) return row;

  const mention = new RegExp(`(^|[\\s(]|${ANSI})(\\/(?:skill:)?)([a-z0-9]+(?:-[a-z0-9]+)*)(?=$|\\s|[.,;:!?)]|\\x1b)`, "g");

  return row.replace(mention, (whole, lead: string, slash: string, name: string) => (names.has(name) ? `${lead}${color(`${slash}${name}`)}` : whole));
}
