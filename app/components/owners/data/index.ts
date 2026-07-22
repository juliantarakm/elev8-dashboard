// Barrel exports for the Owner domain data layer.
// Keep this file as the single import surface for downstream consumers.

export type {
  Owner,
  OwnerStatus,
  OwnerLanguage,
  StatementCurrency,
  OwnerPropertyMapping,
} from './owners'
export { mockOwners, mockOwnerPropertyMappings } from './owners'

export type { CommissionTier, CommissionRule } from './commission-rules'
export { mockCommissionRules } from './commission-rules'

export type {
  OwnerDashboardField,
  OwnerStatementField,
  OwnerPermissionTemplateId,
  OwnerPermissionConfig,
} from './owner-permissions'
export {
  ownerDashboardFieldLabels,
  ownerStatementFieldLabels,
  buildOwnerPermissionTemplate,
  mockOwnerPermissions,
} from './owner-permissions'

export type {
  OwnerStatementStatus,
  OwnerStatementLineCategory,
  OwnerStatementLine,
  OwnerStatementIssue,
  OwnerStatement,
} from './owner-statements'
export { mockOwnerStatements } from './owner-statements'

export type {
  OwnerStayStatus,
  OwnerStaySyncTarget,
  OwnerStaySyncState,
  OwnerStay,
} from './owner-stays'
export { ownerStaySyncTargetLabels, mockOwnerStays } from './owner-stays'

export type {
  OwnerLedgerSource,
  OwnerLedgerSourceBreakdown,
  OwnerLedgerUpcomingReservation,
  OwnerLedgerEntry,
} from './owner-ledger'
export { mockOwnerLedgerEntries } from './owner-ledger'
