import Link from 'next/link'
import s from './Footer.module.css'

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={`wrap ${s.cols}`}>
        <div className={s.brand}>
          <Link href="/" className={s.logo}>Tensa<span>Co</span></Link>
          <p>Intelligence infrastructure for the enterprise.</p>
          <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a>
        </div>
        <div>
          <h4>Solutions</h4>
          <Link href="/solutions/phaser/">PHASER</Link>
          <Link href="/solutions/tensorcode/">TensorCode</Link>
          <Link href="/solutions/">All solutions</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link href="/company/">About</Link>
          <Link href="/company/leadership/">Leadership</Link>
          <Link href="/careers/">Careers</Link>
          <Link href="/newsroom/">Newsroom</Link>
        </div>
        <div>
          <h4>Investors</h4>
          <Link href="/investors/">Investor relations</Link>
          <Link href="/contact/">Contact</Link>
        </div>
      </div>
      <div className={`wrap ${s.legal}`}>
        <span>© 2026 TensaCo Inc. All rights reserved.</span>
        <span className={s.legalLinks}>
          <Link href="/privacy/">Privacy</Link>
          <a href="https://x.com/TensacoInc">X</a>
          <a href="https://github.com/TensaCo">GitHub</a>
        </span>
      </div>
    </footer>
  )
}
