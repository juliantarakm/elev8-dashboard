# WhatsApp Integration — UI Spec

> **Status**: Implemented (mock/demo only — no real Meta API)
> **AI branding**: ElevAI (sparkle icon, gold `#FBC800`), NOT "HostBuddy"

---

## Phase 1: Settings → Integrations → WhatsApp

Route: `/settings/integrations` (sidebar nav + main menu under Settings)

### 1.1 WhatsApp Connection Card (Disconnected State)

```
┌─────────────────────────────────────────────────────────┐
│  WhatsApp Business                                      │
│                                                         │
│  Connect your WhatsApp Business number to send and      │
│  receive guest messages directly through Elev8.         │
│                                                         │
│  ┌─────────────────────────┐                            │
│  │  Connect WhatsApp  →    │                            │
│  └─────────────────────────┘                            │
│                                                         │
│  ℹ️ You'll need a WhatsApp Business Account.            │
│     Meta will charge you directly for conversations.    │
└─────────────────────────────────────────────────────────┘
```

- Badge: grey (`bg-slate-100 text-slate-600`) with red dot (`bg-red-500`)
- Button triggers simulated Meta Embedded Signup flow

### 1.2 Meta Embedded Signup Flow (Simulated)

1. User clicks "Connect WhatsApp"
2. Simulated delay (1.5s)
3. Connection state updates to connected
4. Card switches to Connected state

### 1.3 WhatsApp Connection Card (Connected State)

```
┌─────────────────────────────────────────────────────────┐
│  WhatsApp Business                 ● Connected           │
│                                                         │
│  Phone Number    +49 170 1234567                        │
│  Business Name   Zum Grauen Wolf                        │
│  Connected       June 15, 2026                          │
│  Status          ● Active                               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Disconnect  │  │  Test Send   │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

- Badge: green dot (`bg-emerald-500`)
- "Test Send" button → opens WhatsAppSendModal with a test template

### 1.4 Disconnect Confirmation Dialog

```
┌─────────────────────────────────────────────┐
│  Disconnect WhatsApp?                       │
│                                             │
│  This will:                                 │
│  • Stop all automated WA messages           │
│  • Remove your connection credentials       │
│  • Existing conversation history remains    │
│                                             │
│  ┌────────────┐  ┌─────────────────────┐   │
│  │   Cancel   │  │  Yes, Disconnect    │   │
│  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

- Uses shadcn `Dialog` component
- Destructive button uses `variant="destructive"` (red styling, no emoji)

### 1.5 Routing Rules (Visible Only When Connected)

Shown below the connection card only when `isConnected === true`.

```
┌─────────────────────────────────────────────────────────────────┐
│  WhatsApp Routing Rules                          [+ Add Rule]   │
│                                                                 │
│  Rules are evaluated top-to-bottom. First match wins.           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ≡  Rule 1: Complaint Keywords → Staff          ● Active │    │
│  │    If message contains: complaint, refund, angry,       │    │
│  │    emergency, manager, unhappy                          │    │
│  │    → Route to: Staff inbox (pause AI)                   │    │
│  │                                        [Edit] [Delete]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ≡  Rule 2: Low AI Confidence → Review          ● Active │    │
│  │    If ElevAI confidence < 60%                           │    │
│  │    → Route to: Staff inbox for review                   │    │
│  │                                        [Edit] [Delete]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ≡  Rule 3: After Hours → AI Only               ● Active │    │
│  │    If time is 22:00–07:00                               │    │
│  │    → Route to: ElevAI (no escalation)                   │    │
│  │                                        [Edit] [Delete]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ≡  Rule 4: Default                             ● Active │    │
│  │    All other messages                                   │    │
│  │    → Route to: ElevAI (auto-reply)                      │    │
│  │                                              [Edit]     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

- Grip icon (`i-lucide-grip-vertical`) is decorative only — no drag reorder
- Default rule has no Delete button (`v-if="!rule.isDefault"`)
- Active toggle uses shadcn `Switch`

### 1.6 Add/Edit Rule Dialog

```
┌─────────────────────────────────────────────────────────┐
│  Edit Routing Rule                                      │
│                                                         │
│  Rule name: ┌────────────────────────────────────┐      │
│             │ Complaint keywords              │      │
│             └────────────────────────────────────┘      │
│                                                         │
│  Condition: ┌────────────────────────────────────┐      │
│             │ Keywords in message            ▼  │      │
│             └────────────────────────────────────┘      │
│                                                         │
│  Keywords: ┌────────────────────────────────────┐       │
│            │ complaint, refund, angry, manager  │       │
│            └────────────────────────────────────┘       │
│                                                         │
│  Route to: ┌────────────────────────────────────┐       │
│            │ Staff inbox (pause AI)          ▼  │       │
│            └────────────────────────────────────┘       │
│                                                         │
│  ┌────────────┐  ┌──────────────┐                      │
│  │   Cancel   │  │  Save Rule   │                      │
│  └────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

