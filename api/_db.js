import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('Missing NEON_DATABASE_URL, DATABASE_URL, or AIVEN_DATABASE_URL.');
}

export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export function requireDb() {
  if (!sql) {
    const error = new Error('Database is not configured. Add NEON_DATABASE_URL or DATABASE_URL in Vercel environment variables.');
    error.statusCode = 500;
    throw error;
  }
  return sql;
}

export async function ensureSchema() {
  const db = requireDb();

  await db`
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
      approval_note text not null default 'CMS publish',
      published_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await db`
    create table if not exists site_settings (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;

  await db`
    create index if not exists idx_published_articles_published_at on published_articles (published_at desc)
  `;
}

export function rowToArticle(row) {
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

export function makeSlug(title) {
  return String(title || 'frontdesk-story')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 90) || `story-${Date.now()}`;
}
