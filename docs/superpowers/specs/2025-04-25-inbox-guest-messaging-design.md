# Inbox — Guest Messaging Module Design Spec

**Module:** Inbox (new module)  
**Author:** Juli  
**Status:** Draft  
**Last updated:** 2025-04-25  
**Scope:** Frontend UI with mock data (no real API integration)

---

## 1. Summary

Inbox is the central guest communication hub inside Elev8's web dashboard. It implements a 4-panel resizable layout — Filter sidebar | Conversation list | Message thread | Reservation summary — where hosts and guest experience staff manage all guest conversations from a single screen. Messages are threaded per reservation, filterable by status, and include ElevAI (Hostbuddy) suggestions and smart action detection.

---

## 2. Layout

### 4-Panel Resizable Layout

Built using `ResizablePanelGroup` (shadcn-vue), following the existing `mail/Layout.vue` pattern.

| Panel | Default width | Resizable | Collapsible |
|---|---|---|---|
| Filter sidebar | 240px | Yes | Yes (collapsed to icon) |
| Conversation list | 320px | Yes | No |
| Message thread | Flex (remaining) | No (fills space) | No |
| Reservation panel | 280px | Yes | Yes (collapsed to icon) |

**Collapsed states:** When a panel collapses, it shows only an icon column (sidebar icons for filters, property icon for reservation). Clicking the icon re-expands.

**Minimum widths:** Filter sidebar 180px, Conversation list 260px, Reservation panel 220px.

---

## 3. Component Architecture

```
components/inbox/
├── Layout.vue                ← 4-panel ResizablePanelGroup shell
├── Nav.vue                   ← Filter sidebar (statuses + quick filters)
├── List.vue                  ← Conversation list with search + scroll
├── ListItem.vue              ← Single conversation row
├── Thread.vue                ← Message thread panel (header + messages + reply)
├── ThreadMessage.vue         ← Single message bubble (guest / host / system)
├── HostbuddySuggestion.vue  ← ElevAI suggestion card above reply box
├── ReplyBox.vue              ← Reply textarea + channel selector + ElevAI toggle + Send
├── ReservationPanel.vue      ← Right panel container
├── ReservationTabs.vue       ← Tab switcher (Summary/Guest/Listing/Tasks/Activity)
├── ReservationSummary.vue    ← Summary tab: property, dates, guests, price, actions, sentiment, smart actions
├── ReservationGuest.vue      ← Guest tab: guest details, contact info, trip history
├── ReservationListing.vue    ← Listing tab: listing details, amenities
├── ReservationTasks.vue      ← Tasks tab: tasks for this reservation
├── ReservationActivity.vue   ← Activity tab: timeline of events for this guest/reservation
├── GuestSentiment.vue        ← Sentiment indicator card (positive/neutral/negative)
├── ActionCard.vue            ← Smart action needed card (detect + dismiss/act)
└── data/
    └── conversations.ts     ← Mock data + TypeScript types
```

```
pages/
└── inbox.vue                 ← Thin wrapper: <InboxLayout />
```

```
composables/
└── useInbox.ts               ← Shared state (selectedConversation, activeFilter, elevaiEnabled, etc.)
```

---

## 4. Data Model

```ts
type ConversationStatus = 'needs_reply' | 'waiting_on_guest' | 'done'
type GuestSentiment = 'positive' | 'neutral' | 'negative'
type MessageSender = 'guest' | 'host' | 'system'

interface Conversation {
  id: string
  guestName: string
  guestAvatar?: string
  listingName: string
  propertyName: string
  otaSource: 'airbnb' | 'booking.com' | string
  otaIcon?: string
  reservationId: string
  status: ConversationStatus
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
  isAssignedToMe: boolean
  labels: string[]              // 'check-in-today', 'unassigned', etc.
  sentiment: GuestSentiment
  sentimentNote: string         // e.g. "Guest is friendly and polite"
}

interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  senderName: string
  content: string
  channel: string
  timestamp: Date
  isAISuggestion?: boolean
  intentDetected?: string
  sendStatus?: 'sent' | 'failed' | 'pending'
}

interface SmartAction {
  id: string
  type: string                  // 'late-checkout', 'missing-guide', 'payment-due', etc.
  title: string
  description: string
  severity: 'warning' | 'urgent' | 'info'
  primaryAction: string         // Button label e.g. "Offer Late Check-out"
  dismissLabel?: string         // Default "Dismiss"
  detectedBy: 'elevai' | 'system'
}

interface Reservation {
  id: string
  propertyName: string
  roomName: string
  listingName: string
  otaSource: string
  checkIn: Date
  checkOut: Date
  nights: number
  guestCount: number
  totalPrice: number
  currency: string
  smartActions: SmartAction[]
  guestDetails: GuestDetails
  listingDetails: ListingDetails
  tasks: Task[]
  activity: ActivityEvent[]
}

interface GuestDetails {
  name: string
  email?: string
  phone?: string
  avatarUrl?: string
  previousStays: number
  notes?: string
}

interface ListingDetails {
  name: string
  property: string
  room: string
  amenities: string[]
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee?: string
  dueDate?: Date
}

interface ActivityEvent {
  id: string
  type: 'message' | 'reply' | 'reservation' | 'guide_sent' | 'cleaning' | 'task' | 'system'
  title: string
  description: string
  actor: string
  timestamp: Date
  channel?: string
  colorDot: 'gold' | 'green' | 'blue' | 'gray'
}
```

---

