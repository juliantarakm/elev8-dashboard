# Saved Views for Listings Page

**Date:** 2025-06-10
**Status:** Approved
**Module:** Listings

## Overview

Add the ability to save, load, update, and delete filter views on the Listings page. Saved views include all filter state: search value, tags filter, AI status filter, column visibility, and pagination settings.

## Requirements

### Functional Requirements

1. **Save current view as new**
   - User can save current filter state with a custom name
   - View persists to backend
   - View is shared across all team members on the tenant

2. **Load saved view**
   - User can load any saved view from a dropdown
   - Loading applies all saved state (filters, columns, pagination)
   - Button updates to show active view name

3. **Update existing view**
   - When a view is active and filters change, show "Update [View Name]" button
   - One-click update to modify existing view
   - No dialog required

4. **Delete saved view**
   - User can delete any saved view
   - Requires confirmation dialog
   - View removed from dropdown immediately

5. **View metadata**
   - Each view shows: name, creator initials, last updated timestamp
   - Sort by last updated (most recent first)
   - Search within saved views

### Non-Functional Requirements

- Backend storage (not local storage)
- Views persist across devices
- Graceful error handling with toast notifications
- Loading states for async operations

## Technical Design

### Data Model

```typescript
interface SavedView {
  id: string
  name: string
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
  createdBy: string // user ID
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

### Backend Endpoints

```
GET    /api/tenant/listing-views          # List all saved views
POST   /api/tenant/listing-views          # Create new view
PUT    /api/tenant/listing-views/:id      # Update existing view
DELETE /api/tenant/listing-views/:id      # Delete view
```

**Response format (GET):**
```json
{
  "views": [
    {
      "id": "view_abc123",
      "name": "Seminyak Villas",
      "searchValue": "",
      "activeTagFilter": ["pool", "beachfront"],
      "activeAiFilter": "active",
      "columnVisibility": {
        "amenities": false,
        "room": true
      },
      "pageSize": 20,
      "createdBy": "user_kj123",
      "createdAt": "2025-06-10T10:00:00Z",
      "updatedAt": "2025-06-10T14:30:00Z"
    }
  ]
}
```

### Frontend Architecture

#### Composable: `useSavedViews()`

Location: `app/composables/useSavedViews.ts`

```typescript
interface UseSavedViewsReturn {
  savedViews: Ref<SavedView[]>
  activeView: Ref<SavedView | null>
  isDirty: ComputedRef<boolean>
  isLoading: Ref<boolean>
  loadView: (viewId: string) => Promise<void>
  saveCurrentAs: (name: string, currentState: ViewState) => Promise<void>
  updateActiveView: (currentState: ViewState) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
  fetchViews: () => Promise<void>
}

interface ViewState {
  searchValue: string
  activeTagFilter: string[]
  activeAiFilter: string | null
  columnVisibility: Record<string, boolean>
  pageSize: number
}
```

#### Components

**Component 1: `SavedViewsDropdown.vue`**

Location: `app/components/listings/SavedViewsDropdown.vue`

- Button with dropdown menu
- Shows "Saved Views" or "Saved Views: [Active Name]"
- Lists all saved views with metadata
- "Save current as..." option
- Delete action per view
- Creator initials badge
- "Updated X ago" timestamp

**Component 2: `SaveViewDialog.vue`**

Location: `app/components/listings/SaveViewDialog.vue`

- Dialog with name input
- Validation (required, max 50 chars)
- Cancel/Save buttons

**Component 3: `DeleteViewDialog.vue`**

Location: `app/components/listings/SaveViewDialog.vue` (same file)

- Confirm dialog with view name
- Cancel/Delete buttons

### Integration with Existing Code

**Modify: `app/pages/listings/index.vue`**

Add to existing filter row:
```vue
<SavedViewsDropdown
  :saved-views="savedViews"
  :active-view="activeView"
  :is-dirty="isDirty"
  @load-view="loadView"
  @save-as="openSaveDialog"
  @update="updateActiveView"
  @delete="openDeleteDialog"
