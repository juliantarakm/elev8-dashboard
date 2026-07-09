import { findLinkByToken, getSubmissionForLink } from '../../../../utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400 })
  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404 })
  const submission = getSubmissionForLink(link.id)
  return { submission: submission ?? null }
})
