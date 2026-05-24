# Connecting FrontDesk to Claude / ChatGPT-style MCP clients

The repo now contains a remote MCP server at:

```txt
/mcp
```

Locally it runs at:

```txt
http://localhost:8787/mcp
```

For mobile apps or cloud connectors, localhost is not enough. Host the MCP server on a public HTTPS URL, then paste that URL into the connector setup screen.

Example hosted endpoint:

```txt
https://frontdesk-mcp.yourdomain.com/mcp
```

## Required environment variables

```bash
AIVEN_DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
FILESTACK_API_KEY="your-filestack-api-key"
FRONTDESK_EDITOR_TOKEN="choose-a-private-owner-token"
PORT=8787
```

## Test before connecting apps

After deploying, open the health check:

```txt
https://frontdesk-mcp.yourdomain.com/
```

You should see JSON with:

```json
{
  "name": "FrontDesk Journalist MCP Connector",
  "status": "ok",
  "mcpEndpoint": "/mcp"
}
```

Then use this as the connector endpoint:

```txt
https://frontdesk-mcp.yourdomain.com/mcp
```

## VM + Caddy reverse proxy example

Run the MCP server on the VM:

```bash
npm install
npm run db:init
npm run mcp
```

Caddyfile example:

```txt
frontdesk-mcp.yourdomain.com {
  reverse_proxy 127.0.0.1:8787
}
```

## Claude mobile / custom connector flow

1. Deploy this MCP server to a public HTTPS URL.
2. Open Claude settings.
3. Go to Connectors.
4. Add a custom connector / remote MCP server.
5. Paste the endpoint URL ending in `/mcp`.
6. Test the connector.
7. Ask Claude: `Use FrontDesk to check database_status`.

## ChatGPT-style MCP client flow

Use the same public HTTPS `/mcp` endpoint in any MCP-compatible client that supports remote MCP / Streamable HTTP.

## FrontDesk journalist workflow

Suggested assistant behavior:

1. Gather public news sources.
2. Queue source URLs with `queue_news_source`.
3. Draft article with `create_article_draft`.
4. For images, only use owner-approved or license-safe URLs.
5. Store approved image URL with `store_approved_image_url`.
6. Attach it with `attach_image_to_draft`.
7. Wait for owner approval.
8. Publish with `publish_approved_article` only after the owner says so.

## Current connector tools

- frontdesk_brief
- database_status
- queue_news_source
- list_source_queue
- store_approved_image_url
- attach_image_to_draft
- create_article_draft
- list_article_drafts
- publish_approved_article
- list_published_articles
