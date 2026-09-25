import CLIPS from '@/data/broll.json'
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

const REPORT = 'https://github.com/TensaCo/phaser-design/blob/main/research/2026-09-14/REPORT.md'
const NOTES = 'https://github.com/TensaCo/phaser-design/blob/main/research/notes/energy-per-multiply.md'

/** footnote anchors used across the page: <sup className="fn"><a href="/notes/#energy">…</a></sup> */
export const FN = { energy: 1, pj: 2, steps: 3, loss: 4, machine: 5, figure: 6, weeks: 7, years: 8, capex: 9 } as const

export function Receipts() {
  const pct = (x: number) => Math.round(x * 100)
  const R: [keyof typeof FN | 'footage', React.ReactNode][] = [
    ['energy', <><b>200–3,000× less energy per step.</b> Modeled, not built (<a href={REPORT}>research/2026-09-14</a>, Exps. 31 and 34; <a href={NOTES}>notes/energy-per-multiply.md</a>). Compared with an equally capable dense recurrent network (echo-state network) on an 8-bit chip at 0.2 pJ per multiply-accumulate, with PHASER extrapolated to a million optical modes. Extrapolated from simulations up to 65,000 modes, assuming the measured equivalence of 16–64 optical modes per neuron continues, and with detector channels growing with the modes (about 6 × 10⁴ at 10⁶ modes). At today&apos;s simulated size (4,096 modes) PHASER is at parity with small digital networks, simple digital algorithms (NG-RC) remain cheaper on standard benchmarks, and sparse networks remove the advantage.</>],
    ['pj', <><b>1 pJ vs 0.001 pJ per multiply.</b> Today&apos;s AI chips spend roughly 0.7–2 pJ per multiply-accumulate at chip level (NVIDIA H100 INT8 ≈ 0.71 pJ, Google TPU v4 ≈ 1.24 pJ, H100 BF16 ≈ 2 pJ), and far more when weights stream from memory. PHASER: 0.06–1 fJ (0.00006–0.001 pJ) per <em>equivalent</em> multiply, modeled at 10⁶ optical modes. An equivalent multiply is PHASER&apos;s energy per input step divided by the multiply-accumulates per step (N² + N) of the dense recurrent network of N neurons it matches in task quality. Modeled, not measured; sources and derivation in <a href={NOTES}>the notes</a>, Exp. 34.</>],
    ['steps', <><b>Up to 10 B steps per second.</b> Modeled (Exps. 32 and 34): several light pulses in flight at once, each an independent input stream sharing one optical program. In simulation the per-stream quality held up to 80 pulses. 13 pulses in the tuned ring give 8.9 × 10⁹ input steps/s; the plate stack (3.9 × 10⁹ per stream) reaches 10¹⁰ with about 3. Without multiplexing: 0.75–4 billion steps/s per stream. Needs a gain medium that recovers within about 1 ns, pulse-to-pulse leakage in the cavity below 10⁻³ per trip, and about 13 GHz detection on every readout channel (256 channels). No pulsed hardware has been built.</>],
    ['loss', <><b>Light loses 10–30 % per round trip.</b> Realistic builds, modeled in Exp. 33: mirrors, modulators and glass coatings; bulk absorption in the glass is about 0.3 % of the light per trip. The gain medium replaces the loss every trip, so the state keeps circulating; the pump is what PHASER pays for, along with detection and readout electronics (Exp. 34).</>],
    ['machine', <><b>Watch the light compute.</b> A live simulation in the browser of the research&apos;s linear stack (arch.ts <code>stackCavity</code>, Exps. 30 and 33), with the research simulator&apos;s own config: a 5 % input/output coupler with the gain (global saturation, G₀ 1.35, Exp. 30&apos;s operating point) and its 10 mm host crystal; four fabricated fused-silica phase plates, 64 × 64 pixels at 20 µm, random programs (depth 0.1), 1 mm thick with 0.1 % coatings, 5 mm apart; and a concave end mirror (R 120 mm, 99.9 %). One round trip per input step. Scalar field on a 64 × 64 grid at 20 µm, angular-spectrum propagation, air. Round trip {((VALID.tripTime.port as number) * 1e9).toFixed(3)} ns including the glass; passive retention of the dominant mode {pct(VALID.passiveRetention as number)} % per trip (Exp. 33: 79 %). A stack of today&apos;s transmissive LC panels keeps only about 0.5 % per round trip (Exp. 33), which is why the stack uses fabricated plates; a programmable reflective SLM (dielectric LCOS, about 95 %) can serve as the end mirror. The browser port matches the research simulator bit for bit over {(VALID.trips as number).toLocaleString('en-US')} round trips (apps/phaser/scripts/validate-sim.ts).</>],
    ['figure', <><b>The drawings.</b> The hero and Fig. 2 draw the same simulation at true proportions; each drawn wavefront&apos;s cross-section is the simulated |E|² at its plane on its round trip. The model is continuous-wave, so the many wavefronts in flight stand for time-multiplexed pulses; crests are stylised. The electrons-and-light figure is a physics-motivated illustration, not a device model: atoms drawn as points sampled from a 1s orbital density, electrons hopping between atoms by two-site tunnelling that mostly falls back, each completed hop shaking the lattice (heat); light as 650 nm wave packets whose fringes close up by n = 1.5 inside the glass. Depth of field is drawn: the front layer is in focus.</>],
    ['weeks', <><b>128 weeks.</b> Wood Mackenzie (Aug 2025): power-transformer lead times of about 128 weeks in Q2 2025.</>],
    ['years', <><b>5 years+.</b> Lawrence Berkeley National Laboratory, <em>Queued Up</em> (2026 edition): the median time from grid-interconnection request to operation is over 5 years.</>],
    ['capex', <><b>$400 B+.</b> IEA, <em>Energy and AI</em> (Apr 2025) and its 16 Apr 2026 update: the five largest tech companies spent over $400 B in 2025.</>],
    ['footage', <><b>Footage.</b> Real b-roll from Pexels (Pexels License), Mixkit (free licence) and the US Senate Committee on Energy and Natural Resources (public domain). {(CLIPS as { attribution: string }[]).filter((c) => c.attribution).map((c) => c.attribution).join(' ')}</>],
  ]

  return (
    <main className={s.receipts}>
      <div className="wrap">
        <p className="eyebrow">Methods &amp; sources</p>
        <ol>{R.map(([id, r]) => <li key={id} id={id}>{r}</li>)}</ol>
        <div className={s.rfoot}><a href={`/`}>← PHASER</a><span>λ 650 nm</span></div>
      </div>
    </main>
  )
}

/** a footnote marker linking to the methods page */
export function Fn({ id }: { id: keyof typeof FN }) {
  return <sup className="fn"><a href={`/notes/#${id}`}>{FN[id]}</a></sup>
}
