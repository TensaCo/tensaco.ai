import CLIPS from '@/data/broll.json'
import READOUT from '@/data/reservoir-readout.json'
import VALID from '@/data/sim-validation.json'
import s from './Close.module.css'

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className="wrap">
        <div className={s.foot}>
          <span>PHASER · a <a href="https://tensaco.ai">TensaCo</a> company</span>
          <span className={s.links}><a href="mailto:hello@tensaco.ai">hello@tensaco.ai</a><a href="/blog/">Blog</a><a href="/notes/">Methods &amp; sources</a><a href="https://github.com/TensaCo/phaser-design">Research</a></span>
        </div>
      </div>
    </footer>
  )
}

const r2 = (k: number) => READOUT.tasks.find((t) => t.id === `recall${k}`)!.test.r2.toFixed(2)
const NARMA = READOUT.tasks.find((t) => t.id === 'narma10')!

export function Receipts() {
  const R = [
    <><b>1,000× less energy per step.</b> Modeled, not built (Exp. 29, research/2026-09-14). One step of a 135,000-neuron dense layer: a GPU at 2 pJ per multiply–accumulate uses 36.6 mJ; PHASER on one 1080p modulator at 32 optical modes per neuron uses 0.037 mJ. Across 4–32 modes per neuron and layer sizes that fit one modulator the modeled gap is 490× to 31,000×. At today&apos;s simulated scale (4,096 modes) PHASER only matches an equally good digital system, and it has no advantage over sparse layers.</>,
    <><b>2 pJ vs 0.002 pJ per multiply.</b> Same model, same step: 36.6 mJ (GPU) and 0.037 mJ (PHASER) divided by the 1.83 × 10¹⁰ multiply–accumulates of one step of a 135,000-neuron dense layer. The field renderings are illustrations: a Gaussian light packet in vacuum, and a Bloch electron packet scattering in a diamond-cubic lattice.</>,
    <><b>6.7 ns per input.</b> Simulated: the research ring (preset &ldquo;Reflective SLM ring&rdquo;, 20 × 80 mm) has a 200 mm round-trip path (0.667 ns); one input step is K = 10 round trips (Exp. 15 and 29, research/2026-09-14).</>,
    <><b>150 M inputs per second.</b> 1 / 6.7 ns from one ring, with the input injected once every ten round trips (Exp. 20 capability envelope: &ldquo;6.7 ns/input → 150 MHz input rate&rdquo;).</>,
    <><b>Watch the light compute.</b> A live simulation in the browser of the Exp. 15/29 reservoir (&ldquo;Apre_lin&rdquo;): scalar field on a 64 × 64 grid at 20 µm, angular-spectrum propagation, LCOS SLM 64 × 64 with the preset random program, f = 40 mm relay, global gain clamp. The browser port matches the research simulator bit for bit over {(VALID.trips as number).toLocaleString('en-US')} round trips (apps/phaser/scripts/validate-sim.ts). The readout is a digital linear layer (256 weights + bias) trained offline with the research protocol (scripts/train-readout.ts): held-out r² {r2(5)} / {r2(10)} / {r2(20)} / {r2(30)} for recalling the input 5 / 10 / 20 / 30 steps back, NARMA10 NMSE {NARMA.test.nmse.toFixed(3)}, memory capacity {READOUT.memoryCapacity.toFixed(1)} (research Exp. 29 noise-free: 35.1 and 0.115). The page feeds a fresh random input stream, so its live score is out of sample. Noise-free: Exp. 29 finds this quality needs about 10¹⁰ circulating photons. No energy advantage is claimed at this size: Exp. 29 puts it at parity with a digital reservoir of equal quality.</>,
    <><b>128 weeks.</b> Wood Mackenzie (Aug 2025): power-transformer lead times of about 128 weeks in Q2 2025.</>,
    <><b>5 years+.</b> Lawrence Berkeley National Laboratory, <em>Queued Up</em> (2026 edition): the median time from grid-interconnection request to operation is over 5 years.</>,
    <><b>$400 B+.</b> IEA, <em>Energy and AI</em> (Apr 2025) and its 16 Apr 2026 update: the five largest tech companies spent over $400 B in 2025.</>,
    <><b>Footage.</b> Real b-roll from Pexels (Pexels License), Mixkit (free licence) and the US Senate Committee on Energy and Natural Resources (public domain). {(CLIPS as { attribution: string }[]).filter((c) => c.attribution).map((c) => c.attribution).join(' ')}</>,
    <><b>The machine.</b> The hero is the same simulation, drawn at true proportions around the SLM corner of the ring. Each beam cross-section is the simulated |E|² at that point, propagated with the model&apos;s angular-spectrum kernel; the model injects the input at the SLM plane. It runs about 2.4 billion times slower than the modeled device.</>,
  ]

  return (
    <main className={s.receipts}>
      <div className="wrap">
        <p className="eyebrow">Methods &amp; sources</p>
        <ol>{R.map((r, i) => <li key={i} id={`r${i + 1}`}>{r}</li>)}</ol>
        <div className={s.foot}><a href={`/`}>← PHASER</a><span>λ 650 nm</span></div>
      </div>
    </main>
  )
}
