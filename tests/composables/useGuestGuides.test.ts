import { describe, expect, it, beforeEach } from 'vitest'
import { useGuestGuides } from '~/composables/useGuestGuides'

describe('useGuestGuides', () => {
  beforeEach(() => {
    // reset state between tests
    const { guides } = useGuestGuides()
    guides.value = []
  })

  it('starts with empty guides array', () => {
    const { guides } = useGuestGuides()
    expect(guides.value).toEqual([])
  })

  it('creates a guide with auto-generated id', () => {
    const { createGuide } = useGuestGuides()
    const guide = createGuide({
      title: 'Test Guide',
      defaultLanguage: 'en',
    })
    expect(guide.id).toMatch(/^gg-/)
    expect(guide.title).toBe('Test Guide')
    expect(guide.status).toBe('draft')
    expect(guide.sections).toEqual([])
  })

  it('updates a guide via spread', () => {
    const { createGuide, updateGuide } = useGuestGuides()
    const guide = createGuide({ title: 'A', defaultLanguage: 'en' })
    updateGuide(guide.id, { title: 'B' })
    const { guides } = useGuestGuides()
    expect(guides.value.find(g => g.id === guide.id)?.title).toBe('B')
  })

  it('deletes a guide', () => {
    const { createGuide, deleteGuide, guides } = useGuestGuides()
    const guide = createGuide({ title: 'A', defaultLanguage: 'en' })
    deleteGuide(guide.id)
    expect(guides.value.find(g => g.id === guide.id)).toBeUndefined()
  })
})
