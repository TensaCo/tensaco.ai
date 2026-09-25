import { Fragment } from 'react'
import { PhaserDiagram } from './PhaserDiagram'
import type { Embed } from '@/lib/posts'

const COMPONENTS: Record<Embed, () => React.ReactNode> = { PhaserDiagram }

/** Post HTML with the MDX components the post used put back in place */
export function PostBody({ html, className }: { html: string; className?: string }) {
  const parts = html.split(/<div data-embed="(\w+)"><\/div>/)
  return (
    <div className={className}>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <div key={i} dangerouslySetInnerHTML={{ __html: p }} />
        const C = COMPONENTS[p as Embed]
        return C ? <Fragment key={i}><C /></Fragment> : null
      })}
    </div>
  )
}
