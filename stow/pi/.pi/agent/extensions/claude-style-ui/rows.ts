import type { Component } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

export interface Row {
  left: string;
  right?: string;
}

// Lines drawn at render time so right-aligned parts and truncation follow the terminal width.
export class Rows implements Component {
  constructor(private readonly rows: Row[]) {}

  render(width: number): string[] {
    return this.rows.map((row) => fitRow(row, width));
  }

  invalidate(): void {}
}

function fitRow(row: Row, width: number): string {
  if (!row.right) return truncateToWidth(row.left, width, "…");
  const rightWidth = visibleWidth(row.right);
  const left = truncateToWidth(row.left, Math.max(0, width - rightWidth - 2), "…");
  const gap = Math.max(1, width - visibleWidth(left) - rightWidth);
  return truncateToWidth(`${left}${" ".repeat(gap)}${row.right}`, width);
}

// Draws another component inside a gutter, such as "└ " on the first line and "  " after it.
export class Indented implements Component {
  constructor(
    readonly inner: Component,
    private readonly firstPrefix: string,
    private readonly restPrefix: string,
  ) {}

  render(width: number): string[] {
    const prefixWidth = Math.max(visibleWidth(this.firstPrefix), visibleWidth(this.restPrefix));
    const lines = this.inner.render(Math.max(1, width - prefixWidth));
    // Tool renderers often open with a Spacer; the gutter already separates rows.
    const first = lines.findIndex((line) => line.replace(/\x1b\[[0-9;]*m/g, "").trim() !== "");
    return lines.slice(Math.max(0, first)).map((line, index) => `${index === 0 ? this.firstPrefix : this.restPrefix}${line}`);
  }

  invalidate(): void {
    this.inner.invalidate();
  }
}

// Plain text block with gutters, wrapped to the available width.
export class GutterText implements Component {
  constructor(
    private readonly lines: string[],
    private readonly firstPrefix: string,
    private readonly restPrefix: string,
  ) {}

  render(width: number): string[] {
    const prefixWidth = Math.max(visibleWidth(this.firstPrefix), visibleWidth(this.restPrefix));
    const available = Math.max(1, width - prefixWidth);
    const wrapped = this.lines.flatMap((line) => (line === "" ? [""] : wrapTextWithAnsi(line, available)));
    return wrapped.map((line, index) => `${index === 0 ? this.firstPrefix : this.restPrefix}${line}`);
  }

  invalidate(): void {}
}

export class Stack implements Component {
  constructor(private readonly children: Component[]) {}

  render(width: number): string[] {
    return this.children.flatMap((child) => child.render(width));
  }

  invalidate(): void {
    for (const child of this.children) child.invalidate();
  }
}
