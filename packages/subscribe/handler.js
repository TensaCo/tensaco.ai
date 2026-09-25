// POST /api/subscribe — shared by every TensaCo site's Worker. Collects an email into D1 (binding DB).
// Body: JSON { email, source?, company? }. `company` is a honeypot: humans never see it, bots fill it in.
// Always answers the same way for new and existing addresses, so the endpoint can't be used to test who is subscribed.

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const PER_IP_PER_HOUR = 5

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function subscribe(request, env, arm) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)
  // same-origin only: browsers send Origin on cross-site POSTs
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'Forbidden.' }, 403)

  let body
  try { body = await request.json() } catch { return json({ ok: false, error: 'Bad request.' }, 400) }
  if (body && body.company) return json({ ok: true }) // honeypot: pretend it worked
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
  const source = String(body?.source ?? '').slice(0, 80) || null

  const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') ?? ''}:${env.IP_SALT ?? 'tensaco'}`)
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM subscribers WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')",
  ).bind(ipHash).first('n')
  if (recent >= PER_IP_PER_HOUR) return json({ ok: false, error: 'Too many sign-ups from your network. Please try again later.' }, 429)

  await env.DB.prepare(
    `INSERT INTO subscribers (email, arm, source, country, ip_hash, unsubscribe_token)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (email, arm) DO UPDATE SET status = 'subscribed'`,
  ).bind(email, arm, source, request.cf?.country ?? null, ipHash, crypto.randomUUID()).run()
  return json({ ok: true })
}
