# Listing Detail Page — Redesign Spec

**Date:** 2026-06-01  
**Status:** Approved  
**Scope:** `app/pages/listings/[id].vue`

## Overview

Redesign the listing detail page from a single-scroll layout into a tabbed interface with photo gallery, editable amenities, property settings, and AI scheduling.

## Layout Structure

### 1. Hero Section

- **Photo gallery**: 1 large hero image + thumbnail strip below
  - Source: Unsplash, keyword based on listing location + property name
  - Uses `Image` component with Unsplash URL pattern
- **Listing name** (h1) + **AI status badge** (Active / Paused / Not Set)
- **Location** (icon + text)
- **Back button** (navigates to `/listings`)
- **Action buttons**: "Edit Listing" + AI toggle switch

### 2. Tab Navigation

Use shadcn `Tabs` component with 3 tabs:

| Tab | Purpose |
|-----|---------|
| **Overview** | Stats, amenities, OTA, tags |
| **Property Settings** | Details form + distribution channels |
| **AI Schedule** | AI toggle, schedule config, time picker |

### 3. Tab: Overview

**Stats cards** (4-column grid):
- Capacity, Room Type, Property, Location
- Same icons as current design

**Amenities** (editable):
- Display as badges
- "+" button opens Popover with searchable amenity list
- Click to add/remove amenities
- Changes update local state (no backend)

**OTA Connections**:
- Badge per connected OTA (Airbnb, Booking.com)
- Icon + name

**Tags**:
- Badge per tag
- Same display as current

### 4. Tab: Property Settings

**Sub-tabs** using shadcn `Tabs`:

#### Sub-tab: Details
- Editable form fields:
  - Listing Name (Input)
  - Location (Input)
  - Capacity (Number Input)
  - Room Type (Select)
  - Property (Input)
- Save button (placeholder — updates local state only)

#### Sub-tab: Distribution Channels
- List of OTAs with connection status
- Each OTA shows: icon, name, connected/disconnected badge
- Placeholder for connect/disconnect actions

### 5. Tab: AI Schedule

**AI Toggle**:
- Large switch (shadcn `Switch`)
- Label: "ElevAI Active" / "ElevAI Paused"
- Toggling updates `aiStatus` on listing

**Schedule Configuration** (visible when AI is active):

- **Repeat type**: Select — "Weekly" / "Monthly"
- **Active days**: Multi-select checkboxes (Mon–Sun)
- **Active hours**: Time range picker
  - Start time (Select: 00:00–23:00)
  - End time (Select: 00:00–23:00)
- **Visual preview**: Simple timeline bar showing active hours

## Data Model Changes

Extend `Listing` interface in `app/components/listings/data/listings.ts`:

```typescript
export interface Listing {
  // ... existing fields
  photos: string[]              // Unsplash photo IDs
  amenities: string[]           // now editable
  aiSchedule: {
    enabled: boolean
    repeatType: 'weekly' | 'monthly'
    activeDays: number[]        // 0=Sun, 1=Mon, ..., 6=Sat
    activeHours: {
      start: string             // "08:00"
      end: string               // "22:00"
    }
  }
}
```

## Files to Modify

| File | Action |
|------|--------|
| `app/pages/listings/[id].vue` | Full rewrite — tabbed layout |
| `app/components/listings/data/listings.ts` | Add `photos`, `aiSchedule` to Listing type + mock data |
| `app/components/listings/ListingHero.vue` | New — photo gallery + header |
| `app/components/listings/ListingOverview.vue` | New — stats, amenities, OTA, tags |
| `app/components/listings/ListingPropertySettings.vue` | New — details form + distribution |
| `app/components/listings/ListingAiSchedule.vue` | New — AI toggle + schedule config |

## UI Components Used

From `app/components/ui/`:
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Switch`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Input`
- `Button`
- `Badge`
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `ScrollArea`

## Conventions

- Icons: `lucide:` prefix
- OTA icons: `logos:airbnb`, `simple-icons:bookingdotcom`
- AI gold: `bg-[#C8A84B]` for ElevAI branding
- Semantic colors: `bg-muted`, `text-muted-foreground`, etc.
- State mutations: spread syntax for Vue reactivity

## Out of Scope

- Backend API integration (all state is local/mock)
- Photo upload (Unsplash only)
- Real OTA connection logic
- Calendar view for schedule
