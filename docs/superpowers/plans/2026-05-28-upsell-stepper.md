# Upsell Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2-tab Sheet layout in `UpsellDrawer.vue` with a 4-step stepper (Basic Info → Items → Listings → Settings) for both create and edit modes.

**Architecture:** All changes are isolated to `UpsellDrawer.vue`. A `currentStep` ref controls which content block is visible. A `visitedSteps` Set (stored as a ref, always reassigned for reactivity) drives step indicator state. No new files needed.

**Tech Stack:** Vue 3, Nuxt 3, shadcn-vue, Tailwind CSS v4, lucide-vue-next icons

---

## File Map

| File | Change |
|------|--------|
| `app/components/upsells/UpsellDrawer.vue` | Only file modified — remove 2-tab layout, add stepper state + indicator + step content blocks |

---

### Task 1: Add stepper refs, constants, and navigation functions to script

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (script section)

- [ ] **Step 1: Remove `activeTab` ref and add stepper refs**

Find and delete this line near the top of `<script setup>`:
```ts
const activeTab = ref<'details' | 'items'>('details')
```

Add these refs and constants in its place:
```ts
const currentStep = ref(1)
const visitedSteps = ref<Set<number>>(new Set([1]))
const nameError = ref(false)

const steps = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Items' },
  { id: 3, label: 'Listings' },
  { id: 4, label: 'Settings' },
]
```

- [ ] **Step 2: Add stepCircleClass helper and navigation functions**

Add these functions after the `steps` constant (before the `watch` block):
```ts
function stepCircleClass(stepId: number) {
  if (currentStep.value === stepId) return 'bg-primary text-primary-foreground'
  if (visitedSteps.value.has(stepId)) return 'bg-primary/20 text-primary'
  return 'bg-muted text-muted-foreground'
}

function goToStep(n: number) {
  currentStep.value = n
  const next = new Set(visitedSteps.value)
  next.add(n)
  visitedSteps.value = next
}

function nextStep() {
  if (currentStep.value === 1 && !formName.value.trim()) {
    nameError.value = true
    return
  }
  nameError.value = false
  goToStep(currentStep.value + 1)
}

function prevStep() {
  goToStep(currentStep.value - 1)
}
```

- [ ] **Step 3: Update the `watch(() => props.open)` block to reset/init stepper**

The `watch` block currently starts with:
```ts
watch(() => props.open, (open) => {
  if (open) {
    activeTab.value = 'details'
    showDeleteConfirm.value = false
    if (props.service) {
```

Replace `activeTab.value = 'details'` with stepper init. The updated watch opening:
```ts
watch(() => props.open, (open) => {
  if (open) {
    showDeleteConfirm.value = false
    if (props.service) {
      currentStep.value = 1
      visitedSteps.value = new Set([1, 2, 3, 4])
      nameError.value = false
```

In the `else` branch (create mode), add after `formStatus.value = 'active'`:
```ts
      currentStep.value = 1
      visitedSteps.value = new Set([1])
      nameError.value = false
```

- [ ] **Step 4: Update `handleSave()` to validate name + items and redirect on failure**

Replace the current `handleSave` function body:
```ts
function handleSave() {
  if (!formName.value.trim()) {
    nameError.value = true
    goToStep(1)
    toast.error('Service name is required.')
    return
  }
  if (formItems.value.length === 0) {
    toast.error('At least one item is required.')
    goToStep(2)
    return
  }

  const data = {
    name: formName.value.trim(),
    description: formDescription.value.trim(),
    category: formCategory.value,
    currency: formCurrency.value,
    image: formImage.value,
    youtubeLinks: formYoutubeLinks.value,
    internalNotes: formInternalNotes.value.trim(),
    notificationUsers: formNotificationUsers.value,
    pricingEnabled: formPricingEnabled.value,
    taxPercent: formTaxPercent.value,
    servicePercent: formServicePercent.value,
    items: formItems.value,
    assignedListings: formListings.value,
    availability: formAvailability.value,
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
```

---

### Task 2: Replace tab header with step indicator

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template — header section)

- [ ] **Step 1: Remove the Tabs block from the template**

Find and delete this entire block (lines ~282–296 in the original):
```html
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
```

- [ ] **Step 2: Add step indicator below `SheetHeader`**

