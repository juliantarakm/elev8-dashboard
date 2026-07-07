<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import type { PromoCode } from './data/promo-codes'
import { formatPromoDiscount, getPromoCodeStatus } from './data/promo-codes'
import { bookingWidgets } from '~/components/booking-widget/data/widgets'
import { usePromoCodes } from '~/composables/usePromoCodes'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  promoCode: PromoCode | null
}>()

const emit = defineEmits<{
  edit: [code: PromoCode]
  duplicate: [id: string]
  deleted: [id: string]
}>()

const { getUsagesByCode, deletePromoCode } = usePromoCodes()

const usages = computed(() => {
  if (!props.promoCode) return []
  return getUsagesByCode(props.promoCode.id)
})

const usagesWithLabel = computed(() => usages.value.map((link) => {
  if (link.source === 'widget') {
    const widget = bookingWidgets.value.find(w => w.id === link.sourceId)
    return { ...link, label: widget?.name ?? link.sourceId }
  }
  return { ...link, label: link.sourceId }
}))

const status = computed(() => props.promoCode ? getPromoCodeStatus(props.promoCode) : 'inactive')

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString()
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function statusVariant() {
  if (status.value === 'active') return 'default'
  if (status.value === 'expired') return 'secondary'
  return 'outline'
}

function onDelete() {
  if (!props.promoCode) return
  if (!window.confirm(`Delete code ${props.promoCode.code}? This cannot be undone.`))
    return
  deletePromoCode(props.promoCode.id)
  toast.success(`Code ${props.promoCode.code} deleted`)
  emit('deleted', props.promoCode.id)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Promo code details</DialogTitle>
        <DialogDescription>{{ promoCode?.description || 'No description' }}</DialogDescription>
      </DialogHeader>

      <div v-if="promoCode" class="space-y-4">
        <div class="rounded-lg border p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-lg font-semibold tracking-wide">{{ promoCode.code }}</span>
            <Badge :variant="statusVariant()" class="capitalize">
              {{ status }}
            </Badge>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-muted-foreground text-xs">
                Discount
              </p>
              <p class="font-medium">
                {{ formatPromoDiscount(promoCode) }}<span v-if="promoCode.discountType === 'fixed' && promoCode.currency"> {{ promoCode.currency }}</span>
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                Type
              </p>
              <p class="font-medium capitalize">
                {{ promoCode.discountType === '%' ? 'Percentage' : 'Fixed amount' }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                Valid from
              </p>
              <p class="font-medium">
                {{ formatDate(promoCode.validFrom) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                Valid until
              </p>
              <p class="font-medium">
                {{ formatDate(promoCode.validUntil) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                Redemptions
              </p>
              <p class="font-medium">
                {{ promoCode.redemptionCount }}<span v-if="promoCode.usageLimit"> / {{ promoCode.usageLimit }}</span>
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                Created
              </p>
              <p class="font-medium text-xs">
                {{ formatDateTime(promoCode.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p class="text-sm font-semibold mb-2">
            Used in
          </p>
          <div v-if="usagesWithLabel.length === 0" class="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            Not linked to any widget or site yet.
          </div>
          <ul v-else class="space-y-2">
            <li v-for="link in usagesWithLabel" :key="`${link.source}-${link.sourceId}`" class="flex items-center justify-between gap-3 rounded-md border p-3">
              <div class="flex items-center gap-2">
                <Icon :name="link.source === 'widget' ? 'lucide:code-2' : 'lucide:globe'" class="size-4 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">
                    {{ link.label }}
                  </p>
                  <p class="text-xs text-muted-foreground capitalize">
                    {{ link.source }}
                  </p>
                </div>
              </div>
              <span class="text-sm text-muted-foreground">{{ link.usageCount }} redemptions</span>
            </li>
          </ul>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="onDelete">
          <Icon name="lucide:trash-2" class="size-4 mr-1.5" />
          Delete
        </Button>
        <Button variant="outline" @click="emit('duplicate', promoCode?.id ?? '')">
          <Icon name="lucide:copy-plus" class="size-4 mr-1.5" />
          Duplicate
        </Button>
        <Button @click="emit('edit', promoCode as PromoCode)">
          <Icon name="lucide:pencil" class="size-4 mr-1.5" />
          Edit
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
