<script setup lang="ts">
import GuideEditor from '~/components/guest-guides/editor/GuideEditor.vue'

const route = useRoute()
const guideId = computed(() => route.params.id as string)
</script>

<template>
  <div class="flex h-screen flex-col">
    <div class="flex items-center gap-2 border-b p-4 text-sm text-muted-foreground">
      <NuxtLink to="/guest-guides" class="hover:underline">
        Guest Guides
      </NuxtLink>
      <span>/</span>
      <span class="text-foreground">Editor</span>
    </div>
    <GuideEditor :guide-id="guideId" class="flex-1 overflow-hidden" />
  </div>
</template>