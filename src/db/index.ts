import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlConnection = postgres(databaseUrl);

export const db = drizzle({ client: sqlConnection, schema, casing: 'snake_case' });
