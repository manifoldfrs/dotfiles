import type { ExtensionAPI, KeybindingsManager } from "@earendil-works/pi-coding-agent";
import { CustomEditor } from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";

const POINTER_COLUMNS = 2;

// CustomEditor keeps Pi's app keybindings; this only paints "❯ " into the first row's left padding.
class PromptEditor extends CustomEditor {
  constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager) {
    super(tui, theme, keybindings, { paddingX: POINTER_COLUMNS });
  }

  // Pi copies the default editor's padding onto custom editors after construction.
  override setPaddingX(padding: number): void {
    super.setPaddingX(Math.max(padding, POINTER_COLUMNS));
  }

  override render(width: number): string[] {
    const rows = super.render(width);
    const first = rows[1];
    if (first?.startsWith("  ")) rows[1] = `${this.borderColor("❯")} ${first.slice(POINTER_COLUMNS)}`;
    return rows;
  }
}

export function registerPromptEditor(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    ctx.ui.setEditorComponent((tui, theme, keybindings) => new PromptEditor(tui, theme, keybindings));
  });
}
