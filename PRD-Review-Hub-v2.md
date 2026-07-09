# PRD: Review Hub v2 — Channex-Aligned Guest Review & Response Center

**Status:** V1 Implementation Complete
**Owner:** Juli (Product)
**Module:** Operations → Review Hub (Cockpit web)
**Integration:** Channex API (reviews, scores, replies, guest reviews)
**Last Updated:** 2026-07-09

---

## TL;DR (Developer Quickstart)

**What is this?** A single-page dashboard (`/reviews`) where property managers manage guest reviews across Airbnb, Booking.com, and Direct bookings.

**What does it do?**
- Shows all reviews in a paginated table with filters (search, status, channel, property)
- Each review row links to a detail drawer with 4 panels: Guest Review, Stay Report, AI Reply, AI Host Review
- AI generates reply drafts and host review drafts from Stay Operational Record data
- Channex API-aligned: unified 0-10 scores, `is_hidden`/`is_replied` flags, ~80+ tag codes, `POST /reply` + `POST /guest_review`
- Settings sheet: separate auto-post toggles for Host Reviews (Airbnb only) and Replies (Airbnb + Booking.com)

**Key files:**
| File | Purpose |
|---|---|
| `app/pages/reviews.vue` | Page: feed + filters + drawer + settings sheet |
| `app/components/review-hub/FeedTable.vue` | Paginated table (10/page), contextual action buttons |
| `app/components/review-hub/DetailDrawer.vue` | Dialog with GuestPanel → Stay Report → ReplyPanel → HostReviewPanel |
| `app/components/review-hub/HostReviewPanel.vue` | Airbnb-only: generate → edit (ratings + tags + recommended) → submit |
| `app/components/review-hub/ReplyPanel.vue` | All channels: generate → edit → post/copy |
| `app/composables/useReviewHub.ts` | All state, computed status, AI generators, tag enrichment |
| `app/components/review-hub/data/types.ts` | Channex-aligned types + tag labels + score helpers |
| `app/components/settings/AirbnbReviewConfig.vue` | Settings sheet: host review auto-post + reply auto-post |

**Data flow:**
```
Channex GET /reviews → ReviewRecord (scores[], tags[], is_hidden, is_replied)
  → enrichSorFromTags() (fills Stay Report gaps from tag signals)
  → FeedTable (filtered + sorted + paginated)
  → DetailDrawer (live state from composable)

User actions:
  Generate Host Review → useReviewHub.generateHostReviewDraft() → ratings + tags
  Submit Host Review → useReviewHub.submitHostReview() → host_review_id + is_hidden=false
  Generate Reply → useReviewHub.generateReplyDraft() → text
  Approve Reply → useReviewHub.approveReply() → is_replied=true
```

**3 computed statuses:**
- `host_review_pending` — Airbnb/Booking.com: host review window still open, host hasn't submitted
- `needs_reply` — guest review visible + has content + not replied
- `replied` — `is_replied === true`

**Airbnb double-blind:** Guest review hidden (`is_hidden` + no `host_review_id` + <14d). Auto-reveals when host submits OR after 14 days.

**Host review of guest:** Airbnb only. Channex `POST /guest_review` not supported for Booking.com/Direct.

**Seed data:** 15 records in `data/mock-review-records.ts` (5 Airbnb, 3 Booking.com, 2 Direct, 5 additional). 10 Stay Report records in `data/mock-sor.ts`.

---

## Table of Contents
1. Problem Statement
2. Roles & Access
3. Architecture Overview
4. Data Model (Channex-Aligned)
5. Channel Constraints & Mapping
6. Tag System
7. User Flows
8. AI Generation
9. Component Specifications
10. State Management
11. Settings
12. Seed Data Reference
13. Acceptance Criteria
14. Definition of Done
15. Dependencies & Open Questions
16. File Inventory

---

## 1. Problem Statement

Property managers need a single place to manage guest reviews across Airbnb, Booking.com, and Direct bookings. Current workflows are fragmented — replies are generic, host reviews default to blind 5-star, and there's no way to leverage operational data (cleaning records, house rule flags, communication history) to write honest, specific responses.

