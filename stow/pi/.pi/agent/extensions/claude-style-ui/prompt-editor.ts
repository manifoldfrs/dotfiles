import type { ExtensionAPI, KeybindingsManager, Theme } from "@earendil-works/pi-coding-agent";
import { CustomEditor } from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";
import { highlightSkillMentions, mentionBeingTyped, skillMentionProvider, type SkillInfo } from "./skill-mentions.ts";

const POINTER_COLUMNS = 2;
const SKILL_COMMAND_PREFIX = "skill:";

type SkillSource = { readonly skills: () => readonly SkillInfo[]; readonly names: () => ReadonlySet<string>; readonly theme: () => Theme | undefined };

// Pi's editor opens its menu for `/` only at the start of a message, and the method that opens it is private.
type AutocompleteTrigger = { tryTriggerAutocomplete?: () => void };

// CustomEditor keeps Pi's app keybindings; this paints "❯ " into the first row's left padding and marks skill mentions.
class PromptEditor extends CustomEditor {
  constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager, private readonly source: SkillSource) {
    super(tui, theme, keybindings, { paddingX: POINTER_COLUMNS });
  }

  // Pi copies the default editor's padding onto custom editors after construction.
  override setPaddingX(padding: number): void {
    super.setPaddingX(Math.max(padding, POINTER_COLUMNS));
  }

  override handleInput(data: string): void {
    super.handleInput(data);

    if (this.isShowingAutocomplete() || !/^[a-z0-9/-]$/.test(data)) return;

    const { line, col } = this.getCursor();
    const before = (this.getLines()[line] ?? "").slice(0, col);

    if (mentionBeingTyped(before) === undefined) return;

    // SAFETY: a runtime check guards the call, so a Pi release that renames the method only loses the mid-text menu.
    const trigger = (this as unknown as AutocompleteTrigger).tryTriggerAutocomplete;

    if (typeof trigger === "function") trigger.call(this);
  }

  override render(width: number): string[] {
    const theme = this.source.theme();
    const names = this.source.names();
    const rows = super.render(width).map((row, index) =>
      theme && index > 0 ? highlightSkillMentions(row, names, (text) => theme.fg("accent", text)) : row,
    );
    const first = rows[1];

    if (first?.startsWith("  ")) rows[1] = `${this.borderColor("❯")} ${first.slice(POINTER_COLUMNS)}`;

    return rows;
  }
}

function skillsOf(pi: ExtensionAPI): SkillInfo[] {
  return pi.getCommands()
    .filter((command) => command.source === "skill")
    .map((command) => ({ name: command.name.slice(SKILL_COMMAND_PREFIX.length), description: command.description ?? "" }));
}

export function registerPromptEditor(pi: ExtensionAPI): void {
  let skills: SkillInfo[] = [];
  let names: ReadonlySet<string> = new Set();
  let theme: Theme | undefined;
  const refresh = () => {
    skills = skillsOf(pi);
    names = new Set(skills.map((skill) => skill.name));
  };
  const source: SkillSource = { skills: () => skills, names: () => names, theme: () => theme };

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    refresh();
    theme = ctx.ui.theme;
    ctx.ui.setEditorComponent((tui, editorTheme, keybindings) => new PromptEditor(tui, editorTheme, keybindings, source));
    ctx.ui.addAutocompleteProvider((current) => skillMentionProvider(current, () => {
      refresh();

      return skills;
    }));
  });
}
