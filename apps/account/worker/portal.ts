// The signed-in console at account.tensaco.ai: overview, profile and email preferences, the customer success inbox,
// service requests and job applications. Customers see only their own records; users with role 'staff' see and act on
// every ticket, request and application, and see the customer directory.
// Emails: customers hear about staff replies and status changes (unless they turned updates off on their profile);
// staff (STAFF_EMAIL) hear about new tickets, customer replies and new service requests.
import { templates } from '@tensaco/email'
import { applications, db, serviceRequests, subscribers, ticketMessages, tickets, users } from '@tensaco/db'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import { currentUser } from './auth'
import { accountUrl, staffEmail, type Env } from './env'
import { clean, json, readJson, sameOrigin } from './lib'
import { mail } from './mail'

const CATEGORIES: Record<string, string> = { general: 'General question', phaser: 'PHASER', tensorcode: 'TensorCode', billing: 'Billing', partnership: 'Partnerships', account: 'Account and access' }
const SERVICES: Record<string, string> = {
  'phaser-compute': 'PHASER compute access',
  'phaser-research': 'PHASER research collaboration',
  'tensorcode-deployment': 'TensorCode deployment support',
  'tensorcode-training': 'TensorCode model training',
}
const TICKET_STATUS = ['open', 'awaiting_customer', 'resolved']
const REQUEST_STATUS: Record<string, string> = { submitted: 'Submitted', in_review: 'In review', approved: 'Approved', waitlisted: 'Waitlisted', declined: 'Declined' }
const APPLICATION_STATUS: Record<string, string> = { received: 'Received', reviewing: 'Under review', interviewing: 'Interviewing', offer: 'Offer', closed: 'Closed' }
const NOW = sql`datetime('now')` as unknown as string

