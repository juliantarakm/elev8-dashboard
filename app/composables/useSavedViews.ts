import type { SavedView, ViewState } from '~/types/saved-views'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

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

  async function fetchViews() {
    isLoading.value = true
    try {
      const res = await $fetch<{ views: SavedView[] }>('/api/tenant/listing-views')
      savedViews.value = res.views.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
      const res = await $fetch<{ view: SavedView }>('/api/tenant/listing-views', {
        method: 'POST',
        body: {
          name,
          ...state,
        },
      })
      savedViews.value = [...savedViews.value, res.view].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      activeView.value = res.view
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
      const res = await $fetch<{ view: SavedView }>(`/api/tenant/listing-views/${activeView.value.id}`, {
        method: 'PUT',
        body: state,
      })
      const index = savedViews.value.findIndex(v => v.id === activeView.value.id)
      if (index !== -1) {
        savedViews.value[index] = res.view
      }
      activeView.value = res.view
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
      await $fetch(`/api/tenant/listing-views/${viewId}`, {
        method: 'DELETE',
      })
      savedViews.value = savedViews.value.filter(v => v.id !== viewId)
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
  }
}
