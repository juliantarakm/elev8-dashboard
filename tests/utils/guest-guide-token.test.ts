import { describe, expect, it } from 'vitest'
import { generateGuideId, generateLinkId, generateSectionId, generateToken } from '~/utils/guest-guide-token'

describe('guest-guide-token', () => {
  it('generates guide id with gg- prefix', () => {
    const id = generateGuideId()
    expect(id.startsWith('gg-')).toBe(true)
    expect(id.length).toBeGreaterThan(3)
  })

  it('generates link id with ggl- prefix', () => {
    const id = generateLinkId()
    expect(id.startsWith('ggl-')).toBe(true)
  })

  it('generates section id with gs- prefix', () => {
    const id = generateSectionId()
    expect(id.startsWith('gs-')).toBe(true)
  })

  it('generates unguessable 12-char tokens', () => {
    const token = generateToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{12}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(tokens.size).toBe(100)
  })
})
