export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

export function requireAdmin(req) {
  const expected = process.env.FRONTDESK_ADMIN_TOKEN || process.env.FRONTDESK_EDITOR_TOKEN || '';
  if (!expected) {
    const error = new Error('Admin token is not configured. Add FRONTDESK_ADMIN_TOKEN in Vercel environment variables.');
    error.statusCode = 500;
    throw error;
  }

  const token = getBearerToken(req);
  if (token !== expected) {
    const error = new Error('Unauthorized. Invalid admin token.');
    error.statusCode = 401;
    throw error;
  }
}

export function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({ error: error.message || 'Server error' });
}
