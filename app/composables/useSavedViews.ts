import type { SavedView, ViewState } from '~/types/saved-views'
import { DEFAULT_VIEW } from '~/types/saved-views'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

const STORAGE_KEY = 'elev8-saved-views'
const ACTIVE_VIEW_KEY = 'elev8-active-view'
const CURRENT_STATE_KEY = 'elev8-current-state'
const PENDING_VIEW_ID_KEY = 'elev8-pending-view-id'

// Load from localStorage helper
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined')
    return defaultValue
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  }
  catch {
    return defaultValue
  }
}

// Save to localStorage helper
function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined')
    return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch (error) {
    toast.error(`Could not save ${key} to storage.`)
  }
}

export function useSavedViews() {
  // Initialize from localStorage
  const savedViews = ref<SavedView[]>(loadFromLocalStorage(STORAGE_KEY, [DEFAULT_VIEW]))
  const activeView = ref<SavedView | null>(loadFromLocalStorage(ACTIVE_VIEW_KEY, DEFAULT_VIEW))
  const currentState = ref<ViewState | null>(loadFromLocalStorage(CURRENT_STATE_KEY, null))
  const pendingViewId = ref<string | null>(loadFromLocalStorage(PENDING_VIEW_ID_KEY, null))
  const isLoading = ref(false)

  // Watch for changes and persist to localStorage
  watch(savedViews, (newVal) => {
    const customViews = newVal.filter(v => !v.isDefault)
    saveToLocalStorage(STORAGE_KEY, customViews)
  }, { deep: true })

  watch(activeView, (newVal) => {
    saveToLocalStorage(ACTIVE_VIEW_KEY, newVal)
  }, { deep: true })

  watch(currentState, (newVal) => {
    saveToLocalStorage(CURRENT_STATE_KEY, newVal)
  }, { deep: true })

  watch(pendingViewId, (newVal) => {
    saveToLocalStorage(PENDING_VIEW_ID_KEY, newVal)
  })

  const isDirty = computed(() => {
    if (!activeView.value || !currentState.value || activeView.value.isDefault)
      return false
    const av = activeView.value
    const cs = currentState.value

    return (
      av.searchValue !== cs.searchValue
      || JSON.stringify(av.activeTagFilter.sort()) !== JSON.stringify(cs.activeTagFilter.sort())
      || av.activeAiFilter !== cs.activeAiFilter
      || JSON.stringify(av.columnVisibility) !== JSON.stringify(cs.columnVisibility)
      || av.pageSize !== cs.pageSize
    )
  })

  const canUpdateActiveView = computed(() => {
    return activeView.value !== null && !activeView.value.isDefault && isDirty.value
  })

  function getViewsFromStorage(): SavedView[] {
    return savedViews.value
  }

  function saveViewsToStorage(views: SavedView[]): void {
    if (typeof window === 'undefined')
      return
    const customViews = views.filter(v => !v.isDefault)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customViews))
    }
    catch {
      toast.error('Could not save views to storage.')
    }
  }

  function generateId(): string {
    return `view_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  function resetToDefault(): void {
    activeView.value = DEFAULT_VIEW
    currentState.value = {
      searchValue: DEFAULT_VIEW.searchValue,
      activeTagFilter: DEFAULT_VIEW.activeTagFilter,
      activeAiFilter: DEFAULT_VIEW.activeAiFilter,
      columnVisibility: DEFAULT_VIEW.columnVisibility,
      pageSize: DEFAULT_VIEW.pageSize,
    }
    toast.info('Reset to default view')
  }

  async function fetchViews() {
    isLoading.value = true
    try {
      const views = getViewsFromStorage()
      savedViews.value = views.sort((a, b) => {
        // Default view always first
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        // Custom views by updatedAt descending
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      if (!activeView.value) {
        activeView.value = DEFAULT_VIEW
        currentState.value = {
          searchValue: DEFAULT_VIEW.searchValue,
          activeTagFilter: DEFAULT_VIEW.activeTagFilter,
          activeAiFilter: DEFAULT_VIEW.activeAiFilter,
          columnVisibility: DEFAULT_VIEW.columnVisibility,
          pageSize: DEFAULT_VIEW.pageSize,
        }
      }
    }
    catch (error) {
      toast.error('Could not load saved views.')
    }
    finally {
      isLoading.value = false
    }
  }

  async function saveCurrentAs(name: string, state: ViewState) {
    // Check for duplicate name
    const exists = savedViews.value.find(v =>
      !v.isDefault && v.name.toLowerCase() === name.toLowerCase(),
    )
    if (exists) {
      toast.error('A view with this name already exists.')
      throw new Error('Duplicate view name')
    }

    isLoading.value = true
    try {
      const now = new Date().toISOString()
      const newView: SavedView = {
        id: generateId(),
        name,
        ...state,
        createdBy: 'current-user',
        createdAt: now,
        updatedAt: now,
      }

      const updatedViews = [...savedViews.value, newView].sort((a, b) => {
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)
      activeView.value = newView
      currentState.value = state
      toast.success('View saved!')
    }
    catch (error) {
      if (error instanceof Error && error.message !== 'Duplicate view name') {
        toast.error('Failed to save view. Try again.')
        throw error
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadView(viewId: string) {
    const view = savedViews.value.find(v => v.id === viewId)
    if (!view) {
      toast.error('Could not load view.')
      return
    }

    // Check for unsaved changes
    if (isDirty.value && activeView.value && !activeView.value.isDefault) {
      pendingViewId.value = viewId
      return view // Return view for confirmation dialog
    }

    activeView.value = view
    currentState.value = {
      searchValue: view.searchValue,
      activeTagFilter: view.activeTagFilter,
      activeAiFilter: view.activeAiFilter,
      columnVisibility: view.columnVisibility,
      pageSize: view.pageSize,
    }
    pendingViewId.value = null
    return view
  }

  async function confirmLoadView(viewId: string) {
    const view = savedViews.value.find(v => v.id === viewId)
    if (!view) {
      return
    }
    activeView.value = view
    currentState.value = {
      searchValue: view.searchValue,
      activeTagFilter: view.activeTagFilter,
      activeAiFilter: view.activeAiFilter,
      columnVisibility: view.columnVisibility,
      pageSize: view.pageSize,
    }
    pendingViewId.value = null
  }

  async function updateActiveView(state: ViewState) {
    if (!activeView.value || activeView.value.isDefault)
      return

    isLoading.value = true
    try {
      const now = new Date().toISOString()
      const updatedView: SavedView = {
        ...activeView.value,
        ...state,
        updatedAt: now,
      }

      const updatedViews = savedViews.value.map(v =>
        v.id === updatedView.id ? updatedView : v,
      ).sort((a, b) => {
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)
      activeView.value = updatedView
      currentState.value = state
      toast.success('View updated!')
    }
    catch (error) {
      toast.error('Update failed. Try again.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteView(viewId: string) {
    const viewToDelete = savedViews.value.find(v => v.id === viewId)
    if (!viewToDelete || viewToDelete.isDefault) {
      toast.error('Cannot delete Default view.')
      return
    }

    isLoading.value = true
    try {
      const updatedViews = savedViews.value.filter(v => v.id !== viewId)
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)

      // Fallback to Default if active view was deleted
      if (activeView.value?.id === viewId) {
        activeView.value = DEFAULT_VIEW
        currentState.value = {
          searchValue: DEFAULT_VIEW.searchValue,
          activeTagFilter: DEFAULT_VIEW.activeTagFilter,
          activeAiFilter: DEFAULT_VIEW.activeAiFilter,
          columnVisibility: DEFAULT_VIEW.columnVisibility,
          pageSize: DEFAULT_VIEW.pageSize,
        }
      }
      toast.success('View deleted!')
    }
    catch (error) {
      toast.error('Could not delete view.')
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function renameView(viewId: string, newName: string) {
    const view = savedViews.value.find(v => v.id === viewId)
    if (!view || view.isDefault) {
      toast.error('Cannot rename Default view.')
      return
    }

    // Check for duplicate name (excluding current view)
    const exists = savedViews.value.find(v =>
      !v.isDefault && v.id !== viewId && v.name.toLowerCase() === newName.toLowerCase(),
    )
    if (exists) {
      toast.error('A view with this name already exists.')
      throw new Error('Duplicate view name')
    }

    isLoading.value = true
    try {
      const updatedView: SavedView = {
        ...view,
        name: newName,
        updatedAt: new Date().toISOString(),
      }

      const updatedViews = savedViews.value.map(v =>
        v.id === viewId ? updatedView : v,
      ).sort((a, b) => {
        if (a.isDefault) return -1
        if (b.isDefault) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)

      if (activeView.value?.id === viewId) {
        activeView.value = updatedView
      }

      toast.success('View renamed!')
    }
    catch (error) {
      if (error instanceof Error && error.message !== 'Duplicate view name') {
        toast.error('Rename failed. Try again.')
        throw error
      }
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    savedViews,
    activeView,
    currentState,
    isDirty,
    canUpdateActiveView,
    pendingViewId,
    isLoading,
    fetchViews,
    saveCurrentAs,
    loadView,
    confirmLoadView,
    updateActiveView,
    deleteView,
    renameView,
    resetToDefault,
  }
}
