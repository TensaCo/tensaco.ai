/** Newsroom articles. Only things that happened, each linking to where it happened. */
export interface NewsItem {
  slug: string
  date: string
  tag: 'Announcement' | 'Product' | 'Research' | 'Company'
  title: string
  summary: string
  image: string
  imageAlt: string
  body: string[]
  link: { label: string; href: string }
}

export const NEWS: NewsItem[] = [
  {
    slug: 'tensaco-introduces-phaser', date: '2026-09-24', tag: 'Announcement',
    title: 'TensaCo introduces PHASER, an optical approach to AI acceleration',
    summary: 'PHASER performs neural-network computation with light circulating between mirrors through programmable modulators.',
    image: '/media/news/phaser-launch.jpg', imageAlt: 'The PHASER optical cavity, rendered from its wave simulation',
    body: [
      'TensaCo today introduced PHASER, a neural accelerator that performs computation with light instead of electricity.',
      'In PHASER, light circulates between two mirrors through a stack of programmable spatial light modulators. Each pass through the stack performs one step of computation, and the interference of light does the arithmetic. The design is built around components the telecom and display industries already manufacture at scale.',
      'In TensaCo’s energy model, one step of a 135,000-neuron dense layer on a single megapixel of optics uses about 1,000 times less energy than the same step on a GPU. At today’s simulated scale the energy per step matches an equally capable digital system; the advantage grows with scale. A step takes 6.7 nanoseconds in simulation.',
      'PHASER is in the research stage. The simulator, experiments and energy model are published on GitHub.',
    ],
    link: { label: 'Visit phaser.tensaco.ai', href: 'https://phaser.tensaco.ai' },
  },
  {
    slug: 'tensorcode-0-4-alpha', date: '2026-09-24', tag: 'Product',
    title: 'TensorCode 0.4 alpha is available on PyPI and npm',
    summary: 'The Python reference implementation and the TypeScript port share file formats, so a program trained in one reloads in the other.',
    image: '/media/photo/engineers-reviewing-screens-1200.jpg', imageAlt: 'Engineers reviewing code',
    body: [
      'TensorCode 0.4 alpha is available as tensorcode on PyPI and npm.',
      'TensorCode builds trainable programs from callable operations and small tools that own their models. Teams compose encoders, scorers and decoders, or use complete tools such as Investigator, Planner, Decision, Chatbot and Scene. They collect reviewed feedback with explicit provenance, train on it, and save the result as a data-only artifact that reloads in a fresh process, from the Hugging Face Hub, or in the other language.',
      'The TypeScript implementation matches the Python reference and shares its file formats. APIs may change between alpha releases; measured behaviour and its limits are published with the documentation.',
    ],
    link: { label: 'Read the documentation', href: 'https://tensorcode.dev/docs/' },
  },
  {
    slug: 'phaser-research-update-september-2026', date: '2026-09-23', tag: 'Research',
    title: 'PHASER research update: energy model and persistent optical logic',
    summary: 'New simulation results cover energy per step against a tuned digital baseline, and persistent optical logic gates.',
    image: '/media/photo/lab-laser-optics-1200.jpg', imageAlt: 'Laser optics on a laboratory bench',
    body: [
      'TensaCo published the results of a 29-experiment research sprint on PHASER’s simulated optical cavity.',
      'With a cross-gain saturation model, the simulated medium supports a persistent, input-preserving NAND gate, verified on every round trip to 100,000 round trips, along with persistent NOT and AND gates. Persistent optical memory held for a million round trips.',
      'An energy model compared the optical system with a fairly tuned digital baseline. At the simulated scale the two are at parity; the modeled advantage grows with scale against dense layers. The report lists what remains open, including a latch and composed multi-gate circuits.',
    ],
    link: { label: 'Read the research report', href: 'https://github.com/TensaCo/phaser-design/blob/main/research/2026-09-14/REPORT.md' },
  },
  {
    slug: 'phaser-concept-published', date: '2024-11-26', tag: 'Research',
    title: 'The PHASER concept is first published',
    summary: 'The original first-principles write-up of a recurrent photon chamber for neural computation.',
    image: '/media/news/phaser-notebook.jpg', imageAlt: 'Notebook sketch of the PHASER recurrent photon chamber',
    body: [
      'The PHASER concept was first published as a first-principles analysis of a recurrent photon chamber: light circulating through programmable filters between mirrors, accumulating computation with each pass.',
      'The write-up covered the promise and limits of free-space optical neural networks, the throughput of a recurrent design, and the engineering challenges of loss, stability and readout.',
    ],
    link: { label: 'Read the original post', href: 'https://phaser.tensaco.ai/blog/phaser/' },
  },
  {
    slug: 'tensacode-begins', date: '2022-04-14', tag: 'Company',
    title: 'Work begins on TensaCode, the framework that became TensorCode',
    summary: 'A framework for encoding and decoding program state with differentiable programming, and the start of TensaCo’s software line.',
    image: '/media/photo/team-whiteboard-1200.jpg', imageAlt: 'A team planning at a whiteboard',
    body: [
      'Work began on TensaCode, a framework for encoding and decoding arbitrary program objects with differentiable programming and runtime code generation.',
      'TensaCode became TensorCode, TensaCo’s software for AI that teams can check, correct and own.',
    ],
    link: { label: 'Visit tensorcode.dev', href: 'https://tensorcode.dev' },
  },
]

export const newsBySlug = (slug: string) => NEWS.find((n) => n.slug === slug)

export const formatDate = (iso: string) =>
  new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
