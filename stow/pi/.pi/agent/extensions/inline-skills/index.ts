import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { stripFrontmatter } from "@earendil-works/pi-coding-agent";

const SKILL_COMMAND_PREFIX = "skill:";
// `/name` or `/skill:name` at a word start, ending at whitespace, closing punctuation, or the end, so paths like `/tmp/x` never match.
const SKILL_MENTION = /(?<=^|[\s(])\/(?:skill:)?([a-z0-9]+(?:-[a-z0-9]+)*)(?=$|\s|[.,;:!?)](?:\s|$))/g;
const CODE_SPAN = /```[\s\S]*?```|`[^`\n]*`/g;
// Pi already expands a message that starts with `/skill:name`.
const LEADING_SKILL_COMMAND = /^\/skill:([a-z0-9-]+)(?=\s|$)/;

type SkillFile = { name: string; path: string };

/** Returns loaded skills mentioned as `/name` or `/skill:name` outside code, in mention order. */
export function findMentionedSkills(text: string, skills: SkillFile[]): SkillFile[] {
  const prose = text.replace(CODE_SPAN, (code) => " ".repeat(code.length));
  const byName = new Map(skills.map((skill) => [skill.name, skill]));
  const mentioned = new Map<string, SkillFile>();
  for (const match of prose.matchAll(SKILL_MENTION)) {
    const skill = byName.get(match[1] ?? "");
    if (skill) mentioned.set(skill.name, skill);
  }
  const leading = LEADING_SKILL_COMMAND.exec(text)?.[1];
  if (leading) mentioned.delete(leading);
  return [...mentioned.values()];
}

/** Matches Pi's own `/skill:name` expansion so the model sees the same block either way. */
function skillBlock(skill: SkillFile): string {
  const body = stripFrontmatter(readFileSync(skill.path, "utf8")).trim();
  return `<skill name="${skill.name}" location="${skill.path}">\nReferences are relative to ${dirname(skill.path)}.\n\n${body}\n</skill>`;
}

/** Expands skills mentioned anywhere in a message, the way Claude Code expands `/skill-name`. */
export default function inlineSkills(pi: ExtensionAPI): void {
  pi.on("input", (event) => {
    const skills = pi.getCommands()
      .filter((command) => command.source === "skill")
      .map((command) => ({ name: command.name.slice(SKILL_COMMAND_PREFIX.length), path: command.sourceInfo.path }));
    const mentioned = findMentionedSkills(event.text, skills);
    if (!mentioned.length) return { action: "continue" };
    const blocks = mentioned.map(skillBlock).join("\n\n");
    // Appended so a leading `/template` or `/skill:name` still reaches Pi's own expansion.
    return { action: "transform", text: `${event.text}\n\n${blocks}`, images: event.images };
  });
}
