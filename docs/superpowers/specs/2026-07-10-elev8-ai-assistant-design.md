# Elev8 AI Assistant — Design Spec

> **Date**: 2026-07-10
> **Module**: AI Assistant (global slide-over panel)
> **Status**: Approved
> **Depends on**: `ai` SDK (already in `package.json`), `vue-sonner` (toasts), Header layout, `useState` global state pattern

---

## 1. Overview

A global **Ask AI** slide-over panel accessible from anywhere in the dashboard. Elev8 staff (e.g., Komang, Guest Relations) ask natural-language questions about their property data — upcoming reservations, cleaning schedule, revenue, occupancy, etc. — and receive streamed answers with visible tool-call badges showing which data sources were queried.

### Key Features

- **Global entry point** — top-right `Ask AI` button in `Header.vue`, opens right-side panel on any page
- **4 data domains** — reservations & guests, cleaning & operations, listings & occupancy, finance (revenue / upsells / costs)
- **Mock-only backend** — deterministic pattern matcher with simulated streaming. No real LLM API calls in v1, but uses Vercel AI SDK streaming protocol so swap to real Claude = one file change.
- **Streaming UX** — text appears word-by-word, tool badges fade in after completion, loader dots during wait
- **Empty-state suggestions** — 6 pre-canned chips ("Today's check-ins", "Cleaning schedule today", etc.) so users get value in one click
- **Non-modal panel** — does NOT block the underlying page. User can navigate, click links, and browse listings while chat stays open.
- **Single ephemeral thread** — no conversation history, no persistence. Open, ask, close. Refresh = empty.

### Why this matters

Currently, finding data requires navigating to the right module (Reservations, Cleaning Calendar, Finance → Revenue), applying filters, and reading tables. This feature turns that into a single question: *"What's cleaning today?"* → instant answer. Matches the existing `HostbuddySuggestion` chip concept but elevates it from inline suggestions to a full conversational surface.

### Out of scope (v1)

- Real LLM provider (Anthropic Claude, OpenAI, etc.) — mock-only, server route designed for easy swap
- Conversation persistence across refresh
- Multiple conversation threads / history sidebar
- Multi-language query understanding (English only — matches all current mock data)
- Write actions (create task, send message, etc.) — read-only queries only
- File/image attachments in messages
- Voice input/output

---

## 2. High-Level Architecture

