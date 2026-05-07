import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

export const DEFAULT_MODEL = "gemini-3.1-pro-preview";

export async function assertReadableFile(path) {
  await access(path, constants.R_OK);
}

export function buildPrompt({ command, input, question, instruction }) {
  const baseInstruction =
    instruction ||
    "Return a concise, factual answer. Include source links when web results are used.";

  if (command === "search") {
    return [
      baseInstruction,
      "",
      "Use Google web search to answer this query. Prefer recent, authoritative sources and cite the sources used.",
      "",
      `Query: ${input}`,
    ].join("\n");
  }

  if (command === "fetch") {
    return [
      baseInstruction,
      "",
      "Fetch and summarize the following URL. Preserve important facts, dates, and source attribution.",
      "",
      `URL: ${input}`,
    ].join("\n");
  }

  if (command === "analyze") {
    return [
      baseInstruction,
      "",
      "Analyze the attached image file. Describe visible content, extract text if present, and answer the user's question.",
      "",
      `Image file: @${input}`,
      question ? `Question: ${question}` : "Question: What is visible in this image?",
    ].join("\n");
  }

  if (command === "ask") {
    return input;
  }

  throw new Error(`Unsupported command: ${command}`);
}

export function runGemini({
  prompt,
  geminiBin = process.env.GEMINI_CLI_BRIDGE_GEMINI_BIN || "gemini",
  model = process.env.GEMINI_CLI_BRIDGE_MODEL || DEFAULT_MODEL,
  timeoutMs = Number(process.env.GEMINI_CLI_BRIDGE_TIMEOUT_MS || 120000),
  cwd = process.cwd(),
  extraArgs = [],
} = {}) {
  if (!prompt) throw new Error("Missing prompt.");

  const args = [
    "--prompt",
    prompt,
    "--output-format",
    "json",
    "--model",
    model,
    "--approval-mode",
    "yolo",
    "--skip-trust",
    ...extraArgs,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(geminiBin, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`Gemini CLI timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(`Gemini CLI failed with code ${code ?? signal}: ${stderr || stdout}`.trim()));
        return;
      }

      resolve(parseGeminiOutput(stdout, stderr));
    });
  });
}

export function parseGeminiOutput(stdout, stderr = "") {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error(`Gemini CLI returned no output.${stderr ? ` stderr: ${stderr}` : ""}`);
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
      if (parsed && typeof parsed === "object") return parsed;
    }
  }

  return { response: trimmed };
}

export function normalizeResult({ command, input, prompt, geminiResult }) {
  const stats = geminiResult.stats || {};
  const tools = stats.tools || {};

  return {
    ok: !geminiResult.error,
    command,
    input,
    response: geminiResult.response || "",
    error: geminiResult.error || null,
    metadata: {
      modelNames: stats.models ? Object.keys(stats.models) : [],
      toolCalls: tools.totalCalls || 0,
      toolsUsed: tools.byName ? Object.keys(tools.byName) : [],
      prompt,
    },
    raw: geminiResult,
  };
}
