import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { assertReadableFile, buildPrompt, normalizeResult, runGemini } from "./gemini.js";

const VERSION = "0.1.0";

export interface ParsedArgs {
  command: string | null;
  input: string | null;
  question: string | null;
  instruction: string | null;
  model: string | undefined;
  timeoutMs: number | undefined;
  format: "json" | "text";
  help: boolean;
  version: boolean;
}

export async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (parsed.help) {
    console.log(helpText());
    return;
  }

  if (parsed.version) {
    console.log(VERSION);
    return;
  }

  if (!parsed.command) {
    throw new Error(`Missing command.\n\n${helpText()}`);
  }

  if (parsed.command === "skill-path") {
    console.log(skillPath());
    return;
  }

  if (!["search", "fetch", "analyze", "ask"].includes(parsed.command)) {
    throw new Error(`Unknown command: ${parsed.command}\n\n${helpText()}`);
  }

  if (!parsed.input) {
    throw new Error(`Missing input for '${parsed.command}'.`);
  }

  const input = parsed.command === "analyze" ? resolve(parsed.input) : parsed.input;
  if (parsed.command === "analyze") {
    await assertReadableFile(input);
  }

  const prompt = buildPrompt({
    command: parsed.command as "search" | "fetch" | "analyze" | "ask",
    input,
    question: parsed.question,
    instruction: parsed.instruction,
  });

  const geminiResult = await runGemini({
    prompt,
    model: parsed.model,
    timeoutMs: parsed.timeoutMs,
  });

  const result = normalizeResult({
    command: parsed.command,
    input,
    prompt,
    geminiResult,
  });

  if (parsed.format === "text") {
    console.log(result.response);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  if (!result.ok) process.exitCode = 1;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: null,
    input: null,
    question: null,
    instruction: null,
    model: undefined,
    timeoutMs: undefined,
    format: "json",
    help: false,
    version: false,
  };

  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "-v" || arg === "--version") parsed.version = true;
    else if (arg === "--text") parsed.format = "text";
    else if (arg === "--json") parsed.format = "json";
    else if (arg === "--model") parsed.model = readValue(argv, ++i, "--model");
    else if (arg === "--timeout-ms") parsed.timeoutMs = Number(readValue(argv, ++i, "--timeout-ms"));
    else if (arg === "--instruction") parsed.instruction = readValue(argv, ++i, "--instruction");
    else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }

  parsed.command = positional.shift() || null;
  if (parsed.command === "analyze") {
    parsed.input = positional.shift() || null;
    parsed.question = positional.join(" ").trim() || null;
  } else {
    parsed.input = positional.join(" ").trim() || null;
  }

  if (parsed.timeoutMs !== undefined && (!Number.isFinite(parsed.timeoutMs) || parsed.timeoutMs <= 0)) {
    throw new Error("--timeout-ms must be a positive number.");
  }

  return parsed;
}

function readValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function helpText(): string {
  return `gemini-cli-bridge v${VERSION}

Agent-friendly wrapper around Gemini CLI headless mode.

Usage:
  gemini-cli-bridge search "latest OpenCode websearch docs"
  gemini-cli-bridge fetch "https://example.com/docs"
  gemini-cli-bridge analyze ./image.png "extract visible text"
  gemini-cli-bridge ask "Use Gemini tools to answer this"
  gemini-cli-bridge skill-path

Options:
  --model <name>          Gemini model to use (default: gemini-3.1-pro-preview)
  --timeout-ms <ms>       Timeout for the Gemini CLI process (default: 120000)
  --instruction <text>    Override the default agent instruction
  --json                  Print structured JSON (default)
  --text                  Print only the Gemini response text
  -h, --help              Show help
  -v, --version           Show version

Environment:
  GEMINI_CLI_BRIDGE_GEMINI_BIN       Gemini binary path (default: gemini)
  GEMINI_CLI_BRIDGE_MODEL            Default model override
  GEMINI_CLI_BRIDGE_TIMEOUT_MS       Default timeout override`;
}

function skillPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const fromHere = resolve(here, "../skills/gemini-cli-bridge/SKILL.md");
  if (existsSync(fromHere)) return fromHere;
  return resolve(here, "../../skills/gemini-cli-bridge/SKILL.md");
}
