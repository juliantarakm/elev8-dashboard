# Branding Settings Design

**Date:** 2026-07-18  
**Status:** Approved for implementation planning

## Summary

Add a tenant-level **Settings → Branding** page where Elev8 customers can configure:

- A primary logo used by the dashboard and public Guest Guide
- A favicon used by the dashboard and public Guest Guide browser tabs
- An optional invoice-specific logo
- Primary, background, and text colors used only by the public Guest Guide

This is a mock-first implementation. Branding is persisted in browser storage, applied to the dashboard immediately after saving, and relayed through a small in-memory API store so the separately hosted Guest Guide app can consume the same configuration. The feature exposes invoice branding through a live preview and a shared composable, but it does not add invoice or PDF generation.

## Goals

1. Provide one tenant-level branding configuration surface.
2. Show live Dashboard, Guest Guide, and Invoice previews before saving.
3. Apply saved logo and favicon settings to the dashboard.
4. Apply saved logo, favicon, and colors to the public Guest Guide.
5. Provide a stable invoice-logo fallback for future invoice renderers.
6. Preserve Elev8 defaults when custom assets are absent.
7. Persist the mock configuration across dashboard refreshes.

## Non-goals

- Cloud asset storage or database persistence
- Invoice/PDF generation
- Applying custom colors to the Elev8 dashboard or invoices
- Website Builder branding synchronization
- Per-property or per-listing branding
- New authorization or role enforcement
- Image cropping, editing, or compression
- SVG upload and sanitization

## Navigation and Page Structure

### Routes and navigation

Create `/settings/branding` and add **Branding** to:

- The main sidebar's Settings submenu
- The Settings layout's internal navigation

Use the existing `SettingsLayout` with its wide layout option so the editor and preview can sit side by side.

### Responsive layout

Desktop:

- Left column: branding controls
- Right column: sticky live preview

Mobile and narrow screens:

- Branding controls first
- Preview below the controls
- No horizontally clipped controls or preview content

## User Experience

### Page header

- Title: **Branding**
- Description: **Customize how your brand appears in the dashboard, Guest Guide, and invoices.**

### Brand assets section

The section contains three instances of one reusable asset field.

#### Primary logo

- Label: **Primary logo**
- Used in the dashboard sidebar workspace header and at the top of the public Guest Guide.
- Used as the invoice fallback when an invoice-specific logo is not configured.
- Accepts PNG, JPEG, and WebP.
- Maximum file size: 1 MB.
- Transparent PNG is recommended.
- Recommended canvas: approximately 400 × 120 px.

#### Favicon

- Label: **Favicon**
- Used in browser tabs for the dashboard and public Guest Guide.
- Accepts PNG and ICO.
- Maximum file size: 512 KB.
- Recommended dimensions: 32 × 32 px or 64 × 64 px.

#### Invoice logo

- Label: **Invoice logo**
- Used only by the invoice preview and future invoice renderers.
- Accepts PNG, JPEG, and WebP.
- Maximum file size: 1 MB.
- Shows a **Using primary logo** fallback state when empty.
- Recommended canvas: approximately 400 × 120 px.

Each asset field supports:

- Upload
- Thumbnail preview
- Replace
- Remove
- File name and size display
- Inline type, size, and decode errors

A failed replacement preserves the previously selected asset.

### Guest Guide colors section

Expose three color values:

1. **Primary color** — buttons, active states, icons, and branded accents
2. **Background color** — page and card surfaces
3. **Text color** — primary body and heading text

Each color control includes:

- Native color input
- Editable six-digit hexadecimal input
- Visible color swatch

Rules:

- Values must use `#RRGGBB` format.
- Hex values are normalized to uppercase when committed.
- Primary-button foreground is automatically chosen as black or white using WCAG contrast calculations.
- A non-blocking warning appears when text and background contrast is below WCAG AA's 4.5:1 threshold.
- Derived muted text and border colors are calculated from the selected text and background values rather than exposed as additional settings.
- These colors never modify dashboard theme tokens or invoice styling.

### Actions and dirty state

The page footer contains:

- **Reset to Elev8 defaults**
- **Save changes**

Behavior:

- The form owns an editable draft separate from saved branding.
- The live preview responds immediately to the draft.
- Runtime consumers change only after a successful local save.
- Save is disabled when there are no changes, validation is blocking, or a save is already in progress.
- Reset changes the draft to the Elev8 defaults; the reset becomes active only after Save changes.
- A success toast confirms a complete save.

No route-leave confirmation is added in this version.

## Live Preview

Use a tabbed preview with three views.

### Dashboard preview

Show a compact representation of:

- The sidebar workspace header with the primary logo
- A browser-tab strip with the favicon

Dashboard colors remain unchanged, including inside the preview.

### Guest Guide preview

Show a compact Guest Guide composition containing:

- Brand logo header
- Hero/title area
- Example content card
- Primary action button

Apply all three draft colors and the automatically computed primary foreground. This preview must use the same color-token mapping as the public Guest Guide runtime.

### Invoice preview

Show a sample invoice containing:

