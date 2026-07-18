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
