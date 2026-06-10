import type { SavedView, ViewState } from '~/types/saved-views'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

const STORAGE_KEY = 'elev8-saved-views'

export function useSavedViews() {
  const savedViews = ref<SavedView[]>([])
  const activeView = ref<SavedView | null>(null)
  const currentState = ref<ViewState | null>(null)
  const isLoading = ref(false)

  const isDirty = computed(() => {
    if (!activeView.value || !currentState.value)
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

  function getViewsFromStorage(): SavedView[] {
    if (typeof window === 'undefined')
      return []
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    }
    catch {
      return []
    }
  }

  function saveViewsToStorage(views: SavedView[]): void {
    if (typeof window === 'undefined')
      return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    }
    catch {
      toast.error('Could not save views to storage.')
    }
  }

  function generateId(): string {
    return `view_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  async function fetchViews() {
    isLoading.value = true
    try {
      const views = getViewsFromStorage()
      savedViews.value = views.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
    catch (error) {
      toast.error('Could not load saved views.')
    }
    finally {
      isLoading.value = false
    }
  }

  async function saveCurrentAs(name: string, state: ViewState) {
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

      const updatedViews = [...savedViews.value, newView].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)
      activeView.value = newView
      currentState.value = state
      toast.success('View saved!')
    }
    catch (error) {
      toast.error('Failed to save view. Try again.')
      throw error
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
    activeView.value = view
    currentState.value = {
      searchValue: view.searchValue,
      activeTagFilter: view.activeTagFilter,
      activeAiFilter: view.activeAiFilter,
      columnVisibility: view.columnVisibility,
      pageSize: view.pageSize,
    }
    return view
  }

  async function updateActiveView(state: ViewState) {
    if (!activeView.value)
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
      ).sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
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
    isLoading.value = true
    try {
      const updatedViews = savedViews.value.filter(v => v.id !== viewId)
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)
      if (activeView.value?.id === viewId) {
        activeView.value = null
        currentState.value = null
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
    isLoading.value = true
    try {
      const view = savedViews.value.find(v => v.id === viewId)
      if (!view) {
        toast.error('View not found.')
        return
      }

      const updatedView: SavedView = {
        ...view,
        name: newName,
        updatedAt: new Date().toISOString(),
      }

      const updatedViews = savedViews.value.map(v =>
        v.id === viewId ? updatedView : v,
      ).sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      savedViews.value = updatedViews
      saveViewsToStorage(updatedViews)

      if (activeView.value?.id === viewId) {
        activeView.value = updatedView
      }

      toast.success('View renamed!')
    }
    catch (error) {
      toast.error('Rename failed. Try again.')
      throw error
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
    isLoading,
    fetchViews,
    saveCurrentAs,
    loadView,
    updateActiveView,
    deleteView,
    renameView,
  }
}
