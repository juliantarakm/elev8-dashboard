export type StepType =
  | 'trigger'
  | 'wait'
  | 'message'
  | 'context_check'
  | 'action'
  | 'if_else'
  | 'hard_requirement'
  | 'create_note'
  | 'toggle_ai'
  | 'integration'
  | 'end_journey'

export type JourneyStatus = 'active' | 'inactive'

export type TriggerCategory = 'event' | 'calendar'

export type TriggerType =
  | 'booking_confirmed'
  | 'checkin'
  | 'checkout'
  | 'during_reservation'
  | 'before_reservation'
  | 'after_reservation'
  | 'before_stay_ends'
  | 'guest_first_inquiry'
  | 'host_message_sent'
  | 'guest_canceled'
  | 'guest_checked_out'
  | 'conversation_content'
  | 'sentiment_change'
  | 'gap_night_opened'
  | 'cleaning_complete'
  | 'noise_disturbance'
  | 'scheduled'
  | 'send_once'
  | 'before_checkin'
  | 'after_checkin'
  | 'before_checkout'
  | 'after_checkout'
  | 'gap_night'

export type ChannelType = 'ota' | 'whatsapp' | 'email'

export type ActionType =
  | 'create_task'
  | 'flag_reservation'
  | 'staff_alert'
  | 'raise_action_item'

export type FailBehavior = 'skip' | 'stop'

export type ConditionType =
  | 'reservation_status'
  | 'guest_sentiment'
  | 'booking_channel'
  | 'guest_counts'
  | 'stay_details'
  | 'time_day'
  | 'external_state'
  | 'ai_conversation_check'

export interface BaseStep {
  id: string
  type: StepType
  name: string
}

export interface TriggerSettings {
  offsetAmount?: number
  offsetUnit?: 'minutes' | 'hours' | 'days'
  offsetDirection?: 'before' | 'at' | 'after'
  dayOfStay?: number
  frequency?: 'daily' | 'weekly' | 'monthly'
  scheduleTime?: string
  scheduleDate?: string
  keywords?: string
  targetSentiments?: ('positive' | 'neutral' | 'negative')[]
}

export interface TriggerEntry {
  type: TriggerType
  settings: TriggerSettings
}

export function defaultTriggerSettings(type: TriggerType): TriggerSettings {
  if (['before_checkin', 'before_checkout', 'before_reservation', 'before_stay_ends'].includes(type))
    return { offsetAmount: 2, offsetUnit: 'days' }
  if (['after_checkin', 'after_checkout', 'after_reservation'].includes(type))
    return { offsetAmount: 1, offsetUnit: 'hours' }
  if (type === 'checkin' || type === 'checkout')
    return { offsetDirection: 'at', offsetAmount: 0, offsetUnit: 'hours' }
  if (type === 'during_reservation')
    return { dayOfStay: 2 }
  if (type === 'scheduled')
    return { frequency: 'daily', scheduleTime: '09:00' }
  if (type === 'send_once')
    return { scheduleDate: '', scheduleTime: '09:00' }
  if (type === 'conversation_content')
    return { keywords: '' }
  if (type === 'sentiment_change')
    return { targetSentiments: ['negative'] }
  return {}
}

export interface TriggerStep extends BaseStep {
  type: 'trigger'
  triggers: TriggerEntry[]
  properties: string[]
}

export interface WaitStep extends BaseStep {
  type: 'wait'
  waitType: 'time' | 'trigger'
  duration: number
  unit: 'minutes' | 'hours' | 'days'
  relativeTo: 'checkin' | 'checkout' | 'booking' | null
  waitTrigger: string
}

export interface MessageStep extends BaseStep {
  type: 'message'
  messageMode: 'template' | 'directive'
  channel: ChannelType
  templateText: string
  directive: string
  contextCheckEnabled: boolean
  contextCheckInstruction: string
  fallback: 'skip' | 'static'
  fallbackText: string
}

export interface ContextCheckStep extends BaseStep {
  type: 'context_check'
  condition: string
  onFail: FailBehavior
}

export interface ActionStep extends BaseStep {
  type: 'action'
  actionType: ActionType
  details: string
}

export interface IfElseStep extends BaseStep {
  type: 'if_else'
  conditionType: ConditionType
  conditionDetails: string
  trueBranchLabel: string
  falseBranchLabel: string
}

