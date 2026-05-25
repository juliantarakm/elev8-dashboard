# Auto-Translate Messages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auto-translate toggle to inbox that translates guest messages to Bahasa Indonesia and shows outgoing translation indicator.

**Architecture:** Add `autoTranslate` boolean state to `useInbox` composable. Add `guestLanguage` to `Conversation` type and `translatedContent` to `Message` type. Mock translate function simulates 500ms async translation. ThreadMessage conditionally renders translated content. ReplyBox shows language indicator.

**Tech Stack:** Vue 3, Nuxt 3, shadcn-vue, Tailwind CSS, vue-sonner

---

### Task 1: Update types and mock data

**Files:**
- Modify: `app/components/inbox/data/conversations.ts:35-60` (Conversation interface)
- Modify: `app/components/inbox/data/conversations.ts:82-96` (Message interface)
- Modify: `app/components/inbox/data/conversations.ts:124-130` (GuestDetails interface)
- Modify: `app/components/inbox/data/conversations.ts:216-742` (conversations mock data)

- [ ] **Step 1: Add `guestLanguage` to `Conversation` interface**

At line 57, after `linkedUpsellOrderIds?: string[]`, add:

```ts
guestLanguage?: string
```

- [ ] **Step 2: Add `translatedContent` to `Message` interface**

At line 95, after `upsellOffer?: UpsellOffer`, add:

```ts
translatedContent?: string
```

- [ ] **Step 3: Add `language` to `GuestDetails` interface**

At line 129, after `notes: string`, add:

```ts
language: string
```

- [ ] **Step 4: Add `guestLanguage` to conversation mock data**

Add `guestLanguage: 'English'` to these conversations:
- `conv-1` (Sarah Mitchell) — line ~241
- `conv-2` (James Wilson) — line ~267
- `conv-3` (Emily Chen) — line ~293
- `conv-4` (Alex Rivera) — line ~319
- `conv-6` (Priya Sharma) — line ~370

Add `guestLanguage: 'Japanese'` to:
- `conv-5` (Liam Tanaka) — line ~345

Leave remaining conversations without `guestLanguage` (Indonesian-speaking guests or undetermined).

- [ ] **Step 5: Add `language` field to reservation `guestDetails`**

Find each `guestDetails` object in the `reservations` record and add `language` matching the conversation's `guestLanguage`. For reservations without a matching `guestLanguage`, set `language: 'Indonesian'`.

- [ ] **Step 6: Verify build**

Run: `npx nuxi typecheck` (or `npm run typecheck`)
Expected: No type errors

---

### Task 2: Add translate state and mock translate function to useInbox

**Files:**
- Modify: `app/composables/useInbox.ts`

- [ ] **Step 1: Add `autoTranslate` state**

After line 54 (`const rightPanelCollapsed = ...`), add:

```ts
const autoTranslate = useState<boolean>('inbox-auto-translate', () => false)
```

- [ ] **Step 2: Add `mockTranslate` function**

After the `autoTranslate` state declaration, add:

```ts
const mockTranslations: Record<string, string> = {
  'Hi! We\'re arriving tomorrow and wanted to confirm the check-in process.': 'Halo! Kami tiba besok dan ingin mengonfirmasi proses check-in.',
  'What time is check-in? We arrive at 3 PM.': 'Jam berapa check-in? Kami tiba jam 3 sore.',
  'Thanks for the info! I\'ll confirm soon.': 'Terima kasih infonya! Saya akan konfirmasi segera.',
  'Is there parking available at the property?': 'Apakah ada parkir di properti?',
  'Thank you so much! Really looking forward to our stay.': 'Terima kasih banyak! Sangat menantikan masa tinggal kami.',
  'Could you recommend any good restaurants nearby?': 'Bisa rekomendasikan restoran bagus di sekitar sini?',
  'Hello! We had a great time at your place. Thank you!': 'Halo! Kami senang sekali di tempat Anda. Terima kasih!',
  'We had an issue with the AC. Can someone come fix it?': 'Kami ada masalah dengan AC. Bisa kirim orang untuk memperbaiki?',
  'What\'s the WiFi password?': 'Password WiFi-nya apa?',
  'Thanks for the wonderful stay! We\'ll definitely be back.': 'Terima kasih untuk masa tinggal yang menyenangkan! Kami pasti akan kembali.',
  'Is early check-in possible? Our flight arrives at 10 AM.': 'Apakah early check-in memungkinkan? Penerbangan kami tiba jam 10 pagi.',
  'Can we extend our stay by one night?': 'Bisa memperpanjang masa tinggal kami satu malam?',
  'The hot water isn\'t working properly.': 'Air panas tidak berfungsi dengan baik.',
  'Do you provide airport transfer service?': 'Apakah Anda menyediakan layanan transfer bandara?',
}

async function mockTranslate(text: string, _targetLang: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockTranslations[text] ?? `[Diterjemahkan] ${text}`
}
```

- [ ] **Step 3: Expose new state and function in return**

In the return block, add:

```ts
autoTranslate,
mockTranslate,
```

