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