**Review Hub** aggregates every guest review in one feed, grounds every AI output in real Stay Operational Record data, and maps directly to the Channex API for full read/write capability.

---

## 2. Roles & Access

| Role | Access |
|---|---|
| **General Manager** | Full: view, edit AI drafts, post reply, submit host review, configure automation rules |
| **Listing Manager** | Full: view, edit AI drafts, post reply, submit host review for assigned properties |
| **Guest Experience Manager** | Full: view, edit AI drafts, post reply (primary daily user for guest communication) |
| **Quality Manager** | Read-only: view reviews, Stay Report, tag analytics. No posting rights |
| **Owner** | Read-only trend overview on Dashboard (aggregate rating), no per-review detail |

---

## 3. Architecture Overview

### Data Ingestion

```
Channex API (GET /reviews)
  → ReviewRecord (normalized: 0-10 scores, is_hidden, is_replied, tags[])
  → SOR enrichment (cleaning/house rules/comms from tags if sparse)
  → FeedTable + DetailDrawer

Channex API (POST /reviews/:id/reply)
  → ReplyPanel text → approveReply → state + API

Channex API (POST /reviews/:id/guest_review)  [Airbnb only]
  → HostReviewPanel (ratings + tags + recommended) → submitHostReview → state + API
```

### Component Tree

```
app/pages/reviews.vue
├── Settings Sheet (AirbnbReviewConfig.vue)
├── Filters.vue
│   ├── Search (guest name / property)
│   ├── Status (All | Host Review Due | Needs Reply | Replied)
│   ├── Channel (All | Airbnb | Booking.com | Direct)
│   └── PropertyPicker (multi-select + search + tags)
├── FeedTable.vue (paginated, 10/page)
│   ├── SourceBadge.vue (channel icon + label)
│   ├── MiniBadges.vue (cleaning + house rules + communication, color-coded)
│   ├── StatusChip.vue (Host Review Due / Needs Reply / Replied)
│   └── FeedPagination.vue (prev/next + page numbers + ellipsis)
└── DetailDrawer.vue (Dialog, opens on row click)
    ├── DetailGuestPanel.vue
    │   ├── Rating accordion (overall + per-category, Channex 0-10 → native display)
    │   ├── Review text (hidden during Airbnb double-blind)
    │   ├── Tag chips (green positive + red negative, 4 visible + expand)
    │   └── State indicator (hidden / guest hasn't reviewed / visible)
    ├── DetailSorPanel.vue
    │   ├── Cleaning score + notes + duration delta
    │   ├── House rule flags (type, severity, reported by, resolution)
    │   └── Communication score + summary
    ├── ReplyPanel.vue
    │   ├── Generate Reply Draft (ElevAI)
    │   ├── Channel constraints (Airbnb 500ch, Booking.com 1000ch, Direct unlimited)
    │   ├── Grounding indicator (Stay Report reference)
    │   └── Post Reply / Copy to Clipboard
    └── HostReviewPanel.vue (Airbnb only, shown during double-blind)
        ├── Public Review textarea
        ├── Private Feedback textarea (host-only)
        ├── Rating controls (cleanliness + communication + respect_house_rules, +/- buttons)
        ├── Recommend guest toggle
        ├── Host review tags (22 selectable chips, auto-selected from SOR on generate)
        └── Generate / Regenerate / Submit buttons
```

---

## 4. Data Model (Channex-Aligned)

### 4.1 ReviewRecord