## 5. Panel Details

### Panel 1: Filter Sidebar (Nav.vue)

**Status filters (core set):**
| Filter | Description |
|---|---|
| Needs Reply | Conversations where host needs to respond |
| Waiting on Guest | Host replied, awaiting guest response |
| Done | Resolved conversations |
| All | All conversations |

**Quick filters:**
| Filter | Description |
|---|---|
| Check-in Today | Guests checking in today |
| Unassigned | No host assigned yet |

Each filter shows a count badge. Active filter has a gold left border highlight matching Elev8's `#C8A84B` design token.

Search bar at the top filters conversations by guest name, listing name, or message content.

### Panel 2: Conversation List (List.vue)

- Scrollable list of `ListItem.vue` components
- Sorted by most recent message
- Each row shows: guest name, listing name, property name, message preview, timestamp, status badge, OTA source indicator
- Selected conversation has gold left border
- Unread count badge on avatar if unread > 0
- Empty state per filter: "You're all caught up. No messages need a reply right now." with CTA to switch to All

### Panel 3: Message Thread (Thread.vue)

**Header:** Guest name, listing/property, OTA source badge, status badge, "Mark as Done" button, overflow menu (⋯)

**Messages area:** Chronological scroll, newest at bottom. Each message shows:
- Avatar (initials fallback), sender name, sender type (Guest/Host/System), timestamp
- Message content in a bubble — guest messages left-aligned, host messages right-aligned
- System messages centered with muted styling

**ElevAI Suggestion (HostbuddySuggestion.vue):**
- Appears above ReplyBox only when ElevAI is ON and intent is detected
- Shows: suggestion text, "Use & Edit" button, "Dismiss" button
- Gold border (`#C8A84B`), subtle gold background
- Clicking "Use & Edit" populates the reply box with the suggestion text for editing
- Clicking "Dismiss" removes the suggestion card

**Reply Box (ReplyBox.vue):**
- Textarea for typing reply
- Channel selector dropdown (defaults to OTA source of incoming message)
- ElevAI toggle switch (ON = gold, OFF = gray)
- Send button (gold `#C8A84B`)
- When ElevAI is OFF: no suggestion card appears, manual reply only

### Panel 4: Reservation Summary (ReservationPanel.vue)

**5 tabs:** Summary | Guest | Listing | Tasks | Activity

**Summary tab includes:**
1. **Guest Sentiment card** — AI-detected mood (😊 Positive / 😐 Neutral / 😠 Negative) with brief description and "ElevAI" badge
2. **Smart Action Needed cards** — AI-detected actions from conversation context, each with:
   - Icon + severity color (warning = gold, urgent = red, info = blue)
   - Title + description
   - Primary action button + Dismiss button
   - "Detected by ElevAI" or "Auto-detected" label
3. **Reservation details:** Property, room, OTA source, check-in/out dates, nights, guest count, total price
4. **Quick Actions:** View in Cockpit, Create Cleaning Task, View Activity Log

**Guest tab:** Guest name, email, phone, avatar, previous stays count, notes

**Listing tab:** Listing name, property, room, amenities

**Tasks tab:** Tasks for this reservation (todo/in_progress/done)

**Activity tab:** Timeline with color-coded dots (gold = message, green = confirmed/reply, blue = automated action, gray = created/booking). Each entry shows: title, description, actor, timestamp, channel.

---

## 6. Status Transitions

| Event | From | To |
|---|---|---|
| New guest message received | Any | Needs Reply |
| Host sends reply | Needs Reply | Waiting on Guest |
| Guest replies to Waiting on Guest | Waiting on Guest | Needs Reply |
| Host clicks "Mark as Done" | Any | Done |
| New message arrives on Done thread | Done | Needs Reply |

---

## 7. Edge Cases

| Scenario | Behavior |
|---|---|
| Empty inbox (Needs Reply filter) | "You're all caught up" empty state with CTA to All filter |
| No conversation selected | Thread panel shows "Select a conversation" placeholder |
| ElevAI OFF for reservation | No suggestion card; reply box only |
| ElevAI suggestion dismissed | Card removed; host types manual reply |
| OTA channel disconnected | Send fails with inline error; thread preserved |
| Two staff in same conversation | Last-write-wins; real-time sync |
| Conversation on cancelled reservation | Accessible; shows "Cancelled" badge |
| 100+ conversations | Paginated — 20 per page, infinite scroll |

---

## 8. Design Tokens

Following Elev8's existing design system:
- Primary gold: `#C8A84B`
- Active dot: `#EFB100`
- Background primary: `#f6bb11` (for hover states)
- Text primary: `#1e293b`
- Text secondary: muted gray
- Font: Inter
- Border radius: `var(--border-radius-lg)`, `var(--border-radius-md)`
- Desktop baseline: 1280px+ (4-panel optimal at 1440px)

Dark mode variants for the Inbox module use the template's dark theme tokens.

---

## 9. Entry Point

- Added to primary left sidebar navigation: "Inbox" with unread badge count
- Route: `/inbox`
- Page file: `pages/inbox.vue` → imports `InboxLayout`

---

## 10. Out of Scope (v1)

- WhatsApp channel integration
- Bulk messaging / broadcast
- Internal staff messaging (separate: Elev8 Go Internal Inbox)
- Automated message sending (host always sends manually in v1)
- Email client integration
- Mobile Inbox view (handled by Elev8 Go)
- Real API integration (mock data only in this build)
- Real-time WebSocket sync (simulated)