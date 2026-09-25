import { SITE } from '@/lib/api'
import s from './Auth.module.css'

/** The centered sign-in card used by /login, /signup, /forgot, /reset and /verify. */
export function AuthLayout({ title, lede, children, below }: { title: string; lede?: React.ReactNode; children: React.ReactNode; below?: React.ReactNode }) {
  return (
    <div className={s.page}>
      <a href={SITE} className={s.brand} aria-label="TensaCo">
        <img src="/brand/mark-64.png" srcSet="/brand/mark-64.png 1x, /brand/mark-192.png 3x" alt="" width={36} height={36} />
        <span>TensaCo</span>
      </a>
      <main className={s.card}>
        <h1>{title}</h1>
        {lede && <p className={s.lede}>{lede}</p>}
        {children}
      </main>
      {below && <p className={s.below}>{below}</p>}
      <footer className={s.foot}>
        <span>© {new Date().getFullYear()} TensaCo Inc.</span>
        <a href={`${SITE}/legal/privacy/`}>Privacy</a>
        <a href={`${SITE}/legal/terms/`}>Terms</a>
        <a href={`${SITE}/contact/`}>Contact</a>
        <a href={SITE}>tensaco.ai</a>
      </footer>
    </div>
  )
}

export function StateIcon({ kind }: { kind: 'ok' | 'bad' | 'mail' }) {
  return (
    <div className={`${s.icon} ${kind === 'ok' ? s.ok : kind === 'bad' ? s.bad : ''}`} aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'ok' ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : kind === 'bad' ? <path d="M12 8v5M12 16.5v.5M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /> : <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>}
      </svg>
    </div>
  )
}
