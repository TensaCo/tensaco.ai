// account.tensaco.ai: the static console pages from out/ and their API.
// Old portal URLs (/account/…, forwarded from tensaco.ai) map to the console's own paths.
import { auth } from './auth'
import type { Env } from './env'
import { json } from './lib'
import { portal } from './portal'

const API = ['/api/account', '/api/support/', '/api/services/', '/api/applications/', '/api/staff/']

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)
    const path = url.pathname
    if (path === '/account' || path.startsWith('/account/')) {
      url.pathname = path.slice('/account'.length) || '/'
      return Response.redirect(url.toString(), 301)
    }
    if (path.startsWith('/api/auth/')) return auth(request, env, ctx, path.slice('/api/auth/'.length))
    if (API.some((p) => path === p || path.startsWith(p.endsWith('/') ? p : p + '/'))) return portal(request, env, ctx, path)
    if (path.startsWith('/api/')) return json({ ok: false, error: 'Not found.' }, 404)
    const res = await env.ASSETS.fetch(request)
    // the console never belongs in a frame or a search index
    const out = new Response(res.body, res)
    out.headers.set('x-frame-options', 'DENY')
    out.headers.set('x-robots-tag', 'noindex')
    out.headers.set('referrer-policy', 'same-origin')
    return out
  },
}
