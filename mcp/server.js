import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  hasDatabase,
  initDatabase,
  query,
  rowToDraft,
  rowToPublishedArticle,
  rowToQueuedSource,
} from './db.js';
import { hasFilestack, storeImageUrl } from './filestack.js';

const PORT = Number(process.env.PORT || 8787);
const FRONTDESK_EDITOR_TOKEN = process.env.FRONTDESK_EDITOR_TOKEN || '';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const memory = {
  drafts: [],
  published: [],
  sourceQueue: [],
};

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

function makeImageMetadata({ image, imageCredit = '', imageLicenseNote = '' }) {
  return {
    image: image || null,
    imageCredit,
    imageLicenseNote,
  };
}

async function createDraftRecord({ title, category, summary, body, sources, tone, image, imageCredit, imageLicenseNote }) {
  const draft = {
    id: `draft_${Date.now()}`,
    slug: makeSlug(title),
    title,
    category,
    summary,
    body,
    sources,
    ...makeImageMetadata({ image, imageCredit, imageLicenseNote }),
    tone,
    status: 'draft',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  if (!hasDatabase) {
    memory.drafts.unshift(draft);
    return draft;
  }

  const result = await query(
    `insert into article_drafts
      (id, slug, title, category, summary, body, sources, image, image_credit, image_license_note, tone, status)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, 'draft')
     returning *`,
    [
      draft.id,
      draft.slug,
      title,
      category,
      summary,
      body,
      JSON.stringify(sources),
      JSON.stringify(image || null),
      imageCredit,
      imageLicenseNote,
      tone,
    ],
  );

  return rowToDraft(result.rows[0]);
}

async function listDraftRecords() {
  if (!hasDatabase) return memory.drafts;

  const result = await query('select * from article_drafts order by created_at desc limit 50');
  return result.rows.map(rowToDraft);
}

async function queueSourceRecord({ url, category, note }) {
  const item = {
    id: `source_${Date.now()}`,
    url,
    category,
    note,
    status: 'queued',
    createdAt: nowIso(),
  };

  if (!hasDatabase) {
    memory.sourceQueue.unshift(item);
    return item;
  }

  const result = await query(
    `insert into source_queue (id, url, category, note, status)
     values ($1, $2, $3, $4, 'queued')
     returning *`,
    [item.id, url, category, note],
  );

  return rowToQueuedSource(result.rows[0]);
}

async function listSourceRecords() {
  if (!hasDatabase) return memory.sourceQueue;

  const result = await query('select * from source_queue order by created_at desc limit 100');
  return result.rows.map(rowToQueuedSource);
}

async function attachImageToDraftRecord({ draftId, image, imageCredit, imageLicenseNote }) {
  if (!hasDatabase) {
    const draft = memory.drafts.find((item) => item.id === draftId);
    if (!draft) throw new Error(`Draft not found: ${draftId}`);
    draft.image = image;
    draft.imageCredit = imageCredit;
    draft.imageLicenseNote = imageLicenseNote;
    draft.updatedAt = nowIso();
    return draft;
  }

  const result = await query(
    `update article_drafts
     set image = $2::jsonb,
         image_credit = $3,
         image_license_note = $4,
         updated_at = now()
     where id = $1
     returning *`,
    [draftId, JSON.stringify(image), imageCredit, imageLicenseNote],
  );

  if (!result.rows[0]) throw new Error(`Draft not found: ${draftId}`);
  return rowToDraft(result.rows[0]);
}

async function publishDraftRecord({ draftId, approvalNote }) {
  if (!hasDatabase) {
    const index = memory.drafts.findIndex((draft) => draft.id === draftId);
    if (index === -1) throw new Error(`Draft not found: ${draftId}`);

    const [draft] = memory.drafts.splice(index, 1);
    const article = {
      ...draft,
      status: 'published',
      approvalNote,
      publishedAt: nowIso(),
      updatedAt: nowIso(),
    };
    memory.published.unshift(article);
    return article;
  }

  const draftResult = await query('select * from article_drafts where id = $1', [draftId]);
  const draft = draftResult.rows[0];
  if (!draft) throw new Error(`Draft not found: ${draftId}`);

  const publishedResult = await query(
    `insert into published_articles
      (id, slug, title, category, summary, body, sources, image, image_credit, image_license_note, tone, status, approval_note)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, 'published', $12)
     returning *`,
    [
      draft.id.replace('draft_', 'article_'),
      draft.slug,
      draft.title,
      draft.category,
      draft.summary,
      draft.body,
      JSON.stringify(draft.sources || []),
      JSON.stringify(draft.image || null),
      draft.image_credit || '',
      draft.image_license_note || '',
      draft.tone,
      approvalNote,
    ],
  );

  await query('delete from article_drafts where id = $1', [draftId]);
  return rowToPublishedArticle(publishedResult.rows[0]);
}

async function listPublishedRecords() {
  if (!hasDatabase) return memory.published;

  const result = await query('select * from published_articles order by published_at desc limit 50');
  return result.rows.map(rowToPublishedArticle);
}

function createMcpServer() {
  const server = new McpServer({
    name: 'frontdesk-journalist-connector',
    version: '0.3.0',
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
            'FrontDesk is a mobile-first news site covering Daily Brief, Nigeria, World, Technology, Urban Pulse and Entertainment. AI assistants may gather public news, summarize neutrally, draft articles, create source queues, and prepare posts. They must not publish without explicit owner approval. For images, assistants should prefer licensed/public-domain/owned images, store approved image URLs in Filestack, and keep image credit/license notes with the draft.',
        },
      ],
    }),
  );

  server.tool(
    'database_status',
    'Check whether FrontDesk is using Aiven/Postgres storage or temporary memory storage, and whether Filestack is configured.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              databaseConfigured: hasDatabase,
              filestackConfigured: hasFilestack,
              storage: hasDatabase ? 'postgres' : 'memory',
              message: hasDatabase
                ? 'Aiven/Postgres storage is active.'
                : 'Database is not configured. Set AIVEN_DATABASE_URL or DATABASE_URL to persist drafts and articles.',
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.tool(
    'store_approved_image_url',
    'Store an owner-approved or license-safe public HTTPS image URL in Filestack, then return reusable image metadata.',
    {
      imageUrl: z.string().url(),
      filename: z.string().min(3),
      imageCredit: z.string().default(''),
      imageLicenseNote: z.string().default(''),
      sourcePageUrl: z.string().url().optional(),
    },
    async ({ imageUrl, filename, imageCredit, imageLicenseNote, sourcePageUrl }) => {
      const stored = await storeImageUrl({
        imageUrl,
        filename,
        metadata: {
          imageCredit,
          imageLicenseNote,
          sourcePageUrl: sourcePageUrl || '',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                image: stored,
                imageCredit,
                imageLicenseNote,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
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
      image: z.any().optional(),
      imageCredit: z.string().default(''),
      imageLicenseNote: z.string().default(''),
      tone: z.string().default('neutral, clear, modern news desk'),
    },
    async ({ title, category, summary, body, sources, image, imageCredit, imageLicenseNote, tone }) => {
      const draft = await createDraftRecord({
        title,
        category,
        summary,
        body,
        sources,
        image: image || null,
        imageCredit,
        imageLicenseNote,
        tone,
      });

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
    'attach_image_to_draft',
    'Attach Filestack image metadata to an existing FrontDesk draft after owner approval or license review.',
    {
      draftId: z.string(),
      image: z.any(),
      imageCredit: z.string().default(''),
      imageLicenseNote: z.string().default(''),
    },
    async ({ draftId, image, imageCredit, imageLicenseNote }) => {
      const draft = await attachImageToDraftRecord({ draftId, image, imageCredit, imageLicenseNote });

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
          text: JSON.stringify(await listDraftRecords(), null, 2),
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
      const item = await queueSourceRecord({ url, category, note });

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
          text: JSON.stringify(await listSourceRecords(), null, 2),
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
      const article = await publishDraftRecord({ draftId, approvalNote });

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
    'List published FrontDesk articles.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(await listPublishedRecords(), null, 2),
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
    storage: hasDatabase ? 'postgres' : 'memory',
    filestack: hasFilestack ? 'configured' : 'missing FILESTACK_API_KEY',
    mcpEndpoint: '/mcp',
    tools: [
      'frontdesk_brief',
      'database_status',
      'store_approved_image_url',
      'attach_image_to_draft',
      'create_article_draft',
      'list_article_drafts',
      'queue_news_source',
      'list_source_queue',
      'publish_approved_article',
      'list_published_articles',
    ],
  });
});

app.get('/api/articles', async (_req, res) => {
  try {
    res.json({ articles: await listPublishedRecords() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drafts', async (req, res) => {
  try {
    assertEditorToken(req.headers.authorization?.replace('Bearer ', '') || '');
    res.json({ drafts: await listDraftRecords() });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
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

if (hasDatabase) {
  initDatabase().catch((error) => {
    console.error('Failed to initialize FrontDesk database tables.');
    console.error(error);
  });
}

app.listen(PORT, () => {
  console.log(`FrontDesk MCP connector running on http://localhost:${PORT}/mcp`);
  console.log(`Storage mode: ${hasDatabase ? 'postgres' : 'memory'}`);
  console.log(`Filestack: ${hasFilestack ? 'configured' : 'missing FILESTACK_API_KEY'}`);
});
