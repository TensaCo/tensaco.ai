import type { Metadata } from 'next'
import Link from 'next/link'
import { Legal } from '@/components/legal/Legal'

export const metadata: Metadata = { title: 'Terms of Use', description: 'The terms that govern your use of TensaCo’s websites, accounts and services.' }

const M = <a href="mailto:hello@tensaco.ai?subject=Terms%20of%20Use">hello@tensaco.ai</a>

export default function Terms() {
  return (
    <Legal
      title="Terms of Use"
      updated="September 24, 2026"
      intro={
        <>
          <p>
            These Terms of Use (“Terms”) govern your access to and use of tensaco.ai, phaser.tensaco.ai and related websites (the
            “Sites”), TensaCo accounts, the customer portal, and any services TENSACO INC, a Delaware corporation (“TensaCo,” “we,” “us” or “our”) makes
            available through them (together with the Sites, the “Services”).
          </p>
          <p>
            <strong>By accessing or using the Services, you agree to these Terms.</strong> If you are using the Services on behalf of an
            organization, you represent that you have authority to bind that organization, and “you” includes it. If you do not agree,
            do not use the Services.
          </p>
        </>
      }
      sections={[
        {
          id: 'eligibility', title: 'Eligibility',
          body: <p>You must be at least 16 years old, and old enough to form a binding contract where you live, to use the Services. You may not use the Services if you are barred from doing so under applicable law, including export control and sanctions laws.</p>,
        },
        {
          id: 'accounts', title: 'Accounts',
          body: (
            <ul>
              <li>You must provide accurate information when you create an account and keep it up to date.</li>
              <li>You are responsible for keeping your password confidential and for all activity under your account. Notify us at {M} of any unauthorized use.</li>
              <li>We may suspend or close accounts that violate these Terms or that we reasonably believe pose a security risk.</li>
              <li>You may close your account at any time by contacting us.</li>
            </ul>
          ),
        },
        {
          id: 'services', title: 'Services, early access and research-stage technology',
          body: (
            <>
              <p>
                Some Services are offered as early access, evaluation, research collaboration or alpha software. PHASER is a research-stage
                technology; figures describing its performance are the results of simulation and modeling, not measurements of a built
                system. Service requests submitted through the portal are requests only: submitting one does not create an obligation for
                TensaCo to provide the service, and any service we agree to provide will be governed by a separate written agreement.
              </p>
              <p>We may change, suspend or discontinue any part of the Services at any time.</p>
            </>
          ),
        },
        {
          id: 'acceptable-use', title: 'Acceptable use',
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>use the Services in violation of any law or the rights of others;</li>
                <li>attempt to gain unauthorized access to the Services, other accounts or our systems, or probe, scan or test their vulnerability without our written permission;</li>
                <li>interfere with or disrupt the Services, including by overloading them or circumventing rate limits;</li>
                <li>submit false, misleading or impersonating information, including in applications or service requests;</li>
                <li>upload malware or content that is unlawful, infringing, harassing or abusive;</li>
                <li>scrape or harvest information from the Services by automated means, except as permitted by robots.txt; or</li>
                <li>use the Services to build a competing service or to reverse engineer non-public parts of them, except as permitted by law.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'your-content', title: 'Your content',
          body: (
            <p>
              You keep ownership of the content you submit, such as support messages, service request details and application materials
              (“Your Content”). You grant TensaCo a non-exclusive, worldwide, royalty-free license to host, store, reproduce and use Your
              Content only as needed to provide and improve the Services and to respond to you. You represent that you have the rights
              needed to submit Your Content.
            </p>
          ),
        },
        {
          id: 'feedback', title: 'Feedback',
          body: <p>If you send us suggestions or feedback, you agree that we may use them without restriction or compensation to you.</p>,
        },
        {
          id: 'ip', title: 'Intellectual property',
          body: (
            <p>
              The Services, including their design, text, graphics, logos and software, are owned by TensaCo or its licensors and are
              protected by intellectual property laws. TensaCo, PHASER and TensorCode are trademarks of TensaCo Inc. Except for rights
              expressly granted in these Terms or in an open-source license, no rights are granted to you. Photographs and videos on the
              Sites are used under license from their owners.
            </p>
          ),
        },
        {
          id: 'open-source', title: 'Open-source software',
          body: <p>Software that TensaCo releases under an open-source license, such as TensorCode and the PHASER simulator, is governed by that license, which controls over these Terms for that software.</p>,
        },
        {
          id: 'third-parties', title: 'Third-party services and links',
          body: <p>The Services may link to or rely on third-party websites and services. We are not responsible for them, and your use of them is governed by their terms.</p>,
        },
        {
          id: 'forward-looking', title: 'Forward-looking statements',
          body: (
            <p>
              The Sites, including the investor pages, contain forward-looking statements about TensaCo’s technology, products, plans,
              milestones and markets. They are based on current expectations and assumptions, involve risks and uncertainties, and are
              not guarantees of future results; actual results may differ materially. Modeled and simulated performance figures may not be
              achieved in built systems. Nothing on the Sites is an offer to sell or a solicitation of an offer to buy any security.
              TensaCo undertakes no obligation to update forward-looking statements.
            </p>
          ),
        },
        {
          id: 'disclaimers', title: 'Disclaimers',
          body: (
            <p>
              THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED OR STATUTORY,
              INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT, AND ANY WARRANTIES
              ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. TENSACO DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE OR
              ERROR-FREE, OR THAT ANY INFORMATION ON THEM IS ACCURATE OR COMPLETE.
            </p>
          ),
        },
        {
          id: 'liability', title: 'Limitation of liability',
          body: (
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TENSACO AND ITS AFFILIATES, OFFICERS, EMPLOYEES AND AGENTS WILL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA OR
              GOODWILL, ARISING FROM OR RELATING TO THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TENSACO’S TOTAL
              LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES WILL NOT EXCEED ONE HUNDRED US DOLLARS (US $100). SOME JURISDICTIONS DO NOT
              ALLOW THESE LIMITATIONS, SO THEY MAY NOT APPLY TO YOU.
            </p>
          ),
        },
        {
          id: 'indemnity', title: 'Indemnity',
          body: <p>You will indemnify and hold harmless TensaCo from claims, damages, liabilities and expenses (including reasonable attorneys’ fees) arising from your violation of these Terms or misuse of the Services.</p>,
        },
        {
          id: 'termination', title: 'Suspension and termination',
          body: <p>We may suspend or terminate your access to the Services at any time if we reasonably believe you have violated these Terms or to protect the Services or others. Sections that by their nature should survive termination will survive, including sections 5, 7 and 10 through 15.</p>,
        },
        {
          id: 'law', title: 'Governing law and disputes',
          body: <p>These Terms are governed by the laws of the State of Delaware and applicable federal law of the United States, without regard to conflict-of-laws rules. Subject to the informal-resolution step below, any claim not subject to the jurisdiction of a small-claims court will be brought exclusively in the state or federal courts located in Delaware, and you and TensaCo consent to personal jurisdiction there. Before filing a claim, you agree to contact us at {M} and attempt to resolve the dispute informally for at least 30 days.</p>,
        },
        {
          id: 'changes', title: 'Changes to these Terms',
          body: <p>We may update these Terms from time to time. We will post the updated Terms on this page with a new “Last updated” date. If changes are material, we will provide additional notice. Continued use of the Services after changes take effect means you accept them.</p>,
        },
        {
          id: 'general', title: 'General',
          body: <p>These Terms, together with our <Link href="/legal/privacy/">Privacy Policy</Link> and any separate written agreement, are the entire agreement between you and TensaCo about the Services. If any provision is unenforceable, the rest remain in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition or sale of assets.</p>,
        },
        {
          id: 'contact', title: 'Contact',
          body: <p>Questions about these Terms: {M}.</p>,
        },
      ]}
    />
  )
}
