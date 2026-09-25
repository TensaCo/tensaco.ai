import Link from 'next/link'
import s from './SiteHeader.module.css'

export function SiteHeader() {
  return (
    <header className={s.top}>
      <Link href="/" className={s.mark}>PHASER</Link>
      <nav className={s.nav} aria-label="Site">
        <Link href="/#light" className={s.section}>01 The light</Link>
        <Link href="/#machine" className={s.section}>02 The machine</Link>
        <Link href="/#world" className={s.section}>03 The world</Link>
        <Link href="/blog/">Blog</Link>
        <Link href="/#subscribe" className={s.cta}>Subscribe</Link>
      </nav>
    </header>
  )
}
