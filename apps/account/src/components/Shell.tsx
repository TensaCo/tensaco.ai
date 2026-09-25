'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, SITE, type User } from '@/lib/api'
import { Icon } from './Icon'
import s from './Shell.module.css'
import u from './ui.module.css'

export type Ticket = { id: number; subject: string; category: string; status: string; createdAt: string; updatedAt: string; customer: string }
export type Req = { id: number; service: string; organization: string | null; status: string; createdAt: string; updatedAt: string; customer: string }
export type Application = { id: number; jobId: string; jobTitle: string; name: string; email: string; status: string; createdAt: string }
export type Account = { user: User; applications: Application[]; tickets: Ticket[]; requests: Req[]; subscribed: boolean }

const Ctx = createContext<{ account: Account; reload: () => void; staff: boolean } | null>(null)
export const useAccount = () => useContext(Ctx)!

export const SERVICE_NAMES: Record<string, string> = {
  'phaser-compute': 'PHASER compute access',
  'phaser-research': 'PHASER research collaboration',
  'tensorcode-deployment': 'TensorCode deployment support',
  'tensorcode-training': 'TensorCode model training',
}
export const CATEGORY_NAMES: Record<string, string> = {
  general: 'General question', phaser: 'PHASER', tensorcode: 'TensorCode', partnership: 'Partnerships', billing: 'Billing', account: 'Account and access',
}
export const STATUS_NAMES: Record<string, string> = {
  open: 'Open', awaiting_customer: 'Awaiting customer', resolved: 'Resolved',
  submitted: 'Submitted', in_review: 'In review', approved: 'Approved', waitlisted: 'Waitlisted', declined: 'Declined',
  received: 'Received', reviewing: 'Under review', interviewing: 'Interviewing', offer: 'Offer', closed: 'Closed',
}

export function Status({ value, staff = true }: { value: string; staff?: boolean }) {
  const label = value === 'awaiting_customer' && !staff ? 'Awaiting your reply' : STATUS_NAMES[value] ?? value
  return <span className={`${u.pill} ${u['p_' + value] ?? ''}`}>{label}</span>
}

type Crumb = { label: string; href?: string }

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

