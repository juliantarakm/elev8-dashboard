# Branding Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-level Settings → Branding page that persists logos, favicon, and Guest Guide colors locally, applies them to the dashboard and public Guest Guide, and previews invoice-logo fallback behavior.

**Architecture:** A typed `useTenantBranding` composable is the dashboard source of truth and persists one branding object to LocalStorage. Saving also updates a singleton in-memory Nitro store; the existing public Guest Guide by-token response carries that branding object to the separate guide app, which applies scoped CSS variables, logo, and favicon. Focused asset, color, preview, and form components keep file handling, presentation, and persistence independent.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, TypeScript, shadcn-vue/reka-ui, Tailwind CSS, H3/Nitro API routes, LocalStorage, Vitest, Vue Test Utils

---

## Scope and File Map

### New production files

- `app/components/settings/data/branding.ts` — branding types, defaults, guards, cloning, and fallback helpers.
- `app/lib/branding-assets.ts` — client-side file validation, reading, and decode verification.
- `app/lib/branding-colors.ts` — hex/HSL conversion, WCAG contrast, derived Guest Guide CSS variables.
- `app/composables/useTenantBranding.ts` — saved state, LocalStorage hydration, save, API synchronization, retry state.
- `server/utils/tenant-branding-store.ts` — singleton mock server branding state.
- `server/api/tenant-branding/index.put.ts` — validated mock branding update endpoint.
- `app/components/settings/BrandingAssetField.vue` — reusable upload/replace/remove field.
- `app/components/settings/BrandingPreview.vue` — Dashboard, Guest Guide, and Invoice previews.
- `app/components/settings/BrandingForm.vue` — draft orchestration, color controls, validation, save/reset actions.
- `app/pages/settings/branding.vue` — route wrapper using wide Settings layout.
- `guide-app/app/components/BrandHeader.vue` — optional custom-logo bar in public guides.
- `guide-app/public/favicon.ico` — Guest Guide fallback favicon copied from the dashboard asset.

### Modified production files

- `app/components/settings/SidebarNav.vue` — internal Settings navigation entry.
- `app/constants/menus.ts` — main sidebar Settings submenu entry.
- `app/components/layout/SidebarNavHeader.vue` — primary-logo rendering with existing icon fallback.
- `app/app.vue` — reactive dashboard favicon and branding hydration.
- `server/api/guest-guides/by-token/[token].get.ts` — include branding in public payload.
- `guide-app/app/composables/usePublicGuestGuide.ts` — type the complete public response, including branding.
- `guide-app/app/pages/[token].vue` — apply brand header, favicon, and scoped Guest Guide variables.
- `guide-app/app/assets/css/main.css` — define all runtime-overridden token defaults.
- `CLAUDE.md` — document the new module, composable, and files manually; no scanner exists in this repository.

### New tests

- `tests/components/settings/data/branding.test.ts`
- `tests/lib/branding-assets.test.ts`
- `tests/lib/branding-colors.test.ts`
- `tests/server/utils/tenant-branding-store.test.ts`
- `tests/server/api/tenant-branding.put.test.ts`
- `tests/server/api/guest-guide-branding.get.test.ts`
- `tests/composables/useTenantBranding.test.ts`
- `tests/components/settings/BrandingAssetField.spec.ts`
- `tests/components/settings/BrandingPreview.spec.ts`
- `tests/components/settings/BrandingForm.spec.ts`
- `tests/components/layout/SidebarNavHeader.spec.ts`
- `tests/guide-app/BrandHeader.spec.ts`

## Implementation Rules

- Keep tenant branding separate from per-user `useAppSettings` theme state.
- Do not add a PDF generator, cloud upload service, database, role system, SVG support, or Website Builder synchronization.
- Use spread replacement for reactive state changes.
- Use shadcn-vue primitives instead of cloning their markup.
- Apply user-selected hex values through Vue `:style`; do not introduce hard-coded Tailwind color classes.
- Preserve `/favicon.ico`, the existing sidebar icon, and the current no-logo Guest Guide layout as default behavior.
- Run the named test after every red/green pair and commit after every task.

---

### Task 1: Add branding domain, asset, and color utilities

**Files:**
- Create: `app/components/settings/data/branding.ts`
- Create: `app/lib/branding-assets.ts`
- Create: `app/lib/branding-colors.ts`
- Test: `tests/components/settings/data/branding.test.ts`
- Test: `tests/lib/branding-assets.test.ts`
- Test: `tests/lib/branding-colors.test.ts`

- [ ] **Step 1: Write failing branding-domain tests**

Create `tests/components/settings/data/branding.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  BRANDING_STORAGE_KEY,
  cloneTenantBranding,
  createDefaultTenantBranding,
  getBrandingFaviconHref,
  isTenantBranding,
  resolveInvoiceLogo,
} from '~/components/settings/data/branding'

describe('branding domain', () => {
  it('creates independent Elev8 defaults', () => {
    const first = createDefaultTenantBranding()
    const second = createDefaultTenantBranding()

    first.guestGuideColors.primary = '#000000'

    expect(second.guestGuideColors).toEqual({
      primary: '#F6BB12',
      background: '#FFFFFF',
      text: '#18181B',
    })
    expect(BRANDING_STORAGE_KEY).toBe('elev8-tenant-branding-v1')
  })

  it('deep clones asset and color values', () => {
    const source = createDefaultTenantBranding()
    source.primaryLogo = {
      name: 'logo.png',
      type: 'image/png',
      size: 128,
      dataUrl: 'data:image/png;base64,AA==',
    }

    const clone = cloneTenantBranding(source)
    clone.primaryLogo!.name = 'changed.png'
    clone.guestGuideColors.text = '#000000'

    expect(source.primaryLogo.name).toBe('logo.png')
    expect(source.guestGuideColors.text).toBe('#18181B')
  })

  it('validates the complete branding shape', () => {
    const valid = createDefaultTenantBranding()
    expect(isTenantBranding(valid)).toBe(true)
    expect(isTenantBranding({ ...valid, guestGuideColors: { ...valid.guestGuideColors, text: 'black' } })).toBe(false)
    expect(isTenantBranding({ ...valid, primaryLogo: { name: 'x', type: 'text/plain', size: 1, dataUrl: 'x' } })).toBe(false)
  })

  it('resolves invoice and favicon fallbacks deterministically', () => {
    const branding = createDefaultTenantBranding()
    const primary = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const invoice = { name: 'invoice.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,BB==' }

    branding.primaryLogo = primary
    expect(resolveInvoiceLogo(branding)).toEqual(primary)
    branding.invoiceLogo = invoice
    expect(resolveInvoiceLogo(branding)).toEqual(invoice)
    expect(getBrandingFaviconHref(branding)).toBe('/favicon.ico')
    branding.favicon = { name: 'favicon.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,CC==' }
    expect(getBrandingFaviconHref(branding)).toBe(branding.favicon.dataUrl)
  })
})
```

- [ ] **Step 2: Write failing asset and color tests**

Create `tests/lib/branding-assets.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { BRANDING_ASSET_RULES, fileToBrandingAsset, validateBrandingFile } from '~/lib/branding-assets'

describe('branding assets', () => {
  it('accepts supported primary-logo and favicon files', () => {
    expect(validateBrandingFile(new File(['x'], 'logo.png', { type: 'image/png' }), 'primaryLogo')).toBeNull()
    expect(validateBrandingFile(new File(['x'], 'favicon.ico', { type: 'image/x-icon' }), 'favicon')).toBeNull()
  })

  it('rejects unsupported file types and files over the configured limit', () => {
    expect(validateBrandingFile(new File(['x'], 'logo.svg', { type: 'image/svg+xml' }), 'primaryLogo')).toBe('Primary logo must be a PNG, JPEG, or WebP file.')
    const oversized = new File(
      [new Uint8Array(BRANDING_ASSET_RULES.favicon.maxSize + 1)],
      'favicon.png',
      { type: 'image/png' },
    )
    expect(validateBrandingFile(oversized, 'favicon')).toBe('Favicon must be 512 KB or smaller.')
  })

  it('reads and decode-checks a valid file', async () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    const file = new File(['image'], 'logo.png', { type: 'image/png' })

    const asset = await fileToBrandingAsset(file, 'primaryLogo', decode)

    expect(decode).toHaveBeenCalledOnce()
    expect(asset.name).toBe('logo.png')
    expect(asset.type).toBe('image/png')
    expect(asset.dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('surfaces decode failure without returning an asset', async () => {
    const decode = vi.fn().mockRejectedValue(new Error('decode failed'))
    const file = new File(['broken'], 'logo.png', { type: 'image/png' })

    await expect(fileToBrandingAsset(file, 'primaryLogo', decode))
      .rejects.toThrow('The selected image could not be read.')
  })
})
```

Create `tests/lib/branding-colors.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildGuestGuideCssVariables,
  contrastRatio,
  getReadableForeground,
  hexToHslChannels,
  mixHex,
} from '~/lib/branding-colors'

describe('branding colors', () => {
  it('converts canonical hex colors to HSL channels', () => {
    expect(hexToHslChannels('#FFFFFF')).toBe('0 0% 100%')
    expect(hexToHslChannels('#000000')).toBe('0 0% 0%')
  })

  it('calculates WCAG contrast and primary foreground', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(getReadableForeground('#F6BB12')).toBe('#000000')
    expect(getReadableForeground('#111111')).toBe('#FFFFFF')
  })

  it('mixes colors and builds the complete Guest Guide token map', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')

    const colors = { primary: '#F6BB12', background: '#FFFFFF', text: '#18181B' }
    const variables = buildGuestGuideCssVariables(colors)

    expect(variables['--primary']).toBe(hexToHslChannels(colors.primary))
    expect(variables['--primary-foreground']).toBe(hexToHslChannels('#000000'))
    expect(variables['--background']).toBe(variables['--card'])
    expect(variables['--foreground']).toBe(variables['--card-foreground'])
    expect(variables).toHaveProperty('--muted')
    expect(variables).toHaveProperty('--muted-foreground')
    expect(variables).toHaveProperty('--border')
    expect(variables).toHaveProperty('--input')
    expect(variables).toHaveProperty('--ring')
  })
})
```

