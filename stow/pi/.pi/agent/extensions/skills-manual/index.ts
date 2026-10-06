import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder, getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Container, Markdown, matchesKey, Text } from "@earendil-works/pi-tui";
import { buildSkillPage, findSkills, type LoadedSkill, readSkillPage, type SkillGroup, summarizeSkill } from "./skill-pages.ts";

const SKILL_COMMAND_PREFIX = "skill:";

function groupOf(sourceInfo: { scope: string; origin: string }): SkillGroup {
  if (sourceInfo.origin === "package") return "Pi packages";
  return sourceInfo.scope === "project" ? "Project" : "User";
}

async function chooseSkill(ctx: ExtensionCommandContext, skills: LoadedSkill[], title: string): Promise<LoadedSkill | undefined> {
  const options = skills.map((skill) => `${skill.name} — ${summarizeSkill(skill.description)}`);
  const choice = await ctx.ui.select(title, options);
  return choice === undefined ? undefined : skills[options.indexOf(choice)];
}

async function showPage(ctx: ExtensionCommandContext, page: string): Promise<void> {
  await ctx.ui.custom<void>((_tui, theme, _keybindings, done) => {
    const container = new Container();
    const border = new DynamicBorder((text: string) => theme.fg("accent", text));
    container.addChild(border);
    container.addChild(new Markdown(page, 1, 1, getMarkdownTheme()));
    container.addChild(new Text(theme.fg("dim", "Enter or Esc to close"), 1, 0));
    container.addChild(border);
    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        if (matchesKey(data, "enter") || matchesKey(data, "escape")) done(undefined);
      },
    };
  });
}

/** Registers `/skills`, a menu of loaded skills that opens a tldr-style manual page for each. */
export default function skillsManual(pi: ExtensionAPI): void {
  pi.registerCommand("skills", {
    description: "Browse loaded skills as tldr-style manual pages",
    handler: async (args, ctx) => {
      const skills: LoadedSkill[] = pi.getCommands()
        .filter((command) => command.source === "skill")
        .map((command) => ({
          name: command.name.slice(SKILL_COMMAND_PREFIX.length),
          description: command.description ?? "",
          path: command.sourceInfo.path,
          group: groupOf(command.sourceInfo),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const query = args.trim();
      const matches = query ? findSkills(skills, query) : skills;
      if (!matches.length) {
        ctx.ui.notify(`No loaded skill matches "${query}".`, "warning");
        return;
      }
      const chosen = matches.length === 1 ? matches[0] : await chooseSkill(ctx, matches, query ? `Skills matching "${query}"` : `Skills (${skills.length})`);
      if (!chosen) return;
      const page = readSkillPage(chosen);
      if (!page) {
        ctx.ui.notify(`Could not read the frontmatter of ${chosen.path}.`, "warning");
        return;
      }
      await showPage(ctx, buildSkillPage(page));
    },
  });
}
