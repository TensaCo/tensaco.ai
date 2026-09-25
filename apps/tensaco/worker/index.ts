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
    return env.ASSETS.fetch(request)
  },
}
