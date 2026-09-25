# Status — where we left off (2026-09-25)

## Live
- https://tensaco.ai (www → apex) — `apps/tensaco`: corporate site (home, solutions ×3, company, leadership, careers,
  investors, newsroom, contact, privacy)
- https://account.tensaco.ai — `apps/account` (Worker `tensaco-account`): sign-in/sign-up, email verification, password
  reset, customer portal, staff views. tensaco.ai `/login/`, `/signup/`, `/account/*` 301 there. Verified end to end in
  production on 2026-09-25 (test rows deleted afterwards).
- Email: Resend, domain tensaco.ai verified; `RESEND_API_KEY` is a Worker secret on `tensaco-account` and `tensaco-site`.
  Verification, password reset/changed, support replies, request/application status, application confirmation, and
  staff notifications to hello@tensaco.ai. Log: D1 `email_log`. See README → Email.
- https://phaser.tensaco.ai — `apps/phaser` (launch page, blog with the PHASER post copied from jvboid.dev, subscribe)
- https://tensorcode.tensaco.ai → 301 https://tensorcode.dev — `apps/tensorcode-alias` (TensorCode itself: TensaCo/tensacode)
- `/api/subscribe` on tensaco.ai and phaser.tensaco.ai → D1 `tensaco-subscribers` (collect only; empty as of this note)
- Contact: hello@tensaco.ai (mail for tensaco.ai is Google Workspace; the mailbox/alias must exist there)

## Open
1. **Deploy-on-push token.** `.github/workflows/deploy.yml` skips deploys until the repo secret exists:
   Cloudflare → My Profile → API Tokens → "Edit Cloudflare Workers" template, scoped to account 20d4becc… and zone
   tensaco.ai, plus Account · D1 · Edit. Then `gh secret set CLOUDFLARE_API_TOKEN -R TensaCo/tensaco.ai`.
2. **Email — transactional done (2026-09-25); newsletter not started.** Resend sends every account and careers email
   (README → Email). Still open for the subscriber list:
   - double opt-in for `/api/subscribe` (confirmation email; only confirmed rows count);
   - `/api/unsubscribe?token=…` + `List-Unsubscribe` / one-click headers, and a send script (Markdown update →
     confirmed subscribers of one arm);
   - a DMARC record at `_dmarc.tensaco.ai` (start `p=none`) if Resend's domain setup didn't add one — DNS changes are
     made by the user or with explicit approval.
3. **tensaco.ai negative DNS cache** after the old A records were deleted (SOA negative TTL 1800 s): cleared by ~19:05 PDT
   2026-09-24. Nothing to do unless a resolver still misses it (flush at developers.google.com/speed/public-dns/cache).

## Also open
- Make Jacob’s account staff: jacob@commandagi.com exists (customer, unverified; sessions from before the move to
  account.tensaco.ai no longer apply, so sign in again at https://account.tensaco.ai/login/). Command in README →
  “Accounts and the customer portal”.
- Job locations in `apps/tensaco/src/data/jobs.ts` are placeholders (“Remote (United States)”, “On-site / hybrid
  (United States)”); set real ones.
- Legal pages: have counsel review; Terms say governing law is the state of incorporation, fill in once confirmed.
- Leadership page uses Jacob’s jvboid.dev photo (casual, cap); replace `apps/tensaco/public/media/people/jacob-valdez.jpg`
  with a professional headshot (4:5).
- Stock gaps: no licensed video of an engineer in a data center or of an optics lab; photos cover both.

## Nice to have
- RSS for the PHASER blog; per-post share images; favicons; Cloudflare Web Analytics.
- About/team, careers pages on tensaco.ai when ready.
