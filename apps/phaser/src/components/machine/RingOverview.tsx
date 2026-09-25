'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { LiveRing } from '@/lib/live'
import type { RingScene } from './RingScene'
import s from './HeroMachine.module.css'

const LABELS: { k: 'slm' | 'lensR' | 'fold' | 'out' | 'lensL' | 'gain' | 'in'; t: string }[] = [
  { k: 'slm', t: 'SLM' },
  { k: 'lensR', t: 'Lens R' },
  { k: 'fold', t: 'Fold' },
  { k: 'out', t: 'Out 5 %' },
  { k: 'lensL', t: 'Lens L' },
  { k: 'gain', t: 'Gain' },
  { k: 'in', t: 'In' },
]

export interface RingOverviewHandle { refresh(): void }

/** The whole ring at true proportions, drawing the caller's simulation; the caller advances it and calls refresh(). */
const RingOverview = forwardRef<RingOverviewHandle, { live: LiveRing }>(function RingOverview({ live }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const scene = useRef<RingScene | null>(null)

  const place = () => {
    const sc = scene.current
    if (!sc) return
    const a = sc.anchors()
    LABELS.forEach((l, i) => {
      const el = labels.current[i]
      if (!el) return
      el.style.transform = `translate(${a[l.k].x.toFixed(1)}px, ${a[l.k].y.toFixed(1)}px)`
      el.style.opacity = a[l.k].visible ? '' : '0'
    })
  }

  useImperativeHandle(ref, () => ({ refresh: () => { if (scene.current) { scene.current.refresh(); scene.current.render(); place() } } }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let alive = true
    import('./RingScene').then(({ RingScene }) => {
      if (!alive) return
      const box = canvas.getBoundingClientRect()
      try {
        scene.current = new RingScene({ canvas, width: box.width, height: box.height, dpr: Math.min(window.devicePixelRatio || 1, 1.5), spacing: box.width < 700 ? 8 : 4, tripSeconds: 0, live, framing: 'overview' })
      } catch {
        canvas.parentElement?.setAttribute('data-fallback', '')
        return
      }
      scene.current.render(); place()
    })
    const onResize = () => {
      const sc = scene.current
      if (!sc) return
      const box = canvas.getBoundingClientRect()
      sc.resize(box.width, box.height, Math.min(window.devicePixelRatio || 1, 1.5))
      sc.render(); place()
    }
    window.addEventListener('resize', onResize)
    return () => { alive = false; window.removeEventListener('resize', onResize); scene.current?.dispose(); scene.current = null }
  }, [live])

  return (
    <div className={s.stage}>
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.labels} aria-hidden="true">
        {LABELS.map((l, i) => <span key={l.k} ref={(el) => { labels.current[i] = el }} className={s.label}><i />{l.t}</span>)}
      </div>
    </div>
  )
})

export default RingOverview
