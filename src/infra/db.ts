import { drizzle } from 'drizzle-orm/postgres-js';
import { headers } from 'next/headers';
import postgres from 'postgres';

import * as schema from '@/db/schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const demoDatabaseUrl = process.env.DATABASE_URL_DEMO;
if (!demoDatabaseUrl) {
  throw new Error('DATABASE_URL_DEMO is not set');
}

const sqlConnection = postgres(databaseUrl);
export const db = drizzle({ client: sqlConnection, schema, casing: 'snake_case' });

const sqlConnectionDemo = postgres(demoDatabaseUrl);
export const dbDemo = drizzle({ client: sqlConnectionDemo, schema, casing: 'snake_case' });

export async function getCurrentDb() {
  const headerList = await headers();
  const isDemo = headerList.get('x-demo-mode') === 'true';
  return isDemo ? dbDemo : db;
}

export type Db = typeof db;
