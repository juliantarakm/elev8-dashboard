# Auto-Translate Messages — Design Spec

**Date:** 2026-05-25
**Scope:** Inbox module — auto-translate guest messages to Bahasa Indonesia, auto-translate outgoing staff messages to guest language (mock).

## Types

### `Conversation` — new field

```ts
guestLanguage?: string  // e.g. "English", "Japanese", "Korean"
```

### `Message` — new field

```ts
translatedContent?: string  // cached translation of `content`
```

## State (`useInbox.ts`)

```ts
const autoTranslate = useState<boolean>('inbox-auto-translate', () => false)
```

### `mockTranslate(text: string, targetLang: string): Promise<string>`

Simulated translation with 500ms delay. For demo purposes only. Swap with real API later.

- Target "Bahasa Indonesia" for incoming (guest → staff)
- Target guest's language for outgoing (staff → guest)

## UI Changes

### 1. Thread Header — Auto-translate toggle

Location: `Thread.vue`, action bar (same row as "Mark as Resolved" button).

- `Button` with `lucide:languages` icon
- Variant: `outline` when OFF, `default` when ON
- Tooltip: "Auto-translate messages"
- Label text: "Translate"

### 2. `ThreadMessage.vue` — Guest message translation

When `autoTranslate` is ON and `message.sender === 'guest'`:

- Show original `message.content`
- Thin separator line
- Show `translatedContent` in smaller text, muted color
- Small "Translated" badge (outline variant) next to separator

Translation is computed on render (mock async, show loading skeleton then text).

### 3. `ReplyBox.vue` — Outgoing translation indicator

When `autoTranslate` is ON:

- Show indicator text below the textarea: "Messages will be auto-translated to [guestLanguage]"
- Small `lucide:languages` icon + muted text
- On send: mock-translate the reply before sending, show translated text in a brief flash

### 4. Mock Data

Add `guestLanguage` to conversations that have non-Indonesian guests (e.g. English, Japanese).

## Files Changed

| File | Change |
|------|--------|
| `app/components/inbox/data/conversations.ts` | Add `guestLanguage` to `Conversation`, add `translatedContent` to `Message`, update mock data |
| `app/composables/useInbox.ts` | Add `autoTranslate` state, `mockTranslate()` function, expose in return |
| `app/components/inbox/Thread.vue` | Add translate toggle button in header |
| `app/components/inbox/ThreadMessage.vue` | Show translated content for guest messages when translate is ON |
| `app/components/inbox/ReplyBox.vue` | Show translation indicator, mock-translate on send |
