<script setup lang="ts">
import type { HostLanguage, ToneMode } from '~/components/airbnb-reviews/data/reviews'
import { toast } from 'vue-sonner'
import { hostLanguageOptions, toneModeOptions } from '~/components/airbnb-reviews/data/reviews'

const { config, updateConfig } = useAirbnbReviews()

function handleToggle(enabled: boolean) {
  updateConfig({ enabled })
  toast.success(enabled ? 'Review automation enabled.' : 'Review automation disabled.')
}

function handleChannelToggle(channel: 'airbnb' | 'booking_com', enabled: boolean) {
  updateConfig({ auto_post_channels: { ...config.value.auto_post_channels, [channel]: enabled } })
  const labels = { airbnb: 'Airbnb', booking_com: 'Booking.com' }
  toast.success(enabled
    ? `Reviews will be auto-posted to ${labels[channel]}.`
    : `Reviews for ${labels[channel]} will be saved as drafts.`)
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

function handleAutoPostDelayUpdate(val: string | number | null | undefined) {
  const num = Number(val)
  if (!Number.isNaN(num) && num >= 0 && num <= 13) {
    updateConfig({ auto_post_delay_days: num })
    toast.success('Auto-post delay updated.')
  }
}

function isAnyAutoPostEnabled() {
  return config.value.auto_post_channels.airbnb || config.value.auto_post_channels.booking_com
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h3 class="text-lg font-medium">
        Review Hub Settings
      </h3>
      <p class="text-sm text-muted-foreground">
        Configure AI-powered guest review automation and reply settings.
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
      <button
        type="button"
        role="switch"
        :aria-checked="config.enabled"
        class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
        :class="config.enabled ? 'bg-primary' : 'bg-input'"
        @click="handleToggle(!config.enabled)"
      >
        <span
          class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
          :class="config.enabled ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
        />
      </button>
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

      <!-- Auto-Post Channels -->
      <div class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Auto-Post Channels</Label>
          <p class="text-xs text-muted-foreground">
            Choose which channels ElevAI should auto-post to. Off channels are saved as drafts.
          </p>
        </div>

        <!-- Airbnb -->
        <div class="flex items-center justify-between rounded-lg border bg-card p-4">
          <div class="flex items-center gap-3">
            <Icon name="logos:airbnb" class="size-5" />
            <div class="space-y-0.5">
              <p class="text-sm font-medium">
                Airbnb
              </p>
              <p class="text-xs text-muted-foreground">
                14-day review window after checkout
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="config.auto_post_channels.airbnb"
            class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            :class="config.auto_post_channels.airbnb ? 'bg-primary' : 'bg-input'"
            @click="handleChannelToggle('airbnb', !config.auto_post_channels.airbnb)"
          >
            <span
              class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
              :class="config.auto_post_channels.airbnb ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Booking.com -->
        <div class="flex items-center justify-between rounded-lg border bg-card p-4">
          <div class="flex items-center gap-3">
            <Icon name="simple-icons:bookingdotcom" class="size-5" />
            <div class="space-y-0.5">
              <p class="text-sm font-medium">
                Booking.com
              </p>
              <p class="text-xs text-muted-foreground">
                365-day review window after checkout
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="config.auto_post_channels.booking_com"
            class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            :class="config.auto_post_channels.booking_com ? 'bg-primary' : 'bg-input'"
            @click="handleChannelToggle('booking_com', !config.auto_post_channels.booking_com)"
          >
            <span
              class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
              :class="config.auto_post_channels.booking_com ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <div v-if="isAnyAutoPostEnabled()" class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Auto-Post Delay</Label>
          <p class="text-xs text-muted-foreground">
            Days to wait after review generation before posting automatically. Use 0 to post immediately. Keep ≤ 13 to leave a 1-day buffer for Airbnb's 14-day window.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NumberField
            :model-value="config.auto_post_delay_days"
            :min="0"
            :max="13"
            class="w-[140px]"
            @update:model-value="handleAutoPostDelayUpdate"
          >
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
          <span class="text-sm text-muted-foreground">days</span>
        </div>
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