export interface HardRequirementStep extends BaseStep {
  type: 'hard_requirement'
  conditionType: ConditionType
  conditionDetails: string
}

export interface CreateNoteStep extends BaseStep {
  type: 'create_note'
  noteContent: string
  visibleToAI: boolean
}

export interface ToggleAIStep extends BaseStep {
  type: 'toggle_ai'
  enable: boolean
}

export interface IntegrationStep extends BaseStep {
  type: 'integration'
  integrationName: string
  payload: string
}

export interface EndJourneyStep extends BaseStep {
  type: 'end_journey'
}

export type JourneyStep =
  | TriggerStep
  | WaitStep
  | MessageStep
  | ContextCheckStep
  | ActionStep
  | IfElseStep
  | HardRequirementStep
  | CreateNoteStep
  | ToggleAIStep
  | IntegrationStep
  | EndJourneyStep

export interface Journey {
  id: string
  name: string
  status: JourneyStatus
  triggerType: string
  lastModified: string
  properties: string[]
  steps: JourneyStep[]
}

export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  category: 'Guided Stays' | 'Revenue' | 'Verification' | 'Community'
  stepCount: number
  steps: JourneyStep[]
}

export const triggerMeta: Record<string, { label: string; category: TriggerCategory }> = {
  booking_confirmed: { label: 'Booking Confirmed', category: 'event' },
  checkin: { label: 'Check-In', category: 'calendar' },
  checkout: { label: 'Check-Out', category: 'calendar' },
  during_reservation: { label: 'During Reservation', category: 'calendar' },
  before_reservation: { label: 'Before Reservation', category: 'calendar' },
  after_reservation: { label: 'After Reservation', category: 'calendar' },
  before_stay_ends: { label: 'Before Stay Ends', category: 'calendar' },
  guest_first_inquiry: { label: 'Guest First Inquiry', category: 'event' },
  host_message_sent: { label: 'Host Message Sent', category: 'event' },
  guest_canceled: { label: 'Guest Canceled', category: 'event' },
  guest_checked_out: { label: 'Guest Checked Out', category: 'event' },
  conversation_content: { label: 'Conversation Content', category: 'event' },
  sentiment_change: { label: 'Sentiment Change', category: 'event' },
  gap_night_opened: { label: 'Gap Night Opened', category: 'calendar' },
  cleaning_complete: { label: 'Cleaning Complete', category: 'event' },
  noise_disturbance: { label: 'Noise / Disturbance', category: 'event' },
  scheduled: { label: 'Daily / Weekly / Monthly', category: 'calendar' },
  send_once: { label: 'Send Once', category: 'calendar' },
  before_checkin: { label: 'Before Check-in', category: 'calendar' },
  after_checkin: { label: 'After Check-in', category: 'calendar' },
  before_checkout: { label: 'Before Check-out', category: 'calendar' },
  after_checkout: { label: 'After Check-out', category: 'calendar' },
  gap_night: { label: 'Gap Night', category: 'calendar' },
}

export const conditionMeta: Record<ConditionType, string> = {
  reservation_status: 'Reservation Status',
  guest_sentiment: 'Guest Sentiment',
  booking_channel: 'Booking Channel',
  guest_counts: 'Guest Counts',
  stay_details: 'Stay Details',
  time_day: 'Time & Day',
  external_state: 'External State',
  ai_conversation_check: 'AI Conversation Check',
}

export interface JourneyGroup {
  id: string
  name: string
  journeyIds: string[]
  collapsed: boolean
}

export const mockGroups: JourneyGroup[] = [
  { id: 'g-1', name: 'Guest Experience', journeyIds: ['j-1', 'j-2'], collapsed: false },
  { id: 'g-2', name: 'Revenue', journeyIds: ['j-3'], collapsed: false },
]

