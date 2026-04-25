export type ConversationStatus = 'needs_reply' | 'waiting_on_guest' | 'done'
export type GuestSentiment = 'positive' | 'neutral' | 'negative'
export type MessageSender = 'guest' | 'host' | 'system' | 'ai'
export type ActionSeverity = 'warning' | 'urgent' | 'info'
export type ActivityEventColor = 'gold' | 'green' | 'blue' | 'gray'

export type StayStatus = 'inquiry' | 'current' | 'future' | 'past'

export interface Conversation {
  id: string
  guestName: string
  guestAvatar?: string
  guestInitials: string
  listingName: string
  propertyName: string
  otaSource: string
  reservationId: string
  status: ConversationStatus
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  isAssignedToMe: boolean
  labels: string[]
  sentiment: GuestSentiment
  sentimentNote: string
  stayStatus: StayStatus
  checkIn: string
  checkOut: string
}

export interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  senderName: string
  content: string
  channel: string
  timestamp: string
  isAISuggestion?: boolean
  intentDetected?: string
  sendStatus?: 'sending' | 'sent' | 'failed'
}

export interface SmartAction {
  id: string
  type: string
  title: string
  description: string
  severity: ActionSeverity
  primaryAction: string
  dismissLabel: string
  detectedBy: 'elevai' | 'system'
}

export interface GuestDetails {
  name: string
  email: string
  phone: string
  previousStays: number
  notes: string
}

export interface ListingDetails {
  name: string
  property: string
  room: string
  amenities: string[]
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee?: string
  dueDate?: string
}

export interface ActivityEvent {
  id: string
  type: 'message' | 'reply' | 'reservation' | 'guide_sent' | 'cleaning' | 'task' | 'system'
  title: string
  description: string
  actor: string
  timestamp: string
  channel?: string
  colorDot: ActivityEventColor
}

export interface Reservation {
  id: string
  propertyName: string
  roomName: string
  listingName: string
  otaSource: string
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
  totalPrice: number
  currency: string
  smartActions: SmartAction[]
  guestDetails: GuestDetails
  listingDetails: ListingDetails
  tasks: Task[]
  activity: ActivityEvent[]
}

