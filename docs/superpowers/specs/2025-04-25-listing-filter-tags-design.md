# Design: Scalable Listing & Tag Filters (Multi-Select)

**Date**: 2025-04-25
**Status**: Approved

## Problem

The inbox sidebar listing section renders every property as a flat button list. With 100+ listings and 100+ tags, this becomes an unusable wall of text. Staff need a way to quickly find conversations by listing name or by listing tags (freeform labels like "Canggu", "Pool", "4BR").

## Decision

**Search + Multi-Select Tags Popover + Removable Chips + Checkboxes**: 
1. Search input filters listings by name
2. "Tags" button opens a Popover with search + checkboxes (multi-select with AND logic)
3. Selected tags and listings shown as removable Badge chips
4. Listing items shown with checkboxes for multi-select
5. Clear-all button (X) when any filter active

## Data Model

### Conversation type changes

Add `tags: string[]` to the `Conversation` interface:

```ts
export interface Conversation {
  // ...existing fields...
  tags: string[] // Listing tags (freeform, e.g. "Canggu", "Pool", "4BR")
}
```

`labels` remains for conversation-level labels ("urgent", "unassigned"). `tags` represents the listing's categorization.

### Mock data tags

```ts
conv-1 (Villa Canggu):    ['Canggu', 'Pool', '4BR']
conv-2 (Sunset Loft):     ['Seminyak', 'Rooftop']
conv-3 (Beach House):     ['Canggu', 'Beachfront', 'Pool']
conv-4 (Pool Villa):      ['Umalas', 'Pool', 'Private']
conv-5 (Garden Retreat):  ['Ubud', 'Garden', 'Yoga']
conv-6 (Rice Terrace):   ['Ubud', 'Rice Terrace', 'Yoga']
```

## Composable Changes (`useInbox.ts`)

- `activeListingFilter` changed from `string` to `string[]` (multi-select, empty = no filter)
- Add `activeTagFilters: Ref<string[]>` — `useState<string[]>` for currently active tags
- Add `listingTags` computed — unique tags across all conversations with counts, sorted by count
- Add `allListingOptions` computed — all listings unfiltered (for popover)
- Add `listingSearchText: Ref<string>` — search input state for filtering listings in the sidebar
- Update `filteredConversations` to filter by `activeListingFilter` (includes) and `activeTagFilters` (AND logic)
- Add `toggleListingFilter(name)`, `clearListingFilters()`, `toggleTagFilter(tag)`, `clearTagFilters()`, `clearAllListingFilters()`
- `listingOptions` filtered by active tags + search text

## Nav Component Changes

The "Listings" section transforms:

1. **Search + Tags row**: Search input (filters listings by name) + "Tags" button (opens Popover) + clear-all X button
2. **Tags Popover**: Clicking the Tags button opens a Popover with:
   - Search input to filter tags
   - Scrollable checkbox list (each tag shows name + count)
   - "Clear all tags" button at bottom when tags are selected
3. **Selected chip rows**: Tag chips (default variant) and listing chips (secondary variant) with X to remove
4. **Listing list**: Each listing shown with a Checkbox + name + count. Clicking toggles multi-select.

### Collapsed sidebar

- Single building icon with tooltip showing number of selected listings

## Filter Logic

```
Conversations shown =
  (activeListingFilter) → conversation.propertyName must be in activeListingFilter
  AND (activeTagFilters) → conversation.tags must include ALL active tags
  AND (other existing filters: action needed, assigned to me, stay status, search text)
```

Listing items in sidebar = listings matching `listingSearchText` AND whose tags include all `activeTagFilters`.
