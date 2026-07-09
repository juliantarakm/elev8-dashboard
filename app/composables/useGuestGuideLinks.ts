import type { GuestGuideLink, LinkChannel } from '~/components/guest-guides/data/types'
import { mockGuestGuideLinks } from '~/components/guest-guides/data/mock-guides'
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

export function useGuestGuideLinks() {
  const links = useState<GuestGuideLink[]>('guest-guide-links', () => [...mockGuestGuideLinks])

  function issueLink(input: {
    guideId: string
    reservationId: string
    listingId: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    guestLanguage?: string
    channel: LinkChannel
    expiresAt: string
    metadata?: { journeyId?: string; templateId?: string }
  }): GuestGuideLink {
    if (links.value.some(l => l.reservationId === input.reservationId)) {
      throw new Error(`Link already issued for reservation ${input.reservationId}`)
    }
    const now = new Date().toISOString()
    const newLink: GuestGuideLink = {
      id: generateLinkId(),
      token: generateToken(),
      guideId: input.guideId,
      reservationId: input.reservationId,
      listingId: input.listingId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestLanguage: input.guestLanguage,
      sentAt: now,
      expiresAt: input.expiresAt,
      status: 'pending',
      channel: input.channel,
      metadata: input.metadata,
    }
    links.value = [...links.value, newLink]
    return newLink
  }

  function updateLink(id: string, patch: Partial<GuestGuideLink>): void {
    links.value = links.value.map(l => (l.id === id ? { ...l, ...patch } : l))
  }

  function markOpened(id: string): void {
    const link = links.value.find(l => l.id === id)
    if (!link) return
    updateLink(id, {
      status: 'opened',
      openedAt: link.openedAt ?? new Date().toISOString(),
    })
  }

  function markSubmitted(id: string): void {
    updateLink(id, {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    })
  }

  function revokeLink(id: string): void {
    updateLink(id, { status: 'revoked' })
  }

  function findByToken(token: string): GuestGuideLink | undefined {
    return links.value.find(l => l.token === token)
  }

  function findByReservation(reservationId: string): GuestGuideLink | undefined {
    return links.value.find(l => l.reservationId === reservationId)
  }

  function findByGuide(guideId: string): GuestGuideLink[] {
    return links.value.filter(l => l.guideId === guideId)
  }

  return {
    links,
    issueLink,
    updateLink,
    markOpened,
    markSubmitted,
    revokeLink,
    findByToken,
    findByReservation,
    findByGuide,
  }
}