export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    guestName: 'Sarah Mitchell',
    guestAvatar: undefined,
    guestInitials: 'SM',
    listingName: 'Villa Canggu',
    propertyName: 'Canggu Properties',
    otaSource: 'Airbnb',
    reservationId: 'res-1',
    status: 'needs_reply',
    lastMessage: 'What time is check-in? We arrive at 3 PM.',
    lastMessageAt: '2025-04-25T09:15:00Z',
    unreadCount: 2,
    isAssignedToMe: true,
    labels: ['check-in-today'],
    sentiment: 'positive',
    sentimentNote: 'Guest is excited about the stay',
    stayStatus: 'current',
    checkIn: '2025-04-25T15:00:00Z',
    checkOut: '2025-04-30T11:00:00Z',
  },
  {
    id: 'conv-2',
    guestName: 'James Wilson',
    guestAvatar: undefined,
    guestInitials: 'JW',
    listingName: 'Sunset Loft',
    propertyName: 'Seminyak Suites',
    otaSource: 'Booking.com',
    reservationId: 'res-2',
    status: 'waiting_on_guest',
    lastMessage: 'Thanks for the info! I\'ll confirm soon.',
    lastMessageAt: '2025-04-24T16:30:00Z',
    unreadCount: 0,
    isAssignedToMe: true,
    labels: [],
    sentiment: 'positive',
    sentimentNote: 'Polite and responsive',
    stayStatus: 'future',
    checkIn: '2025-04-28T15:00:00Z',
    checkOut: '2025-05-01T11:00:00Z',
  },
  {
    id: 'conv-3',
    guestName: 'Emily Chen',
    guestAvatar: undefined,
    guestInitials: 'EC',
    listingName: 'Beach House',
    propertyName: 'Canggu Properties',
    otaSource: 'Airbnb',
    reservationId: 'res-3',
    status: 'needs_reply',
    lastMessage: 'Is there parking available at the property?',
    lastMessageAt: '2025-04-25T07:45:00Z',
    unreadCount: 1,
    isAssignedToMe: false,
    labels: ['unassigned'],
    sentiment: 'neutral',
    sentimentNote: 'Standard inquiry',
    stayStatus: 'future',
    checkIn: '2025-04-26T15:00:00Z',
    checkOut: '2025-04-29T11:00:00Z',
  },
  {
    id: 'conv-4',
    guestName: 'Alex Rivera',
    guestAvatar: undefined,
    guestInitials: 'AR',
    listingName: 'Pool Villa',
    propertyName: 'Umalas Villas',
    otaSource: 'Airbnb',
    reservationId: 'res-4',
    status: 'done',
    lastMessage: 'Everything was great, thank you!',
    lastMessageAt: '2025-04-23T11:00:00Z',
    unreadCount: 0,
    isAssignedToMe: true,
    labels: [],
    sentiment: 'positive',
    sentimentNote: 'Happy guest, left 5-star review',
    stayStatus: 'past',
    checkIn: '2025-04-18T15:00:00Z',
    checkOut: '2025-04-23T11:00:00Z',
  },
  {
    id: 'conv-5',
    guestName: 'Priya Sharma',
    guestAvatar: undefined,
    guestInitials: 'PS',
    listingName: 'Garden Retreat',
    propertyName: 'Ubud Retreats',
    otaSource: 'Booking.com',
    reservationId: 'res-5',
    status: 'needs_reply',
    lastMessage: 'The AC is not working and the wifi keeps disconnecting. This is unacceptable!',
    lastMessageAt: '2025-04-25T08:20:00Z',
    unreadCount: 3,
    isAssignedToMe: true,
    labels: ['complaint', 'urgent'],
    sentiment: 'negative',
    sentimentNote: 'Frustrated about amenities not working',
    stayStatus: 'current',
    checkIn: '2025-04-24T15:00:00Z',
    checkOut: '2025-04-28T11:00:00Z',
  },
]