```ts
interface ReviewRecord {
  id: string                     // UUID, Channex review ID
  reservation_id: string         // Links to booking
  source: 'airbnb' | 'booking_com' | 'direct'
  listing_id, listing_name, listing_location: string
  unit_id: string | null         // null for single-unit properties

  // Guest review data (from Channex GET /reviews)
  guest_rating_overall: number | null   // 0-10 scale, all channels normalized
  scores: ScoreCategory[]               // [{category: "clean", score: 9.5}, ...]
  tags: string[]                        // Airbnb only: ~80+ predefined tag codes
  guest_review_text: string | null
  is_hidden: boolean                    // Channex: Airbnb double-blind flag
  is_replied: boolean                   // Channex: host has replied
  review_received_at: string | null
  language_detected: string | null

  // Elev8 computed
  reply_status: ReplyStatus  // host_review_pending | needs_reply | replied

  // Host reply (via Channex POST /reviews/:id/reply)
  reply_text: string | null
  reply_posted_at: string | null

  // Host review of guest (via Channex POST /reviews/:id/guest_review, Airbnb only)
  host_review_id: string | null
  host_review_text: string | null
  host_review_ratings: { cleanliness, communication, respect_house_rules } | null  // 1-5
  is_reviewee_recommended: boolean | null
  host_review_tags: string[]

  // Metadata
  private_feedback: string | null
  sor_id: string | null
  checkout_date: string
  created_at, updated_at: string
}

interface ScoreCategory {
  category: string    // Channex: "clean", "accuracy", "checkin", "comfort", etc.
  score: number       // 0-10 scale
}
```

### 4.2 Stay Report (StayOperationalRecord)

```ts
interface StayOperationalRecord {
  id, reservation_id, listing_id: string
  cleaning_score: number | null
  cleaning_notes: string | null
  cleaning_duration_delta: number | null  // Minutes vs estimated
  house_rule_flags: HouseRuleFlag[]
  communication_score: number | null
  communication_summary: string | null
  computed_at: string
}

interface HouseRuleFlag {
  id, reservation_id: string
  type: 'extra_guest' | 'unregistered_pet' | 'smoking' | 'noise' | 'damage' | 'early_late_unapproved' | 'other'
  severity: 'low' | 'medium' | 'high'
  evidence_url: string | null
  reported_by: 'housekeeping' | 'pm' | 'smart_lock_log' | 'guest_inbox'
  reported_at: string
  resolution_status: 'open' | 'resolved_onsite' | 'disputed'
}
```

### 4.3 ReplyStatus (Computed)

Status tidak disimpan langsung — dihitung dari state Channex + window countdown:

| Status | Condition |
|---|---|
| `replied` | `is_replied === true` (dari Channex) |
| `host_review_pending` | Airbnb: `!host_review_id && window > 0`. Booking.com: same + 365d window |
| `needs_reply` | Guest review visible + has content + `!is_replied` |

---

## 5. Channel Constraints & Mapping

### 5.1 Score Normalization

Channex normalizes all scores to **0-10**. Display helpers:

| Channel | Display Scale | Conversion |
|---|---|---|
| Airbnb | X/5 | `score / 2` |
| Booking.com | X/10 | `score` (as-is) |
| Direct | X/5 | `score / 2` |

```ts
getDisplayScore(overallScore, source) → "4.0" or "8.0"
getDisplayMax(source) → 5 or 10
```

### 5.2 Category Mapping

| Booking.com | Airbnb | Channex Unified |
|---|---|---|
| clean | cleanliness | `clean` |
| comfort | — | `comfort` |
| facilities | — | `facilities` |
| location | location | `location` |
| staff | — | `staff` |
| value | value | `value` |
| — | accuracy | `accuracy` |
| — | checkin | `checkin` |
| — | communication | `communication` |

### 5.3 Host Review of Guest

| Channel | Support | API Endpoint | Window |
|---|---|---|---|
| **Airbnb** | ✅ Full | `POST /guest_review` (ratings + tags + recommended + private feedback) | 14 days |
| **Booking.com** | ❌ | — | — |
| **Direct** | ❌ | — | — |

### 5.4 Reply to Guest

| Channel | Support | API Endpoint | Window | Char Limit |
|---|---|---|---|---|
| Airbnb | ✅ | `POST /reply` (text only) | 30d after review live (~44d from checkout) | ~500 |
| Booking.com | ✅ | `POST /reply` (text only) | 30d after checkout | ~1000 |
| Direct | N/A (no external API) | Copy to clipboard | — | Unlimited |

### 5.5 Airbnb Double-Blind

Channex field `is_hidden` = true while double-blind window is active. Guest review becomes visible when:

1. **Host submits their review** (sets `is_hidden: false` via `POST /guest_review`)
2. **14 days pass since checkout** (auto-reveal, handled locally)

