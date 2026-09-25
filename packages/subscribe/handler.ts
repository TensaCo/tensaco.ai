// POST /api/subscribe — shared by every TensaCo site's Worker. Collects an email into D1 (binding DB).
// Body: JSON { email, source?, company? }. `company` is a honeypot: humans never see it, bots fill it in.
// Answers the same way for new and existing addresses, so the endpoint can't be used to test who is subscribed.
import { db, subscribers } from '@tensaco/db'
import { and, count, eq, gt, sql } from 'drizzle-orm'

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const PER_IP_PER_HOUR = 5

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function subscribe(request: Request, env: { DB: D1Database; IP_SALT?: string }, arm: string) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'Forbidden.' }, 403)

  let body: { email?: unknown; source?: unknown; company?: unknown } | null
  try { body = await request.json() } catch { return json({ ok: false, error: 'Bad request.' }, 400) }
  if (body?.company) return json({ ok: true }) // honeypot: pretend it worked
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
  const source = String(body?.source ?? '').slice(0, 80) || null

  const d = db(env.DB)
  const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') ?? ''}:${env.IP_SALT ?? 'tensaco'}`)
  const [{ n }] = await d.select({ n: count() }).from(subscribers)
    .where(and(eq(subscribers.ipHash, ipHash), gt(subscribers.createdAt, sql`datetime('now', '-1 hour')`)))
  if (n >= PER_IP_PER_HOUR) return json({ ok: false, error: 'Too many sign-ups from your network. Please try again later.' }, 429)

  const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? null
  await d.insert(subscribers)
    .values({ email, arm, source, country, ipHash, unsubscribeToken: crypto.randomUUID() })
    .onConflictDoUpdate({ target: [subscribers.email, subscribers.arm], set: { status: 'subscribed' } })
  return json({ ok: true })
}
