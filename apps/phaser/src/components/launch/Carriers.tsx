'use client'
/**
 * Electrons and light, one illustration (physics-motivated, not a device model).
 *
 * Three depth layers, the front one in focus and the ones behind it progressively blurred (a shallow depth of field).
 * - Light (red, above): a steady rain of short 650 nm wave packets falling onto a glass slab. Each is drawn as its intensity
 *   fringes under a Gaussian envelope. The packets are laid out in optical path, so inside the glass (n = 1.5) they slow to
 *   c/1.5 and their fringes close up by the same factor, then leave the far side unchanged.
 * - Electrons (paper and graphite, below): atoms as a nucleus inside a cloud of points sampled from a 1s orbital density.
 *   A conduction electron is a denser cloud sampled from its current site. To hop it tunnels: its density leaks partly into
 *   the neighbouring atom's cloud and back (two-site tunnelling, weight w(t) oscillating), and only sometimes the
 *   lattice "measures" it on the far side. Most attempts fall back. Every completed hop leaves the lattice shaking (the
 *   nuclei jitter, a graphite ring spreads): that vibration is heat. Hops into the glass never succeed: it is an insulator.
 */
import { useEffect, useRef } from 'react'
import { Fn } from './Close'
import s from './Carriers.module.css'

/** Energy per multiply. Edit here only. Sources: research/notes/energy-per-multiply.md (Exp. 34).
 *  silicon: today's AI chips at chip level, 0.7–2 pJ per multiply-accumulate (H100 INT8 0.71, TPU v4 1.24, H100 BF16 ≈ 2).
 *  light: PHASER per *equivalent* multiply, modeled at 10⁶ optical modes: 0.06–1 fJ = 0.00006–0.001 pJ (upper end shown). */
export const CARRIER_NUMBERS = {
  silicon: { pj: 1, digits: 0, range: '0.7–2 pJ' },
  light: { pj: 0.001, digits: 3, range: '0.06–1 fJ' },
}

const GLASS = { top: 0.42, bottom: 0.53, n: 1.5 }
const LAYERS = [
  { scale: 1, blur: 0, alpha: 1, seed: 1, rain: 9 },
  { scale: 0.76, blur: 1.8, alpha: 0.75, seed: 2, rain: 13 },
  { scale: 0.58, blur: 4.5, alpha: 0.5, seed: 3, rain: 18 },
]

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())
/** a point of a 1s orbital density |ψ|² ∝ e^{−2r/a}, projected onto the page */
function orbital(r: () => number, a: number): [number, number] {
  const rad = -(a / 2) * Math.log((r() || 1e-9) * (r() || 1e-9) * (r() || 1e-9)) // Γ(3, a/2): radial density r² e^{−2r/a}
  const z = 2 * r() - 1, ph = 2 * Math.PI * r(), q = Math.sqrt(1 - z * z)
  return [rad * q * Math.cos(ph), rad * q * Math.sin(ph)]
}

interface Photon { u: number; path: number; speed: number }
interface Electron { site: number; to: number; w: number; t: number; dur: number; wmax: number; ok: boolean; phase: 'dwell' | 'try' | 'settle'; dwell: number; glassTries: number }
interface Atom { x: number; y: number; row: number; col: number; cloud: Float32Array; jitter: number }
interface Ring { x: number; y: number; t: number }

class Layer {
  readonly rand: () => number
  photons: Photon[] = []
  atoms: Atom[] = []
  electrons: Electron[] = []
  rings: Ring[] = []
  cols = 0
  rows = 3
  private spawn = 0
  constructor(readonly cfg: (typeof LAYERS)[number]) { this.rand = rng(cfg.seed * 7919) }

