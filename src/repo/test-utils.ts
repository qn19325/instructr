import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '@/db/schema';

import type { DbOrTx } from '.';

export function createTestDb() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST is not set');
  const sql = postgres(url);
  const db = drizzle({ client: sql, schema, casing: 'snake_case' });
  return { db, sql };
}

export async function clearDB(database: DbOrTx) {
  await database.delete(schema.document);
  await database.delete(schema.checklistItem);
  await database.delete(schema.r2PendingDelete);
  await database.delete(schema.mtdSubmission);
  await database.delete(schema.taxReturn);
  await database.delete(schema.client);
  await database.delete(schema.practice);
}
