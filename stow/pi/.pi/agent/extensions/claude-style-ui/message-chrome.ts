// Pi has no public hook for user and assistant message chrome, so this wraps two prototype methods.
// Each patch checks the shape it relies on and leaves Pi's rendering alone when that shape changes.
import type { Theme } from "@earendil-works/pi-coding-agent";
import { AssistantMessageComponent, UserMessageComponent } from "@earendil-works/pi-coding-agent";
import type { MarkdownTheme } from "@earendil-works/pi-tui";
import { Markdown, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { unorderedBulletToDisc } from "./format.ts";

const PATCHED = Symbol.for("claude-style-ui:patched");
const DECORATED = Symbol.for("claude-style-ui:decorated");
const OSC133 = /\x1b\]133;[ABC]\x07/g;
const PROMPT_START = "\x1b]133;A\x07";
const PROMPT_END = "\x1b]133;B\x07\x1b]133;C\x07";

let currentTheme: Theme | undefined;

export function setChromeTheme(theme: Theme): void {
  currentTheme = theme;
}

function border(text: string): string {
  return currentTheme ? currentTheme.fg("borderMuted", text) : text;
}

function dim(text: string): string {
  return currentTheme ? currentTheme.fg("dim", text) : text;
}

function padTo(line: string, width: number): string {
  const fitted = truncateToWidth(line, width, "");
  return `${fitted}${" ".repeat(Math.max(0, width - visibleWidth(fitted)))}`;
}

function userBox(lines: string[], width: number): string[] {
  const inner = Math.max(1, width - 2);
  const label = ` ${dim("User")} `;
  const top = `${border("╭─")}${label}${border("─".repeat(Math.max(0, inner - 1 - visibleWidth(label))))}${border("╮")}`;
  const bottom = border(`╰${"─".repeat(inner)}╯`);
  const body = lines.map((line) => `${border("│")}${padTo(line, inner)}${border("│")}`);
  return [PROMPT_START + top, ...body, PROMPT_END + bottom];
}

type MarkdownInternals = {
  defaultTextStyle?: { bgColor?: unknown };
  defaultStylePrefix?: unknown;
  theme?: MarkdownTheme;
  renderToken?: (token: CodeToken, width: number, nextTokenType?: string, styleContext?: unknown) => string[];
};

function dropUserBackground(component: { children?: unknown[] }): void {
  for (const child of component.children ?? []) {
    if (!(child instanceof Markdown)) continue;
    const markdown = child as unknown as MarkdownInternals;
    if (!markdown.defaultTextStyle?.bgColor) continue;
    markdown.defaultTextStyle = { ...markdown.defaultTextStyle, bgColor: undefined };
    markdown.defaultStylePrefix = undefined;
    child.invalidate();
  }
}

function patchUserMessages(): void {
  const proto = UserMessageComponent.prototype as unknown as Record<symbol, unknown> & {
    render: (this: { children?: unknown[] }, width: number) => string[];
  };
  if (proto[PATCHED] || typeof proto.render !== "function") return;
  const originalRender = proto.render;
  proto.render = function renderUserBox(width: number) {
    if (width < 8) return originalRender.call(this, width);
    dropUserBackground(this);
    const lines = originalRender.call(this, width - 2).map((line) => line.replace(OSC133, ""));
    // Pi pads user messages with one blank line above and below; the box border replaces them.
    const body = lines.slice(lines[0]?.trim() === "" ? 1 : 0, lines.at(-1)?.trim() === "" ? -1 : undefined);
    return body.length === 0 ? lines : userBox(body, width);
  };
  proto[PATCHED] = true;
}

interface CodeToken {
  type: string;
  text?: string;
  lang?: string;
}

function framedCode(token: CodeToken, theme: MarkdownTheme, width: number): string[] {
  const inner = Math.max(1, width - 4);
  const code = token.text ?? "";
  const body = theme.highlightCode ? theme.highlightCode(code, token.lang) : code.split("\n").map(theme.codeBlock);
  const lang = token.lang ? ` ${dim(token.lang)} ` : "";
  const dots = (count: number) => border("·".repeat(Math.max(0, count)));
  const top = `${border("╭·")}${lang}${dots(width - 3 - visibleWidth(lang))}${border("╮")}`;
  const bottom = `${border("╰")}${dots(width - 2)}${border("╯")}`;
  return [top, ...body.map((line) => `${border("│")} ${padTo(line, inner)} ${border("│")}`), bottom];
}

function decorateReply(markdown: Markdown): void {
  const internals = markdown as unknown as MarkdownInternals & Record<symbol, unknown>;
  if (internals[DECORATED] || !internals.theme || typeof internals.renderToken !== "function") return;
  const theme = internals.theme;
  const renderToken = internals.renderToken;
  internals.theme = { ...theme, listBullet: (marker: string) => theme.listBullet(unorderedBulletToDisc(marker)) };
  internals.renderToken = function renderFramedCode(token, width, nextTokenType, styleContext) {
    if (token.type !== "code" || width < 8) return renderToken.call(this, token, width, nextTokenType, styleContext);
    const lines = framedCode(token, theme, width);
    if (nextTokenType && nextTokenType !== "space") lines.push("");
    return lines;
  };
  const render = markdown.render.bind(markdown);
  markdown.render = (width: number) => {
    if (width < 6) return render(width);
    let dotted = false;
    return render(width - 2).map((line) => {
      if (dotted || line.trim() === "") return `  ${line}`;
      dotted = true;
      return ` ${currentTheme ? currentTheme.fg("text", "●") : "●"}${line}`;
    });
  };
  internals[DECORATED] = true;
  markdown.invalidate();
}

function patchAssistantMessages(): void {
  const proto = AssistantMessageComponent.prototype as unknown as Record<symbol, unknown> & {
    updateContent: (this: { contentContainer?: { children?: unknown[] } }, ...args: unknown[]) => void;
  };
  if (proto[PATCHED] || typeof proto.updateContent !== "function") return;
  const originalUpdate = proto.updateContent;
  proto.updateContent = function decorateReplies(...args: unknown[]) {
    originalUpdate.apply(this, args);
    // Text blocks are direct Markdown children; thinking blocks sit inside a MouseRegion and stay as Pi draws them.
    for (const child of this.contentContainer?.children ?? []) {
      if (child instanceof Markdown) decorateReply(child);
    }
  };
  proto[PATCHED] = true;
}

export function patchMessageChrome(): void {
  patchUserMessages();
  patchAssistantMessages();
}
