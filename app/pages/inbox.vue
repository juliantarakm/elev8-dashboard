<script setup lang="ts">
const { showActionNeeded, unreadFilter, assignedToMeFilter, activeStayFilter } = useInbox()

onMounted(() => {
  showActionNeeded.value = false
  unreadFilter.value = false
  assignedToMeFilter.value = false
  activeStayFilter.value = 'all'

  // Clean up any orphaned elements from SSR hydration
  nextTick(() => {
    const keepIds = new Set(['__nuxt', 'teleports', '__NUXT_DATA__', 'vue-tracer-overlay', 'nuxt-devtools-container'])
    const keepTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'NUXT-DEVTOOLS-INSPECT-PANEL'])
    Array.from(document.body.children).forEach(el => {
      if (keepIds.has(el.id) || keepTags.has(el.tagName)) return
      el.remove()
    })
  })
})
</script>

<template>
  <div class="-m-4 lg:-m-6 h-[calc(100dvh-6.5rem)] overflow-hidden">
    <InboxLayout
      :default-layout="[18, 25, 42, 15]"
      :default-collapsed="false"
      :nav-collapsed-size="4"
    />
  </div>
</template>