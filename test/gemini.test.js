import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompt, normalizeResult, parseGeminiOutput } from "../src/gemini.js";
import { parseArgs } from "../src/cli.js";

test("buildPrompt creates a web-search prompt", () => {
  const prompt = buildPrompt({ command: "search", input: "Gemini CLI docs" });
  assert.match(prompt, /Use Google web search/);
  assert.match(prompt, /Query: Gemini CLI docs/);
});

test("buildPrompt references image files with Gemini file syntax", () => {
  const prompt = buildPrompt({ command: "analyze", input: "/tmp/photo.png", question: "What text is visible?" });
  assert.match(prompt, /Image file: @\/tmp\/photo\.png/);
  assert.match(prompt, /Question: What text is visible\?/);
});

test("parseGeminiOutput handles clean JSON", () => {
  const parsed = parseGeminiOutput('{"response":"ok","stats":{"tools":{"totalCalls":1}}}');
  assert.equal(parsed.response, "ok");
  assert.equal(parsed.stats.tools.totalCalls, 1);
});

test("parseGeminiOutput handles plain text fallback", () => {
  const parsed = parseGeminiOutput("plain answer");
  assert.deepEqual(parsed, { response: "plain answer" });
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

  assert.equal(result.ok, true);
  assert.equal(result.response, "answer");
  assert.deepEqual(result.metadata.modelNames, ["gemini-3.1-pro-preview"]);
  assert.deepEqual(result.metadata.toolsUsed, ["google_web_search"]);
});

test("parseArgs accepts command options", () => {
  const parsed = parseArgs(["search", "hello", "world", "--model", "gemini-3.1-pro-preview", "--text"]);
  assert.equal(parsed.command, "search");
  assert.equal(parsed.input, "hello world");
  assert.equal(parsed.model, "gemini-3.1-pro-preview");
  assert.equal(parsed.format, "text");
});

test("parseArgs treats analyze input as file plus question", () => {
  const parsed = parseArgs(["analyze", "image.png", "what", "text", "is", "visible"]);
  assert.equal(parsed.command, "analyze");
  assert.equal(parsed.input, "image.png");
  assert.equal(parsed.question, "what text is visible");
});
