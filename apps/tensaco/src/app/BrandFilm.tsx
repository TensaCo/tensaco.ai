'use client'

import { useRef, useState } from 'react'
import s from './home.module.css'

const BASE = '/media/video/tensaco-brand-30s'

/** The 30-second brand film: a poster with a play button; plays with sound and native controls on click. */
export function BrandFilm() {
  const ref = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'idle' | 'playing' | 'ended'>('idle')

  function play() {
    const v = ref.current
    if (!v) return
    if (!v.getAttribute('src')) {
      // the 1080p master on large screens, the 720p version elsewhere
      const big = window.innerWidth * (window.devicePixelRatio || 1) >= 1600
      v.src = `${BASE}${big ? '' : '-720'}.mp4`
    }
    v.currentTime = state === 'ended' ? 0 : v.currentTime
    v.muted = false
    setState('playing')
    v.play().catch(() => setState('idle'))
  }

  return (
    <div className={s.film}>
      <video
        ref={ref}
        className={s.filmVideo}
        poster={`${BASE}.jpg`}
        preload="none"
        playsInline
        controls={state === 'playing'}
        onEnded={() => setState('ended')}
        aria-label="TensaCo brand film, 30 seconds"
      />
      {state !== 'playing' && (
        <button type="button" className={s.filmCover} onClick={play} aria-label={state === 'ended' ? 'Replay the TensaCo film' : 'Play the TensaCo film with sound'}>
          <span className={s.filmPlay} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
          </span>
          <span className={s.filmLabel}>{state === 'ended' ? 'Watch again' : 'Play film'}<span className={s.filmDur}>0:30 · sound on</span></span>
        </button>
      )}
    </div>
  )
}
