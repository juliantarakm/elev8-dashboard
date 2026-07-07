<script setup lang="ts">
import { Icon } from '#components'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { Check } from 'lucide-vue-next'
import type { StaffRole } from './data/staff'
import { STAFF_ROLE_LABELS } from './data/staff'

const { currentRole, setRole } = useStaffAuth()
const open = ref(false)

const roles: StaffRole[] = ['viewer', 'finance', 'approver', 'admin']

function pick(role: StaffRole) {
  setRole(role)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="sm" class="gap-2">
        <Icon icon="lucide:shield" class="size-4 text-primary" />
        <span class="text-sm font-medium">{{ STAFF_ROLE_LABELS[currentRole] }}</span>
        <Icon icon="lucide:chevron-down" class="size-3.5 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-56 p-1">
      <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Switch role
      </div>
      <button
        v-for="r in roles"
        :key="r"
        type="button"
        class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
        :class="currentRole === r && 'bg-muted'"
        @click="pick(r)"
      >
        <span>{{ STAFF_ROLE_LABELS[r] }}</span>
        <Check v-if="currentRole === r" class="size-4 text-primary" />
      </button>
    </PopoverContent>
  </Popover>
</template>