/** Signed-in console: top bar, sidebar, breadcrumbs. Loads /api/account; sends signed-out visitors to /login/. */
export function Shell({ title, description, crumbs = [], actions, children }: { title: string; description?: React.ReactNode; crumbs?: Crumb[]; actions?: React.ReactNode; children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [menu, setMenu] = useState(false)
  const [side, setSide] = useState(false)
  const [resend, setResend] = useState<'idle' | 'busy' | 'sent' | string>('idle')
  const [flash, setFlash] = useState('')
  const path = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const load = useCallback(() => {
    api<Account>('/api/account').then((r) => {
      if (r.status === 401) location.replace(`/login/?next=${encodeURIComponent(location.pathname + location.search)}`)
      else if (r.ok) setAccount(r.data)
    })
  }, [])
  useEffect(load, [load])
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('welcome')) setFlash('Welcome to TensaCo. We sent a verification link to your email address.')
    else if (q.get('reset')) setFlash('Your password was changed and your other sessions were signed out.')
    if (q.get('welcome') || q.get('reset')) history.replaceState(null, '', location.pathname)
  }, [])
  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [menu])
  useEffect(() => { document.title = `${title} · TensaCo Account` }, [title])
  const signOut = async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/login/' }
  const resendLink = async () => {
    setResend('busy')
    const r = await api<{ error?: string }>('/api/auth/resend-verification', { method: 'POST' })
    setResend(r.ok ? 'sent' : r.data.error ?? 'Could not send the email.')
  }
  if (!account) return <div className={s.loading}>Loading your account…</div>
  const staff = account.user.role === 'staff'
  const openTickets = account.tickets.filter((t) => (staff ? t.status === 'open' : t.status === 'awaiting_customer')).length
  const groups: { title?: string; items: { href: string; label: string; icon: string; count?: number }[] }[] = [
    { items: [{ href: '/', label: 'Overview', icon: 'home' }] },
    { title: staff ? 'Operations' : 'Your work', items: [
      { href: '/support/', label: 'Support', icon: 'inbox', count: openTickets || undefined },
      { href: '/services/', label: 'Service requests', icon: 'layers' },
      { href: '/applications/', label: 'Applications', icon: 'briefcase' },
    ] },
    { title: 'Settings', items: [
      { href: '/profile/', label: 'Profile', icon: 'user' },
      { href: '/security/', label: 'Security', icon: 'shield' },
    ] },
    ...(staff ? [{ title: 'Administration', items: [{ href: '/staff/customers/', label: 'Customers', icon: 'users' }] }] : []),
  ]
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  return (
    <Ctx.Provider value={{ account, reload: load, staff }}>
      <header className={s.top}>
        <button className={s.menuBtn} aria-label="Navigation" aria-expanded={side} onClick={() => setSide((o) => !o)}><Icon name="menu" size={22} /></button>
        <Link href="/" className={s.brand}>
          <img src="/brand/mark-64.png" alt="" width={28} height={28} />
          <b>TensaCo</b><span>Account</span>
        </Link>
        <div className={s.spacer} />
        <Link href="/support/" className={s.topLink}>Help</Link>
        <a href={SITE} className={s.topLink}>tensaco.ai</a>
        <div className={s.user} ref={menuRef}>
          <button className={s.userBtn} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((o) => !o)}>
            <span className={s.avatar}>{initials(account.user.name)}</span>
            <span className={s.userName}>{account.user.name}</span>
            <i className={s.caret} aria-hidden="true" />
          </button>
          {menu && (
            <div className={s.dropdown} role="menu">
              <div className={s.ddHead}><b>{account.user.name}</b><span>{account.user.email}</span>{staff && <em>Staff</em>}</div>
              <Link href="/profile/" role="menuitem" onClick={() => setMenu(false)}><Icon name="user" size={16} />Profile</Link>
              <Link href="/security/" role="menuitem" onClick={() => setMenu(false)}><Icon name="shield" size={16} />Security</Link>
              <a href={SITE} role="menuitem"><Icon name="ext" size={16} />tensaco.ai</a>
              <div className={s.ddSep} />
              <button role="menuitem" onClick={signOut}><Icon name="out" size={16} />Sign out</button>
            </div>
          )}
        </div>
      </header>
      <div className={s.body}>
        <nav className={`${s.side} ${side ? s.open : ''}`} aria-label="Account">
          {groups.map((g, i) => (
            <div key={i} className={s.group}>
              {g.title && <h3>{g.title}</h3>}
              {g.items.map((n) => (
                <Link key={n.href} href={n.href} className={active(n.href) ? s.active : ''} onClick={() => setSide(false)}>
                  <Icon name={n.icon} />{n.label}{n.count ? <span className={s.count}>{n.count}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <main className={s.main}>
          <div className={s.inner}>
            <ol className={s.crumbs}>
              <li><Link href="/">Account</Link></li>
              {crumbs.map((c, i) => <li key={i}>{c.href ? <Link href={c.href}>{c.label}</Link> : c.label}</li>)}
            </ol>
            {flash && <div className={`${s.banner} ${s.notice}`} role="status">{flash}</div>}
            {!account.user.emailVerifiedAt && (
              <div className={s.banner} role="status">
                <span><b>Verify your email address.</b> We sent a link to {account.user.email}. {resend === 'sent' ? 'A new link is on its way.' : resend !== 'idle' && resend !== 'busy' ? resend : ''}</span>
                {resend !== 'sent' && <button onClick={resendLink} disabled={resend === 'busy'}>{resend === 'busy' ? 'Sending…' : 'Resend email'}</button>}
              </div>
            )}
            <div className={s.head}>
              <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
              {actions && <div className={s.headActions}>{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </Ctx.Provider>
  )
}
