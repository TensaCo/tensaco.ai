// tensaco.ai: static pages from out/, the subscribe endpoint, and www → apex.
import { subscribe } from '../../../packages/subscribe/handler.js'

const APEX = 'tensaco.ai'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.hostname === `www.${APEX}`) {
      url.hostname = APEX
      return Response.redirect(url.toString(), 301)
    }
    if (url.pathname === '/api/subscribe') return subscribe(request, env, 'tensaco')
    return env.ASSETS.fetch(request)
  },
}
