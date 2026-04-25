# Inbox Module Changelog

## Session Date
2025-04-25

## Goal
Build a 4-panel Inbox module for Elev8's web dashboard for guest messaging with ElevAI suggestions, smart actions, guest sentiment, and reservation context.

---

## Changes

### 1. Viewport Height Fix
- **File**: `app/pages/inbox.vue`
- **Change**: Page wrapper uses `h-[calc(100dvh-6.5rem)]` to fill screen properly

### 2. Style Matching to Mail Page
- **Files**: All inbox components
- **Change**: Restyled to use shadcn theme semantic colors (`bg-muted`, `text-muted-foreground`, `hover:bg-accent`) instead of custom gold `#C8A84B`
- **Keep Gold Only For**: ElevAI branding (suggestion card, toggle)

### 3. Unified Panel Top Bars
- **File**: `app/components/inbox/Layout.vue`
- **Change**: All panels use `h-[56px]` with consistent `px-4` padding

### 4. Thread Header 2-Line Layout
- **File**: `app/components/inbox/Thread.vue`
- **Change**: Guest name on line 1, listing + badges on line 2

### 5. Removed List Panel Header
- **File**: `app/components/inbox/Layout.vue`
- **Change**: Deleted "Messages" top bar, search inline in 56px header

### 6. Guest Info Above Tabs
- **Files**: `app/components/inbox/ReservationPanel.vue`, `app/components/inbox/ReservationGuest.vue`
- **Change**: Combined guest summary with reservation details above tabs, removed "Guest" tab

### 7. Sort Dropdown
- **File**: `app/components/inbox/List.vue`
- **Options**: Newest first, Oldest first, Unread first

### 8. Stay Status
- **Files**: `app/components/inbox/data/conversations.ts`, `app/components/inbox/ListItem.vue`, `app/composables/useInbox.ts`
- **Status values**: `inquiry`, `current`, `future`, `past`
- **Badge Colors**: Blue (inquiry), Green (current), Amber (future), Gray (past)

### 9. Nav Filter Categories
- **File**: `app/components/inbox/Nav.vue`
- **Sections**: Status (All, Needs Reply, Waiting, Done) + Stay (Current, Future, Past, Inquiry)

### 10. Removed Section Labels
- **File**: `app/components/inbox/Nav.vue`
- **Change**: Deleted "Status" and "Stay" text labels

### 11. ElevAI Suggestion Pill
- **Files**: `app/components/inbox/Thread.vue`, `app/components/inbox/HostbuddySuggestion.vue`
- **Change**: Compact pill above reply box, click populates chatbox
- **Shared State**: `pendingSuggestion` in composable

### 12. AI Rewrite in Reply Box
- **File**: `app/components/inbox/ReplyBox.vue`
- **Change**: Sparkle icon appears when text present + ElevAI enabled, click rewrites text with mock delay

### 13. Action Card Simplified
- **File**: `app/components/inbox/ActionCard.vue`
- **Change**: Shows description sentence + single "Mark as Done" button

### 14. Listing Filter
- **Files**: `app/components/inbox/Nav.vue`, `app/composables/useInbox.ts`
- **Dynamic**: Lists unique properties from conversation data

### 15. Increased Panel Size
- **File**: `app/components/inbox/Layout.vue`
- **Change**: Layout `[18, 22, 38, 22]`, reservation panel min 20%

### 16. OTA Icons
- **Files**: Multiple (ListItem, Thread, ReservationGuest)
- **Airbnb**: `logos:airbnb`
- **Booking.com**: `simple-icons:bookingdotcom`

