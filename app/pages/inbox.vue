<script setup lang="ts">
const { showActionNeeded, unreadFilter, assignedToMeFilter, activeStayFilter } = useInbox()

onMounted(() => {
  showActionNeeded.value = false
  unreadFilter.value = false
  assignedToMeFilter.value = false
  activeStayFilter.value = 'all'
})
</script>

<template>
  <div class="-m-4 lg:-m-6 h-[calc(100dvh-6.5rem)] overflow-hidden">
    <ClientOnly>
      <InboxLayout
        :default-layout="[18, 25, 42, 15]"
        :default-collapsed="false"
        :nav-collapsed-size="4"
      />
    </ClientOnly>
  </div>
</template>
