import type { Metadata } from 'next'
import Link from 'next/link'
import { Legal } from '@/components/legal/Legal'

export const metadata: Metadata = { title: 'Cookie Policy', description: 'How TensaCo uses cookies and similar technologies.' }

export default function Cookies() {
  return (
    <Legal
      title="Cookie Policy"
      updated="September 24, 2026"
      intro={<p>This Cookie Policy explains how TensaCo Inc. uses cookies and similar technologies on tensaco.ai, phaser.tensaco.ai and related sites. It supplements our <Link href="/legal/privacy/">Privacy Policy</Link>.</p>}
      sections={[
        {
          id: 'what', title: 'What cookies are',
          body: <p>Cookies are small text files a website stores in your browser. They can be essential to a site’s operation, or used for purposes such as analytics and advertising.</p>,
        },
        {
          id: 'ours', title: 'Cookies we use',
          body: (
            <>
              <p>We use a single, strictly necessary cookie, and only when you sign in:</p>
              <table>
                <thead><tr><th>Name</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead>
                <tbody>
                  <tr><td>tc_session</td><td>Keeps you signed in to your TensaCo account across tensaco.ai and account.tensaco.ai (scoped to .tensaco.ai). It holds a random token; only a hash of it is stored on our servers.</td><td>Strictly necessary, first-party, HttpOnly, Secure</td><td>30 days, or until you sign out</td></tr>
                  <tr><td>tensaco_signed_in</td><td>Tells tensaco.ai pages that you are signed in, so the menu can show “My account”. Its value is always 1 and it identifies no one.</td><td>Strictly necessary, first-party, Secure</td><td>30 days, or until you sign out</td></tr>
                </tbody>
              </table>
              <p>We do not use analytics, advertising or social-media tracking cookies, and we do not allow third parties to set cookies through the Sites.</p>
            </>
          ),
        },
        {
          id: 'providers', title: 'Our hosting provider',
          body: <p>Our hosting provider, Cloudflare, may set strictly necessary cookies to protect the Sites against abuse and bots. These are used only for security and are governed by Cloudflare’s own policies.</p>,
        },
        {
          id: 'choices', title: 'Your choices',
          body: <p>Because we only use strictly necessary cookies, we do not show a cookie consent banner. You can block or delete cookies in your browser settings; if you block the session cookie, you will not be able to sign in.</p>,
        },
        {
          id: 'changes', title: 'Changes',
          body: <p>If we start using other kinds of cookies, we will update this Policy and, where required, ask for your consent first.</p>,
        },
        {
          id: 'contact', title: 'Contact',
          body: <p>Questions: <a href="mailto:hello@tensaco.ai?subject=Cookies">hello@tensaco.ai</a>.</p>,
        },
      ]}
    />
  )
}