### 17. Reservation Panel — Guest Summary Redesign
- **File**: `app/components/inbox/ReservationGuest.vue`
- **Change**: Full redesign of the guest summary section
  - Avatar bumped to `size-12`, stay status labels more descriptive (e.g. "Current Stay", "Upcoming", "Checked Out")
  - OTA badge now includes platform name alongside icon
  - Stay dates moved into a bordered card (`bg-muted/40`) with check-in/out, day-of-week, nights count, guests, and price
  - Property info replaced listing name under guest name; shown in a combined Property + Contact card with `divide-y`
  - Contact (email, phone) grouped in same card as property
  - Notes redesigned as `rounded-lg border bg-muted/50` card with `text-sm font-medium` label
  - Removed all `uppercase tracking-wide` overline styles

### 18. ElevAI Toggle — Moved to Reservation Panel
- **Files**: `app/components/inbox/ReplyBox.vue`, `app/components/inbox/ReservationPanel.vue`, `app/composables/useInbox.ts`
- **Change**: Toggle removed from reply box; added to reservation panel header
- **On state**: Clicking opens a `DropdownMenu` with two options:
  - "Pause for 15 minutes" — auto-resumes after 15 min
  - "Turn off" — stays off until manually re-enabled
- **Off/Paused state**: Clicking toggle directly re-enables
- **Paused indicator**: Label shows remaining minutes in amber (e.g. `ElevAI · 12m`)
- **Composable changes**: Replaced `elevaiEnabled: Record<string, boolean>` + `toggleElevai()` with:
  - `elevaiState: Record<string, { on: boolean, pausedUntil?: number }>`
  - `enableElevai()`, `pauseElevai(id, minutes)`, `disableElevai()`, `getElevaiState()`

### 19. Guest Sentiment Redesign
- **File**: `app/components/inbox/GuestSentiment.vue`
- **Change**: Redesigned using project card style (`rounded-lg border bg-muted/50 p-3`)
  - "Sentiment" as `text-sm font-medium` section label
  - Colored pill (green/amber/red) matching stay status badge pattern
  - Note as `text-xs text-muted-foreground`
  - Gold ElevAI `Badge` retained

### 20. Host Chat Bubble Color
- **File**: `app/components/inbox/ThreadMessage.vue`
- **Change**: Host ("You") bubble changed from `bg-muted` to `bg-warning text-warning-foreground` (theme yellow)

### 21. Guest Header — Remove Listing Name
- **File**: `app/components/inbox/ReservationGuest.vue`
- **Change**: Removed listing name line from under the guest name in the header (already shown in Property card below)

### 22. Conversation Status Simplified to "Action Needed"
- **Files**: `app/components/inbox/data/conversations.ts`, `app/composables/useInbox.ts`, `app/components/inbox/Nav.vue`, `app/components/inbox/ListItem.vue`, `app/components/inbox/Thread.vue`
- **Change**: Removed `needs_reply`, `waiting_on_guest`, `done` statuses
- **New type**: `ConversationStatus = 'action_needed'` (field is nullable — `null` = no action needed)
- **Status filter** replaced: old 3-option status filter (`Needs Reply / Waiting / Done`) → simple **"Action Needed" toggle** + **"Assigned to You" toggle** + **"All"**
- **Badge**: Only shown on list items when `status === 'action_needed'` (destructive variant)
- **Mark as Done** → **Mark as Handled** button sets `status = null`
- **Empty list CTA**: "View all conversations" link clears filters
- **composable**: `activeFilter` → `showActionNeeded` (boolean) + `assignedToMeFilter` (boolean)
- `markAsDone()` → `markAsHandled()`
- `unreadCountByStatus()` → `actionNeededCount()`, `assignedToMeCount()`

### 23. Inquiry Conversation Added
- **File**: `app/components/inbox/data/conversations.ts`
- **New conversation**: `conv-6` — Liam Tanaka (Rice Terrace Lodge, Ubud Retreats, Airbnb inquiry)
- `stayStatus: 'inquiry'`, empty `checkIn`/`checkOut` dates
- **Reservation**: `res-6` with no booking dates, note "New inquiry. No booking yet."