- [ ] **Step 3: Run the tests and verify red state**

Run:

```bash
pnpm exec vitest run \
  tests/components/settings/data/branding.test.ts \
  tests/lib/branding-assets.test.ts \
  tests/lib/branding-colors.test.ts
```

Expected: FAIL because the three production modules do not exist.

- [ ] **Step 4: Implement the branding domain**

Create `app/components/settings/data/branding.ts`:

```ts
export type BrandingAssetKind = 'primaryLogo' | 'favicon' | 'invoiceLogo'

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

export interface PublicGuestGuideBranding {
  primaryLogo: BrandingAsset | null
  favicon: BrandingAsset | null
  guestGuideColors: GuestGuideBrandColors
  cssVariables: Record<string, string>
}

export const BRANDING_STORAGE_KEY = 'elev8-tenant-branding-v1'
export const DEFAULT_GUEST_GUIDE_COLORS: GuestGuideBrandColors = {
  primary: '#F6BB12',
  background: '#FFFFFF',
  text: '#18181B',
}

export function createDefaultTenantBranding(): TenantBranding {
  return {
    primaryLogo: null,
    favicon: null,
    invoiceLogo: null,
    guestGuideColors: { ...DEFAULT_GUEST_GUIDE_COLORS },
    updatedAt: '',
  }
}

export function cloneTenantBranding(value: TenantBranding): TenantBranding {
  return {
    primaryLogo: value.primaryLogo ? { ...value.primaryLogo } : null,
    favicon: value.favicon ? { ...value.favicon } : null,
    invoiceLogo: value.invoiceLogo ? { ...value.invoiceLogo } : null,
    guestGuideColors: { ...value.guestGuideColors },
    updatedAt: value.updatedAt,
  }
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
}

export function normalizeHex(value: string): string {
  return value.toUpperCase()
}

function isBrandingAsset(
  value: unknown,
  allowedTypes: string[],
  maxSize: number,
): value is BrandingAsset {
  if (!value || typeof value !== 'object') return false
  const asset = value as Record<string, unknown>
  return typeof asset.name === 'string'
    && typeof asset.type === 'string'
    && allowedTypes.includes(asset.type)
    && typeof asset.size === 'number'
    && asset.size >= 0
    && asset.size <= maxSize
    && typeof asset.dataUrl === 'string'
    && asset.dataUrl.startsWith(`data:${asset.type};base64,`)
}

export function isTenantBranding(value: unknown): value is TenantBranding {
  if (!value || typeof value !== 'object') return false
  const branding = value as Record<string, any>
  const colors = branding.guestGuideColors
  const logoTypes = ['image/png', 'image/jpeg', 'image/webp']
  const faviconTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
  return (branding.primaryLogo === null || isBrandingAsset(branding.primaryLogo, logoTypes, 1024 * 1024))
    && (branding.favicon === null || isBrandingAsset(branding.favicon, faviconTypes, 512 * 1024))
    && (branding.invoiceLogo === null || isBrandingAsset(branding.invoiceLogo, logoTypes, 1024 * 1024))
    && !!colors
    && isHexColor(colors.primary)
    && isHexColor(colors.background)
    && isHexColor(colors.text)
    && typeof branding.updatedAt === 'string'
}

export function resolveInvoiceLogo(branding: TenantBranding): BrandingAsset | null {
  return branding.invoiceLogo ?? branding.primaryLogo
}

export function getBrandingFaviconHref(
  branding?: Pick<TenantBranding, 'favicon'> | null,
): string {
  return branding?.favicon?.dataUrl ?? '/favicon.ico'
}
```

- [ ] **Step 5: Implement asset validation and reading**

Create `app/lib/branding-assets.ts`:

```ts
import type { BrandingAsset, BrandingAssetKind } from '~/components/settings/data/branding'

interface BrandingAssetRule {
  accept: string
  mimeTypes: string[]
  extensions: string[]
  maxSize: number
  typeError: string
  sizeError: string
}

export const BRANDING_ASSET_RULES: Record<BrandingAssetKind, BrandingAssetRule> = {
  primaryLogo: {
    accept: 'image/png,image/jpeg,image/webp',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
    maxSize: 1024 * 1024,
    typeError: 'Primary logo must be a PNG, JPEG, or WebP file.',
    sizeError: 'Primary logo must be 1 MB or smaller.',
  },
  favicon: {
    accept: 'image/png,image/x-icon,image/vnd.microsoft.icon,.ico',
    mimeTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    extensions: ['png', 'ico'],
    maxSize: 512 * 1024,
    typeError: 'Favicon must be a PNG or ICO file.',
    sizeError: 'Favicon must be 512 KB or smaller.',
  },
  invoiceLogo: {
    accept: 'image/png,image/jpeg,image/webp',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
    maxSize: 1024 * 1024,
    typeError: 'Invoice logo must be a PNG, JPEG, or WebP file.',
    sizeError: 'Invoice logo must be 1 MB or smaller.',
  },
}

export function validateBrandingFile(file: File, kind: BrandingAssetKind): string | null {
  const rule = BRANDING_ASSET_RULES[kind]
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const validType = rule.mimeTypes.includes(file.type)
    || (!file.type && rule.extensions.includes(extension))

  if (!validType) return rule.typeError
  if (file.size > rule.maxSize) return rule.sizeError
  return null
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.readAsDataURL(file)
  })
}

export function decodeImageDataUrl(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('The selected image could not be read.'))
    image.src = dataUrl
  })
}

export async function fileToBrandingAsset(
  file: File,
  kind: BrandingAssetKind,
  decode: (dataUrl: string) => Promise<void> = decodeImageDataUrl,
): Promise<BrandingAsset> {
  const error = validateBrandingFile(file, kind)
  if (error) throw new Error(error)

  try {
    let dataUrl = await readFileAsDataUrl(file)
    if (!file.type && kind === 'favicon' && file.name.toLowerCase().endsWith('.ico')) {
      dataUrl = dataUrl.replace(/^data:application\/octet-stream/, 'data:image/x-icon')
    }
    await decode(dataUrl)
    return { name: file.name, type: file.type || 'image/x-icon', size: file.size, dataUrl }
  }
  catch {
    throw new Error('The selected image could not be read.')
  }
}

export function formatBrandingFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

- [ ] **Step 6: Implement color and contrast helpers**

Create `app/lib/branding-colors.ts`:

```ts
import type { GuestGuideBrandColors } from '~/components/settings/data/branding'

interface Rgb { r: number, g: number, b: number }

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '')
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function channelToHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0').toUpperCase()
}

export function hexToHslChannels(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min
  let hue = 0
  let saturation = 0

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }

  if (hue < 0) hue += 360
  const round = (value: number) => Math.round(value * 10) / 10
  return `${round(hue)} ${round(saturation * 100)}% ${round(lightness * 100)}%`
}

function linearChannel(value: number): number {
  const normalized = value / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b)
}

export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

export function getReadableForeground(background: string): '#000000' | '#FFFFFF' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF')
    ? '#000000'
    : '#FFFFFF'
}

export function mixHex(foreground: string, background: string, weight: number): string {
  const first = hexToRgb(foreground)
  const second = hexToRgb(background)
  return `#${channelToHex(first.r * weight + second.r * (1 - weight))}${channelToHex(first.g * weight + second.g * (1 - weight))}${channelToHex(first.b * weight + second.b * (1 - weight))}`
}

export function buildGuestGuideCssVariables(colors: GuestGuideBrandColors): Record<string, string> {
  const primaryForeground = getReadableForeground(colors.primary)
  const muted = mixHex(colors.text, colors.background, 0.08)
  const mutedForeground = mixHex(colors.text, colors.background, 0.65)
  const border = mixHex(colors.text, colors.background, 0.18)

  return {
    '--primary': hexToHslChannels(colors.primary),
    '--primary-foreground': hexToHslChannels(primaryForeground),
    '--background': hexToHslChannels(colors.background),
    '--card': hexToHslChannels(colors.background),
    '--foreground': hexToHslChannels(colors.text),
    '--card-foreground': hexToHslChannels(colors.text),
    '--muted': hexToHslChannels(muted),
    '--muted-foreground': hexToHslChannels(mutedForeground),
    '--border': hexToHslChannels(border),
    '--input': hexToHslChannels(border),
    '--ring': hexToHslChannels(colors.primary),
  }
}
```

- [ ] **Step 7: Run the focused tests and verify green state**

Run the Step 3 command again.

Expected: all branding domain, asset, and color tests PASS.

- [ ] **Step 8: Commit the foundations**

```bash
git add \
  app/components/settings/data/branding.ts \
  app/lib/branding-assets.ts \
  app/lib/branding-colors.ts \
  tests/components/settings/data/branding.test.ts \
  tests/lib/branding-assets.test.ts \
  tests/lib/branding-colors.test.ts
git commit -m "feat(branding): add branding domain utilities" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Add the mock server branding store and update endpoint

**Files:**
- Create: `server/utils/tenant-branding-store.ts`
- Create: `server/api/tenant-branding/index.put.ts`
- Test: `tests/server/utils/tenant-branding-store.test.ts`
- Test: `tests/server/api/tenant-branding.put.test.ts`

