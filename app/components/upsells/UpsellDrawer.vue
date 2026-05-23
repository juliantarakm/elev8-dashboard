<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellServices } from '@/composables/useUpsellServices'
import { BALI_LISTINGS, UPSPELL_CATEGORIES } from '@/components/upsells/data/upsell-services'
import type { UpsellItem, UpsellService } from '@/components/upsells/data/upsell-services'

const props = defineProps<{
  service: UpsellService | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addService, updateService, deleteService } = useUpsellServices()

const isEditing = computed(() => props.service !== null)

const formName = ref('')
const formDescription = ref('')
const formCategory = ref<UpsellService['category']>('Airport Transport')
const formCurrency = ref('IDR')
const formImage = ref('')
const formItems = ref<UpsellItem[]>([])
const formListings = ref<string[]>([])
const formStatus = ref<'active' | 'inactive'>('active')
const showDeleteConfirm = ref(false)

watch(() => props.open, (open) => {
  if (open) {
    showDeleteConfirm.value = false
    if (props.service) {
      formName.value = props.service.name
      formDescription.value = props.service.description
      formCategory.value = props.service.category
      formCurrency.value = props.service.currency
      formImage.value = props.service.image ?? ''
      formItems.value = props.service.items.map(i => ({ ...i }))
      formListings.value = [...props.service.assignedListings]
      formStatus.value = props.service.status
    }
    else {
      formName.value = ''
      formDescription.value = ''
      formCategory.value = 'Airport Transport'
      formCurrency.value = 'IDR'
      formImage.value = ''
      formItems.value = [{ id: `itm-${Date.now()}`, name: '', price: 0 }]
      formListings.value = []
      formStatus.value = 'active'
    }
  }
})

function toggleListing(listing: string) {
  if (formListings.value.includes(listing)) {
    formListings.value = formListings.value.filter(l => l !== listing)
  }
  else {
    formListings.value = [...formListings.value, listing]
  }
}

function selectAllListings() {
  formListings.value = [...BALI_LISTINGS]
}

function clearAllListings() {
  formListings.value = []
}

function addItem() {
  formItems.value = [...formItems.value, { id: `itm-${Date.now()}`, name: '', price: 0 }]
}

function removeItem(id: string) {
  formItems.value = formItems.value.filter(i => i.id !== id)
}

function updateItemName(id: string, name: string) {
  formItems.value = formItems.value.map(i => i.id === id ? { ...i, name } : i)
}

function updateItemPrice(id: string, price: number) {
  formItems.value = formItems.value.map(i => i.id === id ? { ...i, price } : i)
}

function handleSave() {
  if (!formName.value.trim()) {
    toast.error('Service name is required.')
    return
  }
  const validItems = formItems.value.filter(i => i.name.trim() && i.price > 0)
  if (validItems.length === 0) {
    toast.error('At least one item with name and price is required.')
    return
  }

  const data = {
    name: formName.value.trim(),
    description: formDescription.value.trim(),
    category: formCategory.value,
    currency: formCurrency.value,
    image: formImage.value.trim() || undefined,
    items: validItems,
    assignedListings: formListings.value,
    status: formStatus.value,
  }

  if (isEditing.value && props.service) {
    updateService(props.service.id, data)
    toast.success('Service updated.')
  }
  else {
    addService(data)
    toast.success('Service created.')
  }
  emit('update:open', false)
}

function handleDelete() {
  if (props.service) {
    deleteService(props.service.id)
    toast.success('Service deleted.')
    emit('update:open', false)
  }
}

function onOpenChange(val: boolean) {
  emit('update:open', val)
}
</script>

<template>
  <Sheet :open="props.open" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 p-0 sm:max-w-lg" side="right">
      <SheetHeader class="border-b px-6 py-4">
        <SheetTitle>{{ isEditing ? 'Edit Service' : 'Add Service' }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update the upsell service details.' : 'Create a new upsell service to offer to guests.' }}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1">
        <div class="flex flex-col gap-5 p-6">
          <div class="flex flex-col gap-2">
            <Label>Name</Label>
            <Input v-model="formName" placeholder="e.g. Airport Transfer (Ngurah Rai)" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea v-model="formDescription" placeholder="Describe the service..." rows="3" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <Label>Category</Label>
              <Select v-model="formCategory">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in UPSPELL_CATEGORIES" :key="cat" :value="cat">
                    {{ cat }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select v-model="formCurrency">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">
                    IDR
                  </SelectItem>
                  <SelectItem value="USD">
                    USD
                  </SelectItem>
                  <SelectItem value="EUR">
                    EUR
                  </SelectItem>
                  <SelectItem value="CHF">
                    CHF
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <Label>Items</Label>
              <Button variant="outline" size="sm" class="h-7" @click="addItem">
                <Icon name="lucide:plus" class="mr-1 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="(item, idx) in formItems"
                :key="item.id"
                class="flex items-center gap-2"
              >
                <span class="w-5 text-xs text-muted-foreground">{{ idx + 1 }}</span>
                <Input
                  :model-value="item.name"
                  placeholder="Item name"
                  class="flex-1"
                  @update:model-value="updateItemName(item.id, String($event))"
                />
                <Input
                  :model-value="item.price"
                  type="number"
                  min="0"
                  placeholder="Price"
                  class="w-32"
                  @update:model-value="updateItemPrice(item.id, Number($event))"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  :disabled="formItems.length <= 1"
                  @click="removeItem(item.id)"
                >
                  <Icon name="lucide:x" class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formItems.length }} {{ formItems.length === 1 ? 'item' : 'items' }}
            </p>
          </div>

          <Separator />

          <div class="flex flex-col gap-2">
            <Label>Image URL</Label>
            <div class="flex items-center gap-3">
              <Input v-model="formImage" placeholder="https://..." class="flex-1" />
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon name="lucide:image-plus" class="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <Label>Assigned Listings</Label>
              <div class="flex gap-2">
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="selectAllListings">
                  Select all
                </Button>
                <Button variant="ghost" size="sm" class="h-7 text-xs" @click="clearAllListings">
                  Clear
                </Button>
              </div>
            </div>
            <div class="max-h-48 overflow-y-auto rounded-md border">
              <label
                v-for="listing in BALI_LISTINGS"
                :key="listing"
                class="flex cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
              >
                <Checkbox
                  :checked="formListings.includes(listing)"
                  @update:checked="toggleListing(listing)"
                />
                <span class="text-sm">{{ listing }}</span>
              </label>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formListings.length }} of {{ BALI_LISTINGS.length }} listings selected
            </p>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <Label>Status</Label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">
                {{ formStatus === 'active' ? 'Active' : 'Inactive' }}
              </span>
              <Switch
                :checked="formStatus === 'active'"
                @update:checked="formStatus = $event ? 'active' : 'inactive'"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t px-6 py-4">
        <div class="flex items-center gap-2">
          <Button variant="outline" class="flex-1" @click="onOpenChange(false)">
            Cancel
          </Button>
          <Button class="flex-1" @click="handleSave">
            {{ isEditing ? 'Save Changes' : 'Create Service' }}
          </Button>
        </div>
        <div v-if="isEditing" class="mt-3">
          <AlertDialog v-model:open="showDeleteConfirm">
            <AlertDialogTrigger as-child>
              <Button variant="destructive" class="w-full" size="sm">
                <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                Delete Service
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this service?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{{ props.service?.name }}" from your catalog. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="handleDelete">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
