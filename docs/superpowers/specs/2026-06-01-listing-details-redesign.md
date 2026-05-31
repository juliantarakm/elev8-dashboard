# Listing Details Page — UX Redesign

**Date:** 2026-06-01  
**Status:** Approved  
**Approach:** Option C — Horizontal Tabs (Improved)

## Summary

Redesign the listing details page (`/listings/[id]`) from the current 3-tab layout to a clean, spacious 6-tab layout with a compact hero. Adds new content sections (pricing, calendar, reviews, maintenance) while keeping all existing functionality. Visual direction: Airbnb host dashboard — generous whitespace, clear hierarchy, focused content per tab.

## Current State

- **Hero:** Large photo gallery (360px grid) + name/location/AI badge + tags + OTA connections
- **3 Tabs:** Overview (stats + amenities), Property Settings (details form + OTA channels), AI Schedule
- **Pain points:** Layout feels cluttered, no performance/revenue data, no calendar, no reviews, no maintenance tracking

## Redesigned Structure

### Hero (Compact)

- Single small photo thumbnail (120×80px, rounded)
- Listing name + AI status badge inline
- Location + property name (secondary text)
- OTA connection badges (small pills)
- Back button to listings index
- No photo gallery in hero — keep it minimal

### Tab Bar

Horizontal scrollable tab bar with 6 tabs:

1. **Overview**
2. **Pricing**
3. **Calendar**
4. **Reviews**
5. **Maintenance**
6. **Settings**

### Tab Content

#### 1. Overview (Landing Tab)

Dashboard-style "at a glance" view:

- **Stats cards row** (4 cards, grid):
  - Monthly Revenue (with trend indicator)
  - Occupancy Rate (with trend)
  - Average Rating (with review count)
  - Nightly Rate (avg across OTAs)
- **Two-column section below stats:**
  - Left: **Upcoming Bookings** — next 3 bookings (date range, guest name, nights, status badge). Link to Calendar tab.
  - Right: **Recent Reviews** — latest 2 reviews (guest name, star rating, snippet). Link to Reviews tab.

#### 2. Pricing

- Nightly rate (base price)
- Seasonal pricing table (date ranges + adjusted rates)
- Discounts (weekly/monthly stay discounts)
- Fee breakdown (cleaning fee, service fee)
- All editable inline

#### 3. Calendar

- Full month calendar view with color-coded dates (booked, available, blocked)
- Booking list below calendar (all upcoming + past bookings)
- Ability to block/unblock dates
- Booking details on click (guest, dates, revenue, OTA source)

#### 4. Reviews

- Rating summary at top (overall score + breakdown by category: cleanliness, communication, location, value)
- Reviews list (chronological, with guest name, date, rating, full text)
- Filter by rating (5★, 4★, etc.)
- Host response capability (reply to reviews)

#### 5. Maintenance

- Cleaning schedule (recurring tasks with frequency)
- Upcoming maintenance tasks (date, type, assigned to, status)
- Task history (completed tasks log)
- Add new task button

#### 6. Settings

Combines current Property Settings + AI Schedule into one tab with sub-sections:

- **Property Details** — editable form (name, location, capacity, room type, property)
- **Amenities** — add/remove amenities (existing popover pattern)
- **Distribution Channels** — OTA connection status (Airbnb, Booking.com)
- **AI Schedule** — ElevAI toggle + repeat type + active days + active hours + timeline preview

## Data Model Changes

New fields needed on `Listing` type:

```ts
interface Listing {
  // ... existing fields ...

  // New: Performance stats (mock/static values, no historical tracking)
  stats: {
    monthlyRevenue: number
    revenueTrend: number      // percentage change, positive or negative
    occupancyRate: number     // 0-100
    occupancyTrend: number
    avgRating: number         // 1-5
    totalReviews: number
  }

  // New: Pricing
  pricing: {
    nightlyRate: number
    cleaningFee: number
    serviceFee: number
    weeklyDiscount: number  // percentage
    monthlyDiscount: number // percentage
    seasonalRates: Array<{ startDate: string; endDate: string; rate: number; label: string }>
  }

  // New: Bookings/Calendar
  bookings: Array<{
    id: string
    guestName: string
    checkIn: string  // ISO date
    checkOut: string // ISO date
    nights: number
    status: 'confirmed' | 'pending' | 'cancelled'
    revenue: number
    source: string   // OTA name
  }>
  blockedDates: string[] // ISO dates

  // New: Reviews
  reviews: Array<{
    id: string
    guestName: string
    date: string     // ISO date
    rating: number   // 1-5
    text: string
    hostReply?: string
    categories: {
      cleanliness: number
      communication: number
      location: number
      value: number
    }
  }>

  // New: Maintenance
  maintenance: {
    cleaningSchedule: Array<{ task: string; frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' }>
    tasks: Array<{
      id: string
      title: string
      date: string
      assignedTo: string
      status: 'pending' | 'in_progress' | 'completed'
      type: 'cleaning' | 'repair' | 'inspection'
    }>
  }
}
```

## Component Structure

```
pages/listings/[id].vue          — Page shell (hero + tabs)
components/listings/
  ListingHeroCompact.vue         — New compact hero (replaces ListingHero.vue)
  ListingOverviewTab.vue         — Stats + bookings preview + reviews preview
  ListingPricingTab.vue          — Pricing management (NEW)
  ListingCalendarTab.vue         — Calendar + bookings (NEW)
  ListingReviewsTab.vue          — Reviews list + ratings (NEW)
  ListingMaintenanceTab.vue      — Cleaning/maintenance (NEW)
  ListingSettingsTab.vue         — Combined settings (refactored from PropertySettings + AiSchedule)
  data/listings.ts               — Updated type + mock data
```

## Visual Guidelines

- Semantic Tailwind colors (`bg-muted`, `text-muted-foreground`, etc.)
- ElevAI gold: `bg-[#C8A84B]` for AI branding only
- Generous padding (p-5/p-6 on cards)
- Gap-4 to gap-6 between sections
- Stats cards: border + rounded-lg, icon in muted circle, value prominent

### Existing shadcn-vue Components to Use

Must use components from `app/components/ui/` — do NOT create custom equivalents:

| Section | Components |
|---------|-----------|
| **Page shell** | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| **Hero** | `Badge`, `Button`, `Avatar` |
| **Overview stats** | `Card`, `CardHeader`, `CardContent` |
| **Overview bookings/reviews** | `Card`, `Badge`, `ScrollArea` |
| **Pricing** | `Card`, `Input`, `Label`, `Button`, `Table`, `TableRow`, `TableCell` |
| **Calendar** | `Calendar` (existing shadcn calendar component), `Badge`, `Card` |
| **Reviews** | `Card`, `Badge`, `Progress`, `Textarea`, `Button`, `ScrollArea` |
| **Maintenance** | `Card`, `Badge`, `Button`, `Table`, `Select`, `Dialog` (for add task) |
| **Settings form** | `Card`, `Input`, `Label`, `Button`, `Select`, `Switch`, `Popover`, `Separator` |

Also available and useful: `Tooltip`, `Skeleton` (loading states), `Empty` (empty states), `Alert`, `DropdownMenu`.

## Migration Notes

- `ListingHero.vue` → replaced by `ListingHeroCompact.vue`
- `ListingOverview.vue` → replaced by `ListingOverviewTab.vue` (stats move here, amenities move to Settings)
- `ListingPropertySettings.vue` → merged into `ListingSettingsTab.vue`
- `ListingAiSchedule.vue` → merged into `ListingSettingsTab.vue`
- Old components can be deleted after migration
- All mock data is local (no API) — extend `listings.ts` with new fields
