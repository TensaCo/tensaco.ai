'use client'
import { useEffect, useRef } from 'react'
import { K_TRIPS, TRIP_TIME } from '@/lib/phaser-sim'
import type { RingScene, RingStatus } from './RingScene'
import s from './HeroMachine.module.css'

const TRIP_SECONDS = 1.6 // one displayed round trip
const SLOWDOWN = TRIP_SECONDS / TRIP_TIME

const LABELS: { k: 'slm' | 'lensR' | 'fold' | 'out' | 'lensL' | 'gain' | 'in'; t: string }[] = [
  { k: 'slm', t: 'LCOS SLM · 64 × 64 px · 20 µm' },
  { k: 'lensR', t: 'Lens R · f 40 mm' },
  { k: 'fold', t: 'Fold mirrors' },
  { k: 'out', t: 'Out-coupler · 5 % tap' },
  { k: 'lensL', t: 'Lens L · f 40 mm' },
  { k: 'gain', t: 'Gain · clamped' },
  { k: 'in', t: 'In-coupler' },
]

function sci(x: number) {
  const e = Math.floor(Math.log10(x))
  return `${(x / 10 ** e).toFixed(1)} × 10${String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] ?? c).join('')}`
}

export default function HeroMachine() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const hud = useRef<{ trip: HTMLElement | null; step: HTMLElement | null; u: HTMLElement | null; k: HTMLElement | null }>({ trip: null, step: null, u: null, k: null })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let scene: RingScene | null = null
    let raf = 0, alive = true, visible = true, last = performance.now()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    const onStatus = (st: RingStatus) => {
      const h = hud.current
      if (h.trip) h.trip.textContent = String(st.trip).padStart(6, '0')
      if (h.step) h.step.textContent = String(st.step).padStart(4, '0')
      if (h.u) h.u.textContent = st.u.toFixed(3)
      if (h.k) h.k.textContent = `${st.tripInStep}/${K_TRIPS}`
    }
    const place = () => {
      if (!scene) return
      const a = scene.anchors()
      LABELS.forEach((l, i) => {
        const el = labels.current[i]
        if (!el) return
        const p = a[l.k]
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`
        el.style.opacity = p.visible ? '' : '0'
      })
    }
    import('./RingScene').then(({ RingScene }) => {
      if (!alive) return
      const box = canvas.getBoundingClientRect()
      const small = Math.min(box.width, box.height) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4
      try {
        scene = new RingScene({ canvas, width: box.width, height: box.height, dpr: Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75), spacing: small ? 2 : 1, tripSeconds: TRIP_SECONDS, framing: 'hero' })
      } catch {
        canvas.parentElement?.setAttribute('data-fallback', '')
        canvas.style.display = 'none'
        return
      }
      scene.onTrip = onStatus
      scene.refresh()
      ;(window as unknown as { __ring?: RingScene }).__ring = scene
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        scene.render(); place()
        return
      }
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = (now - last) / 1000
        last = now
        if (visible && scene && !document.hidden) { scene.frame(dt); place() }
      }
      raf = requestAnimationFrame(loop)
    })
    const onResize = () => {
      if (!scene) return
      const box = canvas.getBoundingClientRect()
      scene.resize(box.width, box.height, Math.min(window.devicePixelRatio || 1, 1.75))
      scene.render(); place()
    }
    const onMove = (e: PointerEvent) => scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      scene?.dispose()
    }
  }, [])

  return (
    <div className={s.stage}>
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.labels} aria-hidden="true">
        {LABELS.map((l, i) => <span key={l.k} ref={(el) => { labels.current[i] = el }} className={s.label}><i />{l.t}</span>)}
      </div>
      <dl className={s.plate} aria-label="Live simulation status">
        <div><dt>Fig. 1</dt><dd>Live simulation · research model</dd></div>
        <div><dt>λ</dt><dd>650 nm</dd></div>
        <div><dt>Trip</dt><dd><b ref={(el) => { hud.current.trip = el }}>000000</b></dd></div>
        <div><dt>Input</dt><dd><b ref={(el) => { hud.current.step = el }}>0000</b> · u = <b ref={(el) => { hud.current.u = el }}>0.000</b> · trip <b ref={(el) => { hud.current.k = el }}>0/10</b></dd></div>
        <div><dt>Time</dt><dd>0.667 ns per trip, shown {sci(SLOWDOWN)}× slower</dd></div>
      </dl>
    </div>
  )
}
