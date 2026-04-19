import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set — did you create .env.local?');

const drizzleConfig = defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
});

export default drizzleConfig;
