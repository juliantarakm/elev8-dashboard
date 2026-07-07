<script setup lang="ts">
import { STAFF_USERS } from '~/components/platform-console/data/staff'

definePageMeta({ layout: 'platform-console' })
const { currentRole } = useStaffAuth()
</script>

<template>
  <div class="space-y-4 p-6">
    <div>
      <h2 class="text-2xl font-semibold">Platform Console roles</h2>
      <p class="text-sm text-muted-foreground">Assign staff members to Platform Console roles. Currently acting as: <strong>{{ currentRole }}</strong></p>
    </div>
    <div class="rounded-md border bg-card divide-y">
      <div v-for="s in STAFF_USERS" :key="s.id" class="flex items-center justify-between p-4">
        <div>
          <div class="text-sm font-medium">{{ s.name }}</div>
          <div class="text-xs text-muted-foreground">{{ s.label }}</div>
        </div>
        <select :value="s.role" class="rounded-md border bg-background px-2 py-1 text-sm">
          <option value="viewer">Platform Viewer</option>
          <option value="finance">Platform Finance</option>
          <option value="approver">Platform Approver</option>
          <option value="admin">Platform Admin</option>
        </select>
      </div>
    </div>
  </div>
</template>