- [ ] **Step 1: Write failing store and endpoint tests**

Create `tests/server/utils/tenant-branding-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import {
  getTenantBranding,
  resetTenantBranding,
  setTenantBranding,
} from '~/server/utils/tenant-branding-store'

describe('tenant branding store', () => {
  beforeEach(() => resetTenantBranding())

  it('starts with Elev8 defaults', () => {
    expect(getTenantBranding()).toEqual(createDefaultTenantBranding())
  })

  it('stores defensive copies', () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    setTenantBranding(branding)
    branding.guestGuideColors.primary = '#000000'

    expect(getTenantBranding().guestGuideColors.primary).toBe('#123456')
  })
})
```

Create `tests/server/api/tenant-branding.put.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import handler from '~/server/api/tenant-branding/index.put'
import { getTenantBranding, resetTenantBranding } from '~/server/utils/tenant-branding-store'

async function invoke(body: unknown) {
  const ParsedBodySymbol = Symbol.for('h3ParsedBody')
  const req: any = { headers: {} }
  req[ParsedBodySymbol] = body
  return handler({ node: { req, res: {} }, context: {} } as any)
}

describe('PUT /api/tenant-branding', () => {
  beforeEach(() => resetTenantBranding())

  it('stores and returns a valid branding payload', async () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    branding.updatedAt = '2026-07-18T10:00:00.000Z'

    await expect(invoke(branding)).resolves.toEqual(branding)
    expect(getTenantBranding()).toEqual(branding)
  })

  it('rejects invalid branding without changing the store', async () => {
    await expect(invoke({ guestGuideColors: { primary: 'yellow' } })).rejects.toMatchObject({ statusCode: 400 })
    expect(getTenantBranding()).toEqual(createDefaultTenantBranding())
  })
})
```

- [ ] **Step 2: Run focused server tests and verify red state**

```bash
pnpm exec vitest run \
  tests/server/utils/tenant-branding-store.test.ts \
  tests/server/api/tenant-branding.put.test.ts
```

Expected: FAIL because the store and endpoint do not exist.

- [ ] **Step 3: Implement the singleton store**

Create `server/utils/tenant-branding-store.ts`:

```ts
import type { TenantBranding } from '../../app/components/settings/data/branding'
import {
  cloneTenantBranding,
  createDefaultTenantBranding,
} from '../../app/components/settings/data/branding'

let currentBranding = createDefaultTenantBranding()

export function getTenantBranding(): TenantBranding {
  return cloneTenantBranding(currentBranding)
}

export function setTenantBranding(value: TenantBranding): TenantBranding {
  currentBranding = cloneTenantBranding(value)
  return getTenantBranding()
}

export function resetTenantBranding(): void {
  currentBranding = createDefaultTenantBranding()
}
```

- [ ] **Step 4: Implement the validated PUT endpoint**

Create `server/api/tenant-branding/index.put.ts`:

```ts
import { createError, defineEventHandler, readBody } from 'h3'
import { isTenantBranding } from '../../../app/components/settings/data/branding'
import { setTenantBranding } from '../../utils/tenant-branding-store'

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  if (!isTenantBranding(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid branding payload' })
  }
  return setTenantBranding(body)
})
```

Do not modify `server/middleware/guest-guides-cors.ts`: the dashboard calls this endpoint from the same origin, and the public Guide app only reads branding from the existing CORS-enabled by-token endpoint.

- [ ] **Step 5: Run focused server tests and verify green state**

Run the Step 2 command again.

Expected: both files PASS.

- [ ] **Step 6: Commit the server relay**

```bash
git add \
  server/utils/tenant-branding-store.ts \
  server/api/tenant-branding/index.put.ts \
  tests/server/utils/tenant-branding-store.test.ts \
  tests/server/api/tenant-branding.put.test.ts
git commit -m "feat(branding): add mock branding API store" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Add the tenant branding composable

**Files:**
- Create: `app/composables/useTenantBranding.ts`
- Test: `tests/composables/useTenantBranding.test.ts`

- [ ] **Step 1: Write failing composable tests**

Create `tests/composables/useTenantBranding.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cloneTenantBranding,
  createDefaultTenantBranding,
} from '~/components/settings/data/branding'
import { useTenantBranding } from '~/composables/useTenantBranding'

const storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}
const fetchMock = vi.fn()

beforeEach(() => {
  storage.getItem.mockReset().mockReturnValue(null)
  storage.setItem.mockReset()
  fetchMock.mockReset().mockResolvedValue({})
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/dashboard/' } }))
  vi.stubGlobal('$fetch', fetchMock)
})

describe('useTenantBranding', () => {
  it('starts from Elev8 defaults', () => {
    const { branding, resolvedInvoiceLogo, faviconHref } = useTenantBranding()
    expect(branding.value).toEqual(createDefaultTenantBranding())
    expect(resolvedInvoiceLogo.value).toBeNull()
    expect(faviconHref.value).toBe('/favicon.ico')
  })

  it('hydrates a valid stored value and synchronizes it', async () => {
    const stored = createDefaultTenantBranding()
    stored.guestGuideColors.primary = '#123456'
    storage.getItem.mockReturnValue(JSON.stringify(stored))

    const { branding, hydrateBranding } = useTenantBranding()
    expect(hydrateBranding()).toBe(true)

    expect(branding.value.guestGuideColors.primary).toBe('#123456')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/dashboard/api/tenant-branding', {
      method: 'PUT',
      body: stored,
    }))
  })

  it('ignores invalid stored data', () => {
    storage.getItem.mockReturnValue(JSON.stringify({ guestGuideColors: { primary: 'bad' } }))
    const { branding, hydrateBranding } = useTenantBranding()
    expect(hydrateBranding()).toBe(false)
    expect(branding.value).toEqual(createDefaultTenantBranding())
  })

  it('does not change saved state when LocalStorage fails', async () => {
    storage.setItem.mockImplementation(() => { throw new Error('quota') })
    const { branding, saveBranding } = useTenantBranding()
    const before = cloneTenantBranding(branding.value)
    const draft = createDefaultTenantBranding()
    draft.guestGuideColors.primary = '#123456'

    const result = await saveBranding(draft)

    expect(result).toEqual({ saved: false, synced: false, error: 'Unable to save branding in this browser.' })
    expect(branding.value).toEqual(before)
  })

  it('keeps a local save and exposes retry state when synchronization fails', async () => {
    ;(fetchMock as any).mockRejectedValue(new Error('offline'))
    const { branding, lastSyncError, saveBranding, syncGuestGuideBranding } = useTenantBranding()
    const draft = createDefaultTenantBranding()
    draft.guestGuideColors.primary = '#123456'

    const result = await saveBranding(draft)

    expect(result.saved).toBe(true)
    expect(result.synced).toBe(false)
    expect(branding.value.guestGuideColors.primary).toBe('#123456')
    expect(lastSyncError.value).toBe('Guest Guide branding could not be synchronized.')

    ;(fetchMock as any).mockResolvedValue({})
    await expect(syncGuestGuideBranding()).resolves.toBe(true)
    expect(lastSyncError.value).toBeNull()
  })

  it('uses the primary logo as the invoice fallback', () => {
    const { branding, resolvedInvoiceLogo } = useTenantBranding()
    branding.value = {
      ...branding.value,
      primaryLogo: { name: 'logo.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' },
    }
    expect(resolvedInvoiceLogo.value?.name).toBe('logo.png')
  })
})
```

- [ ] **Step 2: Run the composable test and verify red state**

```bash
pnpm exec vitest run tests/composables/useTenantBranding.test.ts
```

Expected: FAIL because `useTenantBranding.ts` does not exist.

- [ ] **Step 3: Implement `useTenantBranding`**

Create `app/composables/useTenantBranding.ts`:

```ts
import type { TenantBranding } from '~/components/settings/data/branding'
import { computed, getCurrentInstance, onMounted } from 'vue'
import {
  BRANDING_STORAGE_KEY,
  cloneTenantBranding,
  createDefaultTenantBranding,
  getBrandingFaviconHref,
  isTenantBranding,
  resolveInvoiceLogo,
} from '~/components/settings/data/branding'

export interface BrandingSaveResult {
  saved: boolean
  synced: boolean
  error?: string
}

function readStoredBranding(): TenantBranding | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isTenantBranding(parsed) ? cloneTenantBranding(parsed) : null
  }
  catch {
    return null
  }
}

function getBrandingApiUrl(): string {
  const baseURL = useRuntimeConfig().app.baseURL || '/'
  return `${baseURL.replace(/\/$/, '')}/api/tenant-branding`
}

