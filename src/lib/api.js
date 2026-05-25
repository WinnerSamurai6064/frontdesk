const API_BASE_URL = 'https://frontdesk.kje.us';

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
    imageCredit: article.imageCredit || article.image_credit || '',
    imageLicenseNote: article.imageLicenseNote || article.image_license_note || '',
    readTime: article.readTime || readTime(article.body),
    tag: article.tag || article.category || 'FrontDesk',
    publishedAt: article.publishedAt || article.published_at || article.updatedAt || article.updated_at || null,
  };
}

export async function fetchPublishedArticles() {
  const response = await fetch(API_BASE_URL + '/api/articles', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('FrontDesk API failed with ' + response.status);

  const payload = await response.json();
  return (payload.articles || []).map(normalizeArticle);
}

export { API_BASE_URL };
