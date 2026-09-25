// Accounts live at account.tensaco.ai (apps/account). Its session cookie is scoped to .tensaco.ai, so tensaco.ai can
// see who is signed in; this site only reads it (to link a job application to the applicant's account).
import { db, sessions, users } from '@tensaco/db'
import { and, eq, gt, sql } from 'drizzle-orm'
import type { Env } from './env'
import { sha256 } from './lib'

/** The signed-in user's id and email for this request, or null. */
export async function currentUser(request: Request, env: Env): Promise<{ id: number; email: string } | null> {
  const token = /(?:^|;\s*)tc_session=([0-9a-f]{64})/.exec(request.headers.get('cookie') ?? '')?.[1]
  if (!token) return null
  const [row] = await db(env.DB).select({ id: users.id, email: users.email })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, await sha256(token)), gt(sessions.expiresAt, sql`datetime('now')`)))
  return row ?? null
}