  /** lay the lattice out for a W × H figure (px, before the layer's depth scaling) */
  layout(W: number, H: number) {
    const L = Math.min(W, H * 1.6), sp = 0.085 * L, a = 0.022 * L
    this.cols = Math.max(3, Math.floor((W * (W < 700 ? 0.9 : 0.46)) / sp))
    const x0 = W * 0.06
    this.atoms = []
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cloud = new Float32Array(260)
      for (let k = 0; k < 130; k++) { const [dx, dy] = orbital(this.rand, a); cloud[2 * k] = dx; cloud[2 * k + 1] = dy }
      this.atoms.push({ x: x0 + c * sp + (r % 2) * sp * 0.5, y: H * (GLASS.bottom + 0.1) + r * sp * 0.86, row: r, col: c, cloud, jitter: 0 })
    }
    this.electrons = []
    for (let k = 0; k < Math.ceil(this.atoms.length / 3); k++)
      this.electrons.push({ site: Math.floor(this.rand() * this.atoms.length), to: -1, w: 0, t: 0, dur: 1, wmax: 0, ok: false, phase: 'dwell', dwell: this.rand() * 2, glassTries: 0 })
    this.photons = []
    for (let k = 0; k < 40; k++) this.step(0.12, W, H)
  }

  private neighbour(i: number): number {
    const a = this.atoms[i]
    // prefer moving up, towards the glass (−1 = the glass itself)
    const opts: [number, number][] = []
    const at = (r: number, c: number) => (r >= 0 && r < this.rows && c >= 0 && c < this.cols ? r * this.cols + c : -2)
    opts.push([a.row === 0 ? -1 : at(a.row - 1, a.col), 3], [at(a.row, a.col - 1), 1.1], [at(a.row, a.col + 1), 1.1], [at(a.row + 1, a.col), 0.5])
    const ok = opts.filter(([j]) => j !== -2)
    let t = this.rand() * ok.reduce((q, [, w]) => q + w, 0)
    for (const [j, w] of ok) { if ((t -= w) <= 0) return j }
    return ok[0][0]
  }

  step(dt: number, W: number, H: number) {
    const r = this.rand
    // light: spawn and fall
    this.spawn += dt * this.cfg.rain
    while (this.spawn >= 1) {
      this.spawn -= 1
      const u = W < 700 ? 0.08 + 0.84 * r() : 0.54 + 0.4 * r()
      this.photons.push({ u, path: -0.08 - 0.05 * r(), speed: 0.28 + 0.02 * r() })
    }
    for (const p of this.photons) p.path += p.speed * dt
    this.photons = this.photons.filter((p) => p.path < 1.25)
    // electrons: dwell → tunnelling attempt (w oscillates) → settle on one side
    for (const e of this.electrons) {
      if (e.phase === 'dwell') {
        e.dwell -= dt
        if (e.dwell <= 0) {
          e.to = this.neighbour(e.site)
          e.phase = 'try'; e.t = 0; e.dur = 0.9 + 1.2 * r(); e.wmax = 0.25 + 0.5 * r()
          e.ok = e.to >= 0 && r() < 0.35
        }
      } else if (e.phase === 'try') {
        e.t += dt
        e.w = e.wmax * Math.sin((Math.PI * 1.5 * e.t) / e.dur) ** 2
        if (e.t >= e.dur) { e.phase = 'settle'; e.t = 0 }
      } else {
        e.t += dt
        const target = e.ok ? 1 : 0
        e.w += (target - e.w) * Math.min(1, dt * 6)
        if (e.t > 0.45) {
          if (e.ok) {
            const a = this.atoms[e.site], b = this.atoms[e.to]
            a.jitter += 1; b.jitter += 0.7
            this.rings.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 })
            e.site = e.to
            e.glassTries = 0
          } else if (e.to === -1 && ++e.glassTries > 2) {
            // the glass never lets it through; after a few tries it wanders off along the row
            e.site = Math.min(this.atoms.length - 1, e.site + (r() < 0.5 ? this.cols : 1))
          }
          e.w = 0; e.to = -1; e.phase = 'dwell'; e.dwell = 0.3 + 1.4 * r()
        }
      }
    }
    for (const a of this.atoms) a.jitter *= Math.exp(-dt / 1.4)
    for (const g of this.rings) g.t += dt
    this.rings = this.rings.filter((g) => g.t < 1.4)
    // reshuffle a few cloud points: the cloud is a probability density, not a shape
    for (const a of this.atoms) for (let k = 0; k < 6; k++) {
      const i = Math.floor(r() * 130), [dx, dy] = orbital(r, Math.min(W, H * 1.6) * 0.022)
      a.cloud[2 * i] = dx; a.cloud[2 * i + 1] = dy
    }
  }

  /** optical path → height: air above, glass (slower, n) in the band, air below */
  private y(path: number) {
    const g = GLASS
    if (path < g.top) return path
    const inGlass = (g.bottom - g.top) * g.n
    if (path < g.top + inGlass) return g.top + (path - g.top) / g.n
    return g.bottom + (path - g.top - inGlass)
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const { scale: k } = this.cfg
    const vx = W * 0.5, vy = H * 0.45
    const X = (x: number) => vx + (x - vx) * k, Y = (y: number) => vy + (y - vy) * k
    ctx.clearRect(0, 0, W, H)
    // glass slab
    const gt = Y(H * GLASS.top), gb = Y(H * GLASS.bottom)
    ctx.fillStyle = 'rgba(233,229,220,0.035)'; ctx.fillRect(X(0), gt, X(W) - X(0), gb - gt)
    ctx.fillStyle = 'rgba(233,229,220,0.28)'; ctx.fillRect(X(0), gt, X(W) - X(0), 1); ctx.fillRect(X(0), gb, X(W) - X(0), 1)
    // light
    const L = Math.min(W, H * 1.6)
    const lam = 0.0105 * H, env = 0.018 * H, half = 0.02 * L * k
    for (const p of this.photons) {
      const x = X(p.u * W)
      for (let m = -5; m <= 5; m++) {
        const a = Math.exp(-((m * lam) ** 2) / (2 * env * env))
        if (a < 0.04) continue
        const path = p.path + (m * lam) / H
        const y = Y(this.y(path) * H)
        if (y < -10 || y > H + 10) continue
        ctx.fillStyle = `rgba(255,42,18,${(0.85 * a).toFixed(3)})`
        const thick = Math.max(1, (lam / (path > GLASS.top && path < GLASS.top + (GLASS.bottom - GLASS.top) * GLASS.n ? GLASS.n : 1)) * 0.38 * k)
        ctx.fillRect(x - half * (0.6 + 0.4 * a), y - thick / 2, 2 * half * (0.6 + 0.4 * a), thick)
      }
    }
    // atoms: nucleus + orbital cloud, shaking with the heat they've been given
    const r = this.rand
    ctx.fillStyle = 'rgba(138,133,124,0.55)'
    const dot = Math.max(1, 1.3 * k)
    for (const a of this.atoms) {
      const jx = a.jitter * 1.6 * gauss(r), jy = a.jitter * 1.6 * gauss(r)
      for (let i = 0; i < 130; i++) ctx.fillRect(X(a.x + a.cloud[2 * i] + jx), Y(a.y + a.cloud[2 * i + 1] + jy), dot, dot)
    }
    ctx.fillStyle = 'rgba(236,232,223,0.95)'
    for (const a of this.atoms) {
      const jx = a.jitter * 1.6 * gauss(r), jy = a.jitter * 1.6 * gauss(r)
      ctx.beginPath(); ctx.arc(X(a.x + jx), Y(a.y + jy), Math.max(1.2, 2.2 * k), 0, Math.PI * 2); ctx.fill()
    }
    // heat: a ring of lattice vibration spreading from each completed hop
    for (const g of this.rings) {
      ctx.strokeStyle = `rgba(138,133,124,${(0.5 * (1 - g.t / 1.4)).toFixed(3)})`; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(X(g.x), Y(g.y), (6 + g.t * 0.07 * L) * k, 0, Math.PI * 2); ctx.stroke()
    }
    // conduction electrons: a denser cloud, split between two sites while it tunnels
    ctx.fillStyle = 'rgba(236,232,223,0.8)'
    const ae = 0.016 * L
    for (const e of this.electrons) {
      const A = this.atoms[e.site]
      const B = e.to >= 0 ? this.atoms[e.to] : e.to === -1 && e.phase !== 'dwell' ? { x: A.x, y: H * GLASS.bottom + 4 } : null
      for (let i = 0; i < 90; i++) {
        let cx = A.x, cy = A.y, spread = ae
        const q = r()
        if (B && q < e.w) { cx = B.x; cy = B.y; if (e.to === -1) spread = ae * 0.5 }
        else if (B && q < e.w + 0.6 * e.w * (1 - e.w)) { const t = r(); cx = A.x + (B.x - A.x) * t; cy = A.y + (B.y - A.y) * t; spread = ae * 0.45 }
        const [dx, dy] = orbital(r, spread)
        ctx.fillRect(X(cx + dx), Y(cy + dy), dot * 1.1, dot * 1.1)
      }
    }
  }
}