export const mockJourneys: Journey[] = [
  {
    id: 'j-1',
    name: 'Guest Welcome & Stay Flow',
    status: 'active',
    triggerType: 'booking_confirmed',
    lastModified: '2026-05-10',
    properties: ['All Properties'],
    steps: [
      {
        id: 's-1-1',
        type: 'trigger',
        name: 'Booking Confirmed',
        triggers: [{ type: 'booking_confirmed', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 's-1-2',
        type: 'message',
        name: 'Send Welcome Message',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Welcome the guest warmly, confirm their booking details, and express excitement about hosting them. Mention the property highlights.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 's-1-3',
        type: 'wait',
        name: 'Wait Until 2 Days Before',
        waitType: 'time',
        duration: 2,
        unit: 'days',
        relativeTo: 'checkin',
        waitTrigger: '',
      },
      {
        id: 's-1-4',
        type: 'message',
        name: 'Send Check-in Details',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Share precise check-in instructions: door code, parking info, and a local area guide. Ask if the guest has any questions.',
        contextCheckEnabled: true,
        contextCheckInstruction: 'Do not send if the guest has already received check-in instructions.',
        fallback: 'static',
        fallbackText: 'Hi! Here are your check-in details. Please reach out if you need anything.',
      },
      {
        id: 's-1-5',
        type: 'message',
        name: 'Mid-stay Check-in',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Check in on the guest halfway through their stay. Ask if everything is comfortable and if they need any recommendations.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'j-2',
    name: 'Pre-Arrival Check-In Guide',
    status: 'active',
    triggerType: 'before_reservation',
    lastModified: '2026-05-14',
    properties: ['Swiss Properties'],
    steps: [
      {
        id: 's-2-1',
        type: 'trigger',
        name: 'Before Reservation',
        triggers: [{ type: 'before_reservation', settings: { offsetAmount: 3, offsetUnit: 'days' } }],
        properties: ['Swiss Properties'],
      },
      {
        id: 's-2-2',
        type: 'context_check',
        name: 'Check-in Details Already Sent?',
        condition: 'Has the guest already received check-in instructions in the last 7 days?',
        onFail: 'skip',
      },
      {
        id: 's-2-3',
        type: 'message',
        name: 'Send Arrival Instructions',
        messageMode: 'directive',
        channel: 'email',
        templateText: '',
        directive: 'Send a comprehensive pre-arrival guide: smart lock code, parking coordinates, public transport options from the airport, and local emergency contacts.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'j-3',
    name: 'Gap Night Opportunity',
    status: 'inactive',
    triggerType: 'gap_night_opened',
    lastModified: '2026-04-28',
    properties: ['All Properties'],
    steps: [
      {
        id: 's-3-1',
        type: 'trigger',
        name: 'Gap Night Opened',
        triggers: [{ type: 'gap_night_opened', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 's-3-2',
        type: 'action',
        name: 'Flag for Revenue Review',
        actionType: 'flag_reservation',
        details: 'Flag the gap night on the reservation for the revenue team to review pricing opportunities.',
      },
      {
        id: 's-3-3',
        type: 'message',
        name: 'Offer Gap Night to Current Guest',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Offer the departing guest the opportunity to extend their stay at a special discounted rate for the gap night. Highlight the convenience of not having to pack and move.',
        contextCheckEnabled: true,
        contextCheckInstruction: 'Do not send if the guest has already been offered an extension.',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 's-3-4',
        type: 'message',
        name: 'Offer to Incoming Guest',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Contact the incoming guest and offer them early check-in on the gap night for a small fee. Mention the benefit of settling in early.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'j-4',
    name: 'Post-Stay Review Request',
    status: 'inactive',
    triggerType: 'guest_checked_out',
    lastModified: '2026-05-18',
    properties: ['All Properties'],
    steps: [
      {
        id: 's-4-1',
        type: 'trigger',
        name: 'Guest Checked Out',
        triggers: [{ type: 'guest_checked_out', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 's-4-2',
        type: 'wait',
        name: 'Wait 1 Day',
        waitType: 'time',
        duration: 1,
        unit: 'days',
        relativeTo: 'checkout',
        waitTrigger: '',
      },
      {
        id: 's-4-3',
        type: 'hard_requirement',
        name: 'Positive Sentiment Only',
        conditionType: 'guest_sentiment',
        conditionDetails: 'Only proceed if overall guest sentiment was Positive or Neutral throughout the stay.',
      },
      {
        id: 's-4-4',
        type: 'message',
        name: 'Request Review',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Thank the guest sincerely for their stay and kindly request a review. Personalise with a detail from their trip if context is available.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
]

export const marketplaceTemplates: MarketplaceTemplate[] = [
  {
    id: 'mt-1',
    name: 'Complete Guided Stay',
    description: 'Full guest journey from booking to review with mid-stay check-in, upsell opportunities, and a review request.',
    category: 'Guided Stays',
    stepCount: 7,
    steps: [
      {
        id: 'mt1-s1',
        type: 'trigger',
        name: 'Booking Confirmed',
        triggers: [{ type: 'booking_confirmed', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 'mt1-s2',
        type: 'message',
        name: 'Welcome Message',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Send a warm welcome with booking confirmation and property highlights.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 'mt1-s3',
        type: 'wait',
        name: 'Wait Until 3 Days Before',
        waitType: 'time',
        duration: 3,
        unit: 'days',
        relativeTo: 'checkin',
        waitTrigger: '',
      },
      {
        id: 'mt1-s4',
        type: 'message',
        name: 'Pre-Arrival Guide',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Send check-in instructions, door code, parking info, and local recommendations.',
        contextCheckEnabled: true,
        contextCheckInstruction: 'Do not send if check-in details were already shared.',
        fallback: 'static',
        fallbackText: 'Your check-in details are ready. Contact us for the access code.',
      },
      {
        id: 'mt1-s5',
        type: 'message',
        name: 'Mid-Stay Upsell',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Check on the guest and offer optional upsells: late checkout, airport transfer, or local experiences.',
        contextCheckEnabled: true,
        contextCheckInstruction: 'Do not send if the guest has expressed dissatisfaction.',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 'mt1-s6',
        type: 'wait',
        name: 'Wait Until After Checkout',
        waitType: 'time',
        duration: 1,
        unit: 'days',
        relativeTo: 'checkout',
        waitTrigger: '',
      },
      {
        id: 'mt1-s7',
        type: 'message',
        name: 'Review Request',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Thank the guest for their stay and kindly request a review. Mention that their feedback helps improve future experiences.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'mt-2',
    name: 'Gap Night Revenue Booster',
    description: 'Automatically detect gap nights and offer extensions to existing guests or early check-in to incoming guests.',
    category: 'Revenue',
    stepCount: 4,
    steps: [
      {
        id: 'mt2-s1',
        type: 'trigger',
        name: 'Gap Night Opened',
        triggers: [{ type: 'gap_night_opened', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 'mt2-s2',
        type: 'action',
        name: 'Alert Revenue Team',
        actionType: 'staff_alert',
        details: 'Send a staff alert to the revenue team with gap night details and suggested pricing.',
      },
      {
        id: 'mt2-s3',
        type: 'message',
        name: 'Offer to Current Guest',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Offer the departing guest a discounted extra night. Emphasize convenience of not moving.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 'mt2-s4',
        type: 'message',
        name: 'Early Check-in Offer',
        messageMode: 'directive',
        channel: 'ota',
        templateText: '',
        directive: 'Offer the arriving guest early check-in on the gap night for a discounted fee.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'mt-3',
    name: 'New Guest Verification Flow',
    description: 'Automatically verify new guests with ID and deposit checks before confirming access details.',
    category: 'Verification',
    stepCount: 6,
    steps: [
      {
        id: 'mt3-s1',
        type: 'trigger',
        name: 'Booking Confirmed',
        triggers: [{ type: 'booking_confirmed', settings: {} }],
        properties: ['All Properties'],
      },
      {
        id: 'mt3-s2',
        type: 'hard_requirement',
        name: 'New Guest Only',
        conditionType: 'reservation_status',
        conditionDetails: 'Only proceed if this guest has not stayed before (first-time guest).',
      },
      {
        id: 'mt3-s3',
        type: 'message',
        name: 'Request ID Verification',
        messageMode: 'directive',
        channel: 'email',
        templateText: '',
        directive: 'Politely request the guest to complete ID verification via the provided link. Explain it is required for all new guests.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 'mt3-s4',
        type: 'wait',
        name: 'Wait 48h Before Check-in',
        waitType: 'time',
        duration: 48,
        unit: 'hours',
        relativeTo: 'checkin',
        waitTrigger: '',
      },
      {
        id: 'mt3-s5',
        type: 'action',
        name: 'Flag if Unverified',
        actionType: 'flag_reservation',
        details: 'Flag the reservation for manual review if the guest has not verified their ID 48 hours before check-in.',
      },
      {
        id: 'mt3-s6',
        type: 'message',
        name: 'Verification Reminder',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Send a friendly reminder that ID verification is still pending and needed to receive check-in details.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
    ],
  },
  {
    id: 'mt-4',
    name: 'Local Community Welcome',
    description: 'Share local tips, community events, and sustainability guidelines with guests after check-in.',
    category: 'Community',
    stepCount: 4,
    steps: [
      {
        id: 'mt4-s1',
        type: 'trigger',
        name: 'After Check-in',
        triggers: [{ type: 'checkin', settings: { offsetDirection: 'after', offsetAmount: 2, offsetUnit: 'hours' } }],
        properties: ['All Properties'],
      },
      {
        id: 'mt4-s2',
        type: 'wait',
        name: 'Wait 2 Hours',
        waitType: 'time',
        duration: 2,
        unit: 'hours',
        relativeTo: null,
        waitTrigger: '',
      },
      {
        id: 'mt4-s3',
        type: 'message',
        name: 'Community & Local Tips',
        messageMode: 'directive',
        channel: 'whatsapp',
        templateText: '',
        directive: 'Share a curated list of local restaurants, markets, and community events. Include sustainability guidelines for the property and area.',
        contextCheckEnabled: false,
        contextCheckInstruction: '',
        fallback: 'skip',
        fallbackText: '',
      },
      {
        id: 'mt4-s4',
        type: 'create_note',
        name: 'Log Community Guide Sent',
        noteContent: 'Community welcome guide sent to guest after check-in.',
        visibleToAI: true,
      },
    ],
  },
]

export const generatedJourneyExample: Journey & {
  aiReasoning: string
  stats: { messages: number; contextChecks: number; estimatedTime: string }
} = {
  id: 'ai-generated-1',
  name: 'AI Generated Journey',
  status: 'draft',
  triggerType: 'booking_confirmed',
  lastModified: new Date().toISOString().split('T')[0],
  properties: ['All Properties'],
  aiReasoning:
    'I structured this journey with three key communication moments: an immediate welcome at booking to set the tone, a pre-arrival message timed 2 days before check-in for maximum relevance, and a post-checkout review request after the guest has settled. I added a context check before the check-in details step to avoid re-sending information if it was already shared through another channel, keeping the experience clean and non-repetitive.',
  stats: {
    messages: 3,
    contextChecks: 1,
    estimatedTime: '14 days',
  },
  steps: [
    {
      id: 'ai-s1',
      type: 'trigger',
      name: 'Booking Confirmed',
      triggers: [{ type: 'booking_confirmed', settings: {} }],
      properties: ['All Properties'],
    },
    {
      id: 'ai-s2',
      type: 'message',
      name: 'Welcome Message',
      messageMode: 'directive',
      channel: 'ota',
      templateText: '',
      directive: 'Send a warm, personalized welcome message confirming the booking. Express excitement about hosting them and highlight the best features of the property.',
      contextCheckEnabled: false,
      contextCheckInstruction: '',
      fallback: 'skip',
      fallbackText: '',
    },
    {
      id: 'ai-s3',
      type: 'wait',
      name: 'Wait Until 2 Days Before Check-in',
      waitType: 'time',
      duration: 2,
      unit: 'days',
      relativeTo: 'checkin',
      waitTrigger: '',
    },
    {
      id: 'ai-s4',
      type: 'context_check',
      name: 'Check-in Info Already Sent?',
      condition: 'Has the guest already received check-in instructions or access details in the past 5 days?',
      onFail: 'skip',
    },
    {
      id: 'ai-s5',
      type: 'message',
      name: 'Check-in Details',
      messageMode: 'directive',
      channel: 'whatsapp',
      templateText: '',
      directive: 'Share complete check-in details: exact address, access code or key location, parking instructions, WiFi credentials, and a welcome guide with house rules and local tips.',
      contextCheckEnabled: false,
      contextCheckInstruction: '',
      fallback: 'static',
      fallbackText: 'Here are your check-in details! Please contact us directly if you have any questions.',
    },
    {
      id: 'ai-s6',
      type: 'message',
      name: 'Post-Stay Review Request',
      messageMode: 'directive',
      channel: 'ota',
      templateText: '',
      directive: 'Thank the guest sincerely for their stay. Mention a specific detail about their trip if available. Kindly request a review and let them know you look forward to hosting them again.',
      contextCheckEnabled: false,
      contextCheckInstruction: '',
      fallback: 'skip',
      fallbackText: '',
    },
  ],
}
