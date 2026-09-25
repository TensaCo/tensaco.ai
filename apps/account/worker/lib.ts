// Small helpers shared by the account API routes.
import { attempts, db } from '@tensaco/db'
import { and, count, eq, gt, sql } from 'drizzle-orm'
import type { Env } from './env'

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

export const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
export const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const ipHash = (request: Request, env: Env) => sha256(`${request.headers.get('cf-connecting-ip') ?? ''}:${env.IP_SALT ?? 'tensaco'}`)
export const country = (request: Request) => (request as Request & { cf?: { country?: string } }).cf?.country ?? null

/** Browsers send Origin on cross-site requests; refuse anything that isn't from this site. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || new URL(origin).host === new URL(request.url).host
}

/** Allow `max` attempts of `kind` per client per `minutes`, recording this one. False when over the limit. */
export async function allow(env: Env, kind: string, hash: string, max: number, minutes: number) {
  const d = db(env.DB)
  const [{ n }] = await d.select({ n: count() }).from(attempts)
    .where(and(eq(attempts.kind, kind), eq(attempts.ipHash, hash), gt(attempts.createdAt, sql`datetime('now', ${`-${minutes} minutes`})`)))
  if (n >= max) return false
  await d.insert(attempts).values({ kind, ipHash: hash })
  return true
}

export const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
export const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try { return (await request.json()) as T } catch { return null }
}

/** 32 random bytes as hex: session and emailed tokens. */
export function randomToken() {
  const raw = new Uint8Array(32)
  crypto.getRandomValues(raw)
  return [...raw].map((b) => b.toString(16).padStart(2, '0')).join('')
}