Add this block immediately after `</SheetHeader>` (before `<ScrollArea>`):
```html
<div class="shrink-0 border-b px-6 pb-4 pt-3">
  <div class="flex items-center">
    <template v-for="(step, idx) in steps" :key="step.id">
      <button
        type="button"
        class="flex flex-col items-center gap-1.5 focus:outline-none"
        @click="goToStep(step.id)"
      >
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          :class="stepCircleClass(step.id)"
        >
          <Icon
            v-if="visitedSteps.has(step.id) && currentStep !== step.id"
            name="lucide:check"
            class="h-3.5 w-3.5"
          />
          <span v-else class="text-xs font-medium">{{ step.id }}</span>
        </div>
        <span
          class="text-xs transition-colors"
          :class="currentStep === step.id ? 'font-medium text-foreground' : 'text-muted-foreground'"
        >
          {{ step.label }}
        </span>
      </button>
      <div
        v-if="idx < steps.length - 1"
        class="mb-4 h-px flex-1 bg-border"
      />
    </template>
  </div>
</div>
```

---

### Task 3: Replace ScrollArea content with 4 step blocks

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template — ScrollArea content)

- [ ] **Step 1: Replace the entire ScrollArea inner content**

Delete everything between `<ScrollArea ...>` and `</ScrollArea>` (the two `v-if="activeTab === 'details'"` and `v-if="activeTab === 'items'"` divs).

Replace with the following 4 step blocks:

```html
<!-- Step 1: Basic Info -->
<div v-if="currentStep === 1" class="flex flex-col gap-5 p-6">
  <div class="flex flex-col gap-2">
    <Label>Name <span class="text-destructive">*</span></Label>
    <Input
      v-model="formName"
      placeholder="Enter the name of the upsell (e.g., In-villa SPA)"
      :class="nameError ? 'border-destructive' : ''"
      @input="nameError = false"
    />
    <p v-if="nameError" class="text-xs text-destructive">
      Service name is required.
    </p>
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

  <Separator />

  <div class="flex flex-col gap-2">
    <Label>Image</Label>
    <input
      ref="serviceImageInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleServiceImageUpload"
    >
    <div v-if="formImage" class="relative">
      <img
        :src="formImage"
        alt="Service image"
        class="h-40 w-full rounded-md border object-cover"
      >
      <Button
        variant="destructive"
        size="icon"
        class="absolute right-2 top-2 h-7 w-7"
        @click="formImage = undefined"
      >
        <Icon name="lucide:x" class="h-3.5 w-3.5" />
      </Button>
    </div>
    <Button
      v-else
      variant="outline"
      class="w-full"
      @click="serviceImageInputRef?.click()"
    >
      <Icon name="lucide:upload" class="mr-2 h-4 w-4" />
      Upload Image
    </Button>
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
</div>

<!-- Step 2: Items -->
<div v-if="currentStep === 2" class="flex flex-col gap-5 p-6">
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium">Upsell Items</p>
        <p class="text-xs text-muted-foreground">
          Drag to reorder. Click an item to edit.
        </p>
      </div>
      <Button variant="outline" size="sm" class="h-8" @click="openAddItemModal">
        <Icon name="lucide:plus" class="mr-1 h-3.5 w-3.5" />
        Add Item
      </Button>
    </div>

    <draggable
      v-model="formItems"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-40"
      animation="150"
    >
      <template #item="{ element: item }">
        <div
          class="group flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
          @click="openEditItemModal(item)"
        >
          <div class="drag-handle cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
            <Icon name="lucide:grip-vertical" class="h-4 w-4" />
          </div>
          <div v-if="item.image" class="h-10 w-10 shrink-0 overflow-hidden rounded-md border">
            <img :src="item.image" :alt="item.name" class="h-full w-full object-cover">
          </div>
          <div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
            <Icon name="lucide:image" class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ item.name }}</p>
            <p v-if="item.description" class="truncate text-xs text-muted-foreground">
              {{ item.description }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">
              {{ item.price.toLocaleString() }} {{ formCurrency }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 text-muted-foreground hover:text-destructive"
              @click.stop="removeItem(item.id)"
            >
              <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </template>
    </draggable>

    <div
      v-if="formItems.length === 0"
      class="flex flex-col items-center gap-2 rounded-md border border-dashed p-6"
    >
      <Icon name="lucide:package" class="h-8 w-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        No items yet
      </p>
      <Button variant="outline" size="sm" @click="openAddItemModal">
        <Icon name="lucide:plus" class="mr-1 h-3.5 w-3.5" />
        Add your first item
      </Button>
    </div>
  </div>
</div>

<!-- Step 3: Listings & Availability -->
<div v-if="currentStep === 3" class="flex flex-col gap-5 p-6">
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
    <div class="max-h-64 overflow-y-auto rounded-md border">
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

  <div class="flex flex-col gap-3">
    <Label>Availability</Label>
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
        :class="formAvailability === 'always' ? 'border-primary bg-primary/5' : 'border-border'"
        @click="formAvailability = 'always'"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:shopping-cart" class="h-4 w-4" />
          <span class="text-sm font-medium">Always Available</span>
        </div>
        <span class="text-xs text-muted-foreground">Guests can order anytime</span>
      </button>
      <button
        type="button"
        class="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
        :class="formAvailability === 'by_request' ? 'border-primary bg-primary/5' : 'border-border'"
        @click="formAvailability = 'by_request'"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:clock" class="h-4 w-4" />
          <span class="text-sm font-medium">By Request</span>
        </div>
        <span class="text-xs text-muted-foreground">Requires confirmation first</span>
      </button>
    </div>
  </div>
</div>

<!-- Step 4: Settings -->
<div v-if="currentStep === 4" class="flex flex-col gap-5 p-6">
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <Label>Tax and Service</Label>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">
          {{ formPricingEnabled ? 'On' : 'Off' }}
        </span>
        <Switch :model-value="formPricingEnabled" @update:model-value="formPricingEnabled = $event" />
      </div>
    </div>
    <div v-if="formPricingEnabled" class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <Label class="text-xs font-normal text-muted-foreground">Tax</Label>
        <div class="flex items-center gap-2">
          <Input v-model.number="formTaxPercent" type="number" min="0" max="100" class="flex-1" />
          <span class="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Label class="text-xs font-normal text-muted-foreground">Service</Label>
        <div class="flex items-center gap-2">
          <Input v-model.number="formServicePercent" type="number" min="0" max="100" class="flex-1" />
          <span class="text-sm text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  </div>

  <Separator />

  <div class="flex flex-col gap-2">
    <Label>Add Users to Receive WhatsApp Notification</Label>
    <div v-if="formNotificationUsers.length === 0" class="rounded-md border border-dashed p-4 text-center">
      <p class="text-sm text-muted-foreground">No users have been added yet</p>
      <p class="text-xs text-muted-foreground">Add users to receive notifications.</p>
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

  <div class="flex flex-col gap-2">
    <Label>Internal Notes</Label>
    <Textarea
      v-model="formInternalNotes"
      placeholder="Add any internal notes or instructions relevant to this upsell"
      rows="2"
    />
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
```