interface Note { key: string; side: 'left' | 'right'; top: number; target: (W: number, H: number, l: Layer) => [number, number]; body: React.ReactNode }
const NOTES: Note[] = [
  { key: 'light', side: 'right', top: 0.04, target: (W, H) => [W * 0.72, H * 0.2], body: <><b>Light</b>A steady rain of 650 nm wave packets. The bands are its crests.</> },
  { key: 'glass', side: 'right', top: 0.62, target: (W, H) => [W * 0.9, H * (GLASS.top + GLASS.bottom) / 2], body: <><b>Glass</b>Light slows to c/1.5 inside and passes through; the glass absorbs almost none of it.</> },
  { key: 'electron', side: 'left', top: 0.08, target: (_W, _H, l) => { const a = l.atoms[Math.min(l.atoms.length - 1, 2)]; return [a.x, a.y - 10] }, body: <><b>Electron</b>Tunnels toward the next atom, mostly falls back, and only sometimes gets through. Each hop leaves the lattice shaking: heat. The glass stops it entirely.</> },
  { key: 'atom', side: 'left', top: 0.9, target: (_W, _H, l) => { const a = l.atoms[l.cols + 1] ?? l.atoms[0]; return [a.x, a.y + 12] }, body: <><b>Atom</b>A nucleus inside its electron cloud: points sampled from the orbital&apos;s density.</> },
]

