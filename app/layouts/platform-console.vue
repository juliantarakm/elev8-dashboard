<template>
  <SidebarProvider :default-open="false">
    <LayoutAppSidebar />
    <SidebarInset class="overflow-hidden">
      <LayoutHeader />
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div class="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
          <div class="flex items-center gap-2 text-sm">
            <Icon name="lucide:layers" class="size-4 text-primary" />
            <span class="font-medium">Platform Console</span>
          </div>
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