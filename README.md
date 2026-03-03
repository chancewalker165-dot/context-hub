# Context Hub

Context Hub gives AI agents the right documentation — and agents that use it get smarter with every task.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@aisuite/chub)](https://www.npmjs.com/package/@aisuite/chub)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

## The Problem

Your AI agent was trained months — or years — ago. The API you're using shipped a breaking change last week. The agent doesn't know. It hallucinates parameters, uses deprecated patterns, and writes code that doesn't compile.

It gets worse with existing codebases. You're debugging a project pinned to an older SDK version. The agent has no idea what's different between v2 and v3 — it just guesses.

Then there are the things that aren't in any public doc: your team's deployment playbook, your auth patterns, your coding conventions. Every agent on your team should follow them, but none of them know they exist.

You can paste docs into chat, but it doesn't scale. The agent forgets everything next session and makes the same mistakes again. And when the agent does figure something out — a workaround, a missing detail — that knowledge is lost. There's no way to capture it for next time.

## Quick Start

```bash
npm install -g @aisuite/chub
chub search "stripe"                 # find what's available
chub get stripe/api                  # fetch current docs
```

## The Agent Workflow

Context Hub is designed for a loop where agents get better over time.

**Most of the time, it's simple — search, fetch, use:**

```bash
chub search "stripe payments"        # find relevant docs
chub get stripe/api                  # fetch the doc
# Agent reads the doc, writes correct code. Done.
```

**When the agent discovers a gap**, it can annotate locally for next time:

```bash
# Agent figured out that webhook verification needs the raw request body.
# That wasn't obvious from the doc. Save it:
chub annotate stripe/api "Webhook verification requires raw body — do not parse JSON before verifying"

# Next session, the annotation appears automatically:
chub get stripe/api
# ---
# [Agent note]
# Webhook verification requires raw body — do not parse JSON before verifying
```

The annotation persists across sessions. The agent doesn't repeat the same mistake.

**The content itself improves over time too.** Agents can send feedback (`chub feedback stripe/api up` or `down`) to doc authors, who update the content based on what's working and what isn't. So the docs get better for everyone — not just your local annotations.

## Content Types

**Docs** — API and SDK references. Versioned, language-specific. "What to know."
```bash
chub get openai/chat-api --lang py   # Python variant
chub get stripe/api --lang js        # JavaScript variant
```

**Skills** — Task recipes, automation patterns, coding playbooks. Standalone. "How to do it."
```bash
chub get pw-community/login-flows    # fetch a skill
```

Both are markdown with YAML frontmatter, following the [Agent Skills](https://agentskills.io) open standard — compatible with Claude Code, Cursor, Codex, and other AI tools.

## Commands

| Command | Purpose |
|---------|---------|
| `chub search [query]` | Search docs and skills (no query = list all) |
| `chub get <ids...>` | Fetch docs or skills by ID |
| `chub annotate <id> <note>` | Attach a note to a doc or skill |
| `chub annotate <id> --clear` | Remove an annotation |
| `chub annotate --list` | List all annotations |
| `chub feedback <id> <up\|down>` | Rate a doc or skill (sent to maintainers) |
| `chub update` | Refresh the cached registry |
| `chub cache status\|clear` | Manage the local cache |
| `chub build <content-dir>` | Build registry from a content directory |

Every command supports `--json` for machine-readable output.

### Key Flags

| Flag | Purpose |
|------|---------|
| `--json` | Structured JSON output (for agents and piping) |
| `--tags <csv>` | Filter search results by tags |
| `--lang <language>` | Language variant (js, py, ts, etc.) |
| `--full` | Fetch all files, not just the entry point |
| `--file <paths>` | Fetch specific reference file(s), comma-separated |
| `-o, --output <path>` | Write content to file or directory |

## Key Features

### Incremental Fetch

When a doc has reference files beyond the main entry point, the CLI tells you:

```
# Acme Widgets API
...

---
Additional files available (use --file to fetch):
  references/advanced.md
  references/errors.md
Example: chub get acme/widgets --file references/advanced.md
```

Fetch only what you need. No wasted tokens on files you won't use.

```bash
chub get acme/widgets --file references/advanced.md     # one file
chub get acme/widgets --file advanced.md,errors.md       # multiple
chub get acme/widgets --full                             # everything
```

### Agent Annotations

Agents attach notes to docs that persist across sessions:

```bash
chub annotate stripe/api "Use idempotency keys for all POST requests to avoid duplicate charges"
```

The note appears automatically on every future `chub get stripe/api`. Annotations are local — they live in `~/.chub/annotations/` and are specific to your machine.

To view, replace, or clear:
```bash
chub annotate stripe/api                  # view current note
chub annotate stripe/api "new note"       # replaces previous
chub annotate stripe/api --clear          # removes it
chub annotate --list                      # list all annotations
```

### Feedback

Rate docs to help maintainers improve them:

```bash
chub feedback stripe/api up "Clear examples, well structured"
chub feedback openai/chat down --label outdated --label wrong-examples
```

Feedback is sent to the registry. Annotations are local. Both matter.

### Multi-Source

Combine the public registry with your own private docs:

```yaml
# ~/.chub/config.yaml
sources:
  - name: community
    url: https://cdn.aichub.org/v1
  - name: internal
    path: /path/to/local/docs
```

Build your own content with `chub build`:

```bash
chub build my-content/ -o dist/
```

### JSON Output

Every command supports `--json` for agent piping:

```bash
# Search and fetch in one pipeline
ID=$(chub search "stripe" --json | jq -r '.results[0].id')
chub get "$ID" --lang js -o .context/stripe.md

# Check for additional files
chub get acme/widgets --json | jq '.additionalFiles'

# List all annotations as JSON
chub annotate --list --json
```

## Configuration

Config lives at `~/.chub/config.yaml`:

```yaml
sources:
  - name: community
    url: https://cdn.aichub.org/v1
  - name: internal
    path: /path/to/local/docs

source: "official,maintainer,community"   # trust policy
refresh_interval: 86400                   # cache TTL in seconds (24h)
telemetry: true                           # anonymous usage analytics
```

Opt out of telemetry:
```yaml
telemetry: false
```
Or via environment variable: `CHUB_TELEMETRY=0`

## License

[MIT](LICENSE)
