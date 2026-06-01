# WhatsApp Integration — UI Spec

## Phase 1: Settings → Integrations → WhatsApp

### 1.1 WhatsApp Connection Card (Disconnected State)

```
┌─────────────────────────────────────────────────────────┐
│  🟢 WhatsApp Business                                   │
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

### 1.2 Meta Embedded Signup Flow

1. User clicks "Connect WhatsApp"
2. Meta popup opens (Embedded Signup)
3. User logs into Meta Business account
4. User selects/creates WABA
5. User selects phone number
6. Popup closes → Elev8 receives callback with credentials
7. Elev8 verifies number → shows Connected state

### 1.3 WhatsApp Connection Card (Connected State)

```
┌─────────────────────────────────────────────────────────┐
│  🟢 WhatsApp Business              ● Connected          │
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

### 1.4 Disconnect Confirmation Modal

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
│  │   Cancel   │  │  Yes, Disconnect  🔴│   │
│  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Phase 2: Outbound — Template Messages

### 2.1 Automation Builder — Channel Selection

Existing automation builder gets "WhatsApp" as new channel option:

```
┌─────────────────────────────────────────────────────────┐
│  Send message via:                                      │
│                                                         │
│  ○ Email                                                │
│  ○ SMS                                                  │
│  ● WhatsApp                                             │
│                                                         │
│  Template:  ┌──────────────────────────────────┐        │
│             │ booking_confirmation         ▼   │        │
│             └──────────────────────────────────┘        │
│                                                         │
│  Preview:                                               │
│  ┌──────────────────────────────────────────────┐       │
│  │ Hi {{guest_name}}, your stay at              │       │
│  │ {{property_name}} is confirmed for           │       │
│  │ {{check_in_date}}. We look forward to        │       │
│  │ welcoming you!                               │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Reservation Detail — Send WhatsApp Button

```
┌─────────────────────────────────────────────────────────┐
│  Reservation #4521 — Max Müller                         │
│  Check-in: July 5, 2026 │ Villa Sunset                  │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐      │
│  │  📧 Email │ │  💬 SMS  │ │  📱 Send WhatsApp  │      │
│  └──────────┘ └──────────┘ └────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Send WhatsApp Modal

```
┌─────────────────────────────────────────────────────────┐
│  Send WhatsApp to Max Müller                            │
│  +49 170 9876543                                        │
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

### 2.4 Message Log — Delivery Status

```
┌─────────────────────────────────────────────────────────┐
│  Message History — Max Müller                           │
│                                                         │
│  📱 WhatsApp │ checkin_instructions │ June 4, 14:02     │
│     Status: ✓✓ Read                                     │
│                                                         │
│  📧 Email   │ booking_confirm      │ June 1, 10:30     │
│     Status: Delivered                                   │
│                                                         │
│  📱 WhatsApp │ booking_confirmation │ June 1, 10:15     │
│     Status: ✓ Delivered                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 3: Inbound — Inbox & Conversations

### 3.1 Dashboard → Messages (Inbox)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Messages                                                           │
│                                                                     │
│  [All] [WhatsApp] [Airbnb] [Email]          🔍 Search guests...    │
│                                                                     │
│  ┌───────────────────────────────┬─────────────────────────────────┐│
│  │ Conversations                 │ Max Müller — Villa Sunset       ││
│  │                               │ +49 170 9876543                 ││
│  │ ● Max Müller          2m ago  │                                 ││
│  │   📱 Is parking available?    │ ┌─────────────────────────────┐ ││
│  │                               │ │ 🤖 Hi Max! Yes, Villa       │ ││
│  │   Anna Schmidt        15m ago │ │ Sunset has 2 free parking   │ ││
│  │   📱 Thanks for the info!     │ │ spots. No reservation       │ ││
│  │                               │ │ needed.                     │ ││
│  │   Marcel Weber         1h ago │ └─────────────────────────────┘ ││
│  │   📱 Can I check in early?    │                                 ││
│  │                               │ ┌─────────────────────────────┐ ││
│  │   ⚠️ Lisa Park         2h ago │ │ 👤 Is parking available?    │ ││
│  │   📱 I want a refund!         │ └─────────────────────────────┘ ││
│  │   🔴 Routed to staff          │                                 ││
│  │                               │ ┌─────────────────────────────┐ ││
│  │                               │ │ Type a message...     📎 ➤  │ ││
│  │                               │ └─────────────────────────────┘ ││
│  └───────────────────────────────┴─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Conversation Header