export function useTenantBranding() {
  const branding = useState<TenantBranding>('tenant-branding', createDefaultTenantBranding)
  const isHydrated = useState<boolean>('tenant-branding-hydrated', () => false)
  const lastSyncError = useState<string | null>('tenant-branding-sync-error', () => null)

  async function syncGuestGuideBranding(): Promise<boolean> {
    try {
      await $fetch(getBrandingApiUrl(), {
        method: 'PUT',
        body: cloneTenantBranding(branding.value),
      })
      lastSyncError.value = null
      return true
    }
    catch {
      lastSyncError.value = 'Guest Guide branding could not be synchronized.'
      return false
    }
  }

  function hydrateBranding(): boolean {
    if (isHydrated.value) return false
    const stored = readStoredBranding()
    if (stored) branding.value = stored
    isHydrated.value = true
    if (stored) void syncGuestGuideBranding()
    return !!stored
  }

  async function saveBranding(draft: TenantBranding): Promise<BrandingSaveResult> {
    const next: TenantBranding = {
      ...cloneTenantBranding(draft),
      updatedAt: new Date().toISOString(),
    }
    if (!isTenantBranding(next)) {
      return { saved: false, synced: false, error: 'Branding contains invalid values.' }
    }

    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next))
    }
    catch {
      return { saved: false, synced: false, error: 'Unable to save branding in this browser.' }
    }

    branding.value = next
    const synced = await syncGuestGuideBranding()
    return synced
      ? { saved: true, synced: true }
      : { saved: true, synced: false, error: lastSyncError.value ?? undefined }
  }

  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => { hydrateBranding() })
  }

  return {
    branding,
    isHydrated,
    lastSyncError,
    resolvedInvoiceLogo: computed(() => resolveInvoiceLogo(branding.value)),
    faviconHref: computed(() => getBrandingFaviconHref(branding.value)),
    createDefaultBrandingDraft: createDefaultTenantBranding,
    hydrateBranding,
    saveBranding,
    syncGuestGuideBranding,
  }
}
```

- [ ] **Step 4: Run the composable test and verify green state**

Run the Step 2 command again.

Expected: all `useTenantBranding` tests PASS.

- [ ] **Step 5: Commit the composable**

```bash
git add app/composables/useTenantBranding.ts tests/composables/useTenantBranding.test.ts
git commit -m "feat(branding): add persistent branding state" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Add branding to the public Guest Guide API response

**Files:**
- Modify: `server/api/guest-guides/by-token/[token].get.ts:1-42`
- Modify: `guide-app/app/composables/usePublicGuestGuide.ts:1-8`
- Test: `tests/server/api/guest-guide-branding.get.test.ts`

- [ ] **Step 1: Write the failing public-response test**

Create `tests/server/api/guest-guide-branding.get.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'
import handler from '~/server/api/guest-guides/by-token/[token].get'
import { resetTenantBranding, setTenantBranding } from '~/server/utils/tenant-branding-store'

function invoke(token: string) {
  return handler({
    context: { params: { token } },
    node: { req: { url: `/api/guest-guides/by-token/${token}` }, res: {} },
  } as any)
}

describe('GET /api/guest-guides/by-token/:token branding', () => {
  beforeEach(() => resetTenantBranding())

  it('includes the singleton branding object', async () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    branding.invoiceLogo = { name: 'private.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    setTenantBranding(branding)

    const result = await invoke('abc123def456')

    expect(result.branding).toEqual({
      primaryLogo: branding.primaryLogo,
      favicon: branding.favicon,
      guestGuideColors: branding.guestGuideColors,
      cssVariables: buildGuestGuideCssVariables(branding.guestGuideColors),
    })
    expect(result.branding).not.toHaveProperty('invoiceLogo')
    expect(result.guide.id).toBe('gg-mock-001')
  })
})
```

- [ ] **Step 2: Run the response test and verify red state**

```bash
pnpm exec vitest run tests/server/api/guest-guide-branding.get.test.ts
```

Expected: FAIL because `result.branding` is undefined.

- [ ] **Step 3: Extend the server response**

Modify `server/api/guest-guides/by-token/[token].get.ts`:

```ts
import { getTenantBranding } from '../../../utils/tenant-branding-store'
import { buildGuestGuideCssVariables } from '../../../../app/lib/branding-colors'
```

Change the return statement to expose only public Guest Guide fields, avoiding transfer of the invoice-only asset:

```ts
const tenantBranding = getTenantBranding()
const branding = {
  primaryLogo: tenantBranding.primaryLogo,
  favicon: tenantBranding.favicon,
  guestGuideColors: tenantBranding.guestGuideColors,
  cssVariables: buildGuestGuideCssVariables(tenantBranding.guestGuideColors),
}
return { link, guide, listing, checkIn, checkOut, branding }
```

- [ ] **Step 4: Type the complete Guide app contract**

Modify `guide-app/app/composables/usePublicGuestGuide.ts`:

```ts
import type { GuestGuide, GuestGuideLink } from '~/../app/components/guest-guides/data/types'
import type { PublicGuestGuideBranding } from '~/../app/components/settings/data/branding'

export interface PublicGuideResponse {
  link: GuestGuideLink
  guide: GuestGuide
  listing?: any
  checkIn: string | null
  checkOut: string | null
  branding: PublicGuestGuideBranding
}
```

Leave `fetchGuide`, `markOpened`, `submitForm`, and `logLockView` unchanged.

- [ ] **Step 5: Run API test and both typechecks**

```bash
pnpm exec vitest run tests/server/api/guest-guide-branding.get.test.ts
pnpm typecheck
pnpm --dir guide-app typecheck
```

Expected: response test PASS; both typechecks PASS.

- [ ] **Step 6: Commit the public contract**

```bash
git add \
  server/api/guest-guides/by-token/'[token].get.ts' \
  guide-app/app/composables/usePublicGuestGuide.ts \
  tests/server/api/guest-guide-branding.get.test.ts
git commit -m "feat(branding): expose branding to guest guides" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Apply branding in the public Guest Guide app

**Files:**
- Create: `guide-app/app/components/BrandHeader.vue`
- Create: `guide-app/public/favicon.ico` by copying `public/favicon.ico`
- Modify: `guide-app/app/pages/[token].vue:1-175`
- Modify: `guide-app/app/assets/css/main.css:4-23`
- Test: `tests/guide-app/BrandHeader.spec.ts`

- [ ] **Step 1: Write a failing BrandHeader component test**

Create `tests/guide-app/BrandHeader.spec.ts`:

```ts
import type { PublicGuestGuideBranding } from '~/components/settings/data/branding'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'
import BrandHeader from '../../guide-app/app/components/BrandHeader.vue'

function createPublicBranding(): PublicGuestGuideBranding {
  const tenant = createDefaultTenantBranding()
  return {
    primaryLogo: tenant.primaryLogo,
    favicon: tenant.favicon,
    guestGuideColors: tenant.guestGuideColors,
    cssVariables: buildGuestGuideCssVariables(tenant.guestGuideColors),
  }
}

describe('Guest Guide BrandHeader', () => {
  it('omits the bar when no custom primary logo exists', () => {
    const wrapper = mount(BrandHeader, { props: { branding: createPublicBranding() } })
    expect(wrapper.find('[data-testid="guest-guide-brand-header"]').exists()).toBe(false)
  })

  it('renders the custom primary logo', () => {
    const branding = createPublicBranding()
    branding.primaryLogo = {
      name: 'logo.png',
      type: 'image/png',
      size: 1,
      dataUrl: 'data:image/png;base64,AA==',
    }
    const wrapper = mount(BrandHeader, { props: { branding } })

    const image = wrapper.get('[data-testid="guest-guide-brand-logo"]')
    expect(image.attributes('src')).toBe(branding.primaryLogo.dataUrl)
    expect(image.attributes('alt')).toBe('Property manager logo')
  })
})
```

- [ ] **Step 2: Run the component test and verify red state**

```bash
pnpm exec vitest run tests/guide-app/BrandHeader.spec.ts
```

Expected: FAIL because `BrandHeader.vue` does not exist.

- [ ] **Step 3: Implement the optional brand header**

Create `guide-app/app/components/BrandHeader.vue`:

```vue
<script setup lang="ts">
import type { PublicGuestGuideBranding } from '~/../app/components/settings/data/branding'

defineProps<{ branding: PublicGuestGuideBranding }>()
</script>

<template>
  <div
    v-if="branding.primaryLogo"
    data-testid="guest-guide-brand-header"
    class="mb-4 flex min-h-14 items-center rounded-xl border bg-card px-4 py-3"
  >
    <img
      data-testid="guest-guide-brand-logo"
      :src="branding.primaryLogo.dataUrl"
      alt="Property manager logo"
      class="max-h-10 max-w-48 object-contain"
    >
  </div>
</template>
```

- [ ] **Step 4: Add fallback CSS tokens and favicon asset**

Extend the `:root` block in `guide-app/app/assets/css/main.css` so every overridden token has a default:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 24 95% 53%;
  --radius: 0.5rem;
}
```

Replace the dark-mode block with the complete fallback set:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 24 95% 53%;
  }
}
```

Create the Guide app fallback favicon:

```bash
mkdir -p guide-app/public
cp public/favicon.ico guide-app/public/favicon.ico
```

- [ ] **Step 5: Apply the runtime logo, favicon, and CSS variables**

Modify `guide-app/app/pages/[token].vue`.

Add imports:

```ts
import BrandHeader from '~/components/BrandHeader.vue'
```

After `useAsyncData`, add:

```ts
const guideBrandStyle = computed(() => data.value?.branding?.cssVariables ?? {})

useHead(() => ({
  link: [
    { rel: 'icon', href: data.value?.branding?.favicon?.dataUrl ?? '/favicon.ico' },
  ],
}))
```

Update the template with three exact edits:

1. Replace the current outer opening tag:

```vue
<div class="mx-auto max-w-3xl p-4 md:p-6">
```

with:

```vue
<div class="min-h-screen bg-background text-foreground" :style="guideBrandStyle">
  <div class="mx-auto max-w-3xl p-4 md:p-6">
