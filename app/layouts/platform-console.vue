<template>
  <div class="flex h-screen bg-background">
    <PlatformConsoleStaffSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <PlatformConsoleStaffHeader />
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>