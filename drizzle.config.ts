import type { Config } from 'drizzle-kit';

export default {
  schema:  './src/db/schema/*',
  out:     './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false }, // Requerido por Supabase
  },
} satisfies Config;
