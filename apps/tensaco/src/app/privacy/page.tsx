import type { Metadata } from 'next'
import s from '../pages.module.css'

export const metadata: Metadata = { title: 'Privacy notice', description: 'How TensaCo handles the information you share with us.' }

export default function Privacy() {
  return (
    <section className={`section ${s.legalPage}`}>
      <div className="wrap">
        <p className="eyebrow">Legal</p>
        <h1 className="h1">Privacy notice</h1>
        <p className="note">Last updated September 24, 2026</p>
        <h2>What we collect</h2>
        <p>When you subscribe to updates on tensaco.ai or phaser.tensaco.ai we store your email address, which site and page you signed up from, the country your request came from, and a one-way hash of your IP address used only to limit abuse. When you email us, we receive what you send.</p>
        <h2>How we use it</h2>
        <p>We use your email address to send the updates you asked for, and to reply to you. We do not sell or rent your information, and we do not use it for advertising.</p>
        <h2>Where it is stored</h2>
        <p>Subscriber records are stored with Cloudflare, which hosts our websites. Email we receive is handled by Google Workspace.</p>
        <h2>Your choices</h2>
        <p>Every update we send includes a way to unsubscribe. You can also ask us to delete your information at any time by writing to <a href="mailto:hello@tensaco.ai?subject=Privacy">hello@tensaco.ai</a>.</p>
        <h2>Contact</h2>
        <p>TensaCo Inc. · <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a></p>
      </div>
    </section>
  )
}
