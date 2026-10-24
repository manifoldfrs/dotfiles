import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import { truncateToWidth } from "@earendil-works/pi-tui";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { contextPercentLevel, countUnstaged, formatTokens, shortenPath } from "./format.ts";

const execFileAsync = promisify(execFile);
const GIT_REFRESH_MS = 2_000;

interface GitState {
  branch: string;
  unstaged: number;
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd, timeout: 2_000, maxBuffer: 1024 * 1024 });
  return stdout.trimEnd();
}

async function readGit(cwd: string): Promise<GitState | undefined> {
  try {
    const branch = (await runGit(["branch", "--show-current"], cwd)) || `detached@${await runGit(["rev-parse", "--short", "HEAD"], cwd)}`;
    const status = await runGit(["status", "--porcelain", "--untracked-files=normal"], cwd);
    return { branch, unstaged: countUnstaged(status) };
  } catch {
    return undefined;
  }
}

function locationSegment(cwd: string, git: GitState | undefined): string {
  const path = shortenPath(cwd);
  return git ? `${path} (${git.branch} · ${git.unstaged} unstaged)` : path;
}

function modelSegments(pi: ExtensionAPI, ctx: ExtensionContext): string[] {
  const model = ctx.model;
  if (!model) return ["no model"];
  const thinking = pi.getThinkingLevel();
  return model.reasoning && thinking !== "off" ? [model.name || model.id, thinking] : [model.name || model.id];
}

function contextSegment(ctx: ExtensionContext, theme: Theme): string | undefined {
  const usage = ctx.getContextUsage();
  if (!usage) return undefined;
  const size = formatTokens(usage.contextWindow);
  if (usage.tokens === null || usage.percent === null) return theme.fg("dim", `?/${size}`);
  const percent = Math.round(usage.percent);
  const text = `${formatTokens(usage.tokens)}/${size} (${percent}%)`;
  const level = contextPercentLevel(percent);
  return level === "ok" ? theme.fg("dim", text) : theme.fg(level, text);
}

function statusLine(pi: ExtensionAPI, ctx: ExtensionContext, theme: Theme, git: GitState | undefined): string {
  const dim = [locationSegment(ctx.cwd, git), ...modelSegments(pi, ctx)].map((part) => theme.fg("dim", part));
  const context = contextSegment(ctx, theme);
  return [...dim, ...(context ? [context] : [])].join(theme.fg("dim", " · "));
}

export function registerFooter(pi: ExtensionAPI): void {
  let git: GitState | undefined;
  let tui: TUI | undefined;
  let timer: NodeJS.Timeout | undefined;

  const refreshGit = async (cwd: string) => {
    git = await readGit(cwd);
    tui?.requestRender();
  };

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    if (timer) clearInterval(timer);
    void refreshGit(ctx.cwd);
    timer = setInterval(() => void refreshGit(ctx.cwd), GIT_REFRESH_MS);

    ctx.ui.setFooter((footerTui, theme, footerData) => {
      tui = footerTui;
      const unsubscribe = footerData.onBranchChange(() => void refreshGit(ctx.cwd));
      return {
        render(width: number): string[] {
          const lines = [`  ${statusLine(pi, ctx, theme, git)}`];
          // Other extensions report through setStatus(); keep those visible on their own line.
          const statuses = [...footerData.getExtensionStatuses().values()].filter((status) => status.trim() !== "");
          if (statuses.length > 0) lines.push(`  ${statuses.join(theme.fg("dim", " · "))}`);
          return lines.map((line) => truncateToWidth(line, width, "…"));
        },
        invalidate() {},
        dispose: unsubscribe,
      };
    });
  });

  pi.on("tool_execution_end", (_event, ctx) => {
    void refreshGit(ctx.cwd);
  });

  pi.on("session_shutdown", () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    tui = undefined;
  });
}