```

2. Insert the brand header immediately inside `<div v-else-if="data">`:

```vue
<BrandHeader :branding="data.branding" />
```

3. Add one additional `</div>` immediately before the template's final closing `</div>` so both wrappers close. Do not change the pending state, error state, existing guide header, welcome line, section ordering, forms, or section renderer markup.

- [ ] **Step 6: Run the focused test and Guide app checks**

```bash
pnpm exec vitest run tests/guide-app/BrandHeader.spec.ts
pnpm --dir guide-app typecheck
pnpm --dir guide-app build
```

Expected: BrandHeader test PASS; Guide app typecheck and build PASS.

- [ ] **Step 7: Commit the public runtime**

```bash
git add \
  guide-app/app/components/BrandHeader.vue \
  guide-app/public/favicon.ico \
  guide-app/app/pages/'[token].vue' \
  guide-app/app/assets/css/main.css \
  tests/guide-app/BrandHeader.spec.ts
git commit -m "feat(branding): apply branding to guest guides" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Build the reusable asset field

**Files:**
- Create: `app/components/settings/BrandingAssetField.vue`
- Test: `tests/components/settings/BrandingAssetField.spec.ts`

- [ ] **Step 1: Write failing controlled-component tests**

Create `tests/components/settings/BrandingAssetField.spec.ts`:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BrandingAssetField from '~/components/settings/BrandingAssetField.vue'
import { fileToBrandingAsset } from '~/lib/branding-assets'

vi.mock('~/lib/branding-assets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/branding-assets')>()
  return { ...actual, fileToBrandingAsset: vi.fn() }
})

const ButtonStub = {
  props: ['disabled'],
  template: '<button :disabled="disabled"><slot /></button>',
}

function mountField(modelValue: any = null) {
  return mount(BrandingAssetField, {
    props: {
      kind: 'primaryLogo',
      label: 'Primary logo',
      description: 'Dashboard and Guest Guide',
      modelValue,
    },
    global: {
      stubs: { Button: ButtonStub, Badge: { template: '<span><slot /></span>' }, Icon: true },
    },
  })
}

