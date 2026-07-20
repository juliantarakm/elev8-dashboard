export type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paused' | 'disabled'
export type TemplateCategory = 'utility' | 'marketing' | 'authentication'
export type HeaderType = 'none' | 'text' | 'image' | 'video' | 'document'
export type ButtonKind = 'quick_reply' | 'cta_url' | 'cta_phone'

export interface TemplateButton {
  id: string
  kind: ButtonKind
  text: string
  url?: string
  phoneNumber?: string
}

export type QualityRating = 'HIGH' | 'MEDIUM' | 'LOW'

export interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  language: string
  status: TemplateStatus
  statusReason?: string
  qualityRating?: QualityRating
  header: {
    type: HeaderType
    text?: string
    mediaUrl?: string
    mediaFilename?: string
  }
  body: string
  footer?: string
  buttons: TemplateButton[]
  createdAt: string
  submittedAt?: string
  approvedAt?: string
  lastModified: string
}

export const templateLanguages = [
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'id', label: 'Indonesian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
]

export const insertableVariables = [
  { key: 'guest_name', label: 'Guest First Name' },
  { key: 'guest_full_name', label: 'Guest Full Name' },
  { key: 'property_name', label: 'Property Name' },
  { key: 'city', label: 'City' },
  { key: 'check_in_date', label: 'Check-in Date' },
  { key: 'check_out_date', label: 'Check-out Date' },
  { key: 'nights', label: 'Number of Nights' },
  { key: 'guests', label: 'Number of Guests' },
  { key: 'door_code', label: 'Door Code' },
  { key: 'wifi_name', label: 'WiFi Name' },
  { key: 'wifi_password', label: 'WiFi Password' },
  { key: 'guide_link', label: 'Guest Guide Link' },
  { key: 'host_name', label: 'Host Name' },
  { key: 'host_phone', label: 'Host Phone' },
]

export const statusMeta: Record<TemplateStatus, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline', description: string }> = {
  draft: { label: 'Draft', variant: 'secondary', description: 'Saved in Elev8, not yet submitted to Meta.' },
  pending: { label: 'Pending', variant: 'outline', description: 'Submitted, awaiting Meta review.' },
  approved: { label: 'Approved', variant: 'default', description: 'Passed review and live.' },
  rejected: { label: 'Rejected', variant: 'destructive', description: 'Failed review. Edit and resubmit.' },
  paused: { label: 'Paused', variant: 'outline', description: 'Quality rating dropped; delivery throttled.' },
  disabled: { label: 'Disabled', variant: 'destructive', description: 'Meta has disabled this template.' },
}

export const categoryMeta: Record<TemplateCategory, { label: string, description: string }> = {
  utility: { label: 'Utility', description: 'Check-in instructions, confirmations, reminders. Avoid promotions.' },
  marketing: { label: 'Marketing', description: 'Promotions, upsells, and guest-re-engagement messages.' },
  authentication: { label: 'Authentication', description: 'One-time passwords or verification codes.' },
}

export const headerTypeMeta: Record<HeaderType, { label: string, hint: string }> = {
  none: { label: 'None', hint: 'No header.' },
  text: { label: 'Text', hint: 'Max 60 characters.' },
  image: { label: 'Image', hint: 'JPEG/PNG, max 5 MB.' },
  video: { label: 'Video', hint: 'MP4 H.264 + AAC, max 16 MB.' },
  document: { label: 'Document', hint: 'PDF, max 100 MB.' },
}

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) ?? []
  return matches.map(m => m.slice(2, -2))
}

export interface VariableMapping {
  normalizedBody: string
  mapping: Record<string, string>
}

