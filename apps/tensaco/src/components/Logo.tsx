import Link from 'next/link'
import s from './Logo.module.css'

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`${s.logo} ${className ?? ''}`} aria-label="TensaCo home">
      <img src="/brand/mark-64.png" srcSet="/brand/mark-64.png 1x, /brand/mark-192.png 3x" alt="" width={32} height={32} />
      <span>TensaCo</span>
    </Link>
  )
}
