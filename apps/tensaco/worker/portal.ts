// The signed-in portal on tensaco.ai: account overview, profile and email preferences, the customer success inbox, and
// service requests. Customers see their own records; users with role 'staff' see and answer every ticket.
import { applications, db, serviceRequests, subscribers, ticketMessages, tickets, users } from '@tensaco/db'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import { currentUser } from './auth'
import type { Env } from './env'
import { clean, json, readJson, sameOrigin } from './lib'

const CATEGORIES = ['general', 'phaser', 'tensorcode', 'billing', 'partnership', 'account']
const SERVICES = ['phaser-compute', 'phaser-research', 'tensorcode-deployment', 'tensorcode-training']
const TICKET_STATUS = ['open', 'awaiting_customer', 'resolved']
const REQUEST_STATUS = ['submitted', 'in_review', 'approved', 'waitlisted', 'declined']
const NOW = sql`datetime('now')` as unknown as string

export async function portal(request: Request, env: Env, path: string) {
  const user = await currentUser(request, env)
  if (!user) return json({ ok: false, error: 'Please log in.' }, 401)
  const staff = user.role === 'staff'
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403)
  const d = db(env.DB)

  // GET /api/account — everything the dashboard shows
  if (path === '/api/account' && request.method === 'GET') {
    const [apps, inbox, requests, [sub]] = await Promise.all([
      d.select({ id: applications.id, jobId: applications.jobId, jobTitle: applications.jobTitle, status: applications.status, createdAt: applications.createdAt })
        .from(applications).where(or(eq(applications.userId, user.id), eq(applications.email, user.email))).orderBy(desc(applications.createdAt)),
      d.select({ id: tickets.id, subject: tickets.subject, category: tickets.category, status: tickets.status, updatedAt: tickets.updatedAt, customer: users.email })
        .from(tickets).innerJoin(users, eq(users.id, tickets.userId))
        .where(staff ? undefined : eq(tickets.userId, user.id)).orderBy(desc(tickets.updatedAt)).limit(200),
      d.select({ id: serviceRequests.id, service: serviceRequests.service, organization: serviceRequests.organization, status: serviceRequests.status, createdAt: serviceRequests.createdAt, updatedAt: serviceRequests.updatedAt })
        .from(serviceRequests).where(staff ? undefined : eq(serviceRequests.userId, user.id)).orderBy(desc(serviceRequests.createdAt)),
      d.select({ status: subscribers.status }).from(subscribers).where(and(eq(subscribers.email, user.email), eq(subscribers.arm, 'tensaco'))),
    ])
    return json({ user, applications: apps, tickets: inbox, requests, subscribed: sub?.status === 'subscribed' })
  }

  // POST /api/account/profile — name, organization, newsletter
  if (path === '/api/account/profile' && request.method === 'POST') {
    const b = await readJson<{ name?: string; organization?: string; subscribed?: boolean }>(request)
    const name = clean(b?.name, 120)
    if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400)
    await d.update(users).set({ name, organization: clean(b?.organization, 160) || null }).where(eq(users.id, user.id))
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
    const category = CATEGORIES.includes(String(b?.category)) ? String(b?.category) : 'general'
    if (!subject || !body) return json({ ok: false, error: 'Please add a subject and a message.' }, 400)
    const [t] = await d.insert(tickets).values({ userId: user.id, subject, category }).returning({ id: tickets.id })
    await d.insert(ticketMessages).values({ ticketId: t.id, authorId: user.id, fromStaff: false, body })
    return json({ ok: true, id: t.id })
  }

  // /api/support/tickets/:id — read the thread (GET), reply (POST), change status (PATCH)
  const m = /^\/api\/support\/tickets\/(\d+)$/.exec(path)
  if (m) {
    const id = Number(m[1])
    const [ticket] = await d.select({
      id: tickets.id, userId: tickets.userId, subject: tickets.subject, category: tickets.category, status: tickets.status,
      createdAt: tickets.createdAt, updatedAt: tickets.updatedAt, customerName: users.name, customerEmail: users.email, customerOrg: users.organization,
    }).from(tickets).innerJoin(users, eq(users.id, tickets.userId)).where(eq(tickets.id, id))
    if (!ticket || (!staff && ticket.userId !== user.id)) return json({ ok: false, error: 'Not found.' }, 404)
    if (request.method === 'GET') {
      const messages = await d.select({ id: ticketMessages.id, body: ticketMessages.body, fromStaff: ticketMessages.fromStaff, createdAt: ticketMessages.createdAt, author: users.name })
        .from(ticketMessages).leftJoin(users, eq(users.id, ticketMessages.authorId))
        .where(eq(ticketMessages.ticketId, id)).orderBy(asc(ticketMessages.createdAt), asc(ticketMessages.id))
      return json({ ticket, messages, staff })
    }
    const b = await readJson<{ body?: string; status?: string }>(request)
    if (request.method === 'POST') {
      const body = clean(b?.body, 8000)
      if (!body) return json({ ok: false, error: 'Please write a message.' }, 400)
      await d.insert(ticketMessages).values({ ticketId: id, authorId: user.id, fromStaff: staff, body })
      await d.update(tickets).set({ status: staff ? 'awaiting_customer' : 'open', updatedAt: NOW }).where(eq(tickets.id, id))
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
    if (!SERVICES.includes(service)) return json({ ok: false, error: 'Please choose a service.' }, 400)
    if (!useCase) return json({ ok: false, error: 'Please describe what you want to run.' }, 400)
    const [r] = await d.insert(serviceRequests).values({
      userId: user.id, service, useCase, organization: clean(b?.organization, 160) || user.organization || null,
      scale: clean(b?.scale, 300) || null, timeline: clean(b?.timeline, 120) || null,
    }).returning({ id: serviceRequests.id })
    return json({ ok: true, id: r.id })
  }

  // /api/services/requests/:id — one request (owner or staff); PATCH status (staff)
  const q = /^\/api\/services\/requests\/(\d+)$/.exec(path)
  if (q) {
    const [req] = await d.select().from(serviceRequests).where(eq(serviceRequests.id, Number(q[1])))
    if (!req || (!staff && req.userId !== user.id)) return json({ ok: false, error: 'Not found.' }, 404)
    if (request.method === 'GET') return json({ request: req, staff })
    if (request.method === 'PATCH' && staff) {
      const b = await readJson<{ status?: string; staff_note?: string }>(request)
      const status = String(b?.status)
      if (!REQUEST_STATUS.includes(status)) return json({ ok: false, error: 'Bad status.' }, 400)
      await d.update(serviceRequests).set({ status, staffNote: clean(b?.staff_note, 2000) || null, updatedAt: NOW }).where(eq(serviceRequests.id, req.id))
      return json({ ok: true })
    }
  }

  return json({ ok: false, error: 'Not found.' }, 404)
}