export async function portal(request: Request, env: Env, ctx: ExecutionContext, path: string) {
  const user = await currentUser(request, env)
  if (!user) return json({ ok: false, error: 'Please sign in.' }, 401)
  const staff = user.role === 'staff'
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403)
  const d = db(env.DB)
  const base = accountUrl(env)
  const mine = or(eq(applications.userId, user.id), eq(applications.email, user.email))

  // GET /api/account — everything the overview and lists show
  if (path === '/api/account' && request.method === 'GET') {
    const [apps, inbox, requests, [sub]] = await Promise.all([
      d.select({ id: applications.id, jobId: applications.jobId, jobTitle: applications.jobTitle, name: applications.name, email: applications.email, status: applications.status, createdAt: applications.createdAt })
        .from(applications).where(staff ? undefined : mine).orderBy(desc(applications.createdAt)).limit(500),
      d.select({ id: tickets.id, subject: tickets.subject, category: tickets.category, status: tickets.status, createdAt: tickets.createdAt, updatedAt: tickets.updatedAt, customer: users.email })
        .from(tickets).innerJoin(users, eq(users.id, tickets.userId))
        .where(staff ? undefined : eq(tickets.userId, user.id)).orderBy(desc(tickets.updatedAt)).limit(500),
      d.select({ id: serviceRequests.id, service: serviceRequests.service, organization: serviceRequests.organization, status: serviceRequests.status, createdAt: serviceRequests.createdAt, updatedAt: serviceRequests.updatedAt, customer: users.email })
        .from(serviceRequests).innerJoin(users, eq(users.id, serviceRequests.userId))
        .where(staff ? undefined : eq(serviceRequests.userId, user.id)).orderBy(desc(serviceRequests.createdAt)).limit(500),
      d.select({ status: subscribers.status }).from(subscribers).where(and(eq(subscribers.email, user.email), eq(subscribers.arm, 'tensaco'))),
    ])
    return json({ user, applications: apps, tickets: inbox, requests, subscribed: sub?.status === 'subscribed' })
  }

  // POST /api/account/profile — name, organization, email preferences
  if (path === '/api/account/profile' && request.method === 'POST') {
    const b = await readJson<{ name?: string; organization?: string; subscribed?: boolean; notify_updates?: boolean }>(request)
    const name = clean(b?.name, 120)
    if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400)
    await d.update(users).set({
      name, organization: clean(b?.organization, 160) || null,
      ...(typeof b?.notify_updates === 'boolean' ? { notifyUpdates: b.notify_updates } : {}),
    }).where(eq(users.id, user.id))
    if (typeof b?.subscribed === 'boolean') {
      const status = b.subscribed ? 'subscribed' : 'unsubscribed'
      await d.insert(subscribers).values({ email: user.email, arm: 'tensaco', source: 'account', status, unsubscribeToken: crypto.randomUUID() })
        .onConflictDoUpdate({ target: [subscribers.email, subscribers.arm], set: { status } })
    }
    return json({ ok: true })
  }

  // POST /api/support/tickets — open a ticket with its first message
  if (path === '/api/support/tickets' && request.method === 'POST') {
    const b = await readJson<{ subject?: string; body?: string; category?: string }>(request)
    const subject = clean(b?.subject, 160), body = clean(b?.body, 8000)
    const category = String(b?.category) in CATEGORIES ? String(b?.category) : 'general'
    if (!subject || !body) return json({ ok: false, error: 'Please add a subject and a message.' }, 400)
    const [t] = await d.insert(tickets).values({ userId: user.id, subject, category }).returning({ id: tickets.id })
    await d.insert(ticketMessages).values({ ticketId: t.id, authorId: user.id, fromStaff: false, body })
    mail(env, ctx, 'staff_ticket', staffEmail(env), templates.staffTicket({
      id: t.id, subject, category: CATEGORIES[category], customer: customerLine(user), body, url: `${base}/support/ticket/?id=${t.id}`,
    }))
    return json({ ok: true, id: t.id })
  }

  // /api/support/tickets/:id — read the thread (GET), reply (POST), change status (PATCH)
  const m = /^\/api\/support\/tickets\/(\d+)$/.exec(path)
  if (m) {
    const id = Number(m[1])
    const [ticket] = await d.select({
      id: tickets.id, userId: tickets.userId, subject: tickets.subject, category: tickets.category, status: tickets.status,
      createdAt: tickets.createdAt, updatedAt: tickets.updatedAt, customerName: users.name, customerEmail: users.email, customerOrg: users.organization,
      customerNotify: users.notifyUpdates,
    }).from(tickets).innerJoin(users, eq(users.id, tickets.userId)).where(eq(tickets.id, id))
    if (!ticket || (!staff && ticket.userId !== user.id)) return json({ ok: false, error: 'Not found.' }, 404)
    if (request.method === 'GET') {
      const messages = await d.select({ id: ticketMessages.id, body: ticketMessages.body, fromStaff: ticketMessages.fromStaff, createdAt: ticketMessages.createdAt, author: users.name })
        .from(ticketMessages).leftJoin(users, eq(users.id, ticketMessages.authorId))
        .where(eq(ticketMessages.ticketId, id)).orderBy(asc(ticketMessages.createdAt), asc(ticketMessages.id))
      const { customerNotify: _, ...t } = ticket
      return json({ ticket: t, messages, staff })
    }
    const b = await readJson<{ body?: string; status?: string }>(request)
    if (request.method === 'POST') {
      const body = clean(b?.body, 8000)
      if (!body) return json({ ok: false, error: 'Please write a message.' }, 400)
      const asStaff = staff && ticket.userId !== user.id
      await d.insert(ticketMessages).values({ ticketId: id, authorId: user.id, fromStaff: asStaff, body })
      await d.update(tickets).set({ status: asStaff ? 'awaiting_customer' : 'open', updatedAt: NOW }).where(eq(tickets.id, id))
      if (asStaff) {
        if (ticket.customerNotify) {
          mail(env, ctx, 'ticket_reply', ticket.customerEmail, templates.ticketReply({
            name: ticket.customerName, subject: ticket.subject, body, by: `${user.name.split(' ')[0]} at TensaCo`,
            url: `${base}/support/ticket/?id=${id}`, account: base,
          }))
        }
      } else {
        mail(env, ctx, 'staff_ticket_reply', staffEmail(env), templates.staffTicket({
          id, subject: ticket.subject, category: CATEGORIES[ticket.category] ?? ticket.category, customer: customerLine(user), body,
          url: `${base}/support/ticket/?id=${id}`, reply: true,
        }))
      }
      return json({ ok: true })
    }
    if (request.method === 'PATCH') {
      const status = String(b?.status)
      if (!TICKET_STATUS.includes(status)) return json({ ok: false, error: 'Bad status.' }, 400)
      if (!staff && status !== 'resolved' && status !== 'open') return json({ ok: false, error: 'Forbidden.' }, 403)
      await d.update(tickets).set({ status, updatedAt: NOW }).where(eq(tickets.id, id))
      return json({ ok: true })
    }
  }

  // POST /api/services/requests — request a service
  if (path === '/api/services/requests' && request.method === 'POST') {
    const b = await readJson<{ service?: string; use_case?: string; organization?: string; scale?: string; timeline?: string }>(request)
    const service = String(b?.service)
    const useCase = clean(b?.use_case, 6000)
    if (!(service in SERVICES)) return json({ ok: false, error: 'Please choose a service.' }, 400)
    if (!useCase) return json({ ok: false, error: 'Please describe what you want to run.' }, 400)
    const values = {
      userId: user.id, service, useCase, organization: clean(b?.organization, 160) || user.organization || null,
      scale: clean(b?.scale, 300) || null, timeline: clean(b?.timeline, 120) || null,
    }
    const [r] = await d.insert(serviceRequests).values(values).returning({ id: serviceRequests.id })
    mail(env, ctx, 'staff_request', staffEmail(env), templates.staffRequest({
      id: r.id, service: SERVICES[service], customer: customerLine(user), organization: values.organization, timeline: values.timeline,
      scale: values.scale, useCase, url: `${base}/services/request/?id=${r.id}`,
    }))
    return json({ ok: true, id: r.id })
  }

  // /api/services/requests/:id — one request (owner or staff); PATCH status and note (staff)
  const q = /^\/api\/services\/requests\/(\d+)$/.exec(path)
  if (q) {
    const [req] = await d.select({ r: serviceRequests, customerName: users.name, customerEmail: users.email, customerNotify: users.notifyUpdates })
      .from(serviceRequests).innerJoin(users, eq(users.id, serviceRequests.userId)).where(eq(serviceRequests.id, Number(q[1])))
    if (!req || (!staff && req.r.userId !== user.id)) return json({ ok: false, error: 'Not found.' }, 404)
    if (request.method === 'GET') {
      return json({ request: req.r, customer: staff ? { name: req.customerName, email: req.customerEmail } : undefined, staff })
    }
    if (request.method === 'PATCH' && staff) {
      const b = await readJson<{ status?: string; staff_note?: string }>(request)
      const status = String(b?.status)
      if (!(status in REQUEST_STATUS)) return json({ ok: false, error: 'Bad status.' }, 400)
      const staffNote = clean(b?.staff_note, 2000) || null
      await d.update(serviceRequests).set({ status, staffNote, updatedAt: NOW }).where(eq(serviceRequests.id, req.r.id))
      if ((status !== req.r.status || staffNote !== req.r.staffNote) && req.customerNotify) {
        mail(env, ctx, 'request_status', req.customerEmail, templates.requestStatus({
          name: req.customerName, service: SERVICES[req.r.service] ?? req.r.service, status: REQUEST_STATUS[status], note: staffNote,
          url: `${base}/services/request/?id=${req.r.id}`, account: base,
        }))
      }
      return json({ ok: true })
    }
  }

  // /api/applications/:id — one application (the applicant or staff); PATCH status (staff); /resume (staff)
  const a = /^\/api\/applications\/(\d+)(\/resume)?$/.exec(path)
  if (a) {
    const [app] = await d.select().from(applications).where(eq(applications.id, Number(a[1])))
    const owner = app && (app.userId === user.id || app.email === user.email)
    if (!app || (!staff && !owner)) return json({ ok: false, error: 'Not found.' }, 404)
    if (a[2]) {
      if (!staff || !app.resumeKey) return json({ ok: false, error: 'Not found.' }, 404)
      const obj = await env.RESUMES.get(app.resumeKey)
      if (!obj) return json({ ok: false, error: 'Résumé not found.' }, 404)
      const name = (app.resumeName ?? 'resume').replace(/[^\w.\- ]/g, '_')
      return new Response(obj.body, {
        headers: { 'content-type': app.resumeType || 'application/octet-stream', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
      })
    }
    if (request.method === 'GET') {
      if (staff) {
        const { ipHash: _, resumeKey, ...rest } = app
        return json({ application: { ...rest, hasResume: !!resumeKey }, staff })
      }
      const { id, jobId, jobTitle, name, email, status, createdAt } = app
      return json({ application: { id, jobId, jobTitle, name, email, status, createdAt }, staff })
    }
    if (request.method === 'PATCH' && staff) {
      const b = await readJson<{ status?: string }>(request)
      const status = String(b?.status)
      if (!(status in APPLICATION_STATUS)) return json({ ok: false, error: 'Bad status.' }, 400)
      await d.update(applications).set({ status }).where(eq(applications.id, app.id))
      if (status !== app.status) {
        const [acct] = await d.select({ notify: users.notifyUpdates }).from(users).where(eq(users.email, app.email))
        if (!acct || acct.notify) {
          mail(env, ctx, 'application_status', app.email, templates.applicationStatus({
            name: app.name, job: app.jobTitle, status: APPLICATION_STATUS[status], url: `${base}/applications/`, account: base,
          }))
        }
      }
      return json({ ok: true })
    }
  }

  // GET /api/staff/users — the customer directory (staff)
  if (path === '/api/staff/users' && request.method === 'GET' && staff) {
    const rows = await d.select({
      id: users.id, email: users.email, name: users.name, organization: users.organization, role: users.role,
      emailVerifiedAt: users.emailVerifiedAt, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt,
      tickets: sql<number>`(select count(*) from ${tickets} where ${tickets.userId} = ${users.id})`,
      requests: sql<number>`(select count(*) from ${serviceRequests} where ${serviceRequests.userId} = ${users.id})`,
    }).from(users).orderBy(desc(users.createdAt)).limit(1000)
    return json({ users: rows })
  }

  return json({ ok: false, error: 'Not found.' }, 404)
}

const customerLine = (u: { name: string; email: string; organization: string | null }) => `${u.name} <${u.email}>${u.organization ? ` · ${u.organization}` : ''}`