/>
```

Add to script setup:
```typescript
const {
  savedViews,
  activeView,
  isDirty,
  isLoading,
  loadView,
  saveCurrentAs,
  updateActiveView,
  deleteView,
  fetchViews,
} = useSavedViews()

// Load saved views on mount
onMounted(() => {
  fetchViews()
})

// Collect current view state
function getCurrentViewState(): ViewState {
  return {
    searchValue: searchValue.value,
    activeTagFilter: activeTagFilter.value,
    activeAiFilter: activeAiFilter.value,
    columnVisibility: columnVisibility.value,
    pageSize: table.getState().pagination.pageSize,
  }
}

// Apply loaded view state
function applyViewState(state: ViewState) {
  searchValue.value = state.searchValue
  activeTagFilter.value = state.activeTagFilter
  activeAiFilter.value = state.activeAiFilter
  columnVisibility.value = state.columnVisibility
  table.setPageSize(state.pageSize)
}
```

### Error Handling

| Scenario | Toast Message |
|----------|---------------|
| Save fails | "Failed to save view. Try again." |
| Load fails | "Could not load view." |
| Update fails | "Update failed. Try again." |
| Delete fails | "Could not delete view." |
| Network error | "Connection error. Please check your internet." |

All errors are non-blocking — keep local state intact.

### Loading States

- Button shows spinner during async operations
- Dropdown disabled while loading
- Dialog buttons disabled during save/delete

## User Flow

### Save New View
1. User applies filters (search, tags, AI status)
2. User adjusts column visibility
3. User clicks "Saved Views" → "Save current as..."
4. Dialog opens
5. User enters name: "Villas with Pool"
6. User clicks "Save"
7. View created, toast success ("View saved!"), button shows "Saved Views: Villas with Pool"

### Load View
1. User clicks "Saved Views"
2. User selects "Seminyak Properties" from dropdown
3. Filters applied immediately
4. Table updates to show filtered results
5. Button shows "Saved Views: Seminyak Properties"

### Update View
1. "Seminyak Properties" is active
2. User changes filter (e.g., adds tag "beachfront")
3. "Update Seminyak Properties" button appears next to "Saved Views" button
4. User clicks "Update Seminyak Properties"
5. View updated, button reverts to "Saved Views: Seminyak Properties"

### Delete View
1. User clicks "Saved Views"
2. User clicks trash icon on "Old View"
3. Confirm dialog: "Delete 'Old View'?"
4. User clicks "Delete"
5. View removed from dropdown, toast success ("View deleted")

## UI Specification

### Saved Views Button
- Variant: outline
- Size: sm
- Icon: `lucide:bookmark`
- Position: After filter row, before table
- Width: Auto (expands with view name)

### Dropdown Menu
- Width: 280px
- Max height: 400px with scroll
- Separator between "Save as..." and view list

### View List Item
- Layout: Row with name, initials badge, timestamp, delete button
- Hover: `bg-accent`
- Active view: `bg-muted` with checkmark icon

### Creator Initials Badge
- Size: 24px
- Background: `bg-primary`
- Text: White, 11px, centered
- Font weight: 500

### Timestamp Format
- "Updated X ago" (X = 5m, 1h, 2d, 1w, etc.)

## Testing

### Unit Tests
- `useSavedViews()` composable logic
- State management (activeView, isDirty)
- Filter state serialization/deserialization

### Integration Tests
- API endpoints (mock responses)
- Error handling flows
- Loading state management

### E2E Tests
- Complete save → load → modify → update → delete flow
- Search within saved views
- Multiple view management

## Implementation Checklist

- [ ] Create `useSavedViews()` composable
- [ ] Create `SavedViewsDropdown.vue` component
- [ ] Create `SaveViewDialog.vue` component
- [ ] Create `DeleteViewDialog.vue` component
- [ ] Modify `listings/index.vue` to integrate
- [ ] Add backend API endpoints (if not exists)
- [ ] Add error handling with toast notifications
- [ ] Add loading states
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests

## Open Questions

None.

## Dependencies

- Existing: Listings page, TanStack Table, shadcn-vue components
- New: Backend API endpoints for saved views CRUD
