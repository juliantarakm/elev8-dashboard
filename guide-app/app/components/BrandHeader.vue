<script setup lang="ts">
import type { PublicGuestGuideBranding } from '~/../app/components/settings/data/branding'

defineProps<{ branding: PublicGuestGuideBranding }>()
</script>

<template>
  <div
    v-if="branding.primaryLogo"
    data-testid="guest-guide-brand-header"
    class="mb-4 flex min-h-14 items-center rounded-xl border bg-card px-4 py-3"
  >
    <img
      data-testid="guest-guide-brand-logo"
      :src="branding.primaryLogo.dataUrl"
      alt="Property manager logo"
      class="max-h-10 max-w-48 object-contain"
    >
  </div>
</template>
