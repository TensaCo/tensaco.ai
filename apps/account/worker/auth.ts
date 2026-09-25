// Accounts: sign up, sign in/out, email verification, password reset and change.
// Passwords are PBKDF2-SHA256 with a per-user salt. Sessions are random 32-byte tokens in an HttpOnly cookie scoped to
// .tensaco.ai (so tensaco.ai can link job applications to the account), stored only as their SHA-256. A second,
// non-HttpOnly cookie `tensaco_signed_in=1` tells the static tensaco.ai pages to show "My account"; it carries no secret.
// Emailed tokens (verify, reset) are single-use, expiring, and also stored only as hashes.
import { templates } from '@tensaco/email'
import { authTokens, db, sessions, users } from '@tensaco/db'
import { and, count, eq, gt, isNull, ne, sql } from 'drizzle-orm'
import { accountUrl, type Env } from './env'
import { allow, b64, clean, EMAIL, ipHash, json, randomToken, readJson, sameOrigin, sha256, unb64 } from './lib'
import { mail } from './mail'

const ITERATIONS = 100000 // the Workers runtime's PBKDF2 maximum
const DAYS = 30
const NOW = sql`datetime('now')` as unknown as string
const later = (modifier: string) => sql`datetime('now', ${modifier})` as unknown as string

export type User = {
  id: number; email: string; name: string; role: string; organization: string | null; createdAt: string
  emailVerifiedAt: string | null; notifyUpdates: boolean
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
}

async function hashPassword(password: string) {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return { passwordHash: b64(await derive(password, salt, ITERATIONS)), passwordSalt: b64(salt), passwordIterations: ITERATIONS }
}

function equal(a: ArrayBuffer | Uint8Array, b: ArrayBuffer | Uint8Array) {
  const x = new Uint8Array(a), y = new Uint8Array(b)
  if (x.length !== y.length) return false
  let d = 0
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i]
  return d === 0
}

const passwordProblem = (p: string) => (p.length < 10 || p.length > 200 ? 'Use a password of at least 10 characters.' : null)

// ---- cookies ----

const scope = (env: Env) => `Path=/; Secure; SameSite=Lax${env.COOKIE_DOMAIN ? `; Domain=${env.COOKIE_DOMAIN}` : ''}`
const sessionCookie = (env: Env, token: string, maxAge: number) => `tc_session=${token}; ${scope(env)}; HttpOnly; Max-Age=${maxAge}`
const presenceCookie = (env: Env, on: boolean) => `tensaco_signed_in=${on ? '1' : ''}; ${scope(env)}; Max-Age=${on ? DAYS * 86400 : 0}`
export const signedOutCookies = (env: Env) => [sessionCookie(env, '', 0), presenceCookie(env, false)]
const tokenFrom = (request: Request) => /(?:^|;\s*)tc_session=([0-9a-f]{64})/.exec(request.headers.get('cookie') ?? '')?.[1]

export function withCookies(res: Response, cookies: string[]) {
  for (const c of cookies) res.headers.append('set-cookie', c)
  return res
}

async function startSession(request: Request, env: Env, userId: number) {
  const token = randomToken()
  const d = db(env.DB)
  await d.insert(sessions).values({
    tokenHash: await sha256(token), userId, expiresAt: later(`+${DAYS} days`),
    ipHash: await ipHash(request, env), userAgent: clean(request.headers.get('user-agent'), 200),
  })
  await d.update(users).set({ lastLoginAt: NOW }).where(eq(users.id, userId))
  return [sessionCookie(env, token, DAYS * 86400), presenceCookie(env, true)]
}

/** The signed-in user for this request, or null. */
export async function currentUser(request: Request, env: Env): Promise<User | null> {
  const token = tokenFrom(request)
  if (!token) return null
  const [row] = await db(env.DB)
    .select({
      id: users.id, email: users.email, name: users.name, role: users.role, organization: users.organization, createdAt: users.createdAt,
      emailVerifiedAt: users.emailVerifiedAt, notifyUpdates: users.notifyUpdates,
    })
    .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, await sha256(token)), gt(sessions.expiresAt, sql`datetime('now')`)))
  return row ?? null
}

