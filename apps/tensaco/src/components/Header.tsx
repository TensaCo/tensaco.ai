'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import s from './Header.module.css'

/** pages without a full-bleed photo/video hero (and the team profile pages) get a solid header from the start */
const SOLID = ['/legal/', '/careers/', '/investors/', '/newsroom/']

/** Accounts live at account.tensaco.ai; its non-HttpOnly presence cookie (Domain=.tensaco.ai) says someone is signed in. */
const ACCOUNT = 'https://account.tensaco.ai'
const signedIn = () => /(?:^|;\s*)tensaco_signed_in=1(?:;|$)/.test(document.cookie)

const MENU: { label: string; href: string; items?: { label: string; href: string; external?: boolean }[] }[] = [
  { label: 'Solutions', href: '/#solutions', items: [
    { label: 'PHASER', href: 'https://phaser.tensaco.ai', external: true },
    { label: 'TensorCode', href: 'https://tensorcode.dev', external: true },
  ] },
  { label: 'Company', href: '/company/', items: [
    { label: 'About us', href: '/company/' },
    { label: 'Leadership', href: '/company/leadership/' },
    { label: 'Careers', href: '/careers/' },
    { label: 'Newsroom', href: '/newsroom/' },
  ] },
  { label: 'Contact', href: '/contact/' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const path = usePathname()
  const solidPage = (SOLID.some((p) => path.startsWith(p)) && path !== '/careers/') || /^\/company\/leadership\/[^/]+\/?$/.test(path)
  const [user, setUser] = useState(false)
  useEffect(() => setUser(signedIn()), [])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const close = () => setOpen(false)
  return (
    <header className={`${s.header} ${scrolled || open || solidPage ? s.solid : ''}`}>
      <div className={s.bar}>
        <Logo className={s.logo} />
        <nav className={`${s.nav} ${open ? s.open : ''}`} aria-label="Main">
          <ul className={s.menu}>
            {MENU.map((m) => (
              <li key={m.label} className={s.item}>
                <Link href={m.href} className={s.top} onClick={close}>{m.label}{m.items && <i aria-hidden="true" />}</Link>
                {m.items && (
                  <ul className={s.drop}>
                    {m.items.map((it) => (
                      <li key={it.label}>
                        {it.external
                          ? <a href={it.href} onClick={close}>{it.label}<span aria-hidden="true">↗</span></a>
                          : <Link href={it.href} onClick={close}>{it.label}</Link>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className={s.account}>
            {user
              ? <a href={`${ACCOUNT}/`} className={s.signup} onClick={close}>My account</a>
              : <a href={`${ACCOUNT}/login/`} className={s.signup} onClick={close}>Sign in</a>}
          </div>
        </nav>
        <button className={s.burger} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
