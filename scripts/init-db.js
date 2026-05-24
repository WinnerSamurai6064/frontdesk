import { initDatabase, hasDatabase, pool } from '../mcp/db.js';

if (!hasDatabase) {
  console.error('Missing AIVEN_DATABASE_URL or DATABASE_URL. Add your Aiven Postgres connection string first.');
  process.exit(1);
}

try {
  await initDatabase();
  console.log('FrontDesk database tables are ready.');
} catch (error) {
  console.error('Database initialization failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool?.end();
}
