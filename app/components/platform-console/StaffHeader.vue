<script setup lang="ts">
import { Icon } from '#components'
import { Button } from '~/components/ui/button'
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b bg-background px-4">
    <div class="flex items-center gap-3">
      <h1 class="text-sm font-semibold">Elev8 · Platform Console</h1>
    </div>
    <div class="flex items-center gap-2">
      <PlatformConsoleRoleSwitcher />
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Icon name="lucide:bell" class="size-4" />
      </Button>
    </div>
  </header>
</template>