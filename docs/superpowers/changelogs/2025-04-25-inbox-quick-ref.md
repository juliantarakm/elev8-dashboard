# Inbox Module - Quick Reference

**Created**: 2025-04-25
**Purpose**: 4-panel guest messaging inbox for Elev8 dashboard

---

## Files

| File | Purpose |
|------|---------|
| `app/pages/inbox.vue` | Page route |
| `app/components/inbox/Layout.vue` | 4-panel resizable layout |
| `app/components/inbox/Nav.vue` | Sidebar filters (Action Needed, Assigned to You, Stay, Listing) |
| `app/components/inbox/List.vue` | Conversation list with sort |
| `app/components/inbox/ListItem.vue` | Conversation item + unread badge + assigned staff |
| `app/components/inbox/Thread.vue` | Message thread + assign menu + actions + toast feedback |
| `app/components/inbox/ThreadMessage.vue` | Message bubble + staff role + AI-written (shows "ElevAI") |
| `app/components/inbox/ReplyBox.vue` | Text input + ElevAI rewrite |
| `app/components/inbox/HostbuddySuggestion.vue` | AI suggestion pill |
| `app/components/inbox/ReservationPanel.vue` | Right panel tabs + ElevAI toggle (theme yellow) + toast |
| `app/components/inbox/ReservationGuest.vue` | Guest + reservation info (safe for empty dates) |
| `app/composables/useInbox.ts` | Shared reactive state & filters (useState) |
| `app/components/inbox/data/conversations.ts` | Types + mock data + staff members |
| `app/components/layout/Header.vue` | Topbar with SidebarTrigger + user menu |
| `app/components/layout/HeaderUserMenu.vue` | Avatar + name + role dropdown (Komang Juliantara) |
| `app/components/layout/SidebarNavLink.vue` | Sidebar nav with unread badge on Inbox |

---

## Key Features

1. **4 Panels**: Filter sidebar → Conversation list → Message thread → Reservation details
2. **Filters** (combinable):
   - Action Needed (toggle): shows only `action_needed` conversations
   - Assigned to You (toggle): shows only conversations assigned to current user
   - All: clears toggles, shows everything
   - Stay: Inquiry, Current, Future, Past
   - Listing: Property names (dynamic)
   - Text search: Guest, listing, property, message, labels, stay status, OTA
3. **Unread Badges**: Numbered badge on sidebar Inbox link + per-conversation in list
4. **Auto-Read**: Opening a conversation automatically marks it as read
5. **Mark as Unread**: ⋮ menu option to mark a conversation unread again
6. **Staff Assignment**: Assign conversations to staff members via ⋮ menu, shows in thread header + list item
7. **AI-Written Display**: Messages with `aiWritten: true` show "ElevAI" name + sparkle avatar + "AI" tag instead of user name
8. **Staff Messages**: Non-"You" staff show name + role label (e.g. "Komang Juliantara · Guest Relations")
9. **ElevAI**: Toggle per conversation, suggestion pill fills reply box, rewrite button
10. **Toasts**: `vue-sonner` feedback for mark handled, mark unread, assign, unassign, ElevAI toggle, suggestion use
11. **Stay Status**: Color-coded badges on list items (blue=inquiry, green=current, amber=future, gray=past)
12. **OTA Icons**: Airbnb (`logos:airbnb`), Booking.com (`simple-icons:bookingdotcom`)
13. **Safe Empty Dates**: Inquiry conversations without dates don't crash the reservation panel
14. **Reactive State**: Conversations use `useState` for full Vue reactivity on mutations

---

## Types

```typescript
type ConversationStatus = 'action_needed'
// Conversation.status: ConversationStatus | null (null = no action needed)

type StayStatus = 'inquiry' | 'current' | 'future' | 'past'

interface Conversation {
  id
  guestName
  guestInitials
  listingName
  propertyName
  otaSource
  status
  lastMessage
  lastMessageAt
  unreadCount
  isAssignedToMe
  assignedTo?: string | null
  labels
  sentiment
  sentimentNote
  stayStatus
  checkIn
  checkOut
}

interface Message {
  id
  conversationId
  sender
  senderName
  content
  channel
  timestamp
  isAISuggestion?
  intentDetected?
  sendStatus?
  aiWritten?
  senderRole?
}

interface StaffMember {
  id
  name
  initials
  role
  avatarUrl?
}
```

---

## Staff Members

| ID | Name | Role |
|----|------|------|
| staff-1 | You | Admin |
| staff-2 | Komang Juliantara | Guest Relations |
| staff-3 | Made Surya | Housekeeping |
| staff-4 | Wayan Adi | Maintenance |

---

## State (useInbox composable)

```typescript
conversations // useState<Conversation[]> — reactive
showActionNeeded // Action needed toggle (default: true)
assignedToMeFilter // Assigned to you toggle (default: false)
activeStayFilter // Stay filter
activeListingFilter // Listing filter
searchValue // Text search
sortBy // 'newest' | 'oldest' | 'unread'
pendingSuggestion // For AI suggestion pill
filteredConversations // Computed, sorted conversations
```

---

## Toast Notifications (`vue-sonner`)

| Action | Type | Message |
|--------|------|---------|
| Mark as Handled | success | "Marked as handled" |
| Mark as Unread | info | "Marked as unread" |
| Assign to staff | success | "Assigned to {name}" |
| Unassign | info | "Unassigned conversation" |
| Use suggestion | success | "Suggestion applied to reply box" |
| Enable ElevAI | success | "ElevAI enabled" |
| Pause ElevAI | info | "ElevAI paused for 15 minutes" |
| Disable ElevAI | info | "ElevAI turned off" |

---

## Data

- 6 mock conversations with assignments
- Properties: Canggu Properties, Seminyak Suites, Umalas Villas, Ubud Retreats
- OTA sources: Airbnb, Booking.com
- Staff replies with role labels and AI-written flags

---

## Deviations from Original Spec

- Conversation status simplified to `action_needed` only (was: needs_reply, waiting_on_guest, done)
- Listing filter added to sidebar (wasn't in spec)
- ElevAI toggles per-conversation (was per-reservation in spec)
- Simplified action card (just "Mark as Handled" button)
- OTA icons: Booking.com uses `simple-icons:bookingdotcom`
- Staff assignment system added (wasn't in spec)
- Staff role labels on messages (wasn't in spec)
- AI-written messages show "ElevAI" name instead of user name (wasn't in spec)
- Unread count badges + auto-read + mark as unread (wasn't in spec)
- Toast notifications for all user actions (wasn't in spec)
- Conversations use `useState` for reactivity (wasn't in spec)
- Reservation panel safely handles empty dates for inquiries
