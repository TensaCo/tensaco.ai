// Queue an email on the request context and log it to D1 email_log (packages/email).
import { deliver } from '@tensaco/email'
import type { Env } from './env'

export const mail = (env: Env, ctx: ExecutionContext, kind: string, to: string, email: { subject: string; html: string; text: string }, replyTo?: string) =>
  deliver(env, ctx, kind, to, email, replyTo)
