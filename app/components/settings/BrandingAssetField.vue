<script setup lang="ts">
import type { BrandingAsset, BrandingAssetKind } from '~/components/settings/data/branding'
import { computed, ref, watch } from 'vue'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  BRANDING_ASSET_RULES,
  fileToBrandingAsset,
  formatBrandingFileSize,
} from '~/lib/branding-assets'

const props = defineProps<{
  kind: BrandingAssetKind
  label: string
  description: string
  modelValue: BrandingAsset | null
  fallbackLabel?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: BrandingAsset | null]
  'validationChange': [hasError: boolean]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')
const aspectWarning = ref('')
const isReading = ref(false)
const rule = computed(() => BRANDING_ASSET_RULES[props.kind])

watch(() => props.modelValue, (value) => {
  if (value)
    return
  errorMessage.value = ''
  aspectWarning.value = ''
})

function openPicker() {
  inputRef.value?.click()
}

function handlePreviewLoad(event: Event) {
  const image = event.target as HTMLImageElement
  const ratio = image.naturalWidth / Math.max(1, image.naturalHeight)
  if (props.kind === 'favicon') {
    aspectWarning.value = Math.abs(ratio - 1) > 0.05
      ? 'A square image works best for browser tabs.'
      : ''
    return
  }
  aspectWarning.value = ratio < 2 || ratio > 6
    ? 'A wide logo works best here (approximately 400 × 120 px).'
    : ''
}

function removeAsset() {
  aspectWarning.value = ''
  errorMessage.value = ''
  emit('validationChange', false)
  emit('update:modelValue', null)
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file)
    return

  isReading.value = true
  errorMessage.value = ''
  try {
    const asset = await fileToBrandingAsset(file, props.kind)
    emit('validationChange', false)
    emit('update:modelValue', asset)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'The selected image could not be read.'
    emit('validationChange', true)
  }
  finally {
    isReading.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <input
      ref="inputRef"
      data-testid="branding-asset-input"
      type="file"
      :accept="rule.accept"
      :aria-label="`Upload ${label.toLowerCase()}`"
      class="hidden"
      @change="handleFileChange"
    >

    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium">
            {{ label }}
          </p>
          <Badge v-if="!modelValue && fallbackLabel" variant="secondary">
            {{ fallbackLabel }}
          </Badge>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" :disabled="isReading" @click="openPicker">
          <Icon :name="isReading ? 'lucide:loader-2' : 'lucide:upload'" class="mr-2 size-4" :class="[isReading && 'animate-spin']" />
          {{ modelValue ? 'Replace' : 'Upload' }}
        </Button>
        <Button
          v-if="modelValue"
          data-testid="remove-branding-asset"
          type="button"
          variant="ghost"
          size="icon"
          :aria-label="`Remove ${label.toLowerCase()}`"
          @click="removeAsset"
        >
          <Icon name="lucide:trash-2" class="size-4" />
        </Button>
      </div>
    </div>

    <div v-if="modelValue" class="mt-4 flex items-center gap-3 rounded-md border bg-muted/30 p-3">
      <div class="flex size-16 shrink-0 items-center justify-center rounded-md border bg-background p-2">
        <img :src="modelValue.dataUrl" :alt="`${label} preview`" class="max-h-full max-w-full object-contain" @load="handlePreviewLoad">
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">
          {{ modelValue.name }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatBrandingFileSize(modelValue.size) }}
        </p>
      </div>
    </div>

    <p v-if="aspectWarning" role="status" class="mt-2 text-sm text-muted-foreground">
      {{ aspectWarning }}
    </p>
    <p v-if="errorMessage" role="alert" class="mt-2 text-sm text-destructive">
      {{ errorMessage }}
    </p>
  </div>
</template>
