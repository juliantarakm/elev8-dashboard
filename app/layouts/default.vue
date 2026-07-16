<script setup lang="ts">
</script>

<template>
  <SidebarProvider :default-open="false">
    <LayoutAppSidebar />
    <SidebarInset class="overflow-hidden">
      <LayoutHeader />
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <PlatformConsoleBannerSlot />
        <div class="@container/main p-4 lg:p-6 grow min-h-0">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  <ElevAIPanel />
</template>

<style scoped>

</style>
