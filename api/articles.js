import { ensureSchema, makeSlug, requireDb, rowToArticle } from './_db.js';
import { requireAdmin, sendError } from './_auth.js';

function makeId() {
  return `article_${Date.now()}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await ensureSchema();
    const db = requireDb();

    if (req.method === 'GET') {
      const rows = await db`
        select * from published_articles
        order by published_at desc
        limit 100
      `;
      return res.status(200).json({ articles: rows.map(rowToArticle) });
    }

    if (req.method === 'POST') {
      requireAdmin(req);
      const body = req.body || {};
      const title = String(body.title || '').trim();
      const category = String(body.category || 'Daily Brief').trim();
      const summary = String(body.summary || '').trim();
      const articleBody = String(body.body || '').trim();

      if (!title || !summary || !articleBody) {
        return res.status(400).json({ error: 'title, summary and body are required.' });
      }

      const id = body.id || makeId();
      const slug = body.slug || makeSlug(title);
      const sources = Array.isArray(body.sources) ? body.sources : [];
      const image = body.image || null;
      const imageCredit = body.imageCredit || '';
      const imageLicenseNote = body.imageLicenseNote || '';
      const tone = body.tone || 'neutral, clear, modern news desk';
      const approvalNote = body.approvalNote || 'CMS publish';

      const rows = await db`
        insert into published_articles
          (id, slug, title, category, summary, body, sources, image, image_credit, image_license_note, tone, status, approval_note)
        values
          (${id}, ${slug}, ${title}, ${category}, ${summary}, ${articleBody}, ${JSON.stringify(sources)}::jsonb, ${JSON.stringify(image)}::jsonb, ${imageCredit}, ${imageLicenseNote}, ${tone}, 'published', ${approvalNote})
        returning *
      `;

      return res.status(201).json({ article: rowToArticle(rows[0]) });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return sendError(res, error);
  }
}
