export interface Env {
  DB: D1Database
  RESUMES: R2Bucket
  ASSETS: Fetcher
  IP_SALT?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  EMAIL_REPLY_TO?: string
  STAFF_EMAIL?: string
  ACCOUNT_URL?: string
  SITE_URL?: string
  /** ".tensaco.ai" in production so tensaco.ai sees the session; empty locally (host-only cookie). */
  COOKIE_DOMAIN?: string
}

export const accountUrl = (env: Env) => (env.ACCOUNT_URL || 'https://account.tensaco.ai').replace(/\/$/, '')
export const staffEmail = (env: Env) => env.STAFF_EMAIL || 'hello@tensaco.ai'