describe('BrandingAssetField', () => {
  beforeEach(() => vi.mocked(fileToBrandingAsset).mockReset())

  it('emits a decoded asset after file selection', async () => {
    const asset = { name: 'logo.png', type: 'image/png', size: 5, dataUrl: 'data:image/png;base64,AA==' }
    vi.mocked(fileToBrandingAsset).mockResolvedValue(asset)
    const wrapper = mountField()
    const input = wrapper.get('[data-testid="branding-asset-input"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File(['logo'], 'logo.png', { type: 'image/png' })] })

    await wrapper.get('[data-testid="branding-asset-input"]').trigger('change')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([asset])
    expect(wrapper.emitted('validationChange')?.[0]).toEqual([false])
  })

  it('shows an error and preserves the old asset when replacement fails', async () => {
    vi.mocked(fileToBrandingAsset).mockRejectedValue(new Error('Primary logo must be a PNG, JPEG, or WebP file.'))
    const oldAsset = { name: 'old.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const wrapper = mountField(oldAsset)
    const input = wrapper.get('[data-testid="branding-asset-input"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'logo.svg', { type: 'image/svg+xml' })] })

    await wrapper.get('[data-testid="branding-asset-input"]').trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('Primary logo must be a PNG, JPEG, or WebP file.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('validationChange')?.[0]).toEqual([true])
    expect(wrapper.get('img').attributes('src')).toBe(oldAsset.dataUrl)
  })

  it('shows a non-blocking warning for an unexpected logo aspect ratio', async () => {
    const oldAsset = { name: 'square.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const wrapper = mountField(oldAsset)
    const image = wrapper.get('img').element as HTMLImageElement
    Object.defineProperty(image, 'naturalWidth', { value: 100 })
    Object.defineProperty(image, 'naturalHeight', { value: 100 })

    await wrapper.get('img').trigger('load')

    expect(wrapper.text()).toContain('A wide logo works best here')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits null when remove is clicked', async () => {
    const wrapper = mountField({ name: 'old.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' })
    await wrapper.get('[data-testid="remove-branding-asset"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    expect(wrapper.emitted('validationChange')?.[0]).toEqual([false])
  })
})
```

- [ ] **Step 2: Run the asset-field test and verify red state**

```bash
pnpm exec vitest run tests/components/settings/BrandingAssetField.spec.ts
```

Expected: FAIL because `BrandingAssetField.vue` does not exist.

- [ ] **Step 3: Implement the controlled asset field**

Create `app/components/settings/BrandingAssetField.vue` with this contract and behavior:

```vue
<script setup lang="ts">
import type { BrandingAsset, BrandingAssetKind } from '~/components/settings/data/branding'
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BRANDING_ASSET_RULES,
  fileToBrandingAsset,
  formatBrandingFileSize,
} from '~/lib/branding-assets'

const props = defineProps<{
  kind: BrandingAssetKind
  label: string
  description: string
  modelValue: BrandingAsset | null
  fallbackLabel?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: BrandingAsset | null]
  'validationChange': [hasError: boolean]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')
const aspectWarning = ref('')
const isReading = ref(false)
const rule = computed(() => BRANDING_ASSET_RULES[props.kind])

watch(() => props.modelValue, (value) => {
  if (value) return
  errorMessage.value = ''
  aspectWarning.value = ''
})

function openPicker() {
  inputRef.value?.click()
}

function handlePreviewLoad(event: Event) {
  const image = event.target as HTMLImageElement
  const ratio = image.naturalWidth / Math.max(1, image.naturalHeight)
  if (props.kind === 'favicon') {
    aspectWarning.value = Math.abs(ratio - 1) > 0.05
      ? 'A square image works best for browser tabs.'
      : ''
    return
  }
  aspectWarning.value = ratio < 2 || ratio > 6
    ? 'A wide logo works best here (approximately 400 × 120 px).'
    : ''
}

function removeAsset() {
  aspectWarning.value = ''
  errorMessage.value = ''
  emit('validationChange', false)
  emit('update:modelValue', null)
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  isReading.value = true
  errorMessage.value = ''
  try {
    const asset = await fileToBrandingAsset(file, props.kind)
    emit('validationChange', false)
    emit('update:modelValue', asset)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'The selected image could not be read.'
    emit('validationChange', true)
  }
  finally {
    isReading.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <input
      ref="inputRef"
      data-testid="branding-asset-input"
      type="file"
      :accept="rule.accept"
      :aria-label="`Upload ${label.toLowerCase()}`"
      class="hidden"
      @change="handleFileChange"
    >

    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium">{{ label }}</p>
          <Badge v-if="!modelValue && fallbackLabel" variant="secondary">{{ fallbackLabel }}</Badge>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">{{ description }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" :disabled="isReading" @click="openPicker">
          <Icon :name="isReading ? 'lucide:loader-2' : 'lucide:upload'" :class="['mr-2 size-4', isReading && 'animate-spin']" />
          {{ modelValue ? 'Replace' : 'Upload' }}
        </Button>
        <Button
          v-if="modelValue"
          data-testid="remove-branding-asset"
          type="button"
          variant="ghost"
          size="icon"
          :aria-label="`Remove ${label.toLowerCase()}`"
          @click="removeAsset"
        >
          <Icon name="lucide:trash-2" class="size-4" />
        </Button>
      </div>
    </div>

    <div v-if="modelValue" class="mt-4 flex items-center gap-3 rounded-md border bg-muted/30 p-3">
      <div class="flex size-16 shrink-0 items-center justify-center rounded-md border bg-background p-2">
        <img :src="modelValue.dataUrl" :alt="`${label} preview`" class="max-h-full max-w-full object-contain" @load="handlePreviewLoad">
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ modelValue.name }}</p>
        <p class="text-xs text-muted-foreground">{{ formatBrandingFileSize(modelValue.size) }}</p>
      </div>
    </div>

    <p v-if="aspectWarning" role="status" class="mt-2 text-sm text-muted-foreground">{{ aspectWarning }}</p>
    <p v-if="errorMessage" role="alert" class="mt-2 text-sm text-destructive">{{ errorMessage }}</p>
  </div>
</template>
```

- [ ] **Step 4: Run the component test and verify green state**

Run the Step 2 command again.

Expected: all three asset-field tests PASS.

- [ ] **Step 5: Commit the asset field**

```bash
git add app/components/settings/BrandingAssetField.vue tests/components/settings/BrandingAssetField.spec.ts
git commit -m "feat(branding): add reusable asset field" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Build the three-mode live preview

**Files:**
- Create: `app/components/settings/BrandingPreview.vue`
- Test: `tests/components/settings/BrandingPreview.spec.ts`

- [ ] **Step 1: Write failing preview tests**

Create `tests/components/settings/BrandingPreview.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import BrandingPreview from '~/components/settings/BrandingPreview.vue'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'

const tabStubs = {
  Tabs: { template: '<div><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { template: '<button><slot /></button>' },
  TabsContent: { template: '<div><slot /></div>' },
  Icon: true,
}

describe('BrandingPreview', () => {
  it('uses draft Guest Guide variables', () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    const element = wrapper.get('[data-testid="guest-guide-preview"]').element as HTMLElement
    const expected = buildGuestGuideCssVariables(branding.guestGuideColors)
    expect(element.style.getPropertyValue('--primary')).toBe(expected['--primary'])
  })

  it('uses primary logo as invoice fallback', () => {
    const branding = createDefaultTenantBranding()
    branding.primaryLogo = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    expect(wrapper.get('[data-testid="invoice-preview-logo"]').attributes('src')).toBe(branding.primaryLogo.dataUrl)
  })

  it('prefers the invoice-specific logo', () => {
    const branding = createDefaultTenantBranding()
    branding.primaryLogo = { name: 'primary.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }
    branding.invoiceLogo = { name: 'invoice.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,BB==' }
    const wrapper = mount(BrandingPreview, { props: { branding }, global: { stubs: tabStubs } })
    expect(wrapper.get('[data-testid="invoice-preview-logo"]').attributes('src')).toBe(branding.invoiceLogo.dataUrl)
  })
})
```

- [ ] **Step 2: Run the preview test and verify red state**

```bash
pnpm exec vitest run tests/components/settings/BrandingPreview.spec.ts
```

Expected: FAIL because `BrandingPreview.vue` does not exist.

- [ ] **Step 3: Implement the preview shell**

Create `app/components/settings/BrandingPreview.vue`. Import `Tabs`, `TabsContent`, `TabsList`, and `TabsTrigger` from `@/components/ui/tabs`, compute `guideStyle` with `buildGuestGuideCssVariables`, and compute `invoiceLogo` with `resolveInvoiceLogo`.

The template must include these stable regions:

```vue
<script setup lang="ts">
import type { TenantBranding } from '~/components/settings/data/branding'
import { computed } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getBrandingFaviconHref, resolveInvoiceLogo } from '~/components/settings/data/branding'
import { buildGuestGuideCssVariables } from '~/lib/branding-colors'

const props = defineProps<{ branding: TenantBranding }>()
const guideStyle = computed(() => buildGuestGuideCssVariables(props.branding.guestGuideColors))
const invoiceLogo = computed(() => resolveInvoiceLogo(props.branding))
const faviconHref = computed(() => getBrandingFaviconHref(props.branding))
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <div class="mb-4">
      <h3 class="font-medium">Live preview</h3>
      <p class="text-sm text-muted-foreground">Preview unsaved branding changes.</p>
    </div>

    <Tabs default-value="dashboard">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="guide">Guest Guide</TabsTrigger>
        <TabsTrigger value="invoice">Invoice</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" class="mt-4">
        <div class="overflow-hidden rounded-lg border bg-background">
          <div class="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
            <img v-if="branding.favicon" :src="faviconHref" alt="Favicon preview" class="size-4 object-contain">
            <Icon v-else name="lucide:layout-dashboard" class="size-4" />
            <span>Elev8 Dashboard</span>
          </div>
          <div class="flex min-h-48">
            <aside class="w-40 border-r bg-sidebar p-3 text-sidebar-foreground">
              <div class="flex items-center gap-2">
                <div class="flex size-8 items-center justify-center rounded-lg border bg-background p-1">
                  <img v-if="branding.primaryLogo" :src="branding.primaryLogo.dataUrl" alt="Primary logo preview" class="max-h-full max-w-full object-contain">
                  <Icon v-else name="lucide:gallery-vertical-end" class="size-4" />
                </div>
                <div><p class="text-xs font-semibold">Acme Inc</p><p class="text-[10px] text-muted-foreground">Enterprise</p></div>
              </div>
            </aside>
            <div class="flex-1 p-4"><div class="h-5 w-24 rounded bg-muted" /><div class="mt-4 grid grid-cols-2 gap-2"><div class="h-16 rounded border" /><div class="h-16 rounded border" /></div></div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="guide" class="mt-4">
        <div data-testid="guest-guide-preview" class="overflow-hidden rounded-lg border bg-background text-foreground" :style="guideStyle">
          <div v-if="branding.primaryLogo" class="border-b bg-card p-3"><img :src="branding.primaryLogo.dataUrl" alt="Guest Guide logo preview" class="h-8 max-w-40 object-contain"></div>
          <div class="bg-primary p-5 text-primary-foreground"><p class="text-xs uppercase tracking-wide">Guest guide</p><p class="mt-1 font-semibold">Welcome to Villa Serenity</p></div>
          <div class="space-y-3 bg-background p-4"><div class="rounded-lg border bg-card p-3"><p class="text-sm font-medium">Good to know</p><p class="mt-1 text-xs text-muted-foreground">Check-in is available from 3:00 PM.</p></div><button class="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">View check-in steps</button></div>
        </div>
      </TabsContent>

      <TabsContent value="invoice" class="mt-4">
        <div class="rounded-lg border bg-background p-5 text-foreground">
          <div class="flex items-start justify-between border-b pb-4">
            <img v-if="invoiceLogo" data-testid="invoice-preview-logo" :src="invoiceLogo.dataUrl" alt="Invoice logo preview" class="h-10 max-w-40 object-contain">
            <div v-else class="text-lg font-bold">Elev8</div>
            <div class="text-right"><p class="text-sm font-semibold">INVOICE</p><p class="text-xs text-muted-foreground">INV-2026-0184</p></div>
          </div>
          <div class="grid grid-cols-2 gap-4 py-4 text-xs"><div><p class="text-muted-foreground">Bill to</p><p class="font-medium">Anna Schmidt</p></div><div class="text-right"><p class="text-muted-foreground">Property</p><p class="font-medium">Villa Serenity</p></div></div>
          <div class="border-y py-3 text-xs"><div class="flex justify-between"><span>Accommodation · 3 nights</span><span>CHF 1,250.00</span></div></div>
          <div class="mt-3 flex justify-end gap-8 text-sm font-semibold"><span>Total</span><span>CHF 1,250.00</span></div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
```

Keep sample preview copy static; it is illustrative, not invoice data.

- [ ] **Step 4: Run the preview tests and verify green state**

Run the Step 2 command again.

Expected: all preview tests PASS.

- [ ] **Step 5: Commit the preview**

```bash
git add app/components/settings/BrandingPreview.vue tests/components/settings/BrandingPreview.spec.ts
git commit -m "feat(branding): add live branding previews" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Build the Branding form, route, and navigation

**Files:**
- Create: `app/components/settings/BrandingForm.vue`
- Create: `app/pages/settings/branding.vue`
- Modify: `app/components/settings/SidebarNav.vue:10-35`
- Modify: `app/constants/menus.ts:246-282`
- Test: `tests/components/settings/BrandingForm.spec.ts`

- [ ] **Step 1: Write failing form behavior tests**

Create `tests/components/settings/BrandingForm.spec.ts` with shadcn stubs and the real composable:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BrandingForm from '~/components/settings/BrandingForm.vue'
import { useTenantBranding } from '~/composables/useTenantBranding'

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('vue-sonner', () => ({ toast: toastMock }))

const ButtonStub = { props: ['disabled', 'type'], template: '<button :type="type" :disabled="disabled"><slot /></button>' }
const InputStub = {
  props: ['modelValue', 'type'],
  emits: ['update:modelValue'],
  template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
}

const globalOptions = {
  stubs: {
    Button: ButtonStub,
    Input: InputStub,
    Label: { template: '<label><slot /></label>' },
    Separator: { template: '<hr>' },
    Icon: true,
    BrandingAssetField: {
      props: ['kind'],
      emits: ['validationChange'],
      template: '<button type="button" data-testid="asset-validation" :data-kind="kind" @click="$emit(\'validationChange\', true)" />',
    },
    BrandingPreview: { template: '<div />' },
  },
}

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/dashboard/' } }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
  toastMock.success.mockClear()
  toastMock.error.mockClear()
  toastMock.info.mockClear()
})

describe('BrandingForm', () => {
  it('saves normalized color changes and updates shared branding', async () => {
    const wrapper = mount(BrandingForm, { global: globalOptions })
    const primary = wrapper.get('[data-testid="primary-hex-input"]')
    await primary.setValue('#123abc')
    await wrapper.get('[data-testid="save-branding"]').trigger('click')
    await flushPromises()

    expect(useTenantBranding().branding.value.guestGuideColors.primary).toBe('#123ABC')
    expect(toastMock.success).toHaveBeenCalledWith('Branding saved')
  })

  it('shows a blocking error for invalid hex', async () => {
    const wrapper = mount(BrandingForm, { global: globalOptions })
    await wrapper.get('[data-testid="text-hex-input"]').setValue('black')
    expect(wrapper.text()).toContain('Use a six-digit hex value such as #18181B.')
    expect(wrapper.get('[data-testid="save-branding"]').attributes('disabled')).toBeDefined()
  })

  it('blocks saving while an asset field has a validation error', async () => {
    const wrapper = mount(BrandingForm, { global: globalOptions })
    await wrapper.get('[data-testid="primary-hex-input"]').setValue('#123456')
    await wrapper.get('[data-kind="primaryLogo"]').trigger('click')

    expect(wrapper.get('[data-testid="save-branding"]').attributes('disabled')).toBeDefined()
  })

  it('warns but still allows a low-contrast combination', async () => {
    const wrapper = mount(BrandingForm, { global: globalOptions })
    await wrapper.get('[data-testid="background-hex-input"]').setValue('#FFFFFF')
    await wrapper.get('[data-testid="text-hex-input"]').setValue('#EEEEEE')
    expect(wrapper.text()).toContain('Text and background contrast is below WCAG AA')
    expect(wrapper.get('[data-testid="save-branding"]').attributes('disabled')).toBeUndefined()
  })

  it('resets only the draft until Save changes is clicked', async () => {
    const { branding } = useTenantBranding()
    branding.value = { ...branding.value, guestGuideColors: { ...branding.value.guestGuideColors, primary: '#123456' } }
    const wrapper = mount(BrandingForm, { global: globalOptions })

    await wrapper.get('[data-testid="reset-branding"]').trigger('click')

    expect((wrapper.get('[data-testid="primary-hex-input"]').element as HTMLInputElement).value).toBe('#F6BB12')
    expect(branding.value.guestGuideColors.primary).toBe('#123456')
  })
})
```

- [ ] **Step 2: Run the form test and verify red state**

```bash
pnpm exec vitest run tests/components/settings/BrandingForm.spec.ts
```

Expected: FAIL because `BrandingForm.vue` does not exist.

- [ ] **Step 3: Implement form state and actions**

Create `app/components/settings/BrandingForm.vue`.

The script must:

```ts
import type { BrandingAssetKind, GuestGuideBrandColors, TenantBranding } from '~/components/settings/data/branding'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import BrandingAssetField from './BrandingAssetField.vue'
import BrandingPreview from './BrandingPreview.vue'
import {
  cloneTenantBranding,
  createDefaultTenantBranding,
  isHexColor,
  normalizeHex,
} from '~/components/settings/data/branding'
import { useTenantBranding } from '~/composables/useTenantBranding'
import { contrastRatio } from '~/lib/branding-colors'

const { branding, isHydrated, saveBranding, syncGuestGuideBranding } = useTenantBranding()
const draft = ref<TenantBranding>(cloneTenantBranding(branding.value))
const isSaving = ref(false)
const assetFieldKey = ref(0)
const assetErrors = ref<Record<BrandingAssetKind, boolean>>({
  primaryLogo: false,
  favicon: false,
  invoiceLogo: false,
})
const hasAppliedHydratedState = ref(false)

watch(isHydrated, (hydrated) => {
  if (!hydrated || hasAppliedHydratedState.value) return
  draft.value = cloneTenantBranding(branding.value)
  hasAppliedHydratedState.value = true
}, { immediate: true })

const colorFields: Array<{ key: keyof GuestGuideBrandColors, label: string, description: string, testId: string }> = [
  { key: 'primary', label: 'Primary color', description: 'Buttons, active states, icons, and accents.', testId: 'primary' },
  { key: 'background', label: 'Background color', description: 'Guest Guide page and card surfaces.', testId: 'background' },
  { key: 'text', label: 'Text color', description: 'Guest Guide headings and body text.', testId: 'text' },
]

function comparable(value: TenantBranding) {
  return { ...cloneTenantBranding(value), updatedAt: '' }
}

const isDirty = computed(() => JSON.stringify(comparable(draft.value)) !== JSON.stringify(comparable(branding.value)))
const colorErrors = computed(() => Object.fromEntries(colorFields.map(field => [
  field.key,
  isHexColor(draft.value.guestGuideColors[field.key]) ? '' : 'Use a six-digit hex value such as #18181B.',
]))) as Record<keyof GuestGuideBrandColors, string>)
const hasBlockingError = computed(() =>
  Object.values(colorErrors.value).some(Boolean)
  || Object.values(assetErrors.value).some(Boolean),
)
const hasContrastWarning = computed(() => {
  const { background, text } = draft.value.guestGuideColors
  return isHexColor(background) && isHexColor(text) && contrastRatio(background, text) < 4.5
})
const canSave = computed(() => isDirty.value && !hasBlockingError.value && !isSaving.value)

function setColor(key: keyof GuestGuideBrandColors, value: string) {
  draft.value = {
    ...draft.value,
    guestGuideColors: { ...draft.value.guestGuideColors, [key]: value },
  }
}

function setAssetError(kind: BrandingAssetKind, hasError: boolean) {
  assetErrors.value = { ...assetErrors.value, [kind]: hasError }
}

function resetDraft() {
  draft.value = createDefaultTenantBranding()
  assetErrors.value = { primaryLogo: false, favicon: false, invoiceLogo: false }
  assetFieldKey.value++
}

async function retrySync() {
  if (await syncGuestGuideBranding()) toast.success('Guest Guide branding synchronized')
  else toast.error('Guest Guide branding is still unavailable')
}

async function handleSave() {
  if (!canSave.value) return
  isSaving.value = true
  try {
    const normalized: TenantBranding = {
      ...cloneTenantBranding(draft.value),
      guestGuideColors: {
        primary: normalizeHex(draft.value.guestGuideColors.primary),
        background: normalizeHex(draft.value.guestGuideColors.background),
        text: normalizeHex(draft.value.guestGuideColors.text),
      },
    }
    const result = await saveBranding(normalized)

    if (!result.saved) {
      toast.error(result.error ?? 'Branding could not be saved')
      return
    }

    draft.value = cloneTenantBranding(branding.value)
    if (result.synced) {
      toast.success('Branding saved')
      return
    }

    toast.info('Branding saved locally, but the Guest Guide could not be updated.', {
      action: { label: 'Retry', onClick: retrySync },
    })
  }
  catch {
    toast.error('Branding could not be saved')
  }
  finally {
    isSaving.value = false
  }
}
```

- [ ] **Step 4: Implement the responsive form template**

The template must use a two-column `xl:` layout, three `BrandingAssetField` instances, three paired color inputs, a non-blocking contrast warning, sticky preview, and explicit action buttons:

```vue
<template>
  <div>
    <h3 class="text-lg font-medium">Branding</h3>
    <p class="text-sm text-muted-foreground">Customize how your brand appears in the dashboard, Guest Guide, and invoices.</p>
  </div>
  <Separator />

  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
    <div class="space-y-6">
      <section class="space-y-4">
        <div><h4 class="font-medium">Brand assets</h4><p class="text-sm text-muted-foreground">Upload images for each branded surface.</p></div>
        <BrandingAssetField :key="`primary-${assetFieldKey}`" v-model="draft.primaryLogo" kind="primaryLogo" label="Primary logo" description="PNG, JPEG, or WebP up to 1 MB. Recommended: 400 × 120 px." @validation-change="setAssetError('primaryLogo', $event)" />
        <BrandingAssetField :key="`favicon-${assetFieldKey}`" v-model="draft.favicon" kind="favicon" label="Favicon" description="PNG or ICO up to 512 KB. Recommended: 32 × 32 px or 64 × 64 px." @validation-change="setAssetError('favicon', $event)" />
        <BrandingAssetField :key="`invoice-${assetFieldKey}`" v-model="draft.invoiceLogo" kind="invoiceLogo" label="Invoice logo" description="PNG, JPEG, or WebP up to 1 MB. Recommended: 400 × 120 px." :fallback-label="draft.primaryLogo ? 'Using primary logo' : 'Using Elev8 default'" @validation-change="setAssetError('invoiceLogo', $event)" />
      </section>

      <section class="space-y-4 rounded-lg border bg-card p-5">
        <div><h4 class="font-medium">Guest Guide colors</h4><p class="text-sm text-muted-foreground">These colors do not affect the dashboard or invoices.</p></div>
        <div v-for="field in colorFields" :key="field.key" class="space-y-2">
          <Label :for="`${field.key}-hex`">{{ field.label }}</Label>
          <p class="text-xs text-muted-foreground">{{ field.description }}</p>
          <div class="flex gap-2">
            <input
              :aria-label="`${field.label} picker`"
              type="color"
              :value="isHexColor(draft.guestGuideColors[field.key]) ? draft.guestGuideColors[field.key] : '#000000'"
              class="size-10 shrink-0 cursor-pointer rounded-md border bg-background p-1"
              @input="setColor(field.key, ($event.target as HTMLInputElement).value.toUpperCase())"
            >
            <Input
              :id="`${field.key}-hex`"
              :data-testid="`${field.testId}-hex-input`"
              :model-value="draft.guestGuideColors[field.key]"
              maxlength="7"
              class="font-mono uppercase"
              @update:model-value="setColor(field.key, String($event))"
            />
          </div>
          <p v-if="colorErrors[field.key]" role="alert" class="text-sm text-destructive">{{ colorErrors[field.key] }}</p>
        </div>
        <div v-if="hasContrastWarning" role="status" class="flex gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          <Icon name="lucide:triangle-alert" class="mt-0.5 size-4 shrink-0" />
          <span>Text and background contrast is below WCAG AA (4.5:1). You can still save, but some guests may find the guide difficult to read.</span>
        </div>
      </section>

      <div class="flex flex-wrap gap-2">
        <Button data-testid="save-branding" type="button" :disabled="!canSave" @click="handleSave">
          <Icon v-if="isSaving" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
          Save changes
        </Button>
        <Button data-testid="reset-branding" type="button" variant="outline" @click="resetDraft">Reset to Elev8 defaults</Button>
      </div>
    </div>

    <div class="min-w-0 xl:sticky xl:top-20 xl:self-start">
      <BrandingPreview :branding="draft" />
    </div>
  </div>
</template>
```

- [ ] **Step 5: Add the route and both navigation entries**

Create `app/pages/settings/branding.vue`:

```vue
<template>
  <SettingsLayout wide>
    <SettingsBrandingForm />
  </SettingsLayout>
</template>
```

Add to `app/components/settings/SidebarNav.vue` immediately after Appearance:

```ts
{
  title: 'Branding',
  href: '/settings/branding',
},
```

Add to the Settings children in `app/constants/menus.ts` immediately after Appearance:

```ts
{
  title: 'Branding',
  icon: 'i-lucide-circle',
  link: '/settings/branding',
},
```

- [ ] **Step 6: Run the form test, typecheck, and lint the changed files**

```bash
pnpm exec vitest run tests/components/settings/BrandingForm.spec.ts
pnpm typecheck
pnpm exec eslint \
  app/components/settings/BrandingForm.vue \
  app/pages/settings/branding.vue \
  app/components/settings/SidebarNav.vue \
  app/constants/menus.ts
```

Expected: form tests PASS; typecheck and ESLint exit 0.

- [ ] **Step 7: Commit the Settings page**

```bash
git add \
  app/components/settings/BrandingForm.vue \
  app/pages/settings/branding.vue \
  app/components/settings/SidebarNav.vue \
  app/constants/menus.ts \
  tests/components/settings/BrandingForm.spec.ts
git commit -m "feat(branding): add branding settings page" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Apply saved branding to dashboard chrome

**Files:**
- Modify: `app/components/layout/SidebarNavHeader.vue:1-70`
- Modify: `app/app.vue:5-30`
- Test: `tests/components/layout/SidebarNavHeader.spec.ts`

- [ ] **Step 1: Write failing sidebar-logo tests**

Create `tests/components/layout/SidebarNavHeader.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarNavHeader from '~/components/layout/SidebarNavHeader.vue'
import { useTenantBranding } from '~/composables/useTenantBranding'

vi.mock('~/components/ui/sidebar', () => ({
  useSidebar: () => ({ isMobile: false }),
}))

const teams = [{ name: 'Acme Inc', logo: 'i-lucide-gallery-vertical-end', plan: 'Enterprise' }]
const stubs = {
  SidebarMenu: { template: '<div><slot /></div>' },
  SidebarMenuItem: { template: '<div><slot /></div>' },
  SidebarMenuButton: { template: '<button><slot /></button>' },
  DropdownMenu: { template: '<div><slot /></div>' },
  DropdownMenuTrigger: { template: '<div><slot /></div>' },
  DropdownMenuContent: { template: '<div><slot /></div>' },
  DropdownMenuLabel: { template: '<div><slot /></div>' },
  DropdownMenuItem: { template: '<div><slot /></div>' },
  DropdownMenuShortcut: { template: '<span><slot /></span>' },
  DropdownMenuSeparator: true,
  Icon: { props: ['name'], template: '<span data-testid="fallback-team-icon" :data-name="name" />' },
}

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/dashboard/' } }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
})

describe('SidebarNavHeader branding', () => {
  it('keeps the existing team icon without a primary logo', () => {
    const wrapper = mount(SidebarNavHeader, { props: { teams }, global: { stubs } })
    expect(wrapper.find('[data-testid="sidebar-brand-logo"]').exists()).toBe(false)
    expect(wrapper.find('[data-name="i-lucide-gallery-vertical-end"]').exists()).toBe(true)
  })

  it('renders the saved primary logo in the workspace avatar', () => {
    const { branding } = useTenantBranding()
    branding.value = {
      ...branding.value,
      primaryLogo: { name: 'logo.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' },
    }
    const wrapper = mount(SidebarNavHeader, { props: { teams }, global: { stubs } })
    expect(wrapper.get('[data-testid="sidebar-brand-logo"]').attributes('src')).toBe(branding.value.primaryLogo!.dataUrl)
  })
})
```

- [ ] **Step 2: Run the sidebar test and verify red state**

```bash
pnpm exec vitest run tests/components/layout/SidebarNavHeader.spec.ts
```

Expected: the custom-logo assertion FAILS because the header always renders an icon.

- [ ] **Step 3: Render the primary logo with current fallback behavior**

Modify `app/components/layout/SidebarNavHeader.vue`.

Add:

```ts
import { cn } from '@/lib/utils'
import { useTenantBranding } from '~/composables/useTenantBranding'

const { branding } = useTenantBranding()
```

Replace the current avatar block with:

```vue
<div
  :class="cn(
    'aspect-square size-8 flex items-center justify-center rounded-lg',
    branding.primaryLogo
      ? 'border bg-background p-1'
      : 'bg-sidebar-primary text-sidebar-primary-foreground',
  )"
>
  <img
    v-if="branding.primaryLogo"
    data-testid="sidebar-brand-logo"
    :src="branding.primaryLogo.dataUrl"
    alt="Tenant primary logo"
    class="max-h-full max-w-full object-contain"
  >
  <Icon v-else :name="activeTeam!.logo" class="size-4" />
</div>
```

Do not change team switching, workspace name, plan, dropdown items, or Add team behavior.

- [ ] **Step 4: Make the dashboard favicon reactive**

Modify `app/app.vue`:

```ts
const { branding } = useTenantBranding()
```

Change `useHead({...})` to reactive factory form and replace only the favicon source:

```ts
useHead(() => ({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color.value },
  ],
  link: [
    { rel: 'icon', href: getBrandingFaviconHref(branding.value) },
  ],
  htmlAttrs: { lang: 'en' },
  bodyAttrs: {
    class: `color-${theme.value?.color || 'default'} theme-${theme.value?.type || 'default'}`,
  },
  script: [
    {
      innerHTML: `if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++)rs[i].unregister()}); if ('caches' in window) { caches.keys().then(function(keys){for(var i=0;i<keys.length;i++)caches.delete(keys[i])}); } }`,
      tagPosition: 'head',
    },
  ],
}))
```

Import `getBrandingFaviconHref` explicitly from `~/components/settings/data/branding`. Keep SEO social images unchanged.

Calling `useTenantBranding` in `app.vue` guarantees LocalStorage hydration and mock-server resynchronization during dashboard startup.

- [ ] **Step 5: Run sidebar tests, typecheck, and app build**

```bash
pnpm exec vitest run tests/components/layout/SidebarNavHeader.spec.ts
pnpm typecheck
pnpm build
```

Expected: tests PASS; typecheck and build exit 0.

- [ ] **Step 6: Commit dashboard integration**

```bash
git add \
  app/components/layout/SidebarNavHeader.vue \
  app/app.vue \
  tests/components/layout/SidebarNavHeader.spec.ts
