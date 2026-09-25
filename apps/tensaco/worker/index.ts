// tensaco.ai: static pages from out/, the API, www → apex, and the retired solutions pages → each product's own site.
import { subscribe } from '@tensaco/subscribe'
import { auth } from './auth'
import { apply } from './careers'
import type { Env } from './env'
import { portal } from './portal'

const APEX = 'tensaco.ai'
const MOVED: Record<string, string> = {
  '/solutions/phaser/': 'https://phaser.tensaco.ai/',
  '/solutions/tensorcode/': 'https://tensorcode.dev/',
  '/solutions/': '/#solutions',
  '/privacy/': '/legal/privacy/',
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.hostname === `www.${APEX}`) {
      url.hostname = APEX
      return Response.redirect(url.toString(), 301)
    }
    const path = url.pathname
    const moved = MOVED[path.endsWith('/') ? path : path + '/']
    if (moved) return Response.redirect(new URL(moved, url).toString(), 301)
    if (path === '/api/subscribe') return subscribe(request, env, 'tensaco')
    if (path.startsWith('/api/auth/')) return auth(request, env, path.slice('/api/auth/'.length))
    if (path === '/api/careers/apply') return apply(request, env)
    if (path === '/api/account' || path.startsWith('/api/account/') || path.startsWith('/api/support/') || path.startsWith('/api/services/')) {
      return portal(request, env, path)
    }
    if (path.startsWith('/api/')) return new Response('Not found', { status: 404 })
    return env.ASSETS.fetch(request)
  },
}
