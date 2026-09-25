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

export function Receipts() {
  const R = [
    <><b>1,000× less energy per step.</b> Modeled, not built (Exp. 29, research/2026-09-14). One step of a 135,000-neuron dense layer: a GPU at 2 pJ per multiply–accumulate uses 36.6 mJ; PHASER on one 1080p modulator at 32 optical modes per neuron uses 0.037 mJ. Across 4–32 modes per neuron and layer sizes that fit one modulator the modeled gap is 490× to 31,000×. At today&apos;s simulated scale (4,096 modes) PHASER only matches an equally good digital system, and it has no advantage over sparse layers.</>,
    <><b>2 pJ vs 0.002 pJ per multiply.</b> Same model, same step: 36.6 mJ (GPU) and 0.037 mJ (PHASER) divided by the 1.83 × 10¹⁰ multiply–accumulates of one step of a 135,000-neuron dense layer. The electrons-and-light figure is a physics-motivated illustration, not a device model: atoms drawn as points sampled from a 1s orbital density, electrons hopping between atoms by two-site tunnelling that mostly falls back, with each completed hop shaking the lattice (heat); light as 650 nm wave packets whose fringes close up by n = 1.5 inside the glass. Depth of field is drawn: the front layer is in focus.</>,
    <><b>10 B steps per second.</b> Modeled: each wavefront completes a step every 6.7 ns (≈150 M steps/s). With 100 GHz modulators and detectors, wavefronts can be spaced 10 ps apart, so 0.667 ns / 10 ps ≈ 67 are in flight at once; 67 × 150 M ≈ 10 B steps/s. Assumes the gain medium and detectors keep up and that wavefronts do not cross-talk.</>,
    <><b>Watch the light compute.</b> A live simulation in the browser of a linear-stack cavity built with the research simulator (TensaCo/phaser-design): input mirror/coupler (8 % in and out) with a global gain clamp, four transmissive LCD phase planes (64 × 64 px at 63.5 µm, 1.8π, 256 levels, γ 1.1, the research&apos;s realistic LCD losses, random programs seeds 20–23, depth 0.1) 4.8 mm apart, and a concave end mirror (R 400 mm, 97 %) 24 mm from the input mirror. Scalar field on a 128 × 128 grid at 31.75 µm, angular-spectrum propagation, air. Round trip 48 mm = {((VALID.tripTime.port as number) * 1e9).toFixed(3)} ns; passive loss {Math.round((1 - (VALID.passiveRetention.port as number)) * 100)} % per trip, replaced by the clamped gain. The browser port matches the research simulator bit for bit over {(VALID.trips as number).toLocaleString('en-US')} round trips (apps/phaser/scripts/validate-sim.ts). The model is continuous-wave: the drawn wavefronts mark positions along the round trip, and each shows the simulated |E|² at its plane.</>,
    <><b>128 weeks.</b> Wood Mackenzie (Aug 2025): power-transformer lead times of about 128 weeks in Q2 2025.</>,
    <><b>5 years+.</b> Lawrence Berkeley National Laboratory, <em>Queued Up</em> (2026 edition): the median time from grid-interconnection request to operation is over 5 years.</>,
    <><b>$400 B+.</b> IEA, <em>Energy and AI</em> (Apr 2025) and its 16 Apr 2026 update: the five largest tech companies spent over $400 B in 2025.</>,
    <><b>Footage.</b> Real b-roll from Pexels (Pexels License), Mixkit (free licence) and the US Senate Committee on Energy and Natural Resources (public domain). {(CLIPS as { attribution: string }[]).filter((c) => c.attribution).map((c) => c.attribution).join(' ')}</>,
    <><b>The machine.</b> The hero is the same linear-stack simulation, drawn at true proportions. Each drawn wavefront&apos;s cross-section is the simulated |E|² at its plane on its round trip, computed with the model&apos;s angular-spectrum kernel. It runs about 20 billion times slower than the modeled device.</>,
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
