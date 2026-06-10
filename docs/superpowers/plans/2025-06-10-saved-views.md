# Saved Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add save/load/update/delete functionality for filter views on the Listings page, persisting all filter state (search, tags, AI status, column visibility, pagination) to a backend API.

**Architecture:** Composable-based state management (`useSavedViews()`) that handles API calls and local state, integrated into Listings page via new dropdown component. Views are team-shared and stored backend-side.

**Tech Stack:** Nuxt 3, Vue 3, TanStack Table, shadcn-vue components, composables pattern, vue-sonner for toasts

---

## File Structure

**New files:**
- `app/composables/useSavedViews.ts` - Core composable for saved views logic
- `app/components/listings/SavedViewsDropdown.vue` - Dropdown component for managing views
- `app/components/listings/SaveViewDialog.vue` - Dialog for naming new views
- `app/components/listings/DeleteViewDialog.vue` - Confirmation dialog for deletion

**Modified files:**
- `app/pages/listings/index.vue` - Integrate saved views into existing filter row

---

### Task 1: Create the useSavedViews composable

**Files:**
- Create: `app/composables/useSavedViews.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/composables/useSavedViews.spec.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/composables/useSavedViews.spec.ts`
Expected: FAIL with "Cannot find module '~/composables/useSavedViews'"

- [ ] **Step 3: Write minimal implementation**

Create `app/composables/useSavedViews.ts`:

```typescript
import type { SavedView, ViewState } from '~/types/saved-views'
import { computed, ref } from 'vue'

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
```

- [ ] **Step 4: Create type definitions**

Create `app/types/saved-views.ts`:

```typescript
export interface SavedView {
  id: string
  name: string
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ViewState {
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/composables/useSavedViews.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/composables/useSavedViews.ts app/types/saved-views.ts tests/composables/useSavedViews.spec.ts
git commit -m "feat: add useSavedViews composable with CRUD operations"
```

---

### Task 2: Create the SaveViewDialog component

**Files:**
- Create: `app/components/listings/SaveViewDialog.vue`

- [ ] **Step 1: Write the failing test**

Create `tests/components/SaveViewDialog.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SaveViewDialog from '~/components/listings/SaveViewDialog.vue'

describe('SaveViewDialog', () => {
  it('renders dialog with name input', () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save current view')
  })

  it('emits save event with name', async () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('My View')

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]).toEqual(['My View'])
  })

  it('does not emit save with empty name', async () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/SaveViewDialog.spec.ts`
Expected: FAIL with "Cannot find module '~/components/listings/SaveViewDialog.vue'"

- [ ] **Step 3: Write minimal implementation**

Create `app/components/listings/SaveViewDialog.vue`:

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [name: string]
}>()

const viewName = ref('')

watch(() => props.open, (open) => {
  if (open) {
    viewName.value = ''
  }
})

