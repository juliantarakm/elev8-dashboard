# PRD: Review Hub — ElevAI-Powered Guest Review & Response Center

**Status:** Draft v1
**Owner:** Juli (Product)
**Module:** New nav item under Operations, web (Cockpit) + read-only in Elev8 Go (V2)
**AI Engine:** ElevAI (extends the existing AI guest-communication engine)

---

## 1. Problem Statement

Property managers on Elev8 today have three disconnected sources of truth about a stay:

1. What the **guest says** about the property (OTA reviews on Airbnb/Booking.com, plus nothing structured for direct bookings).
2. What **actually happened operationally** (cleaning quality, house rules, communication log) already lives inside Elev8, but scattered across Cleanings, Guest Inbox, and Tasks.
3. What the **host says back** (review replies, or a review of the guest) is written from memory, hours or days after checkout, with no data to back it up.

Result: replies are generic ("Thank you for staying with us!"), host-reviews-of-guests default to lazy 5 stars (industry-wide pattern, see Section 10), and PMs have no defensible record when a guest review is unfair or when a deposit dispute needs evidence.

**Review Hub closes this loop:** it aggregates every guest review in one place, and uses the operational data Elev8 already collects during the stay to draft an honest, specific response — as a reply to the guest, or as the host's own review of the guest.

---

## 2. Feature Summary

| Sub-feature | What it does |
|---|---|
| **Aggregated Review Feed** | One list of every guest review across **all channels** (Airbnb, Booking.com via Channex sync) **and** direct bookings (native post-stay survey), per property/listing. |
| **Stay Operational Record (SOR)** | Auto-compiled per reservation from 3 signals: Cleaning Rating, House Rules Compliance, Communication Quality. This is the "ground truth" the AI drafts from. |
| **AI Reply to Guest Review** | ElevAI drafts a public reply to the guest's review, grounded in the SOR, matching each channel's tone/length rules. Always requires PM approval before posting (V1). |
| **AI Host Review of Guest** | ElevAI drafts the host's own review of the guest (where the channel supports it, e.g. Airbnb), based purely on the SOR — written blind, without reading the guest's own review (see Edge Cases, double-blind window). |

---

## 3. Scope

**In scope (V1):**
- Aggregated feed of OTA + native reviews
- SOR data model and computation (cleaning, house rules, communication)
- AI-drafted reply to guest review
- AI-drafted host review of guest
- Human-in-the-loop approval for every AI output (no auto-post in V1)
- Cockpit web UI only

**Out of scope (V1, flag for roadmap):**
- Elev8 Go mobile UI for Review Hub (read-only digest at most)
- Auto-posting without PM approval
- Cross-tenant guest reputation scoring (see Section 10, future opportunity)
- IoT-triggered house rule flags via Elev8 Bridge (worth a fast-follow, see Open Questions)

---

## 4. Roles & Access

| Role | Access |
|---|---|
| **Admin / General Manager** | Full: view, edit AI drafts, post reply, submit host review, configure automation rules |
| **Guest Experience Manager** | Full: view, edit AI drafts, post reply, submit host review (primary daily user) |
| **Quality Manager** | Read-only: reviews, SOR, trend analytics. No posting rights (consistent with existing read-only pattern) |
| **Back Office** | View SOR (cleaning + house rules only, since they already touch Cleaning/Tasks). No review posting |
| **Housekeeping Manager** | Feeds data only: rates cleanings, logs house rule flags found during turnover. No visibility into guest reviews (avoids defensiveness bias in ratings) |
| **Housekeeping (staff)** | App-only: can flag a house rule issue at checkout (e.g. "found extra bedding, evidence of more guests than booked") via Elev8 Go |
| **Owner** | Read-only trend widget on Dashboard (aggregate rating over time), no per-review detail |

**Note:** Housekeeping staff having zero visibility into the guest's review is intentional — it keeps their cleaning ratings and house-rule flags honest and unbiased, rather than retaliatory or defensive.

---

## 5. Feature Deep-Dive A — Aggregated Review Feed

### Recommended User Flow
1. PM opens **Reviews** in Cockpit sidebar (new nav item, Operations section).
2. Feed shows one row per reservation with a review: guest name, property/listing, channel icon (Airbnb / Booking.com / Direct), overall guest rating, review snippet, SOR mini-badges (🧹 Cleaning · 📋 House Rules · 💬 Communication, color-coded green/amber/red), and status chip (**Needs Reply** / **Replied** / **Guest Review Pending** / **Host Review Due in Xd**).
3. Filters: by property, channel, rating range, status, date range.
4. Click a row → detail drawer opens (guest review left, SOR right, AI draft panel bottom — see Flows B & C).

