// phaser.tensaco.ai: static pages from out/, plus the subscribe endpoint.
import { subscribe } from '../../../packages/subscribe/handler.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/subscribe') return subscribe(request, env, 'phaser')
    return env.ASSETS.fetch(request)
  },
}
