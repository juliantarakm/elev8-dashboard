<script setup lang="ts">
const { showActionNeeded, unreadFilter, assignedToMeFilter, activeStayFilter } = useInbox()

onMounted(() => {
  showActionNeeded.value = false
  unreadFilter.value = false
  assignedToMeFilter.value = false
  activeStayFilter.value = 'all'

  // Clean up orphaned elements from SSR hydration
  nextTick(() => {
    // Remove body-level orphans
    const keepIds = new Set(['__nuxt', 'teleports', '__NUXT_DATA__', 'vue-tracer-overlay', 'nuxt-devtools-container'])
    const keepTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'NUXT-DEVTOOLS-INSPECT-PANEL'])
    Array.from(document.body.children).forEach(el => {
      if (keepIds.has(el.id) || keepTags.has(el.tagName)) return
      el.remove()
    })
    // Remove orphans inside #__nuxt that are siblings of #app
    const nuxtEl = document.getElementById('__nuxt')
    if (nuxtEl) {
      Array.from(nuxtEl.children).forEach(el => {
        if (el.id === 'app' || el.tagName === 'SCRIPT' || el.tagName === 'SECTION' || el.id === 'teleports') return
        el.remove()
      })
    }
    // Remove orphans inside #app that are siblings of sidebar-wrapper
    const appEl = document.getElementById('app')
    if (appEl) {
      Array.from(appEl.children).forEach(el => {
        if (el.getAttribute('data-slot') === 'sidebar-wrapper' || el.getAttribute('data-slot') === 'sheet-trigger') return
        if (el.tagName === 'SCRIPT') return
        el.remove()
      })
    }
    // Fix SSR-wrapped list items that got tooltip-trigger attribute
    document.querySelectorAll('[data-slot="scroll-area-viewport"] > div > div > button[data-slot="tooltip-trigger"]').forEach(btn => {
      btn.removeAttribute('data-slot')
      btn.removeAttribute('data-state')
      btn.removeAttribute('data-grace-area-trigger')
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