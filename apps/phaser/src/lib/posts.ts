/**
 * Blog posts: Markdown/MDX files in content/posts/, rendered to HTML at build time (the site is a static export).
 * MDX components aren't executed; the ones we support are swapped for placeholders that the page fills in
 * (see EMBEDS), and `className` / HTML-escaped braces from the MDX source are normalised for plain Markdown.
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

const DIR = path.join(process.cwd(), 'content/posts')

/** MDX components that posts may use, and the placeholder each becomes in the HTML */
export const EMBEDS = { PhaserDiagram: '<div data-embed="PhaserDiagram"></div>' } as const
export type Embed = keyof typeof EMBEDS

export interface PostMeta {
  slug: string
  title: string
  date: string
  summary: string
  hero?: { src: string; alt: string }
  /** where the post was first published, shown at the bottom */
  source?: string
}

function read(slug: string) {
  const file = ['.mdx', '.md'].map((e) => path.join(DIR, slug + e)).find((f) => fs.existsSync(f))
  if (!file) throw new Error(`no post ${slug}`)
  return matter(fs.readFileSync(file, 'utf8'))
}

function meta(slug: string, data: Record<string, unknown>): PostMeta {
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date)
  return { slug, title: String(data.title), date, summary: String(data.summary ?? ''), hero: data.hero as PostMeta['hero'], source: data.source as string | undefined }
}

export function allPosts(): PostMeta[] {
  if (!fs.existsSync(DIR)) return []
  return fs.readdirSync(DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => { const slug = f.replace(/\.mdx?$/, ''); return meta(slug, read(slug).data) })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPost(slug: string) {
  const { data, content } = read(slug)
  let md = content.replace(/&#123;/g, '{').replace(/&#125;/g, '}').replace(/\bclassName=/g, 'class=')
  for (const [name, html] of Object.entries(EMBEDS)) md = md.replace(new RegExp(`<${name}\\s*/>`, 'g'), html)
  const file = await unified()
    .use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw).use(rehypeKatex)
    .use(rehypeStringify)
    .process(md)
  return { ...meta(slug, data), html: String(file) }
}

export const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