```
┌─ Browser ──────────────────────────────────────────────────────┐
│                                                                 │
│  Top-right Header slot                                         │
│   └─ <ElevAIButton>  → toggles open/close                     │
│                                                                 │
│  Global <ElevAIPanel> (mounted in default layout)              │
│   • position: fixed, right: 0, top: 0, height: 100vh           │
│   • width: 480px (desktop), 100vw (mobile)                     │
│   • NO backdrop. NO focus trap. NO click-outside-to-close.     │
│   • Page content stays fully interactive underneath            │
│                                                                 │
│   ├─ <ElevAIAssistant>                                        │
│   │   ├─ <ElevAIConversation> (scrollable messages)           │
│   │   │   ├─ <ElevAIMessage from="user">  ×N                  │
│   │   │   └─ <ElevAIMessage from="assistant">                 │
│   │   │       ├─ <ElevAIResponse>   ← streamed text           │
│   │   │       └─ <ElevAIToolBadge>   ← tool badge             │
│   │   └─ <ElevAIPromptInput>        ← textarea + send         │
│   │                                                             │
│   └─ <ElevAIEmptyState> (when no messages)                     │
│       └─ <ElevAISuggestionChip> ×6                             │
│                                                                 │
│  useAssistant() composable                                      │
│   └─ wraps useChat() from `ai` SDK                             │
│   └─ messages, input, isStreaming, error, stop(), clear()      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP POST (Vercel AI SDK DataStreamProtocol)
┌─ Server ──────────────────────────────────────────────────────┐
│                                                                 │
│  /server/api/assistant.post.ts                                 │
│   ├─ matchQuery(text) → Intent { domain, action, params }      │
│   ├─ resolveIntent(intent) → { toolCalls, chunks }             │
│   └─ streamChunks() → ReadableStream                           │
│                                                                 │
│  /server/utils/intents.ts                                      │
│   ├─ IntentRule[] for 4 domains                                │
│   ├─ matchQuery() with keyword scoring + priority              │
│   └─ extractDateParam() / extractWeekParam() / etc.            │
│                                                                 │
│  /server/utils/mock-data.ts                                    │
│   └─ Hard-coded realistic Bali property data                   │
│      (reservations, cleaning, listings, revenue, tasks)         │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Properties

- **Global mount pattern** — `ElevAIPanel` lives in `layouts/default.vue`, open state in shared `useState('elevai-open', false)`. Survives page navigation.
- **Real-AI-ready** — using `useChat` + Vercel AI SDK streaming protocol means swapping to real Claude later is a one-file change (`assistant.post.ts` server impl).
- **Server route is required even for mock** — so the chat shape matches real AI exactly. Pure client-side mocking would mean rewriting when going live.
- **Mock data lives server-side** — `server/utils/mock-data.ts` doesn't import from `app/components/.../data/*.ts` directly. Loose coupling; when real data sources land, only `mock-data.ts` swaps.
- **Pattern matcher, not LLM routing** — for v1, deterministic keyword matching is debuggable, free, and instant. Avoids an extra round-trip to a routing LLM.

---

## 3. Component Breakdown

### Frontend components (10 new files)

| Path | Purpose |
|------|---------|
| `app/components/ElevAIButton.vue` | Top-right Header button. Primary color pill (`bg-primary text-primary-foreground`), shows "Ask AI" + `lucide:sparkles` icon. Subtle pulse animation when assistant is streaming. Emits `toggle`. |
| `app/components/ElevAIPanel.vue` | Slide-over container. `position: fixed; right: 0; top: 0; height: 100vh; width: 480px` (mobile: 100vw). No backdrop. ESC to close. Slide-in via `translate-x-full` ↔ `translate-x-0` transition (disabled under `prefers-reduced-motion`). |
| `app/components/assistant/ElevAIAssistant.vue` | Chat root. Composes `ElevAIConversation` + `ElevAIPromptInput` + `ElevAIEmptyState`. Uses `useAssistant()`. |
| `app/components/assistant/ElevAIConversation.vue` | Wraps ai-elements `Conversation`. Auto-scrolls to bottom on new chunk IF user already at bottom. `aria-live="polite"` for screen readers. |
| `app/components/assistant/ElevAIMessage.vue` | Wraps ai-elements `Message`. Two variants: `user` (right-aligned, `bg-primary text-primary-foreground`) and `assistant` (left-aligned, `bg-muted text-foreground`). |
| `app/components/assistant/ElevAIResponse.vue` | Wraps ai-elements `Response` for streaming text. Markdown-lite: bold + lists + inline code + links. |
| `app/components/assistant/ElevAIToolBadge.vue` | Wraps ai-elements `Tool`. Collapsed by default: `🔍 {displayName} ({params summary})`. Click to expand → raw args + result count. Color: `bg-muted/60 text-muted-foreground border border-border`. |
| `app/components/assistant/ElevAILoader.vue` | Wraps ai-elements `Loader` — three animated dots shown while waiting for first chunk (>250ms). |
| `app/components/assistant/ElevAIEmptyState.vue` | Welcome ("Hi Komang 👋 Ask me about your properties.") + 6 suggestion chips in a 2-column grid. |
| `app/components/assistant/ElevAISuggestionChip.vue` | Pill button (`bg-secondary text-secondary-foreground`). Click → fills input + auto-sends. Shows emoji + label. |

### Composables (1 new file)

| Path | Purpose |
|------|---------|
| `app/composables/useAssistant.ts` | Wraps `useChat` from `ai` SDK. Exposes `messages`, `input`, `handleSubmit`, `isStreaming`, `error`, `stop()`, `clear()`. Passes `id` for tracking. Uses `useState('elevai-open')` to coordinate panel state. |

### Server files (3 new files)

| Path | Purpose |
|------|---------|
| `server/api/assistant.post.ts` | POST handler. Validates request body. Calls `matchQuery()` → `resolveIntent()` → `streamChunks()`. Returns a `ReadableStream` (Vercel AI SDK DataStreamProtocol). |
| `server/utils/intents.ts` | Pattern matchers: `matchReservations()`, `matchCleaning()`, `matchListings()`, `matchFinance()`. Exports `matchQuery(text: string): Intent \| null`. Priority order: most specific keyword wins. |
| `server/utils/mock-data.ts` | Hard-coded fixtures: today's check-ins, current in-house guests, cleaning schedule, occupancy, revenue, listings. ~50 records, realistic Bali property data. |

### Modified files (3)

| Path | Change |
|------|--------|
| `app/components/layout/Header.vue` | Add `<ElevAIButton>` to the right side (next to notification bell). |
| `app/layouts/default.vue` | Mount `<ElevAIPanel>` once with `v-model:open` bound to shared `useState('elevai-open', false)`. |
| `components.json` | Add to `registries`: `"@ai-elements": "https://registry.ai-elements-vue.com/{name}.json"` |

### ai-elements components to install (6 components, ~20 files)

```bash
pnpm dlx shadcn-vue@latest add @ai-elements/message \
  @ai-elements/conversation @ai-elements/prompt-input \
  @ai-elements/response @ai-elements/tool @ai-elements/loader
```

**No new npm dependencies needed** — `ai`, `reka-ui`, `@vueuse/core`, `@lucide/vue`, `vue-sonner` (toast) are all already in `package.json`.

---

## 4. Data Flow + Pattern Matcher

### End-to-end flow with concrete example

```
User types: "What's happening with check-ins today?"
  │
  ▼
[1] ElevAIPromptInput → handleSubmit
  │
  ▼
[2] useChat() POSTs { messages: [...] } → /api/assistant
  │
  ▼
[3] Server: assistant.post.ts
     ├─ matchQuery("what's happening with check-ins today?")
     │  → Intent { domain: 'reservations', action: 'upcoming_checkins', params: { when: 'today' } }
     ├─ resolveIntent(intent)
     │  → fetches mock-data.ts#getUpcomingCheckins('today')
     │  → returns {
     │       toolCalls: [{ id: 'tc-1', name: 'get_upcoming_checkins', args: { when: 'today' } }],
     │       chunks: ["Today you have ", "3 check-ins", ":\n\n",
     │                 "• **Anna Schmidt** — Villa Sunset, 14:00, 5 nights\n",
     │                 "• **Yuki Tanaka** — Villa Bamboo, 16:30, 4 nights\n",
     │                 "• **Marc Weber** — Villa Oasis, 19:00, 7 nights"]
     │     }
     └─ streamChunks() → ReadableStream
         ├─ 250ms pause (simulated "thinking")
         ├─ emit tool_call chunk
         ├─ for each text chunk: 80ms pause, then emit
         └─ emit finish chunk
  │
  ▼
[4] useChat() receives chunks → messages reactive
  │
  ▼
[5] Vue renders: <ElevAIMessage> with <ElevAIResponse> streaming + <ElevAIToolBadge>
```

### Streaming protocol (Vercel AI SDK DataStreamProtocol)

```
data: {"type":"tool_call","toolName":"get_upcoming_checkins","args":{"when":"today"}}
data: {"type":"text","delta":"Today you have "}
data: {"type":"text","delta":"3 check-ins"}
data: {"type":"text","delta":":\n\n"}
data: {"type":"text","delta":"• **Anna Schmidt** — ..."}
...
data: {"type":"finish"}
```

### Pattern matcher rules (`server/utils/intents.ts`)

```ts
type Domain = 'reservations' | 'cleaning' | 'listings' | 'finance'
type Intent = { domain: Domain; action: string; params: Record<string, any> }

interface IntentRule {
  domain: Domain
  action: string
  keywords: string[]                       // any-match, case-insensitive
  extractParams: (text: string) => Record<string, any>
}

const RULES: IntentRule[] = [
  // Reservations & guests
  { domain: 'reservations', action: 'upcoming_checkins',
    keywords: ['check-in', 'checkin', 'arriving', 'arrival', 'coming today'],
    extractParams: extractDateParam },
  { domain: 'reservations', action: 'upcoming_checkouts',
    keywords: ['check-out', 'checkout', 'leaving', 'departure'],
    extractParams: extractDateParam },
  { domain: 'reservations', action: 'current_guests',
    keywords: ['in-house', 'in house', 'currently', 'staying now', 'right now'],
    extractParams: () => ({}) },
  { domain: 'reservations', action: 'repeat_guests',
    keywords: ['repeat', 'returning', 'loyal'],
    extractParams: () => ({}) },
  // Cleaning & operations
  { domain: 'cleaning', action: 'cleaning_today',
    keywords: ['cleaning today', 'today clean'],
    extractParams: () => ({ when: 'today' }) },
  { domain: 'cleaning', action: 'cleaning_schedule',
    keywords: ['cleaning schedule', 'clean this week', 'housekeeping'],
    extractParams: extractDateParam },
  { domain: 'cleaning', action: 'open_tasks',
    keywords: ['open task', 'pending task', 'unfinished'],
    extractParams: () => ({}) },
  // Listings & occupancy
  { domain: 'listings', action: 'listings_overview',
    keywords: ['listings', 'properties', 'portfolio'],
    extractParams: () => ({}) },
  { domain: 'listings', action: 'occupancy',
    keywords: ['occupancy', 'booked', 'utilization'],
    extractParams: extractMonthParam },
  // Finance
  { domain: 'finance', action: 'revenue_summary',
    keywords: ['revenue', 'income', 'earnings'],
    extractParams: extractMonthParam },
  { domain: 'finance', action: 'revenue_by_listing',
    keywords: ['revenue by listing', 'revenue per property'],
    extractParams: extractMonthParam },
  { domain: 'finance', action: 'costs',
    keywords: ['cost', 'expense', 'spending'],
    extractParams: extractMonthParam },
]

export function matchQuery(text: string): Intent | null {
  const normalized = text.toLowerCase().trim()
  // Score each rule: number of matching keywords
  // Pick highest-scoring rule; if score = 0 or ties broken by specificity, return null
}
```

### Tool schema (server → client)

```ts
type ToolCall = {
  id: string                              // unique per call
  name: string                            // e.g., 'get_upcoming_checkins' (matches elev8 MCP)
  args: Record<string, any>               // e.g., { when: 'today' }
  displayName: string                     // humanized for UI
  status: 'running' | 'completed'
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_upcoming_checkins: 'Looked up upcoming check-ins',
  get_upcoming_checkouts: 'Looked up upcoming check-outs',
  get_current_bookings: 'Looked up in-house guests',
  get_cleaning_schedule: 'Looked up cleaning schedule',
  get_cleaning_schedule_by_date_range: 'Looked up cleaning schedule',
  get_listings_overview: 'Looked up listings',
  get_occupancy_rate: 'Calculated occupancy',
  get_revenue_summary: 'Looked up revenue',
  get_revenue_by_listing: 'Looked up revenue by listing',
  get_repeat_guests: 'Looked up repeat guests',
  get_pending_tasks: 'Looked up open tasks',
}
```

Tool names match the actual elev8 MCP tools so swapping to real AI = zero name changes.

### Mock data fixtures (`server/utils/mock-data.ts`)

Realistic Bali property data — guest names (mix of nationalities: Anna Schmidt DE, Yuki Tanaka JP, Marc Weber NL), villa names (Villa Sunset, Villa Bamboo, Villa Oasis, etc.), realistic check-in times (14:00-19:00), task descriptions (deep clean, restock toiletries), revenue numbers in CHF. ~50 records across 4 domains.

### Fallback strategy

- `matchQuery` returns `null` → assistant responds: *"I can help with **reservations**, **cleaning**, **listings**, **occupancy**, and **revenue**. Try asking 'Show today's check-ins' or 'Cleaning schedule this week'."*
- Params unparseable (e.g., *"check-ins for next fruesday"*) → fall back to "today" with hint: *"I'll show today's — try specifying a date if you want a different range."*
- Intent matched but data empty → *"No check-ins today. Your next arrival is **Anna Schmidt** on [date]."*

---

## 5. Visual Treatment

### Panel layout

```
┌─────────────────────────────────────────┐  ← border-l, h-full
│ 🤖 Ask AI                          ✕  │  ← header, h-14, border-b
├─────────────────────────────────────────┤
│                                         │
│  Hi Komang 👋                           │  ← empty state
│  Ask me about your properties.          │
│                                         │
│  Try asking:                            │
│  [📅 Today's check-ins        ]        │  ← chips, grid 2-col
│  [🧹 Cleaning schedule today  ]        │
│  [💰 Revenue this month       ]        │
│  [📊 Occupancy this month      ]        │
│  [🏠 Listings overview        ]        │
│  [👥 Repeat guests            ]        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│              What's happening today?  ✓│  ← user msg, right
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Today you have 3 check-ins:     │    │  ← assistant msg, left
│  │ • Anna Schmidt — 14:00 ...      │    │     bg-muted
│  │ • Yuki Tanaka — 16:30 ...       │    │
│  │ • Marc Weber — 19:00 ...        │    │
│  │                                 │    │
│  │ 🔍 Looked up upcoming           │    │  ← tool badge
│  │   check-ins (today)         ⌄   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⋯                                       │  ← loader (during streaming)
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Ask about your properties...        │ │  ← textarea, auto-resize
│ │                              [⏎ ↑] │ │     + send button
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Color tokens (existing dashboard theme)

| Element | Tokens |
|---------|--------|
| Panel header | `bg-background border-b` |
| User bubble | `bg-primary text-primary-foreground` |
| Assistant bubble | `bg-muted text-foreground` |
| Tool badge | `bg-muted/60 text-muted-foreground border border-border` |
| Suggestion chips | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| Send button | `bg-primary text-primary-foreground` |
| Loader dots | `bg-muted-foreground` |
| Ask AI button | `bg-primary text-primary-foreground` (matches primary buttons, NOT ElevAI gold) |

**Color decision**: The AI Assistant uses **primary color** (same as dashboard buttons), not ElevAI gold `#FBC800`. This makes it feel like a first-class UI feature integrated into the dashboard, not a separate "special" branded product. The existing `HostbuddySuggestion.vue` chip keeps gold for inline suggestions; the new AI Assistant panel uses primary. (Deviation from the existing CLAUDE.md rule "ElevAI gold ONLY: `bg-[#C8A84B]`" — that rule applies to the Elev8 product brand element, not a general UI feature. CLAUDE.md should be updated to reflect this distinction.)

### Typography

- User/assistant messages: `text-sm leading-relaxed`
- Tool badges: `text-xs font-mono` for code-ish feel
- Headers: `text-sm font-medium`
- Empty state welcome: `text-sm text-foreground`
- Assistant markdown: bold + lists + inline code + links only (no headers/h1)

### Empty state — exactly 6 chips, priority order

1. 📅 Today's check-ins → `upcoming_checkins(today)`
2. 🧹 Cleaning schedule today → `cleaning_schedule(today)`
3. 💰 Revenue this month → `revenue_summary(this_month)`
4. 📊 Occupancy this month → `occupancy(this_month)`
5. 🏠 Listings overview → `listings_overview()`
6. 👥 Repeat guests → `repeat_guests()`

### Tool badge UI

```
┌──────────────────────────────────────────────────────┐
│  🔍 Looked up upcoming check-ins (today)        ⌄   │
├──────────────────────────────────────────────────────┤
│  Args: { when: "today" }                              │
│  Result: 3 reservations found                         │
└──────────────────────────────────────────────────────┘
```

Collapsed by default — one line: icon + displayName + params summary. Click to expand → raw args + result count.

---

## 6. Error Handling & Edge Cases

### Input validation

| Case | Behavior |
|------|----------|
| Empty input | Send button disabled |
| Whitespace only | Trim → treat as empty → button disabled |
| > 2000 chars | Toast: "Message too long (max 2000 characters)", input trimmed |
| Send while streaming | Send button hidden, Stop button shown |
| Very rapid sends (double-click) | Debounced — second click ignored while in-flight |

### Streaming state

| State | UI |
|-------|----|
| Waiting for first chunk (>250ms) | Three-dot loader (`ElevAILoader`) |
| Streaming in progress | Loader + text grows incrementally (ai-elements Response) |
| User clicks Stop | `useChat().stop()` → partial response stays with "Stopped" tag |
| Stream completes | Tool badge fades in (200ms) below message |
| Network failure mid-stream | Inline error: "Connection lost. [Retry]" |
| Auto-scroll | Scrolls to bottom IF user already at bottom; otherwise no scroll |

### Server-side errors

| Case | Response |
|------|----------|
| Pattern matcher returns `null` | Fallback message + 6 suggestion chips rendered |
| Intent matched but data empty | "No check-ins today. Your next arrival is Anna Schmidt on [date]." |
| Mock data throws | Catch in `resolveIntent()` → generic: "I had trouble looking that up. Try rephrasing?" |
| Server 500 | Client toast: "Something went wrong" + last message shows inline retry button |

### Empty state edge cases

| Trigger | Behavior |
|---------|----------|
| All messages cleared (via trash icon) | Show empty state with chips |
| Page refresh | Messages are ephemeral — empty state on next open |
| Network offline on open | Empty state + small "⚠️ Offline" pill in panel header |

### Mobile considerations

| Case | Behavior |
|------|----------|
| Panel opens on mobile | Full-screen (100vw), header still visible at top |
| Keyboard opens | Textarea scrolls into view; panel content shifts up by keyboard height (`visualViewport` API) |
| Touch targets | All buttons ≥ 44×44px |
| Swipe gesture to open | Not in v1 (nice-to-have) |

### Accessibility

| Case | Behavior |
|------|----------|
| Screen reader announces new message | `aria-live="polite"` on conversation container |
| Streaming updates | Don't spam SR — only announce on completion |
| Focus on open | Jumps to textarea |
| Focus on close | Returns to ElevAIButton that opened it |
| `prefers-reduced-motion` | Slide-in animation disabled, instant show/hide |
| Textarea aria | `aria-label="Ask the AI assistant"` |
| Send button aria | `aria-label="Send message"` |
| Tool badges | `<button>` with `aria-expanded` |

### Hardcoded English-only for v1

The dashboard supports EN/DE/FR/ID/NL via `LanguageSelector`, but the assistant only understands English queries in v1. The pattern matcher's keyword lists are English. Future v2: language detection → match in user's locale. Documented as a v2 item.

### Rate limiting

Not implemented in v1 (mock backend, no real cost). The `server/api/assistant.post.ts` route structure is the natural place to add per-user rate limits when real AI lands. Mentioned in code comments.

---

## 7. Testing Approach

**Framework**: Vitest 4.1.8 (already in devDeps) + `@vue/test-utils` + happy-dom. Tests co-located as `*.test.ts`.

### Test pyramid

```
        ┌──────────────────┐
        │  Manual smoke    │  ← 5-step verification (documented, not automated)
        └──────────────────┘
       ┌────────────────────┐
       │ Server integration │  ← POST /api/assistant stream shape
       └────────────────────┘
      ┌──────────────────────┐
      │  Component tests     │  ← 3-4 critical user flows
      └──────────────────────┘
     ┌────────────────────────┐
     │   Unit tests           │  ← pattern matcher, resolvers, useAssistant
     │   (highest count)      │
     └────────────────────────┘
```

### 1. Unit tests — Pattern matcher (`server/utils/intents.test.ts`)

Pure logic, deterministic, highest priority:

- `matchQuery("today check-ins")` → `{ domain: 'reservations', action: 'upcoming_checkins', params: { when: 'today' } }`
- `matchQuery("cleaning schedule this week")` → `{ domain: 'cleaning', action: 'cleaning_schedule', params: { when: 'week' } }`
- `matchQuery("revenue this month")` → `{ domain: 'finance', action: 'revenue_summary', params: { when: 'month' } }`
- `matchQuery("what is the weather")` → `null`
- Specificity: `"check-out today"` → `upcoming_checkouts`, not `upcoming_checkins`
- Case-insensitive: `"TODAY CHECK-INS"` matches
- Date param extraction: `"tomorrow"`, `"next week"`, `"this month"`
- Empty string → `null`

### 2. Unit tests — Intent resolver (`server/utils/intents.test.ts` or separate file)

- Returns correct `{ toolCalls, chunks }` shape for each intent
- Chunks split on sentence boundaries
- Empty data → fallback response

### 3. Unit tests — Composable (`app/composables/useAssistant.test.ts`)

- Initial state: empty messages, not streaming
- Submit appends user message immediately
- Submit sets `isStreaming = true`
- Stream completion sets `isStreaming = false`
- `stop()` cancels in-flight stream
- `clear()` empties messages
- Error sets `error` ref and triggers toast

### 4. Component tests (`app/components/assistant/ElevAIAssistant.test.ts`)

Only critical user flows:

- Renders empty state with 6 suggestion chips when no messages
- Clicking a chip fills input and sends
- Shows loader while waiting for first chunk
- Renders streamed text + tool badge after response
- Tool badge toggles expanded state on click
- ESC key emits close
- `aria-live` region exists on conversation container

### 5. Server route integration (`server/api/assistant.post.test.ts`)

- POST `/api/assistant` returns streaming response for valid query
- First chunk contains `tool_call`, subsequent chunks contain `text`
- Returns fallback response for unmatched query
- Returns 400 for malformed request body

### 6. Manual smoke test (documented in spec)

5-step checklist:

1. Click ElevAIButton → panel slides in
2. Empty state shows 6 chips
3. Click "Today's check-ins" chip → message streams in within 2s
4. Tool badge appears below message with correct label
5. Navigate to `/listings` while panel open → page changes, panel stays, content visible behind

### TDD order

1. Pattern matcher tests + impl (write tests first)
2. Resolver tests + impl
3. Composable tests + impl
4. Server route + integration test
5. Component tests (after components exist)
6. Manual smoke test

### Coverage target

~80% for `server/utils/intents.ts` and `useAssistant.ts`. Lower coverage OK for visual components (manual smoke covers them).

### What NOT to test

- ai-elements internals (their code, our wrapper is thin)
- Mock data fixture content (data, validated manually)
- Visual animations (slide-in transform)
- Real LLM responses (mock-only)

---

## 8. Open Questions / Future Work

- **Real AI swap-in**: When ready to use real Claude, replace `server/api/assistant.post.ts` impl with `streamText` from `ai` SDK + `@ai-sdk/anthropic` + tool definitions. Client code (composable, components) unchanged.
- **Multi-language queries**: v2 could add language detection → match in user's locale → respond in user's language.
- **Write actions**: v2 could enable "create task", "send message to guest" via additional tool definitions.
- **Conversation persistence**: v2 could store threads in localStorage or backend, with a thin history sidebar.
- **Voice input/output**: v3 — leverage the audio-player components already installed at `app/components/ai-elements/audio-player/`.
- **Rate limiting**: Add to server route when real AI lands (per-user, per-minute caps).

---

## 9. CLAUDE.md Update

Add to the **Main Modules** list:

```
- **AI Assistant** — Global Ask AI slide-over panel (mock-only v1), accessible from header on any page. Streams answers about reservations, cleaning, listings, occupancy, and revenue. Uses ai-elements Message/Conversation/PromptInput/Response/Tool/Loader components.
```

Add to **Component Selection Hierarchy → Module-Specific Components**:

```
- **AI Assistant**: `ElevAIButton` (header trigger), `ElevAIPanel` (slide-over shell), `assistant/ElevAIAssistant` (chat root), `assistant/ElevAIConversation`, `assistant/ElevAIMessage`, `assistant/ElevAIResponse`, `assistant/ElevAIToolBadge`, `assistant/ElevAILoader`, `assistant/ElevAIEmptyState`, `assistant/ElevAISuggestionChip`
```

Update **UI Patterns** section:

```
### AI Assistant Panel Color Tokens
The AI Assistant slide-over panel uses **primary color** (same as primary buttons), not ElevAI gold. Gold remains reserved for inline ElevAI brand elements (HostBuddy suggestion chip, etc.). See `docs/superpowers/specs/2026-07-10-elev8-ai-assistant-design.md`.
```