import { appendFileSync, chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const REQUEST_LOG_ENABLED_VALUES = new Set(["1", "true", "yes"]);
const SENSITIVE_RESPONSE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-api-key"]);
let requestLogSequence = 0;

interface RequestAuditRow {
  name: string;
  bytes: number;
  estimatedTokens: number;
}

interface RequestAudit {
  totalBytes: number;
  systemBytes: number;
  messagesBytes: number;
  toolBytes: number;
  tools: RequestAuditRow[];
}

function jsonBytes(value: unknown): number {
  if (value === undefined) {
    return 0;
  }

  return Buffer.byteLength(JSON.stringify(value));
}

function estimatedTokens(bytes: number): number {
  return Math.round(bytes / 4);
}

function requestPayloadRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return Object.fromEntries(Object.entries(payload));
}

function redactResponseHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      SENSITIVE_RESPONSE_HEADERS.has(name.toLowerCase()) ? "[REDACTED]" : value,
    ]),
  );
}

/** Measures the system prompt, messages, and tool schemas in a provider request. */
export function auditProviderRequestPayload(payload: unknown): RequestAudit {
  const request = requestPayloadRecord(payload);
  const tools = Array.isArray(request.tools) ? request.tools : [];
  const toolRows = tools
    .map((tool, index) => {
      const toolRecord = requestPayloadRecord(tool);
      const bytes = jsonBytes(tool);
      const name = typeof toolRecord.name === "string"
        ? toolRecord.name
        : typeof requestPayloadRecord(toolRecord.function).name === "string"
          ? String(requestPayloadRecord(toolRecord.function).name)
          : `tool-${index + 1}`;

      return { name, bytes, estimatedTokens: estimatedTokens(bytes) };
    })
    .sort((left, right) => right.bytes - left.bytes);

  return {
    totalBytes: jsonBytes(payload),
    systemBytes: jsonBytes(request.system ?? request.instructions),
    messagesBytes: jsonBytes(request.messages ?? request.input),
    toolBytes: toolRows.reduce((total, tool) => total + tool.bytes, 0),
    tools: toolRows,
  };
}

function renderRequestAuditTable(audit: RequestAudit): string {
  const percent = (bytes: number): string => {
    if (audit.totalBytes === 0) {
      return "0.0";
    }

    return ((bytes / audit.totalBytes) * 100).toFixed(1);
  };
  const rows = audit.tools.map((tool) =>
    `| ${tool.name} | ${tool.bytes.toLocaleString()} | ~${tool.estimatedTokens.toLocaleString()} | ${percent(tool.bytes)}% |`
  );

  return [
    `- **tools**: ${audit.tools.length} definitions, ${audit.toolBytes.toLocaleString()} bytes (~${estimatedTokens(audit.toolBytes).toLocaleString()} tokens)`,
    `- **system prompt**: ${audit.systemBytes.toLocaleString()} bytes (~${estimatedTokens(audit.systemBytes).toLocaleString()} tokens)`,
    `- **messages/input**: ${audit.messagesBytes.toLocaleString()} bytes (~${estimatedTokens(audit.messagesBytes).toLocaleString()} tokens)`,
    `- **total request**: ${audit.totalBytes.toLocaleString()} bytes`,
    "",
    "## Tools ranked by size",
    "",
    "| tool | bytes | ~tokens | % of request |",
    "| --- | --: | --: | --: |",
    ...rows,
  ].join("\n");
}

function requestLogDirectory(): string {
  return process.env.PI_REQUEST_LOG_DIR ?? join(homedir(), ".pi", "agent", "logs", "requests");
}

function requestLogEnabled(pi: ExtensionAPI): boolean {
  const environmentValue = process.env.PI_REQUEST_LOG?.toLowerCase();
  return pi.getFlag("request-log") === true || (environmentValue !== undefined && REQUEST_LOG_ENABLED_VALUES.has(environmentValue));
}

function createRequestLogFile(payload: unknown, cwd: string): string {
  const directory = requestLogDirectory();
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);

  const timestamp = new Date().toISOString();
  const filenameTimestamp = timestamp.replaceAll(":", "-").replace(".", "-");
  const sequence = String(++requestLogSequence).padStart(3, "0");
  const path = join(directory, `${filenameTimestamp}_${process.pid}_${sequence}_pi-request.md`);
  const request = requestPayloadRecord(payload);
  const audit = auditProviderRequestPayload(payload);
  const markdown = [
    "# Pi provider request",
    "",
    `- **timestamp**: ${timestamp}`,
    `- **working directory**: ${cwd}`,
    `- **model**: ${typeof request.model === "string" ? request.model : "unknown"}`,
    "",
    renderRequestAuditTable(audit),
    "",
    "## Full provider payload",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
    "",
  ].join("\n");

  writeFileSync(path, markdown, { encoding: "utf8", mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

export default function requestLoggerExtension(pi: ExtensionAPI): void {
  const pendingRequestLogs: string[] = [];

  pi.registerFlag("request-log", {
    description: "Log complete provider request payloads under ~/.pi/agent/logs/requests",
    type: "boolean",
    default: false,
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (!requestLogEnabled(pi)) {
      return;
    }

    pendingRequestLogs.push(createRequestLogFile(event.payload, ctx.cwd));
  });

  pi.on("after_provider_response", (event) => {
    if (!requestLogEnabled(pi)) {
      return;
    }

    const path = pendingRequestLogs[0];
    if (!path) {
      return;
    }

    appendFileSync(path, [
      "",
      "## Provider response metadata",
      "",
      `- **status**: ${event.status}`,
      "",
      "```json",
      JSON.stringify(redactResponseHeaders(event.headers), null, 2),
      "```",
      "",
    ].join("\n"), "utf8");
  });

  pi.on("message_end", (event) => {
    if (!requestLogEnabled(pi) || event.message.role !== "assistant") {
      return;
    }

    const path = pendingRequestLogs.shift();
    if (!path) {
      return;
    }

    appendFileSync(path, [
      "",
      "## Pi assistant response",
      "",
      "```json",
      JSON.stringify(event.message, null, 2),
      "```",
      "",
    ].join("\n"), "utf8");
  });
}
