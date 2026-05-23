<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useUpsellServices } from '@/composables/useUpsellServices'
import { BALI_LISTINGS, UPSPELL_CATEGORIES } from '@/components/upsells/data/upsell-services'
import type { UpsellCategory, UpsellItem, UpsellService } from '@/components/upsells/data/upsell-services'

const props = defineProps<{
  service: UpsellService | null
  initialCategory: UpsellCategory | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addService, updateService, deleteService } = useUpsellServices()

const isEditing = computed(() => props.service !== null)
const activeTab = ref<'details' | 'items'>('details')

const formName = ref('')
const formDescription = ref('')
const formCategory = ref<UpsellService['category']>('Airport Transport')
const formCurrency = ref('CHF')
const formImage = ref('')
const formYoutubeLinks = ref<string[]>([])
const formNewYoutubeLink = ref('')
const formInternalNotes = ref('')
const formNotificationUsers = ref<string[]>([])
const formNewNotificationUser = ref('')
const formTaxPercent = ref(0)
const formServicePercent = ref(0)
const formItems = ref<UpsellItem[]>([])
const formListings = ref<string[]>([])
const formStatus = ref<'active' | 'inactive'>('active')
const showDeleteConfirm = ref(false)

watch(() => props.open, (open) => {
  if (open) {
    activeTab.value = 'details'
    showDeleteConfirm.value = false
    if (props.service) {
      formName.value = props.service.name
      formDescription.value = props.service.description
      formCategory.value = props.service.category
      formCurrency.value = props.service.currency
      formImage.value = props.service.image ?? ''
      formYoutubeLinks.value = [...props.service.youtubeLinks]
      formInternalNotes.value = props.service.internalNotes
      formNotificationUsers.value = [...props.service.notificationUsers]
      formTaxPercent.value = props.service.taxPercent
      formServicePercent.value = props.service.servicePercent
      formItems.value = props.service.items.map(i => ({ ...i }))
      formListings.value = [...props.service.assignedListings]
      formStatus.value = props.service.status
    }
    else {
      formName.value = ''
      formDescription.value = ''
      formCategory.value = props.initialCategory ?? 'Airport Transport'
      formCurrency.value = 'CHF'
      formImage.value = ''
      formYoutubeLinks.value = []
      formNewYoutubeLink.value = ''
      formInternalNotes.value = ''
      formNotificationUsers.value = []
      formNewNotificationUser.value = ''
      formTaxPercent.value = 0
      formServicePercent.value = 0
      formItems.value = [{ id: `itm-${Date.now()}`, name: '', price: 0 }]
      formListings.value = []
      formStatus.value = 'active'
    }
  }
})

function addYoutubeLink() {
  const link = formNewYoutubeLink.value.trim()
  if (link) {
    formYoutubeLinks.value = [...formYoutubeLinks.value, link]
    formNewYoutubeLink.value = ''
  }
}

function removeYoutubeLink(idx: number) {
  formYoutubeLinks.value = formYoutubeLinks.value.filter((_, i) => i !== idx)
}

function addNotificationUser() {
  const user = formNewNotificationUser.value.trim()
  if (user) {
    formNotificationUsers.value = [...formNotificationUsers.value, user]
    formNewNotificationUser.value = ''
  }
}

