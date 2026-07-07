<script setup lang="ts">
import { Icon } from '#components'

const navItems = [
  { to: '/platform-console/tenants', label: 'Tenants', icon: 'lucide:building-2' },
  { to: '/platform-console/broadcasts', label: 'Broadcasts', icon: 'lucide:megaphone' },
  { to: '/platform-console/approvals', label: 'Approvals', icon: 'lucide:check-circle' },
  { to: '/platform-console/audit', label: 'Audit log', icon: 'lucide:file-clock' },
  { to: '/platform-console/settings', label: 'Settings', icon: 'lucide:settings' },
]
</script>

<template>
  <aside class="flex h-full w-60 flex-col border-r bg-card">
    <div class="flex h-14 items-center gap-2 border-b px-4">
      <Icon name="lucide:layers" class="size-5 text-primary" />
      <span class="text-sm font-semibold">Platform Console</span>
    </div>
    <nav class="flex-1 space-y-1 p-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        active-class="bg-primary/10 text-primary"
      >
        <Icon :name="item.icon" class="size-4" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
    <div class="border-t p-3">
      <NuxtLink to="/" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <Icon name="lucide:arrow-left" class="size-3.5" />
        <span>Back to tenant dashboard</span>
      </NuxtLink>
    </div>
  </aside>
</template>