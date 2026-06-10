# Listing Detail — Floating Menu & AI Auto-Fill

**Date:** 2026-06-01  
**Status:** Approved

## Summary

Add a persistent floating action bar to the listing detail page with three buttons: **Listing Setup**, **Test AI**, and **AI Schedule**. The centerpiece is Listing Setup — a full-screen overlay with a two-panel layout for managing AI knowledge and auto-filling listing fields from uploaded documents and integrated data.

---

## 1. Floating Action Bar

A pill-shaped floating bar fixed at the bottom-center of the listing detail page (`/listings/[id]`). Always visible while on the page.

**Buttons:**
| Button | Icon | Action |
|--------|------|--------|
| Listing Setup | `lucide:layout-panel-left` | Opens full-screen Listing Setup overlay |
| Test AI | `lucide:bot` | Opens Test AI chat dialog |
| AI Schedule | `lucide:clock` | Opens the existing AI schedule Sheet (same as hero button) |

**Component:** `ListingFloatingMenu.vue`  
**Placement:** Fixed, `bottom-6`, `left-1/2 -translate-x-1/2`, `z-40`  
**Style:** `bg-background border rounded-full shadow-lg px-2 py-1.5 flex gap-1`

---

## 2. Listing Setup Overlay

Full-screen overlay (`fixed inset-0 z-50`) with a header and two-panel body.

### Header
- Left: icon + "Listing Setup" title + listing name (muted)
- Right: Close button (X)

### Left Panel — Field Tabs

Scrollable tab bar with 6 tabs. Each tab shows editable fields relevant to that section. Fields can be filled manually or via Auto-Fill.

| Tab | Content |
|-----|---------|
| **Basics** | Property name, location, capacity, room type, description, check-in/check-out times |
| **Listing Details** | Full listing description, house rules, neighborhood info, getting there |
| **Amenities** | Amenity list (same add/remove popover as Settings tab) |
| **SOPs** | Standard operating procedures — rich text or bullet list |
| **Topics to Avoid** | Topics the AI should not discuss — tag-style input |
| **Property Upsells** | Upsell services to promote — link to existing upsell catalog |

**Auto-fill indicator:** Fields filled by AI show a small `✨ AI filled` badge below them. A global "✨ Auto-fill all" button at the top of each tab triggers auto-fill for all fields in that tab.

### Right Panel — Resources (300px fixed width)

Three sections separated by dividers:

#### Section 1: Property Documents
- Subtitle: "All documents are used automatically by Elev8 AI"
- List of uploaded documents (filename, download ⬇ button, delete ✕ button)
- "+ Upload New Document" button (file picker, accepts PDF/DOCX/TXT, max 10MB each, max 20 files)
- Documents stored as `{ id, name, url, size, uploadedAt }` in `listing.resources.documents[]`

#### Section 2: Elev8 AI — Property Integration
- Static checklist (read-only, shows what data Elev8 AI has access to):
  - ✓ Property details
  - ✓ Property availability and pricing
  - ✓ Guest and reservation data
  - ✓ Past conversations (last 6 months)

#### Section 3: Property Profile
- **Auto-Fill Property Details** (primary button) — triggers mock AI analysis of uploaded documents + integration data, then fills all fields across all tabs with a loading state (spinner, 1.5s mock delay), shows toast on completion
- **Copy Data From Other Property** (secondary button) — opens a dialog to pick another listing (same search + tag filter pattern as copy schedule dialog), copies `resources` data from selected listing

---

## 3. Test AI

A dialog (`max-w-lg`) simulating a guest chat with the listing's AI.

### Layout
- Header: "Test AI" + listing name + "Simulating guest view" badge
- Chat area (ScrollArea): message bubbles — guest (right, muted bg) and AI (left, with ElevAI gold avatar)
- Input bar at bottom: text input + Send button

### Behavior
- User types as a guest, hits Send
- AI "responds" after a 1s mock delay with a canned response referencing listing data (name, location, check-in time)
- Starter suggestions: 3 clickable chips ("What time is check-in?", "Is there parking?", "What's the WiFi password?")
- Each chip sends that message automatically

### Mock AI responses
Map common questions to mock answers using listing data:
- Check-in → `listing.pricing` check-in time (or "14:00" default)
- Parking → check `listing.amenities` for "Parking"
- WiFi → generic "WiFi details will be provided at check-in"
- Fallback → "I'll check with the host and get back to you shortly."

---

## 4. AI Schedule (reuse)

Clicking "AI Schedule" in the floating bar programmatically opens the existing `showScheduleSheet` in `ListingHeroCompact.vue`. This is done by emitting an event from `ListingFloatingMenu` up to the page, which passes it down to the hero via a prop/ref.

**Implementation:** Add `openSchedule` prop (boolean) to `ListingHeroCompact`. Page sets it to `true` when floating menu emits `open-schedule`, hero watches it and opens the sheet, then resets the prop.

---

## Data Model Changes

Add `resources` field to `Listing`:

```ts
export interface ListingDocument {
  id: string
  name: string
  url: string // base64 data URL or remote URL
  size: number // bytes
  uploadedAt: string // ISO date
}

export interface ListingResources {
  documents: ListingDocument[]
  basics: {
    description?: string
    houseRules?: string
    neighborhood?: string
    checkInTime?: string
    checkOutTime?: string
  }
  listingDetails?: string
  sops?: string
  topicsToAvoid?: string[]
  propertyUpsells?: string[] // upsell service IDs
}
```

Add to `Listing` interface:
```ts
resources: ListingResources
```

Default value for all listings:
```ts
resources: { documents: [], basics: {}, topicsToAvoid: [], propertyUpsells: [] }
```

---

## Component Structure

```
app/components/listings/
  ListingFloatingMenu.vue          — Floating pill bar (3 buttons)
  ListingSetupOverlay.vue          — Full-screen overlay shell (header + panels)
  ListingSetupFieldPanel.vue       — Left panel: tab bar + field content per tab
  ListingSetupResourcePanel.vue    — Right panel: documents + integration + actions
  ListingTestAIDialog.vue          — Test AI chat dialog
```

`[id].vue` page:
- Renders `<ListingFloatingMenu>` at the bottom
- Handles `open-setup`, `open-test-ai`, `open-schedule` events
- Passes `openSchedule` prop to `ListingHeroCompact`

---

## Visual Guidelines

- Floating bar: `bg-background border shadow-lg rounded-full` — matches existing shadcn style
- Overlay: full-screen, same dark bg as app
- Left panel tabs: same `Tabs`/`TabsList`/`TabsTrigger` pattern as existing page tabs
- Right panel: `Card`-like sections with `Separator` between them
- AI filled badge: small, `text-primary` with sparkle icon
- Test AI chat: guest bubbles right-aligned `bg-muted`, AI bubbles left-aligned with `bg-[#C8A84B]/10` and bot icon
- All shadcn-vue components: `Button`, `Input`, `Textarea`, `ScrollArea`, `Dialog`, `Sheet`, `Separator`, `Badge`
