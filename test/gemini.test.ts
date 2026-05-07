import { expect, test } from "bun:test";
import { buildPrompt, normalizeResult, parseGeminiOutput } from "../src/gemini.js";
import { parseArgs } from "../src/cli.js";

test("buildPrompt creates a web-search prompt", () => {
  const prompt = buildPrompt({ command: "search", input: "Gemini CLI docs" });
  expect(prompt).toMatch(/Use Google web search/);
  expect(prompt).toMatch(/Query: Gemini CLI docs/);
});

test("buildPrompt references image files with Gemini file syntax", () => {
  const prompt = buildPrompt({ command: "analyze", input: "/tmp/photo.png", question: "What text is visible?" });
  expect(prompt).toMatch(/Image file: @\/tmp\/photo\.png/);
  expect(prompt).toMatch(/Question: What text is visible\?/);
});

test("parseGeminiOutput handles clean JSON", () => {
  const parsed = parseGeminiOutput('{"response":"ok","stats":{"tools":{"totalCalls":1}}}');
  expect(parsed.response).toBe("ok");
  expect(parsed.stats!.tools!.totalCalls).toBe(1);
});

test("parseGeminiOutput handles plain text fallback", () => {
  const parsed = parseGeminiOutput("plain answer");
  expect(parsed).toEqual({ response: "plain answer" });
});

test("normalizeResult creates agent-friendly JSON", () => {
  const result = normalizeResult({
    command: "search",
    input: "x",
    prompt: "p",
    geminiResult: {
      response: "answer",
      stats: {
        models: { "gemini-3.1-pro-preview": {} },
        tools: { totalCalls: 1, byName: { google_web_search: {} } },
      },
    },
  });

  expect(result.ok).toBe(true);
  expect(result.response).toBe("answer");
  expect(result.metadata.modelNames).toEqual(["gemini-3.1-pro-preview"]);
  expect(result.metadata.toolsUsed).toEqual(["google_web_search"]);
});

test("parseArgs accepts command options", () => {
  const parsed = parseArgs(["search", "hello", "world", "--model", "gemini-3.1-pro-preview", "--text"]);
  expect(parsed.command).toBe("search");
  expect(parsed.input).toBe("hello world");
  expect(parsed.model).toBe("gemini-3.1-pro-preview");
  expect(parsed.format).toBe("text");
});

test("parseArgs treats analyze input as file plus question", () => {
  const parsed = parseArgs(["analyze", "image.png", "what", "text", "is", "visible"]);
  expect(parsed.command).toBe("analyze");
  expect(parsed.input).toBe("image.png");
  expect(parsed.question).toBe("what text is visible");
});