---

### Task 3: Add translate toggle button to Thread header

**Files:**
- Modify: `app/components/inbox/Thread.vue`

- [ ] **Step 1: Destructure `autoTranslate` from `useInbox()`**

At line 6-18, add `autoTranslate` to the destructured values:

```ts
const { selectedConversation,
  selectedMessages,
  selectedReservation,
  markAsHandled,
  markAsUnread,
  isElevaiEnabled,
  useSuggestion,
  getNotes,
  addNote,
  getPhoneCalls,
  rightPanelCollapsed,
  toggleRightPanel,
  autoTranslate,
} = useInbox()
```

- [ ] **Step 2: Add toggle function**

After the `handleAddNote` function (around line 129), add:

```ts
function toggleAutoTranslate() {
  autoTranslate.value = !autoTranslate.value
  toast.info(autoTranslate.value ? 'Auto-translate enabled' : 'Auto-translate disabled')
}
```

- [ ] **Step 3: Add translate toggle button in header**

In the template, inside the `<div class="flex items-center gap-2 shrink-0">` (line 177), add a button before the existing `Tooltip` for "Mark as Resolved":

```vue
<Tooltip>
  <TooltipTrigger as-child>
    <Button
      variant="outline"
      size="sm"
      :class="autoTranslate ? 'border-primary text-primary' : ''"
      @click="toggleAutoTranslate"
    >
      <Icon name="lucide:languages" class="size-4 mr-1" />
      Translate
    </Button>
  </TooltipTrigger>
  <TooltipContent>{{ autoTranslate ? 'Disable' : 'Enable' }} auto-translate</TooltipContent>
</Tooltip>
```

---

### Task 4: Show translated content in ThreadMessage for guest messages

**Files:**
- Modify: `app/components/inbox/ThreadMessage.vue`

- [ ] **Step 1: Import `useInbox` and add translate logic**

After line 19 (`const { retryMessage } = useInbox()`), update to also destructure `autoTranslate` and `mockTranslate`:

```ts
const { retryMessage, autoTranslate, mockTranslate } = useInbox()
```

- [ ] **Step 2: Add translation state and watcher**

After `isSystemMessage` computed (line 68), add:

```ts
const translation = ref<string | null>(null)
const isTranslating = ref(false)

watch([() => props.message.content, autoTranslate], async ([content, enabled]) => {
  if (props.message.sender !== 'guest' || !enabled) {
    translation.value = null
    return
  }
  isTranslating.value = true
  translation.value = await mockTranslate(content, 'Bahasa Indonesia')
  isTranslating.value = false
}, { immediate: true })
```

- [ ] **Step 3: Add translated content section in template**

In the template, inside the guest message bubble (line 114-116), replace the simple `{{ message.content }}` with:

```vue
<div :class="cn('rounded-2xl px-3 py-2 text-sm', bubbleClass)">
  {{ message.content }}
  <div v-if="isTranslating" class="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
    <Icon name="lucide:loader-2" class="size-3 animate-spin text-muted-foreground" />
    <span class="text-xs text-muted-foreground">Translating...</span>
  </div>
  <div v-else-if="translation" class="mt-2 pt-2 border-t border-border/50">
    <div class="flex items-center gap-1 mb-1">
      <Icon name="lucide:languages" class="size-3 text-muted-foreground" />
      <span class="text-[10px] text-muted-foreground">Translated to Bahasa Indonesia</span>
    </div>
    <p class="text-xs text-muted-foreground leading-relaxed">{{ translation }}</p>
  </div>
</div>
```

---

### Task 5: Show translation indicator in ReplyBox

**Files:**
- Modify: `app/components/inbox/ReplyBox.vue`

- [ ] **Step 1: Destructure `autoTranslate` and `selectedConversation` from useInbox**

Update line 13:

```ts
const { isElevaiEnabled, pendingSuggestion, clearSuggestion, selectedReservation, sendMessage, selectedConversation, autoTranslate } = useInbox()
```

Note: `selectedConversation` is already partially available but add it to the destructure if not there.

- [ ] **Step 2: Add computed for guest language**

After `const channelLabel` computed (around line 44), add:

```ts
const guestLanguage = computed(() => selectedConversation.value?.guestLanguage)
const showTranslateIndicator = computed(() => autoTranslate.value && !!guestLanguage.value)
```

- [ ] **Step 3: Add translation indicator in template**

In the template, after the `</Textarea>` closing tag (line 133) and before the `</div>` that closes the `relative` div (line 156), add:

```vue
<div v-if="showTranslateIndicator" class="flex items-center gap-1.5 px-1 mt-1">
  <Icon name="lucide:languages" class="size-3.5 text-muted-foreground" />
  <span class="text-[11px] text-muted-foreground">Messages will be auto-translated to {{ guestLanguage }}</span>
</div>
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 2: Navigate to /inbox**

- Verify conversations load
- Click Translate button in thread header
- Verify guest messages show loading → translated text
- Verify ReplyBox shows translation indicator
- Click Translate again to disable
- Verify translations disappear
