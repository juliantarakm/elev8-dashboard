import { findGuideByToken, findLinkByToken } from '../../../utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token required' })
  }

  const link = findLinkByToken(token)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
  }

  if (link.status === 'revoked') {
    throw createError({ statusCode: 410, statusMessage: 'This guide is no longer available' })
  }

  if (new Date(link.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'This guide has expired' })
  }

  const guide = findGuideByToken(token)
  if (!guide) {
    throw createError({ statusCode: 404, statusMessage: 'Guide content not found' })
  }

  return { link, guide }
})
