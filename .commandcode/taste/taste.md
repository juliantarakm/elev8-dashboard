# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# communication
- Always respond in English, even when the user writes in Indonesian. Confidence: 0.85

# finance
- No charts or progress bars — use full data tables only. Confidence: 0.90
- Use toast feedback for all user actions (create, rename, delete, toggle, save, move). Confidence: 0.85
- Use confirmation dialogs for destructive actions (delete, duplicate). Confidence: 0.80

# workflow
- Push to GitHub after completing each feature chunk. Confidence: 0.88
- Update CLAUDE.md alongside pushes to keep project context current. Confidence: 0.88
- Commit first, then push (`git commit` → `git push`). Confidence: 0.70
- Check git status (uncommitted/untracked) before pushing. Confidence: 0.65
- Brainstorm and discuss design before implementation. Confidence: 0.75

# ui-patterns
- Show empty state first, then provide an add/create button to populate. Confidence: 0.80
- Use sheet/drawer components for forms rather than full-page navigation. Confidence: 0.75
- Reuse existing shadcn-vue components rather than building custom ones. Confidence: 0.75

# vue-nuxt
- Reka UI SwitchRoot ignores external `:checked` prop changes — use `:key` force re-mount as workaround. Confidence: 0.85
- Reka UI CheckboxRoot `:key` force-remount workaround doesn't fix visual state — replace with plain `<span>` + Tailwind classes instead. Confidence: 0.85
- shadcn-vue Input/Textarea require `:model-value` + `@update:model-value` bindings, NOT `:value` + `@input`. Confidence: 0.85
- Nuxt auto-imports components with directory prefix: `components/inventory/FooDrawer.vue` → `<InventoryFooDrawer>`. Confidence: 0.80
- Use `useState<T>()` with spread syntax for shared reactive state in composables. Confidence: 0.80

# workflow
- Prefer `pnpm dev` over `pnpm build` during development to avoid browser crash from heavy builds. Confidence: 0.65

# payment-requests
- Use "cancel" terminology (not "delete") for cancelling payment links. Confidence: 0.65

# whatsapp
- WhatsApp connection must use OAuth flow, not manual form fields. Confidence: 0.70

# data
- Prefer real data from Elev8 Suite OS MCP over mock data when available. Confidence: 0.70

# notifications
- Marking a notification as read should NOT remove/dismiss it from the list. Confidence: 0.75
- Cleaning job statuses: 'scheduled' (today/future), 'in_progress' (today only), 'done' (today/past, not future), 'missed' (past only — housekeeping missed it). Confidence: 0.75
- Each notification category should have a unique icon (e.g., cleaning = broom icon) instead of just a dot. Confidence: 0.70
- Use a single dash (hyphen) in place of em dashes in notification text. Confidence: 0.75
