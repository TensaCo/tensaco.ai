/**
 * The TensaCo D1 database (`tensaco-subscribers`), shared by every site's Worker.
 * Change this file, then `npm run db:generate` to write a migration into /migrations.
 */
import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const now = sql`(datetime('now'))`
const createdAt = () => text('created_at').notNull().default(now)

/** Email updates. One row per (email, arm): someone can follow PHASER and TensaCo separately. */
export const subscribers = sqliteTable('subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  arm: text('arm').notNull(), // 'tensaco' | 'phaser' | 'tensorcode'
  source: text('source'), // where on the site they signed up
  country: text('country'),
  ipHash: text('ip_hash'), // sha-256 of the client IP + salt, for rate limiting only
  status: text('status').notNull().default('subscribed'), // 'subscribed' | 'unsubscribed'
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('subscribers_email_arm').on(t.email, t.arm), index('subscribers_ip_recent').on(t.ipHash, t.createdAt)])

/** Accounts on tensaco.ai. Passwords are PBKDF2-SHA256 with a per-user salt. */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  organization: text('organization'),
  role: text('role').notNull().default('customer'), // 'customer' | 'staff'
  passwordHash: text('password_hash').notNull(), // base64
  passwordSalt: text('password_salt').notNull(), // base64, 16 bytes
  passwordIterations: integer('password_iterations').notNull(),
  emailVerifiedAt: text('email_verified_at'), // null until the emailed verification link is used
  notifyUpdates: integer('notify_updates', { mode: 'boolean' }).notNull().default(true), // email me about my tickets, requests, applications
  createdAt: createdAt(),
  lastLoginAt: text('last_login_at'),
})

/** Single-use emailed tokens (email verification, password reset); only the SHA-256 of the token is stored. */
export const authTokens = sqliteTable('auth_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose').notNull(), // 'verify' | 'reset'
  createdAt: createdAt(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
}, (t) => [index('auth_tokens_user').on(t.userId, t.purpose, t.createdAt)])

/** Sessions; only the SHA-256 of the cookie token is stored. */
export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  expiresAt: text('expires_at').notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
}, (t) => [index('sessions_user').on(t.userId)])

/** Job applications from /careers; résumés live in R2 (bucket tensaco-careers). */
export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: text('job_id').notNull(),
  jobTitle: text('job_title').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  location: text('location'),
  linkedin: text('linkedin'),
  website: text('website'),
  workAuthorization: text('work_authorization'),
  coverLetter: text('cover_letter'),
  resumeKey: text('resume_key'),
  resumeName: text('resume_name'),
  resumeType: text('resume_type'),
  resumeSize: integer('resume_size'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('received'), // 'received' | 'reviewing' | 'interviewing' | 'offer' | 'closed'
  source: text('source'),
  country: text('country'),
  ipHash: text('ip_hash'),
  createdAt: createdAt(),
}, (t) => [index('applications_email').on(t.email), index('applications_job').on(t.jobId, t.createdAt)])

/** Rate limiting for sign-up, log-in and applications. */
export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  ipHash: text('ip_hash').notNull(),
  createdAt: createdAt(),
}, (t) => [index('attempts_recent').on(t.kind, t.ipHash, t.createdAt)])

/** The customer success inbox. */
export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  category: text('category').notNull(), // 'general' | 'phaser' | 'tensorcode' | 'billing' | 'partnership' | 'account'
  status: text('status').notNull().default('open'), // 'open' | 'awaiting_customer' | 'resolved'
  createdAt: createdAt(),
  updatedAt: text('updated_at').notNull().default(now),
}, (t) => [index('tickets_user').on(t.userId, t.updatedAt), index('tickets_status').on(t.status, t.updatedAt)])

export const ticketMessages = sqliteTable('ticket_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  fromStaff: integer('from_staff', { mode: 'boolean' }).notNull().default(false),
  body: text('body').notNull(),
  createdAt: createdAt(),
}, (t) => [index('ticket_messages_ticket').on(t.ticketId, t.createdAt)])

/** Service requests: PHASER compute and research access, TensorCode deployment and training. */
export const serviceRequests = sqliteTable('service_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  service: text('service').notNull(), // 'phaser-compute' | 'phaser-research' | 'tensorcode-deployment' | 'tensorcode-training'
  organization: text('organization'),
  useCase: text('use_case').notNull(),
  scale: text('scale'),
  timeline: text('timeline'),
  status: text('status').notNull().default('submitted'), // 'submitted' | 'in_review' | 'approved' | 'waitlisted' | 'declined'
  staffNote: text('staff_note'),
  createdAt: createdAt(),
  updatedAt: text('updated_at').notNull().default(now),
}, (t) => [index('service_requests_user').on(t.userId, t.createdAt)])

/** Every email the Workers hand to Resend (packages/email): what, to whom, and Resend's id or the error. */
export const emailLog = sqliteTable('email_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(), // 'verify' | 'reset' | 'password_changed' | 'ticket_reply' | 'staff_ticket' | ...
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  providerId: text('provider_id'), // Resend email id
  error: text('error'),
  createdAt: createdAt(),
}, (t) => [index('email_log_recent').on(t.createdAt)])