- Uses shadcn `Select` dropdowns (NOT radio buttons)
- Has a "Rule name" input field (not in original spec wireframe)
- Condition types: Keywords in message, AI confidence below threshold, Time of day, Guest language, Reservation status
- Route to options: Staff inbox (pause AI), Specific staff member, ElevAI (auto-reply), ElevAI + notify staff

---

## Phase 2: Outbound — Template Messages

### 2.1 Send WhatsApp Modal

Accessible from:
- **Reservation Panel** — "Send WhatsApp" button (green, WhatsApp icon)
- **Thread view** — when 24h window is expired (fallback from reply box)
- **Test Send** button on connection card

```
┌─────────────────────────────────────────────────────────┐
│  Send WhatsApp to Max Müller                            │
│  +49 170 1234567                                        │
│                                                         │
│  Template:  ┌──────────────────────────────────┐        │
│             │ Select template...           ▼   │        │
│             └──────────────────────────────────┘        │
│                                                         │
│  • booking_confirmation                                 │
│  • checkin_instructions                                 │
│  • upsell_early_checkin                                 │
│  • review_request                                       │
│                                                         │
│  Preview:                                               │
│  ┌──────────────────────────────────────────────┐       │
│  │ Hi Max, your check-in at Villa Sunset is     │       │
│  │ tomorrow at 15:00. Here's your guide:        │       │
│  │ https://guide.elev8-suite.com/abc123         │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  ┌────────────┐  ┌──────────────┐                      │
│  │   Cancel   │  │  Send  →     │                      │
│  └────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

- Templates defined in `useWhatsAppTemplates.ts`: `booking_confirmation`, `checkin_instructions`, `upsell_early_checkin`, `review_request`
- Template names are raw IDs (underscore format), not human-readable display names
- Preview renders with mock guest data

### 2.2 Reservation Panel — Send WhatsApp Button

```
┌─────────────────────────────────────────────────────────┐
│  Reservation Panel                                      │
│                                                         │
│  ┌────────────────────────────┐                        │
│  │  📱 Send WhatsApp          │                        │
│  └────────────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

- Single green button with WhatsApp icon (no Email/SMS alternatives)
- Opens WhatsAppSendModal pre-filled with guest data

### 2.3 Message Status (Thread View)

Messages show basic send status — no WhatsApp-style checkmark icons:

- **Sending...** — spinner icon
- **Failed** — alert-circle icon + "Retry" button
- **Sent** — no indicator (default)

> Note: No `✓`/`✓✓` read receipt icons. No dedicated message log panel with delivery status tracking.

---

## Phase 3: Inbound — Inbox & Conversations

### 3.1 Inbox Layout (4-Panel)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Messages                                                                   │
│                                                                             │
│  ┌──────────┬────────────────────────┬──────────────────┬──────────────────┐│
│  │ Nav      │ Conversation List      │ Thread           │ Reservation Panel││
│  │          │                        │                  │                  ││
│  │ Filters  │ ● Max Müller   2m ago  │ Guest name       │ Guest details    ││
│  │ • All    │   Is parking available?│ Stay dates       │ Booking info     ││
│  │ • Action │                        │ Listing name     │ Tabs: Summary/   ││
│  │ • WA     │   Lisa Park     2h ago │                  │ Guest/Activity/  ││
│  │ • Airbnb │   I want a refund!     │ Message thread   │ Tasks/Upsells    ││
│  │ • Bcom   │                        │                  │                  ││
│  │          │   Marcel Weber  1h ago │ Reply box        │ [Send WhatsApp]  ││
│  │          │   Can I check in early?│                  │                  ││
│  └──────────┴────────────────────────┴──────────────────┴──────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **4-panel layout**: Nav | Conversation List | Thread | Reservation Panel (resizable)
- **Channel filter**: inside a "Filters" Popover (NOT inline tabs)
- Available channels: Airbnb, Booking.com, WhatsApp (no Email, no SMS)
- Channel options derived from conversation data via `channelOptions` computed