- Resolved invoice logo
- Invoice metadata
- Guest and property details
- Example line items and total

Logo resolution order:

1. Invoice logo
2. Primary logo
3. Elev8 preview fallback

The preview is illustrative only and does not generate or download a PDF.

## Data Model

```ts
export interface BrandingAsset {
  name: string
  type: string
  size: number
  dataUrl: string
}

export interface GuestGuideBrandColors {
  primary: string
  background: string
  text: string
}

export interface TenantBranding {
  primaryLogo: BrandingAsset | null
  favicon: BrandingAsset | null
  invoiceLogo: BrandingAsset | null
  guestGuideColors: GuestGuideBrandColors
  updatedAt: string
}
```

The composable exposes `resolvedInvoiceLogo`, equivalent to:

```ts
branding.invoiceLogo ?? branding.primaryLogo
```

Elev8 defaults are defined in one shared module. The initial Guest Guide colors are:

- Primary: `#F6BB12`
- Background: `#FFFFFF`
- Text: `#18181B`

Default asset behavior:

- Dashboard primary logo: retain the existing workspace icon when no custom logo is configured.
- Guest Guide primary logo: retain the existing no-custom-logo layout when no custom logo is configured.
- Dashboard and Guest Guide favicon: use `/favicon.ico` when no custom favicon is configured.
- Invoice preview: use the Elev8 preview fallback when neither invoice nor primary logo exists.

## State and Persistence

### Client-side source of truth

Add `useTenantBranding` as the only dashboard-side branding state API. It provides:

- `branding`: saved reactive configuration
- `defaults`: immutable Elev8 defaults
- `resolvedInvoiceLogo`
- `saveBranding(draft)`
- `createDefaultBrandingDraft()`
- `syncGuestGuideBranding()`
- storage hydration and validation

Persistence key:

```text
elev8-tenant-branding-v1
```

The composable uses the established `useState` plus client-only LocalStorage hydration pattern. Stored data is schema-checked before use. Invalid or obsolete data falls back to defaults rather than crashing rendering. `updatedAt` is not editable; `saveBranding` replaces it with `new Date().toISOString()` only after validation succeeds.

Asset limits keep the base64-expanded payload below normal LocalStorage quotas:

- Primary logo: 1 MB source file
- Invoice logo: 1 MB source file
- Favicon: 512 KB source file

### Save order

1. Validate the full draft.
2. Serialize and write the draft to LocalStorage.
3. Update the saved reactive state.
4. Synchronize the configuration with the mock server branding store.
5. Report complete success or partial synchronization failure.

If LocalStorage fails, saved reactive state must not change and the draft remains available for correction or retry.

If LocalStorage succeeds but server synchronization fails, dashboard branding still changes. Show a warning toast with a **Retry** action that calls `syncGuestGuideBranding()` using the saved configuration. The composable also retries once during the next client hydration.

## Dashboard Integration

### Primary logo

Update the sidebar workspace header to consume `useTenantBranding`:

- Render the custom primary logo inside the existing brand/workspace avatar area.
- Preserve the current workspace name and layout.
- Fall back to the existing icon when no primary logo exists.
- Provide meaningful alternative text.

### Favicon

Update `app.vue` to make the favicon `href` reactive through `useHead`:

- Custom favicon data URL when configured
- `/favicon.ico` otherwise

Hydration starts from the default and updates after client-side LocalStorage hydration, avoiding server/client markup assumptions about browser-only state.

Dashboard color mode and theme customization remain independent from tenant branding.

## Guest Guide Integration

The dashboard and public Guest Guide run on different origins during development, so they cannot share LocalStorage. Branding travels through the existing Guest Guide API response.

### Mock server store

Add an in-memory singleton branding store initialized with Elev8 defaults and a small update endpoint:

```text
PUT /api/tenant-branding
```

The endpoint validates the branding payload before replacing the current mock value.

The dashboard synchronizes its saved LocalStorage value:

- After Save changes
- Once after client hydration when a valid saved value exists

The server store intentionally resets when the mock server restarts. A dashboard initialization re-synchronizes the persisted browser value.

### Public guide payload

Extend the public by-token response with a top-level field:

```ts
{
  link,
  guide,
  listing,
  checkIn,
  checkOut,
  branding
}
```

Branding remains global rather than being copied into every Guest Guide record.

### Public guide runtime

The public Guest Guide app:

- Renders the custom primary logo in a compact brand header above guide content.
- Omits the custom brand header when no primary logo exists, preserving the current layout.
- Updates its document favicon through `useHead`.
- Converts saved hex colors to the HSL channel format expected by the Guest Guide's existing CSS variables.
- Applies scoped variables at the guide page root.

Token mapping:

- Primary → `--primary`
- Computed black/white foreground → `--primary-foreground`
- Background → `--background` and `--card`
- Text → `--foreground` and `--card-foreground`
- Derived blends → muted foreground and border tokens

This changes only the public Guest Guide page and does not modify dashboard CSS variables.

## Invoice Integration

No invoice renderer exists in the current codebase, so this feature does not introduce one.

