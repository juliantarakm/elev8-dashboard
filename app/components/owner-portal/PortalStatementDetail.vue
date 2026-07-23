<script setup lang="ts">
import type { OwnerStatementField } from '~/components/owners/data/owner-permissions'
import type { OwnerStatementLine } from '~/components/owners/data/owner-statements'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listings } from '~/components/listings/data/listings'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import { useOwnerStatements } from '~/composables/useOwnerStatements'
import PortalExportButtons from './PortalExportButtons.vue'
import PortalRaiseIssueDialog from './PortalRaiseIssueDialog.vue'

const props = defineProps<{
  statementId: string
}>()

const { visibleStatements, canViewStatementField } = useOwnerPortal()
const { issues } = useOwnerStatements()

const statement = computed(() => visibleStatements.value.find(item => item.id === props.statementId
  && item.status === 'published') ?? null)
const listingName = computed(() => {
  const listingId = statement.value?.listingId
  return listings.value.find(listing => listing.id === listingId)?.name ?? listingId ?? 'Property'
})
const sourceLines = computed(() => {
  if (!statement.value)
    return []
  return statement.value.publishedSnapshot?.lines ?? statement.value.lines
})
const totalAmount = computed(() => {
  if (!statement.value)
    return 0
  return statement.value.publishedSnapshot?.totalAmount ?? statement.value.totalAmount
})
const currency = computed(() => {
  if (!statement.value)
    return ''
  return statement.value.publishedSnapshot?.currency ?? statement.value.currency
})

const fieldForCategory: Record<OwnerStatementLine['category'], OwnerStatementField> = {
  revenue: 'revenueLines',
  expense: 'expenseDetails',
  commission: 'commissionDetails',
  tax: 'taxesAndFees',
  fee: 'taxesAndFees',
  adjustment: 'adjustments',
}

const sectionLabels: Record<OwnerStatementField, string> = {
  revenueLines: 'Revenue',
  expenseDetails: 'Operating expenses',
  commissionDetails: 'Commission',
  taxesAndFees: 'Taxes & fees',
  adjustments: 'Adjustments',
  netPayout: 'Net payout',
}

const sectionOrder: OwnerStatementField[] = [
  'revenueLines',
  'expenseDetails',
  'commissionDetails',
  'taxesAndFees',
  'adjustments',
]

const visibleSections = computed(() => sectionOrder
  .filter(field => canViewStatementField(field))
  .map(field => ({
    field,
    label: sectionLabels[field],
    lines: sourceLines.value.filter(line => fieldForCategory[line.category] === field),
  }))
  .filter(section => section.lines.length > 0))

const selectedLine = ref<OwnerStatementLine | null>(null)
const issueDialogOpen = ref(false)

function openIssue(line: OwnerStatementLine) {
  selectedLine.value = line
  issueDialogOpen.value = true
}

function formatCurrency(amount: number) {
  return `${currency.value} ${amount.toLocaleString('en-US')}`
}

function hasOpenIssue(lineId: string) {
  return issues.value.some(issue => issue.statementId === props.statementId
    && issue.lineId === lineId
    && !issue.resolvedAt)
}
</script>

<template>
  <div v-if="statement" class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <NuxtLink
          to="/owner-portal/statements"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" />
          Statements
        </NuxtLink>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ listingName }}
          </h1>
          <Badge variant="secondary">
            Published
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          Statement for {{ statement.period }} · Published {{ statement.publishedAt ? new Date(statement.publishedAt).toLocaleDateString('en-US') : '—' }}
        </p>
      </div>
      <PortalExportButtons :statement-id="statement.id" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Statement details</CardTitle>
        <CardDescription>
          Published values are read-only. Raise an issue on a line if Finance needs to review it.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <section
          v-for="section in visibleSections"
          :key="section.field"
          :data-testid="`statement-section-${section.field}`"
          class="space-y-2"
          :aria-labelledby="`statement-section-label-${section.field}`"
        >
          <h2 :id="`statement-section-label-${section.field}`" class="text-sm font-medium">
            {{ section.label }}
          </h2>
          <div class="divide-y rounded-md border">
            <div
              v-for="line in section.lines"
              :key="line.id"
              class="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="min-w-0">
                <p class="text-sm">
                  {{ line.label }}
                </p>
                <p v-if="hasOpenIssue(line.id)" class="mt-1 text-xs text-primary">
                  Issue open with Finance
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-3">
                <span
                  class="text-sm font-medium tabular-nums"
                  :class="line.amount < 0 ? 'text-destructive' : ''"
                >
                  {{ formatCurrency(line.amount) }}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  :data-testid="`raise-issue-${line.id}`"
                  :aria-label="`Raise an issue for ${line.label}`"
                  @click="openIssue(line)"
                >
                  <Icon name="lucide:flag" class="mr-2 size-4" aria-hidden="true" />
                  {{ hasOpenIssue(line.id) ? 'View issue' : 'Raise issue' }}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          v-if="canViewStatementField('netPayout')"
          data-testid="statement-section-netPayout"
          class="flex items-center justify-between border-t pt-4"
        >
          <h2 class="text-base font-semibold">
            Net owner payout
          </h2>
          <span class="text-base font-semibold tabular-nums">
            {{ formatCurrency(totalAmount) }}
          </span>
        </section>
      </CardContent>
    </Card>

    <PortalRaiseIssueDialog
      v-if="selectedLine"
      v-model:open="issueDialogOpen"
      :statement-id="statement.id"
      :line-id="selectedLine.id"
      :line-label="selectedLine.label"
      :amount="selectedLine.amount"
    />
  </div>

  <div v-else class="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-8 text-center" data-testid="statement-not-found" role="status">
    <div class="space-y-2">
      <Icon name="lucide:file-x-2" class="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <h1 class="text-lg font-semibold">
        Statement not found
      </h1>
      <p class="max-w-sm text-sm text-muted-foreground">
        This statement is not available in your owner portal.
      </p>
      <Button as-child variant="outline" size="sm">
        <NuxtLink to="/owner-portal/statements">
          Back to statements
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
