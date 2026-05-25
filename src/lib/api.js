const API_BASE_URL = '';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80';

function imageUrl(article) {
  if (typeof article.image === 'string' && article.image.length > 0) return article.image;
  if (article.image && article.image.url) return article.image.url;
  if (article.image && article.image.cdnUrl) return article.image.cdnUrl;
  return FALLBACK_IMAGE;
}

function readTime(body) {
  const words = String(body || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(words / 220));
  return minutes + ' min read';
}

export function normalizeArticle(article) {
  return {
    id: article.id || article.slug || article.title,
    title: article.title || 'Untitled FrontDesk story',
    category: article.category || 'Daily Brief',
    summary: article.summary || String(article.body || '').slice(0, 180) || 'FrontDesk update.',
    body: article.body || '',
    sources: article.sources || [],
    image: imageUrl(article),
    rawImage: article.image || null,
    imageCredit: article.imageCredit || article.image_credit || '',
    imageLicenseNote: article.imageLicenseNote || article.image_license_note || '',
    readTime: article.readTime || readTime(article.body),
    tag: article.tag || article.category || 'FrontDesk',
    tone: article.tone || 'neutral, clear, modern news desk',
    publishedAt: article.publishedAt || article.published_at || article.updatedAt || article.updated_at || null,
  };
}

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'FrontDesk API failed with ' + response.status);
  return payload;
}

export async function fetchPublishedArticles() {
  const response = await fetch(API_BASE_URL + '/api/articles', {
    headers: { Accept: 'application/json' },
  });

  const payload = await parseJson(response);
  return (payload.articles || []).map(normalizeArticle);
}

export async function createArticle(article, adminToken) {
  const response = await fetch(API_BASE_URL + '/api/articles', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminToken,
    },
    body: JSON.stringify(article),
  });

  const payload = await parseJson(response);
  return normalizeArticle(payload.article);
}

export async function updateArticle(id, article, adminToken) {
  const response = await fetch(API_BASE_URL + '/api/article?id=' + encodeURIComponent(id), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminToken,
    },
    body: JSON.stringify(article),
  });

  const payload = await parseJson(response);
  return normalizeArticle(payload.article);
}

export async function deleteArticle(id, adminToken) {
  const response = await fetch(API_BASE_URL + '/api/article?id=' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + adminToken,
    },
  });

  return parseJson(response);
}

export async function fetchSiteSettings() {
  const response = await fetch(API_BASE_URL + '/api/settings', {
    headers: { Accept: 'application/json' },
  });

  const payload = await parseJson(response);
  return payload.settings;
}

export async function updateSiteSettings(settings, adminToken) {
  const response = await fetch(API_BASE_URL + '/api/settings', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminToken,
    },
    body: JSON.stringify(settings),
  });

  const payload = await parseJson(response);
  return payload.settings;
}

export { API_BASE_URL };
