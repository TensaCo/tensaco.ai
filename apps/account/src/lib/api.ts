'use client'

export const SITE = 'https://tensaco.ai'

export type User = {
  id: number; email: string; name: string; role: string; organization: string | null; createdAt: string
  emailVerifiedAt: string | null; notifyUpdates: boolean
}

/** fetch JSON from the console's own API; never throws */
export async function api<T = Record<string, unknown>>(path: string, init?: RequestInit & { json?: unknown }): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const { json, ...rest } = init ?? {}
    const r = await fetch(path, {
      credentials: 'same-origin',
      ...rest,
      headers: json !== undefined ? { 'content-type': 'application/json', ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    })
    const data = (await r.json().catch(() => ({}))) as T
    return { ok: r.ok, status: r.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error. Please try again.' } as T }
  }
}

/** a same-site path from ?next=, or the fallback */
export function nextPath(fallback = '/') {
  const next = new URLSearchParams(location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export const param = (name: string) => (typeof window === 'undefined' ? '' : new URLSearchParams(location.search).get(name) ?? '')

/** D1 datetimes are 'YYYY-MM-DD HH:MM:SS' in UTC */
const parse = (s: string) => new Date(s.replace(' ', 'T') + 'Z')
export const fmtDate = (s: string | null) => (s ? parse(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')
export const fmtDateTime = (s: string | null) => (s ? parse(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
