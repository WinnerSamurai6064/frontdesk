import fs from 'node:fs/promises';
import path from 'node:path';
import filestack from 'filestack-js';
import { hasDatabase, pool, query, initDatabase } from '../mcp/db.js';

const FILESTACK_API_KEY = process.env.FILESTACK_API_KEY || '';
const BACKUP_DIR = process.env.FRONTDESK_BACKUP_DIR || '/opt/frontdesk/backups';

if (!FILESTACK_API_KEY) {
  console.error('Missing FILESTACK_API_KEY.');
  process.exit(1);
}

if (!hasDatabase) {
  console.error('Missing DATABASE_URL or AIVEN_DATABASE_URL. Point it to local Postgres or any Postgres service.');
  process.exit(1);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function table(name) {
  const result = await query(`select * from ${name}`);
  return result.rows;
}

async function uploadJson({ filename, json }) {
  const client = filestack.init(FILESTACK_API_KEY);
  const body = JSON.stringify(json, null, 2);
  const blob = new Blob([body], { type: 'application/json' });

  const uploaded = await client.upload(blob, {}, {
    filename,
    mimetype: 'application/json',
    path: 'frontdesk/database/',
  });

  return {
    handle: uploaded.handle,
    url: uploaded.url || `https://cdn.filestackcontent.com/${uploaded.handle}`,
    filename: uploaded.filename || filename,
    size: uploaded.size || body.length,
    uploadedAt: new Date().toISOString(),
  };
}

try {
  await initDatabase();
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const snapshot = {
    name: 'FrontDesk database snapshot',
    exportedAt: new Date().toISOString(),
    version: 1,
    tables: {
      source_queue: await table('source_queue'),
      article_drafts: await table('article_drafts'),
      published_articles: await table('published_articles'),
    },
  };

  snapshot.counts = {
    source_queue: snapshot.tables.source_queue.length,
    article_drafts: snapshot.tables.article_drafts.length,
    published_articles: snapshot.tables.published_articles.length,
  };

  const datedName = `frontdesk-db-${stamp()}.json`;
  const latestName = 'frontdesk-db-latest.json';

  await fs.writeFile(path.join(BACKUP_DIR, datedName), JSON.stringify(snapshot, null, 2));
  await fs.writeFile(path.join(BACKUP_DIR, latestName), JSON.stringify(snapshot, null, 2));

  const datedUpload = await uploadJson({ filename: datedName, json: snapshot });
  const latestUpload = await uploadJson({ filename: latestName, json: snapshot });

  const manifest = {
    exportedAt: snapshot.exportedAt,
    counts: snapshot.counts,
    datedUpload,
    latestUpload,
  };

  await fs.writeFile(path.join(BACKUP_DIR, 'filestack-latest-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify(manifest, null, 2));
} catch (error) {
  console.error('FrontDesk Filestack backup failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool?.end();
}
