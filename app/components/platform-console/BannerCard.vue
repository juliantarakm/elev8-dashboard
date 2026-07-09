<script setup lang="ts">
import { Icon } from '#components'
import { Button } from '~/components/ui/button'
import type { PlatformBanner } from './data/banners'

const props = defineProps<{
  banner: PlatformBanner
  onDismiss?: () => void
}>()

const toneClass = computed(() => {
  if (props.banner.severity === 'critical') return 'border-destructive/30 bg-destructive/5 text-destructive'
  if (props.banner.severity === 'warning') return 'border-amber-300 bg-amber-50 text-amber-900'
  return 'border-primary/20 bg-primary/5 text-foreground'
})

const iconName = computed(() => {
  if (props.banner.severity === 'critical') return 'lucide:octagon-alert'
  if (props.banner.severity === 'warning') return 'lucide:triangle-alert'
  return 'lucide:info'
})

function openCta() {
  if (props.banner.ctaUrl) window.open(props.banner.ctaUrl, '_blank', 'noopener')
}
</script>

<template>
  <div :class="['flex items-start gap-3 rounded-md border p-4', toneClass]">
    <Icon :name="iconName" class="size-5 mt-0.5 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="font-medium">{{ banner.title }}</div>
        <button
          v-if="banner.dismissible && onDismiss"
          type="button"
          class="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss banner"
          @click="onDismiss"
        >
          <Icon name="lucide:x" class="size-4" />
        </button>
      </div>
      <p class="mt-1 text-sm">{{ banner.body }}</p>
      <Button v-if="banner.ctaLabel" variant="link" size="sm" class="px-0 mt-2 h-auto" @click="openCta">
        {{ banner.ctaLabel }} →
      </Button>
    </div>
  </div>
</template>