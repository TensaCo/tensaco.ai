export interface Env {
  DB: D1Database
  RESUMES: R2Bucket
  ASSETS: Fetcher
  IP_SALT?: string
  RESEND_API_KEY?: string // Worker secret
  EMAIL_FROM?: string
  EMAIL_REPLY_TO?: string
  STAFF_EMAIL?: string
  ACCOUNT_URL?: string
}

export const accountUrl = (env: Env) => (env.ACCOUNT_URL || 'https://account.tensaco.ai').replace(/\/$/, '')
