#!/usr/bin/env node

// Inspired by Matt Pocock's Anthropic request logger:
// https://gist.github.com/mattpocock/5b3d76ea21f5f698aefded47a9cea3b1

import { spawn } from "node:child_process";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { homedir } from "node:os";
import { join } from "node:path";

const UPSTREAM_HOST = "api.anthropic.com";
const LOG_DIR = process.env.CLAUDE_REQUEST_LOG_DIR ?? join(homedir(), ".claude", "logs", "requests");
const REDACTED_HEADERS = new Set(["api-key", "authorization", "cookie", "set-cookie", "x-api-key"]);
let requestSequence = 0;

function estimatedTokens(bytes) {
  return Math.round(bytes / 4);
}

function requestLogBaseName() {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
  const sequence = String(++requestSequence).padStart(3, "0");
  return `${timestamp}_${process.pid}_${sequence}_anthropic`;
}

function forwardRequestHeaders(headers, body) {
  const forwarded = { ...headers };
  delete forwarded.host;
  delete forwarded.connection;
  delete forwarded["accept-encoding"];
  delete forwarded["transfer-encoding"];
  delete forwarded["content-length"];

  if (body.length > 0) {
    forwarded["content-length"] = String(body.length);
  }

  return forwarded;
}

function renderRequestHeaders(headers) {
  return Object.entries(headers)
    .map(([name, value]) => {
      const renderedValue = REDACTED_HEADERS.has(name.toLowerCase())
        ? "[REDACTED]"
        : Array.isArray(value)
          ? value.join(", ")
          : value ?? "";
      return `${name}: ${renderedValue}`;
    })
    .join("\n");
}

function auditClaudeRequest(request) {
  const tools = Array.isArray(request?.tools) ? request.tools : [];
  const toolRows = tools
    .map((tool, index) => {
      const bytes = Buffer.byteLength(JSON.stringify(tool));
      return {
        name: typeof tool?.name === "string" ? tool.name : `tool-${index + 1}`,
        bytes,
        estimatedTokens: estimatedTokens(bytes),
      };
    })
    .sort((left, right) => right.bytes - left.bytes);
  const toolBytes = toolRows.reduce((total, tool) => total + tool.bytes, 0);
  const systemBytes = request?.system === undefined ? 0 : Buffer.byteLength(JSON.stringify(request.system));
  const messageBytes = request?.messages === undefined ? 0 : Buffer.byteLength(JSON.stringify(request.messages));
  const totalBytes = Buffer.byteLength(JSON.stringify(request ?? {}));

  return { messageBytes, systemBytes, toolBytes, toolRows, totalBytes };
}

function renderClaudeRequestAudit(audit, inputTokens) {
  const percent = (bytes) => audit.totalBytes === 0 ? "0.0" : ((bytes / audit.totalBytes) * 100).toFixed(1);
  const rows = audit.toolRows.map((tool) =>
    `| ${tool.name} | ${tool.bytes.toLocaleString()} | ~${tool.estimatedTokens.toLocaleString()} | ${percent(tool.bytes)}% |`
  );

  return [
    inputTokens === null ? "" : `- **billed input tokens**: ${inputTokens.toLocaleString()}`,
    `- **tools**: ${audit.toolRows.length} definitions, ${audit.toolBytes.toLocaleString()} bytes (~${estimatedTokens(audit.toolBytes).toLocaleString()} tokens)`,
    `- **system prompt**: ${audit.systemBytes.toLocaleString()} bytes (~${estimatedTokens(audit.systemBytes).toLocaleString()} tokens)`,
    `- **messages**: ${audit.messageBytes.toLocaleString()} bytes (~${estimatedTokens(audit.messageBytes).toLocaleString()} tokens)`,
    `- **total request**: ${audit.totalBytes.toLocaleString()} bytes`,
    "",
    "## Tools ranked by size",
    "",
    "| tool | bytes | ~tokens | % of request |",
    "| --- | --: | --: | --: |",
    ...rows,
  ].filter((line, index) => line !== "" || index !== 0).join("\n");
}

