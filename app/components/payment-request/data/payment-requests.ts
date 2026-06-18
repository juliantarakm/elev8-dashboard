import { ref } from 'vue'

export type FeeMode = 'card' | 'manual'
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

export interface PaymentRequest {
  id: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  listingId: string
  title: string
  description?: string
  amount: number
  currency: 'USD' | 'IDR'
  feeMode: FeeMode
  feeAmount: number
  totalAmount: number
  status: PaymentStatus
  payoutAccountId: string
  paymentLink: string
  qrCodeUrl?: string
  expiresAt: string
  paidAt?: string
  receiptUrl?: string
  cancelledAt?: string
  cancelledBy?: string
  createdAt: string
  createdBy: string
  notes?: string
}

export interface PaymentRequestDraft {
  guestName: string
  guestEmail: string
  guestPhone?: string
  listingId: string
  title: string
  description?: string
  amount: number
  currency: 'USD' | 'IDR'
  feeMode: FeeMode
  expiresInHours: number
}

export interface GuestOption {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  source: 'inbox' | 'payment_request' | 'manual'
  lastStay?: string
  listingName?: string
}

export const FEE_PERCENTAGE = 0.03

export function calculateFee(amount: number, feeMode: FeeMode): number {
  if (feeMode === 'manual')
    return 0
  const fee = amount * FEE_PERCENTAGE
  return Math.round(fee * 100) / 100
}

export function calculateTotal(amount: number, feeAmount: number): number {
  return Math.round((amount + feeAmount) * 100) / 100
}

export function generatePaymentLink(id: string): string {
  return `https://pay.elev8.co/r/${id}`
}

export function generateId(): string {
  return `pr-${Date.now()}`
}

export function getExpiryDate(hours: number): string {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export const paymentRequests = ref<PaymentRequest[]>([
  {
    id: 'pr-001',
    guestName: 'John Smith',
    guestEmail: 'john@example.com',
    listingId: 'lst-1',
    title: 'Downpayment Villa Sunset',
    amount: 500,
    currency: 'USD',
    feeMode: 'card',
    feeAmount: 15,
    totalAmount: 515,
    status: 'pending',
    payoutAccountId: 'pay-1',
    paymentLink: 'https://pay.elev8.co/r/pr-001',
    expiresAt: '2026-06-19T14:30:00Z',
    createdAt: '2026-06-18T14:30:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-002',
    guestName: 'Lisa Park',
    guestEmail: 'lisa@example.com',
    listingId: 'lst-3',
    title: 'Spa package payment',
    amount: 1500000,
    currency: 'IDR',
    feeMode: 'manual',
    feeAmount: 0,
    totalAmount: 1500000,
    status: 'paid',
    payoutAccountId: 'pay-2',
    paymentLink: 'https://pay.elev8.co/r/pr-002',
    paidAt: '2026-06-17T10:00:00Z',
    receiptUrl: '/receipts/pr-002.pdf',
    createdAt: '2026-06-17T09:00:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-003',
    guestName: 'Marcel Weber',
    guestEmail: 'marcel@example.com',
    listingId: 'lst-2',
    title: 'Extra cleaning fee',
    amount: 75,
    currency: 'USD',
    feeMode: 'card',
    feeAmount: 2.25,
    totalAmount: 77.25,
    status: 'expired',
    payoutAccountId: 'pay-1',
    paymentLink: 'https://pay.elev8.co/r/pr-003',
    expiresAt: '2026-06-15T10:00:00Z',
    createdAt: '2026-06-14T10:00:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-004',
    guestName: 'Emma Thompson',
    guestEmail: 'emma@example.com',
    listingId: 'lst-4',
    title: 'Airport transfer',
    amount: 500000,
    currency: 'IDR',
    feeMode: 'card',
    feeAmount: 15000,
    totalAmount: 515000,
    status: 'cancelled',
    payoutAccountId: 'pay-2',
    paymentLink: 'https://pay.elev8.co/r/pr-004',
    expiresAt: '2026-06-20T08:00:00Z',
    cancelledAt: '2026-06-18T09:00:00Z',
    cancelledBy: 'staff-2',
    createdAt: '2026-06-17T08:00:00Z',
    createdBy: 'staff-2',
  },
])
