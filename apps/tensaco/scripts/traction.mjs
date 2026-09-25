// Runs before `next build`: fetches public adoption numbers for the investors page into src/data/traction.live.json.
// If a source is unreachable, the previous value is kept, so a build never fails on it.
import fs from 'node:fs'

const FILE = new URL('../src/data/traction.live.json', import.meta.url)
const prev = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {}
const get = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': 'tensaco.ai build', accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return r.json()
}
const tryGet = async (name, fn) => { try { return await fn() } catch (e) { console.warn(`traction: ${name} kept previous value (${e.message})`); return prev[name] ?? null } }

const out = {
  fetchedAt: new Date().toISOString(),
  pypiLastMonth: await tryGet('pypiLastMonth', async () => (await get('https://pypistats.org/api/packages/tensorcode/recent')).data.last_month),
  npmLastMonth: await tryGet('npmLastMonth', async () => (await get('https://api.npmjs.org/downloads/point/last-month/tensorcode')).downloads),
  githubStars: await tryGet('githubStars', async () => {
    const repos = await get('https://api.github.com/orgs/TensaCo/repos?per_page=100&type=public')
    return repos.reduce((n, r) => n + r.stargazers_count, 0)
  }),
  publicRepos: await tryGet('publicRepos', async () => (await get('https://api.github.com/orgs/TensaCo')).public_repos),
}
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n')
console.log('traction:', out)
