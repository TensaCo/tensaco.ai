import type { Metadata } from 'next'
import Link from 'next/link'
import { Legal } from '@/components/legal/Legal'

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How TensaCo collects, uses and protects personal information.' }

const M = <a href="mailto:hello@tensaco.ai?subject=Privacy%20request">hello@tensaco.ai</a>

export default function Privacy() {
  return (
    <Legal
      title="Privacy Policy"
      updated="September 24, 2026"
      intro={
        <>
          <p>
            This Privacy Policy explains how TensaCo Inc. (“TensaCo,” “we,” “us” or “our”) collects, uses, discloses and protects
            personal information when you visit tensaco.ai, phaser.tensaco.ai and related sites (together, the “Sites”), create an
            account, contact us, subscribe to updates, request a service, or apply for a position.
          </p>
          <p>
            Our software products are also distributed as open-source packages and repositories. When you use those packages on your
            own systems, TensaCo does not receive your data; this Policy covers only information that reaches us.
          </p>
        </>
      }
      sections={[
        {
          id: 'collect', title: 'Information we collect',
          body: (
            <>
              <p>We collect only the information needed for the purpose described. Specifically:</p>
              <table>
                <thead><tr><th>When</th><th>What we collect</th></tr></thead>
                <tbody>
                  <tr><td>You subscribe to updates</td><td>Email address; the site and page you signed up from; the country your request came from (as reported by our hosting provider); a one-way cryptographic hash of your IP address, used only to prevent abuse.</td></tr>
                  <tr><td>You create an account</td><td>Name; email address; organization (optional); a salted cryptographic hash of your password (we never store your password itself); account creation and last sign-in times.</td></tr>
                  <tr><td>You are signed in</td><td>A session record containing a hash of your session token, its expiry, a hash of your IP address and your browser’s user-agent string.</td></tr>
                  <tr><td>You contact customer success</td><td>The subject, topic and content of your messages, and our replies.</td></tr>
                  <tr><td>You request a service</td><td>The service requested, your organization, your description of the use case, scale and timeline, and any notes we add while reviewing it.</td></tr>
                  <tr><td>You apply for a position</td><td>Your name, email, phone, location, profile links, work-authorization answer, cover letter, résumé file and the position applied for; the country your request came from and a hash of your IP address.</td></tr>
                  <tr><td>You email us</td><td>Your email address and the contents of your message.</td></tr>
                </tbody>
              </table>
              <p>
                We do not use advertising or analytics trackers on the Sites. Our hosting provider processes technical information such as
                IP addresses and request logs as needed to deliver and secure the Sites.
              </p>
            </>
          ),
        },
        {
          id: 'use', title: 'How we use information',
          body: (
            <ul>
              <li>To provide the Sites, your account, the customer success inbox and the services you request.</li>
              <li>To send the updates you subscribed to. You can unsubscribe at any time.</li>
              <li>To evaluate job applications and communicate with candidates.</li>
              <li>To respond to your questions and requests.</li>
              <li>To secure the Sites, prevent abuse and fraud, and enforce our <Link href="/legal/terms/">Terms of Use</Link>.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          ),
        },
        {
          id: 'bases', title: 'Legal bases for processing',
          body: (
            <p>
              Where the law requires a legal basis for processing (for example, in the European Economic Area and the United Kingdom), we
              rely on: performance of a contract (to provide your account and requested services); your consent (for updates, which you may
              withdraw at any time); our legitimate interests (to operate and secure the Sites, evaluate applications and communicate with
              you, balanced against your rights); and compliance with legal obligations.
            </p>
          ),
        },
        {
          id: 'share', title: 'How we share information',
          body: (
            <>
              <p>We do not sell personal information, and we do not share it for cross-context behavioral advertising. We share information only:</p>
              <ul>
                <li><strong>With service providers</strong> that process it on our behalf under contractual obligations: Cloudflare, Inc. (website hosting, databases and file storage) and Google LLC (Google Workspace, for email).</li>
                <li><strong>Within TensaCo</strong>, with personnel who need it to perform their roles, such as reviewing a service request or an application.</li>
                <li><strong>For legal reasons</strong>, when required by law, legal process or to protect the rights, property or safety of TensaCo, our users or others.</li>
                <li><strong>In a corporate transaction</strong>, such as a merger, financing or acquisition, subject to this Policy.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'retention', title: 'Retention',
          body: (
            <ul>
              <li>Subscriptions: until you unsubscribe; we then keep a record of the unsubscription so we don’t contact you again.</li>
              <li>Accounts, support conversations and service requests: for as long as your account is active, and then as needed for legal, security and record-keeping purposes.</li>
              <li>Sessions: until they expire (30 days) or you sign out.</li>
              <li>Job applications and résumés: up to two years after the position is filled or closed, unless you ask us to delete them sooner or applicable law requires otherwise.</li>
              <li>Abuse-prevention records (hashed IP addresses and attempt logs): for a short period needed to enforce rate limits.</li>
            </ul>
          ),
        },
        {
          id: 'security', title: 'Security',
          body: (
            <p>
              We use administrative, technical and physical safeguards appropriate to the information we hold, including encrypted
              connections (HTTPS), salted password hashing, hashed session tokens stored only server-side, access limited to authorized
              personnel, and storage with established cloud providers. No method of transmission or storage is completely secure, and we
              cannot guarantee absolute security.
            </p>
          ),
        },
        {
          id: 'rights', title: 'Your rights and choices',
          body: (
            <>
              <p>Depending on where you live, you may have the right to:</p>
              <ul>
                <li>access the personal information we hold about you and receive a copy of it;</li>
                <li>correct inaccurate information (you can update your name and organization in your account profile);</li>
                <li>delete your information, including your account and job applications;</li>
                <li>object to or restrict certain processing, and withdraw consent where processing is based on consent;</li>
                <li>data portability; and</li>
                <li>lodge a complaint with your local data protection authority.</li>
              </ul>
              <p>
                To exercise these rights, write to {M} from the email address associated with your request. We will verify your request
                and respond within the time required by law. We will not discriminate against you for exercising your rights.
              </p>
              <h3>California residents</h3>
              <p>
                Under the California Consumer Privacy Act, as amended, California residents have the rights to know, delete and correct
                personal information, and to opt out of its sale or sharing. TensaCo does not sell or share personal information as those
                terms are defined, and does not use or disclose sensitive personal information for purposes other than those permitted.
                The categories of information we collect are described in section 1; we collect them from you directly and from your
                device when you use the Sites, for the purposes in section 2, and disclose them only as described in section 4.
              </p>
            </>
          ),
        },
        {
          id: 'transfers', title: 'International transfers',
          body: (
            <p>
              TensaCo is based in the United States, and our service providers may process information in the United States and other
              countries. Where required, we rely on appropriate safeguards for international transfers, such as the contractual
              commitments of our service providers.
            </p>
          ),
        },
        {
          id: 'children', title: 'Children',
          body: <p>The Sites are not directed to children under 16, and we do not knowingly collect their personal information. If you believe a child has provided us information, contact {M} and we will delete it.</p>,
        },
        {
          id: 'links', title: 'Third-party sites',
          body: <p>The Sites link to third-party sites, such as GitHub, PyPI, npm and social networks. Their privacy practices are governed by their own policies.</p>,
        },
        {
          id: 'changes', title: 'Changes to this Policy',
          body: <p>We may update this Policy from time to time. We will post the updated Policy on this page with a new “Last updated” date, and where changes are material we will provide additional notice.</p>,
        },
        {
          id: 'contact', title: 'Contact',
          body: <p>Questions about this Policy or our privacy practices: {M}.</p>,
        },
      ]}
    />
  )
}
