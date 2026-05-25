import { ensureSchema, requireDb } from './_db.js';
import { requireAdmin, sendError } from './_auth.js';

const DEFAULT_SETTINGS = {
  footerTitle: 'FrontDesk',
  footerText: 'Daily Nigerian, international, technology, urban lifestyle and entertainment news.',
  footerNote: 'Built for fast mobile reading.',
  contactEmail: '',
  whatsapp: '',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await ensureSchema();
    const db = requireDb();

    if (req.method === 'GET') {
      const rows = await db`select value from site_settings where key = 'site' limit 1`;
      return res.status(200).json({ settings: { ...DEFAULT_SETTINGS, ...(rows[0]?.value || {}) } });
    }

    if (req.method === 'PUT') {
      requireAdmin(req);
      const settings = { ...DEFAULT_SETTINGS, ...(req.body || {}) };

      const rows = await db`
        insert into site_settings (key, value, updated_at)
        values ('site', ${JSON.stringify(settings)}::jsonb, now())
        on conflict (key)
        do update set value = excluded.value, updated_at = now()
        returning value
      `;

      return res.status(200).json({ settings: rows[0].value });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return sendError(res, error);
  }
}
