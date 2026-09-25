/** Newsroom items. Only things that happened, with a link to where they happened. */
export interface NewsItem { date: string; tag: string; title: string; summary: string; href: string }

export const NEWS: NewsItem[] = [
  {
    date: '2026-09-24', tag: 'Announcement',
    title: 'TensaCo introduces PHASER, an optical approach to AI acceleration',
    summary: 'PHASER performs neural-network computation with light circulating between mirrors through programmable modulators. Modeled at one megapixel of optics, it uses about 1,000× less energy per step than a GPU.',
    href: 'https://phaser.tensaco.ai',
  },
  {
    date: '2026-09-24', tag: 'Product',
    title: 'TensorCode 0.4 alpha is available on PyPI and npm',
    summary: 'The Python reference implementation and the TypeScript port share file formats, so a program trained in one language reloads in the other.',
    href: 'https://tensorcode.dev',
  },
  {
    date: '2026-09-23', tag: 'Research',
    title: 'PHASER research update: energy model and persistent optical logic',
    summary: 'New simulation results cover the energy per step against a tuned digital baseline, and persistent optical NAND and NOT gates verified over 100,000 round trips.',
    href: 'https://github.com/TensaCo/phaser-design/blob/main/research/2026-09-14/REPORT.md',
  },
  {
    date: '2024-11-26', tag: 'Research',
    title: 'The PHASER concept is first published',
    summary: 'The original write-up of a recurrent photon chamber for neural computation, from first principles.',
    href: 'https://phaser.tensaco.ai/blog/phaser/',
  },
  {
    date: '2022-04-14', tag: 'Company',
    title: 'Work begins on TensaCode, the framework that became TensorCode',
    summary: 'A framework for encoding and decoding program state with differentiable programming, and the start of TensaCo’s software line.',
    href: 'https://tensorcode.dev',
  },
]

export const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
