// Owner Portal visibility permissions — what each owner is allowed to see
// inside their own portal. Two built-in templates ("full_transparency" and
// "financial_summary") cover most cases; "custom" lets staff flip individual
// fields per owner.

export type OwnerDashboardField
  = | 'grossRevenue'
    | 'netRevenue'
    | 'occupancy'
    | 'adr'
    | 'bookingSources'
    | 'upcomingReservations'
    | 'guestRatings'

export type OwnerStatementField
  = | 'revenueLines'
    | 'expenseDetails'
    | 'commissionDetails'
    | 'taxesAndFees'
    | 'adjustments'
    | 'netPayout'

export type OwnerPermissionTemplateId = 'full_transparency' | 'financial_summary' | 'custom'

export interface OwnerPermissionConfig {
  ownerId: string
  templateId: OwnerPermissionTemplateId
  dashboard: Record<OwnerDashboardField, boolean>
  statement: Record<OwnerStatementField, boolean>
  updatedAt: string
}

export const ownerDashboardFieldLabels: Record<OwnerDashboardField, string> = {
  grossRevenue: 'Gross Revenue',
  netRevenue: 'Net Revenue',
  occupancy: 'Occupancy',
  adr: 'ADR',
  bookingSources: 'Booking Sources',
  upcomingReservations: 'Upcoming Reservations',
  guestRatings: 'Guest Ratings',
}

export const ownerStatementFieldLabels: Record<OwnerStatementField, string> = {
  revenueLines: 'Revenue Lines',
  expenseDetails: 'Expense Details',
  commissionDetails: 'Commission Details',
  taxesAndFees: 'Taxes & Fees',
  adjustments: 'Adjustments',
  netPayout: 'Net Payout',
}

// --- Template factories ------------------------------------------------------

const allDashboardFieldsOn: Record<OwnerDashboardField, boolean> = {
  grossRevenue: true,
  netRevenue: true,
  occupancy: true,
  adr: true,
  bookingSources: true,
  upcomingReservations: true,
  guestRatings: true,
}

const allStatementFieldsOn: Record<OwnerStatementField, boolean> = {
  revenueLines: true,
  expenseDetails: true,
  commissionDetails: true,
  taxesAndFees: true,
  adjustments: true,
  netPayout: true,
}

const financialSummaryStatement: Record<OwnerStatementField, boolean> = {
  revenueLines: true,
  expenseDetails: false,
  commissionDetails: true,
  taxesAndFees: true,
  adjustments: true,
  netPayout: true,
}

const financialSummaryDashboard: Record<OwnerDashboardField, boolean> = {
  grossRevenue: true,
  netRevenue: true,
  occupancy: true,
  adr: true,
  bookingSources: false,
  upcomingReservations: true,
  guestRatings: false,
}

export function buildOwnerPermissionTemplate(
  templateId: OwnerPermissionTemplateId,
  ownerId: string,
  updatedAt: string,
): OwnerPermissionConfig {
  if (templateId === 'full_transparency') {
    return {
      ownerId,
      templateId,
      dashboard: { ...allDashboardFieldsOn },
      statement: { ...allStatementFieldsOn },
      updatedAt,
    }
  }
  if (templateId === 'financial_summary') {
    return {
      ownerId,
      templateId,
      dashboard: { ...financialSummaryDashboard },
      statement: { ...financialSummaryStatement },
      updatedAt,
    }
  }
  // 'custom' — start from financial summary as a sensible default.
  return {
    ownerId,
    templateId,
    dashboard: { ...financialSummaryDashboard },
    statement: { ...financialSummaryStatement },
    updatedAt,
  }
}

// --- Seed fixtures ----------------------------------------------------------

export const mockOwnerPermissions: OwnerPermissionConfig[] = [
  // Wayan opted into full transparency — sees everything.
  buildOwnerPermissionTemplate('full_transparency', 'own-1', '2026-01-15T08:00:00.000Z'),
  // I Putu has the financial summary template — no booking source detail, no ratings.
  buildOwnerPermissionTemplate('financial_summary', 'own-2', '2025-12-01T08:00:00.000Z'),
  // Ni Kadek is still invited; defaults to financial summary until she accepts.
  buildOwnerPermissionTemplate('financial_summary', 'own-3', '2026-07-01T08:00:00.000Z'),
]