// ---- emailed tokens ----

async function issueToken(env: Env, userId: number, purpose: 'verify' | 'reset') {
  const token = randomToken()
  await db(env.DB).insert(authTokens).values({ tokenHash: await sha256(token), userId, purpose, expiresAt: later(purpose === 'reset' ? '+1 hours' : '+7 days') })
  return token
}

/** How many tokens of this purpose were issued to the user in the last hour. */
async function recentTokens(env: Env, userId: number, purpose: string) {
  const [{ n }] = await db(env.DB).select({ n: count() }).from(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose), gt(authTokens.createdAt, sql`datetime('now', '-1 hours')`)))
  return n
}

/** Mark a valid token used and return its user id; null if unknown, used or expired. Atomic, so it works once. */
async function consumeToken(env: Env, token: string, purpose: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null
  const [row] = await db(env.DB).update(authTokens).set({ usedAt: NOW })
    .where(and(eq(authTokens.tokenHash, await sha256(token)), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), gt(authTokens.expiresAt, sql`datetime('now')`)))
    .returning({ userId: authTokens.userId })
  return row?.userId ?? null
}

async function sendVerification(env: Env, ctx: ExecutionContext, user: { id: number; name: string; email: string }) {
  const token = await issueToken(env, user.id, 'verify')
  mail(env, ctx, 'verify', user.email, templates.verifyEmail({ name: user.name, url: `${accountUrl(env)}/verify/?token=${token}` }))
}

