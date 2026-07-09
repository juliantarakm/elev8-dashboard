import type { GuestGuide, GuestGuideLink, GuideSubmission } from '~/components/guest-guides/data/types'
import { mockGuestGuides, mockGuestGuideLinks } from '~/components/guest-guides/data/mock-guides'

// In-memory mock store. Phase 5 swaps for real DB.
const guides = new Map<string, GuestGuide>(mockGuestGuides.map(g => [g.id, g]))
const links = new Map<string, GuestGuideLink>(mockGuestGuideLinks.map(l => [l.id, l]))
const submissions = new Map<string, GuideSubmission>()

export function findGuide(id: string): GuestGuide | undefined {
  return guides.get(id)
}

export function findLinkByToken(token: string): GuestGuideLink | undefined {
  for (const link of links.values()) {
    if (link.token === token) return link
  }
  return undefined
}

export function findGuideByToken(token: string): GuestGuide | undefined {
  const link = findLinkByToken(token)
  if (!link) return undefined
  return guides.get(link.guideId)
}

export function markLinkOpened(id: string, at: string): void {
  const link = links.get(id)
  if (link && !link.openedAt) {
    links.set(id, { ...link, openedAt: at, status: 'opened' })
  }
}

export function saveSubmission(submission: GuideSubmission): void {
  submissions.set(submission.id, submission)
  const link = links.get(submission.linkId)
  if (link) {
    links.set(link.id, { ...link, status: 'submitted', submittedAt: submission.submittedAt })
  }
}

export function getSubmissionForLink(linkId: string): GuideSubmission | undefined {
  return Array.from(submissions.values()).find(s => s.linkId === linkId)
}
