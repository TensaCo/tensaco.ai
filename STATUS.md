# Status — where we left off (2026-09-25)

## Live
- https://tensaco.ai (www → apex) — `apps/tensaco`: corporate site (home, solutions ×3, company, leadership, careers,
  investors, newsroom, contact, privacy)
- https://phaser.tensaco.ai — `apps/phaser` (launch page, blog with the PHASER post copied from jvboid.dev, subscribe)
- https://tensorcode.tensaco.ai → 301 https://tensorcode.dev — `apps/tensorcode-alias` (TensorCode itself: TensaCo/tensacode)
- `/api/subscribe` on tensaco.ai and phaser.tensaco.ai → D1 `tensaco-subscribers` (collect only; empty as of this note)
- Contact: hello@tensaco.ai (mail for tensaco.ai is Google Workspace; the mailbox/alias must exist there)

## Open
1. **Deploy-on-push token.** `.github/workflows/deploy.yml` skips deploys until the repo secret exists:
   Cloudflare → My Profile → API Tokens → "Edit Cloudflare Workers" template, scoped to account 20d4becc… and zone
   tensaco.ai, plus Account · D1 · Edit. Then `gh secret set CLOUDFLARE_API_TOKEN -R TensaCo/tensaco.ai`.
2. **Sending email (not started; decision pending).** Cloudflare Email Service is transactional-only (no newsletters)
   and needs Workers Paid, so the plan is one marketing-capable provider (recommended: Resend; alternatives Loops,
   Buttondown):
   - D1 stays the source of truth; add double opt-in (confirmation email from the Worker; only confirmed rows count).
   - `/api/unsubscribe?token=…` + `List-Unsubscribe` / one-click headers on every message.
   - A send script: Markdown update → confirmed subscribers of one arm (or all).
   - Needs from the user: provider account + verified domain, approval of its DNS records (DKIM; SPF + MX on a sending
     subdomain such as `send.tensaco.ai`), a DMARC record at `_dmarc.tensaco.ai` (none exists; start `p=none`), and
     `gh secret set RESEND_API_KEY -R TensaCo/tensaco.ai` (also a Worker secret).
   - DNS changes are made by the user or with explicit approval — wrangler's login cannot edit DNS.
3. **tensaco.ai negative DNS cache** after the old A records were deleted (SOA negative TTL 1800 s): cleared by ~19:05 PDT
   2026-09-24. Nothing to do unless a resolver still misses it (flush at developers.google.com/speed/public-dns/cache).

## Also open
- Make Jacob’s account staff after he signs up (README: “tensaco.ai accounts”).
- Job locations in `apps/tensaco/src/data/jobs.ts` are placeholders (“Remote (United States)”, “On-site / hybrid
  (United States)”); set real ones.
- Legal pages: have counsel review; Terms say governing law is the state of incorporation, fill in once confirmed.
- Password reset needs email sending (item 2).
- Leadership page uses Jacob’s jvboid.dev photo (casual, cap); replace `apps/tensaco/public/media/people/jacob-valdez.jpg`
  with a professional headshot (4:5).
- Stock gaps: no licensed video of an engineer in a data center or of an optics lab; photos cover both.

## Nice to have
- RSS for the PHASER blog; per-post share images; favicons; Cloudflare Web Analytics.
- About/team, careers pages on tensaco.ai when ready.
