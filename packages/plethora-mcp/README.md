# @plethora/mcp

**Plethora MCP** lets Claude Desktop, Cursor, Continue, Cline, and other MCP hosts **use the Plethora tool catalog and APIs** instead of only chatting.

ChatGPT/Claude alone answer. With this MCP they can **search tools, open URLs, fetch captions, ping hosts, polish prompts, size trades**, and more.

## One-line install (when published)

```json
{
  "mcpServers": {
    "plethora": {
      "command": "npx",
      "args": ["-y", "@plethora/mcp"],
      "env": {
        "PLETHORA_API_BASE": "https://YOUR_DOMAIN_OR_vercel.app"
      }
    }
  }
}
```

## Local run (right now)

From this package folder:

```bash
cd packages/plethora-mcp
npm install
node src/index.js
```

Host config:

```json
{
  "mcpServers": {
    "plethora": {
      "command": "node",
      "args": ["C:/Other Projects/Plethora/packages/plethora-mcp/src/index.js"],
      "env": {
        "PLETHORA_API_BASE": "https://plethora-ten.vercel.app"
      }
    }
  }
}
```

## Tools exposed

| Tool | Purpose |
|------|---------|
| `search_tools` | Find utilities / AI / marketing / trading tools |
| `list_tools` | Browse catalog (optional category) |
| `get_tool` | One tool by slug + URL |
| `recommend_stack` | AI + tool + MCP recommendations for a task |
| `polish_prompt` | Stronger prompts from messy goals |
| `youtube_captions` | Public YouTube transcript |
| `http_ping` | HTTP latency checks |
| `dns_lookup` | DNS records |
| `sitemap_find` | Sitemap discovery |
| `position_size` | Risk-based position sizing math |
| `open_in_plethora` | Best deep-link to finish the job in the UI |

## Why this sticky

Users keep returning because **their daily AI already has Plethora as skills** — not another tab they forget.
