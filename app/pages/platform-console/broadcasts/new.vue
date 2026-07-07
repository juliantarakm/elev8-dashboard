<script setup lang="ts">
import { Button } from '~/components/ui/button'

definePageMeta({ layout: 'platform-console' })

const router = useRouter()
</script>

<template>
  <div>
    <div class="flex items-center justify-between border-b bg-card px-6 py-4">
      <h2 class="text-2xl font-semibold">New banner</h2>
      <Button variant="ghost" size="sm" @click="router.push('/platform-console/broadcasts')">
        ← Back to list
      </Button>
    </div>
    <BannerComposer @published="router.push('/platform-console/broadcasts')" />
  </div>
</template>