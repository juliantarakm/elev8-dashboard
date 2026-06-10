<script setup lang="ts">
import type { Listing, Unit } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing, activeUnit?: Unit | null }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const editForm = ref({
  nightlyRate: props.listing.pricing.nightlyRate,
  cleaningFee: props.listing.pricing.cleaningFee,
  serviceFee: props.listing.pricing.serviceFee,
  weeklyDiscount: props.listing.pricing.weeklyDiscount,
  monthlyDiscount: props.listing.pricing.monthlyDiscount,
})

watch(() => props.listing.pricing, (p) => {
  editForm.value = { nightlyRate: p.nightlyRate, cleaningFee: p.cleaningFee, serviceFee: p.serviceFee, weeklyDiscount: p.weeklyDiscount, monthlyDiscount: p.monthlyDiscount }
})

function savePricing() {
  emit('update', { ...props.listing, pricing: { ...props.listing.pricing, ...editForm.value } })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Base Pricing
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="flex flex-col gap-1.5">
          <Label>Nightly Rate ($)</Label>
          <Input v-model.number="editForm.nightlyRate" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Cleaning Fee ($)</Label>
          <Input v-model.number="editForm.cleaningFee" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Service Fee ($)</Label>
          <Input v-model.number="editForm.serviceFee" type="number" />
        </div>
      </div>
    </Card>

    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Discounts
      </h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label>Weekly Discount (%)</Label>
          <Input v-model.number="editForm.weeklyDiscount" type="number" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>Monthly Discount (%)</Label>
          <Input v-model.number="editForm.monthlyDiscount" type="number" />
        </div>
      </div>
    </Card>

    <Card class="p-5">
      <h3 class="text-sm font-semibold mb-4">
        Seasonal Rates
      </h3>
      <Table v-if="listing.pricing.seasonalRates.length > 0">
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="season in listing.pricing.seasonalRates" :key="season.label">
            <TableCell class="font-medium">
              {{ season.label }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ season.startDate }} → {{ season.endDate }}
            </TableCell>
            <TableCell>${{ season.rate }}/night</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p v-else class="text-sm text-muted-foreground">
        No seasonal rates configured.
      </p>
    </Card>

    <div class="flex justify-end">
      <Button @click="savePricing">
        Save Pricing
      </Button>
    </div>
  </div>
</template>
