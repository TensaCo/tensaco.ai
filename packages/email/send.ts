// Transactional email through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email), over fetch so it
// runs in any Worker. Never throws: the result says whether Resend accepted the message and gives its id.

export type EmailEnv = {
  RESEND_API_KEY?: string // Worker secret
  EMAIL_FROM?: string // "TensaCo <no-reply@tensaco.ai>"
  EMAIL_REPLY_TO?: string // hello@tensaco.ai
}

export type Message = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Resend de-duplicates sends with the same key for 24 h. */
  idempotencyKey?: string
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string }

export async function sendEmail(env: EmailEnv, m: Message): Promise<SendResult> {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY is not set' }
  const headers: Record<string, string> = { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }
  if (m.idempotencyKey) headers['idempotency-key'] = m.idempotencyKey.slice(0, 256)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'TensaCo <no-reply@tensaco.ai>',
        to: Array.isArray(m.to) ? m.to : [m.to],
        reply_to: m.replyTo ?? env.EMAIL_REPLY_TO ?? undefined,
        subject: m.subject,
        html: m.html,
        text: m.text,
      }),
    })
    const data = (await r.json().catch(() => ({}))) as { id?: string; message?: string; name?: string }
    if (r.ok && data.id) return { ok: true, id: data.id }
    return { ok: false, error: `${r.status} ${data.name ?? ''} ${data.message ?? ''}`.trim().slice(0, 500) }
  } catch (e) {
    return { ok: false, error: `fetch failed: ${String(e)}`.slice(0, 500) }
  }
}
