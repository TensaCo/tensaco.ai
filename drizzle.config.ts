// Drizzle Kit: the schema in packages/db/schema.ts generates SQL migrations into migrations/.
//   npm run db:generate       write a new migration after changing the schema
//   npm run db:migrate:local  apply to the local D1 used by `wrangler dev`
//   npm run db:migrate:remote apply to the production D1 (tensaco-subscribers)
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './packages/db/schema.ts',
  out: './migrations',
})
