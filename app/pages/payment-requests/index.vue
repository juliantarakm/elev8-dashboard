<script setup lang="ts">
import type { PaymentRequest } from '~/components/payment-request/data/payment-requests'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import PaymentRequestCreateDialog from '~/components/payment-request/PaymentRequestCreateDialog.vue'
import PaymentRequestDetailDialog from '~/components/payment-request/PaymentRequestDetailDialog.vue'
import PaymentRequestShareDialog from '~/components/payment-request/PaymentRequestShareDialog.vue'
import PaymentRequestTable from '~/components/payment-request/PaymentRequestTable.vue'
import { usePaymentRequests } from '~/composables/usePaymentRequests'

const {
  filteredRequests,
  pendingCount,
  paidCount,
  filters,
  cancelRequest,
  duplicateRequest,
} = usePaymentRequests()

const createOpen = ref(false)
const detailRequest = ref<PaymentRequest | null>(null)
const shareRequest = ref<PaymentRequest | null>(null)

function openDetail(request: PaymentRequest) {
  detailRequest.value = request
}

function copyLink(link: string) {
  navigator.clipboard.writeText(link)
  toast.success('Link copied to clipboard')
}

function handleCancel(id: string) {
  // eslint-disable-next-line no-alert
  if (window.confirm('Cancel this payment request?')) {
    cancelRequest(id)
    toast.success('Request cancelled')
  }
}

function handleDuplicate(id: string) {
  duplicateRequest(id)
  toast.success('Request duplicated')
}

function handleCreated(request: PaymentRequest) {
  shareRequest.value = request
}

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Payment Requests
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ pendingCount }} pending · {{ paidCount }} paid
        </p>
      </div>
      <Button class="gap-2" @click="createOpen = true">
        <Icon name="lucide:plus" class="size-4" />
        Create Request
      </Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-[260px] flex-1 max-w-sm">
        <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="filters.search" placeholder="Search guest or title..." class="pl-9" />
      </div>
      <Select v-model="filters.status">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button v-if="filters.search || filters.status !== 'all'" variant="ghost" @click="filters.search = ''; filters.status = 'all'">
        Clear filters
      </Button>
    </div>

    <PaymentRequestTable
      :requests="filteredRequests"
      @view="openDetail"
      @copy="copyLink"
      @cancel="handleCancel"
      @duplicate="handleDuplicate"
    />

    <PaymentRequestCreateDialog
      v-model:open="createOpen"
      @created="handleCreated"
    />

    <PaymentRequestDetailDialog
      :request="detailRequest"
      @update:open="detailRequest = null"
      @copy="copyLink"
      @cancel="handleCancel"
    />

    <PaymentRequestShareDialog
      :request="shareRequest"
      @close="shareRequest = null"
    />
  </div>
</template>