export function mapVariablesToPositional(body: string): VariableMapping {
  // Map friendly keys (e.g. {{guest_name}}) to sequential positional parameters
  // ({{1}}, {{2}}, ...) in order of first appearance. Returns the normalized body
  // and a mapping from positional index to original key.
  const seen: string[] = []
  extractVariables(body).forEach((v) => {
    if (!seen.includes(v))
      seen.push(v)
  })
  let normalizedBody = body
  const mapping: Record<string, string> = {}
  seen.forEach((key, index) => {
    const positional = String(index + 1)
    mapping[positional] = key
    const regex = new RegExp(`\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g')
    normalizedBody = normalizedBody.replace(regex, `{{${positional}}}`)
  })
  return { normalizedBody, mapping }
}

export function normalizeVariables(body: string): string {
  return mapVariablesToPositional(body).normalizedBody
}

export interface ValidationError {
  field: string
  message: string
}

export function validateTemplate(template: WhatsAppTemplate): { valid: boolean, errors: ValidationError[] } {
  const errors: ValidationError[] = []

  if (!template.name.trim())
    errors.push({ field: 'name', message: 'Template name is required.' })

  // Meta rule: template name can only contain lowercase alphanumeric characters and underscores
  const nameRegex = /^[a-z0-9_]+$/
  if (template.name.trim() && !nameRegex.test(template.name))
    errors.push({ field: 'name', message: 'Template name can only contain lowercase letters, numbers, and underscores.' })

  if (!template.body.trim())
    errors.push({ field: 'body', message: 'Body is required.' })

  if (template.header.type === 'text' && (template.header.text?.length ?? 0) > 60)
    errors.push({ field: 'header.text', message: 'Header text must be 60 characters or less.' })

  if (template.footer && template.footer.length > 60)
    errors.push({ field: 'footer', message: 'Footer must be 60 characters or less.' })

  const body = template.body
  const rawVars = extractVariables(body)

  // Friendly keys map internally to sequential positional parameters.
  const { normalizedBody } = mapVariablesToPositional(body)
  const positionalVars = extractVariables(normalizedBody).map(v => Number(v)).filter(n => !Number.isNaN(n))
  const uniqueVars = [...new Set(positionalVars)].sort((a, b) => a - b)

  // Variable keys must be lowercase letters, numbers, and underscores only (no special chars)
  const validKeyRegex = /^[a-z0-9_]+$/
  for (const key of rawVars) {
    if (!validKeyRegex.test(key))
      errors.push({ field: 'body', message: `Variable key "{{${key}}}" can only contain lowercase letters, numbers, and underscores.` })
  }

  // Sequential numbering starting at 1
  if (uniqueVars.length > 0) {
    if (uniqueVars[0] !== 1)
      errors.push({ field: 'body', message: 'Variables must start at {{1}}.' })
    if (uniqueVars[uniqueVars.length - 1] !== uniqueVars.length)
      errors.push({ field: 'body', message: 'Variables must be numbered sequentially ({{1}}, {{2}}, …).' })
  }

  // No variable at start or end
  if (/^\{\{[^}]+\}\}/.test(normalizedBody.trim()))
    errors.push({ field: 'body', message: 'Body cannot start with a variable.' })
  if (/\{\{[^}]+\}\}$/.test(normalizedBody.trim()))
    errors.push({ field: 'body', message: 'Body cannot end with a variable.' })

  // No adjacent variables
  if (/\}\}\s*\{\{/.test(normalizedBody))
    errors.push({ field: 'body', message: 'Variables cannot be adjacent without text between them.' })

  // Too many variables relative to message length (Meta common rejection reason)
  const textOnlyLength = normalizedBody.replace(/\{\{[^}]+\}\}/g, '').trim().length
  if (uniqueVars.length > 0 && uniqueVars.length * 4 > textOnlyLength)
    errors.push({ field: 'body', message: 'Too many variables relative to message length. Add more text between variables.' })

  // Link shorteners / wa.me
  if (/https?:\/\/(?:wa\.me|bit\.ly|tinyurl|t\.ly|short\.link|rb\.gy)\b/i.test(body))
    errors.push({ field: 'body', message: 'Do not use wa.me or link-shortener URLs.' })

  // Button validation
  const quickReplies = template.buttons.filter(b => b.kind === 'quick_reply')
  const ctaButtons = template.buttons.filter(b => b.kind === 'cta_url' || b.kind === 'cta_phone')

  if (quickReplies.length > 3)
    errors.push({ field: 'buttons', message: 'Up to 3 Quick Reply buttons allowed.' })
  if (ctaButtons.length > 2)
    errors.push({ field: 'buttons', message: 'Up to 2 Call-to-Action buttons allowed.' })
  if (quickReplies.length > 0 && ctaButtons.length > 0)
    errors.push({ field: 'buttons', message: 'Choose either Quick Reply or Call-to-Action buttons, not both.' })

  for (const btn of template.buttons) {
    if (!btn.text.trim())
      errors.push({ field: 'buttons', message: 'Button text is required.' })
    if (btn.text.length > 20)
      errors.push({ field: 'buttons', message: 'Button text must be 20 characters or less.' })
    if (btn.kind === 'cta_url') {
      if (!btn.url?.trim())
        errors.push({ field: 'buttons', message: 'CTA URL is required.' })
      else if (!/^https:\/\/.+/i.test(btn.url))
        errors.push({ field: 'buttons', message: 'CTA URL must be a valid HTTPS link.' })
    }
    if (btn.kind === 'cta_phone' && !btn.phoneNumber?.trim())
      errors.push({ field: 'buttons', message: 'CTA phone number is required.' })
  }

  return { valid: errors.length === 0, errors }
}

export function generateTemplateId(): string {
  return `wt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function generateButtonId(): string {
  return `btn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyTemplate(): WhatsAppTemplate {
  const now = new Date().toISOString()
  return {
    id: generateTemplateId(),
    name: '',
    category: 'utility',
    language: 'en',
    status: 'draft',
    header: { type: 'none' },
    body: '',
    footer: '',
    buttons: [],
    createdAt: now,
    lastModified: now,
  }
}

export const mockTemplates: WhatsAppTemplate[] = [
  {
    id: 'wt-checkin-reminder',
    name: 'check_in_reminder',
    category: 'utility',
    language: 'en',
    status: 'approved',
    qualityRating: 'HIGH',
    header: { type: 'image', mediaUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', mediaFilename: 'villa-hero.jpg' },
    body: 'Hi {{1}}, your check-in at {{2}} is on {{3}}. Your door code is {{4}} and the WiFi password is {{5}}. Tap below for your full guide.',
    footer: 'See you soon!',
    buttons: [
      { id: 'btn-1', kind: 'cta_url', text: 'View Guide', url: 'https://guestguide.example.com/checkin' },
    ],
    createdAt: '2026-07-10T08:00:00.000Z',
    approvedAt: '2026-07-10T10:30:00.000Z',
    lastModified: '2026-07-10T10:30:00.000Z',
  },
  {
    id: 'wt-welcome-message',
    name: 'welcome_message',
    category: 'utility',
    language: 'en',
    status: 'approved',
    qualityRating: 'MEDIUM',
    header: { type: 'none' },
    body: 'Welcome to {{1}}, {{2}}! We hope you enjoy your stay. If you need anything, reply here.',
    footer: 'Elev8 Bali',
    buttons: [
      { id: 'btn-2', kind: 'quick_reply', text: 'Thank you!' },
      { id: 'btn-3', kind: 'quick_reply', text: 'Need help' },
    ],
    createdAt: '2026-07-12T09:00:00.000Z',
    approvedAt: '2026-07-12T11:00:00.000Z',
    lastModified: '2026-07-12T11:00:00.000Z',
  },
  {
    id: 'wt-late-checkout',
    name: 'late_checkout_offer',
    category: 'marketing',
    language: 'en',
    status: 'pending',
    header: { type: 'text', text: 'Extend your stay' },
    body: 'Hi {{1}}, would you like a late checkout at {{2}}? Reply below and we will check availability.',
    buttons: [
      { id: 'btn-4', kind: 'quick_reply', text: 'Yes please' },
      { id: 'btn-5', kind: 'quick_reply', text: 'No thanks' },
    ],
    createdAt: '2026-07-18T14:00:00.000Z',
    submittedAt: '2026-07-18T14:05:00.000Z',
    lastModified: '2026-07-18T14:05:00.000Z',
  },
  {
    id: 'wt-review-request',
    name: 'review_request',
    category: 'marketing',
    language: 'en',
    status: 'rejected',
    statusReason: 'Category mismatch: submitted as Utility but contains promotional language. Resubmit as Marketing or remove the incentive.',
    header: { type: 'none' },
    body: 'Hi {{1}}, thanks for staying at {{2}}. Leave us a 5-star review and get 10% off your next booking!',
    buttons: [],
    createdAt: '2026-07-15T10:00:00.000Z',
    submittedAt: '2026-07-15T10:30:00.000Z',
    lastModified: '2026-07-15T10:30:00.000Z',
  },
  {
    id: 'wt-auth-code',
    name: 'verification_code',
    category: 'authentication',
    language: 'en',
    status: 'draft',
    header: { type: 'none' },
    body: 'Your verification code for {{1}} is {{2}}. Do not share this code with anyone.',
    footer: 'Valid for 10 minutes',
    buttons: [],
    createdAt: '2026-07-19T08:00:00.000Z',
    lastModified: '2026-07-19T08:00:00.000Z',
  },
]
