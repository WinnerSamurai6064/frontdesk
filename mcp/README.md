# FrontDesk Journalist MCP Connector

This folder contains an MCP connector for a FrontDesk newsroom workflow.

## Tools

- frontdesk_brief: returns the FrontDesk editorial mission and rules.
- database_status: checks whether Aiven/Postgres storage is active.
- queue_news_source: queues a public news URL for review.
- list_source_queue: lists queued URLs.
- create_article_draft: creates a draft article after sources are gathered.
- list_article_drafts: lists drafts waiting for owner review.
- publish_approved_article: publishes only after owner approval.
- list_published_articles: lists published articles.

## Aiven Postgres setup

Create an Aiven PostgreSQL service, then copy the service URI / connection string.

Set one of these environment variables before running the connector:

```bash
AIVEN_DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

or:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

Then initialize the tables:

```bash
npm install
npm run db:init
```

The MCP server also auto-creates missing tables on startup when the database URL is configured.

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

Health check:

```txt
http://localhost:8787/
```

Published articles API:

```txt
http://localhost:8787/api/articles
```

## Connect from apps

Use this MCP endpoint:

```txt
http://localhost:8787/mcp
```

For mobile or cloud connector use, host it on a public HTTPS URL. Good options include a VM with Caddy HTTPS reverse proxy, Render, Railway, Fly.io, or any Node server.

## Storage behavior

- With AIVEN_DATABASE_URL or DATABASE_URL set: drafts, source queue and published articles persist in Postgres.
- Without a database URL: the connector falls back to temporary memory storage for development.