### 3.2 Nav Filters

- **Show action needed** — boolean toggle (default: ON)
- **My inbox** — assigned to me filter
- **Active stays only** — boolean toggle
- **Unmatched** — stay status filter for unmatched WhatsApp messages
- **Listing filter** — multi-select Popover with search + checkboxes
- **Tag filter** — multi-select Popover with search + checkboxes

### 3.3 Conversation Thread Header

```
┌─────────────────────────────────────────────────────────┐
│  Max Müller                          [Action Needed]     │
│  Jul 5 – Jul 8 │ Villa Sunset                           │
└─────────────────────────────────────────────────────────┘
```

- Guest name (no channel icon prefix)
- Action Needed badge (destructive variant, shown only when `status === 'action_needed'`)
- Stay dates + listing name
- **No phone number**, **no channel icon**, **no window countdown**, **no Claim/View Booking buttons**

### 3.4 Unmatched Messages

Unmatched messages appear as regular conversations in the conversation list with `stayStatus: 'unmatched'`. Filtered via "Unmatched" stay filter in Nav.

```
Conversation List:
┌────────────────────────────────────────┐
│  +62 812 3456789        10m ago        │
│  Unknown property                      │
│  Halo, saya mau booking                │
└────────────────────────────────────────┘

Thread View (action bar):
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Unmatched WhatsApp Message                          │
│                                                         │
│  This message doesn't match any reservation.            │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Match to Guest  │  │  Dismiss         │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

- 3 unmatched conversations seeded (`conv-um-1`, `conv-um-2`, `conv-um-3`)
- Guest name shows phone number, listing shows "Unknown"
- "Match to Guest" opens dialog to search/select existing conversation
- **No separate queue panel**, **no Reply button**

### 3.5 24h Window Expiry Warning

Shown in reply box area when `otaSource === 'WhatsApp' && waWindowExpired`:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Conversation window expired                         │
│                                                         │
│  You can only send template messages now.               │
│  Free-form replies require the guest to message first.  │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │  Send Template Message   │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

- Orange warning styling
- "Send Template Message" button opens WhatsAppSendModal
- **No live countdown timer** — static boolean (`waWindowExpired`)

### 3.6 WhatsApp Not Connected Warning

Shown when `otaSource === 'WhatsApp' && !isConnected` (takes priority over window-expired):

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ WhatsApp not connected                              │
│                                                         │
│  Connect WhatsApp in Settings to reply.                 │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │  Go to Settings          │                           │
│  └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### 3.7 Reply Box

```
┌─────────────────────────────────────────────────────────────────┐
│ [Channel ▼] [Upsell] [Templates ▼]                             │
│ Type your reply...                            [✨ AI] [➤ Send] │
│ Messages will be auto-translated to German                      │
└─────────────────────────────────────────────────────────────────┘
```

- **Channel selector** dropdown (OTA/Email/Guide)
- **Upsell button** — opens UpsellOrderCreator
- **Templates dropdown** — quick templates + scheduled templates
- **AI rewrite button** (sparkle icon) — ElevAI rewrites message
- **Auto-translate indicator** — shows when auto-translate is ON
- **No attachment (📎) button**, **no Note (📝) button**

### 3.8 AI Messages

AI-written messages (`aiWritten: true`) show:
- Sparkle avatar (`lucide:sparkles` in gold circle `bg-[#FBC800]/10`)
- Sender name: "ElevAI"
- "AI" label badge

> Uses `lucide:sparkles` icon, NOT `🤖` robot emoji.

### 3.9 Internal Notes

Notes appear **inline** in the thread with a distinct style:

```
┌─────────────────────────────────────────────────────────┐
│  📌 Checking with maintenance about pool cleaning       │
│     schedule — Komang Juliantara                    14:03│
└─────────────────────────────────────────────────────────┘
```

- Warning-colored bubble (`bg-warning`)
- Sticky-note icon
- Also visible in a separate "Notes" tab in the thread

---

## Phase 4: Media Messages

### 4.1 Inbound Photo

```
┌─────────────────────────────────────────────┐
│ 👤 Lisa Park                         14:01  │
│ ┌─────────────────────┐                     │
│ │                     │                     │
│ │   [Pool Photo]      │                     │
│ │   📷 1200x900       │                     │
│ │                     │                     │
│ └─────────────────────┘                     │
│ "Look at this! The pool is green"           │
└─────────────────────────────────────────────┘
```

### 4.2 Outbound Photo (AI-generated mock)

```
┌─────────────────────────────────────────────┐
│ ✨ ElevAI                            14:35  │
│ ┌─────────────────────┐                     │
│ │                     │                     │
│ │   [Pool Cleaned]    │                     │
│ │   📷 1200x900       │                     │
│ │                     │                     │
│ └─────────────────────┘                     │
│ "Pool has been cleaned. Here's how it       │
│  looks now. Sorry for the inconvenience!"   │
└─────────────────────────────────────────────┘
```

- `mediaUrl` + `mediaDims` fields on Message type
- Camera icon + dimensions shown below image

---

## Component Summary

| Phase | UI Components | Location |
|-------|--------------|----------|
| P1 | Connection card, Disconnect dialog, Routing rules list + editor | Settings → Integrations |
| P2 | Send WA modal (template picker + preview), Send WA button | Reservation Panel, Thread (window-expired) |
| P3 | Inbox 4-panel, Channel filter (in Popover), Unmatched conversations, 24h window warning, Not-connected warning, Media messages, Inline notes | Dashboard → Messages |
| P4 | Routing rules (keywords/confidence/time/language/status) | Settings → Integrations |

---

## Design Tokens / States

### Connection Status Badge
- `● Connected` — green dot (`bg-emerald-500`)
- `● Disconnected` — red dot (`bg-red-500`) on grey badge (`bg-slate-100`)
- No "Pending" state implemented

### Message Send Status
- Sending — spinner icon
- Failed — `alert-circle` icon + "Retry" button
- Sent — no indicator

### Channel Icons (via Icon component)
- WhatsApp — `logos:whatsapp-icon`
- Airbnb — `logos:airbnb`
- Booking.com — `simple-icons:bookingdotcom`
- No Email, no SMS channels defined

### AI Branding
- **ElevAI** — sparkle icon (`lucide:sparkles`), gold `#FBC800`
- NOT "HostBuddy" (internal routing rules use `hostbuddy` as key values but display "HostBuddy" in labels)

### Routing Rules Condition Types
- Keywords in message
- AI confidence below threshold
- Time of day
- Guest language
- Reservation status

### Routing Rules Route-To Options
- Staff inbox (pause AI)
- Specific staff member
- ElevAI (auto-reply)
- ElevAI + notify staff

---

## Composables

| Composable | Purpose |
|-----------|---------|
| `useWhatsApp.ts` | Connection state (`connection`, `isConnected`, `connect()`, `disconnect()`) |
| `useWhatsAppRules.ts` | Routing rules CRUD (`rules`, `saveRule()`, `deleteRule()`, `toggleRule()`) |
| `useWhatsAppTemplates.ts` | Template messages (`waTemplates`, `renderTemplate()`) |

---

## Mock Data

### WhatsApp Conversations
- **conv-wa-1**: Max Müller — normal conversation, Villa Sunset, Jul 5–8
- **conv-wa-2**: Lisa Park — complaint + pool photos, Villa Ocean, Jul 10–14
- **conv-wa-3**: Marcel Weber — window expired, Villa Sunrise, Jul 3–6

### Unmatched Conversations
- **conv-um-1**: +62 812 3456789 — "Halo, saya mau booking"
- **conv-um-2**: +49 151 2345678 — "Hello, is this the right place?"
- **conv-um-3**: +61 400 111222 — "Hi, do you have availability?"

### Default Connection
- Phone: +49 170 1234567
- Business Name: Zum Grauen Wolf
