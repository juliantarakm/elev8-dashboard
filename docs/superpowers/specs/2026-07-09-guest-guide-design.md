# Guest Guide Module — Design Spec

> **Date**: 2026-07-09
> **Module**: Guest Guide (`/guest-guides` + `https://guide.elev8-suite.com/{token}`)
> **Status**: Approved
> **Depends on**: Journeys module (auto-trigger), Inbox (delivery channel), Smart Lock (codes), Upsells (offers), Listing Resources (content sources), WhatsApp templates

---

## 1. Overview

Guest Guide is a feature that auto-sends guests a **tokenized public link** to a personalized, property-specific welcome page when their reservation is confirmed. Guests fill in pre-arrival info, view house rules and amenities, browse upsells, and (when in window) see their smart lock door code — all without logging in. Hosts manage guides in a dedicated `/guest-guides` library.

### Key Features

- **Custom editor** with 13 section types (hero, welcome, check-in, check-out, pre-arrival form, ID verification, house rules, Wi-Fi, amenities, local tips, upsells, smart lock, documents, custom rich)
- **3 bundled templates** (Bali Villa, Mountain Retreat, City Apartment) for fast setup
- **Auto-trigger** via Journeys on `new_booking` event
- **Multi-channel delivery** (WhatsApp Phase 1; Email + OTA Phase 5)
- **Public subdomain** at `https://guide.elev8-suite.com/{token}` (mirrors `pay.elev8.co` pattern)
- **Auto-translation at runtime** — host writes once, guest sees their language
- **Smart lock code visibility** — server-enforced 24h-before-checkin window
- **Upsell integration** — guests can add services to their stay from inside the guide
- **Submissions monitoring** — host sees arrival times, guest counts, ID verification, upsells added

### Why this matters