export async function auth(request: Request, env: Env, ctx: ExecutionContext, action: string) {
  if (action === 'me') {
    const user = await currentUser(request, env)
    return user ? json({ user }) : withCookies(json({ user: null }, 401), request.headers.get('cookie')?.includes('tensaco_signed_in=1') ? signedOutCookies(env) : [])
  }
  if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403)
  const d = db(env.DB)

  if (action === 'logout') {
    const token = tokenFrom(request)
    if (token) await d.delete(sessions).where(eq(sessions.tokenHash, await sha256(token)))
    return withCookies(json({ ok: true }), signedOutCookies(env))
  }

  // an empty or unparsable body counts as {}; each action validates what it needs
  const b = (await readJson<{ name?: string; email?: string; password?: string; current?: string; organization?: string; company?: string; token?: string }>(request)) ?? {}
  const email = clean(b.email, 254).toLowerCase()
  const password = String(b.password ?? '')
  const hash = await ipHash(request, env)

  if (action === 'signup') {
    if (b.company) return json({ ok: true }) // honeypot
    const name = clean(b.name, 120)
    if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400)
    if (!EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
    const bad = passwordProblem(password)
    if (bad) return json({ ok: false, error: bad }, 400)
    if (!(await allow(env, 'signup', hash, 5, 60))) return json({ ok: false, error: 'Too many attempts. Please try again later.' }, 429)
    const [exists] = await d.select({ id: users.id }).from(users).where(eq(users.email, email))
    if (exists) return json({ ok: false, error: 'An account with this email already exists. Sign in instead.' }, 409)
    const [created] = await d.insert(users).values({ email, name, organization: clean(b.organization, 160) || null, ...(await hashPassword(password)) })
      .returning({ id: users.id })
    await sendVerification(env, ctx, { id: created.id, name, email })
    return withCookies(json({ ok: true }), await startSession(request, env, created.id))
  }

  if (action === 'login') {
    if (!(await allow(env, 'login', hash, 10, 15))) return json({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429)
    const [user] = await d.select().from(users).where(eq(users.email, email))
    // the same work whether or not the account exists, so timing doesn't reveal it
    const derived = await derive(password, user ? unb64(user.passwordSalt) : new Uint8Array(16), user ? user.passwordIterations : ITERATIONS)
    if (!user || !equal(derived, unb64(user.passwordHash))) return json({ ok: false, error: 'Email or password is incorrect.' }, 401)
    return withCookies(json({ ok: true }), await startSession(request, env, user.id))
  }

  if (action === 'verify') {
    const userId = await consumeToken(env, String(b.token ?? ''), 'verify')
    if (!userId) return json({ ok: false, error: 'This verification link is invalid or has expired. Sign in and send a new one.' }, 400)
    await d.update(users).set({ emailVerifiedAt: NOW }).where(and(eq(users.id, userId), isNull(users.emailVerifiedAt)))
    return json({ ok: true })
  }

  if (action === 'resend-verification') {
    const user = await currentUser(request, env)
    if (!user) return json({ ok: false, error: 'Please sign in.' }, 401)
    if (user.emailVerifiedAt) return json({ ok: true, verified: true })
    if ((await recentTokens(env, user.id, 'verify')) >= 3) return json({ ok: false, error: 'We sent several links in the last hour. Please check your inbox and spam folder, or try again later.' }, 429)
    await sendVerification(env, ctx, user)
    return json({ ok: true })
  }

  if (action === 'forgot') {
    // Always the same answer, so the form can't be used to find out who has an account. The send happens after the response.
    if (!EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)
    if (!(await allow(env, 'forgot', hash, 5, 60))) return json({ ok: false, error: 'Too many attempts. Please try again later.' }, 429)
    const [user] = await d.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.email, email))
    if (user && (await recentTokens(env, user.id, 'reset')) < 3) {
      const token = await issueToken(env, user.id, 'reset')
      mail(env, ctx, 'reset', user.email, templates.passwordReset({ name: user.name, url: `${accountUrl(env)}/reset/?token=${token}` }))
    }
    return json({ ok: true })
  }

  if (action === 'reset') {
    const bad = passwordProblem(password)
    if (bad) return json({ ok: false, error: bad }, 400)
    if (!(await allow(env, 'reset', hash, 10, 60))) return json({ ok: false, error: 'Too many attempts. Please try again later.' }, 429)
    const userId = await consumeToken(env, String(b.token ?? ''), 'reset')
    if (!userId) return json({ ok: false, error: 'This reset link is invalid, already used or expired. Request a new one.' }, 400)
    // the link proves control of the inbox: the address counts as verified
    const [user] = await d.update(users).set({ ...(await hashPassword(password)), emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, datetime('now'))` as unknown as string })
      .where(eq(users.id, userId)).returning({ id: users.id, name: users.name, email: users.email })
    await d.update(authTokens).set({ usedAt: NOW }).where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, 'reset'), isNull(authTokens.usedAt)))
    await d.delete(sessions).where(eq(sessions.userId, userId))
    mail(env, ctx, 'password_changed', user.email, templates.passwordChanged({ name: user.name, account: accountUrl(env) }))
    return withCookies(json({ ok: true }), await startSession(request, env, userId))
  }

  if (action === 'password') {
    const user = await currentUser(request, env)
    if (!user) return json({ ok: false, error: 'Please sign in.' }, 401)
    const bad = passwordProblem(password)
    if (bad) return json({ ok: false, error: bad }, 400)
    if (!(await allow(env, 'password', hash, 10, 15))) return json({ ok: false, error: 'Too many attempts. Please wait a few minutes.' }, 429)
    const [row] = await d.select().from(users).where(eq(users.id, user.id))
    if (!equal(await derive(String(b.current ?? ''), unb64(row.passwordSalt), row.passwordIterations), unb64(row.passwordHash))) {
      return json({ ok: false, error: 'Your current password is incorrect.' }, 400)
    }
    await d.update(users).set(await hashPassword(password)).where(eq(users.id, user.id))
    const current = await sha256(tokenFrom(request)!)
    await d.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.tokenHash, current)))
    mail(env, ctx, 'password_changed', user.email, templates.passwordChanged({ name: user.name, account: accountUrl(env) }))
    return json({ ok: true })
  }

  if (action === 'logout-others') {
    const user = await currentUser(request, env)
    if (!user) return json({ ok: false, error: 'Please sign in.' }, 401)
    await d.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.tokenHash, await sha256(tokenFrom(request)!))))
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found.' }, 404)
}
