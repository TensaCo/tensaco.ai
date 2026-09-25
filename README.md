# tensaco.ai

The websites of **TensaCo Inc.** and its companies. Each company presents as its own product and brand; they share only
infrastructure (Cloudflare Workers, one D1 subscriber database).

| app | URL | what |
|---|---|---|
| `apps/tensaco` | https://tensaco.ai (www → apex) | the parent company: mission, values, companies, investors, updates |
| `apps/phaser` | https://phaser.tensaco.ai | PHASER, the optical neural accelerator: launch page, blog, subscribe |
| `apps/tensorcode-alias` | https://tensorcode.tensaco.ai | 301 → https://tensorcode.dev (TensorCode's site lives in [TensaCo/tensacode](https://github.com/TensaCo/tensacode)) |
| `packages/subscribe` | `/api/subscribe` on every site | shared email-capture handler (D1 `tensaco-subscribers`, one row per email per company) |
| `migrations/` | | D1 schema |

## Develop and deploy

```bash
cd apps/phaser          # or apps/tensaco
npm install
npm run dev             # Next.js dev server (pages only; /api needs the Worker)
npm run preview         # build + wrangler dev: pages and /api/subscribe against a local D1
npm run deploy          # build + wrangler deploy (Cloudflare account jacobfv123@gmail.com)
```

First local run of the API: `npx wrangler d1 migrations apply tensaco-subscribers --local` in the app folder.

## Subscribers

```bash
npx wrangler d1 execute tensaco-subscribers --remote --command "SELECT email, arm, source, created_at FROM subscribers WHERE status = 'subscribed' ORDER BY created_at"
```

Nothing sends email yet; the list is collected for later.

## Blog posts (PHASER)

Markdown/MDX in `apps/phaser/content/posts/`. Front matter: `title`, `date`, `summary`, optional `hero`, and `source`
(the original URL when a post is copied from elsewhere; it becomes the canonical URL and the "copied from" line).
MDX components are not executed; supported ones are listed in `EMBEDS` in `src/lib/posts.ts`.
