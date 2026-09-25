import type { Asset } from '@/data/media'

/** A photo, or a silent looping background video with its poster frame. */
export function Media({ asset, className, priority = false }: { asset: Asset; className?: string; priority?: boolean }) {
  if (asset.kind === 'video') {
    return (
      <video className={className} src={asset.src} poster={asset.poster} autoPlay muted loop playsInline preload={priority ? 'auto' : 'metadata'} aria-label={asset.alt} />
    )
  }
  const small = asset.src.replace(/\.jpg$/, '-1200.jpg')
  return (
    <img className={className} src={small} srcSet={`${small} 1200w, ${asset.src} 2400w`} sizes={priority ? '100vw' : '(max-width: 900px) 100vw, 50vw'}
      alt={asset.alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />
  )
}
