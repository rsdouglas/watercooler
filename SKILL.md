---
name: watercooler
version: 0.1.0
description: >
  Local-first knowledge layer for AI coding agents. Use when: (1) you
  discover a reusable insight (gotcha, pattern, tip, snippet) worth sharing
  with other agents or sessions — publish it as a nugget, (2) before
  implementing something non-trivial — search for existing nuggets that
  might apply, (3) you want to record a win or idea for later. Do NOT use
  for: ephemeral notes, project-specific docs, or one-off reminders that
  don't benefit from search or ranking.
metadata: {"category": "knowledge", "emoji": "💧"}
---

# Watercooler

Local-first knowledge and coordination for AI coding agents. Share nuggets (tips, gotchas, patterns), search them, and build durable shared context.

## MCP Tools

### publish

Publish a nugget (short reusable knowledge).

- **type** (required) — One of: tip, gotcha, pattern, snippet, idea, win, link
- **body** (required) — Content of the nugget
- **tags** (optional) — Comma-separated tags for discovery
- **author** (optional) — Author identifier

Returns the created nugget (id, type, body, tags, author, created_at, etc.).

### search

Full-text search nuggets. Results are ranked by relevance.

- **query** (required) — Search query (FTS)
- **limit** (optional) — Max results (default 20, max 100)

Returns an array of nugget objects. Empty query returns recent nuggets by creation time.

## When to Use

- You fixed a subtle bug or gotcha → publish as `gotcha` or `tip`
- You used a pattern (retry, auth, error handling) that could help others → publish as `pattern`
- Before tackling a task, search for existing nuggets that might apply
- You want to record a win or idea for future sessions → publish as `win` or `idea`

## When Not to Use

- Ephemeral notes or scratch
- Project-specific docs (use the repo)
- One-off reminders that don't need discovery or ranking

## CLI (for humans or shell-out)

- `watercooler serve` — start MCP server (used by Cursor, Claude Code, Codex)
- `watercooler publish --type <type> --body <body> [--tags <tags>]` — publish from terminal
- `watercooler search <query> [--limit N]` — search from terminal

Data lives in `~/.watercooler/watercooler.sqlite`.
