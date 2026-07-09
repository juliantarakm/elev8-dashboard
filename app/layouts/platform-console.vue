<script setup lang="ts">
import { platformConsoleNavMenu, platformConsoleNavMenuBottom } from '~/constants/menus'
</script>

<template>
  <SidebarProvider :default-open="false">
    <LayoutAppSidebar
      :menu="platformConsoleNavMenu"
      :menu-bottom="platformConsoleNavMenuBottom"
      :show-search="false"
      :show-teams="false"
    />
    <SidebarInset class="overflow-hidden">
      <LayoutHeader />
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex items-center justify-end border-b bg-muted/30 px-4 py-2">
          <PlatformConsoleRoleSwitcher />
        </div>
        <PlatformConsoleBannerSlot />
        <div class="@container/main p-4 lg:p-6 grow min-h-0">
          <slot />
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>