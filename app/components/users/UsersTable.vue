<!-- app/components/users/UsersTable.vue -->
<script setup lang="ts">
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useUsers } from '~/composables/useUsers'
import { useRoles } from '~/composables/useRoles'
import { listings } from '~/components/listings/data/listings'
import type { User } from '~/components/users/data/users'

const emit = defineEmits<{
  edit: [user: User]
}>()

const { users, toggleActive, deleteUser } = useUsers()
const { roles, getRole } = useRoles()

// Listings as {id, name} objects — used for the "All listings" filter dropdown
// and per-row assignment chips. `User.listingIds` holds Listing.id values (e.g. 'lst-1'),
// so we map through `listings` (the ref<Listing[]>) rather than `allProperties`
// (a ComputRef<string[]> of unique property names).
const allListingOptions = computed(() =>
  listings.value.map(l => ({ id: l.id, name: l.name })),
)

// Filters
const search = ref('')
const roleFilter = ref<string>('all')
const listingFilter = ref<string>('all')
const statusFilter = ref<string>('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const options = allListingOptions.value
  const optionById = new Map(options.map(o => [o.id, o]))
  return users.value
    .filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      if (roleFilter.value !== 'all' && u.roleId !== roleFilter.value) return false
      if (listingFilter.value !== 'all' && !u.listingIds.includes(listingFilter.value)) return false
      if (statusFilter.value !== 'all' && u.status !== statusFilter.value) return false
      return true
    })
    .map((u) => {
      const listingNames: { name: string, id: string }[] = []
      for (const id of u.listingIds) {
        const o = optionById.get(id)
        if (o) listingNames.push({ name: o.name, id: o.id })
      }
      return { user: u, listingNames }
    })
})

function handleDelete(user: User) {
  if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
    deleteUser(user.id)
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-48 max-w-sm">
        <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="search" placeholder="Search by name or email..." class="pl-8" />
      </div>

      <Select v-model="roleFilter">
        <SelectTrigger class="w-44">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All roles
          </SelectItem>
          <SelectItem v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="listingFilter">
        <SelectTrigger class="w-44">
          <SelectValue placeholder="Listing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All listings
          </SelectItem>
          <SelectItem v-for="p in allListingOptions" :key="p.id" :value="p.id">
            {{ p.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="statusFilter">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            All status
          </SelectItem>
          <SelectItem value="active">
            Active
          </SelectItem>
          <SelectItem value="inactive">
            Inactive
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <div class="rounded-md border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th class="text-left font-medium px-4 py-3">
              User
            </th>
            <th class="text-left font-medium px-4 py-3">
              Role
            </th>
            <th class="text-left font-medium px-4 py-3">
              Listings
            </th>
            <th class="text-left font-medium px-4 py-3">
              Status
            </th>
            <th class="text-right font-medium px-4 py-3 w-12">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="{ user: u, listingNames } in filtered"
            :key="u.id"
            class="border-t hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <Avatar class="size-9">
                  <AvatarFallback class="bg-primary/10 text-primary text-xs">
                    {{ u.initials }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0">
                  <div class="font-medium truncate">
                    {{ u.name }}
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ u.email }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-4 py-3">
              <Badge variant="secondary">
                {{ getRole(u.roleId)?.name ?? 'Unknown' }}
              </Badge>
            </td>

            <td class="px-4 py-3">
              <div v-if="u.listingIds.length === 0" class="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
                <Icon name="lucide:globe" class="size-3" />
                All listings
              </div>
              <div v-else class="flex flex-wrap gap-1">
                <Badge
                  v-for="(p, i) in listingNames.slice(0, 2)"
                  :key="p.id"
                  variant="outline"
                  class="text-xs"
                >
                  {{ p.name }}
                </Badge>
                <Badge v-if="listingNames.length > 2" variant="outline" class="text-xs">
                  +{{ listingNames.length - 2 }}
                </Badge>
              </div>
            </td>

            <td class="px-4 py-3">
              <Switch
                :model-value="u.status === 'active'"
                @update:model-value="() => toggleActive(u.id)"
              />
            </td>

            <td class="px-4 py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8">
                    <Icon name="lucide:more-horizontal" class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('edit', u)">
                    <Icon name="lucide:pencil" class="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="toggleActive(u.id)">
                    <Icon :name="u.status === 'active' ? 'lucide:user-x' : 'lucide:user-check'" class="mr-2 size-4" />
                    {{ u.status === 'active' ? 'Deactivate' : 'Activate' }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @click="handleDelete(u)">
                    <Icon name="lucide:trash-2" class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>

          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-muted-foreground">
              <div class="flex flex-col items-center gap-2">
                <Icon name="lucide:users-round" class="size-8 opacity-50" />
                <p v-if="users.length === 0">
                  No users yet — add your first team member.
                </p>
                <p v-else>
                  No users match your filters.
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="text-xs text-muted-foreground">
      Showing {{ filtered.length }} of {{ users.length }} users
    </div>
  </div>
</template>
