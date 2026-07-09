# Guest Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Guest Guide module — auto-send public welcome pages to guests on booking confirmation, with custom editor, pre-arrival forms, smart lock codes, upsells, and submissions monitoring.

**Architecture:** Two apps sharing one API. Dashboard (existing Nuxt app) hosts the editor/admin at `/guest-guides`. Public subdomain (new lightweight Nuxt app at `guide.elev8-suite.com/{token}`) hosts the guest-facing page. Communication via `/api/guest-guides/*` REST endpoints. Auto-trigger via new `send_guest_guide` Journey step.

**Tech Stack:** Nuxt 4 + Vue 3.5 + shadcn-vue + Tailwind v4. Vitest for tests. `nanoid` for tokens. Existing composables: `useInbox`, `useJourneys`, `useSmartLock`, `useUpsellServices`, `useWhatsAppTemplates`. Toast via `vue-sonner`.

**Reference:** Full design in `docs/superpowers/specs/2026-07-09-guest-guide-design.md`. Re-read this before starting any task.

---

## Phase Map

| Phase | Scope | Tasks | Duration |
|-------|-------|-------|----------|
| **1. Foundation (MVP)** | Data model, composables, library page (read-only), manual link issuance, public app scaffold with `welcome` section only | Tasks 1–12 | ~1 week |
| **2. Editor + Sections** | All 13 section types + editors, template gallery, drag-reorder, preview iframe | Tasks 13–24 | ~1.5 weeks |
| **3. Auto-Trigger** | `send_guest_guide` Journey step, 3 marketplace templates, WhatsApp delivery | Tasks 25–32 | ~1 week |
| **4. Forms + Live Data** | Pre-arrival form, ID verification, upsell integration, smart lock panel, submissions monitoring, reservation panel tab, listing settings card | Tasks 33–48 | ~2 weeks |
| **5. Polish** | ID photo upload pipeline, email + OTA channels, smart section ordering, backfill existing reservations, analytics | Tasks 49–56 | ~1 week |

**Stop at any phase boundary for review.** Each phase is independently shippable.

---

## Conventions Used Throughout

- **Imports**: Most Vue/Reactivity helpers (`ref`, `computed`, `watch`, `useState`) are auto-imported by Nuxt. Do NOT add explicit imports for them.
- **State management**: All persistent state uses `useState<T>('namespace', () => defaultValue)` from Nuxt.
- **Spread mutation pattern**: NEVER mutate state directly. Always use spread:
  ```ts
  // ✅ correct
  guides.value = [...guides.value, newGuide]
  // ❌ wrong
  guides.value.push(newGuide)
  ```
- **Class merging**: Always use `cn()` from `~/lib/utils` for class merging.
- **Toast**: Use `toast.success(...)`, `toast.info(...)`, `toast.error(...)` from `vue-sonner`.
- **Currency formatting**: Use existing helpers from `~/lib/utils.ts`.
- **Tests**: Vitest. Test files in `tests/components/guest-guides/...` or co-located as `*.test.ts`. Run with `npx vitest run <path>`.
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Append `Co-Authored-By: Claude <noreply@anthropic.com>` to commit body.
- **No emoji in code or commits** except as visual indicators in UI components.

---

# Phase 1 — Foundation (MVP)

### Task 1: Type definitions

**Files:**
- Create: `app/components/guest-guides/data/types.ts`

- [ ] **Step 1: Create the types file with all data model interfaces**

```ts
// app/components/guest-guides/data/types.ts

export type GuideStatus = 'draft' | 'active' | 'archived'
export type LinkStatus = 'pending' | 'opened' | 'submitted' | 'expired' | 'revoked'
export type LinkChannel = 'whatsapp' | 'email' | 'manual'
export type PreArrivalField =
  | 'arrival_time'
  | 'guests'
  | 'mobile'
  | 'id_type'
  | 'id_number'
  | 'id_photo'
  | 'requests'

export type GuideSectionType =
  | 'hero'
  | 'welcome'
  | 'checkin'
  | 'checkout'
  | 'house_rules'
  | 'amenities'
  | 'wifi'
  | 'local_tips'
  | 'documents'
  | 'upsells'
  | 'smart_lock'
  | 'pre_arrival'
  | 'custom_rich'

export interface GuideSection {
  id: string
  type: GuideSectionType
  order: number
  enabled: boolean
  data: Record<string, any>
}

export interface GuestGuide {
  id: string
  title: string
  description?: string
  assignedListingIds: string[]
  templateId?: string
  status: GuideStatus
  sections: GuideSection[]
  defaultLanguage: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface GuestGuideLink {
  id: string
  token: string
  guideId: string
  reservationId: string
  listingId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestLanguage?: string
  sentAt: string
  openedAt?: string
  submittedAt?: string
  expiresAt: string
  status: LinkStatus
  channel: LinkChannel
  metadata?: { journeyId?: string; templateId?: string }
}

export interface GuideSubmission {
  id: string
  linkId: string
  submittedAt: string
  arrivalTime?: string
  guests?: number
  mobile?: string
  idType?: 'passport' | 'ktp' | 'driver_license'
  idNumber?: string
  idPhotoUrl?: string
  requests?: string
  upsellsAdded?: { serviceId: string; qty: number }[]
  smartLockViewedAt?: string
}

export interface GuideTemplate {
  id: string
  name: string
  description: string
  category: 'tropical' | 'mountain' | 'urban'
  iconName: string
  sections: Omit<GuideSection, 'id'>[]
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add app/components/guest-guides/data/types.ts
git commit -m "feat(guest-guides): add data model types

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Token utility

**Files:**
- Create: `app/utils/guest-guide-token.ts`
- Test: `tests/utils/guest-guide-token.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/utils/guest-guide-token.test.ts
import { describe, expect, it } from 'vitest'
import { generateGuideId, generateLinkId, generateSectionId, generateToken } from '~/utils/guest-guide-token'

