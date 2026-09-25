// One plain email layout in the TensaCo identity: navy bar with the wordmark, white body, Inter/system fonts.
// Table-based HTML with inline styles (what email clients render), plus a matching plain-text part. No images, no
// tracking pixels, no link rewriting.

export type Block =
  | string // a paragraph
  | { quote: string; by?: string } // a quoted message (support replies)
  | { rows: [string, string][] } // a small key/value table

export type Email = {
  subject: string
  preheader?: string
  heading: string
  blocks: Block[]
  action?: { label: string; url: string }
  footnote?: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const para = (s: string) => esc(s).replace(/\n/g, '<br>')

const NAVY = '#0a1f44', INK = '#0b1220', INK2 = '#334155', MUTED = '#64748b', LINE = '#e2e8f0', MIST = '#f4f6fa', BLUE = '#1d4ed8'
const FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function blockHtml(b: Block) {
  if (typeof b === 'string') return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK2}">${para(b)}</p>`
  if ('quote' in b) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="border-left:3px solid ${BLUE};background:${MIST};padding:14px 16px;font-size:15px;line-height:1.6;color:${INK}">`
      + (b.by ? `<div style="font-size:13px;color:${MUTED};margin-bottom:6px">${esc(b.by)}</div>` : '')
      + `${para(b.quote)}</td></tr></table>`
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${LINE};font-size:14px">`
    + b.rows.map(([k, v], i) => `<tr><td style="padding:9px 12px;color:${MUTED};width:38%;vertical-align:top;${i ? `border-top:1px solid ${LINE};` : ''}">${esc(k)}</td><td style="padding:9px 12px;color:${INK};vertical-align:top;${i ? `border-top:1px solid ${LINE};` : ''}">${para(v)}</td></tr>`).join('')
    + '</table>'
}

function blockText(b: Block) {
  if (typeof b === 'string') return b
  if ('quote' in b) return (b.by ? `${b.by}:\n` : '') + b.quote.split('\n').map((l) => `> ${l}`).join('\n')
  return b.rows.map(([k, v]) => `${k}: ${v}`).join('\n')
}

export function render(e: Email): { subject: string; html: string; text: string } {
  const footnote = e.footnote ?? 'You are receiving this email because of activity on your TensaCo account.'
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(e.subject)}</title></head>
<body style="margin:0;padding:0;background:${MIST};font-family:${FONT}">
${e.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(e.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MIST}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE}">
<tr><td style="background:${NAVY};padding:18px 28px;font-size:19px;font-weight:800;letter-spacing:-0.5px;color:#ffffff">TensaCo</td></tr>
<tr><td style="padding:32px 28px 12px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${INK}">${esc(e.heading)}</h1>
${e.blocks.map(blockHtml).join('\n')}
${e.action ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${NAVY};border-radius:4px"><a href="${esc(e.action.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(e.action.label)}</a></td></tr></table>
<p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${MUTED}">Or paste this link into your browser:<br><a href="${esc(e.action.url)}" style="color:${BLUE};word-break:break-all">${esc(e.action.url)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid ${LINE};font-size:12.5px;line-height:1.6;color:${MUTED}">${para(footnote)}<br>TensaCo Inc. &middot; <a href="https://tensaco.ai" style="color:${MUTED}">tensaco.ai</a></td></tr>
</table></td></tr></table></body></html>`
  const text = [
    e.heading, '',
    ...e.blocks.flatMap((b) => [blockText(b), '']),
    ...(e.action ? [`${e.action.label}: ${e.action.url}`, ''] : []),
    '--', footnote, 'TensaCo Inc. · https://tensaco.ai',
  ].join('\n')
  return { subject: e.subject, html, text }
}
