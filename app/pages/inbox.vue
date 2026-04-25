<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'

const { setOpen } = useSidebar()

onMounted(() => {
  setOpen(false)
})
</script>

<template>
  <div class="-m-4 lg:-m-6 h-[calc(100dvh-6.5rem)]">
    <InboxLayout
      :default-layout="[18, 25, 42, 15]"
      :default-collapsed="false"
      :nav-collapsed-size="4"
    />
  </div>
</template>