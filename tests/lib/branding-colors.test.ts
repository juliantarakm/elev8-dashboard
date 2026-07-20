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
