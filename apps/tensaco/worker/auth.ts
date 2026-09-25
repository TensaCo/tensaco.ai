// Accounts: sign up, log in, log out, current user. Passwords are PBKDF2-SHA256 with a per-user salt; sessions are
// random 32-byte tokens in an HttpOnly cookie, stored only as their SHA-256.
import { db, sessions, users } from '@tensaco/db'
import { and, eq, gt, sql } from 'drizzle-orm'
import type { Env } from './env'
import { allow, b64, clean, EMAIL, ipHash, json, readJson, sameOrigin, sha256, unb64 } from './lib'

const ITERATIONS = 100000 // the Workers runtime's PBKDF2 maximum
const COOKIE = 'tc_session'
const DAYS = 30

export type User = { id: number; email: string; name: string; role: string; organization: string | null; createdAt: string }

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
}

function equal(a: ArrayBuffer | Uint8Array, b: ArrayBuffer | Uint8Array) {
  const x = new Uint8Array(a), y = new Uint8Array(b)
  if (x.length !== y.length) return false
  let d = 0
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]
  return d === 0
}

const cookie = (value: string, maxAge: number) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
const tokenFrom = (request: Request) => /(?:^|;\s*)tc_session=([0-9a-f]{64})/.exec(request.headers.get('cookie') ?? '')?.[1]

async function startSession(request: Request, env: Env, userId: number) {
  const raw = new Uint8Array(32)
  crypto.getRandomValues(raw)
  const token = [...raw].map((b) => b.toString(16).padStart(2, '0')).join('')
  const d = db(env.DB)
  await d.insert(sessions).values({
    tokenHash: await sha256(token), userId, expiresAt: sql`datetime('now', ${`+${DAYS} days`})` as unknown as string,
    ipHash: await ipHash(request, env), userAgent: clean(request.headers.get('user-agent'), 200),
  })
  await d.update(users).set({ lastLoginAt: sql`datetime('now')` as unknown as string }).where(eq(users.id, userId))
  return cookie(token, DAYS * 86400)
}

/** The signed-in user for this request, or null. */
export async function currentUser(request: Request, env: Env): Promise<User | null> {
  const token = tokenFrom(request)
  if (!token) return null
  const [row] = await db(env.DB)
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, organization: users.organization, createdAt: users.createdAt })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, await sha256(token)), gt(sessions.expiresAt, sql`datetime('now')`)))
  return row ?? null
}

export async function auth(request: Request, env: Env, action: string) {
  if (action === 'me') {
    const user = await currentUser(request, env)
    return user ? json({ user }) : json({ user: null }, 401)
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403)
  const d = db(env.DB)

  if (action === 'logout') {
    const token = tokenFrom(request)
    if (token) await d.delete(sessions).where(eq(sessions.tokenHash, await sha256(token)))
    return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) })
  }

  const b = await readJson<{ name?: string; email?: string; password?: string; organization?: string; company?: string }>(request)
  if (!b) return json({ ok: false, error: 'Bad request.' }, 400)
  const email = clean(b.email, 254).toLowerCase()
  const password = String(b.password ?? '')
  const hash = await ipHash(request, env)

  if (action === 'signup') {
    if (b.company) return json({ ok: true }) // honeypot
    const name = clean(b.name, 120)
    if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400)
    if (!EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
    if (password.length < 10 || password.length > 200) return json({ ok: false, error: 'Use a password of at least 10 characters.' }, 400)
    if (!(await allow(env, 'signup', hash, 5, 60))) return json({ ok: false, error: 'Too many attempts. Please try again later.' }, 429)
    const [exists] = await d.select({ id: users.id }).from(users).where(eq(users.email, email))
    if (exists) return json({ ok: false, error: 'An account with this email already exists. Log in instead.' }, 409)
    const salt = new Uint8Array(16)
    crypto.getRandomValues(salt)
    const [created] = await d.insert(users).values({
      email, name, organization: clean(b.organization, 160) || null,
      passwordHash: b64(await derive(password, salt, ITERATIONS)), passwordSalt: b64(salt), passwordIterations: ITERATIONS,
    }).returning({ id: users.id })
    return json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, created.id) })
  }

  if (action === 'login') {
    if (!(await allow(env, 'login', hash, 10, 15))) return json({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429)
    const [user] = await d.select().from(users).where(eq(users.email, email))
    // the same work whether or not the account exists, so timing doesn't reveal it
    const derived = await derive(password, user ? unb64(user.passwordSalt) : new Uint8Array(16), user ? user.passwordIterations : ITERATIONS)
    if (!user || !equal(derived, unb64(user.passwordHash))) return json({ ok: false, error: 'Email or password is incorrect.' }, 401)
    return json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, user.id) })
  }

  return json({ ok: false, error: 'Not found.' }, 404)
}
