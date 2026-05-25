import { ensureSchema, requireDb, rowToArticle } from './_db.js';
import { requireAdmin, sendError } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await ensureSchema();
    const db = requireDb();
    const id = req.query.id;

    if (!id) return res.status(400).json({ error: 'id is required.' });

    if (req.method === 'GET') {
      const rows = await db`select * from published_articles where id = ${id} limit 1`;
      if (!rows[0]) return res.status(404).json({ error: 'Article not found.' });
      return res.status(200).json({ article: rowToArticle(rows[0]) });
    }

    requireAdmin(req);

    if (req.method === 'PUT') {
      const body = req.body || {};
      const rows = await db`
        update published_articles
        set title = ${body.title},
            category = ${body.category},
            summary = ${body.summary},
            body = ${body.body},
            sources = ${JSON.stringify(Array.isArray(body.sources) ? body.sources : [])}::jsonb,
            image = ${JSON.stringify(body.image || null)}::jsonb,
            image_credit = ${body.imageCredit || ''},
            image_license_note = ${body.imageLicenseNote || ''},
            tone = ${body.tone || 'neutral, clear, modern news desk'},
            updated_at = now()
        where id = ${id}
        returning *
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Article not found.' });
      return res.status(200).json({ article: rowToArticle(rows[0]) });
    }

    if (req.method === 'DELETE') {
      await db`delete from published_articles where id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return sendError(res, error);
  }
}
