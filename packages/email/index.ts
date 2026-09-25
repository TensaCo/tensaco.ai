// @tensaco/email: transactional email for the TensaCo Workers (Resend over fetch) and its templates.
export { sendEmail, type EmailEnv, type Message, type SendResult } from './send'
export { render, type Block, type Email } from './layout'
export * as templates from './templates'
export { deliver, deliverNow, type DeliverEnv } from './deliver'
