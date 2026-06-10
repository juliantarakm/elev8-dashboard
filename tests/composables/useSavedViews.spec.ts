import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSavedViews } from '~/composables/useSavedViews'

const STORAGE_KEY = 'elev8-saved-views'

describe('useSavedViews', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  }

  beforeAll(() => {
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with empty state', () => {
    const { savedViews, activeView, isDirty, isLoading } = useSavedViews()
    expect(savedViews.value).toEqual([])
    expect(activeView.value).toBe(null)
    expect(isDirty.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('fetchViews loads views from localStorage', async () => {
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
        updatedAt: '2025-06-10T11:00:00Z',
      },
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockViews))

    const { fetchViews, savedViews } = useSavedViews()
    await fetchViews()

    expect(savedViews.value).toEqual(mockViews)
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  it('saveCurrentAs creates new view and saves to localStorage', async () => {
    const { saveCurrentAs, savedViews } = useSavedViews()
    await saveCurrentAs('New View', {
      searchValue: 'test',
      activeTagFilter: ['pool'],
      activeAiFilter: 'active',
      columnVisibility: { amenities: false },
      pageSize: 20,
    })

    expect(savedViews.value).toHaveLength(1)
    expect(savedViews.value[0].name).toBe('New View')
    expect(savedViews.value[0].id).toMatch(/^view_\d+_[a-z0-9]+$/)
    expect(savedViews.value[0].createdBy).toBe('current-user')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String))
  })

  it('deleteView removes view from localStorage', async () => {
    const initialViews = [
      {
        id: 'view1',
        name: 'View 1',
        searchValue: '',
        activeTagFilter: [],
        activeAiFilter: null,
        columnVisibility: {},
        pageSize: 15,
        createdBy: 'user1',
        createdAt: '2025-06-10T10:00:00Z',
        updatedAt: '2025-06-10T10:00:00Z',
      },
      {
        id: 'view2',
        name: 'View 2',
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
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialViews))

    const { fetchViews, deleteView, savedViews } = useSavedViews()
    await fetchViews()
    await deleteView('view1')

    expect(savedViews.value).toHaveLength(1)
    expect(savedViews.value[0].id).toBe('view2')
  })
})
