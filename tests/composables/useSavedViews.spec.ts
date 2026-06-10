import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSavedViews } from '~/composables/useSavedViews'

describe('useSavedViews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { savedViews, activeView, isDirty, isLoading } = useSavedViews()
    expect(savedViews.value).toEqual([])
    expect(activeView.value).toBe(null)
    expect(isDirty.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('fetchViews loads views from API', async () => {
    const mockViews = [
      {
        id: 'view1',
        name: 'Test View',
        searchValue: '',
        activeTagFilter: [],
        activeAiFilter: null,
        columnVisibility: {},
        pageSize: 15,
        createdBy: 'user1',
        createdAt: '2025-06-10T10:00:00Z',
        updatedAt: '2025-06-10T10:00:00Z',
      },
    ]

    global.$fetch = vi.fn().mockResolvedValue({ views: mockViews })

    const { fetchViews, savedViews } = useSavedViews()
    await fetchViews()

    expect(savedViews.value).toEqual(mockViews)
  })

  it('saveCurrentAs creates new view', async () => {
    const newView = {
      id: 'view2',
      name: 'New View',
      searchValue: 'test',
      activeTagFilter: ['pool'],
      activeAiFilter: 'active',
      columnVisibility: { amenities: false },
      pageSize: 20,
      createdBy: 'user1',
      createdAt: '2025-06-10T11:00:00Z',
      updatedAt: '2025-06-10T11:00:00Z',
    }

    global.$fetch = vi.fn().mockResolvedValue({ view: newView })

    const { saveCurrentAs, savedViews } = useSavedViews()
    await saveCurrentAs('New View', {
      searchValue: 'test',
      activeTagFilter: ['pool'],
      activeAiFilter: 'active',
      columnVisibility: { amenities: false },
      pageSize: 20,
    })

    expect(savedViews.value).toContainEqual(newView)
  })
})