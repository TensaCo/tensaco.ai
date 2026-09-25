import type { Metadata } from 'next'
import { LIVE, MILESTONES, TRACTION } from '@/data/traction'
import { formatDate } from '@/data/news'
import { Subscribe } from '@/components/Subscribe'
import s from './investors.module.css'

export const metadata: Metadata = { title: 'Investors', description: 'TensaCo investor information: company overview, traction, milestones and contact.' }

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const num = (n: number | null) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(n))

export default function Investors() {
  const t = TRACTION
  const totals = t.pipeline.reduce((a, r) => a + r.phaser + r.tensorcode, 0)
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className="wrap">
          <p className="eyebrow">Investors</p>
          <h1 className={s.title}>Investor relations</h1>
          <p className={s.intro}>TensaCo develops technology for the two constraints that will shape the next decade of AI: the energy cost of computation, and the accountability of AI in real decisions.</p>
          <nav className={s.subnav} aria-label="On this page">
            <a href="#overview">Overview</a><a href="#traction">Traction</a><a href="#milestones">Milestones</a><a href="#thesis">Thesis</a><a href="#market">Market</a><a href="#materials">Materials</a><a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <section className={s.sec} id="overview">
        <div className={`wrap ${s.two}`}>
          <div><h2 className={s.h2}>Company at a glance</h2><p className={s.lead}>A deep-technology company with one hardware and one software business line, each with its own product, customers and roadmap.</p></div>
          <dl className={s.facts}>
            <div><dt>Company</dt><dd>TensaCo Inc.</dd></div>
            <div><dt>Business lines</dt><dd>PHASER — optical AI acceleration<br />TensorCode — accountable AI software</dd></div>
            <div><dt>Stage</dt><dd>PHASER: research and simulation<br />TensorCode: 0.4 alpha, open source</dd></div>
            <div><dt>Distribution</dt><dd>TensorCode on PyPI and npm; PHASER research and simulator on GitHub</dd></div>
            <div><dt>Leadership</dt><dd>Jacob Valdez, Founder and CEO</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:hello@tensaco.ai?subject=Investor%20inquiry">hello@tensaco.ai</a></dd></div>
          </dl>
        </div>
      </section>

      <section className={`${s.sec} ${s.mist}`} id="traction">
        <div className="wrap">
          <div className={s.secHead}><h2 className={s.h2}>Traction</h2><span className={s.asof}>Commercial figures as of {formatDate(t.asOf)} · adoption figures updated {formatDate(LIVE.fetchedAt.slice(0, 10))}</span></div>
          <h3 className={s.h3}>Commercial</h3>
          <div className={s.tiles}>
            <div><b>{t.lettersOfIntent}</b><span>Letters of intent signed</span></div>
            <div><b>{t.designPartners}</b><span>Design partners</span></div>
            <div><b>{t.paidPilots}</b><span>Paid pilots</span></div>
            <div><b>{usd(t.contractedRevenueUsd)}</b><span>Contracted revenue</span></div>
          </div>
          <h3 className={s.h3}>Adoption</h3>
          <div className={s.tiles}>
            <div><b>{num(LIVE.pypiLastMonth)}</b><span>TensorCode downloads, PyPI, last 30 days</span></div>
            <div><b>{LIVE.npmLastMonth == null ? '—' : num(LIVE.npmLastMonth)}</b><span>TensorCode downloads, npm, last 30 days{LIVE.npmLastMonth == null && <em> not yet reported by npm</em>}</span></div>
            <div><b>{num(LIVE.githubStars)}</b><span>GitHub stars across {num(LIVE.publicRepos)} public repositories</span></div>
            <div><b>29</b><span>PHASER research experiments published</span></div>
          </div>
          <h3 className={s.h3}>Commercial pipeline</h3>
          <table className={s.table}>
            <thead><tr><th>Stage</th><th>PHASER</th><th>TensorCode</th><th>Total</th></tr></thead>
            <tbody>
              {t.pipeline.map((r) => <tr key={r.stage}><td>{r.stage}</td><td>{r.phaser}</td><td>{r.tensorcode}</td><td>{r.phaser + r.tensorcode}</td></tr>)}
              <tr className={s.total}><td>All stages</td><td>{t.pipeline.reduce((a, r) => a + r.phaser, 0)}</td><td>{t.pipeline.reduce((a, r) => a + r.tensorcode, 0)}</td><td>{totals}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.sec} id="milestones">
        <div className="wrap">
          <h2 className={s.h2}>Milestones</h2>
          <ol className={s.timeline}>
            {MILESTONES.map((m) => (
              <li key={m.what} className={m.done ? s.done : s.next}>
                <span className={s.when}>{m.when}</span>
                <span className={s.what}>{m.what}</span>
                <span className={s.tag}>{m.product}{m.done ? '' : ' · planned'}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${s.sec} ${s.navy}`} id="thesis">
        <div className="wrap">
          <h2 className={s.h2}>Investment thesis</h2>
          <div className={s.three}>
            <div><h3>The constraint has moved</h3><p>AI’s growth is now limited by power and grid capacity. Data-centre electricity is projected to more than double by 2030, and new capacity waits years for transformers and grid connections.</p></div>
            <div><h3>Change the cost of a computation</h3><p>PHASER performs neural-network computation with light. Modeled at one megapixel of optics, it uses about 1,000× less energy per step than a GPU, using parts the telecom and display industries already make.</p></div>
            <div><h3>Make AI accountable</h3><p>TensorCode turns learned behaviour into programs teams can review, correct and retrain, the precondition for AI in decisions organizations answer for.</p></div>
          </div>
        </div>
      </section>

      <section className={s.sec} id="market">
        <div className="wrap">
          <h2 className={s.h2}>Market context</h2>
          <div className={s.tiles}>
            <div><b>945 TWh</b><span>Data-centre electricity in 2030, up from 415 TWh in 2024</span><em>IEA, Energy and AI, base case</em></div>
            <div><b>128 weeks</b><span>Lead time for a large power transformer</span><em>Wood Mackenzie, Q2 2025</em></div>
            <div><b>5+ years</b><span>Median wait to connect new US generation to the grid</span><em>LBNL, Queued Up 2026</em></div>
            <div><b>$400B+</b><span>AI infrastructure spend by the five largest tech companies in 2025</span><em>IEA</em></div>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.mist}`} id="materials">
        <div className="wrap">
          <h2 className={s.h2}>Materials</h2>
          <ul className={s.docs}>
            <li><span>Investor presentation</span><a href="mailto:hello@tensaco.ai?subject=Investor%20presentation%20request">Request</a></li>
            <li><span>PHASER research report (Experiments 1–29)</span><a href="https://github.com/TensaCo/phaser-design/blob/main/research/2026-09-14/REPORT.md">View</a></li>
            <li><span>PHASER energy model and data</span><a href="https://github.com/TensaCo/phaser-design/tree/main/research/2026-09-14/out/29">View</a></li>
            <li><span>TensorCode documentation and validation</span><a href="https://tensorcode.dev/docs/">View</a></li>
          </ul>
        </div>
      </section>

      <section className={s.sec} id="contact">
        <div className={`wrap ${s.two}`}>
          <div><h2 className={s.h2}>Investor contact</h2><p className={s.lead}>For investment, financing and partnership discussions: <a href="mailto:hello@tensaco.ai?subject=Investor%20inquiry">hello@tensaco.ai</a></p></div>
          <div><h3 className={s.h3} style={{ marginTop: 0 }}>Company and investor updates</h3><Subscribe source="investors" /></div>
        </div>
        <div className="wrap"><p className={s.disclaimer}>This page contains forward-looking statements, including about technology performance, products and milestones, which involve risks and uncertainties; see <a href="/legal/terms/#forward-looking">Forward-looking statements</a>. PHASER performance figures are from simulation and modeling. Nothing on this page is an offer to sell or a solicitation of an offer to buy securities.</p></div>
      </section>
    </div>
  )
}