function handleSave() {
  const trimmed = viewName.value.trim()
  if (trimmed.length === 0 || trimmed.length > 50)
    return

  emit('save', trimmed)
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Save current view</DialogTitle>
        <DialogDescription>
          Give your view a name to save your current filters and settings.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <Input
          v-model="viewName"
          placeholder="e.g., Seminyak Villas"
          maxlength="50"
          @keydown.enter="handleSave"
        />
        <p class="text-xs text-muted-foreground mt-2">
          {{ viewName.length }}/50 characters
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="viewName.trim().length === 0"
          @click="handleSave"
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/SaveViewDialog.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/listings/SaveViewDialog.vue tests/components/SaveViewDialog.spec.ts
git commit -m "feat: add SaveViewDialog component"
```

---

### Task 3: Create the DeleteViewDialog component

**Files:**
- Create: `app/components/listings/DeleteViewDialog.vue`

- [ ] **Step 1: Write the failing test**

Create `tests/components/DeleteViewDialog.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DeleteViewDialog from '~/components/listings/DeleteViewDialog.vue'

describe('DeleteViewDialog', () => {
  it('renders dialog with view name', () => {
    const wrapper = mount(DeleteViewDialog, {
      props: {
        open: true,
        viewName: 'My View',
      },
    })

    expect(wrapper.text()).toContain('Delete "My View"?')
  })

  it('emits delete event on confirm', async () => {
    const wrapper = mount(DeleteViewDialog, {
      props: {
        open: true,
        viewName: 'My View',
      },
    })

    await wrapper.find('button.text-destructive').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/DeleteViewDialog.spec.ts`
Expected: FAIL with "Cannot find module '~/components/listings/DeleteViewDialog.vue'"

- [ ] **Step 3: Write minimal implementation**

Create `app/components/listings/DeleteViewDialog.vue`:

```vue
<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{
  open: boolean
  viewName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'delete': []
}>()

function handleDelete() {
  emit('delete')
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete "{{ viewName }}"?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. The view will be removed for all team members.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="destructive"
          @click="handleDelete"
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/DeleteViewDialog.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/listings/DeleteViewDialog.vue tests/components/DeleteViewDialog.spec.ts
git commit -m "feat: add DeleteViewDialog component"
```

---

### Task 4: Create the SavedViewsDropdown component

**Files:**
- Create: `app/components/listings/SavedViewsDropdown.vue`

- [ ] **Step 1: Write the failing test**

Create `tests/components/SavedViewsDropdown.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SavedViewsDropdown from '~/components/listings/SavedViewsDropdown.vue'

describe('SavedViewsDropdown', () => {
  it('renders button with default text', () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: null,
        isDirty: false,
      },
    })

    expect(wrapper.text()).toContain('Saved Views')
  })

  it('renders active view name', () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: { id: '1', name: 'My View' } as any,
        isDirty: false,
      },
    })

    expect(wrapper.text()).toContain('Saved Views: My View')
  })

  it('emits save-as event when clicking save option', async () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: null,
        isDirty: false,
      },
    })

    await wrapper.find('[data-testid="save-as-option"]').trigger('click')

    expect(wrapper.emitted('save-as')).toBeTruthy()
  })

  it('emits load-view event when clicking a view', async () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [{ id: '1', name: 'My View' } as any],
        activeView: null,
        isDirty: false,
      },
    })

    await wrapper.find('[data-testid="view-item-1"]').trigger('click')

    expect(wrapper.emitted('load-view')?.[0]).toEqual(['1'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/SavedViewsDropdown.spec.ts`
Expected: FAIL with "Cannot find module '~/components/listings/SavedViewsDropdown.vue'"

- [ ] **Step 3: Write minimal implementation**

Create `app/components/listings/SavedViewsDropdown.vue`:

```vue
<script setup lang="ts">
import type { SavedView } from '~/types/saved-views'
import { Icon } from '#components'
import { formatDistanceToNow } from 'date-fns'
import { computed, ref } from 'vue'
import { Button } from '~/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'

const props = defineProps<{
  savedViews: SavedView[]
  activeView: SavedView | null
  isDirty: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  'load-view': [viewId: string]
  'save-as': []
  'update': []
  'delete': [viewId: string]
}>()

const viewSearch = ref('')
const deleteTarget = ref<SavedView | null>(null)

const filteredViews = computed(() => {
  if (!viewSearch.value)
    return props.savedViews
  const q = viewSearch.value.toLowerCase()
  return props.savedViews.filter(v => v.name.toLowerCase().includes(q))
})

function getCreatorInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTimeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>

<template>
  <div class="flex items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs">
          <Icon name="lucide:bookmark" class="size-3.5" />
          {{ activeView ? `Saved Views: ${activeView.name}` : 'Saved Views' }}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="w-72" align="start">
        <DropdownMenuItem data-testid="save-as-option" @click="emit('save-as')">
          <Icon name="lucide:plus" class="mr-2 size-3.5" />
          Save current as...
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div v-if="savedViews.length > 0" class="p-2">
          <Input
            v-model="viewSearch"
            placeholder="Search views..."
            class="h-7 text-xs"
          />
        </div>

        <ScrollArea class="h-72">
          <div v-if="filteredViews.length === 0" class="px-2 py-4 text-sm text-muted-foreground text-center">
            {{ savedViews.length === 0 ? 'No saved views yet.' : 'No views found.' }}
          </div>

          <div v-else class="p-1 space-y-0.5">
            <DropdownMenuItem
              v-for="view in filteredViews"
              :key="view.id"
              class="group flex items-center justify-between py-2"
              :class="{ 'bg-muted': activeView?.id === view.id }"
              :data-testid="`view-item-${view.id}`"
              @click="emit('load-view', view.id)"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <Icon
                  v-if="activeView?.id === view.id"
                  name="lucide:check"
                  class="size-4 shrink-0 text-primary"
                />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm truncate">
                    {{ view.name }}
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div class="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-medium">
                      {{ getCreatorInitials(view.createdBy) }}
                    </div>
                    <span>{{ formatTimeAgo(view.updatedAt) }}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="deleteTarget = view"
              >
                <Icon name="lucide:trash-2" class="size-3.5" />
              </Button>
            </DropdownMenuItem>
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>

    <Button
      v-if="activeView && isDirty"
      variant="outline"
      size="sm"
      class="h-9 gap-1.5 text-xs"
      :disabled="isLoading"
      @click="emit('update')"
    >
      <Icon name="lucide:refresh-cw" class="size-3.5" />
      Update {{ activeView.name }}
    </Button>

    <DeleteViewDialog
      v-if="deleteTarget"
      :open="!!deleteTarget"
      :view-name="deleteTarget.name"
      @update:open="deleteTarget = null"
      @delete="emit('delete', deleteTarget.id)"
    />
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/SavedViewsDropdown.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/listings/SavedViewsDropdown.vue tests/components/SavedViewsDropdown.spec.ts
git commit -m "feat: add SavedViewsDropdown component"
```

---

### Task 5: Integrate saved views into Listings page

**Files:**
- Modify: `app/pages/listings/index.vue`

- [ ] **Step 1: Add composables and imports**

Add after existing imports:

```typescript
import type { ViewState } from '~/types/saved-views'
import SavedViewsDropdown from '~/components/listings/SavedViewsDropdown.vue'
import SaveViewDialog from '~/components/listings/SaveViewDialog.vue'
import { useSavedViews } from '~/composables/useSavedViews'
```

- [ ] **Step 2: Initialize saved views composable**

Add after existing refs:

```typescript
const {
  savedViews,
  activeView,
  currentState,
  isDirty,
  isLoading: savedViewsLoading,
  fetchViews,
  saveCurrentAs,
  loadView,
  updateActiveView,
  deleteView,
} = useSavedViews()

const saveDialogOpen = ref(false)

onMounted(() => {
  fetchViews()
})
```

- [ ] **Step 3: Add helper functions for state management**

Add after existing functions:

```typescript
function getCurrentViewState(): ViewState {
  return {
    searchValue: searchValue.value,
    activeTagFilter: activeTagFilter.value,
    activeAiFilter: activeAiFilter.value,
    columnVisibility: columnVisibility.value,
    pageSize: table.getState().pagination.pageSize,
  }
}

function applyViewState(state: ViewState) {
  searchValue.value = state.searchValue
  activeTagFilter.value = state.activeTagFilter
  activeAiFilter.value = state.activeAiFilter
  Object.assign(columnVisibility.value, state.columnVisibility)
  table.setPageSize(state.pageSize)
}

function updateCurrentState() {
  currentState.value = getCurrentViewState()
}

function handleLoadView(viewId: string) {
  loadView(viewId).then((view) => {
    if (view) {
      applyViewState(view)
      updateCurrentState()
    }
  })
}

function handleSaveAs(name: string) {
  const state = getCurrentViewState()
  saveCurrentAs(name, state)
}

function handleUpdateView() {
  if (!activeView.value)
    return
  const state = getCurrentViewState()
  updateActiveView(state)
}

function handleDeleteView(viewId: string) {
  deleteView(viewId)
}

function openSaveDialog() {
  saveDialogOpen.value = true
}
```

- [ ] **Step 4: Watch for state changes**

Add after existing watchers:

```typescript
watch([searchValue, activeTagFilter, activeAiFilter, columnVisibility], () => {
  updateCurrentState()
}, { deep: true })

watch(() => table.getState().pagination.pageSize, () => {
  updateCurrentState()
})
```

- [ ] **Step 5: Add SavedViewsDropdown to template**

Add after the AI Status dropdown in the filter row:

```vue
<SavedViewsDropdown
  :saved-views="savedViews"
  :active-view="activeView"
  :is-dirty="isDirty"
  :is-loading="savedViewsLoading"
  @load-view="handleLoadView"
  @save-as="openSaveDialog"
  @update="handleUpdateView"
  @delete="handleDeleteView"
/>
```

- [ ] **Step 6: Add SaveViewDialog to template**

Add at the end of template, before closing div:

```vue
<SaveViewDialog
  v-model:open="saveDialogOpen"
  @save="handleSaveAs"
/>
```

- [ ] **Step 7: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS with no errors

- [ ] **Step 8: Run lint**

Run: `pnpm lint`
Expected: PASS with no errors

- [ ] **Step 9: Test manually**

1. Start dev server: `pnpm dev`
2. Navigate to `/listings`
3. Apply filters (e.g., search "villa", add tag "pool")
4. Click "Saved Views" → "Save current as..."
5. Enter name: "Pool Villas"
6. Click "Save" → verify toast success, button shows "Saved Views: Pool Villas"
7. Clear filters
8. Click "Saved Views" → select "Pool Villas"
9. Verify filters are restored
10. Modify filters slightly
11. Verify "Update Pool Villas" button appears
12. Click update → verify toast success
13. Click "Saved Views" → trash icon on "Pool Villas"
14. Confirm deletion → verify toast success, view removed

- [ ] **Step 10: Commit**

```bash
git add app/pages/listings/index.vue
git commit -m "feat: integrate saved views into Listings page"
```

---

## Self-Review Results

**Spec coverage:**
- ✓ Save current view as new (Task 1 composable, Task 2 dialog, Task 5 integration)
- ✓ Load saved view (Task 1 composable, Task 4 dropdown, Task 5 integration)
- ✓ Update existing view (Task 1 composable, Task 4 dropdown, Task 5 integration)
- ✓ Delete saved view (Task 3 dialog, Task 4 dropdown, Task 5 integration)
- ✓ View metadata (Task 4 dropdown: name, initials, timestamp)
- ✓ Backend storage (Task 1: API endpoints)
- ✓ Error handling with toast (Task 1 composable)
- ✓ Loading states (Task 1 composable, Task 4 dropdown)

**Placeholder scan:**
- No TBD, TODO, or vague instructions found
- All code steps include complete implementations
- All test steps include actual test code
- No "similar to" references

**Type consistency:**
- ✓ ViewState interface used consistently across composable and components
- ✓ SavedView interface consistent throughout
- ✓ Event names match between emit and handlers

**No issues found.**
