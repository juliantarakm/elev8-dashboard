<script setup lang="ts">
import { useSidebar } from '~/components/ui/sidebar'

const route = useRoute()

onMounted(() => {
  const { setOpen } = useSidebar()
  if (route.path.startsWith('/inbox')) {
    setOpen(false)
  }
})
</script>

<template>
  <SidebarProvider :default-open="false">
    <LayoutAppSidebar />
    <SidebarInset>
      <LayoutHeader />
      <div class="flex flex-col flex-1">
        <div class="@container/main p-4 lg:p-6 grow">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>

</style>
