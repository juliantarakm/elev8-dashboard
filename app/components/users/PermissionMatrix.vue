<!-- app/components/users/PermissionMatrix.vue -->
<script setup lang="ts">
import type { ModulePermissions, PermissionModule } from '~/components/users/data/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { PERMISSION_MODULES } from '~/components/users/data/permissions'

interface Props {
  permissions: Record<PermissionModule, ModulePermissions>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), { readonly: false })

const emit = defineEmits<{
  'update:permissions': [value: Record<PermissionModule, ModulePermissions>]
}>()

function toggle(module: PermissionModule, key: keyof ModulePermissions) {
  if (props.readonly)
    return
  const next = { ...props.permissions }
  next[module] = { ...next[module], [key]: !next[module][key] }
  emit('update:permissions', next)
}

function isChecked(module: PermissionModule, key: keyof ModulePermissions): boolean {
  return props.permissions[module]?.[key] ?? false
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-base">
        Permissions
      </CardTitle>
      <p class="text-xs text-muted-foreground">
        Configure which modules this role can view or edit in the dashboard. Mobile app permissions are coming soon.
      </p>
    </CardHeader>
    <CardContent class="p-0">
      <TooltipProvider>
        <div class="border-y">
          <!-- Header row -->
          <div class="grid grid-cols-[1fr_80px_80px_80px_80px] text-xs font-medium text-muted-foreground px-4 py-2 border-b bg-muted/30">
            <div>Module</div>
            <div class="text-center">
              Dashboard
              <div class="text-[10px] font-normal">
                View
              </div>
            </div>
            <div class="text-center">
              Dashboard
              <div class="text-[10px] font-normal">
                Edit
              </div>
            </div>
            <div class="text-center">
              Mobile
              <div class="text-[10px] font-normal">
                View
              </div>
            </div>
            <div class="text-center">
              Mobile
              <div class="text-[10px] font-normal">
                Edit
              </div>
            </div>
          </div>

          <!-- Module rows -->
          <div
            v-for="m in PERMISSION_MODULES"
            :key="m.id"
            class="grid grid-cols-[1fr_80px_80px_80px_80px] items-center px-4 py-2 border-b last:border-b-0 hover:bg-muted/20"
          >
            <div class="text-sm">
              {{ m.label }}
            </div>

            <!-- Dashboard View -->
            <div class="flex justify-center">
              <button
                type="button"
                :aria-label="`${m.label} dashboard view`"
                :aria-pressed="isChecked(m.id, 'dashboardView')"
                :disabled="readonly"
                class="flex size-5 items-center justify-center rounded border transition-colors"
                :class="isChecked(m.id, 'dashboardView')
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'"
                @click="toggle(m.id, 'dashboardView')"
              >
                <Icon v-if="isChecked(m.id, 'dashboardView')" name="lucide:check" class="size-3" />
              </button>
            </div>

            <!-- Dashboard Edit -->
            <div class="flex justify-center">
              <button
                type="button"
                :aria-label="`${m.label} dashboard edit`"
                :aria-pressed="isChecked(m.id, 'dashboardEdit')"
                :disabled="readonly"
                class="flex size-5 items-center justify-center rounded border transition-colors"
                :class="isChecked(m.id, 'dashboardEdit')
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-muted'"
                @click="toggle(m.id, 'dashboardEdit')"
              >
                <Icon v-if="isChecked(m.id, 'dashboardEdit')" name="lucide:check" class="size-3" />
              </button>
            </div>

            <!-- Mobile View (locked) -->
            <div class="flex justify-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    :aria-label="`${m.label} mobile view (coming soon)`"
                    disabled
                    class="flex size-5 items-center justify-center rounded border border-muted-foreground/30 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Icon name="lucide:lock" class="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile app coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <!-- Mobile Edit (locked) -->
            <div class="flex justify-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    :aria-label="`${m.label} mobile edit (coming soon)`"
                    disabled
                    class="flex size-5 items-center justify-center rounded border border-muted-foreground/30 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Icon name="lucide:lock" class="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile app coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </CardContent>
  </Card>
</template>
