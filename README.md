# gemini-cli-bridge

A CLI tool that integrates the Gemini CLI SDK with the Pi agent and open-code ecosystem.

## Overview

**gemini-cli-bridge** bridges Google's Gemini CLI capabilities into the Pi agent and open-code workflows. It exposes two core functionalities:

- **Web Search** — Leverages the Gemini CLI SDK to perform intelligent web searches and return structured results.
- **Photo Analysis** — Uses Gemini's multimodal capabilities to analyze images and extract actionable insights.

This tool is designed to be invoked as a CLI binary and can be integrated as a custom tool/extension within Pi agent and open-code environments.

## Status

> 🚧 Project initialized — implementation coming soon.

## Usage

```bash
# Search the web via Gemini CLI
gemini-cli-bridge search "your query here"

# Analyze a photo
gemini-cli-bridge analyze /path/to/image.png
```

## Integration

This project is intended to be used as a custom tool within:

- **[Pi](https://github.com/mariozechner/pi-coding-agent)** — via extensions/skills
- **[open-code](https://github.com/opencode-ai/opencode)** — via custom providers/tools

## License

MIT