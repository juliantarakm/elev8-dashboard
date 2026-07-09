import type { GuestGuideLink } from '~/components/guest-guides/data/types'
import { conversations, reservations } from '~/components/inbox/data/conversations'
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

interface BackfillBody {
  guideId: string
  dryRun: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BackfillBody>(event)
  if (!body?.guideId) {
    throw createError({ statusCode: 400, statusMessage: 'guideId required' })
  }

  // Find all upcoming reservations in the next 30 days.
  const now = new Date()
  const windowEnd = new Date(now.getTime() + 30 * 86400000)

  const upcoming = conversations.filter((c) => {
    if (!c.checkIn) return false
    const checkIn = new Date(c.checkIn)
    if (Number.isNaN(checkIn.getTime())) return false
    return checkIn > now && checkIn < windowEnd
  })

  const links = useState<GuestGuideLink[]>('guest-guide-links', () => [])

  // Skip reservations that already have a link.
  const existingIds = new Set(links.value.map(l => l.reservationId))
  const targets = upcoming.filter(c => !existingIds.has(c.reservationId))

  const generated: GuestGuideLink[] = targets.map((c) => {
    const nowIso = new Date().toISOString()
    // expiresAt = checkOut + 1 day, fallback +7 days from now
    const baseExpiry = c.checkOut ? new Date(c.checkOut) : new Date(now.getTime() + 7 * 86400000)
    const expiresAt = new Date(baseExpiry.getTime() + 86400000).toISOString()
    const reservation = reservations[c.reservationId]
    const link: GuestGuideLink = {
      id: generateLinkId(),
      token: generateToken(),
      guideId: body.guideId,
      reservationId: c.reservationId,
      listingId: c.listingName ?? '',
      guestName: c.guestName,
      guestEmail: reservation?.guestDetails?.email,
      guestPhone: reservation?.guestDetails?.phone,
      guestLanguage: c.guestLanguage,
      sentAt: nowIso,
      expiresAt,
      status: 'pending',
      channel: 'manual',
    }
    return link
  })

  if (!body.dryRun && generated.length > 0) {
    links.value = [...links.value, ...generated]
  }

  return {
    count: generated.length,
    skipped: upcoming.length - targets.length,
    links: body.dryRun ? generated : undefined,
  }
})