### 24. Staff Assignment System
- **Files**: `app/components/inbox/data/conversations.ts`, `app/composables/useInbox.ts`, `app/components/inbox/Thread.vue`, `app/components/inbox/ListItem.vue`
- **New type**: `StaffMember { id, name, initials, role, avatarUrl? }`
- **Staff members**:
  - `staff-1` — You (Admin)
  - `staff-2` — Komang Juliantara (Guest Relations)
  - `staff-3` — Made Surya (Housekeeping)
  - `staff-4` — Wayan Adi (Maintenance)
- **Conversation field**: `assignedTo?: string | null` (links to staff ID)
- **Composable**: `assignTo(conversationId, staffId | null)`, `getAssignedStaff(conv)`
- **Thread header**: Shows assigned staff name with `user-check` icon, or "Unassigned" with `user-x`
- **Thread ⋮ menu**: "Assign to" submenu listing all staff + "Unassign"
- **ListItem**: Shows assigned staff first name after listing name (e.g. "Villa Canggu · Komang")
- **Nav filter**: "Assigned to You" toggle with count badge

### 25. Staff Messages with Role
- **Files**: `app/components/inbox/data/conversations.ts`, `app/components/inbox/ThreadMessage.vue`
- **Message fields**: `senderRole?: string`, `aiWritten?: boolean`
- **New messages**:
  - `msg-1-4` — Komang Juliantara (Guest Relations) replies to Sarah
  - `msg-3-3` — Komang Juliantara (Guest Relations) replies to Emily (`aiWritten: true`)
  - `msg-5-4` — Komang Juliantara (Guest Relations) replies to Priya
- **ThreadMessage display**:
  - "You" messages show "You" label
  - Other staff show their name + role (e.g. "Komang Juliantara · Guest Relations")
  - `aiWritten: true` messages show sparkles icon + "ElevAI" label

### 26. ElevAI Toggle Color — Theme Yellow
- **File**: `app/components/inbox/ReservationPanel.vue`
- **Change**: Toggle ON color changed from hardcoded `bg-[#C8A84B]` → `bg-warning` (theme yellow)

### 27. Reservation Dates — Safe for Empty Dates
- **File**: `app/components/inbox/ReservationGuest.vue`, `app/components/inbox/ListItem.vue`
- **Change**: Stay dates card wrapped in `v-if="hasDates"` to prevent crash for inquiry conversations with empty `checkIn`/`checkOut`
- **ListItem**: Date label also conditionally rendered

### 28. Topbar — Breadcrumb Removed, User Menu Moved from Sidebar
- **Files**: `app/components/layout/Header.vue`, `app/components/layout/AppSidebar.vue`
- **New file**: `app/components/layout/HeaderUserMenu.vue`
- **Changes**:
  - Removed breadcrumb and vertical `Separator` from topbar
  - Removed `SidebarFooter` with `LayoutSidebarNavFooter` from sidebar
  - Added `LayoutHeaderUserMenu` to topbar right — avatar + name + role + chevron dropdown
  - Dropdown retains all original menu items (Upgrade, Account, Settings, Notifications, Github, Theme, Log out)

### 29. User Identity — Staff Role Context
- **File**: `app/components/layout/HeaderUserMenu.vue`
- **Change**: Name set to "Komang Juliantara", subtitle changed from email to role "Guest Relations"
- **Avatar fallback**: Renders initials "KJ"

### 30. Unread Count Badge
- **Files**: `app/components/layout/SidebarNavLink.vue`, `app/components/inbox/ListItem.vue`
- **Change**: Added numbered unread badge to Inbox sidebar link (total across all conversations)
- **ListItem**: Replaced blue dot with `Badge` showing unread count per conversation

### 31. Auto-Read on Conversation Select
- **File**: `app/composables/useInbox.ts`
- **Change**: `selectedConversation` computed automatically sets `unreadCount = 0` when a conversation is opened

