import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL || '';

export const hasDatabase = Boolean(connectionString);

export const pool = hasDatabase
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === 'true',
      },
    })
  : null;

export async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database is not configured. Set AIVEN_DATABASE_URL or DATABASE_URL.');
  }

  return pool.query(text, params);
}

export async function initDatabase() {
  await query(`
    create table if not exists source_queue (
      id text primary key,
      url text not null,
      category text not null,
      note text default '',
      status text not null default 'queued',
      created_at timestamptz not null default now()
    );
  `);

  await query(`
    create table if not exists article_drafts (
      id text primary key,
      slug text not null,
      title text not null,
      category text not null,
      summary text not null,
      body text not null,
      sources jsonb not null default '[]'::jsonb,
      image jsonb,
      image_credit text default '',
      image_license_note text default '',
      tone text not null default 'neutral, clear, modern news desk',
      status text not null default 'draft',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await query(`
    create table if not exists published_articles (
      id text primary key,
      slug text not null,
      title text not null,
      category text not null,
      summary text not null,
      body text not null,
      sources jsonb not null default '[]'::jsonb,
      image jsonb,
      image_credit text default '',
      image_license_note text default '',
      tone text not null default 'neutral, clear, modern news desk',
      status text not null default 'published',
      approval_note text not null,
      published_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await query('alter table article_drafts add column if not exists image jsonb;');
  await query("alter table article_drafts add column if not exists image_credit text default '';");
  await query("alter table article_drafts add column if not exists image_license_note text default '';");
  await query('alter table published_articles add column if not exists image jsonb;');
  await query("alter table published_articles add column if not exists image_credit text default '';");
  await query("alter table published_articles add column if not exists image_license_note text default '';");

  await query('create index if not exists idx_article_drafts_created_at on article_drafts (created_at desc);');
  await query('create index if not exists idx_published_articles_published_at on published_articles (published_at desc);');
  await query('create index if not exists idx_source_queue_created_at on source_queue (created_at desc);');
}

export function rowToDraft(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    body: row.body,
    sources: row.sources || [],
    image: row.image || null,
    imageCredit: row.image_credit || '',
    imageLicenseNote: row.image_license_note || '',
    tone: row.tone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPublishedArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    body: row.body,
    sources: row.sources || [],
    image: row.image || null,
    imageCredit: row.image_credit || '',
    imageLicenseNote: row.image_license_note || '',
    tone: row.tone,
    status: row.status,
    approvalNote: row.approval_note,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function rowToQueuedSource(row) {
  return {
    id: row.id,
    url: row.url,
    category: row.category,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}
