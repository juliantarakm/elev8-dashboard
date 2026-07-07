<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { usePromoCodes } from '~/composables/usePromoCodes'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  created: [codeId: string]
}>()

const { createPromoCode, isCodeTaken } = usePromoCodes()

const code = ref('')
const description = ref('')
const discountType = ref<'%' | 'fixed'>('%')
const value = ref<number>(10)
const currency = ref<string>('USD')
const validFrom = ref('')
const validUntil = ref('')
const usageLimit = ref<number | null>(null)
const active = ref(true)

const codeError = ref('')

const currencyOptions = ['USD', 'EUR', 'GBP', 'IDR', 'CHF', 'AUD', 'JPY']

function reset() {
  code.value = ''
  description.value = ''
  discountType.value = '%'
  value.value = 10
  currency.value = 'USD'
  validFrom.value = ''
  validUntil.value = ''
  usageLimit.value = null
  active.value = true
  codeError.value = ''
}

watch(open, (isOpen) => {
  if (isOpen)
    reset()
})

function onCodeInput(event: Event) {
  const target = event.target as HTMLInputElement
  const upper = target.value.toUpperCase().replace(/\s+/g, '')
  code.value = upper
  target.value = upper
  codeError.value = ''
}

function submit() {
  const trimmed = code.value.trim()
  if (!trimmed) {
    codeError.value = 'Code is required'
    return
  }
  if (isCodeTaken(trimmed)) {
    codeError.value = 'A code with this value already exists'
    return
  }
  if (!value.value || value.value <= 0) {
    toast.error('Value must be greater than 0')
    return
  }

  const created = createPromoCode({
    code: trimmed,
    description: description.value.trim() || undefined,
    discountType: discountType.value,
    value: value.value,
    currency: discountType.value === 'fixed' ? currency.value : null,
    active: active.value,
    validFrom: validFrom.value || null,
    validUntil: validUntil.value || null,
    usageLimit: usageLimit.value,
  })

  toast.success(`Code ${created.code} created`)
  emit('created', created.id)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Create promo code</DialogTitle>
        <DialogDescription>Add a new code that can be linked to booking widgets and the website.</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label>Code</Label>
          <Input
            :model-value="code"
            placeholder="WELCOME10"
            class="font-mono uppercase"
            :class="codeError ? 'border-destructive' : ''"
            @input="onCodeInput"
          />
          <p v-if="codeError" class="text-xs text-destructive">
            {{ codeError }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Description <span class="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea v-model="description" placeholder="What is this code for?" rows="2" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Type</Label>
            <Select v-model="discountType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="%">
                  Percentage
                </SelectItem>
                <SelectItem value="fixed">
                  Fixed amount
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Value</Label>
            <div class="flex items-center gap-2">
              <span v-if="discountType === 'fixed'" class="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{{ currency }}</span>
              <span v-else class="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">%</span>
              <Input v-model.number="value" type="number" min="1" class="flex-1" />
            </div>
          </div>
        </div>

        <div v-if="discountType === 'fixed'" class="space-y-2">
          <Label>Currency</Label>
          <Select v-model="currency">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in currencyOptions" :key="c" :value="c">
                {{ c }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Valid from <span class="text-muted-foreground font-normal">(optional)</span></Label>
            <Input v-model="validFrom" type="date" />
          </div>
          <div class="space-y-2">
            <Label>Valid until <span class="text-muted-foreground font-normal">(optional)</span></Label>
            <Input v-model="validUntil" type="date" />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Usage limit <span class="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            :model-value="usageLimit === null ? '' : String(usageLimit)"
            type="number"
            min="1"
            placeholder="Unlimited"
            @input="(e: Event) => { const v = (e.target as HTMLInputElement).value; usageLimit = v === '' ? null : Number(v) }"
          />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <p class="text-sm font-medium">
              Active
            </p>
            <p class="text-xs text-muted-foreground">
              Inactive codes cannot be redeemed.
            </p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            :class="active ? 'bg-primary' : 'bg-input'"
            @click="active = !active"
          >
            <span
              class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform"
              :class="active ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button @click="submit">
          Create code
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
