# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# communication
- Always respond in English, even when the user writes in Indonesian. Confidence: 0.85

# finance
- For Booking Revenue double-entry tables: each line item must have separate Debit and Credit account columns/selectors, not a single account with a pre-assigned debit/credit indicator. Confidence: 0.65
- No charts or progress bars — use full data tables only. Confidence: 0.90
- Use toast feedback for all user actions (create, rename, delete, toggle, save, move). Confidence: 0.85
- Use confirmation dialogs for destructive actions (delete, duplicate). Confidence: 0.80
- Header currency must dynamically reflect the tenant account's currency setting (currently CHF). Confidence: 0.70

# workflow
- Push to GitHub after completing each feature chunk. Confidence: 0.88
- Update CLAUDE.md alongside pushes to keep project context current. Confidence: 0.92
- Commit first, then push (`git commit` → `git push`). Confidence: 0.70
- Check git status (uncommitted/untracked) before pushing. Confidence: 0.65
- Brainstorm and discuss design before implementation. Confidence: 0.75

# ui-patterns
See [ui-patterns/taste.md](ui-patterns/taste.md)
# vue-nuxt
- Reka UI SwitchRoot ignores external `:checked` prop changes — use `:key` force re-mount as workaround. Confidence: 0.85
- Reka UI CheckboxRoot `:key` force-remount workaround doesn't fix visual state — replace with plain `<span>` + Tailwind classes instead. Confidence: 0.85
- shadcn-vue Input/Textarea require `:model-value` + `@update:model-value` bindings, NOT `:value` + `@input`. Confidence: 0.85
- Nuxt auto-imports components with directory prefix: `components/inventory/FooDrawer.vue` → `<InventoryFooDrawer>`. Confidence: 0.80
- Use `useState<T>()` with spread syntax for shared reactive state in composables. Confidence: 0.80

# finance
See [finance/taste.md](finance/taste.md)
# workflow
- Prefer `pnpm dev` over `pnpm build` during development to avoid browser crash from heavy builds. Confidence: 0.65
- Use mock data for third-party API integrations during development before switching to real API calls. Confidence: 0.75

# payment-requests
- Use "cancel" terminology (not "delete") for cancelling payment links. Confidence: 0.75

# whatsapp
- WhatsApp connection must use OAuth flow, not manual form fields. Confidence: 0.70

# data
- Prefer real data from Elev8 Suite OS MCP over mock data when available. Confidence: 0.70
- Property hierarchy must support three levels: Property → Unit Type (e.g., Kingbed, Single Bed) → Unit (room with specific bed). Confidence: 0.75

# data
- Within a unit type, guest capacity settings (max adults, max children, max infants) must be uniform across all units — no per-unit capacity overrides. Confidence: 0.65

# notifications
- Marking a notification as read should NOT remove/dismiss it from the list. Confidence: 0.75
- Cleaning job statuses: 'scheduled' (today/future), 'in_progress' (today only), 'done' (today/past, not future), 'missed' (past only — housekeeping missed it). Confidence: 0.75
- Each notification category should have a unique icon (e.g., cleaning = broom icon) instead of just a dot. Confidence: 0.70
- Use a single dash (hyphen) in place of em dashes in notification text. Confidence: 0.75
