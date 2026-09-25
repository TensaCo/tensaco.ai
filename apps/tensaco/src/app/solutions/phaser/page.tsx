import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { Band, Card, Hero, Split, Stats } from '@/components/Blocks'

export const metadata: Metadata = { title: 'PHASER — Optical AI acceleration', description: 'PHASER performs neural-network computation with light: modeled at about 1,000× less energy per step than a GPU.' }

export default function Phaser() {
  return (
    <>
      <Hero media={MEDIA.lab} eyebrow="Solutions · PHASER" title="AI acceleration at the speed of light."
        lead="PHASER performs neural-network computation with light instead of electricity, for AI infrastructure where power, cooling and latency set the limits.">
        <div className="btn-row">
          <a href="https://phaser.tensaco.ai" className="btn btn-primary">Visit phaser.tensaco.ai</a>
          <Link href="/contact/" className="btn btn-ghost">Discuss a partnership</Link>
        </div>
      </Hero>

      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.energy} eyebrow="The challenge" title="Electricity has become the limit on AI.">
            <p>Data centres worldwide used about 415 TWh of electricity in 2024, and the IEA’s base case reaches 945 TWh by 2030. Power, transformers and grid connections are now the bottleneck on new capacity.</p>
            <p>In a conventional processor, every multiplication is paid for in electricity, and nearly all of it leaves as heat.</p>
          </Split>
        </div>
      </section>

      <section className="section mist">
        <div className="wrap">
          <Split media={MEDIA.labOptics} reverse eyebrow="The approach" title="Computation performed by light.">
            <p>PHASER circulates light between two mirrors through a stack of programmable spatial light modulators. Each pass through the stack performs a step of computation; the interference of light does the arithmetic.</p>
            <p>The design uses components the telecom and display industries already manufacture by the million: no new fabrication plants and no exotic materials.</p>
          </Split>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">Performance</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>What the models and simulations show.</h2>
          <Stats items={[
            { value: '~1,000×', label: 'less energy per step', note: 'vs. a GPU, modeled at one megapixel of optics' },
            { value: '6.7 ns', label: 'per step', note: 'simulated' },
            { value: '10B', label: 'steps per second per stack', note: 'modeled, 67 wavefronts in flight' },
            { value: '0', label: 'new fabs required', note: 'off-the-shelf supply chains' },
          ]} />
          <p className="note" style={{ marginTop: 32, maxWidth: '60em' }}>
            PHASER is in the research stage. Figures are from simulation and energy modeling (published research, Experiment 29),
            not a built device. At today’s simulated scale the energy per step matches an equally capable digital system; the
            advantage grows with scale against dense layers.
          </p>
        </div>
      </section>

      <section className="section mist">
        <div className="wrap">
          <p className="eyebrow">Applications</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>Where PHASER fits.</h2>
          <div className="grid-3">
            <Card media={MEDIA.datacenterPhoto} title="AI data centres"><p>Dense neural-network layers at a fraction of the energy per step, easing power and cooling budgets.</p></Card>
            <Card media={MEDIA.operations} title="Low-latency inference"><p>A computation step every 6.7 ns, with no weights fetched from memory.</p></Card>
            <Card media={MEDIA.energyPhoto} title="Energy-constrained sites"><p>More AI capacity where new grid connections take years to arrive.</p></Card>
          </div>
        </div>
      </section>

      <Band media={MEDIA.boardroom} title="Partner with us on the first PHASER systems.">
        <p className="lead" style={{ maxWidth: '36em', marginTop: 20 }}>We are working with research and infrastructure partners as PHASER moves from simulation to the bench.</p>
        <div className="btn-row"><Link href="/contact/" className="btn btn-primary">Contact our team</Link><a href="https://phaser.tensaco.ai" className="btn btn-ghost">phaser.tensaco.ai</a></div>
      </Band>
    </>
  )
}