### 32. Mark as Unread
- **Files**: `app/composables/useInbox.ts`, `app/components/inbox/Thread.vue`
- **New function**: `markAsUnread(conversationId)` sets `unreadCount = 1`
- **Thread dropdown**: Added "Mark as Unread" menu item with `lucide:mail` icon

### 33. Toast Notifications
- **Files**: `app/components/inbox/Thread.vue`, `app/components/inbox/ReservationPanel.vue`
- **Change**: Added `vue-sonner` toast feedback for all user actions:
  - Mark as Handled → `success`
  - Mark as Unread → `info`
  - Assign to staff → `success` (shows staff name)
  - Unassign → `info`
  - Use ElevAI suggestion → `success`
  - Enable ElevAI → `success`
  - Pause ElevAI → `info`
  - Disable ElevAI → `info`

### 34. AI-Written Message Display
- **File**: `app/components/inbox/ThreadMessage.vue`
- **Change**: Messages with `aiWritten: true` now show "ElevAI" as sender name instead of the user's name
- **Avatar**: AI-written messages show a sparkle icon in a gold-tinted circle instead of user initials
- **Label**: Shows "AI" tag with sparkle icon instead of role label

### 35. Reactivity Fix — Conversations State
- **File**: `app/composables/useInbox.ts`
- **Change**: `conversations` changed from plain imported array to `useState<Conversation[]>('inbox-conversations', () => conversationsData)`
- **All mutations** (`markAsHandled`, `markAsUnread`, `assignTo`, auto-read) now use spread syntax to create new objects, triggering Vue reactivity
- **Result**: DOM updates immediately after actions — badge disappear, labels update, filters reflect changes

---

## New Types/Fields Added

```typescript
// Staff member type
interface StaffMember {
  id: string
  name: string
  initials: string
  role: string
  avatarUrl?: string
}

// Conversation type additions
interface Conversation {
  stayStatus: 'inquiry' | 'current' | 'future' | 'past'
  checkIn: string
  checkOut: string
  status: ConversationStatus | null  // 'action_needed' or null
  assignedTo?: string | null
}

// Message type additions
interface Message {
  aiWritten?: boolean
  senderRole?: string
}

// New state in useInbox composable
showActionNeeded: boolean
assignedToMeFilter: boolean
activeStayFilter: StayStatus | 'all'
activeListingFilter: string
listingOptions: { name: string, count: number }[]
pendingSuggestion: string
sortBy: 'newest' | 'oldest' | 'unread'
```

---

## Component Structure

```
app/pages/inbox.vue
app/components/inbox/
├── Layout.vue          (4-panel ResizablePanelGroup)
├── Nav.vue            (Action Needed + Assigned to You + All, Stay + Listing filters)
├── List.vue           (Conversation list with sort)
├── ListItem.vue       (Guest + message preview + stay status + assigned staff)
├── Thread.vue         (Messages + suggestion pill + reply box + assign menu)
├── ThreadMessage.vue (Message bubble + staff role + AI-written label)
├── HostbuddySuggestion.vue (AI suggestion pill)
├── ReplyBox.vue       (Textarea + ElevAI toggle + rewrite)
├── ReservationPanel.vue (Tabs container)
├── ReservationGuest.vue (Guest info + reservation details, safe for empty dates)
├── ReservationSummary.vue (Sentiment + actions + quick actions)
├── GuestSentiment.vue (Emoji + label)
├── ActionCard.vue     (Description + Mark as Handled)
├── ReservationListing.vue
├── ReservationTasks.vue
└── ReservationActivity.vue
app/components/layout/
├── Header.vue             (SidebarTrigger + HeaderUserMenu, no breadcrumb)
├── HeaderUserMenu.vue     (Avatar + name + role dropdown, moved from sidebar)
├── AppSidebar.vue         (No footer — user menu moved to topbar)
└── SidebarNavFooter.vue   (Retained but unused in sidebar)
```

---

## Filters (Combinable)