export const messages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      sender: 'guest',
      senderName: 'Sarah Mitchell',
      content: 'Hi! We\'re arriving tomorrow and wanted to confirm the check-in process.',
      channel: 'Airbnb',
      timestamp: '2025-04-25T09:00:00Z',
    },
    {
      id: 'msg-1-2',
      sender: 'ai',
      conversationId: 'conv-1',
      senderName: 'Elevai',
      content: 'Welcome! Check-in is at 3 PM. Our team will greet you at the villa. Here\'s a link to our digital guide with everything you need to know about the property.',
      channel: 'Airbnb',
      timestamp: '2025-04-25T09:05:00Z',
      isAISuggestion: true,
      intentDetected: 'check-in inquiry',
    },
    {
      id: 'msg-1-3',
      sender: 'guest',
      conversationId: 'conv-1',
      senderName: 'Sarah Mitchell',
      content: 'What time is check-in? We arrive at 3 PM.',
      channel: 'Airbnb',
      timestamp: '2025-04-25T09:15:00Z',
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      sender: 'host',
      conversationId: 'conv-2',
      senderName: 'You',
      content: 'Hi James, just wanted to confirm your check-in date is April 28th. Let us know if you need an early check-in!',
      channel: 'Booking.com',
      timestamp: '2025-04-24T14:00:00Z',
    },
    {
      id: 'msg-2-2',
      sender: 'guest',
      conversationId: 'conv-2',
      senderName: 'James Wilson',
      content: 'Thanks for the info! I\'ll confirm soon.',
      channel: 'Booking.com',
      timestamp: '2025-04-24T16:30:00Z',
    },
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      sender: 'guest',
      conversationId: 'conv-3',
      senderName: 'Emily Chen',
      content: 'Hello, I have a few questions about the property.',
      channel: 'Airbnb',
      timestamp: '2025-04-25T07:30:00Z',
    },
    {
      id: 'msg-3-2',
      sender: 'guest',
      conversationId: 'conv-3',
      senderName: 'Emily Chen',
      content: 'Is there parking available at the property?',
      channel: 'Airbnb',
      timestamp: '2025-04-25T07:45:00Z',
    },
  ],
  'conv-4': [
    {
      id: 'msg-4-1',
      sender: 'guest',
      conversationId: 'conv-4',
      senderName: 'Alex Rivera',
      content: 'Just wanted to say the stay was wonderful. The pool was amazing!',
      channel: 'Airbnb',
      timestamp: '2025-04-23T10:30:00Z',
    },
    {
      id: 'msg-4-2',
      sender: 'host',
      conversationId: 'conv-4',
      senderName: 'You',
      content: 'Thank you Alex! We\'re so glad you enjoyed your stay. Hope to welcome you back soon!',
      channel: 'Airbnb',
      timestamp: '2025-04-23T10:45:00Z',
    },
    {
      id: 'msg-4-3',
      sender: 'guest',
      conversationId: 'conv-4',
      senderName: 'Alex Rivera',
      content: 'Everything was great, thank you!',
      channel: 'Airbnb',
      timestamp: '2025-04-23T11:00:00Z',
    },
  ],
  'conv-5': [
    {
      id: 'msg-5-1',
      sender: 'guest',
      conversationId: 'conv-5',
      senderName: 'Priya Sharma',
      content: 'We just arrived and the AC is not working. It\'s really hot in here.',
      channel: 'Booking.com',
      timestamp: '2025-04-25T07:50:00Z',
    },
    {
      id: 'msg-5-2',
      sender: 'guest',
      conversationId: 'conv-5',
      senderName: 'Priya Sharma',
      content: 'And now the wifi keeps disconnecting too. This is really frustrating.',
      channel: 'Booking.com',
      timestamp: '2025-04-25T08:10:00Z',
    },
    {
      id: 'msg-5-3',
      conversationId: 'conv-5',
      sender: 'ai',
      senderName: 'Elevai',
      content: 'I\'m sorry to hear about these issues. Let me immediately notify our maintenance team and send someone to assist. In the meantime, here are some troubleshooting steps for the AC and wifi.',
      channel: 'Booking.com',
      timestamp: '2025-04-25T08:15:00Z',
      isAISuggestion: true,
      intentDetected: 'complaint',
    },
  ],
}

