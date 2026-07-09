import type { GuestGuide, GuideStatus } from '~/components/guest-guides/data/types'
import { generateGuideId } from '~/utils/guest-guide-token'

export function useGuestGuides() {
  const guides = useState<GuestGuide[]>('guest-guides', () => [])

  function createGuide(input: {
    title: string
    description?: string
    defaultLanguage: string
    templateId?: string
  }): GuestGuide {
    const now = new Date().toISOString()
    const newGuide: GuestGuide = {
      id: generateGuideId(),
      title: input.title,
      description: input.description,
      assignedListingIds: [],
      templateId: input.templateId,
      status: 'draft',
      sections: [],
      defaultLanguage: input.defaultLanguage,
      createdBy: 'staff-1', // current user — Komang in production
      createdAt: now,
      updatedAt: now,
    }
    guides.value = [...guides.value, newGuide]
    return newGuide
  }

  function updateGuide(id: string, patch: Partial<GuestGuide>): void {
    guides.value = guides.value.map(g =>
      g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g,
    )
  }

  function deleteGuide(id: string): void {
    guides.value = guides.value.filter(g => g.id !== id)
  }

  function setStatus(id: string, status: GuideStatus): void {
    updateGuide(id, { status })
  }

  function duplicateGuide(id: string): GuestGuide | null {
    const source = guides.value.find(g => g.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const copy: GuestGuide = {
      ...source,
      id: generateGuideId(),
      title: `${source.title} (copy)`,
      status: 'draft',
      assignedListingIds: [],
      createdAt: now,
      updatedAt: now,
    }
    guides.value = [...guides.value, copy]
    return copy
  }

  return {
    guides,
    createGuide,
    updateGuide,
    deleteGuide,
    setStatus,
    duplicateGuide,
  }
}
