# Branding Final Polish — Review Report

## Status

**Complete** — all three review polish fixes applied, focused tests pass, commit created.

## Worktree

- Path: `/Users/juli/Documents/ELEV8-DASHBOARD/Dashboard/.claude/worktrees/agent-aa000ea06df21c8a`
- Branch: `branding-final-polish` (new branch off `feat/key-management`)
- Base: `4ccdc8f` (HEAD of `feat/key-management` — the reviewed base containing the full branding feature)

> Note: `git rev-parse origin/feat/key-management` returned `668e2e2` (pre-branding), but the task's parenthetical identifies the reviewed base as `4ccdc8f docs(branding): document branding settings`. The latter was used as the base because `feat/key-management` (local) is the reviewed branch and the review was done against its full state.

## Files Changed (5 files)

| File | Change |
| --- | --- |
| `app/app.vue` | Restored reactive `bodyAttrs.class` wrapper as a `computed()` ref. Converted `useHead(() => ({ ... }))` to factory form `useHead(() => { ...; return { ... } })`, capturing `theme` once at the top of the factory and referencing it from inside the computed. Kept the reactive `link: [{ rel: 'icon', href: getBrandingFaviconHref(branding.value) }]`. |
| `server/api/tenant-branding/index.put.ts` | Added trailing newline (content unchanged). |
| `server/utils/tenant-branding-store.ts` | Added trailing newline (content unchanged). |
| `guide-app/app/pages/[token].vue` | Added trailing newline (content unchanged). |
| `CLAUDE.md` | Three documentation corrections — see below. |

### CLAUDE.md edits

1. **Dashboard integration subsection** (`app.vue` bullet):
   - Old: `Hydration-safe via `<ClientOnly>` around the data-URL branch.`
   - New: `Hydration-safe via the `isHydrated` gate — LocalStorage hydration runs only in `onMounted`, so SSR renders the default `/favicon.ico`; client hydration swaps to the custom data URL post-mount.`

2. **Module overview** (added a new bullet — the original sentence was not present at the reviewed base, so the new sentence was added in its place to satisfy the reviewer's intent):
   - Added: `- Calling `useTenantBranding()` registers a client-only `onMounted` hook that hydrates LocalStorage and resyncs the mock server after dashboard startup.`

3. **Composables Reference table** (extended `useTenantBranding` row):
   - Old: `branding, resolvedInvoiceLogo, faviconHref, saveBranding(), syncGuestGuideBranding().`
   - New: `branding, isHydrated, lastSyncError, resolvedInvoiceLogo, faviconHref, createDefaultBrandingDraft, hydrateBranding(), saveBranding(), syncGuestGuideBranding().`

## Commit

- Branch: `branding-final-polish`
- Commit hash: `6553db9421ef211f9186f990b94b1011dd27e40c`
- Subject: `chore(branding): final review polish`
- Trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`
- Files: 5 changed, 28 insertions(+), 24 deletions(-)

## Verification Commands & Outcomes

| Command | Outcome |
| --- | --- |
| `pnpm exec vitest run tests/composables/useTenantBranding.test.ts tests/components/settings tests/components/layout tests/guide-app tests/server` | **PASS** — 12 test files, 49 tests, 3.88s. |
| `pnpm typecheck` | **FAIL** with pre-existing unrelated errors (journeys/payment-requests/tasks/users). None of the errors reference `app.vue`, `server/...tenant-branding*`, or `guide-app/app/pages/[token].vue`. Per task instructions: recorded, not fixed. |
| `pnpm exec eslint app/app.vue server/api/tenant-branding/index.put.ts server/utils/tenant-branding-store.ts guide-app/app/pages/[token].vue` | 18 pre-existing errors in `[token].vue` only (perfectionist/sort-imports and antfu/if-newline formatting). `app.vue` and the two server files: **0 errors**. The `[token].vue` errors are unrelated to the trailing-newline change (the diff is +1 trailing newline, no other edits). Per task instructions: recorded, not fixed. |

## Self-Review

- The reactive factory form in `app.vue` captures `theme` once (`const currentTheme = theme`) before `return { ... }` so the body-class computed reads from a stable reference captured inside the factory closure. This matches the task's instruction "Re-evaluate `theme` once at the top of the factory and reference it inside the computed."
- `computed` is auto-imported by Nuxt, so no import edit was required.
- `bodyAttrs.class` now re-evaluates whenever `theme.value?.color` or `theme.value?.type` change.
- The trailing-newline additions are idempotent and were verified by `git diff` (each shows exactly one `-No newline at end of file` → no newline line).
- CLAUDE.md edits are surgical text replacements verified via `grep` post-edit.

## Concerns

- The original sentence about `useTenantBranding()` "guaranteeing LocalStorage hydration" did not exist at the reviewed base (`4ccdc8f`). It was added as a new bullet in the module overview to satisfy the reviewer's intent. If the reviewer expected a literal in-place replace and the new sentence was meant to be omitted, the new bullet can be removed without further impact.
- `pnpm typecheck` reports pre-existing errors in journeys/payment-requests/tasks/users pages — none touch the branding feature. Per task: not fixed, recorded.
- ESLint reports 18 pre-existing formatting errors in `guide-app/app/pages/[token].vue` (perfectionist sort-imports + antfu if-newline). The change to that file was only a trailing newline. Per task: not fixed, recorded.
