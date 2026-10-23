'use client'

import { useEffect, useRef, useState } from 'react'
import s from './home.module.css'

/** Built from video/hero/Hero.vid.py (see its README). */
const BASE = '/media/video/home-hero'

/**
 * The homepage's full-screen background loop. The poster is a plain image underneath, so the hero looks right before
 * the video loads and is all that shows under prefers-reduced-motion. The video loads after hydration: the 1080p cut
 * on large screens, the 720p one elsewhere, and fades in once it is playing. A small control pauses it.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [motion, setMotion] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMotion(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (!motion) { v.pause(); setPlaying(false); return }
    if (!v.getAttribute('src')) {
      const big = window.innerWidth >= 900 && window.innerWidth * (window.devicePixelRatio || 1) > 1280
      v.src = `${BASE}${big ? '' : '-720'}.mp4`
    }
    v.muted = true
    v.play().catch(() => {})
  }, [motion])

  function toggle() {
    const v = ref.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setPaused(false) } else { v.pause(); setPaused(true) }
  }

  return (
    <>
      <img className={className} src={`${BASE}.jpg`} alt="" fetchPriority="high" decoding="async" />
      <video
        ref={ref}
        className={`${className ?? ''} ${s.heroVideo} ${playing && motion ? s.heroVideoOn : ''}`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
      />
      {motion && (
        <button type="button" className={s.heroPause} onClick={toggle} aria-label={paused ? 'Play background video' : 'Pause background video'}>
          {paused
            ? <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>}
        </button>
      )}
    </>
  )
}
