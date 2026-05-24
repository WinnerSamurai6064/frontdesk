import filestack from 'filestack-js';

const FILESTACK_API_KEY = process.env.FILESTACK_API_KEY || '';

export const hasFilestack = Boolean(FILESTACK_API_KEY);

export function getFilestackClient() {
  if (!hasFilestack) {
    throw new Error('Filestack is not configured. Set FILESTACK_API_KEY.');
  }

  return filestack.init(FILESTACK_API_KEY);
}

export async function storeImageUrl({ imageUrl, filename, metadata = {} }) {
  if (!/^https:\/\//i.test(imageUrl)) {
    throw new Error('Only public HTTPS image URLs can be stored.');
  }

  const client = getFilestackClient();
  const result = await client.storeURL(imageUrl, {
    filename,
    location: 's3',
    path: `frontdesk/${new Date().toISOString().slice(0, 10)}/`,
    workflows: [],
  });

  return {
    handle: result.handle,
    url: result.url || `https://cdn.filestackcontent.com/${result.handle}`,
    filename: result.filename || filename,
    mimetype: result.mimetype,
    size: result.size,
    uploadedAt: new Date().toISOString(),
    metadata,
  };
}
