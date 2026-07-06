# 3CX Telephony Integration — V1 (Mock)

**Status:** Mock implementation matching PRD-3CX-Integration.md
**Date:** 2026-07-06
**Scope:** Settings > Integrations (connection setup) + Inbox (call handling)

---

## What ships in V1

The PRD asked for native 3CX call handling inside Elev8 Inbox. V1 ships the **full UI, state, and event pipeline** against mocked 3CX events. The OAuth flow, webhook subscription, and matching logic are all wired and tested with simulated data. The real PBX webhook receiver is deferred until the PBX version is confirmed (Open Question #1).

## Architecture

### Composables

- `app/composables/useThreeCX.ts` — account + extension mapping + OAuth flow
- `app/composables/useThreeCxCalls.ts` — call event pipeline, screen-pop queue, async transcription job

Both persist to `localStorage` so call history survives page reload.

### Types added (in `app/components/inbox/data/conversations.ts`)

```ts
type PhoneCallStatus = 'completed' | 'missed' | 'voicemail'
type TranscriptionState = 'idle' | 'processing' | 'done' | 'failed'

interface PhoneCall {
  // ... existing fields
  transcriptionState?: TranscriptionState
  transcriptionError?: string
  extensionNumber?: string
  staffId?: string
}
```

### Components

- `app/components/settings/ThreeCxIntegration.vue` — connect card + extension mapping table
- `app/components/inbox/CallsView.vue` — flat filterable call log
- `app/components/inbox/CallScreenPop.vue` — incoming-call toast
- `app/pages/settings/integrations/3cx/callback.vue` — OAuth callback page

### Layout integration

- `app/components/inbox/Layout.vue` — adds Conversations/Calls view toggle, mounts screen-pop, adds 3CX card to integrations sheet
- `app/components/inbox/Thread.vue` — call-back button + Processing/Failed transcript UI + Retry
- `app/components/inbox/ReservationGuest.vue` — click-to-call icon
- `app/components/inbox/ReservationPanel.vue` — now reads from `useThreeCxCalls` so live calls appear in the activity feed

## Connection flow

1. Admin opens Settings > Integrations, clicks "Connect with 3CX"
2. Enters PBX FQDN (`elevate.3cx.asia` format) — validated against a hostname regex
3. OAuth redirect URL generated → real OAuth handshake is gated on PRD Open Question #1 (PBX version), so V1 simulates the redirect and goes straight to callback
4. Callback page mints mock access/refresh tokens, registers webhook subscriptions (`call.ringing`, `call.answered`, `call.ended`, `call.missed`, `call.voicemail`)
5. Admin can then map each `StaffMember` to a 3CX extension in a search-filterable table

## Call event pipeline (mocked)

- `simulateInboundCall({ fromNumber, toExtension, outcome })` — matches the caller against existing reservations by comparing the last 9 digits of the phone number
- Match found: creates a `PhoneCall` on the conversation, fires `startScreenPop` to the extension's assigned staff, and (if completed) kicks off the transcription job
- No match: pushes an `UnmatchedCall` to the queue (mirrors the existing `unmatchedMessages` pattern from WhatsApp)
- Missed/voicemail outcomes auto-flip `Conversation.status = 'action_needed'` and bump `unreadCount`

## Click-to-call

- Button next to the phone number on `ReservationGuest.vue` and on the Calls-tab call-back card
- Calls `simulateOutboundCall({ fromExtension, toNumber, staffId, conversationId })` which creates a completed `PhoneCall` with a placeholder `recording_url` and triggers the transcription job
- Disabled with a "Connect 3CX in Settings" hint when no account is connected

## Transcription job (mocked)

- Only runs when `recording_url` is present on the call
- Target turnaround: `min(duration * 2s, 10min)`, with a 1.5s minimum
- 8% random failure rate — `transcriptionState: 'failed'` with a retry button on the call card
- On success: writes canned `transcript` and `summary` text (Indonesian) from internal samples
- No recording → `transcript`/`summary` stay empty (per PRD Section 7) — never shows a stuck "Processing" state

## Screen-pop

- Bottom-right toast that appears on matched inbound calls
- Auto-targeted to the extension's assigned staff (via `getStaffForExtension`); defaults to current user (`staff-2`) if the extension has no owner
- "Open conversation" jumps to the conversation and dismisses the pop
- "Dismiss" closes only this pop

## Call Log view

- New `inboxView: 'calls'` option — toggles between Conversations and Calls views in the inbox header
- Filter bar: status, staff, listing, date range (default `last-7-days`), free-text search
- Status strip: `N matched · X completed · Y missed · Z voicemail · W unmatched`
- Unmatched section: dashed amber card with Match (opens searchable conversation picker) and Dismiss actions
- Click a matched row → switches to Conversations view with the conversation selected

## What did NOT ship

- **Real 3CX webhook receiver** — gated on PBX version confirmation (Open Question #1)
- **Real OAuth exchange** — V1 simulates the redirect and skips the actual 3CX authorization page
- **Real STT/transcription provider** — canned text only, provider selection pending (Open Question #6)
- **Recording playback** — `recording_url` is a placeholder; no actual audio file served
- **Per-listing or per-staff analytics** — out of scope per PRD Section 3 (Call Log is a flat list, not a metrics dashboard)
- **Elev8 Go (mobile) call support** — out of scope per PRD Section 3
- **Outbound campaign / power dialer** — out of scope per PRD Section 3
- **SMS via 3CX** — out of scope per PRD Section 3 (WhatsApp already covers messaging)

## PRD acceptance criteria — coverage

- [x] Admin can connect a 3CX account from Settings > Integrations and map staff to extensions
- [x] Disconnecting stops new ingestion and preserves call history
- [x] Inbound call from a matching number triggers a screen-pop before/as the call is answered
- [x] Inbound call from an unrecognized number lands in an Unmatched Calls queue
- [x] Calls view in Inbox shows every call, filterable by status, staff, listing, date range
- [x] Clicking a matched row opens the underlying conversation; unmatched row opens match/assign
- [x] Click-to-call from reservation/guest panel, bridges through staff's extension first
- [x] Every completed/missed/voicemail call produces a `PhoneCall` record
- [x] Missed calls and voicemails mark the conversation as `action_needed`
- [x] Recording link visible in the Calls tab (placeholder URL until real recordings ship)
- [x] Transcript and summary populate on the call record within the target window
- [x] Calls without a recording never show a stuck "Processing" state
- [x] Failed transcription doesn't block the underlying call record, manual retry available
