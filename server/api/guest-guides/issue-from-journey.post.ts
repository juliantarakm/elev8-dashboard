import type { GuestGuideLink } from '~/components/guest-guides/data/types'
import { findGuide, saveLink } from '../../utils/guest-guide-store'
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    guideId: string
    reservationId: string
    listingId: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    guestLanguage?: string
    channel: 'whatsapp' | 'email' | 'manual'
    expiresAt: string
    journeyId?: string
    templateId?: string
  }>(event)

  if (!body?.guideId || !body?.reservationId || !body?.listingId || !body?.guestName || !body?.channel || !body?.expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: guideId, reservationId, listingId, guestName, channel, expiresAt' })
  }

  const guide = findGuide(body.guideId)
  if (!guide) {
    throw createError({ statusCode: 404, statusMessage: `Guide ${body.guideId} not found` })
  }

  const now = new Date().toISOString()
  const link: GuestGuideLink = {
    id: generateLinkId(),
    token: generateToken(),
    guideId: body.guideId,
    reservationId: body.reservationId,
    listingId: body.listingId,
    guestName: body.guestName,
    guestEmail: body.guestEmail,
    guestPhone: body.guestPhone,
    guestLanguage: body.guestLanguage,
    sentAt: now,
    expiresAt: body.expiresAt,
    status: 'pending',
    channel: body.channel,
    metadata: { journeyId: body.journeyId, templateId: body.templateId },
  }

  // Persist to in-memory store (shared with findLinkByToken)
  saveLink(link)

  return {
    linkId: link.id,
    token: link.token,
    url: `https://guide.elev8-suite.com/${link.token}`,
  }
})