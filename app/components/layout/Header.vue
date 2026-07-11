<script setup lang="ts">
</script>

<template>
  <header class="sticky top-0 md:peer-data-[variant=inset]:top-2 z-10 h-(--header-height) flex items-center gap-4 border-b bg-background px-4 md:px-6 md:rounded-tl-xl md:rounded-tr-xl">
    <SidebarTrigger />
    <div class="ml-auto flex items-center gap-1">
      <LayoutLanguageSelector />
      <NotificationsNotificationCenter />
      <ElevAIButton />
      <LayoutHeaderUserMenu />
    </div>
  </header>
</template>