Currently, hosts manually message each guest with Wi-Fi passwords, house rules, and check-in instructions. This feature **automates** that workflow end-to-end, captures structured pre-arrival data (eliminating back-and-forth), and surfaces upsells at the moment guests are most receptive (planning their trip).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD APP (elev8-suite.com)                                │
│                                                                 │
│  /guest-guides ─────► useGuestGuides()                          │
│                       │                                         │
│                       ├─► GuestGuide[] (CRUD, templates)        │
│                       │                                         │
│                       └─► GuestGuideLink[] (per-reservation)    │
│                                                                 │
│  /listings/[id] ───► Listing Settings tab                       │
│                       "Guest Guide" shortcut                    │
│                                                                 │
│  /journeys ────────► New step type: send_guest_guide            │
│                       │                                         │
│                       └─► Triggers on new_booking               │
│                                                                 │
│  Shared API endpoints (/api/guest-guides/*):                     │
│    GET    /api/guest-guides/by-token/:token                     │
│    POST   /api/guest-guides/by-token/:token/submit              │
│    POST   /api/guest-guides/by-token/:token/view-lock           │
│    POST   /api/guest-guides/issue       (called by Journey)     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS / JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PUBLIC APP (guide.elev8-suite.com)                             │
│                                                                 │
│  /:token ────► GuestGuideView.vue                               │
│                │                                                │
│                ├─► Fetches guide via shared API                  │
│                ├─► Renders sections (translated)                 │
│                ├─► PreArrivalForm                               │
│                ├─► IdVerificationForm                            │
│                ├─► UpsellOfferCards                              │
│                └─► SmartLockCodePanel (when in window)           │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Properties

- **Dashboard = authoring + monitoring + automation.** Subdomain = read-only guest experience + form submission.
- **One API surface, two consumers.** All cross-app calls go through `/api/guest-guides/*`.
- **No new public tokenized route inside the dashboard.** Keeps Nuxt auth middleware clean.
- **Token format:** `ggl-${nanoid(12)}` — short, URL-safe, unguessable. Distinct from sequential `pr-${Date.now()}` payment links because guest URLs are shared over WhatsApp.

---

## 3. Data Model

### Entity Relationship

```
GuestGuide (1) ──── (M) GuideSection
GuestGuide (M) ──── (M) Listing (via assignedListingIds)
GuestGuide (1) ──── (M) GuestGuideLink
GuestGuideLink (1) ──── (0..1) GuideSubmission
```

### TypeScript Types

```ts
// ===== GuestGuide (authored in dashboard) =====
type GuestGuide = {
  id: string                    // gg-${nanoid(12)}
  title: string                 // "Bali Villa Welcome Guide"
  description?: string
  assignedListingIds: string[]  // which listings this guide applies to
  templateId?: string           // which template was used (nullable for from-scratch)
  status: 'draft' | 'active' | 'archived'
  sections: GuideSection[]      // ordered, draggable
  defaultLanguage: string       // host's authoring language, e.g. 'en'
  createdBy: string             // staff id
  createdAt: string             // ISO
  updatedAt: string             // ISO
}

type GuideSection = {
  id: string                    // gs-${nanoid(8)}
  type: GuideSectionType
  order: number                 // 0-based
  enabled: boolean              // soft hide without delete
  data: Record<string, any>     // type-specific payload
}

type GuideSectionType =
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

// ===== GuestGuideLink (issued per reservation) =====
type GuestGuideLink = {
  id: string                    // ggl-${nanoid(12)}
  token: string                 // UNIQUE, used in URL (nanoid 12 chars)
  guideId: string
  reservationId: string         // UNIQUE — one link per reservation
  listingId: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestLanguage?: string        // for translation target
  sentAt: string
  openedAt?: string             // first guest access
  submittedAt?: string          // guest submitted pre-arrival form
  expiresAt: string             // checkout + 24h
  status: 'pending' | 'opened' | 'submitted' | 'expired' | 'revoked'
  channel: 'whatsapp' | 'email' | 'manual'
  metadata?: { journeyId?: string; templateId?: string }
}

// ===== GuideSubmission (guest-submitted form data) =====
type GuideSubmission = {
  id: string
  linkId: string                // FK to GuestGuideLink
  submittedAt: string
  arrivalTime?: string          // ISO datetime
  guests?: number
  mobile?: string
  idType?: 'passport' | 'ktp' | 'driver_license'
  idNumber?: string             // sensitive — encrypted at rest in production
  idPhotoUrl?: string           // uploaded to /uploads/guest-id/ (Phase 5)
  requests?: string             // free text
  upsellsAdded?: { serviceId: string; qty: number }[]
  smartLockViewedAt?: string    // timestamp when guest first saw code panel
}
```

### Section Type Specifications

| Type | Editor Fields | Rendered Output |
|------|---------------|-----------------|
| `hero` | `photoUrl`, `title`, `subtitle` | Full-width hero with property name overlay |
| `welcome` | `message` (long text) | Auto-translated welcome message |
| `checkin` | `time`, `instructions`, `earlyCheckinAvailable?` | Check-in info card |
| `checkout` | `time`, `instructions` | Check-out info card |
| `house_rules` | `rules: string[]` | Bulleted list with check icons |
| `amenities` | `items: string[]`, `custom?: { name, icon, description }[]` | Icon grid |
| `wifi` | `ssid`, `password`, `networkNotes` | Network card with copy buttons |
| `local_tips` | `tips: { title, body, icon? }[]` | Card list with icons |
| `documents` | `fileIds: string[]` (refs ListingDocument) | Download list |
| `upsells` | `serviceIds: string[]`, `heading`, `subheading` | Service cards with "Add" buttons |
| `smart_lock` | `lockIds: string[]`, `heading`, `codeWindowHours` (default 24) | Code panel (visible only in window) |
| `pre_arrival` | `fields: PreArrivalField[]` | Configurable form (essentials + ID) |
| `custom_rich` | `html` | Free-form rich content (sanitized) |

`PreArrivalField` union: `'arrival_time' | 'guests' | 'mobile' | 'id_type' | 'id_number' | 'id_photo' | 'requests'`

### PII Handling

- `idNumber` field is **encrypted at rest** in production (server-side). Dashboard view masks all but last 4 digits: `****1234`.
- `idPhotoUrl` Phase 5 only — uploads scanned for malware + size-limited to 5MB.
- Real production backend must comply with regional data residency rules (Bali guest data → IDR region).

---

## 4. Auto-Trigger & Delivery Flow

### Journey Architecture

The auto-send uses the **existing `new_booking` trigger** in the Journeys module, plus a **new step type `send_guest_guide`**.

### Recommended Default Journey Template

```
┌─[ trigger: new_booking ]
│
├─[ if_else: reservation_status == 'confirmed' ]  ─── false ──► stop
│
├─[ context_check: no existing link for this reservation ]  ─── has-link ──► stop
│
├─[ action: send_guest_guide ]
│     • Look up GuestGuide where assignedListingIds includes reservation.listingId
│     • If multiple: pick highest-priority one (user-defined ordering)
│     • If none: log warning + skip (don't block booking flow)
│     • Create GuestGuideLink with token, expiresAt = checkout + 24h
│     • Return { linkId, token, url } for downstream steps
│
├─[ wait: 5 minutes ]
│
└─[ message: whatsapp — template 'booking_confirmation_with_guide' ]
      Body: "Hi {{guest_name}}, welcome to {{property_name}}!
             Your stay {{check_in_date}} → {{check_out_date}} is confirmed.
             Please complete your pre-arrival info: {{guide_link}}"
```

### Marketplace Templates (3 shipped)

| Template | When | Channels |
|---|---|---|
| `Booking Confirmed — Send Guide` | Instant after `new_booking` | WhatsApp |
| `Pre-Arrival Reminder — 7 days` | Calendar-based, 7 days before check-in | WhatsApp |
| `Pre-Arrival Reminder — 24h` | Calendar-based, 24h before check-in | WhatsApp |

### Channel Support

| Channel | Phase 1 | Phase 2 | Phase 5 |
|---|---|---|---|
| **WhatsApp** | ✅ via `checkin_instructions` template + new `booking_confirmation_with_guide` | – | – |
| **Email** | – | – | ✅ SMTP / SendGrid |
| **OTA in-app** | – | – | ✅ via existing `ota` channel on Journey message step |
| **Manual** | ✅ Staff copies link from `/guest-guides/{id}/links` and pastes anywhere | – | – |

### Link Lifecycle & Revocation

```
  Issued (pending)
       │
       ▼ guest clicks link
    Opened
       │
       ▼ guest submits pre-arrival form
   Submitted
       │
       ▼ checkout + 24h
    Expired (auto)

At any point: host can revoke from /guest-guides/{id}/links → status: 'revoked'
Guest accesses revoked link → "This guide is no longer available. Please contact the host."
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Guide not assigned to listing | Journey logs warning, skips delivery. Staff sees `GUEST_GUIDE_NOT_SENT` alert |
| Multiple guides assigned to same listing | Use `assignedListingIds` ordering + `priority` field. First match wins |
| Link expires before guest opens | Guest sees "This guide has expired. Please contact the host." + host contact info |
| Guest opens link twice from different devices | Latest submission overwrites. Dashboard shows submission history |
| Journey is disabled | No link generated, no notification. Existing links remain valid |
| Listing has no `assignedListingIds` match | Tenant-level fallback guide (configurable in Settings) |

---

## 5. Public Guest-Facing Page

### URL Structure

`https://guide.elev8-suite.com/{token}` — single-page app, all sections in one scroll.

### Page Sections (default order)

```
1.  Hero (property photo + welcome overlay)
2.  Language Switcher (auto-detected from GuestGuideLink.guestLanguage)
3.  Welcome Message (auto-translated)
4.  Pre-Arrival Form (collapsible)
5.  ID Verification (collapsible)
6.  House Rules
7.  Wi-Fi
8.  Amenities (icon grid)
9.  Local Tips
10. Upsells (cards)
11. Smart Lock Code (visible 24h before check-in)
12. Documents (downloadable)
13. Checkout
14. Host Contact (footer)
```

### Form Submission Behavior

- **Pre-arrival form** submits via `POST /api/guest-guides/by-token/:token/submit` → creates `GuideSubmission` → dashboard reflects in reservation panel
- **ID verification** saves independently — guests can defer
- **Upsell "Add"** creates `UpsellOrder` via existing flow; shows in-place confirmation
- **Smart lock "viewed"** fires `smartLockViewedAt` timestamp; no submission, just analytics

### Empty / Error States

| State | Guest Sees |
|-------|------------|
| Invalid token | "We couldn't find your guide. Please check the link or contact your host." + host contact |
| Link expired | "This guide is no longer available. Please contact your host." + host contact |
| Link revoked | Same as expired |
| Form submit fails | Inline error + retry button + toast |
| Image upload fails | Inline error on that field only |
| Network offline | "You're offline. Your changes will save when you reconnect." |

### Section Ordering

Two strategies (host picks per guide):
1. **Manual order** — host drags sections in the editor (default)
2. **Smart order** — Elev8 reorders based on guest phase:
   - **Pre-arrival focus** (>24h before check-in): Pre-Arrival form, Wi-Fi, House Rules, Amenities, Local Tips, Check-in
   - **Arrival focus** (T-24h to T+2h): Smart Lock, Check-in, House Rules, Wi-Fi, Amenities
   - **In-stay focus** (T+2h to checkout-12h): Local Tips, Upsells, Documents, Checkout

Default is manual order. Smart order is a per-guide toggle.

### Mobile-First Considerations

- All sections single-column on mobile
- Hero photo lazy-loaded + WebP optimized
- Smart lock code shown large with tap-to-copy
- Pre-arrival form uses native inputs (`<input type="time">`, `<input type="tel">`)

---

## 6. Admin Dashboard (`/guest-guides`)

### Page Hierarchy

```
/guest-guides                          → library (list of guides)
/guest-guides/new                      → template gallery → editor
/guest-guides/[id]                     → editor (drafts) OR read-only (active)
/guest-guides/[id]/preview             → iframe preview of public page
/guest-guides/[id]/links               → issued links + submissions monitoring
/guest-guides/templates                → template library management (admin only)
```

### Library Page (`/guest-guides`)

Per-guide card shows:
- Title, status badge (Active/Draft/Archived)
- Assigned listing count
- Links sent / opened / submitted counts
- Last edited date + editor name
- Actions: Edit, Preview, Links, More (⋯)

Tabs: Active | Drafts | Archived
Filters: All listings, Search
Header: "+ Create Guide" button → template gallery

### Editor (`/guest-guides/[id]`)

Two-pane layout (mirrors `ListingSetupOverlay` pattern):

```
┌────────────────────┬───────────────────────────────────────────┐
│  SECTION LIST      │  EDITOR FOR SELECTED SECTION              │
│  (draggable)       │                                           │
│  [ + Add section ] │  [Preview as guest]   [Save] [Publish]    │
└────────────────────┴───────────────────────────────────────────┘
```

Each section type has its own editor component, following `ListingSetupFieldPanel`'s per-field editor pattern.

### Template Gallery (Creation Flow)

3 templates shipped:

1. **Bali Villa** — 11 sections with Bali-flavored placeholder copy (welcome message includes "Selamat datang", local tips include warung recommendations, etc.)
2. **Mountain Retreat** — 7 sections, mountain-flavored copy, quieter vibe
3. **City Apartment** — 6 sections, urban-focused, no pool/beach sections

Templates are JSON files in `app/components/guest-guides/templates/`. Hosts can fork and customize.

### Issuing / Re-issuing Links (Manual)

Two entry points:
1. **`/guest-guides/{id}/links`** → "Send link to..." button → reservation picker → generates link → opens share dialog (copy URL / WhatsApp / Email)
2. **Inbox reservation panel** → new "Guest Guide" button → share dialog with reservation pre-filled

### Submissions Monitoring (`/guest-guides/{id}/links`)

Table columns: Token (truncated), Guest, Reservation, Listing, Sent at, Status
Click row → drawer with:
- Token, full URL, status, timestamps
- Submitted data (arrival time, guests, mobile, requests)
- ID verification status (masked number + photo thumbnail if available)
- Upsells added (with order IDs linking to Upsells module)
- Smart lock view timestamp
- Actions: Resend / Revoke / Open as guest

Filters: Status, Listing, Date range
Bulk actions: Resend / Revoke / Export CSV

### Reservation Panel Integration

Inbox `ReservationPanel` gets a new **"Guest Guide"** tab (after Upsell, before History):
- Guide status (sent / opened / submitted)
- Issued link (copy / open)
- Quick view of submitted data
- Resend / Revoke buttons
- Link to full submissions monitoring

### Notifications

Hook into existing `useNotifications.createAlert()`:

- `GUEST_GUIDE_NOT_SENT` (warning) — Journey tried but no guide assigned
- `GUEST_GUIDE_OPENED` (info, batched daily) — newly opened guides summary
- `GUEST_GUIDE_SUBMITTED` (info, batched daily) — newly submitted forms summary

### Listing Settings Integration

Add "Guest Guide" card to `ListingSettingsTab.vue` (alongside Smart Locks):
- Currently-assigned guide (or "No guide assigned")
- "Assign guide" button → guide picker popover
- "Open editor" button → opens `/guest-guides/{id}`
- "Preview as guest" button → opens preview iframe

---

## 7. Technical Implementation

### Build Phases

| Phase | Scope | Duration |
|-------|-------|----------|
| **1. Foundation (MVP)** | Data model + composables, library page (read-only), manual link issuance, subdomain scaffold with `welcome` section only | ~1 week |
| **2. Editor + Sections** | All 13 section types + editors, template gallery, drag-reorder, preview iframe | ~1.5 weeks |
| **3. Auto-Trigger** | `send_guest_guide` Journey step, 3 marketplace templates, WhatsApp delivery | ~1 week |
| **4. Forms + Live Data** | Pre-arrival form, ID verification, upsell integration, smart lock panel, submissions monitoring UI, reservation panel tab, listing settings card | ~2 weeks |
| **5. Polish** | ID photo upload pipeline, email + OTA channels, smart section ordering, backfill existing reservations, analytics | ~1 week |

**Total: ~6-7 weeks.**

### New Files (Phase 1-4 outline)

```
app/
├── pages/
│   └── guest-guides/
│       ├── index.vue                       # library
│       ├── new.vue                         # template gallery
│       ├── [id]/
│       │   ├── index.vue                   # editor / read-only
│       │   ├── preview.vue                 # iframe preview
│       │   └── links.vue                   # issued links monitoring
│       └── templates.vue                   # admin template mgmt
├── components/
│   ├── guest-guides/
│   │   ├── GuideCard.vue
│   │   ├── GuideTable.vue
│   │   ├── GuideStatusBadge.vue
│   │   ├── editor/
│   │   │   ├── GuideEditor.vue
│   │   │   ├── SectionList.vue
│   │   │   ├── SectionEditor.vue
│   │   │   └── sections/
│   │   │       ├── HeroSectionEditor.vue
│   │   │       ├── WelcomeSectionEditor.vue
│   │   │       ├── CheckinSectionEditor.vue
│   │   │       ├── PreArrivalSectionEditor.vue
│   │   │       ├── IdVerificationSectionEditor.vue
│   │   │       ├── HouseRulesSectionEditor.vue
│   │   │       ├── WifiSectionEditor.vue
│   │   │       ├── AmenitiesSectionEditor.vue
│   │   │       ├── LocalTipsSectionEditor.vue
│   │   │       ├── UpsellsSectionEditor.vue
│   │   │       ├── SmartLockSectionEditor.vue
│   │   │       ├── DocumentsSectionEditor.vue
│   │   │       ├── CheckoutSectionEditor.vue
│   │   │       └── CustomRichSectionEditor.vue
│   │   ├── template-gallery/
│   │   │   ├── TemplateGallery.vue
│   │   │   └── TemplateCard.vue
│   │   ├── links/
│   │   │   ├── LinksTable.vue
│   │   │   ├── LinkDetailDrawer.vue
│   │   │   └── ShareDialog.vue
│   │   ├── templates/                     # bundled templates
│   │   │   ├── bali-villa.json
│   │   │   ├── mountain-retreat.json
│   │   │   └── city-apartment.json
│   │   └── data/
│   │       └── types.ts                   # all type definitions
│   ├── inbox/
│   │   ├── ReservationGuestGuide.vue       # NEW tab in reservation panel
│   │   └── ... (modified: ReservationPanel.vue)
│   ├── listings/
│   │   └── ListingSettingsTab.vue          # add Guest Guide card
│   └── settings/
│       └── GuestGuideSettings.vue          # tenant-level settings
├── composables/
│   ├── useGuestGuides.ts                   # CRUD for guides
│   ├── useGuestGuideLinks.ts               # read+monitor links
│   └── useGuestGuideTemplates.ts           # template registry
├── server/
│   └── api/
│       └── guest-guides/
│           ├── index.get.ts                # list guides (auth)
│           ├── index.post.ts               # create guide
│           ├── [id].get.ts
│           ├── [id].put.ts
│           ├── [id].delete.ts
│           ├── [id]/
│           │   ├── links.get.ts            # list issued links
│           │   └── links.post.ts           # manual issue
│           ├── by-token/
│           │   ├── [token].get.ts          # PUBLIC — fetch guide
│           │   ├── [token]/submit.post.ts  # PUBLIC — submit form
│           │   ├── [token]/view-lock.post.ts # PUBLIC — log view
│           │   └── [token]/revoke.post.ts  # revoke link
│           └── issue-from-journey.post.ts  # internal, called by Journey action step
└── utils/
    ├── guest-guide-token.ts                # nanoid wrapper
    └── guest-guide-templates.ts            # render section data

guide.elev8-suite.com/                       # NEW public app
├── nuxt.config.ts                          # lightweight config
├── pages/
│   └── [token].vue                         # single public page
├── components/
│   ├── GuestGuideView.vue
│   ├── sections/
│   │   ├── HeroSection.vue
│   │   ├── WelcomeSection.vue
│   │   └── ... (mirrors editor sections)
│   ├── forms/
│   │   ├── PreArrivalForm.vue
│   │   ├── IdVerificationForm.vue
│   │   ├── UpsellCard.vue
│   │   └── SmartLockPanel.vue
│   └── LanguageSwitcher.vue
├── composables/
│   ├── usePublicGuestGuide.ts              # fetchGuide, submitForm
│   └── useAutoTranslate.ts                 # reuse from main app
└── assets/
    └── css/                                # shared design tokens via CDN
```

### Shared Types Strategy

Two options:
1. **Git submodule / monorepo package** — `packages/shared-types` imported by both apps. Most correct but adds tooling.
2. **Duplicate the types file** — same file in both repos, sync via CI check that they match. Simpler, fine for Phase 1.

**Decision:** Start with option 2 (duplicate), migrate to option 1 when type surface grows >20 types.

### Translation Strategy

Both apps use the **same `mockTranslate(text, lang)`** function from `useInbox` (Phase 1 mock). Real impl swaps to a translation API. Composable signature stays identical.

### Security Considerations

- **Tokens are unguessable** (nanoid 12 chars = ~10^17 entropy, vs sequential timestamp IDs)
- **Rate limiting** on `/api/guest-guides/by-token/:token` endpoint (10 req/min per IP)
- **PII handling:** `idNumber` encrypted at rest in real impl; dashboard masks all but last 4
- **Photo uploads** scanned for malware + size-limited (5MB) in Phase 5
- **Smart lock codes** only fetched for reservations where `now >= checkIn - 24h` (enforced server-side, not just client UI hidden)

### Migration / Backfill

For existing reservations arriving **before** this feature shipped:
- One-time script: for all `Confirmed`/`Checked-in` reservations in next 30 days, generate a link
- Host sees "Send guides to upcoming reservations" CTA in library with count badge
- Host reviews list before bulk-sending

---

## 8. Open Questions for Implementation Phase

1. **Public subdomain framework** — Nuxt vs static-site (Astro, Next)? Recommend **Nuxt** for consistency with main app.
2. **Email provider (Phase 5)** — SendGrid / Postmark / SES? Out of scope for this design.
3. **ID photo storage (Phase 5)** — S3 / Cloudinary? Decide during Phase 5.
4. **Translation API (Phase 5)** — DeepL / Google Translate / Claude? Decide during Phase 5.
5. **Guest edit-after-submit** — Should guests be able to update submitted data via the same link? **Recommendation: yes** until check-in time. Could be Phase 5.
6. **Per-section view tracking analytics** — Phase 5.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Phase 1 public app setup is high-risk (first public route in project) | +0.5 day buffer; reuse Nuxt auth bypass pattern from existing protected routes |
| Auto-translate depends on translation API existing | Phase 1 ships with mock translation; production cutover Phase 5 |
| Smart lock integration assumes `useSmartLock` is stable | API shape recently shipped; if changes, this feature follows |
| Tokens might be guessed/shared inappropriately | nanoid 12 chars + rate limiting + per-IP throttling |
| PII (ID numbers, photos) compliance | Encryption at rest + masking in UI + regional residency (Phase 5) |

---

## 10. Success Metrics

| Metric | Target (3 months post-launch) |
|--------|--------------------------------|
| Guides created per tenant | ≥3 |
| Links sent per guide per month | ≥10 |
| Pre-arrival form completion rate | ≥70% |
| Time saved per reservation (staff) | ≥15 min |
| Upsell conversion from guide | ≥5% of opened guides |
| Guest satisfaction (post-stay survey) | +10% NPS delta |

---

*Spec complete. Ready for implementation planning.*