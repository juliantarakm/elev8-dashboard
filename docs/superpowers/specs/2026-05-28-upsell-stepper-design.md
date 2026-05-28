# Upsell Service Stepper — Design Spec

**Date:** 2026-05-28
**Scope:** Convert `UpsellDrawer.vue` create & edit flow into a 4-step stepper UI

---

## Overview

The current `UpsellDrawer.vue` uses a 2-tab layout (Details + Items) that puts too many fields on screen at once. This spec replaces it with a guided 4-step stepper to reduce cognitive load and create a clearer creation flow.

The stepper applies to both **create** and **edit** modes. Container remains a Sheet (`side="right"`, `sm:max-w-lg`).

---

## Layout

```
┌─────────────────────────────────────┐
│ SheetHeader                          │
│   Title: "Add Airport Transport"     │
│                                      │
│  ①──────②──────③──────④            │
│ Basic  Items  Listings Settings      │
├─────────────────────────────────────┤
│ ScrollArea (konten step aktif)       │
│  ...fields...                        │
├─────────────────────────────────────┤
│ Footer: [Back]          [Next →]     │
└─────────────────────────────────────┘
```

**Step indicator** sits inside `SheetHeader`, below the title. Four numbered circles connected by horizontal lines. Clicking any circle jumps to that step freely (no validation gate on click).

**Step circle states:**
- Active: `bg-primary text-primary-foreground`
- Visited: checkmark icon, `bg-primary/20 text-primary`
- Unvisited: number, `bg-muted text-muted-foreground`

**Footer:**
- Back button: hidden on step 1, visible on steps 2–4
- Next button: label "Next →" on steps 1–3, "Save" / "Save Changes" on step 4

---

## Steps

### Step 1 — Basic Info
Fields: Name (required), Category (select), Description (textarea + variable replacement chips), Image (file upload), YouTube links (add/remove list)

### Step 2 — Items
Draggable item list (vuedraggable). "Add Item" button opens existing Dialog modal (unchanged). Empty state shown when no items.

### Step 3 — Listings & Availability
Assigned listings checkbox list with "Select all" / "Clear" actions. Availability selector: two cards (Always Available / By Request).

### Step 4 — Settings
Tax & Service toggle + tax % + service % inputs. WhatsApp notification users (add/remove list). Internal notes textarea. Status switch (Active/Inactive).

---

## Navigation & Validation

**Free jump:** Clicking any step indicator navigates immediately without validation.

**Next button from Step 1:** Validates that Name is not empty. Shows inline error below the Name field if empty. Does not proceed until fixed.

**Save button on Step 4:** Validates Name is not empty AND at least 1 item exists. If item list is empty, redirects to Step 2 and shows `toast.error('At least one item is required.')`. If Name is empty, stays on step 4 and shows inline error.

---

## State Changes in `UpsellDrawer.vue`

**New refs:**
```ts
const currentStep = ref(1)
const visitedSteps = ref<Set<number>>(new Set([1]))
const nameError = ref(false)
```

**Removed:**
- `activeTab` ref
- `<Tabs>`, `<TabsList>`, `<TabsTrigger>` components in header

**New functions:**
- `goToStep(n: number)` — sets `currentStep`, adds `n` to `visitedSteps`
- `nextStep()` — validates step 1 if `currentStep === 1`, then calls `goToStep(currentStep + 1)`
- `prevStep()` — calls `goToStep(currentStep - 1)`

**Edit mode init (inside `watch(() => props.open)`):**
```ts
if (props.service) {
  visitedSteps.value = new Set([1, 2, 3, 4])
  currentStep.value = 1
}
```

**Reset on close (create mode):**
```ts
currentStep.value = 1
visitedSteps.value = new Set([1])
nameError.value = false
```

---

## Files Changed

| File | Change |
|------|--------|
| `app/components/upsells/UpsellDrawer.vue` | Replace 2-tab layout with 4-step stepper |

No new files. Item Dialog modal is unchanged.
