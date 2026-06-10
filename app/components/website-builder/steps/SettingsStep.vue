<script setup lang="ts">
export interface WebsiteSettings {
  name: string
  domain: string
  description: string
  brandColor: string
  fontFamily: string
  logoFile: string | null
  faviconFile: string | null
  useDefaultFavicon: boolean
}

const props = defineProps<{
  modelValue: WebsiteSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: WebsiteSettings]
  'next': []
  'back': []
}>()

const form = ref<WebsiteSettings>({ ...props.modelValue })

watch(() => props.modelValue, (val) => {
  form.value = { ...val }
}, { deep: true })

function updateField<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) {
  form.value[key] = value
  emit('update:modelValue', { ...form.value })
}

const fontOptions = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Lora', value: 'Lora' },
]

function handleLogoUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    updateField('logoFile', file.name)
  }
}

function handleFaviconUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    updateField('faviconFile', file.name)
    updateField('useDefaultFavicon', false)
  }
}

function handleDefaultFaviconToggle(checked: boolean) {
  updateField('useDefaultFavicon', checked)
  if (checked) {
    updateField('faviconFile', null)
  }
}

function removeLogo() {
  updateField('logoFile', null)
}

function removeFavicon() {
  updateField('faviconFile', null)
}

const isValid = computed(() => {
  return form.value.name.trim() !== '' && form.value.domain.trim() !== ''
})

function handleNext() {
  if (isValid.value) {
    emit('next')
  }
}

function handleBack() {
  emit('back')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h3 class="text-lg font-semibold">
        Website Settings
      </h3>
      <p class="text-sm text-muted-foreground">
        Configure your website's basic information and branding.
      </p>
    </div>

    <!-- Name + Domain -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <div class="space-y-2">
        <Label for="website-name">Website Name</Label>
        <Input
          id="website-name"
          :model-value="form.name"
          placeholder="e.g. Villa Sunset Bali"
          @update:model-value="updateField('name', $event)"
        />
      </div>

      <div class="space-y-2">
        <Label for="domain">Domain / URL</Label>
        <Input
          id="domain"
          :model-value="form.domain"
          placeholder="villa-sunset-bali.com"
          @update:model-value="updateField('domain', $event)"
        />
        <p class="text-xs text-muted-foreground">
          This will be your website URL
        </p>
      </div>
    </div>

    <!-- Description (full width) -->
    <div class="space-y-2">
      <Label for="description">Description</Label>
      <Textarea
        id="description"
        :model-value="form.description"
        placeholder="Describe your property..."
        class="min-h-[100px]"
        @update:model-value="updateField('description', $event)"
      />
    </div>

    <!-- Brand Color + Font Family -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <div class="space-y-2">
        <Label for="brand-color">Brand Color</Label>
        <div class="flex items-center gap-3">
          <div class="relative size-10 shrink-0 overflow-hidden rounded-md border">
            <input
              id="brand-color"
              type="color"
              :value="form.brandColor"
              class="absolute inset-0 size-full cursor-pointer border-0 p-0"
              @input="updateField('brandColor', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <span class="text-sm font-mono text-muted-foreground">{{ form.brandColor }}</span>
        </div>
      </div>

      <div class="space-y-2">
        <Label>Font Family</Label>
        <Select :model-value="form.fontFamily" @update:model-value="updateField('fontFamily', $event as string)">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="font in fontOptions" :key="font.value" :value="font.value">
                <span :style="{ fontFamily: font.value }">{{ font.label }}</span>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Logo + Favicon -->
    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <!-- Logo Upload -->
      <div class="space-y-2">
        <Label>Logo</Label>
        <div
          v-if="!form.logoFile"
          class="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
          @click="($refs.logoInput as HTMLInputElement).click()"
        >
          <Icon name="i-lucide-image-plus" class="size-8 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            Click to upload or drag and drop
          </p>
          <p class="text-xs text-muted-foreground">
            PNG, JPG or SVG (max. 5MB)
          </p>
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleLogoUpload"
          >
        </div>
        <div v-else class="flex items-center gap-3 rounded-lg border p-3">
          <div class="flex size-10 items-center justify-center rounded bg-muted">
            <Icon name="i-lucide-image" class="size-5 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ form.logoFile }}
            </p>
            <p class="text-xs text-muted-foreground">
              Logo uploaded
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" @click="removeLogo">
            <Icon name="i-lucide-x" class="size-4" />
          </Button>
        </div>
      </div>

      <!-- Favicon Upload -->
      <div class="space-y-2">
        <Label>Favicon</Label>
        <div
          v-if="!form.faviconFile && !form.useDefaultFavicon"
          class="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
          @click="($refs.faviconInput as HTMLInputElement).click()"
        >
          <Icon name="i-lucide-upload" class="size-8 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            Click to upload or drag and drop
          </p>
          <p class="text-xs text-muted-foreground">
            ICO, PNG (32×32 px)
          </p>
          <input
            ref="faviconInput"
            type="file"
            accept="image/*,.ico"
            class="hidden"
            @change="handleFaviconUpload"
          >
        </div>
        <div v-else-if="form.faviconFile" class="flex items-center gap-3 rounded-lg border p-3">
          <div class="flex size-10 items-center justify-center rounded bg-muted">
            <Icon name="i-lucide-globe" class="size-5 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ form.faviconFile }}
            </p>
            <p class="text-xs text-muted-foreground">
              Favicon uploaded
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" @click="removeFavicon">
            <Icon name="i-lucide-x" class="size-4" />
          </Button>
        </div>
        <div v-else class="flex items-center gap-3 rounded-lg border p-3">
          <div class="flex size-10 items-center justify-center rounded bg-muted">
            <Icon name="i-lucide-globe" class="size-5 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">
              Default
            </p>
            <p class="text-xs text-muted-foreground">
              Using dashboard default favicon
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" @click="handleDefaultFaviconToggle(false)">
            <Icon name="i-lucide-x" class="size-4" />
          </Button>
        </div>
        <div v-if="!form.faviconFile" class="flex items-center gap-2 pt-1">
          <Checkbox
            id="default-favicon"
            :checked="form.useDefaultFavicon"
            @update:checked="handleDefaultFaviconToggle"
          />
          <label for="default-favicon" class="text-sm text-muted-foreground cursor-pointer">
            Default from dashboard
          </label>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between pt-2">
      <Button variant="ghost" @click="handleBack">
        <Icon name="i-lucide-arrow-left" class="size-4 mr-2" />
        Back
      </Button>
      <Button :disabled="!isValid" @click="handleNext">
        Next
        <Icon name="i-lucide-arrow-right" class="size-4 ml-2" />
      </Button>
    </div>
  </div>
</template>
