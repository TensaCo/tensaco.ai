// phaser.tensaco.ai: static pages from out/, plus the subscribe endpoint.
import { subscribe } from '@tensaco/subscribe'

interface Env { DB: D1Database; ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/subscribe') return subscribe(request, env, 'phaser')
    return env.ASSETS.fetch(request)
  },
}