```ts
isGuestReviewHidden(record):
  if source !== 'airbnb' → false
  if host_review_id exists → false (host submitted)
  if !record.is_hidden → false (Channex says visible)
  if daysSinceCheckout >= 14 → false (auto-revealed)
  → true (hidden)
```

---

## 6. Tag System (Channex: ~80+ codes)

### 6.1 Guest Review Tags (inbound, read-only)

Channex returns tags on Airbnb reviews only. Displayed as colored chips in DetailGuestPanel:

- **Positive** (green, icon `check`): `spotless_furniture`, `responsive_host`, `clear_instructions`, `peaceful`, `walkable`, etc.
- **Negative** (red, icon `alert-triangle`): `dirty_or_dusty`, `needs_maintenance`, `noisy`, `slow_to_respond`, etc.

Max 4 visible by default, "+N more" expand button.

### 6.2 Tag Enrichment (SOR)

When SOR data is missing or sparse, `enrichSorFromTags()` derives signals from Channex tags:

- **Cleaning tags** (negative: `dirty`, `hair`, `stains` → score 2-3; positive: `spotless`, `pristine` → score 4-5)
- **Communication tags** (negative: `slow_to_respond`, `unresponsive` → score 2-3; positive: `always_responsive`, `proactive` → score 4-5)
- **Noise flags**: `noisy` or `quiet_hours` tags → auto-generate `HouseRuleFlag` with type=`noise`

Does NOT override existing Stay Report data — only fills gaps.

### 6.3 Host Review Tags (outbound, selectable)

22 tags across 3 categories, sent in `POST /guest_review` payload:

| Category | Positive | Negative |
|---|---|---|
| **Cleanliness** (8) | Neat & tidy, Good condition, Took care of garbage | Ignored checkout, Excessive garbage, Messy kitchen, Damaged property, Ruined linens |
| **House Rules** (7) | — | Arrived early, Stayed late, Unapproved guests, Unapproved pet, Noise violation, Unapproved event, Smoking |
| **Communication** (7) | Helpful messages, Respectful, Always responded | Unhelpful, Disrespectful, Unreachable, Slow responses |

AI auto-selects tags from SOR during `generateHostReviewDraft()`:
- Clean (≥4, no flags): `neat_and_tidy` + `good_condition` + `respectful` + `always_responded`
- Mixed (≥3): `neat_and_tidy` + `always_responded` + `ignored_checkout_directions` (if flags)
- Problematic (<3): `messy_kitchen` + `excessive_garbage` + flag-specific tags + `slow_responses` (if comms ≤2)

---

## 7. User Flows

### Flow A: Review Feed (Aggregated Feed)

1. PM opens **Review Hub** from sidebar (Operations section)
2. Feed shows 10 reviews per page, sorted by checkout date descending
3. Each row: guest name + nights/guests, property + subtext (unit info for multi-unit), channel badge, checkout date, rating (hidden during double-blind), SOR mini-badges (🧹 Cleaning · 📋 House Rules · 💬 Communication, green/amber/red), status chip
4. **Action buttons** (contextual):
   - "Write Host Review" (AI icon) → if host review window open (Airbnb, 14d)
   - "Reply" (message icon) → if guest review visible + unreplied
   - "View" (eye icon) → everything else
5. Filters: search, status, channel, property (multi-select)
6. Pagination: prev/next + numbered pages + ellipsis, 10 items/page, "N reviews" counter

### Flow B: Host Review of Guest (Airbnb only)

