<script setup lang="ts">
import { cn } from '@/lib/utils'
import { useSidebar } from '~/components/ui/sidebar'
import { useTenantBranding } from '~/composables/useTenantBranding'

const props = defineProps<{
  teams: {
    name: string
    logo: string
    plan: string
  }[]
}>()

const { isMobile } = useSidebar()
const { branding } = useTenantBranding()

const activeTeam = ref(props.teams[0])
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              :class="cn(
                'aspect-square size-8 flex items-center justify-center rounded-lg',
                branding.primaryLogo
                  ? 'border bg-background p-1'
                  : 'bg-sidebar-primary text-sidebar-primary-foreground',
              )"
            >
              <img
                v-if="branding.primaryLogo"
                data-testid="sidebar-brand-logo"
                :src="branding.primaryLogo.dataUrl"
                alt="Tenant primary logo"
                class="max-h-full max-w-full object-contain"
              >
              <Icon v-else :name="activeTeam!.logo" class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">
                {{ activeTeam!.name }}
              </span>
              <span class="truncate text-xs">{{ activeTeam!.plan }}</span>
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Teams
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(team, index) in teams"
            :key="team.name"
            class="gap-2 p-2"
            @click="activeTeam = team"
          >
            <div class="size-6 flex items-center justify-center border rounded-sm">
              <Icon :name="team.logo" class="size-4 shrink-0" />
            </div>
            {{ team.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2">
            <div class="size-6 flex items-center justify-center border rounded-md bg-background">
              <Icon name="i-lucide-plus" class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">
              Add team
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<style scoped>

</style>
