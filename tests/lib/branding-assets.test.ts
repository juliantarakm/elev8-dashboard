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