---

### Task 4: Update footer with Back/Next/Save navigation

**Files:**
- Modify: `app/components/upsells/UpsellDrawer.vue` (template — footer section)

- [ ] **Step 1: Replace the Cancel/Save button row in the footer**

Find this block in the footer:
```html
<div class="flex items-center gap-2">
  <Button variant="outline" class="flex-1" @click="onOpenChange(false)">
    Cancel
  </Button>
  <Button class="flex-1" @click="handleSave">
    {{ isEditing ? 'Save Changes' : 'Create Service' }}
  </Button>
</div>
```

Replace with:
```html
<div class="flex items-center gap-2">
  <Button
    v-if="currentStep > 1"
    variant="outline"
    @click="prevStep"
  >
    <Icon name="lucide:chevron-left" class="mr-1 h-4 w-4" />
    Back
  </Button>
  <Button
    v-else
    variant="outline"
    @click="onOpenChange(false)"
  >
    Cancel
  </Button>
  <Button class="flex-1" @click="currentStep < 4 ? nextStep() : handleSave()">
    <template v-if="currentStep < 4">
      Next
      <Icon name="lucide:chevron-right" class="ml-1 h-4 w-4" />
    </template>
    <template v-else>
      {{ isEditing ? 'Save Changes' : 'Create Service' }}
    </template>
  </Button>
</div>
```

- [ ] **Step 2: Commit all changes**

```bash
git add app/components/upsells/UpsellDrawer.vue
git commit -m "feat(upsells): replace 2-tab drawer with 4-step stepper"
```

---

### Task 5: Verify in browser

**Files:** (no changes — manual verification only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:3000/upsells`

- [ ] **Step 2: Verify create flow**

1. Click "Add Service" — Sheet opens on **Step 1** (Basic Info). Step 1 circle is `primary` color, steps 2–4 are muted.
2. Click Next with empty Name → inline error appears under Name field. Does not advance.
3. Fill Name, click Next → advances to **Step 2** (Items). Step 1 shows checkmark.
4. Click directly on Step 3 circle → jumps to Listings without requiring items.
5. Jump back to Step 1 → Name still filled.
6. Navigate to Step 4 → click Save with no items → toast "At least one item is required." redirects to Step 2.
7. Add an item on Step 2 → go to Step 4 → click Save → "Service created." toast, drawer closes.

- [ ] **Step 3: Verify edit flow**

1. Click an existing service row → Sheet opens on **Step 1**. All 4 step circles show checkmarks (visited). All fields pre-filled.
2. Edit the name, jump to Step 4, click "Save Changes" → "Service updated." toast, drawer closes, table reflects update.

- [ ] **Step 4: Verify Item modal still works**

On Step 2, click "Add Item" → Dialog opens. Fill name + price, click "Add Item" → item appears in draggable list. Drag to reorder. Click item → edit modal opens pre-filled. Save changes. Delete item via trash icon.
