export interface CancellationPolicy {
  serviceId: string
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  noRefundHours: number
  lateCancellationFee: number
}

export const cancellationPolicies: CancellationPolicy[] = [
  { serviceId: 'svc-001', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-002', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 300000 },
  { serviceId: 'svc-003', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 200000 },
  { serviceId: 'svc-004', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 150000 },
  { serviceId: 'svc-005', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 150000 },
  { serviceId: 'svc-006', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-007', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-008', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
  { serviceId: 'svc-009', fullRefundHours: 48, partialRefundHours: 24, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 50000 },
  { serviceId: 'svc-010', fullRefundHours: 24, partialRefundHours: 12, partialRefundPercent: 50, noRefundHours: 0, lateCancellationFee: 100000 },
]

export function getPolicyForService(serviceId: string): CancellationPolicy | undefined {
  return cancellationPolicies.find(p => p.serviceId === serviceId)
}

export function calculateRefund(
  orderTotal: number,
  serviceDate: string,
  cancelledAt: string,
  policy: CancellationPolicy,
  cancelledBy: 'guest' | 'staff',
): { refundAmount: number, refundPercent: number, lateFee: number, reason: string } {
  if (cancelledBy === 'staff') {
    return { refundAmount: orderTotal, refundPercent: 100, lateFee: 0, reason: 'Staff cancellation — full refund' }
  }

  const hoursDiff = (new Date(serviceDate).getTime() - new Date(cancelledAt).getTime()) / (1000 * 60 * 60)

  if (hoursDiff >= policy.fullRefundHours) {
    return { refundAmount: orderTotal, refundPercent: 100, lateFee: 0, reason: `Cancelled ${Math.round(hoursDiff)}h in advance — full refund` }
  }
  if (hoursDiff >= policy.partialRefundHours) {
    const refund = Math.round(orderTotal * (policy.partialRefundPercent / 100))
    return { refundAmount: refund, refundPercent: policy.partialRefundPercent, lateFee: 0, reason: `Cancelled ${Math.round(hoursDiff)}h in advance — ${policy.partialRefundPercent}% refund` }
  }

  return { refundAmount: 0, refundPercent: 0, lateFee: policy.lateCancellationFee, reason: `Late cancellation (< ${policy.partialRefundHours}h) — no refund, late fee IDR ${policy.lateCancellationFee.toLocaleString()}` }
}