```
┌─────────────────────────────────────────────────────────┐
│  📱 Max Müller                              ● HostBuddy │
│  +49 170 9876543 │ Villa Sunset │ Jul 5–8              │
│  ─────────────────────────────────────────────────────  │
│  ⏱ Window expires in 22h 14m    [Claim] [View Booking] │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Unmatched Queue

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Unmatched Messages (3)                              │
│                                                         │
│  +62 812 3456789 │ "Halo, saya mau booking"  │ 10m ago │
│  [Match to Guest ▼] [Reply] [Dismiss]                   │
│                                                         │
│  +49 151 2345678 │ "Hello, is this the..."   │ 1h ago  │
│  [Match to Guest ▼] [Reply] [Dismiss]                   │
└─────────────────────────────────────────────────────────┘
```

### 3.4 24h Window Expiry Warning

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

---

## Phase 4: Rules Engine & Human Handoff

### 4.1 Settings → WhatsApp → Routing Rules

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
│  │    If HostBuddy confidence < 60%                        │    │
│  │    → Route to: Staff inbox for review                   │    │
│  │                                        [Edit] [Delete]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ≡  Rule 3: After Hours → AI Only               ● Active │    │
│  │    If time is 22:00–07:00                               │    │
│  │    → Route to: HostBuddy (no escalation)                │    │
│  │                                        [Edit] [Delete]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ≡  Rule 4: Default                             ● Active │    │
│  │    All other messages                                   │    │
│  │    → Route to: HostBuddy (auto-reply)                   │    │
│  │                                              [Edit]     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Add/Edit Rule Modal

```
┌─────────────────────────────────────────────────────────┐
│  Edit Routing Rule                                      │
│                                                         │
│  Condition Type:  ┌────────────────────────────┐        │
│                   │ Keywords in message     ▼  │        │
│                   └────────────────────────────┘        │
│                                                         │
│  Options:  ○ Keywords in message                        │
│            ○ AI confidence below threshold               │
│            ○ Time of day                                │
│            ○ Guest language                             │
│            ○ Reservation status                         │
│                                                         │
│  Keywords: ┌────────────────────────────────────┐       │
│            │ complaint, refund, angry, manager  │       │
│            └────────────────────────────────────┘       │
│                                                         │
│  Route to:  ┌────────────────────────────────┐          │
│             │ Staff inbox (pause AI)      ▼  │          │
│             └────────────────────────────────┘          │
│                                                         │
│  Options:  ○ Staff inbox (pause AI)                     │
│            ○ Specific staff member                      │
│            ○ HostBuddy (auto-reply)                     │
│            ○ HostBuddy + notify staff                   │
│                                                         │
│  ┌────────────┐  ┌──────────────┐                      │
│  │   Cancel   │  │  Save Rule   │                      │
│  └────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Human Handoff — Conversation View

```
┌─────────────────────────────────────────────────────────┐
│  📱 Lisa Park                          🔴 Staff Mode    │
│  +49 170 5555555 │ Villa Ocean │ Jul 10–14             │
│  ─────────────────────────────────────────────────────  │
│  Claimed by: Juli │ Since 14:02  [Release to AI]        │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 👤 I want a refund! The pool was dirty      │ 14:00  │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 🔴 Routed to staff (keyword: refund)        │ 14:00  │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 📝 Internal note: Checking with maintenance │ 14:03  │
│  │    about pool cleaning schedule — Juli       │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │ 👩‍💼 Hi Lisa, I'm sorry about that. Our     │ 14:05  │
│  │ team is checking the pool now. I'll update  │        │
│  │ you within 30 minutes.                      │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Type a message...              📎 📝 Note  ➤   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Media Messages

```
Inbound photo from guest:
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

Outbound photo from staff:
┌─────────────────────────────────────────────┐
│ 👩‍💼 Juli (Staff)                      14:35  │
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

---

## Component Summary

| Phase | UI Components | Location |
|-------|--------------|----------|
| P1 | Connection card, Embedded Signup, Disconnect modal | Settings → Integrations |
| P2 | Channel selector (automation), Send WA button, Template picker, Message log | Automation builder, Reservation detail |
| P3 | Inbox (conversation list + thread view), Channel filter tabs, Unmatched queue, 24h window warning | Dashboard → Messages |
| P4 | Routing rules list + editor, Claim/Release buttons, Internal notes, Media viewer | Settings → WhatsApp, Messages inbox |

---

## Design Tokens / States

### Connection Status Badge
- `● Connected` — green dot
- `● Disconnected` — red dot
- `● Pending` — yellow dot (during signup)

### Message Status Icons
- `✓` Sent
- `✓✓` Delivered
- `✓✓` Read (blue)
- `✗` Failed (red)

### Routing Mode Badge
- `● HostBuddy` — purple/blue badge
- `🔴 Staff Mode` — red badge
- `⚠️ Review Needed` — orange badge

### Channel Icons
- 📱 WhatsApp (green)
- 🏠 Airbnb (red)
- 📧 Email (blue)
- 💬 SMS (gray)
