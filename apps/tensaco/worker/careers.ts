// POST /api/careers/apply — multipart form. The application goes to D1 (applications), the résumé to R2
// (bucket tensaco-careers, binding RESUMES). Honeypot field `company`; limited per client per hour.
// Emails: a confirmation to the applicant and a notification to staff (STAFF_EMAIL), via packages/email.
import { applications, db } from '@tensaco/db'
import { deliver, templates } from '@tensaco/email'
import { JOBS } from '../src/data/jobs'
import { currentUser } from './auth'
import { accountUrl, type Env } from './env'
import { allow, clean, country, EMAIL, ipHash, json, sameOrigin } from './lib'

const MAX_RESUME = 10 * 1024 * 1024
const TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}
const TITLES: Record<string, string> = Object.fromEntries([...JOBS.map((j) => [j.id, j.title]), ['general', 'General application']])

export async function apply(request: Request, env: Env, ctx: ExecutionContext) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Use POST.' }, 405)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403)
  let form: FormData
  try { form = await request.formData() } catch { return json({ ok: false, error: 'Bad request.' }, 400) }
  if (form.get('company')) return json({ ok: true }) // honeypot

  const jobId = clean(form.get('job_id'), 80)
  const jobTitle = TITLES[jobId]
  if (!jobTitle) return json({ ok: false, error: 'This position is no longer open.' }, 400)
  const name = clean(form.get('name'), 120)
  const email = clean(form.get('email'), 254).toLowerCase()
  if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400)
  if (!EMAIL.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400)

  const resume = form.get('resume')
  if (!(resume instanceof File) || resume.size === 0) return json({ ok: false, error: 'Please attach your résumé.' }, 400)
  if (resume.size > MAX_RESUME) return json({ ok: false, error: 'Résumés must be 10 MB or smaller.' }, 400)
  const ext = TYPES[resume.type] ?? /\.(pdf|docx?|txt)$/i.exec(resume.name)?.[1]?.toLowerCase()
  if (!ext) return json({ ok: false, error: 'Please upload a PDF, Word document or text file.' }, 400)

  const hash = await ipHash(request, env)
  if (!(await allow(env, 'apply', hash, 8, 60))) return json({ ok: false, error: 'Too many applications from your network. Please try again later.' }, 429)

  const key = `resumes/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`
  await env.RESUMES.put(key, resume.stream(), {
    httpMetadata: { contentType: resume.type || 'application/octet-stream', contentDisposition: `attachment; filename="${clean(resume.name, 120).replace(/"/g, '')}"` },
    customMetadata: { job: jobId, email },
  })
  const user = await currentUser(request, env)
  const opt = (k: string, max: number) => clean(form.get(k), max) || null
  const [row] = await db(env.DB).insert(applications).values({
    jobId, jobTitle, name, email,
    phone: opt('phone', 40), location: opt('location', 120), linkedin: opt('linkedin', 300), website: opt('website', 300),
    workAuthorization: opt('work_authorization', 60), coverLetter: opt('cover_letter', 8000),
    resumeKey: key, resumeName: clean(resume.name, 200), resumeType: resume.type || null, resumeSize: resume.size,
    userId: user?.id ?? null, source: opt('source', 80), country: country(request), ipHash: hash,
  }).returning({ id: applications.id })
  const account = accountUrl(env)
  deliver(env, ctx, 'application_received', email, templates.applicationReceived({ name, job: jobTitle, account }))
  deliver(env, ctx, 'staff_application', env.STAFF_EMAIL || 'hello@tensaco.ai', templates.staffApplication({
    id: row.id, job: jobTitle, name, email, location: opt('location', 120), linkedin: opt('linkedin', 300), url: `${account}/applications/view/?id=${row.id}`,
  }), email)
  return json({ ok: true })
}
