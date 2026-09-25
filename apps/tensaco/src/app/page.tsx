import { Subscribe } from '@/components/Subscribe'
import s from './page.module.css'

const VALUES = [
  { n: '01', t: 'Insatiable curiosity', d: 'We are driven by a hunger to unravel the mysteries that have eluded us for so long. Every company here started as a question we could not put down.' },
  { n: '02', t: 'Past the limits of prior technology', d: 'We start from first principles and aim beyond what every known technology can do, not a few percent better than it.' },
  { n: '03', t: 'Intelligence that amplifies people', d: 'Superintelligence should empower us, lead to awe-inspiring discoveries, and amplify the beauty of our shared human experience.' },
  { n: '04', t: 'Compounding leverage', d: 'We look for the move that bootstraps decades of human effort at very low cost, then build on it again.' },
]

export default function Home() {
  return (
    <>
      <header className={s.top}>
        <a href="/" className={s.mark}>TensaCo</a>
        <nav className={s.nav} aria-label="Site">
          <a href="#companies">Companies</a>
          <a href="#values">Values</a>
          <a href="#investors">Investors</a>
          <a href="mailto:hello@tensaco.ai">Contact</a>
          <a href="#updates" className={s.navCta}>Updates</a>
        </nav>
      </header>

      <main>
        <section className={`wrap ${s.hero}`}>
          <p className="label">TensaCo Inc.</p>
          <h1 className={s.h1}>We are building artificial <em>superintelligence</em>.</h1>
          <p className={s.lede}>
            TensaCo is a company of companies. Each one removes a single limit that stands between today’s AI and the
            intelligence we believe is coming: what it costs to compute, and whether people can trust and own what it does.
          </p>
        </section>

        <section className={`wrap ${s.companies}`} id="companies" aria-labelledby="companies-h">
          <div className={s.head}><p className="label">Our companies</p><h2 id="companies-h" className={s.h2}>Two bets, one direction.</h2></div>
          <div className={s.cards}>
            <a className={`${s.card} ${s.phaser}`} href="https://phaser.tensaco.ai">
              <span className={s.phaserMark}>PHASER</span>
              <span className={s.phaserLine}>A neural accelerator that runs at the <b>speed of light</b>.</span>
              <dl className={s.facts}>
                <div><dt>Removes</dt><dd>The energy cost of computation</dd></div>
                <div><dt>For</dt><dd>AI infrastructure and the teams paying its power bill</dd></div>
                <div><dt>Stage</dt><dd>Research: simulated, modeled at ~1,000× less energy per step than a GPU</dd></div>
              </dl>
              <span className={s.go}>phaser.tensaco.ai →</span>
            </a>
            <a className={`${s.card} ${s.tc}`} href="https://tensorcode.dev">
              <span className={s.tcMark}>TensorCode</span>
              <span className={s.tcLine}>AI your team can <b>check, correct, and own</b>.</span>
              <dl className={s.facts}>
                <div><dt>Removes</dt><dd>The opacity of AI inside software</dd></div>
                <div><dt>For</dt><dd>Engineering teams building AI features they must answer for</dd></div>
                <div><dt>Stage</dt><dd>0.4 alpha, open source, Python and TypeScript</dd></div>
              </dl>
              <span className={s.go}>tensorcode.dev →</span>
            </a>
          </div>
        </section>

        <section className={`wrap ${s.values}`} id="values" aria-labelledby="values-h">
          <div className={s.head}><p className="label">What we believe</p><h2 id="values-h" className={s.h2}>The same values since 2023.</h2></div>
          <ol className={s.valueList}>
            {VALUES.map((v) => (
              <li key={v.n}><span className={s.vn}>{v.n}</span><h3>{v.t}</h3><p>{v.d}</p></li>
            ))}
          </ol>
        </section>

        <section className={`wrap ${s.investors}`} id="investors" aria-labelledby="investors-h">
          <div className={s.head}><p className="label">For investors</p><h2 id="investors-h" className={s.h2}>Why a company of companies.</h2></div>
          <div className={s.thesis}>
            <div>
              <h3>The thesis</h3>
              <p>
                AI is limited by two scarce inputs: <b>energy</b> and <b>trust</b>. Compute demand is outrunning the grid, and
                models ship into software nobody can inspect or correct. PHASER attacks the first by moving computation from
                electrons to light. TensorCode attacks the second by making learned behaviour something a team can review,
                retrain and own.
              </p>
            </div>
            <div>
              <h3>The structure</h3>
              <p>
                Each company has its own product, customers and roadmap, and can raise, partner and hire on its own terms.
                TensaCo Inc. holds them, shares research and infrastructure across them, and starts the next one when a new
                limit comes into view.
              </p>
            </div>
            <div>
              <h3>Where things stand</h3>
              <ul>
                <li><b>PHASER:</b> open simulator and published research; energy and throughput modeled, bench prototype next.</li>
                <li><b>TensorCode:</b> released on PyPI and npm as <code>tensorcode</code>; alpha checkpoints and validation published.</li>
              </ul>
            </div>
          </div>
          <p className={s.contact}>
            Investor and partnership conversations: write to <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a>.
          </p>
        </section>

        <section className={`wrap ${s.updates}`} id="updates" aria-labelledby="updates-h">
          <h2 id="updates-h" className={s.h2}>Hear from us when there is something real to show.</h2>
          <Subscribe source="home" />
        </section>
      </main>

      <footer className={`wrap ${s.foot}`}>
        <span>© 2026 TensaCo Inc.</span>
        <span className={s.footLinks}>
          <a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a>
          <a href="https://phaser.tensaco.ai">PHASER</a>
          <a href="https://tensorcode.dev">TensorCode</a>
          <a href="https://github.com/TensaCo">GitHub</a>
          <a href="https://x.com/TensacoInc">X</a>
          <a href="https://discord.gg/AZaBpQTv">Discord</a>
        </span>
      </footer>
    </>
  )
}
