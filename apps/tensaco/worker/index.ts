// tensaco.ai: static pages from out/, the API, www → apex, the retired solutions pages → each product's own site, and
// the old account pages → account.tensaco.ai (apps/account), which now owns sign-in, sign-up and the portal.
import { subscribe } from '@tensaco/subscribe'
import { apply } from './careers'
import type { Env } from './env'

const APEX = 'tensaco.ai'
const MOVED: Record<string, string> = {
  '/solutions/phaser/': 'https://phaser.tensaco.ai/',
  '/solutions/tensorcode/': 'https://tensorcode.dev/',
  '/solutions/': '/#solutions',
  '/privacy/': '/legal/privacy/',
}

const ACCOUNT_PATHS = /^\/(login|signup|account)(\/|$)/

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    if (url.hostname === `www.${APEX}`) {
      url.hostname = APEX
      return Response.redirect(url.toString(), 301)
    }
    const path = url.pathname
    const moved = MOVED[path.endsWith('/') ? path : path + '/']
    if (moved) return Response.redirect(new URL(moved, url).toString(), 301)
    if (ACCOUNT_PATHS.test(path)) return Response.redirect(`https://account.tensaco.ai${path}${url.search}`, 301)
    if (path === '/api/subscribe') return subscribe(request, env, 'tensaco')
    if (path === '/api/careers/apply') return apply(request, env, ctx)
    if (path.startsWith('/api/')) return new Response('Not found', { status: 404 })
    if (/\.(mp4|webm)$/.test(path)) return media(request, env)
    return env.ASSETS.fetch(request)
  },
}

/** Video with byte ranges (206): Safari and iOS won't play a <video> whose server ignores Range. The assets binding
 *  always answers 200 with the whole file, so slice it here. */
async function media(request: Request, env: Env): Promise<Response> {
  const range = request.headers.get('Range')
  const res = await env.ASSETS.fetch(request.url, { method: request.method === 'HEAD' ? 'HEAD' : 'GET' })
  const m = range?.match(/^bytes=(\d*)-(\d*)$/)
  if (!res.ok || !m || (!m[1] && !m[2])) {
    const out = new Response(res.body, res)
    out.headers.set('Accept-Ranges', 'bytes')
    return out
  }
  const buf = await res.arrayBuffer()
  const size = buf.byteLength
  let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]))
  let end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' } })
  }
  const headers = new Headers(res.headers)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Content-Length', String(end - start + 1))
  return new Response(request.method === 'HEAD' ? null : buf.slice(start, end + 1), { status: 206, headers })
}
