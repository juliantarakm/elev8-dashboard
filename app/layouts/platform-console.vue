<template>
  <div class="flex h-screen bg-background">
    <StaffSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <StaffHeader />
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>