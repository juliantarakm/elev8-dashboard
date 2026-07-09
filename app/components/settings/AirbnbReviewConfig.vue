<script setup lang="ts">
import type { HostLanguage, ToneMode } from '~/components/airbnb-reviews/data/reviews'
import { toast } from 'vue-sonner'
import { hostLanguageOptions, toneModeOptions } from '~/components/airbnb-reviews/data/reviews'

const { config, updateConfig } = useAirbnbReviews()

function handleToggle(enabled: boolean) {
  updateConfig({ enabled })
  toast.success(enabled ? 'Review automation enabled.' : 'Review automation disabled.')
}

function handleLanguageUpdate(value: any) {
  if (value) {
    updateConfig({ host_language: value as HostLanguage })
    toast.success('Review language updated.')
  }
}

function handleToneUpdate(value: any) {
  updateConfig({ tone_mode: value as ToneMode })
  toast.success('Review tone updated.')
}

function handleHostReviewAutoPost(enabled: boolean) {
  updateConfig({ auto_post_host_review: enabled })
  toast.success(enabled ? 'Host reviews will be auto-posted to Airbnb.' : 'Host reviews will be saved as draft.')
}

function handleAutoSelectTags(enabled: boolean) {
  updateConfig({ auto_select_tags: enabled })
  toast.success(enabled ? 'Tags will be auto-selected from SOR.' : 'Tags selection is manual.')
}

function handleReplyChannelToggle(channel: 'airbnb' | 'booking_com', enabled: boolean) {
  updateConfig({ auto_post_replies: { ...config.value.auto_post_replies, [channel]: enabled } })
  const labels = { airbnb: 'Airbnb', booking_com: 'Booking.com' }
  toast.success(enabled
    ? `Replies to ${labels[channel]} reviews will be auto-posted.`
    : `Replies to ${labels[channel]} will be saved as drafts.`)
}

function handleDelayUpdate(value: any) {
  const num = Number(value)
  if (!Number.isNaN(num) && num >= 1 && num <= 168) {
    updateConfig({ review_delay_hours: num })
  }
}

function handleHostReviewDelayUpdate(value: any) {
  const num = Number(value)
  if (!Number.isNaN(num) && num >= 1 && num <= 13) {
    updateConfig({ host_review_delay_days: num })
    toast.success('Host review delay updated.')
  }
}

function handleReplyDelayUpdate(value: any) {
  const num = Number(value)
  if (!Number.isNaN(num) && num >= 0 && num <= 30) {
    updateConfig({ reply_delay_days: num })
    toast.success('Reply delay updated.')
  }
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
          Automatically generate and post host reviews and guest replies.
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
            Language for all generated reviews and replies.
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

      <!-- ================================================================ -->
      <!-- Section A: Host Review of Guest (Airbnb only) -->
      <!-- ================================================================ -->
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Icon name="lucide:user-check" class="size-4 text-primary" />
          <h4 class="text-base font-medium">Host Review of Guest</h4>
        </div>
        <p class="text-xs text-muted-foreground">
          Review the guest based on SOR data. Airbnb-only — 14-day window after checkout.
        </p>
      </div>

      <!-- Auto-Post Host Review toggle -->
      <div class="flex items-center justify-between rounded-lg border bg-card p-4">
        <div class="flex items-center gap-3">
          <Icon name="logos:airbnb" class="size-5" />
          <div class="space-y-0.5">
            <p class="text-sm font-medium">
              Auto-Post to Airbnb
            </p>
            <p class="text-xs text-muted-foreground">
              Auto-generate and submit host reviews. Off = save as draft.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="config.auto_post_host_review"
          class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          :class="config.auto_post_host_review ? 'bg-primary' : 'bg-input'"
          @click="handleHostReviewAutoPost(!config.auto_post_host_review)"
        >
          <span
            class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
            :class="config.auto_post_host_review ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- Host Review delay -->
      <div v-if="config.auto_post_host_review" class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Submission Delay</Label>
          <p class="text-xs text-muted-foreground">
            Days after checkout before auto-submitting the host review. Keep ≤ 13 to stay within Airbnb's 14-day window.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NumberField
            :model-value="config.host_review_delay_days"
            :min="1"
            :max="13"
            class="w-[140px]"
            @update:model-value="handleHostReviewDelayUpdate"
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

      <!-- Auto-select tags -->
      <div class="flex items-center justify-between rounded-lg border bg-card p-4">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Auto-Select Tags</Label>
          <p class="text-xs text-muted-foreground">
            Auto-populate host review tags from SOR signals. Tags can still be edited manually.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="config.auto_select_tags"
          class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          :class="config.auto_select_tags ? 'bg-primary' : 'bg-input'"
          @click="handleAutoSelectTags(!config.auto_select_tags)"
        >
          <span
            class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
            :class="config.auto_select_tags ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
          />
        </button>
      </div>

      <Separator />

      <!-- ================================================================ -->
      <!-- Section B: Reply to Guest Review -->
      <!-- ================================================================ -->
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Icon name="lucide:message-circle" class="size-4 text-primary" />
          <h4 class="text-base font-medium">Reply to Guest Review</h4>
        </div>
        <p class="text-xs text-muted-foreground">
          Auto-generate and post public replies to guest reviews. Airbnb: 30d window. Booking.com: 30d window.
        </p>
      </div>

      <!-- Airbnb reply -->
      <div class="flex items-center justify-between rounded-lg border bg-card p-4">
        <div class="flex items-center gap-3">
          <Icon name="logos:airbnb" class="size-5" />
          <div class="space-y-0.5">
            <p class="text-sm font-medium">
              Airbnb
            </p>
            <p class="text-xs text-muted-foreground">
              30 days to reply after review goes live
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="config.auto_post_replies.airbnb"
          class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          :class="config.auto_post_replies.airbnb ? 'bg-primary' : 'bg-input'"
          @click="handleReplyChannelToggle('airbnb', !config.auto_post_replies.airbnb)"
        >
          <span
            class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
            :class="config.auto_post_replies.airbnb ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- Booking.com reply -->
      <div class="flex items-center justify-between rounded-lg border bg-card p-4">
        <div class="flex items-center gap-3">
          <Icon name="simple-icons:bookingdotcom" class="size-5" />
          <div class="space-y-0.5">
            <p class="text-sm font-medium">
              Booking.com
            </p>
            <p class="text-xs text-muted-foreground">
              30 days to reply via management response
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="config.auto_post_replies.booking_com"
          class="peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          :class="config.auto_post_replies.booking_com ? 'bg-primary' : 'bg-input'"
          @click="handleReplyChannelToggle('booking_com', !config.auto_post_replies.booking_com)"
        >
          <span
            class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform"
            :class="config.auto_post_replies.booking_com ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- Reply delay -->
      <div v-if="config.auto_post_replies.airbnb || config.auto_post_replies.booking_com" class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Reply Delay</Label>
          <p class="text-xs text-muted-foreground">
            Days to wait after review is detected before auto-posting the reply. Use 0 for immediate.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NumberField
            :model-value="config.reply_delay_days"
            :min="0"
            :max="30"
            class="w-[140px]"
            @update:model-value="handleReplyDelayUpdate"
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

      <!-- Review Generation Delay (shared) -->
      <div class="space-y-3">
        <div class="space-y-1">
          <Label class="text-sm font-medium">Generation Delay</Label>
          <p class="text-xs text-muted-foreground">
            Hours after checkout before generating reviews. Allows time for housekeeping feedback.
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
