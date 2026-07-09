import type { GuestGuide, GuideStatus, GuideTemplate } from '~/components/guest-guides/data/types'
import { mockGuestGuides } from '~/components/guest-guides/data/mock-guides'
import { generateGuideId, generateSectionId } from '~/utils/guest-guide-token'
import baliVilla from '~/components/guest-guides/templates/bali-villa.json'
import mountainRetreat from '~/components/guest-guides/templates/mountain-retreat.json'
import cityApartment from '~/components/guest-guides/templates/city-apartment.json'

const templates: GuideTemplate[] = [baliVilla, mountainRetreat, cityApartment]

export function useGuestGuides() {
  const guides = useState<GuestGuide[]>('guest-guides', () => [...mockGuestGuides])

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

  function getTemplates(): GuideTemplate[] {
    return templates
  }

  function getTemplate(id: string): GuideTemplate | undefined {
    return templates.find(t => t.id === id)
  }

  function createGuideFromTemplate(templateId: string, title: string, defaultLanguage: string): GuestGuide | null {
    const template = getTemplate(templateId)
    if (!template) return null
    const now = new Date().toISOString()
    const newGuide: GuestGuide = {
      id: generateGuideId(),
      title,
      defaultLanguage,
      templateId,
      assignedListingIds: [],
      status: 'draft',
      sections: template.sections.map((s, idx) => ({
        ...s,
        id: generateSectionId(),
        order: idx,
      })),
      createdBy: 'staff-1',
      createdAt: now,
      updatedAt: now,
    }
    guides.value = [...guides.value, newGuide]
    return newGuide
  }

  return {
    guides,
    createGuide,
    createGuideFromTemplate,
    updateGuide,
    deleteGuide,
    setStatus,
    duplicateGuide,
    getTemplates,
    getTemplate,
  }
}
