'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, type User } from '@/lib/api'
import s from './Portal.module.css'

export type Ticket = { id: number; subject: string; category: string; status: string; updatedAt: string; customer: string }
export type Req = { id: number; service: string; organization: string | null; status: string; createdAt: string; updatedAt: string }
export type Application = { id: number; jobId: string; jobTitle: string; status: string; createdAt: string }
export type Account = { user: User; applications: Application[]; tickets: Ticket[]; requests: Req[]; subscribed: boolean }

const Ctx = createContext<{ account: Account; reload: () => void } | null>(null)
export const useAccount = () => useContext(Ctx)!

const NAV = [
  { href: '/account/', label: 'Overview' },
  { href: '/account/support/', label: 'Support inbox' },
  { href: '/account/services/', label: 'Service requests' },
  { href: '/account/applications/', label: 'Applications' },
  { href: '/account/profile/', label: 'Profile' },
]

export const SERVICE_NAMES: Record<string, string> = {
  'phaser-compute': 'PHASER compute access',
  'phaser-research': 'PHASER research collaboration',
  'tensorcode-deployment': 'TensorCode deployment support',
  'tensorcode-training': 'TensorCode model training',
}
export const STATUS_NAMES: Record<string, string> = {
  open: 'Open', awaiting_customer: 'Awaiting your reply', resolved: 'Resolved',
  submitted: 'Submitted', in_review: 'In review', approved: 'Approved', waitlisted: 'Waitlisted', declined: 'Declined',
  received: 'Received', reviewing: 'Under review', interviewing: 'Interviewing', offer: 'Offer', closed: 'Closed',
}

export function Status({ value }: { value: string }) {
  return <span className={`${s.status} ${s['s_' + value] ?? ''}`}>{STATUS_NAMES[value] ?? value}</span>
}

/** Signed-in shell: loads /api/account, redirects to /login/ when signed out. */
export function Portal({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const path = usePathname()
  const load = useCallback(() => {
    api<Account>('/api/account').then((r) => {
      if (r.status === 401) location.href = `/login/?next=${encodeURIComponent(location.pathname + location.search)}`
      else if (r.ok) setAccount(r.data)
    })
  }, [])
  useEffect(load, [load])
  const signOut = async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/' }
  if (!account) return <div className={s.loading}>Loading your account…</div>
  return (
    <Ctx.Provider value={{ account, reload: load }}>
      <div className={s.shell}>
        <aside className={s.side}>
          <div className={s.who}><b>{account.user.name}</b><span>{account.user.email}</span>{account.user.role === 'staff' && <em>Staff</em>}</div>
          <nav>
            {NAV.map((n) => <Link key={n.href} href={n.href} className={path === n.href || (n.href !== '/account/' && path.startsWith(n.href)) ? s.active : ''}>{n.label}</Link>)}
          </nav>
          <button className={s.signout} onClick={signOut}>Sign out</button>
        </aside>
        <section className={s.main}>
          <div className={s.head}><h1>{title}</h1>{actions}</div>
          {children}
        </section>
      </div>
    </Ctx.Provider>
  )
}