git commit -m "feat(branding): apply logo and favicon to dashboard" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Update project documentation and complete verification

**Files:**
- Modify: `CLAUDE.md`
- Verify: all branding files and both Nuxt applications

- [ ] **Step 1: Document the Branding Settings module**

Add a concise module section to `CLAUDE.md` near the other module references:

```markdown
### Branding Settings Module (`app/components/settings/` + `app/composables/useTenantBranding.ts`)

Tenant-level mock branding at `/settings/branding`:
- Primary logo → dashboard sidebar + public Guest Guide; invoice fallback
- Favicon → dashboard + public Guest Guide browser tabs
- Invoice logo → invoice preview/future invoice renderers only
- Guest Guide colors → primary, background, and text; never change dashboard colors
- `useTenantBranding` persists `TenantBranding` to `elev8-tenant-branding-v1` in LocalStorage and syncs to `PUT /api/tenant-branding`
- Public `GET /api/guest-guides/by-token/:token` includes top-level `branding`; guide-app applies scoped CSS variables
- Invoice renderer/PDF generation and real file storage remain out of scope
```

Add this row to the Composables Reference table:

```markdown
| `useTenantBranding` | `app/composables/useTenantBranding.ts` | Tenant logo/favicon/Guest Guide color state | `branding`, `resolvedInvoiceLogo`, `faviconHref`, `saveBranding()`, `syncGuestGuideBranding()`. Persisted to LocalStorage. |
```

