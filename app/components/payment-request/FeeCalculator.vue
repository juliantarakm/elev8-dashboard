<script setup lang="ts">
import type { FeeMode } from './data/payment-requests'
import { calculateFee, calculateTotal } from './data/payment-requests'

interface Props {
  amount: number
  feeMode: FeeMode
  currency: string
}

const { amount, feeMode, currency } = defineProps<Props>()

const feeAmount = computed(() => calculateFee(amount, feeMode))
const totalAmount = computed(() => calculateTotal(amount, feeAmount.value))

const symbol = computed(() => currency === 'IDR' ? 'Rp' : '$')

function fmt(n: number) {
  if (currency === 'IDR')
    return n.toLocaleString('id-ID')
  return n.toFixed(2)
}
</script>

<template>
  <div class="rounded-lg border bg-muted/20 p-4 space-y-3">
    <p class="text-sm font-medium">
      Fee calculation
    </p>

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Amount</span>
        <span>{{ symbol }}{{ fmt(amount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          {{ feeMode === 'card' ? 'Card fee (3%)' : 'Manual (no fee)' }}
        </span>
        <span>{{ feeMode === 'card' ? `${symbol}${fmt(feeAmount)}` : '-' }}</span>
      </div>
      <Separator />
      <div class="flex items-center justify-between text-sm font-medium">
        <span>Total</span>
        <span>{{ symbol }}{{ fmt(totalAmount) }}</span>
      </div>
    </div>

    <p class="text-xs text-muted-foreground">
      {{ feeMode === 'card'
        ? 'Guest pays total amount including processing fee.'
        : 'No processing fee. Guest pays exact amount.' }}
    </p>
  </div>
</template>
