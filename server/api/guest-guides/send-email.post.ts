export default defineEventHandler(async (event) => {
  const body = await readBody<{
    to: string
    subject: string
    body: string
    link: string
  }>(event)

  // Phase 5 mock — just log the email payload.
  // Future: replace with real SendGrid / SMTP integration.
  console.log('[mock email]', {
    to: body.to,
    subject: body.subject,
    link: body.link,
  })

  return { ok: true, messageId: `mock-${Date.now()}` }
})
