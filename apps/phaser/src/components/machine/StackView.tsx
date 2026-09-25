'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import type { LiveStack } from '@/lib/live'
import type { Framing, StackScene, StackStatus, V3 } from './StackScene'
import s from './StackView.module.css'

export interface Annotation {
  /** point on the machine (mm) the leader ends at */
  at: V3
  side: 'left' | 'right'
  children: ReactNode
}

interface Props {
  framing: Framing
  tripSeconds: number
  annotations: Annotation[]
  onStatus?: (st: StackStatus) => void
  className?: string
  children?: ReactNode
  /** draw this simulation (default: the scene makes its own) */
  live?: LiveStack
  /** px between the labels and the frame's left/right edges */
  inset?: number
}

/** The live stack in WebGL, with hairline leaders from HTML labels to the parts they name. */
export default function StackView({ framing, tripSeconds, annotations, onStatus, className, children, live, inset = 0 }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const lines = useRef<(SVGPolylineElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const status = useRef(onStatus)
  status.current = onStatus
  const notes = useRef(annotations)
  notes.current = annotations
  const pad = useRef(inset)
  pad.current = inset

  useEffect(() => {
    const canvas = canvasRef.current, st = stage.current
    if (!canvas || !st) return
    let scene: StackScene | null = null
    let raf = 0, alive = true, visible = true, last = performance.now()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)

    const place = () => {
      if (!scene) return
      const W = st.clientWidth
      const H = st.clientHeight
      const items = notes.current.map((a, i) => ({ a, i, p: scene!.project(a.at) }))
      for (const side of ['left', 'right'] as const) {
        // stack each side's labels top to bottom in the order of the points they name, without overlaps; if the stack runs
        // past the bottom, lift the whole side
        const side_ = items.filter((x) => x.a.side === side).sort((x, y) => x.p.y - y.p.y)
        const ys: number[] = []
        let bottom = 4
        for (const { i, p } of side_) {
          const h = labels.current[i]?.offsetHeight ?? 0
          const y = Math.max(bottom, p.y - h / 2)
          ys.push(y); bottom = y + h + 12
        }
        const lift = Math.max(0, bottom - 12 - (H - 4))
        side_.forEach(({ a, i, p }, n) => {
          const el = labels.current[i], line = lines.current[i], dot = dots.current[i]
          if (!el || !line || !dot) return
          const y = Math.max(4, ys[n] - lift)
          const L = pad.current, R = W - pad.current
          el.style.transform = `translate(${a.side === 'left' ? L : R - el.offsetWidth}px, ${y.toFixed(1)}px)`
          const x0 = a.side === 'left' ? L + el.offsetWidth + 10 : R - el.offsetWidth - 10
          const y0 = y + 7
          const xm = a.side === 'left' ? Math.min(x0 + 24, p.x) : Math.max(x0 - 24, p.x)
          line.setAttribute('points', `${x0},${y0} ${xm},${y0} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          dot.setAttribute('cx', p.x.toFixed(1)); dot.setAttribute('cy', p.y.toFixed(1))
        })
      }
    }

    import('./StackScene').then(({ StackScene }) => {
      if (!alive) return
      const box = canvas.getBoundingClientRect()
      const small = Math.min(box.width, box.height) < 600
      try {
        scene = new StackScene({ canvas, width: box.width, height: box.height, dpr: Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75), tripSeconds, framing, live })
      } catch {
        st.setAttribute('data-fallback', '')
        canvas.style.display = 'none'
        return
      }
      scene.onTrip = (x) => status.current?.(x)
      scene.render(); place()
      ;(window as unknown as Record<string, StackScene>)[`__stack_${framing}`] = scene
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
  }, [framing, tripSeconds, live])

  return (
    <div className={`${s.stage} ${className ?? ''}`} ref={stage}>
      <canvas ref={canvasRef} className={s.canvas} />
      <svg className={s.leaders} aria-hidden="true">
        {annotations.map((_, i) => (
          <g key={i}>
            <polyline ref={(el) => { lines.current[i] = el }} points="" />
            <circle ref={(el) => { dots.current[i] = el }} r="2.5" />
          </g>
        ))}
      </svg>
      {annotations.map((a, i) => (
        <div key={i} ref={(el) => { labels.current[i] = el }} className={`${s.note} ${a.side === 'right' ? s.right : ''}`}>{a.children}</div>
      ))}
      {children}
    </div>
  )
}
