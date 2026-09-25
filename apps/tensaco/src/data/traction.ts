/**
 * Commercial traction for /investors. Update these by hand as agreements are signed; `asOf` is shown on the page.
 * Adoption numbers (downloads, stars) are fetched at build time into traction.live.json by scripts/traction.mjs.
 */
import live from './traction.live.json'

export const TRACTION = {
  asOf: '2026-09-24',
  lettersOfIntent: 0,
  designPartners: 0,
  paidPilots: 0,
  contractedRevenueUsd: 0,
  /** commercial pipeline by stage and product */
  pipeline: [
    { stage: 'Qualified conversations', phaser: 0, tensorcode: 0 },
    { stage: 'Technical evaluation', phaser: 0, tensorcode: 0 },
    { stage: 'Letter of intent signed', phaser: 0, tensorcode: 0 },
    { stage: 'Pilot or design partnership', phaser: 0, tensorcode: 0 },
    { stage: 'Contracted', phaser: 0, tensorcode: 0 },
  ],
}

export const LIVE = live as { fetchedAt: string; pypiLastMonth: number | null; npmLastMonth: number | null; githubStars: number | null; publicRepos: number | null }

export const MILESTONES: { when: string; what: string; product: string; done: boolean }[] = [
  { when: '2022', what: 'Work begins on TensaCode, the framework that became TensorCode', product: 'TensorCode', done: true },
  { when: 'Nov 2024', what: 'PHASER recurrent photon chamber concept published', product: 'PHASER', done: true },
  { when: 'Sep 2026', what: 'PHASER simulator and research sprint: persistent optical logic, energy model', product: 'PHASER', done: true },
  { when: 'Sep 2026', what: 'TensorCode 0.4 alpha released on PyPI and npm', product: 'TensorCode', done: true },
  { when: 'Next', what: 'First design-partner agreements', product: 'TensaCo', done: false },
  { when: 'Next', what: 'PHASER bench prototype', product: 'PHASER', done: false },
  { when: 'Next', what: 'TensorCode 1.0 and commercial support', product: 'TensorCode', done: false },
]
