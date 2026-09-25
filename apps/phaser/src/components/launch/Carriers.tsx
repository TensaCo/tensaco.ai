'use client'
import { useEffect, useRef } from 'react'
import X from '@/data/exp29.json'
import type { Electron, Photon } from './waves'
import s from './Carriers.module.css'

// Exp. 29 scaling model, one step of a 135,000-neuron dense layer: energy per multiply–accumulate. Edit here only.
const N = X.N as number[]
const I = N.findIndex((n) => n >= 135000)
const MACS = N[I] * N[I]
export const CARRIER_NUMBERS = {
  silicon: { pj: ((X.series.digital_dense_gpu as number[])[I] / MACS) * 1e12, digits: 1 },
  light: { pj: ((X.series.optical_modeled_32 as number[])[I] / MACS) * 1e12, digits: 3 },
}

const PAPER = [236, 232, 223]
const RED = [255, 42, 18]

/** runs a simulation into a canvas while it is on screen */
function useSim<T extends Electron | Photon>(make: () => Promise<T>, draw: (sim: T, ctx: CanvasRenderingContext2D, w: number, h: number) => void, stepsPerFrame: number) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    let sim: T | null = null, raf = 0, alive = true, visible = false
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(c)
    const paint = () => {
      if (!sim) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = c.clientWidth, h = c.clientHeight
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
      const ctx = c.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(sim, ctx, w, h)
    }
    make().then((m) => {
      if (!alive) return
      sim = m
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sim.step(stepsPerFrame * 60); paint(); return }
      sim.step(stepsPerFrame * 30)
      let odd = false
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (!visible || document.hidden) return
        sim!.step(stepsPerFrame)
        // paint at half the frame rate: the waves still move smoothly and drawing is most of the cost
        if ((odd = !odd)) paint()
      }
      raf = requestAnimationFrame(loop)
    })
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect() }
  }, [])
  return ref
}

const off = new Map<string, HTMLCanvasElement>()
function blit(key: string, ctx: CanvasRenderingContext2D, nx: number, ny: number, w: number, h: number, fill: (d: Uint8ClampedArray) => void) {
  let o = off.get(key)
  if (!o) { o = document.createElement('canvas'); o.width = nx; o.height = ny; off.set(key, o) }
  const octx = o.getContext('2d')!
  const img = octx.createImageData(nx, ny)
  fill(img.data)
  octx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  // cover the canvas, cropping the simulation's absorbing margins
  const m = 6, sw = nx - 2 * m, sh = ny - 2 * m
  const sc = Math.max(w / sw, h / sh)
  ctx.drawImage(o, m, m, sw, sh, (w - sw * sc) / 2, (h - sh * sc) / 2, sw * sc, sh * sc)
  return { sc, ox: (w - sw * sc) / 2 - m * sc, oy: (h - sh * sc) / 2 - m * sc }
}

function drawElectron(e: Electron, ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h)
  const { sc, ox, oy } = blit('e', ctx, e.nx, e.ny, w, h, (d) => {
    for (let k = 0; k < e.re.length; k++) {
      const r = e.re[k], m = e.im[k], rho = r * r + m * m
      // brightness: |ψ|²; banding: the phase, so the wave's crests show
      const t = (1 - Math.exp(-rho * 900)) * (0.55 + 0.45 * Math.cos(Math.atan2(m, r)))
      d[4 * k] = 10 + (PAPER[0] - 10) * t; d[4 * k + 1] = 9 + (PAPER[1] - 9) * t; d[4 * k + 2] = 8 + (PAPER[2] - 8) * t; d[4 * k + 3] = 255
    }
  })
  // the ions, where the simulation has them (their vibration is the heat)
  for (const o of e.ions) {
    const x = ox + (o.x + 0.5) * sc, y = oy + (o.y + 0.5) * sc
    const amp = Math.hypot(o.x - o.x0, o.y - o.y0)
    ctx.beginPath(); ctx.arc(x, y, 1.6 + 0.9 * sc * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(138,133,124,${Math.min(1, 0.45 + amp)})`; ctx.fill()
    ctx.beginPath(); ctx.arc(ox + (o.x0 + 0.5) * sc, oy + (o.y0 + 0.5) * sc, 0.8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(138,133,124,0.25)'; ctx.fill()
  }
}

function drawPhoton(p: Photon, ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, w, h)
  const { sc, ox, oy } = blit('p', ctx, p.nx, p.ny, w, h, (d) => {
    for (let k = 0; k < p.E.length; k++) {
      const i = k % p.nx
      const glass = i >= p.glass.x0 && i < p.glass.x1
      const t = 1 - Math.exp(-p.E[k] * p.E[k] * 8)
      const g = glass ? 20 : 10
      d[4 * k] = g + (RED[0] - g) * t; d[4 * k + 1] = g * 0.93 + (RED[1] - g * 0.93) * t; d[4 * k + 2] = g * 0.85 + (RED[2] - g * 0.85) * t; d[4 * k + 3] = 255
    }
  })
  ctx.strokeStyle = 'rgba(233,229,220,0.22)'; ctx.lineWidth = 1
  for (const x of [p.glass.x0, p.glass.x1]) { const X = Math.round(ox + x * sc) + 0.5; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, oy + p.ny * sc); ctx.stroke() }
  ctx.fillStyle = 'rgba(138,133,124,0.9)'; ctx.font = '10px var(--f-mono), monospace'
  ctx.fillText('GLASS  n = 1.5', ox + p.glass.x0 * sc + 10, h - 12)
}

export function Carriers() {
  const eRef = useSim(() => import('./waves').then((m) => new m.Electron()), drawElectron, 2)
  const pRef = useSim(() => import('./waves').then((m) => new m.Photon()), drawPhoton, 2)
  const { silicon, light } = CARRIER_NUMBERS
  return (
    <div className={s.pair}>
      <figure>
        <canvas ref={eRef} className={s.vol} aria-label="Simulated electron wave packet scattering in a vibrating lattice" />
        <p className={s.cap}>Electron wave packet, |ψ|² with its phase, in a lattice of vibrating ions (Schrödinger equation, 2-D)</p>
        <figcaption>
          <span className={s.big}>{silicon.pj.toFixed(silicon.digits)}<small>pJ</small></span>
          <span className={s.what}>per multiply in silicon, modeled, all of it heat. The electron is a wave too: it scatters off the vibrating ions, and every ion it shakes keeps some energy as heat.</span>
        </figcaption>
      </figure>
      <figure>
        <canvas ref={pRef} className={s.vol} aria-label="Simulated light wave packet crossing a glass slab" />
        <p className={s.cap}>Light wave packet, |E|², crossing a glass slab (wave equation, 2-D)</p>
        <figcaption>
          <span className={`${s.big} ${s.red}`}>{light.pj.toFixed(light.digits)}<small>pJ</small></span>
          <span className={s.what}>per multiply in PHASER, modeled. In glass the wave slows, a little reflects, and the rest passes through intact: the glass does not turn it into heat the way a wire does. The cost is keeping the light going.</span>
        </figcaption>
      </figure>
    </div>
  )
}
