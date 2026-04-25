<script setup lang="ts">
import { conversations } from '~/components/inbox/data/conversations'
</script>

<template>
  <div class="-m-4 lg:-m-6">
    <InboxLayout
      :default-layout="[18, 25, 42, 15]"
      :default-collapsed="false"
      :nav-collapsed-size="4"
    />
  </div>
</template>