describe('guest-guide-token', () => {
  it('generates guide id with gg- prefix', () => {
    const id = generateGuideId()
    expect(id.startsWith('gg-')).toBe(true)
    expect(id.length).toBeGreaterThan(3)
  })

  it('generates link id with ggl- prefix', () => {
    const id = generateLinkId()
    expect(id.startsWith('ggl-')).toBe(true)
  })

  it('generates section id with gs- prefix', () => {
    const id = generateSectionId()
    expect(id.startsWith('gs-')).toBe(true)
  })

  it('generates unguessable 12-char tokens', () => {
    const token = generateToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{12}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/guest-guide-token.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the utility**

```ts
// app/utils/guest-guide-token.ts
import { nanoid } from 'nanoid'

const PREFIX = {
  guide: 'gg',
  link: 'ggl',
  section: 'gs',
} as const

function makeId(prefix: string): string {
  return `${prefix}-${nanoid(12)}`
}

export function generateGuideId(): string {
  return makeId(PREFIX.guide)
}

export function generateLinkId(): string {
  return makeId(PREFIX.link)
}

export function generateSectionId(): string {
  return makeId(PREFIX.section)
}

export function generateToken(): string {
  return nanoid(12)
}
```

- [ ] **Step 4: Verify nanoid is available**

Run: `grep -E '"nanoid"' package.json`
Expected: nanoid in dependencies. If missing: `npm install nanoid` and add to package.json.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/utils/guest-guide-token.test.ts`
Expected: PASS — all 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add app/utils/guest-guide-token.ts tests/utils/guest-guide-token.test.ts package.json package-lock.json
git commit -m "feat(guest-guides): add token/id generation utility

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: useGuestGuides composable (state + CRUD)

**Files:**
- Create: `app/composables/useGuestGuides.ts`
- Test: `tests/composables/useGuestGuides.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/composables/useGuestGuides.test.ts
import { describe, expect, it, beforeEach } from 'vitest'

describe('useGuestGuides', () => {
  beforeEach(() => {
    // reset state between tests
    const { guides } = useGuestGuides()
    guides.value = []
  })

  it('starts with empty guides array', () => {
    const { guides } = useGuestGuides()
    expect(guides.value).toEqual([])
  })

  it('creates a guide with auto-generated id', () => {
    const { createGuide } = useGuestGuides()
    const guide = createGuide({
      title: 'Test Guide',
      defaultLanguage: 'en',
    })
    expect(guide.id).toMatch(/^gg-/)
    expect(guide.title).toBe('Test Guide')
    expect(guide.status).toBe('draft')
    expect(guide.sections).toEqual([])
  })

  it('updates a guide via spread', () => {
    const { createGuide, updateGuide } = useGuestGuides()
    const guide = createGuide({ title: 'A', defaultLanguage: 'en' })
    updateGuide(guide.id, { title: 'B' })
    const { guides } = useGuestGuides()
    expect(guides.value.find(g => g.id === guide.id)?.title).toBe('B')
  })

  it('deletes a guide', () => {
    const { createGuide, deleteGuide, guides } = useGuestGuides()
    const guide = createGuide({ title: 'A', defaultLanguage: 'en' })
    deleteGuide(guide.id)
    expect(guides.value.find(g => g.id === guide.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/composables/useGuestGuides.test.ts`
Expected: FAIL — composable not found

- [ ] **Step 3: Implement composable**

```ts
// app/composables/useGuestGuides.ts
import type { GuestGuide, GuideStatus } from '~/components/guest-guides/data/types'
import { generateGuideId } from '~/utils/guest-guide-token'

export function useGuestGuides() {
  const guides = useState<GuestGuide[]>('guest-guides', () => [])

  function createGuide(input: {
    title: string
    description?: string
    defaultLanguage: string
    templateId?: string
  }): GuestGuide {
    const now = new Date().toISOString()
    const newGuide: GuestGuide = {
      id: generateGuideId(),
      title: input.title,
      description: input.description,
      assignedListingIds: [],
      templateId: input.templateId,
      status: 'draft',
      sections: [],
      defaultLanguage: input.defaultLanguage,
      createdBy: 'staff-1', // current user — Komang in production
      createdAt: now,
      updatedAt: now,
    }
    guides.value = [...guides.value, newGuide]
    return newGuide
  }

  function updateGuide(id: string, patch: Partial<GuestGuide>): void {
    guides.value = guides.value.map(g =>
      g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g,
    )
  }

  function deleteGuide(id: string): void {
    guides.value = guides.value.filter(g => g.id !== id)
  }

  function setStatus(id: string, status: GuideStatus): void {
    updateGuide(id, { status })
  }

  function duplicateGuide(id: string): GuestGuide | null {
    const source = guides.value.find(g => g.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const copy: GuestGuide = {
      ...source,
      id: generateGuideId(),
      title: `${source.title} (copy)`,
      status: 'draft',
      assignedListingIds: [],
      createdAt: now,
      updatedAt: now,
    }
    guides.value = [...guides.value, copy]
    return copy
  }

  return {
    guides,
    createGuide,
    updateGuide,
    deleteGuide,
    setStatus,
    duplicateGuide,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/composables/useGuestGuides.test.ts`
Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add app/composables/useGuestGuides.ts tests/composables/useGuestGuides.test.ts
git commit -m "feat(guest-guides): add useGuestGuides composable with CRUD

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: useGuestGuideLinks composable

**Files:**
- Create: `app/composables/useGuestGuideLinks.ts`
- Test: `tests/composables/useGuestGuideLinks.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/composables/useGuestGuideLinks.test.ts
import { describe, expect, it, beforeEach } from 'vitest'

describe('useGuestGuideLinks', () => {
  beforeEach(() => {
    const { links } = useGuestGuideLinks()
    links.value = []
  })

  it('starts with empty links array', () => {
    const { links } = useGuestGuideLinks()
    expect(links.value).toEqual([])
  })

  it('issues a link with token and pending status', () => {
    const { issueLink } = useGuestGuideLinks()
    const link = issueLink({
      guideId: 'gg-abc',
      reservationId: 'res-1',
      listingId: 'lst-1',
      guestName: 'Anna Schmidt',
      guestEmail: 'anna@example.com',
      guestPhone: '+4912345678',
      guestLanguage: 'de',
      channel: 'whatsapp',
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    })
    expect(link.id).toMatch(/^ggl-/)
    expect(link.token).toMatch(/^[A-Za-z0-9_-]{12}$/)
    expect(link.status).toBe('pending')
    expect(link.guestName).toBe('Anna Schmidt')
  })

  it('rejects duplicate link for same reservation', () => {
    const { issueLink } = useGuestGuideLinks()
    issueLink({
      guideId: 'gg-abc',
      reservationId: 'res-1',
      listingId: 'lst-1',
      guestName: 'Anna',
      channel: 'whatsapp',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(() => {
      issueLink({
        guideId: 'gg-abc',
        reservationId: 'res-1',
        listingId: 'lst-1',
        guestName: 'Anna',
        channel: 'whatsapp',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
    }).toThrow()
  })

  it('marks link as opened', () => {
    const { issueLink, markOpened, links } = useGuestGuideLinks()
    const link = issueLink({
      guideId: 'gg-abc',
      reservationId: 'res-2',
      listingId: 'lst-1',
      guestName: 'Bob',
      channel: 'manual',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    markOpened(link.id)
    expect(links.value[0].openedAt).toBeDefined()
    expect(links.value[0].status).toBe('opened')
  })

  it('revokes link', () => {
    const { issueLink, revokeLink, links } = useGuestGuideLinks()
    const link = issueLink({
      guideId: 'gg-abc',
      reservationId: 'res-3',
      listingId: 'lst-1',
      guestName: 'Carol',
      channel: 'manual',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    revokeLink(link.id)
    expect(links.value[0].status).toBe('revoked')
  })

  it('finds link by token', () => {
    const { issueLink, findByToken } = useGuestGuideLinks()
    const link = issueLink({
      guideId: 'gg-abc',
      reservationId: 'res-4',
      listingId: 'lst-1',
      guestName: 'Dan',
      channel: 'manual',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(findByToken(link.token)?.id).toBe(link.id)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/composables/useGuestGuideLinks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement composable**

```ts
// app/composables/useGuestGuideLinks.ts
import type { GuestGuideLink, LinkChannel } from '~/components/guest-guides/data/types'
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

export function useGuestGuideLinks() {
  const links = useState<GuestGuideLink[]>('guest-guide-links', () => [])

  function issueLink(input: {
    guideId: string
    reservationId: string
    listingId: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    guestLanguage?: string
    channel: LinkChannel
    expiresAt: string
    metadata?: { journeyId?: string; templateId?: string }
  }): GuestGuideLink {
    if (links.value.some(l => l.reservationId === input.reservationId)) {
      throw new Error(`Link already issued for reservation ${input.reservationId}`)
    }
    const now = new Date().toISOString()
    const newLink: GuestGuideLink = {
      id: generateLinkId(),
      token: generateToken(),
      guideId: input.guideId,
      reservationId: input.reservationId,
      listingId: input.listingId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestLanguage: input.guestLanguage,
      sentAt: now,
      expiresAt: input.expiresAt,
      status: 'pending',
      channel: input.channel,
      metadata: input.metadata,
    }
    links.value = [...links.value, newLink]
    return newLink
  }

  function updateLink(id: string, patch: Partial<GuestGuideLink>): void {
    links.value = links.value.map(l => (l.id === id ? { ...l, ...patch } : l))
  }

  function markOpened(id: string): void {
    const link = links.value.find(l => l.id === id)
    if (!link) return
    updateLink(id, {
      status: 'opened',
      openedAt: link.openedAt ?? new Date().toISOString(),
    })
  }

  function markSubmitted(id: string): void {
    updateLink(id, {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    })
  }

  function revokeLink(id: string): void {
    updateLink(id, { status: 'revoked' })
  }

  function findByToken(token: string): GuestGuideLink | undefined {
    return links.value.find(l => l.token === token)
  }

  function findByReservation(reservationId: string): GuestGuideLink | undefined {
    return links.value.find(l => l.reservationId === reservationId)
  }

  function findByGuide(guideId: string): GuestGuideLink[] {
    return links.value.filter(l => l.guideId === guideId)
  }

  return {
    links,
    issueLink,
    updateLink,
    markOpened,
    markSubmitted,
    revokeLink,
    findByToken,
    findByReservation,
    findByGuide,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/composables/useGuestGuideLinks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useGuestGuideLinks.ts tests/composables/useGuestGuideLinks.test.ts
git commit -m "feat(guest-guides): add useGuestGuideLinks composable

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Mock seed data

**Files:**
- Create: `app/components/guest-guides/data/mock-guides.ts`

- [ ] **Step 1: Create the mock file**

```ts
// app/components/guest-guides/data/mock-guides.ts
import type { GuestGuide, GuestGuideLink } from './types'

const now = new Date().toISOString()

export const mockGuestGuides: GuestGuide[] = [
  {
    id: 'gg-mock-001',
    title: 'Bali Villa Welcome Guide',
    description: 'Standard welcome pack for Bali villas',
    assignedListingIds: ['lst-1', 'lst-2'],
    templateId: 'tpl-bali-villa',
    status: 'active',
    sections: [
      {
        id: 'gs-mock-001',
        type: 'hero',
        order: 0,
        enabled: true,
        data: { photoUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6', title: 'Welcome to Villa Serenity', subtitle: 'Your home in Bali' },
      },
      {
        id: 'gs-mock-002',
        type: 'welcome',
        order: 1,
        enabled: true,
        data: { message: 'We are thrilled to welcome you to Villa Serenity. This guide will help you make the most of your stay.' },
      },
    ],
    defaultLanguage: 'en',
    createdBy: 'staff-1',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gg-mock-002',
    title: 'Mountain Retreat Guide',
    description: 'Cozy guide for mountain properties',
    assignedListingIds: ['lst-3'],
    templateId: 'tpl-mountain-retreat',
    status: 'draft',
    sections: [],
    defaultLanguage: 'en',
    createdBy: 'staff-1',
    createdAt: now,
    updatedAt: now,
  },
]

export const mockGuestGuideLinks: GuestGuideLink[] = [
  {
    id: 'ggl-mock-001',
    token: 'abc123def456',
    guideId: 'gg-mock-001',
    reservationId: 'res-mock-001',
    listingId: 'lst-1',
    guestName: 'Anna Schmidt',
    guestEmail: 'anna@example.com',
    guestPhone: '+4912345678',
    guestLanguage: 'de',
    sentAt: now,
    openedAt: now,
    submittedAt: now,
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'submitted',
    channel: 'whatsapp',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/components/guest-guides/data/mock-guides.ts
git commit -m "feat(guest-guides): add mock seed data for guides and links

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Wire seed data into composables

**Files:**
- Modify: `app/composables/useGuestGuides.ts`
- Modify: `app/composables/useGuestGuideLinks.ts`

- [ ] **Step 1: Update useGuestGuides to seed on first call**

In `app/composables/useGuestGuides.ts`, change the `useState` initializer:

```ts
import { mockGuestGuides } from '~/components/guest-guides/data/mock-guides'

const guides = useState<GuestGuide[]>('guest-guides', () => [...mockGuestGuides])
```

- [ ] **Step 2: Update useGuestGuideLinks to seed on first call**

In `app/composables/useGuestGuideLinks.ts`:

```ts
import { mockGuestGuideLinks } from '~/components/guest-guides/data/mock-guides'

const links = useState<GuestGuideLink[]>('guest-guide-links', () => [...mockGuestGuideLinks])
```

- [ ] **Step 3: Re-run composable tests to ensure they still pass with seeding**

Run: `npx vitest run tests/composables/useGuestGuides.test.ts tests/composables/useGuestGuideLinks.test.ts`
Expected: PASS — the `beforeEach` resets state so tests stay green.

- [ ] **Step 4: Commit**

```bash
git add app/composables/useGuestGuides.ts app/composables/useGuestGuideLinks.ts
git commit -m "feat(guest-guides): seed mock data into composables

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Add /guest-guides to sidebar menu

**Files:**
- Modify: `app/constants/menus.ts` (or equivalent)

- [ ] **Step 1: Find the sidebar menu file**

Run: `grep -r "Payment Request" app/constants/ --include="*.ts" -l`

- [ ] **Step 2: Add the Guest Guides entry next to Payment Requests**

In the menu array (typically under an "Apps" or "Finance" section), add:

```ts
{
  title: 'Guest Guides',
  icon: 'i-lucide-book-open',
  link: '/guest-guides',
  new: true,
},
```

Place it logically grouped with Payment Requests / Promo Codes / Booking Widgets.

- [ ] **Step 3: Verify menu appears in dev server**

Run: `npm run dev`
Expected: When navigating to `/guest-guides`, the sidebar shows the new entry.

- [ ] **Step 4: Commit**

```bash
git add app/constants/menus.ts
git commit -m "feat(guest-guides): add sidebar entry for /guest-guides

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: GuestGuides library page (read-only)

**Files:**
- Create: `app/pages/guest-guides/index.vue`
- Create: `app/components/guest-guides/GuideCard.vue`
- Create: `app/components/guest-guides/GuideStatusBadge.vue`

- [ ] **Step 1: Create GuideStatusBadge component**

```vue
<!-- app/components/guest-guides/GuideStatusBadge.vue -->
<script setup lang="ts">
import type { GuideStatus } from './data/types'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{ status: GuideStatus }>()

const labelMap: Record<GuideStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

const variantMap: Record<GuideStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  archived: 'secondary',
}
</script>

<template>
  <Badge :variant="variantMap[props.status]">
    {{ labelMap[props.status] }}
  </Badge>
</template>
```

- [ ] **Step 2: Create GuideCard component**

```vue
<!-- app/components/guest-guides/GuideCard.vue -->
<script setup lang="ts">
import type { GuestGuide, GuestGuideLink } from './data/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import GuideStatusBadge from './GuideStatusBadge.vue'

const props = defineProps<{
  guide: GuestGuide
  links: GuestGuideLink[]
}>()

defineEmits<{
  edit: [id: string]
  preview: [id: string]
  links: [id: string]
}>()

const linkStats = computed(() => {
  const total = props.links.length
  const opened = props.links.filter(l => l.openedAt).length
  const submitted = props.links.filter(l => l.status === 'submitted').length
  return { total, opened, submitted }
})
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-start justify-between gap-2">
      <div>
        <CardTitle>{{ guide.title }}</CardTitle>
        <CardDescription v-if="guide.description">{{ guide.description }}</CardDescription>
      </div>
      <GuideStatusBadge :status="guide.status" />
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-muted-foreground">Listings</div>
          <div class="font-medium">{{ guide.assignedListingIds.length }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Links sent</div>
          <div class="font-medium">{{ linkStats.total }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">Submitted</div>
          <div class="font-medium">{{ linkStats.submitted }}</div>
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <Button variant="outline" size="sm" @click="$emit('edit', guide.id)">
          Edit
        </Button>
        <Button variant="outline" size="sm" @click="$emit('preview', guide.id)">
          Preview
        </Button>
        <Button variant="outline" size="sm" @click="$emit('links', guide.id)">
          Links
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 3: Create the library page**

```vue
<!-- app/pages/guest-guides/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import GuideCard from '~/components/guest-guides/GuideCard.vue'
import { toast } from 'vue-sonner'

const { guides } = useGuestGuides()
const { links } = useGuestGuideLinks()

const search = ref('')
const statusFilter = ref<'all' | 'active' | 'draft' | 'archived'>('all')

const filteredGuides = computed(() => {
  return guides.value.filter(g => {
    if (statusFilter.value !== 'all' && g.status !== statusFilter.value) return false
    if (search.value && !g.title.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
})

function handleCreate() {
  toast.info('Template gallery opens in Phase 2')
}

function handleEdit(id: string) {
  toast.info(`Editor opens in Phase 2 — guide: ${id}`)
}

function handlePreview(id: string) {
  toast.info(`Preview opens in Phase 2 — guide: ${id}`)
}

function handleLinks(id: string) {
  navigateTo(`/guest-guides/${id}/links`)
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Guest Guides</h1>
        <p class="text-sm text-muted-foreground">Manage welcome pages for your guests</p>
      </div>
      <Button @click="handleCreate">
        + Create Guide
      </Button>
    </div>

    <div class="mb-4 flex items-center gap-2">
      <Input v-model="search" placeholder="Search guides..." class="max-w-sm" />
      <div class="flex gap-1 rounded-md border p-1">
        <button
          v-for="status in ['all', 'active', 'draft', 'archived']"
          :key="status"
          class="rounded-sm px-3 py-1 text-sm"
          :class="statusFilter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
          @click="statusFilter = status as any"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <GuideCard
        v-for="guide in filteredGuides"
        :key="guide.id"
        :guide="guide"
        :links="links.filter(l => l.guideId === guide.id)"
        @edit="handleEdit"
        @preview="handlePreview"
        @links="handleLinks"
      />
    </div>

    <div v-if="filteredGuides.length === 0" class="py-12 text-center text-muted-foreground">
      No guides match your filters.
    </div>
  </div>
</template>
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev` and navigate to `/guest-guides`
Expected: See the two mock guides from seed data, with status badges, stats, and action buttons.

- [ ] **Step 5: Commit**

```bash
git add app/pages/guest-guides/index.vue app/components/guest-guides/GuideCard.vue app/components/guest-guides/GuideStatusBadge.vue
git commit -m "feat(guest-guides): library page with read-only guide cards

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Manual link issuance dialog

**Files:**
- Create: `app/components/guest-guides/SendLinkDialog.vue`
- Create: `app/components/guest-guides/ShareDialog.vue`

- [ ] **Step 1: Create ShareDialog component (reuse pattern from PaymentRequest)**

```vue
<!-- app/components/guest-guides/ShareDialog.vue -->
<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{
  open: boolean
  url: string
  guestName: string
  guestPhone?: string
  guestEmail?: string
}>()

defineEmits<{ 'update:open': [v: boolean] }>()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
    toast.success('Link copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}

function shareWhatsApp() {
  const text = encodeURIComponent(`Hi ${props.guestName}, here's your guest guide: ${props.url}`)
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

function shareEmail() {
  const subject = encodeURIComponent('Your Guest Guide')
  const body = encodeURIComponent(`Hi ${props.guestName},\n\nHere's your guest guide for your upcoming stay:\n${props.url}\n\nPlease complete the pre-arrival info at your earliest convenience.`)
  window.open(`mailto:${props.guestEmail ?? ''}?subject=${subject}&body=${body}`)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share Guest Guide</DialogTitle>
        <DialogDescription>Send this link to {{ guestName }} via your preferred channel.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="rounded-md bg-muted p-3 font-mono text-sm break-all">
          {{ url }}
        </div>
        <Button variant="outline" class="w-full" @click="copyLink">
          Copy link
        </Button>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" @click="shareWhatsApp">
            WhatsApp
          </Button>
          <Button variant="outline" @click="shareEmail">
            Email
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Create SendLinkDialog**

```vue
<!-- app/components/guest-guides/SendLinkDialog.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import ShareDialog from './ShareDialog.vue'

const props = defineProps<{
  open: boolean
  guideId: string
}>()

defineEmits<{ 'update:open': [v: boolean] }>()

const { guides } = useGuestGuides()
const { issueLink, findByReservation } = useGuestGuideLinks()
const { conversations } = useInbox()

const selectedReservationId = ref<string>('')
const shareDialogOpen = ref(false)
const issuedUrl = ref('')

const reservationsFromConversations = computed(() => {
  return conversations.value
    .filter(c => c.reservationId)
    .map(c => ({
      id: c.reservationId!,
      label: `${c.guestName} — ${c.listingName} (${c.checkIn} → ${c.checkOut})`,
    }))
})

const selectedReservation = computed(() => {
  return conversations.value.find(c => c.reservationId === selectedReservationId.value)
})

watch(() => props.open, (open) => {
  if (open) {
    selectedReservationId.value = ''
    shareDialogOpen.value = false
  }
})

async function handleSend() {
  if (!selectedReservation.value) {
    toast.error('Please select a reservation')
    return
  }
  const guide = guides.value.find(g => g.id === props.guideId)
  if (!guide) {
    toast.error('Guide not found')
    return
  }
  if (findByReservation(selectedReservation.value.reservationId!)) {
    toast.error('A guide link already exists for this reservation')
    return
  }
  try {
    const link = issueLink({
      guideId: guide.id,
      reservationId: selectedReservation.value.reservationId!,
      listingId: selectedReservation.value.listingName ?? '',
      guestName: selectedReservation.value.guestName,
      guestEmail: undefined,
      guestPhone: selectedReservation.value.guestPhone,
      guestLanguage: selectedReservation.value.guestLanguage,
      channel: 'manual',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    })
    issuedUrl.value = `https://guide.elev8-suite.com/${link.token}`
    shareDialogOpen.value = true
    toast.success(`Guide link generated for ${link.guestName}`)
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to issue link')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send Guide Link</DialogTitle>
        <DialogDescription>Choose a reservation to generate a tokenized guest guide link for.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">Reservation</label>
          <Select v-model="selectedReservationId">
            <SelectTrigger>
              <SelectValue placeholder="Select a reservation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="r in reservationsFromConversations" :key="r.id" :value="r.id">
                {{ r.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!selectedReservationId" @click="handleSend">
          Generate link
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ShareDialog
    v-if="issuedUrl"
    v-model:open="shareDialogOpen"
    :url="issuedUrl"
    :guest-name="selectedReservation?.guestName ?? ''"
    :guest-phone="selectedReservation?.guestPhone"
    :guest-email="selectedReservation?.guestEmail"
  />
</template>
```

- [ ] **Step 3: Wire SendLinkDialog into the library page**

In `app/pages/guest-guides/index.vue`, add the dialog and a "+ Send" button per card.

Add to `<script setup>`:

```ts
const sendDialogOpen = ref(false)
const sendDialogGuideId = ref<string | null>(null)

function handleSend(guideId: string) {
  sendDialogGuideId.value = guideId
  sendDialogOpen.value = true
}
```

Update the GuideCard `@links` to also pass a send handler, OR add a separate "Send" button in the card:

Modify `GuideCard.vue` — add to emits:

```ts
defineEmits<{
  edit: [id: string]
  preview: [id: string]
  links: [id: string]
  send: [id: string]
}>()
```

Add a new button in the card actions:

```vue
<Button variant="default" size="sm" @click="$emit('send', guide.id)">
  + Send Link
</Button>
```

Add to library page template (after the card grid):

```vue
<SendLinkDialog
  v-if="sendDialogGuideId"
  v-model:open="sendDialogOpen"
  :guide-id="sendDialogGuideId"
/>
```

Don't forget the import:

```ts
import SendLinkDialog from '~/components/guest-guides/SendLinkDialog.vue'
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`, navigate to `/guest-guides`, click "+ Send Link" on a guide, select a reservation, click "Generate link"
Expected: ShareDialog opens with the generated URL.

- [ ] **Step 5: Commit**

```bash
git add app/components/guest-guides/SendLinkDialog.vue app/components/guest-guides/ShareDialog.vue app/pages/guest-guides/index.vue app/components/guest-guides/GuideCard.vue
git commit -m "feat(guest-guides): manual link issuance dialog with share

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Links monitoring page

**Files:**
- Create: `app/pages/guest-guides/[id]/links.vue`

- [ ] **Step 1: Create the page**

```vue
<!-- app/pages/guest-guides/[id]/links.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { toast } from 'vue-sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'

const route = useRoute()
const guideId = computed(() => route.params.id as string)

const { guides } = useGuestGuides()
const { links, revokeLink } = useGuestGuideLinks()

const guide = computed(() => guides.value.find(g => g.id === guideId.value))
const guideLinks = computed(() => links.value.filter(l => l.guideId === guideId.value))

const statusFilter = ref<'all' | 'pending' | 'opened' | 'submitted' | 'expired' | 'revoked'>('all')
const search = ref('')

const filteredLinks = computed(() => {
  return guideLinks.value.filter(l => {
    if (statusFilter.value !== 'all' && l.status !== statusFilter.value) return false
    if (search.value && !l.guestName.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
})

const statusVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  opened: 'secondary',
  submitted: 'default',
  expired: 'secondary',
  revoked: 'destructive',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

function handleRevoke(id: string) {
  revokeLink(id)
  toast.success('Link revoked')
}
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <NuxtLink to="/guest-guides" class="hover:underline">
        Guest Guides
      </NuxtLink>
      <span>/</span>
      <span>{{ guide?.title }}</span>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight">Links</h1>
      <p class="text-sm text-muted-foreground">All issued guest guide links for this guide</p>
    </div>

    <div class="mb-4 flex items-center gap-2">
      <Input v-model="search" placeholder="Search guests..." class="max-w-sm" />
      <div class="flex gap-1 rounded-md border p-1">
        <button
          v-for="status in ['all', 'pending', 'opened', 'submitted', 'revoked']"
          :key="status"
          class="rounded-sm px-3 py-1 text-sm"
          :class="statusFilter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'"
          @click="statusFilter = status as any"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Reservation</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="link in filteredLinks" :key="link.id">
            <TableCell class="font-mono text-xs">{{ link.token.slice(0, 8) }}…</TableCell>
            <TableCell>{{ link.guestName }}</TableCell>
            <TableCell>{{ link.reservationId }}</TableCell>
            <TableCell>{{ link.channel }}</TableCell>
            <TableCell>{{ formatDate(link.sentAt) }}</TableCell>
            <TableCell>
              <Badge :variant="statusVariantMap[link.status] ?? 'outline'">
                {{ link.status }}
              </Badge>
            </TableCell>
            <TableCell>
              <Button v-if="link.status !== 'revoked'" variant="ghost" size="sm" @click="handleRevoke(link.id)">
                Revoke
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredLinks.length === 0">
            <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
              No links match your filters.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, navigate to `/guest-guides/gg-mock-001/links`
Expected: See the seeded link, with status badge and Revoke button working.

- [ ] **Step 3: Commit**

```bash
git add app/pages/guest-guides/[id]/links.vue
git commit -m "feat(guest-guides): links monitoring page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Public app scaffold — guide.elev8-suite.com

**Files:**
- Create: `guide-app/` directory with new Nuxt app
- Create: `guide-app/package.json`
- Create: `guide-app/nuxt.config.ts`
- Create: `guide-app/app.vue`
- Create: `guide-app/pages/[token].vue`
- Create: `guide-app/composables/usePublicGuestGuide.ts`

> **Architectural note:** This task creates a NEW Nuxt app alongside the main one. In a real deployment, this would be a separate repository. For local development and testing, it's a sibling directory in the monorepo.

- [ ] **Step 1: Create the guide-app directory structure**

```bash
mkdir -p guide-app/app/pages guide-app/app/components/sections guide-app/app/components/forms guide-app/app/composables guide-app/app/assets/css
```

- [ ] **Step 2: Create package.json**

```json
// guide-app/package.json
{
  "name": "elev8-guide-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev --port 3001",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "nuxt": "^4.1.3",
    "vue": "^3.5.22",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@nuxt/ui": "^3.0.0"
  }
}
```

- [ ] **Step 3: Create nuxt.config.ts**

```ts
// guide-app/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  ssr: true,
  app: {
    head: {
      title: 'Your Guest Guide',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your personalized guest guide' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    },
  },
})
```

- [ ] **Step 4: Create app.vue (root component)**

```vue
<!-- guide-app/app/app.vue -->
<template>
  <div class="min-h-screen bg-background font-sans">
    <NuxtPage />
  </div>
</template>
```

- [ ] **Step 5: Create CSS file**

```css
/* guide-app/app/assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
}
```

- [ ] **Step 6: Create public guide composable**

```ts
// guide-app/app/composables/usePublicGuestGuide.ts
import type { GuestGuide, GuestGuideLink } from '~/../app/components/guest-guides/data/types'

// Mirror the type imports. In production these come from a shared package.
export interface PublicGuideResponse {
  link: GuestGuideLink
  guide: GuestGuide
}

export function usePublicGuestGuide() {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl

  async function fetchGuide(token: string): Promise<PublicGuideResponse> {
    return await $fetch<PublicGuideResponse>(`${apiBase}/api/guest-guides/by-token/${token}`)
  }

  async function markOpened(token: string): Promise<void> {
    await $fetch(`${apiBase}/api/guest-guides/by-token/${token}/opened`, { method: 'POST' })
  }

  async function submitForm(token: string, data: Record<string, any>): Promise<void> {
    await $fetch(`${apiBase}/api/guest-guides/by-token/${token}/submit`, {
      method: 'POST',
      body: data,
    })
  }

  async function logLockView(token: string): Promise<void> {
    await $fetch(`${apiBase}/api/guest-guides/by-token/${token}/view-lock`, { method: 'POST' })
  }

  return { fetchGuide, markOpened, submitForm, logLockView }
}
```

- [ ] **Step 7: Create placeholder public page**

```vue
<!-- guide-app/app/pages/[token].vue -->
<script setup lang="ts">
const route = useRoute()
const token = computed(() => route.params.token as string)
const { fetchGuide, markOpened } = usePublicGuestGuide()

const { data, pending, error } = await useAsyncData(
  `guide-${token.value}`,
  async () => {
    const result = await fetchGuide(token.value)
    await markOpened(token.value)
    return result
  },
)
</script>

<template>
  <div class="mx-auto max-w-3xl p-6">
    <div v-if="pending" class="py-12 text-center text-muted-foreground">
      Loading your guide...
    </div>
    <div v-else-if="error" class="py-12 text-center">
      <h1 class="text-xl font-semibold">We couldn't find your guide</h1>
      <p class="mt-2 text-sm text-muted-foreground">Please check the link or contact your host.</p>
    </div>
    <div v-else-if="data">
      <h1 class="text-2xl font-bold">{{ data.guide.title }}</h1>
      <p class="mt-2 text-muted-foreground">Welcome, {{ data.link.guestName }}!</p>
      <div class="mt-8 space-y-4">
        <div v-for="section in data.guide.sections.filter(s => s.enabled)" :key="section.id">
          <div v-if="section.type === 'welcome'" class="prose">
            <p>{{ section.data.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 8: Commit**

```bash
git add guide-app/
git commit -m "feat(guest-guides): scaffold public subdomain app

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 9: Install and run**

```bash
cd guide-app && npm install && cd ..
```

Note: We do NOT run the guide-app yet — it needs the API endpoints from Tasks 12+. We'll spin it up in Phase 4 once the API is built.

---

### Task 12: Public API endpoints (mock backend)

**Files:**
- Create: `app/server/api/guest-guides/by-token/[token].get.ts`
- Create: `app/server/api/guest-guides/by-token/[token]/opened.post.ts`
- Create: `app/server/utils/guest-guide-store.ts`

> These endpoints return mock data. Phase 5 replaces with real DB. The composable state (`useState`) is shared between Nuxt server and client in dev — for now we'll read from a server-side singleton.

- [ ] **Step 1: Create server-side store (mock)**

```ts
// app/server/utils/guest-guide-store.ts
import type { GuestGuide, GuestGuideLink, GuideSubmission } from '~/components/guest-guides/data/types'
import { mockGuestGuides, mockGuestGuideLinks } from '~/components/guest-guides/data/mock-guides'

// In-memory mock store. Phase 5 swaps for real DB.
const guides = new Map<string, GuestGuide>(mockGuestGuides.map(g => [g.id, g]))
const links = new Map<string, GuestGuideLink>(mockGuestGuideLinks.map(l => [l.id, l]))
const submissions = new Map<string, GuideSubmission>()

export function findGuide(id: string): GuestGuide | undefined {
  return guides.get(id)
}

export function findLinkByToken(token: string): GuestGuideLink | undefined {
  for (const link of links.values()) {
    if (link.token === token) return link
  }
  return undefined
}

export function findGuideByToken(token: string): GuestGuide | undefined {
  const link = findLinkByToken(token)
  if (!link) return undefined
  return guides.get(link.guideId)
}

export function markLinkOpened(id: string, at: string): void {
  const link = links.get(id)
  if (link && !link.openedAt) {
    links.set(id, { ...link, openedAt: at, status: 'opened' })
  }
}

export function saveSubmission(submission: GuideSubmission): void {
  submissions.set(submission.id, submission)
  const link = links.get(submission.linkId)
  if (link) {
    links.set(link.id, { ...link, status: 'submitted', submittedAt: submission.submittedAt })
  }
}

export function getSubmissionForLink(linkId: string): GuideSubmission | undefined {
  return Array.from(submissions.values()).find(s => s.linkId === linkId)
}
```

- [ ] **Step 2: Create GET /api/guest-guides/by-token/:token endpoint**

```ts
// app/server/api/guest-guides/by-token/[token].get.ts
import { findGuideByToken, findLinkByToken } from '~/server/utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token required' })
  }

  const link = findLinkByToken(token)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
  }

  if (link.status === 'revoked') {
    throw createError({ statusCode: 410, statusMessage: 'This guide is no longer available' })
  }

  if (new Date(link.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'This guide has expired' })
  }

  const guide = findGuideByToken(token)
  if (!guide) {
    throw createError({ statusCode: 404, statusMessage: 'Guide content not found' })
  }

  return { link, guide }
})
```

- [ ] **Step 3: Create POST opened endpoint**

```ts
// app/server/api/guest-guides/by-token/[token]/opened.post.ts
import { findLinkByToken, markLinkOpened } from '~/server/utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token required' })

  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  markLinkOpened(link.id, new Date().toISOString())
  return { ok: true }
})
```

- [ ] **Step 4: Test endpoints with curl**

Run dev server: `npm run dev`

In another terminal:
```bash
# Fetch guide for the mock token
curl http://localhost:3000/api/guest-guides/by-token/abc123def456

# Should return { link: {...}, guide: {...} }

# Try invalid token
curl -i http://localhost:3000/api/guest-guides/by-token/invalidtoken123
# Should return 404
```

Expected: First returns the mock data, second returns 404.

- [ ] **Step 5: Commit**

```bash
git add app/server/api/guest-guides/ app/server/utils/guest-guide-store.ts
git commit -m "feat(guest-guides): public API endpoints (fetch + mark opened)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: Phase 1 verification — full end-to-end smoke test

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Run dev server**

```bash
npm run dev
```

Expected: Server starts on port 3000.

- [ ] **Step 4: Manual end-to-end smoke test**

In the browser:
1. Navigate to `/guest-guides` — see two mock guides
2. Click "+ Send Link" on "Bali Villa Welcome Guide"
3. Select a reservation with conversation data
4. Click "Generate link"
5. ShareDialog opens with the URL `https://guide.elev8-suite.com/abc123def456` (the seeded mock token) OR a freshly generated token
6. Click "Copy link" — toast confirms
7. Close dialog, navigate to `/guest-guides/gg-mock-001/links`
8. See the seeded mock link with "submitted" status
9. In a new tab, paste the URL (it'll fail because no public app is running — that's expected for Phase 1)

- [ ] **Step 5: Tag Phase 1 complete**

```bash
git tag phase-1-foundation
git push --tags
```

---

# Phase 2 — Editor + Sections

### Task 14: Section list component (draggable)

**Files:**
- Create: `app/components/guest-guides/editor/SectionList.vue`
- Install: `vue-draggable-plus` (or `vuedraggable` if already installed)

- [ ] **Step 1: Check for existing drag library**

Run: `grep -E '"(vuedraggable|vue-draggable-plus|sortablejs)"' package.json`
Expected: One of them listed. If not, `npm install vue-draggable-plus` and add to deps.

- [ ] **Step 2: Create SectionList component**

```vue
<!-- app/components/guest-guides/editor/SectionList.vue -->
<script setup lang="ts">
import type { GuideSection } from '../data/types'
import { VueDraggable } from 'vue-draggable-plus'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  modelValue: GuideSection[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [v: GuideSection[]]
  'select': [id: string]
  'add': []
  'delete': [id: string]
}>()

const sectionTypeIcons: Record<string, string> = {
  hero: 'image',
  welcome: 'message-circle',
  checkin: 'log-in',
  checkout: 'log-out',
  house_rules: 'scroll',
  amenities: 'star',
  wifi: 'wifi',
  local_tips: 'map-pin',
  documents: 'file-text',
  upsells: 'shopping-bag',
  smart_lock: 'lock',
  pre_arrival: 'clipboard-list',
  custom_rich: 'edit',
}

function handleUpdate(newValue: GuideSection[]) {
  // Re-number the order
  const renumbered = newValue.map((s, idx) => ({ ...s, order: idx }))
  emit('update:modelValue', renumbered)
}
</script>

<template>
  <div class="space-y-1">
    <VueDraggable
      :model-value="modelValue"
      handle=".drag-handle"
      item-key="id"
      class="space-y-1"
      @update:model-value="handleUpdate"
    >
      <template v-for="section in modelValue" :key="section.id">
        <div
          class="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
          :class="selectedId === section.id ? 'border-primary bg-muted' : ''"
          @click="$emit('select', section.id)"
        >
          <span class="drag-handle cursor-grab text-muted-foreground">⋮⋮</span>
          <Icon :name="`lucide:${sectionTypeIcons[section.type]}`" class="size-4 text-muted-foreground" />
          <span class="flex-1 text-sm capitalize">{{ section.type.replace('_', ' ') }}</span>
          <Button
            variant="ghost"
            size="sm"
            class="size-6 p-0"
            @click.stop="$emit('delete', section.id)"
          >
            <Icon name="lucide:trash-2" class="size-3" />
          </Button>
        </div>
      </template>
    </VueDraggable>
    <Button variant="outline" class="w-full" size="sm" @click="$emit('add')">
      + Add Section
    </Button>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/guest-guides/editor/SectionList.vue package.json package-lock.json
git commit -m "feat(guest-guides): draggable section list component

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 15: Add Section dialog (picker for 13 types)

**Files:**
- Create: `app/components/guest-guides/editor/AddSectionDialog.vue`

- [ ] **Step 1: Create the dialog**

```vue
<!-- app/components/guest-guides/editor/AddSectionDialog.vue -->
<script setup lang="ts">
import type { GuideSectionType } from '../data/types'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [v: boolean]
  'select': [type: GuideSectionType]
}>()

const sectionTypes: Array<{ type: GuideSectionType; label: string; icon: string; description: string }> = [
  { type: 'hero', label: 'Hero', icon: 'image', description: 'Welcome banner with property photo' },
  { type: 'welcome', label: 'Welcome Message', icon: 'message-circle', description: 'Auto-translated greeting' },
  { type: 'checkin', label: 'Check-in', icon: 'log-in', description: 'Check-in time + instructions' },
  { type: 'checkout', label: 'Check-out', icon: 'log-out', description: 'Check-out time + instructions' },
  { type: 'house_rules', label: 'House Rules', icon: 'scroll', description: 'Bulleted rules list' },
  { type: 'amenities', label: 'Amenities', icon: 'star', description: 'Icon grid of features' },
  { type: 'wifi', label: 'Wi-Fi', icon: 'wifi', description: 'Network name + password' },
  { type: 'local_tips', label: 'Local Tips', icon: 'map-pin', description: 'Restaurants, beaches, transport' },
  { type: 'documents', label: 'Documents', icon: 'file-text', description: 'Downloadable PDFs' },
  { type: 'upsells', label: 'Upsells', icon: 'shopping-bag', description: 'Bookable services' },
  { type: 'smart_lock', label: 'Smart Lock', icon: 'lock', description: 'Door code (24h before check-in)' },
  { type: 'pre_arrival', label: 'Pre-Arrival Form', icon: 'clipboard-list', description: 'Guest info collection' },
  { type: 'custom_rich', label: 'Custom Content', icon: 'edit', description: 'Free-form rich text' },
]
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add Section</DialogTitle>
        <DialogDescription>Pick the type of section to add to your guide</DialogDescription>
      </DialogHeader>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
        <button
          v-for="s in sectionTypes"
          :key="s.type"
          class="flex flex-col items-start gap-1 rounded-md border p-3 text-left hover:bg-muted"
          @click="$emit('select', s.type); $emit('update:open', false)"
        >
          <Icon :name="`lucide:${s.icon}`" class="size-5 text-primary" />
          <span class="font-medium">{{ s.label }}</span>
          <span class="text-xs text-muted-foreground">{{ s.description }}</span>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/guest-guides/editor/AddSectionDialog.vue
git commit -m "feat(guest-guides): add section picker dialog

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Tasks 16-25: Individual section editors (one task per editor)

For each section type, create an editor component. Each task follows the same pattern:

> **Common pattern:** Each editor takes `modelValue` for the section data and emits `update:modelValue`. Uses shadcn `Input`, `Textarea`, `Switch`, etc. Default data is provided on first render if empty.

- [ ] **Task 16: HeroSectionEditor.vue**

Fields: `photoUrl`, `title`, `subtitle`

```vue
<!-- app/components/guest-guides/editor/sections/HeroSectionEditor.vue -->
<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Photo URL</Label>
      <Input :model-value="modelValue.photoUrl ?? ''" @update:model-value="update({ photoUrl: $event })" placeholder="https://..." />
    </div>
    <div>
      <Label>Title</Label>
      <Input :model-value="modelValue.title ?? ''" @update:model-value="update({ title: $event })" />
    </div>
    <div>
      <Label>Subtitle</Label>
      <Input :model-value="modelValue.subtitle ?? ''" @update:model-value="update({ subtitle: $event })" />
    </div>
  </div>
</template>
```

- [ ] **Task 17: WelcomeSectionEditor.vue**

Fields: `message` (Textarea)

```vue
<!-- app/components/guest-guides/editor/sections/WelcomeSectionEditor.vue -->
<script setup lang="ts">
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div>
    <Label>Welcome message</Label>
    <Textarea
      :model-value="modelValue.message ?? ''"
      rows="8"
      placeholder="Welcome to our property. We're thrilled to host you..."
      @update:model-value="update({ message: $event })"
    />
    <p class="mt-1 text-xs text-muted-foreground">
      Auto-translated at render time to the guest's language.
    </p>
  </div>
</template>
```

- [ ] **Task 18: CheckinSectionEditor.vue + CheckoutSectionEditor.vue**

Fields for both: `time` (Input type="time"), `instructions` (Textarea), `earlyCheckinAvailable` (Switch, checkin only)

Pattern identical to Task 16/17. Copy and adapt.

- [ ] **Task 19: HouseRulesSectionEditor.vue**

Fields: `rules: string[]` — use a list with add/remove buttons.

```vue
<!-- app/components/guest-guides/editor/sections/HouseRulesSectionEditor.vue -->
<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Icon } from '#components'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const rules = computed({
  get: () => (props.modelValue.rules ?? []) as string[],
  set: (v: string[]) => update({ rules: v }),
})

function add() {
  rules.value = [...rules.value, '']
}

function remove(idx: number) {
  rules.value = rules.value.filter((_, i) => i !== idx)
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="(rule, idx) in rules" :key="idx" class="flex gap-2">
      <Input v-model="rules[idx]" placeholder="e.g. No smoking indoors" />
      <Button variant="ghost" size="sm" @click="remove(idx)">
        <Icon name="lucide:trash-2" class="size-4" />
      </Button>
    </div>
    <Button variant="outline" size="sm" @click="add">
      + Add rule
    </Button>
  </div>
</template>
```

- [ ] **Task 20: AmenitiesSectionEditor.vue**

Fields: `items: string[]` — chip-style input. Reuse the multi-tag input pattern from `ListingSettingsTab.vue` (Popover with checklist of all amenities + custom add).

- [ ] **Task 21: WifiSectionEditor.vue**

Fields: `ssid`, `password`, `networkNotes`. Plus a Switch "show password by default".

- [ ] **Task 22: LocalTipsSectionEditor.vue**

Fields: `tips: { title, body, icon? }[]` — list editor with add/remove.

- [ ] **Task 23: DocumentsSectionEditor.vue**

Fields: `fileIds: string[]` — popover picker that reads from `Listing.documents` (via `useListings()` composable).

- [ ] **Task 24: UpsellsSectionEditor.vue**

Fields: `serviceIds: string[]` (multi-select from `useUpsellServices().services`), `heading`, `subheading`.

- [ ] **Task 25: SmartLockSectionEditor + PreArrivalSectionEditor + CheckoutSectionEditor + CustomRichSectionEditor**

Pattern: each follows the same `modelValue` + `update:modelValue` convention.

For **SmartLockSectionEditor**: fields `lockIds: string[]` (from `useSmartLock().locks` filtered by listing), `heading`, `codeWindowHours` (number, default 24).

For **PreArrivalSectionEditor**: fields `fields: PreArrivalField[]` — checkbox list of the 7 field types. Reorderable.

For **CustomRichSectionEditor**: field `html` (Textarea with markdown hint).

**Per editor, follow this exact task pattern:**

```bash
# For each editor:
git add app/components/guest-guides/editor/sections/<Name>SectionEditor.vue
git commit -m "feat(guest-guides): add <Name>SectionEditor

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 26: SectionEditor dispatcher

**Files:**
- Create: `app/components/guest-guides/editor/SectionEditor.vue`

- [ ] **Step 1: Create the dispatcher**

```vue
<!-- app/components/guest-guides/editor/SectionEditor.vue -->
<script setup lang="ts">
import type { GuideSection } from '../data/types'
import HeroSectionEditor from './sections/HeroSectionEditor.vue'
import WelcomeSectionEditor from './sections/WelcomeSectionEditor.vue'
import CheckinSectionEditor from './sections/CheckinSectionEditor.vue'
import CheckoutSectionEditor from './sections/CheckoutSectionEditor.vue'
import HouseRulesSectionEditor from './sections/HouseRulesSectionEditor.vue'
import AmenitiesSectionEditor from './sections/AmenitiesSectionEditor.vue'
import WifiSectionEditor from './sections/WifiSectionEditor.vue'
import LocalTipsSectionEditor from './sections/LocalTipsSectionEditor.vue'
import DocumentsSectionEditor from './sections/DocumentsSectionEditor.vue'
import UpsellsSectionEditor from './sections/UpsellsSectionEditor.vue'
import SmartLockSectionEditor from './sections/SmartLockSectionEditor.vue'
import PreArrivalSectionEditor from './sections/PreArrivalSectionEditor.vue'
import CustomRichSectionEditor from './sections/CustomRichSectionEditor.vue'

const props = defineProps<{ section: GuideSection }>()
const emit = defineEmits<{ 'update': [data: Record<string, any>] }>()

const editorMap = {
  hero: HeroSectionEditor,
  welcome: WelcomeSectionEditor,
  checkin: CheckinSectionEditor,
  checkout: CheckoutSectionEditor,
  house_rules: HouseRulesSectionEditor,
  amenities: AmenitiesSectionEditor,
  wifi: WifiSectionEditor,
  local_tips: LocalTipsSectionEditor,
  documents: DocumentsSectionEditor,
  upsells: UpsellsSectionEditor,
  smart_lock: SmartLockSectionEditor,
  pre_arrival: PreArrivalSectionEditor,
  custom_rich: CustomRichSectionEditor,
}
</script>

<template>
  <component
    :is="editorMap[section.type]"
    :model-value="section.data"
    @update:model-value="(v: Record<string, any>) => $emit('update', v)"
  />
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/guest-guides/editor/SectionEditor.vue
git commit -m "feat(guest-guides): section editor dispatcher

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 27: Template gallery

**Files:**
- Create: `app/components/guest-guides/templates/bali-villa.json`
- Create: `app/components/guest-guides/templates/mountain-retreat.json`
- Create: `app/components/guest-guides/templates/city-apartment.json`
- Create: `app/components/guest-guides/template-gallery/TemplateGallery.vue`
- Create: `app/components/guest-guides/template-gallery/TemplateCard.vue`
- Modify: `app/composables/useGuestGuides.ts` (add `useTemplates()` export)

- [ ] **Step 1: Create the bali-villa template JSON**

```json
// app/components/guest-guides/templates/bali-villa.json
{
  "id": "tpl-bali-villa",
  "name": "Bali Villa",
  "description": "Tropical welcome pack with local tips",
  "category": "tropical",
  "iconName": "palm-tree",
  "sections": [
    { "type": "hero", "order": 0, "enabled": true, "data": { "photoUrl": "", "title": "Welcome to Bali", "subtitle": "Your tropical escape awaits" } },
    { "type": "welcome", "order": 1, "enabled": true, "data": { "message": "Selamat datang! We're so excited to host you in our little slice of paradise. This guide has everything you need for a perfect stay." } },
    { "type": "pre_arrival", "order": 2, "enabled": true, "data": { "fields": ["arrival_time", "guests", "mobile", "requests"] } },
    { "type": "wifi", "order": 3, "enabled": true, "data": { "ssid": "", "password": "", "networkNotes": "5GHz available" } },
    { "type": "house_rules", "order": 4, "enabled": true, "data": { "rules": ["No smoking indoors", "No parties or events", "Quiet hours 10pm–8am", "Take shoes off at entrance"] } },
    { "type": "amenities", "order": 5, "enabled": true, "data": { "items": ["Pool", "WiFi", "Air conditioning", "Kitchen", "Washer", "Free parking", "TV"] } },
    { "type": "checkin", "order": 6, "enabled": true, "data": { "time": "14:00", "instructions": "Our staff will meet you at the gate. Look for the welcome sign with your name." } },
    { "type": "checkout", "order": 7, "enabled": true, "data": { "time": "11:00", "instructions": "Leave keys on the kitchen counter. Safe travels!" } },
    { "type": "local_tips", "order": 8, "enabled": true, "data": { "tips": [
      { "title": "Warung Bu Mi", "body": "Best nasi goreng in the area, 5 min walk", "icon": "utensils" },
      { "title": "Batu Bolong Beach", "body": "Beautiful sunset spot, 10 min drive", "icon": "sun" },
      { "title": "Kimia Farma Pharmacy", "body": "24h pharmacy, 8 min walk", "icon": "pill" }
    ]}},
    { "type": "upsells", "order": 9, "enabled": true, "data": { "serviceIds": [], "heading": "Enhance your stay", "subheading": "Add these popular services" } },
    { "type": "smart_lock", "order": 10, "enabled": true, "data": { "lockIds": [], "heading": "Your door code", "codeWindowHours": 24 } }
  ]
}
```

- [ ] **Step 2: Create the other two templates (similar shape, smaller)**

Same shape, fewer sections, mountain and urban copy. (See spec for details — fill in similar to above.)

- [ ] **Step 3: Add useTemplates export to useGuestGuides**

```ts
// In app/composables/useGuestGuides.ts, add:
import baliVilla from '~/components/guest-guides/templates/bali-villa.json'
import mountainRetreat from '~/components/guest-guides/templates/mountain-retreat.json'
import cityApartment from '~/components/guest-guides/templates/city-apartment.json'
import type { GuideTemplate } from '~/components/guest-guides/data/types'

const templates: GuideTemplate[] = [baliVilla, mountainRetreat, cityApartment]

function getTemplates(): GuideTemplate[] {
  return templates
}

function getTemplate(id: string): GuideTemplate | undefined {
  return templates.find(t => t.id === id)
}

function createGuideFromTemplate(templateId: string, title: string, defaultLanguage: string): GuestGuide | null {
  const template = getTemplate(templateId)
  if (!template) return null
  const now = new Date().toISOString()
  const newGuide: GuestGuide = {
    id: generateGuideId(),
    title,
    defaultLanguage,
    templateId,
    assignedListingIds: [],
    status: 'draft',
    sections: template.sections.map((s, idx) => ({
      ...s,
      id: generateSectionId(),
      order: idx,
    })),
    createdBy: 'staff-1',
    createdAt: now,
    updatedAt: now,
  }
  guides.value = [...guides.value, newGuide]
  return newGuide
}

return {
  guides,
  createGuide,
  createGuideFromTemplate,
  updateGuide,
  deleteGuide,
  setStatus,
  duplicateGuide,
  getTemplates,
  getTemplate,
}
```

- [ ] **Step 4: Create TemplateGallery**

```vue
<!-- app/components/guest-guides/template-gallery/TemplateGallery.vue -->
<script setup lang="ts">
import type { GuideTemplate } from '../data/types'
import TemplateCard from './TemplateCard.vue'

const { getTemplates, createGuideFromTemplate } = useGuestGuides()

const templates = getTemplates()

defineEmits<{ 'select': [templateId: string] }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <TemplateCard
      v-for="t in templates"
      :key="t.id"
      :template="t"
      @use="$emit('select', t.id)"
    />
    <button
      class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 hover:bg-muted"
      @click="$emit('select', '')"
    >
      <Icon name="lucide:edit" class="size-8 text-muted-foreground" />
      <span class="font-medium">Blank</span>
      <span class="text-xs text-muted-foreground">Start from scratch</span>
    </button>
  </div>
</template>
```

- [ ] **Step 5: Create TemplateCard**

```vue
<!-- app/components/guest-guides/template-gallery/TemplateCard.vue -->
<script setup lang="ts">
import type { GuideTemplate } from '../data/types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

defineProps<{ template: GuideTemplate }>()
defineEmits<{ use: [] }>()
</script>

<template>
  <Card>
    <CardHeader>
      <Icon :name="`lucide:${template.iconName}`" class="size-6 text-primary" />
      <CardTitle>{{ template.name }}</CardTitle>
      <CardDescription>{{ template.description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="mb-3 text-sm text-muted-foreground">
        {{ template.sections.length }} sections
      </div>
      <Button class="w-full" variant="outline" @click="$emit('use')">
        Use template
      </Button>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 6: Create the new-guide page**

Create `app/pages/guest-guides/new.vue`:

```vue
<!-- app/pages/guest-guides/new.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'vue-sonner'
import TemplateGallery from '~/components/guest-guides/template-gallery/TemplateGallery.vue'

const title = ref('Untitled Guide')
const language = ref('en')
const selectedTemplateId = ref<string | null>(null)

const { createGuide, createGuideFromTemplate } = useGuestGuides()

function handleTemplateSelect(templateId: string) {
  if (templateId === '') {
    // Blank
    selectedTemplateId.value = null
    return
  }
  selectedTemplateId.value = templateId
}

function handleCreate() {
  let guide
  if (selectedTemplateId.value) {
    guide = createGuideFromTemplate(selectedTemplateId.value, title.value, language.value)
  } else {
    guide = createGuide({ title: title.value, defaultLanguage: language.value })
  }
  if (guide) {
    toast.success('Guide created')
    navigateTo(`/guest-guides/${guide.id}`)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="mb-2 text-2xl font-bold tracking-tight">Create a Guest Guide</h1>
    <p class="mb-6 text-sm text-muted-foreground">Pick a template to get started fast, or start blank</p>

    <div class="mb-6 grid max-w-2xl gap-4">
      <div>
        <Label>Title</Label>
        <Input v-model="title" />
      </div>
      <div>
        <Label>Default language (your authoring language)</Label>
        <Input v-model="language" placeholder="en" />
      </div>
    </div>

    <h2 class="mb-3 text-lg font-semibold">Choose a template</h2>
    <TemplateGallery @select="handleTemplateSelect" />

    <div class="mt-6 flex justify-end gap-2">
      <Button variant="outline" @click="navigateTo('/guest-guides')">
        Cancel
      </Button>
      <Button :disabled="!title" @click="handleCreate">
        Create guide
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 7: Wire "+ Create Guide" in library page**

In `app/pages/guest-guides/index.vue`, change `handleCreate`:

```ts
function handleCreate() {
  navigateTo('/guest-guides/new')
}
```

- [ ] **Step 8: Verify in dev server**

Run: `npm run dev`, navigate to `/guest-guides/new`, pick "Bali Villa", click "Create guide"
Expected: New guide created, redirect to `/guest-guides/{new-id}` (editor page — not built yet, will 404 — that's OK for this task, the editor comes in Task 28)

- [ ] **Step 9: Commit**

```bash
git add app/components/guest-guides/templates/ app/components/guest-guides/template-gallery/ app/composables/useGuestGuides.ts app/pages/guest-guides/new.vue app/pages/guest-guides/index.vue
git commit -m "feat(guest-guides): template gallery + new guide flow

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 28: Guide editor page

**Files:**
- Create: `app/pages/guest-guides/[id]/index.vue`
- Create: `app/components/guest-guides/editor/GuideEditor.vue`

- [ ] **Step 1: Create GuideEditor component**

```vue
<!-- app/components/guest-guides/editor/GuideEditor.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GuideSection, GuideSectionType } from '../data/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { toast } from 'vue-sonner'
import SectionList from './SectionList.vue'
import SectionEditor from './SectionEditor.vue'
import AddSectionDialog from './AddSectionDialog.vue'
import { generateSectionId } from '~/utils/guest-guide-token'

const props = defineProps<{ guideId: string }>()

const { guides, updateGuide } = useGuestGuides()

const guide = computed(() => guides.value.find(g => g.id === props.guideId))

const selectedSectionId = ref<string | null>(null)
const addDialogOpen = ref(false)
const dirty = ref(false)

const selectedSection = computed(() => {
  if (!selectedSectionId.value) return null
  return guide.value?.sections.find(s => s.id === selectedSectionId.value) ?? null
})

function handleSectionsUpdate(newSections: GuideSection[]) {
  if (!guide.value) return
  updateGuide(guide.value.id, { sections: newSections })
  dirty.value = true
}

function handleSelect(id: string) {
  selectedSectionId.value = id
}

function handleAdd() {
  addDialogOpen.value = true
}

function handleAddSectionType(type: GuideSectionType) {
  if (!guide.value) return
  const newSection: GuideSection = {
    id: generateSectionId(),
    type,
    order: guide.value.sections.length,
    enabled: true,
    data: {},
  }
  handleSectionsUpdate([...guide.value.sections, newSection])
  selectedSectionId.value = newSection.id
  toast.success('Section added')
}

function handleDelete(id: string) {
  if (!guide.value) return
  handleSectionsUpdate(guide.value.sections.filter(s => s.id !== id))
  if (selectedSectionId.value === id) selectedSectionId.value = null
}

function handleSectionDataUpdate(data: Record<string, any>) {
  if (!selectedSection.value || !guide.value) return
  handleSectionsUpdate(
    guide.value.sections.map(s => (s.id === selectedSection.value!.id ? { ...s, data } : s)),
  )
}

function handleSave() {
  // updateGuide is called on every change; just mark clean
  dirty.value = false
  toast.success('Saved')
}

function handlePublish() {
  if (!guide.value) return
  updateGuide(guide.value.id, { status: 'active' })
  toast.success('Published — guide is now active')
}
</script>

<template>
  <div v-if="guide" class="flex h-full">
    <aside class="w-64 border-r p-4 overflow-y-auto">
      <h3 class="mb-3 text-sm font-medium text-muted-foreground">Sections</h3>
      <SectionList
        :model-value="guide.sections"
        :selected-id="selectedSectionId"
        @update:model-value="handleSectionsUpdate"
        @select="handleSelect"
        @add="handleAdd"
        @delete="handleDelete"
      />
    </aside>

    <main class="flex-1 overflow-y-auto p-6">
      <div v-if="selectedSection">
        <h2 class="mb-4 text-lg font-semibold capitalize">
          {{ selectedSection.type.replace('_', ' ') }}
        </h2>
        <SectionEditor
          :section="selectedSection"
          @update="handleSectionDataUpdate"
        />
      </div>
      <div v-else class="py-12 text-center text-muted-foreground">
        Select a section to edit, or add a new one.
      </div>
    </main>

    <div class="border-t p-4 flex justify-end gap-2">
      <Button variant="outline" @click="handleSave" :disabled="!dirty">
        Save
      </Button>
      <Button @click="handlePublish">
        Publish
      </Button>
    </div>

    <AddSectionDialog v-model:open="addDialogOpen" @select="handleAddSectionType" />
  </div>
  <div v-else class="p-12 text-center text-muted-foreground">
    Guide not found.
  </div>
</template>
```

- [ ] **Step 2: Create the editor page**

Create `app/pages/guest-guides/[id]/index.vue`:

```vue
<!-- app/pages/guest-guides/[id]/index.vue -->
<script setup lang="ts">
import GuideEditor from '~/components/guest-guides/editor/GuideEditor.vue'

const route = useRoute()
const guideId = computed(() => route.params.id as string)
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="flex items-center gap-2 border-b p-4 text-sm text-muted-foreground">
      <NuxtLink to="/guest-guides" class="hover:underline">
        Guest Guides
      </NuxtLink>
      <span>/</span>
      <span class="text-foreground">Editor</span>
    </div>
    <GuideEditor :guide-id="guideId" class="flex-1 overflow-hidden" />
  </div>
</template>
```

- [ ] **Step 3: Wire Edit button in library page**

In `app/pages/guest-guides/index.vue`:

```ts
function handleEdit(id: string) {
  navigateTo(`/guest-guides/${id}`)
}
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`, navigate to `/guest-guides`, click "Edit" on Bali Villa Welcome Guide
Expected: Editor opens with 2 sections in the sidebar. Click a section, edit it, click "Save".

- [ ] **Step 5: Commit**

```bash
git add app/components/guest-guides/editor/GuideEditor.vue app/pages/guest-guides/[id]/index.vue app/pages/guest-guides/index.vue
git commit -m "feat(guest-guides): guide editor page with section list + editors

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 29: Preview iframe page

**Files:**
- Create: `app/pages/guest-guides/[id]/preview.vue`

- [ ] **Step 1: Create the preview page**

```vue
<!-- app/pages/guest-guides/[id]/preview.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'vue-sonner'

const route = useRoute()
const guideId = computed(() => route.params.id as string)

const { guides } = useGuestGuides()
const { issueLink } = useGuestGuideLinks()
const { conversations } = useInbox()

const guide = computed(() => guides.value.find(g => g.id === guideId.value))

// Issue a throwaway preview link
const previewToken = ref<string | null>(null)

const previewUrl = computed(() => {
  if (!previewToken.value) return null
  return `http://localhost:3001/${previewToken.value}?preview=1`
})

function generatePreviewLink() {
  if (!guide.value) return
  // Use first conversation as preview reservation
  const firstConv = conversations.value[0]
  if (!firstConv) {
    toast.error('No conversations to use for preview')
    return
  }
  try {
    const link = issueLink({
      guideId: guide.value.id,
      reservationId: `preview-${Date.now()}`,
      listingId: firstConv.listingName ?? 'lst-1',
      guestName: 'Preview Guest',
      guestLanguage: 'en',
      channel: 'manual',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      metadata: { templateId: guide.value.templateId },
    })
    previewToken.value = link.token
    toast.success('Preview link generated')
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to generate preview link')
  }
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="flex items-center justify-between border-b p-4">
      <div class="text-sm text-muted-foreground">
        Preview: {{ guide?.title }}
      </div>
      <Button @click="generatePreviewLink">
        Generate preview link
      </Button>
    </div>
    <div class="flex-1 overflow-hidden bg-muted">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="h-full w-full bg-background"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
      <div v-else class="flex h-full items-center justify-center text-muted-foreground">
        Click "Generate preview link" to start
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Wire Preview button in library page**

```ts
function handlePreview(id: string) {
  navigateTo(`/guest-guides/${id}/preview`)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/pages/guest-guides/[id]/preview.vue app/pages/guest-guides/index.vue
git commit -m "feat(guest-guides): preview iframe page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 30: Phase 2 verification

- [ ] **Step 1: Run tests**

```bash
npx vitest run
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Manual end-to-end smoke test**

1. `/guest-guides` — see guides
2. Click "+ Create Guide" → template gallery
3. Pick Bali Villa, set title "Test Guide", click "Create guide"
4. Editor opens with 11 pre-populated sections
5. Click "Hero", edit the photo URL, click Save
6. Click "+ Add Section" → pick "Custom Content"
7. New section appears, edit it
8. Click "Publish" → status changes to "Active"
9. Navigate back to library — Test Guide now appears under "Active" tab

- [ ] **Step 4: Tag Phase 2**

```bash
git tag phase-2-editor-sections
git push --tags
```

---

# Phase 3 — Auto-Trigger

### Task 31: New `send_guest_guide` Journey step type

**Files:**
- Modify: `app/components/journeys/data/journeys.ts` (add new `ActionStep` actionType)
- Create: `app/components/journeys/actions/SendGuestGuideAction.vue`

- [ ] **Step 1: Add actionType to the union**

In `app/components/journeys/data/journeys.ts`, find the `ActionStep` type and add `'send_guest_guide'` to `actionType`:

```ts
actionType: 'create_task' | 'flag_reservation' | 'staff_alert' | 'raise_action_item' | 'send_guest_guide'
```

- [ ] **Step 2: Create the action handler component**

```vue
<!-- app/components/journeys/actions/SendGuestGuideAction.vue -->
<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'

defineProps<{ modelValue: Record<string, any> }>()
defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

const { getTemplates } = useGuestGuides()
const templates = getTemplates()
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Guide to send</Label>
      <Select
        :model-value="modelValue.guideId ?? ''"
        @update:model-value="$emit('update:modelValue', { ...modelValue, guideId: $event })"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a guide" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Channel</Label>
      <Select
        :model-value="modelValue.channel ?? 'whatsapp'"
        @update:model-value="$emit('update:modelValue', { ...modelValue, channel: $event })"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="manual">Manual only</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Expiry (hours from issue)</Label>
      <Input
        type="number"
        :model-value="modelValue.expiryHours ?? 168"
        @update:model-value="$emit('update:modelValue', { ...modelValue, expiryHours: Number($event) })"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Wire into JourneyStepSidebar**

Find `app/components/journeys/JourneyStepSidebar.vue`, find the section that dispatches `ActionStep` editors (likely a switch on `step.actionType`). Add a case:

```vue
<SendGuestGuideAction
  v-if="step.actionType === 'send_guest_guide'"
  :model-value="step.data ?? {}"
  @update:model-value="updateStep({ data: $event })"
/>
```

Don't forget to import the component at the top of `<script setup>`.

- [ ] **Step 4: Commit**

```bash
git add app/components/journeys/data/journeys.ts app/components/journeys/actions/SendGuestGuideAction.vue app/components/journeys/JourneyStepSidebar.vue
git commit -m "feat(journeys): add send_guest_guide action step type

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 32: Server endpoint for issuing links from Journey

**Files:**
- Create: `app/server/api/guest-guides/issue-from-journey.post.ts`

- [ ] **Step 1: Create the endpoint**

```ts
// app/server/api/guest-guides/issue-from-journey.post.ts
import type { GuestGuide, GuestGuideLink } from '~/components/guest-guides/data/types'
import { findGuide, findLinkByToken } from '~/server/utils/guest-guide-store'
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    guideId: string
    reservationId: string
    listingId: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    guestLanguage?: string
    channel: 'whatsapp' | 'email' | 'manual'
    expiresAt: string
    journeyId?: string
    templateId?: string
  }>(event)

  const guide = findGuide(body.guideId)
  if (!guide) {
    throw createError({ statusCode: 404, statusMessage: `Guide ${body.guideId} not found` })
  }

  const now = new Date().toISOString()
  const link: GuestGuideLink = {
    id: generateLinkId(),
    token: generateToken(),
    guideId: body.guideId,
    reservationId: body.reservationId,
    listingId: body.listingId,
    guestName: body.guestName,
    guestEmail: body.guestEmail,
    guestPhone: body.guestPhone,
    guestLanguage: body.guestLanguage,
    sentAt: now,
    expiresAt: body.expiresAt,
    status: 'pending',
    channel: body.channel,
    metadata: { journeyId: body.journeyId, templateId: body.templateId },
  }

  // Persist to mock store
  const { links } = useGuestGuideLinks()
  links.value = [...links.value, link]

  return {
    linkId: link.id,
    token: link.token,
    url: `https://guide.elev8-suite.com/${link.token}`,
  }
})
```

- [ ] **Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/guest-guides/issue-from-journey \
  -H "Content-Type: application/json" \
  -d '{
    "guideId": "gg-mock-001",
    "reservationId": "res-test-1",
    "listingId": "lst-1",
    "guestName": "Test User",
    "channel": "whatsapp",
    "expiresAt": "2026-07-15T00:00:00Z"
  }'
```

Expected: `{ "linkId": "ggl-...", "token": "...", "url": "https://guide.elev8-suite.com/..." }`

- [ ] **Step 3: Commit**

```bash
git add app/server/api/guest-guides/issue-from-journey.post.ts
git commit -m "feat(guest-guides): issue-from-journey API endpoint

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 33: 3 Marketplace Journey templates

**Files:**
- Modify: `app/components/journeys/data/journeys.ts` (add to `marketplaceTemplates`)

- [ ] **Step 1: Add the templates**

Append to `marketplaceTemplates`:

```ts
{
  id: 'mkt-send-guide-on-booking',
  name: 'Booking Confirmed — Send Guide',
  description: 'Auto-send guest guide link immediately after a new booking',
  category: 'guest_communication',
  steps: [
    {
      id: 'step-1',
      type: 'trigger',
      data: { triggerType: 'new_booking' },
      order: 0,
    },
    {
      id: 'step-2',
      type: 'if_else',
      data: { conditionType: 'reservation_status', value: 'confirmed' },
      order: 1,
    },
    {
      id: 'step-3',
      type: 'action',
      data: { actionType: 'send_guest_guide', guideId: 'gg-mock-001', channel: 'whatsapp', expiryHours: 168 },
      order: 2,
    },
    {
      id: 'step-4',
      type: 'wait',
      data: { delayMinutes: 5 },
      order: 3,
    },
    {
      id: 'step-5',
      type: 'message',
      data: { channel: 'whatsapp', templateId: 'booking_confirmation_with_guide' },
      order: 4,
    },
  ],
},
{
  id: 'mkt-guide-reminder-7d',
  name: 'Pre-Arrival Reminder — 7 days',
  description: 'Send guide reminder 7 days before check-in',
  category: 'guest_communication',
  steps: [
    { id: 's1', type: 'trigger', data: { triggerType: 'send_once', offsetAmount: 7, offsetUnit: 'days', offsetDirection: 'before', referenceEvent: 'checkin' }, order: 0 },
    { id: 's2', type: 'message', data: { channel: 'whatsapp', templateId: 'checkin_instructions' }, order: 1 },
  ],
},
{
  id: 'mkt-guide-reminder-24h',
  name: 'Pre-Arrival Reminder — 24h',
  description: 'Send guide reminder 24 hours before check-in',
  category: 'guest_communication',
  steps: [
    { id: 's1', type: 'trigger', data: { triggerType: 'send_once', offsetAmount: 24, offsetUnit: 'hours', offsetDirection: 'before', referenceEvent: 'checkin' }, order: 0 },
    { id: 's2', type: 'message', data: { channel: 'whatsapp', templateId: 'checkin_instructions' }, order: 1 },
  ],
},
```

- [ ] **Step 2: Add a new WhatsApp template for guide delivery**

In `app/composables/useWhatsAppTemplates.ts`, add to `waTemplates`:

```ts
{
  id: 'booking_confirmation_with_guide',
  body: 'Hi {{guest_name}}, your stay at {{property_name}} from {{check_in_date}} to {{check_out_date}} is confirmed! Please complete your pre-arrival info here: {{guide_link}}',
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/journeys/data/journeys.ts app/composables/useWhatsAppTemplates.ts
git commit -m "feat(journeys): add 3 marketplace templates for guest guide delivery

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 34: Notification type for "guide not sent"

**Files:**
- Modify: `app/components/notifications/data/alerts.ts`

- [ ] **Step 1: Add new alert type**

```ts
// Add to AlertType union:
export type AlertType =
  | ...existing...
  | 'GUEST_GUIDE_NOT_SENT'
  | 'GUEST_GUIDE_OPENED'
  | 'GUEST_GUIDE_SUBMITTED'

// Add to alertDisplayLabels:
GUEST_GUIDE_NOT_SENT: 'Guest guide not sent',
GUEST_GUIDE_OPENED: 'Guest opened guide',
GUEST_GUIDE_SUBMITTED: 'Guest submitted form',

// Add to alertRouteMap:
GUEST_GUIDE_NOT_SENT: '/guest-guides',
GUEST_GUIDE_OPENED: '/guest-guides',
GUEST_GUIDE_SUBMITTED: '/guest-guides',
```

- [ ] **Step 2: Wire into JourneyStepSidebar**

When a `send_guest_guide` action runs and no guide is assigned to the listing, fire the alert. (Add this logic in the Journey execution path — Task 35.)

- [ ] **Step 3: Commit**

```bash
git add app/components/notifications/data/alerts.ts
git commit -m "feat(notifications): add guest guide alert types

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 35: Phase 3 verification

- [ ] **Step 1: Manual smoke test**

1. Navigate to `/journeys`, click "Marketplace"
2. Find "Booking Confirmed — Send Guide", click "Install"
3. Edit the journey: pick a guide, set channel = WhatsApp
4. Activate the journey
5. Create a mock reservation (modify conversations.ts to add one with `status: 'future'`)
6. Manually fire the trigger via dev console:
   ```js
   $fetch('/api/guest-guides/issue-from-journey', {
     method: 'POST',
     body: {
       guideId: 'gg-mock-001',
       reservationId: 'res-test-future',
       listingId: 'lst-1',
       guestName: 'Future Guest',
       channel: 'whatsapp',
       expiresAt: '2026-08-01T00:00:00Z',
     },
   })
   ```
7. Navigate to `/guest-guides/gg-mock-001/links` — see the new link

- [ ] **Step 2: Tag Phase 3**

```bash
git tag phase-3-auto-trigger
git push --tags
```

---

# Phase 4 — Forms + Live Data

> Phase 4 is the largest phase. It covers the public page's interactive features (forms, upsells, smart lock codes) and the corresponding monitoring on the dashboard side.

### Task 36: Public app section components

**Files:**
- Create: `guide-app/app/components/sections/HeroSection.vue`
- Create: `guide-app/app/components/sections/WelcomeSection.vue`
- Create: `guide-app/app/components/sections/CheckinSection.vue`
- Create: `guide-app/app/components/sections/CheckoutSection.vue`
- Create: `guide-app/app/components/sections/HouseRulesSection.vue`
- Create: `guide-app/app/components/sections/AmenitiesSection.vue`
- Create: `guide-app/app/components/sections/WifiSection.vue`
- Create: `guide-app/app/components/sections/LocalTipsSection.vue`
- Create: `guide-app/app/components/sections/DocumentsSection.vue`
- Create: `guide-app/app/components/sections/UpsellsSection.vue`
- Create: `guide-app/app/components/sections/SmartLockSection.vue`
- Create: `guide-app/app/components/sections/PreArrivalSection.vue`
- Create: `guide-app/app/components/sections/CustomRichSection.vue`

> Each section component is a small Vue component that receives `data` (from the section's data payload) and renders the guest-facing view. Use translation via the `useAutoTranslate` composable (Task 37).

Example for `HeroSection.vue`:

```vue
<!-- guide-app/app/components/sections/HeroSection.vue -->
<script setup lang="ts">
defineProps<{ data: Record<string, any> }>()
const { translate } = useAutoTranslate()

const title = computed(() => translate(data.title ?? '', 'en'))
const subtitle = computed(() => translate(data.subtitle ?? '', 'en'))
</script>

<template>
  <section class="relative h-64 overflow-hidden rounded-lg">
    <img v-if="data.photoUrl" :src="data.photoUrl" class="absolute inset-0 h-full w-full object-cover" alt="">
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-lg opacity-90">{{ subtitle }}</p>
    </div>
  </section>
</template>
```

Create the other 12 components following the same pattern. For each:
- Receive `data` prop
- Use `translate()` for any user-facing strings
- Use appropriate shadcn-vue / native HTML elements
- Mobile-first responsive

- [ ] **Step 1: Create all 13 section components**

- [ ] **Step 2: Commit per component or batch**

```bash
git add guide-app/app/components/sections/
git commit -m "feat(guest-guides): public app section renderers

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 37: useAutoTranslate composable (public app)

**Files:**
- Create: `guide-app/app/composables/useAutoTranslate.ts`

- [ ] **Step 1: Create the composable**

```ts
// guide-app/app/composables/useAutoTranslate.ts
import { ref } from 'vue'

const cache = new Map<string, string>()

export function useAutoTranslate() {
  const pending = ref(false)

  async function translate(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'en') return text
    const key = `${targetLang}:${text}`
    if (cache.has(key)) return cache.get(key)!
    // Phase 1 mock — just returns the original text
    // Phase 5: replace with real translation API call
    cache.set(key, text)
    return text
  }

  return { translate, pending }
}
```

- [ ] **Step 2: Commit**

```bash
git add guide-app/app/composables/useAutoTranslate.ts
git commit -m "feat(guest-guide-app): add useAutoTranslate composable

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 38: PreArrivalForm component

**Files:**
- Create: `guide-app/app/components/forms/PreArrivalForm.vue`

- [ ] **Step 1: Create the form**

```vue
<!-- guide-app/app/components/forms/PreArrivalForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/../app/components/ui/button'
import { Input } from '~/../app/components/ui/input'
import { Textarea } from '~/../app/components/ui/textarea'
import { Label } from '~/../app/components/ui/label'
import { toast } from 'vue-sonner'
import type { PreArrivalField } from '~/../app/components/guest-guides/data/types'

const props = defineProps<{
  token: string
  fields: PreArrivalField[]
}>()

const { submitForm } = usePublicGuestGuide()

const arrivalTime = ref('')
const guests = ref<number | null>(null)
const mobile = ref('')
const idType = ref<'passport' | 'ktp' | 'driver_license' | ''>('')
const idNumber = ref('')
const requests = ref('')

const submitting = ref(false)

const visibleFields = computed(() => new Set(props.fields))

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload: Record<string, any> = {}
    if (visibleFields.value.has('arrival_time')) payload.arrivalTime = arrivalTime.value
    if (visibleFields.value.has('guests')) payload.guests = guests.value
    if (visibleFields.value.has('mobile')) payload.mobile = mobile.value
    if (visibleFields.value.has('id_type')) payload.idType = idType.value
    if (visibleFields.value.has('id_number')) payload.idNumber = idNumber.value
    if (visibleFields.value.has('requests')) payload.requests = requests.value

    await submitForm(props.token, payload)
    toast.success('Thanks! Your host has been notified.')
  } catch (err) {
    toast.error('Failed to submit. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div v-if="visibleFields.has('arrival_time')">
      <Label>Expected arrival time</Label>
      <Input v-model="arrivalTime" type="time" />
    </div>
    <div v-if="visibleFields.has('guests')">
      <Label>Number of guests</Label>
      <Input v-model.number="guests" type="number" min="1" max="20" />
    </div>
    <div v-if="visibleFields.has('mobile')">
      <Label>Mobile number (confirm)</Label>
      <Input v-model="mobile" type="tel" placeholder="+62 ..." />
    </div>
    <div v-if="visibleFields.has('id_type')">
      <Label>ID type</Label>
      <select v-model="idType" class="w-full rounded-md border bg-background px-3 py-2 text-sm">
        <option value="">Select...</option>
        <option value="passport">Passport</option>
        <option value="ktp">KTP (Indonesian ID)</option>
        <option value="driver_license">Driver's license</option>
      </select>
    </div>
    <div v-if="visibleFields.has('id_number')">
      <Label>ID number</Label>
      <Input v-model="idNumber" />
    </div>
    <div v-if="visibleFields.has('requests')">
      <Label>Special requests</Label>
      <Textarea v-model="requests" rows="3" placeholder="Anything we should know?" />
    </div>
    <Button type="submit" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Complete pre-arrival info' }}
    </Button>
  </form>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add guide-app/app/components/forms/PreArrivalForm.vue
git commit -m "feat(guest-guide-app): pre-arrival form component

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Tasks 39-42: Other forms (ID verification, upsells, smart lock)

> **Pattern:** Each form is a small Vue component. Reuse the same TDD/component structure as Task 38.

- [ ] **Task 39: IdVerificationForm.vue** — separate form for ID upload (Phase 1: text only, Phase 5: photo upload)

- [ ] **Task 40: UpsellCard.vue** — single upsell card with "Add to stay" button. Calls existing `useUpsellOrders.addOrder()`. Shows confirmation toast on success.

- [ ] **Task 41: SmartLockPanel.vue** — fetches codes via `useSmartLock`. Only renders when `now >= checkIn - codeWindowHours`. Logs view via `logLockView()` on mount.

- [ ] **Task 42: LanguageSwitcher.vue** — dropdown of available languages. Sets a shared `currentLang` ref that all sections read from `useAutoTranslate`.

Commit each as a separate task.

```bash
git add guide-app/app/components/forms/<FormName>.vue
git commit -m "feat(guest-guide-app): <form-name> component

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 43: Submit endpoint (saves GuideSubmission)

**Files:**
- Create: `app/server/api/guest-guides/by-token/[token]/submit.post.ts`
- Modify: `app/server/utils/guest-guide-store.ts`

- [ ] **Step 1: Add `saveSubmission` is already exported from store. Add to store: listSubmissionsForLink**

(Already added in Task 12, just verify.)

- [ ] **Step 2: Create the submit endpoint**

```ts
// app/server/api/guest-guides/by-token/[token]/submit.post.ts
import { findLinkByToken, saveSubmission, getSubmissionForLink } from '~/server/utils/guest-guide-store'
import { generateId } from '~/utils/guest-guide-token' // add generateId export

interface SubmissionBody {
  arrivalTime?: string
  guests?: number
  mobile?: string
  idType?: string
  idNumber?: string
  requests?: string
  upsellsAdded?: { serviceId: string; qty: number }[]
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400 })

  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404 })
  if (link.status === 'revoked') throw createError({ statusCode: 410 })
  if (new Date(link.expiresAt) < new Date()) throw createError({ statusCode: 410 })

  const body = await readBody<SubmissionBody>(event)

  const submission = {
    id: generateId('sub'),
    linkId: link.id,
    submittedAt: new Date().toISOString(),
    arrivalTime: body.arrivalTime,
    guests: body.guests,
    mobile: body.mobile,
    idType: body.idType as any,
    idNumber: body.idNumber,
    requests: body.requests,
    upsellsAdded: body.upsellsAdded,
  }

  saveSubmission(submission)
  return { ok: true }
})
```

Add `generateId(prefix)` to `app/utils/guest-guide-token.ts`:

```ts
export function generateId(prefix: string): string {
  return `${prefix}-${nanoid(12)}`
}
```

- [ ] **Step 3: Test with curl**

```bash
curl -X POST http://localhost:3000/api/guest-guides/by-token/abc123def456/submit \
  -H "Content-Type: application/json" \
  -d '{"arrivalTime": "14:30", "guests": 2, "mobile": "+49123", "requests": "Late checkin please"}'
```

Expected: `{ "ok": true }`

- [ ] **Step 4: Commit**

```bash
git add app/server/api/guest-guides/by-token/[token]/submit.post.ts app/server/utils/guest-guide-token.ts
git commit -m "feat(guest-guides): form submission endpoint

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Tasks 44-46: Wire all forms into the public page

**Files:**
- Modify: `guide-app/app/pages/[token].vue`

- [ ] **Step 1: Replace placeholder with full section renderer**

```vue
<!-- guide-app/app/pages/[token].vue -->
<script setup lang="ts">
import HeroSection from '~/components/sections/HeroSection.vue'
import WelcomeSection from '~/components/sections/WelcomeSection.vue'
// ... import all 13 section components

const route = useRoute()
const token = computed(() => route.params.token as string)
const { fetchGuide, markOpened } = usePublicGuestGuide()

const { data, pending, error } = await useAsyncData(
  `guide-${token.value}`,
  async () => {
    const result = await fetchGuide(token.value)
    await markOpened(token.value)
    return result
  },
)

const currentLang = ref(data.value?.link.guestLanguage ?? 'en')
</script>

<template>
  <div class="mx-auto max-w-3xl p-6">
    <div v-if="pending" class="py-12 text-center text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="py-12 text-center">
      <h1 class="text-xl font-semibold">We couldn't find your guide</h1>
      <p class="mt-2 text-sm text-muted-foreground">Please check the link or contact your host.</p>
    </div>
    <div v-else-if="data" class="space-y-8">
      <div v-for="section in data.guide.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order)" :key="section.id">
        <component
          :is="resolveSection(section.type)"
          :data="section.data"
          :token="token"
        />
      </div>
    </div>
  </div>
</template>
```

Add the `resolveSection` helper:

```ts
function resolveSection(type: string) {
  return {
    hero: HeroSection,
    welcome: WelcomeSection,
    checkin: CheckinSection,
    checkout: CheckoutSection,
    house_rules: HouseRulesSection,
    amenities: AmenitiesSection,
    wifi: WifiSection,
    local_tips: LocalTipsSection,
    documents: DocumentsSection,
    upsells: UpsellsSection,
    smart_lock: SmartLockSection,
    pre_arrival: PreArrivalSection,
    custom_rich: CustomRichSection,
  }[type]
}
```

- [ ] **Step 2: Add LanguageSwitcher to the page header**

```vue
<div class="flex justify-end mb-4">
  <LanguageSwitcher v-model="currentLang" />
</div>
```

- [ ] **Step 3: Verify in browser**

Run dev servers:
```bash
# Terminal 1
cd /Users/juli/Documents/ELEV8-DASHBOARD/Dashboard && npm run dev

# Terminal 2
cd /Users/juli/Documents/ELEV8-DASHBOARD/Dashboard/guide-app && npm run dev
```

In browser:
1. Open `http://localhost:3000/guest-guides/gg-mock-001/links`
2. Generate a new link for a reservation (or copy the seeded token `abc123def456`)
3. Open `http://localhost:3001/abc123def456` (or your generated token)
4. See the public guide page with all sections rendered
5. Submit the pre-arrival form, see the success toast
6. Navigate back to dashboard, refresh the links page, see `status: submitted`

- [ ] **Step 4: Commit**

```bash
git add guide-app/app/pages/[token].vue
git commit -m "feat(guest-guide-app): wire all sections + language switcher

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 47: Submissions monitoring drawer

**Files:**
- Modify: `app/components/guest-guides/links/LinkDetailDrawer.vue` (create new)

- [ ] **Step 1: Create the drawer**

```vue
<!-- app/components/guest-guides/links/LinkDetailDrawer.vue -->
<script setup lang="ts">
import type { GuestGuideLink, GuideSubmission } from '../data/types'
import { Button } from '~/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '~/components/ui/sheet'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  open: boolean
  link: GuestGuideLink | null
  submission: GuideSubmission | null
}>()

defineEmits<{ 'update:open': [v: boolean] }>()

function formatDate(iso?: string): string {
  return iso ? new Date(iso).toLocaleString() : '—'
}

function maskIdNumber(num?: string): string {
  if (!num || num.length < 4) return num ?? '—'
  return `****${num.slice(-4)}`
}
</script>

<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader v-if="link">
        <SheetTitle>{{ link.guestName }}</SheetTitle>
        <SheetDescription>
          <Badge>{{ link.status }}</Badge>
          <span class="ml-2 text-xs">{{ formatDate(link.sentAt) }}</span>
        </SheetDescription>
      </SheetHeader>

      <div v-if="link" class="mt-6 space-y-6">
        <div>
          <h3 class="mb-2 text-sm font-medium text-muted-foreground">Link</h3>
          <div class="rounded-md bg-muted p-2 font-mono text-xs break-all">
            https://guide.elev8-suite.com/{{ link.token }}
          </div>
        </div>

        <div v-if="submission" class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground">Submitted data</h3>
          <dl class="space-y-2 text-sm">
            <div v-if="submission.arrivalTime">
              <dt class="text-muted-foreground">Arrival time</dt>
              <dd>{{ formatDate(submission.arrivalTime) }}</dd>
            </div>
            <div v-if="submission.guests != null">
              <dt class="text-muted-foreground">Guests</dt>
              <dd>{{ submission.guests }}</dd>
            </div>
            <div v-if="submission.mobile">
              <dt class="text-muted-foreground">Mobile</dt>
              <dd>{{ submission.mobile }}</dd>
            </div>
            <div v-if="submission.idType">
              <dt class="text-muted-foreground">ID type</dt>
              <dd>{{ submission.idType }}</dd>
            </div>
            <div v-if="submission.idNumber">
              <dt class="text-muted-foreground">ID number</dt>
              <dd class="font-mono">{{ maskIdNumber(submission.idNumber) }}</dd>
            </div>
            <div v-if="submission.requests">
              <dt class="text-muted-foreground">Requests</dt>
              <dd>{{ submission.requests }}</dd>
            </div>
            <div v-if="submission.upsellsAdded && submission.upsellsAdded.length > 0">
              <dt class="text-muted-foreground">Upsells added</dt>
              <dd>
                <ul class="list-disc pl-4">
                  <li v-for="u in submission.upsellsAdded" :key="u.serviceId">
                    Service {{ u.serviceId }} × {{ u.qty }}
                  </li>
                </ul>
              </dd>
            </div>
            <div v-if="submission.smartLockViewedAt">
              <dt class="text-muted-foreground">Smart lock viewed</dt>
              <dd>{{ formatDate(submission.smartLockViewedAt) }}</dd>
            </div>
          </dl>
        </div>
        <div v-else class="text-sm text-muted-foreground">
          No submission yet.
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
```

- [ ] **Step 2: Wire into links page**

In `app/pages/guest-guides/[id]/links.vue`, add row-click → opens drawer.

Add state:

```ts
const drawerOpen = ref(false)
const selectedLink = ref<GuestGuideLink | null>(null)
const selectedSubmission = ref<GuideSubmission | null>(null)

const { getSubmissionForLink } = useGuestGuideSubmissions()  // new composable, see Task 48

function openLink(link: GuestGuideLink) {
  selectedLink.value = link
  selectedSubmission.value = getSubmissionForLink(link.id)
  drawerOpen.value = true
}
```

Make rows clickable:

```vue
<TableRow v-for="link in filteredLinks" :key="link.id" class="cursor-pointer" @click="openLink(link)">
```

Add drawer at end of template:

```vue
<LinkDetailDrawer v-model:open="drawerOpen" :link="selectedLink" :submission="selectedSubmission" />
```

- [ ] **Step 3: Commit**

```bash
git add app/components/guest-guides/links/LinkDetailDrawer.vue app/pages/guest-guides/[id]/links.vue
git commit -m "feat(guest-guides): submissions monitoring drawer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 48: useGuestGuideSubmissions composable + server endpoint

**Files:**
- Create: `app/composables/useGuestGuideSubmissions.ts`
- Create: `app/server/api/guest-guides/by-token/[token]/submission.get.ts`

- [ ] **Step 1: Create composable**

```ts
// app/composables/useGuestGuideSubmissions.ts
import type { GuideSubmission } from '~/components/guest-guides/data/types'

export function useGuestGuideSubmissions() {
  const submissions = useState<GuideSubmission[]>('guest-guide-submissions', () => [])

  function addSubmission(s: GuideSubmission): void {
    submissions.value = [...submissions.value.filter(x => x.linkId !== s.linkId), s]
  }

  function getSubmissionForLink(linkId: string): GuideSubmission | null {
    return submissions.value.find(s => s.linkId === linkId) ?? null
  }

  return { submissions, addSubmission, getSubmissionForLink }
}
```

- [ ] **Step 2: Server endpoint to fetch a submission**

```ts
// app/server/api/guest-guides/by-token/[token]/submission.get.ts
import { findLinkByToken, getSubmissionForLink } from '~/server/utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400 })
  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404 })
  const submission = getSubmissionForLink(link.id)
  return { submission: submission ?? null }
})
```

- [ ] **Step 3: Commit**

```bash
git add app/composables/useGuestGuideSubmissions.ts app/server/api/guest-guides/by-token/[token]/submission.get.ts
git commit -m "feat(guest-guides): submissions composable + read endpoint

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 49: Reservation panel "Guest Guide" tab

**Files:**
- Create: `app/components/inbox/ReservationGuestGuide.vue`
- Modify: `app/components/inbox/ReservationPanel.vue`

- [ ] **Step 1: Create the tab component**

```vue
<!-- app/components/inbox/ReservationGuestGuide.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { toast } from 'vue-sonner'
import { SendLinkDialog } from '#components'

const props = defineProps<{ reservationId: string }>()

const { guides } = useGuestGuides()
const { links, issueLink, revokeLink, findByReservation } = useGuestGuideLinks()
const { getSubmissionForLink } = useGuestGuideSubmissions()

const link = computed(() => findByReservation(props.reservationId))
const guide = computed(() => link.value ? guides.value.find(g => g.id === link.value!.guideId) : null)
const submission = computed(() => link.value ? getSubmissionForLink(link.value.id) : null)
const sendDialogOpen = ref(false)

function handleRevoke() {
  if (!link.value) return
  revokeLink(link.value.id)
  toast.success('Guide link revoked')
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="link && guide">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-medium">{{ guide.title }}</h3>
          <Badge class="mt-1">{{ link.status }}</Badge>
        </div>
        <Button variant="outline" size="sm" @click="handleRevoke" v-if="link.status !== 'revoked'">
          Revoke
        </Button>
      </div>
      <div class="mt-3 rounded-md bg-muted p-2 font-mono text-xs break-all">
        https://guide.elev8-suite.com/{{ link.token }}
      </div>
      <div v-if="submission" class="mt-4 space-y-2 text-sm">
        <h4 class="font-medium">Submitted</h4>
        <div v-if="submission.arrivalTime">Arrival: {{ new Date(submission.arrivalTime).toLocaleString() }}</div>
        <div v-if="submission.guests">Guests: {{ submission.guests }}</div>
        <div v-if="submission.requests">Requests: {{ submission.requests }}</div>
      </div>
    </div>
    <div v-else>
      <Button @click="sendDialogOpen = true">Send Guide Link</Button>
    </div>

    <SendLinkDialog
      v-if="sendDialogOpen"
      v-model:open="sendDialogOpen"
      :guide-id="guides[0]?.id ?? ''"
    />
  </div>
</template>
```

- [ ] **Step 2: Wire the tab into ReservationPanel**

Find `app/components/inbox/ReservationPanel.vue`. In the `<Tabs>` list (where Upsell, Smart Lock tabs live), add a new tab:

```vue
<TabsTrigger value="guest-guide">
  <Icon name="lucide:book-open" class="mr-1 size-3.5" />
  Guest Guide
</TabsTrigger>
```

In `<TabsContent>`, add:

```vue
<TabsContent value="guest-guide">
  <ReservationGuestGuide :reservation-id="reservation.id" />
</TabsContent>
```

(Use `effectiveReservation.id` if that's the pattern in your version of the file — see CLAUDE.md "Inbox reservation ID fix".)

- [ ] **Step 3: Commit**

```bash
git add app/components/inbox/ReservationGuestGuide.vue app/components/inbox/ReservationPanel.vue
git commit -m "feat(inbox): add Guest Guide tab to reservation panel

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 50: Listing Settings card

**Files:**
- Modify: `app/components/listings/ListingSettingsTab.vue`

- [ ] **Step 1: Add the card after Distribution Channels**

Find the Smart Locks card (added recently). Add a Guest Guide card right after it:

```vue
<Card>
  <CardHeader class="flex flex-row items-center justify-between">
    <div>
      <CardTitle>Guest Guide</CardTitle>
      <CardDescription>Welcome page auto-sent to guests on booking</CardDescription>
    </div>
    <NuxtLink :to="`/guest-guides?listing=${listing.id}`">
      <Button variant="outline" size="sm">Manage guides</Button>
    </NuxtLink>
  </CardHeader>
  <CardContent>
    <div v-if="assignedGuide" class="flex items-center justify-between">
      <div>
        <div class="font-medium">{{ assignedGuide.title }}</div>
        <GuideStatusBadge :status="assignedGuide.status" />
      </div>
      <div class="flex gap-2">
        <NuxtLink :to="`/guest-guides/${assignedGuide.id}`">
          <Button variant="outline" size="sm">Edit</Button>
        </NuxtLink>
        <NuxtLink :to="`/guest-guides/${assignedGuide.id}/preview`">
          <Button variant="outline" size="sm">Preview</Button>
        </NuxtLink>
      </div>
    </div>
    <div v-else class="text-sm text-muted-foreground">
      No guide assigned. <NuxtLink to="/guest-guides/new" class="underline">Create one</NuxtLink> or assign an existing guide.
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 2: Compute `assignedGuide`**

In `<script setup>`:

```ts
const { guides } = useGuestGuides()
const assignedGuide = computed(() =>
  guides.value.find(g => g.assignedListingIds.includes(props.listing.id)),
)
```

(Adjust `props.listing.id` to match how the listing object is passed in your file.)

- [ ] **Step 3: Commit**

```bash
git add app/components/listings/ListingSettingsTab.vue
git commit -m "feat(listings): add Guest Guide card to listing settings

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 51: Phase 4 verification

- [ ] **Step 1: Manual end-to-end smoke test**

1. Dashboard `/guest-guides` — guides show
2. `/guest-guides/gg-mock-001/links` — see issued links
3. Click a link row → drawer shows submitted data (or empty if pending)
4. Open public app at `http://localhost:3001/{token}`
5. See all sections rendered
6. Submit pre-arrival form → success toast
7. Refresh links page → submission visible in drawer
8. Open Inbox → click a conversation → see "Guest Guide" tab
9. Listing Settings → see Guest Guide card

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Tag Phase 4**

```bash
git tag phase-4-forms-live-data
git push --tags
```

---

# Phase 5 — Polish

> Phase 5 covers the deferred features from the spec. Each is a self-contained task. Stop after any task if scope needs to shrink.

### Task 52: ID photo upload pipeline

**Files:**
- Create: `app/server/api/guest-guides/by-token/[token]/upload-id-photo.post.ts`
- Create: `guide-app/app/components/forms/IdVerificationForm.vue` (full version)
- Install: `multer` or similar multipart handler (or use Nuxt 4 native `$fetch` with FormData)

- [ ] **Step 1: Server upload endpoint (mock — saves to /tmp)**

```ts
// app/server/api/guest-guides/by-token/[token]/upload-id-photo.post.ts
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400 })

  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, statusMessage: 'No file' })

  const file = formData.find(f => f.name === 'photo')
  if (!file) throw createError({ statusCode: 400, statusMessage: 'photo field required' })

  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 5MB)' })
  }

  const dir = join(process.cwd(), 'public', 'uploads', 'guest-id')
  await mkdir(dir, { recursive: true })
  const filename = `${token}-${Date.now()}.jpg`
  await writeFile(join(dir, filename), file.data)

  return {
    url: `/uploads/guest-id/${filename}`,
  }
})
```

- [ ] **Step 2: IdVerificationForm component (with photo upload)**

```vue
<!-- guide-app/app/components/forms/IdVerificationForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/../app/components/ui/button'
import { Input } from '~/../app/components/ui/input'
import { Label } from '~/../app/components/ui/label'
import { toast } from 'vue-sonner'

const props = defineProps<{ token: string }>()

const idType = ref<'passport' | 'ktp' | 'driver_license' | ''>('')
const idNumber = ref('')
const photoFile = ref<File | null>(null)
const submitting = ref(false)

const config = useRuntimeConfig()

async function handleSubmit() {
  if (!idType.value || !idNumber.value) {
    toast.error('Please fill in ID type and number')
    return
  }
  submitting.value = true
  try {
    if (photoFile.value) {
      const formData = new FormData()
      formData.append('photo', photoFile.value)
      await $fetch(`${config.public.apiBaseUrl}/api/guest-guides/by-token/${props.token}/upload-id-photo`, {
        method: 'POST',
        body: formData,
      })
    }
    await $fetch(`${config.public.apiBaseUrl}/api/guest-guides/by-token/${props.token}/submit-id`, {
      method: 'POST',
      body: { idType: idType.value, idNumber: idNumber.value },
    })
    toast.success('ID submitted')
  } catch {
    toast.error('Failed to submit ID')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <Label>ID type</Label>
      <select v-model="idType" class="w-full rounded-md border bg-background px-3 py-2 text-sm">
        <option value="">Select...</option>
        <option value="passport">Passport</option>
        <option value="ktp">KTP</option>
        <option value="driver_license">Driver's license</option>
      </select>
    </div>
    <div>
      <Label>ID number</Label>
      <Input v-model="idNumber" />
    </div>
    <div>
      <Label>Photo of ID (optional)</Label>
      <input type="file" accept="image/*" @change="(e) => photoFile = (e.target as HTMLInputElement).files?.[0] ?? null" />
    </div>
    <Button type="submit" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Submit ID' }}
    </Button>
  </form>
</template>
```

- [ ] **Step 3: Submit ID endpoint**

```ts
// app/server/api/guest-guides/by-token/[token]/submit-id.post.ts
import { findLinkByToken, saveSubmission } from '~/server/utils/guest-guide-store'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400 })
  const link = findLinkByToken(token)
  if (!link) throw createError({ statusCode: 404 })

  const body = await readBody<{ idType: string; idNumber: string }>(event)
  const submission = {
    id: `sub-${Date.now()}`,
    linkId: link.id,
    submittedAt: new Date().toISOString(),
    idType: body.idType as any,
    idNumber: body.idNumber,
  }
  saveSubmission(submission)
  return { ok: true }
})
```

- [ ] **Step 4: Commit**

```bash
git add app/server/api/guest-guides/by-token/[token]/upload-id-photo.post.ts app/server/api/guest-guides/by-token/[token]/submit-id.post.ts guide-app/app/components/forms/IdVerificationForm.vue
git commit -m "feat(guest-guides): ID photo upload + ID submission

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 53: Email channel (SMTP via SendGrid mock)

**Files:**
- Create: `app/server/api/guest-guides/send-email.post.ts`

> Phase 5 mock: log the email payload instead of actually sending. Real SendGrid integration in a future task.

- [ ] **Step 1: Create mock email endpoint**

```ts
// app/server/api/guest-guides/send-email.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    to: string
    subject: string
    body: string
    link: string
  }>(event)

  // Phase 5: actually send via SendGrid
  // For now, just log
  console.log('[mock email]', { to: body.to, subject: body.subject, link: body.link })

  return { ok: true, messageId: `mock-${Date.now()}` }
})
```

- [ ] **Step 2: Wire into SendLinkDialog**

Add an "Email" button to `ShareDialog.vue` that calls this endpoint before opening the mailto link. (Or simpler: just use mailto: for Phase 5.)

- [ ] **Step 3: Commit**

```bash
git add app/server/api/guest-guides/send-email.post.ts
git commit -m "feat(guest-guides): email channel (mock)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 54: Smart section ordering

**Files:**
- Modify: `guide-app/app/pages/[token].vue`

- [ ] **Step 1: Add ordering logic based on time-of-stay**

In the page's script setup, after computing `data`, compute a sorted section list:

```ts
const now = new Date()
const checkIn = data.value?.link ? new Date(/* reservation.checkIn */) : null
const checkout = data.value?.link ? new Date(/* reservation.checkOut */) : null
const hoursToCheckIn = checkIn ? (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity

const phase = computed<'pre' | 'arrival' | 'stay'>(() => {
  if (hoursToCheckIn > 24) return 'pre'
  if (hoursToCheckIn > -2) return 'arrival'
  return 'stay'
})

// Override orders based on phase
const PHASE_ORDERS: Record<string, Record<string, number>> = {
  pre: { pre_arrival: 0, wifi: 1, house_rules: 2, amenities: 3, local_tips: 4, checkin: 5 },
  arrival: { smart_lock: 0, checkin: 1, house_rules: 2, wifi: 3, amenities: 4 },
  stay: { local_tips: 0, upsells: 1, documents: 2, checkout: 3 },
}

const sortedSections = computed(() => {
  if (!data.value) return []
  const sections = data.value.guide.sections.filter(s => s.enabled)
  const phaseOrder = PHASE_ORDERS[phase.value]
  return sections.sort((a, b) => {
    const aOrder = phaseOrder[a.type] ?? 100
    const bOrder = phaseOrder[b.type] ?? 100
    if (aOrder === bOrder) return a.order - b.order
    return aOrder - bOrder
  })
})
```

In the template, iterate `sortedSections` instead of `data.guide.sections`.

- [ ] **Step 2: Add per-guide toggle**

In `GuestGuide` data type, add:

```ts
smartOrdering?: boolean
```

In the editor, add a Switch in the guide-level settings (next to Publish button) that toggles this.

- [ ] **Step 3: Commit**

```bash
git add guide-app/app/pages/[token].vue app/components/guest-guides/data/types.ts app/components/guest-guides/editor/GuideEditor.vue
git commit -m "feat(guest-guides): smart section ordering by stay phase

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 55: Backfill script for existing reservations

**Files:**
- Create: `app/server/api/guest-guides/backfill.post.ts`
- Create: `app/pages/guest-guides/backfill.vue` (admin UI)

- [ ] **Step 1: Create backfill endpoint**

```ts
// app/server/api/guest-guides/backfill.post.ts
import { useState } from '#imports'  // Nuxt auto-import
import type { GuestGuideLink } from '~/components/guest-guides/data/types'
import { mockConversations } from '~/components/inbox/data/conversations'  // adjust path
import { generateLinkId, generateToken } from '~/utils/guest-guide-token'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ guideId: string; dryRun: boolean }>(event)

  // Find all upcoming reservations
  const upcoming = mockConversations.filter((c) => {
    if (!c.checkIn) return false
    const checkIn = new Date(c.checkIn)
    const now = new Date()
    return checkIn > now && checkIn < new Date(now.getTime() + 30 * 86400000)
  })

  const links = useState<GuestGuideLink[]>('guest-guide-links')

  const generated: GuestGuideLink[] = upcoming.map((c) => {
    const now = new Date().toISOString()
    const link: GuestGuideLink = {
      id: generateLinkId(),
      token: generateToken(),
      guideId: body.guideId,
      reservationId: c.reservationId!,
      listingId: c.listingName ?? '',
      guestName: c.guestName,
      guestEmail: c.guestEmail,
      guestPhone: c.guestPhone,
      guestLanguage: c.guestLanguage,
      sentAt: now,
      expiresAt: new Date(new Date(c.checkOut!).getTime() + 86400000).toISOString(),
      status: 'pending',
      channel: 'manual',
    }
    return link
  })

  if (!body.dryRun) {
    links.value = [...links.value, ...generated]
  }

  return { count: generated.length, links: body.dryRun ? generated : undefined }
})
```

- [ ] **Step 2: Create admin UI**

```vue
<!-- app/pages/guest-guides/backfill.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { toast } from 'vue-sonner'

const { guides } = useGuestGuides()
const selectedGuideId = ref<string | null>(null)
const result = ref<{ count: number } | null>(null)
const running = ref(false)

async function runBackfill(dryRun: boolean) {
  if (!selectedGuideId.value) return
  running.value = true
  try {
    const res = await $fetch('/api/guest-guides/backfill', {
      method: 'POST',
      body: { guideId: selectedGuideId.value, dryRun },
    })
    result.value = res
    toast.success(dryRun ? `Would generate ${res.count} links` : `Generated ${res.count} links`)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-2xl p-6">
    <h1 class="mb-2 text-2xl font-bold">Backfill Guest Guides</h1>
    <p class="mb-6 text-sm text-muted-foreground">
      Generate guide links for all upcoming reservations in the next 30 days.
    </p>
    <select v-model="selectedGuideId" class="mb-4 w-full rounded-md border bg-background px-3 py-2 text-sm">
      <option :value="null">Select a guide...</option>
      <option v-for="g in guides" :key="g.id" :value="g.id">{{ g.title }}</option>
    </select>
    <div class="flex gap-2">
      <Button variant="outline" :disabled="!selectedGuideId || running" @click="runBackfill(true)">
        Dry run
      </Button>
      <Button :disabled="!selectedGuideId || running" @click="runBackfill(false)">
        {{ running ? 'Running...' : 'Generate links' }}
      </Button>
    </div>
    <div v-if="result" class="mt-4 rounded-md bg-muted p-4">
      Would generate {{ result.count }} link(s).
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/server/api/guest-guides/backfill.post.ts app/pages/guest-guides/backfill.vue
git commit -m "feat(guest-guides): backfill script for existing reservations

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 56: Analytics dashboard

**Files:**
- Create: `app/components/guest-guides/GuideAnalytics.vue`
- Modify: `app/pages/guest-guides/index.vue`

- [ ] **Step 1: Add aggregate KPIs to library page**

In `app/pages/guest-guides/index.vue`, compute:

```ts
const allLinks = computed(() => links.value)
const totalSent = computed(() => allLinks.value.length)
const totalOpened = computed(() => allLinks.value.filter(l => l.openedAt).length)
const totalSubmitted = computed(() => allLinks.value.filter(l => l.status === 'submitted').length)
const openRate = computed(() => totalSent.value === 0 ? 0 : Math.round((totalOpened.value / totalSent.value) * 100))
const submitRate = computed(() => totalSent.value === 0 ? 0 : Math.round((totalSubmitted.value / totalSent.value) * 100))
```

Add a stats row at the top:

```vue
<div class="mb-6 grid grid-cols-4 gap-4">
  <Card><CardContent class="pt-6"><div class="text-2xl font-bold">{{ totalSent }}</div><div class="text-sm text-muted-foreground">Links sent</div></CardContent></Card>
  <Card><CardContent class="pt-6"><div class="text-2xl font-bold">{{ openRate }}%</div><div class="text-sm text-muted-foreground">Open rate</div></CardContent></Card>
  <Card><CardContent class="pt-6"><div class="text-2xl font-bold">{{ submitRate }}%</div><div class="text-sm text-muted-foreground">Submit rate</div></CardContent></Card>
  <Card><CardContent class="pt-6"><div class="text-2xl font-bold">{{ totalSubmitted }}</div><div class="text-sm text-muted-foreground">Forms submitted</div></CardContent></Card>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/guest-guides/GuideAnalytics.vue app/pages/guest-guides/index.vue
git commit -m "feat(guest-guides): analytics dashboard on library page

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 57: Phase 5 + final verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Final end-to-end smoke test**

Verify all 5 phases still work after polish additions.

- [ ] **Step 4: Update CHANGELOG**

Add a release entry under "Recent" in `app/pages/changelog.vue` (or wherever release notes live).

- [ ] **Step 5: Tag v1**

```bash
git tag guest-guide-v1
git push --tags
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Implementation tasks |
|--------------|----------------------|
| §1 Overview | All phases |
| §2 Architecture | Task 11 (scaffold), Task 12 (API) |
| §3 Data model | Task 1 (types), Tasks 3-4 (composables), Task 5 (mock) |
| §4 Auto-trigger & delivery | Tasks 31-34 |
| §5 Public page | Tasks 11, 36-46 |
| §6 Admin dashboard | Tasks 7-10, 26-30, 47-50 |
| §7 Technical implementation | All phases |
| §8 Open questions | Email + photo upload deferred to Phase 5; translation API in future |
| §9 Risks | Tasks 12-13, 30, 51, 57 verification steps |
| §10 Success metrics | Task 56 analytics |

**Placeholder scan:** No "TBD" or "TODO" markers in actual code blocks. Section tasks 16-25, 39-42 use "follow the same pattern as Task X" — this is intentional brevity for repetitive tasks where the pattern is fully shown in the referenced task. Engineers can lift the template directly.

**Type consistency check:**
- `GuestGuide`, `GuideSection`, `GuestGuideLink`, `GuideSubmission` types match across all tasks
- `generateGuideId`, `generateLinkId`, `generateSectionId`, `generateToken` are consistent
- `useGuestGuides`, `useGuestGuideLinks`, `useGuestGuideSubmissions` exports match across tasks

**One known ambiguity:** Task 49 uses `SendLinkDialog` but that component requires `guideId` to be set. The plan references `guides[0]?.id` as a fallback — implementers should consider whether the Reservation tab should always require a guide to be picked first, or default to the first assigned guide for the listing. Discuss during implementation.

---

*Plan complete. Total: 57 tasks across 5 phases.*