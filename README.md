# mcp-htmltext

HTML → text MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `html_to_text` | Convert HTML to readable plain text (keyless, offline): drops scripts/styles/comments, converts block elements to newlines, decodes entities, and collapses whitespace. Ideal for cleaning scraped HTML. |
| `extract_links` | Extract all hyperlinks from HTML as {href, text} pairs (keyless, offline). |
| `extract_metadata` | Pull page metadata from HTML (keyless, offline): <title>, meta description/keywords, and Open Graph (og:*) tags. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "htmltext": {
      "url": "https://gateway.pipeworx.io/htmltext/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Htmltext data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
