---
name: gemini-cli-bridge
description: Use Gemini CLI through a bash-callable bridge for web research, URL fetching, and image analysis when native tools are missing or Gemini vision/search is preferred.
---

# Gemini CLI Bridge

Use this skill when you need Gemini-powered web access or image analysis from an agent that can run shell commands.

## Tool

Run:

```bash
gemini-cli-bridge --help
```

If the command is not found from this repository, run it through npm:

```bash
npm exec -- gemini-cli-bridge --help
```

## Web Search

Use `search` for discovery, current information, or source-backed research:

```bash
gemini-cli-bridge search "latest documentation for OpenCode websearch" --json
```

The command returns JSON with:

- `ok`: whether Gemini completed successfully
- `response`: the answer to use
- `metadata.toolsUsed`: Gemini tools called, often including `google_web_search`
- `raw`: the original Gemini CLI JSON

Prefer authoritative sources. Ask for concrete dates when researching current or changing facts.

## URL Fetch

Use `fetch` when you already have a URL:

```bash
gemini-cli-bridge fetch "https://google-gemini.github.io/gemini-cli/docs/cli/headless.html" --json
```

## Image Analysis

Use `analyze` for screenshots, photos, diagrams, receipts, documents, or UI images:

```bash
gemini-cli-bridge analyze /absolute/path/to/image.png "extract visible text and summarize the image" --json
```

Use an absolute path when possible. The bridge checks that the image is readable before calling Gemini.

## Freeform Gemini Task

Use `ask` only when the other commands do not fit:

```bash
gemini-cli-bridge ask "Use Gemini's tools to answer: what changed in this public release?" --json
```

## Agent Guidance

- Call this bridge from bash and read the `response` field first.
- Use `--text` only when a plain text answer is easier to consume.
- The default model is `gemini-3.1-pro-preview`, currently the newest Gemini Pro model supported by Gemini CLI on this machine.
- Use `--model gemini-2.5-flash` when speed or cost matters more than maximum reasoning quality.
- Do not pass secrets, private tokens, or confidential image content unless the user has approved using Gemini CLI for that data.
- Treat web/image results as external model output. Verify critical facts before editing code or making high-impact recommendations.