1. **Action Needed** (toggle): Shows only `action_needed` conversations
2. **Assigned to You** (toggle): Shows only conversations where `isAssignedToMe === true`
3. **All** (button): Clears both toggles, shows everything
4. **Stay Filter** (from nav): `inquiry`, `current`, `future`, `past`
5. **Listing Filter** (from nav): Property names from data
6. **Text Search** (search box): Guest name, listing, property, message, labels, stay status, OTA

---

## Key Composables

```typescript
// app/composables/useInbox.ts
useInbox() returns:
- selectedConversationId, showActionNeeded, assignedToMeFilter
- activeStayFilter, activeListingFilter
- searchValue, sortBy, pendingSuggestion
- filteredConversations, conversations
- selectedConversation, selectedMessages, selectedReservation
- actionNeededCount(), assignedToMeCount(), stayCountByStatus(), listingOptions
- isElevaiEnabled(), getElevaiState(), enableElevai(), pauseElevai(), disableElevai()
- markAsHandled(), markAsUnread(), assignTo(), getAssignedStaff()
- useSuggestion(), clearSuggestion()
- conversations is now reactive via `useState`
```

---

## Navigation Entry

```typescript
// app/constants/menus.ts
{
  title: 'Inbox',
  icon: 'lucide:inbox',
  to: '/inbox',
  new: true
}
```

---

## Mock Data

- 6 conversations with varied statuses, stay types, and assignments
- Staff: You (Admin), Komang Juliantara (Guest Relations), Made Surya (Housekeeping), Wayan Adi (Maintenance)
- Assignments: conv-1→You, conv-2→You, conv-3→Unassigned, conv-4→Komang, conv-5→Wayan, conv-6→Unassigned
- Different OTA sources (Airbnb, Booking.com)
- Multiple properties (Canggu Properties, Seminyak Suites, Umalas Villas, Ubud Retreats)
- Messages including AI suggestions and staff replies with role labels and `aiWritten` flags
- Toast notifications (`vue-sonner`) for all user actions
- Unread count badges on sidebar and list items
- Listing tags on every conversation (`tags: string[]`) for scalable 100+ listing filtering
- Multi-select tags via searchable Popover (AND logic) and multi-select listings via checkboxes
- Selected filters shown as removable chips

### 36. Scalable Listing & Tag Filters (Multi-Select)
- **Files**: `app/components/inbox/Nav.vue`, `app/composables/useInbox.ts`, `app/components/inbox/data/conversations.ts`
- **Change**: Replaced flat listing button list with search + tags Popover + multi-select checkboxes + removable chips
- **Data model**: Added `tags: string[]` to `Conversation` type; added tags to all 6 mock conversations
- **Composable**: 
  - `activeListingFilter` changed from `string` to `string[]` (multi-select)
  - Added `activeTagFilters`, `listingSearchText`, `listingTags` computed, `allListingOptions` computed
  - Added `toggleListingFilter()`, `clearListingFilters()`, `toggleTagFilter()`, `clearTagFilters()`, `clearAllListingFilters()`
  - `filteredConversations` filters by `activeListingFilter` (includes) and `activeTagFilters` (AND logic)
  - `listingOptions` filtered by active tags + search text
  - Main search also searches `tags` field
- **Nav UI**: 
  - Search input for listing name filtering
  - "Tags" button opens Popover with search + checkboxes (multi-select)
  - Selected tags and listings shown as removable Badge chips
  - Listing items shown with checkboxes (multi-select)
  - Clear-all button (X) when any filter active
  - Collapsed sidebar shows listing icon with Tooltip showing count

### 37. Inbox Badge Count Fix
- **Files**: `app/components/layout/SidebarNavLink.vue`, `app/components/inbox/Layout.vue`
- **Change**: Both sidebar Inbox badge and Inbox page header now show count of conversations with unread > 0 (4), not total unread messages (7)
- Sidebar now uses reactive `useInbox()` for the count; Layout uses filter + length instead of reduce