### System Logic
- Reviews ingested two ways:
  - **OTA:** webhook/poll via Channex sync (same pipe already used for calendar/pricing) → normalize Airbnb/Booking.com review payloads into a common `ReviewRecord` schema.
  - **Direct bookings:** native post-stay survey link sent via Dynamic Templates (X days after checkout) → guest fills a lightweight form (overall + 3 category stars + free text) hosted on Elev8's guest-facing pages (same infra as Guest Guide).
- `ReviewRecord`: `{ id, reservation_id, source, guest_rating_overall, guest_rating_categories, guest_review_text, review_received_at, language_detected, reply_status, reply_text, reply_posted_at }`

### Edge Cases
- Multi-room bookings: one guest, multiple rooms → aggregate SOR badges show the **worst-case** signal, not the average (a missed house rule flag in one room shouldn't be diluted).
- Guest edits their review after a reply was already posted → flag row as "Review updated" and prompt PM to re-check the reply, don't auto-regenerate silently.
- Cancelled/no-show reservations → excluded from feed entirely, no SOR computed.
- Review language isn't English or Bahasa Indonesia → still ingest and display; AI drafting still works (see Flow B), but flag detected language in the UI so PM isn't confused reading a Thai review.

### Notification Implications
- New guest review synced → notify Guest Experience Manager + Admin (role + property-scoped, matches existing assignment model).
- No push to Housekeeping roles — they aren't part of this loop.

### Operational Risks
- Channex may not expose category-level guest ratings for all channels — treat `guest_rating_categories` as optional/nullable, don't assume it's always populated (flagged as Open Question, Section 13).
- Volume risk: a portfolio operator with 100+ units generates a lot of reviews — feed needs pagination/virtualization from day one, not a V2 fix.

---

## 6. Feature Deep-Dive B — AI Reply to Guest Review

### Recommended User Flow
1. PM opens a review row with status **Needs Reply**.
2. Drawer shows: guest's review (left) + SOR (right, with drill-down links: cleaning checklist, message thread, house rule flags if any).
3. PM clicks **Generate Reply Draft**.
4. ElevAI returns an editable draft in a text box, plus a **grounding indicator**: "Referenced: cleaning score 9.2/10, 0 house rule flags, avg response time 12 min" — or "⚠ Limited data — draft is general" if SOR is sparse.
5. PM edits if needed, then:
   - If channel supports API reply posting → **Post Reply** button (explicit action, always requires this manual click — never auto-posted).
   - If not supported → **Copy to Clipboard** + a link/instruction to paste into the OTA's native reply box.
6. Status updates to **Replied**, timestamp logged.

### System Logic
- Prompt assembly = Elev8 brand voice (customer-support tone: calm, solution-oriented, helpful) + channel constraints (Airbnb ≈500 char limit, Booking.com more formal "management response" tone, Direct = no limit) + guest review text + SOR JSON.
- AI is explicitly instructed to **never invent facts** — if SOR has no data for a claim the guest makes, the draft acknowledges generally rather than fabricating specifics.
- If SOR contradicts the guest positively (guest says "dirty room," cleaning score was 9.5/10 with photo evidence) — draft handles this diplomatically (acknowledge feedback, note the standard maintained, invite the guest to reach out directly) rather than arguing publicly.

### Edge Cases
- Guest review is glowing (5 stars, no complaints) → draft should still be specific, not just "Thank you!" — pull one real detail from SOR (e.g., fast communication) so it doesn't read as a template.
- Negative review with a **confirmed** house rule violation by the guest (e.g. extra guests) → reply must stay professional and public-appropriate; internal violation details belong in Flow C / deposit workflow, not in the public reply.
- Guest review contains a complaint that was **already resolved during the stay** (e.g., AC fixed same day per message log) → draft should surface this resolution, it's the single most credibility-building thing SOR data enables.

### Notification Implications
- "AI draft ready" notification fires as soon as generation completes (near-instant after review sync) — this is the core time-saving hook, don't make PM wait or dig for it.
- Negative reviews (1–2 stars) get a higher-priority notification (push/email vs in-app only) — reputational damage compounds with reply delay.

### Operational Risks
- If Elev8 can't post replies programmatically for a given channel (needs confirmation, see Open Questions), the value proposition shifts from "one-click resolve" to "draft + copy," which is still useful but weaker — set expectations accordingly in the PRD and in-app copy.
- Over-editing risk: if PM always heavily rewrites the draft, it signals the SOR data or prompt needs tuning — track edit-distance between draft and posted reply as a quality metric from day one.

---

## 7. Feature Deep-Dive C — AI Host Review of Guest

### Recommended User Flow
1. Triggered automatically at checkout completion (doesn't wait for the guest's own review — see System Logic on double-blind).
2. ElevAI drafts a review of the guest using **SOR only**: cleaning left behind, house rules adherence, communication quality.
3. Draft appears in the guest's reservation record with a countdown badge ("Submit within 11 days" for Airbnb's 14-day window, channel-dependent).
4. PM reviews, edits, submits via **Submit Review** (posts to the channel that supports it — currently Airbnb; Booking.com and Direct bookings don't have an equivalent guest-review mechanic, so the drawer reflects that instead of showing a dead button).
5. If unedited/unsubmitted as deadline approaches, reminder notification fires (see Notifications).

### System Logic
- **Hard rule: the AI must not read the guest's own review text when drafting the host's review of the guest**, even if it's already visible to the PM for other reasons. This respects Airbnb's double-blind review design (intended to prevent retaliatory reviews) and keeps the host's review honest rather than reactive.
- Draft includes calibrated category sub-scores (Cleanliness left behind, Communication, House Rules adherence) computed directly from SOR, not from the AI "guessing" a fair-sounding number — this is the core differentiator vs. the industry default of blind 5-star auto-reviews (Section 10).

### Edge Cases
- No SOR data at all (e.g. self-check-in, no messages exchanged, cleaning not yet rated) → don't force a draft; show "Not enough data yet" and let PM write manually, or delay generation until cleaning is rated.
- Guest was flagged for a house rule violation but it was minor and resolved amicably (extra guest disclosed and paid for on-site) → draft should reflect resolution, not just flag the violation in isolation — otherwise good guests get unfairly dinged.
- Channel doesn't support guest reviews at all (Booking.com, Direct) → drawer should say so plainly rather than showing a non-functional draft.

### Notification Implications
- Reminder at a fixed point before the review window closes (e.g. Airbnb: remind at day 10 of 14) — missed windows mean no review submitted at all, which hurts both the operator's own quality signal and the broader guest-vetting ecosystem hosts rely on.
- No urgency tier needed here (unlike Flow B) — this isn't public-facing or reputational in the same way, it's a housekeeping task with a deadline.

### Operational Risks
- Legal/policy risk: reviewing a guest based on internal ops data that the guest never sees or can contest is a fairness question worth a policy note (e.g. don't publish anything the PM couldn't defend if asked) — flagged for legal/trust & safety input, not just engineering.
- If SOR data is wrong (e.g. a housekeeping rating logged against the wrong reservation on a same-day turnover), a bad guest review goes out based on bad data — data integrity here matters more than in Flow B, since it affects a real person's platform reputation.

---

## 8. Stay Operational Record (SOR) — Data Model

```
StayOperationalRecord {
  reservation_id
  cleaning_score          // 0–10, from Cleanings module post-checkout rating
  cleaning_notes          // free text, from Extrasauber field / checklist notes
  cleaning_duration_delta // actual vs. estimated turnover time
  house_rule_flags[]      // see below
  communication_score     // 1–5, computed
  communication_summary   // AI-generated 2–3 sentence summary of the thread
  computed_at
}

HouseRuleFlag {
  id, reservation_id
  type        // extra_guest | unregistered_pet | smoking | noise | damage | early_late_unapproved | other
  severity    // low | medium | high
  evidence_url  // optional photo, uploaded via Elev8 Go
  reported_by   // housekeeping | pm | smart_lock_log | guest_inbox
  reported_at
  resolution_status // open | resolved_onsite | disputed
}
```

**Dependency flag:** the House Rules Flag log **does not exist yet** in Elev8 today — this PRD assumes it as a net-new, lightweight capture point (most likely a "Flag Issue" action added to the Elev8 Go cleaning-complete flow, plus an optional trigger from Smart Lock/Bridge access logs for occupancy mismatches). This needs its own small spec before Review Hub can ship — see Open Questions.

---

## 9. Time-Based Automation Rules

| Trigger | Action | Timing |
|---|---|---|
| OTA review synced via Channex | Compute SOR (if not cached) → generate reply draft → notify | Near-real-time, target <5 min |
| Direct booking checkout +3 days | Send native review survey link to guest | Configurable per tenant, default 3 days |
| Reservation checkout completed | Generate host-review-of-guest draft (SOR permitting) | Same day as checkout |
| Host review window at 70% elapsed | Reminder notification if still unsubmitted | e.g. day 10 of 14 for Airbnb |
| Negative review (≤2★) synced | High-priority notification (push/email, not just in-app) | Immediate |
| Guest review edited post-reply | Flag row, notify assigned PM | Immediate |

---

## 10. Monetization & Strategic Opportunities

- **Deposit/damage evidence pipeline:** a `HouseRuleFlag` with photo evidence is exactly the documentation needed to justify a deposit deduction. Direct integration point with the **Payment Request module (PP-109)**: a "Create Payment Request" shortcut from a flagged incident, pre-filled with evidence — turns an honesty feature into a direct revenue-recovery tool for operators.
- **Tiering lever:** AI-drafted replies/reviews are a natural Growth/Pro plan differentiator, or a metered add-on (X AI review actions included, credits beyond that) — consistent with Elev8's existing per-unit/per-booking monetization patterns.
- **Direct booking flywheel:** better, faster, more specific review replies improve OTA search ranking (Airbnb and Booking.com both factor host responsiveness into ranking) and can be surfaced as a trust widget on the **Websites** module — reinforces the "reduce OTA dependency" positioning that's core to Elev8's brand voice.
- **Future opportunity (not V1):** a cross-tenant guest reputation signal (with clear consent/privacy boundaries) — flagging guests with a pattern of house rule violations across multiple Elev8-managed properties. High value, high sensitivity — worth a dedicated discovery pass before scoping, not something to bolt onto V1.

---

## 11. Real-World PMS Benchmarking

| Platform | Pattern | How Review Hub differs |
|---|---|---|
| **Hospitable / OwnerRez** | Common pattern: auto-submit a blind 5-star guest review immediately at checkout, purely to avoid the double-blind friction (host reviews first so guest isn't "waiting" on them). | Review Hub explicitly rejects this — it's honest-by-design, grounded in real SOR data, not a default 5-star autopilot. This is a differentiator worth stating clearly if this ever becomes marketing copy. |
| **Hostaway** | AI-assisted reply suggestions exist, but generic (based on review sentiment + templates, not the PM's own operational data). | Review Hub's replies are grounded in the property's own cleaning/comms/house-rules data — genuinely specific, not templated. |
| **Guesty** | Review aggregation across channels exists; no AI-drafted host-review-of-guest feature is a standard offering. | Two-directional (reply + host review) in one flow is uncommon — worth confirming this stays a stated differentiator through build, not just at spec time. |

*Note: I'm reasonably confident on the Hospitable/OwnerRez blind-5-star pattern as a known industry behavior, but competitor feature sets change fast — worth a quick live check before this goes into any external-facing positioning doc.*

---

## 12. Acceptance Criteria

- [ ] PM can view all guest reviews (OTA + Direct) for their assigned properties in one feed, filterable by property/channel/rating/status.
- [ ] Every review row shows SOR mini-badges (cleaning, house rules, communication) with drill-down to source data.
- [ ] PM can generate an AI reply draft grounded in SOR, edit it, and either post it (where API-supported) or copy it (where not).
- [ ] PM can generate an AI host-review-of-guest draft, grounded in SOR only (never the guest's own review text), edit it, and submit it where the channel supports guest reviews.
- [ ] No AI output posts anywhere without explicit PM action — zero auto-post in V1.
- [ ] Reminder notification fires before the host-review submission window closes.
- [ ] Housekeeping-role users can log a house rule flag (with optional photo) from Elev8 Go at cleaning completion.
- [ ] Reviews for cancelled/no-show reservations are excluded from the feed.

---

## 13. Dependencies & Open Questions

1. **Channex API capability** — can Elev8 post review replies programmatically for Airbnb/Booking.com, or is this read-only sync? This determines whether Flow B ends in "Post" or "Copy." *Needs verification with Channex, not assumed.*
2. **Airbnb category ratings** — does the API expose per-category guest ratings (cleanliness/communication/house rules) to hosts, or only the overall score? Affects how much of `guest_rating_categories` we can actually populate. *Needs verification.*
3. **House Rules Flag capture** — this is net-new. Does it live in Elev8 Go as a manual flag, get auto-triggered from Smart Lock/Bridge occupancy signals, or both? Needs its own mini-spec before this PRD can be considered build-ready.
4. **Auto-post threshold (V2)** — should high-confidence, no-issue reviews (5★, full SOR, zero flags) ever be eligible for auto-post to save PM time? Recommend keeping human-in-the-loop for all of V1 and revisiting with real edit-distance data.
5. **Legal/trust & safety review** — host-review-of-guest based on internal data the guest can't see or contest deserves a policy sign-off, not just an engineering spec.

---