function decodeAnthropicResponse(rawResponse) {
  const blocks = new Map();
  let inputTokens = null;
  let stopReason;
  let usage;

  for (const line of rawResponse.split(/\r?\n/)) {
    const match = line.match(/^data:\s?(.*)$/);
    if (!match || match[1] === "[DONE]" || match[1].trim() === "") {
      continue;
    }

    let event;
    try {
      event = JSON.parse(match[1]);
    } catch {
      continue;
    }

    if (event.type === "content_block_start") {
      blocks.set(event.index, {
        type: event.content_block?.type ?? "text",
        name: event.content_block?.name,
        text: event.content_block?.text ?? event.content_block?.thinking ?? "",
      });
    } else if (event.type === "content_block_delta" && blocks.has(event.index)) {
      const block = blocks.get(event.index);
      const delta = event.delta ?? {};
      block.text += delta.text ?? delta.partial_json ?? delta.thinking ?? "";
    } else if (event.type === "message_start" && event.message?.usage) {
      usage = { ...event.message.usage, ...(usage ?? {}) };
    } else if (event.type === "message_delta") {
      stopReason = event.delta?.stop_reason ?? stopReason;
      usage = event.usage ? { ...(usage ?? {}), ...event.usage } : usage;
    }
  }

  if (usage) {
    inputTokens = (usage.input_tokens ?? 0)
      + (usage.cache_read_input_tokens ?? 0)
      + (usage.cache_creation_input_tokens ?? 0);
  }

  const responseSections = [];
  if (stopReason) {
    responseSections.push(`- **stop reason**: ${stopReason}`);
  }
  if (usage) {
    responseSections.push(`- **usage**: \`${JSON.stringify(usage)}\``);
  }

  for (const block of blocks.values()) {
    if (block.type === "tool_use") {
      responseSections.push(`### Tool use: ${block.name ?? "unknown"}\n\n\`\`\`json\n${block.text || "{}"}\n\`\`\``);
    } else if (block.type === "thinking") {
      responseSections.push(`### Thinking\n\n${block.text}`);
    } else {
      responseSections.push(`### Assistant text\n\n${block.text}`);
    }
  }

  return {
    inputTokens,
    markdown: responseSections.length > 0
      ? responseSections.join("\n\n")
      : `\`\`\`text\n${rawResponse}\n\`\`\``,
  };
}

function writeClaudeRequestLog({ body, headers, method, requestPath, responseBody, statusCode, timestamp }) {
  const request = JSON.parse(body.toString("utf8"));
  const audit = auditClaudeRequest(request);
  const response = decodeAnthropicResponse(responseBody.toString("utf8"));
  const baseName = requestLogBaseName();

  mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
  chmodSync(LOG_DIR, 0o700);

  const markdown = [
    "# Claude provider request",
    "",
    `- **timestamp**: ${timestamp}`,
    `- **model**: ${request?.model ?? "unknown"}`,
    `- **endpoint**: ${method} ${requestPath}`,
    `- **upstream status**: ${statusCode}`,
    "",
    renderClaudeRequestAudit(audit, response.inputTokens),
    "",
    "## Request headers",
    "",
    "```text",
    renderRequestHeaders(headers),
    "```",
    "",
    "## Full provider payload",
    "",
    "```json",
    JSON.stringify(request, null, 2),
    "```",
    "",
    "## Provider response",
    "",
    response.markdown,
    "",
  ].join("\n");
  const markdownPath = join(LOG_DIR, `${baseName}.md`);
  const rawRequestPath = join(LOG_DIR, `${baseName}.request.json`);
  writeFileSync(markdownPath, markdown, { encoding: "utf8", mode: 0o600 });
  writeFileSync(rawRequestPath, body, { mode: 0o600 });
  chmodSync(markdownPath, 0o600);
  chmodSync(rawRequestPath, 0o600);

}

function handleProxyRequest(request, response) {
  const requestPath = request.url ?? "/";
  const requestChunks = [];
  request.on("data", (chunk) => requestChunks.push(chunk));
  request.on("end", () => {
    const body = Buffer.concat(requestChunks);
    const timestamp = new Date().toISOString();
    const upstream = https.request({
      hostname: UPSTREAM_HOST,
      port: 443,
      path: requestPath,
      method: request.method,
      headers: forwardRequestHeaders(request.headers, body),
    }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      const responseChunks = [];
      upstreamResponse.on("data", (chunk) => {
        responseChunks.push(chunk);
        response.write(chunk);
      });
      upstreamResponse.on("end", () => {
        response.end();
        if (!requestPath.includes("/v1/messages") || requestPath.includes("count_tokens")) {
          return;
        }

        try {
          writeClaudeRequestLog({
            body,
            headers: request.headers,
            method: request.method ?? "POST",
            requestPath,
            responseBody: Buffer.concat(responseChunks),
            statusCode: upstreamResponse.statusCode ?? 0,
            timestamp,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[claude-log] Request log render failed for ${request.method ?? "POST"} ${requestPath}: ${message}`);
        }
      });
    });

    upstream.on("error", (error) => {
      console.error(`[claude-log] Anthropic upstream request failed: ${error.message}`);
      if (!response.headersSent) {
        response.writeHead(502, { "content-type": "application/json" });
      }
      response.end(JSON.stringify({ error: `Claude request logger upstream error: ${error.message}` }));
    });

    if (body.length > 0) {
      upstream.write(body);
    }
    upstream.end();
  });
}

const server = http.createServer(handleProxyRequest);
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    console.error("[claude-log] Could not determine the local proxy address");
    process.exitCode = 1;
    server.close();
    return;
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`[claude-log] Logging requests to ${LOG_DIR}`);
  const claude = spawn("claude", process.argv.slice(2), {
    env: { ...process.env, ANTHROPIC_BASE_URL: baseUrl },
    stdio: "inherit",
  });

  claude.on("error", (error) => {
    console.error(`[claude-log] Could not start Claude Code: ${error.message}`);
    process.exitCode = 1;
    server.close();
  });

  claude.on("exit", (code) => {
    process.exitCode = code ?? 1;
    server.closeAllConnections();
    server.close();
  });
});