Add the new Branding components, composable, settings page, and Guide app header to the File Structure section. Do not create `codebase-index.json` or `component-metadata/`: the repository contains no scanner or generated artifacts despite the stale regeneration note.

- [ ] **Step 2: Run the complete automated test suite**

```bash
pnpm exec vitest run
```

Expected: all tests PASS with zero unhandled errors.

- [ ] **Step 3: Run root quality gates**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0. If lint reports unrelated pre-existing failures, record their exact paths and rerun ESLint against every branding file to prove the feature files pass.

- [ ] **Step 4: Run Guest Guide quality gates**

```bash
pnpm --dir guide-app typecheck
pnpm --dir guide-app build
```

Expected: both commands exit 0.

- [ ] **Step 5: Exercise the feature end to end**

Use the repository's `verify` skill to launch both apps and drive the actual flow:

1. Open `/settings/branding`.
2. Confirm the page is reachable through both Settings navigation surfaces.
3. Upload a supported primary logo and favicon.
4. Set primary/background/text colors and confirm draft previews update before save.
5. Save and confirm sidebar logo and dashboard favicon change.
6. Refresh the dashboard and confirm LocalStorage persistence.
7. Open `http://localhost:3001/abc123def456?preview=1` and confirm Guest Guide logo, favicon, primary/background/text colors.
8. Confirm dashboard colors remain unchanged.
9. Upload an invoice logo and confirm the invoice preview prefers it.
10. Remove invoice logo and confirm primary-logo fallback.
11. Use a low-contrast text/background pair and confirm warning-only behavior.
12. Reset, save, and confirm Elev8 defaults.

Capture any runtime console error, failed request, or visual regression; fix it and rerun the affected automated and manual checks.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Then invoke the `requesting-code-review` skill. Apply confirmed findings, rerun the relevant tests, and verify the working tree contains only intended branding and documentation changes.

- [ ] **Step 7: Commit documentation and verification fixes**

```bash
git add CLAUDE.md
git commit -m "docs(branding): document branding settings" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

If code-review fixes changed production or test files after Task 9, stage each reviewed path explicitly and commit those fixes before this documentation commit; never use a broad `git add app guide-app server tests`.

---

## Requirement-to-Task Traceability

- Settings route and both navigation entries → Task 8
- Primary, favicon, and invoice asset fields → Tasks 1 and 6
- Draft-only live previews → Tasks 7 and 8
- Guest Guide primary/background/text colors → Tasks 1, 5, 7, and 8
- WCAG contrast warning and automatic primary foreground → Tasks 1 and 8
- LocalStorage persistence and failure handling → Task 3
- Guest Guide API relay and retry → Tasks 2–5 and 8
- Dashboard sidebar logo and favicon → Task 9
- Guest Guide logo, favicon, and CSS variables → Tasks 4–5
- Invoice logo → primary logo → Elev8 fallback → Tasks 1 and 7
- No PDF renderer, database, cloud storage, dashboard colors, or Website Builder coupling → enforced throughout and verified in Task 10
- Accessibility labels and keyboard-capable controls → Tasks 6–8
- Unit, component, API, typecheck, build, and end-to-end verification → all tasks, finalized in Task 10