export function Carriers() {
  const box = useRef<HTMLDivElement>(null)
  const cvs = useRef<(HTMLCanvasElement | null)[]>([])
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const lines = useRef<(SVGPolylineElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const { silicon, light } = CARRIER_NUMBERS

  useEffect(() => {
    const el = box.current
    if (!el) return
    const layers = LAYERS.map((c) => new Layer(c))
    let W = 0, H = 0, raf = 0, visible = false, last = performance.now(), odd = false
    const size = () => {
      W = el.clientWidth; H = el.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cvs.current.forEach((c) => { if (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0) } })
      layers.forEach((l) => l.layout(W, H))
    }
    const place = () => {
      const front = layers[0]
      NOTES.forEach((n, i) => {
        const lab = labels.current[i], line = lines.current[i], dot = dots.current[i]
        if (!lab || !line || !dot) return
        const [tx, ty] = n.target(W, H, front)
        const w = lab.offsetWidth, h = lab.offsetHeight
        const y = Math.min(H - h, Math.max(0, n.top * H - (n.top > 0.5 ? h : 0)))
        const x = n.side === 'left' ? 0 : W - w
        lab.style.transform = `translate(${x}px, ${y}px)`
        const x0 = n.side === 'left' ? w + 10 : W - w - 10, y0 = y + 7
        line.setAttribute('points', `${x0},${y0} ${n.side === 'left' ? x0 + 20 : x0 - 20},${y0} ${tx},${ty}`)
        dot.setAttribute('cx', String(tx)); dot.setAttribute('cy', String(ty))
      })
    }
    const paint = () => {
      layers.forEach((l, i) => { const c = cvs.current[i]; if (c) l.draw(c.getContext('2d')!, W, H) })
      place()
    }
    size()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { for (let t = 0; t < 60; t++) layers.forEach((l) => l.step(1 / 20, W, H)); paint() }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!visible || document.hidden) return
      layers.forEach((l) => l.step(dt, W, H))
      if ((odd = !odd)) paint() // 30 fps is plenty for this
    }
    if (!reduced) raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => { size(); paint() })
    ro.observe(el)
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect() }
  }, [])

  return (
    <div className={s.wrap}>
      <figure className={s.fig}>
        <div className={s.scene} ref={box} role="img" aria-label="Light wave packets raining through a glass slab above; below, electrons in a lattice of atoms struggling to hop from one atom's electron cloud to the next">
          {[2, 1, 0].map((d) => (
            <canvas key={d} ref={(c) => { cvs.current[d] = c }} className={s.layer} style={{ filter: LAYERS[d].blur ? `blur(${LAYERS[d].blur}px)` : undefined, opacity: LAYERS[d].alpha }} />
          ))}
          <svg className={s.leaders} aria-hidden="true">
            {NOTES.map((n, i) => (
              <g key={n.key}><polyline ref={(el) => { lines.current[i] = el }} points="" /><circle ref={(el) => { dots.current[i] = el }} r="2.5" /></g>
            ))}
          </svg>
          {NOTES.map((n, i) => (
            <div key={n.key} ref={(el) => { labels.current[i] = el }} className={`${s.note} ${n.side === 'right' ? s.right : ''}`}>{n.body}</div>
          ))}
        </div>
        <ol className={s.legend}>{NOTES.map((n) => <li key={n.key}>{n.body}</li>)}</ol>
      </figure>
      <div className={s.pair}>
        <div>
          <span className={s.big}>~{silicon.pj.toFixed(silicon.digits)}<small>pJ</small><Fn id="pj" /></span>
          <span className={s.what}>per multiply-accumulate on today&apos;s AI chips ({silicon.range} at chip level), almost all of it ending as heat.</span>
        </div>
        <div>
          <span className={`${s.big} ${s.red}`}>≤{light.pj.toFixed(light.digits)}<small>pJ</small><Fn id="pj" /></span>
          <span className={s.what}>per equivalent multiply in PHASER ({light.range}), modeled at a million optical modes. Light loses 10–30 % per round trip<Fn id="loss" /> and the gain replaces it every trip; the glass itself isn&apos;t where the energy goes.</span>
        </div>
      </div>
    </div>
  )
}
