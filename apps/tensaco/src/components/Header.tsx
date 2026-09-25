'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import s from './Header.module.css'

/** pages without a full-bleed photo/video hero get a solid header from the start */
const NO_HERO = ['/privacy/']

const MENU = [
  { label: 'Solutions', href: '/solutions/', items: [
    { label: 'PHASER', sub: 'Optical AI acceleration', href: '/solutions/phaser/' },
    { label: 'TensorCode', sub: 'Accountable AI software', href: '/solutions/tensorcode/' },
  ] },
  { label: 'Company', href: '/company/', items: [
    { label: 'About TensaCo', sub: 'Mission and values', href: '/company/' },
    { label: 'Leadership', sub: 'The people leading TensaCo', href: '/company/leadership/' },
    { label: 'Careers', sub: 'Work with us', href: '/careers/' },
  ] },
  { label: 'Investors', href: '/investors/' },
  { label: 'Newsroom', href: '/newsroom/' },
]

export function Header() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const plain = NO_HERO.includes(usePathname())
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`${s.header} ${solid || open || plain ? s.solid : ''}`}>
      <div className={s.bar}>
        <Link href="/" className={s.logo} aria-label="TensaCo home">Tensa<span>Co</span></Link>
        <nav className={`${s.nav} ${open ? s.open : ''}`} aria-label="Main">
          {MENU.map((m) => (
            <div key={m.label} className={s.item}>
              <Link href={m.href} className={s.top} onClick={() => setOpen(false)}>{m.label}{m.items && <i aria-hidden="true" />}</Link>
              {m.items && (
                <div className={s.drop}>
                  {m.items.map((it) => (
                    <Link key={it.href + it.label} href={it.href} onClick={() => setOpen(false)}>
                      <b>{it.label}</b><span>{it.sub}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/contact/" className={s.cta} onClick={() => setOpen(false)}>Contact us</Link>
        </nav>
        <button className={s.burger} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
