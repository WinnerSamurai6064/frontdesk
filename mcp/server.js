import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const PORT = Number(process.env.PORT || 8787);
const FRONTDESK_EDITOR_TOKEN = process.env.FRONTDESK_EDITOR_TOKEN || '';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const drafts = [];
const published = [];
const sourceQueue = [];

function assertEditorToken(token) {
  if (!FRONTDESK_EDITOR_TOKEN) return;
  if (token !== FRONTDESK_EDITOR_TOKEN) {
    throw new Error('Invalid FRONTDESK_EDITOR_TOKEN. Publishing and editing require owner approval.');
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90);
}

function createMcpServer() {
  const server = new McpServer({
    name: 'frontdesk-journalist-connector',
    version: '0.1.0',
  });

  server.tool(
    'frontdesk_brief',
    'Return the FrontDesk editorial mission, sections and operating rules for AI journalist assistants.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text:
            'FrontDesk is a mobile-first news site covering Daily Brief, Nigeria, World, Technology, Urban Pulse and Entertainment. AI assistants may gather public news, summarize neutrally, draft articles, create source queues, and prepare posts. They must not publish without explicit owner approval.',
        },
      ],
    }),
  );

  server.tool(
    'create_article_draft',
    'Create a FrontDesk article draft. This does not publish. Use after gathering and verifying sources.',
    {
      title: z.string().min(8),
      category: z.enum(['Daily Brief', 'Nigeria', 'World', 'Technology', 'Urban Pulse', 'Entertainment']),
      summary: z.string().min(20),
      body: z.string().min(80),
      sources: z.array(z.string().url()).default([]),
      tone: z.string().default('neutral, clear, modern news desk'),
    },
    async ({ title, category, summary, body, sources, tone }) => {
      const draft = {
        id: `draft_${Date.now()}`,
        slug: makeSlug(title),
        title,
        category,
        summary,
        body,
        sources,
        tone,
        status: 'draft',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      drafts.unshift(draft);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(draft, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'list_article_drafts',
    'List FrontDesk drafts waiting for owner review.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(drafts, null, 2),
        },
      ],
    }),
  );

  server.tool(
    'queue_news_source',
    'Queue a public news source URL for FrontDesk review, summarization or article drafting.',
    {
      url: z.string().url(),
      category: z.enum(['Daily Brief', 'Nigeria', 'World', 'Technology', 'Urban Pulse', 'Entertainment']),
      note: z.string().default(''),
    },
    async ({ url, category, note }) => {
      const item = {
        id: `source_${Date.now()}`,
        url,
        category,
        note,
        status: 'queued',
        createdAt: nowIso(),
      };
      sourceQueue.unshift(item);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'list_source_queue',
    'List queued source URLs for FrontDesk.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(sourceQueue, null, 2),
        },
      ],
    }),
  );

  server.tool(
    'publish_approved_article',
    'Publish an existing draft only after the owner explicitly says to publish. Requires FRONTDESK_EDITOR_TOKEN if configured.',
    {
      draftId: z.string(),
      editorToken: z.string().default(''),
      approvalNote: z.string().min(3),
    },
    async ({ draftId, editorToken, approvalNote }) => {
      assertEditorToken(editorToken);

      const index = drafts.findIndex((draft) => draft.id === draftId);
      if (index === -1) {
        throw new Error(`Draft not found: ${draftId}`);
      }

      const [draft] = drafts.splice(index, 1);
      const article = {
        ...draft,
        status: 'published',
        approvalNote,
        publishedAt: nowIso(),
        updatedAt: nowIso(),
      };
      published.unshift(article);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(article, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'list_published_articles',
    'List published FrontDesk articles from this connector runtime.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(published, null, 2),
        },
      ],
    }),
  );

  return server;
}

app.get('/', (_req, res) => {
  res.json({
    name: 'FrontDesk Journalist MCP Connector',
    status: 'ok',
    mcpEndpoint: '/mcp',
    tools: [
      'frontdesk_brief',
      'create_article_draft',
      'list_article_drafts',
      'queue_news_source',
      'list_source_queue',
      'publish_approved_article',
      'list_published_articles',
    ],
  });
});

app.post('/mcp', async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`FrontDesk MCP connector running on http://localhost:${PORT}/mcp`);
});
