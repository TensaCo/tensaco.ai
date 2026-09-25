'use client'
import { useEffect, useState } from 'react'

export type User = { id: number; email: string; name: string; role: string; organization: string | null; createdAt: string }

/** fetch JSON from the site's own API; never throws */
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

/** the signed-in user: undefined while loading, null when signed out */
export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    api<{ user: User | null }>('/api/auth/me').then((r) => setUser(r.ok ? r.data.user : null))
  }, [])
  return user
}

/** D1 datetimes are 'YYYY-MM-DD HH:MM:SS' in UTC */
export const fmtDate = (s: string) => new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
export const fmtDateTime = (s: string) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
