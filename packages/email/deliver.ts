// Send an email and record the outcome in D1 `email_log` (Resend's id or the error). Workers pass their
// ExecutionContext so the send finishes after the response is returned.
import { db, emailLog } from '@tensaco/db'
import { sendEmail, type EmailEnv, type SendResult } from './send'

export type DeliverEnv = EmailEnv & { DB: D1Database }
type Rendered = { subject: string; html: string; text: string }

export async function deliverNow(env: DeliverEnv, kind: string, to: string, email: Rendered, replyTo?: string): Promise<SendResult> {
  const result = await sendEmail(env, { to, ...email, replyTo })
  if (!result.ok) console.error(`email ${kind} to ${to} failed: ${result.error}`)
  try {
    await db(env.DB).insert(emailLog).values({
      kind, to, subject: email.subject.slice(0, 300), providerId: result.ok ? result.id : null, error: result.ok ? null : result.error,
    })
  } catch (e) { console.error('email_log insert failed', e) }
  return result
}

/** Fire-and-forget: queue the send on the request's context. */
export function deliver(env: DeliverEnv, ctx: { waitUntil(p: Promise<unknown>): void }, kind: string, to: string, email: Rendered, replyTo?: string) {
  ctx.waitUntil(deliverNow(env, kind, to, email, replyTo))
}