function removeNotificationUser(idx: number) {
  formNotificationUsers.value = formNotificationUsers.value.filter((_, i) => i !== idx)
}

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
    youtubeLinks: formYoutubeLinks.value,
    internalNotes: formInternalNotes.value.trim(),
    notificationUsers: formNotificationUsers.value,
    taxPercent: formTaxPercent.value,
    servicePercent: formServicePercent.value,
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
    <SheetContent class="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg" side="right">
      <SheetHeader class="shrink-0 border-b px-6 py-4">
        <SheetTitle>{{ isEditing ? 'Edit Service' : `Add ${formCategory} Service` }}</SheetTitle>
        <SheetDescription>
          {{ isEditing ? 'Update the upsell service details.' : 'Create a new upsell service to offer to guests.' }}
        </SheetDescription>
      </SheetHeader>

      <div class="shrink-0 border-b px-6 pt-3">
        <Tabs v-model="activeTab">
          <TabsList class="w-full">
            <TabsTrigger value="details" class="flex-1">
              Details
            </TabsTrigger>
            <TabsTrigger value="items" class="flex-1">
              Items
              <Badge v-if="formItems.length > 0" variant="secondary" class="ml-2">
                {{ formItems.length }}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea class="min-h-0 flex-1 overflow-y-auto">
        <!-- Tab 1: Details -->
        <div v-if="activeTab === 'details'" class="flex flex-col gap-5 p-6">
          <div class="flex flex-col gap-2">
            <Label>Name <span class="text-destructive">*</span></Label>
            <Input v-model="formName" placeholder="Enter the name of the upsell (e.g., In-villa SPA)" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea v-model="formDescription" placeholder="Describe the service..." rows="3" />
            <div class="flex flex-wrap gap-1.5">
              <span class="text-xs text-muted-foreground">Variable Replacement</span>
              <code class="rounded bg-muted px-1.5 py-0.5 text-xs">&lt;guest_first_name&gt;</code>
              <code class="rounded bg-muted px-1.5 py-0.5 text-xs">&lt;guest_last_name&gt;</code>
              <code class="rounded bg-muted px-1.5 py-0.5 text-xs">&lt;listing_name&gt;</code>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <Label>Category</Label>
              <template v-if="isEditing">
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
              </template>
              <template v-else>
                <div class="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {{ formCategory }}
                </div>
              </template>
            </div>

            <div class="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select v-model="formCurrency">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">
                    CHF
                  </SelectItem>
                  <SelectItem value="IDR">
                    IDR
                  </SelectItem>
                  <SelectItem value="USD">
                    USD
                  </SelectItem>
                  <SelectItem value="EUR">
                    EUR
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-2">
            <Label>YouTube Links</Label>
            <div class="flex flex-col gap-2">
              <div
                v-for="(link, idx) in formYoutubeLinks"
                :key="idx"
                class="flex items-center gap-2"
              >
                <Input :model-value="link" class="flex-1" disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  @click="removeYoutubeLink(idx)"
                >
                  <Icon name="lucide:x" class="h-4 w-4" />
                </Button>
              </div>
              <div class="flex items-center gap-2">
                <Input
                  v-model="formNewYoutubeLink"
                  placeholder="Paste a YouTube link (optional)"
                  class="flex-1"
                  @keydown.enter.prevent="addYoutubeLink"
                />
                <Button variant="outline" size="sm" class="h-9" @click="addYoutubeLink">
                  <Icon name="lucide:plus" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <Label>Internal Notes</Label>
            <Textarea
              v-model="formInternalNotes"
              placeholder="Add any internal notes or instructions relevant to this upsell"
              rows="2"
            />
          </div>

          <Separator />

          <div class="flex flex-col gap-2">
            <Label>Add Users to Receive WhatsApp Notification</Label>
            <div v-if="formNotificationUsers.length === 0" class="rounded-md border border-dashed p-4 text-center">
              <p class="text-sm text-muted-foreground">
                No users have been added yet
              </p>
              <p class="text-xs text-muted-foreground">
                Add users to receive notifications.
              </p>
            </div>
            <div v-else class="flex flex-col gap-1.5">
              <div
                v-for="(user, idx) in formNotificationUsers"
                :key="idx"
                class="flex items-center justify-between rounded-md border px-3 py-1.5"
              >
                <div class="flex items-center gap-2">
                  <Icon name="lucide:user" class="h-3.5 w-3.5 text-muted-foreground" />
                  <span class="text-sm">{{ user }}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 text-muted-foreground hover:text-destructive"
                  @click="removeNotificationUser(idx)"
                >
                  <Icon name="lucide:x" class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Input
                v-model="formNewNotificationUser"
                placeholder="User name"
                class="flex-1"
                @keydown.enter.prevent="addNotificationUser"
              />
              <Button variant="outline" size="sm" class="h-9" @click="addNotificationUser">
                <Icon name="lucide:plus" class="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-3">
            <Label>Tax and Service</Label>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <Label class="text-muted-foreground text-xs font-normal">Tax</Label>
                <div class="flex items-center gap-2">
                  <Input v-model.number="formTaxPercent" type="number" min="0" max="100" class="flex-1" />
                  <span class="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <Label class="text-muted-foreground text-xs font-normal">Service</Label>
                <div class="flex items-center gap-2">
                  <Input v-model.number="formServicePercent" type="number" min="0" max="100" class="flex-1" />
                  <span class="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
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

        <!-- Tab 2: Items -->
        <div v-if="activeTab === 'items'" class="flex flex-col gap-5 p-6">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">Upsell Items</p>
                <p class="text-xs text-muted-foreground">
                  Define the options guests can choose from within this service.
                </p>
              </div>
              <Button variant="outline" size="sm" class="h-8" @click="addItem">
                <Icon name="lucide:plus" class="mr-1 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="(item, idx) in formItems"
                :key="item.id"
                class="rounded-md border p-3"
              >
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-medium text-muted-foreground">Item {{ idx + 1 }}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 text-muted-foreground hover:text-destructive"
                    :disabled="formItems.length <= 1"
                    @click="removeItem(item.id)"
                  >
                    <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div class="flex flex-col gap-2">
                  <Input
                    :model-value="item.name"
                    placeholder="Item name (e.g., Scooter, Toyota Avanza)"
                    @update:model-value="updateItemName(item.id, String($event))"
                  />
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-muted-foreground whitespace-nowrap">Price</span>
                    <Input
                      :model-value="item.price"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="flex-1"
                      @update:model-value="updateItemPrice(item.id, Number($event))"
                    />
                    <span class="text-xs text-muted-foreground">{{ formCurrency }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="formItems.length === 0"
              class="flex flex-col items-center gap-2 rounded-md border border-dashed p-6"
            >
              <Icon name="lucide:package" class="h-8 w-8 text-muted-foreground" />
              <p class="text-sm text-muted-foreground">
                No items yet
              </p>
              <Button variant="outline" size="sm" @click="addItem">
                <Icon name="lucide:plus" class="mr-1 h-3.5 w-3.5" />
                Add your first item
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t shrink-0 px-6 py-4">
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
