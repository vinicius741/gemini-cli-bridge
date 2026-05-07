# gemini-cli-bridge

Agent-friendly CLI bridge for the installed Google Gemini CLI.

The bridge is intentionally small: Pi, OpenCode, Codex, or any other shell-capable agent can call it from bash to get Gemini-powered web search, URL fetching, and image analysis. It uses Gemini CLI headless mode, so it reuses your existing `gemini` authentication and configuration.

## Install

From this repository:

```bash
bun install
```

Or use without installation:

```bash
bun run bin/gemini-cli-bridge.ts --help
```

Requirements:

- [Bun](https://bun.sh) 1.0+
- Google Gemini CLI installed and authenticated (`gemini --version`)

## Usage

```bash
gemini-cli-bridge search "latest Gemini CLI headless mode docs"
gemini-cli-bridge fetch "https://google-gemini.github.io/gemini-cli/docs/cli/headless.html"
gemini-cli-bridge analyze /path/to/image.png "extract all visible text"
gemini-cli-bridge ask "Use Gemini tools to answer this task"
```

The default output is structured JSON:

```json
{
  "ok": true,
  "command": "search",
  "input": "latest Gemini CLI headless mode docs",
  "response": "...",
  "error": null,
  "metadata": {
    "modelNames": ["gemini-3.1-pro-preview"],
    "toolCalls": 1,
    "toolsUsed": ["google_web_search"],
    "prompt": "..."
  },
  "raw": {}
}
```

Use `--text` to print only the answer.

## Options

```bash
gemini-cli-bridge search "query" --model gemini-3.0-flash
gemini-cli-bridge analyze ./photo.jpg "describe it" --timeout-ms 240000
gemini-cli-bridge fetch "https://example.com" --instruction "Return bullet points with dates."
```

Environment variables:

- `GEMINI_CLI_BRIDGE_GEMINI_BIN`: Gemini binary path, default `gemini`
- `GEMINI_CLI_BRIDGE_MODEL`: default model override, default `gemini-3.1-pro-preview`
- `GEMINI_CLI_BRIDGE_TIMEOUT_MS`: default timeout, default `120000`

## Agent Skill

A reusable skill file is included at:

```bash
skills/gemini-cli-bridge/SKILL.md
```

Print the path with:

```bash
gemini-cli-bridge skill-path
```

For Pi, place or symlink the skill under a Pi skills directory. For OpenCode or Codex-style agents, load the `SKILL.md` content as an agent skill/instruction.

## Notes

The bridge uses:

```bash
gemini --prompt "..." --output-format json --model gemini-3.1-pro-preview --approval-mode yolo --skip-trust
```

That allows Gemini CLI to use its web and file/image capabilities in non-interactive mode. Do not pass secrets or private images unless you are comfortable sending that content through Gemini CLI.

## License

MIT