export const reservations: Record<string, Reservation> = {
  'res-1': {
    id: 'res-1',
    propertyName: 'Canggu Properties',
    roomName: 'Villa Canggu',
    listingName: 'Villa Canggu',
    otaSource: 'Airbnb',
    checkIn: '2025-04-25T15:00:00Z',
    checkOut: '2025-04-30T11:00:00Z',
    nights: 5,
    guestCount: 2,
    totalPrice: 750,
    currency: 'USD',
    smartActions: [
      {
        id: 'action-1-1',
        type: 'late_checkout',
        title: 'Late Checkout Requested',
        description: 'Guest has requested a late checkout. Standard policy allows up to 1 PM.',
        severity: 'warning',
        primaryAction: 'Approve Late Checkout',
        dismissLabel: 'Deny Request',
        detectedBy: 'elevai',
      },
      {
        id: 'action-1-2',
        type: 'missing_guide',
        title: 'Digital Guide Not Sent',
        description: 'The property digital guide has not been sent to this guest yet.',
        severity: 'urgent',
        primaryAction: 'Send Guide Now',
        dismissLabel: 'Skip',
        detectedBy: 'system',
      },
    ],
    guestDetails: {
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '+1 555-0142',
      previousStays: 2,
      notes: 'Returning guest. Prefers early check-in. Allergic to feather pillows.',
    },
    listingDetails: {
      name: 'Villa Canggu',
      property: 'Canggu Properties',
      room: 'Master Suite',
      amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'Parking', 'Garden'],
    },
    tasks: [
      {
        id: 'task-1-1',
        title: 'Prepare welcome hamper',
        status: 'in_progress',
        assignee: 'Housekeeping',
        dueDate: '2025-04-25T12:00:00Z',
      },
      {
        id: 'task-1-2',
        title: 'Restock bathroom amenities',
        status: 'todo',
        assignee: 'Housekeeping',
      },
    ],
    activity: [
      {
        id: 'act-1-1',
        type: 'reservation',
        title: 'Reservation Confirmed',
        description: 'New reservation for 5 nights',
        actor: 'System',
        timestamp: '2025-04-20T10:00:00Z',
        colorDot: 'green',
      },
      {
        id: 'act-1-2',
        type: 'guide_sent',
        title: 'Digital Guide Sent',
        description: 'Property guide sent to guest',
        actor: 'System',
        timestamp: '2025-04-21T08:00:00Z',
        colorDot: 'blue',
      },
      {
        id: 'act-1-3',
        type: 'message',
        title: 'Guest Message',
        description: 'Sarah asked about check-in time',
        actor: 'Sarah Mitchell',
        timestamp: '2025-04-25T09:00:00Z',
        channel: 'Airbnb',
        colorDot: 'gold',
      },
    ],
  },
  'res-2': {
    id: 'res-2',
    propertyName: 'Seminyak Suites',
    roomName: 'Sunset Loft',
    listingName: 'Sunset Loft',
    otaSource: 'Booking.com',
    checkIn: '2025-04-28T15:00:00Z',
    checkOut: '2025-05-01T11:00:00Z',
    nights: 3,
    guestCount: 1,
    totalPrice: 420,
    currency: 'USD',
    smartActions: [],
    guestDetails: {
      name: 'James Wilson',
      email: 'j.wilson@email.com',
      phone: '+44 7700 900123',
      previousStays: 0,
      notes: 'First-time guest.',
    },
    listingDetails: {
      name: 'Sunset Loft',
      property: 'Seminyak Suites',
      room: 'Loft Suite',
      amenities: ['WiFi', 'AC', 'Rooftop Terrace', 'Kitchen'],
    },
    tasks: [],
    activity: [
      {
        id: 'act-2-1',
        type: 'reservation',
        title: 'Reservation Confirmed',
        description: 'New reservation for 3 nights',
        actor: 'System',
        timestamp: '2025-04-22T14:00:00Z',
        colorDot: 'green',
      },
    ],
  },
  'res-3': {
    id: 'res-3',
    propertyName: 'Canggu Properties',
    roomName: 'Beach House',
    listingName: 'Beach House',
    otaSource: 'Airbnb',
    checkIn: '2025-04-26T15:00:00Z',
    checkOut: '2025-04-29T11:00:00Z',
    nights: 3,
    guestCount: 4,
    totalPrice: 680,
    currency: 'USD',
    smartActions: [
      {
        id: 'action-3-1',
        type: 'extra_item',
        title: 'Extra Guest Added',
        description: 'Guest indicated 4 people instead of the booked 2. Additional fees may apply.',
        severity: 'info',
        primaryAction: 'Review & Update',
        dismissLabel: 'Ignore',
        detectedBy: 'system',
      },
    ],
    guestDetails: {
      name: 'Emily Chen',
      email: 'emily.chen@email.com',
      phone: '+61 4 1234 5678',
      previousStays: 1,
      notes: 'Travelling with family.',
    },
    listingDetails: {
      name: 'Beach House',
      property: 'Canggu Properties',
      room: 'Entire House',
      amenities: ['Pool', 'WiFi', 'AC', 'Kitchen', 'Beach Access', 'Parking'],
    },
    tasks: [
      {
        id: 'task-3-1',
        title: 'Verify guest count',
        status: 'todo',
      },
    ],
    activity: [
      {
        id: 'act-3-1',
        type: 'reservation',
        title: 'Reservation Confirmed',
        description: 'New reservation for 3 nights',
        actor: 'System',
        timestamp: '2025-04-23T09:00:00Z',
        colorDot: 'green',
      },
    ],
  },
  'res-4': {
    id: 'res-4',
    propertyName: 'Umalas Villas',
    roomName: 'Pool Villa',
    listingName: 'Pool Villa',
    otaSource: 'Airbnb',
    checkIn: '2025-04-18T15:00:00Z',
    checkOut: '2025-04-23T11:00:00Z',
    nights: 5,
    guestCount: 2,
    totalPrice: 900,
    currency: 'USD',
    smartActions: [],
    guestDetails: {
      name: 'Alex Rivera',
      email: 'alex.rivera@email.com',
      phone: '+1 555-0198',
      previousStays: 3,
      notes: 'Loyal returning guest. Prefers pool-facing room.',
    },
    listingDetails: {
      name: 'Pool Villa',
      property: 'Umalas Villas',
      room: 'Villa with Private Pool',
      amenities: ['Private Pool', 'WiFi', 'AC', 'Kitchen', 'Garden', 'Parking'],
    },
    tasks: [],
    activity: [
      {
        id: 'act-4-1',
        type: 'reservation',
        title: 'Reservation Confirmed',
        description: 'New reservation for 5 nights',
        actor: 'System',
        timestamp: '2025-04-10T12:00:00Z',
        colorDot: 'green',
      },
      {
        id: 'act-4-2',
        type: 'system',
        title: 'Checkout Completed',
        description: 'Guest checked out successfully',
        actor: 'System',
        timestamp: '2025-04-23T11:00:00Z',
        colorDot: 'gray',
      },
    ],
  },
  'res-5': {
    id: 'res-5',
    propertyName: 'Ubud Retreats',
    roomName: 'Garden Retreat',
    listingName: 'Garden Retreat',
    otaSource: 'Booking.com',
    checkIn: '2025-04-24T15:00:00Z',
    checkOut: '2025-04-28T11:00:00Z',
    nights: 4,
    guestCount: 2,
    totalPrice: 560,
    currency: 'USD',
    smartActions: [
      {
        id: 'action-5-1',
        type: 'complaint',
        title: 'Guest Complaint Reported',
        description: 'AC not working and WiFi issues reported. Immediate attention required.',
        severity: 'urgent',
        primaryAction: 'Assign Maintenance',
        dismissLabel: 'Mark as Noted',
        detectedBy: 'elevai',
      },
    ],
    guestDetails: {
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      previousStays: 0,
      notes: 'First-time guest. Mentioned sensitivity to heat.',
    },
    listingDetails: {
      name: 'Garden Retreat',
      property: 'Ubud Retreats',
      room: 'Garden Suite',
      amenities: ['Garden', 'WiFi', 'AC', 'Yoga Deck', 'Breakfast Included'],
    },
    tasks: [
      {
        id: 'task-5-1',
        title: 'Fix AC unit in Garden Suite',
        status: 'todo',
        assignee: 'Maintenance',
        dueDate: '2025-04-25T10:00:00Z',
      },
      {
        id: 'task-5-2',
        title: 'Check WiFi router',
        status: 'todo',
        assignee: 'Maintenance',
        dueDate: '2025-04-25T10:00:00Z',
      },
    ],
    activity: [
      {
        id: 'act-5-1',
        type: 'reservation',
        title: 'Reservation Confirmed',
        description: 'New reservation for 4 nights',
        actor: 'System',
        timestamp: '2025-04-19T08:00:00Z',
        colorDot: 'green',
      },
      {
        id: 'act-5-2',
        type: 'task',
        title: 'Complaint Filed',
        description: 'AC and WiFi issues reported by guest',
        actor: 'Priya Sharma',
        timestamp: '2025-04-25T08:15:00Z',
        colorDot: 'gold',
      },
    ],
  },
}

export const otaSources = [
  { name: 'Airbnb', color: '#FF5A5F', icon: 'logos:airbnb' },
  { name: 'Booking.com', color: '#003580', icon: 'lucide:calendar-check' },
]