1. PM clicks "Write Host Review" button or opens record in drawer
2. HostReviewPanel shown if:
   - **Already submitted** → readonly "Review Submitted" view
   - **Airbnb double-blind active** → generate/edit view
   - **Booking.com / Direct** → panel hidden (channel doesn't support)
3. PM clicks **Generate Host Review** → ElevAI drafts from SOR data
4. AI returns: public review text, private feedback, 3 ratings (cleanliness/communication/respect_house_rules 1-5), auto-selected tags
5. PM edits text, adjusts ratings (+/- buttons), toggles "Recommend guest?", selects/deselects tags
6. PM clicks **Submit Review** → state updated (`host_review_id`, `is_hidden: false`, tags saved)
7. Once submitted: guest review becomes visible immediately (double-blind lifted)
8. Countdown badge: "Xd remaining" (Airbnb 14 days). Expired: "The 14-day review window has closed."

### Flow C: Reply to Guest Review

1. PM selects a record where guest review is visible + needs reply
2. ReplyPanel shown in drawer (below SOR, above Host Review)
3. PM clicks **Generate Reply Draft** → ElevAI drafts from Stay Report data
4. Grounding indicator: "Referenced: cleaning score X/5, N house rule flags, communication score X/5"
5. Channel-specific constraints shown: "Airbnb: ~500 character limit" / "Booking.com: Management response format"
6. PM edits draft (character counter shown), regenerates if needed
7. **Approve & Post** → state updated (`is_replied: true`, `reply_text`, `reply_posted_at`)
8. For Direct bookings: "Copy to Clipboard" instead of "Post" (no external API)

### Flow D: Auto-Post Settings

1. PM opens Settings sheet from Review Hub page header
2. Two sections with distinct icons:

**Host Review of Guest** (icon: user-check):
- Auto-Post to Airbnb toggle
- Submission delay (1-13 days, NumberField)
- Auto-Select Tags toggle (on = AI populates tags from SOR)

**Reply to Guest Review** (icon: message-circle):
- Airbnb auto-post toggle
- Booking.com auto-post toggle
- Reply delay (0-30 days, NumberField)

**Shared:**
- Master toggle (Enable Review Automation)
- Language (7 options with flags)
- Tone (3 cards: Balanced / Gentle / Data-Driven)
- Generation delay (1-168 hours, NumberField)

---

## 8. AI Generation (ElevAI)

### 8.1 Reply Draft

- **Input**: guest review text + rating + SOR data (cleaning score, house rule flags, communication score)
- **Output**: editable text in a `Textarea`
- **Tone tiers**: Positive (overall ≥8/10) → warm, specific with property detail. Mixed (≥6/10) → acknowledge feedback, mention improvements. Negative (<6/10) → sincere apology, action taken, invite direct contact
- **Grounding**: "Referenced: cleaning score X/5, N house rule flags, communication score X/5"
- **Edge cases**: glowing review → include Stay Report detail to avoid templated response. Negative review + house rule violation → stay professional, don't mention violation in public reply. Complaint already resolved → surface the resolution

### 8.2 Host Review Draft

- **Input**: SOR only (cleaning_score, communication_score, house_rule_flags). Never reads guest review text — respects Airbnb double-blind
- **Output**: `{ publicReview, privateFeedback, ratings, tags }`
- **Rating derivation**: ratings computed directly from SOR scores, not LLM guesswork
- **Tag auto-selection**: positive SOR → positive tags. Flagged SOR → matching negative tags
- **Edge cases**: no SOR data → "Not enough data yet" state. Minor resolved flag → draft reflects resolution. Channel unsupported → panel hidden with explanation

---

## 9. Component Specifications

### 9.1 FeedTable.vue

**Props:** `items: ReviewFeedItem[]`, `page: number`, `pageSize: number`
**Emits:** `select`, `generate`, `update:page`
**Internal:** `pageItems` computed (slice-based pagination), `totalPages` computed

**States:**
- Normal: rows with all columns populated
- Double-blind: rating shows eye-off icon + "Hidden"
- No review left by guest: rating shows "-"
- No reviews at all: Empty state with icon + message
- Pagination visible when `totalPages > 1`

### 9.2 DetailGuestPanel.vue

**States:**
- `reviewHidden && hasGuestReview` → border-dashed "Review hidden until you submit your host review. Or it will auto-reveal 14 days after checkout."
- `reviewHidden && !hasGuestReview` → "Guest has not left a review yet." icon `message-square-dashed`
- Visible with rating: accordion button (overall X/5 or X/10), expand → category grid
- Tags section: positive (green) + negative (red) chips, 4 visible + "+N more"

### 9.3 HostReviewPanel.vue

**States:**
- Channel unsupported (Direct) → "Direct bookings do not support host reviews of guests."
- Expired → "The 14-day review window has closed. Reviews can no longer be submitted."
- No SOR + not generated → "Write Manually" button
- Generating → Loading state (gradient spinner + skeleton placeholders + text)
- Not generated → "Generate Host Review" button
- Generated → Editable form (public review, private feedback, 3 ratings, recommend toggle, 22 tags) + Regenerate + Submit
- Submitted (readonly) → Green "Review Submitted" banner + public review + private feedback + rating display

### 9.4 ReplyPanel.vue

**States:**
- Already replied → Green box with reply text + timestamp
- Not generated → "Generate Reply Draft" button
- Generated → Grounding indicator (blue info box) + Textarea with char counter + Regenerate + Post/Copy

### 9.5 Filters.vue

- Search: `w-[280px]` input with search icon
- Status: Select dropdown (All / Host Review Due / Needs Reply / Replied)
- Channel: Select dropdown (All / Airbnb / Booking.com / Direct)
- Property: `<SharedPropertyPicker>` multi-select
- Clear button: visible when any filter is active

### 9.6 FeedPagination.vue

**Props:** `page: number`, `totalItems: number`, `pageSize: number`
**Emits:** `update:page`
**Logic:** Manual ellipsis window — prev/next buttons disabled at boundaries, page numbers with active highlight, "..." for mid-range gaps

---

## 10. State Management (`useReviewHub`)

```ts
// Reactive stores
reviewRecords: useState<ReviewRecord[]>()
sorRecords: useState<StayOperationalRecord[]>()

// Computed
feedItems:              joins ReviewRecord + enriched Stay Report + hostReview
filteredFeedItems:      filter + sort (checkout desc)
hubStats:               counts per status
getComputedStatus():    ReplyStatus derivation

// Actions
generateReplyDraft(id)  → string
approveReply(id, text)  → sets is_replied + reply_status
generateHostReviewDraft(id) → { text, privateFeedback, ratings, tags }
submitHostReview(id, text, ratings, isRecommended, tags) → sets host_review_id + is_hidden: false

// Helpers
isGuestReviewHidden()       → Airbnb double-blind check
isGuestReviewVisible()      → inverse
getHostReviewCountdown()    → 14d Airbnb / 365d Booking.com
getReplyCountdown()         → 44d Airbnb / 30d Booking.com
enrichSorFromTags()         → tag-derived SOR signals
```

---

## 11. Settings (`useAirbnbReviews.config`)

```ts
interface ReviewAutomationConfig {
  enabled: boolean
  host_language: HostLanguage       // en | de | fr | id | es | it | pt
  tone_mode: ToneMode               // balanced | gentle | data-driven
  strict_mode: boolean

  // Host Review of Guest (Airbnb only)
  auto_post_host_review: boolean
  host_review_delay_days: number    // 1-13
  auto_select_tags: boolean

  // Reply to Guest
  auto_post_replies: {
    airbnb: boolean
    booking_com: boolean
  }
  reply_delay_days: number          // 0-30

  // Shared
  review_delay_hours: number        // 1-168
}
```

Persisted to `localStorage` key `elev8-airbnb-review-config`.

---

## 12. Seed Data Reference (15 records)

Data types and expected coverage for development seed data:

| Channel | Count | Statuses | Special Cases |
|---|---|---|---|
| Airbnb | 5 | needs_reply (3), host_review_pending (1 hidden), needs_reply >14d (1) | double-blind, auto-revealed, tags populated |
| Booking.com | 3 | host_review_pending (2), replied (1) | no tags, 365d window |
| Direct | 2 | replied (1), needs_reply with host review (1) | guest left no review, host review previously submitted |
| Additional | 5 | needs_reply (4), replied (1) | no Stay Report attached, French/German language detected, pagination fillers |

**Stay Report coverage:** 10 records with cleaning (2-5), house rule flags (0-3), communication (3-5). 5 records have no Stay Report (used to test tag enrichment).

---

## 13. Acceptance Criteria

- [ ] PM can view all guest reviews (OTA + Direct) in one paginated feed, filterable by property/channel/status
- [ ] Each review row shows SOR mini-badges (cleaning, house rules, communication) with color coding
- [ ] PM can click a row to open detail drawer with guest review + SOR + reply + host review panels
- [ ] Guest review panel shows Channex tags as colored chips (positive green, negative red)
- [ ] Airbnb double-blind: guest review hidden until host submits OR 14 days pass (auto-reveal)
- [ ] PM can generate AI reply draft, edit it, and post it
- [ ] PM can generate AI host review draft (Airbnb only), grounded in SOR, never reading guest review text
- [ ] Host review includes editable public review + private feedback + 3 ratings + recommend toggle + 22 tags
- [ ] AI auto-selects host review tags from SOR signals on generation
- [ ] SOR data enriched from Channex tags when housekeeping data is missing
- [ ] 3 computed statuses: Host Review Due / Needs Reply / Replied
- [ ] Contextual action buttons per row: Write Host Review / Reply / View
- [ ] Settings sheet: separate Host Review auto-post (Airbnb) and Reply auto-post (Airbnb + Booking.com)
- [ ] Pagination: 10 items/page, prev/next + numbered pages + ellipsis, "N reviews" counter
- [ ] Empty state: icon + message when no reviews match filters
- [ ] Real Channex API integration for GET /reviews, POST /reply, POST /guest_review
- [ ] Real LLM integration for draft generation
- [ ] Cross-tenant guest reputation scoring
- [ ] House rule flag capture via Elev8 Go

---

## 14. Definition of Done

**Per feature:**
1. TypeScript types align with Channex API data structures
2. Component handles all states: loading, empty, error, submitted, expired, unsupported
3. Toast feedback on every user action (create, submit, toggle, regenerate)
4. Confirmation dialogs for destructive actions (not yet needed for Review Hub)
5. Filter state persists within session (page component)
6. Pagination handles any dataset size
7. No auto-post without explicit PM action (V1 rule)

**Per PR:**
1. `npx nuxi typecheck` passes
2. `npx nuxi build` succeeds
3. CLAUDE.md updated with full module documentation
4. Commit pushed with co-author trailer
5. Feature branch PR'd to main

---

## 15. Dependencies & Open Questions

| # | Question | Status |
|---|---|---|
| 1 | Can Channex post replies programmatically? | ✅ Yes: `POST /reviews/:id/reply` |
| 2 | Does Channex expose per-category scores? | ✅ Yes: `scores[]` array, 0-10 normalized |
| 3 | Can Channex post host reviews? | ✅ Yes: `POST /reviews/:id/guest_review` (Airbnb only) |
| 4 | Does Channex expose review tags? | ✅ Yes: `tags[]` (~80+ for Airbnb, empty for Booking.com) |
| 5 | Does Channex handle double-blind? | ✅ Yes: `is_hidden` flag |
| 6 | House rule flag capture (Elev8 Go) | ❌ Not yet implemented — dependency for full SOR |
| 7 | Real LLM integration | ❌ Pending — currently uses structured draft generation |
| 8 | Booking.com host reviews | ❌ Channex doesn't support — per PRD, panel hidden |

---

## 16. File Inventory

```
app/
├── pages/reviews.vue
├── components/review-hub/
│   ├── DetailDrawer.vue
│   ├── DetailGuestPanel.vue
│   ├── DetailSorPanel.vue
│   ├── FeedPagination.vue
│   ├── FeedTable.vue
│   ├── Filters.vue
│   ├── HostReviewPanel.vue
│   ├── MiniBadges.vue
│   ├── ReplyPanel.vue
│   ├── SourceBadge.vue
│   ├── StatusChip.vue
│   └── data/
│       ├── types.ts
│       ├── mock-review-records.ts
│       └── mock-sor.ts
├── components/settings/AirbnbReviewConfig.vue
├── composables/useReviewHub.ts
├── composables/useAirbnbReviews.ts
├── components/airbnb-reviews/
│   ├── data/reviews.ts (ReviewAutomationConfig, ReviewRatings)
│   └── PreviewDialog.vue
└── components/shared/
    ├── AiIcon.vue
    └── PropertyPicker.vue
```
yPicker.vue
```
vue
```
