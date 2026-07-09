import { nanoid } from 'nanoid'

const PREFIX = {
  guide: 'gg',
  link: 'ggl',
  section: 'gs',
} as const

function makeId(prefix: string): string {
  return `${prefix}-${nanoid(12)}`
}

export function generateGuideId(): string {
  return makeId(PREFIX.guide)
}

export function generateLinkId(): string {
  return makeId(PREFIX.link)
}

export function generateSectionId(): string {
  return makeId(PREFIX.section)
}

export function generateToken(): string {
  return nanoid(12)
}

export function generateId(prefix: string): string {
  return `${prefix}-${nanoid(12)}` as `${string}-${string}`
}
