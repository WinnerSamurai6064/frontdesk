# FrontDesk Journalist MCP Connector

This folder contains an MCP connector for a FrontDesk newsroom workflow.

## Tools

- frontdesk_brief: returns the FrontDesk editorial mission and rules.
- database_status: checks whether Aiven/Postgres storage and Filestack are active.
- queue_news_source: queues a public news URL for review.
- list_source_queue: lists queued URLs.
- store_approved_image_url: stores an owner-approved or license-safe HTTPS image URL in Filestack.
- attach_image_to_draft: attaches stored image metadata to a draft.
- create_article_draft: creates a draft article after sources are gathered.
- list_article_drafts: lists drafts waiting for owner review.
- publish_approved_article: publishes only after owner approval.
- list_published_articles: lists published articles.

## Image policy

Do not blindly download every image from news sites.

Recommended flow:

1. The assistant gathers the article sources.
2. The assistant suggests an image option only if it is owned, public-domain, Creative Commons, from an approved stock source, or explicitly provided by the owner.
3. The assistant stores the approved image URL in Filestack.
4. The assistant saves image credit and license notes with the draft.
5. The owner reviews the draft before publishing.

## Filestack setup

Set your Filestack API key before running the connector:

```bash
FILESTACK_API_KEY="your-filestack-api-key"
```

The connector can then store approved image URLs and save the returned Filestack CDN metadata with articles.

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
- With FILESTACK_API_KEY set: approved images can be copied to Filestack and attached to drafts.
- Without a database URL: the connector falls back to temporary memory storage for development.
