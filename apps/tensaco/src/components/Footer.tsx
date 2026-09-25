import Link from 'next/link'
import { Logo } from './Logo'
import s from './Footer.module.css'

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.top}`}>
        <div className={s.brand}>
          <Logo />
          <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a>
        </div>
        <nav className={s.cols} aria-label="Footer">
          <div><h4>Solutions</h4><a href="https://phaser.tensaco.ai">PHASER</a><a href="https://tensorcode.dev">TensorCode</a></div>
          <div><h4>Company</h4><Link href="/company/">About us</Link><Link href="/company/leadership/">Leadership</Link><Link href="/careers/">Careers</Link><Link href="/newsroom/">Newsroom</Link></div>
          <div><h4>Resources</h4><Link href="/investors/">Investors</Link><Link href="/contact/">Contact</Link><a href="https://account.tensaco.ai/">Customer portal</a></div>
        </nav>
      </div>
      <div className={`wrap ${s.legal}`}>
        <span>© 2026 TENSACO INC</span>
        <Link href="/legal/terms/">Terms of Use</Link>
        <Link href="/legal/privacy/">Privacy Policy</Link>
        <Link href="/legal/cookies/">Cookie Policy</Link>
        <span className={s.social}><a href="https://x.com/TensacoInc">X</a><a href="https://github.com/TensaCo">GitHub</a></span>
      </div>
    </footer>
  )
}