`useTenantBranding` exposes the saved invoice logo and resolved fallback for future invoice consumers. The Branding page's invoice preview is the only new rendered invoice surface in this scope. Existing invoice strings, accounting integration records, downloads, and payment-request data remain unchanged.

## Component Boundaries

### New files

```text
app/pages/settings/branding.vue
app/components/settings/BrandingForm.vue
app/components/settings/BrandingAssetField.vue
app/components/settings/BrandingPreview.vue
app/components/settings/data/branding.ts
app/composables/useTenantBranding.ts
server/api/tenant-branding/index.put.ts
server/utils/tenant-branding-store.ts
guide-app/app/components/BrandHeader.vue
```

`BrandHeader.vue` owns the optional custom-logo bar so the public guide page remains responsible only for fetching data, applying page-level tokens, and composing sections.

### Updated files

Expected integration points:

```text
app/constants/menus.ts
app/components/settings/SidebarNav.vue
app/components/layout/SidebarNavHeader.vue
app/app.vue
server/api/guest-guides/by-token/[token].get.ts
guide-app/app/pages/[token].vue
guide-app/app/composables/usePublicGuestGuide.ts
guide-app/app/assets/css/main.css
```

The implementation must preserve these boundaries: shared state and defaults in the composable/data module, reusable upload behavior in `BrandingAssetField`, preview-only markup in `BrandingPreview`, server relay in the API/store, and runtime rendering in each app's existing shell.

## Validation and Error Handling

### Blocking validation

- Unsupported MIME type
- File over the field's size limit
- Image cannot be decoded
- Color is not a six-digit hex value
- Draft does not match the local `TenantBranding` schema

A blocking error disables Save changes.

### Non-blocking validation

- Text/background contrast below 4.5:1
- Unexpected but valid logo aspect ratio

Non-blocking issues show guidance but do not prevent saving.

### Failure behavior

- Failed asset replacement preserves the old asset.
- LocalStorage quota or serialization failure preserves saved branding and the draft.
- Mock API synchronization failure preserves dashboard branding and offers retry feedback.
- Missing or invalid public branding falls back to server defaults.
- Broken custom asset data falls back without preventing the rest of the page from rendering.

## Accessibility

- Every file input has an explicit label and description.
- Upload, replace, remove, and preview-tab controls are keyboard accessible.
- Icon-only buttons have `aria-label` values.
- Logo images have meaningful alternative text.
- Color controls do not rely on color alone; hex values and field labels remain visible.
- Contrast warnings identify the affected color pair in text.
- Preview tabs use the existing accessible shadcn-vue Tabs primitives.

## Testing Strategy

### Composable tests

Test:

- Default values
- Valid LocalStorage hydration
- Invalid stored-data fallback
- Persistence after save
- Saved state remains unchanged on storage failure
- Default reset draft
- Invoice-logo fallback resolution
- Server synchronization and retry behavior

### Component tests

Test:

- Accepted and rejected file types
- Individual size limits
- Decode failure
- Upload, replace, and remove behavior
- Failed replacement preserves old asset
- Draft-driven preview updates
- Hex normalization and validation
- Contrast warning behavior
- Save disabled/dirty/loading states
- Invoice preview fallback order

### API tests

Test:

- Default server branding
- Valid branding update
- Invalid branding rejection
- Public Guest Guide by-token response includes branding
- Public response falls back safely when no custom branding is configured

### End-to-end verification

Run the dashboard and Guest Guide applications and verify:

1. Upload and save a primary logo.
2. Confirm the dashboard sidebar updates.
3. Upload and save a favicon.
4. Confirm the dashboard browser tab updates.
5. Refresh the dashboard and confirm LocalStorage persistence.
6. Open a public Guest Guide and confirm its logo and favicon.
7. Confirm all three Guest Guide colors apply to the expected tokens.
8. Confirm dashboard colors remain unchanged.
9. Confirm the invoice preview uses the invoice logo when present.
10. Remove the invoice logo and confirm fallback to the primary logo.
11. Enter a low-contrast color pair and confirm the warning does not block saving.
12. Reset to defaults, save, and confirm Elev8 fallback behavior.

Run at minimum:

```text
pnpm typecheck
pnpm lint
pnpm exec vitest run
```

The repository does not define a `test` package script, so tests run through the installed Vitest binary.

## Acceptance Criteria

- Branding is available at `/settings/branding` from both Settings navigation surfaces.
- Users can upload, preview, replace, and remove all three assets.
- Users can configure primary, background, and text colors for Guest Guide only.
- The three preview tabs respond to unsaved draft changes.
- Saved primary logo appears in the dashboard sidebar and public Guest Guide.
- Saved favicon appears in dashboard and Guest Guide browser tabs.
- Invoice preview uses invoice logo → primary logo → Elev8 fallback order.
- Dashboard theme colors and invoice colors do not change.
- Saved configuration survives dashboard refreshes.
- Public Guest Guide receives branding through its API payload.
- Invalid uploads and colors provide clear inline feedback without corrupting saved state.
- Defaults and partial-failure behavior are deterministic and tested.
