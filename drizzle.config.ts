import { defineConfig } from 'drizzle-kit';

// SQLite dialect for Cloudflare D1. `drizzle-kit generate` emits SQL into
// drizzle/migrations, which is also wrangler.jsonc's `migrations_dir`, so the same files
// are applied to local D1 with `wrangler d1 migrations apply control --local`.
export default defineConfig({
	dialect: 'sqlite',
	schema: ['./src/lib/server/db/auth-schema.ts', './src/lib/server/db/registry-schema.ts'],
	out: './drizzle/migrations'
});
