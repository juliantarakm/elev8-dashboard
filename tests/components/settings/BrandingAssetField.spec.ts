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

describe('brandingAssetField', () => {
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
    // Use mockImplementationOnce instead of mockRejectedValue: vitest 4.x
    // tracks the top-level rejected promise created by mockRejectedValue
    // and (after a prior test that used mockResolvedValue) flags it as
    // unhandled even though the component's try/catch consumes it. A
    // queued one-shot implementation produces an identical rejection
    // without leaking a top-level promise.
    vi.mocked(fileToBrandingAsset).mockImplementationOnce(() => Promise.reject(new Error('Primary logo must be a PNG, JPEG, or WebP file.')))
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
