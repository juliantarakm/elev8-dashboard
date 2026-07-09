import { findLinkByToken, markLinkOpened } from '../../../../utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token required' })

  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  markLinkOpened(link.id, new Date().toISOString())
  return { ok: true }
})
