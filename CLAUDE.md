# CLAUDE.md

Websites for TensaCo Inc. and its companies (see README.md for the map).

## Git workflow

- Work and commit directly on `main`. Don't create feature branches or PRs unless asked.
- Pushing to `main` deploys the apps whose files changed (`.github/workflows/deploy.yml`, secret
  `CLOUDFLARE_API_TOKEN`). By hand: `npm run deploy` in an app.

## Brands stay separate

- Each company is presented as a self-contained product with its own audience and visual identity. Don't share
  components or styles across apps; share only infrastructure (`packages/subscribe`, D1).
- TensaCo (parent): a serious corporate site. Navy and white, Inter, full-bleed stock photography and video of people
  and industry (licensed, credited in `apps/tensaco/public/media/credits.json`). No line art, 3D renders or startup tone.
  Never invent quotes, customers or endorsements. The team is Jacob (founder, human) plus TensaCo's AI agents
  (`team/`, one folder per agent: profile.yml + images); every agent carries a visible "AI agent" badge wherever a
  profile appears, and bios never invent prior employers, degrees or awards. Traction figures on /investors are real
  (zeros included) and dated.
- Legal entity: TENSACO INC, a Delaware corporation (governing law Delaware). Office: San Francisco, CA — publish the
  city only, not the street address.
- PHASER: darkroom, 650 nm red, Archivo + IBM Plex Mono. Its art direction is `apps/phaser/VISUAL_BIBLE.md`.
- TensorCode: canonical at tensorcode.dev, built in the TensaCo/tensacode repo. `tensorcode.tensaco.ai` only redirects.

## Database

- Drizzle ORM over D1. The schema is `packages/db/schema.ts`; migrations in `migrations/` are generated with
  `npm run db:generate`, never hand-written. Worker code queries through `db()` from `@tensaco/db`, not raw SQL.

## Cloudflare

- Account `20d4becc35c40a0bbfb8803a525aaae1` (jacobfv123@gmail.com). Zones `tensaco.ai` and `tensorcode.dev`.
- Hostnames are Worker custom domains (Cloudflare manages their DNS records). Wrangler's OAuth login cannot edit DNS;
  ask the user before any DNS change.
- D1 `tensaco-subscribers` (`888cd573-e771-4a12-9834-b7fe800eaf2a`); R2 `tensaco-careers` (résumés).

## Claims

- PHASER energy and throughput figures are modeled (research: TensaCo/phaser-design, Exp. 29). Keep the "modeled" caveat
  next to them and never quote 1e6×.
