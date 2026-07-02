<script setup lang="ts">
import type { HostLanguage, ToneMode } from '~/components/airbnb-reviews/data/reviews'
import { toast } from 'vue-sonner'
import { hostLanguageOptions, toneModeOptions } from '~/components/airbnb-reviews/data/reviews'

const { config, updateConfig } = useAirbnbReviews()

function handleToggle(enabled: boolean) {
  updateConfig({ enabled })
  toast.success(enabled ? 'Review automation enabled.' : 'Review automation disabled.')
}

function handleAutoPost(enabled: boolean) {
  updateConfig({ auto_post: enabled })
  toast.success(enabled ? 'Reviews will be auto-posted to Airbnb.' : 'Reviews will be saved as drafts for approval.')
}

function handleLanguageUpdate(value: string | number | null | undefined) {
  if (value) {
    updateConfig({ host_language: value as HostLanguage })
    toast.success('Review language updated.')
  }
}

function handleToneUpdate(mode: ToneMode) {
  updateConfig({ tone_mode: mode })
  toast.success('Review tone updated.')
}

function handleDelayUpdate(val: string | number | null | undefined) {
  const num = Number(val)
  if (!Number.isNaN(num) && num >= 1 && num <= 168) {
    updateConfig({ review_delay_hours: num })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h3 class="text-lg font-medium">
        Airbnb Review Automation
      </h3>
      <p class="text-sm text-muted-foreground">
        Automatically generate and post guest reviews after checkout.
      </p>
    </div>

    <!-- Enable toggle -->
    <div class="flex items-center justify-between rounded-lg border bg-card p-4">
      <div class="space-y-1">
        <Label class="text-sm font-medium">Enable Review Automation</Label>
        <p class="text-xs text-muted-foreground">
          Automatically generate and post guest reviews after checkout.
        </p>
      </div>
      <Switch :checked="config.enabled" @update:checked="handleToggle" />
    </div>

    <template v-if="config.enabled">
      <Separator />

      <!-- Host Language -->
      <div class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Review Language</Label>
          <p class="text-xs text-muted-foreground">
            Language for all generated reviews.
          </p>
        </div>
        <Select :model-value="config.host_language" @update:model-value="handleLanguageUpdate">
          <SelectTrigger class="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="lang in hostLanguageOptions" :key="lang.value" :value="lang.value">
              {{ lang.flag }} {{ lang.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <!-- Tone Mode -->
      <div class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Review Tone</Label>
          <p class="text-xs text-muted-foreground">
            How should AI handle negative situations?
          </p>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            v-for="option in toneModeOptions"
            :key="option.value"
            type="button"
            class="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors"
            :class="config.tone_mode === option.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'"
            @click="handleToneUpdate(option.value)"
          >
            <div class="flex items-center gap-2">
              <Icon :name="option.icon" class="size-4" />
              <span class="text-sm font-medium">{{ option.label }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ option.description }}
            </p>
          </button>
        </div>
      </div>

      <Separator />

      <!-- Auto-Post Toggle -->
      <div class="flex items-center justify-between rounded-lg border bg-card p-4">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Auto-Post to Airbnb</Label>
          <p class="text-xs text-muted-foreground">
            {{ config.auto_post ? 'Reviews are published immediately after generation.' : 'Reviews are saved as drafts for your approval.' }}
          </p>
        </div>
        <Switch :checked="config.auto_post" @update:checked="handleAutoPost" />
      </div>

      <Separator />

      <!-- Review Delay -->
      <div class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Review Delay</Label>
          <p class="text-xs text-muted-foreground">
            Hours after checkout before generating the review. Allows time for housekeeping feedback.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NumberField
            :model-value="config.review_delay_hours"
            :min="1"
            :max="168"
            class="w-[140px]"
            @update:model-value="handleDelayUpdate"
          >
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
          <span class="text-sm text-muted-foreground">hours</span>
        </div>
      </div>
    </template>
  </div>
</template>
