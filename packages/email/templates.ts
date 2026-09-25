// Every email TensaCo sends. Each returns { subject, html, text } for sendEmail().
import { render } from './layout'

const PREFS = (account: string) =>
  `You are receiving this because of activity on your TensaCo account. Change which updates you get by email at ${account}/profile/.`
const STAFF_NOTE = 'Staff notification from the TensaCo account portal.'

// ---- account security (always sent) ----

export const verifyEmail = (p: { name: string; url: string }) => render({
  subject: 'Verify your email for your TensaCo account',
  preheader: 'Confirm this address to finish setting up your account.',
  heading: 'Verify your email address',
  blocks: [`Hello ${p.name},`, 'Confirm that this is your email address to finish setting up your TensaCo account. The link is valid for 7 days.'],
  action: { label: 'Verify email address', url: p.url },
  footnote: 'If you did not create a TensaCo account, you can ignore this email; the account will stay unverified.',
})

export const passwordReset = (p: { name: string; url: string }) => render({
  subject: 'Reset your TensaCo password',
  preheader: 'A link to choose a new password. It expires in 1 hour.',
  heading: 'Reset your password',
  blocks: [`Hello ${p.name},`, 'We received a request to reset the password for your TensaCo account. The link below works once and expires in 1 hour.'],
  action: { label: 'Choose a new password', url: p.url },
  footnote: 'If you did not ask to reset your password, you can ignore this email; your password will not change.',
})

export const passwordChanged = (p: { name: string; account: string }) => render({
  subject: 'Your TensaCo password was changed',
  heading: 'Your password was changed',
  blocks: [`Hello ${p.name},`, 'The password for your TensaCo account was just changed, and every other session was signed out.',
    'If you did not do this, reset your password now and contact hello@tensaco.ai.'],
  action: { label: 'Reset password', url: `${p.account}/forgot/` },
  footnote: 'This is a security notice about your TensaCo account; it is sent regardless of your email preferences.',
})

// ---- updates to the customer (respect users.notify_updates) ----

export const ticketReply = (p: { name: string; subject: string; body: string; by: string; url: string; account: string }) => render({
  subject: `Re: ${p.subject}`,
  preheader: `${p.by} replied to your support conversation.`,
  heading: 'New reply from TensaCo customer success',
  blocks: [`Hello ${p.name},`, `${p.by} replied to your conversation “${p.subject}”:`, { quote: p.body }, 'Reply in the account portal so the whole thread stays in one place.'],
  action: { label: 'View conversation', url: p.url },
  footnote: PREFS(p.account),
})

export const requestStatus = (p: { name: string; service: string; status: string; note: string | null; url: string; account: string }) => render({
  subject: `Your ${p.service} request: ${p.status}`,
  heading: 'Your service request was updated',
  blocks: [`Hello ${p.name},`, `The status of your ${p.service} request is now: ${p.status}.`, ...(p.note ? [{ quote: p.note, by: 'Note from TensaCo' }] : [])],
  action: { label: 'View request', url: p.url },
  footnote: PREFS(p.account),
})

export const applicationStatus = (p: { name: string; job: string; status: string; url: string; account: string }) => render({
  subject: `Your application for ${p.job}: ${p.status}`,
  heading: 'Your application was updated',
  blocks: [`Hello ${p.name},`, `The status of your application for ${p.job} is now: ${p.status}.`, 'We will contact you directly about next steps.'],
  action: { label: 'View your applications', url: p.url },
  footnote: `You are receiving this because you applied for a position at TensaCo. Sign in at ${p.account} with the same email to track your applications.`,
})

export const applicationReceived = (p: { name: string; job: string; account: string }) => render({
  subject: `We received your application for ${p.job}`,
  heading: 'Thank you for applying',
  blocks: [`Hello ${p.name},`, `We received your application for ${p.job}. Our team reviews every application, and we will be in touch about next steps.`,
    'To follow its status, sign in to your TensaCo account (or create one) with this email address.'],
  action: { label: 'Track your application', url: `${p.account}/applications/` },
  footnote: 'You are receiving this because this address was used to apply for a position at TensaCo.',
})

// ---- staff notifications (to STAFF_EMAIL) ----

export const staffTicket = (p: { id: number; subject: string; category: string; customer: string; body: string; url: string; reply?: boolean }) => render({
  subject: `[Support #${p.id}] ${p.reply ? 'Customer reply: ' : ''}${p.subject}`,
  heading: p.reply ? 'Customer replied to a support conversation' : 'New support conversation',
  blocks: [{ rows: [['Customer', p.customer], ['Topic', p.category], ['Subject', p.subject]] }, { quote: p.body }],
  action: { label: 'Open in the portal', url: p.url },
  footnote: STAFF_NOTE,
})

export const staffRequest = (p: { id: number; service: string; customer: string; organization: string | null; timeline: string | null; scale: string | null; useCase: string; url: string }) => render({
  subject: `[Service request #${p.id}] ${p.service} — ${p.organization ?? p.customer}`,
  heading: 'New service request',
  blocks: [{ rows: [['Service', p.service], ['Customer', p.customer], ['Organization', p.organization ?? '—'], ['Timeline', p.timeline ?? '—'], ['Scale', p.scale ?? '—']] }, { quote: p.useCase, by: 'Use case' }],
  action: { label: 'Review in the portal', url: p.url },
  footnote: STAFF_NOTE,
})

export const staffApplication = (p: { id: number; job: string; name: string; email: string; location: string | null; linkedin: string | null; url: string }) => render({
  subject: `[Application #${p.id}] ${p.job} — ${p.name}`,
  heading: 'New job application',
  blocks: [{ rows: [['Position', p.job], ['Name', p.name], ['Email', p.email], ['Location', p.location ?? '—'], ['LinkedIn', p.linkedin ?? '—']] }],
  action: { label: 'Review in the portal', url: p.url },
  footnote: STAFF_NOTE,
})
