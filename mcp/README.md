# FrontDesk Journalist MCP Connector

This folder contains a starter MCP connector for a FrontDesk newsroom workflow.

## Tools

- frontdesk_brief: returns the FrontDesk editorial mission and rules.
- queue_news_source: queues a public news URL for review.
- list_source_queue: lists queued URLs.
- create_article_draft: creates a draft article after sources are gathered.
- list_article_drafts: lists drafts waiting for owner review.
- publish_approved_article: publishes only after owner approval.
- list_published_articles: lists published articles from this connector runtime.

## Owner approval rule

Assistants can gather news and create drafts. They should not publish until you explicitly approve the article.

For stronger protection, set this environment variable before running the connector:

```bash
FRONTDESK_EDITOR_TOKEN="choose-a-private-token"
```

Then publish_approved_article requires that token.

## Run locally

From the project root:

```bash
npm install
npm run mcp
```

The connector runs at:

```txt
http://localhost:8787/mcp
```

## Connect from apps

Use this MCP endpoint:

```txt
http://localhost:8787/mcp
```

For mobile or cloud connector use, host it on a public HTTPS URL. Good options include a VM with Caddy HTTPS reverse proxy, Render, Railway, Fly.io, or any Node server.

## Production note

This starter stores drafts in memory, so data resets when the server restarts. For production, connect these tools to a database such as Neon Postgres, Supabase, Aiven SQL, or SQLite on your VM.
