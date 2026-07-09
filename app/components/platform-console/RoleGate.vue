<script setup lang="ts">
import type { PermissionAction, StaffRole } from './data/staff'

const props = defineProps<{
  action?: PermissionAction
  role?: StaffRole
}>()

const { currentRole, can } = useStaffAuth()

const allowed = computed(() => {
  if (props.role) return currentRole.value === props.role
  if (props.action) return can(props.action)
  return true
})
</script>

<template>
  <slot v-if="allowed" />
</template>