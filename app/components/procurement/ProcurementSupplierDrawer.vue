<script setup lang="ts">
import type { Supplier, SupplierCategory } from '@/components/procurement/data/suppliers'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { SUPPLIER_CATEGORIES } from '@/components/procurement/data/suppliers'
import { useSuppliers } from '@/composables/useSuppliers'

const props = defineProps<{
  open: boolean
  supplier?: Supplier | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addSupplier, updateSupplier } = useSuppliers()

const isOpen = computed({
  get: () => props.open,
  set: val => emit('update:open', val),
})

const isEditing = computed(() => !!props.supplier)

// Form state
const name = ref('')
const contact = ref('')
const email = ref('')
const address = ref('')
const bankName = ref('')
const accountNumber = ref('')
const accountHolder = ref('')
const category = ref<SupplierCategory | undefined>(undefined)
const notes = ref('')

function resetForm() {
  name.value = ''
  contact.value = ''
  email.value = ''
  address.value = ''
  bankName.value = ''
  accountNumber.value = ''
  accountHolder.value = ''
  category.value = undefined
  notes.value = ''
}

function populateForm(sup: Supplier) {
  name.value = sup.name
  contact.value = sup.contact
  email.value = sup.email ?? ''
  address.value = sup.address ?? ''
  bankName.value = sup.bankName ?? ''
  accountNumber.value = sup.accountNumber ?? ''
  accountHolder.value = sup.accountHolder ?? ''
  category.value = sup.category
  notes.value = sup.notes ?? ''
}

watch(() => props.open, (val) => {
  if (val) {
    if (props.supplier)
      populateForm(props.supplier)
    else resetForm()
  }
})

function handleSave() {
  if (!name.value.trim())
    return

  const payload: Omit<Supplier, 'id'> = {
    name: name.value.trim(),
    contact: contact.value.trim(),
    email: email.value.trim() || undefined,
    address: address.value.trim() || undefined,
    bankName: bankName.value.trim() || undefined,
    accountNumber: accountNumber.value.trim() || undefined,
    accountHolder: accountHolder.value.trim() || undefined,
    category: category.value,
    notes: notes.value.trim() || undefined,
  }

  if (isEditing.value && props.supplier) {
    updateSupplier(props.supplier.id, payload)
    toast.success('Supplier updated')
  }
  else {
    addSupplier(payload)
    toast.success('Supplier added')
  }
  isOpen.value = false
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ isEditing ? 'Edit Supplier' : 'Add Supplier' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update supplier details.' : 'Add a new supplier to the database.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex flex-col gap-4 px-4 py-4">
        <!-- Basic Info -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Basic Information
          </p>
          <div class="flex flex-col gap-1.5">
            <Label for="sup-name">Name <span class="text-destructive">*</span></Label>
            <Input id="sup-name" v-model="name" placeholder="e.g. Ace Hardware Bali" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Contact</Label>
              <Input v-model="contact" placeholder="Phone number" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input v-model="email" type="email" placeholder="email@example.com" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Address</Label>
            <Textarea v-model="address" placeholder="Supplier address..." rows="2" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select v-model="category">
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cat in SUPPLIER_CATEGORIES" :key="cat" :value="cat">
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <!-- Payment Details -->
        <div class="flex flex-col gap-3">
          <p class="text-sm font-medium">
            Payment Details
          </p>
          <div class="flex flex-col gap-1.5">
            <Label>Bank Name</Label>
            <Input v-model="bankName" placeholder="e.g. BCA, Mandiri, BRI" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Account Number</Label>
              <Input v-model="accountNumber" placeholder="1234567890" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Account Holder</Label>
              <Input v-model="accountHolder" placeholder="Account holder name" />
            </div>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea v-model="notes" placeholder="Internal notes about this supplier..." rows="3" />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" @click="isOpen = false">
          Cancel
        </Button>
        <Button :disabled="!name.trim()" @click="handleSave">
          {{ isEditing ? 'Save Changes' : 'Add Supplier' }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
