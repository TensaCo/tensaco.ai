// tensorcode.tensaco.ai is an alias: TensorCode lives at https://tensorcode.dev (Worker "tensorcode-site",
// repo TensaCo/tensacode). Every request 301s there with its path and query intact.
const CANONICAL = 'tensorcode.dev'

export default {
  fetch(request) {
    const url = new URL(request.url)
    url.protocol = 'https:'
    url.hostname = CANONICAL
    url.port = ''
    return new Response(null, { status: 301, headers: { location: url.toString(), 'cache-control': 'public, max-age=86400' } })
  },
}
