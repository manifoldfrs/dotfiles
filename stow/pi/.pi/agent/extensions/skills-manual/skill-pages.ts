import { readFileSync } from "node:fs";
import { homedir } from "node:os";

/** Where Pi loaded a skill from, which decides the harnesses that can also invoke it. */
export type SkillGroup = "Project" | "User" | "Pi packages";

/** One loaded skill as Pi lists it: a name, a description, and its SKILL.md path. */
export type LoadedSkill = { name: string; description: string; path: string; group: SkillGroup };

/** A loaded skill with the details its manual page needs, read from SKILL.md. */
export type SkillPage = LoadedSkill & { userInvoked: boolean; argumentHint: string | undefined; sections: string[] };

const BLOCK_SCALAR = /^[>|][+-]?$/;

/** Parses the top-level scalar keys of SKILL.md frontmatter, including folded and literal blocks. */
function parseFrontmatter(text: string): Map<string, string> | undefined {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") return undefined;
  const end = lines.indexOf("---", 1);
  if (end === -1) return undefined;
  const fields = new Map<string, string>();
  for (let index = 1; index < end; index++) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[index] ?? "");
    if (!match) continue;
    const key = match[1] ?? "";
    const rawValue = match[2] ?? "";
    if (!BLOCK_SCALAR.test(rawValue)) {
      fields.set(key, unquote(rawValue.trim()));
      continue;
    }
    const block: string[] = [];
    while (index + 1 < end && /^(\s+\S|\s*$)/.test(lines[index + 1] ?? "")) block.push((lines[++index] ?? "").trim());
    fields.set(key, block.join(rawValue.startsWith(">") ? " " : "\n").trim());
  }
  return fields;
}

function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).replaceAll('\\"', '"');
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

/** Reads a loaded skill's SKILL.md for its manual page, or returns undefined when the frontmatter is unreadable. */
export function readSkillPage(skill: LoadedSkill): SkillPage | undefined {
  const text = readFileSync(skill.path, "utf8");
  const fields = parseFrontmatter(text);
  if (!fields) return undefined;
  return {
    ...skill,
    description: (fields.get("description") ?? skill.description).replace(/\s+/g, " ").trim(),
    userInvoked: fields.get("disable-model-invocation") === "true",
    argumentHint: fields.get("argument-hint") || undefined,
    sections: [...text.matchAll(/^## (.+)$/gm)].map((match) => (match[1] ?? "").replace(/[`*_]/g, "").trim()),
  };
}

/** Returns the skill with an exact name, otherwise every skill whose name or description contains all query words. */
export function findSkills<T extends { name: string; description: string }>(skills: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  const exact = skills.filter((skill) => skill.name === normalized);
  if (exact.length) return exact;
  const words = normalized.split(/\s+/).filter(Boolean);
  return skills.filter((skill) => words.every((word) => `${skill.name} ${skill.description}`.toLowerCase().includes(word)));
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z"`(])/).map((sentence) => sentence.trim()).filter(Boolean);
}

/** First sentence of a description, joined with the next one when it is too short to stand alone. */
export function summarizeSkill(description: string): string {
  const [first = description, second] = sentences(description);
  return first.length < 20 && second ? `${first} ${second}` : first;
}

function tildePath(path: string, home: string): string {
  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

/** Builds a tldr-style Markdown manual page for a skill. */
export function buildSkillPage(skill: SkillPage, home = homedir()): string {
  const argument = `<${skill.argumentHint ?? "request"}>`;
  const about = [
    ...sentences(skill.description),
    skill.userInvoked ? "Runs only when you type it." : "Agents load it automatically when a request matches; you can also type it.",
    ...(skill.sections.length ? [`Covers: ${skill.sections.slice(0, 8).join(", ")}.`] : []),
  ];
  const examples: [string, string][] = [["Run it in Pi:", `/skill:${skill.name} ${argument}`]];
  if (skill.group === "User") examples.push(["Run it in Claude Code or OpenCode:", `/${skill.name} ${argument}`]);
  examples.push(["Read the full skill:", `glow ${tildePath(skill.path, home)}`]);
  return [
    `# ${skill.name}`,
    "",
    ...about.map((line) => `> ${line}`),
    ...examples.flatMap(([description, command]) => ["", `- ${description}`, "", `\`${command}\``]),
    "",
  ].join("\n");
}
